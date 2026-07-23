import { UserRole } from "@/prisma/client";
export const Keys = {
  IsPublic: Symbol("Is_Public"),
  Roles: Symbol("Roles_Key"),
  User: Symbol("User_Key"),
  Permissions: Symbol("Permissions_KEY"),
  notification: "notification",
  backupQueue: "backup",
  socketio: "socketio",
} as const;

export const CashingNamespace = {
  SocketIo: {
    UserId_By_SocketId: "SocketIo:UserId:socketId",
    SocketId_By_UserId: "SocketIo:SocketId:userId",
  },
  User: {
    UserData_By_UserId: "User:UserData:userId",
  },
} as const;
export type CashingNamespace = ValueOf<{ [K in keyof typeof CashingNamespace]: ValueOf<(typeof CashingNamespace)[K]> }>;
export type CacheKey = `${CashingNamespace}:${string}`;
export type Keys = ValueOf<typeof Keys>;

export const STAFF_ROLES: UserRole[] = [
  UserRole.CASHIER,
  UserRole.WAREHOUSE_WORKER,
  UserRole.ACCOUNTANT,
  UserRole.STORE_MANAGER,
];

export const AuditAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LOYALTY_ADJUSTMENT: "LOYALTY_ADJUSTMENT",
  LOYALTY_REDEMPTION: "LOYALTY_REDEMPTION",
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
