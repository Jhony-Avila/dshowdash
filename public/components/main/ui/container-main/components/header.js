const VERSION = "10.0.0-LED-FIX";
const MODULE_ID = "container-header";
const DEFAULT_CONFIG = {
  title: "Container",
  icon: "",
  showStatus: true,
  showBadge: false,
  badgeCount: 0,
  collapsible: true,
  draggable: true,
  breadcrumb: null
};
function createHeader(container, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  let _headerEl = null;
  let _titleEl = null;
  let _statusEl = null;
  let _badgeEl = null;
  let _iconEl = null;
  let _initialized = false;
  function _buildHeader() {
    _headerEl = document.createElement("div");
    _headerEl.className = "dsd-container__header";
    if (cfg.draggable) {
      _headerEl.setAttribute("data-draggable", "true");
    }
    const leftSection = document.createElement("div");
    leftSection.className = "dsd-container__header-left";
    if (cfg.icon) {
      _iconEl = document.createElement("span");
      _iconEl.className = "dsd-container__icon";
      _iconEl.textContent = String(cfg.icon);
      leftSection.appendChild(_iconEl);
    }
    if (cfg.showStatus) {
      _statusEl = document.createElement("span");
      _statusEl.className = "dsd-container__status";
      _statusEl.setAttribute("data-status", "ready");
      _statusEl.setAttribute("aria-label", "Status: pronto");
      leftSection.appendChild(_statusEl);
    }
    _titleEl = document.createElement("span");
    _titleEl.className = "dsd-container__title";
    _titleEl.textContent = String(cfg.title);
    leftSection.appendChild(_titleEl);
    if (cfg.showBadge) {
      _badgeEl = document.createElement("span");
      _badgeEl.className = "dsd-container__badge";
      _badgeEl.textContent = cfg.badgeCount > 99 ? "99+" : String(cfg.badgeCount);
      if (cfg.badgeCount === 0) {
        _badgeEl.style.display = "none";
      }
      leftSection.appendChild(_badgeEl);
    }
    _headerEl.appendChild(leftSection);
    if (cfg.breadcrumb) {
      const breadcrumbEl = document.createElement("nav");
      breadcrumbEl.className = "dsd-breadcrumb";
      breadcrumbEl.innerHTML = String(cfg.breadcrumb);
      _headerEl.appendChild(breadcrumbEl);
    }
    const controlsSection = document.createElement("div");
    controlsSection.className = "dsd-container__controls";
    _headerEl.appendChild(controlsSection);
    return _headerEl;
  }
  return {
    init() {
      if (_initialized) return this;
      _headerEl = _buildHeader();
      if (container && container.firstChild) {
        container.insertBefore(_headerEl, container.firstChild);
      } else if (container) {
        container.appendChild(_headerEl);
      }
      _initialized = true;
      return this;
    },
    getElement() {
      return _headerEl;
    },
    getControlsContainer() {
      return _headerEl?.querySelector(".dsd-container__controls");
    },
    setTitle(title) {
      if (_titleEl) {
        _titleEl.textContent = title;
      }
      return this;
    },
    setIcon(icon) {
      if (_iconEl) {
        _iconEl.textContent = icon;
      }
      return this;
    },
    setStatus(status) {
      if (_statusEl) {
        _statusEl.setAttribute("data-status", status);
        const labels = {
          ready: "Status: pronto",
          loading: "Status: carregando",
          error: "Status: erro",
          success: "Status: sucesso",
          warning: "Status: aten\xE7\xE3o",
          inactive: "Status: inativo"
        };
        _statusEl.setAttribute("aria-label", labels[status] || `Status: ${status}`);
      }
      if (container) {
        container.setAttribute("data-state", status);
      }
      return this;
    },
    setBadge(count) {
      if (_badgeEl) {
        _badgeEl.textContent = count > 99 ? "99+" : String(count);
        _badgeEl.style.display = count > 0 ? "" : "none";
      }
      return this;
    },
    setBreadcrumb(html) {
      let breadcrumbEl = _headerEl?.querySelector(".dsd-breadcrumb");
      if (!breadcrumbEl && html) {
        breadcrumbEl = document.createElement("nav");
        breadcrumbEl.className = "dsd-breadcrumb";
        const controlsEl = _headerEl?.querySelector(".dsd-container__controls");
        if (controlsEl) {
          _headerEl.insertBefore(breadcrumbEl, controlsEl);
        }
      }
      if (breadcrumbEl) {
        breadcrumbEl.innerHTML = html || "";
        breadcrumbEl.style.display = html ? "" : "none";
      }
      return this;
    },
    destroy() {
      if (_headerEl && _headerEl.parentNode) {
        _headerEl.parentNode.removeChild(_headerEl);
      }
      _headerEl = null;
      _titleEl = null;
      _statusEl = null;
      _badgeEl = null;
      _iconEl = null;
      _initialized = false;
    },
    isInitialized() {
      return _initialized;
    },
    info() {
      return {
        version: VERSION,
        moduleId: MODULE_ID,
        initialized: _initialized,
        hasStatus: !!_statusEl,
        hasBadge: !!_badgeEl
      };
    },
    healthCheck() {
      return {
        status: _initialized ? "HEALTHY" : "NOT_INITIALIZED",
        version: VERSION,
        moduleId: MODULE_ID
      };
    }
  };
}
function createHeaderWithStatus(container, title, options = {}) {
  return createHeader(container, {
    title,
    showStatus: true,
    ...options
  });
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var header_default = { createHeader, createHeaderWithStatus, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createHeader,
  createHeaderWithStatus,
  header_default as default,
  healthCheck,
  info
};
