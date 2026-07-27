import { createLogger } from "../logger.js";
import { VERSION, MODULE_ID, LOADING_STATES, DEFAULT_CONFIG } from "./constants.js";
import { createElements, removeElements } from "./dom/elements.js";
import { updateVisual } from "./dom/visual.js";
import { startTrickle, stopTrickle } from "./trickle/manager.js";
import { setSteps as setStepsManager, completeStep as completeStepManager, getCurrentStep, getSteps } from "./steps/manager.js";
function createLoadingProgress(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  const _logger = createLogger(MODULE_ID);
  const refs = {
    element: null,
    barElement: null,
    spinnerElement: null
  };
  const state = {
    loadingState: LOADING_STATES.IDLE,
    progress: 0,
    trickleInterval: null,
    completeTimeout: null,
    steps: [],
    currentStep: 0,
    startTime: null
  };
  const _listeners = /* @__PURE__ */ new Set();
  function _notifyListeners(event, data) {
    _listeners.forEach((listener) => {
      try {
        listener({ event, progress: state.progress, state: state.loadingState, ...data, timestamp: Date.now() });
      } catch (e) {
        _logger.warn("Listener error:", e);
      }
    });
  }
  const manager = {
    start() {
      if (state.loadingState === LOADING_STATES.LOADING) return this;
      createElements(config, refs);
      state.loadingState = LOADING_STATES.LOADING;
      state.progress = 0;
      state.currentStep = 0;
      state.startTime = Date.now();
      requestAnimationFrame(() => {
        refs.element?.classList.add("dsd-loading-progress--visible");
        refs.spinnerElement?.(classList).add("dsd-loading-progress__spinner--visible");
      });
      this.set(10);
      startTrickle(state, config, (p) => this.set(p), () => state.progress);
      _notifyListeners("start", {});
      _logger.debug("Loading started");
      return this;
    },
    set(progress) {
      if (state.loadingState === LOADING_STATES.COMPLETE || state.loadingState === LOADING_STATES.IDLE) return this;
      state.progress = Math.max(0, Math.min(100, progress));
      updateVisual(refs, state.progress);
      _notifyListeners("progress", { progress: state.progress });
      return this;
    },
    inc(amount = 5) {
      if (state.progress >= 100) return this;
      return this.set(state.progress + amount);
    },
    setSteps(steps) {
      setStepsManager(state, steps, _logger);
      return this;
    },
    completeStep(stepId) {
      completeStepManager(state, stepId, (p) => this.set(p), _notifyListeners, () => this.done(), _logger);
      return this;
    },
    getCurrentStep() {
      return getCurrentStep(state);
    },
    done(force = false) {
      if (state.loadingState === LOADING_STATES.COMPLETE || state.loadingState === LOADING_STATES.IDLE) return this;
      stopTrickle(state);
      const elapsed = Date.now() - (state.startTime || Date.now());
      const remaining = Math.max(0, config.minDuration - elapsed);
      if (remaining > 0 && !force) {
        setTimeout(() => this.done(true), remaining);
        return this;
      }
      state.loadingState = LOADING_STATES.COMPLETING;
      refs.element?.classList.add("dsd-loading-progress--completing");
      this.set(100);
      _notifyListeners("completing", {});
      const hideDelay = config.autoComplete ? config.autoCompleteDelay : 0;
      state.completeTimeout = setTimeout(() => {
        state.loadingState = LOADING_STATES.COMPLETE;
        refs.element?.classList.remove("dsd-loading-progress--visible", "dsd-loading-progress--completing");
        refs.spinnerElement?.(classList).remove("dsd-loading-progress__spinner--visible");
        _notifyListeners("complete", { duration: Date.now() - (state.startTime || Date.now()) });
        _logger.debug("Loading complete");
        setTimeout(() => {
          if (state.loadingState === LOADING_STATES.COMPLETE) {
            state.progress = 0;
            state.steps = [];
            state.currentStep = 0;
            state.loadingState = LOADING_STATES.IDLE;
            updateVisual(refs, state.progress);
          }
        }, 300);
      }, hideDelay);
      return this;
    },
    error() {
      stopTrickle(state);
      state.loadingState = LOADING_STATES.ERROR;
      if (refs.barElement) {
        refs.barElement.style.background = "var(--cm-color-error, #ef4444)";
      }
      _notifyListeners("error", {});
      _logger.debug("Loading error");
      setTimeout(() => {
        refs.element?.classList.remove("dsd-loading-progress--visible");
        refs.spinnerElement?.(classList).remove("dsd-loading-progress__spinner--visible");
        setTimeout(() => {
          state.loadingState = LOADING_STATES.IDLE;
          state.progress = 0;
          if (refs.barElement) {
            refs.barElement.style.background = config.color;
          }
          updateVisual(refs, state.progress);
        }, 300);
      }, 2e3);
      return this;
    },
    cancel() {
      stopTrickle(state);
      if (state.completeTimeout) {
        clearTimeout(state.completeTimeout);
        state.completeTimeout = null;
      }
      refs.element?.classList.remove("dsd-loading-progress--visible", "dsd-loading-progress--completing");
      refs.spinnerElement?.(classList).remove("dsd-loading-progress__spinner--visible");
      state.loadingState = LOADING_STATES.IDLE;
      state.progress = 0;
      state.steps = [];
      state.currentStep = 0;
      updateVisual(refs, state.progress);
      _notifyListeners("cancel", {});
      _logger.debug("Loading cancelled");
      return this;
    },
    getProgress() {
      return state.progress;
    },
    getState() {
      return state.loadingState;
    },
    isLoading() {
      return state.loadingState === LOADING_STATES.LOADING || state.loadingState === LOADING_STATES.COMPLETING;
    },
    getSteps() {
      return getSteps(state);
    },
    interceptFetch() {
      const originalFetch = window.fetch;
      const self = this;
      window.fetch = async function(...args) {
        self.start();
        try {
          const response = await originalFetch.apply(this, args);
          const clone = response.clone();
          const contentLength = response.headers.get("content-length");
          if (contentLength && response.body) {
            const total = parseInt(contentLength, 10);
            let loaded = 0;
            const reader = response.body.getReader();
            const chunks = [];
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
              loaded += value.length;
              const progress = 10 + loaded / total * 80;
              self.set(progress);
            }
          }
          self.done();
          return clone;
        } catch (error) {
          self.error();
          throw error;
        }
      };
      _logger.debug("Fetch interceptor installed");
      return this;
    },
    subscribe(listener) {
      if (typeof listener === "function") {
        _listeners.add(listener);
        return () => _listeners.delete(listener);
      }
      return () => {
      };
    },
    async promise(promiseOrFn, options2 = {}) {
      const { steps = null } = options2;
      this.start();
      if (steps) this.setSteps(steps);
      try {
        const result = await (typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn);
        this.done();
        return result;
      } catch (error) {
        this.error();
        throw error;
      }
    },
    healthCheck() {
      return {
        status: "HEALTHY",
        version: VERSION,
        moduleId: MODULE_ID,
        state: state.loadingState,
        progress: state.progress,
        isLoading: this.isLoading(),
        stepsCount: state.steps.length,
        currentStep: state.currentStep
      };
    },
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        states: Object.values(LOADING_STATES),
        config: {
          minDuration: config.minDuration,
          position: config.position,
          showSpinner: config.showSpinner
        }
      };
    },
    destroy() {
      this.cancel();
      removeElements(refs);
      _listeners.clear();
    }
  };
  return manager;
}
export {
  createLoadingProgress
};
