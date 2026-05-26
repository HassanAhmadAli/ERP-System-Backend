import { applyDecorators, Type } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse } from "@nestjs/swagger";
export function ApiStandardErrors() {
  return applyDecorators(
    ApiResponse({ status: 400, description: "Validation failed" }),
    ApiResponse({ status: 401, description: "Missing or invalid access token" }),
    ApiResponse({ status: 403, description: "Insufficient permissions" }),
    ApiResponse({ status: 404, description: "Resource not found" }),
  );
}

/** Protected routes (default for the API). */
export function ApiAuth() {
  return applyDecorators(ApiBearerAuth(), ApiStandardErrors());
}

export function ApiPublicEndpoint() {
  return applyDecorators(ApiStandardErrors());
}

export function DocumentBody<T>(dto: Type<T>) {
  return ApiBody({ type: dto });
}

export function DocumentParam(
  name: string,
  description: string,
  schema: { type: "integer" | "string" } = { type: "integer" },
) {
  return ApiParam({ name, description, schema });
}

export function DocumentOperation(summary: string, description?: string) {
  return ApiOperation({ summary, description });
}

export function DocumentOkResponse(description: string, type?: Type<unknown>) {
  return ApiResponse({ status: 200, description, ...(type ? { type } : {}) });
}

export function DocumentCreatedResponse(description: string, type?: Type<unknown>) {
  return ApiResponse({ status: 201, description, ...(type ? { type } : {}) });
}

export function DocumentCsvUpload(fieldName = "file") {
  return applyDecorators(
    ApiConsumes("multipart/form-data"),
    ApiBody({
      schema: {
        type: "object",
        required: [fieldName],
        properties: {
          [fieldName]: { type: "string", format: "binary", description: "CSV file" },
        },
      },
    }),
  );
}

export function DocumentImageUpload(fieldName = "file") {
  return applyDecorators(
    ApiConsumes("multipart/form-data"),
    ApiBody({
      schema: {
        type: "object",
        required: [fieldName],
        properties: {
          [fieldName]: { type: "string", format: "binary", description: "Image file" },
        },
      },
    }),
  );
}
