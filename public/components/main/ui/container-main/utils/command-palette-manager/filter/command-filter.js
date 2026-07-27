import { PALETTE_MODES, COMMAND_TYPES } from "../constants.js";
import { _commands, getConfig, getRecentCommands, setCurrentMode } from "../state.js";
import { _fuzzyMatch, _highlightText } from "../helpers/index.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.command-palette-manager.filter.command-filter";
function _detectMode(query) {
  if (!query) return PALETTE_MODES.COMMANDS;
  if (query.startsWith(">")) return PALETTE_MODES.GOTO;
  if (query.startsWith("@")) return PALETTE_MODES.SETTINGS;
  if (query.startsWith("?")) return PALETTE_MODES.SEARCH;
  return PALETTE_MODES.COMMANDS;
}
function _cleanQuery(query, mode) {
  if (!query) return "";
  if (mode !== PALETTE_MODES.COMMANDS) {
    return query.slice(1).trim();
  }
  return query.trim();
}
function _filterCommands(query) {
  const results = [];
  const mode = _detectMode(query);
  const cleanQuery = _cleanQuery(query, mode);
  const config = getConfig();
  const recentCommands = getRecentCommands();
  setCurrentMode(mode);
  let commandsToSearch = [];
  if (mode === PALETTE_MODES.GOTO) {
    commandsToSearch = Array.from(_commands.values()).filter((c) => c.type === COMMAND_TYPES.NAVIGATION);
  } else if (mode === PALETTE_MODES.SETTINGS) {
    commandsToSearch = Array.from(_commands.values()).filter((c) => c.type === COMMAND_TYPES.SETTING);
  } else {
    commandsToSearch = Array.from(_commands.values());
  }
  if (!cleanQuery && mode === PALETTE_MODES.COMMANDS) {
    recentCommands.forEach((id) => {
      const cmd = _commands.get(id);
      if (cmd) {
        results.push({ ...cmd, isRecent: true, score: 1e3 });
      }
    });
  }
  commandsToSearch.forEach((cmd) => {
    if (results.some((r) => r.id === cmd.id)) return;
    const titleMatch = _fuzzyMatch(cmd.title, cleanQuery);
    const keywordsMatch = cmd.keywords ? cmd.keywords.some((kw) => _fuzzyMatch(kw, cleanQuery).match) : false;
    if (titleMatch.match || keywordsMatch) {
      results.push({
        ...cmd,
        score: titleMatch.score,
        highlightedTitle: _highlightText(cmd.title, titleMatch.indices)
      });
    }
  });
  results.sort((a, b) => (b.score || 0) - (a.score || 0));
  return results.slice(0, config.maxResults);
}
export {
  MODULE_ID,
  VERSION,
  _cleanQuery,
  _detectMode,
  _filterCommands
};
