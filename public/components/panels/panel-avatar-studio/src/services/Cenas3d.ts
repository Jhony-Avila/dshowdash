// services/Cenas3d.ts — CENAS salvas do palco 3D (AS5 · mega 31).
// @version 1.0.0  @created 2026-08-04
//
// Uma cena é um SNAPSHOT do setup do palco 3D: personagem (override ou
// Auto), fundo, luz, câmera, animação, marca e qualidade. Molde do
// PresetsPessoais (§136): localStorage versionado, limite explícito,
// fail-safe (storage indisponível = lista vazia, nunca quebra o palco).
// Validação ESTRITA nos domínios — importar/aplicar nunca injeta lixo.

export const CHAVE_CENAS = 'dshow.avst5.p3d.cenas.v1';
const LIMITE = 8;

export const FUNDOS_3D = ['neutro', 'estudio', 'grade'] as const;
// onda 1408 (#161): enum só CRESCE — 'portrait'/'dramatic' são looks do
// registry Looks3d (só aparecem na UI com as6.looks); cena antiga continua
// válida byte a byte (sanitizar mantém 'estudio' como padrão)
export const LUZES_3D = ['estudio', 'quente', 'fria', 'neon', 'portrait', 'dramatic'] as const;
export const CAMERAS_3D = ['retrato', 'corpo', 'orbita', 'cinematica', 'busto', 'face', 'costas'] as const; // onda 1419 (#204): presets novos aditivos (enum só cresce)
export const QUALIDADES_3D = ['auto', 'alto', 'medio', 'economico'] as const;

export interface Cena3d {
  id: string;
  nome: string;
  criadoEm: string;                          // ISO
  personagem: string | null;                 // null = Auto (segue a base 2D)
  fundo: (typeof FUNDOS_3D)[number];
  luz: (typeof LUZES_3D)[number];
  camera: (typeof CAMERAS_3D)[number];
  animacao: string;
  marca: boolean;
  qualidade: (typeof QUALIDADES_3D)[number];
}

/** Sanitiza UMA entrada crua — campos fora do domínio caem no padrão. */
export function sanitizarCena(bruto: unknown): Cena3d | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const c = bruto as Record<string, unknown>;
  if (typeof c.id !== 'string' || typeof c.nome !== 'string' || !c.nome.trim()) return null;
  const dominio = <T extends readonly string[]>(v: unknown, lista: T, padrao: T[number]): T[number] =>
    (typeof v === 'string' && (lista as readonly string[]).includes(v) ? v as T[number] : padrao);
  return {
    id: c.id.slice(0, 40),
    nome: c.nome.trim().slice(0, 32),
    criadoEm: typeof c.criadoEm === 'string' ? c.criadoEm : new Date(0).toISOString(),
    personagem: typeof c.personagem === 'string' ? c.personagem.slice(0, 64) : null,
    fundo: dominio(c.fundo, FUNDOS_3D, 'estudio'),
    luz: dominio(c.luz, LUZES_3D, 'estudio'),
    camera: dominio(c.camera, CAMERAS_3D, 'corpo'),
    animacao: typeof c.animacao === 'string' ? c.animacao.slice(0, 48) : 'Idle',
    marca: c.marca !== false,
    qualidade: dominio(c.qualidade, QUALIDADES_3D, 'auto'),
  };
}

function lerTudo(): Cena3d[] {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_CENAS) ?? '[]');
    if (!Array.isArray(bruto)) return [];
    return bruto.map(sanitizarCena).filter((c): c is Cena3d => c !== null);
  } catch { return []; }
}

function gravar(lista: Cena3d[]): void {
  try { localStorage.setItem(CHAVE_CENAS, JSON.stringify(lista.slice(0, LIMITE))); } catch { /* cheio/indisponível */ }
}

export function listarCenas(): Cena3d[] {
  return lerTudo();
}

/** Salva o setup atual; nome vazio ganha "Cena N". Devolve a cena ou null (limite). */
export function salvarCena(setup: Omit<Cena3d, 'id' | 'nome' | 'criadoEm'>, nome = ''): Cena3d | null {
  const atuais = lerTudo();
  if (atuais.length >= LIMITE) return null;
  const cena: Cena3d = {
    ...setup,
    id: `c3_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    nome: (nome.trim() || `Cena ${atuais.length + 1}`).slice(0, 32),
    criadoEm: new Date().toISOString(),
  };
  gravar([...atuais, cena]);
  return cena;
}

export function excluirCena(id: string): void {
  gravar(lerTudo().filter((c) => c.id !== id));
}

/** mega 38: substitui a biblioteca inteira (import validado). */
export function substituirCenas(cenas: Cena3d[]): void {
  gravar(cenas.map(sanitizarCena).filter((c): c is Cena3d => c !== null));
}
