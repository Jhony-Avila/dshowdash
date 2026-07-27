// components/ui/animacao.ts — utilidades de animação discreta (Elevação §21).
// @version 1.0.0  @created 2026-07-21
//
// Duas peças, ambas OBRIGADAS a respeitar `prefers-reduced-motion: reduce`
// (lição do projeto: reduced-motion que congela NÃO é bug — é acessibilidade).
//   • usePrefereMenosMovimento(): reativo ao toggle do SO.
//   • useContador(alvo): count-up suave de números (KPIs), sem animar quando o
//     valor não mudou (evita re-animar a cada refetch de dados iguais).
import { useEffect, useRef, useState } from 'react';

export function usePrefereMenosMovimento(): boolean {
  const consulta = (): boolean =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [reduz, setReduz] = useState<boolean>(consulta);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const aoMudar = (): void => setReduz(mq.matches);
    mq.addEventListener('change', aoMudar);
    return () => mq.removeEventListener('change', aoMudar);
  }, []);

  return reduz;
}

/**
 * Count-up suave (easeOutCubic) de 0 até `alvo` no 1º render e, depois, do valor
 * anterior até o novo `alvo` quando ele muda. Se `prefers-reduced-motion`, vai
 * direto ao valor final (sem animar). Não anima se o alvo não mudou.
 */
export function useContador(alvo: number, duracaoMs = 680): number {
  const reduz = usePrefereMenosMovimento();
  const [valor, setValor] = useState<number>(reduz ? alvo : 0);
  const deRef = useRef<number>(reduz ? alvo : 0);

  useEffect(() => {
    const de = deRef.current;
    if (reduz || de === alvo || !Number.isFinite(alvo)) {
      setValor(alvo); deRef.current = alvo; return;
    }
    let raf = 0;
    let inicio = 0;
    const passo = (t: number): void => {
      if (!inicio) inicio = t;
      const p = Math.min(1, (t - inicio) / duracaoMs);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setValor(Math.round(de + (alvo - de) * eased));
      if (p < 1) { raf = requestAnimationFrame(passo); }
      else { deRef.current = alvo; }
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [alvo, duracaoMs, reduz]);

  return valor;
}
