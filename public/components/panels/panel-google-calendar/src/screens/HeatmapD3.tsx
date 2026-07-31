// screens/HeatmapD3.tsx — matriz semanal de ocupação em D3 (§39, §65).
// @version 1.0.0  @created 2026-07-30
//
// POR QUE D3 E NÃO ECHARTS AQUI: o §39 pede seleção de célula com cross-filter
// e drill-down. Em ECharts isso vira luta com o modelo de eventos dele; em D3 a
// célula é um <rect> comum que recebe onClick e tabIndex — e sai acessível de
// graça, o que um canvas não dá.
//
// ESCALA (sequencial, não categórica): magnitude contínua = UMA cor, claro→
// escuro. A rampa é a azul validada do design system (100→700). Nada de
// arco-íris: hue variável em dado ordenado engana a leitura.
//
// A cor sozinha não carrega a informação (§70/§80): cada célula tem `title`,
// rótulo para leitor de tela, e a tabela equivalente fica em <details>.
import { useMemo, useState } from 'react';
import { Icone } from '../shell/Icone';
import { duracao } from '../lib/tz';

/** Rampa sequencial azul — steps 100→700 do design system, validados. */
const RAMPA = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'];

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export interface CelulaHeat {
  dow: number;      // 0..6
  hora: number;     // 0..23
  minutos: number;  // ocupação acumulada
  eventos: number;
}

interface Props {
  celulas: CelulaHeat[];
  horaInicio: number;
  horaFim: number;
  /** Cross-filter (§67): clicar numa célula filtra o resto da tela. */
  selecao: { dow: number; hora: number } | null;
  onSelecionar: (c: { dow: number; hora: number } | null) => void;
}

export function HeatmapD3({ celulas, horaInicio, horaFim, selecao, onSelecionar }: Props) {
  const [hover, setHover] = useState<CelulaHeat | null>(null);

  const horas = useMemo(
    () => Array.from({ length: Math.max(1, horaFim - horaInicio) }, (_, i) => horaInicio + i),
    [horaInicio, horaFim]
  );

  const mapa = useMemo(() => {
    const m = new Map<string, CelulaHeat>();
    celulas.forEach((c) => m.set(`${c.dow}:${c.hora}`, c));
    return m;
  }, [celulas]);

  const max = useMemo(
    () => celulas.reduce((a, c) => Math.max(a, c.minutos), 0),
    [celulas]
  );

  /** Índice da rampa. Zero é caso à parte: não recebe cor, recebe vazio. */
  function passo(min: number): number {
    if (min <= 0 || max <= 0) return -1;
    const t = min / max;
    return Math.min(RAMPA.length - 1, Math.floor(t * RAMPA.length));
  }

  // Geometria em unidades de usuário + viewBox: escala com o container sem
  // recalcular no resize (o §65 pede responsividade e o SVG entrega isso).
  const CEL = 34, ALT = 26, ESQ = 42, TOPO = 20;
  const largura = ESQ + DIAS.length * CEL;
  const altura = TOPO + horas.length * ALT + 4;

  const totalMin = celulas.reduce((a, c) => a + c.minutos, 0);

  return (
    <figure className="gc-figura gc-heat">
      <figcaption className="gc-figura-titulo">
        Ocupação por dia da semana e hora
        {selecao && (
          <button type="button" className="gc-btn gc-btn-fantasma gc-heat-limpar"
                  onClick={() => onSelecionar(null)}>
            <Icone nome="x" tamanho={12} /> Limpar seleção
          </button>
        )}
      </figcaption>

      {totalMin === 0 ? (
        <p className="gc-td-fraco">Sem ocupação no período analisado.</p>
      ) : (
        <div className="gc-heat-wrap">
          <svg viewBox={`0 0 ${largura} ${altura}`} className="gc-heat-svg"
               role="img" aria-label="Mapa de calor de ocupação. Dados equivalentes na tabela abaixo.">
            {DIAS.map((d, i) => (
              <text key={d} x={ESQ + i * CEL + CEL / 2} y={13}
                    className="gc-heat-rot" textAnchor="middle">{d}</text>
            ))}

            {horas.map((h, hi) => (
              <text key={h} x={ESQ - 7} y={TOPO + hi * ALT + ALT / 2 + 4}
                    className="gc-heat-rot" textAnchor="end">
                {String(h).padStart(2, '0')}h
              </text>
            ))}

            {horas.map((h, hi) => DIAS.map((_, di) => {
              const c = mapa.get(`${di}:${h}`) ?? { dow: di, hora: h, minutos: 0, eventos: 0 };
              const p = passo(c.minutos);
              const sel = selecao?.dow === di && selecao?.hora === h;
              const rot = `${DIAS[di]} ${String(h).padStart(2, '0')}h — ${
                c.minutos > 0 ? `${duracao(c.minutos)} em ${c.eventos} evento(s)` : 'livre'}`;
              return (
                <rect
                  key={`${di}:${h}`}
                  x={ESQ + di * CEL + 1}
                  y={TOPO + hi * ALT + 1}
                  width={CEL - 3}
                  height={ALT - 3}
                  rx={4}
                  className={`gc-heat-cel${sel ? ' is-sel' : ''}${p < 0 ? ' is-vazio' : ''}`}
                  fill={p < 0 ? 'var(--gc-surface-2)' : RAMPA[p]}
                  tabIndex={0}
                  role="button"
                  aria-label={rot}
                  aria-pressed={sel}
                  onMouseEnter={() => setHover(c)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(c)}
                  onBlur={() => setHover(null)}
                  onClick={() => onSelecionar(sel ? null : { dow: di, hora: h })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelecionar(sel ? null : { dow: di, hora: h });
                    }
                  }}
                >
                  <title>{rot}</title>
                </rect>
              );
            }))}
          </svg>

          <div className="gc-heat-lateral">
            <div className="gc-heat-legenda" aria-hidden="true">
              <span className="gc-td-fraco">menos</span>
              {RAMPA.map((c) => (
                <i key={c} className="gc-heat-leg" style={{ background: c }} />
              ))}
              <span className="gc-td-fraco">mais</span>
            </div>
            <p className="gc-heat-dica">
              {hover
                ? <><strong>{DIAS[hover.dow]} {String(hover.hora).padStart(2, '0')}h</strong>{' · '}
                    {hover.minutos > 0 ? `${duracao(hover.minutos)} · ${hover.eventos} evento(s)` : 'livre'}</>
                : 'Passe o cursor ou navegue por Tab. Enter seleciona e filtra a tela.'}
            </p>
          </div>
        </div>
      )}

      <details className="gc-tabela-alt">
        <summary>Ver dados em tabela</summary>
        <div className="gc-grid-wrap">
          <table className="gc-grid gc-grid-compacta">
            <thead>
              <tr><th>Hora</th>{DIAS.map((d) => <th key={d}>{d}</th>)}</tr>
            </thead>
            <tbody>
              {horas.map((h) => (
                <tr key={h}>
                  <th scope="row">{String(h).padStart(2, '0')}h</th>
                  {DIAS.map((_, di) => {
                    const c = mapa.get(`${di}:${h}`);
                    return <td key={di}>{c && c.minutos > 0 ? duracao(c.minutos) : '—'}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
