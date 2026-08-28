# Track D — Arquitetura Responsiva do Shell Global

## Princípio (igual ao Track C, agora no shell inteiro)
Decisão de layout **centralizada**, aditiva e atrás de flag desligável. Zero
duplicação de lógica; zero edição de regra desktop existente → desktop **byte a
byte** por construção.

## Componentes da arquitetura

1. **Marcador central** — `app-shell/adapters/responsive-adapter/mobile-marker.ts`.
   Estende o `responsive-adapter` que já existe (não cria brain novo). A cada
   `resize`/`orientationchange` calcula, por **largura E altura** (sem
   UA-sniffing), e escreve no `#app-shell`:
   - `data-mobile="1"` quando largura ≤768 **ou** paisagem com altura ≤520
     (resolve o 844×390 que recebia desktop);
   - `data-viewport="xs|sm|md|lg|xl|xxl"` e `data-orientation`.
   Gated pela flag **`as6.mobile_shell`** (default **OFF**). Flag OFF → o módulo
   nem instala listeners e remove qualquer resíduo → **inerte**.

2. **Política CSS central** — `app-shell/styles/global-mobile.css` (carregada por
   último no `index.html`). **Todos** os 24 seletores são escopados a
   `#app-shell[data-mobile]`. Consolida os **3 sistemas de token** divergentes
   (shell `--shell-*` 56/92/76 × sidebar `--sidebar-width:280` × nav-rail
   `--nav-rail-width:72` × footer `--footer-height-total:88`) redefinindo, **só
   sob o marcador**, os nomes legados que cada região lê para uma fonte única.

3. **Uma superfície de scroll** — o `.dsd-shell__region--main` (já `position:fixed;
   overflow-y:auto`, sem `100vh`) é reancorado entre header+ticker e a bottom-nav
   (reserva a altura dela + safe-area). Rail/sidebar não consomem largura no
   telefone.

## Fronteiras (unificadas sob o marcador)
| Região | Desktop (intocado) | Mobile (sob marcador) |
|---|---|---|
| header | 60px | 56px + safe-top; ações em scroller horizontal |
| ticker | 40px | 36px; reduced-motion para o `.ticker-track` |
| nav-rail | 56px lateral | bottom-nav 64px + safe-bottom |
| sidebar | 240px fixa | drawer `min(86vw,320px)`, reabilitado <500px |
| footer | 76px fixo | no fluxo (não compete com bottom-nav) + safe |
| main | offsets `--shell-*` | top 92 / bottom 64+safe / left-right safe |

## Rollback
Desligar `as6.mobile_shell` → marcador nunca setado → CSS inteiro inerte →
shell volta ao estado atual byte a byte. Nenhuma migração, nenhum estado gravado.

## Por que aditivo e não editar as regras quebradas
As causas-raiz (ex.: `display:none !important` <500px em dois arquivos) são
**neutralizadas por override de maior especificidade** sob o marcador
(`#app-shell[data-mobile] .dsd-sidebar{display:flex!important}` — id+classe vence
a classe do `@media`), nunca editando a regra desktop. Assim o caminho desktop
não muda um byte, e o rollback é o desligar da flag.
