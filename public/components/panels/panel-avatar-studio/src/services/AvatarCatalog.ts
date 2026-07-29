// services/AvatarCatalog.ts — catálogo oficial do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// Fonte única de verdade sobre itens, categorias, raridades, cores sugeridas,
// presets e validação de config. O motor (engine/render) recebe o resolvedor
// daqui — nenhum outro módulo importa as partes diretamente.
import type {
  AvatarConfig, CategoriaId, CategoriaMeta, Preset, Raridade, SlotCor,
} from '../domain/types';
import { CORES_PADRAO, normalizarHex } from '../engine/cores';
import type { ParteDef } from '../engine/base-api';
import { renderAvatar, renderDataUri, hashConfig } from '../engine/render';
import type { OpcoesRender } from '../engine/render';
import { BASES } from '../engine/partes/bases';
import { CABELOS } from '../engine/partes/cabelos';
import { OLHOS } from '../engine/partes/olhos';
import { BOCAS } from '../engine/partes/bocas';
import { ROUPAS } from '../engine/partes/roupas';
import { ACESSORIOS } from '../engine/partes/acessorios';
import { FUNDOS } from '../engine/partes/fundos';
import { MOLDURAS } from '../engine/partes/molduras';
import { EFEITOS } from '../engine/partes/efeitos';

export const VERSAO_CONFIG = 1;

// ── Categorias (ordem = ordem da sidebar do studio) ─────────────────

export const CATEGORIAS: CategoriaMeta[] = [
  { id: 'base',      nome: 'Rosto',      obrigatoria: true },
  { id: 'cabelo',    nome: 'Cabelo',     obrigatoria: false },
  { id: 'olhos',     nome: 'Olhos',      obrigatoria: true },
  { id: 'boca',      nome: 'Boca',       obrigatoria: true },
  { id: 'roupa',     nome: 'Roupa',      obrigatoria: true },
  { id: 'acessorio', nome: 'Acessório',  obrigatoria: false },
  { id: 'fundo',     nome: 'Fundo',      obrigatoria: true },
  { id: 'moldura',   nome: 'Moldura',    obrigatoria: false },
  { id: 'efeito',    nome: 'Efeito',     obrigatoria: false },
];

// ── Raridades (metadados de UI: selo, cor, peso no sorteio) ─────────

export const RARIDADES: Record<Raridade, { nome: string; cor: string; peso: number }> = {
  comum:     { nome: 'Comum',     cor: '#9aa4b8', peso: 40 },
  incomum:   { nome: 'Incomum',   cor: '#4cd97c', peso: 28 },
  raro:      { nome: 'Raro',      cor: '#4c9de8', peso: 16 },
  epico:     { nome: 'Épico',     cor: '#b06ce8', peso: 9 },
  lendario:  { nome: 'Lendário',  cor: '#e8b64c', peso: 5 },
  exclusivo: { nome: 'Exclusivo', cor: '#ff5f8f', peso: 2 },
};

// ── Índices ─────────────────────────────────────────────────────────

export const PARTES: ParteDef[] = [
  ...BASES, ...CABELOS, ...OLHOS, ...BOCAS, ...ROUPAS,
  ...ACESSORIOS, ...FUNDOS, ...MOLDURAS, ...EFEITOS,
];

const POR_ID = new Map<string, ParteDef>(PARTES.map((x) => [x.id, x]));

export function itemPorId(id: string): ParteDef | undefined {
  return POR_ID.get(id);
}

export function itensDe(categoria: CategoriaId): ParteDef[] {
  return PARTES.filter((x) => x.categoria === categoria);
}

// ── Cores sugeridas por slot (paleta curada; picker livre continua valendo) ──

export const CORES_SUGERIDAS: Record<SlotCor, string[]> = {
  pele: ['#f5d0a9', '#e8b58c', '#d29e6f', '#b07a4e', '#8a5a35', '#5f3d23', '#c8d4e8', '#9fe8c8'],
  cabelo: ['#14100c', '#3d2b1f', '#6b4a2a', '#a06a30', '#d9b166', '#b8bcc8', '#e84c6f', '#4c9de8', '#7c5cff', '#39d98a'],
  roupa: ['#20242e', '#2d4a8a', '#1f6e5a', '#7a2d3c', '#5b3d8a', '#8a6a1f', '#c4c9d6', '#e85c3a'],
  destaque: ['#7c5cff', '#39d98a', '#4c9de8', '#ff5f8f', '#e8b64c', '#4cd9e8', '#ff7a3d', '#c9d94c'],
};

// ── Config padrão + validação (defesa contra dados de fora) ─────────

export const CONFIG_PADRAO: AvatarConfig = {
  formato: 'camadas',
  versao: VERSAO_CONFIG,
  base: 'bas_classica',
  camadas: {
    cabelo: 'cab_curto',
    olhos: 'olh_padrao',
    boca: 'boc_sorriso',
    roupa: 'rou_camiseta',
    fundo: 'fun_estudio',
  },
  cores: { ...CORES_PADRAO },
};

const CATS_OPCIONAIS = CATEGORIAS.filter((c) => c.id !== 'base').map((c) => c.id) as
  Array<Exclude<CategoriaId, 'base'>>;

/**
 * Coage QUALQUER entrada (localStorage, API, import) num AvatarConfig válido.
 * Regras do briefing §35: id precisa existir e bater a categoria; respeita
 * requerBase e incompativelCom; cores sempre hex normalizado.
 */
export function validarConfig(bruto: unknown): AvatarConfig {
  const b = (bruto ?? {}) as Partial<AvatarConfig>;
  const base = typeof b.base === 'string' && POR_ID.get(b.base)?.categoria === 'base'
    ? b.base
    : CONFIG_PADRAO.base;

  const camadas: AvatarConfig['camadas'] = {};
  const equipados: string[] = [];
  for (const cat of CATS_OPCIONAIS) {
    const id = b.camadas?.[cat];
    if (typeof id !== 'string' || id === 'nenhum') continue;
    const item = POR_ID.get(id);
    if (!item || item.categoria !== cat) continue;
    if (item.requerBase?.length && !item.requerBase.includes(base)) continue;
    if (item.incompativelCom?.some((x) => equipados.includes(x))) continue;
    camadas[cat] = id;
    equipados.push(id);
  }

  const c = (b.cores ?? {}) as Partial<Record<SlotCor, string>>;
  return {
    formato: 'camadas',
    versao: VERSAO_CONFIG,
    base,
    camadas,
    cores: {
      pele: normalizarHex(c.pele, CORES_PADRAO.pele),
      cabelo: normalizarHex(c.cabelo, CORES_PADRAO.cabelo),
      roupa: normalizarHex(c.roupa, CORES_PADRAO.roupa),
      destaque: normalizarHex(c.destaque, CORES_PADRAO.destaque),
    },
  };
}

// ── Renderização (fachada — a UI só fala com o catálogo) ────────────

export function svgDe(config: AvatarConfig, opcoes?: OpcoesRender): string {
  return renderAvatar(config, itemPorId, opcoes);
}

export function dataUriDe(config: AvatarConfig, opcoes?: OpcoesRender): string {
  return renderDataUri(config, itemPorId, opcoes);
}

export { hashConfig };

// ── Randomizador determinístico (mulberry32) — briefing §13 ─────────

function mulberry32(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sortear<T>(rnd: () => number, lista: T[]): T {
  return lista[Math.floor(rnd() * lista.length)];
}

/** Sorteia respeitando o peso das raridades (lendário É raro de sair). */
function sortearPorRaridade(rnd: () => number, lista: ParteDef[]): ParteDef {
  const pesos = lista.map((x) => RARIDADES[x.raridade].peso);
  const total = pesos.reduce((a, b) => a + b, 0);
  let alvo = rnd() * total;
  for (let i = 0; i < lista.length; i++) {
    alvo -= pesos[i];
    if (alvo <= 0) return lista[i];
  }
  return lista[lista.length - 1];
}

export function aleatorio(semente: number): AvatarConfig {
  const rnd = mulberry32(semente);
  const camadas: AvatarConfig['camadas'] = {
    olhos: sortearPorRaridade(rnd, itensDe('olhos')).id,
    boca: sortearPorRaridade(rnd, itensDe('boca')).id,
    roupa: sortearPorRaridade(rnd, itensDe('roupa')).id,
    fundo: sortearPorRaridade(rnd, itensDe('fundo')).id,
  };
  if (rnd() < 0.85) camadas.cabelo = sortearPorRaridade(rnd, itensDe('cabelo')).id;
  if (rnd() < 0.55) camadas.acessorio = sortearPorRaridade(rnd, itensDe('acessorio')).id;
  if (rnd() < 0.6) camadas.moldura = sortearPorRaridade(rnd, itensDe('moldura')).id;
  if (rnd() < 0.35) camadas.efeito = sortearPorRaridade(rnd, itensDe('efeito')).id;

  return validarConfig({
    formato: 'camadas',
    versao: VERSAO_CONFIG,
    base: sortearPorRaridade(rnd, itensDe('base')).id,
    camadas,
    cores: {
      pele: sortear(rnd, CORES_SUGERIDAS.pele),
      cabelo: sortear(rnd, CORES_SUGERIDAS.cabelo),
      roupa: sortear(rnd, CORES_SUGERIDAS.roupa),
      destaque: sortear(rnd, CORES_SUGERIDAS.destaque),
    },
  });
}

// ── Presets curados (briefing §12) ──────────────────────────────────

export const PRESETS: Preset[] = [
  {
    id: 'pre_executivo',
    nome: 'Executivo de Elite',
    descricao: 'Terno, olhar analítico e a certeza de quem fecha o trimestre.',
    raridade: 'raro',
    config: {
      base: 'bas_angular',
      camadas: { cabelo: 'cab_curto', olhos: 'olh_serio', boca: 'boc_determinada', roupa: 'rou_terno', fundo: 'fun_estudio', moldura: 'mol_duplo' },
      cores: { pele: '#d29e6f', cabelo: '#14100c', roupa: '#20242e', destaque: '#e8b64c' },
    },
  },
  {
    id: 'pre_proplayer',
    nome: 'Pro Player',
    descricao: 'Headset RGB, jersey oficial e a arena inteira gritando seu nick.',
    raridade: 'epico',
    config: {
      base: 'bas_classica',
      camadas: { cabelo: 'cab_cyber', olhos: 'olh_focado', boca: 'boc_lado', roupa: 'rou_gamer', acessorio: 'ace_headset', fundo: 'fun_arena', moldura: 'mol_neon' },
      cores: { pele: '#e8b58c', cabelo: '#4c9de8', roupa: '#20242e', destaque: '#39d98a' },
    },
  },
  {
    id: 'pre_androide',
    nome: 'Androide Nexus',
    descricao: 'Chassi sintético, chuva digital e núcleo de energia pulsante.',
    raridade: 'lendario',
    config: {
      base: 'bas_androide',
      camadas: { olhos: 'olh_led', boca: 'boc_grade', roupa: 'rou_armadura', fundo: 'fun_circuito', moldura: 'mol_tech', efeito: 'efe_chuva' },
      cores: { pele: '#c8d4e8', cabelo: '#3d2b1f', roupa: '#20242e', destaque: '#4cd9e8' },
    },
  },
  {
    id: 'pre_sexta',
    nome: 'Casual de Sexta',
    descricao: 'Óculos escuros, gargalhada solta e zero reuniões depois das 17h.',
    raridade: 'comum',
    config: {
      base: 'bas_classica',
      camadas: { cabelo: 'cab_franja', olhos: 'olh_feliz', boca: 'boc_larga', roupa: 'rou_camiseta', acessorio: 'ace_oculos_sol', fundo: 'fun_estrelas' },
      cores: { pele: '#b07a4e', cabelo: '#6b4a2a', roupa: '#1f6e5a', destaque: '#ff7a3d' },
    },
  },
  {
    id: 'pre_lenda',
    nome: 'Lenda Viva',
    descricao: 'Coroa de ouro, faíscas e uma nebulosa de fundo. Top 1 global.',
    raridade: 'exclusivo',
    config: {
      base: 'bas_classica',
      camadas: { cabelo: 'cab_longo', olhos: 'olh_brilho', boca: 'boc_sorriso', roupa: 'rou_terno', acessorio: 'ace_coroa', fundo: 'fun_nebulosa', moldura: 'mol_ouro', efeito: 'efe_faiscas' },
      cores: { pele: '#e8b58c', cabelo: '#d9b166', roupa: '#5b3d8a', destaque: '#e8b64c' },
    },
  },
  {
    id: 'pre_holograma',
    nome: 'Holograma Synth',
    descricao: 'Projeção translúcida sobre o grid oitentista. Puro synthwave.',
    raridade: 'lendario',
    config: {
      base: 'bas_holo',
      camadas: { olhos: 'olh_visor', boca: 'boc_neutra', roupa: 'rou_jaqueta', fundo: 'fun_grade', moldura: 'mol_neon', efeito: 'efe_scanlines' },
      cores: { pele: '#9fe8c8', cabelo: '#3d2b1f', roupa: '#5b3d8a', destaque: '#ff5f8f' },
    },
  },
];

/** Config completo a partir de um preset (aplica versão/formato + validação). */
export function configDePreset(preset: Preset): AvatarConfig {
  return validarConfig({ formato: 'camadas', versao: VERSAO_CONFIG, ...preset.config });
}
