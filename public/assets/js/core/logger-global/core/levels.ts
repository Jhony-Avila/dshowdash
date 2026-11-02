// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-levels
// PURPOSE: Logger Global - Levels v3.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LEVELS — exported value
//   LEVEL_NAMES — exported value
//   LEVEL_COLORS — exported value
//   LEVEL_ICONS — exported value
//   getVersion() — exported function
//   isLevelEnabled() — exported function
//   isValidLevel() — exported function
//   getHigherLevel() — exported function
//   getAllLevels() — exported function
//   getLevelMeta() — exported function
//   info() — exported function
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

export var VERSION = '3.1.0-ENTERPRISE';
export var MODULE_ID = 'logger-global-levels';

export function getVersion() { return VERSION; }

export var LEVELS = Object.freeze({ trace: 10, debug: 20, info: 30, warn: 40, error: 50, critical: 60 });
export var LEVEL_NAMES = Object.freeze({ 10: 'trace', 20: 'debug', 30: 'info', 40: 'warn', 50: 'error', 60: 'critical' });
export var LEVEL_COLORS = Object.freeze({ trace: '#9E9E9E', debug: '#2196F3', info: '#4CAF50', warn: '#FF9800', error: '#F44336', critical: '#9C27B0' });
export var LEVEL_ICONS = Object.freeze({ trace: '🔍', debug: '🐛', info: 'ℹ️', warn: '⚠️', error: '❌', critical: '🔥' });

export function isLevelEnabled(levelName: string, minLevelName: string) { var levelValue = LEVELS[levelName as keyof typeof LEVELS] || LEVELS.info; var minLevelValue = LEVELS[minLevelName as keyof typeof LEVELS] || LEVELS.info; return levelValue >= minLevelValue; }
export function isValidLevel(levelName: string) { return levelName in LEVELS; }

export function getHigherLevel(levelName: string) {
  var currentValue = LEVELS[levelName as keyof typeof LEVELS];
  if (!currentValue) return null;
  var keys = Object.keys(LEVELS);
  var higherValue = null;
  for (var i = 0; i < keys.length; i++) {
    // @ts-expect-error strict migration — TS7053
    var val = LEVELS[keys[i]];
    if (val > currentValue) { if (higherValue === null || val < higherValue) higherValue = val; }
  }
  // @ts-expect-error strict migration — TS7053
  return higherValue ? LEVEL_NAMES[higherValue] : null;
}

export function getAllLevels() {
  var keys = Object.keys(LEVELS);
  // @ts-expect-error strict migration — TS7053
  keys.sort(function(a, b) { return LEVELS[a] - LEVELS[b]; });
  return keys;
}

export function getLevelMeta(levelName: string) {
  if (!isValidLevel(levelName)) return null;
  return { name: levelName, value: LEVELS[levelName as keyof typeof LEVELS], color: LEVEL_COLORS[levelName as keyof typeof LEVEL_COLORS], icon: LEVEL_ICONS[levelName as keyof typeof LEVEL_ICONS] };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, levelsCount: Object.keys(LEVELS).length }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { levelsReady: Object.keys(LEVELS).length > 0, isValidLevelReady: typeof isValidLevel === 'function' } }; }
