import { FEATURE_FLAG_KEY } from "./constants.js";
const VERSION = "7.4.0-P2-ENTERPRISE";
const MODULE_ID = "sidebar.features.accordion-ncs.feature-flags";
function getFeatureFlags() {
  try {
    const stored = localStorage.getItem("dshowdash:featureFlags");
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
}
function setFeatureFlag(key, value) {
  try {
    const flags = getFeatureFlags();
    flags[key] = value;
    localStorage.setItem("dshowdash:featureFlags", JSON.stringify(flags));
    return true;
  } catch (e) {
    return false;
  }
}
function isEnabled() {
  const flags = getFeatureFlags();
  return flags[FEATURE_FLAG_KEY] === true;
}
var feature_flags_default = {
  getFeatureFlags,
  setFeatureFlag,
  isEnabled
};
export {
  MODULE_ID,
  VERSION,
  feature_flags_default as default,
  getFeatureFlags,
  isEnabled,
  setFeatureFlag
};
