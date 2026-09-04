# tools/authenticated-preview

Ferramentas de **validação autenticada zero-edit** do candidato Visual Composer
(`c6318cca` / tree `c2116dc0`) do Avatar Studio. Fonte canônica versionada — as cópias
em `/root` são operacionais e devem ser idênticas (verifique por SHA-256).

## Arquivos

- `auditoria-auth.mjs` — auditoria headless dirigida por **arquivo de config** (nunca edite o script).
  Config não-secreta em `audit.config*.json`; segredos/ambiente só por env
  (`BASE_URL`, `STORAGE_STATE`, `CHROME_PATH`, `OUT`, `BASE_ROUTE`).
  Resolve seletores por lista (unicidade/visibilidade/conexão; sem fallback silencioso para `body`),
  descobre a rota via router quando disponível, exige identidade completa (shell+VC+hashes),
  faz preflight seguro do storage-state (nunca imprime conteúdo), aplica allowlist e detecta
  redirect para domínio não autorizado. **Fail-closed**: qualquer condição inválida → exit ≠ 0.
- `proxy-auth.mjs` — serve o candidato estático + proxy `/api` para o backend canônico,
  injetando os cookies do storage-state **server-side** (allowlist de host; `--help`).
- `preview-auth-candidato.sh` — executor da **Opção B** (panel-level). Resultado sempre
  classificado `AUTHENTICATED_PANEL_PREVIEW`.
- `fail-closed-tests.sh` — prova que a auditoria aborta em cada condição insegura, sem rede/segredo.
- `audit.config.json` — config **scope=full** (exige shell global; para a Opção A / staging).
- `audit.config.panel.json` — config **scope=panel** (Opção B).

## Uso

Opção A (staging autenticado do candidato, prova o shell global):

    AUDIT_CONFIG=tools/authenticated-preview/audit.config.json \
    BASE_URL=https://STAGING STORAGE_STATE=/root/state.json CHROME_PATH=/.../chrome \
    OUT=/root/auth-out node tools/authenticated-preview/auditoria-auth.mjs

Opção B (panel-level):

    STORAGE_STATE=/root/state.json API_BASE=https://dshowdash.com.br \
    bash tools/authenticated-preview/preview-auth-candidato.sh

## Regras

- storage-state nunca entra no git, no pacote, em log/trace/HAR, nem em cópia temporária.
- Perm exigida do storage-state: `600`.
- `audit.config*.json` não contém segredos — apenas seletores, rotas, allowlist e SHAs esperados.
- A classificação `AUTHENTICATED_PANEL_PREVIEW` **não** é prova do shell global; só a Opção A (scope=full) é.
