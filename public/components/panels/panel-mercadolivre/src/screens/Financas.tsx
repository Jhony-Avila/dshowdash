// screens/Financas.tsx — Vendas (§9), Financeiro (§19), Rentabilidade (§20),
// Preços (§13), Envios (§17) e Reputação (§18).
// @version 1.0.0  @created 2026-07-28
import { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { getService } from '../services/MercadoLivreService';
import { useDados } from '../components/useDados';
import { MLChart } from '../components/MLChart';
import { MLGrid, type ColunaML } from '../components/MLGrid';
import {
  Barras, Carregando, EstadoVazio, Secao, StatusBadge, fmtData, fmtMoeda, fmtPct,
} from '../components/ui';
import type {
  Envio, FiltrosGlobais, LancamentoFinanceiro, RentabilidadeItem,
} from '../domain/types';

// ── Vendas ──────────────────────────────────────────────────────────

export function Vendas({ filtros }: { filtros: FiltrosGlobais }) {
  const svc = getService();
  const { dados, carregando } = useDados(async () => {
    const [overview, pedidos] = await Promise.all([
      svc.getOverview(filtros), svc.getPedidos(filtros),
    ]);
    return { overview, pedidos };
  }, [filtros.contaId, filtros.periodo, filtros.comparacao]);

  if (carregando || !dados) return <Carregando altura={400} />;
  const validos = dados.pedidos.filter((p) => p.status !== 'cancelado');
  if (validos.length === 0) return <EstadoVazio titulo="Sem vendas no período" detalhe="Ajuste o período nos filtros do topo." />;

  // Heatmap dia da semana × faixa de hora.
  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const FAIXAS = ['8–11h', '11–14h', '14–17h', '17–21h'];
  const heat: number[][] = [];
  for (const p of validos) {
    const d = new Date(p.data);
    const faixa = d.getHours() < 11 ? 0 : d.getHours() < 14 ? 1 : d.getHours() < 17 ? 2 : 3;
    heat.push([faixa, d.getDay(), p.valorBruto]);
  }
  const agregado = new Map<string, number>();
  for (const [x, y, v] of heat) agregado.set(`${x},${y}`, (agregado.get(`${x},${y}`) ?? 0) + v);
  const heatDados = [...agregado.entries()].map(([k, v]) => {
    const [x, y] = k.split(',').map(Number);
    return [x, y, Math.round(v)];
  });
  const maxHeat = Math.max(...heatDados.map((d) => d[2] as number), 1);

  // Curva ABC (Pareto por produto).
  const porProduto = new Map<string, number>();
  for (const p of validos) porProduto.set(p.produto, (porProduto.get(p.produto) ?? 0) + p.valorBruto);
  const pareto = [...porProduto.entries()].sort((a, b) => b[1] - a[1]);
  const totalFat = pareto.reduce((s, [, v]) => s + v, 0);
  let acumulado = 0;
  const paretoDados = pareto.map(([nome, v]) => {
    acumulado += v;
    return { nome: nome.length > 22 ? nome.slice(0, 22) + '…' : nome, valor: Math.round(v), acumPct: (acumulado / totalFat) * 100 };
  });

  return (
    <div className="ml-tela">
      <Secao titulo="Curva ABC de produtos" sub="barras = faturamento · linha = % acumulado (Pareto)">
        <MLChart altura={280} deps={[dados]} montar={(_e, t) => ({
          grid: { left: 64, right: 48, top: 20, bottom: 70 },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: paretoDados.map((p) => p.nome), axisLabel: { color: t.textoDim, fontSize: 9, rotate: 32 }, axisLine: { lineStyle: { color: t.borda } } },
          yAxis: [
            { type: 'value', axisLabel: { color: t.textoDim, fontSize: 10, formatter: (v: number) => `${Math.round(v / 1000)}k` }, splitLine: { lineStyle: { color: t.borda, opacity: 0.5 } } },
            { type: 'value', max: 100, axisLabel: { color: t.textoDim, fontSize: 10, formatter: '{value}%' }, splitLine: { show: false } },
          ],
          series: [
            { name: 'Faturamento', type: 'bar', data: paretoDados.map((p) => p.valor), itemStyle: { color: t.primaria, borderRadius: [4, 4, 0, 0] }, barMaxWidth: 26 },
            { name: '% acumulado', type: 'line', yAxisIndex: 1, data: paretoDados.map((p) => Math.round(p.acumPct)), lineStyle: { width: 2, color: t.apoio }, itemStyle: { color: t.apoio }, symbolSize: 5 },
          ],
        })} />
      </Secao>

      <Secao titulo="Mapa de calor — quando as vendas acontecem" sub="dia da semana × faixa de horário (faturamento)">
        <MLChart altura={230} deps={[dados]} montar={(_e, t) => ({
          grid: { left: 64, right: 16, top: 10, bottom: 30 },
          tooltip: { position: 'top', formatter: (p: { value: number[] }) => `${DIAS[p.value[1]]} · ${FAIXAS[p.value[0]]}: ${fmtMoeda(p.value[2])}` },
          xAxis: { type: 'category', data: FAIXAS, axisLabel: { color: t.textoDim, fontSize: 10 }, axisLine: { lineStyle: { color: t.borda } } },
          yAxis: { type: 'category', data: DIAS, axisLabel: { color: t.textoDim, fontSize: 10 }, axisLine: { lineStyle: { color: t.borda } } },
          visualMap: { min: 0, max: maxHeat, show: false, inRange: { color: [t.superficie, t.primaria] } },
          series: [{ type: 'heatmap', data: heatDados, itemStyle: { borderColor: t.superficie, borderWidth: 2, borderRadius: 4 } }],
        })} />
      </Secao>
    </div>
  );
}

// ── Financeiro ──────────────────────────────────────────────────────

export function Financeiro({ filtros }: { filtros: FiltrosGlobais }) {
  const svc = getService();
  const { dados, carregando } = useDados(async () => {
    const [resumo, lanc] = await Promise.all([
      svc.getResumoFinanceiro(filtros), svc.getLancamentos(filtros),
    ]);
    return { resumo, lanc };
  }, [filtros.contaId, filtros.periodo]);

  if (carregando || !dados) return <Carregando altura={400} />;
  const r = dados.resumo;

  // Waterfall: bruto → deduções → líquido → custo → lucro.
  const passos = [
    { nome: 'Vendas brutas', valor: r.vendasBrutas, tipo: 'total' },
    { nome: 'Descontos', valor: -r.descontos, tipo: 'ded' },
    { nome: 'Tarifas', valor: -r.tarifas, tipo: 'ded' },
    { nome: 'Fretes', valor: -r.fretes, tipo: 'ded' },
    { nome: 'Impostos est.', valor: -r.impostosEstimados, tipo: 'ded' },
    { nome: 'Devoluções', valor: -r.devolucoes, tipo: 'ded' },
    { nome: 'Valor líquido', valor: r.valorLiquido, tipo: 'total' },
    { nome: 'Custo produtos', valor: -r.custoProdutos, tipo: 'ded' },
    { nome: 'Lucro bruto', valor: r.lucroBruto, tipo: 'total' },
  ];
  // Base invisível para o efeito cascata.
  let corrente = 0;
  const base: number[] = []; const visivel: number[] = [];
  for (const p of passos) {
    if (p.tipo === 'total') { base.push(0); visivel.push(Math.round(p.valor)); corrente = p.valor; }
    else { const novo = corrente + p.valor; base.push(Math.round(Math.min(corrente, novo))); visivel.push(Math.round(Math.abs(p.valor))); corrente = novo; }
  }

  const colunas: ColunaML<LancamentoFinanceiro>[] = [
    { id: 'pedido', titulo: 'Pedido', valor: (l) => l.pedidoId, largura: 110 },
    { id: 'venda', titulo: 'Venda', valor: (l) => l.dataVenda, render: (l) => fmtData(l.dataVenda), largura: 80 },
    { id: 'prev', titulo: 'Previsto', valor: (l) => l.dataPrevista, render: (l) => fmtData(l.dataPrevista), largura: 84 },
    { id: 'bruto', titulo: 'Bruto', valor: (l) => l.valorBruto, render: (l) => fmtMoeda(l.valorBruto), alinhar: 'direita', largura: 110 },
    { id: 'tarifa', titulo: 'Tarifa', valor: (l) => l.tarifa, render: (l) => `-${fmtMoeda(l.tarifa)}`, alinhar: 'direita', largura: 100 },
    { id: 'liquido', titulo: 'Líquido', valor: (l) => l.valorLiquido, render: (l) => fmtMoeda(l.valorLiquido), alinhar: 'direita', largura: 110 },
    { id: 'status', titulo: 'Status', valor: (l) => l.status, render: (l) => <StatusBadge valor={l.status} />, alinhar: 'centro', largura: 104 },
  ];

  return (
    <div className="ml-tela">
      <div className="ml-chips">
        <span className="ml-chip">A receber: <strong>{fmtMoeda(r.aReceber)}</strong></span>
        <span className="ml-chip">Recebido: <strong>{fmtMoeda(r.recebido)}</strong></span>
        <span className="ml-chip">Margem: <strong>{fmtPct(r.margemPct)}</strong></span>
      </div>

      <Secao titulo="Decomposição da receita" sub="do bruto ao lucro (waterfall — §9.3)">
        <MLChart altura={280} deps={[dados]} montar={(_e, t) => ({
          grid: { left: 70, right: 16, top: 18, bottom: 56 },
          tooltip: { trigger: 'axis', formatter: (ps: { dataIndex: number }[]) => {
            const i = ps[0].dataIndex;
            return `${passos[i].nome}: ${fmtMoeda(passos[i].valor)}`;
          } },
          xAxis: { type: 'category', data: passos.map((p) => p.nome), axisLabel: { color: t.textoDim, fontSize: 9.5, rotate: 26 }, axisLine: { lineStyle: { color: t.borda } } },
          yAxis: { type: 'value', axisLabel: { color: t.textoDim, fontSize: 10, formatter: (v: number) => `${Math.round(v / 1000)}k` }, splitLine: { lineStyle: { color: t.borda, opacity: 0.5 } } },
          series: [
            { type: 'bar', stack: 'w', itemStyle: { color: 'transparent' }, emphasis: { itemStyle: { color: 'transparent' } }, data: base, barMaxWidth: 34, tooltip: { show: false } },
            { type: 'bar', stack: 'w', barMaxWidth: 34, data: visivel.map((v, i) => ({
                value: v,
                itemStyle: { color: passos[i].tipo === 'total' ? (passos[i].nome === 'Lucro bruto' ? t.ok : t.apoio) : t.warn, borderRadius: [4, 4, 0, 0] },
              })) },
          ],
        })} />
      </Secao>

      <Secao titulo="Lançamentos" sub="pedido a pedido — status de recebimento (conciliação plena chega com o ERP)">
        <MLGrid dados={dados.lanc} colunas={colunas} exportarNome="financeiro-mercadolivre"
          vazio={{ titulo: 'Nenhum lançamento no período' }} />
      </Secao>
    </div>
  );
}

// ── Rentabilidade ───────────────────────────────────────────────────

export function Rentabilidade({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(
    () => getService().getRentabilidade(filtros), [filtros.contaId, filtros.periodo]
  );

  const colunas: ColunaML<RentabilidadeItem>[] = [
    { id: 'nome', titulo: 'Produto', valor: (x) => x.nome },
    { id: 'un', titulo: 'Un.', valor: (x) => x.unidades, alinhar: 'direita', largura: 56 },
    { id: 'receita', titulo: 'Receita', valor: (x) => x.receita, render: (x) => fmtMoeda(x.receita), alinhar: 'direita', largura: 116 },
    { id: 'custo', titulo: 'Custo', valor: (x) => x.custo, render: (x) => fmtMoeda(x.custo), alinhar: 'direita', largura: 110 },
    { id: 'tarifa', titulo: 'Tarifa', valor: (x) => x.tarifa, render: (x) => fmtMoeda(x.tarifa), alinhar: 'direita', largura: 100 },
    { id: 'lucro', titulo: 'Lucro', valor: (x) => x.lucro, render: (x) => (
      <span className={x.lucro < 0 ? 'ml-neg' : 'ml-pos'}>{fmtMoeda(x.lucro)}</span>
    ), alinhar: 'direita', largura: 116 },
    { id: 'margem', titulo: 'Margem', valor: (x) => x.margemPct, render: (x) => fmtPct(x.margemPct), alinhar: 'direita', largura: 80 },
  ];

  return (
    <div className="ml-tela">
      <Secao titulo="Rentabilidade por produto" sub="receita − custo − tarifa − frete − imposto estimado">
        <MLGrid dados={dados ?? []} colunas={colunas} carregando={carregando}
          exportarNome="rentabilidade-mercadolivre" vazio={{ titulo: 'Sem vendas no período' }} />
      </Secao>
      {dados && dados.some((d) => d.lucro < 0) && (
        <div className="ml-obs">⚠ Produtos com lucro negativo no período — candidatos a revisão de preço ou pausa. Veja também a matriz giro×margem no Estoque.</div>
      )}
    </div>
  );
}

// ── Preços (simulador §13.3) ────────────────────────────────────────

export function Precos() {
  const [custo, setCusto] = useState(3400);
  const [preco, setPreco] = useState(5590);
  const [tarifaPct, setTarifaPct] = useState(14);
  const [frete, setFrete] = useState(90);
  const [impostoPct, setImpostoPct] = useState(8);

  const calc = useMemo(() => {
    const tarifa = preco * (tarifaPct / 100);
    const imposto = preco * (impostoPct / 100);
    const lucro = preco - custo - tarifa - frete - imposto;
    const margem = preco > 0 ? (lucro / preco) * 100 : 0;
    const equilibrio = (custo + frete) / Math.max(0.01, 1 - tarifaPct / 100 - impostoPct / 100);
    return { tarifa, imposto, lucro, margem, equilibrio };
  }, [custo, preco, tarifaPct, frete, impostoPct]);

  const campo = (rotulo: string, v: number, set: (n: number) => void, passo = 1) => (
    <label className="ml-sim-campo">
      <span>{rotulo}</span>
      <input type="number" value={v} step={passo} onChange={(e) => set(Number(e.target.value) || 0)} />
    </label>
  );

  return (
    <div className="ml-tela">
      <Secao titulo="Simulador de preço" sub="estimativa — valores oficiais de tarifa/imposto entram com a integração real (§13.3)">
        <div className="ml-sim">
          <div className="ml-sim-form">
            {campo('Custo do produto (R$)', custo, setCusto, 10)}
            {campo('Preço de venda (R$)', preco, setPreco, 10)}
            {campo('Tarifa ML (%)', tarifaPct, setTarifaPct, 0.5)}
            {campo('Frete subsidiado (R$)', frete, setFrete, 5)}
            {campo('Imposto estimado (%)', impostoPct, setImpostoPct, 0.5)}
          </div>
          <div className="ml-sim-res">
            <div className="ml-sim-linha"><span>Tarifa</span><strong>-{fmtMoeda(calc.tarifa)}</strong></div>
            <div className="ml-sim-linha"><span>Imposto estimado</span><strong>-{fmtMoeda(calc.imposto)}</strong></div>
            <div className="ml-sim-linha"><span>Frete</span><strong>-{fmtMoeda(frete)}</strong></div>
            <div className={`ml-sim-linha ml-sim-total ${calc.lucro < 0 ? 'ml-neg' : 'ml-pos'}`}>
              <span><Calculator size={13} aria-hidden /> Lucro unitário</span><strong>{fmtMoeda(calc.lucro)}</strong>
            </div>
            <div className="ml-sim-linha"><span>Margem</span><strong>{fmtPct(calc.margem)}</strong></div>
            <div className="ml-sim-linha"><span>Ponto de equilíbrio</span><strong>{fmtMoeda(calc.equilibrio)}</strong></div>
          </div>
        </div>
      </Secao>
    </div>
  );
}

// ── Envios ──────────────────────────────────────────────────────────

export function Envios({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(
    () => getService().getEnvios(filtros), [filtros.contaId, filtros.periodo]
  );
  if (carregando || !dados) return <Carregando altura={360} />;

  const entregues = dados.filter((e) => e.status === 'entregue');
  const noPrazo = entregues.filter((e) => e.diasTransito !== null && e.diasTransito <= 7).length;
  const porUf = Object.entries(dados.reduce((m, e) => { m[e.uf] = (m[e.uf] ?? 0) + 1; return m; }, {} as Record<string, number>))
    .map(([rotulo, valor]) => ({ rotulo, valor })).sort((a, b) => b.valor - a.valor);

  const colunas: ColunaML<Envio>[] = [
    { id: 'id', titulo: 'Envio', valor: (e) => e.id, largura: 92 },
    { id: 'pedido', titulo: 'Pedido', valor: (e) => e.pedidoId, largura: 110 },
    { id: 'mod', titulo: 'Modalidade', valor: (e) => e.modalidade, render: (e) => <StatusBadge valor={e.modalidade} />, alinhar: 'centro', largura: 96 },
    { id: 'destino', titulo: 'Destino', valor: (e) => `${e.cidade} — ${e.uf}` },
    { id: 'previsao', titulo: 'Previsão', valor: (e) => e.previsao, render: (e) => fmtData(e.previsao), largura: 88 },
    { id: 'transito', titulo: 'Trânsito', valor: (e) => e.diasTransito ?? 999, render: (e) => (e.diasTransito !== null ? `${e.diasTransito}d` : '—'), alinhar: 'direita', largura: 78 },
    { id: 'rastreio', titulo: 'Rastreio', valor: (e) => e.rastreio, largura: 120 },
    { id: 'status', titulo: 'Status', valor: (e) => e.status, render: (e) => <StatusBadge valor={e.status} />, alinhar: 'centro', largura: 104 },
  ];

  return (
    <div className="ml-tela">
      <div className="ml-chips">
        <span className="ml-chip">Em preparação: <strong>{dados.filter((e) => e.status === 'preparando').length}</strong></span>
        <span className="ml-chip">Em trânsito: <strong>{dados.filter((e) => e.status === 'em_transito').length}</strong></span>
        <span className="ml-chip ml-chip-bad">Atrasados: <strong>{dados.filter((e) => e.status === 'atrasado').length}</strong></span>
        <span className="ml-chip">No prazo: <strong>{entregues.length ? Math.round((noPrazo / entregues.length) * 100) : 100}%</strong></span>
      </div>

      <div className="ml-duplo">
        <Secao titulo="Envios" sub="operação logística do período">
          <MLGrid dados={dados} colunas={colunas} exportarNome="envios-mercadolivre"
            vazio={{ titulo: 'Nenhum envio no período' }} />
        </Secao>
        <Secao titulo="Envios por estado" sub="volume no período">
          <Barras dados={porUf} formato="numero" max={12} />
        </Secao>
      </div>
    </div>
  );
}

// ── Reputação ───────────────────────────────────────────────────────

const ROTULO_NIVEL: Record<string, string> = {
  verde_escuro: 'Verde-escuro (MercadoLíder)', verde: 'Verde', amarelo: 'Amarelo',
  laranja: 'Laranja', vermelho: 'Vermelho',
};

export function Reputacao({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(
    () => getService().getReputacao(filtros), [filtros.contaId]
  );
  if (carregando || !dados) return <Carregando altura={360} />;

  return (
    <div className="ml-tela">
      <div className="ml-chips">
        <span className={`ml-chip ${['laranja', 'vermelho', 'amarelo'].includes(dados.nivel) ? 'ml-chip-bad' : 'ml-chip-ok'}`}>
          Nível: <strong>{ROTULO_NIVEL[dados.nivel]}</strong>
        </span>
        <span className="ml-chip">Vendas concluídas: <strong>{dados.vendasConcluidas}</strong></span>
        <span className="ml-chip">Reclamações: <strong>{fmtPct(dados.reclamacoesPct)}</strong></span>
        <span className="ml-chip">Cancelamentos: <strong>{fmtPct(dados.cancelamentosPct)}</strong></span>
        <span className="ml-chip">Atrasos: <strong>{fmtPct(dados.atrasosPct)}</strong></span>
      </div>

      <Secao titulo="Evolução da reputação" sub="score composto + fatores nos últimos 60 dias">
        <MLChart altura={250} deps={[dados]} montar={(_e, t) => ({
          grid: { left: 44, right: 16, top: 30, bottom: 30 },
          tooltip: { trigger: 'axis' },
          legend: { top: 0, textStyle: { color: t.textoDim, fontSize: 11 } },
          xAxis: { type: 'category', data: dados.serie.map((s) => s.dia.slice(8, 10) + '/' + s.dia.slice(5, 7)), axisLabel: { color: t.textoDim, fontSize: 10, interval: 9 }, axisLine: { lineStyle: { color: t.borda } } },
          yAxis: { type: 'value', max: 100, axisLabel: { color: t.textoDim, fontSize: 10 }, splitLine: { lineStyle: { color: t.borda, opacity: 0.5 } } },
          series: [
            { name: 'Score', type: 'line', smooth: 0.25, showSymbol: false, data: dados.serie.map((s) => s.score), lineStyle: { width: 2, color: t.primaria }, itemStyle: { color: t.primaria }, areaStyle: { color: t.primaria, opacity: 0.08 } },
            { name: 'Reclamações %', type: 'line', smooth: 0.25, showSymbol: false, data: dados.serie.map((s) => s.reclamacoes), lineStyle: { width: 2, color: t.bad }, itemStyle: { color: t.bad } },
            { name: 'Atrasos %', type: 'line', smooth: 0.25, showSymbol: false, data: dados.serie.map((s) => s.atrasos), lineStyle: { width: 2, color: t.warn }, itemStyle: { color: t.warn } },
          ],
        })} />
      </Secao>

      <Secao titulo="Fatores de risco" sub="estimativa interna — as regras oficiais serão validadas na integração (§18.3)">
        <div className="ml-atencao">
          {dados.fatoresRisco.map((f) => (
            <div key={f} className="ml-atencao-item ml-prio-2">
              <span className="ml-atencao-corpo"><strong>{f}</strong></span>
            </div>
          ))}
        </div>
      </Secao>
    </div>
  );
}
