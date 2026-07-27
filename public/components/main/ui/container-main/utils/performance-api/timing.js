import { METRIC_TYPES, METRIC_CATEGORIES } from "./constants.js";
import { addToHistory } from "./utils.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.performance-api.timing";
function startTiming(state, name, category = METRIC_CATEGORIES.CUSTOM) {
  const mark = `${name}_start`;
  performance.mark(mark);
  state.metrics.marks.set(name, { mark, category, startTime: performance.now() });
}
function endTiming(state, name, logger, debug) {
  const startData = state.metrics.marks.get(name);
  if (!startData) {
    if (logger) logger.warn(`No start mark found for: ${name}`);
    return null;
  }
  const endMark = `${name}_end`;
  performance.mark(endMark);
  const duration = performance.now() - startData.startTime;
  if (!state.metrics.timings.has(name)) {
    state.metrics.timings.set(name, []);
  }
  state.metrics.timings.get(name).push(duration);
  try {
    performance.measure(name, startData.mark, endMark);
  } catch (e) {
  }
  addToHistory(state, {
    type: METRIC_TYPES.TIMING,
    name,
    category: startData.category,
    value: duration,
    timestamp: Date.now()
  });
  if (debug && logger) logger.debug(`Timing ${name}: ${duration.toFixed(2)}ms`);
  return duration;
}
async function measure(state, name, fn, category, logger, debug) {
  startTiming(state, name, category);
  try {
    const result = await fn();
    endTiming(state, name, logger, debug);
    return result;
  } catch (error) {
    endTiming(state, name, logger, debug);
    throw error;
  }
}
export {
  MODULE_ID,
  VERSION,
  endTiming,
  measure,
  startTiming
};
