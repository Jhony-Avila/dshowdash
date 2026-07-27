// components/ui/AtividadeRecente.tsx — executivo: timeline de eventos recentes.
// @version 1.0.0  @created 2026-07-21
// Auto-suficiente. Consolida /alerts + /maintenance numa linha do tempo única
// (mais recente primeiro), 7 itens. Clica → tela de origem do evento.
import type { JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../../lib/api';
import { fmtRelativo } from '../../lib/format';
import { Icone } from './Icone';
import { Skeleton, EmptyState } from './Estados';
import css from './AtividadeRecente.module.css';

interface Alerta { id: number; severity: string; title: string; alert_type: string; status: string; last_seen_at: string | null }
interface DadosA { alerts: Alerta[] }
interface Janela { id: number; target_type: string; target_id: number | null; connection_name: string | null; started_at: string; ended_at: string | null }

type Cor = 'alerta' | 'atencao' | 'ok' | 'info';
interface Evento { id: string; quando: string; icone: string; cor: Cor; titulo: string; sub: string; ir: () => void }

const SEV_COR: Record<string, Cor> = { critico: 'alerta', atencao: 'atencao', informativo: 'info' };

export function AtividadeRecente({ ir }: { ir: (r: { grupo: string; tela: string }) => void }): JSX.Element {
  const qa = useQuery({
    queryKey: [...chaves.alertas, 'recentes'],
    queryFn: ({ signal }) => apiGet<DadosA>('/alerts', { limit: 30 }, signal),
  });
  const qm = useQuery({
    queryKey: ['dt', 'maintenance', 'recentes'],
    queryFn: ({ signal }) => apiGet<Janela[]>('/maintenance', undefined, signal),
  });

  if (qa.isPending || qm.isPending) return <Skeleton linhas={5} altura={34} />;
  if (qa.isError && qm.isError) {
    return <EmptyState icone="Activity" titulo="Atividade indisponível"
                       descricao="Nem alertas nem manutenções responderam agora." />;
  }

  const eventos: Evento[] = [];
  for (const a of qa.data?.alerts ?? []) {
    if (!a.last_seen_at) continue;
    eventos.push({
      id: `a${a.id}`, quando: a.last_seen_at,
      icone: a.status === 'resolved' ? 'CircleCheck' : 'BellRing',
      cor: a.status === 'resolved' ? 'ok' : (SEV_COR[a.severity] ?? 'info'),
      titulo: a.title, sub: a.status === 'resolved' ? 'alerta resolvido' : `alerta · ${a.alert_type}`,
      ir: () => ir({ grupo: 'observability', tela: 'alerts' }),
    });
  }
  for (const j of qm.data ?? []) {
    const quando = j.ended_at ?? j.started_at;
    eventos.push({
      id: `m${j.id}`, quando,
      icone: j.ended_at ? 'CheckCheck' : 'Wrench',
      cor: j.ended_at ? 'ok' : 'atencao',
      titulo: j.connection_name ?? `${j.target_type} #${j.target_id ?? '—'}`,
      sub: j.ended_at ? 'manutenção encerrada' : 'em manutenção',
      ir: () => ir({ grupo: 'observability', tela: 'maintenance' }),
    });
  }

  const ordenados = eventos
    .filter((e) => e.quando)
    .sort((a, b) => (a.quando < b.quando ? 1 : a.quando > b.quando ? -1 : 0))
    .slice(0, 7);

  if (ordenados.length === 0) {
    return <EmptyState icone="Inbox" titulo="Sem atividade recente"
                       descricao="Nenhum alerta ou manutenção registrado no período." />;
  }

  return (
    <ul className={css.linha}>
      {ordenados.map((e) => (
        <li key={e.id} className={css.evento} onClick={e.ir}>
          <span className={`${css.marcador} ${css[e.cor]}`}><Icone nome={e.icone} size={13} /></span>
          <span className={css.texto}>
            <span className={css.titulo}>{e.titulo}</span>
            <span className={css.sub}>{e.sub}</span>
          </span>
          <span className={css.quando}>{fmtRelativo(e.quando)}</span>
        </li>
      ))}
    </ul>
  );
}
