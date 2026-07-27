'use strict';
// =============================================================
// weather-fx / engine / raf-loop
// Loop RAF ÚNICO. Pausa por DOIS sinais independentes:
//  - aba oculta (document.hidden) — tratado internamente
//  - host oculto (troca de painel; o shell faz display:none/hidden) —
//    via pause()/resume(), acionado pelo IntersectionObserver do engine.
// Roda só quando started && !abaOculta && !hostOculto. Retoma sem salto
// de dt. O listener de visibilidade é removido no destroy (AbortController).
// =============================================================
export const MODULE_ID = 'panel-home.weather-fx.engine.raf-loop';
export const VERSION = '0.2.0-ETAPA1';

export type TickFn = (dt: number, raw: number, now: number) => void;

export class RafLoop {
  private tick: TickFn;
  private rafId = 0;
  private running = false;      // started até destroy
  private tabHidden = false;    // document.hidden
  private extPaused = false;    // host invisível (IntersectionObserver)
  private lastT = 0;
  private ac: AbortController | null = null;

  constructor(tick: TickFn) { this.tick = tick; }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.tabHidden = document.hidden;
    this.ac = new AbortController();
    document.addEventListener('visibilitychange', this.onVisibility, { signal: this.ac.signal });
    this.sync();
  }

  // pausa/retoma por VISIBILIDADE DO HOST (chamado pelo IntersectionObserver do engine)
  pause(): void  { if (!this.extPaused) { this.extPaused = true;  this.sync(); } }
  resume(): void { if (this.extPaused)  { this.extPaused = false; this.sync(); } }

  private onVisibility = (): void => { this.tabHidden = document.hidden; this.sync(); };

  private get shouldRun(): boolean { return this.running && !this.tabHidden && !this.extPaused; }

  // liga/desliga o RAF conforme shouldRun, sem salto de dt ao religar
  private sync(): void {
    if (this.shouldRun && !this.rafId) {
      this.lastT = performance.now();
      this.rafId = requestAnimationFrame(this.frame);
    } else if (!this.shouldRun && this.rafId) {
      cancelAnimationFrame(this.rafId); this.rafId = 0;
    }
  }

  private frame = (now: number): void => {
    if (!this.shouldRun) { this.rafId = 0; return; }
    const raw = (now - this.lastT) / 1000;
    this.lastT = now;
    let dt = raw; if (dt > 0.05) dt = 0.05;   // clamp
    this.tick(dt, raw, now);
    if (this.shouldRun) this.rafId = requestAnimationFrame(this.frame);
    else this.rafId = 0;
  };

  get isRunning(): boolean { return this.running; }     // started (não destruído)
  get isActive(): boolean { return this.rafId !== 0; }  // rodando frames de fato
  get isPaused(): boolean { return this.running && this.rafId === 0; }

  destroy(): void {
    this.running = false;
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = 0; }
    if (this.ac) { this.ac.abort(); this.ac = null; }  // remove o visibilitychange
  }
}
export default RafLoop;
