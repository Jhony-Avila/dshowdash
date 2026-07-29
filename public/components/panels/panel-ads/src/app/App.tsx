// app/App.tsx — raiz do painel Ads Intelligence.
// @version 1.0.0  @created 2026-07-21
//
// Shell: topbar (seletor de contas §6 + período §8 + selo mock) + nav lateral
// (21 áreas do §5.1) + main com roteamento por hash (#/panel-ads/<area>).
// As áreas não construídas nesta rodada mostram um placeholder "em breve" (§30.3).
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  BadgeCheck, Bell, Bot, ChartNoAxesCombined, CircleDollarSign, Clock, FileText,
  Funnel, History, Image, KeyRound, LayoutDashboard, Layers, Map, Megaphone,
  PanelLeftClose, PanelLeftOpen, Search, Settings, Smartphone, Star, Target,
  UserRound, Users,
} from 'lucide-react';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { queryClient, apiGet, chaves } from '../lib/api';
import type { ShellConfig, AdsStatus, AdsAccount, Period, DrillFiltro } from '../shell/types';
import { corDeterministica, moeda0 } from '../lib/format';
import { EmptyState } from '../components/ui';
import { VisaoGeral } from '../screens/VisaoGeral';
import { Diretoria } from '../screens/Diretoria';
import { Campanhas } from '../screens/Campanhas';
import { Grupos } from '../screens/Grupos';
import { Anuncios } from '../screens/Anuncios';
import { PalavrasChave } from '../screens/PalavrasChave';
import { Termos } from '../screens/Termos';
import { Recomendacoes } from '../screens/Recomendacoes';
import { Contas } from '../screens/Contas';
import { Configuracoes } from '../screens/Configuracoes';
import { Dispositivos } from '../screens/Dispositivos';
import { Localizacoes } from '../screens/Localizacoes';
import { Horarios } from '../screens/Horarios';
import { Conversoes } from '../screens/Conversoes';
import { Publicos } from '../screens/Publicos';
import { LandingPages } from '../screens/LandingPages';
import { Orcamentos } from '../screens/Orcamentos';
import { Qualidade } from '../screens/Qualidade';
import { Funil } from '../screens/Funil';
import { Alertas } from '../screens/Alertas';
import { Relatorios } from '../screens/Relatorios';
import { Historico } from '../screens/Historico';
import '../styles/tokens.css';

const HASH_BASE = '#/panel-ads';

// Ícones SVG padronizados (Lucide) no lugar de emojis — briefing UX §15.
interface Area { id: string; label: string; icon: ReactNode; group: string; impl: boolean; }
const AREAS: Area[] = [
  { id: 'visao-geral', label: 'Visão Geral', icon: <LayoutDashboard size={16} />, group: 'Visão', impl: true },
  { id: 'diretoria', label: 'Diretoria', icon: <Target size={16} />, group: 'Visão', impl: true },
  { id: 'campanhas', label: 'Campanhas', icon: <Megaphone size={16} />, group: 'Estrutura', impl: true },
  { id: 'grupos', label: 'Grupos de anúncios', icon: <Layers size={16} />, group: 'Estrutura', impl: true },
  { id: 'anuncios', label: 'Anúncios', icon: <Image size={16} />, group: 'Estrutura', impl: true },
  { id: 'palavras', label: 'Palavras-chave', icon: <KeyRound size={16} />, group: 'Estrutura', impl: true },
  { id: 'termos', label: 'Termos de pesquisa', icon: <Search size={16} />, group: 'Estrutura', impl: true },
  { id: 'landing-pages', label: 'Landing Pages', icon: <FileText size={16} />, group: 'Segmentos', impl: true },
  { id: 'conversoes', label: 'Conversões', icon: <BadgeCheck size={16} />, group: 'Segmentos', impl: true },
  { id: 'publicos', label: 'Públicos', icon: <Users size={16} />, group: 'Segmentos', impl: true },
  { id: 'localizacoes', label: 'Localizações', icon: <Map size={16} />, group: 'Segmentos', impl: true },
  { id: 'dispositivos', label: 'Dispositivos', icon: <Smartphone size={16} />, group: 'Segmentos', impl: true },
  { id: 'horarios', label: 'Horários e dias', icon: <Clock size={16} />, group: 'Segmentos', impl: true },
  { id: 'orcamentos', label: 'Orçamentos', icon: <CircleDollarSign size={16} />, group: 'Gestão', impl: true },
  { id: 'qualidade', label: 'Qualidade', icon: <Star size={16} />, group: 'Gestão', impl: true },
  { id: 'funil', label: 'Funil Comercial', icon: <Funnel size={16} />, group: 'Gestão', impl: true },
  { id: 'ia', label: 'Inteligência Artificial', icon: <Bot size={16} />, group: 'Inteligência', impl: true },
  { id: 'alertas', label: 'Alertas', icon: <Bell size={16} />, group: 'Inteligência', impl: true },
  { id: 'relatorios', label: 'Relatórios', icon: <ChartNoAxesCombined size={16} />, group: 'Inteligência', impl: true },
  { id: 'historico', label: 'Histórico', icon: <History size={16} />, group: 'Conta', impl: true },
  { id: 'contas', label: 'Contas', icon: <UserRound size={16} />, group: 'Conta', impl: true },
  { id: 'config', label: 'Configurações', icon: <Settings size={16} />, group: 'Conta', impl: true },
];
const GROUP_ORDER = ['Visão', 'Estrutura', 'Segmentos', 'Gestão', 'Inteligência', 'Conta'];

// Persistência do estado da sidebar (briefing §13): preferência local por navegador.
const NAV_STORAGE_KEY = 'dshow.ads-intelligence.sidebar.collapsed';
function lerNavColapsada(): boolean {
  try { return window.localStorage.getItem(NAV_STORAGE_KEY) === '1'; } catch (e) { return false; }
}
function salvarNavColapsada(v: boolean): void {
  try { window.localStorage.setItem(NAV_STORAGE_KEY, v ? '1' : '0'); } catch (e) { /* sem storage */ }
}

function lerArea(): string {
  const h = window.location.hash || '';
  if (h.startsWith(HASH_BASE)) {
    const resto = h.slice(HASH_BASE.length).replace(/^\/+/, '');
    const seg = resto.split(/[/?]/)[0];
    if (AREAS.some((a) => a.id === seg)) return seg;
  }
  return 'visao-geral';
}

/** Lê o filtro de drill do hash: #/panel-ads/{area}/{tipo}/{valor}. */
function lerDrill(): DrillFiltro | null {
  const h = window.location.hash || '';
  if (!h.startsWith(HASH_BASE)) return null;
  const segs = h.slice(HASH_BASE.length).replace(/^\/+/, '').split('/');
  if (segs.length >= 3 && (segs[1] === 'campanha' || segs[1] === 'grupo') && segs[2]) {
    return { tipo: segs[1], valor: decodeURIComponent(segs[2]) };
  }
  return null;
}

function AccountSelector({ accounts, currentId, onPick }: {
  accounts: AdsAccount[]; currentId: number | null; onPick: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const atual = accounts.find((a) => a.id === currentId) ?? accounts[0];
  if (!atual) return null;
  return (
    <div className="ads-acctsel" ref={ref}>
      <button className="ads-acctsel-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="ads-acctsel-av" style={{ background: corDeterministica(atual.descriptive_name) }}>
          {atual.descriptive_name.slice(0, 1)}
        </span>
        <span className="ads-acctsel-body">
          <span className="ads-acctsel-name">{atual.descriptive_name}</span>
          <span className="ads-acctsel-id">{atual.customer_id}</span>
        </span>
        <span className="ads-acctsel-caret" aria-hidden>▼</span>
      </button>
      {open && (
        <div className="ads-acctsel-menu" role="listbox">
          {accounts.map((a) => (
            <button key={a.id} className={`ads-acctsel-item${a.id === atual.id ? ' is-on' : ''}`}
              onClick={() => { onPick(a.id); setOpen(false); }} role="option" aria-selected={a.id === atual.id}>
              <span className="ads-acctsel-av" style={{ background: corDeterministica(a.descriptive_name) }}>
                {a.descriptive_name.slice(0, 1)}
              </span>
              <span className="ads-acctsel-body">
                <span className="ads-acctsel-name">{a.descriptive_name} {a.is_favorite && '★'}</span>
                <span className="ads-acctsel-item-meta">{a.customer_id} · {a.active_campaigns} camp. · {moeda0(a.cost)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const PERIODOS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Hoje' }, { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' }, { id: '90d', label: '90 dias' },
];

function Shell({ config }: { config: ShellConfig }) {
  void config;
  const [area, setArea] = useState<string>(lerArea());
  const [drill, setDrill] = useState<DrillFiltro | null>(lerDrill());
  const [accountId, setAccountId] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period>('30d');
  const [navMini, setNavMini] = useState<boolean>(lerNavColapsada());

  // Colapso da sidebar (briefing §11–§12 e §16): persiste a preferência e,
  // após a transição de largura (~200ms), notifica visualizações que medem o
  // container (D3) via resize — os ECharts já têm ResizeObserver próprio.
  const alternarNav = () => {
    setNavMini((v) => {
      const novo = !v;
      salvarNavColapsada(novo);
      window.setTimeout(() => window.dispatchEvent(new Event('resize')), 260);
      return novo;
    });
  };

  useEffect(() => {
    const onHash = () => { setArea(lerArea()); setDrill(lerDrill()); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const irPara = (id: string, filtro?: DrillFiltro) => {
    const sufixo = filtro ? `/${filtro.tipo}/${encodeURIComponent(filtro.valor)}` : '';
    window.location.hash = `${HASH_BASE}/${id}${sufixo}`;
    setArea(id); setDrill(filtro ?? null);
  };

  const { data: status, isLoading } = useQuery<AdsStatus>({
    queryKey: chaves.status,
    queryFn: ({ signal }) => apiGet<AdsStatus>('/status', undefined, signal),
    refetchInterval: 60_000,
  });

  const accounts = status?.accounts ?? [];
  const contaAtiva = useMemo(() => {
    if (accountId && accounts.some((a) => a.id === accountId)) return accountId;
    return accounts.find((a) => a.is_default)?.id ?? accounts[0]?.id ?? null;
  }, [accountId, accounts]);

  const gruposNav = GROUP_ORDER.map((g) => ({ group: g, itens: AREAS.filter((a) => a.group === g) }));
  const areaAtual = AREAS.find((a) => a.id === area) ?? AREAS[0];

  const renderScreen = () => {
    if (isLoading && !status) return null;
    if (contaAtiva == null) {
      return <EmptyState icon="🔌" title="Nenhuma conta conectada"
        desc="Conecte uma conta do Google Ads para começar. No modo de testes, uma conta demo é criada automaticamente." />;
    }
    const props = { accountId: contaAtiva, period };
    switch (area) {
      case 'visao-geral': return <VisaoGeral {...props} />;
      case 'diretoria': return <Diretoria {...props} />;
      case 'campanhas': return <Campanhas {...props} onIr={irPara} />;
      case 'grupos': return <Grupos {...props} drill={drill} onIr={irPara} />;
      case 'anuncios': return <Anuncios {...props} drill={drill} />;
      case 'palavras': return <PalavrasChave {...props} />;
      case 'termos': return <Termos {...props} />;
      case 'ia': return <Recomendacoes {...props} />;
      case 'dispositivos': return <Dispositivos {...props} />;
      case 'localizacoes': return <Localizacoes {...props} />;
      case 'horarios': return <Horarios {...props} />;
      case 'conversoes': return <Conversoes {...props} />;
      case 'publicos': return <Publicos {...props} />;
      case 'landing-pages': return <LandingPages {...props} />;
      case 'orcamentos': return <Orcamentos {...props} />;
      case 'qualidade': return <Qualidade {...props} />;
      case 'funil': return <Funil {...props} />;
      case 'alertas': return <Alertas {...props} />;
      case 'relatorios': return <Relatorios {...props} />;
      case 'historico': return <Historico {...props} />;
      case 'contas': return <Contas onIr={irPara} />;
      case 'config': return <Configuracoes status={status} />;
      default:
        return <EmptyState icon={areaAtual.icon} title={areaAtual.label}
          desc="Esta área faz parte do plano do módulo e será construída nas próximas fases (analytics, GA4, operação e integração comercial)."
          soon="Em breve" />;
    }
  };

  return (
    <div className="ads-shell">
      <div className="ads-topbar">
        <span className="ads-brand"><span className="ads-brand-mark" aria-hidden>Ⓐ</span> Ads Intelligence</span>
        {status?.provider === 'mock' && (
          <span className="ads-test-pill" title="Dados fictícios para testes — nenhuma conexão real com o Google Ads.">🧪 Modo de testes</span>
        )}
        <div className="ads-topbar-right">
          {accounts.length > 0 && <AccountSelector accounts={accounts} currentId={contaAtiva} onPick={setAccountId} />}
          <div className="ads-periods" role="tablist" aria-label="Período">
            {PERIODOS.map((p) => (
              <button key={p.id} className={`ads-period${period === p.id ? ' is-on' : ''}`}
                onClick={() => setPeriod(p.id)} role="tab" aria-selected={period === p.id}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="ads-body">
        <nav className={`ads-nav${navMini ? ' is-mini' : ''}`} aria-label="Seções do Ads Intelligence">
          <button className="ads-nav-toggle" onClick={alternarNav}
            aria-label={navMini ? 'Expandir menu' : 'Recolher menu'}
            aria-expanded={!navMini}
            title={navMini ? 'Expandir menu' : 'Recolher menu'}>
            {navMini ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
          {gruposNav.map(({ group, itens }) => (
            <div key={group} className="ads-nav-bloco">
              <div className="ads-nav-grp">{group}</div>
              <div className="ads-nav-sep" aria-hidden />
              {itens.map((a) => (
                <button key={a.id} className={`ads-navitem${area === a.id ? ' is-active' : ''}`}
                  onClick={() => irPara(a.id)} title={a.label} aria-label={a.label}
                  aria-current={area === a.id ? 'page' : undefined}>
                  <span className="ads-navitem-ic" aria-hidden>{a.icon}</span>
                  <span className="ads-navitem-lbl">{a.label}</span>
                  {!a.impl && <span className="ads-navitem-soon">breve</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <main className="ads-main">
          {isLoading && !status ? <div className="ads-skel"><span className="ads-spinner" /> Carregando…</div> : renderScreen()}
        </main>
      </div>
    </div>
  );
}

export function App({ config }: { config: ShellConfig }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Shell config={config} />
    </QueryClientProvider>
  );
}
