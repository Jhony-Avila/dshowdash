// vc/grupos.ts — mapa de apresentação: taxonomia técnica -> categorias humanas (§3),
// subcategorias, enquadramento (viewBox real do svgItemIsolado) e hotspots no palco.
// NÃO altera IDs técnicos nem o motor. VC-H (Briefing 1 §2/§3/§18):
//   - trilho curto de 6 (Base·Cabelo·Rosto·Roupa·Acessórios·Mais); Cenário/Estilo em `overflow`.
//   - Barba migra Cabelo→Rosto; Calçados vira sub de Roupa (acessorio/slot 'pes'); Acessórios
//     subdividido por slot com coverage ('Outros' derivado em runtime — nada some).
//   - subs faciais e Calçados têm hotspot PRÓPRIO (clique direto olhos/boca/nariz/sobrancelha/
//     barba/pés). Nenhuma caixa técnica visível; realce só em hover/foco/seleção.
import { User, Scissors, Smile, Shirt, Glasses, Image as ImageIcon, Sparkles, MoreHorizontal } from 'lucide-react';
import type { CategoriaId } from '../domain/types';

export interface Hotspot { top: string; left: string; width: string; height: string; }
export interface SubCat {
  id: string; nome: string; cat: CategoriaId; foco?: string;
  hot?: Hotspot;        // região clicável PRÓPRIA no palco (clique direto na sub)
  slots?: string[];     // filtra itens por slot (acessórios / calçados)
  corpo?: boolean;      // usa render de CORPO INTEIRO; hotspot só aparece no modo corpo
  outros?: boolean;     // sub catch-all (Acessórios): itens de slot não coberto pelas demais
}
export interface GrupoVisual {
  id: string; nome: string; Icone: typeof User;
  cats: CategoriaId[];
  subs?: SubCat[];
  foco?: string;         // viewBox de enquadramento (busto 240x240) — real do motor
  corpo?: boolean;       // usa render de corpo inteiro (240x400)
  hot?: Hotspot;         // região clicável no palco (%)
  slotsIn?: string[];    // só itens com estes slots
  slotsOut?: string[];   // exclui itens com estes slots
  dinamico?: boolean;    // só entra no trilho se tiver itens reais
  overflow?: boolean;    // NÃO aparece no trilho principal; acessível via "Mais"
  subsDerivadas?: 'acessorio'; // 'Outros' (coverage) computado em runtime
}

// Slots de acessório expostos EM OUTRA categoria (não repetir em Acessórios):
//  'pes' vive em Roupa → Calçados.
export const SLOTS_ACESS_ALHURES: string[] = ['pes'];

// Cobertura de hotspots (§2): cabelo, rosto(+olhos/sobrancelha/nariz/boca/barba), roupa,
// acessórios (lateral), calçados (pés, modo corpo), cenário (fundo). Base/Estilo só-trilho.
export const GRUPOS: GrupoVisual[] = [
  { id: 'base', nome: 'Personagem', Icone: User, cats: ['base'], foco: '0 0 240 240' },

  { id: 'cabelo', nome: 'Cabelo', Icone: Scissors, cats: ['cabelo'], foco: '46 6 148 130',
    hot: { top: '3%', left: '27%', width: '46%', height: '20%' } },

  { id: 'rosto', nome: 'Rosto', Icone: Smile, cats: ['olhos', 'boca', 'sobrancelha', 'nariz', 'barba'], foco: '58 46 124 120',
    subs: [
      { id: 'olhos', nome: 'Olhos', cat: 'olhos', foco: '64 56 112 74', hot: { top: '32%', left: '34%', width: '32%', height: '8%' } },
      { id: 'sobrancelha', nome: 'Sobrancelhas', cat: 'sobrancelha', foco: '60 50 120 60', hot: { top: '27%', left: '35%', width: '30%', height: '6%' } },
      { id: 'nariz', nome: 'Nariz', cat: 'nariz', foco: '78 72 84 74', hot: { top: '40%', left: '44%', width: '12%', height: '7%' } },
      { id: 'boca', nome: 'Boca', cat: 'boca', foco: '70 96 100 78', hot: { top: '47%', left: '39%', width: '22%', height: '6%' } },
      { id: 'barba', nome: 'Barba', cat: 'barba', foco: '60 100 120 108', hot: { top: '52%', left: '37%', width: '26%', height: '9%' } },
    ],
    hot: { top: '25%', left: '31%', width: '38%', height: '26%' } },

  { id: 'roupa', nome: 'Roupa', Icone: Shirt, cats: ['roupa', 'roupa_inferior', 'roupa_sobre'], corpo: true, foco: '18 150 204 250',
    subs: [
      { id: 'roupa', nome: 'Superior', cat: 'roupa', corpo: true, foco: '18 40 204 250' },
      { id: 'roupa_inferior', nome: 'Inferior', cat: 'roupa_inferior', corpo: true, foco: '30 230 180 170' },
      { id: 'roupa_sobre', nome: 'Sobrepeça', cat: 'roupa_sobre', corpo: true, foco: '18 60 204 260' },
      { id: 'calcados', nome: 'Calçados', cat: 'acessorio', slots: ['pes'], corpo: true, foco: '40 315 160 85',
        hot: { top: '86%', left: '34%', width: '32%', height: '12%' } },
    ],
    hot: { top: '58%', left: '20%', width: '60%', height: '26%' } },

  { id: 'acessorios', nome: 'Acessórios', Icone: Glasses, cats: ['acessorio'], foco: '0 0 240 240',
    subsDerivadas: 'acessorio',
    subs: [
      { id: 'a_cabeca', nome: 'Cabeça', cat: 'acessorio', slots: ['cabeca'] },
      { id: 'a_rosto', nome: 'Rosto', cat: 'acessorio', slots: ['rosto'] },
      { id: 'a_orelha', nome: 'Orelhas', cat: 'acessorio', slots: ['orelha'] },
      { id: 'a_pescoco', nome: 'Pescoço', cat: 'acessorio', slots: ['pescoco'] },
      { id: 'a_maos', nome: 'Mãos', cat: 'acessorio', slots: ['mao_e', 'mao_d', 'pulso_e', 'pulso_d'] },
      { id: 'a_costas', nome: 'Costas', cat: 'acessorio', slots: ['costas'] },
      { id: 'a_companheiro', nome: 'Companheiro', cat: 'acessorio', slots: ['companheiro', 'flutuante'] },
    ],
    hot: { top: '46%', left: '6%', width: '22%', height: '24%' } },

  { id: 'cenario', nome: 'Cenário', Icone: ImageIcon, cats: ['fundo'], foco: '0 0 240 240',
    hot: { top: '2%', left: '2%', width: '96%', height: '96%' } },

  { id: 'estilo', nome: 'Estilo', Icone: Sparkles, cats: ['efeito', 'aura', 'moldura', 'emblema', 'banner'], foco: '0 0 240 240', overflow: true,
    subs: [ { id: 'efeito', nome: 'Efeito', cat: 'efeito' }, { id: 'aura', nome: 'Aura', cat: 'aura' },
            { id: 'moldura', nome: 'Moldura', cat: 'moldura' }, { id: 'emblema', nome: 'Emblema', cat: 'emblema' }, { id: 'banner', nome: 'Banner', cat: 'banner' } ] },
];

// Ícone do botão "Mais" do trilho (overflow de categorias de baixa frequência).
export const IconeMais = MoreHorizontal;

export function grupoPorId(id: string, lista: GrupoVisual[] = GRUPOS): GrupoVisual { return lista.find((g) => g.id === id) ?? lista[0]; }

// Slots já cobertos pelas subs estáticas de um grupo (para o catch-all "Outros").
export function slotsCobertos(g: GrupoVisual): Set<string> {
  const s = new Set<string>(SLOTS_ACESS_ALHURES);
  for (const sub of g.subs ?? []) for (const sl of sub.slots ?? []) s.add(sl);
  return s;
}
