import { CSS_PREFIX, STUB_PANEL_ID } from "../../core/constants.js";
function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function renderSidebarPreview(v) {
  const p = CSS_PREFIX;
  const label = v.label && v.label.trim() || "Novo bot\xE3o";
  const icon = v.icon && v.icon.trim() || "\u2022";
  const stateClass = v.is_active ? `${p}-pv__btn--active` : `${p}-pv__btn--inactive`;
  const stub = v.panel_id === STUB_PANEL_ID;
  const hint = stub ? `<span class="${p}-pv__hint">placeholder (em desenvolvimento)</span>` : "";
  return `
    <div class="${p}-pv" aria-label="Pr\xE9-visualiza\xE7\xE3o do bot\xE3o">
      <span class="${p}-pv__caption">Pr\xE9-visualiza\xE7\xE3o na sidebar</span>
      <div class="${p}-pv__sidebar">
        <div class="${p}-pv__btn ${stateClass}">
          <span class="${p}-pv__icon" aria-hidden="true">${esc(icon)}</span>
          <span class="${p}-pv__label">${esc(label)}</span>
        </div>
      </div>
      ${hint}
    </div>`;
}
export {
  renderSidebarPreview
};
