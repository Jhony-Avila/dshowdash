import { SEARCH_MODES, MATCH_TYPES } from "../constants.js";
import { getConfig } from "../state.js";
import { _log } from "../helpers/logger.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-search-manager.search.matcher";
function _findMatches(textNodes, query) {
  const config = getConfig();
  const matches = [];
  if (!query || query.length < config.minQueryLength) return matches;
  let pattern;
  try {
    if (config.mode === SEARCH_MODES.REGEX) {
      pattern = new RegExp(query, config.matchType === MATCH_TYPES.EXACT ? "g" : "gi");
    } else {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      let flags = "g";
      if (config.matchType !== MATCH_TYPES.EXACT) flags += "i";
      if (config.matchType === MATCH_TYPES.WORD_BOUNDARY) {
        pattern = new RegExp(`\\b${escapedQuery}\\b`, flags);
      } else {
        pattern = new RegExp(escapedQuery, flags);
      }
    }
  } catch (e) {
    _log("warn", "Invalid regex:", e.message);
    return matches;
  }
  textNodes.forEach((node) => {
    const text = node.textContent;
    let match;
    while ((match = pattern.exec(text)) !== null && matches.length < config.maxResults) {
      matches.push({
        node,
        index: match.index,
        length: match[0].length,
        text: match[0]
      });
    }
  });
  return matches;
}
export {
  MODULE_ID,
  VERSION,
  _findMatches
};
