const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "main.domain.features.persistence-sync.state";
const enabled = { value: false };
const cleanups = [];
const syncTimeoutId = { value: null };
const pendingChanges = /* @__PURE__ */ new Map();
const metrics = {
  inits: 0,
  saves: 0,
  loads: 0,
  syncs: 0,
  errors: 0,
  validationErrors: 0,
  migrations: 0,
  navigationsTracked: 0
};
function resetCleanups() {
  cleanups.length = 0;
}
function addCleanup(fn) {
  cleanups.push(fn);
}
export {
  MODULE_ID,
  VERSION,
  addCleanup,
  cleanups,
  enabled,
  metrics,
  pendingChanges,
  resetCleanups,
  syncTimeoutId
};
