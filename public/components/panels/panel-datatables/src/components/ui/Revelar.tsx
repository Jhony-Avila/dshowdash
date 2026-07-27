// components/ui/Revelar.tsx — entrada discreta (fade + slide) de blocos/cards.
// @version 1.0.0  @created 2026-07-21
// Aditivo e acessível: sob `prefers-reduced-motion` NÃO anima (renderiza estático).
// `atraso` permite stagger (ex.: index * 40ms) numa grade de cards.
import type { JSX, ReactNode } from 'react';
import { usePrefereMenosMovimento } from './animacao';
import css from './Revelar.module.css';

export function Revelar({ children, atraso = 0, className = '' }: {
  children: ReactNode; atraso?: number; className?: string;
}): JSX.Element {
  const reduz = usePrefereMenosMovimento();
  return (
    <div
      className={`${reduz ? '' : css.revelar} ${className}`}
      style={reduz ? undefined : { animationDelay: `${atraso}ms` }}
    >
      {children}
    </div>
  );
}
