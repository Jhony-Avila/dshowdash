import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.2.0-MIGRATION-PHASE4";
const MODULE_ID = "panel-nav-admin.ui.hover-menu";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[HoverMenu]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const DEFAULT_ACTIONS = [
  { id: "edit", label: "Editar", icon: "edit", shortcut: "E", danger: false },
  { id: "duplicate", label: "Duplicar", icon: "copy", shortcut: "D", danger: false },
  { id: "toggle", label: "Ativar/Desativar", icon: "toggle", shortcut: "T", danger: false },
  { id: "move", label: "Mover p/ se\xE7\xE3o", icon: "move", shortcut: "M", danger: false },
  { id: "delete", label: "Excluir", icon: "trash", shortcut: "Del", danger: true }
];
const ICONS = {
  edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  toggle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3"/></svg>',
  move: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
};
function HoverMenu(options = {}) {
  const tableContainer = options.tableContainer;
  const onAction = options.onAction;
  const actions = options.actions || DEFAULT_ACTIONS;
  const rowSelector = options.rowSelector || "tr[data-id]";
  const showDelay = options.showDelay || 0;
  const hideDelay = options.hideDelay ?? 300;
  let _menuEl = null;
  let _currentRowId = null;
  let _showTimer = null;
  let _hideTimer = null;
  let _abortController = null;
  function init() {
    _createMenuElement();
    _bindTableEvents();
    _log("info", "Initialized with", actions.length, "actions");
  }
  function _createMenuElement() {
    _menuEl = document.createElement("div");
    _menuEl.className = "pna-hover-menu";
    _menuEl.style.cssText = "position:absolute;z-index:1000;display:none;";
    _menuEl.setAttribute("role", "menu");
    _menuEl.setAttribute("aria-label", "A\xE7\xF5es do item");
    const buttonsHtml = actions.map((action) => {
      const dangerClass = action.danger ? " pna-hover-menu__btn--danger" : "";
      const icon = ICONS[action.icon] || "";
      return `<button type="button" class="pna-hover-menu__btn${dangerClass}" data-hover-action="${action.id}" title="${action.label} ${action.shortcut ? "(" + action.shortcut + ")" : ""}" role="menuitem">${icon}<span class="pna-hover-menu__btn-label">${action.label}</span></button>`;
    }).join("");
    _menuEl.innerHTML = buttonsHtml;
    document.body.appendChild(_menuEl);
    _menuEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-hover-action]");
      if (!btn || !_currentRowId) return;
      const actionId = btn.dataset.hoverAction || "";
      if (typeof onAction === "function") {
        onAction(actionId, _currentRowId);
      }
      hide();
    });
    _menuEl.addEventListener("mouseenter", () => {
      _clearHideTimer();
    });
    _menuEl.addEventListener("mouseleave", () => {
      _scheduleHide();
    });
  }
  function _bindTableEvents() {
    if (!tableContainer) return;
    _abortController = new AbortController();
    const signal = _abortController.signal;
    tableContainer.addEventListener("mouseenter", (e) => {
      const row = e.target.closest(rowSelector);
      if (!row) return;
      const id = row.dataset.id;
      if (!id) return;
      _clearHideTimer();
      if (showDelay > 0) {
        _showTimer = setTimeout(() => _show(row, id), showDelay);
      } else {
        _show(row, id);
      }
    }, { capture: true, signal });
    tableContainer.addEventListener("mouseleave", (e) => {
      const row = e.target.closest(rowSelector);
      if (!row) return;
      _clearShowTimer();
      _scheduleHide();
    }, { capture: true, signal });
  }
  function _show(row, id) {
    _currentRowId = id;
    const rowRect = row.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = _menuEl.offsetHeight || 36;
    let top = rowRect.top + rowRect.height / 2 - menuHeight / 2;
    let left = rowRect.right - menuWidth - 8;
    if (top < 0) top = 4;
    if (top + menuHeight > window.innerHeight) top = window.innerHeight - menuHeight - 4;
    if (left < 0) left = rowRect.left + 8;
    _menuEl.style.top = `${top + window.scrollY}px`;
    _menuEl.style.left = `${left + window.scrollX}px`;
    _menuEl.style.display = "flex";
    row.classList.add("pna-row--hover-active");
  }
  function hide() {
    if (_menuEl) _menuEl.style.display = "none";
    _clearAllTimers();
    if (_currentRowId && tableContainer) {
      const activeRow = tableContainer.querySelector(".pna-row--hover-active");
      if (activeRow) activeRow.classList.remove("pna-row--hover-active");
    }
    _currentRowId = null;
  }
  function _scheduleHide() {
    _hideTimer = setTimeout(() => hide(), hideDelay);
  }
  function _clearShowTimer() {
    if (_showTimer) {
      clearTimeout(_showTimer);
      _showTimer = null;
    }
  }
  function _clearHideTimer() {
    if (_hideTimer) {
      clearTimeout(_hideTimer);
      _hideTimer = null;
    }
  }
  function _clearAllTimers() {
    _clearShowTimer();
    _clearHideTimer();
  }
  function setActions(newActions) {
    if (!_menuEl) return;
    const buttonsHtml = newActions.map((action) => {
      const dangerClass = action.danger ? " pna-hover-menu__btn--danger" : "";
      const icon = ICONS[action.icon] || "";
      return `<button type="button" class="pna-hover-menu__btn${dangerClass}" data-hover-action="${action.id}" title="${action.label}" role="menuitem">${icon}<span class="pna-hover-menu__btn-label">${action.label}</span></button>`;
    }).join("");
    _menuEl.innerHTML = buttonsHtml;
  }
  function destroy() {
    _clearAllTimers();
    if (_abortController) _abortController.abort();
    if (_menuEl && _menuEl.parentNode) _menuEl.parentNode.removeChild(_menuEl);
    _menuEl = null;
    _currentRowId = null;
  }
  return { init, hide, setActions, destroy };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, defaultActionsCount: DEFAULT_ACTIONS.length };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var hover_menu_default = { HoverMenu, DEFAULT_ACTIONS, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  DEFAULT_ACTIONS,
  HoverMenu,
  MODULE_ID,
  VERSION,
  hover_menu_default as default,
  healthCheck,
  info,
  injectPorts
};
