import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { escapeHtml } from "../../security/escape-html.js";
const VERSION = "10.2.0-MIGRATION-PHASE6";
const MODULE_ID = "panel-nav-admin.ui.modals.import-preview";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[ImportPreviewModal]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const CSS = {
  overlay: "pna-import-preview-overlay",
  modal: "pna-import-preview-modal",
  header: "pna-import-preview-header",
  body: "pna-import-preview-body",
  footer: "pna-import-preview-footer",
  table: "pna-import-preview-table",
  rowValid: "pna-import-row-valid",
  rowInvalid: "pna-import-row-invalid",
  rowNew: "pna-import-row-new",
  rowUpdate: "pna-import-row-update",
  badge: "pna-import-badge",
  stats: "pna-import-stats",
  close: "pna-import-close"
};
function ImportPreviewModal(options = {}) {
  const onConfirm = options.onConfirm || (() => {
  });
  const onCancel = options.onCancel || (() => {
  });
  const container = options.container || document.body;
  let _overlayEl = null;
  let _isOpen = false;
  let _currentData = null;
  function open(data) {
    if (_isOpen) close();
    _currentData = data;
    _isOpen = true;
    const validRows = data.validRows || [];
    const invalidRows = data.invalidRows || [];
    const headers = data.headers || [];
    const format = data.format || "unknown";
    const existingItems = data.existingItems || [];
    const existingIds = new Set(existingItems.map((item) => item.id).filter(Boolean));
    const classified = validRows.map((row) => ({
      row,
      type: row.id && existingIds.has(row.id) ? "update" : "new"
    }));
    const newCount = classified.filter((c) => c.type === "new").length;
    const updateCount = classified.filter((c) => c.type === "update").length;
    _overlayEl = document.createElement("div");
    _overlayEl.className = CSS.overlay;
    _overlayEl.setAttribute("role", "dialog");
    _overlayEl.setAttribute("aria-modal", "true");
    _overlayEl.setAttribute("aria-label", "Preview de importa\xE7\xE3o");
    const displayHeaders = headers.length > 0 ? headers.slice(0, 8) : ["label", "href", "icon", "section", "context"];
    _overlayEl.innerHTML = `
      <div class="${CSS.modal}">
        <div class="${CSS.header}">
          <h3>Preview de Importa\xE7\xE3o (${escapeHtml(format.toUpperCase())})</h3>
          <button class="${CSS.close}" aria-label="Fechar" data-action="close">&times;</button>
        </div>
        <div class="${CSS.stats}">
          <span class="${CSS.badge}" style="--badge-color: var(--color-success, #4caf50)">
            ${newCount} novo${newCount !== 1 ? "s" : ""}
          </span>
          <span class="${CSS.badge}" style="--badge-color: var(--color-info, #2196f3)">
            ${updateCount} atualiza\xE7\xE3o${updateCount !== 1 ? "\xF5es" : ""}
          </span>
          ${invalidRows.length > 0 ? `
          <span class="${CSS.badge}" style="--badge-color: var(--color-error, #f44336)">
            ${invalidRows.length} com erro${invalidRows.length !== 1 ? "s" : ""}
          </span>` : ""}
          <span style="margin-left:auto;opacity:0.7">Total: ${validRows.length + invalidRows.length} linhas</span>
        </div>
        <div class="${CSS.body}">
          <table class="${CSS.table}">
            <thead>
              <tr>
                <th>Status</th>
                ${displayHeaders.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${classified.map(({ row, type }) => `
                <tr class="${type === "new" ? CSS.rowNew : CSS.rowUpdate}">
                  <td><span class="${CSS.badge}" style="--badge-color: ${type === "new" ? "var(--color-success, #4caf50)" : "var(--color-info, #2196f3)"}">${type === "new" ? "Novo" : "Atualizar"}</span></td>
                  ${displayHeaders.map((h) => {
      const field = h.toLowerCase();
      const val = row[field] ?? row[h] ?? "";
      return `<td>${escapeHtml(String(val))}</td>`;
    }).join("")}
                </tr>
              `).join("")}
              ${invalidRows.map(({ row, index, errors }) => `
                <tr class="${CSS.rowInvalid}">
                  <td><span class="${CSS.badge}" style="--badge-color: var(--color-error, #f44336)">Erro (L${index})</span></td>
                  ${displayHeaders.map((h) => {
      const field = h.toLowerCase();
      const val = row[field] ?? row[h] ?? "";
      return `<td>${escapeHtml(String(val))}</td>`;
    }).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
          ${invalidRows.length > 0 ? `
          <details style="margin-top:8px">
            <summary style="cursor:pointer;color:var(--color-error, #f44336)">Detalhes dos erros (${invalidRows.length})</summary>
            <ul style="font-size:0.85em;margin-top:4px">
              ${invalidRows.map(({ index, errors }) => `<li>Linha ${index}: ${escapeHtml(errors.join("; "))}</li>`).join("")}
            </ul>
          </details>` : ""}
        </div>
        <div class="${CSS.footer}">
          <button data-action="cancel" class="pna-btn pna-btn-secondary">Cancelar</button>
          <button data-action="confirm" class="pna-btn pna-btn-primary" ${validRows.length === 0 ? "disabled" : ""}>
            Importar ${validRows.length} item${validRows.length !== 1 ? "ns" : ""}
          </button>
        </div>
      </div>
    `;
    _overlayEl.addEventListener("click", _handleClick);
    _overlayEl.addEventListener("keydown", _handleKeydown);
    container.appendChild(_overlayEl);
    _log("info", `Preview opened: ${validRows.length} valid, ${invalidRows.length} invalid`);
    const confirmBtn = _overlayEl.querySelector('[data-action="confirm"]');
    if (confirmBtn && !confirmBtn.disabled) confirmBtn.focus();
  }
  function close() {
    if (!_isOpen || !_overlayEl) return;
    _overlayEl.removeEventListener("click", _handleClick);
    _overlayEl.removeEventListener("keydown", _handleKeydown);
    _overlayEl.remove();
    _overlayEl = null;
    _isOpen = false;
    _currentData = null;
  }
  function _handleClick(e) {
    const target = e.target;
    const action = target.dataset?.action || target.closest("[data-action]")?.dataset?.action;
    if (action === "close" || action === "cancel") {
      close();
      onCancel();
    } else if (action === "confirm" && _currentData) {
      const rows = _currentData.validRows || [];
      close();
      onConfirm(rows);
    }
    if (target.classList.contains(CSS.overlay)) {
      close();
      onCancel();
    }
  }
  function _handleKeydown(e) {
    if (e.key === "Escape") {
      close();
      onCancel();
    }
  }
  function isOpen() {
    return _isOpen;
  }
  return { open, close, isOpen };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var import_preview_default = { ImportPreviewModal, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  ImportPreviewModal,
  MODULE_ID,
  VERSION,
  import_preview_default as default,
  healthCheck,
  info,
  injectPorts
};
