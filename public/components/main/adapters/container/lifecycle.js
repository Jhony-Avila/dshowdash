import { CONTAINER_EVENTS } from "/core/runtime/events/catalog/container.events.js";
import { STATE, DOCK_SLOTS, LAYOUT_MODE, ENTERPRISE_DEFAULTS } from "./constants.js";
import { ensureDockSlots, getSlotElement } from "./dom-factory.js";
import { getContainers, getContainerApis, getPolicy, getActiveId, checkBudget, incrementGenerationToken, incrementCreated, incrementDestroyed, incrementTitleUpdates, incrementRollbacks, teardownListeners, setSlotsCreated, setActiveId } from "./internal-state.js";
const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "container-lifecycle";
function createLifecycleManager(deps = {}) {
  const { domAdapter, eventsPort, stateMachine, transactions, stateActions, onLayoutRequested } = deps;
  const _containers = getContainers();
  const _containerApis = getContainerApis();
  function _emit(event, data = {}) {
    eventsPort?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
  return {
    getOrCreate(options = {}) {
      const { id, title, dockSpec = { region: "main", slot: DOCK_SLOTS.PRIMARY }, layoutPolicy = { mode: LAYOUT_MODE.INHERIT }, features: featureOpts = {} } = options;
      if (!id) throw new Error("Container ID required");
      const budgetCheck = checkBudget("create");
      if (!budgetCheck.ok) throw new Error(budgetCheck.reason);
      if (_containers.has(id)) {
        if (title) this.updateTitle(id, title);
        stateActions?.activate(id);
        return _containers.get(id);
      }
      transactions.begin();
      try {
        const host = domAdapter?.selectMainContainer?.();
        if (!host) throw new Error("Host container not found");
        ensureDockSlots(host);
        setSlotsCreated(true);
        const slotEl = getSlotElement(host, dockSpec.slot || DOCK_SLOTS.PRIMARY);
        const creationToken = incrementGenerationToken();
        const wrapperEl = document.createElement("div");
        wrapperEl.className = "dsd-container-wrapper";
        wrapperEl.setAttribute("data-container-id", id);
        wrapperEl.setAttribute("data-dock-slot", dockSpec.slot || DOCK_SLOTS.PRIMARY);
        wrapperEl.setAttribute("data-dock-region", dockSpec.region || "main");
        wrapperEl.setAttribute("data-layout-mode", layoutPolicy.mode || LAYOUT_MODE.INHERIT);
        if (layoutPolicy.layout) wrapperEl.setAttribute("data-layout", layoutPolicy.layout);
        slotEl.appendChild(wrapperEl);
        const containerOptions = {
          ...ENTERPRISE_DEFAULTS,
          ...featureOpts,
          id,
          title: title || "Container",
          onClose: () => this.destroy(id),
          onCollapse: () => _emit(CONTAINER_EVENTS.COLLAPSED, { id }),
          onExpand: () => _emit(CONTAINER_EVENTS.EXPANDED, { id }),
          onFullscreen: (fs) => _emit(CONTAINER_EVENTS.FULLSCREEN, { id, fullscreen: fs }),
          onReady: () => _emit(CONTAINER_EVENTS.READY, { id }),
          onError: (err) => _emit(CONTAINER_EVENTS.ERROR, { id, error: err })
        };
        const containerApi = createContainerMain(wrapperEl, containerOptions);
        containerApi.mount();
        const rootEl = containerApi.getElement();
        const contentEl = containerApi.getContent();
        const instance = { id, rootEl, contentEl, wrapperEl, options: containerOptions, state: STATE.CREATING, active: false, createdAt: Date.now(), lastActivatedAt: null, lastTransition: null, dockSpec: { ...dockSpec }, layoutPolicy: { ...layoutPolicy }, generationToken: creationToken, api: containerApi };
        _containers.set(id, instance);
        _containerApis.set(id, containerApi);
        stateMachine.transition(id, STATE.READY, "created");
        _emit(CONTAINER_EVENTS.CREATED, { id, variant: options.variant || "default", policy: getPolicy(), dockSpec, layoutPolicy, features: Object.keys(featureOpts) });
        incrementCreated();
        stateActions?.activate(id);
        transactions.commit();
        return instance;
      } catch (error) {
        transactions.rollback(error.message);
        incrementRollbacks();
        throw error;
      }
    },
    get(id) {
      return _containers.get(id) || null;
    },
    getContentEl(id) {
      return _containers.get(id)?.contentEl || null;
    },
    getApi(id) {
      return _containerApis.get(id) || null;
    },
    updateTitle(id, title) {
      const instance = _containers.get(id);
      if (!instance) return false;
      const api = _containerApis.get(id);
      if (api) {
        api.setTitle(title);
      } else {
        const titleEl = instance.rootEl.querySelector(".dsd-container__title");
        if (titleEl && title) titleEl.textContent = title;
      }
      if (instance.options) instance.options.title = title;
      incrementTitleUpdates();
      _emit(CONTAINER_EVENTS.TITLE_UPDATED, { id, title });
      return true;
    },
    destroy(id) {
      const instance = _containers.get(id);
      if (!instance) return false;
      transactions.begin();
      try {
        stateMachine.transition(id, STATE.DESTROYING, "destroy called");
        teardownListeners(id);
        const api = _containerApis.get(id);
        if (api) {
          api.unmount();
        }
        instance.wrapperEl?.remove?.();
        instance.rootEl?.remove?.();
        stateMachine.transition(id, STATE.DESTROYED, "destroyed");
        _containers.delete(id);
        _containerApis.delete(id);
        if (getActiveId() === id) setActiveId(null);
        _emit(CONTAINER_EVENTS.DESTROYED, { id });
        incrementDestroyed();
        transactions.commit();
        return true;
      } catch (error) {
        transactions.rollback(error.message);
        incrementRollbacks();
        return false;
      }
    },
    destroyAll() {
      const ids = Array.from(_containers.keys());
      ids.forEach((id) => this.destroy(id));
      setActiveId(null);
    }
  };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var lifecycle_default = { createLifecycleManager, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createLifecycleManager,
  lifecycle_default as default,
  healthCheck
};
