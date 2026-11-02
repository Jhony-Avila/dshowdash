"use strict";
var DSHOWAvatarMotor = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // scripts/avatar/motor/entry.ts
  var entry_exports = {};
  __export(entry_exports, {
    ARQUETIPOS: () => ARQUETIPOS,
    CAMADAS_Z: () => CAMADAS_Z,
    CATEGORIAS: () => CATEGORIAS,
    COLECOES: () => COLECOES,
    CONFIG_PADRAO: () => CONFIG_PADRAO,
    CORES_SUGERIDAS: () => CORES_SUGERIDAS,
    FLAGS_REMOTAS: () => FLAGS_REMOTAS,
    ORDEM_CAMADAS: () => ORDEM_CAMADAS,
    PALETAS_ROUPA: () => PALETAS_ROUPA,
    PRESETS: () => PRESETS,
    TITULOS: () => TITULOS,
    catalogoSerializavel: () => catalogoSerializavel,
    categoriasAtivas: () => categoriasAtivas,
    configDePreset: () => configDePreset,
    congelarSvg: () => congelarSvg,
    dataUriDe: () => dataUriDe,
    definirFlags: () => definirFlags,
    flag: () => flag,
    hashConfig: () => hashConfig,
    hashTexto: () => hashTexto,
    itemPorId: () => itemPorId,
    itensDe: () => itensDe,
    paletaDe: () => paletaDe,
    presetsAtivos: () => presetsAtivos,
    renderAvatar: () => renderAvatar,
    renderDataUri: () => renderDataUri,
    svgDe: () => svgDe,
    svgFotoDe: () => svgFotoDe,
    svgItemIsolado: () => svgItemIsolado,
    validarConfig: () => validarConfig
  });

  // public/components/panels/panel-avatar-studio/src/domain/corpo102.ts
  var PRESETS_CORPO = {
    esbelto: [0.95, 1.02],
    atletico: [1.05, 1],
    robusto: [1.1, 0.98],
    compacto: [0.97, 0.94],
    // Golden V3.1 (#219): perfil FEMININO explícito — sobrevive validarConfig
    // (bug V3: 'feminino' era descartado por não estar no enum). Escala 3D suave.
    feminino: [0.94, 1]
  };

  // public/components/panels/panel-avatar-studio/src/engine/cores.ts
  var HEX_RE = /^#[0-9a-fA-F]{6}$/;
  function hexValido(hex) {
    return typeof hex === "string" && HEX_RE.test(hex);
  }
  function normalizarHex(hex, fallback) {
    if (hexValido(hex)) return hex.toLowerCase();
    if (typeof hex === "string" && /^#[0-9a-fA-F]{3}$/.test(hex)) {
      const [, r, g, b] = hex;
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return fallback;
  }
  function hexRgb(hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ];
  }
  function rgbHex(r, g, b) {
    const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
    return `#${c(r)}${c(g)}${c(b)}`;
  }
  function misturar(a, b, t) {
    const [r1, g1, b1] = hexRgb(a);
    const [r2, g2, b2] = hexRgb(b);
    return rgbHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
  }
  function escurecer(hex, t) {
    return misturar(hex, "#0b0e1a", t);
  }
  function clarear(hex, t) {
    return misturar(hex, "#fff6ec", t);
  }
  function alfa(hex, a) {
    const [r, g, b] = hexRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }
  function tinta(hex) {
    return {
      base: hex,
      claro: clarear(hex, 0.32),
      escuro: escurecer(hex, 0.28),
      profundo: escurecer(hex, 0.52)
    };
  }
  function luminanciaDe(hex) {
    const n = normalizarHex(hex, "#000000").slice(1);
    const c = [0, 2, 4].map((i) => {
      const v = parseInt(n.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function tintaPremium(hex) {
    const base = normalizarHex(hex, "#000000");
    const lum = luminanciaDe(base);
    const kClaro = 0.18 + 0.3 * (1 - lum);
    const kEscuro = 0.14 + 0.26 * lum;
    return {
      base,
      brilho: clarear(base, Math.min(0.9, kClaro + 0.28)),
      claro: clarear(base, kClaro),
      meio: escurecer(base, kEscuro * 0.5),
      escuro: escurecer(base, kEscuro),
      profundo: escurecer(base, Math.min(0.9, kEscuro + 0.24)),
      luminancia: Math.round(lum * 1e3) / 1e3
    };
  }
  function secundarioPadraoDe(roupaHex) {
    return misturar(escurecer(roupaHex, 0.35), "#2b2f3a", 0.3);
  }
  var CORES_PADRAO = {
    pele: "#e8b58c",
    cabelo: "#3d2b1f",
    roupa: "#2d4a8a",
    destaque: "#7c5cff"
  };
  function paletaDe(cores) {
    const c = cores ?? {};
    const p = {
      pele: tinta(normalizarHex(c.pele, CORES_PADRAO.pele)),
      cabelo: tinta(normalizarHex(c.cabelo, CORES_PADRAO.cabelo)),
      roupa: tinta(normalizarHex(c.roupa, CORES_PADRAO.roupa)),
      destaque: tinta(normalizarHex(c.destaque, CORES_PADRAO.destaque))
    };
    if (hexValido(c.secundario)) p.secundario = tinta(c.secundario);
    return p;
  }

  // public/components/panels/panel-avatar-studio/src/engine/params.ts
  var PARAMS_POR_CATEGORIA = {
    aura: [
      { id: "intensidade", nome: "Intensidade", min: 0.25, max: 1, passo: 0.05, padrao: 1 },
      { id: "velocidade", nome: "Velocidade", min: 0.5, max: 2, passo: 0.1, padrao: 1 },
      { id: "raio", nome: "Raio", min: 0.7, max: 1.3, passo: 0.05, padrao: 1 },
      // §150.1 (P4)
      // onda 1417 (#199): NÚCLEO da aura premium — opacidade do miolo
      // (marcador data-nucleo); soV2 = só artes aur_px_ (mesmo trilho #179)
      { id: "nucleo", nome: "Núcleo", min: 0, max: 1, passo: 0.05, padrao: 0.5, soV2: true }
    ],
    // megas 441-443 (§158, lote 441-450, flag as5.editor_efeitos na UI):
    // EDITOR do efeito equipado — intensidade (<g opacity>) e velocidade
    // (reescala dur SMIL), ambos wrappers genéricos já existentes; valor
    // padrão é OMITIDO → render byte-idêntico ao legado
    efeito: [
      { id: "intensidade", nome: "Intensidade", min: 0.25, max: 1, passo: 0.05, padrao: 1 },
      { id: "velocidade", nome: "Velocidade", min: 0.5, max: 2, passo: 0.1, padrao: 1 }
    ],
    emblema: [
      { id: "escala", nome: "Escala", min: 0.6, max: 1.5, passo: 0.05, padrao: 1 }
    ],
    // mega 64 (§166–§172): editores de MOLDURA e BANNER — intensidade usa o
    // wrapper genérico <g opacity>; escala fica de fora (deformaria o quadro)
    moldura: [
      { id: "intensidade", nome: "Intensidade", min: 0.3, max: 1, passo: 0.05, padrao: 1 },
      // lote 171 (§168): brilho + matiz + velocidade — wrappers genéricos,
      // NUNCA tocam a arte (regra da F2)
      { id: "brilho", nome: "Brilho", min: 0.6, max: 1.6, passo: 0.05, padrao: 1 },
      { id: "matiz", nome: "Matiz", min: -180, max: 180, passo: 5, padrao: 0 },
      { id: "velocidade", nome: "Velocidade", min: 0.5, max: 2, passo: 0.1, padrao: 1 },
      // mega 238 (§168): emissão (glow), sombra e escala com limites curtos
      // ("versão compacta" = escala <1) — sempre wrappers, arte intocada
      { id: "emissao", nome: "Emissão", min: 0, max: 1, passo: 0.05, padrao: 0 },
      { id: "sombra", nome: "Sombra", min: 0, max: 1, passo: 0.05, padrao: 0 },
      { id: "escala", nome: "Escala", min: 0.85, max: 1.05, passo: 0.01, padrao: 1 }
    ],
    banner: [
      { id: "intensidade", nome: "Intensidade", min: 0.3, max: 1, passo: 0.05, padrao: 1 },
      // lote 172 (§170): cor (matiz) + brilho do banner
      { id: "brilho", nome: "Brilho", min: 0.6, max: 1.6, passo: 0.05, padrao: 1 },
      { id: "matiz", nome: "Matiz", min: -180, max: 180, passo: 5, padrao: 0 },
      // mega 239 (§170/§170.1): POSIÇÃO horizontal do banner (presets de
      // composição esquerda/centro/direita usam este mesmo parâmetro)
      { id: "deslocamento", nome: "Posição", min: -30, max: 30, passo: 2, padrao: 0 }
    ],
    // megas 72–74 (§108–§111): MORFOLOGIA paramétrica — escala em torno do
    // centro geométrico de cada feição (mesmo wrapper de escala do emblema)
    olhos: [
      { id: "escala", nome: "Tamanho", min: 0.8, max: 1.2, passo: 0.02, padrao: 1 },
      // onda 1412 (§705–§706, #159): OLHOS v2 — espaçamento/altura/inclinação
      // como WRAPPERS; `soV2` = só existem para artes premium `olh_px_*`
      // (paramsDaCamada filtra pelo idItem; legado segue byte a byte)
      { id: "espacamento", nome: "Espaçamento", min: 0.88, max: 1.12, passo: 0.02, padrao: 1, soV2: true },
      { id: "altura", nome: "Altura", min: -4, max: 4, passo: 0.5, padrao: 0, soV2: true },
      { id: "inclinacao", nome: "Inclinação", min: -8, max: 8, passo: 1, padrao: 0, soV2: true }
    ],
    boca: [
      { id: "escala", nome: "Tamanho", min: 0.8, max: 1.2, passo: 0.02, padrao: 1 }
    ],
    cabelo: [
      { id: "escala", nome: "Volume", min: 0.9, max: 1.12, passo: 0.02, padrao: 1 },
      // onda 1413 (§897): ENCAIXE com headwear — profundidade do recorte da
      // calota (0 = automático pelo estado; >0 força). Consumido pelo MOTOR
      // (clipPath), não é wrapper; só artes v2 (`_px_`)
      { id: "encaixe", nome: "Encaixe com chapéu", min: 0, max: 1, passo: 0.05, padrao: 0, soV2: true }
    ]
  };
  var CENTRO_ESCALA = {
    emblema: [152, 206],
    // peito do busto — mesmo ponto do mapeamento corpo inteiro
    aura: [120, 120],
    // §150.1: raio escala do CENTRO do palco
    // megas 72–74: centros das feições (G do base-api — olhosY 108, bocaY 146)
    olhos: [120, 108],
    boca: [120, 146],
    cabelo: [120, 78],
    // massa do cabelo acima do centro da cabeça (106)
    moldura: [120, 120]
    // mega 238 (§168): compacta/expande do centro do quadro
  };
  function categoriaDaCamada(chave) {
    return chave.startsWith("acessorio") ? "acessorio" : chave;
  }
  function paramsDaCamada(chave, idItem) {
    const defs = PARAMS_POR_CATEGORIA[categoriaDaCamada(chave)];
    if (!defs) return void 0;
    if (/_px_/.test(idItem ?? "")) return defs;
    const semV2 = defs.filter((d) => !d.soV2);
    return semV2.length ? semV2 : void 0;
  }
  var clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  function sanitizarParams(chave, bruto, idItem) {
    const defs = paramsDaCamada(chave, idItem);
    if (!defs || typeof bruto !== "object" || bruto === null) return void 0;
    const saida = {};
    for (const def of defs) {
      const v = bruto[def.id];
      if (typeof v !== "number" || !Number.isFinite(v)) continue;
      const g = clamp(v, def.min, def.max);
      if (g !== def.padrao) saida[def.id] = Math.round(g * 100) / 100;
    }
    return Object.keys(saida).length ? saida : void 0;
  }
  function reescalarDur(svg, velocidade) {
    return svg.replace(/dur="(\d+(?:\.\d+)?)s"/g, (_, n) => {
      const novo = Math.max(0.2, parseFloat(n) / velocidade);
      return `dur="${Math.round(novo * 100) / 100}s"`;
    });
  }
  function aplicarParamsSvg(chave, svg, params, idItem) {
    if (!svg || !params) return svg;
    const defs = paramsDaCamada(chave, idItem);
    if (!defs) return svg;
    const valor = (id) => {
      const def = defs.find((d) => d.id === id);
      const v = params[id];
      if (!def || typeof v !== "number" || !Number.isFinite(v)) return void 0;
      const g = clamp(v, def.min, def.max);
      return g === def.padrao ? void 0 : g;
    };
    let saida = svg;
    const velocidade = valor("velocidade");
    if (velocidade !== void 0) saida = reescalarDur(saida, velocidade);
    const escala = valor("escala") ?? valor("raio");
    if (escala !== void 0) {
      const [cx, cy] = CENTRO_ESCALA[categoriaDaCamada(chave)] ?? [120, 120];
      saida = `<g transform="translate(${cx} ${cy}) scale(${escala}) translate(${-cx} ${-cy})">${saida}</g>`;
    }
    const nucleo = valor("nucleo");
    if (nucleo !== void 0) {
      const op = Math.round((0.15 + nucleo * 0.8) * 100) / 100;
      saida = saida.replace(/(<g data-nucleo(?:="1")? opacity=")[0-9.]+(")/g, `$1${op}$2`);
    }
    const intensidade = valor("intensidade");
    if (intensidade !== void 0) {
      saida = `<g opacity="${intensidade}">${saida}</g>`;
    }
    const brilho = valor("brilho");
    const matiz = valor("matiz");
    const emissao = valor("emissao");
    const sombra = valor("sombra");
    if (brilho !== void 0 || matiz !== void 0 || emissao !== void 0 || sombra !== void 0) {
      const fns = [
        brilho !== void 0 ? `brightness(${brilho})` : "",
        matiz !== void 0 ? `hue-rotate(${matiz}deg)` : "",
        emissao !== void 0 ? `drop-shadow(0 0 ${Math.round(emissao * 8 * 10) / 10}px rgba(160,180,255,${Math.round(emissao * 0.7 * 100) / 100}))` : "",
        sombra !== void 0 ? `drop-shadow(0 5px ${Math.round(sombra * 7 * 10) / 10}px rgba(0,0,0,${Math.round(sombra * 0.65 * 100) / 100}))` : ""
      ].filter(Boolean).join(" ");
      saida = `<g filter="${fns}">${saida}</g>`;
    }
    const espacamento = valor("espacamento");
    const alturaOlhos = valor("altura");
    const inclinacao = valor("inclinacao");
    if (espacamento !== void 0 || alturaOlhos !== void 0 || inclinacao !== void 0) {
      const ts = [
        alturaOlhos !== void 0 ? `translate(0 ${alturaOlhos})` : "",
        inclinacao !== void 0 ? `rotate(${inclinacao} 120 108)` : "",
        espacamento !== void 0 ? `translate(120 108) scale(${espacamento} 1) translate(-120 -108)` : ""
      ].filter(Boolean).join(" ");
      saida = `<g transform="${ts}">${saida}</g>`;
    }
    const deslocamento = valor("deslocamento");
    if (deslocamento !== void 0) {
      saida = `<g transform="translate(${deslocamento} 0)">${saida}</g>`;
    }
    return saida;
  }

  // public/components/panels/panel-avatar-studio/src/engine/base-api.ts
  var G = {
    lado: 240,
    cx: 120,
    cabecaCy: 106,
    cabecaRx: 50,
    cabecaRy: 57,
    topoCabeca: 49,
    olhoEsqX: 100,
    olhoDirX: 140,
    olhosY: 108,
    bocaY: 146,
    orelhaY: 112
  };
  var PATH_OMBROS = "M36 240 v-12 c0 -28 36 -46 84 -46 s84 18 84 46 v12 z";
  var PATH_PESCOCO = "M103 146 h34 v40 c0 9 -34 9 -34 0 z";

  // public/components/panels/panel-avatar-studio/src/engine/partes/corpo.ts
  var CORPO = {
    viewBox: "0 0 240 400",
    ombroY: 116,
    ombroEsqX: 86,
    ombroDirX: 154,
    cinturaY: 218,
    chaoY: 384
  };
  function corpoInteiro(p, uid) {
    const d = uid + "cp";
    return `
    <defs>
      <linearGradient id="${d}t" x1="0.2" y1="0" x2="0.6" y2="1">
        <stop offset="0" stop-color="${p.roupa.claro}"/>
        <stop offset="0.45" stop-color="${p.roupa.base}"/>
        <stop offset="1" stop-color="${p.roupa.profundo}"/>
      </linearGradient>
      <linearGradient id="${d}c" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${p.roupa.escuro}"/>
        <stop offset="1" stop-color="${p.roupa.profundo}"/>
      </linearGradient>
      <linearGradient id="${d}b" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${p.roupa.claro}"/>
        <stop offset="1" stop-color="${p.roupa.escuro}"/>
      </linearGradient>
    </defs>

    <!-- sombra de contato no chão -->
    <ellipse cx="120" cy="${CORPO.chaoY + 4}" rx="58" ry="9" fill="${alfa("#000000", 0.3)}"/>

    <!-- quadril + pernas (calça) -->
    <path d="M90 206 h60 v16 h-60 z" fill="url(#${d}c)"/>
    <path d="M91 216 h26 l-3 114 c0 8 -20 8 -20 0 z" fill="url(#${d}c)"/>
    <path d="M123 216 h26 l-3 114 c0 8 -20 8 -20 0 z" fill="url(#${d}c)"/>
    <path d="M90 210 q 30 12 60 0 l 0 10 q -30 10 -60 0 z" fill="${alfa("#000000", 0.18)}"/>

    <!-- sapatos -->
    <path d="M90 328 h28 v32 c0 6 -4 10 -10 10 h-24 c-8 0 -10 -10 -2 -14 l 8 -5 z" fill="#1a1e2a"/>
    <path d="M122 328 h28 l 0 23 l 8 5 c 8 4 6 14 -2 14 h-24 c-6 0 -10 -4 -10 -10 z" fill="#1a1e2a"/>
    <path d="M82 366 h34 m 40 0 h34" stroke="${p.destaque.base}" stroke-width="3" stroke-linecap="round"/>

    <!-- torso -->
    <path d="M86 108 c 10 -8 58 -8 68 0 c 8 6 12 26 12 52 c 0 24 -4 44 -10 58 c -22 8 -50 8 -72 0 c -6 -14 -10 -34 -10 -58 c 0 -26 4 -46 12 -52 z" fill="url(#${d}t)"/>
    <path d="M120 112 v 106" stroke="${alfa("#000000", 0.14)}" stroke-width="2"/>
    <path d="M96 122 c 14 8 34 8 48 0" stroke="${alfa("#ffffff", 0.14)}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="120" cy="150" r="7" fill="${alfa(p.destaque.base, 0.85)}"/>
    <circle cx="120" cy="150" r="10" fill="none" stroke="${alfa(p.destaque.base, 0.4)}" stroke-width="2"/>

    <!-- braço esquerdo (dele) — gira no ombro p/ performances; LUVAS no tom
         da roupa (coerente p/ humanos E espécies — panda não tem mão de pele) -->
    <g data-anim="braco-dir" style="transform-box: view-box; transform-origin: ${CORPO.ombroEsqX}px ${CORPO.ombroY}px">
      <path d="M${CORPO.ombroEsqX} ${CORPO.ombroY - 8} c -14 4 -20 22 -20 42 c 0 20 4 38 10 50 l 14 -4 c -4 -12 -7 -28 -7 -46 c 0 -16 2 -30 3 -42 z" fill="url(#${d}b)"/>
      <circle cx="72" cy="206" r="10" fill="${p.roupa.profundo}"/>
      <circle cx="72" cy="206" r="10" fill="none" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="1.6"/>
      <circle cx="70" cy="203" r="3.4" fill="${alfa("#ffffff", 0.22)}"/>
    </g>

    <!-- braço direito (dele) -->
    <g data-anim="braco-esq" style="transform-box: view-box; transform-origin: ${CORPO.ombroDirX}px ${CORPO.ombroY}px">
      <path d="M${CORPO.ombroDirX} ${CORPO.ombroY - 8} c 14 4 20 22 20 42 c 0 20 -4 38 -10 50 l -14 -4 c 4 -12 7 -28 7 -46 c 0 -16 -2 -30 -3 -42 z" fill="url(#${d}b)"/>
      <circle cx="168" cy="206" r="10" fill="${p.roupa.profundo}"/>
      <circle cx="168" cy="206" r="10" fill="none" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="1.6"/>
      <circle cx="166" cy="203" r="3.4" fill="${alfa("#ffffff", 0.22)}"/>
    </g>

    <!-- gola/base do pescoço (encaixe da cabeça do busto) -->
    <path d="M100 104 c 12 8 28 8 40 0 l 2 10 c -14 8 -30 8 -44 0 z" fill="${p.roupa.profundo}"/>`;
  }
  var DIMS_CORPO = {
    //          ombro peito cint quad coxa braço antebraço  (V3: pernas mais
    //          grossas, ombro um tico menor — menos "torso-slab + pernas-tubo")
    slim: { ombro: 42, peito: 36, cintura: 25, quadril: 31, coxa: 16, braco: 12, anta: 9 },
    standard: { ombro: 47, peito: 42, cintura: 30, quadril: 36, coxa: 19, braco: 14, anta: 10 },
    athletic: { ombro: 54, peito: 47, cintura: 32, quadril: 38, coxa: 21, braco: 16, anta: 11 },
    robust: { ombro: 55, peito: 53, cintura: 44, quadril: 47, coxa: 25, braco: 18, anta: 13 },
    feminino: { ombro: 41, peito: 36, cintura: 26, quadril: 41, coxa: 19, braco: 11, anta: 8 }
  };
  var PROP_V = {
    //           tórax  cintura quadril entrep. joelho   (cintura ALTA = feminino/
    //           atlético; BAIXA/pesada = robusto; pernas + longas = atlético/fem)
    standard: { yPei: 150, yCin: 192, yQua: 220, yEnt: 236, yJoe: 298 },
    slim: { yPei: 150, yCin: 194, yQua: 222, yEnt: 238, yJoe: 301 },
    // torso longo/leve, perna longa
    athletic: { yPei: 147, yCin: 187, yQua: 217, yEnt: 233, yJoe: 301 },
    // cintura alta, V-taper, perna longa
    robust: { yPei: 153, yCin: 201, yQua: 227, yEnt: 243, yJoe: 302 },
    // miolo pesado, cintura BAIXA, perna curta
    feminino: { yPei: 149, yCin: 185, yQua: 221, yEnt: 237, yJoe: 301 }
    // cintura marcada alta, quadril baixo/largo
  };
  function anatomiaCorpo(perfil = "standard") {
    const D = DIMS_CORPO[perfil] ?? DIMS_CORPO.standard;
    const V = PROP_V[perfil] ?? PROP_V.standard;
    return {
      cx: 120,
      ombro: D.ombro,
      peito: D.peito,
      cintura: D.cintura,
      quadril: D.quadril,
      coxa: D.coxa,
      braco: D.braco,
      anta: D.anta,
      armSh: D.ombro - 3,
      armEl: D.cintura + 8,
      armWr: D.quadril + 3,
      yNuc: 104,
      yOmb: 122,
      yPei: V.yPei,
      yCin: V.yCin,
      yQua: V.yQua,
      yEnt: V.yEnt,
      yCot: 200,
      yPun: 250,
      yJoe: V.yJoe,
      yTor: 356,
      yPe: 372
    };
  }
  function perfilCorpoDe(config) {
    const preset = config.corpoV2?.preset ?? config.corpo;
    const porTipo = {
      esbelto: "slim",
      atletico: "athletic",
      robusto: "robust",
      compacto: "standard",
      feminino: "feminino",
      feminina: "feminino",
      soft: "feminino"
    };
    if (preset && porTipo[preset]) return porTipo[preset];
    return "standard";
  }
  function corpoInteiroPremium(p, uid, perfil = "standard") {
    const d = uid + "cpx";
    const D = DIMS_CORPO[perfil] ?? DIMS_CORPO.standard;
    const cx = 120;
    const pele = p.pele;
    const fem = perfil === "feminino";
    const CAL = { claro: "#3d4453", base: "#333a47", escuro: "#272d38", prof: "#1e232c" };
    const SAP = { base: "#20242e", sola: "#111318", luz: "#3a4150" };
    const TOP = { claro: "#5a6474", base: "#4b5464", escuro: "#3a4250" };
    const A = anatomiaCorpo(perfil);
    const { yNuc, yOmb, yPei, yCin, yQua, yEnt, yJoe, yTor, yPe } = A;
    const torso = `M${cx - 12} ${yNuc}
    C ${cx - 15} ${yOmb - 4} ${cx - 24} ${yOmb - 2} ${cx - D.ombro} ${yOmb + 4}
    C ${cx - D.ombro - 2} ${yOmb + 8} ${cx - D.peito - 2} ${yPei - 8} ${cx - D.peito} ${yPei}
    C ${cx - D.peito + 1} ${yPei + 18} ${cx - D.cintura - 2} ${yCin - 10} ${cx - D.cintura} ${yCin}
    C ${cx - D.cintura + 1} ${yCin + 12} ${cx - D.quadril} ${yQua - 12} ${cx - D.quadril} ${yQua}
    C ${cx - D.quadril} ${yQua + 6} ${cx - D.quadril + 4} ${yEnt - 2} ${cx - D.quadril + 8} ${yEnt}
    L ${cx + D.quadril - 8} ${yEnt}
    C ${cx + D.quadril - 4} ${yEnt - 2} ${cx + D.quadril} ${yQua + 6} ${cx + D.quadril} ${yQua}
    C ${cx + D.quadril} ${yQua - 12} ${cx + D.cintura - 1} ${yCin + 12} ${cx + D.cintura} ${yCin}
    C ${cx + D.cintura + 2} ${yCin - 10} ${cx + D.peito - 1} ${yPei + 18} ${cx + D.peito} ${yPei}
    C ${cx + D.peito + 2} ${yPei - 8} ${cx + D.ombro + 2} ${yOmb + 8} ${cx + D.ombro} ${yOmb + 4}
    C ${cx + 24} ${yOmb - 2} ${cx + 15} ${yOmb - 4} ${cx + 12} ${yNuc} Z`;
    const braco = (s, anim) => {
      const b = D.braco, a = D.anta;
      const sx = cx + s * (D.ombro - 3);
      const yCot = 200, yPun = 250;
      const ex = cx + s * (D.cintura + 8);
      const wx = cx + s * (D.quadril + 3);
      const kn = 8.5;
      const fw = (2 * a - 3.4) / 4;
      const flen = [21.8, 23.2, 21.6, 18.8];
      const fcx = (i) => -a + 1.9 + i * (fw + 0.35) + fw / 2;
      const dedos = [0, 1, 2, 3].map((i) => {
        const c = fcx(i), t = flen[i], r = fw / 2;
        return `<path d="M${(c - r).toFixed(2)} ${kn} L ${(c - r).toFixed(2)} ${(t - r).toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${(c + r).toFixed(2)} ${(t - r).toFixed(2)} L ${(c + r).toFixed(2)} ${kn} Z"/>`;
      }).join("");
      const palma = `M${-a} 0 C ${-a - 1.2} 4 ${-a - 0.6} 8 ${-a + 1.2} 11 L ${a - 1.2} 11 C ${a + 0.6} 8 ${a + 1.2} 4 ${a} 0 Z`;
      const polegar = `M${-a + 0.6} 2.4 C ${-a - 4.4} 2.8 ${-a - 5.4} 6.2 ${-a - 3.6} 9.2 C ${-a - 1.8} 11.4 ${-a + 0.8} 9.4 ${-a + 1.2} 7 Z`;
      const mao = `<g transform="translate(${wx} ${yPun}) rotate(${s * 6}) scale(${s} 1)">
      <path d="${polegar}" fill="${pele.base}"/>
      <path d="${palma}" fill="${pele.base}"/>
      <g fill="${pele.base}">${dedos}</g>
      <!-- separações dos dedos (vales suaves) + nó -->
      <path d="M${fcx(0) + fw / 2 + 0.18} ${kn + 1} v 7.5 M${fcx(1) + fw / 2 + 0.18} ${kn + 1} v 8 M${fcx(2) + fw / 2 + 0.18} ${kn + 1} v 6.5" stroke="${alfa(pele.escuro, 0.3)}" stroke-width="0.55" fill="none" stroke-linecap="round"/>
      <path d="M${-a + 2} ${kn + 0.5} q ${a - 2} 1.8 ${2 * a - 4} 0" stroke="${alfa(pele.escuro, 0.2)}" stroke-width="0.7" fill="none"/>
      <!-- luz no dorso -->
      <path d="M${-a + 2} 3 q ${a - 3} -2 ${2 * a - 6} 0" stroke="${alfa("#ffffff", 0.12)}" stroke-width="1.4" fill="none"/></g>`;
      return `<g data-anim="${anim}" style="transform-box: view-box; transform-origin: ${sx}px ${yOmb + 4}px">
      <path d="M${sx - s * 6} ${yOmb - 2}
        C ${sx + s * (b + 5)} ${yOmb + 6} ${sx + s * (b + 4)} ${yOmb + 26} ${ex + s * (b - 3)} ${yCot}
        C ${ex + s * (a + 1)} ${yCot + 16} ${wx + s * (a + 1)} ${yPun - 18} ${wx + s * a} ${yPun}
        C ${wx + s * a} ${yPun + 2} ${wx - s * a} ${yPun + 2} ${wx - s * a} ${yPun}
        C ${wx - s * (a + 1)} ${yPun - 18} ${ex - s * (a - 1)} ${yCot + 16} ${ex - s * (b - 7)} ${yCot}
        C ${ex - s * (b - 5)} ${yCot - 22} ${sx - s * 2} ${yOmb + 18} ${sx - s * 8} ${yOmb + 6} Z" fill="url(#${d}sk)"/>
      ${mao}
      <!-- cotovelo --><path d="M${ex - s * (b - 9)} ${yCot - 3} q ${s * 5} 5 ${s * 1} 13" fill="none" stroke="${alfa(pele.escuro, 0.28)}" stroke-width="1.3"/>
      </g>`;
    };
    const perna = (s) => {
      const hx = cx + s * (D.quadril * 0.5);
      const co = D.coxa, pa = Math.max(8, D.coxa - 4);
      const ax = hx - s * 1;
      return `<path d="M${hx - s * co} ${yEnt - 6}
      C ${hx - s * (co + 1)} ${yQua + 44} ${hx - s * (co - 2)} ${yJoe - 26} ${ax - s * (pa - 1)} ${yJoe}
      C ${ax - s * (pa + 2.5)} ${yJoe + 20} ${ax - s * (pa - 1)} ${yTor - 26} ${ax - s * (pa - 4)} ${yTor - 4}
      L ${ax + s * (pa - 4)} ${yTor - 4}
      C ${ax + s * (pa - 3)} ${yTor - 26} ${ax + s * 5} ${yJoe + 20} ${ax + s * 3} ${yJoe}
      C ${ax + s * 5} ${yJoe - 26} ${hx + s * 3} ${yQua + 44} ${hx + s * 2} ${yEnt - 6} Z" fill="url(#${d}cal)"/>
      <!-- vinco/prega da calça --><path d="M${ax - s * (pa - 5)} ${yJoe + 6} C ${ax - s * (pa - 6)} ${yTor - 40} ${ax - s * (pa - 6)} ${yTor - 20} ${ax - s * (pa - 5)} ${yTor - 8}" fill="none" stroke="${alfa("#000000", 0.18)}" stroke-width="1.4"/>
      <!-- vinco do joelho --><path d="M${ax - s * (pa - 2)} ${yJoe - 2} q ${-s * 5} 6 ${-s * 1} 12" fill="none" stroke="${alfa("#000000", 0.2)}" stroke-width="1.2"/>
      <!-- Golden V3.2 §14: SAPATO FRONTAL estilizado — bico ~5–8° p/ fora,
           JUNTO ao eixo da perna (sem flipper/explosão horizontal). Ordem:
           tornozelo → laterais → toe box arredondado → sola clara. Compacto:
           meia-largura externa ≈ perna, não pa+7. L/R pela direção do bico. -->
      ${(() => {
        const yA = yTor - 4, yS = yPe + 5;
        const inW = pa - 4, outW = pa - 1;
        const drift = s * 3;
        return `<!-- corpo do sapato (frontal, compacto) -->
        <path d="M${ax - s * inW} ${yA}
          C ${ax - s * (inW + 1)} ${yS - 8} ${ax - s * (inW - 1)} ${yS - 1} ${ax - s * (inW - 3)} ${yS}
          L ${ax + drift + s * (outW - 3)} ${yS}
          C ${ax + drift + s * (outW + 1)} ${yS - 1} ${ax + drift + s * (outW + 2)} ${yS - 6} ${ax + drift + s * outW} ${yS - 11}
          C ${ax + s * (outW - 1)} ${yA + 5} ${ax + s * 4} ${yA} ${ax + s * (inW - 6)} ${yA} Z" fill="${SAP.base}"/>
        <!-- sola clara (separa do piso) + sombra da sola -->
        <path d="M${ax - s * (inW - 2)} ${yS - 0.5} L ${ax + drift + s * (outW - 3)} ${yS - 0.5}" fill="none" stroke="${alfa(SAP.luz, 0.85)}" stroke-width="2" stroke-linecap="round"/>
        <path d="M${ax - s * (inW - 2)} ${yS + 1.5} L ${ax + drift + s * (outW - 4)} ${yS + 1.5}" fill="none" stroke="${SAP.sola}" stroke-width="2" stroke-linecap="round"/>
        <!-- peito do pé (instep) em luz + costura do toe box -->
        <path d="M${ax - s * (inW - 4)} ${yA + 2} C ${ax + s * 1} ${yS - 9} ${ax + drift + s * (outW - 6)} ${yS - 8} ${ax + drift + s * (outW - 4)} ${yS - 4}" fill="none" stroke="${alfa(SAP.luz, 0.55)}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M${ax + drift + s * (outW - 7)} ${yS - 7} q ${s * 2} 4 ${s * 0.5} 7" fill="none" stroke="${alfa("#000000", 0.25)}" stroke-width="1"/>`;
      })()}`;
    };
    return `
    <defs>
      <linearGradient id="${d}sk" x1="0.28" y1="0.05" x2="0.72" y2="0.95">
        <stop offset="0" stop-color="${pele.claro}"/><stop offset="0.55" stop-color="${pele.base}"/><stop offset="1" stop-color="${pele.escuro}"/>
      </linearGradient>
      <linearGradient id="${d}cal" x1="0.3" y1="0" x2="0.7" y2="1">
        <stop offset="0" stop-color="${CAL.base}"/><stop offset="0.6" stop-color="${CAL.escuro}"/><stop offset="1" stop-color="${CAL.prof}"/>
      </linearGradient>
      <linearGradient id="${d}top" x1="0.28" y1="0" x2="0.66" y2="1">
        <stop offset="0" stop-color="${TOP.claro}"/><stop offset="0.5" stop-color="${TOP.base}"/><stop offset="1" stop-color="${TOP.escuro}"/>
      </linearGradient>
    </defs>
    <ellipse cx="${cx}" cy="${yPe + 8}" rx="48" ry="8" fill="${alfa("#000000", 0.28)}"/>
    <!-- PESCOÇO (pele) atrás do top -->
    <path d="M${cx - 12} ${yNuc - 16} q ${12} 8 ${24} 0 l 1 14 q ${-13} 8 ${-26} 0 Z" fill="url(#${d}sk)"/>
    <path d="M${cx - 12} ${yNuc - 3} q 12 7 24 0 l 0 4 q -12 7 -24 0 Z" fill="${alfa("#000000", 0.22)}"/>
    ${perna(-1)}${perna(1)}
    <!-- cós/cintura da calça sob o top -->
    <path d="M${cx - D.quadril + 4} ${yQua - 2} C ${cx - 12} ${yEnt - 2} ${cx + 12} ${yEnt - 2} ${cx + D.quadril - 4} ${yQua - 2} L ${cx + D.quadril - 8} ${yEnt + 4} C ${cx + 8} ${yEnt + 10} ${cx - 8} ${yEnt + 10} ${cx - D.quadril + 8} ${yEnt + 4} Z" fill="url(#${d}cal)"/>
    ${braco(-1, "braco-dir")}${braco(1, "braco-esq")}
    <!-- TORSO (top neutro) por cima das raízes dos braços -->
    <path d="${torso}" fill="url(#${d}top)"/>
    <!-- mangas curtas do top (cobrem o ombro nu) -->
    <path d="M${cx - D.ombro + 2} ${yOmb + 2} C ${cx - D.ombro - 4} ${yOmb + 12} ${cx - D.ombro - 3} ${yOmb + 24} ${cx - D.peito + 2} ${yOmb + 30} C ${cx - D.peito - 2} ${yOmb + 16} ${cx - D.ombro - 2} ${yOmb + 6} ${cx - D.ombro + 6} ${yOmb - 2} Z" fill="url(#${d}top)"/>
    <path d="M${cx + D.ombro - 2} ${yOmb + 2} C ${cx + D.ombro + 4} ${yOmb + 12} ${cx + D.ombro + 3} ${yOmb + 24} ${cx + D.peito - 2} ${yOmb + 30} C ${cx + D.peito + 2} ${yOmb + 16} ${cx + D.ombro + 2} ${yOmb + 6} ${cx + D.ombro - 6} ${yOmb - 2} Z" fill="url(#${d}top)"/>
    <!-- VOLUME do top (a forma já lê sem estes overlays) -->
    <path d="M${cx - D.ombro + 6} ${yOmb + 2} C ${cx - 20} ${yOmb - 6} ${cx + 20} ${yOmb - 6} ${cx + D.ombro - 6} ${yOmb + 2}" fill="none" stroke="${alfa("#ffffff", 0.14)}" stroke-width="3" stroke-linecap="round"/>
    <path d="M${cx - D.peito + 6} ${yPei + 2} C ${cx - 10} ${yPei + 14} ${cx + 10} ${yPei + 14} ${cx + D.peito - 6} ${yPei + 2}" fill="none" stroke="${alfa("#000000", 0.14)}" stroke-width="2"/>
    ${fem ? `<path d="M${cx - 15} ${yPei - 2} q 8 12 0 20 M${cx + 15} ${yPei - 2} q -8 12 0 20" fill="none" stroke="${alfa("#000000", 0.12)}" stroke-width="1.6"/>` : `<path d="M${cx} ${yPei + 4} v ${yCin - yPei - 6}" stroke="${alfa("#000000", 0.13)}" stroke-width="1.4"/>`}
    <path d="M${cx - D.cintura + 2} ${yCin} C ${cx - 8} ${yCin + 8} ${cx + 8} ${yCin + 8} ${cx + D.cintura - 2} ${yCin}" fill="none" stroke="${alfa("#000000", 0.12)}" stroke-width="1.6"/>`;
  }

  // public/components/panels/panel-avatar-studio/src/engine/footwear.ts
  function pontosPe(perfil, s) {
    const A = anatomiaCorpo(perfil);
    const hx = A.cx + s * (A.quadril * 0.5);
    const ax = hx - s * 1;
    const pa = Math.max(8, A.coxa - 4);
    return { s, ax, yTornozelo: A.yTor - 4, yChao: A.yPe + 5, larguraPe: pa - 1, drift: s * 3 };
  }
  function fatorSpreadCalcado(perfil) {
    const off = pontosPe(perfil, 1).ax - 120;
    const offStd = pontosPe("standard", 1).ax - 120;
    return offStd === 0 ? 1 : off / offStd;
  }

  // public/components/panels/panel-avatar-studio/src/engine/partes/premium/faces.ts
  var IRIS_PADRAO = "#4a3626";
  function defsPelePremium(u, hexPele) {
    const t = tintaPremium(hexPele);
    return `
    <radialGradient id="${u}pxpele" cx="0.47" cy="0.46" r="0.96">
      <stop offset="0" stop-color="${t.claro}"/>
      <stop offset="0.55" stop-color="${t.base}"/>
      <stop offset="0.85" stop-color="${t.base}"/>
      <stop offset="1" stop-color="${t.meio}"/>
    </radialGradient>
    <linearGradient id="${u}pxpesc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.escuro}"/>
      <stop offset="1" stop-color="${t.base}"/>
    </linearGradient>`;
  }
  function orelhaPremium(x, t, dir) {
    const y = G.orelhaY;
    return `
    <ellipse cx="${x}" cy="${y}" rx="9.5" ry="13.5" fill="${t.base}"/>
    <!-- concha (sombra funda central) -->
    <ellipse cx="${x + 1.5 * dir}" cy="${y + 1.5}" rx="3.2" ry="5.4" fill="${alfa(t.profundo, 0.5)}"/>
    <!-- anti-hélice (crus interno em C, entre concha e hélice) -->
    <path d="M${x + 2 * dir} ${y - 7} a 6 9 0 0 ${dir > 0 ? 0 : 1} ${-1.5 * dir} 15" fill="none" stroke="${alfa(t.escuro, 0.5)}" stroke-width="1.6" stroke-linecap="round"/>
    <!-- hélice (borda externa enrolada) -->
    <path d="M${x + 5.5 * dir} ${y - 10} a 9 13 0 0 ${dir > 0 ? 0 : 1} ${-3 * dir} 23" fill="none" stroke="${alfa(t.escuro, 0.42)}" stroke-width="2" stroke-linecap="round"/>
    <!-- lóbulo (base arredondada) -->
    <path d="M${x - 3 * dir} ${y + 9.5} q ${3.5 * dir} 4.5 ${6 * dir} 0.5" fill="none" stroke="${alfa(t.escuro, 0.3)}" stroke-width="1.4" stroke-linecap="round"/>
    <!-- luz na hélice superior -->
    <path d="M${x - 3.5 * dir} ${y - 10} a 9 12 0 0 1 ${6 * dir} -2" fill="none" stroke="${alfa("#ffffff", 0.24)}" stroke-width="1.4" stroke-linecap="round"/>`;
  }
  function narizPremium(t, estilo, comprimento = 0) {
    const yB = 132 + comprimento;
    const yTip = yB - 3;
    const yBridge = 110;
    const cfg = {
      reto: { larg: 6, sombra: 0.2 },
      largo: { larg: 8.4, sombra: 0.22 },
      fino: { larg: 4.6, sombra: 0.24 },
      arrebitado: { larg: 6, sombra: 0.18 },
      aquilino: { larg: 5.6, sombra: 0.26 },
      curto: { larg: 5.6, sombra: 0.18 }
    };
    const { larg, sombra } = cfg[estilo] ?? cfg.reto;
    const bump = estilo === "aquilino" ? -1.6 : estilo === "arrebitado" ? 1.6 : 0;
    const planoSombra = `M122 ${yBridge} C ${124 + bump} ${yBridge + 12} ${121 + larg * 0.55} ${yTip - 3} ${120 + larg} ${yTip} C ${120 + larg + 1.2} ${yB} ${118 + larg} ${yB + 2.4} ${119} ${yB + 2} C ${120.5} ${yTip} ${121.5} ${yBridge + 13} ${122} ${yBridge} Z`;
    return `
    <path d="${planoSombra}" fill="${alfa(t.escuro, sombra)}"/>
    <!-- BALL da ponta: highlight COMPACTO e arredondado (não coluna) -->
    <path d="M${120 - larg * 0.68} ${yTip + 0.4} Q ${120} ${yTip - 2.4} ${120 + larg * 0.68} ${yTip + 0.4} Q ${120} ${yTip + 3.4} ${120 - larg * 0.68} ${yTip + 0.4} Z" fill="${alfa(t.claro, 0.2)}"/>
    <!-- sombra do septo/underside SOB a ponta -->
    <path d="M${120 - larg * 0.82} ${yB} Q 120 ${yB + 3.6} ${120 + larg * 0.82} ${yB}" fill="none" stroke="${alfa(t.profundo, 0.3)}" stroke-width="1.5" stroke-linecap="round"/>
    <!-- asas (alar) como formas + narinas SOB elas -->
    <path d="M${120 - larg} ${yB - 1.4} q -2.2 3 -0.4 4.6 q 1.9 1.1 2.9 -0.7" fill="${alfa(t.meio, 0.34)}"/>
    <path d="M${120 + larg} ${yB - 1.4} q 2.2 3 0.4 4.6 q -1.9 1.1 -2.9 -0.7" fill="${alfa(t.meio, 0.34)}"/>
    <ellipse cx="${120 - larg + 1.5}" cy="${yB + 2.3}" rx="1.3" ry="0.85" fill="${alfa(t.profundo, 0.5)}" transform="rotate(-16 ${120 - larg + 1.5} ${yB + 2.3})"/>
    <ellipse cx="${120 + larg - 1.5}" cy="${yB + 2.3}" rx="1.3" ry="0.85" fill="${alfa(t.profundo, 0.5)}" transform="rotate(16 ${120 + larg - 1.5} ${yB + 2.3})"/>`;
  }
  var NARIZ_DEFAULT_DA_BASE = {
    bas_px_oval: { estilo: "reto", comprimento: 0 },
    bas_px_angular: { estilo: "aquilino", comprimento: 1 },
    bas_px_coracao: { estilo: "arrebitado", comprimento: -2 },
    bas_px_quadrada: { estilo: "largo", comprimento: 1 },
    bas_px_redonda: { estilo: "curto", comprimento: -1 },
    bas_px_alongada: { estilo: "fino", comprimento: 4 },
    bas_px_diamante: { estilo: "fino", comprimento: 1 },
    bas_px_suave: { estilo: "curto", comprimento: 0 }
  };
  function narizPremiumDefaultDaBase(baseId, peleBaseHex) {
    const d = NARIZ_DEFAULT_DA_BASE[baseId] ?? NARIZ_DEFAULT_DA_BASE.bas_px_oval;
    return narizPremium(tintaPremium(peleBaseHex), d.estilo, d.comprimento);
  }
  function basePremium(perfil) {
    return (p, u) => {
      const t = tintaPremium(p.pele.base);
      const cid = `${u}pxclip`;
      return `
      <defs>${defsPelePremium(u, p.pele.base)}
        <clipPath id="${cid}"><path d="${perfil.cabeca}"/></clipPath>
        <!-- Golden V3.1: sombreamento por GRADIENTES (transições naturais, não
             tiras chapadas): núcleo à direita, luz superior-esquerda -->
        <linearGradient id="${u}pxcore" x1="0.42" y1="0" x2="1" y2="0.1">
          <stop offset="0" stop-color="${alfa(t.escuro, 0)}"/><stop offset="0.6" stop-color="${alfa(t.escuro, 0.1)}"/><stop offset="1" stop-color="${alfa(t.escuro, 0.22)}"/></linearGradient>
        <radialGradient id="${u}pxlit" cx="0.38" cy="0.34" r="0.5">
          <stop offset="0" stop-color="${alfa("#ffffff", (perfil.testa.op ?? 0.1) + 0.04)}"/><stop offset="0.7" stop-color="${alfa("#ffffff", 0.03)}"/><stop offset="1" stop-color="${alfa("#ffffff", 0)}"/></radialGradient>
      </defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pxpesc)"/>
      <path d="M103 176 q 17 6 34 0 l -2 6 q -15 5 -30 0 z" fill="${alfa(t.profundo, 0.16)}"/>
      <path d="${perfil.cabeca}" fill="url(#${u}pxpele)"/>
      <g clip-path="url(#${cid})">
        <!-- NÚCLEO (lado direito) — gradiente suave, sem borda de tira -->
        <rect x="60" y="40" width="150" height="150" fill="url(#${u}pxcore)"/>
        <!-- LUZ do plano frontal (testa→maçã esq) — gradiente radial suave -->
        <rect x="60" y="40" width="150" height="130" fill="url(#${u}pxlit)"/>
        <!-- 1 sombra ampla sob a maçã/mandíbula (una, grande, suave) -->
        <path d="M84 118 C 92 140 104 156 120 160 C 136 156 148 140 156 118 C 150 150 138 168 120 170 C 102 168 90 150 84 118 Z" fill="${alfa(t.escuro, 0.07)}"/>
        <!-- órbita (socket) suave -->
        <path d="M88 100 C 104 95 136 95 152 100 C 146 108 136 105 120 104 C 104 105 94 108 88 100 Z" fill="${alfa(t.escuro, 0.08)}"/>
        <!-- oclusão sob o queixo -->
        <path d="M101 158 C 111 168 129 168 139 158 C 137 170 103 170 101 158 Z" fill="${alfa(t.profundo, 0.11)}"/>
      </g>
      ${orelhaPremium(70, t, 1)}${orelhaPremium(170, t, -1)}
      <!-- Golden V3.2 §5: a BASE NÃO desenha mais nariz (fonte única). O nariz
           vem do slot nar_* ou do default por-base (narizPremiumDefaultDaBase),
           injetado no render.ts. Fim da cápsula/nariz duplicado. -->
      <!-- §6.3: jawline quase imperceptível (a mandíbula vem de silhueta/
           valor/oclusão, não de uma linha contornando) -->
      <path d="${perfil.jawline}" fill="none" stroke="${alfa(t.escuro, 0.12)}" stroke-width="1.5" stroke-linecap="round"/>
      ${perfil.queixo ? perfil.queixo(t) : ""}
      ${perfil.extras ? perfil.extras(t) : ""}`;
    };
  }
  var CAB_OVAL = "M120 49 a 50 57 0 0 1 50 57 a 50 57 0 0 1 -100 0 a 50 57 0 0 1 50 -57";
  var CAB_ANGULAR = "M120 49 c 30 0 50 24 50 55 c 0 22 -10 42 -28 53 l -22 10 l -22 -10 c -18 -11 -28 -31 -28 -53 c 0 -31 20 -55 50 -55";
  var CAB_CORACAO = "M120 49 c 33 0 54 22 52 52 c -2 24 -22 44 -36 54 l -16 13 l -16 -13 c -14 -10 -34 -30 -36 -54 c -2 -30 19 -52 52 -52";
  var CAB_QUADRADA = "M120 50 c 29 0 49 19 49 48 l 0 22 c 0 22 -16 40 -37 45 l -12 3 l -12 -3 c -21 -5 -37 -23 -37 -45 l 0 -22 c 0 -29 20 -48 49 -48";
  var CAB_REDONDA = "M120 52 a 54 54 0 0 1 54 54 a 54 54 0 0 1 -108 0 a 54 54 0 0 1 54 -52";
  var CAB_ALONGADA = "M120 47 a 43 62 0 0 1 43 62 a 43 62 0 0 1 -86 0 a 43 62 0 0 1 43 -62";
  var CAB_DIAMANTE = "M120 49 c 24 3 40 20 44 44 c 4 24 -14 50 -30 62 l -14 12 l -14 -12 c -16 -12 -34 -38 -30 -62 c 4 -24 20 -41 44 -44";
  var CAB_SUAVE = "M120 50 a 49 56 0 0 1 49 56 c 0 26 -18 48 -38 55 l -11 4 l -11 -4 c -20 -7 -38 -29 -38 -55 a 49 56 0 0 1 49 -56";
  var comumBase = { categoria: "base", raridade: "raro", usaCores: ["pele"], acabamento: "premium" };
  var BASES_PREMIUM = [
    {
      ...comumBase,
      id: "bas_px_oval",
      nome: "Oval Premium",
      tema: "clássico",
      descricao: "Estrutura oval clássica com volume real de estúdio.",
      render: basePremium({
        cabeca: CAB_OVAL,
        jawline: "M92 148 q 28 22 56 0",
        nariz: { estilo: "reto" },
        macas: { y: 127, rx: 10, forca: 1 },
        arcada: { peso: 0.2 },
        testa: { cy: 78, rx: 22, ry: 9 },
        extras: (t) => `<path d="M108 166 q 12 5 24 0" stroke="${alfa(t.escuro, 0.22)}" stroke-width="2" stroke-linecap="round" fill="none"/>`
      })
    },
    {
      ...comumBase,
      id: "bas_px_angular",
      nome: "Angular Premium",
      tema: "clássico",
      descricao: "Maxilar duro, queixo com fenda, arcada pesada — protagonista.",
      render: basePremium({
        cabeca: CAB_ANGULAR,
        jawline: "M88 140 l 16 20 l 16 8 l 16 -8 l 16 -20",
        maxilar: "M88 138 l 15 20 l -4 3 q -9 -10 -13 -19 z M152 138 l -15 20 l 4 3 q 9 -10 13 -19 z",
        nariz: { estilo: "aquilino", comprimento: 1 },
        macas: { y: 124, rx: 8, forca: 0.7 },
        arcada: { peso: 0.34, quebra: 1 },
        testa: { cy: 76, rx: 20, ry: 8, op: 0.08 },
        queixo: (t) => `
        <path d="M108 160 q 12 8 24 0 l -3 8 q -9 5 -18 0 z" fill="${alfa(t.meio, 0.45)}"/>
        <path d="M120 163 l 0 6" stroke="${alfa(t.escuro, 0.5)}" stroke-width="2" stroke-linecap="round"/>
        <path d="M112 158 q 8 4 16 0" stroke="${alfa("#ffffff", 0.18)}" stroke-width="1.8" stroke-linecap="round" fill="none"/>`
      })
    },
    {
      ...comumBase,
      id: "bas_px_coracao",
      nome: "Coração Premium",
      tema: "clássico",
      descricao: "Testa ampla, maçãs altas e queixo delicado em ponta.",
      render: basePremium({
        cabeca: CAB_CORACAO,
        jawline: "M96 142 q 24 24 48 0",
        nariz: { estilo: "arrebitado", comprimento: -2 },
        macas: { y: 122, rx: 11, forca: 1.15 },
        arcada: { peso: 0.16 },
        testa: { cy: 82, rx: 30, ry: 12, op: 0.14 },
        queixo: (t) => `
        <path d="M113 157 q 7 7 14 0 q -5 8 -7 9 q -2 -1 -7 -9" fill="${alfa(t.meio, 0.26)}"/>
        <ellipse cx="120" cy="155" rx="7" ry="3" fill="${alfa("#ffffff", 0.16)}"/>`
      })
    },
    {
      ...comumBase,
      id: "bas_px_quadrada",
      nome: "Quadrada Premium",
      tema: "executivo",
      descricao: "Mandíbula larga, queixo chato, presença de capa de revista.",
      render: basePremium({
        cabeca: CAB_QUADRADA,
        jawline: "M84 138 l 8 20 l 28 12 l 28 -12 l 8 -20",
        maxilar: "M84 136 l 8 20 l -5 2 q -5 -12 -6 -21 z M156 136 l -8 20 l 5 2 q 5 -12 6 -21 z",
        nariz: { estilo: "largo", comprimento: 1 },
        macas: { y: 128, rx: 9, forca: 0.8 },
        arcada: { peso: 0.3 },
        testa: { cy: 74, rx: 24, ry: 8, op: 0.09 },
        queixo: (t) => `
        <path d="M106 162 h 28 l -4 7 h -20 z" fill="${alfa(t.meio, 0.42)}"/>
        <path d="M108 160 h 24" stroke="${alfa("#ffffff", 0.16)}" stroke-width="1.8" stroke-linecap="round"/>`
      })
    },
    {
      ...comumBase,
      id: "bas_px_redonda",
      nome: "Redonda Premium",
      tema: "casual",
      descricao: "Bochechas cheias, queixo curto, simpatia imediata.",
      render: basePremium({
        cabeca: CAB_REDONDA,
        jawline: "M94 150 q 26 16 52 0",
        nariz: { estilo: "curto", comprimento: -1 },
        macas: { y: 131, rx: 13, forca: 1.5 },
        arcada: { peso: 0.15 },
        testa: { cy: 80, rx: 24, ry: 10 },
        queixo: (t) => `
        <ellipse cx="120" cy="153" rx="14" ry="5" fill="${alfa(t.profundo, 0.2)}"/>
        <ellipse cx="120" cy="150" rx="8" ry="3" fill="${alfa("#ffffff", 0.16)}"/>
        <ellipse cx="97" cy="133" rx="8" ry="5.4" fill="${alfa(t.claro, 0.3)}"/>
        <ellipse cx="143" cy="133" rx="8" ry="5.4" fill="${alfa(t.claro, 0.24)}"/>`
      })
    },
    {
      ...comumBase,
      id: "bas_px_alongada",
      nome: "Alongada Premium",
      tema: "clássico",
      descricao: "Rosto esguio e vertical, nariz longo, maçãs escavadas.",
      render: basePremium({
        cabeca: CAB_ALONGADA,
        jawline: "M98 152 q 22 18 44 0",
        nariz: { estilo: "fino", comprimento: 4 },
        macas: { y: 124, rx: 8, forca: 0.9 },
        arcada: { peso: 0.24 },
        testa: { cy: 74, rx: 17, ry: 11, op: 0.11 },
        queixo: (t) => `
        <path d="M112 159 q 8 6 16 0 q -6 8 -8 9 q -2 -1 -8 -9" fill="${alfa(t.meio, 0.28)}"/>
        <ellipse cx="120" cy="158" rx="6" ry="2.6" fill="${alfa("#ffffff", 0.14)}"/>`,
        extras: (t) => `<path d="M92 118 q 3 12 9 17 M148 118 q -3 12 -9 17" stroke="${alfa(t.meio, 0.5)}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`
      })
    },
    {
      ...comumBase,
      id: "bas_px_diamante",
      nome: "Diamante Premium",
      tema: "clássico",
      raridade: "epico",
      descricao: "Têmporas recuadas, zigomático saliente, queixo em lâmina.",
      render: basePremium({
        cabeca: CAB_DIAMANTE,
        jawline: "M94 138 q 26 30 52 0",
        maxilar: "M94 136 q 12 18 22 24 l -3 4 q -12 -8 -22 -24 z M146 136 q -12 18 -22 24 l 3 4 q 12 -8 22 -24 z",
        nariz: { estilo: "fino", comprimento: 1 },
        macas: { y: 120, rx: 10, forca: 1.2 },
        arcada: { peso: 0.26 },
        testa: { cy: 72, rx: 16, ry: 8, op: 0.1 },
        queixo: (t) => `
        <path d="M114 156 q 6 6 12 0 q -4 10 -6 12 q -2 -2 -6 -12" fill="${alfa(t.meio, 0.32)}"/>
        <ellipse cx="120" cy="155" rx="5.4" ry="2.4" fill="${alfa("#ffffff", 0.14)}"/>`,
        extras: (t) => `
        <path d="M90 116 l 10 9 M150 116 l -10 9" stroke="${alfa("#ffffff", 0.3)}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M96 128 q 6 6 14 8 M144 128 q -6 6 -14 8" stroke="${alfa(t.escuro, 0.2)}" stroke-width="1.8" stroke-linecap="round" fill="none"/>`
      })
    },
    {
      ...comumBase,
      id: "bas_px_suave",
      nome: "Suave Premium",
      tema: "casual",
      descricao: "Contornos difusos e sombreamento sedoso — nada de arestas.",
      render: basePremium({
        cabeca: CAB_SUAVE,
        jawline: "M96 148 q 24 18 48 0",
        nariz: { estilo: "curto" },
        macas: { y: 129, rx: 11, forca: 1.05 },
        arcada: { peso: 0.13 },
        testa: { cy: 80, rx: 26, ry: 11 },
        extras: (t) => `<ellipse cx="120" cy="142" rx="30" ry="10" fill="${alfa(t.claro, 0.1)}"/>`
      })
    }
  ];
  function olhoPremium(x, y, iris, u, lado, o = {}) {
    const hu = (o.ry ?? 6.4) - (o.palpebra ?? 0);
    const hl = Math.max(3, hu * 0.55);
    const W = 9.6;
    const tilt = o.tilt ?? 0;
    const irisR = o.irisR ?? 4.3;
    const dir = lado === "L" ? -1 : 1;
    const clip = `${u}eye${lado}`;
    const xi = x + W * dir, xo = x - W * dir;
    const abertura = `M${xi} ${y + 1} C ${x + W * 0.4 * dir} ${y - hu} ${x - W * 0.4 * dir} ${y - hu} ${xo} ${y - 0.5} C ${x - W * 0.5 * dir} ${y + hl} ${x + W * 0.5 * dir} ${y + hl} ${xi} ${y + 1} Z`;
    const iy = y - 1.6;
    return `
    <g transform="rotate(${tilt} ${x} ${y})">
      <defs><clipPath id="${clip}"><path d="${abertura}"/></clipPath></defs>
      <!-- sombra da órbita (acima da pálpebra) -->
      <path d="M${xo} ${y - 1} C ${x - W * 0.4 * dir} ${y - hu - 3} ${x + W * 0.4 * dir} ${y - hu - 3} ${xi} ${y - 0.5}" fill="none" stroke="${alfa("#1a120a", 0.14)}" stroke-width="3.2" stroke-linecap="round"/>
      <!-- globo (esclera levemente sombreada em cima) -->
      <path d="${abertura}" fill="#f6f1e8"/>
      <g clip-path="url(#${clip})">
        <rect x="${x - 12}" y="${y - hu - 2}" width="24" height="6" fill="${alfa("#c9b8a4", 0.4)}"/>
        <circle cx="${x}" cy="${iy}" r="${irisR}" fill="${iris.base}"/>
        <path d="M${x - irisR} ${iy} a ${irisR} ${irisR} 0 0 1 ${2 * irisR} 0 Z" fill="${alfa(iris.escuro, 0.55)}"/>
        <circle cx="${x}" cy="${iy}" r="${irisR}" fill="none" stroke="${alfa("#0d0906", 0.5)}" stroke-width="0.9"/>
        <circle cx="${x}" cy="${iy}" r="2" fill="#0d0906"/>
        <circle id="${u}pxcatch${lado}" cx="${x + 1.6}" cy="${iy - 1.8}" r="1.5" fill="#ffffff" opacity="0.95"/>
      </g>
      <!-- pálpebra superior (linha grossa) + vinco -->
      <path d="M${xi} ${y + 1} C ${x + W * 0.4 * dir} ${y - hu} ${x - W * 0.4 * dir} ${y - hu} ${xo} ${y - 0.5}" fill="none" stroke="${alfa("#141008", 0.62)}" stroke-width="1.9" stroke-linecap="round"/>
      <path d="M${x + W * 0.7 * dir} ${y - hu * 0.7} C ${x + W * 0.3 * dir} ${y - hu - 1.6} ${x - W * 0.3 * dir} ${y - hu - 1.6} ${x - W * 0.8 * dir} ${y - hu * 0.55}" fill="none" stroke="${alfa("#141008", 0.16)}" stroke-width="1" stroke-linecap="round"/>
      <!-- cílio no canto externo -->
      <path d="M${xo} ${y - 0.5} l ${-2.6 * dir} -2 M${xo + 1 * dir} ${y + 0.4} l ${-2.8 * dir} -1" stroke="${alfa("#141008", 0.5)}" stroke-width="1.1" stroke-linecap="round"/>
      <!-- pálpebra inferior (sutil) + canto lacrimal interno -->
      <path d="M${xo} ${y - 0.5} C ${x - W * 0.5 * dir} ${y + hl} ${x + W * 0.5 * dir} ${y + hl} ${xi} ${y + 1}" fill="none" stroke="${alfa("#8a6a52", 0.4)}" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M${xi} ${y + 1} l ${1.6 * dir} -1.2" stroke="${alfa("#c96b5a", 0.5)}" stroke-width="1.4" stroke-linecap="round"/>
    </g>`;
  }
  function parOlhos(o = {}, oDir = null) {
    return (p, u) => {
      const iris = p.iris ?? tinta(IRIS_PADRAO);
      return olhoPremium(100, 108, iris, u, "L", o) + olhoPremium(140, 108, iris, u, "R", { ...o, ...oDir ?? {}, tilt: -(oDir?.tilt ?? o.tilt ?? 0) });
    };
  }
  var OLHOS_PREMIUM = [
    { id: "olh_px_confiante", categoria: "olhos", nome: "Confiante Premium", descricao: "Olhar direto com catchlight duplo de estúdio.", raridade: "raro", tema: "clássico", usaCores: ["pele"], acabamento: "premium", render: parOlhos({}) },
    { id: "olh_px_sereno", categoria: "olhos", nome: "Sereno Premium", descricao: "Pálpebra baixa e calma de quem já resolveu tudo.", raridade: "raro", tema: "clássico", usaCores: ["pele"], acabamento: "premium", render: parOlhos({ ry: 6.6, palpebra: -1.2 }) },
    { id: "olh_px_focado", categoria: "olhos", nome: "Focado Premium", descricao: "Fenda estreita, alvo travado.", raridade: "raro", tema: "gamer", usaCores: ["pele"], acabamento: "premium", render: parOlhos({ ry: 5.8, irisR: 5 }) },
    { id: "olh_px_amendoado", categoria: "olhos", nome: "Amendoado Premium", descricao: "Cantos elevados com inclinação elegante.", raridade: "raro", tema: "clássico", usaCores: ["pele"], acabamento: "premium", render: parOlhos({ tilt: 6, ry: 7 }) },
    { id: "olh_px_intenso", categoria: "olhos", nome: "Intenso Premium", descricao: "Íris grande, presença magnética.", raridade: "epico", tema: "clássico", usaCores: ["pele"], acabamento: "premium", render: parOlhos({ ry: 8.6, irisR: 6.2 }) },
    { id: "olh_px_gentil", categoria: "olhos", nome: "Gentil Premium", descricao: "Curva caída e doçura genuína.", raridade: "raro", tema: "casual", usaCores: ["pele"], acabamento: "premium", render: parOlhos({ tilt: -5, ry: 7.4 }) },
    { id: "olh_px_felino", categoria: "olhos", nome: "Felino Premium", descricao: "Inclinação alta e brilho de caçador.", raridade: "epico", tema: "místico", usaCores: ["pele"], acabamento: "premium", render: parOlhos({ tilt: 9, ry: 6.4, irisR: 5.8 }) },
    { id: "olh_px_determinado", categoria: "olhos", nome: "Determinado Premium", descricao: "Meta na mira, pálpebra firme.", raridade: "raro", tema: "executivo", usaCores: ["pele"], acabamento: "premium", render: parOlhos({ ry: 6.8, palpebra: 1 }) }
  ];
  function labios(dSuperior, dInferior, dLuz, extra = "") {
    return (p) => {
      const t = tintaPremium(p.pele.base);
      const labio = tintaPremium(p.labios?.base ?? "#8a4a3e");
      return `
      <path d="${dSuperior}" fill="${labio.escuro}"/>
      <path d="${dInferior}" fill="${labio.base}"/>
      <path d="${dLuz}" fill="${alfa("#ffffff", 0.22)}"/>
      <!-- oclusão (a fenda entre os lábios — a "boca") -->
      <path d="M107 145.4 q 13 2.6 26 0" stroke="${alfa("#38201a", 0.6)}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <!-- comissuras (cantos, pequena sombra) -->
      <path d="M106.4 145.2 q -1.4 0.6 -2 -0.6 M133.6 145.2 q 1.4 0.6 2 -0.6" stroke="${alfa("#38201a", 0.5)}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
      <!-- sombra sob o lábio inferior (volume, não sorriso decorativo) -->
      <path d="M111 151.2 q 9 2.4 18 0" stroke="${alfa(t.escuro, 0.16)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      ${extra}`;
    };
  }
  var BOCAS_PREMIUM = [
    { id: "boc_px_sorriso", categoria: "boca", nome: "Sorriso Premium", descricao: "Curva segura com lábio em dois tons.", raridade: "raro", tema: "clássico", usaCores: ["pele"], acabamento: "premium", render: labios("M104 142 q 16 6 32 0 q -16 8 -32 0", "M106 146 q 14 9 28 0 q -14 6 -28 0", "M112 149 q 8 3 16 0 q -8 2 -16 0") },
    { id: "boc_px_neutra", categoria: "boca", nome: "Neutra Premium", descricao: "Serenidade com volume real.", raridade: "raro", tema: "executivo", usaCores: ["pele"], acabamento: "premium", render: labios("M106 143 h 28 q -14 4 -28 0", "M107 146 q 13 5 26 0 q -13 4 -26 0", "M113 147.5 q 7 2 14 0 q -7 1.6 -14 0") },
    { id: "boc_px_meio", categoria: "boca", nome: "Meio Sorriso Premium", descricao: "Canto erguido, plano em andamento.", raridade: "raro", tema: "casual", usaCores: ["pele"], acabamento: "premium", render: labios("M105 144 q 16 2 31 -3 q -14 8 -31 3", "M107 146 q 14 7 27 -1 q -12 6 -27 1", "M112 148 q 8 2.6 15 -0.6 q -7 2 -15 0.6") },
    { id: "boc_px_seria", categoria: "boca", nome: "Séria Premium", descricao: "Linha firme de decisão tomada.", raridade: "raro", tema: "executivo", usaCores: ["pele"], acabamento: "premium", render: labios("M105 144 q 15 -2 30 0 q -15 3 -30 0", "M107 146.6 q 13 3.4 26 0 q -13 3 -26 0", "M114 147.4 q 6 1.4 12 0 q -6 1.2 -12 0") },
    { id: "boc_px_riso", categoria: "boca", nome: "Riso Premium", descricao: "Sorriso aberto com dentes e brilho.", raridade: "epico", tema: "casual", usaCores: ["pele"], acabamento: "premium", render: labios("M102 141 q 18 20 36 0 q -18 9 -36 0", "M105 143 q 15 6 30 0 l -2.4 4.6 q -12 4.6 -25.2 0 z", "M109 143.6 q 11 3.6 22 0 l -0.8 1.8 q -10 3 -20.4 0 z", '<path d="M108 152 q 12 6 24 0" fill="none" stroke="rgba(20,12,8,0.5)" stroke-width="1.6" stroke-linecap="round"/>') },
    { id: "boc_px_pensativa", categoria: "boca", nome: "Pensativa Premium", descricao: "Deslocada de lado, avaliando a jogada.", raridade: "raro", tema: "clássico", usaCores: ["pele"], acabamento: "premium", render: labios("M109 144 q 14 -1 26 2 q -13 5 -26 -2", "M111 147 q 12 5 22 0.6 q -11 4 -22 -0.6", "M116 148 q 6 2 12 0.4 q -6 1.6 -12 -0.4") },
    { id: "boc_px_suave", categoria: "boca", nome: "Suave Premium", descricao: "Quase-sorriso com luz no lábio inferior.", raridade: "raro", tema: "casual", usaCores: ["pele"], acabamento: "premium", render: labios("M106 143.5 q 14 4 28 0 q -14 6 -28 0", "M108 146.5 q 12 7 24 0 q -12 5 -24 0", "M113 148.5 q 7 2.6 14 0 q -7 2 -14 0") },
    { id: "boc_px_determinada", categoria: "boca", nome: "Determinada Premium", descricao: "Pressão sutil de quem não recua.", raridade: "raro", tema: "gamer", usaCores: ["pele"], acabamento: "premium", render: labios("M106 144 q 15 -3 29 -0.6 q -15 4 -29 0.6", "M108 146 q 13 4 25 -0.6 q -12 4 -25 0.6", "M115 147 q 6 1.4 11 -0.2 q -5 1.4 -11 0.2") }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/camadas.ts
  var CAMADAS_Z = {
    // onda 1415 (#191): roupa INFERIOR atrás da roupa de cima (a barra da
    // camisa cobre o cós) — só desenha no corpo inteiro (renderCorpo)
    roupa_inferior: 8,
    // bloco clássico (AS3/AS4) — decisão #41
    roupa: 10,
    roupa_sobre: 20,
    // §3393 (decisão #95): sobrepeça por cima da roupa
    emblema: 30,
    // onda 1414 (#162/#186): camadas FACIAIS novas nos vãos — barba sob a
    // boca (a boca fica visível dentro da barba), nariz sobre a boca e sob
    // os olhos, sobrancelha sobre os olhos e sob o cabelo (franja cobre)
    barba: 34,
    boca: 40,
    nariz: 44,
    olhos: 50,
    sobrancelha: 54,
    cabelo: 60,
    acessorio: 70,
    // chave legada (configs antigos sem validar)
    acessorio_pescoco: 80,
    acessorio_cabeca: 90,
    acessorio_rosto: 100,
    // onda 1301+ (decisão #140, as6.acess_v2): slots finos aditivos
    acessorio_costas: 110,
    acessorio_olhos: 120,
    acessorio_orelha: 130,
    acessorio_flutuante: 140,
    acessorio_companheiro: 150,
    // onda 1404 (decisão #154, as6.slots_corpo): corporais (forward-compat
    // no busto — render vazio por contrato; só renderCorpo desenha)
    acessorio_pernas: 160,
    acessorio_pes: 170,
    acessorio_cintura: 180,
    acessorio_pulso_e: 190,
    acessorio_pulso_d: 200,
    acessorio_mao_e: 210,
    acessorio_mao_d: 220
  };
  var ORDEM_CAMADAS = Object.entries(CAMADAS_Z).sort((a, b) => a[1] - b[1]).map(([id]) => id);

  // public/components/panels/panel-avatar-studio/src/engine/compat-cabelo.ts
  var PERFIL_HEADWEAR = {
    // abertos: apoiam sem cobrir a calota (tiaras, chifres, coroa, fones)
    ace_fone: "aberto",
    ace_headset: "aberto",
    ace_coroa: "aberto",
    ace_chifres_oni: "aberto",
    ace_tiara_led: "aberto",
    // justos: cobrem a calota (bonés, boinas, gorros, chapéus)
    ace_bone: "justo",
    ace_boina: "justo",
    ace_gorro_natal: "justo",
    ace_chapeu_mago: "justo",
    ace_chapeu_bruxa: "justo",
    // fechados: envolvem a cabeça inteira
    ace_viseira_vr: "fechado"
  };
  var PERFIL_CABELO_PX = {
    cab_px_curto: { altura: "baixo", comprimento: "curto" },
    cab_px_franja: { altura: "medio", comprimento: "curto" },
    cab_px_lateral: { altura: "medio", comprimento: "curto" },
    cab_px_undercut: { altura: "baixo", comprimento: "curto" },
    cab_px_longo_liso: { altura: "medio", comprimento: "longo" },
    cab_px_ondulado: { altura: "medio", comprimento: "longo" },
    cab_px_rabo: { altura: "medio", comprimento: "longo" },
    cab_px_coque: { altura: "alto", comprimento: "medio" },
    cab_px_afro: { altura: "alto", comprimento: "medio" },
    cab_px_cacheado: { altura: "alto", comprimento: "medio" }
  };
  function resolverEstadoCabelo(cabeloId, headwearId) {
    if (!cabeloId || cabeloId === "nenhum") return "hidden";
    if (!headwearId || headwearId === "nenhum") return "visible";
    const chapeu = PERFIL_HEADWEAR[headwearId] ?? "aberto";
    const cab = PERFIL_CABELO_PX[cabeloId] ?? { altura: "medio", comprimento: "medio" };
    if (chapeu === "aberto") return "visible";
    if (chapeu === "fechado") return cab.comprimento === "longo" ? "variant" : "hidden";
    if (cab.comprimento === "longo") return "variant";
    return cab.altura === "baixo" ? "visible" : "masked";
  }
  function profundidadeRecorte(estado, encaixe) {
    const manual = typeof encaixe === "number" && encaixe > 0 ? Math.min(1, encaixe) * 22 : 0;
    if (estado === "masked") return Math.max(14, manual);
    if (estado === "variant") return Math.max(8, manual);
    return manual;
  }

  // public/components/panels/panel-avatar-studio/src/engine/compat-rosto.ts
  var MASCARAS_ROSTO_FECHADAS = [
    "ace_mascara_neon",
    "ace_mascara_oni",
    "ace_mascara_kitsune",
    "ace_mascara_teatro",
    "ace_mascara_hoquei"
  ];
  var PESCOCO_VOLUMOSO = ["ace_cachecol", "ace_lenco_bandana"];
  var PERFIL_BARBA = {
    brb_rala: "curta",
    brb_aparada: "curta",
    brb_bigode: "curta",
    brb_cavanhaque: "media",
    brb_costeleta: "curta",
    brb_cheia: "media",
    brb_longa: "longa",
    brb_lenhador: "longa"
  };
  var FAMILIA_FACE = {
    bas_px_oval: "suave",
    bas_px_alongada: "suave",
    bas_px_suave: "suave",
    bas_px_coracao: "suave",
    bas_px_angular: "anguloso",
    bas_px_quadrada: "anguloso",
    bas_px_diamante: "anguloso",
    bas_px_redonda: "largo"
  };
  function fatorBarba(baseId) {
    const fam = baseId ? FAMILIA_FACE[baseId] : void 0;
    return fam === "anguloso" ? 1.05 : fam === "largo" ? 1.1 : 1;
  }
  function resolverEstadoBarba(barbaId, acessorioRosto, acessorioPescoco) {
    if (!barbaId || barbaId === "nenhum") return "hidden";
    if (acessorioRosto && MASCARAS_ROSTO_FECHADAS.includes(acessorioRosto)) return "hidden";
    const perfil = PERFIL_BARBA[barbaId] ?? "media";
    if (perfil === "longa" && acessorioPescoco && PESCOCO_VOLUMOSO.includes(acessorioPescoco)) return "hidden";
    return "visible";
  }

  // public/components/panels/panel-avatar-studio/src/domain/expressoes.ts
  var PIVO = {
    olhos: [120, 108],
    sobrancelha: [120, 96],
    boca: [120, 150]
  };
  var EXPRESSOES_FACE = [
    { id: "feliz", nome: "Feliz", olhos: { ty: 0.6, sy: 0.94 }, boca: { ty: -0.8, sy: 1.06 }, sobrancelha: { ty: -0.8 } },
    { id: "serio", nome: "Sério", olhos: { sy: 0.9 }, boca: { ty: 0.6, sy: 0.94 }, sobrancelha: { ty: 0.9, rot: -1.5 } },
    { id: "surpreso", nome: "Surpreso", olhos: { sy: 1.1 }, boca: { ty: 0.8, sy: 1.12 }, sobrancelha: { ty: -2.2 } },
    { id: "bravo", nome: "Bravo", olhos: { sy: 0.86 }, boca: { ty: 0.8, rot: -1 }, sobrancelha: { ty: 1.4, rot: -3 } },
    { id: "triste", nome: "Triste", olhos: { ty: 0.8, sy: 0.92 }, boca: { ty: 1, rot: 1.2 }, sobrancelha: { ty: 0.6, rot: 2.4 } },
    { id: "cansado", nome: "Cansado", olhos: { ty: 1, sy: 0.8 }, boca: { ty: 0.5 }, sobrancelha: { ty: 1.2 } },
    { id: "confiante", nome: "Confiante", olhos: { sy: 0.95 }, boca: { ty: -0.5, rot: -0.8 }, sobrancelha: { ty: -0.5, rot: 1.2 } }
  ];
  var POR_ID = new Map(EXPRESSOES_FACE.map((e) => [e.id, e]));
  function expressaoPorId(id) {
    return id ? POR_ID.get(id) : void 0;
  }
  var arr = (n) => Math.round(n * 1e3) / 1e3;
  function transformExpressao(camada, preset, intensidade = 1) {
    const def = expressaoPorId(preset);
    const pose = def?.[camada];
    if (!pose) return "";
    const k = Math.max(0, Math.min(1, intensidade));
    if (k === 0) return "";
    const [px, py] = PIVO[camada];
    const partes = [];
    if (pose.ty) partes.push(`translate(0 ${arr(pose.ty * k)})`);
    if (pose.rot) partes.push(`rotate(${arr(pose.rot * k)} ${px} ${py})`);
    if (pose.sy !== void 0 && pose.sy !== 1) {
      const sy = arr(1 + (pose.sy - 1) * k);
      if (sy !== 1) partes.push(`translate(${px} ${py}) scale(1 ${sy}) translate(${-px} ${-py})`);
    }
    return partes.join(" ");
  }

  // public/components/panels/panel-avatar-studio/src/engine/partes/cabelos.ts
  function defsCabelo(u, claro, base, profundo) {
    return `
    <linearGradient id="${u}cab" x1="0.2" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${claro}"/>
      <stop offset="0.45" stop-color="${base}"/>
      <stop offset="1" stop-color="${profundo}"/>
    </linearGradient>`;
  }
  var HUMANOIDES = [
    "bas_classica",
    "bas_angular",
    "bas_holo",
    "bas_redonda",
    "bas_coracao",
    "bas_quadrada",
    "bas_longa",
    "bas_marcada",
    "bas_sardas",
    // Onda 7
    "bas_triangular",
    "bas_bochechudo",
    "bas_diamante",
    "bas_veterano",
    "bas_juvenil",
    "bas_meio_cyborg",
    // Onda 8
    "bas_madura",
    "bas_sereno",
    "bas_gotico",
    "bas_estatua",
    // onda 1413 (#159): bases PREMIUM (bas_px_*) também recebem cabelo —
    // lista COMPARTILHADA (dado de compat, não arte); com a flag OFF as
    // bases premium nem aparecem no catálogo, então nada muda no legado
    "bas_px_oval",
    "bas_px_angular",
    "bas_px_coracao",
    "bas_px_quadrada",
    "bas_px_redonda",
    "bas_px_alongada",
    "bas_px_diamante",
    "bas_px_suave"
  ];
  var BRILHO = `<path d="M88 66 a 46 40 0 0 1 34 -12" stroke="${alfa("#ffffff", 0.3)}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  var CABELOS = [
    {
      id: "cab_curto",
      categoria: "cabelo",
      nome: "Curto Social",
      descricao: "Corte baixo e alinhado, pronto para a reunião.",
      raridade: "comum",
      tema: "executivo",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 104 c -2 -38 22 -57 50 -57 s 52 19 50 57 c -1 -6 -4 -12 -8 -16 c 2 -22 -18 -32 -42 -32 s -44 10 -42 32 c -4 4 -7 10 -8 16 z" fill="url(#${u}cab)"/>
      ${BRILHO}`
    },
    {
      id: "cab_topete",
      categoria: "cabelo",
      nome: "Topete",
      descricao: "Volume para cima com atitude clássica.",
      raridade: "comum",
      tema: "clássico",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 102 c -4 -30 10 -48 24 -56 c 20 -12 46 -10 60 2 c 14 12 18 32 16 54 c -4 -10 -8 -16 -14 -20 c 4 -14 -4 -24 -14 -26 c 4 8 2 12 -2 16 c -8 -12 -26 -16 -40 -10 c -14 6 -22 20 -22 34 c -4 2 -6 4 -8 6 z" fill="url(#${u}cab)"/>
      ${BRILHO}`
    },
    {
      id: "cab_franja",
      categoria: "cabelo",
      nome: "Franja Repicada",
      descricao: "Mechas caindo sobre a testa em camadas.",
      raridade: "comum",
      tema: "casual",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 106 c -3 -40 22 -59 50 -59 s 53 19 50 59 l -6 -14 l -8 12 l -6 -18 l -10 14 l -8 -18 l -10 16 l -10 -16 l -8 18 l -10 -14 l -6 18 l -8 -12 z" fill="url(#${u}cab)"/>
      ${BRILHO}`
    },
    {
      id: "cab_ondulado",
      categoria: "cabelo",
      nome: "Ondulado",
      descricao: "Ondas volumosas emoldurando o rosto.",
      raridade: "incomum",
      tema: "casual",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M66 120 c -8 -50 24 -74 54 -74 s 62 24 54 74 c -6 -8 -8 -18 -8 -26 c -4 6 -10 8 -16 8 c 2 -8 0 -14 -4 -18 c -4 8 -12 12 -22 12 c 4 -6 4 -12 2 -16 c -8 10 -22 14 -34 12 c 2 4 2 10 0 14 c -8 -2 -14 -6 -16 -12 c -2 8 -4 18 -10 26 z" fill="url(#${u}cab)"/>
      <path d="M66 118 c -4 10 -2 20 4 26 c -8 0 -12 -4 -14 -8 c 0 8 4 16 12 20 c -2 -12 0 -26 -2 -38 z" fill="${p.cabelo.escuro}"/>
      <path d="M174 118 c 4 10 2 20 -4 26 c 8 0 12 -4 14 -8 c 0 8 -4 16 -12 20 c 2 -12 0 -26 2 -38 z" fill="${p.cabelo.escuro}"/>
      ${BRILHO}`
    },
    {
      id: "cab_coque",
      categoria: "cabelo",
      nome: "Coque Samurai",
      descricao: "Preso no alto, disciplina e estilo.",
      raridade: "incomum",
      tema: "casual",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <circle cx="120" cy="38" r="15" fill="url(#${u}cab)"/>
      <rect x="108" y="48" width="24" height="7" rx="3.5" fill="${p.cabelo.profundo}"/>
      <path d="M71 102 c -2 -36 21 -55 49 -55 s 51 19 49 55 c -2 -8 -5 -13 -9 -17 c 3 -20 -17 -30 -40 -30 s -43 10 -40 30 c -4 4 -7 9 -9 17 z" fill="url(#${u}cab)"/>
      ${BRILHO}`
    },
    {
      id: "cab_cacheado",
      categoria: "cabelo",
      nome: "Cacheado Power",
      descricao: "Coroa de cachos com presença e volume.",
      raridade: "incomum",
      tema: "casual",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => {
        let cachos = "";
        const pontos = [
          [78, 74, 15],
          [95, 60, 16],
          [120, 54, 17],
          [145, 60, 16],
          [162, 74, 15],
          [70, 92, 13],
          [170, 92, 13],
          [88, 58, 12],
          [152, 58, 12],
          [107, 50, 13],
          [133, 50, 13]
        ];
        for (const [x, y, r] of pontos) cachos += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${u}cab)"/>`;
        return `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      ${cachos}
      <path d="M72 100 c 0 -20 18 -34 48 -34 s 48 14 48 34 c -10 -12 -26 -18 -48 -18 s -38 6 -48 18 z" fill="url(#${u}cab)"/>
      <circle cx="96" cy="60" r="5" fill="${alfa("#ffffff", 0.22)}"/>
      <circle cx="126" cy="52" r="4" fill="${alfa("#ffffff", 0.22)}"/>`;
      }
    },
    {
      id: "cab_longo",
      categoria: "cabelo",
      nome: "Longo Lendário",
      descricao: "Cabelo longo escorrendo pelos ombros.",
      raridade: "raro",
      tema: "clássico",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M74 82 C 60 110 56 150 60 186 c 8 8 20 12 30 10 c -6 -34 -6 -66 -2 -96 c -10 -4 -18 -8 -24 -14 z" fill="url(#${u}cab)"/>
      <path d="M166 82 C 180 110 184 150 180 186 c -8 8 -20 12 -30 10 c 6 -34 6 -66 2 -96 c 10 -4 18 -8 24 -14 z" fill="url(#${u}cab)"/>
      <path d="M70 104 c -4 -38 22 -57 50 -57 s 54 19 50 57 c -5 -14 -13 -22 -22 -26 c 3 -9 -8 -16 -28 -16 s -31 7 -28 16 c -9 4 -17 12 -22 26 z" fill="url(#${u}cab)"/>
      <path d="M92 78 c 8 -6 18 -9 28 -9 s 20 3 28 9" stroke="${alfa(p.cabelo.profundo, 0.5)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${BRILHO}`
    },
    {
      id: "cab_moicano",
      categoria: "cabelo",
      nome: "Moicano",
      descricao: "Crista desafiadora de quem não segue manada.",
      raridade: "raro",
      tema: "punk",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M104 62 l 4 -34 l 8 26 l 4 -30 l 4 30 l 8 -26 l 4 34 c 0 6 -8 10 -16 10 s -16 -4 -16 -10 z" fill="url(#${u}cab)"/>
      <path d="M100 66 c 0 -10 9 -16 20 -16 s 20 6 20 16 l -2 10 c -4 -6 -10 -8 -18 -8 s -14 2 -18 8 z" fill="url(#${u}cab)"/>
      <path d="M74 92 a 50 57 0 0 1 14 -26" stroke="${alfa(p.cabelo.profundo, 0.4)}" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M166 92 a 50 57 0 0 0 -14 -26" stroke="${alfa(p.cabelo.profundo, 0.4)}" stroke-width="6" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "cab_cyber",
      categoria: "cabelo",
      nome: "Undercut Neon",
      descricao: "Undercut futurista com trilhas de luz raspadas.",
      raridade: "epico",
      tema: "cyberpunk",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo", "destaque"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M74 86 a 50 57 0 0 1 92 0 c -4 -6 -10 -10 -16 -12 l 8 -6 c -8 -2 -14 0 -20 4 c -2 -8 -8 -12 -14 -14 c 2 4 2 8 0 12 c -6 -6 -14 -8 -22 -6 c 4 2 6 6 6 10 c -14 -4 -26 2 -34 12 z" fill="url(#${u}cab)"/>
      <path d="M120 64 c 18 -2 34 8 42 22 l 4 18 c -8 -18 -26 -28 -46 -28 z" fill="${alfa(p.cabelo.profundo, 0.5)}"/>
      <g stroke="${p.destaque.base}" stroke-width="2" stroke-linecap="round" opacity="0.85">
        <path d="M76 96 l 14 -8"/>
        <path d="M78 104 l 16 -9"/>
        <path d="M164 96 l -14 -8"/>
        <path d="M162 104 l -16 -9"/>
      </g>
      ${BRILHO}`
    },
    // ── 4.6 F2 · Onda 1 (identidade) — 10 cabelos novos ───────────────
    {
      id: "cab_rabo",
      categoria: "cabelo",
      nome: "Rabo de Cavalo",
      descricao: "Preso alto, pronto para resolver qualquer sprint.",
      raridade: "comum",
      tema: "esportivo",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 100 c -2 -36 22 -55 50 -55 s 52 19 50 55 c -2 -8 -6 -14 -10 -18 c 2 -20 -16 -30 -40 -30 s -42 10 -40 30 c -4 4 -8 10 -10 18 z" fill="url(#${u}cab)"/>
      <path d="M158 62 c 14 -4 22 4 22 16 c 0 20 -8 44 -22 56 c 6 -20 8 -42 0 -60 z" fill="url(#${u}cab)"/>
      <ellipse cx="160" cy="66" rx="5" ry="7" fill="${alfa(p.cabelo.profundo, 0.8)}"/>
      ${BRILHO}`
    },
    {
      id: "cab_lateral",
      categoria: "cabelo",
      nome: "Risca Lateral",
      descricao: "Divisão milimétrica — pente e disciplina.",
      raridade: "comum",
      tema: "executivo",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 100 c -2 -36 22 -55 50 -55 s 52 19 50 55 c -2 -10 -6 -16 -10 -20 c 0 -8 -2 -14 -8 -18 l -48 4 c -14 4 -24 14 -24 26 c -4 2 -8 6 -10 8 z" fill="url(#${u}cab)"/>
      <path d="M104 62 l 44 -4 c 8 4 10 12 8 18 l -50 2 c -2 -6 -2 -12 -2 -16 z" fill="${alfa(p.cabelo.profundo, 0.55)}"/>
      <path d="M104 62 l 46 -4" stroke="${alfa(p.cabelo.claro, 0.5)}" stroke-width="1.6"/>
      ${BRILHO}`
    },
    {
      id: "cab_buzz",
      categoria: "cabelo",
      nome: "Raspado",
      descricao: "Máquina zero e foco total.",
      raridade: "comum",
      tema: "esportivo",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M72 96 a 50 55 0 0 1 96 0 c -1 -4 -3 -8 -6 -11 a 44 48 0 0 0 -84 0 c -3 3 -5 7 -6 11 z" fill="${alfa(p.cabelo.base, 0.85)}"/>
      <path d="M76 88 a 46 50 0 0 1 88 0" stroke="${alfa(p.cabelo.profundo, 0.35)}" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="2 4"/>
      ${BRILHO}`
    },
    {
      id: "cab_afro",
      categoria: "cabelo",
      nome: "Afro",
      descricao: "Coroa cheia com volume de respeito.",
      raridade: "incomum",
      tema: "clássico",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <circle cx="88" cy="70" r="20" fill="url(#${u}cab)"/>
      <circle cx="120" cy="58" r="24" fill="url(#${u}cab)"/>
      <circle cx="152" cy="70" r="20" fill="url(#${u}cab)"/>
      <circle cx="72" cy="92" r="16" fill="url(#${u}cab)"/>
      <circle cx="168" cy="92" r="16" fill="url(#${u}cab)"/>
      <path d="M72 100 c -2 -34 20 -52 48 -52 s 50 18 48 52 c -10 -22 -26 -32 -48 -32 s -38 10 -48 32 z" fill="url(#${u}cab)"/>
      <circle cx="100" cy="56" r="3" fill="${alfa("#ffffff", 0.22)}"/>
      <circle cx="132" cy="52" r="3" fill="${alfa("#ffffff", 0.22)}"/>
      <circle cx="82" cy="76" r="2.5" fill="${alfa("#ffffff", 0.18)}"/>`
    },
    {
      id: "cab_trancas",
      categoria: "cabelo",
      nome: "Tranças Box",
      descricao: "Fileiras alinhadas e tranças com contas de luz.",
      raridade: "raro",
      tema: "urbano",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo", "destaque"],
      render: (p, u) => {
        let fileiras = "";
        for (let i = 0; i < 5; i++) {
          const x = 92 + i * 14;
          fileiras += `<path d="M${x} 48 q ${(x - 120) * 0.35} 16 ${(x - 120) * 0.55} 26" stroke="${alfa(p.cabelo.profundo, 0.55)}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
        }
        let laterais = "";
        for (const dir of [-1, 1]) {
          for (let j = 0; j < 2; j++) {
            const x = 120 + dir * (46 + j * 8);
            laterais += `<path d="M${x} ${92 + j * 6} q ${dir * 6} 30 ${dir * 3} ${56 - j * 10}" stroke="url(#${u}cab)" stroke-width="8" stroke-linecap="round" fill="none"/>`;
            for (let k = 0; k < 3; k++) {
              laterais += `<ellipse cx="${x + dir * (2 + k)}" cy="${106 + j * 4 + k * 15}" rx="4.2" ry="3" fill="${alfa(p.cabelo.profundo, 0.55)}"/>`;
            }
            laterais += `<circle cx="${x + dir * 4}" cy="${150 - j * 6}" r="3.2" fill="${p.destaque.base}" opacity="0.9"/>`;
          }
        }
        return `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M72 100 c -4 -34 20 -54 48 -54 s 52 20 48 54 c -8 -20 -26 -30 -48 -30 s -40 10 -48 30 z" fill="url(#${u}cab)"/>
      ${fileiras}
      ${laterais}
      ${BRILHO}`;
      }
    },
    {
      id: "cab_medio",
      categoria: "cabelo",
      nome: "Médio Despojado",
      descricao: "Na altura do queixo, do jeito que acordou.",
      raridade: "comum",
      tema: "casual",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M68 132 c -6 -52 20 -87 52 -87 s 58 35 52 87 c -4 -8 -8 -12 -12 -14 l 2 -18 c -4 6 -8 8 -12 8 c 2 -12 -2 -22 -10 -28 c 2 8 0 14 -4 18 c -6 -10 -16 -14 -26 -12 c 4 4 6 8 6 12 c -12 -4 -24 2 -30 12 l 2 20 c -8 2 -16 -4 -20 2 z" fill="url(#${u}cab)"/>
      <path d="M70 128 q -4 10 2 18 M170 128 q 4 10 -2 18" stroke="url(#${u}cab)" stroke-width="10" stroke-linecap="round" fill="none"/>
      ${BRILHO}`
    },
    {
      id: "cab_franja_longa",
      categoria: "cabelo",
      nome: "Longo com Franja",
      descricao: "Cortina lisa até os ombros com franja reta.",
      raridade: "incomum",
      tema: "clássico",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M66 170 c -8 -70 18 -125 54 -125 s 62 55 54 125 l -14 6 c 4 -40 0 -70 -8 -88 l 0 14 l -64 0 l 0 -14 c -8 18 -12 48 -8 88 z" fill="url(#${u}cab)"/>
      <path d="M88 68 h 64 c 2 8 2 16 0 22 l -8 -8 l -8 10 l -8 -10 l -8 10 l -8 -10 l -8 10 l -8 -8 c -2 -6 -2 -14 0 -16 z" fill="url(#${u}cab)"/>
      ${BRILHO}`
    },
    {
      id: "cab_meio_coque",
      categoria: "cabelo",
      nome: "Meio Coque",
      descricao: "Metade presa, metade solta — equilíbrio perfeito.",
      raridade: "raro",
      tema: "urbano",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <circle cx="120" cy="38" r="15" fill="url(#${u}cab)"/>
      <path d="M108 46 q 12 8 24 0" stroke="${alfa(p.cabelo.profundo, 0.5)}" stroke-width="3" fill="none"/>
      <path d="M70 118 c -4 -44 20 -66 50 -66 s 54 22 50 66 c -4 -8 -8 -12 -12 -14 c 2 -24 -14 -36 -38 -36 s -40 12 -38 36 c -4 2 -8 6 -12 14 z" fill="url(#${u}cab)"/>
      <path d="M72 116 q -4 14 4 24 M168 116 q 4 14 -4 24" stroke="url(#${u}cab)" stroke-width="9" stroke-linecap="round" fill="none"/>
      ${BRILHO}`
    },
    {
      id: "cab_ondas_curtas",
      categoria: "cabelo",
      nome: "Ondas Curtas",
      descricao: "Textura viva sem esforço nenhum.",
      raridade: "incomum",
      tema: "casual",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 100 c -2 -36 22 -55 50 -55 s 52 19 50 55 c -3 -7 -6 -12 -10 -16 c 3 -19 -16 -30 -40 -30 s -43 11 -40 30 c -4 4 -7 9 -10 16 z" fill="url(#${u}cab)"/>
      <g stroke="${alfa(p.cabelo.profundo, 0.45)}" stroke-width="2.6" fill="none" stroke-linecap="round">
        <path d="M88 62 q 4 -4 8 0 q 4 4 8 0"/>
        <path d="M112 54 q 4 -4 8 0 q 4 4 8 0"/>
        <path d="M136 62 q 4 -4 8 0"/>
        <path d="M98 74 q 4 -4 8 0 q 4 4 8 0"/>
        <path d="M126 72 q 4 -4 8 0"/>
      </g>
      ${BRILHO}`
    },
    {
      id: "cab_picos_neon",
      categoria: "cabelo",
      nome: "Picos Neon",
      descricao: "Espetado com pontas mergulhadas em luz.",
      raridade: "epico",
      tema: "cyberpunk",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo", "destaque"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}
        <linearGradient id="${u}pico" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="${p.cabelo.base}"/>
          <stop offset="0.62" stop-color="${p.cabelo.base}"/>
          <stop offset="1" stop-color="${p.destaque.base}"/>
        </linearGradient>
      </defs>
      <path d="M74 96 c 0 -12 4 -22 10 -30 l 2 -22 l 10 16 l 8 -22 l 8 18 l 8 -24 l 8 24 l 8 -18 l 8 22 l 10 -16 l 2 22 c 6 8 10 18 10 30 c -10 -18 -26 -26 -46 -26 s -36 8 -46 26 z" fill="url(#${u}pico)"/>
      <path d="M86 44 l 10 16 M110 36 l 8 18 M134 36 l -8 18 M158 44 l -10 16" stroke="${alfa(p.destaque.claro, 0.35)}" stroke-width="2" stroke-linecap="round"/>
      ${BRILHO}`
    },
    // ── 4.6 F2 · Onda 6 (identidade) — 14 cabelos novos ───────────────
    {
      id: "cab_pixie",
      categoria: "cabelo",
      nome: "Pixie",
      descricao: "Curto, prático e cheio de atitude.",
      raridade: "comum",
      tema: "casual",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 102 c -4 -36 20 -56 50 -56 s 54 20 50 56 c -2 -8 -6 -14 -10 -17 c 3 -18 -14 -29 -40 -29 s -43 11 -40 29 c -4 3 -8 9 -10 17 z" fill="url(#${u}cab)"/>
      <path d="M78 88 q 8 -6 14 -2 l -6 10 z M150 84 q 8 2 12 8 l -10 4 z" fill="url(#${u}cab)"/>
      <path d="M112 58 q 10 -4 20 2" stroke="${alfa(p.cabelo.profundo, 0.5)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${BRILHO}`
    },
    {
      id: "cab_repicado_longo",
      categoria: "cabelo",
      nome: "Repicado Longo",
      descricao: "Camadas em movimento até os ombros.",
      raridade: "incomum",
      tema: "casual",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M66 176 c -8 -66 16 -122 54 -122 s 62 56 54 122 l -12 4 c 4 -34 2 -62 -6 -80 l -2 12 l -10 -18 l -6 14 l -12 -20 l -12 20 l -6 -14 l -10 18 l -2 -12 c -8 18 -10 46 -6 80 z" fill="url(#${u}cab)"/>
      <path d="M70 150 q -4 14 4 24 M170 150 q 4 14 -4 24" stroke="url(#${u}cab)" stroke-width="8" stroke-linecap="round" fill="none"/>
      ${BRILHO}`
    },
    {
      id: "cab_dreads",
      categoria: "cabelo",
      nome: "Dreads",
      descricao: "Cordas grossas com peso e presença.",
      raridade: "raro",
      tema: "urbano",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => {
        let dreads = "";
        for (let i = 0; i < 7; i++) {
          const x = 78 + i * 14;
          const alt = 118 + i * 17 % 26;
          dreads += `<path d="M${x} 62 q ${i % 2 ? 4 : -4} ${alt / 2} ${i % 2 ? 2 : -2} ${alt}" stroke="url(#${u}cab)" stroke-width="10" stroke-linecap="round" fill="none"/>`;
          dreads += `<path d="M${x - 2} ${70 + i % 3 * 20} h 5 M${x - 2} ${94 + i % 3 * 18} h 5" stroke="${alfa(p.cabelo.profundo, 0.55)}" stroke-width="2.4"/>`;
        }
        return `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      ${dreads}
      <path d="M72 98 c -4 -34 20 -54 48 -54 s 52 20 48 54 c -8 -20 -26 -30 -48 -30 s -40 10 -48 30 z" fill="url(#${u}cab)"/>
      ${BRILHO}`;
      }
    },
    {
      id: "cab_mullet",
      categoria: "cabelo",
      nome: "Mullet",
      descricao: "Negócios na frente, festa atrás. Sempre foi assim.",
      raridade: "incomum",
      tema: "retrô",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 100 c -2 -36 22 -55 50 -55 s 52 19 50 55 c -3 -8 -6 -13 -10 -16 c 3 -18 -16 -30 -40 -30 s -43 12 -40 30 c -4 3 -7 8 -10 16 z" fill="url(#${u}cab)"/>
      <path d="M62 96 c -6 34 -2 62 10 78 l 8 -10 q -8 -26 -4 -52 z" fill="url(#${u}cab)"/>
      <path d="M178 96 c 6 34 2 62 -10 78 l -8 -10 q 8 -26 4 -52 z" fill="url(#${u}cab)"/>
      <path d="M70 168 q 25 16 50 16 t 50 -16 l -6 14 q -22 14 -44 14 t -44 -14 z" fill="url(#${u}cab)" opacity="0.9"/>
      ${BRILHO}`
    },
    {
      id: "cab_pompadour",
      categoria: "cabelo",
      nome: "Pompadour",
      descricao: "Volume esculpido com gel e convicção.",
      raridade: "raro",
      tema: "retrô",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M72 96 c -2 -20 6 -38 22 -48 c 22 -14 50 -12 66 4 c 10 10 12 26 8 44 c -4 -10 -10 -16 -16 -18 c 6 -16 -2 -28 -16 -30 c 4 8 4 14 0 18 c -10 -12 -30 -14 -42 -6 c -10 6 -14 18 -12 30 c -4 1 -8 3 -10 6 z" fill="url(#${u}cab)"/>
      <path d="M84 56 q 20 -14 44 -6" stroke="${alfa("#ffffff", 0.28)}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M76 84 q 12 -8 24 -6 M96 62 q 14 -6 28 -2" stroke="${alfa(p.cabelo.profundo, 0.4)}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    },
    {
      id: "cab_chanel",
      categoria: "cabelo",
      nome: "Chanel",
      descricao: "Corte reto no queixo — geometria impecável.",
      raridade: "incomum",
      tema: "executivo",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M68 148 c -6 -58 16 -100 52 -100 s 58 42 52 100 l -16 4 v -44 c -4 6 -8 8 -12 8 c 2 -10 0 -18 -6 -24 c 0 6 -2 10 -6 12 c -4 -8 -12 -12 -20 -10 c 3 3 5 7 5 11 c -10 -2 -18 4 -21 12 l 0 35 z" fill="url(#${u}cab)"/>
      <path d="M68 146 h 16 M156 146 h 16" stroke="${alfa(p.cabelo.profundo, 0.6)}" stroke-width="3"/>
      ${BRILHO}`
    },
    {
      id: "cab_coques_duplos",
      categoria: "cabelo",
      nome: "Coques Duplos",
      descricao: "Simetria espacial: dois módulos de personalidade.",
      raridade: "raro",
      tema: "urbano",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <circle cx="82" cy="44" r="14" fill="url(#${u}cab)"/>
      <circle cx="158" cy="44" r="14" fill="url(#${u}cab)"/>
      <path d="M72 50 q 10 6 20 1 M148 51 q 10 5 20 -1" stroke="${alfa(p.cabelo.profundo, 0.5)}" stroke-width="2.6" fill="none"/>
      <path d="M70 100 c -2 -36 22 -55 50 -55 s 52 19 50 55 c -3 -8 -6 -13 -10 -16 c 3 -18 -16 -30 -40 -30 s -43 12 -40 30 c -4 3 -7 8 -10 16 z" fill="url(#${u}cab)"/>
      ${BRILHO}`
    },
    {
      id: "cab_grisalho",
      categoria: "cabelo",
      nome: "Grisalho Sábio",
      descricao: "Cada fio prata é um incidente resolvido.",
      raridade: "raro",
      tema: "clássico",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 104 c -2 -38 22 -57 50 -57 s 52 19 50 57 c -1 -6 -4 -12 -8 -16 c 2 -22 -18 -32 -42 -32 s -44 10 -42 32 c -4 4 -7 10 -8 16 z" fill="url(#${u}cab)"/>
      <g stroke="#d8dde8" stroke-width="2.4" stroke-linecap="round" opacity="0.8">
        <path d="M84 74 q 6 -10 14 -14"/>
        <path d="M104 58 q 8 -4 16 -4"/>
        <path d="M138 58 q 10 4 16 12"/>
        <path d="M156 78 q 4 6 5 12"/>
      </g>
      ${BRILHO}`
    },
    {
      id: "cab_emo",
      categoria: "cabelo",
      nome: "Franja Emo",
      descricao: "Um olho coberto, o outro julgando o backlog.",
      raridade: "incomum",
      tema: "retrô",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 108 c -4 -40 20 -61 50 -61 s 54 21 50 61 c -2 -8 -6 -14 -10 -18 c 2 -20 -16 -30 -40 -30 s -42 10 -40 30 c -4 4 -8 10 -10 18 z" fill="url(#${u}cab)"/>
      <path d="M74 66 c 20 -12 42 -10 54 6 l -14 46 c -8 -6 -16 -8 -24 -6 l -12 -22 c -4 -8 -6 -16 -4 -24 z" fill="url(#${u}cab)"/>
      <path d="M80 76 q 14 -10 32 -4 M86 94 q 10 -6 20 -4" stroke="${alfa(p.cabelo.profundo, 0.45)}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      ${BRILHO}`
    },
    {
      id: "cab_lambido",
      categoria: "cabelo",
      nome: "Liso Lambido",
      descricao: "Pente fino, gel firme, reunião às 8.",
      raridade: "comum",
      tema: "executivo",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M72 98 c -2 -32 18 -52 48 -52 s 50 20 48 52 c -2 -6 -5 -11 -9 -14 c 2 -20 -15 -30 -39 -30 s -41 10 -39 30 c -4 3 -7 8 -9 14 z" fill="url(#${u}cab)"/>
      <g stroke="${alfa(p.cabelo.profundo, 0.4)}" stroke-width="1.8" fill="none">
        <path d="M84 62 q 36 -14 72 0"/>
        <path d="M82 72 q 38 -14 76 0"/>
        <path d="M82 82 q 38 -12 76 0"/>
      </g>
      <path d="M88 58 a 46 40 0 0 1 30 -10" stroke="${alfa("#ffffff", 0.4)}" stroke-width="3" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "cab_cachos_soltos",
      categoria: "cabelo",
      nome: "Cachos Soltos",
      descricao: "Molas naturais em queda livre controlada.",
      raridade: "incomum",
      tema: "casual",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => {
        let cachos = "";
        const pos = [
          [76, 96, 9],
          [70, 120, 8],
          [76, 144, 9],
          [164, 96, 9],
          [170, 120, 8],
          [164, 144, 9],
          [86, 164, 7],
          [154, 164, 7]
        ];
        for (const [x, y, r] of pos) {
          cachos += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${u}cab)"/>
        <path d="M${x - r / 2} ${y} a ${r / 2} ${r / 2} 0 0 1 ${r} 0" stroke="${alfa(p.cabelo.profundo, 0.45)}" stroke-width="1.8" fill="none"/>`;
        }
        return `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      ${cachos}
      <path d="M70 104 c -4 -38 20 -58 50 -58 s 54 20 50 58 c -8 -22 -26 -34 -50 -34 s -42 12 -50 34 z" fill="url(#${u}cab)"/>
      <circle cx="94" cy="56" r="8" fill="url(#${u}cab)"/>
      <circle cx="120" cy="48" r="9" fill="url(#${u}cab)"/>
      <circle cx="146" cy="56" r="8" fill="url(#${u}cab)"/>
      ${BRILHO}`;
      }
    },
    {
      id: "cab_viking",
      categoria: "cabelo",
      nome: "Trança Viking",
      descricao: "Laterais raspadas e uma trança que já viu batalhas.",
      raridade: "epico",
      tema: "aventura",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M78 92 a 50 55 0 0 1 84 0 c -2 -4 -4 -7 -7 -9 a 44 48 0 0 0 -70 0 c -3 2 -5 5 -7 9 z" fill="${alfa(p.cabelo.base, 0.55)}"/>
      <path d="M96 84 c -2 -26 10 -40 24 -40 s 26 14 24 40 c -6 -10 -14 -14 -24 -14 s -18 4 -24 14 z" fill="url(#${u}cab)"/>
      <path d="M138 52 q 24 14 28 48 q 3 30 -2 56" stroke="url(#${u}cab)" stroke-width="11" stroke-linecap="round" fill="none"/>
      <g fill="${alfa(p.cabelo.profundo, 0.55)}">
        <ellipse cx="158" cy="80" rx="5.6" ry="4"/>
        <ellipse cx="163" cy="98" rx="5.6" ry="4"/>
        <ellipse cx="165" cy="116" rx="5.6" ry="4"/>
        <ellipse cx="166" cy="134" rx="5.4" ry="3.8"/>
        <ellipse cx="165" cy="150" rx="5" ry="3.6"/>
      </g>
      <circle cx="164" cy="160" r="3.4" fill="#e8b64c"/>
      ${BRILHO}`
    },
    {
      id: "cab_holo_gradiente",
      categoria: "cabelo",
      nome: "Holo Gradiente",
      descricao: "As pontas dissolvem em luz de destaque.",
      raridade: "epico",
      tema: "cyberpunk",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo", "destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}holo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.cabelo.base}"/>
          <stop offset="0.55" stop-color="${p.cabelo.base}"/>
          <stop offset="1" stop-color="${p.destaque.base}"/>
        </linearGradient>
      </defs>
      <path d="M66 168 c -8 -64 18 -116 54 -116 s 62 52 54 116 l -14 4 c 4 -34 0 -62 -8 -78 l -4 14 l -28 -24 l -28 24 l -4 -14 c -8 16 -12 44 -8 78 z" fill="url(#${u}holo)"/>
      <path d="M74 160 q 46 18 92 0" stroke="${alfa(p.destaque.claro, 0.5)}" stroke-width="2.4" fill="none">
        <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2.6s" repeatCount="indefinite"/>
      </path>
      ${BRILHO}`
    },
    {
      id: "cab_tigela",
      categoria: "cabelo",
      nome: "Corte Tigela",
      descricao: "A tigela foi calibrada em laboratório. Confie.",
      raridade: "comum",
      tema: "retrô",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 96 a 50 46 0 0 1 100 0 l -4 8 h -92 z" fill="url(#${u}cab)"/>
      <path d="M74 104 h 92" stroke="${alfa(p.cabelo.profundo, 0.6)}" stroke-width="3"/>
      ${BRILHO}`
    },
    // ── 4.6 F2 · Onda 8 (final §28) — 17 cabelos novos (50 ✓) ─────────
    {
      id: "cab_rabo_baixo",
      categoria: "cabelo",
      nome: "Rabo Baixo",
      descricao: "Discrição na nuca, eficiência no resto.",
      raridade: "comum",
      tema: "executivo",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 102 c -2 -36 22 -55 50 -55 s 52 19 50 55 c -2 -7 -5 -12 -9 -15 c 2 -20 -17 -31 -41 -31 s -43 11 -41 31 c -4 3 -7 8 -9 15 z" fill="url(#${u}cab)"/>
      <path d="M162 116 q 14 20 8 46 q -6 -4 -8 -10 q -2 8 -8 12 q -2 -26 2 -48 z" fill="url(#${u}cab)"/>
      <ellipse cx="161" cy="120" rx="4.6" ry="6" fill="${alfa(p.cabelo.profundo, 0.75)}"/>
      ${BRILHO}`
    },
    {
      id: "cab_franjinha",
      categoria: "cabelo",
      nome: "Franjinha Reta",
      descricao: "Régua e tesoura: precisão milimétrica na testa.",
      raridade: "comum",
      tema: "casual",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 104 c -2 -38 22 -57 50 -57 s 52 19 50 57 c -2 -8 -5 -13 -9 -16 c 2 -20 -17 -32 -41 -32 s -43 12 -41 32 c -4 3 -7 8 -9 16 z" fill="url(#${u}cab)"/>
      <path d="M86 62 h 68 v 16 l -6 -4 l -6 5 l -6 -5 l -5 5 l -6 -5 l -6 5 l -5 -5 l -6 5 l -6 -4 l -6 4 l -6 -5 z" fill="url(#${u}cab)"/>
      <path d="M88 76 h 64" stroke="${alfa(p.cabelo.profundo, 0.35)}" stroke-width="2"/>
      ${BRILHO}`
    },
    {
      id: "cab_ondas_longas",
      categoria: "cabelo",
      nome: "Ondas Longas",
      descricao: "Movimento de comercial de shampoo em cada reunião.",
      raridade: "incomum",
      tema: "clássico",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M64 180 c -10 -70 16 -128 56 -128 s 66 58 56 128 l -14 4 c 6 -34 4 -64 -6 -84 q -2 12 -10 18 q 2 -14 -4 -24 q -6 8 -16 8 t -16 -8 q -6 10 -4 24 q -8 -6 -10 -18 c -10 20 -12 50 -6 84 z" fill="url(#${u}cab)"/>
      <path d="M68 130 q -8 18 -2 38 q 6 -4 8 -12 M172 130 q 8 18 2 38 q -6 -4 -8 -12" stroke="url(#${u}cab)" stroke-width="9" stroke-linecap="round" fill="none"/>
      ${BRILHO}`
    },
    {
      id: "cab_sidecut",
      categoria: "cabelo",
      nome: "Sidecut",
      descricao: "Um lado corporativo, outro lado revolução.",
      raridade: "raro",
      tema: "urbano",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M74 92 a 50 55 0 0 1 46 -44 l 0 10 a 44 48 0 0 0 -40 38 z" fill="${alfa(p.cabelo.base, 0.5)}"/>
      <path d="M78 86 l 10 -14 M76 96 l 14 -18" stroke="${alfa(p.cabelo.profundo, 0.4)}" stroke-width="2" stroke-linecap="round"/>
      <path d="M120 47 c 28 0 50 20 48 55 c -2 -8 -6 -14 -10 -17 c 3 -18 -14 -29 -38 -29 l -10 12 c -4 -8 -2 -16 10 -21 z" fill="url(#${u}cab)"/>
      <path d="M112 58 c 20 -6 40 2 46 18 l 2 20 c -8 -18 -26 -28 -48 -26 z" fill="url(#${u}cab)"/>
      ${BRILHO}`
    },
    {
      id: "cab_juba",
      categoria: "cabelo",
      nome: "Juba Rebelde",
      descricao: "Escova? Nunca ouviu falar. E funciona.",
      raridade: "incomum",
      tema: "casual",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => {
        let tufos = "";
        for (let i = 0; i < 9; i++) {
          const ang = (-160 + i * 20) * (Math.PI / 180);
          const x = 120 + Math.cos(ang) * 52;
          const y = 78 + Math.sin(ang) * 40;
          tufos += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="13" ry="9" fill="url(#${u}cab)" transform="rotate(${(-60 + i * 15).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
        }
        return `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      ${tufos}
      <path d="M70 102 c -4 -38 20 -58 50 -58 s 54 20 50 58 c -8 -22 -26 -34 -50 -34 s -42 12 -50 34 z" fill="url(#${u}cab)"/>
      ${BRILHO}`;
      }
    },
    {
      id: "cab_sabio",
      categoria: "cabelo",
      nome: "Sábio Calvo",
      descricao: "O topo aberto para as ideias entrarem direto.",
      raridade: "incomum",
      tema: "clássico",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M68 104 q 2 24 12 34 q 6 -14 2 -32 q -6 -6 -14 -2 z" fill="url(#${u}cab)"/>
      <path d="M172 104 q -2 24 -12 34 q -6 -14 -2 -32 q 6 -6 14 -2 z" fill="url(#${u}cab)"/>
      <path d="M70 106 a 50 57 0 0 1 4 -22 q 4 10 2 22 z M170 106 a 50 57 0 0 0 -4 -22 q -4 10 -2 22 z" fill="${alfa(p.cabelo.base, 0.8)}"/>
      <path d="M96 56 a 50 40 0 0 1 12 -6" stroke="${alfa(p.cabelo.base, 0.5)}" stroke-width="3" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "cab_tranca_unica",
      categoria: "cabelo",
      nome: "Trança Única",
      descricao: "Uma trança no ombro e nenhuma pressa no mundo.",
      raridade: "incomum",
      tema: "clássico",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 104 c -2 -38 22 -57 50 -57 s 52 19 50 57 c -2 -8 -6 -14 -10 -17 c 3 -19 -16 -31 -40 -31 s -43 12 -40 31 c -4 3 -8 9 -10 17 z" fill="url(#${u}cab)"/>
      <path d="M74 100 q -6 30 2 52 q 6 -6 8 -14 q 2 20 12 30 q 4 -10 2 -22" fill="none" stroke="url(#${u}cab)" stroke-width="10" stroke-linecap="round"/>
      <g fill="${alfa(p.cabelo.profundo, 0.55)}">
        <ellipse cx="76" cy="116" rx="5.4" ry="4"/>
        <ellipse cx="78" cy="134" rx="5.4" ry="4"/>
        <ellipse cx="84" cy="152" rx="5.2" ry="3.8"/>
        <ellipse cx="92" cy="166" rx="5" ry="3.6"/>
      </g>
      <circle cx="96" cy="176" r="3.2" fill="#e8b64c"/>
      ${BRILHO}`
    },
    {
      id: "cab_babyliss",
      categoria: "cabelo",
      nome: "Babyliss",
      descricao: "Cachos de salão prontos para a foto do crachá.",
      raridade: "incomum",
      tema: "clássico",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M68 150 c -6 -60 18 -103 52 -103 s 58 43 52 103 l -12 2 v -40 q -4 8 -10 10 q 2 -12 -2 -20 q -6 6 -12 6 q 2 -10 -4 -16 q -8 6 -18 4 q 0 8 -6 12 q -4 -6 -12 -6 l 0 48 z" fill="url(#${u}cab)"/>
      <g fill="none" stroke="${alfa(p.cabelo.profundo, 0.4)}" stroke-width="2.6" stroke-linecap="round">
        <path d="M74 128 q 6 4 4 12 q -2 8 4 12"/>
        <path d="M164 126 q -6 4 -4 12 q 2 8 -4 12"/>
      </g>
      ${BRILHO}`
    },
    {
      id: "cab_espetadinho",
      categoria: "cabelo",
      nome: "Espetadinho",
      descricao: "Gel matinal e cinco minutos de espelho.",
      raridade: "comum",
      tema: "casual",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M74 96 c 0 -10 3 -19 8 -26 l 4 10 l 6 -16 l 6 12 l 8 -16 l 6 14 l 8 -16 l 8 16 l 6 -14 l 8 16 l 6 -12 l 6 16 l 4 -10 c 5 7 8 16 8 26 c -10 -16 -26 -24 -46 -24 s -36 8 -46 24 z" fill="url(#${u}cab)"/>
      ${BRILHO}`
    },
    {
      id: "cab_permanente80",
      categoria: "cabelo",
      nome: "Permanente 80s",
      descricao: "Volume que precisa de crachá próprio.",
      raridade: "raro",
      tema: "retrô",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => {
        let bolhas = "";
        const pos = [
          [78, 66, 16],
          [100, 50, 17],
          [124, 44, 18],
          [148, 52, 16],
          [166, 70, 15],
          [70, 92, 14],
          [172, 96, 13],
          [68, 118, 12],
          [174, 120, 11]
        ];
        for (const [x, y, r] of pos) {
          bolhas += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${u}cab)"/>`;
        }
        return `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      ${bolhas}
      <path d="M72 104 c -4 -36 20 -56 48 -56 s 52 20 48 56 c -8 -20 -26 -30 -48 -30 s -40 10 -48 30 z" fill="url(#${u}cab)"/>
      <circle cx="92" cy="58" r="3" fill="${alfa("#ffffff", 0.25)}"/>
      <circle cx="136" cy="48" r="3" fill="${alfa("#ffffff", 0.25)}"/>
      ${BRILHO}`;
      }
    },
    {
      id: "cab_wolf",
      categoria: "cabelo",
      nome: "Wolf Cut",
      descricao: "Camadas selvagens domesticadas só na aparência.",
      raridade: "raro",
      tema: "urbano",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 106 c -4 -40 20 -61 50 -61 s 54 21 50 61 c -2 -8 -6 -14 -10 -18 c 2 -20 -16 -30 -40 -30 s -42 10 -40 30 c -4 4 -8 10 -10 18 z" fill="url(#${u}cab)"/>
      <path d="M86 60 l 10 18 l -14 -4 l 8 16 l -14 -6 M154 60 l -10 18 l 14 -4 l -8 16 l 14 -6" fill="none" stroke="url(#${u}cab)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M66 110 q -4 26 6 44 q 4 -8 4 -18 q 4 12 12 18 q 2 -10 -2 -22 M174 110 q 4 26 -6 44 q -4 -8 -4 -18 q -4 12 -12 18 q -2 -10 2 -22" fill="url(#${u}cab)"/>
      ${BRILHO}`
    },
    {
      id: "cab_slick_rabo",
      categoria: "cabelo",
      nome: "Slick + Rabo",
      descricao: "Liso espelhado na frente, rabo executivo atrás.",
      raridade: "incomum",
      tema: "executivo",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M72 98 c -2 -32 18 -51 48 -51 s 50 19 48 51 c -2 -6 -5 -11 -9 -14 c 2 -19 -15 -29 -39 -29 s -41 10 -39 29 c -4 3 -7 8 -9 14 z" fill="url(#${u}cab)"/>
      <g stroke="${alfa(p.cabelo.claro, 0.35)}" stroke-width="1.8" fill="none">
        <path d="M86 60 q 34 -12 68 0"/>
        <path d="M84 70 q 36 -12 72 0"/>
      </g>
      <path d="M156 108 q 18 10 16 34 q -6 -4 -10 -10 q 0 10 -6 16 q -6 -20 -4 -40 z" fill="url(#${u}cab)"/>
      <ellipse cx="157" cy="112" rx="4.4" ry="5.6" fill="${alfa(p.cabelo.profundo, 0.75)}"/>`
    },
    {
      id: "cab_cortina",
      categoria: "cabelo",
      nome: "Cortina",
      descricao: "Repartido ao meio como um bom orçamento.",
      raridade: "comum",
      tema: "casual",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M70 104 c -2 -38 22 -57 50 -57 s 52 19 50 57 c -2 -8 -5 -13 -9 -16 c 2 -20 -17 -32 -41 -32 s -43 12 -41 32 c -4 3 -7 8 -9 16 z" fill="url(#${u}cab)"/>
      <path d="M118 56 c -14 2 -24 14 -26 30 l -8 18 c -4 -14 -2 -30 6 -40 c 6 -8 16 -10 28 -8 z" fill="url(#${u}cab)"/>
      <path d="M122 56 c 14 2 24 14 26 30 l 8 18 c 4 -14 2 -30 -6 -40 c -6 -8 -16 -10 -28 -8 z" fill="url(#${u}cab)"/>
      <path d="M120 56 v 10" stroke="${alfa(p.cabelo.profundo, 0.5)}" stroke-width="2"/>
      ${BRILHO}`
    },
    {
      id: "cab_estrela_raspada",
      categoria: "cabelo",
      nome: "Estrela Raspada",
      descricao: "Arte na máquina zero — barbeiro artista, cliente lenda.",
      raridade: "epico",
      tema: "urbano",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo", "destaque"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <path d="M72 96 a 50 55 0 0 1 96 0 c -1 -4 -3 -8 -6 -11 a 44 48 0 0 0 -84 0 c -3 3 -5 7 -6 11 z" fill="${alfa(p.cabelo.base, 0.85)}"/>
      <path d="M150 74 l 2.2 4.6 l 5 0.7 l -3.6 3.5 l 0.8 5 l -4.4 -2.4 l -4.4 2.4 l 0.8 -5 l -3.6 -3.5 l 5 -0.7 z" fill="none" stroke="${p.destaque.base}" stroke-width="2"/>
      <path d="M84 82 q 4 -8 10 -12" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="2" stroke-linecap="round" fill="none"/>
      ${BRILHO}`
    },
    {
      id: "cab_flamejante",
      categoria: "cabelo",
      nome: "Cabelo Flamejante",
      descricao: "Não é tinta. É temperatura de entrega.",
      raridade: "lendario",
      tema: "fantasia",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (_p, u) => `
      <defs>
        <linearGradient id="${u}flam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#ff5230"/>
          <stop offset="0.55" stop-color="#ff8a3d"/>
          <stop offset="1" stop-color="#ffd75e"/>
        </linearGradient>
      </defs>
      <path d="M74 96 c -2 -14 2 -26 10 -34 q 2 10 8 12 q -4 -14 4 -24 q 4 10 12 12 q -2 -12 8 -18 q 4 10 12 12 q 2 -10 10 -14 q 2 12 10 16 q 6 -6 6 -14 c 10 10 14 24 12 38 c -10 -16 -26 -24 -46 -24 s -36 8 -46 24 z" fill="url(#${u}flam)">
        <animateTransform attributeName="transform" type="scale" values="1 1;1 1.06;1 1" dur="1.4s" repeatCount="indefinite" additive="sum"/>
      </path>
      <path d="M92 62 q 4 -8 2 -14 M124 50 q 4 -6 2 -12 M150 64 q 6 -6 6 -12" stroke="${alfa("#ffd75e", 0.6)}" stroke-width="2.4" stroke-linecap="round" fill="none">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.1s" repeatCount="indefinite"/>
      </path>`
    },
    {
      id: "cab_fibra_otica",
      categoria: "cabelo",
      nome: "Fibra Óptica",
      descricao: "Cada fio transmite 10Gbps de personalidade.",
      raridade: "epico",
      tema: "cyberpunk",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo", "destaque"],
      render: (p, u) => {
        let fios2 = "";
        for (let i = 0; i < 8; i++) {
          const x = 82 + i * 11;
          const desl = i % 2 ? 6 : -5;
          fios2 += `<path d="M${x} 62 q ${desl} 30 ${desl * 1.5} 62" stroke="${p.cabelo.base}" stroke-width="4" stroke-linecap="round" fill="none"/>
        <circle cx="${x + desl * 1.5}" cy="124" r="2.6" fill="${p.destaque.claro}">
          <animate attributeName="opacity" values="1;0.25;1" dur="${(1.2 + i % 4 * 0.4).toFixed(1)}s" repeatCount="indefinite"/>
        </circle>`;
        }
        return `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      ${fios2}
      <path d="M72 100 c -4 -36 20 -55 48 -55 s 52 19 48 55 c -8 -20 -26 -30 -48 -30 s -40 10 -48 30 z" fill="url(#${u}cab)"/>
      ${BRILHO}`;
      }
    },
    {
      id: "cab_algodao",
      categoria: "cabelo",
      nome: "Algodão-Doce",
      descricao: "Fofo, alto e levemente comestível na aparência.",
      raridade: "raro",
      tema: "casual",
      requerBase: HUMANOIDES,
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>${defsCabelo(u, p.cabelo.claro, p.cabelo.base, p.cabelo.profundo)}</defs>
      <circle cx="92" cy="58" r="19" fill="url(#${u}cab)"/>
      <circle cx="120" cy="44" r="23" fill="url(#${u}cab)"/>
      <circle cx="148" cy="58" r="19" fill="url(#${u}cab)"/>
      <circle cx="76" cy="84" r="15" fill="url(#${u}cab)"/>
      <circle cx="164" cy="84" r="15" fill="url(#${u}cab)"/>
      <path d="M72 100 c -4 -34 20 -52 48 -52 s 52 18 48 52 c -10 -20 -26 -30 -48 -30 s -38 10 -48 30 z" fill="url(#${u}cab)"/>
      <circle cx="104" cy="46" r="3" fill="${alfa("#ffffff", 0.35)}"/>
      <circle cx="136" cy="40" r="2.6" fill="${alfa("#ffffff", 0.3)}"/>
      <circle cx="86" cy="70" r="2.4" fill="${alfa("#ffffff", 0.25)}"/>
      ${BRILHO}`
    }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/partes/premium/rosto.ts
  var tpBarba = (p) => tintaPremium((p.barba ?? p.cabelo).base);
  var tpSobr = (p) => tintaPremium((p.sobrancelha ?? p.cabelo).base);
  function defsPelo(u, t) {
    return `<linearGradient id="${u}pxbrb" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.claro}"/>
      <stop offset="0.45" stop-color="${t.base}"/>
      <stop offset="1" stop-color="${t.profundo}"/>
    </linearGradient>`;
  }
  function fiosBarba(t, ys, densidade) {
    const g = [];
    const rad = Math.PI / 180;
    for (let i = 0; i < densidade; i += 1) {
      const jx = Math.sin(i * 12.9) * 4.2, jy = Math.cos(i * 7.7) * 2.6;
      const x = 84 + 72 / (densidade - 1) * i + jx;
      const y = ys + Math.abs(x - 120) * -0.26 + jy;
      const ang = (96 + Math.sin(i * 2.1) * 12) * rad;
      const len = 1.5 + i % 3 * 0.5;
      const dx = Math.cos(ang) * len, dy = Math.sin(ang) * len;
      const nx = -Math.sin(ang) * 0.5, ny = Math.cos(ang) * 0.5;
      const col = i % 4 === 0 ? alfa(t.profundo, 0.32) : alfa(t.escuro, 0.44);
      g.push(`<path d="M${(x + nx).toFixed(1)} ${(y + ny).toFixed(1)} L ${(x - nx).toFixed(1)} ${(y - ny).toFixed(1)} L ${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)} Z" fill="${col}"/>`);
    }
    return g.join("");
  }
  function bordaBarba(t, ys) {
    const g = [];
    const xs = [92, 102, 112, 120, 128, 138, 148];
    for (let i = 0; i < xs.length; i += 1) {
      const x = xs[i];
      const dy = (i % 2 ? 3 : 6) + i % 3;
      const y = ys + Math.abs(x - 120) * -0.18;
      g.push(`<path d="M${x - 2} ${y} q 2 ${dy} 4 0 z" fill="${alfa(t.escuro, 0.55)}"/>`);
    }
    return g.join("");
  }
  function massaBarba(u, t, queixoY, extra = "") {
    const nucleo = `M84 128 C 80 ${queixoY - 10} 92 ${queixoY - 2} 120 ${queixoY + 8} C 148 ${queixoY - 2} 160 ${queixoY - 10} 156 128 C 148 138 134 142 120 142 C 106 142 92 138 84 128 Z`;
    const clip = `${u}pxbclip`;
    const cheekFade = `${u}pxbfade`;
    const costeleta = `M80 108 C 78 120 80 130 86 136 L 92 134 C 88 126 86 118 86 110 Z M160 108 C 162 120 160 130 154 136 L 148 134 C 152 126 154 118 154 110 Z`;
    return `<defs>
      <clipPath id="${clip}"><path d="${nucleo}"/></clipPath>
      <linearGradient id="${cheekFade}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${alfa(t.base, 0)}"/><stop offset="0.55" stop-color="${alfa(t.base, 0.5)}"/><stop offset="1" stop-color="${t.base}"/></linearGradient>
    </defs>
    <!-- costeletas -->
    <path d="${costeleta}" fill="url(#${u}pxbrb)"/>
    <!-- zona de fade nas bochechas (barba dissolve em pele subindo) -->
    <path d="M86 112 C 84 124 88 134 96 140 C 110 146 130 146 144 140 C 152 134 156 124 154 112 C 150 128 138 136 120 136 C 102 136 90 128 86 112 Z" fill="url(#${cheekFade})"/>
    <!-- núcleo denso do queixo/mandíbula -->
    <path d="${nucleo}" fill="url(#${u}pxbrb)"/>
    <g clip-path="url(#${clip})">
      <!-- densidade: queixo mais cheio (centro-baixo), mandíbula mais rala nas pontas -->
      <path d="M100 ${queixoY - 2} C 108 ${queixoY + 10} 132 ${queixoY + 10} 140 ${queixoY - 2} C 136 ${queixoY + 12} 104 ${queixoY + 12} 100 ${queixoY - 2} Z" fill="${alfa(t.profundo, 0.45)}"/>
      <!-- leve luz no queixo (não banda horizontal): pontinhos §46 -->
      ${fiosBarba(t, queixoY - 6, 9)}
    </g>
    <!-- stubble na zona de fade (skin reveal) + borda quebrada -->
    <g opacity="0.85">${fiosBarba(t, 122, 11)}${fiosBarba(t, 130, 10)}</g>
    ${bordaBarba(t, queixoY + 6)}
    <!-- oclusão sob o lábio inferior (recorte da boca) -->
    <path d="M107 149 Q 120 154 133 149 Q 129 145 120 145 Q 111 145 107 149 Z" fill="${alfa(t.profundo, 0.4)}"/>${extra}`;
  }
  var bigodePath = (t) => `<path d="M104 141 Q 112 136.5 119 139.5 L 120 141 L 121 139.5 Q 128 136.5 136 141 Q 130 145.5 121.5 143.5 L 120 142.6 L 118.5 143.5 Q 110 145.5 104 141 Z" fill="${alfa(t.base, 0.96)}"/>
   <path d="M107 140.4 q 6 -2.6 11 -0.8 M133 140.4 q -6 -2.6 -11 -0.8" stroke="${alfa(t.claro, 0.5)}" stroke-width="0.9" fill="none" stroke-linecap="round"/>`;
  var comumBarba = {
    categoria: "barba",
    raridade: "comum",
    requerBase: HUMANOIDES,
    acabamento: "premium",
    usaCores: ["cabelo"]
  };
  var BARBAS_PREMIUM = [
    {
      ...comumBarba,
      id: "brb_rala",
      nome: "Barba Rala",
      tema: "casual",
      descricao: "Sombra de dois dias, honesta e cansada de reunião.",
      render: (p) => {
        const t = tpBarba(p);
        return `<g opacity="0.55">${fiosBarba(t, 146, 14)}${fiosBarba(t, 154, 11)}</g>`;
      }
    },
    {
      ...comumBarba,
      id: "brb_aparada",
      nome: "Barba Aparada",
      tema: "executivo",
      descricao: "Linha da mandíbula desenhada na régua.",
      render: (p, u) => {
        const t = tpBarba(p);
        return `<defs>${defsPelo(u, t)}</defs>
      <path d="M80 120 Q 86 158 104 165 Q 120 170 136 165 Q 154 158 160 120 L 160 130 Q 152 162 134 168 L 120 170.5 L 106 168 Q 88 162 80 130 Z" fill="url(#${u}pxbrb)"/>
      ${bigodePath(t)}`;
      }
    },
    {
      ...comumBarba,
      id: "brb_cheia",
      nome: "Barba Cheia",
      tema: "casual",
      descricao: "Cobertura completa com pelo em duas luzes.",
      render: (p, u) => {
        const t = tpBarba(p);
        return `<defs>${defsPelo(u, t)}</defs>
      ${massaBarba(u, t, 168, bigodePath(t))}
      <path d="M92 150 q 4 8 10 12 M148 150 q -4 8 -10 12" stroke="${alfa(t.claro, 0.4)}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
      }
    },
    {
      ...comumBarba,
      id: "brb_cavanhaque",
      nome: "Cavanhaque",
      tema: "urbano",
      descricao: "Queixo em foco, resto em silêncio.",
      render: (p, u) => {
        const t = tpBarba(p);
        return `<defs>${defsPelo(u, t)}</defs>
      <path d="M108 152 Q 120 149 132 152 Q 134 166 120 169 Q 106 166 108 152 Z" fill="url(#${u}pxbrb)"/>
      ${bigodePath(t)}
      <path d="M113 158 q 7 3 14 0" stroke="${alfa(t.claro, 0.45)}" stroke-width="1" fill="none" stroke-linecap="round"/>`;
      }
    },
    {
      ...comumBarba,
      id: "brb_bigode",
      nome: "Bigode",
      tema: "clássico",
      descricao: "Só o bigode. Personalidade não precisa de mais.",
      render: (p) => bigodePath(tpBarba(p))
    },
    {
      ...comumBarba,
      id: "brb_costeleta",
      nome: "Costeletas",
      tema: "urbano",
      descricao: "Laterais firmes descendo até a mandíbula.",
      render: (p, u) => {
        const t = tpBarba(p);
        return `<defs>${defsPelo(u, t)}</defs>
      <path d="M78 112 L 90 114 Q 90 136 98 146 L 88 144 Q 80 132 78 112 Z" fill="url(#${u}pxbrb)"/>
      <path d="M162 112 L 150 114 Q 150 136 142 146 L 152 144 Q 160 132 162 112 Z" fill="url(#${u}pxbrb)"/>`;
      }
    },
    {
      ...comumBarba,
      id: "brb_longa",
      nome: "Barba Longa",
      tema: "fantasia",
      descricao: "Massa que desce do queixo com queda real.",
      render: (p, u) => {
        const t = tpBarba(p);
        return `<defs>${defsPelo(u, t)}</defs>
      ${massaBarba(u, t, 166, bigodePath(t))}
      <path d="M100 166 Q 104 190 114 196 Q 120 199 126 196 Q 136 190 140 166 Q 130 176 120 177 Q 110 176 100 166 Z" fill="url(#${u}pxbrb)"/>
      <path d="M112 178 q 2 9 6 13 M128 178 q -2 9 -6 13" stroke="${alfa(t.escuro, 0.5)}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
      }
    },
    {
      ...comumBarba,
      id: "brb_lenhador",
      nome: "Barba Lenhador",
      tema: "casual",
      descricao: "Volume cheio e largo, textura de machado e café.",
      render: (p, u) => {
        const t = tpBarba(p);
        return `<defs>${defsPelo(u, t)}</defs>
      <path d="M76 114 Q 78 168 96 182 Q 120 194 144 182 Q 162 168 164 114 L 164 130 Q 158 176 138 186 L 120 190 L 102 186 Q 82 176 76 130 Z" fill="url(#${u}pxbrb)"/>
      ${massaBarba(u, t, 172, bigodePath(t))}
      <path d="M94 158 q 6 12 14 17 M146 158 q -6 12 -14 17 M120 176 l 0 10" stroke="${alfa(t.claro, 0.35)}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
      }
    }
  ];
  function parSobrancelha(t, d, espessura) {
    const esp = espessura * 0.9;
    const corPrinc = alfa(t.escuro, 0.9);
    return `<g stroke-linecap="round" fill="none">
    <path d="${d}" stroke="${corPrinc}" stroke-width="${esp}"/>
    <path d="${d}" stroke="${alfa(t.claro, 0.32)}" stroke-width="${Math.max(0.7, esp - 2)}" transform="translate(0 -0.7)"/>
    <g transform="translate(240 0) scale(-1 1)">
      <path d="${d}" stroke="${corPrinc}" stroke-width="${esp}"/>
      <path d="${d}" stroke="${alfa(t.claro, 0.32)}" stroke-width="${Math.max(0.7, esp - 2)}" transform="translate(0 -0.7)"/>
    </g>
  </g>`;
  }
  var comumSobr = {
    categoria: "sobrancelha",
    raridade: "comum",
    requerBase: HUMANOIDES,
    acabamento: "premium",
    usaCores: ["cabelo"]
  };
  var SOBR_DEFS = [
    ["sbr_reta", "Reta", "executivo", "M88 96 L 112 95", 3.4],
    ["sbr_arqueada", "Arqueada", "clássico", "M88 97 Q 100 91 112 95", 3.4],
    ["sbr_grossa", "Grossa", "urbano", "M87 96 Q 100 92.5 113 95", 5],
    ["sbr_fina", "Fina", "clássico", "M89 96 Q 101 92.8 111 95", 2],
    ["sbr_angular", "Angular", "gamer", "M88 97.5 L 103 93 L 112 95.5", 3.6],
    ["sbr_suave", "Suave", "casual", "M89 96.5 Q 100 93.5 111 95.5", 3],
    ["sbr_cheia", "Cheia", "casual", "M86.5 96.5 Q 100 91.8 113.5 95.2", 5.6],
    ["sbr_serena", "Serena", "clássico", "M89 95 Q 100 94 111 96", 3],
    ["sbr_marcada", "Marcada", "urbano", "M87 98 Q 101 92 113 94.5", 4.4]
  ];
  var SOBRANCELHAS_PREMIUM = [
    ...SOBR_DEFS.map(([id, nome, tema, d, esp]) => ({
      ...comumSobr,
      id,
      nome: `Sobrancelha ${nome}`,
      tema,
      descricao: `Traço ${nome.toLowerCase()} vivo por cima do cozido da base.`,
      render: (p) => parSobrancelha(tpSobr(p), d, esp)
    })),
    {
      ...comumSobr,
      id: "sbr_unida",
      nome: "Sobrancelha Unida",
      tema: "fantasia",
      descricao: "Uma linha só, sem pedir desculpa.",
      render: (p) => {
        const t = tpSobr(p);
        return `${parSobrancelha(t, "M88 96 Q 100 92.5 113 95", 4.2)}
      <path d="M113 95 Q 120 94 127 95" stroke="${alfa(t.escuro, 0.85)}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      }
    }
  ];
  var comumNar = {
    categoria: "nariz",
    raridade: "comum",
    requerBase: HUMANOIDES,
    acabamento: "premium",
    usaCores: ["pele"]
  };
  var NAR_DEFS = [
    ["nar_reto", "Reto", "executivo", (t) => narizPremium(t, "reto", 0)],
    ["nar_fino", "Fino", "clássico", (t) => narizPremium(t, "fino", 0)],
    ["nar_largo", "Largo", "casual", (t) => narizPremium(t, "largo", 0)],
    ["nar_arrebitado", "Arrebitado", "casual", (t) => narizPremium(t, "arrebitado", -1)],
    ["nar_aquilino", "Aquilino", "fantasia", (t) => narizPremium(t, "aquilino", 1)],
    ["nar_botao", "Botão", "casual", (t) => narizPremium(t, "curto", -1)],
    ["nar_forte", "Forte", "urbano", (t) => narizPremium(t, "largo", 1)],
    ["nar_suave", "Suave", "clássico", (t) => narizPremium(t, "fino", -1)]
  ];
  var NARIZES_PREMIUM = NAR_DEFS.map(([id, nome, tema, corpo]) => ({
    ...comumNar,
    id,
    nome: `Nariz ${nome}`,
    tema,
    descricao: `Perfil ${nome.toLowerCase()} assentado sobre o nariz da base.`,
    render: (p) => corpo(tintaPremium(p.pele.base))
  }));
  function overlayIdade(p, idade) {
    const t = tintaPremium(p.pele.base);
    if (idade === "young_adult") {
      return `<g fill="none">
      <ellipse cx="98" cy="126" rx="7" ry="4.4" fill="${alfa("#ffffff", 0.1)}"/>
      <ellipse cx="142" cy="126" rx="7" ry="4.4" fill="${alfa("#ffffff", 0.1)}"/>
      <path d="M96 122 q 4 -2.4 8 -1.2 M136 120.8 q 4 -1.2 8 1.2" stroke="${alfa("#ffffff", 0.16)}" stroke-width="1.4" stroke-linecap="round"/>
    </g>`;
    }
    return `<g stroke="${alfa(t.escuro, 0.32)}" stroke-width="1.2" fill="none" stroke-linecap="round">
    <path d="M104 82 q 16 -4 32 0 M106 88 q 14 -3 28 0"/>
    <path d="M108 130 Q 104 140 106 148 M132 130 Q 136 140 134 148"/>
    <path d="M84 106 q -4 2 -6 5 M84 111 q -3.4 1.6 -5.4 4 M156 106 q 4 2 6 5 M156 111 q 3.4 1.6 5.4 4"/>
    <path d="M108 158 q 12 4 24 0" stroke="${alfa(t.escuro, 0.22)}"/>
  </g>`;
  }

  // public/components/panels/panel-avatar-studio/src/engine/partes/premium/corpo.ts
  function corpoPremium(p, uid) {
    const t = tintaPremium(p.roupa.base);
    const u = `${uid}pxcv2`;
    return `
    <defs>
      <linearGradient id="${u}l" x1="0" y1="0" x2="1" y2="0.25">
        <stop offset="0" stop-color="${alfa(t.brilho, 0.22)}"/>
        <stop offset="0.45" stop-color="${alfa(t.brilho, 0)}"/>
      </linearGradient>
      <linearGradient id="${u}s" x1="1" y1="0" x2="0" y2="0.2">
        <stop offset="0" stop-color="${alfa("#0b0e1a", 0.26)}"/>
        <stop offset="0.5" stop-color="${alfa("#0b0e1a", 0)}"/>
      </linearGradient>
    </defs>
    <path d="M86 108 c 10 -8 58 -8 68 0 c 8 6 12 26 12 52 c 0 24 -4 44 -10 58 c -22 8 -50 8 -72 0 c -6 -14 -10 -34 -10 -58 c 0 -26 4 -46 12 -52 z" fill="url(#${u}l)"/>
    <path d="M86 108 c 10 -8 58 -8 68 0 c 8 6 12 26 12 52 c 0 24 -4 44 -10 58 c -22 8 -50 8 -72 0 c -6 -14 -10 -34 -10 -58 c 0 -26 4 -46 12 -52 z" fill="url(#${u}s)"/>
    <path d="M120 118 c 2 34 2 66 0 96" stroke="${alfa(t.profundo, 0.14)}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M91 216 h26 l-1 40 q -12 4 -24 0 z" fill="${alfa(t.brilho, 0.08)}"/>
    <path d="M123 216 h26 l-1 40 q -12 4 -24 0 z" fill="${alfa("#0b0e1a", 0.1)}"/>
    <path d="M96 330 q 12 -60 10 -112 M144 330 q -12 -60 -10 -112" stroke="${alfa("#0b0e1a", 0.12)}" stroke-width="3" fill="none"/>`;
  }

  // public/components/panels/panel-avatar-studio/src/engine/render.ts
  function hashTexto(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (h << 5) + h + s.charCodeAt(i) | 0;
    return `av${(h >>> 0).toString(36)}`;
  }
  function hashConfig(config) {
    return hashTexto(JSON.stringify(config));
  }
  function congelarSvg(svg) {
    return svg.replace(/<animate[^>]*\/>|<animate[\s\S]*?<\/animate[^>]*>/g, "").replace(/<animateTransform[^>]*\/>/g, "");
  }
  var SLOTS_CORPO = [
    "acessorio_pernas",
    "acessorio_pes",
    "acessorio_cintura",
    "acessorio_pulso_e",
    "acessorio_pulso_d",
    "acessorio_mao_e",
    "acessorio_mao_d"
  ];
  var TIPOS_CORPO = PRESETS_CORPO;
  var POSTURAS_FIG = {
    confiante: "rotate(-2 120 __CY__)",
    relaxada: "rotate(2.5 120 __CY__)",
    executiva: "rotate(-1 120 __CY__)",
    heroica: "rotate(-1.5 120 __CY__)",
    misteriosa: "rotate(1.5 120 __CY__) translate(0 2)"
  };
  function envolverFigura(svg, config, cy) {
    const corpo = config.corpo ? TIPOS_CORPO[config.corpo] : void 0;
    const postura = config.postura ? POSTURAS_FIG[config.postura] : void 0;
    const fino = config.corpoFino;
    const sx = (corpo?.[0] ?? 1) * (fino?.largura ?? 1);
    const sy = (corpo?.[1] ?? 1) * (fino?.altura ?? 1);
    const escala = sx !== 1 || sy !== 1;
    if (!escala && !postura) return svg;
    const arr2 = (n) => Math.round(n * 1e3) / 1e3;
    const partes = [];
    if (escala) partes.push(`translate(120 ${cy}) scale(${arr2(sx)} ${arr2(sy)}) translate(-120 -${cy})`);
    if (postura) partes.push(postura.replace(/__CY__/g, String(Math.round(cy * 0.82))));
    return `<g transform="${partes.join(" ")}">${svg}</g>`;
  }
  function renderAvatar(config, resolver, opcoes = {}) {
    const uid = opcoes.uid ?? hashConfig(config);
    const p = paletaDe(config.cores);
    const forma2 = opcoes.forma ?? "quadrado";
    const paletaDa = (chave) => {
      const canais = chave ? config.coresCamada?.[chave] : void 0;
      const base = canais && Object.keys(canais).length ? paletaDe({ ...config.cores, ...canais }) : p;
      if (chave === "olhos" && opcoes.premium && config.coresFace?.iris) {
        return { ...base, iris: tinta(config.coresFace.iris) };
      }
      if (opcoes.faceV2 && config.coresFace) {
        if (chave === "barba" && config.coresFace.barba) return { ...base, barba: tinta(config.coresFace.barba) };
        if (chave === "sobrancelha" && config.coresFace.sobrancelha) return { ...base, sobrancelha: tinta(config.coresFace.sobrancelha) };
        if (chave === "boca" && config.coresFace.labios) return { ...base, labios: tinta(config.coresFace.labios) };
      }
      return base;
    };
    const semente = opcoes.faceV2 ? parseInt(hashConfig(config).slice(2), 36) : 0;
    const desvio = (n) => ((semente >>> n) % 7 - 3) / 10;
    const pintar = (id, chave) => {
      if (!id || id === "nenhum") return "";
      const parte = resolver(id);
      let svg2 = parte ? parte.render(paletaDa(chave), uid) : "";
      if (chave) svg2 = aplicarParamsSvg(chave, svg2, config.params?.[chave], id);
      if (chave === "cabelo" && opcoes.premium && /_px_/.test(id)) {
        const chapeu = config.camadas.acessorio_cabeca ?? config.camadas.acessorio;
        const prof = profundidadeRecorte(resolverEstadoCabelo(id, chapeu), config.params?.cabelo?.encaixe);
        if (prof > 0) {
          svg2 = `<clipPath id="${uid}hclip"><rect x="0" y="${49 + prof}" width="240" height="400"/></clipPath><g clip-path="url(#${uid}hclip)">${svg2}</g>`;
        }
      }
      if (chave === "barba" && /^brb_/.test(id)) {
        const rosto = config.camadas.acessorio_rosto ?? config.camadas.acessorio;
        if (resolverEstadoBarba(id, rosto, config.camadas.acessorio_pescoco) === "hidden") return "";
        const fx = fatorBarba(config.base);
        if (fx !== 1) svg2 = `<g transform="translate(120 150) scale(${fx} 1) translate(-120 -150)">${svg2}</g>`;
      }
      if (opcoes.faceV2 && (chave === "olhos" || chave === "boca" || chave === "sobrancelha") && (/_px_/.test(id) || /^sbr_/.test(id))) {
        const partes = [];
        if (config.expressao) {
          const te = transformExpressao(chave, config.expressao.preset, config.expressao.intensidade ?? 1);
          if (te) partes.push(te);
        }
        if (chave === "olhos" && desvio(2)) partes.push(`rotate(${desvio(2)} 120 108)`);
        if (chave === "boca" && desvio(5)) partes.push(`translate(${desvio(5)} 0)`);
        if (chave === "sobrancelha" && desvio(9)) partes.push(`rotate(${-desvio(9)} 120 96)`);
        if (partes.length) svg2 = `<g transform="${partes.join(" ")}">${svg2}</g>`;
      }
      return svg2;
    };
    const idadeSvg = opcoes.faceV2 && config.idade && config.idade !== "adult" && /_px_/.test(config.base ?? "") ? overlayIdade(p, config.idade) : "";
    const fundo = pintar(config.camadas.fundo, "fundo") + pintar(config.camadas.banner, "banner") + pintar(config.camadas.aura, "aura");
    const efeitoDef = config.camadas.efeito && config.camadas.efeito !== "nenhum" ? resolver(config.camadas.efeito) : void 0;
    const efeitoSvg = efeitoDef ? pintar(config.camadas.efeito, "efeito") : "";
    const efeitoAtras = efeitoDef?.atras ? efeitoSvg : "";
    const efeitoFrente = efeitoDef && !efeitoDef.atras ? efeitoSvg : "";
    const moldura = pintar(config.camadas.moldura, "moldura");
    const alto = opcoes.enquadramento === "corpo" && opcoes.palco ? 400 : 240;
    const clip = forma2 === "circulo" && alto === 240 ? `<circle cx="${G.cx}" cy="${G.cx}" r="118"/>` : `<rect width="240" height="${alto}" rx="26"/>`;
    const dim = opcoes.tamanho ? ` width="${opcoes.tamanho}" height="${opcoes.tamanho}"` : "";
    const corpoTodo = opcoes.enquadramento === "corpo" && opcoes.palco;
    const acessorios = pintar(config.camadas.acessorio, "acessorio") + pintar(config.camadas.acessorio_pescoco, "acessorio_pescoco") + pintar(config.camadas.acessorio_cabeca, "acessorio_cabeca") + pintar(config.camadas.acessorio_rosto, "acessorio_rosto") + pintar(config.camadas.acessorio_costas, "acessorio_costas") + pintar(config.camadas.acessorio_olhos, "acessorio_olhos") + pintar(config.camadas.acessorio_orelha, "acessorio_orelha") + pintar(config.camadas.acessorio_flutuante, "acessorio_flutuante") + pintar(config.camadas.acessorio_companheiro, "acessorio_companheiro");
    let premiumSombra = "";
    let premiumAtras = "";
    let premiumFrente = "";
    let premiumPlanoAtras = "";
    let premiumPlanoFrente = "";
    if (opcoes.premium) {
      let temSombraPropria = false;
      const chavesHooks = [...ORDEM_CAMADAS, "fundo", "banner", "aura", "moldura"];
      for (const chave of chavesHooks) {
        const idc = config.camadas[chave];
        if (!idc || idc === "nenhum") continue;
        const def = resolver(idc);
        if (!def) continue;
        const pal = paletaDa(chave);
        if (def.renderSombra) {
          premiumSombra += def.renderSombra(pal, uid);
          temSombraPropria = true;
        }
        if (def.renderAtras) premiumAtras += def.renderAtras(pal, uid);
        if (def.renderFrente) premiumFrente += def.renderFrente(pal, uid);
        if (def.renderPlanos?.atras) premiumPlanoAtras += def.renderPlanos.atras(pal, uid);
        if (def.renderPlanos?.frente) premiumPlanoFrente += def.renderPlanos.frente(pal, uid);
      }
      if (!temSombraPropria) {
        const cyS = opcoes.enquadramento === "corpo" && opcoes.palco ? 394 : 236;
        premiumSombra = `<ellipse cx="120" cy="${cyS}" rx="58" ry="6" fill="rgba(0,0,0,0.25)"/><ellipse cx="120" cy="${cyS}" rx="36" ry="3.6" fill="rgba(0,0,0,0.18)"/>`;
      }
    }
    const narizSvg = config.camadas.nariz && config.camadas.nariz !== "nenhum" ? pintar(config.camadas.nariz, "nariz") : opcoes.premium ? narizPremiumDefaultDaBase(config.base, p.pele.base) : "";
    let conteudo;
    if (opcoes.palco) {
      const itemOlhos = config.camadas.olhos ? resolver(config.camadas.olhos) : void 0;
      const palpebras = itemOlhos && itemOlhos.piscar !== false ? `<g data-anim="palpebras" opacity="0">
          <ellipse cx="${G.olhoEsqX}" cy="${G.olhosY - 1}" rx="12" ry="10" fill="${p.pele.escuro}"/>
          <ellipse cx="${G.olhoDirX}" cy="${G.olhosY - 1}" rx="12" ry="10" fill="${p.pele.escuro}"/>
        </g>` : "";
      if (corpoTodo) {
        const cabeca = pintar(config.base) + idadeSvg + pintar(config.camadas.barba, "barba") + pintar(config.camadas.boca, "boca") + narizSvg + `<g data-anim="olhos">${pintar(config.camadas.olhos, "olhos")}</g>` + pintar(config.camadas.sobrancelha, "sobrancelha") + `<g data-anim="cabelo">${pintar(config.camadas.cabelo, "cabelo")}</g>` + acessorios + palpebras;
        const roupaDef = config.camadas.roupa && config.camadas.roupa !== "nenhum" ? resolver(config.camadas.roupa) : void 0;
        const hookRoupa = opcoes.premium && roupaDef?.renderCorpoV2 ? roupaDef.renderCorpoV2 : roupaDef?.renderCorpo;
        const roupaCorpo = hookRoupa ? hookRoupa(paletaDa("roupa"), uid, perfilCorpoDe(config)) : "";
        const infDef = config.camadas.roupa_inferior && config.camadas.roupa_inferior !== "nenhum" ? resolver(config.camadas.roupa_inferior) : void 0;
        const infCorpo = infDef?.renderCorpo ? infDef.renderCorpo(paletaDa("roupa_inferior"), uid) : "";
        void corpoPremium;
        const corpoV2 = "";
        const sobreDef = config.camadas.roupa_sobre && config.camadas.roupa_sobre !== "nenhum" ? resolver(config.camadas.roupa_sobre) : void 0;
        const sobreCorpo = sobreDef?.renderCorpo ? sobreDef.renderCorpo(paletaDa("roupa_sobre"), uid) : "";
        let acessCorpo = "";
        for (const s of SLOTS_CORPO) {
          const idc = config.camadas[s];
          if (!idc || idc === "nenhum") continue;
          const def = resolver(idc);
          if (!def?.renderCorpo) continue;
          let artC = aplicarParamsSvg(s, def.renderCorpo(paletaDa(s), uid), config.params?.[s]);
          if (opcoes.premium && opcoes.fitV2 && s === "acessorio_pes") {
            const f = fatorSpreadCalcado(perfilCorpoDe(config));
            if (Math.abs(f - 1) > 1e-6) artC = `<g transform="translate(120 0) scale(${+f.toFixed(4)} 1) translate(-120 0)">${artC}</g>`;
          }
          acessCorpo += artC;
        }
        const emblemaCorpo = config.camadas.emblema && config.camadas.emblema !== "nenhum" ? `<g transform="translate(15.8 -30.1) scale(0.85)">${pintar(config.camadas.emblema, "emblema")}</g>` : "";
        conteudo = `<g data-anim="plano-fundo"><g transform="translate(120 200) scale(1.78) translate(-120 -120)">${fundo}${efeitoAtras}</g></g><g data-anim="plano-personagem">${premiumPlanoAtras}${premiumSombra}${premiumAtras}<g data-anim="personagem">` + envolverFigura(
          (opcoes.premium ? corpoInteiroPremium(paletaDa("roupa"), uid, perfilCorpoDe(config)) : corpoInteiro(paletaDa("roupa"), uid)) + corpoV2 + infCorpo + roupaCorpo + sobreCorpo + emblemaCorpo + acessCorpo + // Golden V3 (#219): cabeça premium MENOR → figura ~5.5-6 cabeças de
          // altura (adulto estilizado; antes 0.62 ≈ 4 cabeças/chibi). Âncora
          // do pescoço mantida (busto by≈193 → y≈104). Legado (não-premium)
          // segue 0.62. tx=120-S*120, ty=104-193*S.
          (opcoes.premium ? `<g transform="translate(55.2 -0.2) scale(0.54)">${cabeca}</g>` : `<g transform="translate(45.6 -16) scale(0.62)">${cabeca}</g>`),
          config,
          396
        ) + `${premiumFrente}</g></g><g data-anim="plano-frente"><g transform="translate(120 200) scale(1.8) translate(-120 -120)">${efeitoFrente}</g>${premiumPlanoFrente}</g>`;
      } else {
        conteudo = `<g data-anim="plano-fundo"><g transform="translate(120 120) scale(1.08) translate(-120 -120)">${fundo}${efeitoAtras}</g>${premiumPlanoAtras}</g><g data-anim="plano-personagem">${premiumSombra}${premiumAtras}<g data-anim="personagem">` + envolverFigura(
          pintar(config.base) + idadeSvg + pintar(config.camadas.roupa, "roupa") + pintar(config.camadas.roupa_sobre, "roupa_sobre") + pintar(config.camadas.emblema, "emblema") + pintar(config.camadas.barba, "barba") + pintar(config.camadas.boca, "boca") + narizSvg + `<g data-anim="olhos">${pintar(config.camadas.olhos, "olhos")}</g>` + pintar(config.camadas.sobrancelha, "sobrancelha") + `<g data-anim="cabelo">${pintar(config.camadas.cabelo, "cabelo")}</g>` + acessorios + palpebras,
          config,
          236
        ) + `${premiumFrente}</g></g><g data-anim="plano-frente"><g transform="translate(120 120) scale(1.1) translate(-120 -120)">${efeitoFrente}</g>${premiumPlanoFrente}</g>`;
      }
    } else {
      const personagem = envolverFigura(
        // §5: no z-order do nariz, usa narizSvg (slot autoritativo OU default
        // por-base em premium) — a base não desenha mais nariz. Demais camadas
        // seguem byte a byte.
        pintar(config.base) + idadeSvg + ORDEM_CAMADAS.map((c) => c === "nariz" ? narizSvg : pintar(config.camadas[c], c)).join(""),
        config,
        236
      );
      conteudo = `${fundo}${efeitoAtras}${premiumSombra}${premiumAtras}${personagem}${premiumFrente}${efeitoFrente}`;
    }
    const molduraFinal = corpoTodo ? "" : opcoes.palco && moldura ? `<g data-anim="moldura">${moldura}</g>` : moldura;
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
  function renderDataUri(config, resolver, opcoes = {}) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(renderAvatar(config, resolver, opcoes))}`;
  }

  // public/components/panels/panel-avatar-studio/src/services/Corpo3d.ts
  var ENVELOPE_CORPO = {
    /** ajuste fino §102.2 (validarConfig/PHP) */
    fino: { largura: { min: 0.92, max: 1.08 }, altura: { min: 0.96, max: 1.04 } },
    /** escala FINAL aplicada ao personagem (Renderizador3d desde §412) */
    escala: { largura: { min: 0.88, max: 1.15 }, altura: { min: 0.9, max: 1.07 } },
    /** morfo normalizado do body.v2 (0 = neutro, omitido) */
    morfo: { min: -1, max: 1 },
    /** escala de um SEGMENTO (bone scaling §318 — as6.corpo_v2) */
    segmento: { min: 0.92, max: 1.1 }
  };
  var MORPHS_CORPO = {
    ombros: { id: "ombros", nome: "Ombros", bones: ["clavicle_l", "clavicle_r"], eixo: "xyz", alcance: 0.1 },
    torax: { id: "torax", nome: "Tórax", bones: ["spine_02", "spine_03"], eixo: "xz", alcance: 0.09 },
    cintura: { id: "cintura", nome: "Cintura", bones: ["spine_01", "pelvis"], eixo: "xz", alcance: 0.1 },
    bracos: { id: "bracos", nome: "Braços", bones: ["upperarm_l", "upperarm_r", "lowerarm_l", "lowerarm_r"], eixo: "xyz", alcance: 0.08 },
    pernas: { id: "pernas", nome: "Pernas", bones: ["thigh_l", "thigh_r", "calf_l", "calf_r"], eixo: "xyz", alcance: 0.08 }
  };
  function migrarTipoParaPreset(tipo) {
    return tipo && tipo in PRESETS_CORPO ? tipo : null;
  }
  var cl = (v, o) => Math.min(o.max, Math.max(o.min, v));
  function sanitizarCorpoV2(bruto) {
    if (!bruto || typeof bruto !== "object") return null;
    const b = bruto;
    const saida = {};
    const preset = migrarTipoParaPreset(typeof b.preset === "string" ? b.preset : null);
    if (preset) saida.preset = preset;
    if (b.morfos && typeof b.morfos === "object") {
      const morfos = {};
      for (const id of Object.keys(MORPHS_CORPO)) {
        const v = Number(b.morfos[id]);
        if (!Number.isFinite(v)) continue;
        const c = Math.round(cl(v, ENVELOPE_CORPO.morfo) * 100) / 100;
        if (c !== 0) morfos[id] = c;
      }
      if (Object.keys(morfos).length) saida.morfos = morfos;
    }
    return Object.keys(saida).length ? saida : null;
  }

  // public/components/panels/panel-avatar-studio/src/nucleo/flags.ts
  var PADROES = {
    "as6.vc_3d": false,
    // Briefing 2 — modo 3D dentro do VC (motor 3D reusado); default OFF (§651); requer as6.visual_composer
    "as6.vc_touch44": true,
    // C9 (§UX toque) — alvos de toque >=44x44 no MOBILE do VC; §651 OFF = geometria atual byte a byte
    "as6.vc_hotspots": true,
    // C9b (§UX hotspots) — regioes de corpo [data-hotspot] focaveis/auditaveis no palco visual; §651 OFF = sem os botoes (hit-test por coordenada inalterado)
    "as6.shell_vc3d": false,
    // rodada unificacao 3D (decisao #160) — o botao 3D do ShellStudio abre o VisualComposer3D COMPARTILHADO em tela cheia (2D desmontado), aposentando Palco3d/Estudio3D do caminho do usuario; default OFF (§651); requer as5.novo_shell
    "as6.mobile_header_v2": false,
    // lote header mobile canônico (doc 23) — o VC declara data-shell-titlebar="own" e não duplica a safe area; default OFF, fail-closed; OFF = shell/VC byte a byte
    "as6.shell_layout_v2": false,
    // #88 shell responsivo (sidebar expandir/recolher + gaveta mobile, main fluido, footer no fluxo) — módulo app-shell/layout-v2; separada do header v2 e composta com ele; default OFF, fail-closed; OFF = shell byte a byte
    "as6.visual_composer": false,
    // frente VC — compositor visual (modos internos Visual/Guiado/Avancado); default OFF, fail-closed; OFF = shell atual byte a byte
    "as5.novo_shell": true,
    // F2 — LIGADA no rollout §650 (2026-08-04, veredito visual do Jhony); rollback §651 = voltar p/ false
    "as5.registry_api": false,
    // F1 — catálogo servido pelo registry
    "as5.estado_api": false,
    // F1 — persistência via §619 (leitura dual)
    "as5.undo_redo": true,
    // F1 — pilhas de comando na UI
    "as5.photo_studio": false,
    // F6
    "as5.ia_assistiva": false,
    // F8
    "as5.palco3d": true,
    // mega 7 — LIGADA no rollout §650 (o motor 3D segue opt-in: só carrega no clique do botão)
    "as5.hud3d": false,
    // mega 28 — HUD de performance do palco 3D (dev)
    "as5.telemetria_painel": false,
    // mega 46 — viewer local de telemetria (dev)
    "as5.consultor": true,
    // lote 121–130 — consultor de estilo POR REGRAS (client-only; §651 desliga)
    "as5.foto_galeria": true,
    // lote 211–220 — galeria de templates de foto (filtro/favoritos/destaque §326); §651 desliga p/ lista simples
    // ── lote 221–230 (decisão #50: LIGADAS no padrão, rollback §651 = false) ──
    "as5.foto_canvas_pro": true,
    // megas 221–225 — Photo Studio PRO: 3 regiões §323, canvas §324, snapping §324.2, título-componente §344, emblemas §345
    "as5.showcase_editor": true,
    // megas 226–227 — editor de showcase §175 + modo automático §175.1 (palco 3D)
    "as5.timeline_shell": true,
    // mega 228 — linha do tempo unificada §220 no shell
    "as5.favoritos_categorias": true,
    // mega 229 — favoritos rápidos/permanentes/por coleção §229
    "as5.vitrine_pessoal": true,
    // mega 230 — Minha Vitrine §1076 + galerias locais §1077 (client-side)
    // ── onda 231–260 (decisão #53; padrão ON conforme #50) ──
    "as5.palco_v2": true,
    // lote 231–240 — cenários §160 + horas §162 + propriedades §161 + poder §154 + preview §155 + editores §167–§172
    "as5.progressao_v2": true,
    // lote 241–250 — coleções §207–§214 + conquistas §215–§221 + economia §226–§228 + comparação §231
    "as5.criacao_avancada": true,
    // lote 251–260 — tipo corporal §102 + postura §118 + presets faciais §105 + idle 2D §119
    // ── onda 261–310 (decisão #55; padrão ON conforme #50) ──
    "as5.palco3d_v2": true,
    // lote 261–270 — A5 sem UBC: vida §440–§441, ambiente §449, tone mapping §457–§458, partículas §444–§446, rim §452, enquadrar §454
    "as5.fundacoes_v2": true,
    // lote 271–280 — A6: manifest §267, tokens §283–§289, logging §291 v2
    "as5.poderes_familia": true,
    // lote 281–290 — poderes por família §153.1–.4 + partículas §156
    "as5.microinteracoes": true,
    // lote 291–300 — progressão v3 + microinterações
    // ── onda 311–410 (decisão #57; padrão ON conforme #50) ──
    "as5.foto_fina": true,
    // lote 311–320 — nitidez §333, formas §340–341, JPEG §369, marca §372, galeria §326 v2
    "as5.palco_sensorial": true,
    // lote 321–330 — som ambiente §161/§178, crossfade §157.4, presença §157.5, luz avançada §164.3
    "as5.palco3d_cine": true,
    // lote 331–340 — câmera §176, pós 3D §457/§177, poses v2 §443
    "as5.presets_v2": true,
    // lote 341–350 — §197–§205
    "as5.efeitos_v2": true,
    // lote 351–360 — categorias §157 + editor §158
    "as5.temporadas": true,
    // lote 361–370 — §245/§248/§251/§252 local
    "as5.portabilidade": true,
    // lote 371–380 — §254/§255/§309/§310
    "as5.orcamento_perf": true,
    // lote 381–390 — §182–§184/§186.1/§274
    "as5.catalogo_v2": true,
    // lote 391–400 — §61/§75/§88/§92/§94
    // ── onda 411–510 (decisão #59; padrão ON conforme #50) ──
    "as5.i18n": true,
    // lote 411–420 — §296 fundação PT/EN
    "as5.busca_v2": true,
    // lote 421–430 — §57.1–.3/§58
    "as5.cards_v2": true,
    // lote 431–440 — §60.9–.10/§66
    "as5.editor_efeitos": true,
    // lote 441–450 — §158/§158.1
    "as5.pos3d_real": true,
    // lote 451–460 — §457/§177 composer
    "as5.analytics_local": true,
    // lote 461–470 — §292–§294 local
    "as5.luz_contextual": true,
    // lote 471–480 — §164.2/§165
    "as5.memorias_v2": true,
    // lote 481–490 — §203/§244/§247
    "as5.a11y_v2": true,
    // lote 491–500 — §297 setas/live
    // ── onda 511–610 (decisão #61; padrão ON conforme #50) ──
    // (i18n de cobertura usa a as5.i18n existente — decisão #62)
    "as5.foto_entrada": true,
    // lote 531–540 — §321.1–.2 avatar/preset → foto
    "as5.foto_pro2": true,
    // lote 541–550 — §335–§348/§359–§371 restos
    "as5.roupas_camada": true,
    // lote 551–560 — §72–§74
    "as5.criacao_fina": true,
    // lote 561–570 — §102.2/§340–341/§68
    "as5.palco_v3": true,
    // lote 571–580 — §176.1/§178.2/§157 restos
    "as5.infra_v3": true,
    // lote 581–590 — §268/§277/§299–300
    "as5.ux_final": true,
    // lote 591–600 — §59.1/§60/§64.2/§545+
    // ── onda 611–710 (decisão #64; padrão ON conforme #50) ──
    "as5.assembler3d": true,
    // lote 621–630 — Character Assembler §406 + partes §423
    "as5.roupas3d": true,
    // lote 631–640 — roupas §415–§417 (body masking §415.2)
    "as5.materiais3d": true,
    // lote 641–650 — Material Manager §419 + canais §73→3D (§420–§421)
    "as5.cabelo3d": true,
    // lote 651–660 — barba como slot próprio §425 + combinações cabelo+barba + famílias §423
    "as5.morfos3d": true,
    // lote 651–660 — morfos estruturais §412–§414 via escala (tipo §102 + fino §102.2 no 3D)
    "as5.animacao3d": true,
    // lote 661–670 — animation manager §432 + máquina §433 + pacote UAL §436 + olhar §439
    "as5.classico_aaa": true,
    // lote 671–680 — layout AAA do Modo Clássico (briefing complementar; decisão #68); off = layout anterior byte a byte
    "as5.progressivo3d": true,
    // lote 681–690 — LOD por tela §462 + lod2-primeiro §470 + IndexedDB §475 + loading manager §472
    "as5.quality3d_v2": true,
    // lote 691–700 — perfis ultra/cine §482.1 + DPR dinâmico §483
    "as5.captura3d_v2": true,
    // lote 691–700 — captura §506/§329: LOD alto + supersampling + formatos + indicador §329.3
    // ── onda 721+ (decisão #72; padrão ON conforme #50) ──
    "as5.foto3d": true,
    // lote 721–730 — Foto×3D §329: captura com o ESTADO do usuário (cores §420 + corpo §414 + pose Idle UAL) + super 2× + fases §329.3
    "as5.ual_extra": true,
    // lote 731–740 — multi-pacote §432: ual_extra (emotes UAL2: Yes/FoldArms/TalkingPhone/Carry/ChestOpen) soma ao básico
    // ── programa AS6 (decisões #74–#76; numeração § do AVATAR_STUDIO_6.md) ──
    "as6.estado_vnext": true,
    // lote 751–760 — L0: migrações de schema (§3393) + capability registry (§3396) + dependências de flags (§3398); off = flag() plano como antes
    "as6.viewport": true,
    // lote 781–790 — L2: presets manuais de câmera 2D §52/§84 (Auto/Rosto/Busto/Corpo persistidos); off = só o enquadramento automático R2, byte a byte
    "as6.dock": true,
    // lote 791–800 — L2: estados de card v2 §644/§111 (selo EQUIPADO ≠ foco ≠ prévia, hover elevado por token); off = cards anteriores byte a byte
    "as6.color_studio": true,
    // lote 811–820 — L3: Color Studio §206–§212 (HSL por slot + harmonias derivadas); off = swatches anteriores byte a byte
    "as6.dock_classico": true,
    // lote 831–840 — Asset Dock v3 do clássico §103–§105 (wheel→horizontal, drag, setas, cards visuais); off = trilho anterior byte a byte
    "as6.paineis_dock": true,
    // lote 841–850 — abas de PAINEL (arquétipo/título/presets/coleções/conquistas/vitrine/IA/histórico/foto) abaixo do preview (pedido visual do Jhony 2026-08-08); off = lateral anterior byte a byte
    // ── MEGA ONDA VISUAL 851+ (decisão #88; ordem do Jhony: máximo de UI/UX, validação no final) ──
    "as6.paineis_cards": true,
    // lote 851–860 — painéis do inferior em GRADES de cards (game UI): presets/arquétipos/títulos/coleções lado a lado; off = listas verticais
    "as6.sidebar_pro": true,
    // lote 861–870 — sidebar do clássico com modo SÓ-ÍCONES persistido + tooltips + ativo mais claro; off = sidebar anterior
    "as6.visual_v2": true,
    // lote 871–880 — elevação visual: palco sem cartão (§29/§43), profundidade no workspace, transição suave de aba; off = visual anterior
    "as6.workspace_fixo": true,
    // lote 881–890 — workspace TRAVADO na viewport (zero scroll de página; nav e inferior com scroll próprio) + chips de filtro compactos no trilho; off = fluxo anterior
    "as6.meta_assets": true,
    // lote 891–900 — METADADOS de asset §150–§153/§227: autor/origem/licença/versão + tags pesquisáveis (operador tag: e chips no drawer); off = ficha anterior byte a byte
    // ── MEGA ONDA 911–1110 (decisão #92) ──
    "as6.inspector": true,
    // lote 921–930 — Inspector contextual §181–§189: accordion schema-driven por categoria (identidade/props/cores/compat/ações) com memória §186; off = seção Cores+Propriedades anterior byte a byte
    "as6.creator_v6": true,
    // lote 931–940 — vestuário multi-peça §3393: categoria Sobrepeça (wrappers sob_* de renderCorpo existente; schema v2 com migração real); off = categoria oculta (config salvo segue aceito e renderizando)
    "as6.dock_mag": true,
    // lote 941–950 — dock §104–§105: magnificação gaussiana no hover (CSS scale), momentum com atrito no drag e snap no card; off = interações do lote 831–840 byte a byte
    "as6.contexto": true,
    // lote 951–960 — Workspace Context Engine §323–§325: trocar categoria coordena aba/busca/grupo do inspector/anúncio num evento só; off = troca de categoria anterior byte a byte
    "as6.diff_v6": true,
    // lote 961–970 — diff campo a campo §350/§322: "Detalhes" na barra de salvamento com de→para legível + histórico local de salvamentos (ring ≤10); off = barra anterior byte a byte
    "as6.foto_projeto": true,
    // lote 971–980 — Photo Project v2 §1417/§1226/§1227: schema versionado + snapshot do avatar-fonte + "atualizar p/ avatar atual"; off = projetos v1 byte a byte (antigos abrem sempre §1418)
    "as6.foto_camadas": true,
    // lote 981–990 — Layer System da foto fase 1 §1215/§1217/§1219: ordem da pilha de fundo + lock + solo no painel de camadas; off = painel do lote 161-164 byte a byte
    "as6.virtual": true,
    // lote 1011–1020 — virtualização REAL §276 v2: janela deslizante (card longe recicla p/ esqueleto; foco/hover/equipado nunca reciclam); off = promoção one-way anterior byte a byte
    "as6.quality": true,
    // lote 1021–1030 — Quality Manager central (AS6 Parte 9): perfil Auto/Eco/Equilibrado/Alto consultado por 3D (dica de tier), shell ([data-qualidade] → CSS eco) e partículas; off = decisões locais anteriores byte a byte
    "as6.touch": true,
    // lote 1031–1040 — touch+dnd (AS6 Parte 6): arrastar card ao palco equipa (HTML5 DnD, realce de alvo) + touch-action na dock; off = sem draggable/drop byte a byte
    "as6.derivados": true,
    // lote 1051–1060 — derivados com reflow (AS6 Parte 11): posições manuais refluem p/ a célula de texto dos formatos wide com clamp (via opcoes.reflowPos) + painel de derivados ao vivo na Foto; off = wide anterior byte a byte
    "as6.cms_ro": true,
    // lote 1061–1070 — CMS read-only (AS6 Parte 15): drawer admin que LISTA assets/licenças/auditoria via cms.php (GET + AdminGate fail-closed; zero escrita); off = sem comando/drawer
    "as6.vida_shell": true,
    // lote 1071–1080 — VIDA no shell novo (regressão da auditoria FASE 0): respiração/piscada/balanço no viewport (receita do PalcoCinema); §297 respeitado; off = viewport estático anterior
    "as6.workers": true,
    // lote 1091–1100 — worker pool (AS6 Parte 9): thumbs/miniaturas re-encodadas fora da main thread com TIMEOUT e fallback síncrono sempre; off = caminho síncrono anterior byte a byte
    "as6.dock_inferior": true,
    // onda 1111 (pedido visual do Jhony 2026-08-09 — decisão #112): shell novo com a MESMA estrutura do clássico AAA — nav esquerda, preview central dominante com fit-to-view, biblioteca em DOCK HORIZONTAL inferior (reuso do DockAssets/trilho); off = coluna direita anterior byte a byte
    // ── onda 1121–1220 (decisão #113; padrão ON conforme #50) ──
    "as6.tour_v6": true,
    // lote 1121–1130 — tour §568 v2 apresenta o layout do #112 (dock/alturas/Cenário/câmera); off = roteiro anterior byte a byte
    "as6.motion_v2": true,
    // lote 1131–1140 — aceites §568 da Parte 7: altura da dock ANIMADA, troca de categoria com fade curto, animações CSS pausadas com a aba oculta; reduced-motion desliga tudo; off = cortes secos anteriores
    "as6.light_v6": true,
    // lote 1141–1150 — Light Mode REAL §578 (direção própria, não dark invertido): rampa fria de estúdio sem branco puro, profundidade por luminosidade §577, sombras leves; off = claro do #112 byte a byte
    "as6.nav_dock": true,
    // lote 1151–1160 — dock 100% operável por teclado (AS6 Parte 6): B foca a biblioteca, D cicla a altura, PageUp/Down paginam o trilho, foco navegado rola suave; off = navegação anterior
    "as6.workers_v2": true,
    // lote 1161–1170 — workers fase 2 (AS6 Parte 9): ENCODE de export de foto (PNG/JPEG grandes) fora da main thread via ImageBitmap transferido; timeout+fallback síncrono sempre; off = toDataURL de sempre
    "as6.perf_baseline": true,
    // lote 1171–1180 — baseline de RUNTIME local (AS6 Parte 9): marks/measures das interações-chave (troca de categoria, equipar) fechadas pós-paint + long tasks; window.__avstPerf p/ suíte/dev; off = zero marks
    "as6.cms_ro2": true,
    // lote 1181–1190 — CMS RO fase 2 (AS6 Parte 15): busca sanitizada + filtro de categoria + ficha de detalhe + export CSV client-side no drawer; segue GET-only/AdminGate; off = drawer do #108
    "as6.ia_apply": true,
    // lote 1191–1200 — IA apply PARCIAL (AS6 Parte 12): a sugestão vira lista de mudanças campo a campo com checkbox; aplica só o selecionado (merge determinístico + validarConfig + §636); off = botão "aplicar tudo" anterior
    "as6.contextos_v6": true,
    // lote 1201–1210 — Universal Avatar Component fase 1 (AS6 Parte 13): montarAvatarUniversal (espelho §619 + live update + placeholder) exposto em window.AvatarStudioUniversal; drawer de contextos consome o MESMO caminho; off = mocks anteriores
    // ── onda 1221–1270 (decisão #124; padrão ON conforme #50) ──
    "as6.mobile_v6": true,
    // lote 1241–1250 — telas estreitas: SWIPE vertical no topo da dock cicla altura/recolhe, alça visual, tooltips na nav estreita; off = interações anteriores byte a byte
    "as6.layouts": true,
    // lote 1251–1260 — layouts nomeados do workspace (AS6 Parte 1): 3 slots A/B/C na paleta salvam/aplicam a geometria (nav, painel/dock, recolhido); off = sem comandos
    // ── onda 1291+ (decisões #133–#134; padrão ON conforme #50) ──
    "as6.dock_fit": true,
    // onda 1291 — dimensionamento CAUSAL do workspace (briefing UX do Jhony 2026-08-10): altura real disponível medida (nunca 100vh−150px fixo), dock com altura relativa ao corpo (cqh) e cards que PREENCHEM a faixa (nunca cortados), divisor redimensionável com teclado + persistência v2 validada; off = geometria do #112 byte a byte
    "as6.ctx_barra": true,
    // onda 1291 — a dica de contexto §323–§325 sai da pill de anúncio (fundo escuro fixo) e vira BARRA contextual legível por tokens, com título/texto orientado à ação e dispensa persistida; off = anúncio de sempre byte a byte
    "as6.corpo_preview": true,
    // onda 1294 (pedido visual do Jhony 2026-08-10) — nas categorias Roupa/Sobrepeça (e no preset manual "Corpo") o PREVIEW e as THUMBS dos cards usam o render de CORPO INTEIRO 240×400 do motor (goldens g09/g16); off = busto de sempre byte a byte
    // ── mega onda 1301+ (briefings do Jhony 2026-08-11; decisões #140+) ──
    "as6.acess_v2": true,
    // lote 1301–1310 — ACESSÓRIOS multi-slot: slots finos aditivos (olhos/orelha/costas/flutuante/companheiro) + registry de subcategorias em dados + conflitos declarados; equipar usa o slot fino do registry; off = 3 slots da decisão #41 byte a byte
    "as6.acess_hub": true,
    // lote 1311–1330 — categoria-mãe: hub de subcategorias por região (contagens/equipados), breadcrumb, dock filtrada por subcategoria, equipados agrupado + resumo; off = grade única anterior byte a byte
    "as6.nav_grupos": true,
    // lote 1331–1340 — navegação em MACROGRUPOS (Personagem/Vestuário/Expressão/Ambiente/Identidade) mapeando conteúdo existente; off = lista plana anterior byte a byte
    "as6.tax_v2": true,
    "as6.tax_cms": false,
    // onda 1381 (#148) — hidrata a taxonomia do CMS (api/avatar/taxonomia.php); OFF até o RUNBOOK-BANCO popular avatar_category_groups; off/204 = registry estático byte a byte           // onda 1361+ (#145/#146) — TAXONOMIA v2: várias categorias-mãe (acordeão) + principais na sidebar, subcategorias na dock; "Acessório" deixa de ser botão único (segue como tipo técnico); off = navegação #143/#144 byte a byte
    // ── mega programa 1401+ (POPULAÇÃO + ELEVAÇÃO; decisões #150+; padrão ON conforme #50) ──
    "as6.thumb_item": true,
    // onda 1401 — thumbnails MODO ITEM (elevação §12): card de acessório mostra o ASSET isolado (viewBox por bounds MEDIDOS baked em modoItem.ts, fundo neutro, ocupação ~78%); hover/toggle = Modo Aplicado; off = avatar com foco §39.19 byte a byte
    "as6.variantes": true,
    // ── frente AAA — MEGA_BRIEFING_01 (decisão #156: pai da árvore; cada filha nasce na onda que a consome) ──
    "as6.looks": false,
    // onda 1408 — LOOKS do registry Looks3d (§1756–§1767, #161): luz do palco vem do registry (estudio@1 byte-idêntico; aliases quente→soft, fria→cool), chips Retrato/Dramática, tone mapping vira dev-only; OFF até validação visual; off = definirLuz legado byte a byte
    "as6.material_v2": false,
    // onda 1408 — METADADOS de material do manifest v2 no pipeline (Parte 7, #160/#165a): canal pele das bases UBC por metadado (skin tint passa a valer), naoTingir, famílias declaradas; OFF até before/after aprovado; off = pipeline anterior byte a byte
    "as6.telemetria_assets": true,
    // onda 1409 — TELEMETRIA DE ASSET 3D (§2804, §2968–§2972): eventos avst:asset_* (carregou/falhou/lod_transicao/fallback/parte) no ring local + EventBus, com rate limit por slug e sem PII; dado/observabilidade (#156: tooling ON); off = zero eventos (callback ausente)
    "as6.classico_premium": false,
    // onda 1411 — trilho CLASSIC PREMIUM 2D (decisão #159, §2381–§2427): acabamento 'premium' no config liga sombra de contato + hooks das partes `_px_` (renderAtras/renderFrente/renderSombra/renderPlanos) + materiais2d; catálogo passa a listar as partes premium; off = motor clássico e catálogo byte a byte
    "as6.arte_v2": false,
    // Golden V3.1 (#219-R1) — ARTE ELEVADA 2D (Golden V2/V3): corpo anatômico + rosto/olhos/nariz reconstruídos + cabelo por clumps + barba c/ fade + roupa autoral + material por dobra + estúdio FG vazio. svgDe só liga o premium quando classico_premium E arte_v2 ON; off = motor CLÁSSICO byte a byte. SEM rollout global até aprovação humana do Gate A (veredito 2026-08-23)
    "as6.hero_2d": false,
    // Golden A+2 — HEROES 2D AUTORADOS: itens `_hx_` (engine/partes/heroes.ts) importados de SVG autorado (importarHeroAsset) entram no catálogo SÓ com esta flag (mais restrita que classico_premium); render elevado quando o trilho premium está ON. off = catálogo sem heroes, byte a byte. SEM rollout até veredito humano
    "as6.fit_v2": false,
    // Golden A+2 — FIT ENGINE dirige a GEOMETRIA: (a) silhueta do blazer premium por engine/fit.silhuetaFit(anatomia, classe) em vez de folga hard-coded, e (b) CALÇADO ancorado ao pé por perfil (fatorSpreadCalcado). off = geometria hand-tuned atual byte a byte (A/B reversível, §651). Depende de arte_v2
    "as6.camera_v2": false,
    // onda 1419 — CÂMERA V2 do palco 3D (#204, P8-B): presets Camera3d (FOV 24/28/33, headroom/eye-line), bookmarks Full/Bust/Face/Back, bounds-aware, transição 300ms interromível, guard #165d (nunca reseta) e limites de órbita; off = câmera anterior byte a byte
    "as6.sombras_v2": false,
    // onda 1419 — SOMBRAS/AMBIENTE V2 (#205, P8-C): shadow map por tier (512/1024/2048), shadow camera justa no Box3, bias/softness e FOG por look, contact shadow procedural sempre; chão gloss/platform/grid e definirEnvironment(url) são APIs opt-in; off = sombras anteriores byte a byte
    "as6.pos_v2": false,
    // onda 1420 — PÓS V2 por look (#206, P8-D §1965–§1977): cadeia Render→Bloom→ColorGrade(proteção de pele)→Vignette declarada em Look.pos, degradação por pass via QualityManager.passesPos, composer recriado em context loss, telemetria p3d_pos_fallback; estudio = pós NEUTRO (contrato); off = composer/CSS antigos byte a byte
    "as6.dev_iluminacao": false,
    // onda 1420 — PAINEL DEV de iluminação (#206, §2015): sliders key/fill/rim/bloom sobre o look atual no palco 3D (ajustarLuzDev — nunca persiste, reaplicar o look restaura); dev-only; off = sem UI, render intocado
    "as6.foto_lentes": false,
    // onda 1420 — LENTES do Photo 3D (#207, P8-E §2007–§2027): registry LentesFoto (Portrait/Full/Fashion/WideHero/Profile/Close-up, aspectos 4:5 e 9:16, look por lente, regra dos terços), captura alta com shadow↑ + pós só na captura e RESTAURO total, determinística; off = captura 960×960 anterior byte a byte
    "as6.corpo_v2": false,
    // onda 1422 — BODY API v2 (#210/#211, P2-B/C/E): corpoV2 {preset, morfos} consumido no 3D (morph targets `corpo_*` quando o asset tiver, senão bone scaling por segmento clampado ao envelope) + perfis de postura 3D; o dado corpoV2 é aceito/persistido SEMPRE (forward-compat); off = escala §412 anterior byte a byte
    "as6.corpo_grounding": false,
    // onda 1422 — GROUNDING (#211, §P2-E): re-ancora os pés no chão (Box3.min.y → 0) após escala/morfos; off = posição anterior byte a byte
    "as6.ux3d_simples": false,
    // onda 1423 — UI 3D SIMPLIFICADA (BRIEFING_CORRETIVO_01 §52–§70, #213): controles técnicos (qualidade, pós, tinta, turntable/ficha, exposição, movimento de câmera, dev) saem do fluxo principal p/ "Avançado"; o palco vira Character Creator (§53); off = UI anterior byte a byte; entra no Candidate Mode
    "as6.thumb_item_v2": false,
    // onda 1425 — ASSET CLARITY (BRIEFING_COMPLEMENTAR_02, #217): card = peça ISOLADA em TODA categoria (não só acessório), fundo=environment, camadas do cabelo montadas (back+front), card NÃO troca no hover (só o palco recebe o preview), DetalheAsset com hero isolado + "no seu avatar"; off = thumbs anteriores byte a byte; entra no Candidate Mode
    "as6.catalogo_v2": false,
    // #54 catalogo visual V2 do VC: grid 2-col, preview com foco canonico (focoItemDe), fundo translucido, equipado inequivoco. OFF = catalogo classico byte a byte.
    "as6.cp_foto": false,
    // onda 1418 — PHOTO MODE 2D do avatar (#202, P10-G): export em framings (full/bust/portrait/square/vertical) PNG/WebP/transparente com toggles de fundo/moldura/efeito; off = sem UI de export, render intocado
    "as6.acess_2d_premium": false,
    // onda 1416 — ACESSÓRIOS PREMIUM 2D (#196, P10-E/P6-A/P6-E): contador + "Remover todos" + conflito nomeado (AcessoriosRegistry §617) + aviso de paridade na UI; catálogo ace_px_ já é gated por classico_premium; off = UI anterior byte a byte
    "as6.roupa_premium": false,
    // onda 1415 — VESTUÁRIO PREMIUM (#191, P10-D/P5-B/P5-C): categoria roupa_inferior (rin_*) na sidebar, conjuntos premium O01+ e swatch de material na UI; off = seção/outfits ocultos, configs salvos seguem renderizando (dado > UI)
    "as6.vestuario_separado": false,
    // decisao #51 — vestuario 2D separado (superior/calca/calcado) no VC; canario u75; off = grupo Roupa unico byte a byte
    "as6.face_v2": false,
    // onda 1414 — ROSTO V2 (#162, Partes 3/5): categoria nariz na sidebar, expressão semântica + idade + assimetria determinística aplicadas por wrappers SÓ nas artes v2, canais coresFace.sobrancelha/barba/labios na paleta, Face Idle Profiles; off = render/UI byte a byte (dados salvos seguem aceitos)
    "as6.barba_slot": false,
    // onda 1414 — categoria BARBA visível (artes brb_*; compat máscara/cachecol em engine/compat-rosto.ts); off = seção oculta, config salvo segue renderizando
    "as6.brow_slot": false,
    // onda 1414 — categoria SOBRANCELHA visível (artes sbr_* como overlay sobre o traço cozido); off = seção oculta, config salvo segue renderizando
    "as6.single_2d": false,
    // GOLDEN V4.2 (§1/§36/§58, decisão #64) — PRODUTO 2D ÚNICO: esconde da experiência principal as ações de troca de modo ("Modo clássico" na BarraTopo + "Voltar ao modo clássico" na paleta). Compat/QA continua acessível só sob as6.qa_route (§37); o error-boundary de recuperação permanece sempre (segurança §2). off = experiência atual byte a byte (produção intocada). Puro conditional render — sem campo serializado novo, sem mirror PHP.
    "as6.qa_route": false,
    // onda 1410 — ROTA DE QA VISUAL (§2707–§2742): QaStudio (chunk lazy) na paleta — LOD forçado, looks, overlays, calibração, screenshot 1-click, inspector técnico (manifest/health/renderer.info); dev, nada persiste; off = sem comando/chunk, render intocado
    "as6.material_debug": false,
    // onda 1410 — DEBUG DE MATERIAIS no QaStudio (§1686–§1690): lista materiais do personagem (tipo, roughness/metalness, mapas); off = bloco ausente
    "as6.qa_visual": false,
    // onda 1408 — LABORATÓRIO de QA visual (§105, §107–§109, §141–§146): overlays clay/normals/wireframe/silhueta/grayscale + cena de calibração com color checker no palco 3D (dev); off = sem UI, render intocado
    "as6.avatar_visual_v2": false,
    // onda 1406 — QUALIDADE VISUAL como dado (§68–§69, #157): tag/ficha de qualidade no drawer, filtro "nunca prototype" no Estúdio 3D (PoC) e destaque; OFF até validação visual do Jhony (§2920); off = UI byte a byte (a derivação em dados existe sempre)
    "as6.slots_corpo": true
    // onda 1404 — SLOTS CORPORAIS (elevação §15/§16, decisão #154): pulso_e/d, mao_e/d, cintura, pernas, pes como extensão do #140; arte via renderCorpo (só no corpo inteiro; busto intocado); off = 8 slots do #140 byte a byte (aceitação de leitura segue incondicional p/ forward-compat)        // onda 1401 — VARIANTES DE COR por asset (registry em DADOS; aplicar = coresCamada §73 via comPaleta §74 — NADA novo persiste, §619/PHP intocados): seletor no detalhe + contagem no card; off = sem UI byte a byte
  };
  var DEPENDENCIAS_FLAGS = {
    "as6.vc_3d": ["as6.visual_composer"],
    "as6.shell_vc3d": ["as5.novo_shell"],
    "as6.visual_composer": ["as5.novo_shell"],
    // VC so faz sentido no shell novo (como as6.single_2d)
    // Consultadas SOMENTE em shell/Palco3d.tsx → filhas do palco. As flags
    // de motor com DUPLA entrada (palco E Foto §329: as5.materiais3d,
    // as5.morfos3d, as5.animacao3d, as5.foto3d) NÃO têm pai — o fluxo 3D
    // da Foto funciona com o palco desligado (provado pelo foto329.mjs).
    "as5.assembler3d": ["as5.palco3d"],
    "as5.roupas3d": ["as5.assembler3d"],
    // partes exigem o assembler §406
    "as5.cabelo3d": ["as5.assembler3d"],
    "as5.ual_extra": ["as5.animacao3d", "as5.palco3d"],
    // extra soma ao pacote §432 e só existe no palco
    "as5.progressivo3d": ["as5.palco3d"],
    "as5.quality3d_v2": ["as5.palco3d"],
    "as5.captura3d_v2": ["as5.palco3d"],
    "as5.hud3d": ["as5.palco3d"],
    "as5.palco3d_v2": ["as5.palco3d"],
    "as5.palco3d_cine": ["as5.palco3d"],
    "as5.pos3d_real": ["as5.palco3d"],
    // onda 1408 (frente AAA): tudo que fala com o Renderizador3d é filho do palco
    "as6.looks": ["as5.palco3d"],
    "as6.material_v2": ["as5.palco3d"],
    "as6.qa_visual": ["as5.palco3d"],
    "as6.telemetria_assets": ["as5.palco3d"],
    "as6.qa_route": ["as5.palco3d"],
    "as6.material_debug": ["as6.qa_route"],
    // onda 1419 (#204/#205): câmera/sombras v2 são do palco 3D
    "as6.camera_v2": ["as5.palco3d"],
    "as6.sombras_v2": ["as5.palco3d"],
    // onda 1420 (#206/#207): pós/lentes/dev-luz são do palco 3D
    "as6.pos_v2": ["as5.palco3d"],
    "as6.dev_iluminacao": ["as5.palco3d"],
    "as6.foto_lentes": ["as5.palco3d"],
    // onda 1422 (#210/#211): corpo v2/grounding são do palco 3D
    "as6.corpo_v2": ["as5.palco3d"],
    "as6.corpo_grounding": ["as5.palco3d"],
    // onda 1423 (#213): UX simples é do palco 3D
    "as6.ux3d_simples": ["as5.palco3d"],
    // onda 1414 (#186): slots faciais são filhos do rosto v2 — ligar/desligar
    // a família inteira de uma vez (§2917–§2926)
    "as6.barba_slot": ["as6.face_v2"],
    "as6.brow_slot": ["as6.face_v2"],
    // onda 1415 (#191): vestuário premium refina o trilho Classic Premium
    "as6.roupa_premium": ["as6.classico_premium"],
    "as6.arte_v2": ["as6.classico_premium"],
    // Golden V3.1 (#219-R1): arte v2 refina o trilho premium
    "as6.single_2d": ["as5.novo_shell"],
    // Golden V4.2 #64: a convergência 2D-único só faz sentido dentro do shell novo
    "as6.hero_2d": ["as6.classico_premium", "as6.arte_v2"],
    // Golden A+2: heroes autorados exigem o trilho premium elevado
    "as6.fit_v2": ["as6.classico_premium", "as6.arte_v2"],
    // Golden A+2: silhueta por fit engine refina o trilho premium
    "as6.acess_2d_premium": ["as6.classico_premium"],
    // onda 1416 (#196)
    "as6.cp_foto": ["as6.classico_premium"],
    // onda 1418 (#202)
    "as6.dock_classico": ["as5.classico_aaa"],
    // a dock v3 refina o trilho AAA
    "as6.paineis_dock": ["as5.classico_aaa"],
    // painéis embaixo estendem o layout AAA
    "as6.paineis_cards": ["as6.paineis_dock"],
    // grades de cards refinam o inferior
    "as6.sidebar_pro": ["as5.classico_aaa"],
    // sidebar compacta/só-ícones do clássico
    "as6.visual_v2": ["as5.classico_aaa"],
    // elevação visual global do clássico
    "as6.workspace_fixo": ["as5.classico_aaa"],
    // trava de viewport estende o AAA
    "as6.dock_mag": ["as6.dock_classico"],
    // magnificação/momentum refinam a dock v3
    "as6.dock_fit": ["as6.dock_inferior"],
    // o fit corrige a GEOMETRIA da dock inferior (#112)
    "as6.ctx_barra": ["as6.contexto"],
    // a barra apresenta a dica do Context Engine §323–§325
    "as6.acess_hub": ["as6.acess_v2"],
    // o hub navega o registry de subcategorias (#140)
    "as6.tax_v2": ["as6.acess_hub"]
    // a taxonomia v2 filtra pela mesma infra de subcategorias (#146)
  };
  var CHAVE_LOCAL = "dshow.avst.flags.v1";
  var _remotas = null;
  var FLAGS_REMOTAS = ["as6.visual_composer", "as6.vc_3d", "as6.shell_vc3d", "as6.vestuario_separado", "as6.catalogo_v2", "as6.mobile_header_v2", "as6.shell_layout_v2"];
  function flagCrua(nome) {
    try {
      const local = JSON.parse(localStorage.getItem(CHAVE_LOCAL) ?? "{}");
      if (nome in local) return !!local[nome];
    } catch {
    }
    if (_remotas && nome in _remotas) return !!_remotas[nome];
    return PADROES[nome] ?? false;
  }
  function flag(nome) {
    const cru = flagCrua(nome);
    if (!cru || nome === "as6.estado_vnext") return cru;
    const pais = DEPENDENCIAS_FLAGS[nome];
    if (!pais || !flagCrua("as6.estado_vnext")) return cru;
    return pais.every((p) => flag(p));
  }

  // public/components/panels/panel-avatar-studio/src/nucleo/estado-vnext.ts
  function migrarSchema(registro, bruto) {
    if (bruto === null || typeof bruto !== "object" || Array.isArray(bruto)) {
      return { dado: bruto, aplicadas: [], falhou: false };
    }
    const versaoDe = (d) => {
      const v = d[registro.campoVersao];
      return typeof v === "number" && Number.isFinite(v) ? v : registro.versaoAtual;
    };
    let atual = bruto;
    const aplicadas = [];
    for (let passo = 0; passo < registro.migracoes.length; passo++) {
      const v = versaoDe(atual);
      if (v >= registro.versaoAtual) break;
      const proxima = registro.migracoes.find((m) => m.de === v);
      if (!proxima) break;
      try {
        const migrado = proxima.migrar(atual);
        const saida = { ...migrado, [registro.campoVersao]: proxima.para };
        aplicadas.push(`${proxima.de}→${proxima.para}`);
        atual = saida;
      } catch {
        return { dado: bruto, aplicadas: [], falhou: true };
      }
    }
    return { dado: atual, aplicadas, falhou: false };
  }
  var MIGRACOES_CONFIG = {
    campoVersao: "versao",
    versaoAtual: 2,
    migracoes: [
      {
        de: 1,
        para: 2,
        migrar: (dado) => dado,
        // carimbo puro — v1 ⊂ v2 (campo novo opcional)
        motivo: "v2: camada opcional camadas.roupa_sobre (vestuário multi-peça §3393, decisão #95)"
      }
    ]
  };
  var migrarConfigVNext = (bruto) => migrarSchema(MIGRACOES_CONFIG, bruto);

  // public/components/panels/panel-avatar-studio/src/engine/particulas.ts
  var DENSIDADE = {
    economico: 0.35,
    medio: 1,
    alto: 1.6,
    cinematico: 2.4
  };
  function det(i, semente, sal) {
    const x = ((i + 1) * 2654435761 + semente * 40503 + sal * 69069) % 4096;
    return x / 4096;
  }
  function forma(tipo, t, cor, i, semente) {
    const meio = t / 2;
    switch (tipo) {
      case "pontos":
        return `<circle r="${meio.toFixed(1)}" fill="${cor}"/>`;
      case "faiscas":
        return `<line x1="${(-meio).toFixed(1)}" y1="0" x2="${meio.toFixed(1)}" y2="0" stroke="${cor}" stroke-width="1.2" stroke-linecap="round" transform="rotate(${Math.round(det(i, semente, 7) * 180)})"/>`;
      case "pixels":
        return `<rect x="${(-meio).toFixed(1)}" y="${(-meio).toFixed(1)}" width="${t.toFixed(1)}" height="${t.toFixed(1)}" fill="${cor}"/>`;
      case "cristais":
        return `<rect x="${(-meio).toFixed(1)}" y="${(-meio).toFixed(1)}" width="${t.toFixed(1)}" height="${t.toFixed(1)}" fill="${cor}" transform="rotate(45)"/>`;
      case "estrelas":
        return `<path d="M0 ${-t} L${(t * 0.3).toFixed(1)} ${(-t * 0.3).toFixed(1)} L${t} 0 L${(t * 0.3).toFixed(1)} ${(t * 0.3).toFixed(1)} L0 ${t} L${(-t * 0.3).toFixed(1)} ${(t * 0.3).toFixed(1)} L${-t} 0 L${(-t * 0.3).toFixed(1)} ${(-t * 0.3).toFixed(1)} Z" fill="${cor}"/>`;
      case "linhas":
        return `<line x1="0" y1="${(-t * 1.6).toFixed(1)}" x2="0" y2="${(t * 1.6).toFixed(1)}" stroke="${cor}" stroke-width="1.4"/>`;
      case "circulos":
        return `<circle r="${t.toFixed(1)}" fill="none" stroke="${cor}" stroke-width="1.3"/>`;
      case "fragmentos":
        return `<path d="M0 ${-t} L${t} ${t} L${-t} ${(t * 0.6).toFixed(1)} Z" fill="${cor}" transform="rotate(${Math.round(det(i, semente, 11) * 360)})"/>`;
      case "neve":
        return `<circle r="${meio.toFixed(1)}" fill="${cor}" opacity="0.9"/><circle r="${(meio * 0.4).toFixed(1)}" fill="#fff" opacity="0.6"/>`;
      case "fogo":
        return `<path d="M0 ${t} Q${(-t * 0.7).toFixed(1)} 0 0 ${-t} Q${(t * 0.7).toFixed(1)} 0 0 ${t} Z" fill="${cor}"/>`;
      default:
        return `<circle r="${meio.toFixed(1)}" fill="${cor}"/>`;
    }
  }
  function trajetoria(dir, i, semente, durS, turb) {
    const x0 = 12 + det(i, semente, 1) * 216;
    const atraso = `${(det(i, semente, 5) * -8).toFixed(2)}s`;
    const dx = ((det(i, semente, 3) - 0.5) * 90 * turb).toFixed(1);
    if (dir === "subir") {
      return `transform="translate(${x0.toFixed(1)} 0)">
      <animateTransform attributeName="transform" type="translate" additive="sum"
        values="0 252;${dx} -18" dur="${durS}" begin="${atraso}" repeatCount="indefinite"/>`;
    }
    if (dir === "cair") {
      return `transform="translate(${x0.toFixed(1)} 0)">
      <animateTransform attributeName="transform" type="translate" additive="sum"
        values="0 -18;${dx} 252" dur="${durS}" begin="${atraso}" repeatCount="indefinite"/>`;
    }
    if (dir === "orbitar") {
      const raio = 46 + det(i, semente, 9) * 62;
      return `transform="translate(120 120)">
      <animateTransform attributeName="transform" type="rotate" additive="sum"
        values="${Math.round(det(i, semente, 13) * 360)} 0 0;${Math.round(det(i, semente, 13) * 360) + 360} 0 0"
        dur="${durS}" begin="${atraso}" repeatCount="indefinite"/>
      <g transform="translate(${raio.toFixed(1)} 0)">`;
    }
    const ang = det(i, semente, 15) * Math.PI * 2;
    const alcance = 60 + det(i, semente, 17) * 70;
    const ex = (Math.cos(ang) * alcance).toFixed(1);
    const ey = (Math.sin(ang) * alcance).toFixed(1);
    return `transform="translate(120 120)">
    <animateTransform attributeName="transform" type="translate" additive="sum"
      values="0 0;${ex} ${ey}" dur="${durS}" begin="${atraso}" repeatCount="indefinite"/>`;
  }
  function svgParticulas(tipo, params, tier = "medio", semente = 1, animado = true) {
    const n = Math.max(1, Math.round(params.quantidade * DENSIDADE[tier]));
    const durS = `${Math.max(0.4, params.duracaoMs / 1e3 / Math.max(0.1, params.velocidade)).toFixed(2)}s`;
    const turb = Math.min(1, Math.max(0, params.turbulencia ?? 0.3));
    const pecas = [];
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
      const fechaOrbita = params.direcao === "orbitar" ? "</g>" : "";
      pecas.push(`<g opacity="${op}" ${traj}${corpo}${fechaOrbita}</g>`);
    }
    return `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${pecas.join("")}</svg>`;
  }

  // public/components/panels/panel-avatar-studio/src/engine/render-foto.ts
  function escalaSelo(cfg) {
    return cfg?.escala === "p" ? 0.82 : cfg?.escala === "g" ? 1.18 : 1;
  }
  function nomeSelo(nome, cfg) {
    return cfg?.compacto && nome.length > 14 ? `${nome.slice(0, 12).trimEnd()}…` : nome;
  }
  function envolverCamada(id, svg, cfg) {
    const c = cfg?.[id];
    if (!c || !svg) return c?.oculta ? "" : svg;
    if (c.oculta) return "";
    const op = c.opacidade !== void 0 && c.opacidade !== 1 ? ` opacity="${c.opacidade}"` : "";
    const blend = c.blend && c.blend !== "normal" ? ` style="mix-blend-mode:${c.blend}"` : "";
    return op || blend ? `<g${op}${blend}>${svg}</g>` : svg;
  }
  function luzLocalSvg(uid, luz) {
    if (!luz || luz.intensidade === 0) return "";
    const clara = luz.intensidade > 0;
    const cor = clara ? "#ffffff" : "#000000";
    const alfa2 = Math.min(1, Math.abs(luz.intensidade)).toFixed(3);
    const grad = luz.tipo === "radial" ? `<radialGradient id="${uid}luz" cx="50%" cy="42%" r="62%"><stop offset="0%" stop-color="${cor}" stop-opacity="${alfa2}"/><stop offset="100%" stop-color="${cor}" stop-opacity="0"/></radialGradient>` : `<linearGradient id="${uid}luz" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${cor}" stop-opacity="${alfa2}"/><stop offset="70%" stop-color="${cor}" stop-opacity="0"/></linearGradient>`;
    return grad + `<rect x="28" y="26" width="184" height="184" fill="url(#${uid}luz)" clip-path="url(#${uid}fclip)" style="mix-blend-mode:soft-light"/>`;
  }
  function atributosTexto(t, base, corPadrao) {
    const familias = {
      sistema: "system-ui, -apple-system, sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
      serif: "Georgia, 'Times New Roman', serif"
    };
    const familia = familias[t?.fonte ?? "sistema"];
    const peso = t?.peso ?? 600;
    const escala = t?.tamanho === "p" ? 0.85 : t?.tamanho === "g" ? 1.25 : 1;
    const tam = Math.round(base * escala * 10) / 10;
    const cor = t?.cor ?? corPadrao;
    const contorno = t?.contorno ? ` stroke="#0a0d15" stroke-width="2.2" paint-order="stroke" stroke-linejoin="round"` : "";
    return {
      attrs: `font-family="${familia}" font-size="${tam}" font-weight="${peso}" fill="${cor}"${contorno}`,
      caixaAlta: !!t?.caixaAlta
    };
  }
  var NEUTRO = {
    brilho: 1,
    contraste: 1,
    saturacao: 1,
    temperatura: 0,
    vinheta: 0,
    rotacao: 0,
    espelhar: false,
    sombra: false,
    forma: "circulo",
    desfoqueFundo: 0,
    granulacao: 0,
    filtroCor: "nenhum",
    zoomFoto: 1,
    anel: 3,
    nitidez: 0,
    marca: "",
    // lote 311-320: neutros dos campos novos
    particulas: "nenhum",
    // lote 541-550: neutro = ausente
    borda: 0
    // megas 565-567 (§340-341): sem pluma = clip duro legado
  };
  function ajustesEfetivos(a) {
    if (!a) return null;
    const v = { ...NEUTRO, ...a };
    const neutro = v.brilho === 1 && v.contraste === 1 && v.saturacao === 1 && v.temperatura === 0 && v.vinheta === 0 && v.rotacao === 0 && !v.espelhar && !v.sombra && v.forma === "circulo" && v.desfoqueFundo === 0 && v.granulacao === 0 && v.filtroCor === "nenhum" && v.zoomFoto === 1 && v.anel === 3 && v.nitidez === 0 && v.marca === "" && v.particulas === "nenhum" && v.borda === 0;
    return neutro ? null : v;
  }
  function pathForma(forma2, r) {
    const cx = 120;
    const cy = 118;
    if (forma2 === "hexagono") {
      const p = Array.from({ length: 6 }, (_, i) => {
        const a = Math.PI / 3 * i - Math.PI / 2;
        return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
      }).join(" ");
      return `<polygon points="${p}"`;
    }
    if (forma2 === "losango") {
      return `<polygon points="${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}"`;
    }
    if (forma2 === "estrela") {
      const p = Array.from({ length: 10 }, (_, i) => {
        const rr = i % 2 === 0 ? r : r * 0.45;
        const a = Math.PI / 5 * i - Math.PI / 2;
        return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
      }).join(" ");
      return `<polygon points="${p}"`;
    }
    if (forma2 === "escudo") {
      const w = r * 0.92;
      return `<path d="M${(cx - w).toFixed(1)} ${(cy - r * 0.82).toFixed(1)} H${(cx + w).toFixed(1)} V${(cy + r * 0.18).toFixed(1)} Q${(cx + w).toFixed(1)} ${(cy + r * 0.62).toFixed(1)} ${cx} ${(cy + r).toFixed(1)} Q${(cx - w).toFixed(1)} ${(cy + r * 0.62).toFixed(1)} ${(cx - w).toFixed(1)} ${(cy + r * 0.18).toFixed(1)} Z"`;
    }
    if (forma2 === "squircle") {
      const l = r * 1.62;
      return `<rect x="${(cx - l / 2).toFixed(1)}" y="${(cy - l / 2).toFixed(1)}" width="${l.toFixed(1)}" height="${l.toFixed(1)}" rx="${(r * 0.55).toFixed(1)}"`;
    }
    return null;
  }
  function filtroAjustes(uid, a) {
    const precisaCor = a.brilho !== 1 || a.contraste !== 1 || a.saturacao !== 1 || a.temperatura !== 0 || a.filtroCor !== "nenhum" || a.nitidez > 0;
    if (!precisaCor) return "";
    const k = a.nitidez > 0 ? a.nitidez * 0.7 : 0;
    const nit = k > 0 ? `<feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 ${-k} 0 ${-k} ${1 + 4 * k} ${-k} 0 ${-k} 0"/>` : "";
    const b = a.brilho;
    const c = a.contraste;
    const interc = 0.5 - 0.5 * c;
    const tR = 1 + a.temperatura * 0.18;
    const tB = 1 - a.temperatura * 0.18;
    const filtroBase = a.filtroCor === "pb" ? `<feColorMatrix type="saturate" values="0"/>` : a.filtroCor === "sepia" ? `<feColorMatrix type="matrix" values="0.393 0.769 0.189 0 0  0.349 0.686 0.168 0 0  0.272 0.534 0.131 0 0  0 0 0 1 0"/>` : "";
    return `<filter id="${uid}aj" color-interpolation-filters="sRGB">` + filtroBase + `<feColorMatrix type="saturate" values="${a.saturacao}"/><feColorMatrix type="matrix" values="${tR} 0 0 0 0  0 1 0 0 0  0 0 ${tB} 0 0  0 0 0 1 0"/><feComponentTransfer><feFuncR type="linear" slope="${b * c}" intercept="${interc}"/><feFuncG type="linear" slope="${b * c}" intercept="${interc}"/><feFuncB type="linear" slope="${b * c}" intercept="${interc}"/></feComponentTransfer>` + nit + `</filter>`;
  }
  function filtroDesfoque(uid, v) {
    return v > 0 ? `<filter id="${uid}bf"><feGaussianBlur stdDeviation="${(v * 6).toFixed(2)}"/></filter>` : "";
  }
  function granulacaoSvg(uid, v, W = 240, H = 240) {
    if (v <= 0) return "";
    return `<filter id="${uid}gr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 ${(v * 0.5).toFixed(3)} 0"/></filter><rect width="${W}" height="${H}" filter="url(#${uid}gr)" style="mix-blend-mode:overlay"/>`;
  }
  function vinhetaSvg(uid, intensidade, W = 240, H = 240) {
    if (intensidade <= 0) return "";
    return `<radialGradient id="${uid}vin" cx="50%" cy="50%" r="72%"><stop offset="58%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="${(0.72 * intensidade).toFixed(3)}"/></radialGradient><rect width="${W}" height="${H}" fill="url(#${uid}vin)"/>`;
  }
  function sombraContato(uid) {
    return `<filter id="${uid}sb"><feGaussianBlur stdDeviation="4"/></filter><ellipse cx="120" cy="218" rx="72" ry="9" fill="#000" opacity="0.38" filter="url(#${uid}sb)"/>`;
  }
  var FORMATOS_FOTO = {
    perfil: { nome: "Perfil", proporcao: "1:1", saida: [480, 480], caixa: [240, 240] },
    header: { nome: "Header", proporcao: "3:1", saida: [1500, 500], caixa: [720, 240] },
    banner: { nome: "Banner", proporcao: "4:1", saida: [1920, 480], caixa: [960, 240] },
    wallpaper: { nome: "Wallpaper", proporcao: "16:9", saida: [1920, 1080], caixa: [426.7, 240] }
  };
  function escaparAtributo(v) {
    return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function round1(v) {
    return Math.round(v * 10) / 10;
  }
  function seloComponente(selo, cfg, pos, modoWide, maxLarg) {
    const esc = escalaSelo(cfg);
    const nome = nomeSelo(selo.nome, cfg);
    const base = modoWide ? { h: 30, rx: 15, fs: 16, dy: 20, sw: 1.6, larg: Math.max(120, Math.round(nome.length * 10) + 34) } : { h: 22, rx: 11, fs: 12, dy: 15, sw: 1.4, larg: Math.max(92, Math.round(nome.length * 7.4) + 26) };
    const larg = round1(Math.min(maxLarg ?? (modoWide ? 480 : 200), base.larg * esc));
    const cx = round1(pos.x);
    const cy = round1(pos.y);
    return `<g><rect x="${round1(cx - larg / 2)}" y="${cy}" width="${larg}" height="${round1(base.h * esc)}" rx="${round1(base.rx * esc)}" fill="#0a0d15" opacity="0.88" stroke="${selo.cor}" stroke-width="${base.sw}"/><text x="${cx}" y="${round1(cy + base.dy * esc)}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${round1(base.fs * esc)}" font-weight="700" fill="${selo.cor}">${escaparTexto(nome)}</text></g>`;
  }
  function escaparTexto(v) {
    return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function renderFotoEstilizada(fotoHref, estilo, resolver, opcoes = {}) {
    const uid = opcoes.uid ?? hashTexto(JSON.stringify(estilo.camadas) + (estilo.selo?.nome ?? "") + (estilo.ajustes ? JSON.stringify(estilo.ajustes) : "") + (estilo.camadasFoto ? JSON.stringify(estilo.camadasFoto) : "") + (estilo.ordemFundo ? estilo.ordemFundo.join(",") : "") + (estilo.luzLocal ? JSON.stringify(estilo.luzLocal) : "") + (estilo.tipografia ? JSON.stringify(estilo.tipografia) : "") + (estilo.subtitulo ?? "") + (estilo.pos ? JSON.stringify(estilo.pos) : "") + (estilo.seloCfg ? JSON.stringify(estilo.seloCfg) : ""));
    const p = paletaDe(estilo.cores);
    const forma2 = opcoes.forma ?? "quadrado";
    const aj = ajustesEfetivos(estilo.ajustes);
    const pintar = (id) => {
      if (!id || id === "nenhum") return "";
      const parte = resolver(id);
      return parte ? parte.render(p, uid) : "";
    };
    if (opcoes.formato && opcoes.formato !== "perfil") {
      return comporWide(fotoHref, estilo, pintar, resolver, p, uid, opcoes);
    }
    const cfgC = estilo.camadasFoto;
    const ordemF = estilo.ordemFundo && estilo.ordemFundo.length === 3 && new Set(estilo.ordemFundo).size === 3 && estilo.ordemFundo.every((c) => c === "fundo" || c === "banner" || c === "aura") ? estilo.ordemFundo : ["fundo", "banner", "aura"];
    const fundo = ordemF.map((c) => envolverCamada(c, pintar(estilo.camadas[c]), cfgC)).join("");
    const efeitoDef = estilo.camadas.efeito && estilo.camadas.efeito !== "nenhum" ? resolver(estilo.camadas.efeito) : void 0;
    const efeitoSvg = envolverCamada("efeito", efeitoDef ? efeitoDef.render(p, uid) : "", cfgC);
    const efeitoAtrasFlag = cfgC?.efeito?.plano ? cfgC.efeito.plano === "atras" : !!efeitoDef?.atras;
    const efeitoAtras = efeitoDef && efeitoAtrasFlag ? efeitoSvg : "";
    const efeitoFrente = efeitoDef && !efeitoAtrasFlag ? efeitoSvg : "";
    const moldura = envolverCamada("moldura", pintar(estilo.camadas.moldura), cfgC);
    const medalhao = medalhaoSvg(fotoHref, p, uid, aj);
    const posEmb = estilo.pos?.emblema;
    const trEmb = posEmb ? `translate(${round1(posEmb.x - 152)} ${round1(posEmb.y - 206)})` : "translate(26 -28)";
    const badge = estilo.camadas.emblema && estilo.camadas.emblema !== "nenhum" ? envolverCamada("emblema", `<g transform="${trEmb}">${pintar(estilo.camadas.emblema)}</g>`, cfgC) : "";
    let selo = "";
    if (estilo.selo) {
      const posS = estilo.pos?.selo;
      if (!estilo.seloCfg && !posS) {
        const nome = estilo.selo.nome;
        const larg = Math.min(200, Math.max(92, Math.round(nome.length * 7.4) + 26));
        const x = 120 - larg / 2;
        selo = `<g><rect x="${x}" y="206" width="${larg}" height="22" rx="11" fill="#0a0d15" opacity="0.88" stroke="${estilo.selo.cor}" stroke-width="1.4"/><text x="120" y="221" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="${estilo.selo.cor}">${escaparTexto(nome)}</text></g>`;
      } else {
        selo = seloComponente(estilo.selo, estilo.seloCfg, posS ?? { x: 120, y: 206 }, false);
      }
    }
    const clip = forma2 === "circulo" ? `<circle cx="120" cy="120" r="118"/>` : `<rect width="240" height="240" rx="26"/>`;
    const dim = opcoes.tamanho ? ` width="${opcoes.tamanho}" height="${opcoes.tamanho}"` : "";
    const defsAj = (aj ? filtroAjustes(uid, aj) : "") + (aj ? filtroDesfoque(uid, aj.desfoqueFundo) : "");
    const vinheta = aj ? vinhetaSvg(uid, aj.vinheta) : "";
    const grao = aj ? granulacaoSvg(uid, aj.granulacao) : "";
    const formaClip = aj ? pathForma(aj.forma, 92) : null;
    const fclip = formaClip ? `${formaClip}/>` : `<circle cx="120" cy="118" r="92"/>`;
    const fundoComp = aj && aj.desfoqueFundo > 0 ? `<g filter="url(#${uid}bf)">${fundo}</g>` : fundo;
    const tx = atributosTexto(estilo.tipografia, 11, "#e6eaf2");
    const posLeg = estilo.pos?.legenda;
    const legenda = estilo.legenda ? `<text x="${posLeg ? round1(posLeg.x) : 120}" y="${posLeg ? round1(posLeg.y) : 200}" text-anchor="middle" ${tx.attrs} opacity="0.92">${escaparTexto(tx.caixaAlta ? estilo.legenda.toUpperCase() : estilo.legenda)}</text>` : "";
    const luz = luzLocalSvg(uid, estilo.luzLocal);
    const particulasFoto = aj && aj.particulas !== "nenhum" ? `<g opacity="0.75">${svgParticulas(aj.particulas, {
      quantidade: 22,
      tamanho: 5,
      velocidade: 1,
      direcao: "subir",
      cor: estilo.cores.destaque,
      opacidade: 0.85,
      duracaoMs: 1500
    }, "medio", 9, false).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</g>` : "";
    const marca = aj && aj.marca ? `<text x="232" y="234" text-anchor="end" font-family="system-ui, sans-serif" font-size="8" font-weight="600" fill="#e6eaf2" opacity="0.4" letter-spacing="0.6">${escaparTexto(aj.marca.toUpperCase())}</text>` : "";
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
  function mascaraBorda(uid, aj, fclip) {
    if (!aj || !(aj.borda > 0)) return "";
    const desvio = Math.round(aj.borda * 6 * 10) / 10;
    return `<filter id="${uid}fblur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${desvio}"/></filter><mask id="${uid}fmask">${fclip.replace("/>", ` fill="#ffffff" filter="url(#${uid}fblur)"/>`)}</mask>`;
  }
  function medalhaoSvg(fotoHref, p, uid, aj = null) {
    let extras = "";
    if (aj) {
      const temCor = aj.brilho !== 1 || aj.contraste !== 1 || aj.saturacao !== 1 || aj.temperatura !== 0 || aj.filtroCor !== "nenhum";
      if (temCor) extras += ` filter="url(#${uid}aj)"`;
      const t = [];
      if (aj.zoomFoto !== 1) t.push(`translate(120 118) scale(${aj.zoomFoto}) translate(-120 -118)`);
      if (aj.rotacao !== 0) t.push(`rotate(${aj.rotacao} 120 118)`);
      if (aj.espelhar) t.push("translate(240 0) scale(-1 1)");
      if (t.length) extras += ` transform="${t.join(" ")}"`;
    }
    const sombra = aj?.sombra ? sombraContato(uid) : "";
    const forma2 = aj ? pathForma(aj.forma, 97) : null;
    const anelW = aj?.anel ?? 3;
    const aro = forma2 ? `${forma2} fill="#0a0d15" opacity="0.92"/>` : `<circle cx="120" cy="118" r="97" fill="#0a0d15" opacity="0.92"/>`;
    const formaAnel = aj ? pathForma(aj.forma, 93) : null;
    const anel = formaAnel ? `${formaAnel} fill="none" stroke="${p.destaque.base}" stroke-width="${anelW}" opacity="0.9"/>` : anelW !== 3 ? `<circle cx="120" cy="118" r="93" fill="none" stroke="${p.destaque.base}" stroke-width="${anelW}" opacity="0.9"/>` : `<circle cx="120" cy="118" r="93" fill="none" stroke="${p.destaque.base}" stroke-width="3" opacity="0.9"/>`;
    const recorte = aj && aj.borda > 0 ? `mask="url(#${uid}fmask)"` : `clip-path="url(#${uid}fclip)"`;
    return sombra + aro + `<image href="${escaparAtributo(fotoHref)}" x="28" y="26" width="184" height="184" preserveAspectRatio="xMidYMid slice" ${recorte}${extras}/>` + anel;
  }
  function comporWide(fotoHref, estilo, pintar, resolver, p, uid, opcoes) {
    const formato = FORMATOS_FOTO[opcoes.formato ?? "header"];
    const [W, H] = formato.caixa;
    const sx = W / 240;
    const aj = ajustesEfetivos(estilo.ajustes);
    const defsAj = (aj ? filtroAjustes(uid, aj) : "") + (aj ? filtroDesfoque(uid, aj.desfoqueFundo) : "");
    const vinheta = aj ? vinhetaSvg(uid, aj.vinheta, W, H) : "";
    const grao = aj ? granulacaoSvg(uid, aj.granulacao, W, H) : "";
    const formaClipW = aj ? pathForma(aj.forma, 92) : null;
    const fclipW = formaClipW ? `${formaClipW}/>` : `<circle cx="120" cy="118" r="92"/>`;
    const cxTexto = opcoes.lado === "direita" ? (W - 240) / 2 : (240 + W) / 2;
    const celulaX0 = opcoes.lado === "direita" ? 0 : 240;
    const reflow = (pos) => {
      if (!opcoes.reflowPos) return pos;
      const x = celulaX0 + pos.x / 240 * (W - 240);
      const y = pos.y / 240 * H;
      return {
        x: Math.min(celulaX0 + (W - 240) - 16, Math.max(celulaX0 + 16, x)),
        y: Math.min(H - 14, Math.max(18, y))
      };
    };
    const txW = atributosTexto(estilo.tipografia, 13, "#e6eaf2");
    const yLegenda = estilo.subtitulo ? 96 : 108;
    const posLegW = estilo.pos?.legenda ? reflow(estilo.pos.legenda) : void 0;
    const legendaW = estilo.legenda ? `<text x="${posLegW ? round1(posLegW.x) : cxTexto}" y="${posLegW ? round1(posLegW.y) : yLegenda}" text-anchor="middle" ${txW.attrs} opacity="0.92">${escaparTexto(txW.caixaAlta ? estilo.legenda.toUpperCase() : estilo.legenda)}</text>` : "";
    const txSub = atributosTexto(estilo.tipografia, 10.5, "#8b93a7");
    const posSubW = estilo.pos?.subtitulo ? reflow(estilo.pos.subtitulo) : void 0;
    const subtituloW = estilo.subtitulo ? `<text x="${posSubW ? round1(posSubW.x) : cxTexto}" y="${posSubW ? round1(posSubW.y) : 118}" text-anchor="middle" ${txSub.attrs} opacity="0.9">${escaparTexto(txSub.caixaAlta ? estilo.subtitulo.toUpperCase() : estilo.subtitulo)}</text>` : "";
    const cfgC = estilo.camadasFoto;
    const fundo = `<g transform="scale(${sx} 1)">${envolverCamada("fundo", pintar(estilo.camadas.fundo), cfgC) + envolverCamada("banner", pintar(estilo.camadas.banner), cfgC)}</g>`;
    const aura = envolverCamada("aura", pintar(estilo.camadas.aura), cfgC);
    const efeitoDef = estilo.camadas.efeito && estilo.camadas.efeito !== "nenhum" ? resolver(estilo.camadas.efeito) : void 0;
    const efeitoSvg = envolverCamada("efeito", efeitoDef ? efeitoDef.render(p, uid) : "", cfgC);
    const efeitoAtrasFlag = cfgC?.efeito?.plano ? cfgC.efeito.plano === "atras" : !!efeitoDef?.atras;
    const efeitoAtras = efeitoDef && efeitoAtrasFlag ? efeitoSvg : "";
    const efeitoFrente = efeitoDef && !efeitoAtrasFlag ? efeitoSvg : "";
    const direita = opcoes.lado === "direita";
    const deslocMedalhao = direita ? W - 240 : 0;
    const cx2 = direita ? (W - 240) / 2 : (240 + W) / 2;
    const posEmbW = estilo.pos?.emblema ? reflow(estilo.pos.emblema) : void 0;
    const trEmbW = posEmbW ? `translate(${round1(posEmbW.x - 152)} ${round1(posEmbW.y - 206)}) scale(1)` : `translate(${cx2 - 152} -114) scale(1)`;
    const badge = estilo.camadas.emblema && estilo.camadas.emblema !== "nenhum" ? envolverCamada("emblema", `<g transform="${trEmbW}">${pintar(estilo.camadas.emblema)}</g>`, cfgC) : "";
    const luzW = luzLocalSvg(uid, estilo.luzLocal);
    let selo = "";
    if (estilo.selo) {
      const posSW = estilo.pos?.selo ? reflow(estilo.pos.selo) : void 0;
      if (!estilo.seloCfg && !posSW) {
        const nome = estilo.selo.nome;
        const larg = Math.min(W - 240 - 24, Math.max(120, Math.round(nome.length * 10) + 34));
        selo = `<g><rect x="${cx2 - larg / 2}" y="128" width="${larg}" height="30" rx="15" fill="#0a0d15" opacity="0.88" stroke="${estilo.selo.cor}" stroke-width="1.6"/><text x="${cx2}" y="148" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="${estilo.selo.cor}">${escaparTexto(nome)}</text></g>`;
      } else {
        selo = seloComponente(estilo.selo, estilo.seloCfg, posSW ?? { x: cx2, y: 128 }, true, W - 240 - 24);
      }
    }
    const [lw, lh] = formato.saida;
    const dims = opcoes.estatico ? ` width="${lw}" height="${lh}"` : "";
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"${dims} preserveAspectRatio="none" role="img" aria-label="Foto estilizada (${formato.nome})">
<defs><clipPath id="${uid}clip"><rect width="${W}" height="${H}" rx="14"/></clipPath><clipPath id="${uid}fclip">${fclipW}</clipPath>${defsAj}${mascaraBorda(uid, aj, fclipW)}</defs>
<g clip-path="url(#${uid}clip)">${opcoes.semFundo ? "" : `<rect width="${W}" height="${H}" fill="#0a0d15"/>`}${aj && aj.desfoqueFundo > 0 ? `<g filter="url(#${uid}bf)">${fundo}</g>` : fundo}${efeitoAtras}${direita ? `<g transform="translate(${deslocMedalhao} 0)">` : ""}${aura}${medalhaoSvg(fotoHref, p, uid, aj)}${luzW}${direita ? "</g>" : ""}${badge}${efeitoFrente}${vinheta}${grao}${legendaW}${subtituloW}${selo}</g>
</svg>`;
    if (opcoes.estatico) svg = congelarSvg(svg);
    return svg;
  }

  // public/components/panels/panel-avatar-studio/src/engine/partes/bases.ts
  function defsPele(u, claro, base, escuro) {
    return `
    <radialGradient id="${u}pele" cx="0.38" cy="0.28" r="1">
      <stop offset="0" stop-color="${claro}"/>
      <stop offset="0.58" stop-color="${base}"/>
      <stop offset="1" stop-color="${escuro}"/>
    </radialGradient>
    <linearGradient id="${u}pesc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${escuro}"/>
      <stop offset="1" stop-color="${base}"/>
    </linearGradient>`;
  }
  function rimLight() {
    return `<path d="M80 72 a 52 58 0 0 1 44 -22" stroke="${alfa("#ffffff", 0.4)}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  }
  var BASES = [
    {
      id: "bas_classica",
      categoria: "base",
      nome: "Clássica",
      descricao: "Rosto oval suave com iluminação de estúdio.",
      raridade: "comum",
      tema: "clássico",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy}" rx="${G.cabecaRx}" ry="${G.cabecaRy}" fill="url(#${u}pele)"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="71.5" cy="${G.orelhaY}" rx="4" ry="7" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="168.5" cy="${G.orelhaY}" rx="4" ry="7" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="120" cy="152" rx="20" ry="7" fill="${alfa(p.pele.profundo, 0.28)}"/>
      ${rimLight()}`
    },
    {
      id: "bas_angular",
      categoria: "base",
      nome: "Angular",
      descricao: "Maxilar marcado e traços firmes de protagonista.",
      raridade: "incomum",
      tema: "clássico",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <path d="M120 49 c 30 0 50 22 50 52 c0 18 -6 33 -18 45 l -20 16 c -7 5 -17 5 -24 0 l -20 -16 c -12 -12 -18 -27 -18 -45 c0 -30 20 -52 50 -52 z" fill="url(#${u}pele)"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <path d="M92 150 q 28 14 56 0" stroke="${alfa(p.pele.profundo, 0.22)}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="120" cy="154" rx="18" ry="6" fill="${alfa(p.pele.profundo, 0.26)}"/>
      ${rimLight()}`
    },
    {
      id: "bas_androide",
      categoria: "base",
      nome: "Androide",
      descricao: "Chassi sintético polido com pods auriculares de LED.",
      raridade: "epico",
      tema: "tecnologia",
      usaCores: ["pele", "destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}metal" x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0" stop-color="${p.pele.claro}"/>
          <stop offset="0.5" stop-color="${p.pele.base}"/>
          <stop offset="1" stop-color="${p.pele.profundo}"/>
        </linearGradient>
        <linearGradient id="${u}pescA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.pele.profundo}"/>
          <stop offset="1" stop-color="${p.pele.escuro}"/>
        </linearGradient>
      </defs>
      <path d="M105 146 h30 v40 c0 8 -30 8 -30 0 z" fill="url(#${u}pescA)"/>
      <rect x="107" y="150" width="26" height="4" rx="2" fill="${alfa(p.destaque.base, 0.8)}"/>
      <rect x="107" y="160" width="26" height="3" rx="1.5" fill="${alfa("#000000", 0.35)}"/>
      <path d="M120 50 c 29 0 49 21 49 51 c0 22 -8 38 -22 49 c -8 6 -16 9 -27 9 s -19 -3 -27 -9 c -14 -11 -22 -27 -22 -49 c0 -30 20 -51 49 -51 z" fill="url(#${u}metal)"/>
      <path d="M120 50 v 109" stroke="${alfa("#000000", 0.18)}" stroke-width="1.4"/>
      <path d="M74 128 h 92" stroke="${alfa("#000000", 0.15)}" stroke-width="1.2"/>
      <path d="M96 158 h48 l-6 7 h-36 z" fill="${alfa("#000000", 0.22)}"/>
      <rect x="62" y="98" width="14" height="28" rx="7" fill="${p.pele.profundo}"/>
      <rect x="164" y="98" width="14" height="28" rx="7" fill="${p.pele.profundo}"/>
      <rect x="66" y="104" width="6" height="16" rx="3" fill="${p.destaque.base}"/>
      <rect x="168" y="104" width="6" height="16" rx="3" fill="${p.destaque.base}"/>
      ${rimLight()}`
    },
    {
      id: "bas_holo",
      categoria: "base",
      nome: "Holograma",
      descricao: "Projeção volumétrica translúcida com varredura de luz.",
      raridade: "lendario",
      tema: "tecnologia",
      usaCores: ["pele", "destaque"],
      render: (p, u) => {
        let scan = "";
        for (let i = 0; i < 12; i++) {
          scan += `<rect x="66" y="${52 + i * 10}" width="108" height="1.4" fill="${alfa(p.destaque.claro, 0.16)}"/>`;
        }
        return `
      <defs>
        <radialGradient id="${u}holo" cx="0.4" cy="0.3" r="1">
          <stop offset="0" stop-color="${alfa(p.pele.claro, 0.85)}"/>
          <stop offset="0.6" stop-color="${alfa(p.pele.base, 0.72)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0.55)}"/>
        </radialGradient>
      </defs>
      <path d="M104 146 h32 v38 c0 9 -32 9 -32 0 z" fill="${alfa(p.destaque.base, 0.4)}"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy}" rx="${G.cabecaRx}" ry="${G.cabecaRy}" fill="url(#${u}holo)" stroke="${alfa(p.destaque.claro, 0.8)}" stroke-width="1.6"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="13" fill="${alfa(p.pele.base, 0.6)}"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="13" fill="${alfa(p.pele.base, 0.6)}"/>
      <g clip-path="ellipse(50px 57px at 120px 106px)">${scan}</g>
      <ellipse cx="120" cy="196" rx="34" ry="6" fill="${alfa(p.destaque.base, 0.5)}">
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2.6s" repeatCount="indefinite"/>
      </ellipse>
      ${rimLight()}`;
      }
    },
    // ── 4.6 F2 · Onda 1 (identidade) — 6 rostos humanoides novos ──────
    {
      id: "bas_redonda",
      categoria: "base",
      nome: "Redonda",
      descricao: "Bochechas cheias e simpatia imediata.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <circle cx="${G.cx}" cy="${G.cabecaCy + 2}" r="54" fill="url(#${u}pele)"/>
      <ellipse cx="68" cy="${G.orelhaY}" rx="9" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="172" cy="${G.orelhaY}" rx="9" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="69.5" cy="${G.orelhaY}" rx="4" ry="6.5" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="170.5" cy="${G.orelhaY}" rx="4" ry="6.5" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="92" cy="128" rx="9" ry="6" fill="${alfa("#ff8d7a", 0.22)}"/>
      <ellipse cx="148" cy="128" rx="9" ry="6" fill="${alfa("#ff8d7a", 0.22)}"/>
      <ellipse cx="120" cy="154" rx="19" ry="6" fill="${alfa(p.pele.profundo, 0.24)}"/>
      ${rimLight()}`
    },
    {
      id: "bas_coracao",
      categoria: "base",
      nome: "Coração",
      descricao: "Testa ampla e queixo delicado — simetria de capa.",
      raridade: "incomum",
      tema: "clássico",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <path d="M120 49 c 32 0 52 20 52 48 c0 16 -8 32 -20 44 l -24 20 c -5 4 -11 4 -16 0 l -24 -20 c -12 -12 -20 -28 -20 -44 c0 -28 20 -48 52 -48 z" fill="url(#${u}pele)"/>
      <ellipse cx="69" cy="${G.orelhaY - 2}" rx="9" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="171" cy="${G.orelhaY - 2}" rx="9" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="70.5" cy="${G.orelhaY - 2}" rx="4" ry="6" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="169.5" cy="${G.orelhaY - 2}" rx="4" ry="6" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="120" cy="152" rx="15" ry="5" fill="${alfa(p.pele.profundo, 0.24)}"/>
      ${rimLight()}`
    },
    {
      id: "bas_quadrada",
      categoria: "base",
      nome: "Quadrada",
      descricao: "Mandíbula reta de quem não pula o treino.",
      raridade: "incomum",
      tema: "esportivo",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <path d="M120 50 c 28 0 48 16 48 44 v 28 c0 16 -6 28 -16 36 l -18 12 c -8 5 -20 5 -28 0 l -18 -12 c -10 -8 -16 -20 -16 -36 v -28 c0 -28 20 -44 48 -44 z" fill="url(#${u}pele)"/>
      <ellipse cx="69" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="171" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="70.5" cy="${G.orelhaY}" rx="4" ry="7" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="169.5" cy="${G.orelhaY}" rx="4" ry="7" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <path d="M96 154 h 48" stroke="${alfa(p.pele.profundo, 0.2)}" stroke-width="5" stroke-linecap="round"/>
      ${rimLight()}`
    },
    {
      id: "bas_longa",
      categoria: "base",
      nome: "Alongada",
      descricao: "Traços finos e elegância de editorial.",
      raridade: "raro",
      tema: "executivo",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy + 2}" rx="44" ry="61" fill="url(#${u}pele)"/>
      <ellipse cx="76" cy="${G.orelhaY}" rx="8" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="164" cy="${G.orelhaY}" rx="8" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="77.5" cy="${G.orelhaY}" rx="3.5" ry="7" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="162.5" cy="${G.orelhaY}" rx="3.5" ry="7" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <path d="M104 128 q -4 6 0 12" stroke="${alfa(p.pele.profundo, 0.18)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M136 128 q 4 6 0 12" stroke="${alfa(p.pele.profundo, 0.18)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="120" cy="156" rx="15" ry="5" fill="${alfa(p.pele.profundo, 0.24)}"/>
      ${rimLight()}`
    },
    {
      id: "bas_marcada",
      categoria: "base",
      nome: "Marcada",
      descricao: "Uma cicatriz, mil histórias — nenhuma delas calma.",
      raridade: "raro",
      tema: "aventura",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <path d="M120 49 c 30 0 50 22 50 52 c0 18 -6 33 -18 45 l -20 16 c -7 5 -17 5 -24 0 l -20 -16 c -12 -12 -18 -27 -18 -45 c0 -30 20 -52 50 -52 z" fill="url(#${u}pele)"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <path d="M146 84 l 10 22" stroke="${alfa("#a0432f", 0.75)}" stroke-width="3" stroke-linecap="round"/>
      <path d="M144 90 l 8 -3 M147 97 l 8 -3" stroke="${alfa("#a0432f", 0.6)}" stroke-width="2" stroke-linecap="round"/>
      <path d="M88 126 q 6 4 12 2" stroke="${alfa(p.pele.profundo, 0.28)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M152 126 q -6 4 -12 2" stroke="${alfa(p.pele.profundo, 0.28)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="120" cy="153" rx="17" ry="6" fill="${alfa(p.pele.profundo, 0.26)}"/>
      ${rimLight()}`
    },
    {
      id: "bas_sardas",
      categoria: "base",
      nome: "Sardas",
      descricao: "Constelação própria nas bochechas.",
      raridade: "incomum",
      tema: "casual",
      usaCores: ["pele"],
      render: (p, u) => {
        const sardas = [[96, 124], [104, 130], [112, 126], [128, 126], [136, 130], [144, 124], [100, 134], [140, 134]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${alfa(p.pele.profundo, 0.5)}"/>`).join("");
        return `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy}" rx="${G.cabecaRx}" ry="${G.cabecaRy}" fill="url(#${u}pele)"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="71.5" cy="${G.orelhaY}" rx="4" ry="7" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="168.5" cy="${G.orelhaY}" rx="4" ry="7" fill="${alfa(p.pele.escuro, 0.7)}"/>
      ${sardas}
      <ellipse cx="120" cy="152" rx="20" ry="7" fill="${alfa(p.pele.profundo, 0.28)}"/>
      ${rimLight()}`;
      }
    },
    // ── 4.6 F2 · Onda 7 — 6 rostos humanoides novos ───────────────────
    {
      id: "bas_triangular",
      categoria: "base",
      nome: "Triangular",
      descricao: "Mandíbula larga, decisões mais largas ainda.",
      raridade: "incomum",
      tema: "esportivo",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <path d="M120 50 c 24 0 40 14 42 38 c 2 22 -2 40 -12 52 l -16 14 c -8 7 -20 7 -28 0 l -16 -14 c -10 -12 -14 -30 -12 -52 c 2 -24 18 -38 42 -38 z" fill="url(#${u}pele)"/>
      <ellipse cx="74" cy="${G.orelhaY}" rx="8" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="166" cy="${G.orelhaY}" rx="8" ry="12" fill="${p.pele.base}"/>
      <path d="M98 156 h 44" stroke="${alfa(p.pele.profundo, 0.22)}" stroke-width="5" stroke-linecap="round"/>
      ${rimLight()}`
    },
    {
      id: "bas_bochechudo",
      categoria: "base",
      nome: "Bochechudo",
      descricao: "Covinhas de fábrica e reserva estratégica de simpatia.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy + 3}" rx="53" ry="55" fill="url(#${u}pele)"/>
      <ellipse cx="88" cy="132" rx="13" ry="10" fill="${alfa(p.pele.claro, 0.55)}"/>
      <ellipse cx="152" cy="132" rx="13" ry="10" fill="${alfa(p.pele.claro, 0.55)}"/>
      <path d="M84 140 q 2 3 5 3 M156 140 q -2 3 -5 3" stroke="${alfa(p.pele.profundo, 0.3)}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="120" cy="154" rx="18" ry="6" fill="${alfa(p.pele.profundo, 0.22)}"/>
      ${rimLight()}`
    },
    {
      id: "bas_diamante",
      categoria: "base",
      nome: "Diamante",
      descricao: "Maçãs do rosto que dispensam iluminação de estúdio.",
      raridade: "raro",
      tema: "clássico",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <path d="M120 50 c 20 0 34 10 40 28 c 6 16 8 30 2 44 c -6 16 -20 30 -34 40 c -5 3 -11 3 -16 0 c -14 -10 -28 -24 -34 -40 c -6 -14 -4 -28 2 -44 c 6 -18 20 -28 40 -28 z" fill="url(#${u}pele)"/>
      <path d="M84 118 l 12 -6 M156 118 l -12 -6" stroke="${alfa(p.pele.claro, 0.7)}" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="72" cy="${G.orelhaY - 2}" rx="8" ry="11" fill="${p.pele.base}"/>
      <ellipse cx="168" cy="${G.orelhaY - 2}" rx="8" ry="11" fill="${p.pele.base}"/>
      <ellipse cx="120" cy="152" rx="14" ry="5" fill="${alfa(p.pele.profundo, 0.24)}"/>
      ${rimLight()}`
    },
    {
      id: "bas_veterano",
      categoria: "base",
      nome: "Veterano",
      descricao: "Cada linha de expressão é um projeto entregue.",
      raridade: "raro",
      tema: "clássico",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy}" rx="${G.cabecaRx}" ry="${G.cabecaRy}" fill="url(#${u}pele)"/>
      <g stroke="${alfa(p.pele.profundo, 0.3)}" stroke-width="2.2" stroke-linecap="round" fill="none">
        <path d="M96 84 q 24 -6 48 0"/>
        <path d="M100 76 q 20 -5 40 0"/>
        <path d="M84 122 q 4 6 10 8"/>
        <path d="M156 122 q -4 6 -10 8"/>
        <path d="M108 158 q 12 4 24 0"/>
      </g>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <ellipse cx="120" cy="152" rx="18" ry="6" fill="${alfa(p.pele.profundo, 0.26)}"/>
      ${rimLight()}`
    },
    {
      id: "bas_juvenil",
      categoria: "base",
      nome: "Juvenil",
      descricao: "Energia de estagiário no primeiro dia — para sempre.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy + 1}" rx="49" ry="54" fill="url(#${u}pele)"/>
      <ellipse cx="93" cy="126" rx="8" ry="5" fill="${alfa("#ff8d7a", 0.3)}"/>
      <ellipse cx="147" cy="126" rx="8" ry="5" fill="${alfa("#ff8d7a", 0.3)}"/>
      <circle cx="120" cy="70" r="2" fill="${alfa("#ffffff", 0.5)}"/>
      <ellipse cx="71" cy="${G.orelhaY}" rx="8.5" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="169" cy="${G.orelhaY}" rx="8.5" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="120" cy="151" rx="16" ry="5.4" fill="${alfa(p.pele.profundo, 0.2)}"/>
      ${rimLight()}`
    },
    {
      id: "bas_meio_cyborg",
      categoria: "base",
      nome: "Meio-Cyborg",
      descricao: "Metade humano, metade upgrade — cem por cento operacional.",
      raridade: "epico",
      tema: "cyberpunk",
      usaCores: ["pele", "destaque"],
      render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}
        <linearGradient id="${u}cyb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#4a5266"/>
          <stop offset="1" stop-color="#20242e"/>
        </linearGradient>
        <clipPath id="${u}cybc"><path d="M120 46 h 54 v 124 h -54 z"/></clipPath>
      </defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy}" rx="${G.cabecaRx}" ry="${G.cabecaRy}" fill="url(#${u}pele)"/>
      <g clip-path="url(#${u}cybc)">
        <ellipse cx="${G.cx}" cy="${G.cabecaCy}" rx="${G.cabecaRx}" ry="${G.cabecaRy}" fill="url(#${u}cyb)"/>
        <path d="M124 60 v 96 M138 54 l 6 20 M132 130 l 12 14" stroke="${alfa(p.destaque.base, 0.55)}" stroke-width="1.8"/>
        <circle cx="150" cy="86" r="3" fill="${p.destaque.base}">
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
        </circle>
      </g>
      <path d="M120 49 v 114" stroke="${alfa("#0c0f18", 0.6)}" stroke-width="2.4"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="13" fill="${p.pele.base}"/>
      <rect x="162" y="100" width="14" height="26" rx="7" fill="#20242e"/>
      <rect x="166" y="106" width="6" height="14" rx="3" fill="${p.destaque.base}"/>
      <ellipse cx="120" cy="152" rx="18" ry="6" fill="${alfa(p.pele.profundo, 0.26)}"/>
      ${rimLight()}`
    },
    // ── 4.6 F2 · Onda 8 (final §28) — 4 rostos humanoides ─────────────
    {
      id: "bas_madura",
      categoria: "base",
      nome: "Madura",
      descricao: "Elegância que não pede licença para liderar.",
      raridade: "incomum",
      tema: "executivo",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <path d="M120 50 c 26 0 44 16 46 42 c 2 22 -4 40 -14 52 l -18 16 c -8 7 -20 7 -28 0 l -18 -16 c -10 -12 -16 -30 -14 -52 c 2 -26 20 -42 46 -42 z" fill="url(#${u}pele)"/>
      <path d="M88 124 q 4 5 9 6 M152 124 q -4 5 -9 6" stroke="${alfa(p.pele.profundo, 0.24)}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <path d="M92 148 q 28 10 56 0" stroke="${alfa(p.pele.claro, 0.5)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="72" cy="${G.orelhaY}" rx="8.5" ry="12" fill="${p.pele.base}"/>
      <ellipse cx="168" cy="${G.orelhaY}" rx="8.5" ry="12" fill="${p.pele.base}"/>
      <circle cx="168" cy="124" r="2.4" fill="#e8b64c"/>
      <circle cx="72" cy="124" r="2.4" fill="#e8b64c"/>
      <ellipse cx="120" cy="153" rx="16" ry="5.4" fill="${alfa(p.pele.profundo, 0.24)}"/>
      ${rimLight()}`
    },
    {
      id: "bas_sereno",
      categoria: "base",
      nome: "Sereno",
      descricao: "Pressão externa não altera a pressão interna.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPele(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy}" rx="51" ry="55" fill="url(#${u}pele)"/>
      <path d="M92 138 q 28 8 56 0" stroke="${alfa(p.pele.claro, 0.45)}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="12.5" fill="${p.pele.base}"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="12.5" fill="${p.pele.base}"/>
      <ellipse cx="71.5" cy="${G.orelhaY}" rx="4" ry="6.8" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="168.5" cy="${G.orelhaY}" rx="4" ry="6.8" fill="${alfa(p.pele.escuro, 0.7)}"/>
      <ellipse cx="120" cy="152" rx="17" ry="5.6" fill="${alfa(p.pele.profundo, 0.22)}"/>
      ${rimLight()}`
    },
    {
      id: "bas_gotico",
      categoria: "base",
      nome: "Pálido Gótico",
      descricao: "Prefere modo escuro em tudo — inclusive na pele.",
      raridade: "raro",
      tema: "fantasia",
      render: (_p, u) => `
      <defs>${defsPele(u, "#f0eef4", "#ddd8e6", "#b8b0c9")}</defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}pesc)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy}" rx="${G.cabecaRx}" ry="${G.cabecaRy}" fill="url(#${u}pele)"/>
      <ellipse cx="100" cy="118" rx="8" ry="5" fill="${alfa("#7c5cff", 0.14)}"/>
      <ellipse cx="140" cy="118" rx="8" ry="5" fill="${alfa("#7c5cff", 0.14)}"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="13" fill="#ddd8e6"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="13" fill="#ddd8e6"/>
      <path d="M96 150 q 24 8 48 0" stroke="${alfa("#5a4a7a", 0.3)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="120" cy="152" rx="18" ry="6" fill="${alfa("#5a4a7a", 0.24)}"/>
      ${rimLight()}`
    },
    {
      id: "bas_estatua",
      categoria: "base",
      nome: "Estátua Dourada",
      descricao: "O troféu do funcionário do século criou vida.",
      raridade: "lendario",
      tema: "fantasia",
      render: (_p, u) => `
      <defs>
        <radialGradient id="${u}ouro" cx="0.38" cy="0.28" r="1">
          <stop offset="0" stop-color="#ffe89a"/>
          <stop offset="0.58" stop-color="#e8b64c"/>
          <stop offset="1" stop-color="#a5731a"/>
        </radialGradient>
        <linearGradient id="${u}ouroP" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#a5731a"/>
          <stop offset="1" stop-color="#e8b64c"/>
        </linearGradient>
      </defs>
      <path d="${PATH_PESCOCO}" fill="url(#${u}ouroP)"/>
      <ellipse cx="${G.cx}" cy="${G.cabecaCy}" rx="${G.cabecaRx}" ry="${G.cabecaRy}" fill="url(#${u}ouro)"/>
      <ellipse cx="70" cy="${G.orelhaY}" rx="9" ry="13" fill="#e8b64c"/>
      <ellipse cx="170" cy="${G.orelhaY}" rx="9" ry="13" fill="#e8b64c"/>
      <path d="M86 70 l 6 -6 M96 60 l 8 -8" stroke="${alfa("#ffffff", 0.7)}" stroke-width="2.4" stroke-linecap="round">
        <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2.4s" repeatCount="indefinite"/>
      </path>
      <ellipse cx="120" cy="152" rx="18" ry="6" fill="${alfa("#7a5210", 0.4)}"/>
      ${rimLight()}`
    }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/partes/especies.ts
  var BRANCO = "#f4f1e8";
  function defsPelagem(u, claro, base, escuro) {
    return `
    <radialGradient id="${u}pel" cx="0.38" cy="0.28" r="1">
      <stop offset="0" stop-color="${claro}"/>
      <stop offset="0.58" stop-color="${base}"/>
      <stop offset="1" stop-color="${escuro}"/>
    </radialGradient>`;
  }
  var ESPECIES = [
    {
      id: "bas_panda",
      categoria: "base",
      nome: "Panda",
      descricao: "Calmo por fora, deadline por dentro.",
      raridade: "raro",
      tema: "animais",
      render: (_p, u) => `
      <defs>${defsPelagem(u, "#ffffff", "#f2f0ea", "#d9d5c9")}</defs>
      <path d="${PATH_PESCOCO}" fill="#e8e5db"/>
      <circle cx="82" cy="52" r="17" fill="#20242c"/>
      <circle cx="158" cy="52" r="17" fill="#20242c"/>
      <circle cx="84" cy="54" r="8" fill="#3a4050"/>
      <circle cx="156" cy="54" r="8" fill="#3a4050"/>
      <ellipse cx="120" cy="106" rx="52" ry="56" fill="url(#${u}pel)"/>
      <ellipse cx="100" cy="108" rx="17" ry="20" fill="#20242c" transform="rotate(-12 100 108)"/>
      <ellipse cx="140" cy="108" rx="17" ry="20" fill="#20242c" transform="rotate(12 140 108)"/>
      <ellipse cx="120" cy="138" rx="9" ry="6" fill="#20242c"/>
      <ellipse cx="120" cy="152" rx="20" ry="7" fill="${alfa("#000000", 0.12)}"/>
      <path d="M82 70 a 52 56 0 0 1 38 -20" stroke="${alfa("#ffffff", 0.5)}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "bas_coruja",
      categoria: "base",
      nome: "Coruja",
      descricao: "Vê tudo. Principalmente o que tentaram esconder no relatório.",
      raridade: "raro",
      tema: "animais",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <path d="M76 58 l -10 -26 l 24 12 z" fill="${p.pele.escuro}"/>
      <path d="M164 58 l 10 -26 l -24 12 z" fill="${p.pele.escuro}"/>
      <ellipse cx="120" cy="106" rx="52" ry="56" fill="url(#${u}pel)"/>
      <circle cx="100" cy="108" r="19" fill="${BRANCO}"/>
      <circle cx="140" cy="108" r="19" fill="${BRANCO}"/>
      <path d="M120 124 l -8 12 l 8 8 l 8 -8 z" fill="#e8963c"/>
      <path d="M84 150 q 36 16 72 0 q -18 14 -36 14 t -36 -14 z" fill="${alfa(p.pele.escuro, 0.5)}"/>
      <path d="M82 70 a 52 56 0 0 1 38 -20" stroke="${alfa("#ffffff", 0.35)}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "bas_raposa",
      categoria: "base",
      nome: "Raposa",
      descricao: "Esperta demais para reuniões que podiam ser e-mails.",
      raridade: "epico",
      tema: "animais",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <path d="M78 62 l -18 -38 l 34 18 z" fill="url(#${u}pel)"/>
      <path d="M162 62 l 18 -38 l -34 18 z" fill="url(#${u}pel)"/>
      <path d="M74 50 l -8 -18 l 16 9 z" fill="#2b2530"/>
      <path d="M166 50 l 8 -18 l -16 9 z" fill="#2b2530"/>
      <path d="M120 50 c 30 0 52 22 52 54 c 0 20 -8 36 -22 46 l -22 14 c -5 3 -11 3 -16 0 l -22 -14 c -14 -10 -22 -26 -22 -46 c 0 -32 22 -54 52 -54 z" fill="url(#${u}pel)"/>
      <path d="M120 118 c 14 0 26 8 26 20 c 0 14 -12 24 -26 24 s -26 -10 -26 -24 c 0 -12 12 -20 26 -20 z" fill="${BRANCO}"/>
      <path d="M120 126 l -7 8 l 7 6 l 7 -6 z" fill="#2b2530"/>
      <path d="M82 70 a 52 56 0 0 1 38 -20" stroke="${alfa("#ffffff", 0.35)}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "bas_lobo",
      categoria: "base",
      nome: "Lobo",
      descricao: "Caça metas em matilha, mas fecha o trimestre sozinho se precisar.",
      raridade: "epico",
      tema: "animais",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <path d="M70 70 l -22 -30 l 34 10 z" fill="url(#${u}pel)"/>
      <path d="M170 70 l 22 -30 l -34 10 z" fill="url(#${u}pel)"/>
      <ellipse cx="120" cy="106" rx="53" ry="57" fill="url(#${u}pel)"/>
      <path d="M68 118 l -12 8 l 12 4 z m 104 0 l 12 8 l -12 4 z" fill="${alfa(p.pele.escuro, 0.8)}"/>
      <path d="M120 120 c 13 0 24 8 24 20 c 0 13 -11 22 -24 22 s -24 -9 -24 -22 c 0 -12 11 -20 24 -20 z" fill="${alfa(BRANCO, 0.92)}"/>
      <path d="M120 126 l -7 7 l 7 6 l 7 -6 z" fill="#232028"/>
      <path d="M108 154 l 4 7 l 4 -7 z m 16 0 l 4 7 l 4 -7 z" fill="${BRANCO}"/>
      <path d="M82 68 a 53 57 0 0 1 38 -18" stroke="${alfa("#ffffff", 0.3)}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "bas_leao",
      categoria: "base",
      nome: "Leão",
      descricao: "A juba entra na sala antes dele.",
      raridade: "lendario",
      tema: "animais",
      usaCores: ["pele", "cabelo"],
      render: (p, u) => {
        let juba = "";
        for (let i = 0; i < 12; i++) {
          const ang = i * 30 * Math.PI / 180;
          const x = 120 + Math.cos(ang) * 66;
          const y = 104 + Math.sin(ang) * 68;
          juba += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="24" fill="${i % 2 ? p.cabelo.base : p.cabelo.escuro}"/>`;
        }
        return `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      ${juba}
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <circle cx="78" cy="56" r="13" fill="url(#${u}pel)"/>
      <circle cx="162" cy="56" r="13" fill="url(#${u}pel)"/>
      <circle cx="78" cy="58" r="6" fill="${alfa(p.pele.escuro, 0.8)}"/>
      <circle cx="162" cy="58" r="6" fill="${alfa(p.pele.escuro, 0.8)}"/>
      <ellipse cx="120" cy="106" rx="52" ry="56" fill="url(#${u}pel)"/>
      <path d="M120 122 c 12 0 22 7 22 18 c 0 12 -10 20 -22 20 s -22 -8 -22 -20 c 0 -11 10 -18 22 -18 z" fill="${alfa(BRANCO, 0.85)}"/>
      <path d="M120 128 l -7 7 l 7 6 l 7 -6 z" fill="#3a2a1a"/>
      <path d="M82 70 a 52 56 0 0 1 38 -20" stroke="${alfa("#ffffff", 0.35)}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
      }
    },
    {
      id: "bas_alien",
      categoria: "base",
      nome: "Alienígena",
      descricao: "Veio estudar a humanidade. Ficou pelo dashboard.",
      raridade: "mitico",
      tema: "sci-fi",
      usaCores: ["pele", "destaque"],
      render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <path d="M96 44 q -10 -22 -22 -26" stroke="${p.pele.escuro}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M144 44 q 10 -22 22 -26" stroke="${p.pele.escuro}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="74" cy="18" r="7" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="166" cy="18" r="7" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <path d="M120 44 c 34 0 54 24 54 56 c 0 26 -14 46 -32 56 c -7 4 -37 4 -44 0 c -18 -10 -32 -30 -32 -56 c 0 -32 20 -56 54 -56 z" fill="url(#${u}pel)"/>
      <ellipse cx="120" cy="152" rx="16" ry="5" fill="${alfa(p.pele.profundo, 0.3)}"/>
      <path d="M78 74 a 54 58 0 0 1 42 -24" stroke="${alfa("#ffffff", 0.4)}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "bas_ledbot",
      categoria: "base",
      nome: "LED Bot",
      descricao: "O mascote oficial da Dshow. Nasceu num painel de LED e nunca saiu do ar.",
      raridade: "exclusivo",
      tema: "dshow",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}lb" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stop-color="#3a4152"/>
          <stop offset="1" stop-color="#161a24"/>
        </linearGradient>
      </defs>
      <path d="M105 146 h30 v38 c0 8 -30 8 -30 0 z" fill="#20242c"/>
      <rect x="107" y="152" width="26" height="4" rx="2" fill="${alfa(p.destaque.base, 0.9)}"/>
      <rect x="66" y="50" width="108" height="112" rx="34" fill="url(#${u}lb)" stroke="${alfa(p.destaque.base, 0.55)}" stroke-width="2.5"/>
      <rect x="78" y="62" width="84" height="88" rx="24" fill="#0a0d15"/>
      <rect x="78" y="88" width="84" height="2" fill="${alfa(p.destaque.base, 0.14)}"/>
      <rect x="78" y="112" width="84" height="2" fill="${alfa(p.destaque.base, 0.14)}"/>
      <rect x="78" y="136" width="84" height="2" fill="${alfa(p.destaque.base, 0.14)}"/>
      <rect x="56" y="92" width="12" height="30" rx="6" fill="#20242c"/>
      <rect x="172" y="92" width="12" height="30" rx="6" fill="#20242c"/>
      <rect x="59" y="98" width="6" height="18" rx="3" fill="${p.destaque.base}"/>
      <rect x="175" y="98" width="6" height="18" rx="3" fill="${p.destaque.base}"/>
      <circle cx="120" cy="42" r="6" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <line x1="120" y1="48" x2="120" y2="56" stroke="#20242c" stroke-width="4"/>
      <path d="M80 66 a 24 24 0 0 1 20 -8" stroke="${alfa("#ffffff", 0.3)}" stroke-width="4" stroke-linecap="round" fill="none"/>`
    },
    // ── 4.6 F2 · Onda 7 — 4 espécies novas ────────────────────────────
    {
      id: "bas_gato",
      categoria: "base",
      nome: "Gato",
      descricao: "Derruba o que estiver na borda da mesa. Inclusive prazos.",
      raridade: "raro",
      tema: "animais",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <path d="M78 70 l -14 -34 l 34 16 z" fill="url(#${u}pel)"/>
      <path d="M162 70 l 14 -34 l -34 16 z" fill="url(#${u}pel)"/>
      <path d="M80 62 l -8 -20 l 20 10 z" fill="${alfa("#ff9fb0", 0.75)}"/>
      <path d="M160 62 l 8 -20 l -20 10 z" fill="${alfa("#ff9fb0", 0.75)}"/>
      <ellipse cx="120" cy="108" rx="52" ry="54" fill="url(#${u}pel)"/>
      <ellipse cx="120" cy="134" rx="16" ry="11" fill="${BRANCO}"/>
      <path d="M120 130 l -4 -4 h 8 z" fill="#ff9fb0"/>
      <g stroke="${alfa("#ffffff", 0.75)}" stroke-width="1.6" stroke-linecap="round">
        <path d="M64 126 l 26 3 M64 136 l 26 -1 M176 126 l -26 3 M176 136 l -26 -1"/>
      </g>
      <path d="M84 70 a 52 54 0 0 1 36 -18" stroke="${alfa("#ffffff", 0.4)}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "bas_urso",
      categoria: "base",
      nome: "Urso",
      descricao: "Abraço de esmagamento e paciência de hibernação.",
      raridade: "raro",
      tema: "animais",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <circle cx="82" cy="56" r="16" fill="url(#${u}pel)"/>
      <circle cx="158" cy="56" r="16" fill="url(#${u}pel)"/>
      <circle cx="84" cy="58" r="7" fill="${alfa(p.pele.claro, 0.7)}"/>
      <circle cx="156" cy="58" r="7" fill="${alfa(p.pele.claro, 0.7)}"/>
      <ellipse cx="120" cy="108" rx="54" ry="55" fill="url(#${u}pel)"/>
      <ellipse cx="120" cy="136" rx="18" ry="13" fill="${alfa(p.pele.claro, 0.8)}"/>
      <ellipse cx="120" cy="130" rx="8" ry="6" fill="#2b2118"/>
      <path d="M84 70 a 54 55 0 0 1 38 -19" stroke="${alfa("#ffffff", 0.35)}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "bas_dragao",
      categoria: "base",
      nome: "Dragão",
      descricao: "Guarda tesouros: métricas boas e feedbacks salvos.",
      raridade: "lendario",
      tema: "fantasia",
      usaCores: ["pele", "destaque"],
      render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <path d="M84 58 c -10 -18 -8 -32 2 -40 c 4 12 12 18 20 20 z" fill="${p.destaque.base}"/>
      <path d="M156 58 c 10 -18 8 -32 -2 -40 c -4 12 -12 18 -20 20 z" fill="${p.destaque.base}"/>
      <path d="M112 44 c 2 -8 6 -12 8 -12 s 6 4 8 12 l -8 6 z" fill="${p.destaque.profundo}"/>
      <ellipse cx="120" cy="108" rx="52" ry="55" fill="url(#${u}pel)"/>
      <g fill="${alfa(p.pele.escuro, 0.5)}">
        <path d="M78 92 q 5 -4 10 0 q -5 4 -10 0 z M92 78 q 5 -4 10 0 q -5 4 -10 0 z M150 80 q 5 -4 10 0 q -5 4 -10 0 z M160 96 q 5 -4 10 0 q -5 4 -10 0 z"/>
      </g>
      <ellipse cx="120" cy="136" rx="17" ry="11" fill="${alfa(p.pele.claro, 0.75)}"/>
      <path d="M110 132 q 2 -3 4 0 M126 132 q 2 -3 4 0" stroke="${p.pele.escuro}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M104 146 q 4 4 8 4 M136 146 q -4 4 -8 4" stroke="${alfa("#ffffff", 0.4)}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M84 70 a 52 55 0 0 1 36 -19" stroke="${alfa("#ffffff", 0.4)}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "bas_fantasma",
      categoria: "base",
      nome: "Fantasma",
      descricao: "Aparece nas dailies, some nas retros. Uivos opcionais.",
      raridade: "epico",
      tema: "fantasia",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <radialGradient id="${u}fan" cx="0.4" cy="0.3" r="1">
          <stop offset="0" stop-color="${alfa("#ffffff", 0.95)}"/>
          <stop offset="0.6" stop-color="${alfa("#e8ecfa", 0.85)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.claro, 0.6)}"/>
        </radialGradient>
      </defs>
      <path d="M104 150 h 32 v 30 c -5 6 -11 6 -16 0 c -5 6 -11 6 -16 0 z" fill="${alfa("#e8ecfa", 0.75)}"/>
      <ellipse cx="120" cy="104" rx="50" ry="56" fill="url(#${u}fan)"/>
      <path d="M70 120 c 0 22 8 34 16 40 c 4 -8 2 -16 -2 -22 c 8 6 12 14 12 22 c 6 -6 8 -14 6 -20 c 6 6 8 14 8 20 h 20 c 0 -6 2 -14 8 -20 c -2 6 0 14 6 20 c 0 -8 4 -16 12 -22 c -4 6 -6 14 -2 22 c 8 -6 16 -18 16 -40 z" fill="url(#${u}fan)"/>
      <ellipse cx="120" cy="196" rx="30" ry="5" fill="${alfa(p.destaque.base, 0.35)}">
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="3.4s" repeatCount="indefinite"/>
      </ellipse>
      <path d="M80 66 a 50 56 0 0 1 36 -20" stroke="${alfa("#ffffff", 0.7)}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    },
    // ── 4.6 F2 · Onda 8 (final §28) — 5 espécies novas ────────────────
    {
      id: "bas_tigre",
      categoria: "base",
      nome: "Tigre",
      descricao: "Listras de quem caça resultado em silêncio.",
      raridade: "epico",
      tema: "animais",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <path d="M80 66 l -12 -28 l 30 12 z" fill="url(#${u}pel)"/>
      <path d="M160 66 l 12 -28 l -30 12 z" fill="url(#${u}pel)"/>
      <ellipse cx="120" cy="108" rx="53" ry="55" fill="url(#${u}pel)"/>
      <g fill="#20242c">
        <path d="M92 58 q 6 10 2 18 q -8 -6 -10 -14 z"/>
        <path d="M148 58 q -6 10 -2 18 q 8 -6 10 -14 z"/>
        <path d="M68 96 q 12 2 18 8 q -10 4 -18 2 z"/>
        <path d="M172 96 q -12 2 -18 8 q 10 4 18 2 z"/>
        <path d="M70 128 q 10 0 16 5 q -8 5 -16 3 z"/>
        <path d="M170 128 q -10 0 -16 5 q 8 5 16 3 z"/>
        <path d="M112 52 q 8 -4 16 0 q -8 6 -16 0 z"/>
      </g>
      <ellipse cx="120" cy="136" rx="16" ry="11" fill="${BRANCO}"/>
      <path d="M120 132 l -4 -4 h 8 z" fill="#ff9fb0"/>
      <path d="M84 70 a 53 55 0 0 1 36 -18" stroke="${alfa("#ffffff", 0.4)}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "bas_sapo",
      categoria: "base",
      nome: "Sapo",
      descricao: "Engole um sapo por sprint. Profissionalmente.",
      raridade: "incomum",
      tema: "animais",
      usaCores: ["pele"],
      render: (p, u) => `
      <defs>${defsPelagem(u, p.pele.claro, p.pele.base, p.pele.escuro)}</defs>
      <path d="${PATH_PESCOCO}" fill="${p.pele.escuro}"/>
      <circle cx="94" cy="54" r="15" fill="url(#${u}pel)"/>
      <circle cx="146" cy="54" r="15" fill="url(#${u}pel)"/>
      <circle cx="94" cy="52" r="8" fill="${BRANCO}"/>
      <circle cx="146" cy="52" r="8" fill="${BRANCO}"/>
      <circle cx="94" cy="52" r="3.4" fill="#14100c"/>
      <circle cx="146" cy="52" r="3.4" fill="#14100c"/>
      <ellipse cx="120" cy="110" rx="52" ry="52" fill="url(#${u}pel)"/>
      <ellipse cx="120" cy="140" rx="22" ry="12" fill="${alfa(p.pele.claro, 0.65)}"/>
      <circle cx="86" cy="120" r="3" fill="${alfa(p.pele.escuro, 0.5)}"/>
      <circle cx="154" cy="120" r="3" fill="${alfa(p.pele.escuro, 0.5)}"/>
      <path d="M84 72 a 52 52 0 0 1 36 -16" stroke="${alfa("#ffffff", 0.4)}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "bas_slime",
      categoria: "base",
      nome: "Slime",
      descricao: "Se adapta a qualquer organograma. Literalmente.",
      raridade: "raro",
      tema: "fantasia",
      usaCores: ["pele", "destaque"],
      render: (p, u) => `
      <defs>
        <radialGradient id="${u}sli" cx="0.4" cy="0.3" r="1">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.9)}"/>
          <stop offset="0.6" stop-color="${alfa(p.destaque.base, 0.8)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.profundo, 0.85)}"/>
        </radialGradient>
      </defs>
      <path d="M104 148 h 32 v 34 c -10 6 -22 6 -32 0 z" fill="${alfa(p.destaque.base, 0.7)}"/>
      <path d="M120 50 c 30 0 50 24 50 54 c 0 20 -6 34 -16 44 q -2 8 -8 6 q -6 8 -12 4 q -8 6 -14 0 q -8 4 -12 -4 q -6 2 -8 -6 c -10 -10 -16 -24 -16 -44 c 0 -30 20 -54 50 -54 z" fill="url(#${u}sli)"/>
      <circle cx="96" cy="76" r="6" fill="${alfa("#ffffff", 0.5)}"/>
      <circle cx="146" cy="132" r="4" fill="${alfa("#ffffff", 0.3)}">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -18;0 0" dur="4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="90" cy="128" r="3" fill="${alfa("#ffffff", 0.3)}">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -12;0 0" dur="3.2s" repeatCount="indefinite"/>
      </circle>
      <path d="M80 66 a 50 54 0 0 1 38 -18" stroke="${alfa("#ffffff", 0.55)}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "bas_caveira",
      categoria: "base",
      nome: "Caveira",
      descricao: "Deadline literal. Sorriso permanente de quem já entregou tudo.",
      raridade: "epico",
      tema: "fantasia",
      render: (_p, u) => `
      <defs>
        <radialGradient id="${u}cav" cx="0.38" cy="0.28" r="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="0.6" stop-color="#eceadf"/>
          <stop offset="1" stop-color="#c9c4b0"/>
        </radialGradient>
      </defs>
      <path d="M108 150 h 24 v 34 c -8 5 -16 5 -24 0 z" fill="#d9d5c5"/>
      <path d="M120 50 c 30 0 48 22 48 50 c 0 18 -6 30 -16 38 v 14 c 0 8 -6 12 -12 12 h -40 c -6 0 -12 -4 -12 -12 v -14 c -10 -8 -16 -20 -16 -38 c 0 -28 18 -50 48 -50 z" fill="url(#${u}cav)"/>
      <path d="M108 146 v 14 M120 148 v 14 M132 146 v 14" stroke="#b8b29c" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="120" cy="134" rx="6" ry="8" fill="#3a362c"/>
      <path d="M84 66 a 48 50 0 0 1 36 -16" stroke="${alfa("#ffffff", 0.7)}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "bas_nuvem",
      categoria: "base",
      nome: "Nuvem",
      descricao: "Cabeça nas nuvens, uptime nos céus.",
      raridade: "raro",
      tema: "clima",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <radialGradient id="${u}nuv" cx="0.4" cy="0.3" r="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="0.7" stop-color="#eef2fa"/>
          <stop offset="1" stop-color="${alfa(p.destaque.claro, 0.75)}"/>
        </radialGradient>
      </defs>
      <path d="M104 150 h 32 v 30 c -10 6 -22 6 -32 0 z" fill="#dfe6f4"/>
      <circle cx="86" cy="90" r="26" fill="url(#${u}nuv)"/>
      <circle cx="120" cy="72" r="30" fill="url(#${u}nuv)"/>
      <circle cx="154" cy="90" r="26" fill="url(#${u}nuv)"/>
      <circle cx="94" cy="126" r="28" fill="url(#${u}nuv)"/>
      <circle cx="146" cy="126" r="28" fill="url(#${u}nuv)"/>
      <ellipse cx="120" cy="112" rx="44" ry="42" fill="url(#${u}nuv)"/>
      <circle cx="76" cy="150" r="3" fill="${alfa(p.destaque.base, 0.5)}">
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="166" cy="146" r="2.4" fill="${alfa(p.destaque.base, 0.5)}">
        <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2.8s" repeatCount="indefinite"/>
      </circle>
      <path d="M84 66 a 44 42 0 0 1 34 -14" stroke="${alfa("#ffffff", 0.85)}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/partes/olhos.ts
  var IRIS = "#4a3626";
  function olhoHumano(x, y) {
    return `
    <ellipse cx="${x}" cy="${y}" rx="10.5" ry="8" fill="#fdfdfa"/>
    <circle cx="${x}" cy="${y + 0.5}" r="5.2" fill="${IRIS}"/>
    <circle cx="${x}" cy="${y + 0.5}" r="2.5" fill="#14100c"/>
    <circle cx="${x + 1.8}" cy="${y - 1.6}" r="1.5" fill="#ffffff" opacity="0.9"/>
    <path d="M${x - 10} ${y - 2} a 10.5 8 0 0 1 21 0" fill="none" stroke="${alfa("#14100c", 0.25)}" stroke-width="1.4"/>`;
  }
  function sobrancelha(x, y, inclinacao, cor) {
    return `<path d="M${x - 11} ${y + inclinacao} q 11 ${-6 - inclinacao} 22 ${-inclinacao * 2}" stroke="${cor}" stroke-width="4.4" stroke-linecap="round" fill="none"/>`;
  }
  var OLHOS = [
    {
      id: "olh_padrao",
      categoria: "olhos",
      nome: "Confiante",
      descricao: "Olhar direto e tranquilo.",
      raridade: "comum",
      tema: "clássico",
      usaCores: ["cabelo"],
      render: (p) => `
      ${olhoHumano(100, 108)}${olhoHumano(140, 108)}
      ${sobrancelha(100, 93, 0, p.cabelo.escuro)}${sobrancelha(140, 93, 0, p.cabelo.escuro)}`
    },
    {
      id: "olh_focado",
      categoria: "olhos",
      nome: "Focado",
      descricao: "Sobrancelhas firmes: modo competitivo ligado.",
      raridade: "comum",
      tema: "gamer",
      usaCores: ["cabelo"],
      render: (p) => `
      ${olhoHumano(100, 109)}${olhoHumano(140, 109)}
      <path d="M88 90 l 23 6" stroke="${p.cabelo.escuro}" stroke-width="4.6" stroke-linecap="round"/>
      <path d="M152 90 l -23 6" stroke="${p.cabelo.escuro}" stroke-width="4.6" stroke-linecap="round"/>`
    },
    {
      id: "olh_feliz",
      categoria: "olhos",
      nome: "Alegre",
      descricao: "Olhos fechados de quem bateu a meta.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["cabelo"],
      render: (p) => `
      <path d="M90 110 q 10 -10 20 0" stroke="#14100c" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M130 110 q 10 -10 20 0" stroke="#14100c" stroke-width="4" stroke-linecap="round" fill="none"/>
      ${sobrancelha(100, 94, 1, p.cabelo.escuro)}${sobrancelha(140, 94, 1, p.cabelo.escuro)}
      <ellipse cx="88" cy="122" rx="7" ry="4" fill="${alfa("#ff6b6b", 0.25)}"/>
      <ellipse cx="152" cy="122" rx="7" ry="4" fill="${alfa("#ff6b6b", 0.25)}"/>`
    },
    {
      id: "olh_serio",
      categoria: "olhos",
      nome: "Analítico",
      descricao: "Meio-olhar de quem está auditando seus números.",
      raridade: "incomum",
      tema: "executivo",
      usaCores: ["cabelo"],
      render: (p) => `
      <path d="M89 104 h 22 a 11 9 0 0 1 -22 0 z" fill="#fdfdfa"/>
      <path d="M129 104 h 22 a 11 9 0 0 1 -22 0 z" fill="#fdfdfa"/>
      <circle cx="100" cy="108" r="4.6" fill="${IRIS}"/><circle cx="100" cy="108" r="2.2" fill="#14100c"/>
      <circle cx="140" cy="108" r="4.6" fill="${IRIS}"/><circle cx="140" cy="108" r="2.2" fill="#14100c"/>
      <line x1="89" y1="104" x2="111" y2="104" stroke="#14100c" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="129" y1="104" x2="151" y2="104" stroke="#14100c" stroke-width="2.4" stroke-linecap="round"/>
      ${sobrancelha(100, 92, -1, p.cabelo.escuro)}${sobrancelha(140, 92, -1, p.cabelo.escuro)}`
    },
    {
      id: "olh_brilho",
      categoria: "olhos",
      nome: "Estelar",
      descricao: "Pupilas em estrela — encantado com o resultado.",
      raridade: "raro",
      tema: "fantasia",
      usaCores: ["cabelo", "destaque"],
      render: (p) => {
        const estrela = (x, y) => `<path d="M${x} ${y - 5} l 1.5 3.4 l 3.7 0.4 l -2.8 2.5 l 0.8 3.7 l -3.2 -2 l -3.2 2 l 0.8 -3.7 l -2.8 -2.5 l 3.7 -0.4 z" fill="${p.destaque.base}"/>`;
        return `
      <ellipse cx="100" cy="108" rx="10.5" ry="8.5" fill="#fdfdfa"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8.5" fill="#fdfdfa"/>
      <circle cx="100" cy="108" r="6" fill="${p.destaque.profundo}"/>
      <circle cx="140" cy="108" r="6" fill="${p.destaque.profundo}"/>
      ${estrela(100, 108)}${estrela(140, 108)}
      ${sobrancelha(100, 93, 1, p.cabelo.escuro)}${sobrancelha(140, 93, 1, p.cabelo.escuro)}`;
      }
    },
    {
      id: "olh_led",
      categoria: "olhos",
      nome: "LED Sintético",
      descricao: "Óptica de androide com brilho constante.",
      raridade: "raro",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p) => `
      <rect x="88" y="102" width="24" height="11" rx="5.5" fill="#0a0d16"/>
      <rect x="128" y="102" width="24" height="11" rx="5.5" fill="#0a0d16"/>
      <rect x="92" y="105" width="16" height="5" rx="2.5" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.55;1" dur="3.2s" repeatCount="indefinite"/>
      </rect>
      <rect x="132" y="105" width="16" height="5" rx="2.5" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.55;1" dur="3.2s" repeatCount="indefinite"/>
      </rect>
      <circle cx="94" cy="107.5" r="1.2" fill="#ffffff" opacity="0.9"/>
      <circle cx="134" cy="107.5" r="1.2" fill="#ffffff" opacity="0.9"/>`
    },
    {
      id: "olh_brincalhao",
      categoria: "olhos",
      nome: "Piscadela",
      descricao: "Um olho no gráfico, outro na sexta-feira.",
      raridade: "incomum",
      tema: "casual",
      usaCores: ["cabelo"],
      render: (p) => `
      ${olhoHumano(100, 108)}
      <path d="M130 110 q 10 -8 20 0" stroke="#14100c" stroke-width="4" stroke-linecap="round" fill="none"/>
      ${sobrancelha(100, 91, 2, p.cabelo.escuro)}${sobrancelha(140, 95, 0, p.cabelo.escuro)}`
    },
    {
      id: "olh_cansado",
      categoria: "olhos",
      nome: "Pós-Deploy",
      descricao: "Sobreviveu à virada. As olheiras contam a história.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["cabelo"],
      render: (p) => `
      ${olhoHumano(100, 109)}${olhoHumano(140, 109)}
      <path d="M90 104 h20 a 10 8 0 0 0 -20 0 z" fill="${alfa(p.pele.escuro, 0.55)}"/>
      <path d="M130 104 h20 a 10 8 0 0 0 -20 0 z" fill="${alfa(p.pele.escuro, 0.55)}"/>
      <path d="M92 120 q 8 4 16 0 m 24 0 q 8 4 16 0" stroke="${alfa(p.pele.escuro, 0.5)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${sobrancelha(100, 95, 1, p.cabelo.escuro)}${sobrancelha(140, 95, 1, p.cabelo.escuro)}`
    },
    {
      id: "olh_misterioso",
      categoria: "olhos",
      nome: "Misterioso",
      descricao: "Ninguém sabe o que ele planeja. Nem o roadmap.",
      raridade: "raro",
      tema: "fantasia",
      usaCores: ["destaque"],
      render: (p) => `
      <path d="M66 88 h108 v22 q -54 14 -108 0 z" fill="${alfa("#0c0f1a", 0.62)}"/>
      <ellipse cx="100" cy="106" rx="6" ry="4.5" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.6;1" dur="3s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="140" cy="106" rx="6" ry="4.5" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.6;1" dur="3s" repeatCount="indefinite"/>
      </ellipse>`
    },
    {
      id: "olh_vilao",
      categoria: "olhos",
      nome: "Vilão",
      descricao: "Todo herói de meta precisa de um rival à altura.",
      raridade: "mitico",
      tema: "fantasia",
      usaCores: ["cabelo"],
      render: (p) => `
      <path d="M88 104 l 24 4 a 11 8 0 0 1 -22 2 z" fill="#fdfdfa"/>
      <path d="M152 104 l -24 4 a 11 8 0 0 0 22 2 z" fill="#fdfdfa"/>
      <circle cx="102" cy="109" r="4.6" fill="#a11a1a"/><circle cx="102" cy="109" r="2" fill="#2a0505"/>
      <circle cx="138" cy="109" r="4.6" fill="#a11a1a"/><circle cx="138" cy="109" r="2" fill="#2a0505"/>
      <circle cx="103.5" cy="107.5" r="1.1" fill="#ff8f8f"/>
      <circle cx="139.5" cy="107.5" r="1.1" fill="#ff8f8f"/>
      <path d="M86 92 l 26 10" stroke="${p.cabelo.escuro}" stroke-width="4.8" stroke-linecap="round"/>
      <path d="M154 92 l -26 10" stroke="${p.cabelo.escuro}" stroke-width="4.8" stroke-linecap="round"/>`
    },
    {
      id: "olh_visor",
      categoria: "olhos",
      nome: "Visor Tático",
      descricao: "Faixa de visor translúcida com HUD de combate.",
      raridade: "epico",
      tema: "cyberpunk",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}vis" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.9)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.profundo, 0.82)}"/>
        </linearGradient>
      </defs>
      <path d="M72 96 h 96 a 8 8 0 0 1 8 8 v 8 a 8 8 0 0 1 -8 8 h -96 a 8 8 0 0 1 -8 -8 v -8 a 8 8 0 0 1 8 -8 z" fill="url(#${u}vis)" stroke="${p.destaque.profundo}" stroke-width="2"/>
      <path d="M70 100 h 100" stroke="${alfa("#ffffff", 0.5)}" stroke-width="1.6"/>
      <rect x="86" y="104" width="26" height="6" rx="3" fill="${alfa("#ffffff", 0.75)}"/>
      <rect x="128" y="104" width="26" height="6" rx="3" fill="${alfa("#ffffff", 0.75)}"/>
      <path d="M150 113 h 12 m -6 -6 v 12" stroke="${alfa("#ffffff", 0.5)}" stroke-width="1"/>
      <rect x="64" y="96" width="8" height="24" rx="4" fill="${p.destaque.profundo}"/>
      <rect x="168" y="96" width="8" height="24" rx="4" fill="${p.destaque.profundo}"/>`
    },
    // ── 4.6 F2 · Onda 1 (identidade) — 8 olhares novos ────────────────
    {
      id: "olh_sonolento",
      categoria: "olhos",
      nome: "Sonolento",
      descricao: "Café ainda não fez efeito.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["cabelo"],
      render: (p) => `
      <path d="M90 108 a 10.5 8 0 0 0 20 2" fill="none" stroke="#14100c" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M130 110 a 10.5 8 0 0 0 20 0" fill="none" stroke="#14100c" stroke-width="3.4" stroke-linecap="round"/>
      <circle cx="101" cy="111" r="3.4" fill="#14100c"/>
      <circle cx="141" cy="111" r="3.4" fill="#14100c"/>
      <path d="M90 104 h 20 M130 104 h 20" stroke="${alfa(p.pele.escuro, 0.55)}" stroke-width="4" stroke-linecap="round"/>
      ${sobrancelha(100, 96, 2, p.cabelo.escuro)}${sobrancelha(140, 96, 2, p.cabelo.escuro)}
      <path d="M160 84 l 5 -5 h -5 l 5 -5" stroke="${alfa("#8b93a7", 0.8)}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
    },
    {
      id: "olh_desconfiado",
      categoria: "olhos",
      nome: "Desconfiado",
      descricao: 'Uma sobrancelha no alto: "tem certeza desse número?"',
      raridade: "incomum",
      tema: "executivo",
      usaCores: ["cabelo"],
      render: (p) => `
      ${olhoHumano(100, 108)}
      <ellipse cx="140" cy="109" rx="10.5" ry="5.6" fill="#fdfdfa"/>
      <circle cx="140" cy="109.5" r="4.4" fill="${IRIS}"/>
      <circle cx="140" cy="109.5" r="2.2" fill="#14100c"/>
      <path d="M129 106 h 22" stroke="${alfa(p.pele.escuro, 0.5)}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M88 88 q 12 -8 24 -2" stroke="${p.cabelo.escuro}" stroke-width="4.4" stroke-linecap="round" fill="none"/>
      <path d="M129 96 l 22 2" stroke="${p.cabelo.escuro}" stroke-width="4.4" stroke-linecap="round"/>`
    },
    {
      id: "olh_apaixonado",
      categoria: "olhos",
      nome: "Apaixonado",
      descricao: "Quando o resultado do mês chega verde.",
      raridade: "raro",
      tema: "casual",
      usaCores: ["cabelo"],
      render: (p) => {
        const coracao = (x, y) => `
        <path d="M${x} ${y + 5} l -6.5 -6.5 a 4.5 4.5 0 1 1 6.5 -5 a 4.5 4.5 0 1 1 6.5 5 z" fill="#ff5f8f">
          <animateTransform attributeName="transform" type="scale" values="1;1.12;1" dur="1.2s" repeatCount="indefinite" additive="sum"/>
        </path>`;
        return `
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      ${coracao(100, 105)}${coracao(140, 105)}
      ${sobrancelha(100, 92, 1, p.cabelo.escuro)}${sobrancelha(140, 92, 1, p.cabelo.escuro)}`;
      }
    },
    {
      id: "olh_cifrao",
      categoria: "olhos",
      nome: "Cifrão",
      descricao: "ROI detectado. Pupilas em modo faturamento.",
      raridade: "epico",
      tema: "executivo",
      usaCores: ["cabelo"],
      render: (p) => {
        const cifra = (x) => `
        <ellipse cx="${x}" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
        <circle cx="${x}" cy="108" r="6" fill="#1d7a46"/>
        <text x="${x}" y="112" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="800" fill="#aef4c4">$</text>`;
        return `
      ${cifra(100)}${cifra(140)}
      ${sobrancelha(100, 92, 0, p.cabelo.escuro)}${sobrancelha(140, 92, 0, p.cabelo.escuro)}`;
      }
    },
    {
      id: "olh_estrela",
      categoria: "olhos",
      nome: "Estrelado",
      descricao: "Viu o lançamento e virou fã na hora.",
      raridade: "raro",
      tema: "gamer",
      usaCores: ["cabelo", "destaque"],
      render: (p) => {
        const estrela = (x, y) => {
          let d = "";
          for (let i = 0; i < 5; i++) {
            const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
            const b = a + Math.PI / 5;
            d += `${i === 0 ? "M" : "L"}${(x + Math.cos(a) * 6.5).toFixed(1)} ${(y + Math.sin(a) * 6.5).toFixed(1)} L${(x + Math.cos(b) * 2.8).toFixed(1)} ${(y + Math.sin(b) * 2.8).toFixed(1)} `;
          }
          return `<path d="${d}z" fill="${p.destaque.base}"/>`;
        };
        return `
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      ${estrela(100, 108)}${estrela(140, 108)}
      ${sobrancelha(100, 92, 1, p.cabelo.escuro)}${sobrancelha(140, 92, 1, p.cabelo.escuro)}`;
      }
    },
    {
      id: "olh_arregalado",
      categoria: "olhos",
      nome: "Arregalado",
      descricao: "Plot twist na daily.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["cabelo"],
      render: (p) => `
      <circle cx="100" cy="108" r="10" fill="#fdfdfa" stroke="${alfa("#14100c", 0.3)}" stroke-width="1.4"/>
      <circle cx="140" cy="108" r="10" fill="#fdfdfa" stroke="${alfa("#14100c", 0.3)}" stroke-width="1.4"/>
      <circle cx="100" cy="108" r="3.2" fill="#14100c"/>
      <circle cx="140" cy="108" r="3.2" fill="#14100c"/>
      <circle cx="101.5" cy="106" r="1.1" fill="#ffffff"/>
      <circle cx="141.5" cy="106" r="1.1" fill="#ffffff"/>
      ${sobrancelha(100, 88, -2, p.cabelo.escuro)}${sobrancelha(140, 88, -2, p.cabelo.escuro)}`
    },
    {
      id: "olh_emocionado",
      categoria: "olhos",
      nome: "Emocionado",
      descricao: "Lágrima de alegria — bateu a meta do trimestre.",
      raridade: "incomum",
      tema: "casual",
      usaCores: ["cabelo"],
      render: (p) => `
      <path d="M90 110 q 10 -10 20 0" stroke="#14100c" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M130 110 q 10 -10 20 0" stroke="#14100c" stroke-width="4" stroke-linecap="round" fill="none"/>
      ${sobrancelha(100, 94, 1, p.cabelo.escuro)}${sobrancelha(140, 94, 1, p.cabelo.escuro)}
      <path d="M152 112 q 5 8 0 12 q -5 -4 0 -12 z" fill="#69c8ff" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1.8s" repeatCount="indefinite"/>
      </path>`
    },
    {
      id: "olh_pixel",
      categoria: "olhos",
      nome: "Pixel Retro",
      descricao: "Óptica 8-bit direto do fliperama.",
      raridade: "epico",
      tema: "gamer",
      piscar: false,
      // tela não pisca — sem pálpebras no idle
      usaCores: ["destaque"],
      render: (p) => {
        const px = (x) => `
        <rect x="${x - 8}" y="100" width="16" height="16" fill="#0f131d"/>
        <rect x="${x - 5}" y="103" width="6" height="6" fill="${p.destaque.base}"/>
        <rect x="${x + 1}" y="109" width="4" height="4" fill="${alfa(p.destaque.claro, 0.9)}"/>
        <rect x="${x - 8}" y="100" width="16" height="2" fill="${alfa("#ffffff", 0.18)}"/>`;
        return `
      ${px(100)}${px(140)}
      <rect x="88" y="92" width="24" height="4" fill="${p.destaque.profundo}"/>
      <rect x="128" y="92" width="24" height="4" fill="${p.destaque.profundo}"/>`;
      }
    },
    // ── 4.6 F2 · Onda 6 (identidade) — 12 olhares novos ───────────────
    {
      id: "olh_gentil",
      categoria: "olhos",
      nome: "Gentil",
      descricao: "O code review mais educado da empresa.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["cabelo"],
      render: (p) => `
      ${olhoHumano(100, 109)}${olhoHumano(140, 109)}
      <path d="M89 101 q 11 -7 22 -2" stroke="${p.cabelo.escuro}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M129 99 q 11 -5 22 2" stroke="${p.cabelo.escuro}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M92 118 q 8 3 16 1 M132 119 q 8 2 16 -1" stroke="${alfa(p.pele.escuro, 0.35)}" stroke-width="2" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "olh_furia",
      categoria: "olhos",
      nome: "Fúria",
      descricao: "Alguém deu force push na main.",
      raridade: "raro",
      tema: "fantasia",
      usaCores: ["cabelo"],
      render: (p) => `
      <ellipse cx="100" cy="109" rx="10.5" ry="7" fill="#ffe8e4"/>
      <ellipse cx="140" cy="109" rx="10.5" ry="7" fill="#ffe8e4"/>
      <circle cx="100" cy="109.5" r="4.6" fill="#c1272d"/>
      <circle cx="140" cy="109.5" r="4.6" fill="#c1272d"/>
      <circle cx="100" cy="109.5" r="2" fill="#3d0508"/>
      <circle cx="140" cy="109.5" r="2" fill="#3d0508"/>
      <circle cx="100" cy="109.5" r="7" fill="none" stroke="rgba(255,82,48,0.5)" stroke-width="2">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="140" cy="109.5" r="7" fill="none" stroke="rgba(255,82,48,0.5)" stroke-width="2">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.4s" repeatCount="indefinite"/>
      </circle>
      <path d="M87 88 l 24 9 M153 88 l -24 9" stroke="${p.cabelo.escuro}" stroke-width="4.8" stroke-linecap="round"/>`
    },
    {
      id: "olh_hipnotico",
      categoria: "olhos",
      nome: "Hipnótico",
      descricao: "Você já concordou com a proposta. Só não sabe ainda.",
      raridade: "epico",
      tema: "fantasia",
      piscar: false,
      usaCores: ["destaque"],
      render: (p) => {
        const espiral = (x, sentido) => `
        <g transform="translate(${x} 108)">
          <circle r="9.5" fill="#fdfdfa"/>
          <g>
            <path d="M0 0 m 0 -1.5 a 1.5 1.5 0 0 1 1.5 1.5 a 3 3 0 0 1 -3 3 a 4.8 4.8 0 0 1 -4.8 -4.8 a 6.8 6.8 0 0 1 6.8 -6.8 a 8.6 8.6 0 0 1 8.6 8.6" fill="none" stroke="${p.destaque.profundo}" stroke-width="2.2"/>
            <animateTransform attributeName="transform" type="rotate" values="0;${sentido * 360}" dur="3.2s" repeatCount="indefinite"/>
          </g>
        </g>`;
        return `${espiral(100, 1)}${espiral(140, -1)}`;
      }
    },
    {
      id: "olh_scanner",
      categoria: "olhos",
      nome: "Scanner",
      descricao: "Linha única varrendo o ambiente por métricas fracas.",
      raridade: "raro",
      tema: "sci-fi",
      piscar: false,
      usaCores: ["destaque"],
      render: (p) => `
      <rect x="86" y="103" width="28" height="10" rx="5" fill="#0c0f1a"/>
      <rect x="126" y="103" width="28" height="10" rx="5" fill="#0c0f1a"/>
      <rect x="90" y="106" width="6" height="4" rx="2" fill="${p.destaque.claro}">
        <animate attributeName="x" values="90;104;90" dur="2.2s" repeatCount="indefinite"/>
      </rect>
      <rect x="130" y="106" width="6" height="4" rx="2" fill="${p.destaque.claro}">
        <animate attributeName="x" values="144;130;144" dur="2.2s" repeatCount="indefinite"/>
      </rect>`
    },
    {
      id: "olh_gatinho",
      categoria: "olhos",
      nome: "Delineado Gatinho",
      descricao: "O traço que corta qualquer reunião ao meio.",
      raridade: "incomum",
      tema: "clássico",
      usaCores: ["cabelo"],
      render: (p) => `
      ${olhoHumano(100, 108)}${olhoHumano(140, 108)}
      <path d="M89 103 q 10 -6 21 -1 l 4 3 M110 105 l 6 -4" stroke="#14100c" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M129 102 q 11 -5 22 1 l -4 2 M150 104 l 7 -5" stroke="#14100c" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      ${sobrancelha(100, 92, 1, p.cabelo.escuro)}${sobrancelha(140, 92, 1, p.cabelo.escuro)}`
    },
    {
      id: "olh_heterocromia",
      categoria: "olhos",
      nome: "Heterocromia",
      descricao: "Um olho natural, um olho na cor da sua energia.",
      raridade: "epico",
      tema: "fantasia",
      usaCores: ["cabelo", "destaque"],
      render: (p) => `
      ${olhoHumano(100, 108)}
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      <circle cx="140" cy="108.5" r="5.2" fill="${p.destaque.base}"/>
      <circle cx="140" cy="108.5" r="2.5" fill="#14100c"/>
      <circle cx="141.8" cy="106.4" r="1.5" fill="#ffffff" opacity="0.9"/>
      <path d="M130 106 a 10.5 8 0 0 1 21 0" fill="none" stroke="${alfa("#14100c", 0.25)}" stroke-width="1.4"/>
      ${sobrancelha(100, 93, 0, p.cabelo.escuro)}${sobrancelha(140, 93, 0, p.cabelo.escuro)}`
    },
    {
      id: "olh_zen",
      categoria: "olhos",
      nome: "Zen",
      descricao: "Inbox zero por dentro e por fora.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["cabelo"],
      render: (p) => `
      <path d="M90 108 q 10 4 20 0" stroke="#14100c" stroke-width="3.6" stroke-linecap="round" fill="none"/>
      <path d="M130 108 q 10 4 20 0" stroke="#14100c" stroke-width="3.6" stroke-linecap="round" fill="none"/>
      ${sobrancelha(100, 95, 1, p.cabelo.escuro)}${sobrancelha(140, 95, 1, p.cabelo.escuro)}`
    },
    {
      id: "olh_na_mira",
      categoria: "olhos",
      nome: "Na Mira",
      descricao: "Meta adquirida. Distância: um trimestre.",
      raridade: "raro",
      tema: "gamer",
      piscar: false,
      usaCores: ["destaque"],
      render: (p) => {
        const mira = (x) => `
        <g transform="translate(${x} 108)">
          <circle r="9" fill="#fdfdfa"/>
          <circle r="7" fill="none" stroke="${p.destaque.profundo}" stroke-width="1.6"/>
          <circle r="2.2" fill="${p.destaque.profundo}"/>
          <path d="M0 -9 v 4 M0 9 v -4 M-9 0 h 4 M9 0 h -4" stroke="${p.destaque.profundo}" stroke-width="1.6"/>
        </g>`;
        return `${mira(100)}${mira(140)}`;
      }
    },
    {
      id: "olh_anime",
      categoria: "olhos",
      nome: "Brilho de Anime",
      descricao: "Reflexos gigantes de protagonista no episódio final.",
      raridade: "raro",
      tema: "fantasia",
      usaCores: ["cabelo", "destaque"],
      render: (p) => {
        const olho = (x) => `
        <ellipse cx="${x}" cy="108" rx="11" ry="10" fill="#fdfdfa"/>
        <ellipse cx="${x}" cy="109" rx="7.5" ry="8" fill="${p.destaque.profundo}"/>
        <ellipse cx="${x}" cy="110" rx="4" ry="4.6" fill="#14100c"/>
        <ellipse cx="${x - 2.6}" cy="104.5" rx="3" ry="2.4" fill="#ffffff"/>
        <circle cx="${x + 3.4}" cy="112" r="1.6" fill="#ffffff" opacity="0.85"/>
        <circle cx="${x + 1}" cy="106" r="0.9" fill="#ffffff"/>`;
        return `
      ${olho(100)}${olho(140)}
      ${sobrancelha(100, 91, 1, p.cabelo.escuro)}${sobrancelha(140, 91, 1, p.cabelo.escuro)}`;
      }
    },
    {
      id: "olh_calculista",
      categoria: "olhos",
      nome: "Calculista",
      descricao: "Dá para ver as planilhas refletidas na íris.",
      raridade: "incomum",
      tema: "executivo",
      usaCores: ["cabelo"],
      render: (p) => `
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      <circle cx="100" cy="108.5" r="5.2" fill="#1d4a3a"/>
      <circle cx="140" cy="108.5" r="5.2" fill="#1d4a3a"/>
      <path d="M97 107 h 6 M100 104 v 7 M137 107 h 6 M140 104 v 7" stroke="#aef4c4" stroke-width="1"/>
      ${sobrancelha(100, 92, -1, p.cabelo.escuro)}${sobrancelha(140, 92, -1, p.cabelo.escuro)}`
    },
    {
      id: "olh_prisma",
      categoria: "olhos",
      nome: "Prisma",
      descricao: "A íris decidiu ser todas as cores ao mesmo tempo.",
      raridade: "lendario",
      tema: "fantasia",
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}pri" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ff5f8f"/>
          <stop offset="0.35" stop-color="#e8b64c"/>
          <stop offset="0.7" stop-color="#4cd97c"/>
          <stop offset="1" stop-color="#4c9de8"/>
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
      <circle cx="100" cy="108.5" r="5.4" fill="url(#${u}pri)"/>
      <circle cx="140" cy="108.5" r="5.4" fill="url(#${u}pri)"/>
      <circle cx="100" cy="108.5" r="2.2" fill="#14100c"/>
      <circle cx="140" cy="108.5" r="2.2" fill="#14100c"/>
      <circle cx="101.8" cy="106.2" r="1.4" fill="#ffffff"/>
      <circle cx="141.8" cy="106.2" r="1.4" fill="#ffffff"/>
      ${sobrancelha(100, 92, 0, p.cabelo.escuro)}${sobrancelha(140, 92, 0, p.cabelo.escuro)}`
    },
    {
      id: "olh_vazio",
      categoria: "olhos",
      nome: "Void",
      descricao: "Olhou para o abismo do legado. O abismo pediu refactor.",
      raridade: "mitico",
      tema: "fantasia",
      piscar: false,
      render: () => `
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="#050308"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="#050308"/>
      <circle cx="100" cy="108" r="1.4" fill="#ffffff">
        <animate attributeName="opacity" values="1;0.4;1" dur="2.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="140" cy="108" r="1.4" fill="#ffffff">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2.8s" repeatCount="indefinite"/>
      </circle>
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="none" stroke="rgba(124,92,255,0.35)" stroke-width="1.6"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="none" stroke="rgba(124,92,255,0.35)" stroke-width="1.6"/>`
    },
    // ── 4.6 F2 · Onda 7 — 9 olhares finais (meta §28: 40 ✓) ───────────
    {
      id: "olh_lagrima",
      categoria: "olhos",
      nome: "Lágrima Solitária",
      descricao: "O commit foi revertido. A lágrima, não.",
      raridade: "incomum",
      tema: "casual",
      usaCores: ["cabelo"],
      render: (p) => `
      ${olhoHumano(100, 108)}${olhoHumano(140, 108)}
      ${sobrancelha(100, 94, 2, p.cabelo.escuro)}${sobrancelha(140, 94, 2, p.cabelo.escuro)}
      <path d="M92 118 q 3 6 0 10 q -3 -4 0 -10 z" fill="#69c8ff" opacity="0.9"/>`
    },
    {
      id: "olh_chamas",
      categoria: "olhos",
      nome: "Olhos em Chamas",
      descricao: "A meta do trimestre olhou de volta — e pegou fogo.",
      raridade: "lendario",
      tema: "fantasia",
      piscar: false,
      render: (_p, u) => {
        const chama = (x) => `
        <ellipse cx="${x}" cy="108" rx="10.5" ry="8" fill="#1c0a06"/>
        <path d="M${x} 113 c -4 -1 -5 -5 -3 -8 c 1 1.5 2 2 3 2 c -1 -2 0 -4 2 -5.5 c 0 2 0.6 3.4 2 4.2 c 1.4 -0.8 2 -2 2 -3.4 c 1.6 3 0.6 7 -2.6 8.6 c -1 0.6 -2.4 1.4 -3.4 2.1 z" fill="url(#${u}fla${x})"/>
        <defs>
          <linearGradient id="${u}fla${x}" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stop-color="#ff5230"/>
            <stop offset="1" stop-color="#ffd75e"/>
          </linearGradient>
        </defs>`;
        return `${chama(100)}${chama(140)}
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="none" stroke="rgba(255,138,61,0.5)" stroke-width="1.8">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.2s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="none" stroke="rgba(255,138,61,0.5)" stroke-width="1.8">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.2s" repeatCount="indefinite"/>
      </ellipse>`;
      }
    },
    {
      id: "olh_congelante",
      categoria: "olhos",
      nome: "Congelante",
      descricao: "O feedback veio em temperatura negativa.",
      raridade: "raro",
      tema: "clima",
      usaCores: ["cabelo"],
      render: (p) => `
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="#eef8ff"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="#eef8ff"/>
      <circle cx="100" cy="108.5" r="5" fill="#7cc8f0"/>
      <circle cx="140" cy="108.5" r="5" fill="#7cc8f0"/>
      <circle cx="100" cy="108.5" r="2.2" fill="#0c2a3d"/>
      <circle cx="140" cy="108.5" r="2.2" fill="#0c2a3d"/>
      <path d="M88 100 l 4 3 m 4 -6 l 2 4 M152 100 l -4 3 m -4 -6 l -2 4" stroke="#bfe8ff" stroke-width="1.8" stroke-linecap="round"/>
      ${sobrancelha(100, 92, -1, p.cabelo.escuro)}${sobrancelha(140, 92, -1, p.cabelo.escuro)}`
    },
    {
      id: "olh_relogio",
      categoria: "olhos",
      nome: "Contra o Relógio",
      descricao: "Cada piscada custa 15 minutos de sprint.",
      raridade: "epico",
      tema: "executivo",
      piscar: false,
      render: () => {
        const relogio = (x, dur) => `
        <g transform="translate(${x} 108)">
          <circle r="9.5" fill="#fdfdfa" stroke="#3a4054" stroke-width="1.6"/>
          <path d="M0 -7.5 v 1.6 M0 7.5 v -1.6 M-7.5 0 h 1.6 M7.5 0 h -1.6" stroke="#3a4054" stroke-width="1.2"/>
          <path d="M0 0 v -5.5" stroke="#14100c" stroke-width="1.8" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="0;360" dur="${dur}s" repeatCount="indefinite"/>
          </path>
          <path d="M0 0 h 3.6" stroke="#ff5230" stroke-width="1.4" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="0;360" dur="3" repeatCount="indefinite"/>
          </path>
          <circle r="1.2" fill="#14100c"/>
        </g>`;
        return `${relogio(100, "12")}${relogio(140, "12")}`;
      }
    },
    {
      id: "olh_lente",
      categoria: "olhos",
      nome: "Lente de Câmera",
      descricao: "Abertura f/1.4 — captura até ideia mal iluminada.",
      raridade: "raro",
      tema: "tecnologia",
      piscar: false,
      render: () => {
        const lente = (x) => `
        <g transform="translate(${x} 108)">
          <circle r="9.5" fill="#0c0f18"/>
          <circle r="7" fill="none" stroke="#3a4054" stroke-width="1.4"/>
          <path d="M-5 -3 L0 -6 L5 -3 L6 2 L0 6 L-6 2 Z" fill="none" stroke="#5a6274" stroke-width="1.2"/>
          <circle r="2.6" fill="#1d3a5c"/>
          <circle cx="-2.4" cy="-3" r="1.6" fill="rgba(160,200,255,0.65)"/>
        </g>`;
        return `${lente(100)}${lente(140)}`;
      }
    },
    {
      id: "olh_timido",
      categoria: "olhos",
      nome: "Tímido",
      descricao: "Olhando para o chão e para as próprias ideias boas.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["cabelo"],
      render: (p) => `
      <ellipse cx="100" cy="109" rx="10" ry="7" fill="#fdfdfa"/>
      <ellipse cx="140" cy="109" rx="10" ry="7" fill="#fdfdfa"/>
      <circle cx="97" cy="112" r="4.4" fill="${IRIS}"/>
      <circle cx="137" cy="112" r="4.4" fill="${IRIS}"/>
      <circle cx="97" cy="112" r="2" fill="#14100c"/>
      <circle cx="137" cy="112" r="2" fill="#14100c"/>
      ${sobrancelha(100, 95, 2, p.cabelo.escuro)}${sobrancelha(140, 95, 2, p.cabelo.escuro)}
      <ellipse cx="88" cy="121" rx="6" ry="3.4" fill="${alfa("#ff6b6b", 0.28)}"/>
      <ellipse cx="152" cy="121" rx="6" ry="3.4" fill="${alfa("#ff6b6b", 0.28)}"/>`
    },
    {
      id: "olh_penetrante",
      categoria: "olhos",
      nome: "Penetrante",
      descricao: "Atravessa a desculpa e chega direto na causa raiz.",
      raridade: "incomum",
      tema: "executivo",
      usaCores: ["cabelo"],
      render: (p) => `
      <path d="M89 106 q 11 -6 22 0 q -11 8 -22 0 z" fill="#fdfdfa"/>
      <path d="M129 106 q 11 -6 22 0 q -11 8 -22 0 z" fill="#fdfdfa"/>
      <circle cx="100" cy="107.5" r="3.8" fill="${IRIS}"/>
      <circle cx="140" cy="107.5" r="3.8" fill="${IRIS}"/>
      <circle cx="100" cy="107.5" r="1.8" fill="#14100c"/>
      <circle cx="140" cy="107.5" r="1.8" fill="#14100c"/>
      <path d="M88 94 l 23 3 M152 94 l -23 3" stroke="${p.cabelo.escuro}" stroke-width="4.4" stroke-linecap="round"/>`
    },
    {
      id: "olh_galaxia",
      categoria: "olhos",
      nome: "Galáxia",
      descricao: "Duas espirais de estrelas no lugar do olhar.",
      raridade: "epico",
      tema: "espaço",
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>
        <radialGradient id="${u}gal" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stop-color="#c99aff"/>
          <stop offset="0.5" stop-color="#3d2a6e"/>
          <stop offset="1" stop-color="#0c0a2e"/>
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="108" rx="10.5" ry="8" fill="url(#${u}gal)"/>
      <ellipse cx="140" cy="108" rx="10.5" ry="8" fill="url(#${u}gal)"/>
      <circle cx="97" cy="106" r="0.9" fill="#ffffff"/>
      <circle cx="103" cy="110" r="0.7" fill="#ffffff" opacity="0.8"/>
      <circle cx="137" cy="110" r="0.9" fill="#ffffff"/>
      <circle cx="143" cy="106" r="0.7" fill="#ffffff" opacity="0.8"/>
      <circle cx="100" cy="108" r="1.6" fill="#ffffff">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.6s" repeatCount="indefinite"/>
      </circle>
      <circle cx="140" cy="108" r="1.6" fill="#ffffff">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.6s" repeatCount="indefinite"/>
      </circle>
      ${sobrancelha(100, 92, 0, p.cabelo.escuro)}${sobrancelha(140, 92, 0, p.cabelo.escuro)}`
    },
    {
      id: "olh_buscando_sinal",
      categoria: "olhos",
      nome: "Buscando Sinal",
      descricao: "Carregando resposta… não desligue o colaborador.",
      raridade: "incomum",
      tema: "tecnologia",
      piscar: false,
      render: () => {
        const pontos = (x, atraso) => `
        <ellipse cx="${x}" cy="108" rx="10.5" ry="8" fill="#fdfdfa"/>
        <circle cx="${x - 5}" cy="108" r="1.8" fill="#3a4054">
          <animate attributeName="opacity" values="0.25;1;0.25" dur="1.4s" begin="${atraso}s" repeatCount="indefinite"/>
        </circle>
        <circle cx="${x}" cy="108" r="1.8" fill="#3a4054">
          <animate attributeName="opacity" values="0.25;1;0.25" dur="1.4s" begin="${atraso + 0.25}s" repeatCount="indefinite"/>
        </circle>
        <circle cx="${x + 5}" cy="108" r="1.8" fill="#3a4054">
          <animate attributeName="opacity" values="0.25;1;0.25" dur="1.4s" begin="${atraso + 0.5}s" repeatCount="indefinite"/>
        </circle>`;
        return `${pontos(100, 0)}${pontos(140, 0.15)}`;
      }
    }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/partes/bocas.ts
  var BOCAS = [
    {
      id: "boc_sorriso",
      categoria: "boca",
      nome: "Sorriso",
      descricao: "Sorriso leve e seguro.",
      raridade: "comum",
      tema: "clássico",
      render: (p) => `
      <path d="M104 142 q 16 14 32 0" stroke="#5a2e26" stroke-width="4.6" stroke-linecap="round" fill="none"/>
      <path d="M108 150 q 12 6 24 0" stroke="${alfa(p.pele.escuro, 0.5)}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "boc_neutra",
      categoria: "boca",
      nome: "Neutra",
      descricao: "Expressão serena de poker face.",
      raridade: "comum",
      tema: "executivo",
      render: (p) => `
      <line x1="108" y1="145" x2="132" y2="145" stroke="#5a2e26" stroke-width="4.4" stroke-linecap="round"/>
      <line x1="110" y1="151" x2="130" y2="151" stroke="${alfa(p.pele.escuro, 0.4)}" stroke-width="2" stroke-linecap="round"/>`
    },
    {
      id: "boc_larga",
      categoria: "boca",
      nome: "Gargalhada",
      descricao: "Sorriso aberto com dentes — vitória garantida.",
      raridade: "comum",
      tema: "casual",
      render: () => `
      <path d="M102 140 q 18 22 36 0 q -18 8 -36 0 z" fill="#431d18"/>
      <path d="M105 141 q 15 6 30 0 l -2 5 q -13 5 -26 0 z" fill="#ffffff"/>
      <path d="M111 152 q 9 5 18 0 q -4 5 -9 5 t -9 -5 z" fill="#c2554d"/>`
    },
    {
      id: "boc_lado",
      categoria: "boca",
      nome: "Sorriso de Canto",
      descricao: "Meio sorriso de quem sabe o que está fazendo.",
      raridade: "incomum",
      tema: "gamer",
      render: (p) => `
      <path d="M104 146 q 16 6 34 -6" stroke="#5a2e26" stroke-width="4.6" stroke-linecap="round" fill="none"/>
      <path d="M136 141 l 4 -2" stroke="#5a2e26" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M108 152 q 10 4 20 0" stroke="${alfa(p.pele.escuro, 0.4)}" stroke-width="2" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "boc_determinada",
      categoria: "boca",
      nome: "Determinada",
      descricao: "Lábios firmes antes da jogada decisiva.",
      raridade: "incomum",
      tema: "executivo",
      render: (p) => `
      <path d="M106 147 q 14 -5 28 0" stroke="#5a2e26" stroke-width="4.6" stroke-linecap="round" fill="none"/>
      <path d="M110 153 q 10 2 20 0" stroke="${alfa(p.pele.escuro, 0.4)}" stroke-width="2" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "boc_surpresa",
      categoria: "boca",
      nome: "Surpresa",
      descricao: "Quando o CTR dobra sem ninguém mexer em nada.",
      raridade: "comum",
      tema: "casual",
      render: () => `
      <ellipse cx="120" cy="146" rx="8" ry="10" fill="#431d18"/>
      <ellipse cx="120" cy="150" rx="4.5" ry="5" fill="#c2554d"/>
      <ellipse cx="117" cy="141" rx="2.4" ry="3" fill="${alfa("#ffffff", 0.35)}"/>`
    },
    {
      id: "boc_lingua",
      categoria: "boca",
      nome: "Deboche",
      descricao: 'Resposta oficial para "isso não vai funcionar".',
      raridade: "incomum",
      tema: "casual",
      render: () => `
      <path d="M103 141 q 17 16 34 0 q -17 6 -34 0 z" fill="#431d18"/>
      <path d="M116 148 q 8 3 15 -1 l 2 8 c 1 6 -4 10 -9 10 s -10 -4 -9 -10 z" fill="#d9625a"/>
      <path d="M122 150 l 1 12" stroke="#b04840" stroke-width="1.6"/>`
    },
    {
      id: "boc_bigode",
      categoria: "boca",
      nome: "Bigode de Respeito",
      descricao: "Aprovado em todas as reuniões desde 1974.",
      raridade: "incomum",
      tema: "clássico",
      usaCores: ["cabelo"],
      render: (p) => `
      <path d="M106 143 q 14 -5 28 0" stroke="#5a2e26" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M120 136 c -4 -6 -14 -7 -19 -2 c -4 4 -3 10 2 11 c 6 1 13 -3 17 -9 z" fill="${p.cabelo.base}"/>
      <path d="M120 136 c 4 -6 14 -7 19 -2 c 4 4 3 10 -2 11 c -6 1 -13 -3 -17 -9 z" fill="${p.cabelo.base}"/>
      <path d="M104 132 q 8 -3 14 2 m 4 0 q 6 -5 14 -2" stroke="${alfa(p.cabelo.escuro, 0.6)}" stroke-width="1.6" fill="none"/>`
    },
    {
      id: "boc_vilao",
      categoria: "boca",
      nome: "Sorriso de Vilão",
      descricao: "O plano está em movimento. Há semanas.",
      raridade: "raro",
      tema: "fantasia",
      render: () => `
      <path d="M100 140 q 20 18 40 -2 q -8 12 -20 12 t -20 -10 z" fill="#431d18"/>
      <path d="M106 143 l 4 8 l 5 -6 z" fill="#fdfdfa"/>
      <path d="M134 141 l -4 8 l -5 -6 z" fill="#fdfdfa"/>`
    },
    {
      id: "boc_grade",
      categoria: "boca",
      nome: "Grade Sintética",
      descricao: "Alto-falante de androide com filete de luz.",
      raridade: "raro",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p) => `
      <rect x="103" y="138" width="34" height="15" rx="7" fill="#0c0f1a" stroke="${alfa("#000000", 0.4)}" stroke-width="1"/>
      <g stroke="${p.destaque.base}" stroke-width="2" stroke-linecap="round" opacity="0.9">
        <line x1="110" y1="142" x2="110" y2="149"/>
        <line x1="117" y1="142" x2="117" y2="149"/>
        <line x1="124" y1="142" x2="124" y2="149"/>
        <line x1="131" y1="142" x2="131" y2="149"/>
      </g>`
    },
    // ── 4.6 F2 · Onda 1 (identidade) — 8 bocas/expressões novas ───────
    {
      id: "boc_assobio",
      categoria: "boca",
      nome: "Assobiando",
      descricao: "Disfarçando depois de dar deploy na sexta.",
      raridade: "incomum",
      tema: "casual",
      render: (p) => `
      <ellipse cx="118" cy="146" rx="6" ry="7" fill="#431d18"/>
      <ellipse cx="118" cy="144" rx="3" ry="3.4" fill="${alfa(p.pele.escuro, 0.55)}"/>
      <g fill="none" stroke="#8fb7ff" stroke-width="2" stroke-linecap="round" opacity="0.85">
        <path d="M136 140 q 5 -3 4 -8"/>
        <path d="M142 146 q 6 -2 6 -8"/>
        <animate attributeName="opacity" values="0.85;0.4;0.85" dur="1.6s" repeatCount="indefinite"/>
      </g>`
    },
    {
      id: "boc_travessa",
      categoria: "boca",
      nome: "Sorriso Travesso",
      descricao: "Serrinha de quem já sabe o final da história.",
      raridade: "raro",
      tema: "gamer",
      render: () => `
      <path d="M102 142 q 18 16 36 0 l 0 2 l -6 -2 l -6 4 l -6 -4 l -6 4 l -6 -4 l -6 2 z" fill="#431d18"/>
      <path d="M104 143 l 5 3 l 6 -4 l 6 4 l 6 -4 l 6 4 l 5 -3 q -8 6 -17 6 t -17 -6 z" fill="#ffffff"/>`
    },
    {
      id: "boc_mascara",
      categoria: "boca",
      nome: "Máscara Ninja",
      descricao: "Metade do rosto em segredo, cem por cento presença.",
      raridade: "epico",
      tema: "aventura",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}masc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.roupa.claro}"/>
          <stop offset="1" stop-color="${p.roupa.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M76 128 c 26 14 62 14 88 0 l -4 34 c -18 14 -62 14 -80 0 z" fill="url(#${u}masc)"/>
      <path d="M80 134 q 40 14 80 0" stroke="${alfa(p.destaque.base, 0.8)}" stroke-width="2.4" fill="none"/>
      <path d="M92 148 q 28 8 56 0" stroke="${alfa("#000000", 0.25)}" stroke-width="2" fill="none"/>`
    },
    {
      id: "boc_palito",
      categoria: "boca",
      nome: "Palito",
      descricao: "Mastigando o palito enquanto o build compila.",
      raridade: "incomum",
      tema: "urbano",
      render: (p) => `
      <path d="M106 145 q 14 6 28 -2" stroke="#5a2e26" stroke-width="4.4" stroke-linecap="round" fill="none"/>
      <path d="M130 143 l 22 -8" stroke="#d8a05c" stroke-width="3.4" stroke-linecap="round"/>
      <circle cx="152" cy="135" r="1.8" fill="#b9834a"/>
      <path d="M108 151 q 10 4 20 0" stroke="${alfa(p.pele.escuro, 0.4)}" stroke-width="2" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "boc_chiclete",
      categoria: "boca",
      nome: "Chiclete",
      descricao: "Bola de chiclete no limite da física.",
      raridade: "raro",
      tema: "urbano",
      render: () => `
      <path d="M104 143 q 12 8 26 2" stroke="#5a2e26" stroke-width="4.2" stroke-linecap="round" fill="none"/>
      <circle cx="138" cy="152" r="12" fill="#ff8fb8" opacity="0.92">
        <animate attributeName="r" values="12;14;12" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <ellipse cx="134" cy="147" rx="4" ry="3" fill="#ffc2da" opacity="0.85"/>`
    },
    {
      id: "boc_barba",
      categoria: "boca",
      nome: "Barba Cheia",
      descricao: "Barba fechada com sorriso de mentor.",
      raridade: "incomum",
      tema: "clássico",
      usaCores: ["cabelo"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}brb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.cabelo.base}"/>
          <stop offset="1" stop-color="${p.cabelo.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M78 122 c 8 26 20 40 42 40 s 34 -14 42 -40 c -6 4 -12 8 -18 10 c 2 8 -4 16 -10 18 c -4 2 -10 2 -14 2 s -10 0 -14 -2 c -6 -2 -12 -10 -10 -18 c -6 -2 -12 -6 -18 -10 z" fill="url(#${u}brb)"/>
      <path d="M108 142 q 12 8 24 0" stroke="#431d18" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M88 132 q 4 8 10 12 M152 132 q -4 8 -10 12" stroke="${alfa(p.cabelo.claro, 0.35)}" stroke-width="2" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "boc_cavanhaque",
      categoria: "boca",
      nome: "Cavanhaque",
      descricao: "Moldura fina para decisões afiadas.",
      raridade: "comum",
      tema: "clássico",
      usaCores: ["cabelo"],
      render: (p) => `
      <path d="M104 142 q 16 12 32 0" stroke="#5a2e26" stroke-width="4.4" stroke-linecap="round" fill="none"/>
      <path d="M104 140 q 16 22 32 0 l 2 8 q -18 20 -36 0 z" fill="none" stroke="${p.cabelo.profundo}" stroke-width="5" stroke-linecap="round"/>
      <path d="M114 158 q 6 4 12 0 l -2 6 q -4 3 -8 0 z" fill="${p.cabelo.profundo}"/>
      <path d="M112 134 h 16" stroke="${alfa(p.cabelo.profundo, 0.75)}" stroke-width="3.4" stroke-linecap="round"/>`
    },
    {
      id: "boc_uau",
      categoria: "boca",
      nome: "Uau",
      descricao: 'O "o" involuntário da demo perfeita.',
      raridade: "comum",
      tema: "casual",
      render: (p) => `
      <ellipse cx="120" cy="147" rx="8" ry="9" fill="#431d18"/>
      <ellipse cx="120" cy="150" rx="4.6" ry="4" fill="#c2554d"/>
      <path d="M112 141 a 8 9 0 0 1 16 0" fill="none" stroke="${alfa(p.pele.escuro, 0.4)}" stroke-width="2"/>`
    },
    // ── 4.6 F2 · Onda 6 (identidade) — 12 bocas novas ─────────────────
    {
      id: "boc_beijo",
      categoria: "boca",
      nome: "Beijinho",
      descricao: "Beijo no ar para a meta batida.",
      raridade: "incomum",
      tema: "casual",
      render: () => `
      <path d="M114 143 q 6 -4 8 0 q 4 -3 7 1 q 3 4 -3 7 q -7 4 -12 -1 q -4 -4 0 -7 z" fill="#c2554d"/>
      <path d="M138 136 l -5 -4 a 3 3 0 1 1 4 -3 a 3 3 0 1 1 4 3 z" fill="#ff5f8f" opacity="0.9">
        <animateTransform attributeName="transform" type="translate" values="0 0;8 -10" dur="2.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.9;0" dur="2.4s" repeatCount="indefinite"/>
      </path>`
    },
    {
      id: "boc_dente_ouro",
      categoria: "boca",
      nome: "Sorriso de Ouro",
      descricao: "Um brilho de 24 quilates no canto do sorriso.",
      raridade: "raro",
      tema: "urbano",
      render: () => `
      <path d="M102 140 q 18 20 36 0 q -18 8 -36 0 z" fill="#431d18"/>
      <path d="M105 141 q 15 6 30 0 l -2 5 q -13 5 -26 0 z" fill="#ffffff"/>
      <path d="M128 142 l 6 -0.6 l -1 4.6 l -5 0.8 z" fill="#e8b64c"/>
      <path d="M130 143 l 2 1" stroke="#fff3c9" stroke-width="1"/>
      <path d="M136 138 l 3 -3 m -1 4 l 4 -1" stroke="#ffe89a" stroke-width="1.4" stroke-linecap="round">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.8s" repeatCount="indefinite"/>
      </path>`
    },
    {
      id: "boc_presas",
      categoria: "boca",
      nome: "Presas",
      descricao: "Só sai depois do pôr do sol. Home office noturno.",
      raridade: "epico",
      tema: "fantasia",
      render: () => `
      <path d="M104 142 q 16 12 32 0 q -16 6 -32 0 z" fill="#431d18"/>
      <path d="M106 142.5 q 14 5 28 0 l -1.6 3.6 q -12 4 -24.8 0 z" fill="#ffffff"/>
      <path d="M110 144 l 3.4 8.5 l 3 -7.5 z" fill="#ffffff"/>
      <path d="M130 144 l -3.4 8.5 l -3 -7.5 z" fill="#ffffff"/>`
    },
    {
      id: "boc_franzida",
      categoria: "boca",
      nome: "Franzida",
      descricao: "O gráfico caiu 2% e a boca acompanhou.",
      raridade: "comum",
      tema: "executivo",
      render: (p) => `
      <path d="M106 150 q 14 -10 28 0" stroke="#5a2e26" stroke-width="4.4" stroke-linecap="round" fill="none"/>
      <path d="M104 143 q 4 3 8 2 M136 143 q -4 3 -8 2" stroke="${alfa(p.pele.escuro, 0.4)}" stroke-width="2" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "boc_apito",
      categoria: "boca",
      nome: "Apito de Coach",
      descricao: "Fim do intervalo — segundo tempo do trimestre.",
      raridade: "raro",
      tema: "esportivo",
      render: () => `
      <path d="M108 144 q 12 8 24 -2" stroke="#5a2e26" stroke-width="4" stroke-linecap="round" fill="none"/>
      <rect x="126" y="138" width="16" height="11" rx="5" fill="#c4c9d6" stroke="#8b93a7" stroke-width="1.4"/>
      <circle cx="140" cy="149" r="5" fill="#c4c9d6" stroke="#8b93a7" stroke-width="1.4"/>
      <circle cx="132" cy="143" r="1.6" fill="#5a6274"/>
      <path d="M146 136 q 4 -2 4 -6 M150 140 q 5 -1 6 -5" stroke="#8fb7ff" stroke-width="1.8" stroke-linecap="round" fill="none">
        <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.2s" repeatCount="indefinite"/>
      </path>`
    },
    {
      id: "boc_riso_nervoso",
      categoria: "boca",
      nome: "Riso Nervoso",
      descricao: '"Claro que cabe na sprint" — e o riso saiu torto.',
      raridade: "incomum",
      tema: "casual",
      render: (p) => `
      <path d="M104 145 q 16 8 32 -2 q -14 12 -32 2 z" fill="#431d18"/>
      <path d="M106 145 l 28 -1.4 l -1 3 l -26 0.6 z" fill="#ffffff"/>
      <path d="M100 149 q -2 3 -1 6" stroke="${alfa(p.pele.escuro, 0.5)}" stroke-width="2" stroke-linecap="round" fill="none"/>
      <ellipse cx="146" cy="132" rx="2.6" ry="3.4" fill="#8fd4ff" opacity="0.9">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 6" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.9;0.1" dur="1.8s" repeatCount="indefinite"/>
      </ellipse>`
    },
    {
      id: "boc_batom",
      categoria: "boca",
      nome: "Batom Marcante",
      descricao: "A assinatura em qualquer sala — na cor da sua energia.",
      raridade: "incomum",
      tema: "clássico",
      usaCores: ["destaque"],
      render: (p) => `
      <path d="M108 143 q 5 -5 12 -1 q 7 -4 12 1 q 3 3 -2 6 q -10 6 -20 0 q -5 -3 -2 -6 z" fill="${p.destaque.base}"/>
      <path d="M110 144 q 4 -3 9 -1" stroke="${alfa("#ffffff", 0.4)}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
      <path d="M108 149 q 12 5 24 0" stroke="${alfa(p.destaque.profundo, 0.8)}" stroke-width="1.6" fill="none"/>`
    },
    {
      id: "boc_pirulito",
      categoria: "boca",
      nome: "Pirulito",
      descricao: "Energia rápida para o code review longo.",
      raridade: "raro",
      tema: "casual",
      usaCores: ["destaque"],
      render: (p) => `
      <path d="M106 144 q 12 8 24 0" stroke="#5a2e26" stroke-width="4.2" stroke-linecap="round" fill="none"/>
      <path d="M130 146 l 18 12" stroke="#f4f0e6" stroke-width="3"/>
      <circle cx="152" cy="160" r="8" fill="${p.destaque.base}"/>
      <path d="M146 160 a 6 6 0 0 1 6 -6 a 3 3 0 0 1 0 6 a 3 3 0 0 0 -3 3 a 6 6 0 0 1 -3 -3 z" fill="${alfa("#ffffff", 0.5)}"/>`
    },
    {
      id: "boc_bocejo",
      categoria: "boca",
      nome: "Bocejo",
      descricao: "A daily das 8h30 cobra seu preço.",
      raridade: "comum",
      tema: "casual",
      render: (p) => `
      <ellipse cx="120" cy="148" rx="9" ry="11" fill="#431d18"/>
      <ellipse cx="120" cy="152" rx="5" ry="5" fill="#c2554d"/>
      <path d="M111 142 a 9 11 0 0 1 18 0" fill="none" stroke="${alfa(p.pele.escuro, 0.4)}" stroke-width="2"/>
      <path d="M140 132 l 6 -2 l -4 5 l 6 -1" stroke="${alfa("#8b93a7", 0.8)}" stroke-width="1.8" fill="none" stroke-linecap="round">
        <animateTransform attributeName="transform" type="translate" values="0 0;6 -8" dur="2.6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.9;0" dur="2.6s" repeatCount="indefinite"/>
      </path>`
    },
    {
      id: "boc_gato",
      categoria: "boca",
      nome: "Sorriso de Gato",
      descricao: ":3 — aprovado sem ressalvas.",
      raridade: "raro",
      tema: "casual",
      render: () => `
      <path d="M108 144 q 6 6 12 0 q 6 6 12 0" stroke="#5a2e26" stroke-width="4" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "boc_onda_sonora",
      categoria: "boca",
      nome: "Onda Sonora",
      descricao: "Fala em formas de onda. Volume sempre no máximo.",
      raridade: "epico",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p) => {
        let barras = "";
        const alturas = [3, 7, 5, 10, 6, 9, 4, 7, 3];
        alturas.forEach((h, i) => {
          barras += `<rect x="${104 + i * 3.8}" y="${146 - h / 2}" width="2.4" height="${h}" rx="1.2" fill="${p.destaque.claro}">
          <animate attributeName="height" values="${h};${h + 5};${h}" dur="${(0.6 + i % 3 * 0.25).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="y" values="${146 - h / 2};${146 - (h + 5) / 2};${146 - h / 2}" dur="${(0.6 + i % 3 * 0.25).toFixed(2)}s" repeatCount="indefinite"/>
        </rect>`;
        });
        return `<rect x="100" y="137" width="40" height="18" rx="8" fill="#0c0f1a" stroke="${alfa(p.destaque.base, 0.6)}" stroke-width="1.6"/>${barras}`;
      }
    },
    {
      id: "boc_heroica",
      categoria: "boca",
      nome: "Queixo Heroico",
      descricao: "Sorriso firme e covinha de pôster de recrutamento.",
      raridade: "incomum",
      tema: "aventura",
      render: (p) => `
      <path d="M104 143 q 16 8 32 0" stroke="#5a2e26" stroke-width="4.6" stroke-linecap="round" fill="none"/>
      <path d="M117 158 q 3 3 6 0" stroke="${alfa(p.pele.profundo, 0.5)}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <path d="M108 148 q 12 6 24 0" stroke="${alfa(p.pele.escuro, 0.35)}" stroke-width="2" stroke-linecap="round" fill="none"/>`
    },
    // ── 4.6 F2 · Onda 7 — 10 bocas finais (meta §28: 40 ✓) ────────────
    {
      id: "boc_pensativa",
      categoria: "boca",
      nome: "Pensativa",
      descricao: "Processando… a resposta chega depois do café.",
      raridade: "comum",
      tema: "casual",
      render: (p) => `
      <path d="M108 147 q 8 -5 16 -1 q 5 3 8 1" stroke="#5a2e26" stroke-width="4.2" stroke-linecap="round" fill="none"/>
      <path d="M134 138 q 4 -1 6 2" stroke="${alfa(p.pele.escuro, 0.4)}" stroke-width="2" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "boc_migalhas",
      categoria: "boca",
      nome: "Hora do Lanche",
      descricao: "Não era a sua marmita, mas agora é tarde.",
      raridade: "incomum",
      tema: "casual",
      render: () => `
      <path d="M104 144 q 16 10 32 0 q -16 6 -32 0 z" fill="#431d18"/>
      <path d="M106 144.5 q 14 4 28 0 l -1.4 3.4 q -12.6 3.6 -25.2 0 z" fill="#ffffff"/>
      <circle cx="104" cy="156" r="1.8" fill="#d8a05c"/>
      <circle cx="112" cy="160" r="1.4" fill="#b9834a"/>
      <circle cx="134" cy="158" r="1.6" fill="#d8a05c"/>
      <circle cx="126" cy="162" r="1.2" fill="#b9834a"/>`
    },
    {
      id: "boc_ziper",
      categoria: "boca",
      nome: "Zíper",
      descricao: "Segredo de roadmap guardado a sete dentes.",
      raridade: "raro",
      tema: "tecnologia",
      render: () => `
      <path d="M102 146 h 36" stroke="#3a4054" stroke-width="6" stroke-linecap="round"/>
      <path d="M104 146 h 32" stroke="#c4c9d6" stroke-width="2" stroke-dasharray="3 3"/>
      <path d="M138 146 l 6 4 a 3 3 0 1 0 2 -5 z" fill="#c4c9d6" stroke="#5a6274" stroke-width="1"/>`
    },
    {
      id: "boc_rosa",
      categoria: "boca",
      nome: "Rosa nos Dentes",
      descricao: "O tango começa quando o deploy termina.",
      raridade: "epico",
      tema: "clássico",
      render: () => `
      <path d="M106 144 q 14 8 28 0" stroke="#5a2e26" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M120 147 l 22 6" stroke="#2f6e3a" stroke-width="2.6"/>
      <path d="M134 151 l 5 -4 M128 150 l 4 -5" stroke="#2f6e3a" stroke-width="1.8" stroke-linecap="round"/>
      <g transform="translate(146 155)">
        <circle r="6" fill="#c1272d"/>
        <path d="M-3 -2 a 4 4 0 0 1 6 -1 M-1 2 a 3 3 0 0 1 4 -3" stroke="#ff5f8f" stroke-width="1.4" fill="none"/>
      </g>`
    },
    {
      id: "boc_canudo",
      categoria: "boca",
      nome: "Café Gelado",
      descricao: "Cafeína em regime de gotejamento contínuo.",
      raridade: "incomum",
      tema: "casual",
      render: () => `
      <ellipse cx="118" cy="146" rx="4.5" ry="5" fill="#431d18"/>
      <path d="M120 146 l 24 14" stroke="#4cd97c" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M138 156 l 10 6" stroke="#3aa860" stroke-width="3.4" stroke-linecap="round"/>
      <rect x="142" y="160" width="16" height="20" rx="3" fill="rgba(180,220,255,0.4)" stroke="#8fb7d8" stroke-width="1.4"/>
      <rect x="142" y="168" width="16" height="12" rx="3" fill="rgba(122,74,50,0.75)"/>
      <rect x="144" y="171" width="4" height="4" rx="1" fill="rgba(255,255,255,0.5)"/>`
    },
    {
      id: "boc_aparelho",
      categoria: "boca",
      nome: "Aparelho",
      descricao: "Sorriso em manutenção programada até dezembro.",
      raridade: "incomum",
      tema: "casual",
      usaCores: ["destaque"],
      render: (p) => `
      <path d="M102 141 q 18 18 36 0 q -18 8 -36 0 z" fill="#431d18"/>
      <path d="M105 142 q 15 5 30 0 l -2 5 q -13 4 -26 0 z" fill="#ffffff"/>
      <path d="M106 144.5 q 14 4.5 28 0" stroke="#8b93a7" stroke-width="1.6" fill="none"/>
      <circle cx="110" cy="144.5" r="1.3" fill="${p.destaque.base}"/>
      <circle cx="117" cy="146" r="1.3" fill="${p.destaque.base}"/>
      <circle cx="124" cy="146.2" r="1.3" fill="${p.destaque.base}"/>
      <circle cx="131" cy="145" r="1.3" fill="${p.destaque.base}"/>`
    },
    {
      id: "boc_grito_guerra",
      categoria: "boca",
      nome: "Grito de Guerra",
      descricao: "BORA, TIME! A sexta-feira não vai se entregar sozinha.",
      raridade: "raro",
      tema: "esportivo",
      render: () => `
      <path d="M102 138 q 18 -4 36 0 q -2 18 -18 18 t -18 -18 z" fill="#431d18"/>
      <path d="M104 138.5 q 16 -3 32 0 l -1.4 4 q -14.6 -2.5 -29.2 0 z" fill="#ffffff"/>
      <path d="M112 152 q 8 4 16 0 q -4 4 -8 4 t -8 -4 z" fill="#c2554d"/>
      <path d="M94 132 l -6 -4 M146 132 l 6 -4 M96 144 l -7 1 M144 144 l 7 1" stroke="rgba(255,255,255,0.35)" stroke-width="2" stroke-linecap="round"/>`
    },
    {
      id: "boc_costurada",
      categoria: "boca",
      nome: "Costurada",
      descricao: "Prometeu não dar spoiler da feature. Levou a sério.",
      raridade: "epico",
      tema: "fantasia",
      render: (p) => `
      <path d="M104 146 q 16 6 32 0" stroke="${alfa(p.pele.profundo, 0.85)}" stroke-width="3" stroke-linecap="round" fill="none"/>
      <g stroke="#8b93a7" stroke-width="2" stroke-linecap="round">
        <path d="M108 141 l 2 10 M115 140 l 1.6 11 M122 140 l 0.8 11 M129 140 l -0.8 11 M135 141 l -2 10"/>
      </g>`
    },
    {
      id: "boc_neon",
      categoria: "boca",
      nome: "Sorriso Neon",
      descricao: "O sorriso continua aceso mesmo com a luz apagada.",
      raridade: "lendario",
      tema: "cyberpunk",
      usaCores: ["destaque"],
      render: (p) => `
      <path d="M104 142 q 16 14 32 0" stroke="${p.destaque.claro}" stroke-width="3.4" stroke-linecap="round" fill="none">
        <animate attributeName="opacity" values="1;0.5;1;1;0.7;1" keyTimes="0;0.05;0.1;0.6;0.65;1" dur="3.4s" repeatCount="indefinite" calcMode="discrete"/>
      </path>
      <path d="M104 142 q 16 14 32 0" stroke="${alfa(p.destaque.base, 0.4)}" stroke-width="8" stroke-linecap="round" fill="none"/>`
    },
    {
      id: "boc_mascando",
      categoria: "boca",
      nome: "Mascando",
      descricao: "Chiclete de hortelã e paciência em processamento.",
      raridade: "comum",
      tema: "casual",
      render: (p) => `
      <path d="M106 144 q 10 6 20 2 q 5 -2 8 -5" stroke="#5a2e26" stroke-width="4.2" stroke-linecap="round" fill="none"/>
      <ellipse cx="136" cy="152" rx="7" ry="5.4" fill="${alfa(p.pele.claro, 0.7)}">
        <animate attributeName="rx" values="7;5.6;7" dur="1.1s" repeatCount="indefinite"/>
      </ellipse>`
    }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/partes/roupas.ts
  function defsRoupa(u, claro, base, profundo) {
    return `
    <linearGradient id="${u}rou" x1="0.15" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${claro}"/>
      <stop offset="0.4" stop-color="${base}"/>
      <stop offset="1" stop-color="${profundo}"/>
    </linearGradient>`;
  }
  var SOMBRA_PESCOCO = `<path d="M96 186 c 6 10 42 10 48 0 c -2 12 -46 12 -48 0 z" fill="rgba(0,0,0,0.25)"/>`;
  var ROUPAS = [
    {
      id: "rou_camiseta",
      categoria: "roupa",
      nome: "Camiseta",
      descricao: "Básica de algodão, conforto absoluto.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["roupa"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M98 184 c 8 12 36 12 44 0 c 0 10 -8 16 -22 16 s -22 -6 -22 -16 z" fill="${p.roupa.profundo}"/>
      ${SOMBRA_PESCOCO}
      <path d="M52 226 c 10 -18 30 -28 48 -32" stroke="${alfa("#ffffff", 0.14)}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
      renderCorpo: (_p, _u) => `
      <path d="M104 108 q 16 10 32 0 l -4 8 q -12 8 -24 0 z" fill="${alfa("#000000", 0.22)}"/>
      <path d="M96 196 h20 v2 h-20 z" fill="${alfa("#000000", 0.18)}"/>
    `
    },
    {
      id: "rou_regata",
      categoria: "roupa",
      nome: "Regata Treino",
      descricao: "Para o dia de treino... de digitação intensa.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["roupa", "pele"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="M36 240 v-12 c0 -26 32 -44 66 -46 l -22 20 v 38 z" fill="${p.pele.escuro}"/>
      <path d="M204 240 v-12 c0 -26 -32 -44 -66 -46 l 22 20 v 38 z" fill="${p.pele.escuro}"/>
      <path d="M80 202 l 22 -20 c 4 10 32 10 36 0 l 22 20 v 38 h -80 z" fill="url(#${u}rou)"/>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (p, _u) => `
      <path d="M86 108 l 18 0 l -8 26 q -8 -4 -12 -12 z" fill="${p.pele.base}"/>
      <path d="M154 108 l -18 0 l 8 26 q 8 -4 12 -12 z" fill="${p.pele.base}"/>
      <path d="M104 108 q 16 12 32 0 l -3 10 q -13 9 -26 0 z" fill="${alfa("#000000", 0.24)}"/>
    `
    },
    {
      id: "rou_social",
      categoria: "roupa",
      nome: "Camisa Social",
      descricao: "Colarinho impecável para fechar contratos.",
      raridade: "incomum",
      tema: "executivo",
      usaCores: ["roupa"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      ${SOMBRA_PESCOCO}
      <path d="M120 196 l -14 44 h 28 z" fill="${alfa("#ffffff", 0.12)}"/>
      <path d="M98 184 l 22 14 l -14 10 l -12 -16 z" fill="${p.roupa.claro}"/>
      <path d="M142 184 l -22 14 l 14 10 l 12 -16 z" fill="${p.roupa.claro}"/>
      <circle cx="120" cy="216" r="1.8" fill="${p.roupa.profundo}"/>
      <circle cx="120" cy="230" r="1.8" fill="${p.roupa.profundo}"/>`,
      renderCorpo: (_p, _u) => `
      <path d="M104 108 l 16 14 l 16 -14 l 6 6 l -22 18 l -22 -18 z" fill="#f2f4fa"/>
      <path d="M120 140 v 70" stroke="${alfa("#000000", 0.25)}" stroke-width="2"/>
      <circle cx="120" cy="152" r="1.8" fill="${alfa("#000000", 0.4)}"/>
      <circle cx="120" cy="170" r="1.8" fill="${alfa("#000000", 0.4)}"/>
      <circle cx="120" cy="188" r="1.8" fill="${alfa("#000000", 0.4)}"/>
    `
    },
    {
      id: "rou_hoodie",
      categoria: "roupa",
      nome: "Hoodie Dev",
      descricao: "Capuz nas costas e cordões — uniforme de quem builda.",
      raridade: "incomum",
      tema: "gamer",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="M66 240 c -10 -30 6 -52 24 -58 l 10 14 c -14 22 -14 30 -12 44 z" fill="${p.roupa.profundo}"/>
      <path d="M174 240 c 10 -30 -6 -52 -24 -58 l -10 14 c 14 22 14 30 12 44 z" fill="${p.roupa.profundo}"/>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      ${SOMBRA_PESCOCO}
      <path d="M96 184 c 8 14 40 14 48 0 c 4 8 -6 18 -24 18 s -28 -10 -24 -18 z" fill="${p.roupa.profundo}"/>
      <line x1="108" y1="200" x2="106" y2="228" stroke="${p.destaque.base}" stroke-width="3.4" stroke-linecap="round"/>
      <line x1="132" y1="200" x2="134" y2="228" stroke="${p.destaque.base}" stroke-width="3.4" stroke-linecap="round"/>
      <circle cx="106" cy="230" r="2.6" fill="${p.destaque.claro}"/>
      <circle cx="134" cy="230" r="2.6" fill="${p.destaque.claro}"/>
      <path d="M84 240 v-20 m 72 20 v-20" stroke="${alfa("#000000", 0.2)}" stroke-width="3"/>`,
      renderCorpo: (p, _u) => `
      <path d="M98 106 q 22 20 44 0 l 4 10 q -26 20 -52 0 z" fill="${p.roupa.profundo}"/>
      <path d="M112 126 l -4 30 M128 126 l 4 30" stroke="#f2f4fa" stroke-width="3" stroke-linecap="round"/>
      <circle cx="108" cy="158" r="2.4" fill="#f2f4fa"/>
      <circle cx="132" cy="158" r="2.4" fill="#f2f4fa"/>
      <path d="M96 176 h48 v26 h-48 z" fill="${alfa("#000000", 0.16)}" rx="6"/>
    `
    },
    {
      id: "rou_jaqueta",
      categoria: "roupa",
      nome: "Jaqueta Racer",
      descricao: "Jaqueta esportiva com listras de velocidade.",
      raridade: "raro",
      tema: "esporte",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      ${SOMBRA_PESCOCO}
      <path d="M40 226 c 2 -20 20 -34 44 -40 l 6 8 c -22 6 -38 18 -42 36 z" fill="${p.destaque.base}"/>
      <path d="M200 226 c -2 -20 -20 -34 -44 -40 l -6 8 c 22 6 38 18 42 36 z" fill="${p.destaque.base}"/>
      <path d="M120 198 v 42" stroke="${p.roupa.profundo}" stroke-width="6"/>
      <path d="M120 198 v 42" stroke="${alfa("#c9d4e8", 0.9)}" stroke-width="2" stroke-dasharray="5 4"/>
      <path d="M94 186 c 8 12 44 12 52 0 l 6 8 c -10 12 -54 12 -64 0 z" fill="${p.roupa.profundo}"/>`,
      renderCorpo: (p, _u) => `
      <path d="M120 110 v 100" stroke="${p.roupa.profundo}" stroke-width="6"/>
      <path d="M120 110 v 100" stroke="${alfa("#ffffff", 0.35)}" stroke-width="1.6"/>
      <path d="M104 108 l 14 18 l -12 8 z" fill="${p.roupa.profundo}"/>
      <path d="M136 108 l -14 18 l 12 8 z" fill="${p.roupa.profundo}"/>
      <path d="M92 206 h56 v6 h-56 z" fill="${p.roupa.profundo}"/>
    `
    },
    {
      id: "rou_gamer",
      categoria: "roupa",
      nome: "Jersey Pro Player",
      descricao: "Camisa oficial de time com raio no peito.",
      raridade: "raro",
      tema: "gamer",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      ${SOMBRA_PESCOCO}
      <path d="M44 222 l 40 -34 l 6 8 l -44 34 z" fill="${alfa(p.destaque.base, 0.85)}"/>
      <path d="M196 222 l -40 -34 l -6 8 l 44 34 z" fill="${alfa(p.destaque.base, 0.85)}"/>
      <path d="M127 202 l -17 19 h 9 l -6 17 l 18 -21 h -9 z" fill="${p.destaque.claro}" stroke="${p.destaque.profundo}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M98 184 c 10 10 34 10 44 0 c 2 6 -8 12 -22 12 s -24 -6 -22 -12 z" fill="${p.roupa.profundo}"/>`,
      renderCorpo: (p, _u) => `
      <path d="M116 132 l 12 0 l -8 14 l 10 0 l -18 26 l 5 -18 l -9 0 z" fill="${p.destaque.claro}"/>
      <path d="M90 112 v 96" stroke="${p.destaque.base}" stroke-width="3"/>
      <path d="M150 112 v 96" stroke="${p.destaque.base}" stroke-width="3"/>
    `
    },
    {
      id: "rou_terno",
      categoria: "roupa",
      nome: "Terno Executivo",
      descricao: "Alfaiataria completa com gravata — nível diretoria.",
      raridade: "epico",
      tema: "executivo",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M106 190 l 14 12 l 14 -12 v 50 h -28 z" fill="#f4f6fa"/>
      <path d="M114 203 l 6 -6 l 6 6 l -6 6 z" fill="${p.destaque.escuro}"/>
      <path d="M120 208 l -6 9 l 6 23 l 6 -23 z" fill="${p.destaque.base}"/>
      <path d="M97 186 c 5 7 13 13 22 16 l -13 24 c -8 -12 -11 -26 -9 -40 z" fill="${p.roupa.profundo}"/>
      <path d="M143 186 c -5 7 -13 13 -22 16 l 13 24 c 8 -12 11 -26 9 -40 z" fill="${p.roupa.profundo}"/>
      <path d="M97 186 c 5 7 13 13 22 16" stroke="${alfa("#ffffff", 0.14)}" stroke-width="2" fill="none"/>
      <path d="M143 186 c -5 7 -13 13 -22 16" stroke="${alfa("#ffffff", 0.14)}" stroke-width="2" fill="none"/>
      ${SOMBRA_PESCOCO}
      <rect x="58" y="216" width="12" height="5" rx="2" fill="${alfa("#ffffff", 0.3)}" transform="rotate(-22 64 218)"/>`,
      renderCorpo: (p, _u) => `
      <path d="M104 108 l 16 22 l 16 -22 l 8 10 l -24 34 l -24 -34 z" fill="#f2f4fa"/>
      <path d="M116 116 l 4 6 l 4 -6 l 4 6 l -8 44 l -8 -44 z" fill="${p.destaque.base}"/>
      <path d="M104 108 l -8 12 l 14 22 l 10 -12 z" fill="${p.roupa.profundo}"/>
      <path d="M136 108 l 8 12 l -14 22 l -10 -12 z" fill="${p.roupa.profundo}"/>
    `
    },
    {
      id: "rou_kimono",
      categoria: "roupa",
      nome: "Kimono do Dojo",
      descricao: "Disciplina de samurai, prazo de sprint.",
      raridade: "epico",
      tema: "oriental",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      ${SOMBRA_PESCOCO}
      <path d="M96 184 l 24 30 l -14 26 h -20 c -2 -20 2 -40 10 -56 z" fill="${p.roupa.escuro}"/>
      <path d="M144 184 l -24 30 l 14 26 h 20 c 2 -20 -2 -40 -10 -56 z" fill="${p.roupa.escuro}"/>
      <path d="M96 184 l 24 30 l 24 -30" stroke="${alfa("#ffffff", 0.55)}" stroke-width="5" fill="none"/>
      <path d="M100 188 l 20 26 l 20 -26" stroke="${p.destaque.base}" stroke-width="2.4" fill="none"/>
      <rect x="86" y="226" width="68" height="12" fill="${p.destaque.base}"/>
      <rect x="112" y="224" width="16" height="16" rx="2" fill="${p.destaque.escuro}"/>`,
      renderCorpo: (p, _u) => `
      <path d="M104 108 l 34 66 l 0 34 l -14 0 z" fill="${alfa("#000000", 0.18)}"/>
      <path d="M136 108 l -34 66 l 0 8 l 40 -60 z" fill="${alfa("#ffffff", 0.28)}"/>
      <path d="M90 178 h60 v14 h-60 z" fill="${p.destaque.profundo}"/>
      <path d="M90 181 h60 v3 h-60 z" fill="${alfa("#ffffff", 0.25)}"/>
    `
    },
    {
      id: "rou_astronauta",
      categoria: "roupa",
      nome: "Traje Orbital",
      descricao: "Homologado para vácuo, reuniões e segundas-feiras.",
      raridade: "lendario",
      tema: "espaço",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}ast" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0" stop-color="#f2f4f8"/>
          <stop offset="0.6" stop-color="#d5dae6"/>
          <stop offset="1" stop-color="#aeb6c9"/>
        </linearGradient>
      </defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}ast)"/>
      <path d="M92 182 a 30 18 0 0 0 56 0 l 8 6 a 38 24 0 0 1 -72 0 z" fill="${p.roupa.base}"/>
      <circle cx="78" cy="214" r="11" fill="${p.roupa.base}"/>
      <circle cx="162" cy="214" r="11" fill="${p.roupa.base}"/>
      <circle cx="78" cy="214" r="5" fill="${p.destaque.base}"/>
      <circle cx="162" cy="214" r="5" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.4;1" dur="2.4s" repeatCount="indefinite"/>
      </circle>
      <rect x="104" y="206" width="32" height="22" rx="5" fill="#20242c"/>
      <rect x="108" y="210" width="24" height="5" rx="2.5" fill="${p.destaque.base}"/>
      <rect x="108" y="219" width="14" height="4" rx="2" fill="${alfa("#ffffff", 0.4)}"/>
      <path d="M52 226 c 8 -16 24 -26 44 -32" stroke="${alfa("#ffffff", 0.4)}" stroke-width="4" stroke-linecap="round" fill="none"/>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (p, _u) => `
      <ellipse cx="120" cy="122" rx="22" ry="9" fill="none" stroke="${p.destaque.base}" stroke-width="4"/>
      <rect x="104" y="140" width="14" height="10" rx="2" fill="${p.destaque.base}"/>
      <path d="M138 138 q 12 8 8 26" fill="none" stroke="${alfa("#000000", 0.3)}" stroke-width="4" stroke-linecap="round"/>
      <path d="M96 168 h48 v6 h-48 z" fill="${alfa("#000000", 0.2)}"/>
    `
    },
    {
      id: "rou_moletom_dshow",
      categoria: "roupa",
      nome: "Moletom Dshow",
      descricao: "O uniforme não oficial de quem constrói o dash.",
      raridade: "exclusivo",
      tema: "dshow",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      ${SOMBRA_PESCOCO}
      <path d="M96 184 c 8 14 40 14 48 0 c 4 8 -6 18 -24 18 s -28 -10 -24 -18 z" fill="${p.roupa.profundo}"/>
      <circle cx="120" cy="222" r="15" fill="none" stroke="${p.destaque.base}" stroke-width="3"/>
      <path d="M114 214 v 16 c 8 2 14 -2 14 -8 s -6 -10 -14 -8 z" fill="${p.destaque.base}"/>
      <path d="M64 234 l 20 -10 m 92 10 l -20 -10" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="3" stroke-linecap="round"/>`,
      renderCorpo: (p, _u) => `
      <path d="M112 124 l -4 26 M128 124 l 4 26" stroke="#f2f4fa" stroke-width="3" stroke-linecap="round"/>
      <rect x="110" y="150" width="20" height="20" rx="4" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.55;1" dur="2.8s" repeatCount="indefinite"/>
      </rect>
      <rect x="115" y="155" width="10" height="10" rx="2" fill="#0a0e18"/>
    `
    },
    {
      id: "rou_armadura",
      categoria: "roupa",
      nome: "Armadura Nexus",
      descricao: "Peitoral blindado com núcleo de energia pulsante.",
      raridade: "lendario",
      tema: "sci-fi",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>
        ${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}
        <radialGradient id="${u}nuc" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="0.4" stop-color="${p.destaque.claro}"/>
          <stop offset="1" stop-color="${p.destaque.profundo}"/>
        </radialGradient>
      </defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M44 240 v-8 c 0 -16 10 -28 26 -36 l 14 10 v 34 z" fill="${p.roupa.profundo}"/>
      <path d="M196 240 v-8 c 0 -16 -10 -28 -26 -36 l -14 10 v 34 z" fill="${p.roupa.profundo}"/>
      <path d="M46 210 l 36 -22 l 4 6 l -36 22 z" fill="${alfa(p.destaque.base, 0.65)}"/>
      <path d="M194 210 l -36 -22 l -4 6 l 36 22 z" fill="${alfa(p.destaque.base, 0.65)}"/>
      <path d="M92 196 h 56 l -6 44 h -44 z" fill="${p.roupa.escuro}" stroke="${p.roupa.profundo}" stroke-width="2"/>
      <circle cx="120" cy="216" r="11" fill="url(#${u}nuc)">
        <animate attributeName="r" values="11;12.5;11" dur="2.4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="120" cy="216" r="15" fill="none" stroke="${alfa(p.destaque.base, 0.6)}" stroke-width="2"/>
      <path d="M104 240 l 6 -14 m 26 14 l -6 -14" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="2"/>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (p, _u) => `
      <circle cx="120" cy="150" r="13" fill="${p.destaque.profundo}" stroke="${p.destaque.claro}" stroke-width="3"/>
      <circle cx="120" cy="150" r="6" fill="${p.destaque.claro}">
        <animate attributeName="opacity" values="1;0.45;1" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <path d="M92 128 l 16 8 l 0 44 l -16 -6 z" fill="${alfa("#ffffff", 0.14)}"/>
      <path d="M148 128 l -16 8 l 0 44 l 16 -6 z" fill="${alfa("#000000", 0.2)}"/>
      <path d="M92 196 h56 v6 h-56 z" fill="${p.destaque.base}"/>
    `
    },
    // ── 4.6 F2 · Onda 2 (equipamentos) — 8 roupas novas ───────────────
    {
      id: "rou_polo",
      categoria: "roupa",
      nome: "Polo",
      descricao: "Gola firme, sexta casual garantida.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["roupa"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M100 184 l 20 12 l 20 -12 l 6 8 l -26 14 l -26 -14 z" fill="${p.roupa.claro}"/>
      <path d="M120 196 v 22" stroke="${p.roupa.profundo}" stroke-width="2.4"/>
      <circle cx="120" cy="204" r="1.8" fill="${p.roupa.claro}"/>
      <circle cx="120" cy="212" r="1.8" fill="${p.roupa.claro}"/>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (p, _u) => `
      <path d="M104 108 l 16 10 l 16 -10 l -4 12 l -12 8 l -12 -8 z" fill="${alfa("#000000", 0.2)}"/>
      <path d="M120 128 v 30" stroke="${alfa(p.roupa.profundo, 0.8)}" stroke-width="2"/>
      <circle cx="120" cy="136" r="1.6" fill="${p.roupa.claro}"/>
      <circle cx="120" cy="146" r="1.6" fill="${p.roupa.claro}"/>
      <path d="M86 190 h 68 v 3 h -68 z" fill="${alfa("#000000", 0.16)}"/>
    `
    },
    {
      id: "rou_flanela",
      categoria: "roupa",
      nome: "Flanela Xadrez",
      descricao: "Xadrez de quem commita ouvindo lo-fi.",
      raridade: "incomum",
      tema: "casual",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => {
        let xadrez = "";
        for (let i = 0; i < 6; i++) {
          xadrez += `<line x1="${52 + i * 28}" y1="182" x2="${52 + i * 28}" y2="240" stroke="${alfa(p.destaque.base, 0.35)}" stroke-width="7"/>`;
        }
        for (let j = 0; j < 3; j++) {
          xadrez += `<line x1="36" y1="${196 + j * 18}" x2="204" y2="${196 + j * 18}" stroke="${alfa(p.destaque.base, 0.3)}" stroke-width="6"/>`;
        }
        return `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}
        <clipPath id="${u}fx"><path d="${PATH_OMBROS}"/></clipPath></defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <g clip-path="url(#${u}fx)">${xadrez}</g>
      <path d="M98 184 l 22 16 l -12 10 l -14 -18 z" fill="${p.roupa.escuro}"/>
      <path d="M142 184 l -22 16 l 12 10 l 14 -18 z" fill="${p.roupa.escuro}"/>
      ${SOMBRA_PESCOCO}`;
      },
      renderCorpo: (p, _u) => `
      <g opacity="0.5">
        <line x1="98" y1="108" x2="98" y2="200" stroke="${p.destaque.base}" stroke-width="5"/>
        <line x1="124" y1="108" x2="124" y2="200" stroke="${p.destaque.base}" stroke-width="5"/>
        <line x1="150" y1="108" x2="150" y2="200" stroke="${p.destaque.base}" stroke-width="5"/>
        <line x1="86" y1="132" x2="154" y2="132" stroke="${p.destaque.base}" stroke-width="4"/>
        <line x1="86" y1="162" x2="154" y2="162" stroke="${p.destaque.base}" stroke-width="4"/>
      </g>
      <path d="M116 108 l 4 10 l 4 -10 z" fill="${alfa("#000000", 0.25)}"/>
      <path d="M120 118 v 76" stroke="${alfa("#000000", 0.3)}" stroke-width="2.4"/>
    `
    },
    {
      id: "rou_colete",
      categoria: "roupa",
      nome: "Colete Tático",
      descricao: "Bolsos para tudo — até para o carregador extra.",
      raridade: "raro",
      tema: "aventura",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M84 194 h 26 v 20 h -26 z" fill="${p.roupa.escuro}" stroke="${p.roupa.profundo}" stroke-width="2"/>
      <path d="M130 194 h 26 v 20 h -26 z" fill="${p.roupa.escuro}" stroke="${p.roupa.profundo}" stroke-width="2"/>
      <path d="M84 200 h 26 M130 200 h 26" stroke="${p.roupa.profundo}" stroke-width="2"/>
      <path d="M60 196 l 24 -12 M180 196 l -24 -12" stroke="${alfa(p.destaque.base, 0.7)}" stroke-width="4" stroke-linecap="round"/>
      <rect x="114" y="188" width="12" height="52" fill="${p.roupa.profundo}"/>
      <path d="M116 198 h 8 M116 212 h 8 M116 226 h 8" stroke="${alfa("#ffffff", 0.25)}" stroke-width="2"/>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (p, _u) => `
      <path d="M92 112 l 20 8 v 74 l -20 -4 z" fill="${alfa("#000000", 0.26)}"/>
      <path d="M148 112 l -20 8 v 74 l 20 -4 z" fill="${alfa("#000000", 0.26)}"/>
      <path d="M96 138 h 14 v 12 h -14 z M130 138 h 14 v 12 h -14 z" fill="${p.roupa.profundo}" stroke="${alfa("#ffffff", 0.15)}" stroke-width="1.4"/>
      <path d="M112 120 h 16 v 72 h -16 z" fill="${alfa(p.roupa.profundo, 0.9)}"/>
      <path d="M114 132 h 12 M114 150 h 12 M114 168 h 12" stroke="${alfa(p.destaque.base, 0.6)}" stroke-width="2"/>
    `
    },
    {
      id: "rou_smoking",
      categoria: "roupa",
      nome: "Smoking",
      descricao: "Cetim na lapela e a noite inteira pela frente.",
      raridade: "epico",
      tema: "executivo",
      usaCores: ["roupa"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M104 186 l 16 18 l 16 -18 l 8 54 h -48 z" fill="#f4f0e6"/>
      <path d="M98 184 l 22 20 l -14 14 l -16 -26 z" fill="${p.roupa.profundo}"/>
      <path d="M142 184 l -22 20 l 14 14 l 16 -26 z" fill="${p.roupa.profundo}"/>
      <path d="M98 184 l 22 20 l -8 8 l -14 -20 z" fill="${alfa("#ffffff", 0.12)}"/>
      <path d="M110 204 h 20 l -4 6 h -12 z" fill="#14100c"/>
      <circle cx="112" cy="203" r="2.6" fill="#14100c"/>
      <circle cx="128" cy="203" r="2.6" fill="#14100c"/>
      <circle cx="120" cy="222" r="2" fill="#14100c"/>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (p, _u) => `
      <path d="M108 108 l 12 14 l 12 -14 l 2 84 h -28 z" fill="#f4f0e6"/>
      <path d="M104 108 l 16 16 l -10 12 l -12 -20 z" fill="${p.roupa.profundo}"/>
      <path d="M136 108 l -16 16 l 10 12 l 12 -20 z" fill="${p.roupa.profundo}"/>
      <path d="M112 124 h 16 l -3 5 h -10 z" fill="#14100c"/>
      <circle cx="120" cy="146" r="1.8" fill="#14100c"/>
      <circle cx="120" cy="162" r="1.8" fill="#14100c"/>
    `
    },
    {
      id: "rou_jersey",
      categoria: "roupa",
      nome: "Jersey E-sports",
      descricao: "O uniforme oficial do time Dshow Nexus.",
      raridade: "raro",
      tema: "gamer",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M36 240 v-12 c 0 -14 8 -24 22 -32 l 10 44 z" fill="${p.destaque.base}"/>
      <path d="M204 240 v-12 c 0 -14 -8 -24 -22 -32 l -10 44 z" fill="${p.destaque.base}"/>
      <path d="M98 186 c 8 10 36 10 44 0 l 4 6 c -10 12 -42 12 -52 0 z" fill="${p.destaque.base}"/>
      <text x="120" y="226" text-anchor="middle" font-family="system-ui, sans-serif" font-size="26" font-weight="800" fill="${alfa("#ffffff", 0.85)}">07</text>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (p, _u) => `
      <path d="M86 108 l 22 6 v 80 l -22 -4 z" fill="${alfa(p.destaque.base, 0.55)}"/>
      <path d="M154 108 l -22 6 v 80 l 22 -4 z" fill="${alfa(p.destaque.base, 0.55)}"/>
      <text x="120" y="164" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="800" fill="${alfa("#ffffff", 0.85)}">07</text>
      <path d="M104 108 q 16 10 32 0 l -3 8 q -13 8 -26 0 z" fill="${alfa("#000000", 0.22)}"/>
    `
    },
    {
      id: "rou_sobretudo",
      categoria: "roupa",
      nome: "Sobretudo",
      descricao: "Entra na sala e o vento entra junto.",
      raridade: "epico",
      tema: "aventura",
      usaCores: ["roupa"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M36 240 v -14 c 0 -20 16 -34 38 -42 l -6 56 z" fill="${p.roupa.profundo}"/>
      <path d="M204 240 v -14 c 0 -20 -16 -34 -38 -42 l 6 56 z" fill="${p.roupa.profundo}"/>
      <path d="M96 182 l 24 22 l -16 16 l -18 -30 z" fill="${p.roupa.escuro}"/>
      <path d="M144 182 l -24 22 l 16 16 l 18 -30 z" fill="${p.roupa.escuro}"/>
      <path d="M96 182 l 24 22 l -8 8 l -18 -24 z" fill="${alfa("#ffffff", 0.1)}"/>
      <path d="M116 210 h 8 v 30 h -8 z" fill="${alfa("#000000", 0.3)}"/>
      <circle cx="108" cy="216" r="2.2" fill="${p.roupa.claro}"/>
      <circle cx="132" cy="216" r="2.2" fill="${p.roupa.claro}"/>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (p, _u) => `
      <path d="M96 108 l 24 18 l -14 14 l -14 -24 z" fill="${p.roupa.escuro}"/>
      <path d="M144 108 l -24 18 l 14 14 l 14 -24 z" fill="${p.roupa.escuro}"/>
      <path d="M88 118 l 14 6 v 74 l -14 -4 z" fill="${alfa("#000000", 0.3)}"/>
      <path d="M152 118 l -14 6 v 74 l 14 -4 z" fill="${alfa("#000000", 0.3)}"/>
      <path d="M117 138 h 6 v 56 h -6 z" fill="${alfa("#000000", 0.32)}"/>
      <circle cx="110" cy="146" r="1.8" fill="${p.roupa.claro}"/>
      <circle cx="110" cy="162" r="1.8" fill="${p.roupa.claro}"/>
    `
    },
    {
      id: "rou_jaleco",
      categoria: "roupa",
      nome: "Jaleco",
      descricao: "Ciência aplicada com bolso cheio de canetas.",
      raridade: "incomum",
      tema: "ciência",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}jal" x1="0.15" y1="0" x2="0.6" y2="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="0.5" stop-color="#eef1f6"/>
          <stop offset="1" stop-color="#c9d0dd"/>
        </linearGradient>
      </defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}jal)"/>
      <path d="M100 184 l 20 18 l -12 12 l -14 -22 z" fill="#d7dde8"/>
      <path d="M140 184 l -20 18 l 12 12 l 14 -22 z" fill="#d7dde8"/>
      <path d="M104 200 l 16 14 l 16 -14 l 2 40 h -36 z" fill="${p.roupa.base}"/>
      <rect x="146" y="210" width="18" height="20" fill="#ffffff" stroke="#c9d0dd" stroke-width="1.6"/>
      <path d="M150 212 v 12 M155 212 v 14 M160 212 v 10" stroke="${p.destaque.base}" stroke-width="2.4" stroke-linecap="round"/>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (p, _u) => `
      <path d="M86 110 h 68 l -2 84 h -64 z" fill="${alfa("#ffffff", 0.82)}"/>
      <path d="M104 110 l 16 14 l 16 -14 l 0 12 l -16 12 l -16 -12 z" fill="#c9d0dd"/>
      <path d="M112 128 l 8 8 l 8 -8 v 64 h -16 z" fill="${p.roupa.base}"/>
      <path d="M92 150 h 12 v 14 h -12 z" fill="#ffffff" stroke="#c9d0dd" stroke-width="1.2"/>
      <path d="M95 152 v 8 M99 152 v 9" stroke="${p.destaque.base}" stroke-width="1.8" stroke-linecap="round"/>
    `
    },
    {
      id: "rou_neon_racer",
      categoria: "roupa",
      nome: "Jaqueta Neon Racer",
      descricao: "Costura de luz viva — homologada para a madrugada.",
      raridade: "lendario",
      tema: "cyberpunk",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M52 222 c 16 -22 44 -34 68 -34 s 52 12 68 34" stroke="${p.destaque.base}" stroke-width="3.4" fill="none" stroke-linecap="round">
        <animate attributeName="opacity" values="1;0.45;1" dur="1.8s" repeatCount="indefinite"/>
      </path>
      <path d="M60 240 c 14 -20 36 -30 60 -30 s 46 10 60 30" stroke="${alfa(p.destaque.claro, 0.6)}" stroke-width="2" fill="none"/>
      <path d="M98 184 l 22 18 l -13 12 l -15 -22 z" fill="${p.roupa.escuro}"/>
      <path d="M142 184 l -22 18 l 13 12 l 15 -22 z" fill="${p.roupa.escuro}"/>
      <path d="M117 208 h 6 v 32 h -6 z" fill="${alfa(p.destaque.base, 0.8)}"/>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (p, _u) => `
      <path d="M90 120 l 18 8 v 66 l -18 -4 z" fill="${alfa("#000000", 0.28)}"/>
      <path d="M150 120 l -18 8 v 66 l 18 -4 z" fill="${alfa("#000000", 0.28)}"/>
      <path d="M96 130 q 24 -14 48 0" stroke="${p.destaque.base}" stroke-width="2.6" fill="none">
        <animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite"/>
      </path>
      <path d="M96 176 q 24 14 48 0" stroke="${p.destaque.base}" stroke-width="2.6" fill="none">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite"/>
      </path>
      <path d="M118 128 h 4 v 66 h -4 z" fill="${alfa(p.destaque.base, 0.75)}"/>
    `
    },
    // ── 4.6 F2 · Onda 7 — 11 roupas finais (meta §28: 30 ✓) ───────────
    {
      id: "rou_havaiana",
      categoria: "roupa",
      nome: "Havaiana",
      descricao: "Flores tropicais em pleno Q3 — coragem e estilo.",
      raridade: "incomum",
      tema: "casual",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => {
        let flores = "";
        for (let i = 0; i < 8; i++) {
          const x = 52 + i * 47 % 140;
          const y = 192 + i * 29 % 42;
          flores += `<g transform="translate(${x} ${y})">
          <circle r="2" fill="${p.destaque.claro}"/>
          <circle cx="-4" cy="0" r="2.4" fill="${alfa(p.destaque.base, 0.8)}"/>
          <circle cx="4" cy="0" r="2.4" fill="${alfa(p.destaque.base, 0.8)}"/>
          <circle cx="0" cy="-4" r="2.4" fill="${alfa(p.destaque.base, 0.8)}"/>
          <circle cx="0" cy="4" r="2.4" fill="${alfa(p.destaque.base, 0.8)}"/>
        </g>`;
        }
        return `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}
        <clipPath id="${u}hav"><path d="${PATH_OMBROS}"/></clipPath></defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <g clip-path="url(#${u}hav)">${flores}</g>
      <path d="M100 184 l 20 16 l -10 8 l -12 -18 z M140 184 l -20 16 l 10 8 l 12 -18 z" fill="${p.roupa.escuro}"/>
      ${SOMBRA_PESCOCO}`;
      },
      renderCorpo: (p, _u) => `
      <path d="M118 112 v 80" stroke="${alfa("#000000", 0.28)}" stroke-width="2.4"/>
      <g>
        <circle cx="100" cy="132" r="3" fill="${alfa(p.destaque.base, 0.8)}"/>
        <circle cx="138" cy="150" r="3" fill="${alfa(p.destaque.base, 0.8)}"/>
        <circle cx="102" cy="172" r="3" fill="${alfa(p.destaque.base, 0.8)}"/>
        <circle cx="136" cy="184" r="3" fill="${alfa(p.destaque.base, 0.8)}"/>
      </g>
      <path d="M104 108 l 14 12 l -8 8 l -10 -14 z M136 108 l -14 12 l 8 8 l 10 -14 z" fill="${alfa("#000000", 0.22)}"/>
    `
    },
    {
      id: "rou_suspensorios",
      categoria: "roupa",
      nome: "Suspensórios",
      descricao: "Segurança redundante para calças e opiniões.",
      raridade: "incomum",
      tema: "retrô",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>${defsRoupa(u, "#f4f0e6", "#e8e2d2", "#c9c0aa")}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M92 186 l 10 54 h -14 l -8 -48 z" fill="${p.destaque.profundo}"/>
      <path d="M148 186 l -10 54 h 14 l 8 -48 z" fill="${p.destaque.profundo}"/>
      <circle cx="97" cy="196" r="2.6" fill="#e8b64c"/>
      <circle cx="143" cy="196" r="2.6" fill="#e8b64c"/>
      <path d="M98 186 c 8 10 36 10 44 0 c 0 8 -8 14 -22 14 s -22 -6 -22 -14 z" fill="#c9c0aa"/>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (p, _u) => `
      <path d="M86 112 h 68 v 80 h -68 z" fill="${alfa("#f4f0e6", 0.75)}"/>
      <path d="M96 112 l 8 80 h -10 l -6 -76 z" fill="${p.destaque.profundo}"/>
      <path d="M144 112 l -8 80 h 10 l 6 -76 z" fill="${p.destaque.profundo}"/>
      <circle cx="101" cy="124" r="2" fill="#e8b64c"/>
      <circle cx="139" cy="124" r="2" fill="#e8b64c"/>
      <path d="M86 188 h 68 v 6 h -68 z" fill="${alfa(p.destaque.profundo, 0.9)}"/>
    `
    },
    {
      id: "rou_tricot",
      categoria: "roupa",
      nome: "Suéter de Tricô",
      descricao: "Feito com pontos firmes e ar-condicionado em 17°C.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["roupa"],
      render: (p, u) => {
        let pontos = "";
        for (let j = 0; j < 4; j++) {
          pontos += `<path d="M40 ${200 + j * 12} q 8 -6 16 0 t 16 0 t 16 0 t 16 0 t 16 0 t 16 0 t 16 0 t 16 0 t 16 0 t 16 0" stroke="${alfa(p.roupa.profundo, 0.4)}" stroke-width="2.4" fill="none"/>`;
        }
        return `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}
        <clipPath id="${u}tri"><path d="${PATH_OMBROS}"/></clipPath></defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <g clip-path="url(#${u}tri)">${pontos}</g>
      <path d="M96 182 c 8 12 40 12 48 0 l 2 8 c -10 12 -42 12 -52 0 z" fill="${p.roupa.escuro}"/>
      <path d="M98 186 c 8 10 36 10 44 0" stroke="${alfa("#ffffff", 0.2)}" stroke-width="3" fill="none"/>
      ${SOMBRA_PESCOCO}`;
      },
      renderCorpo: (p, _u) => `
      <path d="M104 108 q 16 12 32 0 l -4 10 q -12 8 -24 0 z" fill="${alfa("#000000", 0.22)}"/>
      <g stroke="${alfa(p.roupa.profundo, 0.45)}" stroke-width="2.2" fill="none">
        <path d="M88 128 q 8 -5 16 0 t 16 0 t 16 0 t 16 0"/>
        <path d="M88 146 q 8 -5 16 0 t 16 0 t 16 0 t 16 0"/>
        <path d="M88 164 q 8 -5 16 0 t 16 0 t 16 0 t 16 0"/>
        <path d="M88 182 q 8 -5 16 0 t 16 0 t 16 0 t 16 0"/>
      </g>
    `
    },
    {
      id: "rou_capa_chuva",
      categoria: "roupa",
      nome: "Capa de Chuva",
      descricao: "Amarela, impermeável e visível do espaço.",
      raridade: "raro",
      tema: "clima",
      render: (_p, u) => `
      <defs>
        <linearGradient id="${u}cch" x1="0.15" y1="0" x2="0.6" y2="1">
          <stop offset="0" stop-color="#ffd75e"/>
          <stop offset="0.5" stop-color="#f0b429"/>
          <stop offset="1" stop-color="#c98d12"/>
        </linearGradient>
      </defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}cch)"/>
      <path d="M98 184 l 22 18 l -12 12 l -14 -22 z M142 184 l -22 18 l 12 12 l 14 -22 z" fill="#c98d12"/>
      <path d="M114 206 h 12 v 34 h -12 z" fill="#a87508"/>
      <circle cx="120" cy="214" r="2.4" fill="#ffe89a"/>
      <circle cx="120" cy="228" r="2.4" fill="#ffe89a"/>
      <path d="M46 214 h 26 M168 214 h 26" stroke="#e8f0ff" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (_p, _u) => `
      <path d="M86 110 h 68 l -2 84 h -64 z" fill="rgba(240,180,41,0.85)"/>
      <path d="M104 110 l 16 14 l 16 -14 l 0 10 l -16 14 l -16 -14 z" fill="#c98d12"/>
      <path d="M117 134 h 6 v 58 h -6 z" fill="#a87508"/>
      <circle cx="120" cy="146" r="2" fill="#ffe89a"/>
      <circle cx="120" cy="162" r="2" fill="#ffe89a"/>
      <path d="M90 178 h 18 M132 178 h 18" stroke="#e8f0ff" stroke-width="3.4" stroke-linecap="round" opacity="0.65"/>
    `
    },
    {
      id: "rou_chef",
      categoria: "roupa",
      nome: "Dólmã de Chef",
      descricao: "Mise en place até no backlog.",
      raridade: "raro",
      tema: "casual",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}chf" x1="0.15" y1="0" x2="0.6" y2="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="0.5" stop-color="#f0f1f4"/>
          <stop offset="1" stop-color="#cfd3dd"/>
        </linearGradient>
      </defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}chf)"/>
      <path d="M112 184 v 56" stroke="#cfd3dd" stroke-width="3"/>
      <circle cx="100" cy="200" r="2.6" fill="#3a4054"/>
      <circle cx="100" cy="214" r="2.6" fill="#3a4054"/>
      <circle cx="100" cy="228" r="2.6" fill="#3a4054"/>
      <circle cx="124" cy="200" r="2.6" fill="#3a4054"/>
      <circle cx="124" cy="214" r="2.6" fill="#3a4054"/>
      <circle cx="124" cy="228" r="2.6" fill="#3a4054"/>
      <path d="M96 184 c 8 10 40 10 48 0 l 2 6 c -10 10 -42 10 -52 0 z" fill="${p.destaque.profundo}"/>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (p, _u) => `
      <path d="M86 110 h 68 l -2 84 h -64 z" fill="rgba(240,241,244,0.85)"/>
      <path d="M112 112 v 80" stroke="#cfd3dd" stroke-width="2.6"/>
      <circle cx="102" cy="128" r="2" fill="#3a4054"/>
      <circle cx="102" cy="144" r="2" fill="#3a4054"/>
      <circle cx="102" cy="160" r="2" fill="#3a4054"/>
      <circle cx="122" cy="128" r="2" fill="#3a4054"/>
      <circle cx="122" cy="144" r="2" fill="#3a4054"/>
      <circle cx="122" cy="160" r="2" fill="#3a4054"/>
      <path d="M104 108 q 16 8 32 0 l -2 6 q -14 6 -28 0 z" fill="${alfa(p.destaque.profundo, 0.85)}"/>
    `
    },
    {
      id: "rou_blazer_power",
      categoria: "roupa",
      nome: "Blazer Power",
      descricao: "Ombros estruturados, argumentos idem.",
      raridade: "raro",
      tema: "executivo",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="M32 240 v-12 c0 -30 38 -48 88 -48 s 88 18 88 48 v12 z" fill="url(#${u}rou)"/>
      <path d="M36 208 l 20 -16 l 6 8 l -20 16 z M204 208 l -20 -16 l -6 8 l 20 16 z" fill="${alfa("#ffffff", 0.14)}"/>
      <path d="M100 182 l 20 22 l -14 14 l -16 -28 z M140 182 l -20 22 l 14 14 l 16 -28 z" fill="${p.roupa.profundo}"/>
      <path d="M104 202 l 16 16 l 16 -16 l 4 38 h -40 z" fill="${alfa(p.destaque.base, 0.9)}"/>
      <circle cx="106" cy="214" r="2.4" fill="#e8b64c"/>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (p, _u) => `
      <path d="M100 108 l 20 20 l -12 12 l -14 -22 z M140 108 l -20 20 l 12 12 l 14 -22 z" fill="${p.roupa.profundo}"/>
      <path d="M108 130 l 12 12 l 12 -12 l 2 62 h -28 z" fill="${alfa(p.destaque.base, 0.8)}"/>
      <path d="M88 116 l 14 4 v 72 l -14 -3 z M152 116 l -14 4 v 72 l 14 -3 z" fill="${alfa("#ffffff", 0.1)}"/>
      <circle cx="110" cy="152" r="1.8" fill="#e8b64c"/>
    `
    },
    {
      id: "rou_regata_quadra",
      categoria: "roupa",
      nome: "Regata de Quadra",
      descricao: "Número 10 nas costas e nas avaliações de desempenho.",
      raridade: "incomum",
      tema: "esportivo",
      usaCores: ["roupa", "pele", "destaque"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="M36 240 v-12 c0 -26 32 -44 66 -46 l -22 20 v 38 z" fill="${p.pele.escuro}"/>
      <path d="M204 240 v-12 c0 -26 -32 -44 -66 -46 l 22 20 v 38 z" fill="${p.pele.escuro}"/>
      <path d="M80 202 l 22 -20 c 4 10 32 10 36 0 l 22 20 v 38 h -80 z" fill="url(#${u}rou)"/>
      <path d="M84 206 l 16 -14 M156 206 l -16 -14" stroke="${alfa(p.destaque.base, 0.8)}" stroke-width="4" stroke-linecap="round"/>
      <text x="120" y="230" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="800" fill="${alfa("#ffffff", 0.85)}">10</text>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (p, _u) => `
      <path d="M86 108 l 18 0 l -8 26 q -8 -4 -12 -12 z" fill="${p.pele.base}"/>
      <path d="M154 108 l -18 0 l 8 26 q 8 -4 12 -12 z" fill="${p.pele.base}"/>
      <path d="M96 120 l 10 -8 M144 120 l -10 -8" stroke="${alfa(p.destaque.base, 0.8)}" stroke-width="3.4" stroke-linecap="round"/>
      <text x="120" y="168" text-anchor="middle" font-family="system-ui, sans-serif" font-size="26" font-weight="800" fill="${alfa("#ffffff", 0.85)}">10</text>
    `
    },
    {
      id: "rou_tunica_arcana",
      categoria: "roupa",
      nome: "Túnica Arcana",
      descricao: "Runas bordadas que compilam feitiços em produção.",
      raridade: "epico",
      tema: "fantasia",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M96 184 c 8 12 40 12 48 0 l 4 10 c -12 14 -44 14 -56 0 z" fill="${p.roupa.profundo}"/>
      <g stroke="${alfa(p.destaque.claro, 0.85)}" stroke-width="2" fill="none" stroke-linecap="round">
        <path d="M70 220 l 5 -8 l 5 8 m -5 -8 v 12"/>
        <path d="M160 220 l 5 -8 l 5 8 m -10 4 h 10"/>
        <path d="M116 224 l 4 -7 l 4 7 l -4 4 z"/>
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2.8s" repeatCount="indefinite"/>
      </g>
      <path d="M48 226 q 72 18 144 0" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="2.4" fill="none"/>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (p, _u) => `
      <path d="M104 108 q 16 10 32 0 l -4 10 q -12 8 -24 0 z" fill="${alfa("#000000", 0.25)}"/>
      <path d="M86 182 q 34 12 68 0 l -1 10 q -33 10 -66 0 z" fill="${alfa(p.destaque.base, 0.4)}"/>
      <g stroke="${alfa(p.destaque.claro, 0.85)}" stroke-width="2" fill="none" stroke-linecap="round">
        <path d="M96 140 l 4 -7 l 4 7 m -4 -7 v 10"/>
        <path d="M136 152 l 4 -7 l 4 7 l -4 4 z"/>
        <path d="M114 170 l 4 -7 l 4 7 m -8 3 h 8"/>
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2.8s" repeatCount="indefinite"/>
      </g>
    `
    },
    {
      id: "rou_exoesqueleto",
      categoria: "roupa",
      nome: "Exoesqueleto",
      descricao: "Servomotores calibrados para carregar o time inteiro.",
      raridade: "lendario",
      tema: "sci-fi",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}
        <linearGradient id="${u}exo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4a5266"/>
          <stop offset="1" stop-color="#1c212e"/>
        </linearGradient>
      </defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <path d="M40 226 l 30 -30 M200 226 l -30 -30" stroke="url(#${u}exo)" stroke-width="12" stroke-linecap="round"/>
      <circle cx="58" cy="208" r="8" fill="#2b3040" stroke="${alfa(p.destaque.base, 0.8)}" stroke-width="2"/>
      <circle cx="182" cy="208" r="8" fill="#2b3040" stroke="${alfa(p.destaque.base, 0.8)}" stroke-width="2"/>
      <path d="M92 194 h 56 v 10 h -56 z" fill="url(#${u}exo)"/>
      <path d="M100 194 v 46 M140 194 v 46" stroke="url(#${u}exo)" stroke-width="9"/>
      <circle cx="120" cy="212" r="7" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.5;1" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (p, _u) => `
      <path d="M92 116 h 56 v 8 h -56 z M92 150 h 56 v 8 h -56 z M92 184 h 56 v 8 h -56 z" fill="rgba(28,33,46,0.9)"/>
      <path d="M98 112 v 82 M142 112 v 82" stroke="rgba(28,33,46,0.9)" stroke-width="8"/>
      <circle cx="98" cy="132" r="4" fill="#2b3040" stroke="${alfa(p.destaque.base, 0.8)}" stroke-width="1.6"/>
      <circle cx="142" cy="132" r="4" fill="#2b3040" stroke="${alfa(p.destaque.base, 0.8)}" stroke-width="1.6"/>
      <circle cx="120" cy="154" r="6" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.5;1" dur="1.8s" repeatCount="indefinite"/>
      </circle>
    `
    },
    {
      id: "rou_pijama",
      categoria: "roupa",
      nome: "Pijama de Sexta",
      descricao: "Home office nível máximo: listras e conforto absoluto.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["roupa"],
      render: (p, u) => {
        let listras = "";
        for (let i = 0; i < 9; i++) {
          listras += `<line x1="${44 + i * 19}" y1="180" x2="${44 + i * 19}" y2="240" stroke="${alfa(p.roupa.profundo, 0.4)}" stroke-width="6"/>`;
        }
        return `
      <defs>${defsRoupa(u, p.roupa.claro, p.roupa.base, p.roupa.profundo)}
        <clipPath id="${u}pij"><path d="${PATH_OMBROS}"/></clipPath></defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}rou)"/>
      <g clip-path="url(#${u}pij)">${listras}</g>
      <path d="M100 186 l 20 14 l 20 -14 l 4 8 l -24 16 l -24 -16 z" fill="${p.roupa.claro}"/>
      <circle cx="120" cy="214" r="2.2" fill="${p.roupa.profundo}"/>
      <circle cx="120" cy="226" r="2.2" fill="${p.roupa.profundo}"/>
      ${SOMBRA_PESCOCO}`;
      },
      renderCorpo: (p, _u) => `
      <g opacity="0.45">
        <line x1="94" y1="110" x2="94" y2="194" stroke="${p.roupa.profundo}" stroke-width="5"/>
        <line x1="110" y1="110" x2="110" y2="194" stroke="${p.roupa.profundo}" stroke-width="5"/>
        <line x1="126" y1="110" x2="126" y2="194" stroke="${p.roupa.profundo}" stroke-width="5"/>
        <line x1="142" y1="110" x2="142" y2="194" stroke="${p.roupa.profundo}" stroke-width="5"/>
      </g>
      <path d="M104 108 l 16 12 l 16 -12 l -3 12 l -13 9 l -13 -9 z" fill="${alfa(p.roupa.claro, 0.9)}"/>
      <circle cx="120" cy="140" r="1.8" fill="${p.roupa.profundo}"/>
      <circle cx="120" cy="152" r="1.8" fill="${p.roupa.profundo}"/>
    `
    },
    {
      id: "rou_gala_dshow",
      categoria: "roupa",
      nome: "Gala Dshow",
      descricao: "O traje da premiação anual — roxo assinatura e pixel de ouro.",
      raridade: "exclusivo",
      tema: "dshow",
      usaCores: ["destaque"],
      render: (_p, u) => `
      <defs>
        <linearGradient id="${u}gal" x1="0.15" y1="0" x2="0.6" y2="1">
          <stop offset="0" stop-color="#9a7cff"/>
          <stop offset="0.5" stop-color="#7c5cff"/>
          <stop offset="1" stop-color="#4a2fa8"/>
        </linearGradient>
      </defs>
      <path d="${PATH_OMBROS}" fill="url(#${u}gal)"/>
      <path d="M104 186 l 16 18 l 16 -18 l 8 54 h -48 z" fill="#14101f"/>
      <path d="M98 184 l 22 20 l -14 14 l -16 -26 z M142 184 l -22 20 l 14 14 l 16 -26 z" fill="#2a2044"/>
      <path d="M98 184 l 22 20 l -8 8 l -14 -20 z" fill="${alfa("#ffffff", 0.14)}"/>
      <rect x="112" y="206" width="16" height="6" rx="2" fill="#e8b64c">
        <animate attributeName="opacity" values="1;0.6;1" dur="2.6s" repeatCount="indefinite"/>
      </rect>
      <rect x="60" y="204" width="7" height="7" rx="1.6" fill="#e8b64c"/>
      <path d="M40 232 q 80 14 160 0" stroke="${alfa("#e8b64c", 0.4)}" stroke-width="2" fill="none"/>
      ${SOMBRA_PESCOCO}`,
      renderCorpo: (_p, _u) => `
      <path d="M108 108 l 12 16 l 12 -16 l 2 86 h -28 z" fill="#14101f"/>
      <path d="M102 108 l 18 18 l -11 13 l -13 -22 z M138 108 l -18 18 l 11 13 l 13 -22 z" fill="#2a2044"/>
      <rect x="114" y="132" width="12" height="5" rx="1.8" fill="#e8b64c">
        <animate attributeName="opacity" values="1;0.6;1" dur="2.6s" repeatCount="indefinite"/>
      </rect>
      <rect x="94" y="150" width="6" height="6" rx="1.4" fill="#e8b64c"/>
      <path d="M90 188 q 30 8 60 0" stroke="rgba(232,182,76,0.45)" stroke-width="2" fill="none"/>
    `
    }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/partes/vestuario_seed.ts
  var VESTUARIO_SEED_IDS = [
    "rin_shorts",
    "rin_futurista",
    "ace_tenis_futuro"
  ];
  function gradVert(u, tag, claro, base, profundo) {
    return `<linearGradient id="${u}${tag}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${claro}"/><stop offset="0.5" stop-color="${base}"/><stop offset="1" stop-color="${profundo}"/></linearGradient>`;
  }
  var PERNAS_SEED = "M94 208 h52 v8 l-4 112 q-1 6 -7 6 h-10 q-6 0 -7 -6 l-5 -74 -5 74 q-1 6 -7 6 h-10 q-6 0 -7 -6 l-4 -112 z";
  var comumRinSeed = {
    categoria: "roupa_inferior",
    raridade: "incomum",
    usaCores: ["roupa", "destaque"],
    render: () => ""
    // busto não desenha (só corpo inteiro)
  };
  var ROUPAS_INFERIORES_SEED = [
    {
      ...comumRinSeed,
      id: "rin_shorts",
      nome: "Bermuda",
      tema: "casual",
      descricao: "Bermuda de verão — barra na altura do joelho.",
      renderCorpo: (p, u) => `
      <defs>${gradVert(u, "sh", p.roupa.claro, p.roupa.base, p.roupa.profundo)}
        <clipPath id="${u}shc"><rect x="84" y="200" width="72" height="72"/></clipPath></defs>
      <g clip-path="url(#${u}shc)"><path d="${PERNAS_SEED}" fill="url(#${u}sh)"/></g>
      <path d="M120 216 v52" stroke="${alfa("#000000", 0.16)}" stroke-width="2"/>
      <path d="M90 268 h28 M122 268 h28" stroke="${alfa("#000000", 0.22)}" stroke-width="3"/>`
    },
    {
      ...comumRinSeed,
      id: "rin_futurista",
      raridade: "raro",
      nome: "Calça Tron",
      tema: "cyberpunk",
      descricao: "Corte técnico com linhas de energia laterais.",
      renderCorpo: (p, u) => `
      <defs>${gradVert(u, "ft", p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="${PERNAS_SEED}" fill="url(#${u}ft)"/>
      <path d="M120 216 v108" stroke="${alfa("#000000", 0.18)}" stroke-width="2"/>
      <path d="M97 214 q6 60 6 112 M143 214 q-6 60 -6 112" stroke="${p.destaque.base}" stroke-width="1.8" fill="none"/>
      <path d="M99 300 h8 M133 300 h8" stroke="${p.destaque.claro}" stroke-width="2.4" stroke-linecap="round"/>`
    }
  ];
  var CALCADOS_SEED = [
    {
      categoria: "acessorio",
      slot: "pes",
      raridade: "raro",
      id: "ace_tenis_futuro",
      nome: "Tênis Hover",
      tema: "cyberpunk",
      descricao: "Entressola luminosa com aro de propulsão.",
      usaCores: ["roupa", "destaque"],
      render: () => "",
      renderCorpo: (p, u) => `
      <defs>${gradVert(u, "cf", p.roupa.claro, p.roupa.base, p.roupa.profundo)}</defs>
      <path d="M96 322 h20 v15 l8 5 q5 3 0 8 h-30 q-5 -2 -4 -8 l6 -4 z" fill="url(#${u}cf)"/>
      <path d="M122 322 h20 l0 15 8 5 q5 3 0 8 h-30 q-5 -2 -4 -8 l6 -5 z" fill="url(#${u}cf)"/>
      <path d="M92 349 h34 q2 0 2 2 v1 q0 2 -2 2 h-34 q-2 0 -2 -2 v-1 q0 -2 2 -2 z" fill="${p.destaque.profundo}"/>
      <path d="M118 349 h34 q2 0 2 2 v1 q0 2 -2 2 h-34 q-2 0 -2 -2 v-1 q0 -2 2 -2 z" fill="${p.destaque.profundo}"/>
      <path d="M100 330 l12 3 M126 330 l12 3" stroke="${p.destaque.claro}" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="110" cy="360" rx="18" ry="3" fill="${p.destaque.base}" opacity="0.42"/>
      <ellipse cx="136" cy="360" rx="18" ry="3" fill="${p.destaque.base}" opacity="0.42"/>
      <path d="M94 360 h34 M120 360 h34" stroke="${p.destaque.claro}" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>`
    }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/materiais2d.ts
  var gid = (uid, token) => `${uid}m2_${token}`;
  var FOLD_RESP = {
    cotton: { rC: "w", rA: 0.1, rW: 6, vA: 0.12, vW: 6 },
    wool: { rC: "w", rA: 0.05, rW: 8, vA: 0.16, vW: 8 },
    leather: { rC: "w", rA: 0.6, rW: 2.2, vA: 0.42, vW: 4 },
    technical: { rC: "brilho", rA: 0.42, rW: 3, vA: 0.22, vW: 4 },
    satin: { rC: "w", rA: 0.34, rW: 8, vA: 0.16, vW: 6 },
    silk: { rC: "w", rA: 0.38, rW: 7, vA: 0.16, vW: 6 },
    metal: { rC: "w", rA: 0.72, rW: 2, vA: 0.5, vW: 3 },
    denim: { rC: "claro", rA: 0.16, rW: 4, vA: 0.28, vW: 4 },
    glass: { rC: "w", rA: 0.42, rW: 3, vA: 0.2, vW: 5 },
    emissive: { rC: "brilho", rA: 0.3, rW: 5, vA: 0.1, vW: 4 }
  };
  function gradTecido(id, t, y2 = 1) {
    return `<linearGradient id="${id}" x1="0.2" y1="0" x2="0.55" y2="${y2}"><stop offset="0" stop-color="${t.claro}"/><stop offset="0.45" stop-color="${t.base}"/><stop offset="1" stop-color="${t.escuro}"/></linearGradient>`;
  }
  function material2d(token, hexBase) {
    const t = tintaPremium(hexBase);
    const fr = FOLD_RESP[token];
    const rCor = fr.rC === "w" ? "#ffffff" : t[fr.rC];
    const dobra = (_u, cristas, vales) => vales.map((d) => `<path d="${d}" fill="none" stroke="${alfa("#000000", fr.vA)}" stroke-width="${fr.vW}" stroke-linecap="round"/>`).join("") + cristas.map((d) => `<path d="${d}" fill="none" stroke="${alfa(rCor, fr.rA)}" stroke-width="${fr.rW}" stroke-linecap="round"/>`).join("");
    const comum2 = { token, tinta: t, fill: (u) => `url(#${gid(u, token)})`, dobra };
    switch (token) {
      case "cotton":
        return {
          ...comum2,
          defs: (u) => `<linearGradient id="${gid(u, token)}" x1="0.3" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="${t.claro}"/><stop offset="0.5" stop-color="${t.base}"/><stop offset="1" stop-color="${t.meio}"/></linearGradient><radialGradient id="${gid(u, token)}h" cx="0.4" cy="0.3" r="0.7"><stop offset="0" stop-color="${alfa("#ffffff", 0.14)}"/><stop offset="1" stop-color="${alfa("#ffffff", 0)}"/></radialGradient>`,
          realce: (u, d) => `<path d="${d}" fill="url(#${gid(u, token)}h)"/>`
        };
      case "wool":
        return {
          ...comum2,
          defs: (u) => `<linearGradient id="${gid(u, token)}" x1="0.2" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="${t.base}"/><stop offset="0.5" stop-color="${t.base}"/><stop offset="1" stop-color="${t.escuro}"/></linearGradient><pattern id="${gid(u, token)}p" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(12)"><path d="M0 2.5 h5 M2.5 0 v5" stroke="${alfa(t.escuro, 0.16)}" stroke-width="0.7"/></pattern>`,
          realce: (u, d) => `<path d="${d}" fill="url(#${gid(u, token)}p)"/>`
        };
      case "denim":
        return {
          ...comum2,
          defs: (u) => gradTecido(gid(u, token), t) + `<pattern id="${gid(u, token)}p" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><path d="M0 0 v4" stroke="${alfa(t.claro, 0.25)}" stroke-width="0.8"/><path d="M2 0 v4" stroke="${alfa(t.profundo, 0.2)}" stroke-width="0.8"/></pattern>`,
          realce: (u, d) => `<path d="${d}" fill="url(#${gid(u, token)}p)"/><path d="${d}" fill="none" stroke="${alfa(t.profundo, 0.4)}" stroke-width="1.6" stroke-dasharray="5 3" stroke-linecap="round"/>`
        };
      case "leather":
        return {
          ...comum2,
          defs: (u) => `<linearGradient id="${gid(u, token)}" x1="0.1" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="${t.claro}"/><stop offset="0.3" stop-color="${t.base}"/><stop offset="0.7" stop-color="${t.escuro}"/><stop offset="1" stop-color="${t.profundo}"/></linearGradient><linearGradient id="${gid(u, token)}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0.32" stop-color="${alfa("#ffffff", 0)}"/><stop offset="0.42" stop-color="${alfa("#ffffff", 0.5)}"/><stop offset="0.52" stop-color="${alfa("#ffffff", 0)}"/></linearGradient>`,
          // specular strip (banda larga) + bordas escuras + creases finas
          realce: (u, d) => `<path d="${d}" fill="url(#${gid(u, token)}s)"/><path d="${d}" fill="none" stroke="${alfa(t.profundo, 0.55)}" stroke-width="2.4"/><path d="${d}" fill="none" stroke="${alfa(t.profundo, 0.3)}" stroke-width="0.9" stroke-dasharray="3 14" stroke-dashoffset="7"/>`
        };
      case "metal":
        return {
          ...comum2,
          // anisotropia: paradas duras (metal lê por CONTRASTE de banda §2404)
          defs: (u) => `<linearGradient id="${gid(u, token)}" x1="0" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="${t.brilho}"/><stop offset="0.34" stop-color="${t.base}"/><stop offset="0.36" stop-color="${t.profundo}"/><stop offset="0.62" stop-color="${t.escuro}"/><stop offset="0.8" stop-color="${t.claro}"/><stop offset="1" stop-color="${t.base}"/></linearGradient>`,
          realce: (_u, d) => `<path d="${d}" fill="none" stroke="${alfa("#ffffff", 0.5)}" stroke-width="1" stroke-dasharray="4 40"/>`
        };
      case "technical":
        return {
          ...comum2,
          defs: (u) => gradTecido(gid(u, token), t, 0.9) + `<pattern id="${gid(u, token)}p" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0 0 h16 M0 0 v16" stroke="${alfa(t.escuro, 0.28)}" stroke-width="0.8"/><path d="M0 15.4 h16" stroke="${alfa(t.brilho, 0.22)}" stroke-width="0.6"/></pattern>`,
          realce: (u, d) => `<path d="${d}" fill="url(#${gid(u, token)}p)"/><path d="${d}" fill="none" stroke="${alfa(t.brilho, 0.45)}" stroke-width="1.4"/>`
        };
      case "satin":
        return {
          ...comum2,
          defs: (u) => `<linearGradient id="${gid(u, token)}" x1="0" y1="0.1" x2="1" y2="0.9"><stop offset="0" stop-color="${t.escuro}"/><stop offset="0.35" stop-color="${t.brilho}"/><stop offset="0.55" stop-color="${t.base}"/><stop offset="1" stop-color="${t.escuro}"/></linearGradient>`,
          realce: () => ""
        };
      case "silk":
        return {
          ...comum2,
          defs: (u) => `<linearGradient id="${gid(u, token)}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.claro}"/><stop offset="0.4" stop-color="${t.base}"/><stop offset="0.6" stop-color="${t.brilho}"/><stop offset="1" stop-color="${t.meio}"/></linearGradient>`,
          realce: () => ""
        };
      case "glass":
        return {
          ...comum2,
          defs: (u) => `<linearGradient id="${gid(u, token)}" x1="0.2" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="${alfa(t.brilho, 0.85)}"/><stop offset="0.5" stop-color="${alfa(t.base, 0.55)}"/><stop offset="1" stop-color="${alfa(t.escuro, 0.7)}"/></linearGradient>`,
          realce: (_u, d) => `<path d="${d}" fill="none" stroke="${alfa("#ffffff", 0.55)}" stroke-width="1.2" stroke-dasharray="14 30"/>`
        };
      case "emissive":
        return {
          ...comum2,
          // emissivo SEM filtro (orçamento §2510): halo por camadas de alfa
          defs: (u) => `<radialGradient id="${gid(u, token)}" cx="0.5" cy="0.4" r="0.75"><stop offset="0" stop-color="${t.brilho}"/><stop offset="0.6" stop-color="${t.base}"/><stop offset="1" stop-color="${t.escuro}"/></radialGradient>`,
          realce: (_u, d) => `<path d="${d}" fill="none" stroke="${alfa(t.brilho, 0.35)}" stroke-width="3"/><path d="${d}" fill="none" stroke="${alfa(t.brilho, 0.18)}" stroke-width="6"/>`
        };
      default:
        return { ...comum2, defs: (u) => gradTecido(gid(u, token), t), realce: () => "" };
    }
  }

  // public/components/panels/panel-avatar-studio/src/engine/partes/premium/roupas.ts
  var SOMBRA_PESCOCO2 = `<path d="M96 186 c 6 10 42 10 48 0 c -2 12 -46 12 -48 0 z" fill="rgba(0,0,0,0.25)"/>`;
  var ROUPAS_PREMIUM = [
    {
      id: "rou_px_terno",
      categoria: "roupa",
      nome: "Terno Premium",
      descricao: "Alfaiataria com caimento de lã fria e lapela viva — o Executivo, elevado.",
      raridade: "epico",
      tema: "executivo",
      usaCores: ["roupa", "destaque"],
      acabamento: "premium",
      render: (p, u) => {
        const la = material2d("wool", p.roupa.base);
        const seda = material2d("silk", p.destaque.base);
        return `
      <defs>${la.defs(u)}${seda.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${la.fill(u)}"/>
      <path d="M106 190 l 14 12 l 14 -12 v 50 h -28 z" fill="#f4f6fa"/>
      <path d="M111 196 v 42" stroke="${alfa("#0d1017", 0.1)}" stroke-width="1.2"/>
      <path d="M114 203 l 6 -6 l 6 6 l -6 6 z" fill="${seda.tinta.escuro}"/>
      <path d="M120 208 l -6 9 l 6 23 l 6 -23 z" fill="${seda.fill(u)}"/>
      <path d="M97 186 c 5 7 13 13 22 16 l -13 24 c -8 -12 -11 -26 -9 -40 z" fill="${la.tinta.profundo}"/>
      <path d="M143 186 c -5 7 -13 13 -22 16 l 13 24 c 8 -12 11 -26 9 -40 z" fill="${la.tinta.profundo}"/>
      <path d="M99 189 c 5 6 12 11 20 14" stroke="${alfa(la.tinta.brilho, 0.5)}" stroke-width="1.6" fill="none"/>
      <path d="M141 189 c -5 6 -12 11 -20 14" stroke="${alfa(la.tinta.brilho, 0.35)}" stroke-width="1.4" fill="none"/>
      <path d="M92 196 l 8 -3 l -4 9 z" fill="${la.tinta.claro}"/>
      <path d="M148 196 l -8 -3 l 4 9 z" fill="${la.tinta.meio}"/>
      ${SOMBRA_PESCOCO2}
      <rect x="58" y="216" width="12" height="5" rx="2" fill="${alfa("#ffffff", 0.3)}" transform="rotate(-22 64 218)"/>
      <circle cx="97" cy="221" r="1.6" fill="${seda.tinta.brilho}"/>`;
      },
      // sombra de contato PRÓPRIA (trilho §2418): elipse dupla sob os ombros
      renderSombra: (p, _u) => `
      <ellipse cx="120" cy="238" rx="66" ry="7" fill="${alfa("#000000", 0.28)}"/>
      <ellipse cx="120" cy="238" rx="44" ry="4.5" fill="${alfa(p.roupa.profundo, 0.35)}"/>`,
      // volume atrás da figura (§2414): meia-luz que desenha a silhueta
      renderAtras: (p, u) => `
      <defs><radialGradient id="${u}pxtz" cx="0.5" cy="0.35" r="0.7">
        <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.16)}"/>
        <stop offset="1" stop-color="${alfa(p.destaque.claro, 0)}"/>
      </radialGradient></defs>
      <ellipse cx="120" cy="120" rx="104" ry="112" fill="url(#${u}pxtz)"/>`,
      renderCorpo: (p, u) => {
        const seda = material2d("silk", p.destaque.base);
        return `
      <defs>${seda.defs(u)}</defs>
      <path d="M104 108 l 16 22 l 16 -22 l 8 10 l -24 34 l -24 -34 z" fill="#f2f4fa"/>
      <path d="M116 116 l 4 6 l 4 -6 l 4 6 l -8 44 l -8 -44 z" fill="${seda.fill(u)}"/>
      <path d="M104 108 l -8 12 l 14 22 l 10 -12 z" fill="${p.roupa.profundo}"/>
      <path d="M136 108 l 8 12 l -14 22 l -10 -12 z" fill="${p.roupa.profundo}"/>
      <path d="M98 121 l 12 19" stroke="${alfa("#ffffff", 0.18)}" stroke-width="1.4" fill="none"/>`;
      }
    },
    {
      id: "rou_px_jaqueta",
      categoria: "roupa",
      nome: "Jaqueta Premium",
      descricao: "Couro com memória de uso: dobras que contam história.",
      raridade: "raro",
      tema: "urbano",
      usaCores: ["roupa", "destaque"],
      acabamento: "premium",
      render: (p, u) => {
        const couro = material2d("leather", p.roupa.base);
        const metal = material2d("metal", p.destaque.base);
        return `
      <defs>${couro.defs(u)}${metal.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${couro.fill(u)}"/>
      <path d="M112 188 v 52" stroke="${metal.fill(u)}" stroke-width="3.4"/>
      <path d="M112 188 v 52" stroke="${alfa("#ffffff", 0.25)}" stroke-width="1" stroke-dasharray="2 3"/>
      <path d="M96 186 c 4 8 10 13 18 16 l -6 10 c -9 -5 -13 -14 -12 -26 z" fill="${couro.tinta.profundo}"/>
      <path d="M144 186 c -4 8 -10 13 -18 16 l 6 10 c 9 -5 13 -14 12 -26 z" fill="${couro.tinta.profundo}"/>
      ${couro.realce(u, "M52 226 c 10 -18 30 -28 48 -32")}
      <path d="M64 212 l 14 8 l -3 6 l -14 -7 z" fill="${couro.tinta.claro}"/>
      <path d="M176 212 l -14 8 l 3 6 l 14 -7 z" fill="${couro.tinta.meio}"/>
      ${SOMBRA_PESCOCO2}
      <rect x="128" y="214" width="9" height="6" rx="1.5" fill="${metal.fill(u)}"/>`;
      },
      renderSombra: (p, _u) => `
      <ellipse cx="120" cy="238" rx="62" ry="6.5" fill="${alfa("#000000", 0.26)}"/>
      <ellipse cx="120" cy="238" rx="40" ry="4" fill="${alfa(p.roupa.profundo, 0.3)}"/>`,
      renderCorpo: (p, u) => {
        const metal = material2d("metal", p.destaque.base);
        return `
      <defs>${metal.defs(u)}</defs>
      <path d="M119 110 v 96" stroke="${metal.fill(u)}" stroke-width="3"/>
      <path d="M100 112 c 4 8 9 13 16 16 l -5 9 c -8 -5 -12 -13 -11 -25 z" fill="${p.roupa.profundo}"/>
      <path d="M140 112 c -4 8 -9 13 -16 16 l 5 9 c 8 -5 12 -13 11 -25 z" fill="${p.roupa.profundo}"/>
      <path d="M96 196 h 18 v 3 h -18 z" fill="${alfa("#000000", 0.2)}"/>`;
      }
    }
  ];

  // public/components/panels/panel-avatar-studio/src/domain/heroAsset.ts
  var LAYER_HOOK = {
    back: "renderAtras",
    shadow: "renderSombra",
    base: "render",
    mid: "render",
    light: "render",
    detail: "render",
    occlusion: "render",
    front: "renderFrente"
  };
  var LAYER_Z = {
    back: 0,
    shadow: 0,
    base: 10,
    mid: 20,
    light: 30,
    detail: 40,
    occlusion: 50,
    front: 60
  };
  var HERO_LAYERS = [
    "back",
    "shadow",
    "base",
    "mid",
    "light",
    "detail",
    "occlusion",
    "front"
  ];

  // public/components/panels/panel-avatar-studio/src/engine/heroAssetImport.ts
  function tomDoCanal(p, canal, tone) {
    const t = p[canal];
    if (tone === "base" || tone === "claro" || tone === "escuro" || tone === "profundo") {
      return t[tone];
    }
    return tintaPremium(t.base)[tone];
  }
  function attr(attrs, nome) {
    const m = attrs.match(new RegExp(`\\b${nome}="([^"]*)"`));
    return m ? m[1] : null;
  }
  function limparAutoria(attrs) {
    return attrs.replace(/\s+data-(hero-layer|hero|channel|tone|paint|material|anchor)="[^"]*"/g, "").replace(/\s{2,}/g, " ");
  }
  function limparAutoriaGlobal(svg) {
    return svg.replace(/\s+data-(hero-layer|hero|channel|tone|paint|material|anchor)="[^"]*"/g, "");
  }
  function forcarPintura(attrs, nome, valor) {
    if (new RegExp(`\\b${nome}="[^"]*"`).test(attrs)) {
      return attrs.replace(new RegExp(`\\b${nome}="[^"]*"`), `${nome}="${valor}"`);
    }
    return `${attrs} ${nome}="${valor}"`;
  }
  function escoparIds(svg, u) {
    return svg.replace(/\bid="([\w-]+)"/g, `id="${u}$1"`).replace(/url\(#([\w-]+)\)/g, `url(#${u}$1)`).replace(/\b(xlink:href|href)="#([\w-]+)"/g, `$1="#${u}$2"`);
  }
  function elementosDeTopo(svg) {
    const out = [];
    let i = 0;
    const n = svg.length;
    while (i < n) {
      if (svg[i] !== "<") {
        i++;
        continue;
      }
      if (svg.startsWith("<!--", i)) {
        const e = svg.indexOf("-->", i);
        i = e < 0 ? n : e + 3;
        continue;
      }
      const tagM = svg.slice(i).match(/^<([\w:-]+)([^>]*?)(\/?)>/);
      if (!tagM) {
        i++;
        continue;
      }
      const nome = tagM[1];
      const selfClose = tagM[3] === "/";
      const tagFull = tagM[0];
      if (selfClose) {
        out.push(tagFull);
        i += tagFull.length;
        continue;
      }
      let depth = 1;
      let j = i + tagFull.length;
      const abre = new RegExp(`<${nome}\\b[^>]*?(\\/?)>`, "g");
      const fecha = new RegExp(`</${nome}>`, "g");
      while (depth > 0 && j < n) {
        abre.lastIndex = j;
        fecha.lastIndex = j;
        const a = abre.exec(svg);
        const f = fecha.exec(svg);
        if (!f) {
          j = n;
          break;
        }
        if (a && a.index < f.index) {
          if (a[1] !== "/") depth++;
          j = a.index + a[0].length;
        } else {
          depth--;
          j = f.index + f[0].length;
        }
      }
      out.push(svg.slice(i, j));
      i = j;
    }
    return out;
  }
  function parseAsset(asset) {
    let svg = asset.svg;
    let defs = "";
    svg = svg.replace(/<defs>([\s\S]*?)<\/defs>/g, (_m, body) => {
      defs += body;
      return "";
    });
    const anchors = [];
    svg = svg.replace(/<g\b[^>]*data-hero="anchors"[^>]*>([\s\S]*?)<\/g>/g, (_m, body) => {
      const re = /<\w+\b([^>]*)\/?>/g;
      let mm;
      while (mm = re.exec(body)) {
        const a = mm[1];
        const nome = attr(a, "data-anchor");
        if (!nome) continue;
        const x = parseFloat(attr(a, "cx") ?? attr(a, "x") ?? "NaN");
        const y = parseFloat(attr(a, "cy") ?? attr(a, "y") ?? "NaN");
        if (!Number.isNaN(x) && !Number.isNaN(y)) anchors.push({ nome, x, y });
      }
      return "";
    });
    const buckets = Object.fromEntries(HERO_LAYERS.map((l) => [l, []]));
    for (const el of elementosDeTopo(svg)) {
      if (!el.trim()) continue;
      const head = el.match(/^<[\w:-]+([^>]*?)\/?>/);
      const camada = head && attr(head[1], "data-hero-layer") || "base";
      (buckets[camada] || buckets.base).push(el);
    }
    return { defs, anchors, buckets };
  }
  function resolverPintura(bloco, p, u, matDefs) {
    return bloco.replace(/<([\w:-]+)([^>]*?)(\/?)>/g, (full, tag, attrs, close) => {
      const canal = attr(attrs, "data-channel");
      const material = attr(attrs, "data-material");
      if (!canal && !material) return full;
      const paint = attr(attrs, "data-paint") || "fill";
      let a = attrs;
      if (material && canal) {
        const chave = `${material}:${canal}`;
        const mu = `${u}${canal}_`;
        const baseHex = p[canal]?.base ?? p.roupa.base;
        const m = material2d(material, baseHex);
        if (!matDefs.has(chave)) matDefs.set(chave, m.defs(mu));
        a = forcarPintura(a, "fill", m.fill(mu));
      } else if (canal) {
        const tone = attr(attrs, "data-tone") || "base";
        const cor = tomDoCanal(p, canal, tone);
        if (paint === "fill" || paint === "both") a = forcarPintura(a, "fill", cor);
        if (paint === "stroke" || paint === "both") a = forcarPintura(a, "stroke", cor);
      }
      return `<${tag}${limparAutoria(a)}${close ? "/" : ""}>`;
    });
  }
  var HOOK_PRIORIDADE = ["render", "renderAtras", "renderSombra", "renderFrente"];
  function hookNaoVazio(hook, parsed) {
    return HERO_LAYERS.some((l) => LAYER_HOOK[l] === hook && parsed.buckets[l].length > 0);
  }
  function donoDefs(parsed) {
    return HOOK_PRIORIDADE.find((h) => hookNaoVazio(h, parsed)) ?? null;
  }
  function montarHook(hook, parsed, p, u) {
    const camadas = HERO_LAYERS.filter((l) => LAYER_HOOK[l] === hook).sort((x, y) => LAYER_Z[x] - LAYER_Z[y]);
    const matDefs = /* @__PURE__ */ new Map();
    const corpo = camadas.map((l) => parsed.buckets[l].join("")).join("");
    if (!corpo.trim()) return "";
    const resolvido = limparAutoriaGlobal(resolverPintura(corpo, p, u, matDefs));
    const defsAsset = hook === donoDefs(parsed) && parsed.defs.trim() ? `<defs>${parsed.defs}</defs>` : "";
    const defsMat = matDefs.size ? `<defs>${[...matDefs.values()].join("")}</defs>` : "";
    return escoparIds(`${defsAsset}${defsMat}${resolvido}`, u);
  }
  function importarHeroAsset(asset) {
    const m = asset.manifesto;
    const parsed = parseAsset(asset);
    asset.anchors = parsed.anchors;
    const render = (p, u) => montarHook("render", parsed, p, u);
    const atras = (p, u) => montarHook("renderAtras", parsed, p, u);
    const sombra = (p, u) => montarHook("renderSombra", parsed, p, u);
    const frente = (p, u) => montarHook("renderFrente", parsed, p, u);
    const temAtras = HERO_LAYERS.some((l) => LAYER_HOOK[l] === "renderAtras" && parsed.buckets[l].length);
    const temSombra = HERO_LAYERS.some((l) => LAYER_HOOK[l] === "renderSombra" && parsed.buckets[l].length);
    const temFrente = HERO_LAYERS.some((l) => LAYER_HOOK[l] === "renderFrente" && parsed.buckets[l].length);
    const def = {
      id: m.id,
      categoria: m.categoria,
      nome: m.nome,
      descricao: m.descricao,
      raridade: m.raridade,
      tema: m.tema,
      lore: m.lore,
      usaCores: m.canais.map((c) => c.canal),
      requerBase: m.requerBase,
      incompativelCom: m.incompativelCom,
      acabamento: "premium",
      render,
      // corpo inteiro: a mesma silhueta autorada é a peça (§ silhueta própria)
      renderCorpoV2: m.frame === "corpo" ? render : void 0
    };
    if (temAtras) def.renderAtras = atras;
    if (temSombra) def.renderSombra = sombra;
    if (temFrente) def.renderFrente = frente;
    return def;
  }

  // public/components/panels/panel-avatar-studio/src/engine/partes/heroes.ts
  var BLAZER_SVG = `<defs>
    <radialGradient id="halo" cx="0.5" cy="0.42" r="0.62">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  
  <ellipse data-hero-layer="back" cx="120" cy="196" rx="108" ry="150" fill="url(#halo)"/>

  
  <ellipse data-hero-layer="shadow" cx="120" cy="386" rx="74" ry="9" fill="#000000" opacity="0.30"/>
  <ellipse data-hero-layer="shadow" cx="120" cy="386" rx="46" ry="5" fill="#000000" opacity="0.22"/>

  
  <path data-hero-layer="base" data-channel="roupa" data-material="wool" fill="#3a4256"
        d="M107 108
           C 103 112 98 116 71 124
           C 74 138 76 146 75 160
           C 74 178 72 186 85 200
           C 82 214 82 220 82 230
           L 158 230
           C 158 220 158 214 155 200
           C 168 186 166 178 165 160
           C 164 146 166 138 169 124
           C 142 116 137 112 133 108
           C 128 130 112 130 107 108 Z"/>

  
  <path data-hero-layer="mid" data-channel="roupa" data-tone="escuro" data-paint="stroke"
        fill="none" stroke="#232833" stroke-width="3" stroke-linecap="round" opacity="0.55"
        d="M92 150 C 90 176 92 198 96 224"/>
  <path data-hero-layer="mid" data-channel="roupa" data-tone="escuro" data-paint="stroke"
        fill="none" stroke="#232833" stroke-width="3" stroke-linecap="round" opacity="0.55"
        d="M148 150 C 150 176 148 198 144 224"/>

  
  <path data-hero-layer="light" data-channel="roupa" data-tone="claro" data-paint="stroke"
        fill="none" stroke="#6b7488" stroke-width="2.4" stroke-linecap="round" opacity="0.5"
        d="M80 132 C 78 150 78 168 80 190"/>

  
  <path data-hero-layer="detail" data-channel="destaque" data-tone="escuro" fill="#8a5e1e"
        d="M107 108 C 112 130 118 150 120 176 L 120 150 C 118 130 114 118 107 108 Z"/>
  <path data-hero-layer="detail" data-channel="destaque" data-tone="escuro" fill="#8a5e1e"
        d="M133 108 C 128 130 122 150 120 176 L 120 150 C 122 130 126 118 133 108 Z"/>
  <circle data-hero-layer="detail" data-channel="destaque" data-tone="brilho" cx="120" cy="188" r="2.4"/>
  <circle data-hero-layer="detail" data-channel="destaque" data-tone="brilho" cx="120" cy="206" r="2.4"/>

  
  <path data-hero-layer="occlusion" fill="#000000" opacity="0.18"
        d="M104 120 C 112 128 128 128 136 120 C 132 132 108 132 104 120 Z"/>

  
  <path data-hero-layer="front" fill="#ffffff" opacity="0.14"
        d="M112 118 C 116 134 118 150 119 170 C 116 150 113 132 112 118 Z"/>

  
  <g data-hero="anchors">
    <circle data-anchor="gola"    cx="120" cy="112"/>
    <circle data-anchor="ombroL"  cx="71"  cy="124"/>
    <circle data-anchor="ombroR"  cx="169" cy="124"/>
    <circle data-anchor="cintura" cx="120" cy="192"/>
    <circle data-anchor="bainha"  cx="120" cy="230"/>
  </g>`;
  var BLAZER = {
    manifesto: {
      id: "rou_hx_blazer",
      categoria: "roupa",
      nome: "Blazer Autorado",
      descricao: "Alfaiataria estruturada — primeiro ativo pelo pipeline de autoria (A+).",
      raridade: "epico",
      tema: "executivo",
      lore: "Desenhado fora do código e vestido pelo motor sem uma linha de Bézier na mão.",
      frame: "corpo",
      viewBox: [240, 400],
      canais: [{ canal: "roupa", rotulo: "Tecido" }, { canal: "destaque", rotulo: "Lapela" }],
      zonasMaterial: [{ id: "corpo", material: "wool", canal: "roupa" }],
      fit: "STRUCTURED"
    },
    svg: BLAZER_SVG
  };
  var HEROES_2D = [
    importarHeroAsset(BLAZER)
  ];

  // public/components/panels/panel-avatar-studio/src/engine/partes/premium/cabelos.ts
  function defsCab(u, t) {
    return `
    <linearGradient id="${u}pxc" x1="0.22" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${t.claro}"/>
      <stop offset="0.4" stop-color="${t.base}"/>
      <stop offset="0.78" stop-color="${t.meio}"/>
      <stop offset="1" stop-color="${t.escuro}"/>
    </linearGradient>
    <linearGradient id="${u}pxcat" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.meio}"/>
      <stop offset="1" stop-color="${t.profundo}"/>
    </linearGradient>`;
  }
  var SOMBRA_TESTA = (t, d) => `<path d="${d}" fill="${alfa(t.profundo, 0.22)}"/>`;
  function mechas(t, paths, intensidade = 0.34) {
    return paths.map((d, i) => `<path d="${d}" stroke="${alfa(i % 2 ? "#ffffff" : t.claro, intensidade * (i % 2 ? 0.8 : 1))}" stroke-width="${2.1 - i % 3 * 0.5}" stroke-linecap="round" fill="none"/>`).join("");
  }
  function fios(t, paths) {
    return paths.map((d) => `<path d="${d}" stroke="${alfa(t.escuro, 0.6)}" stroke-width="1.1" stroke-linecap="round" fill="none"/>`).join("");
  }
  function cabeloPremium(c) {
    return (p, u) => {
      const t = tintaPremium(p.cabelo.base);
      const clip = `${u}pxhclip`;
      const lz = c.luzClump ?? 0.16;
      return `
      <defs>${defsCab(u, t)}
        <clipPath id="${clip}"><path d="${c.massa}"/></clipPath>
        <radialGradient id="${u}pxtl" cx="0.42" cy="0.24" r="0.62">
          <stop offset="0" stop-color="${alfa("#ffffff", 0.2)}"/><stop offset="0.7" stop-color="${alfa("#ffffff", 0.04)}"/><stop offset="1" stop-color="${alfa("#ffffff", 0)}"/></radialGradient>
        <radialGradient id="${u}pxoc" cx="0.5" cy="0.44" r="0.6">
          <stop offset="0.5" stop-color="${alfa(t.profundo, 0)}"/><stop offset="1" stop-color="${alfa(t.profundo, 0.6)}"/></radialGradient>
      </defs>
      ${SOMBRA_TESTA(t, c.sombraTesta)}
      <path d="${c.massa}" fill="url(#${u}pxc)"/>
      <g clip-path="url(#${clip})">
        <rect x="34" y="16" width="172" height="164" fill="url(#${u}pxoc)"/>
        ${c.clumpsDark ? c.clumpsDark.map((d) => `<path d="${d}" fill="${alfa(t.profundo, 0.5)}"/>`).join("") : ""}
        ${c.sombraInterna ? `<path d="${c.sombraInterna}" fill="${alfa(t.profundo, 0.4)}"/>` : ""}
        <rect x="34" y="16" width="172" height="120" fill="url(#${u}pxtl)"/>
        ${c.clumpsLight ? c.clumpsLight.map((d) => `<path d="${d}" fill="${alfa("#ffffff", lz)}"/>`).join("") : ""}
      </g>
      ${c.franja ? `<path d="${c.franja}" fill="${t.meio}"/>` : ""}
      ${mechas(t, c.mechas)}
      ${c.mechasDestaque ? c.mechasDestaque.map((d) => `<path d="${d}" stroke="${alfa(t.claro, 0.7)}" stroke-width="2" stroke-linecap="round" fill="none"/>`).join("") : ""}
      ${c.fios ? fios(t, c.fios) : ""}`;
    };
  }
  function massaAtras(d, dSombra) {
    return (p, u) => {
      const t = tintaPremium(p.cabelo.base);
      return `
      <defs><linearGradient id="${u}pxcatb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${t.meio}"/><stop offset="1" stop-color="${t.profundo}"/>
      </linearGradient></defs>
      <path d="${d}" fill="url(#${u}pxcatb)"/>
      ${dSombra ? `<path d="${dSombra}" fill="${alfa("#000000", 0.2)}"/>` : ""}`;
    };
  }
  var comum = { categoria: "cabelo", requerBase: HUMANOIDES, acabamento: "premium", raridade: "raro" };
  function afroClumps() {
    const dark = [], light = [];
    const major = [
      [96, 46, 9],
      [122, 40, 8],
      [146, 50, 8.5],
      [74, 66, 8],
      [104, 62, 7],
      [128, 66, 9],
      [156, 70, 7.5],
      [86, 88, 8.5],
      [116, 86, 7],
      [142, 90, 8],
      [72, 104, 7],
      [100, 108, 8],
      [134, 110, 7.5],
      [158, 100, 6.5],
      [92, 126, 7.5],
      [124, 128, 7],
      [150, 122, 6.5],
      [108, 142, 6.5],
      [136, 140, 6]
    ];
    const secondary = [
      [110, 52, 4],
      [138, 78, 4.5],
      [90, 74, 4],
      [128, 98, 4],
      [104, 120, 4],
      [146, 108, 3.6]
    ];
    const push = (arr2, litBias) => {
      for (const [x, y, s] of arr2) {
        const lit = x < 116 ? litBias + 0.5 : litBias;
        dark.push(`M${x - s + 1} ${y + s - 3} a ${s} ${s} 0 0 0 ${2 * s - 2} 1.5 a ${s + 1.5} ${s + 1.5} 0 0 1 ${-2 * s + 2} -3 z`);
        light.push(`M${x - s + 1.5} ${y - 1.5} a ${s - 1} ${s - 1} 0 0 1 ${2 * s - 4} ${-1 - lit} l -1.6 2.8 a ${s - 2.6} ${s - 2.6} 0 0 0 ${-2 * s + 7} ${1 + lit * 0.5} z`);
      }
    };
    push(major, 1);
    push(secondary, 0.3);
    return { dark, light };
  }
  var AFRO = afroClumps();
  function afroMassa() {
    const central = "M70 106 a 50 56 0 1 1 100 0 z";
    const lobos = [
      [120, 27, 18],
      [99, 32, 15],
      [143, 31, 16],
      [78, 46, 15],
      [161, 45, 15],
      [65, 70, 14],
      [176, 68, 14],
      [62, 93, 13],
      [178, 92, 13],
      [69, 105, 12],
      [172, 106, 12],
      [108, 24, 12],
      [152, 39, 11]
    ];
    const circ = ([x, y, r]) => `M${x - r} ${y} a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 ${-2 * r} 0 z`;
    return central + " " + lobos.map(circ).join(" ");
  }
  var AFRO_MASSA = afroMassa();
  var CABELOS_PREMIUM = [
    {
      ...comum,
      id: "cab_px_curto",
      nome: "Curto Premium",
      tema: "executivo",
      descricao: "Corte baixo texturizado — calota cheia, hairline masculina.",
      usaCores: ["cabelo"],
      render: cabeloPremium({
        // onda 1424 (Fase B §23): calota SÓLIDA fechada na hairline (~y86) —
        // sem vazado. Hairline masculina reta com entradas curtas; textura
        // por mechas curtas por cima.
        massa: "M72 88 c -4 -41 22 -61 48 -61 s 52 20 48 61 c -8 -6 -16 -9 -26 -10 c -1 -3 -2 -6 -2 -9 c -6 4 -13 6 -20 6 s -14 -2 -20 -6 c 0 3 -1 6 -2 9 c -10 1 -18 4 -26 10 z",
        sombraTesta: "M80 86 c 11 -7 26 -10 40 -10 s 29 3 40 10 c -2 4 -4 6 -8 7 c -9 -5 -20 -8 -32 -8 s -23 3 -32 8 c -4 -1 -6 -3 -8 -7 z",
        sombraInterna: "M74 84 c 0 -16 5 -29 14 -37 c -7 11 -10 24 -9 37 z",
        mechas: ["M84 68 q 12 -12 28 -13", "M112 52 q 12 -2 26 2", "M144 62 q 8 5 12 15", "M92 58 q 10 -6 20 -7", "M122 50 q 9 0 16 4", "M78 80 q 6 -10 14 -15"],
        fios: ["M70 82 q -3 -7 -1 -13", "M170 82 q 3 -7 1 -13", "M96 46 q 2 -5 6 -7"]
      })
    },
    {
      ...comum,
      id: "cab_px_franja",
      nome: "Franja Premium",
      tema: "casual",
      descricao: "Franja reta viva com sombra honesta na testa.",
      usaCores: ["cabelo"],
      render: cabeloPremium({
        massa: "M68 110 c -4 -42 22 -63 52 -63 s 56 21 52 63 c -2 -8 -5 -14 -9 -18 c 1 -6 1 -12 0 -17 c -6 8 -16 12 -27 12 h -32 c -11 0 -21 -4 -27 -12 c -1 5 -1 11 0 17 c -4 4 -7 10 -9 18 z",
        franja: "M88 66 c 8 -6 20 -9 32 -9 s 24 3 32 9 c 2 8 1 16 -3 22 c -3 -6 -6 -9 -10 -10 c 1 4 0 7 -2 9 c -5 -6 -11 -9 -17 -9 s -12 3 -17 9 c -2 -2 -3 -5 -2 -9 c -4 1 -7 4 -10 10 c -4 -6 -5 -14 -3 -22 z",
        sombraTesta: "M86 88 c 10 -5 22 -8 34 -8 s 24 3 34 8 c -1 4 -3 6 -6 8 c -8 -4 -18 -6 -28 -6 s -20 2 -28 6 c -3 -2 -5 -4 -6 -8 z",
        mechas: ["M96 60 q 4 8 2 16", "M120 57 q 0 9 0 17", "M144 60 q -4 8 -2 16", "M84 74 q 2 8 6 13"],
        fios: ["M67 100 q -2 -8 0 -14"]
      })
    },
    {
      ...comum,
      id: "cab_px_lateral",
      nome: "Lateral Premium",
      tema: "executivo",
      descricao: "Repartido de lado, volume cheio caindo p/ a direita.",
      usaCores: ["cabelo"],
      render: cabeloPremium({
        // onda 1424 (Fase B §23): calota SÓLIDA com risca lateral — antes
        // mostrava couro. Hairline mais baixa à esquerda (repartido).
        massa: "M68 110 c -4 -42 20 -63 52 -63 s 56 21 52 63 c -3 -18 -6 -28 -12 -35 c -8 6 -18 9 -30 9 c -6 0 -11 -1 -16 -3 c -2 4 -5 7 -9 9 c -6 3 -13 4 -20 5 c -3 5 -6 10 -9 16 z",
        franja: "M78 76 c 6 -12 18 -18 34 -18 c 12 0 22 4 30 11 c -6 -2 -12 -2 -18 -1 c -10 5 -22 9 -34 12 c -5 1 -9 -1 -12 -4 z",
        sombraTesta: "M80 88 c 12 -7 28 -10 42 -8 c -14 1 -28 5 -38 12 c -2 -1 -4 -2 -4 -4 z",
        sombraInterna: "M100 54 c -10 6 -18 15 -22 26 c 0 -14 8 -26 22 -30 z",
        mechas: ["M84 74 q 20 -14 42 -12", "M92 64 q 22 -8 40 -2", "M140 68 q 8 6 12 15", "M100 82 q 16 -6 32 -4"],
        fios: ["M66 100 q -3 -7 -1 -13", "M172 98 q 2 -6 0 -12"]
      })
    },
    {
      ...comum,
      id: "cab_px_undercut",
      nome: "Undercut Premium",
      tema: "urbano",
      descricao: "Bloco cheio no topo, laterais raspadas em meia-sombra.",
      usaCores: ["cabelo"],
      render: cabeloPremium({
        // onda 1424 (Fase B §23): TOPO cheio até a hairline (bloco sólido,
        // sem recuo) + laterais em meia-sombra. Fecha na testa ~y84.
        massa: "M76 86 c -4 -38 18 -55 44 -55 s 48 17 44 55 c -8 -6 -16 -9 -24 -10 c -1 -2 -1 -5 -1 -7 c -6 4 -12 6 -19 6 s -13 -2 -19 -6 c 0 2 0 5 -1 7 c -8 1 -16 4 -24 10 z",
        sombraTesta: "M84 84 c 10 -6 22 -9 36 -9 s 26 3 36 9 c -2 4 -4 6 -8 7 c -8 -4 -18 -7 -28 -7 s -20 3 -28 7 c -4 -1 -6 -3 -8 -7 z",
        // laterais raspadas: faixa de sombra suave nas têmporas (§urbano)
        sombraInterna: "M72 104 c 2 -12 6 -22 14 -28 c -6 3 -11 9 -13 17 c -1 4 -1 8 -1 11 z M168 104 c -2 -12 -6 -22 -14 -28 c 6 3 11 9 13 17 c 1 4 1 8 1 11 z",
        mechas: ["M92 62 q 14 -12 30 -12", "M122 48 q 12 0 20 7", "M96 74 q 8 -9 18 -11", "M118 54 q 12 0 20 5", "M84 68 q 8 -9 16 -12"],
        fios: ["M106 40 q 3 -5 8 -6", "M132 42 q 3 -4 7 -4"]
      })
    },
    {
      ...comum,
      id: "cab_px_longo_liso",
      nome: "Longo Liso Premium",
      tema: "clássico",
      raridade: "epico",
      descricao: "Cortina lisa com massa real caindo atrás dos ombros.",
      usaCores: ["cabelo", "destaque"],
      render: cabeloPremium({
        massa: "M66 132 c -6 -56 20 -80 54 -80 s 60 24 54 80 l -10 -6 c 2 -12 1 -24 -3 -33 c -7 9 -18 14 -31 14 h -20 c -13 0 -24 -5 -31 -14 c -4 9 -5 21 -3 33 z",
        sombraTesta: "M88 90 c 10 -6 21 -9 32 -9 s 22 3 32 9 c -2 4 -4 6 -7 7 c -7 -4 -16 -6 -25 -6 s -18 2 -25 6 c -3 -1 -5 -3 -7 -7 z",
        mechas: ["M80 80 q -4 24 -6 44", "M160 80 q 4 24 6 44", "M96 62 q -4 10 -5 22"],
        mechasDestaque: ["M104 58 q -2 14 -2 28"],
        fios: ["M64 120 q -3 -10 -2 -18", "M176 120 q 3 -10 2 -18"]
      }),
      // §44 LONGO LISO: queda RETA e sleeker, pontas arredondadas (não bloco).
      renderAtras: massaAtras("M74 100 c -10 42 -10 80 -2 106 c 5 6 14 5 18 -2 c -5 -32 -5 -68 1 -100 c 4 24 6 50 5 76 h 48 c -1 -26 1 -52 5 -76 c 6 32 6 68 1 100 c 4 7 13 8 18 2 c 8 -26 8 -64 -2 -106 z")
    },
    {
      ...comum,
      id: "cab_px_ondulado",
      nome: "Ondulado Premium",
      tema: "clássico",
      raridade: "epico",
      descricao: "Ondas em S com brilho alternado e queda viva.",
      usaCores: ["cabelo", "destaque"],
      render: cabeloPremium({
        massa: "M66 128 c -8 -52 18 -76 54 -76 s 62 24 54 76 c -4 -6 -8 -10 -12 -12 c 4 -10 3 -20 -2 -28 c -6 10 -17 15 -30 15 h -20 c -13 0 -24 -5 -30 -15 c -5 8 -6 18 -2 28 c -4 2 -8 6 -12 12 z",
        sombraTesta: "M88 88 c 10 -6 21 -8 32 -8 s 22 2 32 8 c -2 4 -4 6 -7 7 c -7 -4 -16 -5 -25 -5 s -18 1 -25 5 c -3 -1 -5 -3 -7 -7 z",
        mechas: ["M82 76 q -8 12 -2 24 q 6 12 -2 22", "M158 76 q 8 12 2 24 q -6 12 2 22", "M98 60 q -6 8 -2 16"],
        mechasDestaque: ["M142 62 q 6 9 2 18"],
        fios: ["M63 116 q -4 -8 -2 -16", "M177 116 q 4 -8 2 -16"]
      }),
      // §44 ONDULADO: silhueta externa mais LARGA e ONDULADA (não igual ao liso).
      renderAtras: massaAtras("M66 96 c -18 40 -20 82 -8 116 c 5 -5 7 -13 5 -21 c 5 9 5 19 1 28 c 6 3 13 1 17 -4 c -6 -12 -4 -26 2 -38 c -5 -26 -5 -54 3 -80 c 3 26 4 54 2 80 h 44 c -2 -26 -1 -54 2 -80 c 8 26 8 54 3 80 c 6 12 8 26 2 38 c 4 5 11 7 17 4 c -4 -9 -4 -19 1 -28 c -2 8 0 16 5 21 c 12 -34 10 -76 -8 -116 z")
    },
    {
      ...comum,
      id: "cab_px_rabo",
      nome: "Rabo de Cavalo Premium",
      tema: "gamer",
      descricao: "Preso alto e puxado, superfície lisa, rabo atrás.",
      usaCores: ["cabelo"],
      render: cabeloPremium({
        // onda 1424 (Fase B §23): topo SÓLIDO e liso (puxado p/ trás) — antes
        // era anel mostrando couro. Mechas horizontais dão o "penteado".
        massa: "M70 104 c -2 -38 20 -57 50 -57 s 52 19 50 57 c -3 -14 -6 -22 -12 -28 c -10 4 -22 6 -38 6 s -28 -2 -38 -6 c -6 6 -9 14 -12 28 z",
        sombraTesta: "M84 86 c 10 -6 22 -9 36 -9 s 26 3 36 9 c -2 4 -4 6 -7 7 c -8 -4 -18 -7 -29 -7 s -21 3 -29 7 c -3 -1 -5 -3 -7 -7 z",
        sombraInterna: "M74 96 c 2 -12 8 -22 18 -28 c -8 8 -13 18 -14 30 z",
        mechas: ["M80 78 q 40 -14 80 0", "M84 68 q 36 -12 72 0", "M90 58 q 30 -8 60 0", "M96 88 q 24 -6 48 0"],
        fios: ["M118 44 q 2 -5 6 -7", "M128 44 q 3 -4 7 -5"]
      }),
      renderAtras: massaAtras("M132 52 c 18 4 30 22 30 44 c 0 28 -10 54 -28 72 c 8 -24 12 -48 8 -70 c -3 12 -8 22 -16 30 c 8 -26 10 -52 -4 -70 c 4 -3 7 -5 10 -6 z")
    },
    {
      ...comum,
      id: "cab_px_coque",
      nome: "Coque Premium",
      tema: "executivo",
      descricao: "Coque alto polido com base torcida e brilho sedoso.",
      usaCores: ["cabelo"],
      render: cabeloPremium({
        massa: "M72 100 c -2 -32 18 -50 48 -50 s 50 18 48 50 c -2 -6 -5 -10 -9 -13 c 2 -18 -14 -27 -39 -27 s -41 9 -39 27 c -4 3 -7 7 -9 13 z M96 46 a 24 17 0 1 1 48 0 a 24 17 0 1 1 -48 0 z",
        sombraTesta: "M86 84 c 10 -5 21 -8 34 -8 s 24 3 34 8 c -2 4 -4 6 -7 7 c -8 -4 -17 -6 -27 -6 s -19 2 -27 6 c -3 -1 -5 -3 -7 -7 z",
        sombraInterna: "M100 46 a 20 13 0 0 0 12 12 a 26 15 0 0 1 -12 -12 z",
        mechas: ["M102 36 q 9 -5 20 -4", "M126 33 q 8 2 12 8", "M104 52 q 8 4 16 4"],
        fios: ["M94 40 q -4 -3 -5 -8", "M146 40 q 4 -3 5 -8"]
      })
    },
    {
      ...comum,
      id: "cab_px_afro",
      nome: "Afro Premium",
      tema: "urbano",
      raridade: "epico",
      descricao: "Coroa esférica CHEIA com borda em nuvem e luz pontilhada.",
      usaCores: ["cabelo"],
      render: cabeloPremium({
        // Golden V3.2 §18: silhueta CONSTRUÍDA pelos lobos (afroMassa) — borda
        // orgânica que sobe/desce/projeta/recua, não domo liso + decoração.
        massa: AFRO_MASSA,
        sombraTesta: "M82 92 c 12 -6 25 -9 38 -9 s 26 3 38 9 c -2 4 -5 6 -8 7 c -9 -4 -19 -6 -30 -6 s -21 2 -30 6 c -3 -1 -6 -3 -8 -7 z",
        // Golden V3 §40: CAMPO DE COILS autoral (não sheen) — quebra o "capacete".
        clumpsDark: AFRO.dark,
        clumpsLight: AFRO.light,
        luzClump: 0.2,
        mechas: []
      })
    },
    {
      ...comum,
      id: "cab_px_cacheado",
      nome: "Cacheado Premium",
      tema: "casual",
      descricao: "Cachos definidos quicando com brilho por anel.",
      usaCores: ["cabelo", "destaque"],
      render: cabeloPremium({
        massa: "M66 108 c -6 -44 18 -66 54 -66 s 60 22 54 66 c -3 -6 -6 -10 -10 -13 a 12 11 0 0 0 -8 -16 a 13 12 0 0 0 -14 -12 a 14 12 0 0 0 -22 -4 a 14 12 0 0 0 -22 4 a 13 12 0 0 0 -14 12 a 12 11 0 0 0 -8 16 c -4 3 -7 7 -10 13 z",
        sombraTesta: "M86 88 c 10 -6 21 -9 34 -9 s 24 3 34 9 c -2 4 -4 6 -7 7 c -8 -4 -17 -6 -27 -6 s -19 2 -27 6 c -3 -1 -5 -3 -7 -7 z",
        mechas: ["M88 64 a 8 8 0 0 1 10 -6", "M116 50 a 8 8 0 0 1 10 -2", "M146 60 a 8 8 0 0 1 8 6", "M76 84 a 8 8 0 0 1 6 -8"],
        mechasDestaque: ["M132 54 a 8 8 0 0 1 9 0"],
        fios: ["M64 100 q -3 -6 -2 -12", "M176 100 q 3 -6 2 -12"]
      })
    }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/fit.ts
  var FIT = {
    FITTED: { ombro: 1, peito: 2, cintura: 2, quadril: 2, seguirCintura: 1, drape: 0.1, nome: "Justo", desc: "Segue o corpo; cintura marcada (segunda pele)." },
    REGULAR: { ombro: 2, peito: 4, cintura: 6, quadril: 5, seguirCintura: 0.7, drape: 0.25, nome: "Regular", desc: "Folga natural; leve marcação de cintura." },
    RELAXED: { ombro: 3, peito: 7, cintura: 11, quadril: 9, seguirCintura: 0.4, drape: 0.45, nome: "Solto", desc: "Amplo e confortável; cintura suave." },
    OVERSIZED: { ombro: 6, peito: 12, cintura: 18, quadril: 14, seguirCintura: 0.15, drape: 0.7, nome: "Oversized", desc: "Volumoso; silhueta em caixa (streetwear)." },
    STRUCTURED: { ombro: 3, peito: 5, cintura: 9, quadril: 6, seguirCintura: 0.3, drape: 0.2, nome: "Estruturado", desc: "Alfaiataria; segura a forma independentemente do corpo." }
  };
  var lerp = (a, b, t) => a + (b - a) * t;
  function silhuetaFit(A, fit) {
    const e = FIT[fit] ?? FIT.REGULAR;
    const cinturaBase = lerp((A.peito + A.quadril) / 2, A.cintura, e.seguirCintura);
    return {
      ombroW: A.ombro + e.ombro,
      peitoW: A.peito + e.peito,
      cinturaW: cinturaBase + e.cintura,
      quadrilW: A.quadril + e.quadril,
      fit,
      ease: e
    };
  }

  // public/components/panels/panel-avatar-studio/src/engine/partes/premium/vestuario.ts
  var CLASSE_PECA = {
    camiseta: "REGULAR",
    camisa: "REGULAR",
    hoodie: "OVERSIZED",
    blazer: "STRUCTURED",
    polo: "REGULAR",
    colete: "FITTED",
    sobretudo: "RELAXED",
    gala: "STRUCTURED"
  };
  function largurasFit(A, classe, hand) {
    if (!flag("as6.fit_v2")) return hand;
    const s = silhuetaFit(A, classe);
    return { sh: s.ombroW, ch: s.peitoW, wa: s.cinturaW, hip: s.quadrilW };
  }
  var SOMBRA_PESCOCO3 = `<path d="M96 186 c 6 10 42 10 48 0 c -2 12 -46 12 -48 0 z" fill="rgba(0,0,0,0.25)"/>`;
  var sec = (p) => tintaPremium(p.secundario?.base ?? secundarioPadraoDe(p.roupa.base));
  function suave(pts) {
    const n = pts.length;
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d + " Z";
  }
  function mangaCurta(A, s, folgaOmb = 5, folga = 3) {
    const { cx, yOmb, yCot } = A;
    const shX = A.armSh, elX = A.armEl, yEnd = yOmb + (yCot - yOmb) * 0.55;
    const hu = A.braco + folgaOmb, he = A.braco + folga;
    const midX = shX + (elX - shX) * 0.55;
    return `M${cx + s * (shX - 3)} ${yOmb - 2}
    C ${cx + s * (shX + hu)} ${yOmb + 4} ${cx + s * (midX + he + 2)} ${yEnd - 8} ${cx + s * (midX + he)} ${yEnd}
    C ${cx + s * (midX + he - 1)} ${yEnd + 4} ${cx + s * (midX - he + 1)} ${yEnd + 4} ${cx + s * (midX - he)} ${yEnd}
    C ${cx + s * (midX - he)} ${yEnd - 10} ${cx + s * (shX - hu + 2)} ${yOmb + 6} ${cx + s * (shX - 4)} ${yOmb - 2} Z`;
  }
  function mangaLonga(A, s, folgaOmb = 5, folga = 3) {
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
  function pathCamisetaGolden(A) {
    const { cx, yOmb, yPei, yCin, yQua } = A;
    const { sh, ch, wa, hip } = largurasFit(A, CLASSE_PECA.camiseta, { sh: A.ombro + 2, ch: A.peito + 2, wa: A.cintura + 4, hip: A.quadril + 2 });
    const yHem = yQua + 12;
    const R2 = [[cx + 9, yOmb + 1], [cx + sh, yOmb + 4], [cx + ch, yPei + 3], [cx + wa + 0.8, yCin + 2], [cx + hip, yHem - 6], [cx + hip - 4, yHem]];
    const L = [[cx - hip + 4, yHem + 1], [cx - hip, yHem - 6], [cx - wa, yCin + 2], [cx - ch, yPei + 3], [cx - sh, yOmb + 4], [cx - 9, yOmb + 1]];
    return { torso: suave([...R2, ...L, [cx, yOmb + 7]]) };
  }
  function pathHoodieGolden(A) {
    const { cx, yOmb, yPei, yCin, yQua, yEnt } = A;
    const { sh, ch, wa, hip: hipW } = largurasFit(A, CLASSE_PECA.hoodie, { sh: A.ombro + 9, ch: A.peito + 10, wa: A.cintura + 8, hip: A.quadril + 3 });
    const hemW = hipW - 6;
    const dy = yOmb + 8;
    const yHem = yEnt + 5;
    const R2 = [[cx + 15, dy - 6], [cx + sh, dy + 1], [cx + ch, yPei + 10], [cx + wa, yCin + 8], [cx + hipW, yQua + 10], [cx + hemW, yHem]];
    const L = [[cx - hemW, yHem + 1], [cx - hipW, yQua + 10], [cx - wa, yCin + 8], [cx - ch, yPei + 10], [cx - sh, dy + 1], [cx - 15, dy - 6]];
    const torso = suave([...R2, ...L, [cx, dy - 2]]);
    const capuz = `M${cx - 25} ${yOmb + 3} C ${cx - 33} ${yOmb - 32} ${cx - 12} ${yOmb - 42} ${cx} ${yOmb - 42} C ${cx + 12} ${yOmb - 42} ${cx + 33} ${yOmb - 32} ${cx + 25} ${yOmb + 3} C ${cx + 13} ${yOmb - 9} ${cx - 13} ${yOmb - 9} ${cx - 25} ${yOmb + 3} Z`;
    return { torso, capuz, barraY: yHem - 8, hemW };
  }
  function pathBlazerGolden(A) {
    const { cx, yOmb, yPei, yCin, yQua, yEnt } = A;
    const { sh, ch, wa, hip } = largurasFit(A, CLASSE_PECA.blazer, { sh: A.ombro + 2, ch: A.peito + 1, wa: A.cintura - 2, hip: A.quadril + 4 });
    const yHem = yEnt;
    const R2 = [[cx + 11, yOmb - 2], [cx + sh, yOmb - 2], [cx + sh - 1, yPei - 8], [cx + ch, yPei + 4], [cx + wa, yCin + 2], [cx + hip, yQua + 10], [cx + hip - 5, yHem]];
    const L = [[cx - hip + 5, yHem + 1], [cx - hip, yQua + 10], [cx - wa, yCin + 2], [cx - ch, yPei + 4], [cx - sh + 1, yPei - 8], [cx - sh, yOmb - 2], [cx - 11, yOmb - 2]];
    return { torso: suave([...R2, ...L, [cx, yOmb + 3]]) };
  }
  function pathSobretudoGolden(A) {
    const { cx, yOmb, yPei, yCin, yQua } = A;
    const { sh, ch, wa, hip } = largurasFit(A, CLASSE_PECA.sobretudo, { sh: A.ombro + 4, ch: A.peito + 4, wa: A.cintura + 3, hip: A.quadril + 7 });
    const hemW = hip + 5;
    const yHem = 316;
    const R2 = [[cx + 12, yOmb - 1], [cx + sh, yOmb + 1], [cx + ch, yPei + 4], [cx + wa, yCin + 4], [cx + hip, yQua + 26], [cx + hemW, yHem]];
    const L = [[cx - hemW, yHem + 1], [cx - hip, yQua + 26], [cx - wa, yCin + 4], [cx - ch, yPei + 4], [cx - sh, yOmb + 1], [cx - 12, yOmb - 1]];
    const torso = suave([...R2, ...L, [cx, yOmb + 3]]);
    const gola = `M${cx - 15} ${yOmb - 1} C ${cx - 23} ${yOmb - 13} ${cx - 8} ${yOmb - 9} ${cx - 3} ${yOmb + 6} L ${cx - 1} ${yPei + 6} L ${cx + 1} ${yPei + 6} L ${cx + 3} ${yOmb + 6} C ${cx + 8} ${yOmb - 9} ${cx + 23} ${yOmb - 13} ${cx + 15} ${yOmb - 1} Z`;
    return { torso, gola, yHem };
  }
  function dobras(A, torso, u, o = { barra: 0 }, m) {
    const { cx, yOmb, yPei, yCin } = A;
    const clip = `${u}fold`;
    const w = o.w ?? A.peito, by = o.barra || A.yQua;
    const vales = [
      `M${cx - w + 8} ${yOmb + 5} C ${cx - 16} ${yPei - 6} ${cx - 10} ${yPei + 8} ${cx - 3} ${yCin - 2}`,
      `M${cx + w - 8} ${yOmb + 5} C ${cx + 16} ${yPei - 6} ${cx + 10} ${yPei + 8} ${cx + 3} ${yCin - 2}`,
      `M${cx - w * 0.6} ${yCin} C ${cx - 10} ${yCin + 6} ${cx + 10} ${yCin + 6} ${cx + w * 0.6} ${yCin}`,
      `M${cx - w * 0.5} ${by - 6} q ${w * 0.5} 8 ${w} 0`
    ];
    const cristas = [
      `M${cx - w + 12} ${yOmb + 7} C ${cx - 14} ${yPei - 4} ${cx - 8} ${yPei + 8} ${cx - 2} ${yCin - 2}`,
      `M${cx + w - 12} ${yOmb + 7} C ${cx + 14} ${yPei - 4} ${cx + 8} ${yPei + 8} ${cx + 2} ${yCin - 2}`
    ];
    const resp = m ? m.dobra(u, cristas, vales) : vales.map((d) => `<path d="${d}" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="4" stroke-linecap="round"/>`).join("") + cristas.map((d) => `<path d="${d}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2" stroke-linecap="round"/>`).join("");
    return `<defs><clipPath id="${clip}"><path d="${torso}"/></clipPath></defs><g clip-path="url(#${clip})">${resp}</g>`;
  }
  function dobrasManga(A, s) {
    const { cx, yCot } = A;
    const ex = A.armEl;
    return `<path d="M${cx + s * (ex - 4)} ${yCot - 4} q ${s * 8} 6 ${s * 4} 14" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  var ROUPAS_PREMIUM_1415 = [
    {
      id: "rou_px_camiseta",
      materialToken: "cotton",
      fitClass: CLASSE_PECA.camiseta,
      categoria: "roupa",
      nome: "Camiseta Premium",
      descricao: "Algodão com caimento real e gola viva.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["roupa", "destaque"],
      acabamento: "premium",
      render: (p, u) => {
        const alg = material2d("cotton", p.roupa.base);
        return `<defs>${alg.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${alg.fill(u)}"/>
      <path d="M104 186 q 16 14 32 0 q -4 12 -16 12 q -12 0 -16 -12 z" fill="${alg.tinta.escuro}"/>
      <path d="M106 188 q 14 11 28 0" stroke="${alfa(alg.tinta.brilho, 0.5)}" stroke-width="1.6" fill="none"/>
      <path d="M88 206 q 4 14 2 30 M152 206 q -4 14 -2 30" stroke="${alfa(alg.tinta.profundo, 0.4)}" stroke-width="1.6" fill="none"/>
      <circle cx="146" cy="226" r="3.4" fill="${p.destaque.base}"/>
      ${SOMBRA_PESCOCO3}`;
      },
      // §56 CAMISETA: manga curta, ombro suave, chest drape, cintura, barra.
      // Silhueta FITTED (a mais justa das 4).
      // §56 CAMISETA: FITTED (menor ease), manga curta, decote redondo, barra
      // na cintura. Veste a anatomia do perfil.
      renderCorpoV2: (p, u, perfil) => {
        const A = anatomiaCorpo(perfil);
        const m = material2d("cotton", p.roupa.base);
        const { torso } = pathCamisetaGolden(A);
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
      }
    },
    {
      id: "rou_px_camisa",
      materialToken: "cotton",
      categoria: "roupa",
      nome: "Camisa Premium",
      descricao: "Colarinho firme, botões e forro no punho.",
      raridade: "incomum",
      tema: "executivo",
      usaCores: ["roupa", "destaque", "secundario"],
      acabamento: "premium",
      render: (p, u) => {
        const alg = material2d("cotton", p.roupa.base);
        const forro = sec(p);
        return `<defs>${alg.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${alg.fill(u)}"/>
      <path d="M104 186 l 12 10 v 44 h -8 z M136 186 l -12 10 v 44 h 8 z" fill="${alg.tinta.claro}"/>
      <path d="M104 186 l 12 10 l -6 8 l -10 -10 z M136 186 l -12 10 l 6 8 l 10 -10 z" fill="${forro.base}"/>
      <path d="M120 198 v 42" stroke="${alfa(alg.tinta.profundo, 0.5)}" stroke-width="1.4"/>
      <circle cx="120" cy="208" r="1.5" fill="${forro.claro}"/><circle cx="120" cy="220" r="1.5" fill="${forro.claro}"/><circle cx="120" cy="232" r="1.5" fill="${forro.claro}"/>
      ${SOMBRA_PESCOCO3}`;
      }
    },
    {
      id: "rou_px_hoodie",
      materialToken: "wool",
      fitClass: CLASSE_PECA.hoodie,
      categoria: "roupa",
      nome: "Hoodie Premium",
      descricao: "Moletom com capuz de forro vivo e cordões.",
      raridade: "incomum",
      tema: "urbano",
      usaCores: ["roupa", "destaque", "secundario"],
      acabamento: "premium",
      render: (p, u) => {
        const mol = material2d("wool", p.roupa.base);
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
        const A = anatomiaCorpo(perfil);
        const m = material2d("wool", p.roupa.base);
        const forro = sec(p);
        const { cx, yOmb, yPei } = A;
        const { torso, capuz, barraY, hemW } = pathHoodieGolden(A);
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
      }
    },
    {
      id: "rou_px_blazer",
      materialToken: "wool",
      fitClass: CLASSE_PECA.blazer,
      categoria: "roupa",
      nome: "Blazer Premium",
      descricao: "Estrutura de ombro e forro de cetim — poder silencioso.",
      raridade: "raro",
      tema: "executivo",
      usaCores: ["roupa", "destaque", "secundario"],
      acabamento: "premium",
      render: (p, u) => {
        const la = material2d("wool", p.roupa.base);
        const forro = sec(p);
        return `<defs>${la.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${la.fill(u)}"/>
      <path d="M104 188 l 16 14 l 16 -14 v 52 h -32 z" fill="${forro.escuro}"/>
      <path d="M107 191 l 13 11 l 13 -11" stroke="${alfa(forro.brilho, 0.5)}" stroke-width="1.4" fill="none"/>
      <path d="M96 186 c 6 8 14 14 24 16 l -14 26 c -9 -12 -12 -27 -10 -42 z" fill="${la.tinta.profundo}"/>
      <path d="M144 186 c -6 8 -14 14 -24 16 l 14 26 c 9 -12 12 -27 10 -42 z" fill="${la.tinta.profundo}"/>
      <path d="M98 189 q 8 10 20 13 M142 189 q -8 10 -20 13" stroke="${alfa(la.tinta.brilho, 0.45)}" stroke-width="1.5" fill="none"/>
      <circle cx="118" cy="228" r="1.8" fill="${p.destaque.base}"/>
      ${SOMBRA_PESCOCO3}`;
      },
      // §60 BLAZER: ombro PADDED quadrado, lapela, chest taper, manga, cintura
      // marcada, abertura frontal. Silhueta ESTRUTURADA (ombros retos).
      // §60 BLAZER: ESTRUTURADO — ombro reto (padded), manga longa, cintura
      // marcada, lapela + abertura frontal com forro, botões.
      renderCorpoV2: (p, u, perfil) => {
        const A = anatomiaCorpo(perfil);
        const la = material2d("wool", p.roupa.base);
        const { cx, yOmb, yPei, yCin } = A;
        const yHem = A.yEnt;
        const { torso } = pathBlazerGolden(A);
        const sl = mangaLonga(A, -1, 5, 4) + mangaLonga(A, 1, 5, 4);
        const nk = 11;
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
          const yBtn = yCin + 4;
          const tie = tintaPremium(p.destaque.base);
          const lapela = (S) => `<path d="M${cx + S * 2} ${yOmb + 4}
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
        <path d="M${cx - 6} ${yOmb + 4} l 6 5 l 6 -5" fill="none" stroke="${alfa("#c7cdd6", 0.8)}" stroke-width="1"/>
        <!-- gravata AFUNILADA menor (não domina) -->
        <path d="M${cx - 3.4} ${yOmb + 8} L ${cx + 3.4} ${yOmb + 8} L ${cx + 2.6} ${yOmb + 14} L ${cx - 2.6} ${yOmb + 14} Z" fill="${tie.escuro}"/>
        <path d="M${cx - 2.6} ${yOmb + 14} L ${cx + 2.6} ${yOmb + 14} L ${cx + 4} ${yPei + 4} L ${cx} ${yBtn - 6} L ${cx - 4} ${yPei + 4} Z" fill="${tie.base}"/>
        <path d="M${cx - 1.2} ${yOmb + 10} l 0.8 2.4 l 1.6 -1.6 z" fill="${alfa("#ffffff", 0.25)}"/>
        <!-- lapelas roladas (tecido da jaqueta) -->
        ${lapela(-1)}${lapela(1)}
        <!-- colar por trás do pescoço (liga as duas lapelas) -->
        <path d="M${cx - 2} ${yOmb + 4} C ${cx - 8} ${yOmb - 4} ${cx - 13} ${yOmb - 2} ${cx - 13} ${yOmb + 2} C ${cx - 8} ${yOmb + 1} ${cx - 3} ${yOmb + 3} ${cx} ${yOmb + 5} C ${cx + 3} ${yOmb + 3} ${cx + 8} ${yOmb + 1} ${cx + 13} ${yOmb + 2} C ${cx + 13} ${yOmb - 2} ${cx + 8} ${yOmb - 4} ${cx + 2} ${yOmb + 4} Z" fill="${la.tinta.escuro}"/>
        <!-- fecho central (botão→barra) + botões -->
        <path d="M${cx} ${yBtn} L ${cx} ${yHem - 2}" stroke="${alfa(la.tinta.profundo, 0.55)}" stroke-width="1.2"/>
        <circle cx="${cx + 1}" cy="${yBtn}" r="1.7" fill="${la.tinta.brilho}"/><circle cx="${cx + 1}" cy="${yBtn + 16}" r="1.7" fill="${la.tinta.brilho}"/>`;
        })()}`;
      }
    },
    {
      id: "rou_px_polo",
      materialToken: "cotton",
      categoria: "roupa",
      nome: "Polo Premium",
      descricao: "Piquê com colarinho firme e botões de verdade.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["roupa", "destaque"],
      acabamento: "premium",
      render: (p, u) => {
        const alg = material2d("cotton", p.roupa.base);
        return `<defs>${alg.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${alg.fill(u)}"/>
      <path d="M102 186 l 12 8 l -3 10 l -12 -8 z M138 186 l -12 8 l 3 10 l 12 -8 z" fill="${alg.tinta.escuro}"/>
      <path d="M117 196 h 6 v 18 h -6 z" fill="${alg.tinta.meio}"/>
      <circle cx="120" cy="201" r="1.4" fill="${p.destaque.base}"/><circle cx="120" cy="208" r="1.4" fill="${p.destaque.base}"/>
      <path d="M98 214 q 22 6 44 0" stroke="${alfa(alg.tinta.brilho, 0.3)}" stroke-width="1.4" fill="none"/>
      <circle cx="142" cy="222" r="3" fill="${p.destaque.base}"/>
      ${SOMBRA_PESCOCO3}`;
      }
    },
    {
      id: "rou_px_colete",
      materialToken: "technical",
      categoria: "roupa",
      nome: "Colete Premium",
      descricao: "Acolchoado técnico sobre camada interna viva.",
      raridade: "incomum",
      tema: "urbano",
      usaCores: ["roupa", "destaque", "secundario"],
      acabamento: "premium",
      render: (p, u) => {
        const tec = material2d("technical", p.roupa.base);
        const interna = sec(p);
        return `<defs>${tec.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${interna.base}"/>
      <path d="M104 190 q -14 6 -16 26 l 2 24 h 22 l 2 -50 q -6 -2 -10 0 z M136 190 q 14 6 16 26 l -2 24 h -22 l -2 -50 q 6 -2 10 0 z" fill="${tec.fill(u)}"/>
      <path d="M94 206 h 20 M94 218 h 20 M126 206 h 20 M126 218 h 20" stroke="${alfa(tec.tinta.profundo, 0.5)}" stroke-width="1.4"/>
      <path d="M104 190 q 8 22 8 50 M136 190 q -8 22 -8 50" stroke="${alfa(tec.tinta.brilho, 0.4)}" stroke-width="1.4" fill="none"/>
      <path d="M117 196 q 3 22 3 44" stroke="${interna.claro}" stroke-width="1.2" fill="none"/>
      <circle cx="99" cy="228" r="2" fill="${p.destaque.base}"/>
      ${SOMBRA_PESCOCO3}`;
      }
    },
    {
      id: "rou_px_sobretudo",
      materialToken: "wool",
      fitClass: CLASSE_PECA.sobretudo,
      categoria: "roupa",
      nome: "Sobretudo Premium",
      descricao: "Lã longa com forro profundo e lapela alta.",
      raridade: "raro",
      tema: "clássico",
      usaCores: ["roupa", "destaque", "secundario"],
      acabamento: "premium",
      render: (p, u) => {
        const la = material2d("wool", p.roupa.base);
        const forro = sec(p);
        return `<defs>${la.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${la.fill(u)}"/>
      <path d="M102 186 l 18 18 l 18 -18 v 54 h -36 z" fill="${forro.escuro}"/>
      <path d="M102 186 c 4 10 10 16 18 18 l -16 30 c -7 -14 -9 -30 -2 -48 z" fill="${la.tinta.profundo}"/>
      <path d="M138 186 c -4 10 -10 16 -18 18 l 16 30 c 7 -14 9 -30 2 -48 z" fill="${la.tinta.profundo}"/>
      <path d="M104 189 q 8 12 16 15 M136 189 q -8 12 -16 15" stroke="${alfa(la.tinta.brilho, 0.4)}" stroke-width="1.5" fill="none"/>
      <path d="M112 226 h 4 M124 226 h 4" stroke="${p.destaque.base}" stroke-width="2.4" stroke-linecap="round"/>
      ${SOMBRA_PESCOCO3}`;
      },
      // §61 SOBRETUDO: LONGO de verdade (desce além do quadril ~y318), volume
      // próprio, lapela alta, abertura inferior/overlap, mangas longas.
      // §61 SOBRETUDO: LONGO (desce além do quadril ~y322), lapela alta, overlap
      // frontal, mangas longas. Ease médio; barra bem abaixo do quadril.
      renderCorpoV2: (p, u, perfil) => {
        const A = anatomiaCorpo(perfil);
        const la = material2d("wool", p.roupa.base);
        const forro = sec(p);
        const { cx, yOmb, yPei, yCin } = A;
        const { torso, gola, yHem } = pathSobretudoGolden(A);
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
      }
    },
    {
      id: "rou_px_gala",
      materialToken: "satin",
      categoria: "roupa",
      nome: "Gala Premium",
      descricao: "Cetim de noite com lapela de cerimônia.",
      raridade: "epico",
      tema: "clássico",
      usaCores: ["roupa", "destaque", "secundario"],
      acabamento: "premium",
      render: (p, u) => {
        const cet = material2d("satin", p.roupa.base);
        const lapela = sec(p);
        return `<defs>${cet.defs(u)}</defs>
      <path d="${PATH_OMBROS}" fill="${cet.fill(u)}"/>
      <path d="M106 188 l 14 12 l 14 -12 v 50 h -28 z" fill="#f6f7fb"/>
      <path d="M120 202 l -5 8 l 5 22 l 5 -22 z" fill="${cet.tinta.profundo}"/>
      <path d="M113 205 l 7 -7 l 7 7 l -7 5 z" fill="${p.destaque.base}"/>
      <path d="M98 186 c 5 8 12 14 22 16 l -13 26 c -9 -12 -12 -27 -9 -42 z" fill="${lapela.escuro}"/>
      <path d="M142 186 c -5 8 -12 14 -22 16 l 13 26 c 9 -12 12 -27 9 -42 z" fill="${lapela.escuro}"/>
      <path d="M100 189 q 9 11 20 13 M140 189 q -9 11 -20 13" stroke="${alfa(lapela.brilho, 0.55)}" stroke-width="1.4" fill="none"/>
      ${SOMBRA_PESCOCO3}`;
      }
    }
  ];
  var SOBREPECAS_PREMIUM = [
    {
      id: "sob_px_cardiga",
      materialToken: "wool",
      categoria: "roupa_sobre",
      nome: "Cardigã Premium",
      descricao: "Tricô aberto por cima de qualquer look.",
      raridade: "incomum",
      tema: "casual",
      usaCores: ["roupa", "secundario"],
      acabamento: "premium",
      render: (p, u) => {
        const tri = material2d("wool", p.roupa.base);
        return `<defs>${tri.defs(u)}</defs>
      <path d="M96 186 c 2 18 2 36 0 52 l 14 2 c 4 -18 5 -36 4 -52 c -7 -2 -13 -2 -18 -2 z" fill="${tri.fill(u)}"/>
      <path d="M144 186 c -2 18 -2 36 0 52 l -14 2 c -4 -18 -5 -36 -4 -52 c 7 -2 13 -2 18 -2 z" fill="${tri.fill(u)}"/>
      <path d="M100 192 q 2 24 0 42 M140 192 q -2 24 0 42" stroke="${alfa(tri.tinta.profundo, 0.45)}" stroke-width="1.4" fill="none"/>
      <path d="M107 194 q 2 22 1 42 M133 194 q -2 22 -1 42" stroke="${alfa(tri.tinta.brilho, 0.35)}" stroke-width="1.2" fill="none"/>`;
      }
    },
    {
      id: "sob_px_capa",
      materialToken: "satin",
      categoria: "roupa_sobre",
      nome: "Capa Premium",
      descricao: "Cai dos ombros com massa de verdade atrás.",
      raridade: "raro",
      tema: "fantasia",
      usaCores: ["roupa", "secundario"],
      acabamento: "premium",
      render: (p) => {
        const forro = sec(p);
        return `
      <path d="M92 186 l -6 10 q 10 6 20 6 l 2 -12 q -8 -3 -16 -4 z M148 186 l 6 10 q -10 6 -20 6 l -2 -12 q 8 -3 16 -4 z" fill="${forro.base}"/>
      <path d="M104 196 h 32 l -2 6 h -28 z" fill="${forro.escuro}"/>
      <circle cx="112" cy="199" r="1.8" fill="${forro.brilho}"/><circle cx="128" cy="199" r="1.8" fill="${forro.brilho}"/>`;
      },
      renderAtras: (p, u) => {
        const capa = material2d("satin", p.roupa.base);
        return `<defs>${capa.defs(u)}</defs>
      <path d="M78 190 q -14 60 6 108 q 36 12 72 0 q 20 -48 6 -108 q -42 -14 -84 0 z" fill="${capa.fill(u)}"/>
      <path d="M92 200 q -6 50 4 90 M148 200 q 6 50 -4 90" stroke="${alfa(capa.tinta.profundo, 0.4)}" stroke-width="2" fill="none"/>`;
      }
    }
  ];
  function pernas(fillRef, extra) {
    return `
    <path d="M90 206 h60 v16 h-60 z" fill="${fillRef}"/>
    <path d="M91 216 h26 l-3 114 c0 8 -20 8 -20 0 z" fill="${fillRef}"/>
    <path d="M123 216 h26 l-3 114 c0 8 -20 8 -20 0 z" fill="${fillRef}"/>${extra}`;
  }
  var comumRin = {
    categoria: "roupa_inferior",
    raridade: "comum",
    acabamento: "premium",
    usaCores: ["roupa", "destaque"],
    render: () => ""
    // busto intocado (byte-stability trivial — como slots corporais #154)
  };
  var ROUPAS_INFERIORES = [
    {
      ...comumRin,
      id: "rin_jeans",
      materialToken: "denim",
      nome: "Jeans Premium",
      tema: "casual",
      descricao: "Denim com costura viva e barra dobrada.",
      renderCorpo: (p, u) => {
        const dn = material2d("denim", p.roupa.base);
        return `<defs>${dn.defs(u)}</defs>${pernas(dn.fill(u), `
      <path d="M96 212 h 12 q 1 8 -2 12 M144 212 h -12 q -1 8 2 12" stroke="${alfa(dn.tinta.brilho, 0.5)}" stroke-width="1.4" fill="none"/>
      <path d="M104 222 q 2 52 0 100 M136 222 q -2 52 0 100" stroke="${p.destaque.base}" stroke-width="1.2" stroke-dasharray="3 3" fill="none"/>
      <path d="M93 318 h 22 M125 318 h 22" stroke="${alfa(dn.tinta.claro, 0.6)}" stroke-width="4"/>`)}`;
      }
    },
    {
      ...comumRin,
      id: "rin_social",
      materialToken: "wool",
      nome: "Calça Social Premium",
      tema: "executivo",
      descricao: "Vinco frontal e caimento de alfaiataria.",
      renderCorpo: (p, u) => {
        const la = material2d("wool", p.roupa.base);
        return `<defs>${la.defs(u)}</defs>${pernas(la.fill(u), `
      <path d="M104 222 l -2 106 M136 222 l 2 106" stroke="${alfa(la.tinta.brilho, 0.45)}" stroke-width="1.6" fill="none"/>
      <path d="M92 210 h 56" stroke="${alfa(la.tinta.profundo, 0.6)}" stroke-width="2"/>
      <rect x="116" y="208" width="8" height="5" rx="1.4" fill="${p.destaque.base}"/>`)}`;
      }
    },
    {
      ...comumRin,
      id: "rin_jogger",
      materialToken: "technical",
      nome: "Jogger Premium",
      tema: "urbano",
      descricao: "Técnica com punho na barra e faixa lateral.",
      renderCorpo: (p, u) => {
        const tec = material2d("technical", p.roupa.base);
        return `<defs>${tec.defs(u)}</defs>${pernas(tec.fill(u), `
      <path d="M94 218 q 4 56 8 106 M146 218 q -4 56 -8 106" stroke="${p.destaque.base}" stroke-width="2.6" fill="none"/>
      <path d="M96 320 h 18 q 2 6 -1 10 h -16 z M144 320 h -18 q -2 6 1 10 h 16 z" fill="${tec.tinta.profundo}"/>
      <path d="M110 214 q -2 4 -6 5" stroke="${alfa(tec.tinta.brilho, 0.6)}" stroke-width="1.6" fill="none"/>`)}`;
      }
    }
  ];
  var comumPes = {
    categoria: "acessorio",
    slot: "pes",
    raridade: "incomum",
    acabamento: "premium",
    usaCores: ["roupa", "destaque"],
    render: () => ""
    // busto intocado (contrato dos slots corporais #154)
  };
  var CALCADOS_PREMIUM = [
    {
      ...comumPes,
      id: "ace_px_tenis",
      materialToken: "technical",
      nome: "Tênis Premium",
      tema: "urbano",
      descricao: "Entressola dupla e cadarço com presença.",
      renderCorpo: (p, u) => {
        const tec = material2d("technical", p.roupa.base);
        return `<defs>${tec.defs(u)}</defs>
      <path d="M88 330 h 30 v 26 c 0 6 -4 10 -10 10 h -22 c -8 0 -10 -9 -2 -13 l 4 -3 z" fill="${tec.fill(u)}"/>
      <path d="M122 330 h 30 l 0 20 l 4 3 c 8 4 6 13 -2 13 h -22 c -6 0 -10 -4 -10 -10 z" fill="${tec.fill(u)}"/>
      <path d="M84 362 h 36 q 2 5 -1 8 h -34 q -4 -4 -1 -8 z M120 362 h 36 q 3 4 -1 8 h -34 q -3 -3 -1 -8 z" fill="#e8eaf2"/>
      <path d="M96 336 l 16 4 M100 342 l 12 3 M128 336 l 16 4 M132 342 l 12 3" stroke="${p.destaque.base}" stroke-width="2" stroke-linecap="round"/>
      <path d="M90 356 h 26 M124 356 h 26" stroke="${alfa(tec.tinta.brilho, 0.5)}" stroke-width="1.6"/>`;
      }
    },
    {
      ...comumPes,
      id: "ace_px_social",
      materialToken: "leather",
      nome: "Sapato Social Premium",
      tema: "executivo",
      descricao: "Couro polido com brilho de cera.",
      renderCorpo: (p, u) => {
        const couro = material2d("leather", p.roupa.base);
        return `<defs>${couro.defs(u)}</defs>
      <path d="M88 332 h 30 v 24 c 0 6 -4 10 -10 10 h -22 c -8 0 -10 -9 -2 -13 l 4 -3 z" fill="${couro.fill(u)}"/>
      <path d="M122 332 h 30 l 0 18 l 4 3 c 8 4 6 13 -2 13 h -22 c -6 0 -10 -4 -10 -10 z" fill="${couro.fill(u)}"/>
      <path d="M92 338 q 10 -3 22 0 M126 338 q 10 -3 22 0" stroke="${alfa("#ffffff", 0.35)}" stroke-width="2" fill="none"/>
      <path d="M86 364 h 32 M120 364 h 32" stroke="#12141c" stroke-width="4"/>
      <path d="M104 346 h 10 M138 346 h 10" stroke="${p.destaque.base}" stroke-width="1.6"/>`;
      }
    },
    {
      ...comumPes,
      id: "ace_px_bota",
      materialToken: "leather",
      nome: "Bota Premium",
      tema: "fantasia",
      descricao: "Cano alto com fivela e sola de trilha.",
      renderCorpo: (p, u) => {
        const couro = material2d("leather", p.roupa.base);
        return `<defs>${couro.defs(u)}</defs>
      <path d="M90 312 h 26 v 44 c 0 6 -4 10 -10 10 h -18 c -8 0 -10 -9 -2 -13 l 4 -3 z" fill="${couro.fill(u)}"/>
      <path d="M124 312 h 26 l 0 38 l 4 3 c 8 4 6 13 -2 13 h -18 c -6 0 -10 -4 -10 -10 z" fill="${couro.fill(u)}"/>
      <path d="M92 322 h 22 M126 322 h 22" stroke="${p.destaque.base}" stroke-width="2.4"/>
      <rect x="100" y="318" width="6" height="8" rx="1" fill="${p.destaque.claro}"/><rect x="134" y="318" width="6" height="8" rx="1" fill="${p.destaque.claro}"/>
      <path d="M84 364 h 36 q 2 6 -2 8 h -32 q -4 -3 -2 -8 z M120 364 h 36 q 2 6 -2 8 h -32 q -4 -3 -2 -8 z" fill="#12141c"/>
      <path d="M86 368 h 32 M122 368 h 32" stroke="${alfa(couro.tinta.brilho, 0.3)}" stroke-width="1.2" stroke-dasharray="4 3"/>`;
      }
    }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/partes/premium/acessorios.ts
  var OURO = tintaPremium("#c9a75a");
  var ACESSORIOS_PREMIUM = [
    {
      id: "ace_px_oculos",
      categoria: "acessorio",
      slot: "rosto",
      materialToken: "glass",
      nome: "Óculos Premium",
      descricao: "Lente com gradiente real e highlight de vidro.",
      raridade: "incomum",
      tema: "executivo",
      usaCores: ["destaque"],
      acabamento: "premium",
      render: (p, u) => `
      <defs><linearGradient id="${u}pxol" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stop-color="${alfa("#bfe3ff", 0.55)}"/><stop offset="0.5" stop-color="${alfa("#6b87b8", 0.35)}"/><stop offset="1" stop-color="${alfa("#20304e", 0.45)}"/>
      </linearGradient></defs>
      <rect x="86" y="99" width="28" height="19" rx="8" fill="url(#${u}pxol)" stroke="${p.destaque.base}" stroke-width="2.4"/>
      <rect x="126" y="99" width="28" height="19" rx="8" fill="url(#${u}pxol)" stroke="${p.destaque.base}" stroke-width="2.4"/>
      <path d="M114 106 h 12 M86 104 l -12 -3 M154 104 l 12 -3" stroke="${p.destaque.base}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M91 103 l 7 -2 M131 103 l 7 -2" stroke="${alfa("#ffffff", 0.75)}" stroke-width="1.8" stroke-linecap="round"/>`
    },
    {
      id: "ace_px_coroa",
      categoria: "acessorio",
      slot: "cabeca",
      materialToken: "metal",
      nome: "Coroa Premium",
      descricao: "Aro completo: frente em ouro vivo, arco de trás atrás do cabelo.",
      raridade: "raro",
      tema: "fantasia",
      usaCores: ["destaque"],
      acabamento: "premium",
      render: (p, u) => {
        const m = material2d("metal", "#c9a75a");
        return `<defs>${m.defs(u)}</defs>
      <path d="M84 56 l 8 -18 l 10 12 l 10 -16 l 8 14 l 8 -14 l 10 16 l 10 -12 l 8 18 q -36 12 -72 0 z" fill="${m.fill(u)}"/>
      <path d="M84 56 q 36 12 72 0 l 0 8 q -36 12 -72 0 z" fill="${OURO.escuro}"/>
      <circle cx="120" cy="42" r="3" fill="${p.destaque.base}"/><circle cx="98" cy="52" r="2" fill="${p.destaque.claro}"/><circle cx="142" cy="52" r="2" fill="${p.destaque.claro}"/>
      <path d="M88 54 l 6 -12" stroke="${alfa("#ffffff", 0.5)}" stroke-width="1.6" stroke-linecap="round"/>`;
      },
      renderAtras: () => `
      <path d="M86 58 a 40 16 0 0 1 68 0 l 0 6 a 40 16 0 0 0 -68 0 z" fill="${OURO.profundo}"/>
      <path d="M92 54 a 34 12 0 0 1 56 0" stroke="${alfa(OURO.claro, 0.5)}" stroke-width="1.6" fill="none"/>`
    },
    {
      id: "ace_px_colar",
      categoria: "acessorio",
      slot: "pescoco",
      materialToken: "metal",
      nome: "Colar Premium",
      descricao: "Elos com peso e pingente lapidado.",
      raridade: "incomum",
      tema: "clássico",
      usaCores: ["destaque"],
      acabamento: "premium",
      render: (p, u) => {
        const m = material2d("metal", p.destaque.base);
        return `<defs>${m.defs(u)}</defs>
      <path d="M100 192 q 20 18 40 0" stroke="${m.fill(u)}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M101 194 q 19 15 38 0" stroke="${alfa("#ffffff", 0.3)}" stroke-width="1.4" fill="none"/>
      <path d="M120 206 l -6 8 l 6 10 l 6 -10 z" fill="${m.fill(u)}"/>
      <path d="M120 208 l -3.6 6 l 3.6 6" stroke="${alfa("#ffffff", 0.5)}" stroke-width="1.2" fill="none"/>`;
      }
    },
    {
      id: "ace_px_mochila",
      categoria: "acessorio",
      slot: "costas",
      materialToken: "technical",
      nome: "Mochila Premium",
      descricao: "Corpo técnico atrás da figura, alças reais na frente.",
      raridade: "incomum",
      tema: "urbano",
      usaCores: ["roupa", "destaque"],
      acabamento: "premium",
      render: (p) => `
      <path d="M96 188 q -3 26 2 46 l 9 2 q -4 -24 -1 -44 z M144 188 q 3 26 -2 46 l -9 2 q 4 -24 1 -44 z" fill="${p.roupa.escuro}"/>
      <path d="M98 192 q -2 20 2 38 M142 192 q 2 20 -2 38" stroke="${p.destaque.base}" stroke-width="1.6" fill="none"/>
      <rect x="101" y="206" width="7" height="9" rx="1.6" fill="${p.destaque.escuro}"/><rect x="132" y="206" width="7" height="9" rx="1.6" fill="${p.destaque.escuro}"/>`,
      renderAtras: (p, u) => {
        const tec = material2d("technical", p.roupa.base);
        return `<defs>${tec.defs(u)}</defs>
      <rect x="76" y="176" width="88" height="64" rx="18" fill="${tec.fill(u)}"/>
      <rect x="86" y="188" width="68" height="20" rx="8" fill="${alfa(tec.tinta.profundo, 0.6)}"/>
      <path d="M86 224 h 68" stroke="${p.destaque.base}" stroke-width="2.4"/>
      <path d="M82 184 q -2 26 4 48" stroke="${alfa(tec.tinta.brilho, 0.4)}" stroke-width="1.8" fill="none"/>`;
      }
    },
    {
      id: "ace_px_asas",
      categoria: "acessorio",
      slot: "costas",
      materialToken: "emissive",
      nome: "Asas Premium",
      descricao: "Envergadura de energia em camadas atrás da figura.",
      raridade: "epico",
      tema: "fantasia",
      usaCores: ["destaque"],
      acabamento: "premium",
      lore: "Duas lâminas de luz que respondem à postura de quem as veste.",
      render: (p) => `
      <path d="M104 190 q -3 8 0 16 M136 190 q 3 8 0 16" stroke="${p.destaque.base}" stroke-width="3" stroke-linecap="round" fill="none"/>`,
      renderAtras: (p, u) => `
      <defs><linearGradient id="${u}pxasa" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.85)}"/><stop offset="1" stop-color="${alfa(p.destaque.escuro, 0.25)}"/>
      </linearGradient></defs>
      <g>
        <path d="M100 188 Q 40 150 22 96 Q 66 116 92 150 Q 76 116 68 78 Q 96 112 104 156 z" fill="url(#${u}pxasa)"/>
        <path d="M140 188 Q 200 150 218 96 Q 174 116 148 150 Q 164 116 172 78 Q 144 112 136 156 z" fill="url(#${u}pxasa)"/>
        <path d="M96 168 Q 60 140 44 108 M144 168 Q 180 140 196 108" stroke="${alfa("#ffffff", 0.35)}" stroke-width="1.6" fill="none"/>
        <animateTransform attributeName="transform" type="scale" additive="sum" values="1 1;1.015 0.99;1 1" dur="3.6s" repeatCount="indefinite"/>
      </g>`
    },
    {
      id: "ace_px_brinco",
      categoria: "acessorio",
      slot: "orelha",
      materialToken: "metal",
      nome: "Brinco Premium",
      descricao: "Argola dupla com gota de luz.",
      raridade: "comum",
      tema: "clássico",
      usaCores: ["destaque"],
      acabamento: "premium",
      render: (p) => `
      <circle cx="164" cy="124" r="5" fill="none" stroke="${OURO.base}" stroke-width="2"/>
      <circle cx="164" cy="131" r="2.6" fill="${p.destaque.base}"/>
      <path d="M161 121 a 5 5 0 0 1 4 -2" stroke="${alfa("#ffffff", 0.65)}" stroke-width="1.2" fill="none"/>`
    },
    {
      id: "ace_px_relogio",
      categoria: "acessorio",
      slot: "pulso_e",
      materialToken: "metal",
      nome: "Relógio Premium",
      descricao: "Caixa polida com mostrador vivo no pulso.",
      raridade: "incomum",
      tema: "executivo",
      usaCores: ["destaque"],
      acabamento: "premium",
      render: () => "",
      renderCorpo: (p, u) => {
        const m = material2d("metal", "#b8bcc8");
        return `<defs>${m.defs(u)}</defs>
      <path d="M62 180 h 20 v 9 h -20 z" fill="${p.destaque.escuro}"/>
      <circle cx="72" cy="184.5" r="8.5" fill="${m.fill(u)}" stroke="${p.destaque.base}" stroke-width="2"/>
      <circle cx="72" cy="184.5" r="5.4" fill="#141824"/>
      <path d="M72 184.5 l 0 -3.6 M72 184.5 l 2.6 1.6" stroke="${p.destaque.claro}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M66 180 a 8 8 0 0 1 5 -3" stroke="${alfa("#ffffff", 0.5)}" stroke-width="1.2" fill="none"/>`;
      }
    },
    {
      id: "ace_px_cetro",
      categoria: "acessorio",
      slot: "mao_d",
      materialToken: "metal",
      nome: "Cetro Premium",
      descricao: "Prop que encaixa na mão: haste de ouro e núcleo vivo.",
      raridade: "raro",
      tema: "fantasia",
      usaCores: ["destaque"],
      acabamento: "premium",
      render: () => "",
      renderCorpo: (p, u) => {
        const m = material2d("metal", "#c9a75a");
        return `<defs>${m.defs(u)}</defs>
      <path d="M166 186 l 16 -64" stroke="${m.fill(u)}" stroke-width="5" stroke-linecap="round"/>
      <path d="M167 184 l 14 -58" stroke="${alfa("#ffffff", 0.3)}" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="183" cy="116" r="9" fill="${p.destaque.base}"/>
      <circle cx="183" cy="116" r="9" fill="none" stroke="${OURO.claro}" stroke-width="2"/>
      <circle cx="180" cy="113" r="2.6" fill="${alfa("#ffffff", 0.7)}"/>
      <circle cx="166" cy="187" r="5.4" fill="${OURO.escuro}"/>`;
      }
    },
    {
      id: "ace_px_drone",
      categoria: "acessorio",
      slot: "flutuante",
      materialToken: "technical",
      nome: "Drone Premium",
      descricao: "Companheiro voador com bobbing real e olho vivo.",
      raridade: "raro",
      tema: "gamer",
      usaCores: ["destaque"],
      acabamento: "premium",
      render: (p, u) => {
        const tec = material2d("technical", "#3a4150");
        return `<defs>${tec.defs(u)}</defs>
      <g>
        <ellipse cx="196" cy="66" rx="16" ry="11" fill="${tec.fill(u)}"/>
        <circle cx="196" cy="66" r="5" fill="${p.destaque.base}">
          <animate attributeName="r" values="5;3.6;5" dur="2.8s" repeatCount="indefinite"/>
        </circle>
        <path d="M182 60 l -6 -4 M210 60 l 6 -4" stroke="${tec.tinta.claro}" stroke-width="2" stroke-linecap="round"/>
        <path d="M186 74 q 10 4 20 0" stroke="${alfa(p.destaque.base, 0.6)}" stroke-width="1.6" fill="none"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="3.2s" repeatCount="indefinite"/>
      </g>`;
      }
    },
    {
      id: "ace_px_gato",
      categoria: "acessorio",
      slot: "companheiro",
      materialToken: "wool",
      nome: "Gato Premium",
      descricao: "Companheiro de pelo denso com cauda que balança.",
      raridade: "raro",
      tema: "casual",
      usaCores: ["destaque"],
      acabamento: "premium",
      render: (p, u) => {
        const t = tintaPremium("#2c2f3a");
        return `
      <defs><linearGradient id="${u}pxgat" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${t.claro}"/><stop offset="1" stop-color="${t.profundo}"/>
      </linearGradient></defs>
      <g>
        <ellipse cx="42" cy="216" rx="17" ry="13" fill="url(#${u}pxgat)"/>
        <circle cx="42" cy="196" r="10" fill="url(#${u}pxgat)"/>
        <path d="M35 189 l -3 -8 l 7 4 z M49 189 l 3 -8 l -7 4 z" fill="${t.base}"/>
        <circle cx="38.5" cy="195" r="1.6" fill="${p.destaque.base}"/><circle cx="45.5" cy="195" r="1.6" fill="${p.destaque.base}"/>
        <path d="M40 200 q 2 1.6 4 0" stroke="${t.claro}" stroke-width="1" fill="none" stroke-linecap="round"/>
        <path d="M57 214 q 12 -6 10 -18" stroke="${t.base}" stroke-width="4" fill="none" stroke-linecap="round">
          <animate attributeName="d" values="M57 214 q 12 -6 10 -18;M57 214 q 14 -2 14 -14;M57 214 q 12 -6 10 -18" dur="4.2s" repeatCount="indefinite"/>
        </path>
        <path d="M30 210 q 10 -4 22 -1" stroke="${alfa("#ffffff", 0.14)}" stroke-width="1.6" fill="none"/>
      </g>`;
      }
    }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/partes/premium/ambiente.ts
  var sec2 = (p) => tintaPremium(p.secundario?.base ?? p.destaque.escuro);
  function fundoPlanos(far, mid, floor) {
    return `<g data-plano="far">${far}</g><g data-plano="mid">${mid}</g><g data-plano="floor">${floor}</g>`;
  }
  var comumFun = {
    categoria: "fundo",
    raridade: "raro",
    acabamento: "premium",
    usaCores: ["destaque", "secundario"]
  };
  var FUNDOS_PREMIUM = [
    {
      ...comumFun,
      id: "fun_px_estudio",
      nome: "Estúdio Premium",
      tema: "executivo",
      descricao: "BG01 — ciclorama com luz de recorte e piso refletivo.",
      // §87-89 STUDIO neutro: ciclorama + piso + contato + falloff + VIGNETTE por
      // valor + grounding. Sem anel/aura/HUD/partículas. Valor MENOR atrás do
      // rosto (§89) p/ não competir com olhos/cabelo/contorno.
      render: (_p, u) => {
        const t = tintaPremium("#232836");
        return `<defs>
        <linearGradient id="${u}pxbg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${t.base}"/><stop offset="0.5" stop-color="${t.meio}"/><stop offset="0.72" stop-color="${t.escuro}"/><stop offset="1" stop-color="${t.profundo}"/>
        </linearGradient>
        <radialGradient id="${u}pxbg1k" cx="0.32" cy="0.26" r="0.7">
          <stop offset="0" stop-color="${alfa("#ffffff", 0.1)}"/><stop offset="1" stop-color="${alfa("#ffffff", 0)}"/>
        </radialGradient>
        <radialGradient id="${u}pxbg1v" cx="0.5" cy="0.44" r="0.75">
          <stop offset="0.55" stop-color="${alfa("#000000", 0)}"/><stop offset="1" stop-color="${alfa("#05070d", 0.5)}"/>
        </radialGradient></defs>
      ${fundoPlanos(
          `<rect width="240" height="240" fill="url(#${u}pxbg1)"/><path d="M0 150 q 120 -30 240 0 v 90 h -240 z" fill="${alfa(t.profundo, 0.35)}"/><rect width="240" height="240" fill="url(#${u}pxbg1k)"/>`,
          `<path d="M0 176 q 120 -20 240 0 v 64 h -240 z" fill="${alfa(t.profundo, 0.85)}"/><path d="M0 176 q 120 -20 240 0" stroke="${alfa("#ffffff", 0.06)}" stroke-width="1.4" fill="none"/>`,
          // linha do piso
          `<ellipse cx="120" cy="228" rx="150" ry="26" fill="${alfa("#0b0e1a", 0.5)}"/><ellipse cx="120" cy="230" rx="70" ry="18" fill="${alfa("#ffffff", 0.04)}"/>`
        )}<rect width="240" height="240" fill="url(#${u}pxbg1v)"/>`;
      }
      // Golden V3 (#219): STUDIO QA neutro NÃO desenha nada na FRENTE do
      // personagem (o FG anterior — elipses + arco — atravessava a roupa e dava
      // aparência de transparência). BG + piso + contato bastam. FG vazio.
    },
    {
      ...comumFun,
      id: "fun_px_metropole",
      nome: "Metrópole Premium",
      tema: "urbano",
      descricao: "BG02 — skyline em três profundidades com janelas acesas.",
      render: (p, u) => {
        const t = tintaPremium("#1a2030");
        const s = sec2(p);
        return `<defs><linearGradient id="${u}pxbg2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${s.claro}"/><stop offset="0.55" stop-color="${t.base}"/><stop offset="1" stop-color="${t.profundo}"/>
      </linearGradient></defs>
      ${fundoPlanos(
          `<rect width="240" height="240" fill="url(#${u}pxbg2)"/><circle cx="184" cy="52" r="20" fill="${alfa("#f5efdf", 0.5)}"/>`,
          `<path d="M0 150 h 26 v -46 h 20 v 24 h 24 v -58 h 22 v 40 h 26 v -30 h 22 v 52 h 24 v -34 h 20 v 30 h 28 v -20 h 28 v 82 h -240 z" fill="${alfa(t.escuro, 0.9)}"/>
     <g fill="${alfa(p.destaque.base, 0.5)}"><rect x="30" y="112" width="4" height="5"/><rect x="76" y="76" width="4" height="5"/><rect x="118" y="128" width="4" height="5"/><rect x="164" y="120" width="4" height="5"/><rect x="206" y="146" width="4" height="5"/></g>`,
          `<rect y="196" width="240" height="44" fill="${t.profundo}"/><path d="M0 200 h 240" stroke="${alfa(p.destaque.base, 0.2)}" stroke-width="1.4"/>`
        )}`;
      },
      renderPlanos: {
        frente: (_p) => `<g data-plano="fg">
        <path d="M-4 238 l 40 -10 l 44 12 z" fill="${alfa("#0b0e1a", 0.5)}"/>
        <path d="M244 238 l -44 -9 l -40 11 z" fill="${alfa("#0b0e1a", 0.45)}"/>
      </g>`
      }
    },
    {
      ...comumFun,
      id: "fun_px_horizonte",
      nome: "Horizonte Premium",
      tema: "clássico",
      descricao: "BG03 — pôr do sol em camadas com colinas e névoa.",
      render: (p, u) => {
        const s = sec2(p);
        return `<defs><linearGradient id="${u}pxbg3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2c2440"/><stop offset="0.5" stop-color="#7a3d52"/><stop offset="0.78" stop-color="#c9744c"/><stop offset="1" stop-color="#e8b25e"/>
      </linearGradient></defs>
      ${fundoPlanos(
          `<rect width="240" height="240" fill="url(#${u}pxbg3)"/><circle cx="120" cy="150" r="26" fill="${alfa("#ffe9c4", 0.85)}"/>`,
          `<path d="M0 172 q 60 -26 120 -6 q 60 18 120 -8 v 82 h -240 z" fill="${alfa("#402a3c", 0.9)}"/>`,
          `<path d="M0 204 q 80 -16 240 -2 v 38 h -240 z" fill="#241826"/><path d="M0 196 q 120 -10 240 -4" stroke="${alfa(s.claro, 0.25)}" stroke-width="2" fill="none"/>`
        )}`;
      },
      renderPlanos: {
        frente: (_p) => `<g data-plano="fg"><path d="M0 228 q 120 -12 240 0 v 12 h -240 z" fill="${alfa("#120c16", 0.55)}"/></g>`
      }
    },
    {
      ...comumFun,
      id: "fun_px_neon",
      nome: "Beco Neon Premium",
      tema: "cyberpunk",
      descricao: "BG04 — profundidade de beco com letreiros e chuva de luz.",
      render: (p, u) => {
        const t = tintaPremium("#12141f");
        return `<defs><linearGradient id="${u}pxbg4" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${t.escuro}"/><stop offset="1" stop-color="${t.profundo}"/>
      </linearGradient></defs>
      ${fundoPlanos(
          `<rect width="240" height="240" fill="url(#${u}pxbg4)"/>`,
          `<path d="M8 40 v 160 M232 40 v 160" stroke="${alfa(t.claro, 0.3)}" stroke-width="3"/>
     <rect x="20" y="64" width="34" height="14" rx="3" fill="none" stroke="${p.destaque.base}" stroke-width="2"/>
     <rect x="186" y="96" width="34" height="14" rx="3" fill="none" stroke="${alfa(p.destaque.claro, 0.8)}" stroke-width="2"/>
     <path d="M24 106 h 26 M190 130 h 26" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="2"/>`,
          `<rect y="200" width="240" height="40" fill="#0b0d16"/><path d="M0 206 h 240" stroke="${alfa(p.destaque.base, 0.35)}" stroke-width="1.6"/><ellipse cx="120" cy="226" rx="80" ry="9" fill="${alfa(p.destaque.base, 0.08)}"/>`
        )}`;
      },
      renderPlanos: {
        frente: (p) => `<g data-plano="fg">
        <path d="M14 0 v 240 M226 6 v 234" stroke="${alfa(p.destaque.base, 0.08)}" stroke-width="6"/>
      </g>`
      }
    },
    {
      ...comumFun,
      id: "fun_px_biblioteca",
      nome: "Biblioteca Premium",
      tema: "clássico",
      descricao: "BG05 — estantes ao fundo, luz de abajur e poeira no ar.",
      render: (p, u) => {
        const t = tintaPremium("#2e2418");
        const s = sec2(p);
        return `<defs><linearGradient id="${u}pxbg5" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${t.claro}"/><stop offset="1" stop-color="${t.profundo}"/>
      </linearGradient></defs>
      ${fundoPlanos(
          `<rect width="240" height="240" fill="url(#${u}pxbg5)"/><radialGradient id="${u}pxbg5l" cx="0.72" cy="0.3" r="0.5"><stop offset="0" stop-color="${alfa("#ffd9a0", 0.3)}"/><stop offset="1" stop-color="${alfa("#ffd9a0", 0)}"/></radialGradient><rect width="240" height="240" fill="url(#${u}pxbg5l)"/>`,
          `<g fill="${alfa(t.escuro, 0.95)}"><rect x="10" y="46" width="70" height="150" rx="4"/><rect x="160" y="46" width="70" height="150" rx="4"/></g>
     <g stroke="${alfa(s.claro, 0.4)}" stroke-width="2"><path d="M16 76 h 58 M16 108 h 58 M16 140 h 58 M166 76 h 58 M166 108 h 58 M166 140 h 58"/></g>
     <g fill="${alfa(p.destaque.base, 0.4)}"><rect x="22" y="64" width="5" height="12"/><rect x="34" y="62" width="5" height="14"/><rect x="176" y="96" width="5" height="12"/><rect x="196" y="128" width="5" height="12"/></g>`,
          `<rect y="196" width="240" height="44" fill="#1a1208"/><path d="M0 200 h 240" stroke="${alfa("#ffd9a0", 0.18)}" stroke-width="1.4"/>`
        )}`;
      },
      renderPlanos: {
        frente: (_p) => `<g data-plano="fg" opacity="0.5">
        <circle cx="60" cy="80" r="1.2" fill="#ffe9c4"><animate attributeName="cy" values="80;74;80" dur="7s" repeatCount="indefinite"/></circle>
        <circle cx="180" cy="120" r="1" fill="#ffe9c4"><animate attributeName="cy" values="120;114;120" dur="9s" repeatCount="indefinite"/></circle>
        <circle cx="130" cy="60" r="0.8" fill="#ffe9c4"><animate attributeName="cy" values="60;66;60" dur="8s" repeatCount="indefinite"/></circle>
      </g>`
      }
    },
    {
      ...comumFun,
      id: "fun_px_nebulosa",
      nome: "Nebulosa Premium",
      tema: "espacial",
      descricao: "BG06 — véus cósmicos em três profundidades e poeira estelar.",
      render: (p, u) => {
        const s = sec2(p);
        return `<defs><radialGradient id="${u}pxbg6" cx="0.5" cy="0.42" r="0.9">
        <stop offset="0" stop-color="#241a4a"/><stop offset="0.6" stop-color="#141028"/><stop offset="1" stop-color="#0a0816"/>
      </radialGradient></defs>
      ${fundoPlanos(
          `<rect width="240" height="240" fill="url(#${u}pxbg6)"/><g fill="#e8ecff"><circle cx="36" cy="44" r="1.1"/><circle cx="204" cy="66" r="1.4"/><circle cx="88" cy="30" r="0.9"/><circle cx="168" cy="26" r="1"/><circle cx="220" cy="150" r="0.9"/><circle cx="20" cy="170" r="1.1"/></g>`,
          `<path d="M-10 96 q 70 -40 130 -6 q 62 34 130 -8 l 0 60 q -70 40 -130 8 q -62 -32 -130 6 z" fill="${alfa(p.destaque.base, 0.16)}"/>
     <path d="M-10 120 q 80 -30 250 -6" stroke="${alfa(s.claro, 0.3)}" stroke-width="2.4" fill="none"/>`,
          `<path d="M-10 190 q 90 -22 260 4 l 0 56 h -260 z" fill="${alfa("#08060f", 0.85)}"/>`
        )}`;
      },
      renderPlanos: {
        frente: (p) => `<g data-plano="fg" opacity="0.7">
        <circle cx="48" cy="200" r="1.4" fill="${p.destaque.claro}"><animate attributeName="opacity" values="0.9;0.3;0.9" dur="4s" repeatCount="indefinite"/></circle>
        <circle cx="198" cy="188" r="1.1" fill="${p.destaque.claro}"><animate attributeName="opacity" values="0.4;1;0.4" dur="5s" repeatCount="indefinite"/></circle>
      </g>`
      }
    }
  ];
  function auraMain(cor, corNucleo, anel) {
    return `<g data-nucleo="1" opacity="0.4"><ellipse cx="120" cy="120" rx="60" ry="68" fill="${alfa(corNucleo, 0.24)}"/></g>${anel}
    <ellipse cx="120" cy="120" rx="94" ry="102" fill="none" stroke="${alfa(cor, 0.26)}" stroke-width="1.5"/>`;
  }
  var comumAura = {
    categoria: "aura",
    raridade: "epico",
    acabamento: "premium",
    usaCores: ["destaque", "secundario"]
  };
  function glowAtras(u, cor) {
    return `<defs><radialGradient id="${u}pxag" cx="0.5" cy="0.5" r="0.6">
    <stop offset="0" stop-color="${alfa(cor, 0.4)}"/><stop offset="1" stop-color="${alfa(cor, 0)}"/>
  </radialGradient></defs><ellipse cx="120" cy="122" rx="112" ry="118" fill="url(#${u}pxag)"/>`;
  }
  var AURAS_PREMIUM = [
    {
      ...comumAura,
      id: "aur_px_fluxo",
      nome: "Aura de Fluxo Premium",
      tema: "tecnologia",
      descricao: "Corrente de energia com núcleo regulável e faíscas vivas.",
      lore: "Um circuito fechado entre intenção e execução.",
      render: (p) => auraMain(
        p.destaque.base,
        sec2(p).base,
        `<path d="M58 148 q 62 -64 124 0" stroke="${alfa(p.destaque.claro, 0.38)}" stroke-width="1.8" fill="none"><animate attributeName="opacity" values="0.5;0.24;0.5" dur="3.4s" repeatCount="indefinite"/></path>`
      ),
      renderAtras: (p, u) => glowAtras(u, p.destaque.base),
      renderFrente: (p) => `<g opacity="0.85">
      <circle cx="70" cy="176" r="2" fill="${p.destaque.claro}"><animate attributeName="cy" values="176;158;176" dur="3.8s" repeatCount="indefinite"/></circle>
      <circle cx="176" cy="168" r="1.6" fill="${p.destaque.claro}"><animate attributeName="cy" values="168;150;168" dur="4.6s" repeatCount="indefinite"/></circle>
    </g>`
    },
    {
      ...comumAura,
      id: "aur_px_cristal",
      nome: "Aura de Cristal Premium",
      tema: "fantasia",
      descricao: "Fragmentos lapidados orbitando com luz interna.",
      lore: "Cada face guarda um reflexo de quem a conquistou.",
      render: (p) => auraMain(
        p.destaque.base,
        sec2(p).claro,
        `<g fill="${alfa(p.destaque.claro, 0.7)}"><path d="M52 96 l 7 -12 l 7 12 l -7 12 z"/><path d="M180 84 l 6 -10 l 6 10 l -6 10 z"/><path d="M190 168 l 5 -9 l 5 9 l -5 9 z"/></g>`
      ),
      renderAtras: (p, u) => glowAtras(u, sec2(p).base),
      renderFrente: (p) => `<g opacity="0.8"><path d="M62 184 l 5 -8 l 5 8 l -5 8 z" fill="${alfa(p.destaque.claro, 0.75)}"><animateTransform attributeName="transform" type="translate" values="0 0;0 -8;0 0" dur="5s" repeatCount="indefinite"/></path></g>`
    },
    {
      ...comumAura,
      id: "aur_px_chama",
      nome: "Aura de Chama Premium",
      tema: "fantasia",
      descricao: "Labaredas com temperatura em dois tons e brasas subindo.",
      lore: "Não é fúria: é constância em alta temperatura.",
      render: (p) => auraMain(
        p.destaque.base,
        "#ff8a3d",
        `<path d="M60 168 q -10 -26 8 -44 q -2 20 12 28 q 2 -14 12 -20 q -2 24 10 34" stroke="${alfa("#ffb066", 0.65)}" stroke-width="2.6" fill="none"><animate attributeName="opacity" values="0.9;0.5;0.9" dur="2.6s" repeatCount="indefinite"/></path>
       <path d="M180 168 q 10 -26 -8 -44 q 2 20 -12 28 q -2 -14 -12 -20 q 2 24 -10 34" stroke="${alfa("#ffb066", 0.55)}" stroke-width="2.4" fill="none"><animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.9s" repeatCount="indefinite"/></path>`
      ),
      renderAtras: (_p, u) => glowAtras(u, "#ff7a3d"),
      renderFrente: () => `<g opacity="0.85">
      <circle cx="84" cy="188" r="1.8" fill="#ffb066"><animate attributeName="cy" values="188;164;188" dur="2.8s" repeatCount="indefinite"/></circle>
      <circle cx="160" cy="192" r="1.4" fill="#ff8a3d"><animate attributeName="cy" values="192;170;192" dur="3.4s" repeatCount="indefinite"/></circle>
    </g>`
    },
    {
      ...comumAura,
      id: "aur_px_estelar",
      nome: "Aura Estelar Premium",
      tema: "espacial",
      descricao: "Órbitas inclinadas com poeira de estrelas na frente.",
      lore: "Um sistema inteiro decidiu girar em volta de você.",
      render: (p) => auraMain(
        p.destaque.base,
        sec2(p).base,
        `<ellipse cx="120" cy="120" rx="98" ry="34" fill="none" stroke="${alfa(p.destaque.claro, 0.5)}" stroke-width="1.6" transform="rotate(-18 120 120)"/>
       <circle cx="30" cy="104" r="3" fill="${p.destaque.claro}"><animateTransform attributeName="transform" type="rotate" values="0 120 120;360 120 120" dur="12s" repeatCount="indefinite"/></circle>`
      ),
      renderAtras: (p, u) => glowAtras(u, p.destaque.base),
      renderFrente: (p) => `<g opacity="0.8">
      <circle cx="58" cy="196" r="1.2" fill="#e8ecff"><animate attributeName="opacity" values="1;0.3;1" dur="3.6s" repeatCount="indefinite"/></circle>
      <circle cx="186" cy="184" r="1.5" fill="${p.destaque.claro}"><animate attributeName="opacity" values="0.4;1;0.4" dur="4.4s" repeatCount="indefinite"/></circle>
    </g>`
    }
  ];
  var comumMol = {
    categoria: "moldura",
    raridade: "raro",
    acabamento: "premium",
    usaCores: ["destaque"]
  };
  var MOLDURAS_PREMIUM = [
    {
      ...comumMol,
      id: "mol_px_ouro",
      nome: "Moldura Ouro Premium",
      tema: "clássico",
      descricao: "Filete duplo de ouro com cantos lapidados.",
      render: (_p) => {
        const t = tintaPremium("#c9a75a");
        return `<rect x="5" y="5" width="230" height="230" rx="22" fill="none" stroke="${t.base}" stroke-width="4"/>
      <rect x="11" y="11" width="218" height="218" rx="18" fill="none" stroke="${alfa(t.claro, 0.6)}" stroke-width="1.6"/>
      <path d="M22 8 h 18 M8 22 v 18 M200 8 h 18 M232 22 v 18 M22 232 h 18 M8 200 v 18 M200 232 h 18 M232 200 v 18" stroke="${t.brilho}" stroke-width="2.4"/>`;
      }
    },
    {
      ...comumMol,
      id: "mol_px_holo",
      nome: "Moldura Holo Premium",
      tema: "tecnologia",
      descricao: "Aro holográfico com cantos vivos e varredura.",
      render: (p) => `<rect x="6" y="6" width="228" height="228" rx="24" fill="none" stroke="${alfa(p.destaque.base, 0.7)}" stroke-width="3" stroke-dasharray="46 18">
        <animate attributeName="stroke-dashoffset" values="0;64" dur="6s" repeatCount="indefinite"/>
      </rect>
      <path d="M20 6 h 26 M6 20 v 26 M194 6 h 26 M234 20 v 26 M20 234 h 26 M6 194 v 26 M194 234 h 26 M234 194 v 26" stroke="${p.destaque.claro}" stroke-width="3"/>`
    },
    {
      ...comumMol,
      id: "mol_px_laurel",
      nome: "Moldura Laurel Premium",
      tema: "clássico",
      descricao: "Ramos de louro nas laterais, vitória silenciosa.",
      render: (p) => {
        const t = tintaPremium("#7a8a4c");
        const folhas = (x, dir) => Array.from({ length: 6 }, (_, i) => `<path d="M${x} ${196 - i * 26} q ${10 * dir} -4 ${12 * dir} -14 q ${-12 * dir} 2 -12 14 z" fill="${i % 2 ? t.base : t.claro}"/>`).join("");
        return `<rect x="6" y="6" width="228" height="228" rx="24" fill="none" stroke="${alfa(t.escuro, 0.6)}" stroke-width="2"/>
      ${folhas(16, 1)}${folhas(224, -1)}
      <circle cx="120" cy="228" r="4" fill="${p.destaque.base}"/>`;
      }
    },
    {
      ...comumMol,
      id: "mol_px_eclipse",
      nome: "Moldura Eclipse Premium",
      tema: "espacial",
      descricao: "Anel de eclipse com corona no topo.",
      render: (p) => `<rect x="6" y="6" width="228" height="228" rx="116" fill="none" stroke="#12141f" stroke-width="6"/>
      <rect x="6" y="6" width="228" height="228" rx="116" fill="none" stroke="${alfa(p.destaque.base, 0.7)}" stroke-width="2.4"/>
      <path d="M64 14 a 118 118 0 0 1 112 0" stroke="${alfa(p.destaque.claro, 0.85)}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/sobrepecas.ts
  var CORPO_PARA_BUSTO = "translate(-18.588 35.412) scale(1.17647)";
  function wrapperBusto(renderCorpo) {
    return (p, u) => `<defs><clipPath id="${u}sobre"><rect x="0" y="176" width="240" height="64"/></clipPath></defs><g clip-path="url(#${u}sobre)"><g transform="${CORPO_PARA_BUSTO}">${renderCorpo(p, u)}</g></g>`;
  }
  var CURADORIA = [
    { origem: "rou_colete", id: "sob_colete", nome: "Colete de Missão", descricao: "Alças e bolsos táticos por cima de qualquer look." },
    { origem: "rou_jaqueta", id: "sob_jaqueta", nome: "Jaqueta Aberta", descricao: "Zíper e gola racer vestidos por cima da roupa." },
    { origem: "rou_kimono", id: "sob_kimono", nome: "Faixa do Dojo", descricao: "A faixa e o traspasse do kimono sobre o traje atual." },
    { origem: "rou_astronauta", id: "sob_orbital", nome: "Kit Orbital", descricao: "Colar de acople e painel de peito homologados p/ vácuo." }
  ];
  var SOBREPECAS = CURADORIA.flatMap((c) => {
    const origem = ROUPAS.find((r) => r.id === c.origem);
    if (!origem?.renderCorpo) return [];
    const renderCorpo = origem.renderCorpo;
    return [{
      id: c.id,
      categoria: "roupa_sobre",
      nome: c.nome,
      descricao: c.descricao,
      raridade: origem.raridade,
      tema: origem.tema,
      usaCores: origem.usaCores,
      incompativelCom: [c.origem],
      // §35: redundância visual com a origem
      render: wrapperBusto(renderCorpo),
      renderCorpo
      // corpo inteiro: mesmas coordenadas, entra direto
    }];
  });

  // public/components/panels/panel-avatar-studio/src/engine/partes/acessorios.ts
  var ACESSORIOS = [
    {
      id: "ace_brinco",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Brinco de Argola",
      descricao: "Detalhe dourado discreto na orelha.",
      raridade: "comum",
      tema: "casual",
      render: () => `
      <circle cx="170" cy="124" r="5" fill="none" stroke="#e8b64c" stroke-width="2.6"/>
      <circle cx="168.5" cy="121" r="1.2" fill="#fff3c9"/>`
    },
    {
      id: "ace_oculos",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Óculos de Grau",
      descricao: "Armação redonda de intelectual.",
      raridade: "comum",
      tema: "executivo",
      render: (_p, u) => `
      <defs>
        <linearGradient id="${u}lente" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa("#cfe0ff", 0.35)}"/>
          <stop offset="1" stop-color="${alfa("#cfe0ff", 0.08)}"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="108" r="15" fill="url(#${u}lente)" stroke="#20242e" stroke-width="3"/>
      <circle cx="140" cy="108" r="15" fill="url(#${u}lente)" stroke="#20242e" stroke-width="3"/>
      <path d="M115 106 q 5 -4 10 0" stroke="#20242e" stroke-width="3" fill="none"/>
      <line x1="85" y1="106" x2="72" y2="102" stroke="#20242e" stroke-width="3"/>
      <line x1="155" y1="106" x2="168" y2="102" stroke="#20242e" stroke-width="3"/>
      <path d="M92 100 a 15 15 0 0 1 8 -6" stroke="${alfa("#ffffff", 0.6)}" stroke-width="2" fill="none"/>`
    },
    {
      id: "ace_oculos_sol",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Óculos Escuros",
      descricao: "Deal fechado, sol na cara, estilo intacto.",
      raridade: "incomum",
      tema: "casual",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}sol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#262b38"/>
          <stop offset="1" stop-color="${p.destaque.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M84 98 h 32 a 5 5 0 0 1 5 5 v 6 a 12 12 0 0 1 -12 12 h -18 a 12 12 0 0 1 -12 -12 v -6 a 5 5 0 0 1 5 -5 z" fill="url(#${u}sol)" stroke="#14171f" stroke-width="2"/>
      <path d="M124 98 h 32 a 5 5 0 0 1 5 5 v 6 a 12 12 0 0 1 -12 12 h -18 a 12 12 0 0 1 -12 -12 v -6 a 5 5 0 0 1 5 -5 z" fill="url(#${u}sol)" stroke="#14171f" stroke-width="2"/>
      <path d="M116 103 h 8" stroke="#14171f" stroke-width="3"/>
      <line x1="79" y1="103" x2="70" y2="100" stroke="#14171f" stroke-width="3"/>
      <line x1="161" y1="103" x2="170" y2="100" stroke="#14171f" stroke-width="3"/>
      <path d="M88 102 l 20 14" stroke="${alfa("#ffffff", 0.22)}" stroke-width="4" stroke-linecap="round"/>
      <path d="M128 102 l 20 14" stroke="${alfa("#ffffff", 0.22)}" stroke-width="4" stroke-linecap="round"/>`
    },
    {
      id: "ace_fone",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Fone Minimal",
      descricao: "Headband slim para a playlist de foco.",
      raridade: "incomum",
      tema: "casual",
      usaCores: ["destaque"],
      render: (p) => `
      <path d="M66 108 c 0 -34 24 -54 54 -54 s 54 20 54 54" stroke="#20242e" stroke-width="7" fill="none" stroke-linecap="round"/>
      <rect x="58" y="100" width="16" height="26" rx="8" fill="#20242e"/>
      <rect x="166" y="100" width="16" height="26" rx="8" fill="#20242e"/>
      <rect x="62" y="106" width="8" height="14" rx="4" fill="${p.destaque.base}"/>
      <rect x="170" y="106" width="8" height="14" rx="4" fill="${p.destaque.base}"/>`
    },
    {
      id: "ace_bone",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Boné Snapback",
      descricao: "Aba reta com logo bordado.",
      raridade: "raro",
      tema: "casual",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}bone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.roupa.claro}"/>
          <stop offset="1" stop-color="${p.roupa.escuro}"/>
        </linearGradient>
      </defs>
      <path d="M70 92 c 0 -30 22 -46 50 -46 s 50 16 50 46 l -2 4 c -30 -10 -66 -10 -96 0 z" fill="url(#${u}bone)"/>
      <path d="M118 46 c 2 -6 6 -8 10 -6 c -2 2 -4 6 -4 8 z" fill="${p.roupa.escuro}"/>
      <path d="M166 90 h 30 a 6 6 0 0 1 6 6 c 0 4 -3 6 -8 6 l -30 -4 z" fill="${p.roupa.profundo}"/>
      <path d="M70 92 c 30 -10 66 -10 96 0 l 2 6 c -32 -10 -68 -10 -100 0 z" fill="${p.roupa.profundo}"/>
      <circle cx="120" cy="70" r="9" fill="${alfa("#000000", 0.25)}"/>
      <path d="M116 66 l 4 8 l 4 -8 m -8 4 h 8" stroke="${p.destaque.claro}" stroke-width="2" fill="none" stroke-linecap="round"/>`
    },
    {
      id: "ace_headset",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Headset Pro Gamer",
      descricao: "Conchas RGB com microfone articulado.",
      raridade: "epico",
      tema: "gamer",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}hs" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3a4152"/>
          <stop offset="1" stop-color="#161a24"/>
        </linearGradient>
      </defs>
      <path d="M62 110 c -2 -40 26 -62 58 -62 s 60 22 58 62" stroke="#161a24" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M64 108 c -2 -36 24 -56 56 -56" stroke="${alfa("#ffffff", 0.18)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="50" y="94" width="24" height="40" rx="12" fill="url(#${u}hs)"/>
      <rect x="166" y="94" width="24" height="40" rx="12" fill="url(#${u}hs)"/>
      <rect x="56" y="102" width="12" height="24" rx="6" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.8s" repeatCount="indefinite"/>
      </rect>
      <rect x="172" y="102" width="12" height="24" rx="6" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.8s" repeatCount="indefinite" begin="1.4s"/>
      </rect>
      <path d="M62 130 c 0 18 14 28 34 30" stroke="#161a24" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="102" cy="162" rx="8" ry="6" fill="#161a24"/>
      <circle cx="102" cy="162" r="2.4" fill="${p.destaque.claro}"/>`
    },
    {
      id: "ace_cachecol",
      categoria: "acessorio",
      slot: "pescoco",
      nome: "Cachecol",
      descricao: "Friozinho de ar-condicionado corporativo.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["destaque"],
      render: (p) => `
      <path d="M92 176 c 16 12 40 12 56 0 l 4 14 c -20 12 -44 12 -64 0 z" fill="${p.destaque.escuro}"/>
      <path d="M132 186 l 10 34 l 16 -6 l -12 -32 z" fill="${p.destaque.escuro}"/>
      <path d="M138 208 l 14 -5 m -12 -8 l 13 -5" stroke="${alfa("#000000", 0.25)}" stroke-width="2.4"/>
      <path d="M96 180 c 14 9 34 9 48 0" stroke="${alfa("#ffffff", 0.25)}" stroke-width="3" fill="none"/>`
    },
    {
      id: "ace_chapeu_mago",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Chapéu de Arquimago",
      descricao: "Conjura dashboards do nada. Nível 20 em SQL arcano.",
      raridade: "epico",
      tema: "fantasia",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}mag" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stop-color="${p.roupa.claro}"/>
          <stop offset="1" stop-color="${p.roupa.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M64 76 c 36 -14 76 -14 112 0 c 4 2 4 8 -2 9 c -36 8 -72 8 -108 0 c -6 -1 -6 -7 -2 -9 z" fill="url(#${u}mag)"/>
      <path d="M94 74 c 4 -28 16 -48 34 -58 c 2 -1 5 0 4 3 c -3 14 2 22 12 28 c 8 5 10 16 4 24 c -16 6 -38 7 -54 3 z" fill="url(#${u}mag)"/>
      <path d="M96 68 c 18 4 32 3 46 -2" stroke="${p.destaque.base}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M128 26 l 2.2 5 l 5.4 0.6 l -4 3.6 l 1.1 5.3 l -4.7 -2.8 l -4.7 2.8 l 1.1 -5.3 l -4 -3.6 l 5.4 -0.6 z" fill="${p.destaque.claro}">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.6s" repeatCount="indefinite"/>
      </path>`
    },
    {
      id: "ace_drone",
      categoria: "acessorio",
      slot: "pescoco",
      nome: "Drone Companion",
      descricao: "Segue você desde o unboxing. Nunca pediu férias.",
      raridade: "raro",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p) => `
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 -6; 0 0" dur="3.2s" repeatCount="indefinite"/>
        <ellipse cx="196" cy="64" rx="17" ry="11" fill="#2a3040"/>
        <ellipse cx="196" cy="61" rx="17" ry="8" fill="#3a4152"/>
        <circle cx="196" cy="64" r="5.5" fill="${p.destaque.base}">
          <animate attributeName="opacity" values="1;0.5;1" dur="1.6s" repeatCount="indefinite"/>
        </circle>
        <line x1="181" y1="56" x2="172" y2="50" stroke="#3a4152" stroke-width="3" stroke-linecap="round"/>
        <line x1="211" y1="56" x2="220" y2="50" stroke="#3a4152" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="170" cy="49" rx="7" ry="2.4" fill="${alfa(p.destaque.base, 0.55)}"/>
        <ellipse cx="222" cy="49" rx="7" ry="2.4" fill="${alfa(p.destaque.base, 0.55)}"/>
      </g>`
    },
    {
      id: "ace_medalha",
      categoria: "acessorio",
      slot: "pescoco",
      nome: "Medalha de Veterano",
      descricao: "30 dias de casa, cravados em bronze e fita.",
      raridade: "epico",
      tema: "conquista",
      usaCores: ["destaque"],
      bloqueadoPor: "conquista:veterano_30d",
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}med" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffd98a"/>
          <stop offset="1" stop-color="#b07d1e"/>
        </linearGradient>
      </defs>
      <path d="M96 186 l 10 24 l 8 -6 l -8 -22 z" fill="${p.destaque.base}"/>
      <path d="M116 182 l -6 26 l 9 2 l 7 -24 z" fill="${p.destaque.escuro}"/>
      <circle cx="112" cy="216" r="13" fill="url(#${u}med)" stroke="#8a5f10" stroke-width="1.6"/>
      <path d="M112 208 l 2.4 5 l 5.6 0.6 l -4.2 3.8 l 1.2 5.6 l -5 -3 l -5 3 l 1.2 -5.6 l -4.2 -3.8 l 5.6 -0.6 z" fill="#8a5f10"/>`
    },
    {
      id: "ace_gorro_natal",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Gorro de Natal",
      descricao: "Dezembro no dash também tem clima.",
      raridade: "raro",
      tema: "evento",
      bloqueadoPor: "evento:natal",
      render: (_p, u) => `
      <defs>
        <linearGradient id="${u}gn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e85555"/>
          <stop offset="1" stop-color="#a12a2a"/>
        </linearGradient>
      </defs>
      <path d="M70 82 c 4 -34 30 -50 56 -46 c 26 4 44 26 40 54 l -10 -4 c -26 -14 -58 -16 -86 -4 z" fill="url(#${u}gn)"/>
      <path d="M166 90 c 10 2 16 10 14 20 c -2 8 -12 12 -18 6 c -6 -6 -4 -18 4 -26 z" fill="url(#${u}gn)"/>
      <circle cx="172" cy="112" r="9" fill="#f6f3ec"/>
      <path d="M68 84 c 30 -13 62 -11 90 4 l -2 12 c -28 -14 -58 -16 -86 -4 z" fill="#f6f3ec"/>`
    },
    {
      id: "ace_chapeu_bruxa",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Chapéu de Bruxa",
      descricao: "Halloween chegou ao dashboard. Cuidado com as queries.",
      raridade: "raro",
      tema: "evento",
      usaCores: ["destaque"],
      bloqueadoPor: "evento:halloween",
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}bx" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stop-color="#3a3050"/>
          <stop offset="1" stop-color="#171226"/>
        </linearGradient>
      </defs>
      <path d="M60 80 c 40 -12 80 -12 120 0 c 5 2 5 8 -1 9 c -39 8 -79 8 -118 0 c -6 -1 -6 -7 -1 -9 z" fill="url(#${u}bx)"/>
      <path d="M92 78 c 2 -26 12 -46 30 -58 c 3 -2 6 0 5 3 c -4 16 4 24 12 32 c 8 8 8 18 0 25 c -15 5 -32 4 -47 -2 z" fill="url(#${u}bx)"/>
      <path d="M94 72 c 16 5 30 5 44 -1" stroke="${p.destaque.base}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <rect x="118" y="62" width="9" height="9" rx="2" fill="${p.destaque.claro}" transform="rotate(12 122 66)"/>`
    },
    {
      id: "ace_coroa",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Coroa do Top 1",
      descricao: "Ouro maciço para quem lidera o ranking.",
      raridade: "lendario",
      tema: "fantasia",
      render: (_p, u) => `
      <defs>
        <linearGradient id="${u}coroa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffe89a"/>
          <stop offset="0.5" stop-color="#e8b64c"/>
          <stop offset="1" stop-color="#b07d1e"/>
        </linearGradient>
      </defs>
      <path d="M86 58 l 8 -26 l 14 18 l 12 -24 l 12 24 l 14 -18 l 8 26 c -22 -8 -46 -8 -68 0 z" fill="url(#${u}coroa)" stroke="#8a5f10" stroke-width="1.6"/>
      <path d="M86 58 c 22 -8 46 -8 68 0 l -2 8 c -20 -7 -44 -7 -64 0 z" fill="#b07d1e"/>
      <circle cx="120" cy="34" r="4" fill="#ff5f8f"/>
      <circle cx="97" cy="40" r="3" fill="#4cd9e8"/>
      <circle cx="143" cy="40" r="3" fill="#4cd9e8"/>
      <circle cx="120" cy="33" r="1.4" fill="#ffffff" opacity="0.9"/>`
    },
    // ── 4.6 F2 · Onda 2 — 12 acessórios novos (4 por slot) ────────────
    {
      id: "ace_boina",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Boina",
      descricao: "Direção de arte no ponto exato.",
      raridade: "incomum",
      tema: "clássico",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}boi" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stop-color="${p.destaque.claro}"/>
          <stop offset="1" stop-color="${p.destaque.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M70 78 c -2 -26 24 -38 52 -36 c 30 2 50 16 46 38 c -2 10 -12 12 -24 10 c -26 -6 -52 -6 -66 -2 c -6 2 -8 -4 -8 -10 z" fill="url(#${u}boi)"/>
      <circle cx="122" cy="40" r="4" fill="${p.destaque.profundo}"/>
      <path d="M74 86 c 18 -6 48 -6 66 0" stroke="${alfa("#000000", 0.25)}" stroke-width="3" fill="none"/>`
    },
    {
      id: "ace_viseira_vr",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Headset VR",
      descricao: "Metade aqui, metade no metaverso da Dshow.",
      raridade: "epico",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}vr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3a4054"/>
          <stop offset="1" stop-color="#171b28"/>
        </linearGradient>
      </defs>
      <path d="M66 92 h 108 a 10 10 0 0 1 10 10 v 14 a 10 10 0 0 1 -10 10 h -30 c -8 -8 -40 -8 -48 0 h -30 a 10 10 0 0 1 -10 -10 v -14 a 10 10 0 0 1 10 -10 z" fill="url(#${u}vr)" stroke="#0c0f18" stroke-width="2"/>
      <path d="M72 100 h 96 v 10 h -96 z" fill="${alfa(p.destaque.base, 0.5)}" rx="4">
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.4s" repeatCount="indefinite"/>
      </path>
      <path d="M66 98 a 50 57 0 0 0 -8 12 M174 98 a 50 57 0 0 1 8 12" stroke="#171b28" stroke-width="6" fill="none"/>
      <circle cx="170" cy="98" r="3" fill="${p.destaque.base}"/>`
    },
    {
      id: "ace_chifres_oni",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Chifres de Oni",
      descricao: "O lado lendário do dojo desperta.",
      raridade: "epico",
      tema: "fantasia",
      render: (_p, u) => `
      <defs>
        <linearGradient id="${u}oni" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#7a2d3c"/>
          <stop offset="1" stop-color="#ffb54d"/>
        </linearGradient>
      </defs>
      <path d="M88 64 c -8 -12 -10 -26 -4 -38 c 10 8 16 20 16 32 z" fill="url(#${u}oni)" stroke="#5a1f2c" stroke-width="1.6"/>
      <path d="M152 64 c 8 -12 10 -26 4 -38 c -10 8 -16 20 -16 32 z" fill="url(#${u}oni)" stroke="#5a1f2c" stroke-width="1.6"/>
      <path d="M90 52 c -3 -8 -3 -16 0 -22 M150 52 c 3 -8 3 -16 0 -22" stroke="${alfa("#ffffff", 0.35)}" stroke-width="2" fill="none" stroke-linecap="round"/>`
    },
    {
      id: "ace_tiara_led",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Tiara LED",
      descricao: "Arco de luz fria sobre o cabelo.",
      raridade: "raro",
      tema: "cyberpunk",
      usaCores: ["destaque"],
      render: (p) => `
      <path d="M72 84 a 52 50 0 0 1 96 0" stroke="#20242e" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M72 84 a 52 50 0 0 1 96 0" stroke="${p.destaque.base}" stroke-width="3" fill="none" stroke-linecap="round">
        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
      </path>
      <circle cx="72" cy="84" r="4.4" fill="${p.destaque.base}"/>
      <circle cx="168" cy="84" r="4.4" fill="${p.destaque.base}"/>`
    },
    {
      id: "ace_monoculo",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Monóculo",
      descricao: "Analisa o relatório com um só olho — e razão.",
      raridade: "raro",
      tema: "clássico",
      render: (_p, u) => `
      <defs>
        <linearGradient id="${u}mono" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa("#cfe0ff", 0.4)}"/>
          <stop offset="1" stop-color="${alfa("#cfe0ff", 0.1)}"/>
        </linearGradient>
      </defs>
      <circle cx="140" cy="108" r="16" fill="url(#${u}mono)" stroke="#e8b64c" stroke-width="3"/>
      <path d="M152 120 q 10 14 6 30" stroke="#e8b64c" stroke-width="2" fill="none"/>
      <circle cx="158" cy="152" r="3" fill="#e8b64c"/>
      <path d="M131 100 a 16 16 0 0 1 9 -7" stroke="${alfa("#ffffff", 0.6)}" stroke-width="2" fill="none"/>`
    },
    {
      id: "ace_pintura_guerra",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Pintura de Guerra",
      descricao: "Três riscos: foco, meta e vitória.",
      raridade: "incomum",
      tema: "esportivo",
      usaCores: ["destaque"],
      render: (p) => `
      <path d="M82 116 l 14 4 M82 124 l 14 4" stroke="${p.destaque.base}" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
      <path d="M158 116 l -14 4 M158 124 l -14 4" stroke="${p.destaque.base}" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
      <path d="M116 130 l 8 3" stroke="${alfa(p.destaque.base, 0.6)}" stroke-width="3" stroke-linecap="round"/>`
    },
    {
      id: "ace_piercing",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Piercing",
      descricao: "Detalhe de aço na sobrancelha.",
      raridade: "comum",
      tema: "urbano",
      render: () => `
      <circle cx="150" cy="92" r="2.6" fill="none" stroke="#c4c9d6" stroke-width="1.8"/>
      <circle cx="145" cy="94" r="1.6" fill="#c4c9d6"/>
      <circle cx="149" cy="91" r="0.8" fill="#ffffff"/>`
    },
    {
      id: "ace_oculos_3d",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Óculos Retrô 3D",
      descricao: "O cinema em casa de 1989 aprova.",
      raridade: "raro",
      tema: "gamer",
      render: () => `
      <path d="M78 96 h 84 v 24 a 6 6 0 0 1 -6 6 h -28 l -8 -8 l -8 8 h -28 a 6 6 0 0 1 -6 -6 z" fill="#f4f0e6" stroke="#d8d2c2" stroke-width="2"/>
      <rect x="85" y="102" width="30" height="17" rx="3" fill="#ff4d5e" opacity="0.8"/>
      <rect x="125" y="102" width="30" height="17" rx="3" fill="#3aa0ff" opacity="0.8"/>
      <line x1="78" y1="102" x2="68" y2="100" stroke="#f4f0e6" stroke-width="4"/>
      <line x1="162" y1="102" x2="172" y2="100" stroke="#f4f0e6" stroke-width="4"/>`
    },
    {
      id: "ace_corrente",
      categoria: "acessorio",
      slot: "pescoco",
      nome: "Corrente Dourada",
      descricao: "Elo por elo, cada meta batida.",
      raridade: "raro",
      tema: "urbano",
      render: () => {
        let elos = "";
        for (let i = 0; i < 9; i++) {
          const t = i / 8;
          const x = 88 + t * 64;
          const y = 196 + Math.sin(t * Math.PI) * 22;
          elos += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="none" stroke="#e8b64c" stroke-width="2.6"/>`;
        }
        return `${elos}<circle cx="120" cy="220" r="6.4" fill="#e8b64c" stroke="#b07d1e" stroke-width="1.6"/>
      <path d="M118 218 l 2 -3 l 2 3 l -2 3 z" fill="#fff3c9"/>`;
      }
    },
    {
      id: "ace_capa_heroica",
      categoria: "acessorio",
      slot: "pescoco",
      nome: "Capa Heroica",
      descricao: "Esvoaça mesmo sem vento — questão de atitude.",
      raridade: "lendario",
      bloqueadoPor: "conquista:explorador_60",
      tema: "fantasia",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}capa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.destaque.base}"/>
          <stop offset="1" stop-color="${p.destaque.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M60 196 c -10 14 -16 30 -14 44 l 26 0 c -6 -16 -6 -30 0 -40 z" fill="url(#${u}capa)">
        <animateTransform attributeName="transform" type="rotate" values="0 66 200;-3 66 200;0 66 200" dur="3.2s" repeatCount="indefinite"/>
      </path>
      <path d="M180 196 c 10 14 16 30 14 44 l -26 0 c 6 -16 6 -30 0 -40 z" fill="url(#${u}capa)">
        <animateTransform attributeName="transform" type="rotate" values="0 174 200;3 174 200;0 174 200" dur="3.2s" repeatCount="indefinite"/>
      </path>
      <path d="M74 200 q 46 -22 92 0 l -4 8 q -42 -18 -84 0 z" fill="${p.destaque.profundo}"/>
      <circle cx="94" cy="200" r="3.4" fill="#e8b64c"/>
      <circle cx="146" cy="200" r="3.4" fill="#e8b64c"/>`
    },
    {
      id: "ace_lenco_bandana",
      categoria: "acessorio",
      slot: "pescoco",
      nome: "Lenço Bandana",
      descricao: "Nó frouxo, espírito de estrada.",
      raridade: "incomum",
      tema: "aventura",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.destaque.claro}"/>
          <stop offset="1" stop-color="${p.destaque.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M88 192 q 32 20 64 0 l -6 16 q -26 14 -52 0 z" fill="url(#${u}band)"/>
      <path d="M112 206 l -10 22 l 12 -6 l 4 10 l 8 -24 z" fill="url(#${u}band)"/>
      <path d="M92 196 q 28 16 56 0" stroke="${alfa("#ffffff", 0.25)}" stroke-width="2" fill="none"/>
      <circle cx="100" cy="200" r="1.6" fill="${alfa("#ffffff", 0.5)}"/>
      <circle cx="126" cy="205" r="1.6" fill="${alfa("#ffffff", 0.5)}"/>
      <circle cx="142" cy="199" r="1.6" fill="${alfa("#ffffff", 0.5)}"/>`
    },
    {
      id: "ace_cracha_dshow",
      categoria: "acessorio",
      slot: "pescoco",
      nome: "Crachá Dshow",
      descricao: "Acesso liberado a todos os andares da casa.",
      raridade: "exclusivo",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p) => `
      <path d="M104 186 l 14 26 M136 186 l -14 26" stroke="#20242e" stroke-width="3"/>
      <rect x="106" y="210" width="28" height="20" rx="4" fill="#f4f6fb" stroke="#c9d0dd" stroke-width="1.4"/>
      <rect x="106" y="210" width="28" height="6" rx="3" fill="${p.destaque.base}"/>
      <circle cx="113" cy="222" r="3" fill="#c9d0dd"/>
      <path d="M119 220 h 11 M119 224 h 8" stroke="#8b93a7" stroke-width="1.6" stroke-linecap="round"/>`
    },
    // ── 4.6 F2 · Onda 5 — 5 acessórios novos (meta §28: 30 ✓) ─────────
    {
      id: "ace_antena",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Antena Retrô",
      descricao: "Sintonia fina com frequências que ninguém mais ouve.",
      raridade: "incomum",
      tema: "sci-fi",
      usaCores: ["destaque"],
      render: (p) => `
      <path d="M150 56 q 14 -18 8 -34" stroke="#5a6274" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <circle cx="158" cy="20" r="5" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite"/>
      </circle>
      <circle cx="158" cy="20" r="9" fill="none" stroke="${alfa(p.destaque.base, 0.45)}" stroke-width="1.6">
        <animate attributeName="r" values="7;12;7" dur="1.6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite"/>
      </circle>
      <circle cx="149" cy="57" r="4" fill="#5a6274"/>`
    },
    {
      id: "ace_tapa_olho",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Tapa-olho",
      descricao: "Perdeu a aposta do sprint. Ganhou personalidade.",
      raridade: "raro",
      tema: "aventura",
      render: () => `
      <path d="M62 96 q 58 -22 116 6" stroke="#14100c" stroke-width="3.4" fill="none"/>
      <path d="M126 96 a 15 13 0 0 1 28 4 a 15 13 0 0 1 -28 -4 z" fill="#14100c"/>
      <path d="M130 98 a 11 9 0 0 1 12 -3" stroke="rgba(255,255,255,0.18)" stroke-width="2" fill="none"/>`
    },
    {
      id: "ace_colar_perolas",
      categoria: "acessorio",
      slot: "pescoco",
      nome: "Colar de Pérolas",
      descricao: "Clássico absoluto — combina até com moletom.",
      raridade: "raro",
      tema: "clássico",
      render: () => {
        let perolas = "";
        for (let i = 0; i < 11; i++) {
          const t = i / 10;
          const x = 92 + t * 56;
          const y = 194 + Math.sin(t * Math.PI) * 16;
          perolas += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6" fill="#f2ecf4" stroke="#c9bfd0" stroke-width="0.8"/>
        <circle cx="${(x - 1).toFixed(1)}" cy="${(y - 1.2).toFixed(1)}" r="1" fill="#ffffff"/>`;
        }
        return perolas;
      }
    },
    {
      id: "ace_mochila_jato",
      categoria: "acessorio",
      slot: "pescoco",
      nome: "Mochila a Jato",
      descricao: "Para reuniões em prédios diferentes com 5 min de intervalo.",
      raridade: "epico",
      tema: "sci-fi",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}jato" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4a5266"/>
          <stop offset="1" stop-color="#20242e"/>
        </linearGradient>
      </defs>
      <rect x="52" y="186" width="22" height="40" rx="9" fill="url(#${u}jato)" stroke="#14171f" stroke-width="2"/>
      <rect x="166" y="186" width="22" height="40" rx="9" fill="url(#${u}jato)" stroke="#14171f" stroke-width="2"/>
      <rect x="56" y="192" width="14" height="6" rx="3" fill="${alfa(p.destaque.base, 0.85)}"/>
      <rect x="170" y="192" width="14" height="6" rx="3" fill="${alfa(p.destaque.base, 0.85)}"/>
      <path d="M58 228 q 5 8 10 0 z" fill="#ffb54d">
        <animateTransform attributeName="transform" type="scale" values="1 1;1 1.5;1 1" dur="0.5s" repeatCount="indefinite" additive="sum"/>
      </path>
      <path d="M172 228 q 5 8 10 0 z" fill="#ffb54d">
        <animateTransform attributeName="transform" type="scale" values="1 1.4;1 1;1 1.4" dur="0.5s" repeatCount="indefinite" additive="sum"/>
      </path>`
    },
    {
      id: "ace_aureola",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Auréola",
      descricao: "Zero bugs em produção este mês. Santidade comprovada.",
      raridade: "lendario",
      tema: "fantasia",
      render: () => `
      <ellipse cx="120" cy="30" rx="30" ry="8" fill="none" stroke="#ffe89a" stroke-width="4">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="3s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="120" cy="30" rx="30" ry="8" fill="none" stroke="rgba(255,232,154,0.4)" stroke-width="8">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.25;0.6" dur="3s" repeatCount="indefinite"/>
      </ellipse>`
    },
    // ── onda 1381 (decisão #148): ARTE NOVA destravando subcategorias
    //    "Em breve" da taxonomia v2 (mega programa, partes 4–8) ──
    {
      id: "ace_mascara_neon",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Máscara Neon",
      descricao: "Meia-máscara com traçado de luz — anonimato com estilo.",
      raridade: "raro",
      tema: "cyberpunk",
      render: (_p, u) => `
      <defs>
        <linearGradient id="${u}masc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#232838"/>
          <stop offset="1" stop-color="#141824"/>
        </linearGradient>
      </defs>
      <path d="M78 128 q 42 26 84 0 l -4 30 q -38 22 -76 0 z" fill="url(#${u}masc)" stroke="#0d1018" stroke-width="2"/>
      <path d="M84 140 q 36 20 72 0" fill="none" stroke="#4ce0c3" stroke-width="2.4" stroke-linecap="round">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.2s" repeatCount="indefinite"/>
      </path>`
    },
    {
      id: "ace_gravata_borboleta",
      categoria: "acessorio",
      slot: "pescoco",
      nome: "Gravata-borboleta",
      descricao: "O nó perfeito para demo day e casamento no mesmo dia.",
      raridade: "incomum",
      tema: "executivo",
      render: (p) => `
      <path d="M120 196 l -26 -12 v 24 z" fill="${p.destaque.base}" stroke="#14171f" stroke-width="2"/>
      <path d="M120 196 l 26 -12 v 24 z" fill="${p.destaque.base}" stroke="#14171f" stroke-width="2"/>
      <rect x="113" y="189" width="14" height="14" rx="4" fill="${p.destaque.escuro}" stroke="#14171f" stroke-width="2"/>`
    },
    {
      id: "ace_asas_energia",
      categoria: "acessorio",
      slot: "costas",
      nome: "Asas de Energia",
      descricao: "Pura luz coerente. Não voam — pairam com intenção.",
      raridade: "epico",
      tema: "fantasia",
      render: (_p, u) => `
      <defs>
        <linearGradient id="${u}asa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgba(124,208,255,0.9)"/>
          <stop offset="1" stop-color="rgba(124,208,255,0.15)"/>
        </linearGradient>
      </defs>
      <g>
        <path d="M92 168 q -52 -34 -64 -86 q 44 18 60 58 q -18 -4 -30 -14 q 14 26 34 42 z" fill="url(#${u}asa)"/>
        <path d="M148 168 q 52 -34 64 -86 q -44 18 -60 58 q 18 -4 30 -14 q -14 26 -34 42 z" fill="url(#${u}asa)"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="3.4s" repeatCount="indefinite"/>
      </g>`
    },
    {
      id: "ace_gato_sombra",
      categoria: "acessorio",
      slot: "companheiro",
      nome: "Gato Sombra",
      descricao: "Aparece nas reuniões certas. Ignora as erradas.",
      raridade: "raro",
      tema: "fantasia",
      render: () => `
      <g>
        <ellipse cx="196" cy="150" rx="16" ry="12" fill="#1c1f2b"/>
        <circle cx="196" cy="132" r="10" fill="#1c1f2b"/>
        <path d="M189 126 l -3 -8 l 7 4 z" fill="#1c1f2b"/>
        <path d="M203 126 l 3 -8 l -7 4 z" fill="#1c1f2b"/>
        <circle cx="192.5" cy="131" r="1.8" fill="#4ce0c3"/>
        <circle cx="199.5" cy="131" r="1.8" fill="#4ce0c3"/>
        <path d="M210 152 q 10 -4 8 -14" fill="none" stroke="#1c1f2b" stroke-width="4" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="4s" repeatCount="indefinite"/>
      </g>`
    },
    // ── onda 1402 (decisão #151): POPULAÇÃO Cabeça e Rosto — chapéus ────
    {
      id: "ace_fedora",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Fedora Clássica",
      descricao: "O acordo fecha antes do café esfriar.",
      raridade: "incomum",
      tema: "executivo",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}fed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.roupa.claro}"/>
          <stop offset="1" stop-color="${p.roupa.escuro}"/>
        </linearGradient>
      </defs>
      <path d="M58 82 c 40 -14 84 -14 124 0 c 6 2 5 9 -2 10 c -40 7 -80 7 -120 0 c -7 -1 -8 -8 -2 -10 z" fill="url(#${u}fed)"/>
      <path d="M84 80 c 0 -22 14 -36 36 -36 s 36 14 36 36 c -12 5 -24 7 -36 7 s -24 -2 -36 -7 z" fill="url(#${u}fed)"/>
      <path d="M112 45 q 8 -4 16 0 q -4 18 -8 34 q -4 -16 -8 -34 z" fill="${p.roupa.escuro}" opacity="0.55"/>
      <path d="M85 74 c 12 5 58 5 70 0 l 0 8 c -12 5 -58 5 -70 0 z" fill="${p.destaque.base}"/>
      <path d="M88 60 a 30 26 0 0 1 12 -12" stroke="${alfa("#ffffff", 0.35)}" stroke-width="3" fill="none" stroke-linecap="round"/>`
    },
    {
      id: "ace_cartola",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Cartola de Gala",
      descricao: "Para apresentações em que o gráfico sobe sozinho.",
      raridade: "raro",
      tema: "executivo",
      lore: "Herdada de um mágico que fazia métricas ruins desaparecerem. O truque nunca foi revelado.",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}car" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2b2f3a"/>
          <stop offset="1" stop-color="#14161d"/>
        </linearGradient>
      </defs>
      <path d="M62 82 c 38 -10 78 -10 116 0 c 6 2 5 8 -1 9 c -38 6 -76 6 -114 0 c -6 -1 -7 -7 -1 -9 z" fill="url(#${u}car)"/>
      <path d="M88 80 l 2 -46 c 0 -4 3 -6 7 -6 l 46 0 c 4 0 7 2 7 6 l 2 46 c -20 5 -44 5 -64 0 z" fill="url(#${u}car)"/>
      <path d="M89 70 c 20 5 42 5 62 0 l 0 9 c -20 5 -42 5 -62 0 z" fill="${p.destaque.base}"/>
      <path d="M94 34 l 6 0 l -2 40 l -5 -1 z" fill="${alfa("#ffffff", 0.14)}"/>`
    },
    {
      id: "ace_chapeu_cowboy",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Chapéu de Boiadeiro",
      descricao: "Laça os leads mais arredios do funil.",
      raridade: "incomum",
      tema: "casual",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}cow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#a9713b"/>
          <stop offset="1" stop-color="#71481f"/>
        </linearGradient>
      </defs>
      <path d="M50 84 c 10 -12 26 -14 34 -8 c 22 6 50 6 72 0 c 8 -6 24 -4 34 8 c 4 5 -1 10 -8 9 c -42 12 -82 12 -124 0 c -7 1 -12 -4 -8 -9 z" fill="url(#${u}cow)"/>
      <path d="M86 80 c -2 -20 12 -36 34 -36 s 36 16 34 36 c -22 7 -46 7 -68 0 z" fill="url(#${u}cow)"/>
      <path d="M104 46 q 16 -6 32 0 q -6 10 -16 10 q -10 0 -16 -10 z" fill="#71481f" opacity="0.6"/>
      <path d="M87 74 c 22 6 44 6 66 0 l 0 7 c -22 6 -44 6 -66 0 z" fill="${p.destaque.base}"/>
      <circle cx="120" cy="77.5" r="3" fill="${p.destaque.claro}"/>`
    },
    {
      id: "ace_chapeu_chef",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Chapéu de Chef",
      descricao: "Hoje o cardápio é dashboard no capricho.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}chef" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="1" stop-color="#d9dde8"/>
        </linearGradient>
      </defs>
      <path d="M88 78 l 0 -14 c -10 2 -18 -6 -14 -15 c 3 -8 12 -10 18 -6 c 1 -10 11 -16 20 -12 c 3 -8 15 -8 18 0 c 9 -4 19 2 20 12 c 6 -4 15 -2 18 6 c 4 9 -4 17 -14 15 l 0 14 c -22 6 -44 6 -66 0 z" fill="url(#${u}chef)"/>
      <path d="M88 76 c 22 6 44 6 66 0 l 0 10 c -22 6 -44 6 -66 0 z" fill="#c8cdda"/>
      <path d="M100 42 q 4 -6 12 -6" stroke="${alfa("#ffffff", 0.9)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M154 84 l 0 -5" stroke="${p.destaque.base}" stroke-width="3" stroke-linecap="round"/>`
    },
    // ── onda 1402: adornos de cabeça ────────────────────────────────────
    {
      id: "ace_bandana_testa",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Bandana de Foco",
      descricao: "Amarrou, entrou em deep work. Ninguém interrompe.",
      raridade: "comum",
      tema: "gamer",
      usaCores: ["destaque"],
      render: (p) => `
      <path d="M72 84 c 30 -12 66 -12 96 0 l -2 12 c -30 -11 -62 -11 -92 0 z" fill="${p.destaque.base}"/>
      <path d="M72 84 c 30 -12 66 -12 96 0 l -1 5 c -30 -11 -64 -11 -94 0 z" fill="${p.destaque.claro}" opacity="0.5"/>
      <path d="M166 88 q 14 2 18 12 q -10 0 -14 8 q -2 -8 -8 -12 z" fill="${p.destaque.escuro}"/>
      <path d="M170 92 q 10 4 10 14" stroke="${p.destaque.profundo}" stroke-width="2" fill="none"/>`
    },
    {
      id: "ace_flor_lotus",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Flor de Lótus",
      descricao: "Serenidade acima do prazo de entrega.",
      raridade: "incomum",
      tema: "mistico",
      usaCores: ["destaque"],
      render: (p) => `
      <g transform="translate(158 72) rotate(14)">
        <ellipse cx="0" cy="-8" rx="5" ry="10" fill="${p.destaque.claro}"/>
        <ellipse cx="-8" cy="-4" rx="5" ry="9" fill="${p.destaque.base}" transform="rotate(-40)"/>
        <ellipse cx="8" cy="-4" rx="5" ry="9" fill="${p.destaque.base}" transform="rotate(40)"/>
        <ellipse cx="-12" cy="2" rx="4" ry="8" fill="${p.destaque.escuro}" transform="rotate(-70)"/>
        <ellipse cx="12" cy="2" rx="4" ry="8" fill="${p.destaque.escuro}" transform="rotate(70)"/>
        <circle cx="0" cy="0" r="3.4" fill="#ffd75e"/>
      </g>`
    },
    {
      id: "ace_laco_fita",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Laço de Fita",
      descricao: "Um toque de charme resolve reunião difícil.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["destaque"],
      render: (p) => `
      <g transform="translate(152 62) rotate(18)">
        <path d="M0 0 c -14 -10 -24 -6 -22 4 c 2 8 14 6 22 -4 z" fill="${p.destaque.base}"/>
        <path d="M0 0 c 14 -10 24 -6 22 4 c -2 8 -14 6 -22 -4 z" fill="${p.destaque.base}"/>
        <path d="M-4 2 c -8 8 -8 14 -3 16 c 4 1 7 -6 3 -16 z" fill="${p.destaque.escuro}"/>
        <path d="M4 2 c 8 8 8 14 3 16 c -4 1 -7 -6 -3 -16 z" fill="${p.destaque.escuro}"/>
        <circle cx="0" cy="1" r="4.4" fill="${p.destaque.claro}"/>
      </g>`
    },
    {
      id: "ace_diadema_perolas",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Diadema de Pérolas",
      descricao: "Elegância que não precisa levantar a voz.",
      raridade: "raro",
      tema: "executivo",
      lore: "Cada pérola marca um trimestre fechado acima da meta. A fileira ainda tem espaço.",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <radialGradient id="${u}per" cx="0.35" cy="0.3" r="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="1" stop-color="#c3c9dd"/>
        </radialGradient>
      </defs>
      <path d="M74 78 c 28 -18 64 -18 92 0" stroke="${p.destaque.base}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="84" cy="72" r="4.6" fill="url(#${u}per)"/>
      <circle cx="98" cy="64.5" r="4.6" fill="url(#${u}per)"/>
      <circle cx="113" cy="60.5" r="4.6" fill="url(#${u}per)"/>
      <circle cx="128" cy="60.5" r="4.6" fill="url(#${u}per)"/>
      <circle cx="143" cy="64.5" r="4.6" fill="url(#${u}per)"/>
      <circle cx="157" cy="72" r="4.6" fill="url(#${u}per)"/>`
    },
    // ── onda 1402: óculos ───────────────────────────────────────────────
    {
      id: "ace_oculos_redondos",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Óculos Redondos",
      descricao: "Aro fino de quem lê a documentação inteira.",
      raridade: "comum",
      tema: "executivo",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}lred" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa("#dce8ff", 0.3)}"/>
          <stop offset="1" stop-color="${alfa("#dce8ff", 0.06)}"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="108" r="13" fill="url(#${u}lred)" stroke="${p.destaque.base}" stroke-width="2.2"/>
      <circle cx="140" cy="108" r="13" fill="url(#${u}lred)" stroke="${p.destaque.base}" stroke-width="2.2"/>
      <path d="M113 106 q 7 -5 14 0" stroke="${p.destaque.base}" stroke-width="2.2" fill="none"/>
      <line x1="87" y1="105" x2="73" y2="101" stroke="${p.destaque.base}" stroke-width="2.2"/>
      <line x1="153" y1="105" x2="167" y2="101" stroke="${p.destaque.base}" stroke-width="2.2"/>`
    },
    {
      id: "ace_oculos_gatinho",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Óculos Gatinho",
      descricao: "O canto levantado enxerga tendência antes de todo mundo.",
      raridade: "incomum",
      tema: "casual",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}gat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa("#ffd9ec", 0.3)}"/>
          <stop offset="1" stop-color="${alfa("#ffd9ec", 0.06)}"/>
        </linearGradient>
      </defs>
      <path d="M85 100 l 4 -7 l 6 5 c 8 -3 15 -3 21 0 l 1 8 a 13 11 0 0 1 -13 10 l -7 0 a 13 12 0 0 1 -12 -16 z" fill="url(#${u}gat)" stroke="${p.destaque.base}" stroke-width="2.4"/>
      <path d="M155 100 l -4 -7 l -6 5 c -8 -3 -15 -3 -21 0 l -1 8 a 13 11 0 0 0 13 10 l 7 0 a 13 12 0 0 0 12 -16 z" fill="url(#${u}gat)" stroke="${p.destaque.base}" stroke-width="2.4"/>
      <path d="M114 104 q 6 -4 12 0" stroke="${p.destaque.base}" stroke-width="2.4" fill="none"/>
      <line x1="86" y1="99" x2="73" y2="97" stroke="${p.destaque.base}" stroke-width="2.4"/>
      <line x1="154" y1="99" x2="167" y2="97" stroke="${p.destaque.base}" stroke-width="2.4"/>`
    },
    {
      id: "ace_viseira_esporte",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Viseira Esportiva",
      descricao: "Aerodinâmica até no scroll do backlog.",
      raridade: "incomum",
      tema: "gamer",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}esp" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.75)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.profundo, 0.85)}"/>
        </linearGradient>
      </defs>
      <path d="M78 98 c 28 -8 56 -8 84 0 c 4 1 5 5 4 9 c -3 12 -14 18 -28 17 l -36 0 c -14 1 -25 -5 -28 -17 c -1 -4 0 -8 4 -9 z" fill="url(#${u}esp)" stroke="#1a1e2a" stroke-width="2.4"/>
      <path d="M82 101 c 24 -6 52 -6 76 0" stroke="${alfa("#ffffff", 0.45)}" stroke-width="2.4" fill="none"/>
      <line x1="79" y1="100" x2="71" y2="97" stroke="#1a1e2a" stroke-width="3"/>
      <line x1="161" y1="100" x2="169" y2="97" stroke="#1a1e2a" stroke-width="3"/>`
    },
    {
      id: "ace_oculos_pixel",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Óculos Pixel",
      descricao: "Deal with it — em 8 bits, como manda a tradição.",
      raridade: "raro",
      tema: "gamer",
      lore: "Renderizados numa era em que cada pixel custava caro. Sobreviveram a todos os upgrades por puro estilo.",
      usaCores: ["destaque"],
      render: (p) => `
      <g fill="${p.destaque.profundo}">
        <rect x="84" y="100" width="32" height="6"/><rect x="124" y="100" width="32" height="6"/>
        <rect x="84" y="106" width="6" height="10"/><rect x="110" y="106" width="6" height="10"/>
        <rect x="124" y="106" width="6" height="10"/><rect x="150" y="106" width="6" height="10"/>
        <rect x="90" y="112" width="20" height="6"/><rect x="130" y="112" width="20" height="6"/>
        <rect x="116" y="102" width="8" height="4"/>
        <rect x="72" y="98" width="12" height="5"/><rect x="156" y="98" width="12" height="5"/>
      </g>
      <rect x="90" y="106" width="20" height="6" fill="${p.destaque.base}"/>
      <rect x="130" y="106" width="20" height="6" fill="${p.destaque.base}"/>
      <rect x="90" y="106" width="7" height="3" fill="${p.destaque.claro}"/>
      <rect x="130" y="106" width="7" height="3" fill="${p.destaque.claro}"/>`
    },
    // ── onda 1402: capuzes e véus (destrava a subcategoria) ─────────────
    {
      id: "ace_capuz_sombrio",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Capuz Sombrio",
      descricao: "Commit às 3h da manhã pede vestimenta adequada.",
      raridade: "raro",
      tema: "fantasia",
      lore: "Tecido que absorve luz de monitor. Quem o veste aparece no git log, nunca nas fotos.",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}cpz" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.roupa.escuro}"/>
          <stop offset="1" stop-color="${p.roupa.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M120 40 c -36 0 -58 26 -58 62 c 0 22 6 40 16 52 l 10 -6 c -7 -12 -11 -28 -11 -44 c 0 -30 17 -50 43 -50 s 43 20 43 50 c 0 16 -4 32 -11 44 l 10 6 c 10 -12 16 -30 16 -52 c 0 -36 -22 -62 -58 -62 z" fill="url(#${u}cpz)"/>
      <path d="M120 44 c -30 0 -50 22 -50 56 l -6 2 c -1 -38 22 -64 56 -64 s 57 26 56 64 l -6 -2 c 0 -34 -20 -56 -50 -56 z" fill="${p.roupa.base}" opacity="0.5"/>
      <path d="M78 148 q 42 16 84 0 l -4 10 q -38 14 -76 0 z" fill="url(#${u}cpz)"/>
      <path d="M96 58 q 24 -12 48 0" stroke="${p.destaque.base}" stroke-width="2.6" fill="none" opacity="0.85"/>`
    },
    {
      id: "ace_capuz_ninja",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Capuz Ninja",
      descricao: "Entrou no sprint, ninguém viu. Entregou, todos souberam.",
      raridade: "epico",
      tema: "fantasia",
      lore: "Do clã que remove blockers em silêncio. A faixa só é concedida a quem nunca quebrou a main.",
      usaCores: ["roupa", "destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}nin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.roupa.base}"/>
          <stop offset="1" stop-color="${p.roupa.profundo}"/>
        </linearGradient>
      </defs>
      <path d="M120 46 c -30 0 -48 20 -48 52 c 0 12 2 22 6 30 l 12 -4 c -3 -8 -5 -16 -5 -26 c 0 -26 14 -42 35 -42 s 35 16 35 42 c 0 10 -2 18 -5 26 l 12 4 c 4 -8 6 -18 6 -30 c 0 -32 -18 -52 -48 -52 z" fill="url(#${u}nin)"/>
      <path d="M84 124 q 36 -10 72 0 l 0 22 q -36 12 -72 0 z" fill="url(#${u}nin)"/>
      <path d="M86 96 q 34 -8 68 0 l 0 10 q -34 -8 -68 0 z" fill="${p.roupa.profundo}"/>
      <path d="M88 90 c 22 -6 42 -6 64 0 l -1 6 c -20 -5 -42 -5 -62 0 z" fill="${p.destaque.base}"/>
      <path d="M152 92 q 16 4 20 16 q -8 -2 -12 4 q -4 -10 -8 -14 z" fill="${p.destaque.escuro}"/>`
    },
    {
      id: "ace_veu_mistico",
      categoria: "acessorio",
      slot: "cabeca",
      nome: "Véu Místico",
      descricao: "As previsões do roadmap ficam nítidas sob o véu.",
      raridade: "epico",
      tema: "mistico",
      lore: "Tecido com fios de madrugadas estreladas. Quem o usa enxerga o backlog do próximo trimestre.",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}veu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.5)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.profundo, 0.16)}"/>
        </linearGradient>
      </defs>
      <path d="M70 76 c 8 -28 26 -42 50 -42 s 42 14 50 42 c 4 30 2 58 -10 82 q -6 -4 -8 -10 c 8 -22 9 -46 6 -68 c -6 -22 -20 -34 -38 -34 s -32 12 -38 34 c -3 22 -2 46 6 68 q -2 6 -8 10 c -12 -24 -14 -52 -10 -82 z" fill="url(#${u}veu)"/>
      <path d="M74 74 c 28 -12 64 -12 92 0" stroke="${p.destaque.base}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="120" cy="52" r="3" fill="#ffd75e"/>
      <circle cx="82" cy="112" r="1.6" fill="${alfa("#ffffff", 0.85)}"/>
      <circle cx="158" cy="104" r="1.6" fill="${alfa("#ffffff", 0.85)}"/>
      <circle cx="76" cy="140" r="1.3" fill="${alfa("#ffffff", 0.7)}"/>
      <circle cx="163" cy="136" r="1.3" fill="${alfa("#ffffff", 0.7)}"/>`
    },
    // ── onda 1402: máscaras (proteção facial) ───────────────────────────
    {
      id: "ace_mascara_oni",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Máscara Oni",
      descricao: "Negociação difícil? O oni entra primeiro.",
      raridade: "raro",
      tema: "fantasia",
      lore: "Esculpida para assustar bugs de produção. Dizem que os críticos fecham sozinhos quando ela aparece.",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}oni" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#c9403a"/>
          <stop offset="1" stop-color="#8a2420"/>
        </linearGradient>
      </defs>
      <path d="M84 118 c 24 10 48 10 72 0 c 4 16 -2 34 -14 42 c -14 9 -30 9 -44 0 c -12 -8 -18 -26 -14 -42 z" fill="url(#${u}oni)"/>
      <path d="M94 132 q 8 6 16 2 M130 134 q 8 4 16 -2" stroke="#3a0f0d" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M104 150 l 5 10 l 5 -10 z M126 150 l 5 10 l 5 -10 z" fill="#fff3e0"/>
      <path d="M100 142 q 20 8 40 0" stroke="#3a0f0d" stroke-width="2.6" fill="none"/>
      <path d="M92 122 q -6 -10 -2 -18 q 8 4 8 14 z M148 122 q 6 -10 2 -18 q -8 4 -8 14 z" fill="${p.destaque.base}"/>`
    },
    {
      id: "ace_mascara_kitsune",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Máscara Kitsune",
      descricao: "Nove caudas, nove sprints sem retrabalho.",
      raridade: "epico",
      tema: "fantasia",
      lore: "A raposa guardiã dos deploys de sexta-feira. Sorri porque sabe que o rollback está pronto.",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}kit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="1" stop-color="#e4e6f2"/>
        </linearGradient>
      </defs>
      <path d="M82 96 c 24 -12 52 -12 76 0 c 6 22 0 46 -16 58 c -8 -14 -14 -14 -22 -2 c -8 -12 -14 -12 -22 2 c -16 -12 -22 -36 -16 -58 z" fill="url(#${u}kit)"/>
      <path d="M96 112 l 16 6 l -14 6 z M144 112 l -16 6 l 14 6 z" fill="${p.destaque.base}"/>
      <path d="M112 142 q 8 6 16 0 l -8 8 z" fill="${p.destaque.escuro}"/>
      <path d="M90 100 q 10 -6 20 -4 M150 100 q -10 -6 -20 -4" stroke="${p.destaque.base}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M118 96 l 2 -6 l 2 6 z" fill="${p.destaque.base}"/>`
    },
    {
      id: "ace_mascara_teatro",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Máscara de Teatro",
      descricao: "Sorriso de demo funcionando na primeira tentativa.",
      raridade: "incomum",
      tema: "casual",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}tea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${p.destaque.claro}"/>
          <stop offset="1" stop-color="${p.destaque.escuro}"/>
        </linearGradient>
      </defs>
      <path d="M86 96 c 22 -10 46 -10 68 0 c 5 20 0 42 -13 54 c -12 10 -30 10 -42 0 c -13 -12 -18 -34 -13 -54 z" fill="url(#${u}tea)"/>
      <path d="M97 116 a 8 5 0 0 0 14 0 z M129 116 a 8 5 0 0 0 14 0 z" fill="#1d2130"/>
      <path d="M102 138 q 18 16 36 0 q -8 20 -18 20 q -10 0 -18 -20 z" fill="#1d2130"/>
      <path d="M92 100 a 30 20 0 0 1 16 -8" stroke="${alfa("#ffffff", 0.5)}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    },
    {
      id: "ace_medico_peste",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Médico da Peste",
      descricao: "Especialista em epidemias de bug. Faz visita de código.",
      raridade: "epico",
      tema: "fantasia",
      lore: "O bico guarda ervas contra código legado. O diagnóstico é sempre o mesmo: precisa de testes.",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}pes" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3a3630"/>
          <stop offset="1" stop-color="#211e1a"/>
        </linearGradient>
        <radialGradient id="${u}olh" cx="0.35" cy="0.35" r="1">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.9)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.profundo, 0.9)}"/>
        </radialGradient>
      </defs>
      <path d="M84 98 c 24 -10 48 -10 72 0 c 3 10 3 20 0 28 l -34 44 c -1 2 -3 2 -4 0 l -34 -44 c -3 -8 -3 -18 0 -28 z" fill="url(#${u}pes)"/>
      <path d="M110 126 l 10 38 l 10 -38 c 8 -10 8 -20 2 -24 q -12 6 -24 0 c -6 4 -6 14 2 24 z" fill="#2b2822"/>
      <circle cx="100" cy="110" r="9" fill="url(#${u}olh)" stroke="#151310" stroke-width="2.6"/>
      <circle cx="140" cy="110" r="9" fill="url(#${u}olh)" stroke="#151310" stroke-width="2.6"/>
      <path d="M116 132 l 3 8 M124 132 l -3 8" stroke="#151310" stroke-width="2" stroke-linecap="round"/>
      <path d="M86 100 c 22 -8 46 -8 68 0" stroke="#4a453c" stroke-width="2" fill="none"/>`
    },
    {
      id: "ace_mascara_hoquei",
      categoria: "acessorio",
      slot: "rosto",
      nome: "Máscara de Hóquei",
      descricao: "Sexta-feira 13 é só mais um dia de deploy.",
      raridade: "raro",
      tema: "gamer",
      lore: "Veterana de mil incidentes sev-1. As marcas são de gelo, não de medo.",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}hoq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f2f3f8"/>
          <stop offset="1" stop-color="#c9cdda"/>
        </linearGradient>
      </defs>
      <path d="M85 92 c 22 -10 48 -10 70 0 c 6 22 1 48 -14 62 c -12 11 -30 11 -42 0 c -15 -14 -20 -40 -14 -62 z" fill="url(#${u}hoq)"/>
      <path d="M95 112 a 9 6 0 0 0 14 0 z M131 112 a 9 6 0 0 0 14 0 z" fill="#1d2130"/>
      <g fill="#1d2130">
        <circle cx="107" cy="132" r="2.2"/><circle cx="120" cy="136" r="2.2"/><circle cx="133" cy="132" r="2.2"/>
        <circle cx="112" cy="148" r="2.2"/><circle cx="128" cy="148" r="2.2"/><circle cx="120" cy="158" r="2.2"/>
      </g>
      <path d="M88 100 l 20 60 M152 100 l -20 60" stroke="${p.destaque.base}" stroke-width="2.4" opacity="0.7"/>`
    },
    // ── onda 1403 (decisão #153): POPULAÇÃO das subcategorias vazias ────
    // Mochilas e bolsas (slot costas — alça cruza o busto, corpo da bolsa
    // aparece na lateral, como a mochila a jato faz)
    {
      id: "ace_bolsa_mensageiro",
      categoria: "acessorio",
      slot: "costas",
      nome: "Bolsa Mensageiro",
      descricao: "Carrega o notebook e três ideias por hora.",
      raridade: "comum",
      tema: "executivo",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}bmsg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#5a6474"/>
          <stop offset="1" stop-color="#3a4150"/>
        </linearGradient>
      </defs>
      <path d="M86 176 l 62 -32" stroke="url(#${u}bmsg)" stroke-width="9" stroke-linecap="round"/>
      <path d="M40 168 h 52 a 6 6 0 0 1 6 6 v 30 a 8 8 0 0 1 -8 8 h -48 a 8 8 0 0 1 -8 -8 v -30 a 6 6 0 0 1 6 -6 z" fill="url(#${u}bmsg)"/>
      <path d="M36 170 h 60 l 0 12 c -20 6 -40 6 -60 0 z" fill="#2b303c"/>
      <rect x="58" y="182" width="16" height="10" rx="2.4" fill="${p.destaque.base}"/>
      <path d="M40 172 h 10 v 34" stroke="${alfa("#ffffff", 0.14)}" stroke-width="3" fill="none"/>`
    },
    {
      id: "ace_bolsa_tatica",
      categoria: "acessorio",
      slot: "costas",
      nome: "Mochila Tática",
      descricao: "Um bolso para cada plano B.",
      raridade: "incomum",
      tema: "gamer",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}btat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3c4433"/>
          <stop offset="1" stop-color="#252a1e"/>
        </linearGradient>
      </defs>
      <path d="M62 150 c -18 4 -28 18 -28 38 l 0 20 c 0 8 6 14 14 14 l 24 0 c 8 0 14 -6 14 -14 l 0 -20 c 0 -20 -8 -34 -24 -38 z" fill="url(#${u}btat)"/>
      <rect x="44" y="176" width="34" height="18" rx="4" fill="#2b3024"/>
      <rect x="50" y="200" width="22" height="12" rx="3" fill="#2b3024"/>
      <path d="M46 168 h 30 M46 216 h 30" stroke="${p.destaque.base}" stroke-width="3" stroke-linecap="round"/>
      <path d="M92 152 l 40 24" stroke="#2b3024" stroke-width="8" stroke-linecap="round"/>
      <circle cx="61" cy="185" r="3" fill="${p.destaque.claro}"/>`
    },
    {
      id: "ace_bolsa_couro",
      categoria: "acessorio",
      slot: "costas",
      nome: "Bolsa de Couro",
      descricao: "Envelhece melhor que a maioria dos roadmaps.",
      raridade: "raro",
      tema: "casual",
      lore: "Costura reforçada por três gerações de artesãos. Já viu mais reuniões do que muito diretor.",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}bcou" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#a9713b"/>
          <stop offset="1" stop-color="#6e451e"/>
        </linearGradient>
      </defs>
      <path d="M150 174 l 46 -24" stroke="url(#${u}bcou)" stroke-width="9" stroke-linecap="round"/>
      <path d="M156 168 h 46 a 7 7 0 0 1 7 7 v 28 a 9 9 0 0 1 -9 9 h -42 a 9 9 0 0 1 -9 -9 v -28 a 7 7 0 0 1 7 -7 z" fill="url(#${u}bcou)"/>
      <path d="M151 170 h 56 l 0 14 c -18 7 -38 7 -56 0 z" fill="#5a3517"/>
      <path d="M172 184 a 7 7 0 0 1 14 0 l 0 8 a 7 7 0 0 1 -14 0 z" fill="${p.destaque.base}"/>
      <circle cx="179" cy="188" r="2.2" fill="${p.destaque.claro}"/>`
    },
    // Robôs (slot companheiro — flutuam na lateral direita, como o drone)
    {
      id: "ace_robo_assistente",
      categoria: "acessorio",
      slot: "companheiro",
      nome: "Robô Assistente",
      descricao: "Anota tudo. Julga silenciosamente as suas planilhas.",
      raridade: "incomum",
      tema: "tecnologia",
      piscar: false,
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}rass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e4e8f2"/>
          <stop offset="1" stop-color="#aab2c4"/>
        </linearGradient>
      </defs>
      <g>
        <rect x="180" y="120" width="34" height="40" rx="10" fill="url(#${u}rass)"/>
        <rect x="186" y="128" width="22" height="12" rx="6" fill="#1d2130"/>
        <circle cx="193" cy="134" r="2.6" fill="${p.destaque.base}"/>
        <circle cx="201" cy="134" r="2.6" fill="${p.destaque.base}"/>
        <path d="M190 148 q 7 4 14 0" stroke="${p.destaque.base}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <line x1="197" y1="112" x2="197" y2="120" stroke="#aab2c4" stroke-width="3"/>
        <circle cx="197" cy="109" r="3.4" fill="${p.destaque.claro}"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="3.6s" repeatCount="indefinite"/>
      </g>`
    },
    {
      id: "ace_robo_bit",
      categoria: "acessorio",
      slot: "companheiro",
      nome: "Bit",
      descricao: "Um byte de companhia. Dois quando está feliz.",
      raridade: "comum",
      tema: "gamer",
      piscar: false,
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <radialGradient id="${u}rbit" cx="0.35" cy="0.3" r="1">
          <stop offset="0" stop-color="#3a4150"/>
          <stop offset="1" stop-color="#20242e"/>
        </radialGradient>
      </defs>
      <g>
        <circle cx="196" cy="140" r="17" fill="url(#${u}rbit)"/>
        <path d="M186 136 a 13 13 0 0 1 20 0 l 0 8 a 13 13 0 0 1 -20 0 z" fill="#141720"/>
        <rect x="189" y="136" width="5" height="7" rx="2" fill="${p.destaque.base}"/>
        <rect x="198" y="136" width="5" height="7" rx="2" fill="${p.destaque.base}"/>
        <path d="M181 126 l -5 -6 M211 126 l 5 -6" stroke="#3a4150" stroke-width="3" stroke-linecap="round"/>
        <circle cx="175" cy="118" r="2.4" fill="${p.destaque.claro}"/>
        <circle cx="217" cy="118" r="2.4" fill="${p.destaque.claro}"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur="3s" repeatCount="indefinite"/>
      </g>`
    },
    {
      id: "ace_robo_aranha",
      categoria: "acessorio",
      slot: "companheiro",
      nome: "Robô Aranha",
      descricao: "Oito patas, zero bugs — ele resolve os dele sozinho.",
      raridade: "raro",
      tema: "tecnologia",
      lore: "Protótipo de manutenção que se recusou a ser desligado. Hoje conserta o que ninguém viu quebrar.",
      piscar: false,
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}rara" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4a5162"/>
          <stop offset="1" stop-color="#2b303c"/>
        </linearGradient>
      </defs>
      <g>
        <ellipse cx="198" cy="176" rx="15" ry="11" fill="url(#${u}rara)"/>
        <circle cx="198" cy="170" r="6" fill="#141720"/>
        <circle cx="196" cy="169" r="1.8" fill="${p.destaque.base}"/>
        <circle cx="201" cy="169" r="1.8" fill="${p.destaque.base}"/>
        <path d="M186 176 q -10 -4 -12 -14 M186 180 q -12 2 -16 10 M210 176 q 10 -4 12 -14 M210 180 q 12 2 16 10" stroke="#2b303c" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M190 186 q -4 8 -10 10 M206 186 q 4 8 10 10" stroke="#2b303c" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="198" cy="160" r="2" fill="${p.destaque.claro}"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="2.6s" repeatCount="indefinite"/>
      </g>`
    },
    {
      id: "ace_robo_guardiao",
      categoria: "acessorio",
      slot: "companheiro",
      nome: "Robô Guardião",
      descricao: "Firewall com personalidade. E escudo.",
      raridade: "epico",
      tema: "tecnologia",
      lore: "Sentinela aposentado dos servidores de produção. Nunca perdeu um deploy no seu turno — e não pretende começar.",
      piscar: false,
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}rgua" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3a4150"/>
          <stop offset="1" stop-color="#20242e"/>
        </linearGradient>
      </defs>
      <g>
        <path d="M182 118 l 16 -8 l 16 8 l 0 22 q 0 18 -16 26 q -16 -8 -16 -26 z" fill="url(#${u}rgua)"/>
        <path d="M186 121 l 12 -6 l 12 6 l 0 18 q 0 14 -12 21 q -12 -7 -12 -21 z" fill="none" stroke="${p.destaque.base}" stroke-width="2"/>
        <rect x="192" y="128" width="12" height="7" rx="3.5" fill="#141720"/>
        <circle cx="196" cy="131.5" r="1.8" fill="${p.destaque.claro}"/>
        <circle cx="200" cy="131.5" r="1.8" fill="${p.destaque.claro}"/>
        <path d="M192 146 l 6 4 l 6 -4" stroke="${p.destaque.base}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="4.2s" repeatCount="indefinite"/>
      </g>`
    },
    // Espíritos (slot companheiro — presenças etéreas com alfa)
    {
      id: "ace_espirito_chama",
      categoria: "acessorio",
      slot: "companheiro",
      nome: "Espírito de Chama",
      descricao: "Esquenta o café e as discussões de arquitetura.",
      raridade: "raro",
      tema: "mistico",
      lore: "Nasceu da primeira vela de uma virada de ano fiscal. Aquece quem entrega e chamusca quem enrola.",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}echa" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="${alfa("#ff8a3d", 0.9)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.claro, 0.75)}"/>
        </linearGradient>
      </defs>
      <g>
        <path d="M198 116 c 10 10 16 20 16 30 c 0 12 -8 20 -16 20 c -8 0 -16 -8 -16 -20 c 0 -6 3 -10 6 -14 c 1 5 3 8 6 9 c -2 -8 -1 -17 4 -25 z" fill="url(#${u}echa)"/>
        <circle cx="194" cy="148" r="2.2" fill="#2b1608"/>
        <circle cx="202" cy="148" r="2.2" fill="#2b1608"/>
        <path d="M195 155 q 3 2 6 0" stroke="#2b1608" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur="3.2s" repeatCount="indefinite"/>
      </g>`
    },
    {
      id: "ace_espirito_agua",
      categoria: "acessorio",
      slot: "companheiro",
      nome: "Espírito de Água",
      descricao: "Flui pelos bloqueios. Literalmente.",
      raridade: "raro",
      tema: "mistico",
      lore: "Gota que escapou do primeiro gráfico de burndown. Desde então, só desce suave.",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}eagu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa("#9fd8ff", 0.85)}"/>
          <stop offset="1" stop-color="${alfa("#3d7dd6", 0.85)}"/>
        </linearGradient>
      </defs>
      <g>
        <path d="M198 114 c 12 14 18 24 18 34 a 18 18 0 0 1 -36 0 c 0 -10 6 -20 18 -34 z" fill="url(#${u}eagu)"/>
        <circle cx="193" cy="146" r="2.2" fill="#12365e"/>
        <circle cx="203" cy="146" r="2.2" fill="#12365e"/>
        <path d="M194 153 q 4 3 8 0" stroke="#12365e" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M189 132 a 12 12 0 0 1 5 -8" stroke="${alfa("#ffffff", 0.7)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <circle cx="212" cy="122" r="2.4" fill="${alfa(p.destaque.claro, 0.8)}"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="3.8s" repeatCount="indefinite"/>
      </g>`
    },
    {
      id: "ace_espirito_estelar",
      categoria: "acessorio",
      slot: "companheiro",
      nome: "Wisp Estelar",
      descricao: "Poeira de estrela com opinião própria sobre KPIs.",
      raridade: "epico",
      tema: "mistico",
      lore: "Fragmento de uma constelação que só aparece para quem bate a meta anual. Ele escolheu ficar.",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <radialGradient id="${u}eest" cx="0.5" cy="0.5" r="0.9">
          <stop offset="0" stop-color="${alfa("#ffffff", 0.95)}"/>
          <stop offset="0.55" stop-color="${alfa(p.destaque.claro, 0.7)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.profundo, 0.12)}"/>
        </radialGradient>
      </defs>
      <g>
        <circle cx="198" cy="140" r="19" fill="url(#${u}eest)"/>
        <circle cx="193" cy="138" r="2" fill="#2b2450"/>
        <circle cx="203" cy="138" r="2" fill="#2b2450"/>
        <path d="M195 145 q 3 2 6 0" stroke="#2b2450" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M212 118 l 1.6 4 l 4 1.6 l -4 1.6 l -1.6 4 l -1.6 -4 l -4 -1.6 l 4 -1.6 z" fill="${alfa("#ffffff", 0.9)}"/>
        <circle cx="182" cy="158" r="1.6" fill="${alfa("#ffffff", 0.8)}"/>
        <circle cx="214" cy="152" r="1.3" fill="${alfa("#ffffff", 0.7)}"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -7;0 0" dur="4.4s" repeatCount="indefinite"/>
      </g>`
    },
    // Runas e círculos (slot flutuante — glifos orbitando, como a auréola)
    {
      id: "ace_runa_circulo",
      categoria: "acessorio",
      slot: "flutuante",
      nome: "Círculo Rúnico",
      descricao: "Um anel de símbolos que aprova PRs dignos.",
      raridade: "raro",
      tema: "mistico",
      lore: "Inscrição circular achada no rodapé de um contrato antigo. Ninguém traduziu; todos respeitam.",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}rcir" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.9)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0.7)}"/>
        </linearGradient>
      </defs>
      <g>
        <ellipse cx="120" cy="52" rx="46" ry="10" fill="none" stroke="url(#${u}rcir)" stroke-width="3"/>
        <g fill="${p.destaque.claro}" font-size="0">
          <rect x="78" y="46" width="5" height="7" rx="1"/>
          <rect x="100" y="40" width="5" height="7" rx="1" transform="rotate(-12 102 43)"/>
          <rect x="134" y="40" width="5" height="7" rx="1" transform="rotate(12 136 43)"/>
          <rect x="157" y="46" width="5" height="7" rx="1"/>
          <rect x="118" y="60" width="5" height="7" rx="1"/>
        </g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="5s" repeatCount="indefinite"/>
      </g>`
    },
    {
      id: "ace_runa_protecao",
      categoria: "acessorio",
      slot: "flutuante",
      nome: "Runa de Proteção",
      descricao: "Escudo antigo contra hotfix de sexta-feira.",
      raridade: "raro",
      tema: "mistico",
      lore: "Gravada na porta da primeira sala de servidores da Dshow. Migrou para a nuvem junto com todo o resto.",
      usaCores: ["destaque"],
      render: (p) => `
      <g>
        <path d="M64 96 l 0 26 M56 104 l 16 10 M72 104 l -16 10" stroke="${p.destaque.base}" stroke-width="3.6" stroke-linecap="round"/>
        <circle cx="64" cy="109" r="16" fill="none" stroke="${alfa(p.destaque.claro, 0.55)}" stroke-width="2"/>
        <circle cx="64" cy="88" r="1.8" fill="${p.destaque.claro}"/>
        <circle cx="64" cy="130" r="1.8" fill="${p.destaque.claro}"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="4.6s" repeatCount="indefinite"/>
      </g>`
    },
    {
      id: "ace_runa_glifo",
      categoria: "acessorio",
      slot: "flutuante",
      nome: "Glifo Arcano",
      descricao: "Compila intenção em resultado. Sem warnings.",
      raridade: "epico",
      tema: "mistico",
      lore: "O único glifo que aceita acento agudo. Escreve o futuro em UTF-8.",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}rgli" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.95)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0.75)}"/>
        </linearGradient>
      </defs>
      <g>
        <path d="M176 84 l 12 -20 l 12 20 l -12 8 z" fill="none" stroke="url(#${u}rgli)" stroke-width="3" stroke-linejoin="round"/>
        <path d="M188 92 l 0 14" stroke="url(#${u}rgli)" stroke-width="3" stroke-linecap="round"/>
        <circle cx="188" cy="110" r="2.2" fill="${p.destaque.claro}"/>
        <path d="M172 72 l -6 -2 M204 72 l 6 -2" stroke="${alfa(p.destaque.claro, 0.6)}" stroke-width="2" stroke-linecap="round"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur="4s" repeatCount="indefinite"/>
      </g>`
    },
    {
      id: "ace_runa_orbital",
      categoria: "acessorio",
      slot: "flutuante",
      nome: "Anel Orbital",
      descricao: "Satélites pessoais em rota de brainstorm.",
      raridade: "epico",
      tema: "tecnologia",
      lore: "Três núcleos de dados orbitando em sincronia perfeita. O backup do backup tem backup.",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}rorb" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.8)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.profundo, 0.5)}"/>
        </linearGradient>
      </defs>
      <g>
        <ellipse cx="120" cy="118" rx="78" ry="20" fill="none" stroke="url(#${u}rorb)" stroke-width="2.4"/>
        <circle cx="44" cy="122" r="5" fill="${p.destaque.base}"/>
        <circle cx="196" cy="112" r="4" fill="${p.destaque.claro}"/>
        <circle cx="132" cy="137" r="3.2" fill="${p.destaque.escuro}"/>
        <circle cx="44" cy="120" r="1.6" fill="#ffffff" opacity="0.8"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="5.4s" repeatCount="indefinite"/>
      </g>`
    },
    // ── onda 1404 (decisão #154, as6.slots_corpo): ACESSÓRIOS CORPORAIS ──
    // Contrato: `render` (busto 240×240) devolve '' — o busto não tem braços/
    // pernas, então header/publicação ficam byte a byte; a arte vive em
    // `renderCorpo` (corpo inteiro 240×400, coordenadas do partes/corpo.ts):
    // mãos em (72,206)/(168,206) · pulsos y≈186 · cintura y 206–222 ·
    // pernas 216–330 · pés 328–370. Uma arte-prova por slot; população
    // plena das regiões é a onda 1405.
    {
      id: "ace_relogio_pulso",
      categoria: "acessorio",
      slot: "pulso_e",
      nome: "Relógio de Pulso",
      descricao: "Marca a hora do deploy — e a do café.",
      raridade: "incomum",
      tema: "executivo",
      usaCores: ["destaque"],
      render: () => "",
      renderCorpo: (p, u) => `
      <defs>
        <radialGradient id="${u}rel" cx="0.4" cy="0.35" r="0.9">
          <stop offset="0" stop-color="#e8ecf5"/>
          <stop offset="1" stop-color="#9aa3b5"/>
        </radialGradient>
      </defs>
      <path d="M62 182 h 20 v 8 h -20 z" fill="${p.destaque.escuro}"/>
      <circle cx="72" cy="186" r="7.5" fill="url(#${u}rel)" stroke="${p.destaque.base}" stroke-width="2"/>
      <path d="M72 186 l 0 -4.5 M72 186 l 3 2" stroke="#1d2130" stroke-width="1.4" stroke-linecap="round"/>`
    },
    {
      id: "ace_pulseira_led",
      categoria: "acessorio",
      slot: "pulso_d",
      nome: "Pulseira LED",
      descricao: "Pisca no ritmo do sprint.",
      raridade: "comum",
      tema: "gamer",
      usaCores: ["destaque"],
      render: () => "",
      renderCorpo: (p) => `
      <path d="M158 182 h 20 v 8 h -20 z" fill="#20242e" rx="2"/>
      <path d="M160 186 h 16" stroke="${p.destaque.base}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="168" cy="186" r="1.6" fill="${p.destaque.claro}"/>`
    },
    {
      id: "ace_luva_couro",
      categoria: "acessorio",
      slot: "mao_e",
      nome: "Luva de Couro",
      descricao: "Aperto de mão firme fecha contrato.",
      raridade: "incomum",
      tema: "casual",
      usaCores: ["destaque"],
      render: () => "",
      renderCorpo: (p) => `
      <circle cx="72" cy="206" r="10.5" fill="#6e451e"/>
      <circle cx="72" cy="206" r="10.5" fill="none" stroke="${p.destaque.base}" stroke-width="1.6"/>
      <path d="M64 200 q 8 -4 16 0" stroke="#4a2d12" stroke-width="1.6" fill="none"/>`
    },
    {
      id: "ace_anel_sinete",
      categoria: "acessorio",
      slot: "mao_d",
      nome: "Anel Sinete",
      descricao: "Sela decisões. Sem cera, com estilo.",
      raridade: "raro",
      tema: "executivo",
      lore: "Brasão de uma dinastia de fechadores de trimestre. Passa de mão em mão a cada recorde batido.",
      usaCores: ["destaque"],
      render: () => "",
      renderCorpo: (p) => `
      <path d="M163 210 h 10 v 3 h -10 z" fill="${p.destaque.base}"/>
      <rect x="165" y="205.5" width="6" height="5.5" rx="1.4" fill="${p.destaque.claro}"/>
      <circle cx="168" cy="208.2" r="1.3" fill="${p.destaque.escuro}"/>`
    },
    {
      id: "ace_cinto_couro",
      categoria: "acessorio",
      slot: "cintura",
      nome: "Cinto de Couro",
      descricao: "Segura a calça e as expectativas.",
      raridade: "comum",
      tema: "executivo",
      usaCores: ["destaque"],
      render: () => "",
      renderCorpo: (p) => `
      <path d="M90 208 h 60 v 9 h -60 z" fill="#4a2d12"/>
      <rect x="113" y="206" width="14" height="13" rx="2.5" fill="none" stroke="${p.destaque.base}" stroke-width="2.6"/>
      <path d="M120 208 v 9" stroke="${p.destaque.base}" stroke-width="2"/>`
    },
    {
      id: "ace_joelheiras",
      categoria: "acessorio",
      slot: "pernas",
      nome: "Joelheiras Táticas",
      descricao: "Para as horas de joelho no chão debugando.",
      raridade: "incomum",
      tema: "gamer",
      usaCores: ["destaque"],
      render: () => "",
      renderCorpo: (p) => `
      <path d="M94 268 h 22 a 4 4 0 0 1 4 4 v 12 a 4 4 0 0 1 -4 4 h -22 a 4 4 0 0 1 -4 -4 v -12 a 4 4 0 0 1 4 -4 z" fill="#2b303c"/>
      <path d="M124 268 h 22 a 4 4 0 0 1 4 4 v 12 a 4 4 0 0 1 -4 4 h -22 a 4 4 0 0 1 -4 -4 v -12 a 4 4 0 0 1 4 -4 z" fill="#2b303c"/>
      <path d="M96 276 h 18 M126 276 h 18" stroke="${p.destaque.base}" stroke-width="2" stroke-linecap="round"/>`
    },
    {
      id: "ace_tenis_neon",
      categoria: "acessorio",
      slot: "pes",
      nome: "Tênis Neon",
      descricao: "Sola que acende quando a métrica sobe.",
      raridade: "raro",
      tema: "gamer",
      lore: "Edição limitada da maratona de features. Quem correu, ganhou; quem ganhou, brilha.",
      usaCores: ["destaque"],
      render: () => "",
      renderCorpo: (p, u) => `
      <defs>
        <linearGradient id="${u}ten" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f2f3f8"/>
          <stop offset="1" stop-color="#c9cdda"/>
        </linearGradient>
      </defs>
      <path d="M90 330 h 28 v 30 c 0 6 -4 10 -10 10 h -24 c -8 0 -10 -10 -2 -14 l 8 -5 z" fill="url(#${u}ten)"/>
      <path d="M122 330 h 28 l 0 21 l 8 5 c 8 4 6 14 -2 14 h -24 c -6 0 -10 -4 -10 -10 z" fill="url(#${u}ten)"/>
      <path d="M82 367 h 36 M122 367 h 36" stroke="${p.destaque.base}" stroke-width="4" stroke-linecap="round"/>
      <path d="M96 340 l 8 6 M126 340 l 8 6" stroke="${p.destaque.escuro}" stroke-width="2" stroke-linecap="round"/>`
    }
  ];

  // public/components/panels/panel-avatar-studio/src/workspace/acessorios.ts
  var SUBCATEGORIAS_ACESSORIO = [
    // Cabeça
    { id: "chapeus", nome: "Chapéus e bonés", regiao: "cabeca", slot: "cabeca", estado: "ativa" },
    { id: "adornos-cabeca", nome: "Adornos de cabeça", regiao: "cabeca", slot: "cabeca", estado: "ativa" },
    // onda 1402 (#151): ATIVA — 3 artes reais chegaram (população §11: só
    // esvazia "em preparação" quando a subcategoria está REALMENTE pronta)
    { id: "capuzes", nome: "Capuzes e véus", regiao: "cabeca", slot: "cabeca", estado: "ativa" },
    // Rosto e olhos
    { id: "oculos", nome: "Óculos", regiao: "rosto-olhos", slot: "olhos", estado: "ativa" },
    { id: "tapa-olhos", nome: "Tapa-olhos", regiao: "rosto-olhos", slot: "olhos", estado: "ativa" },
    { id: "headsets-vr", nome: "Headsets VR", regiao: "rosto-olhos", slot: "cabeca", estado: "ativa", conflitaComSlots: ["olhos"] },
    { id: "rosto-marcas", nome: "Pinturas e piercings", regiao: "rosto-olhos", slot: "rosto", estado: "ativa" },
    { id: "mascaras", nome: "Máscaras", regiao: "rosto-olhos", slot: "rosto", estado: "ativa", conflitaComSlots: ["olhos"] },
    // 1381: arte nova
    // Orelhas e áudio
    { id: "brincos", nome: "Brincos", regiao: "orelhas", slot: "orelha", estado: "ativa" },
    { id: "fones", nome: "Fones e headsets", regiao: "orelhas", slot: "orelha", estado: "ativa" },
    // Pescoço
    { id: "colares", nome: "Colares e correntes", regiao: "pescoco", slot: "pescoco", estado: "ativa" },
    { id: "lencos", nome: "Cachecóis e lenços", regiao: "pescoco", slot: "pescoco", estado: "ativa" },
    { id: "insignias", nome: "Medalhas e crachás", regiao: "pescoco", slot: "pescoco", estado: "ativa" },
    { id: "gravatas", nome: "Gravatas", regiao: "pescoco", slot: "pescoco", estado: "ativa" },
    // 1381: arte nova
    // Costas e bolsas
    { id: "capas", nome: "Capas", regiao: "costas", slot: "costas", estado: "ativa" },
    { id: "mochilas", nome: "Mochilas", regiao: "costas", slot: "costas", estado: "ativa" },
    // onda 1403 (#153): população das subcategorias vazias (pedido do Jhony)
    { id: "bolsas", nome: "Mochilas e bolsas", regiao: "costas", slot: "costas", estado: "ativa" },
    { id: "asas", nome: "Asas", regiao: "costas", slot: "costas", estado: "ativa" },
    // 1381: arte nova
    // Especiais
    { id: "aureolas", nome: "Auréolas", regiao: "especiais", slot: "flutuante", estado: "ativa" },
    { id: "companheiros", nome: "Companheiros", regiao: "especiais", slot: "companheiro", estado: "ativa" },
    { id: "pets", nome: "Pets", regiao: "especiais", slot: "companheiro", estado: "ativa" },
    // 1381: arte nova
    // onda 1403 (#153): população das subcategorias vazias
    { id: "robos", nome: "Robôs", regiao: "especiais", slot: "companheiro", estado: "ativa" },
    { id: "espiritos", nome: "Espíritos", regiao: "especiais", slot: "companheiro", estado: "ativa" },
    { id: "runas", nome: "Runas e círculos", regiao: "especiais", slot: "flutuante", estado: "ativa" },
    // onda 1404 (#154, as6.slots_corpo): regiões CORPORAIS — subcategorias
    // ATIVAS com o gate da flag (subcategoriasCorporaisAtivas); a arte só
    // desenha no corpo inteiro (renderCorpo). Pares L/R: a subcategoria
    // pousa no lado ESQUERDO por padrão; o item declara o slot exato.
    { id: "pulseiras", nome: "Pulseiras e relógios", regiao: "bracos", slot: "pulso_e", estado: "ativa" },
    { id: "luvas-aneis", nome: "Luvas e anéis", regiao: "bracos", slot: "mao_e", estado: "ativa" },
    { id: "cintos", nome: "Cintos e faixas", regiao: "corpo-baixo", slot: "cintura", estado: "ativa" },
    { id: "tornozeleiras", nome: "Pernas e tornozelos", regiao: "corpo-baixo", slot: "pernas", estado: "ativa" },
    { id: "calcados", nome: "Calçados", regiao: "corpo-baixo", slot: "pes", estado: "ativa" }
  ];
  var SUBCATEGORIA_POR_ASSET = {
    ace_bone: "chapeus",
    ace_chapeu_mago: "chapeus",
    ace_gorro_natal: "chapeus",
    // taxonomia v2 (#146/§8 do briefing corretivo): coroa é ADORNO, não
    // cobertura — muda só a navegação; slot continua 'cabeca'
    ace_chapeu_bruxa: "chapeus",
    ace_coroa: "adornos-cabeca",
    ace_boina: "chapeus",
    ace_chifres_oni: "adornos-cabeca",
    ace_antena: "adornos-cabeca",
    ace_tiara_led: "adornos-cabeca",
    ace_oculos: "oculos",
    ace_oculos_sol: "oculos",
    ace_oculos_3d: "oculos",
    ace_monoculo: "oculos",
    ace_tapa_olho: "tapa-olhos",
    ace_viseira_vr: "headsets-vr",
    // onda 1381 (#148): arte nova
    ace_mascara_neon: "mascaras",
    ace_gravata_borboleta: "gravatas",
    ace_asas_energia: "asas",
    ace_gato_sombra: "pets",
    ace_pintura_guerra: "rosto-marcas",
    ace_piercing: "rosto-marcas",
    ace_brinco: "brincos",
    ace_fone: "fones",
    ace_headset: "fones",
    ace_corrente: "colares",
    ace_colar_perolas: "colares",
    ace_cachecol: "lencos",
    ace_lenco_bandana: "lencos",
    ace_medalha: "insignias",
    ace_cracha_dshow: "insignias",
    ace_capa_heroica: "capas",
    ace_mochila_jato: "mochilas",
    ace_aureola: "aureolas",
    ace_drone: "companheiros",
    // onda 1402 (#151): população Cabeça e Rosto — 20 artes novas
    ace_fedora: "chapeus",
    ace_cartola: "chapeus",
    ace_chapeu_cowboy: "chapeus",
    ace_chapeu_chef: "chapeus",
    ace_bandana_testa: "adornos-cabeca",
    ace_flor_lotus: "adornos-cabeca",
    ace_laco_fita: "adornos-cabeca",
    ace_diadema_perolas: "adornos-cabeca",
    ace_oculos_redondos: "oculos",
    ace_oculos_gatinho: "oculos",
    ace_viseira_esporte: "oculos",
    ace_oculos_pixel: "oculos",
    ace_capuz_sombrio: "capuzes",
    ace_capuz_ninja: "capuzes",
    ace_veu_mistico: "capuzes",
    ace_mascara_oni: "mascaras",
    ace_mascara_kitsune: "mascaras",
    ace_mascara_teatro: "mascaras",
    ace_medico_peste: "mascaras",
    ace_mascara_hoquei: "mascaras",
    // onda 1403 (#153): bolsas + robôs + espíritos + runas — 14 artes novas
    ace_bolsa_mensageiro: "bolsas",
    ace_bolsa_tatica: "bolsas",
    ace_bolsa_couro: "bolsas",
    ace_robo_assistente: "robos",
    ace_robo_bit: "robos",
    ace_robo_aranha: "robos",
    ace_robo_guardiao: "robos",
    ace_espirito_chama: "espiritos",
    ace_espirito_agua: "espiritos",
    ace_espirito_estelar: "espiritos",
    ace_runa_circulo: "runas",
    ace_runa_protecao: "runas",
    ace_runa_glifo: "runas",
    ace_runa_orbital: "runas",
    // onda 1404 (#154): artes-prova dos slots CORPORAIS (1 por slot)
    ace_relogio_pulso: "pulseiras",
    ace_pulseira_led: "pulseiras",
    ace_luva_couro: "luvas-aneis",
    ace_anel_sinete: "luvas-aneis",
    ace_cinto_couro: "cintos",
    ace_joelheiras: "tornozeleiras",
    ace_tenis_neon: "calcados"
  };
  var POR_ID2 = new Map(SUBCATEGORIAS_ACESSORIO.map((s) => [s.id, s]));
  function subcategoriaDoAsset(assetId) {
    const sub = SUBCATEGORIA_POR_ASSET[assetId];
    return sub ? POR_ID2.get(sub) : void 0;
  }
  var SLOTS_CORPORAIS = [
    "pulso_e",
    "pulso_d",
    "mao_e",
    "mao_d",
    "cintura",
    "pernas",
    "pes"
  ];
  function slotCorporal(s) {
    return SLOTS_CORPORAIS.includes(s);
  }
  function slotFinoDoAsset(assetId, slotLegado) {
    if (slotCorporal(slotLegado)) return slotLegado;
    return subcategoriaDoAsset(assetId)?.slot ?? slotLegado;
  }

  // public/components/panels/panel-avatar-studio/src/engine/partes/fundos.ts
  function estrelas(qtd, cor, semente) {
    let s = "";
    for (let i = 0; i < qtd; i++) {
      const x = (i * 73 + semente * 31) % 236 + 2;
      const y = (i * 47 + semente * 17) % 232 + 2;
      const r = 0.6 + i * 13 % 10 / 9;
      const o = 0.25 + i * 29 % 55 / 100;
      s += `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="${cor}" opacity="${o.toFixed(2)}"/>`;
    }
    return s;
  }
  var FUNDOS = [
    {
      id: "fun_estudio",
      categoria: "fundo",
      nome: "Estúdio",
      descricao: "Gradiente suave de estúdio, tingido pela cor de destaque.",
      raridade: "comum",
      tema: "clássico",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <radialGradient id="${u}fe" cx="0.5" cy="0.36" r="1">
          <stop offset="0" stop-color="${misturar("#232a3f", p.destaque.base, 0.28)}"/>
          <stop offset="1" stop-color="${escurecer("#171c2c", 0.35)}"/>
        </radialGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}fe)"/>
      <ellipse cx="120" cy="212" rx="120" ry="46" fill="${alfa("#000000", 0.28)}"/>`
    },
    {
      id: "fun_estrelas",
      categoria: "fundo",
      nome: "Campo Estelar",
      descricao: "Noite profunda com estrelas cintilantes.",
      raridade: "comum",
      tema: "espaço",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}fs" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0a0e1e"/>
          <stop offset="1" stop-color="${misturar("#101530", p.destaque.base, 0.16)}"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}fs)"/>
      ${estrelas(60, "#dfe6ff", 3)}
      ${estrelas(14, p.destaque.claro, 9)}`
    },
    {
      id: "fun_grade",
      categoria: "fundo",
      nome: "Synthwave",
      descricao: "Sol retrô sobre a grade infinita dos anos 80.",
      raridade: "incomum",
      tema: "retrô",
      usaCores: ["destaque"],
      render: (p, u) => {
        let linhas = "";
        for (let i = 0; i <= 8; i++) {
          const y = 150 + i * i * 1.6;
          linhas += `<line x1="0" y1="${y}" x2="240" y2="${y}" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="1"/>`;
        }
        for (let i = -4; i <= 4; i++) {
          linhas += `<line x1="${120 + i * 30}" y1="150" x2="${120 + i * 110}" y2="240" stroke="${alfa(p.destaque.base, 0.4)}" stroke-width="1"/>`;
        }
        return `
      <defs>
        <linearGradient id="${u}fg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#12081f"/>
          <stop offset="0.62" stop-color="${misturar("#2a1245", p.destaque.base, 0.25)}"/>
          <stop offset="0.63" stop-color="#0d0a18"/>
          <stop offset="1" stop-color="#0d0a18"/>
        </linearGradient>
        <linearGradient id="${u}fgsol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffd76e"/>
          <stop offset="1" stop-color="${p.destaque.base}"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}fg)"/>
      <circle cx="120" cy="150" r="52" fill="url(#${u}fgsol)" opacity="0.9"/>
      <rect x="60" y="118" width="120" height="4" fill="#12081f" opacity="0.85"/>
      <rect x="60" y="130" width="120" height="6" fill="#12081f" opacity="0.85"/>
      <rect x="55" y="144" width="130" height="8" fill="#12081f" opacity="0.85"/>
      ${linhas}`;
      }
    },
    {
      id: "fun_hex",
      categoria: "fundo",
      nome: "Colmeia Tech",
      descricao: "Malha hexagonal de engenharia com pulsos de luz.",
      raridade: "incomum",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p, u) => {
        let hexes = "";
        for (let lin = 0; lin < 7; lin++) {
          for (let col = 0; col < 6; col++) {
            const x = col * 44 + (lin % 2 ? 22 : 0) - 8;
            const y = lin * 38 - 6;
            const on = (lin * 7 + col * 3) % 11 === 0;
            hexes += `<path d="M${x + 22} ${y} l19 11 v22 l-19 11 l-19 -11 v-22 z" fill="${on ? alfa(p.destaque.base, 0.22) : "none"}" stroke="${alfa(p.destaque.base, on ? 0.7 : 0.22)}" stroke-width="1"/>`;
          }
        }
        return `
      <defs>
        <radialGradient id="${u}fh" cx="0.5" cy="0.3" r="1.1">
          <stop offset="0" stop-color="#141a2e"/>
          <stop offset="1" stop-color="#0a0d19"/>
        </radialGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}fh)"/>${hexes}`;
      }
    },
    {
      id: "fun_circuito",
      categoria: "fundo",
      nome: "Placa-Mãe",
      descricao: "Trilhas de circuito energizadas percorrendo o quadro.",
      raridade: "raro",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p, u) => {
        const t = alfa(p.destaque.base, 0.55);
        const nodo = (x, y) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#0c101d" stroke="${t}" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="1.3" fill="${p.destaque.claro}"/>`;
        return `
      <defs>
        <linearGradient id="${u}fc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0d1322"/>
          <stop offset="1" stop-color="#101a2c"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}fc)"/>
      <g stroke="${t}" stroke-width="1.6" fill="none" stroke-linecap="round">
        <path d="M10 34 h58 l20 20 v40"/>
        <path d="M230 52 h-64 l-16 16"/>
        <path d="M18 210 h44 l26 -26"/>
        <path d="M226 196 h-52 l-22 -22 v-24"/>
        <path d="M32 120 h-22"/>
        <path d="M232 120 h-18"/>
        <path d="M120 12 v20"/>
      </g>
      ${nodo(88, 94)}${nodo(150, 68)}${nodo(88, 184)}${nodo(152, 150)}${nodo(32, 120)}${nodo(214, 120)}${nodo(120, 32)}
      <rect x="6" y="6" width="228" height="228" rx="10" fill="none" stroke="${alfa(p.destaque.base, 0.2)}" stroke-width="1"/>`;
      }
    },
    {
      id: "fun_nebulosa",
      categoria: "fundo",
      nome: "Nebulosa",
      descricao: "Nuvens cósmicas coloridas com poeira estelar.",
      raridade: "raro",
      tema: "espaço",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <radialGradient id="${u}fn1" cx="0.28" cy="0.3" r="0.6">
          <stop offset="0" stop-color="${alfa(p.destaque.base, 0.55)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0)}"/>
        </radialGradient>
        <radialGradient id="${u}fn2" cx="0.75" cy="0.68" r="0.62">
          <stop offset="0" stop-color="${alfa("#2f6bff", 0.4)}"/>
          <stop offset="1" stop-color="${alfa("#2f6bff", 0)}"/>
        </radialGradient>
        <radialGradient id="${u}fn3" cx="0.62" cy="0.18" r="0.42">
          <stop offset="0" stop-color="${alfa("#ff5fa8", 0.3)}"/>
          <stop offset="1" stop-color="${alfa("#ff5fa8", 0)}"/>
        </radialGradient>
      </defs>
      <rect width="240" height="240" fill="#080b17"/>
      <rect width="240" height="240" fill="url(#${u}fn1)"/>
      <rect width="240" height="240" fill="url(#${u}fn2)"/>
      <rect width="240" height="240" fill="url(#${u}fn3)"/>
      ${estrelas(46, "#e8edff", 5)}${estrelas(10, p.destaque.claro, 11)}`
    },
    {
      id: "fun_aurora",
      categoria: "fundo",
      nome: "Aurora Boreal",
      descricao: "Cortinas de luz dançando no céu polar.",
      raridade: "epico",
      tema: "natureza",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}fa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#050914"/>
          <stop offset="1" stop-color="#0c1626"/>
        </linearGradient>
        <linearGradient id="${u}fa1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa("#39ffb0", 0)}"/>
          <stop offset="0.5" stop-color="${alfa("#39ffb0", 0.4)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0.06)}"/>
        </linearGradient>
        <linearGradient id="${u}fa2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.base, 0)}"/>
          <stop offset="0.55" stop-color="${alfa(p.destaque.base, 0.42)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0.05)}"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}fa)"/>
      <path d="M-10 30 C 50 80, 60 10, 120 66 S 200 40, 250 96 V 150 C 190 96, 170 150, 110 106 S 40 130, -10 84 Z" fill="url(#${u}fa1)"/>
      <path d="M-10 8 C 60 54, 90 -6, 150 40 S 220 16, 250 60 V 110 C 200 66, 160 112, 100 72 S 30 96, -10 52 Z" fill="url(#${u}fa2)"/>
      ${estrelas(38, "#dfe8ff", 7)}
      <path d="M0 240 l40 -34 l30 22 l50 -42 l44 30 l40 -26 l36 24 v26 z" fill="#070c16"/>`
    },
    {
      id: "fun_led_wall",
      categoria: "fundo",
      nome: "LED Wall Dshow",
      descricao: "O painel de LED da casa, vivo atrás de você.",
      raridade: "incomum",
      tema: "dshow",
      usaCores: ["destaque"],
      render: (p, u) => {
        let celulas = "";
        for (let lin = 0; lin < 10; lin++) {
          for (let col = 0; col < 10; col++) {
            const acesa = (lin * 7 + col * 11) % 13 < 3;
            if (!acesa) continue;
            const dur = (2 + (lin + col) % 4 * 0.6).toFixed(1);
            celulas += `<rect x="${col * 24 + 3}" y="${lin * 24 + 3}" width="18" height="18" rx="3" fill="${alfa(p.destaque.base, 0.5)}">
            <animate attributeName="opacity" values="0.5;0.12;0.5" dur="${dur}s" begin="${(lin * 3 + col) % 10 / 5}s" repeatCount="indefinite"/>
          </rect>`;
          }
        }
        return `
      <defs>
        <linearGradient id="${u}lw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0b0e18"/>
          <stop offset="1" stop-color="#131829"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}lw)"/>
      <g stroke="${alfa("#ffffff", 0.05)}" stroke-width="1">
        ${Array.from({ length: 9 }, (_, i) => `<line x1="${(i + 1) * 24}" y1="0" x2="${(i + 1) * 24}" y2="240"/><line x1="0" y1="${(i + 1) * 24}" x2="240" y2="${(i + 1) * 24}"/>`).join("")}
      </g>
      ${celulas}`;
      }
    },
    {
      id: "fun_lab",
      categoria: "fundo",
      nome: "Laboratório de IA",
      descricao: "Racks, vidro e o zumbido de mil inferências por segundo.",
      raridade: "raro",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}lab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0e1322"/>
          <stop offset="1" stop-color="#151b2e"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}lab)"/>
      <rect x="18" y="40" width="42" height="150" rx="5" fill="#171d30" stroke="${alfa("#ffffff", 0.08)}"/>
      <rect x="180" y="40" width="42" height="150" rx="5" fill="#171d30" stroke="${alfa("#ffffff", 0.08)}"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `
        <rect x="24" y="${50 + i * 23}" width="30" height="4" rx="2" fill="${alfa(p.destaque.base, 0.7)}">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="${(1.4 + i * 0.3).toFixed(1)}s" repeatCount="indefinite"/>
        </rect>
        <rect x="186" y="${50 + i * 23}" width="30" height="4" rx="2" fill="${alfa("#4cd97c", 0.6)}">
          <animate attributeName="opacity" values="0.6;0.15;0.6" dur="${(1.7 + i * 0.25).toFixed(1)}s" begin="0.4s" repeatCount="indefinite"/>
        </rect>`).join("")}
      <rect x="70" y="90" width="100" height="70" rx="6" fill="${alfa("#0a0d15", 0.8)}" stroke="${alfa(p.destaque.base, 0.35)}"/>
      <path d="M80 140 l 16 -18 l 14 8 l 18 -26 l 14 12 l 18 -20" stroke="${p.destaque.base}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <rect x="0" y="196" width="240" height="44" fill="#0a0d16"/>
      <line x1="0" y1="196" x2="240" y2="196" stroke="${alfa(p.destaque.base, 0.25)}" stroke-width="1.6"/>`
    },
    {
      id: "fun_dojo",
      categoria: "fundo",
      nome: "Dojo ao Entardecer",
      descricao: "Shoji, montanhas e o silêncio antes do treino.",
      raridade: "epico",
      tema: "oriental",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}dj" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${misturar("#2a1530", p.destaque.base, 0.18)}"/>
          <stop offset="0.55" stop-color="#4a1e33"/>
          <stop offset="0.56" stop-color="#1a0f16"/>
          <stop offset="1" stop-color="#120a10"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}dj)"/>
      <circle cx="168" cy="66" r="30" fill="#ff8a5c" opacity="0.9"/>
      <path d="M0 132 l 44 -36 l 38 30 l 30 -22 l 46 30 l 42 -26 l 40 26 v 30 h -240 z" fill="#241019"/>
      <g stroke="#0c0710" stroke-width="5">
        <line x1="30" y1="132" x2="30" y2="240"/>
        <line x1="210" y1="132" x2="210" y2="240"/>
      </g>
      <rect x="30" y="132" width="180" height="6" fill="#0c0710"/>
      <g fill="${alfa("#ffd9b8", 0.14)}" stroke="#0c0710" stroke-width="2">
        ${[0, 1, 2, 3].map((i) => `<rect x="${44 + i * 40}" y="146" width="30" height="72"/>`).join("")}
      </g>
      <path d="M60 240 q 60 -14 120 0 z" fill="#0c0710"/>`
    },
    {
      id: "fun_arena",
      categoria: "fundo",
      nome: "Arena E-Sports",
      descricao: "Holofotes e telões de uma grande final.",
      raridade: "lendario",
      tema: "gamer",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#05060d"/>
          <stop offset="1" stop-color="#101426"/>
        </linearGradient>
        <linearGradient id="${u}farf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.5)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0)}"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}far)"/>
      <path d="M34 0 l-30 150 h46 l14 -150 z" fill="url(#${u}farf)" opacity="0.7"/>
      <path d="M206 0 l30 150 h-46 l-14 -150 z" fill="url(#${u}farf)" opacity="0.7"/>
      <path d="M120 0 l-26 132 h52 z" fill="url(#${u}farf)" opacity="0.55"/>
      <g fill="${alfa(p.destaque.base, 0.9)}">
        <rect x="16" y="150" width="52" height="26" rx="3" opacity="0.35"/>
        <rect x="94" y="142" width="52" height="30" rx="3" opacity="0.5"/>
        <rect x="172" y="150" width="52" height="26" rx="3" opacity="0.35"/>
      </g>
      <g stroke="${alfa("#ffffff", 0.5)}" stroke-width="1.5">
        <line x1="16" y1="190" x2="224" y2="190"/>
        <line x1="4" y1="204" x2="236" y2="204"/>
      </g>
      ${estrelas(26, p.destaque.claro, 13)}`
    },
    // ── 4.6 F2 · Onda 2 (aparência) — 9 fundos novos ──────────────────
    {
      id: "fun_synthwave",
      categoria: "fundo",
      nome: "Pôr do Sol Synthwave",
      descricao: "O sol riscado que nunca termina de se pôr.",
      raridade: "raro",
      tema: "espaço",
      usaCores: ["destaque"],
      render: (p, u) => {
        let grade = "";
        for (let i = 0; i < 7; i++) {
          grade += `<line x1="${-60 + i * 60}" y1="240" x2="${60 + i * 30}" y2="152" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="1.4"/>`;
        }
        for (let j = 0; j < 5; j++) {
          grade += `<line x1="0" y1="${156 + j * j * 5}" x2="240" y2="${156 + j * j * 5}" stroke="${alfa(p.destaque.base, 0.45)}" stroke-width="1.2"/>`;
        }
        return `
      <defs>
        <linearGradient id="${u}sw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#160b2e"/>
          <stop offset="0.65" stop-color="${misturar("#2b0f45", p.destaque.base, 0.25)}"/>
          <stop offset="1" stop-color="#0c0716"/>
        </linearGradient>
        <linearGradient id="${u}sol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffd36e"/>
          <stop offset="1" stop-color="#ff5f8f"/>
        </linearGradient>
        <clipPath id="${u}solc"><path d="M64 152 h 112 v -80 h -112 z M64 158 h 112 v 4 h -112 z"/></clipPath>
      </defs>
      <rect width="240" height="240" fill="url(#${u}sw)"/>
      <circle cx="120" cy="140" r="46" fill="url(#${u}sol)" clip-path="url(#${u}solc)"/>
      <rect y="152" width="240" height="88" fill="#0c0716"/>
      ${grade}
      ${estrelas(18, "#ffd0e8", 5)}`;
      }
    },
    {
      id: "fun_biblioteca",
      categoria: "fundo",
      nome: "Biblioteca",
      descricao: "Estantes altas e silêncio produtivo.",
      raridade: "incomum",
      tema: "clássico",
      usaCores: ["destaque"],
      render: (p, u) => {
        let livros = "";
        const cores = ["#7a4a32", "#3e5a4a", p.destaque.base, "#8a6a3a", "#4a4a6a"];
        for (let pr = 0; pr < 3; pr++) {
          const y = 46 + pr * 58;
          for (let i = 0; i < 12; i++) {
            const x = 12 + i * 19;
            const alt2 = 30 + (i * 7 + pr * 5) % 12;
            livros += `<rect x="${x}" y="${y + 42 - alt2}" width="13" height="${alt2}" rx="2" fill="${cores[(i + pr) % 5]}" opacity="0.85"/>`;
          }
          livros += `<rect x="4" y="${y + 44}" width="232" height="6" fill="#2b2118"/>`;
        }
        return `
      <defs>
        <linearGradient id="${u}bib" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#241a12"/>
          <stop offset="1" stop-color="#120d08"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}bib)"/>
      ${livros}
      <rect width="240" height="240" fill="${alfa("#000000", 0.25)}"/>
      <ellipse cx="120" cy="120" rx="120" ry="110" fill="${alfa(misturar("#f9d9a0", p.destaque.base, 0.2), 0.09)}"/>`;
      }
    },
    {
      id: "fun_chuva",
      categoria: "fundo",
      nome: "Noite Chuvosa",
      descricao: "Vidro molhado e a cidade desfocada lá fora.",
      raridade: "raro",
      tema: "urbano",
      usaCores: ["destaque"],
      render: (p, u) => {
        let gotas = "";
        for (let i = 0; i < 16; i++) {
          const x = i * 61 % 232 + 4;
          const y = i * 37 % 200 + 8;
          gotas += `<line x1="${x}" y1="${y}" x2="${x - 3}" y2="${y + 14}" stroke="${alfa("#9fc4ff", 0.4)}" stroke-width="1.6" stroke-linecap="round">
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="${(1.4 + i % 5 * 0.3).toFixed(1)}s" repeatCount="indefinite"/>
        </line>`;
        }
        let bokeh = "";
        for (let i = 0; i < 8; i++) {
          const x = i * 89 % 220 + 10;
          const y = 60 + i * 53 % 120;
          bokeh += `<circle cx="${x}" cy="${y}" r="${6 + i % 4 * 3}" fill="${alfa(i % 2 ? p.destaque.base : "#ffb054", 0.18)}"/>`;
        }
        return `
      <defs>
        <linearGradient id="${u}chn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0b101e"/>
          <stop offset="1" stop-color="#141b30"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}chn)"/>
      ${bokeh}${gotas}`;
      }
    },
    {
      id: "fun_praia",
      categoria: "fundo",
      nome: "Praia Pixel",
      descricao: "Férias em 16 bits — protetor solar incluso.",
      raridade: "incomum",
      tema: "casual",
      render: () => `
      <rect width="240" height="150" fill="#7ec8ff"/>
      <rect y="110" width="240" height="16" fill="#5db2f0"/>
      <rect y="126" width="240" height="42" fill="#2a7fd4"/>
      <rect y="150" width="240" height="10" fill="#7fd4e8"/>
      <rect y="168" width="240" height="72" fill="#f2dca2"/>
      <rect y="164" width="240" height="6" fill="#fff2c8"/>
      <rect x="176" y="24" width="28" height="28" fill="#ffd75e"/>
      <rect x="184" y="16" width="12" height="8" fill="#ffd75e"/>
      <rect x="184" y="52" width="12" height="8" fill="#ffd75e"/>
      <rect x="168" y="32" width="8" height="12" fill="#ffd75e"/>
      <rect x="204" y="32" width="8" height="12" fill="#ffd75e"/>
      <rect x="24" y="60" width="40" height="10" fill="#ffffff" opacity="0.9"/>
      <rect x="34" y="52" width="24" height="8" fill="#ffffff" opacity="0.9"/>
      <rect x="90" y="84" width="34" height="8" fill="#ffffff" opacity="0.7"/>`
    },
    {
      id: "fun_montanhas",
      categoria: "fundo",
      nome: "Montanhas",
      descricao: "Ar puro e sinal de wi-fi surpreendentemente bom.",
      raridade: "comum",
      tema: "aventura",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}ceu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${misturar("#8fb7e8", p.destaque.base, 0.15)}"/>
          <stop offset="1" stop-color="#dcebf7"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}ceu)"/>
      <path d="M0 190 l 55 -90 l 40 62 l 35 -52 l 50 80 l 60 -70 v 120 h -240 z" fill="#3c556e"/>
      <path d="M55 100 l 14 24 l -10 2 l -8 -12 z" fill="#eef4fa"/>
      <path d="M130 110 l 12 20 l -9 1 l -7 -10 z" fill="#eef4fa"/>
      <path d="M0 210 l 60 -60 l 60 55 l 55 -45 l 65 50 v 30 h -240 z" fill="#22374c"/>
      <ellipse cx="60" cy="52" rx="26" ry="9" fill="#ffffff" opacity="0.85"/>
      <ellipse cx="170" cy="38" rx="20" ry="7" fill="#ffffff" opacity="0.7"/>`
    },
    {
      id: "fun_escritorio",
      categoria: "fundo",
      nome: "Escritório Noturno",
      descricao: "A cidade acesa atrás da última entrega do dia.",
      raridade: "comum",
      tema: "executivo",
      usaCores: ["destaque"],
      render: (p, u) => {
        let janelas = "";
        for (let i = 0; i < 30; i++) {
          const x = 20 + i % 6 * 34;
          const y = 40 + Math.floor(i / 6) * 26;
          const acesa = i * 13 % 7 < 3;
          janelas += `<rect x="${x}" y="${y}" width="18" height="14" rx="1.5" fill="${acesa ? alfa("#ffd75e", 0.7) : alfa("#28324a", 0.9)}"/>`;
        }
        return `
      <defs>
        <linearGradient id="${u}esc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0d1322"/>
          <stop offset="1" stop-color="${misturar("#1a2338", p.destaque.base, 0.12)}"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}esc)"/>
      <rect x="10" y="30" width="220" height="140" rx="6" fill="#131b2e" stroke="#232d47" stroke-width="3"/>
      ${janelas}
      <rect y="176" width="240" height="64" fill="#181f31"/>
      <rect x="0" y="172" width="240" height="6" fill="#2b3550"/>`;
      }
    },
    {
      id: "fun_codigo",
      categoria: "fundo",
      nome: "Cascata de Código",
      descricao: "As colunas verdes que explicam tudo.",
      raridade: "epico",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p, u) => {
        let colunas = "";
        for (let i = 0; i < 12; i++) {
          const x = 8 + i * 20;
          const alt2 = 60 + i * 37 % 120;
          colunas += `<rect x="${x}" y="0" width="3" height="${alt2}" fill="url(#${u}cod)" opacity="${(0.3 + i % 5 * 0.12).toFixed(2)}">
          <animate attributeName="height" values="${alt2};${alt2 + 60};${alt2}" dur="${(2 + i % 4 * 0.6).toFixed(1)}s" repeatCount="indefinite"/>
        </rect>`;
        }
        return `
      <defs>
        <linearGradient id="${u}cod" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.base, 0)}"/>
          <stop offset="0.7" stop-color="${p.destaque.base}"/>
          <stop offset="1" stop-color="#ffffff"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="#050a08"/>
      ${colunas}
      <rect width="240" height="240" fill="${alfa("#000000", 0.15)}"/>`;
      }
    },
    {
      id: "fun_forja",
      categoria: "fundo",
      nome: "Forja Vulcânica",
      descricao: "Onde os itens lendários são temperados.",
      raridade: "lendario",
      tema: "fantasia",
      render: (_p, u) => `
      <defs>
        <linearGradient id="${u}for" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1a0d08"/>
          <stop offset="0.7" stop-color="#3a140a"/>
          <stop offset="1" stop-color="#7a2408"/>
        </linearGradient>
        <linearGradient id="${u}lava" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffb54d"/>
          <stop offset="1" stop-color="#ff5230"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}for)"/>
      <path d="M0 150 l 50 -70 l 45 55 l 50 -65 l 55 70 l 40 -40 v 140 h -240 z" fill="#12080a"/>
      <path d="M0 208 q 60 -14 120 0 t 120 0 v 32 h -240 z" fill="url(#${u}lava)">
        <animate attributeName="opacity" values="1;0.8;1" dur="3s" repeatCount="indefinite"/>
      </path>
      <circle cx="60" cy="190" r="2.4" fill="#ffb54d"><animate attributeName="cy" values="190;168;190" dur="2.8s" repeatCount="indefinite"/></circle>
      <circle cx="150" cy="196" r="1.8" fill="#ff8a4d"><animate attributeName="cy" values="196;172;196" dur="3.4s" repeatCount="indefinite"/></circle>
      <circle cx="196" cy="192" r="2.2" fill="#ffd75e"><animate attributeName="cy" values="192;170;192" dur="2.4s" repeatCount="indefinite"/></circle>`
    },
    {
      id: "fun_hangar",
      categoria: "fundo",
      nome: "Hangar Nexus",
      descricao: "A baia de lançamento da frota Dshow.",
      raridade: "epico",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}han" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0e1420"/>
          <stop offset="1" stop-color="#1c2536"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}han)"/>
      <path d="M20 0 v 168 M220 0 v 168 M60 0 v 168 M180 0 v 168" stroke="#28324a" stroke-width="6"/>
      <path d="M0 30 h 240 M0 90 h 240" stroke="#28324a" stroke-width="4"/>
      <path d="M0 168 h 240 v 8 h -240 z" fill="#2b3550"/>
      <path d="M0 176 l 240 34 v 30 h -240 z" fill="#161d2c"/>
      <path d="M30 176 l 30 40 M105 182 l 18 34 M180 190 l 8 28" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="2"/>
      <circle cx="40" cy="60" r="5" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="200" cy="60" r="5" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
      </circle>
      <rect x="84" y="44" width="72" height="32" rx="4" fill="${alfa(p.destaque.base, 0.16)}" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="1.6"/>
      <path d="M92 52 h 40 M92 60 h 28 M92 68 h 34" stroke="${alfa(p.destaque.claro, 0.6)}" stroke-width="2"/>`
    }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/partes/molduras.ts
  var R = 26;
  var MOLDURAS = [
    {
      id: "mol_aro",
      categoria: "moldura",
      nome: "Aro Clean",
      descricao: "Contorno fino e elegante.",
      raridade: "comum",
      tema: "clássico",
      usaCores: ["destaque"],
      render: (p) => `
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="${p.destaque.base}" stroke-width="4"/>`
    },
    {
      id: "mol_duplo",
      categoria: "moldura",
      nome: "Aro Duplo",
      descricao: "Linha dupla com respiro interno.",
      raridade: "incomum",
      tema: "clássico",
      usaCores: ["destaque"],
      render: (p) => `
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="${p.destaque.base}" stroke-width="3.4"/>
      <rect x="10" y="10" width="220" height="220" rx="${R - 6}" fill="none" stroke="${alfa(p.destaque.base, 0.45)}" stroke-width="1.6"/>`
    },
    {
      id: "mol_tech",
      categoria: "moldura",
      nome: "Cantos Táticos",
      descricao: "Suportes de HUD nos quatro cantos.",
      raridade: "raro",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p) => {
        const c = p.destaque.base;
        return `
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${alfa(c, 0.35)}" stroke-width="2"/>
      <g stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round">
        <path d="M8 42 v-16 a 18 18 0 0 1 18 -18 h 16"/>
        <path d="M232 42 v-16 a 18 18 0 0 0 -18 -18 h -16"/>
        <path d="M8 198 v 16 a 18 18 0 0 0 18 18 h 16"/>
        <path d="M232 198 v 16 a 18 18 0 0 1 -18 18 h -16"/>
      </g>
      <circle cx="120" cy="8" r="3" fill="${c}"/>
      <circle cx="120" cy="232" r="3" fill="${c}"/>`;
      }
    },
    {
      id: "mol_neon",
      categoria: "moldura",
      nome: "Neon Pulsante",
      descricao: "Tubo de neon vivo respirando luz.",
      raridade: "epico",
      tema: "cyberpunk",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <filter id="${u}blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4"/>
        </filter>
      </defs>
      <rect x="5" y="5" width="230" height="230" rx="${R}" fill="none" stroke="${p.destaque.base}" stroke-width="7" filter="url(#${u}blur)" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.35;0.8" dur="2.6s" repeatCount="indefinite"/>
      </rect>
      <rect x="5" y="5" width="230" height="230" rx="${R}" fill="none" stroke="${p.destaque.claro}" stroke-width="2.6"/>`
    },
    {
      id: "mol_ouro",
      categoria: "moldura",
      nome: "Ouro Imperial",
      descricao: "Moldura lendária cravejada de gemas.",
      raridade: "lendario",
      tema: "fantasia",
      render: (_p, u) => `
      <defs>
        <linearGradient id="${u}ouro" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffe89a"/>
          <stop offset="0.35" stop-color="#e8b64c"/>
          <stop offset="0.65" stop-color="#b07d1e"/>
          <stop offset="1" stop-color="#ffe89a"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="url(#${u}ouro)" stroke-width="7"/>
      <rect x="10" y="10" width="220" height="220" rx="${R - 6}" fill="none" stroke="${alfa("#8a5f10", 0.55)}" stroke-width="1.6"/>
      <circle cx="120" cy="7" r="4" fill="#ff5f8f" stroke="#8a5f10" stroke-width="1"/>
      <circle cx="120" cy="233" r="4" fill="#4cd9e8" stroke="#8a5f10" stroke-width="1"/>
      <circle cx="7" cy="120" r="4" fill="#7ce87c" stroke="#8a5f10" stroke-width="1"/>
      <circle cx="233" cy="120" r="4" fill="#c99aff" stroke="#8a5f10" stroke-width="1"/>`
    },
    {
      id: "mol_rgb",
      categoria: "moldura",
      nome: "LED RGB",
      descricao: "O aro gamer clássico — todas as cores, o tempo todo.",
      raridade: "raro",
      tema: "gamer",
      render: (_p, u) => `
      <defs>
        <linearGradient id="${u}rgb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ff5f6e"/>
          <stop offset="0.25" stop-color="#ffb74c"/>
          <stop offset="0.5" stop-color="#4cd97c"/>
          <stop offset="0.75" stop-color="#4c9de8"/>
          <stop offset="1" stop-color="#b06ce8"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="url(#${u}rgb)" stroke-width="5">
        <animate attributeName="opacity" values="1;0.55;1" dur="3.2s" repeatCount="indefinite"/>
      </rect>
      <rect x="10" y="10" width="220" height="220" rx="${R - 6}" fill="none" stroke="url(#${u}rgb)" stroke-width="1.4" opacity="0.4"/>`
    },
    {
      id: "mol_cristal",
      categoria: "moldura",
      nome: "Cristal Mítico",
      descricao: "Lascas de gelo eterno cravadas no quadro.",
      raridade: "mitico",
      tema: "fantasia",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}cri" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#dff4ff"/>
          <stop offset="0.5" stop-color="${p.destaque.claro}"/>
          <stop offset="1" stop-color="${p.destaque.profundo}"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="url(#${u}cri)" stroke-width="5"/>
      <g fill="url(#${u}cri)" stroke="${alfa("#ffffff", 0.5)}" stroke-width="1">
        <path d="M120 2 l 10 12 l -10 12 l -10 -12 z"/>
        <path d="M120 214 l 9 11 l -9 12 l -9 -12 z"/>
        <path d="M2 120 l 12 -10 l 12 10 l -12 10 z"/>
        <path d="M214 120 l 12 -9 l 12 9 l -12 9 z"/>
        <path d="M28 22 l 9 8 l -5 11 l -11 -7 z"/>
        <path d="M212 22 l -9 8 l 5 11 l 11 -7 z"/>
        <path d="M28 218 l 9 -8 l -5 -11 l -11 7 z"/>
        <path d="M212 218 l -9 -8 l 5 -11 l 11 7 z"/>
      </g>
      <path d="M120 6 l 6 8 l -6 7" stroke="${alfa("#ffffff", 0.7)}" stroke-width="1.4" fill="none"/>`
    },
    {
      id: "mol_pioneiro",
      categoria: "moldura",
      nome: "Pioneiro",
      descricao: "A moldura de quem criou a própria identidade primeiro.",
      raridade: "epico",
      tema: "conquista",
      usaCores: ["destaque"],
      bloqueadoPor: "conquista:primeiro_avatar",
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}pio" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#d8deea"/>
          <stop offset="0.5" stop-color="#8a94ab"/>
          <stop offset="1" stop-color="#d8deea"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="url(#${u}pio)" stroke-width="6"/>
      <circle cx="120" cy="8" r="11" fill="url(#${u}pio)" stroke="#5b6578" stroke-width="1.4"/>
      <path d="M117 3 l 3 -2 v 13 h -3 m 0 0 h 7" stroke="${p.destaque.profundo}" stroke-width="2.2" fill="none"/>
      <rect x="10" y="10" width="220" height="220" rx="${R - 6}" fill="none" stroke="${alfa(p.destaque.base, 0.35)}" stroke-width="1.4"/>`
    },
    {
      id: "mol_dshow",
      categoria: "moldura",
      nome: "Exclusiva Dshow",
      descricao: "Moldura assinada da casa — edição exclusiva.",
      raridade: "exclusivo",
      tema: "dshow",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}dsh" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${p.destaque.claro}"/>
          <stop offset="0.5" stop-color="${p.destaque.base}"/>
          <stop offset="1" stop-color="#e8b64c"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="url(#${u}dsh)" stroke-width="5.5"/>
      <path d="M92 232 h 56" stroke="#0c0f18" stroke-width="10" stroke-linecap="round"/>
      <text x="120" y="236.5" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="700" fill="url(#${u}dsh)" letter-spacing="2">DSHOW</text>`
    },
    // ── 4.6 F2 · Onda 2 — 6 molduras novas (comportamento cresce com a
    //    raridade, §7.3: comum = estática · épico+ = viva/animada) ─────
    {
      id: "mol_madeira",
      categoria: "moldura",
      nome: "Madeira de Lei",
      descricao: "Clássica, quente e impossível de sair de moda.",
      raridade: "comum",
      tema: "clássico",
      render: (_p, u) => `
      <defs>
        <linearGradient id="${u}mad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#9a6a3a"/>
          <stop offset="0.5" stop-color="#6a4426"/>
          <stop offset="1" stop-color="#4a2d18"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="url(#${u}mad)" stroke-width="8"/>
      <rect x="8" y="8" width="224" height="224" rx="${R - 5}" fill="none" stroke="${alfa("#2b1a0e", 0.6)}" stroke-width="1.6"/>
      <path d="M30 5 q 30 3 60 0 M150 235 q 30 -3 60 0" stroke="${alfa("#ffdca8", 0.25)}" stroke-width="2" fill="none"/>`
    },
    {
      id: "mol_selo",
      categoria: "moldura",
      nome: "Selo Oficial",
      descricao: "Carimbo de autenticidade no canto do quadro.",
      raridade: "incomum",
      tema: "executivo",
      usaCores: ["destaque"],
      render: (p) => `
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="${p.destaque.base}" stroke-width="3.6"/>
      <circle cx="206" cy="206" r="20" fill="${p.destaque.profundo}" stroke="${p.destaque.claro}" stroke-width="2.4"/>
      <circle cx="206" cy="206" r="14" fill="none" stroke="${alfa("#ffffff", 0.5)}" stroke-width="1.4" stroke-dasharray="3 3"/>
      <path d="M199 206 l 5 5 l 9 -10" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    },
    {
      id: "mol_louros",
      categoria: "moldura",
      nome: "Louros da Vitória",
      descricao: "Folhas de quem subiu no pódio e pretende voltar.",
      raridade: "raro",
      tema: "esportivo",
      render: (_p, u) => {
        let folhas = "";
        for (let lado = 0; lado < 2; lado++) {
          const dir = lado === 0 ? 1 : -1;
          for (let i = 0; i < 7; i++) {
            const t = i / 6;
            const ang = 150 - t * 120;
            const rad = ang * Math.PI / 180;
            const x = 120 - dir * Math.cos(rad) * 108;
            const yy = 122 - Math.sin(rad) * 104;
            folhas += `<ellipse cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" rx="10" ry="4.4" fill="url(#${u}lou)" transform="rotate(${(dir * (30 + t * 90)).toFixed(0)} ${x.toFixed(1)} ${yy.toFixed(1)})"/>`;
          }
        }
        return `
      <defs>
        <linearGradient id="${u}lou" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#6fae5c"/>
          <stop offset="1" stop-color="#3a7a34"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="#3a7a34" stroke-width="3"/>
      ${folhas}
      <circle cx="120" cy="228" r="7" fill="#e8b64c" stroke="#b07d1e" stroke-width="1.6"/>`;
      }
    },
    {
      id: "mol_circuito",
      categoria: "moldura",
      nome: "Circuito Vivo",
      descricao: "Trilhas energizadas percorrendo o contorno.",
      raridade: "epico",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p) => `
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${alfa(p.destaque.profundo, 0.9)}" stroke-width="5"/>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${p.destaque.claro}" stroke-width="2.2" stroke-dasharray="26 210">
        <animate attributeName="stroke-dashoffset" values="0;-944" dur="6s" repeatCount="indefinite"/>
      </rect>
      <circle cx="120" cy="4" r="4" fill="${p.destaque.base}"><animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite"/></circle>
      <circle cx="120" cy="236" r="4" fill="${p.destaque.base}"><animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite"/></circle>
      <circle cx="4" cy="120" r="4" fill="${p.destaque.base}"/>
      <circle cx="236" cy="120" r="4" fill="${p.destaque.base}"/>
      <path d="M30 12 h 24 l 8 -8 M186 228 h 24 l 8 8" stroke="${alfa(p.destaque.base, 0.7)}" stroke-width="2" fill="none"/>`
    },
    {
      id: "mol_chamas",
      categoria: "moldura",
      nome: "Chamas Eternas",
      descricao: "O contorno queima — o conteúdo ainda mais.",
      raridade: "lendario",
      tema: "fantasia",
      render: (_p, u) => {
        let chamas = "";
        for (let i = 0; i < 8; i++) {
          const x = 26 + i * 27;
          chamas += `<path d="M${x} 238 q -6 -14 0 -24 q 3 6 6 8 q 4 -8 2 -16 q 8 10 6 22 q -2 8 -14 10 z" fill="url(#${u}fla)" opacity="0.9">
          <animateTransform attributeName="transform" type="scale" values="1 1;1 ${(1.12 + i % 3 * 0.06).toFixed(2)};1 1" dur="${(1.2 + i % 4 * 0.25).toFixed(2)}s" repeatCount="indefinite" additive="sum"/>
        </path>`;
        }
        return `
      <defs>
        <linearGradient id="${u}fla" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#ff5230"/>
          <stop offset="0.6" stop-color="#ff8a3d"/>
          <stop offset="1" stop-color="#ffd75e"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="#ff5230" stroke-width="4.4"/>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="#ffd75e" stroke-width="1.6" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite"/>
      </rect>
      ${chamas}`;
      }
    },
    {
      id: "mol_glitch",
      categoria: "moldura",
      nome: "Glitch Dimensional",
      descricao: "O quadro não decide em qual realidade ficar.",
      raridade: "mitico",
      bloqueadoPor: "conquista:centuriao_100",
      tema: "cyberpunk",
      usaCores: ["destaque"],
      render: (p) => `
      <rect x="6" y="6" width="228" height="228" rx="${R}" fill="none" stroke="#ff2e63" stroke-width="3" opacity="0.8">
        <animateTransform attributeName="transform" type="translate" values="0 0;-3 1;2 -1;0 0" dur="0.9s" repeatCount="indefinite" calcMode="discrete"/>
      </rect>
      <rect x="6" y="6" width="228" height="228" rx="${R}" fill="none" stroke="#2ee6ff" stroke-width="3" opacity="0.8">
        <animateTransform attributeName="transform" type="translate" values="0 0;3 -1;-2 1;0 0" dur="0.9s" repeatCount="indefinite" calcMode="discrete"/>
      </rect>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${p.destaque.base}" stroke-width="4"/>
      <path d="M4 84 h 14 M4 92 h 8 M236 148 h -14 M236 156 h -8" stroke="#ffffff" stroke-width="3">
        <animate attributeName="opacity" values="1;0;1;0;1" dur="1.4s" repeatCount="indefinite" calcMode="discrete"/>
      </path>`
    },
    // ── 4.6 F2 · Onda 5 — 9 molduras novas (meta §28: 24 ✓) ───────────
    {
      id: "mol_minimal",
      categoria: "moldura",
      nome: "Fio Minimal",
      descricao: "Um traço fino. Nada mais é necessário.",
      raridade: "comum",
      tema: "clássico",
      render: () => `
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${alfa("#c4c9d6", 0.65)}" stroke-width="2"/>`
    },
    {
      id: "mol_pontilhada",
      categoria: "moldura",
      nome: "Pontilhada",
      descricao: "Recorte aqui — mas só se for para emoldurar.",
      raridade: "comum",
      tema: "casual",
      usaCores: ["destaque"],
      render: (p) => `
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${p.destaque.base}" stroke-width="3" stroke-dasharray="1 9" stroke-linecap="round"/>`
    },
    {
      id: "mol_degrade",
      categoria: "moldura",
      nome: "Degradê Duplo",
      descricao: "Duas cores escorrendo pelo contorno.",
      raridade: "incomum",
      tema: "casual",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}mdg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${p.destaque.claro}"/>
          <stop offset="1" stop-color="${p.destaque.profundo}"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="234" height="234" rx="${R}" fill="none" stroke="url(#${u}mdg)" stroke-width="5"/>
      <rect x="9" y="9" width="222" height="222" rx="${R - 5}" fill="none" stroke="${alfa(p.destaque.base, 0.3)}" stroke-width="1.6"/>`
    },
    {
      id: "mol_colmeia",
      categoria: "moldura",
      nome: "Colmeia",
      descricao: "Hexágonos disciplinados guardando os cantos.",
      raridade: "raro",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p) => {
        const hex = (x, y, r, o) => {
          let d = "";
          for (let i = 0; i < 6; i++) {
            const a = Math.PI / 3 * i - Math.PI / 6;
            d += `${i === 0 ? "M" : "L"}${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)} `;
          }
          return `<path d="${d}z" fill="none" stroke="${alfa(p.destaque.base, o)}" stroke-width="2"/>`;
        };
        return `
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${alfa(p.destaque.base, 0.75)}" stroke-width="3.4"/>
      ${hex(24, 24, 12, 0.9)}${hex(43, 15, 8, 0.5)}${hex(15, 43, 8, 0.5)}
      ${hex(216, 216, 12, 0.9)}${hex(197, 225, 8, 0.5)}${hex(225, 197, 8, 0.5)}`;
      }
    },
    {
      id: "mol_vetores",
      categoria: "moldura",
      nome: "Vetores",
      descricao: "Setas de alinhamento apontando para quem importa.",
      raridade: "raro",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p) => `
      <rect x="6" y="6" width="228" height="228" rx="${R}" fill="none" stroke="${alfa(p.destaque.base, 0.6)}" stroke-width="2.4"/>
      <g stroke="${p.destaque.claro}" stroke-width="3" fill="none" stroke-linecap="round">
        <path d="M20 34 v -14 h 14 M206 20 h 14 v 14 M220 206 v 14 h -14 M34 220 h -14 v -14">
          <animate attributeName="opacity" values="1;0.45;1" dur="2.6s" repeatCount="indefinite"/>
        </path>
      </g>`
    },
    {
      id: "mol_geada",
      categoria: "moldura",
      nome: "Geada",
      descricao: "Cristais de gelo avançando pelas bordas.",
      raridade: "epico",
      tema: "clima",
      render: (_p, u) => `
      <defs>
        <linearGradient id="${u}gel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#bfe8ff"/>
          <stop offset="1" stop-color="#5da8d8"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="url(#${u}gel)" stroke-width="4.4"/>
      <g fill="none" stroke="#dff4ff" stroke-width="2" stroke-linecap="round" opacity="0.9">
        <path d="M10 60 l 14 -8 m -14 -6 l 18 2 m -18 -16 l 12 6"/>
        <path d="M230 180 l -14 8 m 14 6 l -18 -2 m 18 16 l -12 -6"/>
        <path d="M60 10 l -6 14 m 14 -14 l -2 18 m 16 -18 l -6 12"/>
        <path d="M180 230 l 6 -14 m -14 14 l 2 -18 m -16 18 l 6 -12"/>
        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="3.2s" repeatCount="indefinite"/>
      </g>`
    },
    {
      id: "mol_espinhos",
      categoria: "moldura",
      nome: "Espinhos",
      descricao: "Bela por fora, intransponível por definição.",
      raridade: "epico",
      tema: "fantasia",
      usaCores: ["destaque"],
      render: (p) => {
        let espinhos = "";
        for (let i = 0; i < 8; i++) {
          const x = 36 + i * 24;
          espinhos += `<path d="M${x} 5 l 5 -0.5 l -2.5 -8 z M${x + 10} 235 l 5 0.5 l -2.5 8 z" fill="${p.destaque.profundo}"/>`;
        }
        return `
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${p.destaque.profundo}" stroke-width="4.4"/>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${alfa(p.destaque.claro, 0.35)}" stroke-width="1.4"/>
      ${espinhos}`;
      }
    },
    {
      id: "mol_serpente",
      categoria: "moldura",
      nome: "Serpente de Luz",
      descricao: "Duas serpentes luminosas se perseguindo para sempre.",
      raridade: "lendario",
      tema: "fantasia",
      usaCores: ["destaque"],
      render: (p) => `
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${alfa(p.destaque.profundo, 0.55)}" stroke-width="4"/>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${p.destaque.claro}" stroke-width="3" stroke-dasharray="60 412" stroke-linecap="round">
        <animate attributeName="stroke-dashoffset" values="0;-944" dur="7s" repeatCount="indefinite"/>
      </rect>
      <rect x="4" y="4" width="232" height="232" rx="${R}" fill="none" stroke="${alfa("#ffffff", 0.85)}" stroke-width="3" stroke-dasharray="60 412" stroke-linecap="round">
        <animate attributeName="stroke-dashoffset" values="-472;-1416" dur="7s" repeatCount="indefinite"/>
      </rect>`
    },
    {
      id: "mol_constelacao",
      categoria: "moldura",
      nome: "Constelação",
      descricao: "Estrelas ligadas em volta — o mapa aponta para você.",
      raridade: "lendario",
      tema: "espaço",
      render: () => {
        const pontos = [
          [30, 10],
          [90, 6],
          [160, 12],
          [228, 34],
          [234, 110],
          [228, 186],
          [180, 230],
          [100, 234],
          [30, 226],
          [8, 150],
          [6, 70]
        ];
        let linhas = "";
        let estrelas2 = "";
        for (let i = 0; i < pontos.length; i++) {
          const [x, y] = pontos[i];
          const [x2, y2] = pontos[(i + 1) % pontos.length];
          linhas += `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="rgba(200,220,255,0.35)" stroke-width="1.2"/>`;
          estrelas2 += `<circle cx="${x}" cy="${y}" r="${2 + i % 3}" fill="#fff2c8">
          <animate attributeName="opacity" values="1;0.35;1" dur="${(2 + i % 4 * 0.6).toFixed(1)}s" repeatCount="indefinite"/>
        </circle>`;
        }
        return `${linhas}${estrelas2}`;
      }
    }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/partes/efeitos.ts
  var EFEITOS = [
    {
      id: "efe_aura",
      categoria: "efeito",
      nome: "Aura de Poder",
      descricao: "Halo de energia irradiando atrás do personagem.",
      raridade: "raro",
      tema: "fantasia",
      usaCores: ["destaque"],
      atras: true,
      render: (p, u) => `
      <defs>
        <radialGradient id="${u}aura" cx="0.5" cy="0.55" r="0.55">
          <stop offset="0" stop-color="${alfa(p.destaque.claro, 0.55)}"/>
          <stop offset="0.6" stop-color="${alfa(p.destaque.base, 0.28)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0)}"/>
        </radialGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}aura)">
        <animate attributeName="opacity" values="1;0.6;1" dur="3.4s" repeatCount="indefinite"/>
      </rect>`
    },
    {
      id: "efe_chuva",
      categoria: "efeito",
      nome: "Chuva Digital",
      descricao: "Colunas de código escorrendo atrás de você.",
      raridade: "raro",
      tema: "cyberpunk",
      usaCores: ["destaque"],
      atras: true,
      render: (p, u) => {
        let colunas = "";
        for (let i = 0; i < 9; i++) {
          const x = 14 + i * 26;
          const alt = 40 + i * 37 % 60;
          const dur = (2.2 + i * 13 % 20 / 10).toFixed(1);
          const atraso = i * 7 % 20 / 10;
          colunas += `
        <line x1="${x}" y1="-${alt}" x2="${x}" y2="0" stroke="url(#${u}chv)" stroke-width="2.4">
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 ${240 + alt}" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </line>`;
        }
        return `
      <defs>
        <linearGradient id="${u}chv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${alfa(p.destaque.base, 0)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.claro, 0.8)}"/>
        </linearGradient>
      </defs>${colunas}`;
      }
    },
    {
      id: "efe_scanlines",
      categoria: "efeito",
      nome: "Scanlines CRT",
      descricao: "Textura de monitor retrô sobre a cena.",
      raridade: "incomum",
      tema: "retrô",
      render: (_p, u) => `
      <defs>
        <pattern id="${u}scan" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="1.4" fill="rgba(0,0,0,0.22)"/>
        </pattern>
      </defs>
      <rect width="240" height="240" fill="url(#${u}scan)"/>
      <rect width="240" height="240" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="16"/>`
    },
    {
      id: "efe_particulas",
      categoria: "efeito",
      nome: "Partículas Flutuantes",
      descricao: "Pontos de luz subindo lentamente pelas bordas.",
      raridade: "raro",
      tema: "fantasia",
      usaCores: ["destaque"],
      render: (p) => {
        let pts = "";
        const pos = [
          [18, 200],
          [34, 150],
          [22, 96],
          [44, 52],
          [206, 190],
          [222, 140],
          [214, 84],
          [196, 44],
          [60, 224],
          [180, 226]
        ];
        pos.forEach(([x, y], i) => {
          const dur = (3 + i % 4).toFixed(0);
          pts += `
        <circle cx="${x}" cy="${y}" r="${2 + i % 3}" fill="${alfa(p.destaque.claro, 0.85)}">
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -26; 0 0" dur="${dur}s" begin="${(i * 0.4).toFixed(1)}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.85;0.2;0.85" dur="${dur}s" begin="${(i * 0.4).toFixed(1)}s" repeatCount="indefinite"/>
        </circle>`;
        });
        return pts;
      }
    },
    {
      id: "efe_portal",
      categoria: "efeito",
      nome: "Portal Dimensional",
      descricao: "Anéis giratórios de outra dimensão atrás de você.",
      raridade: "lendario",
      tema: "sci-fi",
      usaCores: ["destaque"],
      atras: true,
      render: (p, u) => `
      <defs>
        <radialGradient id="${u}ptl" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.55" stop-color="${alfa(p.destaque.base, 0)}"/>
          <stop offset="0.8" stop-color="${alfa(p.destaque.base, 0.3)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0)}"/>
        </radialGradient>
      </defs>
      <circle cx="120" cy="118" r="92" fill="url(#${u}ptl)"/>
      <g stroke="${alfa(p.destaque.claro, 0.7)}" stroke-width="2.4" fill="none" stroke-dasharray="26 18">
        <circle cx="120" cy="118" r="86">
          <animateTransform attributeName="transform" type="rotate" from="0 120 118" to="360 120 118" dur="14s" repeatCount="indefinite"/>
        </circle>
      </g>
      <g stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="1.6" fill="none" stroke-dasharray="10 14">
        <circle cx="120" cy="118" r="74">
          <animateTransform attributeName="transform" type="rotate" from="360 120 118" to="0 120 118" dur="10s" repeatCount="indefinite"/>
        </circle>
      </g>`
    },
    {
      id: "efe_raio",
      categoria: "efeito",
      nome: "Tempestade Elétrica",
      descricao: "Relâmpagos estalando ao redor — cuidado ao apertar a mão.",
      raridade: "epico",
      tema: "fantasia",
      usaCores: ["destaque"],
      render: (p) => {
        const raio = (d, dur, atraso) => `
        <path d="${d}" stroke="${p.destaque.claro}" stroke-width="2.6" fill="none" stroke-linejoin="round" opacity="0">
          <animate attributeName="opacity" values="0;1;0;0" keyTimes="0;0.06;0.16;1" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </path>`;
        return `
      ${raio("M30 40 l 12 22 l -10 4 l 14 26", "2.8", "0")}
      ${raio("M208 60 l -12 20 l 10 5 l -13 23", "3.4", "1.1")}
      ${raio("M44 190 l 10 -18 l -8 -4 l 12 -20", "3.1", "2.0")}
      ${raio("M198 186 l -9 -16 l 8 -5 l -11 -19", "2.6", "0.7")}`;
      }
    },
    {
      id: "efe_glitch",
      categoria: "efeito",
      nome: "Glitch",
      descricao: "A realidade desincroniza por um instante. Você não.",
      raridade: "epico",
      tema: "cyberpunk",
      render: () => `
      <g opacity="0">
        <rect x="0" y="58" width="240" height="7" fill="rgba(76,217,232,0.5)"/>
        <rect x="0" y="132" width="240" height="5" fill="rgba(255,95,143,0.5)"/>
        <animate attributeName="opacity" values="0;1;0;0;1;0;0" keyTimes="0;0.03;0.08;0.5;0.53;0.58;1" dur="3.6s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="translate" values="0 0; -8 0; 6 0; 0 0" dur="3.6s" repeatCount="indefinite"/>
      </g>
      <g opacity="0">
        <rect x="0" y="90" width="240" height="4" fill="rgba(76,217,232,0.45)"/>
        <rect x="0" y="182" width="240" height="6" fill="rgba(255,95,143,0.45)"/>
        <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.3;0.34;0.4;1" dur="4.4s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="translate" values="0 0; 9 0; -5 0; 0 0" dur="4.4s" repeatCount="indefinite"/>
      </g>`
    },
    {
      id: "efe_fogo",
      categoria: "efeito",
      nome: "Chamas Vivas",
      descricao: "O fogo de quem carrega a meta do time inteiro.",
      raridade: "mitico",
      tema: "fantasia",
      atras: true,
      render: (_p, u) => {
        const chama = (x, esc, dur, atraso) => `
        <g transform="translate(${x} 236) scale(${esc})">
          <path d="M0 0 c -12 -14 -8 -30 0 -42 c 3 10 10 12 8 24 c 6 -6 6 -14 4 -20 c 8 10 10 26 -2 38 z" fill="url(#${u}fg1)">
            <animateTransform attributeName="transform" type="scale" values="1;1.14 0.92;1" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite" additive="sum"/>
          </path>
        </g>`;
        return `
      <defs>
        <linearGradient id="${u}fg1" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#ff5230"/>
          <stop offset="0.6" stop-color="#ff9a3d"/>
          <stop offset="1" stop-color="#ffd76e"/>
        </linearGradient>
      </defs>
      ${chama(28, 1, "0.9", "0")}
      ${chama(54, 0.7, "1.1", "0.3")}
      ${chama(186, 0.75, "1.0", "0.5")}
      ${chama(212, 1.05, "0.85", "0.2")}
      ${chama(40, 0.5, "1.2", "0.6")}
      ${chama(200, 0.55, "1.15", "0.1")}`;
      }
    },
    {
      id: "efe_confete",
      categoria: "efeito",
      nome: "Confete Eterno",
      descricao: "A festa do Colecionador nunca termina.",
      raridade: "lendario",
      tema: "conquista",
      bloqueadoPor: "conquista:colecionador_5",
      render: () => {
        const CORES = ["#ff5f6e", "#ffb74c", "#4cd97c", "#4c9de8", "#b06ce8", "#ffd76e"];
        let pedacos = "";
        for (let i = 0; i < 16; i++) {
          const x = i * 61 % 224 + 8;
          const dur = (3 + i % 5 * 0.5).toFixed(1);
          const atraso = i * 7 % 30 / 10;
          const rot = 40 + i % 4 * 70;
          pedacos += `
        <rect x="${x}" y="-14" width="7" height="11" rx="1.5" fill="${CORES[i % CORES.length]}" opacity="0.9" transform="rotate(${rot} ${x} 0)">
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 268" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite" additive="sum"/>
        </rect>`;
        }
        return pedacos;
      }
    },
    {
      id: "efe_faiscas",
      categoria: "efeito",
      nome: "Faíscas Lendárias",
      descricao: "Cintilações douradas em cruz — brilho de troféu.",
      raridade: "lendario",
      tema: "fantasia",
      render: () => {
        const faisca = (x, y, s, d, atraso) => `
        <path d="M${x} ${y - s} L ${x + s * 0.28} ${y - s * 0.28} L ${x + s} ${y} L ${x + s * 0.28} ${y + s * 0.28} L ${x} ${y + s} L ${x - s * 0.28} ${y + s * 0.28} L ${x - s} ${y} L ${x - s * 0.28} ${y - s * 0.28} Z" fill="#ffe89a">
          <animate attributeName="opacity" values="0;1;0" dur="${d}s" begin="${atraso}s" repeatCount="indefinite"/>
        </path>`;
        return `
      ${faisca(36, 60, 9, "2.4", "0")}
      ${faisca(206, 90, 7, "2.8", "0.9")}
      ${faisca(210, 196, 10, "3.1", "1.6")}
      ${faisca(30, 176, 6, "2.2", "0.5")}
      ${faisca(120, 26, 8, "2.9", "1.2")}
      ${faisca(66, 222, 5, "2.5", "1.9")}`;
      }
    },
    // ── 4.6 F2 · Onda 3 (poderes) — 8 efeitos novos ───────────────────
    {
      id: "efe_neve",
      categoria: "efeito",
      nome: "Nevasca",
      descricao: "Flocos caindo devagar — inverno particular.",
      raridade: "raro",
      tema: "clima",
      atras: true,
      render: () => {
        let flocos = "";
        for (let i = 0; i < 14; i++) {
          const x = i * 67 % 232 + 4;
          const r = 1.4 + i % 3;
          const dur = (4 + i % 5).toFixed(0);
          const atraso = i * 11 % 30 / 10;
          flocos += `<circle cx="${x}" cy="-8" r="${r}" fill="#eef6ff" opacity="0.85">
          <animateTransform attributeName="transform" type="translate" values="0 0;${i % 2 ? 10 : -10} 256" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </circle>`;
        }
        return flocos;
      }
    },
    {
      id: "efe_folhas",
      categoria: "efeito",
      nome: "Folhas ao Vento",
      descricao: "Outono constante, prazos também.",
      raridade: "incomum",
      tema: "natureza",
      atras: true,
      render: () => {
        let folhas = "";
        const cores = ["#d98a3a", "#b0642a", "#e8b64c"];
        for (let i = 0; i < 8; i++) {
          const y = i * 53 % 200 + 16;
          const dur = (5 + i % 4).toFixed(0);
          const atraso = i * 13 % 40 / 10;
          folhas += `<ellipse cx="-10" cy="${y}" rx="5" ry="2.6" fill="${cores[i % 3]}" opacity="0.8" transform="rotate(30)">
          <animateTransform attributeName="transform" type="translate" values="0 0;270 ${i % 2 ? 30 : -20}" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </ellipse>`;
        }
        return folhas;
      }
    },
    {
      id: "efe_borboletas",
      categoria: "efeito",
      nome: "Borboletas",
      descricao: "Um jardim decidiu te acompanhar.",
      raridade: "raro",
      tema: "natureza",
      usaCores: ["destaque"],
      render: (p) => {
        const borboleta = (x, y, esc, dur) => `
        <g transform="translate(${x} ${y}) scale(${esc})">
          <ellipse cx="-4" cy="0" rx="4.5" ry="3" fill="${p.destaque.base}" opacity="0.9">
            <animateTransform attributeName="transform" type="scale" values="1 1;0.35 1;1 1" dur="${dur}s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="4" cy="0" rx="4.5" ry="3" fill="${p.destaque.claro}" opacity="0.9">
            <animateTransform attributeName="transform" type="scale" values="0.35 1;1 1;0.35 1" dur="${dur}s" repeatCount="indefinite"/>
          </ellipse>
          <rect x="-0.8" y="-3" width="1.6" height="6" rx="0.8" fill="#3a2c20"/>
        </g>`;
        return `
      ${borboleta(38, 70, 1, "0.7")}
      ${borboleta(206, 110, 0.8, "0.9")}
      ${borboleta(52, 196, 0.7, "0.8")}
      ${borboleta(196, 208, 1.1, "0.75")}`;
      }
    },
    {
      id: "efe_tempestade",
      categoria: "efeito",
      nome: "Tempestade",
      descricao: "Relâmpagos cortando o céu atrás de você.",
      raridade: "epico",
      tema: "clima",
      atras: true,
      render: () => `
      <path d="M52 0 l -10 42 l 14 -6 l -12 40" stroke="#cfe0ff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0">
        <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.62;0.66;0.72;1" dur="3.4s" repeatCount="indefinite" calcMode="discrete"/>
      </path>
      <path d="M196 0 l 8 36 l -13 -4 l 10 44" stroke="#e8f0ff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity="0">
        <animate attributeName="opacity" values="0;1;0;0;0" keyTimes="0;0.08;0.14;0.6;1" dur="4.1s" repeatCount="indefinite" calcMode="discrete"/>
      </path>
      <rect width="240" height="240" fill="#cfe0ff" opacity="0">
        <animate attributeName="opacity" values="0;0.16;0;0;0.1;0" keyTimes="0;0.07;0.12;0.6;0.65;1" dur="4.1s" repeatCount="indefinite" calcMode="discrete"/>
      </rect>`
    },
    {
      id: "efe_bolhas",
      categoria: "efeito",
      nome: "Bolhas",
      descricao: "Leveza subindo em câmera lenta.",
      raridade: "comum",
      tema: "casual",
      atras: true,
      usaCores: ["destaque"],
      render: (p) => {
        let bolhas = "";
        for (let i = 0; i < 9; i++) {
          const x = i * 79 % 224 + 8;
          const r = 3 + i % 4 * 2;
          const dur = (5 + i % 4).toFixed(0);
          const atraso = i * 17 % 40 / 10;
          bolhas += `<circle cx="${x}" cy="252" r="${r}" fill="none" stroke="${alfa(p.destaque.claro, 0.5)}" stroke-width="1.4">
          <animateTransform attributeName="transform" type="translate" values="0 0;${i % 2 ? 8 : -8} -270" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </circle>`;
        }
        return bolhas;
      }
    },
    {
      id: "efe_sakura",
      categoria: "efeito",
      nome: "Pétalas de Sakura",
      descricao: "O dojo floresce na sua passagem.",
      raridade: "epico",
      tema: "fantasia",
      atras: true,
      render: () => {
        let petalas = "";
        for (let i = 0; i < 10; i++) {
          const x = i * 71 % 228 + 6;
          const dur = (4.5 + i % 4 * 0.8).toFixed(1);
          const atraso = i * 9 % 36 / 10;
          petalas += `<path d="M${x} -6 q 3 -4 6 0 q -3 5 -6 0 z" fill="#ffb7d0" opacity="0.9">
          <animateTransform attributeName="transform" type="translate" values="0 0;${i % 2 ? 22 : -16} 260" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </path>`;
        }
        return petalas;
      }
    },
    {
      id: "efe_moedas",
      categoria: "efeito",
      nome: "Chuva de Moedas",
      descricao: "O trimestre fechou verde — e transbordou.",
      raridade: "lendario",
      bloqueadoPor: "conquista:favoritador_25",
      tema: "executivo",
      render: () => {
        let moedas = "";
        for (let i = 0; i < 8; i++) {
          const x = i < 4 ? 14 + i * 14 : 176 + (i - 4) * 14;
          const dur = (2.2 + i % 4 * 0.5).toFixed(1);
          const atraso = i * 13 % 24 / 10;
          moedas += `<g opacity="0.95">
          <circle cx="${x}" cy="-10" r="6" fill="#e8b64c" stroke="#b07d1e" stroke-width="1.6"/>
          <text x="${x}" y="-6.6" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" font-weight="800" fill="#8a5f10">$</text>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 262" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </g>`;
        }
        return moedas;
      }
    },
    {
      id: "efe_holo_interf",
      categoria: "efeito",
      nome: "Interferência Holo",
      descricao: "O sinal falha — a lenda, nunca.",
      raridade: "mitico",
      tema: "cyberpunk",
      usaCores: ["destaque"],
      render: (p) => `
      <rect x="0" y="0" width="240" height="3" fill="${alfa(p.destaque.claro, 0.55)}">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 240;0 0" dur="4.6s" repeatCount="indefinite"/>
      </rect>
      <rect x="0" y="60" width="240" height="1.4" fill="${alfa("#ffffff", 0.35)}">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 160;0 0" dur="3.1s" repeatCount="indefinite"/>
      </rect>
      <g opacity="0">
        <rect x="0" y="84" width="26" height="4" fill="${p.destaque.base}"/>
        <rect x="214" y="150" width="26" height="4" fill="${p.destaque.base}"/>
        <rect x="0" y="200" width="18" height="3" fill="#ffffff"/>
        <animate attributeName="opacity" values="0;1;0;0;1;0" keyTimes="0;0.05;0.1;0.55;0.6;1" dur="2.8s" repeatCount="indefinite" calcMode="discrete"/>
      </g>`
    },
    // ── 4.6 F2 · Onda 5 — 6 efeitos novos (meta §28: 24 ✓) ────────────
    {
      id: "efe_vagalumes",
      categoria: "efeito",
      nome: "Vagalumes",
      descricao: "Pequenas luzes vagando na penumbra ao seu redor.",
      raridade: "incomum",
      tema: "natureza",
      atras: true,
      render: () => {
        let luzes = "";
        const pontos = [
          [40, 80, 14, -10],
          [200, 60, -12, 16],
          [30, 180, 16, 12],
          [210, 190, -18, -8],
          [60, 40, 8, 18],
          [190, 130, -10, -14],
          [50, 220, 12, -16]
        ];
        pontos.forEach(([x, y, dx, dy], i) => {
          const dur = (3.5 + i % 4 * 0.9).toFixed(1);
          luzes += `<circle cx="${x}" cy="${y}" r="2.2" fill="#d8ff8a">
          <animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy};0 0" dur="${dur}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.9;0.15;0.9" dur="${(1.4 + i % 3 * 0.5).toFixed(1)}s" repeatCount="indefinite"/>
        </circle>`;
        });
        return luzes;
      }
    },
    {
      id: "efe_veu_aurora",
      categoria: "efeito",
      nome: "Véu de Aurora",
      descricao: "Cortinas polares ondulando atrás de você.",
      raridade: "epico",
      tema: "clima",
      atras: true,
      render: (_p, u) => `
      <defs>
        <linearGradient id="${u}vau" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgba(61,220,132,0.5)"/>
          <stop offset="0.6" stop-color="rgba(76,157,232,0.28)"/>
          <stop offset="1" stop-color="rgba(76,157,232,0)"/>
        </linearGradient>
      </defs>
      <path d="M0 0 h 60 q -10 60 8 120 L 40 120 Q 20 60 0 40 z" fill="url(#${u}vau)">
        <animateTransform attributeName="transform" type="skewX" values="0;6;0;-4;0" dur="7s" repeatCount="indefinite"/>
      </path>
      <path d="M180 0 h 60 v 40 q -20 20 -40 80 l -28 -10 q 18 -60 8 -110 z" fill="url(#${u}vau)">
        <animateTransform attributeName="transform" type="skewX" values="0;-5;0;4;0" dur="8.5s" repeatCount="indefinite"/>
      </path>`
    },
    {
      id: "efe_poeira",
      categoria: "efeito",
      nome: "Poeira Estelar",
      descricao: "Grãos de luz à deriva, sem pressa nenhuma.",
      raridade: "comum",
      tema: "espaço",
      atras: true,
      usaCores: ["destaque"],
      render: (p) => {
        let graos = "";
        for (let i = 0; i < 12; i++) {
          const x = i * 83 % 230 + 5;
          const y = i * 59 % 220 + 10;
          const dur = (6 + i % 5).toFixed(0);
          graos += `<circle cx="${x}" cy="${y}" r="${(0.8 + i % 3 * 0.6).toFixed(1)}" fill="${alfa(p.destaque.claro, 0.55)}">
          <animateTransform attributeName="transform" type="translate" values="0 0;${i % 2 ? 6 : -6} -14;0 0" dur="${dur}s" repeatCount="indefinite"/>
        </circle>`;
        }
        return graos;
      }
    },
    {
      id: "efe_descarga",
      categoria: "efeito",
      nome: "Descarga de Energia",
      descricao: "Arcos elétricos serpenteando pelas bordas do quadro.",
      raridade: "lendario",
      tema: "sci-fi",
      usaCores: ["destaque"],
      render: (p) => {
        const arco = (d, dur, atraso) => `
        <path d="${d}" stroke="${p.destaque.claro}" stroke-width="2.2" fill="none" stroke-linejoin="round" opacity="0">
          <animate attributeName="opacity" values="0;1;0.4;1;0;0" keyTimes="0;0.05;0.09;0.13;0.2;1" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite" calcMode="discrete"/>
        </path>`;
        return `
      ${arco("M8 30 l 14 8 l -6 10 l 16 6 l -8 12 l 14 6", "2.6", "0")}
      ${arco("M232 44 l -14 6 l 8 10 l -18 4 l 10 12 l -12 8", "3.1", "0.9")}
      ${arco("M10 200 l 16 -6 l -4 -12 l 18 -2 l -6 -12", "2.9", "1.7")}
      ${arco("M230 196 l -16 -4 l 6 -12 l -18 -4 l 8 -10", "3.4", "0.4")}`;
      }
    },
    {
      id: "efe_nevoa",
      categoria: "efeito",
      nome: "Névoa Baixa",
      descricao: "Um tapete de névoa rolando aos seus pés.",
      raridade: "incomum",
      tema: "clima",
      render: () => `
      <g fill="rgba(210,220,240,0.16)">
        <ellipse cx="60" cy="228" rx="70" ry="18">
          <animateTransform attributeName="transform" type="translate" values="0 0;24 -3;0 0" dur="7s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="170" cy="234" rx="80" ry="20">
          <animateTransform attributeName="transform" type="translate" values="0 0;-28 -4;0 0" dur="8.5s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="120" cy="240" rx="90" ry="22">
          <animateTransform attributeName="transform" type="translate" values="0 0;14 -6;0 0" dur="6s" repeatCount="indefinite"/>
        </ellipse>
      </g>`
    },
    {
      id: "efe_metricas",
      categoria: "efeito",
      nome: "Métricas Subindo",
      descricao: "Setas verdes decolando — o dashboard aprova.",
      raridade: "raro",
      tema: "executivo",
      render: () => {
        const seta = (x, y, esc, dur, atraso) => `
        <g transform="translate(${x} ${y}) scale(${esc})" opacity="0.9">
          <path d="M0 10 L0 -6 M-5 -1 L0 -6 L5 -1" stroke="#4cd97c" stroke-width="3" fill="none" stroke-linecap="round"/>
          <animateTransform attributeName="transform" type="translate" values="${x} ${y};${x} ${y - 34}" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite" additive="replace"/>
          <animate attributeName="opacity" values="0;0.9;0" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite"/>
        </g>`;
        return `
      ${seta(28, 190, 1, "2.6", "0")}
      ${seta(46, 150, 0.7, "3.1", "0.8")}
      ${seta(206, 200, 1.1, "2.8", "0.4")}
      ${seta(220, 140, 0.8, "3.4", "1.4")}
      <path d="M14 96 l 12 -10 l 8 6 l 14 -16" stroke="rgba(76,217,124,0.5)" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M196 92 l 12 -8 l 8 5 l 14 -14" stroke="rgba(76,217,124,0.4)" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      }
    }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/partes/auras.ts
  var AURAS = [
    {
      id: "aur_neon",
      categoria: "aura",
      nome: "Aura Neon",
      descricao: "Dois anéis de neon respirando em volta de você.",
      raridade: "raro",
      tema: "cyberpunk",
      usaCores: ["destaque"],
      render: (p, u) => `
      <g id="${u}an">
        <circle cx="120" cy="128" r="92" fill="none" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="3">
          <animate attributeName="opacity" values="0.9;0.45;0.9" dur="3.2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="120" cy="128" r="80" fill="none" stroke="${alfa(p.destaque.claro, 0.32)}" stroke-width="1.6">
          <animate attributeName="opacity" values="0.5;0.95;0.5" dur="3.2s" repeatCount="indefinite"/>
        </circle>
      </g>`
    },
    {
      id: "aur_plasma",
      categoria: "aura",
      nome: "Aura de Plasma",
      descricao: "Camadas de plasma pulsando em ondas concêntricas.",
      raridade: "epico",
      tema: "sci-fi",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <radialGradient id="${u}apl" cx="0.5" cy="0.53" r="0.5">
          <stop offset="0.45" stop-color="${alfa(p.destaque.base, 0)}"/>
          <stop offset="0.72" stop-color="${alfa(p.destaque.base, 0.34)}"/>
          <stop offset="0.86" stop-color="${alfa(p.destaque.claro, 0.16)}"/>
          <stop offset="1" stop-color="${alfa(p.destaque.base, 0)}"/>
        </radialGradient>
      </defs>
      <circle cx="120" cy="128" r="104" fill="url(#${u}apl)">
        <animate attributeName="r" values="96;106;96" dur="4.2s" repeatCount="indefinite"/>
      </circle>
      <ellipse cx="120" cy="128" rx="88" ry="84" fill="none" stroke="${alfa(p.destaque.claro, 0.4)}" stroke-width="2">
        <animate attributeName="opacity" values="0.7;0.25;0.7" dur="2.8s" repeatCount="indefinite"/>
      </ellipse>`
    },
    {
      id: "aur_eletrica",
      categoria: "aura",
      nome: "Aura Elétrica",
      descricao: "Arcos de eletricidade estalando no contorno.",
      raridade: "epico",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p, u) => `
      <g id="${u}ae" fill="none" stroke-linecap="round">
        <path d="M42 92 L54 78 L48 96 L62 84" stroke="${alfa(p.destaque.claro, 0.85)}" stroke-width="2.4">
          <animate attributeName="opacity" values="0;1;0;0;1;0" dur="1.9s" repeatCount="indefinite"/>
        </path>
        <path d="M196 74 L184 90 L198 86 L186 104" stroke="${alfa(p.destaque.base, 0.8)}" stroke-width="2.2">
          <animate attributeName="opacity" values="1;0;0;1;0;1" dur="2.3s" repeatCount="indefinite"/>
        </path>
        <path d="M36 168 L52 160 L44 176 L60 170" stroke="${alfa(p.destaque.base, 0.7)}" stroke-width="2">
          <animate attributeName="opacity" values="0;0;1;0;1;0" dur="1.7s" repeatCount="indefinite"/>
        </path>
        <path d="M202 156 L188 166 L200 170 L186 182" stroke="${alfa(p.destaque.claro, 0.75)}" stroke-width="2.2">
          <animate attributeName="opacity" values="1;0;1;0;0;1" dur="2.1s" repeatCount="indefinite"/>
        </path>
        <circle cx="120" cy="128" r="95" stroke="${alfa(p.destaque.base, 0.28)}" stroke-width="1.4" stroke-dasharray="3 9">
          <animateTransform attributeName="transform" type="rotate" from="0 120 128" to="360 120 128" dur="14s" repeatCount="indefinite"/>
        </circle>
      </g>`
    },
    {
      id: "aur_cristal",
      categoria: "aura",
      nome: "Aura de Cristal",
      descricao: "Lascas cristalinas orbitando em silêncio absoluto.",
      raridade: "lendario",
      tema: "fantasia",
      usaCores: ["destaque"],
      render: (p, u) => `
      <g id="${u}ac">
        <g>
          <path d="M120 26 L127 40 L120 54 L113 40 Z" fill="${alfa(p.destaque.claro, 0.85)}"/>
          <path d="M212 128 L200 135 L188 128 L200 121 Z" fill="${alfa(p.destaque.base, 0.7)}"/>
          <path d="M120 224 L113 212 L120 200 L127 212 Z" fill="${alfa(p.destaque.claro, 0.6)}"/>
          <path d="M28 128 L40 121 L52 128 L40 135 Z" fill="${alfa(p.destaque.base, 0.75)}"/>
          <animateTransform attributeName="transform" type="rotate" from="0 120 128" to="360 120 128" dur="22s" repeatCount="indefinite"/>
        </g>
        <circle cx="120" cy="128" r="88" fill="none" stroke="${alfa(p.destaque.claro, 0.22)}" stroke-width="6">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="5s" repeatCount="indefinite"/>
        </circle>
      </g>`
    },
    {
      id: "aur_dshow",
      categoria: "aura",
      nome: "Aura LED Dshow",
      descricao: "O anel LED oficial da casa — segmentos varrendo a órbita.",
      raridade: "exclusivo",
      tema: "dshow",
      usaCores: ["destaque"],
      render: (p, u) => `
      <g id="${u}ad">
        <circle cx="120" cy="128" r="98" fill="none" stroke="${alfa(p.destaque.base, 0.62)}"
          stroke-width="5" stroke-dasharray="26 18" stroke-linecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 120 128" to="360 120 128" dur="9s" repeatCount="indefinite"/>
        </circle>
        <circle cx="120" cy="128" r="88" fill="none" stroke="${alfa(p.destaque.claro, 0.35)}"
          stroke-width="2" stroke-dasharray="6 14" stroke-linecap="round">
          <animateTransform attributeName="transform" type="rotate" from="360 120 128" to="0 120 128" dur="13s" repeatCount="indefinite"/>
        </circle>
      </g>`
    },
    {
      id: "aur_orbital",
      categoria: "aura",
      nome: "Anel Orbital",
      descricao: "Um anel fino e constante, como um satélite fiel.",
      raridade: "incomum",
      tema: "espaço",
      usaCores: ["destaque"],
      render: (p, u) => `
      <g id="${u}ao" transform="rotate(-8 120 132)">
        <ellipse cx="120" cy="132" rx="98" ry="26" fill="none"
          stroke="${alfa(p.destaque.base, 0.45)}" stroke-width="2.4"/>
      </g>
      <circle cx="24" cy="120" r="4" fill="${p.destaque.claro}">
        <animate attributeName="opacity" values="1;0.4;1" dur="2.6s" repeatCount="indefinite"/>
      </circle>`
    },
    {
      id: "aur_gelo",
      categoria: "aura",
      nome: "Aura Glacial",
      descricao: "Névoa fria e cristais suspensos — calma absoluta.",
      raridade: "raro",
      tema: "fantasia",
      usaCores: ["destaque"],
      render: (_p, u) => `
      <defs>
        <radialGradient id="${u}agl" cx="0.5" cy="0.55" r="0.52">
          <stop offset="0.5" stop-color="${alfa("#bfe8ff", 0)}"/>
          <stop offset="0.85" stop-color="${alfa("#bfe8ff", 0.3)}"/>
          <stop offset="1" stop-color="${alfa("#bfe8ff", 0)}"/>
        </radialGradient>
      </defs>
      <circle cx="120" cy="128" r="100" fill="url(#${u}agl)"/>
      <g fill="${alfa("#e6f6ff", 0.9)}">
        <path d="M58 92 l 3 6 l -3 6 l -3 -6 Z">
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="3.4s" repeatCount="indefinite"/>
        </path>
        <path d="M186 110 l 2.6 5 l -2.6 5 l -2.6 -5 Z">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2.8s" repeatCount="indefinite"/>
        </path>
        <path d="M70 176 l 2.4 4.6 l -2.4 4.6 l -2.4 -4.6 Z">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3.9s" repeatCount="indefinite"/>
        </path>
      </g>`
    },
    {
      id: "aur_fenix",
      categoria: "aura",
      nome: "Aura de Fênix",
      descricao: "Labaredas orbitando devagar — renasce a cada trimestre.",
      raridade: "mitico",
      tema: "fantasia",
      usaCores: ["destaque"],
      render: (_p, u) => `
      <g id="${u}afx">
        <g>
          <path d="M120 22 q 8 12 0 24 q -8 -12 0 -24 z" fill="${alfa("#ffb347", 0.85)}"/>
          <path d="M214 128 q -12 8 -24 0 q 12 -8 24 0 z" fill="${alfa("#ff7847", 0.8)}"/>
          <path d="M120 234 q -8 -12 0 -24 q 8 12 0 24 z" fill="${alfa("#ffb347", 0.75)}"/>
          <path d="M26 128 q 12 -8 24 0 q -12 8 -24 0 z" fill="${alfa("#ff7847", 0.85)}"/>
          <animateTransform attributeName="transform" type="rotate" from="0 120 128" to="360 120 128" dur="12s" repeatCount="indefinite"/>
        </g>
        <circle cx="120" cy="128" r="92" fill="none" stroke="${alfa("#ff9347", 0.3)}" stroke-width="8">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2.2s" repeatCount="indefinite"/>
        </circle>
      </g>`
    },
    // ── 4.6 F2 · Onda 3 (poderes) — 7 auras novas (meta §28: 15 ✓) ────
    {
      id: "aur_solar",
      categoria: "aura",
      nome: "Aura Solar",
      descricao: "Raios dourados girando devagar, como um amanhecer fiel.",
      raridade: "raro",
      tema: "fantasia",
      render: (_p, u) => {
        let raios = "";
        for (let i = 0; i < 12; i++) {
          raios += `<rect x="-2.4" y="-104" width="4.8" height="26" rx="2.4" fill="${alfa("#ffd75e", 0.55)}" transform="rotate(${i * 30})"/>`;
        }
        return `
      <g id="${u}asol" transform="translate(120 128)">
        <g>${raios}
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur="26s" repeatCount="indefinite"/>
        </g>
        <circle r="86" fill="none" stroke="${alfa("#ffb54d", 0.4)}" stroke-width="3">
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="3.4s" repeatCount="indefinite"/>
        </circle>
      </g>`;
      }
    },
    {
      id: "aur_sombria",
      categoria: "aura",
      nome: "Aura Sombria",
      descricao: "A penumbra que chega junto — e sai por último.",
      raridade: "epico",
      tema: "fantasia",
      render: (_p, u) => `
      <defs>
        <radialGradient id="${u}asb" cx="0.5" cy="0.55" r="0.52">
          <stop offset="0.5" stop-color="${alfa("#0b0614", 0)}"/>
          <stop offset="0.8" stop-color="${alfa("#1b0f33", 0.55)}"/>
          <stop offset="1" stop-color="${alfa("#0b0614", 0)}"/>
        </radialGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}asb)"/>
      <g fill="${alfa("#3a2a5e", 0.6)}">
        <circle cx="52" cy="150" r="7"><animateTransform attributeName="transform" type="translate" values="0 0;-6 -34" dur="4.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="4.2s" repeatCount="indefinite"/></circle>
        <circle cx="190" cy="170" r="9"><animateTransform attributeName="transform" type="translate" values="0 0;8 -40" dur="5.1s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0" dur="5.1s" repeatCount="indefinite"/></circle>
        <circle cx="120" cy="216" r="6"><animateTransform attributeName="transform" type="translate" values="0 0;0 -30" dur="3.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.65;0" dur="3.6s" repeatCount="indefinite"/></circle>
      </g>`
    },
    {
      id: "aur_runica",
      categoria: "aura",
      nome: "Aura Rúnica",
      descricao: "Glifos antigos orbitando em vigília silenciosa.",
      raridade: "lendario",
      tema: "fantasia",
      usaCores: ["destaque"],
      render: (p, u) => {
        const glifos = ["M-4 4 L0 -5 L4 4 M-2 1 H2", "M-3 -4 V4 M-3 -4 Q4 -4 -3 1", "M0 -5 V5 M-4 -2 L4 2", "M-4 -4 L4 4 M4 -4 L-4 4", "M-3 -4 H3 V4 H-3 Z", "M0 -5 L4 0 L0 5 L-4 0 Z"];
        let orbita = "";
        for (let i = 0; i < 6; i++) {
          const ang = i * 60 * Math.PI / 180;
          const x = Math.cos(ang) * 94;
          const y = Math.sin(ang) * 94;
          orbita += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
          <path d="${glifos[i]}" stroke="${p.destaque.claro}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          <circle r="9" fill="none" stroke="${alfa(p.destaque.base, 0.4)}" stroke-width="1.2"/>
        </g>`;
        }
        return `
      <g id="${u}arun" transform="translate(120 128)">
        <g>${orbita}
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur="30s" repeatCount="indefinite"/>
        </g>
        <circle r="94" fill="none" stroke="${alfa(p.destaque.base, 0.25)}" stroke-width="1.4" stroke-dasharray="4 8"/>
      </g>`;
      }
    },
    {
      id: "aur_prisma",
      categoria: "aura",
      nome: "Aura Prisma",
      descricao: "Todo o espectro concorda com você.",
      raridade: "epico",
      tema: "fantasia",
      render: (_p, u) => `
      <g id="${u}apr" transform="translate(120 128)">
        <circle r="90" fill="none" stroke="#ff5f8f" stroke-width="2.6" opacity="0.55" stroke-dasharray="70 400">
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur="9s" repeatCount="indefinite"/>
        </circle>
        <circle r="90" fill="none" stroke="#4cd97c" stroke-width="2.6" opacity="0.55" stroke-dasharray="70 400">
          <animateTransform attributeName="transform" type="rotate" values="120;480" dur="9s" repeatCount="indefinite"/>
        </circle>
        <circle r="90" fill="none" stroke="#4c9de8" stroke-width="2.6" opacity="0.55" stroke-dasharray="70 400">
          <animateTransform attributeName="transform" type="rotate" values="240;600" dur="9s" repeatCount="indefinite"/>
        </circle>
      </g>`
    },
    {
      id: "aur_vento",
      categoria: "aura",
      nome: "Aura de Vento",
      descricao: "Correntes de ar desenhando espirais ao redor.",
      raridade: "incomum",
      tema: "natureza",
      render: (_p, u) => `
      <g id="${u}avt" fill="none" stroke="${alfa("#cfe8f0", 0.5)}" stroke-width="2.4" stroke-linecap="round">
        <path d="M28 96 q 30 -16 58 -4">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.8s" repeatCount="indefinite"/>
        </path>
        <path d="M154 88 q 34 -10 58 6">
          <animate attributeName="opacity" values="0.25;0.7;0.25" dur="3.2s" repeatCount="indefinite"/>
        </path>
        <path d="M22 170 q 28 14 60 6">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite"/>
        </path>
        <path d="M158 180 q 30 10 60 -2">
          <animate attributeName="opacity" values="0.2;0.65;0.2" dur="2.6s" repeatCount="indefinite"/>
        </path>
        <circle cx="46" cy="92" r="3"/><circle cx="196" cy="182" r="3"/>
      </g>`
    },
    {
      id: "aur_estelar",
      categoria: "aura",
      nome: "Aura Estelar",
      descricao: "Uma constelação pessoal cintilando em círculo.",
      raridade: "raro",
      tema: "espaço",
      usaCores: ["destaque"],
      render: (p, u) => {
        let estrelas2 = "";
        for (let i = 0; i < 10; i++) {
          const ang = i * 36 * Math.PI / 180;
          const r = 88 + i % 3 * 6;
          const x = 120 + Math.cos(ang) * r;
          const y = 128 + Math.sin(ang) * r * 0.92;
          estrelas2 += `<path d="M${x.toFixed(1)} ${(y - 4).toFixed(1)} l 1.4 2.8 l 3 0.5 l -2.2 2.1 l 0.5 3 l -2.7 -1.4 l -2.7 1.4 l 0.5 -3 l -2.2 -2.1 l 3 -0.5 z" fill="${i % 2 ? p.destaque.claro : "#fff2c8"}" opacity="0.85">
          <animate attributeName="opacity" values="0.85;0.25;0.85" dur="${(2 + i % 4 * 0.5).toFixed(1)}s" repeatCount="indefinite"/>
        </path>`;
        }
        return `<g id="${u}aest">${estrelas2}</g>`;
      }
    },
    {
      id: "aur_toxica",
      categoria: "aura",
      nome: "Aura Tóxica",
      descricao: "Vapor esverdeado — cuidado ao se aproximar do ranking.",
      raridade: "raro",
      tema: "sci-fi",
      render: (_p, u) => `
      <defs>
        <radialGradient id="${u}atx" cx="0.5" cy="0.6" r="0.5">
          <stop offset="0.55" stop-color="${alfa("#3ddc84", 0)}"/>
          <stop offset="0.85" stop-color="${alfa("#3ddc84", 0.28)}"/>
          <stop offset="1" stop-color="${alfa("#3ddc84", 0)}"/>
        </radialGradient>
      </defs>
      <rect width="240" height="240" fill="url(#${u}atx)">
        <animate attributeName="opacity" values="1;0.6;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <g fill="${alfa("#7dffb0", 0.5)}">
        <circle cx="60" cy="180" r="4"><animateTransform attributeName="transform" type="translate" values="0 0;-4 -26" dur="3.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0" dur="3.4s" repeatCount="indefinite"/></circle>
        <circle cx="184" cy="164" r="5"><animateTransform attributeName="transform" type="translate" values="0 0;6 -30" dur="4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.55;0" dur="4s" repeatCount="indefinite"/></circle>
      </g>`
    }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/partes/banners.ts
  function estandarte(fill, borda, u, chave, conteudo = "") {
    return `
    <g id="${u}${chave}">
      <path d="M78 0 L162 0 L162 196 L120 172 L78 196 Z" fill="${fill}" stroke="${borda}" stroke-width="3"/>
      ${conteudo}
    </g>`;
  }
  var BANNERS = [
    {
      id: "ban_executivo",
      categoria: "banner",
      nome: "Estandarte Executivo",
      descricao: "Painel sóbrio com friso dourado — sala de reunião vitalícia.",
      raridade: "raro",
      tema: "executivo",
      usaCores: ["destaque"],
      render: (_p, u) => estandarte("#1a2032", "#2a3247", u, "bex", `
      <path d="M86 10 L154 10" stroke="#e8b64c" stroke-width="3" stroke-linecap="round"/>
      <path d="M86 18 L154 18" stroke="${alfa("#e8b64c", 0.4)}" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="120" cy="42" r="9" fill="none" stroke="#e8b64c" stroke-width="2.4"/>
      <path d="M86 176 L120 156 L154 176" fill="none" stroke="${alfa("#e8b64c", 0.5)}" stroke-width="2"/>`)
    },
    {
      id: "ban_cyber",
      categoria: "banner",
      nome: "Estandarte Cyber",
      descricao: "Trilhas de circuito acesas descendo o painel.",
      raridade: "epico",
      tema: "cyberpunk",
      usaCores: ["destaque"],
      render: (p, u) => estandarte("#0c1220", alfa(p.destaque.base, 0.7), u, "bcy", `
      <g fill="none" stroke="${alfa(p.destaque.base, 0.65)}" stroke-width="2">
        <path d="M96 8 L96 74 L110 88 L110 150"/>
        <path d="M144 8 L144 52 L130 66 L130 128"/>
      </g>
      <circle cx="110" cy="150" r="3.4" fill="${p.destaque.claro}">
        <animate attributeName="opacity" values="1;0.3;1" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="130" cy="128" r="3.4" fill="${p.destaque.claro}">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.2s" repeatCount="indefinite"/>
      </circle>`)
    },
    {
      id: "ban_galaxy",
      categoria: "banner",
      nome: "Estandarte Galáxia",
      descricao: "Um pedaço do espaço profundo pendurado às suas costas.",
      raridade: "epico",
      tema: "espaço",
      usaCores: ["destaque"],
      render: (p, u) => `
      <defs>
        <linearGradient id="${u}bglx" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#101736"/>
          <stop offset="1" stop-color="#1c1030"/>
        </linearGradient>
      </defs>
      ${estandarte(`url(#${u}bglx)`, alfa(p.destaque.base, 0.55), u, "bgl", `
      <g fill="#ffffff">
        <circle cx="98" cy="30" r="1.6"/>
        <circle cx="138" cy="52" r="1.2"/>
        <circle cx="112" cy="84" r="1.8">
          <animate attributeName="opacity" values="1;0.3;1" dur="2.6s" repeatCount="indefinite"/>
        </circle>
        <circle cx="150" cy="110" r="1.3"/>
        <circle cx="92" cy="132" r="1.5">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="3.1s" repeatCount="indefinite"/>
        </circle>
      </g>
      <ellipse cx="124" cy="64" rx="20" ry="7" fill="none" stroke="${alfa(p.destaque.claro, 0.5)}" stroke-width="1.6" transform="rotate(-18 124 64)"/>`)}`
    },
    {
      id: "ban_arena",
      categoria: "banner",
      nome: "Flâmula da Arena",
      descricao: "A bandeira de quem entra para vencer o campeonato.",
      raridade: "raro",
      tema: "gamer",
      usaCores: ["destaque", "roupa"],
      render: (p, u) => estandarte(p.destaque.profundo, p.destaque.base, u, "bar", `
      <path d="M78 0 L162 0 L162 34 L78 34 Z" fill="${alfa(p.destaque.base, 0.85)}"/>
      <path d="M104 56 L120 44 L136 56 L136 96 L120 108 L104 96 Z"
        fill="none" stroke="${p.destaque.claro}" stroke-width="3"/>
      <path d="M112 72 L120 64 L128 72" fill="none" stroke="${p.destaque.claro}" stroke-width="2.4" stroke-linecap="round"/>`)
    },
    {
      id: "ban_dshow",
      categoria: "banner",
      nome: "Painel LED Dshow",
      descricao: "O telão da casa, aceso só para o seu personagem.",
      raridade: "exclusivo",
      tema: "dshow",
      usaCores: ["destaque"],
      render: (p, u) => estandarte("#0a0e18", alfa(p.destaque.base, 0.8), u, "bds", `
      <g stroke-width="4" stroke-linecap="round" fill="none">
        <path d="M92 20 L148 20" stroke="${alfa(p.destaque.base, 0.9)}">
          <animate attributeName="opacity" values="1;0.35;1" dur="1.8s" repeatCount="indefinite"/>
        </path>
        <path d="M92 34 L148 34" stroke="${alfa(p.destaque.claro, 0.6)}">
          <animate attributeName="opacity" values="0.35;1;0.35" dur="1.8s" repeatCount="indefinite"/>
        </path>
      </g>
      <g fill="${alfa(p.destaque.base, 0.5)}">
        <rect x="92" y="54" width="10" height="10" rx="2">
          <animate attributeName="opacity" values="1;0.2;1" dur="2.4s" repeatCount="indefinite"/>
        </rect>
        <rect x="108" y="54" width="10" height="10" rx="2">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.4s" repeatCount="indefinite"/>
        </rect>
        <rect x="124" y="54" width="10" height="10" rx="2">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="1.9s" repeatCount="indefinite"/>
        </rect>
        <rect x="140" y="54" width="8" height="10" rx="2">
          <animate attributeName="opacity" values="1;0.4;1" dur="2.1s" repeatCount="indefinite"/>
        </rect>
      </g>`)
    },
    {
      id: "ban_dojo",
      categoria: "banner",
      nome: "Estandarte do Dojo",
      descricao: "Seda vermelha e o círculo do treino diário.",
      raridade: "raro",
      tema: "oriental",
      usaCores: ["destaque"],
      render: (p, u) => estandarte("#5c1a1a", "#8a2f2f", u, "bdj", `
      <circle cx="120" cy="58" r="22" fill="none" stroke="${alfa("#ffffff", 0.85)}" stroke-width="4"/>
      <path d="M96 100 h48 M96 114 h48" stroke="${alfa("#ffffff", 0.4)}" stroke-width="3" stroke-linecap="round"/>
      <path d="M86 12 h68" stroke="${alfa(p.destaque.claro, 0.6)}" stroke-width="3" stroke-linecap="round"/>`)
    },
    {
      id: "ban_lab",
      categoria: "banner",
      nome: "Quadro do Laboratório",
      descricao: "Fórmulas de quem testa antes de afirmar.",
      raridade: "incomum",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p, u) => estandarte("#10241e", alfa(p.destaque.base, 0.6), u, "blb", `
      <g stroke="${alfa("#d9ffe9", 0.55)}" stroke-width="2.4" fill="none" stroke-linecap="round">
        <path d="M94 30 h30 M94 44 h44 M94 58 h22"/>
        <circle cx="132" cy="92" r="10"/>
        <path d="M94 92 h26 M132 104 v18"/>
      </g>
      <circle cx="132" cy="92" r="3" fill="${p.destaque.claro}">
        <animate attributeName="opacity" values="1;0.3;1" dur="2.4s" repeatCount="indefinite"/>
      </circle>`)
    },
    {
      id: "ban_real",
      categoria: "banner",
      nome: "Estandarte Real",
      descricao: "Púrpura, ouro e a certeza de quem lidera o ranking.",
      raridade: "lendario",
      tema: "fantasia",
      usaCores: [],
      render: (_p, u) => estandarte("#2a1440", "#e8b64c", u, "brl", `
      <path d="M104 44 l 6 -12 l 10 10 l 10 -10 l 6 12 l -3 12 l -26 0 z" fill="#e8b64c"/>
      <circle cx="120" cy="80" r="3" fill="${alfa("#e8b64c", 0.9)}"/>
      <path d="M96 108 l 24 14 l 24 -14" fill="none" stroke="${alfa("#e8b64c", 0.55)}" stroke-width="3"/>
      <path d="M96 130 l 24 14 l 24 -14" fill="none" stroke="${alfa("#e8b64c", 0.3)}" stroke-width="3"/>`)
    },
    // ── 4.6 F2 · Onda 3 — 7 banners novos (meta §28: 15 ✓) ────────────
    {
      id: "ban_campeao",
      categoria: "banner",
      nome: "Estandarte Campeão",
      descricao: "Listras de pódio e o troféu do último split.",
      raridade: "raro",
      tema: "esportivo",
      render: (_p, u) => estandarte("#1c2a1e", "#2f4a33", u, "bca", `
      <path d="M88 0 v 190 M152 0 v 190" stroke="${alfa("#e8b64c", 0.4)}" stroke-width="4"/>
      <path d="M108 30 h 24 v 10 a 12 12 0 0 1 -24 0 z" fill="#e8b64c"/>
      <path d="M104 32 a 6 6 0 0 0 6 8 M136 32 a 6 6 0 0 1 -6 8" stroke="#e8b64c" stroke-width="2.4" fill="none"/>
      <path d="M116 50 h 8 v 6 h -8 z M112 56 h 16 v 4 h -16 z" fill="#b07d1e"/>
      <circle cx="120" cy="90" r="2.6" fill="${alfa("#e8b64c", 0.8)}"/>
      <circle cx="120" cy="110" r="2.6" fill="${alfa("#e8b64c", 0.5)}"/>`)
    },
    {
      id: "ban_corsario",
      categoria: "banner",
      nome: "Estandarte Corsário",
      descricao: "Bandeira de quem navega fora da rota — e chega primeiro.",
      raridade: "epico",
      tema: "aventura",
      render: (_p, u) => estandarte("#14100c", "#3a2c20", u, "bco", `
      <circle cx="120" cy="46" r="14" fill="#f4f0e6"/>
      <circle cx="115" cy="43" r="3" fill="#14100c"/>
      <circle cx="125" cy="43" r="3" fill="#14100c"/>
      <path d="M114 52 q 6 4 12 0" stroke="#14100c" stroke-width="2" fill="none"/>
      <path d="M100 70 l 40 14 M140 70 l -40 14" stroke="#f4f0e6" stroke-width="5" stroke-linecap="round"/>
      <path d="M92 110 h 56 M100 122 h 40" stroke="${alfa("#f4f0e6", 0.3)}" stroke-width="2"/>`)
    },
    {
      id: "ban_guardiao",
      categoria: "banner",
      nome: "Estandarte Guardião",
      descricao: "A árvore antiga que protege quem constrói.",
      raridade: "incomum",
      tema: "natureza",
      render: (_p, u) => estandarte("#122016", "#274a30", u, "bgu", `
      <path d="M120 26 c -18 12 -26 28 -24 44 c 8 -6 16 -8 24 -8 s 16 2 24 8 c 2 -16 -6 -32 -24 -44 z" fill="#3ddc84" opacity="0.85"/>
      <path d="M117 60 h 6 v 26 h -6 z" fill="#7a4a32"/>
      <path d="M96 104 q 24 12 48 0 M96 124 q 24 12 48 0" stroke="${alfa("#3ddc84", 0.4)}" stroke-width="2.6" fill="none"/>
      <circle cx="104" cy="42" r="2" fill="#aef4c4"/>
      <circle cx="138" cy="50" r="2" fill="#aef4c4"/>`)
    },
    {
      id: "ban_imperial",
      categoria: "banner",
      nome: "Estandarte Imperial",
      descricao: "Púrpura, ouro e a coroa de quem assina o império.",
      raridade: "lendario",
      tema: "fantasia",
      render: (_p, u) => estandarte("#2a1040", "#e8b64c", u, "bre", `
      <path d="M100 42 l 5 -16 l 9 11 l 6 -15 l 6 15 l 9 -11 l 5 16 c -13 -5 -27 -5 -40 0 z" fill="#e8b64c"/>
      <path d="M100 42 c 13 -5 27 -5 40 0 l -1 5 c -12 -4 -26 -4 -38 0 z" fill="#b07d1e"/>
      <circle cx="120" cy="22" r="2.6" fill="#ff5f8f"/>
      <path d="M94 70 q 26 16 52 0 M94 92 q 26 16 52 0" stroke="${alfa("#e8b64c", 0.45)}" stroke-width="2.6" fill="none"/>
      <path d="M88 130 l 8 8 l -8 8 M152 130 l -8 8 l 8 8" stroke="${alfa("#e8b64c", 0.6)}" stroke-width="2.4" fill="none"/>`)
    },
    {
      id: "ban_neon_tokyo",
      categoria: "banner",
      nome: "Estandarte Neon",
      descricao: "Letreiro vertical aceso na rua molhada.",
      raridade: "epico",
      tema: "cyberpunk",
      usaCores: ["destaque"],
      render: (p, u) => estandarte("#0a0d18", alfa(p.destaque.base, 0.8), u, "bnt", `
      <g stroke="${p.destaque.claro}" stroke-width="3" fill="none" stroke-linecap="round">
        <path d="M108 28 h 24 M120 28 v 20 M108 48 h 24"/>
        <path d="M110 66 h 20 v 16 h -20 z"/>
        <path d="M108 100 l 12 16 l 12 -16"/>
        <animate attributeName="opacity" values="1;0.45;1;1;0.6;1" keyTimes="0;0.06;0.12;0.6;0.66;1" dur="3.2s" repeatCount="indefinite" calcMode="discrete"/>
      </g>
      <path d="M86 140 v 30 M154 140 v 30" stroke="${alfa(p.destaque.base, 0.5)}" stroke-width="2"/>`)
    },
    {
      id: "ban_forjado",
      categoria: "banner",
      nome: "Estandarte da Forja",
      descricao: "Martelo, bigorna e brasas que não apagam.",
      raridade: "raro",
      tema: "fantasia",
      render: (_p, u) => estandarte("#241109", "#7a2408", u, "bfo", `
      <path d="M106 34 h 28 v 10 h -28 z" fill="#c4c9d6"/>
      <path d="M117 44 h 6 v 22 h -6 z" fill="#7a4a32"/>
      <path d="M102 78 h 36 l -6 10 h -24 z M110 88 h 20 v 6 h -20 z" fill="#5a6274"/>
      <circle cx="104" cy="112" r="2.4" fill="#ff8a3d"><animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite"/></circle>
      <circle cx="132" cy="120" r="2" fill="#ffb54d"><animate attributeName="opacity" values="0.4;1;0.4" dur="2.2s" repeatCount="indefinite"/></circle>
      <circle cx="118" cy="132" r="1.8" fill="#ff5230"><animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite"/></circle>`)
    },
    {
      id: "ban_pixel",
      categoria: "banner",
      nome: "Estandarte Pixel",
      descricao: "Herança de 8 bits pendurada com orgulho.",
      raridade: "incomum",
      tema: "gamer",
      usaCores: ["destaque"],
      render: (p, u) => {
        let px = "";
        const mapa = [[1, 1], [3, 1], [2, 2], [1, 3], [2, 3], [3, 3], [2, 4], [1, 5], [3, 5]];
        for (const [cx, cy] of mapa) {
          px += `<rect x="${96 + cx * 12}" y="${22 + cy * 12}" width="11" height="11" fill="${p.destaque.base}"/>`;
        }
        return estandarte("#10141f", "#28324a", u, "bpx", `
      ${px}
      <path d="M86 120 h 68 M86 132 h 68" stroke="${alfa(p.destaque.base, 0.35)}" stroke-width="4" stroke-dasharray="8 6"/>`);
      }
    }
  ];

  // public/components/panels/panel-avatar-studio/src/engine/partes/emblemas.ts
  function pino(u, chave, fundo, borda, conteudo) {
    return `
    <g id="${u}${chave}" transform="translate(152 206)">
      <circle r="13" fill="${fundo}" stroke="${borda}" stroke-width="2"/>
      ${conteudo}
    </g>`;
  }
  var EMBLEMAS = [
    {
      id: "emb_dshow",
      categoria: "emblema",
      nome: "Emblema Dshow",
      descricao: "O pixel fundador, preso ao peito de quem é da casa.",
      raridade: "exclusivo",
      tema: "dshow",
      usaCores: ["destaque"],
      render: (p, u) => pino(u, "eds", "#0a0e18", p.destaque.base, `
      <rect x="-5" y="-5" width="10" height="10" rx="2" fill="${p.destaque.base}">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.6s" repeatCount="indefinite"/>
      </rect>`)
    },
    {
      id: "emb_nexus",
      categoria: "emblema",
      nome: "Selo Nexus",
      descricao: "O hexágono da rede — todos os nós respondem a você.",
      raridade: "epico",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p, u) => pino(u, "enx", "#101726", alfa(p.destaque.base, 0.8), `
      <path d="M0 -7 L6 -3.5 L6 3.5 L0 7 L-6 3.5 L-6 -3.5 Z"
        fill="none" stroke="${p.destaque.claro}" stroke-width="2"/>
      <circle r="1.8" fill="${p.destaque.claro}"/>`)
    },
    {
      id: "emb_elite",
      categoria: "emblema",
      nome: "Estrela Elite",
      descricao: "Cinco pontas. Zero sorte. Só resultado.",
      raridade: "lendario",
      tema: "executivo",
      usaCores: [],
      render: (_p, u) => pino(u, "eel", "#221a08", "#e8b64c", `
      <path d="M0 -7 L2 -2.2 L7 -2.2 L3 1.2 L4.4 6.4 L0 3.4 L-4.4 6.4 L-3 1.2 L-7 -2.2 L-2 -2.2 Z"
        fill="#e8b64c"/>`)
    },
    {
      id: "emb_cyber",
      categoria: "emblema",
      nome: "Divisa Cyber",
      descricao: "Duas divisas aceleradas — patente das vielas de neon.",
      raridade: "raro",
      tema: "cyberpunk",
      usaCores: ["destaque"],
      render: (p, u) => pino(u, "ecy", "#0c1220", alfa(p.destaque.base, 0.75), `
      <g fill="none" stroke="${p.destaque.claro}" stroke-width="2.2" stroke-linecap="round">
        <path d="M-5 3 L0 -3 L5 3"/>
        <path d="M-5 8 L0 2 L5 8" opacity="0.55"/>
      </g>`)
    },
    {
      id: "emb_diamond",
      categoria: "emblema",
      nome: "Broche Diamond",
      descricao: "Lapidado sob pressão, como todo trimestre fechado.",
      raridade: "lendario",
      tema: "executivo",
      usaCores: ["destaque"],
      render: (p, u) => pino(u, "edm", "#101726", alfa(p.destaque.claro, 0.9), `
      <path d="M-6 -2 L-3 -6 L3 -6 L6 -2 L0 7 Z"
        fill="${alfa(p.destaque.claro, 0.85)}" stroke="${p.destaque.base}" stroke-width="1.4"/>
      <path d="M-6 -2 L6 -2 M-3 -6 L0 7 M3 -6 L0 7"
        fill="none" stroke="${alfa("#0a0e18", 0.5)}" stroke-width="0.9"/>`)
    },
    {
      id: "emb_raio",
      categoria: "emblema",
      nome: "Pino Relâmpago",
      descricao: "Energia de sobra para o sprint que vier.",
      raridade: "incomum",
      tema: "gamer",
      usaCores: ["destaque"],
      render: (p, u) => pino(u, "erl", "#141926", alfa(p.destaque.base, 0.8), `
      <path d="M1 -8 L-4 1 L0 1 L-1 8 L5 -2 L1 -2 Z" fill="${p.destaque.claro}"/>`)
    },
    {
      id: "emb_alvo",
      categoria: "emblema",
      nome: "Alvo Certeiro",
      descricao: "Três círculos. Um destino: o centro.",
      raridade: "raro",
      tema: "executivo",
      usaCores: ["destaque"],
      render: (p, u) => pino(u, "eal", "#101726", alfa(p.destaque.base, 0.75), `
      <circle r="7" fill="none" stroke="${alfa(p.destaque.claro, 0.8)}" stroke-width="1.6"/>
      <circle r="3.6" fill="none" stroke="${alfa(p.destaque.claro, 0.9)}" stroke-width="1.6"/>
      <circle r="1.4" fill="${p.destaque.claro}"/>`)
    },
    {
      id: "emb_coroa",
      categoria: "emblema",
      nome: "Coroa de Bolso",
      descricao: "Realeza discreta, presa à lapela.",
      raridade: "lendario",
      tema: "fantasia",
      usaCores: [],
      render: (_p, u) => pino(u, "eco", "#221a08", "#e8b64c", `
      <path d="M-6 3 L-6 -2 L-3 1 L0 -5 L3 1 L6 -2 L6 3 Z" fill="#e8b64c"/>
      <path d="M-6 5 h12 v2 h-12 z" fill="${alfa("#e8b64c", 0.7)}"/>`)
    },
    // ── 4.6 F2 · Onda 3 — 6 emblemas novos ────────────────────────────
    {
      id: "emb_foguete",
      categoria: "emblema",
      nome: "Foguete",
      descricao: "Lançamento confirmado — sem janela de rollback.",
      raridade: "raro",
      tema: "espaço",
      usaCores: ["destaque"],
      render: (p, u) => pino(u, "efg", "#0d1424", alfa(p.destaque.base, 0.8), `
      <path d="M0 -8 c 3 3 4 8 3 12 h -6 c -1 -4 0 -9 3 -12 z" fill="#e8ecf5"/>
      <path d="M-3 4 l -3 4 l 4 -1 M3 4 l 3 4 l -4 -1" fill="${p.destaque.base}" stroke="${p.destaque.base}" stroke-width="1"/>
      <circle cy="-1" r="1.8" fill="${p.destaque.base}"/>
      <path d="M-1 8 q 1 3 2 0" stroke="#ffb54d" stroke-width="1.6" fill="none">
        <animate attributeName="opacity" values="1;0.3;1" dur="0.9s" repeatCount="indefinite"/>
      </path>`)
    },
    {
      id: "emb_escudo",
      categoria: "emblema",
      nome: "Escudo",
      descricao: "Defesa em primeiro lugar — o resto é contra-ataque.",
      raridade: "incomum",
      tema: "aventura",
      usaCores: ["destaque"],
      render: (p, u) => pino(u, "esc", "#101726", alfa(p.destaque.base, 0.7), `
      <path d="M0 -7 c 3 2 6 2 8 2 c 0 6 -2 10 -8 12 c -6 -2 -8 -6 -8 -12 c 2 0 5 0 8 -2 z" fill="none" stroke="${p.destaque.claro}" stroke-width="1.8"/>
      <path d="M-3 0 l 2.4 2.6 l 4 -5" stroke="${p.destaque.claro}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`)
    },
    {
      id: "emb_coracao_pixel",
      categoria: "emblema",
      nome: "Coração Pixel",
      descricao: "HP cheio para o boss da sexta-feira.",
      raridade: "raro",
      tema: "gamer",
      render: (_p, u) => {
        const mapa = [[-5, -5], [-3, -5], [1, -5], [3, -5], [-7, -3], [-1, -3], [5, -3], [-7, -1], [5, -1], [-5, 1], [3, 1], [-3, 3], [1, 3], [-1, 5]];
        let px = "";
        for (const [x, y] of mapa) {
          px += `<rect x="${x}" y="${y}" width="2.2" height="2.2" fill="#ff4d5e"/>`;
        }
        return pino(u, "ecp", "#160a10", "#ff4d5e", px);
      }
    },
    {
      id: "emb_infinito",
      categoria: "emblema",
      nome: "Infinito",
      descricao: "Escala sem teto, roadmap sem fim.",
      raridade: "epico",
      tema: "tecnologia",
      usaCores: ["destaque"],
      render: (p, u) => pino(u, "einf", "#0d1220", alfa(p.destaque.base, 0.8), `
      <path d="M-7 0 c 0 -3.4 5 -3.4 7 0 c 2 3.4 7 3.4 7 0 c 0 -3.4 -5 -3.4 -7 0 c -2 3.4 -7 3.4 -7 0 z" fill="none" stroke="${p.destaque.claro}" stroke-width="2">
        <animate attributeName="stroke-dasharray" values="6 30;36 0;6 30" dur="3.4s" repeatCount="indefinite"/>
      </path>`)
    },
    {
      id: "emb_engrenagem",
      categoria: "emblema",
      nome: "Engrenagem",
      descricao: "A peça que faz o resto girar.",
      raridade: "comum",
      tema: "tecnologia",
      render: (_p, u) => {
        let dentes = "";
        for (let i = 0; i < 8; i++) {
          dentes += `<rect x="-1.6" y="-9" width="3.2" height="3.4" rx="1" fill="#c4c9d6" transform="rotate(${i * 45})"/>`;
        }
        return pino(u, "eng", "#161b28", "#5a6274", `
      <g>${dentes}
        <animateTransform attributeName="transform" type="rotate" values="0;360" dur="10s" repeatCount="indefinite"/>
      </g>
      <circle r="5.6" fill="none" stroke="#c4c9d6" stroke-width="2"/>
      <circle r="1.8" fill="#c4c9d6"/>`);
      }
    },
    {
      id: "emb_fenix",
      categoria: "emblema",
      nome: "Fênix",
      descricao: "Caiu em produção, renasceu no hotfix.",
      raridade: "lendario",
      bloqueadoPor: "conquista:assiduo_30",
      tema: "fantasia",
      render: (_p, u) => pino(u, "efx", "#1c0a06", "#ff8a3d", `
      <path d="M0 6 c -5 -2 -7 -7 -5 -11 c 1 2 3 3 4 3 c -1 -3 0 -6 3 -8 c 0 3 1 5 3 6 c 2 -1 3 -3 3 -5 c 2 4 1 9 -3 12 c -1 1 -3 3 -5 3 z" fill="url(#${u}efxg)"/>
      <defs>
        <linearGradient id="${u}efxg" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#ff5230"/>
          <stop offset="1" stop-color="#ffd75e"/>
        </linearGradient>
      </defs>
      <circle cx="1" cy="-4" r="0.9" fill="#1c0a06"/>`)
    },
    // ── 4.6 F2 · Onda 5 — 6 emblemas novos (20 total) ─────────────────
    {
      id: "emb_trofeu",
      categoria: "emblema",
      nome: "Trofeuzinho",
      descricao: "A taça do último campeonato interno.",
      raridade: "raro",
      tema: "esportivo",
      render: (_p, u) => pino(u, "etf", "#1c1608", "#e8b64c", `
      <path d="M-4 -6 h 8 v 3 a 4 4 0 0 1 -8 0 z" fill="#e8b64c"/>
      <path d="M-6 -5.5 a 2.5 2.5 0 0 0 2.5 3 M6 -5.5 a 2.5 2.5 0 0 1 -2.5 3" stroke="#e8b64c" stroke-width="1.2" fill="none"/>
      <path d="M-1.4 1 h 2.8 v 2.4 h -2.8 z M-3 3.4 h 6 v 1.8 h -6 z" fill="#b07d1e"/>`)
    },
    {
      id: "emb_cafe",
      categoria: "emblema",
      nome: "Xícara Eterna",
      descricao: "O combustível oficial do quarto deploy do dia.",
      raridade: "comum",
      tema: "casual",
      render: (_p, u) => pino(u, "ecf", "#1a120c", "#b07a4e", `
      <path d="M-5 -2 h 8 v 5 a 4 4 0 0 1 -8 0 z" fill="#f4f0e6"/>
      <path d="M3 -1 a 2.6 2.6 0 0 1 0 5" stroke="#f4f0e6" stroke-width="1.4" fill="none"/>
      <path d="M-3.5 -5 q 1 -2 0 -3.5 M-0.5 -5 q 1 -2 0 -3.5" stroke="rgba(244,240,230,0.6)" stroke-width="1.2" fill="none" stroke-linecap="round">
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.4s" repeatCount="indefinite"/>
      </path>`)
    },
    {
      id: "emb_grafico",
      categoria: "emblema",
      nome: "Curva de Alta",
      descricao: "A única direção aceitável: para cima e para a direita.",
      raridade: "incomum",
      tema: "executivo",
      render: (_p, u) => pino(u, "egr", "#0d1a12", "#4cd97c", `
      <path d="M-6 5 L-2 0 L1 2.4 L6 -5" stroke="#4cd97c" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M3 -5.5 L6 -5 L5.5 -2" stroke="#4cd97c" stroke-width="1.8" fill="none" stroke-linecap="round"/>`)
    },
    {
      id: "emb_lua",
      categoria: "emblema",
      nome: "Quarto Crescente",
      descricao: "Time da madrugada, com orgulho e café.",
      raridade: "raro",
      tema: "espaço",
      render: (_p, u) => pino(u, "elu", "#0c1024", "#cfe0ff", `
      <path d="M2 -7 a 7 7 0 1 0 0 14 a 5.6 5.6 0 0 1 0 -14 z" fill="#eef4ff"/>
      <circle cx="-4" cy="-3" r="0.9" fill="#eef4ff" opacity="0.8"/>
      <circle cx="-5.5" cy="2" r="0.6" fill="#eef4ff" opacity="0.6"/>`)
    },
    {
      id: "emb_dado",
      categoria: "emblema",
      nome: "D20 da Sorte",
      descricao: "Rolou 20 natural na daily. Crítico de produtividade.",
      raridade: "epico",
      tema: "gamer",
      usaCores: ["destaque"],
      render: (p, u) => pino(u, "ed20", "#120a1c", alfa(p.destaque.base, 0.85), `
      <path d="M0 -8 L7 -3 L7 3 L0 8 L-7 3 L-7 -3 Z" fill="none" stroke="${p.destaque.claro}" stroke-width="1.6"/>
      <path d="M0 -8 L4.5 -1 L0 8 M0 -8 L-4.5 -1 L0 8 M-7 -3 L-4.5 -1 L-7 3 M7 -3 L4.5 -1 L7 3 M-4.5 -1 L4.5 -1" stroke="${alfa(p.destaque.claro, 0.5)}" stroke-width="0.9" fill="none"/>
      <text x="0" y="2.4" text-anchor="middle" font-family="system-ui, sans-serif" font-size="5.5" font-weight="800" fill="${p.destaque.claro}">20</text>`)
    },
    {
      id: "emb_chave",
      categoria: "emblema",
      nome: "Chave-Mestra",
      descricao: "Abre qualquer porta — inclusive a da sala de reunião.",
      raridade: "incomum",
      tema: "aventura",
      render: (_p, u) => pino(u, "ech", "#171308", "#e8b64c", `
      <circle cx="-3" cy="-3" r="3.4" fill="none" stroke="#e8b64c" stroke-width="1.8"/>
      <path d="M-0.6 -0.6 L5 5 M3 3 L5 1 M4 4 L6 2" stroke="#e8b64c" stroke-width="1.8" fill="none" stroke-linecap="round"/>`)
    }
  ];

  // public/components/panels/panel-avatar-studio/src/services/AvatarCatalog.ts
  var VERSAO_CONFIG = 2;
  var CATEGORIAS = [
    { id: "base", nome: "Rosto", obrigatoria: true, grupo: "identidade" },
    { id: "cabelo", nome: "Cabelo", obrigatoria: false, grupo: "cabelo" },
    { id: "olhos", nome: "Olhos", obrigatoria: true, grupo: "corpo" },
    { id: "boca", nome: "Boca", obrigatoria: true, grupo: "corpo" },
    // onda 1414 (#162): categorias FACIAIS novas — visíveis só com as flags
    // (categoriasAtivas); validarConfig aceita o campo sempre (dado > UI)
    { id: "sobrancelha", nome: "Sobrancelha", obrigatoria: false, grupo: "corpo" },
    { id: "nariz", nome: "Nariz", obrigatoria: false, grupo: "corpo" },
    { id: "barba", nome: "Barba", obrigatoria: false, grupo: "cabelo" },
    { id: "roupa", nome: "Roupa", obrigatoria: true, grupo: "vestuario" },
    // onda 1415 (#191): roupa INFERIOR (rin_*) — visível só com as6.roupa_premium
    { id: "roupa_inferior", nome: "Calça", obrigatoria: false, grupo: "vestuario" },
    // AS6 §3393 (decisão #95): multi-peça — visível só com as6.creator_v6
    // (categoriasAtivas); o validarConfig aceita o campo sempre (dado > UI)
    { id: "roupa_sobre", nome: "Sobrepeça", obrigatoria: false, grupo: "vestuario" },
    { id: "acessorio", nome: "Acessório", obrigatoria: false, grupo: "equipamentos" },
    { id: "fundo", nome: "Fundo", obrigatoria: true, grupo: "aparencia" },
    { id: "moldura", nome: "Moldura", obrigatoria: false, grupo: "aparencia" },
    { id: "efeito", nome: "Efeito", obrigatoria: false, grupo: "poderes" },
    // Expansão (decisão #33 — 2D imediato nas categorias de baixo custo)
    { id: "aura", nome: "Aura", obrigatoria: false, grupo: "poderes" },
    { id: "banner", nome: "Banner", obrigatoria: false, grupo: "aparencia" },
    { id: "emblema", nome: "Emblema", obrigatoria: false, grupo: "equipamentos" }
  ];
  var TITULOS = [
    { id: "tit_estrategista", nome: "Estrategista", raridade: "incomum", lore: "Três jogadas à frente, sempre." },
    { id: "tit_pro_player", nome: "Pro Player", raridade: "raro", lore: "O GG dele ecoa na arena até hoje." },
    { id: "tit_elite_trader", nome: "Elite Trader", raridade: "raro", lore: "Compra no fundo. Vende no topo. Repete." },
    { id: "tit_cyber_architect", nome: "Cyber Architect", raridade: "epico", lore: "Desenha sistemas que sonham em produção." },
    { id: "tit_nexus_commander", nome: "Nexus Commander", raridade: "epico", lore: "Todos os nós da rede respondem ao seu comando." },
    { id: "tit_mestre_da_luz", nome: "Mestre da Luz", raridade: "lendario", lore: "Onde ele passa, o dashboard acende." },
    { id: "tit_ceo_supremo", nome: "CEO Supremo", raridade: "lendario", lore: "A última palavra em qualquer reunião." },
    { id: "tit_lenda_dshow", nome: "Lenda Dshow", raridade: "exclusivo", lore: "O nome que a casa conta para os novatos." },
    { id: "tit_novato_promissor", nome: "Novato Promissor", raridade: "comum", lore: "Chegou ontem. Já entregou hoje." },
    { id: "tit_guardiao_da_base", nome: "Guardião da Base", raridade: "incomum", lore: "Nada entra, nada cai, nada passa." },
    { id: "tit_maquina_de_meta", nome: "Máquina de Meta", raridade: "raro", lore: "Bateu. Rebateu. Pediu outra." },
    { id: "tit_visionario", nome: "Visionário", raridade: "epico", lore: "Enxerga o Q4 em pleno janeiro." },
    // 4.6 F2 · Onda 3 — 10 títulos novos (rumo à meta §28: 30)
    { id: "tit_arquiteto_de_dados", nome: "Arquiteto de Dados", raridade: "raro", lore: "Cada tabela no lugar, cada índice com propósito." },
    { id: "tit_cacador_de_bugs", nome: "Caçador de Bugs", raridade: "incomum", lore: "O stack trace treme quando ele abre o console." },
    { id: "tit_mestre_do_pitch", nome: "Mestre do Pitch", raridade: "raro", lore: "Três slides. Dois minutos. Um sim." },
    { id: "tit_senhor_dos_dashboards", nome: "Senhor dos Dashboards", raridade: "epico", lore: "Um painel para a todos governar." },
    { id: "tit_alquimista_de_leads", nome: "Alquimista de Leads", raridade: "epico", lore: "Transforma clique frio em contrato assinado." },
    { id: "tit_imperador_do_roi", nome: "Imperador do ROI", raridade: "lendario", lore: "Cada real investido volta fazendo reverência." },
    { id: "tit_guardiao_do_uptime", nome: "Guardião do Uptime", raridade: "raro", lore: "99,99% — e o 0,01% foi planejado." },
    { id: "tit_domador_de_algoritmos", nome: "Domador de Algoritmos", raridade: "epico", lore: "O leilão de anúncios obedece ao seu assobio." },
    { id: "tit_forjado_na_madrugada", nome: "Forjado na Madrugada", raridade: "incomum", lore: "O deploy das 3h47 conta a história." },
    { id: "tit_oraculo", nome: "Oráculo", raridade: "mitico", lore: "Não prevê o futuro. Configura ele." },
    // 4.6 F2 · Onda 5 — 8 títulos novos (meta §28: 30 ✓)
    { id: "tit_lider_de_guilda", nome: "Líder de Guilda", raridade: "raro", lore: "A raid do trimestre não se organiza sozinha." },
    { id: "tit_ninja_do_excel", nome: "Ninja do Excel", raridade: "incomum", lore: "PROCV na mão esquerda, tabela dinâmica na direita." },
    { id: "tit_barao_dos_cliques", nome: "Barão dos Cliques", raridade: "epico", lore: "CTR de dois dígitos e um monóculo de respeito." },
    { id: "tit_sussurrador_de_apis", nome: "Sussurrador de APIs", raridade: "raro", lore: "Fala baixinho com o endpoint e ele responde 200." },
    { id: "tit_colecionador", nome: "Colecionador de Conquistas", raridade: "incomum", lore: "A estante de troféus pediu reforço estrutural." },
    { id: "tit_mago_do_funil", nome: "Mago do Funil", raridade: "epico", lore: "Transforma topo em fundo com um passe de mãos." },
    { id: "tit_sentinela", nome: "Sentinela da Madrugada", raridade: "raro", lore: "Enquanto o dash dorme, alguém vigia os alertas." },
    { id: "tit_avatar_supremo", nome: "Avatar Supremo", raridade: "lendario", lore: "Dominou os quatro elementos: 2D, 3D, foto e estilo." }
  ];
  var TITULOS_POR_ID = new Map(TITULOS.map((t) => [t.id, t]));
  function tituloPorId(id) {
    return id ? TITULOS_POR_ID.get(id) : void 0;
  }
  var ARQUETIPOS = [
    {
      id: "arq_executivo",
      nome: "Executivo",
      papel: "Fecha o trimestre antes do café esfriar.",
      raridade: "comum",
      base: "bas_classica",
      camadas: { cabelo: "cab_curto", olhos: "olh_serio", boca: "boc_neutra", roupa: "rou_social", fundo: "fun_estudio", banner: "ban_executivo", emblema: "emb_elite" },
      cores: { roupa: "#1c2433", destaque: "#e8b64c" },
      titulo: "tit_elite_trader"
    },
    {
      id: "arq_ceo",
      nome: "CEO",
      papel: "A última palavra — e a primeira visão.",
      raridade: "lendario",
      base: "bas_angular",
      camadas: { cabelo: "cab_topete", olhos: "olh_focado", boca: "boc_determinada", roupa: "rou_terno", acessorio: "ace_oculos", fundo: "fun_estudio", banner: "ban_executivo", emblema: "emb_diamond" },
      cores: { roupa: "#14213d", destaque: "#e8b64c" },
      titulo: "tit_ceo_supremo"
    },
    {
      id: "arq_engenheiro",
      nome: "Engenheiro",
      papel: "Se está de pé, foi ele que estruturou.",
      raridade: "comum",
      base: "bas_classica",
      camadas: { cabelo: "cab_coque", olhos: "olh_focado", boca: "boc_neutra", roupa: "rou_camiseta", acessorio: "ace_oculos", fundo: "fun_grade", emblema: "emb_nexus" },
      cores: { roupa: "#2563eb", destaque: "#4c9de8" }
    },
    {
      id: "arq_programador",
      nome: "Programador",
      papel: "Compila sonhos. Debuga pesadelos.",
      raridade: "raro",
      base: "bas_classica",
      camadas: { cabelo: "cab_franja", olhos: "olh_cansado", boca: "boc_lado", roupa: "rou_hoodie", acessorio: "ace_fone", fundo: "fun_circuito", efeito: "efe_chuva", emblema: "emb_cyber" },
      cores: { roupa: "#0f766e", destaque: "#4cd97c" },
      titulo: "tit_cyber_architect"
    },
    {
      id: "arq_comercial",
      nome: "Comercial",
      papel: "O funil respeita quem sorri primeiro.",
      raridade: "comum",
      base: "bas_angular",
      camadas: { cabelo: "cab_topete", olhos: "olh_feliz", boca: "boc_sorriso", roupa: "rou_social", fundo: "fun_estudio", emblema: "emb_elite" },
      cores: { roupa: "#5b3a8f", destaque: "#ff5f8f" }
    },
    {
      id: "arq_cientista",
      nome: "Cientista",
      papel: "Hipótese, teste, verdade. Nessa ordem.",
      raridade: "raro",
      base: "bas_classica",
      camadas: { cabelo: "cab_cacheado", olhos: "olh_brilho", boca: "boc_surpresa", roupa: "rou_camiseta", acessorio: "ace_oculos", fundo: "fun_lab", aura: "aur_plasma" },
      cores: { roupa: "#e8ecf5", destaque: "#4cd9e8" }
    },
    {
      id: "arq_hacker",
      nome: "Hacker",
      papel: "As portas não sabem que estão abertas.",
      raridade: "epico",
      base: "bas_classica",
      camadas: { cabelo: "cab_cyber", olhos: "olh_misterioso", boca: "boc_lado", roupa: "rou_jaqueta", fundo: "fun_circuito", efeito: "efe_glitch", banner: "ban_cyber", emblema: "emb_cyber" },
      cores: { roupa: "#101726", destaque: "#4cd97c" }
    },
    {
      id: "arq_operador",
      nome: "Operador",
      papel: "Sintético, pontual e impossível de travar.",
      raridade: "epico",
      base: "bas_androide",
      camadas: { olhos: "olh_led", boca: "boc_grade", roupa: "rou_armadura", fundo: "fun_led_wall", aura: "aur_neon", emblema: "emb_nexus" },
      cores: { pele: "#c8d4e8", destaque: "#4cd9e8" },
      titulo: "tit_nexus_commander"
    },
    {
      id: "arq_samurai",
      nome: "Samurai",
      papel: "Treina antes do stand-up. Todos os dias.",
      raridade: "epico",
      base: "bas_angular",
      camadas: { cabelo: "cab_coque", olhos: "olh_serio", boca: "boc_determinada", roupa: "rou_kimono", fundo: "fun_dojo", aura: "aur_cristal" },
      cores: { roupa: "#d64545", destaque: "#ff5230" }
    },
    {
      id: "arq_guerreiro",
      nome: "Guerreiro",
      papel: "A matilha confia. A meta cai.",
      raridade: "epico",
      base: "bas_lobo",
      camadas: { olhos: "olh_serio", boca: "boc_determinada", roupa: "rou_armadura", fundo: "fun_arena", aura: "aur_eletrica", emblema: "emb_elite" },
      cores: { destaque: "#ff5230" }
    },
    {
      id: "arq_explorador",
      nome: "Explorador",
      papel: "O mapa termina onde ele começa.",
      raridade: "raro",
      base: "bas_raposa",
      camadas: { olhos: "olh_brincalhao", boca: "boc_sorriso", roupa: "rou_jaqueta", acessorio: "ace_cachecol", fundo: "fun_aurora", banner: "ban_galaxy" },
      cores: { destaque: "#e8b64c" }
    },
    {
      id: "arq_piloto",
      nome: "Piloto",
      papel: "Viu a Terra de cima e voltou com metas maiores.",
      raridade: "lendario",
      base: "bas_classica",
      camadas: { cabelo: "cab_curto", olhos: "olh_visor", boca: "boc_determinada", roupa: "rou_astronauta", fundo: "fun_nebulosa", banner: "ban_galaxy", aura: "aur_plasma" },
      cores: { roupa: "#e8ecf5", destaque: "#4c9de8" }
    }
  ];
  var RARIDADES = {
    comum: { nome: "Comum", cor: "#9aa4b8", peso: 40, nivel: 0 },
    incomum: { nome: "Incomum", cor: "#4cd97c", peso: 28, nivel: 1 },
    raro: { nome: "Raro", cor: "#4c9de8", peso: 16, nivel: 2 },
    epico: { nome: "Épico", cor: "#b06ce8", peso: 9, nivel: 3 },
    lendario: { nome: "Lendário", cor: "#e8b64c", peso: 5, nivel: 4 },
    mitico: { nome: "Mítico", cor: "#ff5230", peso: 3, nivel: 5 },
    exclusivo: { nome: "Exclusivo", cor: "#ff5f8f", peso: 2, nivel: 6 }
  };
  var LORES = {
    // raros
    cab_longo: "Dizem que cresceu um centímetro a cada meta batida. Ninguém ousou duvidar.",
    cab_moicano: "Forjado numa madrugada de deploy sem rollback. Sobreviveu. A crista ficou.",
    olh_brilho: "Quem viu o dashboard todo verde pela primeira vez nunca mais olhou igual.",
    olh_led: "Óptica sintética calibrada em 60fps. Não pisca — renderiza.",
    boc_grade: "O alto-falante original do primeiro LED Bot da Dshow. Ainda ecoa.",
    rou_jaqueta: "Costurada para quem cruza a linha de chegada antes do relatório carregar.",
    rou_gamer: "Jersey da primeira line-up campeã. O raio no peito não é enfeite — é aviso.",
    ace_bone: "Aba reta, ego alinhado. Edição de estreia da collab que nunca foi anunciada.",
    fun_circuito: "Um recorte da placa-mãe do servidor original, energizada até hoje.",
    fun_nebulosa: "Poeira de estrela recolhida no exato instante em que uma ideia nasceu.",
    mol_tech: "Suportes de HUD arrancados de um cockpit de simulação militar.",
    efe_aura: "Vaza energia de quem carrega o trimestre nas costas. Contenha-se.",
    efe_chuva: "Fragmento do código-fonte primordial. Se você lê os símbolos, já é tarde.",
    efe_particulas: "Cada ponto de luz é uma tarefa concluída flutuando em paz.",
    // épicos
    bas_androide: "Chassi da série NEXUS-7, aposentado do laboratório com honras e segredos.",
    cab_cyber: "O undercut oficial da resistência digital. As trilhas raspadas brilham no escuro.",
    olh_visor: "HUD tático de quem enxerga o funil inteiro antes do lead piscar.",
    rou_terno: "Alfaiataria de guerra corporativa. Cada costura fechou um contrato.",
    ace_headset: 'As conchas que ouviram o "GG" da grande final. O RGB nunca apagou.',
    fun_aurora: "O céu polar que apareceu uma única noite sobre o data center.",
    mol_neon: "Tubo de neon soprado por um artesão de arcade em 1989. Ainda pulsa.",
    // lendários
    bas_holo: "Projeção volumétrica de uma consciência que escolheu ficar.",
    rou_armadura: "Peitoral NEXUS com núcleo de energia própria. Bate no ritmo do usuário.",
    ace_coroa: "Só encosta na cabeça de quem já foi Top 1. Ela sabe. Sempre soube.",
    fun_arena: "A arena lotada no ponto exato do último round. O grito ficou preso aqui.",
    mol_ouro: "Fundida com o ouro das metas impossíveis. As gemas são as exceções.",
    efe_faiscas: "Resíduo de troféu recém-polido. Gruda em quem vence com estilo.",
    // exclusivos
    mol_dshow: "A assinatura da casa. Não se compra, não se pede — se reconhece.",
    // espécies (F2b)
    bas_panda: "Mastiga bambu e backlog na mesma velocidade: devagar e sem errar.",
    bas_coruja: "Plantonista noturna oficial. Nenhum log passa despercebido.",
    bas_raposa: "Fechou três negociações antes de você abrir o CRM.",
    bas_lobo: "O uivo dele é o sino de meta batida.",
    bas_leao: "Não disputa território: o território é dele desde o onboarding.",
    bas_alien: 'Classificou a Terra como "habitável, mas o wi-fi cai". Ficou mesmo assim.',
    bas_ledbot: "Primeiro pixel aceso da Dshow. Todo painel que brilha descende dele.",
    // expressões (F2b)
    olh_misterioso: "Os olhos brilham no escuro da sala de reunião. Ninguém pergunta por quê.",
    olh_vilao: "Vermelho não é raiva. É foco em modo absoluto.",
    boc_vilao: "Sorriu assim uma vez. O concorrente mudou de nicho.",
    // poderes (F2b)
    efe_portal: "Ninguém sabe para onde leva. Ele volta sempre com resultados.",
    efe_raio: "A energia estática de quem carrega três sprints no corpo.",
    efe_glitch: "Um erro de renderização? Não. Um aviso.",
    efe_fogo: "Arde desde o primeiro trimestre. Nunca precisou de gatilho.",
    // F2b2
    rou_kimono: "Costurado por um mestre que só aceitava pagamento em disciplina.",
    rou_astronauta: 'Voltou da órbita com um adesivo: "meu outro veículo é um dashboard".',
    rou_moletom_dshow: "Distribuído no primeiro all-hands. Quem tem, não lava — preserva.",
    ace_chapeu_mago: "Sussurra queries otimizadas para quem o veste. Às vezes em latim.",
    ace_drone: 'Firmware v0.1 até hoje. Recusa updates: "estou funcionando, não encosta".',
    fun_lab: "Aqui nasceram os modelos que ninguém teve coragem de desligar.",
    fun_dojo: 'O sensei só disse uma coisa: "meça duas vezes, publique uma".',
    mol_rgb: "Se não tem RGB, nem é setup. Lei universal.",
    mol_cristal: "Congelou no exato instante de um recorde. Nunca mais derreteu.",
    // F3 — recompensas de conquista e itens de evento
    mol_pioneiro: "Forjada para quem chegou primeiro. O relógio no topo marca aquele exato momento.",
    efe_confete: "Caiu na primeira comemoração e nunca parou. Ninguém varre. Ninguém quer.",
    ace_medalha: "Trinta dias. Parece pouco até você contar as segundas-feiras.",
    ace_gorro_natal: "Dezembro oficial da Dshow: meta fechada, gorro na cabeça.",
    ace_chapeu_bruxa: "Dizem que quem o veste em outubro faz as queries voarem."
  };
  var PARTES = [
    ...BASES,
    ...BASES_PREMIUM,
    ...ESPECIES,
    ...CABELOS,
    ...CABELOS_PREMIUM,
    ...OLHOS,
    ...OLHOS_PREMIUM,
    ...BOCAS,
    ...BOCAS_PREMIUM,
    ...ROUPAS,
    ...ROUPAS_PREMIUM,
    ...BARBAS_PREMIUM,
    ...SOBRANCELHAS_PREMIUM,
    ...NARIZES_PREMIUM,
    // onda 1414 (#162)
    ...ROUPAS_PREMIUM_1415,
    ...SOBREPECAS_PREMIUM,
    ...ROUPAS_INFERIORES,
    ...CALCADOS_PREMIUM,
    // onda 1415 (#191)
    ...ROUPAS_INFERIORES_SEED,
    ...CALCADOS_SEED,
    // decisao #50 (seed complementar de vestuario)
    ...HEROES_2D,
    // Golden A+2: heroes autorados (id `_hx_`), listados só com as6.hero_2d
    ...ACESSORIOS_PREMIUM,
    // onda 1416 (#196)
    ...FUNDOS_PREMIUM,
    ...AURAS_PREMIUM,
    ...MOLDURAS_PREMIUM,
    // onda 1417 (#199)
    ...SOBREPECAS,
    // §3393 (decisão #95): wrappers — zero arte nova
    ...ACESSORIOS,
    ...FUNDOS,
    ...MOLDURAS,
    ...EFEITOS,
    ...AURAS,
    ...BANNERS,
    ...EMBLEMAS
  ].map((x) => ({
    ...x,
    biblioteca: x.biblioteca ?? "dshow",
    lore: x.lore ?? LORES[x.id],
    // olhos tech não piscam no idle (AS3 §5.1)
    piscar: x.piscar ?? !(x.id === "olh_visor" || x.id === "olh_led")
  }));
  var POR_ID3 = new Map(PARTES.map((x) => [x.id, x]));
  function itemPorId(id) {
    return POR_ID3.get(id);
  }
  function itensDe(categoria) {
    return PARTES.filter((x) => x.categoria === categoria && (x.acabamento !== "premium" || flag("as6.classico_premium")) && (!/_hx_/.test(x.id) || flag("as6.hero_2d")) && (!VESTUARIO_SEED_IDS.includes(x.id) || flag("as6.vestuario_separado")));
  }
  function categoriasAtivas() {
    const gate = {
      roupa_sobre: "as6.creator_v6",
      barba: "as6.barba_slot",
      sobrancelha: "as6.brow_slot",
      nariz: "as6.face_v2",
      roupa_inferior: "as6.roupa_premium"
      // onda 1415 (#191)
    };
    return CATEGORIAS.filter((c) => {
      const f = gate[c.id];
      return !f || flag(f);
    });
  }
  function presetsAtivos() {
    return PRESETS.filter((pr) => pr.config.acabamento !== "premium" || flag("as6.classico_premium"));
  }
  var CORES_SUGERIDAS = {
    // onda 1415 (#191): canal secundário — forros/camadas internas
    secundario: ["#2b2f3a", "#8a93a6", "#c4c9d6", "#5b3d8a", "#1f6e5a", "#7a2d3c", "#c9a75a", "#e8e6e0"],
    pele: ["#f5d0a9", "#e8b58c", "#d29e6f", "#b07a4e", "#8a5a35", "#5f3d23", "#c8d4e8", "#9fe8c8"],
    cabelo: ["#14100c", "#3d2b1f", "#6b4a2a", "#a06a30", "#d9b166", "#b8bcc8", "#e84c6f", "#4c9de8", "#7c5cff", "#39d98a"],
    roupa: ["#20242e", "#2d4a8a", "#1f6e5a", "#7a2d3c", "#5b3d8a", "#8a6a1f", "#c4c9d6", "#e85c3a"],
    destaque: ["#7c5cff", "#39d98a", "#4c9de8", "#ff5f8f", "#e8b64c", "#4cd9e8", "#ff7a3d", "#c9d94c"]
  };
  var CONFIG_PADRAO = {
    formato: "camadas",
    versao: VERSAO_CONFIG,
    base: "bas_classica",
    camadas: {
      cabelo: "cab_curto",
      olhos: "olh_padrao",
      boca: "boc_sorriso",
      roupa: "rou_camiseta",
      fundo: "fun_estudio"
    },
    cores: { ...CORES_PADRAO }
  };
  var CATS_OPCIONAIS = CATEGORIAS.filter((c) => c.id !== "base").map((c) => c.id);
  function validarConfig(bruto) {
    if (flag("as6.estado_vnext")) bruto = migrarConfigVNext(bruto).dado;
    const b = bruto ?? {};
    const base = typeof b.base === "string" && POR_ID3.get(b.base)?.categoria === "base" ? b.base : CONFIG_PADRAO.base;
    const camadas = {};
    const equipados = [];
    const colocar = (chave, id) => {
      if (typeof id !== "string" || id === "nenhum" || camadas[chave]) return;
      const item = POR_ID3.get(id);
      const catEsperada = chave.startsWith("acessorio") ? "acessorio" : chave;
      if (!item || item.categoria !== catEsperada) return;
      if (item.requerBase?.length && !item.requerBase.includes(base)) return;
      if (item.incompativelCom?.some((x) => equipados.includes(x))) return;
      camadas[chave] = id;
      equipados.push(id);
    };
    for (const cat of CATS_OPCIONAIS) {
      if (cat === "acessorio") continue;
      colocar(cat, b.camadas?.[cat]);
    }
    for (const s of [
      "olhos",
      "orelha",
      "costas",
      "flutuante",
      "companheiro",
      "pulso_e",
      "pulso_d",
      "mao_e",
      "mao_d",
      "cintura",
      "pernas",
      "pes"
    ]) {
      const idFino = b.camadas?.[`acessorio_${s}`];
      if (typeof idFino !== "string") continue;
      const item = POR_ID3.get(idFino);
      if (item?.categoria === "acessorio" && !equipados.includes(idFino) && slotFinoDoAsset(idFino, item.slot ?? "cabeca") === s) {
        colocar(`acessorio_${s}`, idFino);
      }
    }
    const candidatos = [
      b.camadas?.acessorio_cabeca,
      b.camadas?.acessorio_rosto,
      b.camadas?.acessorio_pescoco,
      b.camadas?.acessorio
    ];
    for (const id of candidatos) {
      if (typeof id !== "string") continue;
      const item = POR_ID3.get(id);
      if (item?.categoria === "acessorio" && !equipados.includes(id)) {
        colocar(`acessorio_${item.slot ?? "cabeca"}`, id);
      }
    }
    const c = b.cores ?? {};
    const saida = {
      formato: "camadas",
      versao: VERSAO_CONFIG,
      base,
      camadas,
      cores: {
        pele: normalizarHex(c.pele, CORES_PADRAO.pele),
        cabelo: normalizarHex(c.cabelo, CORES_PADRAO.cabelo),
        roupa: normalizarHex(c.roupa, CORES_PADRAO.roupa),
        destaque: normalizarHex(c.destaque, CORES_PADRAO.destaque)
      }
    };
    const sec3 = b.cores?.secundario;
    if (typeof sec3 === "string" && /^#[0-9a-f]{6}$/i.test(sec3)) {
      saida.cores.secundario = sec3.toLowerCase();
    }
    if (typeof b.titulo === "string" && TITULOS_POR_ID.has(b.titulo)) {
      saida.titulo = b.titulo;
    }
    if (b.params && typeof b.params === "object") {
      const params = {};
      for (const [chave, bruto2] of Object.entries(b.params)) {
        if (!camadas[chave]) continue;
        const limpo = sanitizarParams(chave, bruto2, camadas[chave]);
        if (limpo) params[chave] = limpo;
      }
      if (Object.keys(params).length) saida.params = params;
    }
    if (b.coresCamada && typeof b.coresCamada === "object") {
      const coresCamada = {};
      for (const [chave, canais] of Object.entries(b.coresCamada)) {
        const idItem = camadas[chave];
        if (!idItem || !canais || typeof canais !== "object") continue;
        const declarados = POR_ID3.get(idItem)?.usaCores ?? [];
        const limpos = {};
        for (const canal of declarados) {
          const hex = canais[canal];
          if (typeof hex !== "string") continue;
          const global = canal === "secundario" ? saida.cores.secundario ?? secundarioPadraoDe(saida.cores.roupa) : saida.cores[canal];
          const norm = normalizarHex(hex, global);
          if (norm !== global) limpos[canal] = norm;
        }
        if (Object.keys(limpos).length) coresCamada[chave] = limpos;
      }
      if (Object.keys(coresCamada).length) saida.coresCamada = coresCamada;
    }
    if (b.corpoFino && typeof b.corpoFino === "object") {
      const cf = {};
      const lg = Number(b.corpoFino.largura);
      const al = Number(b.corpoFino.altura);
      if (Number.isFinite(lg)) {
        const v = Math.min(1.08, Math.max(0.92, lg));
        if (v !== 1) cf.largura = v;
      }
      if (Number.isFinite(al)) {
        const v = Math.min(1.04, Math.max(0.96, al));
        if (v !== 1) cf.altura = v;
      }
      if (Object.keys(cf).length > 0) saida.corpoFino = cf;
    }
    if (b.corpo === "esbelto" || b.corpo === "atletico" || b.corpo === "robusto" || b.corpo === "compacto") {
      saida.corpo = b.corpo;
    }
    {
      const v2 = sanitizarCorpoV2(b.corpoV2);
      if (v2) saida.corpoV2 = v2;
    }
    if (b.postura === "confiante" || b.postura === "relaxada" || b.postura === "executiva" || b.postura === "heroica" || b.postura === "misteriosa") {
      saida.postura = b.postura;
    }
    if (b.acabamento === "premium") saida.acabamento = "premium";
    if (b.coresFace && typeof b.coresFace === "object") {
      const cf = {};
      for (const canal of ["iris", "sobrancelha", "barba", "labios"]) {
        const bruto2 = b.coresFace[canal];
        if (typeof bruto2 === "string" && /^#[0-9a-f]{6}$/i.test(bruto2)) cf[canal] = bruto2.toLowerCase();
      }
      if (Object.keys(cf).length) saida.coresFace = cf;
    }
    if (b.expressao && typeof b.expressao === "object") {
      const preset = b.expressao.preset;
      if (typeof preset === "string" && expressaoPorId(preset)) {
        const kBruto = b.expressao.intensidade;
        const k = typeof kBruto === "number" && kBruto > 0 && kBruto < 1 ? Math.round(kBruto * 100) / 100 : void 0;
        saida.expressao = k !== void 0 ? { preset, intensidade: k } : { preset };
      }
    }
    if (b.idade === "young_adult" || b.idade === "mature") saida.idade = b.idade;
    return saida;
  }
  var PALETAS_ROUPA = [
    { id: "pal_dshow", nome: "Dshow", canais: { roupa: "#20242e", destaque: "#7c5cff" } },
    { id: "pal_executivo", nome: "Executivo", canais: { roupa: "#2b2f3a", destaque: "#c9a75a" } },
    { id: "pal_mono", nome: "Monocromático", canais: { roupa: "#3a3f4c", destaque: "#8a93a6" } },
    { id: "pal_cyber", nome: "Cyber", canais: { roupa: "#1a1035", destaque: "#4cd9e8" } },
    { id: "pal_gamer", nome: "Gamer", canais: { roupa: "#16241c", destaque: "#39d98a" } },
    { id: "pal_neon", nome: "Neon", canais: { roupa: "#241436", destaque: "#ff5f8f" } },
    { id: "pal_claro", nome: "Claro", canais: { roupa: "#c4c9d6", destaque: "#4c9de8" } },
    { id: "pal_escuro", nome: "Escuro", canais: { roupa: "#14161d", destaque: "#5b3d8a" } }
  ];
  function svgItemIsolado(id, opcoes) {
    const parte = POR_ID3.get(id);
    if (!parte) return "";
    const paleta = paletaDe({ ...CONFIG_PADRAO.cores, ...opcoes?.cores ?? {} });
    const uid = opcoes?.uid ?? `it-${id}`;
    const arte = (r, pal = paleta) => r ? r(pal, uid) : "";
    const cat = parte.categoria;
    const slot = parte.slot ?? "cabeca";
    const vestido = cat === "roupa" || cat === "roupa_sobre" || cat === "roupa_inferior";
    const corporalAcess = cat === "acessorio" && slotCorporal(slot) && !!parte.renderCorpo;
    const ghostCat = cat === "barba" || cat === "aura" || cat === "efeito";
    const palGhost = paletaDe({ pele: "#9aa0aa", cabelo: "#7c828c", roupa: "#7c828c", destaque: "#8b919b" });
    const cabecaGhost = `<ellipse cx="120" cy="72" rx="46" ry="52" fill="${palGhost.pele.base}"/><path d="M103 118 h34 v22 c0 8 -34 8 -34 0 z" fill="${palGhost.pele.escuro}"/>`;
    const ghostCorpo = (comCabeca) => `<g opacity="0.5">${comCabeca ? cabecaGhost : ""}${corpoInteiro(palGhost, uid + "gh")}</g>`;
    const bustoGhost240 = `<g opacity="0.5"><path d="M103 146 h34 v40 c0 9 -34 9 -34 0 z" fill="${palGhost.pele.escuro}"/><path d="M36 240 v-12 c0 -28 36 -46 84 -46 s84 18 84 46 v12 z" fill="${palGhost.pele.base}"/></g>`;
    const camadasAsset = (pal = paleta) => arte(parte.renderPlanos?.atras, pal) + arte(parte.renderAtras, pal) + arte(parte.render, pal) + arte(parte.renderFrente, pal) + arte(parte.renderPlanos?.frente, pal);
    let frag;
    let focoPadrao;
    if (vestido && parte.renderCorpo) {
      frag = corpoInteiro(paleta, uid) + arte(parte.renderCorpo);
      focoPadrao = cat === "roupa_inferior" ? "48 196 144 152" : "34 98 172 138";
    } else if (vestido) {
      frag = bustoGhost240 + camadasAsset();
      focoPadrao = "40 150 160 92";
    } else if (corporalAcess) {
      frag = ghostCorpo(true) + arte(parte.renderCorpo);
      focoPadrao = "0 0 240 400";
    } else if (cat === "barba") {
      const jaw = `<g opacity="0.14"><path d="M74 98 C 76 140 96 176 120 182 C 144 176 164 140 166 98 C 150 122 90 122 74 98 Z" fill="${palGhost.pele.base}"/></g>`;
      frag = jaw + camadasAsset();
      focoPadrao = "60 100 120 108";
    } else if (ghostCat) {
      frag = ghostCorpo(true) + camadasAsset();
      focoPadrao = "18 26 204 348";
    } else {
      frag = camadasAsset();
      focoPadrao = "0 0 240 240";
    }
    const foco = opcoes?.foco ?? focoPadrao;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${foco}" role="presentation">${frag}</svg>`;
  }
  function svgDe(config, opcoes) {
    const premium = opcoes?.premium ?? (config.acabamento === "premium" && flag("as6.classico_premium") && flag("as6.arte_v2"));
    const faceV2 = opcoes?.faceV2 ?? flag("as6.face_v2");
    const fitV2 = opcoes?.fitV2 ?? flag("as6.fit_v2");
    const extras = premium ? { premium } : {};
    if (faceV2) extras.faceV2 = true;
    if (fitV2) extras.fitV2 = true;
    return renderAvatar(config, itemPorId, Object.keys(extras).length ? { ...opcoes, ...extras } : opcoes);
  }
  function dataUriDe(config, opcoes) {
    return renderDataUri(config, itemPorId, opcoes);
  }
  function svgFotoDe(fotoHref, estilo, opcoes) {
    const titulo = tituloPorId(estilo.titulo);
    const cfLimpo = estilo.camadasFoto ? sanitizarCamadasFoto(estilo.camadasFoto) : {};
    const luzLimpa = estilo.luzLocal ? sanitizarLuzLocal(estilo.luzLocal) : null;
    const tpLimpa = estilo.tipografia ? sanitizarTipografiaFoto(estilo.tipografia) : {};
    const posLimpa = estilo.pos ? sanitizarPosFoto(estilo.pos) : {};
    const seloLimpo = estilo.seloCfg ? sanitizarSeloCfgFoto(estilo.seloCfg) : {};
    return renderFotoEstilizada(fotoHref, {
      camadas: estilo.camadas,
      cores: { ...CONFIG_PADRAO.cores, destaque: normalizarHex(estilo.cores.destaque, CONFIG_PADRAO.cores.destaque) },
      selo: titulo ? { nome: titulo.nome, cor: RARIDADES[titulo.raridade].cor } : void 0,
      ...estilo.ajustes ? { ajustes: estilo.ajustes } : {},
      // megas 51–54
      // mega 115 (§344): legenda SANITIZADA (whitelist de caracteres, ≤40)
      ...estilo.legenda ? { legenda: sanitizarLegendaFoto(estilo.legenda) } : {},
      // lote 161–167 (§338/§334/§343): campos novos SEMPRE validados aqui
      ...Object.keys(cfLimpo).length ? { camadasFoto: cfLimpo } : {},
      ...luzLimpa ? { luzLocal: luzLimpa } : {},
      ...Object.keys(tpLimpa).length ? { tipografia: tpLimpa } : {},
      ...estilo.subtitulo ? { subtitulo: sanitizarLegendaFoto(estilo.subtitulo) } : {},
      ...Object.keys(posLimpa).length ? { pos: posLimpa } : {},
      ...Object.keys(seloLimpo).length ? { seloCfg: seloLimpo } : {},
      // lote 981-990 (AS6 §1215, as6.foto_camadas): ordem da pilha de
      // fundo — só permutação completa/única NÃO-neutra passa (byte-estável)
      ...estilo.ordemFundo && estilo.ordemFundo.length === 3 && new Set(estilo.ordemFundo).size === 3 && estilo.ordemFundo.every((c) => c === "fundo" || c === "banner" || c === "aura") && estilo.ordemFundo.join(",") !== "fundo,banner,aura" ? { ordemFundo: estilo.ordemFundo } : {}
    }, itemPorId, { ...flag("as6.derivados") ? { reflowPos: true } : {}, ...opcoes });
  }
  function sanitizarLegendaFoto(texto) {
    return texto.replace(/[^\p{L}\p{N} .,!?'\-]/gu, "").slice(0, 40).trim();
  }
  var BLENDS_FOTO = ["normal", "multiply", "screen", "overlay", "soft-light"];
  var CORES_TEXTO_FOTO = ["#e6eaf2", "#ffd75e", "#7cd9ff", "#ff9ecb"];
  function sanitizarCamadasFoto(cfg) {
    const saida = {};
    for (const cat of CATEGORIAS_FOTO) {
      const c = cfg[cat];
      if (!c) continue;
      const limpo = {};
      if (c.oculta === true) limpo.oculta = true;
      if (typeof c.opacidade === "number" && c.opacidade >= 0.2 && c.opacidade < 1) {
        limpo.opacidade = Math.round(c.opacidade * 100) / 100;
      }
      if (c.blend && c.blend !== "normal" && BLENDS_FOTO.includes(c.blend)) limpo.blend = c.blend;
      if (cat === "efeito" && (c.plano === "atras" || c.plano === "frente")) limpo.plano = c.plano;
      if (Object.keys(limpo).length) saida[cat] = limpo;
    }
    return saida;
  }
  function sanitizarLuzLocal(luz) {
    if (luz.tipo !== "radial" && luz.tipo !== "linear") return null;
    const i = Math.max(-1, Math.min(1, Number(luz.intensidade) || 0));
    return i === 0 ? null : { tipo: luz.tipo, intensidade: Math.round(i * 100) / 100 };
  }
  function sanitizarTipografiaFoto(t) {
    const limpo = {};
    if (t.fonte === "mono" || t.fonte === "serif") limpo.fonte = t.fonte;
    if (t.peso === 400 || t.peso === 800) limpo.peso = t.peso;
    if (t.tamanho === "p" || t.tamanho === "g") limpo.tamanho = t.tamanho;
    if (t.cor && CORES_TEXTO_FOTO.includes(t.cor)) limpo.cor = t.cor;
    if (t.contorno === true) limpo.contorno = true;
    if (t.caixaAlta === true) limpo.caixaAlta = true;
    return limpo;
  }
  var ELEMENTOS_POS_FOTO = ["legenda", "subtitulo", "selo", "emblema"];
  function sanitizarPosFoto(pos) {
    const saida = {};
    for (const el of ELEMENTOS_POS_FOTO) {
      const p = pos[el];
      if (!p || typeof p.x !== "number" || typeof p.y !== "number" || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
      saida[el] = {
        x: Math.round(Math.max(-20, Math.min(980, p.x)) * 10) / 10,
        y: Math.round(Math.max(-20, Math.min(260, p.y)) * 10) / 10
      };
    }
    return saida;
  }
  function sanitizarSeloCfgFoto(cfg) {
    const limpo = {};
    if (cfg.escala === "p" || cfg.escala === "g") limpo.escala = cfg.escala;
    if (cfg.compacto === true) limpo.compacto = true;
    return limpo;
  }
  var CATEGORIAS_FOTO = ["fundo", "banner", "aura", "efeito", "moldura", "emblema"];
  var PRESETS = [
    // onda 1412 (§707–§708): GOLDEN CLASSIC male/female — vitrine do trilho
    // premium (só aparecem com as6.classico_premium: presetsAtivos filtra)
    {
      id: "pre_golden_m",
      nome: "Golden Classic — Ele",
      descricao: "O padrão-ouro do estúdio: estrutura angular, olhar confiante, terno premium.",
      raridade: "lendario",
      config: {
        base: "bas_px_angular",
        camadas: { cabelo: "cab_curto", olhos: "olh_px_confiante", boca: "boc_px_sorriso", roupa: "rou_px_terno", fundo: "fun_estudio" },
        cores: { pele: "#d29e6f", cabelo: "#14100c", roupa: "#20242e", destaque: "#c9a75a" },
        coresFace: { iris: "#4a3626" },
        acabamento: "premium"
      }
    },
    {
      id: "pre_golden_f",
      nome: "Golden Classic — Ela",
      descricao: "Rosto coração, olhar amendoado e jaqueta premium com presença.",
      raridade: "lendario",
      config: {
        base: "bas_px_coracao",
        camadas: { cabelo: "cab_ondulado", olhos: "olh_px_amendoado", boca: "boc_px_suave", roupa: "rou_px_jaqueta", fundo: "fun_estudio" },
        cores: { pele: "#e8b58c", cabelo: "#6b4a2a", roupa: "#7a2d3c", destaque: "#e8b64c" },
        coresFace: { iris: "#2f5d43" },
        acabamento: "premium"
      }
    },
    // onda 1418 (#202): presets C03–C06 — coleção "Classic Premium" completa
    {
      id: "pre_cp_boardroom",
      nome: "Boardroom",
      descricao: "C03: blazer com forro de cetim, social e sapato polido.",
      raridade: "lendario",
      config: {
        base: "bas_px_quadrada",
        camadas: { cabelo: "cab_px_lateral", barba: "brb_aparada", olhos: "olh_px_determinado", boca: "boc_px_neutra", roupa: "rou_px_blazer", roupa_inferior: "rin_social", acessorio_pes: "ace_px_social", fundo: "fun_px_estudio" },
        cores: { pele: "#c98e5f", cabelo: "#14100c", roupa: "#20242e", destaque: "#c9a75a" },
        coresFace: { iris: "#3a2a1e" },
        acabamento: "premium"
      }
    },
    {
      id: "pre_cp_offduty",
      nome: "Off-duty",
      descricao: "C04: cardigã sobre camiseta, jeans e tênis premium.",
      raridade: "epico",
      config: {
        base: "bas_px_suave",
        camadas: { cabelo: "cab_px_ondulado", olhos: "olh_px_gentil", boca: "boc_px_sorriso", roupa: "rou_px_camiseta", roupa_sobre: "sob_px_cardiga", roupa_inferior: "rin_jeans", acessorio_pes: "ace_px_tenis", fundo: "fun_px_horizonte" },
        cores: { pele: "#e8b58c", cabelo: "#a06a30", roupa: "#7a2d3c", destaque: "#e8b64c" },
        coresFace: { iris: "#2f5d43" },
        acabamento: "premium"
      }
    },
    {
      id: "pre_cp_neon",
      nome: "Neon",
      descricao: "C05: hoodie técnico, jogger, beco neon e aura de fluxo.",
      raridade: "epico",
      config: {
        base: "bas_px_oval",
        camadas: { cabelo: "cab_px_undercut", olhos: "olh_px_intenso", boca: "boc_px_meio", roupa: "rou_px_hoodie", roupa_inferior: "rin_jogger", acessorio_pes: "ace_px_tenis", acessorio_rosto: "ace_px_oculos", fundo: "fun_px_neon", aura: "aur_px_fluxo" },
        cores: { pele: "#b07a4e", cabelo: "#e84c6f", roupa: "#20242e", destaque: "#4cd9e8" },
        coresFace: { iris: "#3a6ea8" },
        acabamento: "premium"
      }
    },
    {
      id: "pre_cp_gala",
      nome: "Gala",
      descricao: "C06: cetim de noite, coroa e a nebulosa inteira de fundo.",
      raridade: "lendario",
      config: {
        base: "bas_px_diamante",
        camadas: { cabelo: "cab_px_longo_liso", olhos: "olh_px_felino", boca: "boc_px_suave", roupa: "rou_px_gala", roupa_inferior: "rin_social", acessorio_pes: "ace_px_social", acessorio_cabeca: "ace_px_coroa", fundo: "fun_px_nebulosa", aura: "aur_px_estelar", moldura: "mol_px_eclipse" },
        cores: { pele: "#8a5a35", cabelo: "#14100c", roupa: "#2c2050", destaque: "#c9a75a" },
        coresFace: { iris: "#5b3d8a" },
        acabamento: "premium"
      }
    },
    {
      id: "pre_executivo",
      nome: "Executivo de Elite",
      descricao: "Terno, olhar analítico e a certeza de quem fecha o trimestre.",
      raridade: "raro",
      config: {
        base: "bas_angular",
        camadas: { cabelo: "cab_curto", olhos: "olh_serio", boca: "boc_determinada", roupa: "rou_terno", fundo: "fun_estudio", moldura: "mol_duplo" },
        cores: { pele: "#d29e6f", cabelo: "#14100c", roupa: "#20242e", destaque: "#e8b64c" }
      }
    },
    {
      id: "pre_proplayer",
      nome: "Pro Player",
      descricao: "Headset RGB, jersey oficial e a arena inteira gritando seu nick.",
      raridade: "epico",
      config: {
        base: "bas_classica",
        camadas: { cabelo: "cab_cyber", olhos: "olh_focado", boca: "boc_lado", roupa: "rou_gamer", acessorio: "ace_headset", fundo: "fun_arena", moldura: "mol_neon" },
        cores: { pele: "#e8b58c", cabelo: "#4c9de8", roupa: "#20242e", destaque: "#39d98a" }
      }
    },
    {
      id: "pre_androide",
      nome: "Androide Nexus",
      descricao: "Chassi sintético, chuva digital e núcleo de energia pulsante.",
      raridade: "lendario",
      config: {
        base: "bas_androide",
        camadas: { olhos: "olh_led", boca: "boc_grade", roupa: "rou_armadura", fundo: "fun_circuito", moldura: "mol_tech", efeito: "efe_chuva" },
        cores: { pele: "#c8d4e8", cabelo: "#3d2b1f", roupa: "#20242e", destaque: "#4cd9e8" }
      }
    },
    {
      id: "pre_sexta",
      nome: "Casual de Sexta",
      descricao: "Óculos escuros, gargalhada solta e zero reuniões depois das 17h.",
      raridade: "comum",
      config: {
        base: "bas_classica",
        camadas: { cabelo: "cab_franja", olhos: "olh_feliz", boca: "boc_larga", roupa: "rou_camiseta", acessorio: "ace_oculos_sol", fundo: "fun_estrelas" },
        cores: { pele: "#b07a4e", cabelo: "#6b4a2a", roupa: "#1f6e5a", destaque: "#ff7a3d" }
      }
    },
    {
      id: "pre_lenda",
      nome: "Lenda Viva",
      descricao: "Coroa de ouro, faíscas e uma nebulosa de fundo. Top 1 global.",
      raridade: "exclusivo",
      config: {
        base: "bas_classica",
        camadas: { cabelo: "cab_longo", olhos: "olh_brilho", boca: "boc_sorriso", roupa: "rou_terno", acessorio: "ace_coroa", fundo: "fun_nebulosa", moldura: "mol_ouro", efeito: "efe_faiscas" },
        cores: { pele: "#e8b58c", cabelo: "#d9b166", roupa: "#5b3d8a", destaque: "#e8b64c" }
      }
    },
    {
      id: "pre_holograma",
      nome: "Holograma Synth",
      descricao: "Projeção translúcida sobre o grid oitentista. Puro synthwave.",
      raridade: "lendario",
      config: {
        base: "bas_holo",
        camadas: { olhos: "olh_visor", boca: "boc_neutra", roupa: "rou_jaqueta", fundo: "fun_grade", moldura: "mol_neon", efeito: "efe_scanlines" },
        cores: { pele: "#9fe8c8", cabelo: "#3d2b1f", roupa: "#5b3d8a", destaque: "#ff5f8f" }
      }
    },
    // ── 4.6 F2 · Onda 4 — 18 presets novos (meta §28: 24 ✓) ───────────
    {
      id: "pre_arquiteto",
      nome: "Arquiteto de Dados",
      descricao: "Risca impecável, monóculo analítico e a cidade acesa atrás.",
      raridade: "raro",
      config: {
        base: "bas_longa",
        camadas: { cabelo: "cab_lateral", olhos: "olh_serio", boca: "boc_neutra", roupa: "rou_social", acessorio: "ace_oculos", fundo: "fun_escritorio", moldura: "mol_selo" },
        cores: { pele: "#d29e6f", cabelo: "#2a2a33", roupa: "#3e5a7a", destaque: "#4c9de8" },
        titulo: "tit_arquiteto_de_dados"
      }
    },
    {
      id: "pre_streamer",
      nome: "Streamer ao Vivo",
      descricao: "Picos neon, olhos de estrela e o LED wall no talo.",
      raridade: "epico",
      config: {
        base: "bas_redonda",
        camadas: { cabelo: "cab_picos_neon", olhos: "olh_estrela", boca: "boc_larga", roupa: "rou_jersey", acessorio: "ace_headset", fundo: "fun_led_wall", moldura: "mol_rgb", efeito: "efe_confete" },
        cores: { pele: "#e8b58c", cabelo: "#20242e", roupa: "#20242e", destaque: "#ff5f8f" }
      }
    },
    {
      id: "pre_cientista",
      nome: "Cientista de Plantão",
      descricao: "Jaleco, sardas e a cara de quem achou um outlier às 2h.",
      raridade: "incomum",
      config: {
        base: "bas_sardas",
        camadas: { cabelo: "cab_coque", olhos: "olh_arregalado", boca: "boc_uau", roupa: "rou_jaleco", acessorio: "ace_oculos", fundo: "fun_lab", moldura: "mol_aro" },
        cores: { pele: "#e8b58c", cabelo: "#8a4a2a", roupa: "#2d6a8a", destaque: "#4cd9e8" }
      }
    },
    {
      id: "pre_ronin",
      nome: "Ronin da Madrugada",
      descricao: "Meio coque, máscara e pétalas de sakura no vento do dojo.",
      raridade: "lendario",
      config: {
        base: "bas_marcada",
        camadas: { cabelo: "cab_meio_coque", olhos: "olh_misterioso", boca: "boc_mascara", roupa: "rou_kimono", fundo: "fun_dojo", moldura: "mol_cristal", efeito: "efe_sakura", aura: "aur_vento" },
        cores: { pele: "#d29e6f", cabelo: "#14100c", roupa: "#7a2d3c", destaque: "#ff7a3d" }
      }
    },
    {
      id: "pre_navegante",
      nome: "Navegante",
      descricao: "Colete, bandana e o estandarte corsário içado.",
      raridade: "raro",
      config: {
        base: "bas_quadrada",
        camadas: { cabelo: "cab_buzz", olhos: "olh_focado", boca: "boc_palito", roupa: "rou_colete", acessorio: "ace_lenco_bandana", fundo: "fun_montanhas", banner: "ban_corsario" },
        cores: { pele: "#b07a4e", cabelo: "#3d2b1f", roupa: "#5a4a32", destaque: "#e8b64c" }
      }
    },
    {
      id: "pre_dj",
      nome: "DJ do Deploy",
      descricao: "Fone no pescoço... quer dizer, na cabeça — e o synthwave rolando.",
      raridade: "raro",
      config: {
        base: "bas_coracao",
        camadas: { cabelo: "cab_ondas_curtas", olhos: "olh_brincalhao", boca: "boc_assobio", roupa: "rou_hoodie", acessorio: "ace_fone", fundo: "fun_synthwave", moldura: "mol_neon", efeito: "efe_bolhas" },
        cores: { pele: "#e8b58c", cabelo: "#6b4a2a", roupa: "#2a2438", destaque: "#c99aff" }
      }
    },
    {
      id: "pre_bibliotecario",
      nome: "Guardião do Acervo",
      descricao: "Flanela, monóculo e paz entre as estantes.",
      raridade: "incomum",
      config: {
        base: "bas_longa",
        camadas: { cabelo: "cab_franja_longa", olhos: "olh_sonolento", boca: "boc_neutra", roupa: "rou_flanela", acessorio: "ace_monoculo", fundo: "fun_biblioteca", moldura: "mol_madeira" },
        cores: { pele: "#d29e6f", cabelo: "#5a3a22", roupa: "#5a2d2d", destaque: "#e8b64c" }
      }
    },
    {
      id: "pre_magnata",
      nome: "Magnata",
      descricao: "Smoking, corrente e cifrões na pupila. O ROI agradece.",
      raridade: "epico",
      config: {
        base: "bas_angular",
        camadas: { cabelo: "cab_topete", olhos: "olh_cifrao", boca: "boc_lado", roupa: "rou_smoking", acessorio: "ace_corrente", fundo: "fun_escritorio", moldura: "mol_ouro", efeito: "efe_faiscas" },
        cores: { pele: "#d29e6f", cabelo: "#14100c", roupa: "#14213d", destaque: "#e8b64c" },
        titulo: "tit_imperador_do_roi"
      }
    },
    {
      id: "pre_inverno",
      nome: "Sentinela do Inverno",
      descricao: "Sobretudo, cachecol, barba cheia e a nevasca por testemunha.",
      raridade: "epico",
      config: {
        base: "bas_marcada",
        camadas: { cabelo: "cab_longo", olhos: "olh_serio", boca: "boc_barba", roupa: "rou_sobretudo", acessorio: "ace_cachecol", fundo: "fun_montanhas", moldura: "mol_cristal", efeito: "efe_neve" },
        cores: { pele: "#e8b58c", cabelo: "#6b6b70", roupa: "#2b3550", destaque: "#4cd9e8" }
      }
    },
    {
      id: "pre_oni",
      nome: "Oni do Dojo",
      descricao: "Chifres, sorriso travesso e a aura sombria de quem venceu.",
      raridade: "lendario",
      config: {
        base: "bas_angular",
        camadas: { cabelo: "cab_moicano", olhos: "olh_vilao", boca: "boc_travessa", roupa: "rou_kimono", acessorio: "ace_chifres_oni", fundo: "fun_dojo", moldura: "mol_chamas", aura: "aur_sombria" },
        cores: { pele: "#b0642a", cabelo: "#14100c", roupa: "#3a1420", destaque: "#ff5230" }
      }
    },
    {
      id: "pre_piloto_vr",
      nome: "Piloto de Simulação",
      descricao: "Headset VR, jaqueta neon e o hangar Nexus pronto p/ launch.",
      raridade: "lendario",
      config: {
        base: "bas_classica",
        camadas: { cabelo: "cab_buzz", olhos: "olh_focado", boca: "boc_determinada", roupa: "rou_neon_racer", acessorio: "ace_viseira_vr", fundo: "fun_hangar", moldura: "mol_circuito", aura: "aur_neon" },
        cores: { pele: "#e8b58c", cabelo: "#20242e", roupa: "#1c2333", destaque: "#4cd9e8" }
      }
    },
    {
      id: "pre_panda_zen",
      nome: "Panda Zen",
      descricao: "Kimono, brisa suave e zero notificações.",
      raridade: "raro",
      config: {
        base: "bas_panda",
        camadas: { olhos: "olh_feliz", boca: "boc_sorriso", roupa: "rou_kimono", fundo: "fun_dojo", moldura: "mol_aro", aura: "aur_vento" },
        cores: { pele: "#eef1f6", cabelo: "#14100c", roupa: "#2f4a33", destaque: "#4cd97c" }
      }
    },
    {
      id: "pre_raposa_estelar",
      nome: "Raposa Estelar",
      descricao: "Mistério, jaqueta e uma constelação particular em órbita.",
      raridade: "epico",
      config: {
        base: "bas_raposa",
        camadas: { olhos: "olh_misterioso", boca: "boc_lado", roupa: "rou_jaqueta", fundo: "fun_synthwave", moldura: "mol_neon", aura: "aur_estelar" },
        cores: { pele: "#d98a3a", cabelo: "#3d2b1f", roupa: "#2a2438", destaque: "#c99aff" }
      }
    },
    {
      id: "pre_guardiao",
      nome: "Guardião da Trilha",
      descricao: "Colete, escudo no peito e folhas dançando ao redor.",
      raridade: "raro",
      config: {
        base: "bas_quadrada",
        camadas: { cabelo: "cab_curto", olhos: "olh_focado", boca: "boc_determinada", roupa: "rou_colete", fundo: "fun_montanhas", banner: "ban_guardiao", emblema: "emb_escudo", efeito: "efe_folhas" },
        cores: { pele: "#b07a4e", cabelo: "#3d2b1f", roupa: "#3e5a4a", destaque: "#4cd97c" }
      }
    },
    {
      id: "pre_pixelado",
      nome: "Herói de 8 Bits",
      descricao: "Olhos pixel, coração de fliperama e praia renderizada em 16 cores.",
      raridade: "epico",
      config: {
        base: "bas_classica",
        camadas: { cabelo: "cab_moicano", olhos: "olh_pixel", boca: "boc_travessa", roupa: "rou_gamer", fundo: "fun_praia", banner: "ban_pixel", emblema: "emb_coracao_pixel", moldura: "mol_rgb" },
        cores: { pele: "#e8b58c", cabelo: "#ff5f8f", roupa: "#20242e", destaque: "#4cd97c" }
      }
    },
    {
      id: "pre_tempestade",
      nome: "Olho da Tempestade",
      descricao: "Sobretudo na chuva, relâmpagos e calma absoluta.",
      raridade: "epico",
      config: {
        base: "bas_longa",
        camadas: { cabelo: "cab_medio", olhos: "olh_serio", boca: "boc_neutra", roupa: "rou_sobretudo", fundo: "fun_chuva", moldura: "mol_tech", efeito: "efe_tempestade", aura: "aur_eletrica" },
        cores: { pele: "#d29e6f", cabelo: "#2a2a33", roupa: "#28324a", destaque: "#4c9de8" }
      }
    },
    {
      id: "pre_verao",
      nome: "Modo Férias",
      descricao: "Regata, óculos escuros e chiclete — o backlog que espere.",
      raridade: "comum",
      config: {
        base: "bas_redonda",
        camadas: { cabelo: "cab_rabo", olhos: "olh_feliz", boca: "boc_chiclete", roupa: "rou_regata", acessorio: "ace_oculos_sol", fundo: "fun_praia", moldura: "mol_aro", efeito: "efe_bolhas" },
        cores: { pele: "#b07a4e", cabelo: "#6b4a2a", roupa: "#1f6e5a", destaque: "#ff7a3d" }
      }
    },
    {
      id: "pre_forjador",
      nome: "Mestre Forjador",
      descricao: "Barba, brasas e a engrenagem que faz tudo girar.",
      raridade: "raro",
      config: {
        base: "bas_quadrada",
        camadas: { cabelo: "cab_buzz", olhos: "olh_focado", boca: "boc_barba", roupa: "rou_colete", fundo: "fun_forja", banner: "ban_forjado", emblema: "emb_engrenagem", moldura: "mol_madeira", efeito: "efe_fogo" },
        cores: { pele: "#b0642a", cabelo: "#3d2b1f", roupa: "#4a2d18", destaque: "#ff8a3d" }
      }
    }
  ];
  function configDePreset(preset) {
    return validarConfig({ formato: "camadas", versao: VERSAO_CONFIG, ...preset.config });
  }
  var COLECOES = [
    // onda 1418 (#202): a coleção do trilho premium — só aparece com a flag
    // (colecoesAtivas filtra); itens sao os goldens do gate §2560
    {
      id: "col_classic_premium",
      nome: "Coleção Premium",
      descricao: "A primeira leva do padrão-ouro 2D: rosto, cabelo, alfaiataria e palco.",
      raridade: "lendario",
      itens: ["bas_px_angular", "cab_px_lateral", "olh_px_confiante", "boc_px_sorriso", "rou_px_blazer", "rin_social", "ace_px_social", "fun_px_estudio", "aur_px_fluxo", "mol_px_ouro"],
      cores: { roupa: "#20242e", destaque: "#c9a75a" },
      lore: "Quando o estúdio decidiu que “bom o bastante” não bastava, nasceu esta prateleira. Cada peça passou por goldens, orçamento e um par de olhos exigente."
    },
    {
      id: "col_cyber_nexus",
      nome: "Cyber Nexus",
      descricao: "O conjunto sintético completo: chassi, óptica, armadura e a chuva de código.",
      raridade: "lendario",
      itens: ["bas_androide", "olh_led", "boc_grade", "rou_armadura", "fun_circuito", "mol_tech", "efe_chuva"],
      cores: { pele: "#c8d4e8", destaque: "#4cd9e8" },
      lore: "Dizem que o Nexus acordou numa madrugada de deploy, entre um commit e um rollback. Quem veste o conjunto completo escuta o hum da rede — e nunca mais olha um dashboard do mesmo jeito."
    },
    {
      id: "col_executivo",
      nome: "Executivo Elite",
      descricao: "Alfaiataria, olhar analítico e a moldura de quem assina o trimestre.",
      raridade: "epico",
      itens: ["bas_angular", "cab_curto", "olh_serio", "boc_determinada", "rou_terno", "ace_oculos", "fun_estudio", "mol_duplo"],
      cores: { roupa: "#20242e", destaque: "#e8b64c" },
      lore: "O trimestre não se assina sozinho. Cada peça deste conjunto foi vista em pelo menos uma reunião que mudou a meta — e em três que deveriam ter sido um e-mail."
    },
    {
      id: "col_dojo",
      nome: "Caminho do Dojo",
      descricao: "Kimono, coque de samurai e o entardecer que forjou a disciplina.",
      raridade: "epico",
      itens: ["cab_coque", "rou_kimono", "fun_dojo", "boc_determinada", "mol_cristal"],
      cores: { roupa: "#7a2d3c", destaque: "#ff7a3d" },
      lore: "No dojo, a primeira lição é chegar. A segunda é voltar amanhã. O entardecer da moldura marca a hora em que a disciplina vira hábito — e o hábito vira identidade."
    },
    {
      id: "col_galaxia",
      nome: "Galáxia",
      descricao: "Traje orbital, olhos estelares e a nebulosa inteira nas suas costas.",
      raridade: "lendario",
      itens: ["rou_astronauta", "olh_brilho", "fun_nebulosa", "efe_particulas", "mol_neon"],
      cores: { destaque: "#c99aff" }
    },
    {
      id: "col_dshow",
      nome: "Dshow Original",
      descricao: "LED Bot, moletom da casa, o LED Wall e a moldura assinada. 100% Dshow.",
      raridade: "exclusivo",
      itens: ["bas_ledbot", "rou_moletom_dshow", "fun_led_wall", "mol_dshow"],
      cores: { destaque: "#7c5cff" }
    },
    // ── 4.6 F2 · Onda 4 — 7 coleções novas (meta §28: 12 ✓) ───────────
    {
      id: "col_oito_bits",
      nome: "Oito Bits",
      descricao: "Fliperama completo: pixel nos olhos, no coração e na praia.",
      raridade: "epico",
      itens: ["olh_pixel", "ban_pixel", "emb_coracao_pixel", "fun_praia", "ace_oculos_3d", "mol_rgb"],
      cores: { destaque: "#4cd97c" }
    },
    {
      id: "col_tempestade",
      nome: "Olho da Tempestade",
      descricao: "Chuva, relâmpagos e a sombra elegante do sobretudo.",
      raridade: "epico",
      itens: ["rou_sobretudo", "fun_chuva", "efe_tempestade", "aur_sombria", "mol_tech"],
      cores: { destaque: "#4c9de8" }
    },
    {
      id: "col_campeao",
      nome: "Circuito Campeão",
      descricao: "Jersey oficial, louros e o confete da final.",
      raridade: "raro",
      itens: ["rou_jersey", "ban_campeao", "mol_louros", "efe_confete", "olh_estrela"],
      cores: { roupa: "#20242e", destaque: "#4cd97c" }
    },
    {
      id: "col_forja",
      nome: "Coração da Forja",
      descricao: "Brasas, bigorna, barba e as chamas que temperam lendas.",
      raridade: "lendario",
      itens: ["fun_forja", "ban_forjado", "efe_fogo", "boc_barba", "mol_chamas", "emb_engrenagem"],
      cores: { destaque: "#ff8a3d" }
    },
    {
      id: "col_neon_noturno",
      nome: "Neon Noturno",
      descricao: "A madrugada synthwave completa: jaqueta, letreiro e circuito vivo.",
      raridade: "lendario",
      itens: ["rou_neon_racer", "fun_synthwave", "aur_neon", "ban_neon_tokyo", "ace_tiara_led", "mol_circuito"],
      cores: { destaque: "#ff5f8f" }
    },
    {
      id: "col_guardiao_verde",
      nome: "Guardião Verde",
      descricao: "Folhas, vento e a bandana de quem protege a trilha.",
      raridade: "raro",
      itens: ["ban_guardiao", "efe_folhas", "aur_vento", "fun_montanhas", "ace_lenco_bandana"],
      cores: { destaque: "#4cd97c" }
    },
    {
      id: "col_realeza",
      nome: "Sangue Real",
      descricao: "Coroa, smoking, estandarte imperial e o sol como aura.",
      raridade: "lendario",
      itens: ["rou_smoking", "ban_imperial", "emb_coroa", "ace_coroa", "mol_ouro", "aur_solar"],
      cores: { destaque: "#e8b64c" }
    }
  ];

  // scripts/avatar/motor/entry.ts
  var CHAVE_LOCAL2 = "dshow.avst.flags.v1";
  function definirFlags(valores) {
    const g = globalThis;
    if (!g.localStorage) {
      const m = /* @__PURE__ */ new Map();
      g.localStorage = {
        getItem: (k) => m.has(k) ? m.get(k) : null,
        setItem: (k, v) => {
          m.set(k, String(v));
        },
        removeItem: (k) => {
          m.delete(k);
        }
      };
    }
    const limpo = {};
    for (const [k, v] of Object.entries(valores)) if (/^[a-z0-9_.]{1,64}$/.test(k)) limpo[k] = !!v;
    g.localStorage.setItem(CHAVE_LOCAL2, JSON.stringify(limpo));
  }
  function catalogoSerializavel() {
    const { CATEGORIAS: cats, itensDe: itens } = require_catalogo();
    const porCategoria = {};
    for (const c of cats) {
      porCategoria[c.id] = itens(c.id).map((it) => {
        const { render, variantes, renderCorpo, renderAtras, renderFrente, renderSombra, renderPlanos, renderCorpoV2, ...dados } = it;
        void render;
        void variantes;
        void renderCorpo;
        void renderAtras;
        void renderFrente;
        void renderSombra;
        void renderPlanos;
        void renderCorpoV2;
        return dados;
      });
    }
    return { categorias: cats, itens: porCategoria };
  }
  function require_catalogo() {
    return { CATEGORIAS, itensDe };
  }
  return __toCommonJS(entry_exports);
})();
