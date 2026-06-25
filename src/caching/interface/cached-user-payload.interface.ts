import { User } from "@/prisma/client";

export type cachedUserPayload = Pick<User, "id" | "email" | "fullName" | "role">;
