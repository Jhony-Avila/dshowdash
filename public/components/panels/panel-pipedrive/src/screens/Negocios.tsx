// screens/Negocios.tsx — DataGrid de negocios sobre EntityGrid (colunas selecionaveis) + drawer.
// @version 2.1.0  @created 2026-07-21
//
// v2.1.0 (#30): coluna e filtro por MOTIVO DA PERDA — é o destino do drill-down da tela
//   de Perdas (#/panel-pipedrive/negocios?status=lost&lost_reason=…). O motivo só existe
//   em negócio perdido; nos demais a célula fica em travessão, não em branco.
import { useState } from 'react';
import { BriefcaseBusiness } from 'lucide-react';
import { EntityGrid, type GridColuna } from './EntityGrid';
import { DealDrawer } from './DealDrawer';
import { fmtBRL, fmtData } from '../lib/format';
import type { PipeStatus, PipeDealRow } from '../shell/types';

const ROTULO_STATUS: Record<string, string> = { open: 'Aberto', won: 'Ganho', lost: 'Perdido', deleted: 'Excluído' };
function corStatus(s?: string | null): string {
  if (s === 'won') return 'var(--pp-ok)';
  if (s === 'lost' || s === 'deleted') return 'var(--pp-danger)';
  return 'var(--pp-sync)';
}
const dashOr = (v: unknown): string => (v == null || v === '' ? '—' : String(v));

const COLS: GridColuna<PipeDealRow>[] = [
  { key: 'title', label: 'Negócio', sortavel: true, fixa: true, width: 280, render: (d) => (
    <><div className="pp-td-title" title={d.title ?? ''}>{d.title ?? '—'}</div>{d.org && <div className="pp-td-sub">{d.org}</div>}</>
  ), csv: (d) => d.org ? `${d.title ?? ''} (${d.org})` : (d.title ?? '') },
  { key: 'person', label: 'Contato', sortavel: true, render: (d) => dashOr(d.person) },
  // total: soma da PÁGINA (o rodapé diz "Σ nesta página"); formatada em BRL — a base é BRL.
  { key: 'value', label: 'Valor', sortavel: true, align: 'right', total: 'soma',
    valor: (d) => (d.value != null ? Number(d.value) : null), fmtTotal: (n) => fmtBRL(n),
    render: (d) => <span style={{ fontWeight: 600 }}>{d.value != null ? fmtBRL(d.value, d.currency ?? 'BRL') : '—'}</span> },
  { key: 'stage', label: 'Etapa', sortavel: true, render: (d) => dashOr(d.stage) },
  { key: 'probability', label: 'Prob.', sortavel: true, align: 'right', render: (d) => (d.probability != null ? `${d.probability}%` : '—') },
  { key: 'expected_close_date', label: 'Fechamento', sortavel: true, render: (d) => (d.expected_close_date ? fmtData(d.expected_close_date).slice(0, 10) : '—') },
  { key: 'add_time', label: 'Criado', sortavel: true, render: (d) => fmtData(d.add_time) },
  { key: 'owner', label: 'Dono', render: (d) => dashOr(d.owner) },
  { key: 'lost_reason', label: 'Motivo da perda', width: 170,
    render: (d) => (d.status === 'lost' ? dashOr(d.lost_reason) : '—'),
    csv: (d) => (d.status === 'lost' ? (d.lost_reason ?? '') : '') },
  { key: 'status', label: 'Status', sortavel: true, render: (d) => (
    <span className="pp-badge" style={{ background: 'var(--pp-surface-2)' }}>
      <span className="pp-dot" style={{ background: corStatus(d.status) }} />
      {ROTULO_STATUS[d.status ?? ''] ?? d.status ?? '—'}
    </span>
  ), csv: (d) => ROTULO_STATUS[d.status ?? ''] ?? d.status ?? '' },
];

export function Negocios({ status, filtrosIniciais }: { status?: PipeStatus; filtrosIniciais?: Record<string, string> }) {
  const [dealAberto, setDealAberto] = useState<number | null>(null);
  return (
    <>
      <EntityGrid<PipeDealRow>
        titulo="Negócios" Icon={BriefcaseBusiness} entidadePlural="negócios" endpoint="/deals" cfEntity="deal"
        colunas={COLS} sortInicial="update_time" buscaPlaceholder="Buscar por título…"
        status={status} onRowClick={(d) => setDealAberto(d.id)} filtrosIniciais={filtrosIniciais}
        filtros={[
          { key: 'status', label: 'Status', tipo: 'multi', options: [{ value: 'open', label: 'Abertos' }, { value: 'won', label: 'Ganhos' }, { value: 'lost', label: 'Perdidos' }] },
          { key: 'stage_id', label: 'Etapas', tipo: 'multi', facetKey: 'stages' },
          { key: 'owner_id', label: 'Donos', tipo: 'multi', facetKey: 'owners' },
          { key: 'lost_reason', label: 'Motivo da perda', tipo: 'multi', facetKey: 'lost_reasons' },
          { key: 'value', label: 'Faixa de valor (R$)', tipo: 'numRange' },
          { key: 'close', label: 'Fechamento previsto', tipo: 'dateRange' },
          { key: 'created', label: 'Data de criação', tipo: 'dateRange' },
        ]}
      />
      {dealAberto != null && <DealDrawer dealId={dealAberto} onClose={() => setDealAberto(null)} />}
    </>
  );
}
