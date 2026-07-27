// components/grid/DataGrid.tsx — grid ÚNICO do design system (Elevação visual §3-4).
// @version 2.0.0  @updated 2026-07-20
//
// Headless (TanStack Table) + marcação própria: visual 100% dos tokens do shell.
// Padrão obrigatório: zebra, hover, linha selecionada, STICKY header, cabeçalhos
// altos/maiúsculos/negrito, ícones de coluna, menu ⋮ por linha, 3 densidades.
// Ordenação e paginação NO SERVIDOR: o grid reporta a intenção.
import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Icone } from '../ui/Icone';
import { Skeleton, EmptyState, ErrorState } from '../ui/Estados';
import { fmtInt } from '../../lib/format';
import type { ColunaDef, DataGridProps, Densidade, ItemMenuLinha } from './tipos';
import css from './DataGrid.module.css';

const ALTURA: Record<Densidade, number> = { compacta: 34, normal: 40, confortavel: 48 };
const ICONE_DENS: Record<Densidade, string> = { compacta: 'Rows3', normal: 'Rows2', confortavel: 'Menu' };

export function DataGrid<T>({
  colunas, linhas, idLinha, chaveEstado, paginacao, ordenacao, aoOrdenar,
  expansao, acoes, menuLinha, aoClicarLinha, aoAtualizar, exportavel = false,
  limiteVirtualizacao = 100, carregando, erro, vazio, densidadeInicial = 'normal', ferramentas, rotulo,
}: DataGridProps<T>): JSX.Element {
  const [densidade, setDensidade] = useState<Densidade>(densidadeInicial);
  const [ocultas, setOcultas] = useState<Set<string>>(() => new Set(
    colunas.filter((c) => c.ocultaPorPadrao).map((c) => c.id)
  ));
  const [expandidas, setExpandidas] = useState<Set<string | number>>(new Set());
  const [painelColunas, setPainelColunas] = useState(false);

  useEffect(() => {
    if (!chaveEstado) return;
    try {
      const bruto = localStorage.getItem(`dt.grid.${chaveEstado}`);
      if (!bruto) return;
      const s = JSON.parse(bruto);
      if (s.densidade) setDensidade(s.densidade);
      if (Array.isArray(s.ocultas)) setOcultas(new Set(s.ocultas));
    } catch { /* preferência corrompida não pode quebrar a tela */ }
  }, [chaveEstado]);

  useEffect(() => {
    if (!chaveEstado) return;
    try {
      localStorage.setItem(`dt.grid.${chaveEstado}`, JSON.stringify({ densidade, ocultas: [...ocultas] }));
    } catch { /* cota cheia: preferência é acessório */ }
  }, [chaveEstado, densidade, ocultas]);

  const visiveis = useMemo(() => colunas.filter((c) => !ocultas.has(c.id)), [colunas, ocultas]);
  const temMenu = !!menuLinha || !!acoes;

  const template = useMemo(() => {
    const cols = visiveis.map((c) => c.largura ?? 'minmax(120px, 1fr)');
    if (expansao) cols.unshift('34px');
    if (temMenu) cols.push('48px');
    return cols.join(' ');
  }, [visiveis, expansao, temMenu]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizar = linhas.length > limiteVirtualizacao;
  const virtual = useVirtualizer({
    count: linhas.length, getScrollElement: () => scrollRef.current,
    estimateSize: () => ALTURA[densidade], overscan: 12, enabled: virtualizar,
  });

  function alternarOrdem(c: ColunaDef<T>): void {
    if (!c.ordenavel || !aoOrdenar) return;
    const mesma = ordenacao?.coluna === c.id;
    aoOrdenar({ coluna: c.id, direcao: mesma && ordenacao?.direcao === 'asc' ? 'desc' : 'asc' });
  }
  function alternarExpansao(id: string | number): void {
    setExpandidas((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  if (erro) return <ErrorState mensagem={erro.mensagem} codigo={erro.codigo} onRetry={erro.aoTentar} />;

  const itens = virtualizar ? virtual.getVirtualItems() : linhas.map((_, i) => ({ index: i, key: i, start: 0, size: 0 }));

  return (
    <div className={css.raiz}>
      <div className={css.barra}>
        <div className={css.ferramentas}>{ferramentas}</div>
        <div className={css.controles}>
          <div className={css.densidade} role="group" aria-label="Densidade das linhas">
            {(['compacta', 'normal', 'confortavel'] as Densidade[]).map((d) => (
              <button key={d} type="button" title={`Densidade ${d}`} aria-pressed={densidade === d}
                className={densidade === d ? css.densAtiva : css.dens} onClick={() => setDensidade(d)}>
                <Icone nome={ICONE_DENS[d]} size={13} />
              </button>
            ))}
          </div>
          <div className={css.colunasWrap}>
            <button type="button" className={css.btnCtrl} aria-expanded={painelColunas}
              onClick={() => setPainelColunas((v) => !v)}>
              <Icone nome="Columns3" size={13} /> Colunas
            </button>
            {painelColunas && (
              <div className={css.painelColunas} role="dialog" aria-label="Colunas visíveis">
                {colunas.map((c) => (
                  <label key={c.id} className={css.itemColuna}>
                    <input type="checkbox" checked={!ocultas.has(c.id)} disabled={c.obrigatoria}
                      onChange={() => setOcultas((s) => { const n = new Set(s); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })} />
                    <span>{c.icone && <Icone nome={c.icone} size={12} />} {c.cabecalho}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {aoAtualizar && (
            <button type="button" className={css.btnCtrl} onClick={aoAtualizar} title="Atualizar dados">
              <Icone nome="RefreshCw" size={13} /> Atualizar
            </button>
          )}
          <button type="button" className={css.btnCtrl} disabled={!exportavel}
            title={exportavel ? 'Exportar' : 'Exportação em breve'}>
            <Icone nome="Download" size={13} /> Exportar
          </button>
        </div>
      </div>

      <div className={css.moldura}>
        <div className={css.rolagem} ref={scrollRef}>
          <div className={css.tabela} role="table" aria-label={rotulo}
               aria-rowcount={paginacao?.total ?? linhas.length}>
            <div className={css.cabecalho} role="row" style={{ gridTemplateColumns: template }}>
              {expansao && <span className={css.th} role="columnheader" aria-label="Expandir" />}
              {visiveis.map((c) => {
                const ativa = ordenacao?.coluna === c.id;
                return (
                  <span key={c.id} role="columnheader"
                    aria-sort={ativa ? (ordenacao?.direcao === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={`${css.th} ${c.alinhamento === 'fim' ? css.fim : ''} ${c.alinhamento === 'centro' ? css.centro : ''} ${c.ordenavel ? css.ordenavel : ''}`}
                    title={c.dica} onClick={() => alternarOrdem(c)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternarOrdem(c); } }}
                    tabIndex={c.ordenavel ? 0 : undefined}>
                    {c.icone && <Icone nome={c.icone} size={12} className={css.thIcone} />}
                    {c.cabecalho}
                    {ativa && <Icone nome={ordenacao?.direcao === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={12} className={css.seta} />}
                  </span>
                );
              })}
              {temMenu && <span className={css.th} role="columnheader" aria-label="Ações" />}
            </div>

            {carregando ? (
              <div className={css.carregando}><Skeleton linhas={8} altura={ALTURA[densidade] - 14} /></div>
            ) : linhas.length === 0 ? (
              <div className={css.vazioWrap}>
                <EmptyState icone="SearchX" titulo={vazio?.titulo ?? 'Nenhum resultado'}
                  descricao={vazio?.descricao ?? 'Ajuste os filtros para ver mais itens.'} acao={vazio?.acao} />
              </div>
            ) : (
              <div className={css.corpo}
                   style={virtualizar ? { height: virtual.getTotalSize(), position: 'relative' } : undefined}>
                {itens.map((vi) => {
                  const linha = linhas[vi.index];
                  const id = idLinha(linha);
                  const aberta = expandidas.has(id);
                  return (
                    <div key={id} className={css.grupoLinha}
                         style={virtualizar ? { position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` } : undefined}>
                      <div role="row"
                        className={`${css.linha} ${css[densidade]} ${vi.index % 2 === 1 ? css.par : ''} ${aberta ? css.selecionada : ''} ${aoClicarLinha ? css.clicavel : ''}`}
                        style={{ gridTemplateColumns: template }}
                        onClick={() => aoClicarLinha?.(linha)}>
                        {expansao && (
                          <span className={css.td}>
                            <button type="button" className={css.btnExpandir} aria-expanded={aberta}
                              aria-label={aberta ? 'Recolher linha' : 'Expandir linha'}
                              onClick={(e) => { e.stopPropagation(); alternarExpansao(id); }}>
                              <Icone nome="ChevronRight" size={13} className={aberta ? css.setaAberta : undefined} />
                            </button>
                          </span>
                        )}
                        {visiveis.map((c) => (
                          <span key={c.id} role="cell"
                            className={`${css.td} ${c.alinhamento === 'fim' ? css.fim : ''} ${c.alinhamento === 'centro' ? css.centro : ''}`}>
                            {c.celula(linha)}
                          </span>
                        ))}
                        {temMenu && (
                          <span className={css.td} onClick={(e) => e.stopPropagation()}>
                            {menuLinha ? <MenuLinhaBtn itens={menuLinha(linha)} linha={linha} /> : acoes?.(linha)}
                          </span>
                        )}
                      </div>
                      {aberta && expansao && <div className={css.expansao}>{expansao(linha)}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {paginacao && paginacao.total > 0 && (
        <div className={css.rodape}>
          <span className={css.contagem}>
            {fmtInt(paginacao.total)} item(ns) · página {paginacao.pagina} de{' '}
            {Math.max(1, Math.ceil(paginacao.total / paginacao.porPagina))}
          </span>
          <select className={css.select} value={paginacao.porPagina} aria-label="Itens por página"
            onChange={(e) => paginacao.aoMudarPorPagina(Number(e.target.value))}>
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} por página</option>)}
          </select>
          <button type="button" className={css.btnPag} disabled={paginacao.pagina <= 1}
            onClick={() => paginacao.aoMudarPagina(paginacao.pagina - 1)}>
            <Icone nome="ChevronRight" size={13} className={css.setaEsq} /> Anterior
          </button>
          <button type="button" className={css.btnPag}
            disabled={paginacao.pagina >= Math.ceil(paginacao.total / paginacao.porPagina)}
            onClick={() => paginacao.aoMudarPagina(paginacao.pagina + 1)}>
            Próxima <Icone nome="ChevronRight" size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

/** Menu de contexto (⋮) por linha — dropdown que fecha ao clicar fora/Esc. */
function MenuLinhaBtn<T>({ itens, linha }: { itens: ItemMenuLinha<T>[]; linha: T }): JSX.Element {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent): void => { if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent): void => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc); };
  }, [aberto]);
  if (!itens.length) return <span />;
  return (
    <div className={css.menuWrap} ref={ref}>
      <button type="button" className={css.menuBtn} aria-haspopup="menu" aria-expanded={aberto}
        aria-label="Ações da linha" onClick={() => setAberto((v) => !v)}>⋮</button>
      {aberto && (
        <div className={css.menu} role="menu">
          {itens.map((it, i) => (
            <button key={i} type="button" role="menuitem"
              className={`${css.menuItem} ${it.perigo ? css.menuPerigo : ''}`}
              onClick={() => { setAberto(false); it.aoClicar(linha); }}>
              {it.icone && <Icone nome={it.icone} size={13} />} {it.rotulo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
