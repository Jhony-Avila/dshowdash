import { TABLE_EVENTS } from "/core/runtime/events/catalog/table.events.js";
const VERSION = "1.2.0-P18EC";
const MODULE_ID = "table-engine:keyboard";
const KBD_SVGS = {
  arrowUp: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
  arrowDown: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
  arrowUpDown: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 3 12 8 17 3"/><polyline points="17 21 12 16 7 21"/><line x1="12" y1="8" x2="12" y2="16"/></svg>',
  close: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};
const KeyboardMixin = {
  // @ts-expect-error strict migration — TS2339
  _initKeyboard() {
    this._keyboardHelpOpen = false;
  },
  _onKeydown(e) {
    if (e.target.closest("input, textarea, select")) return;
    const key = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    if (key === "?" || key === "f1") {
      e.preventDefault();
      this._toggleKeyboardHelp();
      return;
    }
    if (key === "escape") {
      if (this._contextMenuOpen) {
        if (this._closeContextMenu) this._closeContextMenu();
        return;
      }
      if (this._keyboardHelpOpen) {
        this._closeKeyboardHelp();
        return;
      }
      if (this._clearSelection) this._clearSelection();
      return;
    }
    if (key === "arrowdown" || key === "j") {
      e.preventDefault();
      if (this._navigateRows) this._navigateRows(1, shift);
      return;
    }
    if (key === "arrowup" || key === "k") {
      e.preventDefault();
      if (this._navigateRows) this._navigateRows(-1, shift);
      return;
    }
    if (ctrl && key === "a") {
      e.preventDefault();
      if (this._selectAll) this._selectAll();
      return;
    }
    if (key === "x") {
      const sel = this._state.getSelection();
      if (sel.size > 0 && this._toggleSelection) this._toggleSelection(Array.from(sel)[0]);
      return;
    }
    if (key === "enter" || key === "v") {
      const sel2 = this._state.getSelection();
      if (sel2.size > 0) this.emit(TABLE_EVENTS.VIEW, { id: Array.from(sel2)[0] });
      return;
    }
    if (key === "e") {
      const sel3 = this._state.getSelection();
      if (sel3.size > 0 && this._toggleRowExpand) this._toggleRowExpand(Array.from(sel3)[0]);
      return;
    }
    if (key === "d" || key === "delete") {
      const sel4 = this._state.getSelection();
      if (sel4.size > 0) this.emit(TABLE_EVENTS.DELETE, { ids: Array.from(sel4) });
      return;
    }
    if (key === "/" || ctrl && key === "f") {
      e.preventDefault();
      const p = this._cssPrefix;
      const input = this._container.querySelector(`.${p}search-input`);
      if (input) input.focus();
      return;
    }
  },
  // @ts-expect-error strict migration — TS2339
  _toggleKeyboardHelp() {
    this._keyboardHelpOpen ? this._closeKeyboardHelp() : this._showKeyboardHelp();
  },
  _showKeyboardHelp() {
    if (this._keyboardHelpOpen) return;
    this._keyboardHelpOpen = true;
    const p = this._cssPrefix;
    const shortcuts = this._options.keyboardShortcuts || [
      { section: "Navega\xE7\xE3o", items: [
        { keys: ["J", KBD_SVGS.arrowDown], label: "Pr\xF3xima linha" },
        { keys: ["K", KBD_SVGS.arrowUp], label: "Linha anterior" },
        { keys: ["Enter"], label: "Ver detalhes" },
        { keys: ["E"], label: "Expandir/Colapsar" }
      ] },
      { section: "Sele\xE7\xE3o", items: [
        { keys: ["X"], label: "Selecionar linha" },
        { keys: ["Shift", KBD_SVGS.arrowUpDown], label: "Estender sele\xE7\xE3o" },
        { keys: ["Ctrl", "A"], label: "Selecionar todos" },
        { keys: ["Esc"], label: "Limpar sele\xE7\xE3o" }
      ] },
      { section: "A\xE7\xF5es", items: [
        { keys: ["V"], label: "Ver detalhes" },
        { keys: ["D"], label: "Excluir" },
        { keys: ["/", "Ctrl+F"], label: "Buscar" }
      ] }
    ];
    const overlay = document.createElement("div");
    overlay.className = `${p}keyboard-overlay`;
    const help = document.createElement("div");
    help.className = `${p}keyboard-help`;
    help.innerHTML = `<div class="${p}kbd-header"><h3>Atalhos de Teclado</h3><button class="${p}kbd-close" data-action="close-shortcuts">${KBD_SVGS.close}</button></div><div class="${p}kbd-grid">${shortcuts.map((s) => `<div class="${p}kbd-section"><h4>${s.section}</h4>${s.items.map((i) => `<div class="${p}kbd-row">${i.keys.map((k) => `<kbd>${k}</kbd>`).join(" + ")}<span>${i.label}</span></div>`).join("")}</div>`).join("")}</div><div class="${p}kbd-footer"><span>Pressione <kbd>?</kbd> para abrir/fechar</span></div>`;
    overlay.appendChild(help);
    this._container.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.classList.add(`${p}visible`);
    });
  },
  _closeKeyboardHelp() {
    const p = this._cssPrefix;
    const overlay = this._container.querySelector(`.${p}keyboard-overlay`);
    if (overlay) {
      overlay.classList.remove(`${p}visible`);
      setTimeout(() => {
        overlay.remove();
      }, 200);
    }
    this._keyboardHelpOpen = false;
  },
  showShortcuts() {
    this._showKeyboardHelp();
  }
};
var keyboard_default = KeyboardMixin;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
export {
  KeyboardMixin,
  MODULE_ID,
  VERSION,
  keyboard_default as default,
  healthCheck,
  info
};
