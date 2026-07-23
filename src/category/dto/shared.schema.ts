import { z } from "zod";

export const CreateCategorySchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().min(2).optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
});
