// screens/Publicos.tsx — desempenho de públicos (§22).
// @version 2.0.0  @modified 2026-07-22 (Fase 2: ECharts — investimento/ROAS por público + estágios)
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { Audience, Period } from '../shell/types';
import { PageHeader, Loading, EmptyState } from '../components/ui';
import { DataGrid, type Column } from '../components/DataGrid';
import { EChartCard } from '../components/viz/EChartCard';
import { ChartCard } from '../components/viz/ChartCard';
import { optBarras, optColunas, optDonut, optFunil } from '../components/viz/echarts-opts';
import { ChordDiagram } from '../components/viz/d3/ChordDiagram';
import { useTokensAds } from '../shell/useShellTheme';
import { moeda, moeda0, inteiro, pct, decimal, razao, compacto } from '../lib/format';

const STAGE_PILL: Record<string, string> = { Remarketing: 'ads-pill-purple', Clientes: 'ads-pill-ok', Prospecção: 'ads-pill-primary' };

const cols: Column<Audience>[] = [
  { key: 'name', header: 'Público', align: 'left', sortValue: (r) => r.name, csv: (r) => r.name,
    render: (r) => <span className="ads-cell-strong ads-cell-name" title={r.name}>{r.name}</span> },
  { key: 'stage', header: 'Estágio', align: 'left', sortValue: (r) => r.stage,
    render: (r) => <span className={`ads-pill ${STAGE_PILL[r.stage] ?? 'ads-pill-dim'}`}>{r.stage}</span> },
  { key: 'size', header: 'Tamanho', sortValue: (r) => r.size, csv: (r) => r.size, render: (r) => compacto(r.size) },
  { key: 'impressions', header: 'Impressões', sortValue: (r) => r.impressions, csv: (r) => r.impressions, render: (r) => inteiro(r.impressions) },
  { key: 'clicks', header: 'Cliques', sortValue: (r) => r.clicks, csv: (r) => r.clicks, render: (r) => inteiro(r.clicks) },
  { key: 'ctr', header: 'CTR', sortValue: (r) => r.ctr, csv: (r) => r.ctr, render: (r) => pct(r.ctr) },
  { key: 'cost', header: 'Custo', sortValue: (r) => r.cost, csv: (r) => r.cost, render: (r) => <span className="ads-cell-strong">{moeda0(r.cost)}</span> },
  { key: 'conversions', header: 'Conv.', sortValue: (r) => r.conversions, csv: (r) => r.conversions, render: (r) => decimal(r.conversions) },
  { key: 'cpa', header: 'CPA', sortValue: (r) => r.cpa, csv: (r) => r.cpa, render: (r) => (r.cpa > 0 ? moeda(r.cpa) : '—') },
  { key: 'roas', header: 'ROAS', sortValue: (r) => r.roas, csv: (r) => r.roas,
    cellClass: (r) => (r.roas >= 4 ? 'ads-cell-good' : (r.roas > 0 && r.roas < 1.5 ? 'ads-cell-bad' : '')), render: (r) => razao(r.roas) },
];

// Ordem canônica dos estágios (topo → fundo do funil).
const ESTAGIOS = ['Prospecção', 'Remarketing', 'Clientes'];

export function Publicos({ accountId }: { accountId: number; period: Period }) {
  const pal = useTokensAds();
  const { data, isLoading, isError } = useQuery<{ items: Audience[]; overlap?: { labels: string[]; matrix: number[][] } }>({
    queryKey: chaves.audiences(accountId),
    queryFn: ({ signal }) => apiGet<{ items: Audience[]; overlap?: { labels: string[]; matrix: number[][] } }>('/audiences', { account_id: accountId }, signal),
  });
  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  const audiences = data.items;
  // Top por custo (desc), no máximo 10 — base dos dois gráficos por público.
  const top = [...audiences].sort((a, b) => b.cost - a.cost).slice(0, 10);

  // Agregações por estágio do funil.
  const custoPorEstagio = ESTAGIOS
    .map((st) => ({ name: st, value: audiences.filter((a) => a.stage === st).reduce((s, a) => s + a.cost, 0) }))
    .filter((e) => e.value > 0);
  const convPorEstagio = ESTAGIOS
    .map((st) => ({ label: st, value: audiences.filter((a) => a.stage === st).reduce((s, a) => s + a.conversions, 0) }))
    .filter((e) => e.value > 0);

  return (
    <div className="ads-page">
      <PageHeader title="Públicos" subtitle="Prospecção, remarketing e clientes com desempenho e estágio do funil. Remarketing costuma ter o melhor ROAS (§22)." />

      <div className="ads-grid2">
        <EChartCard
          titulo="Investimento por público"
          subtitulo="custo total no período"
          altura={240}
          opcao={optBarras(pal, top.map((a) => a.name), top.map((a) => a.cost), moeda0, { horizontal: true })}
          aria="Investimento por público"
          vazio={!top.length}
        />
        <EChartCard
          titulo="ROAS por público"
          subtitulo="retorno sobre o investimento"
          altura={240}
          opcao={optColunas(pal, top.map((a) => a.name), top.map((a) => a.roas), razao)}
          aria="ROAS por público"
          vazio={!top.length}
        />
      </div>

      <div className="ads-grid2">
        <EChartCard
          titulo="Investimento por estágio"
          subtitulo="prospecção · remarketing · clientes"
          altura={240}
          opcao={optDonut(pal, custoPorEstagio, moeda0, { titulo: 'Investimento' })}
          aria="Investimento por estágio do funil"
          vazio={!custoPorEstagio.length}
        />
        <EChartCard
          titulo="Conversões por estágio"
          subtitulo="volume de conversões por etapa"
          altura={240}
          opcao={optFunil(pal, convPorEstagio, decimal)}
          aria="Conversões por estágio do funil"
          vazio={!convPorEstagio.length}
        />
      </div>

      {data.overlap && data.overlap.labels.length > 2 && (
        <div style={{ marginBottom: 14 }}>
          <ChartCard titulo="Sobreposição de públicos" subtitulo="usuários compartilhados entre segmentos · passe o mouse nas cordas" altura={360}>
            <ChordDiagram labels={data.overlap.labels} matrix={data.overlap.matrix} fmt={compacto} altura={360} />
          </ChartCard>
        </div>
      )}

      <DataGrid rows={audiences} columns={cols} rowKey={(r) => r.name} searchText={(r) => `${r.name} ${r.stage} ${r.type}`} initialSortKey="cost" csvName="publicos" />
    </div>
  );
}
