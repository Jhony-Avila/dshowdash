// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-dom-batch
// PURPOSE: Container-Main DOM Batch Updates
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   read() — exported function
//   write() — exported function
//   readAll() — exported function
//   writeAll() — exported function
//   measure() — exported function
//   batchClassChanges() — exported function
//   batchStyleChanges() — exported function
//   batchAttributeChanges() — exported function
//   batchInnerHTML() — exported function
//   batchAppendChildren() — exported function
//   getMeasurements() — exported function
//   clear() — exported function
//   getQueueLengths() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-dom-batch';

let _readQueue: unknown[] = [];
let _writeQueue: unknown[] = [];
let _isScheduled = false;
let _metrics = { reads: 0, writes: 0, batches: 0 };

// Schedule batch processing
function _scheduleFlush() {
  if (_isScheduled) return;
  _isScheduled = true;
  
  requestAnimationFrame(() => {
    _metrics.batches++;
    
    // Process reads first (to avoid forced reflow)
    const reads = _readQueue;
    _readQueue = [];
    // @ts-expect-error strict migration — TS2345
    reads.forEach(({ fn, resolve, reject }) => {
      try {
        const result = fn();
        _metrics.reads++;
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
    
    // Then process writes
    const writes = _writeQueue;
    _writeQueue = [];
    // @ts-expect-error strict migration — TS2345
    writes.forEach(({ fn, resolve, reject }) => {
      try {
        const result = fn();
        _metrics.writes++;
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
    
    _isScheduled = false;
    
    // If more items were added during processing, schedule again
    if (_readQueue.length > 0 || _writeQueue.length > 0) {
      _scheduleFlush();
    }
  });
}

// Queue a DOM read operation
export function read(fn: (...args: unknown[]) => void) {
  return new Promise((resolve, reject) => {
    _readQueue.push({ fn, resolve, reject });
    _scheduleFlush();
  });
}

// Queue a DOM write operation
export function write(fn: (...args: unknown[]) => void) {
  return new Promise((resolve, reject) => {
    _writeQueue.push({ fn, resolve, reject });
    _scheduleFlush();
  });
}

// Queue multiple reads
export function readAll(fns: Array<(...args: unknown[]) => void>) {
  return Promise.all(fns.map((fn: (...args: unknown[]) => void) => read(fn)));
}

// Queue multiple writes
export function writeAll(fns: Array<(...args: unknown[]) => void>) {
  return Promise.all(fns.map((fn: (...args: unknown[]) => void) => write(fn)));
}

// Measure then mutate pattern
export function measure(measureFn: (...args: unknown[]) => unknown) {
  return {
    then: (mutateFn: (...args: unknown[]) => void) => read(measureFn).then((measurements: unknown) => write(() => mutateFn(measurements)))
  };
}

// Batch class changes
export function batchClassChanges(element: HTMLElement, changes: Record<string, unknown>) {
  return write(() => {
    const { add = [], remove = [], toggle = [] } = changes;
    // @ts-expect-error TS migration - TS2488
    if ((add as unknown[]).length > 0) element.classList.add(...add);
    // @ts-expect-error TS migration - TS2488
    if ((remove as unknown[]).length > 0) element.classList.remove(...remove);
    // @ts-expect-error strict migration — TS2345
    (toggle as unknown[]).forEach(([cls, force]: [string, boolean]) => element.classList.toggle(cls, force));
  });
}

// Batch style changes
export function batchStyleChanges(element: HTMLElement, styles: Record<string, unknown>) {
  return write(() => {
    Object.entries(styles).forEach(([prop, value]) => {
      (element.style as unknown as Record<string, unknown>)[prop] = value;
    });
  });
}

// Batch attribute changes
export function batchAttributeChanges(element: HTMLElement, attributes: Record<string, unknown>) {
  return write(() => {
    Object.entries(attributes).forEach(([attr, value]) => {
      if (value === null || value === undefined) {
        element.removeAttribute(attr);
      } else {
        element.setAttribute(attr, (value as string));
      }
    });
  });
}

// Batch innerHTML updates
export function batchInnerHTML(updates: Record<string, unknown>) {
  return write(() => {
    (updates.forEach as (...args: unknown[]) => unknown)(({ element, html }: Record<string, unknown>) => {
      (element as HTMLElement).innerHTML = (html) as string;
    });
  });
}

// Batch appendChild operations
export function batchAppendChildren(parent: HTMLElement, children: Record<string, unknown>) {
  return write(() => {
    const fragment = document.createDocumentFragment();
    // @ts-expect-error TS migration - TS2345
    (children.forEach as (...args: unknown[]) => unknown)((child: unknown) => fragment.appendChild(child));
    parent.appendChild(fragment);
  });
}

// Get element measurements without causing reflow
export function getMeasurements(element: HTMLElement) {
  return read(() => ({
    width: element.offsetWidth,
    height: element.offsetHeight,
    top: element.offsetTop,
    left: element.offsetLeft,
    scrollTop: element.scrollTop,
    scrollLeft: element.scrollLeft,
    scrollWidth: element.scrollWidth,
    scrollHeight: element.scrollHeight,
    clientWidth: element.clientWidth,
    clientHeight: element.clientHeight,
    rect: element.getBoundingClientRect()
  }));
}

// Clear all queued operations
export function clear() {
  const cleared = _readQueue.length + _writeQueue.length;
  _readQueue = [];
  _writeQueue = [];
  return cleared;
}

// Get current queue lengths
export function getQueueLengths() {
  return { reads: _readQueue.length, writes: _writeQueue.length };
}

// Get metrics
export function getMetrics() {
  return { ..._metrics };
}

// Reset metrics
export function resetMetrics() {
  _metrics = { reads: 0, writes: 0, batches: 0 };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, ...getQueueLengths(), ...getMetrics() };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, ...getQueueLengths(), ...getMetrics() };
}

export default {
  read, write, readAll, writeAll, measure,
  batchClassChanges, batchStyleChanges, batchAttributeChanges, batchInnerHTML, batchAppendChildren,
  getMeasurements, clear, getQueueLengths, getMetrics, resetMetrics,
  info, healthCheck, VERSION, MODULE_ID
};
