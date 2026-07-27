import { useEffect, useMemo, useRef, useState } from 'react';
import { useGridMultiSort, sortRowsMulti, comparatorsOf, trackTemplateW, useColumnState, type ColumnDef, type GridSortItem } from './dataGrid';
import { emptyFilters, rowPasses, activeChips, hasAnyFilter, type Filters } from './proposals/proposalFilters';
import { buildCsv, downloadCsv } from './proposals/exportCsv';

// Grid de dados REUTILIZÁVEL (Itens, Seções). Mesma mecânica/estilos do grid de Propostas
// (dataGrid.tsx + proposalFilters + exportCsv + classes .k-prop-grid), dirigido por config.
const SEL_W = 40;

export type BulkAction = {
  key: string;
  label: string;
  danger?: boolean;
  confirm?: (n: number) => string;               // msg de confirmação (window.confirm); ausente = sem confirmação
  perId: (id: number | string) => Promise<any>;  // ação por id (o grid itera com progresso)
};

export type DataGridProps<T = any> = {
  columns: ColumnDef<T>[];
  rows: T[];
  getRowId: (row: T) => number | string;
  storageKey: string;                             // prefixo p/ localStorage (cols/sort/pagesize)
  defaultSort: GridSortItem[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onReload?: () => void;                           // chamado após ações em massa
  emptyText?: string;
  search: { placeholder: string; predicate: (row: T, needle: string) => boolean; highlightText?: boolean };
  preFilter?: (row: T) => boolean;                // filtro externo (ex.: categoria/status no topo)
  toolbarLeft?: React.ReactNode;                  // slot à esquerda da busca (select de categoria/status…)
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;       // célula de ações fixa à direita
  actionsWidth?: number;
  selectable?: boolean;
  bulkActions?: BulkAction[];
  csvName?: string;                               // habilita "Exportar CSV" com este nome-base
  editRowId?: number | string | null;            // linha em edição inline
  renderEditRow?: (row: T) => React.ReactNode;   // conteúdo full-span da linha em edição
};

const norm = (s: any) => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function highlight(text: string, q: string) {
  const s = text || '';
  if (!q) return s;
  const i = s.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return s;
  return (<>{s.slice(0, i)}<mark className="k-hl">{s.slice(i, i + q.length)}</mark>{s.slice(i + q.length)}</>);
}

export function DataGrid<T = any>(props: DataGridProps<T>) {
  const { columns, rows, getRowId, storageKey, defaultSort, loading, error, onRetry, onReload,
    emptyText = 'Nada encontrado.', search, preFilter, toolbarLeft, onRowClick, rowActions,
    actionsWidth = 132, selectable, bulkActions, csvName, editRowId, renderEditRow } = props;

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [qInput, setQInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCols, setShowCols] = useState(false);
  const [busy, setBusy] = useState('');
  const [sel, setSel] = useState<Set<number | string>>(() => new Set());
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [liveW, setLiveW] = useState<Record<string, string> | null>(null);
  const [pageSize, setPageSize] = useState<number>(() => { const v = parseInt(localStorage.getItem(storageKey + '.pagesize') || '25', 10); return [10, 25, 50, 100].includes(v) ? v : 25; });
  const [page, setPage] = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);

  const { sorts, toggle, reset: resetSort } = useGridMultiSort(storageKey + '.sortm', defaultSort);
  const { st, ordered, visible: visibleCols, setHidden, move, setWidth, reset: resetCols } = useColumnState(storageKey + '.cols', columns);
  const comparators = useMemo(() => comparatorsOf(columns), [columns]);
  const filterCols = useMemo(() => visibleCols.filter((c) => c.filter), [visibleCols]);
  const widths = liveW || st.widths;

  const qTimer = useRef<any>(null);
  useEffect(() => {
    if (qTimer.current) clearTimeout(qTimer.current);
    qTimer.current = setTimeout(() => setFilters((f) => ({ ...f, q: qInput })), 220);
    return () => { if (qTimer.current) clearTimeout(qTimer.current); };
  }, [qInput]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); searchRef.current?.focus(); } }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);

  function setCol(key: string, val: any) { setFilters((f) => ({ ...f, byCol: { ...f.byCol, [key]: val } })); }
  function clearAll() { setFilters(emptyFilters()); setQInput(''); }
  function removeChip(id: string) {
    if (id === '__q') { setQInput(''); setFilters((f) => ({ ...f, q: '' })); return; }
    setFilters((f) => { const b = { ...f.byCol }; delete b[id]; return { ...f, byCol: b }; });
  }

  function startResize(e: React.MouseEvent, key: string) {
    e.preventDefault(); e.stopPropagation();
    const th = (e.currentTarget as HTMLElement).parentElement as HTMLElement;
    const startX = e.clientX; const startW = th.getBoundingClientRect().width; let finalW = startW;
    const onMove = (ev: MouseEvent) => { finalW = Math.max(60, startW + (ev.clientX - startX)); setLiveW({ ...st.widths, [key]: Math.round(finalW) + 'px' }); };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); document.body.style.userSelect = ''; setLiveW(null); setWidth(key, Math.round(finalW) + 'px'); };
    document.body.style.userSelect = 'none'; window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  }

  const preFiltered = useMemo(() => (preFilter ? rows.filter(preFilter) : rows), [rows, preFilter]);
  const filtered = useMemo(() => preFiltered.filter((r) => rowPasses(r, visibleCols, filters) && (!filters.q.trim() || search.predicate(r, filters.q.trim()))), [preFiltered, visibleCols, filters, search]);
  const sorted = useMemo(() => sortRowsMulti(filtered, sorts, comparators), [filtered, sorts, comparators]);
  const chips = activeChips(visibleCols, filters, {});
  const anyFilter = hasAnyFilter(visibleCols, filters);
  const qActive = filters.q.trim();

  useEffect(() => { setPage(1); }, [filters, sorts, pageSize, rows.length]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => sorted.slice((curPage - 1) * pageSize, curPage * pageSize), [sorted, curPage, pageSize]);
  function changePageSize(n: number) { setPageSize(n); try { localStorage.setItem(storageKey + '.pagesize', String(n)); } catch { /* noop */ } setPage(1); }

  const allSel = sorted.length > 0 && sorted.every((r) => sel.has(getRowId(r)));
  const someSel = sorted.some((r) => sel.has(getRowId(r)));
  const headChkRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (headChkRef.current) headChkRef.current.indeterminate = someSel && !allSel; }, [someSel, allSel]);
  function toggleOne(id: number | string) { setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function toggleAll() { setSel((s) => { const n = new Set(s); if (allSel) sorted.forEach((r) => n.delete(getRowId(r))); else sorted.forEach((r) => n.add(getRowId(r))); return n; }); }
  function clearSel() { setSel(new Set()); }

  async function runBulk(a: BulkAction) {
    const ids = [...sel];
    if (a.confirm && !window.confirm(a.confirm(ids.length))) return;
    let done = 0, fail = 0; setBusy(`${a.label}… 0/${ids.length}`);
    for (const id of ids) { try { await a.perId(id); } catch { fail++; } done++; setBusy(`${a.label}… ${done}/${ids.length}`); }
    setBusy(''); clearSel(); onReload?.();
  }

  function exportCsv() {
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    downloadCsv(`${csvName}-${stamp}.csv`, buildCsv(visibleCols, sorted));
  }

  function sortInfo(key: string) {
    const i = sorts.findIndex((s) => s.key === key);
    if (i === -1) return { arrow: '', idx: 0, aria: 'none' as const };
    return { arrow: sorts[i].dir === 'asc' ? '↑' : '↓', idx: sorts.length > 1 ? i + 1 : 0, aria: (sorts[i].dir === 'asc' ? 'ascending' : 'descending') as 'ascending' | 'descending' };
  }

  const gridTemplate = `${selectable ? SEL_W + 'px ' : ''}${trackTemplateW(visibleCols, widths)}${rowActions ? ' ' + actionsWidth + 'px' : ''}`;

  return (
    <>
      <div className="k-sec-toolbar">
        {toolbarLeft}
        <input ref={searchRef} className="k-input k-sec-search" value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder={search.placeholder + ' (Ctrl+F)'} />
        {filterCols.length > 0 && <button type="button" className={'k-btn-ghost k-filter-toggle' + (showFilters ? ' is-on' : '')} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>Filtros{anyFilter ? ' •' : ''}</button>}
        <button type="button" className={'k-btn-ghost k-filter-toggle' + (showCols ? ' is-on' : '')} onClick={() => setShowCols((v) => !v)} aria-expanded={showCols}>Colunas</button>
        {csvName && <button type="button" className="k-btn-ghost k-filter-toggle" onClick={exportCsv} disabled={sorted.length === 0}>Exportar CSV</button>}
        <span className="k-muted k-sm">{sorted.length} de {preFiltered.length}</span>
      </div>

      {showCols && (
        <div className="k-col-panel">
          <div className="k-col-panel-head"><strong>Colunas visíveis</strong><button type="button" className="k-btn-ghost k-sm" onClick={resetCols}>Restaurar padrão</button></div>
          <ul className="k-col-list">
            {ordered.map((c, i) => (
              <li key={c.key} className="k-col-item">
                <label className="k-col-check"><input type="checkbox" checked={!st.hidden.includes(c.key)} disabled={!!c.fixed} onChange={(e) => setHidden(c.key, !e.target.checked)} /><span>{c.label}{c.fixed ? ' (fixa)' : ''}</span></label>
                <span className="k-col-move">
                  <button type="button" className="k-icon-btn" title="Mover para cima" disabled={i === 0} onClick={() => move(c.key, ordered[i - 1]?.key ?? null)}>↑</button>
                  <button type="button" className="k-icon-btn" title="Mover para baixo" disabled={i === ordered.length - 1} onClick={() => move(c.key, ordered[i + 2]?.key ?? null)}>↓</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showFilters && filterCols.length > 0 && (
        <div className="k-filter-bar">
          {filterCols.map((c) => {
            const v = filters.byCol[c.key];
            if (c.filter === 'text') return (<label key={c.key} className="k-filter-field"><span>{c.label}</span><input className="k-input k-input-sm" value={v || ''} onChange={(e) => setCol(c.key, e.target.value)} placeholder="filtrar…" /></label>);
            if (c.filter === 'budget') return (<label key={c.key} className="k-filter-field"><span>{c.label}</span><select className="k-input k-input-sm" value={v || ''} onChange={(e) => setCol(c.key, e.target.value)}><option value="">Todos</option><option value="with">Sim</option><option value="without">Não</option></select></label>);
            if (c.filter === 'daterange') return (<label key={c.key} className="k-filter-field"><span>{c.label}</span><span className="k-filter-range"><input type="date" className="k-input k-input-sm" value={(v && v.from) || ''} onChange={(e) => setCol(c.key, { ...(v || {}), from: e.target.value })} /><input type="date" className="k-input k-input-sm" value={(v && v.to) || ''} onChange={(e) => setCol(c.key, { ...(v || {}), to: e.target.value })} /></span></label>);
            return null;
          })}
        </div>
      )}

      {chips.length > 0 && (
        <div className="k-chips k-filter-chips">
          {chips.map((ch) => (<span key={ch.id} className="k-chip k-chip-rm">{ch.label}<button type="button" className="k-chip-x" aria-label={'Remover ' + ch.label} onClick={() => removeChip(ch.id)}>×</button></span>))}
          <button type="button" className="k-btn-ghost k-sm" onClick={clearAll}>Limpar tudo</button>
        </div>
      )}

      {selectable && sel.size > 0 && (
        <div className="k-bulkbar">
          <span className="k-bulk-count">{sel.size} selecionada(s)</span>
          {(bulkActions || []).map((a) => (<button key={a.key} type="button" className={'k-btn-ghost k-sm' + (a.danger ? ' k-danger-ink' : '')} disabled={!!busy} onClick={() => runBulk(a)}>{a.label}</button>))}
          <button type="button" className="k-btn-ghost k-sm" onClick={clearSel}>Limpar seleção</button>
          {busy && <span className="k-muted k-sm">{busy}</span>}
        </div>
      )}

      <div className="k-prop-grid k-prop-grid-scroll" style={{ ['--cols' as any]: gridTemplate, ['--sel-w' as any]: SEL_W + 'px' }}>
        <div className="k-dg-head" role="row">
          {selectable && <span className="k-dg-th-wrap k-cell-sticky k-sticky-l k-dg-check" style={{ left: 0 }}><input ref={headChkRef} type="checkbox" checked={allSel} onChange={toggleAll} aria-label="Selecionar todas" /></span>}
          {visibleCols.map((c) => {
            const si = c.cmp ? sortInfo(c.key) : null;
            const stickyL = c.sticky === 'left';
            return (
              <div key={c.key} className={'k-dg-th-wrap' + (c.num ? ' k-dg-num' : '') + (dragOver === c.key ? ' is-drag-over' : '') + (stickyL ? ' k-cell-sticky k-sticky-l' : '')}
                style={stickyL ? { left: selectable ? 'var(--sel-w)' : 0 } : undefined}
                draggable onDragStart={() => setDragKey(c.key)} onDragEnd={() => { setDragKey(null); setDragOver(null); }}
                onDragOver={(e) => { e.preventDefault(); if (dragKey && dragKey !== c.key) setDragOver(c.key); }}
                onDragLeave={() => setDragOver((k) => (k === c.key ? null : k))}
                onDrop={(e) => { e.preventDefault(); if (dragKey) move(dragKey, c.key); setDragKey(null); setDragOver(null); }}>
                {si
                  ? <button type="button" aria-sort={si.aria} title="Clique para ordenar · Shift+clique adiciona critério · arraste para reordenar" onClick={(e) => toggle(c.key, e.shiftKey)} className={'k-dg-th' + (c.num ? ' k-dg-num' : '') + (si.arrow ? ' is-sorted' : '')}>{c.label}{si.arrow && <span className="k-dg-arrow">{si.arrow}</span>}{si.idx > 0 && <span className="k-sort-idx">{si.idx}</span>}</button>
                  : <span className={'k-dg-th k-dg-th-static' + (c.num ? ' k-dg-num' : '')}>{c.label}</span>}
                <span className="k-col-resizer" onMouseDown={(e) => startResize(e, c.key)} title="Arraste para redimensionar" />
              </div>
            );
          })}
          {rowActions && <span className="k-dg-th-wrap k-dg-th-static k-cell-sticky k-sticky-r k-dg-actions-h" style={{ right: 0 }}>Ações</span>}
        </div>
        <div className="k-dg-body" aria-busy={loading || undefined}>
          {loading && rows.length === 0 && (<div className="k-skel-wrap">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="k-skel-row"><span className="k-skel" /></div>)}</div>)}
          {!loading && error && rows.length === 0 && (<div className="k-state-err"><p>Não foi possível carregar.</p><p className="k-muted k-sm">{error}</p>{onRetry && <button type="button" className="k-btn" onClick={onRetry}>Tentar novamente</button>}</div>)}
          {!(error && rows.length === 0) && pageRows.map((r) => {
            const id = getRowId(r);
            if (editRowId != null && id === editRowId && renderEditRow) {
              return <div key={id} role="row" className="k-dg-row k-dg-editrow">{renderEditRow(r)}</div>;
            }
            const selected = sel.has(id);
            return (
              <div key={id} role="row" tabIndex={0} className={'k-dg-row' + (selected ? ' is-selected' : '') + (onRowClick ? '' : ' k-dg-row-noclick')}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                onKeyDown={(e) => { if (e.key === 'Enter' && onRowClick) onRowClick(r); else if (e.key === 'ArrowDown') { e.preventDefault(); (e.currentTarget.nextElementSibling as HTMLElement)?.focus?.(); } else if (e.key === 'ArrowUp') { e.preventDefault(); (e.currentTarget.previousElementSibling as HTMLElement)?.focus?.(); } }}>
                {selectable && <span className="k-dg-cell k-cell-sticky k-sticky-l k-dg-check" style={{ left: 0 }} onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected} onChange={() => toggleOne(id)} aria-label="Selecionar" /></span>}
                {visibleCols.map((c) => {
                  const spec = c.render(r);
                  const stickyL = c.sticky === 'left';
                  return (<span key={c.key} className={'k-dg-cell' + (c.num ? ' k-dg-num' : '') + (stickyL ? ' k-cell-sticky k-sticky-l' : '')} style={stickyL ? { left: selectable ? 'var(--sel-w)' : 0 } : undefined} title={spec.title || undefined}>{spec.badge ? <span className={'k-badge ' + spec.badge}>{spec.text}</span> : (search.highlightText ? highlight(spec.text, qActive) : spec.text)}</span>);
                })}
                {rowActions && <span className="k-dg-cell k-cell-sticky k-sticky-r k-dg-actions" style={{ right: 0 }} onClick={(e) => e.stopPropagation()}>{rowActions(r)}</span>}
              </div>
            );
          })}
          {!loading && !error && sorted.length === 0 && (<p className="k-muted k-acc-empty">{rows.length === 0 ? emptyText : 'Nada corresponde à busca/filtro.'}{rows.length > 0 && anyFilter && <> <button type="button" className="k-btn-ghost k-sm" onClick={clearAll}>Limpar filtros</button></>}</p>)}
        </div>
      </div>

      {!loading && !error && sorted.length > 0 && (
        <div className="k-pager">
          <label className="k-sm k-muted k-pager-size">Por página<select className="k-input k-input-sm" value={pageSize} onChange={(e) => changePageSize(parseInt(e.target.value, 10))}>{[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
          <span className="k-sm k-muted">Página {curPage} de {totalPages} · {sorted.length} registro(s)</span>
          <span className="k-pager-nav"><button type="button" className="k-icon-btn" title="Página anterior" disabled={curPage <= 1} onClick={() => setPage(curPage - 1)}>‹</button><button type="button" className="k-icon-btn" title="Próxima página" disabled={curPage >= totalPages} onClick={() => setPage(curPage + 1)}>›</button></span>
        </div>
      )}
      {sorts.length > 1 && <div className="k-muted k-sm k-sort-hint">Ordenação múltipla ativa ({sorts.length} critérios). <button type="button" className="k-btn-ghost k-sm" onClick={resetSort}>Redefinir</button></div>}
    </>
  );
}
