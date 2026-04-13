import { SetMetadata } from "@nestjs/common";
import { Keys, AuthType } from "@/common/const";
export const Auth = (authType: AuthType) => SetMetadata(Keys.Auth, authType);
export const Public = () => Auth(AuthType.NONE);
export const Private = () => Auth(AuthType.BEARER);
