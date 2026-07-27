const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-cards/state/store";
let _listeners = [];
let _store = {
  cards: [],
  activeCards: [],
  loadingCards: [],
  errorCards: [],
  layout: "grid",
  columns: 3,
  mounted: false,
  loading: false,
  error: null,
  lastUpdate: null,
  _initialized: false
};
function getState() {
  return Object.assign({}, _store);
}
function get(key) {
  return key ? _store[key] : getState();
}
function set(key, value) {
  if (typeof key === "object") {
    Object.assign(_store, key);
  } else {
    _store[key] = value;
  }
  _store.lastUpdate = Date.now();
  _notify();
}
function setCards(cards) {
  _store.cards = cards || [];
  _store.activeCards = cards.filter((c) => c.active !== false);
  _notify();
}
function addLoadingCard(cardId) {
  if (!_store.loadingCards.includes(cardId)) _store.loadingCards.push(cardId);
  _notify();
}
function removeLoadingCard(cardId) {
  _store.loadingCards = _store.loadingCards.filter((id) => id !== cardId);
  _notify();
}
function addErrorCard(cardId, error) {
  _store.errorCards = _store.errorCards.filter((e) => e.cardId !== cardId);
  _store.errorCards.push({ cardId, error, timestamp: Date.now() });
  _notify();
}
function clearErrorCard(cardId) {
  _store.errorCards = _store.errorCards.filter((e) => e.cardId !== cardId);
  _notify();
}
function reset() {
  _store = { cards: [], activeCards: [], loadingCards: [], errorCards: [], layout: "grid", columns: 3, mounted: false, loading: false, error: null, lastUpdate: null, _initialized: false };
  _notify();
}
function subscribe(fn) {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter((l) => l !== fn);
  };
}
function _notify() {
  _listeners.forEach((fn) => {
    try {
      fn(getState());
    } catch (e) {
    }
  });
}
function isInitialized() {
  return _store._initialized;
}
function setInitialized(val) {
  _store._initialized = val;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, cardsCount: _store.cards.length, activeCount: _store.activeCards.length, loadingCount: _store.loadingCards.length, errorCount: _store.errorCards.length };
}
var store_default = { getState, get, set, setCards, addLoadingCard, removeLoadingCard, addErrorCard, clearErrorCard, reset, subscribe, isInitialized, setInitialized };
export {
  MODULE_ID,
  VERSION,
  addErrorCard,
  addLoadingCard,
  clearErrorCard,
  store_default as default,
  get,
  getState,
  healthCheck,
  info,
  isInitialized,
  removeLoadingCard,
  reset,
  set,
  setCards,
  setInitialized,
  subscribe
};
