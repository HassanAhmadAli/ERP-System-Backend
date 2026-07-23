import { openapiMeta } from "@/openapi/meta";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { NotificationTargetType, UserRole } from "@/prisma/client";

const SendNotificationBaseSchema = z
  .object({
    title: z.string().min(1).max(200),
    titleAr: z.string().min(1).max(200).optional(),
    body: z.string().min(1).max(5000),
    bodyAr: z.string().min(1).max(5000).optional(),
    targetType: z.enum(NotificationTargetType),
    targetRole: z.enum(UserRole).optional(),
    userIds: z.array(z.coerce.number().int()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.targetType === NotificationTargetType.USER && (data.userIds == undefined || data.userIds.length === 0)) {
      ctx.addIssue({ code: "custom", message: "userIds required when targetType is USER", path: ["userIds"] });
    }
    if (data.targetType === NotificationTargetType.ROLE && data.targetRole == undefined) {
      ctx.addIssue({ code: "custom", message: "targetRole required when targetType is ROLE", path: ["targetRole"] });
    }
  });

export const SendNotificationSchema = openapiMeta(SendNotificationBaseSchema, "SendNotificationDto", {
  title: "Store announcement",
  titleAr: "إعلان المتجر",
  body: "Extended hours this weekend.",
  bodyAr: "ساعات عمل ممتدة هذا الأسبوع",
  targetType: NotificationTargetType.ROLE,
  targetRole: UserRole.CASHIER,
});

export class SendNotificationDto extends createZodDto(SendNotificationSchema) {}
