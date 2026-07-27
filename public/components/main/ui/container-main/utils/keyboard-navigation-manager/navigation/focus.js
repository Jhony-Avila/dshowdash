import { getNavigationGroups } from "../state.js";
import { _navigateLinear } from "./linear.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.keyboard-navigation-manager.navigation.focus";
function focusFirst(groupId) {
  const group = getNavigationGroups().get(groupId);
  if (!group) return false;
  const items = group.getItems();
  if (items.length > 0) {
    items[0].focus();
    return true;
  }
  return false;
}
function focusLast(groupId) {
  const group = getNavigationGroups().get(groupId);
  if (!group) return false;
  const items = group.getItems();
  if (items.length > 0) {
    items[items.length - 1].focus();
    return true;
  }
  return false;
}
function focusNext(groupId) {
  const group = getNavigationGroups().get(groupId);
  if (!group) return false;
  const items = group.getItems();
  const currentIndex = group.getCurrentIndex();
  const newIndex = _navigateLinear(items, currentIndex, 1, group.config.wrapBehavior);
  if (items[newIndex]) {
    items[newIndex].focus();
    return true;
  }
  return false;
}
function focusPrevious(groupId) {
  const group = getNavigationGroups().get(groupId);
  if (!group) return false;
  const items = group.getItems();
  const currentIndex = group.getCurrentIndex();
  const newIndex = _navigateLinear(items, currentIndex, -1, group.config.wrapBehavior);
  if (items[newIndex]) {
    items[newIndex].focus();
    return true;
  }
  return false;
}
function focusByIndex(groupId, index) {
  const group = getNavigationGroups().get(groupId);
  if (!group) return false;
  const items = group.getItems();
  if (index >= 0 && index < items.length) {
    items[index].focus();
    return true;
  }
  return false;
}
export {
  MODULE_ID,
  VERSION,
  focusByIndex,
  focusFirst,
  focusLast,
  focusNext,
  focusPrevious
};
