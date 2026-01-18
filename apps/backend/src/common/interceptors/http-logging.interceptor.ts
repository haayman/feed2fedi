import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";
import { LoggerService } from "../logger/logger.service";

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    const method = request.method;
    const url = request.originalUrl;
    const ip = request.ip || request.connection.remoteAddress;

    return next.handle().pipe(
      tap(
        () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.loggerService.http(`${method} ${url}`, {
            statusCode,
            duration: `${duration}ms`,
            ip,
            userAgent: request.get("user-agent"),
          });
        },
        (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.loggerService.error(
            `${method} ${url} - ${error.message}`,
            error.stack,
            "HTTP",
          );
          this.loggerService.http(`${method} ${url}`, {
            statusCode,
            duration: `${duration}ms`,
            ip,
            error: error.message,
          });
        },
      ),
    );
  }
}
