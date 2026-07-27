// screens/Horarios.tsx — desempenho por horário e dia (§21).
// @version 3.0.0  @modified 2026-07-24 (Fase 2: relógio polar D3 por hora do dia)
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { HoursData, Period } from '../shell/types';
import { PageHeader, Loading, EmptyState } from '../components/ui';
import { EChartCard } from '../components/viz/EChartCard';
import { ChartCard } from '../components/viz/ChartCard';
import { optHeatmap } from '../components/viz/echarts-opts';
import { RelogioPolar } from '../components/viz/d3/RelogioPolar';
import { useTokensAds } from '../shell/useShellTheme';
import { moeda } from '../lib/format';

const DOW_FULL: Record<number, string> = { 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 7: 'Domingo' };

export function Horarios({ accountId }: { accountId: number; period: Period }) {
  const pal = useTokensAds();
  const { data, isLoading, isError } = useQuery<HoursData>({
    queryKey: chaves.hours(accountId),
    queryFn: ({ signal }) => apiGet<HoursData>('/hours', { account_id: accountId }, signal),
  });
  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  const horas = Array.from({ length: 24 }, (_, h) => String(h));
  const celulas: [number, number, number][] = data.matrix.flatMap((row, ri) => row.cells.map((c) => [c.hour, ri, c.cost] as [number, number, number]));
  // tooltip do heatmap usa dias[iy] e horas[ix]; passamos os nomes completos dos dias
  const diasFull = data.matrix.map((r) => DOW_FULL[r.dow]);
  const pontosHora = data.by_hour.map((h) => ({ hora: h.hour, valor: h.cost }));

  return (
    <div className="ads-page">
      <PageHeader title="Horários e dias" subtitle="Matriz dia × hora com custo e conversões. Revela melhores e piores faixas para programação de anúncios (§21)." />

      {data.best && data.worst && (
        <div className="ads-banner">🕐 Melhor faixa: <strong>{DOW_FULL[data.best.dow]} {String(data.best.hour).padStart(2, '0')}h</strong> (CPA {moeda(data.best.cpa)}) · Pior faixa: <strong>{DOW_FULL[data.worst.dow]} {String(data.worst.hour).padStart(2, '0')}h</strong> (CPA {moeda(data.worst.cpa)}).</div>
      )}

      <div className="ads-grid2" style={{ marginBottom: 14 }}>
        <EChartCard
          titulo="Custo por dia × hora"
          subtitulo="intensidade = custo investido"
          altura={300}
          opcao={optHeatmap(pal, horas, diasFull, celulas, moeda)}
          aria="Mapa de calor de custo por dia e hora"
        />
        <ChartCard titulo="Ritmo por hora do dia" subtitulo="cunha ∝ custo · 0h no topo, sentido horário" altura={300}>
          <RelogioPolar dados={pontosHora} fmt={(v) => moeda(v, true)} altura={300} />
        </ChartCard>
      </div>
    </div>
  );
}
