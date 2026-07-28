// screens/Sistema.tsx — central de trabalho (§7), relatórios (§20),
// alertas (§21), automações (§22), sincronização (§23) e config (§24).
// @version 1.0.0  @created 2026-07-28
import { useState } from 'react';
import {
  Activity, AlertTriangle, ArrowRight, Bell, Bot, ChartNoAxesCombined,
  CheckCircle2, Clapperboard, FileSpreadsheet, FlaskConical, Info, Link2,
  ShieldAlert, Users, Wallet,
} from 'lucide-react';
import { getCenario, getService, setCenario } from '../services/MetaAdsService';
import { useDados } from '../components/useDados';
import { MAGrid, type ColunaMA } from '../components/MAGrid';
import {
  Carregando, EstadoVazio, Secao, StatusBadge, fmtDataHora, fmtNumero,
} from '../components/ui';
import type { CenarioId, FiltrosGlobais, SecaoId, SyncJob } from '../domain/types';

// ── Central de trabalho (§7) ────────────────────────────────────────
export function Central({ filtros, aoNavegar }: {
  filtros: FiltrosGlobais;
  aoNavegar: (s: SecaoId) => void;
}) {
  const { dados, carregando } = useDados(async () => {
    const svc = getService();
    const [campanhas, conjuntos, anuncios, criativos, leads, pixel, resumo] = await Promise.all([
      svc.getCampanhas(filtros), svc.getConjuntos(filtros), svc.getAnuncios(filtros),
      svc.getCriativos(filtros), svc.getLeads(filtros), svc.getPixel(filtros),
      svc.getResumoOrcamento(filtros),
    ]);
    return { campanhas, conjuntos, anuncios, criativos, leads, pixel, resumo };
  }, [filtros.contaId, filtros.periodo, filtros.objetivo]);

  if (carregando || !dados) return <Carregando altura={340} />;

  const filas: { qtd: number; titulo: string; detalhe: string; secao: SecaoId; icone: React.ReactNode }[] = [
    { qtd: dados.leads.filter((l) => l.status === 'novo').length, titulo: 'Leads sem contato', detalhe: 'entraram e ninguém respondeu', secao: 'leads', icone: <Users size={16} /> },
    { qtd: dados.anuncios.filter((a) => a.status === 'reprovada').length, titulo: 'Anúncios reprovados', detalhe: 'sem entrega até correção', secao: 'qualidade', icone: <ShieldAlert size={16} /> },
    { qtd: dados.criativos.filter((c) => c.fadiga === 'alta').length, titulo: 'Criativos fatigados', detalhe: 'trocar criativo esta semana', secao: 'criativos', icone: <Clapperboard size={16} /> },
    { qtd: dados.conjuntos.filter((c) => c.status === 'aprendizado_limitado').length, titulo: 'Aprendizado limitado', detalhe: 'conjuntos sem volume de conversão', secao: 'conjuntos', icone: <Activity size={16} /> },
    { qtd: dados.resumo.campanhasAcimaRitmo, titulo: 'Orçamento no limite', detalhe: 'ritmo de gasto acima de 90%', secao: 'orcamentos', icone: <Wallet size={16} /> },
    { qtd: dados.pixel.eventos.filter((e) => e.saude !== 'ok').length, titulo: 'Eventos com problema', detalhe: 'pixel/rastreamento a verificar', secao: 'pixel', icone: <Link2 size={16} /> },
    { qtd: dados.leads.filter((l) => !l.crmVinculado).length, titulo: 'Leads sem CRM', detalhe: 'vínculo quebra a medição de ROI', secao: 'leads', icone: <ChartNoAxesCombined size={16} /> },
  ];

  const ativas = filas.filter((f) => f.qtd > 0);

  return (
    <div className="mads-tela">
      <Secao titulo="Central de trabalho" sub="tudo que precisa de ação humana, em um lugar só — clique para ir direto à fila">
        {ativas.length === 0
          ? <EstadoVazio titulo="Nenhuma pendência agora" detalhe="A operação está em dia — as filas aparecem aqui quando algo precisar de ação." />
          : (
            <div className="mads-filas">
              {ativas.map((f) => (
                <button key={f.titulo} className="mads-fila" onClick={() => aoNavegar(f.secao)}>
                  <span className="mads-fila-qtd">{f.qtd}</span>
                  <span className="mads-fila-corpo">
                    <strong>{f.titulo}</strong>
                    <span>{f.detalhe}</span>
                  </span>
                  {f.icone}
                </button>
              ))}
            </div>
          )}
      </Secao>

      <div className="mads-obs">
        <Info size={14} aria-hidden />
        <span>As filas são recalculadas a cada carregamento com os filtros do topo. Na integração real,
          cada fila vira também um alerta proativo (ver Alertas e Automações).</span>
      </div>
    </div>
  );
}

// ── Relatórios (§20) ────────────────────────────────────────────────
export function Relatorios({ aoNavegar }: { aoNavegar: (s: SecaoId) => void }) {
  const atalhos: { titulo: string; detalhe: string; secao: SecaoId }[] = [
    { titulo: 'Performance de campanhas', detalhe: 'investimento, CPL, ROAS por campanha (CSV)', secao: 'campanhas' },
    { titulo: 'Leads do período', detalhe: 'lista completa com status e origem (CSV)', secao: 'leads' },
    { titulo: 'Criativos e fadiga', detalhe: 'score, dias ativo e retenção (CSV)', secao: 'criativos' },
    { titulo: 'Posicionamentos', detalhe: 'CPL comparado entre Feed, Reels e Stories', secao: 'posicionamentos' },
    { titulo: 'Orçamento e ritmo', detalhe: 'uso do orçamento diário por campanha', secao: 'orcamentos' },
    { titulo: 'Funil completo', detalhe: 'da impressão à venda, com taxas de passagem', secao: 'funil' },
  ];

  return (
    <div className="mads-tela">
      <Secao titulo="Relatórios" sub="cada relatório abre a seção correspondente — o botão CSV da tabela gera o arquivo">
        <div className="mads-cards-rel">
          {atalhos.map((a) => (
            <button key={a.titulo} className="mads-card-rel" onClick={() => aoNavegar(a.secao)}>
              <FileSpreadsheet size={16} aria-hidden />
              <strong>{a.titulo}</strong>
              <span>{a.detalhe}</span>
            </button>
          ))}
        </div>
      </Secao>

      <div className="mads-obs">
        <Info size={14} aria-hidden />
        <span>Relatórios agendados por e-mail (semanal para o comercial, mensal executivo) entram na fase
          da integração real, junto com o histórico de envios.</span>
      </div>
    </div>
  );
}

// ── Alertas (§21) ───────────────────────────────────────────────────
export function Alertas({ filtros, aoNavegar }: {
  filtros: FiltrosGlobais;
  aoNavegar: (s: SecaoId) => void;
}) {
  const { dados, carregando } = useDados(
    () => getService().getAlertas(filtros),
    [filtros.contaId, filtros.periodo, filtros.objetivo]
  );

  if (carregando) return <Carregando altura={300} />;

  return (
    <div className="mads-tela">
      <Secao titulo="Alertas" sub="condições detectadas automaticamente nos dados do período">
        {(dados ?? []).length === 0
          ? <EstadoVazio titulo="Nenhum alerta ativo" detalhe="Quando algo sair do padrão (CPL, entrega, pixel, orçamento), aparece aqui." />
          : (
            <div className="mads-atencao">
              {(dados ?? []).map((a) => (
                <button key={a.id} className={`mads-atencao-item mads-prio-${a.prioridade}`}
                  onClick={() => aoNavegar(a.secao)}>
                  <Bell size={15} aria-hidden />
                  <span className="mads-atencao-corpo">
                    <strong>{a.mensagem}</strong>
                    <span>{a.recomendacao}</span>
                  </span>
                  <span className="mads-atencao-acao">Abrir <ArrowRight size={11} aria-hidden /></span>
                </button>
              ))}
            </div>
          )}
      </Secao>

      <div className="mads-obs">
        <Info size={14} aria-hidden />
        <span>Na integração real os alertas ganham canal (e-mail/WhatsApp), histórico e limiares configuráveis
          por conta — os limiares padrão vêm da metodologia Dshow.</span>
      </div>
    </div>
  );
}

// ── Automações (§22) ────────────────────────────────────────────────
export function Automacoes() {
  const catalogo = [
    { titulo: 'Pausar criativo fatigado', detalhe: 'fadiga alta + CPL 30% acima da média por 5 dias → pausa e avisa', gatilho: 'diário' },
    { titulo: 'Alerta de CPL fora da meta', detalhe: 'CPL do dia acima do limiar da conta → notifica o gestor', gatilho: 'diário' },
    { titulo: 'Lead novo → CRM', detalhe: 'cria negócio no Pipedrive com origem e campanha preenchidas', gatilho: 'tempo real' },
    { titulo: 'Guardião de orçamento', detalhe: 'ritmo projetado estoura o teto mensal → reduz e avisa', gatilho: 'diário' },
    { titulo: 'Vigia do pixel', detalhe: 'evento crítico sem atividade por 24h → alerta imediato', gatilho: 'por hora' },
    { titulo: 'Relatório semanal comercial', detalhe: 'resumo de leads e custo por produto para o time de vendas', gatilho: 'semanal' },
  ];

  return (
    <div className="mads-tela">
      <Secao titulo="Automações" sub="catálogo do que será automatizado na integração real — regras da metodologia Dshow">
        <div className="mads-cards-rel">
          {catalogo.map((c) => (
            <div key={c.titulo} className="mads-card-rel is-static">
              <Bot size={16} aria-hidden />
              <strong>{c.titulo}</strong>
              <span>{c.detalhe}</span>
              <span className="mads-card-gatilho">gatilho: {c.gatilho} · <em>em preparação</em></span>
            </div>
          ))}
        </div>
      </Secao>

      <div className="mads-obs">
        <Info size={14} aria-hidden />
        <span>Automações executam apenas com a integração real e sempre com trilha de auditoria: o que foi
          feito, quando, por qual regra e com opção de desfazer.</span>
      </div>
    </div>
  );
}

// ── Sincronização (§23) ─────────────────────────────────────────────
export function Sincronizacao() {
  const { dados, carregando } = useDados(() => getService().getSyncJobs(), []);

  const colunas: ColunaMA<SyncJob>[] = [
    { id: 'recurso', titulo: 'Recurso', valor: (j) => j.recurso, largura: 180 },
    { id: 'status', titulo: 'Status', valor: (j) => j.status, render: (j) => <StatusBadge valor={j.status} />, alinhar: 'centro' },
    { id: 'ultima', titulo: 'Última execução', valor: (j) => j.ultima, render: (j) => fmtDataHora(j.ultima), alinhar: 'direita' },
    { id: 'proxima', titulo: 'Próxima', valor: (j) => j.proxima, render: (j) => fmtDataHora(j.proxima), alinhar: 'direita' },
    { id: 'proc', titulo: 'Processados', valor: (j) => j.processados, render: (j) => fmtNumero(j.processados), alinhar: 'direita' },
    { id: 'novos', titulo: 'Novos', valor: (j) => j.novos, alinhar: 'direita' },
    {
      id: 'erros', titulo: 'Erros', valor: (j) => j.erros, alinhar: 'direita',
      render: (j) => (j.erros > 0 ? <span className="mads-neg">{j.erros}</span> : '0'),
    },
  ];

  const comErro = (dados ?? []).filter((j) => j.status === 'erro');

  return (
    <div className="mads-tela">
      {comErro.length > 0 && (
        <div className="mads-atencao">
          {comErro.map((j) => (
            <div key={j.recurso} className="mads-atencao-item mads-prio-1">
              <AlertTriangle size={15} aria-hidden />
              <span className="mads-atencao-corpo">
                <strong>Falha na sincronização de {j.recurso}</strong>
                <span>{j.erros} erro(s) na última execução — os números dessa área podem estar desatualizados.</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <Secao titulo="Sincronização com a Meta" sub="cada recurso tem seu próprio ciclo — transparência total sobre a idade dos dados">
        <MAGrid dados={dados ?? []} colunas={colunas} carregando={carregando}
          exportarNome="meta-sync"
          vazio={{ titulo: 'Sem jobs de sincronização' }} />
      </Secao>
    </div>
  );
}

// ── Configurações (§24) ─────────────────────────────────────────────
const CENARIOS_UI: { id: CenarioId; rotulo: string; detalhe: string }[] = [
  { id: 'saudavel', rotulo: 'Operação saudável', detalhe: 'tudo em dia, tendência positiva' },
  { id: 'queda_performance', rotulo: 'Queda de performance', detalhe: 'CPL subindo, CTR caindo há 30 dias' },
  { id: 'falha_pixel', rotulo: 'Falha no pixel', detalhe: 'Purchase sem eventos há 48h' },
  { id: 'orcamento_critico', rotulo: 'Orçamento no limite', detalhe: 'ritmo de gasto acima de 90%' },
  { id: 'fadiga_criativo', rotulo: 'Fadiga generalizada', detalhe: 'maioria dos criativos saturados' },
  { id: 'campanha_reprovada', rotulo: 'Anúncios reprovados', detalhe: 'políticas de publicidade bloqueando entrega' },
  { id: 'sem_dados', rotulo: 'Conta vazia', detalhe: 'sem campanhas — estados vazios do painel' },
];

export function Config({ aoTrocarCenario }: { aoTrocarCenario: () => void }) {
  const { dados: contas, carregando } = useDados(() => getService().getContas(), []);
  const [cenario, setCenarioLocal] = useState<CenarioId>(getCenario());

  const trocar = (id: CenarioId) => {
    setCenario(id);
    setCenarioLocal(id);
    aoTrocarCenario();
  };

  return (
    <div className="mads-tela">
      <Secao titulo="Contas conectadas" sub="contas de anúncio da Meta vinculadas ao painel">
        {carregando ? <Carregando altura={120} /> : (
          <div className="mads-contas">
            {(contas ?? []).map((c) => (
              <div key={c.id} className="mads-conta">
                <span className="mads-conta-avatar">{c.nome.slice(0, 1)}</span>
                <div className="mads-fila-corpo">
                  <strong>{c.nome}</strong>
                  <span>{c.idExterno} · {c.pagina} · {c.instagram} · {c.moeda} · {c.fuso}</span>
                </div>
                <CheckCircle2 size={15} className="mads-pos-ic" aria-label="Conectada" />
              </div>
            ))}
          </div>
        )}
      </Secao>

      <Secao titulo="Cenário de demonstração" sub="troque o estado simulado da conta para validar cada comportamento do painel"
        acoes={<FlaskConical size={15} aria-hidden />}>
        <div className="mads-cenarios">
          {CENARIOS_UI.map((c) => (
            <button key={c.id} className={`mads-cenario${cenario === c.id ? ' is-on' : ''}`}
              onClick={() => trocar(c.id)}>
              <FlaskConical size={13} aria-hidden />
              <strong>{c.rotulo}</strong>
              <span>{c.detalhe}</span>
            </button>
          ))}
        </div>
      </Secao>

      <div className="mads-obs">
        <Info size={14} aria-hidden />
        <span>Este módulo está em modo demonstração: todos os dados são simulados de forma determinística.
          A conexão OAuth com a Meta substitui apenas a camada de dados — todas as telas permanecem as mesmas.</span>
      </div>
    </div>
  );
}
