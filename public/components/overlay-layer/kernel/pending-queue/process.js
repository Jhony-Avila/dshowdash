import { config, queue, state, refs, setQueue } from "./state.js";
import { emit } from "./events.js";
import { cleanExpired } from "./expiration.js";
const VERSION = "3.0.0-ELEVATION";
const MODULE_ID = "overlay-layer.kernel.pending-queue.process";
function process() {
  if (!config.enabled || queue.length === 0) {
    return { ok: true, processed: 0, remaining: queue.length };
  }
  state.lastProcess = Date.now();
  cleanExpired();
  if (!refs.openOverlay) {
    return { ok: false, error: "open-function-not-injected" };
  }
  const results = {
    processed: 0,
    opened: [],
    requeued: [],
    failed: [],
    expired: []
  };
  const toProcess = [...queue];
  setQueue([]);
  for (const item of toProcess) {
    if (item.expiresAt <= Date.now()) {
      results.expired.push(item.queueId);
      state.totalExpired++;
      continue;
    }
    if (refs.canOpenOverlay) {
      const canOpen = refs.canOpenOverlay(item.descriptor.type, {
        scope: item.descriptor.scope || "global"
      });
      if (!canOpen.allowed) {
        item.retries++;
        if (item.retries >= item.maxRetries) {
          results.failed.push({
            queueId: item.queueId,
            reason: "max-retries-exceeded",
            lastBlockReason: canOpen.reason
          });
          state.totalFailed++;
        } else {
          queue.push(item);
          results.requeued.push(item.queueId);
        }
        continue;
      }
    }
    try {
      const openResult = refs.openOverlay(item.descriptor, {
        ...item.options,
        bypassRateLimit: true,
        fromQueue: true
      });
      if (openResult?.ok) {
        results.opened.push({
          queueId: item.queueId,
          overlayId: openResult.id,
          waitTime: Date.now() - item.enqueuedAt
        });
        results.processed++;
        state.totalProcessed++;
        emit("overlay:queue-processed", {
          queueId: item.queueId,
          overlayId: openResult.id,
          waitTime: Date.now() - item.enqueuedAt
        });
      } else {
        item.retries++;
        if (item.retries >= item.maxRetries) {
          results.failed.push({
            queueId: item.queueId,
            reason: "open-failed",
            errors: openResult?.errors
          });
          state.totalFailed++;
        } else {
          queue.push(item);
          results.requeued.push(item.queueId);
        }
      }
    } catch (error) {
      item.retries++;
      if (item.retries >= item.maxRetries) {
        results.failed.push({
          queueId: item.queueId,
          reason: "exception",
          error: error.message
        });
        state.totalFailed++;
      } else {
        queue.push(item);
        results.requeued.push(item.queueId);
      }
    }
  }
  return {
    ok: true,
    processed: results.processed,
    remaining: queue.length,
    results
  };
}
function startAutoProcess(interval) {
  if (state.processIntervalId) {
    stopAutoProcess();
  }
  const processInterval = interval || config.processInterval;
  config.autoProcess = true;
  state.processIntervalId = setInterval(() => {
    if (config.autoProcess && queue.length > 0) {
      process();
    }
  }, processInterval);
  return { ok: true, interval: processInterval };
}
function stopAutoProcess() {
  config.autoProcess = false;
  if (state.processIntervalId) {
    clearInterval(state.processIntervalId);
    state.processIntervalId = null;
  }
  return { ok: true };
}
function isAutoProcessEnabled() {
  return config.autoProcess && state.processIntervalId !== null;
}
export {
  MODULE_ID,
  VERSION,
  isAutoProcessEnabled,
  process,
  startAutoProcess,
  stopAutoProcess
};
