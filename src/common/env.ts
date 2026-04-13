import "dotenv/config";
import { prettifyError } from "zod";
import { envSchema } from "./schema/env";
const { success, error, data: env } = envSchema.safeParse(process.env);

if (!success || env == undefined) {
  throw new Error(prettifyError(error));
}
export { env };
