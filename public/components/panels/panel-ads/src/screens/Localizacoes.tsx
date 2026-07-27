// screens/Localizacoes.tsx — desempenho geográfico (§20).
// @version 2.0.0  @modified 2026-07-22 (Fase 2: mapa coroplético D3 + filtro cruzado grid)
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { Location, Period } from '../shell/types';
import { PageHeader, Loading, EmptyState } from '../components/ui';
import { DataGrid, type Column } from '../components/DataGrid';
import { ChartCard } from '../components/viz/ChartCard';
import { EChartCard } from '../components/viz/EChartCard';
import { GeoMapaBrasil, type DadoUF } from '../components/viz/d3/GeoMapaBrasil';
import { optBarras } from '../components/viz/echarts-opts';
import { useTokensAds } from '../shell/useShellTheme';
import { moeda, moeda0, inteiro, pct, decimal, razao } from '../lib/format';

const cols: Column<Location>[] = [
  { key: 'name', header: 'Região', align: 'left', sortValue: (r) => r.name, csv: (r) => r.name,
    render: (r) => <span className="ads-cell-strong">{r.name} <span className="ads-cell-sub">({r.uf})</span></span> },
  { key: 'impressions', header: 'Impressões', sortValue: (r) => r.impressions, csv: (r) => r.impressions, render: (r) => inteiro(r.impressions) },
  { key: 'clicks', header: 'Cliques', sortValue: (r) => r.clicks, csv: (r) => r.clicks, render: (r) => inteiro(r.clicks) },
  { key: 'ctr', header: 'CTR', sortValue: (r) => r.ctr, csv: (r) => r.ctr, render: (r) => pct(r.ctr) },
  { key: 'cost', header: 'Custo', sortValue: (r) => r.cost, csv: (r) => r.cost, render: (r) => <span className="ads-cell-strong">{moeda0(r.cost)}</span> },
  { key: 'conversions', header: 'Conv.', sortValue: (r) => r.conversions, csv: (r) => r.conversions, render: (r) => decimal(r.conversions) },
  { key: 'cpa', header: 'CPA', sortValue: (r) => r.cpa, csv: (r) => r.cpa,
    cellClass: (r) => (r.conversions <= 0 ? 'ads-cell-bad' : (r.cpa > 200 ? 'ads-cell-warn' : '')), render: (r) => (r.cpa > 0 ? moeda(r.cpa) : '—') },
  { key: 'roas', header: 'ROAS', sortValue: (r) => r.roas, csv: (r) => r.roas,
    cellClass: (r) => (r.roas >= 4 ? 'ads-cell-good' : (r.roas > 0 && r.roas < 1.5 ? 'ads-cell-bad' : '')), render: (r) => (r.roas > 0 ? razao(r.roas) : '—') },
];

export function Localizacoes({ accountId }: { accountId: number; period: Period }) {
  const pal = useTokensAds();
  const [ufSel, setUfSel] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery<{ items: Location[] }>({
    queryKey: chaves.locations(accountId),
    queryFn: ({ signal }) => apiGet<{ items: Location[] }>('/locations', { account_id: accountId }, signal),
  });
  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  const semConv = data.items.filter((l) => l.conversions <= 0);
  const dadosMapa: DadoUF[] = data.items.map((l) => ({ uf: l.uf, valor: l.cost, roas: l.roas, conv: l.conversions, nome: l.name }));
  const topUF = [...data.items].sort((a, b) => b.cost - a.cost).slice(0, 8);
  const rows = ufSel ? data.items.filter((l) => l.uf === ufSel) : data.items;

  return (
    <div className="ads-page">
      <PageHeader title="Localizações" subtitle="Desempenho por região. Identifica regiões mais rentáveis e regiões que consomem verba sem converter (§20)." />
      {semConv.length > 0 && <div className="ads-banner">🗺️ {semConv.length} região(ões) com custo e <strong>zero conversões</strong> — candidatas a exclusão ou ajuste de lance por local.</div>}

      <div className="ads-grid2">
        <ChartCard titulo="Mapa de investimento por estado" subtitulo={ufSel ? `filtrando: ${ufSel} (clique de novo para limpar)` : 'clique num estado para filtrar a tabela'} altura={360}>
          <GeoMapaBrasil
            dados={dadosMapa}
            fmt={moeda0}
            selecionado={ufSel}
            onSelecionar={setUfSel}
            altura={340}
            detalhes={[
              ['ROAS', (d) => razao(Number(d.roas))],
              ['Conversões', (d) => decimal(Number(d.conv))],
            ]}
          />
        </ChartCard>
        <EChartCard
          titulo="Top estados por investimento"
          subtitulo="8 maiores"
          altura={360}
          opcao={optBarras(pal, topUF.map((l) => `${l.name} (${l.uf})`), topUF.map((l) => l.cost), moeda0, {
            cores: topUF.map((l) => (l.roas >= 3 ? pal.ok : l.conversions <= 0 ? pal.danger : pal.primary)),
          })}
          aria="Top estados por investimento"
        />
      </div>

      <div className="ads-card" style={{ padding: 0, marginTop: 14 }}>
        <DataGrid
          rows={rows}
          columns={cols}
          rowKey={(r) => r.uf}
          searchText={(r) => `${r.name} ${r.uf}`}
          initialSortKey="cost"
          csvName="localizacoes"
          toolbarExtra={ufSel ? (
            <button type="button" onClick={() => setUfSel(null)}
              style={{ border: `1px solid ${pal.primary}`, background: 'transparent', color: pal.primary, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
              Filtro: {ufSel} ✕
            </button>
          ) : undefined}
        />
      </div>
    </div>
  );
}
