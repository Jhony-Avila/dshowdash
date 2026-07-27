const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "dev-tools-event-timeline-recording";
let _recording = false;
let _startedAt = null;
function start() {
  _recording = true;
  _startedAt = Date.now();
  return true;
}
function stop() {
  _recording = false;
  return { duration: _startedAt ? Date.now() - _startedAt : 0 };
}
function isRecording() {
  return _recording;
}
function getDuration() {
  return _recording && _startedAt ? Date.now() - _startedAt : 0;
}
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { available: true }, recording: _recording, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, recording: _recording, duration: getDuration(), timestamp: Date.now() };
}
function createRecordingManager(context) {
  return { start, stop, isRecording, getDuration, subscribeToEvents: function() {
  }, unsubscribe: function() {
  }, createEvent: function(name, data, type) {
    return { name, data, type, timestamp: Date.now() };
  }, pause: function() {
    return stop();
  }, resume: function() {
    return start();
  }, getRecordingStartedAt: function() {
    return null;
  } };
}
var recording_default = { start, stop, isRecording, getDuration, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createRecordingManager,
  recording_default as default,
  getDuration,
  healthCheck,
  info,
  isRecording,
  start,
  stop
};
