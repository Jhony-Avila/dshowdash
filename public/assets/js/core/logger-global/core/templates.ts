

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-templates
// PURPOSE: Logger Global - Log Templates v1.0.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setLoggerRef() — exported function
//   api() — exported function
//   apiStart() — exported function
//   apiError() — exported function
//   componentMount() — exported function
//   componentUnmount() — exported function
//   componentError() — exported function
//   userAction() — exported function
//   userClick() — exported function
//   userInput() — exported function
//   userNavigation() — exported function
//   perf() — exported function
//   perfStart() — exported function
//   authLogin() — exported function
//   authLogout() — exported function
//   authError() — exported function
//   dataFetch() — exported function
//   dataSave() — exported function
//   dataDelete() — exported function
//   dataError() — exported function
//   systemStart() — exported function
//   systemReady() — exported function
//   systemError() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'logger-global-templates';

// Referência ao logger (será injetada)
var _loggerRef: unknown | null = null;

export function setLoggerRef(logger: Record<string, unknown>) {
  _loggerRef = logger;
}

function _log(level: string, message: string, context: Record<string, unknown>) {
  var logger = _loggerRef as Record<string, (...args: unknown[]) => unknown> | null;
  if (logger && typeof logger[level] === 'function') {
    return logger[level](message, context);
  }
  return { ok: false, reason: 'logger-not-available' };
}

// ═══════════════════════════════════════════════════════════════
// API TEMPLATES
// ═══════════════════════════════════════════════════════════════

export function api(method: string, url: string, status: number, duration: number, context: Record<string, unknown> = {}) {
  context = context || {};
  var level = status >= 500 ? 'error' : (status >= 400 ? 'warn' : 'info');
  var message = method.toUpperCase() + ' ' + url + ' → ' + status + ' (' + duration + 'ms)';
  
  return _log(level, message, {
    type: 'api',
    method: method.toUpperCase(),
    url: url,
    status: status,
    duration: duration,
    ...context
  });
}

export function apiStart(method: string, url: string, context: Record<string, unknown>) {
  return _log('debug', 'API Request: ' + method.toUpperCase() + ' ' + url, {
    type: 'api-start',
    method: method.toUpperCase(),
    url: url,
    ...context
  });
}

export function apiError(method: string, url: string, error: Error, context: Record<string, unknown>) {
  var message = 'API Error: ' + method.toUpperCase() + ' ' + url + ' - ' + (error.message || error);
  
  return _log('error', message, {
    type: 'api-error',
    method: method.toUpperCase(),
    url: url,
    error: error.message || String(error),
    ...context
  });
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT TEMPLATES
// ═══════════════════════════════════════════════════════════════

export function componentMount(componentName: string, context: Record<string, unknown>) {
  return _log('info', 'Component mounted: ' + componentName, {
    type: 'component-lifecycle',
    action: 'mount',
    component: componentName,
    ...context
  });
}

export function componentUnmount(componentName: string, context: Record<string, unknown>) {
  return _log('info', 'Component unmounted: ' + componentName, {
    type: 'component-lifecycle',
    action: 'unmount',
    component: componentName,
    ...context
  });
}

export function componentError(componentName: string, error: Error, context: Record<string, unknown>) {
  return _log('error', 'Component error: ' + componentName + ' - ' + (error.message || error), {
    type: 'component-error',
    component: componentName,
    error: error.message || String(error),
    stack: error.stack,
    ...context
  });
}

// ═══════════════════════════════════════════════════════════════
// USER ACTION TEMPLATES
// ═══════════════════════════════════════════════════════════════

export function userAction(action: string, target: string, context: Record<string, unknown>) {
  return _log('info', 'User action: ' + action + ' on ' + target, {
    type: 'user-action',
    action: action,
    target: target,
    ...context
  });
}

export function userClick(element: string, context: Record<string, unknown>) {
  return userAction('click', element, context);
}

export function userInput(field: string, context: Record<string, unknown>) {
  return userAction('input', field, context);
}

export function userNavigation(from: string, to: string, context: Record<string, unknown>) {
  return _log('info', 'Navigation: ' + from + ' → ' + to, {
    type: 'navigation',
    from: from,
    to: to,
    ...context
  });
}

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE TEMPLATES
// ═══════════════════════════════════════════════════════════════

export function perf(operation: string, duration: number, context: Record<string, unknown>) {
  var level = duration > 3000 ? 'warn' : (duration > 1000 ? 'info' : 'debug');
  var message = 'Perf: ' + operation + ' completed in ' + duration + 'ms';
  
  return _log(level, message, {
    type: 'performance',
    operation: operation,
    duration: duration,
    slow: duration > 1000,
    ...context
  });
}

export function perfStart(operation: string) {
  return {
    operation: operation,
    startTime: Date.now(),
    end: function(context: Record<string, unknown>) {
      var duration = Date.now() - this.startTime;
      return perf(operation, duration, context);
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// AUTH TEMPLATES
// ═══════════════════════════════════════════════════════════════

export function authLogin(userId: unknown, context: Record<string, unknown>) {
  return _log('info', 'User logged in: ' + userId, {
    type: 'auth',
    action: 'login',
    userId: userId,
    ...context
  });
}

export function authLogout(userId: unknown, context: Record<string, unknown>) {
  return _log('info', 'User logged out: ' + userId, {
    type: 'auth',
    action: 'logout',
    userId: userId,
    ...context
  });
}

export function authError(action: string, error: Error, context: Record<string, unknown>) {
  return _log('error', 'Auth error during ' + action + ': ' + (error.message || error), {
    type: 'auth-error',
    action: action,
    error: error.message || String(error),
    ...context
  });
}

// ═══════════════════════════════════════════════════════════════
// DATA TEMPLATES
// ═══════════════════════════════════════════════════════════════

export function dataFetch(resource: string, count: number, context: Record<string, unknown>) {
  return _log('info', 'Fetched ' + count + ' ' + resource, {
    type: 'data-fetch',
    resource: resource,
    count: count,
    ...context
  });
}

export function dataSave(resource: string, id: string, context: Record<string, unknown>) {
  return _log('info', 'Saved ' + resource + ': ' + id, {
    type: 'data-save',
    resource: resource,
    id: id,
    ...context
  });
}

export function dataDelete(resource: string, id: string, context: Record<string, unknown>) {
  return _log('info', 'Deleted ' + resource + ': ' + id, {
    type: 'data-delete',
    resource: resource,
    id: id,
    ...context
  });
}

export function dataError(operation: string, resource: string, error: Error, context: Record<string, unknown>) {
  return _log('error', 'Data error: ' + operation + ' ' + resource + ' - ' + (error.message || error), {
    type: 'data-error',
    operation: operation,
    resource: resource,
    error: error.message || String(error),
    ...context
  });
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM TEMPLATES
// ═══════════════════════════════════════════════════════════════

export function systemStart(moduleName: string, version: string, context: Record<string, unknown>) {
  return _log('info', 'System started: ' + moduleName + ' v' + version, {
    type: 'system',
    action: 'start',
    module: moduleName,
    version: version,
    ...context
  });
}

export function systemReady(moduleName: string, context: Record<string, unknown>) {
  return _log('info', 'System ready: ' + moduleName, {
    type: 'system',
    action: 'ready',
    module: moduleName,
    ...context
  });
}

export function systemError(moduleName: string, error: Error, context: Record<string, unknown>) {
  return _log('error', 'System error: ' + moduleName + ' - ' + (error.message || error), {
    type: 'system-error',
    module: moduleName,
    error: error.message || String(error),
    ...context
  });
}

export function healthCheck() {
  return {
    status: _loggerRef ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    loggerAvailable: !!_loggerRef,
    templates: [
      'api', 'apiStart', 'apiError',
      'componentMount', 'componentUnmount', 'componentError',
      'userAction', 'userClick', 'userInput', 'userNavigation',
      'perf', 'perfStart',
      'authLogin', 'authLogout', 'authError',
      'dataFetch', 'dataSave', 'dataDelete', 'dataError',
      'systemStart', 'systemReady', 'systemError'
    ]
  };
}
