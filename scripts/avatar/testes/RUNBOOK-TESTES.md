# RUNBOOK — suíte de testes do Avatar Studio (reprodutibilidade §12)

> onda 1426 (#218, veredito 23/08). Objetivo: um **procedimento único** para
> rodar `node scripts/avatar/testes/rodar-todos.mjs` sem caçar manualmente
> Playwright, Sharp, Chromium ou @gltf-transform. O runner faz **preflight**
> e aborta com instrução clara se algo faltar.

## Procedimento único (da raiz do repo)

```bash
# 1. dependências (instala playwright-core, sharp, @gltf-transform/core, vite/esbuild)
npm ci

# 2. Chromium para o headless (uma vez). Duas opções:
npx playwright install chromium            # baixa p/ o cache do playwright, OU
export PW_CHROME=/caminho/para/chrome       # aponta um Chromium já instalado

# 3. build dos painéis + harness + servidor estático
( cd public/components/panels/panel-avatar-studio && npx vite build )
( cd public/components/panels/panel-dashboard    && npx vite build )   # se existir
node scripts/avatar/gerar-harness.mjs
( cd public && python3 -m http.server 8901 >/tmp/avst-http.log 2>&1 & )

# 4. rodar a suíte completa (~50 min; roda em background e faz poll do log)
node scripts/avatar/testes/rodar-todos.mjs
```

## Como o ambiente é resolvido (sem caminhos fixos)

- **Chromium**: `navegador.mjs → acharChromium()` procura, nesta ordem:
  `PW_CHROME` (se existir) → `PLAYWRIGHT_BROWSERS_PATH`/`/opt/pw-browsers/chromium-*`
  (varre `chrome-linux`, `chrome-linux64`) → o bundle do `playwright-core`.
  Não há mais caminho fixo `chromium-1194` — ele varia por máquina.
- **esbuild**: usado pelos testes node-puro via `panel-avatar-studio/node_modules/.bin/esbuild`
  (vem transitivo do `vite`) com fallback para a raiz.
- **sharp / @gltf-transform/core**: dependências da raiz (`npm ci` resolve).
  Se o `node_modules` estiver incompleto (ex.: `@gltf-transform/core` ausente,
  que quebra `materiais3d.mjs`/`palco3d-v2.mjs`), o **preflight** falha ANTES
  de rodar, apontando `npm ci`.

## Preflight

`rodar-todos.mjs` chama `preflight()` no início: confere `playwright-core`,
`sharp`, `@gltf-transform/core` e um Chromium. Falha → sai com código 2 e
imprime este procedimento. Sucesso → imprime `preflight OK · chromium: <path>`.

## Node-puro em execução no lugar (não copiar p/ a raiz)

Scripts que importam `sharp` via `resolve(import.meta.dirname,'..','..','..')`
(before-after, contact-sheet) devem rodar **no lugar** (`node scripts/avatar/...`),
nunca copiados para a raiz — copiar quebra a resolução de caminho do sharp.
