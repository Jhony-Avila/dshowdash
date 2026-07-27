// screens/Recomendacoes.tsx — Inteligência Artificial (§26).
// @version 2.0.0  @modified 2026-07-22 (Fase 2: grafo de relações D3)
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { Recommendation, Period } from '../shell/types';
import { PageHeader, Loading, EmptyState } from '../components/ui';
import { ChartCard } from '../components/viz/ChartCard';
import { GrafoForca, type NoGrafo, type ArestaGrafo } from '../components/viz/d3/GrafoForca';
import { pct } from '../lib/format';

function grafoDeRecs(items: Recommendation[]): { nos: NoGrafo[]; arestas: ArestaGrafo[] } {
  const nos = new Map<string, NoGrafo>();
  const arestas: ArestaGrafo[] = [];
  for (const r of items) {
    const idR = `r:${r.id}`;
    // grupo 0 = IA, 1 = Google (recomendações); grupo 2 = entidade afetada
    nos.set(idR, { id: idR, nome: r.title.length > 26 ? r.title.slice(0, 25) + '…' : r.title, grupo: r.source === 'ai' ? 0 : 1, valor: Math.max(1, r.affected.length) });
    for (const a of r.affected) {
      const idA = `a:${a}`;
      if (!nos.has(idA)) nos.set(idA, { id: idA, nome: a, grupo: 2, valor: 1 });
      else nos.get(idA)!.valor = (nos.get(idA)!.valor ?? 1) + 1;
      arestas.push({ origem: idR, destino: idA });
    }
  }
  return { nos: [...nos.values()], arestas };
}

const PRIO_PILL: Record<string, string> = {
  'crítica': 'ads-pill-danger', 'alta': 'ads-pill-warn', 'média': 'ads-pill-primary', 'baixa': 'ads-pill-dim',
};

function impactoLabel(k: string): string {
  const map: Record<string, string> = {
    economia_mensal_estimada: 'Economia mensal estimada',
    conversoes_adicionais_estimadas: 'Conversões adicionais estimadas',
    impression_share_perdido: 'Impression share perdido (%)',
    ctr_estimado_ganho_pct: 'Ganho estimado de CTR (%)',
    cpa_reducao_estimada_pct: 'Redução estimada de CPA (%)',
  };
  return map[k] ?? k;
}
function impactoValor(k: string, v: number): string {
  if (k === 'economia_mensal_estimada') return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (k.endsWith('_pct') || k.includes('perdido')) return v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

export function Recomendacoes({ accountId }: { accountId: number; period: Period }) {
  const { data, isLoading, isError } = useQuery<{ items: Recommendation[] }>({
    queryKey: chaves.recommendations(accountId),
    queryFn: ({ signal }) => apiGet<{ items: Recommendation[] }>('/recommendations', { account_id: accountId }, signal),
  });
  const { nos, arestas } = useMemo(() => grafoDeRecs(data?.items ?? []), [data]);

  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;
  if (data.items.length === 0) return <div className="ads-page"><EmptyState icon="🤖" title="Nenhuma recomendação" desc="Sem oportunidades detectadas neste momento." /></div>;

  return (
    <div className="ads-page">
      <PageHeader title="Inteligência Artificial"
        subtitle="Recomendações priorizadas e explicáveis — nativas do Google e geradas pela IA. Nenhuma é aplicada automaticamente: tudo passa por sua revisão e aprovação (§26.4)." />

      <div style={{ marginBottom: 14 }}>
        <ChartCard titulo="Mapa de relações" subtitulo="recomendações (IA/Google) ↔ campanhas afetadas · arraste, dê zoom, passe o mouse" altura={320}>
          <GrafoForca nos={nos} arestas={arestas} altura={300} />
        </ChartCard>
      </div>

      <div className="ads-recs">
        {data.items.map((r) => (
          <div key={r.id} className={`ads-rec prio-${r.priority}`}>
            <div className="ads-rec-head">
              <span className={`ads-rec-src ${r.source}`}>{r.source === 'ai' ? '🤖 IA' : '🔷 Google'}</span>
              <span className={`ads-pill ${PRIO_PILL[r.priority] ?? 'ads-pill-dim'}`}>{r.priority}</span>
              <span className="ads-rec-tit">{r.title}</span>
              <span className="ads-conf">Confiança: {pct(r.confidence, 0)}</span>
            </div>
            <p className="ads-rec-problem">{r.problem}</p>
            <div className="ads-rec-detail">
              <div>
                <div className="ads-rec-detail-lbl">Impacto estimado</div>
                {Object.entries(r.impact).map(([k, v]) => (
                  <div key={k}><span className="ads-rec-impact">{impactoValor(k, v)}</span> — {impactoLabel(k)}</div>
                ))}
              </div>
              <div>
                <div className="ads-rec-detail-lbl">Ação recomendada</div>
                <div>{r.recommended_action}</div>
              </div>
              <div>
                <div className="ads-rec-detail-lbl">Riscos</div>
                <div>{r.risks}</div>
              </div>
            </div>
            <div className="ads-rec-affected">
              <span className="ads-rec-detail-lbl" style={{ alignSelf: 'center', margin: 0 }}>Campanhas afetadas:</span>
              {r.affected.map((a) => <span key={a} className="ads-pill ads-pill-dim">{a}</span>)}
            </div>
            <div className="ads-rec-acts">
              <button className="ads-btn ads-btn-primary ads-btn-sm" disabled title="A aplicação de alterações entra na Fase 3 (operação), sempre com preview + confirmação.">Aplicar</button>
              <button className="ads-btn ads-btn-sm" disabled>Dispensar</button>
              <span className="ads-cell-sub">Requer aprovação · preview com <code>validate_only</code> antes de publicar (Fase 3).</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
