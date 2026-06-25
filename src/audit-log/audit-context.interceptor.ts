import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { Keys } from "@/common/const";
import { RequestWithActiveUser } from "@/common/decorators/ActiveUser.decorator";
import { runWithAuditContext } from "./audit-context";

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<RequestWithActiveUser>();
    const user = req[Keys.User];

    if (!user) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      runWithAuditContext({ userId: user.sub, role: user.role }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
