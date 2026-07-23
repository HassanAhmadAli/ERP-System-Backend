# Plan: Add Arabic (ar) Language Support

## Status quo

`nestjs-i18n` v10.x is declared in `package.json` but **never imported, configured, or used**. All user-facing strings (~250+) are hardcoded English in services, exceptions, Zod schemas, notifications, and Swagger decorators. No language detection exists.

---

## Phase 1 — i18n infrastructure

### 1.1 Create translation file structure

```
src/i18n/
  en/
    responses.json       # success/status messages returned as { message }
    errors.json          # HTTP exception messages
    validation.json      # Zod custom error messages
    notifications.json   # email/push notification titles + bodies
    reports.json         # report metric labels
    swagger.json         # Swagger descriptions & tags
  ar/
    responses.json
    errors.json
    validation.json
    notifications.json
    reports.json
    swagger.json
```

Block keys by domain rather than by file. Example `errors.json`:

```json
{
  "auth": {
    "emailAlreadyExists": "Email Already registered",
    "userDoesNotExist": "User Does not Exist",
    "passwordIncorrect": "Password does not match",
    "invalidCredentials": "Invalid credentials for this account type",
    "emailNotVerified": "Please verify your email before logging in.",
    "refreshTokenExpired": "Refresh Token Expired",
    "userAlreadyVerified": "User is already verified",
    "invalidVerificationCode": "Invalid verification code",
    "verificationCodeExpired": "Verification code has expired"
  },
  "product": {
    "barcodeExists": "Product with barcode {{barcode}} already exists",
    "cannotDeleteWithOrders": "Cannot delete product that has been sold or is in active orders"
  }
}
```

Arabic files mirror the same keys with translated values.

### 1.2 Register `I18nModule` in `AppModule`

```typescript
// src/app.module.ts
import { AcceptLanguageResolver, I18nModule, QueryResolver } from "nestjs-i18n";
import path from "node:path";

// in imports[]:
I18nModule.forRoot({
  fallbackLanguage: "en",
  fallbacks: { "en-*": "en", "ar-*": "ar" },
  loaderOptions: {
    path: path.join(__dirname, "../i18n"),
    watch: true,
  },
  resolvers: [
    { use: QueryResolver, options: ["lang"] },
    AcceptLanguageResolver,
  ],
  typesOutputPath: path.join(__dirname, "../i18n/i18n.generated.ts"),
}),
```

**Resolver order**: query param `?lang=ar` → `Accept-Language` header → `en` fallback.

### 1.3 Generate type-safe translation keys

Set `typesOutputPath` so the compiler produces `src/i18n/i18n.generated.ts`. Import `I18nTranslations` type for DI-safe `I18nService<I18nTranslations>`.

---

## Phase 2 — Extract and translate strings

### 2.1 Centralized error messages (`src/common/const.ts`)

Replace the hardcoded `ErrorMessages` object with i18n calls. Two approaches:

**A) Service-level (preferred)**: Remove the `ErrorMessages` const. Each caller injects `I18nService` and calls `this.i18n.t('errors.auth.emailAlreadyExists')`.

**B) Wrapper helper**: Create `src/common/i18n-keys.ts`:

```typescript
export const I18nKeys = {
  EMAIL_ALREADY_EXIST: "errors.auth.emailAlreadyExists",
  USER_DOES_NOT_EXIST: "errors.auth.userDoesNotExist",
  // ...
} as const;
```

Then use `i18n.t(I18nKeys.EMAIL_ALREADY_EXIST)` wherever needed. Keeps the key constant pattern used today.

### 2.2 Service response messages

Every service that returns `{ message: "..." }` should call `i18n.t()` instead. For messages with dynamic data, use i18n interpolation:

```typescript
this.i leadingI18n.t("responses.product.deleted", { args: { id } });
```

Translation JSON uses `{{variable}}` syntax:

```json
{ "product": { "deleted": "Product with ID {{id}} has been deleted successfully" } }
```

### 2.3 HTTP exception messages

Replace hardcoded strings in `throw new BadRequestException("...")` with `i18n.t()`:

```typescript
throw new BadRequestException(this.i18n.t("errors.product.barcodeExists", { args: { barcode } }));
```

### 2.4 Zod validation messages

`nestjs-zod` does **not** integrate with `nestjs-i18n` out of the box. Options:

- **Recommended**: Use `z.string().min(2, { message: i18n.t("validation.stringMin", { args: { min: 2 } }) })`. This requires i18n service available at schema-definition time. Move DTOs from static schemas to factory functions, or …
- **Accept**: Leave Zod messages in English for now — they are developer-oriented and the frontend can override them. Highest ROI is service/exception messages.

For the 8 custom `.refine()` / `.superRefine()` messages (discount, loyalty, notification DTOs), replace with `I18nTranslations` keys via a lookup object.

### 2.5 Notification & email content

Inject `I18nService` into `MailerService` and the notification send flow. Translate titles and bodies. For the notification consumer that sends emails, resolve locale from the recipient user's stored preference (see Phase 3).

### 2.6 Report metric labels

`src/report/report-export.service.ts` returns labels like `"Revenue"`, `"Gross Profit"`, etc. Translate via `i18n.t("reports.metrics.revenue")` in the export pipeline.

### 2.7 Swagger descriptions

Swagger decorators (`@DocumentOperation`, `@DocumentOkResponse`, API tags) use static strings. These are **development-time** values that cannot be dynamic per-request. Options:

- Leave English as the API documentation language (common practice).
- Generate separate Swagger docs per locale (adds complexity).
- Low priority — users interact with the API docs in one language.

**Decision**: Skip Swagger string translation for now. Document this as a known limitation.

---

## Phase 3 — Language detection & persistence

### 3.1 Current detection

- Query param `?lang=ar` (via `QueryResolver`)
- `Accept-Language` header (via `AcceptLanguageResolver`)

### 3.2 User language preference

Add a `language` column to the `User` model in `prisma/schema.prisma`:

```prisma
model User {
  // ...existing fields
  language String @default("en")  // "en" or "ar"
}
```

Create a migration. Set the language on signup (from `Accept-Language`). Allow update via profile endpoint.

### 3.3 Custom resolver

Write a custom `I18nResolver` that reads `req.user.language` after authentication. This is the most reliable source:

```typescript
@Injectable()
export class UserLanguageResolver implements I18nResolver {
  resolve(context: ExecutionContext): string | undefined {
    const req = context.switchToHttp().getRequest();
    return req.user?.language;
  }
}
```

Add it as the highest-priority resolver. Chain: user preference → query param → Accept-Language → fallback.

### 3.4 I18n in notifications

When sending a notification to a user, look up their `language` field from the DB and pass it as the locale argument to `i18n.t()`.

---

## Phase 4 — Error response format

### 4.1 Current format

```json
{ "message": "Product with barcode XYZ already exists", "statusCode": 409 }
```

### 4.2 Desired format

```json
{
  "message": "المنتج ذو الرمز الشريطي XYZ موجود بالفعل",
  "statusCode": 409,
  "messageKey": "errors.product.barcodeExists"
}
```

The `messageKey` field allows the frontend to look up its own translations if needed. Achieve this by modifying `GlobalExceptionFilter` → `HttpExceptionFilter` to include the i18n key when available.

### 4.3 Zod validation errors

`nestjs-zod` returns `ZodError` with an array of issues. Each issue contains the `message` and `path`. To localize these, override the `ZodValidationPipe` or post-process the filter to wrap messages through `i18n.t()`. Recommended: add an `I18nZodErrorFilter` in the exception filter chain.

---

## Phase 5 — Migration strategy

Do **not** do a big bang replace. Use this order:

| Step                                                | Effort | Risk   | Value                  |
| --------------------------------------------------- | ------ | ------ | ---------------------- |
| 5.1 Register `I18nModule`, create empty `en/` files | Small  | Low    | Unlocks everything     |
| 5.2 Populate `en/` files by extracting all strings  | Medium | Low    | Single source of truth |
| 5.3 Write `ar/` translation files                   | Large  | Low    | Needs translator       |
| 5.4 Migrate `const.ts` ErrorMessages + auth service | Small  | Medium | Affects login flow     |
| 5.5 Migrate product/category/supplier services      | Small  | Medium | CRUD messages          |
| 5.6 Migrate discount/order/sales/purchase services  | Medium | Medium | Complex logic          |
| 5.7 Migrate Zod custom messages                     | Small  | Low    | 8 .refine() calls      |
| 5.8 Migrate notification/email content              | Small  | Low    | ~8 strings             |
| 5.9 Migrate report labels                           | Small  | Low    | ~12 strings            |
| 5.10 Add user language preference + custom resolver | Medium | Low    | Core feature           |
| 5.11 Add `messageKey` to error responses            | Small  | Low    | Frontend aid           |

**Total estimated effort**: 3–5 days for a single developer with Arabic proficiency.

---

## Phase 6 — Testing

- Unit test that `I18nService` resolves correctly with each resolver (query, header, user).
- Unit test that all service methods return translated strings for `en` and `ar`.
- Unit test that exception filters include `messageKey`.
- E2E test: `GET /health` with `Accept-Language: ar` header and verify response locale.

---

## RTL / Frontend considerations

This plan covers **backend API localization only**. The frontend (mobile app / dashboard) must handle:

- CSS `direction: rtl` for Arabic layouts
- BiDi text mixing
- Date/number formatting in Arabic locale
- Separate API calls with `?lang=ar` or appropriate `Accept-Language` header

These are outside the backend scope but must be coordinated.

---

## Open decisions

| Question                                 | Options                                    | Recommendation                                                  |
| ---------------------------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| Zod auto-generated messages localization | Leave as-is / post-process                 | Post-process in exception filter (low effort, high consistency) |
| Swagger descriptions localization        | Leave English / generate per locale        | Leave English for now                                           |
| Translation file format                  | JSON / YAML / PO                           | JSON (native NestJS i18n support, no extra deps)                |
| Translation management                   | Manual `.json` edits / POEditor / Lokalise | Start manual, evaluate when strings exceed 500                  |
| `messageKey` in responses                | Include / skip                             | Include (helps frontend)                                        |
