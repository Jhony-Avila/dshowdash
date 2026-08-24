// engine/partes/premium/vestuario.ts — onda 1415 (MEGA_BRIEFING_01 P10-D,
// P5-B, P5-C; decisões #166/#191): VESTUÁRIO PREMIUM — 8 roupas `rou_px_*`
// novas, 2 sobrepeças `sob_px_*`, 3 roupas inferiores `rin_*` e 3 calçados
// premium no slot `pes`. Arte NOVA (partes/* intocadas).
//
// Regras do trilho: zero filtros (§2510), defs por uid, tokens de material
// (materiais2d) em toda peça, canal `secundario` (#191) nos forros/camadas
// internas com fallback determinístico (`secundarioPadraoDe`), sombra de
// contato padrão do motor (peça só declara quando tem forma própria).
// `rin_*`/calçados: busto NÃO desenha (render vazio — byte-stability
// trivial); a arte vive no `renderCorpo` (corpo inteiro 240×400).
// @version 1.0.0  @created 2026-08-21
import { alfa, secundarioPadraoDe, tintaPremium } from '../../cores';
import type { Paleta } from '../../cores';
import { material2d } from '../../materiais2d';
import type { Material2d } from '../../materiais2d';
import { PATH_OMBROS } from '../../base-api';
import type { ParteDef } from '../../base-api';
import { anatomiaCorpo } from '../corpo';
import type { AnatomiaCorpo, PerfilCorpo2D } from '../corpo';
import { silhuetaFit } from '../../fit'; // Golden A+2: silhueta dirigida por classe de caimento
import { flag } from '../../../nucleo/flags';

const SOMBRA_PESCOCO = `<path d="M96 186 c 6 10 42 10 48 0 c -2 12 -46 12 -48 0 z" fill="rgba(0,0,0,0.25)"/>`;

/** Canal secundário efetivo (#191): escolhido OU derivado da roupa. */
const sec = (p: Paleta): ReturnType<typeof tintaPremium> =>
  tintaPremium(p.secundario?.base ?? secundarioPadraoDe(p.roupa.base));

// ── Golden V2 (#219 §52-65): GEOMETRIA DE ROUPA PARAMÉTRICA — as peças de
// corpo inteiro (renderCorpoV2) são construídas sobre a AnatomiaCorpo do
// perfil, com "ease" (folga) por peça. Assim a MESMA peça veste slim, standard,
// atlético e feminino sem sobrar/faltar tecido. Só usado no premium.

// Golden V3.1 (#219 §52-65): SILHUETAS AUTORAIS por peça (a FORMA PRIMÁRIA é
// desenhada peça a peça; anatomiaCorpo só posiciona; dobras NÃO são a autoria).
// `suave` = spline fechada Catmull-Rom por pontos → contorno orgânico (ombro
// arredondado, cintura, flare) sem trapézio genérico.
type Pt = [number, number];
function suave(pts: Pt[]): string {
  const n = pts.length; let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}
// §7 (V3.2): `sil` genérico REMOVIDO — cada peça tem função autoral própria
// (pathCamisetaGolden/pathHoodieGolden/pathBlazerGolden/pathSobretudoGolden).

// As mangas seguem o EIXO REAL do braço (anatomiaCorpo.arm*) como tubo cônico
// levemente mais largo que o membro (folga) — assim SEMPRE cobrem o braço, em
// qualquer perfil, em vez de flutuar ao lado. Ombro→cotovelo→punho; mão de fora.

/** Manga curta: capa do deltóide que termina acima do cotovelo. */
function mangaCurta(A: AnatomiaCorpo, s: 1 | -1, folgaOmb = 5, folga = 3): string {
  const { cx, yOmb, yCot } = A;
  const shX = A.armSh, elX = A.armEl, yEnd = yOmb + (yCot - yOmb) * 0.55;
  const hu = A.braco + folgaOmb, he = A.braco + folga;
  const midX = shX + (elX - shX) * 0.55;
  return `M${cx + s * (shX - 3)} ${yOmb - 2}
    C ${cx + s * (shX + hu)} ${yOmb + 4} ${cx + s * (midX + he + 2)} ${yEnd - 8} ${cx + s * (midX + he)} ${yEnd}
    C ${cx + s * (midX + he - 1)} ${yEnd + 4} ${cx + s * (midX - he + 1)} ${yEnd + 4} ${cx + s * (midX - he)} ${yEnd}
    C ${cx + s * (midX - he)} ${yEnd - 10} ${cx + s * (shX - hu + 2)} ${yOmb + 6} ${cx + s * (shX - 4)} ${yOmb - 2} Z`;
}

/** Manga longa: tubo cônico ombro→punho, sempre cobrindo o braço; mão de fora. */
function mangaLonga(A: AnatomiaCorpo, s: 1 | -1, folgaOmb = 5, folga = 3): string {
  const { cx, yOmb, yCot, yPun } = A;
  const shX = A.armSh, elX = A.armEl, wrX = A.armWr;
  const hu = A.braco + folgaOmb, he = A.braco + folga, hw = A.anta + folga;
  return `M${cx + s * (shX + hu - 2)} ${yOmb - 3}
    C ${cx + s * (shX + hu + 2)} ${yOmb + 12} ${cx + s * (elX + he + 1)} ${yCot - 16} ${cx + s * (elX + he)} ${yCot}
    C ${cx + s * (elX + he)} ${yCot + 14} ${cx + s * (wrX + hw + 1)} ${yPun - 16} ${cx + s * (wrX + hw)} ${yPun}
    C ${cx + s * (wrX + hw)} ${yPun + 5} ${cx + s * (wrX - hw)} ${yPun + 5} ${cx + s * (wrX - hw)} ${yPun}
    C ${cx + s * (wrX - hw - 1)} ${yPun - 16} ${cx + s * (elX - he)} ${yCot + 14} ${cx + s * (elX - he)} ${yCot}
    C ${cx + s * (elX - he - 1)} ${yCot - 16} ${cx + s * (shX - hu + 4)} ${yOmb + 10} ${cx + s * (shX - hu + 2)} ${yOmb - 3} Z`;
}

// ══ Golden V3.2 §7-11: SILHUETAS AUTORAIS por peça — funções PRÓPRIAS, com
//    control points PRÓPRIOS (não o helper paramétrico `sil` compartilhado).
//    Cada peça tem construção e assinatura distintas no SILHOUETTE BLACK TEST:
//    tee=fitted+manga curta · hoodie=capuz+massa que recolhe · blazer=ombro
//    estruturado+cintura suprimida+lapela rolada · sobretudo=LONGO+A-line.
//    `suave` (Catmull-Rom) é só o traçador do spline; a AUTORIA é o point-list.

/** §8 CAMISETA: fitted, ombro natural, gola redonda, leve cintura, barra curva,
 *  microassimetria controlada (lado direito levemente mais cheio). */
function pathCamisetaGolden(A: AnatomiaCorpo): { torso: string } {
  const { cx, yOmb, yPei, yCin, yQua } = A;
  const sh = A.ombro + 2, ch = A.peito + 2, wa = A.cintura + 4, hip = A.quadril + 2;
  const yHem = yQua + 12;
  const R: Pt[] = [[cx + 9, yOmb + 1], [cx + sh, yOmb + 4], [cx + ch, yPei + 3], [cx + wa + 0.8, yCin + 2], [cx + hip, yHem - 6], [cx + hip - 4, yHem]];
  const L: Pt[] = [[cx - hip + 4, yHem + 1], [cx - hip, yHem - 6], [cx - wa, yCin + 2], [cx - ch, yPei + 3], [cx - sh, yOmb + 4], [cx - 9, yOmb + 1]];
  return { torso: suave([...R, ...L, [cx, yOmb + 7]]) };
}

/** §9 HOODIE: ombro CAÍDO, capuz com volume atrás do pescoço (assinatura),
 *  massa relaxada e bojuda que RECOLHE na barra (rib < quadril). */
function pathHoodieGolden(A: AnatomiaCorpo): { torso: string; capuz: string; barraY: number; hemW: number } {
  const { cx, yOmb, yPei, yCin, yQua, yEnt } = A;
  // massa superior (ombro/peito) larga → drape na cintura → RECOLHE na barra:
  // taper progressivo (não caixa). ch é o ponto mais largo; wa e hem recolhem.
  const sh = A.ombro + 9, ch = A.peito + 10, wa = A.cintura + 8, hipW = A.quadril + 3, hemW = A.quadril - 3;
  const dy = yOmb + 8;                    // ombro caído
  const yHem = yEnt + 5;
  const R: Pt[] = [[cx + 15, dy - 6], [cx + sh, dy + 1], [cx + ch, yPei + 10], [cx + wa, yCin + 8], [cx + hipW, yQua + 10], [cx + hemW, yHem]];
  const L: Pt[] = [[cx - hemW, yHem + 1], [cx - hipW, yQua + 10], [cx - wa, yCin + 8], [cx - ch, yPei + 10], [cx - sh, dy + 1], [cx - 15, dy - 6]];
  const torso = suave([...R, ...L, [cx, dy - 2]]);
  // CAPUZ: lobo atrás/acima do pescoço — sobe acima dos ombros (a assinatura)
  const capuz = `M${cx - 25} ${yOmb + 3} C ${cx - 33} ${yOmb - 32} ${cx - 12} ${yOmb - 42} ${cx} ${yOmb - 42} C ${cx + 12} ${yOmb - 42} ${cx + 33} ${yOmb - 32} ${cx + 25} ${yOmb + 3} C ${cx + 13} ${yOmb - 9} ${cx - 13} ${yOmb - 9} ${cx - 25} ${yOmb + 3} Z`;
  return { torso, capuz, barraY: yHem - 8, hemW };
}

/** §10 BLAZER (HERO): ombro ESTRUTURADO (quase reto/quadrado), cintura
 *  SUPRIMIDA, front quarters no quadril, barra. Lapela vem em função à parte. */
function pathBlazerGolden(A: AnatomiaCorpo): { torso: string } {
  const { cx, yOmb, yPei, yCin, yQua, yEnt } = A;
  // Golden A+2 (§16): com as6.fit_v2, as meias-larguras vêm do FIT ENGINE
  // (silhuetaFit STRUCTURED — alfaiataria) e o body-follow veste qualquer perfil
  // por dados; sem a flag, as folgas hand-tuned de sempre (byte a byte §651).
  let sh = A.ombro + 2, ch = A.peito + 1, wa = A.cintura - 2, hip = A.quadril + 4;
  if (flag('as6.fit_v2')) {
    const s = silhuetaFit(A, 'STRUCTURED');
    sh = s.ombroW; ch = s.peitoW; wa = s.cinturaW; hip = s.quadrilW;
  }
  const yHem = yEnt;
  const R: Pt[] = [[cx + 11, yOmb - 2], [cx + sh, yOmb - 2], [cx + sh - 1, yPei - 8], [cx + ch, yPei + 4], [cx + wa, yCin + 2], [cx + hip, yQua + 10], [cx + hip - 5, yHem]];
  const L: Pt[] = [[cx - hip + 5, yHem + 1], [cx - hip, yQua + 10], [cx - wa, yCin + 2], [cx - ch, yPei + 4], [cx - sh + 1, yPei - 8], [cx - sh, yOmb - 2], [cx - 11, yOmb - 2]];
  return { torso: suave([...R, ...L, [cx, yOmb + 3]]) };
}

/** §11 SOBRETUDO: casaco LONGO estruturado (mid-coxa — a assinatura), ombro,
 *  A-line MODERADA (alfaiataria, não sino/robe), gola alta em função à parte. */
function pathSobretudoGolden(A: AnatomiaCorpo): { torso: string; gola: string; yHem: number } {
  const { cx, yOmb, yPei, yCin, yQua } = A;
  const sh = A.ombro + 4, ch = A.peito + 4, wa = A.cintura + 3, hip = A.quadril + 7, hemW = A.quadril + 12;
  const yHem = 316;                       // LONGO — mid-coxa (yJoe≈298). Assinatura.
  const R: Pt[] = [[cx + 12, yOmb - 1], [cx + sh, yOmb + 1], [cx + ch, yPei + 4], [cx + wa, yCin + 4], [cx + hip, yQua + 26], [cx + hemW, yHem]];
  const L: Pt[] = [[cx - hemW, yHem + 1], [cx - hip, yQua + 26], [cx - wa, yCin + 4], [cx - ch, yPei + 4], [cx - sh, yOmb + 1], [cx - 12, yOmb - 1]];
  const torso = suave([...R, ...L, [cx, yOmb + 3]]);
  const gola = `M${cx - 15} ${yOmb - 1} C ${cx - 23} ${yOmb - 13} ${cx - 8} ${yOmb - 9} ${cx - 3} ${yOmb + 6} L ${cx - 1} ${yPei + 6} L ${cx + 1} ${yPei + 6} L ${cx + 3} ${yOmb + 6} C ${cx + 8} ${yOmb - 9} ${cx + 23} ${yOmb - 13} ${cx + 15} ${yOmb - 1} Z`;
  return { torso, gola, yHem };
}

// Golden V3 (#219 §52-65): DOBRAS autorais — o que separa "polígono" de
// "tecido". Poucas dobras PRINCIPAIS seguindo o corpo (tensão ombro→esterno,
// recolhimento na cintura, quebra na barra), recortadas na peça. `tens` = força
// da tensão de ombro; `barra` = y da barra p/ a quebra inferior.
function dobras(A: AnatomiaCorpo, torso: string, u: string, o: { tens?: number; barra: number; w?: number } = { barra: 0 }, m?: Material2d): string {
  const { cx, yOmb, yPei, yCin } = A; const clip = `${u}fold`;
  const w = o.w ?? A.peito, by = o.barra || A.yQua;
  // VALES (fundo da dobra, sombra) e CRISTAS (topo, pega luz) — geometria; a
  // RESPOSTA à luz vem do material (m.dobra): couro brilha, lã não (§79).
  const vales = [
    `M${cx - w + 8} ${yOmb + 5} C ${cx - 16} ${yPei - 6} ${cx - 10} ${yPei + 8} ${cx - 3} ${yCin - 2}`,
    `M${cx + w - 8} ${yOmb + 5} C ${cx + 16} ${yPei - 6} ${cx + 10} ${yPei + 8} ${cx + 3} ${yCin - 2}`,
    `M${cx - w * 0.6} ${yCin} C ${cx - 10} ${yCin + 6} ${cx + 10} ${yCin + 6} ${cx + w * 0.6} ${yCin}`,
    `M${cx - w * 0.5} ${by - 6} q ${w * 0.5} 8 ${w} 0`,
  ];
  const cristas = [
    `M${cx - w + 12} ${yOmb + 7} C ${cx - 14} ${yPei - 4} ${cx - 8} ${yPei + 8} ${cx - 2} ${yCin - 2}`,
    `M${cx + w - 12} ${yOmb + 7} C ${cx + 14} ${yPei - 4} ${cx + 8} ${yPei + 8} ${cx + 2} ${yCin - 2}`,
  ];
  const resp = m ? m.dobra(u, cristas, vales)
    : vales.map((d) => `<path d="${d}" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="4" stroke-linecap="round"/>`).join('')
    + cristas.map((d) => `<path d="${d}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2" stroke-linecap="round"/>`).join('');
  return `<defs><clipPath id="${clip}"><path d="${torso}"/></clipPath></defs><g clip-path="url(#${clip})">${resp}</g>`;
}
// dobras de MANGA longa (cotovelo) — 1-2 rugas no interior do cotovelo
function dobrasManga(A: AnatomiaCorpo, s: 1 | -1): string {
  const { cx, yCot } = A; const ex = A.armEl;
  return `<path d="M${cx + s * (ex - 4)} ${yCot - 4} q ${s * 8} 6 ${s * 4} 14" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="2.4" stroke-linecap="round"/>`;
}

// ── 8 ROUPAS PREMIUM NOVAS (busto) ──────────────────────────────────────

export const ROUPAS_PREMIUM_1415: ParteDef[] = [
  {
    id: 'rou_px_camiseta', materialToken: 'cotton', categoria: 'roupa', nome: 'Camiseta Premium',
    descricao: 'Algodão com caimento real e gola viva.', raridade: 'comum',
    tema: 'casual', usaCores: ['roupa', 'destaque'], acabamento: 'premium',
    render: (p, u) => {
      const alg = material2d('cotton', p.roupa.base);
      return `<defs>${alg.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${alg.fill(u)}"/>
      <path d="M104 186 q 16 14 32 0 q -4 12 -16 12 q -12 0 -16 -12 z" fill="${alg.tinta.escuro}"/>
      <path d="M106 188 q 14 11 28 0" stroke="${alfa(alg.tinta.brilho, 0.5)}" stroke-width="1.6" fill="none"/>
      <path d="M88 206 q 4 14 2 30 M152 206 q -4 14 -2 30" stroke="${alfa(alg.tinta.profundo, 0.4)}" stroke-width="1.6" fill="none"/>
      <circle cx="146" cy="226" r="3.4" fill="${p.destaque.base}"/>
      ${SOMBRA_PESCOCO}`;
    },
    // §56 CAMISETA: manga curta, ombro suave, chest drape, cintura, barra.
    // Silhueta FITTED (a mais justa das 4).
    // §56 CAMISETA: FITTED (menor ease), manga curta, decote redondo, barra
    // na cintura. Veste a anatomia do perfil.
    renderCorpoV2: (p, u, perfil) => {
      const A = anatomiaCorpo(perfil as PerfilCorpo2D);
      const m = material2d('cotton', p.roupa.base);
      const { torso } = pathCamisetaGolden(A); // §8: silhueta autoral fitted
      const sl = mangaCurta(A, -1, 5, 3) + mangaCurta(A, 1, 5, 3);
      return `<defs>${m.defs(u)}</defs>
      <path d="${sl}" fill="${m.fill(u)}"/>
      <path d="${torso}" fill="${m.fill(u)}"/>
      ${m.realce(u, torso)}
      ${dobras(A, torso, u, { tens: 1.1, barra: A.yQua + 4 }, m)}
      <!-- costura de ombro + bainha da manga curta -->
      <path d="M${A.cx - A.ombro + 2} ${A.yOmb + 2} q ${A.ombro - 6} -4 ${A.ombro * 2 - 10} 0 M${A.cx - A.peito - 2} ${A.yPei + 14} q 3 -3 5 -8 M${A.cx + A.peito + 2} ${A.yPei + 14} q -3 -3 -5 -8" fill="none" stroke="${alfa(m.tinta.profundo, 0.35)}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M${A.cx - 14} ${A.yOmb + 2} q 14 12 28 0 q -3 10 -14 10 q -11 0 -14 -10 z" fill="${m.tinta.escuro}"/>
      <path d="M${A.cx - 13} ${A.yOmb + 3} q 13 10 26 0" stroke="${alfa(m.tinta.brilho, 0.5)}" stroke-width="1.5" fill="none"/>`;
    },
  },
  {
    id: 'rou_px_camisa', materialToken: 'cotton', categoria: 'roupa', nome: 'Camisa Premium',
    descricao: 'Colarinho firme, botões e forro no punho.', raridade: 'incomum',
    tema: 'executivo', usaCores: ['roupa', 'destaque', 'secundario'], acabamento: 'premium',
    render: (p, u) => {
      const alg = material2d('cotton', p.roupa.base);
      const forro = sec(p);
      return `<defs>${alg.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${alg.fill(u)}"/>
      <path d="M104 186 l 12 10 v 44 h -8 z M136 186 l -12 10 v 44 h 8 z" fill="${alg.tinta.claro}"/>
      <path d="M104 186 l 12 10 l -6 8 l -10 -10 z M136 186 l -12 10 l 6 8 l 10 -10 z" fill="${forro.base}"/>
      <path d="M120 198 v 42" stroke="${alfa(alg.tinta.profundo, 0.5)}" stroke-width="1.4"/>
      <circle cx="120" cy="208" r="1.5" fill="${forro.claro}"/><circle cx="120" cy="220" r="1.5" fill="${forro.claro}"/><circle cx="120" cy="232" r="1.5" fill="${forro.claro}"/>
      ${SOMBRA_PESCOCO}`;
    },
  },
  {
    id: 'rou_px_hoodie', materialToken: 'wool', categoria: 'roupa', nome: 'Hoodie Premium',
    descricao: 'Moletom com capuz de forro vivo e cordões.', raridade: 'incomum',
    tema: 'urbano', usaCores: ['roupa', 'destaque', 'secundario'], acabamento: 'premium',
    render: (p, u) => {
      const mol = material2d('wool', p.roupa.base);
      const forro = sec(p);
      return `<defs>${mol.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${mol.fill(u)}"/>
      <path d="M94 196 q 26 26 52 0 q 2 10 -6 14 q -20 10 -40 0 q -8 -4 -6 -14 z" fill="${mol.tinta.escuro}"/>
      <path d="M98 196 q 22 20 44 0 q -2 -8 -22 -8 q -20 0 -22 8 z" fill="${forro.base}"/>
      <path d="M100 197 q 20 16 40 0" stroke="${alfa(forro.claro, 0.6)}" stroke-width="1.6" fill="none"/>
      <path d="M112 210 q -1 12 1 20 M128 210 q 1 12 -1 20" stroke="${p.destaque.base}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <circle cx="113" cy="232" r="2" fill="${p.destaque.escuro}"/><circle cx="127" cy="232" r="2" fill="${p.destaque.escuro}"/>
      <path d="M92 226 h 18 q 2 8 -2 12 h -14 z M148 226 h -18 q -2 8 2 12 h 14 z" fill="${alfa(mol.tinta.profundo, 0.5)}"/>`;
    },
    // §58 HOODIE: dropped shoulder, manga GROSSA/longa, capuz com volume
    // traseiro, torso LARGO (menos ajustado), cuff, hem. Silhueta mais BOJUDA.
    // §58 HOODIE: RELAXED (ease maior), ombro caído, manga longa e grossa,
    // capuz com volume traseiro, cuff + hem band, bolso canguru, cordões.
    renderCorpoV2: (p, u, perfil) => {
      const A = anatomiaCorpo(perfil as PerfilCorpo2D);
      const m = material2d('wool', p.roupa.base);
      const forro = sec(p);
      const { cx, yOmb, yPei } = A;
      const { torso, capuz, barraY, hemW } = pathHoodieGolden(A); // §9: capuz+massa que recolhe
      const sl = mangaLonga(A, -1, 8, 6) + mangaLonga(A, 1, 8, 6);
      const cuffY = 244, hemY = barraY, pkTop = A.yCin + 6;
      const wx = A.quadril + 9;
      return `<defs>${m.defs(u)}</defs>
      <!-- §9 CAPUZ (volume atrás/acima do pescoço) — assinatura da silhueta -->
      <path d="${capuz}" fill="${m.tinta.escuro}"/>
      <path d="M${cx - 22} ${yOmb - 2} q 22 16 44 0 q -3 -12 -22 -12 q -19 0 -22 12 z" fill="${forro.base}"/>
      <path d="${sl}" fill="${m.fill(u)}"/>
      ${dobrasManga(A, -1)}${dobrasManga(A, 1)}
      <path d="${torso}" fill="${m.fill(u)}"/>
      ${m.realce(u, torso)}
      ${dobras(A, torso, u, { tens: 0.7, barra: A.yEnt - 2, w: A.peito + 8 }, m)}
      <!-- cuffs + hem band -->
      <path d="M${cx - wx - 3} ${cuffY} l 12 2 -2 10 -12 -2 z M${cx + wx + 3} ${cuffY} l -12 2 2 10 12 -2 z" fill="${m.tinta.profundo}"/>
      <!-- rib hem que RECOLHE (§9): mais estreito que o quadril -->
      <path d="M${cx - hemW} ${hemY} q ${hemW} 5 ${hemW * 2} 0 l 0 11 q ${-hemW} 5 ${-hemW * 2} 0 z" fill="${alfa(m.tinta.profundo, 0.5)}"/>
      <path d="M${cx - hemW + 3} ${hemY + 4} q ${hemW - 3} 4 ${(hemW - 3) * 2} 0" stroke="${alfa(m.tinta.profundo, 0.6)}" stroke-width="1" fill="none"/>
      <!-- bolso canguru + cordões -->
      <path d="M${cx - 26} ${pkTop} q 26 10 52 0 l -4 20 q -22 8 -44 0 z" fill="${alfa(m.tinta.profundo, 0.38)}"/>
      <path d="M${cx - 8} ${yPei + 6} q -1 16 1 26 M${cx + 8} ${yPei + 6} q 1 16 -1 26" stroke="${p.destaque.base}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`;
    },
  },
  {
    id: 'rou_px_blazer', materialToken: 'wool', categoria: 'roupa', nome: 'Blazer Premium',
    descricao: 'Estrutura de ombro e forro de cetim — poder silencioso.', raridade: 'raro',
    tema: 'executivo', usaCores: ['roupa', 'destaque', 'secundario'], acabamento: 'premium',
    render: (p, u) => {
      const la = material2d('wool', p.roupa.base);
      const forro = sec(p);
      return `<defs>${la.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${la.fill(u)}"/>
      <path d="M104 188 l 16 14 l 16 -14 v 52 h -32 z" fill="${forro.escuro}"/>
      <path d="M107 191 l 13 11 l 13 -11" stroke="${alfa(forro.brilho, 0.5)}" stroke-width="1.4" fill="none"/>
      <path d="M96 186 c 6 8 14 14 24 16 l -14 26 c -9 -12 -12 -27 -10 -42 z" fill="${la.tinta.profundo}"/>
      <path d="M144 186 c -6 8 -14 14 -24 16 l 14 26 c 9 -12 12 -27 10 -42 z" fill="${la.tinta.profundo}"/>
      <path d="M98 189 q 8 10 20 13 M142 189 q -8 10 -20 13" stroke="${alfa(la.tinta.brilho, 0.45)}" stroke-width="1.5" fill="none"/>
      <circle cx="118" cy="228" r="1.8" fill="${p.destaque.base}"/>
      ${SOMBRA_PESCOCO}`;
    },
    // §60 BLAZER: ombro PADDED quadrado, lapela, chest taper, manga, cintura
    // marcada, abertura frontal. Silhueta ESTRUTURADA (ombros retos).
    // §60 BLAZER: ESTRUTURADO — ombro reto (padded), manga longa, cintura
    // marcada, lapela + abertura frontal com forro, botões.
    renderCorpoV2: (p, u, perfil) => {
      const A = anatomiaCorpo(perfil as PerfilCorpo2D);
      const la = material2d('wool', p.roupa.base);
      const { cx, yOmb, yPei, yCin } = A;
      const yHem = A.yEnt;                 // blazer desce até o quadril
      const { torso } = pathBlazerGolden(A); // §10: ombro estruturado + cintura suprimida
      const sl = mangaLonga(A, -1, 5, 4) + mangaLonga(A, 1, 5, 4);
      const nk = 11;                       // meia-abertura do decote/colarinho
      return `<defs>${la.defs(u)}</defs>
      <path d="${sl}" fill="${la.fill(u)}"/>
      ${dobrasManga(A, -1)}${dobrasManga(A, 1)}
      <path d="${torso}" fill="${la.fill(u)}"/>
      ${la.realce(u, torso)}
      ${dobras(A, torso, u, { tens: 0.6, barra: yHem, w: A.peito }, la)}
      <!-- bolso no peito + bolso lateral (construção) -->
      <path d="M${cx - A.peito + 6} ${yPei + 4} h 12 v 3 h -12 z" fill="none" stroke="${alfa(la.tinta.profundo, 0.5)}" stroke-width="1.2"/>
      <path d="M${cx - A.cintura} ${yCin + 10} h 16 M${cx + A.cintura - 16} ${yCin + 10} h 16" stroke="${alfa(la.tinta.profundo, 0.5)}" stroke-width="1.4" stroke-linecap="round"/>
      <!-- punho (cuff) -->
      <path d="M${cx - A.armWr - 7} 246 q 8 3 15 0 M${cx + A.armWr + 7} 246 q -8 3 -15 0" stroke="${alfa(la.tinta.profundo, 0.55)}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <!-- §10 FRENTE do blazer: camisa V + gravata AFUNILADA (menor) + lapelas
           que são o PRÓPRIO tecido da jaqueta (nascem na gola → rolam → convergem
           no button stance), não formas escuras coladas. -->
      ${(() => {
        const yBtn = yCin + 4; const tie = tintaPremium(p.destaque.base);
        // lapela = painel de tecido da jaqueta (la.fill) com roll highlight + gorge
        const lapela = (S: 1 | -1) => `<path d="M${cx + S * 2} ${yOmb + 4}
          C ${cx + S * 7} ${yOmb - 1} ${cx + S * nk} ${yOmb - 2} ${cx + S * 16} ${yOmb + 1}
          C ${cx + S * 20} ${yPei - 14} ${cx + S * 18} ${yPei - 2} ${cx + S * 13} ${yPei + 6}
          C ${cx + S * 9} ${yPei + 12} ${cx + S * 5} ${yCin - 8} ${cx + S * 2.5} ${yBtn}
          C ${cx + S * 3.5} ${yPei + 6} ${cx + S * 3} ${yOmb + 12} ${cx + S * 2} ${yOmb + 4} Z" fill="${la.fill(u)}"/>
          <path d="M${cx + S * 3} ${yOmb + 8} C ${cx + S * 4.2} ${yPei - 4} ${cx + S * 4.2} ${yPei + 4} ${cx + S * 3} ${yBtn - 4}" fill="none" stroke="${alfa(la.tinta.brilho, 0.4)}" stroke-width="1.3" stroke-linecap="round"/>
          <path d="M${cx + S * 11} ${yOmb} l ${S * 5} 3.4" stroke="${alfa(la.tinta.profundo, 0.5)}" stroke-width="1.2" stroke-linecap="round"/>
          <path d="M${cx + S * 16} ${yOmb + 1} C ${cx + S * 19} ${yPei - 12} ${cx + S * 17} ${yPei - 2} ${cx + S * 13} ${yPei + 5}" fill="none" stroke="${alfa(la.tinta.profundo, 0.35)}" stroke-width="1"/>`;
        return `<!-- camisa V (atrás das lapelas) -->
        <path d="M${cx - nk + 1} ${yOmb + 3} C ${cx - nk + 2} ${yPei - 8} ${cx - 6} ${yPei} ${cx} ${yBtn - 2} C ${cx + 6} ${yPei} ${cx + nk - 2} ${yPei - 8} ${cx + nk - 1} ${yOmb + 3} Z" fill="#eef1f5"/>
        <!-- gola/colarinho da camisa -->
        <path d="M${cx - 6} ${yOmb + 4} l 6 5 l 6 -5" fill="none" stroke="${alfa('#c7cdd6', 0.8)}" stroke-width="1"/>
        <!-- gravata AFUNILADA menor (não domina) -->
        <path d="M${cx - 3.4} ${yOmb + 8} L ${cx + 3.4} ${yOmb + 8} L ${cx + 2.6} ${yOmb + 14} L ${cx - 2.6} ${yOmb + 14} Z" fill="${tie.escuro}"/>
        <path d="M${cx - 2.6} ${yOmb + 14} L ${cx + 2.6} ${yOmb + 14} L ${cx + 4} ${yPei + 4} L ${cx} ${yBtn - 6} L ${cx - 4} ${yPei + 4} Z" fill="${tie.base}"/>
        <path d="M${cx - 1.2} ${yOmb + 10} l 0.8 2.4 l 1.6 -1.6 z" fill="${alfa('#ffffff', 0.25)}"/>
        <!-- lapelas roladas (tecido da jaqueta) -->
        ${lapela(-1)}${lapela(1)}
        <!-- colar por trás do pescoço (liga as duas lapelas) -->
        <path d="M${cx - 2} ${yOmb + 4} C ${cx - 8} ${yOmb - 4} ${cx - 13} ${yOmb - 2} ${cx - 13} ${yOmb + 2} C ${cx - 8} ${yOmb + 1} ${cx - 3} ${yOmb + 3} ${cx} ${yOmb + 5} C ${cx + 3} ${yOmb + 3} ${cx + 8} ${yOmb + 1} ${cx + 13} ${yOmb + 2} C ${cx + 13} ${yOmb - 2} ${cx + 8} ${yOmb - 4} ${cx + 2} ${yOmb + 4} Z" fill="${la.tinta.escuro}"/>
        <!-- fecho central (botão→barra) + botões -->
        <path d="M${cx} ${yBtn} L ${cx} ${yHem - 2}" stroke="${alfa(la.tinta.profundo, 0.55)}" stroke-width="1.2"/>
        <circle cx="${cx + 1}" cy="${yBtn}" r="1.7" fill="${la.tinta.brilho}"/><circle cx="${cx + 1}" cy="${yBtn + 16}" r="1.7" fill="${la.tinta.brilho}"/>`;
      })()}`;
    },
  },
  {
    id: 'rou_px_polo', materialToken: 'cotton', categoria: 'roupa', nome: 'Polo Premium',
    descricao: 'Piquê com colarinho firme e botões de verdade.', raridade: 'comum',
    tema: 'casual', usaCores: ['roupa', 'destaque'], acabamento: 'premium',
    render: (p, u) => {
      const alg = material2d('cotton', p.roupa.base);
      return `<defs>${alg.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${alg.fill(u)}"/>
      <path d="M102 186 l 12 8 l -3 10 l -12 -8 z M138 186 l -12 8 l 3 10 l 12 -8 z" fill="${alg.tinta.escuro}"/>
      <path d="M117 196 h 6 v 18 h -6 z" fill="${alg.tinta.meio}"/>
      <circle cx="120" cy="201" r="1.4" fill="${p.destaque.base}"/><circle cx="120" cy="208" r="1.4" fill="${p.destaque.base}"/>
      <path d="M98 214 q 22 6 44 0" stroke="${alfa(alg.tinta.brilho, 0.3)}" stroke-width="1.4" fill="none"/>
      <circle cx="142" cy="222" r="3" fill="${p.destaque.base}"/>
      ${SOMBRA_PESCOCO}`;
    },
  },
  {
    id: 'rou_px_colete', materialToken: 'technical', categoria: 'roupa', nome: 'Colete Premium',
    descricao: 'Acolchoado técnico sobre camada interna viva.', raridade: 'incomum',
    tema: 'urbano', usaCores: ['roupa', 'destaque', 'secundario'], acabamento: 'premium',
    render: (p, u) => {
      const tec = material2d('technical', p.roupa.base);
      const interna = sec(p);
      return `<defs>${tec.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${interna.base}"/>
      <path d="M104 190 q -14 6 -16 26 l 2 24 h 22 l 2 -50 q -6 -2 -10 0 z M136 190 q 14 6 16 26 l -2 24 h -22 l -2 -50 q 6 -2 10 0 z" fill="${tec.fill(u)}"/>
      <path d="M94 206 h 20 M94 218 h 20 M126 206 h 20 M126 218 h 20" stroke="${alfa(tec.tinta.profundo, 0.5)}" stroke-width="1.4"/>
      <path d="M104 190 q 8 22 8 50 M136 190 q -8 22 -8 50" stroke="${alfa(tec.tinta.brilho, 0.4)}" stroke-width="1.4" fill="none"/>
      <path d="M117 196 q 3 22 3 44" stroke="${interna.claro}" stroke-width="1.2" fill="none"/>
      <circle cx="99" cy="228" r="2" fill="${p.destaque.base}"/>
      ${SOMBRA_PESCOCO}`;
    },
  },
  {
    id: 'rou_px_sobretudo', materialToken: 'wool', categoria: 'roupa', nome: 'Sobretudo Premium',
    descricao: 'Lã longa com forro profundo e lapela alta.', raridade: 'raro',
    tema: 'clássico', usaCores: ['roupa', 'destaque', 'secundario'], acabamento: 'premium',
    render: (p, u) => {
      const la = material2d('wool', p.roupa.base);
      const forro = sec(p);
      return `<defs>${la.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${la.fill(u)}"/>
      <path d="M102 186 l 18 18 l 18 -18 v 54 h -36 z" fill="${forro.escuro}"/>
      <path d="M102 186 c 4 10 10 16 18 18 l -16 30 c -7 -14 -9 -30 -2 -48 z" fill="${la.tinta.profundo}"/>
      <path d="M138 186 c -4 10 -10 16 -18 18 l 16 30 c 7 -14 9 -30 2 -48 z" fill="${la.tinta.profundo}"/>
      <path d="M104 189 q 8 12 16 15 M136 189 q -8 12 -16 15" stroke="${alfa(la.tinta.brilho, 0.4)}" stroke-width="1.5" fill="none"/>
      <path d="M112 226 h 4 M124 226 h 4" stroke="${p.destaque.base}" stroke-width="2.4" stroke-linecap="round"/>
      ${SOMBRA_PESCOCO}`;
    },
    // §61 SOBRETUDO: LONGO de verdade (desce além do quadril ~y318), volume
    // próprio, lapela alta, abertura inferior/overlap, mangas longas.
    // §61 SOBRETUDO: LONGO (desce além do quadril ~y322), lapela alta, overlap
    // frontal, mangas longas. Ease médio; barra bem abaixo do quadril.
    renderCorpoV2: (p, u, perfil) => {
      const A = anatomiaCorpo(perfil as PerfilCorpo2D);
      const la = material2d('wool', p.roupa.base);
      const forro = sec(p);
      const { cx, yOmb, yPei, yCin } = A;
      const { torso, gola, yHem } = pathSobretudoGolden(A); // §11: longo (mid-coxa) + A-line moderada
      const sl = mangaLonga(A, -1, 6, 5) + mangaLonga(A, 1, 6, 5);
      return `<defs>${la.defs(u)}</defs>
      <path d="${sl}" fill="${la.fill(u)}"/>
      ${dobrasManga(A, -1)}${dobrasManga(A, 1)}
      <path d="${torso}" fill="${la.fill(u)}"/>
      ${la.realce(u, torso)}
      <!-- §11 gola alta do sobretudo (assinatura no pescoço) -->
      <path d="${gola}" fill="${la.tinta.escuro}"/>
      <path d="M${cx - 12} ${yOmb - 4} C ${cx - 6} ${yOmb - 6} ${cx - 2} ${yOmb + 2} ${cx - 1} ${yPei} M${cx + 12} ${yOmb - 4} C ${cx + 6} ${yOmb - 6} ${cx + 2} ${yOmb + 2} ${cx + 1} ${yPei}" stroke="${alfa(la.tinta.brilho, 0.3)}" stroke-width="1" fill="none"/>
      ${dobras(A, torso, u, { tens: 0.7, barra: yHem, w: A.peito + 6 }, la)}
      <!-- quedas verticais longas do sobretudo -->
      <g clip-path="url(#${u}fold)">
        <path d="M${cx - A.cintura + 4} ${yCin + 6} C ${cx - A.cintura} ${yCin + 60} ${cx - A.quadril + 6} ${yHem - 40} ${cx - A.quadril + 8} ${yHem - 6}" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M${cx + A.cintura - 4} ${yCin + 6} C ${cx + A.cintura} ${yCin + 60} ${cx + A.quadril - 6} ${yHem - 40} ${cx + A.quadril - 8} ${yHem - 6}" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M${cx - 16} ${yCin + 20} C ${cx - 14} ${yHem - 60} ${cx - 12} ${yHem - 30} ${cx - 12} ${yHem - 6}" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="2.6"/>
        <path d="M${cx + 16} ${yCin + 20} C ${cx + 14} ${yHem - 60} ${cx + 12} ${yHem - 30} ${cx + 12} ${yHem - 6}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2.4"/>
      </g>
      <!-- overlap frontal (sombra da aba) -->
      <path d="M${cx} ${yOmb + 6} L ${cx} ${yHem - 2} L ${cx + A.cintura + 2} ${yHem - 6} C ${cx + A.cintura + 6} ${yCin} ${cx + A.peito} ${yPei} ${cx + 6} ${yOmb + 8} Z" fill="${alfa(la.tinta.profundo, 0.4)}"/>
      <!-- lapela alta + forro em V -->
      <path d="M${cx - 15} ${yOmb} l 15 22 l 15 -22 l 8 56 l -23 16 l -23 -16 z" fill="${forro.escuro}"/>
      <path d="M${cx - 15} ${yOmb} l -13 18 l 21 26 l 10 -18 z M${cx + 15} ${yOmb} l 13 18 l -21 26 l -10 -18 z" fill="${la.tinta.profundo}"/>
      <path d="M${cx} ${yPei} v ${yHem - yPei - 6}" stroke="${alfa(la.tinta.profundo, 0.5)}" stroke-width="1.6"/>
      <circle cx="${cx + 12}" cy="${yCin + 4}" r="2.4" fill="${p.destaque.base}"/><circle cx="${cx + 12}" cy="${yCin + 38}" r="2.4" fill="${p.destaque.base}"/>`;
    },
  },
  {
    id: 'rou_px_gala', materialToken: 'satin', categoria: 'roupa', nome: 'Gala Premium',
    descricao: 'Cetim de noite com lapela de cerimônia.', raridade: 'epico',
    tema: 'clássico', usaCores: ['roupa', 'destaque', 'secundario'], acabamento: 'premium',
    render: (p, u) => {
      const cet = material2d('satin', p.roupa.base);
      const lapela = sec(p);
      return `<defs>${cet.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${cet.fill(u)}"/>
      <path d="M106 188 l 14 12 l 14 -12 v 50 h -28 z" fill="#f6f7fb"/>
      <path d="M120 202 l -5 8 l 5 22 l 5 -22 z" fill="${cet.tinta.profundo}"/>
      <path d="M113 205 l 7 -7 l 7 7 l -7 5 z" fill="${p.destaque.base}"/>
      <path d="M98 186 c 5 8 12 14 22 16 l -13 26 c -9 -12 -12 -27 -9 -42 z" fill="${lapela.escuro}"/>
      <path d="M142 186 c -5 8 -12 14 -22 16 l 13 26 c 9 -12 12 -27 9 -42 z" fill="${lapela.escuro}"/>
      <path d="M100 189 q 9 11 20 13 M140 189 q -9 11 -20 13" stroke="${alfa(lapela.brilho, 0.55)}" stroke-width="1.4" fill="none"/>
      ${SOMBRA_PESCOCO}`;
    },
  },
];

// ── 2 SOBREPEÇAS PREMIUM (roupa_sobre) ──────────────────────────────────

export const SOBREPECAS_PREMIUM: ParteDef[] = [
  {
    id: 'sob_px_cardiga', materialToken: 'wool', categoria: 'roupa_sobre', nome: 'Cardigã Premium',
    descricao: 'Tricô aberto por cima de qualquer look.', raridade: 'incomum',
    tema: 'casual', usaCores: ['roupa', 'secundario'], acabamento: 'premium',
    render: (p, u) => {
      const tri = material2d('wool', p.roupa.base);
      return `<defs>${tri.defs(u)}</defs>
      <path d="M96 186 c 2 18 2 36 0 52 l 14 2 c 4 -18 5 -36 4 -52 c -7 -2 -13 -2 -18 -2 z" fill="${tri.fill(u)}"/>
      <path d="M144 186 c -2 18 -2 36 0 52 l -14 2 c -4 -18 -5 -36 -4 -52 c 7 -2 13 -2 18 -2 z" fill="${tri.fill(u)}"/>
      <path d="M100 192 q 2 24 0 42 M140 192 q -2 24 0 42" stroke="${alfa(tri.tinta.profundo, 0.45)}" stroke-width="1.4" fill="none"/>
      <path d="M107 194 q 2 22 1 42 M133 194 q -2 22 -1 42" stroke="${alfa(tri.tinta.brilho, 0.35)}" stroke-width="1.2" fill="none"/>`;
    },
  },
  {
    id: 'sob_px_capa', materialToken: 'satin', categoria: 'roupa_sobre', nome: 'Capa Premium',
    descricao: 'Cai dos ombros com massa de verdade atrás.', raridade: 'raro',
    tema: 'fantasia', usaCores: ['roupa', 'secundario'], acabamento: 'premium',
    render: (p) => {
      const forro = sec(p);
      return `
      <path d="M92 186 l -6 10 q 10 6 20 6 l 2 -12 q -8 -3 -16 -4 z M148 186 l 6 10 q -10 6 -20 6 l -2 -12 q 8 -3 16 -4 z" fill="${forro.base}"/>
      <path d="M104 196 h 32 l -2 6 h -28 z" fill="${forro.escuro}"/>
      <circle cx="112" cy="199" r="1.8" fill="${forro.brilho}"/><circle cx="128" cy="199" r="1.8" fill="${forro.brilho}"/>`;
    },
    renderAtras: (p, u) => {
      const capa = material2d('satin', p.roupa.base);
      return `<defs>${capa.defs(u)}</defs>
      <path d="M78 190 q -14 60 6 108 q 36 12 72 0 q 20 -48 6 -108 q -42 -14 -84 0 z" fill="${capa.fill(u)}"/>
      <path d="M92 200 q -6 50 4 90 M148 200 q 6 50 -4 90" stroke="${alfa(capa.tinta.profundo, 0.4)}" stroke-width="2" fill="none"/>`;
    },
  },
];

// ── 3 ROUPAS INFERIORES (rin_*) — só corpo inteiro ──────────────────────

/** Região das pernas do scaffold: quadril y206–222, pernas até y330. */
function pernas(fillRef: string, extra: string): string {
  return `
    <path d="M90 206 h60 v16 h-60 z" fill="${fillRef}"/>
    <path d="M91 216 h26 l-3 114 c0 8 -20 8 -20 0 z" fill="${fillRef}"/>
    <path d="M123 216 h26 l-3 114 c0 8 -20 8 -20 0 z" fill="${fillRef}"/>${extra}`;
}

const comumRin = {
  categoria: 'roupa_inferior' as const, raridade: 'comum' as const,
  acabamento: 'premium' as const, usaCores: ['roupa' as const, 'destaque' as const],
  render: () => '', // busto intocado (byte-stability trivial — como slots corporais #154)
};

export const ROUPAS_INFERIORES: ParteDef[] = [
  {
    ...comumRin, id: 'rin_jeans', materialToken: 'denim', nome: 'Jeans Premium', tema: 'casual',
    descricao: 'Denim com costura viva e barra dobrada.',
    renderCorpo: (p, u) => {
      const dn = material2d('denim', p.roupa.base);
      return `<defs>${dn.defs(u)}</defs>${pernas(dn.fill(u), `
      <path d="M96 212 h 12 q 1 8 -2 12 M144 212 h -12 q -1 8 2 12" stroke="${alfa(dn.tinta.brilho, 0.5)}" stroke-width="1.4" fill="none"/>
      <path d="M104 222 q 2 52 0 100 M136 222 q -2 52 0 100" stroke="${p.destaque.base}" stroke-width="1.2" stroke-dasharray="3 3" fill="none"/>
      <path d="M93 318 h 22 M125 318 h 22" stroke="${alfa(dn.tinta.claro, 0.6)}" stroke-width="4"/>`)}`;
    },
  },
  {
    ...comumRin, id: 'rin_social', materialToken: 'wool', nome: 'Calça Social Premium', tema: 'executivo',
    descricao: 'Vinco frontal e caimento de alfaiataria.',
    renderCorpo: (p, u) => {
      const la = material2d('wool', p.roupa.base);
      return `<defs>${la.defs(u)}</defs>${pernas(la.fill(u), `
      <path d="M104 222 l -2 106 M136 222 l 2 106" stroke="${alfa(la.tinta.brilho, 0.45)}" stroke-width="1.6" fill="none"/>
      <path d="M92 210 h 56" stroke="${alfa(la.tinta.profundo, 0.6)}" stroke-width="2"/>
      <rect x="116" y="208" width="8" height="5" rx="1.4" fill="${p.destaque.base}"/>`)}`;
    },
  },
  {
    ...comumRin, id: 'rin_jogger', materialToken: 'technical', nome: 'Jogger Premium', tema: 'urbano',
    descricao: 'Técnica com punho na barra e faixa lateral.',
    renderCorpo: (p, u) => {
      const tec = material2d('technical', p.roupa.base);
      return `<defs>${tec.defs(u)}</defs>${pernas(tec.fill(u), `
      <path d="M94 218 q 4 56 8 106 M146 218 q -4 56 -8 106" stroke="${p.destaque.base}" stroke-width="2.6" fill="none"/>
      <path d="M96 320 h 18 q 2 6 -1 10 h -16 z M144 320 h -18 q -2 6 1 10 h 16 z" fill="${tec.tinta.profundo}"/>
      <path d="M110 214 q -2 4 -6 5" stroke="${alfa(tec.tinta.brilho, 0.6)}" stroke-width="1.6" fill="none"/>`)}`;
    },
  },
];

// ── 3 CALÇADOS PREMIUM (slot pes) — só corpo inteiro ────────────────────

const comumPes = {
  categoria: 'acessorio' as const, slot: 'pes' as const,
  raridade: 'incomum' as const, acabamento: 'premium' as const,
  usaCores: ['roupa' as const, 'destaque' as const],
  render: () => '', // busto intocado (contrato dos slots corporais #154)
};

export const CALCADOS_PREMIUM: ParteDef[] = [
  {
    ...comumPes, id: 'ace_px_tenis', materialToken: 'technical', nome: 'Tênis Premium', tema: 'urbano',
    descricao: 'Entressola dupla e cadarço com presença.',
    renderCorpo: (p, u) => {
      const tec = material2d('technical', p.roupa.base);
      return `<defs>${tec.defs(u)}</defs>
      <path d="M88 330 h 30 v 26 c 0 6 -4 10 -10 10 h -22 c -8 0 -10 -9 -2 -13 l 4 -3 z" fill="${tec.fill(u)}"/>
      <path d="M122 330 h 30 l 0 20 l 4 3 c 8 4 6 13 -2 13 h -22 c -6 0 -10 -4 -10 -10 z" fill="${tec.fill(u)}"/>
      <path d="M84 362 h 36 q 2 5 -1 8 h -34 q -4 -4 -1 -8 z M120 362 h 36 q 3 4 -1 8 h -34 q -3 -3 -1 -8 z" fill="#e8eaf2"/>
      <path d="M96 336 l 16 4 M100 342 l 12 3 M128 336 l 16 4 M132 342 l 12 3" stroke="${p.destaque.base}" stroke-width="2" stroke-linecap="round"/>
      <path d="M90 356 h 26 M124 356 h 26" stroke="${alfa(tec.tinta.brilho, 0.5)}" stroke-width="1.6"/>`;
    },
  },
  {
    ...comumPes, id: 'ace_px_social', materialToken: 'leather', nome: 'Sapato Social Premium', tema: 'executivo',
    descricao: 'Couro polido com brilho de cera.',
    renderCorpo: (p, u) => {
      const couro = material2d('leather', p.roupa.base);
      return `<defs>${couro.defs(u)}</defs>
      <path d="M88 332 h 30 v 24 c 0 6 -4 10 -10 10 h -22 c -8 0 -10 -9 -2 -13 l 4 -3 z" fill="${couro.fill(u)}"/>
      <path d="M122 332 h 30 l 0 18 l 4 3 c 8 4 6 13 -2 13 h -22 c -6 0 -10 -4 -10 -10 z" fill="${couro.fill(u)}"/>
      <path d="M92 338 q 10 -3 22 0 M126 338 q 10 -3 22 0" stroke="${alfa('#ffffff', 0.35)}" stroke-width="2" fill="none"/>
      <path d="M86 364 h 32 M120 364 h 32" stroke="#12141c" stroke-width="4"/>
      <path d="M104 346 h 10 M138 346 h 10" stroke="${p.destaque.base}" stroke-width="1.6"/>`;
    },
  },
  {
    ...comumPes, id: 'ace_px_bota', materialToken: 'leather', nome: 'Bota Premium', tema: 'fantasia',
    descricao: 'Cano alto com fivela e sola de trilha.',
    renderCorpo: (p, u) => {
      const couro = material2d('leather', p.roupa.base);
      return `<defs>${couro.defs(u)}</defs>
      <path d="M90 312 h 26 v 44 c 0 6 -4 10 -10 10 h -18 c -8 0 -10 -9 -2 -13 l 4 -3 z" fill="${couro.fill(u)}"/>
      <path d="M124 312 h 26 l 0 38 l 4 3 c 8 4 6 13 -2 13 h -18 c -6 0 -10 -4 -10 -10 z" fill="${couro.fill(u)}"/>
      <path d="M92 322 h 22 M126 322 h 22" stroke="${p.destaque.base}" stroke-width="2.4"/>
      <rect x="100" y="318" width="6" height="8" rx="1" fill="${p.destaque.claro}"/><rect x="134" y="318" width="6" height="8" rx="1" fill="${p.destaque.claro}"/>
      <path d="M84 364 h 36 q 2 6 -2 8 h -32 q -4 -3 -2 -8 z M120 364 h 36 q 2 6 -2 8 h -32 q -4 -3 -2 -8 z" fill="#12141c"/>
      <path d="M86 368 h 32 M122 368 h 32" stroke="${alfa(couro.tinta.brilho, 0.3)}" stroke-width="1.2" stroke-dasharray="4 3"/>`;
    },
  },
];
