const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.region-resize.styles";
function injectStyles() {
  if (typeof document === "undefined") return;
  const styleId = "dsd-region-resize-styles";
  if (document.getElementById(styleId)) return;
  const css = [
    "/* Region Resize CSS Variables */",
    ":root {",
    "  --dsd-sidebar-width: 280px;",
    "  --dsd-footer-height: 48px;",
    "  --dsd-navrail-width: 64px;",
    "  --dsd-header-height: 56px;",
    "}",
    "",
    "/* Resize handle styles */",
    ".dsd-resize-handle {",
    "  position: absolute;",
    "  background: transparent;",
    "  z-index: 10;",
    "  transition: background 0.2s ease;",
    "}",
    "",
    ".dsd-resize-handle:hover {",
    "  background: var(--dsd-primary, #3b82f6);",
    "  opacity: 0.3;",
    "}",
    "",
    ".dsd-resize-handle--horizontal {",
    "  width: 4px;",
    "  cursor: col-resize;",
    "  top: 0;",
    "  bottom: 0;",
    "  right: 0;",
    "}",
    "",
    ".dsd-resize-handle--vertical {",
    "  height: 4px;",
    "  cursor: row-resize;",
    "  left: 0;",
    "  right: 0;",
    "  top: 0;",
    "}"
  ].join("\n");
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = css;
  document.head.appendChild(style);
}
injectStyles();
export {
  MODULE_ID,
  VERSION,
  injectStyles
};
