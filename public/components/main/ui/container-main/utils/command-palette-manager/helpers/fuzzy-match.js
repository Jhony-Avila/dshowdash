import { getConfig } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.command-palette-manager.helpers.fuzzy-match";
function _fuzzyMatch(text, query) {
  if (!query) return { match: true, score: 0, indices: [] };
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  const config = getConfig();
  if (textLower.includes(queryLower)) {
    const index = textLower.indexOf(queryLower);
    const indices2 = [];
    for (let i = index; i < index + query.length; i++) indices2.push(i);
    return { match: true, score: 100 - index, indices: indices2 };
  }
  if (!config.fuzzySearch) return { match: false, score: 0, indices: [] };
  let queryIndex = 0;
  const indices = [];
  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      indices.push(i);
      queryIndex++;
    }
  }
  if (queryIndex === query.length) {
    const score = query.length / text.length * 50 - (indices[indices.length - 1] - indices[0]);
    return { match: true, score, indices };
  }
  return { match: false, score: 0, indices: [] };
}
function _highlightText(text, indices) {
  const config = getConfig();
  if (!config.highlightMatches || indices.length === 0) return text;
  let result = "";
  let lastIndex = 0;
  indices.forEach((i) => {
    result += text.slice(lastIndex, i);
    result += `<mark class="dsd-cp-highlight">${text[i]}</mark>`;
    lastIndex = i + 1;
  });
  result += text.slice(lastIndex);
  return result;
}
export {
  MODULE_ID,
  VERSION,
  _fuzzyMatch,
  _highlightText
};
