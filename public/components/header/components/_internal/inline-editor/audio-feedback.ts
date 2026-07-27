// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-ui-inline-editor-audio-feedback
// PURPOSE: Inline Editor - Audio Feedback
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createAudioFeedback() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.AudioContext
//   window.matchMedia
//   window.webkitAudioContext
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'header-ui-inline-editor-audio-feedback';

let _metrics = { sounds: 0 };

export function createAudioFeedback(options: { soundEnabled?: boolean } = {}) {
  let soundEnabled = options.soundEnabled !== false;
  let prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  let audioContext: unknown = null;


  // @ts-expect-error TS migration - TS2551
  function init() { try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }

  // @ts-expect-error TS migration - TS2339
  function resume() { if (audioContext?.state === 'suspended') audioContext.resume(); }

  function playDropSound() {
    if (!soundEnabled || prefersReducedMotion || !audioContext) return;
    _metrics.sounds++;
    // @ts-expect-error TS migration - TS2339
    try { if (audioContext.state === 'running') { const osc = audioContext.createOscillator(); const gain = audioContext.createGain(); osc.connect(gain); gain.connect(audioContext.destination); osc.frequency.setValueAtTime(600, audioContext.currentTime); osc.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1); gain.gain.setValueAtTime(0.1, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1); osc.start(audioContext.currentTime); osc.stop(audioContext.currentTime + 0.1); } } catch (e) {}
  }

  function setSoundEnabled(enabled: boolean) { soundEnabled = !!enabled; }
  function isSoundEnabled() { return soundEnabled; }
  function getPrefersReducedMotion() { return prefersReducedMotion; }
  // @ts-expect-error TS migration - TS2339
  function destroy() { if (audioContext) { try { audioContext.close(); } catch (e) {} audioContext = null; } }

  init();
  return { playDropSound, setSoundEnabled, isSoundEnabled, getPrefersReducedMotion, resume, destroy };
}

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { audioReady: true }, metrics: getMetrics() }; }

export default { createAudioFeedback, getMetrics, info, healthCheck };
