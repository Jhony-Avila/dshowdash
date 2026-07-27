function escapeHtml(s) {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[m]);
}
function copyToClipboard(text, onSuccess = null) {
  if (!text) return;
  navigator.clipboard?.writeText(text).then(() => {
    if (onSuccess) onSuccess();
  }).catch((err) => {
    Logger?.error?.("[panel-05:table:utils] Clipboard error:", err);
  });
}
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}
function throttleRAF(fn) {
  let rafId = null;
  return function(...args) {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      fn.apply(this, args);
      rafId = null;
    });
  };
}
function createElement(tag, className, innerHTML) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}
function removeElement(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}
function toggleClass(el, className, force) {
  if (el) el.classList.toggle(className, force);
}
function hashData(data) {
  if (!data || !data.length) return "empty";
  const first = data[0];
  const last = data[data.length - 1];
  return `${data.length}-${first?.id || 0}-${last?.id || 0}`;
}
function arrayMove(arr, fromIndex, toIndex) {
  const newArr = [...arr];
  const element = newArr.splice(fromIndex, 1)[0];
  newArr.splice(toIndex, 0, element);
  return newArr;
}
function downloadCSV(content, filename) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
function getRelativePosition(event, container) {
  const rect = container.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    containerWidth: rect.width,
    containerHeight: rect.height
  };
}
function adjustMenuPosition(x, y, menuWidth, menuHeight, containerWidth, containerHeight) {
  let posX = x;
  let posY = y;
  if (posX + menuWidth > containerWidth) {
    posX = containerWidth - menuWidth - 8;
  }
  if (posY + menuHeight > containerHeight) {
    posY = posY - menuHeight;
  }
  return { x: Math.max(0, posX), y: Math.max(0, posY) };
}
const MODULE_ID = "panel-05:table:utils";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { utilsReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  adjustMenuPosition,
  arrayMove,
  copyToClipboard,
  createElement,
  debounce,
  downloadCSV,
  escapeHtml,
  getRelativePosition,
  hashData,
  healthCheck,
  info,
  removeElement,
  throttleRAF,
  toggleClass
};
