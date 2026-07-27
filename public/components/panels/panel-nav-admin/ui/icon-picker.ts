

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0-ICON-REGISTRY)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin-icon-picker
// PURPOSE: Panel Nav Admin - Icon Picker (registry-backed)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   get, list, listNamespaces from /components/icon-registry/index.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   open() — exported function
//   close() — exported function
//   setSelected() — exported function
//   getSelected() — exported function
//   isOpen() — exported function
//   getCategories() — exported function
//   getIconsByCategory() — exported function
//   getAllIcons() — exported function
//   searchIcons() — exported function
//   destroy() — exported function
//   createPicker() — exported function
//   renderIconPicker() — exported function
//   initIconPickerEvents() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ───────────────────────────────────────────────────────────────
// @changelog
//   10.0.0-ICON-REGISTRY - Rewrite: use icon-registry central (202 icons, 6 namespaces), remove Feather dependency
//   9.4.0-P18EC - Add renderIconPicker() and initIconPickerEvents() consumed by modals.js
//   8.3.0-AAA - Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { get as getRegistryIcon, list as listRegistryIcons, listNamespaces } from '/components/icon-registry/index.js';

export const MODULE_ID = 'panel-nav-admin-icon-picker';
export const VERSION = '10.1.0-INLINE-POPOVER';

let _container: HTMLElement | null = null;
let _onSelect: ((icon: string) => void) | null = null;
let _selectedIcon: string | null = null;
let _searchQuery = '';
let _activeCategory = 'all';
let _boundListeners: { element: EventTarget; event: string; handler: EventListenerOrEventListenerObject }[] = [];
let _isOpen = false;

let _activeNamespace: string = 'all';

function _addListener(el: EventTarget | null, event: string, handler: EventListenerOrEventListenerObject) {
  if (!el) return;
  el.addEventListener(event, handler);
  _boundListeners.push({ element: el, event, handler });
}

function _shortName(fullKey: string): string {
  const idx = fullKey.indexOf(':');
  return idx >= 0 ? fullKey.substring(idx + 1) : fullKey;
}

function _escapeHtml(str: string) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function _getPreviewSvg(iconName: string): string {
  if (!iconName) return '';
  // Tenta lookup direto (namespace:name)
  let svg = getRegistryIcon(iconName);
  if (svg) return svg;
  // Fallback: tenta em cada namespace
  const namespaces = listNamespaces();
  for (const ns of namespaces) {
    svg = getRegistryIcon(ns + ':' + iconName);
    if (svg) return svg;
  }
  return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
}

// ══════════════════════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════════════════════

function _render() {
  if (!_container) return;

  const namespaces = listNamespaces();
  const nsLabels: Record<string, string> = {
    ui: 'UI', charts: 'Charts', table: 'Tabela',
    system: 'Sistema', business: 'Negócios', extended: 'Extras'
  };

  let icons: string[] = [];
  if (_activeCategory === 'all') {
    icons = listRegistryIcons();
  } else {
    icons = listRegistryIcons(_activeCategory);
  }

  if (_searchQuery) {
    const q = _searchQuery.toLowerCase();
    icons = icons.filter(key => _shortName(key).toLowerCase().includes(q) || key.toLowerCase().includes(q));
  }

  let categoriesHtml = `<button class="pna-ip__cat ${_activeCategory === 'all' ? 'pna-ip__cat--active' : ''}" data-category="all">Todos</button>`;
  for (const ns of namespaces) {
    categoriesHtml += `<button class="pna-ip__cat ${_activeCategory === ns ? 'pna-ip__cat--active' : ''}" data-category="${ns}">${nsLabels[ns] || ns}</button>`;
  }

  let iconsHtml = '';
  for (const fullKey of icons) {
    const svg = getRegistryIcon(fullKey);
    if (!svg) continue;
    const isSelected = fullKey === _selectedIcon;
    const shortLabel = _shortName(fullKey);
    iconsHtml += `<button class="pna-ip__icon ${isSelected ? 'pna-ip__icon--selected' : ''}" data-icon="${fullKey}" title="${fullKey}"><span class="pna-ip__icon-svg">${svg}</span><span class="pna-ip__icon-name">${shortLabel}</span></button>`;
  }

  if (icons.length === 0) {
    iconsHtml = '<div class="pna-ip__empty">Nenhum ícone encontrado</div>';
  }

  _container.innerHTML = `
    <div class="pna-ip ${_isOpen ? 'pna-ip--open' : ''}">
      <div class="pna-ip__header">
        <h3 class="pna-ip__title">Selecionar Ícone</h3>
        <button class="pna-ip__close" data-action="close">&times;</button>
      </div>
      <div class="pna-ip__search">
        <input type="text" class="pna-ip__input" placeholder="Buscar ícone..." value="${_escapeHtml(_searchQuery)}" data-action="search">
      </div>
      <div class="pna-ip__categories">${categoriesHtml}</div>
      <div class="pna-ip__grid">${iconsHtml}</div>
      <div class="pna-ip__footer">
        <span class="pna-ip__count">${icons.length} ícone(s)</span>
        ${_selectedIcon ? `<span class="pna-ip__selected">Selecionado: <strong>${_selectedIcon}</strong></span>` : ''}
      </div>
    </div>
  `;

  _setupListeners();
}

// ══════════════════════════════════════════════════════════════
// LISTENERS
// ══════════════════════════════════════════════════════════════

function _setupListeners() {
  _clearListeners();

  const closeBtn = _container!.querySelector('[data-action="close"]');
  if (closeBtn) {
    _addListener(closeBtn, 'click', () => close());
  }

  const searchInput = _container!.querySelector('[data-action="search"]') as HTMLInputElement | null;
  if (searchInput) {
    _addListener(searchInput, 'input', (e) => {
      _searchQuery = (e as InputEvent & { target: HTMLInputElement }).target.value;
      _render();
    });
    searchInput.focus();
  }

  const catBtns = _container!.querySelectorAll('[data-category]');
  catBtns.forEach((btn: Element) => {
    _addListener(btn, 'click', () => {
      _activeCategory = (btn as HTMLElement).dataset.category || 'all';
      _render();
    });
  });

  const iconBtns = _container!.querySelectorAll('[data-icon]');
  iconBtns.forEach((btn: Element) => {
    _addListener(btn, 'click', () => {
      const icon = (btn as HTMLElement).dataset.icon || '';
      _selectedIcon = icon;
      if (_onSelect) _onSelect(icon);
      close();
    });
  });

  _addListener(document, 'keydown', _handleKeydown);
}

function _handleKeydown(e: Event) {
  if (!_isOpen) return;

  if ((e as KeyboardEvent).key === 'Escape') {
    e.preventDefault();
    close();
  }
}

function _clearListeners() {
  _boundListeners.forEach(item => {
    if (item.element?.removeEventListener) {
      item.element.removeEventListener(item.event, item.handler);
    }
  });
  _boundListeners = [];
}

// ══════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════

export function init(containerEl: HTMLElement) {
  _container = containerEl;
}

export function open(options: Record<string, any> = {}) {
  const { onSelect, selected, category } = options;
  _onSelect = onSelect || null;
  _selectedIcon = selected || null;
  _activeCategory = category || 'all';
  _searchQuery = '';
  _isOpen = true;
  _render();
}

export function close() {
  _isOpen = false;
  _clearListeners();
  if (_container) _container.innerHTML = '';
}

export function setSelected(icon: string) {
  _selectedIcon = icon;
  if (_isOpen) _render();
}

export function getSelected() {
  return _selectedIcon;
}

export function isOpen() {
  return _isOpen;
}

export function getCategories() {
  return ['all', ...listNamespaces()];
}

export function getIconsByCategory(category: string) {
  if (category === 'all') return listRegistryIcons();
  return listRegistryIcons(category);
}

export function getAllIcons() {
  return listRegistryIcons();
}

export function searchIcons(query: string) {
  const all = listRegistryIcons();
  if (!query) return all;
  const q = query.toLowerCase();
  return all.filter(key => _shortName(key).toLowerCase().includes(q) || key.toLowerCase().includes(q));
}

export function destroy() {
  _clearListeners();
  _container = null;
  _onSelect = null;
  _selectedIcon = null;
  _searchQuery = '';
  _activeCategory = 'all';
  _isOpen = false;
}

// ══════════════════════════════════════════════════════════════
// STANDALONE PICKER
// ══════════════════════════════════════════════════════════════

export function createPicker(targetEl: HTMLElement, options: Record<string, unknown> = {}) {
  if (!targetEl) return null;

  const value = options.value as string | undefined;
  const onChange = options.onChange as ((icon: string) => void) | undefined;
  const placeholder = (options.placeholder as string) || 'Selecionar ícone';

  let currentValue = value || '';

  const wrapper = document.createElement('div');
  wrapper.className = 'pna-ip-trigger';
  const iconSvg = currentValue ? _getPreviewSvg(currentValue) : '';
  wrapper.innerHTML = `
    <button type="button" class="pna-ip-trigger__btn">
      ${iconSvg ? `<span class="pna-ip-trigger__svg">${iconSvg}</span>` : ''}
      <span>${currentValue || placeholder}</span>
    </button>
    <div class="pna-ip-trigger__picker"></div>
  `;

  targetEl.appendChild(wrapper);

  const btn = wrapper.querySelector('.pna-ip-trigger__btn') as HTMLButtonElement;
  const pickerContainer = wrapper.querySelector('.pna-ip-trigger__picker') as HTMLElement;

  init(pickerContainer);

  btn.addEventListener('click', () => {
    if (_isOpen) {
      close();
    } else {
      open({
        selected: currentValue,
        onSelect: (icon: string) => {
          currentValue = icon;
          const svg = _getPreviewSvg(icon);
          btn.innerHTML = `<span class="pna-ip-trigger__svg">${svg}</span><span>${_shortName(icon)}</span>`;
          if (onChange) onChange(icon);
        }
      });
    }
  });

  return {
    getValue: () => currentValue,
    setValue: (icon: string) => {
      currentValue = icon;
      const svg = icon ? _getPreviewSvg(icon) : '';
      btn.innerHTML = icon ? `<span class="pna-ip-trigger__svg">${svg}</span><span>${_shortName(icon)}</span>` : `<span>${placeholder}</span>`;
    },
    destroy: () => {
      destroy();
      wrapper.remove();
    }
  };
}

// ══════════════════════════════════════════════════════════════
// v10.0.0: renderIconPicker - Returns inline HTML for icon picker in modals
// Consumed by modals.js: renderIconPicker(selectedIcon, prefix)
// @param {string|null} selectedIcon - Currently selected icon name (namespace:name)
// @param {string} prefix - CSS class prefix for scoping
// @returns {string} HTML string with icon input and picker trigger
// ══════════════════════════════════════════════════════════════

export function renderIconPicker(selectedIcon: string | null, prefix: string) {
  prefix = prefix || '';
  const safeIcon = selectedIcon ? _escapeHtml(selectedIcon) : '';
  const iconSvg = selectedIcon ? _getPreviewSvg(selectedIcon) : '<span style="opacity:0.4;">—</span>';

  return '<div class="pna-icon-picker-inline" data-icon-picker>' +
    '<div style="display:flex;align-items:center;gap:0.5rem;">' +
    '<button type="button" class="pna-btn pna-btn--icon" data-action="open-icon-picker" title="Escolher ícone" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:0.25rem;color:#fff;cursor:pointer;">' + iconSvg + '</button>' +
    '<input type="text" name="icon" value="' + safeIcon + '" placeholder="ex: ui:home, business:users" style="flex:1;padding:0.5rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:0.25rem;color:#fff;" readonly>' +
    '</div>' +
    '<div class="pna-icon-picker-dropdown" data-icon-picker-dropdown style="display:none;position:absolute;z-index:1000;background:#1e1e2e;border:1px solid rgba(255,255,255,0.15);border-radius:0.5rem;padding:0;max-height:420px;overflow:hidden;width:380px;margin-top:0.25rem;">' +
    '</div>' +
    '</div>';
}

// ══════════════════════════════════════════════════════════════
// v10.0.0: initIconPickerEvents - Initializes icon picker events within a modal
// Consumed by modals.js: initIconPickerEvents(modalEl)
// @param {HTMLElement} modalEl - The modal container element
// ══════════════════════════════════════════════════════════════

export function initIconPickerEvents(modalEl: HTMLElement) {
  if (!modalEl) return;
  const pickerWrappers = modalEl.querySelectorAll('[data-icon-picker]');
  pickerWrappers.forEach((wrapper: Element) => {
    const openBtn = wrapper.querySelector('[data-action="open-icon-picker"]') as HTMLElement | null;
    const dropdown = wrapper.querySelector('[data-icon-picker-dropdown]') as HTMLElement | null;
    const input = wrapper.querySelector('input[name="icon"]') as HTMLInputElement | null;
    if (!openBtn || !dropdown || !input) return;

    let currentNs = 'all';
    let currentSearch = '';

    openBtn.addEventListener('click', () => {
      const isVisible = dropdown.style.display !== 'none';
      if (isVisible) {
        dropdown.style.display = 'none';
        return;
      }
      _renderDropdown(dropdown, input, openBtn, currentNs, currentSearch);
      dropdown.style.display = 'block';
    });
  });
}

function _renderDropdown(dropdown: HTMLElement, input: HTMLInputElement, openBtn: HTMLElement, activeNs: string, searchQuery: string) {
  const namespaces = listNamespaces();
  const nsLabels: Record<string, string> = {
    ui: 'UI', charts: 'Charts', table: 'Tabela',
    system: 'Sistema', business: 'Negócios', extended: 'Extras'
  };

  // Tabs
  let tabsHtml = '<div style="display:flex;gap:0;border-bottom:1px solid rgba(255,255,255,0.1);overflow-x:auto;flex-shrink:0;">';
  tabsHtml += _nsTab('all', 'Todos', activeNs);
  for (const ns of namespaces) {
    tabsHtml += _nsTab(ns, nsLabels[ns] || ns, activeNs);
  }
  tabsHtml += '</div>';

  // Search
  const searchHtml = '<div style="padding:0.5rem;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0;">' +
    '<input type="text" data-icon-search placeholder="Buscar ícone..." value="' + _escapeHtml(searchQuery) + '" style="width:100%;padding:0.4rem 0.5rem;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:0.25rem;color:#fff;font-size:0.8rem;outline:none;">' +
    '</div>';

  // Icons grid
  let icons: string[] = [];
  if (activeNs === 'all') {
    icons = listRegistryIcons();
  } else {
    icons = listRegistryIcons(activeNs);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    icons = icons.filter(key => _shortName(key).toLowerCase().includes(q) || key.toLowerCase().includes(q));
  }

  let gridHtml = '<div style="overflow-y:auto;max-height:300px;padding:0.5rem;">';
  gridHtml += '<div style="display:flex;flex-wrap:wrap;gap:0.25rem;">';
  for (const fullKey of icons) {
    const svg = getRegistryIcon(fullKey);
    if (!svg) continue;
    const isSelected = fullKey === input.value;
    const shortLabel = _shortName(fullKey);
    gridHtml += '<button type="button" data-pick-icon="' + fullKey + '" title="' + fullKey + '" style="width:40px;height:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:' + (isSelected ? 'rgba(99,102,241,0.3)' : 'transparent') + ';border:1px solid ' + (isSelected ? '#6366f1' : 'rgba(255,255,255,0.1)') + ';border-radius:0.25rem;color:#fff;cursor:pointer;padding:2px;gap:1px;">' +
      '<span style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;">' + svg + '</span>' +
      '</button>';
  }
  if (icons.length === 0) {
    gridHtml += '<div style="padding:1rem;color:rgba(255,255,255,0.4);font-size:0.8rem;">Nenhum ícone encontrado</div>';
  }
  gridHtml += '</div>';
  gridHtml += '<div style="padding:0.25rem 0;color:rgba(255,255,255,0.3);font-size:0.7rem;text-align:right;">' + icons.length + ' ícone(s)</div>';
  gridHtml += '</div>';

  dropdown.innerHTML = tabsHtml + searchHtml + gridHtml;

  // Event: tab click
  dropdown.querySelectorAll('[data-ns-tab]').forEach((tab: Element) => {
    tab.addEventListener('click', () => {
      const ns = (tab as HTMLElement).dataset.nsTab || 'all';
      _renderDropdown(dropdown, input, openBtn, ns, searchQuery);
    });
  });

  // Event: search input
  const searchEl = dropdown.querySelector('[data-icon-search]') as HTMLInputElement | null;
  if (searchEl) {
    searchEl.addEventListener('input', (e) => {
      const q = (e.target as HTMLInputElement).value;
      _renderDropdown(dropdown, input, openBtn, activeNs, q);
    });
    searchEl.focus();
  }

  // Event: icon select
  dropdown.addEventListener('click', (e: MouseEvent) => {
    const pickBtn = (e.target as HTMLElement).closest('[data-pick-icon]') as HTMLElement | null;
    if (!pickBtn) return;
    const iconKey = pickBtn.dataset.pickIcon || '';
    input.value = iconKey;
    const svg = getRegistryIcon(iconKey);
    openBtn.innerHTML = svg || '';
    dropdown.style.display = 'none';
  });
}

function _nsTab(ns: string, label: string, activeNs: string): string {
  const isActive = ns === activeNs;
  return '<button type="button" data-ns-tab="' + ns + '" style="padding:0.4rem 0.6rem;font-size:0.75rem;border:none;background:' + (isActive ? 'rgba(99,102,241,0.2)' : 'transparent') + ';color:' + (isActive ? '#818cf8' : 'rgba(255,255,255,0.5)') + ';cursor:pointer;white-space:nowrap;border-bottom:2px solid ' + (isActive ? '#6366f1' : 'transparent') + ';">' + label + '</button>';
}

// ══════════════════════════════════════════════════════════════
// v10.1.0: INLINE POPOVER — small popup positioned near clicked icon
// ══════════════════════════════════════════════════════════════

let _popoverEl: HTMLElement | null = null;
let _popoverCloseHandler: ((e: MouseEvent) => void) | null = null;
let _popoverEscHandler: ((e: KeyboardEvent) => void) | null = null;

export function closeInlinePopover() {
  if (_popoverEl) {
    _popoverEl.remove();
    _popoverEl = null;
  }
  if (_popoverCloseHandler) {
    document.removeEventListener('mousedown', _popoverCloseHandler);
    _popoverCloseHandler = null;
  }
  if (_popoverEscHandler) {
    document.removeEventListener('keydown', _popoverEscHandler);
    _popoverEscHandler = null;
  }
}

export function openInlinePopover(anchorEl: HTMLElement, options: { currentIcon?: string; onSelect: (iconKey: string) => void }) {
  closeInlinePopover();

  const rect = anchorEl.getBoundingClientRect();
  const popover = document.createElement('div');
  popover.className = 'pna-icon-popover';
  popover.style.position = 'fixed';
  popover.style.zIndex = '10001';

  // Position below the icon, aligned left
  const popW = 280;
  const popH = 320;
  let left = rect.left;
  let top = rect.bottom + 4;

  // Adjust if overflowing viewport
  if (left + popW > window.innerWidth) left = window.innerWidth - popW - 8;
  if (left < 4) left = 4;
  if (top + popH > window.innerHeight) top = rect.top - popH - 4;

  popover.style.left = left + 'px';
  popover.style.top = top + 'px';
  popover.style.width = popW + 'px';

  _popoverEl = popover;
  document.body.appendChild(popover);

  let activeNs = 'all';
  let searchQuery = '';

  function renderPopoverContent() {
    const namespaces = listNamespaces();
    const nsLabels: Record<string, string> = {
      ui: 'UI', charts: 'Charts', table: 'Tabela',
      system: 'Sistema', business: 'Negócios', extended: 'Extras'
    };

    let icons: string[] = activeNs === 'all' ? listRegistryIcons() : listRegistryIcons(activeNs);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      icons = icons.filter(key => _shortName(key).toLowerCase().includes(q) || key.toLowerCase().includes(q));
    }

    // Tabs
    let tabsHtml = '<div class="pna-icon-popover__tabs">';
    tabsHtml += '<button type="button" class="pna-icon-popover__tab' + (activeNs === 'all' ? ' pna-icon-popover__tab--active' : '') + '" data-pop-ns="all">Todos</button>';
    for (const ns of namespaces) {
      tabsHtml += '<button type="button" class="pna-icon-popover__tab' + (activeNs === ns ? ' pna-icon-popover__tab--active' : '') + '" data-pop-ns="' + ns + '">' + (nsLabels[ns] || ns) + '</button>';
    }
    tabsHtml += '</div>';

    // Search
    const searchHtml = '<div class="pna-icon-popover__search"><input type="text" data-pop-search placeholder="Buscar..." value="' + _escapeHtml(searchQuery) + '"></div>';

    // Grid
    let gridHtml = '<div class="pna-icon-popover__grid">';
    for (const fullKey of icons) {
      const svg = getRegistryIcon(fullKey);
      if (!svg) continue;
      const isSelected = fullKey === options.currentIcon;
      gridHtml += '<button type="button" class="pna-icon-popover__item' + (isSelected ? ' pna-icon-popover__item--selected' : '') + '" data-pop-pick="' + fullKey + '" title="' + fullKey + '">' + svg + '</button>';
    }
    if (icons.length === 0) {
      gridHtml += '<div class="pna-icon-popover__empty">Nenhum icone</div>';
    }
    gridHtml += '</div>';

    const countHtml = '<div class="pna-icon-popover__footer">' + icons.length + ' icone(s)</div>';

    popover.innerHTML = tabsHtml + searchHtml + gridHtml + countHtml;

    // Bind events inside popover
    popover.querySelectorAll('[data-pop-ns]').forEach((tab: Element) => {
      tab.addEventListener('click', () => {
        activeNs = (tab as HTMLElement).dataset.popNs || 'all';
        renderPopoverContent();
      });
    });

    const searchInput = popover.querySelector('[data-pop-search]') as HTMLInputElement | null;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = (e.target as HTMLInputElement).value;
        renderPopoverContent();
      });
      // Keep focus after re-render
      requestAnimationFrame(() => searchInput.focus());
    }

    popover.addEventListener('click', (e: MouseEvent) => {
      const pickBtn = (e.target as HTMLElement).closest('[data-pop-pick]') as HTMLElement | null;
      if (!pickBtn) return;
      const iconKey = pickBtn.dataset.popPick || '';
      options.onSelect(iconKey);
      closeInlinePopover();
    });
  }

  renderPopoverContent();

  // Close on click outside
  _popoverCloseHandler = (e: MouseEvent) => {
    if (_popoverEl && !_popoverEl.contains(e.target as Node) && !anchorEl.contains(e.target as Node)) {
      closeInlinePopover();
    }
  };
  requestAnimationFrame(() => {
    if (_popoverCloseHandler) document.addEventListener('mousedown', _popoverCloseHandler);
  });

  // Close on Escape
  _popoverEscHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeInlinePopover();
  };
  document.addEventListener('keydown', _popoverEscHandler);
}

// ══════════════════════════════════════════════════════════════
// INFO / HEALTH
// ══════════════════════════════════════════════════════════════

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    isOpen: _isOpen,
    selectedIcon: _selectedIcon,
    activeCategory: _activeCategory,
    totalIcons: listRegistryIcons().length
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      iconsLoaded: listRegistryIcons().length > 0,
      namespacesLoaded: listNamespaces().length > 0
    }
  };
}

export default {
  MODULE_ID,
  VERSION,
  init,
  open,
  close,
  setSelected,
  getSelected,
  isOpen,
  getCategories,
  getIconsByCategory,
  getAllIcons,
  searchIcons,
  destroy,
  createPicker,
  renderIconPicker,
  initIconPickerEvents,
  openInlinePopover,
  closeInlinePopover,
  info,
  healthCheck
};
