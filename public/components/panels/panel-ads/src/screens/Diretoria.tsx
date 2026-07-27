// screens/Diretoria.tsx — visão executiva: investimento → lead → venda (§10).
// @version 2.0.0  @modified 2026-07-22 (Fase 2: funil ECharts + barras + sankey D3)
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { BoardData, Period } from '../shell/types';
import { PageHeader, Loading, EmptyState, channelLabel } from '../components/ui';
import { EChartCard } from '../components/viz/EChartCard';
import { ChartCard } from '../components/viz/ChartCard';
import { optFunil, optBarras } from '../components/viz/echarts-opts';
import { SankeyFluxo, type NoFluxo, type LigacaoFluxo } from '../components/viz/d3/SankeyFluxo';
import { useTokensAds } from '../shell/useShellTheme';
import { formatarValor, inteiro, decimal } from '../lib/format';

export function Diretoria({ accountId, period }: { accountId: number; period: Period }) {
  const pal = useTokensAds();
  const { data, isLoading, isError } = useQuery<BoardData>({
    queryKey: chaves.board(accountId, period),
    queryFn: ({ signal }) => apiGet<BoardData>('/board', { account_id: accountId, period }, signal),
  });

  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  // Funil só com etapas de contagem (int) para larguras comparáveis.
  const passos = data.funnel.filter((f) => f.unit === 'int').map((f) => ({ label: f.label, value: f.value }));

  // Sankey: contribuição de cada canal para o total de conversões.
  const nosFluxo: NoFluxo[] = [
    ...data.by_channel.map((c, i) => ({ id: c.channel, nome: channelLabel(c.channel), cor: pal.seq[i % pal.seq.length] })),
    { id: '__conv', nome: 'Conversões', cor: pal.ok },
  ];
  const ligacoes: LigacaoFluxo[] = data.by_channel.map((c) => ({ origem: c.channel, destino: '__conv', valor: c.conversions }));

  return (
    <div className="ads-page">
      <PageHeader title="Diretoria"
        subtitle="Relação entre investimento e resultado comercial. Responde: quanto investimos, quantos leads/vendas geramos e qual o retorno." />

      <div className="ads-kpi-grid">
        {data.kpis.map((k) => (
          <div key={k.key} className="ads-kpi">
            <div className="ads-kpi-lbl">{k.label}</div>
            <div className="ads-kpi-val">{formatarValor(k.value, k.unit, true)}</div>
          </div>
        ))}
      </div>

      <div className="ads-grid2b">
        <EChartCard
          titulo="Funil comercial"
          subtitulo="do clique à venda"
          altura={280}
          opcao={optFunil(pal, passos, inteiro)}
          aria="Funil comercial"
        />
        <EChartCard
          titulo="Retorno por canal"
          subtitulo="investimento e ROAS"
          altura={280}
          opcao={optBarras(pal, data.by_channel.map((c) => channelLabel(c.channel)), data.by_channel.map((c) => c.cost),
            (v) => formatarValor(v, 'currency', true), {
              cores: data.by_channel.map((c) => (c.roas >= 3 ? pal.ok : c.roas >= 1.5 ? pal.primary : pal.danger)),
            })}
          aria="Retorno por canal"
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <ChartCard titulo="Fluxo de conversões por canal" subtitulo="largura ∝ conversões atribuídas" altura={300}>
          <SankeyFluxo nos={nosFluxo} ligacoes={ligacoes} fmt={(v) => `${decimal(v)} conv`} altura={280} />
        </ChartCard>
      </div>

      <div className="ads-banner" style={{ marginTop: 14 }}>📌 <strong>Atribuição:</strong> {data.note}</div>
    </div>
  );
}
