// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: command-filter
// PURPOSE: Command Palette - Command Filter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PALETTE_MODES, COMMAND_TYPES from ../constants.js
//   _commands, getConfig, getRecentCommands, setCurrentMode from ../state.js
//   _fuzzyMatch, _highlightText from ../helpers/index.js
//
// PROVIDES:
//   _detectMode() — exported function
//   _cleanQuery() — exported function
//   _filterCommands() — exported function
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

import { PALETTE_MODES, COMMAND_TYPES } from '../constants.js';
import { _commands, getConfig, getRecentCommands, setCurrentMode } from '../state.js';
import { _fuzzyMatch, _highlightText } from '../helpers/index.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.command-palette-manager.filter.command-filter';

export function _detectMode(query: string) {
  if (!query) return PALETTE_MODES.COMMANDS;
  if (query.startsWith('>')) return PALETTE_MODES.GOTO;
  if (query.startsWith('@')) return PALETTE_MODES.SETTINGS;
  if (query.startsWith('?')) return PALETTE_MODES.SEARCH;
  return PALETTE_MODES.COMMANDS;
}

export function _cleanQuery(query: string, mode: string) {
  if (!query) return '';
  if (mode !== PALETTE_MODES.COMMANDS) {
    return query.slice(1).trim();
  }
  return query.trim();
}

export function _filterCommands(query: string) {
  const results: unknown[] = [];
  const mode = _detectMode(query);
  const cleanQuery = _cleanQuery(query, mode);
  const config = getConfig();
  const recentCommands = getRecentCommands();
  
  setCurrentMode(mode);
  
  // Get commands based on mode
  let commandsToSearch = [];
  
  if (mode === PALETTE_MODES.GOTO) {
    commandsToSearch = Array.from(_commands.values()).filter(c => c.type === COMMAND_TYPES.NAVIGATION);
  } else if (mode === PALETTE_MODES.SETTINGS) {
    commandsToSearch = Array.from(_commands.values()).filter(c => c.type === COMMAND_TYPES.SETTING);
  } else {
    commandsToSearch = Array.from(_commands.values());
  }
  
  // Add recent commands at top if no query
  if (!cleanQuery && mode === PALETTE_MODES.COMMANDS) {
    recentCommands.forEach(id => {
      const cmd = _commands.get(id);
      if (cmd) {
        results.push({ ...cmd, isRecent: true, score: 1000 });
      }
    });
  }
  
  // Filter by query
  commandsToSearch.forEach(cmd => {
    if (results.some(r => (r as Record<string, unknown>).id === cmd.id)) return; // Skip if already in recent
    
    const titleMatch = _fuzzyMatch(cmd.title, cleanQuery);
    const keywordsMatch = cmd.keywords ? 
      cmd.keywords.some((kw: unknown) => _fuzzyMatch((kw as string), cleanQuery).match) : false;
    
    if (titleMatch.match || keywordsMatch) {
      results.push({
        ...cmd,
        score: titleMatch.score,
        highlightedTitle: _highlightText(cmd.title, titleMatch.indices)
      });
    }
  });
  
  // Sort by score
  // @ts-expect-error TS migration - TS2362, TS2363
  results.sort((a, b) => ((b as Record<string, unknown>).score || 0) - ((a as Record<string, unknown>).score || 0));
  
  return results.slice(0, config.maxResults);
}
