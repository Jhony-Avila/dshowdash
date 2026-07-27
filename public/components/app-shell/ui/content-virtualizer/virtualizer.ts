// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: virtualizer
// PURPOSE: Module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SCROLL_DIRECTION from ./index.js
//
// PROVIDES:
//   Virtualizer() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'scroll'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Content Virtualizer — Virtualizer Class
 * @module app-shell/ui/content-virtualizer/virtualizer
 * @version 1.1.0-AAA
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.content-virtualizer.virtualizer';

import { SCROLL_DIRECTION } from './index.js';


// ── Constructor ─────────────────────────────────────────────────────

export function Virtualizer(this: any, container: HTMLElement, options: DynObj, metrics: DynObj) {
  this._metrics = metrics;
  this.container = typeof container === 'string' ? document.querySelector(container) : container;

  if (!this.container) {
    throw new Error('Container not found');
  }

  this.itemHeight = options.itemHeight || 50;
  this.itemWidth = options.itemWidth || null;
  this.overscan = options.overscan || 3;
  this.direction = options.direction || SCROLL_DIRECTION.VERTICAL;
  this.renderItem = options.renderItem;
  this.getItemKey = options.getItemKey || ((item: DynObj, index: number) => index);
  this.onRangeChange = options.onRangeChange || null;

  this.items = [];
  this.scrollTop = 0;
  this.scrollLeft = 0;
  this.visibleStart = 0;
  this.visibleEnd = 0;
  this.renderedItems = new Map();
  this.pool = [];

  this.viewport = null;
  this.content = null;
  this.spacerBefore = null;
  this.spacerAfter = null;

  this._onScroll = this._onScroll.bind(this);
  this._onResize = this._onResize.bind(this);

  this._init();
  this._metrics.instancesCreated++;
}

// ── Init ────────────────────────────────────────────────────────────

Virtualizer.prototype._init = function() {
  this.container.style.position = 'relative';
  this.container.style.overflow = 'auto';

  this.viewport = document.createElement('div');
  this.viewport.className = 'virtualizer-viewport';
  this.viewport.style.cssText = 'position: relative; width: 100%; height: 100%;';

  this.content = document.createElement('div');
  this.content.className = 'virtualizer-content';
  this.content.style.cssText = 'position: relative;';

  this.spacerBefore = document.createElement('div');
  this.spacerBefore.className = 'virtualizer-spacer-before';
  this.spacerBefore.style.cssText = 'height: 0; pointer-events: none;';

  this.spacerAfter = document.createElement('div');
  this.spacerAfter.className = 'virtualizer-spacer-after';
  this.spacerAfter.style.cssText = 'height: 0; pointer-events: none;';

  this.viewport.appendChild(this.spacerBefore);
  this.viewport.appendChild(this.content);
  this.viewport.appendChild(this.spacerAfter);
  this.container.appendChild(this.viewport);

  this.container.addEventListener('scroll', this._onScroll, { passive: true });

  if (typeof ResizeObserver !== 'undefined') {
    this._resizeObserver = new ResizeObserver(this._onResize);
    this._resizeObserver.observe(this.container);
  }
};

// ── Scroll & Resize ─────────────────────────────────────────────────

Virtualizer.prototype._onScroll = function() {
  if (this.direction === SCROLL_DIRECTION.VERTICAL) {
    this.scrollTop = this.container.scrollTop;
  } else {
    this.scrollLeft = this.container.scrollLeft;
  }
  this._updateVisibleRange();
};

Virtualizer.prototype._onResize = function() {
  this._updateVisibleRange();
};

// ── Visible Range ───────────────────────────────────────────────────

Virtualizer.prototype._updateVisibleRange = function() {
  const isVertical = this.direction === SCROLL_DIRECTION.VERTICAL;
  const containerSize = isVertical ? this.container.clientHeight : this.container.clientWidth;
  const scrollPos = isVertical ? this.scrollTop : this.scrollLeft;
  const itemSize = isVertical ? this.itemHeight : this.itemWidth;
  const totalItems = this.items.length;

  let startIndex = Math.floor(scrollPos / itemSize);
  let endIndex = Math.min(Math.ceil((scrollPos + containerSize) / itemSize), totalItems);

  startIndex = Math.max(0, startIndex - this.overscan);
  endIndex = Math.min(totalItems, endIndex + this.overscan);

  if (startIndex !== this.visibleStart || endIndex !== this.visibleEnd) {
    this.visibleStart = startIndex;
    this.visibleEnd = endIndex;
    this._render();
    if (this.onRangeChange) {
      this.onRangeChange({ start: startIndex, end: endIndex });
    }
  }

  const beforeSize = startIndex * itemSize;
  const afterSize = Math.max(0, (totalItems - endIndex) * itemSize);

  if (isVertical) {
    this.spacerBefore.style.height = `${beforeSize}px`;
    this.spacerAfter.style.height = `${afterSize}px`;
  } else {
    this.spacerBefore.style.width = `${beforeSize}px`;
    this.spacerAfter.style.width = `${afterSize}px`;
  }
};

// ── Render ──────────────────────────────────────────────────────────

Virtualizer.prototype._render = function(this: any) {
  if (!this.renderItem) return;

  const isVertical = this.direction === SCROLL_DIRECTION.VERTICAL;
  const newRendered = new Map();
  const fragment = document.createDocumentFragment();

  for (let i = this.visibleStart; i < this.visibleEnd; i++) {
    const item = this.items[i];
    const key = this.getItemKey(item, i);

    let element;
    if (this.renderedItems.has(key)) {
      element = this.renderedItems.get(key);
      this.renderedItems.delete(key);
    } else if (this.pool.length > 0) {
      element = this.pool.pop();
      this._metrics.recycledItems++;
    } else {
      element = document.createElement('div');
      element.className = 'virtualizer-item';
      element.style.cssText = isVertical
        ? `position: absolute; left: 0; right: 0; height: ${this.itemHeight}px;`
        : `position: absolute; top: 0; bottom: 0; width: ${this.itemWidth}px; display: inline-block;`;
    }

    const position = i * (isVertical ? this.itemHeight : this.itemWidth);
    if (isVertical) {
      element.style.top = `${position}px`;
    } else {
      element.style.left = `${position}px`;
    }

    const content = this.renderItem(item, i, element);
    if (content !== undefined) {
      if (typeof content === 'string') {
        element.innerHTML = content;
      } else if (content instanceof Node) {
        element.innerHTML = '';
        element.appendChild(content);
      }
    }

    element.setAttribute('data-index', i);
    element.setAttribute('data-key', key);
    newRendered.set(key, element);

    if (!element.parentNode) {
      fragment.appendChild(element);
      this._metrics.itemsRendered++;
    }
  }

  this.renderedItems.forEach(function(el: HTMLElement) {
    if (el.parentNode) el.parentNode.removeChild(el);
    // @ts-expect-error strict migration — TS2683
    this.pool.push(el);
  }, this);

  while (this.pool.length > 50) {
    this.pool.shift();
  }

  this.renderedItems = newRendered;
  this.content.appendChild(fragment);
};

// ── Public Methods ──────────────────────────────────────────────────

Virtualizer.prototype.setItems = function(items: DynObj) {
  this.items = items || [];
  const isVertical = this.direction === SCROLL_DIRECTION.VERTICAL;
  const itemSize = isVertical ? this.itemHeight : this.itemWidth;
  const totalSize = this.items.length * itemSize;

  if (isVertical) {
    this.content.style.height = `${totalSize}px`;
  } else {
    this.content.style.width = `${totalSize}px`;
  }

  this._updateVisibleRange();
};

Virtualizer.prototype.scrollToIndex = function(index: number, align: DynObj) {
  align = align || 'start';
  const isVertical = this.direction === SCROLL_DIRECTION.VERTICAL;
  const itemSize = isVertical ? this.itemHeight : this.itemWidth;
  const containerSize = isVertical ? this.container.clientHeight : this.container.clientWidth;

  let position = index * itemSize;
  if (align === 'center') {
    position = position - (containerSize / 2) + (itemSize / 2);
  } else if (align === 'end') {
    position = position - containerSize + itemSize;
  }
  position = Math.max(0, position);

  if (isVertical) {
    this.container.scrollTop = position;
  } else {
    this.container.scrollLeft = position;
  }
};

Virtualizer.prototype.scrollToItem = function(predicate: DynObj, align: DynObj) {
  for (let i = 0; i < this.items.length; i++) {
    if (predicate(this.items[i], i)) {
      this.scrollToIndex(i, align);
      return true;
    }
  }
  return false;
};

Virtualizer.prototype.getVisibleRange = function() {
  return { start: this.visibleStart, end: this.visibleEnd };
};

Virtualizer.prototype.getVisibleItems = function() {
  return this.items.slice(this.visibleStart, this.visibleEnd);
};

Virtualizer.prototype.refresh = function() {
  this._updateVisibleRange();
};

Virtualizer.prototype.destroy = function() {
  this.container.removeEventListener('scroll', this._onScroll);
  if (this._resizeObserver) this._resizeObserver.disconnect();
  if (this.viewport && this.viewport.parentNode) {
    this.viewport.parentNode.removeChild(this.viewport);
  }
  this.items = [];
  this.renderedItems.clear();
  this.pool = [];
};
