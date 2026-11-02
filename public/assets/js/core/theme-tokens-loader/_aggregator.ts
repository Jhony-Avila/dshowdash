// ═══════════════════════════════════════════════════════════════
// theme-tokens-loader / _aggregator.ts — fachada pública, em FONTE
// ═══════════════════════════════════════════════════════════════
// POR QUE ESTE ARQUIVO EXISTE (2026-07-30)
//
// O alvo tinha como entry de build o próprio `index.ts`:
//     export * from './dist/theme-tokens-loader.bundle.js';
// O build se alimentava do artefato: rebuildar re-empacotava o bundle antigo e
// descartava as fontes, saindo VERDE. Correção em `core/registry.ts` & cia.
// nunca chegaria ao browser.
//
// Os SETE submódulos existem completos em fonte. O que só existia dentro do
// bundle minificado era esta camada: o objeto `ThemeTokensLoader`, o buffer de
// log (`getLogs`/`setDebug`) e os ports do módulo.
//
// Reconstruído LENDO O BUNDLE, não por dedução. Equivalências conferidas:
//   k=VERSION  O=MODULE_ID  S=Ports  Ye=_getPort  Ze=injectPorts  Fe=getPorts
//   V=_debug   b=buffer     P=_log   J=getLogs    et=setDebug     Qe=getVersion
//   q=ThemeTokensLoader (= default)
//   h=TokensLifecycle  c=TokensRegistry  d=TokensStore  I=TokensLoader
//   y=TokensTelemetry  qe=CssParser      Je=TokensHelpers
//
// ⚠️ `getTokens()` lê do REGISTRY (`c`), não do store — no bundle é
// `c.getAllTokens()`. Trocar a fonte devolveria outro objeto.
// ⚠️ `load()` NÃO é alias de `init()`: se já inicializado faz `reload()`.
// ═══════════════════════════════════════════════════════════════

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

// ⚠️ Importar os OBJETOS, não os namespaces dos módulos.
// Erro que cometi e que só o navegador pegou: usei `import * as X` e chamei
// `X.getAllTokens()`. Esses submódulos NÃO têm funções soltas — eles exportam
// UM objeto-fachada (`TokensRegistry`, `TokensStore`, …) com os métodos dentro.
// O namespace tem `TokensRegistry` como propriedade, não `getAllTokens`, então
// tudo virava `undefined is not a function` na primeira chamada de `status()`.
// No bundle os aliases `c`/`d`/`I`/`h`/`y` são esses OBJETOS.
import { CssParser, getVersion as vCssParser } from './utils/css-parser.js';
import { TokensHelpers, getVersion as vHelpers } from './utils/helpers.js';
import { TokensLifecycle, LIFECYCLE_STATUS as LS, getVersion as vLifecycle } from './core/lifecycle.js';
import { TokensLoader, getVersion as vLoader } from './core/loader.js';
import { TokensRegistry, TOKEN_GROUPS as TG, getVersion as vRegistry } from './core/registry.js';
import { TokensStore, getVersion as vStore } from './state/store.js';
import { TokensTelemetry, getVersion as vTelemetry } from './telemetry/tracker.js';

export const VERSION = '2.1.0-STRICT-MODE';
export const MODULE_ID = 'theme-tokens-loader';

// Reexporta os submódulos e as duas constantes públicas, exatamente como o
// bundle fazia (namespaces congelados).
export { CssParser, TokensHelpers, TokensLifecycle, TokensLoader, TokensRegistry, TokensStore, TokensTelemetry };
export const LIFECYCLE_STATUS = LS;
export const TOKEN_GROUPS = TG;

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

const vTodos = () => ({
  main: VERSION,
  store: vStore(),
  registry: vRegistry(),
  loader: vLoader(),
  lifecycle: vLifecycle(),
  helpers: vHelpers(),
  cssParser: vCssParser(),
  telemetry: vTelemetry(),
});

// ── A fachada ────────────────────────────────────────────────────
export const ThemeTokensLoader = {
  async init(opts: Record<string, unknown> = {}) {
    TokensTelemetry.trackLifecycle('init:start');
    const r: any = await TokensLifecycle.init(opts);
    if (r.ok) {
      _log('info', `Theme Tokens Loader ${VERSION} initialized`);
      TokensTelemetry.trackLifecycle('init:complete', { tokensLoaded: r.summary?.totalTokens });
    } else {
      TokensTelemetry.trackError('init', r.error);
    }
    return r;
  },

  // NÃO é alias de init: já inicializado → reload.
  async load(opts: Record<string, unknown> = {}) {
    return TokensLifecycle.isInitialized() ? TokensLifecycle.reload() : this.init(opts);
  },

  reset() {
    TokensTelemetry.trackLifecycle('reset');
    return TokensLifecycle.reset();
  },

  async reload() {
    TokensTelemetry.trackLifecycle('reload:start');
    const r: any = await TokensLifecycle.reload();
    TokensTelemetry.trackLifecycle('reload:complete', { ok: r.ok });
    return r;
  },

  isInitialized() { return TokensLifecycle.isInitialized(); },

  getTokens() { return TokensRegistry.getAllTokens(); },
  getTokensByGroup(g: string) { return TokensRegistry.getTokens(g); },
  getGlobalTokens() { return TokensRegistry.getGlobalTokens(); },
  getComponentTokens() { return TokensRegistry.getComponentTokens(); },
  getGroups() { return TokensRegistry.getAllGroups(); },
  hasGroup(g: string) { return TokensRegistry.hasGroup(g); },
  getToken(g: string, nome: string) {
    const t: any = TokensRegistry.getTokens(g);
    return t ? t[nome] : undefined;
  },

  status() {
    const s: any = TokensStore.getSnapshot();
    const l: any = TokensLoader.getState();
    return {
      initialized: TokensLifecycle.isInitialized(),
      status: TokensLifecycle.getStatus(),
      sourcesLoaded: { css: s.sources.css.length, js: s.sources.js.length },
      tokensCount: s.stats.totalTokens,
      groupsCount: s.stats.groupCount,
      lastUpdated: s.lastUpdated,
      errors: l.errorCount,
    };
  },

  info() {
    const resumo: any = TokensRegistry.getSummary();
    const ciclo: any = TokensLifecycle.getLifecycleInfo();
    return {
      name: MODULE_ID, version: VERSION,
      status: ciclo.status, initialized: ciclo.initialized,
      groups: resumo.groups, totalGroups: resumo.totalGroups, totalTokens: resumo.totalTokens,
      sources: TokensLoader.getSources(),
      lifecycle: ciclo,
      portsInitialized: Ports.isInitialized(),
      components: {
        store: vStore(), registry: vRegistry(),
        loader: vLoader(), lifecycle: vLifecycle(),
        helpers: vHelpers(), cssParser: vCssParser(),
        telemetry: vTelemetry(),
      },
    };
  },

  healthCheck() {
    const h: any = TokensLifecycle.healthCheck();
    return {
      healthy: h.healthy, version: VERSION, moduleId: MODULE_ID,
      initialized: this.isInitialized(), status: this.status(),
      portsInitialized: Ports.isInitialized(),
      components: h.components, issues: h.issues,
    };
  },

  debug: {
    getStore: () => TokensStore.getSnapshot(),
    getEventLog: () => TokensTelemetry.getEventLog(),
    getRecentEvents: (n?: number) => TokensTelemetry.getRecentEvents(n as any),
    getTrackerStats: () => TokensTelemetry.getTrackerStats(),
    getSources: () => TokensLoader.getSources(),
    getLoaderState: () => TokensLoader.getState(),
    getRegistrySummary: () => TokensRegistry.getSummary(),
    getLogs: () => getLogs(),
    TOKEN_GROUPS,
    versions: vTodos(),
  },

  getVersion() { return VERSION; },
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
      { module: MODULE_ID, property: 'window.ThemeTokensLoader', version: VERSION });
    _log('info', `Theme Tokens Loader ${VERSION} loaded (strict mode: window.ThemeTokensLoader blocked)`);
  } else {
    (window as any).ThemeTokensLoader = ThemeTokensLoader;
    _log('info', `Theme Tokens Loader ${VERSION} loaded (window.ThemeTokensLoader available)`);
  }
  // `__dev` é exposto NOS DOIS casos — inclusive sob strict.
  (window as any).__dev = (window as any).__dev || {};
  (window as any).__dev.themeTokensLoader = ThemeTokensLoader;
}

export default ThemeTokensLoader;
