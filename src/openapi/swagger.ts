import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { INestApplication } from "@nestjs/common";
export const generateSwaggerDocumentation = (app: INestApplication) => {
  const openApiDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("Hotel System")
      .setDescription("Hotel System API description")
      .setVersion("0.1")
      .build(),
  );
  SwaggerModule.setup("doc", app, cleanupOpenApiDoc(openApiDoc));
};
