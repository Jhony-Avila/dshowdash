// engine/particulas.ts — BIBLIOTECA DE PARTÍCULAS reutilizável (mega 281 ·
// §156, lote 281–290).
// @version 1.0.0  @created 2026-08-05
//
// SVG puro com SMIL — mesma tecnologia dos efeitos 2D (zero dependência,
// funciona no palco, no card e na foto). DETERMINÍSTICA por construção:
// pseudo-aleatório por índice + semente (nunca Math.random) — o mesmo
// pedido rende SEMPRE os mesmos bytes (regra da casa: byte-stability).
// §156.2: parâmetros; §156.3: tiers de densidade. Quem chama decide o
// tier e respeita movimento reduzido (biblioteca não lê matchMedia).

export type TipoParticula =
  | 'pontos' | 'faiscas' | 'pixels' | 'cristais' | 'estrelas'
  | 'linhas' | 'circulos' | 'fragmentos' | 'neve' | 'fogo';

export type DirecaoParticulas = 'subir' | 'cair' | 'orbitar' | 'explodir';

export type TierParticulas = 'economico' | 'medio' | 'alto' | 'cinematico';

export interface ParamsParticulas {
  quantidade: number;        // base — o tier multiplica (§156.3)
  tamanho: number;           // px no viewBox 240
  velocidade: number;        // 0.5 = lenta · 1 = normal · 2 = rápida
  direcao: DirecaoParticulas;
  cor: string;
  opacidade: number;         // 0–1
  duracaoMs: number;         // vida de UMA partícula (loop infinito)
  turbulencia?: number;      // 0–1: variação lateral (§156.2)
}

/** §156.3: multiplicador de densidade por tier. */
const DENSIDADE: Record<TierParticulas, number> = {
  economico: 0.35, medio: 1, alto: 1.6, cinematico: 2.4,
};

/** Pseudo-aleatório determinístico em [0,1) por índice+semente+sal. */
function det(i: number, semente: number, sal: number): number {
  const x = ((i + 1) * 2654435761 + semente * 40503 + sal * 69069) % 4096;
  return x / 4096;
}

/** Forma de UMA partícula, centrada em (0,0) — o wrapper posiciona. */
function forma(tipo: TipoParticula, t: number, cor: string, i: number, semente: number): string {
  const meio = t / 2;
  switch (tipo) {
    case 'pontos':
      return `<circle r="${meio.toFixed(1)}" fill="${cor}"/>`;
    case 'faiscas':
      return `<line x1="${(-meio).toFixed(1)}" y1="0" x2="${meio.toFixed(1)}" y2="0" stroke="${cor}" stroke-width="1.2" stroke-linecap="round" transform="rotate(${Math.round(det(i, semente, 7) * 180)})"/>`;
    case 'pixels':
      return `<rect x="${(-meio).toFixed(1)}" y="${(-meio).toFixed(1)}" width="${t.toFixed(1)}" height="${t.toFixed(1)}" fill="${cor}"/>`;
    case 'cristais':
      return `<rect x="${(-meio).toFixed(1)}" y="${(-meio).toFixed(1)}" width="${t.toFixed(1)}" height="${t.toFixed(1)}" fill="${cor}" transform="rotate(45)"/>`;
    case 'estrelas':
      return `<path d="M0 ${-t} L${(t * 0.3).toFixed(1)} ${(-t * 0.3).toFixed(1)} L${t} 0 L${(t * 0.3).toFixed(1)} ${(t * 0.3).toFixed(1)} L0 ${t} L${(-t * 0.3).toFixed(1)} ${(t * 0.3).toFixed(1)} L${-t} 0 L${(-t * 0.3).toFixed(1)} ${(-t * 0.3).toFixed(1)} Z" fill="${cor}"/>`;
    case 'linhas':
      return `<line x1="0" y1="${(-t * 1.6).toFixed(1)}" x2="0" y2="${(t * 1.6).toFixed(1)}" stroke="${cor}" stroke-width="1.4"/>`;
    case 'circulos':
      return `<circle r="${t.toFixed(1)}" fill="none" stroke="${cor}" stroke-width="1.3"/>`;
    case 'fragmentos':
      return `<path d="M0 ${-t} L${t} ${t} L${-t} ${(t * 0.6).toFixed(1)} Z" fill="${cor}" transform="rotate(${Math.round(det(i, semente, 11) * 360)})"/>`;
    case 'neve':
      return `<circle r="${meio.toFixed(1)}" fill="${cor}" opacity="0.9"/><circle r="${(meio * 0.4).toFixed(1)}" fill="#fff" opacity="0.6"/>`;
    case 'fogo':
      return `<path d="M0 ${t} Q${(-t * 0.7).toFixed(1)} 0 0 ${-t} Q${(t * 0.7).toFixed(1)} 0 0 ${t} Z" fill="${cor}"/>`;
    default:
      return `<circle r="${meio.toFixed(1)}" fill="${cor}"/>`;
  }
}

/** Trajetória SMIL de UMA partícula conforme a direção (§156.2). */
function trajetoria(dir: DirecaoParticulas, i: number, semente: number, durS: string, turb: number): string {
  const x0 = 12 + det(i, semente, 1) * 216;
  const atraso = `${(det(i, semente, 5) * -8).toFixed(2)}s`;
  const dx = ((det(i, semente, 3) - 0.5) * 90 * turb).toFixed(1);
  if (dir === 'subir') {
    return `transform="translate(${x0.toFixed(1)} 0)">
      <animateTransform attributeName="transform" type="translate" additive="sum"
        values="0 252;${dx} -18" dur="${durS}" begin="${atraso}" repeatCount="indefinite"/>`;
  }
  if (dir === 'cair') {
    return `transform="translate(${x0.toFixed(1)} 0)">
      <animateTransform attributeName="transform" type="translate" additive="sum"
        values="0 -18;${dx} 252" dur="${durS}" begin="${atraso}" repeatCount="indefinite"/>`;
  }
  if (dir === 'orbitar') {
    const raio = 46 + det(i, semente, 9) * 62;
    return `transform="translate(120 120)">
      <animateTransform attributeName="transform" type="rotate" additive="sum"
        values="${Math.round(det(i, semente, 13) * 360)} 0 0;${Math.round(det(i, semente, 13) * 360) + 360} 0 0"
        dur="${durS}" begin="${atraso}" repeatCount="indefinite"/>
      <g transform="translate(${raio.toFixed(1)} 0)">`;
  }
  // explodir: nasce no centro e voa radialmente
  const ang = det(i, semente, 15) * Math.PI * 2;
  const alcance = 60 + det(i, semente, 17) * 70;
  const ex = (Math.cos(ang) * alcance).toFixed(1);
  const ey = (Math.sin(ang) * alcance).toFixed(1);
  return `transform="translate(120 120)">
    <animateTransform attributeName="transform" type="translate" additive="sum"
      values="0 0;${ex} ${ey}" dur="${durS}" begin="${atraso}" repeatCount="indefinite"/>`;
}

/**
 * SVG completo (viewBox 0 0 240 240) com o campo de partículas pedido.
 * `animado=false` (movimento reduzido §120) = poses estáticas espalhadas,
 * sem NENHUM <animate>.
 */
export function svgParticulas(
  tipo: TipoParticula,
  params: ParamsParticulas,
  tier: TierParticulas = 'medio',
  semente = 1,
  animado = true,
): string {
  const n = Math.max(1, Math.round(params.quantidade * DENSIDADE[tier]));
  const durS = `${Math.max(0.4, params.duracaoMs / 1000 / Math.max(0.1, params.velocidade)).toFixed(2)}s`;
  const turb = Math.min(1, Math.max(0, params.turbulencia ?? 0.3));
  const pecas: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = params.tamanho * (0.6 + det(i, semente, 19) * 0.8);
    const op = (params.opacidade * (0.55 + det(i, semente, 21) * 0.45)).toFixed(2);
    const corpo = forma(tipo, t, params.cor, i, semente);
    if (!animado) {
      const x = 12 + det(i, semente, 1) * 216;
      const y = 12 + det(i, semente, 23) * 216;
      pecas.push(`<g opacity="${op}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${corpo}</g>`);
      continue;
    }
    const traj = trajetoria(params.direcao, i, semente, durS, turb);
    const fechaOrbita = params.direcao === 'orbitar' ? '</g>' : '';
    pecas.push(`<g opacity="${op}" ${traj}${corpo}${fechaOrbita}</g>`);
  }
  return `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${pecas.join('')}</svg>`;
}
