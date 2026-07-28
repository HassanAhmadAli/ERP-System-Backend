/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Prisma } from "./generated/prisma-client/client";
import { recordAuditFromExtension } from "@/audit-log/audit-context";
import { AuditAction } from "@/common/const";
import { Operation } from "@prisma/client/runtime/client";

const EXCLUDED_MODELS = new Set(["AuditLog", "errors"]);

const SENSITIVE_FIELDS = new Set(["passwordHash", "password", "verificationCode"]);

function sanitizeRecord(value: unknown): unknown {
  if (value == undefined || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeRecord);
  }
  const record = value as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};
  for (const [key, fieldValue] of Object.entries(record)) {
    if (SENSITIVE_FIELDS.has(key)) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeRecord(fieldValue);
    }
  }
  return sanitized;
}

function extractEntityId<T>(result: unknown, args: Prisma.Args<T, Operation>) {
  if (result != undefined && typeof result === "object" && "id" in result) {
    return String((result as { id: unknown }).id);
  }
  if ("where" in args && args.where != undefined && typeof args.where === "object") {
    const where = args.where as object;
    if ("id" in where && typeof where === "object" && where.id != undefined) {
      const id = where.id as unknown;
      return String(id);
    }
    const compositeValues = Object.values(args.where as Record<string, unknown>);
    if (compositeValues.length > 0) {
      return compositeValues.map(String).join(":");
    }
  }
  return "unknown";
}

function shouldAuditModel(model: string): boolean {
  return !EXCLUDED_MODELS.has(model);
}

interface AuditModelHandlerParams {
  model: string;
  args: any;
  query: (...args: any[]) => any;
}

export const auditExtensionHandlers = {
  async create({ model, args, query }: AuditModelHandlerParams) {
    const result = (await query(args)) as object;
    if (shouldAuditModel(model)) {
      await recordAuditFromExtension({
        action: AuditAction.CREATE,
        entity: model,
        entityId: extractEntityId(result, args),
        newValue: sanitizeRecord(result),
      });
    }
    return result;
  },
  async update({ model, args, query }: AuditModelHandlerParams) {
    const result = (await query(args)) as object;
    if (shouldAuditModel(model)) {
      await recordAuditFromExtension({
        action: AuditAction.UPDATE,
        entity: model,
        entityId: extractEntityId(result, args),
        oldValue: sanitizeRecord(args.where),
        newValue: sanitizeRecord(result),
      });
    }
    return result;
  },
  async delete({ model, args, query }: AuditModelHandlerParams) {
    const result = (await query(args)) as object;
    if (shouldAuditModel(model)) {
      await recordAuditFromExtension({
        action: AuditAction.DELETE,
        entity: model,
        entityId: extractEntityId(result, args),
        oldValue: sanitizeRecord(args.where),
      });
    }
    return result;
  },
  async updateMany({ model, args, query }: AuditModelHandlerParams) {
    const result = (await query(args)) as object;
    if (shouldAuditModel(model)) {
      await recordAuditFromExtension({
        action: AuditAction.UPDATE,
        entity: model,
        entityId: "many",
        oldValue: sanitizeRecord(args.where),
        newValue: sanitizeRecord(args.data),
      });
    }
    return result;
  },
  async deleteMany({ model, args, query }: AuditModelHandlerParams) {
    const result = (await query(args)) as object;
    if (shouldAuditModel(model)) {
      await recordAuditFromExtension({
        action: AuditAction.DELETE,
        entity: model,
        entityId: "many",
        oldValue: sanitizeRecord(args.where),
      });
    }
    return result;
  },
};

export const auditPrismaExtension = Prisma.defineExtension({
  query: {
    $allModels: auditExtensionHandlers,
  },
});
