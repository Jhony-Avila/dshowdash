# Track D — Onda 2 (comportamento mobile do shell): relatório

Branch isolada `mobile/global-shell-wave-2` a partir de `origin/golden/art-wip@742c55e1`.
Tudo atrás da flag `as6.mobile_shell` (default OFF). **Não colado** (ver gates).

## Implementado e VALIDADO (determinístico, nesta sessão)

| Item | Entrega | Validação |
|---|---|---|
| 3 · setup-coordinator | Fix de causa-raiz do wiring: `setupOverlayClick`/`setupMobileDetect` recebiam shape errado (função crua / callbacks ignorados) → backdrop fechava sem o engine fechar. Corrigido em `setup-coordinator.ts` + `mobile-handler.ts` (aceita `onMobileChange`). **Commit isolado `D-m15`.** | `sidebar-wiring-proof.mjs` **VERDE** (contrato de origem: shapes batem; bug antigo comprovado) |
| 5 · registro | **Validador de contrato** determinístico (`nav-registry-contract.mjs`): IDs/rotas duplicados, nome acessível, item mobile sem destino, essencial na bottom-nav, divergências. | **VERDE** (0 erros; 2 avisos de reconciliação) |
| 1 · header "Mais" | Enhancer move ações secundárias p/ um sheet, preservando nós/badges/handlers; essenciais ficam; 44px; dentro da viewport; abre/fecha por botão/backdrop/Escape; foco. | `mobile-shell-behavior.mjs` (jsdom) **VERDE** |
| 2 · drawer a11y | Escape, focus-trap, `aria-modal`, inert nas regiões de fundo, scroll-lock, retorno de foco, fecha por backdrop/rota/orientação, idempotência, **20 ciclos sem vazamento**. | `mobile-shell-behavior.mjs` (jsdom) **VERDE** (25 asserts) |
| 4 · ticker | Controles anterior/pausar/próximo, `data-ticker-paused`, `aria-pressed`, reduced-motion, nomes acessíveis, pausa ao focar. | `mobile-shell-behavior.mjs` (jsdom) **VERDE** |
| — · desktop | Todo o CSS novo (30 seletores) **100% sob `#app-shell[data-mobile]`**; enhancer só liga com o marcador (flag ON). | `global-mobile-static.mjs` **VERDE** (0 fora do marcador) |

> **Honestidade:** itens 1/2/4 foram validados por **comportamento real em jsdom** (DOM,
> eventos, foco, teardown), não só inspeção estática. O que jsdom não cobre (layout
> pixel, gestos touch) fica para o runtime autenticado.

## NÃO validável neste sandbox (arquitetural — sessão do Jhony)

- **Item 5 — unificação real de fonte única:** os dois registros usam **backends
  distintos** (`/api/ui/navigation.php` × `/api/ui/navrail/`) e **modelos de permissão
  distintos** (UARPS × nível). Fonte única real exige reconciliar os dois backends —
  fora do escopo/segurança deste sandbox. Entregue: o **validador de contrato** (acima)
  + a spec de reconciliação (avisos do validador: 4 IDs comuns, esquema admin divergente).
- **Item 6 — navegação autenticada por rota; Item 7 — viewports ao vivo; Item 8 —
  Avatar Studio no shell real; Item 12 — boards:** exigem sessão autenticada + backend.
  Entregue: `global-mobile-authenticated.mjs` (runner com override de flag por navegador,
  classificação de rota, captura de boards) para a sua sessão.

## Gates
```
GLOBAL_MOBILE_STATIC=PASS (30 seletores, 0 fora do marcador)
NAV_REGISTRY_CONTRACT=PASS (0 erros)
SIDEBAR_WIRING_PROOF=PASS
MOBILE_SHELL_BEHAVIOR=PASS (25 asserts jsdom)
AUTHENTICATED_ROUTE_MATRIX=PENDING (runner entregue; sessão do Jhony)
VIEWPORT_MATRIX_RUNTIME=PENDING (idem)
DESKTOP_REGRESSION_RUNTIME=PENDING no shell autenticado (garantia estática: 0 seletor fora do marcador)
```
Como os gates autenticados **não podem ficar verdes aqui**, e conforme a regra do item 11
("se algum gate permanecer vermelho, não cole parcialmente — entregue a branch, os
commits e o diagnóstico"), a onda 2 **NÃO é colada** automaticamente. Entrega: branch +
commits `D-m13..D-m18` + `05-colar-wave-2.sh` preparado (dry-run TREE_IDENTICAL) para
aplicar **após** a validação autenticada, + runners + este diagnóstico.

## Fix do setup-coordinator — nota de risco (item 3)
Toca o caminho mobile compartilhado da sidebar (faixa 501–768) mesmo com `as6.mobile_shell`
OFF (é gated pelo breakpoint 768 próprio da sidebar, não pela flag nova). Por isso está em
**commit isolado (`D-m15`)** e **exige regressão desktop completa no shell autenticado**
antes de colar. A correção é comprovadamente necessária (o bug de shape é demonstrável) e
mínima (só o shape passado + o handler passar a chamar `onMobileChange`).

## Invioláveis honrados
`MERGE_MAIN=NO · PUSH_MAIN=NO · DEPLOY=NO · ROLLOUT=NO · REAL_FLAG_FLIP=NO ·
FLAG_DEFAULT_CHANGE=NO · TRACK_A_REOPEN=NO · DESKTOP_SAVE_CHANGE=NO · FULL_SUITE=NO ·
GOLDENS_RECORDED=NO · FORCE_PUSH=NO · DESTRUCTIVE_RESET=NO · UA_SNIFFING=NO ·
HAND_EDIT_BUNDLES=NO` (só editei `.ts`/`.css`-fonte).
