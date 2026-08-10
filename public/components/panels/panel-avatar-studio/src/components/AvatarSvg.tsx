// components/AvatarSvg.tsx — exibe um AvatarConfig renderizado pelo motor.
// @version 1.0.0  @created 2026-07-29
//
// O markup vem 100% do nosso motor determinístico (nenhum dado externo entra
// no SVG sem normalização) — por isso o innerHTML aqui é seguro por construção.
import { useEffect, useMemo, useRef } from 'react';
import type { AvatarConfig } from '../domain/types';
import { svgDe } from '../services/AvatarCatalog';
import { ligarVida } from '../workspace/vida'; // lote 1071-1080 (#109)

export function AvatarSvg({ config, forma = 'quadrado', estatico = false, uid, foco, aoClicar, titulo, palco = false, corpo = false }: {
  config: AvatarConfig;
  forma?: 'quadrado' | 'circulo';
  /** congela animações SMIL (usar em thumbnails de grade) */
  estatico?: boolean;
  /** lote 1071-1080 (#109): modo PALCO — grupos data-anim p/ a vida do
   *  shell (§608; nunca usado em SVG salvo). Ausente = render de sempre. */
  palco?: boolean;
  /** onda 1294 (#137, as6.corpo_preview): CORPO INTEIRO 240×400 do motor
   *  (exige palco no motor — apresentação pura, nunca no SVG salvo);
   *  `foco` é ignorado neste modo (o quadro já é o corpo). */
  corpo?: boolean;
  /** prefixo explícito de <defs> — obrigatório quando há N instâncias do MESMO config */
  uid?: string;
  /** viewBox de ENQUADRAMENTO (AS4 §39.19) — ex.: "64 56 112 112" foca nos olhos */
  foco?: string;
  aoClicar?: () => void;
  titulo?: string;
}) {
  const svg = useMemo(() => {
    const bruto = svgDe(config, {
      forma, estatico, uid,
      ...(palco || corpo ? { palco: true } : {}),
      ...(corpo ? { enquadramento: 'corpo' as const } : {}),
    });
    return foco && !corpo ? bruto.replace('viewBox="0 0 240 240"', `viewBox="${foco}"`) : bruto;
  }, [config, forma, estatico, uid, foco, palco, corpo]);
  // #109: a VIDA acompanha o CICLO do markup — religa a cada svg novo
  // (efeito com dep no próprio svg; quem pede palco sem estatico ganha)
  const refHost = useRef<HTMLDivElement | HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!palco || estatico) return undefined;
    const host = refHost.current;
    if (!host) return undefined;
    let desligar = ligarVida(host);
    // o markup pode ser reescrito por fora do React (mesma string ⇒ dep
    // não muda) — o observer religa a vida no DOM novo, sempre
    const mo = new MutationObserver(() => { desligar(); desligar = ligarVida(host); });
    mo.observe(host, { childList: true });
    return () => { mo.disconnect(); desligar(); };
  }, [svg, palco, estatico]);

  if (aoClicar) {
    return (
      <button ref={refHost as React.RefObject<HTMLButtonElement>} type="button" className="avst-svg avst-svg-botao" title={titulo}
        onClick={aoClicar} dangerouslySetInnerHTML={{ __html: svg }} />
    );
  }
  return <div ref={refHost as React.RefObject<HTMLDivElement>} className="avst-svg" title={titulo} dangerouslySetInnerHTML={{ __html: svg }} />;
}
