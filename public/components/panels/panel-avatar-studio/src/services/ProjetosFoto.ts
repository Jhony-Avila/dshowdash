// services/ProjetosFoto.ts — PROJETOS do Photo Studio (mega 57 · §364).
// @version 1.0.0  @created 2026-08-04
//
// Um projeto guarda a FOTO-BASE (miniaturizada p/ caber no localStorage)
// + o estilo completo + o formato — reabrir devolve o trabalho exatamente
// onde parou. Molde PresetsPessoais: storage versionado, limite explícito,
// fail-safe. A foto é recomprimida a 480px JPEG (~40–80KB) — 6 projetos
// cabem com folga na cota; o export final SEMPRE recompõe do estilo.
import type { EstiloFoto } from '../domain/types';
import type { FormatoFotoId } from '../engine/render-foto';

const CHAVE = 'dshow.avst5.foto.projetos.v1';
const LIMITE = 8; // mega 252 (§364 v2): 6→8
const LADO_MINIATURA = 480;

export interface ProjetoFoto {
  id: string;
  nome: string;
  criadoEm: string;   // ISO
  foto: string;       // dataURI JPEG 480 (base do trabalho)
  estilo: EstiloFoto;
  formato: FormatoFotoId;
}

function lerTudo(): ProjetoFoto[] {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
    if (!Array.isArray(bruto)) return [];
    return bruto.filter((p): p is ProjetoFoto =>
      !!p && typeof p.id === 'string' && typeof p.nome === 'string'
      && typeof p.foto === 'string' && p.foto.startsWith('data:image/')
      && !!p.estilo && typeof p.estilo === 'object');
  } catch { return []; }
}

function gravar(lista: ProjetoFoto[]): void {
  try { localStorage.setItem(CHAVE, JSON.stringify(lista.slice(0, LIMITE))); } catch { /* cota/indisponível */ }
}

export function listarProjetosFoto(): ProjetoFoto[] {
  return lerTudo();
}

/** Recomprime a foto-base p/ caber no storage (JPEG 480, qualidade .85). */
export async function miniaturizarFoto(dataUri: string): Promise<string> {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUri; });
  const lado = Math.min(LADO_MINIATURA, Math.max(img.width, img.height) || LADO_MINIATURA);
  const c = document.createElement('canvas');
  c.width = lado; c.height = lado;
  const g = c.getContext('2d');
  if (!g) return dataUri;
  g.fillStyle = '#0a0d15';
  g.fillRect(0, 0, lado, lado);
  g.drawImage(img, 0, 0, lado, lado);
  return c.toDataURL('image/jpeg', 0.85);
}

/** Salva (nome vazio ganha "Projeto N"). Devolve null no limite/cota. */
export async function salvarProjetoFoto(
  fotoDataUri: string, estilo: EstiloFoto, formato: FormatoFotoId, nome = '',
): Promise<ProjetoFoto | null> {
  const atuais = lerTudo();
  if (atuais.length >= LIMITE) return null;
  const projeto: ProjetoFoto = {
    id: `pf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    nome: (nome.trim() || `Projeto ${atuais.length + 1}`).slice(0, 32),
    criadoEm: new Date().toISOString(),
    foto: await miniaturizarFoto(fotoDataUri),
    estilo,
    formato,
  };
  gravar([projeto, ...atuais]);
  return projeto;
}

/** mega 252 (§364 v2): renomear projeto (sanitizado; vazio = no-op). */
export function renomearProjetoFoto(id: string, nome: string): void {
  const limpo = nome.replace(/[^\p{L}\p{N} \-]/gu, '').slice(0, 24).trim();
  if (!limpo) return;
  try {
    const lista = listarProjetosFoto().map((p) => (p.id === id ? { ...p, nome: limpo } : p));
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch { /* sem storage */ }
}

export function excluirProjetoFoto(id: string): void {
  gravar(lerTudo().filter((p) => p.id !== id));
}
