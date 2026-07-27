const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/events";
const TABLE_EVENTS = {
  ROW_CLICK: "table:row:click",
  ROW_DBLCLICK: "table:row:dblclick",
  ROW_CONTEXT: "table:row:context",
  ROW_SELECT: "table:row:select",
  ROW_HOVER: "table:row:hover",
  SORT: "table:sort",
  SELECT_ALL: "table:select:all",
  DESELECT_ALL: "table:select:none",
  CELL_CLICK: "table:cell:click"
};
class TableEventManager {
  constructor(container, options = {}) {
    this.container = container;
    this.handlers = options.handlers || {};
    this._listeners = [];
    this._enabled = true;
  }
  init() {
    this._addListener("click", this._handleClick.bind(this));
    this._addListener("dblclick", this._handleDblClick.bind(this));
    this._addListener("contextmenu", this._handleContext.bind(this));
    this._addListener("change", this._handleChange.bind(this));
    this._addListener("mouseover", this._handleMouseOver.bind(this));
    this._addListener("keydown", this._handleKeydown.bind(this));
  }
  _addListener(event, handler) {
    if (!this.container) return;
    this.container.addEventListener(event, handler);
    this._listeners.push({ event, handler });
  }
  _handleClick(e) {
    if (!this._enabled) return;
    const target = e.target;
    const th = target.closest("[data-sort]");
    if (th) {
      this._emit(TABLE_EVENTS.SORT, { field: th.dataset.sort });
      return;
    }
    const checkbox = target.closest(".p01-row-checkbox");
    if (checkbox) {
      this._emit(TABLE_EVENTS.ROW_SELECT, {
        id: checkbox.dataset.id,
        selected: checkbox.checked
      });
      return;
    }
    const selectAll = target.closest(".p01-select-all");
    if (selectAll) {
      this._emit(selectAll.checked ? TABLE_EVENTS.SELECT_ALL : TABLE_EVENTS.DESELECT_ALL);
      return;
    }
    const actionBtn = target.closest("[data-action]");
    if (actionBtn) {
      this._emit(TABLE_EVENTS.CELL_CLICK, {
        action: actionBtn.dataset.action,
        id: actionBtn.dataset.id
      });
      return;
    }
    const row = target.closest(".p01-row");
    if (row && !target.closest("button, input, a")) {
      this._emit(TABLE_EVENTS.ROW_CLICK, {
        id: row.dataset.id,
        index: row.dataset.index
      });
    }
  }
  _handleDblClick(e) {
    if (!this._enabled) return;
    const row = e.target.closest(".p01-row");
    if (row) {
      this._emit(TABLE_EVENTS.ROW_DBLCLICK, { id: row.dataset.id });
    }
  }
  _handleContext(e) {
    if (!this._enabled) return;
    const row = e.target.closest(".p01-row");
    if (row) {
      e.preventDefault();
      this._emit(TABLE_EVENTS.ROW_CONTEXT, {
        id: row.dataset.id,
        x: e.clientX,
        y: e.clientY
      });
    }
  }
  _handleChange(_e) {
    if (!this._enabled) return;
  }
  _handleMouseOver(e) {
    if (!this._enabled) return;
    const row = e.target.closest(".p01-row");
    if (row) {
      this._emit(TABLE_EVENTS.ROW_HOVER, { id: row.dataset.id });
    }
  }
  _handleKeydown(e) {
    if (!this._enabled) return;
    const target = e.target;
    if (e.key === "Enter") {
      const row = target.closest(".p01-row");
      if (row) {
        this._emit(TABLE_EVENTS.ROW_CLICK, { id: row.dataset.id });
      }
    }
    if (e.key === " ") {
      const row = target.closest(".p01-row");
      if (row) {
        e.preventDefault();
        const checkbox = row.querySelector(".p01-row-checkbox");
        if (checkbox) checkbox.click();
      }
    }
  }
  // P18EC-LOCAL: Local event emission with bubbling (not global bridge)
  _emit(event, data = {}) {
    if (this.handlers[event]) {
      this.handlers[event](data);
    }
    this.container?.dispatchEvent(new CustomEvent(event, { detail: data, bubbles: true }));
  }
  on(event, handler) {
    this.handlers[event] = handler;
    return this;
  }
  off(event) {
    delete this.handlers[event];
    return this;
  }
  enable() {
    this._enabled = true;
  }
  disable() {
    this._enabled = false;
  }
  destroy() {
    this._listeners.forEach(({ event, handler }) => {
      this.container?.removeEventListener(event, handler);
    });
    this._listeners = [];
    this.handlers = {};
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p18ECLocal: true };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, p18ECLocal: true };
}
var events_default = { TABLE_EVENTS, TableEventManager };
export {
  MODULE_ID,
  TABLE_EVENTS,
  TableEventManager,
  VERSION,
  events_default as default,
  healthCheck,
  info
};
