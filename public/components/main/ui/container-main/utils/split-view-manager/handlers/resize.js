import { SPLIT_ORIENTATIONS } from "../constants.js";
import { getConfig, getContainer, getPrimaryPanel, getGutter, isResizing, setIsResizing, getCurrentRatio, incrementMetric } from "../state.js";
import { _emit } from "../helpers/logger.js";
import { _saveState } from "../helpers/storage.js";
import { _applyRatio } from "../dom/ratio.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.split-view-manager.handlers.resize";
function _setupResizeHandlers() {
  const gutter = getGutter();
  const container = getContainer();
  const config = getConfig();
  let startPos = 0;
  let startSize = 0;
  const onMouseDown = (e) => {
    if (e.target.closest(".dsd-split-view__collapse-btn")) return;
    e.preventDefault();
    setIsResizing(true);
    const wrapper = container.querySelector(".dsd-split-view");
    wrapper.classList.add("dsd-split-view--resizing");
    gutter.classList.add("dsd-split-view__gutter--active");
    const isHorizontal = config.orientation === SPLIT_ORIENTATIONS.HORIZONTAL;
    const primaryPanel = getPrimaryPanel();
    startPos = isHorizontal ? e.clientX : e.clientY;
    startSize = isHorizontal ? primaryPanel.offsetWidth : primaryPanel.offsetHeight;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!isResizing()) return;
    const isHorizontal = config.orientation === SPLIT_ORIENTATIONS.HORIZONTAL;
    const currentPos = isHorizontal ? e.clientX : e.clientY;
    const delta = currentPos - startPos;
    const newSize = startSize + delta;
    const containerSize = isHorizontal ? container.offsetWidth : container.offsetHeight;
    const availableSize = containerSize - config.gutter;
    const newRatio = newSize / availableSize;
    _applyRatio(newRatio);
    _emit("resize", { ratio: getCurrentRatio(), size: newSize });
  };
  const onMouseUp = () => {
    if (!isResizing()) return;
    setIsResizing(false);
    const wrapper = container.querySelector(".dsd-split-view");
    wrapper.classList.remove("dsd-split-view--resizing");
    gutter.classList.remove("dsd-split-view__gutter--active");
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    incrementMetric("resizes");
    _saveState();
    _emit("resizeEnd", { ratio: getCurrentRatio() });
  };
  gutter.addEventListener("mousedown", onMouseDown);
}
export {
  MODULE_ID,
  VERSION,
  _setupResizeHandlers
};
