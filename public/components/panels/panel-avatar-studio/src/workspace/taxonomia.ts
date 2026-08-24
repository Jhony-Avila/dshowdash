// workspace/taxonomia.ts — TAXONOMIA v2 (onda 1361+, decisões #145/#146,
// flag as6.tax_v2; briefing corretivo 2026-08-11 §2–§8).
// @version 1.0.0  @created 2026-08-11
//
// REGISTRY EM DADOS da árvore de navegação: categoria-mãe → categoria
// principal → (subcategorias na DOCK). Substitui a concentração em um
// único botão "Acessório" (#144) por várias mães independentes (Cabeça
// e Rosto, Joias e Adornos, Costas e Mobilidade, Companheiros,
// Elementos Especiais…). REGRAS INEGOCIÁVEIS:
// - isto é METADADO DE NAVEGAÇÃO: nenhum id de asset, slot, camada,
//   conflito ou serialização muda (§9/§10/§11 do briefing — byte-
//   stability #141 intacta; `accessory` segue como tipo técnico);
// - uma principal SEM assets nasce 'em_breve' (selo, desabilitada) —
//   nada vazio publicado como completo (§7);
// - adicionar categoria = adicionar DADO aqui (nunca condicional na
//   sidebar — briefing mestre §14).
import type { CategoriaId } from '../domain/types';

export type EstadoTax = 'ativa' | 'em_breve' | 'oculta';

export interface CategoriaPrincipal {
  id: string;
  nome: string;
  /** categoria TÉCNICA da grade (o contrato de camadas não muda) */
  categoria: CategoriaId;
  /** para principais de acessório: subcategorias (workspace/acessorios
   *  .ts) que a compõem — viram chips na dock; ausente = grade cheia */
  subcats?: string[];
  /** P4/P5/P7/P8 do mega programa: subcategorias GENÉRICAS por TEMA —
   *  chips na dock derivados do campo `tema` que os assets JÁ têm
   *  (dados reais, zero reclassificação manual); subcategorias nomeadas
   *  finas (Camisetas, Botas…) entram quando a arte for subdividida */
  chipsTema?: boolean;
  estado: EstadoTax;
}

export interface CategoriaMae {
  id: string;
  nome: string;
  estado: EstadoTax;
  principais: CategoriaPrincipal[];
}

/** Ferramenta de gestão (§5.11) — NUNCA vira asset; ação existente. */
export interface FerramentaNav {
  id: string;
  nome: string;
  /** V4.3 §5-10: ferramenta absorvida do clássico — só aparece com as6.single_2d ON. */
  single2d?: boolean;
}

export const TAXONOMIA: CategoriaMae[] = [
  {
    id: 'personagem', nome: 'Personagem', estado: 'ativa',
    principais: [
      { id: 'rosto', nome: 'Rosto', categoria: 'base', estado: 'ativa' },
      { id: 'cabelo', nome: 'Cabelo', categoria: 'cabelo', chipsTema: true, estado: 'ativa' },
      { id: 'olhos', nome: 'Olhos', categoria: 'olhos', estado: 'ativa' },
      { id: 'boca', nome: 'Boca', categoria: 'boca', estado: 'ativa' },
    ],
  },
  {
    id: 'vestuario', nome: 'Vestuário', estado: 'ativa',
    principais: [
      { id: 'roupa', nome: 'Roupa', categoria: 'roupa', chipsTema: true, estado: 'ativa' },
      { id: 'sobrepeca', nome: 'Sobrepeça', categoria: 'roupa_sobre', estado: 'ativa' },
      // onda 1404 (#154, as6.slots_corpo): calçados viram ACESSÓRIO no slot pés
      // (nunca ativou como roupa; navegação pura, contrato §1). Corpo inteiro só.
      { id: 'calcados', nome: 'Calçados', categoria: 'acessorio', subcats: ['calcados'], estado: 'ativa' },
    ],
  },
  {
    id: 'cabeca-rosto', nome: 'Cabeça e Rosto', estado: 'ativa',
    principais: [
      { id: 'coberturas', nome: 'Coberturas de cabeça', categoria: 'acessorio', subcats: ['chapeus', 'capuzes'], estado: 'ativa' },
      { id: 'adornos-cab', nome: 'Adornos de cabeça', categoria: 'acessorio', subcats: ['adornos-cabeca'], estado: 'ativa' },
      { id: 'visao', nome: 'Visão', categoria: 'acessorio', subcats: ['oculos', 'tapa-olhos', 'headsets-vr'], estado: 'ativa' },
      { id: 'protecao-facial', nome: 'Proteção facial', categoria: 'acessorio', subcats: ['mascaras'], estado: 'ativa' }, // 1381
      { id: 'mod-faciais', nome: 'Modificações faciais', categoria: 'acessorio', subcats: ['rosto-marcas'], estado: 'ativa' },
      { id: 'audio-com', nome: 'Áudio e comunicação', categoria: 'acessorio', subcats: ['fones'], estado: 'ativa' },
    ],
  },
  {
    id: 'joias', nome: 'Joias e Adornos', estado: 'ativa',
    principais: [
      { id: 'orelhas', nome: 'Orelhas', categoria: 'acessorio', subcats: ['brincos'], estado: 'ativa' },
      { id: 'pescoco', nome: 'Pescoço', categoria: 'acessorio', subcats: ['colares', 'lencos', 'gravatas'], estado: 'ativa' },
      { id: 'peito', nome: 'Peito', categoria: 'acessorio', subcats: ['insignias'], estado: 'ativa' },
      { id: 'bracos-pulsos', nome: 'Braços e pulsos', categoria: 'acessorio', subcats: ['pulseiras'], estado: 'ativa' }, // 1404 (#154)
      { id: 'maos-dedos', nome: 'Mãos e dedos', categoria: 'acessorio', subcats: ['luvas-aneis'], estado: 'ativa' }, // 1404 (#154)
      { id: 'cintura', nome: 'Cintura e quadril', categoria: 'acessorio', subcats: ['cintos'], estado: 'ativa' }, // 1404 (#154)
      { id: 'pernas-torn', nome: 'Pernas e tornozelos', categoria: 'acessorio', subcats: ['tornozeleiras'], estado: 'ativa' }, // 1404 (#154)
    ],
  },
  {
    // §5.5: zero assets hoje — a mãe inteira nasce Em breve (§7: selo,
    // sem expansão; infra pronta para a arte chegar)
    id: 'equipamentos', nome: 'Equipamentos', estado: 'em_breve',
    principais: [],
  },
  {
    id: 'costas', nome: 'Costas e Mobilidade', estado: 'ativa',
    principais: [
      { id: 'capas', nome: 'Capas', categoria: 'acessorio', subcats: ['capas'], estado: 'ativa' },
      { id: 'propulsores', nome: 'Propulsores', categoria: 'acessorio', subcats: ['mochilas'], estado: 'ativa' },
      { id: 'mochilas-bolsas', nome: 'Mochilas e bolsas', categoria: 'acessorio', subcats: ['bolsas'], estado: 'ativa' }, // 1403 (#153): arte real
      { id: 'asas', nome: 'Asas', categoria: 'acessorio', subcats: ['asas'], estado: 'ativa' }, // 1381
    ],
  },
  {
    id: 'companheiros', nome: 'Companheiros', estado: 'ativa',
    principais: [
      { id: 'drones', nome: 'Drones', categoria: 'acessorio', subcats: ['companheiros'], estado: 'ativa' },
      { id: 'pets', nome: 'Pets', categoria: 'acessorio', subcats: ['pets'], estado: 'ativa' }, // 1381
      { id: 'robos', nome: 'Robôs', categoria: 'acessorio', subcats: ['robos'], estado: 'ativa' }, // 1403 (#153): arte real
      { id: 'espiritos', nome: 'Espíritos', categoria: 'acessorio', subcats: ['espiritos'], estado: 'ativa' }, // 1403 (#153): arte real
    ],
  },
  {
    id: 'especiais', nome: 'Elementos Especiais', estado: 'ativa',
    principais: [
      { id: 'aureolas', nome: 'Auréolas', categoria: 'acessorio', subcats: ['aureolas'], estado: 'ativa' },
      { id: 'efeitos', nome: 'Efeitos', categoria: 'efeito', estado: 'ativa' },
      // rótulo "Aura" preservado (conceito consagrado na UI/testes); o
      // briefing agrupa como energia corporal — é a MESMA coisa aqui
      { id: 'energia', nome: 'Aura', categoria: 'aura', chipsTema: true, estado: 'ativa' },
      // 1403 (#153): runas viram ACESSÓRIO flutuante (arte própria orbitando o
      // personagem, como auréolas) — a principal nunca ativou como efeito, então
      // a mudança é navegação pura (contrato §1 da taxonomia intocado)
      { id: 'runas', nome: 'Runas e círculos', categoria: 'acessorio', subcats: ['runas'], estado: 'ativa' },
    ],
  },
  {
    // P6 do mega programa: emotes/personalidades/posturas/idles vivem
    // no palco/paleta (studio) e ainda não são destino de grade — a mãe
    // nasce Em breve (§16: selo honesto) e ganha principais quando a
    // arquitetura de animação (contrato próprio, §8 do briefing mestre)
    // virar navegável
    id: 'expressao', nome: 'Expressão e Movimento', estado: 'em_breve',
    principais: [],
  },
  {
    id: 'ambiente', nome: 'Ambiente e Cenário', estado: 'ativa',
    principais: [
      { id: 'fundo', nome: 'Fundo', categoria: 'fundo', chipsTema: true, estado: 'ativa' },
    ],
  },
  {
    id: 'identidade', nome: 'Identidade Visual', estado: 'ativa',
    principais: [
      { id: 'moldura', nome: 'Moldura', categoria: 'moldura', chipsTema: true, estado: 'ativa' },
      { id: 'banner', nome: 'Banner', categoria: 'banner', chipsTema: true, estado: 'ativa' },
      { id: 'emblema', nome: 'Emblema', categoria: 'emblema', chipsTema: true, estado: 'ativa' },
    ],
  },
];

/** §5.11 — ferramentas do shell NOVO; cada id mapeia um handler que JÁ
 *  existe no ShellStudio (nada é inventado; Coleções/Conquistas/Criar
 *  com IA vivem no Modo clássico e seguem lá, preservadas). */
export const FERRAMENTAS_NAV: FerramentaNav[] = [
  { id: 'estudio3d', nome: 'Estúdio 3D' },
  { id: 'presets', nome: 'Presets' },
  { id: 'historico', nome: 'Histórico' },
  { id: 'missoes', nome: 'Missões' },
  { id: 'evolucao', nome: 'Evolução' },
  // GOLDEN V4.3 §5-10 (#66): as ferramentas que só existiam no Modo clássico
  // agora têm DESTINO no shell único (FerramentasClassicas reusa components/*).
  // Só aparecem com as6.single_2d ON — produção (flag OFF) intocada.
  { id: 'arquetipos', nome: 'Arquétipos', single2d: true },
  { id: 'titulos', nome: 'Títulos', single2d: true },
  { id: 'presets_prontos', nome: 'Presets prontos', single2d: true },
  { id: 'colecoes', nome: 'Coleções', single2d: true },
  { id: 'conquistas', nome: 'Conquistas', single2d: true },
  { id: 'ia', nome: 'Criar com IA', single2d: true },
  { id: 'vitrine', nome: 'Vitrine', single2d: true },
  { id: 'foto', nome: 'Foto', single2d: true },
  { id: 'historico_srv', nome: 'Histórico', single2d: true },
];

const POR_ID = new Map<string, { mae: CategoriaMae; principal: CategoriaPrincipal }>();
for (const mae of TAXONOMIA) for (const p of mae.principais) POR_ID.set(p.id, { mae, principal: p });

export function principalPorId(id: string): { mae: CategoriaMae; principal: CategoriaPrincipal } | undefined {
  return POR_ID.get(id);
}

/** principal "casa" da categoria técnica (fallback p/ estado inicial) */
/** P3/CMS (onda 1381, #148): hidratação OPCIONAL do banco — o CMS pode
 *  renomear/reordenar/ocultar nós por id (slug), mas NUNCA muda a
 *  categoria técnica nem os subcats (contrato de camadas intocado).
 *  Falha/204/flag off = registry estático byte a byte. */
export async function hidratarDoCms(): Promise<CategoriaMae[] | null> {
  try {
    const r = await fetch('/api/avatar/taxonomia.php', { credentials: 'same-origin' });
    if (r.status !== 200) return null;
    const bruto = await r.json() as { v?: number; taxonomia?: Array<{ id: string; nome: string; estado: string; principais: Array<{ id: string; nome: string; estado: string }> }> };
    if (bruto?.v !== 1 || !Array.isArray(bruto.taxonomia)) return null;
    const porId = new Map(bruto.taxonomia.map((m) => [m.id, m]));
    const valido = (e: string): EstadoTax => (e === 'ativa' || e === 'em_breve' || e === 'oculta' ? e : 'ativa');
    return TAXONOMIA.map((mae) => {
      const cms = porId.get(mae.id);
      if (!cms) return mae;
      const pCms = new Map(cms.principais.map((p) => [p.id, p]));
      return {
        ...mae,
        nome: cms.nome || mae.nome,
        estado: valido(cms.estado),
        principais: mae.principais.map((p) => {
          const c = pCms.get(p.id);
          return c ? { ...p, nome: c.nome || p.nome, estado: valido(c.estado) } : p;
        }),
      };
    });
  } catch { return null; }
}

/** Caminho legível "Mãe › Principal[ › Sub]" (breadcrumb §16 / busca §17) */
export function caminhoDaPrincipal(id: string, sub?: string): string {
  const alvo = POR_ID.get(id);
  if (!alvo) return '';
  const base = `${alvo.mae.nome} › ${alvo.principal.nome}`;
  return sub ? `${base} › ${sub}` : base;
}

export function principalDaCategoria(categoria: CategoriaId): CategoriaPrincipal | undefined {
  for (const mae of TAXONOMIA) {
    const p = mae.principais.find((x) => x.categoria === categoria && x.estado === 'ativa');
    if (p) return p;
  }
  return undefined;
}
