import { store } from "../state/store.js";
import { validateCreate, buildCreatePayload, buildUpdatePayload } from "../core/form-logic.js";
import { findItem } from "../core/transform.js";
import { renderSidebarPreview } from "../ui/preview/button-preview.js";
import { loadData } from "./data.js";
import { trackAction } from "../telemetry/tracker.js";
const ADAPTER_URL = "../core/nav-data-adapter.js";
function collectForm(form) {
  const fd = new FormData(form);
  return {
    label: String(fd.get("label") ?? ""),
    icon: String(fd.get("icon") ?? ""),
    group: String(fd.get("group") ?? ""),
    panel_id: String(fd.get("panel_id") ?? ""),
    route_path: String(fd.get("route_path") ?? ""),
    is_active: fd.get("is_active") != null
  };
}
function showError(form, msg) {
  const box = form.querySelector('[data-role="form-error"]');
  if (box) {
    box.hidden = false;
    box.textContent = msg;
  }
}
function clearError(form) {
  const box = form.querySelector('[data-role="form-error"]');
  if (box) box.hidden = true;
}
function setupEvents(container) {
  const ac = new AbortController();
  const { signal } = ac;
  container.addEventListener(
    "click",
    (e) => {
      const target = e.target?.closest("[data-action]");
      if (!target) return;
      const action = target.getAttribute("data-action");
      if (action === "new") {
        trackAction("open-create");
        store.setMode("create");
      } else if (action === "cancel") {
        store.setMode("list");
      } else if (action === "edit") {
        const id = target.getAttribute("data-item-id") || "";
        const item = findItem(store.getState().groups, id);
        if (item) {
          trackAction("open-edit", { id });
          store.setMode("edit", item);
        }
      } else if (action === "toggle") {
        const id = target.getAttribute("data-item-id") || "";
        void toggleItem(id);
      }
    },
    { signal }
  );
  container.addEventListener(
    "input",
    (e) => {
      const form = e.target?.closest("[data-form]");
      if (!form) return;
      const node = form.querySelector('[data-role="preview"]');
      if (!node) return;
      const f = collectForm(form);
      node.innerHTML = renderSidebarPreview({ label: f.label, icon: f.icon, panel_id: f.panel_id, is_active: f.is_active });
    },
    { signal }
  );
  container.addEventListener(
    "submit",
    (e) => {
      const form = e.target?.closest("[data-form]");
      if (!form) return;
      const kind = form.getAttribute("data-form");
      if (kind !== "create" && kind !== "edit") return;
      e.preventDefault();
      void submitForm(form, kind);
    },
    { signal }
  );
  return () => ac.abort();
}
async function submitForm(form, kind) {
  const values = collectForm(form);
  const v = validateCreate(values);
  if (!v.valid) {
    showError(form, v.errors.join(" "));
    return;
  }
  clearError(form);
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  try {
    const adapter = await import(ADAPTER_URL);
    let res;
    if (kind === "create") {
      const payload = buildCreatePayload(values);
      res = await adapter.createItem(payload);
      if (res && (res.success || res.ok)) trackAction("create-ok", { itemKey: payload.id });
    } else {
      const editing = store.getState().editing;
      if (!editing) {
        showError(form, "Item em edi\xE7\xE3o n\xE3o encontrado.");
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
      const payload = buildUpdatePayload(editing, values);
      res = await adapter.updateItem(editing.id, payload);
      if (res && (res.success || res.ok)) trackAction("update-ok", { itemKey: editing.id });
    }
    if (res && (res.success || res.ok)) {
      store.setMode("list");
      await loadData();
    } else {
      showError(form, res && res.error || "Falha ao salvar.");
      if (submitBtn) submitBtn.disabled = false;
    }
  } catch (err) {
    showError(form, err instanceof Error ? err.message : String(err));
    if (submitBtn) submitBtn.disabled = false;
  }
}
async function toggleItem(id) {
  const item = findItem(store.getState().groups, id);
  if (!item) return;
  try {
    const adapter = await import(ADAPTER_URL);
    const { buildTogglePayload } = await import("../core/form-logic.js");
    const payload = buildTogglePayload(item);
    const res = await adapter.updateItem(item.id, payload);
    if (res && (res.success || res.ok)) {
      trackAction("toggle-ok", { id, isActive: payload.isActive });
      await loadData();
    } else {
      store.setError(res && res.error || "Falha ao alternar status.");
    }
  } catch (err) {
    store.setError(err instanceof Error ? err.message : String(err));
  }
}
export {
  setupEvents
};
