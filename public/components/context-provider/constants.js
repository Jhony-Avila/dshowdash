const VERSION = "5.0.0-ENTERPRISE";
const MODULE_ID = "context-provider";
const RETRY_MAX = 5;
const RETRY_DELAY = 300;
const MAX_GLOBALSTATE_SIZE = 5e4;
function getVersion() {
  return VERSION;
}
var constants_default = { VERSION, MODULE_ID, RETRY_MAX, RETRY_DELAY, MAX_GLOBALSTATE_SIZE, getVersion };
export {
  MAX_GLOBALSTATE_SIZE,
  MODULE_ID,
  RETRY_DELAY,
  RETRY_MAX,
  VERSION,
  constants_default as default,
  getVersion
};
