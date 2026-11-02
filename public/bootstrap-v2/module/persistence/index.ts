// Boot Persistence - Barrel Export
// DEPENDENCY CONTRACT (1.0.0-PERSISTENCE) — BARREL FILE
// @version 1.0.0-PERSISTENCE
'use strict';

export {
  VERSION,
  MODULE_ID,
  saveCurrentBoot,
  getCurrentBoot,
  getLastSuccessfulBoot,
  hasRecentValidBoot,
  clearCurrentBoot,
  addToHistory,
  getHistory,
  clearHistory,
  analyzeHistory,
  configure,
  getConfig,
  info,
  healthCheck
} from './boot-persistence.js';

export { default } from './boot-persistence.js';
