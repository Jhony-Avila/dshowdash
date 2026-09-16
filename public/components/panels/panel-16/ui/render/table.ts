// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.3.1-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-16/ui/render/table
// PURPOSE: HTML da tabela de fornecedores (usado dentro do template de ui/render/index.ts)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   renderTable(state, data) — devolve HTML (é assim que ui/render/index.ts a chama)
//   renderTableInto(container, {columns, data, onRowClick, onSort}) — variante imperativa antiga (sem consumidor)
//   renderEmpty(hasFilters) — HTML do estado vazio
//
// HISTÓRICO:
//   2026-09-16 (rodada frontend 05/16): renderTable era IMPERATIVA (container, {columns, data}) e o template a
//   chamava como (state, displayData) esperando string (com um `as unknown as` escondendo o erro de tipo) →
//   `columns.map` de undefined lançava dentro do assinante do store (engolido por _notify) e a tabela nunca era
//   desenhada ("Nenhum fornecedor encontrado" com 50 itens no state). Agora renderTable devolve o HTML, com os
//   data-* que ui/events.ts já trata: .p16-row[data-id][data-idx], th[data-sort], data-action=select-row|view|
//   toggle-favorite|copy-doc.
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-16.ui.render.table';
export const VERSION = '9.3.1-P2-ENTERPRISE';

type Col = { id: string; label?: string; visible?: boolean; locked?: boolean; type?: string; align?: string; sortable?: boolean };
type Row = Record<string, unknown>;

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const fmtCurrency = (v: unknown) => { const n = parseFloat(String(v ?? '')); if (!isFinite(n)) return '-'; return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }); };
const fmtNumber = (v: unknown) => { const n = parseInt(String(v ?? ''), 10); return isFinite(n) ? n.toLocaleString('pt-BR') : '-'; };
const fmtDoc = (v: unknown) => { const d = String(v ?? '').replace(/\D/g, ''); if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'); if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4'); return String(v ?? '') || '-'; };
const has = (coll: unknown, id: string) => { if (!coll) return false; const c = coll as { has?: (x: string) => boolean; includes?: (x: string) => boolean }; if (typeof c.has === 'function') return c.has(id) || c.has(Number(id) as unknown as string); if (typeof c.includes === 'function') return c.includes(id) || c.includes(Number(id) as unknown as string); return false; };

function _cell(col: Col, row: Row, fav: boolean): string {
  const id = String(row.id ?? '');
  const align = col.align === 'right' ? ' p16-cell-right' : col.align === 'center' ? ' p16-cell-center' : '';
  switch (col.id) {
    case 'checkbox': return `<td class="p16-cell-checkbox"><input type="checkbox" data-action="select-row" data-id="${esc(id)}" aria-label="Selecionar"></td>`;
    case 'nome': return `<td class="p16-cell-name"><strong>${esc(row.nome)}</strong>${row.razao_social && row.razao_social !== row.nome ? `<br><small>${esc(row.razao_social)}</small>` : ''}</td>`;
    case 'cnpj': return `<td class="p16-cell-doc">${esc(fmtDoc(row.cnpj || row.cpf))}</td>`;
    case 'local': return `<td class="p16-cell-local">${esc(row.local || '-')}</td>`;
    case 'total_pago': return `<td class="p16-cell-valor${align}">${fmtCurrency(row.total_pago)}</td>`;
    case 'qtd_requisicoes': return `<td class="p16-cell-center">${fmtNumber(row.qtd_requisicoes ?? row.requisicoes)}</td>`;
    case 'pix': return `<td class="p16-cell-center">${row.pix ? `<span class="p16-badge p16-badge-ativo" title="${esc(row.pix)}">PIX</span>` : '-'}</td>`;
    case 'status': { const s = String(row.status || ''); const cls = s === 'Ativo' ? 'p16-badge-ativo' : s === 'Desatualizado' ? 'p16-badge-desatualizado' : 'p16-badge-inativo'; return `<td class="p16-cell-center"><span class="p16-badge ${cls}">${esc(s || '-')}</span></td>`; }
    case 'risco': { const r = String(row.risco || 'baixo'); return `<td class="p16-cell-center"><span class="p16-risco-indicator p16-risco-${esc(r)}" title="Risco ${esc(r)}"><span class="p16-risco-dot"></span></span></td>`; }
    case 'action': return `<td class="p16-cell-action"><button type="button" class="p16-btn-icon" data-action="view" data-id="${esc(id)}" title="Ver detalhes">👁</button> <button type="button" class="p16-btn-icon" data-action="toggle-favorite" data-id="${esc(id)}" title="Favorito">${fav ? '★' : '☆'}</button></td>`;
    default: return `<td class="p16-cell${align}">${esc(row[col.id] ?? '-')}</td>`;
  }
}

/** HTML da tabela — chamada por ui/render/index.ts como renderTable(state, displayData). */
export function renderTable(state: Record<string, unknown>, data: Row[]): string {
  const cols = ((state.columns as Col[]) || []).filter((c) => c && c.visible !== false);
  const sort = ((state.sortColumns as Array<{ column: string; direction: string }>) || [])[0];
  const thead = cols.map((c) => {
    const sortable = !!c.sortable && c.id !== 'checkbox' && c.id !== 'action';
    const active = sort && sort.column === c.id;
    const al = c.align === 'right' ? ' p16-th-right' : c.align === 'center' ? ' p16-th-center' : '';
    const cls = (c.id === 'checkbox' ? 'p16-th-checkbox' : '') + (sortable ? ' p16-th-sortable' : '') + al;
    return sortable
      ? `<th class="${cls.trim()}" data-sort="${esc(c.id)}" role="button" tabindex="0">${esc(c.label || '')}${active ? (sort.direction === 'asc' ? ' ▲' : ' ▼') : ''}</th>`
      : `<th class="${cls.trim()}">${esc(c.label || '')}</th>`;
  }).join('');
  const rows = (data || []).map((row, i) => {
    const id = String(row.id ?? '');
    const fav = has(state.favorites, id);
    const cls = ['p16-row', has(state.selectedRows, id) ? 'p16-row-selected' : '', state.focusedRowIndex === i ? 'p16-row-focused' : '', row.risco === 'alto' ? 'p16-row-critical' : row.risco === 'medio' ? 'p16-row-warning' : '', row.status === 'Desatualizado' ? 'p16-row-inactive' : ''].filter(Boolean).join(' ');
    return `<tr class="${cls}" data-id="${esc(id)}" data-idx="${i}" tabindex="0">${cols.map((c) => _cell(c, row, fav)).join('')}</tr>`;
  }).join('');
  return `<div class="p16-table-container"><table class="p16-table" role="grid"><thead><tr>${thead}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

/** Variante imperativa (contrato antigo). Sem consumidor no painel; mantida para compatibilidade. */
export function renderTableInto(container: HTMLElement, { columns, data, onRowClick, onSort }: { columns: Array<Record<string, unknown>>; data: Array<Record<string, unknown>>; onRowClick?: (row: Record<string, unknown>, idx: string) => void; onSort?: (key: string) => void }) {
  if (!container) return;
  const thead = (columns || []).map((col) => `<th data-key="${col.key}" class="${col.sortable ? 'sortable' : ''}">${col.label}</th>`).join('');
  const tbody = (data || []).map((row, i) => `<tr data-index="${i}">${(columns || []).map((col) => `<td>${row[col.key as string] ?? '-'}</td>`).join('')}</tr>`).join('');
  container.innerHTML = `<table class="data-table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
  if (onSort) container.querySelectorAll('th.sortable').forEach((th) => th.addEventListener('click', () => onSort((th as HTMLElement).dataset.key ?? '')));
  if (onRowClick) container.querySelectorAll('tbody tr').forEach((tr) => tr.addEventListener('click', () => onRowClick(data[parseInt((tr as HTMLElement).dataset.index ?? '0')], (tr as HTMLElement).dataset.index ?? '')));
}

export function renderEmpty(hasFilters: boolean): string {
  return `
        <div class="p16-empty-state">
            <i class="fas ${hasFilters ? 'fa-filter' : 'fa-inbox'}"></i>
            <p>${hasFilters ? 'Nenhum resultado encontrado para os filtros aplicados.' : 'Nenhum fornecedor encontrado.'}</p>
        </div>
    `;
}

export default { renderTable, renderTableInto, renderEmpty };
