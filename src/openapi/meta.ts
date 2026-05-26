import z from "zod";

export function openapiMeta<T extends z.ZodTypeAny>(schema: T, id: string, example: unknown): T {
  if (example == undefined) {
    return schema.meta({ id });
  } else {
    return schema.meta({ id, example });
  }
}
