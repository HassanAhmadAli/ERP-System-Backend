import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Keys } from "@/common/const";
import type { ActiveUserType } from "@/iam/authentication/dto/request-user.dto";
import express from "express";
export type RequestWithActiveUser = express.Request & {
  [Keys.User]: ActiveUserType;
};
export type { ActiveUserType } from "@/iam/authentication/dto/request-user.dto";
export const ActiveUser = createParamDecorator((path: keyof ActiveUserType | undefined, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<RequestWithActiveUser>();
  if (path == undefined) return req[Keys.User]!;
  return req[Keys.User]![path];
});
