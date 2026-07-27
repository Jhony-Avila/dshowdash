import { createPanel, PANEL_CATEGORIES, PANEL_CAPABILITIES } from "../contracts/panel-contract.js";
import { createTimerResource } from "../contracts/resource-contract.js";
const VERSION = "1.0.0-ADAPTIVE";
const MODULE_ID = "container-main:panels:stream";
const STREAM_TYPES = Object.freeze({
  WEBSOCKET: "websocket",
  SSE: "sse",
  POLLING: "polling",
  MANUAL: "manual"
});
function createStreamPanel(config = {}) {
  const {
    id = `stream-panel-${Date.now()}`,
    title = "Live Stream",
    streamType = STREAM_TYPES.MANUAL,
    url = "",
    pollingInterval = 5e3,
    maxItems = 100,
    autoScroll = true,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = config;
  let _containerEl = null;
  let _listEl = null;
  let _timerResource = null;
  let _connectionResource = null;
  let _items = [];
  let _connected = false;
  let _ws = null;
  let _eventSource = null;
  const panelConfig = {
    id,
    title,
    category: PANEL_CATEGORIES.REALTIME,
    capabilities: [
      PANEL_CAPABILITIES.RESIZABLE,
      PANEL_CAPABILITIES.CLOSABLE,
      PANEL_CAPABILITIES.REFRESHABLE
    ],
    priority: 0
  };
  const implementation = {
    async render(element) {
      _containerEl = element;
      _containerEl.innerHTML = `
        <div class="dsd-stream-panel">
          <div class="dsd-stream-panel__header">
            <span class="dsd-stream-panel__title">${title}</span>
            <div class="dsd-stream-panel__status">
              <span class="dsd-stream-panel__indicator"></span>
              <span class="dsd-stream-panel__status-text">Desconectado</span>
            </div>
            <div class="dsd-stream-panel__actions">
              <button class="dsd-stream-panel__btn" data-action="connect">Conectar</button>
              <button class="dsd-stream-panel__btn" data-action="clear">Limpar</button>
            </div>
          </div>
          <div class="dsd-stream-panel__body">
            <ul class="dsd-stream-panel__list"></ul>
          </div>
          <div class="dsd-stream-panel__footer">
            <span class="dsd-stream-panel__count">0 items</span>
          </div>
        </div>
      `;
      _listEl = _containerEl.querySelector(".dsd-stream-panel__list");
      _containerEl.querySelector('[data-action="connect"]')?.addEventListener("click", () => {
        _connected ? _disconnect() : _connect();
      });
      _containerEl.querySelector('[data-action="clear"]')?.addEventListener("click", () => {
        _clearItems();
      });
      _timerResource = createTimerResource({
        onDispose: () => {
          _disconnect();
        }
      });
      await _timerResource.load(async () => ({ memoryEstimate: 1024 * 1024 }));
    },
    pause() {
      _disconnect();
      _timerResource?.pause?.();
    },
    resume() {
      _timerResource?.resume?.();
      if (streamType !== STREAM_TYPES.MANUAL) {
        _connect();
      }
    },
    async refresh() {
      if (streamType === STREAM_TYPES.POLLING && _connected) {
        await _fetchData();
      }
    },
    async destroy() {
      _disconnect();
      await _timerResource?.dispose?.();
      await _connectionResource?.dispose?.();
      if (_containerEl) _containerEl.innerHTML = "";
      _containerEl = null;
      _listEl = null;
      _items = [];
    },
    healthCheck() {
      return {
        status: _containerEl ? "HEALTHY" : "NOT_INITIALIZED",
        connected: _connected,
        streamType,
        itemCount: _items.length,
        timerResource: _timerResource?.healthCheck?.() || null
      };
    }
  };
  function _connect() {
    if (_connected) return;
    switch (streamType) {
      case STREAM_TYPES.WEBSOCKET:
        _connectWebSocket();
        break;
      case STREAM_TYPES.SSE:
        _connectSSE();
        break;
      case STREAM_TYPES.POLLING:
        _startPolling();
        break;
      default:
        _setConnected(true);
    }
  }
  function _disconnect() {
    if (_ws) {
      _ws.close();
      _ws = null;
    }
    if (_eventSource) {
      _eventSource.close();
      _eventSource = null;
    }
    _timerResource?.clearAll?.();
    _setConnected(false);
  }
  function _connectWebSocket() {
    if (!url) return;
    try {
      _ws = new WebSocket(url);
      _ws.onopen = () => {
        _setConnected(true);
        onConnect?.();
      };
      _ws.onmessage = (event) => {
        _addItem(event.data);
        onMessage?.(event.data);
      };
      _ws.onerror = (error) => {
        onError?.(error);
      };
      _ws.onclose = () => {
        _setConnected(false);
        onDisconnect?.();
      };
    } catch (e) {
      onError?.(e);
    }
  }
  function _connectSSE() {
    if (!url) return;
    try {
      _eventSource = new EventSource(url);
      _eventSource.onopen = () => {
        _setConnected(true);
        onConnect?.();
      };
      _eventSource.onmessage = (event) => {
        _addItem(event.data);
        onMessage?.(event.data);
      };
      _eventSource.onerror = () => {
        _setConnected(false);
        onDisconnect?.();
      };
    } catch (e) {
      onError?.(e);
    }
  }
  function _startPolling() {
    _setConnected(true);
    onConnect?.();
    _fetchData();
    _timerResource?.setInterval?.(() => {
      if (document.hidden) return;
      _fetchData();
    }, pollingInterval);
  }
  async function _fetchData() {
    if (!url) return;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (Array.isArray(data)) {
        data.forEach((item) => _addItem(item));
      } else {
        _addItem(data);
      }
      onMessage?.(data);
    } catch (e) {
      onError?.(e);
    }
  }
  function _addItem(data) {
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      data: typeof data === "string" ? data : JSON.stringify(data)
    };
    _items.unshift(item);
    if (_items.length > maxItems) {
      _items = _items.slice(0, maxItems);
    }
    _renderItem(item);
    _updateCount();
    if (autoScroll && _listEl) {
      _listEl.scrollTop = 0;
    }
  }
  function _renderItem(item) {
    if (!_listEl) return;
    const li = document.createElement("li");
    li.className = "dsd-stream-panel__item";
    li.setAttribute("data-id", item.id);
    li.innerHTML = `
      <span class="dsd-stream-panel__item-time">${item.timestamp}</span>
      <span class="dsd-stream-panel__item-data">${item.data}</span>
    `;
    _listEl.insertBefore(li, _listEl.firstChild);
    while (_listEl.children.length > maxItems) {
      _listEl.removeChild(_listEl.lastChild);
    }
  }
  function _clearItems() {
    _items = [];
    if (_listEl) _listEl.innerHTML = "";
    _updateCount();
  }
  function _updateCount() {
    const el = _containerEl?.querySelector(".dsd-stream-panel__count");
    if (el) el.textContent = `${_items.length} items`;
  }
  function _setConnected(status) {
    _connected = status;
    const indicator = _containerEl?.querySelector(".dsd-stream-panel__indicator");
    const statusText = _containerEl?.querySelector(".dsd-stream-panel__status-text");
    const btn = _containerEl?.querySelector('[data-action="connect"]');
    if (indicator) {
      indicator.classList.toggle("dsd-stream-panel__indicator--connected", status);
    }
    if (statusText) {
      statusText.textContent = status ? "Conectado" : "Desconectado";
    }
    if (btn) {
      btn.textContent = status ? "Desconectar" : "Conectar";
    }
  }
  const panel = createPanel(panelConfig, implementation);
  return {
    ...panel.getComponent(),
    connect: _connect,
    disconnect: _disconnect,
    send(data) {
      if (_ws && _ws.readyState === WebSocket.OPEN) {
        _ws.send(typeof data === "string" ? data : JSON.stringify(data));
      }
    },
    addItem(data) {
      _addItem(data);
    },
    clearItems: _clearItems,
    getItems() {
      return [..._items];
    },
    isConnected() {
      return _connected;
    }
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    streamTypes: Object.keys(STREAM_TYPES)
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID
  };
}
var stream_panel_default = {
  VERSION,
  MODULE_ID,
  STREAM_TYPES,
  createStreamPanel,
  info,
  healthCheck
};
export {
  MODULE_ID,
  STREAM_TYPES,
  VERSION,
  createStreamPanel,
  stream_panel_default as default,
  healthCheck,
  info
};
