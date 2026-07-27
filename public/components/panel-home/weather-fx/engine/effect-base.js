const MODULE_ID = "panel-home.weather-fx.engine.effect-base";
const VERSION = "0.1.0-ETAPA1";
class EffectBase {
  id;
  params = {};
  constructor(id) {
    this.id = id;
  }
  // aloca pools / pré-renderiza sprites / cria gradientes (uma vez)
  init(_ctx, _env) {
  }
  // avança a simulação — delta-time, independente de framerate
  update(_dt, _env) {
  }
  // desenha aplicando opacity (0..1) — o compositor usa no crossfade
  render(_ctx, _env, _opacity) {
  }
  // reconfigura em runtime (intensidade, dia/noite…)
  setParams(params) {
    this.params = { ...this.params, ...params };
  }
  // libera pools, listeners, timers — REGRA ANTI-LEAK. Idempotente.
  destroy() {
  }
}
var effect_base_default = EffectBase;
export {
  EffectBase,
  MODULE_ID,
  VERSION,
  effect_base_default as default
};
