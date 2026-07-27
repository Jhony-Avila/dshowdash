import {
  getZoomIndicator,
  setZoomIndicator,
  getIndicatorTimeout,
  setIndicatorTimeout
} from "../state.js";
const VERSION = "1.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "main.ui.container-main.utils.zoom-manager.ui.indicator";
function createZoomIndicator() {
  let indicator = getZoomIndicator();
  if (indicator) return;
  indicator = document.createElement("div");
  indicator.className = "dsd-zoom-indicator";
  indicator.innerHTML = "    <style>      .dsd-zoom-indicator {        position: fixed;        bottom: 80px;        left: 50%;        transform: translateX(-50%) translateY(20px);        background: rgba(0, 0, 0, 0.8);        color: white;        padding: 8px 16px;        border-radius: 20px;        font-size: 14px;        font-weight: 600;        font-family: system-ui, sans-serif;        pointer-events: none;        opacity: 0;        transition: opacity 0.2s ease, transform 0.2s ease;        z-index: 10000;        backdrop-filter: blur(8px);      }      .dsd-zoom-indicator--visible {        opacity: 1;        transform: translateX(-50%) translateY(0);      }    </style>  ";
  document.body.appendChild(indicator);
  setZoomIndicator(indicator);
}
function showZoomIndicator(zoom) {
  let indicator = getZoomIndicator();
  if (!indicator) {
    createZoomIndicator();
    indicator = getZoomIndicator();
  }
  const percentage = Math.round(zoom * 100);
  indicator.textContent = `${percentage}%`;
  indicator.classList.add("dsd-zoom-indicator--visible");
  const timeout = getIndicatorTimeout();
  if (timeout) clearTimeout(timeout);
  setIndicatorTimeout(setTimeout(() => {
    indicator.classList.remove("dsd-zoom-indicator--visible");
  }, 1500));
}
function removeZoomIndicator() {
  const indicator = getZoomIndicator();
  const timeout = getIndicatorTimeout();
  if (timeout) clearTimeout(timeout);
  if (indicator) indicator.remove();
  setZoomIndicator(null);
  setIndicatorTimeout(null);
}
var indicator_default = {
  showZoomIndicator,
  removeZoomIndicator
};
export {
  MODULE_ID,
  VERSION,
  indicator_default as default,
  removeZoomIndicator,
  showZoomIndicator
};
