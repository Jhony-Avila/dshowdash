// app/App.tsx — shell do módulo Mercado Livre.
// @version 1.0.0  @created 2026-07-28
//
// Header interno (conta/período/comparação/status — §5) + sub-sidebar
// colapsável com as 23 seções (§4) + roteamento por hash
// (#/panel-mercadolivre/<secao>) + selo persistente de dados simulados (§34.5).
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle, BadgePercent, BarChart3, Bell, Bot, Boxes, ChartNoAxesCombined,
  ClipboardList, CreditCard, FileSpreadsheet, HandCoins, Headset, LayoutDashboard,
  MessageCircleQuestion, Package, PackageX, PanelLeftClose, PanelLeftOpen,
  RefreshCw, Settings, ShieldCheck, ShoppingCart, Store, Tags, Truck, Users,
} from 'lucide-react';
import { getService } from '../services/MercadoLivreService';
import { EmPreparacao } from '../components/ui';
import { useDados } from '../components/useDados';
import type { ComparacaoId, FiltrosGlobais, PeriodoId, SecaoId, ShellConfig } from '../domain/types';
import { VisaoGeral } from '../screens/VisaoGeral';
import { Central, Pedidos } from '../screens/Operacao';
import { Anuncios, Estoque, Produtos } from '../screens/Catalogo';
import { Devolucoes, Perguntas, Reclamacoes } from '../screens/Atendimento';
import { Envios, Financeiro, Precos, Rentabilidade, Reputacao, Vendas } from '../screens/Financas';
import { Alertas, Automacoes, Clientes, Concorrencia, Config, Relatorios, Sincronizacao } from '../screens/Sistema';
import '../styles/tokens.css';

const HASH_BASE = '#/panel-mercadolivre';

interface ItemNav { id: SecaoId; rotulo: string; icone: ReactNode; grupo: string; }

const NAV: ItemNav[] = [
  { id: 'visao-geral', rotulo: 'Visão Geral', icone: <LayoutDashboard size={15} />, grupo: 'Visão' },
  { id: 'central', rotulo: 'Central Operacional', icone: <ClipboardList size={15} />, grupo: 'Visão' },
  { id: 'pedidos', rotulo: 'Pedidos', icone: <ShoppingCart size={15} />, grupo: 'Operação' },
  { id: 'vendas', rotulo: 'Vendas', icone: <ChartNoAxesCombined size={15} />, grupo: 'Operação' },
  { id: 'envios', rotulo: 'Envios e Logística', icone: <Truck size={15} />, grupo: 'Operação' },
  { id: 'anuncios', rotulo: 'Anúncios', icone: <Store size={15} />, grupo: 'Catálogo' },
  { id: 'produtos', rotulo: 'Produtos', icone: <Package size={15} />, grupo: 'Catálogo' },
  { id: 'estoque', rotulo: 'Estoque', icone: <Boxes size={15} />, grupo: 'Catálogo' },
  { id: 'precos', rotulo: 'Preços e Promoções', icone: <Tags size={15} />, grupo: 'Catálogo' },
  { id: 'perguntas', rotulo: 'Perguntas', icone: <MessageCircleQuestion size={15} />, grupo: 'Atendimento' },
  { id: 'mensagens', rotulo: 'Mensagens', icone: <Headset size={15} />, grupo: 'Atendimento' },
  { id: 'reclamacoes', rotulo: 'Reclamações', icone: <AlertTriangle size={15} />, grupo: 'Atendimento' },
  { id: 'devolucoes', rotulo: 'Cancel. e Devoluções', icone: <PackageX size={15} />, grupo: 'Atendimento' },
  { id: 'reputacao', rotulo: 'Reputação', icone: <ShieldCheck size={15} />, grupo: 'Conta' },
  { id: 'financeiro', rotulo: 'Financeiro', icone: <CreditCard size={15} />, grupo: 'Financeiro' },
  { id: 'rentabilidade', rotulo: 'Rentabilidade', icone: <HandCoins size={15} />, grupo: 'Financeiro' },
  { id: 'clientes', rotulo: 'Clientes', icone: <Users size={15} />, grupo: 'Inteligência' },
  { id: 'concorrencia', rotulo: 'Concorrência', icone: <BadgePercent size={15} />, grupo: 'Inteligência' },
  { id: 'relatorios', rotulo: 'Relatórios', icone: <FileSpreadsheet size={15} />, grupo: 'Inteligência' },
  { id: 'alertas', rotulo: 'Alertas', icone: <Bell size={15} />, grupo: 'Inteligência' },
  { id: 'automacoes', rotulo: 'Automações', icone: <Bot size={15} />, grupo: 'Sistema' },
  { id: 'sincronizacao', rotulo: 'Sincronização', icone: <RefreshCw size={15} />, grupo: 'Sistema' },
  { id: 'config', rotulo: 'Configurações', icone: <Settings size={15} />, grupo: 'Sistema' },
];

const GRUPOS = ['Visão', 'Operação', 'Catálogo', 'Atendimento', 'Conta', 'Financeiro', 'Inteligência', 'Sistema'];

const PERIODOS: { id: PeriodoId; rotulo: string }[] = [
  { id: 'hoje', rotulo: 'Hoje' }, { id: 'ontem', rotulo: 'Ontem' },
  { id: '7d', rotulo: '7 dias' }, { id: '15d', rotulo: '15 dias' },
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
  const [filtros, setFiltros] = useState<FiltrosGlobais>({ contaId: 'todas', periodo: '30d', comparacao: 'anterior' });
  const [versao, setVersao] = useState(0); // bump = recarrega tudo (atualizar/cenário)

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

  const syncProblema = getService().origem === 'mock'
    && (contas ?? []).some((c) => new Date().getTime() - new Date(c.ultimaSincronizacao).getTime() > 2 * 3600000);

  const telas: Record<SecaoId, ReactNode> = {
    'visao-geral': <VisaoGeral filtros={filtros} aoNavegar={irPara} />,
    central: <Central filtros={filtros} aoNavegar={irPara} />,
    pedidos: <Pedidos filtros={filtros} />,
    vendas: <Vendas filtros={filtros} />,
    anuncios: <Anuncios filtros={filtros} />,
    produtos: <Produtos filtros={filtros} />,
    estoque: <Estoque filtros={filtros} />,
    precos: <Precos />,
    perguntas: <Perguntas filtros={filtros} />,
    mensagens: (
      <div className="ml-tela">
        <EmPreparacao secao="Mensagens e atendimento"
          detalhe="A caixa de entrada de mensagens pós-venda (conversas por pedido, templates e produtividade por atendente) entra junto com a integração real — os dados de mensagens exigem a API oficial." />
      </div>
    ),
    reclamacoes: <Reclamacoes filtros={filtros} />,
    devolucoes: <Devolucoes filtros={filtros} />,
    envios: <Envios filtros={filtros} />,
    reputacao: <Reputacao filtros={filtros} />,
    financeiro: <Financeiro filtros={filtros} />,
    rentabilidade: <Rentabilidade filtros={filtros} />,
    clientes: <Clientes filtros={filtros} />,
    concorrencia: <Concorrencia />,
    relatorios: <Relatorios aoNavegar={irPara} />,
    alertas: <Alertas filtros={filtros} aoNavegar={irPara} />,
    automacoes: <Automacoes />,
    sincronizacao: <Sincronizacao />,
    config: <Config aoTrocarCenario={() => setVersao((v) => v + 1)} />,
  };

  const itemAtual = NAV.find((n) => n.id === secao) ?? NAV[0];

  return (
    <div className="ml-shell">
      {/* Header interno (§5) */}
      <div className="ml-header">
        <div className="ml-header-brand">
          <span className="ml-logo" aria-hidden><Store size={16} /></span>
          <div className="ml-header-tit">
            <span className="ml-breadcrumb">Canais de Venda › Mercado Livre › {itemAtual.rotulo}</span>
            <strong>Mercado Livre</strong>
          </div>
          <span className="ml-selo-mock" title="Ambiente de demonstração — os dados exibidos são simulados. A integração real substitui apenas a camada de dados.">
            Dados simulados
          </span>
          {syncProblema && (
            <span className="ml-selo-sync" title="Última sincronização há mais de 2 horas — verifique a seção Sincronização.">
              <AlertTriangle size={11} aria-hidden /> Dados desatualizados
            </span>
          )}
        </div>

        <div className="ml-header-filtros">
          <select value={filtros.contaId} aria-label="Conta"
            onChange={(e) => setFiltros((f) => ({ ...f, contaId: e.target.value }))}>
            <option value="todas">Todas as contas</option>
            {(contas ?? []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <select value={filtros.periodo} aria-label="Período"
            onChange={(e) => setFiltros((f) => ({ ...f, periodo: e.target.value as PeriodoId }))}>
            {PERIODOS.map((p) => <option key={p.id} value={p.id}>{p.rotulo}</option>)}
          </select>
          <select value={filtros.comparacao} aria-label="Comparação"
            onChange={(e) => setFiltros((f) => ({ ...f, comparacao: e.target.value as ComparacaoId }))}>
            {COMPARACOES.map((c) => <option key={c.id} value={c.id}>{c.rotulo}</option>)}
          </select>
          <button className="ml-btn" onClick={() => setVersao((v) => v + 1)} title="Atualizar dados">
            <RefreshCw size={13} aria-hidden /> Atualizar
          </button>
        </div>
      </div>

      <div className="ml-body">
        {/* Sub-sidebar (§4) */}
        <nav className={`ml-nav${navAberta ? '' : ' is-mini'}`} aria-label="Seções do Mercado Livre">
          <button className="ml-nav-toggle" onClick={() => setNavAberta((v) => !v)}
            title={navAberta ? 'Recolher navegação' : 'Expandir navegação'}>
            {navAberta ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
          </button>
          {gruposNav.map(({ grupo, itens }) => (
            <div key={grupo} className="ml-nav-grupo">
              {navAberta && <div className="ml-nav-h">{grupo}</div>}
              {itens.map((n) => (
                <button key={n.id} className={`ml-nav-item${secao === n.id ? ' is-on' : ''}`}
                  onClick={() => irPara(n.id)} title={n.rotulo}>
                  {n.icone}
                  {navAberta && <span>{n.rotulo}</span>}
                </button>
              ))}
            </div>
          ))}
          {navAberta && (
            <div className="ml-nav-rodape">
              <BarChart3 size={12} aria-hidden /> Fase 1 — dados simulados
            </div>
          )}
        </nav>

        {/* Conteúdo */}
        <main className="ml-main" key={`${secao}-${versao}`}>
          {telas[secao]}
        </main>
      </div>
    </div>
  );
}

export function App({ config }: { config: ShellConfig }) {
  return <Shell config={config} />;
}
