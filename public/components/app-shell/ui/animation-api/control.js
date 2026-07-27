import { activeAnimations } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.animation-api.control";
function cancel(id) {
  const entry = activeAnimations.get(id);
  if (!entry) return false;
  entry.animation.cancel();
  activeAnimations.delete(id);
  return true;
}
function cancelAll() {
  let count = 0;
  activeAnimations.forEach((entry) => {
    entry.animation.cancel();
    count++;
  });
  activeAnimations.clear();
  return count;
}
function pause(id) {
  const entry = activeAnimations.get(id);
  if (!entry) return false;
  entry.animation.pause();
  return true;
}
function resume(id) {
  const entry = activeAnimations.get(id);
  if (!entry) return false;
  entry.animation.play();
  return true;
}
function pauseAll() {
  activeAnimations.forEach((entry) => {
    entry.animation.pause();
  });
}
function resumeAll() {
  activeAnimations.forEach((entry) => {
    entry.animation.play();
  });
}
function getActive() {
  const result = [];
  activeAnimations.forEach((entry) => {
    result.push({
      id: entry.id,
      name: entry.name,
      startedAt: entry.startedAt,
      playState: entry.animation.playState
    });
  });
  return result;
}
export {
  MODULE_ID,
  VERSION,
  cancel,
  cancelAll,
  getActive,
  pause,
  pauseAll,
  resume,
  resumeAll
};
