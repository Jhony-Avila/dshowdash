// workspace/vida.ts — VIDA do avatar no SHELL NOVO (lote 1071–1080,
// decisão #109, flag as6.vida_shell).
// @version 1.0.0  @created 2026-08-09
//
// A auditoria FASE 0 apontou a REGRESSÃO: respiração/piscada/balanço só
// existiam no PalcoCinema do modo clássico — o viewport do shell novo
// ficava estático. Esta é a MESMA receita comprovada de lá (WAAPI sobre
// os grupos data-anim que o motor já emite no modo palco), extraída
// como função pura de DOM: ligar → devolve o desligador. §297: quem
// chama decide (o shell não liga com movimento reduzido). Nada disso
// toca o SVG salvo — grupos data-anim só existem com palco:true.
// onda 1414 (#162/#186): FACE IDLE PROFILES — o ritmo de piscada segue a
// EXPRESSÃO semântica (as6.face_v2): cansado pisca devagar e pesado,
// surpreso quase não pisca, bravo pisca seco. Dados puros; sem perfil
// (flag OFF / sem expressão) = curvas anteriores byte a byte.
export interface PerfilIdleFace {
  /** multiplicador do intervalo entre piscadas (1 = neutro) */
  intervalo: number;
  /** multiplicador da duração da piscada (1 = neutro) */
  duracao: number;
  /** chance de double-blink no premium (padrão 0.28) */
  doubleBlink?: number;
}

export const PERFIS_IDLE_FACE: Record<string, PerfilIdleFace> = {
  feliz: { intervalo: 0.9, duracao: 1 },
  serio: { intervalo: 1.2, duracao: 0.9, doubleBlink: 0.12 },
  surpreso: { intervalo: 1.8, duracao: 0.8, doubleBlink: 0.05 },
  bravo: { intervalo: 1.35, duracao: 0.75, doubleBlink: 0.1 },
  triste: { intervalo: 1.1, duracao: 1.25 },
  cansado: { intervalo: 0.7, duracao: 1.5, doubleBlink: 0.4 },
  confiante: { intervalo: 1.15, duracao: 0.9 },
};

export function perfilIdleDe(preset: string | undefined): PerfilIdleFace | undefined {
  return preset ? PERFIS_IDLE_FACE[preset] : undefined;
}

export function ligarVida(host: Element, corpo = false, premium = false, perfil?: PerfilIdleFace): () => void {
  const buscar = (nome: string): SVGGElement | null =>
    host.querySelector(`[data-anim="${nome}"]`);
  const anims: Animation[] = [];
  const cronometros: number[] = [];

  const personagem = buscar('personagem');
  if (personagem) {
    personagem.style.transformBox = 'view-box';
    personagem.style.transformOrigin = corpo ? '120px 250px' : '120px 170px';
    anims.push(personagem.animate(
      [
        { transform: 'translateY(0px) rotate(-0.5deg) scale(1)' },
        { transform: 'translateY(-1.8px) rotate(0.5deg) scale(1.006)' },
      ],
      { duration: 4200, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' },
    ));
  }

  const cabelo = buscar('cabelo');
  if (cabelo && cabelo.childNodes.length > 0) {
    cabelo.style.transformBox = 'view-box';
    cabelo.style.transformOrigin = '120px 64px';
    anims.push(cabelo.animate(
      [{ transform: 'rotate(-0.7deg)' }, { transform: 'rotate(0.7deg)' }],
      { duration: 3400, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' },
    ));
  }

  // piscada natural (2,8s–7s) — pálpebras sintéticas do motor.
  // onda 1412 (§707, as6.classico_premium): piscada PREMIUM — intervalo
  // mais variável (2,2–7,6s) e DOUBLE-BLINK ocasional (~28%), como gente
  // de verdade; premium=false = curva anterior byte a byte
  const palpebras = buscar('palpebras');
  const umaPiscada = () => palpebras?.animate(
    [
      { opacity: 0 },
      { opacity: 1, offset: 0.4 },
      { opacity: 1, offset: 0.62 },
      { opacity: 0 },
    ],
    { duration: (premium ? 150 : 170) * (perfil?.duracao ?? 1), easing: 'ease-in-out' },
  );
  const piscar = () => {
    umaPiscada();
    if (premium && Math.random() < (perfil?.doubleBlink ?? 0.28)) cronometros.push(window.setTimeout(umaPiscada, 230));
    const proximo = (premium ? 2200 + Math.random() * 5400 : 2800 + Math.random() * 4200) * (perfil?.intervalo ?? 1);
    cronometros.push(window.setTimeout(piscar, proximo));
  };
  if (palpebras) cronometros.push(window.setTimeout(piscar, 1200 + Math.random() * 2000));

  return () => {
    anims.forEach((a) => a.cancel());
    cronometros.forEach((t) => window.clearTimeout(t));
  };
}
