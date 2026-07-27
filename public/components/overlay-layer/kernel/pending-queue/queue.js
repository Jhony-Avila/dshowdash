import { config, queue, state, setQueue } from "./state.js";
import { emit } from "./events.js";
import { generateQueueId } from "./utils.js";
const VERSION = "3.0.0-ELEVATION";
const MODULE_ID = "overlay-layer.kernel.pending-queue.queue";
function enqueue(descriptor, reason, options = {}) {
  if (!config.enabled) {
    return { ok: false, error: "queue-disabled" };
  }
  if (queue.length >= config.maxSize) {
    if (options.evictOldest) {
      const evicted = queue.shift();
      emit("overlay:queue-evicted", { id: evicted.queueId, reason: "max-size" });
    } else {
      return { ok: false, error: "queue-full", maxSize: config.maxSize };
    }
  }
  const queueItem = {
    queueId: generateQueueId(),
    descriptor: { ...descriptor },
    reason,
    enqueuedAt: Date.now(),
    expiresAt: Date.now() + (options.maxAge || config.maxAge),
    retries: 0,
    maxRetries: options.retryLimit || config.retryLimit,
    priority: descriptor.config?.priority || options.priority || 50,
    options: options.openOptions || {}
  };
  let inserted = false;
  for (let i = 0; i < queue.length; i++) {
    if (queueItem.priority > queue[i].priority) {
      queue.splice(i, 0, queueItem);
      inserted = true;
      break;
    }
  }
  if (!inserted) {
    queue.push(queueItem);
  }
  state.totalEnqueued++;
  emit("overlay:queued", {
    queueId: queueItem.queueId,
    type: descriptor.type,
    reason,
    priority: queueItem.priority,
    queueSize: queue.length
  });
  return {
    ok: true,
    queueId: queueItem.queueId,
    position: queue.findIndex((q) => q.queueId === queueItem.queueId) + 1,
    queueSize: queue.length
  };
}
function dequeue() {
  if (queue.length === 0) {
    return null;
  }
  const item = queue.shift();
  emit("overlay:dequeued", {
    queueId: item.queueId,
    type: item.descriptor.type,
    waitTime: Date.now() - item.enqueuedAt
  });
  return item;
}
function peek() {
  return queue.length > 0 ? { ...queue[0] } : null;
}
function getAll() {
  return queue.map((item) => ({
    queueId: item.queueId,
    type: item.descriptor.type,
    reason: item.reason,
    priority: item.priority,
    enqueuedAt: item.enqueuedAt,
    expiresAt: item.expiresAt,
    retries: item.retries,
    age: Date.now() - item.enqueuedAt
  }));
}
function remove(queueId) {
  const index = queue.findIndex((q) => q.queueId === queueId);
  if (index === -1) {
    return { ok: false, error: "not-found" };
  }
  const removed = queue.splice(index, 1)[0];
  emit("overlay:queue-removed", {
    queueId: removed.queueId,
    type: removed.descriptor.type
  });
  return { ok: true, removed: removed.queueId };
}
function clear() {
  const count = queue.length;
  setQueue([]);
  emit("overlay:queue-cleared", { count });
  return { ok: true, cleared: count };
}
export {
  MODULE_ID,
  VERSION,
  clear,
  dequeue,
  enqueue,
  getAll,
  peek,
  remove
};
