// ============= IMPORTS =============
import pino from 'pino';

// ============= LOGGER =============
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});
