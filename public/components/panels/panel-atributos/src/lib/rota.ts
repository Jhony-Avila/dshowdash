// panel-atributos/src/lib/rota.ts — endereço próprio de cada tela do módulo (pedido do Jhony, 18/11): recarregar mantém a tela,
// Voltar do navegador funciona e a ficha de um produto pode ser aberta e compartilhada pelo endereço.
//   #/panel-atributos                     → Produtos (lista; item "Geral Produtos" do menu; /produtos é aceito e normalizado para cá)
//   #/panel-atributos/<tela>              → visao-geral · produtos · vincular · preencher · kits · atributos · unidades · conferencia
//   #/panel-atributos/kits/<id>           → um kit aberto
//   #/panel-atributos/produto/<id>        → ficha do produto
// Funções PURAS (testadas em scripts/atributos/testes/front-puras.test.ts).
import type { Aba } from '../app/contexto';

export const BASE_ROTA = '#/panel-atributos';
const SLUG: Record<Aba, string> = { visao: 'visao-geral', produtos: 'produtos', vincular: 'vincular', preencher: 'preencher', kits: 'kits', atributos: 'atributos', unidades: 'unidades', conferencia: 'conferencia' };
const ABA_DO_SLUG: Record<string, Aba> = Object.fromEntries(Object.entries(SLUG).map(([a, s]) => [s, a as Aba]));

export interface EstadoRota { aba: Aba; produto: number | null; kit: number | null }

const idValido = (s: string | undefined): number | null => (s && /^[1-9][0-9]{0,9}$/.test(s) ? Number(s) : null);

/** Lê o hash. Fora do módulo ou desconhecido → null (quem chama decide o padrão). */
export function lerRota(hash: string): EstadoRota | null {
  const h = (hash || '').split('?')[0]!.replace(/\/+$/, '');
  if (h !== BASE_ROTA && !h.startsWith(BASE_ROTA + '/')) return null;
  const partes = h.slice(BASE_ROTA.length).split('/').filter(Boolean).map((p) => decodeURIComponent(p).toLowerCase());
  if (partes.length === 0) return { aba: 'produtos', produto: null, kit: null };
  if (partes[0] === 'produto') { const id = idValido(partes[1]); return id ? { aba: 'produtos', produto: id, kit: null } : { aba: 'produtos', produto: null, kit: null }; }
  const aba = ABA_DO_SLUG[partes[0]!];
  if (!aba) return { aba: 'produtos', produto: null, kit: null };
  return { aba, produto: null, kit: aba === 'kits' ? idValido(partes[1]) : null };
}

/** Monta o hash do estado (a ficha vence a aba; o kit só vale na aba Kits). */
export function rotaDe(e: EstadoRota): string {
  if (e.produto !== null) return `${BASE_ROTA}/produto/${e.produto}`;
  if (e.aba === 'kits' && e.kit !== null) return `${BASE_ROTA}/kits/${e.kit}`;
  if (e.aba === 'produtos') return BASE_ROTA;   // lista de produtos = endereço do item "Geral Produtos" do menu (destaque exato do menu)
  return `${BASE_ROTA}/${SLUG[e.aba]}`;
}
