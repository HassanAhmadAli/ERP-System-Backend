import { z } from "zod";

export const CreateCategorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();
