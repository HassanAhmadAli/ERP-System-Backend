import { AsyncLocalStorage } from "node:async_hooks";
import { UserRole } from "@/prisma/client";
import { STAFF_ROLES } from "@/common/const";

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
  return auditStorage.run(actor, fn);
}

export function setAuditRecorder(fn: NonNullable<typeof auditRecorder>): void {
  auditRecorder = fn;
}

export async function recordAuditFromExtension(params: Omit<AuditRecordParams, "userId">) {
  const actor = auditStorage.getStore();
  if (actor == undefined) {
    return;
  }
  const isStaff = STAFF_ROLES.includes(actor.role);
  if (!isStaff) {
    return;
  }
  if (auditRecorder == undefined) {
    return;
  }
  await auditRecorder({ ...params, userId: actor.userId });
}
