// screens/Termos.tsx — DataGrid de termos de pesquisa (§15).
// @version 2.0.0  @modified 2026-07-22 (Fase 2: sankey D3 Palavra-chave→Classe do termo)
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { SearchTerm, Period } from '../shell/types';
import { PageHeader, Loading, EmptyState, TermClassBadge } from '../components/ui';
import { DataGrid, type Column } from '../components/DataGrid';
import { ChartCard } from '../components/viz/ChartCard';
import { SankeyFluxo, type NoFluxo, type LigacaoFluxo } from '../components/viz/d3/SankeyFluxo';
import { useTokensAds, type PaletaAds } from '../shell/useShellTheme';
import { moeda, moeda0, inteiro, pct, decimal } from '../lib/format';

const statusLabel: Record<string, [string, string]> = {
  ADDED: ['Adicionado', 'ads-pill-ok'], EXCLUDED: ['Negativado', 'ads-pill-danger'], NONE: ['—', 'ads-pill-dim'],
};

const CLASS_META: Record<string, [string, keyof PaletaAds]> = {
  converting: ['Convertendo', 'ok'], commercial: ['Comercial', 'primary'], informational: ['Informacional', 'cyan'],
  waste: ['Desperdício', 'danger'], competitor: ['Concorrente', 'purple'],
};

function fluxoTermos(items: SearchTerm[], pal: PaletaAds): { nos: NoFluxo[]; ligacoes: LigacaoFluxo[] } {
  // top 12 palavras-chave por custo, para o diagrama não ficar poluído
  const custoKw = new Map<string, number>();
  for (const t of items) custoKw.set(t.matched_keyword, (custoKw.get(t.matched_keyword) ?? 0) + t.cost);
  const topKw = new Set([...custoKw.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k]) => k));

  const nos = new Map<string, NoFluxo>();
  const agg = new Map<string, number>(); // "kw||classe" -> custo
  for (const t of items) {
    if (!topKw.has(t.matched_keyword)) continue;
    const idK = `k:${t.matched_keyword}`;
    if (!nos.has(idK)) nos.set(idK, { id: idK, nome: t.matched_keyword, cor: pal.primaryH });
    const idT = `t:${t.term_class}`;
    if (!nos.has(idT)) {
      const [rot, tk] = CLASS_META[t.term_class] ?? [t.term_class, 'textDim'];
      nos.set(idT, { id: idT, nome: rot, cor: pal[tk] as string });
    }
    const key = `${idK}||${idT}`;
    agg.set(key, (agg.get(key) ?? 0) + t.cost);
  }
  const ligacoes: LigacaoFluxo[] = [...agg.entries()].map(([k, v]) => {
    const [origem, destino] = k.split('||');
    return { origem, destino, valor: v };
  });
  return { nos: [...nos.values()], ligacoes };
}

const cols: Column<SearchTerm>[] = [
  { key: 'term', header: 'Termo pesquisado', align: 'left', sortValue: (r) => r.search_term, csv: (r) => r.search_term,
    render: (r) => (<span className="ads-cell-name" title={r.matched_keyword}>
      <span className="ads-cell-strong">{r.search_term}</span>
      <span className="ads-cell-sub"> ← {r.matched_keyword}</span></span>) },
  { key: 'class', header: 'Classificação', align: 'left', sortValue: (r) => r.term_class, render: (r) => <TermClassBadge c={r.term_class} /> },
  { key: 'status', header: 'Situação', align: 'left', sortValue: (r) => r.status,
    render: (r) => { const [l, c] = statusLabel[r.status] ?? ['—', 'ads-pill-dim']; return <span className={`ads-pill ${c}`}>{l}</span>; } },
  { key: 'campaign', header: 'Campanha', align: 'left', sortValue: (r) => r.campaign_name, csv: (r) => r.campaign_name,
    render: (r) => <span className="ads-cell-sub ads-cell-name">{r.campaign_name}</span> },
  { key: 'impressions', header: 'Impressões', sortValue: (r) => r.impressions, csv: (r) => r.impressions, render: (r) => inteiro(r.impressions) },
  { key: 'clicks', header: 'Cliques', sortValue: (r) => r.clicks, csv: (r) => r.clicks, render: (r) => inteiro(r.clicks) },
  { key: 'ctr', header: 'CTR', sortValue: (r) => r.ctr, csv: (r) => r.ctr, render: (r) => pct(r.ctr) },
  { key: 'cost', header: 'Custo', sortValue: (r) => r.cost, csv: (r) => r.cost,
    cellClass: (r) => (r.conversions <= 0 && r.cost > 40 ? 'ads-cell-bad' : ''), render: (r) => <span className="ads-cell-strong">{moeda0(r.cost)}</span> },
  { key: 'conversions', header: 'Conv.', sortValue: (r) => r.conversions, csv: (r) => r.conversions, render: (r) => decimal(r.conversions) },
  { key: 'cpa', header: 'CPA', sortValue: (r) => r.cpa, csv: (r) => r.cpa, render: (r) => (r.cpa > 0 ? moeda(r.cpa) : '—') },
  { key: 'acao', header: 'Ação sugerida', align: 'left', sortValue: (r) => r.term_class,
    render: (r) => r.term_class === 'waste'
      ? <span className="ads-pill ads-pill-danger">+ Negativar</span>
      : (r.term_class === 'converting' && r.status !== 'ADDED' ? <span className="ads-pill ads-pill-ok">+ Palavra-chave</span> : <span className="ads-cell-sub">—</span>) },
];

export function Termos({ accountId }: { accountId: number; period: Period }) {
  const pal = useTokensAds();
  const { data, isLoading, isError } = useQuery<{ items: SearchTerm[] }>({
    queryKey: chaves.searchTerms(accountId),
    queryFn: ({ signal }) => apiGet<{ items: SearchTerm[] }>('/search-terms', { account_id: accountId }, signal),
  });
  const { nos, ligacoes } = useMemo(() => fluxoTermos(data?.items ?? [], pal), [data, pal]);

  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  const desperdicio = data.items.filter((t) => t.term_class === 'waste').length;

  return (
    <div className="ads-page">
      <PageHeader title="Termos de pesquisa" subtitle="O que as pessoas realmente digitaram. O sistema identifica termos com desperdício, intenção comercial e oportunidades de novas palavras/negativas (§15)." />
      {desperdicio > 0 && <div className="ads-banner">🗑️ {desperdicio} termo(s) marcados como desperdício — candidatos a palavra-chave negativa. Na Fase 3, negativar em lote passa por preview + confirmação (§32).</div>}

      <div style={{ marginBottom: 14 }}>
        <ChartCard titulo="Fluxo de custo: palavra-chave → classe do termo" subtitulo="largura ∝ custo · revela quais palavras geram desperdício vs conversão" altura={340}>
          <SankeyFluxo nos={nos} ligacoes={ligacoes} fmt={moeda0} altura={320} />
        </ChartCard>
      </div>

      <DataGrid rows={data.items} columns={cols} rowKey={(r) => r.search_term}
        searchText={(r) => `${r.search_term} ${r.matched_keyword} ${r.campaign_name}`} initialSortKey="cost" csvName="termos-de-pesquisa" />
    </div>
  );
}
