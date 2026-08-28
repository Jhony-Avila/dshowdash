# Track D — Design Spec Mobile do Shell Global

Todas as regras valem **só** sob `#app-shell[data-mobile]` (flag `as6.mobile_shell`).

## Header
- Altura 56px + `safe-area-inset-top`. Identidade (logo) sempre visível.
- As ~14 integrações não cabem em 320–430px em uma linha → **scroller horizontal**
  com momentum e `scroll-snap` (contém as ações; o DOCUMENTO nunca estoura). O
  menu "Mais"/overflow real é a próxima onda (requer DOM/JS — ver FINAL_REPORT).
- Alvos ≥44×44 (ícones eram 30–32px). Popovers presos à viewport
  (`max-width:100vw-16`, `max-height:100dvh-top`), com safe-area.

## Ticker
- Altura 36px. `prefers-reduced-motion` **para** o `.ticker-track` (gap real: o
  `@media` do ticker não o cobria) e libera leitura por scroll horizontal.
- Hook de pausa central: `.news-ticker-component[data-ticker-paused="1"]`. O
  controle visível de pausar/anterior/próximo é próxima onda (DOM/JS).

## Nav-rail → Bottom navigation
- `position:fixed; bottom:0`, altura 64px + `safe-area-inset-bottom`. Já populada
  por `MOBILE_ITEMS` (home/dashboard/financeiro/analytics/menu). Alvos ≥44.
- Pendência de dados: `toggle-sidebar` em `MOBILE_ITEMS` deve virar "Menu" que
  abre o drawer (agora reabilitado <500px) — trocar o item no registro (JS, próxima onda).

## Sidebar → Drawer
- Reabilitado <500px (neutraliza os dois `display:none !important`). Geometria:
  `fixed`, top 92, bottom 64+safe, `width:min(86vw,320px)`, `translateX(-100%)`
  fechado / `0` aberto, transição respeitando reduced-motion. Backdrop cobre a viewport.
- Pendências de comportamento (JS, próxima onda, ver AUDIT): fechar por Escape;
  focus-trap + `aria-expanded/controls` + retorno de foco + `inert` no resto;
  corrigir o wiring de `setup-coordinator.ts:137,143`; passar o scroll-lock/foco
  pela governança central do `overlay-layer` (elimina órfãos).

## Footer
- No **fluxo** (`position:static`) no fim do scroll do main — não compete com a
  bottom-nav. Alvos ≥44 (eram 22–40). Padding-bottom com safe-area. Termos,
  Privacidade, LGPD, idioma, Sair alcançáveis.

## Layout global
- Uma superfície de scroll (main). Sem números mágicos concorrentes: tokens
  unificados sob o marcador. Considera **altura/orientação** (paisagem baixa = mobile).
