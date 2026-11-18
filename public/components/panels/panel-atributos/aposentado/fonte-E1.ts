// panel-atributos/src/services/fonte.ts — de onde a tela lê. Produção: API do Dash (só GET; sessão por cookie).
// `?r=` funciona em produção e na validação sem rota nova no nginx (a forma /api/atributos/<rota> pede location próprio).
import type { FichaProduto, Vitrine } from '../lib/tipos';

export interface FonteDados {
  vitrine(sinal?: AbortSignal): Promise<Vitrine>;
  ficha(id: number, sinal?: AbortSignal): Promise<FichaProduto>;
}

export class ErroApi extends Error {
  constructor(public readonly http: number, public readonly codigo: string, mensagem: string) { super(mensagem); }
}

async function obter<T>(rota: string, params: Record<string, string>, sinal?: AbortSignal): Promise<T> {
  const q = new URLSearchParams({ r: rota, ...params }).toString();
  const res = await fetch(`/api/atributos/index.php?${q}`, { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: sinal });
  // Envelope do Dash (ApiResponse): {ok, data, error: "<CÓDIGO>", meta?: {message}}
  let corpo: { ok?: boolean; data?: T; error?: string | null; meta?: { message?: string } } = {};
  try { corpo = await res.json(); } catch { /* corpo não-JSON: trata pelo status */ }
  if (!res.ok || corpo.ok === false) {
    const msg = res.status === 404 ? 'Recurso não disponível para o seu usuário.' : res.status === 403 ? 'Seu nível não permite consultar esta tela.'
      : res.status === 503 ? 'Catálogo de produtos indisponível no momento.' : (corpo.meta?.message || `Falha ao carregar (${res.status}).`);
    throw new ErroApi(res.status, corpo.error || String(res.status), msg);
  }
  return corpo.data as T;
}

export const fonteApi: FonteDados = {
  vitrine: (s) => obter<Vitrine>('vitrine', {}, s),
  ficha: (id, s) => obter<FichaProduto>('ficha_produto', { product_id: String(id) }, s),
};
