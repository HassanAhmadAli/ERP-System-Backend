import { prettifyError, z } from "zod";
import { durationSchema } from "@/common/schema/duration-schema";
import path from "node:path";
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  DATABASE_URL: z.string().nonempty(),
  JWT_SECRET: z.string(),
  // identifies the audiance jwt is use for, like localhost:3000
  JWT_AUDIENCE: z.string().default("localhost:3000"),
  // identifies the issuer of the jwt
  JWT_ISSUER: z.string().default("localhost:3000"),
  // identifies the time to live of the issued jwt
  JWT_TTL: durationSchema.default("1y"),
  // identifies the time to live of the refresh token
  JWT_REFRESH_TTL: durationSchema.default("1y"),
  REDIS_DATABASE_URL: z.string().nonempty(),
  APP_EMAIL_HOST: z.string(),
  APP_EMAIL_User: z.email(),
  APP_EMAIL_Password: z.string(),
  ENABLE_Devtools: z.stringbool().default(false),
  IS_DOCKER: z.stringbool().default(false),
  ENABLE_CRON_JOBS: z.stringbool().default(true),
  backupDir: z
    .string()
    .default(path.join(__dirname, "..", "..", "backups"))
    .transform((x) => {
      const { data: Is_DOCKER } = z.stringbool().safeParse(process.env.IS_DOCKER);
      if (Is_DOCKER) {
        return "/app/backups";
      }
      const path = x.replaceAll("\\", "/").replace(/dist\/backups$/, "/backups");
      console.log(path);
      return path;
    }),
});

export const validateEnv = (input: Record<string, any>) => {
  const { data, error, success } = envSchema.safeParse(input);
  if (success) {
    return data;
  } else {
    throw new Error(prettifyError(error));
  }
};

export type EnvVariables = z.infer<typeof envSchema>;
