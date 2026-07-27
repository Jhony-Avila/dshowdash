// screens/Grupos.tsx — DataGrid de grupos de anúncios (§12).
// @version 2.0.0  @modified 2026-07-22 (Fase 2: grafo D3 Campanha↔Grupo + filtro cruzado)
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { AdGroup, Period, DrillFiltro } from '../shell/types';
import { PageHeader, Loading, EmptyState, Meter } from '../components/ui';
import { DataGrid, type Column } from '../components/DataGrid';
import { ChartCard } from '../components/viz/ChartCard';
import { GrafoForca, type NoGrafo, type ArestaGrafo } from '../components/viz/d3/GrafoForca';
import { useTokensAds } from '../shell/useShellTheme';
import { moeda, moeda0, inteiro, pct, decimal, razao } from '../lib/format';

function grafoGrupos(items: AdGroup[]): { nos: NoGrafo[]; arestas: ArestaGrafo[] } {
  const nos = new Map<string, NoGrafo>();
  const arestas: ArestaGrafo[] = [];
  // valor governa o RAIO do nó (raio = 6 + √valor·1.4). Escalamos o custo (milhares)
  // para uma faixa pequena (~3–25) senão os nós explodem e se sobrepõem.
  const custoC = new Map<string, number>();
  for (const g of items) {
    const idC = `c:${g.campaign_name}`;
    if (!nos.has(idC)) nos.set(idC, { id: idC, nome: g.campaign_name, grupo: 0, valor: 6 });
    custoC.set(idC, (custoC.get(idC) ?? 0) + g.cost);
    const idG = `g:${g.ad_group_id}`;
    nos.set(idG, { id: idG, nome: g.name, grupo: 1, valor: Math.max(3, g.cost / 400) });
    arestas.push({ origem: idG, destino: idC });
  }
  for (const [idC, c] of custoC) { const n = nos.get(idC); if (n) n.valor = Math.max(8, c / 400); }
  return { nos: [...nos.values()], arestas };
}

const cols: Column<AdGroup>[] = [
  { key: 'name', header: 'Grupo', align: 'left', sortValue: (r) => r.name, csv: (r) => r.name,
    render: (r) => (<span><span className="ads-cell-strong">{r.name}</span>{(r.cannibalization_flag || r.split_opportunity) && (
      <span className="ads-cell-sub"> {r.cannibalization_flag ? '⚠ canibalização' : ''}{r.split_opportunity ? ' ✂ dividir' : ''}</span>)}</span>) },
  { key: 'campaign', header: 'Campanha', align: 'left', sortValue: (r) => r.campaign_name, csv: (r) => r.campaign_name,
    render: (r) => <span className="ads-cell-name ads-cell-sub" title={r.campaign_name}>{r.campaign_name}</span> },
  { key: 'impressions', header: 'Impressões', sortValue: (r) => r.impressions, csv: (r) => r.impressions, render: (r) => inteiro(r.impressions) },
  { key: 'clicks', header: 'Cliques', sortValue: (r) => r.clicks, csv: (r) => r.clicks, render: (r) => inteiro(r.clicks) },
  { key: 'ctr', header: 'CTR', sortValue: (r) => r.ctr, csv: (r) => r.ctr, render: (r) => pct(r.ctr) },
  { key: 'cost', header: 'Custo', sortValue: (r) => r.cost, csv: (r) => r.cost, render: (r) => <span className="ads-cell-strong">{moeda0(r.cost)}</span> },
  { key: 'conversions', header: 'Conv.', sortValue: (r) => r.conversions, csv: (r) => r.conversions, render: (r) => decimal(r.conversions) },
  { key: 'cpa', header: 'CPA', sortValue: (r) => r.cpa, csv: (r) => r.cpa, cellClass: (r) => (r.cpa > 200 ? 'ads-cell-bad' : ''), render: (r) => (r.cpa > 0 ? moeda(r.cpa) : '—') },
  { key: 'roas', header: 'ROAS', sortValue: (r) => r.roas, csv: (r) => r.roas,
    cellClass: (r) => (r.roas >= 3 ? 'ads-cell-good' : (r.roas > 0 && r.roas < 1.5 ? 'ads-cell-bad' : '')), render: (r) => (r.roas > 0 ? razao(r.roas) : '—') },
  { key: 'ads', header: 'Anúncios', sortValue: (r) => r.ads_count, csv: (r) => r.ads_count, render: (r) => r.ads_count },
  { key: 'kws', header: 'Palavras', sortValue: (r) => r.keywords_count, csv: (r) => r.keywords_count, render: (r) => r.keywords_count },
  { key: 'qs', header: 'Qualidade', sortValue: (r) => r.quality_score, csv: (r) => r.quality_score, render: (r) => <Meter value={r.quality_score} max={10} /> },
];

export function Grupos({ accountId, drill, onIr }: { accountId: number; period: Period; drill?: DrillFiltro | null; onIr?: (id: string, filtro?: DrillFiltro) => void }) {
  const pal = useTokensAds();
  const [campSel, setCampSel] = useState<string | null>(drill?.tipo === 'campanha' ? drill.valor : null);
  // sincroniza o filtro quando chega um novo drill (navegação de outra tela)
  useEffect(() => { if (drill?.tipo === 'campanha') setCampSel(drill.valor); }, [drill]);
  const { data, isLoading, isError } = useQuery<{ items: AdGroup[] }>({
    queryKey: chaves.adGroups(accountId),
    queryFn: ({ signal }) => apiGet<{ items: AdGroup[] }>('/ad-groups', { account_id: accountId }, signal),
  });
  const { nos, arestas } = useMemo(() => grafoGrupos(data?.items ?? []), [data]);

  const colunas: Column<AdGroup>[] = onIr
    ? [...cols, { key: 'drill', header: 'Detalhar', align: 'left', render: (r) => (
        <button type="button" onClick={() => onIr('anuncios', { tipo: 'grupo', valor: r.name })}
          style={{ border: `1px solid ${pal.border}`, background: 'transparent', color: pal.primary, borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>Anúncios</button>) }]
    : cols;

  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  const rows = campSel ? data.items.filter((g) => g.campaign_name === campSel) : data.items;

  return (
    <div className="ads-page">
      <PageHeader title="Grupos de anúncios" subtitle="Grupos com aderência, qualidade média e sinais de canibalização ou oportunidade de divisão por intenção (§12)." />

      <div style={{ marginBottom: 14 }}>
        <ChartCard titulo="Estrutura: campanhas ↔ grupos" subtitulo={campSel ? `filtrando: ${campSel} — clique de novo para limpar` : 'clique numa campanha (nó maior) para filtrar a tabela · arraste/zoom'} altura={340}>
          <GrafoForca nos={nos} arestas={arestas} altura={320}
            onSelecionar={(id, nome) => { if (id.startsWith('c:')) setCampSel((a) => (a === nome ? null : nome)); }} />
        </ChartCard>
      </div>

      <div className="ads-card" style={{ padding: 0 }}>
        <DataGrid rows={rows} columns={colunas} rowKey={(r) => r.ad_group_id}
          searchText={(r) => `${r.name} ${r.campaign_name}`} initialSortKey="cost" csvName="grupos-de-anuncios"
          toolbarExtra={campSel ? (
            <button type="button" onClick={() => setCampSel(null)}
              style={{ border: `1px solid ${pal.primary}`, background: 'transparent', color: pal.primary, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
              Campanha: {campSel} ✕
            </button>
          ) : undefined} />
      </div>
    </div>
  );
}
