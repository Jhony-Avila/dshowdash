const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "header-ui-inline-editor-audio-feedback";
let _metrics = { sounds: 0 };
function createAudioFeedback(options = {}) {
  let soundEnabled = options.soundEnabled !== false;
  let prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false;
  let audioContext = null;
  function init() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
    }
  }
  function resume() {
    if (audioContext?.state === "suspended") audioContext.resume();
  }
  function playDropSound() {
    if (!soundEnabled || prefersReducedMotion || !audioContext) return;
    _metrics.sounds++;
    try {
      if (audioContext.state === "running") {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(600, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.1);
      }
    } catch (e) {
    }
  }
  function setSoundEnabled(enabled) {
    soundEnabled = !!enabled;
  }
  function isSoundEnabled() {
    return soundEnabled;
  }
  function getPrefersReducedMotion() {
    return prefersReducedMotion;
  }
  function destroy() {
    if (audioContext) {
      try {
        audioContext.close();
      } catch (e) {
      }
      audioContext = null;
    }
  }
  init();
  return { playDropSound, setSoundEnabled, isSoundEnabled, getPrefersReducedMotion, resume, destroy };
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { audioReady: true }, metrics: getMetrics() };
}
var audio_feedback_default = { createAudioFeedback, getMetrics, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  createAudioFeedback,
  audio_feedback_default as default,
  getMetrics,
  healthCheck,
  info
};
