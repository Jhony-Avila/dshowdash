# Track D — Relatório Final (onda 1: fundação + CSS validado)

## Resumo
Primeira onda do endurecimento mobile do **shell global**, aditiva e atrás da
flag `as6.mobile_shell` (default OFF). Entregue no candidato, **sem** push/merge/
deploy/rollout/flip a partir deste ambiente. Desktop **byte a byte** (provado).
Track A/C **não reabertos**.

## Feito e validado nesta sessão
- **Auditoria de causa-raiz** com evidência file:line (GLOBAL_MOBILE_AUDIT):
  confirmou header clip + poda morta, sidebar `display:none` <500 (2×) + drawer
  desalinhado + wiring quebrado + sem Escape/foco, footer fixo sobreposto +
  alvos <44, ticker ignora reduced-motion, 3 sistemas de token divergentes, zero
  media query de altura, registros de nav fragmentados. Refutou (honesto):
  sidebar 0×0 e bottom-nav vazia.
- **Política responsiva CENTRALIZADA** (`app-shell/styles/global-mobile.css`):
  tokens de offset unificados + correções CSS de header/sidebar/bottom-nav/ticker/
  footer, 100% sob `#app-shell[data-mobile]`. **Prova estática VERDE** (24/24
  seletores sob o marcador ⇒ desktop byte a byte; 7 correções presentes).
- **Marcador central** (`responsive-adapter/mobile-marker.ts`): largura+altura,
  sem UA-sniff, paisagem baixa = mobile; flag default OFF ⇒ inerte. **Unit VERDE.**
- Wiring aditivo e guardado no `responsive-adapter` + 1 `<link>` no `index.html`.
- Commits temáticos: **D-m1** (policy), **D-m2** (marker), **D-m3** (audit+tests).

## Pendente — próxima onda (documentado, não aplicado; risco/validação)
Mudanças **de JS/DOM compartilhado** do shell, que exigem validação autenticada
ao vivo (não aplicadas às cegas):
- **Header**: menu "Mais"/overflow real (hoje o CSS contém as ações num scroller
  para não estourar o documento).
- **Sidebar/drawer**: Escape, focus-trap, `aria-expanded/controls`, retorno de
  foco, `inert`; corrigir `setup-coordinator.ts:137,143`; integrar à governança
  central do `overlay-layer`.
- **Ticker**: controles pausar/anterior/próximo + trocar `role="marquee"`.
- **Bottom-nav/registro**: unificar o registro sidebar × nav-rail; `toggle-sidebar`
  → "Menu" abrindo o drawer.

## Pendente — do Jhony (arquitetural, sessão autenticada)
- `global-mobile-css.mjs` (harness isolado) em ambiente saudável (Chromium
  headless instável neste sandbox nesta sessão).
- Navegação mobile por módulo (14 rotas) + matriz de 16 viewports no shell real,
  com o override de flag por navegador.
- Validação visual / leitor de tela / device real.
- Decisão de merge→main / rollout / flip da flag.

## Invioláveis honrados
`MAIN_TOUCHED=NO · MERGE_MAIN=NO · PUSH_MAIN=NO · DEPLOY=NO · ROLLOUT=NO ·
REAL_FLAG_FLIP=NO · TRACK_A_REOPEN=NO · DESKTOP_SAVE_HANDLER_CHANGE=NO ·
FULL_SUITE=NO · GOLDENS_RECORDED=NO · FORCE_PUSH=NO · DESTRUCTIVE_RESET=NO ·
UA_SNIFFING=NO · HAND_EDIT_BUNDLES=NO` (só editei `.ts`/`.css`-fonte).
