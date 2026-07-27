// app/routes/drawers/AlertaDrawer.tsx — detalhe do alerta em DRAWER (§28).
// @version 1.0.0  @created 2026-07-21
// Abre ao clicar numa linha de Alertas. Resumo, alvo, mensagem, AÇÕES
// (reconhecer/resolver) e — o que a lista só contabiliza — a LINHA DO TEMPO
// de ocorrências individuais (DT_Alerta_Ocorrencia).
// Reusa TabelaDrawer.module.css (resumo/tags/ev*/comentario), como os demais
// drawers do módulo; CSS próprio só para as ações e a hora da ocorrência.
import { type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, ApiError } from '../../../lib/api';
import { fmtData, fmtRelativo, fmtDuracao, fmtInt } from '../../../lib/format';
import { Drawer, DrawerSecao } from '../../../components/ui/Drawer';
import { Badge } from '../../../components/ui/Badge';
import { Icone } from '../../../components/ui/Icone';
import { Skeleton, ErrorState, EmptyState } from '../../../components/ui/Estados';
import type { Alerta } from '../Alertas';
import css from './TabelaDrawer.module.css';
import own from './AlertaDrawer.module.css';

interface Ocorrencia { id: number; occurred_at: string; detail: string | null }
interface Detalhe { alert: Alerta; occurrences: Ocorrencia[] }

const SEV: Record<string, { tom: 'alerta' | 'atencao' | 'neutro'; icone: string }> = {
  critico: { tom: 'alerta', icone: 'CircleX' },
  atencao: { tom: 'atencao', icone: 'TriangleAlert' },
  informativo: { tom: 'neutro', icone: 'CircleHelp' },
};
const ST: Record<string, { rotulo: string; tom: 'alerta' | 'atencao' | 'ok' | 'neutro'; icone: string }> = {
  active: { rotulo: 'ativo', tom: 'alerta', icone: 'BellRing' },
  acknowledged: { rotulo: 'reconhecido', tom: 'atencao', icone: 'Eye' },
  resolved: { rotulo: 'resolvido', tom: 'ok', icone: 'CircleCheck' },
};

export function AlertaDrawer({ alerta, aoFechar, aoAcao, acaoPendente }: {
  alerta: Alerta | null;
  aoFechar: () => void;
  aoAcao: (id: number, tipo: 'acknowledge' | 'resolve') => void;
  acaoPendente: boolean;
}): JSX.Element {
  const id = alerta?.id ?? null;
  const q = useQuery({
    queryKey: ['dt', 'alert', id],
    queryFn: ({ signal }) => apiGet<Detalhe>(`/alerts/${id}`, undefined, signal),
    enabled: id !== null,
  });

  // A linha (`alerta`) dá o resumo instantâneo; o fetch traz status fresco +
  // ocorrências. Preferimos o alerta do backend quando já chegou.
  const a = q.data?.alert ?? alerta;
  const sev = a ? (SEV[a.severity] ?? SEV.informativo) : SEV.informativo;
  const st = a ? (ST[a.status] ?? ST.active) : ST.active;

  return (
    <Drawer aberto={id !== null} aoFechar={aoFechar}
      titulo={a?.title ?? 'Alerta'}
      subtitulo={a ? `${a.alert_type} · ${a.connection_name ?? a.target_type}` : undefined}
      icone={sev.icone} largura={560}>
      {!a ? <Skeleton linhas={6} altura={22} />
        : (
          <>
            <div className={css.resumo}>
              <Resumo icone="ShieldAlert" rotulo="Severidade" valor={a.severity} />
              <Resumo icone="Hash" rotulo="Ocorrências" valor={fmtInt(a.occurrences)} />
              <Resumo icone="Clock" rotulo="Primeiro" valor={fmtRelativo(a.first_seen_at)} />
              <Resumo icone="Timer" rotulo="Idade" valor={fmtDuracao(a.age_sec)} />
            </div>

            <div className={css.tags}>
              <Badge texto={st.rotulo} tom={st.tom} icone={st.icone} />
              <Badge texto={a.severity} tom={sev.tom} icone={sev.icone} />
              {a.environment_label && <Badge texto={a.environment_label} tom="info" icone="Network" />}
              <Badge texto={a.target_type} fraco icone="Crosshair" />
              {a.acknowledged_by && <Badge texto={`por ${a.acknowledged_by}`} fraco icone="Eye" />}
              <span className={css.alterada}><Icone nome="Clock" size={11} /> visto {fmtRelativo(a.last_seen_at)}</span>
            </div>

            {a.message && <p className={css.comentario}>{a.message}</p>}

            {a.status !== 'resolved' && (
              <div className={own.acoes}>
                {a.status === 'active' && (
                  <button type="button" className={own.btn} disabled={acaoPendente}
                    onClick={() => aoAcao(a.id, 'acknowledge')}>
                    <Icone nome="Eye" size={13} /> Reconhecer
                  </button>
                )}
                <button type="button" className={`${own.btn} ${own.btnOk}`} disabled={acaoPendente}
                  onClick={() => aoAcao(a.id, 'resolve')}>
                  <Icone nome="Check" size={13} /> Resolver
                </button>
              </div>
            )}

            <DrawerSecao titulo="Linha do tempo" icone="History"
              contagem={q.data?.occurrences.length}>
              {q.isPending ? <Skeleton linhas={3} altura={40} />
                : q.isError ? <ErrorState mensagem="Não foi possível carregar o histórico." codigo={(q.error as ApiError).code} onRetry={() => q.refetch()} />
                : !q.data || q.data.occurrences.length === 0
                  ? <EmptyState icone="History" titulo="Sem ocorrências registradas"
                      descricao="Este alerta não tem eventos individuais no histórico — apenas o registro consolidado acima." />
                  : (
                    <div className={css.evGrupos}>
                      {q.data.occurrences.map((o) => (
                        <div key={o.id} className={css.evItem}>
                          <span className={css.evDetalhe}>{o.detail ?? 'Recorrência registrada'}</span>
                          <span className={css.evMeta}>
                            <span className={own.hora}><Icone nome="Clock" size={11} /> {fmtData(o.occurred_at)}</span>
                            <span className={css.discreto}>{fmtRelativo(o.occurred_at)}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
            </DrawerSecao>
          </>
        )}
    </Drawer>
  );
}

function Resumo({ icone, rotulo, valor }: { icone: string; rotulo: string; valor: string }): JSX.Element {
  return (
    <div className={css.resumoItem}>
      <span className={css.resumoIcone}><Icone nome={icone} size={16} /></span>
      <span className={css.resumoValor}>{valor}</span>
      <span className={css.resumoRotulo}>{rotulo}</span>
    </div>
  );
}
