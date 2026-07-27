// Migrado para TypeScript: 2026-02-25
// App UI - Central Export v2.0.0-ENTERPRISE
// RESPONSAVEL: Expor biblioteca oficial de componentes UI (cards, panels, layout, primitives)
// NAO FAZ: Logica de negocio - apenas exposicao de componentes
// Consumidores devem importar de /app/ui, nao de /public/components/panels/*

// Imports para uso local (PANELS_MAP / CARDS_MAP)
import { getAvailablePanels } from './panels/index.ts';
import { getAvailableCards } from './cards/index.ts';

// --- Interfaces ---

interface ModuleInfo {
  version: string;
  moduleId: string;
  source: string;
  registries: {
    panels: string;
    cards: string;
    layout: string;
    primitives: string;
  };
}

interface ComponentMap {
  get: (id: string) => Promise<unknown>;
  has: (id: string) => boolean;
  keys: () => string[];
}

interface AppUIDefault {
  VERSION: string;
  MODULE_ID: string;
  info: () => ModuleInfo;
  getPanelComponent: (panelId: string) => Promise<unknown>;
  getCardComponent: (cardId: string) => Promise<unknown>;
  PANELS_MAP: ComponentMap;
  CARDS_MAP: ComponentMap;
  PanelsRegistry: () => Promise<typeof import('./panels/index.ts')>;
  CardsRegistry: () => Promise<typeof import('./cards/index.ts')>;
  Layout: () => Promise<typeof import('./layout/index.ts')>;
  Primitives: () => Promise<typeof import('./primitives/index.ts')>;
}

export const VERSION: string = '2.0.0-ENTERPRISE';
export const MODULE_ID: string = 'app-ui';

// Primitives & Layout
export * from './primitives/index.ts';
export * from './layout/index.ts';
export { default as Primitives } from './primitives/index.ts';
export { default as Layout } from './layout/index.ts';

// Panels Registry - Lazy loading
export {
  loadPanel,
  getAvailablePanels,
  getPanelsByCategory,
  getInfo as getPanelsInfo,
  VERSION as PANELS_VERSION,
  MODULE_ID as PANELS_MODULE_ID
} from './panels/index.ts';
export { default as PanelsRegistry } from './panels/index.ts';

// Cards Registry - Lazy loading
export {
  loadCard,
  getAvailableCards,
  getInfo as getCardsInfo,
  VERSION as CARDS_VERSION,
  MODULE_ID as CARDS_MODULE_ID
} from './cards/index.ts';
export { default as CardsRegistry } from './cards/index.ts';

// Factory helpers para Main/Orchestrator
export async function getPanelComponent(panelId: string): Promise<unknown> {
  const { loadPanel } = await import('./panels/index.ts');
  return loadPanel(panelId);
}

export async function getCardComponent(cardId: string): Promise<unknown> {
  const { loadCard } = await import('./cards/index.ts');
  return loadCard(cardId);
}

// Maps para compatibilidade
export const PANELS_MAP: ComponentMap = {
  get: (id: string): Promise<unknown> => getPanelComponent(id),
  has: (id: string): boolean => getAvailablePanels().includes(id),
  keys: (): string[] => getAvailablePanels()
};

export const CARDS_MAP: ComponentMap = {
  get: (id: string): Promise<unknown> => getCardComponent(id),
  has: (id: string): boolean => getAvailableCards().includes(id),
  keys: (): string[] => getAvailableCards()
};

// Info
export function info(): ModuleInfo {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    source: '/app/ui/index.ts',
    registries: {
      panels: '/app/ui/panels/index.ts',
      cards: '/app/ui/cards/index.ts',
      layout: '/app/ui/layout/index.ts',
      primitives: '/app/ui/primitives/index.ts'
    }
  };
}

export default {
  VERSION,
  MODULE_ID,
  info,
  getPanelComponent,
  getCardComponent,
  PANELS_MAP,
  CARDS_MAP,
  PanelsRegistry: () => import('./panels/index.ts'),
  CardsRegistry: () => import('./cards/index.ts'),
  Layout: () => import('./layout/index.ts'),
  Primitives: () => import('./primitives/index.ts')
} as AppUIDefault;
