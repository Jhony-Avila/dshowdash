// app/App.tsx — raiz do painel Pipedrive Analytics.
// @version 2.1.0  @created 2026-07-21
//
// v1.x: navegação por hash em segmentos (#/panel-pipedrive/<tela>), 16 telas.
// v2.0.0 (Elevação visual §6): sidebar COLAPSÁVEL + AGRUPADA (Análise/Comercial/
//   Cadastros/Administração), ícones Lucide (substituem emojis), rodapé com status/
//   versão, persistência (compacta + grupos abertos) em localStorage.
// v2.2.0 (#30): + tela PERDAS (motivos de perda) no grupo Análise; o drill-down dela
//   leva a Negócios já filtrado por status=lost e motivo.
// v2.3.0 (#31): + tela ORIGEM (origem dos leads) no grupo Análise — 18ª tela. Sem
//   drill-down por enquanto: filtrar o grid por origem exige campo customizado no
//   filtro E na faceta do EntityGrid; meio-caminho mostraria "todos" em silêncio.
// v2.1.0 (Fase 4): navegação passa a carregar FILTRO no hash
//   (#/panel-pipedrive/negocios?status=won) para o drill-down da Visão Geral — o recorte
//   fica compartilhável e o "voltar" do navegador o desfaz.
import { useEffect, useState } from 'react';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, BellRing, Trophy, TrendingUp, GitBranch,
  BriefcaseBusiness, Columns3, Target, CalendarCheck2,
  UsersRound, Building2, Package, NotebookPen,
  UserRoundCog, Activity, Settings2, ChevronsLeft, ChevronsRight, TrendingDown, Waypoints,
  type LucideIcon,
} from 'lucide-react';
import { queryClient, apiGet, chaves } from '../lib/api';
import type { ShellConfig, PipeStatus, PipeHealth } from '../shell/types';
import { fmtData } from '../lib/format';
import { Configuracoes } from '../screens/Configuracoes';
import { VisaoGeral } from '../screens/VisaoGeral';
import { Negocios } from '../screens/Negocios';
import { Pessoas, Organizacoes, Atividades, Leads, Produtos, Notas, Usuarios } from '../screens/EntidadesGrids';
import { Funis } from '../screens/Funis';
import { Kanban } from '../screens/Kanban';
import { Alertas } from '../screens/Alertas';
import { Rankings } from '../screens/Rankings';
import { Previsao } from '../screens/Previsao';
import { SaudeSync } from '../screens/SaudeSync';
import { Perdas } from '../screens/Perdas';
import { OrigemLeads } from '../screens/OrigemLeads';
import '../styles/tokens.css';

const HASH_BASE = '#/panel-pipedrive';
const VERSAO = '2.3.0';

type TelaId = 'geral' | 'alertas' | 'rankings' | 'previsao' | 'perdas' | 'origem' | 'negocios' | 'kanban' | 'pessoas'
  | 'organizacoes' | 'atividades' | 'leads' | 'produtos' | 'notas' | 'funis' | 'usuarios' | 'saude' | 'config';

const TELAS: Record<TelaId, { label: string; Icon: LucideIcon }> = {
  geral:        { label: 'Visão Geral',   Icon: LayoutDashboard },
  alertas:      { label: 'Alertas',       Icon: BellRing },
  rankings:     { label: 'Rankings',      Icon: Trophy },
  previsao:     { label: 'Previsão',      Icon: TrendingUp },
  perdas:       { label: 'Perdas',        Icon: TrendingDown },
  origem:       { label: 'Origem',        Icon: Waypoints },
  funis:        { label: 'Funis',         Icon: GitBranch },
  negocios:     { label: 'Negócios',      Icon: BriefcaseBusiness },
  kanban:       { label: 'Kanban',        Icon: Columns3 },
  leads:        { label: 'Leads',         Icon: Target },
  atividades:   { label: 'Atividades',    Icon: CalendarCheck2 },
  pessoas:      { label: 'Pessoas',       Icon: UsersRound },
  organizacoes: { label: 'Organizações',  Icon: Building2 },
  produtos:     { label: 'Produtos',      Icon: Package },
  notas:        { label: 'Notas',         Icon: NotebookPen },
  usuarios:     { label: 'Usuários',      Icon: UserRoundCog },
  saude:        { label: 'Saúde',         Icon: Activity },
  config:       { label: 'Configurações', Icon: Settings2 },
};

// Agrupamento da navegação (§6.3).
const GRUPOS: { id: string; label: string; itens: TelaId[] }[] = [
  { id: 'analise',   label: 'Análise',        itens: ['geral', 'alertas', 'rankings', 'previsao', 'perdas', 'origem', 'funis'] },
  { id: 'comercial', label: 'Comercial',      itens: ['negocios', 'kanban', 'leads', 'atividades'] },
  { id: 'cadastros', label: 'Cadastros',      itens: ['pessoas', 'organizacoes', 'produtos', 'notas'] },
  { id: 'admin',     label: 'Administração',  itens: ['usuarios', 'saude', 'config'] },
];
const IDS_VALIDOS = Object.keys(TELAS) as string[];

function lerTela(): TelaId {
  const h = window.location.hash || '';
  if (h.startsWith(HASH_BASE)) {
    const resto = h.slice(HASH_BASE.length).replace(/^\/+/, '');
    const seg = resto.split(/[/?]/)[0];
    if (IDS_VALIDOS.includes(seg)) return seg as TelaId;
  }
  return 'geral';
}

// Drill-down (Fase 4): a Visão Geral leva para uma tela JÁ FILTRADA, e o filtro viaja
// no hash (#/panel-pipedrive/negocios?status=won) — assim o estado é compartilhável e
// o botão "voltar" do navegador desfaz o recorte, sem estado escondido em memória.
function lerFiltroHash(): Record<string, string> {
  const h = window.location.hash || '';
  const i = h.indexOf('?');
  if (i < 0) return {};
  const out: Record<string, string> = {};
  new URLSearchParams(h.slice(i + 1)).forEach((v, k) => { if (v) out[k] = v; });
  return out;
}

function corDoStatus(s?: string): string {
  switch (s) {
    case 'connected': return 'var(--pp-ok)';
    case 'testing': return 'var(--pp-sync)';
    case 'invalid':
    case 'expired':
    case 'insufficient_scope':
    case 'error': return 'var(--pp-danger)';
    default: return 'var(--pp-text-dim)';
  }
}

function Shell() {
  const [tela, setTela] = useState<TelaId>(lerTela());
  const [compacta, setCompacta] = useState<boolean>(() => {
    try { return localStorage.getItem('pp:sidebar:compact') === '1'; } catch { return false; }
  });
  const [gruposAbertos, setGruposAbertos] = useState<Record<string, boolean>>(() => {
    try { const s = localStorage.getItem('pp:sidebar:groups'); if (s) return JSON.parse(s); } catch { /* ignora */ }
    return Object.fromEntries(GRUPOS.map((g) => [g.id, true]));
  });

  useEffect(() => { try { localStorage.setItem('pp:sidebar:compact', compacta ? '1' : '0'); } catch { /* ignora */ } }, [compacta]);
  useEffect(() => { try { localStorage.setItem('pp:sidebar:groups', JSON.stringify(gruposAbertos)); } catch { /* ignora */ } }, [gruposAbertos]);

  const [filtroHash, setFiltroHash] = useState<Record<string, string>>(lerFiltroHash);

  useEffect(() => {
    const onHash = () => { setTela(lerTela()); setFiltroHash(lerFiltroHash()); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const irPara = (id: TelaId, filtros?: Record<string, string>) => {
    const qs = filtros ? new URLSearchParams(filtros).toString() : '';
    window.location.hash = `${HASH_BASE}/${id}${qs ? `?${qs}` : ''}`;
    setTela(id);
    setFiltroHash(filtros ?? {});
  };
  const toggleGrupo = (id: string) => setGruposAbertos((s) => ({ ...s, [id]: !s[id] }));

  const { data: status } = useQuery<PipeStatus>({
    queryKey: chaves.status,
    queryFn: ({ signal }) => apiGet<PipeStatus>('/status', undefined, signal),
    refetchInterval: 30_000,
  });

  // Última sincronização para o rodapé da sidebar (compartilha cache com a aba Saúde).
  const { data: health } = useQuery<PipeHealth>({
    queryKey: chaves.health,
    queryFn: ({ signal }) => apiGet<PipeHealth>('/health', undefined, signal),
    enabled: status?.status === 'connected',
    staleTime: 60_000,
  });
  const ultimaSync = health?.runs?.find((r) => r.finished_at)?.finished_at ?? null;

  return (
    <div className="pp-shell">
      <nav className={`pp-nav${compacta ? ' compacta' : ''}`} aria-label="Navegação do Pipedrive Analytics">
        <div className="pp-brand">
          <span className="pp-brand-logo" aria-hidden><BriefcaseBusiness size={20} strokeWidth={2.2} /></span>
          {!compacta && <span className="pp-brand-txt">Pipedrive</span>}
          <button className="pp-nav-toggle" onClick={() => setCompacta((v) => !v)}
            title={compacta ? 'Expandir menu' : 'Recolher menu'} aria-label={compacta ? 'Expandir menu' : 'Recolher menu'}>
            {compacta ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>

        <div className="pp-nav-scroll">
          {GRUPOS.map((g) => {
            const aberto = compacta || gruposAbertos[g.id];
            return (
              <div className="pp-nav-group" key={g.id}>
                {!compacta && (
                  <button className="pp-nav-group-h" onClick={() => toggleGrupo(g.id)} aria-expanded={!!gruposAbertos[g.id]}>
                    {g.label}
                    <span className="chev" style={{ transform: gruposAbertos[g.id] ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▾</span>
                  </button>
                )}
                {aberto && g.itens.map((id) => {
                  const t = TELAS[id];
                  const ativo = tela === id;
                  return (
                    <button key={id} className={`pp-navitem${ativo ? ' is-active' : ''}`} onClick={() => irPara(id)}
                      title={compacta ? t.label : undefined} aria-current={ativo ? 'page' : undefined}>
                      <t.Icon className="pp-navitem-ic" size={18} strokeWidth={ativo ? 2.4 : 2} aria-hidden />
                      {!compacta && <span className="pp-navitem-txt">{t.label}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="pp-nav-footer">
          <div className="pp-conn" title={`Integração: ${status?.status ?? '—'}`}>
            <span className="pp-dot" style={{ background: corDoStatus(status?.status) }} />
            {!compacta && <span>{status?.status === 'connected' ? 'Conectado' : (status?.status ?? 'Desconectado')}</span>}
          </div>
          {!compacta && (
            <div className="pp-nav-meta">
              {ultimaSync ? `Sync ${fmtData(ultimaSync)}` : 'Sem sync'} · v{VERSAO}
            </div>
          )}
        </div>
      </nav>

      <main className="pp-main">
        {tela === 'config' ? <Configuracoes onSaude={() => irPara('saude')} />
          : tela === 'saude' ? <SaudeSync />
          : tela === 'alertas' ? <Alertas status={status} />
          : tela === 'rankings' ? <Rankings status={status} />
          : tela === 'previsao' ? <Previsao status={status} />
          : tela === 'perdas' ? <Perdas status={status} onNegocios={(filtros) => irPara('negocios', filtros)} />
          : tela === 'origem' ? <OrigemLeads status={status} />
          : tela === 'negocios' ? <Negocios status={status} filtrosIniciais={filtroHash} />
          : tela === 'kanban' ? <Kanban status={status} />
          : tela === 'leads' ? <Leads status={status} />
          : tela === 'pessoas' ? <Pessoas status={status} />
          : tela === 'organizacoes' ? <Organizacoes status={status} />
          : tela === 'atividades' ? <Atividades status={status} />
          : tela === 'produtos' ? <Produtos status={status} />
          : tela === 'notas' ? <Notas status={status} />
          : tela === 'funis' ? <Funis status={status} />
          : tela === 'usuarios' ? <Usuarios status={status} />
          : <VisaoGeral status={status} onConfig={() => irPara('config')}
              onNegocios={(filtros) => irPara('negocios', filtros)}
              onFunis={() => irPara('funis')} onAlertas={() => irPara('alertas')} />}
      </main>
    </div>
  );
}

export function App({ config: _config }: { config: ShellConfig }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Shell />
    </QueryClientProvider>
  );
}
