const MODULE_ID = "panel-home.weather-fx.intro.intro-controller";
const VERSION = "1.0.0-INTRO";
const INTRO_CLASS = "wfx-intro";
const BUILD_MS = 1800;
const TOTAL_MS = 3e3;
const TOTAL_RM_MS = 500;
const START_DENSITY = 0.15;
function easeOut(t) {
  const c = 1 - t;
  return 1 - c * c * c;
}
class IntroController {
  host;
  reduced;
  startTs = -1;
  _mult = 1;
  // multiplicador de densidade lido pelo engine
  _done = false;
  constructor(host, reducedMotion) {
    this.host = host;
    this.reduced = reducedMotion;
  }
  // Arma a sequência: marca t0 e liga a classe que dispara o CSS. Uma vez só.
  start(nowMs) {
    if (this.startTs >= 0 || !this.host) return;
    this.startTs = nowMs;
    this._mult = this.reduced ? 1 : START_DENSITY;
    this.host.classList.add(INTRO_CLASS);
  }
  // Avança pelo relógio do RAF do engine. Atualiza a rampa e finaliza no fim.
  tick(nowMs) {
    if (this._done || this.startTs < 0) return;
    const elapsed = nowMs - this.startTs;
    const total = this.reduced ? TOTAL_RM_MS : TOTAL_MS;
    if (!this.reduced) {
      const k = elapsed <= 0 ? 0 : elapsed >= BUILD_MS ? 1 : elapsed / BUILD_MS;
      this._mult = START_DENSITY + (1 - START_DENSITY) * easeOut(k);
    }
    if (elapsed >= total) this.finish();
  }
  // Multiplicador aplicado a env.densityScale (1 = sem efeito). Nunca 0.
  get densityMultiplier() {
    return this._done ? 1 : this._mult;
  }
  get isDone() {
    return this._done;
  }
  finish() {
    this._done = true;
    this._mult = 1;
    if (this.host) this.host.classList.remove(INTRO_CLASS);
  }
  // Idempotente — solta a classe e trava em "pronto". Sem timers/listeners.
  destroy() {
    this._done = true;
    this._mult = 1;
    if (this.host) {
      this.host.classList.remove(INTRO_CLASS);
      this.host = null;
    }
  }
}
var intro_controller_default = IntroController;
export {
  IntroController,
  MODULE_ID,
  VERSION,
  intro_controller_default as default
};
