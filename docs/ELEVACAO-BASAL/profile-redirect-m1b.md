# `/profile` → Avatar Studio — M1b, shim aditivo atrás de `as6.profile_redirect` (decisões #89/#90)

**Módulo:** `public/components/router/profile-redirect/index.ts` (fonte) → `index.js` (build 1:1 por
`scripts/shell/build-profile-redirect.sh`, esbuild `--format=esm --target=es2020`; nunca editar o .js à mão).
**index.html:** 1 linha aditiva antes de `initial-route.js`. **Rollback:** flag global OFF pelo `global-flag-rollout.php` (RUNBOOK Anexo C, sem redeploy); por usuário, override; último recurso, remover a linha.
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

## Canário e rollout global (executados em 2026-09-12)
1. **Merge/deploy (13:28–13:29):** cherry-pick limpo do M1b sobre `main` (901838fb) + prova versionada
   (`scripts/shell/prova-profile-redirect.mjs`, 4666885e) → push FF → webhook → `deploy-as5.sh` **DEPLOY_AS5_OK**
   1df44eac→4666885e; health 200; shim servido; flag ausente ⇒ produção OFF para todos.
2. **Canário u75 (13:29:55):** `canary-user-flags.php` → `CANARY_STATUS=OK · GLOBAL=OFF USER_75=ON ·
   OTHER_USERS_UNCHANGED=YES`; backup `/backup/canary-seed-20260912-132955/rollback.sql`. Prova pós-deploy na
   produção verde (`/backup/profile-redirect/pos-deploy-20260912-133003`): OFF ≡ baseline (302 nós), ON boot
   frio 574 ms sem flash/loop, pós-boot e variantes ok, `perr []`.
3. **Validação visual do Jhony como u75** em `#/profile` (boot frio e navegação) — aprovada.
4. **Rollout global (13:33:58):** `scripts/deploy/global-flag-rollout.php` (RUNBOOK Anexo C) —
   `is_enabled/rollout_percentage` 1/0 → **1/100**, sonda u546 `rollout_excluded` → `global`, nenhuma outra flag
   tocada, backup `/backup/rollout-global-profile-redirect-20260912-1333/flip-profile-redirect/rollback.sql`.
   Smoke pós-flip na produção (mesma prova): sem override local a decisão do servidor redireciona
   (`resolved=true source=remote`, sem flash); override local `false` ainda mostra preferências (kill switch por
   usuário); ON/anti-loop/variantes/rotas vizinhas ok; `perr []` nos 5 cenários. Nota: com o global ON o gate
   `offExplicitIgual=false` é o esperado (off-explicit ≠ baseline que já redireciona) — não é falha.
   Handoff: `/backup/rollout-global-profile-redirect-20260912-1333/HANDOFF.md`.

## Rollback
**Global (sem redeploy, classic volta em segundos):**
```
ROLLOUT_BK=/backup/global-rollback-$(date +%Y%m%d-%H%M%S) ROLLOUT_FLAG=as6.profile_redirect ROLLOUT_PCT=0 \
  php /var/www/dshowdash/scripts/deploy/global-flag-rollout.php
```
(o u75 segue com o override ON; confirmar com `PREVIEW_BASE=https://dshowdash.com.br node
scripts/shell/prova-profile-redirect.mjs <dir>` → `off-preview` com `pref=true`). **Canário:** `rollback.sql` do
canary-seed (a flag volta a "ausente"). **Último recurso:** remover a linha do `<script>` no `index.html`.
Estado da leva as6 em 2026-09-12: header v2 (doc 23), shell v2 (doc 24) e profile_redirect em 100% para todos.
