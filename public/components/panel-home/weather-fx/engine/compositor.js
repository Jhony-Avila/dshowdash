const MODULE_ID = "panel-home.weather-fx.engine.compositor";
const VERSION = "0.2.0-ETAPA2";
class Compositor {
  ctx;
  current = [];
  incoming = [];
  // usado no crossfade (Etapa 2)
  fadeT = 0;
  fadeDur = 0;
  constructor(ctx) {
    this.ctx = ctx;
  }
  // Etapa 1: troca imediata de cena.
  setScene(effects, env) {
    this.destroyLayers(this.current);
    this.current = effects.map((e) => ({ effect: e, opacity: 1 }));
    for (const l of this.current) l.effect.init(this.ctx, env);
  }
  // Etapa 2: transição por OPACITY. O que entra cresce (0→1), o que sai
  // decresce (1→0) e é destruído ao fim (finishFade). TETO DE 2 CENAS:
  // se já houver fade em curso (rajada), conclui-se o atual ANTES de
  // abrir o novo — nunca coexistem 3+ conjuntos.
  crossfadeTo(effects, env, durationS) {
    if (this.fadeDur > 0 || this.incoming.length) this.finishFade();
    if (durationS <= 0) {
      this.setScene(effects, env);
      return;
    }
    this.incoming = effects.map((e) => ({ effect: e, opacity: 0 }));
    for (const l of this.incoming) l.effect.init(this.ctx, env);
    this.fadeT = 0;
    this.fadeDur = durationS;
  }
  update(dt, env) {
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
  render(env) {
    for (const l of this.current) l.effect.render(this.ctx, env, l.opacity);
    for (const l of this.incoming) l.effect.render(this.ctx, env, l.opacity);
  }
  finishFade() {
    this.destroyLayers(this.current);
    this.current = this.incoming;
    this.incoming = [];
    for (const l of this.current) l.opacity = 1;
    this.fadeDur = 0;
    this.fadeT = 0;
  }
  destroyLayers(layers) {
    for (const l of layers) {
      try {
        l.effect.destroy();
      } catch (_e) {
      }
    }
    layers.length = 0;
  }
  get activeCount() {
    return this.current.length + this.incoming.length;
  }
  get isFading() {
    return this.fadeDur > 0;
  }
  // Há uma camada de raios ativa (tempestade)? Duck-typing por id — sem acoplar o tipo.
  hasLightning() {
    for (const l of this.current) if (l.effect.id === "lightning") return true;
    for (const l of this.incoming) if (l.effect.id === "lightning") return true;
    return false;
  }
  // Dispara um clarão imediato nas camadas de raios ativas (herói da intro). Retorna
  // true se disparou em alguma (só a tempestade tem lightning → auto-gated por estado).
  strikeLightning() {
    let struck = false;
    const hit = (l) => {
      const e = l.effect;
      if (l.effect.id === "lightning" && typeof e.strike === "function") {
        e.strike();
        struck = true;
      }
    };
    for (const l of this.current) hit(l);
    for (const l of this.incoming) hit(l);
    return struck;
  }
  destroy() {
    this.destroyLayers(this.current);
    this.destroyLayers(this.incoming);
  }
}
var compositor_default = Compositor;
export {
  Compositor,
  MODULE_ID,
  VERSION,
  compositor_default as default
};
