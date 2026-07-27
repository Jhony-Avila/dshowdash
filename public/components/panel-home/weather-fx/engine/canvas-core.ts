'use strict';
// =============================================================
// weather-fx / engine / canvas-core
// Possui o <canvas> de fundo do painel: cria/insere ATRÁS do card,
// gerencia high-DPI (supersample do governor) e resize. Não roda
// loop nem desenha efeito — só o alvo de render.
// =============================================================
export const MODULE_ID = 'panel-home.weather-fx.engine.canvas-core';
export const VERSION = '0.1.0-ETAPA1';

export class CanvasCore {
  private host: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private ss = 2;            // supersample atual (governor ajusta)
  width = 0; height = 0; dpr = 2;

  mount(host: HTMLElement): void {
    this.host = host;
    // dedupe: remove qualquer canvas nosso anterior (evita duplicata em re-mount)
    document.querySelectorAll('canvas[data-weather-fx]').forEach((el) => el.remove());
    // defense-in-depth: garante contexto de posicionamento pro canvas absoluto
    // (o CSS do painel também define .ph-wrapper{position:relative}).
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

    const c = document.createElement('canvas');
    c.setAttribute('data-weather-fx', '1');
    c.style.position = 'absolute';
    c.style.inset = '0';
    c.style.width = '100%';
    c.style.height = '100%';
    c.style.zIndex = '0';          // atrás do card (card fica em z-index:1)
    c.style.pointerEvents = 'none'; // nunca intercepta clique/hover do card
    // primeiro filho → camada de fundo
    host.insertBefore(c, host.firstChild);

    this.canvas = c;
    // alpha:true → o fundo do painel/página aparece sob efeitos translúcidos
    this.ctx = c.getContext('2d', { alpha: true });
    this.resize();
  }

  setSupersample(ss: number): void {
    if (ss !== this.ss) { this.ss = ss; this.resize(); }
  }

  resize(): void {
    if (!this.canvas || !this.ctx || !this.host) return;
    const rect = this.host.getBoundingClientRect();
    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));
    this.dpr = Math.min(Math.max(this.ss, 1), 2);   // teto 2x
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); // desenha em coords CSS
  }

  get context(): CanvasRenderingContext2D | null { return this.ctx; }

  // true enquanto o canvas está anexado ao documento — sinal do auto-desmonte
  isAttached(): boolean { return !!this.canvas && document.contains(this.canvas); }

  destroy(): void {
    if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    this.canvas = null; this.ctx = null; this.host = null;
  }
}
export default CanvasCore;
