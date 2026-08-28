# Track C Mobile — Relatório Final de Certificação

**Rodada única de certificação + handoff.** Executada de forma autônoma sobre o
candidato real, preservando o desktop aprovado.

## Estado

| Campo | Valor |
|---|---|
| CERTIFICATION_STATUS | **PASS_WITH_PENDING_REAL_DEVICE** |
| BASE_SHA (candidato remoto auditado) | `31caaf8e` (tree `e456549f`) |
| FINAL_LOCAL_SHA (candidato + testes de cert) | `24094365` (tree `11e87429`) |
| MOBILE_FLAG_DEFAULT | `as6.mobile_studio = OFF` |
| Ancestralidade | `ba4bf4d3` (Track A frozen) → `aef56416` (hardening) → `31caaf8e` |
| main | `bf655221` INTOCADA |
| Deploy / Rollout / Push / Merge / --gravar | NÃO (nenhum) |
| Suíte completa | NÃO rodada (só o subconjunto definido) |

## Resultado por eixo

| Eixo | Status | Evidência |
|---|---|---|
| Auditoria de diff | ✅ limpo | zero UA-sniffing, zero `!important` real, listeners pareados, motor/persistência/arte intocados |
| Build & harness | ✅ | build OK (só aviso genérico de chunk-size), 96 regras `data-mobile` no bundle |
| Matriz de viewports | ✅ 14/14 + varredura 300→1600 sem quebra | `mobile-viewport-matrix` |
| E2E funcional | ✅ | `mobile-*` + `v43-*` (entry→edit→tools→save) |
| Ferramentas incorporadas | ✅ | `mobile-tools-overlays` (sheet/dialog/scroll/fechar) |
| Touch & acessibilidade | ✅ | alvos ≥44, aria-current/modal, zoom livre, reduced-motion |
| Teclado & safe-area | ✅ | `mobile-keyboard-viewport`, `mobile-safe-area` |
| Orientação & resize | ✅ | `mobile-orientation-change`, `mobile-landscape`, churn sem leak |
| Performance | ✅ | shell ~600ms, cat 98ms, ferramenta 131ms, memória estável, 0 erro JS |
| Rede & save | ✅ (com nota P2) | POST `estado.php`/`studio.php`; mobile ≡ desktop |
| Regressão desktop | ✅ ZERO | `desktop-responsive-regression` + `v43-*` (flag OFF/ON não vaza) |

## Testes (22/22 verdes)

18 mobile+cert (`mobile-shell-layout`, `-touch-navigation`, `-category-flow`,
`-asset-selection`, `-color-controls`, `-tools-overlays`, `-save-flow`,
`-legacy-compat`, `-keyboard-viewport`, `-safe-area`, `-orientation-change`,
`-landscape`, `-small-screen-320`, `-tablet-layout`, `-accessibility-smoke`,
`-performance-smoke`, `-viewport-matrix`, `desktop-responsive-regression`) +
4 regressões V4.3 (`v43-single2d-parity`, `-flow`, `-legacy-compat`,
`-category-focus`). Detalhe em `MOBILE_E2E_RESULTS.md`.

## Correções desta rodada

1. `mobile-viewport-matrix`: métrica de "fora da tela" refinada (contava
   elementos em contêiner de scroll horizontal e `hidden` — falso-positivo).
   **Correção de teste, produto intocado.** Reexecutado: 14/14 verde.

Nenhuma correção de produto foi necessária — a superfície Track C passou na
auditoria sem defeito objetivo.

## Pendência única

`REAL_DEVICE_VALIDATION = PENDING` — validação em iPhone/Android físico
(leitor de tela, teclado virtual real, notch, sessão autenticada) é humana e
não é substituível por Chromium headless. Kit pronto em
`MOBILE_REAL_DEVICE_TEST_KIT.md`.

## Recomendação

Promover o candidato à validação humana em device real com a flag **OFF**;
após aprovação visual, decidir merge→main + flip da flag. Rollback = desligar a
flag (`MOBILE_ACTIVATION_AND_ROLLBACK.md`).
