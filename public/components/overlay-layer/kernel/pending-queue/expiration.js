import { queue, state, setQueue } from "./state.js";
import { emit } from "./events.js";
const VERSION = "3.0.0-ELEVATION";
const MODULE_ID = "overlay-layer.kernel.pending-queue.expiration";
function cleanExpired() {
  const now = Date.now();
  const expired = [];
  const newQueue = queue.filter((item) => {
    if (item.expiresAt <= now) {
      expired.push(item);
      state.totalExpired++;
      return false;
    }
    return true;
  });
  setQueue(newQueue);
  if (expired.length > 0) {
    emit("overlay:queue-expired", {
      count: expired.length,
      items: expired.map((e) => ({ queueId: e.queueId, type: e.descriptor.type }))
    });
  }
  return { ok: true, expired: expired.length };
}
export {
  MODULE_ID,
  VERSION,
  cleanExpired
};
