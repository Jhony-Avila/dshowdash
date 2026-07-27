// screens/Historico.tsx — histórico de alterações e auditoria (§34).
// @version 2.0.0  @modified 2026-07-24 (Fase 2: donut de origens + linha do tempo empilhada + filtro cruzado)
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { HistoryEntry, Period } from '../shell/types';
import { PageHeader, Loading, EmptyState } from '../components/ui';
import { DataGrid, type Column } from '../components/DataGrid';
import { EChartCard } from '../components/viz/EChartCard';
import { optDonut, optColunasEmpilhadas, type Serie } from '../components/viz/echarts-opts';
import { useTokensAds, type PaletaAds } from '../shell/useShellTheme';
import { dataHora, inteiro } from '../lib/format';

// origem → [rótulo, classe do pill, chave de cor na paleta]
const ORIGIN: Record<string, [string, string, keyof PaletaAds]> = {
  manual: ['Manual', 'ads-pill-dim', 'primary'],
  ai_suggestion: ['IA (aprovada)', 'ads-pill-purple', 'purple'],
  bulk: ['Em lote', 'ads-pill-primary', 'cyan'],
  automation: ['Automação', 'ads-pill-primary', 'ok'],
  import: ['Importação', 'ads-pill-dim', 'pink'],
  external_detected: ['Externa detectada', 'ads-pill-warn', 'warn'],
};
// ordem estável de exibição (legenda/donut) para cores consistentes entre os gráficos
const ORDEM: string[] = ['manual', 'ai_suggestion', 'bulk', 'automation', 'external_detected', 'import'];

const cols: Column<HistoryEntry>[] = [
  { key: 'when', header: 'Data/hora', align: 'left', sortValue: (r) => r.when, csv: (r) => r.when, render: (r) => dataHora(r.when) },
  { key: 'user', header: 'Usuário', align: 'left', sortValue: (r) => r.user, csv: (r) => r.user, render: (r) => r.user },
  { key: 'action', header: 'Ação', align: 'left', sortValue: (r) => r.action, csv: (r) => r.action,
    render: (r) => <span className="ads-cell-strong">{r.action}</span> },
  { key: 'object', header: 'Objeto', align: 'left', sortValue: (r) => r.object, csv: (r) => r.object,
    render: (r) => <span className="ads-cell-name" title={r.object}>{r.object}</span> },
  { key: 'change', header: 'Alteração', align: 'left', sortValue: (r) => r.new_value, csv: (r) => `${r.old_value} -> ${r.new_value}`,
    render: (r) => <span className="ads-cell-sub">{r.old_value} → <span className="ads-cell-strong">{r.new_value}</span></span> },
  { key: 'origin', header: 'Origem', align: 'left', sortValue: (r) => r.origin,
    render: (r) => { const [l, c] = ORIGIN[r.origin] ?? ['—', 'ads-pill-dim', 'primary']; return <span className={`ads-pill ${c}`}>{l}</span>; } },
];

// 'YYYY-MM-DDTHH:MM:SS...' → 'YYYY-MM-DD' (sem passar por Date, evita drift de fuso)
const diaDe = (iso: string) => iso.slice(0, 10);
const rotuloDia = (ymd: string) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`;

export function Historico({ accountId }: { accountId: number; period: Period }) {
  const pal = useTokensAds();
  const [origem, setOrigem] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{ items: HistoryEntry[] }>({
    queryKey: chaves.history(accountId),
    queryFn: ({ signal }) => apiGet<{ items: HistoryEntry[] }>('/history', { account_id: accountId }, signal),
  });

  const items = data?.items ?? [];

  // agregações para donut (por origem) e linha do tempo (por dia × origem)
  const { donut, labelParaOrigem, dias, series } = useMemo(() => {
    const porOrigem = new Map<string, number>();
    const porDia = new Map<string, Map<string, number>>();
    for (const r of items) {
      porOrigem.set(r.origin, (porOrigem.get(r.origin) ?? 0) + 1);
      const d = diaDe(r.when);
      const m = porDia.get(d) ?? new Map<string, number>();
      m.set(r.origin, (m.get(r.origin) ?? 0) + 1);
      porDia.set(d, m);
    }
    const presentes = ORDEM.filter((o) => (porOrigem.get(o) ?? 0) > 0);
    const donut = presentes.map((o) => ({ name: ORIGIN[o][0], value: porOrigem.get(o) ?? 0, cor: pal[ORIGIN[o][2]] as string }));
    const labelParaOrigem = new Map(presentes.map((o) => [ORIGIN[o][0], o]));

    // últimos 14 dias com alterações, em ordem crescente
    const dias = [...porDia.keys()].sort().slice(-14);
    const series: Serie[] = presentes.map((o) => ({
      name: ORIGIN[o][0], cor: pal[ORIGIN[o][2]] as string,
      data: dias.map((d) => porDia.get(d)?.get(o) ?? 0),
    }));
    return { donut, labelParaOrigem, dias, series };
  }, [items, pal]);

  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  const rows = origem ? items.filter((r) => r.origin === origem) : items;
  const rotuloOrigem = origem ? ORIGIN[origem]?.[0] ?? origem : '';
  const alternarOrigem = (label?: string) => {
    const o = label ? labelParaOrigem.get(label) ?? null : null;
    setOrigem((atual) => (atual === o ? null : o));
  };

  return (
    <div className="ads-page">
      <PageHeader title="Histórico de alterações" subtitle="Trilha de auditoria: quem alterou o quê, quando, valor anterior e novo, e a origem (manual, IA, lote, automação ou alteração externa detectada) (§34)." />

      {items.length > 0 && (
        <div className="ads-grid2" style={{ marginBottom: 14 }}>
          <EChartCard
            titulo="Alterações por dia"
            subtitulo={`empilhado por origem · últimos ${dias.length} dia(s) com atividade`}
            altura={280}
            opcao={optColunasEmpilhadas(pal, dias.map(rotuloDia), series, inteiro)}
            eventos={{ click: (params) => alternarOrigem((params as { seriesName?: string }).seriesName) }}
            aria="Alterações por dia, empilhadas por origem"
          />
          <EChartCard
            titulo="Distribuição por origem"
            subtitulo={origem ? `filtrando: ${rotuloOrigem} — clique para limpar` : 'clique numa fatia para filtrar a tabela'}
            altura={280}
            opcao={optDonut(pal, donut, inteiro, { titulo: 'Alterações' })}
            eventos={{ click: (params) => alternarOrigem((params as { name?: string }).name) }}
            aria="Distribuição de alterações por origem"
          />
        </div>
      )}

      <DataGrid rows={rows} columns={cols} rowKey={(r) => r.id}
        searchText={(r) => `${r.user} ${r.action} ${r.object} ${r.origin}`} initialSortKey="when" csvName="historico"
        toolbarExtra={origem ? (
          <button type="button" onClick={() => setOrigem(null)}
            style={{ border: `1px solid ${pal.primary}`, background: 'transparent', color: pal.primary, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
            Origem: {rotuloOrigem} ✕
          </button>
        ) : undefined} />
      <p className="ads-note">Na Fase 3, cada alteração real (pausar, orçamento, negativas) grava aqui com preview via <code>validate_only</code> e permite rollback (§34.2).</p>
    </div>
  );
}
