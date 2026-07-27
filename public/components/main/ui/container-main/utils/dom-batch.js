const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-dom-batch";
let _readQueue = [];
let _writeQueue = [];
let _isScheduled = false;
let _metrics = { reads: 0, writes: 0, batches: 0 };
function _scheduleFlush() {
  if (_isScheduled) return;
  _isScheduled = true;
  requestAnimationFrame(() => {
    _metrics.batches++;
    const reads = _readQueue;
    _readQueue = [];
    reads.forEach(({ fn, resolve, reject }) => {
      try {
        const result = fn();
        _metrics.reads++;
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
    const writes = _writeQueue;
    _writeQueue = [];
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
    if (_readQueue.length > 0 || _writeQueue.length > 0) {
      _scheduleFlush();
    }
  });
}
function read(fn) {
  return new Promise((resolve, reject) => {
    _readQueue.push({ fn, resolve, reject });
    _scheduleFlush();
  });
}
function write(fn) {
  return new Promise((resolve, reject) => {
    _writeQueue.push({ fn, resolve, reject });
    _scheduleFlush();
  });
}
function readAll(fns) {
  return Promise.all(fns.map((fn) => read(fn)));
}
function writeAll(fns) {
  return Promise.all(fns.map((fn) => write(fn)));
}
function measure(measureFn) {
  return {
    then: (mutateFn) => read(measureFn).then((measurements) => write(() => mutateFn(measurements)))
  };
}
function batchClassChanges(element, changes) {
  return write(() => {
    const { add = [], remove = [], toggle = [] } = changes;
    if (add.length > 0) element.classList.add(...add);
    if (remove.length > 0) element.classList.remove(...remove);
    toggle.forEach(([cls, force]) => element.classList.toggle(cls, force));
  });
}
function batchStyleChanges(element, styles) {
  return write(() => {
    Object.entries(styles).forEach(([prop, value]) => {
      element.style[prop] = value;
    });
  });
}
function batchAttributeChanges(element, attributes) {
  return write(() => {
    Object.entries(attributes).forEach(([attr, value]) => {
      if (value === null || value === void 0) {
        element.removeAttribute(attr);
      } else {
        element.setAttribute(attr, value);
      }
    });
  });
}
function batchInnerHTML(updates) {
  return write(() => {
    updates.forEach(({ element, html }) => {
      element.innerHTML = html;
    });
  });
}
function batchAppendChildren(parent, children) {
  return write(() => {
    const fragment = document.createDocumentFragment();
    children.forEach((child) => fragment.appendChild(child));
    parent.appendChild(fragment);
  });
}
function getMeasurements(element) {
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
function clear() {
  const cleared = _readQueue.length + _writeQueue.length;
  _readQueue = [];
  _writeQueue = [];
  return cleared;
}
function getQueueLengths() {
  return { reads: _readQueue.length, writes: _writeQueue.length };
}
function getMetrics() {
  return { ..._metrics };
}
function resetMetrics() {
  _metrics = { reads: 0, writes: 0, batches: 0 };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, ...getQueueLengths(), ...getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, ...getQueueLengths(), ...getMetrics() };
}
var dom_batch_default = {
  read,
  write,
  readAll,
  writeAll,
  measure,
  batchClassChanges,
  batchStyleChanges,
  batchAttributeChanges,
  batchInnerHTML,
  batchAppendChildren,
  getMeasurements,
  clear,
  getQueueLengths,
  getMetrics,
  resetMetrics,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  batchAppendChildren,
  batchAttributeChanges,
  batchClassChanges,
  batchInnerHTML,
  batchStyleChanges,
  clear,
  dom_batch_default as default,
  getMeasurements,
  getMetrics,
  getQueueLengths,
  healthCheck,
  info,
  measure,
  read,
  readAll,
  resetMetrics,
  write,
  writeAll
};
