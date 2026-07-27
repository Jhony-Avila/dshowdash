// screens/Campanhas.tsx — DataGrid de campanhas (§11).
// @version 2.0.0  @modified 2026-07-22 (Fase 2: gráficos ECharts + filtro cruzado por canal)
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { Campaign, HealthClass, Period, DrillFiltro } from '../shell/types';
import { PageHeader, Loading, EmptyState, HealthBadge, StatusBadge, Meter, channelLabel } from '../components/ui';
import { DataGrid, type Column } from '../components/DataGrid';
import { EChartCard } from '../components/viz/EChartCard';
import { optBarras, optDonut } from '../components/viz/echarts-opts';
import { useTokensAds } from '../shell/useShellTheme';
import { moeda, moeda0, inteiro, pct, decimal, razao } from '../lib/format';

const cols: Column<Campaign>[] = [
  { key: 'status', header: 'Status', align: 'left', sortValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
  { key: 'name', header: 'Campanha', align: 'left', sortValue: (r) => r.name, csv: (r) => r.name,
    render: (r) => <span className="ads-cell-strong ads-cell-name" title={r.name}>{r.name}</span> },
  { key: 'channel', header: 'Tipo', align: 'left', sortValue: (r) => r.channel, csv: (r) => channelLabel(r.channel), render: (r) => channelLabel(r.channel) },
  { key: 'health', header: 'Saúde', align: 'left', sortValue: (r) => r.health_class, render: (r) => <HealthBadge health={r.health_class} /> },
  { key: 'budget', header: 'Orçam./dia', sortValue: (r) => r.budget, csv: (r) => r.budget, render: (r) => moeda0(r.budget) },
  { key: 'impressions', header: 'Impressões', sortValue: (r) => r.impressions, csv: (r) => r.impressions, render: (r) => inteiro(r.impressions) },
  { key: 'clicks', header: 'Cliques', sortValue: (r) => r.clicks, csv: (r) => r.clicks, render: (r) => inteiro(r.clicks) },
  { key: 'ctr', header: 'CTR', sortValue: (r) => r.ctr, csv: (r) => r.ctr, render: (r) => pct(r.ctr) },
  { key: 'avg_cpc', header: 'CPC', sortValue: (r) => r.avg_cpc, csv: (r) => r.avg_cpc, render: (r) => moeda(r.avg_cpc) },
  { key: 'cost', header: 'Custo', sortValue: (r) => r.cost, csv: (r) => r.cost, render: (r) => <span className="ads-cell-strong">{moeda0(r.cost)}</span> },
  { key: 'conversions', header: 'Conv.', sortValue: (r) => r.conversions, csv: (r) => r.conversions, render: (r) => decimal(r.conversions) },
  { key: 'conv_rate', header: 'Tx conv.', sortValue: (r) => r.conv_rate, csv: (r) => r.conv_rate, render: (r) => pct(r.conv_rate) },
  { key: 'cpa', header: 'CPA', sortValue: (r) => r.cpa, csv: (r) => r.cpa,
    cellClass: (r) => (r.cpa > 200 ? 'ads-cell-bad' : ''), render: (r) => (r.cpa > 0 ? moeda(r.cpa) : '—') },
  { key: 'roas', header: 'ROAS', sortValue: (r) => r.roas, csv: (r) => r.roas,
    cellClass: (r) => (r.roas >= 3 ? 'ads-cell-good' : (r.roas > 0 && r.roas < 1.5 ? 'ads-cell-bad' : '')),
    render: (r) => (r.roas > 0 ? razao(r.roas) : '—') },
  { key: 'opt', header: 'Otimização', sortValue: (r) => r.optimization_score, csv: (r) => r.optimization_score,
    render: (r) => <Meter value={Math.round(r.optimization_score * 100)} max={100} /> },
  { key: 'imp_share', header: 'Parc. impr.', sortValue: (r) => r.search_impression_share, csv: (r) => r.search_impression_share, render: (r) => pct(r.search_impression_share) },
];

const CORES_SAUDE: Partial<Record<HealthClass, 'ok' | 'warn' | 'danger' | 'primary'>> = {
  excellent: 'ok', healthy: 'ok', scale_opportunity: 'ok',
  attention: 'warn', budget_limited: 'warn',
  critical: 'danger', wasting: 'danger',
};

export function Campanhas({ accountId, onIr }: { accountId: number; period: Period; onIr?: (id: string, filtro?: DrillFiltro) => void }) {
  const pal = useTokensAds();
  const [canal, setCanal] = useState<string | null>(null);

  // coluna de drill-down: abre Grupos/Anúncios já filtrados pela campanha
  const drillBtn = (rotulo: string, area: string, nome: string) => (
    <button type="button" onClick={() => onIr?.(area, { tipo: 'campanha', valor: nome })}
      style={{ border: `1px solid ${pal.border}`, background: 'transparent', color: pal.primary, borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>{rotulo}</button>
  );
  const colunas: Column<Campaign>[] = onIr
    ? [...cols, { key: 'drill', header: 'Detalhar', align: 'left', render: (r) => (<span style={{ display: 'flex', gap: 6 }}>{drillBtn('Grupos', 'grupos', r.name)}{drillBtn('Anúncios', 'anuncios', r.name)}</span>) }]
    : cols;
  const { data, isLoading, isError } = useQuery<{ items: Campaign[] }>({
    queryKey: chaves.campaigns(accountId),
    queryFn: ({ signal }) => apiGet<{ items: Campaign[] }>('/campaigns', { account_id: accountId }, signal),
  });

  // agregação por canal (label ↔ chave) para o donut e o filtro cruzado
  const porCanal = useMemo(() => {
    const m = new Map<string, { label: string; cost: number }>();
    for (const c of data?.items ?? []) {
      const cur = m.get(c.channel) ?? { label: channelLabel(c.channel), cost: 0 };
      cur.cost += c.cost; m.set(c.channel, cur);
    }
    return m;
  }, [data]);

  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  const rows = canal ? data.items.filter((c) => c.channel === canal) : data.items;
  const top = [...data.items].sort((a, b) => b.cost - a.cost).slice(0, 10);
  const corMap: Record<string, string> = { ok: pal.ok, warn: pal.warn, danger: pal.danger, primary: pal.primary };
  const labelParaCanal = new Map([...porCanal.entries()].map(([ch, v]) => [v.label, ch]));

  return (
    <div className="ads-page">
      <PageHeader title="Campanhas" subtitle="Todas as campanhas da conta com métricas, saúde e índice de otimização. Ordene por qualquer coluna, clique num canal para filtrar ou exporte para CSV." />

      <div className="ads-grid2">
        <EChartCard
          titulo="Top campanhas por investimento"
          subtitulo={onIr ? 'cor = saúde · clique numa barra para ver os grupos' : 'cor = saúde'}
          altura={280}
          opcao={optBarras(pal, top.map((c) => c.name), top.map((c) => c.cost), moeda0, {
            cores: top.map((c) => corMap[CORES_SAUDE[c.health_class] ?? 'primary']),
          })}
          eventos={onIr ? {
            click: (params) => {
              const nome = (params as { name?: string }).name;
              if (nome) onIr('grupos', { tipo: 'campanha', valor: nome });
            },
          } : undefined}
          aria="Top campanhas por investimento"
        />
        <EChartCard
          titulo="Investimento por canal"
          subtitulo={canal ? `filtrando: ${channelLabel(canal)} — clique para limpar` : 'clique numa fatia para filtrar a tabela'}
          altura={280}
          opcao={optDonut(pal, [...porCanal.values()].map((v) => ({ name: v.label, value: v.cost })), moeda0, { titulo: 'Investido' })}
          eventos={{
            click: (params) => {
              const nome = (params as { name?: string }).name;
              const ch = nome ? labelParaCanal.get(nome) ?? null : null;
              setCanal((atual) => (atual === ch ? null : ch));
            },
          }}
          aria="Investimento por canal"
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <DataGrid rows={rows} columns={colunas} rowKey={(r) => r.campaign_id}
          searchText={(r) => `${r.name} ${channelLabel(r.channel)} ${r.status}`}
          initialSortKey="cost" csvName="campanhas"
          toolbarExtra={canal ? (
            <button type="button" onClick={() => setCanal(null)}
              style={{ border: `1px solid ${pal.primary}`, background: 'transparent', color: pal.primary, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
              Canal: {channelLabel(canal)} ✕
            </button>
          ) : undefined} />
      </div>
    </div>
  );
}
