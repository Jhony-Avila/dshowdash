const MODULE_ID = "nav-rail";
const VERSION = "5.1.1-FIX";
const createLogger = (getPort) => (level, ...args) => {
  const logger = getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
};
export {
  MODULE_ID,
  VERSION,
  createLogger
};
