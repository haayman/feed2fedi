import { Injectable } from "@nestjs/common";
import * as winston from "winston";
import * as path from "path";

@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    const logsDir = path.join(process.cwd(), "logs");

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      defaultMeta: { service: "feed2fedi-backend" },
      transports: [
        // Console output
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
              const metaStr =
                Object.keys(meta).length > 0 ? JSON.stringify(meta) : "";
              return `${timestamp} [${level}]: ${message} ${metaStr}`;
            }),
          ),
        }),
        // File output for all logs
        new winston.transports.File({
          filename: path.join(logsDir, "error.log"),
          level: "error",
        }),
        // File output for combined logs
        new winston.transports.File({
          filename: path.join(logsDir, "combined.log"),
        }),
        // HTTP requests log file
        new winston.transports.File({
          filename: path.join(logsDir, "http.log"),
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, stack?: string, context?: string) {
    this.logger.error(message, { stack, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  http(message: string, meta: Record<string, any>) {
    this.logger.info(message, { type: "http", ...meta });
  }

  getLogger(): winston.Logger {
    return this.logger;
  }
}
