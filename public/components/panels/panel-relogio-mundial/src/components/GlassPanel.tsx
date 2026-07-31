/**
 * components/GlassPanel.tsx — casca de vidro dos painéis flutuantes.
 * @version 3.0.0
 *
 * Um único componente para todos os painéis sobre o mapa: mesma borda, mesmo blur,
 * mesmo comportamento de recolher, mesmo contrato de acessibilidade. Uma casca só é
 * o que impede a tela de virar sete dialetos de "quase o mesmo cartão".
 *
 * ACESSIBILIDADE: o cabeçalho é um <button> com `aria-expanded` e `aria-controls`
 * apontando para o corpo. Recolhido, o corpo sai do DOM — não basta esconder com
 * CSS, senão leitor de tela e Tab continuam entrando em conteúdo invisível.
 */
'use strict';

import { useId, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type GlassCorner =
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  | 'left' | 'right' | 'bottom' | 'static';

export interface GlassPanelProps {
  title: string;
  icon?: LucideIcon;
  corner?: GlassCorner;
  open: boolean;
  onToggle?: () => void;
  /** Conteúdo do cabeçalho à direita (contadores, ações rápidas). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Largura fixa em px; por padrão o painel se ajusta ao conteúdo. */
  width?: number;
  /** Painel sem cabeçalho recolhível (usado pela timeline). */
  bare?: boolean;
}

export function GlassPanel({
  title, icon: Icon, corner = 'static', open, onToggle,
  aside, children, className, width, bare,
}: GlassPanelProps) {
  const bodyId = useId();

  // O corpo sai do DOM quando recolhido — de propósito: escondê-lo por CSS deixaria
  // Tab e leitor de tela entrando em conteúdo invisível. Logo, `aria-controls` só
  // vale enquanto o corpo existe; apontar para id ausente é referência quebrada.
  const ariaControls = open ? { 'aria-controls': bodyId } : {};

  return (
    <section
      className={`wcm-glass wcm-glass--${corner}${open ? '' : ' is-collapsed'}${className ? ' ' + className : ''}`}
      style={width ? { width: `${width}px` } : undefined}
      aria-label={title}
    >
      {!bare && (
        <header className="wcm-glass__head">
          <button
            type="button"
            className="wcm-glass__toggle"
            onClick={onToggle}
            aria-expanded={open}
            {...ariaControls}
            disabled={!onToggle}
          >
            {Icon && <Icon size={14} className="wcm-glass__icon" aria-hidden="true" />}
            <span className="wcm-glass__title">{title}</span>
            {onToggle && (
              <ChevronDown
                size={14}
                className="wcm-glass__chevron"
                aria-hidden="true"
              />
            )}
          </button>
          {aside && <div className="wcm-glass__aside">{aside}</div>}
        </header>
      )}

      {open && (
        <div className="wcm-glass__body" id={bodyId}>
          {children}
        </div>
      )}
    </section>
  );
}
