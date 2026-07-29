// app/App.tsx — Visão Geral: página inicial consolidada do Dshow Dash.
// @version 2.0.0  @created 2026-07-29
//
// Substitui o antigo "Painel de Teste" (briefing UX §19): nenhuma informação
// técnica é renderizada — o painel apresenta saúde do sistema (§22), widgets
// dos módulos (§23–§24), gráficos consolidados (§26), alertas (§28),
// atividades (§27), atalhos (§29) e personalização fase 1 (§30).
// Cada widget carrega e falha de forma independente (§31.3).
import { useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle, ArrowRight, Bell, Bot, Car, CircleDollarSign,
  Handshake, LayoutDashboard, Mail, Megaphone, RefreshCw, RotateCcw,
  Share2, ShoppingBag, ShoppingCart, SlidersHorizontal, Store, Table2,
} from 'lucide-react';
import {
  getAlertas, getAtividades, getDistribuicao, getIntegracoes,
  getResumoModulo, getSerieConsolidada, lerOcultos, restaurarPadrao, salvarOcultos,
} from '../services/GeralService';
import { useDados } from '../components/useDados';
import { GChart } from '../components/GChart';
import {
  CartaoSaudeView, ErroWidget, Secao, SeloSimulado, Skeleton, WidgetModulo,
  fmtHora, relTempo,
} from '../components/ui';
import type {
  AlertaGeral, CartaoSaude, ModuloId, PeriodoId, ShellConfig, StatusIntegracao,
} from '../domain/types';
import '../styles/tokens.css';

// ── registro de módulos (§23) ───────────────────────────────────────
interface DefModulo { id: ModuloId; nome: string; icone: ReactNode; rota: string | null; }
const MODULOS: DefModulo[] = [
  { id: 'transito', nome: 'Trânsito', icone: <Car size={15} />, rota: '#/panel-transito-sp' },
  { id: 'ads', nome: 'Ads Intelligence', icone: <Megaphone size={15} />, rota: '#/panel-ads' },
  { id: 'anuncios', nome: 'Consultor Anuncios', icone: <Bot size={15} />, rota: '#/panel-anuncios' },
  { id: 'metaads', nome: 'Meta Ads', icone: <Share2 size={15} />, rota: '#/panel-metaads' },
  { id: 'mercadolivre', nome: 'Mercado Livre', icone: <Store size={15} />, rota: '#/panel-mercadolivre' },
  { id: 'pipedrive', nome: 'Pipedrive', icone: <Handshake size={15} />, rota: '#/panel-pipedrive' },
  { id: 'outlook', nome: 'Outlook', icone: <Mail size={15} />, rota: '#/panel-outlook' },
  { id: 'ecommerce', nome: 'E-commerce', icone: <ShoppingCart size={15} />, rota: null },
  { id: 'compras', nome: 'Compras', icone: <ShoppingBag size={15} />, rota: null },
  { id: 'financeiro', nome: 'Financeiro', icone: <CircleDollarSign size={15} />, rota: null },
  { id: 'datatables', nome: 'DataTables', icone: <Table2 size={15} />, rota: '#/panel-datatables' },
];

const PERIODOS: { id: PeriodoId; rotulo: string }[] = [
  { id: 'hoje', rotulo: 'Hoje' }, { id: '7d', rotulo: '7 dias' }, { id: '30d', rotulo: '30 dias' },
];

type MetricaGrafico = 'faturamento' | 'pedidos' | 'investimento' | 'leads' | 'recebimentos';
const METRICAS: { id: MetricaGrafico; rotulo: string; moeda: boolean }[] = [
  { id: 'faturamento', rotulo: 'Faturamento', moeda: true },
  { id: 'pedidos', rotulo: 'Pedidos', moeda: false },
  { id: 'investimento', rotulo: 'Investimento em mídia', moeda: true },
  { id: 'leads', rotulo: 'Leads', moeda: false },
  { id: 'recebimentos', rotulo: 'Recebimentos', moeda: true },
];

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

function navegar(rota: string) {
  window.location.hash = rota;
}

function rolarPara(id: string) {
  document.querySelector(`[data-ger-sec="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── widget de módulo com estado independente (§31.3) ────────────────
function WidgetDoModulo({ def, periodo, versao }: { def: DefModulo; periodo: PeriodoId; versao: number }) {
  const { dados, carregando, erro, recarregar } = useDados(
    () => getResumoModulo(def.id, periodo),
    [def.id, periodo, versao]
  );
  if (carregando) return <Skeleton altura={196} />;
  if (erro || !dados) {
    return (
      <article className="ger-widget ger-borda-dim">
        <header className="ger-wg-head">
          <span className="ger-wg-ic" aria-hidden>{def.icone}</span>
          <span className="ger-wg-nome">{def.nome}</span>
        </header>
        <ErroWidget mensagem="Não foi possível carregar este resumo." onTentar={recarregar} />
      </article>
    );
  }
  return <WidgetModulo nome={def.nome} icone={def.icone} resumo={dados} rota={def.rota} aoAbrir={navegar} />;
}

// ── linha de saúde (§22) ────────────────────────────────────────────
function LinhaSaude({ alertas, integracoes, visiveis }: {
  alertas: AlertaGeral[] | null;
  integracoes: StatusIntegracao[] | null;
  visiveis: number;
}) {
  if (!alertas || !integracoes) return <Skeleton altura={108} />;

  const comErro = integracoes.filter((i) => i.estado === 'erro').length;
  const conectadas = integracoes.filter((i) => i.estado === 'conectada').length;
  const demo = integracoes.filter((i) => i.estado === 'demonstracao').length;
  const criticos = alertas.filter((a) => a.severidade === 1).length;
  const ultimaSync = integracoes
    .map((i) => i.ultimaSync).filter(Boolean).sort().pop() as string | undefined;

  const cartoes: CartaoSaude[] = [
    {
      id: 'sistema', rotulo: 'Status do sistema',
      valor: comErro === 0 ? 'Online' : 'Com atenção',
      detalhe: `${integracoes.length - comErro} de ${integracoes.length} fontes saudáveis`,
      nivel: comErro === 0 ? 'ok' : comErro >= 2 ? 'critico' : 'atencao',
      rota: 'sec:integracoes',
    },
    {
      id: 'modulos', rotulo: 'Módulos',
      valor: `${visiveis} ativos`,
      detalhe: `${MODULOS.length} disponíveis no dash`,
      nivel: 'ok',
      rota: 'sec:widgets',
    },
    {
      id: 'integracoes', rotulo: 'Integrações',
      valor: `${conectadas} conectadas`,
      detalhe: `${demo} em demonstração · ${comErro} com erro`,
      nivel: comErro > 0 ? 'atencao' : 'ok',
      rota: 'sec:integracoes',
    },
    {
      id: 'alertas', rotulo: 'Alertas em aberto',
      valor: String(alertas.length),
      detalhe: criticos > 0 ? `${criticos} crítico(s)` : 'nenhum crítico',
      nivel: criticos > 0 ? 'critico' : alertas.length > 0 ? 'atencao' : 'ok',
      rota: 'sec:alertas',
    },
    {
      id: 'atualizacao', rotulo: 'Atualização',
      valor: ultimaSync ? relTempo(ultimaSync) : '—',
      detalhe: 'última sincronização geral',
      nivel: 'ok',
      rota: 'sec:integracoes',
    },
  ];

  const abrir = (rota: string) => {
    if (rota.startsWith('sec:')) rolarPara(rota.slice(4));
    else navegar(rota);
  };

  return (
    <div className="ger-saudes">
      {cartoes.map((c) => <CartaoSaudeView key={c.id} cartao={c} aoAbrir={abrir} />)}
    </div>
  );
}

// ── shell ───────────────────────────────────────────────────────────
function Shell({ config }: { config: ShellConfig }) {
  void config;
  const [periodo, setPeriodo] = useState<PeriodoId>('30d');
  const [versao, setVersao] = useState(0);
  const [carimbo, setCarimbo] = useState(() => new Date().toISOString());
  const [metrica, setMetrica] = useState<MetricaGrafico>('faturamento');
  const [personalizar, setPersonalizar] = useState(false);
  const [ocultos, setOcultos] = useState<Set<ModuloId>>(() => lerOcultos());

  const atualizar = () => { setVersao((v) => v + 1); setCarimbo(new Date().toISOString()); };

  const { dados: alertas, carregando: carregandoAlertas } = useDados(() => getAlertas(), [versao]);
  const { dados: integracoes } = useDados(() => getIntegracoes(), [versao]);
  const { dados: atividades } = useDados(() => getAtividades(), [versao]);
  const { dados: serie } = useDados(() => getSerieConsolidada(periodo), [periodo, versao]);
  const { dados: distribuicao } = useDados(() => getDistribuicao(), [versao]);

  const visiveis = useMemo(() => MODULOS.filter((m) => !ocultos.has(m.id)), [ocultos]);

  const alternarWidget = (id: ModuloId) => {
    setOcultos((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      salvarOcultos(novo);
      return novo;
    });
  };

  const restaurar = () => { restaurarPadrao(); setOcultos(new Set()); };

  const mMeta = METRICAS.find((m) => m.id === metrica)!;

  return (
    <div className="ger-shell">
      {/* Header da página (§21) */}
      <div className="ger-head">
        <div className="ger-head-tit">
          <h1><LayoutDashboard size={19} aria-hidden /> Visão Geral</h1>
          <p>Resumo consolidado dos principais indicadores, operações e integrações do Dshow Dash.</p>
        </div>
        <div className="ger-head-acoes">
          <div className="ger-periodos" role="tablist" aria-label="Período">
            {PERIODOS.map((p) => (
              <button key={p.id} role="tab" aria-selected={periodo === p.id}
                className={`ger-periodo${periodo === p.id ? ' is-on' : ''}`}
                onClick={() => setPeriodo(p.id)}>{p.rotulo}</button>
            ))}
          </div>
          <button className="ger-btn" onClick={atualizar} title="Atualizar todos os widgets">
            <RefreshCw size={13} aria-hidden /> Atualizar
          </button>
          <button className={`ger-btn${personalizar ? ' is-on' : ''}`}
            onClick={() => setPersonalizar((v) => !v)} aria-expanded={personalizar}>
            <SlidersHorizontal size={13} aria-hidden /> Personalizar
          </button>
          <span className="ger-carimbo">atualizado às {fmtHora(carimbo)}</span>
        </div>
      </div>

      {/* Personalização fase 1 (§30): mostrar/ocultar widgets */}
      {personalizar && (
        <div className="ger-personalizar">
          <div className="ger-pers-head">
            <strong>Widgets visíveis</strong>
            <button className="ger-btn ger-btn-mini" onClick={restaurar}>
              <RotateCcw size={12} aria-hidden /> Restaurar padrão
            </button>
          </div>
          <div className="ger-pers-lista">
            {MODULOS.map((m) => (
              <label key={m.id} className="ger-pers-item">
                <input type="checkbox" checked={!ocultos.has(m.id)} onChange={() => alternarWidget(m.id)} />
                <span className="ger-wg-ic" aria-hidden>{m.icone}</span> {m.nome}
              </label>
            ))}
          </div>
          <p className="ger-pers-nota">Reordenar e redimensionar os widgets chega na próxima fase — a preferência fica salva neste navegador.</p>
        </div>
      )}

      {/* Saúde geral (§22) */}
      <LinhaSaude alertas={alertas} integracoes={integracoes} visiveis={visiveis.length} />

      {/* Exige atenção (§28) */}
      <div data-ger-sec="alertas">
        {carregandoAlertas ? <Skeleton altura={140} /> : (alertas ?? []).length > 0 && (
          <Secao titulo="Exige atenção" sub="alertas consolidados de todos os módulos">
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
          </Secao>
        )}
      </div>

      {/* Widgets de módulo (§23–§24) */}
      <div data-ger-sec="widgets" className="ger-widgets">
        {visiveis.map((m) => <WidgetDoModulo key={m.id} def={m} periodo={periodo} versao={versao} />)}
      </div>

      {/* Gráficos consolidados (§26) */}
      <div className="ger-duplo">
        <Secao titulo="Evolução consolidada" sub="visão de demonstração — cada ponto virá dos módulos reais"
          acoes={(
            <div className="ger-periodos" role="tablist" aria-label="Métrica">
              {METRICAS.map((m) => (
                <button key={m.id} role="tab" aria-selected={metrica === m.id}
                  className={`ger-periodo${metrica === m.id ? ' is-on' : ''}`}
                  onClick={() => setMetrica(m.id)}>{m.rotulo}</button>
              ))}
            </div>
          )}>
          {!serie ? <Skeleton altura={240} /> : (
            <GChart altura={240} deps={[serie, metrica]} montar={(_e, t) => ({
              grid: { left: 64, right: 14, top: 16, bottom: 30 },
              tooltip: { trigger: 'axis', valueFormatter: (v: number) => (mMeta.moeda ? fmtMoeda(v) : String(v)) },
              xAxis: {
                type: 'category',
                data: serie.map((p) => String(p.dia).slice(8, 10) + '/' + String(p.dia).slice(5, 7)),
                axisLine: { lineStyle: { color: t.borda } }, axisTick: { show: false },
                axisLabel: { color: t.textoDim, fontSize: 10 },
              },
              yAxis: {
                type: 'value',
                axisLabel: { color: t.textoDim, fontSize: 10, formatter: mMeta.moeda ? (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v) : undefined },
                splitLine: { lineStyle: { color: t.borda, opacity: 0.5 } },
              },
              series: [{
                name: mMeta.rotulo, type: 'line', smooth: 0.25, showSymbol: false,
                data: serie.map((p) => p[metrica] as number),
                lineStyle: { width: 2, color: t.primaria },
                itemStyle: { color: t.primaria },
                areaStyle: { color: t.primaria, opacity: 0.1 },
              }],
            })} />
          )}
        </Secao>

        <Secao titulo="Atividade por módulo" sub="distribuição de eventos — demonstração">
          {!distribuicao ? <Skeleton altura={240} /> : (
            <div className="ger-barras">
              {distribuicao.map((d) => {
                const maior = distribuicao[0]?.valor ?? 1;
                return (
                  <div key={d.rotulo} className="ger-barra-row">
                    <span className="ger-barra-rotulo" title={d.rotulo}>{d.rotulo}</span>
                    <span className="ger-barra-track" aria-hidden>
                      <span className="ger-barra-fill" style={{ width: `${Math.max(3, (d.valor / maior) * 100)}%` }} />
                    </span>
                    <span className="ger-barra-valor">{d.valor}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </Secao>
      </div>

      {/* Integrações (§26.3) */}
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
                      : i.estado === 'erro' ? 'Erro' : 'Demonstração'}
                    {i.ultimaSync && <em>{relTempo(i.ultimaSync)}</em>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Secao>
      </div>

      <div className="ger-duplo">
        {/* Atividades recentes (§27) */}
        <Secao titulo="Atividades recentes" sub="últimos eventos nos módulos">
          {!atividades ? <Skeleton altura={220} /> : (
            <div className="ger-atividades">
              {atividades.map((a) => (
                <button key={a.id} className="ger-atv" disabled={!a.rota}
                  onClick={() => a.rota && navegar(a.rota)}>
                  <span className="ger-atv-dot" aria-hidden />
                  <span className="ger-atv-corpo">
                    <strong>{a.descricao} {a.simulado && <SeloSimulado />}</strong>
                    <span>{a.modulo} · {relTempo(a.quando)}</span>
                  </span>
                  {a.rota && <ArrowRight size={12} aria-hidden />}
                </button>
              ))}
            </div>
          )}
        </Secao>

        {/* Atalhos (§29) */}
        <Secao titulo="Atalhos" sub="acesso rápido aos módulos mais usados">
          <div className="ger-atalhos">
            {MODULOS.filter((m) => m.rota).map((m) => (
              <button key={m.id} className="ger-atalho" onClick={() => navegar(m.rota!)}>
                <span className="ger-wg-ic" aria-hidden>{m.icone}</span>
                <span>{m.nome}</span>
              </button>
            ))}
            <button className="ger-atalho" onClick={() => navegar('#/panel-datatables')}>
              <Bell size={15} aria-hidden />
              <span>Alertas do sistema</span>
            </button>
          </div>
        </Secao>
      </div>
    </div>
  );
}

export function App({ config }: { config: ShellConfig }) {
  return <Shell config={config} />;
}
