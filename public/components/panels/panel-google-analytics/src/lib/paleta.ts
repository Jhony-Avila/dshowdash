// lib/paleta.ts — resolve a paleta do módulo a partir dos tokens CSS vigentes.
// @version 1.0.0  @created 2026-07-30
//
// Molde: `useTokensAds` de panel-ads/src/shell/useShellTheme.ts.
//
// ⚠️ POR QUE LER DO CSS EM VEZ DE CONSTANTES NO TS: os gráficos D3 desenham SVG à mão, e
// atributos SVG (`fill`, `stroke`) NÃO entendem `var(--ga-laranja)`. Se as cores virassem
// constantes no TypeScript, o gráfico ficaria preso a um tema enquanto o resto do painel
// troca — o clássico "gráfico escuro no tema claro". Aqui a fonte da verdade continua sendo
// `tokens.css`, e o D3 lê o valor JÁ RESOLVIDO pelo navegador.
import { useEffect, useState } from 'react';

export interface Paleta {
  txt: string; txt2: string; txt3: string;
  borda: string; bordaForte: string;
  surface: string; bg: string; bg2: string;
  laranja: string; laranjaForte: string; amarelo: string; roxo: string;
  ok: string; alerta: string; erro: string; info: string;
  /** Sequência categórica — usada quando cada nó/fatia precisa de cor própria. */
  seq: string[];
}

const MAPA: Record<keyof Omit<Paleta, 'seq'>, [string, string]> = {
  txt: ['--ga-txt', '#ECECF2'],
  txt2: ['--ga-txt-2', '#A9A9BE'],
  txt3: ['--ga-txt-3', '#7A7A93'],
  borda: ['--ga-borda', '#2F2F45'],
  bordaForte: ['--ga-borda-forte', '#3C3C57'],
  surface: ['--ga-surface-opaca', '#232334'],
  bg: ['--ga-bg', '#14141F'],
  bg2: ['--ga-bg-2', '#1C1C2B'],
  laranja: ['--ga-laranja', '#E8710A'],
  laranjaForte: ['--ga-laranja-forte', '#F29900'],
  amarelo: ['--ga-amarelo', '#FBBC04'],
  roxo: ['--ga-roxo', '#7C4DFF'],
  ok: ['--ga-ok', '#17A673'],
  alerta: ['--ga-alerta', '#F59E0B'],
  erro: ['--ga-erro', '#E5484D'],
  info: ['--ga-info', '#3B82F6'],
};

function raiz(): Element {
  return document.querySelector('[data-ga-react-root]') ?? document.documentElement;
}

export function resolverPaleta(): Paleta {
  let cs: CSSStyleDeclaration | null = null;
  try { cs = getComputedStyle(raiz()); } catch { cs = null; }
  const get = (nome: string, fb: string) => (cs?.getPropertyValue(nome).trim() || fb);

  const out = {} as Paleta;
  const alvo = out as unknown as Record<string, string>;
  (Object.keys(MAPA) as (keyof typeof MAPA)[]).forEach((k) => {
    const [nome, fb] = MAPA[k];
    alvo[k] = get(nome, fb);
  });

  // Ordem pensada para contraste entre vizinhos, não para "bonito em lista": num Sankey as
  // cores adjacentes ficam encostadas e sequência mal ordenada vira borrão.
  out.seq = [out.laranja, out.roxo, out.info, out.ok, out.amarelo, out.erro, out.laranjaForte, out.alerta];
  return out;
}

/**
 * Paleta reativa ao tema.
 *
 * ⚠️ O shell troca o tema mexendo em `html[data-theme]` / `body.theme-*`. Um `useState` sem
 * observador ficaria com a paleta do primeiro paint para sempre — e o gráfico seria a única
 * parte do painel que não acompanha o tema. Daí o MutationObserver nos dois alvos reais.
 */
export function usarPaleta(): Paleta {
  const [pal, setPal] = useState<Paleta>(() => resolverPaleta());

  useEffect(() => {
    const atualizar = () => setPal(resolverPaleta());
    const obs = new MutationObserver(atualizar);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    if (document.body) {
      obs.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    }
    // Tema por preferência do sistema (o default do dashboard é SYSTEM).
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener?.('change', atualizar);
    return () => { obs.disconnect(); mq?.removeEventListener?.('change', atualizar); };
  }, []);

  return pal;
}

/** Cor de uma camada do Sankey — mesma cor para a mesma etapa em qualquer tela. */
export function corDaCamada(pal: Paleta, camada: string): string {
  switch (camada) {
    case 'canal': return pal.laranja;
    case 'origem-midia': return pal.roxo;
    case 'campanha': return pal.info;
    case 'landing': return pal.amarelo;
    case 'conversao': return pal.ok;
    default: return pal.txt3;
  }
}
