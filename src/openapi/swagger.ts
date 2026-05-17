import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { INestApplication } from "@nestjs/common";
export const generateSwaggerDocumentation = (app: INestApplication) => {
  const openApiDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("ERP Store API")
      .setDescription("Store management API for dashboard and mobile clients")
      .setVersion("1.0")
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup("doc", app, cleanupOpenApiDoc(openApiDoc));
};
