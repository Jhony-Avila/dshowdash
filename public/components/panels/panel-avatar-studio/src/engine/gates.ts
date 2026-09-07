// engine/gates.ts — decisão A+ §17/§18: DOIS PORTÕES INDEPENDENTES.
// A qualidade de APRESENTAÇÃO (card/palco/foco/material lendo) e a qualidade de
// ARTE (silhueta, anatomia, fatura ≥8) são gates SEPARADOS. Isto existe para
// tornar IMPOSSÍVEL "maquiar arte fraca com boa apresentação" (§18): mesmo com
// a apresentação 100% verde, a arte permanece em REWORK até o veredito humano
// do Jhony. O código abaixo é a checagem viva desse princípio.
// @version 1.0.0  @created 2026-08-23 (decisão A+)

export type StatusGate = 'MET' | 'REWORK' | 'HUMAN_ONLY';

export interface CriterioGate { id: string; desc: string; met: boolean }
export interface Gate {
  nome: string;
  escopo: 'apresentacao' | 'arte';
  status: StatusGate;
  /** quem pode declarar aprovado: motor (checável) vs. humano (Jhony). */
  aprovador: 'motor' | 'humano';
  criterios: CriterioGate[];
}

/** GATE DE APRESENTAÇÃO — checável pelo motor (infra construída na fase A+):
 *  foco fonte única, card≠palco, thumbnail por categoria, material declarado. */
export function gateApresentacao(infra: {
  focoFonteUnica: boolean; cardVsPalco: boolean; thumbnailPorCategoria: boolean; materialDeclarado: boolean;
}): Gate {
  const criterios: CriterioGate[] = [
    { id: 'foco-fonte-unica', desc: 'CATEGORY_FOCUS_MAP resolve toda categoria (engine/enquadramento)', met: infra.focoFonteUnica },
    { id: 'card-vs-palco', desc: 'card="o que é" e palco="como fica" da mesma fonte (§10)', met: infra.cardVsPalco },
    { id: 'thumb-por-categoria', desc: 'política de thumbnail por categoria (ApresentacaoAsset §41)', met: infra.thumbnailPorCategoria },
    { id: 'material-declarado', desc: 'zonas de material declaradas e resolvidas (materiais2d §25)', met: infra.materialDeclarado },
  ];
  const status: StatusGate = criterios.every((c) => c.met) ? 'MET' : 'REWORK';
  return { nome: 'ASSET PRESENTATION QUALITY', escopo: 'apresentacao', status, aprovador: 'motor', criterios };
}

/** GATE DE ARTE — SÓ o humano aprova. O motor nunca marca MET aqui; o máximo
 *  que registra é que os pré-requisitos de pipeline existem, mas o veredito de
 *  fatura ≥8 é HUMAN_ONLY e, nesta fase, REWORK (§20/§27). */
export function gateArte(): Gate {
  const criterios: CriterioGate[] = [
    { id: 'silhueta-preto', desc: 'silhueta lê em valor puro (value study)', met: false },
    { id: 'anatomia', desc: 'anatomia/construção corretas (veste, não flutua)', met: false },
    { id: 'material-lê', desc: 'materiais distinguíveis na mesma geometria', met: false },
    { id: 'fatura-8', desc: 'fatura premium ≥8 (stylized 2.5D)', met: false },
  ];
  return { nome: 'ART QUALITY', escopo: 'arte', status: 'REWORK', aprovador: 'humano', criterios };
}

/** INVARIANTE §18: apresentação verde NÃO implica arte aprovada. Retorna true
 *  se o princípio se mantém (a arte NÃO é MET só porque a apresentação é). */
export function apresentacaoNaoMaquiaArte(apres: Gate, arte: Gate): boolean {
  if (apres.status !== 'MET') return true; // vacuamente ok
  return arte.status !== 'MET' && arte.aprovador === 'humano';
}
