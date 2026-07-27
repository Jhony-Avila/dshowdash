const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.region-visibility.helpers";
const TRANSITION_DURATION = 300;
const HIDDEN_CLASS = "dsd-region--hidden";
const HIDING_CLASS = "dsd-region--hiding";
const SHOWING_CLASS = "dsd-region--showing";
function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  return mq && mq.matches;
}
function getDuration(customDuration) {
  if (prefersReducedMotion()) return 0;
  return typeof customDuration === "number" ? customDuration : TRANSITION_DURATION;
}
function injectCSS() {
  if (typeof document === "undefined") return;
  const styleId = "dsd-region-visibility-styles";
  if (document.getElementById(styleId)) return;
  const css = [
    ".dsd-region--hidden {",
    "  display: none !important;",
    "  visibility: hidden !important;",
    "}",
    ".dsd-region--hiding {",
    "  opacity: 0;",
    `  transition: opacity ${TRANSITION_DURATION}ms ease-out;`,
    "  pointer-events: none;",
    "}",
    ".dsd-region--showing {",
    "  opacity: 1;",
    `  transition: opacity ${TRANSITION_DURATION}ms ease-in;`,
    "}",
    "@media (prefers-reduced-motion: reduce) {",
    "  .dsd-region--hiding,",
    "  .dsd-region--showing {",
    "    transition: none !important;",
    "  }",
    "}"
  ].join("\n");
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = css;
  document.head.appendChild(style);
}
export {
  HIDDEN_CLASS,
  HIDING_CLASS,
  MODULE_ID,
  SHOWING_CLASS,
  TRANSITION_DURATION,
  VERSION,
  getDuration,
  injectCSS,
  prefersReducedMotion
};
