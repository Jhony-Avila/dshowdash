// _shared-react/components/DataGrid.tsx — grid server-side virtualizado
// @version 1.0.0  @created 2026-07-30
//
// Decisão 8.1 do dono: TanStack Table + TanStack Virtual (já instalados e já em
// produção no projeto) em vez de AG Grid.
//
// SERVER-SIDE DE VERDADE: este componente NÃO recebe a coleção inteira. Ele
// recebe a página atual e devolve, por callback, a intenção do usuário
// (ordenar, paginar, buscar). Quem consulta é a tela. Isso é o §64 — não
// carregar o histórico todo no navegador.
//
// A virtualização existe mesmo com página de 50: densidade compacta + colunas
// fixas + linhas de 34px tornam o custo de layout perceptível em telas grandes.

import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Badge, Medidor, EstadoVazio, BlocoCarregando, InfoSituacao } from './Primitivos';
import { porTipo, TipoFormato, truncar } from '../lib/formato';

export interface ColunaGrid {
  id: string;
  rotulo: string;
  tipo?: TipoFormato;
  alinhamento?: 'esquerda' | 'direita';
  ordenavel?: boolean;
  largura?: number;
  destaque?: boolean;      // valor principal da linha — recebe peso visual
  semaforo?: boolean;      // pinta por sinal: negativo=erro, positivo=aviso
  monoespacada?: boolean;
  mascarado?: boolean;     // dado pessoal/fiscal mascarado (§62)
  tooltip?: string;
}

export type Densidade = 'compacta' | 'normal' | 'confortavel';

export interface EstadoGrid {
  ordenar: string;
  direcao: 'asc' | 'desc';
  pagina: number;
  limite: number;
  busca: string;
}

export interface PropsDataGrid {
  colunas: ColunaGrid[];
  linhas: Record<string, unknown>[];
  total: number;
  estado: EstadoGrid;
  aoMudarEstado: (parcial: Partial<EstadoGrid>) => void;
  carregando?: boolean;
  totais?: Record<string, number>;
  /** Chave estável da linha. Sem ela o React reordena mal em ordenação. */
  chaveLinha?: (linha: Record<string, unknown>) => string;
  aoAbrirLinha?: (linha: Record<string, unknown>) => void;
  selecionaveis?: boolean;
  aoSelecionar?: (ids: string[]) => void;
  acoesEmLote?: { id: string; rotulo: string; aoExecutar: (ids: string[]) => void }[];
  /** Persistência de preferências (colunas ocultas, densidade) por tela. */
  chavePreferencias?: string;
  alturaMax?: number;
  vazioTitulo?: string;
  vazioDescricao?: string;
  filtroAtivo?: boolean;
}

const ALTURA_LINHA: Record<Densidade, number> = { compacta: 30, normal: 36, confortavel: 44 };

function lerPreferencias(chave?: string): { ocultas: string[]; densidade: Densidade } {
  const padrao = { ocultas: [] as string[], densidade: 'normal' as Densidade };
  if (!chave) return padrao;
  try {
    const cru = localStorage.getItem(`dshow.bling.grid.${chave}`);
    if (!cru) return padrao;
    const p = JSON.parse(cru);
    return {
      ocultas: Array.isArray(p.ocultas) ? p.ocultas : [],
      densidade: ['compacta', 'normal', 'confortavel'].includes(p.densidade) ? p.densidade : 'normal',
    };
  } catch { return padrao; }
}

function gravarPreferencias(chave: string | undefined, v: { ocultas: string[]; densidade: Densidade }) {
  if (!chave) return;
  try { localStorage.setItem(`dshow.bling.grid.${chave}`, JSON.stringify(v)); } catch { /* cota cheia: não é erro fatal */ }
}

/** CSV com BOM: sem ele o Excel em pt-BR abre acento quebrado. */
function paraCsv(colunas: ColunaGrid[], linhas: Record<string, unknown>[]): string {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const cab = colunas.map(c => esc(c.rotulo)).join(';');
  const corpo = linhas.map(l => colunas.map(c => esc(l[c.id])).join(';')).join('\n');
  return `﻿${cab}\n${corpo}`;
}

export function DataGrid({
  colunas, linhas, total, estado, aoMudarEstado, carregando = false, totais,
  chaveLinha, aoAbrirLinha, selecionaveis = false, aoSelecionar, acoesEmLote,
  chavePreferencias, alturaMax = 560, vazioTitulo, vazioDescricao, filtroAtivo,
}: PropsDataGrid) {
  const [prefs, setPrefs] = React.useState(() => lerPreferencias(chavePreferencias));
  const [selecionadas, setSelecionadas] = React.useState<Set<string>>(new Set());
  const [menuColunas, setMenuColunas] = React.useState(false);
  const refRolagem = React.useRef<HTMLDivElement>(null);

  const idDe = React.useCallback(
    (l: Record<string, unknown>) => (chaveLinha ? chaveLinha(l) : String(l.id ?? '')),
    [chaveLinha],
  );

  const visiveis = React.useMemo(
    () => colunas.filter(c => !prefs.ocultas.includes(c.id)),
    [colunas, prefs.ocultas],
  );

  const alturaLinha = ALTURA_LINHA[prefs.densidade];

  const virtual = useVirtualizer({
    count: linhas.length,
    getScrollElement: () => refRolagem.current,
    estimateSize: () => alturaLinha,
    overscan: 12,
  });

  // Seleção é limpa quando a página muda: manter IDs de outra página produz
  // ação em lote sobre registro que o usuário não está vendo.
  React.useEffect(() => {
    setSelecionadas(new Set());
    aoSelecionar?.([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.pagina, estado.ordenar, estado.direcao, estado.busca]);

  const alternarSelecao = (id: string) => {
    const nova = new Set(selecionadas);
    if (nova.has(id)) nova.delete(id); else nova.add(id);
    setSelecionadas(nova);
    aoSelecionar?.([...nova]);
  };

  const alternarTodas = () => {
    const todas = linhas.map(idDe);
    const nova = selecionadas.size === todas.length ? new Set<string>() : new Set(todas);
    setSelecionadas(nova);
    aoSelecionar?.([...nova]);
  };

  const ordenarPor = (id: string) => {
    if (estado.ordenar === id) {
      aoMudarEstado({ direcao: estado.direcao === 'asc' ? 'desc' : 'asc', pagina: 1 });
    } else {
      aoMudarEstado({ ordenar: id, direcao: 'desc', pagina: 1 });
    }
  };

  const alternarColuna = (id: string) => {
    const ocultas = prefs.ocultas.includes(id)
      ? prefs.ocultas.filter(x => x !== id)
      : [...prefs.ocultas, id];
    const novo = { ...prefs, ocultas };
    setPrefs(novo);
    gravarPreferencias(chavePreferencias, novo);
  };

  const trocarDensidade = (d: Densidade) => {
    const novo = { ...prefs, densidade: d };
    setPrefs(novo);
    gravarPreferencias(chavePreferencias, novo);
  };

  const exportar = () => {
    const csv = paraCsv(visiveis, linhas);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `bling-${chavePreferencias ?? 'dados'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const paginas = Math.max(1, Math.ceil(total / estado.limite));
  const larguraCol = (c: ColunaGrid) => c.largura ?? (c.tipo === 'moeda' || c.tipo === 'numero' ? 118
    : c.tipo === 'inteiro' ? 90 : c.tipo === 'percentual' ? 92
    : c.tipo === 'data' ? 100 : c.tipo === 'datahora' ? 142
    : c.tipo === 'badge' ? 138 : c.tipo === 'medidor' ? 116 : 150);

  const celula = (linha: Record<string, unknown>, c: ColunaGrid) => {
    const v = linha[c.id];

    if (c.tipo === 'badge') {
      const info = (linha[`${c.id}_info`] ?? null) as InfoSituacao | null;
      return <Badge info={info ?? (v ? { chave: String(v), rotulo: String(v), cor: 'neutro' } : null)} />;
    }
    if (c.tipo === 'medidor') return <Medidor valor={v as number} />;
    if (c.tipo === 'booleano') {
      return <span style={{ color: v === true ? 'var(--bl-sucesso)' : 'var(--bl-texto-3)' }}>
        {v === true ? 'Sim' : v === false ? 'Não' : '—'}
      </span>;
    }
    if (c.tipo === 'imagem') {
      return v
        ? <span aria-label="Com imagem" title="Produto com imagem" style={{
            display: 'inline-block', width: 22, height: 22, borderRadius: 4,
            background: 'var(--bl-superficie-2)', border: '1px solid var(--bl-borda)',
          }} />
        : <span title="Sem imagem" style={{ color: 'var(--bl-texto-3)' }}>—</span>;
    }
    if (c.tipo === 'link') {
      return v ? <span style={{ color: 'var(--bl-info)' }}>Disponível</span>
               : <span style={{ color: 'var(--bl-texto-3)' }}>—</span>;
    }

    const texto = porTipo(v, (c.tipo ?? 'texto') as TipoFormato, true);
    const num = typeof v === 'number' ? v : null;
    const cor = c.semaforo && num !== null
      ? (num < 0 ? 'var(--bl-erro)' : num > 0 ? 'var(--bl-aviso)' : 'var(--bl-texto-2)')
      : undefined;

    return (
      <span
        title={String(v ?? '')}
        style={{
          color: cor,
          fontWeight: c.destaque ? 600 : undefined,
          fontFamily: c.monoespacada ? 'var(--bl-fonte-mono)' : undefined,
          fontSize: c.monoespacada ? 11 : undefined,
          fontVariantNumeric: 'tabular-nums',
          opacity: c.mascarado ? .85 : 1,
          display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {c.tipo === 'texto' && typeof v === 'string' ? truncar(v, 90) : texto}
      </span>
    );
  };

  const itens = virtual.getVirtualItems();

  return (
    <div className="bl-cartao" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* ── Barra de ferramentas ────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        padding: '9px 12px', borderBottom: '1px solid var(--bl-borda)',
      }}>
        <input
          type="search"
          value={estado.busca}
          onChange={e => aoMudarEstado({ busca: e.target.value, pagina: 1 })}
          placeholder="Buscar nesta tela…"
          aria-label="Buscar"
          style={{
            height: 28, minWidth: 190, flex: '0 1 260px', padding: '0 10px',
            font: 'inherit', fontSize: 12, color: 'var(--bl-texto)',
            background: 'var(--bl-superficie-2)', border: '1px solid var(--bl-borda)',
            borderRadius: 'var(--bl-raio-sm)',
          }}
        />

        <span style={{ fontSize: 12, color: 'var(--bl-texto-2)' }}>
          {carregando ? 'carregando…' : `${total.toLocaleString('pt-BR')} registro${total === 1 ? '' : 's'}`}
        </span>

        <div style={{ flex: 1 }} />

        {selecionadas.size > 0 && acoesEmLote?.length ? (
          <>
            <span style={{ fontSize: 12, color: 'var(--bl-verde)' }}>{selecionadas.size} selecionado(s)</span>
            {acoesEmLote.map(a => (
              <button key={a.id} type="button" className="bl-botao"
                onClick={() => a.aoExecutar([...selecionadas])}>{a.rotulo}</button>
            ))}
          </>
        ) : null}

        <div style={{ position: 'relative' }}>
          <button type="button" className="bl-botao" onClick={() => setMenuColunas(v => !v)}
            aria-expanded={menuColunas} aria-haspopup="menu">
            Colunas{prefs.ocultas.length > 0 ? ` (${visiveis.length}/${colunas.length})` : ''}
          </button>
          {menuColunas && (
            <>
              <div onClick={() => setMenuColunas(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
              <div role="menu" style={{
                position: 'absolute', right: 0, top: 34, zIndex: 31, width: 232,
                maxHeight: 320, overflow: 'auto', padding: 8,
                background: 'var(--bl-overlay)', border: '1px solid var(--bl-borda)',
                borderRadius: 'var(--bl-raio)', boxShadow: 'var(--bl-sombra)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--bl-texto-3)', padding: '2px 4px 8px' }}>Densidade</div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                  {(['compacta', 'normal', 'confortavel'] as Densidade[]).map(d => (
                    <button key={d} type="button" onClick={() => trocarDensidade(d)}
                      className="bl-botao"
                      style={{
                        flex: 1, height: 24, fontSize: 11, justifyContent: 'center',
                        background: prefs.densidade === d ? 'var(--bl-verde-suave)' : undefined,
                        borderColor: prefs.densidade === d ? 'var(--bl-verde-borda)' : undefined,
                      }}>
                      {d === 'compacta' ? 'Densa' : d === 'normal' ? 'Normal' : 'Ampla'}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--bl-texto-3)', padding: '2px 4px 6px' }}>Colunas visíveis</div>
                {colunas.map(c => (
                  <label key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px',
                    fontSize: 12, cursor: 'pointer',
                  }}>
                    <input type="checkbox" checked={!prefs.ocultas.includes(c.id)}
                      onChange={() => alternarColuna(c.id)} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.rotulo}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <button type="button" className="bl-botao" onClick={exportar} disabled={linhas.length === 0}>
          Exportar CSV
        </button>
      </div>

      {/* ── Corpo ──────────────────────────────────────────── */}
      {carregando && linhas.length === 0 ? (
        <div style={{ padding: 16 }}><BlocoCarregando linhas={7} /></div>
      ) : linhas.length === 0 ? (
        <EstadoVazio
          titulo={vazioTitulo ?? 'Nenhum registro no recorte atual'}
          descricao={vazioDescricao ?? 'Ajuste o período ou os filtros para ver outros dados.'}
          filtroAtivo={filtroAtivo}
        />
      ) : (
        <div
          ref={refRolagem}
          className="bl-rola-x"
          style={{ overflow: 'auto', maxHeight: alturaMax, position: 'relative' }}
        >
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: 'max-content', minWidth: '100%' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <tr>
                {selecionaveis && (
                  <th style={{ ...estiloTh, width: 34, position: 'sticky', left: 0, zIndex: 3 }}>
                    <input type="checkbox" aria-label="Selecionar todas as linhas da página"
                      checked={selecionadas.size === linhas.length && linhas.length > 0}
                      onChange={alternarTodas} />
                  </th>
                )}
                {visiveis.map((c, i) => {
                  const ativo = estado.ordenar === c.id;
                  // A primeira coluna de texto fica fixa à esquerda: sem isso o
                  // usuário perde a referência da linha ao rolar na horizontal.
                  const fixa = i === 0;
                  return (
                    <th
                      key={c.id}
                      title={c.tooltip}
                      aria-sort={ativo ? (estado.direcao === 'asc' ? 'ascending' : 'descending') : 'none'}
                      style={{
                        ...estiloTh,
                        width: larguraCol(c), minWidth: larguraCol(c),
                        textAlign: c.alinhamento === 'direita' ? 'right' : 'left',
                        position: fixa ? 'sticky' : undefined,
                        left: fixa ? (selecionaveis ? 34 : 0) : undefined,
                        zIndex: fixa ? 3 : undefined,
                      }}
                    >
                      {c.ordenavel !== false ? (
                        <button type="button" onClick={() => ordenarPor(c.id)}
                          style={{
                            font: 'inherit', color: ativo ? 'var(--bl-texto)' : 'inherit',
                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            flexDirection: c.alinhamento === 'direita' ? 'row-reverse' : 'row',
                            width: '100%', justifyContent: c.alinhamento === 'direita' ? 'flex-start' : 'flex-start',
                          }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.rotulo}</span>
                          <span aria-hidden style={{ opacity: ativo ? 1 : .3, fontSize: 9 }}>
                            {ativo ? (estado.direcao === 'asc' ? '▲' : '▼') : '▾'}
                          </span>
                        </button>
                      ) : c.rotulo}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {/* espaçador superior da virtualização */}
              {itens.length > 0 && itens[0].start > 0 && (
                <tr style={{ height: itens[0].start }}><td colSpan={visiveis.length + (selecionaveis ? 1 : 0)} /></tr>
              )}

              {itens.map(vi => {
                const linha = linhas[vi.index];
                const id = idDe(linha);
                const sel = selecionadas.has(id);
                const par = vi.index % 2 === 1;
                return (
                  <tr
                    key={id || vi.index}
                    onClick={aoAbrirLinha ? () => aoAbrirLinha(linha) : undefined}
                    tabIndex={aoAbrirLinha ? 0 : undefined}
                    onKeyDown={aoAbrirLinha ? (e => { if (e.key === 'Enter') aoAbrirLinha(linha); }) : undefined}
                    style={{
                      height: alturaLinha,
                      cursor: aoAbrirLinha ? 'pointer' : undefined,
                      background: sel ? 'var(--bl-verde-suave)' : par ? 'var(--bl-superficie-2)' : 'transparent',
                    }}
                    className="bl-linha"
                  >
                    {selecionaveis && (
                      <td style={{ ...estiloTd, position: 'sticky', left: 0, background: 'inherit' }}
                        onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={sel} onChange={() => alternarSelecao(id)}
                          aria-label={`Selecionar ${id}`} />
                      </td>
                    )}
                    {visiveis.map((c, i) => (
                      <td key={c.id} style={{
                        ...estiloTd,
                        textAlign: c.alinhamento === 'direita' ? 'right' : 'left',
                        position: i === 0 ? 'sticky' : undefined,
                        left: i === 0 ? (selecionaveis ? 34 : 0) : undefined,
                        background: i === 0 ? 'inherit' : undefined,
                        maxWidth: larguraCol(c),
                      }}>
                        {celula(linha, c)}
                      </td>
                    ))}
                  </tr>
                );
              })}

              {/* espaçador inferior */}
              {itens.length > 0 && (
                <tr style={{ height: Math.max(0, virtual.getTotalSize() - (itens[itens.length - 1]?.end ?? 0)) }}>
                  <td colSpan={visiveis.length + (selecionaveis ? 1 : 0)} />
                </tr>
              )}
            </tbody>

            {totais && Object.keys(totais).length > 0 && (
              <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
                <tr>
                  {selecionaveis && <td style={{ ...estiloTfoot, position: 'sticky', left: 0, zIndex: 3 }} />}
                  {visiveis.map((c, i) => (
                    <td key={c.id} style={{
                      ...estiloTfoot,
                      textAlign: c.alinhamento === 'direita' ? 'right' : 'left',
                      position: i === 0 ? 'sticky' : undefined,
                      left: i === 0 ? (selecionaveis ? 34 : 0) : undefined,
                      zIndex: i === 0 ? 3 : undefined,
                    }}>
                      {i === 0 && totais[c.id] === undefined
                        ? <span style={{ color: 'var(--bl-texto-3)' }}>Total da consulta</span>
                        : totais[c.id] !== undefined
                          ? porTipo(totais[c.id], (c.tipo ?? 'numero') as TipoFormato, true)
                          : null}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* ── Paginação ──────────────────────────────────────── */}
      {total > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          padding: '8px 12px', borderTop: '1px solid var(--bl-borda)', fontSize: 12,
        }}>
          <span style={{ color: 'var(--bl-texto-2)' }}>
            {((estado.pagina - 1) * estado.limite + 1).toLocaleString('pt-BR')}–
            {Math.min(estado.pagina * estado.limite, total).toLocaleString('pt-BR')} de {total.toLocaleString('pt-BR')}
          </span>
          <div style={{ flex: 1 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--bl-texto-2)' }}>
            Por página
            <select
              value={estado.limite}
              onChange={e => aoMudarEstado({ limite: Number(e.target.value), pagina: 1 })}
              style={{
                height: 26, font: 'inherit', fontSize: 12, color: 'var(--bl-texto)',
                background: 'var(--bl-superficie-2)', border: '1px solid var(--bl-borda)',
                borderRadius: 'var(--bl-raio-sm)',
              }}
            >
              {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button type="button" className="bl-botao" disabled={estado.pagina <= 1}
            onClick={() => aoMudarEstado({ pagina: estado.pagina - 1 })}>Anterior</button>
          <span style={{ color: 'var(--bl-texto-2)' }}>{estado.pagina} / {paginas}</span>
          <button type="button" className="bl-botao" disabled={estado.pagina >= paginas}
            onClick={() => aoMudarEstado({ pagina: estado.pagina + 1 })}>Próxima</button>
        </div>
      )}
    </div>
  );
}

const estiloTh: React.CSSProperties = {
  padding: '8px 10px', fontSize: 11, fontWeight: 600,
  letterSpacing: '.02em', color: 'var(--bl-texto-2)',
  background: 'var(--bl-bg-elevado)', borderBottom: '1px solid var(--bl-borda)',
  whiteSpace: 'nowrap',
};

const estiloTd: React.CSSProperties = {
  padding: '0 10px', fontSize: 12, borderBottom: '1px solid var(--bl-borda)',
  overflow: 'hidden',
};

const estiloTfoot: React.CSSProperties = {
  padding: '8px 10px', fontSize: 12, fontWeight: 600,
  background: 'var(--bl-bg-elevado)', borderTop: '1px solid var(--bl-borda-forte)',
  fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
};
