// screens/KpiStrip.tsx — cards-resumo por entidade (Elevação visual — Fase 3).
// @version 1.0.0  @created 2026-07-24
//
// Lê GET /entity-stats?entity=… (100% base local, zero chamada à API do Pipedrive).
// O backend devolve os tiles já prontos ({chave,rotulo,valor,formato,cor?,dica?}) —
// a tela não decide indicador, só formata; assim persons/orgs/… seguem o mesmo contrato.
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';
import { fmtBRL, fmtNum } from '../lib/format';
import { SkeletonBloco } from './Estados';

export interface PipeKpiTile {
  chave: string;
  rotulo: string;
  valor: number;
  formato: 'num' | 'brl' | 'pct';
  cor?: string;
  dica?: string;
}
interface PipeEntityStats { entity: string; tiles: PipeKpiTile[] }

function formatar(t: PipeKpiTile): string {
  if (t.formato === 'brl') return fmtBRL(t.valor);
  if (t.formato === 'pct') return `${Math.round(t.valor)}%`;
  return fmtNum(t.valor);
}

export function KpiStrip({ entity }: { entity: string }) {
  const { data, isLoading, error } = useQuery<PipeEntityStats>({
    queryKey: ['pipe', 'entity-stats', entity],
    queryFn: ({ signal }) => apiGet<PipeEntityStats>('/entity-stats', { entity }, signal),
    staleTime: 120_000,
  });

  // Falha aqui não pode derrubar o grid: o resumo é acessório, a lista é o essencial.
  if (error) return null;
  if (isLoading) return <div className="pp-kpistrip is-load"><SkeletonBloco linhas={2} altura={18} /></div>;
  const tiles = data?.tiles ?? [];
  if (tiles.length === 0) return null;

  return (
    <div className="pp-kpistrip">
      {tiles.map((t) => (
        <div className="pp-kpi" key={t.chave} title={t.dica ?? undefined}>
          <span className="pp-kpi-n" style={t.cor ? { color: t.cor } : undefined}>{formatar(t)}</span>
          <span className="pp-kpi-l">{t.rotulo}</span>
        </div>
      ))}
    </div>
  );
}
