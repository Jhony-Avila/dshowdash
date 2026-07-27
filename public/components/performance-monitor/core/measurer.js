const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "performance-monitor-measurer";
const _marks = /* @__PURE__ */ new Map();
function mark(name) {
  _marks.set(name, performance.now());
}
function measure(name, startMark) {
  const start = _marks.get(startMark) ?? 0;
  return { name, duration: performance.now() - start, timestamp: Date.now() };
}
function clearMarks() {
  _marks.clear();
}
function getMarks() {
  return Object.fromEntries(_marks);
}
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { available: true }, markCount: _marks.size, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, markCount: _marks.size, timestamp: Date.now() };
}
var measurer_default = { mark, measure, clearMarks, getMarks, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clearMarks,
  measurer_default as default,
  getMarks,
  healthCheck,
  info,
  mark,
  measure
};
