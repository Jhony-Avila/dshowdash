import { CanvasCore } from "./engine/canvas-core.js";
import { RafLoop } from "./engine/raf-loop.js";
import { Governor } from "./engine/governor.js";
import { Compositor } from "./engine/compositor.js";
import { SkyEffect } from "./effects/sky.js";
import { liveCount } from "./effects/live-probe.js";
import { WeatherController } from "./weather/weather-controller.js";
import { ForecastBand } from "./forecast/forecast-band.js";
import { IntroController } from "./intro/intro-controller.js";
const MODULE_ID = "panel-home.weather-fx";
const VERSION = "0.8.0-INTRO-STORM";
const VIS_POLL_MS = 200;
const RUN_WINDOW_MS = 150;
const HERO_FLASH_MIN_MS = 450;
const HERO_FLASH_MAX_MS = 6e3;
class WeatherFxEngine {
  host = null;
  canvas = null;
  loop = null;
  governor = null;
  compositor = null;
  weather = null;
  // pipeline clima real (Etapa 3)
  forecastBand = null;
  // faixa previsão 7 dias (overlay DOM)
  intro = null;
  // sequência de entrada (1× por mount)
  _heroFlashed = false;
  // flash-herói da tempestade: 1× por mount
  _mountTs = 0;
  // performance.now() do mount (janela do flash-herói)
  reducedMQ = null;
  ac = null;
  visTimer = null;
  // poll de offsetParent
  _wasVisible = false;
  // borda oculto->visível (leitura imediata do clima)
  mounted = false;
  mountCount = 0;
  // diagnóstico: sobe a cada mount (re-mount?)
  frameCount = 0;
  statTimer = 0;
  totalFrames = 0;
  lastTickTs = 0;
  // performance.now() do último frame RENDERIZADO
  _env = { width: 0, height: 0, dpr: 2, isDay: true, reducedMotion: false, timeScale: 1, densityScale: 1 };
  mount(host) {
    if (this.mounted || !host) return;
    if (this.loop || this.canvas || this.visTimer !== null) this.destroy();
    this.mounted = true;
    this.mountCount++;
    this.host = host;
    this.canvas = new CanvasCore();
    this.canvas.mount(host);
    const ctx = this.canvas.context;
    if (!ctx) {
      this.destroy();
      return;
    }
    this.governor = new Governor((ss) => {
      if (this.canvas) this.canvas.setSupersample(ss);
    });
    this.compositor = new Compositor(ctx);
    this.reducedMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.ac = new AbortController();
    window.addEventListener("resize", this.onResize, { signal: this.ac.signal });
    document.addEventListener("visibilitychange", this.onVisibilityChange, { signal: this.ac.signal });
    this.compositor.setScene([new SkyEffect()], this.updateEnv());
    this.loop = new RafLoop(this.onTick);
    this.loop.start();
    this.lastTickTs = performance.now();
    this._wasVisible = this.isHostVisible();
    this.visTimer = setInterval(this.pollVisibility, VIS_POLL_MS);
    this.forecastBand = new ForecastBand();
    this.forecastBand.mount(host);
    this.weather = new WeatherController({
      crossfadeTo: (scene, dur) => {
        if (this.compositor) this.compositor.crossfadeTo(scene, this.updateEnv(), dur);
      },
      isVisible: () => this.isHostVisible() && !document.hidden,
      onForecast: (fc) => {
        if (this.forecastBand) this.forecastBand.update(fc);
      }
    });
    this.weather.start();
    this._heroFlashed = false;
    this._mountTs = performance.now();
    this.intro = new IntroController(host, !!(this.reducedMQ && this.reducedMQ.matches));
    this.intro.start(this._mountTs);
  }
  // offsetParent === null ⇔ display:none em si ou num ancestral (mecanismo do shell)
  isHostVisible() {
    return !!this.host && this.host.offsetParent !== null;
  }
  pollVisibility = () => {
    if (!this.loop) return;
    const vis = this.isHostVisible();
    if (vis) {
      this.loop.resume();
      if (!this._wasVisible && this.weather) this.weather.onVisible();
    } else {
      this.loop.pause();
    }
    this._wasVisible = vis;
  };
  onVisibilityChange = () => {
    if (!document.hidden && this.weather) this.weather.onVisible();
  };
  updateEnv() {
    const c = this.canvas;
    const reduced = !!(this.reducedMQ && this.reducedMQ.matches);
    const e = this._env;
    e.width = c.width;
    e.height = c.height;
    e.dpr = c.dpr;
    e.isDay = true;
    e.reducedMotion = reduced;
    e.timeScale = reduced ? 0.45 : 1;
    e.densityScale = (this.governor ? this.governor.densityScale : 1) * (this.intro ? this.intro.densityMultiplier : 1);
    return e;
  }
  onResize = () => {
    if (this.canvas) this.canvas.resize();
  };
  onTick = (dt, raw) => {
    if (this.canvas && !this.canvas.isAttached()) {
      this.destroy();
      return;
    }
    if (!this.isHostVisible()) {
      if (this.loop) this.loop.pause();
      return;
    }
    if (!this.compositor || !this.governor || !this.canvas) return;
    this.lastTickTs = performance.now();
    if (this.intro && !this.intro.isDone) this.intro.tick(this.lastTickTs);
    if (!this._heroFlashed && this.compositor.hasLightning()) {
      const since = this.lastTickTs - this._mountTs;
      const reduced = !!(this.reducedMQ && this.reducedMQ.matches);
      if (!reduced && since >= HERO_FLASH_MIN_MS && since <= HERO_FLASH_MAX_MS) {
        this._heroFlashed = this.compositor.strikeLightning();
      }
    }
    this.governor.sampleFrame(raw);
    const env = this.updateEnv();
    this.compositor.update(dt * env.timeScale, env);
    const ctx = this.canvas.context;
    if (!ctx) return;
    ctx.clearRect(0, 0, env.width, env.height);
    this.compositor.render(env);
    this.frameCount++;
    this.totalFrames++;
    this.statTimer += raw;
    if (this.statTimer >= 0.5) {
      this.governor.sampleFps(this.frameCount / this.statTimer);
      this.frameCount = 0;
      this.statTimer = 0;
    }
  };
  destroy() {
    if (this.intro) {
      this.intro.destroy();
      this.intro = null;
    }
    this._heroFlashed = false;
    this._mountTs = 0;
    if (this.weather) {
      this.weather.stop();
      this.weather = null;
    }
    if (this.forecastBand) {
      this.forecastBand.destroy();
      this.forecastBand = null;
    }
    if (this.visTimer !== null) {
      clearInterval(this.visTimer);
      this.visTimer = null;
    }
    if (this.loop) {
      this.loop.destroy();
      this.loop = null;
    }
    if (this.compositor) {
      this.compositor.destroy();
      this.compositor = null;
    }
    if (this.canvas) {
      this.canvas.destroy();
      this.canvas = null;
    }
    if (this.ac) {
      this.ac.abort();
      this.ac = null;
    }
    this.governor = null;
    this.reducedMQ = null;
    this.host = null;
    this.frameCount = 0;
    this.statTimer = 0;
    this._wasVisible = false;
    this.mounted = false;
  }
  get isMounted() {
    return this.mounted;
  }
  healthCheck() {
    const now = performance.now();
    const running = this.mounted && now - this.lastTickTs < RUN_WINDOW_MS;
    const visible = this.isHostVisible();
    return {
      status: !this.mounted ? "IDLE" : running ? "HEALTHY" : "PAUSED",
      moduleId: MODULE_ID,
      version: VERSION,
      mounted: this.mounted,
      visible,
      loopRunning: running,
      // reflete a REALIDADE, não um flag interno
      frames: this.totalFrames,
      // congela quando oculto (aba OU painel)
      mountCount: this.mountCount,
      // diagnóstico: sobe se estiver re-montando
      canvasCount: typeof document !== "undefined" ? document.querySelectorAll("canvas[data-weather-fx]").length : 0,
      // deve ser 1
      listenersBound: !!this.ac,
      effects: this.compositor ? this.compositor.activeCount : 0,
      // camadas vivas (2 durante o fade)
      fading: this.compositor ? this.compositor.isFading : false,
      // crossfade em curso?
      liveCount: liveCount(),
      // sonda anti-leak unificada (live-probe)
      weather: this.weather ? this.weather.currentWeather() : null,
      // clima real + estado mapeado
      introDone: this.intro ? this.intro.isDone : true,
      // sequência de entrada concluída?
      introMult: this.intro ? Number(this.intro.densityMultiplier.toFixed(3)) : 1,
      // rampa (1 = fora do intro)
      heroFlashed: this._heroFlashed,
      // flash-herói disparou? (só tempestade)
      hasLightning: this.compositor ? this.compositor.hasLightning() : false,
      targetHz: this.governor ? this.governor.targetHz : 0
    };
  }
}
const engine = new WeatherFxEngine();
function mount(host) {
  engine.mount(host);
}
function destroy() {
  engine.destroy();
}
var weather_fx_default = engine;
export {
  MODULE_ID,
  VERSION,
  weather_fx_default as default,
  destroy,
  engine,
  mount
};
