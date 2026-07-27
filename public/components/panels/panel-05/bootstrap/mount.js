const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels.panel-05.bootstrap.mount";
import { initLifecycle } from "../core/lifecycle.js";
let mounted = false;
let instance = null;
async function mount(container, options = {}) {
  if (mounted) {
    console.warn("[panel-05] Already mounted");
    return instance;
  }
  try {
    instance = await initLifecycle(container, options);
    mounted = true;
    return instance;
  } catch (error) {
    console.error("[panel-05] Mount failed:", error);
    throw error;
  }
}
function unmount() {
  if (instance?.destroy) instance.destroy();
  instance = null;
  mounted = false;
}
function isMounted() {
  return mounted;
}
function getInstance() {
  return instance;
}
var mount_default = { mount, unmount, isMounted, getInstance };
export {
  MODULE_ID,
  VERSION,
  mount_default as default,
  getInstance,
  isMounted,
  mount,
  unmount
};
