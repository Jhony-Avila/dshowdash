import { notifications, queue } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.notification-center.queries";
function get(id) {
  return notifications.get(id) || null;
}
function getAll() {
  const list = [];
  notifications.forEach((n) => {
    list.push(n);
  });
  return list;
}
function getByType(type) {
  const list = [];
  notifications.forEach((n) => {
    if (n.type === type) list.push(n);
  });
  return list;
}
function getQueueSize() {
  return queue.length;
}
function getVisibleCount() {
  let count = 0;
  notifications.forEach((n) => {
    if (n._element) count++;
  });
  return count;
}
function findByGroup(group) {
  let found = null;
  notifications.forEach((n) => {
    if (n.group === group) found = n;
  });
  return found;
}
export {
  MODULE_ID,
  VERSION,
  findByGroup,
  get,
  getAll,
  getByType,
  getQueueSize,
  getVisibleCount
};
