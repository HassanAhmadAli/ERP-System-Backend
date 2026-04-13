import { Role } from "@/prisma";

export const Permissions = {} as const;
export type Permissions = ValueOf<typeof Permissions>;
export const PermissionsMap: Record<Exclude<Role, "Debugging">, Permissions[]> = {
  Citizen: [] satisfies Permissions[],
  Admin: [] satisfies Permissions[],
  Employee: [] satisfies Permissions[],
};
