// ═══════════════════════════════════════════════════════════════
// platform-runtime / _aggregator.ts — fachada pública, em FONTE
// ═══════════════════════════════════════════════════════════════
// POR QUE ESTE ARQUIVO EXISTE (2026-07-30)
//
// O alvo tinha como entry de build o próprio `index.ts`, que faz
// `export * from './dist/platform-runtime.bundle.js'`. O build se alimentava do
// artefato: rebuildar re-empacotava o bundle antigo e descartava as fontes,
// saindo VERDE. Correção em `platform-orchestrator.ts` & cia. nunca chegaria ao
// browser.
//
// Os NOVE submódulos existem completos em fonte, cada um com `export default`
// (um objeto com os métodos). O que só existia no bundle era esta camada:
// `init`, `getRuntime`, `isInitialized`, `info` e os ports do runtime.
//
// Reconstruído LENDO O BUNDLE. Equivalências conferidas:
//   Be=VERSION  x=MODULE_ID  ee=Ports  mt=_getPort  dt=injectPorts
//   gt=getPortsSnapshot  Et=_log  U=_inicializado
//   yt=init  $=getRuntime  It=isInitialized  Ot=info  Dt=default
//   Ue=EventDomains  $e=ErrorBoundary  we=PerformanceBudget  Ne=StateEngineV3
//   ve=RegionManager  be=PlatformOrchestrator  he=ManifestV3
//   nn=FederationLoader  fn=MicroappRegistry
//
// ⚠️ O módulo exporta `getPortsSnapshot`, mas dentro do objeto `default` o mesmo
// valor se chama `getPorts`. Não são dois: é UM valor com dois nomes, e ambos
// precisam existir com o nome certo em cada lugar.
// ⚠️ `init` NÃO inicializa os nove. Chama SEIS, nesta ordem exata: events,
// errors, performance, state, regions (com `document`), orchestrator.
// Manifest, loader e registry entram no runtime sem `init`.
// ⚠️ Este módulo NÃO expõe nada em `window` — diferente do theme-manager.
// ═══════════════════════════════════════════════════════════════

import { createCorePorts } from '/core/runtime/ports-profiles.js';

import ErrorBoundaryDefault      from './error-boundary-global.js';
import EventDomainsDefault       from './event-domains.js';
import FederationLoaderDefault   from './federation-loader.js';
import ManifestV3Default         from './manifest-v3.js';
import MicroappRegistryDefault   from './microapp-registry.js';
import PerformanceBudgetDefault  from './performance-budget.js';
import PlatformOrchestratorDefault from './platform-orchestrator.js';
import RegionManagerDefault      from './region-manager.js';
import StateEngineV3Default      from './state-engine-v3.js';

export const VERSION = '3.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'platform-runtime';

export const ErrorBoundary         = ErrorBoundaryDefault;
export const EventDomains          = EventDomainsDefault;
export const FederationLoader      = FederationLoaderDefault;
export const ManifestV3            = ManifestV3Default;
export const MicroappRegistry      = MicroappRegistryDefault;
export const PerformanceBudget     = PerformanceBudgetDefault;
export const PlatformOrchestrator  = PlatformOrchestratorDefault;
export const RegionManager         = RegionManagerDefault;
export const StateEngineV3         = StateEngineV3Default;

// ── Ports e log (viviam só no bundle) ────────────────────────────
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _getPort = (n: string) => Ports.get(n);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
/** Nome do EXPORT. Dentro do `default` o mesmo valor chama-se `getPorts`. */
export const getPortsSnapshot = () => Ports.snapshot();

/** Sem buffer e sem try/catch — é assim no bundle. */
function _log(level: string, message: string, data?: unknown) {
  const logger: any = _getPort('logger');
  if (logger && logger[level]) logger[level](`[${MODULE_ID}] ${message}`, data);
}

let _inicializado = false;

/**
 * Inicializa o runtime. IDEMPOTENTE: se já inicializado devolve o runtime sem
 * reexecutar nada.
 *
 * A ORDEM é a do bundle e não é arbitrária — events primeiro (os outros emitem
 * durante o próprio init), regions antes do orchestrator (que precisa das
 * regiões montadas).
 *
 * O `.catch` devolve o runtime MESMO em erro, apenas logando. Propagar aqui
 * derrubaria o boot inteiro por causa de um submódulo.
 */
export function init(options: Record<string, any> = {}) {
  if (_inicializado) return Promise.resolve(getRuntime());
  return Promise.resolve()
    .then(() => {
      EventDomainsDefault.init(options);
      ErrorBoundaryDefault.init(options);
      PerformanceBudgetDefault.init(options);
      StateEngineV3Default.init(options);
      RegionManagerDefault.initRegions(options.document || document);
      PlatformOrchestratorDefault.init(options);
      _inicializado = true;
      return getRuntime();
    })
    .catch((e) => {
      _log('error', 'Init error:', e);
      return getRuntime();
    });
}

export function getRuntime() {
  return {
    manifest: ManifestV3Default,
    loader: FederationLoaderDefault,
    registry: MicroappRegistryDefault,
    regions: RegionManagerDefault,
    orchestrator: PlatformOrchestratorDefault,
    state: StateEngineV3Default,
    errors: ErrorBoundaryDefault,
    performance: PerformanceBudgetDefault,
    events: EventDomainsDefault,
  };
}

export function isInitialized() { return _inicializado; }

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized(),
    initialized: _inicializado,
    manifest: ManifestV3Default.info(),
  };
}

// ⚠️ Aqui é `getPorts`, não `getPortsSnapshot` — o bundle nomeia assim DENTRO
// do default, mesmo exportando o outro nome no topo.
export default {
  init, getRuntime, isInitialized, info,
  VERSION, MODULE_ID,
  injectPorts,
  getPorts: getPortsSnapshot,
};
