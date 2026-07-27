// screens/Funis.tsx — funis: funil visual, conversão/gargalo e comparação entre funis.
// @version 2.0.0  @created 2026-07-21
//
// v1.0.0: lista de barras com negócios abertos por etapa (GET /pipelines).
// v2.0.0 (Fase 4): passa a ler GET /funnel e entrega
//   • seletor de funil em chips (com contagem) — 5 funis empilhados viravam ruído;
//   • funil visual (ECharts) do ALCANCE por etapa;
//   • tabela de etapas com conversão para a próxima, queda e GARGALO destacado;
//   • desfecho por etapa (aberto/ganho/perdido) — dado factual, sem inferência;
//   • comparação entre funis (volume, conversão, ticket e ciclo lado a lado).
//
// ⚠️ HONESTIDADE DO DADO: `pipe_deal_history` está vazia — não existe trilha de
// transições de etapa. O backend explica isso em `nota` e a tela REPRODUZ o aviso:
// "alcance" é estimativa (assume avanço em ordem), enquanto abertos/ganhos/perdidos
// por etapa são fatos (a etapa congela no fechamento). Não misturar os dois na leitura.
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GitBranch, TriangleAlert } from 'lucide-react';
import { apiGet, chaves, ApiError } from '../lib/api';
import { fmtBRL, fmtNum } from '../lib/format';
import { PageHeader } from './PageHeader';
import { EstadoErro, SkeletonBloco } from './Estados';
import { EChartCard } from '../viz/ChartCard';
import { usePaleta } from '../viz/tema';
import { optColunasEmpilhadas, optFunil, optBarras, type PontoXY } from '../viz/opts';
import type { PipeStatus, PipeFunnelData, PipeFunnelPipeline } from '../shell/types';

export function Funis({ status }: { status?: PipeStatus }) {
  const { data, isLoading, error, refetch } = useQuery<PipeFunnelData>({
    queryKey: chaves.funnel,
    queryFn: ({ signal }) => apiGet<PipeFunnelData>('/funnel', undefined, signal),
    enabled: status?.status === 'connected',
    refetchInterval: 120_000,
  });

  const pipelines = useMemo(() => data?.pipelines ?? [], [data]);
  // Funis sem nenhum negócio não somem: viram chip desabilitado, para o usuário ver
  // que existem (e que estão vazios) em vez de suspeitar que a tela perdeu dado.
  const comDados = useMemo(() => pipelines.filter((p) => p.totals.total > 0), [pipelines]);
  const [selecionado, setSelecionado] = useState<number | null>(null);

  useEffect(() => {
    if (selecionado == null && comDados.length > 0) setSelecionado(comDados[0].id);
  }, [comDados, selecionado]);

  if (status?.status !== 'connected') {
    return (
      <div>
        <PageHeader Icon={GitBranch} titulo="Funis" descricao="Negócios por etapa." />
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro titulo="Integração não conectada"
            detalhe="Conecte o token do Pipedrive na tela de Configurações para ver estes dados." />
        </div>
      </div>
    );
  }

  const atual = pipelines.find((p) => p.id === selecionado) ?? comDados[0] ?? null;

  return (
    <div>
      <PageHeader Icon={GitBranch} titulo="Funis" contagem={pipelines.length}
        descricao="Alcance por etapa, conversão, gargalo e comparação entre funis." />

      {error instanceof ApiError ? (
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro detalhe={error.ehAuth ? 'Sua sessão expirou. Recarregue a página e entre novamente.' : 'Falha ao consultar a base local.'}
            onRetry={error.ehAuth ? undefined : () => void refetch()} />
        </div>
      ) : isLoading ? (
        <div className="pp-card" style={{ maxWidth: 'none' }}><SkeletonBloco linhas={6} /></div>
      ) : pipelines.length === 0 ? (
        <div className="pp-card"><p className="pp-placeholder">Nenhum funil na base local.</p></div>
      ) : (
        <>
          <Comparacao data={data as PipeFunnelData} />

          <div className="pp-quick" style={{ margin: '0 0 16px' }}>
            {pipelines.map((p) => {
              const vazio = p.totals.total === 0;
              return (
                <button key={p.id} type="button"
                  className={`pp-quick-b${atual?.id === p.id ? ' is-active' : ''}`}
                  onClick={() => setSelecionado(p.id)} disabled={vazio}
                  title={vazio ? 'Funil sem negócios na base' : undefined}
                  style={vazio ? { opacity: .5, cursor: 'not-allowed' } : undefined}>
                  {p.name ?? '—'}{p.is_active ? '' : ' (inativo)'}
                  <span className="n">{fmtNum(p.totals.total)}</span>
                </button>
              );
            })}
          </div>

          {atual ? <DetalheFunil pl={atual} nota={data?.nota ?? ''} /> : (
            <div className="pp-card"><p className="pp-placeholder">Nenhum funil com negócios na base local.</p></div>
          )}
        </>
      )}
    </div>
  );
}

// ── Comparação entre funis ───────────────────────────────────────────────────

function Comparacao({ data }: { data: PipeFunnelData }) {
  const pal = usePaleta();
  const linhas = (data.comparison ?? []).filter((c) => c.total > 0);
  if (linhas.length < 2) return null; // com um funil só não há o que comparar

  const labels = linhas.map((c) => c.name ?? '—');

  return (
    <div className="pp-g12">
      {/* Proporção, não volume: o funil Principal tem ~20 mil negócios e os outros dezenas —
          em escala absoluta os pequenos viravam uma linha invisível. O total de cada funil
          está no tooltip e o volume bruto, no chip do seletor logo abaixo. */}
      <EChartCard className="pp-c-7" titulo="Comparação entre funis" altura={260}
        subtitulo="Composição de cada funil — o volume total está no tooltip"
        opcao={optColunasEmpilhadas(pal, labels, [
          { nome: 'Em aberto', dados: linhas.map((c) => c.abertos), cor: pal.sync },
          { nome: 'Ganhos', dados: linhas.map((c) => c.ganhos), cor: pal.ok },
          { nome: 'Perdidos', dados: linhas.map((c) => c.perdidos), cor: pal.danger },
        ], { formato: 'num', percentual: true })}
        aria="Composição dos negócios em cada funil" />

      <div className="pp-card pp-c-5">
        <h3>Desempenho lado a lado</h3>
        {/* Só duas colunas numéricas: num cartão de 5/12 uma quarta coluna era cortada.
            Ticket e carteira aberta descem para a linha de apoio do nome. */}
        <table className="pp-table pp-fixa">
          <thead>
            <tr>
              <th>Funil</th>
              <th className="ta-r pp-col-num">Conversão</th>
              <th className="ta-r pp-col-num">Ciclo</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((c) => (
              <tr key={c.id}>
                <td className="pp-td-title" title={c.name ?? ''}>
                  {c.name ?? '—'}
                  <div className="pp-td-sub">
                    {fmtNum(c.abertos)} em aberto · {fmtBRL(c.valor_aberto)}
                    {c.ticket_medio != null && <> · ticket {fmtBRL(c.ticket_medio)}</>}
                  </div>
                </td>
                <td className="ta-r" style={{ color: c.win_rate != null && c.win_rate >= 30 ? 'var(--pp-ok)' : undefined }}>
                  {c.win_rate != null ? `${c.win_rate}%` : '—'}
                </td>
                <td className="ta-r">{c.ciclo_medio_dias != null ? `${c.ciclo_medio_dias} d` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="pp-cc-rodape">
          Conversão = ganhos ÷ fechados (ganhos + perdidos) do funil, sobre todo o histórico.
        </p>
      </div>
    </div>
  );
}

// ── Detalhe de um funil ──────────────────────────────────────────────────────

function DetalheFunil({ pl, nota }: { pl: PipeFunnelPipeline; nota: string }) {
  const pal = usePaleta();
  const stages = pl.stages;
  const t = pl.totals;

  const pontosFunil: PontoXY[] = stages.map((s) => ({ label: s.stage ?? '—', valor: s.alcance }));
  const idxGargalo = pl.gargalo ? stages.findIndex((s) => s.stage_id === pl.gargalo?.stage_id) : -1;
  const temAlcance = pontosFunil.some((p) => p.valor > 0);

  const valores: PontoXY[] = stages
    .filter((s) => s.valor_aberto > 0)
    .map((s) => ({ label: s.stage ?? '—', valor: s.valor_aberto }));

  return (
    <>
      <div className="pp-g12">
        <EChartCard className="pp-c-5" titulo="Funil — alcance por etapa" altura={320}
          subtitulo={`${fmtNum(t.total)} negócios no histórico do funil`}
          vazio={!temAlcance}
          opcao={temAlcance ? optFunil(pal, pontosFunil, {
            formato: 'num',
            cores: [pal.primary, pal.cyan, pal.purple, pal.sync, pal.pink],
            destaque: idxGargalo >= 0 ? idxGargalo : undefined,
          }) : null}
          rodape={<><strong>Estimativa.</strong> {nota}</>}
          aria="Funil de alcance por etapa" />

        <div className="pp-card pp-c-7">
          <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span>Etapas de {pl.name ?? '—'}</span>
            <span style={{ fontWeight: 600, color: 'var(--pp-text-dim)', fontSize: 12.5 }}>
              conversão {t.win_rate != null ? `${t.win_rate}%` : '—'} · ciclo {t.ciclo_medio_dias != null ? `${t.ciclo_medio_dias} d` : '—'}
            </span>
          </h3>

          {pl.gargalo && (
            <div className="pp-note" style={{ borderLeftColor: 'var(--pp-danger)', marginBottom: 12 }}>
              <strong>Gargalo:</strong> a maior queda é de <strong>{pl.gargalo.stage}</strong> para{' '}
              <strong>{pl.gargalo.proxima}</strong> — {pl.gargalo.queda_pct}% ({fmtNum(pl.gargalo.perdidos)} negócios)
              não seguiram adiante.
            </div>
          )}

          <div className="pp-etapas">
            <div className="pp-etapa cab">
              <span>Etapa</span>
              <span className="num">Alcance</span>
              <span className="num">Conversão</span>
              <span className="num">Em aberto</span>
            </div>
            {stages.map((s) => {
              const ehGargalo = pl.gargalo?.stage_id === s.stage_id;
              return (
                <div key={s.stage_id} className={`pp-etapa${ehGargalo ? ' is-gargalo' : ''}`}>
                  <span className="nm">
                    <span className="ord" aria-hidden>{s.order}</span>
                    <span title={s.stage ?? ''}>{s.stage ?? '—'}</span>
                    {ehGargalo && <span className="tag"><TriangleAlert size={10} aria-hidden />gargalo</span>}
                  </span>
                  <span className="num">
                    {fmtNum(s.alcance)}
                    {s.alcance_pct != null && <span style={{ color: 'var(--pp-text-dim)' }}> · {s.alcance_pct}%</span>}
                  </span>
                  <span className="num">
                    {s.conversao_prox != null ? (
                      <span style={{ color: ehGargalo ? 'var(--pp-danger)' : undefined }}>{s.conversao_prox}%</span>
                    ) : <span style={{ color: 'var(--pp-text-dim)' }}>última</span>}
                  </span>
                  <span className="num">
                    {fmtNum(s.abertos)}
                    {s.idade_media_abertos != null && s.abertos > 0 && (
                      <span style={{ color: 'var(--pp-text-dim)' }}> · {s.idade_media_abertos} d</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="pp-cc-rodape">
            “Alcance” é estimado (assume avanço em ordem). “Em aberto” e a idade média na etapa são
            leitura direta da base. Conversão é entre alcances de etapas vizinhas.
          </p>
        </div>
      </div>

      <div className="pp-g12">
        <EChartCard className="pp-c-7" titulo="Desfecho por etapa" altura={280}
          subtitulo="Onde cada negócio parou — dado factual, sem estimativa"
          vazio={stages.length === 0}
          opcao={stages.length ? optColunasEmpilhadas(pal, stages.map((s) => s.stage ?? '—'), [
            { nome: 'Em aberto', dados: stages.map((s) => s.abertos), cor: pal.sync },
            { nome: 'Ganhos', dados: stages.map((s) => s.ganhos), cor: pal.ok },
            { nome: 'Perdidos', dados: stages.map((s) => s.perdidos), cor: pal.danger },
          ], { formato: 'num', rotacionar: stages.length > 4 }) : null}
          rodape="A etapa de um negócio fechado é a que ele ocupava no fechamento — por isso há ganhos em etapas iniciais."
          aria="Situação dos negócios em cada etapa" />

        <EChartCard className="pp-c-5" titulo="Valor em aberto por etapa" altura={280}
          subtitulo={`${fmtBRL(t.valor_aberto)} em jogo neste funil`}
          vazio={valores.length === 0}
          vazioMsg="Nenhum negócio em aberto neste funil."
          opcao={valores.length ? optBarras(pal, valores, { formato: 'brl', cor: pal.sync }) : null}
          aria="Valor em aberto por etapa" />
      </div>
    </>
  );
}
