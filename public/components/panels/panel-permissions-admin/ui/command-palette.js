import { Icons } from "./icons.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-command-palette";
const ARROW_SVGS = { up: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="18 15 12 9 6 15"/></svg>', down: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="6 9 12 15 18 9"/></svg>' };
const COMMANDS = [{ id: "search", label: "Buscar triggers...", shortcut: "/", icon: "search", group: "navigation" }, { id: "user-next", label: "Pr\xF3ximo usu\xE1rio", shortcut: ARROW_SVGS.down, icon: "chevronDown", group: "navigation" }, { id: "user-prev", label: "Usu\xE1rio anterior", shortcut: ARROW_SVGS.up, icon: "chevronUp", group: "navigation" }, { id: "undo", label: "Desfazer \xFAltima a\xE7\xE3o", shortcut: "Ctrl+Z", icon: "undo", group: "actions" }, { id: "redo", label: "Refazer a\xE7\xE3o", shortcut: "Ctrl+Y", icon: "redo", group: "actions" }, { id: "grant-all", label: "Liberar todos os triggers", shortcut: "", icon: "checkCircle", group: "permissions" }, { id: "revoke-all", label: "Revogar todos os triggers", shortcut: "", icon: "xCircle", group: "permissions" }, { id: "bulk-mode", label: "Ativar sele\xE7\xE3o em massa", shortcut: "B", icon: "checkbox", group: "permissions" }, { id: "compare", label: "Comparar usu\xE1rios", shortcut: "C", icon: "copy", group: "tools" }, { id: "refresh", label: "Atualizar dados", shortcut: "R", icon: "refresh", group: "tools" }, { id: "export", label: "Exportar relat\xF3rio", shortcut: "E", icon: "download", group: "tools" }, { id: "help", label: "Ajuda e atalhos", shortcut: "?", icon: "info", group: "help" }];
const GROUP_LABELS = { navigation: "Navega\xE7\xE3o", actions: "A\xE7\xF5es", permissions: "Permiss\xF5es", tools: "Ferramentas", help: "Ajuda" };
function CommandPalette(options = {}) {
  this._container = null;
  this._input = null;
  this._list = null;
  this._isOpen = false;
  this._selectedIndex = 0;
  this._filteredCommands = COMMANDS.slice();
  this._onExecute = options.onExecute || (() => {
  });
  this._keyHandler = null;
  this._abortController = null;
}
CommandPalette.create = (options) => new CommandPalette(options);
CommandPalette.prototype.init = function() {
  this._createDOM();
  this._bindEvents();
};
CommandPalette.prototype._createDOM = function() {
  this._container = document.createElement("div");
  this._container.className = "uarps-command-palette";
  this._container.innerHTML = `<div class="uarps-command-palette__container"><div class="uarps-command-palette__header"><svg class="uarps-command-palette__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" class="uarps-command-palette__input" placeholder="Digite um comando..." autocomplete="off"><span class="uarps-command-palette__shortcut">ESC</span></div><div class="uarps-command-palette__body"></div><div class="uarps-command-palette__footer"><span class="uarps-command-palette__hint"><kbd>${ARROW_SVGS.up}${ARROW_SVGS.down}</kbd> navegar</span><span class="uarps-command-palette__hint"><kbd>Enter</kbd> executar</span><span class="uarps-command-palette__hint"><kbd>Esc</kbd> fechar</span></div></div>`;
  document.body.appendChild(this._container);
  this._input = this._container.querySelector(".uarps-command-palette__input");
  this._list = this._container.querySelector(".uarps-command-palette__body");
};
CommandPalette.prototype._bindEvents = function() {
  this._abortController = new AbortController();
  this._keyHandler = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      this.toggle();
    }
    if (this._isOpen) {
      if (e.key === "Escape") this.close();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this._navigate(1);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        this._navigate(-1);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        this._executeSelected();
      }
    }
  };
  document.addEventListener("keydown", this._keyHandler, { signal: this._abortController.signal });
  if (this._input) this._input.addEventListener("input", (e) => {
    this._filter(e.target.value);
  });
  if (this._container) this._container.addEventListener("click", (e) => {
    if (e.target === this._container) this.close();
    const item = e.target.closest(".uarps-command-palette__item");
    if (item) {
      this._selectedIndex = parseInt(item.dataset.index || "0", 10);
      this._executeSelected();
    }
  });
};
CommandPalette.prototype._filter = function(query) {
  const q = query.toLowerCase().trim();
  this._filteredCommands = q ? COMMANDS.filter((c) => c.label.toLowerCase().includes(q) || c.id.includes(q)) : COMMANDS.slice();
  this._selectedIndex = 0;
  this._render();
};
CommandPalette.prototype._navigate = function(dir) {
  this._selectedIndex = Math.max(0, Math.min(this._filteredCommands.length - 1, this._selectedIndex + dir));
  this._render();
  this._scrollToSelected();
};
CommandPalette.prototype._scrollToSelected = function() {
  const selected = this._list?.querySelector(".uarps-command-palette__item--selected");
  if (selected) selected.scrollIntoView({ block: "nearest" });
};
CommandPalette.prototype._executeSelected = function() {
  const cmd = this._filteredCommands[this._selectedIndex];
  if (cmd) {
    this.close();
    this._onExecute(cmd.id);
  }
};
CommandPalette.prototype._render = function() {
  if (!this._list) return;
  const grouped = {};
  this._filteredCommands.forEach((cmd, i) => {
    const group = cmd.group;
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push({ ...cmd, index: i });
  });
  let html = "";
  const groupLabels = GROUP_LABELS;
  const iconsRecord = Icons;
  Object.keys(grouped).forEach((group) => {
    const items = grouped[group];
    html += `<div class="uarps-command-palette__group"><div class="uarps-command-palette__group-title">${groupLabels[group] || group}</div>`;
    items.forEach((cmd) => {
      const isSelected = cmd.index === this._selectedIndex;
      html += `<div class="uarps-command-palette__item ${isSelected ? "uarps-command-palette__item--selected" : ""}" data-index="${cmd.index}"><span class="uarps-command-palette__item-icon">${iconsRecord[cmd.icon] || ""}</span><span class="uarps-command-palette__item-text">${cmd.label}</span>${cmd.shortcut ? `<span class="uarps-command-palette__item-shortcut">${cmd.shortcut}</span>` : ""}</div>`;
    });
    html += "</div>";
  });
  this._list.innerHTML = html || '<div class="uarps-command-palette__empty">Nenhum comando encontrado</div>';
};
CommandPalette.prototype.open = function() {
  if (this._isOpen) return;
  this._isOpen = true;
  this._filteredCommands = COMMANDS.slice();
  this._selectedIndex = 0;
  if (this._container) this._container.classList.add("uarps-command-palette--open");
  this._input.value = "";
  if (this._input) this._input.focus();
  this._render();
};
CommandPalette.prototype.close = function() {
  if (!this._isOpen) return;
  this._isOpen = false;
  if (this._container) this._container.classList.remove("uarps-command-palette--open");
};
CommandPalette.prototype.toggle = function() {
  this._isOpen ? this.close() : this.open();
};
CommandPalette.prototype.destroy = function() {
  if (this._abortController) {
    this._abortController.abort();
    this._abortController = null;
    this._keyHandler = null;
  }
  if (this._container) this._container.remove();
};
CommandPalette.prototype.info = () => ({
  moduleId: MODULE_ID,
  version: VERSION
});
CommandPalette.prototype.healthCheck = function() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { isOpen: this._isOpen } };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { commandsCount: COMMANDS.length } });
var command_palette_default = CommandPalette;
export {
  CommandPalette,
  MODULE_ID,
  VERSION,
  command_palette_default as default,
  healthCheck,
  info
};
