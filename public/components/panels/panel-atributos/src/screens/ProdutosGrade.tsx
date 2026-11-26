// panel-atributos/src/screens/ProdutosGrade.tsx — modo TABELA de Produtos na tabela padrão do Dash (AG Grid Community, decisão do Jhony 26/11).
// SUBSTITUI a TabelaDados nesta tela (os outros usos da TabelaDados seguem até o degrau de cada um). Mesmo backend: recebe a lista que a tela já
// filtrou no cliente sobre o `GET vitrine` — nenhuma API nova. Ganha: ordenação por qualquer coluna (Ctrl/⌘ + clique = várias), filtro por coluna
// (texto/número), colunas fixas (seleção, ID e produto), mostrar/ocultar colunas, exportar CSV e rolagem virtualizada (sem página de 48 neste modo).
// Seleção = a mesma do módulo (m.selecao): a caixa do cabeçalho marca as linhas que passam nos filtros da grade.
import React from 'react';
import type { ProdutoResumo } from '../lib/tipos';
import { corKit, rotuloSubcategoria, tituloFamilia } from '../lib/rotulos';
import { criarGrade, exportarCsv, type ColDef, type GridApi, type ICellRendererParams } from '@shared/ag-grid/grade';

type Linha = ProdutoResumo;
/** Estado da grade (ordem, filtros, colunas) guardado na sessão do painel: volta igual depois da Ficha. */
let memoria: { colunas: unknown; filtros: unknown } | null = null;

const el = (tag: string, cls?: string, texto?: string): HTMLElement => { const e = document.createElement(tag); if (cls) e.className = cls; if (texto !== undefined) e.textContent = texto; return e; };
const pctEss = (p: Linha): number | null => (p.essencial.total > 0 ? Math.round((p.essencial.feitos / p.essencial.total) * 100) : null);
const precificaTexto = (p: Linha) => (p.precifica.length ? p.precifica.map(tituloFamilia).join(', ') : '—');

export function ProdutosGrade({ linhas, comSituacao, podeSel, selecao, aoSelecionar, aoAbrir, especificos }: {
  linhas: Linha[]; comSituacao: boolean; podeSel: boolean; selecao: number[]; aoSelecionar: (ids: number[]) => void; aoAbrir: (id: number) => void;
  especificos: (p: Linha) => { id: number; nome: string }[];
}) {
  const caixa = React.useRef<HTMLDivElement>(null);
  const apiRef = React.useRef<GridApi<Linha> | null>(null);
  const cb = React.useRef({ aoAbrir, aoSelecionar, especificos }); cb.current = { aoAbrir, aoSelecionar, especificos };
  const sincronizando = React.useRef(false);
  const [altura, setAltura] = React.useState(520);
  const [colunasAbertas, setColunasAbertas] = React.useState(false);
  const [, forcar] = React.useReducer((x: number) => x + 1, 0);

  // altura: do topo da grade até o fim da janela (a grade rola por dentro; a página não cresce 670 linhas)
  React.useLayoutEffect(() => {
    const medir = () => { const t = caixa.current?.getBoundingClientRect().top ?? 0; setAltura(Math.max(420, Math.round(window.innerHeight - Math.max(0, t) - 72))); };
    medir(); window.addEventListener('resize', medir); return () => window.removeEventListener('resize', medir);
  }, []);

  React.useEffect(() => {
    const raiz = caixa.current; if (!raiz) return;
    const colunas: ColDef<Linha>[] = [
      { colId: 'id', field: 'id', headerName: 'ID', width: 76, minWidth: 64, pinned: 'left', filter: 'agNumberColumnFilter', type: 'rightAligned', cellClass: 'at-pl-id', lockVisible: true },
      { colId: 'produto', field: 'nome', headerName: 'Produto', width: 330, minWidth: 220, pinned: 'left', filter: 'agTextColumnFilter', lockVisible: true,
        comparator: (a: string, b: string) => a.localeCompare(b, 'pt-BR'), tooltipField: 'nome',
        cellRenderer: (p: ICellRendererParams<Linha>) => { const b = el('button', 'at-link-produto at-pl-nome', p.data?.nome ?? ''); (b as HTMLButtonElement).type = 'button';
          b.setAttribute('data-completo', p.data?.nome ?? ''); b.onclick = () => p.data && cb.current.aoAbrir(p.data.id); return b; } },
      { colId: 'subcategoria', headerName: 'Subcategoria', width: 150, minWidth: 110, filter: 'agTextColumnFilter', valueGetter: (p) => (p.data ? rotuloSubcategoria(p.data.subcategoria) : ''),
        comparator: (a: string, b: string) => a.localeCompare(b, 'pt-BR') },
      { colId: 'kit', headerName: 'Kit específico', width: 150, minWidth: 120, filter: 'agTextColumnFilter',
        valueGetter: (p) => (p.data ? cb.current.especificos(p.data).map((k) => k.nome).join(', ') : ''),
        cellRenderer: (p: ICellRendererParams<Linha>) => {
          const ks = p.data ? cb.current.especificos(p.data) : [];
          if (!ks.length) { const s = el('span', 'at-pl-semkit', 'Sem kit específico'); s.title = 'Só o kit Base (todos os produtos) está aplicado'; return s; }
          const w = el('span', 'at-pl-kits'); const cor = corKit(ks[0].nome);
          const c = el('span', 'at-chip at-chip--p'); c.title = `Kit ${ks[0].nome}`; c.style.cssText = `color:${cor};border-color:color-mix(in srgb, ${cor} 45%, transparent);background:color-mix(in srgb, ${cor} 13%, transparent)`;
          const pt = el('span', 'at-chip__ponto'); pt.style.background = cor; c.append(pt, ks[0].nome); w.append(c);
          if (ks.length > 1) { const e = el('span', 'at-etiqueta at-etiqueta--neutro', `+${ks.length - 1}`); e.title = ks.slice(1).map((k) => k.nome).join(', '); w.append(e); }
          return w; } },
      { colId: 'essenciais', headerName: 'Essenciais', width: 160, minWidth: 130, filter: 'agNumberColumnFilter', headerTooltip: 'Percentual de essenciais preenchidos (sem essenciais definidos = vazio)',
        valueGetter: (p) => (p.data ? pctEss(p.data) : null), valueFormatter: (p) => (p.data ? `${p.data.essencial.feitos} de ${p.data.essencial.total}` : ''),
        comparator: (a: number | null, b: number | null) => (a === null ? (b === null ? 0 : 1) : b === null ? -1 : a - b),   // 0/0 no fim (como "Menos preenchidos")
        cellRenderer: (p: ICellRendererParams<Linha>) => {
          if (!p.data) return ''; const { feitos, total } = p.data.essencial; const pc = total > 0 ? Math.round((feitos / total) * 100) : 0;
          const w = el('span', 'at-pl-ess'); w.title = total ? `Essenciais: ${feitos} de ${total} (${pc}%)` : 'Sem atributos essenciais definidos';
          const tr = el('span', 'at-pl-ess__trilho'); tr.setAttribute('role', 'progressbar'); tr.setAttribute('aria-label', 'Essenciais preenchidos');
          tr.setAttribute('aria-valuemin', '0'); tr.setAttribute('aria-valuemax', String(total)); tr.setAttribute('aria-valuenow', String(feitos));
          const br = el('span', `at-pl-ess__barra ${total > 0 && feitos === total ? 'at-pl-ess__barra--completa' : ''}`); br.style.width = `${pc}%`; tr.append(br);
          w.append(tr, el('span', 'at-pl-ess__txt', `${feitos} de ${total}`)); return w; } },
      { colId: 'obrigatorios', field: 'obrigatorios_vazios', headerName: 'Obrigatórios', width: 110, minWidth: 96, filter: 'agNumberColumnFilter', type: 'rightAligned',
        headerTooltip: 'Obrigatórios sem valor', cellClassRules: { 'at-pl-pendente': (p) => (p.value ?? 0) > 0, 'at-pl-zero': (p) => (p.value ?? 0) === 0 } },
      { colId: 'fotos', field: 'fotos', headerName: 'Fotos', width: 76, minWidth: 64, filter: 'agNumberColumnFilter', type: 'rightAligned', cellClassRules: { 'at-pl-pendente': (p) => p.value === 0 } },
      { colId: 'precifica', headerName: 'Precifica', width: 140, minWidth: 90, filter: 'agTextColumnFilter', valueGetter: (p) => (p.data ? precificaTexto(p.data) : ''), tooltipValueGetter: (p) => p.value,
        cellClassRules: { 'at-fraco': (p) => p.value === '—' } },
      { colId: 'situacao', headerName: 'Situação', width: 100, minWidth: 90, filter: 'agTextColumnFilter', hide: !comSituacao, valueGetter: (p) => (p.data?.ativo ? 'Ativo' : 'Inativo'),
        cellRenderer: (p: ICellRendererParams<Linha>) => el('span', `at-pl-situacao at-pl-situacao--${p.data?.ativo ? 'ativo' : 'inativo'}`, String(p.value ?? '')) },
    ];
    const api = criarGrade<Linha>(raiz, {
      columnDefs: colunas, rowData: linhas, getRowId: (p) => String(p.data.id),
      getRowClass: (p) => (p.data && !p.data.ativo ? 'at-pl-linha--inativa' : undefined),
      ...(podeSel ? { rowSelection: { mode: 'multiRow', checkboxes: true, headerCheckbox: true, selectAll: 'filtered', enableClickSelection: false } } : {}),
      selectionColumnDef: { pinned: 'left', width: 44, suppressHeaderMenuButton: true },
      onSelectionChanged: (e) => { if (sincronizando.current || e.source === 'api') return; cb.current.aoSelecionar(e.api.getSelectedRows().map((r) => r.id)); },
      // larguras: as de referência são PROPORÇÕES; a grade cabe na área (como a TabelaDados), sem rolagem lateral em 1440, respeitando os mínimos
      onFirstDataRendered: (e) => { if (memoria) { e.api.applyColumnState({ state: memoria.colunas as never, applyOrder: true }); e.api.setFilterModel(memoria.filtros as never); } e.api.sizeColumnsToFit(); },
      onGridSizeChanged: (e) => { if (e.clientWidth > 0) e.api.sizeColumnsToFit(); },
      onSortChanged: (e) => { memoria = { colunas: e.api.getColumnState(), filtros: e.api.getFilterModel() }; },
      onFilterChanged: (e) => { memoria = { colunas: e.api.getColumnState(), filtros: e.api.getFilterModel() }; forcar(); },
      onColumnVisible: (e) => { memoria = { colunas: e.api.getColumnState(), filtros: e.api.getFilterModel() }; forcar(); },
    });
    apiRef.current = api; forcar();
    return () => { api.destroy(); apiRef.current = null; };
  }, [podeSel]);   // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => { apiRef.current?.setGridOption('rowData', linhas); }, [linhas]);
  React.useEffect(() => { apiRef.current?.setColumnsVisible(['situacao'], comSituacao); }, [comSituacao]);
  // seleção do módulo → caixas da grade (sem disparar o caminho inverso)
  React.useEffect(() => {
    const api = apiRef.current; if (!api || !podeSel) return; const s = new Set(selecao);
    sincronizando.current = true;
    api.forEachNode((n) => { const q = !!n.data && s.has(n.data.id); if (n.isSelected() !== q) n.setSelected(q, false, 'api'); });
    sincronizando.current = false;
  }, [selecao, linhas, podeSel]);

  const api = apiRef.current;
  const ocultaveis = api ? api.getColumns()?.filter((c) => !c.getColDef().lockVisible && c.getColId() !== 'ag-Grid-SelectionColumn') ?? [] : [];
  const filtrosAtivos = api ? Object.keys(api.getFilterModel() ?? {}).length : 0;
  const csv = () => api && exportarCsv(api, 'produtos.csv', api.getAllDisplayedColumns().map((c) => c.getColId()).filter((c) => c !== 'ag-Grid-SelectionColumn'));
  const limpar = () => { if (!api) return; api.setFilterModel(null); api.applyColumnState({ defaultState: { sort: null } }); };

  return (
    <div className="at-pl-grade">
      <div className="at-pl-grade__barra" role="toolbar" aria-label="Ferramentas da tabela">
        <div className="at-pl-grade__colunas">
          <button type="button" className="bl-botao" aria-expanded={colunasAbertas} aria-controls="at-pl-grade-colunas" onClick={() => setColunasAbertas(!colunasAbertas)}>Colunas</button>
          {colunasAbertas && (
            <div id="at-pl-grade-colunas" className="at-pl-painel at-pl-grade__lista" role="group" aria-label="Mostrar ou ocultar colunas"
              onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setColunasAbertas(false); } }}>
              {ocultaveis.map((c) => (
                <label key={c.getColId()} className="at-pl-alternancia">
                  <input type="checkbox" checked={c.isVisible()} onChange={(e) => api?.setColumnsVisible([c.getColId()], e.target.checked)} /> <span>{c.getColDef().headerName}</span>
                </label>))}
            </div>)}
        </div>
        <button type="button" className="bl-botao" onClick={csv}>Exportar CSV</button>
        {filtrosAtivos > 0 && <button type="button" className="at-link" onClick={limpar}>Limpar filtros e ordem da tabela</button>}
        <span className="at-fraco at-pl-grade__dica">Ctrl/⌘ + clique no título ordena por várias colunas</span>
      </div>
      <div ref={caixa} className="at-pl-grade__corpo" style={{ height: altura }} data-pl-grade="ag" />
    </div>);
}
