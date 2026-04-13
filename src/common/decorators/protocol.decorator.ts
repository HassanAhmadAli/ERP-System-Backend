import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import express from "express";
export const Protocol = createParamDecorator((_data: never, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<express.Request>();
  return req.protocol;
});
