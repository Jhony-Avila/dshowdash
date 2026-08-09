// engine/sobrepecas.ts — SOBREPEÇAS de vestuário (AS6 Parte 5 · §3393,
// lote 931–940, decisão #95, flag as6.creator_v6).
// @version 1.0.0  @created 2026-08-09
//
// Primeira camada REAL de vestuário multi-peça: itens `sob_*` da
// categoria nova `roupa_sobre` que vestem POR CIMA da roupa equipada.
// ZERO arte nova (regra inviolável): cada sobrepeça é um WRAPPER sobre
// o `renderCorpo` que a peça de origem JÁ TEM — os fragmentos de
// detalhe (alças/bolsos do colete, zíper da jaqueta, faixa do kimono,
// colar/painel do traje orbital) são ADITIVOS por construção (desenham
// detalhes sobre um torso), então compõem naturalmente sobre qualquer
// outra roupa:
//   • CORPO INTEIRO (palco 240×400): o fragmento entra direto, depois
//     do renderCorpo da roupa de baixo — mesmas coordenadas.
//   • BUSTO (240×240, inclusive o SVG SALVO): o fragmento entra pela
//     transformação inversa do mapa busto→corpo que o emblema já usa
//     (translate(15.8 -30.1) scale(0.85)  ⇒  inversa
//     translate(-18.588 35.412) scale(1.17647)), recortado à faixa do
//     peito (y ≥ 176) para nunca invadir o rosto — determinístico.
// Curadoria: só peças cujo renderCorpo lê como CAMADA DE CIMA entram
// (jersey/listras laterais, p.ex., lêem como estampa da própria peça e
// ficam de fora). Cada sobrepeça é incompatível com a roupa de origem
// (§35/§60.6 — primeiro uso real de incompativelCom no catálogo).
import type { ParteDef, ParteRender } from './base-api';
import { ROUPAS } from './partes/roupas';

/** Inversa exata do mapa busto→corpo do emblema (render.ts §renderAvatar). */
const CORPO_PARA_BUSTO = 'translate(-18.588 35.412) scale(1.17647)';

function wrapperBusto(renderCorpo: ParteRender): ParteRender {
  return (p, u) =>
    `<defs><clipPath id="${u}sobre"><rect x="0" y="176" width="240" height="64"/></clipPath></defs>` +
    `<g clip-path="url(#${u}sobre)"><g transform="${CORPO_PARA_BUSTO}">${renderCorpo(p, u)}</g></g>`;
}

interface CuradoriaSobre {
  origem: string;
  id: string;
  nome: string;
  descricao: string;
}

const CURADORIA: CuradoriaSobre[] = [
  { origem: 'rou_colete', id: 'sob_colete', nome: 'Colete de Missão', descricao: 'Alças e bolsos táticos por cima de qualquer look.' },
  { origem: 'rou_jaqueta', id: 'sob_jaqueta', nome: 'Jaqueta Aberta', descricao: 'Zíper e gola racer vestidos por cima da roupa.' },
  { origem: 'rou_kimono', id: 'sob_kimono', nome: 'Faixa do Dojo', descricao: 'A faixa e o traspasse do kimono sobre o traje atual.' },
  { origem: 'rou_astronauta', id: 'sob_orbital', nome: 'Kit Orbital', descricao: 'Colar de acople e painel de peito homologados p/ vácuo.' },
];

/** Itens da categoria `roupa_sobre` (vazio se alguma origem sumir — fail-safe). */
export const SOBREPECAS: ParteDef[] = CURADORIA.flatMap((c) => {
  const origem = ROUPAS.find((r) => r.id === c.origem);
  if (!origem?.renderCorpo) return [];
  const renderCorpo = origem.renderCorpo;
  return [{
    id: c.id,
    categoria: 'roupa_sobre' as const,
    nome: c.nome,
    descricao: c.descricao,
    raridade: origem.raridade,
    tema: origem.tema,
    usaCores: origem.usaCores,
    incompativelCom: [c.origem], // §35: redundância visual com a origem
    render: wrapperBusto(renderCorpo),
    renderCorpo, // corpo inteiro: mesmas coordenadas, entra direto
  }];
});
