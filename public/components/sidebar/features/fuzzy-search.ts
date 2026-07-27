// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-fuzzy-search
// PURPOSE: Sidebar Features - Fuzzy Search
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//   CSS_CLASSES as C from ../ui/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   calculateScore() — exported function
//   init() — exported function
//   search() — exported function
//   applyFuzzySearch() — exported function
//   highlightMatch() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.FUZZY_INITIALIZED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { CSS_CLASSES as C } from '../ui/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '6.1.0-ES6';
export const MODULE_ID = 'sidebar-fuzzy-search';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _metrics = { searches: 0, matches: 0, misses: 0 };

function levenshtein(a: DynObj , b: DynObj ) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) { for (let j = 1; j <= a.length; j++) { if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1]; else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1); } }
  return matrix[b.length][a.length];
}

export function calculateScore(query: string, text: string) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 80;
  const initials = t.split(/[\s-_]/).map((w: DynObj) => w[0]).join('');
  if (initials.includes(q)) return 70;
  const distance = levenshtein(q, t.slice(0, q.length + 2));
  if (distance <= 2) return 60 - distance * 10;
  let seqScore = 0;
  let lastIndex = -1;
  for (let i = 0; i < q.length; i++) { const char = q[i]; const index = t.indexOf(char, lastIndex + 1); if (index > lastIndex) { seqScore += 5; lastIndex = index; } }
  if (seqScore >= q.length * 3) return 40 + seqScore;
  return 0;
}

export function init(eventBus: DynObj) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FUZZY_INITIALIZED);
}

export function search(items: DynObj[], query: string, options: { labelKey?: string; threshold?: number; maxResults?: number } = {}) {
  const labelKey = options.labelKey || 'label';
  const threshold = options.threshold || 30;
  const maxResults = options.maxResults || 10;
  _metrics.searches++;
  if (!query || !items?.length) return items?.slice(0, maxResults) || [];
  const scored = items.map((item: DynObj) => { const text = typeof item === 'string' ? item : (item[labelKey] || item.title || item.id || ''); const score = calculateScore(query, text); return { item, score, text }; });
  const results = scored.filter((s: DynObj) => s.score >= threshold).sort((a: DynObj , b: DynObj ) => b.score - a.score).slice(0, maxResults).map((s: DynObj) => Object.assign({}, s.item, { _fuzzyScore: s.score, _fuzzyMatch: s.text }));
  _metrics.matches += results.length;
  if (results.length === 0) _metrics.misses++;
  return results;
}

export function applyFuzzySearch(container: HTMLElement, query: string, options: DynObj) {
  if (!container) return { visible: 0, hidden: 0 };
  options = options || {};
  const items: HTMLElement[] = Array.from(container.querySelectorAll(`.${C.ITEM}`));
  const itemData = items.map(el => ({
    element: el,
    label: el.textContent?.trim() || '',
    id: el.dataset.itemId
  }));
  const results = search(itemData, query, Object.assign({}, options, { maxResults: 100 }));
  const matchedIds = new Set(results.map((r: DynObj) => r.id));
  let visible = 0, hidden = 0;
  items.forEach(item => { const id = item.dataset.itemId; const matches = !query || matchedIds.has(id); item.style.display = matches ? '' : 'none'; const result = results.find((r: DynObj) => r.id === id); if (result) item.style.order = String(100 - (result._fuzzyScore || 0)); matches ? visible++ : hidden++; });
  return { visible, hidden, results };
}

export function highlightMatch(text: string, query: string) { if (!query) return text; const regex = new RegExp(`(${query.split('').join('.*?')})`, 'gi'); return text.replace(regex, '<mark class="fuzzy-match">$1</mark>'); }
export function destroy() { }
export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), metrics: getMetrics() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { searchesPerformed: _metrics.searches }, metrics: getMetrics() }; }

export default { init, search, applyFuzzySearch, highlightMatch, calculateScore, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
