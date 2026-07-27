import { ICONS } from "../icons.js";
import { _createButton, _createGroup, _createDropdown, _createOverflowButton, setupKeyboardNavigation } from "../helpers/dom.js";
import { addCleanup } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.features-toolbar.ui.builder";
function _buildToolbar() {
  const toolbar = document.createElement("div");
  toolbar.className = "features-toolbar";
  toolbar.id = "features-toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Funcionalidades");
  toolbar.appendChild(_createGroup([
    // @ts-expect-error TS migration - TS2345
    _createButton("back", ICONS.arrowLeft, "Voltar", "Alt+\u2190"),
    // @ts-expect-error TS migration - TS2345
    _createButton("forward", ICONS.arrowRight, "Avancar", "Alt+\u2192"),
    // @ts-expect-error TS migration - TS2345
    _createButton("refresh", ICONS.refresh, "Atualizar", "F5"),
    // @ts-expect-error TS migration - TS2345
    _createDropdown("history", ICONS.history, "Historico", [
      { label: "Voltar ao Inicio", icon: ICONS.rewindAll, actionId: "history-back-all" },
      { label: "Limpar Historico", icon: ICONS.trash, actionId: "history-clear" }
    ])
  ], "navigation"));
  toolbar.appendChild(_createGroup([
    // @ts-expect-error TS migration - TS2345
    _createButton("search", ICONS.search, "Buscar", "Ctrl+F"),
    // @ts-expect-error TS migration - TS2345
    _createButton("command", ICONS.command, "Comandos", "Ctrl+K")
  ], "search"));
  toolbar.appendChild(_createGroup([
    // @ts-expect-error TS migration - TS2345
    _createButton("split", ICONS.splitView, "Dividir Tela", "Ctrl+\\"),
    // @ts-expect-error TS migration - TS2345
    _createButton("fullscreen", ICONS.fullscreen, "Tela Cheia", "F11")
  ], "layout"));
  toolbar.appendChild(_createGroup([
    // @ts-expect-error TS migration - TS2345
    _createButton("zoomOut", ICONS.zoomOut, "Zoom -", "Ctrl+-"),
    // @ts-expect-error TS migration - TS2345
    _createButton("zoomReset", ICONS.zoomReset, "Zoom 100%", "Ctrl+0"),
    // @ts-expect-error TS migration - TS2345
    _createButton("zoomIn", ICONS.zoomIn, "Zoom +", "Ctrl++")
  ], "zoom"));
  toolbar.appendChild(_createGroup([
    // @ts-expect-error TS migration - TS2345
    _createButton("bookmark", ICONS.bookmark, "Favorito", "Ctrl+D"),
    // @ts-expect-error TS migration - TS2345
    _createDropdown("export", ICONS.download, "Exportar", [
      { label: "PNG", icon: ICONS.download, actionId: "export-png" },
      { label: "JPEG", icon: ICONS.download, actionId: "export-jpeg" },
      { label: "PDF", icon: ICONS.download, actionId: "export-pdf" },
      { label: "SVG", icon: ICONS.download, actionId: "export-svg" }
    ]),
    // @ts-expect-error TS migration - TS2345
    _createButton("print", ICONS.printer, "Imprimir", "Ctrl+P")
  ], "actions"));
  toolbar.appendChild(_createGroup([
    // @ts-expect-error TS migration - TS2345
    _createButton("theme", ICONS.sun, "Alternar Tema", ""),
    // @ts-expect-error TS migration - TS2345
    _createDropdown("a11y", ICONS.accessibility, "Acessibilidade", [
      { label: "Aumentar Fonte", icon: ICONS.fontIncrease, actionId: "a11y-font-increase" },
      { label: "Diminuir Fonte", icon: ICONS.fontDecrease, actionId: "a11y-font-decrease" },
      { label: "Alto Contraste", icon: ICONS.contrast, actionId: "a11y-high-contrast" },
      { label: "Modo Foco", icon: ICONS.focus, actionId: "a11y-focus-mode" }
    ]),
    // @ts-expect-error TS migration - TS2345
    _createButton("tour", ICONS.tour, "Tour Guiado", "")
  ], "config"));
  toolbar.appendChild(_createGroup([
    // @ts-expect-error TS migration - TS2345
    _createButton("offline", ICONS.wifi, "Modo Offline", ""),
    // @ts-expect-error TS migration - TS2345
    _createButton("tabs", ICONS.layers, "Gerenciar Abas", ""),
    // @ts-expect-error TS migration - TS2345
    _createDropdown("layout", ICONS.grid, "Layout", [
      { label: "Padrao", icon: ICONS.layoutDefault, actionId: "layout-default" },
      { label: "Compacto", icon: ICONS.layoutCompact, actionId: "layout-compact" },
      { label: "Amplo", icon: ICONS.layoutWide, actionId: "layout-wide" }
    ]),
    // @ts-expect-error TS migration - TS2345
    _createButton("devtools", ICONS.wrench, "DevTools", "")
  ], "tools"));
  toolbar.appendChild(_createGroup([
    // @ts-expect-error TS migration - TS2345
    _createDropdown("clipboard", ICONS.clipboard, "Clipboard", [
      { label: "Copiar URL", icon: ICONS.clipboardCopyUrl, actionId: "clipboard-copy-url" },
      { label: "Copiar Conteudo", icon: ICONS.clipboardCopyContent, actionId: "clipboard-copy-content" }
    ]),
    // @ts-expect-error TS migration - TS2345
    _createDropdown("screenshot", ICONS.camera, "Captura de Tela", [
      { label: "Capturar PNG", icon: ICONS.screenshotPng, actionId: "screenshot-png" },
      { label: "Capturar PDF", icon: ICONS.screenshotPdf, actionId: "screenshot-pdf" }
    ]),
    // @ts-expect-error TS migration - TS2345
    _createButton("wakeLock", ICONS.wakeLock, "Manter Tela Ligada", "")
  ], "utilities"));
  const overflow = _createOverflowButton();
  toolbar.appendChild(overflow);
  _setupOverflowObserver(toolbar, overflow);
  setupKeyboardNavigation(toolbar);
  return toolbar;
}
const _currentOverflowRef = { toolbar: null, overflow: null };
function _setupOverflowObserver(toolbar, overflow) {
  if (typeof ResizeObserver === "undefined") return;
  _currentOverflowRef.toolbar = toolbar;
  _currentOverflowRef.overflow = overflow;
  let _rafPending = false;
  const observer = new ResizeObserver(() => {
    if (_rafPending) return;
    _rafPending = true;
    requestAnimationFrame(() => {
      _rafPending = false;
      _updateOverflow(toolbar, overflow);
    });
  });
  observer.observe(toolbar);
  addCleanup(() => {
    observer.disconnect();
    _currentOverflowRef.toolbar = null;
    _currentOverflowRef.overflow = null;
  });
  setTimeout(() => {
    _updateOverflow(toolbar, overflow);
  }, 100);
}
function _updateOverflow(toolbar, overflow) {
  const groups = toolbar.querySelectorAll(".features-toolbar__group");
  if (!groups.length) return;
  const toolbarWidth = toolbar.clientWidth;
  const overflowWidth = 36;
  const availableWidth = toolbarWidth - overflowWidth;
  const groupArray = Array.from(groups);
  groupArray.forEach((g) => {
    g.style.display = "";
  });
  let totalWidth = 0;
  const groupWidths = groupArray.map((g) => {
    const w = g.offsetWidth;
    totalWidth += w;
    return w;
  });
  if (totalWidth <= availableWidth) {
    overflow.style.display = "none";
    return;
  }
  const hiddenGroups = [];
  let currentWidth = totalWidth;
  for (let i = groupArray.length - 1; i >= 0; i--) {
    if (currentWidth <= availableWidth) break;
    groupArray[i].style.display = "none";
    currentWidth -= groupWidths[i];
    hiddenGroups.unshift(groupArray[i]);
  }
  const menu = overflow.querySelector(".features-toolbar__overflow-menu");
  if (!menu) return;
  while (menu.firstChild) menu.removeChild(menu.firstChild);
  hiddenGroups.forEach((group) => {
    const groupId = group.getAttribute("data-group-id") || "";
    const header = document.createElement("div");
    header.className = "features-toolbar__overflow-header";
    header.textContent = groupId.charAt(0).toUpperCase() + groupId.slice(1);
    menu.appendChild(header);
    const buttons = group.querySelectorAll(".features-toolbar__btn");
    buttons.forEach((btn) => {
      const item = document.createElement("div");
      item.className = "features-toolbar__overflow-item";
      item.setAttribute("role", "menuitem");
      const tooltip = btn.getAttribute("data-tooltip") || "";
      item.innerHTML = `<span>${tooltip}</span>`;
      item.addEventListener("click", () => {
        overflow.classList.remove("open");
        btn.click();
      });
      menu.appendChild(item);
    });
  });
  overflow.style.display = "";
}
function _appendDynamicGroup(toolbar, groupId, buttonDefs) {
  if (!toolbar || !groupId || !Array.isArray(buttonDefs) || buttonDefs.length === 0) return null;
  const buttons = buttonDefs.map((def) => _createButton(def.id, def.icon || "", def.tooltip || def.id, def.shortcut || ""));
  const group = _createGroup(buttons, groupId);
  group.setAttribute("data-dynamic", "true");
  const ovf = toolbar.querySelector("#ft-overflow");
  if (ovf) {
    toolbar.insertBefore(group, ovf);
  } else {
    toolbar.appendChild(group);
  }
  if (_currentOverflowRef.toolbar && _currentOverflowRef.overflow) {
    _updateOverflow(_currentOverflowRef.toolbar, _currentOverflowRef.overflow);
  }
  return group;
}
export {
  MODULE_ID,
  VERSION,
  _appendDynamicGroup,
  _buildToolbar
};
