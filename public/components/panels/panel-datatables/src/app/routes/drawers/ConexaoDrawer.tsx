// app/routes/drawers/ConexaoDrawer.tsx — detalhe da conexão em DRAWER (§12/§19).
// @version 1.0.0  @created 2026-07-21
// Abre ao clicar numa linha de Conexões. GET /connections/{id}/health:
// dados da conexão + status atual (latência, disponibilidade) + indisponibilidade 30d.
import { type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, ApiError } from '../../../lib/api';
import { fmtInt, fmtRelativo } from '../../../lib/format';
import { Drawer, DrawerSecao } from '../../../components/ui/Drawer';
import { Badge } from '../../../components/ui/Badge';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Icone } from '../../../components/ui/Icone';
import { Skeleton, ErrorState } from '../../../components/ui/Estados';
import css from './TabelaDrawer.module.css';

interface Conn {
  id: number; name: string; source_type: string; host: string; port: number;
  db_name: string | null; username: string | null; status: string; ssl_enabled: number;
  classification: string | null; last_check_at: string | null; last_success_at: string | null; last_error: string | null;
}
interface Status {
  status: string; latency_ms: number | null; since: string | null; checked_at: string | null;
  step_failed: string | null; last_error: string | null; consecutive_fail: number; flap_count_1h: number;
  availability?: Record<string, number>;
}
interface Outages { failures: number; total_sec: number; longest_sec: number; ongoing: boolean }
interface Health { connection: Conn; status: Status | null; outages_30d: Outages }

function fmtDur(sec: number): string {
  if (!sec) return '—';
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}min`;
  return `${(sec / 3600).toFixed(1)}h`;
}

export function ConexaoDrawer({ id, aoFechar }: { id: number | null; aoFechar: () => void }): JSX.Element {
  const q = useQuery({
    queryKey: ['dt', 'conn-health', id],
    queryFn: ({ signal }) => apiGet<Health>(`/connections/${id}/health`, undefined, signal),
    enabled: id !== null,
  });
  const d = q.data;
  const c = d?.connection;
  const s = d?.status;
  const disp30 = s?.availability?.['30d'];

  return (
    <Drawer aberto={id !== null} aoFechar={aoFechar}
      titulo={c?.name ?? 'Conexão'} subtitulo={c ? `${c.source_type} · ${c.host}:${c.port}` : undefined}
      icone="PlugZap" acoes={c ? <StatusBadge status={c.status} /> : undefined} largura={580}>
      {q.isPending ? <Skeleton linhas={8} altura={22} />
        : q.isError ? <ErrorState mensagem="Não foi possível carregar o detalhe da conexão." codigo={(q.error as ApiError).code} onRetry={() => q.refetch()} />
        : d && c ? (
          <>
            <div className={css.resumo}>
              <Resumo icone="Timer" rotulo="Latência" valor={s?.latency_ms != null ? `${s.latency_ms}ms` : '—'} />
              <Resumo icone="Activity" rotulo="Disp. 30d" valor={disp30 != null ? `${disp30}%` : '—'} />
              <Resumo icone="TriangleAlert" rotulo="Falhas 30d" valor={fmtInt(d.outages_30d.failures)} />
              <Resumo icone="Zap" rotulo="Flaps 1h" valor={fmtInt(s?.flap_count_1h ?? 0)} />
            </div>
            <div className={css.tags}>
              <Badge texto={c.source_type} fraco />
              {c.db_name && <Badge texto={c.db_name} fraco icone="Database" />}
              {!!c.ssl_enabled && <Badge texto="SSL" tom="ok" fraco icone="ShieldCheck" />}
              {c.classification && <Badge texto={c.classification} tom="info" fraco />}
              {c.username && <span className={css.alterada}><Icone nome="AtSign" size={11} /> {c.username}</span>}
            </div>
            {c.last_error && <p className={css.comentario}>{c.last_error}</p>}

            <DrawerSecao titulo="Status atual" icone="Activity">
              <div className={css.lista}>
                <div className={css.linha}><span className={css.discreto}>Situação</span><StatusBadge status={s?.status ?? c.status} compacto /><span className={css.discreto}>desde {fmtRelativo(s?.since ?? null)}</span></div>
                <div className={css.linha}><span className={css.discreto}>Última verificação</span><span className={css.mono}>{fmtRelativo(s?.checked_at ?? c.last_check_at)}</span></div>
                <div className={css.linha}><span className={css.discreto}>Último sucesso</span><span className={css.mono}>{fmtRelativo(c.last_success_at)}</span></div>
                {s?.step_failed && <div className={css.linha}><span className={css.discreto}>Falhou em</span><Badge texto={s.step_failed} tom="atencao" /></div>}
                {(s?.consecutive_fail ?? 0) > 0 && <div className={css.linha}><span className={css.discreto}>Falhas seguidas</span><Badge texto={fmtInt(s!.consecutive_fail)} tom="alerta" /></div>}
              </div>
            </DrawerSecao>

            <DrawerSecao titulo="Indisponibilidade (30 dias)" icone="TriangleAlert">
              <div className={css.resumo}>
                <Resumo icone="TriangleAlert" rotulo="Ocorrências" valor={fmtInt(d.outages_30d.failures)} />
                <Resumo icone="Clock" rotulo="Tempo total" valor={fmtDur(d.outages_30d.total_sec)} />
                <Resumo icone="Timer" rotulo="Maior queda" valor={fmtDur(d.outages_30d.longest_sec)} />
                <Resumo icone="Activity" rotulo="Em curso" valor={d.outages_30d.ongoing ? 'sim' : 'não'} />
              </div>
            </DrawerSecao>
          </>
        ) : null}
    </Drawer>
  );
}

function Resumo({ icone, rotulo, valor }: { icone: string; rotulo: string; valor: string }): JSX.Element {
  return (
    <div className={css.resumoItem}>
      <span className={css.resumoIcone}><Icone nome={icone} size={14} /></span>
      <span className={css.resumoValor}>{valor}</span>
      <span className={css.resumoRotulo}>{rotulo}</span>
    </div>
  );
}
