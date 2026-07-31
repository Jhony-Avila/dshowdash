// screens/Carga.tsx — análise de carga de reuniões (§38, §39, §65, §66, §67, §68).
// @version 2.0.0  @created 2026-07-29  @updated 2026-07-30
//
// v2: heatmap D3 + cross-filter + drill-down.
//
// DECISÕES DE VISUALIZAÇÃO (e por quê):
//  · Gráficos de UMA série cada, nunca dois eixos y. "Horas" e "nº de reuniões"
//    têm escalas diferentes; sobrepor num eixo duplo faz a leitura depender de
//    qual escala o olho pegou.
//  · Série única ⇒ sem caixa de legenda: o título já nomeia a série.
//  · Barras finas, topo arredondado 4 px, folga entre barras; grade recessiva.
//    Cor vem de custom property, então o tema troca junto com o painel.
//  · Toda figura tem TABELA equivalente — acessibilidade, e o WARN de contraste
//    da paleta obriga alternativa textual.
//  · Texto de eixo usa token de texto, nunca a cor da série.
//  · Cross-filter (§67): clicar numa célula do heatmap filtra a lista abaixo;
//    o botão "Limpar seleção" está sempre visível quando há filtro ativo.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
// Import SELETIVO do ECharts: o pacote inteiro são ~1,1 MB minificados, e este
// painel roda dentro do app-shell. Registrando só barra + os componentes que
// usamos, o chunk cai para uma fração disso.
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import { servico } from '../services';
import { chaves } from '../lib/api';
import { Cartao, Kpi, LinhaEvento } from '../shell/ui';
import { EstadoErro, EstadoVazio, SkeletonBloco } from './Estados';
import { HeatmapD3, type CelulaHeat } from './HeatmapD3';
import { duracao, hojeYmd, somaDias } from '../lib/tz';
import type { CalendarEvent } from '../services/types';
import type { Preferencias } from '../shell/types';

echarts.use([BarChart, GridComponent, TooltipComponent, SVGRenderer]);

/** Lê um token do tema atual; cai num padrão seguro se ainda não houver CSS. */
function token(el: HTMLElement | null, nome: string, padrao: string): string {
  if (!el) return padrao;
  const v = getComputedStyle(el).getPropertyValue(nome).trim();
  return v || padrao;
}

interface DadoBarra { rotulo: string; valor: number; bruto?: string }

function GraficoBarras({ titulo, dados, unidade, formatador }: {
  titulo: string; dados: DadoBarra[]; unidade: string;
  formatador?: (v: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<echarts.ECharts | null>(null);
  const [tema, setTema] = useState(0);   // força re-render quando o tema troca

  // O shell troca de tema por `data-theme` no <html> e por classe no <body>
  // (a classe theme-light do <html> fica PRESA e não serve de sinal).
  // Observar os dois é o que faz o gráfico acompanhar sem recarregar.
  useEffect(() => {
    const obs = new MutationObserver(() => setTema((t) => t + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onMq = () => setTema((t) => t + 1);
    mq.addEventListener('change', onMq);
    return () => { obs.disconnect(); mq.removeEventListener('change', onMq); };
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    if (!inst.current) inst.current = echarts.init(ref.current, undefined, { renderer: 'svg' });

    const el = ref.current;
    const corSerie = token(el, '--gc-serie-1', '#2a78d6');
    const corTexto = token(el, '--gc-texto-2', '#52514e');
    const corGrade = token(el, '--gc-grade', 'rgba(128,128,128,.18)');

    inst.current.setOption({
      animation: false,
      grid: { left: 8, right: 12, top: 12, bottom: 4, containLabel: true },
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: (p: { name: string; value: number }) =>
          `${p.name}<br/><strong>${formatador ? formatador(p.value) : `${p.value} ${unidade}`}</strong>`,
      },
      xAxis: {
        type: 'category',
        data: dados.map((d) => d.rotulo),
        axisLabel: { color: corTexto, fontSize: 10, interval: 'auto' },
        axisLine: { lineStyle: { color: corGrade } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: corTexto, fontSize: 10 },
        splitLine: { lineStyle: { color: corGrade, type: 'dashed' } },
      },
      series: [{
        type: 'bar',
        data: dados.map((d) => d.valor),
        itemStyle: { color: corSerie, borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 22,
        barCategoryGap: '28%',
      }],
    }, true);
  }, [dados, unidade, formatador, tema]);

  useEffect(() => {
    const onResize = () => inst.current?.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      inst.current?.dispose();
      inst.current = null;
    };
  }, []);

  return (
    <figure className="gc-figura">
      <figcaption className="gc-figura-titulo">{titulo}</figcaption>
      <div ref={ref} className="gc-gr" role="img"
           aria-label={`${titulo}. Dados equivalentes na tabela abaixo.`} />
      <details className="gc-tabela-alt">
        <summary>Ver dados em tabela</summary>
        <div className="gc-grid-wrap">
          <table className="gc-grid gc-grid-compacta">
            <thead><tr><th>Período</th><th>{unidade}</th></tr></thead>
            <tbody>
              {dados.map((d) => (
                <tr key={d.rotulo}>
                  <td>{d.bruto ?? d.rotulo}</td>
                  <td>{formatador ? formatador(d.valor) : d.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function Carga({ tz, prefs, onAbrirEvento }: {
  tz: string; prefs: Preferencias; onAbrirEvento: (e: CalendarEvent) => void;
}) {
  const [selecao, setSelecao] = useState<{ dow: number; hora: number } | null>(null);

  const q = useQuery({
    queryKey: chaves.overview(tz),
    queryFn: () => servico.getOverview(tz),
  });

  // O overview traz a série por DIA; o heatmap precisa de dia × hora, e o
  // drill-down precisa dos eventos em si. Uma consulta de janela resolve os
  // dois — é a mesma cache que a agenda já usa.
  const ate = hojeYmd(tz);
  const de = somaDias(ate, -27);
  const qe = useQuery({
    queryKey: chaves.eventos({ de, ate, tz, carga: true }),
    queryFn: () => servico.getEvents({ de, ate, tz }),
  });

  const eventosCarga = useMemo(
    () => (qe.data?.eventos ?? []).filter((e) =>
      !prefs.calendariosOcultos.includes(e.calendar_id)
      && e.status !== 'cancelled'
      && !e.all_day
      && e.transparency === 'opaque'
      && e.attendees.length > 0),
    [qe.data, prefs.calendariosOcultos]
  );

  const celulas = useMemo<CelulaHeat[]>(() => {
    const m = new Map<string, CelulaHeat>();
    for (const e of eventosCarga) {
      const d = new Date(e.start);
      // Dia da semana e hora NO FUSO DE EXIBIÇÃO — usar getDay()/getHours() do
      // browser jogaria o evento para outra célula quando os fusos divergem.
      const partes = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, weekday: 'short', hour: 'numeric', hour12: false,
      }).formatToParts(d);
      const wd = partes.find((p) => p.type === 'weekday')?.value ?? 'Sun';
      const hh = Number(partes.find((p) => p.type === 'hour')?.value ?? '0');
      const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd);
      const chave = `${dow}:${hh}`;
      const atual = m.get(chave) ?? { dow, hora: hh, minutos: 0, eventos: 0 };
      atual.minutos += e.duration_min ?? 0;
      atual.eventos += 1;
      m.set(chave, atual);
    }
    return [...m.values()];
  }, [eventosCarga, tz]);

  const eventosFiltrados = useMemo(() => {
    if (!selecao) return [];
    return eventosCarga.filter((e) => {
      const partes = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, weekday: 'short', hour: 'numeric', hour12: false,
      }).formatToParts(new Date(e.start));
      const wd = partes.find((p) => p.type === 'weekday')?.value ?? '';
      const hh = Number(partes.find((p) => p.type === 'hour')?.value ?? '0');
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd) === selecao.dow
          && hh === selecao.hora;
    });
  }, [eventosCarga, selecao, tz]);

  const serie = q.data?.carga.serie_28d ?? [];

  const porDia = useMemo<DadoBarra[]>(() => serie.map((d) => ({
    rotulo: d.dia.slice(8, 10) + '/' + d.dia.slice(5, 7),
    bruto: d.dia,
    valor: Math.round((d.minutos / 60) * 10) / 10,
  })), [serie]);

  const porDiaSemana = useMemo<DadoBarra[]>(() => {
    const acc = new Array(7).fill(0);
    for (const d of serie) {
      const [a, m, dia] = d.dia.split('-').map(Number);
      acc[new Date(Date.UTC(a, m - 1, dia)).getUTCDay()] += d.minutos;
    }
    return DIAS.map((n, i) => ({ rotulo: n, valor: Math.round((acc[i] / 60) * 10) / 10 }));
  }, [serie]);

  const reunioesPorDia = useMemo<DadoBarra[]>(() => serie.map((d) => ({
    rotulo: d.dia.slice(8, 10) + '/' + d.dia.slice(5, 7),
    bruto: d.dia,
    valor: d.reunioes,
  })), [serie]);

  if (q.isError) return <EstadoErro erro={q.error} onRetry={() => void q.refetch()} />;
  if (q.isLoading) return <div className="gc-tela"><SkeletonBloco linhas={8} altura={40} /></div>;

  const c = q.data!.carga;

  return (
    <div className="gc-tela gc-viz">
      <div className="gc-kpis">
        <Kpi rotulo="Horas em reunião · 28 d" valor={c.horas_total} sufixo=" h" icone="clock" />
        <Kpi rotulo="Reuniões" valor={c.reunioes_total} icone="video" />
        <Kpi rotulo="Média por dia" valor={c.media_reunioes_dia} icone="bar-chart" />
        <Kpi rotulo="Duração média" valor={duracao(c.duracao_media_min)} icone="clock" />
      </div>

      <p className="gc-nota gc-nota-destaque">{q.data!.aviso}</p>

      <Cartao>
        {qe.isLoading
          ? <SkeletonBloco linhas={8} altura={26} />
          : <HeatmapD3
              celulas={celulas}
              horaInicio={Math.max(0, prefs.expedienteInicio - 1)}
              horaFim={Math.min(24, prefs.expedienteFim + 2)}
              selecao={selecao}
              onSelecionar={setSelecao}
            />}
      </Cartao>

      {/* Drill-down (§68): a seleção do heatmap abre os eventos daquela faixa. */}
      {selecao && (
        <Cartao titulo={`Reuniões em ${DIAS[selecao.dow]}, ${String(selecao.hora).padStart(2, '0')}h · últimos 28 dias`}
                acao={<button type="button" className="gc-btn gc-btn-fantasma"
                              onClick={() => setSelecao(null)}>Limpar seleção</button>}>
          {eventosFiltrados.length === 0 ? (
            <EstadoVazio titulo="Nenhuma reunião nesta faixa"
                         mensagem="Escolha outra célula do mapa de calor." />
          ) : (
            <ul className="gc-lista-simples">
              {eventosFiltrados.map((e) => (
                <li key={`${e.calendar_id}:${e.id}`}>
                  <LinhaEvento e={e} tz={tz} onAbrir={onAbrirEvento} mostrarData />
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      )}

      <Cartao>
        <GraficoBarras titulo="Horas em reunião por dia" dados={porDia} unidade="horas"
                       formatador={(v) => `${v} h`} />
      </Cartao>

      <div className="gc-viz-dupla">
        <Cartao>
          <GraficoBarras titulo="Horas em reunião por dia da semana" dados={porDiaSemana}
                         unidade="horas" formatador={(v) => `${v} h`} />
        </Cartao>
        <Cartao>
          <GraficoBarras titulo="Número de reuniões por dia" dados={reunioesPorDia}
                         unidade="reuniões" />
        </Cartao>
      </div>
    </div>
  );
}
