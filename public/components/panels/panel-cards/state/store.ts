// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-cards/state/store
// PURPOSE: Panel Cards - Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getState() — exported function
//   get() — exported function
//   set() — exported function
//   setCards() — exported function
//   addLoadingCard() — exported function
//   removeLoadingCard() — exported function
//   addErrorCard() — exported function
//   clearErrorCard() — exported function
//   reset() — exported function
//   subscribe() — exported function
//   isInitialized() — exported function
//   setInitialized() — exported function
//   info() — exported function
//   ... and 1 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-cards/state/store';

type StoreState = {
  cards: Record<string, unknown>[];
  activeCards: Record<string, unknown>[];
  loadingCards: string[];
  errorCards: { cardId: string; error: unknown; timestamp: number }[];
  layout: string;
  columns: number;
  mounted: boolean;
  loading: boolean;
  error: unknown | null;
  lastUpdate: number | null;
  _initialized: boolean;
};

let _listeners: ((state: StoreState) => void)[] = [];
let _store: StoreState = {
  cards: [],
  activeCards: [],
  loadingCards: [],
  errorCards: [],
  layout: 'grid',
  columns: 3,
  mounted: false,
  loading: false,
  error: null,
  lastUpdate: null,
  _initialized: false
};

export function getState() { return Object.assign({}, _store); }
export function get(key: keyof StoreState | undefined) { return key ? _store[key] : getState(); }

export function set(key: keyof StoreState | Partial<StoreState>, value?: unknown) {
  if (typeof key === 'object') { Object.assign(_store, key); }
  else { (_store as Record<string, unknown>)[key] = value; }
  _store.lastUpdate = Date.now();
  _notify();
}

export function setCards(cards: Record<string, unknown>[]) { _store.cards = cards || []; _store.activeCards = cards.filter((c: Record<string, unknown>) => c.active !== false); _notify(); }
export function addLoadingCard(cardId: string) { if (!_store.loadingCards.includes(cardId)) _store.loadingCards.push(cardId); _notify(); }
export function removeLoadingCard(cardId: string) { _store.loadingCards = _store.loadingCards.filter((id: string) => id !== cardId); _notify(); }
export function addErrorCard(cardId: string, error: unknown) { _store.errorCards = _store.errorCards.filter((e: { cardId: string }) => e.cardId !== cardId); _store.errorCards.push({ cardId, error, timestamp: Date.now() }); _notify(); }
export function clearErrorCard(cardId: string) { _store.errorCards = _store.errorCards.filter((e: { cardId: string }) => e.cardId !== cardId); _notify(); }

export function reset() {
  _store = { cards: [], activeCards: [], loadingCards: [], errorCards: [], layout: 'grid', columns: 3, mounted: false, loading: false, error: null, lastUpdate: null, _initialized: false } as StoreState;
  _notify();
}

export function subscribe(fn: (state: StoreState) => void) { _listeners.push(fn); return () => { _listeners = _listeners.filter((l: (state: StoreState) => void) => l !== fn); }; }
function _notify() { _listeners.forEach((fn: (state: StoreState) => void) => { try { fn(getState()); } catch (e) {} }); }

export function isInitialized() { return _store._initialized; }
export function setInitialized(val: boolean) { _store._initialized = val; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, cardsCount: _store.cards.length, activeCount: _store.activeCards.length, loadingCount: _store.loadingCards.length, errorCount: _store.errorCards.length }; }

export default { getState, get, set, setCards, addLoadingCard, removeLoadingCard, addErrorCard, clearErrorCard, reset, subscribe, isInitialized, setInitialized };
