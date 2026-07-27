const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "nav-rail.component.operations";
import { mergeConfig } from "../core/contracts.js";
import { NavRailRegistry } from "../registry/index.js";
import { NavRailTemplate } from "../ui/template.js";
import { NavRailRender } from "../ui/render.js";
import { NavRailEvents } from "../core/events.js";
import { NavRailLifecycle } from "../core/lifecycle.js";
import { NavRailTracker } from "../telemetry/tracker.js";
import { NavRailBehaviors } from "../ui/behaviors.js";
import { NavRailComponentMounter } from "../core/component-mounter.js";
import { NavRailFeatureLoader } from "../core/feature-loader.js";
import { createLogger } from "../core/constants.js";
import { getPort } from "../ports.js";
import { doInit } from "./init.js";
import { loadRegistryWithRetry, mountComponentsSafe } from "./loaders.js";
const _log = createLogger(getPort);
function render(component) {
  try {
    const groups = NavRailRegistry.getGroups();
    const items = NavRailRegistry.getItems();
    const mobileItems = NavRailRegistry.getMobileItems();
    const html = NavRailTemplate.render({ groups, items, mobileItems });
    NavRailRender.apply(html);
    NavRailTracker.rendered();
    return component;
  } catch (error) {
    _log("error", "Render failed", { error: error.message });
    NavRailTracker.error(error, { phase: "render" });
    if (component._root) {
      component._root.innerHTML = '<nav class="nav-rail nav-rail--error" role="navigation"><div class="nav-rail__error">NavRail Error</div></nav>';
    }
    return component;
  }
}
function setActiveItem(component, itemId) {
  try {
    NavRailRender.setActiveItem(itemId);
  } catch (error) {
    _log("error", "setActiveItem failed", { error: error.message });
  }
  return component;
}
function getActiveItem(component) {
  try {
    const root = component._root;
    return root?.querySelector(".nav-rail__item--active")?.dataset?.itemId || root?.querySelector(".navrail-btn.is-active")?.dataset?.buttonId || null;
  } catch (error) {
    _log("error", "getActiveItem failed", { error: error.message });
    return null;
  }
}
function update(component, newConfig = {}) {
  try {
    component._config = mergeConfig({ ...component._config, ...newConfig });
    render(component);
    mountComponentsSafe(component);
  } catch (error) {
    _log("error", "Update failed", { error: error.message });
  }
  return component;
}
async function refresh(component) {
  try {
    NavRailRegistry.invalidateCache();
    const loadResult = await loadRegistryWithRetry();
    component._registrySource = loadResult.source;
    render(component);
    await mountComponentsSafe(component);
    _log("info", "NavRail refreshed", { source: component._registrySource });
    return component;
  } catch (error) {
    _log("error", "Refresh failed", { error: error.message });
    return component;
  }
}
async function reinit(component, rootElement, userConfig = {}) {
  _log("info", "Performing reinit");
  NavRailTracker.track("reinit:start", {});
  try {
    await destroy(component);
    component._initialized = false;
    component._degradedMode = false;
    component._errorState = null;
    const result = await doInit(component, rootElement || component._root, userConfig || component._config);
    NavRailTracker.track("reinit:success", {});
    return result;
  } catch (error) {
    _log("error", "Reinit failed", { error: error.message });
    NavRailTracker.track("reinit:failed", { error: error.message });
    throw error;
  }
}
async function destroy(component) {
  try {
    await NavRailFeatureLoader.destroy();
  } catch (e) {
    _log("warn", "Feature loader destroy failed", { error: e.message });
  }
  try {
    await NavRailComponentMounter.unmountAll();
  } catch (e) {
    _log("warn", "Component unmount failed during destroy", { error: e.message });
  }
  try {
    NavRailEvents.destroy();
  } catch (e) {
  }
  try {
    NavRailBehaviors.destroy();
  } catch (e) {
  }
  try {
    NavRailRender.destroy();
  } catch (e) {
  }
  NavRailLifecycle.markDestroyed();
  NavRailTracker.destroy();
  component._componentsMounted = false;
  component._featuresMounted = false;
  component._root = null;
  component._config = null;
  component._initialized = false;
  component._registrySource = null;
  component._degradedMode = false;
  component._errorState = null;
  _log("info", "Destroyed");
}
export {
  MODULE_ID,
  VERSION,
  destroy,
  getActiveItem,
  refresh,
  reinit,
  render,
  setActiveItem,
  update
};
