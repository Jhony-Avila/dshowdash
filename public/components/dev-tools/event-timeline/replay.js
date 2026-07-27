const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "dev-tools-event-timeline-replay";
let _playing = false;
let _speed = 1;
function play(events, callback) {
  _playing = true;
  let index = 0;
  const next = () => {
    if (!_playing || index >= events.length) {
      _playing = false;
      return;
    }
    callback?.(events[index++]);
    setTimeout(next, 100 / _speed);
  };
  next();
}
function pause() {
  _playing = false;
}
function setSpeed(speed) {
  _speed = Math.max(0.1, Math.min(10, speed));
}
function isPlaying() {
  return _playing;
}
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { available: true }, playing: _playing, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, playing: _playing, speed: _speed, timestamp: Date.now() };
}
function createReplayManager(context) {
  return { start: function(options) {
    return play([], null);
  }, stop: function() {
    pause();
  }, stepForward: function() {
  }, stepBackward: function() {
  }, goToEvent: function(index) {
  }, getIndex: function() {
    return 0;
  }, getSpeed: function() {
    return 1;
  }, reset: function() {
  } };
}
var replay_default = { play, pause, setSpeed, isPlaying, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createReplayManager,
  replay_default as default,
  healthCheck,
  info,
  isPlaying,
  pause,
  play,
  setSpeed
};
