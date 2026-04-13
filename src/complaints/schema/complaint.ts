import { z } from "zod";
import { ComplaintStatus } from "@/prisma";

export const CreateComplaintSchema = z.object({
  title: z.string(),
  description: z.string(),
  status: z.enum(ComplaintStatus).optional(),
  isArchived: z.boolean().optional(),
  assignedEmployeeId: z.int().optional(),
  departmentId: z.int(),
});
