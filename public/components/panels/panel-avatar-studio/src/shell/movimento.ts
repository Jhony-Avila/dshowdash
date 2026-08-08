// shell/movimento.ts — MOTION SYSTEM unificado (AS5 §285).
// @version 1.0.0  @created 2026-08-03
//
// Toda animação imperativa do shell passa por AQUI. Uma única fonte de
// verdade para: (1) o guard de redução de movimento (§297/§151), (2) o
// fail-safe em ambientes sem WAAPI (Element.animate ausente → resolve na
// hora, sem quebrar), (3) presets nomeados reutilizáveis. Componentes não
// chamam el.animate() diretamente — consomem `animar`/`sequencia`.
//
// Módulo PURO de DOM (sem React): testável no navegador, reutilizável por
// qualquer shell futuro (3D incluso). Dependência zero do restante do app.

/** Um passo de animação: keyframes + duração em ms. */
export type PassoMovimento = [Keyframe[], number];

export interface OpcoesMovimento {
  duracao?: number;
  easing?: string;
  /** true = mantém o estado final (fill forwards) */
  manter?: boolean;
}

/** §297: guard CENTRAL de redução de movimento — todos os consumidores
 *  perguntam aqui (nunca leem matchMedia por conta própria). */
export function movimentoReduzido(): boolean {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

/** WAAPI disponível? (JSDOM/browsers antigos não têm Element.animate) */
function temWaapi(el: Element): el is Element & { animate: Element['animate'] } {
  return typeof (el as HTMLElement).animate === 'function';
}

/**
 * Anima um elemento e resolve quando termina (ou imediatamente quando o
 * usuário prefere movimento reduzido / WAAPI não existe / a animação é
 * cancelada — NUNCA rejeita: animação é efeito cosmético, não fluxo).
 */
export async function animar(
  el: Element | null,
  quadros: Keyframe[],
  opcoes: OpcoesMovimento = {},
): Promise<void> {
  if (!el || movimentoReduzido() || !temWaapi(el)) return;
  try {
    await el.animate(quadros, {
      duration: opcoes.duracao ?? 300,
      easing: opcoes.easing ?? 'ease-in-out',
      fill: opcoes.manter ? 'forwards' : 'none',
    }).finished;
  } catch { /* cancelada (unmount/navegação) — cosmético, segue o jogo */ }
}

/** Roda passos EM SEQUÊNCIA (cada um espera o anterior). Interrompe em
 *  silêncio se um passo for cancelado. Base do Showcase §174. */
export async function sequencia(
  el: Element | null,
  passos: PassoMovimento[],
  opcoes: Omit<OpcoesMovimento, 'duracao'> = {},
): Promise<void> {
  if (!el || movimentoReduzido() || !temWaapi(el)) return;
  for (const [quadros, duracao] of passos) {
    try {
      await el.animate(quadros, {
        duration: duracao,
        easing: opcoes.easing ?? 'ease-in-out',
        fill: opcoes.manter === false ? 'none' : 'forwards',
      }).finished;
    } catch { break; }
  }
}

// ── Presets nomeados (§285) — vocabulário comum do estúdio ──────────

export const MOVIMENTOS = {
  /** entrada suave (drawer, popover, cards promovidos) */
  aparecer: [{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'scale(1)' }],
  /** confirmação leve (botão salvo, preset aplicado) */
  pulso: [
    { transform: 'scale(1)' }, { transform: 'scale(1.045)' }, { transform: 'scale(1)' },
  ],
  /** §158: brilho de raridade ao equipar épico/lendário (no palco) */
  brilho: [
    { filter: 'brightness(1) saturate(1)' },
    { filter: 'brightness(1.22) saturate(1.35)' },
    { filter: 'brightness(1) saturate(1)' },
  ],
  /** balanço curto de erro/recusa */
  balanco: [
    { transform: 'translateX(0)' }, { transform: 'translateX(-5px)' },
    { transform: 'translateX(5px)' }, { transform: 'translateX(0)' },
  ],
} satisfies Record<string, Keyframe[]>;

// ── AS6 L0 (lote 761–770 · §561): REGISTRY de animações CSS ─────────
// Toda @keyframes do estudio.css tem entrada AQUI (nome → propósito +
// categoria). O teste tokens-as6.mjs confere a paridade nos DOIS
// sentidos: keyframe sem registro = suíte vermelha; registro sem
// keyframe = suíte vermelha. É o que impede "animação solta" nova —
// mesma doutrina dos tokens de cor (nenhum valor sem nome).

export type CategoriaMovimento =
  | 'feedback'      // confirmações/erros (curta, uma vez)
  | 'estado'        // loading/skeleton/progresso (loop utilitário)
  | 'vida'          // idle/respiração do palco (loop ambiente, §119)
  | 'entrada'       // aparecer/materializar (uma vez, entrada de cena)
  | 'celebracao';   // conquistas/raridade (uma vez, chamativa)

export const REGISTRO_ANIMACOES: Record<string, { categoria: CategoriaMovimento; proposito: string }> = {
  'avst-girar': { categoria: 'estado', proposito: 'spinner de carregamento' },
  'avst-glow-respira': { categoria: 'vida', proposito: 'brilho respirando em destaque promovido' },
  'avst-toast': { categoria: 'entrada', proposito: 'entrada do toast' },
  'avst-flash': { categoria: 'feedback', proposito: 'flash de captura da foto' },
  'avst-pt': { categoria: 'feedback', proposito: 'pulso de ponto de interesse (tour §545)' },
  'avst-check-pop': { categoria: 'feedback', proposito: 'check de confirmação com pop' },
  'avst-shimmer': { categoria: 'estado', proposito: 'varredura de shimmer (raridade/skeleton)' },
  'avst-skel': { categoria: 'estado', proposito: 'pulso do skeleton §557' },
  'avst-adiado': { categoria: 'estado', proposito: 'indicador de salvamento adiado' },
  'avst5-fade': { categoria: 'entrada', proposito: 'fade genérico do shell' },
  'avst5-selo': { categoria: 'feedback', proposito: 'selo (título/poder) assentando' },
  'avst5-cele': { categoria: 'celebracao', proposito: 'celebração de equipar raro §158' },
  'avst5-cen-desliza': { categoria: 'vida', proposito: 'cenário deslizando (parallax §160)' },
  'avst5-cen-respira': { categoria: 'vida', proposito: 'cenário respirando (§160)' },
  'avst5-cenfade': { categoria: 'entrada', proposito: 'crossfade de cenário §157.4' },
  'avst5-climax': { categoria: 'celebracao', proposito: 'clímax do showcase §175' },
  'avst5-ent-ascender': { categoria: 'entrada', proposito: 'entrada 2D: ascender (§157.2)' },
  'avst5-ent-materializar': { categoria: 'entrada', proposito: 'entrada 2D: materializar (§157.2)' },
  'avst5-ent-teleporte': { categoria: 'entrada', proposito: 'entrada 2D: teleporte (§157.2)' },
  'avst5-idle-balancar': { categoria: 'vida', proposito: 'idle 2D: balanço sutil §119' },
  'avst5-idle-flutuar': { categoria: 'vida', proposito: 'idle 2D: flutuação §119' },
  'avst5-idle-respirar': { categoria: 'vida', proposito: 'idle 2D: respiração §119' },
  'avst5-mold-energia': { categoria: 'vida', proposito: 'moldura viva: energia §167' },
  'avst5-mold-pulso': { categoria: 'vida', proposito: 'moldura viva: pulso §167' },
  'avst5-mold-reativa': { categoria: 'vida', proposito: 'moldura viva: reação §167' },
  'avst5-poder-nome-entra': { categoria: 'entrada', proposito: 'nome do poder entrando §154' },
  'avst5-presenca': { categoria: 'vida', proposito: 'presença de palco §157.5' },
  'avst5-rec': { categoria: 'estado', proposito: 'ponto REC do modo captura' },
};

/** §174: a sequência cinematográfica do Showcase (fade → aproxima →
 *  gira → volta), ~6s no total — dado, não código, p/ evoluir fácil. */
export const SHOWCASE_174: PassoMovimento[] = [
  [[{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 1, transform: 'scale(1)' }], 900],
  [[{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }], 1700],
  [[{ transform: 'scale(1.22) rotate(0deg)' }, { transform: 'scale(1.16) rotate(-2.2deg)' },
    { transform: 'scale(1.2) rotate(2.2deg)' }, { transform: 'scale(1.18) rotate(0deg)' }], 2400],
  [[{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], 1000],
];
