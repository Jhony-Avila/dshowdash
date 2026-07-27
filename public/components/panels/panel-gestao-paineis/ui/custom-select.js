let _selectEl = null;
let _closeHandler = null;
let _escHandler = null;
let _highlightIdx = -1;
const SEARCH_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';
const CHECK_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>';
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function updateHighlight(opts) {
  for (let i = 0; i < opts.length; i++) {
    if (i === _highlightIdx) {
      opts[i].classList.add("pgp-cs__option--highlighted");
      opts[i].scrollIntoView({ block: "nearest" });
    } else {
      opts[i].classList.remove("pgp-cs__option--highlighted");
    }
  }
}
function closeCustomSelect() {
  if (_selectEl) {
    _selectEl.classList.add("pgp-cs--closing");
    setTimeout(() => {
      if (_selectEl) {
        _selectEl.remove();
        _selectEl = null;
      }
    }, 120);
  }
  if (_closeHandler) {
    document.removeEventListener("mousedown", _closeHandler);
    _closeHandler = null;
  }
  if (_escHandler) {
    document.removeEventListener("keydown", _escHandler);
    _escHandler = null;
  }
  _highlightIdx = -1;
}
function openCustomSelect(config) {
  closeCustomSelect();
  document.querySelectorAll(".pgp-cs").forEach((el) => el.remove());
  const anchor = config.anchor;
  const options = config.options;
  let value = config.value;
  const width = config.width || 220;
  const maxHeight = config.maxHeight || 260;
  const onSelect = config.onSelect;
  const onClose = config.onClose;
  const showSearch = config.searchable != null ? config.searchable : options.length > 6;
  const rect = anchor.getBoundingClientRect();
  const popover = document.createElement("div");
  popover.className = "pgp-cs";
  popover.style.position = "fixed";
  popover.style.zIndex = "10001";
  popover.style.width = width + "px";
  popover.style.maxHeight = maxHeight + "px";
  let left = rect.left;
  let top = rect.bottom + 4;
  if (left + width > window.innerWidth) left = window.innerWidth - width - 8;
  if (left < 4) left = 4;
  if (top + maxHeight > window.innerHeight) top = rect.top - maxHeight - 4;
  popover.style.left = left + "px";
  popover.style.top = top + "px";
  _selectEl = popover;
  document.body.appendChild(popover);
  anchor.classList.add("pgp-cs-trigger--open");
  let searchQuery = "";
  let isFirstRender = true;
  popover.addEventListener("click", function(e) {
    const btn = e.target.closest("[data-cs-value]");
    if (!btn || btn.classList.contains("pgp-cs__option--disabled")) return;
    const val = btn.dataset.csValue || "";
    const selected = options.filter((o) => o.value === val)[0];
    if (selected) {
      value = val;
      onSelect(val, selected);
    }
    closeAndCleanup();
  });
  function render() {
    let filtered = options;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = options.filter(
        (o) => o.label.toLowerCase().indexOf(q) >= 0 || o.value.toLowerCase().indexOf(q) >= 0 || (o.description || "").toLowerCase().indexOf(q) >= 0
      );
    }
    let html = "";
    if (showSearch) {
      html += '<div class="pgp-cs__search"><span class="pgp-cs__search-icon">' + SEARCH_ICON + '</span><input type="text" class="pgp-cs__search-input" data-cs-search placeholder="' + escapeHtml(config.searchPlaceholder || "Buscar...") + '" value="' + escapeHtml(searchQuery) + '" autocomplete="off"></div>';
    }
    html += '<div class="pgp-cs__list" role="listbox">';
    for (let i = 0; i < filtered.length; i++) {
      const opt = filtered[i];
      const isSelected = opt.value === value;
      const isHighlight = i === _highlightIdx;
      let cls = "pgp-cs__option";
      if (isSelected) cls += " pgp-cs__option--selected";
      if (isHighlight) cls += " pgp-cs__option--highlighted";
      if (opt.disabled) cls += " pgp-cs__option--disabled";
      html += '<button type="button" class="' + cls + '" data-cs-value="' + escapeHtml(opt.value) + '" role="option" aria-selected="' + isSelected + '">';
      if (opt.color) {
        html += '<span class="pgp-cs__option-dot" style="background:' + opt.color + '"></span>';
      }
      html += '<span class="pgp-cs__option-label">' + escapeHtml(opt.label) + "</span>";
      if (opt.description) {
        html += '<span class="pgp-cs__option-desc">' + escapeHtml(opt.description) + "</span>";
      }
      if (isSelected) {
        html += '<span class="pgp-cs__check">' + CHECK_ICON + "</span>";
      }
      html += "</button>";
    }
    if (filtered.length === 0) {
      html += '<div class="pgp-cs__empty">Nenhum resultado</div>';
    }
    html += "</div>";
    popover.innerHTML = html;
    const searchInput = popover.querySelector("[data-cs-search]");
    if (searchInput) {
      searchInput.addEventListener("input", function(e) {
        searchQuery = e.target.value;
        _highlightIdx = -1;
        render();
      });
      if (isFirstRender) {
        requestAnimationFrame(() => {
          if (searchInput) searchInput.focus();
        });
      } else {
        searchInput.focus();
      }
    }
    isFirstRender = false;
  }
  function closeAndCleanup() {
    anchor.classList.remove("pgp-cs-trigger--open");
    closeCustomSelect();
    if (onClose) onClose();
  }
  render();
  _escHandler = function(e) {
    if (e.key === "Escape") {
      closeAndCleanup();
      return;
    }
    const visibleOpts = popover.querySelectorAll(".pgp-cs__option:not(.pgp-cs__option--disabled)");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      _highlightIdx = Math.min(_highlightIdx + 1, visibleOpts.length - 1);
      updateHighlight(visibleOpts);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      _highlightIdx = Math.max(_highlightIdx - 1, 0);
      updateHighlight(visibleOpts);
    } else if (e.key === "Enter" && _highlightIdx >= 0) {
      e.preventDefault();
      visibleOpts[_highlightIdx]?.click();
    }
  };
  document.addEventListener("keydown", _escHandler);
  _closeHandler = function(e) {
    if (_selectEl && !_selectEl.contains(e.target) && !anchor.contains(e.target)) {
      closeAndCleanup();
    }
  };
  requestAnimationFrame(() => {
    if (_closeHandler) document.addEventListener("mousedown", _closeHandler);
  });
}
export {
  closeCustomSelect,
  openCustomSelect
};
