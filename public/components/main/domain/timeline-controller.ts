// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.0.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: timeline-controller
// PURPOSE: TimelineController - Controle de Timeline de Eventos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   addEvent() — exported function
//   getEvents() — exported function
//   clearEvents() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   createTimelineController() — exported function
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

export const VERSION = '9.0.0-P1-HEX';
export const MODULE_ID = 'timeline-controller';

let _events: Array<Record<string, unknown>> = [];
let _maxEvents = 1000;
let _metrics = { added: 0, cleared: 0, errors: 0 };

export function addEvent(event: Record<string, unknown>) {
  try {
    _events.push({ ...event, timestamp: (event.timestamp as number) || Date.now() });
    if (_events.length > _maxEvents) _events.shift();
    _metrics.added++;
    return true;
  } catch (error) {
    _metrics.errors++;
    return false;
  }
}

export function getEvents(filter: Record<string, unknown> = {}) {
  let result = [..._events];
  if (filter.type) result = result.filter(e => e.type === filter.type);
  // @ts-expect-error strict migration — TS18046
  if (filter.since) result = result.filter(e => e.timestamp >= filter.since);
  if (filter.limit) result = result.slice(-filter.limit);
  return result;
}

export function clearEvents() {
  _metrics.cleared += _events.length;
  _events = [];
}

export function getMetrics() { return { ..._metrics, eventCount: _events.length }; }

export function healthCheck() {
  const isFull = _events.length >= _maxEvents * 0.9;
  return {
    status: isFull ? 'DEGRADED' : 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { eventCount: _events.length, maxEvents: _maxEvents, isFull },
    metrics: getMetrics(),
    p1HexCompliant: true
  };
}

export function createTimelineController(options: Record<string, unknown> = {}) {
  const _ports = options.ports || {};
// @ts-expect-error TS migration - TS2339
  const _eventsPort = _ports.events || null;
// @ts-expect-error TS migration - TS2339
  const _timerPort = _ports.timer || null;
  let _recording = false;
  let _localEvents: Array<Record<string, unknown>> = [];
  let _localMetrics = { recorded: 0, errors: 0 };
  let _unsubs: Array<() => void> = [];
  
  return {
    VERSION,
    MODULE_ID,
    
    startRecording() {
      _recording = true;
      _eventsPort?.emit?.('timeline:recording-started', {});
      return true;
    },
    
    stopRecording() {
      _recording = false;
      _eventsPort?.emit?.('timeline:recording-stopped', {});
      return true;
    },
    
    isRecording() { return _recording; },
    
    record(type: string, data: Record<string, unknown> = {}) {
      if (!_recording) return false;
      try {
        const event: Record<string, unknown> = { type, data, timestamp: Date.now() };
        _localEvents.push(event);
        addEvent(event);
        _localMetrics.recorded++;
        if (_localEvents.length > _maxEvents) _localEvents.shift();
        return true;
      } catch (error) {
        _localMetrics.errors++;
        return false;
      }
    },
    
    getEvents(filter: Record<string, any> = {}) { return getEvents(filter); },
    getLocalEvents(limit = 100) { return _localEvents.slice(-limit); },
    
    clear() {
      _localEvents = [];
      clearEvents();
      _eventsPort?.emit?.('timeline:cleared', {});
      return true;
    },
    
    getMetrics() {
      return {
        ...getMetrics(),
        local: { ..._localMetrics, localCount: _localEvents.length }
      };
    },
    
    healthCheck() {
      return {
        ...healthCheck(),
        recording: _recording,
        localEventCount: _localEvents.length,
        unsubsCount: _unsubs.length,
        p1HexCompliant: true
      };
    },
    
    info() {
      return {
        version: VERSION,
        moduleId: MODULE_ID,
        recording: _recording,
        eventCount: _events.length,
        localEventCount: _localEvents.length,
        unsubsCount: _unsubs.length,
        metrics: this.getMetrics(),
        p1HexCompliant: true
      };
    },
    
    // P1-HEX: Subscription management
    addSubscription(unsub: unknown) {
      if (typeof unsub === 'function') {
        _unsubs.push(unsub as () => void);
      }
    },
    
    // P1-HEX: Proper cleanup with unsubs
    destroy() {
      _recording = false;
      _localEvents = [];
      _localMetrics = { recorded: 0, errors: 0 };
      
      // P1-HEX: Execute all unsubscriptions
      _unsubs.forEach(unsub => {
        try { if (typeof unsub === 'function') unsub(); } catch(e) {}
      });
      _unsubs = [];
    }
  };
}

export default { addEvent, getEvents, clearEvents, getMetrics, healthCheck, createTimelineController, VERSION, MODULE_ID };
