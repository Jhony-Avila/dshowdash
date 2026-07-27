import { getConfig } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-search-manager.search.content";
function _getSearchableContent(container) {
  const config = getConfig();
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node2) => {
        const parent = node2.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        for (const selector of config.excludeSelectors) {
          if (parent.closest(selector)) return NodeFilter.FILTER_REJECT;
        }
        if (!node2.textContent.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  return textNodes;
}
export {
  MODULE_ID,
  VERSION,
  _getSearchableContent
};
