import { UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { formatCurrency, formatDate, escapeHtml } from "../utils/formatters.js";
import { getSituacaoById } from "../core/constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/drawer";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _setScrollLock = (locked) => {
  const lm = _getPort("layoutManager");
  if (lm?.setScrollLocked) {
    lm.setScrollLocked(locked);
    return true;
  }
  const eb = _getPort("eventBus");
  if (eb?.emit) {
    eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: locked ? "scroll-lock" : "scroll-unlock", source: MODULE_ID });
    return true;
  }
  if (typeof document !== "undefined") document.body.style.overflow = locked ? "hidden" : "";
  return false;
};
class DrawerComponent {
  constructor(options = {}) {
    this.onAction = options.onAction || (() => {
    });
    this.overlay = null;
    this.drawer = null;
    this.currentData = null;
    this.isOpen = false;
    this._escHandler = null;
    this._clickHandler = null;
    this._abortController = null;
    _initPorts();
  }
  init() {
    if (this.overlay) return;
    this.overlay = document.createElement("div");
    this.overlay.className = "p01-drawer-overlay";
    this.overlay.innerHTML = '<div class="p01-drawer"><header class="p01-drawer-header"><div class="p01-drawer-title-group"><h3 class="p01-drawer-title" data-drawer-title>Requisi\xE7\xE3o</h3><div class="p01-drawer-subtitle" data-drawer-subtitle></div></div><button class="p01-drawer-close" data-action="close-drawer" aria-label="Fechar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></header><div class="p01-drawer-body" data-drawer-body><div class="p01-drawer-loading"><div class="p01-drawer-spinner"></div><span>Carregando...</span></div></div><footer class="p01-drawer-footer" data-drawer-footer><div class="p01-drawer-actions"><button class="p01-drawer-action p01-drawer-action--secondary" data-action="print" title="Imprimir"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Imprimir</button><button class="p01-drawer-action p01-drawer-action--primary" data-action="export-pdf" title="Exportar PDF"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>PDF</button></div></footer></div>';
    document.body.appendChild(this.overlay);
    this.drawer = this.overlay.querySelector(".p01-drawer");
    this._escHandler = (e) => {
      if (e.key === "Escape" && this.isOpen) this.close();
    };
    this._clickHandler = (e) => {
      if (e.target === this.overlay) this.close();
      const actionBtn = e.target.closest("[data-action]");
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        if (action === "close-drawer") this.close();
        else if (this.currentData) this.onAction(action, this.currentData);
      }
    };
    this._abortController = new AbortController();
    document.addEventListener("keydown", this._escHandler, { signal: this._abortController.signal });
    this.overlay.addEventListener("click", this._clickHandler, { signal: this._abortController.signal });
  }
  open(data) {
    if (!this.overlay) this.init();
    this.currentData = data;
    this.isOpen = true;
    this.overlay.classList.add("open");
    this.drawer.classList.add("open");
    _setScrollLock(true);
    this.renderDetails(data);
  }
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.overlay.classList.remove("open");
    this.drawer.classList.remove("open");
    _setScrollLock(false);
  }
  renderDetails(data) {
    const title = this.overlay.querySelector("[data-drawer-title]");
    const subtitle = this.overlay.querySelector("[data-drawer-subtitle]");
    const body = this.overlay.querySelector("[data-drawer-body]");
    const req = data.requisicao || data;
    const situacao = getSituacaoById(Number(req.Id_Situacao || req.id_situacao));
    if (title) title.textContent = `Requisi\xE7\xE3o #${req.Id_Requisicao || req.id}`;
    if (subtitle) subtitle.innerHTML = `<span class="p01-badge" style="--badge-color: ${situacao.cor}">${req.Situacao || req.situacao || "--"}</span><span class="p01-drawer-total">${formatCurrency(req.Total || req.total)}</span>`;
    if (body) body.innerHTML = this._buildDetailsHTML(data);
  }
  _buildDetailsHTML(data) {
    const req = data.requisicao || data;
    const itens = data.itens || [];
    const midias = data.midias || [];
    let html = `<div class="p01-drawer-section"><h4 class="p01-drawer-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>Informa\xE7\xF5es Gerais</h4><div class="p01-drawer-grid"><div class="p01-drawer-item"><span class="p01-drawer-label">Data Requisi\xE7\xE3o</span><span class="p01-drawer-value">${formatDate(req.Data_Requisicao || req.data_requisicao)}</span></div><div class="p01-drawer-item"><span class="p01-drawer-label">Prev. Pagamento</span><span class="p01-drawer-value">${formatDate(req.Data_Prev_Pgto || req.data_prev_pgto)}</span></div><div class="p01-drawer-item"><span class="p01-drawer-label">Centro de Custo</span><span class="p01-drawer-value">${escapeHtml(req.Centro_De_Custo || req.centro_custo || "--")}</span></div><div class="p01-drawer-item"><span class="p01-drawer-label">Fornecedor</span><span class="p01-drawer-value">${escapeHtml(req.Fornecedor || req.fornecedor || "--")}</span></div><div class="p01-drawer-item"><span class="p01-drawer-label">Categoria</span><span class="p01-drawer-value">${escapeHtml(req.Descricao_Categoria || req.categoria || "--")}</span></div><div class="p01-drawer-item"><span class="p01-drawer-label">Criador</span><span class="p01-drawer-value">${escapeHtml(req.Criador || req.criador || "--")}</span></div></div></div>`;
    html += `<div class="p01-drawer-section"><h4 class="p01-drawer-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg>Descri\xE7\xE3o</h4><p class="p01-drawer-text">${escapeHtml(req.Descricao_Requisicao || req.descricao || "--")}</p>${req.Observacao ? `<p class="p01-drawer-text p01-drawer-text--muted">${escapeHtml(req.Observacao)}</p>` : ""}</div>`;
    if (itens.length > 0) {
      html += `<div class="p01-drawer-section"><h4 class="p01-drawer-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>Itens (${itens.length})</h4><div class="p01-drawer-items">${itens.map((it) => `<div class="p01-drawer-item-row"><span class="p01-drawer-item-desc">${escapeHtml(it.descricao || it.Descricao || "--")}</span><span class="p01-drawer-item-qty">${it.qtd || it.Quantidade || 1}x</span><span class="p01-drawer-item-price">${formatCurrency(it.valor_unitario || it.Valor_Unitario)}</span><span class="p01-drawer-item-subtotal">${formatCurrency(it.subtotal || it.Subtotal)}</span></div>`).join("")}<div class="p01-drawer-item-total"><span>Total</span><span>${formatCurrency(req.Total || req.total)}</span></div></div></div>`;
    }
    if (midias.length > 0) {
      html += `<div class="p01-drawer-section"><h4 class="p01-drawer-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>Anexos (${midias.length})</h4><div class="p01-drawer-attachments">${midias.map((m) => `<a href="${m.url || m.Url}" target="_blank" class="p01-drawer-attachment"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>${escapeHtml(m.nome || m.Nome || "Arquivo")}</a>`).join("")}</div></div>`;
    }
    return html;
  }
  destroy() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    if (this.overlay) {
      this.overlay.remove();
    }
    this.overlay = null;
    this.drawer = null;
    this.currentData = null;
    this.isOpen = false;
  }
}
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
const healthCheck = () => ({ status: Ports.snapshot()._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
var drawer_default = DrawerComponent;
export {
  DrawerComponent,
  MODULE_ID,
  VERSION,
  drawer_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
