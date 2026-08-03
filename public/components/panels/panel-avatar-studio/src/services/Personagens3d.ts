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
