import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { create as createTableEngine } from "/components/table-engine/index.js";
const MODULE_ID = "panel-05.renderer.table";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
let _tableInstance = null;
let _currentRefs = null;
let _eventCallbacks = {};
const PANEL05_COLUMNS = [
  { id: "nome", label: "Empresa", sortable: true, searchable: true, exportable: true },
  { id: "cnpj", label: "CNPJ", sortable: true, searchable: true, exportable: true, type: "cnpj" },
  { id: "cidade", label: "Cidade/UF", sortable: true, searchable: true, exportable: true },
  { id: "receita", label: "Receita", sortable: true, exportable: true, type: "currency" },
  { id: "status", label: "Status", sortable: true, exportable: true, type: "status" }
];
function normalize(c) {
  if (!c) return null;
  return { id: String(c.Id_Organizacao || c.id), nome: c.Nome_Empresa || c.nome || "", cidade: c.Municipio_Endereco || c.cidade || "", uf: c.Uf_Endereco || c.uf || "", receita: parseFloat(String(c.Receita_Gerada || c.receita || 0)), status: c.status || (c.Flag_Ativo === -1 ? "ativo" : "inativo"), cnpj: c.Cnpj || c.cnpj || "", telefone: c.Telefone || c.telefone || "", email: c.Email || c.email || "", porte: c.Porte_Empresa || c.porte || "", aReceber: parseFloat(String(c.A_Receber || c.aReceber || 0)), ultimaCompra: c.Ultima_Compra || c.ultimaCompra || null, risco: c.Risco || c.risco || "", cep: c.Cep_Endereco || c.cep || "", bairro: c.Bairro_Endereco || c.bairro || "" };
}
function renderExpansion(item, opts) {
  const p = opts.cssPrefix;
  const fmt = opts.formatters;
  const esc = fmt.escapeHtml || ((v) => String(v));
  const fmtCurrency = fmt.formatCurrency || ((v) => `R$ ${v}`);
  const fmtDate = fmt.formatDate || ((v) => String(v));
  const fmtCNPJ = fmt.formatCNPJ || ((v) => String(v));
  const fmtPhone = fmt.formatPhone || ((v) => String(v));
  const waLink = item.telefone ? `https://wa.me/55${String(item.telefone).replace(/\D/g, "")}` : null;
  return `<div class="${p}expansion-content"><div class="${p}expansion-grid"><div class="${p}expansion-section"><h4>Dados Gerais</h4><div class="${p}expansion-item"><span class="${p}expansion-label">CNPJ</span><span class="${p}expansion-value">${item.cnpj ? fmtCNPJ(item.cnpj) : "\u2014"}</span></div><div class="${p}expansion-item"><span class="${p}expansion-label">Telefone</span><span class="${p}expansion-value">${item.telefone ? fmtPhone(item.telefone) : "\u2014"}</span></div><div class="${p}expansion-item"><span class="${p}expansion-label">Email</span><span class="${p}expansion-value">${esc(item.email) || "\u2014"}</span></div><div class="${p}expansion-item"><span class="${p}expansion-label">Porte</span><span class="${p}expansion-value">${esc(item.porte) || "\u2014"}</span></div></div><div class="${p}expansion-section"><h4>Financeiro</h4><div class="${p}expansion-item"><span class="${p}expansion-label">Receita</span><span class="${p}expansion-value">${fmtCurrency(item.receita)}</span></div><div class="${p}expansion-item"><span class="${p}expansion-label">A Receber</span><span class="${p}expansion-value">${fmtCurrency(item.aReceber || 0)}</span></div><div class="${p}expansion-item"><span class="${p}expansion-label">\xDAltima Compra</span><span class="${p}expansion-value">${item.ultimaCompra ? fmtDate(item.ultimaCompra) : "\u2014"}</span></div><div class="${p}expansion-item"><span class="${p}expansion-label">Risco</span><span class="${p}expansion-value">${esc(item.risco) || "\u2014"}</span></div></div><div class="${p}expansion-section"><h4>Endere\xE7o</h4><div class="${p}expansion-item"><span class="${p}expansion-label">Cidade/UF</span><span class="${p}expansion-value">${esc(item.cidade) || "\u2014"}${item.uf ? `/${item.uf}` : ""}</span></div><div class="${p}expansion-item"><span class="${p}expansion-label">CEP</span><span class="${p}expansion-value">${esc(item.cep) || "\u2014"}</span></div><div class="${p}expansion-item"><span class="${p}expansion-label">Bairro</span><span class="${p}expansion-value">${esc(item.bairro) || "\u2014"}</span></div></div></div><div class="${p}expansion-actions"><button class="${p}expansion-btn ${p}expansion-btn-primary" data-action="view-cliente" data-id="${item.id}">\u{1F441} Ver Completo</button><button class="${p}expansion-btn" data-action="copy-cnpj" data-cnpj="${item.cnpj || ""}">\u{1F4CB} Copiar CNPJ</button>${waLink ? `<a href="${waLink}" target="_blank" class="${p}expansion-btn">\u{1F4AC} WhatsApp</a>` : ""}</div></div>`;
}
const PANEL05_CONTEXT_MENU = [
  { action: "ctx-view", label: "Ver detalhes", icon: "\u{1F441}", key: "V" },
  { action: "ctx-edit", label: "Editar", icon: "\u270F\uFE0F", key: "E" },
  { action: "ctx-expand", label: "Expandir", icon: "\u2B07", key: "X" },
  { divider: true },
  { action: "ctx-fav", label: "Favoritar", icon: "\u2B50", key: "F" },
  { action: "ctx-copy", label: "Copiar CNPJ", icon: "\u{1F4CB}" },
  { divider: true },
  { action: "ctx-delete", label: "Excluir", icon: "\u{1F5D1}", key: "D", danger: true }
];
function ensureInstance(refs) {
  if (!refs || !refs.tableContainer) return null;
  if (_tableInstance && _currentRefs === refs) return _tableInstance;
  if (_tableInstance) {
    try {
      _tableInstance.destroy();
    } catch (e) {
    }
    _tableInstance = null;
  }
  _currentRefs = refs;
  _initPorts();
  _tableInstance = createTableEngine(refs.tableContainer, { cssPrefix: "p05-", columns: PANEL05_COLUMNS, pageSize: 25, virtualScroll: false, renderExpansion, contextMenuItems: PANEL05_CONTEXT_MENU, events: _getPort("eventBus") });
  _tableInstance.on("view", (data) => {
    if (_eventCallbacks.onView) _eventCallbacks.onView(data);
  });
  _tableInstance.on("edit", (data) => {
    if (_eventCallbacks.onEdit) _eventCallbacks.onEdit(data);
  });
  _tableInstance.on("delete", (data) => {
    if (_eventCallbacks.onDelete) _eventCallbacks.onDelete(data);
  });
  _tableInstance.on("context-action", (data) => {
    if (data.action === "ctx-fav" && _eventCallbacks.onToggleFavorito) _eventCallbacks.onToggleFavorito({ id: data.id });
    if (data.action === "ctx-copy") {
      const items = _tableInstance.getData();
      for (let i = 0; i < items.length; i++) {
        if (String(items[i].id) === data.id && items[i].cnpj && navigator.clipboard) {
          navigator.clipboard.writeText(items[i].cnpj);
          break;
        }
      }
    }
  });
  _tableInstance.on("selection-changed", (data) => {
    if (_eventCallbacks.onRowSelect) _eventCallbacks.onRowSelect(data);
  });
  _tableInstance.on("sorted", (data) => {
    if (_eventCallbacks.onSort) _eventCallbacks.onSort(data);
  });
  _tableInstance.on("page", (data) => {
    if (_eventCallbacks.onPage) _eventCallbacks.onPage(data);
  });
  _tableInstance.on("exported", (data) => {
    if (_eventCallbacks.onExport) _eventCallbacks.onExport(data);
  });
  return _tableInstance;
}
function registerCallbacks(callbacks) {
  _eventCallbacks = Object.assign({}, _eventCallbacks, callbacks);
}
function updateTable(refs, clientes, favoritos) {
  if (favoritos === void 0) favoritos = [];
  const instance = ensureInstance(refs);
  if (!instance) return;
  const items = [];
  const arr = clientes || [];
  for (let i = 0; i < arr.length; i++) {
    const n = normalize(arr[i]);
    if (n) items.push(n);
  }
  const favSet = {};
  const favArr = favoritos;
  for (let j = 0; j < favArr.length; j++) {
    favSet[String(favArr[j])] = true;
  }
  for (let k = 0; k < items.length; k++) {
    items[k]._isFavorito = !!favSet[items[k].id];
  }
  instance.setData(items);
}
function updatePagination(refs, pagination) {
}
function updateSort(refs, sort) {
  if (_tableInstance && sort && sort.field) {
    _tableInstance.sort(sort.field, sort.dir || "asc");
  }
}
function updateFavorito(refs, id, isFav) {
  if (!_tableInstance) return;
  const data = _tableInstance.getData();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i].id) === String(id)) {
      data[i]._isFavorito = isFav;
      if (_tableInstance.render) _tableInstance.render();
      break;
    }
  }
}
function updateSelection(refs, selectedIds) {
  if (!_tableInstance) return;
  _tableInstance.clearSelection();
  const ids = selectedIds || [];
  for (let i = 0; i < ids.length; i++) {
    _tableInstance.select(String(ids[i]));
  }
}
function clear() {
  if (_tableInstance) {
    try {
      _tableInstance.destroy();
    } catch (e) {
    }
    _tableInstance = null;
  }
  _currentRefs = null;
  _eventCallbacks = {};
}
function getInstance() {
  return _tableInstance;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, engine: "table-engine-global", hasInstance: !!_tableInstance, rowCount: _tableInstance ? _tableInstance.getData().length : 0, tableEngineInfo: _tableInstance?.info ? _tableInstance.info() : null };
}
function healthCheck() {
  const engineHealth = _tableInstance?.healthCheck ? _tableInstance.healthCheck() : { status: "N/A" };
  return { status: _tableInstance ? engineHealth.status : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { adapterReady: true, hasInstance: !!_tableInstance, engineHealthy: engineHealth.status === "HEALTHY" }, engineHealth };
}
var table_default = { updateTable, updatePagination, updateSort, updateFavorito, updateSelection, clear, registerCallbacks, getInstance, info, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  clear,
  table_default as default,
  getInstance,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  registerCallbacks,
  updateFavorito,
  updatePagination,
  updateSelection,
  updateSort,
  updateTable
};
