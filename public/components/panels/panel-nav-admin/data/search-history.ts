// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-MIGRATION-PHASE2)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.data.search-history
// PURPOSE: Search History — Histórico e sugestões de busca com persistência
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   injectPorts(), getPorts()
//   SearchHistory — exported class
//   createSearchHistory() — factory function
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/search-history.js for nav-admin
// @changelog
//   10.1.0-MIGRATION-PHASE2: Initial creation — FASE 2 C.9
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.1.0-MIGRATION-PHASE2';
export const MODULE_ID = 'panel-nav-admin.data.search-history';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

/**
 * Format a timestamp as relative time string.
 * @private
 * @param {number} timestamp
 * @returns {string}
 */
function _timeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + 'min';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h';
  const days = Math.floor(hours / 24);
  return days + 'd';
}

/**
 * SearchHistory — Armazena histórico de buscas com localStorage.
 */
export class SearchHistory {
  [key: string]: any;
  /**
   * @param {Object} [options]
   * @param {string} [options.storageKey='pna_search_history'] — localStorage key
   * @param {number} [options.maxItems=15] — Maximum stored searches
   */
  constructor(options: Record<string, unknown> = {}) {
    this.storageKey = options.storageKey || 'pna_search_history';
    this.maxItems = options.maxItems || 15;
    this._history = [];
    this._load();
  }

  /**
   * Add a search query to history.
   * @param {string} query — Search term
   * @param {number} [resultCount=0] — Number of results found
   */
  add(query: string, resultCount = 0) {
    if (!query || query.trim().length < 2) return;

    const normalized = query.trim();
    // Remove duplicate (case-insensitive)
    this._history = this._history.filter(
      (entry: { query: string; timestamp: number; resultCount: number }) => entry.query.toLowerCase() !== normalized.toLowerCase()
    );

    this._history.unshift({
      query: normalized,
      timestamp: Date.now(),
      resultCount
    });

    if (this._history.length > this.maxItems) {
      this._history = this._history.slice(0, this.maxItems);
    }

    this._save();
  }

  /**
   * Remove a specific entry by query.
   * @param {string} query
   */
  remove(query: string) {
    this._history = this._history.filter(
      (entry: { query: string }) => entry.query.toLowerCase() !== query.toLowerCase()
    );
    this._save();
  }

  /** Clear all history. */
  clear() {
    this._history = [];
    this._save();
  }

  /**
   * Get the full history.
   * @returns {Array<{ query: string, timestamp: number, resultCount: number, timeAgo: string }>}
   */
  getHistory() {
    return this._history.map((entry: { query: string; timestamp: number; resultCount: number }) => ({
      ...entry,
      timeAgo: _timeAgo(entry.timestamp)
    }));
  }

  /**
   * Get suggestions based on a partial query.
   * @param {string} partial — Current input value
   * @param {number} [limit=5]
   * @returns {Array<{ query: string, timeAgo: string, resultCount: number }>}
   */
  getSuggestions(partial: string, limit = 5) {
    if (!partial || partial.trim().length === 0) {
      return this.getHistory().slice(0, limit);
    }

    const q = partial.toLowerCase().trim();
    return this._history
      .filter((entry: { query: string }) => entry.query.toLowerCase().includes(q))
      .slice(0, limit)
      .map((entry: { query: string; timestamp: number; resultCount: number }) => ({
        query: entry.query,
        timeAgo: _timeAgo(entry.timestamp),
        resultCount: entry.resultCount
      }));
  }

  /** @returns {number} Number of stored entries */
  size() { return this._history.length; }

  /** @private Load from localStorage */
  _load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this._history = parsed.slice(0, this.maxItems);
        }
      }
    } catch (e) { /* ignore corrupted storage */ }
  }

  /** @private Save to localStorage */
  _save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this._history));
    } catch (e) { /* quota exceeded or unavailable */ }
  }
}

/**
 * Factory to create a SearchHistory instance.
 * @param {Object} [options]
 * @returns {SearchHistory}
 */
export function createSearchHistory(options: Record<string, unknown> = {}) {
  return new SearchHistory(options);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION };
}

export default { SearchHistory, createSearchHistory, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
