// vc/grupos.ts — mapa de apresentação: taxonomia técnica -> 8 grupos visuais,
// subcategorias, enquadramento (viewBox do AvatarSvg) e hotspot no palco.
// NÃO altera IDs técnicos (só apresentação).
import { User, Scissors, Smile, Shirt, Glasses, Image as ImageIcon, Sparkles } from 'lucide-react';
import type { CategoriaId } from '../domain/types';

export interface SubCat { id: string; nome: string; cat: CategoriaId; }
export interface Hotspot { top: string; left: string; width: string; height: string; }
export interface GrupoVisual {
  id: string;
  nome: string;
  Icone: typeof User;
  cats: CategoriaId[];
  subs?: SubCat[];
  /** viewBox de enquadramento (busto 240x240) — omitido = quadro cheio */
  foco?: string;
  /** usa render de corpo inteiro (240x400) */
  corpo?: boolean;
  /** região clicável no palco (%). Ausente = sem hotspot (só pelo trilho). */
  hot?: Hotspot;
}

export const GRUPOS: GrupoVisual[] = [
  { id: 'base', nome: 'Base', Icone: User, cats: ['base'], foco: '0 0 240 240' },
  { id: 'cabelo', nome: 'Cabelo', Icone: Scissors, cats: ['cabelo', 'barba'], foco: '36 4 168 132',
    subs: [ { id: 'cabelo', nome: 'Cabelo', cat: 'cabelo' }, { id: 'barba', nome: 'Barba', cat: 'barba' } ],
    hot: { top: '2%', left: '20%', width: '60%', height: '22%' } },
  { id: 'rosto', nome: 'Rosto', Icone: Smile, cats: ['olhos', 'boca', 'sobrancelha', 'nariz'], foco: '52 44 136 128',
    subs: [ { id: 'olhos', nome: 'Olhos', cat: 'olhos' }, { id: 'boca', nome: 'Boca', cat: 'boca' },
            { id: 'sobrancelha', nome: 'Sobrancelha', cat: 'sobrancelha' }, { id: 'nariz', nome: 'Nariz', cat: 'nariz' } ],
    hot: { top: '26%', left: '28%', width: '44%', height: '30%' } },
  { id: 'roupa', nome: 'Roupa', Icone: Shirt, cats: ['roupa', 'roupa_inferior', 'roupa_sobre'], corpo: true, foco: '0 150 240 250',
    subs: [ { id: 'roupa', nome: 'Superior', cat: 'roupa' }, { id: 'roupa_inferior', nome: 'Inferior', cat: 'roupa_inferior' }, { id: 'roupa_sobre', nome: 'Sobrepeça', cat: 'roupa_sobre' } ],
    hot: { top: '60%', left: '16%', width: '68%', height: '38%' } },
  { id: 'acessorios', nome: 'Acessórios', Icone: Glasses, cats: ['acessorio'], foco: '0 0 240 240',
    hot: { top: '40%', left: '2%', width: '22%', height: '30%' } },
  { id: 'cenario', nome: 'Cenário', Icone: ImageIcon, cats: ['fundo'], foco: '0 0 240 240',
    hot: { top: '2%', left: '2%', width: '96%', height: '96%' } },
  { id: 'estilo', nome: 'Estilo', Icone: Sparkles, cats: ['efeito', 'aura', 'moldura', 'emblema', 'banner'], foco: '0 0 240 240',
    subs: [ { id: 'efeito', nome: 'Efeito', cat: 'efeito' }, { id: 'aura', nome: 'Aura', cat: 'aura' },
            { id: 'moldura', nome: 'Moldura', cat: 'moldura' }, { id: 'emblema', nome: 'Emblema', cat: 'emblema' }, { id: 'banner', nome: 'Banner', cat: 'banner' } ] },
];

export function grupoPorId(id: string): GrupoVisual { return GRUPOS.find((g) => g.id === id) ?? GRUPOS[0]; }
