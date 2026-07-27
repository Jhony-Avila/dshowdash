// screens/Kanban.tsx — quadro read-only de negocios abertos por etapa (funil selecionavel).
// @version 1.0.0  @created 2026-07-21
import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiGet, ApiError } from '../lib/api';
import { fmtBRL, fmtNum } from '../lib/format';
import { DealDrawer } from './DealDrawer';
import { PageHeader } from './PageHeader';
import { EstadoErro, SkeletonBloco } from './Estados';
import { Columns3 } from 'lucide-react';
import type { PipeStatus, PipeKanbanBoard } from '../shell/types';

export function Kanban({ status }: { status?: PipeStatus }) {
  const [pipelineId, setPipelineId] = useState<number | null>(null);
  const [dealAberto, setDealAberto] = useState<number | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useQuery<PipeKanbanBoard>({
    queryKey: ['pipe', 'kanban', pipelineId],
    queryFn: ({ signal }) => apiGet<PipeKanbanBoard>('/kanban', pipelineId ? { pipeline_id: pipelineId } : undefined, signal),
    placeholderData: keepPreviousData,
    enabled: status?.status === 'connected',
    refetchInterval: 120_000,
  });

  if (status?.status !== 'connected') {
    return <div><h1 className="pp-h1">Kanban</h1><div className="pp-card" style={{ maxWidth: 'none' }}><EstadoErro titulo="Integração não conectada" detalhe="Conecte o token do Pipedrive na tela de Configurações para ver estes dados." /></div></div>;
  }

  const cols = data?.columns ?? [];
  const totalAbertos = cols.reduce((a, c) => a + c.count, 0);
  const totalValor = cols.reduce((a, c) => a + c.valor, 0);

  return (
    <div>
      <PageHeader Icon={Columns3} titulo="Kanban" atualizando={isFetching}
        descricao={`Negócios em aberto por etapa${data?.pipeline_name ? ` · ${data.pipeline_name}` : ''}${cols.length ? ` · ${fmtNum(totalAbertos)} negócios · ${fmtBRL(totalValor)}` : ''}`} />

      <div className="pp-filtros">
        <select className="pp-select" value={pipelineId ?? data?.pipeline_id ?? ''} onChange={(e) => setPipelineId(Number(e.target.value))}>
          {(data?.pipelines ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {error instanceof ApiError ? (
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro detalhe={error.ehAuth ? 'Sua sessão expirou. Recarregue a página e entre novamente.' : 'Falha ao consultar a base local.'}
            onRetry={error.ehAuth ? undefined : () => void refetch()} />
        </div>
      ) : isLoading && !data ? (
        <div className="pp-card" style={{ maxWidth: 'none' }}><SkeletonBloco linhas={5} /></div>
      ) : cols.length === 0 ? (
        <div className="pp-card"><p className="pp-placeholder">Nenhuma etapa ativa neste funil.</p></div>
      ) : (
        <div className="pp-kanban">
          {cols.map((c) => (
            <div className="pp-kan-col" key={c.stage_id}>
              <div className="pp-kan-head">
                <div className="t">{c.stage ?? '—'}</div>
                <div className="m">{fmtNum(c.count)} negócios · {fmtBRL(c.valor)}</div>
              </div>
              <div className="pp-kan-body">
                {c.deals.length === 0 ? (
                  <div className="pp-kan-empty">Vazio</div>
                ) : c.deals.map((d) => (
                  <div className="pp-kan-card" key={d.id} onClick={() => setDealAberto(d.id)}>
                    <div className="ct">{d.title ?? '—'}</div>
                    {d.value != null && <div className="cv">{fmtBRL(d.value, d.currency ?? 'BRL')}</div>}
                    <div className="co">{d.org ?? d.owner ?? ''}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {dealAberto != null && <DealDrawer dealId={dealAberto} onClose={() => setDealAberto(null)} />}
    </div>
  );
}
