// scripts/avatar/motor/entry.ts — ponto de entrada do MOTOR EXPORTÁVEL do Avatar Studio (Programa "Avatar nativo", Onda 1).
// O mesmo motor que o painel usa (engine + AvatarCatalog), empacotado pelo exportar-motor.mjs como IIFE `DSHOWAvatarMotor`
// para rodar fora do navegador do Dash: JavaScriptCore no app iOS (pré-visualização, catálogo, miniaturas) e Node `vm` no
// backend do app (render para salvar + conferência de versão). Só strings entram e saem; nenhum DOM, nenhuma rede.
// Nada aqui altera o desenho: são REEXPORTAÇÕES. A única função nova é `definirFlags`, que usa o mecanismo documentado de
// sobreposição local de flags (nucleo/flags.ts: localStorage['dshow.avst.flags.v1'], precedência local → remoto → padrão).
export { renderAvatar, renderDataUri, hashConfig, hashTexto, congelarSvg } from '@painel/engine/render';
export { paletaDe } from '@painel/engine/cores';
export { CAMADAS_Z, ORDEM_CAMADAS } from '@painel/engine/camadas';
export {
  CATEGORIAS, categoriasAtivas, itensDe, itemPorId, CONFIG_PADRAO, validarConfig, svgDe, svgFotoDe, dataUriDe, svgItemIsolado,
  CORES_SUGERIDAS, PALETAS_ROUPA, TITULOS, ARQUETIPOS, PRESETS, presetsAtivos, configDePreset, COLECOES,
} from '@painel/services/AvatarCatalog';
export { flag, FLAGS_REMOTAS } from '@painel/nucleo/flags';
export type { AvatarConfig, ItemCatalogo, CategoriaId, Raridade } from '@painel/domain/types';

const CHAVE_LOCAL = 'dshow.avst.flags.v1'; // igual a nucleo/flags.ts (conferido pelo teste motor-export.mjs)

/** Aplica flags resolvidas pelo servidor (ou pelos testes) sem alterar o motor: escreve na sobreposição LOCAL documentada.
 *  Em ambientes sem localStorage (JavaScriptCore, Node vm) instala um armazenamento mínimo em memória. */
export function definirFlags(valores: Record<string, boolean>): void {
  const g = globalThis as unknown as { localStorage?: { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void } };
  if (!g.localStorage) {
    const m = new Map<string, string>();
    g.localStorage = {
      getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
      setItem: (k, v) => { m.set(k, String(v)); },
      removeItem: (k) => { m.delete(k); },
    };
  }
  const limpo: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(valores)) if (/^[a-z0-9_.]{1,64}$/.test(k)) limpo[k] = !!v;
  g.localStorage.setItem(CHAVE_LOCAL, JSON.stringify(limpo));
}

/** Catálogo serializável (sem funções de render) para o app montar as telas sem duplicar dados em Swift. */
export function catalogoSerializavel(): { categorias: unknown[]; itens: Record<string, unknown[]> } {
  // import dinâmico evitado de propósito: reexportações acima já trazem o catálogo
  const { CATEGORIAS: cats, itensDe: itens } = require_catalogo();
  const porCategoria: Record<string, unknown[]> = {};
  for (const c of cats) {
    porCategoria[c.id] = itens(c.id).map((it: Record<string, unknown>) => {
      const { render, variantes, renderCorpo, renderAtras, renderFrente, renderSombra, renderPlanos, renderCorpoV2, ...dados } = it as Record<string, unknown> & { render?: unknown; variantes?: unknown; renderCorpo?: unknown; renderAtras?: unknown; renderFrente?: unknown; renderSombra?: unknown; renderPlanos?: unknown; renderCorpoV2?: unknown };
      void render; void variantes; void renderCorpo; void renderAtras; void renderFrente; void renderSombra; void renderPlanos; void renderCorpoV2;
      return dados;
    });
  }
  return { categorias: cats as unknown[], itens: porCategoria };
}
import * as _cat from '@painel/services/AvatarCatalog';
function require_catalogo(): { CATEGORIAS: typeof _cat.CATEGORIAS; itensDe: typeof _cat.itensDe } {
  return { CATEGORIAS: _cat.CATEGORIAS, itensDe: _cat.itensDe };
}
