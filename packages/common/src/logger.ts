import pino from 'pino';

export interface LoggerOptions {
  serviceName: string;
  level?: string;
}

export const createLogger = ({ serviceName, level }: LoggerOptions) => {
  return pino({
    level: level || process.env.LOG_LEVEL || 'info',
    base: {
      service: serviceName,
    },
    // Optional: pretty-print during local development
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: { colorize: true },
          }
        : undefined,
  });
};

export type Logger = ReturnType<typeof createLogger>;
