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
export function ligarVida(host: Element, corpo = false): () => void {
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

  // piscada natural (2,8s–7s) — pálpebras sintéticas do motor
  const palpebras = buscar('palpebras');
  const piscar = () => {
    palpebras?.animate(
      [
        { opacity: 0 },
        { opacity: 1, offset: 0.4 },
        { opacity: 1, offset: 0.62 },
        { opacity: 0 },
      ],
      { duration: 170, easing: 'ease-in-out' },
    );
    cronometros.push(window.setTimeout(piscar, 2800 + Math.random() * 4200));
  };
  if (palpebras) cronometros.push(window.setTimeout(piscar, 1200 + Math.random() * 2000));

  return () => {
    anims.forEach((a) => a.cancel());
    cronometros.forEach((t) => window.clearTimeout(t));
  };
}
