# Lote `main` no deploy (decisão #89 — fechamento) — 2026-09-12

## Problema
O bundle `public/components/main/dist/main.bundle.js` (servido; 954.342 B de 2026-07-30) inlina `router/registry` e `router/state`
(`keepInternal` em `public/components/vite.components.config.js`), mas o `deploy-as5.sh` só reconstruía `panel-avatar-studio`,
`panel-dashboard` e footer. Consequência: toda mudança de FONTE no registro de rotas (rotas canônicas, aliases, retargets de rotas
legadas, `getRouteByAlias`) ficava inerte em produção — medido nos smokes pós-deploy (aliases `#/lotties`/`#/animacoes` e as 6 rotas
legadas reapontadas no banco não mudavam de painel).

## O que muda
- `scripts/deploy/build-lote-main.sh` (novo): backup fiel do bundle vivo (`${BACKUP}/main-bundle-<carimbo>.js`), build pela config
  versionada (`COMPONENT=main`, vite 5.4.21 do toolchain `public/react`), gates — rc, tamanho mínimo (500 KB) e máximo versionado
  (`pesos-esperados.json` → `components-main.main.bundle` = 1000 KB), `node --check`, sanidade do registro inlinado (`"/panel-dashboard"`,
  `"/preferencias"`) — e **auto-restauração** do bundle anterior se qualquer gate falhar (o deploy aborta com produção intacta).
  Idempotente e determinístico (mesmo sha em builds repetidos).
- `scripts/deploy/deploy-as5.sh`: etapa 5b chama o script (escape hatch `DEPLOY_LOTE_MAIN=0`); `main/dist` entra no tar de backup
  da etapa 1; resumo imprime o rollback do bundle.
- `public/components/vite.components.config.js`: `ROOT` aceita `VITE_COMPONENTS_ROOT` (ensaio em worktree); padrão = produção.
- `scripts/deploy/pesos-esperados.json`: `components-main.main.bundle: 1000`.

## Prova (ensaio em worktree isolado, `DEPLOY_RAIZ`/`DEPLOY_BACKUP` apontados para fora da produção)
1. Build limpo: 932 KB, sha `2e865764…`, rc 0. 2. Rebuild idempotente: backup criado, mesmo sha. 3. Gate de peso forçado a 100 KB:
falha com mensagem e **restaura o bundle anterior** (sha igual). Bundle servido pelo preview do worktree: smoke Lotties **13/13**
(inclui `#/lotties` e `#/animacoes` montando o painel), smoke das 10 rotas/5 assets **TODOS PASS**, smoke das flags header/shell v2
**9/9**. Avisos do Vite (`dynamic-import-vars` em `container-main/core|utils/index.js`, "Conflicting namespaces") são pré-existentes
do lote e não bloqueiam.

## Efeitos esperados no primeiro deploy com o lote main
- Aliases do registro passam a montar (`#/lotties`, `#/animacoes`, `#/avatar`, …); rotas legadas `/bling`, `/google-ads`,
  `/google-drive`, `/pipedrive` passam a abrir os sucessores canônicos (retargets do lote cleanup-v2); `/termos` some do registro
  (era rota morta); as definições concorrentes de `/preferencias`/`/meu-perfil` já não existem na fonte.
- O bundle passa a refletir TODAS as mudanças de fonte em `components/main/**`, `router/registry/**` e `router/state/**` desde
  2026-07-30 — por isso o rollback fica impresso e o bundle anterior fica em `/backup`.
- `app/router/dist/app-router.bundle.js` (irreproduzível, sem config) continua congelado: não participa da navegação por hash
  (main-engine → `extractPanelId` → `getRouteByIdOrPath`), provado pelos smokes.

## Rollback
`cp -p /backup/main-bundle-<carimbo>.js /var/www/dshowdash/public/components/main/dist/main.bundle.js` (sem redeploy) ou o tar
`pre-as5-<carimbo>-dist.tar.gz` do deploy-as5; para desativar a etapa em um deploy: `DEPLOY_LOTE_MAIN=0`.
