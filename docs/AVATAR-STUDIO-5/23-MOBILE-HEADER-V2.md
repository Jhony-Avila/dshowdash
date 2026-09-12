# AVST5 · Header mobile canônico do shell (`as6.mobile_header_v2`) — decisões #71–#87

## Causa-raiz (medida no shell real, 375×812, produção, flag OFF — não é hipótese)
| sintoma | medida |
|---|---|
| `.header-right` não cabe | **1004px** de conteúdo numa barra de 375px → 20 componentes clipados pelo `overflow:hidden !important` da região |
| alvos de toque | **15 controles < 44px** (36×36, 23×36, 29×36…), `--hdr-hit-area-mobile: 32px` |
| semântica | `.notifications-component` é `div` clicável **sem `role`/`tabindex`/nome** |
| alturas conflitantes | `.site-header` = **64px** (`--header-height`) dentro de uma região de **56px** (`--shell-header-height-mobile`) → 8px cortados; `.header-inner` = 52px (`--hdr-height-mobile`) |
| safe area | meta viewport **sem `viewport-fit=cover`**; nenhum `env(safe-area-inset-top)` no shell; a barra do Avatar Studio soma `env()` por conta própria (`padding-top:max(10px,env(...))`) → em aparelho com notch o inset seria consumido DUAS vezes se o shell passasse a tratá-lo |
| tokens | 3 famílias independentes (`--shell-*`, `--hdr-*`, `--header-height`) sem relação entre si |

## Arquitetura (aditiva, fail-closed — §651)
Módulo standalone `public/components/header/mobile-v2/` (`index.ts` → `index.js` via
`scripts/header/build-mobile-header-v2.sh`; **nunca editar o .js à mão**), carregado por
`<script type="module">` no `index.html`. Com a flag OFF ele **não toca no DOM, não injeta CSS e
não altera a meta viewport** (identidade comprovada pelo gate `FLAG_OFF_IDENTITY`). O bundle do
header/app-shell NÃO é rebuildado (regra do repo).

Flag resolvida pelo mecanismo oficial: override local (`localStorage['dshow.avst.flags.v1']`,
mesma chave do Avatar Studio) → `/api/feature-flags?action=resolve&flag=as6.mobile_header_v2`
(por usuário, `credentials:include`, timeout 1,5s) → padrão OFF. Erro/timeout/JSON inválido = OFF.

### Contrato ÚNICO de offsets (decisão #71)
Definido em `mobile-header-v2.css` sobre `html[data-mobile-header-v2="on"]`:
```
--shell-safe-top                = env(safe-area-inset-top, 0px)   (fallback 0px sem env())
--shell-header-content-height   = 60px desktop · 56px ≤768px
--shell-header-total-height     = safe-top + conteúdo   (safe area contada UMA vez)
--shell-ticker-height           = 40px · 36px ≤768px · 0px quando data-shell-ticker="off"
--shell-top-stack-height        = header total + ticker  → consumido por main/sidebar/nav-rail
```
Aliases de transição (tabela completa no cabeçalho do CSS): `--shell-header-height(-mobile)` e
`--hdr-total-height(-mobile)` → total; `--hdr-height(-mobile)` e `--header-height` → conteúdo;
`--shell-ticker-height-mobile` → ticker; `--shell-top-offset(-mobile)` → stack. Os aliases
apontam sempre para o canônico (nunca literal), com especificidade `html[attr]` > `:root`, o que
vence o remapeamento de `_responsive.css` sem rebuild.

### Safe area (decisão #72)
`viewport-fit=cover` é adicionado à meta viewport **só com a flag ON** (OFF = serialização
original, restaurada no `deactivate()`). O inset é aplicado UMA vez como `padding-top` da região
global do header (`.dsd-shell__region--header`, que tem `height = total`). A barra interna do
Avatar Studio deixa de somar `env()` quando o shell canônico está ligado
(`html[data-mobile-header-v2="on"] .vc-barra { padding-top: 8px|10px }`).

### Toque e acessibilidade (decisão #73)
Todo controle visível da barra em modo compacto tem 44×44 efetivos (ícone 18–24px visual),
inclusive em 320px (a hit area não encolhe; o que sai é P4/texto). Badge com `pointer-events:none`
e ancestrais `overflow:visible` (não intercepta nem é cortado). Wrapper `div` clicável sem
semântica (notificações) ganha `role=button`, `tabindex=0`, nome acessível e Enter/Espaço — via
regra GENÉRICA (raiz com `cursor:pointer` e sem controle focável interno), revertida no cleanup.
Foco visível: `outline 2px` em `:focus-visible` para todo controle da região do header.

### Prioridade responsiva (decisão #74)
P1 identidade (avatar/nome/menu) e botão "Mais" · P2 status principal (tráfego) e notificações ·
P3 ações secundárias → menu "Mais" (`role=group`, Esc fecha e devolve o foco, fecha em
pointerdown/focus fora, itens seguem a visibilidade do PRÓPRIO controle) · P4 texto auxiliar
(nome some ≤360px; fica no `aria-label`). Padrão fail-safe: quem não é explicitamente P1/P2 sai
da barra. Controle pode declarar `data-mh2-priority="1|2|3"` e vencer a tabela. Sem scroll-x.

### Empilhamento e scroll (decisão #75)
safe → header → ticker → main, tudo por token. `data-shell-ticker="on|off"` é medido do ticker
EFETIVAMENTE visível (oculto/vazio/desativado ⇒ 0px e a região some). Estado "rolado" do main
muda só densidade visual (sombra) — **altura nunca muda** (altura mudando = layout shift por
definição). `prefers-reduced-motion` desliga as transições.

### Avatar Studio — uma identidade (decisão #76)
Capacidade GENÉRICA do shell: o painel que traz a própria barra declara
`data-shell-titlebar="own"`; o shell marca o container como `owned` e, no modo compacto,
compacta VISUALMENTE o `.dsd-container__header` (sr-only; `role=heading aria-level=1` no título,
que segue na árvore de a11y). No modo wide a barra externa permanece (LED + toolbar de features)
e só o TEXTO do título vira sr-only — o baseline de produção mostra "Avatar Studio" duas vezes em
1440×900 (dup=1 medido). O header global não tem lógica exclusiva do AS.

### Z-index (decisão #77)
Só tokens existentes: o menu "Mais" usa `--z-header-dropdown` (101) DENTRO do contexto de
empilhamento da região do header (`--shell-z-header: 500` > ticker 400 > main 1), acima do
ticker/main e abaixo de toast/login/preloader. Nenhum overlay cortado (gate `POPOVERS_NOT_CLIPPED`).

### Idempotência e cleanup (decisão #78)
`activate()` é idempotente (script duplicado/HMR não duplica); todos os listeners passam por um
`AbortController` único e todos os observers por uma lista — `deactivate()` restaura DOM
(controles devolvidos à posição original, atributos a11y revertidos), meta viewport, CSS e
atributos do `<html>`. Gate `LISTENER_OR_OBSERVER_LEAKS`: 3 trocas de painel não alteram os
contadores; após `deactivate()` = 0; `activate()` ×2 volta ao mesmo número.

### Provas (decisão #79)
`scripts/header/audit-mobile-header.mjs` mede no SHELL REAL autenticado (preview do worktree
`scripts/header/preview-shell.mjs`: serve o candidato e faz proxy da API para o origin; ou
`MH2_BASE=https://dshowdash.com.br` para o baseline). `gates-mobile-header.mjs` consolida
métricas antes/depois e os gates (exit 1 se algum FAIL). Regras de honestidade:
- baseline de console/rede = produção OFF ∪ preview OFF (o que ocorre com a flag OFF é ruído do
  ambiente — ex.: `Error loading user permissions` intermitente, medido também com o módulo inativo);
- `FLAG_OFF_IDENTITY` ignora a ORDEM dos filhos de `.header-right` porque ela varia entre boots
  da própria produção (corrida entre `header-components.bundle` e os botões standalone; 5/18
  boots diferiram com o módulo INATIVO) — geometria, tokens, meta, atributos e o CONJUNTO de
  componentes/controles seguem exigidos idênticos;
- nunca rotular regressão como cosmética sem prova: qualquer gate FAIL bloqueia canário.

## Rodada 2 — polimento mobile + gaveta "Mais" (decisões #80–#87, módulo 1.1.0)
Tudo continua atrás da flag (OFF = byte a byte o clássico; nada muda fora de `activate()`).

### Gaveta "Mais" (decisão #80)
Deixa de ser dropdown flutuante: vira painel próprio abaixo do header — `role=dialog aria-modal`,
largura = viewport, `top = --shell-header-total-height`, `max-height = 100dvh − header` (viewport
dinâmico + `env(safe-area-inset-bottom)`, nunca px fixo), rolagem SÓ dentro dela (`overscroll-behavior:
contain`), scrim cobrindo o fundo, cabeçalho fixo com título e botão **Fechar** (44×44), foco preso
(Tab circula), Esc/scrim/fechar/ativar item fecham; foco volta ao botão "Mais". Superfície OPACA
(`--dsd-bg-primary`): nada atravessa (medido por `elementFromPoint` no fundo → só scrim/gaveta).

### Grupos, grade e cards (decisão #81)
Grupos discretos em ordem canônica: Aparência · Comunicação · Negócios · Google · Utilidades (+ Outros
fail-safe). Grade `repeat(3, minmax(0,1fr))`; ≤359px → 2 colunas; nunca 4. Itens dinâmicos
(cotações, clima, horário) são **cards** de linha inteira (rótulo à esquerda, valor vivo à direita), não
atalho de app. "Cotações" é item alinhado (o texto "— clique para abrir o painel" fica só no nome acessível).
Grupo sem item visível some (itens seguem a visibilidade do próprio controle, como antes).

### Rótulos (decisão #82)
Tabela de rótulos curtos (`ROTULOS`) + derivação do nome acessível sem prefixos ("Abrir", "Mudar para") e
sem legendas. CSS: até 2 linhas, `word-break: keep-all`, `hyphens: none`, `text-overflow: clip` (sem
reticências em ação principal). O rótulo do tema acompanha o estado ("Tema claro"/"Tema escuro").

### Identidade (decisão #83)
Chevron do perfil com stroke = `--hdr-text` (contraste medido 19,8:1 escuro / 19,1:1 claro; era 50%),
18px. Avatar 40px dentro do alvo de 44px, iniciais 14px. Nome em 1 linha, truncando só sem espaço (≤360px
some — P4). No tema claro o brilho roxo do avatar é contido (sombra 8px a 35% + anel branco; halos a
.45/.18). Ícone de trânsito: `title` espelha o `aria-label` (tooltip), sem mudar função.

### Ticker (decisão #84)
Movimento preservado; máscara de fade real (`mask-image`, 28px em cada borda — segue qualquer tema);
track com padding ≥ largura do fade → nunca abre com palavra cortada estática; altura = token (36px);
overlap com header/main = 0 (gate).

### Fluxo vertical real no dashboard compacto (decisão #85)
`html[data-mh2-flow="on"]` (compacto **e** sem painel `owned`): `#app-shell` vira `display:flex;
flex-direction:column; min-height:100dvh; padding-top: --shell-top-stack-height`; header e ticker seguem
FIXOS no topo (contrato); **main e rodapé entram no fluxo** (`position: static`), o documento rola, o
conteúdo ocupa o espaço e o rodapé vem depois dele (`.dsd-footer` estático + `env(safe-area-inset-bottom)`).
Barra inferior de navegação (nav-rail mobile) só ocupa espaço se tiver conteúdo visível
(`data-shell-navrail="on|off"`, medido). Proibições respeitadas: sem altura fixa por aparelho, sem margem
artificial, sem rodapé absoluto, sem compensação por viewport. O main recorta só no eixo x
(`overflow-x: clip` — não cria scroll container) e o rodapé mantém `overflow:hidden` (a barra de ações é mais
larga/alta que a linha residente, como na produção). Avatar Studio (container `owned`) mantém o layout de
regiões fixas aprovado — comportamento atual preservado.
Trava de rolagem com a gaveta aberta: fluxo → `body{position:fixed; top:-scrollY}` (posição preservada e
restaurada com `scrollTo` instantâneo); regiões → `main{overflow:hidden}` (mantém `scrollTop`); `touchmove`
fora da gaveta é cancelado (iOS). Uma única barra de rolagem: a da gaveta.

### Badges (decisão #86)
Regra global do header: contador ≤ 0 (ou não numérico) → `data-mh2-badge="zero"` → não renderiza; > 0 →
`"pos"`. Medido do TEXTO do badge (o componente segue dono do valor; o shell só decide render) para sino,
WhatsApp, e-mail, Instagram/Messenger, WeChat, Calendar e qualquer `[class*="badge"]` do header (barra e
gaveta). Google Calendar: com contagem, `data-mh2-dot="off"` esconde o ponto de estado (`::after`) — nunca
número e ponto juntos.

### Perfil e FAB de devtools (decisão #87)
`html[data-mh2-role]` espelha o gate de perfil já existente (`.user-menu-component[data-role]`, vindo de
`state.user.role`); o FAB `#cm-devtools` (ferramenta interna do container-main) fica oculto para quem não é
`admin` — sem tocar backend. Quando fica: `bottom = 44px + safe-bottom` (acima da linha do rodapé, medido
overlap 0), `role=button`/`tabindex`/`aria-label`/`title` ("Ferramentas de desenvolvimento", Enter/Espaço por
listener delegado), foco visível; com a gaveta aberta sai de cena (z-index rebaixado + `visibility:hidden`).

### Provas da rodada 2
`scripts/header/audit-r2-mobile-header.mjs` (shell real autenticado, preview do worktree): mede badges
visíveis ≤0, número+ponto no Calendar, colunas por viewport, rótulos truncados/linhas, alvos 44 e hit-test na
gaveta, geometria (largura/topo/fundo/opacidade/fechar), trava de rolagem (âncora visual do conteúdo antes ×
durante × depois), barras de rolagem fora da gaveta, safe area, chevron (contraste), avatar/nome, tooltip do
trânsito, ticker (overlap/máscara/animação), vão main→rodapé ao fim da página e rodapé no fundo, fluxo
(posições computadas), FAB (overlap/a11y/oculto com gaveta), temas, overflow-x, erros de página.

### Resultados da rodada 2 (2026-09-11, shell real autenticado, preview do worktree)
Matriz `audit-r2-mobile-header.mjs`: 375×812 · 390×844 · 320×568 · 430×932, escuro e claro, dashboard
(8 cenários) — **25/25 gates PASS** (`GATES-R2.txt`). Rota Avatar Studio (375/320, regiões fixas): vão
main→rodapé 0px, rodapé no fundo, gaveta 3/2 colunas, 0 truncados. Auditoria da rodada 1 com a flag ON
(375/320/844/768 × dashboard + Avatar Studio): 0 controles <44, 0 toques interceptados, 0 badge cortado,
0 duplicidade de título, layout shift 0, menu "Mais" 19 itens/0 pequenos/0 errados, Esc+foco OK, barra do
VC em y=92 (100 em landscape) sem somar inset. Leak/restauração: 13 listeners · 7 observers · 20 movidos
antes = depois de 3 trocas de painel; `deactivate()` → 0/0/0, sem `data-mh2-*`, meta e CSS restaurados;
`activate()`×2 → mesmos contadores. Flag OFF (375×812): rects, tokens, meta, atributos, conjunto de
controles e de filhos do `.header-right` idênticos à evidência OFF da rodada 1 (só o índice de trânsito,
dado vivo, difere).

| medida (375×812, dashboard, flag ON) | rodada 1 | rodada 2 |
|---|---|---|
| badges visíveis com valor 0 | 5 (sino, WhatsApp, e-mail, Instagram, WeChat) | 0 |
| Calendar com número + ponto | sim | não (ponto some com contagem) |
| menu "Mais" | dropdown flutuante, itens em flex-wrap (até 4 por linha) | gaveta abaixo do header, 5 grupos, grade 3 col (2 em 320) |
| rótulos cortados no menu | "Personalizar ordem dos compo" | 0 (≤ 2 linhas, sem quebra de palavra) |
| rolagem do fundo com menu aberto | livre (main rolava) | travada; posição preservada/restaurada |
| chevron do perfil | stroke 50%, 14px | `--hdr-text`, 18px (contraste 19,8:1 / 19,1:1) |
| avatar | 32px | 40px (alvo 44px) |
| vão entre conteúdo e rodapé (fim da página) | 107px (região do rodapé 76 + barra vazia 64 − linha 33) | 0px; rodapé no fluxo (dashboard) / no fundo medido (AS) |
| FAB de devtools | visível p/ todos, `div` sem nome, cobria a linha do rodapé | só admin; `role=button` + nome; overlap com rodapé 0; some com a gaveta |
| ticker | sem máscara nas bordas | fade de 28px; movimento e altura (36px) preservados |

## Arquivos
- `public/components/header/mobile-v2/{index.ts,index.js,mobile-header-v2.css}` (novo; 1.1.0 na rodada 2)
- `public/index.html` (1 `<script type="module">`)
- `public/components/panels/panel-avatar-studio/src/nucleo/flags.ts` (flag no contrato remoto `FLAGS_REMOTAS`, default OFF)
- `.../src/vc/VisualComposer.tsx`, `VisualComposer3D.tsx` (`data-shell-titlebar="own"` só com a flag ON), `.../styles/visual-composer.css`
- `scripts/header/{build-mobile-header-v2.sh,preview-shell.mjs,audit-mobile-header.mjs,gates-mobile-header.mjs,audit-r2-mobile-header.mjs,empacotar-entrega.sh}`
- `.gitignore` (`!/scripts/header/`)

## Preview (comando único)
```
node scripts/header/preview-shell.mjs --root /root/mh2/wt/public --port 8902
# navegador: http://127.0.0.1:8902/  (login normal; flag via override local
#   localStorage['dshow.avst.flags.v1'] = {"as6.mobile_header_v2":true}  ou canário u75)
```

## Rollout global (decisão #91 — 2026-09-12)
`as6.mobile_header_v2` foi ligada GLOBAL (`is_enabled=1`, `rollout_percentage=100`) em 2026-09-12 01:22,
antes do shell v2 (doc 24), pelo tooling `scripts/deploy/global-flag-rollout.php` (RUNBOOK, Anexo C):
schema + `UNIQUE` validados, backup fiel + `rollback.sql`, escrita mínima idempotente, read-after-write na
fonte + prova pelo `FeatureFlagResolver` com usuário-sonda sem override (u546 = `screenshot-bot`,
`rollout_excluded` → `global`), auto-rollback em falha. Smoke pós-flip na produção servida **sem override
local** (`scripts/deploy/smoke-flags-prod.mjs`, 10/10 PASS: health 200, resolve `source=global`,
`html[data-mobile-header-v2="on"]`, overflow-x 0, sem erro de página, sem erro novo de console vs baseline OFF).
Evidências: `/backup/rollout-global-u75-20260912-0113/` (`HANDOFF.md`, `flip-1-mobile-header-v2.txt`,
`smoke-1-header-on/SMOKE.txt`).

## Rollback
**Global (alavanca de flag, sem redeploy — classic volta em segundos):**
```bash
ROLLOUT_BK=/backup/global-rollback-$(date +%Y%m%d-%H%M%S) ROLLOUT_FLAG=as6.mobile_header_v2 ROLLOUT_PCT=0 \
  php /var/www/dshowdash/scripts/deploy/global-flag-rollout.php
```
(com o shell v2 também ON, reverter `as6.shell_layout_v2` **antes** — o shell compõe sobre o header;
confirmar com `smoke-flags-prod.mjs --expect header=off,shell=off`). SQL equivalente já gravado em
`/backup/rollout-global-u75-20260912-0113/flip-1-mobile-header-v2/rollback.sql`.
**Por usuário:** override do u75 — `rollback.sql` do canário. **Último recurso:** remover a linha do
`<script>` no `index.html`. Nenhuma outra superfície muda com a flag OFF.

## Resultados (2026-09-11, shell real autenticado, preview do worktree + baseline produção)
Matriz: 320×568 · 375×812 · 390×844 · 393×852 · 430×932 · 768×1024 · 844×390 · 932×430 · 1440×900,
rotas dashboard + Avatar Studio, escuro e claro (18 cenários por variante), + variantes safe-area 47px
(portrait e landscape), ticker oculto, reduced-motion, zoom 200%, nome longo, badge 1 e 3 dígitos, leak
(3 trocas de painel + deactivate/reactivate). **40/40 gates PASS** (`GATES.txt`).

| métrica (16 cenários compactos) | antes (prod, OFF) | depois (candidato, ON) |
|---|---|---|
| controles visíveis na barra | 240 | 64 (P1/P2; o resto no menu "Mais") |
| controles < 44px | 240 | 0 |
| toque interceptado (elementFromPoint ≠ alvo) | 152 | 0 |
| badge cortado | 30 | 0 |
| títulos visíveis duplicados | 8 | 0 |
| largura ocupada pela barra (máx) | 1072px | 924px (sem clipping: overflow vai p/ menu) |
| faixas no topo do AS (375) | 4 (header+ticker+título externo+barra) | 3 |
| barra do VC começa em y (375) | 124 | 92 |
| erros de console (todos os cenários) | 29 | 5 (todos com assinatura já presente no baseline) |
| overlap header/ticker/main · main escondido · overflow-x · layout shift no scroll | 0 | 0 |

Safe area simulada 47px: região do header = 103 (56+47) portrait / 107 (60+47) landscape, conteúdo começa
em y=47, barra do VC sem somar o inset (padding 8/10px). Ticker oculto: `main.y == header.bottom`.
Desktop 1440: regiões e geometria de controles idênticas com flag OFF (prod) e ON. Flag OFF no preview =
idêntico à produção em 18/18 cenários (rects, tokens, meta, atributos, conjunto de controles).
REGRESSION_GATE do Avatar Studio (`vc-mobile-audit.mjs`, harness do candidato): OVERFLOW_FAILURES=0,
touchBad=0, 9 viewports PASS, flag ON e OFF PASS.

Intermitências medidas (não são do candidato): (a) `Error loading user permissions` também ocorre com a
flag OFF; (b) o `traffic-indicator` re-renderiza o próprio DOM ao atualizar dados — em 1 hit-test de ~100
(844×390 + safe) o ponto central caiu durante a troca de nós (todos os demais cenários 5/5); (c) o badge
forçado a "128" pelo teste foi reescrito para "0" pelo componente em 1 de 6 cenários (o teste força texto;
o componente é dono do valor) — `pointer-events:none` e sem corte em todos.
