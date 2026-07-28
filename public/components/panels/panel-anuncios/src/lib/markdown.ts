// lib/markdown.ts — parser do contrato de resposta estruturada do engine.
// @version 1.0.0  @created 2026-07-28
//
// O consultor emite Markdown com contrato fixo (## seções, "> Regra:",
// "- [ ]", linha final "Nível de confiança: ..."). Este parser é TOLERANTE:
// qualquer coisa fora do contrato degrada para parágrafo comum — nunca
// quebra a renderização (importante durante o streaming, quando o texto
// chega incompleto).

export type Bloco =
  | { tipo: 'p'; texto: string }
  | { tipo: 'h3'; texto: string }
  | { tipo: 'lista'; ordenada: boolean; itens: string[] }
  | { tipo: 'checklist'; itens: string[] }
  | { tipo: 'regra'; texto: string }
  | { tipo: 'quote'; texto: string };

export interface Secao {
  titulo: string; // '' para preâmbulo sem título
  blocos: Bloco[];
}

export interface Confianca {
  nivel: 'alto' | 'medio' | 'baixo';
  motivo: string;
}

export interface RespostaEstruturada {
  secoes: Secao[];
  confianca: Confianca | null;
}

const RE_CONFIANCA = /^\s*n[ií]vel de confian[çc]a:\s*(alta|alto|m[eé]dia|m[eé]dio|baixa|baixo)\s*(?:[—–:-]\s*)?(.*)$/i;

function normalizarNivel(bruto: string): Confianca['nivel'] {
  const v = bruto.toLowerCase();
  if (v.startsWith('alt')) return 'alto';
  if (v.startsWith('m')) return 'medio';
  return 'baixo';
}

/** Remove numeração/marcador do começo de um item de lista. */
function limparItem(linha: string): string {
  return linha.replace(/^\s*(?:[-*•]|\d{1,3}[.)])\s+/, '').trim();
}

export function parseResposta(md: string): RespostaEstruturada {
  const secoes: Secao[] = [];
  let atual: Secao = { titulo: '', blocos: [] };
  let confianca: Confianca | null = null;

  const empurrar = () => {
    if (atual.titulo !== '' || atual.blocos.length > 0) secoes.push(atual);
  };

  // Acumuladores de lista (flush quando o tipo de linha muda).
  let lista: { ordenada: boolean; itens: string[] } | null = null;
  let checklist: string[] | null = null;
  const flushListas = () => {
    if (lista) { atual.blocos.push({ tipo: 'lista', ...lista }); lista = null; }
    if (checklist) { atual.blocos.push({ tipo: 'checklist', itens: checklist }); checklist = null; }
  };

  for (const linhaBruta of md.split('\n')) {
    const linha = linhaBruta.replace(/\s+$/, '');
    const semEspaco = linha.trim();

    // Linha final de confiança (pode vir em qualquer ponto do fim).
    const mConf = semEspaco.match(RE_CONFIANCA);
    if (mConf) {
      flushListas();
      confianca = { nivel: normalizarNivel(mConf[1]), motivo: (mConf[2] || '').trim() };
      continue;
    }

    if (semEspaco === '' || /^-{3,}$/.test(semEspaco)) { flushListas(); continue; }

    // Títulos: ## abre seção; ### vira bloco; # solto degrada para ###.
    const mH2 = semEspaco.match(/^##(?!#)\s+(.+)$/);
    if (mH2) {
      flushListas(); empurrar();
      atual = { titulo: mH2[1].trim(), blocos: [] };
      continue;
    }
    const mH3 = semEspaco.match(/^#{1,4}\s+(.+)$/);
    if (mH3) {
      flushListas();
      atual.blocos.push({ tipo: 'h3', texto: mH3[1].trim() });
      continue;
    }

    // Callout de regra e citações em bloco.
    const mRegra = semEspaco.match(/^>\s*regra\s*:?\s*(.*)$/i);
    if (mRegra) {
      flushListas();
      atual.blocos.push({ tipo: 'regra', texto: mRegra[1].trim() });
      continue;
    }
    const mQuote = semEspaco.match(/^>\s?(.*)$/);
    if (mQuote) {
      flushListas();
      const anterior = atual.blocos[atual.blocos.length - 1];
      if (anterior && anterior.tipo === 'quote') anterior.texto += '\n' + mQuote[1];
      else atual.blocos.push({ tipo: 'quote', texto: mQuote[1] });
      continue;
    }

    // Checklist "- [ ]" / "- [x]".
    const mCheck = semEspaco.match(/^[-*]\s*\[[ xX]?\]\s+(.+)$/);
    if (mCheck) {
      if (lista) { atual.blocos.push({ tipo: 'lista', ...lista }); lista = null; }
      (checklist ??= []).push(mCheck[1].trim());
      continue;
    }

    // Listas com marcador ou numeradas.
    if (/^\s*[-*•]\s+/.test(linha)) {
      if (checklist) { atual.blocos.push({ tipo: 'checklist', itens: checklist }); checklist = null; }
      if (lista && lista.ordenada) { atual.blocos.push({ tipo: 'lista', ...lista }); lista = null; }
      (lista ??= { ordenada: false, itens: [] }).itens.push(limparItem(linha));
      continue;
    }
    if (/^\s*\d{1,3}[.)]\s+/.test(linha)) {
      if (checklist) { atual.blocos.push({ tipo: 'checklist', itens: checklist }); checklist = null; }
      if (lista && !lista.ordenada) { atual.blocos.push({ tipo: 'lista', ...lista }); lista = null; }
      (lista ??= { ordenada: true, itens: [] }).itens.push(limparItem(linha));
      continue;
    }

    // Continuação de item de lista (indentado) ou parágrafo comum.
    if (lista && /^\s{2,}\S/.test(linha)) {
      lista.itens[lista.itens.length - 1] += ' ' + semEspaco;
      continue;
    }
    flushListas();
    const anterior = atual.blocos[atual.blocos.length - 1];
    if (anterior && anterior.tipo === 'p') anterior.texto += '\n' + semEspaco;
    else atual.blocos.push({ tipo: 'p', texto: semEspaco });
  }

  flushListas();
  empurrar();
  return { secoes, confianca };
}

export interface ItemRecomendacao {
  prioridade: 'alta' | 'media' | 'baixa' | null;
  texto: string;
}

/** Extrai o badge "[Prioridade alta|média|baixa]" do começo de um item. */
export function parsePrioridade(item: string): ItemRecomendacao {
  const m = item.match(/^\[?\s*prioridade\s+(alta|m[eé]dia|baixa)\s*\]?\s*[:—–-]?\s*/i);
  if (!m) return { prioridade: null, texto: item };
  const p = m[1].toLowerCase();
  return {
    prioridade: p === 'alta' ? 'alta' : p === 'baixa' ? 'baixa' : 'media',
    texto: item.slice(m[0].length).trim(),
  };
}
