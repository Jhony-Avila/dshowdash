// components/Resposta.tsx — renderer da resposta estruturada do consultor.
// @version 1.0.0  @created 2026-07-28
//
// Transforma o Markdown do contrato (lib/markdown.ts) em componentes:
// resumo executivo em destaque, seções em accordion, callouts de regra,
// recomendações com prioridade, checklist de próximos passos, badge de
// confiança e fontes com feedback (👍/👎 + motivos — Fase 22).
// Tolerante a texto incompleto (streaming).
import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowDownUp, BookOpen, Check, ChevronDown, ChevronRight, ClipboardList,
  Copy, Download, Gauge, Lightbulb, RotateCcw, ScrollText, Stethoscope,
  ThumbsDown, ThumbsUp,
} from 'lucide-react';
import {
  parseResposta, parseAtributos, type Bloco, type Confianca, type ItemRecomendacao,
} from '../lib/markdown';
import type { AskResposta, Feedback, Unidade } from '../shell/types';

export const ROTULO_DOMINIO: Record<string, string> = {
  methodology: 'Metodologia', measurement: 'Mensuração', google_ads: 'Google Ads',
  keywords: 'Palavras-chave', ads: 'Anúncios', landing_pages: 'Landing Pages',
  metrics: 'Métricas', bidding: 'Lances', orchestration: 'Orquestração',
  cognitive_architecture: 'Arquitetura Cognitiva', dshow_products: 'Produtos Dshow',
  dshow_technologies: 'Tecnologias Dshow', dshow_segments: 'Segmentos Dshow',
  commercial_qualification: 'Qualificação Comercial', rag: 'RAG',
  testing: 'Testes', continuous_learning: 'Aprendizado Contínuo',
};

export function rotuloDominio(d: string): string {
  return ROTULO_DOMINIO[d] ?? d;
}

/** "fase-13__bloco-b__q-0865__ab12cd34" -> "F13 · Q865". */
function resumoCitacao(id: string): string {
  const m = id.match(/fase-(\d+).*q-0*(\d+)/);
  return m ? `F${Number(m[1])} · Q${m[2]}` : id.slice(0, 18);
}

/** Tooltip nativo da citação: pergunta + regra da unidade correspondente. */
function tituloCitacao(id: string, unidades: Unidade[]): string {
  const u = unidades.find((x) => x.id === id || id.includes(x.id) || x.id.includes(id));
  if (!u) return id;
  const partes = [`${rotuloDominio(u.domain)} — ${u.question}`];
  if (u.operational_rule) partes.push(`Regra: ${u.operational_rule.slice(0, 220)}`);
  return partes.join('\n\n');
}

/** Inline: citações viram chips clicáveis; **negrito** vira <strong>. */
export function renderInline(
  linha: string,
  unidades: Unidade[],
  onCitacao?: (id: string) => void
): ReactNode[] {
  const partes: ReactNode[] = [];
  const re = /\[((?:fase|q)[^\]]*)\]|\*\*([^*]+)\*\*/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(linha)) !== null) {
    if (m.index > ultimo) partes.push(linha.slice(ultimo, m.index));
    if (m[1] !== undefined) {
      const id = m[1];
      partes.push(
        <button key={`c${k++}`} className="anx-cite" title={tituloCitacao(id, unidades)}
          onClick={() => onCitacao?.(id)} type="button">
          {resumoCitacao(id)}
        </button>
      );
    } else {
      partes.push(<strong key={`b${k++}`}>{m[2]}</strong>);
    }
    ultimo = m.index + m[0].length;
  }
  if (ultimo < linha.length) partes.push(linha.slice(ultimo));
  return partes;
}

function linhas(texto: string, unidades: Unidade[], onCitacao?: (id: string) => void): ReactNode[] {
  return texto.split('\n').map((l, i) => (
    <span key={i}>{i > 0 && <br />}{renderInline(l, unidades, onCitacao)}</span>
  ));
}

function BlocoView({ bloco, unidades, onCitacao }: {
  bloco: Bloco; unidades: Unidade[]; onCitacao?: (id: string) => void;
}) {
  switch (bloco.tipo) {
    case 'h3':
      return <h4 className="anx-r-h3">{renderInline(bloco.texto, unidades, onCitacao)}</h4>;
    case 'regra':
      return (
        <div className="anx-callout anx-callout-regra">
          <ScrollText size={15} aria-hidden />
          <div><strong>Regra da metodologia:</strong> {renderInline(bloco.texto, unidades, onCitacao)}</div>
        </div>
      );
    case 'quote':
      return <blockquote className="anx-r-quote">{linhas(bloco.texto, unidades, onCitacao)}</blockquote>;
    case 'checklist':
      return <ChecklistView itens={bloco.itens} unidades={unidades} onCitacao={onCitacao} />;
    case 'tabela':
      return <TabelaView cabecalho={bloco.cabecalho} linhas={bloco.linhas}
        unidades={unidades} onCitacao={onCitacao} />;
    case 'lista':
      if (bloco.ordenada) {
        return (
          <ol className="anx-r-recs">
            {bloco.itens.map((item, i) => {
              const { prioridade, impacto, esforco, texto } = parseAtributos(item);
              return (
                <li key={i} className="anx-r-rec">
                  {prioridade && (
                    <span className={`anx-prio anx-prio-${prioridade}`}>
                      {prioridade === 'alta' ? 'Alta' : prioridade === 'media' ? 'Média' : 'Baixa'}
                    </span>
                  )}
                  {impacto && <span className="anx-attr" title="Impacto estimado">imp. {impacto}</span>}
                  {esforco && <span className="anx-attr" title="Esforço estimado">esf. {esforco}</span>}
                  <span>{renderInline(texto, unidades, onCitacao)}</span>
                </li>
              );
            })}
          </ol>
        );
      }
      return (
        <ul className="anx-r-ul">
          {bloco.itens.map((item, i) => <li key={i}>{renderInline(item, unidades, onCitacao)}</li>)}
        </ul>
      );
    default:
      return <p className="anx-r-p">{linhas(bloco.texto, unidades, onCitacao)}</p>;
  }
}

/** Tabela Markdown → grade ordenável (clique no cabeçalho). */
function TabelaView({ cabecalho, linhas: dados, unidades, onCitacao }: {
  cabecalho: string[]; linhas: string[][];
  unidades: Unidade[]; onCitacao?: (id: string) => void;
}) {
  const [ordem, setOrdem] = useState<{ col: number; asc: boolean } | null>(null);

  const ordenadas = useMemo(() => {
    if (!ordem) return dados;
    const { col, asc } = ordem;
    const copia = [...dados];
    copia.sort((a, b) => {
      const va = a[col] ?? ''; const vb = b[col] ?? '';
      const na = parseFloat(va.replace(/[^\d.,-]/g, '').replace(',', '.'));
      const nb = parseFloat(vb.replace(/[^\d.,-]/g, '').replace(',', '.'));
      const cmp = (!Number.isNaN(na) && !Number.isNaN(nb))
        ? na - nb
        : va.localeCompare(vb, 'pt-BR');
      return asc ? cmp : -cmp;
    });
    return copia;
  }, [dados, ordem]);

  return (
    <div className="anx-grid-wrap">
      <table className="anx-grid">
        <thead>
          <tr>
            {cabecalho.map((c, i) => (
              <th key={i}>
                <button className="anx-grid-th" onClick={() =>
                  setOrdem((o) => (o && o.col === i ? { col: i, asc: !o.asc } : { col: i, asc: true }))}>
                  {c}
                  {ordem?.col === i
                    ? (ordem.asc ? <ChevronDown size={11} aria-hidden /> : <ChevronRight size={11} aria-hidden style={{ transform: 'rotate(-90deg)' }} />)
                    : <ArrowDownUp size={11} aria-hidden className="anx-grid-sort" />}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((linha, i) => (
            <tr key={i}>
              {linha.map((cel, j) => <td key={j}>{renderInline(cel, unidades, onCitacao)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Matriz de priorização impacto × esforço (quadrantes). */
function MatrizPrioridade({ itens }: { itens: ItemRecomendacao[] }) {
  const posicionaveis = itens
    .map((item, i) => ({ ...item, n: i + 1 }))
    .filter((r) => r.impacto !== null && r.esforco !== null);
  if (posicionaveis.length < 2) return null;

  const quadrante = (impAlto: boolean, esfBaixo: boolean) =>
    posicionaveis.filter((r) =>
      (r.impacto !== 'baixo') === impAlto && (r.esforco !== 'alto') === esfBaixo);

  const celula = (titulo: string, classe: string, lista: typeof posicionaveis) => (
    <div className={`anx-mx-cel ${classe}`}>
      <div className="anx-mx-titulo">{titulo}</div>
      {lista.length === 0
        ? <span className="anx-mx-vazio">—</span>
        : lista.map((r) => (
            <span key={r.n} className="anx-mx-item" title={r.texto}>
              <strong>#{r.n}</strong> {r.texto.length > 52 ? r.texto.slice(0, 52) + '…' : r.texto}
            </span>
          ))}
    </div>
  );

  return (
    <div className="anx-mx" role="img" aria-label="Matriz de priorização impacto por esforço (o conteúdo está listado nas recomendações abaixo)">
      <div className="anx-mx-eixo-y">Impacto ↑</div>
      <div className="anx-mx-grid">
        {celula('Fazer primeiro', 'anx-mx-otimo', quadrante(true, true))}
        {celula('Planejar bem', 'anx-mx-planejar', quadrante(true, false))}
        {celula('Se sobrar tempo', 'anx-mx-baixo', quadrante(false, true))}
        {celula('Evitar / repensar', 'anx-mx-evitar', quadrante(false, false))}
      </div>
      <div className="anx-mx-eixo-x">Esforço →</div>
    </div>
  );
}

function ChecklistView({ itens, unidades, onCitacao }: {
  itens: string[]; unidades: Unidade[]; onCitacao?: (id: string) => void;
}) {
  const [feitos, setFeitos] = useState<Record<string, boolean>>({});
  return (
    <div className="anx-check">
      {itens.map((item, i) => (
        <label key={i} className={`anx-check-item${feitos[item] ? ' is-done' : ''}`}>
          <input type="checkbox" checked={!!feitos[item]}
            onChange={() => setFeitos((f) => ({ ...f, [item]: !f[item] }))} />
          <span>{renderInline(item, unidades, onCitacao)}</span>
        </label>
      ))}
    </div>
  );
}

const ICONE_SECAO: Record<string, ReactNode> = {
  'resumo executivo': <Lightbulb size={15} aria-hidden />,
  'diagnóstico': <Stethoscope size={15} aria-hidden />,
  'explicação': <BookOpen size={15} aria-hidden />,
  'recomendações': <ClipboardList size={15} aria-hidden />,
  'próximos passos': <ClipboardList size={15} aria-hidden />,
};

function SecaoAccordion({ titulo, children }: { titulo: string; children: ReactNode }) {
  const [aberto, setAberto] = useState(true);
  return (
    <section className="anx-sec">
      <button className="anx-sec-head" onClick={() => setAberto((v) => !v)} aria-expanded={aberto}>
        {aberto ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
        {ICONE_SECAO[titulo.toLowerCase()] ?? null}
        <span>{titulo}</span>
      </button>
      {aberto && <div className="anx-sec-body">{children}</div>}
    </section>
  );
}

function ConfiancaBadge({ confianca }: { confianca: Confianca }) {
  const rotulo = confianca.nivel === 'alto' ? 'Alta' : confianca.nivel === 'medio' ? 'Média' : 'Baixa';
  return (
    <span className={`anx-conf anx-conf-${confianca.nivel}`}
      title={confianca.motivo || 'Nível de confiança da resposta'}>
      <Gauge size={12} aria-hidden /> Confiança {rotulo.toLowerCase()}
    </span>
  );
}

// ── Fontes ──────────────────────────────────────────────────────────

export function CartaoUnidade({ unidade, aberto }: { unidade: Unidade; aberto?: boolean }) {
  const [expandido, setExpandido] = useState(!!aberto);
  const s = unidade.source;
  return (
    <div className={`anx-unit${expandido ? ' is-open' : ''}`} data-unit-id={unidade.id}>
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

// ── Feedback com motivos (Fase 22) ──────────────────────────────────

const MOTIVOS = [
  'Faltou profundidade', 'Resposta genérica', 'Fonte inadequada',
  'Não aplicável ao caso', 'Formato ruim',
];

function FeedbackRow({ feedback, onFeedback, onMotivo }: {
  feedback: Feedback;
  onFeedback: (valor: 1 | -1) => void;
  onMotivo: (motivo: string) => void;
}) {
  const [motivoSel, setMotivoSel] = useState<string | null>(null);
  return (
    <div className="anx-fbrow" role="group" aria-label="Avaliar resposta">
      <span className="anx-fb-label">Esta resposta ajudou?</span>
      <button className={`anx-fb${feedback === 1 ? ' is-on' : ''}`} type="button"
        onClick={() => onFeedback(1)} title="Resposta útil" aria-pressed={feedback === 1}>
        <ThumbsUp size={14} aria-hidden />
      </button>
      <button className={`anx-fb anx-fb-neg${feedback === -1 ? ' is-on' : ''}`} type="button"
        onClick={() => onFeedback(-1)} title="Resposta ruim ou incorreta" aria-pressed={feedback === -1}>
        <ThumbsDown size={14} aria-hidden />
      </button>
      {feedback === 1 && <span className="anx-fb-thanks">Avaliação registrada — obrigado!</span>}
      {feedback === -1 && (
        <span className="anx-fb-motivos">
          {motivoSel
            ? <span className="anx-fb-thanks">Registrado: {motivoSel}. Isso alimenta a evolução da metodologia.</span>
            : (<>
                <span className="anx-fb-label">O que faltou?</span>
                {MOTIVOS.map((m) => (
                  <button key={m} className="anx-fb-chip" type="button"
                    onClick={() => { setMotivoSel(m); onMotivo(m); }}>{m}</button>
                ))}
              </>)}
        </span>
      )}
    </div>
  );
}

// ── Bloco principal da resposta ─────────────────────────────────────

export function BlocoResposta({ resposta, feedback, onFeedback, onMotivo, onAbrirFonte, onRegenerar }: {
  resposta: AskResposta;
  feedback: Feedback;
  onFeedback: (valor: 1 | -1) => void;
  onMotivo: (motivo: string) => void;
  /** Quando presente, citações abrem a fonte no drawer lateral. */
  onAbrirFonte?: (unidade: Unidade) => void;
  /** Refaz a mesma pergunta (nova geração). */
  onRegenerar?: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const [mostrarFontes, setMostrarFontes] = useState(resposta.mode === 'retrieval_only');
  const raizRef = useRef<HTMLDivElement>(null);

  const abrirFonte = (idCitado: string) => {
    const unidade = resposta.units.find(
      (x) => x.id === idCitado || idCitado.includes(x.id) || x.id.includes(idCitado)
    );
    if (unidade && onAbrirFonte) { onAbrirFonte(unidade); return; }
    // Fallback: rola até o cartão na lista de fontes.
    setMostrarFontes(true);
    window.setTimeout(() => {
      const alvo = raizRef.current?.querySelector(`[data-unit-id="${CSS.escape(idCitado)}"]`);
      alvo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const cabecalho = alvo?.querySelector('button');
      if (alvo && !alvo.classList.contains('is-open')) (cabecalho as HTMLButtonElement | null)?.click();
    }, 60);
  };

  const rolarParaSecao = (idx: number) => {
    raizRef.current?.querySelector(`[data-sec-idx="${idx}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const estruturada = resposta.answer ? parseResposta(resposta.answer) : null;
  const unidades = resposta.units;
  const titulosSecoes = estruturada
    ? estruturada.secoes.map((s, i) => ({ titulo: s.titulo, idx: i })).filter((s) => s.titulo !== '')
    : [];

  return (
    <div className="anx-answer" ref={raizRef}>
      {/* Cabeçalho: tipo da resposta + confiança + nº de fontes */}
      <div className="anx-r-head">
        <span className="anx-badge anx-badge-tipo" title="Análise baseada exclusivamente na metodologia Dshow (dados da conta chegam com a integração Google Ads).">
          <BookOpen size={12} aria-hidden /> Metodologia
        </span>
        {estruturada?.confianca && <ConfiancaBadge confianca={estruturada.confianca} />}
        {unidades.length > 0 && (
          <button className="anx-badge anx-badge-fontes" type="button"
            onClick={() => setMostrarFontes((v) => !v)}
            title="Unidades da metodologia usadas nesta resposta">
            {unidades.length} fonte{unidades.length === 1 ? '' : 's'}
          </button>
        )}
      </div>

      {resposta.mode === 'consultant' && estruturada ? (
        <div className="anx-r-body">
          {titulosSecoes.length >= 3 && (
            <nav className="anx-toc" aria-label="Índice da resposta">
              {titulosSecoes.map((s) => (
                <button key={s.idx} className="anx-toc-chip" onClick={() => rolarParaSecao(s.idx)}>
                  {s.titulo}
                </button>
              ))}
            </nav>
          )}
          {estruturada.secoes.map((sec, i) => {
            const conteudo = sec.blocos.map((b, j) => (
              <BlocoView key={j} bloco={b} unidades={unidades} onCitacao={abrirFonte} />
            ));
            if (sec.titulo === '') return <div key={i} data-sec-idx={i}>{conteudo}</div>;
            if (sec.titulo.toLowerCase() === 'resumo executivo') {
              return (
                <div key={i} className="anx-resumo" data-sec-idx={i}>
                  <div className="anx-resumo-titulo"><Lightbulb size={15} aria-hidden /> Resumo executivo</div>
                  {conteudo}
                </div>
              );
            }
            // Recomendações: matriz impacto×esforço acima da lista, quando anotada.
            let matriz: ReactNode = null;
            if (sec.titulo.toLowerCase() === 'recomendações') {
              const listaOrdenada = sec.blocos.find(
                (b): b is Extract<Bloco, { tipo: 'lista' }> => b.tipo === 'lista' && b.ordenada
              );
              if (listaOrdenada) {
                matriz = <MatrizPrioridade itens={listaOrdenada.itens.map(parseAtributos)} />;
              }
            }
            return (
              <div key={i} data-sec-idx={i}>
                <SecaoAccordion titulo={sec.titulo}>{matriz}{conteudo}</SecaoAccordion>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="anx-retrieval-note">
          {resposta.mode === 'retrieval_only'
            ? 'Modo recuperação: exibindo as unidades mais relevantes da metodologia. Para respostas consultivas com IA, configure a chave da Anthropic no servidor.'
            : null}
        </p>
      )}

      {unidades.length > 0 && (
        <div className="anx-sources">
          <button className="anx-sources-toggle" onClick={() => setMostrarFontes((v) => !v)}>
            {mostrarFontes ? '▾' : '▸'} Fontes da metodologia ({unidades.length})
          </button>
          {mostrarFontes && (
            <div className="anx-sources-list">
              {unidades.map((u, i) => (
                <CartaoUnidade key={u.id} unidade={u} aberto={resposta.mode === 'retrieval_only' && i === 0} />
              ))}
            </div>
          )}
        </div>
      )}
      {unidades.length === 0 && (
        <p className="anx-retrieval-note">Nenhuma unidade da metodologia cobre esta pergunta.</p>
      )}

      {resposta.message_id > 0 && (
        <div className="anx-acts">
          {resposta.answer && (
            <>
              <button className="anx-act" type="button" title="Copiar a resposta"
                onClick={() => {
                  navigator.clipboard?.writeText(resposta.answer ?? '').then(() => {
                    setCopiado(true);
                    window.setTimeout(() => setCopiado(false), 1800);
                  }).catch(() => { /* clipboard indisponível */ });
                }}>
                {copiado ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
              <button className="anx-act" type="button" title="Baixar a resposta em Markdown"
                onClick={() => {
                  const md = `# ${resposta.query}\n\n${resposta.answer}\n\n---\nFontes da metodologia:\n`
                    + resposta.units.map((u) => `- [${u.id}] ${u.question}`).join('\n');
                  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = 'consulta-anuncios.md';
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}>
                <Download size={13} aria-hidden /> Exportar
              </button>
            </>
          )}
          {onRegenerar && (
            <button className="anx-act" type="button" title="Gerar a resposta novamente"
              onClick={onRegenerar}>
              <RotateCcw size={13} aria-hidden /> Regenerar
            </button>
          )}
        </div>
      )}
      {resposta.message_id > 0 && (
        <FeedbackRow feedback={feedback} onFeedback={onFeedback} onMotivo={onMotivo} />
      )}
    </div>
  );
}
