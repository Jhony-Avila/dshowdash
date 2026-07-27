// screens/Anuncios.tsx — DataGrid de anúncios (§13).
// @version 2.0.0  @modified 2026-07-22 (Fase 2: sankey D3 Campanha→Força)
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { AdItem, Period, DrillFiltro } from '../shell/types';
import { PageHeader, Loading, EmptyState, StrengthBadge, ApprovalBadge } from '../components/ui';
import { DataGrid, type Column } from '../components/DataGrid';
import { ChartCard } from '../components/viz/ChartCard';
import { SankeyFluxo, type NoFluxo, type LigacaoFluxo } from '../components/viz/d3/SankeyFluxo';
import { useTokensAds, type PaletaAds } from '../shell/useShellTheme';
import { moeda, moeda0, inteiro, pct, decimal } from '../lib/format';

const strengthRank: Record<string, number> = { POOR: 0, AVERAGE: 1, GOOD: 2, EXCELLENT: 3 };
const STRENGTH_META: Record<string, [string, keyof PaletaAds]> = {
  EXCELLENT: ['Excelente', 'ok'], GOOD: ['Boa', 'primary'], AVERAGE: ['Média', 'warn'], POOR: ['Ruim', 'danger'],
};

function fluxoForca(items: AdItem[], pal: PaletaAds): { nos: NoFluxo[]; ligacoes: LigacaoFluxo[] } {
  const nos = new Map<string, NoFluxo>();
  const agg = new Map<string, number>(); // "camp||STR" -> contagem
  for (const a of items) {
    const idC = `c:${a.campaign_name}`;
    if (!nos.has(idC)) nos.set(idC, { id: idC, nome: a.campaign_name, cor: pal.primaryH });
    const idS = `s:${a.ad_strength}`;
    if (!nos.has(idS)) {
      const [rot, tk] = STRENGTH_META[a.ad_strength] ?? ['—', 'textDim'];
      nos.set(idS, { id: idS, nome: rot, cor: pal[tk] as string });
    }
    const k = `${idC}||${idS}`;
    agg.set(k, (agg.get(k) ?? 0) + 1);
  }
  const ligacoes: LigacaoFluxo[] = [...agg.entries()].map(([k, v]) => {
    const [origem, destino] = k.split('||');
    return { origem, destino, valor: v };
  });
  return { nos: [...nos.values()], ligacoes };
}

const cols: Column<AdItem>[] = [
  { key: 'ad', header: 'Anúncio (títulos)', align: 'left', sortValue: (r) => r.headlines[0] ?? '', csv: (r) => r.headlines.join(' | '),
    render: (r) => (
      <span className="ads-cell-name" title={r.headlines.join(' · ')}>
        <span className="ads-cell-strong">{r.headlines.slice(0, 2).join(' · ')}</span>
        <span className="ads-cell-sub"> {r.ad_group_name} · {r.campaign_name}</span>
      </span>) },
  { key: 'strength', header: 'Força', align: 'left', sortValue: (r) => strengthRank[r.ad_strength] ?? 0, render: (r) => <StrengthBadge s={r.ad_strength} /> },
  { key: 'approval', header: 'Aprovação', align: 'left', sortValue: (r) => r.approval_status, render: (r) => <ApprovalBadge status={r.approval_status} /> },
  { key: 'impressions', header: 'Impressões', sortValue: (r) => r.impressions, csv: (r) => r.impressions, render: (r) => inteiro(r.impressions) },
  { key: 'clicks', header: 'Cliques', sortValue: (r) => r.clicks, csv: (r) => r.clicks, render: (r) => inteiro(r.clicks) },
  { key: 'ctr', header: 'CTR', sortValue: (r) => r.ctr, csv: (r) => r.ctr, render: (r) => pct(r.ctr) },
  { key: 'cost', header: 'Custo', sortValue: (r) => r.cost, csv: (r) => r.cost, render: (r) => <span className="ads-cell-strong">{moeda0(r.cost)}</span> },
  { key: 'conversions', header: 'Conv.', sortValue: (r) => r.conversions, csv: (r) => r.conversions, render: (r) => decimal(r.conversions) },
  { key: 'cpa', header: 'CPA', sortValue: (r) => r.cpa, csv: (r) => r.cpa, cellClass: (r) => (r.cpa > 200 ? 'ads-cell-bad' : ''), render: (r) => (r.cpa > 0 ? moeda(r.cpa) : '—') },
];

export function Anuncios({ accountId, drill }: { accountId: number; period: Period; drill?: DrillFiltro | null }) {
  const pal = useTokensAds();
  const [filtro, setFiltro] = useState<DrillFiltro | null>(drill ?? null);
  useEffect(() => { if (drill) setFiltro(drill); }, [drill]);
  const { data, isLoading, isError } = useQuery<{ items: AdItem[] }>({
    queryKey: chaves.ads(accountId),
    queryFn: ({ signal }) => apiGet<{ items: AdItem[] }>('/ads', { account_id: accountId }, signal),
  });
  const { nos, ligacoes } = useMemo(() => fluxoForca(data?.items ?? [], pal), [data, pal]);

  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  const rows = filtro
    ? data.items.filter((a) => (filtro.tipo === 'campanha' ? a.campaign_name === filtro.valor : a.ad_group_name === filtro.valor))
    : data.items;
  const reprovados = data.items.filter((a) => a.approval_status === 'DISAPPROVED').length;

  return (
    <div className="ads-page">
      <PageHeader title="Anúncios" subtitle="Anúncios responsivos com força, aprovação e desempenho. A força reflete variedade de títulos/descrições e aderência à palavra-chave (§13)." />
      {reprovados > 0 && <div className="ads-banner">⚠️ {reprovados} anúncio(s) reprovado(s) — verifique os motivos de política antes de recriar.</div>}

      <div style={{ marginBottom: 14 }}>
        <ChartCard titulo="Força dos anúncios por campanha" subtitulo="largura ∝ nº de anúncios em cada nível de força" altura={320}>
          <SankeyFluxo nos={nos} ligacoes={ligacoes} fmt={(v) => `${inteiro(v)} anúncio(s)`} altura={300} />
        </ChartCard>
      </div>

      <DataGrid rows={rows} columns={cols} rowKey={(r) => r.ad_id}
        searchText={(r) => `${r.headlines.join(' ')} ${r.ad_group_name} ${r.campaign_name}`} initialSortKey="cost" csvName="anuncios"
        toolbarExtra={filtro ? (
          <button type="button" onClick={() => setFiltro(null)}
            style={{ border: `1px solid ${pal.primary}`, background: 'transparent', color: pal.primary, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
            {filtro.tipo === 'campanha' ? 'Campanha' : 'Grupo'}: {filtro.valor} ✕
          </button>
        ) : undefined} />
    </div>
  );
}
