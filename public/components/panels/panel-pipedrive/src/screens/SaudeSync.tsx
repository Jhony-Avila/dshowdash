// screens/SaudeSync.tsx — painel de saude da sincronizacao (backlog #39).
// @version 1.1.0  @created 2026-07-22  (v1.1: fila morta acionavel — backlog #41)
//
// Observabilidade do que ja roda em producao: estado por entidade (ultima rodada +
// watermark + atraso), fila (pendentes/mortos), erros recentes, uso da API e rodadas.
// Le GET /api/pipedrive/health (base local; nao chama a API do Pipedrive).
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves, ApiError } from '../lib/api';
import { fmtData, fmtNum } from '../lib/format';
import { PageHeader } from './PageHeader';
import { EstadoErro, SkeletonBloco } from './Estados';
import { FilaMorta } from './FilaMorta';
import { Activity } from 'lucide-react';
import type { PipeHealth, PipeHealthEntity } from '../shell/types';

function fmtDesde(min: number | null): string {
  if (min == null) return '—';
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  if (min < 1440) return `${Math.floor(min / 60)} h`;
  return `${Math.floor(min / 1440)} d`;
}

function estado(e: PipeHealthEntity): { cor: string; txt: string } {
  if (e.last_run_errors > 0) return { cor: 'var(--pp-danger)', txt: 'com erros' };
  if (e.stale) return { cor: 'var(--pp-warn)', txt: 'atrasada' };
  if (e.sparse) return { cor: 'var(--pp-text-dim)', txt: 'agendada' };
  return { cor: 'var(--pp-ok)', txt: 'ok' };
}

export function SaudeSync() {
  const { data, isLoading, error, dataUpdatedAt, refetch } = useQuery<PipeHealth>({
    queryKey: chaves.health,
    queryFn: ({ signal }) => apiGet<PipeHealth>('/health', undefined, signal),
    refetchInterval: 30_000,
  });

  const entities = data?.entities ?? [];
  const q = data?.queue?.stats;
  const errs = data?.errors ?? [];
  const runs = data?.runs ?? [];
  const api = data?.api_24h;

  const atrasadas = entities.filter((e) => e.stale).length;
  const comErro = entities.filter((e) => e.last_run_errors > 0).length;
  const saudaveis = entities.filter((e) => e.healthy).length;

  return (
    <div>
      <PageHeader Icon={Activity} titulo="Saúde da sincronização"
        descricao={<>Estado das rotinas que rodam em produção (incremental a cada 15 min · fila 1 min · reconciliação diária · produtos semanal).{data ? <span style={{ color: 'var(--pp-text-dim)' }}> Atualizado {fmtData(new Date(dataUpdatedAt).toISOString())}.</span> : null}</>} />

      {error instanceof ApiError ? (
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro detalhe={error.ehAuth ? 'Sua sessão expirou. Recarregue a página e entre novamente.' : 'Falha ao consultar a base local.'}
            onRetry={error.ehAuth ? undefined : () => void refetch()} />
        </div>
      ) : isLoading ? (
        <div className="pp-card" style={{ maxWidth: 'none' }}><SkeletonBloco linhas={5} /></div>
      ) : (
        <>
          {/* Big numbers */}
          <div className="pp-tiles">
            <Tile n={fmtNum(entities.length)} l="Entidades" />
            <Tile n={fmtNum(saudaveis)} l="Saudáveis" cor="var(--pp-ok)" />
            <Tile n={fmtNum(atrasadas)} l="Atrasadas" cor={atrasadas ? 'var(--pp-warn)' : undefined} />
            <Tile n={fmtNum(comErro)} l="Com erros" cor={comErro ? 'var(--pp-danger)' : undefined} />
            <Tile n={fmtNum(q?.jobs.pending)} l="Fila pendente" cor={q?.jobs.pending ? 'var(--pp-sync)' : undefined} />
            <Tile n={fmtNum(q?.jobs.dead)} l="Fila morta" cor={q?.jobs.dead ? 'var(--pp-danger)' : undefined} />
          </div>

          {/* Estado por entidade */}
          <div className="pp-card" style={{ maxWidth: 820 }}>
            <h3>Estado por entidade</h3>
            {entities.length === 0 ? (
              <p className="pp-placeholder">Nenhuma rodada de sincronização registrada ainda.</p>
            ) : (
              /* Sem o wrapper rolável estas 5 colunas empurravam a página inteira em
                 telas estreitas (medido: 635px de tabela em 388px de área útil). */
              <div className="pp-tabela-rolavel">
              <table className="pp-table">
                <thead>
                  <tr>
                    <th>Entidade</th><th>Estado</th><th className="ta-r">Última rodada</th>
                    <th className="ta-r">Atualizados</th><th className="ta-r">Marca d'água</th>
                  </tr>
                </thead>
                <tbody>
                  {entities.map((e) => {
                    const st = estado(e);
                    return (
                      <tr key={e.entity}>
                        <td className="pp-td-title">{e.entity}</td>
                        <td><span className="pp-badge" style={{ background: 'var(--pp-surface-2)', color: st.cor }}><span className="pp-dot" style={{ background: st.cor }} />{st.txt}</span></td>
                        <td className="ta-r" title={e.last_run_at ?? ''}>{fmtDesde(e.min_since_run)}{e.sparse ? '' : ' atrás'}</td>
                        <td className="ta-r">{fmtNum(e.updated)}</td>
                        <td className="ta-r pp-td-sub" title={e.watermark ?? ''}>{e.watermark ? fmtData(e.watermark) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {/* Fila de ingestão */}
          <div className="pp-card" style={{ maxWidth: 820 }}>
            <h3>Fila de ingestão (webhooks)</h3>
            <div className="pp-tiles" style={{ maxWidth: 'none', marginBottom: q?.jobs.dead ? 12 : 0 }}>
              <Tile n={fmtNum(q?.jobs.pending)} l="Pendentes" cor={q?.jobs.pending ? 'var(--pp-sync)' : undefined} />
              <Tile n={fmtNum(q?.jobs.done)} l="Concluídos" cor="var(--pp-ok)" />
              <Tile n={fmtNum(q?.jobs.dead)} l="Descartados" cor={q?.jobs.dead ? 'var(--pp-danger)' : undefined} />
              <Tile n={fmtNum(q?.webhook_events.total)} l="Eventos recebidos" />
            </div>
            {/* #66: "eventos recebidos" e "jobs concluídos" nunca foram o mesmo número, e a
                tela mostrava os dois lado a lado sem dizer por quê — parecia perda. A causa
                é o coalescing: vários eventos do mesmo alvo colapsam num job só, porque o
                job re-busca o estado ATUAL e um re-fetch já cobre todos eles. */}
            <div className="pp-row">
              <span className="pp-k">Eventos → jobs</span>
              <span className="pp-v" title="Vários eventos do mesmo alvo viram um job só: o re-fetch busca o estado atual e cobre todos.">
                {fmtNum(q?.webhook_jobs)} jobs · {fmtNum(q?.events_coalesced)} agrupados no alvo
              </span>
            </div>
            <div className="pp-row">
              <span className="pp-k">Eventos em aberto</span>
              <span className="pp-v" title="Em aberto = o job do alvo ainda não concluiu. Fecha na próxima drenagem.">
                {fmtNum(q?.webhook_events.received)} · {fmtNum(q?.webhook_events.processed)} fechados
              </span>
            </div>
            <div className="pp-row"><span className="pp-k">Último evento</span><span className="pp-v">{q?.last_event_at ? fmtData(q.last_event_at) : '—'}</span></div>
            <div className="pp-row"><span className="pp-k">Duplicados / erros de evento</span><span className="pp-v">{fmtNum(q?.webhook_events.duplicate)} · {fmtNum(q?.webhook_events.error)}</span></div>
          </div>

          {/* Fila morta + reprocessamento em massa (#41). Antes havia aqui uma tabela
              dos 20 descartes mais recentes, sem acao e sem total — util para notar o
              problema, inutil para resolve-lo. */}
          <FilaMorta jobsDone={q?.jobs.done} />

          {/* Uso da API 24h */}
          {api && (
            <div className="pp-card" style={{ maxWidth: 820 }}>
              <h3>Uso da API — últimas {api.hours}h</h3>
              <div className="pp-tiles" style={{ maxWidth: 'none' }}>
                <Tile n={fmtNum(api.calls)} l="Chamadas" />
                <Tile n={fmtNum(api.errors)} l="Erros" cor={api.errors ? 'var(--pp-danger)' : undefined} />
                <Tile n={fmtNum(api.tokens)} l="Custo (tokens)" />
              </div>
            </div>
          )}

          {/* Erros recentes de sync */}
          <div className="pp-card" style={{ maxWidth: 820 }}>
            <h3>Erros recentes de sincronização</h3>
            {errs.length === 0 ? (
              <p className="pp-placeholder">Nenhum erro de sincronização registrado. 🎉</p>
            ) : (
              <table className="pp-table">
                <thead><tr><th>Quando</th><th>Entidade</th><th>Código</th><th>Mensagem</th></tr></thead>
                <tbody>
                  {errs.map((e, i) => (
                    <tr key={i}><td title={e.created_at ?? ''}>{e.created_at ? fmtData(e.created_at) : '—'}</td><td className="pp-td-title">{e.entity ?? '—'}</td><td>{e.error_code ?? '—'}</td><td className="pp-td-sub" title={e.message ?? ''}>{e.message ?? '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Rodadas recentes */}
          <div className="pp-card" style={{ maxWidth: 820 }}>
            <h3>Rodadas recentes</h3>
            {runs.length === 0 ? (
              <p className="pp-placeholder">Nenhuma rodada registrada.</p>
            ) : (
              /* 7 colunas — a mais larga da tela (643px). Mesmo motivo do wrapper acima. */
              <div className="pp-tabela-rolavel">
              <table className="pp-table">
                <thead>
                  <tr>
                    <th>Quando</th><th>Entidade</th><th>Tipo</th><th>Status</th>
                    <th className="ta-r">Proc.</th><th className="ta-r">Erros</th><th className="ta-r">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r, i) => (
                    <tr key={i}>
                      <td title={r.finished_at ?? ''}>{r.finished_at ? fmtData(r.finished_at) : '—'}</td>
                      <td className="pp-td-title">{r.entity ?? '—'}</td>
                      <td className="pp-td-sub">{r.run_type ?? '—'}</td>
                      <td style={{ color: r.status === 'completed' ? 'var(--pp-ok)' : 'var(--pp-warn)' }}>{r.status ?? '—'}</td>
                      <td className="ta-r">{fmtNum(r.processed)}</td>
                      <td className="ta-r" style={r.errors ? { color: 'var(--pp-danger)' } : undefined}>{fmtNum(r.errors)}</td>
                      <td className="ta-r">{fmtNum(r.token_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Tile({ n, l, cor }: { n: string; l: string; cor?: string }) {
  return (
    <div className="pp-tile">
      <span className="pp-tile-n" style={cor ? { color: cor } : undefined}>{n}</span>
      <span className="pp-tile-l">{l}</span>
    </div>
  );
}
