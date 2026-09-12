# Recon forense — origem de build de `components/main`/router e plano `/profile` → avatares (decisão #89)

Rodada 100% leitura (2026-09-12). Evidências: `/backup/recon-components-main/20260912-0013/`
(bundles de cada tentativa, diffs, logs). Nada publicado, nenhum artefato vivo tocado, 0 escrita no banco.

## Q1 — Origem do bundle vivo
- **`components/main/dist/main.bundle.js`** (954.342 B, 2026-07-30 15:49, sha `2777df85…`): gerado por
  `scripts/rebuild-all.sh` **do servidor (não versionado)**, target `component:main`, comando
  `COMPONENT=main $PUBLIC/react/node_modules/.bin/vite build --config public/components/vite.components.config.js`
  (`rebuild-all.sh:20-23,129,413`; config versionada: entry `components/main/_entry.ts`, `keepInternal`
  `/components/router/registry/` e `/state/`). Toolchain = **Vite 5.4.21** de `public/react/node_modules`.
- **`app/router/dist/app-router.bundle.js`** (107.275 B, 2026-04-30, sha `c53d8af0…`): target `lote3bc:app-router`
  com `public/vite.lote3bc.config.js` — **config ausente no servidor** (`rebuild-all.sh:22,99`; `find` sem resultado)
  → hoje **não reproduzível**. Inlina a própria cópia do registry (sem import externo de `registry/routes`).
- Ambos `dist/` são **gitignored** (`.gitignore:132` e `:42`); não há `git log` deles. `.build-meta/` só tem 2 metas.
- Transpile TS→JS individual (fase 6 do rebuild-all, `:502-532`): `esbuild <f>.ts --outfile=<f>.js --format=esm
  --target=es2022` com **esbuild 0.21.5** (`public/react/node_modules`).

## Q2 — Reprodutibilidade (sha16 de cada tentativa; vivo = `2777df85e929d049`)
| fontes | Vite | sha | tamanho | resultado |
|---|---|---|---|---|
| HEAD (e4b05066 = main; cleanup afc3d1b5 tem as mesmas fontes de main/router) | 7.3.6 (raiz) | 545b1533dae28742 | 903.411 | difere |
| bae4ade1 (2026-07-29, último toque em main/router antes do bundle) | 7.3.6 | 587e2ea6600cea44 | 903.105 | difere |
| bae4ade1 | 5.4.21 (react) | a19690025f1201f6 | 954.036 | difere |
| **HEAD** | **5.4.21 (react)** | **2777df85e929d049** | **954.342** | **PARIDADE BYTE A BYTE** |

Comando exato da paridade: `COMPONENT=main /var/www/dshowdash/public/react/node_modules/.bin/vite build --config
public/components/vite.components.config.js` (ROOT apontado para o worktree; saída em scratch). Os 3 avisos "Conflicting
namespaces" (`container-main/contracts/index.js` reexporta `isValidTransition`/`INVARIANTS` de dois módulos) ocorrem
também no build que reproduz o vivo — são benignos e pré-existentes, não causa de divergência.

## Q3 — Causa da divergência (uma frase)
**A divergência era só o toolchain (Vite 7.3.6 em vez do 5.4.21 do servidor); o bundle é reproduzível.** E o achado
central: o grafo do bundle entra por `_entry.ts` mas todos os imports usam `./x.js` e os irmãos `.js` existem →
**o Vite empacota os `.js` irmãos, nunca os `.ts`** (prova: removendo `routes-admin.js` em scratch o build falha com
`Could not resolve "./routes-admin.js" from "definitions/index.js"`; editando só `routes-admin.ts` o bundle sai
idêntico ao vivo). Consequência: "editar o `.ts`" sem regenerar o `.js` é drift sem efeito (foi o que barrou o Item C).
Estado dos pares relevantes com o transpile oficial (esbuild 0.21.5, es2022): `routes-admin`, `definitions/index`,
`registry/helpers`, `panel-status/core/lifecycle` → **IGUAIS** (`.js` = build fiel do `.ts`);
`routes-dashboard` → **DIFERE** (o `.ts` tem rotas que o `.js` não tem: panel-anuncios, panel-mercadolivre,
panel-metaads, **panel-avatar-studio**, panel-09; o `.js` tem comentários que o `.ts` não tem);
`panel-loader/panel-paths` → **DIFERE** (o `.js`, de 2026-07-31 "snapshot do trabalho local", é MAIS NOVO: mapeia
`google-ads`/`pipedrive`/`panel-ads` para os painéis React; o `.ts` ainda aponta para panel-12/panel-18).

## Q4 — Mecanismos para `/profile` → avatares
Alvo canônico: painel **`panel-avatar-studio`** (`public/components/panels/panel-avatar-studio/index.js`), rota
`#/panel-avatar-studio` (aliases `#/avatar-studio`, `#/avatar` só no `.ts`; em runtime resolve pelo atalho
`^panel-[a-z-]+$` de `main-engine/listeners.ts:169` — o registry vivo NÃO tem a rota, e não precisa).
Quem chega em `/profile` hoje: só URL direta/favorito (`app_nav_route` 36 "Profile (Header)"); o menu do usuário e os
intents do header navegam para `meu-perfil` (`manifest-generated.js:661,669`); `header_menu_items` está vazio.

- **M1 — redirect server-side: NÃO EXISTE MECANISMO.** O roteamento é por hash (`app/router/_entry.js`:
  `location.hash ? … : "/"`); o fragmento nunca chega ao nginx/PHP. Descartado.
- **M2 — override no banco: NÃO ALTERA O DESTINO.** `app_nav_route` 36 (`#/profile`) → `resolution_active` rev 35 →
  `app_nav_destination` 29 (`panel-user-preferences`); isso alimenta `api/ui/navigation.php` e o
  `manifest-generated.js` do UI-orchestrator (`"profile": {path:"#/profile", panel:"panel-user-preferences"}`), mas o
  painel montado para um hash é decidido pelo **main-engine** (`listeners.ts:168-181` → `getRouteByIdOrPath` do registry
  inlinado em `main.bundle.js` → `defaultView`), que não consulta essas tabelas. O provider dinâmico
  (`dynamic-route-provider.ts:75-84`) mapeia `target` por tabela fixa (default `panel-status`) — inútil para avatares. Não
  há destino `panel-avatar-studio` em `app_nav_destination`. Descartado como mecanismo principal (pode acompanhar
  como consistência de dados).
- **M1b — módulo aditivo de redirect (padrão já sancionado no repo):** um `<script type="module">` standalone como
  `app/router/initial-route.js` / `gcal-header-popover` / header v2 / layout v2: no boot e em `hashchange`, se o hash
  for `#/profile` → `RouterGlobal.navigate('/panel-avatar-studio')` (`replace`). **Sem bundle, sem banco**; rollback =
  remover a linha do `index.html`; blast radius = só a rota `/profile`. Exige commit + deploy normal (index.html e o
  módulo são versionados). Limitação: a URL troca para `#/panel-avatar-studio` (redirect, não alias).
- **M3 — reconciliar o build (PROVADO em scratch):** `routes-admin.ts` (`/profile` → `panel-avatar-studio`) →
  `esbuild 0.21.5 --format=esm --target=es2022` → `routes-admin.js` (diff: 1 linha) → `COMPONENT=main vite@5.4.21
  build` → `main.bundle.js` sha `f0e87b4b99a32125` (954.339 B), **diff contra o vivo = exatamente 2 tokens**, a linha
  `"/profile": pi("profile","Meu Perfil","panel-user-preferences"…)` → `"panel-avatar-studio"`; nenhuma outra rota
  afetada (`Q4-M3-diff-poc-profile.txt`). Custo/risco: substitui o **bundle de boot inteiro** (954 KB) em produção; o
  deploy (`deploy-as5.sh`) **não** constrói `components/main` → exige rodar `rebuild-all.sh --target main` no servidor
  (ou incluir esse target no deploy), com backup do bundle vivo e gate de peso; e `app-router.bundle.js` (não
  reproduzível) continua com a tabela antiga — duas cópias do registry divergem (`RouterGlobal` usa a dele para
  guards/`routeEntry`; o painel montado vem da cópia do main). Funcional, mas com "duas verdades".

**Recomendação: M1b (módulo aditivo) como correção de menor risco agora; M3 como remediação estrutural depois**
(quando o lote `main` entrar no deploy e o drift `routes-dashboard`/`panel-paths` for reconciliado).

## Q5 — Correlatos
- **C1** (defs duplicadas mortas de `/preferencias` e `/meu-perfil`): vivem no mesmo `main.bundle.js` (vivo contém
  `"/preferencias": st(...,"panel-preferences")` e `Ei(...,"panel-user-preferences")`, idem `/meu-perfil`). Remover
  exige regenerar `routes-dashboard.js` — que hoje **difere** do `.ts` (Q3): antes é preciso reconciliar o drift
  (o `.ts` traz 5 rotas a mais; decidir se entram no runtime). Não é só "apagar duas linhas".
- **Item D (registro via banco):** SIM, tem efeito em runtime sem tocar bundle: a sidebar carrega
  `/api/ui/navigation.php?action=manifest` (lê `ui_nav_items`, `app_nav_route`, `app_nav_destination`, `ui_triggers`) e
  o panel-loader carrega `/components/panels/<panel_id>/index.js` por convenção. Blast radius: o item aparece na
  navegação de todos os usuários com permissão para o item (campo de nível/permissão do `ui_nav_items`); rollback =
  desativar a linha. `panel-criacao-botoes` é admin (grava `ui_nav_items`) → item restrito a admin.
  `panel-relogio-mundial` já é alcançado pelo relógio do header; um item de sidebar é opcional. Para o registro em
  `panel-paths.ts` vale a mesma regra do M3 e, além disso, o `.ts` está **atrás** do `.js` (portar o `.js` para o `.ts`
  antes de qualquer regen).

## PLANO go/no-go — `/profile` → avatares
**GO (recomendado): M1b — módulo aditivo `app/router/profile-redirect`** (nome sugestivo; padrão de `initial-route.js`).
1. Criar `public/app/router/profile-redirect.ts` → transpilar com o esbuild oficial para o `.js` irmão (mesmo padrão
   `header/mobile-v2`), lógica: ao carregar e em `hashchange`, se `location.hash` ∈ {`#/profile`, `#/profile/…`} →
   `RouterGlobal.navigate('/panel-avatar-studio', { replace: true })` (fallback `location.replace('#/panel-avatar-studio')`
   se o RouterGlobal não estiver pronto — esperar como o `initial-route.js` faz). Opcional: atrás de flag
   (`as6.profile_redirect`) para canário u75 primeiro.
2. `index.html`: 1 linha `<script type="module" src="/app/router/profile-redirect.js?v=…">` após `initial-route.js`.
3. Prova: preview do worktree (`scripts/header/preview-shell.mjs`) + Playwright: abrir `#/profile` (boot frio) e navegar
   para `#/profile` depois do boot → em ambos monta `panel-avatar-studio` (`.vc-root[data-vc]`/`[data-avst-react-root]`),
   hash final `#/panel-avatar-studio`; `#/meu-perfil` e `#/preferencias` inalterados; 0 erros de página.
4. Verificação pós-deploy: smoke das 3 rotas na produção servida; sem gate de peso (não há bundle).
5. Rollback: remover a linha do `index.html` (ou flag OFF). Blast radius: só `/profile`.
**NO-GO agora: M3** — exige (a) rodar/rebuildar `components/main` no servidor fora do deploy, (b) reconciliar antes o drift
de `routes-dashboard`/`panel-paths` (ou aceitar substituir o bundle de boot com um diff maior que a rota), (c) conviver
com `app-router.bundle.js` irreproduzível. Fica como remediação estrutural: recuperar/recriar `vite.lote3bc.config.js`,
incluir `main` e `app-router` no deploy com gate de peso e paridade, e só então mover rotas na fonte.
**NÃO: M1/M2** (inexistentes como mecanismo de destino).

## Precisa do Jhony
- Escolher M1b (redirect) × M3 (rebuild) e se o redirect vai atrás de flag/canário.
- Deploy do M1b (commit + `deploy-as5.sh` via webhook) — não feito nesta rodada.
- Se M3: autorizar `rebuild-all.sh --target main` no servidor, backup do bundle vivo, inclusão no deploy, e a
  reconciliação do drift `routes-dashboard.ts/.js` e `panel-paths.ts/.js` (revisão de 5 rotas e 5 mapeamentos).
- Item D via banco: aprovar a linha de `ui_nav_items` (sem SQL nesta rodada).
