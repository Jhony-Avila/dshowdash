const MODULE_ID = "panel-home.weather-fx.engine.raf-loop";
const VERSION = "0.2.0-ETAPA1";
class RafLoop {
  tick;
  rafId = 0;
  running = false;
  // started até destroy
  tabHidden = false;
  // document.hidden
  extPaused = false;
  // host invisível (IntersectionObserver)
  lastT = 0;
  ac = null;
  constructor(tick) {
    this.tick = tick;
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.tabHidden = document.hidden;
    this.ac = new AbortController();
    document.addEventListener("visibilitychange", this.onVisibility, { signal: this.ac.signal });
    this.sync();
  }
  // pausa/retoma por VISIBILIDADE DO HOST (chamado pelo IntersectionObserver do engine)
  pause() {
    if (!this.extPaused) {
      this.extPaused = true;
      this.sync();
    }
  }
  resume() {
    if (this.extPaused) {
      this.extPaused = false;
      this.sync();
    }
  }
  onVisibility = () => {
    this.tabHidden = document.hidden;
    this.sync();
  };
  get shouldRun() {
    return this.running && !this.tabHidden && !this.extPaused;
  }
  // liga/desliga o RAF conforme shouldRun, sem salto de dt ao religar
  sync() {
    if (this.shouldRun && !this.rafId) {
      this.lastT = performance.now();
      this.rafId = requestAnimationFrame(this.frame);
    } else if (!this.shouldRun && this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }
  frame = (now) => {
    if (!this.shouldRun) {
      this.rafId = 0;
      return;
    }
    const raw = (now - this.lastT) / 1e3;
    this.lastT = now;
    let dt = raw;
    if (dt > 0.05) dt = 0.05;
    this.tick(dt, raw, now);
    if (this.shouldRun) this.rafId = requestAnimationFrame(this.frame);
    else this.rafId = 0;
  };
  get isRunning() {
    return this.running;
  }
  // started (não destruído)
  get isActive() {
    return this.rafId !== 0;
  }
  // rodando frames de fato
  get isPaused() {
    return this.running && this.rafId === 0;
  }
  destroy() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    if (this.ac) {
      this.ac.abort();
      this.ac = null;
    }
  }
}
var raf_loop_default = RafLoop;
export {
  MODULE_ID,
  RafLoop,
  VERSION,
  raf_loop_default as default
};
