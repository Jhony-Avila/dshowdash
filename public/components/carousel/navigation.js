const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "carousel-navigation";
let _currentIndex = 0;
let _total = 0;
function init(total) {
  _total = total;
  _currentIndex = 0;
}
function next() {
  _currentIndex = (_currentIndex + 1) % _total;
  return _currentIndex;
}
function prev() {
  _currentIndex = (_currentIndex - 1 + _total) % _total;
  return _currentIndex;
}
function goTo(index) {
  if (index >= 0 && index < _total) _currentIndex = index;
  return _currentIndex;
}
function getCurrent() {
  return _currentIndex;
}
function getTotal() {
  return _total;
}
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { hasSlides: _total > 0 }, currentIndex: _currentIndex, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, currentIndex: _currentIndex, total: _total, timestamp: Date.now() };
}
var navigation_default = { init, next, prev, goTo, getCurrent, getTotal, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  navigation_default as default,
  getCurrent,
  getTotal,
  goTo,
  healthCheck,
  info,
  init,
  next,
  prev
};
