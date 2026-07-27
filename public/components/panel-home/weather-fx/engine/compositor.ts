'use strict';
// =============================================================
// weather-fx / engine / compositor
// Orquestra os efeitos ativos como CAMADAS com opacity. Na Etapa 1
// há só uma cena (current). O crossfade da Etapa 2 usa incoming +
// fadeDur: os dois conjuntos coexistem durante o fade e o que SAI é
// destruído (destroy) — regra anti-leak. Teto de 2 cenas vivas.
// =============================================================
import { EffectBase, type FxEnv } from './effect-base.js';
export const MODULE_ID = 'panel-home.weather-fx.engine.compositor';
export const VERSION = '0.2.0-ETAPA2';

interface Layer { effect: EffectBase; opacity: number; }

export class Compositor {
  private ctx: CanvasRenderingContext2D;
  private current: Layer[] = [];
  private incoming: Layer[] = [];       // usado no crossfade (Etapa 2)
  private fadeT = 0; private fadeDur = 0;

  constructor(ctx: CanvasRenderingContext2D) { this.ctx = ctx; }

  // Etapa 1: troca imediata de cena.
  setScene(effects: EffectBase[], env: FxEnv): void {
    this.destroyLayers(this.current);
    this.current = effects.map(e => ({ effect: e, opacity: 1 }));
    for (const l of this.current) l.effect.init(this.ctx, env);
  }

  // Etapa 2: transição por OPACITY. O que entra cresce (0→1), o que sai
  // decresce (1→0) e é destruído ao fim (finishFade). TETO DE 2 CENAS:
  // se já houver fade em curso (rajada), conclui-se o atual ANTES de
  // abrir o novo — nunca coexistem 3+ conjuntos.
  crossfadeTo(effects: EffectBase[], env: FxEnv, durationS: number): void {
    if (this.fadeDur > 0 || this.incoming.length) this.finishFade();  // colapsa p/ 1 antes de somar
    if (durationS <= 0) { this.setScene(effects, env); return; }      // sem fade => swap imediato (mesmo anti-leak)
    this.incoming = effects.map(e => ({ effect: e, opacity: 0 }));
    for (const l of this.incoming) l.effect.init(this.ctx, env);
    this.fadeT = 0; this.fadeDur = durationS;
  }

  update(dt: number, env: FxEnv): void {
    if (this.fadeDur > 0) {
      this.fadeT += dt;
      const k = Math.min(1, this.fadeT / this.fadeDur);
      for (const l of this.incoming) l.opacity = k;
      for (const l of this.current) l.opacity = 1 - k;
      if (k >= 1) this.finishFade();
    }
    for (const l of this.current) l.effect.update(dt, env);
    for (const l of this.incoming) l.effect.update(dt, env);
  }

  render(env: FxEnv): void {
    for (const l of this.current) l.effect.render(this.ctx, env, l.opacity);
    for (const l of this.incoming) l.effect.render(this.ctx, env, l.opacity);
  }

  private finishFade(): void {
    this.destroyLayers(this.current);      // o que saiu é destruído (anti-leak)
    this.current = this.incoming; this.incoming = [];
    for (const l of this.current) l.opacity = 1;   // promovido assume opacity plena
    this.fadeDur = 0; this.fadeT = 0;
  }

  private destroyLayers(layers: Layer[]): void {
    for (const l of layers) {
      try { l.effect.destroy(); } catch (_e) { /* teardown defensivo — nunca vaza no unmount */ }
    }
    layers.length = 0;
  }

  get activeCount(): number { return this.current.length + this.incoming.length; }
  get isFading(): boolean { return this.fadeDur > 0; }

  // Há uma camada de raios ativa (tempestade)? Duck-typing por id — sem acoplar o tipo.
  hasLightning(): boolean {
    for (const l of this.current) if (l.effect.id === 'lightning') return true;
    for (const l of this.incoming) if (l.effect.id === 'lightning') return true;
    return false;
  }

  // Dispara um clarão imediato nas camadas de raios ativas (herói da intro). Retorna
  // true se disparou em alguma (só a tempestade tem lightning → auto-gated por estado).
  strikeLightning(): boolean {
    let struck = false;
    const hit = (l: Layer): void => {
      const e = l.effect as unknown as { strike?: () => void };
      if (l.effect.id === 'lightning' && typeof e.strike === 'function') { e.strike(); struck = true; }
    };
    for (const l of this.current) hit(l);
    for (const l of this.incoming) hit(l);
    return struck;
  }

  destroy(): void {
    this.destroyLayers(this.current);
    this.destroyLayers(this.incoming);
  }
}
export default Compositor;
