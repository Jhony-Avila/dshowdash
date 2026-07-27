import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "13.0.0-GROUP-FILTER";
const MODULE_ID = "panel-nav-admin.ui.toolbar";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const DENSITIES = Object.freeze({
  COMPACT: "compact",
  NORMAL: "normal",
  COMFORTABLE: "comfortable"
});
const VIEW_MODES = Object.freeze({
  TABLE: "table",
  CARD: "card",
  SPLIT: "split"
});
class Toolbar {
  /**
   * @param {Object} [options]
   * @param {Function} [options.onAction] — Callback (action, value)
   * @param {string} [options.density='normal']
   * @param {string} [options.viewMode='table']
   * @param {boolean} [options.autoRefresh=true]
   */
  constructor(options = {}) {
    this.onAction = options.onAction || (() => {
    });
    this.density = options.density || DENSITIES.NORMAL;
    this.viewMode = options.viewMode || VIEW_MODES.TABLE;
    this.autoRefresh = options.autoRefresh !== false;
    this._el = null;
    this._boundHandler = null;
    this._groups = options.groups || [];
    this._selectedGroup = options.selectedGroup || "";
  }
  /**
   * Render the toolbar HTML.
   * @param {Object} [state]
   * @param {boolean} [state.loading]
   * @param {number} [state.countdown]
   * @param {number} [state.selectedCount=0]
   * @param {number} [state.totalCount=0]
   * @returns {string} HTML
   */
  render(state) {
    const s = state || {};
    const loading = !!s.loading;
    const countdown = Number(s.countdown) || 0;
    const selected = Number(s.selectedCount) || 0;
    const total = Number(s.totalCount) || 0;
    const densityBtns = [DENSITIES.COMPACT, DENSITIES.NORMAL, DENSITIES.COMFORTABLE].map((d) => {
      const active = d === this.density ? " pna-toolbar-btn--active" : "";
      const labels = { compact: "Compacto", normal: "Normal", comfortable: "Confort\xE1vel" };
      return '<button class="pna-toolbar-btn' + active + '" data-toolbar-action="density" data-toolbar-value="' + d + '" title="' + labels[d] + '"><span class="pna-toolbar-density-icon pna-toolbar-density-icon--' + d + '"></span></button>';
    }).join("");
    const viewBtns = [VIEW_MODES.TABLE, VIEW_MODES.CARD, VIEW_MODES.SPLIT].map((v) => {
      const active = v === this.viewMode ? " pna-toolbar-btn--active" : "";
      const icons = { table: "\u2630", card: "\u229E", split: "\u25EB" };
      const labels = { table: "Tabela", card: "Cards", split: "Dividido" };
      return '<button class="pna-toolbar-btn' + active + '" data-toolbar-action="view-mode" data-toolbar-value="' + v + '" title="' + labels[v] + '">' + icons[v] + "</button>";
    }).join("");
    const bulkSection = selected > 0 ? '<div class="pna-toolbar-bulk"><span class="pna-toolbar-bulk-count">' + selected + " selecionado" + (selected > 1 ? "s" : "") + '</span><button class="pna-toolbar-btn pna-toolbar-btn--danger" data-toolbar-action="bulk-delete" title="Excluir selecionados">Excluir</button><button class="pna-toolbar-btn" data-toolbar-action="bulk-move" title="Mover se\xE7\xE3o">Mover</button><button class="pna-toolbar-btn" data-toolbar-action="bulk-toggle" title="Ativar/Desativar">Alternar</button><button class="pna-toolbar-btn" data-action="bulk-set-title" title="Definir titulo em massa">Titulo</button><button class="pna-toolbar-btn" data-toolbar-action="clear-selection" title="Limpar sele\xE7\xE3o">&times;</button></div>' : "";
    const refreshIcon = loading ? '<span class="pna-toolbar-spinner"></span>' : countdown > 0 ? countdown + "s" : "\u21BB";
    const groups = this._groups;
    const selectedGroup = this._selectedGroup;
    let groupFilterHtml = "";
    if (groups && groups.length > 0) {
      groupFilterHtml = '<div class="pna-toolbar-group" data-toolbar-group="group-filter"><span class="pna-toolbar-label">Grupo</span><select class="pna-toolbar-select" data-toolbar-action="filter-group" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:rgba(255,255,255,0.06);color:inherit;border:1px solid rgba(255,255,255,0.12);border-radius:0.375rem;cursor:pointer;min-width:120px;outline:none;"><option value=""' + (!selectedGroup ? " selected" : "") + ">Todos</option>";
      for (let gi = 0; gi < groups.length; gi++) {
        const g = groups[gi];
        const sel = g.key === selectedGroup ? " selected" : "";
        groupFilterHtml += '<option value="' + g.key + '"' + sel + ">" + (g.label || g.key) + "</option>";
      }
      groupFilterHtml += "</select></div>";
    }
    return '<div class="pna-toolbar" data-toolbar><div class="pna-toolbar-left"><div class="pna-toolbar-group" data-toolbar-group="density"><span class="pna-toolbar-label">Densidade</span>' + densityBtns + '</div><div class="pna-toolbar-group" data-toolbar-group="view"><span class="pna-toolbar-label">Visualiza\xE7\xE3o</span>' + viewBtns + "</div>" + groupFilterHtml + '</div><div class="pna-toolbar-center">' + bulkSection + (total > 0 && selected === 0 ? '<span class="pna-toolbar-count">' + total + " itens</span>" : "") + '</div><div class="pna-toolbar-right"><button class="pna-toolbar-btn" data-toolbar-action="refresh" title="Atualizar"' + (loading ? " disabled" : "") + ">" + refreshIcon + '</button><button class="pna-toolbar-btn' + (this.autoRefresh ? " pna-toolbar-btn--active" : "") + '" data-toolbar-action="toggle-auto-refresh" title="Auto-refresh">\u27F3</button><button class="pna-toolbar-btn" data-toolbar-action="export" title="Exportar">\u2193</button><button class="pna-toolbar-btn pna-toolbar-btn--primary" data-toolbar-action="new-group" title="Criar novo grupo" style="background:rgba(99,102,241,0.15);color:#818cf8;border:1px solid rgba(99,102,241,0.3);font-size:0.75rem;padding:0.25rem 0.6rem;">+ Grupo</button><button class="pna-toolbar-btn pna-toolbar-btn--status" data-action="health-status" title="Status da Navega\xE7\xE3o">\u25C9 Status</button></div></div>';
  }
  /**
   * Bind the toolbar to a container (attaches click delegation).
   * @param {HTMLElement} container
   */
  bind(container) {
    if (!container) return;
    this._el = container.querySelector("[data-toolbar]") || container;
    this._boundHandler = (e) => {
      const btn = e.target.closest("[data-toolbar-action]");
      if (!btn) return;
      const action = btn.dataset.toolbarAction;
      const value = btn.dataset.toolbarValue || null;
      switch (action) {
        case "density":
          this.density = value;
          break;
        case "view-mode":
          this.viewMode = value;
          break;
        case "toggle-auto-refresh":
          this.autoRefresh = !this.autoRefresh;
          break;
        case "new-group":
          break;
      }
      this.onAction(action, value);
    };
    this._el.addEventListener("click", this._boundHandler);
    this._boundSelectHandler = (e) => {
      const select = e.target;
      if (select && select.dataset.toolbarAction === "filter-group") {
        this._selectedGroup = select.value;
        this.onAction("filter-group", select.value);
      }
    };
    this._el.addEventListener("change", this._boundSelectHandler);
  }
  /**
   * Update the countdown display.
   * @param {number} seconds
   */
  updateCountdown(seconds) {
    if (!this._el) return;
    const btn = this._el.querySelector('[data-toolbar-action="refresh"]');
    if (btn && !btn.disabled) btn.textContent = seconds > 0 ? seconds + "s" : "\u21BB";
  }
  /**
   * Set loading state on refresh button.
   * @param {boolean} loading
   */
  setLoading(loading) {
    if (!this._el) return;
    const btn = this._el.querySelector('[data-toolbar-action="refresh"]');
    if (btn) {
      btn.disabled = loading;
      btn.innerHTML = loading ? '<span class="pna-toolbar-spinner"></span>' : "\u21BB";
    }
  }
  /** Cleanup */
  destroy() {
    if (this._el && this._boundHandler) {
      this._el.removeEventListener("click", this._boundHandler);
    }
    if (this._el && this._boundSelectHandler) {
      this._el.removeEventListener("change", this._boundSelectHandler);
    }
    this._el = null;
    this._boundHandler = null;
    this._boundSelectHandler = null;
  }
  /**
   * Update the groups list for the filter dropdown.
   * @param {Array} groups
   */
  setGroups(groups) {
    this._groups = groups || [];
    if (!this._el) return;
    const select = this._el.querySelector('[data-toolbar-action="filter-group"]');
    if (!select) return;
    const currentVal = select.value;
    let optionsHtml = '<option value="">Todos</option>';
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const sel = g.key === currentVal ? " selected" : "";
      optionsHtml += '<option value="' + g.key + '"' + sel + ">" + (g.label || g.key) + "</option>";
    }
    select.innerHTML = optionsHtml;
  }
  /**
   * Get the currently selected group filter.
   * @returns {string}
   */
  getSelectedGroup() {
    return this._selectedGroup || "";
  }
}
function createToolbar(options = {}) {
  return new Toolbar(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, densities: Object.values(DENSITIES), viewModes: Object.values(VIEW_MODES) };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION };
}
var toolbar_default = { Toolbar, createToolbar, DENSITIES, VIEW_MODES, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  DENSITIES,
  MODULE_ID,
  Toolbar,
  VERSION,
  VIEW_MODES,
  createToolbar,
  toolbar_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
