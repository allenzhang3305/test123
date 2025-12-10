import { createLogger, format, transports } from "winston";

const isProduction = process.env.NODE_ENV === "production";

const devFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${stack || message}${extra}`;
  })
);

const prodFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  format: isProduction ? prodFormat : devFormat,
  transports: [
    new transports.Console({
      stderrLevels: ["error", "warn"],
    }),
  ],
});

export default logger;


