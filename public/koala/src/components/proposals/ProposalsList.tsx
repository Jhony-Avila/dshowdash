import { useEffect, useMemo, useRef, useState } from 'react';
import { apiGet, apiSend } from '../../api/client';
import { STATUS_LABELS } from './status';
import { useGridMultiSort, sortRowsMulti, comparatorsOf, trackTemplateW, useColumnState } from '../dataGrid';
import { PROPOSAL_COLUMNS } from './proposalColumns';
import { emptyFilters, rowPasses, activeChips, hasAnyFilter, type Filters } from './proposalFilters';
import { buildCsv, downloadCsv } from './exportCsv';

const SL = STATUS_LABELS;
const SEL_W = 40;   // largura (px) da coluna de seleção (fixa à esquerda)
const ACT_W = 132;  // largura (px) da coluna de ações (fixa à direita)

// Realça (case-insensitive) a ocorrência do termo de busca no texto da célula.
function highlight(text: string, q: string) {
  const s = text || '';
  if (!q) return s;
  const i = s.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return s;
  return (<>{s.slice(0, i)}<mark className="k-hl">{s.slice(i, i + q.length)}</mark>{s.slice(i + q.length)}</>);
}

// Datagrid de Propostas — colunas/filtros/estado/seleção via config declarativa.
export function ProposalsList({ onOpen }: { onOpen: (id: number) => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [qInput, setQInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCols, setShowCols] = useState(false);
  const [sel, setSel] = useState<Set<number>>(() => new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [liveW, setLiveW] = useState<Record<string, string> | null>(null);
  const [pageSize, setPageSize] = useState<number>(() => { const v = parseInt(localStorage.getItem('koala.proposals.pagesize') || '25', 10); return [10, 25, 50, 100].includes(v) ? v : 25; });
  const [page, setPage] = useState(1);

  const { sorts, toggle, reset: resetSort } = useGridMultiSort('koala.proposals.sortm', [{ key: 'number', dir: 'desc' }]);
  const { st, ordered, visible: visibleCols, setHidden, move, setWidth, reset: resetCols } = useColumnState('koala.proposals.cols', PROPOSAL_COLUMNS);

  const comparators = useMemo(() => comparatorsOf(PROPOSAL_COLUMNS), []);
  const filterCols = useMemo(() => visibleCols.filter((c) => c.filter && c.key !== 'status'), [visibleCols]);
  const statusVal = filters.byCol.status || '';
  const widths = liveW || st.widths;

  async function load() {
    setLoading(true);
    try { setRows(await apiGet('/proposals')); setErr(''); setMsg(''); }
    catch (e: any) { setErr(e.message || 'Falha ao carregar propostas'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  // Atalho Ctrl/Cmd+F → foca a busca.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); searchRef.current?.focus(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Debounce da busca global (220ms).
  const qTimer = useRef<any>(null);
  useEffect(() => {
    if (qTimer.current) clearTimeout(qTimer.current);
    qTimer.current = setTimeout(() => setFilters((f) => ({ ...f, q: qInput })), 220);
    return () => { if (qTimer.current) clearTimeout(qTimer.current); };
  }, [qInput]);

  function setCol(key: string, val: any) { setFilters((f) => ({ ...f, byCol: { ...f.byCol, [key]: val } })); }
  function clearAll() { setFilters(emptyFilters()); setQInput(''); }
  function removeChip(id: string) {
    if (id === '__q') { setQInput(''); setFilters((f) => ({ ...f, q: '' })); return; }
    setFilters((f) => { const b = { ...f.byCol }; delete b[id]; return { ...f, byCol: b }; });
  }

  async function novo() {
    try { const p = await apiSend('POST', '/proposals', {}); onOpen(p.id); }
    catch (e: any) { setMsg('Erro: ' + e.message); }
  }

  // Redimensionamento por arraste na borda do header (commit em localStorage só no mouseup).
  function startResize(e: React.MouseEvent, key: string) {
    e.preventDefault(); e.stopPropagation();
    const th = (e.currentTarget as HTMLElement).parentElement as HTMLElement;
    const startX = e.clientX; const startW = th.getBoundingClientRect().width;
    let finalW = startW;
    const onMove = (ev: MouseEvent) => { finalW = Math.max(60, startW + (ev.clientX - startX)); setLiveW({ ...st.widths, [key]: Math.round(finalW) + 'px' }); };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = ''; setLiveW(null); setWidth(key, Math.round(finalW) + 'px');
    };
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  }

  const filtered = useMemo(() => rows.filter((r) => rowPasses(r, visibleCols, filters)), [rows, visibleCols, filters]);
  const sorted = useMemo(() => sortRowsMulti(filtered, sorts, comparators), [filtered, sorts, comparators]);
  const chips = activeChips(visibleCols, filters, SL);
  const anyFilter = hasAnyFilter(visibleCols, filters);
  const qActive = filters.q.trim();

  // Paginação client-side. Reseta p/ pág.1 quando o resultado muda.
  useEffect(() => { setPage(1); }, [filters, sorts, pageSize, rows.length]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => sorted.slice((curPage - 1) * pageSize, curPage * pageSize), [sorted, curPage, pageSize]);
  function changePageSize(n: number) { setPageSize(n); try { localStorage.setItem('koala.proposals.pagesize', String(n)); } catch { /* noop */ } setPage(1); }

  // ── Seleção múltipla (sobre o resultado filtrado/ordenado) ──
  const allSel = sorted.length > 0 && sorted.every((r) => sel.has(r.id));
  const someSel = sorted.some((r) => sel.has(r.id));
  const headChkRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (headChkRef.current) headChkRef.current.indeterminate = someSel && !allSel; }, [someSel, allSel]);
  function toggleOne(id: number) { setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function toggleAll() { setSel((s) => { if (allSel) { const n = new Set(s); sorted.forEach((r) => n.delete(r.id)); return n; } const n = new Set(s); sorted.forEach((r) => n.add(r.id)); return n; }); }
  function clearSel() { setSel(new Set()); }

  // ── Ações em massa (iteram os endpoints existentes por id, com progresso) ──
  async function runBulk(ids: number[], label: string, fn: (id: number) => Promise<any>) {
    let done = 0; let fail = 0;
    setBusy(`${label} 0/${ids.length}…`);
    for (const id of ids) { try { await fn(id); } catch { fail++; } done++; setBusy(`${label} ${done}/${ids.length}…`); }
    setBusy(''); clearSel(); await load();
    if (fail) setMsg(`${label}: ${fail} de ${ids.length} falharam.`);
  }
  function bulkApplyStatus() {
    if (!bulkStatus) return;
    const ids = [...sel];
    runBulk(ids, `Alterando status para "${SL[bulkStatus] || bulkStatus}"`, (id) => apiSend('POST', `/proposals/${id}/status`, { status: bulkStatus }));
  }
  function bulkDelete() {
    const ids = [...sel];
    if (!window.confirm(`Excluir ${ids.length} proposta(s) selecionada(s)? (soft-delete — recuperável pelo gestor)`)) return;
    runBulk(ids, 'Excluindo', (id) => apiSend('POST', `/proposals/${id}/delete-for-user`, {}));
  }

  // ── Ações por linha ──
  function actOpen(e: React.MouseEvent, id: number) { e.stopPropagation(); onOpen(id); }
  function actPdf(e: React.MouseEvent, id: number) { e.stopPropagation(); window.open(`/api/koala/proposals/${id}/pdf`, '_blank', 'noopener'); }
  async function actDuplicate(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    setBusy('Duplicando…');
    try { const p = await apiSend('POST', `/proposals/${id}/duplicate`, {}); setBusy(''); await load(); onOpen(p.id); }
    catch (err: any) { setBusy(''); setMsg('Erro ao duplicar: ' + err.message); }
  }
  async function actDelete(e: React.MouseEvent, r: any) {
    e.stopPropagation();
    if (!window.confirm(`Excluir a proposta ${r.proposal_number}? (soft-delete — recuperável pelo gestor)`)) return;
    setBusy('Excluindo…');
    try { await apiSend('POST', `/proposals/${r.id}/delete-for-user`, {}); setBusy(''); await load(); }
    catch (err: any) { setBusy(''); setMsg('Erro ao excluir: ' + err.message); }
  }

  // Exportação CSV do resultado filtrado (which='all') ou só das selecionadas ('sel'),
  // sempre respeitando as colunas VISÍVEIS e sua ordem atual.
  function exportCsv(which: 'all' | 'sel') {
    const data = which === 'sel' ? sorted.filter((r) => sel.has(r.id)) : sorted;
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    downloadCsv(`propostas-${stamp}.csv`, buildCsv(visibleCols, data));
  }

  function sortInfo(key: string) {
    const i = sorts.findIndex((s) => s.key === key);
    if (i === -1) return { arrow: '', idx: 0, aria: 'none' as const };
    return { arrow: sorts[i].dir === 'asc' ? '↑' : '↓', idx: sorts.length > 1 ? i + 1 : 0,
      aria: (sorts[i].dir === 'asc' ? 'ascending' : 'descending') as 'ascending' | 'descending' };
  }

  const gridTemplate = `${SEL_W}px ${trackTemplateW(visibleCols, widths)} ${ACT_W}px`;

  return (
    <div className="k-card">
      <div className="k-list-head">
        <h2>Propostas</h2>
        <button className="k-btn" onClick={novo}>+ Nova Proposta</button>
      </div>
      {msg && <div className="k-msg k-msg-err">{msg}</div>}

      <div className="k-sec-toolbar">
        <select className="k-input" value={statusVal} onChange={(e) => setCol('status', e.target.value)}>
          <option value="">Todos os status</option>
          {Object.keys(SL).map((s) => <option key={s} value={s}>{SL[s]}</option>)}
        </select>
        <input ref={searchRef} className="k-input k-sec-search" value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Buscar por número, título ou cliente… (Ctrl+F)" />
        <button type="button" className={'k-btn-ghost k-filter-toggle' + (showFilters ? ' is-on' : '')} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>Filtros{anyFilter ? ' •' : ''}</button>
        <button type="button" className={'k-btn-ghost k-filter-toggle' + (showCols ? ' is-on' : '')} onClick={() => setShowCols((v) => !v)} aria-expanded={showCols}>Colunas</button>
        <button type="button" className="k-btn-ghost k-filter-toggle" onClick={() => exportCsv('all')} disabled={sorted.length === 0} title="Exportar o resultado filtrado (colunas visíveis)">Exportar CSV</button>
        <span className="k-muted k-sm">{sorted.length} de {rows.length}</span>
      </div>

      {showCols && (
        <div className="k-col-panel">
          <div className="k-col-panel-head"><strong>Colunas visíveis</strong><button type="button" className="k-btn-ghost k-sm" onClick={resetCols}>Restaurar padrão</button></div>
          <ul className="k-col-list">
            {ordered.map((c, i) => (
              <li key={c.key} className="k-col-item">
                <label className="k-col-check">
                  <input type="checkbox" checked={!st.hidden.includes(c.key)} disabled={!!c.fixed} onChange={(e) => setHidden(c.key, !e.target.checked)} />
                  <span>{c.label}{c.fixed ? ' (fixa)' : ''}</span>
                </label>
                <span className="k-col-move">
                  <button type="button" className="k-icon-btn" title="Mover para cima" disabled={i === 0} onClick={() => move(c.key, ordered[i - 1]?.key ?? null)}>↑</button>
                  <button type="button" className="k-icon-btn" title="Mover para baixo" disabled={i === ordered.length - 1} onClick={() => move(c.key, ordered[i + 2]?.key ?? null)}>↓</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showFilters && (
        <div className="k-filter-bar">
          {filterCols.map((c) => {
            const v = filters.byCol[c.key];
            if (c.filter === 'text') return (
              <label key={c.key} className="k-filter-field"><span>{c.label}</span>
                <input className="k-input k-input-sm" value={v || ''} onChange={(e) => setCol(c.key, e.target.value)} placeholder="filtrar…" /></label>
            );
            if (c.filter === 'budget') return (
              <label key={c.key} className="k-filter-field"><span>{c.label}</span>
                <select className="k-input k-input-sm" value={v || ''} onChange={(e) => setCol(c.key, e.target.value)}>
                  <option value="">Todos</option><option value="with">Com vínculo</option><option value="without">Sem vínculo</option></select></label>
            );
            if (c.filter === 'daterange') return (
              <label key={c.key} className="k-filter-field"><span>{c.label}</span>
                <span className="k-filter-range">
                  <input type="date" className="k-input k-input-sm" value={(v && v.from) || ''} onChange={(e) => setCol(c.key, { ...(v || {}), from: e.target.value })} />
                  <input type="date" className="k-input k-input-sm" value={(v && v.to) || ''} onChange={(e) => setCol(c.key, { ...(v || {}), to: e.target.value })} /></span></label>
            );
            return null;
          })}
        </div>
      )}

      {chips.length > 0 && (
        <div className="k-chips k-filter-chips">
          {chips.map((ch) => (
            <span key={ch.id} className="k-chip k-chip-rm">{ch.label}
              <button type="button" className="k-chip-x" aria-label={'Remover ' + ch.label} onClick={() => removeChip(ch.id)}>×</button></span>
          ))}
          <button type="button" className="k-btn-ghost k-sm" onClick={clearAll}>Limpar tudo</button>
        </div>
      )}

      {/* Barra de ações em massa — só aparece com ≥1 selecionada */}
      {sel.size > 0 && (
        <div className="k-bulkbar">
          <span className="k-bulk-count">{sel.size} selecionada(s)</span>
          <select className="k-input k-input-sm" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
            <option value="">Alterar status…</option>
            {Object.keys(SL).map((s) => <option key={s} value={s}>{SL[s]}</option>)}
          </select>
          <button type="button" className="k-btn-ghost k-sm" disabled={!bulkStatus || !!busy} onClick={bulkApplyStatus}>Aplicar</button>
          <button type="button" className="k-btn-ghost k-sm k-danger-ink" disabled={!!busy} onClick={bulkDelete}>Excluir selecionadas</button>
          <button type="button" className="k-btn-ghost k-sm" onClick={() => exportCsv('sel')}>Exportar selecionadas</button>
          <button type="button" className="k-btn-ghost k-sm" onClick={clearSel}>Limpar seleção</button>
          {busy && <span className="k-muted k-sm">{busy}</span>}
        </div>
      )}

      <div className="k-prop-grid k-prop-grid-scroll" style={{ ['--cols' as any]: gridTemplate, ['--sel-w' as any]: SEL_W + 'px' }}>
        <div className="k-dg-head" role="row">
          <span className="k-dg-th-wrap k-cell-sticky k-sticky-l k-dg-check" style={{ left: 0 }}>
            <input ref={headChkRef} type="checkbox" checked={allSel} onChange={toggleAll} aria-label="Selecionar todas" title="Selecionar todas (do filtro atual)" />
          </span>
          {visibleCols.map((c) => {
            const si = c.cmp ? sortInfo(c.key) : null;
            const stickyL = c.sticky === 'left';
            return (
              <div key={c.key}
                className={'k-dg-th-wrap' + (c.num ? ' k-dg-num' : '') + (dragOver === c.key ? ' is-drag-over' : '') + (stickyL ? ' k-cell-sticky k-sticky-l' : '')}
                style={stickyL ? { left: 'var(--sel-w)' } : undefined}
                draggable onDragStart={() => setDragKey(c.key)} onDragEnd={() => { setDragKey(null); setDragOver(null); }}
                onDragOver={(e) => { e.preventDefault(); if (dragKey && dragKey !== c.key) setDragOver(c.key); }}
                onDragLeave={() => setDragOver((k) => (k === c.key ? null : k))}
                onDrop={(e) => { e.preventDefault(); if (dragKey) move(dragKey, c.key); setDragKey(null); setDragOver(null); }}>
                {si
                  ? <button type="button" aria-sort={si.aria} title="Clique para ordenar · Shift+clique adiciona critério · arraste para reordenar"
                      onClick={(e) => toggle(c.key, e.shiftKey)} className={'k-dg-th' + (c.num ? ' k-dg-num' : '') + (si.arrow ? ' is-sorted' : '')}>
                      {c.label}{si.arrow && <span className="k-dg-arrow">{si.arrow}</span>}{si.idx > 0 && <span className="k-sort-idx">{si.idx}</span>}</button>
                  : <span className={'k-dg-th k-dg-th-static' + (c.num ? ' k-dg-num' : '')}>{c.label}</span>}
                <span className="k-col-resizer" onMouseDown={(e) => startResize(e, c.key)} title="Arraste para redimensionar" />
              </div>
            );
          })}
          <span className="k-dg-th-wrap k-dg-th-static k-cell-sticky k-sticky-r k-dg-actions-h" style={{ right: 0 }}>Ações</span>
        </div>
        <div className="k-dg-body" aria-busy={loading || undefined}>
          {loading && rows.length === 0 && (
            <div className="k-skel-wrap">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="k-skel-row"><span className="k-skel" /></div>)}</div>
          )}
          {!loading && err && rows.length === 0 && (
            <div className="k-state-err">
              <p>Não foi possível carregar as propostas.</p>
              <p className="k-muted k-sm">{err}</p>
              <button type="button" className="k-btn" onClick={load}>Tentar novamente</button>
            </div>
          )}
          {!(err && rows.length === 0) && pageRows.map((r) => {
            const selected = sel.has(r.id);
            return (
              <div key={r.id} role="row" tabIndex={0} className={'k-dg-row' + (selected ? ' is-selected' : '')}
                onClick={() => onOpen(r.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onOpen(r.id);
                  else if (e.key === 'ArrowDown') { e.preventDefault(); (e.currentTarget.nextElementSibling as HTMLElement)?.focus?.(); }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); (e.currentTarget.previousElementSibling as HTMLElement)?.focus?.(); }
                }}>
                <span className="k-dg-cell k-cell-sticky k-sticky-l k-dg-check" style={{ left: 0 }} onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selected} onChange={() => toggleOne(r.id)} aria-label={'Selecionar ' + r.proposal_number} />
                </span>
                {visibleCols.map((c) => {
                  const spec = c.render(r);
                  const stickyL = c.sticky === 'left';
                  return (
                    <span key={c.key} className={'k-dg-cell' + (c.num ? ' k-dg-num' : '') + (stickyL ? ' k-cell-sticky k-sticky-l' : '')}
                      style={stickyL ? { left: 'var(--sel-w)' } : undefined} title={spec.title || undefined}>
                      {spec.badge ? <span className={'k-badge ' + spec.badge}>{spec.text}</span> : highlight(spec.text, qActive)}
                    </span>
                  );
                })}
                <span className="k-dg-cell k-cell-sticky k-sticky-r k-dg-actions" style={{ right: 0 }} onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="k-icon-btn" title="Abrir/editar" onClick={(e) => actOpen(e, r.id)}>✎</button>
                  <button type="button" className="k-icon-btn" title="Gerar/ver PDF" onClick={(e) => actPdf(e, r.id)}>⤓</button>
                  <button type="button" className="k-icon-btn" title="Duplicar" onClick={(e) => actDuplicate(e, r.id)}>⧉</button>
                  <button type="button" className="k-icon-btn k-danger-ink" title="Excluir" onClick={(e) => actDelete(e, r)}>🗑</button>
                </span>
              </div>
            );
          })}
          {!loading && !err && sorted.length === 0 && (
            <p className="k-muted k-acc-empty">
              {rows.length === 0 ? 'Nenhuma proposta ainda. Crie a primeira.' : 'Nenhuma proposta corresponde à busca/filtro.'}
              {rows.length > 0 && anyFilter && <> <button type="button" className="k-btn-ghost k-sm" onClick={clearAll}>Limpar filtros</button></>}
            </p>
          )}
        </div>
      </div>
      {!loading && !err && sorted.length > 0 && (
        <div className="k-pager">
          <label className="k-sm k-muted k-pager-size">Por página
            <select className="k-input k-input-sm" value={pageSize} onChange={(e) => changePageSize(parseInt(e.target.value, 10))}>
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <span className="k-sm k-muted">Página {curPage} de {totalPages} · {sorted.length} registro(s)</span>
          <span className="k-pager-nav">
            <button type="button" className="k-icon-btn" title="Página anterior" disabled={curPage <= 1} onClick={() => setPage(curPage - 1)}>‹</button>
            <button type="button" className="k-icon-btn" title="Próxima página" disabled={curPage >= totalPages} onClick={() => setPage(curPage + 1)}>›</button>
          </span>
        </div>
      )}
      {sorts.length > 1 && <div className="k-muted k-sm k-sort-hint">Ordenação múltipla ativa ({sorts.length} critérios). <button type="button" className="k-btn-ghost k-sm" onClick={resetSort}>Redefinir</button></div>}
    </div>
  );
}
