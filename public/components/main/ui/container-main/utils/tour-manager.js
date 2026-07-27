import { createLogger } from "./logger.js";
const VERSION = "1.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "container-main:tour-manager";
const logger = createLogger(MODULE_ID);
const TOUR_STATES = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  PAUSED: "paused",
  COMPLETED: "completed"
});
const TOOLTIP_POSITIONS = Object.freeze({
  TOP: "top",
  BOTTOM: "bottom",
  LEFT: "left",
  RIGHT: "right",
  AUTO: "auto"
});
const DEFAULT_CONFIG = Object.freeze({
  overlayColor: "rgba(0, 0, 0, 0.7)",
  highlightPadding: 8,
  tooltipOffset: 12,
  animationDuration: 300,
  allowSkip: true,
  allowClose: true,
  showProgress: true,
  showStepNumbers: true,
  scrollBehavior: "smooth",
  scrollPadding: 100,
  persistProgress: true,
  autoStart: false,
  keyboardNavigation: true
});
const STORAGE_KEY = "dsd:container-main:tour-progress";
let _instance = null;
let _config = { ...DEFAULT_CONFIG };
let _state = TOUR_STATES.IDLE;
let _tours = /* @__PURE__ */ new Map();
let _currentTour = null;
let _currentStepIndex = -1;
let _overlayEl = null;
let _tooltipEl = null;
let _highlightEl = null;
let _listeners = [];
let _completedTours = /* @__PURE__ */ new Set();
let _isInitialized = false;
const _metrics = { toursStarted: 0, toursCompleted: 0, stepsViewed: 0, errors: 0 };
function _emit(event, data) {
  _listeners.forEach((listener) => {
    try {
      listener({ type: event, data, timestamp: Date.now() });
    } catch (e) {
      _metrics.errors++;
    }
  });
}
function _saveProgress() {
  if (!_config.persistProgress) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: Array.from(_completedTours) }));
  } catch (e) {
  }
}
function _loadProgress() {
  if (!_config.persistProgress) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      _completedTours = new Set(data.completed || []);
    }
  } catch (e) {
  }
}
function _createOverlay() {
  if (_overlayEl) return;
  _overlayEl = document.createElement("div");
  _overlayEl.className = "dsd-tour-overlay";
  _overlayEl.innerHTML = `<style>.dsd-tour-overlay{position:fixed;top:0;left:0;right:0;bottom:0;z-index:99990;pointer-events:none;opacity:0;transition:opacity ${_config.animationDuration}ms ease}.dsd-tour-overlay--active{opacity:1}.dsd-tour-highlight{position:absolute;z-index:99991;border-radius:8px;box-shadow:0 0 0 9999px ${_config.overlayColor};pointer-events:none;transition:all ${_config.animationDuration}ms ease}.dsd-tour-tooltip{position:absolute;z-index:99992;max-width:360px;background:var(--cm-bg-elevated,#1e293b);border:1px solid var(--cm-border-default,rgba(139,92,246,.3));border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,.4);pointer-events:auto;opacity:0;transform:translateY(10px);transition:opacity ${_config.animationDuration}ms ease,transform ${_config.animationDuration}ms ease}.dsd-tour-tooltip--visible{opacity:1;transform:translateY(0)}.dsd-tour-tooltip-arrow{position:absolute;width:12px;height:12px;background:var(--cm-bg-elevated,#1e293b);border:1px solid var(--cm-border-default,rgba(139,92,246,.3));transform:rotate(45deg)}.dsd-tour-tooltip--top .dsd-tour-tooltip-arrow{bottom:-7px;left:50%;margin-left:-6px;border-top:none;border-left:none}.dsd-tour-tooltip--bottom .dsd-tour-tooltip-arrow{top:-7px;left:50%;margin-left:-6px;border-bottom:none;border-right:none}.dsd-tour-tooltip--left .dsd-tour-tooltip-arrow{right:-7px;top:50%;margin-top:-6px;border-left:none;border-bottom:none}.dsd-tour-tooltip--right .dsd-tour-tooltip-arrow{left:-7px;top:50%;margin-top:-6px;border-right:none;border-top:none}.dsd-tour-header{display:flex;align-items:center;justify-content:space-between;padding:16px 16px 0}.dsd-tour-step-badge{padding:4px 10px;background:var(--cm-accent-primary,#8b5cf6);border-radius:12px;font-size:11px;font-weight:600;color:white}.dsd-tour-close{width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:transparent;border:none;border-radius:6px;color:var(--cm-text-muted,rgba(255,255,255,.5));cursor:pointer;transition:background .15s ease,color .15s ease}.dsd-tour-close:hover{background:rgba(239,68,68,.2);color:#ef4444}.dsd-tour-content{padding:16px}.dsd-tour-title{margin:0 0 8px;font-size:16px;font-weight:600;color:var(--cm-text-primary,white)}.dsd-tour-description{margin:0;font-size:14px;line-height:1.5;color:var(--cm-text-secondary,rgba(255,255,255,.7))}.dsd-tour-footer{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid var(--cm-border-subtle,rgba(255,255,255,.1))}.dsd-tour-progress{display:flex;gap:4px}.dsd-tour-progress-dot{width:8px;height:8px;border-radius:50%;background:var(--cm-bg-tertiary,rgba(255,255,255,.2));transition:background .15s ease}.dsd-tour-progress-dot--active{background:var(--cm-accent-primary,#8b5cf6)}.dsd-tour-progress-dot--completed{background:var(--cm-accent-secondary,#22c55e)}.dsd-tour-actions{display:flex;gap:8px}.dsd-tour-btn{padding:8px 16px;border:none;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;transition:background .15s ease,transform .1s ease}.dsd-tour-btn:active{transform:scale(.97)}.dsd-tour-btn--secondary{background:var(--cm-bg-tertiary,rgba(255,255,255,.1));color:var(--cm-text-secondary,rgba(255,255,255,.7))}.dsd-tour-btn--secondary:hover{background:var(--cm-bg-hover,rgba(255,255,255,.15))}.dsd-tour-btn--primary{background:var(--cm-accent-primary,#8b5cf6);color:white}.dsd-tour-btn--primary:hover{background:#7c3aed}.dsd-tour-btn--skip{background:transparent;color:var(--cm-text-muted,rgba(255,255,255,.5))}.dsd-tour-btn--skip:hover{color:var(--cm-text-secondary,rgba(255,255,255,.7))}</style>`;
  document.body.appendChild(_overlayEl);
  _highlightEl = document.createElement("div");
  _highlightEl.className = "dsd-tour-highlight";
  _overlayEl.appendChild(_highlightEl);
  _tooltipEl = document.createElement("div");
  _tooltipEl.className = "dsd-tour-tooltip";
  document.body.appendChild(_tooltipEl);
}
function _destroyOverlay() {
  if (_overlayEl) {
    _overlayEl.remove();
    _overlayEl = null;
    _highlightEl = null;
  }
  if (_tooltipEl) {
    _tooltipEl.remove();
    _tooltipEl = null;
  }
}
function _getElementRect(el) {
  const rect = el.getBoundingClientRect();
  return { top: rect.top + window.scrollY, left: rect.left + window.scrollX, width: rect.width, height: rect.height, bottom: rect.bottom + window.scrollY, right: rect.right + window.scrollX };
}
function _calculateTooltipPosition(targetRect, tooltipRect, position) {
  const padding = _config.tooltipOffset;
  let pos = position;
  if (pos === TOOLTIP_POSITIONS.AUTO) {
    const spaceTop = targetRect.top;
    const spaceBottom = window.innerHeight - targetRect.bottom + window.scrollY;
    const spaceLeft = targetRect.left;
    const spaceRight = window.innerWidth - targetRect.right;
    if (spaceBottom >= tooltipRect.height + padding) pos = TOOLTIP_POSITIONS.BOTTOM;
    else if (spaceTop >= tooltipRect.height + padding) pos = TOOLTIP_POSITIONS.TOP;
    else if (spaceRight >= tooltipRect.width + padding) pos = TOOLTIP_POSITIONS.RIGHT;
    else pos = TOOLTIP_POSITIONS.LEFT;
  }
  let top, left;
  switch (pos) {
    case TOOLTIP_POSITIONS.TOP:
      top = targetRect.top - tooltipRect.height - padding;
      left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
      break;
    case TOOLTIP_POSITIONS.BOTTOM:
      top = targetRect.bottom + padding;
      left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
      break;
    case TOOLTIP_POSITIONS.LEFT:
      top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
      left = targetRect.left - tooltipRect.width - padding;
      break;
    case TOOLTIP_POSITIONS.RIGHT:
      top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
      left = targetRect.right + padding;
      break;
  }
  left = Math.max(10, Math.min(window.innerWidth - tooltipRect.width - 10, left));
  top = Math.max(10, top);
  return { top, left, position: pos };
}
function _showStep(stepIndex) {
  if (!_currentTour || stepIndex < 0 || stepIndex >= _currentTour.steps.length) return;
  const step = _currentTour.steps[stepIndex];
  const targetEl = typeof step.target === "string" ? document.querySelector(step.target) : step.target;
  if (!targetEl) {
    logger.warn("Target element not found", { target: step.target });
    nextStep();
    return;
  }
  targetEl.scrollIntoView({ behavior: _config.scrollBehavior, block: "center" });
  setTimeout(() => {
    const targetRect = _getElementRect(targetEl);
    const pad = _config.highlightPadding;
    _highlightEl.style.top = `${targetRect.top - pad}px`;
    _highlightEl.style.left = `${targetRect.left - pad}px`;
    _highlightEl.style.width = `${targetRect.width + pad * 2}px`;
    _highlightEl.style.height = `${targetRect.height + pad * 2}px`;
    const isFirst = stepIndex === 0;
    const isLast = stepIndex === _currentTour.steps.length - 1;
    const stepNum = _config.showStepNumbers ? `<span class="dsd-tour-step-badge">${stepIndex + 1} / ${_currentTour.steps.length}</span>` : "";
    const closeBtn = _config.allowClose ? '<button class="dsd-tour-close" title="Fechar"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>' : "";
    let progressHtml = "";
    if (_config.showProgress) {
      progressHtml = `<div class="dsd-tour-progress">${_currentTour.steps.map((_, i) => {
        let cls = "dsd-tour-progress-dot";
        if (i < stepIndex) cls += " dsd-tour-progress-dot--completed";
        else if (i === stepIndex) cls += " dsd-tour-progress-dot--active";
        return `<div class="${cls}"></div>`;
      }).join("")}</div>`;
    }
    const skipBtn = _config.allowSkip && !isLast ? '<button class="dsd-tour-btn dsd-tour-btn--skip" data-action="skip">Pular tour</button>' : "";
    const prevBtn = !isFirst ? '<button class="dsd-tour-btn dsd-tour-btn--secondary" data-action="prev">Anterior</button>' : "";
    const nextBtn = `<button class="dsd-tour-btn dsd-tour-btn--primary" data-action="${isLast ? "finish" : "next"}">${isLast ? "Concluir" : "Pr\xF3ximo"}</button>`;
    _tooltipEl.innerHTML = `<div class="dsd-tour-tooltip-arrow"></div><div class="dsd-tour-header">${stepNum}${closeBtn}</div><div class="dsd-tour-content"><h4 class="dsd-tour-title">${step.title || ""}</h4><p class="dsd-tour-description">${step.description || ""}</p></div><div class="dsd-tour-footer">${progressHtml}<div class="dsd-tour-actions">${skipBtn}${prevBtn}${nextBtn}</div></div>`;
    _tooltipEl.style.visibility = "hidden";
    _tooltipEl.classList.add("dsd-tour-tooltip--visible");
    requestAnimationFrame(() => {
      const tooltipRect = _tooltipEl.getBoundingClientRect();
      const { top, left, position } = _calculateTooltipPosition(targetRect, tooltipRect, step.position || TOOLTIP_POSITIONS.AUTO);
      _tooltipEl.className = `dsd-tour-tooltip dsd-tour-tooltip--${position} dsd-tour-tooltip--visible`;
      _tooltipEl.style.top = `${top}px`;
      _tooltipEl.style.left = `${left}px`;
      _tooltipEl.style.visibility = "visible";
    });
    _tooltipEl.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const action = e.currentTarget.dataset.action;
        if (action === "next") nextStep();
        else if (action === "prev") previousStep();
        else if (action === "skip" || action === "finish") endTour(action === "finish");
      });
    });
    const closeEl = _tooltipEl.querySelector(".dsd-tour-close");
    if (closeEl) closeEl.addEventListener("click", () => endTour(false));
    _currentStepIndex = stepIndex;
    _metrics.stepsViewed++;
    if (step.onShow) try {
      step.onShow(step, stepIndex);
    } catch (e) {
      _metrics.errors++;
    }
    _emit("stepShown", { tour: _currentTour.id, step: stepIndex, total: _currentTour.steps.length });
  }, 100);
}
function _handleKeyDown(e) {
  if (_state !== TOUR_STATES.RUNNING || !_config.keyboardNavigation) return;
  if (e.key === "ArrowRight" || e.key === "Enter") {
    e.preventDefault();
    nextStep();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    previousStep();
  } else if (e.key === "Escape") {
    e.preventDefault();
    endTour(false);
  }
}
function createTourManager(options = {}) {
  _config = { ...DEFAULT_CONFIG, ...options };
  _loadProgress();
  logger.debug("Tour Manager created");
  return { init, destroy, registerTour, unregisterTour, startTour, endTour, nextStep, previousStep, goToStep, pauseTour, resumeTour, getState: () => _state, getCurrentTour: () => _currentTour, getCurrentStep: () => _currentTour?.steps[_currentStepIndex] || null, isTourCompleted, resetProgress, subscribe, healthCheck, info };
}
function getTourManager(options = {}) {
  if (!_instance) _instance = createTourManager(options);
  return _instance;
}
function init() {
  if (_isInitialized) return true;
  _createOverlay();
  document.addEventListener("keydown", _handleKeyDown);
  _isInitialized = true;
  _emit("initialized", {});
  logger.debug("Initialized");
  return true;
}
function destroy() {
  if (!_isInitialized) return true;
  document.removeEventListener("keydown", _handleKeyDown);
  _destroyOverlay();
  _tours.clear();
  _currentTour = null;
  _currentStepIndex = -1;
  _state = TOUR_STATES.IDLE;
  _isInitialized = false;
  logger.debug("Destroyed");
  return true;
}
function registerTour(tour) {
  if (!tour.id || !tour.steps || !Array.isArray(tour.steps)) {
    logger.error("Tour must have id and steps array");
    return false;
  }
  _tours.set(tour.id, { ...tour });
  _emit("tourRegistered", { tourId: tour.id });
  return true;
}
function unregisterTour(tourId) {
  const result = _tours.delete(tourId);
  if (result) _emit("tourUnregistered", { tourId });
  return result;
}
function startTour(tourId) {
  if (_state === TOUR_STATES.RUNNING) endTour(false);
  const tour = _tours.get(tourId);
  if (!tour) {
    logger.error("Tour not found", { tourId });
    return false;
  }
  if (!_isInitialized) init();
  _currentTour = tour;
  _currentStepIndex = -1;
  _state = TOUR_STATES.RUNNING;
  _metrics.toursStarted++;
  _overlayEl.classList.add("dsd-tour-overlay--active");
  _emit("tourStarted", { tourId });
  logger.debug("Starting tour", { tourId });
  nextStep();
  return true;
}
function endTour(completed = false) {
  if (_state === TOUR_STATES.IDLE) return;
  if (completed && _currentTour) {
    _completedTours.add(_currentTour.id);
    _saveProgress();
    _metrics.toursCompleted++;
    _emit("tourCompleted", { tourId: _currentTour.id });
  } else if (_currentTour) _emit("tourSkipped", { tourId: _currentTour.id, atStep: _currentStepIndex });
  _overlayEl.classList.remove("dsd-tour-overlay--active");
  _tooltipEl.classList.remove("dsd-tour-tooltip--visible");
  _currentTour = null;
  _currentStepIndex = -1;
  _state = TOUR_STATES.IDLE;
  logger.debug(completed ? "Tour completed" : "Tour ended");
}
function nextStep() {
  if (_state !== TOUR_STATES.RUNNING || !_currentTour) return;
  const next = _currentStepIndex + 1;
  if (next >= _currentTour.steps.length) endTour(true);
  else _showStep(next);
}
function previousStep() {
  if (_state !== TOUR_STATES.RUNNING || !_currentTour || _currentStepIndex <= 0) return;
  _showStep(_currentStepIndex - 1);
}
function goToStep(index) {
  if (_state !== TOUR_STATES.RUNNING || !_currentTour) return false;
  if (index >= 0 && index < _currentTour.steps.length) {
    _showStep(index);
    return true;
  }
  return false;
}
function pauseTour() {
  if (_state === TOUR_STATES.RUNNING) {
    _state = TOUR_STATES.PAUSED;
    _overlayEl.classList.remove("dsd-tour-overlay--active");
    _tooltipEl.classList.remove("dsd-tour-tooltip--visible");
    _emit("tourPaused", {});
  }
}
function resumeTour() {
  if (_state === TOUR_STATES.PAUSED && _currentTour) {
    _state = TOUR_STATES.RUNNING;
    _overlayEl.classList.add("dsd-tour-overlay--active");
    _showStep(_currentStepIndex);
    _emit("tourResumed", {});
  }
}
function isTourCompleted(tourId) {
  return _completedTours.has(tourId);
}
function resetProgress() {
  _completedTours.clear();
  _saveProgress();
  _emit("progressReset", {});
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}
function healthCheck() {
  const checks = { initialized: _isInitialized, hasOverlay: !!_overlayEl, hasTours: _tours.size > 0, noErrors: _metrics.errors === 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed >= 3 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, tourCount: _tours.size, completedCount: _completedTours.size, state: _state, metrics: { ..._metrics }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, tourStates: Object.values(TOUR_STATES), tooltipPositions: Object.values(TOOLTIP_POSITIONS), config: { allowSkip: _config.allowSkip, showProgress: _config.showProgress, keyboardNavigation: _config.keyboardNavigation }, isInitialized: _isInitialized, state: _state, tourCount: _tours.size, completedTours: Array.from(_completedTours), currentTour: _currentTour?.id || null, currentStep: _currentStepIndex };
}
var tour_manager_default = { VERSION, MODULE_ID, TOUR_STATES, TOOLTIP_POSITIONS, createTourManager, getTourManager, init, destroy, registerTour, unregisterTour, startTour, endTour, nextStep, previousStep, goToStep, pauseTour, resumeTour, isTourCompleted, resetProgress, subscribe, healthCheck, info };
export {
  MODULE_ID,
  TOOLTIP_POSITIONS,
  TOUR_STATES,
  VERSION,
  createTourManager,
  tour_manager_default as default,
  destroy,
  endTour,
  getTourManager,
  goToStep,
  healthCheck,
  info,
  init,
  isTourCompleted,
  nextStep,
  pauseTour,
  previousStep,
  registerTour,
  resetProgress,
  resumeTour,
  startTour,
  subscribe,
  unregisterTour
};
