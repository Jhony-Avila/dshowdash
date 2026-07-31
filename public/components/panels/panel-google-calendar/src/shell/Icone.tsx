// shell/Icone.tsx — família única de ícones (§71).
// @version 1.0.0  @created 2026-07-29
//
// Lucide, como pede o §71. Importa NOMEADO (não `import * as lucide`) para o
// Rollup conseguir descartar os ~1.500 ícones que não usamos — o pacote inteiro
// passa de 1 MB, e este painel carrega dentro do app-shell.
//
// Sem emoji como ícone principal (§71).
import {
  CalendarDays, CalendarCheck, Users, Video, Clock3, TriangleAlert, Focus,
  Plane, MapPin, Building2, MailQuestion, RefreshCw, BellRing, Settings,
  Layers, List, BarChart3, UserCog, ChevronLeft, ChevronRight, Plus, Search,
  X, Check, Link2, Trash2, Pencil, ExternalLink, CircleAlert, Info, Filter,
  ChevronDown, Copy, CalendarPlus, Star, EyeOff, Globe, Briefcase, FileText, Sheet, type LucideIcon,
} from 'lucide-react';

const MAPA: Record<string, LucideIcon> = {
  'calendar-days': CalendarDays,
  'calendar-check': CalendarCheck,
  'calendar-plus': CalendarPlus,
  users: Users,
  video: Video,
  clock: Clock3,
  'triangle-alert': TriangleAlert,
  focus: Focus,
  plane: Plane,
  'map-pin': MapPin,
  building: Building2,
  'mail-question': MailQuestion,
  refresh: RefreshCw,
  'bell-ring': BellRing,
  settings: Settings,
  layers: Layers,
  list: List,
  'bar-chart': BarChart3,
  'user-cog': UserCog,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  plus: Plus,
  search: Search,
  x: X,
  check: Check,
  link: Link2,
  trash: Trash2,
  pencil: Pencil,
  'external-link': ExternalLink,
  // Planilha: usado no botão de XLSX, distinto do 'external-link' do CSV.
  sheet: Sheet,
  alerta: CircleAlert,
  info: Info,
  filter: Filter,
  copy: Copy,
  star: Star,
  'eye-off': EyeOff,
  globe: Globe,
  briefcase: Briefcase,
  'file-text': FileText,
};

export function Icone({ nome, tamanho = 16, className }: {
  nome: string; tamanho?: number; className?: string;
}) {
  const C = MAPA[nome] ?? Info;
  return <C size={tamanho} strokeWidth={1.75} className={className} aria-hidden="true" focusable="false" />;
}
