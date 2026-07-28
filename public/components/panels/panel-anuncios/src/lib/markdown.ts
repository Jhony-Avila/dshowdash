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
  | { tipo: 'quote'; texto: string }
  | { tipo: 'tabela'; cabecalho: string[]; linhas: string[][] }
  | { tipo: 'fluxo'; etapas: string[] };

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

  // Acumuladores de lista/tabela (flush quando o tipo de linha muda).
  let lista: { ordenada: boolean; itens: string[] } | null = null;
  let checklist: string[] | null = null;
  let tabela: string[][] | null = null;
  const flushListas = () => {
    if (lista) { atual.blocos.push({ tipo: 'lista', ...lista }); lista = null; }
    if (checklist) { atual.blocos.push({ tipo: 'checklist', itens: checklist }); checklist = null; }
    if (tabela) {
      if (tabela.length > 0) {
        atual.blocos.push({ tipo: 'tabela', cabecalho: tabela[0], linhas: tabela.slice(1) });
      }
      tabela = null;
    }
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

    // Tabela Markdown: | a | b |  (a linha separadora |---|---| é ignorada).
    if (/^\|.*\|$/.test(semEspaco)) {
      if (lista) { atual.blocos.push({ tipo: 'lista', ...lista }); lista = null; }
      if (checklist) { atual.blocos.push({ tipo: 'checklist', itens: checklist }); checklist = null; }
      if (/^\|[\s:|-]+\|$/.test(semEspaco)) continue; // separadora
      const celulas = semEspaco.slice(1, -1).split('|').map((c) => c.trim());
      (tabela ??= []).push(celulas);
      continue;
    }

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

    // Fluxo: linha isolada "A → B → C" (≥2 setas, etapas curtas) vira diagrama.
    if ((semEspaco.match(/→/g) ?? []).length >= 2) {
      const etapas = semEspaco.split('→').map((e) => e.trim()).filter(Boolean);
      if (etapas.length >= 3 && etapas.every((e) => e.length <= 40)) {
        atual.blocos.push({ tipo: 'fluxo', etapas });
        continue;
      }
    }
    const anterior = atual.blocos[atual.blocos.length - 1];
    if (anterior && anterior.tipo === 'p') anterior.texto += '\n' + semEspaco;
    else atual.blocos.push({ tipo: 'p', texto: semEspaco });
  }

  flushListas();
  empurrar();
  return { secoes, confianca };
}

export type Grau3 = 'alto' | 'medio' | 'baixo';

export interface ItemRecomendacao {
  prioridade: 'alta' | 'media' | 'baixa' | null;
  impacto: Grau3 | null;
  esforco: Grau3 | null;
  texto: string;
}

function grau(bruto: string): Grau3 {
  const v = bruto.toLowerCase();
  if (v.startsWith('alt')) return 'alto';
  if (v.startsWith('baix')) return 'baixo';
  return 'medio';
}

/** Extrai [Prioridade x] [Impacto y] [Esforço z] (qualquer ordem) do item. */
export function parseAtributos(item: string): ItemRecomendacao {
  const out: ItemRecomendacao = { prioridade: null, impacto: null, esforco: null, texto: item };
  const re = /^\s*\[?\s*(prioridade|impacto|esfor[çc]o)\s+(alta|alto|m[eé]dia|m[eé]dio|baixa|baixo)\s*\]?\s*[:—–-]?\s*/i;
  let resto = item;
  for (let i = 0; i < 3; i++) {
    const m = resto.match(re);
    if (!m) break;
    const chave = m[1].toLowerCase();
    if (chave === 'prioridade') {
      const g = grau(m[2]);
      out.prioridade = g === 'alto' ? 'alta' : g === 'baixo' ? 'baixa' : 'media';
    } else if (chave === 'impacto') {
      out.impacto = grau(m[2]);
    } else {
      out.esforco = grau(m[2]);
    }
    resto = resto.slice(m[0].length);
  }
  out.texto = resto.trim();
  return out;
}

/** Compatibilidade: só a prioridade (mantido para chamadas existentes). */
export function parsePrioridade(item: string): { prioridade: ItemRecomendacao['prioridade']; texto: string } {
  const { prioridade, texto } = parseAtributos(item);
  return { prioridade, texto };
}
