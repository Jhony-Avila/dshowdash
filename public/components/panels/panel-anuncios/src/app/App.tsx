// app/App.tsx — raiz do painel Anúncios (Consultor Google Ads / Decision Engine).
// @version 1.1.0  @created 2026-07-27
//
// UI de perguntas e respostas sobre a metodologia Dshow de Google Ads
// (~1.500 regras). Fluxo: pergunta → proxy /api/anuncios/ask.php → Decision
// Engine (retrieval BM25 + modo consultor com citações [id]).
// v1.1.0: conversas persistentes (histórico no MySQL via proxy), memória
// multi-turno (o servidor monta o contexto) e feedback 👍/👎 por resposta
// (Fase 22 — aprendizado contínuo).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  perguntar, listarConversas, carregarConversa, enviarFeedback, ApiError,
} from '../lib/api';
import type {
  ShellConfig, Turno, Unidade, AskResposta, Conversa, Feedback, MensagemPersistida,
} from '../shell/types';
import '../styles/tokens.css';

const SUGESTOES = [
  'Como avaliar se uma landing page está pronta para receber tráfego?',
  'Quais problemas levam uma igreja a procurar um painel de LED?',
  'Como diagnosticar uma campanha com CTR bom e conversão baixa?',
  'Quando devo usar CPA desejado em vez de maximizar conversões?',
];

const ROTULO_DOMINIO: Record<string, string> = {
  methodology: 'Metodologia', measurement: 'Mensuração', google_ads: 'Google Ads',
  keywords: 'Palavras-chave', ads: 'Anúncios', landing_pages: 'Landing Pages',
  metrics: 'Métricas', bidding: 'Lances', orchestration: 'Orquestração',
  cognitive_architecture: 'Arquitetura Cognitiva', dshow_products: 'Produtos Dshow',
  dshow_technologies: 'Tecnologias Dshow', dshow_segments: 'Segmentos Dshow',
  commercial_qualification: 'Qualificação Comercial', rag: 'RAG',
  testing: 'Testes', continuous_learning: 'Aprendizado Contínuo',
};

function rotuloDominio(d: string): string {
  return ROTULO_DOMINIO[d] ?? d;
}

/** Renderiza texto do consultor: parágrafos, negrito **x**, itens "- " e citações [id]. */
function TextoResposta({ texto }: { texto: string }) {
  const blocos = texto.split(/\n{2,}/);
  return (
    <div className="anx-answer-text">
      {blocos.map((bloco, i) => {
        const linhas = bloco.split('\n');
        const ehLista = linhas.length > 1 && linhas.every((l) => /^\s*[-•*]\s+/.test(l) || l.trim() === '');
        if (ehLista) {
          return (
            <ul key={i}>
              {linhas.filter((l) => l.trim() !== '').map((l, j) => (
                <li key={j}>{renderInline(l.replace(/^\s*[-•*]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{linhas.map((l, j) => (
          <span key={j}>{j > 0 && <br />}{renderInline(l)}</span>
        ))}</p>;
      })}
    </div>
  );
}

/** Inline: citações [fase-...] viram chips; **negrito** vira <strong>. */
function renderInline(linha: string): ReactNode[] {
  const partes: ReactNode[] = [];
  const re = /\[((?:fase|q)[^\]]*)\]|\*\*([^*]+)\*\*/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(linha)) !== null) {
    if (m.index > ultimo) partes.push(linha.slice(ultimo, m.index));
    if (m[1] !== undefined) {
      partes.push(<span key={`c${k++}`} className="anx-cite" title={m[1]}>{resumoCitacao(m[1])}</span>);
    } else {
      partes.push(<strong key={`b${k++}`}>{m[2]}</strong>);
    }
    ultimo = m.index + m[0].length;
  }
  if (ultimo < linha.length) partes.push(linha.slice(ultimo));
  return partes;
}

/** "fase-13__bloco-b__q-0865__ab12cd34" -> "F13 · Q865". */
function resumoCitacao(id: string): string {
  const m = id.match(/fase-(\d+).*q-0*(\d+)/);
  return m ? `F${Number(m[1])} · Q${m[2]}` : id.slice(0, 18);
}

function CartaoUnidade({ unidade, aberto }: { unidade: Unidade; aberto?: boolean }) {
  const [expandido, setExpandido] = useState(!!aberto);
  const s = unidade.source;
  return (
    <div className={`anx-unit${expandido ? ' is-open' : ''}`}>
      <button className="anx-unit-head" onClick={() => setExpandido((v) => !v)} aria-expanded={expandido}>
        <span className="anx-unit-q">{unidade.question}</span>
        <span className="anx-unit-badges">
          <span className="anx-badge anx-badge-dom">{rotuloDominio(unidade.domain)}</span>
          {unidade.segment && <span className="anx-badge anx-badge-seg">{unidade.segment}</span>}
          <span className="anx-badge">F{s.logical_phase} · Q{s.question_number}</span>
        </span>
        <span className="anx-unit-caret" aria-hidden>{expandido ? '▾' : '▸'}</span>
      </button>
      {expandido && (
        <div className="anx-unit-body">
          <p className="anx-unit-answer">{unidade.answer}</p>
          {unidade.operational_rule && (
            <p className="anx-unit-rule"><strong>Regra operacional:</strong> {unidade.operational_rule}</p>
          )}
          <p className="anx-unit-origin">
            Origem: {s.file} (linhas {s.line_start}–{s.line_end}) · <code>{unidade.id}</code>
          </p>
        </div>
      )}
    </div>
  );
}

function BlocoResposta({ resposta, feedback, onFeedback }: {
  resposta: AskResposta;
  feedback: Feedback;
  onFeedback: (valor: 1 | -1) => void;
}) {
  const [mostrarFontes, setMostrarFontes] = useState(resposta.mode === 'retrieval_only');
  return (
    <div className="anx-answer">
      {resposta.mode === 'consultant' && resposta.answer ? (
        <TextoResposta texto={resposta.answer} />
      ) : (
        <p className="anx-retrieval-note">
          Modo recuperação: exibindo as unidades mais relevantes da metodologia.
          Para respostas consultivas com IA, configure a chave da Anthropic no servidor.
        </p>
      )}
      {resposta.units.length > 0 && (
        <div className="anx-sources">
          <button className="anx-sources-toggle" onClick={() => setMostrarFontes((v) => !v)}>
            {mostrarFontes ? '▾' : '▸'} Fontes da metodologia ({resposta.units.length})
          </button>
          {mostrarFontes && (
            <div className="anx-sources-list">
              {resposta.units.map((u, i) => (
                <CartaoUnidade key={u.id} unidade={u} aberto={resposta.mode === 'retrieval_only' && i === 0} />
              ))}
            </div>
          )}
        </div>
      )}
      {resposta.units.length === 0 && (
        <p className="anx-retrieval-note">Nenhuma unidade da metodologia cobre esta pergunta.</p>
      )}
      {resposta.message_id > 0 && (
        <div className="anx-fbrow" role="group" aria-label="Avaliar resposta">
          <span className="anx-fb-label">Esta resposta ajudou?</span>
          <button className={`anx-fb${feedback === 1 ? ' is-on' : ''}`}
            onClick={() => onFeedback(1)} title="Resposta útil" aria-pressed={feedback === 1}>👍</button>
          <button className={`anx-fb anx-fb-neg${feedback === -1 ? ' is-on' : ''}`}
            onClick={() => onFeedback(-1)} title="Resposta ruim ou incorreta" aria-pressed={feedback === -1}>👎</button>
          {feedback !== null && <span className="anx-fb-thanks">Avaliação registrada — obrigado!</span>}
        </div>
      )}
    </div>
  );
}

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
        aria-expanded={open} title="Conversas anteriores">🕓 Histórico</button>
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

function Shell({ config }: { config: ShellConfig }) {
  void config;
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [texto, setTexto] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [modo, setModo] = useState<string | null>(null);
  const [conversaId, setConversaId] = useState<number | null>(null);
  const proximoId = useRef(1);
  const fimRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turnos]);

  const enviar = async (pergunta: string) => {
    const q = pergunta.trim();
    if (q.length < 3 || ocupado) return;
    const id = proximoId.current++;
    setTurnos((t) => [...t, { id, pergunta: q, estado: 'carregando' }]);
    setTexto('');
    setOcupado(true);
    try {
      const resposta = await perguntar(q, conversaId);
      setModo(resposta.mode);
      setConversaId(resposta.conversa_id);
      setTurnos((t) => t.map((x) => (
        x.id === id ? { ...x, estado: 'ok', resposta, feedback: null } : x
      )));
    } catch (e) {
      const msg = e instanceof ApiError
        ? (e.ehAuth ? 'Sessão expirada — recarregue a página e entre novamente.' : e.message)
        : 'Erro inesperado ao consultar o Decision Engine.';
      setTurnos((t) => t.map((x) => (x.id === id ? { ...x, estado: 'erro', erro: msg } : x)));
    } finally {
      setOcupado(false);
      areaRef.current?.focus();
    }
  };

  const novaConversa = () => {
    if (ocupado) return;
    setTurnos([]);
    setConversaId(null);
    proximoId.current = 1;
    areaRef.current?.focus();
  };

  const abrirConversa = async (id: number) => {
    if (ocupado) return;
    setOcupado(true);
    try {
      const { mensagens } = await carregarConversa(id);
      const carregados = mensagensParaTurnos(mensagens);
      setTurnos(carregados);
      setConversaId(id);
      proximoId.current = carregados.length + 1;
      const ultimo = [...carregados].reverse().find((t) => t.resposta);
      if (ultimo?.resposta) setModo(ultimo.resposta.mode);
    } catch {
      /* mantém a tela atual; o dropdown já sinaliza erros de listagem */
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
      // desfaz em caso de falha (otimista com rollback)
      setTurnos((t) => t.map((x) => (x.id === turnoId ? { ...x, feedback: atual } : x)));
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void enviar(texto);
    }
  };

  return (
    <div className="anx-shell">
      <div className="anx-topbar">
        <span className="anx-brand"><span className="anx-brand-mark" aria-hidden>🧠</span> Consultor de Anúncios</span>
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
          <HistoricoMenu onAbrir={(id) => void abrirConversa(id)} ocupado={ocupado} />
          <button className="anx-topbtn anx-topbtn-primary" onClick={novaConversa}
            disabled={ocupado || turnos.length === 0} title="Começar uma conversa nova">
            ＋ Nova conversa
          </button>
        </div>
      </div>

      <div className="anx-scroll">
        <div className="anx-col">
          {turnos.length === 0 && (
            <div className="anx-welcome">
              <div className="anx-welcome-ic" aria-hidden>🧠</div>
              <h2>Pergunte ao especialista em Google Ads da Dshow</h2>
              <p>
                Auditoria, diagnóstico, palavras-chave, landing pages, lances e
                qualificação comercial — sempre fundamentado na metodologia, com as
                fontes citadas em cada resposta.
              </p>
              <div className="anx-suggestions">
                {SUGESTOES.map((s) => (
                  <button key={s} className="anx-suggestion" onClick={() => void enviar(s)} disabled={ocupado}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
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
                />
              )}
            </div>
          ))}
          <div ref={fimRef} />
        </div>
      </div>

      <div className="anx-composer">
        <div className="anx-composer-inner">
          <textarea
            ref={areaRef}
            className="anx-input"
            placeholder="Pergunte sobre campanhas, palavras-chave, landing pages, lances…  (Enter envia)"
            value={texto}
            rows={2}
            maxLength={2000}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={ocupado}
          />
          <button className="anx-send" onClick={() => void enviar(texto)}
            disabled={ocupado || texto.trim().length < 3} title="Enviar pergunta">
            {ocupado ? <span className="anx-spinner anx-spinner-sm" /> : '➤'}
          </button>
        </div>
        <p className="anx-hint">
          As respostas citam as unidades da metodologia (ex.: F13 · Q865). Nunca inventa dados da sua conta.
        </p>
      </div>
    </div>
  );
}

export function App({ config }: { config: ShellConfig }) {
  return <Shell config={config} />;
}
