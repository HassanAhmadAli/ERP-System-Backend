import { User } from "@/prisma";

export type cachedUserPayload = Pick<User, "id" | "email" | "fullName" | "role">;
