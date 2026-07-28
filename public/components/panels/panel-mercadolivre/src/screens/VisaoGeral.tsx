// screens/VisaoGeral.tsx — dashboard executivo (briefing §6).
// @version 1.0.0  @created 2026-07-28
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getService } from '../services/MercadoLivreService';
import { useDados } from '../components/useDados';
import { MLChart } from '../components/MLChart';
import {
  Abas, Barras, Carregando, EstadoVazio, KpiCard, Secao, fmtMoeda,
} from '../components/ui';
import type { FiltrosGlobais, SecaoId } from '../domain/types';

type Metrica = 'faturamento' | 'liquido' | 'pedidos' | 'ticket';
const METRICAS: { id: Metrica; rotulo: string }[] = [
  { id: 'faturamento', rotulo: 'Faturamento' },
  { id: 'liquido', rotulo: 'Líquido' },
  { id: 'pedidos', rotulo: 'Pedidos' },
  { id: 'ticket', rotulo: 'Ticket médio' },
];

export function VisaoGeral({ filtros, aoNavegar }: {
  filtros: FiltrosGlobais;
  aoNavegar: (s: SecaoId) => void;
}) {
  const { dados, carregando, erro } = useDados(
    () => getService().getOverview(filtros),
    [filtros.contaId, filtros.periodo, filtros.comparacao]
  );
  const [metrica, setMetrica] = useState<Metrica>('faturamento');

  if (carregando) return <Carregando altura={420} />;
  if (erro || !dados) return <EstadoVazio titulo="Não foi possível carregar a visão geral" detalhe="Tente atualizar. Se persistir, verifique a sincronização." />;
  if (dados.kpis.every((k) => k.valor === 0) && dados.serie.length === 0) {
    return <EstadoVazio titulo="Sem dados para o período"
      detalhe="A conta ainda não tem movimento neste período — ou a integração não foi configurada." />;
  }

  const moeda = metrica !== 'pedidos';

  return (
    <div className="ml-tela">
      {/* KPIs (§6.1) */}
      <div className="ml-kpis">
        {dados.kpis.map((k) => <KpiCard key={k.id} kpi={k} onDrill={(s) => aoNavegar(s as SecaoId)} />)}
      </div>

      {/* Exige atenção (§6.6) */}
      {dados.atencao.length > 0 && (
        <Secao titulo="Exige atenção" sub="prioridades operacionais de agora">
          <div className="ml-atencao">
            {dados.atencao.map((a) => (
              <button key={a.id} className={`ml-atencao-item ml-prio-${a.prioridade}`}
                onClick={() => aoNavegar(a.secao)}>
                <AlertTriangle size={15} aria-hidden />
                <span className="ml-atencao-corpo">
                  <strong>{a.titulo}</strong>
                  <span>{a.detalhe}</span>
                </span>
                <span className="ml-atencao-acao">{a.acao} →</span>
              </button>
            ))}
          </div>
        </Secao>
      )}

      {/* Evolução (§6.2) */}
      <Secao titulo="Evolução de vendas" sub="por dia no período"
        acoes={<Abas abas={METRICAS} ativa={metrica} onTrocar={setMetrica} />}>
        <MLChart altura={260} deps={[dados, metrica]} montar={(_e, t) => ({
          grid: { left: 64, right: 16, top: 18, bottom: 42 },
          tooltip: { trigger: 'axis', valueFormatter: (v: number) => (moeda ? fmtMoeda(v) : String(v)) },
          dataZoom: [{ type: 'inside' }, { type: 'slider', height: 16, bottom: 8, borderColor: t.borda }],
          xAxis: {
            type: 'category',
            data: dados.serie.map((p) => String(p.dia).slice(8, 10) + '/' + String(p.dia).slice(5, 7)),
            axisLine: { lineStyle: { color: t.borda } }, axisTick: { show: false },
            axisLabel: { color: t.textoDim, fontSize: 10 },
          },
          yAxis: {
            type: 'value',
            axisLabel: { color: t.textoDim, fontSize: 10, formatter: moeda ? (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v) : undefined },
            splitLine: { lineStyle: { color: t.borda, opacity: 0.5 } },
          },
          series: [{
            name: METRICAS.find((m) => m.id === metrica)?.rotulo,
            type: 'line', smooth: 0.25, showSymbol: false,
            data: dados.serie.map((p) => p[metrica] as number),
            lineStyle: { width: 2, color: t.primaria },
            itemStyle: { color: t.primaria },
            areaStyle: { color: t.primaria, opacity: 0.1 },
          }],
        })} />
      </Secao>

      <div className="ml-duplo">
        {/* Funil (§6.3) */}
        <Secao titulo="Funil comercial" sub="do anúncio à entrega">
          <MLChart altura={250} deps={[dados]} montar={(_e, t) => ({
            tooltip: { trigger: 'item', formatter: '{b}: {c}' },
            series: [{
              type: 'funnel', left: 8, right: 8, top: 6, bottom: 6,
              minSize: '22%', sort: 'descending', gap: 3,
              label: { color: t.texto, fontSize: 11, formatter: '{b}\n{c}' },
              itemStyle: { borderWidth: 0 },
              data: dados.funil.map((f, i) => ({
                name: f.rotulo, value: f.valor,
                itemStyle: { color: [t.apoio, t.apoio, t.primaria, t.ok, t.ok][i] ?? t.apoio, opacity: 0.85 - i * 0.08 },
              })),
            }],
          })} />
        </Secao>

        {/* Distribuições (§6.4) */}
        <Secao titulo="Vendas por categoria" sub="faturamento no período">
          <Barras dados={dados.porCategoria} />
        </Secao>
      </div>

      <Secao titulo="Vendas por estado" sub="faturamento no período — clique em Envios para a visão logística">
        <div className="ml-mapa-tiles">
          {dados.porEstado.map((uf) => {
            const maior = dados.porEstado[0]?.valor ?? 1;
            const intensidade = Math.max(0.15, uf.valor / maior);
            return (
              <button key={uf.rotulo} className="ml-uf" style={{ ['--int' as string]: intensidade }}
                title={`${uf.rotulo}: ${fmtMoeda(uf.valor)}`} onClick={() => aoNavegar('envios')}>
                <strong>{uf.rotulo}</strong>
                <span>{fmtMoeda(uf.valor)}</span>
              </button>
            );
          })}
        </div>
      </Secao>
    </div>
  );
}
