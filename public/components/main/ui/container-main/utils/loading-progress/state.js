const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.loading-progress.state";
let _instance = null;
function getInstance() {
  return _instance;
}
function setInstance(inst) {
  _instance = inst;
}
function hasInstance() {
  return _instance !== null;
}
export {
  MODULE_ID,
  VERSION,
  getInstance,
  hasInstance,
  setInstance
};
