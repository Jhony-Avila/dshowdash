const MODULE_ID = "panel-home.weather-fx.effects.live-probe";
const VERSION = "0.1.0-ETAPA4";
let _live = 0;
function liveInc() {
  _live++;
}
function liveDec() {
  if (_live > 0) _live--;
}
function liveCount() {
  return _live;
}
export {
  MODULE_ID,
  VERSION,
  liveCount,
  liveDec,
  liveInc
};
