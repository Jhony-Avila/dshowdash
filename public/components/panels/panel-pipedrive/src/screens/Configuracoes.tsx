// screens/Configuracoes.tsx — configurações do módulo, em abas.
// @version 2.0.0  @created 2026-07-21
//
// O token é enviado SÓ no corpo do POST (HTTPS), nunca vai na URL nem é devolvido
// pela API (o backend guarda cifrado e expõe apenas os últimos 4). Toda escrita
// passa por CSRF (lib/api).
//
// v1.1.0 (endurecimento): confirmação antes de substituir credencial conectada;
//   Desconectar (POST /auth/disconnect); data em pt-BR; Salvar travado sem chave.
// v1.2.0: card "Webhooks & fila" + "Reconciliar exclusões".
// v2.0.0 (Fase 6): a tela vira SEIS ABAS — Conexão · Sincronização · Alertas ·
//   Aparência · Segurança · Diagnóstico — e toda ação de escrita passa a declarar
//   NÍVEL DE RISCO, com confirmação obrigatória nas críticas (`AcaoCritica`).
//
// ⚠️ Honestidade das abas: só existe aba para o que o módulo REALMENTE controla.
// "Alertas" mostra as regras em vigor mas é somente leitura — as regras são fixas no
// código (`commercialAlerts()`); a tabela `pipe_alert_rules` existe no banco e está
// VAZIA, reservada para quando a edição for construída. Uma aba com controles que não
// controlam nada seria pior que aba nenhuma.
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Settings2, Plug, RefreshCw, BellRing, Palette, ShieldCheck, Stethoscope,
} from 'lucide-react';
import { apiGet, apiWrite, chaves, ApiError } from '../lib/api';
import { PageHeader } from './PageHeader';
import { fmtData, fmtNum } from '../lib/format';
import { AbasPagina, PainelAba, AcaoCritica, useAbaLembrada, type Aba } from './Abas';
import { SkeletonBloco } from './Estados';
import type {
  PipeStatus, PipeCompany, PipeWebhooksData, PipeQueueData, PipeDrainResult,
  PipeOverview, PipeAlertsData,
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

const ABAS_ICONE = {
  conexao: Plug, sincronizacao: RefreshCw, alertas: BellRing,
  aparencia: Palette, seguranca: ShieldCheck, diagnostico: Stethoscope,
} as const;

export function Configuracoes({ onSaude }: { onSaude?: () => void } = {}) {
  const { data: status, isLoading } = useQuery<PipeStatus>({
    queryKey: chaves.status,
    queryFn: ({ signal }) => apiGet<PipeStatus>('/status', undefined, signal),
  });

  const abas: Aba[] = [
    { id: 'conexao', label: 'Conexão', cor: corStatus(status?.status) },
    { id: 'sincronizacao', label: 'Sincronização' },
    { id: 'alertas', label: 'Alertas' },
    { id: 'aparencia', label: 'Aparência' },
    { id: 'seguranca', label: 'Segurança' },
    { id: 'diagnostico', label: 'Diagnóstico' },
  ];
  const [aba, setAba] = useAbaLembrada('config', abas, 'conexao');

  const Icone = ABAS_ICONE[aba as keyof typeof ABAS_ICONE] ?? Settings2;

  return (
    <div>
      <PageHeader Icon={Icone} titulo="Configurações"
        descricao="Conexão, sincronização e preferências do módulo. O token fica cifrado no servidor e nunca é exposto." />

      <AbasPagina abas={abas} ativa={aba} onMudar={setAba} idPrefixo="cfg" />

      <PainelAba id="conexao" ativa={aba} idPrefixo="cfg">
        <AbaConexao status={status} carregando={isLoading} />
      </PainelAba>

      <PainelAba id="sincronizacao" ativa={aba} idPrefixo="cfg">
        {status?.configured ? <><SyncCard /><WebhooksCard /></> : <SemConexao />}
      </PainelAba>

      <PainelAba id="alertas" ativa={aba} idPrefixo="cfg">
        {status?.configured ? <AbaAlertas /> : <SemConexao />}
      </PainelAba>

      <PainelAba id="aparencia" ativa={aba} idPrefixo="cfg">
        <AbaAparencia />
      </PainelAba>

      <PainelAba id="seguranca" ativa={aba} idPrefixo="cfg">
        <AbaSeguranca status={status} />
      </PainelAba>

      <PainelAba id="diagnostico" ativa={aba} idPrefixo="cfg">
        {status?.configured ? <AbaDiagnostico onSaude={onSaude} /> : <SemConexao />}
      </PainelAba>
    </div>
  );
}

function SemConexao() {
  return (
    <div className="pp-card">
      <h3>Sem conexão ativa</h3>
      <p className="pp-placeholder">
        Esta seção só faz sentido com a integração conectada. Vá à aba <strong>Conexão</strong> e
        cadastre o token de API do Pipedrive.
      </p>
    </div>
  );
}

// ── Aba: Conexão ─────────────────────────────────────────────────────────────

type Busy = '' | 'validate' | 'connect' | 'disconnect';

function AbaConexao({ status, carregando }: { status?: PipeStatus; carregando: boolean }) {
  const qc = useQueryClient();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState<Busy>('');
  const [confirmarTroca, setConfirmarTroca] = useState(false);
  const [preview, setPreview] = useState<PipeCompany | null>(null);
  const [meta, setMeta] = useState<Record<string, number | null> | null>(null);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  const cryptoOk = status?.crypto_ready !== false;
  const tokenOk = token.trim().length >= 10;
  const ocioso = busy === '' && !confirmarTroca;
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
    } finally { setBusy(''); }
  }

  function pedirSalvar() {
    setMsg(null);
    if (status?.configured) { setConfirmarTroca(true); return; }
    void salvar();
  }

  async function salvar() {
    setConfirmarTroca(false); setBusy('connect'); setMsg(null);
    try {
      const { data } = await apiWrite<{ ok: boolean; company?: PipeCompany }>('/auth/connect', 'POST', { token: token.trim() });
      if (data.ok) {
        setToken(''); setPreview(null); setMeta(null);
        setMsg({ tipo: 'ok', texto: `Conectado a ${data.company?.company_name ?? 'Pipedrive'}. Credencial cifrada e salva.` });
        await qc.invalidateQueries({ queryKey: chaves.status });
      }
    } catch (e) {
      setMsg({ tipo: 'err', texto: mensagemErro(e) });
    } finally { setBusy(''); }
  }

  return (
    <>
      <div className="pp-card">
        <h3>Conexão atual</h3>
        {carregando ? <SkeletonBloco linhas={3} /> : (
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
          </>
        )}
      </div>

      <div className="pp-card">
        <h3>{status?.configured ? 'Trocar credencial' : 'Conectar'}</h3>
        <label className="pp-label" htmlFor="pp-token">Token de API do Pipedrive</label>
        <input
          id="pp-token" className="pp-input" type="password" autoComplete="off" spellCheck={false}
          placeholder="cole aqui o token de API…"
          value={token} disabled={busy !== ''}
          onChange={(e) => { setToken(e.target.value); if (confirmarTroca) setConfirmarTroca(false); }}
        />

        {confirmarTroca ? (
          <div className="pp-confirma">
            <span>Substituir a credencial de <strong>{status?.company_name ?? 'Pipedrive'}</strong>? A anterior deixa de valer.</span>
            <button className="pp-btn risco-alto" disabled={busy !== ''} onClick={salvar}>
              {busy === 'connect' ? 'Salvando…' : 'Confirmar substituição'}
            </button>
            <button className="pp-btn" disabled={busy !== ''} onClick={() => setConfirmarTroca(false)}>Cancelar</button>
          </div>
        ) : (
          <div className="pp-actions">
            <button className="pp-btn" disabled={!podeTestar} onClick={testar}>
              {busy === 'validate' ? 'Testando…' : 'Testar'}
            </button>
            <button className="pp-btn pp-primary" disabled={!podeSalvar} onClick={pedirSalvar}
              title={!cryptoOk ? 'Chave de criptografia ausente no servidor' : undefined}>
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
    </>
  );
}

// ── Aba: Sincronização ───────────────────────────────────────────────────────

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
    } finally { setBusy(''); }
  }

  return (
    <div className="pp-card">
      <h3>Sincronização (administrativa)</h3>
      <p className="pp-placeholder" style={{ marginBottom: 6 }}>
        Puxa funis, etapas, usuários e negócios do Pipedrive para a base local. Rotina de diagnóstico/recuperação —
        a atualização contínua roda por rotina agendada no servidor.
      </p>

      <AcaoCritica titulo="Sincronizar (incremental)" risco="baixo"
        descricao="Traz só o que mudou desde a última marca-d'água. É a rotina do dia a dia e consome pouco orçamento de tokens."
        rotulo="Sincronizar" rotuloOcupado="Sincronizando…" ocupado={busy === 'incremental'}
        desabilitado={busy !== ''} onExecutar={() => void sincronizar('incremental')} />

      <AcaoCritica titulo="Sincronização completa" risco="medio"
        descricao="Relê TODAS as entidades do CRM. Pode consumir uma fatia grande do orçamento diário de tokens da API conforme o volume — use na primeira carga ou para reconciliar."
        rotulo="Rodar completa" rotuloOcupado="Sincronizando…" ocupado={busy === 'full'}
        desabilitado={busy !== ''} onExecutar={() => void sincronizar('full')} />

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
    </div>
  );
}

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
    setBusy(`del-${id}`); setMsg(null);
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
              <AcaoCritica key={id} risco="alto"
                titulo={`${(w.event_action ?? '*')}.${(w.event_object ?? '*')} · #${id}`}
                descricao={<>Webhook registrado no Pipedrive (v{String(w.version ?? '?')}). Removê-lo interrompe a chegada em tempo quase real dessas mudanças — a base passa a depender só da sincronização agendada.</>}
                pergunta={<>Remover o webhook <strong>#{id}</strong> no Pipedrive?</>}
                rotulo="Remover" rotuloOcupado="Removendo…"
                ocupado={busy === `del-${id}`} desabilitado={busy !== ''}
                onExecutar={() => void remover(id)} />
            );
          })}
        </div>
      )}

      <AcaoCritica titulo="Registrar webhook (todos os eventos)" risco="medio"
        descricao="Cria a assinatura no Pipedrive apontando para o endpoint acima. Exige o Basic Auth configurado no servidor, senão o Pipedrive descarta a assinatura após 3 dias sem resposta 2XX."
        rotulo="Registrar" rotuloOcupado="Registrando…"
        ocupado={busy === 'register'} desabilitado={busy !== '' || !rec?.basic_auth_configured}
        motivoDesabilitado="Credenciais Basic Auth ausentes no servidor"
        onExecutar={() => void registrar()} />

      <AcaoCritica titulo="Drenar fila agora" risco="baixo"
        descricao="Processa até 200 itens pendentes da fila de ingest. Só relê entidades da API — não altera nada no Pipedrive."
        rotulo="Drenar" rotuloOcupado="Drenando…"
        ocupado={busy === 'drain'} desabilitado={busy !== ''} onExecutar={() => void drenar()} />

      <AcaoCritica titulo="Reconciliar exclusões" risco="baixo"
        descricao="Varre negócios excluídos no Pipedrive e marca localmente. É o backstop dos webhooks — leitura apenas, nada é apagado de verdade na base."
        rotulo="Reconciliar" rotuloOcupado="Reconciliando…"
        ocupado={busy === 'reconcile'} desabilitado={busy !== ''} onExecutar={() => void reconciliar()} />

      {msg && <div className={`pp-msg ${msg.tipo}`}>{msg.texto}</div>}

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

// ── Aba: Alertas (somente leitura — ver nota no topo do arquivo) ─────────────

const ROTULO_SEV: Record<string, string> = { high: 'Alta', medium: 'Média', low: 'Baixa' };
const COR_SEV: Record<string, string> = { high: 'var(--pp-danger)', medium: 'var(--pp-warn)', low: 'var(--pp-neutral)' };

function AbaAlertas() {
  const { data, isLoading } = useQuery<PipeAlertsData>({
    queryKey: ['pipe', 'alerts'],
    queryFn: ({ signal }) => apiGet<PipeAlertsData>('/alerts', undefined, signal),
    staleTime: 120_000,
  });

  return (
    <div className="pp-card">
      <h3>Regras de alerta em vigor</h3>
      <p className="pp-placeholder" style={{ marginBottom: 12 }}>
        Estas são as regras que a tela de <strong>Alertas</strong> aplica sobre os negócios em aberto.
        O quadro <strong>Kanban</strong> usa exatamente as mesmas condições, para as duas telas não se contradizerem.
      </p>

      {isLoading ? <SkeletonBloco linhas={4} /> : (data?.alerts ?? []).map((a) => (
        <div className="pp-row" key={a.key}>
          <span className="pp-k" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span className="pp-dot" style={{ background: COR_SEV[a.severity], width: 8, height: 8, borderRadius: '50%' }} />
            {a.label}
            <span style={{ fontSize: 11, opacity: .75 }}>({ROTULO_SEV[a.severity] ?? a.severity})</span>
          </span>
          <span className="pp-v" style={{ textAlign: 'right' }}>
            {fmtNum(a.count)} negócios
            <div className="pp-td-sub" style={{ whiteSpace: 'normal', maxWidth: 320 }}>{a.description}</div>
          </span>
        </div>
      ))}

      <div className="pp-note">
        ✋ <strong>Somente leitura nesta versão.</strong> As regras são fixas no servidor; não há como editar limiares,
        silenciar regra ou escolher destinatário por aqui. A tabela <code>pipe_alert_rules</code> já existe no banco
        (vazia) reservada para quando a edição for construída — preferimos não mostrar controles que não controlam nada.
      </div>
    </div>
  );
}

// ── Aba: Aparência ───────────────────────────────────────────────────────────

const PREF_DENS = 'pp:dens';
const PREF_PERPAGE = 'pp:perpage';
const PREF_SIDEBAR = 'pp:sidebar:compact';
const PERPAGE_OPCOES = [25, 50, 100, 200];

function lerPref(chave: string, padrao: string): string {
  try { return localStorage.getItem(chave) ?? padrao; } catch { return padrao; }
}

function AbaAparencia() {
  const [dens, setDens] = useState(() => lerPref(PREF_DENS, 'padrao'));
  const [perPage, setPerPage] = useState(() => lerPref(PREF_PERPAGE, '25'));
  const [compacta, setCompacta] = useState(() => lerPref(PREF_SIDEBAR, '0') === '1');
  const [msg, setMsg] = useState<string | null>(null);

  const gravar = (chave: string, valor: string) => {
    try { localStorage.setItem(chave, valor); } catch { /* ignora */ }
  };

  const limpar = () => {
    try {
      // Só as chaves DESTE painel (prefixo pp:) — o resto do dashboard não é nosso.
      const alvos = Object.keys(localStorage).filter((k) => k.startsWith('pp:'));
      alvos.forEach((k) => localStorage.removeItem(k));
      setDens('padrao'); setPerPage('25'); setCompacta(false);
      setMsg(`${alvos.length} preferência(s) do painel restaurada(s) ao padrão. Reabra as telas para ver o efeito.`);
    } catch { setMsg('Não foi possível limpar as preferências neste navegador.'); }
  };

  return (
    <div className="pp-card">
      <h3>Aparência e preferências</h3>
      <p className="pp-placeholder" style={{ marginBottom: 6 }}>
        Preferências guardadas <strong>neste navegador</strong> (não viajam entre dispositivos nem entre usuários).
        O tema claro/escuro é do Dshow Dash inteiro e se ajusta pelo cabeçalho do dashboard, não aqui.
      </p>

      <div className="pp-pref">
        <div className="pp-pref-txt">
          <div className="pp-pref-tit">Densidade das listas e do Kanban</div>
          <div className="pp-pref-desc">Vale para os 8 grids e para os cartões do quadro. É a mesma preferência que o botão de densidade da barra de ferramentas altera.</div>
        </div>
        <div className="pp-seg" role="group" aria-label="Densidade">
          {[{ v: 'compacta', l: 'Compacta' }, { v: 'padrao', l: 'Padrão' }, { v: 'confortavel', l: 'Confortável' }].map((o) => (
            <button key={o.v} type="button" className={`pp-seg-b${dens === o.v ? ' is-active' : ''}`}
              aria-pressed={dens === o.v}
              onClick={() => { setDens(o.v); gravar(PREF_DENS, o.v); }}>{o.l}</button>
          ))}
        </div>
      </div>

      <div className="pp-pref">
        <div className="pp-pref-txt">
          <div className="pp-pref-tit">Itens por página nas listas</div>
          <div className="pp-pref-desc">Quanto maior, menos idas ao servidor e mais peso por página. O backend aceita até 500; a interface oferece até 200.</div>
        </div>
        <select className="pp-select" aria-label="Itens por página" value={perPage}
          onChange={(e) => { setPerPage(e.target.value); gravar(PREF_PERPAGE, e.target.value); }}>
          {PERPAGE_OPCOES.map((n) => <option key={n} value={n}>{n} por página</option>)}
        </select>
      </div>

      <div className="pp-pref">
        <div className="pp-pref-txt">
          <div className="pp-pref-tit">Menu lateral recolhido</div>
          <div className="pp-pref-desc">Deixa a navegação do módulo só com ícones, liberando largura para o conteúdo.</div>
        </div>
        <div className="pp-seg" role="group" aria-label="Menu lateral">
          {[{ v: false, l: 'Expandido' }, { v: true, l: 'Recolhido' }].map((o) => (
            <button key={String(o.v)} type="button" className={`pp-seg-b${compacta === o.v ? ' is-active' : ''}`}
              aria-pressed={compacta === o.v}
              onClick={() => { setCompacta(o.v); gravar(PREF_SIDEBAR, o.v ? '1' : '0'); }}>{o.l}</button>
          ))}
        </div>
      </div>

      <AcaoCritica titulo="Restaurar preferências do painel" risco="medio"
        descricao={<>Apaga as preferências locais do Pipedrive (densidade, colunas, visões salvas, abas lembradas, agenda). <strong>Visões salvas de grid são perdidas.</strong> Nenhum dado do CRM é afetado.</>}
        rotulo="Restaurar padrões" onExecutar={limpar} />

      {msg && <div className="pp-msg ok">{msg}</div>}

      <div className="pp-note">
        ↻ Densidade e itens por página são lidos quando cada tela monta — troque aqui e reabra a tela
        (ou navegue para fora e volte) para ver o efeito.
      </div>
    </div>
  );
}

// ── Aba: Segurança ───────────────────────────────────────────────────────────

function AbaSeguranca({ status }: { status?: PipeStatus }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  async function desconectar() {
    setBusy(true); setMsg(null);
    try {
      await apiWrite<{ ok: boolean }>('/auth/disconnect', 'POST', {});
      setMsg({ tipo: 'ok', texto: 'Integração desconectada. A credencial foi desativada no servidor.' });
      await qc.invalidateQueries({ queryKey: chaves.status });
    } catch (e) {
      setMsg({ tipo: 'err', texto: mensagemErro(e) });
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="pp-card">
        <h3>Como a credencial é guardada</h3>
        <div className="pp-row"><span className="pp-k">Cifragem em repouso</span><span className="pp-v">AES-256-GCM com chave do servidor</span></div>
        <div className="pp-row">
          <span className="pp-k">Chave de criptografia</span>
          <span className="pp-v">
            <span className="pp-badge" style={{ background: 'var(--pp-surface-2)' }}>
              <span className="pp-dot" style={{ background: status?.crypto_ready === false ? 'var(--pp-danger)' : 'var(--pp-ok)' }} />
              {status?.crypto_ready === false ? 'Ausente no servidor' : 'Configurada'}
            </span>
          </span>
        </div>
        <div className="pp-row"><span className="pp-k">Exposição ao navegador</span><span className="pp-v">Só os últimos 4 dígitos ({status?.token_last4 ? `•••• ${status.token_last4}` : '—'})</span></div>
        <div className="pp-row"><span className="pp-k">Trânsito</span><span className="pp-v">Somente no corpo do POST, sob HTTPS — nunca na URL</span></div>
        <div className="pp-row"><span className="pp-k">Escritas</span><span className="pp-v">Exigem token CSRF válido</span></div>
      </div>

      <div className="pp-card">
        <h3>Quem pode o quê</h3>
        <div className="pp-row"><span className="pp-k">Ler os painéis</span><span className="pp-v">Acesso ao módulo (nível 50)</span></div>
        <div className="pp-row"><span className="pp-k">Conectar / trocar credencial</span><span className="pp-v">Administrador</span></div>
        <div className="pp-row"><span className="pp-k">Webhooks e fila</span><span className="pp-v">Administrador (nível 80)</span></div>
        <div className="pp-row"><span className="pp-k">Escrita no Pipedrive</span><span className="pp-v">Nenhuma — o módulo é somente leitura do CRM</span></div>
        <div className="pp-note" style={{ borderLeftColor: 'var(--pp-ok)' }}>
          🛡️ Este módulo <strong>não altera nada no Pipedrive</strong>. Ele lê a API e mantém uma réplica analítica local;
          as ações de escrita desta tela mexem apenas na configuração da integração e na fila local — com uma exceção
          declarada: registrar/remover webhook cria e apaga assinaturas no Pipedrive.
        </div>
      </div>

      {status?.configured && (
        <div className="pp-card">
          <h3>Encerrar a integração</h3>
          <AcaoCritica titulo="Desconectar integração" risco="alto"
            descricao={<>Desativa a credencial no servidor. Os painéis param de atualizar e as telas passam a pedir reconexão. <strong>A base local sincronizada é preservada</strong>, mas nada novo entra até reconectar.</>}
            pergunta={<>Desconectar de <strong>{status.company_name ?? 'Pipedrive'}</strong>? Será preciso colar o token de novo para voltar.</>}
            rotulo="Desconectar" rotuloOcupado="Desconectando…" ocupado={busy}
            onExecutar={() => void desconectar()} />
          {msg && <div className={`pp-msg ${msg.tipo}`}>{msg.texto}</div>}
        </div>
      )}
    </>
  );
}

// ── Aba: Diagnóstico ─────────────────────────────────────────────────────────

// Valores REAIS de `pipe_sync_runs.status` neste banco: 'completed' e 'failed'
// (conferido: 6.485 completed / 5 failed). Casar com 'ok'/'success' pintaria toda
// rodada bem-sucedida de âmbar — parece um problema que não existe.
const ROTULO_RUN: Record<string, string> = {
  completed: 'concluída', failed: 'falhou', running: 'em andamento', partial: 'parcial',
};
function corRun(s?: string | null): string {
  if (s === 'completed') return 'var(--pp-ok)';
  if (s === 'failed') return 'var(--pp-danger)';
  if (s === 'running') return 'var(--pp-sync)';
  return 'var(--pp-warn)';
}

function AbaDiagnostico({ onSaude }: { onSaude?: () => void }) {
  const { data, isLoading } = useQuery<PipeOverview>({
    queryKey: chaves.overview,
    queryFn: ({ signal }) => apiGet<PipeOverview>('/overview', undefined, signal),
    staleTime: 60_000,
  });

  const runs = data?.runs ?? [];
  const cursors = data?.cursors ?? [];

  return (
    <>
      <div className="pp-card">
        <h3>Marca-d'água por entidade</h3>
        <p className="pp-placeholder" style={{ marginBottom: 10 }}>
          Até onde a sincronização incremental já leu cada entidade. Uma marca muito antiga indica que a rotina
          agendada parou de rodar para aquela entidade.
        </p>
        {isLoading ? <SkeletonBloco linhas={4} /> : cursors.length === 0 ? (
          <p className="pp-placeholder">Nenhum cursor registrado ainda — a primeira sincronização ainda não rodou.</p>
        ) : cursors.map((c) => (
          <div className="pp-row" key={c.entity}>
            <span className="pp-k">{c.entity}</span>
            <span className="pp-v">
              {fmtData(c.watermark_update_time)}
              <div className="pp-td-sub">carga completa: {fmtData(c.last_full_sync_at)}</div>
            </span>
          </div>
        ))}
      </div>

      <div className="pp-card">
        <h3>Últimas rodadas de sincronização</h3>
        {isLoading ? <SkeletonBloco linhas={4} /> : runs.length === 0 ? (
          <p className="pp-placeholder">Nenhuma rodada registrada.</p>
        ) : (
          <div className="pp-tabela-rolavel">
            <table className="pp-table">
              <thead>
                <tr><th>Quando</th><th>Entidade</th><th className="ta-r">Processados</th><th className="ta-r">Erros</th><th>Situação</th></tr>
              </thead>
              <tbody>
                {runs.slice(0, 10).map((r, i) => (
                  <tr key={`${r.entity}-${r.started_at}-${i}`}>
                    <td>{fmtData(r.finished_at ?? r.started_at)}</td>
                    <td>{r.entity ?? '—'}</td>
                    <td className="ta-r">{fmtNum(r.processed)}</td>
                    <td className="ta-r" style={{ color: r.errors ? 'var(--pp-danger)' : undefined }}>{fmtNum(r.errors)}</td>
                    <td>
                      <span className="pp-badge" style={{ background: 'var(--pp-surface-2)' }}>
                        <span className="pp-dot" style={{ background: corRun(r.status) }} />
                        {ROTULO_RUN[r.status ?? ''] ?? r.status ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {onSaude && (
          <div className="pp-actions">
            <button className="pp-btn" onClick={onSaude}>Abrir diagnóstico completo (Saúde) →</button>
          </div>
        )}
      </div>
    </>
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
