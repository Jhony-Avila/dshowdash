/**
 * components/AnalogClock.tsx — relógio analógico sincronizado ao fuso da cidade.
 * @version 3.0.0
 *
 * SVG, não canvas: são poucos elementos, o vetor escala sozinho em qualquer DPI e o
 * ponteiro pode ser animado por CSS sem redesenhar nada.
 *
 * Os ponteiros se movem de forma CONTÍNUA (a hora considera minutos e segundos, o
 * minuto considera os segundos). Ponteiro que pula de minuto em minuto é relógio de
 * parede barato; movimento contínuo é o que faz parecer instrumento.
 *
 * O anel externo escurece na parte do dia que é noite naquele fuso — o relógio
 * repete, em miniatura, a informação que o mapa dá em escala planetária.
 */
'use strict';

import { memo, useId, useMemo } from 'react';
import { zonedParts } from '@/lib/time';
import { sunTimes } from '@/lib/astro';

export interface AnalogClockProps {
  date: Date;
  tz: string;
  lat: number;
  lng: number;
  size?: number;
  /** Mostra o arco de luz do dia no aro externo. */
  daylightRing?: boolean;
}

const R = 50;

function AnalogClockImpl({ date, tz, lat, lng, size = 128, daylightRing = true }: AnalogClockProps) {
  // id ÚNICO por instância. Com um id fixo, os 4+ relógios da tela (painel Relógio +
  // faixa de Relógios simultâneos) repetiam `wcm-analog-face` — HTML inválido, e todos
  // os SVGs passavam a referenciar o gradiente do PRIMEIRO via url(#…). Não aparecia
  // porque os gradientes são iguais; quebraria no dia em que deixassem de ser.
  const gradId = `wcm-analog-face-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const p = zonedParts(date, tz);
  const seconds = p.second;
  const minutes = p.minute + seconds / 60;
  const hours = (p.hour % 12) + minutes / 60;

  const secAngle = seconds * 6;
  const minAngle = minutes * 6;
  const hourAngle = hours * 30;

  // Arco do dia claro no aro: 0h no topo, sentido horário, escala de 24 h.
  const arc = useMemo(() => {
    if (!daylightRing) return null;
    const st = sunTimes(date, lat, lng);
    if (st.midnightSun) return { d: describeArc(0, 359.99), polar: 'Sol da meia-noite' };
    if (st.polarNight || !st.sunrise || !st.sunset) return { d: '', polar: 'Noite polar' };

    const toAngle = (d: Date) => {
      const zp = zonedParts(d, tz);
      return ((zp.hour * 60 + zp.minute) / 1440) * 360;
    };
    const a0 = toAngle(st.sunrise);
    const a1 = toAngle(st.sunset);
    return { d: describeArc(a0, a1 > a0 ? a1 : a1 + 360), polar: null };
  }, [date, tz, lat, lng, daylightRing]);

  const label = `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;

  return (
    <svg
      className="wcm-analog"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`Relógio analógico marcando ${label}`}
    >
      <defs>
        <radialGradient id={gradId} cx="38%" cy="32%">
          <stop offset="0%" stopColor="var(--wcm-analog-face-1)" />
          <stop offset="100%" stopColor="var(--wcm-analog-face-2)" />
        </radialGradient>
      </defs>

      <circle cx="60" cy="60" r="56" className="wcm-analog__rim" />

      {arc?.d && (
        <path
          d={arc.d}
          className="wcm-analog__daylight"
          fill="none"
          transform="translate(60 60)"
        />
      )}

      <circle cx="60" cy="60" r={R} fill={`url(#${gradId})`} className="wcm-analog__face" />

      {/* Marcas: traço grosso a cada 3 h, fino nas demais. */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 - 90) * (Math.PI / 180);
        const outer = R - 4;
        const inner = R - (i % 3 === 0 ? 11 : 7);
        return (
          <line
            key={i}
            x1={60 + Math.cos(a) * inner}
            y1={60 + Math.sin(a) * inner}
            x2={60 + Math.cos(a) * outer}
            y2={60 + Math.sin(a) * outer}
            className={i % 3 === 0 ? 'wcm-analog__tick is-major' : 'wcm-analog__tick'}
          />
        );
      })}

      <g transform={`rotate(${hourAngle} 60 60)`}>
        <line x1="60" y1="62" x2="60" y2="32" className="wcm-analog__hand is-hour" />
      </g>
      <g transform={`rotate(${minAngle} 60 60)`}>
        <line x1="60" y1="64" x2="60" y2="20" className="wcm-analog__hand is-min" />
      </g>
      <g transform={`rotate(${secAngle} 60 60)`}>
        <line x1="60" y1="70" x2="60" y2="17" className="wcm-analog__hand is-sec" />
      </g>

      <circle cx="60" cy="60" r="3.2" className="wcm-analog__pivot" />
      <circle cx="60" cy="60" r="1.3" className="wcm-analog__pivot-in" />
    </svg>
  );
}

/** Arco de 24 h no aro externo (raio 56), ângulos em graus a partir do topo. */
function describeArc(startDeg: number, endDeg: number): string {
  const r = 56;
  const toXY = (deg: number) => {
    const a = (deg - 90) * (Math.PI / 180);
    return [Math.cos(a) * r, Math.sin(a) * r];
  };
  const [x0, y0] = toXY(startDeg);
  const [x1, y1] = toXY(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export const AnalogClock = memo(AnalogClockImpl, (a, b) => (
  a.tz === b.tz
  && a.size === b.size
  && a.daylightRing === b.daylightRing
  // Segundo é a menor unidade visível: comparar o Date cru re-renderizaria à toa.
  && Math.floor(a.date.getTime() / 1000) === Math.floor(b.date.getTime() / 1000)
));
