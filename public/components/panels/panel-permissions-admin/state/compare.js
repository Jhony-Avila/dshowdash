import { _getState, notify, getUserPermissions } from "./core.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-admin-compare";
let _compareMode = false;
let _compareUserA = null;
let _compareUserB = null;
function isCompareMode() {
  return _compareMode;
}
function getCompareUserA() {
  return _compareUserA;
}
function getCompareUserB() {
  return _compareUserB;
}
function setCompareMode(enabled) {
  _compareMode = !!enabled;
  if (!enabled) {
    _compareUserA = null;
    _compareUserB = null;
  }
  notify("compare");
}
function setCompareUsers(userIdA, userIdB) {
  _compareUserA = userIdA;
  _compareUserB = userIdB;
  _compareMode = !!(userIdA && userIdB);
  notify("compare");
}
function toggleCompareUser(userId) {
  if (!_compareUserA) {
    _compareUserA = userId;
  } else if (_compareUserA === userId) {
    _compareUserA = _compareUserB;
    _compareUserB = null;
  } else if (!_compareUserB) {
    _compareUserB = userId;
    _compareMode = true;
  } else if (_compareUserB === userId) {
    _compareUserB = null;
    _compareMode = false;
  }
  notify("compare");
}
function getCompareData() {
  if (!_compareMode || !_compareUserA || !_compareUserB) return null;
  const state = _getState();
  const permsA = getUserPermissions(_compareUserA);
  const permsB = getUserPermissions(_compareUserB);
  let userA = null;
  let userB = null;
  for (let i = 0; i < state.users.length; i++) {
    if (String(state.users[i].id) === String(_compareUserA)) userA = state.users[i];
    if (String(state.users[i].id) === String(_compareUserB)) userB = state.users[i];
  }
  const triggersA = {};
  permsA.triggers.forEach((t) => {
    triggersA[t] = true;
  });
  const triggersB = {};
  permsB.triggers.forEach((t) => {
    triggersB[t] = true;
  });
  const onlyA = [];
  const onlyB = [];
  const both = [];
  const neither = [];
  permsA.triggers.forEach((t) => {
    if (!triggersB[t]) onlyA.push(t);
    else both.push(t);
  });
  permsB.triggers.forEach((t) => {
    if (!triggersA[t]) onlyB.push(t);
  });
  state.triggers.forEach((t) => {
    if (!triggersA[t.id] && !triggersB[t.id]) neither.push(t.id);
  });
  return { userA: { id: _compareUserA, name: userA ? userA.nome || userA.name : "", triggers: permsA.triggers }, userB: { id: _compareUserB, name: userB ? userB.nome || userB.name : "", triggers: permsB.triggers }, onlyA, onlyB, both, neither, stats: { onlyA: onlyA.length, onlyB: onlyB.length, both: both.length, neither: neither.length } };
}
function resetCompare() {
  _compareMode = false;
  _compareUserA = null;
  _compareUserB = null;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { compareModeReady: typeof getCompareData === "function" } };
}
export {
  MODULE_ID,
  VERSION,
  getCompareData,
  getCompareUserA,
  getCompareUserB,
  healthCheck,
  info,
  isCompareMode,
  resetCompare,
  setCompareMode,
  setCompareUsers,
  toggleCompareUser
};
