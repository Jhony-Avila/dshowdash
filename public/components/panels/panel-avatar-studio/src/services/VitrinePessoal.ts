// services/VitrinePessoal.ts — MINHA VITRINE + GALERIAS (mega 230 · §1076/§1077).
// @version 1.0.0  @created 2026-08-05
//
// Recorte CLIENT-SIDE da Parte 14 (social enterprise): a vitrine pessoal
// (§1076) é a ordem dos BLOCOS do perfil (reorganizável por controles
// acessíveis — nada de backend novo), e as GALERIAS (§1077) agrupam as
// criações locais (presets pessoais e projetos do Photo Studio) por nome.
// Local-first, fail-safe por construção (molde Listas/Cenas3d).

const CHAVE_ORDEM = 'dshow.avst5.vitrine.ordem.v1';
const CHAVE_GALERIAS = 'dshow.avst5.galerias.v1';
const TETO_GALERIAS = 6;
const TETO_ITENS = 24;

/** §1076: blocos da vitrine (conteúdo derivado — só a ORDEM persiste). */
export const BLOCOS_VITRINE = [
  'avatar', 'presets', 'colecao', 'conquista', 'titulo', 'projeto',
] as const;
export type BlocoVitrine = (typeof BLOCOS_VITRINE)[number];

export const NOME_BLOCO: Record<BlocoVitrine, string> = {
  avatar: 'Avatar atual',
  presets: 'Presets favoritos',
  colecao: 'Coleção preferida',
  conquista: 'Conquista principal',
  titulo: 'Título',
  projeto: 'Projeto recente',
};

export function ordemVitrine(): BlocoVitrine[] {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE_ORDEM) ?? '[]');
    const salva = Array.isArray(b)
      ? b.filter((x): x is BlocoVitrine => (BLOCOS_VITRINE as readonly string[]).includes(x))
      : [];
    // blocos novos entram no FIM (aditivo — atualização nunca some com bloco)
    const faltantes = BLOCOS_VITRINE.filter((x) => !salva.includes(x));
    return [...salva, ...faltantes];
  } catch { return [...BLOCOS_VITRINE]; }
}

/** §1076: move um bloco (−1 sobe · +1 desce) e devolve a nova ordem. */
export function moverBloco(id: BlocoVitrine, delta: -1 | 1): BlocoVitrine[] {
  const ordem = ordemVitrine();
  const i = ordem.indexOf(id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= ordem.length) return ordem;
  [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
  try { localStorage.setItem(CHAVE_ORDEM, JSON.stringify(ordem)); } catch { /* sem storage */ }
  return ordem;
}

// ── §1077: GALERIAS locais ──────────────────────────────────────────
/** referência tipada a uma criação local: "preset:<id>" | "projeto:<id>" */
export type RefGaleria = string;

export interface GaleriaLocal {
  id: string;
  nome: string;
  itens: RefGaleria[];
}

function refValida(r: unknown): r is RefGaleria {
  return typeof r === 'string' && /^(preset|projeto):[\w-]{1,40}$/.test(r);
}

function gravarGalerias(l: GaleriaLocal[]): void {
  try { localStorage.setItem(CHAVE_GALERIAS, JSON.stringify(l.slice(0, TETO_GALERIAS))); } catch { /* sem storage */ }
}

export function listarGalerias(): GaleriaLocal[] {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE_GALERIAS) ?? '[]');
    return Array.isArray(b)
      ? b.filter((g): g is GaleriaLocal =>
        !!g && typeof g.id === 'string' && typeof g.nome === 'string' && Array.isArray(g.itens))
        .map((g) => ({ ...g, nome: g.nome.slice(0, 24), itens: g.itens.filter(refValida).slice(0, TETO_ITENS) }))
        .slice(0, TETO_GALERIAS)
      : [];
  } catch { return []; }
}

export function criarGaleria(nome: string): GaleriaLocal | null {
  const limpo = nome.replace(/[^\p{L}\p{N} \-]/gu, '').slice(0, 24).trim();
  const lista = listarGalerias();
  if (!limpo || lista.length >= TETO_GALERIAS) return null;
  const nova: GaleriaLocal = { id: `gal_${Date.now().toString(36)}_${lista.length}`, nome: limpo, itens: [] };
  gravarGalerias([...lista, nova]);
  return nova;
}

export function excluirGaleria(id: string): void {
  gravarGalerias(listarGalerias().filter((g) => g.id !== id));
}

/** Alterna uma criação na galeria (ref fora do padrão é ignorada). */
export function alternarNaGaleria(galeriaId: string, ref: RefGaleria): void {
  if (!refValida(ref)) return;
  gravarGalerias(listarGalerias().map((g) => {
    if (g.id !== galeriaId) return g;
    const tem = g.itens.includes(ref);
    return { ...g, itens: tem ? g.itens.filter((x) => x !== ref) : [...g.itens, ref].slice(0, TETO_ITENS) };
  }));
}
