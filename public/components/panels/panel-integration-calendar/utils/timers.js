const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-integration-calendar/utils/timers";
const debounce = (fn, delay2 = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay2);
  };
};
const throttle = (fn, limit = 300) => {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
const delay = (fn, ms) => setTimeout(fn, ms);
const interval = (fn, ms) => setInterval(fn, ms);
const cancelDelay = (id) => clearTimeout(id);
const cancelInterval = (id) => clearInterval(id);
const retry = (fn, retries = 3, delayMs = 1e3) => new Promise((resolve, reject) => {
  const attempt = (n) => {
    fn().then(resolve).catch((err) => {
      if (n <= 1) reject(err);
      else setTimeout(() => attempt(n - 1), delayMs);
    });
  };
  attempt(retries);
});
const healthCheck = () => ({ status: "healthy", version: VERSION, moduleId: MODULE_ID });
const info = () => ({ version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() });
var timers_default = { debounce, throttle, delay, interval, cancelDelay, cancelInterval, retry, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  cancelDelay,
  cancelInterval,
  debounce,
  timers_default as default,
  delay,
  healthCheck,
  info,
  interval,
  retry,
  throttle
};
