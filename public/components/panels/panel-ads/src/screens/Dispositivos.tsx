// screens/Dispositivos.tsx — desempenho por dispositivo (§19).
// @version 2.0.0  @modified 2026-07-22 (Fase 2: ECharts — donut/colunas)
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { Device, Period } from '../shell/types';
import { PageHeader, Loading, EmptyState } from '../components/ui';
import { DataGrid, type Column } from '../components/DataGrid';
import { EChartCard } from '../components/viz/EChartCard';
import { optDonut, optColunas } from '../components/viz/echarts-opts';
import { useTokensAds } from '../shell/useShellTheme';
import { moeda, moeda0, inteiro, pct, decimal, razao } from '../lib/format';

const ICON: Record<string, string> = { MOBILE: '📱', DESKTOP: '💻', TABLET: '📲' };

const cols: Column<Device>[] = [
  { key: 'label', header: 'Dispositivo', align: 'left', sortValue: (r) => r.label, csv: (r) => r.label,
    render: (r) => <span className="ads-cell-strong">{ICON[r.device]} {r.label}</span> },
  { key: 'impressions', header: 'Impressões', sortValue: (r) => r.impressions, csv: (r) => r.impressions, render: (r) => inteiro(r.impressions) },
  { key: 'clicks', header: 'Cliques', sortValue: (r) => r.clicks, csv: (r) => r.clicks, render: (r) => inteiro(r.clicks) },
  { key: 'ctr', header: 'CTR', sortValue: (r) => r.ctr, csv: (r) => r.ctr, render: (r) => pct(r.ctr) },
  { key: 'cost', header: 'Custo', sortValue: (r) => r.cost, csv: (r) => r.cost, render: (r) => <span className="ads-cell-strong">{moeda0(r.cost)}</span> },
  { key: 'conversions', header: 'Conv.', sortValue: (r) => r.conversions, csv: (r) => r.conversions, render: (r) => decimal(r.conversions) },
  { key: 'conv_rate', header: 'Tx conv.', sortValue: (r) => r.conv_rate, csv: (r) => r.conv_rate, render: (r) => pct(r.conv_rate) },
  { key: 'cpa', header: 'CPA', sortValue: (r) => r.cpa, csv: (r) => r.cpa, cellClass: (r) => (r.cpa > 130 ? 'ads-cell-bad' : ''), render: (r) => moeda(r.cpa) },
  { key: 'roas', header: 'ROAS', sortValue: (r) => r.roas, csv: (r) => r.roas,
    cellClass: (r) => (r.roas >= 4 ? 'ads-cell-good' : (r.roas < 2 ? 'ads-cell-bad' : '')), render: (r) => razao(r.roas) },
];

export function Dispositivos({ accountId }: { accountId: number; period: Period }) {
  const pal = useTokensAds();
  const { data, isLoading, isError } = useQuery<{ items: Device[] }>({
    queryKey: chaves.devices(accountId),
    queryFn: ({ signal }) => apiGet<{ items: Device[] }>('/devices', { account_id: accountId }, signal),
  });
  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  const best = [...data.items].sort((a, b) => b.roas - a.roas)[0];
  const worst = [...data.items].sort((a, b) => a.roas - b.roas)[0];

  return (
    <div className="ads-page">
      <PageHeader title="Dispositivos" subtitle="Desempenho por dispositivo. Aponta o mais eficiente e onde há desperdício ou problema de experiência mobile (§19)." />
      {best && worst && best.device !== worst.device && (
        <div className="ads-banner">📱 <strong>{worst.label}</strong> converte pior (ROAS {razao(worst.roas)}, CPA {moeda(worst.cpa)}) que <strong>{best.label}</strong> (ROAS {razao(best.roas)}). Considere ajuste de lance por dispositivo.</div>
      )}
      <div className="ads-kpi-grid">
        {data.items.map((d) => (
          <div key={d.device} className="ads-kpi">
            <div className="ads-kpi-lbl">{ICON[d.device]} {d.label}</div>
            <div className="ads-kpi-val">{razao(d.roas)}</div>
            <div className="ads-cell-sub" style={{ marginTop: 6 }}>{moeda0(d.cost)} · {decimal(d.conversions)} conv · CPA {moeda(d.cpa)}</div>
          </div>
        ))}
      </div>

      <div className="ads-grid2b">
        <EChartCard
          titulo="Investimento por dispositivo"
          subtitulo="participação no custo"
          altura={240}
          opcao={optDonut(pal, data.items.map((d) => ({ name: d.label, value: d.cost })), moeda0, { titulo: 'Investido' })}
          vazio={!data.items.some((d) => d.cost > 0)}
          aria="Distribuição do investimento por dispositivo"
        />
        <EChartCard
          titulo="ROAS por dispositivo"
          subtitulo="retorno sobre o investimento"
          altura={240}
          opcao={optColunas(pal, data.items.map((d) => d.label), data.items.map((d) => d.roas), razao)}
          vazio={!data.items.length}
          aria="ROAS por dispositivo"
        />
      </div>

      <DataGrid rows={data.items} columns={cols} rowKey={(r) => r.device} initialSortKey="cost" csvName="dispositivos" />
    </div>
  );
}
