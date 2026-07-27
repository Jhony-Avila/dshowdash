import { VERSION, MODULE_ID, SKELETON_TYPES, DELAY_VARIANTS } from "../constants.js";
import { SKELETON_TEMPLATES, generateSkeletonHTML } from "../templates/skeleton-templates.js";
import { PANEL_TYPE_MAP, getTypeForPanel } from "../mappings/panel-map.js";
import { createLogger } from "../../logger.js";
function createSkeletonManager(options) {
  options = options || {};
  const defaultType = options.defaultType || SKELETON_TYPES.GENERIC;
  const defaultDelay = options.defaultDelay || DELAY_VARIANTS.NORMAL;
  const customTemplates = options.customTemplates || {};
  const customPanelMap = options.panelTypeMap || {};
  const _logger = createLogger(MODULE_ID);
  const _templates = Object.assign({}, SKELETON_TEMPLATES, customTemplates);
  const _panelMap = Object.assign({}, PANEL_TYPE_MAP, customPanelMap);
  const _activeSkeletons = /* @__PURE__ */ new Map();
  const _listeners = [];
  function _notifyListeners(event, data) {
    for (let i = 0; i < _listeners.length; i++) {
      try {
        const payload = Object.assign({ event, timestamp: Date.now() }, data);
        _listeners[i](payload);
      } catch (e) {
        _logger.warn("Listener error:", e);
      }
    }
  }
  function _applyDelayClass(element, delay) {
    element.classList.remove("dsd-container__skeleton--instant", "dsd-container__skeleton--slow");
    if (delay === DELAY_VARIANTS.INSTANT) {
      element.classList.add("dsd-container__skeleton--instant");
    } else if (delay === DELAY_VARIANTS.SLOW) {
      element.classList.add("dsd-container__skeleton--slow");
    }
  }
  function _generateId() {
    return `skeleton-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  const manager = {
    // Mostra skeleton em um container
    show(container, options2) {
      options2 = options2 || {};
      if (!container) {
        _logger.warn("No container provided");
        return null;
      }
      const type = options2.type || defaultType;
      const panelId = options2.panelId || null;
      const delay = options2.delay || defaultDelay;
      const params = options2.params || {};
      const replace = options2.replace !== false;
      const finalType = panelId ? getTypeForPanel(panelId, _panelMap, defaultType) : type;
      const html = generateSkeletonHTML(finalType, params, _templates);
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html.trim();
      const skeleton = wrapper.firstElementChild;
      _applyDelayClass(skeleton, delay);
      const skeletonId = _generateId();
      skeleton.setAttribute("data-skeleton-id", skeletonId);
      skeleton.setAttribute("data-skeleton-type", finalType);
      if (replace) {
        container.innerHTML = "";
      }
      container.appendChild(skeleton);
      _activeSkeletons.set(skeletonId, {
        element: skeleton,
        container,
        type: finalType,
        panelId,
        createdAt: Date.now()
      });
      _logger.debug(`Skeleton shown: ${finalType}`, { skeletonId, panelId });
      _notifyListeners("shown", { skeletonId, type: finalType, panelId });
      return skeletonId;
    },
    // Mostra skeleton contextual baseado no painel
    showForPanel(container, panelId, options2) {
      options2 = options2 || {};
      options2.panelId = panelId;
      options2.type = getTypeForPanel(panelId, _panelMap, defaultType);
      return this.show(container, options2);
    },
    // Oculta skeleton
    hide(skeletonIdOrContainer, options2) {
      options2 = options2 || {};
      const animate = options2.animate !== false;
      const delay = options2.delay || 0;
      let skeleton = null;
      let skeletonId = null;
      if (typeof skeletonIdOrContainer === "string") {
        skeletonId = skeletonIdOrContainer;
        const record = _activeSkeletons.get(skeletonId);
        skeleton = record ? record.element : null;
      } else if (skeletonIdOrContainer instanceof HTMLElement) {
        skeleton = skeletonIdOrContainer.querySelector("[data-skeleton-id]");
        skeletonId = skeleton ? skeleton.getAttribute("data-skeleton-id") : null;
      }
      if (!skeleton) {
        _logger.debug("No skeleton found to hide");
        return false;
      }
      const doHide = () => {
        if (animate) {
          skeleton.style.transition = "opacity 0.2s ease-out";
          skeleton.style.opacity = "0";
          setTimeout(() => {
            skeleton.remove();
            _activeSkeletons.delete(skeletonId);
            _notifyListeners("hidden", { skeletonId });
          }, 200);
        } else {
          skeleton.remove();
          _activeSkeletons.delete(skeletonId);
          _notifyListeners("hidden", { skeletonId });
        }
        _logger.debug(`Skeleton hidden: ${skeletonId}`);
      };
      if (delay > 0) {
        setTimeout(doHide, delay);
      } else {
        doHide();
      }
      return true;
    },
    // Oculta todos os skeletons
    hideAll(options2) {
      options2 = options2 || {};
      const animate = options2.animate !== false;
      const self = this;
      _activeSkeletons.forEach((data, skeletonId) => {
        self.hide(skeletonId, { animate });
      });
    },
    // Substitui skeleton por conteúdo
    replace(skeletonIdOrContainer, content, options2) {
      options2 = options2 || {};
      const animate = options2.animate !== false;
      const self = this;
      let container = null;
      let skeletonId = null;
      if (typeof skeletonIdOrContainer === "string") {
        skeletonId = skeletonIdOrContainer;
        const record = _activeSkeletons.get(skeletonId);
        container = record ? record.container : null;
      } else {
        container = skeletonIdOrContainer;
        const skeleton = container.querySelector("[data-skeleton-id]");
        skeletonId = skeleton ? skeleton.getAttribute("data-skeleton-id") : null;
      }
      if (!container) {
        _logger.warn("No container found for replacement");
        return false;
      }
      this.hide(skeletonId, { animate, delay: 0 });
      setTimeout(() => {
        if (typeof content === "string") {
          container.innerHTML = content;
        } else if (content instanceof HTMLElement) {
          container.innerHTML = "";
          container.appendChild(content);
        } else if (content instanceof DocumentFragment) {
          container.innerHTML = "";
          container.appendChild(content);
        }
        if (animate) {
          const newContent = container.firstElementChild;
          if (newContent) {
            newContent.style.opacity = "0";
            newContent.style.transform = "translateY(8px)";
            newContent.style.transition = "opacity 0.3s ease-out, transform 0.3s ease-out";
            requestAnimationFrame(() => {
              newContent.style.opacity = "1";
              newContent.style.transform = "translateY(0)";
            });
          }
        }
        _notifyListeners("replaced", { skeletonId, container });
      }, animate ? 200 : 0);
      return true;
    },
    // Registra template customizado
    registerTemplate(type, template) {
      _templates[type] = template;
      _logger.debug(`Template registered: ${type}`);
      return this;
    },
    // Mapeia painel para tipo
    mapPanelType(panelId, type) {
      _panelMap[panelId] = type;
      return this;
    },
    // Getters
    getActiveSkeletons() {
      const result = [];
      _activeSkeletons.forEach((data, id) => {
        result.push(Object.assign({ id }, data));
      });
      return result;
    },
    getActiveCount() {
      return _activeSkeletons.size;
    },
    isActive(skeletonId) {
      return _activeSkeletons.has(skeletonId);
    },
    getTypeForPanel(panelId) {
      return getTypeForPanel(panelId, _panelMap, defaultType);
    },
    // Preview de skeleton
    preview(type, container) {
      return this.show(container, { type, delay: DELAY_VARIANTS.INSTANT });
    },
    // Event listeners
    subscribe(listener) {
      if (typeof listener === "function") {
        _listeners.push(listener);
        return () => {
          const idx = _listeners.indexOf(listener);
          if (idx >= 0) _listeners.splice(idx, 1);
        };
      }
      return () => {
      };
    },
    // Health check
    healthCheck() {
      return {
        status: "HEALTHY",
        version: VERSION,
        moduleId: MODULE_ID,
        activeCount: _activeSkeletons.size,
        registeredTypes: Object.keys(_templates).length,
        panelMappings: Object.keys(_panelMap).length
      };
    },
    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        types: Object.keys(SKELETON_TYPES).map((k) => SKELETON_TYPES[k]),
        delays: Object.keys(DELAY_VARIANTS).map((k) => DELAY_VARIANTS[k]),
        registeredTypes: Object.keys(_templates),
        panelMappings: Object.keys(_panelMap)
      };
    },
    // Reset
    reset() {
      this.hideAll({ animate: false });
      _activeSkeletons.clear();
    }
  };
  return manager;
}
var manager_default = {
  createSkeletonManager
};
export {
  createSkeletonManager,
  manager_default as default
};
