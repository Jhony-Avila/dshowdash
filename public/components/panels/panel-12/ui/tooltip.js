import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-12/ui/tooltip";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debug = () => _getPort("config")?.app?.debug ?? false;
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (level === "error") {
    logger?.error?.("[tooltip]", ...args);
    return;
  }
  if (level === "warn") {
    logger?.warn?.("[tooltip]", ...args);
    return;
  }
  if (_debug()) logger?.debug?.("[tooltip]", ...args);
};
let tooltipElement = null;
let tooltipTimeout = null;
let _hideTimeout = null;
let currentTooltipTarget = null;
let _container = null;
let _abortController = null;
const _ensureContainer = () => {
  if (!_container) {
    _container = document.createElement("div");
    _container.className = "panel-tooltip-container";
    _container.setAttribute("data-tooltip-owner", MODULE_ID);
    _container.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;z-index:10000;pointer-events:none;";
    const panel = document.querySelector('[data-panel="panel-12"]') || document.querySelector(".panel-12");
    (panel || document.documentElement).appendChild(_container);
  }
  return _container;
};
const show = (element, text, tooltipId) => {
  hide();
  currentTooltipTarget = element;
  tooltipElement = document.createElement("div");
  tooltipElement.id = tooltipId;
  tooltipElement.className = "painel-12-tooltip";
  tooltipElement.setAttribute("role", "tooltip");
  tooltipElement.textContent = text;
  _ensureContainer().appendChild(tooltipElement);
  const rect = element.getBoundingClientRect();
  const tooltipRect = tooltipElement.getBoundingClientRect();
  const left = rect.left + rect.width / 2 - tooltipRect.width / 2;
  const top = rect.top - tooltipRect.height - 8;
  tooltipElement.style.left = `${Math.max(8, left)}px`;
  tooltipElement.style.top = `${Math.max(8, top)}px`;
  tooltipTimeout = setTimeout(() => {
    tooltipElement?.classList.add("show");
  }, 300);
};
const hide = () => {
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
  if (_hideTimeout) {
    clearTimeout(_hideTimeout);
    _hideTimeout = null;
  }
  if (currentTooltipTarget?.hasAttribute("aria-describedby")) currentTooltipTarget.removeAttribute("aria-describedby");
  currentTooltipTarget = null;
  if (tooltipElement) {
    tooltipElement.classList.remove("show");
    const el = tooltipElement;
    _hideTimeout = setTimeout(() => {
      el?.parentNode?.removeChild(el);
      _hideTimeout = null;
    }, 200);
    tooltipElement = null;
  }
};
const setup = (container, id) => {
  _initPorts();
  if (_abortController) _abortController.abort();
  _abortController = new AbortController();
  const signal = _abortController.signal;
  const badges = container.querySelectorAll(".painel-12-badge");
  badges.forEach((badge, index) => {
    const tooltipId = `tooltip-${id}-${index}`;
    let tooltipText = "";
    const dataType = badge.getAttribute("data-type");
    const dataStatus = badge.getAttribute("data-status");
    if (dataType) {
      const typeLabels = { php: "Tipo de execu\xE7\xE3o: PHP", python: "Tipo de execu\xE7\xE3o: Python", shell: "Tipo de execu\xE7\xE3o: Shell Script", api: "Tipo de execu\xE7\xE3o: API", other: "Tipo de execu\xE7\xE3o: Outro" };
      tooltipText = typeLabels[dataType] || badge.textContent || "";
    } else if (dataStatus) {
      const statusLabels = { active: "Job ativo e dispon\xEDvel para execu\xE7\xE3o", inactive: "Job inativo - n\xE3o ser\xE1 executado", success: "Taxa de sucesso excelente (\u226590%)", warning: "Taxa de sucesso moderada (70-89%)", error: "Taxa de sucesso baixa (<70%) ou erros detectados" };
      tooltipText = statusLabels[dataStatus] || badge.textContent || "";
    }
    if (tooltipText) {
      badge.setAttribute("aria-describedby", tooltipId);
      badge.setAttribute("tabindex", "0");
      badge.addEventListener("mouseenter", () => show(badge, tooltipText, tooltipId), { signal });
      badge.addEventListener("mouseleave", hide, { signal });
      badge.addEventListener("focus", () => show(badge, tooltipText, tooltipId), { signal });
      badge.addEventListener("blur", hide, { signal });
    }
  });
  const deleteButtons = container.querySelectorAll(".painel-12-btn-delete");
  deleteButtons.forEach((btn, index) => {
    const tooltipId = `tooltip-delete-${id}-${index}`;
    const tooltipText = "Remover definitivamente este job";
    btn.setAttribute("aria-describedby", tooltipId);
    btn.setAttribute("tabindex", "0");
    btn.addEventListener("mouseenter", () => show(btn, tooltipText, tooltipId), { signal });
    btn.addEventListener("mouseleave", hide, { signal });
    btn.addEventListener("focus", () => show(btn, tooltipText, tooltipId), { signal });
    btn.addEventListener("blur", hide, { signal });
  });
  _log("debug", "Setup completo", { badgeCount: badges.length });
};
const destroy = () => {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
  hide();
  if (_hideTimeout) {
    clearTimeout(_hideTimeout);
    _hideTimeout = null;
  }
  if (_container) {
    _container.remove();
    _container = null;
    tooltipElement = null;
  }
};
const healthCheck = () => {
  const logger = _getPort("logger");
  return { status: Ports.snapshot()._initialized ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, noBodyAppend: true, loggerReady: !!logger, portsInitialized: Ports.snapshot()._initialized, checks: { cleanupAvailable: true, hasAbortController: _abortController !== null } };
};
const info = () => ({ version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.snapshot()._initialized, hasAbortController: _abortController !== null });
export {
  MODULE_ID,
  VERSION,
  destroy,
  getPorts,
  healthCheck,
  hide,
  info,
  injectPorts,
  setup,
  show
};
