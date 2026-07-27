'use strict';
// =============================================================
// weather-fx / index — FACHADA do engine (integração b2).
// mount(wrapper) no mount do painel, destroy() no unmount.
//
// GO-LIVE (2026-07-01): removido o andaime dev (window.__weatherFxDev,
// transitionTo, WeatherController.forceState, test-fill). Produção usa só
// o pipeline de clima real. live-probe/liveCount e placeholder-scene
// PERMANECEM (observabilidade anti-leak + fallback do scene-factory).
//
// v0.6.0 (Lote A): estados ceu-limpo/chuva-leve/chuva-forte passam a
// montar EFEITOS REAIS (via scene-factory no controller); os outros 5
// seguem placeholder. Sonda anti-leak unificada em live-probe.liveCount().
//
// v0.5.0 (Etapa 3): clima REAL -> estado -> crossfade. WeatherController
// (poller próprio 5min gated + state-map WMO) instanciado no mount.
//
// v0.4.0 (Etapa 2): crossfade por opacity (compositor.crossfadeTo).
// healthCheck expõe fading + liveCount (sonda anti-leak).
//
// v0.3.0: healthCheck é FONTE DE VERDADE (deriva do último frame
// renderizado + offsetParent ao vivo). Visibilidade por POLL de
// offsetParent (robusto p/ display:none/hidden do shell) no lugar do
// IntersectionObserver (que falso-pausava a home visível).
// =============================================================
import { CanvasCore } from './engine/canvas-core.js';
import { RafLoop } from './engine/raf-loop.js';
import { Governor } from './engine/governor.js';
import { Compositor } from './engine/compositor.js';
import { SkyEffect } from './effects/sky.js';
import { liveCount } from './effects/live-probe.js';
import { WeatherController } from './weather/weather-controller.js';
import { ForecastBand } from './forecast/forecast-band.js';
import { IntroController } from './intro/intro-controller.js';
import { type FxEnv } from './engine/effect-base.js';

export const MODULE_ID = 'panel-home.weather-fx';
export const VERSION = '0.8.0-INTRO-STORM';

const VIS_POLL_MS = 200;      // poll de visibilidade (leve; resolve os dois sentidos)
const RUN_WINDOW_MS = 150;    // frame renderizado nos últimos 150ms = "rodando de fato"
// Flash-herói da tempestade = pontuação de ENTRADA: 1× quando a cena de raios aparece
// dentro da janela inicial do mount (a cena real entra por crossfade ~2-5s após o fetch,
// pode passar do intro de 3s). O teto evita disparar em troca de clima muito depois
// (aí o ritmo AMBIENTE do lightning assume). reduced-motion não dispara.
const HERO_FLASH_MIN_MS = 450;
const HERO_FLASH_MAX_MS = 6000;

class WeatherFxEngine {
  private host: HTMLElement | null = null;
  private canvas: CanvasCore | null = null;
  private loop: RafLoop | null = null;
  private governor: Governor | null = null;
  private compositor: Compositor | null = null;
  private weather: WeatherController | null = null;   // pipeline clima real (Etapa 3)
  private forecastBand: ForecastBand | null = null;   // faixa previsão 7 dias (overlay DOM)
  private intro: IntroController | null = null;       // sequência de entrada (1× por mount)
  private _heroFlashed = false;                        // flash-herói da tempestade: 1× por mount
  private _mountTs = 0;                                // performance.now() do mount (janela do flash-herói)
  private reducedMQ: MediaQueryList | null = null;
  private ac: AbortController | null = null;
  private visTimer: number | null = null;     // poll de offsetParent
  private _wasVisible = false;                 // borda oculto->visível (leitura imediata do clima)
  private mounted = false;
  private mountCount = 0;                      // diagnóstico: sobe a cada mount (re-mount?)
  private frameCount = 0; private statTimer = 0; private totalFrames = 0;
  private lastTickTs = 0;                      // performance.now() do último frame RENDERIZADO

  private _env: FxEnv = { width: 0, height: 0, dpr: 2, isDay: true, reducedMotion: false, timeScale: 1, densityScale: 1 };

  mount(host: HTMLElement): void {
    if (this.mounted || !host) return;
    // self-heal: destrói qualquer sobra de um ciclo anterior antes de montar (anti-órfão)
    if (this.loop || this.canvas || this.visTimer !== null) this.destroy();
    this.mounted = true;
    this.mountCount++;
    this.host = host;

    this.canvas = new CanvasCore();
    this.canvas.mount(host);
    const ctx = this.canvas.context;
    if (!ctx) { this.destroy(); return; }

    this.governor = new Governor((ss) => { if (this.canvas) this.canvas.setSupersample(ss); });
    this.compositor = new Compositor(ctx);
    this.reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

    this.ac = new AbortController();
    window.addEventListener('resize', this.onResize, { signal: this.ac.signal });
    // aba volta ao foco -> leitura imediata do clima (o gate do poller já cobre o pulo)
    document.addEventListener('visibilitychange', this.onVisibilityChange, { signal: this.ac.signal });

    this.compositor.setScene([new SkyEffect()], this.updateEnv());

    this.loop = new RafLoop(this.onTick);
    this.loop.start();

    // Visibilidade REAL do host: o shell esconde com display:none/hidden (offsetParent === null).
    // Poll leve resolve os dois sentidos de forma robusta — sem a fragilidade do IO.
    this.lastTickTs = performance.now();
    this._wasVisible = this.isHostVisible();
    this.visTimer = setInterval(this.pollVisibility, VIS_POLL_MS) as unknown as number;

    // Etapa 3: pipeline de clima real. Host adapter encapsula o compositor
    // (crossfade) e a visibilidade (gate do poller). start() faz a 1ª leitura.
    // faixa de previsão 7 dias (overlay DOM na .ph-content, abaixo da saudação;
    // alimentada pelo MESMO payload do clima — sem 2º fetch)
    this.forecastBand = new ForecastBand();
    this.forecastBand.mount(host);

    this.weather = new WeatherController({
      crossfadeTo: (scene, dur): void => { if (this.compositor) this.compositor.crossfadeTo(scene, this.updateEnv(), dur); },
      isVisible: (): boolean => this.isHostVisible() && !document.hidden,
      onForecast: (fc): void => { if (this.forecastBand) this.forecastBand.update(fc); }
    });
    this.weather.start();

    // Sequência de entrada ("Weather Reveal"): revela canvas+saudação (CSS via
    // classe no host) e faz a RAMPA de densidade (herói) que os efeitos assumem
    // ao vivo. Dirigida pelo RAF (onTick) — sem timer próprio. 1× por mount.
    this._heroFlashed = false;
    this._mountTs = performance.now();
    this.intro = new IntroController(host, !!(this.reducedMQ && this.reducedMQ.matches));
    this.intro.start(this._mountTs);
  }

  // offsetParent === null ⇔ display:none em si ou num ancestral (mecanismo do shell)
  private isHostVisible(): boolean { return !!this.host && this.host.offsetParent !== null; }

  private pollVisibility = (): void => {
    if (!this.loop) return;
    const vis = this.isHostVisible();
    if (vis) {
      this.loop.resume();
      if (!this._wasVisible && this.weather) this.weather.onVisible();   // home voltou: leitura imediata
    } else {
      this.loop.pause();
    }
    this._wasVisible = vis;
  };

  private onVisibilityChange = (): void => {
    if (!document.hidden && this.weather) this.weather.onVisible();       // aba voltou ao foco
  };

  private updateEnv(): FxEnv {
    const c = this.canvas as CanvasCore;
    const reduced = !!(this.reducedMQ && this.reducedMQ.matches);
    const e = this._env;
    e.width = c.width; e.height = c.height; e.dpr = c.dpr;
    e.isDay = true;
    e.reducedMotion = reduced;
    e.timeScale = reduced ? 0.45 : 1;
    // densidade do governor × multiplicador do intro (rampa de entrada; 1 fora do intro)
    e.densityScale = (this.governor ? this.governor.densityScale : 1)
      * (this.intro ? this.intro.densityMultiplier : 1);
    return e;
  }

  private onResize = (): void => { if (this.canvas) this.canvas.resize(); };

  private onTick = (dt: number, raw: number): void => {
    // TEARDOWN: canvas removido do DOM de fato → destrói (defesa p/ remoção real)
    if (this.canvas && !this.canvas.isAttached()) { this.destroy(); return; }
    // OCULTO (display:none): pausa e NÃO renderiza — não atualiza lastTickTs → vira PAUSED
    if (!this.isHostVisible()) { if (this.loop) this.loop.pause(); return; }
    if (!this.compositor || !this.governor || !this.canvas) return;

    this.lastTickTs = performance.now();       // marca frame REALMENTE renderizado (verdade do healthCheck)
    if (this.intro && !this.intro.isDone) this.intro.tick(this.lastTickTs);   // avança a rampa/entrada
    // "momento herói" da tempestade: UM clarão quando a cena de raios aparece na janela
    // inicial do mount. Auto-gated: hasLightning() só é true na tempestade → nada dispara
    // nos outros estados. reduced-motion não dispara (o lightning já suprime, e aqui também).
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

    this.frameCount++; this.totalFrames++; this.statTimer += raw;
    if (this.statTimer >= 0.5) {
      this.governor.sampleFps(this.frameCount / this.statTimer);
      this.frameCount = 0; this.statTimer = 0;
    }
  };

  destroy(): void {
    if (this.intro) { this.intro.destroy(); this.intro = null; }      // solta a classe da entrada (idempotente)
    this._heroFlashed = false; this._mountTs = 0;
    if (this.weather) { this.weather.stop(); this.weather = null; }   // para o poller do clima
    if (this.forecastBand) { this.forecastBand.destroy(); this.forecastBand = null; }   // remove faixa + <style> (anti-leak)
    if (this.visTimer !== null) { clearInterval(this.visTimer); this.visTimer = null; }
    if (this.loop) { this.loop.destroy(); this.loop = null; }
    if (this.compositor) { this.compositor.destroy(); this.compositor = null; }
    if (this.canvas) { this.canvas.destroy(); this.canvas = null; }
    if (this.ac) { this.ac.abort(); this.ac = null; }   // remove resize + visibilitychange
    this.governor = null; this.reducedMQ = null; this.host = null;
    this.frameCount = 0; this.statTimer = 0;
    this._wasVisible = false;
    this.mounted = false;
  }

  get isMounted(): boolean { return this.mounted; }

  healthCheck(): Record<string, unknown> {
    const now = performance.now();
    // VERDADE: rodando = renderizou um frame nos últimos RUN_WINDOW_MS
    const running = this.mounted && (now - this.lastTickTs) < RUN_WINDOW_MS;
    const visible = this.isHostVisible();
    return {
      status: !this.mounted ? 'IDLE' : (running ? 'HEALTHY' : 'PAUSED'),
      moduleId: MODULE_ID, version: VERSION,
      mounted: this.mounted,
      visible,
      loopRunning: running,                    // reflete a REALIDADE, não um flag interno
      frames: this.totalFrames,                // congela quando oculto (aba OU painel)
      mountCount: this.mountCount,             // diagnóstico: sobe se estiver re-montando
      canvasCount: (typeof document !== 'undefined')
        ? document.querySelectorAll('canvas[data-weather-fx]').length : 0,  // deve ser 1
      listenersBound: !!this.ac,
      effects: this.compositor ? this.compositor.activeCount : 0,   // camadas vivas (2 durante o fade)
      fading: this.compositor ? this.compositor.isFading : false,   // crossfade em curso?
      liveCount: liveCount(),                                       // sonda anti-leak unificada (live-probe)
      weather: this.weather ? this.weather.currentWeather() : null, // clima real + estado mapeado
      introDone: this.intro ? this.intro.isDone : true,             // sequência de entrada concluída?
      introMult: this.intro ? Number(this.intro.densityMultiplier.toFixed(3)) : 1, // rampa (1 = fora do intro)
      heroFlashed: this._heroFlashed,                              // flash-herói disparou? (só tempestade)
      hasLightning: this.compositor ? this.compositor.hasLightning() : false,
      targetHz: this.governor ? this.governor.targetHz : 0
    };
  }
}

// singleton — o hook importa mount/destroy
export const engine = new WeatherFxEngine();
export function mount(host: HTMLElement): void { engine.mount(host); }
export function destroy(): void { engine.destroy(); }
export default engine;
