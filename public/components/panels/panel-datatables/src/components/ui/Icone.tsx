// components/ui/Icone.tsx — ponte unica para o Lucide.
// @version 1.0.0  @created 2026-07-20
// Import nomeado dinamico manteria o tree-shaking, mas complicaria o uso.
// Aqui importamos o conjunto que o painel realmente usa — explicito e enxuto.
import {
  LayoutDashboard, Network, TableProperties, Gauge, Unplug, Settings,
  Server, Database, PlugZap, Columns3, GitBranch, ShieldAlert, Search,
  BellRing, Wrench, KeyRound, Activity, Clock, CircleCheck, CircleX,
  CircleHelp, RefreshCw, ChevronRight, TriangleAlert, Layers, FileWarning,
  MapPin, HardDrive, Globe, FileText, Check, X, Boxes, Cable, Radio, Tag,
  SlidersHorizontal, Webhook, CalendarClock, Hash, AtSign, Filter, SearchX,
  BellOff, Eye, Send, TrendingUp, TrendingDown, Minus, Sparkles, ServerCog,
  DatabaseZap, ListChecks, ArrowUpRight, Dot, Rows2, Rows3, Menu,
  ChevronUp, ChevronDown, Download,
  // Descoberta (§11/§12) + camadas 5-9 (§7.5–§7.9).
  FileSearch, Lock, Cog, Archive, Ban, EyeOff, Radar, Loader, FileCog,
  BookMarked, Compass, Info, Lightbulb, CircleDashed, FileCode2, Container, ScrollText,
  Fingerprint,
  // Drawer de Alertas (§28): timeline + alvo.
  Timer, Crosshair, History,
  // Comparação de esquemas (schema drift).
  ArrowLeftRight, GitCompare, Equal, ArrowLeft, ArrowRight, Shuffle,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType, JSX } from 'react';

const MAPA: Record<string, ComponentType<LucideProps>> = {
  LayoutDashboard, Network, TableProperties, Gauge, Unplug, Settings,
  Server, Database, PlugZap, Columns3, GitBranch, ShieldAlert, Search,
  BellRing, Wrench, KeyRound, Activity, Clock, CircleCheck, CircleX,
  CircleHelp, RefreshCw, ChevronRight, TriangleAlert, Layers, FileWarning,
  MapPin, HardDrive, Globe, FileText, Check, X, Boxes, Cable, Radio, Tag,
  SlidersHorizontal, Webhook, CalendarClock, Hash, AtSign, Filter, SearchX,
  BellOff, Eye, Send, TrendingUp, TrendingDown, Minus, Sparkles, ServerCog,
  DatabaseZap, ListChecks, ArrowUpRight, Dot, Rows2, Rows3, Menu,
  ChevronUp, ChevronDown, Download,
  FileSearch, Lock, Cog, Archive, Ban, EyeOff, Radar, Loader, FileCog,
  BookMarked, Compass, Info, Lightbulb, CircleDashed, FileCode2, Container, ScrollText,
  Fingerprint,
  Timer, Crosshair, History,
  ArrowLeftRight, GitCompare, Equal, ArrowLeft, ArrowRight, Shuffle,
};

interface Props extends LucideProps {
  nome: string;
  /** Ícone decorativo não deve ser anunciado por leitor de tela (§35). */
  decorativo?: boolean;
  titulo?: string;
}

export function Icone({ nome, decorativo = true, titulo, size = 16, ...resto }: Props): JSX.Element | null {
  const C = MAPA[nome];
  if (!C) return null;
  return (
    <C
      size={size}
      aria-hidden={decorativo ? true : undefined}
      role={decorativo ? undefined : 'img'}
      aria-label={decorativo ? undefined : (titulo ?? nome)}
      {...resto}
    />
  );
}
