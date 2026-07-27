const VERSION = "2.7.0-LED-GRADIENT";
const MODULE_ID = "container-port";
function createContainerPort(adapter) {
  const _containers = /* @__PURE__ */ new Map();
  let _primaryId = null;
  function _generateId() {
    return `container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  function _createContainerStructure(config) {
    const rootEl = document.createElement("div");
    rootEl.className = "dsd-container";
    rootEl.setAttribute("data-container-id", config.id);
    rootEl.setAttribute("data-variant", config.variant || "default");
    rootEl.setAttribute("data-state", "ready");
    rootEl.setAttribute("tabindex", "0");
    rootEl.setAttribute("role", "region");
    rootEl.setAttribute("aria-label", config.title || "Container");
    const headerEl = document.createElement("div");
    headerEl.className = "dsd-container__header";
    headerEl.setAttribute("data-draggable", "true");
    const headerLeft = document.createElement("div");
    headerLeft.className = "dsd-container__header-left";
    const statusEl = document.createElement("span");
    statusEl.className = "dsd-container__status";
    statusEl.setAttribute("data-status", "ready");
    statusEl.setAttribute("aria-label", "Status: pronto");
    headerLeft.appendChild(statusEl);
    const titleEl = document.createElement("span");
    titleEl.className = "dsd-container__title";
    titleEl.textContent = config.title || "Container";
    headerLeft.appendChild(titleEl);
    headerEl.appendChild(headerLeft);
    const controlsEl = document.createElement("div");
    controlsEl.className = "dsd-container__controls";
    headerEl.appendChild(controlsEl);
    rootEl.appendChild(headerEl);
    const bodyEl = document.createElement("div");
    bodyEl.className = "dsd-container__body";
    const contentEl = document.createElement("div");
    contentEl.className = "dsd-container__content";
    contentEl.setAttribute("data-state", "ready");
    bodyEl.appendChild(contentEl);
    rootEl.appendChild(bodyEl);
    return {
      rootEl,
      headerEl,
      bodyEl,
      contentEl,
      statusEl,
      titleEl,
      controlsEl
    };
  }
  return {
    create(config) {
      config = config || {};
      const id = config.id || _generateId();
      if (_containers.has(id)) {
        return _containers.get(id);
      }
      const structure = _createContainerStructure(Object.assign({ id }, config));
      const container = {
        id,
        config,
        rootEl: structure.rootEl,
        headerEl: structure.headerEl,
        bodyEl: structure.bodyEl,
        contentEl: structure.contentEl,
        statusEl: structure.statusEl,
        titleEl: structure.titleEl,
        controlsEl: structure.controlsEl,
        controls: null,
        enhancements: null,
        setTitle(title) {
          if (structure.titleEl) {
            structure.titleEl.textContent = title;
          }
          return this;
        },
        setStatus(status) {
          if (structure.statusEl) {
            structure.statusEl.setAttribute("data-status", status);
          }
          if (structure.rootEl) {
            structure.rootEl.setAttribute("data-state", status);
          }
          return this;
        },
        setContent(html) {
          if (structure.contentEl) {
            structure.contentEl.innerHTML = html;
          }
          return this;
        },
        appendContent(element) {
          if (structure.contentEl && element) {
            structure.contentEl.appendChild(element);
          }
          return this;
        },
        clearContent() {
          if (structure.contentEl) {
            structure.contentEl.innerHTML = "";
          }
          return this;
        },
        show() {
          if (structure.rootEl) {
            structure.rootEl.style.display = "";
          }
          return this;
        },
        hide() {
          if (structure.rootEl) {
            structure.rootEl.style.display = "none";
          }
          return this;
        },
        destroy() {
          if (structure.rootEl && structure.rootEl.parentNode) {
            structure.rootEl.parentNode.removeChild(structure.rootEl);
          }
          _containers.delete(id);
        }
      };
      _containers.set(id, container);
      if (adapter && adapter.create) {
        adapter.create(container);
      }
      return container;
    },
    get(id) {
      return _containers.get(id) || null;
    },
    getOrCreate(config) {
      config = config || {};
      const id = config.id || "default";
      if (_containers.has(id)) {
        return _containers.get(id);
      }
      const container = this.create(config);
      if (config.id === "primary" || id === "primary") {
        _primaryId = id;
      }
      return container;
    },
    getPrimary() {
      if (_primaryId && _containers.has(_primaryId)) {
        return _containers.get(_primaryId);
      }
      return null;
    },
    setPrimary(id) {
      if (_containers.has(id)) {
        _primaryId = id;
        return true;
      }
      return false;
    },
    resolvePrimaryHandle() {
      const primary = this.getPrimary();
      if (!primary) return null;
      return {
        containerId: primary.id,
        rootEl: primary.rootEl,
        contentEl: primary.contentEl,
        mode: primary.config.layoutPolicy?.mode || "default",
        setContent: primary.setContent.bind(primary),
        appendContent: primary.appendContent.bind(primary),
        clearContent: primary.clearContent.bind(primary),
        setStatus: primary.setStatus.bind(primary),
        setTitle: primary.setTitle.bind(primary)
      };
    },
    destroy(id) {
      const container = _containers.get(id);
      if (container) {
        container.destroy();
        return true;
      }
      return false;
    },
    destroyAll() {
      _containers.forEach((container) => {
        container.destroy();
      });
      _containers.clear();
      _primaryId = null;
    },
    list() {
      return Array.from(_containers.keys());
    },
    count() {
      return _containers.size;
    },
    info() {
      return {
        version: VERSION,
        moduleId: MODULE_ID,
        containerCount: _containers.size,
        primaryId: _primaryId,
        containers: Array.from(_containers.keys())
      };
    },
    healthCheck() {
      return {
        status: "HEALTHY",
        version: VERSION,
        moduleId: MODULE_ID,
        containerCount: _containers.size,
        hasPrimary: !!_primaryId
      };
    }
  };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var ContainerPort_default = { createContainerPort, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createContainerPort,
  ContainerPort_default as default,
  healthCheck,
  info
};
