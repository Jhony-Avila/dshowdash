// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: platform-error-boundary
// PURPOSE: Error Boundary Global
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   init
//   capture
//   captureAsync
//   wrapFunction
//   wrapAsync
//   getErrors
//   getLastError
//   clearErrors
//   getErrorCount
//   info
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ERROR_BOUNDARY_EVENTS } from '/core/runtime/events/catalog/error-boundary.events.js';

interface EventBus {
  emit(event: string, data: Record<string, unknown>): void;
}

interface ErrorEntry {
  id: number;
  message: string;
  stack: string | null;
  context: Record<string, unknown>;
  timestamp: number;
  source: string;
}

interface InitContext {
  eventBus?: EventBus | null;
  onError?: ((entry: ErrorEntry) => void) | null;
}

const VERSION = '3.2.0-P2-ENTERPRISE';
const MODULE_ID = 'platform-error-boundary';

const _errors: ErrorEntry[] = [];
const MAX_ERRORS = 100;
let _eventBus: EventBus | null = null;
let _onError: ((entry: ErrorEntry) => void) | null = null;

function init(context: InitContext) {
  if (!context) context = {};
  _eventBus = context.eventBus || null;
  _onError = context.onError || null;
  _emit(ERROR_BOUNDARY_EVENTS.INIT, { version: VERSION });
  return { version: VERSION, moduleId: MODULE_ID };
}

function capture(error: unknown, context: Record<string, unknown>) {
  if (!context) context = {};
  const entry: ErrorEntry = {
    id: _errors.length + 1,
    message: String((error && (error as Record<string, unknown>).message) || error),
    stack: (error && (error as Record<string, unknown>).stack) ? ((error as Record<string, unknown>).stack as string).substring(0, 500) : null,
    context,
    timestamp: Date.now(),
    source: (context.source as string) || 'unknown'
  };
  _errors.push(entry);
  if (_errors.length > MAX_ERRORS) _errors.shift();
  _emit(ERROR_BOUNDARY_EVENTS.CAPTURED, { error: entry.message, source: entry.source });
  if (_onError) { try { _onError(entry); } catch(e) {} }
  return entry;
}

function captureAsync(promise: Promise<unknown>, context: Record<string, unknown>) {
  if (!context) context = {};
  return promise.catch((error: unknown) => {
    capture(error, context);
    throw error;
  });
}

function wrapFunction(fn: (...args: unknown[]) => unknown, context: Record<string, unknown>) {
  if (!context) context = {};
  return function(this: unknown, ...args: unknown[]) {
    try { return fn.apply(this, args); }
    catch (error) { capture(error, context); throw error; }
  };
}

function wrapAsync(fn: (...args: unknown[]) => unknown, context: Record<string, unknown>) {
  if (!context) context = {};
  return function(this: unknown) {
    const args = arguments;
    const self = this;
    return Promise.resolve().then(() => fn.apply(self, args as unknown as unknown[])).catch((error: unknown) => {
      capture(error, context);
      throw error;
    });
  };
}

function getErrors(limit: number) {
  if (!limit) limit = 10;
  return _errors.slice(-limit);
}

function getLastError(): ErrorEntry | null { return _errors[_errors.length - 1] || null; }
function clearErrors() { _errors.length = 0; }
function getErrorCount() { return _errors.length; }

function _emit(event: string, data: Record<string, unknown>) {
  if (!data) data = {};
  if (_eventBus && _eventBus.emit) _eventBus.emit(event, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
}

function info() {
  return { version: VERSION, moduleId: MODULE_ID, errorCount: _errors.length, lastError: getLastError() ? getLastError()!.message : null };
}

export { VERSION, MODULE_ID, init, capture, captureAsync, wrapFunction, wrapAsync, getErrors, getLastError, clearErrors, getErrorCount, info };
export default { VERSION, MODULE_ID, init, capture, captureAsync, wrapFunction, wrapAsync, getErrors, getLastError, clearErrors, getErrorCount, info };
