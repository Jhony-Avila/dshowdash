// screens/VisaoGeral.tsx — dashboard executivo (§7 Big Numbers + §9 gráficos).
// @version 2.1.0  @modified 2026-07-22 (Fase 2: comparação entre períodos)
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { DashboardData, Period } from '../shell/types';
import { PageHeader, Loading, BigNumberCard, HealthBadge, EmptyState, channelLabel } from '../components/ui';
import { EChartCard } from '../components/viz/EChartCard';
import { ChartCard } from '../components/viz/ChartCard';
import { optArea, optDonut, optCombinado, optComparaPeriodos } from '../components/viz/echarts-opts';
import { Streamgraph, type SerieStream } from '../components/viz/d3/Streamgraph';
import { CalendarHeatmap } from '../components/viz/d3/CalendarHeatmap';
import { useTokensAds } from '../shell/useShellTheme';
import { moeda, moeda0, inteiro, decimal, razao, dataCurta } from '../lib/format';

export function VisaoGeral({ accountId, period }: { accountId: number; period: Period }) {
  const pal = useTokensAds();
  const [comparar, setComparar] = useState(false);
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: chaves.dashboard(accountId, period),
    queryFn: ({ signal }) => apiGet<DashboardData>('/dashboard', { account_id: accountId, period }, signal),
  });

  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" desc="Falha ao obter os dados do dashboard." /></div>;

  const labels = data.series.dates.map(dataCurta);
  const temPrev = !!data.series_prev;
  const canaisStream: SerieStream[] = (data.series_by_channel?.channels ?? []).map((c, i) => ({
    rotulo: channelLabel(c.channel), valores: c.values, cor: pal.seq[i % pal.seq.length],
  }));
  const labelsCanal = data.series_by_channel?.dates.map(dataCurta) ?? [];
  const diasConv = data.series.dates.map((d, i) => ({ data: d, valor: data.series.conversions[i] ?? 0 }));
  const opcaoEvolucao = comparar && data.series_prev
    ? optComparaPeriodos(pal, labels, data.series.cost, data.series_prev.cost, (v) => moeda(v, true), { nomeAtual: 'Período atual', nomeAnterior: 'Período anterior' })
    : optArea(pal, labels, [{ name: 'Custo', data: data.series.cost, cor: pal.primary }], (v) => moeda(v, true), { zoom: true });

  return (
    <div className="ads-page">
      <PageHeader title="Visão Geral"
        subtitle="Desempenho consolidado da conta no período. A interpretação de cada indicador respeita seu significado (queda de CPA é positiva; queda de ROAS é negativa)." />

      <div className="ads-bignum-grid">
        {data.big.map((b) => <BigNumberCard key={b.key} b={b} />)}
      </div>

      <div className="ads-grid2">
        <EChartCard
          titulo="Evolução do investimento"
          subtitulo={comparar ? 'período atual vs anterior' : `${labels[0]} — ${labels[labels.length - 1]}`}
          altura={240}
          acoes={temPrev ? (
            <button type="button" onClick={() => setComparar((v) => !v)}
              style={{ border: `1px solid ${comparar ? pal.primary : pal.border}`, background: comparar ? pal.primary : 'transparent', color: comparar ? '#fff' : pal.textDim, borderRadius: 7, padding: '3px 9px', cursor: 'pointer', fontSize: 11.5, fontWeight: 600 }}>
              Comparar período
            </button>
          ) : undefined}
          opcao={opcaoEvolucao}
          aria="Evolução do investimento no período"
        />
        <EChartCard
          titulo="Distribuição do investimento"
          subtitulo="por campanha"
          altura={240}
          opcao={optDonut(pal, data.distribution.map((d) => ({ name: d.name, value: d.value })), moeda0, { titulo: 'Total' })}
          aria="Distribuição do investimento por campanha"
        />
      </div>

      <div className="ads-grid2b">
        <EChartCard
          titulo="Cliques e conversões por dia"
          altura={240}
          opcao={optCombinado(pal, labels,
            { name: 'Cliques', data: data.series.clicks, cor: pal.cyan },
            { name: 'Conversões', data: data.series.conversions, cor: pal.ok },
            inteiro, (v) => decimal(v, 0))}
          aria="Cliques e conversões por dia"
        />
        <div className="ads-card">
          <div className="ads-card-tit">Melhores e piores campanhas <small>por ROAS</small></div>
          <div style={{ marginBottom: 14 }}>
            <div className="ads-cell-sub" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.3px' }}>Melhores</div>
            <ul className="ads-minilist">
              {data.top_campaigns.map((c) => (
                <li key={c.name} className="ads-mini">
                  <div className="ads-mini-body">
                    <div className="ads-mini-nome">{c.name}</div>
                    <div className="ads-mini-sub">{moeda0(c.cost)} · {decimal(c.conversions)} conv · CPA {moeda(c.cpa)}</div>
                  </div>
                  <HealthBadge health={c.health_class} />
                  <span className="ads-mini-roas ads-cell-good">{razao(c.roas)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="ads-cell-sub" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.3px' }}>Piores</div>
            <ul className="ads-minilist">
              {data.bottom_campaigns.map((c) => (
                <li key={c.name} className="ads-mini">
                  <div className="ads-mini-body">
                    <div className="ads-mini-nome">{c.name}</div>
                    <div className="ads-mini-sub">{moeda0(c.cost)} · {decimal(c.conversions)} conv · CPA {moeda(c.cpa)}</div>
                  </div>
                  <HealthBadge health={c.health_class} />
                  <span className="ads-mini-roas ads-cell-bad">{razao(c.roas)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {canaisStream.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <ChartCard titulo="Composição do investimento por canal" subtitulo="fluxo diário empilhado (streamgraph) · passe o mouse para ver os valores do dia" altura={260}>
            <Streamgraph series={canaisStream} labelsX={labelsCanal} fmt={(v) => moeda(v, true)} altura={260} />
          </ChartCard>
        </div>
      )}

      {diasConv.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <ChartCard titulo="Calendário de conversões" subtitulo="conversões por dia · intensidade = volume" altura={200}>
            <CalendarHeatmap dias={diasConv} fmt={(v) => `${decimal(v)} conv`} altura={200} />
          </ChartCard>
        </div>
      )}

      <p className="ads-note">Os dados do período atual ainda podem sofrer atualização (conversões do Google retroagem alguns dias).</p>
    </div>
  );
}
