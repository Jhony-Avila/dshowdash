// vc/grupos.ts — mapa de apresentação: taxonomia técnica -> grupos visuais (<=8),
// subcategorias, enquadramento (viewBox real do svgItemIsolado) e hotspot no palco.
// NÃO altera IDs técnicos. "Companheiros" é dinâmico (só aparece com itens reais).
import { User, Scissors, Smile, Shirt, Glasses, PawPrint, Image as ImageIcon, Sparkles } from 'lucide-react';
import type { CategoriaId } from '../domain/types';

export interface SubCat { id: string; nome: string; cat: CategoriaId; foco?: string; }
export interface Hotspot { top: string; left: string; width: string; height: string; }
export interface GrupoVisual {
  id: string; nome: string; Icone: typeof User;
  cats: CategoriaId[];
  subs?: SubCat[];
  foco?: string;         // viewBox de enquadramento (busto 240x240) — real do motor
  corpo?: boolean;       // usa render de corpo inteiro (240x400)
  hot?: Hotspot;         // região clicável no palco (%)
  slotsIn?: string[];    // só itens com estes slots (acessório)
  slotsOut?: string[];   // exclui itens com estes slots
  dinamico?: boolean;    // só entra no trilho se tiver itens reais
}

// Cobertura hotspot×grupo (§ ver doc): 6 hotspots físicos + 2 grupos só-trilho.
//  base     -> SEM hotspot (a face é de Rosto e o corpo de Roupa; evita ambiguidade) -> trilho
//  cabelo   -> topo da cabeça
//  rosto    -> região facial (olhos/boca/sobrancelha/nariz)
//  roupa    -> tronco/corpo inteiro
//  acessorios-> lateral do corpo (exclui companheiro/flutuante)
//  companheiros-> lateral inferior direita (dinâmico; some sem itens)
//  cenario  -> fundo do palco (z-index atrás; nunca intercepta)
//  estilo   -> SEM hotspot (efeito/aura/moldura/emblema/banner não têm região física) -> trilho
export const GRUPOS: GrupoVisual[] = [
  { id: 'base', nome: 'Base', Icone: User, cats: ['base'], foco: '0 0 240 240' },
  { id: 'cabelo', nome: 'Cabelo', Icone: Scissors, cats: ['cabelo', 'barba'], foco: '46 6 148 130',
    subs: [ { id: 'cabelo', nome: 'Cabelo', cat: 'cabelo', foco: '46 6 148 120' },
            { id: 'barba', nome: 'Barba', cat: 'barba', foco: '60 100 120 108' } ],
    hot: { top: '3%', left: '27%', width: '46%', height: '20%' } },
  { id: 'rosto', nome: 'Rosto', Icone: Smile, cats: ['olhos', 'boca', 'sobrancelha', 'nariz'], foco: '58 46 124 120',
    subs: [ { id: 'olhos', nome: 'Olhos', cat: 'olhos', foco: '64 56 112 74' },
            { id: 'boca', nome: 'Boca', cat: 'boca', foco: '70 96 100 78' },
            { id: 'sobrancelha', nome: 'Sobrancelha', cat: 'sobrancelha', foco: '60 50 120 60' },
            { id: 'nariz', nome: 'Nariz', cat: 'nariz', foco: '78 72 84 74' } ],
    hot: { top: '25%', left: '31%', width: '38%', height: '26%' } },
  { id: 'roupa', nome: 'Roupa', Icone: Shirt, cats: ['roupa', 'roupa_inferior', 'roupa_sobre'], corpo: true, foco: '18 150 204 250',
    subs: [ { id: 'roupa', nome: 'Superior', cat: 'roupa' }, { id: 'roupa_inferior', nome: 'Inferior', cat: 'roupa_inferior' }, { id: 'roupa_sobre', nome: 'Sobrepeça', cat: 'roupa_sobre' } ],
    hot: { top: '58%', left: '20%', width: '60%', height: '40%' } },
  { id: 'acessorios', nome: 'Acessórios', Icone: Glasses, cats: ['acessorio'], foco: '0 0 240 240',
    slotsOut: ['companheiro', 'flutuante'],
    hot: { top: '46%', left: '6%', width: '22%', height: '24%' } },
  { id: 'companheiros', nome: 'Companheiros', Icone: PawPrint, cats: ['acessorio'], foco: '0 0 240 240',
    slotsIn: ['companheiro', 'flutuante'], dinamico: true,
    hot: { top: '56%', left: '76%', width: '22%', height: '34%' } },
  { id: 'cenario', nome: 'Cenário', Icone: ImageIcon, cats: ['fundo'], foco: '0 0 240 240',
    hot: { top: '2%', left: '2%', width: '96%', height: '96%' } },
  { id: 'estilo', nome: 'Estilo', Icone: Sparkles, cats: ['efeito', 'aura', 'moldura', 'emblema', 'banner'], foco: '0 0 240 240',
    subs: [ { id: 'efeito', nome: 'Efeito', cat: 'efeito' }, { id: 'aura', nome: 'Aura', cat: 'aura' },
            { id: 'moldura', nome: 'Moldura', cat: 'moldura' }, { id: 'emblema', nome: 'Emblema', cat: 'emblema' }, { id: 'banner', nome: 'Banner', cat: 'banner' } ] },
];

export function grupoPorId(id: string, lista: GrupoVisual[] = GRUPOS): GrupoVisual { return lista.find((g) => g.id === id) ?? lista[0]; }
