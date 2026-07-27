// screens/PalavrasChave.tsx — DataGrid de palavras-chave (§14).
// @version 2.0.0  @modified 2026-07-22 (Fase 2: scatter QS×custo + filtro cruzado por saúde)
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { Keyword, Period } from '../shell/types';
import { PageHeader, Loading, EmptyState, MatchBadge, KwClassBadge, Meter } from '../components/ui';
import { DataGrid, type Column } from '../components/DataGrid';
import { EChartCard } from '../components/viz/EChartCard';
import { optScatter, type PontoScatter } from '../components/viz/echarts-opts';
import { useTokensAds, type PaletaAds } from '../shell/useShellTheme';
import { moeda, moeda0, inteiro, pct, decimal } from '../lib/format';

const cols: Column<Keyword>[] = [
  { key: 'kw', header: 'Palavra-chave', align: 'left', sortValue: (r) => r.keyword_text, csv: (r) => r.keyword_text,
    render: (r) => (<span className="ads-cell-name" title={`${r.ad_group_name} · ${r.campaign_name}`}>
      <span className="ads-cell-strong">{r.keyword_text}</span>
      <span className="ads-cell-sub"> {r.ad_group_name}</span></span>) },
  { key: 'match', header: 'Correspond.', align: 'left', sortValue: (r) => r.match_type, render: (r) => <MatchBadge m={r.match_type} /> },
  { key: 'class', header: 'Classificação', align: 'left', sortValue: (r) => r.kw_class, render: (r) => <KwClassBadge c={r.kw_class} /> },
  { key: 'qs', header: 'Qualidade', sortValue: (r) => r.quality_score, csv: (r) => r.quality_score, render: (r) => <Meter value={r.quality_score} max={10} /> },
  { key: 'impressions', header: 'Impressões', sortValue: (r) => r.impressions, csv: (r) => r.impressions, render: (r) => inteiro(r.impressions) },
  { key: 'clicks', header: 'Cliques', sortValue: (r) => r.clicks, csv: (r) => r.clicks, render: (r) => inteiro(r.clicks) },
  { key: 'ctr', header: 'CTR', sortValue: (r) => r.ctr, csv: (r) => r.ctr, render: (r) => pct(r.ctr) },
  { key: 'avg_cpc', header: 'CPC', sortValue: (r) => r.avg_cpc, csv: (r) => r.avg_cpc, render: (r) => moeda(r.avg_cpc) },
  { key: 'cost', header: 'Custo', sortValue: (r) => r.cost, csv: (r) => r.cost, render: (r) => <span className="ads-cell-strong">{moeda0(r.cost)}</span> },
  { key: 'conversions', header: 'Conv.', sortValue: (r) => r.conversions, csv: (r) => r.conversions, render: (r) => decimal(r.conversions) },
  { key: 'cpa', header: 'CPA', sortValue: (r) => r.cpa, csv: (r) => r.cpa, cellClass: (r) => (r.cpa > 200 ? 'ads-cell-bad' : ''), render: (r) => (r.cpa > 0 ? moeda(r.cpa) : '—') },
];

/** Classe granular → bucket de saúde (rótulo + token de cor). */
function bucketKw(c: string): [string, keyof PaletaAds] {
  if (c === 'profitable' || c === 'expand_candidate') return ['Rentável', 'ok'];
  if (c === 'promising') return ['Promissora', 'primary'];
  if (c === 'wasting' || c === 'bad_intent') return ['Desperdício', 'danger'];
  if (c === 'low_volume') return ['Baixo volume', 'textDim'];
  return ['Atenção', 'warn'];
}

export function PalavrasChave({ accountId }: { accountId: number; period: Period }) {
  const pal = useTokensAds();
  const [metricaY, setMetricaY] = useState<'cpc' | 'cpa'>('cpc');
  const [bucketSel, setBucketSel] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery<{ items: Keyword[] }>({
    queryKey: chaves.keywords(accountId),
    queryFn: ({ signal }) => apiGet<{ items: Keyword[] }>('/keywords', { account_id: accountId }, signal),
  });

  const pontos = useMemo<PontoScatter[]>(() => {
    const items = data?.items ?? [];
    return items
      .filter((k) => (metricaY === 'cpc' ? k.avg_cpc > 0 : k.cpa > 0)) // CPA só faz sentido com conversão
      .map((k) => {
        const [lbl, tk] = bucketKw(k.kw_class);
        return { x: k.quality_score, y: metricaY === 'cpc' ? k.avg_cpc : k.cpa, tam: k.cost, nome: k.keyword_text, grupo: lbl, cor: pal[tk] as string, extra: { bucket: lbl } };
      });
  }, [data, metricaY, pal]);

  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  const rows = bucketSel ? data.items.filter((k) => bucketKw(k.kw_class)[0] === bucketSel) : data.items;

  const btn = (m: 'cpc' | 'cpa', txt: string) => (
    <button type="button" onClick={() => setMetricaY(m)}
      style={{ border: `1px solid ${metricaY === m ? pal.primary : pal.border}`, background: metricaY === m ? pal.primary : 'transparent', color: metricaY === m ? '#fff' : pal.textDim, borderRadius: 7, padding: '3px 9px', cursor: 'pointer', fontSize: 11.5, fontWeight: 600 }}>
      {txt}
    </button>
  );

  return (
    <div className="ads-page">
      <PageHeader title="Palavras-chave" subtitle="Palavras com Quality Score e classificação automática (rentável, cara, sem conversão, desperdício…). Ordene por custo ou CPA para achar desperdício (§14)." />

      <div style={{ marginBottom: 14 }}>
        <EChartCard
          titulo="Qualidade × custo por palavra-chave"
          subtitulo={`bolha ∝ investimento · cor = saúde${bucketSel ? ` · filtrando ${bucketSel}` : ' · clique numa bolha para filtrar a tabela'}`}
          altura={340}
          acoes={<div style={{ display: 'flex', gap: 4 }}>{btn('cpc', 'CPC')}{btn('cpa', 'CPA')}</div>}
          opcao={optScatter(pal, pontos, {
            nomeX: 'Quality Score', nomeY: metricaY === 'cpc' ? 'CPC' : 'CPA',
            fmtX: (v) => decimal(v, 0), fmtY: (v) => moeda(v), fmtTam: moeda0, rotuloTam: 'Investimento',
          })}
          eventos={{
            click: (params) => {
              const b = (params as { data?: { bucket?: string } }).data?.bucket ?? null;
              setBucketSel((a) => (a === b ? null : b));
            },
          }}
          vazio={pontos.length === 0}
          vazioMsg={metricaY === 'cpa' ? 'Nenhuma palavra com conversão no período.' : 'Sem dados.'}
          aria="Dispersão de Quality Score por custo das palavras-chave"
        />
      </div>

      <div className="ads-card" style={{ padding: 0 }}>
        <DataGrid rows={rows} columns={cols} rowKey={(r) => r.criterion_id}
          searchText={(r) => `${r.keyword_text} ${r.ad_group_name} ${r.campaign_name}`} initialSortKey="cost" csvName="palavras-chave"
          toolbarExtra={bucketSel ? (
            <button type="button" onClick={() => setBucketSel(null)}
              style={{ border: `1px solid ${pal.primary}`, background: 'transparent', color: pal.primary, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
              Saúde: {bucketSel} ✕
            </button>
          ) : undefined} />
      </div>
    </div>
  );
}
