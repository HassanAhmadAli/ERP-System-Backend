import { CallHandler, ExecutionContext, Injectable, NestInterceptor, RequestTimeoutException } from "@nestjs/common";
import { timeout, catchError, throwError, TimeoutError, Observable } from "rxjs";

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(3000),
      catchError((error: unknown) => {
        if (error instanceof TimeoutError) {
          return throwError(() => {
            return new RequestTimeoutException();
          });
        }
        return throwError(() => error);
      }),
    );
  }
}
