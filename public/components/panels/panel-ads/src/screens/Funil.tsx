// screens/Funil.tsx — funil comercial ponta a ponta (§16.3 / §18).
// @version 2.0.0  @modified 2026-07-22 (Fase 2: funil ECharts)
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { FunnelFull, Period } from '../shell/types';
import { PageHeader, Loading, EmptyState } from '../components/ui';
import { EChartCard } from '../components/viz/EChartCard';
import { optFunil } from '../components/viz/echarts-opts';
import { useTokensAds } from '../shell/useShellTheme';
import { formatarValor, inteiro } from '../lib/format';

export function Funil({ accountId }: { accountId: number; period: Period }) {
  const pal = useTokensAds();
  const { data, isLoading, isError } = useQuery<FunnelFull>({
    queryKey: chaves.funnel(accountId),
    queryFn: ({ signal }) => apiGet<FunnelFull>('/funnel', { account_id: accountId }, signal),
  });
  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  // Etapas de contagem (int) para o funil; a receita (currency) vira destaque à parte.
  const intSteps = data.steps.filter((s) => s.unit === 'int');
  const receita = data.steps.find((s) => s.unit === 'currency');
  const passos = intSteps.map((s) => ({ label: s.label, value: s.value }));
  // taxa de conversão consolidada topo → base do funil de contagem
  const taxaFim = passos.length > 1 && passos[0].value > 0 ? (passos[passos.length - 1].value / passos[0].value) * 100 : 0;

  return (
    <div className="ads-page">
      <PageHeader title="Funil Comercial" subtitle="Continuidade da jornada — do clique à venda. Mostra onde o funil perde volume e liga mídia a resultado comercial (§16.3/§18)." />

      {(receita || taxaFim > 0) && (
        <div className="ads-kpi-grid" style={{ marginBottom: 14 }}>
          {passos[0] && <div className="ads-kpi"><div className="ads-kpi-lbl">{passos[0].label}</div><div className="ads-kpi-val">{inteiro(passos[0].value)}</div></div>}
          {passos[passos.length - 1] && <div className="ads-kpi"><div className="ads-kpi-lbl">{passos[passos.length - 1].label}</div><div className="ads-kpi-val">{inteiro(passos[passos.length - 1].value)}</div></div>}
          <div className="ads-kpi"><div className="ads-kpi-lbl">Conversão ponta a ponta</div><div className="ads-kpi-val">{taxaFim.toFixed(2)}%</div></div>
          {receita && <div className="ads-kpi"><div className="ads-kpi-lbl">{receita.label}</div><div className="ads-kpi-val">{formatarValor(receita.value, receita.unit, true)}</div></div>}
        </div>
      )}

      <EChartCard
        titulo="Funil ponta a ponta"
        subtitulo="cada etapa mostra o volume e onde há perda"
        altura={380}
        opcao={optFunil(pal, passos, inteiro)}
        aria="Funil comercial ponta a ponta"
      />

      <div className="ads-banner" style={{ marginTop: 14 }}>🔗 <strong>Correspondência:</strong> {data.note}</div>
    </div>
  );
}
