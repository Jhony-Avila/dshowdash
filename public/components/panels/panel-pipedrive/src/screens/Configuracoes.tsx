// screens/Configuracoes.tsx — credencial dinamica: colar/testar/salvar/desconectar.
// @version 1.2.0  @created 2026-07-21
//
// O token e enviado SO no corpo do POST (HTTPS), nunca vai na URL nem e devolvido
// pela API (o backend guarda cifrado e expoe apenas os ultimos 4). Toda escrita
// passa por CSRF (lib/api).
//
// v1.1.0 (endurecimento): confirmacao antes de substituir credencial conectada;
// botao Desconectar (POST /auth/disconnect); data em pt-BR; Salvar travado quando
// a chave de criptografia nao esta pronta; mensagens de rede/permissao.
// v1.2.0: card "Webhooks & fila" (receptor/registrar/drenar/reenfileirar) + botao
// "Reconciliar exclusoes" (POST /reconcile deleted-scan — backstop dos webhooks).
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite, chaves, ApiError } from '../lib/api';
import { PageHeader } from './PageHeader';
import { Settings2 } from 'lucide-react';
import { fmtData } from '../lib/format';
import type {
  PipeStatus, PipeCompany, PipeWebhooksData, PipeQueueData, PipeDrainResult,
} from '../shell/types';

interface ValidateResp { ok: boolean; company?: PipeCompany; meta?: Record<string, number | null>; }

const ROTULO_STATUS: Record<string, string> = {
  not_configured: 'Não configurado',
  connected: 'Conectado',
  invalid: 'Credencial inválida',
  expired: 'Autenticação expirada',
  insufficient_scope: 'Permissão insuficiente',
  testing: 'Em teste',
  error: 'Erro',
};

function corStatus(s?: string): string {
  if (s === 'connected') return 'var(--pp-ok)';
  if (s === 'testing') return 'var(--pp-sync)';
  if (!s || s === 'not_configured') return 'var(--pp-text-dim)';
  return 'var(--pp-danger)';
}

type Busy = '' | 'validate' | 'connect' | 'disconnect';
type Confirmar = '' | 'replace' | 'disconnect';

export function Configuracoes() {
  const qc = useQueryClient();
  const { data: status, isLoading } = useQuery<PipeStatus>({
    queryKey: chaves.status,
    queryFn: ({ signal }) => apiGet<PipeStatus>('/status', undefined, signal),
  });

  const [token, setToken] = useState('');
  const [busy, setBusy] = useState<Busy>('');
  const [confirmar, setConfirmar] = useState<Confirmar>('');
  const [preview, setPreview] = useState<PipeCompany | null>(null);
  const [meta, setMeta] = useState<Record<string, number | null> | null>(null);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  const cryptoOk = status?.crypto_ready !== false;
  const tokenOk = token.trim().length >= 10;
  const ocioso = busy === '' && confirmar === '';
  const podeTestar = tokenOk && ocioso;
  const podeSalvar = tokenOk && ocioso && cryptoOk;

  async function testar() {
    setBusy('validate'); setMsg(null); setPreview(null); setMeta(null);
    try {
      const { data } = await apiWrite<ValidateResp>('/auth/validate', 'POST', { token: token.trim() });
      if (data.ok && data.company) {
        setPreview(data.company);
        setMeta(data.meta ?? null);
        setMsg({ tipo: 'ok', texto: 'Token válido. Confira a conta abaixo e clique em Salvar para conectar.' });
      } else {
        setMsg({ tipo: 'err', texto: 'Token não validou.' });
      }
    } catch (e) {
      setMsg({ tipo: 'err', texto: mensagemErro(e) });
    } finally {
      setBusy('');
    }
  }

  // Clique em Salvar: se ja ha conexao ativa, pede confirmacao antes de substituir.
  function pedirSalvar() {
    setMsg(null);
    if (status?.configured) { setConfirmar('replace'); return; }
    void salvar();
  }

  async function salvar() {
    setConfirmar(''); setBusy('connect'); setMsg(null);
    try {
      const { data } = await apiWrite<{ ok: boolean; company?: PipeCompany }>('/auth/connect', 'POST', { token: token.trim() });
      if (data.ok) {
        setToken('');
        setPreview(null);
        setMeta(null);
        setMsg({ tipo: 'ok', texto: `Conectado a ${data.company?.company_name ?? 'Pipedrive'}. Credencial cifrada e salva.` });
        await qc.invalidateQueries({ queryKey: chaves.status });
      }
    } catch (e) {
      setMsg({ tipo: 'err', texto: mensagemErro(e) });
    } finally {
      setBusy('');
    }
  }

  async function desconectar() {
    setConfirmar(''); setBusy('disconnect'); setMsg(null);
    try {
      await apiWrite<{ ok: boolean }>('/auth/disconnect', 'POST', {});
      setToken('');
      setPreview(null);
      setMeta(null);
      setMsg({ tipo: 'ok', texto: 'Integração desconectada. A credencial foi desativada no servidor.' });
      await qc.invalidateQueries({ queryKey: chaves.status });
    } catch (e) {
      setMsg({ tipo: 'err', texto: mensagemErro(e) });
    } finally {
      setBusy('');
    }
  }

  return (
    <div>
      <PageHeader Icon={Settings2} titulo="Configurações"
        descricao="Conexão com a API do Pipedrive. O token é guardado cifrado no servidor e nunca exposto." />

      {/* Estado atual */}
      <div className="pp-card">
        <h3>Conexão atual</h3>
        {isLoading ? (
          <p className="pp-placeholder">Carregando…</p>
        ) : (
          <>
            <div className="pp-row">
              <span className="pp-k">Status</span>
              <span className="pp-v">
                <span className="pp-badge" style={{ background: 'var(--pp-surface-2)' }}>
                  <span className="pp-dot" style={{ background: corStatus(status?.status) }} />
                  {ROTULO_STATUS[status?.status ?? 'not_configured'] ?? status?.status}
                </span>
              </span>
            </div>
            {status?.configured && (
              <>
                <div className="pp-row"><span className="pp-k">Empresa</span><span className="pp-v">{status.company_name ?? '—'}</span></div>
                <div className="pp-row"><span className="pp-k">Domínio</span><span className="pp-v">{status.company_domain ?? '—'}</span></div>
                <div className="pp-row"><span className="pp-k">Usuário conectado</span><span className="pp-v">{status.connected_user_name ?? '—'}</span></div>
                <div className="pp-row"><span className="pp-k">Token</span><span className="pp-v">•••• {status.token_last4 ?? '????'}</span></div>
                <div className="pp-row"><span className="pp-k">Última validação</span><span className="pp-v">{fmtData(status.last_validated_at)}</span></div>
                {status.last_error && (
                  <div className="pp-row"><span className="pp-k">Último erro</span><span className="pp-v" style={{ color: 'var(--pp-danger)' }}>{status.last_error}</span></div>
                )}
              </>
            )}
            {status && status.crypto_ready === false && (
              <div className="pp-note">⚠ A chave de criptografia (PIPEDRIVE_CRYPTO_KEY) não está configurada no servidor. Contate a equipe de dev antes de salvar um token — Salvar fica bloqueado até isso ser resolvido.</div>
            )}

            {/* Desconectar (so quando ha conexao ativa) */}
            {status?.configured && (
              <div className="pp-actions">
                {confirmar === 'disconnect' ? (
                  <>
                    <span className="pp-placeholder" style={{ alignSelf: 'center', margin: 0 }}>Desconectar a integração?</span>
                    <button className="pp-btn" style={{ color: 'var(--pp-danger)', borderColor: 'var(--pp-danger)' }} disabled={busy !== ''} onClick={desconectar}>
                      {busy === 'disconnect' ? 'Desconectando…' : 'Confirmar desconexão'}
                    </button>
                    <button className="pp-btn" disabled={busy !== ''} onClick={() => setConfirmar('')}>Cancelar</button>
                  </>
                ) : (
                  <button
                    className="pp-btn"
                    style={{ color: 'var(--pp-danger)' }}
                    disabled={busy !== '' || confirmar !== ''}
                    onClick={() => { setMsg(null); setConfirmar('disconnect'); }}
                  >
                    Desconectar
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Inserir / trocar token */}
      <div className="pp-card">
        <h3>{status?.configured ? 'Trocar credencial' : 'Conectar'}</h3>
        <label className="pp-label" htmlFor="pp-token">Token de API do Pipedrive</label>
        <input
          id="pp-token"
          className="pp-input"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="cole aqui o token de API…"
          value={token}
          disabled={busy !== ''}
          onChange={(e) => { setToken(e.target.value); if (confirmar === 'replace') setConfirmar(''); }}
        />

        {confirmar === 'replace' ? (
          <div className="pp-actions">
            <span className="pp-placeholder" style={{ alignSelf: 'center', margin: 0 }}>
              Substituir a credencial de <strong>{status?.company_name ?? 'Pipedrive'}</strong>?
            </span>
            <button className="pp-btn pp-primary" disabled={busy !== ''} onClick={salvar}>
              {busy === 'connect' ? 'Salvando…' : 'Confirmar substituição'}
            </button>
            <button className="pp-btn" disabled={busy !== ''} onClick={() => setConfirmar('')}>Cancelar</button>
          </div>
        ) : (
          <div className="pp-actions">
            <button className="pp-btn" disabled={!podeTestar} onClick={testar}>
              {busy === 'validate' ? 'Testando…' : 'Testar'}
            </button>
            <button className="pp-btn pp-primary" disabled={!podeSalvar} onClick={pedirSalvar} title={!cryptoOk ? 'Chave de criptografia ausente no servidor' : undefined}>
              {busy === 'connect' ? 'Salvando…' : (status?.configured ? 'Salvar (substituir)' : 'Salvar e conectar')}
            </button>
          </div>
        )}

        {msg && <div className={`pp-msg ${msg.tipo}`}>{msg.texto}</div>}

        {preview && (
          <div style={{ marginTop: 14 }}>
            <div className="pp-row"><span className="pp-k">Empresa</span><span className="pp-v">{preview.company_name ?? '—'}</span></div>
            <div className="pp-row"><span className="pp-k">Usuário</span><span className="pp-v">{preview.user_name ?? '—'} {preview.is_admin ? '(admin)' : ''}</span></div>
            <div className="pp-row"><span className="pp-k">E-mail</span><span className="pp-v">{preview.user_email ?? '—'}</span></div>
            <div className="pp-row"><span className="pp-k">Fuso / Moeda</span><span className="pp-v">{preview.timezone ?? '—'} · {preview.currency ?? '—'}</span></div>
            {meta && meta.daily_token_left != null && (
              <div className="pp-row"><span className="pp-k">Orçamento diário de tokens</span><span className="pp-v">{meta.daily_token_left?.toLocaleString('pt-BR')} restantes</span></div>
            )}
          </div>
        )}

        <div className="pp-note">
          🔒 O token dá acesso de leitura ao seu CRM. Guarde-o só aqui — ele é cifrado no servidor (AES-256-GCM) e
          nunca aparece no navegador nem nos logs. Se este token já foi compartilhado em outro lugar, gere um novo no
          Pipedrive e substitua aqui.
        </div>
      </div>

      {status?.configured && <SyncCard />}
      {status?.configured && <WebhooksCard />}
    </div>
  );
}

// Sincronizacao — rotina ADMINISTRATIVA (nao e o "sincronizar agora" de usuario).
// Dispara POST /sync (admin 80+CSRF); em 403 explica que exige administrador.
interface SyncResp {
  ok: boolean; mode?: string;
  entities?: Record<string, { ok: boolean; stats: { processed: number; created: number; updated: number; errors: number }; error?: string | null }>;
}
function SyncCard() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<'' | 'incremental' | 'full'>('');
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);
  const [resumo, setResumo] = useState<SyncResp | null>(null);

  async function sincronizar(mode: 'incremental' | 'full') {
    setBusy(mode); setMsg(null); setResumo(null);
    try {
      const { data } = await apiWrite<SyncResp>('/sync', 'POST', { mode });
      setResumo(data);
      const totalErros = Object.values(data.entities ?? {}).reduce((a, e) => a + (e.stats?.errors ?? 0), 0);
      setMsg(data.ok
        ? { tipo: 'ok', texto: `Sincronização (${mode}) concluída${totalErros ? ` com ${totalErros} erro(s)` : ''}.` }
        : { tipo: 'err', texto: 'A sincronização terminou com falhas — veja os detalhes abaixo.' });
      await qc.invalidateQueries({ queryKey: chaves.overview });
    } catch (e) {
      setMsg({ tipo: 'err', texto: mensagemErro(e) });
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="pp-card">
      <h3>Sincronização (administrativa)</h3>
      <p className="pp-placeholder" style={{ marginBottom: 12 }}>
        Puxa funis, etapas, usuários e negócios do Pipedrive para a base local. Rotina de diagnóstico/recuperação —
        a atualização contínua roda por rotina agendada no servidor.
      </p>
      <div className="pp-actions">
        <button className="pp-btn" disabled={busy !== ''} onClick={() => sincronizar('incremental')}>
          {busy === 'incremental' ? 'Sincronizando…' : 'Sincronizar (incremental)'}
        </button>
        <button className="pp-btn pp-primary" disabled={busy !== ''} onClick={() => sincronizar('full')}>
          {busy === 'full' ? 'Sincronizando…' : 'Sincronização completa'}
        </button>
      </div>

      {msg && <div className={`pp-msg ${msg.tipo}`}>{msg.texto}</div>}

      {resumo?.entities && (
        <div style={{ marginTop: 12 }}>
          {Object.entries(resumo.entities).map(([ent, e]) => (
            <div className="pp-row" key={ent}>
              <span className="pp-k">{ent}</span>
              <span className="pp-v" style={{ color: e.ok ? undefined : 'var(--pp-danger)' }}>
                {e.stats.processed} processados · {e.stats.created} novos · {e.stats.updated} atualizados
                {e.stats.errors ? ` · ${e.stats.errors} erro(s)` : ''}{e.error ? ` (${e.error})` : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="pp-note">
        ⏱️ A sincronização completa pode consumir orçamento de tokens da API conforme o volume do CRM. Prefira a
        incremental no dia a dia; use a completa na primeira carga ou para reconciliar.
      </div>
    </div>
  );
}

// Webhooks & fila — rotina ADMINISTRATIVA (level 80). Registra/lista/remove webhooks
// no Pipedrive e mostra o estado da fila de ingest (pipe_sync_jobs). O receptor
// (POST /webhook) e publico e autenticado por Basic Auth do servidor.
function WebhooksCard() {
  const qc = useQueryClient();
  const wh = useQuery<PipeWebhooksData>({
    queryKey: chaves.webhooks,
    queryFn: ({ signal }) => apiGet<PipeWebhooksData>('/webhooks', undefined, signal),
    retry: false,
  });
  const q = useQuery<PipeQueueData>({
    queryKey: chaves.queue,
    queryFn: ({ signal }) => apiGet<PipeQueueData>('/queue', undefined, signal),
    refetchInterval: 30_000,
    retry: false,
  });

  const [busy, setBusy] = useState('');
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const erro = wh.error ?? q.error;
  const admin403 = erro instanceof ApiError && erro.status === 403;

  async function copiarUrl(url: string) {
    try { await navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 1500); }
    catch { /* clipboard bloqueado pelo navegador */ }
  }

  async function registrar() {
    setBusy('register'); setMsg(null);
    try {
      await apiWrite('/webhooks/register', 'POST', {});
      setMsg({ tipo: 'ok', texto: 'Webhook registrado no Pipedrive. As mudanças passam a chegar em tempo quase real.' });
      await qc.invalidateQueries({ queryKey: chaves.webhooks });
    } catch (e) { setMsg({ tipo: 'err', texto: mensagemErro(e) }); }
    finally { setBusy(''); }
  }

  async function remover(id: string) {
    setBusy(`del-${id}`); setMsg(null); setConfirmDel(null);
    try {
      await apiWrite(`/webhooks/${id}`, 'DELETE');
      setMsg({ tipo: 'ok', texto: 'Webhook removido do Pipedrive.' });
      await qc.invalidateQueries({ queryKey: chaves.webhooks });
    } catch (e) { setMsg({ tipo: 'err', texto: mensagemErro(e) }); }
    finally { setBusy(''); }
  }

  async function drenar() {
    setBusy('drain'); setMsg(null);
    try {
      const { data } = await apiWrite<PipeDrainResult>('/queue/drain', 'POST', { limit: 200 });
      setMsg({ tipo: 'ok', texto: `Fila drenada: ${data.done + data.deleted} processado(s), ${data.retry} reagendado(s), ${data.dead} descartado(s).` });
      await qc.invalidateQueries({ queryKey: chaves.queue });
    } catch (e) { setMsg({ tipo: 'err', texto: mensagemErro(e) }); }
    finally { setBusy(''); }
  }

  async function reenfileirar(id: number) {
    setBusy(`req-${id}`); setMsg(null);
    try {
      await apiWrite('/queue/requeue', 'POST', { id });
      setMsg({ tipo: 'ok', texto: `Job #${id} reenfileirado.` });
      await qc.invalidateQueries({ queryKey: chaves.queue });
    } catch (e) { setMsg({ tipo: 'err', texto: mensagemErro(e) }); }
    finally { setBusy(''); }
  }

  async function reconciliar() {
    setBusy('reconcile'); setMsg(null);
    try {
      const { data } = await apiWrite<{ total_marked_deleted: number }>('/reconcile', 'POST', {});
      const n = data.total_marked_deleted ?? 0;
      setMsg({ tipo: 'ok', texto: n > 0
        ? `Reconciliação concluída: ${n} negócio(s) marcado(s) como excluído(s).`
        : 'Reconciliação concluída: nenhuma exclusão nova encontrada.' });
    } catch (e) { setMsg({ tipo: 'err', texto: mensagemErro(e) }); }
    finally { setBusy(''); }
  }

  if (admin403) {
    return (
      <div className="pp-card">
        <h3>Webhooks &amp; fila</h3>
        <div className="pp-note">🔒 A gestão de webhooks e da fila de sincronização é restrita a administradores.</div>
      </div>
    );
  }

  const rec = wh.data?.receiver;
  const lista = wh.data?.webhooks ?? [];
  const st = q.data?.stats;

  return (
    <div className="pp-card">
      <h3>Webhooks &amp; fila de sincronização</h3>
      <p className="pp-placeholder" style={{ marginBottom: 14 }}>
        Webhooks avisam o painel assim que algo muda no Pipedrive (negócios, pessoas, atividades…). Cada aviso vira
        um item de fila que <strong>re-busca a entidade na API</strong> e atualiza a base local — reentregas e ordem
        fora de sequência são tratadas com segurança.
      </p>

      {/* Receptor */}
      <div className="pp-row">
        <span className="pp-k">Endpoint receptor</span>
        <span className="pp-v" style={{ display: 'flex', gap: 8, alignItems: 'center', maxWidth: 400 }}>
          <code style={{ fontSize: 11.5, wordBreak: 'break-all' }}>{rec?.url ?? '—'}</code>
          {rec?.url && (
            <button className="pp-btn" style={{ padding: '3px 9px', fontSize: 11.5 }} onClick={() => copiarUrl(rec.url)}>
              {copiado ? 'copiado' : 'copiar'}
            </button>
          )}
        </span>
      </div>
      <div className="pp-row">
        <span className="pp-k">Autenticação (Basic Auth)</span>
        <span className="pp-v">
          <span className="pp-badge" style={{ background: 'var(--pp-surface-2)' }}>
            <span className="pp-dot" style={{ background: rec?.basic_auth_configured ? 'var(--pp-ok)' : 'var(--pp-danger)' }} />
            {rec?.basic_auth_configured ? 'Configurada' : 'Ausente no servidor'}
          </span>
        </span>
      </div>

      {/* Webhooks registrados no Pipedrive */}
      {wh.isLoading ? (
        <p className="pp-placeholder" style={{ marginTop: 12 }}>Carregando webhooks…</p>
      ) : lista.length === 0 ? (
        <div className="pp-note" style={{ borderLeftColor: 'var(--pp-sync)' }}>
          Nenhum webhook registrado no Pipedrive ainda. Registre um para receber as mudanças em tempo quase real —
          enquanto isso, a atualização depende da sincronização agendada.
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          {lista.map((w) => {
            const id = String(w.id ?? '');
            return (
              <div className="pp-row" key={id}>
                <span className="pp-k">
                  {(w.event_action ?? '*')}.{(w.event_object ?? '*')} <span style={{ opacity: 0.6 }}>#{id}</span>
                </span>
                <span className="pp-v" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--pp-text-dim)' }}>v{String(w.version ?? '?')}</span>
                  {confirmDel === id ? (
                    <>
                      <button className="pp-btn" style={{ color: 'var(--pp-danger)', borderColor: 'var(--pp-danger)', padding: '4px 10px' }} disabled={busy !== ''} onClick={() => remover(id)}>
                        {busy === `del-${id}` ? 'Removendo…' : 'Confirmar'}
                      </button>
                      <button className="pp-btn" style={{ padding: '4px 10px' }} disabled={busy !== ''} onClick={() => setConfirmDel(null)}>Cancelar</button>
                    </>
                  ) : (
                    <button className="pp-btn" style={{ color: 'var(--pp-danger)', padding: '4px 10px' }} disabled={busy !== ''} onClick={() => setConfirmDel(id)}>Remover</button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="pp-actions">
        <button
          className="pp-btn pp-primary"
          disabled={busy !== '' || !rec?.basic_auth_configured}
          title={!rec?.basic_auth_configured ? 'Credenciais Basic Auth ausentes no servidor' : undefined}
          onClick={registrar}
        >
          {busy === 'register' ? 'Registrando…' : 'Registrar webhook (todos os eventos)'}
        </button>
        <button className="pp-btn" disabled={busy !== ''} onClick={drenar}>
          {busy === 'drain' ? 'Drenando…' : 'Drenar fila agora'}
        </button>
        <button className="pp-btn" disabled={busy !== ''} onClick={reconciliar} title="Varre negócios excluídos no Pipedrive e marca localmente (backstop dos webhooks)">
          {busy === 'reconcile' ? 'Reconciliando…' : 'Reconciliar exclusões'}
        </button>
      </div>

      {msg && <div className={`pp-msg ${msg.tipo}`}>{msg.texto}</div>}

      {/* Estado da fila de ingest */}
      {st && (
        <>
          <div className="pp-tiles" style={{ marginTop: 16 }}>
            <div className="pp-tile"><span className="pp-tile-n">{st.jobs.pending}</span><span className="pp-tile-l">Pendentes</span></div>
            <div className="pp-tile"><span className="pp-tile-n">{st.jobs.done}</span><span className="pp-tile-l">Concluídos</span></div>
            <div className="pp-tile"><span className="pp-tile-n" style={{ color: st.jobs.dead ? 'var(--pp-danger)' : undefined }}>{st.jobs.dead}</span><span className="pp-tile-l">Descartados</span></div>
            <div className="pp-tile"><span className="pp-tile-n">{st.webhook_events.received}</span><span className="pp-tile-l">Eventos recebidos</span></div>
          </div>
          <div className="pp-row"><span className="pp-k">Último evento recebido</span><span className="pp-v">{fmtData(st.last_event_at)}</span></div>
          {st.webhook_events.duplicate > 0 && (
            <div className="pp-row"><span className="pp-k">Duplicados ignorados</span><span className="pp-v">{st.webhook_events.duplicate}</span></div>
          )}
        </>
      )}

      {/* Jobs mortos (dead-letter) com recuperação manual */}
      {q.data && q.data.dead.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="pp-note" style={{ borderLeftColor: 'var(--pp-danger)' }}>
            {q.data.dead.length} job(s) descartado(s) após esgotar as tentativas. Reenfileire para tentar de novo.
          </div>
          {q.data.dead.slice(0, 6).map((d) => (
            <div className="pp-row" key={d.id}>
              <span className="pp-k">{d.entity ?? '?'} #{d.external_id ?? '?'} <span style={{ opacity: 0.6 }}>({d.attempts} tent.)</span></span>
              <span className="pp-v" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, color: 'var(--pp-danger)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.last_error ?? ''}</span>
                <button className="pp-btn" style={{ padding: '4px 10px' }} disabled={busy !== ''} onClick={() => reenfileirar(d.id)}>
                  {busy === `req-${d.id}` ? '…' : 'Reenfileirar'}
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="pp-note">
        ⏱️ Depois de registrar o webhook, habilite a rotina de drenagem no servidor (cron <code>--mode=drain-queue</code>)
        para a fila ser processada sozinha. Sem ela, use “Drenar fila agora” para processar manualmente.
      </div>
    </div>
  );
}

function mensagemErro(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 0 || e.code === 'HTTP_0') return 'Falha de rede. Verifique a conexão e tente novamente.';
    if (e.code === 'INVALID_CSRF_TOKEN') return 'Sua sessão expirou (proteção CSRF). Recarregue a página e tente novamente.';
    if (e.ehAuth) return 'Sessão expirada. Recarregue a página e entre novamente.';
    if (e.status === 403) return 'Você não tem permissão para alterar a credencial (requer administrador).';
    if (e.code === 'VALIDATION_ERROR') return 'Token inválido ou sem permissão. Verifique e tente novamente.';
    return e.message || 'Falha ao processar.';
  }
  return 'Falha inesperada.';
}
