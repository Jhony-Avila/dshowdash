const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-datahub/utils/timers";
function debounce(fn, delay2 = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay2);
  };
}
function throttle(fn, limit = 300) {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
function delay(fn, ms) {
  return setTimeout(fn, ms);
}
function interval(fn, ms) {
  return setInterval(fn, ms);
}
function cancelDelay(id) {
  clearTimeout(id);
}
function cancelInterval(id) {
  clearInterval(id);
}
function retry(fn, retries = 3, delay2 = 1e3) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      fn().then(resolve).catch((err) => {
        if (n <= 1) reject(err);
        else setTimeout(() => attempt(n - 1), delay2);
      });
    };
    attempt(retries);
  });
}
function healthCheck() {
  return { status: "healthy", version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() };
}
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
