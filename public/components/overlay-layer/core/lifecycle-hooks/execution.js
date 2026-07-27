import { hooks, state, config, isValidHookType, logError } from "./state.js";
import { off } from "./registration.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.lifecycle-hooks.execution";
async function execute(type, context = {}) {
  if (!config.enabled) {
    return { ok: true, skipped: true, reason: "hooks-disabled" };
  }
  if (!isValidHookType(type)) {
    return { ok: false, error: `Invalid hook type: ${type}` };
  }
  const typeHooks = hooks[type];
  if (!typeHooks || typeHooks.length === 0) {
    return { ok: true, executed: 0, cancelled: false };
  }
  state.totalCalls++;
  state.hookExecutions[type].calls++;
  const results = [];
  const toRemove = [];
  let cancelled = false;
  let cancelReason = null;
  let modifiedContext = { ...context };
  for (const hookEntry of typeHooks) {
    if (cancelled && type.startsWith("before")) {
      break;
    }
    try {
      let result;
      if (hookEntry.async && config.asyncHooks) {
        result = await Promise.race([
          Promise.resolve(hookEntry.handler(modifiedContext, { type, hookId: hookEntry.id })),
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("Hook timeout")), config.timeoutMs)
          )
        ]);
      } else {
        result = hookEntry.handler(modifiedContext, { type, hookId: hookEntry.id });
      }
      results.push({ hookId: hookEntry.id, name: hookEntry.name, result, error: null });
      if (type.startsWith("before")) {
        if (result === false) {
          cancelled = true;
          cancelReason = `Cancelled by hook: ${hookEntry.name || hookEntry.id}`;
          state.cancelledByHook++;
          state.hookExecutions[type].cancelled++;
        } else if (result && typeof result === "object") {
          if (result.cancel === true) {
            cancelled = true;
            cancelReason = result.reason || `Cancelled by hook: ${hookEntry.name || hookEntry.id}`;
            state.cancelledByHook++;
            state.hookExecutions[type].cancelled++;
          } else if (result.modified) {
            modifiedContext = { ...modifiedContext, ...result.modified };
          }
        }
      }
      if (hookEntry.once) {
        toRemove.push(hookEntry.id);
      }
    } catch (error) {
      state.errors++;
      state.hookExecutions[type].errors++;
      logError(`Error in hook ${hookEntry.name || hookEntry.id}:`, error);
      results.push({ hookId: hookEntry.id, name: hookEntry.name, result: null, error: error.message });
      if (!config.continueOnError) {
        return {
          ok: false,
          error: `Hook error: ${error.message}`,
          hookId: hookEntry.id,
          executed: results.length,
          cancelled: false
        };
      }
    }
  }
  for (const id of toRemove) {
    off(type, id);
  }
  return {
    ok: !cancelled,
    executed: results.length,
    cancelled,
    cancelReason,
    modifiedContext: type.startsWith("before") ? modifiedContext : null,
    results
  };
}
function executeSync(type, context = {}) {
  if (!config.enabled) {
    return { ok: true, skipped: true, reason: "hooks-disabled" };
  }
  if (!isValidHookType(type)) {
    return { ok: false, error: `Invalid hook type: ${type}` };
  }
  const typeHooks = hooks[type];
  if (!typeHooks || typeHooks.length === 0) {
    return { ok: true, executed: 0, cancelled: false };
  }
  state.totalCalls++;
  state.hookExecutions[type].calls++;
  const results = [];
  const toRemove = [];
  let cancelled = false;
  let cancelReason = null;
  let modifiedContext = { ...context };
  for (const hookEntry of typeHooks) {
    if (cancelled && type.startsWith("before")) {
      break;
    }
    try {
      const result = hookEntry.handler(modifiedContext, { type, hookId: hookEntry.id });
      results.push({ hookId: hookEntry.id, name: hookEntry.name, result, error: null });
      if (type.startsWith("before")) {
        if (result === false) {
          cancelled = true;
          cancelReason = `Cancelled by hook: ${hookEntry.name || hookEntry.id}`;
          state.cancelledByHook++;
          state.hookExecutions[type].cancelled++;
        } else if (result && typeof result === "object") {
          if (result.cancel === true) {
            cancelled = true;
            cancelReason = result.reason || `Cancelled by hook: ${hookEntry.name || hookEntry.id}`;
            state.cancelledByHook++;
            state.hookExecutions[type].cancelled++;
          } else if (result.modified) {
            modifiedContext = { ...modifiedContext, ...result.modified };
          }
        }
      }
      if (hookEntry.once) {
        toRemove.push(hookEntry.id);
      }
    } catch (error) {
      state.errors++;
      state.hookExecutions[type].errors++;
      logError(`Error in hook ${hookEntry.name || hookEntry.id}:`, error);
      results.push({ hookId: hookEntry.id, name: hookEntry.name, result: null, error: error.message });
      if (!config.continueOnError) {
        return {
          ok: false,
          error: `Hook error: ${error.message}`,
          hookId: hookEntry.id,
          executed: results.length,
          cancelled: false
        };
      }
    }
  }
  for (const id of toRemove) {
    off(type, id);
  }
  return {
    ok: !cancelled,
    executed: results.length,
    cancelled,
    cancelReason,
    modifiedContext: type.startsWith("before") ? modifiedContext : null,
    results
  };
}
export {
  MODULE_ID,
  VERSION,
  execute,
  executeSync
};
