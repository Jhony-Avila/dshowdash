// UI Orchestrator - Event Timeline
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 2.0.0-PORTSFACTORY
// @changelog v2.0.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v1.0.1-P18-ENTERPRISE - P18: console.* → _log()
// Captura e exibe timeline de eventos para debugging
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '2.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.ui-orchestrator.canvas.event-timeline';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

function _log(level: string, ...args: unknown[]) {
  const logger = _getPort('logger') as Record<string, ((...a: unknown[]) => void) | undefined> | null;
  const fn = logger?.[level];
  if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args);
}

const MAX_EVENTS = 500;
const EVENT_CATEGORIES = {
  INTENT: 'intent',
  NAVIGATION: 'navigation',
  PANEL: 'panel',
  CANVAS: 'canvas',
  AUTH: 'auth',
  ERROR: 'error',
  SYSTEM: 'system'
};

const CATEGORY_COLORS = {
  intent: '#a371f7',
  navigation: '#58a6ff',
  panel: '#3fb950',
  canvas: '#d29922',
  auth: '#f85149',
  error: '#f85149',
  system: '#8b949e'
};

let _initialized = false;
let _eventBus: { on?: (event: string, handler: (data: unknown) => void) => (() => void) } | null = null;
let _events: Record<string, unknown>[] = [];
let _listeners: (() => void)[] = [];
let _paused = false;
let _filters: { categories: string[]; searchTerm: string } = {
  categories: Object.values(EVENT_CATEGORIES),
  searchTerm: ''
};

let _subscribers: ((...args: unknown[]) => void)[] = [];

export function init(options: Record<string, unknown> = {}) {
  if (_initialized) {
    return { success: true, alreadyInitialized: true };
  }

  _initPorts();
  _eventBus = _getPort('eventBus') as typeof _eventBus;

  if (!_eventBus) {
    return { success: false, error: 'EventBus not available' };
  }

  _subscribeToEvents([
    'orchestrator:*',
    'intent:*',
    'router:*',
    'panel:*',
    'canvas:*',
    'auth:*',
    'action:*',
    'main:*',
    'sidebar:*',
    'header:*'
  ]);

  _initialized = true;

  _addEvent({
    category: EVENT_CATEGORIES.SYSTEM,
    type: 'timeline:started',
    data: { version: VERSION }
  });

  return { success: true };
}

function _subscribeToEvents(patterns: string[]) {
  patterns.forEach((pattern: string) => {
    const eventName = pattern.replace('*', '');

    const handler = (data: unknown) => {
      if (_paused) return;
      const d = data as Record<string, unknown>;
      const category = _categorizeEvent(eventName, d);
      _addEvent({
        category,
        type: (d?.type || eventName) as string,
        data,
        source: d?.source
      });
    };

    const events = _expandPattern(pattern);
    events.forEach((evt: string) => {
      const unsub = _eventBus?.on?.(evt, handler);
      if (typeof unsub === 'function') {
        _listeners.push(unsub);
      }
    });
  });
}

function _expandPattern(pattern: string): string[] {
  if (!pattern.includes('*')) return [pattern];

  const base = pattern.replace(':*', '');
  const suffixes = ['ready', 'init', 'error', 'changed', 'opened', 'closed', 'click', 'navigate'];
  return suffixes.map((s: string) => `${base}:${s}`);
}

function _categorizeEvent(eventName: string, data: Record<string, unknown>): string {
  if (eventName.includes('intent') || eventName.includes('orchestrator')) {
    return EVENT_CATEGORIES.INTENT;
  }
  if (eventName.includes('router') || eventName.includes('navigate')) {
    return EVENT_CATEGORIES.NAVIGATION;
  }
  if (eventName.includes('panel')) {
    return EVENT_CATEGORIES.PANEL;
  }
  if (eventName.includes('canvas')) {
    return EVENT_CATEGORIES.CANVAS;
  }
  if (eventName.includes('auth')) {
    return EVENT_CATEGORIES.AUTH;
  }
  if (eventName.includes('error') || data?.error) {
    return EVENT_CATEGORIES.ERROR;
  }
  return EVENT_CATEGORIES.SYSTEM;
}

function _addEvent(event: Record<string, unknown>) {
  const entry: Record<string, unknown> = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: Date.now(),
    category: event.category,
    type: event.type,
    data: event.data,
    source: event.source || 'unknown'
  };

  _events.unshift(entry);

  if (_events.length > MAX_EVENTS) {
    _events = _events.slice(0, MAX_EVENTS);
  }

  _notifySubscribers(entry);
}

function _notifySubscribers(event: Record<string, unknown> | null) {
  _subscribers.forEach((fn: (...args: unknown[]) => void) => {
    try {
      fn(event, _events);
    } catch (e) {
      _log('warn', 'Subscriber error:', e);
    }
  });
}

export function getEvents(options: { type?: string; category?: string; source?: string; limit?: number; categories?: string[]; searchTerm?: string } = {}) {
  let filtered = [..._events];

  if (options.categories?.length) {
    filtered = filtered.filter(e => options.categories!.includes(e.category as string));
  } else if (_filters.categories.length < Object.values(EVENT_CATEGORIES).length) {
    filtered = filtered.filter(e => _filters.categories.includes(e.category as string));
  }

  const term = (options.searchTerm || _filters.searchTerm).toLowerCase();
  if (term) {
    filtered = filtered.filter(e =>
      (e.type as string).toLowerCase().includes(term) ||
      (e.source as string).toLowerCase().includes(term) ||
      JSON.stringify(e.data).toLowerCase().includes(term)
    );
  }

  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

export function subscribe(fn: (...args: unknown[]) => void) {
  _subscribers.push(fn);
  return () => {
    _subscribers = _subscribers.filter(s => s !== fn);
  };
}

export function pause() {
  _paused = true;
  _addEvent({
    category: EVENT_CATEGORIES.SYSTEM,
    type: 'timeline:paused',
    data: {}
  });
}

export function resume() {
  _paused = false;
  _addEvent({
    category: EVENT_CATEGORIES.SYSTEM,
    type: 'timeline:resumed',
    data: {}
  });
}

export function clear() {
  _events = [];
  _notifySubscribers(null);
}

export function setFilter(key: string, value: unknown) {
  (_filters as Record<string, unknown>)[key] = value;
}

export function getFilters() {
  return { ..._filters };
}

export function exportEvents(format = 'json') {
  const events = getEvents();

  if (format === 'json') {
    return JSON.stringify(events, null, 2);
  }

  if (format === 'csv') {
    const headers = 'id,timestamp,category,type,source,data\n';
    const rows = events.map(e =>
      `${e.id},${e.timestamp},${e.category},${e.type},${e.source},"${JSON.stringify(e.data).replace(/"/g, '""')}"`
    ).join('\n');
    return headers + rows;
  }

  return events;
}

export function log(type: string, data: Record<string, unknown> = {}, category = EVENT_CATEGORIES.SYSTEM) {
  _addEvent({ category, type, data, source: 'manual' });
}

export function logIntent(intentId: string, resolution: unknown) {
  _addEvent({
    category: EVENT_CATEGORIES.INTENT,
    type: 'intent:resolved',
    data: { intentId, resolution },
    source: 'orchestrator'
  });
}

export function logError(error: unknown, context: Record<string, unknown> = {}) {
  const err = error as { message?: string; stack?: string } | string;
  _addEvent({
    category: EVENT_CATEGORIES.ERROR,
    type: 'error',
    data: { message: (err as { message?: string })?.message || err, stack: (err as { stack?: string })?.stack, ...context },
    source: context.source || 'unknown'
  });
}

export function healthCheck() {
  return {
    status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED',
    eventCount: _events.length,
    paused: _paused,
    subscriberCount: _subscribers.length,
    portsInitialized: Ports.isInitialized()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    eventCount: _events.length,
    maxEvents: MAX_EVENTS,
    paused: _paused,
    filters: { ..._filters },
    categories: EVENT_CATEGORIES,
    categoryColors: CATEGORY_COLORS,
    portsInitialized: Ports.isInitialized()
  };
}

export function destroy() {
  _listeners.forEach(unsub => { try { unsub(); } catch {} });
  _listeners = [];
  _subscribers = [];
  _events = [];
  _initialized = false;
}

export default Object.freeze({
  VERSION,
  MODULE_ID,
  EVENT_CATEGORIES,
  CATEGORY_COLORS,
  init,
  getEvents,
  subscribe,
  pause,
  resume,
  clear,
  setFilter,
  getFilters,
  exportEvents,
  log,
  logIntent,
  logError,
  healthCheck,
  info,
  destroy,
  injectPorts,
  getPorts
});
