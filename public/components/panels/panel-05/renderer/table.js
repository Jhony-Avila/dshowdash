import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "panel-05.renderer.table";
const VERSION = "9.3.1-P2-ENTERPRISE";
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
const PANEL05_COLUMNS = [
  { id: "nome", label: "Empresa", sortable: true, sortField: "Nome_Empresa" },
  { id: "cnpj", label: "CNPJ", sortable: false },
  { id: "cidade", label: "Cidade/UF", sortable: true, sortField: "Municipio_Endereco" },
  { id: "receita", label: "Receita", sortable: true, sortField: "Receita_Gerada" },
  { id: "status", label: "Status", sortable: true, sortField: "Flag_Ativo" }
];
let _currentRefs = null;
let _rows = [];
let _sort = null;
let _pagination = null;
let _eventCallbacks = {};
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmtCurrency = (v) => {
  const n = Number(v);
  if (!isFinite(n)) return "\u2014";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
};
const fmtCNPJ = (v) => {
  const d = String(v ?? "").replace(/\D/g, "");
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  return String(v ?? "") || "\u2014";
};
function normalize(c) {
  if (!c) return null;
  return { id: String(c.Id_Organizacao || c.id), nome: String(c.Nome_Empresa || c.nome || ""), cidade: String(c.Municipio_Endereco || c.cidade || ""), uf: String(c.Uf_Endereco || c.uf || ""), receita: parseFloat(String(c.Receita_Gerada || c.receita || 0)) || 0, status: String(c.status || (Number(c.Flag_Ativo) === -1 ? "ativo" : "inativo")), cnpj: String(c.Cnpj || c.cnpj || ""), telefone: c.Telefone || c.telefone || "", email: c.Email || c.email || "", porte: c.Porte_Empresa || c.porte || "", razaoSocial: c.Razao_Social || c.razao_social || "" };
}
function _host(refs) {
  if (!refs || !refs.tableContainer) return null;
  const t = refs.tableContainer;
  return typeof t === "string" ? document.querySelector(t) : t;
}
function _renderHead() {
  return "<thead><tr>" + PANEL05_COLUMNS.map((col) => {
    const active = _sort && _sort.field === col.sortField;
    const arrow = active ? _sort.order === "asc" ? " \u25B2" : " \u25BC" : "";
    return col.sortable ? `<th class="p05-th p05-th-sortable${active ? " p05-th-active" : ""}" data-action="sort" data-sort="${col.sortField}" role="button" tabindex="0">${esc(col.label)}${arrow}</th>` : `<th class="p05-th">${esc(col.label)}</th>`;
  }).join("") + '<th class="p05-th p05-th-actions" aria-label="A\xE7\xF5es"></th></tr></thead>';
}
function _renderRow(r) {
  const statusCls = r.status === "ativo" ? "p05-status-ativo" : "p05-status-inativo";
  const fav = r._isFavorito ? "\u2605" : "\u2606";
  return `<tr class="p05-row" data-id="${esc(r.id)}" data-action="cliente360" role="button" tabindex="0">
    <td class="p05-td p05-td-nome"><strong>${esc(r.nome)}</strong>${r.razaoSocial && r.razaoSocial !== r.nome ? `<br><small class="p05-muted">${esc(r.razaoSocial)}</small>` : ""}</td>
    <td class="p05-td p05-td-cnpj">${esc(fmtCNPJ(r.cnpj))}</td>
    <td class="p05-td p05-td-cidade">${esc([r.cidade, r.uf].filter(Boolean).join("/") || "\u2014")}</td>
    <td class="p05-td p05-td-receita">${fmtCurrency(r.receita)}</td>
    <td class="p05-td p05-td-status"><span class="p05-status-badge ${statusCls}">${r.status === "ativo" ? "Ativo" : "Inativo"}</span></td>
    <td class="p05-td p05-td-actions"><button type="button" class="p05-favorite-btn" data-action="toggle-fav" data-id="${esc(r.id)}" title="Favorito" aria-label="Favorito">${fav}</button></td>
  </tr>`;
}
function _render() {
  const host = _host(_currentRefs);
  if (!host) return;
  if (!_rows.length) {
    host.innerHTML = '<div class="p05-empty-state">Nenhum cliente encontrado.</div>';
    return;
  }
  host.innerHTML = `<table class="p05-table" role="grid">${_renderHead()}<tbody>${_rows.map(_renderRow).join("")}</tbody></table>`;
}
function _renderPagination() {
  const el = _currentRefs?.pagination;
  if (!el) return;
  const p = _pagination || {};
  const page = Number(p.page) || 1;
  const totalPages = Number(p.totalPages || p.total_pages) || 1;
  const total = Number(p.total) || 0;
  if (!total) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = `<span class="p05-pagination-info">${total.toLocaleString("pt-BR")} clientes</span>
    <div class="p05-pagination-controls">
      <button type="button" class="p05-btn-page" data-action="page" data-page="${page - 1}" title="P\xE1gina anterior" aria-label="P\xE1gina anterior" ${page <= 1 ? "disabled" : ""}>&#8249;</button>
      <span class="p05-pagination-current">P\xE1gina ${page} de ${totalPages}</span>
      <button type="button" class="p05-btn-page" data-action="page" data-page="${page + 1}" title="Pr\xF3xima p\xE1gina" aria-label="Pr\xF3xima p\xE1gina" ${page >= totalPages ? "disabled" : ""}>&#8250;</button>
    </div>`;
}
function registerCallbacks(callbacks) {
  _eventCallbacks = Object.assign({}, _eventCallbacks, callbacks);
}
function updateTable(refs, clientes, favoritos) {
  if (!refs) return;
  _initPorts();
  _currentRefs = refs;
  const favSet = new Set((favoritos || []).map((f) => String(f)));
  const arr = clientes || [];
  _rows = [];
  for (const c of arr) {
    const n = normalize(c);
    if (n) {
      n._isFavorito = favSet.has(n.id);
      _rows.push(n);
    }
  }
  _render();
  _renderPagination();
}
function updatePagination(refs, pagination) {
  if (refs) _currentRefs = refs;
  _pagination = pagination || null;
  _renderPagination();
}
function updateSort(refs, sort) {
  if (refs) _currentRefs = refs;
  _sort = sort;
  if (_rows.length) _render();
}
function updateFavorito(refs, id, isFav) {
  const r = _rows.find((x) => x.id === String(id));
  if (r) {
    r._isFavorito = !!isFav;
    _render();
  }
}
function updateSelection(refs, selectedIds) {
}
function clear() {
  const host = _host(_currentRefs);
  if (host) host.innerHTML = "";
  const pg = _currentRefs?.pagination;
  if (pg) pg.innerHTML = "";
  _rows = [];
  _sort = null;
  _pagination = null;
  _currentRefs = null;
  _eventCallbacks = {};
}
function getInstance() {
  return _rows.length || _currentRefs ? { getData: () => _rows.slice(), rowCount: _rows.length } : null;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, engine: "local", rowCount: _rows.length, hasRefs: !!_currentRefs, callbacks: Object.keys(_eventCallbacks) };
}
function healthCheck() {
  return { status: _currentRefs ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { hasRefs: !!_currentRefs, rows: _rows.length } };
}
var table_default = { updateTable, updatePagination, updateSort, updateFavorito, updateSelection, clear, registerCallbacks, getInstance, info, healthCheck, VERSION, MODULE_ID, injectPorts, getPorts };
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
