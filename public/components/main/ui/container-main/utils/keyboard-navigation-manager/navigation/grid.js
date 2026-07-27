import { FOCUS_WRAP } from "../constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.keyboard-navigation-manager.navigation.grid";
function _navigateGrid(items, currentIndex, direction, columns, wrap) {
  const rows = Math.ceil(items.length / columns);
  const currentRow = Math.floor(currentIndex / columns);
  const currentCol = currentIndex % columns;
  let newRow = currentRow;
  let newCol = currentCol;
  switch (direction) {
    case "up":
      newRow = currentRow - 1;
      break;
    case "down":
      newRow = currentRow + 1;
      break;
    case "left":
      newCol = currentCol - 1;
      break;
    case "right":
      newCol = currentCol + 1;
      break;
  }
  if (wrap === FOCUS_WRAP.WRAP) {
    if (newRow < 0) newRow = rows - 1;
    else if (newRow >= rows) newRow = 0;
    if (newCol < 0) newCol = columns - 1;
    else if (newCol >= columns) newCol = 0;
  } else {
    newRow = Math.max(0, Math.min(rows - 1, newRow));
    newCol = Math.max(0, Math.min(columns - 1, newCol));
  }
  const newIndex = newRow * columns + newCol;
  return Math.min(newIndex, items.length - 1);
}
export {
  MODULE_ID,
  VERSION,
  _navigateGrid
};
