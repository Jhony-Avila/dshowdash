/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/ui/custom-select.ts
 * @version 1.0.0
 * Dropdown customizado reutilizavel, baseado no pattern do panel-nav-admin
 * Prefixo CSS: pgp-cs (pgp custom-select)
 *
 * IMPORTS: nenhuma dependencia externa
 * PROVIDES: openCustomSelect, closeCustomSelect
 * ═══════════════════════════════════════════════════════════════ */

// ── Interfaces ──
export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
  description?: string;
  disabled?: boolean;
}

export interface CustomSelectConfig {
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
let _selectEl: HTMLDivElement | null = null;
let _closeHandler: ((e: MouseEvent) => void) | null = null;
let _escHandler: ((e: KeyboardEvent) => void) | null = null;
let _highlightIdx = -1;

// ── SVGs inline ──
const SEARCH_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';
const CHECK_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function updateHighlight(opts: NodeListOf<Element>): void {
  for (let i = 0; i < opts.length; i++) {
    if (i === _highlightIdx) {
      opts[i].classList.add('pgp-cs__option--highlighted');
      opts[i].scrollIntoView({ block: 'nearest' });
    } else {
      opts[i].classList.remove('pgp-cs__option--highlighted');
    }
  }
}

export function closeCustomSelect(): void {
  if (_selectEl) {
    _selectEl.classList.add('pgp-cs--closing');
    setTimeout(() => {
      if (_selectEl) {
        _selectEl.remove();
        _selectEl = null;
      }
    }, 120);
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

export function openCustomSelect(config: CustomSelectConfig): void {
  closeCustomSelect();
  // Ensure previous closing animation is cleared
  document.querySelectorAll('.pgp-cs').forEach(el => el.remove());

  const anchor = config.anchor;
  const options = config.options;
  let value = config.value;
  const width = config.width || 220;
  const maxHeight = config.maxHeight || 260;
  const onSelect = config.onSelect;
  const onClose = config.onClose;
  const showSearch = config.searchable != null ? config.searchable : options.length > 6;

  const rect = anchor.getBoundingClientRect();
  const popover = document.createElement('div');
  popover.className = 'pgp-cs';
  popover.style.position = 'fixed';
  popover.style.zIndex = '10001';
  popover.style.width = width + 'px';
  popover.style.maxHeight = maxHeight + 'px';

  // Posicionamento
  let left = rect.left;
  let top = rect.bottom + 4;
  if (left + width > window.innerWidth) left = window.innerWidth - width - 8;
  if (left < 4) left = 4;
  if (top + maxHeight > window.innerHeight) top = rect.top - maxHeight - 4;

  popover.style.left = left + 'px';
  popover.style.top = top + 'px';

  _selectEl = popover;
  document.body.appendChild(popover);

  // Classe --open no trigger
  anchor.classList.add('pgp-cs-trigger--open');

  let searchQuery = '';
  let isFirstRender = true;

  // Click delegation
  popover.addEventListener('click', function(e: MouseEvent) {
    const btn = (e.target as HTMLElement).closest('[data-cs-value]') as HTMLElement | null;
    if (!btn || btn.classList.contains('pgp-cs__option--disabled')) return;
    const val = btn.dataset.csValue || '';
    const selected = options.filter(o => o.value === val)[0];
    if (selected) {
      value = val;
      onSelect(val, selected);
    }
    closeAndCleanup();
  });

  function render(): void {
    let filtered = options;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = options.filter(o =>
        o.label.toLowerCase().indexOf(q) >= 0 ||
        o.value.toLowerCase().indexOf(q) >= 0 ||
        (o.description || '').toLowerCase().indexOf(q) >= 0
      );
    }

    let html = '';

    // Search
    if (showSearch) {
      html += '<div class="pgp-cs__search">'
        + '<span class="pgp-cs__search-icon">' + SEARCH_ICON + '</span>'
        + '<input type="text" class="pgp-cs__search-input"'
        + ' data-cs-search placeholder="' + escapeHtml(config.searchPlaceholder || 'Buscar...') + '"'
        + ' value="' + escapeHtml(searchQuery) + '" autocomplete="off">'
        + '</div>';
    }

    // Options
    html += '<div class="pgp-cs__list" role="listbox">';
    for (let i = 0; i < filtered.length; i++) {
      const opt = filtered[i];
      const isSelected = opt.value === value;
      const isHighlight = i === _highlightIdx;
      let cls = 'pgp-cs__option';
      if (isSelected) cls += ' pgp-cs__option--selected';
      if (isHighlight) cls += ' pgp-cs__option--highlighted';
      if (opt.disabled) cls += ' pgp-cs__option--disabled';

      html += '<button type="button" class="' + cls + '" data-cs-value="' + escapeHtml(opt.value) + '" role="option" aria-selected="' + isSelected + '">';

      if (opt.color) {
        html += '<span class="pgp-cs__option-dot" style="background:' + opt.color + '"></span>';
      }

      html += '<span class="pgp-cs__option-label">' + escapeHtml(opt.label) + '</span>';

      if (opt.description) {
        html += '<span class="pgp-cs__option-desc">' + escapeHtml(opt.description) + '</span>';
      }

      if (isSelected) {
        html += '<span class="pgp-cs__check">' + CHECK_ICON + '</span>';
      }

      html += '</button>';
    }
    if (filtered.length === 0) {
      html += '<div class="pgp-cs__empty">Nenhum resultado</div>';
    }
    html += '</div>';

    popover.innerHTML = html;

    // Bind search input
    const searchInput = popover.querySelector('[data-cs-search]') as HTMLInputElement | null;
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        searchQuery = (e.target as HTMLInputElement).value;
        _highlightIdx = -1;
        render();
      });
      if (isFirstRender) {
        requestAnimationFrame(() => { if (searchInput) searchInput.focus(); });
      } else {
        searchInput.focus();
      }
    }
    isFirstRender = false;
  }

  function closeAndCleanup(): void {
    anchor.classList.remove('pgp-cs-trigger--open');
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
    const visibleOpts = popover.querySelectorAll('.pgp-cs__option:not(.pgp-cs__option--disabled)');
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
  requestAnimationFrame(() => {
    if (_closeHandler) document.addEventListener('mousedown', _closeHandler);
  });
}
