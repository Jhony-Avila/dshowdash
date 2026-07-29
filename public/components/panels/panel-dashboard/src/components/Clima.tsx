// components/Clima.tsx — clima atual detalhado (§8) + previsão de 10 dias com
// gráfico ECharts e detalhe por hora (§9). Dados REAIS de /api/home/weather.php.
// O clima NÃO segue o filtro de período global (§28) — tem período próprio.
// @version 3.0.0  @created 2026-07-29
import { useMemo, useState } from 'react';
import {
  Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudSun, Droplets,
  Snowflake, Sun, Sunrise, Sunset, TriangleAlert, Wind,
} from 'lucide-react';
import type { ClimaCompleto, ClimaDia, GrupoClima } from '../domain/types';
import { GChart } from './GChart';
import { Secao, Skeleton, relTempo } from './ui';

const ICONE_GRUPO: Record<GrupoClima, (size: number) => React.ReactNode> = {
  limpo: (s) => <Sun size={s} />,
  parcial: (s) => <CloudSun size={s} />,
  nublado: (s) => <Cloud size={s} />,
  neblina: (s) => <CloudFog size={s} />,
  chuva: (s) => <CloudDrizzle size={s} />,
  neve: (s) => <Snowflake size={s} />,
  tempestade: (s) => <CloudLightning size={s} />,
};

const g = (v: number | null | undefined, suf = '') => (v === null || v === undefined ? '—' : `${Math.round(v)}${suf}`);
const hora = (iso: string | null) => (iso ? iso.slice(11, 16) : '—');

// ── Clima atual (§8) ────────────────────────────────────────────────
export function ClimaAtualCard({ clima }: { clima: ClimaCompleto | null }) {
  if (!clima) return <Skeleton altura={172} />;
  const a = clima.atual;
  const alerta = a.grupo === 'tempestade' ? 'Tempestade prevista'
    : (a.chanceChuva ?? 0) >= 70 ? 'Alta chance de chuva hoje'
    : (a.uvMax ?? 0) >= 9 ? 'Índice UV muito alto' : null;

  return (
    <section className="ger-clima" aria-label={`Clima em ${clima.cidade}: ${a.condicao}, ${g(a.temp, ' graus')}`}>
      <div className="ger-clima-topo">
        <div>
          <span className="ger-clima-cidade">{clima.cidade}</span>
          <span className="ger-clima-cond">{a.condicao}</span>
        </div>
        <span className="ger-clima-ic" aria-hidden>{ICONE_GRUPO[a.grupo](30)}</span>
      </div>

      <div className="ger-clima-temp">
        <strong>{g(a.temp, '°')}</strong>
        <span>sensação {g(a.sensacao, '°')} · máx {g(a.tempMax, '°')} / mín {g(a.tempMin, '°')}</span>
      </div>

      {(alerta || clima.desatualizado) && (
        <div className="ger-clima-alerta">
          <TriangleAlert size={12} aria-hidden /> {clima.desatualizado ? 'Dados desatualizados' : alerta}
        </div>
      )}

      <div className="ger-clima-grid">
        <span><Droplets size={12} aria-hidden /> Chuva {g(a.chanceChuva, '%')}</span>
        <span><Wind size={12} aria-hidden /> Vento {g(a.vento, ' km/h')}</span>
        <span>Umidade {g(a.umidade, '%')}</span>
        <span>UV {g(a.uvMax)}</span>
        <span><Sunrise size={12} aria-hidden /> {hora(a.nascerDoSol)}</span>
        <span><Sunset size={12} aria-hidden /> {hora(a.porDoSol)}</span>
      </div>

      <span className="ger-clima-atualizado">atualizado {relTempo(clima.atualizadoEm)}</span>
    </section>
  );
}

// ── Previsão de 10 dias (§9) ────────────────────────────────────────
const DIA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function rotuloDia(iso: string, i: number): string {
  if (i === 0) return 'Hoje';
  if (i === 1) return 'Amanhã';
  const d = new Date(iso + 'T12:00:00');
  return DIA_SEMANA[d.getDay()];
}

export function PrevisaoDezDias({ clima }: { clima: ClimaCompleto | null }) {
  const [sel, setSel] = useState(0);
  const dias = clima?.dias ?? [];
  const dia: ClimaDia | undefined = dias[sel];

  const horasDoDia = useMemo(() => {
    if (!clima || !dia) return [];
    return clima.horas.filter((h) => h.hora.startsWith(dia.data));
  }, [clima, dia]);

  if (!clima) return <Skeleton altura={280} />;
  if (dias.length === 0) return null;

  return (
    <Secao titulo="Previsão de 10 dias" sub={`${clima.cidade} — clique em um dia para detalhar`}>
      {/* faixa horizontal (§9.2) */}
      <div className="ger-prev-faixa" role="tablist" aria-label="Dias da previsão">
        {dias.map((d, i) => (
          <button key={d.data} role="tab" aria-selected={sel === i}
            className={`ger-prev-dia${sel === i ? ' is-on' : ''}${(d.chanceChuva ?? 0) >= 70 ? ' is-chuva' : ''}`}
            onClick={() => setSel(i)}>
            <span className="ger-prev-rotulo">{rotuloDia(d.data, i)}</span>
            <span className="ger-prev-data">{d.data.slice(8, 10)}/{d.data.slice(5, 7)}</span>
            <span className="ger-prev-ic" aria-hidden>{ICONE_GRUPO[d.grupo](18)}</span>
            <span className="ger-prev-temps"><strong>{g(d.tempMax, '°')}</strong> {g(d.tempMin, '°')}</span>
            <span className="ger-prev-chuva"><Droplets size={10} aria-hidden /> {g(d.chanceChuva, '%')}</span>
          </button>
        ))}
      </div>

      {/* gráfico dos 10 dias (§9.4) */}
      <GChart altura={190} deps={[clima.atualizadoEm]} montar={(_e, t) => ({
        grid: { left: 40, right: 40, top: 24, bottom: 24 },
        tooltip: { trigger: 'axis' },
        legend: { data: ['Máxima', 'Mínima', 'Chuva (mm)'], textStyle: { color: t.textoDim, fontSize: 10 }, top: 0 },
        xAxis: {
          type: 'category',
          data: dias.map((d, i) => rotuloDia(d.data, i)),
          axisLine: { lineStyle: { color: t.borda } }, axisTick: { show: false },
          axisLabel: { color: t.textoDim, fontSize: 10 },
        },
        yAxis: [
          { type: 'value', axisLabel: { color: t.textoDim, fontSize: 10, formatter: '{value}°' }, splitLine: { lineStyle: { color: t.borda, opacity: 0.4 } } },
          { type: 'value', axisLabel: { color: t.textoDim, fontSize: 10 }, splitLine: { show: false } },
        ],
        series: [
          { name: 'Máxima', type: 'line', smooth: 0.3, symbolSize: 5, data: dias.map((d) => d.tempMax), lineStyle: { width: 2, color: t.warn }, itemStyle: { color: t.warn } },
          { name: 'Mínima', type: 'line', smooth: 0.3, symbolSize: 5, data: dias.map((d) => d.tempMin), lineStyle: { width: 2, color: t.primaria }, itemStyle: { color: t.primaria } },
          { name: 'Chuva (mm)', type: 'bar', yAxisIndex: 1, barWidth: '38%', data: dias.map((d) => d.volumeChuva), itemStyle: { color: t.apoio, opacity: 0.45, borderRadius: 2 } },
        ],
      })} />

      {/* detalhe do dia selecionado (§9.3) */}
      {dia && (
        <div className="ger-prev-det">
          <div className="ger-prev-det-info">
            <strong>{rotuloDia(dia.data, sel)} · {dia.condicao}</strong>
            <span>máx {g(dia.tempMax, '°')} / mín {g(dia.tempMin, '°')} · sensação {g(dia.sensacaoMin, '°')}–{g(dia.sensacaoMax, '°')}</span>
            <span>chuva {g(dia.chanceChuva, '%')} ({dia.volumeChuva ?? 0} mm) · vento até {g(dia.ventoMax, ' km/h')} · UV {g(dia.uvMax)}</span>
            <span><Sunrise size={11} aria-hidden /> {hora(dia.nascerDoSol)} · <Sunset size={11} aria-hidden /> {hora(dia.porDoSol)}</span>
          </div>
          {horasDoDia.length > 0 && (
            <div className="ger-prev-horas" aria-label="Previsão por hora">
              {horasDoDia.map((h) => (
                <div key={h.hora} className="ger-prev-hora">
                  <span>{h.hora.slice(11, 16)}</span>
                  <span aria-hidden>{ICONE_GRUPO[h.grupo](14)}</span>
                  <strong>{g(h.temp, '°')}</strong>
                  <span className="ger-prev-hora-chuva">{g(h.chanceChuva, '%')}</span>
                </div>
              ))}
            </div>
          )}
          {horasDoDia.length === 0 && sel > 1 && (
            <span className="ger-prev-nota">A previsão por hora está disponível para hoje e amanhã.</span>
          )}
        </div>
      )}
    </Secao>
  );
}
