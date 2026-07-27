import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.2.0-MIGRATION-PHASE4";
const MODULE_ID = "panel-nav-admin.ui.filters.quick-filters";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const DEFAULT_QUICK_FILTERS = [
  {
    id: "active-only",
    label: "Ativos",
    icon: "check-circle",
    description: "Mostrar apenas itens ativos",
    predicate: (item) => item.isActive === true
  },
  {
    id: "inactive-only",
    label: "Inativos",
    icon: "x-circle",
    description: "Mostrar apenas itens inativos",
    predicate: (item) => item.isActive === false
  },
  {
    id: "no-icon",
    label: "Sem \xEDcone",
    icon: "image",
    description: "Itens com \xEDcone padr\xE3o ou sem \xEDcone definido",
    predicate: (item) => !item.icon || item.icon === "default"
  },
  {
    id: "dividers",
    label: "Divisores",
    icon: "minus",
    description: "Apenas divisores de se\xE7\xE3o",
    predicate: (item) => item.isDivider === true
  },
  {
    id: "high-permission",
    label: "N\xEDvel Alto",
    icon: "shield",
    description: "Itens com n\xEDvel de permiss\xE3o >= 60",
    predicate: (item) => (Number(item.minLevel) || 0) >= 60
  },
  {
    id: "public",
    label: "P\xFAblicos",
    icon: "globe",
    description: "Itens com n\xEDvel de permiss\xE3o 0 (p\xFAblico)",
    predicate: (item) => (Number(item.minLevel) || 0) === 0
  },
  {
    id: "no-route",
    label: "Sem rota",
    icon: "alert-triangle",
    description: "Itens sem href/rota configurada",
    predicate: (item) => !item.href || item.href === "" || item.href === "null"
  },
  {
    id: "recently-modified",
    label: "Recentes",
    icon: "clock",
    description: "Modificados nos \xFAltimos 7 dias",
    predicate: (item) => {
      if (!item.updatedAt) return false;
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1e3;
      return new Date(item.updatedAt).getTime() > weekAgo;
    }
  }
];
function QuickFilters(options = {}) {
  const container = options.container;
  const onChange = options.onChange;
  const filters = options.filters || DEFAULT_QUICK_FILTERS;
  let _active = /* @__PURE__ */ new Set();
  let _el = null;
  function render() {
    if (!container) return;
    const buttons = filters.map((f) => {
      const activeClass = _active.has(f.id) ? " pna-quick-filter--active" : "";
      return `<button type="button" class="pna-quick-filter${activeClass}" data-quick-filter="${f.id}" title="${f.description}">${f.label}</button>`;
    }).join("");
    const html = `
      <div class="pna-quick-filters" data-filter-type="quick-filters">
        <span class="pna-quick-filters__label">Filtros r\xE1pidos:</span>
        <div class="pna-quick-filters__bar">${buttons}</div>
        ${_active.size > 0 ? '<button type="button" class="pna-quick-filters__clear" data-action="clear-quick">Limpar</button>' : ""}
      </div>
    `;
    if (!_el) {
      _el = document.createElement("div");
      _el.className = "pna-quick-filters-wrapper";
      container.appendChild(_el);
    }
    _el.innerHTML = html;
    _bindEvents();
  }
  function _bindEvents() {
    if (!_el) return;
    _el.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-quick-filter]");
      if (btn) {
        const id = btn.dataset.quickFilter || "";
        if (_active.has(id)) {
          _active.delete(id);
        } else {
          _active.add(id);
        }
        render();
        _notify();
        return;
      }
      if (e.target.closest('[data-action="clear-quick"]')) {
        clear();
      }
    });
  }
  function _notify() {
    if (typeof onChange === "function") {
      onChange(Array.from(_active));
    }
  }
  function apply(items) {
    if (_active.size === 0) return items;
    const activeFilters = filters.filter((f) => _active.has(f.id));
    return items.filter((item) => activeFilters.every((f) => f.predicate(item)));
  }
  function getValues() {
    return Array.from(_active);
  }
  function setValues(ids) {
    _active = new Set(ids);
    render();
  }
  function isActive() {
    return _active.size > 0;
  }
  function clear() {
    _active.clear();
    render();
    _notify();
  }
  function destroy() {
    if (_el && _el.parentNode) _el.parentNode.removeChild(_el);
    _el = null;
    _active.clear();
  }
  return { render, apply, getValues, setValues, isActive, clear, destroy };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, defaultFiltersCount: DEFAULT_QUICK_FILTERS.length };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var quick_filters_default = { QuickFilters, DEFAULT_QUICK_FILTERS, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  DEFAULT_QUICK_FILTERS,
  MODULE_ID,
  QuickFilters,
  VERSION,
  quick_filters_default as default,
  healthCheck,
  info,
  injectPorts
};
