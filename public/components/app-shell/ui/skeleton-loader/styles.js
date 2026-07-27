import { config } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.skeleton-loader.styles";
function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("skeleton-loader-styles")) return;
  const css = `
.skeleton-loader {
  position: relative;
  overflow: hidden;
  background: var(--skeleton-base-color, ${config.baseColor});
  border-radius: var(--skeleton-radius, ${config.borderRadius});
}
.skeleton-loader.skeleton-pulse {
  animation: skeleton-pulse ${config.animationDuration}ms ease-in-out infinite;
}
.skeleton-loader.skeleton-wave::after {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(90deg, transparent, var(--skeleton-highlight-color, ${config.highlightColor}), transparent);
  animation: skeleton-wave ${config.animationDuration}ms ease-in-out infinite;
}
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes skeleton-wave {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.skeleton-container { display: flex; flex-direction: column; }
.skeleton-row { display: flex; flex-direction: row; align-items: center; }
.skeleton-grid { display: grid; }
.skeleton-circle { border-radius: 50%; }
`;
  const style = document.createElement("style");
  style.id = "skeleton-loader-styles";
  style.textContent = css;
  document.head.appendChild(style);
}
function removeStyles() {
  const existing = document.getElementById("skeleton-loader-styles");
  if (existing) existing.remove();
}
export {
  MODULE_ID,
  VERSION,
  injectStyles,
  removeStyles
};
