// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-stack-trace
// PURPOSE: Logger Global - Stack Trace Auto v1.0.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   captureStackTrace() — exported function
//   shouldCaptureForLevel() — exported function
//   enrichWithStackTrace() — exported function
//   initStackTrace() — exported function
//   setStackTraceEnabled() — exported function
//   isStackTraceEnabled() — exported function
//   getStackTraceConfig() — exported function
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
export const MODULE_ID = 'logger-global-stack-trace';

var _config = {
  enabled: true,
  maxFrames: 10,
  captureForLevels: ['error', 'critical', 'panic'],
  filterInternalFrames: true,
  internalPatterns: [
    'logger-global',
    'node_modules',
    'webpack',
    '<anonymous>'
  ]
};

// Captura stack trace atual
export function captureStackTrace(skipFrames: number) {
  skipFrames = skipFrames || 0;
  
  if (!_config.enabled) {
    return null;
  }
  
  try {
    var err = new Error();
    var stack = err.stack || '';
    
    var frames = parseStackTrace(stack);
    
    // Remove frames internos
    frames = frames.slice(skipFrames + 1); // +1 para remover esta função
    
    if (_config.filterInternalFrames) {
      frames = filterInternalFrames(frames);
    }
    
    // Limita quantidade
    frames = frames.slice(0, _config.maxFrames);
    
    return {
      frames: frames,
      raw: frames.map(function(f) { return f.raw; }).join('\n')
    };
  } catch (e) {
    return null;
  }
}

// Parse do stack trace
function parseStackTrace(stack: string) {
  if (!stack) return [];

  var lines = stack.split('\n');
  var frames = [];
  
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line || line.indexOf('Error') === 0) continue;
    
    var frame = parseStackFrame(line);
    if (frame) {
      frames.push(frame);
    }
  }
  
  return frames;
}

// Parse de uma linha do stack
function parseStackFrame(line: string) {
  // Formato Chrome/V8: "at functionName (file:line:col)"
  var chromeMatch = line.match(/at\s+(?:(.+?)\s+)?\(?(.+?):(\d+):(\d+)\)?/);
  if (chromeMatch) {
    return {
      raw: line,
      functionName: chromeMatch[1] || '<anonymous>',
      fileName: chromeMatch[2],
      lineNumber: parseInt(chromeMatch[3], 10),
      columnNumber: parseInt(chromeMatch[4], 10)
    };
  }
  
  // Formato Firefox: "functionName@file:line:col"
  var firefoxMatch = (line as string).match(/(.+?)@(.+?):(\d+):(\d+)/);
  if (firefoxMatch) {
    return {
      raw: line,
      functionName: firefoxMatch[1] || '<anonymous>',
      fileName: firefoxMatch[2],
      lineNumber: parseInt(firefoxMatch[3], 10),
      columnNumber: parseInt(firefoxMatch[4], 10)
    };
  }
  
  return {
    raw: line,
    functionName: '<unknown>',
    fileName: '<unknown>',
    lineNumber: 0,
    columnNumber: 0
  };
}

// Filtra frames internos
function filterInternalFrames(frames: { raw: string; functionName: string; fileName: string; lineNumber: number; columnNumber: number }[]) {
  return frames.filter(function(frame: { raw: string }) {
    var raw = frame.raw.toLowerCase();
    for (var i = 0; i < _config.internalPatterns.length; i++) {
      if (raw.indexOf(_config.internalPatterns[i].toLowerCase()) !== -1) {
        return false;
      }
    }
    return true;
  });
}

// Verifica se deve capturar para este nível
export function shouldCaptureForLevel(level: string) {
  return _config.enabled && _config.captureForLevels.indexOf(level) !== -1;
}

// Enriquece entry com stack trace
export function enrichWithStackTrace(entry: Record<string, unknown>, skipFrames: number) {
  if (!shouldCaptureForLevel(entry.level as string)) {
    return entry;
  }
  
  var stack = captureStackTrace((skipFrames || 0) + 1);
  
  if (stack && stack.frames.length > 0) {
    entry.stackTrace = stack;
    
    // Adiciona primeiro frame como source
    var firstFrame = stack.frames[0];
    if (firstFrame) {
      entry.source = {
        file: firstFrame.fileName,
        line: firstFrame.lineNumber,
        function: firstFrame.functionName
      };
    }
  }
  
  return entry;
}

// Configuração
export function initStackTrace(config: Record<string, unknown>) {
  config = config || {};
  if (config.enabled !== undefined) _config.enabled = config.enabled as boolean;
  if (config.maxFrames) _config.maxFrames = config.maxFrames as number;
  if (Array.isArray(config.captureForLevels)) _config.captureForLevels = config.captureForLevels as string[];
  if (config.filterInternalFrames !== undefined) _config.filterInternalFrames = config.filterInternalFrames as boolean;
  if (Array.isArray(config.internalPatterns)) _config.internalPatterns = config.internalPatterns as string[];
  
  return { ok: true, config: getStackTraceConfig() };
}

export function setStackTraceEnabled(enabled: boolean) {
  _config.enabled = enabled;
}

export function isStackTraceEnabled() {
  return _config.enabled;
}

export function getStackTraceConfig() {
  return {
    enabled: _config.enabled,
    maxFrames: _config.maxFrames,
    captureForLevels: [..._config.captureForLevels],
    filterInternalFrames: _config.filterInternalFrames
  };
}

export function healthCheck() {
  return {
    status: _config.enabled ? 'HEALTHY' : 'DISABLED',
    version: VERSION,
    moduleId: MODULE_ID,
    enabled: _config.enabled,
    captureForLevels: _config.captureForLevels
  };
}
