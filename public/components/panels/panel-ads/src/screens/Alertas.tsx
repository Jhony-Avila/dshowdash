// screens/Alertas.tsx — alertas inteligentes (§27).
// @version 2.0.0  @modified 2026-07-22 (Fase 2: donut de severidade)
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { AlertsData, Period } from '../shell/types';
import { PageHeader, Loading, EmptyState } from '../components/ui';
import { EChartCard } from '../components/viz/EChartCard';
import { optDonut } from '../components/viz/echarts-opts';
import { useTokensAds } from '../shell/useShellTheme';
import { dataHora, inteiro } from '../lib/format';

const SEV: Record<string, [string, string]> = {
  critical: ['Crítico', 'ads-pill-danger'], warning: ['Atenção', 'ads-pill-warn'], info: ['Informativo', 'ads-pill-primary'],
};
const SEV_ICON: Record<string, string> = { critical: '🔴', warning: '🟠', info: '🔵' };

export function Alertas({ accountId }: { accountId: number; period: Period }) {
  const pal = useTokensAds();
  const { data, isLoading, isError } = useQuery<AlertsData>({
    queryKey: chaves.alerts(accountId),
    queryFn: ({ signal }) => apiGet<AlertsData>('/alerts', { account_id: accountId }, signal),
  });
  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  const cont = { critical: 0, warning: 0, info: 0 };
  for (const e of data.events) cont[e.severity] = (cont[e.severity] ?? 0) + 1;
  const donut = [
    { name: 'Crítico', value: cont.critical, cor: pal.danger },
    { name: 'Atenção', value: cont.warning, cor: pal.warn },
    { name: 'Informativo', value: cont.info, cor: pal.primary },
  ].filter((d) => d.value > 0);

  return (
    <div className="ads-page">
      <PageHeader title="Alertas" subtitle="Alertas calculados após cada sincronização (a Google Ads API não tem push — o SLA é o intervalo do incremental). Configuráveis por métrica, condição e severidade (§27)." />

      {data.events.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <EChartCard titulo="Alertas por severidade" subtitulo={`${data.events.length} aberto(s)`} altura={220}
            opcao={optDonut(pal, donut, inteiro, { titulo: 'Alertas' })} aria="Alertas por severidade" />
        </div>
      )}

      <div className="ads-recs" style={{ marginBottom: 18 }}>
        {data.events.length === 0 ? <EmptyState icon="✅" title="Nenhum alerta aberto" /> : data.events.map((e) => {
          const [lbl, cls] = SEV[e.severity] ?? ['—', 'ads-pill-dim'];
          return (
            <div key={e.id} className={`ads-rec prio-${e.severity === 'critical' ? 'crítica' : (e.severity === 'warning' ? 'alta' : 'média')}`}>
              <div className="ads-rec-head">
                <span aria-hidden>{SEV_ICON[e.severity]}</span>
                <span className={`ads-pill ${cls}`}>{lbl}</span>
                <span className="ads-rec-tit">{e.title}</span>
                <span className="ads-conf">{dataHora(e.when)}</span>
              </div>
              <p className="ads-rec-problem" style={{ margin: 0 }}>{e.message}</p>
            </div>
          );
        })}
      </div>

      <div className="ads-card" style={{ padding: 0 }}>
        <div className="ads-grid-toolbar"><strong style={{ fontSize: 13.5 }}>Regras de alerta</strong><span className="ads-grid-count">{data.rules.length} regras</span></div>
        <div className="ads-tablescroll">
          <table className="ads-table">
            <thead><tr>
              <th className="col-left">Regra</th><th className="col-left">Métrica</th><th className="col-left">Condição</th>
              <th className="col-left">Janela</th><th className="col-left">Severidade</th><th className="col-left">Canal</th><th className="col-left">Ativa</th>
            </tr></thead>
            <tbody>
              {data.rules.map((r) => {
                const [lbl, cls] = SEV[r.severity] ?? ['—', 'ads-pill-dim'];
                return (
                  <tr key={r.key}>
                    <td className="col-left ads-cell-strong">{r.name}</td>
                    <td className="col-left">{r.metric}</td>
                    <td className="col-left">{r.condition}</td>
                    <td className="col-left ads-cell-sub">{r.window}</td>
                    <td className="col-left"><span className={`ads-pill ${cls}`}>{lbl}</span></td>
                    <td className="col-left ads-cell-sub">{r.channel}</td>
                    <td className="col-left">{r.enabled ? <span className="ads-pill ads-pill-ok">Ativa</span> : <span className="ads-pill ads-pill-dim">Inativa</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
