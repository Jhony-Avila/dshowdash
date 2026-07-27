const MODULE_ID = "panel-permissions-admin-ui-effects";
const VERSION = "9.3.0-P2-ENTERPRISE";
let _animationQueue = [];
let _isProcessing = false;
let _rafId = null;
function highlightRow(row, type = "success") {
  if (!row) return;
  const className = `ppa-row--highlight-${type}`;
  row.classList.add(className);
  setTimeout(() => {
    row.classList.remove(className);
  }, 1500);
}
function highlightCell(cell, type = "changed") {
  if (!cell) return;
  const className = `ppa-cell--highlight-${type}`;
  cell.classList.add(className);
  setTimeout(() => {
    cell.classList.remove(className);
  }, 2e3);
}
function pulseElement(el, duration = 600) {
  if (!el) return;
  el.classList.add("ppa-pulse");
  setTimeout(() => {
    el.classList.remove("ppa-pulse");
  }, duration);
}
function shakeElement(el, duration = 400) {
  if (!el) return;
  el.classList.add("ppa-shake");
  setTimeout(() => {
    el.classList.remove("ppa-shake");
  }, duration);
}
function bounceElement(el, duration = 500) {
  if (!el) return;
  el.classList.add("ppa-bounce");
  setTimeout(() => {
    el.classList.remove("ppa-bounce");
  }, duration);
}
function fadeIn(el, duration = 300) {
  if (!el) return Promise.resolve();
  return new Promise((resolve) => {
    el.style.opacity = "0";
    el.style.display = "";
    el.style.transition = `opacity ${duration}ms ease`;
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      setTimeout(() => {
        el.style.transition = "";
        resolve();
      }, duration);
    });
  });
}
function fadeOut(el, duration = 300) {
  if (!el) return Promise.resolve();
  return new Promise((resolve) => {
    el.style.transition = `opacity ${duration}ms ease`;
    el.style.opacity = "0";
    setTimeout(() => {
      el.style.display = "none";
      el.style.transition = "";
      el.style.opacity = "";
      resolve();
    }, duration);
  });
}
function slideDown(el, duration = 300) {
  if (!el) return Promise.resolve();
  return new Promise((resolve) => {
    el.style.display = "";
    el.style.overflow = "hidden";
    const height = el.scrollHeight;
    el.style.height = "0px";
    el.style.transition = `height ${duration}ms ease`;
    requestAnimationFrame(() => {
      el.style.height = `${height}px`;
      setTimeout(() => {
        el.style.height = "";
        el.style.overflow = "";
        el.style.transition = "";
        resolve();
      }, duration);
    });
  });
}
function slideUp(el, duration = 300) {
  if (!el) return Promise.resolve();
  return new Promise((resolve) => {
    el.style.overflow = "hidden";
    el.style.height = `${el.scrollHeight}px`;
    el.style.transition = `height ${duration}ms ease`;
    requestAnimationFrame(() => {
      el.style.height = "0px";
      setTimeout(() => {
        el.style.display = "none";
        el.style.height = "";
        el.style.overflow = "";
        el.style.transition = "";
        resolve();
      }, duration);
    });
  });
}
function scrollToElement(el, options = {}) {
  if (!el) return;
  const behavior = options.behavior || "smooth";
  const block = options.block || "center";
  const inline = options.inline || "nearest";
  el.scrollIntoView({ behavior, block, inline });
}
function scrollToTop(container, smooth = true) {
  if (!container) return;
  container.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
}
function createRipple(el, event) {
  if (!el || !event) return;
  const rect = el.getBoundingClientRect();
  const ripple = document.createElement("span");
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  ripple.className = "ppa-ripple";
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  el.appendChild(ripple);
  setTimeout(() => {
    ripple.remove();
  }, 600);
}
function showSkeleton(container, count = 5) {
  if (!container) return;
  let html = '<div class="ppa-skeleton-wrapper">';
  for (let i = 0; i < count; i++) {
    html += '<div class="ppa-skeleton-row"><div class="ppa-skeleton ppa-skeleton--avatar"></div><div class="ppa-skeleton ppa-skeleton--text" style="width:30%"></div><div class="ppa-skeleton ppa-skeleton--text" style="width:50%"></div><div class="ppa-skeleton ppa-skeleton--text" style="width:20%"></div></div>';
  }
  html += "</div>";
  container.innerHTML = html;
}
function hideSkeleton(container) {
  if (!container) return;
  const skeleton = container.querySelector(".ppa-skeleton-wrapper");
  if (skeleton) {
    fadeOut(skeleton, 200).then(() => {
      skeleton.remove();
    });
  }
}
function queueAnimation(fn, delay = 0) {
  _animationQueue.push({ fn, delay });
  if (!_isProcessing) {
    _processQueue();
  }
}
function _processQueue() {
  if (_animationQueue.length === 0) {
    _isProcessing = false;
    return;
  }
  _isProcessing = true;
  const item = _animationQueue.shift();
  setTimeout(() => {
    item.fn();
    _rafId = requestAnimationFrame(_processQueue);
  }, item.delay);
}
function clearAnimationQueue() {
  _animationQueue = [];
  _isProcessing = false;
  if (_rafId) {
    cancelAnimationFrame(_rafId);
    _rafId = null;
  }
}
function staggerAnimation(elements, className, delay = 50) {
  if (!elements || !elements.length) return;
  const arr = Array.from(elements);
  arr.forEach((el, idx) => {
    setTimeout(() => {
      el.classList.add(className);
    }, idx * delay);
  });
}
function staggerFadeIn(elements, delay = 50) {
  if (!elements || !elements.length) return;
  const arr = Array.from(elements);
  arr.forEach((el, idx) => {
    el.style.opacity = "0";
    setTimeout(() => {
      fadeIn(el, 200);
    }, idx * delay);
  });
}
function highlightDifferences(containerA, containerB) {
  if (!containerA || !containerB) return;
  const cellsA = containerA.querySelectorAll("[data-trigger-id]");
  const cellsB = containerB.querySelectorAll("[data-trigger-id]");
  const mapA = /* @__PURE__ */ new Map();
  cellsA.forEach((cell) => {
    mapA.set(cell.dataset.triggerId, cell.dataset.value);
  });
  cellsB.forEach((cell) => {
    const id = cell.dataset.triggerId;
    const valueB = cell.dataset.value;
    const valueA = mapA.get(id);
    if (valueA !== valueB) {
      cell.classList.add("ppa-cell--diff");
      const cellA = containerA.querySelector(`[data-trigger-id="${id}"]`);
      if (cellA) cellA.classList.add("ppa-cell--diff");
    }
  });
}
function clearDifferenceHighlights(container) {
  if (!container) return;
  const diffCells = container.querySelectorAll(".ppa-cell--diff");
  diffCells.forEach((cell) => {
    cell.classList.remove("ppa-cell--diff");
  });
}
function animateToastIn(toast) {
  if (!toast) return;
  toast.style.transform = "translateX(100%)";
  toast.style.opacity = "0";
  requestAnimationFrame(() => {
    toast.style.transition = "transform 300ms ease, opacity 300ms ease";
    toast.style.transform = "translateX(0)";
    toast.style.opacity = "1";
  });
}
function animateToastOut(toast) {
  if (!toast) return Promise.resolve();
  return new Promise((resolve) => {
    toast.style.transition = "transform 300ms ease, opacity 300ms ease";
    toast.style.transform = "translateX(100%)";
    toast.style.opacity = "0";
    setTimeout(resolve, 300);
  });
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    queueLength: _animationQueue.length,
    isProcessing: _isProcessing
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      queueReady: Array.isArray(_animationQueue),
      rafSupported: typeof requestAnimationFrame === "function"
    }
  };
}
var effects_default = {
  MODULE_ID,
  VERSION,
  highlightRow,
  highlightCell,
  pulseElement,
  shakeElement,
  bounceElement,
  fadeIn,
  fadeOut,
  slideDown,
  slideUp,
  scrollToElement,
  scrollToTop,
  createRipple,
  showSkeleton,
  hideSkeleton,
  queueAnimation,
  clearAnimationQueue,
  staggerAnimation,
  staggerFadeIn,
  highlightDifferences,
  clearDifferenceHighlights,
  animateToastIn,
  animateToastOut,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  animateToastIn,
  animateToastOut,
  bounceElement,
  clearAnimationQueue,
  clearDifferenceHighlights,
  createRipple,
  effects_default as default,
  fadeIn,
  fadeOut,
  healthCheck,
  hideSkeleton,
  highlightCell,
  highlightDifferences,
  highlightRow,
  info,
  pulseElement,
  queueAnimation,
  scrollToElement,
  scrollToTop,
  shakeElement,
  showSkeleton,
  slideDown,
  slideUp,
  staggerAnimation,
  staggerFadeIn
};
