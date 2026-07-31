// screens/Admin.tsx — Contas (§55), Sincronização (§51) e Configurações (§13.3, §47).
// @version 2.0.0  @created 2026-07-29  @updated 2026-07-30
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { servico } from '../services';
import { chaves, ApiError } from '../lib/api';
import type {
  StatusIntegracao, PassoGoLive, ResumoGoLive, LinhaFila, CanalPush,
} from '../services/types';
import type { Preferencias } from '../shell/types';
import { ATALHOS } from '../shell/atalhos';
import { Cartao } from '../shell/ui';
import { Icone } from '../shell/Icone';
import { EstadoErro, EstadoVazio, SkeletonBloco } from './Estados';
import { dataHora, desde, rotuloFuso } from '../lib/tz';

const ROTULO_CONEXAO: Record<string, string> = {
  connected: 'Conectada',
  reauth_required: 'Precisa reconectar',
  revoked: 'Acesso revogado',
};

/**
 * Rótulo de cada estado de sincronização.
 *
 * `pending` PRECISA existir aqui: um calendário recém-descoberto entra nesse
 * estado, e o mapeamento antigo (tudo que não fosse ok/stale virava "erro")
 * mostraria falha vermelha logo depois de conectar a conta — exatamente quando
 * a pessoa está decidindo se a integração funcionou.
 */
const ROTULO_SYNC: Record<string, string> = {
  ok: 'em dia',
  stale: 'atrasada',
  pending: 'aguardando 1ª carga',
  full_resync_required: 'recarga necessária',
  error: 'erro',
};

/**
 * Botão que copia um valor e confirma que copiou.
 *
 * Existe por causa do redirect URI: ele tem de ser colado no Google Cloud
 * CARACTERE POR CARACTERE, e digitar à mão é a origem clássica do
 * `redirect_uri_mismatch`. Selecionar texto numa `<dl>` é justo onde escapa um
 * espaço ou some a barra final.
 */
function BotaoCopiar({ valor, rotulo }: { valor: string; rotulo: string }) {
  const [copiou, setCopiou] = useState(false);

  // Sem isto o "Copiado!" fica congelado se o componente sair da tela antes do
  // timer disparar — e o próximo clique não daria feedback nenhum.
  useEffect(() => {
    if (!copiou) return;
    const t = window.setTimeout(() => setCopiou(false), 2000);
    return () => window.clearTimeout(t);
  }, [copiou]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiou(true);
    } catch {
      // clipboard exige contexto seguro e permissão; se falhar, seleciona o
      // texto para o usuário copiar no teclado em vez de não fazer nada.
      const el = document.getElementById(`gc-copiar-${rotulo}`);
      if (el) {
        const r = document.createRange();
        r.selectNodeContents(el);
        const s = window.getSelection();
        s?.removeAllRanges();
        s?.addRange(r);
      }
    }
  }

  return (
    <div className="gc-copiavel">
      <code id={`gc-copiar-${rotulo}`} className="gc-copiavel-valor">{valor}</code>
      <button type="button" className="gc-btn gc-btn-fantasma gc-btn-mini"
              onClick={() => void copiar()}
              aria-label={copiou ? `${rotulo} copiado` : `Copiar ${rotulo}`}>
        <Icone nome={copiou ? 'check' : 'copy'} tamanho={13} />
        {copiou ? 'Copiado!' : 'Copiar'}
      </button>
    </div>
  );
}

/**
 * A checklist do go-live.
 *
 * Desenha exatamente o que o backend manda em `status.golive`. Nenhuma regra de
 * "o que falta" vive aqui de propósito: a mesma lista alimenta o 503 da API e o
 * `php scripts/gcal-golive.php`. Se a tela decidisse por conta própria, as três
 * respostas divergiriam na primeira mudança.
 */
function ChecklistGoLive({ golive }: { golive: ResumoGoLive }) {
  const [aberto, setAberto] = useState<string | null>(
    // Já abre no primeiro passo pendente: é o que a pessoa veio fazer.
    golive.itens.find((i) => !i.ok)?.id ?? null
  );

  const marca = (i: PassoGoLive) =>
    i.ok ? { icone: 'check', classe: 'is-ok', texto: 'concluído' }
         : i.bloqueia ? { icone: 'alerta', classe: 'is-bloqueia', texto: 'pendente' }
                      : { icone: 'info', classe: 'is-aviso', texto: 'opcional agora' };

  return (
    <Cartao titulo="Passo a passo para ligar o Google Calendar"
            className={golive.pronto ? 'gc-golive is-pronto' : 'gc-golive'}>
      <div className="gc-golive-topo">
        <p className="gc-golive-resumo">
          {golive.pronto
            ? 'Tudo pronto. Falta apenas apontar GCAL_PROVIDER=google no .env.'
            : `${golive.concluidos} de ${golive.total} passos concluídos.`}
        </p>
        <div className="gc-golive-barra" role="progressbar"
             aria-valuenow={golive.concluidos} aria-valuemin={0} aria-valuemax={golive.total}
             aria-label="Progresso do go-live">
          <span style={{ width: `${(golive.concluidos / golive.total) * 100}%` }} />
        </div>
      </div>

      <ol className="gc-passos">
        {golive.itens.map((i, n) => {
          const m = marca(i);
          const expandido = aberto === i.id;
          return (
            <li key={i.id} className={`gc-passo ${m.classe}${expandido ? ' is-aberto' : ''}`}>
              <button type="button" className="gc-passo-cabeca"
                      aria-expanded={expandido}
                      onClick={() => setAberto(expandido ? null : i.id)}>
                <span className="gc-passo-marca" aria-hidden="true">
                  <Icone nome={m.icone} tamanho={14} />
                </span>
                <span className="gc-passo-num">{n + 1}</span>
                <span className="gc-passo-titulo">{i.titulo}</span>
                {/* O estado vai em TEXTO, não só na cor do ícone — daltônico e
                    leitor de tela precisam da mesma informação. */}
                <span className="gc-passo-estado">{m.texto}</span>
              </button>
              {expandido && (
                <div className="gc-passo-corpo">
                  <p className="gc-passo-detalhe">{i.detalhe}</p>
                  {!i.ok && (
                    <p className="gc-passo-resolver">
                      <strong>Como resolver:</strong> {i.resolver}
                    </p>
                  )}
                  {i.id === 'redirect' && (
                    <BotaoCopiar valor={golive.redirect_uri} rotulo="redirect-uri" />
                  )}
                  {i.id === 'oauth' && (
                    <div className="gc-passo-extra">
                      <span className="gc-passo-rotulo">Escopos que serão pedidos
                        (etapa <code>{golive.etapa_oauth}</code>):</span>
                      <ul className="gc-escopos">
                        {golive.escopos.map((e) => <li key={e}><code>{e}</code></li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </Cartao>
  );
}

/** Lê o resultado do callback OAuth, que volta no hash da URL. */
function lerRetornoOAuth(): { tipo: 'ok' | 'cancelado' | 'error'; texto: string } | null {
  const h = window.location.hash;
  const i = h.indexOf('?');
  if (i < 0) return null;
  const p = new URLSearchParams(h.slice(i + 1));
  const r = p.get('gcal_auth');
  if (!r) return null;
  if (r === 'ok') return { tipo: 'ok', texto: `Conta ${p.get('email') ?? ''} conectada.` };
  if (r === 'cancelado') return { tipo: 'cancelado', texto: 'Conexão cancelada na tela do Google.' };
  const motivo = p.get('detalhe') ?? p.get('reason') ?? 'motivo não informado';
  return { tipo: 'error', texto: `Não foi possível conectar: ${motivo}` };
}

export function Contas({ status }: { status?: StatusIntegracao }) {
  const qc = useQueryClient();
  const [erro, setErro] = useState<string | null>(null);
  const [retorno, setRetorno] = useState(() => lerRetornoOAuth());

  const q = useQuery({ queryKey: chaves.contas, queryFn: () => servico.getAccounts() });

  // Limpa o resultado do OAuth da URL depois de exibir. Sem isso, um F5 na tela
  // repetiria "conta conectada" para sempre — e um erro antigo continuaria em
  // cartaz depois de já ter sido resolvido.
  useEffect(() => {
    if (!retorno) return;
    const h = window.location.hash;
    const i = h.indexOf('?');
    if (i >= 0) window.history.replaceState(null, '', h.slice(0, i));
    if (retorno.tipo === 'ok') void qc.invalidateQueries();
  }, [retorno, qc]);

  const conectar = useMutation({
    mutationFn: () => servico.conectarConta(window.location.hash || undefined),
    onSuccess: (r) => {
      // Navegação de página inteira, não popup: o consentimento do Google
      // recusa iframe, e popup morre em bloqueador. O `redirect` levado no
      // state traz a pessoa de volta a esta mesma tela.
      window.location.assign(r.authorize_url);
    },
    onError: (e) => setErro(e instanceof ApiError ? e.message
      : 'Não foi possível iniciar a conexão.'),
  });

  const desconectar = useMutation({
    mutationFn: (id: number) => servico.desconectarConta(id),
    onSuccess: () => { setErro(null); void qc.invalidateQueries(); },
    onError: (e) => setErro(e instanceof ApiError ? e.message
      : 'Não foi possível desconectar a conta.'),
  });

  function aoConectar() {
    setErro(null);
    setRetorno(null);
    conectar.mutate();
  }

  if (q.isError) return <EstadoErro erro={q.error} onRetry={() => void q.refetch()} />;

  const contas = q.data?.contas ?? [];
  const golive = q.data?.golive ?? status?.golive;

  return (
    <div className="gc-tela">
      {retorno && (
        <p className={`gc-aviso gc-aviso-${retorno.tipo === 'ok' ? 'ok' : retorno.tipo === 'cancelado' ? 'info' : 'erro'}`}
           role="status">
          <Icone nome={retorno.tipo === 'ok' ? 'check' : 'info'} tamanho={14} /> {retorno.texto}
        </p>
      )}

      {/* A checklist vem ANTES do estado: quem abre esta tela sem conta
          conectada veio para ligar o módulo, não para ler um resumo. */}
      {golive && !golive.pronto && <ChecklistGoLive golive={golive} />}

      {status && (
        <Cartao titulo="Estado da integração">
          <dl className="gc-defs">
            <div><dt>Provedor</dt><dd>{status.mock ? 'Demonstração (mock)' : 'Google Calendar API'}</dd></div>
            <div><dt>Contas conectadas</dt><dd>{status.accounts}</dd></div>
            <div><dt>Calendários</dt><dd>{status.calendars}</dd></div>
            <div><dt>Escopos</dt><dd>{status.scopes.length ? status.scopes.join(', ') : '—'}</dd></div>
            <div><dt>Última sincronização</dt><dd>{desde(status.last_sync_at)}</dd></div>
          </dl>
        </Cartao>
      )}

      <Cartao titulo="Contas Google"
              acao={<button type="button" className="gc-btn gc-btn-primario"
                            onClick={aoConectar} disabled={conectar.isPending}>
                      <Icone nome="plus" tamanho={14} /> Conectar conta
                    </button>}>
        {erro && <p className="gc-aviso gc-aviso-erro" role="alert">{erro}</p>}
        {q.isLoading && <SkeletonBloco linhas={3} altura={60} />}
        {!q.isLoading && contas.length === 0 && (
          <EstadoVazio titulo="Nenhuma conta conectada"
                       mensagem="Conecte uma conta Google para ver seus calendários aqui." />
        )}
        <ul className="gc-contas">
          {contas.map((c) => (
            <li key={c.id} className={`gc-conta${c.connection_status !== 'connected' ? ' is-problema' : ''}`}>
              <div className="gc-conta-id">
                <span className={`gc-conta-ponto gc-conexao-${c.connection_status}`} aria-hidden="true" />
                <div>
                  <strong>{c.display_name}</strong>
                  {c.is_default && <span className="gc-tag">padrão</span>}
                  <span className="gc-tag">{c.account_type === 'workspace' ? 'corporativa' : 'pessoal'}</span>
                  <div className="gc-conta-email">{c.email}</div>
                </div>
              </div>
              <dl className="gc-conta-meta">
                <div><dt>Estado</dt><dd>{ROTULO_CONEXAO[c.connection_status] ?? c.connection_status}</dd></div>
                <div><dt>Escopos</dt><dd>{c.scopes}</dd></div>
                <div><dt>Última sincronização</dt><dd>{desde(c.last_sync_at)}</dd></div>
                {c.organization && <div><dt>Organização</dt><dd>{c.organization}</dd></div>}
              </dl>
              {c.last_error_message && (
                <p className="gc-aviso gc-aviso-erro">
                  <Icone nome="alerta" tamanho={13} /> {c.last_error_message}
                </p>
              )}
              <div className="gc-conta-acoes">
                <button type="button" className="gc-btn gc-btn-fantasma"
                        onClick={aoConectar} disabled={conectar.isPending}>
                  {c.connection_status === 'connected' ? 'Reconectar' : 'Reconectar agora'}
                </button>
                <button type="button" className="gc-btn gc-btn-fantasma gc-btn-perigo"
                        disabled={desconectar.isPending}
                        onClick={() => {
                          // Desconectar revoga o token no Google e apaga os
                          // eventos locais. É irreversível e não é o que a
                          // pessoa quer quando erra o clique em "Reconectar",
                          // que fica ao lado.
                          if (window.confirm(
                            `Desconectar ${c.email}?\n\n`
                            + 'O acesso será revogado no Google e os calendários e eventos '
                            + 'sincronizados desta conta serão removidos daqui. '
                            + 'Nada é apagado na agenda do Google.')) {
                            desconectar.mutate(c.id);
                          }
                        }}>
                  <Icone nome="trash" tamanho={13} /> Desconectar
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p className="gc-nota">
          Tokens ficam cifrados no servidor (AES-256-GCM) e nunca chegam ao navegador.
        </p>
      </Cartao>

      {/* Já pronto e ligado: a checklist vira comprovante, no fim e recolhida. */}
      {golive?.pronto && <ChecklistGoLive golive={golive} />}
    </div>
  );
}

export function Sincronizacao({ tz }: { tz: string }) {
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const q = useQuery({ queryKey: chaves.sync, queryFn: () => servico.getSync() });

  const rodar = useMutation({
    mutationFn: (completa: boolean) => servico.runSync({ completa }),
    onSuccess: (r) => {
      setErro(null);
      if (r.message) { setMsg(r.message); }
      else {
        // No modo real vem o resultado por conta. Dizer só "disparada" depois
        // de uma chamada síncrona que JÁ terminou esconde o que interessa:
        // quantos eventos entraram e se alguma conta falhou.
        const t = (r.contas ?? []).reduce(
          (a, c) => ({
            proc: a.proc + (c.processed ?? 0),
            novos: a.novos + (c.created ?? 0),
            atual: a.atual + (c.updated ?? 0),
          }), { proc: 0, novos: 0, atual: 0 });
        const falhas = (r.contas ?? []).filter((c) => !c.ok);
        setMsg(`${t.proc} evento(s) processado(s) · ${t.novos} novo(s) · ${t.atual} atualizado(s).`);
        if (falhas.length) {
          setErro(falhas.map((c) => `${c.email}: ${c.erro ?? 'falhou'}`).join(' | '));
        }
      }
      // Invalida TUDO, não só o estado de sync: a agenda, os KPIs e os
      // conflitos acabaram de mudar por baixo.
      void qc.invalidateQueries();
    },
    onError: (e) => {
      setMsg(null);
      setErro(e instanceof ApiError ? e.message : 'Falha ao disparar a sincronização.');
    },
  });

  if (q.isError) return <EstadoErro erro={q.error} onRetry={() => void q.refetch()} />;

  const itens = q.data?.calendarios ?? [];

  return (
    <div className="gc-tela">
      <Cartao titulo="Sincronização por calendário"
              acao={<>
                      <button type="button" className="gc-btn gc-btn-fantasma"
                              disabled={rodar.isPending}
                              title="Ignora o sync token e recarrega a janela inteira. Use quando algo parecer faltando."
                              onClick={() => rodar.mutate(true)}>
                        Recarga completa
                      </button>
                      <button type="button" className="gc-btn gc-btn-primario"
                              disabled={rodar.isPending} onClick={() => rodar.mutate(false)}>
                        <Icone nome="refresh" tamanho={14}
                               className={rodar.isPending ? 'gc-girando' : undefined} />
                        Sincronizar agora
                      </button>
                    </>}>
        {msg && <p className="gc-aviso gc-aviso-info" role="status">{msg}</p>}
        {erro && <p className="gc-aviso gc-aviso-erro" role="alert">{erro}</p>}
        {q.isLoading && <SkeletonBloco linhas={6} altura={30} />}

        {itens.length > 0 && (
          <div className="gc-grid-wrap">
            <table className="gc-grid gc-grid-compacta">
              <thead>
                <tr>
                  <th>Calendário</th><th>Estado</th><th>Última</th><th>Próxima</th>
                  <th>Duração</th><th>Proc.</th><th>Novos</th><th>Atual.</th><th>Exc.</th>
                  <th>Erros</th><th>Canal expira</th><th>Sync token</th>
                </tr>
              </thead>
              <tbody>
                {/* `pending` não é problema: é fila, não falha. */}
                {itens.map((s) => (
                  <tr key={s.calendar_id}
                      className={s.status !== 'ok' && s.status !== 'pending' ? 'is-atencao' : undefined}>
                    <td className="gc-td-forte" title={s.calendar_id}>
                      {s.calendar_summary ?? s.calendar_id}
                    </td>
                    <td>
                      <span className={`gc-tag gc-sync-${s.status}`}>
                        {ROTULO_SYNC[s.status] ?? s.status}
                      </span>
                    </td>
                    <td title={dataHora(s.last_sync_at, tz)}>
                      {s.nunca_sincronizado ? '—' : desde(s.last_sync_at)}
                    </td>
                    <td>{dataHora(s.next_sync_at, tz)}</td>
                    <td>{s.duration_ms} ms</td>
                    <td>{s.processed}</td>
                    <td>{s.created}</td>
                    <td>{s.updated}</td>
                    <td>{s.deleted}</td>
                    <td className={s.errors > 0 ? 'gc-td-erro' : undefined}>{s.errors}</td>
                    <td>{dataHora(s.channel_expires_at, tz)}</td>
                    <td className="gc-td-fraco">{s.sync_token}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="gc-nota">
          O sync token aparece mascarado de propósito: ele autoriza ler o delta de uma agenda
          inteira e não deve trafegar para o navegador nem para os logs.
        </p>
      </Cartao>

      <FilaEPush fila={q.data?.fila ?? []} canais={q.data?.canais ?? []}
                 configurado={q.data?.pushConfigurado ?? false} tz={tz} />
    </div>
  );
}

const ROTULO_JOB: Record<string, string> = {
  incremental: 'delta (incremental)',
  full: 'carga completa',
  watch_renew: 'renovação de canal',
  reconcile: 'reconciliação',
};

/**
 * Fila de sincronização e canais push (Fase 5).
 *
 * Some inteiro no mock: o backend devolve listas vazias e `pushConfigurado`
 * falso porque não HÁ fila rodando. Desenhar um cartão "0 jobs · tudo em dia"
 * ali diria que a infraestrutura está saudável quando ela nem existe.
 */
function FilaEPush({ fila, canais, configurado, tz }: {
  fila: LinhaFila[]; canais: CanalPush[]; configurado: boolean; tz: string;
}) {
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const religar = useMutation({
    mutationFn: () => servico.religarCanais(),
    onSuccess: (r) => {
      setErro(null);
      setMsg(`${r.abertos} canal(is) aberto(s) em ${r.contas} conta(s)`
           + (r.falhas ? ` · ${r.falhas} falha(s)` : ''));
      void qc.invalidateQueries({ queryKey: chaves.sync });
    },
    onError: (e) => {
      setMsg(null);
      setErro(e instanceof ApiError ? e.message : 'Não foi possível abrir os canais.');
    },
  });

  if (!configurado && fila.length === 0 && canais.length === 0) return null;

  const mortos = fila.filter((f) => f.status === 'dead').reduce((a, f) => a + Number(f.n), 0);
  const naFila = fila.filter((f) => f.status !== 'dead').reduce((a, f) => a + Number(f.n), 0);

  // Canal expirado ainda aparece na lista até o cron parar; marcar em texto
  // evita que ele passe por cobertura ativa.
  const vencido = (c: CanalPush) => new Date(c.expiration).getTime() < Date.now();

  return (
    <Cartao titulo="Fila e notificações push"
            acao={<button type="button" className="gc-btn gc-btn-fantasma"
                          disabled={religar.isPending}
                          title="Abre um canal de notificação para cada calendário sem cobertura."
                          onClick={() => religar.mutate()}>
                    <Icone nome="refresh" tamanho={13}
                           className={religar.isPending ? 'gc-girando' : undefined} />
                    Religar canais
                  </button>}>
      {msg && <p className="gc-aviso gc-aviso-ok" role="status">{msg}</p>}
      {erro && <p className="gc-aviso gc-aviso-erro" role="alert">{erro}</p>}

      {mortos > 0 && (
        <p className="gc-aviso gc-aviso-erro" role="alert">
          <Icone nome="alerta" tamanho={13} /> {mortos} job(s) desistiram após 6 tentativas.
          Retry não resolve — ver <code>gcal_sync_jobs</code> com <code>status='dead'</code>.
        </p>
      )}

      <dl className="gc-defs">
        <div><dt>Jobs na fila</dt><dd>{naFila}</dd></div>
        <div><dt>Canais ativos</dt><dd>{canais.length}</dd></div>
        <div><dt>Notificação push</dt>
          <dd>{configurado ? 'configurada' : 'sem URL pública (só o fallback de 15 min)'}</dd></div>
      </dl>

      {fila.length > 0 && (
        <>
          <h4 className="gc-sub">Fila</h4>
          <ul className="gc-fila">
            {fila.map((f) => (
              <li key={`${f.status}-${f.kind}`} className={`gc-fila-item is-${f.status}`}>
                <span className="gc-fila-n">{f.n}</span>
                <span className="gc-fila-kind">{ROTULO_JOB[f.kind] ?? f.kind}</span>
                <span className="gc-fila-status">{f.status}</span>
                {f.proxima && <span className="gc-fila-quando">a partir de {dataHora(f.proxima, tz)}</span>}
              </li>
            ))}
          </ul>
        </>
      )}

      {canais.length > 0 && (
        <>
          <h4 className="gc-sub">Canais abertos</h4>
          <ul className="gc-fila">
            {canais.map((c) => (
              <li key={c.channel_id} className={`gc-fila-item${vencido(c) ? ' is-dead' : ''}`}>
                <span className="gc-fila-kind">{c.calendar_id}</span>
                <span className="gc-fila-status">{vencido(c) ? 'expirado' : 'ativo'}</span>
                <span className="gc-fila-quando">expira {dataHora(c.expiration, tz)}</span>
                <code className="gc-fila-id">{c.channel_id}</code>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="gc-nota">
        Push é otimização, não garantia: canal expira em ~1 semana e a entrega pode falhar.
        O fallback a cada 15 minutos continua rodando de qualquer forma.
      </p>
    </Cartao>
  );
}

export function Configuracoes({ prefs, tzEfetivo, onMudar }: {
  prefs: Preferencias; tzEfetivo: string; onMudar: (p: Partial<Preferencias>) => void;
}) {
  const fusosComuns = [
    'America/Sao_Paulo', 'America/New_York', 'Europe/Lisbon', 'Europe/Madrid',
    'Asia/Shanghai', 'Asia/Dubai', 'UTC',
  ];

  return (
    <div className="gc-tela gc-tela-config">
      <Cartao titulo="Expediente">
        <p className="gc-nota">
          Define o horário útil na agenda, o cálculo de tempo livre e o que a busca
          de disponibilidade considera fora do expediente.
        </p>
        <div className="gc-form-linha">
          <label className="gc-campo">
            <span>Início</span>
            <select value={prefs.expedienteInicio}
                    onChange={(e) => onMudar({ expedienteInicio: Number(e.target.value) })}>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </label>
          <label className="gc-campo">
            <span>Fim</span>
            <select value={prefs.expedienteFim}
                    onChange={(e) => onMudar({ expedienteFim: Number(e.target.value) })}>
              {Array.from({ length: 24 }, (_, h) => h + 1).map((h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </label>
          <label className="gc-check">
            <input type="checkbox" checked={prefs.evitarAlmoco}
                   onChange={(e) => onMudar({ evitarAlmoco: e.target.checked })} />
            <span>Evitar o horário de almoço ao sugerir horários</span>
          </label>
        </div>
      </Cartao>

      <Cartao titulo="Fuso horário">
        <p className="gc-nota">
          O fuso de exibição vem do seu navegador. A conversão acontece sempre aqui, no
          cliente — o servidor guarda tudo em UTC.
        </p>
        <div className="gc-form-linha">
          <label className="gc-campo">
            <span>Fuso principal</span>
            <select value={prefs.fuso || ''}
                    onChange={(e) => onMudar({ fuso: e.target.value })}>
              <option value="">Automático ({rotuloFuso(tzEfetivo)})</option>
              {fusosComuns.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label className="gc-campo">
            <span>Segundo fuso (exibição dupla)</span>
            <select value={prefs.fusoSecundario ?? ''}
                    onChange={(e) => onMudar({ fusoSecundario: e.target.value || null })}>
              <option value="">Não exibir</option>
              {fusosComuns.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
        </div>
        <p className="gc-nota">
          O segundo horário só aparece quando é de fato diferente do principal —
          repetir o mesmo valor seria ruído.
        </p>
      </Cartao>

      <Cartao titulo="Agenda">
        <label className="gc-campo">
          <span>Visão padrão</span>
          <select value={prefs.visaoAgenda}
                  onChange={(e) => onMudar({ visaoAgenda: e.target.value as Preferencias['visaoAgenda'] })}>
            <option value="timeGridDay">Dia</option>
            <option value="timeGridWeek">Semana</option>
            <option value="dayGridMonth">Mês</option>
          </select>
        </label>
      </Cartao>

      <Cartao titulo="Atalhos de teclado">
        <p className="gc-nota">
          Funcionam quando o foco não está num campo de texto — digitar "n" no título de um
          evento não troca de tela.
        </p>
        <dl className="gc-atalhos">
          {ATALHOS.map((a) => (
            <div key={a.tecla}>
              <kbd>{a.tecla}</kbd>
              <span>{a.descricao}</span>
            </div>
          ))}
        </dl>
      </Cartao>

      <Cartao titulo="Sobre este módulo">
        <dl className="gc-defs">
          <div><dt>Fase</dt><dd>2 — base visual e mocks</dd></div>
          <div><dt>Documentação</dt><dd>docs/GOOGLE-CALENDAR/</dd></div>
          <div><dt>Preferências</dt><dd>salvas neste navegador</dd></div>
        </dl>
        <p className="gc-nota">
          Arrastar e redimensionar eventos, editor visual de recorrência e visão de recursos
          em linha do tempo entram na Fase 3 — dependem de plugins do FullCalendar que ainda
          não estão instalados (um deles é licença comercial).
        </p>
      </Cartao>
    </div>
  );
}
