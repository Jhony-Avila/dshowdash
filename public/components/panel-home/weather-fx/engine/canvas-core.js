const MODULE_ID = "panel-home.weather-fx.engine.canvas-core";
const VERSION = "0.1.0-ETAPA1";
class CanvasCore {
  host = null;
  canvas = null;
  ctx = null;
  ss = 2;
  // supersample atual (governor ajusta)
  width = 0;
  height = 0;
  dpr = 2;
  mount(host) {
    this.host = host;
    document.querySelectorAll("canvas[data-weather-fx]").forEach((el) => el.remove());
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    const c = document.createElement("canvas");
    c.setAttribute("data-weather-fx", "1");
    c.style.position = "absolute";
    c.style.inset = "0";
    c.style.width = "100%";
    c.style.height = "100%";
    c.style.zIndex = "0";
    c.style.pointerEvents = "none";
    host.insertBefore(c, host.firstChild);
    this.canvas = c;
    this.ctx = c.getContext("2d", { alpha: true });
    this.resize();
  }
  setSupersample(ss) {
    if (ss !== this.ss) {
      this.ss = ss;
      this.resize();
    }
  }
  resize() {
    if (!this.canvas || !this.ctx || !this.host) return;
    const rect = this.host.getBoundingClientRect();
    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));
    this.dpr = Math.min(Math.max(this.ss, 1), 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
  get context() {
    return this.ctx;
  }
  // true enquanto o canvas está anexado ao documento — sinal do auto-desmonte
  isAttached() {
    return !!this.canvas && document.contains(this.canvas);
  }
  destroy() {
    if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    this.canvas = null;
    this.ctx = null;
    this.host = null;
  }
}
var canvas_core_default = CanvasCore;
export {
  CanvasCore,
  MODULE_ID,
  VERSION,
  canvas_core_default as default
};
