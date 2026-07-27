import { PANEL_ID, PHASES } from "../core/contracts.js";
import { mapPermissionLevelsToSelect } from "../utils/mappers.js";
import { showCustomModal } from "/components/overlay-layer/adapters/modal-adapter.js";
import { showLoading, hideLoading } from "/components/overlay-layer/adapters/loading-adapter.js";
import { renderIconPicker, initIconPickerEvents } from "./icon-picker.js";
const MODULE_ID = "panel-nav-admin.ui.modals";
const VERSION = "15.0.0-NOVO-ITEM-FULL";
function showItemFormModal(item, sections, icons, onSave) {
  const isEdit = !!item;
  const title = isEdit ? "Editar Item" : "Novo Item de Navega\xE7\xE3o";
  const levelsOptions = mapPermissionLevelsToSelect();
  var inputStyle = "width:100%;padding:0.5rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:0.25rem;color:#fff;";
  var sectionOptions = Object.keys(sections || {}).map(function(key) {
    var sec = sections[key] || {};
    return '<option value="' + key + '"' + (item && item.section === key ? " selected" : "") + ">" + (sec.label || key) + "</option>";
  }).join("");
  var contextOptions = ["sidebar", "navrail", "header", "footer"].map(function(ctx) {
    var labels = { sidebar: "Sidebar", navrail: "NavRail", header: "Header", footer: "Footer" };
    var curCtx = item ? item.displayContext || item.section || "sidebar" : "sidebar";
    return '<option value="' + ctx + '"' + (curCtx === ctx ? " selected" : "") + ">" + labels[ctx] + "</option>";
  }).join("");
  var levelsHtml = levelsOptions.map(function(lv) {
    return '<option value="' + lv.value + '"' + ((item ? item.minLevel : 0) === lv.value ? " selected" : "") + ">" + lv.label + "</option>";
  }).join("");
  const bodyHTML = '<form class="pna-form" data-form="item" style="display:flex;flex-direction:column;gap:1rem;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;"><div class="pna-form-group"><label class="pna-label">Label *</label><input type="text" name="label" class="pna-input" value="' + (item && item.label ? item.label : "") + '" placeholder="ex: Meu M\xF3dulo" required style="' + inputStyle + '"></div><div class="pna-form-group"><label class="pna-label">\xCDcone</label>' + renderIconPicker(item && item.icon ? String(item.icon) : null, "") + '</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;"><div class="pna-form-group"><label class="pna-label">Grupo *</label><select name="section" class="pna-select" required style="' + inputStyle + '">' + sectionOptions + '</select></div><div class="pna-form-group"><label class="pna-label">Contexto</label><select name="displayContext" class="pna-select" style="' + inputStyle + '">' + contextOptions + '</select></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;"><div class="pna-form-group"><label class="pna-label">Rota / Painel</label><input type="text" name="href" class="pna-input" value="' + (item && item.href ? item.href : "") + '" placeholder="ex: #/meu-modulo ou panel-id" style="' + inputStyle + '"></div><div class="pna-form-group"><label class="pna-label">N\xEDvel de Acesso</label><select name="minLevel" class="pna-select" style="' + inputStyle + '">' + levelsHtml + "</select></div></div>" + (isEdit ? "" : '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;"><div class="pna-form-group"><label class="pna-label">ID (slug \xFAnico) *</label><input type="text" name="id" class="pna-input" value="" placeholder="ex: meu-modulo" required style="' + inputStyle + '"></div><div></div></div>') + '<div style="display:flex;gap:1rem;"><label class="pna-checkbox"><input type="checkbox" class="pna-checkbox__input" name="isDivider" ' + (item && item.isDivider ? "checked" : "") + '><span class="pna-checkbox__box"><svg class="pna-checkbox__check" viewBox="0 0 14 14" fill="none"><path class="pna-checkbox__path" d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><svg class="pna-checkbox__dash" viewBox="0 0 14 14" fill="none"><path d="M3 7H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="pna-checkbox__ripple"></span></span><span class="pna-checkbox__label">\xC9 um divisor</span></label>' + (!isEdit ? '<label class="pna-checkbox"><input type="checkbox" class="pna-checkbox__input" name="scaffold"><span class="pna-checkbox__box"><svg class="pna-checkbox__check" viewBox="0 0 14 14" fill="none"><path class="pna-checkbox__path" d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><svg class="pna-checkbox__dash" viewBox="0 0 14 14" fill="none"><path d="M3 7H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="pna-checkbox__ripple"></span></span><span class="pna-checkbox__label">Gerar estrutura da p\xE1gina</span></label>' : "") + "</div></form>";
  const modalPromise = showCustomModal({
    id: "pna-item-form",
    title,
    bodyHTML,
    buttons: [
      { id: "cancel", text: "Cancelar", variant: "secondary", action: "cancel" },
      { id: "save", text: isEdit ? "Salvar Altera\xE7\xF5es" : "Criar Item", variant: "primary", action: "save" }
    ],
    scope: "panel-nav-admin",
    onBeforeClose(action, modalEl) {
      if (action === "save") {
        const form = modalEl.querySelector('[data-form="item"]');
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }
        const iconInput = modalEl.querySelector('[data-icon-picker] input[name="icon"]');
        const iconValue = iconInput ? iconInput.value : form.icon ? form.icon.value : "";
        var idEl = form.elements.namedItem("id");
        var displayContextEl = form.elements.namedItem("displayContext");
        const data = {
          id: idEl ? idEl.value : item ? item.id : "",
          label: form.label.value,
          href: form.href.value,
          icon: iconValue,
          section: form.section.value,
          displayContext: displayContextEl ? displayContextEl.value : "sidebar",
          minLevel: parseInt(form.minLevel.value),
          isDivider: form.isDivider.checked,
          scaffold: form.scaffold ? form.scaffold.checked : false
        };
        if (onSave) onSave(data, isEdit);
      }
      return true;
    }
  });
  setTimeout(() => {
    const modalEl = document.querySelector('[data-custom-id="pna-item-form"]');
    if (modalEl) {
      initIconPickerEvents(modalEl);
    }
  }, 100);
  return modalPromise;
}
function showSectionFormModal(section, onSave) {
  const isEdit = !!section;
  const title = isEdit ? "Editar Se\xE7\xE3o" : "Nova Se\xE7\xE3o";
  const bodyHTML = `<form class="pna-form" data-form="section" style="display:flex;flex-direction:column;gap:1rem;"><div class="pna-form-group"><label class="pna-label">Key (identificador) *</label><input type="text" name="key" class="pna-input" value="${section && section.key ? section.key : ""}" placeholder="ex: financeiro" ${isEdit ? "readonly" : "required"} style="width:100%;padding:0.5rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:0.25rem;color:#fff;"></div><div class="pna-form-group"><label class="pna-label">Label (t\xEDtulo)</label><input type="text" name="label" class="pna-input" value="${section && section.label ? section.label : ""}" placeholder="ex: Financeiro" style="width:100%;padding:0.5rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:0.25rem;color:#fff;"></div><div class="pna-form-group"><label class="pna-label">Ordem</label><input type="number" name="order" class="pna-input" value="${section && section.order ? section.order : 1}" min="1" max="99" style="width:100%;padding:0.5rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:0.25rem;color:#fff;"></div><div class="pna-form-group"><label class="pna-label">\xCDcone</label><input type="text" name="icon" class="pna-input" value="${section && section.icon ? section.icon : ""}" placeholder="ex: admin" style="width:100%;padding:0.5rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:0.25rem;color:#fff;"></div></form>`;
  return showCustomModal({
    id: "pna-section-form",
    title,
    bodyHTML,
    buttons: [
      { id: "cancel", text: "Cancelar", variant: "secondary", action: "cancel" },
      { id: "save", text: isEdit ? "Salvar" : "Criar Se\xE7\xE3o", variant: "primary", action: "save" }
    ],
    scope: "panel-nav-admin",
    onBeforeClose(action, modalEl) {
      if (action === "save") {
        const form = modalEl.querySelector('[data-form="section"]');
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }
        const data = {
          key: form.key.value,
          label: form.label.value,
          order: parseInt(form.order.value),
          icon: form.icon.value
        };
        if (onSave) onSave(data, isEdit);
      }
      return true;
    }
  });
}
function showConfirmDialog(title, message, confirmLabel, triggerElement) {
  if (!triggerElement) {
    return showCustomModal({
      id: `pna-confirm-${Date.now()}`,
      title,
      bodyHTML: `<p style="color:#e0e0e0;font-size:0.95rem;line-height:1.5;margin:0;">${message}</p>`,
      buttons: [
        { id: "cancel", text: "Cancelar", variant: "secondary", action: "cancel" },
        { id: "confirm", text: confirmLabel || "Confirmar", variant: "danger", action: "confirm" }
      ],
      size: "small",
      scope: "panel-nav-admin"
    }).then((result) => {
      return result && result.action === "confirm";
    });
  }
  return new Promise((resolve) => {
    let resolved = false;
    function finish(val) {
      if (resolved) return;
      resolved = true;
      document.removeEventListener("keydown", onKeyDown);
      if (overlay.parentNode) overlay.remove();
      if (popover.parentNode) popover.remove();
      resolve(val);
    }
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;z-index:99998;background:transparent;";
    overlay.onclick = () => finish(false);
    const popover = document.createElement("div");
    popover.className = "pna-confirm-popover";
    popover.style.position = "fixed";
    popover.style.zIndex = "99999";
    const itemName = title || "este item";
    popover.innerHTML = `
            <div class="pna-confirm-popover__header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span class="pna-confirm-popover__title">${itemName}?</span>
            </div>
            <div class="pna-confirm-popover__actions">
                <button class="pna-confirm-popover__btn pna-confirm-popover__btn--cancel" type="button">Cancelar</button>
                <button class="pna-confirm-popover__btn pna-confirm-popover__btn--confirm" type="button">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    ${confirmLabel || "Excluir"}
                </button>
            </div>
        `;
    document.body.appendChild(overlay);
    document.body.appendChild(popover);
    const rect = triggerElement.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    let top = rect.top + rect.height / 2 - popoverRect.height / 2;
    let left = rect.left - popoverRect.width - 8;
    if (left < 8) {
      left = rect.right + 8;
    }
    if (top < 8) top = 8;
    if (top + popoverRect.height > window.innerHeight - 8) {
      top = window.innerHeight - popoverRect.height - 8;
    }
    popover.style.top = top + "px";
    popover.style.left = left + "px";
    const btnCancel = popover.querySelector(".pna-confirm-popover__btn--cancel");
    const btnConfirm = popover.querySelector(".pna-confirm-popover__btn--confirm");
    let ready = false;
    requestAnimationFrame(() => setTimeout(() => {
      ready = true;
    }, 50));
    btnCancel.onclick = () => {
      if (!ready) return;
      finish(false);
    };
    btnConfirm.onclick = () => {
      if (!ready) return;
      finish(true);
    };
    function onKeyDown(e) {
      if (e.key === "Escape") finish(false);
    }
    document.addEventListener("keydown", onKeyDown);
  });
}
function showLoadingOverlay(phase) {
  if (phase === PHASES.LOADING || phase === PHASES.SAVING) {
    showLoading(PANEL_ID, { message: phase === PHASES.SAVING ? "Salvando..." : "Carregando..." });
  } else {
    hideLoading(PANEL_ID);
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var modals_default = {
  showItemFormModal,
  showSectionFormModal,
  showConfirmDialog,
  showLoadingOverlay,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  modals_default as default,
  healthCheck,
  info,
  showConfirmDialog,
  showItemFormModal,
  showLoadingOverlay,
  showSectionFormModal
};
