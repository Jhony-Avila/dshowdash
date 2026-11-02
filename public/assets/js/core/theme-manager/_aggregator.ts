// ═══════════════════════════════════════════════════════════════
// theme-manager / _aggregator.ts — fachada pública, em FONTE
// ═══════════════════════════════════════════════════════════════
// POR QUE ESTE ARQUIVO EXISTE (2026-07-30)
//
// O alvo tinha como entry de build o próprio `index.ts`, que faz
// `export * from './dist/theme-manager.bundle.js'`. O build se alimentava do
// artefato: rebuildar re-empacotava o bundle antigo e descartava as fontes,
// saindo VERDE. Correção em `core/engine.ts` & cia. nunca chegaria ao browser.
//
// Os OITO submódulos existem completos em fonte. Só esta camada vivia dentro
// do bundle minificado: o objeto `ThemeManager`, o buffer de log
// (`getLogs`/`setDebug`) e os ports do módulo.
//
// Reconstruído LENDO O BUNDLE. Equivalências conferidas:
//   m=VERSION  O=MODULE_ID  x=Ports  wr=_getPort  vr=injectPorts  yr=getPorts
//   he=_debug  K=buffer     oe=_log  Se=getLogs   _r=setDebug     Ar=getVersion
//   Ae=ThemeManager (= default)
//   T=ThemeEngine  I=ThemeLifecycle  l=ThemeStore  h=ThemeTelemetry
//   j=ThemeCatalog  Sr=ThemeApplier  Er=ThemeDetector  Cr=ThemeHelpers
//
// ⚠️ Importar os OBJETOS, não `import * as`. Cada submódulo exporta UM
// objeto-fachada com os métodos dentro; o namespace teria o objeto como
// propriedade e toda chamada viraria `undefined is not a function`. Foi o erro
// cometido no theme-tokens-loader, que passou build, tsc e diff de exports e
// só apareceu ao chamar o primeiro método no navegador.
// ⚠️ `getVersion` de cada submódulo é FUNÇÃO SOLTA do módulo, não método do
// objeto — os dois padrões convivem no mesmo arquivo.
// ═══════════════════════════════════════════════════════════════

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

import { ThemeApplier,   getVersion as vApplier }   from './core/applier.js';
import { ThemeDetector,  getVersion as vDetector }  from './core/detector.js';
import { ThemeEngine,    getVersion as vEngine }    from './core/engine.js';
import { ThemeLifecycle, getVersion as vLifecycle } from './core/lifecycle.js';
import { ThemeStore,     getVersion as vStore }     from './state/store.js';
import { ThemeTelemetry, getVersion as vTelemetry } from './telemetry/tracker.js';
import { ThemeHelpers,   getVersion as vHelpers }   from './utils/helpers.js';
import { ThemeCatalog,   getVersion as vCatalog }   from './themes/index.js';

export const VERSION = '5.1.0-STRICT-MODE';
export const MODULE_ID = 'theme-manager';

export { ThemeApplier, ThemeCatalog, ThemeDetector, ThemeEngine,
         ThemeHelpers, ThemeLifecycle, ThemeStore, ThemeTelemetry };

// ── Ports e log (viviam só no bundle) ────────────────────────────
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _getPort = (n: string) => Ports.get(n);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
export function getVersion() { return VERSION; }

let _debug = false;
const _buffer: Array<Record<string, unknown>> = [];

/** Buffer de 50 entradas + repasse ao port `logger`. Nunca lança. */
function _log(level: string, message: string, data: Record<string, unknown> = {}) {
  try {
    const prefixo = `[${MODULE_ID}]`;
    _buffer.push({ level, message, data, ts: Date.now() });
    if (_buffer.length > 50) _buffer.shift();
    const logger: any = _getPort('logger');
    if (logger != null && logger[level]) logger[level](prefixo, message, data);
  } catch { /* log nunca derruba quem chamou */ }
}

export function getLogs() { return [..._buffer]; }
export function setDebug(v: boolean) { _debug = !!v; }

const versoes = () => ({
  main: VERSION, store: vStore(), catalog: vCatalog(), helpers: vHelpers(),
  detector: vDetector(), applier: vApplier(), engine: vEngine(),
  lifecycle: vLifecycle(), telemetry: vTelemetry(),
});

// ── A fachada ────────────────────────────────────────────────────
export const ThemeManager = {
  async init(opts: Record<string, unknown> = {}) {
    ThemeTelemetry.trackLifecycle('init:start');
    const r: any = await ThemeLifecycle.init(opts);
    if (r.success) {
      _log('info', `Theme Manager ${VERSION} initialized - Theme: ${r.themeId}`);
      ThemeTelemetry.trackLifecycle('init:complete', { themeId: r.themeId });
    } else {
      // Ordem dos argumentos como no bundle: (erro, contexto).
      ThemeTelemetry.trackError(r.error, { phase: 'init' });
    }
    return r;
  },

  reset()   { ThemeTelemetry.trackLifecycle('reset');   return ThemeLifecycle.reset(); },
  cleanup() { ThemeTelemetry.trackLifecycle('cleanup'); return ThemeLifecycle.cleanup(); },

  isInitialized() { return ThemeLifecycle.isInitialized(); },
  // `isReady` exige os DOIS: ciclo de vida E engine.
  isReady() { return ThemeLifecycle.isInitialized() && ThemeEngine.isInitialized(); },

  changeTheme(id: string, origem = 'user') {
    // O tema ANTERIOR é lido antes da troca — a telemetria registra a
    // transição, não o estado final.
    const anterior = ThemeStore.get('currentTheme');
    const r: any = ThemeEngine.changeTheme(id, origem);
    if (r.changed) ThemeTelemetry.trackThemeChange(id, origem, anterior);
    return r;
  },

  toggleTheme()       { return ThemeEngine.toggleTheme(); },
  getTheme()          { return ThemeStore.getState(); },
  getCurrentThemeId() { return ThemeStore.get('currentTheme'); },
  getAvailableThemes(){ return ThemeCatalog.getAllThemes(); },
  isValidTheme(id: string) { return ThemeCatalog.isValidThemeId(id); },
  subscribe(fn: unknown)   { return ThemeStore.subscribe(fn as any); },

  info() {
    return {
      name: MODULE_ID, version: VERSION,
      status: ThemeLifecycle.isInitialized() ? 'READY' : 'NOT_INITIALIZED',
      currentTheme: ThemeStore.get('currentTheme'),
      source: ThemeStore.get('source'),
      availableThemes: (ThemeCatalog as any).AVAILABLE_THEME_IDS,
      portsInitialized: Ports.isInitialized(),
      telemetry: ThemeTelemetry.getTrackerStats(),
      components: {
        store: vStore(), catalog: vCatalog(), helpers: vHelpers(),
        detector: vDetector(), applier: vApplier(), engine: vEngine(),
        lifecycle: vLifecycle(), telemetry: vTelemetry(),
      },
    };
  },

  healthCheck() {
    const h: any = ThemeLifecycle.healthCheck();
    return {
      healthy: h.healthy, version: VERSION, moduleId: MODULE_ID,
      initialized: this.isInitialized(), ready: this.isReady(),
      currentTheme: this.getCurrentThemeId(),
      portsInitialized: Ports.isInitialized(),
      components: h.components, issues: h.issues,
    };
  },

  debug: {
    getEventLog:     () => ThemeTelemetry.getEventLog(),
    getRecentEvents: (n?: number) => ThemeTelemetry.getRecentEvents(n as any),
    getTrackerStats: () => ThemeTelemetry.getTrackerStats(),
    getStore:        () => ThemeStore.toJSON(),
    getStatus:       () => ThemeLifecycle.getStatus(),
    getLogs:         () => getLogs(),
    versions: versoes(),
  },

  getVersion()  { return VERSION; },
  getModuleId() { return MODULE_ID; },
  setDebug(v: boolean) { _debug = !!v; },
  getLogs() { return getLogs(); },
  injectPorts,
  getPorts,
};

// ⚠️ recordViolation(type: string, details: object) — SEMPRE 2 argumentos.
if (typeof window !== 'undefined') {
  if (isStrict()) {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED',
      { module: MODULE_ID, property: 'window.ThemeManager', version: VERSION });
    _log('info', `Theme Manager ${VERSION} loaded (strict mode: window.ThemeManager blocked)`);
  } else {
    (window as any).ThemeManager = ThemeManager;
    // `window.ThemeManagerVersion` só existe FORA do strict — como no bundle.
    (window as any).ThemeManagerVersion = VERSION;
    _log('info', `Theme Manager ${VERSION} loaded (window.ThemeManager available)`);
  }
  // `__dev` é exposto NOS DOIS casos.
  (window as any).__dev = (window as any).__dev || {};
  (window as any).__dev.themeManager = ThemeManager;
}

export default ThemeManager;
