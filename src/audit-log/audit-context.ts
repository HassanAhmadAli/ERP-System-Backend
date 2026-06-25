import { AsyncLocalStorage } from "node:async_hooks";
import { UserRole } from "@/prisma/client";
import { STAFF_ROLES } from "@/common/const";
import { logger } from "@/utils";

export interface AuditActor {
  userId: number;
  role: UserRole;
}

export interface AuditRecordParams {
  userId: number;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
}

const auditStorage = new AsyncLocalStorage<AuditActor>();

let auditRecorder: ((params: AuditRecordParams) => Promise<void>) | null = null;

export function runWithAuditContext<T>(actor: AuditActor, fn: () => T): T {
  logger.trace("runWithAuditContext");
  return auditStorage.run(actor, fn);
}

export function setAuditRecorder(fn: NonNullable<typeof auditRecorder>): void {
  logger.trace("setAuditRecorder");
  auditRecorder = fn;
}

export async function recordAuditFromExtension(params: Omit<AuditRecordParams, "userId">) {
  logger.trace("recordAuditFromExtension");
  const actor = auditStorage.getStore();
  if (actor == undefined) {
    return;
  }
  const isStaff = STAFF_ROLES.includes(actor.role);
  if (isStaff == undefined) {
    return;
  }
  if (auditRecorder == undefined) {
    return;
  }
  await auditRecorder({ ...params, userId: actor.userId });
}
