# Track D — Onda 3.1 (pacote operacional autenticado + correções de portabilidade)

Branch `mobile/global-shell-wave-3b` a partir de `origin/golden/art-wip@00475b5c` (tree `937b3874`).
`main bf655221` intocada. Flag `as6.mobile_shell` default OFF.

## Motivação
No colar da onda 3 no servidor, `coordinator-flag-off-diff.mjs` **falhou** com
`ERR_MODULE_NOT_FOUND` (jsdom num caminho fixo do sandbox). E o comando autenticado
anterior apontava para `https://dshowdash.com.br` — que serve **main@bf655221**, não o
candidato. Esta onda corrige as duas fragilidades e entrega o executor operacional.

## Entregas

| # | Item | Estado |
|---|---|---|
| D-m28 | **Portabilidade dos testes** — jsdom via resolver `_jsdom.mjs` (env/node_modules/fallback) + caminhos de módulo relativos (`import.meta.url`). Corrige o ENOENT/ERR_MODULE no servidor. | VERDE (os 3 rodam em qualquer checkout) |
| D-m29 | **Identidade do código servido** — o runner exige `SERVED_CODE_IDENTITY=CONFIRMED`: busca `global-mobile.css` (arquivo SÓ-do-candidato) e confere o `sha256` esperado; **fail-closed** (404/mismatch = aborta). Impede validar produção antiga. | Guard implementado (`EXPECTED_MARKER_SHA256=beea1444…`) |
| D-m30 | **Login-capture** — etapa manual ÚNICA (Playwright headed): detecta sessão (sem form + shell), salva storage-state `600`, segue sozinho; segredos nunca ao log. | Entregue |
| D-m31 | **Mutação da flag** — prova OFF-by-default em TODAS as camadas + ON só com override + fail-closed. 11 asserts. | VERDE |
| 07 | **`07-trackd-wave3-server-gate.sh`** — executor ÚNICO server-side: SHAs+flags OFF → `git archive` do candidato (preview temp, NÃO toca produção) → builds canônicos no preview → provas determinísticas → preview `127.0.0.1` + **proxy `/api`** p/ backend real (sem logar segredos) → prova de identidade → auth segura (AUDIT_STORAGE_STATE → storage existente → login manual único) → matriz autenticada (flag OFF→ON) → boards/relatórios → **cleanup por trap** (remove storage-state e temporários) → auditoria de side-effects → pacote sem segredos. | Entregue (bash/-proxy/-login sintaxe VERDE) |

## Como rodar (uma operação, na sua máquina/servidor)
```
PW_CHROME="$(command -v chromium)" BACKEND_URL="https://dshowdash.com.br" \
[AUDIT_STORAGE_STATE=/caminho/seguro/auth.json]  bash 07-trackd-wave3-server-gate.sh
```
Se não houver storage-state, o gate imprime a etapa manual única de login (`_login-capture.mjs`)
e continua sozinho após a captura. O storage-state é `600`, temporário e removido no cleanup;
**nunca** entra no Git nem no pacote. O runner **aborta** se a identidade do código servido
não bater o candidato.

## Gates determinísticos (todos VERDES no candidato)
`global-mobile-static` (30/0-fora) · `nav-registry-contract` (0/0) · `sidebar-wiring-proof` ·
`coordinator-flag-off-diff` (FLAG_OFF==A) · `mobile-shell-behavior` (25) ·
`mobile-shell-a11y-stability` (17) · `mobile-flag-mutation` (11).

## O único passo humano
Login (quando não há storage-state seguro). Todo o resto — build, preview, proxy, identidade,
matriz, boards, classificação, cleanup, pacote — é automatizado pelo `07`.

## Invioláveis
`MERGE_MAIN=NO · DEPLOY=NO · ROLLOUT=NO · REAL_FLAG_FLIP=NO · TRACK_A_REOPEN=NO ·
DESKTOP_SAVE_CHANGE=NO · HAND_EDIT_BUNDLES=NO · PRODUCTION_DIRECTORY_MUTATION=NO ·
FABRICATED_AUTH_RESULTS=NO · SECRETS_IN_EVIDENCE=NO`.
