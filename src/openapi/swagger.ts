import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { AuthTokensDto, HealthResponseDto, MessageResponseDto } from "./dto/responses.dto";

const API_TAGS = [
  "Authentication",
  "Users",
  "Customer",
  "Products",
  "Product Photos",
  "Categories",
  "Suppliers",
  "Discounts",
  "Sales",
  "Orders",
  "Purchases",
  "Expenses",
  "Reports",
  "Financial",
  "Loyalty Rewards",
  "Notifications",
  "Advertisements",
  "Audit Logs",
  "Backup",
  "Health",
] as const;

export const generateSwaggerDocumentation = (app: INestApplication) => {
  const builder = new DocumentBuilder()
    .setTitle("ERP Store API")
    .setDescription(
      "Store management API for dashboard and mobile clients. " +
        "Use role-specific sign-in endpoints, then authorize requests with the returned Bearer access token. " +
        "Request and query shapes are generated from Zod DTOs — use Try it out with the provided examples.",
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Paste the access_token from a sign-in response",
      },
      "bearer",
    );

  for (const tag of API_TAGS) {
    builder.addTag(tag);
  }

  const openApiDoc = SwaggerModule.createDocument(app, builder.build(), {
    extraModels: [AuthTokensDto, MessageResponseDto, HealthResponseDto],
  });

  SwaggerModule.setup("doc", app, cleanupOpenApiDoc(openApiDoc), {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "list",
      filter: true,
      showRequestDuration: true,
    },
  });
};
