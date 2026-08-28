# Track C Mobile — Resultados de Performance/Estabilidade

Instrumentação headless (Playwright/Chromium, 390×844, flag ON) +
`mobile-performance-smoke.mjs`. Headless não é fiel a FPS de device; mede tempos
de interação e estabilidade estrutural.

## Tempos (390×844)

| Métrica | Valor |
|---|---|
| Shell utilizável | ~600ms líquido (1519ms com espera de harness) |
| Troca de categoria | 98ms |
| Abertura de catálogo | 101ms |
| Abertura de ferramenta | 131ms |
| Recursos carregados | 7 |

## Estabilidade (10 ciclos abrir/fechar ferramenta + trocar categoria)

| Métrica | Início | Fim | Δ |
|---|---|---|---|
| Heap JS usado | 12.2 MB | 12.2 MB | **0 MB** (sem leak) |
| Nós de DOM | 4049 | 3097 | −952 (sem crescimento) |
| Erros JS | — | — | **0** |

O Δ negativo de nós reflete categorias com menos cards, não vazamento. Sem
crescimento de listeners (hooks removem no cleanup — `mobileStudio.ts`).

## Bundle

| Item | Valor |
|---|---|
| CSS bundle total | 184 KB (gzip ~31 KB) |
| Regras `data-mobile` no bundle | 96 |
| Delta mobile aproximado | `mobile.css` 357 linhas, ~5 KB gzip |

## Por que é barato

Só layout: nenhuma cópia de store/motor/save; troca mobile↔desktop muda apenas
o atributo `data-mobile`. Palco 2D (não WebGL). Sticky/fixed em vez de JS de
scroll; `overscroll-behavior: contain`; `touch-action` sem delay de 300ms.

## Pendente de device real

FPS de scroll, tempo em 3G, consumo de bateria, layout shifts em Safari/Chrome
mobile — validação humana.
