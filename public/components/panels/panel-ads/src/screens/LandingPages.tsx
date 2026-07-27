// screens/LandingPages.tsx — páginas de destino (§16).
// @version 2.0.0  @modified 2026-07-22 (Fase 2: ECharts — velocidade + taxa de conversão por página)
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { LandingPage, Period } from '../shell/types';
import { PageHeader, Loading, EmptyState, Meter } from '../components/ui';
import { DataGrid, type Column } from '../components/DataGrid';
import { EChartCard } from '../components/viz/EChartCard';
import { optBarras, optColunas } from '../components/viz/echarts-opts';
import { useTokensAds } from '../shell/useShellTheme';
import { moeda, moeda0, inteiro, pct, decimal } from '../lib/format';

/** Encurta uma URL para rótulo de gráfico: usa o pathname e corta em ~18 caracteres. */
function encurtarUrl(url: string): string {
  let path = url;
  try { path = new URL(url, 'https://x').pathname; } catch { /* mantém o valor original */ }
  return path.length > 18 ? path.slice(0, 17) + '…' : path;
}

const cols: Column<LandingPage>[] = [
  { key: 'url', header: 'Página', align: 'left', sortValue: (r) => r.url, csv: (r) => r.url,
    render: (r) => <span className="ads-cell-strong">{r.url}</span> },
  { key: 'match', header: 'Correspond.', align: 'left', sortValue: (r) => (r.match_intent ? 1 : 0),
    render: (r) => r.match_intent ? <span className="ads-pill ads-pill-ok">Coerente</span> : <span className="ads-pill ads-pill-warn">Revisar</span> },
  { key: 'sessions', header: 'Sessões', sortValue: (r) => r.sessions, csv: (r) => r.sessions, render: (r) => inteiro(r.sessions) },
  { key: 'conversions', header: 'Conv.', sortValue: (r) => r.conversions, csv: (r) => r.conversions, render: (r) => decimal(r.conversions) },
  { key: 'conv_rate', header: 'Tx conv.', sortValue: (r) => r.conv_rate, csv: (r) => r.conv_rate,
    cellClass: (r) => (r.conv_rate >= 0.05 ? 'ads-cell-good' : (r.conv_rate < 0.02 ? 'ads-cell-bad' : '')), render: (r) => pct(r.conv_rate) },
  { key: 'cost', header: 'Custo', sortValue: (r) => r.cost, csv: (r) => r.cost, render: (r) => <span className="ads-cell-strong">{moeda0(r.cost)}</span> },
  { key: 'cpa', header: 'CPA', sortValue: (r) => r.cpa, csv: (r) => r.cpa, render: (r) => (r.cpa > 0 ? moeda(r.cpa) : '—') },
  { key: 'speed', header: 'Velocidade', sortValue: (r) => r.speed_score, csv: (r) => r.speed_score, render: (r) => <Meter value={r.speed_score} max={100} /> },
  { key: 'mobile', header: 'Mobile', sortValue: (r) => r.mobile_score, csv: (r) => r.mobile_score, render: (r) => <Meter value={r.mobile_score} max={100} /> },
  { key: 'lcp', header: 'LCP', sortValue: (r) => r.cwv_lcp, csv: (r) => r.cwv_lcp,
    cellClass: (r) => (r.cwv_lcp > 2.5 ? 'ads-cell-bad' : 'ads-cell-good'), render: (r) => `${decimal(r.cwv_lcp)}s` },
];

export function LandingPages({ accountId }: { accountId: number; period: Period }) {
  const pal = useTokensAds();
  const { data, isLoading, isError } = useQuery<{ items: LandingPage[] }>({
    queryKey: chaves.landingPages(accountId),
    queryFn: ({ signal }) => apiGet<{ items: LandingPage[] }>('/landing-pages', { account_id: accountId }, signal),
  });
  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  const pages = data.items;
  const problemas = pages.filter((p) => !p.match_intent || p.speed_score < 80 || p.cwv_lcp > 2.5).length;

  return (
    <div className="ads-page">
      <PageHeader title="Landing Pages" subtitle="Desempenho, velocidade e Core Web Vitals das páginas de destino, com diagnóstico de correspondência entre anúncio e página (§16). Dados de GA4/PageSpeed integram na Fase 2." />
      {problemas > 0 && <div className="ads-banner">📄 {problemas} página(s) com atenção — lentidão, LCP alto ou baixa correspondência com a intenção da pesquisa.</div>}

      <div className="ads-grid2">
        <EChartCard
          titulo="Velocidade por página"
          subtitulo="pontuação PageSpeed (0–100)"
          altura={240}
          opcao={optColunas(pal, pages.map((p) => encurtarUrl(p.url)), pages.map((p) => p.speed_score), (v) => decimal(v, 0), {
            cores: pages.map((p) => (p.speed_score >= 80 ? pal.ok : p.speed_score >= 50 ? pal.warn : pal.danger)),
          })}
          aria="Velocidade por página"
          vazio={!pages.length}
        />
        <EChartCard
          titulo="Taxa de conversão por página"
          subtitulo="conversões por sessão"
          altura={240}
          opcao={optBarras(pal, pages.map((p) => encurtarUrl(p.url)), pages.map((p) => p.conv_rate * 100), (v) => decimal(v, 1) + '%')}
          aria="Taxa de conversão por página"
          vazio={!pages.length}
        />
      </div>

      <DataGrid rows={pages} columns={cols} rowKey={(r) => r.url} searchText={(r) => r.url} initialSortKey="cost" csvName="landing-pages" />
    </div>
  );
}
