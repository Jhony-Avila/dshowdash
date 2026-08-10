# Elevação Basal — 02 · Baseline do Runtime Atual

> Fotografia comprovada do sistema no início do programa. Gate 0: nenhuma alteração
> arquitetural antes deste inventário + rollback preservado.

## 1. Identificação do baseline

| Campo | Valor |
|---|---|
| Commit baseline | `86467a1a8dc15c80c274b54f78097f88d4149fcc` |
| Branch | `main` |
| Tag proposta | `basal-baseline-2026-08-10` (criada no bloco de entrega da Onda 1) |
| Data | 2026-08-10 |
| Release em produção | DEPLOY_1220_OK (Avatar Studio; bloco 1290 pendente de colagem) |

## 2. Números do clone limpo (verificados em 2026-08-10)

| Métrica | Valor | Observação |
|---|---|---|
| Arquivos rastreados (total) | 13.796 | `git ls-files` |
| Rastreados em `app/` | 93 | 100% da árvore física local |
| Rastreados em `public/app/` | **0** | servidor tem 32 físicos, todos ignorados (briefing §3.3) |
| Rastreados em `api/` | 87 | servidor tem centenas físicos, ~444 ignorados (briefing §3.4) |
| Rastreados em `public/` | 13.397 | inclui `public/koala/` e `public/components/` |
| Diretórios `dist` rastreados | 0 | |
| Diretórios `dist` físicos no clone | **0** | os 63 do servidor são todos ignorados |
| Pares TS/JS rastreados (mesmo caminho-base) | **5.540** | bate com briefing §3.6 |
| Deps js/css do `public/index.html` | 74 | todas `*/dist/*.bundle.js|css` — **nenhuma existe no clone** |
| Workflows de CI | 0 | |
| Script de teste no `package.json` raiz | inexistente | só dev/build/preview/typecheck |

**Conclusão do Gate 0**: um clone limpo hoje NÃO inicia a aplicação — o entrypoint
rastreado depende integralmente de artefatos que só existem no servidor (BASAL-001/003).

## 3. Entrypoint e grafo de boot (do index.html rastreado)

Ordem observada de carga (todas ignoradas pelo Git no servidor):

```text
/bootstrap-v2/dist/bootstrap.bundle.js
/core/runtime/dist/runtime.bundle.js
/core/runtime/events/catalog/dist/events-catalog.bundle.js
/core/js/event-bus/dist/event-bus.bundle.js
/assets/js/core/logger-global/dist/logger-global.bundle.js
/assets/js/core/telemetry-core/dist/telemetry-core.bundle.js
/components/preloader/dist/preloader.bundle.js
/components/session-manager/dist/session-manager.bundle.js
/core/auth/dist/auth.bundle.js
/components/error-boundary/dist/error-boundary.bundle.js
/assets/js/core/config-loader/dist/config-loader.bundle.js
/components/security/csrf-token-manager/dist/csrf-token-manager.bundle.js
/assets/js/core/environment-manager/dist/environment-manager.bundle.js
/modules/global-state/dist/global-state.bundle.js
/core/js/asset-loader/dist/asset-loader.bundle.js
/components/context-provider/dist/context-provider.bundle.js
/components/feature-flags/dist/feature-flags.bundle.js
/core/kernel/dist/kernel.bundle.js
/core/kernel/ui/dist/kernel-ui.bundle.js
/components/app-shell/dist/app-shell.bundle.js
… (74 no total — lista completa: saída do coletor de evidências)
```

## 4. Evidências pendentes do servidor (preencher via coletor)

O script `scripts/basal/coletar-evidencias-servidor.sh` (read-only, sem segredos) coleta:

- [ ] commit/branch/status do worktree do servidor + divergências locais (`git status`);
- [ ] lista completa das 76 deps do index com classificação tracked/ignored e **sha256 de cada bundle ativo** (rollback do estado atual);
- [ ] os 63 diretórios `dist` + frescor (fonte mais recente que artefato?);
- [ ] contagem física × rastreada de `api/`, `public/app/`, `bootstrap-v2/`, `core/`, `platform/`, `modules/`, `react/`;
- [ ] tipo real de `public/api` (symlink → destino);
- [ ] vhosts Nginx: `listen`, `server_name`, `root`, `location` (sem segredos);
- [ ] portas em escuta (`ss -tlnp`) e serviços ativos;
- [ ] verificação HTTP de exposição: `.ts`, `.tsx`, `.patch`, `.md`, `.env` (status code apenas);
- [ ] testes existentes fora do Avatar Studio;
- [ ] releases/backups disponíveis em `/backup`.

Saída: `docs/ELEVACAO-BASAL/evidencias/baseline-servidor-<data>.md`, commitada no repo
(2º commit do bloco de entrega). **Nada sensível entra**: sem `.env`, credenciais,
tokens, cookies, certificados, strings de conexão, dados pessoais ou dumps.

## 5. Serviços e infraestrutura (declarado; revalidar)

Nginx (80/443/8080) · PHP 8.3 FPM · MySQL (`0.0.0.0:3306` — risco até validar firewall)
· Redis (local) · Cloudflare Tunnel · Decision Engine Python (local :8100).
Vhost :8080 → root `/var/www/dshowdash_v3/public` inexistente (404) — config órfã.

## 6. Como restaurar o estado atual (rollback do programa)

1. Worktree do servidor: `git checkout 86467a1a` (código rastreado).
2. Artefatos ignorados: preservados pelos hashes coletados + `/backup` (regra oficial:
   nada é apagado; tudo movido para `/backup` com timestamp + `revert-all.sh`).
3. Banco: backup confirmado antes de qualquer mudança P0 (M1).
4. Nginx: cópia da config ativa antes de qualquer edição (M1).
