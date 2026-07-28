// screens/VisaoGeral.tsx — dashboard executivo do Meta Ads (briefing §6).
// @version 1.0.0  @created 2026-07-28
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getService } from '../services/MetaAdsService';
import { useDados } from '../components/useDados';
import { MAChart } from '../components/MAChart';
import {
  Abas, Barras, Carregando, EstadoVazio, KpiCard, Secao, fmtMoeda,
} from '../components/ui';
import type { FiltrosGlobais, SecaoId } from '../domain/types';

type Metrica = 'investimento' | 'leads' | 'cpl' | 'conversoes' | 'roas' | 'ctr';
const METRICAS: { id: Metrica; rotulo: string }[] = [
  { id: 'investimento', rotulo: 'Investimento' },
  { id: 'leads', rotulo: 'Leads' },
  { id: 'cpl', rotulo: 'CPL' },
  { id: 'conversoes', rotulo: 'Conversões' },
  { id: 'roas', rotulo: 'ROAS' },
  { id: 'ctr', rotulo: 'CTR' },
];
const EM_MOEDA: Metrica[] = ['investimento', 'cpl'];

export function VisaoGeral({ filtros, aoNavegar }: {
  filtros: FiltrosGlobais;
  aoNavegar: (s: SecaoId) => void;
}) {
  const { dados, carregando, erro } = useDados(
    () => getService().getOverview(filtros),
    [filtros.contaId, filtros.periodo, filtros.comparacao, filtros.objetivo]
  );
  const [metrica, setMetrica] = useState<Metrica>('investimento');

  if (carregando) return <Carregando altura={420} />;
  if (erro || !dados) return <EstadoVazio titulo="Não foi possível carregar a visão geral" detalhe="Tente atualizar. Se persistir, verifique a sincronização." />;
  if (dados.kpis.every((k) => k.valor === 0)) {
    return <EstadoVazio titulo="Sem dados para o período"
      detalhe="A conta não tem veiculação neste período — ou a integração não foi configurada." />;
  }

  const moeda = EM_MOEDA.includes(metrica);

  return (
    <div className="mads-tela">
      {/* KPIs (§6.1) */}
      <div className="mads-kpis">
        {dados.kpis.map((k) => <KpiCard key={k.id} kpi={k} onDrill={(s) => aoNavegar(s as SecaoId)} />)}
      </div>

      {/* Exige atenção (§6.6) */}
      {dados.atencao.length > 0 && (
        <Secao titulo="Exige atenção" sub="prioridades da operação de mídia agora">
          <div className="mads-atencao">
            {dados.atencao.map((a) => (
              <button key={a.id} className={`mads-atencao-item mads-prio-${a.prioridade}`}
                onClick={() => aoNavegar(a.secao)}>
                <AlertTriangle size={15} aria-hidden />
                <span className="mads-atencao-corpo">
                  <strong>{a.titulo}</strong>
                  <span>{a.detalhe}</span>
                </span>
                <span className="mads-atencao-acao">{a.acao} →</span>
              </button>
            ))}
          </div>
        </Secao>
      )}

      {/* Evolução (§6.2) */}
      <Secao titulo="Evolução do investimento e resultados" sub="por dia no período"
        acoes={<Abas abas={METRICAS} ativa={metrica} onTrocar={setMetrica} />}>
        <MAChart altura={260} deps={[dados, metrica]} montar={(_e, t) => ({
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

      <div className="mads-duplo">
        {/* Funil (§6.3) */}
        <Secao titulo="Funil de mídia" sub="da impressão à venda — clique em Funil para detalhar">
          <MAChart altura={250} deps={[dados]} montar={(_e, t) => ({
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
        <Secao titulo="Investimento por objetivo" sub="no período filtrado">
          <Barras dados={dados.porObjetivo} />
        </Secao>
      </div>

      <div className="mads-duplo">
        <Secao titulo="Investimento por posicionamento" sub="Feed, Reels, Stories… — detalhe em Posicionamentos">
          <Barras dados={dados.porPosicionamento} />
        </Secao>

        <Secao titulo="Investimento por região" sub="estimativa por UF no período">
          <div className="mads-mapa-tiles">
            {dados.porRegiao.map((uf) => {
              const maior = dados.porRegiao[0]?.valor ?? 1;
              const intensidade = Math.max(0.15, uf.valor / maior);
              return (
                <button key={uf.rotulo} className="mads-uf" style={{ ['--int' as string]: intensidade }}
                  title={`${uf.rotulo}: ${fmtMoeda(uf.valor)}`} onClick={() => aoNavegar('performance')}>
                  <strong>{uf.rotulo}</strong>
                  <span>{fmtMoeda(uf.valor)}</span>
                </button>
              );
            })}
          </div>
        </Secao>
      </div>
    </div>
  );
}
