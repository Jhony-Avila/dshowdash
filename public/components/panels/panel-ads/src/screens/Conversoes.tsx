// screens/Conversoes.tsx — ações de conversão (§23).
// @version 2.0.0  @modified 2026-07-22 (Fase 2: ECharts — barras de valor + donut de atribuição)
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { ConversionAction, Period } from '../shell/types';
import { PageHeader, Loading, EmptyState } from '../components/ui';
import { DataGrid, type Column } from '../components/DataGrid';
import { EChartCard } from '../components/viz/EChartCard';
import { optBarras, optDonut } from '../components/viz/echarts-opts';
import { useTokensAds } from '../shell/useShellTheme';
import { moeda, moeda0, inteiro, decimal } from '../lib/format';

const ATTR: Record<string, string> = { DATA_DRIVEN: 'Orientada a dados', LAST_CLICK: 'Último clique' };

const cols: Column<ConversionAction>[] = [
  { key: 'name', header: 'Ação de conversão', align: 'left', sortValue: (r) => r.name, csv: (r) => r.name,
    render: (r) => (<span><span className="ads-cell-strong">{r.name}</span>{r.primary && <span className="ads-pill ads-pill-primary" style={{ marginLeft: 6 }}>Principal</span>}<div className="ads-cell-sub">{r.category} · origem {r.origin}</div></span>) },
  { key: 'count', header: 'Conversões', sortValue: (r) => r.count, csv: (r) => r.count, render: (r) => <span className="ads-cell-strong">{decimal(r.count)}</span> },
  { key: 'value', header: 'Valor', sortValue: (r) => r.value, csv: (r) => r.value, render: (r) => moeda0(r.value) },
  { key: 'value_per', header: 'Valor/conv.', sortValue: (r) => r.value_per, csv: (r) => r.value_per, render: (r) => moeda(r.value_per) },
  { key: 'attribution', header: 'Atribuição', align: 'left', sortValue: (r) => r.attribution, csv: (r) => ATTR[r.attribution] ?? r.attribution, render: (r) => ATTR[r.attribution] ?? r.attribution },
  { key: 'window', header: 'Janela', sortValue: (r) => r.window_days, csv: (r) => r.window_days, render: (r) => `${r.window_days}d` },
  { key: 'quality', header: 'Rastreamento', align: 'left', sortValue: (r) => r.tracking_quality,
    render: (r) => r.tracking_quality === 'good' ? <span className="ads-pill ads-pill-ok">Saudável</span> : <span className="ads-pill ads-pill-warn">Atenção</span> },
];

export function Conversoes({ accountId }: { accountId: number; period: Period }) {
  const pal = useTokensAds();
  const { data, isLoading, isError } = useQuery<{ items: ConversionAction[] }>({
    queryKey: chaves.conversions(accountId),
    queryFn: ({ signal }) => apiGet<{ items: ConversionAction[] }>('/conversions', { account_id: accountId }, signal),
  });
  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  const acoes = data.items;
  const totalConv = acoes.reduce((s, c) => s + c.count, 0);
  const totalValue = acoes.reduce((s, c) => s + c.value, 0);

  // Agregação de conversões por modelo de atribuição (para o donut).
  const somaDataDriven = acoes.filter((a) => a.attribution === 'DATA_DRIVEN').reduce((s, a) => s + a.count, 0);
  const somaLastClick = acoes.filter((a) => a.attribution === 'LAST_CLICK').reduce((s, a) => s + a.count, 0);

  return (
    <div className="ads-page">
      <PageHeader title="Conversões" subtitle="Ações de conversão com contagem, valor e qualidade do rastreamento. Formulários, WhatsApp e ligações são as conversões primárias (§23)." />
      <div className="ads-kpi-grid">
        <div className="ads-kpi"><div className="ads-kpi-lbl">Total de conversões</div><div className="ads-kpi-val">{decimal(totalConv)}</div></div>
        <div className="ads-kpi"><div className="ads-kpi-lbl">Valor total</div><div className="ads-kpi-val">{moeda0(totalValue)}</div></div>
        <div className="ads-kpi"><div className="ads-kpi-lbl">Ações rastreadas</div><div className="ads-kpi-val">{acoes.length}</div></div>
      </div>

      <div className="ads-grid2">
        <EChartCard
          titulo="Valor por ação de conversão"
          subtitulo="valor total gerado por ação"
          altura={240}
          opcao={optBarras(pal, acoes.map((a) => a.name), acoes.map((a) => a.value), moeda0, { horizontal: true })}
          aria="Valor por ação de conversão"
          vazio={!acoes.length}
        />
        <EChartCard
          titulo="Conversões por modelo de atribuição"
          subtitulo="orientada a dados vs. último clique"
          altura={240}
          opcao={optDonut(pal, [
            { name: 'Data-driven', value: somaDataDriven, cor: pal.primary },
            { name: 'Último clique', value: somaLastClick, cor: pal.cyan },
          ], inteiro, { titulo: 'Conversões' })}
          aria="Conversões por modelo de atribuição"
          vazio={!acoes.length}
        />
      </div>

      <DataGrid rows={acoes} columns={cols} rowKey={(r) => r.name} initialSortKey="count" csvName="conversoes" />
      <p className="ads-note">Nota (§44.8): o valor de conversão do Google é separado da receita comercial confirmada (CRM/ERP), tratada no Funil e na Diretoria.</p>
    </div>
  );
}
