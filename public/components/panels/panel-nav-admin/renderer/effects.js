const MODULE_ID = "panel-nav-admin-renderer-effects";
const VERSION = "9.5.0-P18EC-ENTERPRISE";
let _animationQueue = [];
let _isProcessing = false;
let _rafId = null;
function highlightRow(row, type) {
  if (!row) return;
  type = type || "success";
  var className = "pna-row--highlight-" + type;
  row.classList.add(className);
  setTimeout(function() {
    row.classList.remove(className);
  }, 1500);
}
function highlightCell(cell, type) {
  if (!cell) return;
  type = type || "changed";
  var className = "pna-cell--highlight-" + type;
  cell.classList.add(className);
  setTimeout(function() {
    cell.classList.remove(className);
  }, 2e3);
}
function pulseElement(el, duration) {
  if (!el) return;
  duration = duration || 600;
  el.classList.add("pna-pulse");
  setTimeout(function() {
    el.classList.remove("pna-pulse");
  }, duration);
}
function shakeElement(el, duration) {
  if (!el) return;
  duration = duration || 400;
  el.classList.add("pna-shake");
  setTimeout(function() {
    el.classList.remove("pna-shake");
  }, duration);
}
function bounceElement(el, duration) {
  if (!el) return;
  duration = duration || 500;
  el.classList.add("pna-bounce");
  setTimeout(function() {
    el.classList.remove("pna-bounce");
  }, duration);
}
function flashElement(el, color, duration) {
  if (!el) return;
  color = color || "#4ade80";
  duration = duration || 300;
  var original = el.style.backgroundColor;
  el.style.transition = "background-color " + duration + "ms ease";
  el.style.backgroundColor = color;
  setTimeout(function() {
    el.style.backgroundColor = original;
    setTimeout(function() {
      el.style.transition = "";
    }, duration);
  }, duration);
}
function fadeIn(el, duration) {
  if (!el) return Promise.resolve();
  duration = duration || 300;
  return new Promise(function(resolve) {
    el.style.opacity = "0";
    el.style.display = "";
    el.style.transition = "opacity " + duration + "ms ease";
    requestAnimationFrame(function() {
      el.style.opacity = "1";
      setTimeout(function() {
        el.style.transition = "";
        resolve();
      }, duration);
    });
  });
}
function fadeOut(el, duration) {
  if (!el) return Promise.resolve();
  duration = duration || 300;
  return new Promise(function(resolve) {
    el.style.transition = "opacity " + duration + "ms ease";
    el.style.opacity = "0";
    setTimeout(function() {
      el.style.display = "none";
      el.style.transition = "";
      el.style.opacity = "";
      resolve();
    }, duration);
  });
}
function crossFade(elOut, elIn, duration) {
  if (!elOut && !elIn) return Promise.resolve();
  duration = duration || 300;
  var promises = [];
  if (elOut) promises.push(fadeOut(elOut, duration));
  if (elIn) promises.push(fadeIn(elIn, duration));
  return Promise.all(promises);
}
function slideDown(el, duration) {
  if (!el) return Promise.resolve();
  duration = duration || 300;
  return new Promise(function(resolve) {
    el.style.display = "";
    el.style.overflow = "hidden";
    var height = el.scrollHeight;
    el.style.height = "0px";
    el.style.transition = "height " + duration + "ms ease";
    requestAnimationFrame(function() {
      el.style.height = height + "px";
      setTimeout(function() {
        el.style.height = "";
        el.style.overflow = "";
        el.style.transition = "";
        resolve();
      }, duration);
    });
  });
}
function slideUp(el, duration) {
  if (!el) return Promise.resolve();
  duration = duration || 300;
  return new Promise(function(resolve) {
    el.style.overflow = "hidden";
    el.style.height = el.scrollHeight + "px";
    el.style.transition = "height " + duration + "ms ease";
    requestAnimationFrame(function() {
      el.style.height = "0px";
      setTimeout(function() {
        el.style.display = "none";
        el.style.height = "";
        el.style.overflow = "";
        el.style.transition = "";
        resolve();
      }, duration);
    });
  });
}
function slideToggle(el, duration) {
  if (!el) return Promise.resolve();
  duration = duration || 300;
  var isHidden = el.style.display === "none" || getComputedStyle(el).display === "none";
  return isHidden ? slideDown(el, duration) : slideUp(el, duration);
}
function expandRow(row, content, duration) {
  if (!row) return Promise.resolve();
  duration = duration || 250;
  return new Promise(function(resolve) {
    var existingExpanded = row.nextElementSibling;
    if (existingExpanded && existingExpanded.classList.contains("pna-expanded-row")) {
      existingExpanded.remove();
    }
    var expandedRow = document.createElement("tr");
    expandedRow.className = "pna-expanded-row";
    expandedRow.innerHTML = '<td colspan="100" class="pna-expanded-cell">' + content + "</td>";
    expandedRow.style.height = "0";
    expandedRow.style.overflow = "hidden";
    row.after(expandedRow);
    var cell = expandedRow.querySelector(".pna-expanded-cell");
    var targetHeight = cell.scrollHeight;
    expandedRow.style.transition = "height " + duration + "ms ease";
    requestAnimationFrame(function() {
      expandedRow.style.height = targetHeight + "px";
      setTimeout(function() {
        expandedRow.style.height = "";
        expandedRow.style.overflow = "";
        expandedRow.style.transition = "";
        resolve(expandedRow);
      }, duration);
    });
  });
}
function collapseRow(expandedRow, duration) {
  if (!expandedRow) return Promise.resolve();
  duration = duration || 250;
  return new Promise(function(resolve) {
    expandedRow.style.height = expandedRow.scrollHeight + "px";
    expandedRow.style.overflow = "hidden";
    expandedRow.style.transition = "height " + duration + "ms ease";
    requestAnimationFrame(function() {
      expandedRow.style.height = "0";
      setTimeout(function() {
        expandedRow.remove();
        resolve();
      }, duration);
    });
  });
}
function startDrag(el) {
  if (!el) return;
  el.classList.add("pna-dragging");
  el.style.opacity = "0.7";
  el.style.transform = "scale(1.02)";
}
function endDrag(el) {
  if (!el) return;
  el.classList.remove("pna-dragging");
  el.style.opacity = "";
  el.style.transform = "";
}
function showDropTarget(el) {
  if (!el) return;
  el.classList.add("pna-drop-target");
}
function hideDropTarget(el) {
  if (!el) return;
  el.classList.remove("pna-drop-target");
}
function animateReorder(container, fromIndex, toIndex, duration) {
  if (!container) return Promise.resolve();
  duration = duration || 300;
  var items = Array.from(container.children);
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return Promise.resolve();
  }
  return new Promise(function(resolve) {
    var item = items[fromIndex];
    var rects = items.map(function(i) {
      return i.getBoundingClientRect();
    });
    if (fromIndex < toIndex) {
      container.insertBefore(item, items[toIndex].nextSibling);
    } else {
      container.insertBefore(item, items[toIndex]);
    }
    var newItems = Array.from(container.children);
    newItems.forEach(function(el, idx) {
      var oldRect = rects[items.indexOf(el)] || rects[idx];
      var newRect = el.getBoundingClientRect();
      var deltaY = oldRect.top - newRect.top;
      if (Math.abs(deltaY) > 1) {
        el.style.transform = "translateY(" + deltaY + "px)";
        el.style.transition = "none";
        requestAnimationFrame(function() {
          el.style.transition = "transform " + duration + "ms ease";
          el.style.transform = "";
        });
      }
    });
    setTimeout(resolve, duration);
  });
}
function scrollToElement(el, options = {}) {
  if (!el) return;
  options = options || {};
  var behavior = options.behavior || "smooth";
  var block = options.block || "center";
  var inline = options.inline || "nearest";
  el.scrollIntoView({ behavior, block, inline });
}
function scrollToTop(container, smooth) {
  if (!container) return;
  if (smooth === void 0) smooth = true;
  container.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
}
function createRipple(el, event) {
  if (!el || !event) return;
  var rect = el.getBoundingClientRect();
  var ripple = document.createElement("span");
  var size = Math.max(rect.width, rect.height);
  var x = event.clientX - rect.left - size / 2;
  var y = event.clientY - rect.top - size / 2;
  ripple.className = "pna-ripple";
  ripple.style.width = ripple.style.height = size + "px";
  ripple.style.left = x + "px";
  ripple.style.top = y + "px";
  el.appendChild(ripple);
  setTimeout(function() {
    ripple.remove();
  }, 600);
}
function showSkeleton(container, rows) {
  if (!container) return;
  rows = rows || 5;
  var html = '<div class="pna-skeleton-wrapper">';
  for (var i = 0; i < rows; i++) {
    html += '<div class="pna-skeleton-row"><div class="pna-skeleton pna-skeleton--icon"></div><div class="pna-skeleton pna-skeleton--text" style="width:25%"></div><div class="pna-skeleton pna-skeleton--text" style="width:40%"></div><div class="pna-skeleton pna-skeleton--badge"></div></div>';
  }
  html += "</div>";
  container.innerHTML = html;
}
function hideSkeleton(container) {
  if (!container) return;
  var skeleton = container.querySelector(".pna-skeleton-wrapper");
  if (skeleton) {
    fadeOut(skeleton, 200).then(function() {
      skeleton.remove();
    });
  }
}
function queueAnimation(fn, delay) {
  delay = delay || 0;
  _animationQueue.push({ fn, delay });
  if (!_isProcessing) _processQueue();
}
function _processQueue() {
  if (_animationQueue.length === 0) {
    _isProcessing = false;
    return;
  }
  _isProcessing = true;
  var item = _animationQueue.shift();
  setTimeout(function() {
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
function staggerAnimation(elements, className, delay) {
  if (!elements || !elements.length) return;
  delay = delay || 50;
  var arr = Array.from(elements);
  arr.forEach(function(el, idx) {
    setTimeout(function() {
      el.classList.add(className);
    }, idx * delay);
  });
}
function staggerFadeIn(elements, delay) {
  if (!elements || !elements.length) return;
  delay = delay || 50;
  var arr = Array.from(elements);
  arr.forEach(function(el, idx) {
    el.style.opacity = "0";
    setTimeout(function() {
      fadeIn(el, 200);
    }, idx * delay);
  });
}
function animateToastIn(toast) {
  if (!toast) return;
  toast.style.transform = "translateX(100%)";
  toast.style.opacity = "0";
  requestAnimationFrame(function() {
    toast.style.transition = "transform 300ms ease, opacity 300ms ease";
    toast.style.transform = "translateX(0)";
    toast.style.opacity = "1";
  });
}
function animateToastOut(toast) {
  if (!toast) return Promise.resolve();
  return new Promise(function(resolve) {
    toast.style.transition = "transform 300ms ease, opacity 300ms ease";
    toast.style.transform = "translateX(100%)";
    toast.style.opacity = "0";
    setTimeout(resolve, 300);
  });
}
function animateModalIn(overlay, modal) {
  if (overlay) {
    overlay.style.opacity = "0";
    overlay.style.display = "flex";
    requestAnimationFrame(function() {
      overlay.style.transition = "opacity 200ms ease";
      overlay.style.opacity = "1";
    });
  }
  if (modal) {
    modal.style.transform = "scale(0.9) translateY(-20px)";
    modal.style.opacity = "0";
    requestAnimationFrame(function() {
      modal.style.transition = "transform 250ms ease, opacity 250ms ease";
      modal.style.transform = "scale(1) translateY(0)";
      modal.style.opacity = "1";
    });
  }
}
function animateModalOut(overlay, modal) {
  return new Promise(function(resolve) {
    if (modal) {
      modal.style.transition = "transform 200ms ease, opacity 200ms ease";
      modal.style.transform = "scale(0.9) translateY(-20px)";
      modal.style.opacity = "0";
    }
    if (overlay) {
      overlay.style.transition = "opacity 200ms ease";
      overlay.style.opacity = "0";
    }
    setTimeout(function() {
      if (overlay) overlay.style.display = "none";
      resolve();
    }, 200);
  });
}
function animateCountUp(element, targetValue, duration) {
  if (!element) return;
  duration = duration || 600;
  var start = parseInt(element.textContent, 10) || 0;
  var diff = targetValue - start;
  if (diff === 0) {
    element.textContent = String(targetValue);
    return;
  }
  var startTime = performance.now();
  function step(now) {
    var elapsed = now - startTime;
    var progress = Math.min(elapsed / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = String(Math.round(start + diff * eased));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function animateProgressRing(element, percentage) {
  if (!element) return;
  var radius = parseFloat(element.getAttribute("r") || "40") || 40;
  var circumference = 2 * Math.PI * radius;
  element.style.strokeDasharray = String(circumference);
  element.style.strokeDashoffset = String(circumference - percentage / 100 * circumference);
}
function updateKPITrend(element, current, previous) {
  if (!element) return;
  var diff = current - previous;
  element.classList.remove("pna-kpi-trend--up", "pna-kpi-trend--down", "pna-kpi-trend--neutral");
  if (diff > 0) {
    element.classList.add("pna-kpi-trend--up");
    element.textContent = "+" + diff;
  } else if (diff < 0) {
    element.classList.add("pna-kpi-trend--down");
    element.textContent = "" + diff;
  } else {
    element.classList.add("pna-kpi-trend--neutral");
    element.textContent = "0";
  }
}
function updateKPIStatus(element, value, thresholds) {
  if (!element) return;
  var t = thresholds || { excellent: 90, good: 70, warning: 50 };
  element.classList.remove("pna-kpi--excellent", "pna-kpi--good", "pna-kpi--warning", "pna-kpi--critical");
  if (value >= t.excellent) element.classList.add("pna-kpi--excellent");
  else if (value >= t.good) element.classList.add("pna-kpi--good");
  else if (value >= t.warning) element.classList.add("pna-kpi--warning");
  else element.classList.add("pna-kpi--critical");
}
function updateSyncTime(element) {
  if (!element) return;
  var now = /* @__PURE__ */ new Date();
  element.textContent = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function triggerConfetti(container, options = {}) {
  if (!container) return;
  var opts = typeof options === "number" ? { count: options } : options || {};
  var count = opts.count || 50;
  var colors = opts.colors || ["#4ade80", "#6366f1", "#f59e0b", "#ec4899", "#06b6d4"];
  var wrapper = document.createElement("div");
  wrapper.className = "pna-confetti";
  wrapper.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:999;";
  for (var i = 0; i < count; i++) {
    var piece = document.createElement("div");
    var color = colors[Math.floor(Math.random() * colors.length)];
    var left = Math.random() * 100;
    var delay = Math.random() * 500;
    var size = 4 + Math.random() * 6;
    piece.style.cssText = "position:absolute;top:-10px;left:" + left + "%;width:" + size + "px;height:" + size + "px;background:" + color + ";border-radius:50%;animation:pna-confetti-fall " + (1e3 + Math.random() * 1500) + "ms ease-out " + delay + "ms forwards;";
    wrapper.appendChild(piece);
  }
  var style = document.createElement("style");
  style.textContent = "@keyframes pna-confetti-fall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(" + container.offsetHeight + "px) rotate(" + (360 + Math.random() * 360) + "deg);opacity:0}}";
  wrapper.appendChild(style);
  container.style.position = container.style.position || "relative";
  container.appendChild(wrapper);
  setTimeout(function() {
    wrapper.remove();
  }, 3e3);
}
function attachRippleToButtons(container, selector) {
  if (!container) return;
  selector = selector || ".pna-btn";
  var buttons = container.querySelectorAll(selector);
  buttons.forEach(function(btnEl) {
    const btn = btnEl;
    if (btn.dataset.rippleAttached) return;
    btn.dataset.rippleAttached = "true";
    btn.style.position = btn.style.position || "relative";
    btn.style.overflow = "hidden";
    btn.addEventListener("click", function(e) {
      createRipple(btn, e);
    });
  });
}
function animateHealthGauge(element, percentage, options = {}) {
  if (!element) return;
  options = options || {};
  var duration = options.duration || 1e3;
  var color = percentage >= 80 ? "#4ade80" : percentage >= 60 ? "#fbbf24" : "#f87171";
  element.style.cssText = "width:100%;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;";
  var barEl = element.querySelector(".pna-gauge-bar") || document.createElement("div");
  var bar = barEl;
  bar.className = "pna-gauge-bar";
  bar.style.cssText = "height:100%;width:0%;background:" + color + ";border-radius:4px;transition:width " + duration + "ms ease;";
  if (!bar.parentNode) element.appendChild(bar);
  requestAnimationFrame(function() {
    bar.style.width = percentage + "%";
  });
}
function refreshSyncTimeDisplay(container) {
  if (!container) return;
  var el = container.querySelector("[data-sync-time]") || container.querySelector(".pna-sync-time");
  if (el) updateSyncTime(el);
}
function showToastPremium(message, type, duration) {
  type = type || "info";
  duration = duration || 4e3;
  var colors = { success: "#4ade80", error: "#f87171", warning: "#fbbf24", info: "#60a5fa" };
  var icons = { success: "\u2705", error: "\u274C", warning: "\u26A0\uFE0F", info: "\u2139\uFE0F" };
  var toast = document.createElement("div");
  toast.className = "pna-toast pna-toast--" + type;
  toast.style.cssText = "position:fixed;top:1rem;right:1rem;z-index:10000;padding:0.75rem 1rem;background:#1e1e2e;border:1px solid " + (colors[type] || colors.info) + ";border-radius:0.5rem;color:#fff;font-size:0.875rem;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;gap:0.5rem;max-width:400px;";
  toast.innerHTML = "<span>" + (icons[type] || "") + "</span><span>" + message + "</span>";
  document.body.appendChild(toast);
  animateToastIn(toast);
  setTimeout(function() {
    animateToastOut(toast).then(function() {
      toast.remove();
    });
  }, duration);
}
function renderHeatmap(container, data, options = {}) {
  if (!container) return;
  options = options || {};
  data = data || [];
  var cellSize = options.cellSize || 16;
  var gap = options.gap || 2;
  var colors = options.colors || ["rgba(255,255,255,0.05)", "rgba(74,222,128,0.2)", "rgba(74,222,128,0.4)", "rgba(74,222,128,0.6)", "rgba(74,222,128,0.8)"];
  var maxVal = 0;
  for (var i = 0; i < data.length; i++) {
    if (data[i].value > maxVal) maxVal = data[i].value;
  }
  var html = '<div class="pna-heatmap" style="display:flex;flex-wrap:wrap;gap:' + gap + 'px;">';
  for (var j = 0; j < data.length; j++) {
    var d = data[j];
    var level = maxVal > 0 ? Math.min(Math.floor(d.value / maxVal * (colors.length - 1)), colors.length - 1) : 0;
    html += '<div class="pna-heatmap__cell" title="' + (d.label || "") + ": " + d.value + '" style="width:' + cellSize + "px;height:" + cellSize + "px;background:" + colors[level] + ';border-radius:2px;cursor:pointer;"></div>';
  }
  html += "</div>";
  container.innerHTML = html;
}
function renderRouteTree(container, routes, options = {}) {
  if (!container) return;
  options = options || {};
  routes = routes || [];
  var indent = options.indent || 20;
  var html = '<div class="pna-route-tree">';
  function renderNode(route, depth) {
    var pad = depth * indent;
    html += '<div class="pna-route-node" style="padding-left:' + pad + 'px;padding:0.25rem 0.5rem;display:flex;align-items:center;gap:0.5rem;font-size:0.8rem;border-bottom:1px solid rgba(255,255,255,0.05);">';
    html += '<span style="opacity:0.4;">' + (route.children && route.children.length ? "\u25BC" : "\u2500") + "</span>";
    html += '<code style="color:#6366f1;">' + (route.path || route.route || "/") + "</code>";
    if (route.label) html += '<span style="opacity:0.6;font-size:0.75rem;">' + route.label + "</span>";
    html += "</div>";
    if (route.children) {
      for (var k = 0; k < route.children.length; k++) {
        renderNode(route.children[k], depth + 1);
      }
    }
  }
  for (var i = 0; i < routes.length; i++) {
    renderNode(routes[i], 0);
  }
  html += "</div>";
  container.innerHTML = html;
}
function renderTimeline(container, events, options) {
  if (!container) return;
  options = options || {};
  events = events || [];
  var html = '<div class="pna-timeline" style="display:flex;flex-direction:column;gap:0;padding-left:1rem;">';
  for (var i = 0; i < events.length; i++) {
    var evt = events[i];
    var isLast = i === events.length - 1;
    var color = evt.color || "#6366f1";
    html += '<div class="pna-timeline__item" style="display:flex;gap:0.75rem;position:relative;">';
    html += '<div style="display:flex;flex-direction:column;align-items:center;">';
    html += '<div style="width:10px;height:10px;border-radius:50%;background:' + color + ';z-index:1;flex-shrink:0;"></div>';
    if (!isLast) html += '<div style="width:2px;flex:1;background:rgba(255,255,255,0.1);"></div>';
    html += "</div>";
    html += '<div style="padding-bottom:1rem;flex:1;">';
    html += '<div style="font-size:0.8rem;font-weight:600;">' + (evt.title || "Evento") + "</div>";
    if (evt.time) html += '<div style="font-size:0.7rem;opacity:0.5;">' + evt.time + "</div>";
    if (evt.description) html += '<div style="font-size:0.75rem;opacity:0.7;margin-top:0.25rem;">' + evt.description + "</div>";
    html += "</div></div>";
  }
  html += "</div>";
  container.innerHTML = html;
}
function highlightText(text, term) {
  if (!text) return "";
  if (!term) return text;
  var escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var regex = new RegExp("(" + escaped + ")", "gi");
  return String(text).replace(regex, "<strong>$1</strong>");
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, queueLength: _animationQueue.length, isProcessing: _isProcessing };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { queueReady: Array.isArray(_animationQueue), rafSupported: typeof requestAnimationFrame === "function" } };
}
var effects_default = {
  MODULE_ID,
  VERSION,
  highlightRow,
  highlightCell,
  pulseElement,
  shakeElement,
  bounceElement,
  flashElement,
  fadeIn,
  fadeOut,
  crossFade,
  slideDown,
  slideUp,
  slideToggle,
  expandRow,
  collapseRow,
  startDrag,
  endDrag,
  showDropTarget,
  hideDropTarget,
  animateReorder,
  scrollToElement,
  scrollToTop,
  createRipple,
  showSkeleton,
  hideSkeleton,
  queueAnimation,
  clearAnimationQueue,
  staggerAnimation,
  staggerFadeIn,
  animateToastIn,
  animateToastOut,
  animateModalIn,
  animateModalOut,
  animateCountUp,
  animateProgressRing,
  updateKPITrend,
  updateKPIStatus,
  updateSyncTime,
  triggerConfetti,
  attachRippleToButtons,
  animateHealthGauge,
  refreshSyncTimeDisplay,
  showToastPremium,
  renderHeatmap,
  renderRouteTree,
  renderTimeline,
  highlightText,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  animateCountUp,
  animateHealthGauge,
  animateModalIn,
  animateModalOut,
  animateProgressRing,
  animateReorder,
  animateToastIn,
  animateToastOut,
  attachRippleToButtons,
  bounceElement,
  clearAnimationQueue,
  collapseRow,
  createRipple,
  crossFade,
  effects_default as default,
  endDrag,
  expandRow,
  fadeIn,
  fadeOut,
  flashElement,
  healthCheck,
  hideDropTarget,
  hideSkeleton,
  highlightCell,
  highlightRow,
  highlightText,
  info,
  pulseElement,
  queueAnimation,
  refreshSyncTimeDisplay,
  renderHeatmap,
  renderRouteTree,
  renderTimeline,
  scrollToElement,
  scrollToTop,
  shakeElement,
  showDropTarget,
  showSkeleton,
  showToastPremium,
  slideDown,
  slideToggle,
  slideUp,
  staggerAnimation,
  staggerFadeIn,
  startDrag,
  triggerConfetti,
  updateKPIStatus,
  updateKPITrend,
  updateSyncTime
};
