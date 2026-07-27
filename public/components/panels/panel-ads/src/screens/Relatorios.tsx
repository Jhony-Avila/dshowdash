// screens/Relatorios.tsx — modelos de relatório (§28).
// @version 1.0.0  @created 2026-07-21
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { ReportModel, Period } from '../shell/types';
import { PageHeader, Loading, EmptyState } from '../components/ui';

const FMT: Record<string, string> = { pdf: 'PDF', xlsx: 'Excel', csv: 'CSV', pptx: 'PowerPoint' };

export function Relatorios(_props: { accountId: number; period: Period }) {
  const { data, isLoading, isError } = useQuery<{ items: ReportModel[] }>({
    queryKey: chaves.reports,
    queryFn: ({ signal }) => apiGet<{ items: ReportModel[] }>('/reports', undefined, signal),
  });
  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  return (
    <div className="ads-page">
      <PageHeader title="Relatórios" subtitle="Modelos prontos para exportar e compartilhar. A geração, agendamento e envio por e-mail entram na Fase 4 (§28)." />
      <div className="ads-acc-grid">
        {data.items.map((r) => (
          <div key={r.key} className="ads-acc-card">
            <div className="ads-acc-name" style={{ marginBottom: 4 }}>📑 {r.name}</div>
            <p className="ads-cell-sub" style={{ margin: '0 0 12px', lineHeight: 1.45 }}>{r.description}</p>
            <div className="ads-rec-affected" style={{ marginTop: 0, marginBottom: 12 }}>
              {r.formats.map((f) => <span key={f} className="ads-pill ads-pill-dim">{FMT[f] ?? f}</span>)}
            </div>
            <div className="ads-acc-acts">
              <button className="ads-btn ads-btn-sm ads-btn-primary" disabled title="Geração de relatório entra na Fase 4">Gerar</button>
              <button className="ads-btn ads-btn-sm" disabled title="Agendamento entra na Fase 4">Agendar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
