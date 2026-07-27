// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: executor
// PURPOSE: Command Palette - Command Executor
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, getRecentCommands, setRecentCommands, incrementMetric from ../stat...
//   _log, _emit, _saveState from ../helpers/index.js
//   close from ../api.js
//
// PROVIDES:
//   _executeCommand() — exported function
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

import { getConfig, getRecentCommands, setRecentCommands, incrementMetric } from '../state.js';
import { _log, _emit, _saveState } from '../helpers/index.js';
import { close } from '../api.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.command-palette-manager.commands.executor';

export function _executeCommand(command: string) {
  if (!command) return;
  
  const config = getConfig();
  let recentCommands = getRecentCommands();
  
  // Add to recent
  // @ts-expect-error TS migration - TS2339
  recentCommands = recentCommands.filter(id => id !== command.id);
  // @ts-expect-error TS migration - TS2339
  recentCommands.unshift(command.id);
  recentCommands = recentCommands.slice(0, config.maxRecentCommands);
  setRecentCommands(recentCommands);
  _saveState();
  
  incrementMetric('commandsExecuted');
  _emit('commandExecuted', { command });
  // @ts-expect-error TS migration - TS2339
  _log('info', 'Executing command:', command.title);
  
  // Close palette
  if (config.closeOnSelect) {
    close();
  }
  
  // Execute handler
  // @ts-expect-error TS migration - TS2339
  if (typeof command.handler === 'function') {
    try {
      // @ts-expect-error TS migration - TS2339
      command.handler(command);
    } catch (error: any) {
      incrementMetric('errors');
      _log('error', 'Command execution failed:', error.message);
    }
  }
}
