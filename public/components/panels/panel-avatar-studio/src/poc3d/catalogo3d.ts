// poc3d/catalogo3d.ts — catálogo de assets 3D da PoC (AS4 Fase 1).
// @version 1.0.0  @created 2026-07-30
//
// Fonte única de verdade sobre os GLBs: arquivo, LICENÇA (critério §43:
// "assets possuírem metadados e licença"), nós de partes, slots de material
// por NOME (o editor de materiais recolore por slot), animações e morphs.
// A configuração é 100% por PARÂMETROS (decisão #31): mesmo Config3D → mesma cena.

export const BASE_3D = '/assets/avatars/3d/';

export type ArquetipoId = 'humano' | 'androide' | 'animal';
export type VarianteHumanoId = 'casual' | 'terno' | 'punk' | 'aventureiro';
export type IluminacaoId = 'estudio' | 'dramatica' | 'neon';
// PALCO VIVO (fila #37 item 4): cenários procedurais + hora + clima —
// tudo geometria/partículas geradas em código (zero download extra).
export type CenarioId = 'vazio' | 'grade' | 'estrelas' | 'dojo';
export type HoraId = 'estudio' | 'dia' | 'entardecer' | 'noite';
export type ClimaId = 'limpo' | 'chuva' | 'neve' | 'vagalumes';
export type CameraId = 'corpo' | 'busto' | 'rosto' | 'tresquartos';
export type SlotMaterial = 'pele' | 'cabelo' | 'roupa' | 'detalhe';

/** Parâmetros persistíveis da cena (decisão #31 — nunca arquivos, só JSON). */
/**
 * Os 14 SOCKETS de acessórios do 3D (4.6 §20, decisão #41).
 * Contrato FECHADO nesta fase: o vocabulário e a validação existem de ponta
 * a ponta (front + studio.php); o CONTEÚDO por socket chega nas próximas
 * levas 3D (fila #37 item 2). `mochila` é o precursor do socket 'back'.
 */
export const SOCKETS_3D = [
  'head', 'face', 'eyes', 'ears', 'neck', 'shoulders', 'back', 'waist',
  'wrist_l', 'wrist_r', 'hand_l', 'hand_r', 'companion', 'pet',
] as const;
export type Socket3D = (typeof SOCKETS_3D)[number];

/**
 * LEVA 1 de conteúdo dos sockets (fila #37 item 2 — parcial): itens 100%
 * PROCEDURAIS (geometria pura, zero download), no mesmo padrão do Palco
 * Vivo. A camada de ancoragem (socket → osso, ver Acessorios3D.tsx) é
 * agnóstica de rig — carrega direto para o corpo UBC da PoC Premium (#43).
 * A ARTE por socket continua vindo nas próximas levas; isto valida o
 * contrato de ponta a ponta com ≥3 acessórios simultâneos (decisão #41).
 */
export interface ItemSocket { id: string; socket: Socket3D; nome: string }
export const ITENS_SOCKET: ItemSocket[] = [
  { id: 'soc_coroa', socket: 'head', nome: 'Coroa Dourada' },
  { id: 'soc_halo', socket: 'head', nome: 'Halo de Energia' },
  { id: 'soc_oculos_neon', socket: 'face', nome: 'Óculos Neon' },
  { id: 'soc_colar_estrela', socket: 'neck', nome: 'Colar Estelar' },
  { id: 'soc_jetpack', socket: 'back', nome: 'Jetpack' },
  { id: 'soc_asas_energia', socket: 'back', nome: 'Asas de Energia' },
  { id: 'soc_cetro', socket: 'hand_r', nome: 'Cetro Arcano' },
  { id: 'soc_drone', socket: 'companion', nome: 'Drone Fiel' },
  { id: 'soc_pet_bit', socket: 'pet', nome: 'Bit (robô-pet)' },
];

/** Sockets com conteúdo na leva 1, na ordem da UI. */
export const SOCKETS_LEVA1: Socket3D[] = ['head', 'face', 'neck', 'back', 'hand_r', 'companion', 'pet'];
export const ROTULOS_SOCKET: Partial<Record<Socket3D, string>> = {
  head: 'Cabeça', face: 'Rosto', neck: 'Pescoço', back: 'Costas',
  hand_r: 'Mão direita', companion: 'Companheiro', pet: 'Pet',
};

export interface Config3D {
  arquetipo: ArquetipoId;
  /** humano: outfit (Body+Legs+Feet) e cabeça podem vir de variantes diferentes */
  roupa: VarianteHumanoId;
  cabeca: VarianteHumanoId;
  /** acessório real do asset (nó Backpack do aventureiro) */
  mochila: boolean;
  /** itens por socket (decisão #41) — opcional até a leva de conteúdo 3D */
  sockets?: Partial<Record<Socket3D, string>>;
  cores: Record<SlotMaterial, string>;
  /** editor de materiais (PBR) aplicado ao slot de roupa */
  material: { metal: number; brilho: number };
  /** morph targets faciais (androide) — 0..1 */
  morfos: { bravo: number; surpreso: number; triste: number };
  iluminacao: IluminacaoId;
  cenario: CenarioId;
  /** hora do dia (palco vivo) — 'estudio' = luz neutra dos presets */
  hora: HoraId;
  /** clima do palco (palco vivo) — partículas procedurais */
  clima: ClimaId;
  camera: CameraId;
}

export const CONFIG3D_PADRAO: Config3D = {
  arquetipo: 'humano',
  roupa: 'casual',
  cabeca: 'casual',
  mochila: false,
  cores: { pele: '#e0ac69', cabelo: '#3b2a1e', roupa: '#7c5cff', detalhe: '#e8ecf5' },
  material: { metal: 0.05, brilho: 0.35 },
  morfos: { bravo: 0, surpreso: 0, triste: 0 },
  iluminacao: 'estudio',
  cenario: 'vazio',
  hora: 'estudio',
  clima: 'limpo',
  camera: 'corpo',
};

/**
 * Valida uma Config3D vinda de fora (API/histórico) — retomada do estúdio
 * (fila #37). Fail-closed campo a campo, como o backend: enum desconhecido
 * cai no padrão; sockets só aceitam PARES item×socket que existem no
 * catálogo desta versão do front (mais estrito que o regex do servidor —
 * um id de leva futura simplesmente não equipa aqui).
 */
export function validarConfig3d(bruto: unknown): Config3D {
  const b = (bruto && typeof bruto === 'object' ? bruto : {}) as Record<string, unknown>;
  const enumOu = <T extends string>(v: unknown, lista: readonly T[], padrao: T): T =>
    (typeof v === 'string' && (lista as readonly string[]).includes(v) ? (v as T) : padrao);
  const hexOu = (v: unknown, padrao: string): string =>
    (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : padrao);
  const n01 = (v: unknown, padrao: number): number =>
    (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : padrao);

  const variantes: readonly VarianteHumanoId[] = ['casual', 'terno', 'punk', 'aventureiro'];
  const cores = (b.cores && typeof b.cores === 'object' ? b.cores : {}) as Record<string, unknown>;
  const mat = (b.material && typeof b.material === 'object' ? b.material : {}) as Record<string, unknown>;
  const mor = (b.morfos && typeof b.morfos === 'object' ? b.morfos : {}) as Record<string, unknown>;

  const sockets: Partial<Record<Socket3D, string>> = {};
  const brutoSockets = (b.sockets && typeof b.sockets === 'object' ? b.sockets : {}) as Record<string, unknown>;
  for (const [socket, id] of Object.entries(brutoSockets)) {
    if (typeof id !== 'string') continue;
    const item = ITENS_SOCKET.find((i) => i.id === id);
    if (item && item.socket === socket) sockets[item.socket] = id;
  }

  const p = CONFIG3D_PADRAO;
  return {
    arquetipo: enumOu(b.arquetipo, ['humano', 'androide', 'animal'], p.arquetipo),
    roupa: enumOu(b.roupa, variantes, p.roupa),
    cabeca: enumOu(b.cabeca, variantes, p.cabeca),
    mochila: b.mochila === true,
    sockets,
    cores: {
      pele: hexOu(cores.pele, p.cores.pele),
      cabelo: hexOu(cores.cabelo, p.cores.cabelo),
      roupa: hexOu(cores.roupa, p.cores.roupa),
      detalhe: hexOu(cores.detalhe, p.cores.detalhe),
    },
    material: { metal: n01(mat.metal, p.material.metal), brilho: n01(mat.brilho, p.material.brilho) },
    morfos: {
      bravo: n01(mor.bravo, 0), surpreso: n01(mor.surpreso, 0), triste: n01(mor.triste, 0),
    },
    iluminacao: enumOu(b.iluminacao, ['estudio', 'dramatica', 'neon'], p.iluminacao),
    cenario: enumOu(b.cenario, ['vazio', 'grade', 'estrelas', 'dojo'], p.cenario),
    hora: enumOu(b.hora, ['estudio', 'dia', 'entardecer', 'noite'], p.hora),
    clima: enumOu(b.clima, ['limpo', 'chuva', 'neve', 'vagalumes'], p.clima),
    camera: enumOu(b.camera, ['corpo', 'busto', 'rosto', 'tresquartos'], p.camera),
  };
}

export interface Licenca {
  base: string;
  autor: string;
  licenca: 'CC0 1.0';
  fonte: string;
}

export interface Modelo3D {
  id: string;
  arquivo: string;
  licenca: Licenca;
  /** prefixo dos nós de parte ({prefixo}_Head, _Body, _Legs, _Feet) */
  prefixo?: string;
  /** nós que NUNCA aparecem (ex.: Pistol — não usamos armas) */
  ocultarSempre: string[];
  /** materiais por slot (recoloríveis por nome) */
  slots: Record<SlotMaterial, string[]>;
  /** animações: papel → nome do clip no GLB */
  anims: { idle: string; acenar: string; poder: string; extra: string };
  /** altura alvo em metros (normalização de escala em runtime) */
  alturaAlvo: number;
}

const LIC_MODULAR: Licenca = {
  base: 'Ultimate Modular Men Pack (fev/2022)',
  autor: 'Quaternius',
  licenca: 'CC0 1.0',
  fonte: 'https://quaternius.com/packs/ultimatemodularcharacters.html',
};

export const VARIANTES_HUMANO: Record<VarianteHumanoId, Modelo3D> = {
  casual: {
    id: 'casual',
    arquivo: `${BASE_3D}humano_casual.glb`,
    licenca: LIC_MODULAR,
    prefixo: 'Casual',
    ocultarSempre: [],
    slots: {
      pele: ['Skin'],
      cabelo: ['Hair', 'Eyebrows'],
      roupa: ['Purple'],
      detalhe: ['White', 'LightBlue'],
    },
    anims: { idle: 'Idle_Neutral', acenar: 'Wave', poder: 'Punch_Right', extra: 'Roll' },
    alturaAlvo: 1.8,
  },
  terno: {
    id: 'terno',
    arquivo: `${BASE_3D}humano_terno.glb`,
    licenca: LIC_MODULAR,
    prefixo: 'Suit',
    ocultarSempre: ['Pistol'],
    slots: {
      pele: ['Skin'],
      cabelo: ['Hair', 'Eyebrows'],
      roupa: ['Suit'],
      detalhe: ['Tie', 'White'],
    },
    anims: { idle: 'Idle_Neutral', acenar: 'Wave', poder: 'Punch_Right', extra: 'Roll' },
    alturaAlvo: 1.8,
  },
  punk: {
    id: 'punk',
    arquivo: `${BASE_3D}humano_punk.glb`,
    licenca: LIC_MODULAR,
    prefixo: 'Punk',
    ocultarSempre: [],
    slots: {
      pele: ['Skin'],
      cabelo: ['Red', 'Eyebrows'],
      roupa: ['Red_Dark', 'Black'],
      detalhe: ['White', 'LightBlue', 'Earrings'],
    },
    anims: { idle: 'Idle_Neutral', acenar: 'Wave', poder: 'Punch_Right', extra: 'Roll' },
    alturaAlvo: 1.8,
  },
  aventureiro: {
    id: 'aventureiro',
    arquivo: `${BASE_3D}humano_aventureiro.glb`,
    licenca: LIC_MODULAR,
    prefixo: 'Adventurer',
    ocultarSempre: [],
    slots: {
      pele: ['Skin'],
      cabelo: ['Hair', 'Eyebrows'],
      roupa: ['Green', 'LightGreen'],
      detalhe: ['Grey', 'Gold', 'Brown2'],
    },
    anims: { idle: 'Idle_Neutral', acenar: 'Wave', poder: 'Punch_Right', extra: 'Roll' },
    alturaAlvo: 1.8,
  },
};

export const ANDROIDE: Modelo3D = {
  id: 'androide',
  arquivo: `${BASE_3D}androide.glb`,
  licenca: {
    base: 'RobotExpressive (exemplos oficiais do Three.js)',
    autor: 'Tomás Laulhé / Don McCurdy',
    licenca: 'CC0 1.0',
    fonte: 'https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive',
  },
  ocultarSempre: [],
  slots: { pele: [], cabelo: [], roupa: ['Main'], detalhe: ['Grey'] },
  anims: { idle: 'Idle', acenar: 'Wave', poder: 'Punch', extra: 'Dance' },
  alturaAlvo: 1.9,
};

export const ANIMAL: Modelo3D = {
  id: 'animal',
  arquivo: `${BASE_3D}animal_pug.glb`,
  licenca: {
    base: 'Pug — Ultimate Animated Character Pack',
    autor: 'Quaternius',
    licenca: 'CC0 1.0',
    fonte: 'https://quaternius.com/packs/ultimatedanimatedcharacter.html',
  },
  ocultarSempre: [],
  slots: {
    pele: ['Skin'],
    cabelo: [],
    roupa: ['Shirt', 'Belt'],
    detalhe: ['Details', 'Black'],
  },
  anims: { idle: 'Idle', acenar: 'Victory', poder: 'Punch', extra: 'Jump' },
  alturaAlvo: 1.45,
};

/** Presets de câmera POR ARQUÉTIPO (proporções muito diferentes entre si). */
export const CAMERAS: Record<ArquetipoId, Record<CameraId, { pos: [number, number, number]; alvo: [number, number, number] }>> = {
  humano: {
    corpo: { pos: [0, 1.35, 3.6], alvo: [0, 0.95, 0] },
    busto: { pos: [0, 1.5, 1.7], alvo: [0, 1.32, 0] },
    rosto: { pos: [0.12, 1.62, 1.0], alvo: [0, 1.5, 0] },
    tresquartos: { pos: [2.4, 1.7, 2.6], alvo: [0, 1.0, 0] },
  },
  androide: {
    corpo: { pos: [0, 1.5, 4.8], alvo: [0, 1.0, 0] },
    busto: { pos: [0, 1.65, 2.8], alvo: [0, 1.35, 0] },
    rosto: { pos: [0.15, 1.8, 1.9], alvo: [0, 1.58, 0] },
    tresquartos: { pos: [3.1, 1.9, 3.3], alvo: [0, 1.05, 0] },
  },
  animal: {
    corpo: { pos: [0, 1.0, 3.0], alvo: [0, 0.7, 0] },
    busto: { pos: [0, 1.12, 1.55], alvo: [0, 1.0, 0] },
    rosto: { pos: [0.1, 1.28, 1.0], alvo: [0, 1.14, 0] },
    tresquartos: { pos: [1.95, 1.35, 2.15], alvo: [0, 0.78, 0] },
  },
};

/** Morphs faciais do androide: slot da UI → nome do target no GLB. */
export const MORFOS_ANDROIDE: Record<keyof Config3D['morfos'], string> = {
  bravo: 'Angry',
  surpreso: 'Surprised',
  triste: 'Sad',
};

export const ROTULOS_VARIANTE: Record<VarianteHumanoId, string> = {
  casual: 'Casual', terno: 'Executivo', punk: 'Punk', aventureiro: 'Aventureiro',
};

/** Sugestões de cor por slot (mesma linguagem do estúdio 2D). */
export const CORES_3D: Record<SlotMaterial, string[]> = {
  pele: ['#f4c799', '#e0ac69', '#c68642', '#8d5524', '#5c3a21', '#a7b8c4'],
  cabelo: ['#14100c', '#3b2a1e', '#6b4423', '#b0713b', '#c4c9d6', '#7c5cff'],
  roupa: ['#7c5cff', '#2563eb', '#0f766e', '#b91c1c', '#1c2433', '#ff5230'],
  detalhe: ['#e8ecf5', '#ffd98a', '#39d98a', '#22d3ee', '#f472b6', '#0a0d15'],
};
