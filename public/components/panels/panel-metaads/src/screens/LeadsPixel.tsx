// screens/LeadsPixel.tsx — funil (§15), leads (§16), pixel/eventos (§17)
// e atribuição com avisos (§27).
// @version 1.0.0  @created 2026-07-28
import { CheckCircle2, Info, Link2 } from 'lucide-react';
import { getService } from '../services/MetaAdsService';
import { useDados } from '../components/useDados';
import { MAChart } from '../components/MAChart';
import { MAGrid, type ColunaMA } from '../components/MAGrid';
import {
  Carregando, EstadoVazio, Secao, StatusBadge,
  fmtDataHora, fmtMoeda, fmtNumero, fmtPct,
} from '../components/ui';
import type { FiltrosGlobais, Lead } from '../domain/types';

// ── Funil (§15) ─────────────────────────────────────────────────────
export function Funil({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(
    () => getService().getOverview(filtros),
    [filtros.contaId, filtros.periodo, filtros.objetivo]
  );

  if (carregando || !dados) return <Carregando altura={360} />;
  const etapas = dados.funil;
  if (etapas.every((e) => e.valor === 0)) {
    return <EstadoVazio titulo="Sem dados de funil no período" />;
  }

  return (
    <div className="mads-tela">
      <div className="mads-duplo">
        <Secao titulo="Funil de conversão" sub="da impressão à venda no período">
          <MAChart altura={300} deps={[dados]} montar={(_e, t) => ({
            tooltip: { trigger: 'item', formatter: '{b}: {c}' },
            series: [{
              type: 'funnel', left: 8, right: 8, top: 6, bottom: 6,
              minSize: '20%', sort: 'descending', gap: 3,
              label: { color: t.texto, fontSize: 11, formatter: '{b}\n{c}' },
              itemStyle: { borderWidth: 0 },
              data: etapas.map((f, i) => ({
                name: f.rotulo, value: f.valor,
                itemStyle: { color: [t.apoio, t.apoio, t.primaria, t.ok, t.ok][i] ?? t.apoio, opacity: 0.85 - i * 0.08 },
              })),
            }],
          })} />
        </Secao>

        <Secao titulo="Etapas e taxas de passagem" sub="onde o funil perde volume">
          <div className="mads-etapas">
            {etapas.map((e, i) => {
              const anterior = i > 0 ? etapas[i - 1].valor : null;
              const taxa = anterior && anterior > 0 ? (e.valor / anterior) * 100 : null;
              return (
                <div key={e.rotulo} className="mads-etapa">
                  <div className="mads-etapa-topo">
                    <strong>{e.rotulo}</strong>
                    <span>{fmtNumero(e.valor)}</span>
                  </div>
                  <div className="mads-etapa-meta">
                    {taxa !== null && <span>passagem {fmtPct(taxa)}</span>}
                    {e.custo !== undefined && e.custo > 0 && <span>custo/un. {fmtMoeda(e.custo)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mads-obs">
            <Info size={14} aria-hidden />
            <span>Oportunidades e vendas dependem do vínculo com o CRM — na integração real, essas etapas
              vêm do Pipedrive e fecham o ciclo lead → receita.</span>
          </div>
        </Secao>
      </div>
    </div>
  );
}

// ── Leads (§16) ─────────────────────────────────────────────────────
export function Leads({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(
    () => getService().getLeads(filtros),
    [filtros.contaId, filtros.periodo]
  );

  const leads = dados ?? [];
  const novos = leads.filter((l) => l.status === 'novo').length;
  const qualificados = leads.filter((l) => l.status === 'qualificado').length;
  const convertidos = leads.filter((l) => l.status === 'convertido');
  const crmPct = leads.length ? Math.round((leads.filter((l) => l.crmVinculado).length / leads.length) * 100) : 0;
  const receita = convertidos.reduce((s, l) => s + (l.receita ?? 0), 0);

  const colunas: ColunaMA<Lead>[] = [
    { id: 'data', titulo: 'Data', valor: (l) => l.data, render: (l) => fmtDataHora(l.data), largura: 110 },
    { id: 'nome', titulo: 'Lead', valor: (l) => l.nome, largura: 170 },
    { id: 'contato', titulo: 'Contato', valor: (l) => `${l.telefone} ${l.email}`, render: (l) => <span className="mads-contato">{l.telefone}<br />{l.email}</span>, largura: 170 },
    { id: 'produto', titulo: 'Interesse', valor: (l) => l.produtoInteresse },
    { id: 'campanha', titulo: 'Campanha', valor: (l) => l.campanha, largura: 200 },
    { id: 'form', titulo: 'Origem', valor: (l) => l.formulario, largura: 180 },
    { id: 'status', titulo: 'Status', valor: (l) => l.status, render: (l) => <StatusBadge valor={l.status} />, alinhar: 'centro' },
    {
      id: 'crm', titulo: 'CRM', valor: (l) => (l.crmVinculado ? 'sim' : 'não'), alinhar: 'centro',
      render: (l) => (l.crmVinculado ? <CheckCircle2 size={14} className="mads-pos-ic" aria-label="Vinculado ao CRM" /> : <span className="mads-neg">—</span>),
    },
    { id: 'receita', titulo: 'Receita', valor: (l) => l.receita ?? 0, render: (l) => (l.receita ? fmtMoeda(l.receita) : '—'), alinhar: 'direita' },
  ];

  return (
    <div className="mads-tela">
      <div className="mads-chips">
        <span className="mads-chip"><strong>{leads.length}</strong> leads no período</span>
        <span className="mads-chip"><strong>{novos}</strong> novos</span>
        <span className="mads-chip mads-chip-ok"><strong>{qualificados}</strong> qualificados</span>
        <span className="mads-chip mads-chip-ok"><strong>{convertidos.length}</strong> convertidos ({fmtMoeda(receita)})</span>
        <span className={`mads-chip${crmPct < 80 ? ' mads-chip-bad' : ''}`}><strong>{crmPct}%</strong> com CRM vinculado</span>
      </div>

      <Secao titulo="Leads recebidos" sub="formulários e site — do clique ao status comercial">
        <MAGrid dados={leads} colunas={colunas} carregando={carregando}
          exportarNome="meta-leads"
          vazio={{ titulo: 'Nenhum lead no período', detalhe: 'Amplie o período ou verifique as campanhas de leads.' }} />
      </Secao>

      <div className="mads-obs">
        <Info size={14} aria-hidden />
        <span>Dados pessoais aparecem mascarados conforme a permissão do usuário (LGPD). O vínculo com o CRM
          é o que permite medir receita real por campanha — leads sem vínculo quebram essa medição.</span>
      </div>
    </div>
  );
}

// ── Pixel e eventos (§17) ───────────────────────────────────────────
export function Pixel({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(
    () => getService().getPixel(filtros),
    [filtros.contaId]
  );

  if (carregando || !dados) return <Carregando altura={360} />;
  const problemas = dados.eventos.filter((e) => e.saude !== 'ok');

  return (
    <div className="mads-tela">
      <div className="mads-chips">
        <span className="mads-chip"><strong>{dados.nome}</strong> · {dados.id}</span>
        <span className="mads-chip">status <strong><StatusBadge valor={dados.status} /></strong></span>
        <span className={`mads-chip${dados.correspondenciaPct < 60 ? ' mads-chip-bad' : ' mads-chip-ok'}`}>
          <strong>{dados.correspondenciaPct}%</strong> correspondência
        </span>
        <span className="mads-chip"><strong>{dados.dedupPct}%</strong> deduplicação</span>
      </div>

      {problemas.length > 0 && (
        <Secao titulo="Problemas de rastreamento" sub="afetam otimização E atribuição — prioridade máxima">
          <div className="mads-atencao">
            {problemas.map((e) => (
              <div key={e.nome} className="mads-atencao-item mads-prio-1">
                <Link2 size={15} aria-hidden />
                <span className="mads-atencao-corpo">
                  <strong>{e.nome} — <StatusBadge valor={e.saude} /></strong>
                  <span>{e.diagnostico ?? 'Sem atividade recente.'}</span>
                </span>
              </div>
            ))}
          </div>
        </Secao>
      )}

      <Secao titulo="Eventos do pixel" sub="volume recebido nos últimos 14 dias por evento">
        <div className="mads-eventos">
          {dados.eventos.map((e) => (
            <div key={e.nome} className={`mads-evento${e.saude !== 'ok' ? ' is-bad' : ''}`}>
              <div className="mads-evento-info">
                <strong>{e.nome}</strong>
                <span>{fmtNumero(e.recebidos)} recebidos · última atividade {fmtDataHora(e.ultimaAtividade)}</span>
              </div>
              <MAChart altura={54} deps={[e.nome, dados.id]} montar={(_x, t) => ({
                grid: { left: 2, right: 2, top: 4, bottom: 2 },
                tooltip: { trigger: 'axis', formatter: '{c}' },
                xAxis: { type: 'category', show: false, data: e.serie.map((p) => p.dia) },
                yAxis: { type: 'value', show: false },
                series: [{
                  type: 'bar', data: e.serie.map((p) => p.n), barWidth: '58%',
                  itemStyle: { color: e.saude === 'ok' ? t.primaria : t.bad, borderRadius: 2, opacity: 0.85 },
                }],
              })} />
              <StatusBadge valor={e.saude} />
            </div>
          ))}
        </div>
      </Secao>

      <div className="mads-obs">
        <Info size={14} aria-hidden />
        <span>Correspondência baixa (&lt;60%) indica pixel sem dados avançados ou API de conversões ausente.
          Com a integração real, este painel valida evento a evento contra o servidor.</span>
      </div>
    </div>
  );
}

// ── Atribuição (§27) ────────────────────────────────────────────────
export function Atribuicao({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(async () => {
    const svc = getService();
    const [overview, leads] = await Promise.all([svc.getOverview(filtros), svc.getLeads(filtros)]);
    return { overview, leads };
  }, [filtros.contaId, filtros.periodo, filtros.objetivo]);

  if (carregando || !dados) return <Carregando altura={320} />;

  const receitaMeta = dados.overview.kpis.find((k) => k.id === 'receita')?.valor ?? 0;
  const receitaCrm = dados.leads.reduce((s, l) => s + (l.receita ?? 0), 0);
  const maior = Math.max(receitaMeta, receitaCrm, 1);

  return (
    <div className="mads-tela">
      <Secao titulo="Receita: plataforma × CRM" sub="a mesma pergunta, duas respostas — e por que elas divergem">
        <div className="mads-barras">
          <div className="mads-barra-row">
            <span className="mads-barra-rotulo">Meta (atribuída, 7d clique)</span>
            <span className="mads-barra-track" aria-hidden>
              <span className="mads-barra-fill" style={{ width: `${(receitaMeta / maior) * 100}%` }} />
            </span>
            <span className="mads-barra-valor">{fmtMoeda(receitaMeta)}</span>
          </div>
          <div className="mads-barra-row">
            <span className="mads-barra-rotulo">CRM (vendas reais vinculadas)</span>
            <span className="mads-barra-track" aria-hidden>
              <span className="mads-barra-fill is-apoio" style={{ width: `${(receitaCrm / maior) * 100}%` }} />
            </span>
            <span className="mads-barra-valor">{fmtMoeda(receitaCrm)}</span>
          </div>
        </div>
      </Secao>

      <Secao titulo="Como ler esses números" sub="avisos que evitam decisões erradas">
        <div className="mads-avisos">
          <div className="mads-aviso">
            <strong>A Meta atribui por janela, o CRM por venda fechada.</strong>
            <span>A plataforma conta a conversão quando alguém clicou/viu o anúncio dentro da janela (padrão 7 dias
              após clique, 1 dia após visualização). O CRM registra a venda quando ela acontece — às vezes semanas depois.</span>
          </div>
          <div className="mads-aviso">
            <strong>Comparar plataformas somando os números infla o resultado.</strong>
            <span>Google e Meta podem reivindicar a mesma venda. A soma das "receitas atribuídas" quase sempre
              é maior que a receita real do caixa.</span>
          </div>
          <div className="mads-aviso">
            <strong>Vendas fora da janela viram "invisíveis" para a plataforma.</strong>
            <span>Em ciclos longos (como venda de painéis de LED), parte da receita influenciada pela mídia não aparece
              na Meta — por isso o vínculo lead → CRM é a fonte oficial de ROI da metodologia Dshow.</span>
          </div>
          <div className="mads-aviso">
            <strong>Use cada número para a sua função.</strong>
            <span>O número da plataforma serve para otimizar campanhas (sinal rápido); o número do CRM serve
              para decidir orçamento (verdade financeira).</span>
          </div>
        </div>
      </Secao>
    </div>
  );
}
