import { createLogger } from "./logger.js";
import { getPerformanceAPI } from "./performance-api/index.js";
const VERSION = "1.0.0";
const MODULE_ID = "container-main:panel-transitions";
const TRANSITION_TYPES = Object.freeze({
  FADE: "fade",
  SLIDE_LEFT: "slide-left",
  SLIDE_RIGHT: "slide-right",
  SLIDE_UP: "slide-up",
  SCALE: "scale",
  ZOOM: "zoom",
  CROSSFADE: "crossfade",
  MORPH: "morph",
  NONE: "none",
  AUTO: "auto"
});
const NAVIGATION_DIRECTION = Object.freeze({
  FORWARD: "forward",
  BACKWARD: "backward",
  REPLACE: "replace"
});
const DEFAULT_CONFIG = Object.freeze({
  type: TRANSITION_TYPES.FADE,
  duration: 300,
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  stagger: false,
  staggerDelay: 50,
  respectReducedMotion: true
});
function createPanelTransitions(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  const _logger = createLogger(MODULE_ID);
  const _perfAPI = getPerformanceAPI();
  let _currentTransition = null;
  let _transitionQueue = [];
  let _navigationStack = [];
  let _listeners = /* @__PURE__ */ new Set();
  function _prefersReducedMotion() {
    return config.respectReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function _getAutoTransitionType(direction) {
    if (_prefersReducedMotion()) return TRANSITION_TYPES.NONE;
    switch (direction) {
      case NAVIGATION_DIRECTION.FORWARD:
        return TRANSITION_TYPES.SLIDE_LEFT;
      case NAVIGATION_DIRECTION.BACKWARD:
        return TRANSITION_TYPES.SLIDE_RIGHT;
      case NAVIGATION_DIRECTION.REPLACE:
        return TRANSITION_TYPES.FADE;
      default:
        return TRANSITION_TYPES.FADE;
    }
  }
  function _resolveTransitionType(type, direction) {
    if (_prefersReducedMotion()) return TRANSITION_TYPES.NONE;
    if (type === TRANSITION_TYPES.AUTO) return _getAutoTransitionType(direction);
    return type;
  }
  function _applyTransitionClasses(element, type, phase) {
    const prefix = `dsd-panel-transition--${type}`;
    element.className = element.className.split(" ").filter((c) => !c.startsWith("dsd-panel-transition--")).join(" ");
    element.classList.add("dsd-panel-transition");
    element.classList.add(`${prefix}-${phase}`);
  }
  function _exitTransition(element, type, duration) {
    return new Promise((resolve) => {
      if (type === TRANSITION_TYPES.NONE || !element) {
        if (element) element.style.display = "none";
        resolve();
        return;
      }
      _applyTransitionClasses(element, type, "exit");
      element.offsetHeight;
      _applyTransitionClasses(element, type, "exit-active");
      const onEnd = () => {
        element.removeEventListener("transitionend", onEnd);
        element.style.display = "none";
        resolve();
      };
      element.addEventListener("transitionend", onEnd, { once: true });
      setTimeout(() => {
        element.removeEventListener("transitionend", onEnd);
        element.style.display = "none";
        resolve();
      }, duration + 50);
    });
  }
  function _enterTransition(element, type, duration) {
    return new Promise((resolve) => {
      if (type === TRANSITION_TYPES.NONE || !element) {
        if (element) element.style.display = "";
        resolve();
        return;
      }
      element.style.display = "";
      _applyTransitionClasses(element, type, "enter");
      element.offsetHeight;
      _applyTransitionClasses(element, type, "enter-active");
      const onEnd = () => {
        element.removeEventListener("transitionend", onEnd);
        element.className = element.className.split(" ").filter((c) => !c.startsWith("dsd-panel-transition")).join(" ");
        resolve();
      };
      element.addEventListener("transitionend", onEnd, { once: true });
      setTimeout(() => {
        element.removeEventListener("transitionend", onEnd);
        element.className = element.className.split(" ").filter((c) => !c.startsWith("dsd-panel-transition")).join(" ");
        resolve();
      }, duration + 50);
    });
  }
  function _notifyListeners(event, data) {
    _listeners.forEach((listener) => {
      try {
        listener({ event, ...data, timestamp: Date.now() });
      } catch (e) {
        _logger.warn("Listener error:", e);
      }
    });
  }
  const manager = {
    // Executa transição entre painéis
    async transition(container, oldContent, newContent, options2 = {}) {
      const {
        type = config.type,
        direction = NAVIGATION_DIRECTION.FORWARD,
        duration = config.duration,
        onStart,
        onComplete
      } = options2;
      if (_currentTransition) {
        return new Promise((resolve) => {
          _transitionQueue.push({ container, oldContent, newContent, options: options2, resolve });
        });
      }
      _currentTransition = { container, oldContent, newContent };
      const resolvedType = _resolveTransitionType(type, direction);
      const startTime = performance.now();
      _logger.debug(`Transition: ${resolvedType} (${direction})`);
      _notifyListeners("start", { type: resolvedType, direction });
      container.classList.add("dsd-container__content--transitioning");
      container.setAttribute("data-transition-direction", direction);
      if (onStart) onStart();
      try {
        if (resolvedType === TRANSITION_TYPES.CROSSFADE) {
          if (oldContent) oldContent.style.position = "absolute";
          if (newContent) {
            newContent.style.position = "absolute";
            container.appendChild(newContent);
          }
          await Promise.all([
            _exitTransition(oldContent, resolvedType, duration),
            _enterTransition(newContent, resolvedType, duration)
          ]);
          if (oldContent) oldContent.remove();
          if (newContent) newContent.style.position = "";
        } else {
          await _exitTransition(oldContent, resolvedType, duration);
          if (oldContent) oldContent.remove();
          if (newContent) container.appendChild(newContent);
          await _enterTransition(newContent, resolvedType, duration);
        }
        const transitionTime = performance.now() - startTime;
        _perfAPI.recordRender(transitionTime, "panel-transition");
        _notifyListeners("complete", { type: resolvedType, direction, duration: transitionTime });
      } catch (error) {
        _logger.error("Transition error:", error);
        _notifyListeners("error", { error: error.message });
      } finally {
        container.classList.remove("dsd-container__content--transitioning");
        container.removeAttribute("data-transition-direction");
        if (onComplete) onComplete();
        _currentTransition = null;
        if (_transitionQueue.length > 0) {
          const next = _transitionQueue.shift();
          this.transition(next.container, next.oldContent, next.newContent, next.options).then(next.resolve);
        }
      }
    },
    // Transição simplificada - substitui conteúdo
    async replaceContent(container, newContent, options2 = {}) {
      const oldContent = container.firstElementChild;
      return this.transition(container, oldContent, newContent, options2);
    },
    // Navegação com histórico
    async navigateTo(container, newContent, panelId, options2 = {}) {
      const direction = options2.direction || NAVIGATION_DIRECTION.FORWARD;
      if (direction === NAVIGATION_DIRECTION.FORWARD) {
        _navigationStack.push(panelId);
      } else if (direction === NAVIGATION_DIRECTION.BACKWARD) {
        _navigationStack.pop();
      }
      return this.replaceContent(container, newContent, {
        ...options2,
        direction,
        type: options2.type || TRANSITION_TYPES.AUTO
      });
    },
    // Navega para trás
    async goBack(container, getContentFn) {
      if (_navigationStack.length <= 1) {
        _logger.warn("Cannot go back - no history");
        return false;
      }
      _navigationStack.pop();
      const previousPanelId = _navigationStack[_navigationStack.length - 1];
      const newContent = await getContentFn(previousPanelId);
      if (!newContent) return false;
      await this.replaceContent(container, newContent, {
        direction: NAVIGATION_DIRECTION.BACKWARD,
        type: TRANSITION_TYPES.AUTO
      });
      return true;
    },
    // Getters
    isTransitioning() {
      return _currentTransition !== null;
    },
    getQueueLength() {
      return _transitionQueue.length;
    },
    getNavigationStack() {
      return [..._navigationStack];
    },
    canGoBack() {
      return _navigationStack.length > 1;
    },
    // Configuração
    setDefaultType(type) {
      if (TRANSITION_TYPES[type.toUpperCase().replace("-", "_")]) {
        config.type = type;
      }
      return this;
    },
    setDuration(duration) {
      config.duration = Math.max(0, Math.min(1e3, duration));
      return this;
    },
    // Event listeners
    subscribe(listener) {
      if (typeof listener === "function") {
        _listeners.add(listener);
        return () => _listeners.delete(listener);
      }
      return () => {
      };
    },
    // Reset
    reset() {
      _transitionQueue = [];
      _navigationStack = [];
      _currentTransition = null;
    },
    // Clear history
    clearHistory() {
      _navigationStack = [];
    },
    // Health check
    healthCheck() {
      return {
        status: "HEALTHY",
        version: VERSION,
        moduleId: MODULE_ID,
        isTransitioning: this.isTransitioning(),
        queueLength: this.getQueueLength(),
        historyLength: _navigationStack.length,
        prefersReducedMotion: _prefersReducedMotion()
      };
    },
    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        types: Object.values(TRANSITION_TYPES),
        directions: Object.values(NAVIGATION_DIRECTION),
        config: { ...config }
      };
    }
  };
  return manager;
}
let _instance = null;
function getPanelTransitions(options = {}) {
  if (!_instance) {
    _instance = createPanelTransitions(options);
  }
  return _instance;
}
function resetPanelTransitions() {
  if (_instance) {
    _instance.reset();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, types: Object.values(TRANSITION_TYPES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var panel_transitions_default = {
  VERSION,
  MODULE_ID,
  TRANSITION_TYPES,
  NAVIGATION_DIRECTION,
  createPanelTransitions,
  getPanelTransitions,
  resetPanelTransitions,
  info,
  healthCheck
};
export {
  MODULE_ID,
  NAVIGATION_DIRECTION,
  TRANSITION_TYPES,
  VERSION,
  createPanelTransitions,
  panel_transitions_default as default,
  getPanelTransitions,
  healthCheck,
  info,
  resetPanelTransitions
};
