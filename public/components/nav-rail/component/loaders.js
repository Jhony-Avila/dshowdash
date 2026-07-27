import { NavRailRegistry } from "../registry/index.js";
import { NavRailComponentMounter } from "../core/component-mounter.js";
import { NavRailTracker } from "../telemetry/tracker.js";
import { RetryManager } from "../core/retry-manager.js";
import { createLogger } from "../core/constants.js";
import { getPort } from "../ports.js";
const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "nav-rail.component.loaders";
const _log = createLogger(getPort);
async function loadCSSWithRetry() {
  const cssPath = "/components/nav-rail/styles/index.css";
  if (document.querySelector(`link[href="${cssPath}"]`)) return;
  return RetryManager.execute(() => new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    link.onload = resolve;
    link.onerror = () => reject(new Error("Failed to load NavRail CSS"));
    document.head.appendChild(link);
  }), { maxAttempts: 2, baseDelay: 500, serviceName: "css-loader" });
}
async function loadRegistryWithRetry() {
  try {
    return await RetryManager.execute(
      () => NavRailRegistry.load(),
      { maxAttempts: 3, baseDelay: 1e3, serviceName: "registry-api" }
    );
  } catch (error) {
    _log("warn", "Registry load failed, using fallback", { error: error.message });
    NavRailRegistry._loadFallback();
    return { success: true, source: "fallback" };
  }
}
async function mountComponentsSafe(component) {
  try {
    if (component._componentsMounted) {
      await NavRailComponentMounter.unmountAll();
    }
    const items = NavRailRegistry.getItems();
    const results = await NavRailComponentMounter.mountAll(component._root, items);
    component._componentsMounted = true;
    _log("info", "Components mounted", {
      eager: results.mounted.length,
      failed: results.failed.length,
      lazy: results.lazy ? results.lazy.length : 0
    });
    if (results.failed.length > 0) {
      _log("warn", "Some components failed to mount", { failed: results.failed });
    }
    return results;
  } catch (error) {
    _log("error", "Component mounting failed", { error: error.message });
    NavRailTracker.error(error, { phase: "mount-components" });
    component._componentsMounted = false;
    return { mounted: [], failed: [], lazy: [], error: error.message };
  }
}
export {
  MODULE_ID,
  VERSION,
  loadCSSWithRetry,
  loadRegistryWithRetry,
  mountComponentsSafe
};
