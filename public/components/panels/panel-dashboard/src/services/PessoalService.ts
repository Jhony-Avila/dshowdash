// services/PessoalService.ts — preferências PESSOAIS da Home (§23–§24).
// @version 1.0.0  @created 2026-07-30
//
// Responsabilidade única: favoritos de módulo, rotas abertas recentemente,
// notas rápidas e links pessoais. Tudo LOCAL (localStorage, fail-safe) —
// nada daqui sobe para o servidor; limpar o navegador zera as preferências,
// como a nota da personalização já avisa (§25).
import type { ModuloId } from '../domain/types';

const K_FAV = 'dshow.home.favoritos.v1';
const K_REC = 'dshow.home.recentes.v1';
const K_NOTAS = 'dshow.home.notas.v1';
const K_LINKS = 'dshow.home.links.v1';

const MAX_RECENTES = 8;
const MAX_LINKS = 12;
const MAX_NOTAS = 4000;

export interface RotaRecente { rota: string; quando: string }
export interface LinkPessoal { id: string; nome: string; url: string }

function ler<T>(chave: string, padrao: T): T {
  try {
    const raw = window.localStorage.getItem(chave);
    return raw === null ? padrao : (JSON.parse(raw) as T);
  } catch { return padrao; }
}
function gravar(chave: string, valor: unknown): void {
  try { window.localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem storage */ }
}

// ── favoritos de módulo (§24) ───────────────────────────────────────

export function favoritosModulos(): Set<ModuloId> {
  return new Set(ler<ModuloId[]>(K_FAV, []));
}

export function alternarFavoritoModulo(id: ModuloId): Set<ModuloId> {
  const atual = favoritosModulos();
  if (atual.has(id)) atual.delete(id); else atual.add(id);
  gravar(K_FAV, Array.from(atual));
  return atual;
}

// ── rotas recentes (§24) ────────────────────────────────────────────

export function rotasRecentes(): RotaRecente[] {
  const lista = ler<RotaRecente[]>(K_REC, []);
  return Array.isArray(lista)
    ? lista.filter((r) => typeof r?.rota === 'string' && r.rota.startsWith('#/'))
    : [];
}

/** Registra uma navegação saindo da Home (dedup pela rota; mais novo 1º). */
export function registrarRecente(rota: string): void {
  if (!rota.startsWith('#/')) return; // âncoras internas (sec:) não contam
  const lista = rotasRecentes().filter((r) => r.rota !== rota);
  lista.unshift({ rota, quando: new Date().toISOString() });
  gravar(K_REC, lista.slice(0, MAX_RECENTES));
}

// ── notas rápidas (§23) ─────────────────────────────────────────────

export function lerNotas(): string {
  const n = ler<string>(K_NOTAS, '');
  return typeof n === 'string' ? n.slice(0, MAX_NOTAS) : '';
}

export function salvarNotas(texto: string): void {
  gravar(K_NOTAS, texto.slice(0, MAX_NOTAS));
}

// ── links pessoais (§23) ────────────────────────────────────────────

export function linksPessoais(): LinkPessoal[] {
  const lista = ler<LinkPessoal[]>(K_LINKS, []);
  return Array.isArray(lista)
    ? lista.filter((l) => typeof l?.id === 'string' && typeof l?.nome === 'string' && urlValida(l?.url))
    : [];
}

/** Só http(s) — nada de javascript:/data: nos links pessoais. */
export function urlValida(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

/** Adiciona um link (nome 1–40 chars, URL http/https). null = inválido/cheio. */
export function adicionarLink(nome: string, url: string): LinkPessoal[] | null {
  const nomeLimpo = nome.trim().slice(0, 40);
  const urlLimpa = url.trim();
  if (!nomeLimpo || !urlValida(urlLimpa)) return null;
  const lista = linksPessoais();
  if (lista.length >= MAX_LINKS) return null;
  lista.push({ id: `lk${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`, nome: nomeLimpo, url: urlLimpa });
  gravar(K_LINKS, lista);
  return lista;
}

export function removerLink(id: string): LinkPessoal[] {
  const lista = linksPessoais().filter((l) => l.id !== id);
  gravar(K_LINKS, lista);
  return lista;
}
