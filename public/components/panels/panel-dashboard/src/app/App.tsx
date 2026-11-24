// app/App.tsx — Home Inteligente do Dshow Dash (v3, briefing 2026-07-29).
// @version 3.0.0
//
// Página inicial executiva e operacional (§4–§5): GreetingHero atmosférico,
// clima atual + 10 dias (reais), KPIs, Exige atenção, atividades filtráveis,
// agenda, gráfico consolidado, widgets de módulo com DRAG/RESIZE
// (react-grid-layout, Fase 4), trânsito, e-mails, integrações, atalhos,
// insights por regras, modo operacional/executivo e auto-refresh.
// Cada widget carrega e falha de forma independente (§32).
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ResponsiveGridLayout, useContainerWidth,
  type Layout, type LayoutItem, type ResponsiveLayouts,
} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import {
  AlertTriangle, ArrowRight, Bot, CalendarDays, Car, CircleDollarSign, History,
  Handshake, LayoutDashboard, Megaphone, RefreshCw, RotateCcw,
  Share2, ShoppingBag, ShoppingCart, SlidersHorizontal, Star, Store, Table2,
} from 'lucide-react';
import {
  FALTA, SEM_FONTE, alternarCenario, cenarioAtual, getAlertas,
  getIntegracoes, getResumoModulo, getTransito,
  lerOcultos, restaurarPadrao, salvarOcultos,
} from '../services/GeralService';
import type { CenarioMock } from '../services/GeralService';
import {
  getClima, getInsights, getSaudacao,
} from '../services/HomeService';
import {
  alternarFavoritoModulo, favoritosModulos, registrarRecente, rotasRecentes,
} from '../services/PessoalService';
import { LinksWidget, NotasWidget } from '../components/Pessoal';
import { useDados } from '../components/useDados';
import { CeuFundo, GreetingHero, ceuAtual } from '../components/Hero';
import { ClimaAtualCard, PrevisaoDezDias } from '../components/Clima';
import { InsightsPanel, TrafficWidget } from '../components/Extras';
import {
  CartaoAguardando, CartaoSaudeView, Secao, SeloSimulado, Skeleton, WidgetCarregando, WidgetModulo,
  relTempo,
} from '../components/ui';
import type {
  AlertaGeral, CartaoSaude, EstadoCartao, ModoHome, ModuloId,
  PeriodoId, ResumoModulo, ShellConfig, StatusIntegracao,
} from '../domain/types';
import '../styles/tokens.css';
import { GeralV2 } from '../v2/GeralV2';

// ── registro de módulos (§12) ───────────────────────────────────────
interface DefModulo { id: ModuloId; nome: string; icone: ReactNode; rota: string | null; }
const MODULOS: DefModulo[] = [
  { id: 'ads', nome: 'Ads Intelligence', icone: <Megaphone size={15} />, rota: '#/panel-ads' },
  { id: 'metaads', nome: 'Meta Ads', icone: <Share2 size={15} />, rota: '#/panel-metaads' },
  { id: 'mercadolivre', nome: 'Mercado Livre', icone: <Store size={15} />, rota: '#/panel-mercadolivre' },
  { id: 'anuncios', nome: 'Consultor Anuncios', icone: <Bot size={15} />, rota: '#/panel-anuncios' },
  { id: 'pipedrive', nome: 'Pipedrive', icone: <Handshake size={15} />, rota: '#/panel-pipedrive' },
  { id: 'ecommerce', nome: 'E-commerce', icone: <ShoppingCart size={15} />, rota: null },
  { id: 'financeiro', nome: 'Financeiro', icone: <CircleDollarSign size={15} />, rota: null },
  { id: 'compras', nome: 'Compras', icone: <ShoppingBag size={15} />, rota: null },
  { id: 'google-calendar', nome: 'Google Calendar', icone: <CalendarDays size={15} />, rota: '#/panel-google-calendar' },
  { id: 'transito', nome: 'Trânsito', icone: <Car size={15} />, rota: '#/panel-transito-sp' },
  { id: 'datatables', nome: 'DataTables', icone: <Table2 size={15} />, rota: '#/panel-datatables' },
];

const PERIODOS: { id: PeriodoId; rotulo: string }[] = [
  { id: 'hoje', rotulo: 'Hoje' }, { id: 'ontem', rotulo: 'Ontem' },
  { id: '7d', rotulo: '7 dias' }, { id: '30d', rotulo: '30 dias' },
  { id: 'mes_atual', rotulo: 'Mês atual' },
];

const AUTO_REFRESH: { s: number; rotulo: string }[] = [
  { s: 0, rotulo: 'Auto: off' }, { s: 60, rotulo: '1 min' }, { s: 300, rotulo: '5 min' },
  { s: 900, rotulo: '15 min' }, { s: 1800, rotulo: '30 min' },
];

// Modo executivo esconde o operacional fino (§26)
const OCULTAS_EXECUTIVO = new Set(['agenda', 'emails', 'atividades', 'integracoes', 'pessoais']);

function navegar(rota: string) { registrarRecente(rota); window.location.hash = rota; }
function rolarPara(id: string) {
  document.querySelector(`[data-ger-sec="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── persistência local ──────────────────────────────────────────────
const K_MODO = 'dshow.home.modo';
const K_DENS = 'dshow.home.densidade';
const K_AUTO = 'dshow.home.autorefresh';
const K_LAYOUT = 'dshow.home.layout.v2';

function lerLS<T>(chave: string, padrao: T, parse: (raw: string) => T): T {
  try { const raw = window.localStorage.getItem(chave); return raw === null ? padrao : parse(raw); }
  catch { return padrao; }
}
function gravarLS(chave: string, valor: string) {
  try { window.localStorage.setItem(chave, valor); } catch { /* sem storage */ }
}

// layout padrão da zona de widgets (12 col desktop / 8 / 4)
function layoutPadrao(ids: ModuloId[]): ResponsiveLayouts {
  const faz = (cols: number, w: number): LayoutItem[] => ids.map((id, i) => ({
    i: id, x: (i * w) % cols, y: Math.floor((i * w) / cols) * 3, w, h: 3, minW: 2, minH: 2,
  }));
  return { lg: faz(12, 3), md: faz(8, 4), sm: faz(4, 4) };
}

// ── widget de módulo com estado independente ────────────────────────
// Estados (23/11/2026): CARREGANDO (esqueleto na forma do cartão) · CONECTADO · AGUARDANDO (sai da grade → faixa própria) · COM PROBLEMA
// (o que falhou + último sucesso + Tentar de novo; com último valor válido, ele fica marcado como desatualizado — falha nunca vira zero).
function WidgetDoModulo({ def, periodo, versao, ordem, aoEstado }: {
  def: DefModulo; periodo: PeriodoId; versao: number; ordem: number; aoEstado: (id: ModuloId, e: EstadoCartao) => void;
}) {
  const { dados, carregando, atualizando, erro, recarregar } = useDados(
    () => getResumoModulo(def.id, periodo),
    [def.id, periodo, versao]
  );
  const okEm = useRef<string | null>(null);
  // a falha anterior fica na tela enquanto "Tentar de novo" roda ("Tentando…"), até chegar o resultado
  const [falhou, setFalhou] = useState(false);
  useEffect(() => { if (erro) setFalhou(true); else if (!atualizando && !carregando) setFalhou(false); }, [erro, atualizando, carregando]);
  useEffect(() => { if (dados && dados.estado !== 'problema') okEm.current = new Date().toISOString(); }, [dados]);
  useEffect(() => { if (dados?.estado === 'aguardando') aoEstado(def.id, 'aguardando'); }, [dados, def.id, aoEstado]);

  if (carregando && !dados) return <WidgetCarregando nome={def.nome} icone={def.icone} ordem={ordem} />;
  if (dados?.estado === 'aguardando') return null;   // vai para a faixa "Aguardando conexão"
  let resumo: ResumoModulo | null = dados;
  if (erro || (falhou && atualizando)) {
    // falhou: sem dado anterior = só o problema; com dado anterior = ele FICA, marcado como desatualizado
    resumo = dados
      ? { ...dados, status: 'critico', statusRotulo: 'Com problema', estado: 'problema', desatualizado: dados.metricas.length > 0,
          problema: { motivo: `A atualização de ${def.nome} falhou.`, ultimoSucesso: okEm.current } }
      : { status: 'critico', statusRotulo: 'Com problema', estado: 'problema', metricas: [], alerta: null, atualizadoEm: null, simulado: false,
          problema: { motivo: `Não foi possível carregar o resumo de ${def.nome}.`, ultimoSucesso: null } };
  }
  return resumo && <WidgetModulo nome={def.nome} icone={def.icone} resumo={resumo} rota={def.rota} aoAbrir={navegar}
    sincronizando={atualizando} ordem={ordem} onTentar={recarregar} />;
}

// ── linha de KPIs / saúde (§10 + §22 do briefing anterior) ──────────
function LinhaSaude({ alertas, integracoes, visiveis }: {
  alertas: AlertaGeral[] | null;
  integracoes: StatusIntegracao[] | null;
  visiveis: number;
}) {
  if (!alertas || !integracoes) {
    // CARREGANDO na forma do conteúdo: os 5 cartões de saúde com rótulo, número e detalhe (não uma caixa lisa)
    return (
      <div className="ger-saudes" aria-busy="true" data-ger-estado="carregando">
        {['Status do sistema', 'Módulos', 'Integrações', 'Alertas em aberto', 'Atualização'].map((r, k) => (
          <div key={r} className="ger-saude ger-nivel-dim ger-entra" style={{ ['--ger-ordem' as string]: k }}>
            <span className="ger-saude-rotulo">{r}</span>
            <span className="ger-osso ger-osso-numero" aria-hidden />
            <span className="ger-osso ger-osso-rotulo" aria-hidden />
          </div>
        ))}
        <span className="ger-sr">Carregando o resumo de saúde…</span>
      </div>
    );
  }

  // três estados separados (23/11): "aguardando conexão" NÃO conta como saudável; desatualizada conta como problema
  const comErro = integracoes.filter((i) => i.estado === 'erro' || i.estado === 'desatualizada').length;
  const conectadas = integracoes.filter((i) => i.estado === 'conectada' || i.estado === 'sincronizando').length;
  const demo = integracoes.filter((i) => i.estado === 'demonstracao').length;
  const criticos = alertas.filter((a) => a.severidade === 1).length;
  const ultimaSync = integracoes.map((i) => i.ultimaSync).filter(Boolean).sort().pop() as string | undefined;

  const cartoes: CartaoSaude[] = [
    { id: 'sistema', rotulo: 'Status do sistema', valor: comErro === 0 ? 'Online' : 'Com atenção',
      detalhe: `${conectadas} de ${integracoes.length} fontes conectadas · ${comErro} com problema`,
      nivel: comErro === 0 ? 'ok' : comErro >= 2 ? 'critico' : 'atencao', rota: 'sec:integracoes' },
    { id: 'modulos', rotulo: 'Módulos', valor: `${visiveis} ativos`,
      detalhe: `${MODULOS.length} disponíveis no dash`, nivel: 'ok', rota: 'sec:widgets' },
    { id: 'integracoes', rotulo: 'Integrações', valor: `${conectadas} conectadas`,
      detalhe: `${demo} aguardando conexão · ${comErro} com problema`,
      nivel: comErro > 0 ? 'atencao' : 'ok', rota: 'sec:integracoes' },
    { id: 'alertas', rotulo: 'Alertas em aberto', valor: String(alertas.length),
      detalhe: criticos > 0 ? `${criticos} crítico(s)` : 'nenhum crítico',
      nivel: criticos > 0 ? 'critico' : alertas.length > 0 ? 'atencao' : 'ok', rota: 'sec:alertas' },
    { id: 'atualizacao', rotulo: 'Atualização', valor: ultimaSync ? relTempo(ultimaSync) : '—',
      detalhe: 'última sincronização geral', nivel: 'ok', rota: 'sec:integracoes' },
  ];

  const abrir = (rota: string) => { if (rota.startsWith('sec:')) rolarPara(rota.slice(4)); else navegar(rota); };

  return (
    <div className="ger-saudes">
      {cartoes.map((c) => <CartaoSaudeView key={c.id} cartao={c} aoAbrir={abrir} />)}
    </div>
  );
}

// ── shell ───────────────────────────────────────────────────────────
function Shell({ config }: { config: ShellConfig }) {
  // Montado como PÁGINA INICIAL (via panel-home) → imersivo (céu + vidro).
  // Montado como GERAL (botão da sidebar) → dashboard sóbrio (aspecto anterior).
  const imersivo = config.home === true;
  const [periodo, setPeriodo] = useState<PeriodoId>('30d');
  const [versao, setVersao] = useState(0);
  const [carimbo, setCarimbo] = useState(() => new Date().toISOString());
  const [personalizar, setPersonalizar] = useState(false);
  const [organizar, setOrganizar] = useState(false);
  const [ocultos, setOcultos] = useState<Set<ModuloId>>(() => lerOcultos());
  const [modo, setModo] = useState<ModoHome>(() => lerLS(K_MODO, 'operacional', (r) => (r === 'executivo' ? 'executivo' : 'operacional')));
  // densidade (§26.1): compacto aperta paddings/gaps/tipografia via CSS
  const [densidade, setDensidade] = useState<'conforto' | 'compacto'>(
    () => lerLS(K_DENS, 'conforto', (r) => (r === 'compacto' ? 'compacto' : 'conforto')));
  const [autoS, setAutoS] = useState<number>(() => lerLS(K_AUTO, 0, (r) => Number(r) || 0));
  const [layouts, setLayouts] = useState<ResponsiveLayouts | null>(() =>
    lerLS<ResponsiveLayouts | null>(K_LAYOUT, null, (r) => JSON.parse(r) as ResponsiveLayouts));
  // favoritos + recentes (§24) e cenário de QA (§45 — gatilho oculto)
  const [favs, setFavs] = useState<Set<ModuloId>>(() => favoritosModulos());
  const [recs] = useState(() => rotasRecentes());
  const [cenario, setCenario] = useState<CenarioMock>(() => cenarioAtual());
  const cliquesTitulo = useRef<number[]>([]);
  const { width: larguraZona, containerRef: refZona, mounted: zonaPronta } = useContainerWidth();

  const atualizar = () => { setVersao((v) => v + 1); setCarimbo(new Date().toISOString()); };

  // auto refresh (§29)
  useEffect(() => {
    if (!autoS) return;
    const t = window.setInterval(() => { if (!document.hidden) atualizar(); }, autoS * 1000);
    return () => window.clearInterval(t);
  }, [autoS]);

  // fontes — cada uma independente (§32)
  const { dados: alertas, carregando: cAlertas } = useDados(() => getAlertas(), [versao]);
  const { dados: integracoes } = useDados(() => getIntegracoes(), [versao]);
  const { dados: clima, erro: eClima, recarregar: rClima } = useDados(() => getClima(), [versao]);
  const { dados: saudacao } = useDados(() => getSaudacao(alertas ? alertas.length : null), [alertas === null, versao]);
  const { dados: insights, carregando: cInsights } = useDados(() => getInsights(), [versao]);
  const { dados: transito, carregando: cTransito, erro: eTransito, recarregar: rTransito } =
    useDados(() => getTransito(), [versao]);

  const visiveis = useMemo(() => MODULOS.filter((m) => !ocultos.has(m.id)), [ocultos]);
  // sem fonte (fixo) ou descoberto ao carregar (ex.: Ads em modo de testes) → faixa "Aguardando conexão", fora da primeira tela
  const [aguardandoDin, setAguardandoDin] = useState<Set<ModuloId>>(() => new Set());
  const aoEstadoModulo = useMemo(() => (id: ModuloId, e: EstadoCartao) => {
    if (e === 'aguardando') setAguardandoDin((a) => (a.has(id) ? a : new Set(a).add(id)));
  }, []);
  const naGrade = useMemo(() => visiveis.filter((m) => !SEM_FONTE.has(m.id) && !aguardandoDin.has(m.id)), [visiveis, aguardandoDin]);
  const naFaixaAguardando = useMemo(() => visiveis.filter((m) => SEM_FONTE.has(m.id) || aguardandoDin.has(m.id)), [visiveis, aguardandoDin]);
  const mostrar = (secao: string) => modo === 'operacional' || !OCULTAS_EXECUTIVO.has(secao);

  const alternarWidget = (id: ModuloId) => {
    setOcultos((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      salvarOcultos(novo);
      return novo;
    });
  };

  const restaurar = () => {
    restaurarPadrao();
    setOcultos(new Set());
    setLayouts(null);
    try { window.localStorage.removeItem(K_LAYOUT); } catch { /* sem storage */ }
  };

  const trocarModo = (m: ModoHome) => { setModo(m); gravarLS(K_MODO, m); };
  const trocarDensidade = (d: 'conforto' | 'compacto') => { setDensidade(d); gravarLS(K_DENS, d); };
  const trocarAuto = (s: number) => { setAutoS(s); gravarLS(K_AUTO, String(s)); };

  /**
   * Layout salvo + módulos que entraram depois.
   *
   * BUG QUE ISTO CORRIGE: usar o layout salvo cru deixa INVISÍVEL todo módulo
   * adicionado após o usuário ter arrastado algum widget — o objeto salvo não
   * tem entrada para o id novo, e o grid não posiciona filho sem layout. Vale
   * para qualquer módulo futuro, não só o que motivou o achado.
   *
   * Também descarta entradas órfãs (módulo oculto ou removido do registro),
   * que de outro modo ficam ocupando espaço reservado no grid.
   */
  const layoutsEfetivos = useMemo(() => {
    const ids = naGrade.map((m) => m.id);
    const padrao = layoutPadrao(ids);
    if (!layouts) return padrao;

    const validos = new Set<string>(ids);
    const completar = (bp: 'lg' | 'md' | 'sm'): LayoutItem[] => {
      const salvos = (layouts[bp] ?? []).filter((it) => validos.has(it.i));
      const presentes = new Set(salvos.map((it) => it.i));
      const faltando = (padrao[bp] ?? []).filter((it) => !presentes.has(it.i));
      if (!faltando.length) return salvos;
      // Entra embaixo do que já existe: não empurra o que o usuário organizou.
      const base = salvos.reduce((m, it) => Math.max(m, it.y + it.h), 0);
      return [...salvos, ...faltando.map((it, k) => ({ ...it, y: base + Math.floor(k / 4) * it.h }))];
    };

    return { lg: completar('lg'), md: completar('md'), sm: completar('sm') };
  }, [layouts, naGrade]);

  const aoMudarLayout = (_atual: Layout, todos: ResponsiveLayouts) => {
    if (!organizar) return;
    setLayouts(todos);
    gravarLS(K_LAYOUT, JSON.stringify(todos));
  };


  const ceu = ceuAtual();
  const grupoClima = clima?.atual.grupo ?? null;

  return (
    <div className="ger-tela-toda" data-imersivo={imersivo ? '1' : '0'} data-ceu={ceu}
      data-clima={grupoClima ?? 'limpo'} data-densidade={imersivo ? 'conforto' : densidade}>
      {imersivo && <CeuFundo grupo={grupoClima} />}
      <div className="ger-shell">
      {/* barra de controles (§21 do header + §28 + §29 + §26) */}
      <div className="ger-controles">
        <span className="ger-controles-tit" onClick={() => {
          const agora = Date.now();
          cliquesTitulo.current = [...cliquesTitulo.current.filter((t) => agora - t < 2500), agora];
          if (cliquesTitulo.current.length >= 5) { // §45: seletor oculto de QA
            cliquesTitulo.current = [];
            setCenario(alternarCenario());
            atualizar();
          }
        }}><LayoutDashboard size={15} aria-hidden /> Principal
          {cenario !== 'padrao' && (
            <button type="button" className="ger-cenario" title="Cenário de demonstração ativo — clique para alternar"
              onClick={(e) => { e.stopPropagation(); setCenario(alternarCenario()); atualizar(); }}>
              QA: {cenario}
            </button>
          )}
        </span>
        <div className="ger-controles-acoes">
          {imersivo && (
            <button className="ger-btn" onClick={() => navegar('#/panel-dashboard')}
              title="Abrir o dashboard completo (Geral)">
              <LayoutDashboard size={13} aria-hidden /> Visão geral completa
            </button>
          )}
          {!imersivo && (<>
          <div className="ger-periodos" role="tablist" aria-label="Modo de visualização">
            <button role="tab" aria-selected={modo === 'operacional'}
              className={`ger-periodo${modo === 'operacional' ? ' is-on' : ''}`}
              onClick={() => trocarModo('operacional')}>Operacional</button>
            <button role="tab" aria-selected={modo === 'executivo'}
              className={`ger-periodo${modo === 'executivo' ? ' is-on' : ''}`}
              onClick={() => trocarModo('executivo')}>Executivo</button>
          </div>
          <div className="ger-periodos" role="tablist" aria-label="Densidade">
            <button role="tab" aria-selected={densidade === 'conforto'}
              className={`ger-periodo${densidade === 'conforto' ? ' is-on' : ''}`}
              onClick={() => trocarDensidade('conforto')}>Conforto</button>
            <button role="tab" aria-selected={densidade === 'compacto'}
              className={`ger-periodo${densidade === 'compacto' ? ' is-on' : ''}`}
              onClick={() => trocarDensidade('compacto')}>Compacto</button>
          </div>
          <div className="ger-periodos" role="tablist" aria-label="Período">
            {PERIODOS.map((p) => (
              <button key={p.id} role="tab" aria-selected={periodo === p.id}
                className={`ger-periodo${periodo === p.id ? ' is-on' : ''}`}
                onClick={() => setPeriodo(p.id)}>{p.rotulo}</button>
            ))}
          </div>
          <select className="ger-select" value={autoS} aria-label="Atualização automática"
            onChange={(e) => trocarAuto(Number(e.target.value))}>
            {AUTO_REFRESH.map((a) => <option key={a.s} value={a.s}>{a.rotulo}</option>)}
          </select>
          </>)}
          <button className="ger-btn" onClick={atualizar} title="Atualizar todos os widgets">
            <RefreshCw size={13} aria-hidden /> Atualizar
          </button>
          {!imersivo && (
          <button className={`ger-btn${personalizar ? ' is-on' : ''}`}
            onClick={() => { setPersonalizar((v) => !v); if (personalizar) setOrganizar(false); }}
            aria-expanded={personalizar}>
            <SlidersHorizontal size={13} aria-hidden /> Personalizar
          </button>
          )}
        </div>
      </div>

      {/* personalização (§25) */}
      {!imersivo && personalizar && (
        <div className="ger-personalizar">
          <div className="ger-pers-head">
            <strong>Personalizar página</strong>
            <div className="ger-pers-head-acoes">
              <label className="ger-pers-item">
                <input type="checkbox" checked={organizar} onChange={() => setOrganizar((v) => !v)} />
                Organizar layout (arrastar e redimensionar os cards de módulo)
              </label>
              <button className="ger-btn ger-btn-mini" onClick={restaurar}>
                <RotateCcw size={12} aria-hidden /> Restaurar padrão
              </button>
            </div>
          </div>
          <div className="ger-pers-lista">
            {MODULOS.map((m) => (
              <label key={m.id} className="ger-pers-item">
                <input type="checkbox" checked={!ocultos.has(m.id)} onChange={() => alternarWidget(m.id)} />
                <span className="ger-wg-ic" aria-hidden>{m.icone}</span> {m.nome}
              </label>
            ))}
          </div>
          <p className="ger-pers-nota">As preferências (cards visíveis, posições e tamanhos) ficam salvas neste navegador.</p>
        </div>
      )}

      {/* Faixa 1 — hero (8) + clima atual (4) (§5.1) */}
      <div className="ger-faixa">
        <div className="ger-col-8"><GreetingHero saudacao={saudacao} clima={clima} carimbo={carimbo} /></div>
        <div className="ger-col-4"><ClimaAtualCard clima={clima} erro={eClima} aoTentar={rClima} /></div>
      </div>

      {/* Faixa 2 — KPIs executivos (dashboard) */}
      {!imersivo && <LinhaSaude alertas={alertas} integracoes={integracoes} visiveis={visiveis.length} />}

      {/* Faixa 3 — atenção (23/11/2026: atividades e agenda de demonstração removidas — só o real) */}
      <div className="ger-faixa">
        <div className="ger-col-12" data-ger-sec="alertas">
          {cAlertas && !alertas ? <Skeleton altura={200} /> : (
            <Secao titulo="Exige atenção" sub="alertas consolidados de todos os módulos">
              {(alertas ?? []).length === 0 ? (
                <p className="ger-vazio-inline">Nenhum alerta crítico neste momento.</p>
              ) : (
                <div className="ger-alertas">
                  {(alertas ?? []).map((a) => (
                    <button key={a.id} className={`ger-alerta ger-prio-${a.severidade}`} onClick={() => navegar(a.rota)}>
                      <AlertTriangle size={15} aria-hidden />
                      <span className="ger-alerta-corpo">
                        <strong>{a.descricao} {a.simulado && <SeloSimulado />}</strong>
                        <span>{a.modulo} — {a.impacto}</span>
                      </span>
                      <span className="ger-alerta-acao">Abrir <ArrowRight size={11} aria-hidden /></span>
                    </button>
                  ))}
                </div>
              )}
            </Secao>
          )}
        </div>

      </div>

      {/* Faixa 5 — widgets dos módulos com drag/resize (§12–§13 + Fase 4) — dashboard */}
      {!imersivo && (
      <div data-ger-sec="widgets" className={`ger-zona-widgets${organizar ? ' is-organizando' : ''}`}>
        {organizar && (
          <p className="ger-organizar-dica">Arraste pelo cabeçalho e redimensione pelo canto inferior direito. As mudanças salvam sozinhas.</p>
        )}
        <div ref={refZona}>
          {zonaPronta && (
            <ResponsiveGridLayout
              className="ger-rgl"
              width={larguraZona}
              layouts={layoutsEfetivos}
              breakpoints={{ lg: 1000, md: 700, sm: 0 }}
              cols={{ lg: 12, md: 8, sm: 4 }}
              rowHeight={densidade === 'compacto' ? 74 : 92}
              margin={[12, 12]}
              dragConfig={{ enabled: organizar, handle: '.ger-wg-head' }}
              resizeConfig={{ enabled: organizar }}
              onLayoutChange={aoMudarLayout}
            >
              {naGrade.map((m, k) => (
                <div key={m.id} className="ger-rgl-item">
                  <WidgetDoModulo def={m} periodo={periodo} versao={versao} ordem={k} aoEstado={aoEstadoModulo} />
                </div>
              ))}
            </ResponsiveGridLayout>
          )}
        </div>
      </div>
      )}

      {/* Faixa 5b — AGUARDANDO CONEXÃO (23/11/2026): cartões compactos abaixo dos conectados — o que falta, com quem, e o link */}
      {!imersivo && naFaixaAguardando.length > 0 && (
        <div data-ger-sec="aguardando">
          <Secao titulo="Aguardando conexão" sub="integrações que ainda não enviam dados — nenhum número aparece até a conexão">
            <div className="ger-aguardando-lista">
              {naFaixaAguardando.map((m, k) => (
                <CartaoAguardando key={m.id} nome={m.nome} icone={m.icone} falta={FALTA[m.id]} aoAbrir={navegar} ordem={k} />
              ))}
            </div>
          </Secao>
        </div>

      )}

      {/* Faixa 6 — insights (§22) — dashboard */}
      {!imersivo && <InsightsPanel insights={insights} carregando={cInsights} aoAbrir={navegar} />}

      {/* Faixa 6b — widgets pessoais (§23) — dashboard */}
      {!imersivo && mostrar('pessoais') && (
        <div className="ger-faixa">
          <div className="ger-col-6"><NotasWidget /></div>
          <div className="ger-col-6"><LinksWidget /></div>
        </div>
      )}

      {/* Faixa 7 — previsão 10 dias (§9) */}
      <PrevisaoDezDias clima={clima} erro={eClima} />

      {/* Faixa 8 — trânsito (23/11/2026: widget E-mails de demonstração removido) — dashboard */}
      {!imersivo && (
      <div className="ger-faixa">
        <div className="ger-col-12">
          <TrafficWidget transito={transito} carregando={cTransito} erro={eTransito}
            aoTentar={rTransito} aoAbrir={() => navegar('#/panel-transito-sp')} />
        </div>
      </div>
      )}

      {/* Faixa 9 — integrações (§20) — dashboard */}
      {!imersivo && mostrar('integracoes') && (
        <div data-ger-sec="integracoes">
          <Secao titulo="Status das integrações" sub="a idade dos dados de cada fonte, sem segredo">
            {!integracoes ? <Skeleton altura={120} /> : (
              <div className="ger-integracoes">
                {integracoes.map((i) => (
                  <div key={i.nome} className={`ger-integ ger-integ-${i.estado}`}>
                    <span className="ger-integ-dot" aria-hidden />
                    <span className="ger-integ-corpo">
                      <strong>{i.nome}</strong>
                      <span>{i.detalhe}</span>
                    </span>
                    <span className="ger-integ-meta">
                      {i.estado === 'conectada' ? 'Conectada'
                        : i.estado === 'sincronizando' ? 'Sincronizando'
                        : i.estado === 'desatualizada' ? 'Desatualizada'
                        : i.estado === 'erro' ? 'Com problema' : 'Aguardando conexão'}
                      {i.ultimaSync && <em>{relTempo(i.ultimaSync)}</em>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Secao>
        </div>
      )}

      {/* Faixa 10 — atalhos com FAVORITOS + abertos recentemente (§21 + §24) */}
      <Secao titulo="Atalhos" sub="favorite com a estrela — seus favoritos vêm primeiro">
        <div className="ger-atalhos">
          {(() => {
            const comRota = MODULOS.filter((m) => m.rota);
            const ordenados = [...comRota.filter((m) => favs.has(m.id)), ...comRota.filter((m) => !favs.has(m.id))];
            const nFavs = comRota.filter((m) => favs.has(m.id)).length;
            return ordenados.slice(0, Math.max(8, nFavs)).map((m) => (
              <span key={m.id} className="ger-atalho-wrap">
                <button className={`ger-atalho${favs.has(m.id) ? ' is-fav' : ''}`} onClick={() => navegar(m.rota!)}>
                  <span className="ger-wg-ic" aria-hidden>{m.icone}</span>
                  <span>{m.nome}</span>
                </button>
                <button type="button" className={`ger-fav${favs.has(m.id) ? ' is-on' : ''}`}
                  title={favs.has(m.id) ? 'Remover dos favoritos' : 'Favoritar'}
                  aria-pressed={favs.has(m.id)}
                  onClick={() => setFavs(new Set(alternarFavoritoModulo(m.id)))}>
                  <Star size={12} aria-hidden />
                </button>
              </span>
            ));
          })()}
        </div>
        {recs.length > 0 && (
          <div className="ger-recentes" aria-label="Abertos recentemente">
            <span className="ger-recentes-tit"><History size={11} aria-hidden /> Abertos recentemente:</span>
            {recs.map((r) => {
              const mod = MODULOS.find((m) => m.rota && r.rota.startsWith(m.rota));
              const nome = mod?.nome ?? r.rota.replace('#/', '').replace(/^panel-/, '');
              return (
                <button key={r.rota} type="button" className="ger-recente" onClick={() => navegar(r.rota)}>
                  {nome} <em>{relTempo(r.quando)}</em>
                </button>
              );
            })}
          </div>
        )}
      </Secao>
      </div>
    </div>
  );
}

export function App({ config }: { config: ShellConfig }) {
  // Geral V2 · Lançamento (23/11/2026): a GERAL (botão da sidebar) vira a V2 dos mockups aprovados; a página inicial imersiva
  // (config.home) continua a mesma. O shell do Dash não muda — isto é só o miolo.
  if (config.home !== true) return <div className="ger-tela-toda" data-imersivo="0" data-densidade="conforto" data-geral-v2="1"><GeralV2 /></div>;
  return <Shell config={config} />;
}
