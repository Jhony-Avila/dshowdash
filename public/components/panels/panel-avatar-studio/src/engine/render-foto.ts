// engine/render-foto.ts — composição da FOTO ESTILIZADA (4.6 §21).
// @version 1.0.0  @created 2026-07-30
//
// A foto NUNCA recebe roupas ou características corporais — só assets de
// APRESENTAÇÃO: fundo, banner, aura, efeito, moldura, emblema (vira badge)
// e o selo do título. Layout medalhão: a foto fica num círculo central
// sobre o cenário, com anel na cor de destaque.
//
// Determinístico como o motor principal: mesmo estilo + mesma foto → mesmo
// SVG. Este SVG existe SÓ no cliente (preview + rasterização p/ PNG 480);
// o que vai ao servidor é o PNG re-encodado + o JSON de parâmetros — o
// sanitizador de SVG do backend continua NÃO aceitando <image>.
import { svgParticulas } from './particulas'; // lote 541-550 (§348.1)
import type { AvatarConfig } from '../domain/types';
import { paletaDe } from './cores';
import type { ParteDef } from './base-api';
import { congelarSvg, hashTexto } from './render';

export interface EstiloFotoRender {
  camadas: {
    fundo?: string;
    banner?: string;
    aura?: string;
    efeito?: string;
    moldura?: string;
    emblema?: string;
  };
  cores: AvatarConfig['cores'];
  /** selo do título JÁ resolvido pelo serviço (nome + cor da raridade) */
  selo?: { nome: string; cor: string };
  /** megas 51–54 + lote 111: ajustes não destrutivos (ausente = legado) */
  ajustes?: {
    brilho?: number; contraste?: number; saturacao?: number; temperatura?: number;
    vinheta?: number; rotacao?: number; espelhar?: boolean; sombra?: boolean;
    forma?: 'circulo' | 'hexagono' | 'losango' | 'squircle' | 'estrela' | 'escudo';
    desfoqueFundo?: number; granulacao?: number;
    filtroCor?: 'nenhum' | 'pb' | 'sepia';
    zoomFoto?: number; anel?: number;
    nitidez?: number; marca?: string; // lote 311-320 (§333/§372)
    particulas?: 'pontos' | 'estrelas' | 'pixels'; // lote 541-550 (§348.1)
    borda?: number; // megas 565-567 (§340-341): pluma da borda 0..1 (0 = ausente)
  };
  /** mega 115 (§344): legenda livre já SANITIZADA pelo serviço */
  legenda?: string;
  /** lote 161–164 (§338/§342): config POR CAMADA (já validada no serviço) */
  camadasFoto?: Partial<Record<CamadaFotoRenderId, {
    oculta?: boolean; opacidade?: number;
    blend?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
    plano?: 'atras' | 'frente';
    travada?: boolean; // §1217 (painel; o render ignora)
  }>>;
  /** AS6 §1215 (lote 981–990): ordem da pilha de fundo do medalhão —
   *  ausente = fundo→banner→aura legado byte a byte */
  ordemFundo?: Array<'fundo' | 'banner' | 'aura'>;
  /** lote 165 (§334): luz local no medalhão (-1 escurece … 1 clareia) */
  luzLocal?: { tipo: 'radial' | 'linear'; intensidade: number };
  /** lote 166 (§343): tipografia aprovada (ausente = strings legadas) */
  tipografia?: {
    fonte?: 'sistema' | 'mono' | 'serif'; peso?: 400 | 600 | 800;
    tamanho?: 'p' | 'm' | 'g'; cor?: string; contorno?: boolean; caixaAlta?: boolean;
  };
  /** lote 167 (§343.1): subtítulo — só entra nos formatos WIDE */
  subtitulo?: string;
  /** mega 223 (§323.2/§324.2): posições manuais já VALIDADAS pelo serviço.
   *  Ausente = layout legado byte a byte. */
  pos?: Partial<Record<'legenda' | 'subtitulo' | 'selo' | 'emblema', { x: number; y: number }>>;
  /** mega 224 (§344): título-componente (escala/compacto) já validado. */
  seloCfg?: { escala?: 'p' | 'm' | 'g'; compacto?: boolean };
}
export type CamadaFotoRenderId = 'fundo' | 'banner' | 'aura' | 'efeito' | 'moldura' | 'emblema';

// ── mega 224 (§344): fator de escala do selo — limites do briefing ───
function escalaSelo(cfg?: EstiloFotoRender['seloCfg']): number {
  return cfg?.escala === 'p' ? 0.82 : cfg?.escala === 'g' ? 1.18 : 1;
}

/** mega 224 (§344): nome exibido no selo (compacto = abreviado). */
function nomeSelo(nome: string, cfg?: EstiloFotoRender['seloCfg']): string {
  return cfg?.compacto && nome.length > 14 ? `${nome.slice(0, 12).trimEnd()}…` : nome;
}

// ── lote 161–164 (§338/§339/§342): painel de camadas ────────────────
type CfgCamadas = EstiloFotoRender['camadasFoto'];

/** Envolve o SVG de uma camada com oculta/opacidade/blend (ausente = intacto). */
function envolverCamada(id: CamadaFotoRenderId, svg: string, cfg: CfgCamadas): string {
  const c = cfg?.[id];
  if (!c || !svg) return c?.oculta ? '' : svg;
  if (c.oculta) return '';
  const op = c.opacidade !== undefined && c.opacidade !== 1 ? ` opacity="${c.opacidade}"` : '';
  const blend = c.blend && c.blend !== 'normal' ? ` style="mix-blend-mode:${c.blend}"` : '';
  return op || blend ? `<g${op}${blend}>${svg}</g>` : svg;
}

/** lote 165 (§334): luz local sobre o MEDALHÃO (clipada pela silhueta). */
function luzLocalSvg(uid: string, luz: EstiloFotoRender['luzLocal']): string {
  if (!luz || luz.intensidade === 0) return '';
  const clara = luz.intensidade > 0;
  const cor = clara ? '#ffffff' : '#000000';
  const alfa = Math.min(1, Math.abs(luz.intensidade)).toFixed(3);
  const grad = luz.tipo === 'radial'
    ? `<radialGradient id="${uid}luz" cx="50%" cy="42%" r="62%">` +
      `<stop offset="0%" stop-color="${cor}" stop-opacity="${alfa}"/>` +
      `<stop offset="100%" stop-color="${cor}" stop-opacity="0"/></radialGradient>`
    : `<linearGradient id="${uid}luz" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0%" stop-color="${cor}" stop-opacity="${alfa}"/>` +
      `<stop offset="70%" stop-color="${cor}" stop-opacity="0"/></linearGradient>`;
  return grad + `<rect x="28" y="26" width="184" height="184" fill="url(#${uid}luz)" ` +
    `clip-path="url(#${uid}fclip)" style="mix-blend-mode:soft-light"/>`;
}

/** lote 166 (§343): atributos de texto — padrões IGUAIS às strings legadas. */
function atributosTexto(
  t: EstiloFotoRender['tipografia'], base: number, corPadrao: string,
): { attrs: string; caixaAlta: boolean } {
  const familias = {
    sistema: 'system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    serif: "Georgia, 'Times New Roman', serif",
  } as const;
  const familia = familias[t?.fonte ?? 'sistema'];
  const peso = t?.peso ?? 600;
  const escala = t?.tamanho === 'p' ? 0.85 : t?.tamanho === 'g' ? 1.25 : 1;
  const tam = Math.round(base * escala * 10) / 10;
  const cor = t?.cor ?? corPadrao;
  const contorno = t?.contorno ? ` stroke="#0a0d15" stroke-width="2.2" paint-order="stroke" stroke-linejoin="round"` : '';
  return {
    attrs: `font-family="${familia}" font-size="${tam}" font-weight="${peso}" fill="${cor}"${contorno}`,
    caixaAlta: !!t?.caixaAlta,
  };
}

// ── megas 51–54: AJUSTES não destrutivos ────────────────────────────
// Primitivas SVG puras (feComponentTransfer/feColorMatrix) — determinís-
// ticas e rasterizáveis; nada de CSS filter (o canvas raster não vê).
type AjustesRender = NonNullable<EstiloFotoRender['ajustes']>;

const NEUTRO: Required<AjustesRender> = {
  brilho: 1, contraste: 1, saturacao: 1, temperatura: 0,
  vinheta: 0, rotacao: 0, espelhar: false, sombra: false,
  forma: 'circulo', desfoqueFundo: 0, granulacao: 0,
  filtroCor: 'nenhum', zoomFoto: 1, anel: 3,
  nitidez: 0, marca: '', // lote 311-320: neutros dos campos novos
  particulas: 'nenhum' as never, // lote 541-550: neutro = ausente
  borda: 0, // megas 565-567 (§340-341): sem pluma = clip duro legado
};

function ajustesEfetivos(a?: AjustesRender): Required<AjustesRender> | null {
  if (!a) return null;
  const v = { ...NEUTRO, ...a };
  const neutro = v.brilho === 1 && v.contraste === 1 && v.saturacao === 1
    && v.temperatura === 0 && v.vinheta === 0 && v.rotacao === 0
    && !v.espelhar && !v.sombra
    && v.forma === 'circulo' && v.desfoqueFundo === 0 && v.granulacao === 0
    && v.filtroCor === 'nenhum' && v.zoomFoto === 1 && v.anel === 3
    && v.nitidez === 0 && v.marca === '' && (v.particulas as unknown as string) === 'nenhum'
    && v.borda === 0;
  return neutro ? null : v;
}

/** mega 111 (§341): a FORMA do medalhão como path centrado em (120,118).
 *  'circulo' devolve null → strings LEGADAS byte a byte. */
function pathForma(forma: Required<AjustesRender>['forma'], r: number): string | null {
  const cx = 120; const cy = 118;
  if (forma === 'hexagono') {
    const p = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${p}"`;
  }
  if (forma === 'losango') {
    return `<polygon points="${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}"`;
  }
  if (forma === 'estrela') {
    // mega 312 (§341): estrela de 5 pontas (raio interno 45% do externo)
    const p = Array.from({ length: 10 }, (_, i) => {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${p}"`;
  }
  if (forma === 'escudo') {
    // mega 313 (§341): escudo heráldico simples (topo reto, base em ponta)
    const w = r * 0.92;
    return `<path d="M${(cx - w).toFixed(1)} ${(cy - r * 0.82).toFixed(1)} H${(cx + w).toFixed(1)} V${(cy + r * 0.18).toFixed(1)} Q${(cx + w).toFixed(1)} ${(cy + r * 0.62).toFixed(1)} ${cx} ${(cy + r).toFixed(1)} Q${(cx - w).toFixed(1)} ${(cy + r * 0.62).toFixed(1)} ${(cx - w).toFixed(1)} ${(cy + r * 0.18).toFixed(1)} Z"`;
  }
  if (forma === 'squircle') {
    const l = r * 1.62;
    return `<rect x="${(cx - l / 2).toFixed(1)}" y="${(cy - l / 2).toFixed(1)}" width="${l.toFixed(1)}" height="${l.toFixed(1)}" rx="${(r * 0.55).toFixed(1)}"`;
  }
  return null;
}

/** <filter> de cor (brilho/contraste/saturação/temperatura/§333 filtro). */
function filtroAjustes(uid: string, a: Required<AjustesRender>): string {
  const precisaCor = a.brilho !== 1 || a.contraste !== 1 || a.saturacao !== 1
    || a.temperatura !== 0 || a.filtroCor !== 'nenhum' || a.nitidez > 0;
  if (!precisaCor) return '';
  // mega 311 (§333): NITIDEZ — unsharp por convolução 3×3 (k cresce c/ o slider)
  const k = a.nitidez > 0 ? a.nitidez * 0.7 : 0;
  const nit = k > 0
    ? `<feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 ${-k} 0 ${-k} ${1 + 4 * k} ${-k} 0 ${-k} 0"/>`
    : '';
  const b = a.brilho;
  const c = a.contraste;
  const interc = 0.5 - 0.5 * c; // contraste linear em volta do meio-tom
  // temperatura: desloca R e B em direções opostas (quente = +R −B)
  const tR = 1 + a.temperatura * 0.18;
  const tB = 1 - a.temperatura * 0.18;
  // mega 114 (§333): PB = dessatura; SÉPIA = matriz clássica
  const filtroBase = a.filtroCor === 'pb'
    ? `<feColorMatrix type="saturate" values="0"/>`
    : a.filtroCor === 'sepia'
      ? `<feColorMatrix type="matrix" values="0.393 0.769 0.189 0 0  0.349 0.686 0.168 0 0  0.272 0.534 0.131 0 0  0 0 0 1 0"/>`
      : '';
  return `<filter id="${uid}aj" color-interpolation-filters="sRGB">` +
    filtroBase +
    `<feColorMatrix type="saturate" values="${a.saturacao}"/>` +
    `<feColorMatrix type="matrix" values="${tR} 0 0 0 0  0 1 0 0 0  0 0 ${tB} 0 0  0 0 0 1 0"/>` +
    `<feComponentTransfer>` +
      `<feFuncR type="linear" slope="${b * c}" intercept="${interc}"/>` +
      `<feFuncG type="linear" slope="${b * c}" intercept="${interc}"/>` +
      `<feFuncB type="linear" slope="${b * c}" intercept="${interc}"/>` +
    `</feComponentTransfer>` + nit + `</filter>`;
}

/** mega 112 (§334): defs do desfoque de fundo (0 = ausente). */
function filtroDesfoque(uid: string, v: number): string {
  return v > 0 ? `<filter id="${uid}bf"><feGaussianBlur stdDeviation="${(v * 6).toFixed(2)}"/></filter>` : '';
}

/** mega 113 (§334): GRANULAÇÃO de filme via turbulência determinística. */
function granulacaoSvg(uid: string, v: number, W = 240, H = 240): string {
  if (v <= 0) return '';
  return `<filter id="${uid}gr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch"/>` +
    `<feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 ${(v * 0.5).toFixed(3)} 0"/></filter>` +
    `<rect width="${W}" height="${H}" filter="url(#${uid}gr)" style="mix-blend-mode:overlay"/>`;
}

/** Vinheta radial dentro do clip (0–1). */
function vinhetaSvg(uid: string, intensidade: number, W = 240, H = 240): string {
  if (intensidade <= 0) return '';
  return `<radialGradient id="${uid}vin" cx="50%" cy="50%" r="72%">` +
    `<stop offset="58%" stop-color="#000" stop-opacity="0"/>` +
    `<stop offset="100%" stop-color="#000" stop-opacity="${(0.72 * intensidade).toFixed(3)}"/>` +
    `</radialGradient><rect width="${W}" height="${H}" fill="url(#${uid}vin)"/>`;
}

/** §337: sombra de contato — elipse suave sob o medalhão. */
function sombraContato(uid: string): string {
  return `<filter id="${uid}sb"><feGaussianBlur stdDeviation="4"/></filter>` +
    `<ellipse cx="120" cy="218" rx="72" ry="9" fill="#000" opacity="0.38" filter="url(#${uid}sb)"/>`;
}

// ── §325: FORMATOS de saída (fonte única de verdade) ────────────────
// perfil = composição clássica 1:1 (intocada — determinismo preservado
// para fotos já salvas). Os demais são WIDE: medalhão à esquerda, título
// + emblema à direita, fundo/banner esticados na largura. A `caixa` mantém
// ALTURA 240 (escala dos assets idêntica à do quadrado); `saida` é o PNG.
export type FormatoFotoId = 'perfil' | 'header' | 'banner' | 'wallpaper';
export const FORMATOS_FOTO: Record<FormatoFotoId, {
  nome: string; proporcao: string; saida: [number, number]; caixa: [number, number];
}> = {
  perfil: { nome: 'Perfil', proporcao: '1:1', saida: [480, 480], caixa: [240, 240] },
  header: { nome: 'Header', proporcao: '3:1', saida: [1500, 500], caixa: [720, 240] },
  banner: { nome: 'Banner', proporcao: '4:1', saida: [1920, 480], caixa: [960, 240] },
  wallpaper: { nome: 'Wallpaper', proporcao: '16:9', saida: [1920, 1080], caixa: [426.7, 240] },
};

export interface OpcoesRenderFoto {
  uid?: string;
  forma?: 'quadrado' | 'circulo';
  estatico?: boolean;
  tamanho?: number;
  /** §325: formato de saída — omitido/'perfil' = quadrado clássico */
  formato?: FormatoFotoId;
  /** lote 1051-1060 (#107): reflow das posições manuais nos formatos wide */
  reflowPos?: boolean;
  /** mega 96 (§350): lado do medalhão nos formatos WIDE (padrão esquerda) */
  lado?: 'esquerda' | 'direita';
  /** mega 103 (§372): wide SEM o retângulo de base — PNG com alpha */
  semFundo?: boolean;
}

function escaparAtributo(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** mega 223: 1 casa decimal — determinístico e curto no SVG. */
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/** mega 224 (§344): selo como COMPONENTE — escala dentro de limites,
 *  versão compacta e posição. Só roda quando seloCfg/pos.selo existem
 *  (o caminho legado permanece byte a byte). */
function seloComponente(
  selo: { nome: string; cor: string },
  cfg: EstiloFotoRender['seloCfg'],
  pos: { x: number; y: number },
  modoWide: boolean,
  maxLarg?: number,
): string {
  const esc = escalaSelo(cfg);
  const nome = nomeSelo(selo.nome, cfg);
  const base = modoWide
    ? { h: 30, rx: 15, fs: 16, dy: 20, sw: 1.6, larg: Math.max(120, Math.round(nome.length * 10) + 34) }
    : { h: 22, rx: 11, fs: 12, dy: 15, sw: 1.4, larg: Math.max(92, Math.round(nome.length * 7.4) + 26) };
  const larg = round1(Math.min(maxLarg ?? (modoWide ? 480 : 200), base.larg * esc));
  const cx = round1(pos.x);
  const cy = round1(pos.y);
  return `<g><rect x="${round1(cx - larg / 2)}" y="${cy}" width="${larg}" height="${round1(base.h * esc)}" rx="${round1(base.rx * esc)}" fill="#0a0d15" opacity="0.88" ` +
      `stroke="${selo.cor}" stroke-width="${base.sw}"/>` +
    `<text x="${cx}" y="${round1(cy + base.dy * esc)}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" ` +
      `font-size="${round1(base.fs * esc)}" font-weight="700" fill="${selo.cor}">${escaparTexto(nome)}</text></g>`;
}

function escaparTexto(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Compõe o SVG da foto estilizada. `resolver` desacopla do catálogo
 * (mesma inversão de dependência do renderAvatar).
 */
export function renderFotoEstilizada(
  fotoHref: string,
  estilo: EstiloFotoRender,
  resolver: (id: string) => ParteDef | undefined,
  opcoes: OpcoesRenderFoto = {},
): string {
  const uid = opcoes.uid ?? hashTexto(JSON.stringify(estilo.camadas) + (estilo.selo?.nome ?? '')
    + (estilo.ajustes ? JSON.stringify(estilo.ajustes) : '')
    // lote 161+ (§338/§334/§343): campos novos só entram no hash quando presentes
    + (estilo.camadasFoto ? JSON.stringify(estilo.camadasFoto) : '')
    + (estilo.ordemFundo ? estilo.ordemFundo.join(',') : '') // §1215
    + (estilo.luzLocal ? JSON.stringify(estilo.luzLocal) : '')
    + (estilo.tipografia ? JSON.stringify(estilo.tipografia) : '')
    + (estilo.subtitulo ?? '')
    // lote 221–224 (§323.2/§344): idem — ausentes não mudam o hash
    + (estilo.pos ? JSON.stringify(estilo.pos) : '')
    + (estilo.seloCfg ? JSON.stringify(estilo.seloCfg) : ''));
  const p = paletaDe(estilo.cores);
  const forma = opcoes.forma ?? 'quadrado';
  const aj = ajustesEfetivos(estilo.ajustes); // megas 51–54 (null = legado)

  const pintar = (id: string | undefined): string => {
    if (!id || id === 'nenhum') return '';
    const parte = resolver(id);
    return parte ? parte.render(p, uid) : '';
  };

  // §325: formatos WIDE têm composição própria; o quadrado segue intacto
  if (opcoes.formato && opcoes.formato !== 'perfil') {
    return comporWide(fotoHref, estilo, pintar, resolver, p, uid, opcoes);
  }

  // lote 161–164 (§338): cada camada decorativa passa pelo envelope
  const cfgC = estilo.camadasFoto;
  // §1215 (lote 981–990): pilha de fundo na ORDEM escolhida — só uma
  // permutação completa e única é aceita; qualquer outra coisa = legado
  const ordemF: Array<'fundo' | 'banner' | 'aura'> =
    estilo.ordemFundo && estilo.ordemFundo.length === 3
      && new Set(estilo.ordemFundo).size === 3
      && estilo.ordemFundo.every((c) => c === 'fundo' || c === 'banner' || c === 'aura')
      ? estilo.ordemFundo
      : ['fundo', 'banner', 'aura'];
  const fundo = ordemF.map((c) => envolverCamada(c, pintar(estilo.camadas[c]), cfgC)).join('');
  const efeitoDef = estilo.camadas.efeito && estilo.camadas.efeito !== 'nenhum'
    ? resolver(estilo.camadas.efeito)
    : undefined;
  const efeitoSvg = envolverCamada('efeito', efeitoDef ? efeitoDef.render(p, uid) : '', cfgC);
  // lote 162 (§339): o PLANO do efeito pode ser trocado (ordem protegida:
  // só o efeito tem essa liberdade; fundo/moldura mantêm posição fixa)
  const efeitoAtrasFlag = cfgC?.efeito?.plano ? cfgC.efeito.plano === 'atras' : !!efeitoDef?.atras;
  const efeitoAtras = efeitoDef && efeitoAtrasFlag ? efeitoSvg : '';
  const efeitoFrente = efeitoDef && !efeitoAtrasFlag ? efeitoSvg : '';
  const moldura = envolverCamada('moldura', pintar(estilo.camadas.moldura), cfgC);

  // medalhão central: aro externo → anel de destaque → foto clipada
  const medalhao = medalhaoSvg(fotoHref, p, uid, aj);

  // emblema vira BADGE no canto inferior direito do medalhão
  // (o pino desenha centrado em (152,206) → alvo (178,178));
  // mega 223/§345.1: pos.emblema move o alvo (ausente = translate legado)
  const posEmb = estilo.pos?.emblema;
  const trEmb = posEmb
    ? `translate(${round1(posEmb.x - 152)} ${round1(posEmb.y - 206)})`
    : 'translate(26 -28)';
  const badge = estilo.camadas.emblema && estilo.camadas.emblema !== 'nenhum'
    ? envolverCamada('emblema', `<g transform="${trEmb}">${pintar(estilo.camadas.emblema)}</g>`, cfgC)
    : '';

  // selo do título: faixa inferior legível no PNG derivado (480px);
  // mega 224 (§344) + 223: escala/compacto/posição — ausentes = byte a byte
  let selo = '';
  if (estilo.selo) {
    const posS = estilo.pos?.selo;
    if (!estilo.seloCfg && !posS) {
      const nome = estilo.selo.nome;
      const larg = Math.min(200, Math.max(92, Math.round(nome.length * 7.4) + 26));
      const x = 120 - larg / 2;
      selo =
        `<g><rect x="${x}" y="206" width="${larg}" height="22" rx="11" fill="#0a0d15" opacity="0.88" ` +
          `stroke="${estilo.selo.cor}" stroke-width="1.4"/>` +
        `<text x="120" y="221" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" ` +
          `font-size="12" font-weight="700" fill="${estilo.selo.cor}">${escaparTexto(nome)}</text></g>`;
    } else {
      selo = seloComponente(estilo.selo, estilo.seloCfg, posS ?? { x: 120, y: 206 }, false);
    }
  }

  const clip = forma === 'circulo'
    ? `<circle cx="120" cy="120" r="118"/>`
    : `<rect width="240" height="240" rx="26"/>`;
  const dim = opcoes.tamanho ? ` width="${opcoes.tamanho}" height="${opcoes.tamanho}"` : '';

  // megas 51–54 + lote 111: com ajustes ativos entram filtro/vinheta/
  // desfoque/grão/forma; SEM ajustes o SVG é byte a byte o de sempre
  const defsAj = (aj ? filtroAjustes(uid, aj) : '') + (aj ? filtroDesfoque(uid, aj.desfoqueFundo) : '');
  const vinheta = aj ? vinhetaSvg(uid, aj.vinheta) : '';
  const grao = aj ? granulacaoSvg(uid, aj.granulacao) : '';
  const formaClip = aj ? pathForma(aj.forma, 92) : null;
  const fclip = formaClip ? `${formaClip}/>` : `<circle cx="120" cy="118" r="92"/>`;
  const fundoComp = aj && aj.desfoqueFundo > 0 ? `<g filter="url(#${uid}bf)">${fundo}</g>` : fundo;
  // mega 115 (§344) + lote 166 (§343): legenda curta acima do selo;
  // mega 223: pos.legenda move a âncora (ausente = 120/200 legado)
  const tx = atributosTexto(estilo.tipografia, 11, '#e6eaf2');
  const posLeg = estilo.pos?.legenda;
  const legenda = estilo.legenda
    ? `<text x="${posLeg ? round1(posLeg.x) : 120}" y="${posLeg ? round1(posLeg.y) : 200}" text-anchor="middle" ${tx.attrs} opacity="0.92">` +
      `${escaparTexto(tx.caixaAlta ? estilo.legenda.toUpperCase() : estilo.legenda)}</text>`
    : '';
  const luz = luzLocalSvg(uid, estilo.luzLocal); // lote 165 (§334)
  // megas 541-543 (§348.1): PARTÍCULAS estáticas por cima do medalhão —
  // biblioteca §156 em modo ESTÁTICO (zero animação; export fiel)
  const particulasFoto = aj && (aj.particulas as unknown as string) !== 'nenhum'
    ? `<g opacity="0.75">${svgParticulas(aj.particulas as 'pontos' | 'estrelas' | 'pixels', {
      quantidade: 22, tamanho: 5, velocidade: 1, direcao: 'subir',
      cor: estilo.cores.destaque, opacidade: 0.85, duracaoMs: 1500,
    }, 'medio', 9, false).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>`
    : '';
  // mega 315 (§372): MARCA D'ÁGUA opcional — canto inferior direito,
  // discreta; ausente/vazia = string legada byte a byte
  const marca = aj && aj.marca
    ? `<text x="232" y="234" text-anchor="end" font-family="system-ui, sans-serif" ` +
      `font-size="8" font-weight="600" fill="#e6eaf2" opacity="0.4" letter-spacing="0.6">` +
      `${escaparTexto(aj.marca.toUpperCase())}</text>`
    : '';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"${dim} role="img" aria-label="Foto estilizada">
<defs><clipPath id="${uid}clip">${clip}</clipPath><clipPath id="${uid}fclip">${fclip}</clipPath>${defsAj}${mascaraBorda(uid, aj, fclip)}</defs>
<g clip-path="url(#${uid}clip)">${fundoComp}${efeitoAtras}${medalhao}${luz}${badge}${efeitoFrente}${vinheta}${grao}${particulasFoto}${legenda}${selo}${marca}</g>
${moldura}
</svg>`;

  if (opcoes.estatico) {
    svg = congelarSvg(svg);
  }
  return svg;
}

/** megas 565–567 (§340–341): BORDA SUAVE — máscara com PLUMA (feGaussian-
 *  Blur na silhueta branca) que substitui o clip DURO da foto do medalhão
 *  quando borda > 0. borda 0/ausente = string vazia = defs byte a byte. */
function mascaraBorda(uid: string, aj: Required<AjustesRender> | null, fclip: string): string {
  if (!aj || !(aj.borda > 0)) return '';
  const desvio = Math.round(aj.borda * 6 * 10) / 10; // 0..1 → 0..6px de pluma
  return `<filter id="${uid}fblur" x="-20%" y="-20%" width="140%" height="140%">` +
    `<feGaussianBlur stdDeviation="${desvio}"/></filter>` +
    `<mask id="${uid}fmask">${fclip.replace('/>', ` fill="#ffffff" filter="url(#${uid}fblur)"/>`)}</mask>`;
}

/** Medalhão (aro → foto clipada → anel de destaque) — compartilhado entre
 *  o quadrado clássico e os formatos wide (§325). Geometria IDÊNTICA à
 *  original: o output do formato 'perfil' segue byte a byte o mesmo. */
function medalhaoSvg(
  fotoHref: string,
  p: ReturnType<typeof paletaDe>,
  uid: string,
  aj: Required<AjustesRender> | null = null,
): string {
  // megas 51+53+117: filtro de cor + rotação/espelho/zoom da FOTO
  let extras = '';
  if (aj) {
    const temCor = aj.brilho !== 1 || aj.contraste !== 1 || aj.saturacao !== 1
      || aj.temperatura !== 0 || aj.filtroCor !== 'nenhum';
    if (temCor) extras += ` filter="url(#${uid}aj)"`;
    const t: string[] = [];
    if (aj.zoomFoto !== 1) t.push(`translate(120 118) scale(${aj.zoomFoto}) translate(-120 -118)`);
    if (aj.rotacao !== 0) t.push(`rotate(${aj.rotacao} 120 118)`);
    if (aj.espelhar) t.push('translate(240 0) scale(-1 1)');
    if (t.length) extras += ` transform="${t.join(' ')}"`;
  }
  const sombra = aj?.sombra ? sombraContato(uid) : '';
  // mega 111 (§341): forma ≠ círculo troca ARO + ANEL pela mesma silhueta;
  // círculo mantém as strings LEGADAS byte a byte
  const forma = aj ? pathForma(aj.forma, 97) : null;
  const anelW = aj?.anel ?? 3;
  const aro = forma
    ? `${forma} fill="#0a0d15" opacity="0.92"/>`
    : `<circle cx="120" cy="118" r="97" fill="#0a0d15" opacity="0.92"/>`;
  const formaAnel = aj ? pathForma(aj.forma, 93) : null;
  const anel = formaAnel
    ? `${formaAnel} fill="none" stroke="${p.destaque.base}" stroke-width="${anelW}" opacity="0.9"/>`
    : anelW !== 3
      ? `<circle cx="120" cy="118" r="93" fill="none" stroke="${p.destaque.base}" stroke-width="${anelW}" opacity="0.9"/>`
      : `<circle cx="120" cy="118" r="93" fill="none" stroke="${p.destaque.base}" stroke-width="3" opacity="0.9"/>`;
  // megas 565–567 (§340–341): com borda > 0 a foto usa a MÁSCARA plumada
  // (definida nos defs do chamador); sem borda, o clip legado byte a byte
  const recorte = aj && aj.borda > 0 ? `mask="url(#${uid}fmask)"` : `clip-path="url(#${uid}fclip)"`;
  return sombra + aro +
    `<image href="${escaparAtributo(fotoHref)}" x="28" y="26" width="184" height="184" ` +
      `preserveAspectRatio="xMidYMid slice" ${recorte}${extras}/>` +
    anel;
}

/** §325: composição WIDE — medalhão à ESQUERDA (célula 240×240 intocada:
 *  aura/efeito continuam ancorados nele), título + emblema à DIREITA em
 *  escala maior, fundo/banner ESTICADOS na largura toda. Moldura fica de
 *  fora: molduras são desenhadas para 1:1 e esticar deformaria os cantos
 *  (a UI desabilita os chips fora do formato Perfil). */
function comporWide(
  fotoHref: string,
  estilo: EstiloFotoRender,
  pintar: (id: string | undefined) => string,
  resolver: (id: string) => ParteDef | undefined,
  p: ReturnType<typeof paletaDe>,
  uid: string,
  opcoes: OpcoesRenderFoto,
): string {
  const formato = FORMATOS_FOTO[opcoes.formato ?? 'header'];
  const [W, H] = formato.caixa;
  const sx = W / 240;
  const aj = ajustesEfetivos(estilo.ajustes); // megas 51–54 + lote 111
  const defsAj = (aj ? filtroAjustes(uid, aj) : '') + (aj ? filtroDesfoque(uid, aj.desfoqueFundo) : '');
  const vinheta = aj ? vinhetaSvg(uid, aj.vinheta, W, H) : '';
  const grao = aj ? granulacaoSvg(uid, aj.granulacao, W, H) : '';
  const formaClipW = aj ? pathForma(aj.forma, 92) : null;
  const fclipW = formaClipW ? `${formaClipW}/>` : `<circle cx="120" cy="118" r="92"/>`;
  const cxTexto = opcoes.lado === 'direita' ? (W - 240) / 2 : (240 + W) / 2;
  // lote 1051-1060 (AS6 Parte 11, decisão #107 — via opcoes.reflowPos, o
  // engine segue livre de flags): posições MANUAIS definidas no PERFIL
  // (quadro 240×240) REFLUEM p/ a célula de texto do formato wide com
  // CONSTRAINTS (clamp na área segura da célula) — sem isso a âncora do
  // perfil cai dentro da célula do medalhão e o derivado quebra.
  const celulaX0 = opcoes.lado === 'direita' ? 0 : 240;
  const reflow = (pos: { x: number; y: number }): { x: number; y: number } => {
    if (!opcoes.reflowPos) return pos;
    const x = celulaX0 + (pos.x / 240) * (W - 240);
    const y = (pos.y / 240) * H;
    return {
      x: Math.min(celulaX0 + (W - 240) - 16, Math.max(celulaX0 + 16, x)),
      y: Math.min(H - 14, Math.max(18, y)),
    };
  };
  // lote 166+167 (§343): tipografia + subtítulo (presente = legenda sobe);
  // mega 223: pos.legenda/pos.subtitulo movem a âncora (ausente = legado)
  const txW = atributosTexto(estilo.tipografia, 13, '#e6eaf2');
  const yLegenda = estilo.subtitulo ? 96 : 108;
  const posLegW = estilo.pos?.legenda ? reflow(estilo.pos.legenda) : undefined;
  const legendaW = estilo.legenda
    ? `<text x="${posLegW ? round1(posLegW.x) : cxTexto}" y="${posLegW ? round1(posLegW.y) : yLegenda}" text-anchor="middle" ${txW.attrs} opacity="0.92">` +
      `${escaparTexto(txW.caixaAlta ? estilo.legenda.toUpperCase() : estilo.legenda)}</text>`
    : '';
  const txSub = atributosTexto(estilo.tipografia, 10.5, '#8b93a7');
  const posSubW = estilo.pos?.subtitulo ? reflow(estilo.pos.subtitulo) : undefined;
  const subtituloW = estilo.subtitulo
    ? `<text x="${posSubW ? round1(posSubW.x) : cxTexto}" y="${posSubW ? round1(posSubW.y) : 118}" text-anchor="middle" ${txSub.attrs} opacity="0.9">` +
      `${escaparTexto(txSub.caixaAlta ? estilo.subtitulo.toUpperCase() : estilo.subtitulo)}</text>`
    : '';

  // fundo + banner esticados ("fundo esticado" — §325); gradientes ficam
  // imperceptíveis, padrões alargam de leve (aceito pelo briefing)
  const cfgC = estilo.camadasFoto; // lote 161–164 (§338)
  const fundo = `<g transform="scale(${sx} 1)">${envolverCamada('fundo', pintar(estilo.camadas.fundo), cfgC)
    + envolverCamada('banner', pintar(estilo.camadas.banner), cfgC)}</g>`;
  const aura = envolverCamada('aura', pintar(estilo.camadas.aura), cfgC); // ancorada na célula esquerda
  const efeitoDef = estilo.camadas.efeito && estilo.camadas.efeito !== 'nenhum'
    ? resolver(estilo.camadas.efeito)
    : undefined;
  const efeitoSvg = envolverCamada('efeito', efeitoDef ? efeitoDef.render(p, uid) : '', cfgC);
  const efeitoAtrasFlag = cfgC?.efeito?.plano ? cfgC.efeito.plano === 'atras' : !!efeitoDef?.atras;
  const efeitoAtras = efeitoDef && efeitoAtrasFlag ? efeitoSvg : '';
  const efeitoFrente = efeitoDef && !efeitoAtrasFlag ? efeitoSvg : '';

  // mega 96 (§350): medalhão pode ir p/ a DIREITA — o texto/emblema troca
  // de lado junto (a foto "olha" para dentro da composição)
  const direita = opcoes.lado === 'direita';
  const deslocMedalhao = direita ? W - 240 : 0;
  // célula do texto: oposta ao medalhão
  const cx2 = direita ? (W - 240) / 2 : (240 + W) / 2;
  // mega 223/§345.1: pos.emblema move o badge (ausente = translate legado)
  const posEmbW = estilo.pos?.emblema ? reflow(estilo.pos.emblema) : undefined;
  const trEmbW = posEmbW
    ? `translate(${round1(posEmbW.x - 152)} ${round1(posEmbW.y - 206)}) scale(1)`
    : `translate(${cx2 - 152} -114) scale(1)`;
  const badge = estilo.camadas.emblema && estilo.camadas.emblema !== 'nenhum'
    ? envolverCamada('emblema', `<g transform="${trEmbW}">${pintar(estilo.camadas.emblema)}</g>`, cfgC)
    : '';
  const luzW = luzLocalSvg(uid, estilo.luzLocal); // lote 165 (§334)
  // mega 224 (§344) + 223: selo-componente quando configurado (senão legado)
  let selo = '';
  if (estilo.selo) {
    const posSW = estilo.pos?.selo ? reflow(estilo.pos.selo) : undefined;
    if (!estilo.seloCfg && !posSW) {
      const nome = estilo.selo.nome;
      const larg = Math.min(W - 240 - 24, Math.max(120, Math.round(nome.length * 10) + 34));
      selo =
        `<g><rect x="${cx2 - larg / 2}" y="128" width="${larg}" height="30" rx="15" fill="#0a0d15" opacity="0.88" ` +
          `stroke="${estilo.selo.cor}" stroke-width="1.6"/>` +
        `<text x="${cx2}" y="148" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" ` +
          `font-size="16" font-weight="700" fill="${estilo.selo.cor}">${escaparTexto(nome)}</text></g>`;
    } else {
      selo = seloComponente(estilo.selo, estilo.seloCfg, posSW ?? { x: cx2, y: 128 }, true, W - 240 - 24);
    }
  }

  // dimensões explícitas SÓ no export (raster nítido no canvas); no preview
  // o CSS manda — width/height intrínsecos inflariam o min-content do flex
  const [lw, lh] = formato.saida;
  const dims = opcoes.estatico ? ` width="${lw}" height="${lh}"` : '';
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"${dims} ` +
    `preserveAspectRatio="none" role="img" aria-label="Foto estilizada (${formato.nome})">
<defs><clipPath id="${uid}clip"><rect width="${W}" height="${H}" rx="14"/></clipPath><clipPath id="${uid}fclip">${fclipW}</clipPath>${defsAj}${mascaraBorda(uid, aj, fclipW)}</defs>
<g clip-path="url(#${uid}clip)">${opcoes.semFundo ? '' : `<rect width="${W}" height="${H}" fill="#0a0d15"/>`}${aj && aj.desfoqueFundo > 0 ? `<g filter="url(#${uid}bf)">${fundo}</g>` : fundo}${efeitoAtras}${direita ? `<g transform="translate(${deslocMedalhao} 0)">` : ''}${aura}${medalhaoSvg(fotoHref, p, uid, aj)}${luzW}${direita ? '</g>' : ''}${badge}${efeitoFrente}${vinheta}${grao}${legendaW}${subtituloW}${selo}</g>
</svg>`;

  if (opcoes.estatico) svg = congelarSvg(svg);
  return svg;
}
