const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "app-shell.ui.skeleton-loader.core";
import { activeSkeletons, metrics } from "./state.js";
import { injectStyles } from "./styles.js";
import { createSkeletonElement } from "./elements.js";
import { buildShapes, createFromTemplate } from "./builders.js";
function create(target, template, options) {
  injectStyles();
  const container = typeof target === "string" ? document.querySelector(target) : target;
  if (!container) return null;
  options = options || {};
  let skeleton;
  if (typeof template === "string") {
    skeleton = createFromTemplate(template);
  } else if (template && template.shapes) {
    skeleton = document.createElement("div");
    skeleton.className = "skeleton-container";
    buildShapes(skeleton, template.shapes);
  } else {
    skeleton = createSkeletonElement(template || { width: "100%", height: "100px" });
  }
  if (!skeleton) return null;
  const id = `skeleton-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  skeleton.id = id;
  skeleton.setAttribute("role", "status");
  skeleton.setAttribute("aria-busy", "true");
  skeleton.setAttribute("aria-label", options.ariaLabel || "Loading...");
  if (options.replace) {
    container.innerHTML = "";
  }
  container.appendChild(skeleton);
  activeSkeletons.set(id, {
    element: skeleton,
    container,
    template: typeof template === "string" ? template : "custom",
    createdAt: Date.now()
  });
  metrics.created++;
  metrics.activeCount = activeSkeletons.size;
  return id;
}
function destroy(id) {
  const info = activeSkeletons.get(id);
  if (!info) return false;
  if (info.element && info.element.parentNode) {
    info.element.parentNode.removeChild(info.element);
  }
  activeSkeletons.delete(id);
  metrics.destroyed++;
  metrics.activeCount = activeSkeletons.size;
  return true;
}
function destroyIn(target) {
  const container = typeof target === "string" ? document.querySelector(target) : target;
  if (!container) return 0;
  let destroyed = 0;
  activeSkeletons.forEach((info, id) => {
    if (info.container === container) {
      destroy(id);
      destroyed++;
    }
  });
  return destroyed;
}
function destroyAll() {
  const ids = [];
  activeSkeletons.forEach((info, id) => {
    ids.push(id);
  });
  for (let i = 0; i < ids.length; i++) {
    destroy(ids[i]);
  }
  return ids.length;
}
function hasActive(target) {
  const container = typeof target === "string" ? document.querySelector(target) : target;
  if (!container) return false;
  let found = false;
  activeSkeletons.forEach((info) => {
    if (info.container === container) found = true;
  });
  return found;
}
export {
  MODULE_ID,
  VERSION,
  create,
  destroy,
  destroyAll,
  destroyIn,
  hasActive
};
