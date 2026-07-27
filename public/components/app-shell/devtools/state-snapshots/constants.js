const VERSION = "1.1.0-AAA";
const MODULE_ID = "app-shell-state-snapshots";
function generateId() {
  return `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function deepClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    return obj;
  }
}
function getSize(obj) {
  try {
    return JSON.stringify(obj).length;
  } catch (e) {
    return 0;
  }
}
export {
  MODULE_ID,
  VERSION,
  deepClone,
  generateId,
  getSize
};
