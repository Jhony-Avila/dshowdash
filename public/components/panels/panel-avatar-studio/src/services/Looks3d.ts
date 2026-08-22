// services/Looks3d.ts — LIGHTING REGISTRY / LOOKS do palco 3D (onda 1408,
// MEGA_BRIEFING_01 §48–§51, §1756–§1767, §2001–§2006; decisão #161).
// @version 1.0.0  @created 2026-08-19
//
// FONTE ÚNICA dos parâmetros de luz do palco 3D (antes: três vocabulários —
// Renderizador3d.montar()/definirLuz(), poc3d/Cena3D.LUZES e o 2D
// LUZES_PALCO — ver RENDERER-ARCHITECTURE.md §3). Regras:
//   · `estudio` v1 = EXATAMENTE os valores canônicos de montar() —
//     aplicar o look estudio deixa as luzes byte-idênticas (teste de
//     contrato); é o benchmark neutro de QA (§49, §2027);
//   · `soft`/`cool`/`neon` = os presets antigos de definirLuz (quente/
//     fria/neon) com ALIAS — valores idênticos, nome novo (§1960);
//   · `portrait` (§50, §1759, §1825) e `dramatic` (PoC Cena3D) são NOVOS:
//     só aparecem com a flag as6.looks; `hero/product/soft2` entram na
//     onda 1420 com a cadeia de pós;
//   · look é APRESENTAÇÃO (palco/foto) — nunca persiste no AvatarConfig
//     (§1999); Cenas3d guarda o id (enum só cresce); captura registra
//     `look@versao` nos metadados (§2001–§2003);
//   · nada aqui toca o renderer: Renderizador3d.aplicarLook() consome.
export type LookId = 'estudio' | 'soft' | 'cool' | 'neon' | 'portrait' | 'dramatic' | 'hero' | 'product';

export interface LuzLook { cor: number; intensidade: number; pos: [number, number, number] }

/** onda 1420 (#206, as6.pos_v2): CADEIA DE PÓS por look como DADO —
 *  Render→Bloom→ColorGrade→Vignette (§1965–§1972). null em cada passo =
 *  passo ausente. O renderer consome SÓ com a flag; a degradação por
 *  tier vem do QualityManager (passesPos). `estudio` é NEUTRO por
 *  contrato (todos null — teste trava): ligar a flag não muda 1 pixel
 *  do benchmark de QA. */
export interface PosLook {
  /** UnrealBloom {força, raio, limiar}; null = sem bloom */
  bloom: { forca: number; raio: number; limiar: number } | null;
  /** grading paramétrico; protegerPele preserva a banda de tons de pele
   *  (§1969 — grading nunca "cozinha" o rosto) */
  grade: { saturacao: number; temperatura: number; contraste: number; protegerPele: boolean } | null;
  /** vinheta paramétrica {força 0–1, suavidade 0–1}; null = sem */
  vinheta: { forca: number; suavidade: number } | null;
}
export interface Look {
  id: LookId;
  versao: number;
  nome: string;
  /** key light (direcional com sombra) */
  key: LuzLook;
  /** fill (direcional, sem sombra) */
  fill: LuzLook;
  /** AmbientLight */
  ambiente: number;
  /** environmentIntensity do RoomEnvironment (§1807) */
  env: number;
  /** rim do LOOK (independente do "aro" do usuário §452); null = sem */
  rim: LuzLook | null;
  /** exposição BASE do tone mapping (o slider do usuário multiplica; clamp 0.6–1.6) */
  exposicao: number;
  /** câmera sugerida ao escolher o look (só sugestão; nunca reseta a órbita) */
  cameraSugerida: 'corpo' | 'retrato';
  /** novo na frente AAA (só com as6.looks) ou legado (sempre disponível) */
  legado: boolean;
  /** onda 1419 (#205, as6.sombras_v2): sombra da KEY por look — bias
   *  contra acne/peter-panning e raio (softness PCFSoft). Consumido SÓ
   *  com a flag; sem ela o renderer usa os defaults do three. */
  sombra: { bias: number; raio: number };
  /** onda 1419 (#205): FOG por look (null = sem névoa) — só com a flag. */
  fog: { cor: number; near: number; far: number } | null;
  /** onda 1420 (#206, as6.pos_v2): cadeia de pós do look. */
  pos: PosLook;
}

/** Pós NEUTRO (nenhum passo) — `estudio`/legados usam por contrato. */
export const POS_NEUTRO: PosLook = { bloom: null, grade: null, vinheta: null };

/** Valores CANÔNICOS de Renderizador3d.montar() — não mudar sem decisão
 *  numerada: são o Studio v1 byte-idêntico (baseline golden-visual). */
export const CANONICO = {
  key: { cor: 0xffffff, intensidade: 2.6, pos: [2.2, 3.0, 2.6] as [number, number, number] },
  fill: { cor: 0x9db4ff, intensidade: 1.1, pos: [-2.4, 1.2, -1.6] as [number, number, number] },
  ambiente: 0.55,
  env: 0.55,
  exposicao: 1.0,
} as const;

export const LOOKS: Record<LookId, Look> = {
  estudio: {
    id: 'estudio', versao: 1, nome: 'Estúdio',
    key: { ...CANONICO.key }, fill: { ...CANONICO.fill }, ambiente: CANONICO.ambiente, env: CANONICO.env,
    rim: null, exposicao: CANONICO.exposicao, cameraSugerida: 'corpo', legado: true,
    sombra: { bias: -0.00015, raio: 4 }, fog: null, pos: POS_NEUTRO,
  },
  // alias de definirLuz('quente') — mesmos números (posições = canônicas)
  soft: {
    id: 'soft', versao: 1, nome: 'Quente',
    key: { cor: 0xffd9a0, intensidade: 2.9, pos: [...CANONICO.key.pos] }, fill: { cor: 0xff9d5c, intensidade: 0.9, pos: [...CANONICO.fill.pos] },
    ambiente: 0.5, env: CANONICO.env, rim: null, exposicao: 1.0, cameraSugerida: 'corpo', legado: true,
    sombra: { bias: -0.00015, raio: 5 }, fog: null, pos: POS_NEUTRO,
  },
  cool: {
    id: 'cool', versao: 1, nome: 'Fria',
    key: { cor: 0xcfe4ff, intensidade: 2.7, pos: [...CANONICO.key.pos] }, fill: { cor: 0x6c8cff, intensidade: 1.2, pos: [...CANONICO.fill.pos] },
    ambiente: 0.45, env: CANONICO.env, rim: null, exposicao: 1.0, cameraSugerida: 'corpo', legado: true,
    sombra: { bias: -0.00015, raio: 4 }, fog: null, pos: POS_NEUTRO,
  },
  neon: {
    id: 'neon', versao: 1, nome: 'Neon',
    key: { cor: 0xff5f8f, intensidade: 2.4, pos: [...CANONICO.key.pos] }, fill: { cor: 0x4cd9e8, intensidade: 1.6, pos: [...CANONICO.fill.pos] },
    ambiente: 0.35, env: CANONICO.env, rim: null, exposicao: 1.0, cameraSugerida: 'corpo', legado: true,
    sombra: { bias: -0.0002, raio: 3 }, fog: { cor: 0x0a0d18, near: 6, far: 14 },
    // §1965: neon é o look "de vitrine" do bloom — emissivos ganham glow
    pos: { bloom: { forca: 0.55, raio: 0.6, limiar: 0.72 }, grade: { saturacao: 1.14, temperatura: -0.04, contraste: 1.05, protegerPele: true }, vinheta: { forca: 0.32, suavidade: 0.55 } },
  },
  // §50/§1759/§1825: retrato — fill mais alto (rosto sem sombras duras),
  // key mais frontal e suave, rim branco discreto no contorno do cabelo,
  // exposição +5 % (pele não estoura: key 2.3 < 2.6)
  portrait: {
    id: 'portrait', versao: 1, nome: 'Retrato',
    key: { cor: 0xfff1e6, intensidade: 2.3, pos: [1.6, 2.6, 2.8] }, fill: { cor: 0xbfcfff, intensidade: 1.5, pos: [-2.0, 1.4, 1.2] },
    ambiente: 0.6, env: 0.6, rim: { cor: 0xffffff, intensidade: 1.6, pos: [-1.2, 2.2, -2.4] },
    exposicao: 1.05, cameraSugerida: 'retrato', legado: false,
    sombra: { bias: -0.0001, raio: 6 }, fog: null,
    // retrato: zero bloom (pele nunca "brilha"), grade suave protegendo
    // a pele, vinheta leve puxando o olho ao rosto (§1969)
    pos: { bloom: null, grade: { saturacao: 1.04, temperatura: 0.03, contraste: 1.02, protegerPele: true }, vinheta: { forca: 0.22, suavidade: 0.65 } },
  },
  // PoC Cena3D.LUZES.dramatica adaptado ao rig do shell (sem hemisphere):
  // key forte e lateral, fill baixo e azulado, rim forte
  dramatic: {
    id: 'dramatic', versao: 1, nome: 'Dramática',
    key: { cor: 0xffe6c4, intensidade: 3.4, pos: [3.4, 3.4, 1.2] }, fill: { cor: 0x31406e, intensidade: 0.35, pos: [-2.8, 1.4, 2.2] },
    ambiente: 0.22, env: 0.35, rim: { cor: 0xffffff, intensidade: 3.2, pos: [-2.2, 3.2, -2.4] },
    exposicao: 1.0, cameraSugerida: 'corpo', legado: false,
    sombra: { bias: -0.00025, raio: 2 }, fog: { cor: 0x05060c, near: 5, far: 12 },
    pos: { bloom: { forca: 0.28, raio: 0.4, limiar: 0.85 }, grade: { saturacao: 0.94, temperatura: -0.02, contraste: 1.12, protegerPele: true }, vinheta: { forca: 0.42, suavidade: 0.5 } },
  },
  // ── onda 1420 (#206, §1962–§1965): looks NOVOS — só com as6.looks ──
  // hero: apresentação de banner — key alta e quente, rim forte, bloom
  // presente mas contido (limiar alto: só speculars/emissivos estouram)
  hero: {
    id: 'hero', versao: 1, nome: 'Hero',
    key: { cor: 0xffedd6, intensidade: 3.1, pos: [2.6, 3.6, 2.2] }, fill: { cor: 0x8fa8ff, intensidade: 0.9, pos: [-2.6, 1.6, 0.8] },
    ambiente: 0.4, env: 0.5, rim: { cor: 0xdfe9ff, intensidade: 2.6, pos: [-1.8, 2.8, -2.6] },
    exposicao: 1.05, cameraSugerida: 'corpo', legado: false,
    sombra: { bias: -0.0002, raio: 3 }, fog: null,
    pos: { bloom: { forca: 0.35, raio: 0.5, limiar: 0.8 }, grade: { saturacao: 1.1, temperatura: 0.05, contraste: 1.08, protegerPele: true }, vinheta: { forca: 0.3, suavidade: 0.6 } },
  },
  // product: neutro de catálogo — luz limpa e uniforme, ZERO bloom e
  // ZERO vinheta (a foto de produto não esconde nada nas bordas); só um
  // grade discreto de contraste/saturação para o item "saltar"
  product: {
    id: 'product', versao: 1, nome: 'Produto',
    key: { cor: 0xffffff, intensidade: 2.7, pos: [2.0, 3.2, 2.8] }, fill: { cor: 0xdfe6f5, intensidade: 1.5, pos: [-2.4, 1.8, 1.6] },
    ambiente: 0.65, env: 0.7, rim: { cor: 0xffffff, intensidade: 1.2, pos: [0, 2.6, -2.8] },
    exposicao: 1.0, cameraSugerida: 'corpo', legado: false,
    sombra: { bias: -0.00015, raio: 5 }, fog: null,
    pos: { bloom: null, grade: { saturacao: 1.06, temperatura: 0, contraste: 1.05, protegerPele: true }, vinheta: null },
  },
};

export const LOOK_PADRAO: LookId = 'estudio';

/** Aliases do vocabulário LEGADO do shell (definirLuz / Cenas3d.LUZES_3D). */
export const ALIAS_LUZ_LEGADA: Record<'estudio' | 'quente' | 'fria' | 'neon', LookId> = {
  estudio: 'estudio', quente: 'soft', fria: 'cool', neon: 'neon',
};
/** Aliases do vocabulário 2D (workspace/palco.ts LUZES_PALCO) — mesma
 *  nomenclatura §1960 para o look equivalente (o CSS 2D não muda aqui). */
export const ALIAS_LUZ_PALCO_2D: Record<'neutra' | 'quente' | 'fria' | 'dramatica', LookId> = {
  neutra: 'estudio', quente: 'soft', fria: 'cool', dramatica: 'dramatic',
};
/** Aliases da PoC R3F (poc3d/catalogo3d IluminacaoId). */
export const ALIAS_LUZ_POC: Record<'estudio' | 'dramatica' | 'neon', LookId> = {
  estudio: 'estudio', dramatica: 'dramatic', neon: 'neon',
};

export function lookDe(id: string | null | undefined): Look {
  return (id && (LOOKS as Record<string, Look>)[id]) || LOOKS[LOOK_PADRAO];
}
export function lookDaLuzLegada(luz: string): Look {
  return lookDe((ALIAS_LUZ_LEGADA as Record<string, LookId>)[luz] ?? luz);
}
/** Ids disponíveis na UI: legados sempre; novos só com a flag (caller decide). */
export function looksDisponiveis(comNovos: boolean): Look[] {
  return Object.values(LOOKS).filter((l) => l.legado || comNovos);
}
/** Etiqueta `look@versao` para metadados de captura (§2001–§2003). */
export function etiquetaLook(id: LookId): string {
  return `${id}@${LOOKS[id].versao}`;
}
