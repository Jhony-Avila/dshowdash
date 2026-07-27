import { CONTAINER_EVENTS } from "/core/runtime/events/catalog/container.events.js";
import { STATE, LAYOUT_MODE } from "./constants.js";
import { getContainers, getContainerApis, getActiveId, setActiveId } from "./internal-state.js";
const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "container-state-actions";
function createStateActions(deps = {}) {
  const { eventsPort, stateMachine, onLayoutRequested } = deps;
  const _containers = getContainers();
  const _containerApis = getContainerApis();
  function _emit(event, data = {}) {
    eventsPort?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
  const actions = {
    collapse(id) {
      const instance = _containers.get(id);
      if (!instance) return false;
      const api = _containerApis.get(id);
      if (api) {
        api.collapse();
      } else {
        instance.rootEl.classList.add("dsd-container--collapsed");
      }
      stateMachine.transition(id, STATE.COLLAPSED, "collapse");
      _emit(CONTAINER_EVENTS.COLLAPSED, { id });
      return true;
    },
    expand(id) {
      const instance = _containers.get(id);
      if (!instance) return false;
      const api = _containerApis.get(id);
      if (api) {
        api.expand();
      } else {
        instance.rootEl.classList.remove("dsd-container--collapsed");
      }
      const targetState = instance.active ? STATE.ACTIVE : STATE.READY;
      stateMachine.transition(id, targetState, "expand");
      _emit(CONTAINER_EVENTS.EXPANDED, { id });
      return true;
    },
    toggle(id) {
      const instance = _containers.get(id);
      if (!instance) return false;
      const api = _containerApis.get(id);
      if (api) {
        api.toggle();
        return true;
      }
      return instance.state === STATE.COLLAPSED ? actions.expand(id) : actions.collapse(id);
    },
    setLoading(id, loading) {
      const instance = _containers.get(id);
      if (!instance) return false;
      const api = _containerApis.get(id);
      if (api) {
        loading ? api.showLoading() : api.hideLoading();
      }
      if (loading) stateMachine.transition(id, STATE.LOADING, "setLoading true");
      else stateMachine.transition(id, instance.active ? STATE.ACTIVE : STATE.READY, "setLoading false");
      instance.rootEl?.setAttribute?.("data-loading", String(loading));
      _emit(CONTAINER_EVENTS.STATE_CHANGED, { id, loading, change: "loading" });
      return true;
    },
    setError(id, error) {
      const instance = _containers.get(id);
      if (!instance) return false;
      stateMachine.transition(id, STATE.ERROR, "setError");
      const api = _containerApis.get(id);
      if (api) {
        api.toastError(typeof error === "string" ? error : error?.message || "Erro desconhecido");
      }
      const errorEl = instance.rootEl.querySelector(".dsd-container__error");
      if (errorEl) {
        errorEl.textContent = typeof error === "string" ? error : error?.message || "Erro desconhecido";
        errorEl.style.display = "block";
      }
      _emit(CONTAINER_EVENTS.ERROR, { id, error: errorEl?.textContent });
      return true;
    },
    clearError(id) {
      const instance = _containers.get(id);
      if (!instance) return false;
      stateMachine.transition(id, instance.active ? STATE.ACTIVE : STATE.READY, "clearError");
      const errorEl = instance.rootEl.querySelector(".dsd-container__error");
      if (errorEl) {
        errorEl.textContent = "";
        errorEl.style.display = "none";
      }
      return true;
    },
    activate(id) {
      const instance = _containers.get(id);
      if (!instance) return false;
      const currentActiveId = getActiveId();
      if (currentActiveId && currentActiveId !== id) {
        actions.deactivate(currentActiveId);
      }
      stateMachine.transition(id, STATE.ACTIVE, "activate");
      instance.active = true;
      instance.lastActivatedAt = Date.now();
      instance.rootEl?.setAttribute?.("data-active", "true");
      instance.rootEl?.classList?.add?.("dsd-container--active");
      if (instance.rootEl) instance.rootEl.style.display = "";
      if (instance.wrapperEl) instance.wrapperEl.style.display = "";
      setActiveId(id);
      if (instance.layoutPolicy?.mode === LAYOUT_MODE.OVERRIDE && instance.layoutPolicy?.layout) {
        _emit(CONTAINER_EVENTS.LAYOUT_CHANGED, { id, layout: instance.layoutPolicy.layout });
        if (typeof onLayoutRequested === "function") onLayoutRequested(instance.layoutPolicy.layout);
      }
      _emit(CONTAINER_EVENTS.ACTIVATED, { id, layoutPolicy: instance.layoutPolicy });
      return true;
    },
    deactivate(id) {
      const instance = _containers.get(id);
      if (!instance) return false;
      stateMachine.transition(id, STATE.INACTIVE, "deactivate");
      instance.active = false;
      instance.rootEl?.setAttribute?.("data-active", "false");
      instance.rootEl?.classList?.remove?.("dsd-container--active");
      if (instance.rootEl) instance.rootEl.style.display = "none";
      if (instance.wrapperEl) instance.wrapperEl.style.display = "none";
      if (getActiveId() === id) setActiveId(null);
      _emit(CONTAINER_EVENTS.STATE_CHANGED, { id, change: "deactivated" });
      return true;
    }
  };
  return actions;
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var state_actions_default = { createStateActions, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createStateActions,
  state_actions_default as default,
  healthCheck
};
