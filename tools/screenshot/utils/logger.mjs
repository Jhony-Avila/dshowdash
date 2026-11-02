// logger.mjs — Logger com timestamp para servico de screenshots
// @version 1.0.0

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[process.env.LOG_LEVEL || 'info'] ?? LEVELS.info;

function timestamp() {
  return new Date().toISOString();
}

function format(level, ...args) {
  return `[${timestamp()}] [${level.toUpperCase()}] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`;
}

export const logger = {
  error(...args) { if (currentLevel >= LEVELS.error) console.error(format('error', ...args)); },
  warn(...args)  { if (currentLevel >= LEVELS.warn)  console.warn(format('warn', ...args)); },
  info(...args)  { if (currentLevel >= LEVELS.info)  console.log(format('info', ...args)); },
  debug(...args) { if (currentLevel >= LEVELS.debug) console.log(format('debug', ...args)); },
};
