import { SetMetadata } from "@nestjs/common";
import { Keys } from "@/common/const";
export const Public = () => SetMetadata(Keys.IsPublic, true);
