// Migrado para TypeScript: 2026-02-25
'use strict';
// Cards - Central Registry v1.0.0-ENTERPRISE
// Adapters para todos os cards

// --- Interfaces ---

interface CardModule {
  default?: unknown;
  [key: string]: unknown;
}

interface CardsInfo {
  version: string;
  moduleId: string;
  totalCards: number;
  loadedCards: number;
}

type CardImporter = () => Promise<CardModule>;

export const VERSION: string = '1.0.0-ENTERPRISE';
export const MODULE_ID: string = 'cards-registry';

const cardImports: Record<string, CardImporter> = {
  'card-01': () => import('./card-01/index.js'),
  'card-02': () => import('./card-02/index.js'),
  'card-03': () => import('./card-03/index.js'),
  'card-04': () => import('./card-04/index.js'),
  'card-05': () => import('./card-05/index.js'),
  'card-06': () => import('./card-06/index.js'),
  'card-07': () => import('./card-07/index.js'),
  'card-08': () => import('./card-08/index.js'),
  'card-09': () => import('./card-09/index.js'),
  'card-10': () => import('./card-10/index.js'),
  'card-11': () => import('./card-11/index.js'),
  'card-12': () => import('./card-12/index.js')
};

const loadedCards: Map<string, unknown> = new Map();

export async function loadCard(cardId: string): Promise<unknown> {
  if (loadedCards.has(cardId)) return loadedCards.get(cardId);

  const importer = cardImports[cardId];
  if (!importer) {
    console.warn(`[cards-registry] Card não encontrado: ${cardId}`);
    return null;
  }

  try {
    const module: CardModule = await importer();
    loadedCards.set(cardId, module.default || module);
    return loadedCards.get(cardId);
  } catch (error) {
    console.error(`[cards-registry] Erro ao carregar ${cardId}:`, error);
    return null;
  }
}

export function getAvailableCards(): string[] {
  return Object.keys(cardImports);
}

export function getInfo(): CardsInfo {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    totalCards: Object.keys(cardImports).length,
    loadedCards: loadedCards.size
  };
}

export default { loadCard, getAvailableCards, getInfo, VERSION, MODULE_ID };
