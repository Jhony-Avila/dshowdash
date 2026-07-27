const VERSION = "1.1.0-MODULAR";
const MODULE_ID = "app-shell.ui.region-loading.dom-helpers";
const LOADING_CLASS = "dsd-region--loading";
const SKELETON_CLASS = "dsd-region--skeleton";
const SPINNER_CLASS = "dsd-region__spinner";
const OVERLAY_CLASS = "dsd-region__loading-overlay";
function createSpinner() {
  const spinner = document.createElement("div");
  spinner.className = SPINNER_CLASS;
  spinner.innerHTML = '<div class="dsd-spinner"><div></div><div></div><div></div></div>';
  spinner.setAttribute("role", "status");
  spinner.setAttribute("aria-label", "Loading");
  return spinner;
}
function createOverlay(withSpinner) {
  const overlay = document.createElement("div");
  overlay.className = OVERLAY_CLASS;
  if (withSpinner) {
    overlay.appendChild(createSpinner());
  }
  return overlay;
}
function removeOverlay(region) {
  const overlay = region.querySelector(`.${OVERLAY_CLASS}`);
  if (overlay) {
    overlay.remove();
  }
}
function injectCSS() {
  if (typeof document === "undefined") return;
  const styleId = "dsd-region-loading-styles";
  if (document.getElementById(styleId)) return;
  const css = [
    "/* Region Loading States CSS */",
    ".dsd-region--loading {",
    "  position: relative;",
    "  pointer-events: none;",
    "}",
    "",
    ".dsd-region__loading-overlay {",
    "  position: absolute;",
    "  top: 0;",
    "  left: 0;",
    "  right: 0;",
    "  bottom: 0;",
    "  background: rgba(255, 255, 255, 0.8);",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  z-index: 100;",
    "}",
    "",
    '[data-theme="dark"] .dsd-region__loading-overlay {',
    "  background: rgba(0, 0, 0, 0.6);",
    "}",
    "",
    ".dsd-region__spinner {",
    "  display: flex;",
    "  gap: 4px;",
    "}",
    "",
    ".dsd-spinner > div {",
    "  width: 8px;",
    "  height: 8px;",
    "  background: var(--dsd-primary, #3b82f6);",
    "  border-radius: 50%;",
    "  animation: dsd-bounce 1.4s infinite ease-in-out both;",
    "}",
    "",
    ".dsd-spinner > div:nth-child(1) { animation-delay: -0.32s; }",
    ".dsd-spinner > div:nth-child(2) { animation-delay: -0.16s; }",
    ".dsd-spinner > div:nth-child(3) { animation-delay: 0s; }",
    "",
    "@keyframes dsd-bounce {",
    "  0%, 80%, 100% { transform: scale(0); }",
    "  40% { transform: scale(1); }",
    "}",
    "",
    "/* Skeleton loading */",
    ".dsd-region--skeleton {",
    "  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);",
    "  background-size: 200% 100%;",
    "  animation: dsd-skeleton 1.5s ease-in-out infinite;",
    "}",
    "",
    '[data-theme="dark"] .dsd-region--skeleton {',
    "  background: linear-gradient(90deg, #2d2d2d 25%, #3d3d3d 50%, #2d2d2d 75%);",
    "  background-size: 200% 100%;",
    "}",
    "",
    "@keyframes dsd-skeleton {",
    "  0% { background-position: 200% 0; }",
    "  100% { background-position: -200% 0; }",
    "}",
    "",
    "@media (prefers-reduced-motion: reduce) {",
    "  .dsd-spinner > div,",
    "  .dsd-region--skeleton {",
    "    animation: none !important;",
    "  }",
    "  .dsd-region--skeleton {",
    "    background: #e0e0e0;",
    "  }",
    "}"
  ].join("\n");
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = css;
  document.head.appendChild(style);
}
export {
  LOADING_CLASS,
  MODULE_ID,
  OVERLAY_CLASS,
  SKELETON_CLASS,
  SPINNER_CLASS,
  VERSION,
  createOverlay,
  createSpinner,
  injectCSS,
  removeOverlay
};
