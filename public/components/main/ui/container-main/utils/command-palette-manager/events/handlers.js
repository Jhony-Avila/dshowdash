import {
  getConfig,
  getPaletteElement,
  getFilteredResults,
  getSelectedIndex,
  setSelectedIndex,
  setFilteredResults,
  getDebounceTimer,
  setDebounceTimer,
  incrementMetric
} from "../state.js";
import { _filterCommands } from "../filter/index.js";
import { _renderResults } from "../ui/renderer.js";
import { _executeCommand } from "../commands/executor.js";
import { close } from "../api.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.command-palette-manager.events.handlers";
function _handleInput(e) {
  const config = getConfig();
  clearTimeout(getDebounceTimer());
  setDebounceTimer(setTimeout(() => {
    const query = e.target.value;
    setFilteredResults(_filterCommands(query));
    setSelectedIndex(0);
    _renderResults();
    incrementMetric("searches");
  }, config.debounceDelay));
}
function _handleKeyDown(e) {
  const config = getConfig();
  const filteredResults = getFilteredResults();
  let selectedIndex = getSelectedIndex();
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredResults.length - 1);
      setSelectedIndex(selectedIndex);
      _renderResults();
      break;
    case "ArrowUp":
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      setSelectedIndex(selectedIndex);
      _renderResults();
      break;
    case "Enter":
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        _executeCommand(filteredResults[selectedIndex]);
      }
      break;
    case "Escape":
      if (config.closeOnEscape) {
        close();
      }
      break;
  }
}
function _handleBackdropClick(e) {
  const config = getConfig();
  const paletteElement = getPaletteElement();
  if (config.closeOnClickOutside && e.target === paletteElement) {
    close();
  }
}
function _handleItemClick(index) {
  const filteredResults = getFilteredResults();
  setSelectedIndex(index);
  _executeCommand(filteredResults[index]);
}
if (typeof window !== "undefined") {
  window._dsdCommandPaletteClick = (index) => _handleItemClick(index);
}
export {
  MODULE_ID,
  VERSION,
  _handleBackdropClick,
  _handleInput,
  _handleItemClick,
  _handleKeyDown
};
