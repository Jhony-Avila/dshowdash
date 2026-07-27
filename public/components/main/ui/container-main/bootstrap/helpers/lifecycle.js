const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap.helpers.lifecycle";
function createLifecycleHelpers(refs) {
  const r = refs;
  return {
    registerPlugin(plugin) {
      return r.pluginSystem?.register(plugin);
    },
    onBeforeBoot(handler, opts) {
      return r.lifecycleHooks?.beforeBoot(handler, opts);
    },
    onAfterBoot(handler, opts) {
      return r.lifecycleHooks?.afterBoot(handler, opts);
    },
    onBeforeShutdown(handler, opts) {
      return r.lifecycleHooks?.beforeShutdown(handler, opts);
    },
    onStateChange(handler, opts) {
      return r.lifecycleHooks?.onStateChange(handler, opts);
    },
    onError(handler, opts) {
      return r.lifecycleHooks?.onError(handler, opts);
    },
    createSnapshot(name, type, meta) {
      return r.stateSnapshots?.create(name, type, meta);
    },
    getSnapshot(id) {
      return r.stateSnapshots?.get(id);
    },
    listSnapshots() {
      return r.stateSnapshots?.list();
    }
  };
}
var lifecycle_default = { createLifecycleHelpers };
export {
  MODULE_ID,
  VERSION,
  createLifecycleHelpers,
  lifecycle_default as default
};
