// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.3.1-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05/renderer/table
// PURPOSE: Renderiza a tabela de clientes do painel 05 em refs.tableContainer (+ paginação em refs.pagination)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES (contrato mantido 1:1 com a versão anterior):
//   updateTable(refs, clientes, favoritos) · updatePagination(refs, pagination) · updateSort(refs, sort)
//   updateFavorito(refs, id, isFav) · updateSelection(refs, ids) · clear() · registerCallbacks(cb) · getInstance()
//   info() · healthCheck() · VERSION · MODULE_ID · injectPorts() · getPorts()
//
// HISTÓRICO:
//   2026-09-16 (rodada frontend 05/16): a versão anterior delegava ao /components/table-engine (único consumidor era
//   este painel) e o engine quebra internamente em ui/render.js:16 ("state.get is not a function") → a tabela nunca
//   foi desenhada. Substituído por um renderizador local, declarativo, que usa as classes p05-table* do CSS do
//   painel e os data-action que handlers/events.ts já trata: cliente360 (linha), sort (cabeçalho), page (paginação),
//   toggle-fav (estrela). Sem seleção múltipla nem menu de contexto (o engine nunca os entregou de fato).
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createPanelPorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'panel-05.renderer.table';
const VERSION = '9.3.1-P2-ENTERPRISE';
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

type Row = Record<string, unknown> & { id: string; nome: string; cidade: string; uf: string; receita: number; status: string; cnpj: string; _isFavorito?: boolean };
type Sort = { field?: string; order?: string } | null;

const PANEL05_COLUMNS = [
  { id: 'nome', label: 'Empresa', sortable: true, sortField: 'Nome_Empresa' },
  { id: 'cnpj', label: 'CNPJ', sortable: false },
  { id: 'cidade', label: 'Cidade/UF', sortable: true, sortField: 'Municipio_Endereco' },
  { id: 'receita', label: 'Receita', sortable: true, sortField: 'Receita_Gerada' },
  { id: 'status', label: 'Status', sortable: true, sortField: 'Flag_Ativo' },
];

let _currentRefs: Record<string, unknown> | null = null;
let _rows: Row[] = [];
let _sort: Sort = null;
let _pagination: Record<string, unknown> | null = null;
let _eventCallbacks: Record<string, (...args: unknown[]) => void> = {};

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const fmtCurrency = (v: unknown) => { const n = Number(v); if (!isFinite(n)) return '—'; return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }); };
const fmtCNPJ = (v: unknown) => { const d = String(v ?? '').replace(/\D/g, ''); if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'); if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4'); return String(v ?? '') || '—'; };

function normalize(c: Record<string, unknown>): Row | null {
  if (!c) return null;
  return { id: String(c.Id_Organizacao || c.id), nome: String(c.Nome_Empresa || c.nome || ''), cidade: String(c.Municipio_Endereco || c.cidade || ''), uf: String(c.Uf_Endereco || c.uf || ''), receita: parseFloat(String(c.Receita_Gerada || c.receita || 0)) || 0, status: String(c.status || (Number(c.Flag_Ativo) === -1 ? 'ativo' : 'inativo')), cnpj: String(c.Cnpj || c.cnpj || ''), telefone: c.Telefone || c.telefone || '', email: c.Email || c.email || '', porte: c.Porte_Empresa || c.porte || '', razaoSocial: c.Razao_Social || c.razao_social || '' };
}

function _host(refs: Record<string, unknown> | null): HTMLElement | null {
  if (!refs || !refs.tableContainer) return null;
  const t = refs.tableContainer;
  return typeof t === 'string' ? (document.querySelector(t) as HTMLElement | null) : (t as HTMLElement);
}

function _renderHead(): string {
  return '<thead><tr>' + PANEL05_COLUMNS.map((col) => {
    const active = _sort && _sort.field === col.sortField;
    const arrow = active ? (_sort!.order === 'asc' ? ' ▲' : ' ▼') : '';
    return col.sortable
      ? `<th class="p05-th p05-th-sortable${active ? ' p05-th-active' : ''}" data-action="sort" data-sort="${col.sortField}" role="button" tabindex="0">${esc(col.label)}${arrow}</th>`
      : `<th class="p05-th">${esc(col.label)}</th>`;
  }).join('') + '<th class="p05-th p05-th-actions" aria-label="Ações"></th></tr></thead>';
}

function _renderRow(r: Row): string {
  const statusCls = r.status === 'ativo' ? 'p05-status-ativo' : 'p05-status-inativo';
  const fav = r._isFavorito ? '★' : '☆';
  return `<tr class="p05-row" data-id="${esc(r.id)}" data-action="cliente360" role="button" tabindex="0">
    <td class="p05-td p05-td-nome"><strong>${esc(r.nome)}</strong>${r.razaoSocial && r.razaoSocial !== r.nome ? `<br><small class="p05-muted">${esc(r.razaoSocial)}</small>` : ''}</td>
    <td class="p05-td p05-td-cnpj">${esc(fmtCNPJ(r.cnpj))}</td>
    <td class="p05-td p05-td-cidade">${esc([r.cidade, r.uf].filter(Boolean).join('/') || '—')}</td>
    <td class="p05-td p05-td-receita">${fmtCurrency(r.receita)}</td>
    <td class="p05-td p05-td-status"><span class="p05-status-badge ${statusCls}">${r.status === 'ativo' ? 'Ativo' : 'Inativo'}</span></td>
    <td class="p05-td p05-td-actions"><button type="button" class="p05-favorite-btn" data-action="toggle-fav" data-id="${esc(r.id)}" title="Favorito" aria-label="Favorito">${fav}</button></td>
  </tr>`;
}

function _render() {
  const host = _host(_currentRefs);
  if (!host) return;
  if (!_rows.length) { host.innerHTML = '<div class="p05-empty-state">Nenhum cliente encontrado.</div>'; return; }
  host.innerHTML = `<table class="p05-table" role="grid">${_renderHead()}<tbody>${_rows.map(_renderRow).join('')}</tbody></table>`;
}

function _renderPagination() {
  const el = _currentRefs?.pagination as HTMLElement | undefined;
  if (!el) return;
  const p = _pagination || {};
  const page = Number(p.page) || 1; const totalPages = Number(p.totalPages || p.total_pages) || 1; const total = Number(p.total) || 0;
  if (!total) { el.innerHTML = ''; return; }
  // .p05-btn-page é botão de ícone (32×32, styles/_table.pagination.css): só setas + aria-label; texto no .p05-pagination-current
  el.innerHTML = `<span class="p05-pagination-info">${total.toLocaleString('pt-BR')} clientes</span>
    <div class="p05-pagination-controls">
      <button type="button" class="p05-btn-page" data-action="page" data-page="${page - 1}" title="Página anterior" aria-label="Página anterior" ${page <= 1 ? 'disabled' : ''}>&#8249;</button>
      <span class="p05-pagination-current">Página ${page} de ${totalPages}</span>
      <button type="button" class="p05-btn-page" data-action="page" data-page="${page + 1}" title="Próxima página" aria-label="Próxima página" ${page >= totalPages ? 'disabled' : ''}>&#8250;</button>
    </div>`;
}

function registerCallbacks(callbacks: Record<string, (...args: unknown[]) => void>) { _eventCallbacks = Object.assign({}, _eventCallbacks, callbacks); }

function updateTable(refs: Record<string, unknown> | null, clientes: unknown, favoritos: unknown) {
  if (!refs) return;
  _initPorts();
  _currentRefs = refs;
  const favSet = new Set(((favoritos as unknown[]) || []).map((f) => String(f)));
  const arr = (clientes as Array<Record<string, unknown>>) || [];
  _rows = [];
  for (const c of arr) { const n = normalize(c); if (n) { n._isFavorito = favSet.has(n.id); _rows.push(n); } }
  _render();
  _renderPagination();
}

function updatePagination(refs: unknown, pagination: unknown) { if (refs) _currentRefs = refs as Record<string, unknown>; _pagination = (pagination as Record<string, unknown>) || null; _renderPagination(); }
function updateSort(refs: unknown, sort: Record<string, unknown> | null) { if (refs) _currentRefs = refs as Record<string, unknown>; _sort = sort as Sort; if (_rows.length) _render(); }
function updateFavorito(refs: unknown, id: unknown, isFav: boolean) { const r = _rows.find((x) => x.id === String(id)); if (r) { r._isFavorito = !!isFav; _render(); } }
function updateSelection(refs: unknown, selectedIds: unknown) { /* seleção múltipla não faz parte deste renderizador */ }
function clear() { const host = _host(_currentRefs); if (host) host.innerHTML = ''; const pg = _currentRefs?.pagination as HTMLElement | undefined; if (pg) pg.innerHTML = ''; _rows = []; _sort = null; _pagination = null; _currentRefs = null; _eventCallbacks = {}; }
function getInstance() { return _rows.length || _currentRefs ? { getData: () => _rows.slice(), rowCount: _rows.length } : null; }

function info() { return { moduleId: MODULE_ID, version: VERSION, engine: 'local', rowCount: _rows.length, hasRefs: !!_currentRefs, callbacks: Object.keys(_eventCallbacks) }; }
function healthCheck() { return { status: _currentRefs ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { hasRefs: !!_currentRefs, rows: _rows.length } }; }

export { updateTable, updatePagination, updateSort, updateFavorito, updateSelection, clear, registerCallbacks, getInstance, info, healthCheck, VERSION, MODULE_ID };
export default { updateTable, updatePagination, updateSort, updateFavorito, updateSelection, clear, registerCallbacks, getInstance, info, healthCheck, VERSION, MODULE_ID, injectPorts, getPorts };
