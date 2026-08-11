// domain/animacao.ts — CONTRATO DE ANIMAÇÃO (mega programa P6, onda
// 1381, decisão #148). SÓ CONTRATO: nenhum runtime muda até a arte de
// movimento chegar — o briefing mestre §8 proíbe forçar animações no
// renderer de assets estáticos, então o tipo nasce separado.
// @version 1.0.0  @created 2026-08-11
//
// Como será consumido (quando houver arte):
// - um AssetAnimacao NUNCA entra em `camadas` (byte-stability #141) —
//   vive em campo próprio do estado de apresentação (studio/palco),
//   fora da serialização §619 do avatar salvo;
// - o player aplica `keyframes` CSS/SMIL sobre GRUPOS nomeados do SVG
//   já renderizado (data-anim existentes) ou dispara sequências do
//   palco 3D — a arte estática permanece intocada;
// - emotes (§120) e personalidades (§117) atuais são os primeiros
//   candidatos a migrar para este contrato SEM mudança de comportamento.

/** Categorias de movimento do briefing mestre P6. */
export type TipoAnimacao =
  | 'expressao'      // alegre, séria, brava, surpresa…
  | 'olhar'          // direção do olhar, piscar
  | 'pose'           // frontal, perfil, heroica…
  | 'gesto'          // acenar, positivo, aplaudir…
  | 'idle'           // respirar, olhar ao redor
  | 'locomocao'      // caminhar, correr, saltar, voar
  | 'danca'
  | 'emote'
  | 'interacao'
  | 'entrada'        // aparecer, teletransportar, surgir com efeito
  | 'saida';         // desaparecer, dissolver, voar

export interface AssetAnimacao {
  id: string;
  tipo: TipoAnimacao;
  nome: string;
  /** grupos-alvo no SVG (data-anim) ou trilha 3D nomeada */
  alvos: string[];
  /** duração em ms; 0 = estado estático (pose) */
  duracaoMs: number;
  /** loop contínuo (idle/locomoção) ou one-shot (emote/entrada/saída) */
  loop: boolean;
  /** animações que não podem rodar juntas (mesmo grupo corporal) */
  conflitaCom?: string[];
  /** respeita prefers-reduced-motion (obrigatório true por padrão) */
  respeitaMovimentoReduzido: boolean;
}

/** Registry (vazio até a arte de movimento chegar — mesma doutrina de
 *  estados da taxonomia: nada vazio publicado como completo). */
export const ANIMACOES: AssetAnimacao[] = [];
