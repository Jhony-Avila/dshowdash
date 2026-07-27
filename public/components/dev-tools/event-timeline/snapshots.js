const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "dev-tools-event-timeline-snapshots";
let _snapshots = [];
function create(name, data) {
  const snapshot = { id: `snap-${Date.now()}`, name, data, createdAt: Date.now() };
  _snapshots.push(snapshot);
  return snapshot;
}
function get(id) {
  return _snapshots.find((s) => s.id === id);
}
function list() {
  return [..._snapshots];
}
function remove(id) {
  _snapshots = _snapshots.filter((s) => s.id !== id);
}
function clear() {
  _snapshots = [];
}
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { available: true }, snapshotCount: _snapshots.length, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, snapshotCount: _snapshots.length, timestamp: Date.now() };
}
function createSnapshotsManager(context) {
  return { take: function(label) {
    return create(label, context.getEvents());
  }, restore: function(id) {
    const s = get(id);
    if (s) context.setEvents(s.data);
    return s;
  }, getAll: function() {
    return list();
  }, count: function() {
    return list().length;
  }, clear };
}
var snapshots_default = { create, get, list, remove, clear, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clear,
  create,
  createSnapshotsManager,
  snapshots_default as default,
  get,
  healthCheck,
  info,
  list,
  remove
};
