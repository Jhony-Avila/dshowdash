// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.workers.normalizer
// PURPOSE: Normalizer Web Worker - Ticker Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   (none)
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

export const VERSION = '1.1.0-P17WI';
export const MODULE_ID = 'ticker.workers.normalizer';

// Expor VERSION para acesso via postMessage
self.VERSION = VERSION;
self.MODULE_ID = MODULE_ID;

const CATEGORY_KEYWORDS = { breaking: ['urgente', 'breaking', 'última hora', 'alerta', 'atenção'], economia: ['economia', 'mercado', 'dólar', 'bolsa', 'ibovespa', 'inflação', 'pib', 'selic', 'banco central', 'juros'], politica: ['política', 'eleição', 'governo', 'congresso', 'senado', 'câmara', 'ministro', 'presidente', 'stf'], tecnologia: ['tecnologia', 'tech', 'ia', 'inteligência artificial', 'startup', 'apple', 'google', 'microsoft', 'meta'], esportes: ['futebol', 'copa', 'olimpíada', 'brasileirão', 'libertadores', 'nba', 'f1', 'esporte'], saude: ['saúde', 'covid', 'vacina', 'hospital', 'médico', 'sus', 'anvisa'] };

function detectCategory(title: string) { if (!title) return 'geral'; const lower = title.toLowerCase(); for (const category in CATEGORY_KEYWORDS) { if (CATEGORY_KEYWORDS.hasOwnProperty(category)) { const keywords = (CATEGORY_KEYWORDS as Record<string, string[]>)[category]; for (let i = 0; i < keywords.length; i++) { if (lower.indexOf(keywords[i]) !== -1) return category; } } } return 'geral'; }

function normalizeItem(item: Record<string, any>) { const type = item.type || 'news'; const baseItem = { id: item.id || (`${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`), type, timestamp: Date.now() }; if (type === 'news') { const source = (item.source || item.portal || item.provider || item.origin || 'default').toLowerCase(); const published_at = item.published_at || item.pubDate || item.date || item.publishedAt || new Date().toISOString(); const category = item.category || detectCategory(item.title); return Object.assign({}, baseItem, { title: (item.title || '').trim(), url: item.url || item.link || '#', source, published_at, category, isBreaking: category === 'breaking', summary: item.summary || item.description || '', image: item.image || item.thumbnail || null }); } if (type === 'fx') { return Object.assign({}, baseItem, { symbol: item.symbol || 'USD/BRL', price: parseFloat(item.price) || 0, change_pct: parseFloat(item.change_pct || item.change || 0), high: parseFloat(item.high) || null, low: parseFloat(item.low) || null, updated_at: item.updated_at || new Date().toISOString() }); } if (type === 'stock') { return Object.assign({}, baseItem, { symbol: item.symbol || 'IBOV', price: parseFloat(item.price) || 0, change_pct: parseFloat(item.change_pct || item.change || 0), volume: parseInt(item.volume) || 0, market_cap: item.market_cap || null, updated_at: item.updated_at || new Date().toISOString() }); } return Object.assign({}, baseItem, item); }

function normalizeItems(items: unknown[]) { if (!Array.isArray(items)) return []; return items.map((item: unknown) => normalizeItem(item as Record<string, any>)).filter(Boolean); }

function sortItems(items: Record<string, any>[], sortBy: string, order: string) { if (!sortBy) sortBy = 'published_at'; if (!order) order = 'desc'; return items.slice().sort((a: Record<string, any>, b: Record<string, any>) => { let valA = a[sortBy]; let valB = b[sortBy]; if (sortBy === 'published_at' || sortBy === 'updated_at') { valA = new Date(valA).getTime(); valB = new Date(valB).getTime(); } return order === 'desc' ? valB - valA : valA - valB; }); }

function filterItems(items: Record<string, any>[], filters: Record<string, any>) { if (!filters) filters = {}; return items.filter((item: Record<string, any>) => { if (filters.type && item.type !== filters.type) return false; if (filters.category && item.category !== filters.category) return false; if (filters.source && item.source !== filters.source) return false; if (filters.search) { const searchLower = filters.search.toLowerCase(); const title = (item.title || '').toLowerCase(); const summary = (item.summary || '').toLowerCase(); if (title.indexOf(searchLower) === -1 && summary.indexOf(searchLower) === -1) return false; } return true; }); }

function dedupeItems(items: Record<string, any>[], key: string) { if (!key) key = 'id'; const seen: Record<string, boolean> = {}; return items.filter((item: Record<string, any>) => { const val = item[key]; if (seen[val]) return false; seen[val] = true; return true; }); }


// @ts-expect-error TS migration - TS2554
self.onmessage = event => { const data = event.data; const type = data.type; const payload = data.payload; const requestId = data.requestId; const startTime = performance.now(); let result = null; let error = null; try { switch (type) { case 'normalize': result = normalizeItems(payload.items); break; case 'sort': result = sortItems(payload.items, payload.sortBy, payload.order); break; case 'filter': result = filterItems(payload.items, payload.filters); break; case 'dedupe': result = dedupeItems(payload.items, payload.key); break; case 'process': let processed = normalizeItems(payload.items); if (payload.dedupe !== false) processed = dedupeItems(processed); if (payload.filters) processed = filterItems(processed, payload.filters); if (payload.sortBy) processed = sortItems(processed, payload.sortBy, payload.order); result = processed; break; case 'ping': result = { pong: true, version: VERSION }; break; case 'info': result = { moduleId: MODULE_ID, version: VERSION }; break; case 'healthCheck': result = { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; break; case 'getVersion': result = { version: VERSION, moduleId: MODULE_ID }; break; default: error = `Unknown message type: ${type}`; } } catch (e) { error = e.message; } const elapsed = performance.now() - startTime; self.postMessage({ requestId, type, result, error, elapsed, version: VERSION }); };


// @ts-expect-error TS migration - TS2339
self.onerror = error => { self.postMessage({ type: 'error', error: error.message, version: VERSION }); };
