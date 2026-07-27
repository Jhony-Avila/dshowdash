

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-permissions-admin-ui-effects
// PURPOSE: Panel Permissions Admin - UI Effects
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   highlightRow() — exported function
//   highlightCell() — exported function
//   pulseElement() — exported function
//   shakeElement() — exported function
//   bounceElement() — exported function
//   fadeIn() — exported function
//   fadeOut() — exported function
//   slideDown() — exported function
//   slideUp() — exported function
//   scrollToElement() — exported function
//   scrollToTop() — exported function
//   createRipple() — exported function
//   showSkeleton() — exported function
//   ... and 11 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-permissions-admin-ui-effects';
export const VERSION = '9.3.0-P2-ENTERPRISE';

let _animationQueue: Array<{ fn: () => void; delay: number }> = [];
let _isProcessing = false;
let _rafId: number | null = null;

// ══════════════════════════════════════════════════════════════
// HIGHLIGHT EFFECTS
// ══════════════════════════════════════════════════════════════

export function highlightRow(row: HTMLElement, type = 'success') {
  if (!row) return;
  const className = `ppa-row--highlight-${type}`;
  row.classList.add(className);
  setTimeout(() => { row.classList.remove(className); }, 1500);
}

export function highlightCell(cell: HTMLElement, type = 'changed') {
  if (!cell) return;
  const className = `ppa-cell--highlight-${type}`;
  cell.classList.add(className);
  setTimeout(() => { cell.classList.remove(className); }, 2000);
}

export function pulseElement(el: HTMLElement, duration = 600) {
  if (!el) return;
  el.classList.add('ppa-pulse');
  setTimeout(() => { el.classList.remove('ppa-pulse'); }, duration);
}

export function shakeElement(el: HTMLElement, duration = 400) {
  if (!el) return;
  el.classList.add('ppa-shake');
  setTimeout(() => { el.classList.remove('ppa-shake'); }, duration);
}

export function bounceElement(el: HTMLElement, duration = 500) {
  if (!el) return;
  el.classList.add('ppa-bounce');
  setTimeout(() => { el.classList.remove('ppa-bounce'); }, duration);
}

// ══════════════════════════════════════════════════════════════
// FADE EFFECTS
// ══════════════════════════════════════════════════════════════

export function fadeIn(el: HTMLElement, duration = 300) {
  if (!el) return Promise.resolve();
  return new Promise<void>(resolve => {
    el.style.opacity = '0';
    el.style.display = '';
    el.style.transition = `opacity ${duration}ms ease`;
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      setTimeout(() => {
        el.style.transition = '';
        resolve();
      }, duration);
    });
  });
}

export function fadeOut(el: HTMLElement, duration = 300) {
  if (!el) return Promise.resolve();
  return new Promise<void>(resolve => {
    el.style.transition = `opacity ${duration}ms ease`;
    el.style.opacity = '0';
    setTimeout(() => {
      el.style.display = 'none';
      el.style.transition = '';
      el.style.opacity = '';
      resolve();
    }, duration);
  });
}

// ══════════════════════════════════════════════════════════════
// SLIDE EFFECTS
// ══════════════════════════════════════════════════════════════

export function slideDown(el: HTMLElement, duration = 300) {
  if (!el) return Promise.resolve();
  return new Promise<void>(resolve => {
    el.style.display = '';
    el.style.overflow = 'hidden';
    const height = el.scrollHeight;
    el.style.height = '0px';
    el.style.transition = `height ${duration}ms ease`;
    requestAnimationFrame(() => {
      el.style.height = `${height}px`;
      setTimeout(() => {
        el.style.height = '';
        el.style.overflow = '';
        el.style.transition = '';
        resolve();
      }, duration);
    });
  });
}

export function slideUp(el: HTMLElement, duration = 300) {
  if (!el) return Promise.resolve();
  return new Promise<void>(resolve => {
    el.style.overflow = 'hidden';
    el.style.height = `${el.scrollHeight}px`;
    el.style.transition = `height ${duration}ms ease`;
    requestAnimationFrame(() => {
      el.style.height = '0px';
      setTimeout(() => {
        el.style.display = 'none';
        el.style.height = '';
        el.style.overflow = '';
        el.style.transition = '';
        resolve();
      }, duration);
    });
  });
}

// ══════════════════════════════════════════════════════════════
// SCROLL EFFECTS
// ══════════════════════════════════════════════════════════════

export function scrollToElement(el: HTMLElement, options: Record<string, unknown> = {}) {
  if (!el) return;
  const behavior = (options.behavior as ScrollBehavior) || 'smooth';
  const block = (options.block as ScrollLogicalPosition) || 'center';
  const inline = (options.inline as ScrollLogicalPosition) || 'nearest';
  el.scrollIntoView({ behavior, block, inline });
}

export function scrollToTop(container: HTMLElement, smooth = true) {
  if (!container) return;
  container.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
}

// ══════════════════════════════════════════════════════════════
// RIPPLE EFFECT
// ══════════════════════════════════════════════════════════════

export function createRipple(el: HTMLElement, event: MouseEvent) {
  if (!el || !event) return;
  const rect = el.getBoundingClientRect();
  const ripple = document.createElement('span');
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.className = 'ppa-ripple';
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  
  el.appendChild(ripple);
  setTimeout(() => { ripple.remove(); }, 600);
}

// ══════════════════════════════════════════════════════════════
// SKELETON LOADING
// ══════════════════════════════════════════════════════════════

export function showSkeleton(container: HTMLElement, count = 5) {
  if (!container) return;
  let html = '<div class="ppa-skeleton-wrapper">';
  for (let i = 0; i < count; i++) {
    html += '<div class="ppa-skeleton-row"><div class="ppa-skeleton ppa-skeleton--avatar"></div><div class="ppa-skeleton ppa-skeleton--text" style="width:30%"></div><div class="ppa-skeleton ppa-skeleton--text" style="width:50%"></div><div class="ppa-skeleton ppa-skeleton--text" style="width:20%"></div></div>';
  }
  html += '</div>';
  container.innerHTML = html;
}

export function hideSkeleton(container: HTMLElement) {
  if (!container) return;
  const skeleton = container.querySelector('.ppa-skeleton-wrapper');
  if (skeleton) {
    fadeOut(skeleton as HTMLElement, 200).then(() => { skeleton.remove(); });
  }
}

// ══════════════════════════════════════════════════════════════
// ANIMATION QUEUE
// ══════════════════════════════════════════════════════════════

export function queueAnimation(fn: () => void, delay = 0) {
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
    item!.fn();
    _rafId = requestAnimationFrame(_processQueue);
  }, item!.delay);
}

export function clearAnimationQueue() {
  _animationQueue = [];
  _isProcessing = false;
  if (_rafId) {
    cancelAnimationFrame(_rafId);
    _rafId = null;
  }
}

// ══════════════════════════════════════════════════════════════
// STAGGER ANIMATION
// ══════════════════════════════════════════════════════════════

export function staggerAnimation(elements: ArrayLike<HTMLElement>, className: string, delay = 50) {
  if (!elements || !elements.length) return;
  const arr = Array.from(elements) as HTMLElement[];
  arr.forEach((el, idx) => {
    setTimeout(() => { el.classList.add(className); }, idx * delay);
  });
}

export function staggerFadeIn(elements: ArrayLike<HTMLElement>, delay = 50) {
  if (!elements || !elements.length) return;
  const arr = Array.from(elements) as HTMLElement[];
  arr.forEach((el, idx) => {
    el.style.opacity = '0';
    setTimeout(() => { fadeIn(el, 200); }, idx * delay);
  });
}

// ══════════════════════════════════════════════════════════════
// COMPARE MODE EFFECTS
// ══════════════════════════════════════════════════════════════

export function highlightDifferences(containerA: HTMLElement, containerB: HTMLElement) {
  if (!containerA || !containerB) return;
  const cellsA = containerA.querySelectorAll('[data-trigger-id]');
  const cellsB = containerB.querySelectorAll('[data-trigger-id]');
  
  const mapA = new Map<string | undefined, string | undefined>();
  (cellsA as NodeListOf<HTMLElement>).forEach(cell => { mapA.set(cell.dataset.triggerId, cell.dataset.value); });
  
  (cellsB as NodeListOf<HTMLElement>).forEach(cell => {
    const id = cell.dataset.triggerId;
    const valueB = cell.dataset.value;
    const valueA = mapA.get(id);
    
    if (valueA !== valueB) {
      cell.classList.add('ppa-cell--diff');
      const cellA = containerA.querySelector(`[data-trigger-id="${id}"]`);
      if (cellA) cellA.classList.add('ppa-cell--diff');
    }
  });
}

export function clearDifferenceHighlights(container: HTMLElement) {
  if (!container) return;
  const diffCells = container.querySelectorAll('.ppa-cell--diff');
  (diffCells as NodeListOf<HTMLElement>).forEach(cell => { cell.classList.remove('ppa-cell--diff'); });
}

// ══════════════════════════════════════════════════════════════
// TOAST / NOTIFICATION EFFECTS
// ══════════════════════════════════════════════════════════════

export function animateToastIn(toast: HTMLElement) {
  if (!toast) return;
  toast.style.transform = 'translateX(100%)';
  toast.style.opacity = '0';
  requestAnimationFrame(() => {
    toast.style.transition = 'transform 300ms ease, opacity 300ms ease';
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });
}

export function animateToastOut(toast: HTMLElement) {
  if (!toast) return Promise.resolve();
  return new Promise<void>(resolve => {
    toast.style.transition = 'transform 300ms ease, opacity 300ms ease';
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    setTimeout(resolve, 300);
  });
}

// ══════════════════════════════════════════════════════════════
// INFO / HEALTH
// ══════════════════════════════════════════════════════════════

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    queueLength: _animationQueue.length,
    isProcessing: _isProcessing
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      queueReady: Array.isArray(_animationQueue),
      rafSupported: typeof requestAnimationFrame === 'function'
    }
  };
}

export default {
  MODULE_ID,
  VERSION,
  highlightRow, highlightCell, pulseElement, shakeElement, bounceElement,
  fadeIn, fadeOut,
  slideDown, slideUp,
  scrollToElement, scrollToTop,
  createRipple,
  showSkeleton, hideSkeleton,
  queueAnimation, clearAnimationQueue,
  staggerAnimation, staggerFadeIn,
  highlightDifferences, clearDifferenceHighlights,
  animateToastIn, animateToastOut,
  info, healthCheck
};
