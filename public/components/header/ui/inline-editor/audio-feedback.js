const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/ui/inline-editor/audio-feedback";
function createAudioFeedback(options) {
  options = options || {};
  let _soundEnabled = options.soundEnabled !== false;
  let _audioContext = null;
  const _prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function _initAudioContext() {
    if (_audioContext) return;
    try {
      _audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      _soundEnabled = false;
    }
  }
  function _playSound(frequency, duration, type) {
    if (!_soundEnabled || !_audioContext || _prefersReducedMotion) return;
    try {
      const oscillator = _audioContext.createOscillator();
      const gainNode = _audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(_audioContext.destination);
      oscillator.frequency.value = frequency || 440;
      oscillator.type = type || "sine";
      gainNode.gain.setValueAtTime(0.1, _audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, _audioContext.currentTime + (duration || 0.1));
      oscillator.start(_audioContext.currentTime);
      oscillator.stop(_audioContext.currentTime + (duration || 0.1));
    } catch (e) {
    }
  }
  return {
    resume() {
      _initAudioContext();
      if (_audioContext && _audioContext.state === "suspended") {
        _audioContext.resume();
      }
    },
    playDropSound() {
      _playSound(600, 0.08, "sine");
    },
    playSuccessSound() {
      _playSound(800, 0.15, "sine");
    },
    playErrorSound() {
      _playSound(200, 0.2, "square");
    },
    setSoundEnabled(enabled) {
      _soundEnabled = !!enabled;
    },
    isSoundEnabled() {
      return _soundEnabled;
    },
    getPrefersReducedMotion() {
      return _prefersReducedMotion;
    },
    destroy() {
      if (_audioContext) {
        _audioContext.close();
        _audioContext = null;
      }
    }
  };
}
var audio_feedback_default = { VERSION, createAudioFeedback };
export {
  MODULE_ID,
  VERSION,
  createAudioFeedback,
  audio_feedback_default as default
};
