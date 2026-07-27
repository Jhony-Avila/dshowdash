// viz/tema.ts — tema reativo + leitura dos tokens --pp-* para ECharts.
// @version 1.0.0  @created 2026-07-27  (Fase 4)
//
// Por que existe: ECharts desenha em CANVAS. Canvas nao entende `var(--pp-*)` nem reage
// a troca de tema por CSS — precisa do VALOR resolvido e de ser reconstruido quando o
// tema muda. Este modulo entrega as duas coisas:
//   useTemaPipe()  -> 'light' | 'dark', reagindo a data-theme do <html>.
//   usePaleta()    -> tokens --pp-* ja resolvidos em cor, recalculados na troca de tema.
//
// ⚠️ Os tokens --pp-* sao escopados a [data-pp-react-root] (ver styles/tokens.css), NAO
// ao <html>. Ler de document.documentElement devolve "" -> grafico invisivel. Mesmo bug
// ja pago no panel-datatables e no panel-ads.
import { useEffect, useState } from 'react';

export type Tema = 'light' | 'dark';

function lerTemaAtual(): Tema {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/** Elemento onde os tokens --pp-* estao definidos (root do modulo). */
function elementoTokens(): Element {
  return document.querySelector('[data-pp-react-root]') ?? document.documentElement;
}

/** Tema atual do shell, reagindo a troca via data-theme no <html>. */
export function useTemaPipe(): Tema {
  const [tema, setTema] = useState<Tema>(lerTemaAtual);
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const novo = lerTemaAtual();
      setTema((atual) => (atual === novo ? atual : novo));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    setTema(lerTemaAtual()); // pode ter mudado entre o render inicial e o efeito
    return () => obs.disconnect();
  }, []);
  return tema;
}

export interface Paleta {
  primary: string; ok: string; warn: string; danger: string; sync: string; neutral: string;
  purple: string; cyan: string; pink: string;
  text: string; textDim: string; border: string;
  surface: string; bg: string;
  /** Sequencia categorica coerente com a identidade (series multiplas). */
  seq: string[];
  /** Cores de severidade dos alertas (alinhadas com o backend: high/medium/low). */
  sev: Record<'high' | 'medium' | 'low', string>;
}

const MAPA: Record<Exclude<keyof Paleta, 'seq' | 'sev'>, [string, string]> = {
  primary: ['--pp-primary', '#5b8def'],
  ok:      ['--pp-ok', '#34d399'],
  warn:    ['--pp-warn', '#fbbf24'],
  danger:  ['--pp-danger', '#f87171'],
  sync:    ['--pp-sync', '#60a5fa'],
  neutral: ['--pp-neutral', '#8b8ba3'],
  purple:  ['--pp-purple', '#a78bfa'],
  cyan:    ['--pp-cyan', '#22d3ee'],
  pink:    ['--pp-pink', '#ec4899'],
  text:    ['--pp-text', '#e8e8f0'],
  textDim: ['--pp-text-dim', '#a2a2b8'],
  border:  ['--pp-border', '#2e2e44'],
  // OPACO de proposito: --pp-surface-2 tem alfa no dark e nao serve de fundo de PNG.
  surface: ['--pp-surface', '#1c1c2b'],
  bg:      ['--pp-bg', '#14141f'],
};

function resolverPaleta(): Paleta {
  let cs: CSSStyleDeclaration | null = null;
  try { cs = getComputedStyle(elementoTokens()); } catch { cs = null; }
  const get = (nome: string, fb: string) => (cs?.getPropertyValue(nome).trim() || fb);

  const out = {} as Paleta;
  const alvo = out as unknown as Record<string, string>;
  (Object.keys(MAPA) as (keyof typeof MAPA)[]).forEach((k) => {
    const [nome, fb] = MAPA[k];
    alvo[k] = get(nome, fb);
  });
  out.seq = [out.primary, out.cyan, out.ok, out.purple, out.warn, out.pink, out.danger, out.sync];
  out.sev = { high: out.danger, medium: out.warn, low: out.neutral };
  return out;
}

/** Resolve a paleta --pp-* em cor, recalculando a cada troca de tema. */
export function usePaleta(): Paleta {
  const tema = useTemaPipe();
  const [pal, setPal] = useState<Paleta>(resolverPaleta);
  useEffect(() => { setPal(resolverPaleta()); }, [tema]);
  return pal;
}
