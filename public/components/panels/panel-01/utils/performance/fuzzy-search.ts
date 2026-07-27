// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/performance/fuzzy-search
// PURPOSE: Panel-01 - Busca Fuzzy
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createFuzzySearch() — exported function
//   info() — exported function
//   healthCheck() — exported function
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
export const MODULE_ID = 'panel-01/utils/performance/fuzzy-search';

export class FuzzySearch {
  [key: string]: any;
  constructor(options: { threshold?: number; keys?: string[]; caseSensitive?: boolean } = {}) {
    this.threshold = options.threshold || 0.6;
    this.keys = options.keys || ['descricao', 'fornecedor', 'centro_custo'];
    this.caseSensitive = options.caseSensitive || false;
  }

  search(items: Record<string, unknown>[], query: string) {
    if (!query || query.length < 2) return items;
    const normalizedQuery = this.caseSensitive ? query : query.toLowerCase();
    const results = items.map((item: Record<string, unknown>) => {
      let bestScore = 0;
      let matchedKey = null;
      for (const key of this.keys) {
        const value = this._getValue(item, key);
        if (!value) continue;
        const normalizedValue = this.caseSensitive ? value : value.toLowerCase();
        const score = this._calculateScore(normalizedValue, normalizedQuery);
        if (score > bestScore) { bestScore = score; matchedKey = key; }
      }
      return { item, score: bestScore, matchedKey };
    });
    return results.filter((r: Record<string, unknown>) => (r.score as number) >= this.threshold).sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.score as number) - (a.score as number)).map((r: Record<string, unknown>) => r.item);
  }

  _getValue(item: Record<string, unknown>, key: string) {
    const keys = key.split('.');
    let value: unknown = item;
    for (const k of keys) value = value && (value as Record<string, unknown>)[k];
    return typeof value === 'string' ? value : String(value || '');
  }

  _calculateScore(text: string, query: string) {
    if (text === query) return 1;
    if (text.includes(query)) return 0.9;
    if (text.startsWith(query)) return 0.85;
    const distance = this._levenshtein(text.substring(0, 50), query);
    const maxLen = Math.max(text.length, query.length);
    return Math.max(0, 1 - (distance / maxLen));
  }

  _levenshtein(a: string, b: string) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
        else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[b.length][a.length];
  }

  highlight(text: string, query: string) {
    if (!query || !text) return text;
    const escaped = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="p01-highlight">$1</mark>');
  }
}

export function createFuzzySearch(options: Record<string, unknown> = {}) { return new FuzzySearch(options); }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { FuzzySearch, createFuzzySearch };
