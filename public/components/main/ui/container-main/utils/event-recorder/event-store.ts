// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: event-store
// PURPOSE: Event Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createEventStore() — exported function
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

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.event-recorder.event-store';

export function createEventStore(options: Record<string, unknown> = {}) {
  const { maxEvents = 1000 } = options;

  let _events: Record<string, unknown>[] = [];
  let _startTime: unknown = null;
  let _sessionId: unknown = null;

  // Clone seguro de dados
  function cloneData(data: Record<string, unknown>) {
    if (data === null || data === undefined) return data;
    if (typeof data === 'function') return '[Function]';
    if (data instanceof Error) return { message: data.message, stack: data.stack };
    if (typeof Element !== 'undefined' && data instanceof Element) {
      return `[Element: ${data.tagName}#${data.id || 'no-id'}]`;
    }
    
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (e) {
      return String(data);
    }
  }

  return {
    // Inicializa nova sessão
    initSession() {
      _sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      _startTime = Date.now();
      _events = [];
      return _sessionId;
    },

    // Captura evento
    capture(type: string, name: string, data: Record<string, unknown>, source: string | null = null) {
      const event = {
        id: `evt-${_events.length + 1}`,
        type,
        name,
        data: cloneData(data),
        timestamp: Date.now(),
        relativeTime: _startTime ? Date.now() - (_startTime as number) : 0,
        source,
        sessionId: _sessionId
      };

      _events.push(event);
      
      // Limita tamanho
      if (_events.length > Number(maxEvents)) {
        _events.shift();
      }

      return event;
    },

    // Obtém eventos com filtro opcional
    getEvents(filter: ((...args: unknown[]) => void) | null = null) {
      if (!filter) return [..._events];
      
      return _events.filter(e => {
        // @ts-expect-error TS migration - TS2339
        if (filter.type && e.type !== filter.type) return false;
        if (filter.name && !(e.name as unknown[]).includes(filter.name)) return false;
        // @ts-expect-error TS migration - TS2339
        if (filter.after && e.timestamp < filter.after) return false;
        // @ts-expect-error TS migration - TS2339
        if (filter.before && e.timestamp > filter.before) return false;
        return true;
      });
    },

    // Obtém timeline simplificada
    getTimeline() {
      return _events.map(e => ({
        time: e.relativeTime,
        type: e.type,
        name: e.name,
        id: e.id
      }));
    },

    // Setters/Getters
    // @ts-expect-error TS migration - TS2740
    setEvents(events: unknown) { _events = events; },
    setSessionId(id: string) { _sessionId = id; },
    setStartTime(time: unknown) { _startTime = time; },
    
    getSessionId() { return _sessionId; },
    getStartTime() { return _startTime; },
    getEventCount() { return _events.length; },
    getDuration() { return _startTime ? Date.now() - (_startTime as number) : 0; },
    getMaxEvents() { return maxEvents; },

    // Limpa eventos
    clear() {
      _events = [];
    },

    // Obtém últimos N eventos para persistência
    getLastEvents(count = 500) {
      return _events.slice(-count);
    }
  };
}

export default { createEventStore };
