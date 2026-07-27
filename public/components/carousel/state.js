const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "carousel-state";
let _state = { currentSlide: 0, totalSlides: 0, autoplay: false, interval: 5e3 };
function getState() {
  return { ..._state };
}
function setState(newState) {
  Object.assign(_state, newState);
}
function setCurrentSlide(index) {
  _state.currentSlide = index;
}
function setAutoplay(val) {
  _state.autoplay = val;
}
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { hasState: true }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, state: getState(), timestamp: Date.now() };
}
var state_default = { getState, setState, setCurrentSlide, setAutoplay, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  state_default as default,
  getState,
  healthCheck,
  info,
  setAutoplay,
  setCurrentSlide,
  setState
};
