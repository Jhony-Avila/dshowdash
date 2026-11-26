// lib/api.ts — cliente da API de prévia cadastral (C1 v1.1, VINHO): /api/cadastro/previa.php?r=…
// GET r=lote (o mais recente) · GET r=linhas&lote=&pagina=&por_pagina= (a tela lê TODAS as páginas e filtra no navegador: as contagens dos
// filtros saem da mesma população) · POST r=gerar (CSRF) = "Gerar prévia": só LÊ as fontes; grava apenas o lote nas tabelas novas do consultar_io.
// Sem acesso (nível < 100) a API responde 404, igual a "nenhum lote" → a tela diz as duas possibilidades. Nada aqui escreve no CRM.
import type { Lote, PaginaLinhas, Linha, Previa } from './tipos';

const BASE = '/api/cadastro/previa.php';
export type Resultado =
  | { tipo: 'ok'; previa: Previa }
  | { tipo: 'sem_lote' }                         // 404: sem acesso (nível < 100) ou nenhuma prévia gerada ainda
  | { tipo: 'erro'; motivo: string; http?: number };

function csrfDoDom(): string {
  try {
    const g = (window as unknown as { SecurityCSRF?: { getToken?: () => string } }).SecurityCSRF;
    if (g?.getToken) { const t = g.getToken(); if (t) return t; }
  } catch { /* ignora */ }
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}
let csrfCache = '';
async function csrf(): Promise<string> {
  const d = csrfDoDom(); if (d) return d; if (csrfCache) return csrfCache;
  try {
    const r = await fetch('/api/auth/check.php', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (r.ok) csrfCache = (await r.json())?.data?.session?.csrf_token ?? '';
  } catch { /* o servidor recusa e a tela mostra o erro */ }
  return csrfCache;
}

type Env<T> = { ok?: boolean; data?: T; error?: unknown };
async function pedir<T>(url: string, init: RequestInit, signal?: AbortSignal): Promise<{ http: number; data?: T; erro?: string }> {
  let res: Response;
  try { res = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...init, headers: { Accept: 'application/json', ...(init.headers || {}) }, signal }); }
  catch (e) { return { http: 0, erro: (e as Error)?.name === 'AbortError' ? 'cancelado' : 'sem conexão com o servidor' }; }
  let corpo: Env<T> = {};
  try { corpo = await res.json(); } catch { /* corpo não-JSON */ }
  if (!res.ok || corpo.ok === false || corpo.data === undefined) {
    const e = corpo.error; const cod = typeof e === 'string' ? e : (e as { code?: string; message?: string } | undefined)?.code ?? (e as { message?: string } | undefined)?.message;
    return { http: res.status, erro: cod || `HTTP ${res.status}` };
  }
  return { http: res.status, data: corpo.data };
}

const MSG: Record<string, string> = {
  dados_indisponiveis: 'as fontes da prévia estão indisponíveis agora', CSRF_INVALID: 'sessão sem token de segurança; recarregue a página',
  total_mudou: 'o total de linhas mudou durante a leitura', linha_duplicada: 'uma linha veio repetida na paginação',
  paginacao_incompleta: 'as páginas não somam o total informado', pagina_invalida: 'a API devolveu uma página fora do contrato',
};
/** "409 · o total de linhas mudou…": o código HTTP vai junto quando é um conflito de leitura (F26), para o erro ser inequívoco na tela. */
const motivo = (http: number, erro?: string) => { const t = (erro && MSG[erro]) || erro || `HTTP ${http}`; return http === 409 ? `409 · ${t}` : t; };

async function todasAsLinhas(lote: string, signal?: AbortSignal): Promise<{ ok: true; linhas: Linha[] } | { ok: false; http: number; erro?: string }> {
  // RC-008 F26: a leitura paginada só vale INTEIRA e consistente. Falha (409, erro visível) se o total mudar entre páginas, se uma linha vier
  // repetida ou se a soma das páginas não fechar com o total. Nunca mostra uma prévia parcial como se fosse a completa.
  const linhas: Linha[] = []; const ids = new Set<string>(); let total: number | null = null;
  for (let pagina = 1; pagina <= 50; pagina++) {   // teto de segurança: 50 × 200 = 10 000 linhas
    const r = await pedir<PaginaLinhas>(`${BASE}?r=linhas&lote=${encodeURIComponent(lote)}&pagina=${pagina}&por_pagina=200`, { method: 'GET' }, signal);
    if (!r.data) return { ok: false, http: r.http, erro: r.erro };
    if (!Number.isInteger(r.data.total) || r.data.total < 0 || !Array.isArray(r.data.itens)) return { ok: false, http: 409, erro: 'pagina_invalida' };
    if (total !== null && r.data.total !== total) return { ok: false, http: 409, erro: 'total_mudou' };
    total = r.data.total;
    for (const item of r.data.itens) {
      if (!item || typeof item.id !== 'string' || ids.has(item.id)) return { ok: false, http: 409, erro: 'linha_duplicada' };
      ids.add(item.id); linhas.push(item);
    }
    if (linhas.length >= total || r.data.itens.length === 0) break;
  }
  if (total === null || linhas.length !== total) return { ok: false, http: 409, erro: 'paginacao_incompleta' };
  return { ok: true, linhas };
}

async function previaDe(lote: Lote, signal?: AbortSignal): Promise<Resultado> {
  const l = await todasAsLinhas(lote.id, signal);
  return l.ok ? { tipo: 'ok', previa: { lote, linhas: l.linhas } } : { tipo: 'erro', motivo: motivo(l.http, l.erro), http: l.http };
}

/** Abre a tela: o lote mais recente e as suas linhas. */
export async function lerPrevia(signal?: AbortSignal): Promise<Resultado> {
  const r = await pedir<Lote>(`${BASE}?r=lote`, { method: 'GET' }, signal);
  if (r.http === 404) return { tipo: 'sem_lote' };
  if (!r.data) return { tipo: 'erro', motivo: motivo(r.http, r.erro), http: r.http };
  return previaDe(r.data, signal);
}

/** "Gerar prévia": lê as fontes de novo (só leitura nelas) e cria um lote novo; nenhuma compra, nenhuma escrita no CRM. */
export async function gerarPrevia(signal?: AbortSignal): Promise<Resultado> {
  const token = await csrf();
  const r = await pedir<Lote>(`${BASE}?r=gerar`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
    body: JSON.stringify({ filas: ['ganhos', 'sem_cnpj_id_precifica'] }) }, signal);
  if (r.http === 404) return { tipo: 'sem_lote' };
  if (!r.data) return { tipo: 'erro', motivo: motivo(r.http, r.erro), http: r.http };
  return previaDe(r.data, signal);
}
