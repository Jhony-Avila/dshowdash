// engine/render.ts — motor de composição SVG do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// Determinístico: mesmo AvatarConfig → mesmo SVG, byte a byte. É isso que
// permite salvar o config JSON no banco e re-renderizar em qualquer lugar
// (studio, header, menu, perfil) com resultado idêntico.
//
// Ordem de pintura (z-order fixo):
//   fundo → banner → aura → efeito(atrás) → base → roupa → emblema → boca
//   → olhos → cabelo → acessório → moldura → efeito(frente)
//   (banner/aura/emblema — Expansão, decisão #33: categorias 2D de baixo custo)
import type { AvatarConfig, CamadaId } from '../domain/types';
import { paletaDe } from './cores';
import { aplicarParamsSvg } from './params';
import type { ParteDef } from './base-api';
import { G } from './base-api';
import { corpoInteiro } from './partes/corpo';

export interface OpcoesRender {
  /** Tamanho CSS do SVG (width/height). Default: responsivo (100%). */
  tamanho?: number;
  /** Prefixo de ids de <defs>. Default: hash do config (estável e único). */
  uid?: string;
  /** 'quadrado' (raio 26) ou 'circulo' (como aparece no header). */
  forma?: 'quadrado' | 'circulo';
  /** Desliga animações SMIL (thumbnails em grade — economia de GPU). */
  estatico?: boolean;
  /**
   * Modo PALCO (AS3 F1): envolve as camadas em grupos data-anim
   * (plano-fundo/plano-personagem/personagem/olhos/cabelo/palpebras/plano-frente)
   * para o PalcoCinema animar via WAAPI. NUNCA usado na publicação —
   * o SVG salvo permanece byte-estável (critério de aceite nº 8).
   */
  palco?: boolean;
  /**
   * Enquadramento (AS3 F2a): 'busto' (padrão — publicação/header) ou
   * 'corpo' (240×400, corpo inteiro com braços animáveis — só no palco,
   * exige palco:true). Pedido do Jhony: "avatares com o corpo inteiro".
   */
  enquadramento?: 'busto' | 'corpo';
}

/** Hash djb2 → base36. Estável entre execuções (nada de Math.random). */
export function hashTexto(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `av${(h >>> 0).toString(36)}`;
}

export function hashConfig(config: AvatarConfig): string {
  return hashTexto(JSON.stringify(config));
}

/** Remove blocos SMIL — thumbnails/rasterizações ficam congeladas. */
export function congelarSvg(svg: string): string {
  return svg.replace(/<animate[^>]*\/>|<animate[\s\S]*?<\/animate[^>]*>/g, '')
            .replace(/<animateTransform[^>]*\/>/g, '');
}

// Slots ADITIVOS de acessórios (4.6 §20, decisão #41): pescoço/costas por
// baixo, chapéu sobre o cabelo, rosto por cima de tudo. A chave legada
// 'acessorio' fica na sequência por robustez (configs antigos sem validar).
const ORDEM_CAMADAS = [
  // 'roupa_sobre' (§3393, decisão #95): SOBREPEÇA por cima da roupa —
  // campo ausente ⇒ fragmento vazio ⇒ SVG byte a byte o de sempre
  'roupa', 'roupa_sobre', 'emblema', 'boca', 'olhos', 'cabelo',
  'acessorio', 'acessorio_pescoco', 'acessorio_cabeca', 'acessorio_rosto',
  // mega onda 1301+ (decisão #140, as6.acess_v2): slots FINOS aditivos
  // logo após o bloco legado (a arte foi autorada p/ esta faixa de
  // empilhamento); ausentes = SVG byte a byte o de sempre. Ordem entre
  // eles: costas → olhos → orelha → flutuante → companheiro.
  'acessorio_costas', 'acessorio_olhos', 'acessorio_orelha',
  'acessorio_flutuante', 'acessorio_companheiro',
  // onda 1404 (decisão #154, as6.slots_corpo): slots CORPORAIS — no busto
  // a arte NÃO desenha (render vazio por contrato; só renderCorpo existe),
  // então a presença aqui é forward-compat: fragmento vazio = SVG byte a
  // byte. Ordem: pernas → pés → cintura → pulsos → mãos (mãos por cima).
  'acessorio_pernas', 'acessorio_pes', 'acessorio_cintura',
  'acessorio_pulso_e', 'acessorio_pulso_d', 'acessorio_mao_e', 'acessorio_mao_d',
] as const;

/** onda 1404 (#154): slots corporais — ordem de pintura no CORPO INTEIRO
 *  (por cima do scaffold do corpo, por baixo da cabeça). */
const SLOTS_CORPO = [
  'acessorio_pernas', 'acessorio_pes', 'acessorio_cintura',
  'acessorio_pulso_e', 'acessorio_pulso_d', 'acessorio_mao_e', 'acessorio_mao_d',
] as const;

// ── megas 254–255 (§102/§118): TIPO CORPORAL e POSTURA ──────────────
// Transforms de WRAPPER na figura (arte 100% intocada — regra da F2);
// ancorados na BASE da figura (cy) para os pés não "flutuarem". Campo
// ausente = wrapper ausente = SVG byte a byte o de sempre.
const TIPOS_CORPO: Record<string, [number, number]> = {
  esbelto: [0.95, 1.02], atletico: [1.05, 1], robusto: [1.1, 0.98], compacto: [0.97, 0.94],
};
const POSTURAS_FIG: Record<string, string> = {
  confiante: 'rotate(-2 120 __CY__)',
  relaxada: 'rotate(2.5 120 __CY__)',
  executiva: 'rotate(-1 120 __CY__)',
  heroica: 'rotate(-1.5 120 __CY__)',
  misteriosa: 'rotate(1.5 120 __CY__) translate(0 2)',
};

/** Wrapper §102/§118 da FIGURA (cy = base da figura no viewBox atual). */
function envolverFigura(svg: string, config: AvatarConfig, cy: number): string {
  const corpo = config.corpo ? TIPOS_CORPO[config.corpo] : undefined;
  const postura = config.postura ? POSTURAS_FIG[config.postura] : undefined;
  // megas 561–564 (§102.2): ajuste FINO multiplica o preset (1 = neutro).
  // validarConfig omite valores 1 — corpoFino ausente ⇒ sx/sy iguais ao
  // preset puro ⇒ saída byte a byte a de sempre (byte-stability).
  const fino = config.corpoFino;
  const sx = (corpo?.[0] ?? 1) * (fino?.largura ?? 1);
  const sy = (corpo?.[1] ?? 1) * (fino?.altura ?? 1);
  const escala = sx !== 1 || sy !== 1;
  if (!escala && !postura) return svg;
  const arr = (n: number) => Math.round(n * 1000) / 1000;
  const partes: string[] = [];
  if (escala) partes.push(`translate(120 ${cy}) scale(${arr(sx)} ${arr(sy)}) translate(-120 -${cy})`);
  if (postura) partes.push(postura.replace(/__CY__/g, String(Math.round(cy * 0.82))));
  return `<g transform="${partes.join(' ')}">${svg}</g>`;
}

/**
 * Compõe o SVG completo do avatar.
 * `resolver` desacopla o motor do catálogo (inversão de dependência):
 * recebe um id e devolve a ParteDef — quem conhece o catálogo é o serviço.
 */
export function renderAvatar(
  config: AvatarConfig,
  resolver: (id: string) => ParteDef | undefined,
  opcoes: OpcoesRender = {},
): string {
  const uid = opcoes.uid ?? hashConfig(config);
  const p = paletaDe(config.cores);
  const forma = opcoes.forma ?? 'quadrado';

  // §73: paleta LOCAL da camada — override de canais só para esta peça
  // (a arte não muda: recebe outra Paleta pela MESMA injeção de sempre).
  const paletaDa = (chave?: CamadaId) => {
    const canais = chave ? config.coresCamada?.[chave] : undefined;
    return canais && Object.keys(canais).length
      ? paletaDe({ ...config.cores, ...canais })
      : p;
  };

  // §71: `chave` liga as PROPRIEDADES da camada (config.params) ao fragmento
  // — sem params o retorno é byte-idêntico ao de antes da feature.
  const pintar = (id: string | undefined, chave?: CamadaId): string => {
    if (!id || id === 'nenhum') return '';
    const parte = resolver(id);
    const svg = parte ? parte.render(paletaDa(chave), uid) : '';
    return chave ? aplicarParamsSvg(chave, svg, config.params?.[chave]) : svg;
  };

  // "fundo" composto: fundo → banner → aura (tudo atrás do personagem)
  const fundo = pintar(config.camadas.fundo, 'fundo') + pintar(config.camadas.banner, 'banner')
    + pintar(config.camadas.aura, 'aura');
  const efeitoDef = config.camadas.efeito && config.camadas.efeito !== 'nenhum'
    ? resolver(config.camadas.efeito)
    : undefined;
  const efeitoSvg = efeitoDef ? pintar(config.camadas.efeito, 'efeito') : '';
  const efeitoAtras = efeitoDef?.atras ? efeitoSvg : '';
  const efeitoFrente = efeitoDef && !efeitoDef.atras ? efeitoSvg : '';

  const moldura = pintar(config.camadas.moldura, 'moldura');

  const alto = opcoes.enquadramento === 'corpo' && opcoes.palco ? 400 : 240;
  const clip = forma === 'circulo' && alto === 240
    ? `<circle cx="${G.cx}" cy="${G.cx}" r="118"/>`
    : `<rect width="240" height="${alto}" rx="26"/>`;

  const dim = opcoes.tamanho ? ` width="${opcoes.tamanho}" height="${opcoes.tamanho}"` : '';

  const corpoTodo = opcoes.enquadramento === 'corpo' && opcoes.palco;

  // acessórios nos slots aditivos (+ legado) — usado nos modos de palco
  // (#140: slots finos após o bloco legado; ausentes = byte a byte)
  const acessorios =
    pintar(config.camadas.acessorio, 'acessorio') + pintar(config.camadas.acessorio_pescoco, 'acessorio_pescoco') +
    pintar(config.camadas.acessorio_cabeca, 'acessorio_cabeca') + pintar(config.camadas.acessorio_rosto, 'acessorio_rosto') +
    pintar(config.camadas.acessorio_costas, 'acessorio_costas') + pintar(config.camadas.acessorio_olhos, 'acessorio_olhos') +
    pintar(config.camadas.acessorio_orelha, 'acessorio_orelha') + pintar(config.camadas.acessorio_flutuante, 'acessorio_flutuante') +
    pintar(config.camadas.acessorio_companheiro, 'acessorio_companheiro');

  let conteudo: string;
  if (opcoes.palco) {
    // Grupos animáveis do palco (idle/parallax) — só no preview do estúdio.
    const itemOlhos = config.camadas.olhos ? resolver(config.camadas.olhos) : undefined;
    const palpebras = itemOlhos && itemOlhos.piscar !== false
      ? `<g data-anim="palpebras" opacity="0">
          <ellipse cx="${G.olhoEsqX}" cy="${G.olhosY - 1}" rx="12" ry="10" fill="${p.pele.escuro}"/>
          <ellipse cx="${G.olhoDirX}" cy="${G.olhosY - 1}" rx="12" ry="10" fill="${p.pele.escuro}"/>
        </g>`
      : '';
    if (corpoTodo) {
      // CORPO INTEIRO (240×400): corpo novo + cabeça do busto (sem a roupa
      // de busto) reaproveitada em escala no topo — arte 100% compartilhada.
      const cabeca =
        pintar(config.base) + pintar(config.camadas.boca, 'boca') +
        `<g data-anim="olhos">${pintar(config.camadas.olhos, 'olhos')}</g>` +
        `<g data-anim="cabelo">${pintar(config.camadas.cabelo, 'cabelo')}</g>` +
        acessorios + palpebras;
      // roupa no CORPO INTEIRO: detalhes da peça sobre o scaffold (gola,
      // gravata, zíper, obi…) — sem isto a roupa só mudava a cor do corpo
      const roupaDef = config.camadas.roupa && config.camadas.roupa !== 'nenhum'
        ? resolver(config.camadas.roupa)
        : undefined;
      const roupaCorpo = roupaDef?.renderCorpo ? roupaDef.renderCorpo(paletaDa('roupa'), uid) : '';
      // sobrepeça §3393 no corpo inteiro: fragmento direto (mesmas coords)
      const sobreDef = config.camadas.roupa_sobre && config.camadas.roupa_sobre !== 'nenhum'
        ? resolver(config.camadas.roupa_sobre)
        : undefined;
      const sobreCorpo = sobreDef?.renderCorpo ? sobreDef.renderCorpo(paletaDa('roupa_sobre'), uid) : '';
      // onda 1404 (#154, as6.slots_corpo): acessórios CORPORAIS — arte em
      // coordenadas do corpo inteiro via renderCorpo (contrato da roupa);
      // params §71 aplicados como em qualquer camada; slot ausente = ''
      let acessCorpo = '';
      for (const s of SLOTS_CORPO) {
        const idc = config.camadas[s];
        if (!idc || idc === 'nenhum') continue;
        const def = resolver(idc);
        if (!def?.renderCorpo) continue;
        acessCorpo += aplicarParamsSvg(s, def.renderCorpo(paletaDa(s), uid), config.params?.[s]);
      }
      // emblema no peito do corpo inteiro (mapeia (152,206) do busto → (145,145))
      const emblemaCorpo = config.camadas.emblema && config.camadas.emblema !== 'nenhum'
        ? `<g transform="translate(15.8 -30.1) scale(0.85)">${pintar(config.camadas.emblema, 'emblema')}</g>`
        : '';
      conteudo =
        `<g data-anim="plano-fundo"><g transform="translate(120 200) scale(1.78) translate(-120 -120)">${fundo}${efeitoAtras}</g></g>` +
        `<g data-anim="plano-personagem"><g data-anim="personagem">` +
          envolverFigura(
            corpoInteiro(paletaDa('roupa'), uid) + roupaCorpo + sobreCorpo + emblemaCorpo + acessCorpo +
            `<g transform="translate(45.6 -16) scale(0.62)">${cabeca}</g>`,
            config, 396,
          ) +
        `</g></g>` +
        `<g data-anim="plano-frente"><g transform="translate(120 200) scale(1.8) translate(-120 -120)">${efeitoFrente}</g></g>`;
    } else {
      // planos com sobre-escala: o parallax translada sem expor a borda do clip
      conteudo =
        `<g data-anim="plano-fundo"><g transform="translate(120 120) scale(1.08) translate(-120 -120)">${fundo}${efeitoAtras}</g></g>` +
        `<g data-anim="plano-personagem"><g data-anim="personagem">` +
          envolverFigura(
            pintar(config.base) + pintar(config.camadas.roupa, 'roupa') + pintar(config.camadas.roupa_sobre, 'roupa_sobre') + pintar(config.camadas.emblema, 'emblema') +
            pintar(config.camadas.boca, 'boca') +
            `<g data-anim="olhos">${pintar(config.camadas.olhos, 'olhos')}</g>` +
            `<g data-anim="cabelo">${pintar(config.camadas.cabelo, 'cabelo')}</g>` +
            acessorios + palpebras,
            config, 236,
          ) +
        `</g></g>` +
        `<g data-anim="plano-frente"><g transform="translate(120 120) scale(1.1) translate(-120 -120)">${efeitoFrente}</g></g>`;
    }
  } else {
    const personagem = envolverFigura(
      pintar(config.base) + ORDEM_CAMADAS.map((c) => pintar(config.camadas[c], c)).join(''),
      config, 236,
    );
    conteudo = `${fundo}${efeitoAtras}${personagem}${efeitoFrente}`;
  }

  // mega 237 (§167): no modo PALCO a moldura ganha um grupo animável
  // (comportamento por raridade via CSS do shell); publicação intocada —
  // palco:true NUNCA é usado no SVG salvo (critério de aceite nº 8)
  const molduraFinal = corpoTodo ? '' : (opcoes.palco && moldura ? `<g data-anim="moldura">${moldura}</g>` : moldura);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 ${alto}"${dim} role="img" aria-label="Avatar personalizado">
<defs><clipPath id="${uid}clip">${clip}</clipPath></defs>
<g clip-path="url(#${uid}clip)">${conteudo}</g>
${molduraFinal}
</svg>`;

  if (opcoes.estatico) {
    svg = congelarSvg(svg);
  }
  return svg;
}

/** SVG como data: URI — vira `src` de <img> em qualquer lugar do shell. */
export function renderDataUri(
  config: AvatarConfig,
  resolver: (id: string) => ParteDef | undefined,
  opcoes: OpcoesRender = {},
): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(renderAvatar(config, resolver, opcoes))}`;
}
