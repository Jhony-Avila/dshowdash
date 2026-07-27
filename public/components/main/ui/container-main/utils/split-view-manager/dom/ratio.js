import { SPLIT_ORIENTATIONS } from "../constants.js";
import { getConfig, getContainer, getPrimaryPanel, getSecondaryPanel, setCurrentRatio } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.split-view-manager.dom.ratio";
function _applyRatio(ratio) {
  const primaryPanel = getPrimaryPanel();
  const secondaryPanel = getSecondaryPanel();
  const container = getContainer();
  const config = getConfig();
  if (!primaryPanel || !secondaryPanel) return;
  const isHorizontal = config.orientation === SPLIT_ORIENTATIONS.HORIZONTAL;
  const containerSize = isHorizontal ? container.offsetWidth : container.offsetHeight;
  const gutterSize = config.gutter;
  const availableSize = containerSize - gutterSize;
  const primarySize = Math.round(availableSize * ratio);
  const minSize = config.minSize;
  const maxSize = config.maxSize || availableSize - minSize;
  const constrainedSize = Math.max(minSize, Math.min(maxSize, primarySize));
  primaryPanel.style.flexBasis = `${constrainedSize}px`;
  setCurrentRatio(constrainedSize / availableSize);
}
export {
  MODULE_ID,
  VERSION,
  _applyRatio
};
