const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.event-recorder.event-store";
function createEventStore(options = {}) {
  const { maxEvents = 1e3 } = options;
  let _events = [];
  let _startTime = null;
  let _sessionId = null;
  function cloneData(data) {
    if (data === null || data === void 0) return data;
    if (typeof data === "function") return "[Function]";
    if (data instanceof Error) return { message: data.message, stack: data.stack };
    if (typeof Element !== "undefined" && data instanceof Element) {
      return `[Element: ${data.tagName}#${data.id || "no-id"}]`;
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
    capture(type, name, data, source = null) {
      const event = {
        id: `evt-${_events.length + 1}`,
        type,
        name,
        data: cloneData(data),
        timestamp: Date.now(),
        relativeTime: _startTime ? Date.now() - _startTime : 0,
        source,
        sessionId: _sessionId
      };
      _events.push(event);
      if (_events.length > Number(maxEvents)) {
        _events.shift();
      }
      return event;
    },
    // Obtém eventos com filtro opcional
    getEvents(filter = null) {
      if (!filter) return [..._events];
      return _events.filter((e) => {
        if (filter.type && e.type !== filter.type) return false;
        if (filter.name && !e.name.includes(filter.name)) return false;
        if (filter.after && e.timestamp < filter.after) return false;
        if (filter.before && e.timestamp > filter.before) return false;
        return true;
      });
    },
    // Obtém timeline simplificada
    getTimeline() {
      return _events.map((e) => ({
        time: e.relativeTime,
        type: e.type,
        name: e.name,
        id: e.id
      }));
    },
    // Setters/Getters
    // @ts-expect-error TS migration - TS2740
    setEvents(events) {
      _events = events;
    },
    setSessionId(id) {
      _sessionId = id;
    },
    setStartTime(time) {
      _startTime = time;
    },
    getSessionId() {
      return _sessionId;
    },
    getStartTime() {
      return _startTime;
    },
    getEventCount() {
      return _events.length;
    },
    getDuration() {
      return _startTime ? Date.now() - _startTime : 0;
    },
    getMaxEvents() {
      return maxEvents;
    },
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
var event_store_default = { createEventStore };
export {
  MODULE_ID,
  VERSION,
  createEventStore,
  event_store_default as default
};
