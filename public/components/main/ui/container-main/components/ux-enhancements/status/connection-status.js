const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "main.ui.container-main.components.ux-enhancements.status.connection-status";
function createConnectionStatus(container) {
  let _statusEl = null;
  let _currentState = "online";
  let _initialized = false;
  const STATES = {
    online: { label: "Online", class: "online" },
    offline: { label: "Offline", class: "offline" },
    syncing: { label: "Sincronizando...", class: "syncing" },
    reconnecting: { label: "Reconectando...", class: "reconnecting" }
  };
  function _ensureElement() {
    if (_statusEl) return _statusEl;
    const headerRight = container?.querySelector(".dsd-container__header-right");
    if (!headerRight) return null;
    _statusEl = document.createElement("div");
    _statusEl.className = "dsd-container__connection dsd-container__connection--online";
    _statusEl.innerHTML = `
      <span class="dsd-container__connection-dot"></span>
      <span class="dsd-container__connection-label">Online</span>
    `;
    const controls = headerRight.querySelector(".dsd-container__controls");
    if (controls) {
      headerRight.insertBefore(_statusEl, controls);
    } else {
      headerRight.appendChild(_statusEl);
    }
    return _statusEl;
  }
  function _updateState(state) {
    const el = _ensureElement();
    if (!el || !STATES[state]) return;
    Object.values(STATES).forEach((s) => {
      el.classList.remove(`dsd-container__connection--${s.class}`);
    });
    el.classList.add(`dsd-container__connection--${STATES[state].class}`);
    el.querySelector(".dsd-container__connection-label").textContent = STATES[state].label;
    _currentState = state;
  }
  return {
    init() {
      if (_initialized) return this;
      _ensureElement();
      _initialized = true;
      return this;
    },
    online() {
      _updateState("online");
      return this;
    },
    offline() {
      _updateState("offline");
      return this;
    },
    syncing() {
      _updateState("syncing");
      return this;
    },
    reconnecting() {
      _updateState("reconnecting");
      return this;
    },
    setState(state) {
      _updateState(state);
      return this;
    },
    getState() {
      return _currentState;
    },
    autoDetect() {
      const updateOnlineStatus = () => {
        _updateState(navigator.onLine ? "online" : "offline");
      };
      window.addEventListener("online", updateOnlineStatus);
      window.addEventListener("offline", updateOnlineStatus);
      updateOnlineStatus();
      return this;
    },
    hide() {
      if (_statusEl) _statusEl.style.display = "none";
      return this;
    },
    show() {
      if (_statusEl) _statusEl.style.display = "";
      return this;
    },
    destroy() {
      if (_statusEl) _statusEl.remove();
      _statusEl = null;
      _initialized = false;
    },
    isInitialized() {
      return _initialized;
    }
  };
}
export {
  MODULE_ID,
  VERSION,
  createConnectionStatus
};
