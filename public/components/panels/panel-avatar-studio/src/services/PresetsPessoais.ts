// services/PresetsPessoais.ts — biblioteca de PRESETS do usuário (§136/§198–§199).
// @version 1.0.0  @created 2026-07-31  (AS5 F4)
//
// Um preset pessoal é um SNAPSHOT completo do config 2D (§198): camadas,
// cores, título e as regulagens §71/§73 — tudo que o AvatarConfig carrega.
// Storage v1: localStorage `dshow.avst5.presets.v1` (por navegador). O
// SCHEMA da entrada já espelha o §619/avatar_state_versions: quando o
// passo root aplicar o as5_schema no servidor, a migração é 1:1 (config →
// payload do domínio, sem retrabalho de forma). Fail-safe: storage
// indisponível degrada para lista vazia, nunca quebra o shell.
import type { AvatarConfig } from '../domain/types';
import { validarConfig } from './AvatarCatalog';

const CHAVE = 'dshow.avst5.presets.v1';
const LIMITE = 40; // biblioteca generosa sem estourar localStorage

export interface PresetPessoal {
  id: string;
  nome: string;
  tags: string[];
  favorito: boolean;
  criadoEm: string;          // ISO — exibido na biblioteca (§199)
  renderizador: '2d' | '3d'; // §199 — hoje só '2d' é produzido
  config: AvatarConfig;
}

function lerTudo(): PresetPessoal[] {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
    if (!Array.isArray(bruto)) return [];
    return bruto.filter((p): p is PresetPessoal =>
      !!p && typeof p.id === 'string' && typeof p.nome === 'string' && !!p.config);
  } catch { return []; }
}

function gravar(lista: PresetPessoal[]): void {
  try { localStorage.setItem(CHAVE, JSON.stringify(lista.slice(0, LIMITE))); } catch { /* cheio/indisponível */ }
}

export function listarPresets(): PresetPessoal[] {
  // favoritos primeiro, depois mais recentes (§199)
  return lerTudo().sort((a, b) =>
    Number(b.favorito) - Number(a.favorito) || b.criadoEm.localeCompare(a.criadoEm));
}

export function salvarPreset(nome: string, config: AvatarConfig, tags: string[] = []): PresetPessoal | null {
  const limpo = nome.trim().slice(0, 48);
  if (!limpo) return null;
  const preset: PresetPessoal = {
    id: `pp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    nome: limpo,
    tags: tags.map((t) => t.trim()).filter(Boolean).slice(0, 6),
    favorito: false,
    criadoEm: new Date().toISOString(),
    renderizador: '2d',
    config: validarConfig(config), // snapshot SANITIZADO (nunca guarda lixo)
  };
  gravar([preset, ...lerTudo()]);
  return preset;
}

export function excluirPreset(id: string): void {
  gravar(lerTudo().filter((p) => p.id !== id));
}

export function alternarFavoritoPreset(id: string): void {
  gravar(lerTudo().map((p) => (p.id === id ? { ...p, favorito: !p.favorito } : p)));
}

export function duplicarPreset(id: string): void {
  const alvo = lerTudo().find((p) => p.id === id);
  if (alvo) salvarPreset(`${alvo.nome} (cópia)`, alvo.config, alvo.tags);
}

/** mega 38: substitui a biblioteca inteira (import de backup VALIDADO). */
export function substituirPresets(lista: PresetPessoal[]): void {
  gravar(lista);
}

// ── Rascunho automático (§139) + conflito entre abas (§629) ─────────

const CHAVE_RASCUNHO = 'dshow.avst5.rascunho.v1';

export interface Rascunho {
  config: AvatarConfig;
  versaoBase: number;
  em: string;      // ISO
  aba: string;     // id desta aba — detecta concorrência (§629)
}

/** Id estável DESTA aba (sessionStorage sobrevive a reload, não a nova aba). */
export function idDaAba(): string {
  try {
    let id = sessionStorage.getItem('dshow.avst5.aba');
    if (!id) {
      id = Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('dshow.avst5.aba', id);
    }
    return id;
  } catch { return 'aba'; }
}

export function gravarRascunho(config: AvatarConfig, versaoBase: number): void {
  try {
    const r: Rascunho = { config, versaoBase, em: new Date().toISOString(), aba: idDaAba() };
    localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(r));
  } catch { /* sem storage */ }
}

export function lerRascunho(): Rascunho | null {
  try {
    const r = JSON.parse(localStorage.getItem(CHAVE_RASCUNHO) ?? 'null') as Rascunho | null;
    return r && r.config && typeof r.em === 'string' ? r : null;
  } catch { return null; }
}

export function limparRascunho(): void {
  try { localStorage.removeItem(CHAVE_RASCUNHO); } catch { /* sem storage */ }
}

export const CHAVE_RASCUNHO_STORAGE = CHAVE_RASCUNHO;
