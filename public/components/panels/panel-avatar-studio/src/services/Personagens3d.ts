// services/Personagens3d.ts — personagens 3D PUBLICADOS (AS5 F5 · §423/§517).
// @version 1.0.0  @created 2026-08-03
//
// Fonte única de conhecimento sobre a pasta pública de personagens 3D:
// carrega o manifest §517 e resolve o LOD certo por QualidadeTier (§423).
// Não conhece three nem DOM — o Renderizador3d consome daqui.
import type { QualidadeTier } from '../nucleo/contratos';

export const BASE_PERSONAGENS_3D = '/assets/avatars/3d/personagens';

/** Espelho do manifest §517 (campos que o runtime usa). */
export interface ManifestPersonagem3d {
  id: string;
  tipo: string;
  versao: number;
  rig: string;
  lods: { lod0: string; lod1: string; lod2: string };
  hashes: Record<string, string>;
  triangulos?: Record<string, number>;
  animacoes?: string[];
}

/** §423: tier → LOD (auto = medio, DETERMINÍSTICO — nada de sniffing aqui;
 *  o orquestrador pode promover/rebaixar com telemetria §528 no futuro). */
export function lodPorQualidade(qualidade: QualidadeTier | 'auto'): 'lod0' | 'lod1' | 'lod2' {
  if (qualidade === 'alto') return 'lod0';
  if (qualidade === 'economico') return 'lod2';
  return 'lod1'; // medio e auto
}

export function urlDoPersonagem(slug: string, arquivo: string, base: string = BASE_PERSONAGENS_3D): string {
  return `${base}/${slug}/${arquivo}`;
}

/** Carrega e valida (na medida do runtime) o manifest do personagem. */
export async function carregarManifest3d(
  slug: string,
  base: string = BASE_PERSONAGENS_3D,
): Promise<ManifestPersonagem3d> {
  const r = await fetch(urlDoPersonagem(slug, 'manifest.json', base), { cache: 'no-store' });
  if (!r.ok) throw new Error(`manifest do personagem "${slug}" indisponível (${r.status})`);
  const m = (await r.json()) as ManifestPersonagem3d;
  if (!m?.id || !m?.lods?.lod0 || !m?.lods?.lod1 || !m?.lods?.lod2) {
    throw new Error(`manifest de "${slug}" fora do contrato §517`);
  }
  return m;
}

/** URL do GLB do personagem no tier pedido. */
export function urlDoLod(
  manifest: ManifestPersonagem3d,
  qualidade: QualidadeTier | 'auto',
  base: string = BASE_PERSONAGENS_3D,
): string {
  return urlDoPersonagem(manifest.id, manifest.lods[lodPorQualidade(qualidade)], base);
}

// ── mega 9: índice dinâmico + mapeamento base 2D → personagem 3D ────

/** Entrada do index.json gerado por gerar-indice-3d.mjs. */
export interface EntradaIndice3d {
  slug: string;
  nome: string;
  thumb: string;
  animacoes: string[];
}

/** mega 11: CADEIA fail-safe de catálogo — REGISTRY §614 (API) →
 *  index.json (derivado da publicação) → null (a UI usa o embutido).
 *  Devolve também a FONTE que serviu (telemetria/diagnóstico). */
export async function carregarIndice3d(
  base: string = BASE_PERSONAGENS_3D,
): Promise<{ personagens: EntradaIndice3d[]; fonte: 'registry' | 'indice' } | null> {
  // 1) registry vivo (§614) — vazio/erro NUNCA bloqueia (§481)
  try {
    const r = await fetch('/api/avatar/personagens3d.php', { credentials: 'include', cache: 'no-store' });
    if (r.ok) {
      const corpo = await r.json() as { data?: { personagens?: EntradaIndice3d[] } };
      const lista = corpo?.data?.personagens;
      if (Array.isArray(lista) && lista.length) return { personagens: lista, fonte: 'registry' };
    }
  } catch { /* segue a cadeia */ }
  // 2) index.json estático (derivado por gerar-indice-3d.mjs)
  try {
    const r = await fetch(`${base}/index.json`, { cache: 'no-store' });
    if (r.ok) {
      const corpo = await r.json() as { personagens?: EntradaIndice3d[] };
      if (Array.isArray(corpo?.personagens) && corpo.personagens.length) {
        return { personagens: corpo.personagens, fonte: 'indice' };
      }
    }
  } catch { /* fallback embutido decide na UI */ }
  return null;
}

/** Mapa base 2D → personagem 3D (mega 9): a espécie escolhida no 2D
 *  decide o personagem da prévia — o seletor manual da UI faz OVERRIDE.
 *  Fonte única; cresce junto do catálogo (UBC adicionará variações). */
const MAPA_BASE_3D: Record<string, string> = {
  bas_androide: 'androide', bas_ledbot: 'androide', bas_holo: 'androide',
  bas_alien: 'androide', bas_fantasma: 'androide',
  bas_panda: 'animal_pug', bas_coruja: 'animal_pug', bas_raposa: 'animal_pug',
  bas_lobo: 'animal_pug', bas_leao: 'animal_pug', bas_gato: 'animal_pug',
  bas_urso: 'animal_pug', bas_dragao: 'animal_pug', bas_tigre: 'animal_pug',
};

/** Resolve o personagem 3D a partir do ESTADO (body.base 2D). */
export function personagemParaBase(base: string | null): string {
  return (base && MAPA_BASE_3D[base]) || 'humano_casual';
}
