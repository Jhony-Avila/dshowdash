// screens/Orcamentos.tsx — orçamentos + simulador (briefing §18) e
// performance custo × volume (§19).
// @version 1.0.0  @created 2026-07-28
import { useState } from 'react';
import { Calculator, Wallet } from 'lucide-react';
import { getService } from '../services/MetaAdsService';
import { useDados } from '../components/useDados';
import { MAChart } from '../components/MAChart';
import { MAGrid, type ColunaMA } from '../components/MAGrid';
import {
  Carregando, Secao, StatusBadge, fmtDec, fmtMoeda, fmtNumero, fmtPct,
} from '../components/ui';
import type { Campanha, FiltrosGlobais } from '../domain/types';

// ── Orçamentos (§18) ────────────────────────────────────────────────
export function Orcamentos({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(async () => {
    const svc = getService();
    const [resumo, campanhas] = await Promise.all([
      svc.getResumoOrcamento(filtros), svc.getCampanhas(filtros),
    ]);
    return { resumo, campanhas };
  }, [filtros.contaId, filtros.periodo, filtros.objetivo]);

  // Simulador (§18.4) — projeção a partir de premissas editáveis.
  const [orcMes, setOrcMes] = useState(6000);
  const [cplAlvo, setCplAlvo] = useState(18);
  const [txVenda, setTxVenda] = useState(12);
  const [ticket, setTicket] = useState(4500);

  if (carregando || !dados) return <Carregando altura={360} />;
  const { resumo, campanhas } = dados;

  const leadsProj = cplAlvo > 0 ? Math.round(orcMes / cplAlvo) : 0;
  const vendasProj = Math.round(leadsProj * (txVenda / 100));
  const receitaProj = vendasProj * ticket;
  const roasProj = orcMes > 0 ? receitaProj / orcMes : 0;
  const cpaProj = vendasProj > 0 ? orcMes / vendasProj : 0;

  const colunas: ColunaMA<Campanha>[] = [
    { id: 'nome', titulo: 'Campanha', valor: (c) => c.nome, largura: 250 },
    { id: 'status', titulo: 'Status', valor: (c) => c.status, render: (c) => <StatusBadge valor={c.status} />, alinhar: 'centro' },
    { id: 'orc', titulo: 'Orç. diário', valor: (c) => c.orcamentoDiario, render: (c) => fmtMoeda(c.orcamentoDiario), alinhar: 'direita' },
    {
      id: 'uso', titulo: 'Ritmo de uso', valor: (c) => Math.round(c.orcamentoUtilizadoPct), alinhar: 'direita',
      render: (c) => (
        <span className="mads-uso">
          <span className="mads-uso-track" aria-hidden>
            <span className={`mads-uso-fill${c.orcamentoUtilizadoPct > 90 ? ' is-bad' : c.orcamentoUtilizadoPct < 60 ? ' is-dim' : ''}`}
              style={{ width: `${Math.min(100, c.orcamentoUtilizadoPct)}%` }} />
          </span>
          {Math.round(c.orcamentoUtilizadoPct)}%
        </span>
      ),
    },
    { id: 'inv', titulo: 'Investido no período', valor: (c) => Math.round(c.investimento), render: (c) => fmtMoeda(c.investimento), alinhar: 'direita' },
    { id: 'cpl', titulo: 'CPL', valor: (c) => Math.round(c.cpl), render: (c) => (c.leads > 0 ? fmtMoeda(c.cpl) : '—'), alinhar: 'direita' },
  ];

  return (
    <div className="mads-tela">
      <div className="mads-chips">
        <span className="mads-chip"><Wallet size={12} aria-hidden /> orç. diário ativo <strong>{fmtMoeda(resumo.orcamentoDiarioTotal)}</strong></span>
        <span className="mads-chip">investido no período <strong>{fmtMoeda(resumo.investidoPeriodo)}</strong></span>
        <span className="mads-chip">ritmo <strong>{fmtMoeda(resumo.ritmoDiario)}/dia</strong></span>
        <span className="mads-chip">projeção 30d <strong>{fmtMoeda(resumo.projecaoMes)}</strong></span>
        {resumo.campanhasAcimaRitmo > 0 && <span className="mads-chip mads-chip-bad"><strong>{resumo.campanhasAcimaRitmo}</strong> no limite (&gt;90%)</span>}
        {resumo.campanhasAbaixoRitmo > 0 && <span className="mads-chip"><strong>{resumo.campanhasAbaixoRitmo}</strong> subutilizadas (&lt;60%)</span>}
      </div>

      <Secao titulo="Orçamento por campanha" sub="ritmo de uso do orçamento diário no período">
        <MAGrid dados={campanhas} colunas={colunas} carregando={false}
          exportarNome="meta-orcamentos"
          vazio={{ titulo: 'Nenhuma campanha no filtro' }} />
      </Secao>

      <Secao titulo="Simulador de investimento" sub="premissas editáveis — projeção linear simples, não substitui teste real"
        acoes={<Calculator size={15} aria-hidden />}>
        <div className="mads-sim">
          <div className="mads-sim-form">
            <label className="mads-sim-campo">Orçamento mensal (R$)
              <input type="number" min={0} value={orcMes} onChange={(e) => setOrcMes(Number(e.target.value))} />
            </label>
            <label className="mads-sim-campo">CPL alvo (R$)
              <input type="number" min={0} step={0.5} value={cplAlvo} onChange={(e) => setCplAlvo(Number(e.target.value))} />
            </label>
            <label className="mads-sim-campo">Taxa lead → venda (%)
              <input type="number" min={0} max={100} value={txVenda} onChange={(e) => setTxVenda(Number(e.target.value))} />
            </label>
            <label className="mads-sim-campo">Ticket médio (R$)
              <input type="number" min={0} value={ticket} onChange={(e) => setTicket(Number(e.target.value))} />
            </label>
          </div>
          <div className="mads-sim-res">
            <div className="mads-sim-linha"><span>Leads projetados</span><strong>{fmtNumero(leadsProj)}/mês</strong></div>
            <div className="mads-sim-linha"><span>Vendas projetadas</span><strong>{fmtNumero(vendasProj)}/mês</strong></div>
            <div className="mads-sim-linha"><span>CPA projetado</span><strong>{vendasProj > 0 ? fmtMoeda(cpaProj) : '—'}</strong></div>
            <div className="mads-sim-linha"><span>Receita projetada</span><strong>{fmtMoeda(receitaProj)}</strong></div>
            <div className="mads-sim-linha mads-sim-total"><span>ROAS projetado</span><strong>{fmtDec(roasProj)}</strong></div>
          </div>
        </div>
      </Secao>
    </div>
  );
}

// ── Performance (§19) ───────────────────────────────────────────────
export function Performance({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(
    () => getService().getCampanhas(filtros),
    [filtros.contaId, filtros.periodo, filtros.objetivo]
  );

  if (carregando || !dados) return <Carregando altura={360} />;
  const comLeads = dados.filter((c) => c.leads > 0 && c.investimento > 0);
  const porRoas = [...dados].filter((c) => c.receita > 0).sort((a, b) => b.roas - a.roas);

  const colunas: ColunaMA<Campanha>[] = [
    { id: 'nome', titulo: 'Campanha', valor: (c) => c.nome, largura: 250 },
    { id: 'inv', titulo: 'Investimento', valor: (c) => Math.round(c.investimento), render: (c) => fmtMoeda(c.investimento), alinhar: 'direita' },
    { id: 'leads', titulo: 'Leads', valor: (c) => c.leads, alinhar: 'direita' },
    { id: 'cpl', titulo: 'CPL', valor: (c) => Math.round(c.cpl), render: (c) => (c.leads > 0 ? fmtMoeda(c.cpl) : '—'), alinhar: 'direita' },
    { id: 'ctr', titulo: 'CTR', valor: (c) => Math.round(c.ctr * 100) / 100, render: (c) => fmtPct(c.ctr), alinhar: 'direita' },
    { id: 'receita', titulo: 'Receita', valor: (c) => Math.round(c.receita), render: (c) => fmtMoeda(c.receita), alinhar: 'direita' },
    {
      id: 'roas', titulo: 'ROAS', valor: (c) => Math.round(c.roas * 100) / 100, alinhar: 'direita',
      render: (c) => <span className={c.roas >= 4 ? 'mads-pos' : c.roas < 1.5 ? 'mads-neg' : undefined}>{fmtDec(c.roas)}</span>,
    },
  ];

  return (
    <div className="mads-tela">
      <Secao titulo="Custo × volume por campanha" sub="cada bolha é uma campanha — tamanho = investimento. Ideal: baixo CPL com alto volume (canto inferior direito)">
        <MAChart altura={320} deps={[dados]} montar={(_e, t) => ({
          grid: { left: 64, right: 24, top: 24, bottom: 44 },
          tooltip: {
            trigger: 'item',
            formatter: (p: { data: [number, number, number, string] }) =>
              `${p.data[3]}<br/>Leads: ${p.data[0]} · CPL: ${fmtMoeda(p.data[1])}<br/>Investimento: ${fmtMoeda(p.data[2])}`,
          },
          xAxis: {
            type: 'value', name: 'Leads', nameLocation: 'middle', nameGap: 28,
            nameTextStyle: { color: t.textoDim, fontSize: 10 },
            axisLabel: { color: t.textoDim, fontSize: 10 },
            splitLine: { lineStyle: { color: t.borda, opacity: 0.4 } },
          },
          yAxis: {
            type: 'value', name: 'CPL (R$)', nameTextStyle: { color: t.textoDim, fontSize: 10 },
            axisLabel: { color: t.textoDim, fontSize: 10 },
            splitLine: { lineStyle: { color: t.borda, opacity: 0.4 } },
          },
          series: [{
            type: 'scatter',
            data: comLeads.map((c) => [c.leads, Math.round(c.cpl * 100) / 100, Math.round(c.investimento), c.nome]),
            symbolSize: (d: [number, number, number]) => Math.max(12, Math.min(46, Math.sqrt(d[2]) / 2.6)),
            itemStyle: { color: t.primaria, opacity: 0.6, borderColor: t.primaria, borderWidth: 1 },
          }],
        })} />
      </Secao>

      <Secao titulo="Ranking por retorno" sub="ROAS pela atribuição da plataforma — confirme com o CRM antes de realocar orçamento (ver Atribuição)">
        <MAGrid dados={porRoas.length > 0 ? porRoas : dados} colunas={colunas} carregando={false}
          exportarNome="meta-performance"
          vazio={{ titulo: 'Sem dados no filtro' }} />
      </Secao>
    </div>
  );
}
