// panel-atributos/src/screens/MatrizGrade.tsx — VINCULAR · MATRIZ na tabela padrão do Dash (AG Grid Community, decisão do Jhony 26/11; 2º degrau,
// depois de Produtos/P39). SUBSTITUI as duas <table> sincronizadas da Matriz V2. Dados e regras de origem = os mesmos (lib/matriz.ts, sobre a vitrine):
// produtos ATIVOS (só os selecionados quando há seleção), subcategoria escolhida, marcadores Subcat./Direto/Todos cumulativos na ordem fixa.
// Ordenação igual à V2: Produto pelo código; kit por "tem vínculo" (1º clique = com vínculo primeiro) com desempate pelo código. Ganha: filtro por
// coluna, colunas (kits) fixas/ocultáveis, CSV, rolagem virtualizada nas duas direções. Clique no produto abre a Ficha (como antes).
import React from 'react';
import type { KitResumo, ProdutoResumo } from '../lib/tipos';
import { larguraKit, MARCADOR, origensDaCelula, temVinculo, textoOrigens } from '../lib/matriz';
import { criarGrade, exportarCsv, type ColDef, type GridApi, type ICellRendererParams } from '@shared/ag-grid/grade';

const LARGURA_PRODUTO = 440;
/** Ordem, filtros e colunas da grade guardados na sessão do painel (voltar da Ficha mantém o recorte). */
let memoria: { colunas: unknown; filtros: unknown } | null = null;
const el = (tag: string, cls?: string, texto?: string): HTMLElement => { const e = document.createElement(tag); if (cls) e.className = cls; if (texto !== undefined) e.textContent = texto; return e; };
/** Texto da célula para filtro/CSV: os marcadores na ordem fixa ("Subcat. + Direto"); sem vínculo = vazio. */
const textoCelula = (p: ProdutoResumo, kitId: number): string => { const { origens, outras } = origensDaCelula(p, kitId); return [...origens.map((o) => MARCADOR[o].texto), ...outras].join(' + '); };

export function MatrizGrade({ prods, kits, ativos, aoAbrir }: { prods: ProdutoResumo[]; kits: KitResumo[]; ativos: ProdutoResumo[]; aoAbrir: (id: number) => void }) {
  const caixa = React.useRef<HTMLDivElement>(null);
  const apiRef = React.useRef<GridApi<ProdutoResumo> | null>(null);
  const cb = React.useRef({ aoAbrir }); cb.current = { aoAbrir };
  const [altura, setAltura] = React.useState(560);
  const [colunasAbertas, setColunasAbertas] = React.useState(false);
  const [, forcar] = React.useReducer((x: number) => x + 1, 0);

  React.useLayoutEffect(() => {
    const medir = () => { const t = caixa.current?.getBoundingClientRect().top ?? 0; setAltura(Math.max(420, Math.round(window.innerHeight - Math.max(0, t) - 40))); };
    medir(); window.addEventListener('resize', medir); return () => window.removeEventListener('resize', medir);
  }, []);

  React.useEffect(() => {
    const raiz = caixa.current; if (!raiz) return;
    const colunas: ColDef<ProdutoResumo>[] = [
      { colId: 'produto', headerName: 'Produto', width: LARGURA_PRODUTO, minWidth: 260, pinned: 'left', lockVisible: true, filter: 'agTextColumnFilter', cellClass: 'at-mx__ag-prod',
        valueGetter: (p) => (p.data ? `${p.data.id} · ${p.data.nome}` : ''), sortingOrder: ['asc', 'desc'], sort: 'asc',
        comparator: (_a, _b, na, nb) => (na.data?.id ?? 0) - (nb.data?.id ?? 0),   // pelo código numérico (nunca o texto "27 · nome")
        cellRenderer: (p: ICellRendererParams<ProdutoResumo>) => { const b = el('button', 'at-link-produto at-mx__produto', String(p.value ?? '')) as HTMLButtonElement; b.type = 'button';
          b.title = String(p.value ?? ''); b.onclick = () => p.data && cb.current.aoAbrir(p.data.id); return b; } },
      ...kits.map((k): ColDef<ProdutoResumo> => ({
        colId: `kit:${k.id}`, headerName: k.nome, headerTooltip: k.nome, width: larguraKit(ativos, k.id), minWidth: 96, wrapHeaderText: true, autoHeaderHeight: true,
        headerClass: 'at-mx__ag-kit', cellClass: 'at-mx__ag-cel', filter: 'agTextColumnFilter', sortingOrder: ['desc', 'asc', null],
        valueGetter: (p) => (p.data ? textoCelula(p.data, k.id) : ''), tooltipValueGetter: (p) => (p.data ? textoOrigens(p.data, k.id) || undefined : undefined),
        // desempate SEMPRE pelo código crescente (o AG Grid inverte o comparador no 'desc'; por isso o desempate compensa a inversão)
        comparator: (_a, _b, na, nb, desc) => (Number(temVinculo(na.data!, k.id)) - Number(temVinculo(nb.data!, k.id))) || ((na.data?.id ?? 0) - (nb.data?.id ?? 0)) * (desc ? -1 : 1),
        cellRenderer: (p: ICellRendererParams<ProdutoResumo>) => {
          if (!p.data) return ''; const { origens, outras } = origensDaCelula(p.data, k.id); if (!origens.length && !outras.length) return '';
          const w = el('span', 'at-mx__marcadores');
          for (const o of origens) { const a = el('abbr', `at-mx__m at-mx__m--${MARCADOR[o].classe}`, MARCADOR[o].texto); a.title = MARCADOR[o].titulo; a.setAttribute('aria-label', MARCADOR[o].titulo); a.dataset.origem = o; w.append(a); }
          for (const x of outras) { const s = el('span', 'at-mx__m at-mx__m--todos', x); s.title = x; w.append(s); }
          return w; },
      })),
    ];
    const api = criarGrade<ProdutoResumo>(raiz, {
      columnDefs: colunas, rowData: prods, getRowId: (p) => String(p.data.id), rowHeight: 36, enableCellTextSelection: false,
      onFirstDataRendered: (e) => { if (memoria) { e.api.applyColumnState({ state: memoria.colunas as never, applyOrder: true }); e.api.setFilterModel(memoria.filtros as never); } },
      onSortChanged: (e) => { memoria = { colunas: e.api.getColumnState(), filtros: e.api.getFilterModel() }; },
      onFilterChanged: (e) => { memoria = { colunas: e.api.getColumnState(), filtros: e.api.getFilterModel() }; forcar(); },
      onColumnVisible: (e) => { memoria = { colunas: e.api.getColumnState(), filtros: e.api.getFilterModel() }; forcar(); },
    });
    apiRef.current = api; forcar();
    return () => { api.destroy(); apiRef.current = null; };
  }, [kits, ativos]);   // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => { apiRef.current?.setGridOption('rowData', prods); forcar(); }, [prods]);

  const api = apiRef.current;
  const ocultaveis = api ? api.getColumns()?.filter((c) => !c.getColDef().lockVisible) ?? [] : [];
  const filtrosAtivos = api ? Object.keys(api.getFilterModel() ?? {}).length : 0;
  const csv = () => api && exportarCsv(api, 'matriz-produtos-kits.csv', api.getAllDisplayedColumns().map((c) => c.getColId()));
  const limpar = () => { if (!api) return; api.setFilterModel(null); api.applyColumnState({ state: [{ colId: 'produto', sort: 'asc' }], defaultState: { sort: null } }); };
  const visiveis = api ? api.getDisplayedRowCount() : prods.length;

  return (
    <div className="at-mx__grade">
      <div className="at-mx__grade-barra" role="toolbar" aria-label="Ferramentas da matriz">
        <div className="at-mx__grade-colunas">
          <button type="button" className="bl-botao" aria-expanded={colunasAbertas} aria-controls="at-mx-grade-colunas" onClick={() => setColunasAbertas(!colunasAbertas)}>Colunas</button>
          {colunasAbertas && (
            <div id="at-mx-grade-colunas" className="at-pl-painel at-mx__grade-lista" role="group" aria-label="Mostrar ou ocultar kits"
              onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setColunasAbertas(false); } }}>
              {ocultaveis.map((c) => (
                <label key={c.getColId()} className="at-pl-alternancia">
                  <input type="checkbox" checked={c.isVisible()} onChange={(e) => api?.setColumnsVisible([c.getColId()], e.target.checked)} /> <span>{c.getColDef().headerName}</span>
                </label>))}
            </div>)}
        </div>
        <button type="button" className="bl-botao" onClick={csv}>Exportar CSV</button>
        {filtrosAtivos > 0 && <button type="button" className="at-link" onClick={limpar}>Limpar filtros e ordem da matriz</button>}
        <span className="at-fraco at-mx__grade-conta" aria-live="polite">{visiveis} produto{visiveis === 1 ? '' : 's'}</span>
      </div>
      <div ref={caixa} className="at-mx__grade-corpo" style={{ height: altura }} data-matriz-grade="ag" />
    </div>);
}
