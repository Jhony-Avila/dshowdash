// shell/useShellTheme.ts — tema reativo + leitura de tokens CSS para ECharts/D3.
// @version 1.0.0  @created 2026-07-22 (Fase 2 — motor de visualização)
//
// Por que existe: ECharts (canvas) e D3 (SVG) precisam do VALOR das cores, não do
// `var(--ads-*)`. E precisam ser RECONSTRUÍDOS ao trocar de tema, porque canvas não
// reage a CSS sozinho. Este hook resolve as duas coisas:
//   1) useShellTheme()  → 'light' | 'dark', reagindo a data-theme do <html>.
//   2) useTokensAds()   → resolve tokens --ads-* em hex, recalculando na troca de tema.
//
// ⚠️ Os tokens --ads-* são escopados a [data-ads-react-root], NÃO ao <html>. Ler de
// document.documentElement devolve "" (paleta vazia → gráfico invisível). Herdado do
// bug já resolvido no panel-datatables (useShellTheme.ts).
import { useEffect, useState } from 'react';

export type Tema = 'light' | 'dark';

function lerTemaAtual(): Tema {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/** Elemento onde os tokens --ads-* estão definidos (root do módulo). */
function elementoTokens(): Element {
  return document.querySelector('[data-ads-react-root]') ?? document.documentElement;
}

/** Tema atual do shell, reagindo à troca via data-theme no <html>. */
export function useShellTheme(): Tema {
  const [tema, setTema] = useState<Tema>(lerTemaAtual);
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const novo = lerTemaAtual();
      setTema((atual) => (atual === novo ? atual : novo));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    setTema(lerTemaAtual()); // pode ter mudado entre render inicial e efeito
    return () => obs.disconnect();
  }, []);
  return tema;
}

/** Lê um único token --ads-* em valor computado (hex/rgb), com fallback. */
export function lerToken(nome: string, fallback = ''): string {
  try {
    const v = getComputedStyle(elementoTokens()).getPropertyValue(nome).trim();
    return v || fallback;
  } catch {
    return fallback;
  }
}

export interface PaletaAds {
  primary: string; primaryH: string; ok: string; warn: string; danger: string;
  purple: string; cyan: string; pink: string;
  text: string; textDim: string; border: string;
  surface: string; surface2: string; bg: string;
  /** Sequência categórica coerente com a marca (para séries múltiplas). */
  seq: string[];
}

const MAPA: Record<keyof Omit<PaletaAds, 'seq'>, [string, string]> = {
  primary:  ['--ads-primary', '#4c6ef5'],
  primaryH: ['--ads-primary-h', '#5c7cff'],
  ok:       ['--ads-ok', '#22c55e'],
  warn:     ['--ads-warn', '#f59e0b'],
  danger:   ['--ads-danger', '#ef4444'],
  purple:   ['--ads-purple', '#a78bfa'],
  cyan:     ['--ads-cyan', '#22d3ee'],
  pink:     ['--ads-pink', '#ec4899'],
  text:     ['--ads-text', '#e9e9f2'],
  textDim:  ['--ads-text-dim', '#9a9ab2'],
  border:   ['--ads-border', '#2c2c42'],
  surface:  ['--ads-surface', '#1a1a28'],
  surface2: ['--ads-surface-2s', '#222234'],
  bg:       ['--ads-bg', '#12121c'],
};

/** Resolve a paleta --ads-* em hex, recalculando a cada troca de tema. */
export function useTokensAds(): PaletaAds {
  const tema = useShellTheme();
  const [pal, setPal] = useState<PaletaAds>(() => resolverPaleta());
  useEffect(() => { setPal(resolverPaleta()); }, [tema]);
  return pal;
}

function resolverPaleta(): PaletaAds {
  const el = elementoTokens();
  let cs: CSSStyleDeclaration | null = null;
  try { cs = getComputedStyle(el); } catch { cs = null; }
  const get = (nome: string, fb: string) => {
    const v = cs?.getPropertyValue(nome).trim();
    return v || fb;
  };
  const out = {} as PaletaAds;
  const alvo = out as unknown as Record<string, string>;
  (Object.keys(MAPA) as (keyof typeof MAPA)[]).forEach((k) => {
    const [nome, fb] = MAPA[k];
    alvo[k] = get(nome, fb);
  });
  out.seq = [out.primary, out.cyan, out.ok, out.purple, out.warn, out.pink, out.danger, out.primaryH];
  return out;
}
