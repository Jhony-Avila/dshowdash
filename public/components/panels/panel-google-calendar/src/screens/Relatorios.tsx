// screens/Relatorios.tsx — central de relatórios (§64) e visualizações D3 (§40, §65).
// @version 1.0.0  @created 2026-07-30
//
// UMA tela genérica, dirigida pelo contrato {colunas, linhas, totais, serie}
// que o backend devolve. Onze relatórios com onze telas seria onze lugares para
// consertar quando o formato mudar; assim, relatório novo é só um `case` no PHP.
//
// A formatação de célula vem do `tipo` DECLARADO na coluna, nunca de adivinhar
// pelo conteúdo — um `0.5` pode ser meia hora, meio por cento ou meia unidade.
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { servico } from '../services';
import { chaves } from '../lib/api';
import type {
  ColunaRelatorio, LinhaRelatorio, Relatorio, TipoRelatorio,
} from '../services/types';
import type { Preferencias } from '../shell/types';
import { Cartao, Chip } from '../shell/ui';
import { Icone } from '../shell/Icone';
import { EstadoErro, EstadoVazio, SkeletonBloco } from './Estados';
import { FluxoD3, RedeD3 } from './FluxoD3';
import { duracao, dataHora, hojeYmd, somaDias } from '../lib/tz';
import { gerarCsv, baixarCsv, baixarXlsx, imprimirRelatorio, nomeArquivo } from '../lib/exportar';

const PERIODOS = [
  { dias: 7,   label: '7 dias' },
  { dias: 28,  label: '28 dias' },
  { dias: 90,  label: '90 dias' },
  { dias: 180, label: '6 meses' },
];

const CHAVE_FAV = 'dshow.google-calendar.relatorios.favoritos';

function lerFavoritos(): string[] {
  try { return JSON.parse(localStorage.getItem(CHAVE_FAV) ?? '[]') as string[]; }
  catch { return []; }
}

/** Formata a célula pelo tipo declarado na coluna. */
function celula(v: unknown, c: ColunaRelatorio, tz: string): string {
  if (v === null || v === undefined || v === '') return '—';
  switch (c.tipo) {
    case 'duracao':    return duracao(Number(v) || 0);
    case 'percentual': return `${Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
    case 'numero':     return Number(v).toLocaleString('pt-BR');
    case 'datahora':   return String(v).length === 10 ? String(v) : dataHora(String(v), tz);
    case 'data': {
      const [a, m, d] = String(v).split('-');
      return d ? `${d}/${m}/${a}` : String(v);
    }
    default:           return String(v);
  }
}

export function Relatorios({ tz, prefs }: { tz: string; prefs: Preferencias }) {
  const [tipo, setTipo] = useState('carga-dia');
  const [dias, setDias] = useState(28);
  const [ordem, setOrdem] = useState<{ col: string; desc: boolean } | null>(null);
  const [baixando, setBaixando] = useState(false);
  const [erroExport, setErroExport] = useState<string | null>(null);
  const [favoritos, setFavoritos] = useState<string[]>(lerFavoritos);
  const [pessoaRede, setPessoaRede] = useState<string | null>(null);

  const ate = hojeYmd(tz);
  const de = somaDias(ate, -(dias - 1));
  const janela = {
    de, ate, tz,
    calendars: prefs.calendariosOcultos.length
      ? undefined                       // filtro por ocultos é negativo; o backend recebe a lista positiva
      : undefined,
  };

  const qTipos = useQuery({
    queryKey: chaves.tiposRelatorio,
    queryFn: () => servico.getTiposRelatorio(),
    staleTime: 10 * 60_000,             // catálogo não muda durante a sessão
  });

  const ehViz = tipo === 'fluxo' || tipo === 'rede';

  const qRel = useQuery({
    queryKey: chaves.relatorio(tipo, { de, ate, tz }),
    queryFn: () => servico.getRelatorio(tipo, janela),
    enabled: !ehViz,
  });
  const qFluxo = useQuery({
    queryKey: chaves.fluxo({ de, ate, tz }),
    queryFn: () => servico.getFluxo(janela),
    enabled: tipo === 'fluxo',
  });
  const qRede = useQuery({
    queryKey: chaves.rede({ de, ate, tz }),
    queryFn: () => servico.getRede(janela),
    enabled: tipo === 'rede',
  });

  function alternarFavorito(id: string) {
    setFavoritos((atual) => {
      const novo = atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id];
      try { localStorage.setItem(CHAVE_FAV, JSON.stringify(novo)); } catch { /* modo privado */ }
      return novo;
    });
  }

  const grupos = useMemo(() => {
    const g = new Map<string, TipoRelatorio[]>();
    for (const t of qTipos.data ?? []) {
      const l = g.get(t.grupo) ?? [];
      l.push(t);
      g.set(t.grupo, l);
    }
    // As visualizações não vêm do catálogo do backend: são figuras, não tabelas.
    g.set('Visualizações', [
      { id: 'fluxo', titulo: 'Fluxo de reuniões', grupo: 'Visualizações',
        descricao: 'De onde vêm, que formato têm e como terminam (§40).' },
      { id: 'rede', titulo: 'Rede de coparticipação', grupo: 'Visualizações',
        descricao: 'Quem se reúne com quem (§65).' },
    ]);
    return [...g.entries()];
  }, [qTipos.data]);

  const rel: Relatorio | undefined = qRel.data;

  const linhasOrdenadas = useMemo<LinhaRelatorio[]>(() => {
    if (!rel) return [];
    if (!ordem) return rel.linhas;
    const col = rel.colunas.find((c) => c.id === ordem.col);
    if (!col) return rel.linhas;
    const numerica = col.tipo === 'numero' || col.tipo === 'duracao' || col.tipo === 'percentual';
    return [...rel.linhas].sort((a, b) => {
      const x = a[ordem.col], y = b[ordem.col];
      const r = numerica
        ? (Number(x) || 0) - (Number(y) || 0)
        : String(x ?? '').localeCompare(String(y ?? ''), 'pt-BR');
      return ordem.desc ? -r : r;
    });
  }, [rel, ordem]);

  function exportar() {
    if (!rel) return;
    const csv = gerarCsv(rel.colunas, linhasOrdenadas, rel.totais, [
      rel.titulo,
      `Período: ${de} a ${ate}`,
      `Fuso: ${rel.time_zone}`,
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      'Origem: Dshow Dash · Google Calendar (ambiente de demonstração)',
    ]);
    baixarCsv(nomeArquivo(rel.tipo, de, ate), csv);
  }

  async function exportarXlsx() {
    if (!rel) return;
    setErroExport(null);
    setBaixando(true);
    try {
      // O servidor refaz a agregação com os MESMOS filtros — não se manda a
      // tabela já montada. Assim a planilha nunca discorda da tela por causa
      // de um dado que mudou entre o render e o clique.
      const p = new URLSearchParams({ de, ate, tz: rel.time_zone });
      await baixarXlsx(rel.tipo, p, nomeArquivo(rel.tipo, de, ate));
    } catch (e) {
      setErroExport(e instanceof Error ? e.message : 'Falha ao gerar a planilha.');
    } finally {
      setBaixando(false);
    }
  }

  const carregando = ehViz
    ? (tipo === 'fluxo' ? qFluxo.isLoading : qRede.isLoading)
    : qRel.isLoading;
  const erro = ehViz
    ? (tipo === 'fluxo' ? qFluxo.error : qRede.error)
    : qRel.error;

  return (
    <div className="gc-tela gc-tela-relatorios">
      <div className="gc-rel-layout">
        {/* Seletor — fica fora do fluxo de impressão. */}
        <aside className="gc-rel-menu gc-nao-imprime" aria-label="Relatórios disponíveis">
          {favoritos.length > 0 && (
            <div className="gc-rel-grupo">
              <h4>Favoritos</h4>
              <ul>
                {favoritos.map((id) => {
                  const t = grupos.flatMap(([, l]) => l).find((x) => x.id === id);
                  if (!t) return null;
                  return (
                    <li key={id}>
                      <button type="button"
                              className={`gc-rel-item${tipo === id ? ' is-ativo' : ''}`}
                              onClick={() => setTipo(id)}>
                        <Icone nome="star" tamanho={12} /> {t.titulo}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {qTipos.isLoading && <SkeletonBloco linhas={8} altura={20} />}

          {grupos.map(([grupo, itens]) => (
            <div className="gc-rel-grupo" key={grupo}>
              <h4>{grupo}</h4>
              <ul>
                {itens.map((t) => (
                  <li key={t.id}>
                    <button type="button"
                            className={`gc-rel-item${tipo === t.id ? ' is-ativo' : ''}`}
                            onClick={() => { setTipo(t.id); setOrdem(null); }}
                            title={t.descricao}>
                      {t.titulo}
                    </button>
                    <button type="button" className="gc-rel-fav"
                            onClick={() => alternarFavorito(t.id)}
                            aria-pressed={favoritos.includes(t.id)}
                            aria-label={favoritos.includes(t.id)
                              ? `Remover ${t.titulo} dos favoritos`
                              : `Adicionar ${t.titulo} aos favoritos`}>
                      <Icone nome="star" tamanho={12}
                             className={favoritos.includes(t.id) ? 'is-fav' : undefined} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        <section className="gc-rel-conteudo">
          <div className="gc-barra-filtros gc-nao-imprime">
            <div className="gc-chips">
              {PERIODOS.map((p) => (
                <Chip key={p.dias} texto={p.label} ativo={dias === p.dias}
                      onClick={() => setDias(p.dias)} />
              ))}
            </div>
            <div className="gc-chips gc-chips-fim">
              <button type="button" className="gc-btn gc-btn-fantasma"
                      onClick={exportar} disabled={!rel || rel.linhas.length === 0}>
                <Icone nome="external-link" tamanho={14} /> Exportar CSV
              </button>
              <button type="button" className="gc-btn gc-btn-fantasma"
                      onClick={() => void exportarXlsx()}
                      disabled={!rel || rel.linhas.length === 0 || baixando}
                      title="Planilha com número e data em tipo nativo — soma, ordena e filtra no Excel.">
                <Icone nome="sheet" tamanho={14} />
                {baixando ? 'Gerando…' : 'Exportar XLSX'}
              </button>
              <button type="button" className="gc-btn gc-btn-fantasma"
                      onClick={imprimirRelatorio} disabled={carregando}>
                <Icone nome="copy" tamanho={14} /> Imprimir / PDF
              </button>
            </div>
          </div>

          {erroExport && (
            <p className="gc-aviso gc-aviso-erro" role="alert">
              <Icone nome="alerta" tamanho={13} /> {erroExport}
            </p>
          )}

          {erro && <EstadoErro erro={erro} onRetry={() => {
            if (tipo === 'fluxo') void qFluxo.refetch();
            else if (tipo === 'rede') void qRede.refetch();
            else void qRel.refetch();
          }} />}

          {carregando && <SkeletonBloco linhas={10} altura={26} />}

          {/* Visualizações */}
          {!carregando && !erro && tipo === 'fluxo' && qFluxo.data && (
            <Cartao><FluxoD3 dados={qFluxo.data} /></Cartao>
          )}
          {!carregando && !erro && tipo === 'rede' && qRede.data && (
            <Cartao>
              <RedeD3 dados={qRede.data} selecionado={pessoaRede} onSelecionar={setPessoaRede} />
            </Cartao>
          )}

          {/* Relatório tabular */}
          {!carregando && !erro && rel && (
            <>
              <div className="gc-rel-cabecalho">
                <div>
                  <h3>{rel.titulo}</h3>
                  <p className="gc-nota">{rel.descricao}</p>
                </div>
                <p className="gc-rel-periodo">
                  {de.split('-').reverse().join('/')} a {ate.split('-').reverse().join('/')}
                  <span className="gc-td-fraco"> · {rel.time_zone}</span>
                </p>
              </div>

              {rel.linhas.length === 0 ? (
                <EstadoVazio titulo="Sem dados no período"
                             mensagem="Amplie o intervalo ou escolha outro relatório." />
              ) : (
                <>
                  {rel.serie.length > 1 && (
                    <Cartao>
                      <BarrasSimples titulo={rel.serie_titulo ?? ''} dados={rel.serie}
                                     unidade={rel.serie_unidade ?? ''} />
                    </Cartao>
                  )}

                  <Cartao>
                    <div className="gc-grid-wrap">
                      <table className="gc-grid gc-grid-compacta gc-rel-tabela">
                        <caption className="gc-sr">
                          {rel.titulo} — período de {de} a {ate}
                        </caption>
                        <thead>
                          <tr>
                            {rel.colunas.map((c) => {
                              const ativa = ordem?.col === c.id;
                              return (
                                <th key={c.id}
                                    className={`is-ordenavel${c.alinhar === 'direita' ? ' is-direita' : ''}`}
                                    aria-sort={ativa ? (ordem!.desc ? 'descending' : 'ascending') : 'none'}
                                    onClick={() => setOrdem((o) =>
                                      o?.col === c.id ? { col: c.id, desc: !o.desc } : { col: c.id, desc: true })}>
                                  {c.rotulo}
                                  {ativa && <Icone nome="chevron-down" tamanho={11} />}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {linhasOrdenadas.map((l, i) => (
                            <tr key={i}>
                              {rel.colunas.map((c) => (
                                <td key={c.id} className={c.alinhar === 'direita' ? 'is-direita' : undefined}>
                                  {celula(l[c.id], c, rel.time_zone)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                        {Object.keys(rel.totais).length > 0 && (
                          <tfoot>
                            <tr>
                              {rel.colunas.map((c, i) => (
                                <td key={c.id} className={c.alinhar === 'direita' ? 'is-direita' : undefined}>
                                  {i === 0
                                    ? <strong>Total ({rel.linhas.length})</strong>
                                    : (c.total
                                        ? <strong>{celula(rel.totais[c.id], c, rel.time_zone)}</strong>
                                        : '')}
                                </td>
                              ))}
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                    <p className="gc-nota">
                      {rel.linhas.length.toLocaleString('pt-BR')} linha(s).
                      Colunas de duração saem em minutos no CSV, para somar na planilha.
                    </p>
                  </Cartao>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * Barras em SVG puro.
 *
 * Não vale acordar o ECharts aqui: o gráfico do relatório é uma leitura de
 * apoio (uma série, sem zoom nem tooltip rico), e o chunk do ECharts só é
 * baixado por quem abre "Carga de Reuniões". Trazer 496 kB para desenhar
 * doze retângulos seria pagar caro por pouco.
 */
function BarrasSimples({ titulo, dados, unidade }: {
  titulo: string; dados: Array<{ rotulo: string; valor: number }>; unidade: string;
}) {
  const max = Math.max(1, ...dados.map((d) => d.valor));
  const L = 640, A = 150, ESQ = 4, BASE = A - 26;
  const larg = Math.max(6, Math.min(30, (L - ESQ * 2) / dados.length - 4));
  const passo = (L - ESQ * 2) / dados.length;
  const denso = dados.length > 20;

  return (
    <figure className="gc-figura">
      <figcaption className="gc-figura-titulo">{titulo}</figcaption>
      <svg viewBox={`0 0 ${L} ${A}`} className="gc-barras-svg" role="img"
           aria-label={`${titulo}. Dados equivalentes na tabela dentro desta figura.`}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={0} x2={L} y1={BASE - BASE * f * 0.92} y2={BASE - BASE * f * 0.92}
                className="gc-barras-grade" />
        ))}
        {dados.map((d, i) => {
          const h = Math.max(1, (d.valor / max) * BASE * 0.92);
          const x = ESQ + i * passo + (passo - larg) / 2;
          return (
            <g key={`${d.rotulo}-${i}`}>
              <rect x={x} y={BASE - h} width={larg} height={h} rx={4} className="gc-barras-barra">
                <title>{`${d.rotulo}: ${d.valor.toLocaleString('pt-BR')} ${unidade}`}</title>
              </rect>
              {(!denso || i % Math.ceil(dados.length / 14) === 0) && (
                <text x={x + larg / 2} y={A - 8} textAnchor="middle" className="gc-barras-rot">
                  {d.rotulo}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Alternativa textual PRÓPRIA (§80), não a tabela do relatório abaixo:
          a série do gráfico nem sempre é a tabela inteira — "top 12
          participantes", por exemplo, mostra 12 barras para uma tabela de 40
          linhas. Mandar o leitor de tela para a tabela de baixo daria outro
          conjunto de números. */}
      <details className="gc-tabela-alt">
        <summary>Ver dados do gráfico em tabela</summary>
        <div className="gc-grid-wrap">
          <table className="gc-grid gc-grid-compacta">
            <thead><tr><th>Item</th><th>{unidade || 'valor'}</th></tr></thead>
            <tbody>
              {dados.map((d, i) => (
                <tr key={`${d.rotulo}-${i}`}>
                  <td>{d.rotulo}</td>
                  <td>{d.valor.toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
