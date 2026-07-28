// app/App.tsx — raiz do painel Anúncios (Consultor Google Ads / Decision Engine).
// @version 2.0.0  @created 2026-07-27
//
// v2.0.0 (Workspace Fase 1): resposta estruturada (components/Resposta),
// tela inicial densa (components/Inicio), composer com autosize + modos de
// resposta + cancelar geração, feedback com motivos, ícones Lucide.
// v1.1.0: conversas persistentes, memória multi-turno, feedback 👍/👎.
import { useEffect, useRef, useState } from 'react';
import {
  BarChart3, Brain, History as HistoryIcon, MessageSquareText,
  Plus, RefreshCw, Send, Square,
} from 'lucide-react';
import {
  perguntar, perguntarStream, listarConversas, carregarConversa,
  enviarFeedback, carregarStats, ApiError,
} from '../lib/api';
import { BlocoResposta, rotuloDominio } from '../components/Resposta';
import { Inicio } from '../components/Inicio';
import type {
  ShellConfig, Turno, AskResposta, Conversa, Feedback,
  MensagemPersistida, Stats, StatsLinha,
} from '../shell/types';
import '../styles/tokens.css';

type Estilo = 'rapida' | 'executiva' | 'completa';

const ESTILOS: { id: Estilo; rotulo: string; dica: string }[] = [
  { id: 'rapida', rotulo: 'Rápida', dica: 'Resposta curta e direta (resumo + próximos passos).' },
  { id: 'executiva', rotulo: 'Executiva', dica: 'Foco em decisão: resumo, recomendações priorizadas e próximos passos.' },
  { id: 'completa', rotulo: 'Completa', dica: 'Análise completa: diagnóstico, recomendações, plano e fontes.' },
];

/** Converte mensagens persistidas (conversas.php?id=N) em turnos da tela. */
function mensagensParaTurnos(mensagens: MensagemPersistida[]): Turno[] {
  const turnos: Turno[] = [];
  let seq = 1;
  for (const m of mensagens) {
    if (m.role === 'user') {
      turnos.push({ id: seq++, pergunta: m.content, estado: 'ok' });
    } else {
      const alvo = turnos[turnos.length - 1];
      if (alvo && !alvo.resposta) {
        alvo.resposta = {
          conversa_id: 0,
          message_id: m.id,
          mode: m.mode === 'consultant' ? 'consultant' : 'retrieval_only',
          answer: m.content !== '' ? m.content : null,
          units: m.units,
          query: alvo.pergunta,
        };
        alvo.feedback = m.feedback;
      }
    }
  }
  return turnos;
}

function fmtData(mysqlDt: string): string {
  const d = new Date(mysqlDt.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return mysqlDt;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function HistoricoMenu({ onAbrir, ocupado }: {
  onAbrir: (id: number) => void;
  ocupado: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [lista, setLista] = useState<Conversa[] | null>(null);
  const [erro, setErro] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const alternar = async () => {
    const v = !open;
    setOpen(v);
    if (v) {
      setErro(false); setLista(null);
      try { setLista(await listarConversas()); } catch { setErro(true); setLista([]); }
    }
  };

  return (
    <div className="anx-histmenu" ref={ref}>
      <button className="anx-topbtn" onClick={() => void alternar()} disabled={ocupado}
        aria-expanded={open} title="Conversas anteriores">
        <HistoryIcon size={14} aria-hidden /> Histórico
      </button>
      {open && (
        <div className="anx-histmenu-drop" role="listbox">
          {lista === null && <div className="anx-histmenu-note"><span className="anx-spinner" /> Carregando…</div>}
          {erro && <div className="anx-histmenu-note">Não foi possível carregar o histórico.</div>}
          {lista !== null && !erro && lista.length === 0 && (
            <div className="anx-histmenu-note">Nenhuma conversa salva ainda.</div>
          )}
          {lista !== null && lista.map((c) => (
            <button key={c.id} className="anx-histmenu-item"
              onClick={() => { setOpen(false); onAbrir(c.id); }} role="option" aria-selected={false}>
              <span className="anx-histmenu-title">{c.titulo || `Conversa #${c.id}`}</span>
              <span className="anx-histmenu-meta">{fmtData(c.updated_at)} · {c.perguntas} pergunta{c.perguntas === 1 ? '' : 's'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Linha de pergunta+resposta nas listas do aprendizado. */
function LinhaAprendizado({ linha, mostrarFeedback }: { linha: StatsLinha; mostrarFeedback?: boolean }) {
  return (
    <div className="anx-learn-row">
      <div className="anx-learn-row-q">
        {mostrarFeedback && linha.feedback !== null && (
          <span aria-hidden>{linha.feedback === 1 ? '👍 ' : '👎 '}</span>
        )}
        {linha.pergunta || '(pergunta não localizada)'}
      </div>
      {linha.resposta && <div className="anx-learn-row-a">{linha.resposta}{linha.resposta.length >= 300 ? '…' : ''}</div>}
      {linha.comment && <div className="anx-learn-row-c">💬 {linha.comment}</div>}
      <div className="anx-learn-row-meta">
        {fmtData(linha.created_at)}
        {linha.mode ? ` · ${linha.mode === 'consultant' ? 'Consultor IA' : 'Recuperação'}` : ''}
      </div>
    </div>
  );
}

function AprendizadoScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [erro, setErro] = useState(false);

  const carregar = async () => {
    setErro(false); setStats(null);
    try { setStats(await carregarStats()); } catch { setErro(true); }
  };
  useEffect(() => { void carregar(); }, []);

  if (erro) return <div className="anx-error" style={{ margin: 24 }}>⚠️ Não foi possível carregar os dados de aprendizado.</div>;
  if (!stats) return <div className="anx-loading" style={{ padding: 24 }}><span className="anx-spinner" /> Carregando…</div>;

  const t = stats.totais;
  const avaliadas = t.positivas + t.negativas;
  const maxCit = Math.max(1, ...stats.dominios.map((d) => d.citacoes));

  return (
    <div className="anx-learn">
      <div className="anx-learn-head">
        <h2>Aprendizado contínuo</h2>
        <p>O que a equipe pergunta, onde a metodologia responde bem e onde há lacunas (Fase 22).</p>
      </div>

      <div className="anx-tiles">
        <div className="anx-tile"><span className="anx-tile-n">{t.perguntas}</span><span className="anx-tile-l">Perguntas</span></div>
        <div className="anx-tile"><span className="anx-tile-n">{t.conversas}</span><span className="anx-tile-l">Conversas</span></div>
        <div className="anx-tile"><span className="anx-tile-n">👍 {t.positivas}</span><span className="anx-tile-l">Úteis</span></div>
        <div className="anx-tile"><span className="anx-tile-n">👎 {t.negativas}</span><span className="anx-tile-l">A melhorar</span></div>
        <div className="anx-tile"><span className="anx-tile-n">{t.sem_cobertura}</span><span className="anx-tile-l">Sem cobertura</span></div>
        <div className="anx-tile"><span className="anx-tile-n">{avaliadas > 0 ? Math.round((t.positivas / avaliadas) * 100) + '%' : '—'}</span><span className="anx-tile-l">Aprovação</span></div>
      </div>

      {stats.dominios.length > 0 && (
        <section className="anx-learn-sec">
          <h3>Domínios mais consultados <span className="anx-learn-sub">citações nas últimas respostas</span></h3>
          <div className="anx-bars">
            {stats.dominios.map((d) => (
              <div key={d.dominio} className="anx-bar-row">
                <span className="anx-bar-label">{rotuloDominio(d.dominio)}</span>
                <span className="anx-bar-track" aria-hidden>
                  <span className="anx-bar-fill" style={{ width: `${Math.max(2, Math.round((d.citacoes / maxCit) * 100))}%` }} />
                </span>
                <span className="anx-bar-value">{d.citacoes}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="anx-learn-sec">
        <h3>Respostas marcadas com 👎 <span className="anx-learn-sub">lacunas confirmadas — candidatas a novas regras</span></h3>
        {stats.negativas.length === 0
          ? <p className="anx-learn-empty">Nenhuma até agora. 🎉</p>
          : stats.negativas.map((l) => <LinhaAprendizado key={l.message_id} linha={l} />)}
      </section>

      <section className="anx-learn-sec">
        <h3>Perguntas sem cobertura <span className="anx-learn-sub">a busca não encontrou nenhuma unidade</span></h3>
        {stats.sem_cobertura.length === 0
          ? <p className="anx-learn-empty">Nenhuma — a base cobriu tudo que foi perguntado.</p>
          : stats.sem_cobertura.map((l) => <LinhaAprendizado key={l.message_id} linha={l} />)}
      </section>

      <section className="anx-learn-sec">
        <h3>Últimas perguntas</h3>
        {stats.recentes.length === 0
          ? <p className="anx-learn-empty">Ainda não há perguntas registradas.</p>
          : stats.recentes.map((l) => <LinhaAprendizado key={l.message_id} linha={l} mostrarFeedback />)}
      </section>

      <button className="anx-topbtn" onClick={() => void carregar()}>
        <RefreshCw size={14} aria-hidden /> Atualizar
      </button>
    </div>
  );
}

function Shell({ config }: { config: ShellConfig }) {
  void config;
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [texto, setTexto] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [modo, setModo] = useState<string | null>(null);
  const [conversaId, setConversaId] = useState<number | null>(null);
  const [tela, setTela] = useState<'chat' | 'aprendizado'>('chat');
  const [estilo, setEstilo] = useState<Estilo>('completa');
  const proximoId = useRef(1);
  const fimRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turnos]);

  // Autosize do composer.
  const ajustarAltura = () => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };
  useEffect(ajustarAltura, [texto]);

  // Atalho "/" foca o campo de pergunta.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const emCampo = alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable);
      if (e.key === '/' && !emCampo) { e.preventDefault(); areaRef.current?.focus(); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const enviar = async (pergunta: string) => {
    const q = pergunta.trim();
    if (q.length < 3 || ocupado) return;
    const id = proximoId.current++;
    setTurnos((t) => [...t, { id, pergunta: q, estado: 'carregando' }]);
    setTexto('');
    setOcupado(true);
    setTela('chat');

    const controller = new AbortController();
    abortRef.current = controller;

    const concluir = (resposta: AskResposta) => {
      setModo(resposta.mode);
      setConversaId(resposta.conversa_id);
      setTurnos((t) => t.map((x) => (
        x.id === id ? { ...x, estado: 'ok', resposta, feedback: null } : x
      )));
    };
    const falhar = (e: unknown) => {
      if (controller.signal.aborted) {
        setTurnos((t) => t.map((x) => (
          x.id === id ? { ...x, estado: 'erro', erro: 'Geração cancelada. A pergunta não foi salva no histórico.' } : x
        )));
        return;
      }
      const msg = e instanceof ApiError
        ? (e.ehAuth ? 'Sessão expirada — recarregue a página e entre novamente.' : e.message)
        : 'Erro inesperado ao consultar o Decision Engine.';
      setTurnos((t) => t.map((x) => (x.id === id ? { ...x, estado: 'erro', erro: msg } : x)));
    };

    let metaRecebida = false;
    try {
      // Caminho preferido: streaming (resposta aparece enquanto é gerada).
      const resposta = await perguntarStream(q, conversaId, {
        onMeta: (m) => {
          metaRecebida = true;
          setModo(m.mode);
          setTurnos((t) => t.map((x) => (
            x.id === id
              ? {
                  ...x,
                  estado: 'ok',
                  feedback: null,
                  resposta: {
                    conversa_id: conversaId ?? 0,
                    message_id: 0, // feedback habilita no evento saved
                    mode: m.mode,
                    answer: m.mode === 'consultant' ? '' : null,
                    units: m.units,
                    query: m.query,
                  },
                }
              : x
          )));
        },
        onDelta: (textoDelta) => {
          setTurnos((t) => t.map((x) => (
            x.id === id && x.resposta
              ? { ...x, resposta: { ...x.resposta, answer: (x.resposta.answer ?? '') + textoDelta } }
              : x
          )));
        },
      }, { style: estilo }, controller.signal);
      concluir(resposta);
    } catch (e) {
      if (!metaRecebida && !controller.signal.aborted) {
        // Streaming indisponível: cai no fluxo tradicional de forma transparente.
        try { concluir(await perguntar(q, conversaId, { style: estilo }, controller.signal)); }
        catch (e2) { falhar(e2); }
      } else {
        falhar(e);
      }
    } finally {
      abortRef.current = null;
      setOcupado(false);
      areaRef.current?.focus();
    }
  };

  const cancelar = () => { abortRef.current?.abort(); };

  const novaConversa = () => {
    if (ocupado) return;
    setTurnos([]);
    setConversaId(null);
    proximoId.current = 1;
    setTela('chat');
    areaRef.current?.focus();
  };

  const abrirConversa = async (id: number) => {
    if (ocupado) return;
    setOcupado(true);
    setTela('chat');
    try {
      const { mensagens } = await carregarConversa(id);
      const carregados = mensagensParaTurnos(mensagens);
      setTurnos(carregados);
      setConversaId(id);
      proximoId.current = carregados.length + 1;
      const ultimo = [...carregados].reverse().find((t) => t.resposta);
      if (ultimo?.resposta) setModo(ultimo.resposta.mode);
    } catch {
      /* mantém a tela atual */
    } finally {
      setOcupado(false);
    }
  };

  const darFeedback = async (turnoId: number, valor: 1 | -1) => {
    const turno = turnos.find((t) => t.id === turnoId);
    const messageId = turno?.resposta?.message_id;
    if (!turno || !messageId) return;
    const atual: Feedback = turno.feedback ?? null;
    const novo: Feedback = atual === valor ? null : valor;
    setTurnos((t) => t.map((x) => (x.id === turnoId ? { ...x, feedback: novo } : x)));
    try {
      await enviarFeedback(messageId, novo ?? 0);
    } catch {
      setTurnos((t) => t.map((x) => (x.id === turnoId ? { ...x, feedback: atual } : x)));
    }
  };

  const darMotivo = (turnoId: number, motivo: string) => {
    const messageId = turnos.find((t) => t.id === turnoId)?.resposta?.message_id;
    if (!messageId) return;
    enviarFeedback(messageId, -1, motivo).catch(() => { /* silencioso */ });
  };

  return (
    <div className="anx-shell">
      <div className="anx-topbar">
        <div className="anx-brand-wrap">
          <span className="anx-breadcrumb">Google Ads › Inteligência</span>
          <span className="anx-brand">
            <span className="anx-brand-mark" aria-hidden><Brain size={15} /></span>
            Consultor de Anúncios
            <span className="anx-badge-ia">IA</span>
          </span>
        </div>
        <span className="anx-sub">Decision Engine · metodologia Dshow (~1.500 regras)</span>
        <div className="anx-topbar-right">
          {modo && (
            <span className={`anx-mode-pill${modo === 'consultant' ? ' is-ai' : ''}`}
              title={modo === 'consultant'
                ? 'Respostas consultivas geradas com IA, fundamentadas na metodologia.'
                : 'Sem chave de IA no servidor: retornando apenas as unidades da metodologia.'}>
              {modo === 'consultant' ? '✦ Consultor IA' : '📚 Recuperação'}
            </span>
          )}
          <button className={`anx-topbtn${tela === 'aprendizado' ? ' is-on' : ''}`}
            onClick={() => setTela((v) => (v === 'chat' ? 'aprendizado' : 'chat'))}
            title="Uso, avaliações e lacunas da metodologia">
            {tela === 'chat'
              ? <><BarChart3 size={14} aria-hidden /> Aprendizado</>
              : <><MessageSquareText size={14} aria-hidden /> Voltar ao chat</>}
          </button>
          <HistoricoMenu onAbrir={(id) => void abrirConversa(id)} ocupado={ocupado} />
          <button className="anx-topbtn anx-topbtn-primary" onClick={novaConversa}
            disabled={ocupado || turnos.length === 0} title="Começar uma conversa nova">
            <Plus size={14} aria-hidden /> Nova conversa
          </button>
        </div>
      </div>

      {tela === 'aprendizado' && (
        <div className="anx-scroll"><AprendizadoScreen /></div>
      )}
      {tela === 'chat' && (<>
      <div className="anx-scroll">
        <div className="anx-col">
          {turnos.length === 0 && (
            <Inicio
              onUsarTemplate={(t) => { setTexto(t); areaRef.current?.focus(); }}
              onAbrirConversa={(id) => void abrirConversa(id)}
            />
          )}

          {turnos.map((t) => (
            <div key={t.id} className="anx-turn">
              <div className="anx-question"><span className="anx-q-ic" aria-hidden>Você</span>{t.pergunta}</div>
              {t.estado === 'carregando' && (
                <div className="anx-loading"><span className="anx-spinner" /> Consultando a metodologia…</div>
              )}
              {t.estado === 'erro' && <div className="anx-error">⚠️ {t.erro}</div>}
              {t.estado === 'ok' && t.resposta && (
                <BlocoResposta
                  resposta={t.resposta}
                  feedback={t.feedback ?? null}
                  onFeedback={(valor) => void darFeedback(t.id, valor)}
                  onMotivo={(motivo) => darMotivo(t.id, motivo)}
                />
              )}
            </div>
          ))}
          <div ref={fimRef} />
        </div>
      </div>

      <div className="anx-composer">
        <div className="anx-composer-top">
          <div className="anx-estilos" role="tablist" aria-label="Modo de resposta">
            {ESTILOS.map((e) => (
              <button key={e.id} className={`anx-estilo${estilo === e.id ? ' is-on' : ''}`}
                onClick={() => setEstilo(e.id)} title={e.dica} role="tab" aria-selected={estilo === e.id}>
                {e.rotulo}
              </button>
            ))}
          </div>
          <span className="anx-composer-count">{texto.length > 0 ? `${texto.length}/2000` : ''}</span>
        </div>
        <div className="anx-composer-inner">
          <textarea
            ref={areaRef}
            className="anx-input"
            placeholder="Pergunte sobre campanhas, palavras-chave, landing pages, lances…  (Enter envia · Shift+Enter quebra linha · / foca)"
            value={texto}
            rows={2}
            maxLength={2000}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void enviar(texto); }
            }}
            disabled={ocupado}
          />
          {ocupado ? (
            <button className="anx-send anx-send-stop" onClick={cancelar} title="Cancelar geração">
              <Square size={15} aria-hidden />
            </button>
          ) : (
            <button className="anx-send" onClick={() => void enviar(texto)}
              disabled={texto.trim().length < 3} title="Enviar pergunta">
              <Send size={16} aria-hidden />
            </button>
          )}
        </div>
        <p className="anx-hint">
          As respostas citam as unidades da metodologia (ex.: F13 · Q865) e nunca inventam dados da sua conta.
        </p>
      </div>
      </>)}
    </div>
  );
}

export function App({ config }: { config: ShellConfig }) {
  return <Shell config={config} />;
}
