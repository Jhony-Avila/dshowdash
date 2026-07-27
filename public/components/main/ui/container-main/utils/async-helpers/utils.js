import { DEFAULT_TIMEOUTS } from "./constants.js";
import { createAbortController, abortByKey } from "./abort-controller.js";
import { withTimeout, withAbortAndTimeout } from "./timeout.js";
const VERSION = "2.0.0-MODULAR";
const MODULE_ID = "container-main:async-helpers:utils";
function delay(ms, signal = null) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Delay aborted"));
      return;
    }
    const timeoutId = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      reject(new Error("Delay aborted"));
    });
  });
}
function createDebouncedAsync(asyncFn, delayMs = 300, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUTS.MEDIUM } = options;
  let timeoutId = null;
  let currentKey = null;
  const debounced = async (...args) => {
    if (currentKey) {
      abortByKey(currentKey);
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        currentKey = `debounced-${Date.now()}`;
        try {
          const result = await withAbortAndTimeout(
            // @ts-expect-error TS migration - TS2345
            (signal) => asyncFn(...args, signal),
            { key: currentKey, timeoutMs, createAbortController }
          );
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delayMs);
    });
  };
  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (currentKey) abortByKey(currentKey);
  };
  return debounced;
}
async function raceWithAbort(asyncFns, options = {}) {
  const { key = `race-${Date.now()}`, timeoutMs = DEFAULT_TIMEOUTS.MEDIUM } = options;
  const controllers = asyncFns.map((_, i) => createAbortController(`${key}-${i}`));
  try {
    const result = await withTimeout(
      // @ts-expect-error TS migration - TS2769, TS7053
      Promise.race(asyncFns.map((fn, i) => fn(controllers[i].signal))),
      timeoutMs,
      { operation: "race operation" }
    );
    controllers.forEach((c) => c.abort("Race completed"));
    return result;
  } catch (error) {
    controllers.forEach((c) => c.abort("Race failed"));
    throw error;
  }
}
async function parallelLimit(asyncFns, limit = 5, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUTS.LONG } = options;
  const results = [];
  const executing = [];
  for (const [index, fn] of asyncFns.entries()) {
    const promise = withTimeout(fn(), timeoutMs, { operation: `parallel task ${index}` }).then((result) => ({ status: "fulfilled", value: result, index })).catch((error) => ({ status: "rejected", reason: error, index }));
    results.push(promise);
    executing.push(promise);
    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(executing.findIndex((p) => p === promise), 1);
    }
  }
  return Promise.all(results);
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["delay", "createDebouncedAsync", "raceWithAbort", "parallelLimit"]
  };
}
var utils_default = {
  VERSION,
  MODULE_ID,
  delay,
  createDebouncedAsync,
  raceWithAbort,
  parallelLimit,
  info
};
export {
  MODULE_ID,
  VERSION,
  createDebouncedAsync,
  utils_default as default,
  delay,
  info,
  parallelLimit,
  raceWithAbort
};
