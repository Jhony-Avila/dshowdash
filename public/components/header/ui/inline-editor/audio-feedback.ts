// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/ui/inline-editor/audio-feedback
// PURPOSE: Audio feedback (tones) for drag-drop and save actions via Web Audio API
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   createAudioFeedback(options) — factory returning audio feedback manager
// BROWSER APIs:
//   window.AudioContext / (window as any).webkitAudioContext — Web Audio API
//   window.matchMedia("prefers-reduced-motion") — accessibility check
// ═══════════════════════════════════════════════════════════════
// Inline Editor - Audio Feedback
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B04: var → const/let
// Gerencia feedback sonoro do editor
'use strict';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/ui/inline-editor/audio-feedback';

export function createAudioFeedback(options: Record<string,unknown>) {
  options = options || {};
  
  let _soundEnabled = options.soundEnabled !== false;
  let _audioContext: unknown = null;
  const _prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  function _initAudioContext() {
    if (_audioContext) return;
    try {
      _audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      _soundEnabled = false;
    }
  }
  
  function _playSound(frequency: unknown, duration: number, type: string) {
    if (!_soundEnabled || !_audioContext || _prefersReducedMotion) return;
    
    try {
      // @ts-expect-error TS migration - TS2339
      const oscillator = _audioContext.createOscillator();
      // @ts-expect-error TS migration - TS2339
      const gainNode = _audioContext.createGain();
      
      oscillator.connect(gainNode);
      // @ts-expect-error TS migration - TS2339
      gainNode.connect(_audioContext.destination);
      
      oscillator.frequency.value = frequency || 440;
      oscillator.type = type || 'sine';
      
      // @ts-expect-error TS migration - TS2339
      gainNode.gain.setValueAtTime(0.1, _audioContext.currentTime);
      // @ts-expect-error TS migration - TS2339
      gainNode.gain.exponentialRampToValueAtTime(0.01, _audioContext.currentTime + (duration || 0.1));
      
      // @ts-expect-error TS migration - TS2339
      oscillator.start(_audioContext.currentTime);
      // @ts-expect-error TS migration - TS2339
      oscillator.stop(_audioContext.currentTime + (duration || 0.1));
    } catch (e) {
      // Silently fail
    }
  }
  
  return {
    resume() {
      _initAudioContext();
      // @ts-expect-error TS migration - TS2339
      if (_audioContext && _audioContext.state === 'suspended') {
        // @ts-expect-error TS migration - TS2339
        _audioContext.resume();
      }
    },
    
    playDropSound() {
      _playSound(600, 0.08, 'sine');
    },
    
    playSuccessSound() {
      _playSound(800, 0.15, 'sine');
    },
    
    playErrorSound() {
      _playSound(200, 0.2, 'square');
    },
    
    setSoundEnabled(enabled: boolean) {
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
        // @ts-expect-error TS migration - TS2339
        _audioContext.close();
        _audioContext = null;
      }
    }
  };
}

export default { VERSION, createAudioFeedback };
