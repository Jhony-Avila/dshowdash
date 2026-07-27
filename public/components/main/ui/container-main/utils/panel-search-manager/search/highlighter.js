import { getConfig, getMatches, getCurrentMatchIndex, getHighlightedElements, setHighlightedElements, getOriginalContents } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-search-manager.search.highlighter";
function _highlightMatches() {
  _clearHighlights();
  const matches = getMatches();
  const currentMatchIndex = getCurrentMatchIndex();
  const originalContents = getOriginalContents();
  if (matches.length === 0) return;
  const nodeMatches = /* @__PURE__ */ new Map();
  matches.forEach((match, idx) => {
    if (!nodeMatches.has(match.node)) {
      nodeMatches.set(match.node, []);
    }
    nodeMatches.get(match.node).push({ ...match, globalIndex: idx });
  });
  const highlightedElements = [];
  nodeMatches.forEach((matchList, node) => {
    originalContents.set(node, node.textContent);
    matchList.sort((a, b) => b.index - a.index);
    const wrapper = document.createElement("span");
    wrapper.className = "dsd-search-wrapper";
    let html = node.textContent;
    matchList.forEach((match) => {
      const before = html.slice(0, match.index);
      const matchText = html.slice(match.index, match.index + match.length);
      const after = html.slice(match.index + match.length);
      const isActive = match.globalIndex === currentMatchIndex;
      const className = isActive ? "dsd-search-highlight dsd-search-highlight--active" : "dsd-search-highlight";
      html = `${before}<mark class="${className}" data-match-index="${match.globalIndex}">${matchText}</mark>${after}`;
    });
    wrapper.innerHTML = html;
    node.parentNode.replaceChild(wrapper, node);
    highlightedElements.push({ wrapper, originalNode: node });
  });
  setHighlightedElements(highlightedElements);
}
function _clearHighlights() {
  const highlightedElements = getHighlightedElements();
  const originalContents = getOriginalContents();
  highlightedElements.forEach(({ wrapper, originalNode }) => {
    if (wrapper.parentNode) {
      const textNode = document.createTextNode(originalContents.get(originalNode) || "");
      wrapper.parentNode.replaceChild(textNode, wrapper);
    }
  });
  setHighlightedElements([]);
  originalContents.clear();
}
function _updateActiveHighlight() {
  const config = getConfig();
  const currentMatchIndex = getCurrentMatchIndex();
  document.querySelectorAll(".dsd-search-highlight--active").forEach((el) => {
    el.classList.remove("dsd-search-highlight--active");
  });
  const activeEl = document.querySelector(`[data-match-index="${currentMatchIndex}"]`);
  if (activeEl) {
    activeEl.classList.add("dsd-search-highlight--active");
    activeEl.scrollIntoView({ behavior: config.scrollBehavior, block: "center" });
  }
}
export {
  MODULE_ID,
  VERSION,
  _clearHighlights,
  _highlightMatches,
  _updateActiveHighlight
};
