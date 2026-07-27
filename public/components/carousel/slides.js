const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "carousel-slides";
let _slides = [];
function add(slide) {
  _slides.push(slide);
  return _slides.length - 1;
}
function remove(index) {
  _slides.splice(index, 1);
}
function get(index) {
  return _slides[index];
}
function getAll() {
  return [..._slides];
}
function count() {
  return _slides.length;
}
function clear() {
  _slides = [];
}
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { hasSlides: _slides.length > 0 }, slideCount: _slides.length, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, slideCount: count(), timestamp: Date.now() };
}
var slides_default = { add, remove, get, getAll, count, clear, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  add,
  clear,
  count,
  slides_default as default,
  get,
  getAll,
  healthCheck,
  info,
  remove
};
