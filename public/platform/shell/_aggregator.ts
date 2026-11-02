// ═══════════════════════════════════════════════════════════════
// platform-shell / _aggregator.ts — fachada pública, reconstruída em fonte
// ═══════════════════════════════════════════════════════════════
// POR QUE ESTE ARQUIVO EXISTE (2026-07-30)
//
// O alvo `platform-shell` tinha como entry de build o próprio `index.ts`:
//
//     export * from './dist/platform-shell.bundle.js';
//
// O build se alimentava do PRÓPRIO artefato: rebuildar re-empacotava o bundle
// antigo e descartava as fontes `.ts`, saindo VERDE. Correção em
// `header-shell.ts` & cia. NUNCA chegaria ao browser. Mesma armadilha que
// segurou a correção de CSRF do telemetry-core por 15 dias.
//
// As fontes dos quatro sub-shells existem e estão completas. O que só existia
// DENTRO do bundle minificado era esta camada: os nomes `HeaderShell`,
// `SidebarShell`, `FooterShell`, `LayoutRegions` (namespaces dos módulos),
// mais `init`, `getShell` e `info` do shell agregado.
//
// Reconstruído LENDO O BUNDLE, não por dedução. Equivalências conferidas:
//   W = LayoutRegions   Z = HeaderShell   ee = SidebarShell   te = FooterShell
//   oe = init   R = getShell   re = info   ue = default
//   U = VERSION '3.1.0-P2-ENTERPRISE'   T = MODULE_ID 'platform-shell'
//
// ⚠️ `LayoutRegions` NÃO tem `init` — no bundle, `init` chama exatamente três:
// header, sidebar e footer, nessa ordem. Incluir regions aqui inventaria
// comportamento que o artefato em produção não tem.
// ═══════════════════════════════════════════════════════════════

import * as LayoutRegionsNS from './layout-regions.js';
import * as HeaderShellNS from './header-shell.js';
import * as SidebarShellNS from './sidebar-shell.js';
import * as FooterShellNS from './footer-shell.js';

export const VERSION = '3.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'platform-shell';

// Os namespaces são a API exportada — é o que o bundle fazia com os objetos
// congelados `W`/`Z`/`ee`/`te`.
export const LayoutRegions = LayoutRegionsNS;
export const HeaderShell = HeaderShellNS;
export const SidebarShell = SidebarShellNS;
export const FooterShell = FooterShellNS;

let _inicializado = false;

/**
 * Inicializa os sub-shells. IDEMPOTENTE — como no bundle, a segunda chamada
 * apenas devolve o shell, sem reinicializar (o guard `D` do artefato).
 */
export function init(options: Record<string, unknown> = {}) {
  if (!_inicializado) {
    HeaderShellNS.init(options);
    SidebarShellNS.init(options);
    FooterShellNS.init(options);
    _inicializado = true;
  }
  return getShell();
}

export function getShell() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    regions: LayoutRegionsNS,
    header: HeaderShellNS,
    sidebar: SidebarShellNS,
    footer: FooterShellNS,
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _inicializado,
    header: HeaderShellNS.info(),
    sidebar: SidebarShellNS.info(),
    footer: FooterShellNS.info(),
  };
}

// O default do bundle tem SÓ estes cinco campos — não é o módulo inteiro.
export default { VERSION, MODULE_ID, init, getShell, info };
