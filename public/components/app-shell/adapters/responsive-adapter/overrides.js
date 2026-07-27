import { userOverrides, autoApplyPolicies } from "./state.js";
import { notifyListeners } from "./helpers.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.adapters.responsive-adapter.overrides";
function setUserOverride(region, override) {
  userOverrides[region] = !!override;
  notifyListeners("user-override", { region, override: !!override });
}
function clearUserOverride(region) {
  delete userOverrides[region];
  notifyListeners("user-override-cleared", { region });
}
function clearAllOverrides() {
  for (let key in userOverrides) {
    if (userOverrides.hasOwnProperty(key)) {
      delete userOverrides[key];
    }
  }
  notifyListeners("all-overrides-cleared", null);
}
function getUserOverrides() {
  return Object.assign({}, userOverrides);
}
function setAutoApply(enabled) {
  autoApplyPolicies.value = !!enabled;
  notifyListeners("auto-apply-changed", { enabled: !!enabled });
}
export {
  MODULE_ID,
  VERSION,
  clearAllOverrides,
  clearUserOverride,
  getUserOverrides,
  setAutoApply,
  setUserOverride
};
