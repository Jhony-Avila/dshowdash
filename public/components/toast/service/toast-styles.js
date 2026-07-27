const VERSION = "1.2.0-P2-ENTERPRISE";
const MODULE_ID = "toast.service.toast-styles";
const STYLE_ID = "toast-service-styles";
const CSS = `
#toast-container {
  position: fixed;
  z-index: var(--toast-z-index, 10003);
  display: flex;
  flex-direction: column-reverse;
  gap: 12px;
  pointer-events: none;
}
#toast-container.position-bottom-right { bottom: 24px; right: 24px; }
#toast-container.position-bottom-left { bottom: 24px; left: 24px; }
#toast-container.position-top-right { top: 24px; right: 24px; flex-direction: column; }
#toast-container.position-top-left { top: 24px; left: 24px; flex-direction: column; }

.toast-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  min-width: 300px;
  max-width: 420px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
  border: 1px solid rgba(var(--toast-type-rgb), 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(16px);
  font-family: 'Inter', system-ui, sans-serif;
  pointer-events: auto;
  transform: translateX(120%) scale(0.95);
  opacity: 0;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}
.toast-item.is-visible { transform: translateX(0) scale(1); opacity: 1; }
.toast-item.is-exiting { transform: translateX(50%) scale(0.95); opacity: 0; transition-duration: 0.2s; }

.toast-item--warning,
.toast-item--error,
.toast-item--critical { animation: toast-glow-pulse 3s ease-in-out infinite; }

@keyframes toast-glow-pulse {
  0%, 100% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 8px rgba(var(--toast-type-rgb), 0.15); }
  50% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(var(--toast-type-rgb), 0.25); }
}

.toast-item__icon {
  width: 42px; height: 42px; min-width: 42px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(var(--toast-type-rgb), 0.12);
  border: 1px solid rgba(var(--toast-type-rgb), 0.25);
  border-radius: 10px;
  color: var(--toast-type-accent);
  box-shadow: 0 0 10px rgba(var(--toast-type-rgb), 0.2);
  animation: toast-icon-glow 3s ease-in-out infinite;
}
.toast-item__icon svg { width: 22px; height: 22px; }

@keyframes toast-icon-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(var(--toast-type-rgb), 0.2); }
  50% { box-shadow: 0 0 14px rgba(var(--toast-type-rgb), 0.3); }
}

.toast-item__content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.toast-item__header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.toast-item__header-actions { display: flex; align-items: center; gap: 8px; }

.toast-item__circle-progress { width: 24px; height: 24px; }
.toast-item__circle-svg { width: 24px; height: 24px; transform: rotate(-90deg); }
.toast-item__circle-bg { fill: none; stroke: rgba(255, 255, 255, 0.1); stroke-width: 2.5; }
.toast-item__circle-fill {
  fill: none;
  stroke: var(--toast-type-accent);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 62.83;
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 0.1s linear;
}

.toast-item__badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.5px; text-transform: uppercase;
  background: rgba(var(--toast-type-rgb), 0.15);
  color: var(--toast-type-accent);
  border: 1px solid rgba(var(--toast-type-rgb), 0.3);
  border-radius: 4px;
  white-space: nowrap;
}

.toast-item__close {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; border-radius: 6px;
  color: #94a3b8;
  cursor: pointer; transition: all 0.15s ease;
}
.toast-item__close:hover { background: rgba(255, 255, 255, 0.1); color: #f1f5f9; }
.toast-item__close svg { width: 16px; height: 16px; }

.toast-item__title { font-size: 14px; font-weight: 600; color: #f1f5f9; line-height: 1.45; margin: 0; }
.toast-item__message { font-size: 13px; font-weight: 400; color: #94a3b8; line-height: 1.45; margin: 0; }
.toast-item__countdown { font-weight: 700; color: var(--toast-type-accent); font-variant-numeric: tabular-nums; }

.toast-item__actions { display: flex; gap: 10px; margin-top: 4px; }
.toast-item__btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px 18px;
  font-size: 13px; font-weight: 600;
  font-family: 'Inter', system-ui, sans-serif;
  border-radius: 8px;
  cursor: pointer; transition: all 0.2s ease; white-space: nowrap; border: none;
}
.toast-item__btn--primary {
  background: linear-gradient(135deg, var(--toast-type-accent) 0%, color-mix(in srgb, var(--toast-type-accent) 80%, black) 100%);
  color: #111827;
  box-shadow: 0 2px 8px rgba(var(--toast-type-rgb), 0.25);
}
.toast-item__btn--primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(var(--toast-type-rgb), 0.35); }
.toast-item__btn--ghost {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
}
.toast-item__btn--ghost:hover { background: rgba(255, 255, 255, 0.08); color: #f1f5f9; }

@media (max-width: 480px) {
  #toast-container { left: 16px !important; right: 16px !important; }
  #toast-container.position-bottom-right,
  #toast-container.position-bottom-left { bottom: 16px; }
  .toast-item { min-width: auto; max-width: none; transform: translateY(100%) scale(0.95); }
  .toast-item.is-visible { transform: translateY(0) scale(1); }
  .toast-item.is-exiting { transform: translateY(30%) scale(0.95); }
  .toast-item__actions { width: 100%; }
  .toast-item__btn { flex: 1; justify-content: center; }
}

@media (prefers-reduced-motion: reduce) {
  .toast-item, .toast-item__icon { animation: none !important; transition: opacity 0.1s ease !important; }
  .toast-item { transform: translateX(0); opacity: 0; }
  .toast-item.is-visible { opacity: 1; }
}

[data-theme="light"] .toast-item {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
[data-theme="light"] .toast-item__title { color: #1e293b; }
[data-theme="light"] .toast-item__message { color: #64748b; }
[data-theme="light"] .toast-item__close:hover { background: rgba(0, 0, 0, 0.08); }
[data-theme="light"] .toast-item__circle-bg { stroke: rgba(0, 0, 0, 0.1); }
`;
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}
function removeStyles() {
  const el = document.getElementById(STYLE_ID);
  if (el) el.remove();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, styleId: STYLE_ID, timestamp: Date.now() };
}
function healthCheck() {
  const injected = !!document.getElementById(STYLE_ID);
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { stylesInjected: injected }, timestamp: Date.now() };
}
var toast_styles_default = { injectStyles, removeStyles, VERSION, MODULE_ID, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  toast_styles_default as default,
  healthCheck,
  info,
  injectStyles,
  removeStyles
};
