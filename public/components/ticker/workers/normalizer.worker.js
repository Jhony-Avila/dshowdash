const VERSION = "1.1.0-P17WI";
const MODULE_ID = "ticker.workers.normalizer";
self.VERSION = VERSION;
self.MODULE_ID = MODULE_ID;
const CATEGORY_KEYWORDS = { breaking: ["urgente", "breaking", "\xFAltima hora", "alerta", "aten\xE7\xE3o"], economia: ["economia", "mercado", "d\xF3lar", "bolsa", "ibovespa", "infla\xE7\xE3o", "pib", "selic", "banco central", "juros"], politica: ["pol\xEDtica", "elei\xE7\xE3o", "governo", "congresso", "senado", "c\xE2mara", "ministro", "presidente", "stf"], tecnologia: ["tecnologia", "tech", "ia", "intelig\xEAncia artificial", "startup", "apple", "google", "microsoft", "meta"], esportes: ["futebol", "copa", "olimp\xEDada", "brasileir\xE3o", "libertadores", "nba", "f1", "esporte"], saude: ["sa\xFAde", "covid", "vacina", "hospital", "m\xE9dico", "sus", "anvisa"] };
function detectCategory(title) {
  if (!title) return "geral";
  const lower = title.toLowerCase();
  for (const category in CATEGORY_KEYWORDS) {
    if (CATEGORY_KEYWORDS.hasOwnProperty(category)) {
      const keywords = CATEGORY_KEYWORDS[category];
      for (let i = 0; i < keywords.length; i++) {
        if (lower.indexOf(keywords[i]) !== -1) return category;
      }
    }
  }
  return "geral";
}
function normalizeItem(item) {
  const type = item.type || "news";
  const baseItem = { id: item.id || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, type, timestamp: Date.now() };
  if (type === "news") {
    const source = (item.source || item.portal || item.provider || item.origin || "default").toLowerCase();
    const published_at = item.published_at || item.pubDate || item.date || item.publishedAt || (/* @__PURE__ */ new Date()).toISOString();
    const category = item.category || detectCategory(item.title);
    return Object.assign({}, baseItem, { title: (item.title || "").trim(), url: item.url || item.link || "#", source, published_at, category, isBreaking: category === "breaking", summary: item.summary || item.description || "", image: item.image || item.thumbnail || null });
  }
  if (type === "fx") {
    return Object.assign({}, baseItem, { symbol: item.symbol || "USD/BRL", price: parseFloat(item.price) || 0, change_pct: parseFloat(item.change_pct || item.change || 0), high: parseFloat(item.high) || null, low: parseFloat(item.low) || null, updated_at: item.updated_at || (/* @__PURE__ */ new Date()).toISOString() });
  }
  if (type === "stock") {
    return Object.assign({}, baseItem, { symbol: item.symbol || "IBOV", price: parseFloat(item.price) || 0, change_pct: parseFloat(item.change_pct || item.change || 0), volume: parseInt(item.volume) || 0, market_cap: item.market_cap || null, updated_at: item.updated_at || (/* @__PURE__ */ new Date()).toISOString() });
  }
  return Object.assign({}, baseItem, item);
}
function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => normalizeItem(item)).filter(Boolean);
}
function sortItems(items, sortBy, order) {
  if (!sortBy) sortBy = "published_at";
  if (!order) order = "desc";
  return items.slice().sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];
    if (sortBy === "published_at" || sortBy === "updated_at") {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }
    return order === "desc" ? valB - valA : valA - valB;
  });
}
function filterItems(items, filters) {
  if (!filters) filters = {};
  return items.filter((item) => {
    if (filters.type && item.type !== filters.type) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.source && item.source !== filters.source) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const title = (item.title || "").toLowerCase();
      const summary = (item.summary || "").toLowerCase();
      if (title.indexOf(searchLower) === -1 && summary.indexOf(searchLower) === -1) return false;
    }
    return true;
  });
}
function dedupeItems(items, key) {
  if (!key) key = "id";
  const seen = {};
  return items.filter((item) => {
    const val = item[key];
    if (seen[val]) return false;
    seen[val] = true;
    return true;
  });
}
self.onmessage = (event) => {
  const data = event.data;
  const type = data.type;
  const payload = data.payload;
  const requestId = data.requestId;
  const startTime = performance.now();
  let result = null;
  let error = null;
  try {
    switch (type) {
      case "normalize":
        result = normalizeItems(payload.items);
        break;
      case "sort":
        result = sortItems(payload.items, payload.sortBy, payload.order);
        break;
      case "filter":
        result = filterItems(payload.items, payload.filters);
        break;
      case "dedupe":
        result = dedupeItems(payload.items, payload.key);
        break;
      case "process":
        let processed = normalizeItems(payload.items);
        if (payload.dedupe !== false) processed = dedupeItems(processed);
        if (payload.filters) processed = filterItems(processed, payload.filters);
        if (payload.sortBy) processed = sortItems(processed, payload.sortBy, payload.order);
        result = processed;
        break;
      case "ping":
        result = { pong: true, version: VERSION };
        break;
      case "info":
        result = { moduleId: MODULE_ID, version: VERSION };
        break;
      case "healthCheck":
        result = { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
        break;
      case "getVersion":
        result = { version: VERSION, moduleId: MODULE_ID };
        break;
      default:
        error = `Unknown message type: ${type}`;
    }
  } catch (e) {
    error = e.message;
  }
  const elapsed = performance.now() - startTime;
  self.postMessage({ requestId, type, result, error, elapsed, version: VERSION });
};
self.onerror = (error) => {
  self.postMessage({ type: "error", error: error.message, version: VERSION });
};
export {
  MODULE_ID,
  VERSION
};
