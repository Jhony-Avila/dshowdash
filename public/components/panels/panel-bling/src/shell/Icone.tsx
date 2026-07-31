// panel-bling/src/shell/Icone.tsx — família única de ícones (§58)
// @version 1.0.0  @created 2026-07-30
//
// Lucide, importado nome a nome para o bundler poder descartar o resto da
// biblioteca. Import de barril (`import * as lucide`) traria ~1.500 ícones.
//
// §58 é explícito: nenhum emoji na interface. Todo símbolo aqui é SVG.

import React from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Boxes, Warehouse, ShoppingBag, Factory,
  FileText, Landmark, CircleDollarSign, Receipt, Truck, Users, RefreshCw, Webhook,
  BellRing, ScrollText, Settings, ListChecks, Presentation, Gauge, TrendingUp,
  Store, UserCheck, Percent, GitBranch, FolderTree, Tags, Building2, PackageCheck,
  ClipboardList, FileSpreadsheet, ListFilter, Calculator, Files, Waves, GitCompare,
  FolderKanban, CreditCard, Route, MapPin, PackageOpen, TriangleAlert, Contact,
  Building, History, ChartNoAxesCombined, ChartColumnIncreasing, TrendingUpDown,
  Radar, FileBarChart, Plug, ShieldCheck, Sparkles,
  type LucideIcon,
} from 'lucide-react';

const MAPA: Record<string, LucideIcon> = {
  LayoutDashboard, ShoppingCart, Package, Boxes, Warehouse, ShoppingBag, Factory,
  FileText, Landmark, CircleDollarSign, Receipt, Truck, Users, RefreshCw, Webhook,
  BellRing, ScrollText, Settings, ListChecks, Presentation, Gauge, TrendingUp,
  Store, UserCheck, Percent, GitBranch, FolderTree, Tags, Building2, PackageCheck,
  ClipboardList, FileSpreadsheet, ListFilter, Calculator, Files, Waves, GitCompare,
  FolderKanban, CreditCard, Route, MapPin, PackageOpen, TriangleAlert, Contact,
  Building, History, ChartNoAxesCombined, ChartColumnIncreasing, TrendingUpDown,
  Radar, FileBarChart, Plug, ShieldCheck, Sparkles,
};

export function Icone({ nome, tamanho = 15, cor }: { nome: string; tamanho?: number; cor?: string }) {
  // Ícone desconhecido cai num neutro visível em vez de derrubar a tela.
  const C = MAPA[nome] ?? Package;
  return <C size={tamanho} strokeWidth={1.7} color={cor} aria-hidden />;
}

export function existeIcone(nome: string): boolean {
  return Object.prototype.hasOwnProperty.call(MAPA, nome);
}
