# Track D — Auditoria Mobile do Shell Global (causas-raiz, evidência file:line)

Base: candidato `36a2bafe` (tree `1780149d`). Branch: `mobile/global-site-hardening`.
Método: auditoria estática do código-fonte real (TS é fonte de verdade; CSS-fonte é
escrito à mão — os `dist/`/`*.bundle.css` são gerados, **não** editados). O shell
global é uma SPA autenticada (auth/session/CSRF/kernel) — **a validação da sessão
autenticada ao vivo é do Jhony**; esta auditoria é do código.

## Veredito por suspeita

| Suspeita | Veredito | Evidência |
|---|---|---|
| Header ~1238px cortado em 320–430 | **CONFIRMADO** | `.header-right` flex sem `flex-wrap` e filhos sem `min-width:0` — `header/styles/header-base.layout.css:33-38`; poda mobile por prioridade é **código morto** (mira `.header-component[data-priority]`, mas o wrapper montado é `.header-component-wrapper` e nunca recebe `data-priority`) — `header/styles/header-components.css:23-33` vs `header/core/components-loader.ts:101`; sem menu "Mais" (grep vazio) |
| Sidebar `display:none !important` <500px | **CONFIRMADO (duplo)** | `sidebar/styles/modules/03-layout.css:360`; `app-shell/styles/_responsive.css:28` — sidebar/drawer inacessível em telefone retrato |
| Sidebar 0×0 ao abrir | **REFUTADO** | Na faixa 501–768px tem 280px reais (`03-layout.css:337-350`); abaixo de 500px é `display:none`, não 0×0 |
| Drawer desalinhado | **CONFIRMADO** | Lê tokens de sistema paralelo: `--header-ticker-total` **indefinido** (fallback 100), `--nav-rail-width:72` (nav-rail) vs shell `--shell-nav-rail-width:56`, `--footer-height-total` 116 (fallback) vs footer real 88 — `03-layout.css:337-355` |
| Bottom-nav vazia | **REFUTADO** | Populada de `nav-rail/registry/items.ts:88` (`MOBILE_ITEMS`, 6 itens) via `getMobileItems()`; mas inclui `toggle-sidebar` que abre um drawer `display:none` <500px = botão morto |
| Footer controles abaixo da viewport | **CONFIRMADO (risco)** | `position:fixed;bottom:0` cresce multi-linha sem `max-height`/scroll no mobile (`footer/styles/footer.base.container.css:6-10`, `footer.responsive.css:54-100`); sem reserva de espaço (`--footer-height-total:88px` definido mas não aplicado a body/main) → sobrepõe conteúdo; sem `safe-area-inset-bottom` |
| Ticker ignora reduced-motion | **CONFIRMADO** | Marquee `animation: ticker-scroll 35s linear infinite` (`ticker/ticker-layout.css:60`); classes `.reduced-motion`/`.paused` existem (`:71-72`) mas o JS nunca as aplica ao track real; `@media (prefers-reduced-motion)` de `ticker/styles/accessibility.css:48-63` **não** cobre `.ticker-track` → marquee continua rolando; sem controles pausar/anterior/próximo |
| Alvos de toque < 44px | **CONFIRMADO** | Header ícones ~30-32px (`header-base.components.css:31`, `fallback.css:8,34`); footer `.dsd-footer__control-btn` 22px (`footer.base.bottombar.css:164`), `.dsd-dock-item` 40→34px (`footer.tokens.css:101`, `footer.responsive.css:126`) |
| Tokens de offset centralizados | **AUSENTE (3 sistemas concorrentes)** | `app-shell/styles/_tokens.css` (`--shell-*`: header 60/56, rail 56, sidebar 240, footer 76) vs sidebar `--sidebar-width:280` vs nav-rail `--nav-rail-width:72` vs footer `--footer-height-total:88`; `--header-ticker-total` indefinido |
| Breakpoints contraditórios | **CONFIRMADO** | Shell 500/768; sidebar JS 768 (`sidebar/features/mobile-handler.ts:84`) × nav-rail JS 500 (`nav-rail/ui/behaviors.ts:89`); header 767/1023 × ticker/footer 768/1024; footer breakpoint órfão 720 (`footer.contextual.css:87`). Faixa 501–768: drawer ativo mas rail ainda desktop |
| Altura/landscape | **NÃO CONSIDERADO** | Zero media query de `height`/orientação em qualquer região; 844×390 (largura>768) recebe layout desktop completo (~176px de chrome em 390px de altura) |
| UA-sniffing de layout | **REFUTADO** | Só `innerWidth`/`matchMedia`; `navigator.userAgent` apenas em telemetria (`header/core/mount-handler.ts:124`) |
| Scroll-lock/foco órfão (sidebar) | **RISCO CONFIRMADO** | O drawer usa `.dsd-sidebar-overlay` + classe `body.sidebar-mobile-open` (`sidebar/features/mobile-handler.ts:163`), **fora** da governança central do `overlay-layer` (`core/reference-counter.ts`, `core/auto-recovery.ts:92`, `core/focus-governance.ts`) → não é contado nem recuperado; sem focus-trap, sem `aria-expanded/controls`, sem retorno de foco, sem Escape (só limpa a busca — `sidebar/features/event-setup.ts:314`); wiring quebrado em `sidebar/lifecycle/setup-coordinator.ts:137,143` (passa função onde se espera `{container,onClose}`) → backdrop some mas `closeMobile` não é chamado |

## Fontes de navegação (fragmentadas)
- Sidebar: `sidebar/registry/registry.js` + `sidebar/integration/navigation-model-loader.js`.
- Nav-rail/bottom-nav: `nav-rail/registry/items.ts` (`MOBILE_ITEMS`).
- **Dois registros distintos** para a mesma navegação → a bottom-nav não reusa o registro da sidebar. Unificar a fonte é pré-requisito para a bottom-nav "derivar do mesmo registro".

## O que já é bom (reusar, não recriar)
- `overlay-layer/` tem governança central sólida de z-index (`ui/zindex-manager.ts`), scroll-lock por contagem com auto-recuperação (`core/reference-counter.ts`, `core/auto-recovery.ts`, `core/hardening.ts`) e foco (`ui/focus-manager/`, `core/focus-governance.ts`). **A correção da sidebar mobile deve passar a usar essa governança**, não inventar outra.
- `app-shell/styles/_tokens.css` já se declara "FONTE ÚNICA DE VERDADE" — é o lugar certo para consolidar os offsets; hoje sidebar/nav-rail/footer não o consomem.
- `.dsd-shell__region--main` é `position:fixed; overflow-y:auto` por offsets (`app-shell/styles/_regions.css:87-102`) — **uma** superfície de scroll, sem `100vh` (evita o bug de `vh` no iOS). Manter.

## Consequência de projeto (guia das correções)
Todas as correções mobile devem ser **aditivas e escopadas** a um marcador central de
mobile (padrão Track C: `data-mobile`), atrás de flag desligável, **sem alterar
nenhuma regra desktop existente** → desktop byte a byte por construção. Onde uma regra
quebrada precisa ser neutralizada (ex.: `display:none !important` <500px), fazê-lo por
**override de maior especificidade sob o marcador mobile**, nunca editando a regra
desktop. Consolidar os offsets numa fonte única lida por todas as regiões.
