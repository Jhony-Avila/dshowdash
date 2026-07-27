import { getConfig, getTypeaheadBuffer, setTypeaheadBuffer, appendTypeaheadBuffer, getTypeaheadTimer, setTypeaheadTimer, incrementMetric } from "../state.js";
import { _getItemLabel } from "./dom.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.keyboard-navigation-manager.helpers.typeahead";
function _handleTypeahead(char, items, currentIndex) {
  const config = getConfig();
  clearTimeout(getTypeaheadTimer());
  appendTypeaheadBuffer(char.toLowerCase());
  setTypeaheadTimer(setTimeout(() => {
    setTypeaheadBuffer("");
  }, config.typeaheadTimeout));
  const buffer = getTypeaheadBuffer();
  const startIndex = currentIndex + 1;
  const searchOrder = [
    // @ts-expect-error TS migration - TS2488
    ...items.slice(startIndex),
    // @ts-expect-error TS migration - TS2488
    ...items.slice(0, startIndex)
  ];
  for (let i = 0; i < searchOrder.length; i++) {
    const label = _getItemLabel(searchOrder[i]).toLowerCase();
    if (label.startsWith(buffer)) {
      incrementMetric("typeaheadMatches");
      return items.indexOf(searchOrder[i]);
    }
  }
  return -1;
}
export {
  MODULE_ID,
  VERSION,
  _handleTypeahead
};
