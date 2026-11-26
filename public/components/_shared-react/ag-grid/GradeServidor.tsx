// _shared-react/ag-grid/GradeServidor.tsx — a tabela padrão do Dash (AG Grid Community) para telas SERVER-SIDE (decisão do Jhony 26/11; 3º degrau:
// Bling · Contas a Pagar). MESMAS props do DataGrid (PropsDataGrid) para trocar uma tela por vez sem mexer em quem consulta: a tela continua
// recebendo só a página atual e decidindo a consulta (§64); a grade devolve a intenção (ordenar, paginar, buscar) pelo mesmo callback.
// O que muda é o corpo: AG Grid (tema DSHOW, pt-BR, colunas fixas, redimensionar, mostrar/ocultar, densidade, seleção, totais fixos no rodapé).
// Ordenação = a do servidor (uma coluna; 1º clique = decrescente, como o DataGrid): a grade NÃO reordena a página localmente.
// Preferências (colunas ocultas, densidade) na MESMA chave do DataGrid (dshow.bling.grid.<tela>): a troca não perde o que o usuário escolheu.
// Células: as mesmas regras do DataGrid (porTipo, semáforo, destaque, mascarado); Badge e Medidor são os componentes React de Primitivos, montados
// numa raiz React por célula (sem ag-grid-react).
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ICellRendererComp, ICellRendererParams } from 'ag-grid-community';
import { Badge, Medidor, EstadoVazio, BlocoCarregando, type InfoSituacao } from '../components/Primitivos';
import type { ColunaGrid, Densidade, PropsDataGrid } from '../components/DataGrid';
import { porTipo, truncar, type TipoFormato } from '../lib/formato';
import { criarGrade, type ColDef, type GridApi } from './grade';
import './grade-servidor.css';

type Linha = Record<string, unknown>;
const ALTURA_LINHA: Record<Densidade, number> = { compacta: 30, normal: 36, confortavel: 44 };
const TOTAL = '__total_da_consulta__';

function lerPreferencias(chave?: string): { ocultas: string[]; densidade: Densidade } {
  const padrao = { ocultas: [] as string[], densidade: 'normal' as Densidade };
  if (!chave) return padrao;
  try {
    const p = JSON.parse(localStorage.getItem(`dshow.bling.grid.${chave}`) ?? 'null'); if (!p) return padrao;
    return { ocultas: Array.isArray(p.ocultas) ? p.ocultas : [], densidade: ['compacta', 'normal', 'confortavel'].includes(p.densidade) ? p.densidade : 'normal' };
  } catch { return padrao; }
}
function gravarPreferencias(chave: string | undefined, v: { ocultas: string[]; densidade: Densidade }) {
  if (!chave) return; try { localStorage.setItem(`dshow.bling.grid.${chave}`, JSON.stringify(v)); } catch { /* cota cheia: não é erro fatal */ }
}
/** CSV com BOM e ";" (o mesmo do DataGrid): a página atual, colunas visíveis. */
function paraCsv(colunas: ColunaGrid[], linhas: Linha[]): string {
  const esc = (v: unknown) => { const s = v === null || v === undefined ? '' : String(v); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return `﻿${colunas.map((c) => esc(c.rotulo)).join(';')}\n${linhas.map((l) => colunas.map((c) => esc(l[c.id])).join(';')).join('\n')}`;
}
const larguraCol = (c: ColunaGrid) => c.largura ?? (c.tipo === 'moeda' || c.tipo === 'numero' ? 118 : c.tipo === 'inteiro' ? 90 : c.tipo === 'percentual' ? 92
  : c.tipo === 'data' ? 100 : c.tipo === 'datahora' ? 142 : c.tipo === 'badge' ? 138 : c.tipo === 'medidor' ? 116 : 150);

/** Célula com componente React (Badge/Medidor): uma raiz por célula, desmontada quando o AG Grid descarta a célula. */
class CelulaReact implements ICellRendererComp<Linha> {
  private e = document.createElement('span'); private raiz: Root | null = null;
  init(p: ICellRendererParams<Linha> & { coluna: ColunaGrid }) { this.raiz = createRoot(this.e); this.desenhar(p); }
  getGui() { return this.e; }
  refresh(p: ICellRendererParams<Linha> & { coluna: ColunaGrid }) { this.desenhar(p); return true; }
  destroy() { const r = this.raiz; this.raiz = null; if (r) queueMicrotask(() => r.unmount()); }
  private desenhar(p: ICellRendererParams<Linha> & { coluna: ColunaGrid }) {
    const c = p.coluna; const l = p.data ?? {}; const v = l[c.id];
    if (l[TOTAL]) { this.raiz?.render(null); return; }
    if (c.tipo === 'badge') { const info = (l[`${c.id}_info`] ?? null) as InfoSituacao | null; this.raiz?.render(<Badge info={info ?? (v ? { chave: String(v), rotulo: String(v), cor: 'neutro' } : null)} />); }
    else this.raiz?.render(<Medidor valor={v as number} />);
  }
}
/** Células de texto/número: as MESMAS regras do DataGrid (sem React). */
function celulaTexto(p: ICellRendererParams<Linha> & { coluna: ColunaGrid }): HTMLElement | string {
  const c = p.coluna; const l = p.data ?? {}; const v = l[c.id];
  if (l[TOTAL]) { const s = document.createElement('span'); s.className = 'bl-ag-total';
    s.textContent = v === undefined ? (p.colDef?.colId === l.__primeira ? 'Total da consulta' : '') : porTipo(v, (c.tipo ?? 'numero') as TipoFormato, true); return s; }
  const s = document.createElement('span'); s.title = String(v ?? '');
  if (c.tipo === 'booleano') { s.textContent = v === true ? 'Sim' : v === false ? 'Não' : '—'; s.style.color = v === true ? 'var(--bl-sucesso)' : 'var(--bl-texto-3)'; return s; }
  if (c.tipo === 'imagem') { s.textContent = v ? '' : '—'; s.title = v ? 'Produto com imagem' : 'Sem imagem'; s.className = v ? 'bl-ag-imagem' : ''; if (!v) s.style.color = 'var(--bl-texto-3)'; return s; }
  if (c.tipo === 'link') { s.textContent = v ? 'Disponível' : '—'; s.style.color = v ? 'var(--bl-info)' : 'var(--bl-texto-3)'; return s; }
  const num = typeof v === 'number' ? v : null;
  if (c.semaforo && num !== null) s.style.color = num < 0 ? 'var(--bl-erro)' : num > 0 ? 'var(--bl-aviso)' : 'var(--bl-texto-2)';
  if (c.destaque) s.style.fontWeight = '600';
  if (c.monoespacada) { s.style.fontFamily = 'var(--bl-fonte-mono)'; s.style.fontSize = '11px'; }
  if (c.mascarado) s.style.opacity = '.85';
  s.className = 'bl-ag-txt';
  s.textContent = c.tipo === 'texto' && typeof v === 'string' ? truncar(v, 90) : porTipo(v, (c.tipo ?? 'texto') as TipoFormato, true);
  return s;
}

export function GradeServidor({
  colunas, linhas, total, estado, aoMudarEstado, carregando = false, totais,
  chaveLinha, aoAbrirLinha, selecionaveis = false, aoSelecionar, acoesEmLote,
  chavePreferencias, alturaMax = 560, vazioTitulo, vazioDescricao, filtroAtivo,
}: PropsDataGrid) {
  const [prefs, setPrefs] = React.useState(() => lerPreferencias(chavePreferencias));
  const [selecionadas, setSelecionadas] = React.useState<string[]>([]);
  const [menuColunas, setMenuColunas] = React.useState(false);
  const caixa = React.useRef<HTMLDivElement>(null);
  const apiRef = React.useRef<GridApi<Linha> | null>(null);
  const cb = React.useRef({ aoMudarEstado, aoSelecionar, aoAbrirLinha, estado }); cb.current = { aoMudarEstado, aoSelecionar, aoAbrirLinha, estado };
  const aplicandoOrdem = React.useRef(false);
  const idDe = React.useCallback((l: Linha) => (chaveLinha ? chaveLinha(l) : String(l.id ?? '')), [chaveLinha]);
  const idRef = React.useRef(idDe); idRef.current = idDe;
  const visiveis = React.useMemo(() => colunas.filter((c) => !prefs.ocultas.includes(c.id)), [colunas, prefs.ocultas]);
  const chaveColunas = colunas.map((c) => `${c.id}:${c.tipo ?? ''}`).join('|');
  const temCorpo = linhas.length > 0;

  // grade: criada quando há corpo; recriada se o conjunto de colunas mudar (outra tela)
  React.useEffect(() => {
    const raiz = caixa.current; if (!raiz || !temCorpo) return;
    const defs: ColDef<Linha>[] = colunas.map((c, i) => ({
      colId: c.id, field: c.id, headerName: c.rotulo, headerTooltip: c.tooltip, width: larguraCol(c), minWidth: 70, pinned: i === 0 ? 'left' : undefined,
      hide: prefs.ocultas.includes(c.id), sortable: c.ordenavel !== false, sortingOrder: ['desc', 'asc'], comparator: () => 0,   // a ordem é a do servidor
      filter: false, type: c.alinhamento === 'direita' ? 'rightAligned' : undefined,
      cellRenderer: c.tipo === 'badge' || c.tipo === 'medidor' ? CelulaReact : celulaTexto, cellRendererParams: { coluna: c },
    }));
    const api = criarGrade<Linha>(raiz, {
      columnDefs: defs, rowData: linhas.map((l, i) => ({ __i: i, ...l })), getRowId: (p) => idRef.current(p.data) || String(p.data.__i), rowHeight: ALTURA_LINHA[prefs.densidade],
      defaultColDef: { filter: false }, suppressMultiSort: true,
      ...(selecionaveis ? { rowSelection: { mode: 'multiRow', checkboxes: true, headerCheckbox: true, selectAll: 'all', enableClickSelection: false } } : {}),
      selectionColumnDef: { pinned: 'left', width: 40, suppressHeaderMenuButton: true },
      onSelectionChanged: (e) => { const ids = e.api.getSelectedRows().map((r) => idRef.current(r)); setSelecionadas(ids); cb.current.aoSelecionar?.(ids); },
      onRowClicked: (e) => { if (cb.current.aoAbrirLinha && e.data && !e.data[TOTAL]) cb.current.aoAbrirLinha(e.data); },
      onSortChanged: (e) => {   // clique no título → pede ao servidor (mesma regra do DataGrid: 1ª vez desc, depois alterna)
        if (aplicandoOrdem.current) return;
        const s = e.api.getColumnState().find((x) => x.sort); const est = cb.current.estado;
        if (!s) { cb.current.aoMudarEstado({ direcao: est.direcao === 'asc' ? 'desc' : 'asc', pagina: 1 }); return; }
        cb.current.aoMudarEstado(s.colId === est.ordenar ? { direcao: s.sort as 'asc' | 'desc', pagina: 1 } : { ordenar: s.colId, direcao: 'desc', pagina: 1 });
      },
    });
    apiRef.current = api;
    return () => { api.destroy(); apiRef.current = null; };
  }, [chaveColunas, temCorpo, selecionaveis]);   // eslint-disable-line react-hooks/exhaustive-deps

  // página nova → linhas; indicador de ordem = o estado do servidor; seleção limpa (como o DataGrid)
  React.useEffect(() => { apiRef.current?.setGridOption('rowData', linhas.map((l, i) => ({ __i: i, ...l }))); }, [linhas]);
  React.useEffect(() => {
    const api = apiRef.current; if (!api) return; aplicandoOrdem.current = true;
    api.applyColumnState({ state: estado.ordenar ? [{ colId: estado.ordenar, sort: estado.direcao }] : [], defaultState: { sort: null } });
    aplicandoOrdem.current = false;
  }, [estado.ordenar, estado.direcao, temCorpo, chaveColunas]);
  React.useEffect(() => { apiRef.current?.deselectAll(); setSelecionadas([]); aoSelecionar?.([]); },   // eslint-disable-line react-hooks/exhaustive-deps
    [estado.pagina, estado.ordenar, estado.direcao, estado.busca]);
  React.useEffect(() => {   // totais da consulta, fixos no rodapé
    const api = apiRef.current; if (!api) return;
    const tem = totais && Object.keys(totais).length > 0; const prim = visiveis[0]?.id;
    api.setGridOption('pinnedBottomRowData', tem ? [{ [TOTAL]: true, __primeira: prim, ...Object.fromEntries(Object.entries(totais!).filter(([, v]) => v !== null && v !== undefined)) }] : []);
  }, [totais, visiveis, temCorpo, chaveColunas]);
  React.useEffect(() => { const api = apiRef.current; if (!api) return; api.setGridOption('rowHeight', ALTURA_LINHA[prefs.densidade]); }, [prefs.densidade]);   // o rowHeight novo já redesenha (resetRowHeights é de módulo fora do Community)

  const alternarColuna = (id: string) => {
    const ocultas = prefs.ocultas.includes(id) ? prefs.ocultas.filter((x) => x !== id) : [...prefs.ocultas, id];
    const novo = { ...prefs, ocultas }; setPrefs(novo); gravarPreferencias(chavePreferencias, novo);
    apiRef.current?.setColumnsVisible([id], !ocultas.includes(id));
  };
  const trocarDensidade = (d: Densidade) => { const novo = { ...prefs, densidade: d }; setPrefs(novo); gravarPreferencias(chavePreferencias, novo); };
  const exportar = () => {
    const url = URL.createObjectURL(new Blob([paraCsv(visiveis, linhas)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `bling-${chavePreferencias ?? 'dados'}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const paginas = Math.max(1, Math.ceil(total / estado.limite));
  const alturaGrade = Math.min(alturaMax, 36 + linhas.length * ALTURA_LINHA[prefs.densidade] + (totais && Object.keys(totais).length ? 40 : 0) + 18);

  return (
    <div className="bl-cartao bl-ag" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }} data-grade="ag-servidor">
      <div className="bl-ag__barra">
        <input type="search" value={estado.busca} onChange={(e) => aoMudarEstado({ busca: e.target.value, pagina: 1 })} placeholder="Buscar nesta tela…" aria-label="Buscar" className="bl-ag__busca" />
        <span className="bl-ag__conta">{carregando ? 'carregando…' : `${total.toLocaleString('pt-BR')} registro${total === 1 ? '' : 's'}`}</span>
        <div style={{ flex: 1 }} />
        {selecionadas.length > 0 && acoesEmLote?.length ? (<>
          <span className="bl-ag__sel">{selecionadas.length} selecionado(s)</span>
          {acoesEmLote.map((a) => <button key={a.id} type="button" className="bl-botao" onClick={() => a.aoExecutar([...selecionadas])}>{a.rotulo}</button>)}
        </>) : null}
        <div style={{ position: 'relative' }}>
          <button type="button" className="bl-botao" onClick={() => setMenuColunas((v) => !v)} aria-expanded={menuColunas} aria-haspopup="menu">
            Colunas{prefs.ocultas.length > 0 ? ` (${visiveis.length}/${colunas.length})` : ''}</button>
          {menuColunas && (<>
            <div onClick={() => setMenuColunas(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
            <div role="menu" className="bl-ag__menu">
              <div className="bl-ag__menu-rot">Densidade</div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {(['compacta', 'normal', 'confortavel'] as Densidade[]).map((d) => (
                  <button key={d} type="button" onClick={() => trocarDensidade(d)} className="bl-botao bl-ag__dens" aria-pressed={prefs.densidade === d}>
                    {d === 'compacta' ? 'Densa' : d === 'normal' ? 'Normal' : 'Ampla'}</button>))}
              </div>
              <div className="bl-ag__menu-rot">Colunas visíveis</div>
              {colunas.map((c) => (
                <label key={c.id} className="bl-ag__menu-item"><input type="checkbox" checked={!prefs.ocultas.includes(c.id)} onChange={() => alternarColuna(c.id)} />
                  <span>{c.rotulo}</span></label>))}
            </div>
          </>)}
        </div>
        <button type="button" className="bl-botao" onClick={exportar} disabled={linhas.length === 0}>Exportar CSV</button>
      </div>
      {carregando && linhas.length === 0 ? (
        <div style={{ padding: 16 }}><BlocoCarregando linhas={7} /></div>
      ) : linhas.length === 0 ? (
        <EstadoVazio titulo={vazioTitulo ?? 'Nenhum registro no recorte atual'} descricao={vazioDescricao ?? 'Ajuste o período ou os filtros para ver outros dados.'} filtroAtivo={filtroAtivo} />
      ) : (
        <div ref={caixa} className="bl-ag__corpo" style={{ height: alturaGrade }} aria-busy={carregando || undefined} />
      )}
      {total > 0 && (
        <div className="bl-ag__paginas">
          <span>{((estado.pagina - 1) * estado.limite + 1).toLocaleString('pt-BR')}–{Math.min(estado.pagina * estado.limite, total).toLocaleString('pt-BR')} de {total.toLocaleString('pt-BR')}</span>
          <div style={{ flex: 1 }} />
          <label className="bl-ag__porpagina">Por página
            <select value={estado.limite} onChange={(e) => aoMudarEstado({ limite: Number(e.target.value), pagina: 1 })}>
              {[25, 50, 100, 200].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
          <button type="button" className="bl-botao" disabled={estado.pagina <= 1} onClick={() => aoMudarEstado({ pagina: estado.pagina - 1 })}>Anterior</button>
          <span>{estado.pagina} / {paginas}</span>
          <button type="button" className="bl-botao" disabled={estado.pagina >= paginas} onClick={() => aoMudarEstado({ pagina: estado.pagina + 1 })}>Próxima</button>
        </div>)}
    </div>);
}
