// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P18EC-ES6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05.renderer.table
// PURPOSE: Adapter entre Panel-05 e /components/table-engine
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts — from '/core/runtime/ports-profiles.js'
//   create (as createTableEngine), TABLE_EVENTS — from '/components/table-engine/index.js'
//
// PROVIDES:
//   ensureInstance(refs) — cria/retorna instância table-engine
//   registerCallbacks(callbacks) — registra callbacks de eventos
//   updateTable(refs, clientes, favoritos) — atualiza dados da tabela
//   normalize(c) — normaliza dados de cliente
//   injectPorts(p) / getPorts() — ports API
//   MODULE_ID, VERSION — constantes
//
// RECEIVES (via init/options): refs (com refs.tableContainer)
// EMITS (eventos):
//   view, edit, delete, context-action, selection-changed, sorted,
//   page, exported — via table-engine callbacks
// LISTENS (eventos): nenhum
// WINDOW ACCESS: navigator.clipboard (copiar CNPJ)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { create as createTableEngine, TABLE_EVENTS } from '/components/table-engine/index.js';

const MODULE_ID = 'panel-05.renderer.table';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

type TableInstance = {
  destroy: () => void;
  on: (event: string, cb: (data: Record<string, unknown>) => void) => void;
  setData: (items: Array<Record<string, unknown>>) => void;
  getData: () => Array<Record<string, unknown>>;
  clearSelection: () => void;
  select: (id: string) => void;
  sort: (field: unknown, dir: unknown) => void;
  render?: () => void;
  info?: () => unknown;
  healthCheck?: () => { status: string };
};

let _tableInstance: TableInstance | null = null;
let _currentRefs: Record<string, unknown> | null = null;
let _eventCallbacks: Record<string, (...args: unknown[]) => void> = {};

const PANEL05_COLUMNS = [
  { id: 'nome', label: 'Empresa', sortable: true, searchable: true, exportable: true },
  { id: 'cnpj', label: 'CNPJ', sortable: true, searchable: true, exportable: true, type: 'cnpj' },
  { id: 'cidade', label: 'Cidade/UF', sortable: true, searchable: true, exportable: true },
  { id: 'receita', label: 'Receita', sortable: true, exportable: true, type: 'currency' },
  { id: 'status', label: 'Status', sortable: true, exportable: true, type: 'status' }
];

function normalize(c: Record<string, unknown>) {
  if (!c) return null;
  return { id: String(c.Id_Organizacao || c.id), nome: c.Nome_Empresa || c.nome || '', cidade: c.Municipio_Endereco || c.cidade || '', uf: c.Uf_Endereco || c.uf || '', receita: parseFloat(String(c.Receita_Gerada || c.receita || 0)), status: c.status || (c.Flag_Ativo === -1 ? 'ativo' : 'inativo'), cnpj: c.Cnpj || c.cnpj || '', telefone: c.Telefone || c.telefone || '', email: c.Email || c.email || '', porte: c.Porte_Empresa || c.porte || '', aReceber: parseFloat(String(c.A_Receber || c.aReceber || 0)), ultimaCompra: c.Ultima_Compra || c.ultimaCompra || null, risco: c.Risco || c.risco || '', cep: c.Cep_Endereco || c.cep || '', bairro: c.Bairro_Endereco || c.bairro || '' };
}

function renderExpansion(item: Record<string, unknown>, opts: Record<string, unknown>) {
  const p = opts.cssPrefix; const fmt = opts.formatters as Record<string, (v: unknown) => string>;
  const esc = fmt.escapeHtml || ((v: unknown) => String(v));
  const fmtCurrency = fmt.formatCurrency || ((v: unknown) => `R$ ${v}`);
  const fmtDate = fmt.formatDate || ((v: unknown) => String(v));
  const fmtCNPJ = fmt.formatCNPJ || ((v: unknown) => String(v));
  const fmtPhone = fmt.formatPhone || ((v: unknown) => String(v));
  const waLink = item.telefone ? `https://wa.me/55${String(item.telefone).replace(/\D/g, '')}` : null;
  return `<div class="${p}expansion-content"><div class="${p}expansion-grid"><div class="${p}expansion-section"><h4>Dados Gerais</h4><div class="${p}expansion-item"><span class="${p}expansion-label">CNPJ</span><span class="${p}expansion-value">${item.cnpj ? fmtCNPJ(item.cnpj) : '—'}</span></div><div class="${p}expansion-item"><span class="${p}expansion-label">Telefone</span><span class="${p}expansion-value">${item.telefone ? fmtPhone(item.telefone) : '—'}</span></div><div class="${p}expansion-item"><span class="${p}expansion-label">Email</span><span class="${p}expansion-value">${esc(item.email) || '—'}</span></div><div class="${p}expansion-item"><span class="${p}expansion-label">Porte</span><span class="${p}expansion-value">${esc(item.porte) || '—'}</span></div></div><div class="${p}expansion-section"><h4>Financeiro</h4><div class="${p}expansion-item"><span class="${p}expansion-label">Receita</span><span class="${p}expansion-value">${fmtCurrency(item.receita)}</span></div><div class="${p}expansion-item"><span class="${p}expansion-label">A Receber</span><span class="${p}expansion-value">${fmtCurrency(item.aReceber || 0)}</span></div><div class="${p}expansion-item"><span class="${p}expansion-label">Última Compra</span><span class="${p}expansion-value">${item.ultimaCompra ? fmtDate(item.ultimaCompra) : '—'}</span></div><div class="${p}expansion-item"><span class="${p}expansion-label">Risco</span><span class="${p}expansion-value">${esc(item.risco) || '—'}</span></div></div><div class="${p}expansion-section"><h4>Endereço</h4><div class="${p}expansion-item"><span class="${p}expansion-label">Cidade/UF</span><span class="${p}expansion-value">${esc(item.cidade) || '—'}${item.uf ? `/${item.uf}` : ''}</span></div><div class="${p}expansion-item"><span class="${p}expansion-label">CEP</span><span class="${p}expansion-value">${esc(item.cep) || '—'}</span></div><div class="${p}expansion-item"><span class="${p}expansion-label">Bairro</span><span class="${p}expansion-value">${esc(item.bairro) || '—'}</span></div></div></div><div class="${p}expansion-actions"><button class="${p}expansion-btn ${p}expansion-btn-primary" data-action="view-cliente" data-id="${item.id}">👁 Ver Completo</button><button class="${p}expansion-btn" data-action="copy-cnpj" data-cnpj="${item.cnpj || ''}">📋 Copiar CNPJ</button>${waLink ? `<a href="${waLink}" target="_blank" class="${p}expansion-btn">💬 WhatsApp</a>` : ''}</div></div>`;
}

const PANEL05_CONTEXT_MENU = [
  { action: 'ctx-view', label: 'Ver detalhes', icon: '👁', key: 'V' },
  { action: 'ctx-edit', label: 'Editar', icon: '✏️', key: 'E' },
  { action: 'ctx-expand', label: 'Expandir', icon: '⬇', key: 'X' },
  { divider: true },
  { action: 'ctx-fav', label: 'Favoritar', icon: '⭐', key: 'F' },
  { action: 'ctx-copy', label: 'Copiar CNPJ', icon: '📋' },
  { divider: true },
  { action: 'ctx-delete', label: 'Excluir', icon: '🗑', key: 'D', danger: true }
];

function ensureInstance(refs: Record<string, unknown> | null) {
  if (!refs || !refs.tableContainer) return null;
  if (_tableInstance && _currentRefs === refs) return _tableInstance;
  if (_tableInstance) { try { _tableInstance.destroy(); } catch (e) {} _tableInstance = null; }
  _currentRefs = refs; _initPorts();
  _tableInstance = createTableEngine(refs.tableContainer as string | HTMLElement, { cssPrefix: 'p05-', columns: PANEL05_COLUMNS, pageSize: 25, virtualScroll: false, renderExpansion, contextMenuItems: PANEL05_CONTEXT_MENU, events: _getPort('eventBus') }) as unknown as TableInstance;
  _tableInstance.on('view', (data: Record<string, unknown>) => { if (_eventCallbacks.onView) _eventCallbacks.onView(data); });
  _tableInstance.on('edit', (data: Record<string, unknown>) => { if (_eventCallbacks.onEdit) _eventCallbacks.onEdit(data); });
  _tableInstance.on('delete', (data: Record<string, unknown>) => { if (_eventCallbacks.onDelete) _eventCallbacks.onDelete(data); });
  _tableInstance.on('context-action', (data: Record<string, unknown>) => { if (data.action === 'ctx-fav' && _eventCallbacks.onToggleFavorito) _eventCallbacks.onToggleFavorito({ id: data.id }); if (data.action === 'ctx-copy') { const items = _tableInstance!.getData(); for (let i = 0; i < items.length; i++) { if (String(items[i].id) === data.id && items[i].cnpj && navigator.clipboard) { navigator.clipboard.writeText(items[i].cnpj as string); break; } } } });
  _tableInstance.on('selection-changed', (data: Record<string, unknown>) => { if (_eventCallbacks.onRowSelect) _eventCallbacks.onRowSelect(data); });
  _tableInstance.on('sorted', (data: Record<string, unknown>) => { if (_eventCallbacks.onSort) _eventCallbacks.onSort(data); });
  _tableInstance.on('page', (data: Record<string, unknown>) => { if (_eventCallbacks.onPage) _eventCallbacks.onPage(data); });
  _tableInstance.on('exported', (data: Record<string, unknown>) => { if (_eventCallbacks.onExport) _eventCallbacks.onExport(data); });
  return _tableInstance;
}

function registerCallbacks(callbacks: Record<string, (...args: unknown[]) => void>) { _eventCallbacks = Object.assign({}, _eventCallbacks, callbacks); }

function updateTable(refs: Record<string, unknown> | null, clientes: unknown, favoritos: unknown) {
  if (favoritos === undefined) favoritos = [];
  const instance = ensureInstance(refs);
  if (!instance) return;
  const items: Array<Record<string, unknown>> = []; const arr = (clientes as Array<Record<string, unknown>>) || [];
  for (let i = 0; i < arr.length; i++) { const n = normalize(arr[i]); if (n) items.push(n); }
  const favSet: Record<string, boolean> = {}; const favArr = (favoritos as string[]); for (let j = 0; j < favArr.length; j++) { favSet[String(favArr[j])] = true; }
  for (let k = 0; k < items.length; k++) { items[k]._isFavorito = !!favSet[items[k].id as string]; }
  instance.setData(items);
}

function updatePagination(refs: unknown, pagination: unknown) {}
function updateSort(refs: unknown, sort: Record<string, unknown> | null) { if (_tableInstance && sort && sort.field) { _tableInstance.sort(sort.field, sort.dir || 'asc'); } }
function updateFavorito(refs: unknown, id: unknown, isFav: boolean) { if (!_tableInstance) return; const data = _tableInstance.getData(); for (let i = 0; i < data.length; i++) { if (String(data[i].id) === String(id)) { data[i]._isFavorito = isFav; if (_tableInstance.render) _tableInstance.render(); break; } } }
function updateSelection(refs: unknown, selectedIds: unknown) { if (!_tableInstance) return; _tableInstance.clearSelection(); const ids = (selectedIds || []) as unknown[]; for (let i = 0; i < ids.length; i++) { _tableInstance.select(String(ids[i])); } }
function clear() { if (_tableInstance) { try { _tableInstance.destroy(); } catch (e) {} _tableInstance = null; } _currentRefs = null; _eventCallbacks = {}; }
function getInstance() { return _tableInstance; }

function info() { return { moduleId: MODULE_ID, version: VERSION, engine: 'table-engine-global', hasInstance: !!_tableInstance, rowCount: _tableInstance ? _tableInstance.getData().length : 0, tableEngineInfo: _tableInstance?.info ? _tableInstance.info() : null }; }
function healthCheck() { const engineHealth = _tableInstance?.healthCheck ? _tableInstance.healthCheck() : { status: 'N/A' }; return { status: _tableInstance ? engineHealth.status : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { adapterReady: true, hasInstance: !!_tableInstance, engineHealthy: engineHealth.status === 'HEALTHY' }, engineHealth }; }

export { updateTable, updatePagination, updateSort, updateFavorito, updateSelection, clear, registerCallbacks, getInstance, info, healthCheck, VERSION, MODULE_ID };
export default { updateTable, updatePagination, updateSort, updateFavorito, updateSelection, clear, registerCallbacks, getInstance, info, healthCheck, injectPorts, getPorts };
