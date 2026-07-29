// components/AvatarSvg.tsx — exibe um AvatarConfig renderizado pelo motor.
// @version 1.0.0  @created 2026-07-29
//
// O markup vem 100% do nosso motor determinístico (nenhum dado externo entra
// no SVG sem normalização) — por isso o innerHTML aqui é seguro por construção.
import { useMemo } from 'react';
import type { AvatarConfig } from '../domain/types';
import { svgDe } from '../services/AvatarCatalog';

export function AvatarSvg({ config, forma = 'quadrado', estatico = false, uid, aoClicar, titulo }: {
  config: AvatarConfig;
  forma?: 'quadrado' | 'circulo';
  /** congela animações SMIL (usar em thumbnails de grade) */
  estatico?: boolean;
  /** prefixo explícito de <defs> — obrigatório quando há N instâncias do MESMO config */
  uid?: string;
  aoClicar?: () => void;
  titulo?: string;
}) {
  const svg = useMemo(
    () => svgDe(config, { forma, estatico, uid }),
    [config, forma, estatico, uid],
  );

  if (aoClicar) {
    return (
      <button type="button" className="avst-svg avst-svg-botao" title={titulo}
        onClick={aoClicar} dangerouslySetInnerHTML={{ __html: svg }} />
    );
  }
  return <div className="avst-svg" title={titulo} dangerouslySetInnerHTML={{ __html: svg }} />;
}
