# AVST5 · Shell responsivo (`as6.shell_layout_v2`) — decisão de arquitetura #88

## Causa-raiz (medida no shell real, flag OFF — produção d7bfa379)
| sintoma | medida |
|---|---|
| tablet 768×1024 | a região da sidebar reserva **240px** mas o `.dsd-sidebar` está fora da tela (`translateX(-100%)` do bundle ≤768px) → faixa preta de 240px e main espremido a 472px |
| mobile 360–575 | **nenhuma navegação**: nav-rail vira barra inferior de 64px com o `.nav-rail--desktop` `display:none` (o `.nav-rail--mobile` nunca é renderizado) e a sidebar é `display:none !important` (≤500px); sem botão de abrir |
| rodapé | `.dsd-footer` `position:fixed` (33px) dentro de uma região fixa de 76px → **43px de vão** no desktop e 107px no mobile entre o main e a linha do rodapé; regiões fixas (main com `top/bottom`) = dois scrolls (main + corpo do container) |
| sidebar recolhida | 72px de ícones **sem tooltip e sem nome acessível** (`.dsd-sidebar__item-text{display:none}` esvazia o nome do link) |
| FAB de devtools | `bottom:20px` cobre a linha do rodapé; `div` sem `role`/nome; visível p/ todo perfil |

## Arquitetura (aditiva, fail-closed — §651; mesmo padrão do header v2, doc 23)
Módulo standalone `public/components/app-shell/layout-v2/` (`index.ts` → `index.js` via
`scripts/shell/build-shell-layout-v2.sh`; **nunca editar o .js à mão**) + `shell-layout-v2.css` injetado só
com a flag ON; 1 `<script type="module">` no `index.html`. Bundles do app-shell/sidebar/nav-rail/footer
**não** são rebuildados (regra do repo; os dists são gitignored). Flag `as6.shell_layout_v2` em
`nucleo/flags.ts` (default OFF, `FLAGS_REMOTAS`), resolvida como a do header v2 (override local → API por
usuário → OFF). **Separada** de `as6.mobile_header_v2` e composta com ela: o layout consome
`--shell-top-stack-height` (contrato do header v2) com fallback nos tokens do app-shell; o header v2, com o
layout ON, não liga o próprio fluxo (1.1.1). Com as duas OFF: byte a byte (gate `FLAG_OFF_IDENTITY_SHELL`).

### Reúso (nada duplicado)
- modo de tela = `body[data-device]` do responsive-adapter (mobile-* → compacto; tablet; demais → wide);
- expandir/recolher = o **próprio componente sidebar** (`.dsd-sidebar__toggle` → collapse-methods →
  layout-manager → `body.sidebar-collapsed` + `localStorage['dshowdash-layout-sidebarCollapsed']`). O
  módulo só consome `body.sidebar-collapsed` para a coluna da grade; o estado da sidebar **não** é flag;
- navegação mobile = as **mesmas regiões** nav-rail e sidebar (DOM intacto) reposicionadas como gaveta;
- z-index = `--shell-z-nav-rail` (150) / `--shell-z-sidebar` (100) / scrim = sidebar − 1 / header 500.

### Composição (decisão #88)
`#app-shell` = grade `rail | side | main` × `main / foot`, `min-height:100dvh`, `padding-top` = topo
(header+ticker fixos). nav-rail e sidebar são **sticky** (altura = viewport − topo); **main e footer no
fluxo** (documento rola; rodapé após o conteúdo; página curta → rodapé no fim do viewport por estrutura).
`grid-template-columns` anima → reflow real do main e do rodapé ao recolher/expandir. Tablet: sidebar
presente e **recolhida ao entrar** quando não há preferência salva (pelo toggle do componente; as chaves de
preferência voltam ao estado anterior — a escolha do usuário não é sobrescrita). Compacto: grade de 1 coluna;
botão "Abrir navegação" (44×44, `aria-expanded/controls`, P1 no header v2) abre a gaveta: nav-rail (trilho de
ícones, nomes no `aria-label`) + sidebar completa (mesmo com preferência "recolhida"), scrim, foco preso,
Esc/scrim/botão/ativar item fecham, foco devolvido ao botão, fundo travado com posição preservada
(`body{position:fixed; top:-scrollY}` + `touchmove` cancelado fora), safe areas por `env()`.
Tooltip acessível na sidebar recolhida (`role=tooltip` + `aria-describedby`, elemento no body — não é
recortado pelo scroll da sidebar) e nome acessível dos itens (`aria-label` a partir do texto).
Dashboard: polimento responsivo no CSS do próprio painel (`panel-dashboard/src/styles/tokens.css`),
escopado a `html[data-shell-layout-v2="on"]`: ações em grade que ocupa a largura útil sem espremer o título,
hero imersivo com respiro proporcional (22vh), grades 2→1 coluna, sem `min-width` fixo.
FAB de devtools: perfil admin (gate existente `data-role`), âncora acima da linha do rodapé (altura medida),
`role/aria-label`, some com a gaveta aberta.

## Provas
`scripts/shell/audit-shell-layout-v2.mjs` (shell real autenticado, preview do worktree; `MH2_BASE` p/ produção) +
`scripts/shell/gates-shell-layout-v2.mjs` (consolida ON/OFF/prod-OFF + GATES-R2 do header). Regras de
honestidade iguais às do doc 23 (baseline de console = produção OFF; qualquer FAIL bloqueia canário).

## Rollout global (decisão #91 — 2026-09-12)
Depois da validação visual do canário u75, `as6.mobile_header_v2` e `as6.shell_layout_v2` foram ligadas
GLOBAL (`is_enabled=1`, `rollout_percentage=100`), **uma por vez** (header primeiro, shell depois), pelo
tooling `scripts/deploy/global-flag-rollout.php` (RUNBOOK, Anexo C): schema + `UNIQUE` validados, backup
fiel + `rollback.sql`, escrita mínima idempotente, read-after-write na fonte + prova pelo
`FeatureFlagResolver` com usuário-sonda sem override (u546 = `screenshot-bot`, `rollout_excluded` → `global`),
auto-rollback em falha de verificação. Smoke após cada flip na produção servida **sem override local**
(`scripts/deploy/smoke-flags-prod.mjs`, 10/10 PASS: health 200, resolve `source=global`,
`html[data-shell-layout-v2="on"]` em 390×844 e 1440×900, overflow-x 0, sem erro de página, sem erro novo de
console vs baseline OFF). Deploy prévio só de tooling (6846297d, `DEPLOY_AS5_OK`); bundle preso intocado.
Evidências: `/backup/rollout-global-u75-20260912-0113/` (`HANDOFF.md`, `flip-*.txt`, `smoke-*/SMOKE.txt`).

## Rollback
**Global (alavanca de flag, sem redeploy — classic volta em segundos):**
```bash
ROLLOUT_BK=/backup/global-rollback-$(date +%Y%m%d-%H%M%S) ROLLOUT_FLAG=as6.shell_layout_v2 ROLLOUT_PCT=0 \
  php /var/www/dshowdash/scripts/deploy/global-flag-rollout.php
```
(se for reverter as duas: shell v2 primeiro, depois `as6.mobile_header_v2` — o shell compõe sobre o header;
confirmar com `smoke-flags-prod.mjs --expect header=off,shell=off`). SQL equivalente já gravado em
`/backup/rollout-global-u75-20260912-0113/flip-2-shell-layout-v2/rollback.sql`.
**Por usuário:** override do u75 — `rollback.sql` do canário. **Último recurso:** remover a linha do
`<script>` no `index.html`. Nenhuma outra superfície muda com a flag OFF.
