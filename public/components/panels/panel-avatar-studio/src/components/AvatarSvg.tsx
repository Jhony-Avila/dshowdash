// components/AvatarSvg.tsx — exibe um AvatarConfig renderizado pelo motor.
// @version 1.0.0  @created 2026-07-29
//
// O markup vem 100% do nosso motor determinístico (nenhum dado externo entra
// no SVG sem normalização) — por isso o innerHTML aqui é seguro por construção.
import { useMemo } from 'react';
import type { AvatarConfig } from '../domain/types';
import { svgDe } from '../services/AvatarCatalog';

export function AvatarSvg({ config, forma = 'quadrado', estatico = false, uid, foco, aoClicar, titulo }: {
  config: AvatarConfig;
  forma?: 'quadrado' | 'circulo';
  /** congela animações SMIL (usar em thumbnails de grade) */
  estatico?: boolean;
  /** prefixo explícito de <defs> — obrigatório quando há N instâncias do MESMO config */
  uid?: string;
  /** viewBox de ENQUADRAMENTO (AS4 §39.19) — ex.: "64 56 112 112" foca nos olhos */
  foco?: string;
  aoClicar?: () => void;
  titulo?: string;
}) {
  const svg = useMemo(() => {
    const bruto = svgDe(config, { forma, estatico, uid });
    return foco ? bruto.replace('viewBox="0 0 240 240"', `viewBox="${foco}"`) : bruto;
  }, [config, forma, estatico, uid, foco]);

  if (aoClicar) {
    return (
      <button type="button" className="avst-svg avst-svg-botao" title={titulo}
        onClick={aoClicar} dangerouslySetInnerHTML={{ __html: svg }} />
    );
  }
  return <div className="avst-svg" title={titulo} dangerouslySetInnerHTML={{ __html: svg }} />;
}
