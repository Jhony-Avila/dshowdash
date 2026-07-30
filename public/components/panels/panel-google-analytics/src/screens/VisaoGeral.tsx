// screens/VisaoGeral.tsx — §15, §16, §17
// @version 1.0.0  @created 2026-07-30
import { useMemo, useState } from 'react';
import type { PropsTela } from '../app/App';
import { usarDados } from './usarDados';
import { KpiCard, Card, Carregando, Erro, Procedencia, AlertaItem, Vazio, Icone } from '../components/UI';
import { SerieTemporal } from '../components/Serie';
import type { SerieDef } from '../components/Serie';

/** Métricas que o usuário pode plotar (§16.1). */
const PLOTAVEIS: { chave: keyof PontoNum; rotulo: string; cor: string }[] = [
  { chave: 'sessoes', rotulo: 'Sessões', cor: '#E8710A' },
  { chave: 'usuarios', rotulo: 'Usuários', cor: '#7C4DFF' },
  { chave: 'sessoes_engajadas', rotulo: 'Sessões engajadas', cor: '#17A673' },
  { chave: 'visualizacoes', rotulo: 'Visualizações', cor: '#3B82F6' },
  { chave: 'conversoes', rotulo: 'Eventos importantes', cor: '#FBBC04' },
  { chave: 'eventos', rotulo: 'Eventos', cor: '#8A8AA0' },
];

type PontoNum = {
  sessoes: number; usuarios: number; sessoes_engajadas: number;
  visualizacoes: number; conversoes: number; eventos: number;
};

export default function VisaoGeral({ filtros, svc, recarga, onMeta, onIrPara }: PropsTela) {
  const { dados, meta, carregando, erro } = usarDados(
    (s) => svc.getOverview(filtros, s),
    [filtros.periodo, filtros.comparar, filtros.cenario, filtros.canal, filtros.campanha, recarga],
    onMeta,
  );

  const [plotadas, setPlotadas] = useState<string[]>(['sessoes', 'conversoes']);
  const [comparando, setComparando] = useState(true);

  const series: SerieDef[] = useMemo(() => {
    if (!dados) return [];
    const out: SerieDef[] = [];
    for (const m of PLOTAVEIS) {
      if (!plotadas.includes(m.chave)) continue;
      // Conversões têm ordem de magnitude muito menor que sessões: eixo próprio, senão a
      // linha fica colada no zero e o gráfico não informa nada (§16.2 pede eixo duplo).
      const eixo: 0 | 1 = m.chave === 'conversoes' ? 1 : 0;
      out.push({ nome: m.rotulo, dados: dados.serie.map((p) => p[m.chave] as number), cor: m.cor, eixo });
      if (comparando && dados.serie_anterior.length === dados.serie.length) {
        out.push({
          nome: `${m.rotulo} (anterior)`,
          dados: dados.serie_anterior.map((p) => p[m.chave] as number),
          cor: m.cor, eixo, tracejada: true,
        });
      }
    }
    return out;
  }, [dados, plotadas, comparando]);

  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando linhas={6} />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const semDados = dados.serie.every((p) => p.sessoes === 0);

  return (
    <>
      <Card titulo="Indicadores do período">
        <div className="ga-kpis">
          {dados.kpis.map((k) => <KpiCard key={k.chave} kpi={k} />)}
        </div>
      </Card>

      <Card
        titulo="Evolução"
        nota={comparando ? 'linha tracejada = período anterior' : undefined}
        acao={
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {PLOTAVEIS.map((m) => {
              const on = plotadas.includes(m.chave);
              return (
                <button
                  key={m.chave}
                  className="ga-btn"
                  onClick={() => setPlotadas((a) => (on ? a.filter((x) => x !== m.chave) : [...a, m.chave]))}
                  style={on ? { borderColor: m.cor, color: m.cor } : undefined}
                  aria-pressed={on}
                >
                  {m.rotulo}
                </button>
              );
            })}
            <button className="ga-btn" onClick={() => setComparando((v) => !v)} aria-pressed={comparando}>
              {comparando ? 'Ocultar comparação' : 'Comparar'}
            </button>
          </span>
        }
      >
        <div className="ga-card">
          <div className="ga-card__corpo">
            {semDados ? (
              <Vazio titulo="Nenhuma sessão no período" detalhe="O cenário selecionado não produz tráfego. Troque o cenário ou o período." />
            ) : series.length === 0 ? (
              <Vazio titulo="Nenhuma métrica selecionada" detalhe="Escolha ao menos uma métrica acima para plotar." />
            ) : (
              <SerieTemporal datas={dados.serie.map((p) => p.data)} series={series} altura={320} />
            )}
          </div>
        </div>
      </Card>

      {dados.atencao.length > 0 && (
        <Card titulo="Exige atenção" nota={`${dados.atencao.length} ${dados.atencao.length === 1 ? 'item' : 'itens'}`}>
          <div className="ga-atencao">
            {dados.atencao.map((a, i) => (
              <AlertaItem
                key={`${a.metrica}-${i}`}
                sev={a.severidade}
                titulo={a.titulo}
                impacto={a.impacto}
                causa={a.causa}
                recomendacao={a.recomendacao}
                onIr={() => onIrPara(a.tela)}
              />
            ))}
          </div>
        </Card>
      )}

      {carregando && (
        <div style={{ fontSize: 11, color: 'var(--ga-txt-3)', display: 'flex', gap: 6, alignItems: 'center' }}>
          <Icone nome="RefreshCw" tam={12} /> atualizando…
        </div>
      )}
      <Procedencia meta={meta} />
    </>
  );
}
