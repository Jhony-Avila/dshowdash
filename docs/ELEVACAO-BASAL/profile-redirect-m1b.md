# `/profile` → Avatar Studio — M1b, shim aditivo atrás de `as6.profile_redirect` (decisões #89/#90)

**Módulo:** `public/components/router/profile-redirect/index.ts` (fonte) → `index.js` (build 1:1 por
`scripts/shell/build-profile-redirect.sh`, esbuild `--format=esm --target=es2020`; nunca editar o .js à mão).
**index.html:** 1 linha aditiva antes de `initial-route.js`. **Rollback:** remover a linha (ou flag OFF).
Versionado em `public/components/router/` porque `public/app/router/` (onde vive o `initial-route.js`) é ignorado
pelo git (`.gitignore:42`).

## Comportamento
- **Flag OFF / erro / timeout / flag ausente (fail-closed):** no-op absoluto. Registra apenas um listener inerte e
  faz 1 `GET /api/feature-flags?action=resolve&flag=as6.profile_redirect` (credentials include, 1,5 s). Nenhum atributo,
  nenhuma navegação. Prova: `#/profile` no preview com o shim (flag ausente no banco → API responde `enabled` falso;
  e override local `false`) tem assinatura DOM do `#main` (302 nós) e lista de scripts (exceto o shim) **idênticas**
  à produção sem o shim; `initial-route` honra `#/profile` como hoje.
- **Flag ON — boot frio em `#/profile`:** ao resolver ON, `history.replaceState` troca o hash por
  `#/panel-avatar-studio` sem evento; o `initial-route.js` deixa de honrar a rota inicial (o hash já não é o que ele leu);
  o shim espera roteador + shell no home (mesmo critério do initial-route) e `RouterGlobal.navigate('/panel-avatar-studio')`.
  Prova: Avatar Studio montado em 551 ms, preferências **nunca** montadas (vigia a 50 ms), `data-initial-route-honrada`
  ausente, `data-profile-redirect="/panel-avatar-studio"`, 1 redirect, hash estável por 3 s (sem loop).
- **Flag ON — pós-boot (`#/profile`, `#/profile/`, `#/profile?x=1`), a partir do home e das preferências:** listener
  de `hashchange` em captura interrompe o evento (`stopImmediatePropagation`) e `location.replace('#/panel-avatar-studio')`
  → o shell monta o Avatar Studio pelo caminho normal de mudança de rota. Prova: Avatar em 153–376 ms, preferências nunca
  aparecem, sem entrada extra de histórico (replace). `#/meu-perfil`, `#/preferencias` e `#/profile-x` inalterados.
- Alvo `panel-avatar-studio` resolve por convenção `^panel-[a-z-]+$` (não depende do registry inlinado no bundle).

## Por que a primeira versão do pós-boot foi trocada
A tentativa inicial chamava `RouterGlobal.navigate()` depois de já ter reescrito o hash; nesse estado o shell não
remontava o painel (comportamento pré-existente do main-engine em navegações pós-boot entre painéis). Trocar o hash
com `location.replace` gera um `hashchange` real, que é o caminho que o shell trata de forma confiável.

## Canário (preparado, NÃO executado nesta rodada)
```
CANARY_BK=/backup/canary-seed-$(date +%Y%m%d-%H%M%S) CANARY_USER=75 CANARY_FLAGS=as6.profile_redirect \
  php scripts/deploy/canary-user-flags.php
```
Esperado: `CANARY_STATUS=OK · as6.profile_redirect=GLOBAL=OFF USER_75=ON · OTHER_USERS_UNCHANGED=YES` + `rollback.sql`.
Depois: deploy pelo fluxo oficial (push em main → webhook → `deploy-as5.sh`), validação visual como u75 em `#/profile`
(boot frio e navegação).
