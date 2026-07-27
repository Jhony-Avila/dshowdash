/**
 * @module CustomSelect
 * @version 1.0.0
 * @description Dropdown customizado reutilizavel, baseado no pattern icon-popover
 *
 * IMPORTS: nenhuma dependencia externa
 * PROVIDES: openCustomSelect, closeCustomSelect
 * EMITS: nenhum evento global
 */

// ── Interfaces ──
interface CustomSelectOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
  description?: string;
  disabled?: boolean;
}

interface CustomSelectConfig {
  anchor: HTMLElement;
  options: CustomSelectOption[];
  value?: string;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  width?: number;
  maxHeight?: number;
  onSelect: (value: string, option: CustomSelectOption) => void;
  onClose?: () => void;
}

// ── State ──
var _selectEl: HTMLDivElement | null = null;
var _closeHandler: ((e: MouseEvent) => void) | null = null;
var _escHandler: ((e: KeyboardEvent) => void) | null = null;
var _highlightIdx = -1;

// ── SVGs inline ──
var SEARCH_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';
var CHECK_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>';
var CHEVRON_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function updateHighlight(opts: NodeListOf<Element>) {
  for (var i = 0; i < opts.length; i++) {
    if (i === _highlightIdx) {
      opts[i].classList.add('pna-custom-select__option--highlighted');
      opts[i].scrollIntoView({ block: 'nearest' });
    } else {
      opts[i].classList.remove('pna-custom-select__option--highlighted');
    }
  }
}

function closeCustomSelect(): void {
  if (_selectEl) {
    _selectEl.remove();
    _selectEl = null;
  }
  if (_closeHandler) {
    document.removeEventListener('mousedown', _closeHandler);
    _closeHandler = null;
  }
  if (_escHandler) {
    document.removeEventListener('keydown', _escHandler);
    _escHandler = null;
  }
  _highlightIdx = -1;
}

function openCustomSelect(config: CustomSelectConfig): void {
  closeCustomSelect();

  var anchor = config.anchor;
  var options = config.options;
  var value = config.value;
  var width = config.width || 240;
  var maxHeight = config.maxHeight || 280;
  var onSelect = config.onSelect;
  var onClose = config.onClose;
  var showSearch = config.searchable != null ? config.searchable : options.length > 5;

  var rect = anchor.getBoundingClientRect();
  var popover = document.createElement('div');
  popover.className = 'pna-custom-select';
  popover.style.position = 'fixed';
  popover.style.zIndex = '10001';
  popover.style.width = width + 'px';
  popover.style.maxHeight = maxHeight + 'px';

  // Posicionamento
  var left = rect.left;
  var top = rect.bottom + 4;
  if (left + width > window.innerWidth) left = window.innerWidth - width - 8;
  if (left < 4) left = 4;
  if (top + maxHeight > window.innerHeight) top = rect.top - maxHeight - 4;

  popover.style.left = left + 'px';
  popover.style.top = top + 'px';

  _selectEl = popover;
  document.body.appendChild(popover);

  // Adicionar classe --open ao trigger
  anchor.classList.add('pna-custom-select-trigger--open');

  var searchQuery = '';
  var isFirstRender = true;

  // Click delegation on popover — bound ONCE, not per render
  popover.addEventListener('click', function(e: MouseEvent) {
    var btn = (e.target as HTMLElement).closest('[data-cs-value]') as HTMLElement | null;
    if (!btn || btn.classList.contains('pna-custom-select__option--disabled')) return;
    var val = btn.dataset.csValue || '';
    var selected = options.filter(function(o) { return o.value === val; })[0];
    if (selected) onSelect(val, selected);
    closeAndCleanup();
  });

  function render() {
    var filtered = options;
    if (searchQuery) {
      var q = searchQuery.toLowerCase();
      filtered = options.filter(function(o) {
        return o.label.toLowerCase().indexOf(q) >= 0 ||
          o.value.toLowerCase().indexOf(q) >= 0 ||
          (o.description || '').toLowerCase().indexOf(q) >= 0;
      });
    }

    var html = '';

    // Search
    if (showSearch) {
      html += '<div class="pna-custom-select__search">'
        + '<span class="pna-custom-select__search-icon">' + SEARCH_ICON + '</span>'
        + '<input type="text" class="pna-custom-select__search-input"'
        + ' data-cs-search placeholder="' + escapeHtml(config.searchPlaceholder || 'Buscar...') + '"'
        + ' value="' + escapeHtml(searchQuery) + '" autocomplete="off">'
        + '</div>';
    }

    // Options list
    html += '<div class="pna-custom-select__list" role="listbox">';
    for (var i = 0; i < filtered.length; i++) {
      var opt = filtered[i];
      var isSelected = opt.value === value;
      var isHighlight = i === _highlightIdx;
      var cls = 'pna-custom-select__option';
      if (isSelected) cls += ' pna-custom-select__option--selected';
      if (isHighlight) cls += ' pna-custom-select__option--highlighted';
      if (opt.disabled) cls += ' pna-custom-select__option--disabled';

      html += '<button type="button" class="' + cls + '" data-cs-value="' + escapeHtml(opt.value) + '" role="option" aria-selected="' + isSelected + '">';

      // Icon ou color dot
      if (opt.icon) {
        html += '<span class="pna-custom-select__option-icon">' + opt.icon + '</span>';
      } else if (opt.color) {
        html += '<span class="pna-custom-select__option-dot" style="background:' + opt.color + '"></span>';
      }

      html += '<span class="pna-custom-select__option-label">' + escapeHtml(opt.label) + '</span>';

      if (opt.description) {
        html += '<span class="pna-custom-select__option-desc">' + escapeHtml(opt.description) + '</span>';
      }

      if (isSelected) {
        html += '<span class="pna-custom-select__check">' + CHECK_ICON + '</span>';
      }

      html += '</button>';
    }
    if (filtered.length === 0) {
      html += '<div class="pna-custom-select__empty">Nenhum resultado</div>';
    }
    html += '</div>';

    // Footer
    if (showSearch) {
      html += '<div class="pna-custom-select__footer"><span data-cs-count>' + filtered.length + ' opcao(oes)</span></div>';
    }

    popover.innerHTML = html;

    // Bind search input (re-created by innerHTML)
    var searchInput = popover.querySelector('[data-cs-search]') as HTMLInputElement | null;
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        searchQuery = (e.target as HTMLInputElement).value;
        _highlightIdx = -1;
        render();
      });
      // Focus only on first render to avoid repeated rAF scheduling
      if (isFirstRender) {
        requestAnimationFrame(function() { if (searchInput) searchInput.focus(); });
      } else {
        searchInput.focus();
      }
    }
    isFirstRender = false;
  }

  function closeAndCleanup() {
    anchor.classList.remove('pna-custom-select-trigger--open');
    closeCustomSelect();
    if (onClose) onClose();
  }

  render();

  // Keyboard navigation
  _escHandler = function(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeAndCleanup();
      return;
    }
    var visibleOpts = popover.querySelectorAll('.pna-custom-select__option:not(.pna-custom-select__option--disabled)');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _highlightIdx = Math.min(_highlightIdx + 1, visibleOpts.length - 1);
      updateHighlight(visibleOpts);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      _highlightIdx = Math.max(_highlightIdx - 1, 0);
      updateHighlight(visibleOpts);
    } else if (e.key === 'Enter' && _highlightIdx >= 0) {
      e.preventDefault();
      (visibleOpts[_highlightIdx] as HTMLElement)?.click();
    }
  };
  document.addEventListener('keydown', _escHandler);

  // Close on click outside
  _closeHandler = function(e: MouseEvent) {
    if (_selectEl && !_selectEl.contains(e.target as Node) && !anchor.contains(e.target as Node)) {
      closeAndCleanup();
    }
  };
  requestAnimationFrame(function() {
    if (_closeHandler) document.addEventListener('mousedown', _closeHandler);
  });
}

// ── Exports (global attach for non-module usage) ──
if (typeof window !== 'undefined') {
  (window as any).__pnaCustomSelect = {
    openCustomSelect: openCustomSelect,
    closeCustomSelect: closeCustomSelect
  };
}

export { openCustomSelect, closeCustomSelect };
export type { CustomSelectOption, CustomSelectConfig };
