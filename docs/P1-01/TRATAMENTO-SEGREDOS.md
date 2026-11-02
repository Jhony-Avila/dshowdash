# P1-01 — tratamento proposto dos arquivos retidos por segredo (sem valores)

Nenhum destes arquivos está no Git. Nenhum valor foi lido para este documento. A decisão é do Jhony, com o revisor.

| Arquivo | Motivo | Tratamento proposto |
|---|---|---|
| `api/auth/services/AuthService.php` | padrão senha literal ×1 | revisar a linha: literal → injeção externa; nome de campo → liberar |
| `public/bootstrap-v2/phases/phase-2-auth.ts` | senha literal ×1 | idem |
| `public/core/runtime/events/catalog/system.events.ts` | senha literal ×1 | provável nome de campo → liberar |
| `public/modules/global-state/api/contracts.ts` | senha literal ×1 | idem |
| `public/platform/pages/login-mfe/events/contracts.ts` | senha literal ×1 | idem |
| `scripts/rebuild-all.sh`, `tools/db/nav_dryrun.sh`, `tools/validate_P14_nav_governance.sh` | senha em linha de comando | injeção externa (`--defaults-extra-file` 0600) |
| `scripts/datatables-smoke-all.php`, `tests/api-navigation-test.php` | senha literal | injeção externa (env) |
| `tools/screenshot/valida-bling-fase4.mjs`, `tools/screenshot/valida-dt-admin.mjs` | token | injeção externa |
| `docs/BLING/02-banco-BLING.sql`, `docs/SEGURANCA/dshowdash_app-privilegio-minimo.sql`, `docs/dba/create-readonly-dshow-prod.sql`, `docs/OUTLOOK/FASE-0.md`, `docs/dba/HANDOFF-DBA-2026-07-17.md` | `IDENTIFIED BY` | sanitizar (marcador `<SENHA>`) |
| **gerados dos `.ts` acima** (Etapa 3): `phase-2-auth.js`, `system.events.js`, `global-state/api/contracts.js`, `login-mfe/events/contracts.js` | a transpilação preserva as strings | seguem o `.ts`: liberado o `.ts`, a receita os gera |
| **bundles que os embutem** (Etapa 3): `bootstrap-v2/dist/bootstrap.bundle.js`, `components/login-modal/dist/login-modal.bundle.js`, `core/runtime/dist/runtime.bundle.js`, `modules/global-state/dist/global-state.bundle.js` | senha literal ×1–2 (o mesmo literal) | seguem os `.ts`; o bootstrap-v2 tem receita (VITE_BOOTSTRAP_ROOT) |
| 17 por caminho (`config/*`, `.env*`, chaves, `tools/screenshot/.env`, `.claude/settings.local.json`) | caminho sensível, nunca aberto | `.example` + injeção externa (pasta compartilhada da release) |
