# Contexto Geral — Avatar Studio 5 (bootstrap para sessões de IA)

> Pasta `claude/`: contexto versionado NO REPO para qualquer sessão futura se
> auto-abastecer só de clonar. Espelha os docs do projeto Claude "Avatar
> Studio"; em divergência, os docs do projeto (mais frescos) prevalecem.
> Atualizada por lote — última: **lote 221–230** (2026-08-05).

## O que é

O Avatar Studio é o módulo de avatares do **DShowDash** (dashboard enterprise
em dshowdash.com.br). Implementa o mega briefing proprietário
`docs/BRF_AVATAR_STUDIO.md` (commit `006a394b`, 39.383 linhas, 1.764 seções §
— fora da working tree: `git show 006a394b:docs/BRF_AVATAR_STUDIO.md`) em
ondas de "mega lotes" de ~10 tarefas, com commits temáticos citando as §§.

## Onde vive o código (branch `main`)

- Painel: `public/components/panels/panel-avatar-studio/` (TS; build vite DENTRO da pasta).
- Núcleo: `src/nucleo/` e `.../src/nucleo/` (contratos, store, `flags.ts` fail-safe).
- API PHP: `api/avatar/studio.php` (validação ESPELHADA de todo campo novo).
- Testes: `scripts/avatar/testes/` (`rodar-todos.mjs`; ~15 min; VERDE antes de entregar).
- Deploy: `scripts/deploy/` (deploy-as5.sh blindado, pesos-esperados.json, RUNBOOK-BANCO.md) + `api/deploy/webhook.php`.
- Docs: `docs/AVATAR-STUDIO-5/` (runbook, baselines, fases F0–F9, pipeline 3D).

## Regras invioláveis (nunca relaxar)

1. **Byte-stability**: campo novo neutro = OMITIDO na serialização; avatar/foto
   salvos NUNCA mudam de render por causa de código novo.
2. Nunca editar arte em `partes/*` — somente wrappers.
3. Toda feature nova atrás de flag desligável (§651), padrão `as5.*` em
   `nucleo/flags.ts`; rollback por feature = desligar a flag.
4. Validação PHP espelhada para todo campo novo (`api/avatar/studio.php`).
5. Commits temáticos por lote citando as §§ do briefing.
6. TypeScript é a fonte de verdade — nunca editar `.js` irmão à mão.
7. `/backup` na raiz do SERVIDOR é o único local oficial de backup.
8. Segredos NUNCA por chat/git/log; chave IA via Anexo B do RUNBOOK-BANCO.
9. O repo é PRIVADO e assim permanece.
10. Deploy sempre pelo script (`scripts/deploy/deploy-as5.sh`), nunca à mão.

## Infra de testes (caminhos importam)

```
cd public/components/panels/panel-avatar-studio && npx vite build   # cwd importa
node scripts/avatar/gerar-harness.mjs            # da RAIZ (avatar + dashboard)
(cd public && python3 -m http.server 8901 &)     # servidor estático
PW_CHROME=<chromium> node scripts/avatar/testes/rodar-todos.mjs     # suíte completa
```

O harness da HOME (`ger-harness.html`) exige build do `panel-dashboard`
(`npm i && npx vite build` lá) — sem ele, home-pessoal/home-compacto dão
timeout (ambiental, não regressão).

## Infra e deploy

- Servidor: srv920234.hstgr.cloud / 72.60.8.101, app em `/var/www/dshowdash`.
- Topologia (decisão #46): o servidor NÃO roda `main` — vive em
  `feat/pipedrive-modulo-completo`; deploy = MERGE de origin/main nela.
- Auto-deploy (decisão #47): push no `main` → webhook HMAC → runner root
  1/min → `deploy-as5.sh` (backup duplo em /backup, gate de peso, smoke,
  rollback impresso). Interruptor: `touch config/auto-deploy.off`.
- Sessões SEM o repo conectado na criação: clone ok, push 403 → rota
  patch/bloco SSH (ver `claude/status-do-projeto.md`).

## Estado por área (pós lote 221–230)

Shell novo ON (§650) · Creator 2D completo · Palco 3D (6 CC0, LODs, showcase
§174 + EDITOR §175, qualidade adaptativa §528) · Photo Studio (templates,
galeria §326, CANVAS PRO §323–324, título-componente §344, emblemas §345) ·
Palco de apresentação (clima §163, presets §180, contexto §181) · Persistência
(espelho §619, autosave, versões) · Progressão (XP §634, missões §250,
evolução §241–246, TIMELINE §220, favoritos §229 em 3 categorias) · Vitrine
pessoal §1076 + galerias §1077 (recorte P14 client-side) · Consultor §232–240
(regras) · IA §636 (aguarda chave).
