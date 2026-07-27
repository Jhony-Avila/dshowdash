// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-MIGRATION-PHASE2)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.data.fuzzy-search
// PURPOSE: Fuzzy Search — Busca aproximada com Levenshtein + scoring
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   injectPorts(), getPorts()
//   FuzzySearch — exported class
//   createFuzzySearch() — factory function
//   info(), healthCheck()
//
// @origin Adapted from panel-01/utils/performance/fuzzy-search.js for nav-admin
// @changelog
//   10.1.0-MIGRATION-PHASE2: Initial creation — FASE 2 C.5
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.1.0-MIGRATION-PHASE2';
export const MODULE_ID = 'panel-nav-admin.data.fuzzy-search';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

/**
 * Compute Levenshtein distance between two strings.
 * @private
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function _levenshtein(a: string, b: string) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Get a nested property value by dot-notation path.
 * @private
 * @param {Object} obj
 * @param {string} path
 * @returns {*}
 */
function _getNestedValue(obj: Record<string, unknown>, path: string) {
  return path.split('.').reduce((o: unknown, k: string) => (o != null ? (o as Record<string, unknown>)[k] : undefined), obj);
}

/**
 * FuzzySearch — Busca aproximada em itens de navegação.
 * Scoring: exact match (1.0) > includes (0.9) > startsWith (0.85) > Levenshtein
 */
export class FuzzySearch {
  [key: string]: any;
  /**
   * @param {Object} [options]
   * @param {string[]} [options.keys] — Fields to search in
   * @param {number} [options.threshold=0.4] — Minimum score to include (0-1)
   * @param {number} [options.maxResults=50]
   */
  constructor(options: Record<string, unknown> = {}) {
    this.keys = options.keys || ['label', 'id', 'icon', 'section', 'href', 'description'];
    this.threshold = options.threshold || 0.4;
    this.maxResults = options.maxResults || 50;
  }

  /**
   * Search items with fuzzy matching.
   * @param {Array<Object>} items — Array of nav items to search
   * @param {string} query — Search query
   * @returns {Array<{ item: Object, score: number, matchedKey: string }>}
   */
  search(items: Record<string, unknown>[], query: string) {
    if (!query || !items || items.length === 0) return [];

    const q = query.toLowerCase().trim();
    if (q.length === 0) return [];

    const results = [];

    for (const item of items) {
      let bestScore = 0;
      let bestKey = '';

      for (const key of this.keys) {
        const value = _getNestedValue(item, key);
        if (value == null) continue;

        const text = String(value).toLowerCase();
        const score = this._scoreMatch(q, text);

        if (score > bestScore) {
          bestScore = score;
          bestKey = key;
        }
      }

      if (bestScore >= this.threshold) {
        results.push({ item, score: bestScore, matchedKey: bestKey });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, this.maxResults);
  }

  /**
   * Score a query against a text value.
   * @private
   * @param {string} query — Lowercase query
   * @param {string} text — Lowercase text
   * @returns {number} Score between 0 and 1
   */
  _scoreMatch(query: string, text: string) {
    if (text === query) return 1.0;
    if (text.includes(query)) return 0.9;
    if (text.startsWith(query)) return 0.85;
    if (query.length <= 2) return 0;

    const distance = _levenshtein(query, text);
    const maxLen = Math.max(query.length, text.length);
    if (maxLen === 0) return 0;

    const similarity = 1 - (distance / maxLen);
    return similarity;
  }

  /**
   * Highlight matching parts of a text.
   * @param {string} text — Original text
   * @param {string} query — Search query
   * @param {string} [className='pna-highlight'] — CSS class for mark tag
   * @returns {string} HTML with highlighted matches
   */
  highlight(text: string, query: string, className = 'pna-highlight') {
    if (!text || !query) return text || '';
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('(' + escapedQuery + ')', 'gi');
    return text.replace(regex, '<mark class="' + className + '">$1</mark>');
  }

  /**
   * Search and return items with highlighted fields.
   * @param {Array<Object>} items
   * @param {string} query
   * @returns {Array<{ item: Object, score: number, matchedKey: string, highlighted: string }>}
   */
  searchWithHighlight(items: Record<string, unknown>[], query: string) {
    const results = this.search(items, query);
    return results.map(r => {
      const value = _getNestedValue(r.item, r.matchedKey);
      return {
        ...r,
        highlighted: this.highlight(String(value || ''), query)
      };
    });
  }
}

/**
 * Factory to create a FuzzySearch instance.
 * @param {Object} [options]
 * @returns {FuzzySearch}
 */
export function createFuzzySearch(options: Record<string, unknown> = {}) {
  return new FuzzySearch(options);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION };
}

export default { FuzzySearch, createFuzzySearch, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
