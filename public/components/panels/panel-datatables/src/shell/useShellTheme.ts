// shell/useShellTheme.ts — tema REATIVO vindo do app-shell.
// @version 1.0.0  @created 2026-07-20
//
// O shell escreve `data-theme="light"` no <html> (ausencia = dark) e o
// theme-manager troca isso ao vivo, sem recarregar a pagina.
//
// Como estamos no MESMO documento (sem iframe), o CSS ja reage sozinho: os
// tokens `--dt-*` apontam para os globais e mudam junto. Este hook existe para
// o que NAO e CSS — ECharts, canvas e SVG precisam ser reconstruidos com a
// paleta nova. Foi exatamente a limitacao do Koala que quisemos evitar.
import { useEffect, useState, useCallback } from 'react';
import type { Theme } from './types';

function lerTemaAtual(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function useShellTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(lerTemaAtual);

  useEffect(() => {
    // Observa APENAS o atributo data-theme do <html>. Observar subtree aqui
    // saturaria o observer no boot — problema ja registrado neste projeto.
    const obs = new MutationObserver(() => {
      const novo = lerTemaAtual();
      setTheme((atual) => (atual === novo ? atual : novo));
    });

    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Estado pode ter mudado entre o render inicial e o efeito.
    setTheme(lerTemaAtual());

    return () => obs.disconnect();
  }, []);

  return theme;
}

/**
 * Le uma CSS custom property resolvida do shell.
 * Usado por ECharts/SVG, que precisam do VALOR e nao do `var()`.
 */
// ⚠️ Os tokens `--dt-*` são escopados a `[data-dt-react-root]` (tokens.css), NÃO
// ao <html>. Ler de `document.documentElement` devolve "" — o que deixava a
// paleta de gráficos vazia (fatias de pizza invisíveis). Ler do root do módulo.
function elementoTokens(): Element {
  return document.querySelector('[data-dt-react-root]') ?? document.documentElement;
}

export function useShellToken(nome: string, fallback = ''): string {
  const theme = useShellTheme();

  const ler = useCallback(() => {
    const v = getComputedStyle(elementoTokens()).getPropertyValue(nome).trim();
    return v || fallback;
  }, [nome, fallback]);

  const [valor, setValor] = useState(ler);

  // Recalcula quando o tema muda — e o ponto do hook.
  useEffect(() => {
    setValor(ler());
  }, [theme, ler]);

  return valor;
}

/** Vários tokens de uma vez, para montar a paleta de um gráfico. */
export function useShellTokens<T extends Record<string, string>>(mapa: T): Record<keyof T, string> {
  const theme = useShellTheme();
  const [valores, setValores] = useState<Record<keyof T, string>>(() => resolver(mapa));

  useEffect(() => {
    setValores(resolver(mapa));
    // `mapa` e literal nos usos; theme e o gatilho real.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return valores;
}

function resolver<T extends Record<string, string>>(mapa: T): Record<keyof T, string> {
  const cs = getComputedStyle(elementoTokens());
  const out = {} as Record<keyof T, string>;
  for (const chave of Object.keys(mapa) as (keyof T)[]) {
    out[chave] = cs.getPropertyValue(mapa[chave]).trim() || '';
  }
  return out;
}
