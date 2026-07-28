// app/App.tsx — shell do módulo Meta Ads.
// @version 1.0.0  @created 2026-07-28
//
// Header interno (conta/período/comparação/objetivo — §5) + sub-sidebar
// colapsável com as 23 seções (§4) + roteamento por hash
// (#/panel-metaads/<secao>) + selo persistente de dados simulados +
// drill campanha → conjunto → anúncio mantido no shell.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity, AlertTriangle, BadgeCheck, BarChart3, Bell, Bot, ChartNoAxesCombined,
  Clapperboard, ClipboardList, Filter, FileSpreadsheet, GitBranch, Globe,
  Images, LayoutDashboard, LayoutGrid, Layers, Link2, Megaphone,
  PanelLeftClose, PanelLeftOpen, RefreshCw, Repeat2, Settings, Target,
  Users, Wallet,
} from 'lucide-react';
import { getService } from '../services/MetaAdsService';
import { EmPreparacao } from '../components/ui';
import { useDados } from '../components/useDados';
import type { ComparacaoId, FiltrosGlobais, Objetivo, PeriodoId, SecaoId, ShellConfig } from '../domain/types';
import { VisaoGeral } from '../screens/VisaoGeral';
import { Anuncios, Campanhas, Conjuntos } from '../screens/Estrutura';
import { Criativos, Qualidade } from '../screens/Criativos';
import { Posicionamentos, Publicos } from '../screens/Publicos';
import { Atribuicao, Funil, Leads, Pixel } from '../screens/LeadsPixel';
import { Orcamentos, Performance } from '../screens/Orcamentos';
import { Alertas, Automacoes, Central, Config, Relatorios, Sincronizacao } from '../screens/Sistema';
import '../styles/tokens.css';

const HASH_BASE = '#/panel-metaads';

interface ItemNav { id: SecaoId; rotulo: string; icone: ReactNode; grupo: string; }

const NAV: ItemNav[] = [
  { id: 'visao-geral', rotulo: 'Visão Geral', icone: <LayoutDashboard size={15} />, grupo: 'Visão' },
  { id: 'central', rotulo: 'Central de Trabalho', icone: <ClipboardList size={15} />, grupo: 'Visão' },
  { id: 'campanhas', rotulo: 'Campanhas', icone: <Megaphone size={15} />, grupo: 'Estrutura' },
  { id: 'conjuntos', rotulo: 'Conjuntos', icone: <Layers size={15} />, grupo: 'Estrutura' },
  { id: 'anuncios', rotulo: 'Anúncios', icone: <LayoutGrid size={15} />, grupo: 'Estrutura' },
  { id: 'criativos', rotulo: 'Criativos', icone: <Clapperboard size={15} />, grupo: 'Estrutura' },
  { id: 'publicos', rotulo: 'Públicos', icone: <Users size={15} />, grupo: 'Alcance' },
  { id: 'posicionamentos', rotulo: 'Posicionamentos', icone: <Target size={15} />, grupo: 'Alcance' },
  { id: 'funil', rotulo: 'Funil', icone: <Filter size={15} />, grupo: 'Conversão' },
  { id: 'leads', rotulo: 'Leads', icone: <ChartNoAxesCombined size={15} />, grupo: 'Conversão' },
  { id: 'pixel', rotulo: 'Pixel e Eventos', icone: <Link2 size={15} />, grupo: 'Conversão' },
  { id: 'atribuicao', rotulo: 'Atribuição', icone: <GitBranch size={15} />, grupo: 'Conversão' },
  { id: 'orcamentos', rotulo: 'Orçamentos', icone: <Wallet size={15} />, grupo: 'Investimento' },
  { id: 'performance', rotulo: 'Performance', icone: <Activity size={15} />, grupo: 'Investimento' },
  { id: 'qualidade', rotulo: 'Qualidade e Políticas', icone: <BadgeCheck size={15} />, grupo: 'Investimento' },
  { id: 'catalogos', rotulo: 'Catálogos', icone: <Images size={15} />, grupo: 'Presença' },
  { id: 'remarketing', rotulo: 'Remarketing', icone: <Repeat2 size={15} />, grupo: 'Presença' },
  { id: 'paginas', rotulo: 'Páginas e Perfis', icone: <Globe size={15} />, grupo: 'Presença' },
  { id: 'relatorios', rotulo: 'Relatórios', icone: <FileSpreadsheet size={15} />, grupo: 'Inteligência' },
  { id: 'alertas', rotulo: 'Alertas', icone: <Bell size={15} />, grupo: 'Inteligência' },
  { id: 'automacoes', rotulo: 'Automações', icone: <Bot size={15} />, grupo: 'Sistema' },
  { id: 'sincronizacao', rotulo: 'Sincronização', icone: <RefreshCw size={15} />, grupo: 'Sistema' },
  { id: 'config', rotulo: 'Configurações', icone: <Settings size={15} />, grupo: 'Sistema' },
];

const GRUPOS = ['Visão', 'Estrutura', 'Alcance', 'Conversão', 'Investimento', 'Presença', 'Inteligência', 'Sistema'];

const PERIODOS: { id: PeriodoId; rotulo: string }[] = [
  { id: 'hoje', rotulo: 'Hoje' }, { id: 'ontem', rotulo: 'Ontem' },
  { id: '7d', rotulo: '7 dias' }, { id: '14d', rotulo: '14 dias' },
  { id: '30d', rotulo: '30 dias' }, { id: 'mes_atual', rotulo: 'Mês atual' },
  { id: 'mes_anterior', rotulo: 'Mês anterior' }, { id: 'trimestre', rotulo: 'Trimestre' },
  { id: 'ano', rotulo: 'Ano' }, { id: '12m', rotulo: '12 meses' },
];

const COMPARACOES: { id: ComparacaoId; rotulo: string }[] = [
  { id: 'anterior', rotulo: 'vs período anterior' },
  { id: 'mes_anterior', rotulo: 'vs mês anterior' },
  { id: 'ano_anterior', rotulo: 'vs ano anterior' },
  { id: 'nenhuma', rotulo: 'sem comparação' },
];

const OBJETIVOS: { id: Objetivo | 'todos'; rotulo: string }[] = [
  { id: 'todos', rotulo: 'Todos os objetivos' },
  { id: 'leads', rotulo: 'Leads' },
  { id: 'conversao', rotulo: 'Conversão' },
  { id: 'trafego', rotulo: 'Tráfego' },
  { id: 'engajamento', rotulo: 'Engajamento' },
  { id: 'alcance', rotulo: 'Alcance' },
];

function lerSecao(): SecaoId {
  const h = window.location.hash || '';
  if (h.startsWith(HASH_BASE)) {
    const seg = h.slice(HASH_BASE.length).replace(/^\/+/, '').split(/[/?]/)[0];
    if (NAV.some((n) => n.id === seg)) return seg as SecaoId;
  }
  return 'visao-geral';
}

function Shell({ config }: { config: ShellConfig }) {
  void config;
  const [secao, setSecao] = useState<SecaoId>(lerSecao());
  const [navAberta, setNavAberta] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosGlobais>({
    contaId: 'todas', periodo: '30d', comparacao: 'anterior', objetivo: 'todos',
  });
  const [versao, setVersao] = useState(0);            // bump = recarrega tudo
  const [campanhaSel, setCampanhaSel] = useState<string | null>(null); // drill §8→§9
  const [conjuntoSel, setConjuntoSel] = useState<string | null>(null); // drill §9→§10

  const { dados: contas } = useDados(() => getService().getContas(), [versao]);

  useEffect(() => {
    const onHash = () => setSecao(lerSecao());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const irPara = (id: SecaoId) => {
    window.location.hash = `${HASH_BASE}/${id}`;
    setSecao(id);
  };

  const gruposNav = useMemo(
    () => GRUPOS.map((g) => ({ grupo: g, itens: NAV.filter((n) => n.grupo === g) })),
    []
  );

  const prep = (secaoNome: string, detalhe: string) => (
    <div className="mads-tela"><EmPreparacao secao={secaoNome} detalhe={detalhe} /></div>
  );

  const telas: Record<SecaoId, ReactNode> = {
    'visao-geral': <VisaoGeral filtros={filtros} aoNavegar={irPara} />,
    central: <Central filtros={filtros} aoNavegar={irPara} />,
    campanhas: <Campanhas filtros={filtros}
      aoVerConjuntos={(id) => { setCampanhaSel(id); setConjuntoSel(null); irPara('conjuntos'); }} />,
    conjuntos: <Conjuntos filtros={filtros} campanhaId={campanhaSel}
      aoLimpar={() => setCampanhaSel(null)}
      aoVerAnuncios={(id) => { setConjuntoSel(id); irPara('anuncios'); }} />,
    anuncios: <Anuncios filtros={filtros} conjuntoId={conjuntoSel}
      aoLimpar={() => setConjuntoSel(null)} />,
    criativos: <Criativos filtros={filtros} />,
    publicos: <Publicos filtros={filtros} />,
    posicionamentos: <Posicionamentos filtros={filtros} />,
    funil: <Funil filtros={filtros} />,
    leads: <Leads filtros={filtros} />,
    pixel: <Pixel filtros={filtros} />,
    atribuicao: <Atribuicao filtros={filtros} />,
    orcamentos: <Orcamentos filtros={filtros} />,
    performance: <Performance filtros={filtros} />,
    qualidade: <Qualidade filtros={filtros} />,
    catalogos: prep('Catálogos de produtos',
      'Catálogo, conjuntos de produtos e anúncios dinâmicos entram com a integração real — exigem o feed de produtos conectado ao Gerenciador de Comércio.'),
    remarketing: prep('Remarketing e retenção',
      'Públicos de reengajamento, exclusões automáticas e jornadas de remarketing entram com a integração real, junto com os eventos do pixel em produção.'),
    paginas: prep('Páginas e perfis',
      'Métricas orgânicas da Página e do Instagram (seguidores, alcance orgânico, mensagens) exigem as permissões de Página na conexão OAuth.'),
    relatorios: <Relatorios aoNavegar={irPara} />,
    alertas: <Alertas filtros={filtros} aoNavegar={irPara} />,
    automacoes: <Automacoes />,
    sincronizacao: <Sincronizacao />,
    config: <Config aoTrocarCenario={() => setVersao((v) => v + 1)} />,
  };

  const itemAtual = NAV.find((n) => n.id === secao) ?? NAV[0];

  const syncProblema = getService().origem === 'mock'
    && (contas ?? []).some((c) => new Date().getTime() - new Date(c.ultimaSincronizacao).getTime() > 2 * 3600000);

  return (
    <div className="mads-shell">
      {/* Header interno (§5) */}
      <div className="mads-header">
        <div className="mads-header-brand">
          <span className="mads-logo" aria-hidden><Megaphone size={16} /></span>
          <div className="mads-header-tit">
            <span className="mads-breadcrumb">Marketing e Aquisição › Meta Ads › {itemAtual.rotulo}</span>
            <strong>Meta Ads</strong>
          </div>
          <span className="mads-selo-mock" title="Ambiente de demonstração — os dados exibidos são simulados. A integração real substitui apenas a camada de dados.">
            Dados simulados
          </span>
          {syncProblema && (
            <span className="mads-selo-sync" title="Última sincronização há mais de 2 horas — verifique a seção Sincronização.">
              <AlertTriangle size={11} aria-hidden /> Dados desatualizados
            </span>
          )}
        </div>

        <div className="mads-header-filtros">
          <select value={filtros.contaId} aria-label="Conta"
            onChange={(e) => setFiltros((f) => ({ ...f, contaId: e.target.value }))}>
            <option value="todas">Todas as contas</option>
            {(contas ?? []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <select value={filtros.objetivo} aria-label="Objetivo"
            onChange={(e) => setFiltros((f) => ({ ...f, objetivo: e.target.value as FiltrosGlobais['objetivo'] }))}>
            {OBJETIVOS.map((o) => <option key={o.id} value={o.id}>{o.rotulo}</option>)}
          </select>
          <select value={filtros.periodo} aria-label="Período"
            onChange={(e) => setFiltros((f) => ({ ...f, periodo: e.target.value as PeriodoId }))}>
            {PERIODOS.map((p) => <option key={p.id} value={p.id}>{p.rotulo}</option>)}
          </select>
          <select value={filtros.comparacao} aria-label="Comparação"
            onChange={(e) => setFiltros((f) => ({ ...f, comparacao: e.target.value as ComparacaoId }))}>
            {COMPARACOES.map((c) => <option key={c.id} value={c.id}>{c.rotulo}</option>)}
          </select>
          <button className="mads-btn" onClick={() => setVersao((v) => v + 1)} title="Atualizar dados">
            <RefreshCw size={13} aria-hidden /> Atualizar
          </button>
        </div>
      </div>

      <div className="mads-body">
        {/* Sub-sidebar (§4) */}
        <nav className={`mads-nav${navAberta ? '' : ' is-mini'}`} aria-label="Seções do Meta Ads">
          <button className="mads-nav-toggle" onClick={() => setNavAberta((v) => !v)}
            title={navAberta ? 'Recolher navegação' : 'Expandir navegação'}>
            {navAberta ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
          </button>
          {gruposNav.map(({ grupo, itens }) => (
            <div key={grupo} className="mads-nav-grupo">
              {navAberta && <div className="mads-nav-h">{grupo}</div>}
              {itens.map((n) => (
                <button key={n.id} className={`mads-nav-item${secao === n.id ? ' is-on' : ''}`}
                  onClick={() => irPara(n.id)} title={n.rotulo}>
                  {n.icone}
                  {navAberta && <span>{n.rotulo}</span>}
                </button>
              ))}
            </div>
          ))}
          {navAberta && (
            <div className="mads-nav-rodape">
              <BarChart3 size={12} aria-hidden /> Fase 1 — dados simulados
            </div>
          )}
        </nav>

        {/* Conteúdo */}
        <main className="mads-main" key={`${secao}-${versao}`}>
          {telas[secao]}
        </main>
      </div>
    </div>
  );
}

export function App({ config }: { config: ShellConfig }) {
  return <Shell config={config} />;
}
