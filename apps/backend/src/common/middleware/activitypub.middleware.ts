import {
  Injectable,
  NestMiddleware,
  UseInterceptors,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Request, Response, NextFunction } from "express";

/**
 * Middleware to set proper Content-Type header for ActivityPub responses
 */
@Injectable()
export class ActivityPubMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Set proper content-type for ActivityPub requests
    if (
      req.path.includes("/@") ||
      req.path.includes("/outbox") ||
      req.path.includes("/.well-known/webfinger")
    ) {
      res.setHeader("Content-Type", "application/activity+json; charset=utf-8");
    }
    next();
  }
}

/**
 * Interceptor to add required ActivityPub headers
 */
@Injectable()
export class ActivityPubInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse<Response>();

        // Ensure proper ActivityPub headers
        if (!response.getHeader("Content-Type")) {
          response.setHeader(
            "Content-Type",
            "application/activity+json; charset=utf-8",
          );
        }

        response.setHeader("Vary", "Accept");
        response.setHeader("Cache-Control", "public, max-age=3600");

        return data;
      }),
    );
  }
}
