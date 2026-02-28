import "server-only";
import pino, { type Logger, type LoggerOptions } from "pino";

const isProd = process.env.NODE_ENV === "production";

const opts: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  base: { app: "backofficemanagement" },
  redact: {
    paths: [
      "*.password",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "req.headers.cookie",
      "req.headers.authorization",
    ],
    remove: true,
  },
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard" },
      },
};

declare global {
  var __pino: Logger | undefined;
}

export const logger: Logger = globalThis.__pino ?? pino(opts);

if (!isProd) {
    globalThis.__pino = logger;
}