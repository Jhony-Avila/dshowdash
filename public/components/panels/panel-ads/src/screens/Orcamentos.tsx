// screens/Orcamentos.tsx — orçamentos, ritmo e simulador (§24).
// @version 2.0.0  @modified 2026-07-22 (Fase 2: ECharts — barras pacing + combinado sensibilidade)
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { Budget, AdGroup, Period } from '../shell/types';
import { PageHeader, Loading, EmptyState } from '../components/ui';
import { DataGrid, type Column } from '../components/DataGrid';
import { EChartCard } from '../components/viz/EChartCard';
import { ChartCard } from '../components/viz/ChartCard';
import { optBarras, optCombinado } from '../components/viz/echarts-opts';
import { Treemap, type GrupoTreemap } from '../components/viz/d3/Treemap';
import { useTokensAds } from '../shell/useShellTheme';
import { moeda, moeda0, decimal, pct } from '../lib/format';

const STATUS: Record<string, [string, string]> = {
  limited: ['Limitada', 'ads-pill-danger'], overpacing: ['Gastando rápido', 'ads-pill-warn'],
  underpacing: ['Subutilizada', 'ads-pill-dim'], ok: ['No ritmo', 'ads-pill-ok'],
};

const cols: Column<Budget>[] = [
  { key: 'campaign', header: 'Campanha', align: 'left', sortValue: (r) => r.campaign, csv: (r) => r.campaign,
    render: (r) => <span className="ads-cell-strong ads-cell-name" title={r.campaign}>{r.campaign}</span> },
  { key: 'daily', header: 'Orçam./dia', sortValue: (r) => r.daily_budget, csv: (r) => r.daily_budget, render: (r) => moeda0(r.daily_budget) },
  { key: 'spent_today', header: 'Gasto hoje', sortValue: (r) => r.spent_today, csv: (r) => r.spent_today, render: (r) => moeda0(r.spent_today) },
  { key: 'spent_month', header: 'Gasto no mês', sortValue: (r) => r.spent_month, csv: (r) => r.spent_month, render: (r) => <span className="ads-cell-strong">{moeda0(r.spent_month)}</span> },
  { key: 'pacing', header: 'Ritmo', sortValue: (r) => r.pacing, csv: (r) => r.pacing,
    render: (r) => (
      <span className="ads-meter">
        <span className="ads-meter-track" style={{ width: 54 }}><span className="ads-meter-fill" style={{ width: `${Math.min(100, r.pacing * 100)}%`, background: r.pacing > 1.05 ? 'var(--ads-warn)' : (r.pacing < 0.7 ? 'var(--ads-text-dim)' : 'var(--ads-ok)') }} /></span>
        {pct(r.pacing, 0)}
      </span>) },
  { key: 'projection', header: 'Projeção mês', sortValue: (r) => r.projection, csv: (r) => r.projection, render: (r) => moeda0(r.projection) },
  { key: 'status', header: 'Situação', align: 'left', sortValue: (r) => r.status,
    render: (r) => { const [l, c] = STATUS[r.status] ?? ['—', 'ads-pill-dim']; return <span className={`ads-pill ${c}`}>{l}</span>; } },
];

export function Orcamentos({ accountId }: { accountId: number; period: Period }) {
  const pal = useTokensAds();
  const { data, isLoading, isError } = useQuery<{ items: Budget[] }>({
    queryKey: chaves.budgets(accountId),
    queryFn: ({ signal }) => apiGet<{ items: Budget[] }>('/budgets', { account_id: accountId }, signal),
  });
  // grupos de anúncios (compartilhado com a tela Grupos) → estrutura de investimento (treemap)
  const grupos = useQuery<{ items: AdGroup[] }>({
    queryKey: chaves.adGroups(accountId),
    queryFn: ({ signal }) => apiGet<{ items: AdGroup[] }>('/ad-groups', { account_id: accountId }, signal),
  });
  const [delta, setDelta] = useState(0);

  const estrutura = useMemo<GrupoTreemap[]>(() => {
    const porCampanha = new Map<string, { nome: string; valor: number }[]>();
    for (const g of grupos.data?.items ?? []) {
      if ((g.cost || 0) <= 0) continue;
      const arr = porCampanha.get(g.campaign_name) ?? [];
      arr.push({ nome: g.name, valor: g.cost });
      porCampanha.set(g.campaign_name, arr);
    }
    return [...porCampanha.entries()].map(([nome, itens]) => ({ nome, itens }));
  }, [grupos.data]);

  const sim = useMemo(() => {
    if (!data) return null;
    const spend = data.items.reduce((s, b) => s + b.spent_month, 0);
    const conv = data.items.reduce((s, b) => s + b.conversions, 0);
    const f = 1 + delta / 100;
    const newSpend = spend * f;
    // retorno decrescente: +X% verba → +X*0.82% conversões
    const convF = delta >= 0 ? 1 + (delta / 100) * 0.82 : f;
    const newConv = conv * convF;
    const cpa = newConv > 0 ? newSpend / newConv : 0;
    return { spend, conv, newSpend, newConv, cpa, cpaBase: conv > 0 ? spend / conv : 0 };
  }, [data, delta]);

  // Curva de sensibilidade: varre deltas de -50% a +100% (passo 10) sobre os agregados
  // atuais, usando o MESMO modelo do simulador (retorno decrescente 0.82 só na expansão).
  const curva = useMemo(() => {
    if (!data) return null;
    const spend = data.items.reduce((s, b) => s + b.spent_month, 0);
    const conv = data.items.reduce((s, b) => s + b.conversions, 0);
    const deltas: number[] = [];
    for (let d = -50; d <= 100; d += 10) deltas.push(d);
    const labels = deltas.map((d) => (d > 0 ? '+' : '') + d + '%');
    const custos = deltas.map((d) => spend * (1 + d / 100));
    const convs = deltas.map((d) => conv * (d >= 0 ? 1 + (d / 100) * 0.82 : 1 + d / 100));
    return { labels, custos, convs };
  }, [data]);

  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data || !sim || !curva) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  return (
    <div className="ads-page">
      <PageHeader title="Orçamentos" subtitle="Ritmo de consumo, projeção de fechamento e campanhas limitadas ou subutilizadas (§24)." />

      <div style={{ marginBottom: 14 }}>
        <EChartCard
          titulo="Ritmo por campanha (pacing)"
          subtitulo="100% = no ritmo · acima = gastando rápido · abaixo = subutilizada"
          altura={Math.max(220, data.items.length * 30 + 40)}
          opcao={optBarras(pal, data.items.map((b) => b.campaign), data.items.map((b) => b.pacing * 100),
            (v) => decimal(v, 0) + '%', {
              horizontal: true,
              cores: data.items.map((b) => b.status === 'overpacing' ? pal.danger
                : b.status === 'underpacing' ? pal.warn
                : b.status === 'limited' ? pal.warn
                : pal.ok),
            })}
          vazio={!data.items.length}
          aria="Ritmo de consumo do orçamento por campanha, em percentual"
        />
      </div>

      {estrutura.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <ChartCard titulo="Estrutura de investimento" subtitulo="gasto por campanha e grupo (30d) · área ∝ custo" altura={320}>
            <Treemap grupos={estrutura} fmt={(v) => moeda(v, true)} altura={320} />
          </ChartCard>
        </div>
      )}

      <div className="ads-card" style={{ marginBottom: 14 }}>
        <div className="ads-card-tit">Simulador de orçamento <small>estimativa — nunca garantia (§24.1)</small></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 320px' }}>
            <span className="ads-cell-sub" style={{ whiteSpace: 'nowrap' }}>Ajuste de verba</span>
            <input type="range" min={-50} max={100} step={5} value={delta} onChange={(e) => setDelta(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--ads-primary)' }} />
            <strong style={{ minWidth: 52, textAlign: 'right' }}>{delta > 0 ? '+' : ''}{delta}%</strong>
          </label>
        </div>
        <div className="ads-kpi-grid" style={{ marginTop: 14, marginBottom: 0 }}>
          <div className="ads-kpi"><div className="ads-kpi-lbl">Gasto projetado</div><div className="ads-kpi-val">{moeda0(sim.newSpend)}</div><div className="ads-cell-sub">era {moeda0(sim.spend)}</div></div>
          <div className="ads-kpi"><div className="ads-kpi-lbl">Conversões estimadas</div><div className="ads-kpi-val">{decimal(sim.newConv)}</div><div className="ads-cell-sub">era {decimal(sim.conv)}</div></div>
          <div className="ads-kpi"><div className="ads-kpi-lbl">CPA estimado</div><div className="ads-kpi-val">{moeda(sim.cpa)}</div><div className="ads-cell-sub">era {moeda(sim.cpaBase)}</div></div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <EChartCard
          titulo="Sensibilidade da verba"
          subtitulo="projeção sobre os agregados atuais — custo × conversões por nível de ajuste"
          altura={260}
          opcao={optCombinado(pal, curva.labels,
            { name: 'Custo', data: curva.custos },
            { name: 'Conversões', data: curva.convs },
            moeda0, (v) => decimal(v, 0))}
          aria="Curva de sensibilidade: custo e conversões projetados por nível de ajuste de verba"
        />
      </div>

      <DataGrid rows={data.items} columns={cols} rowKey={(r) => r.campaign} searchText={(r) => r.campaign} initialSortKey="spent_month" csvName="orcamentos" />
    </div>
  );
}
