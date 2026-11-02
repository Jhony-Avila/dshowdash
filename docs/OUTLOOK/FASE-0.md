# Integração Outlook — Fase 0 (Fundação técnica)

> Status: **backend implementado e validado** (rota no ar, 22/22 no autoteste de crypto+OAuth).
> Bloqueado para teste ponta-a-ponta por **2 ações do dono/DBA** (Azure + banco). Ver §4.
> Criado em 2026-07-21. Molde de arquitetura: `api/pipedrive/` (mesmas convenções).

Referência do briefing: seções §3.1 (Entra ID obrigatório), §8 (auth delegada), §27 (arquitetura),
§28 (banco), §33 (Fase 0). Fluxo delegado: o Dshow Dash atua **em nome do usuário** conectado.

---

## 1. O que foi entregue (código)

Módulo `api/outlook/` (roteador PATH_INFO, igual ao Pipedrive):

```
api/outlook/
  index.php                     # roteador ^/api/outlook(/.*)?$ ; callback OAuth precede o gate CSRF
  _init.php                     # bootstrap (requires, CORS, helpers, outlook_require_access)
  lib/
    OutlookCrypto.php           # AES-256-GCM (chave OUTLOOK_CRYPTO_KEY) p/ tokens em repouso
    GraphOAuth.php              # Microsoft Identity: authorize URL + PKCE(S256) + troca de code + refresh
    GraphClient.php             # HTTP do Microsoft Graph (retry/backoff em 429/503, respeita Retry-After)
  repositories/
    OAuthStateRepository.php    # state+code_verifier(PKCE) efêmero, consumido 1x (anti-CSRF/replay)
    AccountRepository.php       # multi-conta por user_id; tokens cifrados; conta padrão; isolamento §26.1
    LogRepository.php           # logs técnicos §26.3 (sem PII: nunca corpo/assunto/remetente)
  services/
    AuthService.php             # orquestra connect/callback/disconnect + access token com auto-refresh
    MessageService.php          # prova de leitura (listar/abrir) e envio; refresh forçado em 401
  controllers/
    AuthController.php          # /accounts (lista/connect/callback/reconnect/patch/delete)
    StatusController.php        # /status (+ modo degradado quando o banco ainda não existe)
    MessageController.php       # /messages (listar/abrir/enviar)
```

Infra tocada (aditivo, com backup em `/backup/outlook-fase0-<stamp>/`):
- **nginx**: novo bloco `location ~ ^/api/outlook(/.*)?$` (validado `nginx -t`, recarregado).
- **`config/db_connection.php`**: nova conexão `OUTLOOK_DSHOW` (local, usuário não-root).
- **`.env` / `.env.example`**: bloco `OUTLOOK_CRYPTO_KEY` (gerada) + `MS_OAUTH_*` + `DB_OUTLOOK_DSHOW_*`.
- **`sql/outlook_schema.sql`**: DDL rascunho (§28) — **NÃO aplicado** (aguarda DBA).

Validação já feita:
- `php -l` limpo em todos os arquivos.
- Rota no ar: `GET /api/outlook/status` → `401 AUTH_REQUIRED` (JSON), provando roteamento + bootstrap.
- Autoteste CLI (crypto + PKCE + authorize URL) com o `.env` real: **PASS=22 FAIL=0**.

---

## 2. Rotas da API (Fase 0)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/outlook/status` | Estado da config + contas do usuário (modo degradado se sem banco) |
| GET | `/api/outlook/accounts` | Lista contas Microsoft do usuário (mascarada, sem tokens) |
| POST | `/api/outlook/accounts/connect` | Inicia OAuth → `{authorize_url}` (front redireciona o navegador) |
| GET | `/api/outlook/accounts/callback` | Callback OAuth (redirect do navegador; valida `state`; **sem CSRF**) |
| POST | `/api/outlook/accounts/{id}/reconnect` | Reinicia OAuth para uma conta |
| PATCH | `/api/outlook/accounts/{id}` | Define conta padrão (`{"is_default":true}`) |
| DELETE | `/api/outlook/accounts/{id}` | Desconecta (revoga localmente: zera tokens) |
| GET | `/api/outlook/messages?account_id=` | Lista a Caixa de Entrada |
| GET | `/api/outlook/messages/{id}?account_id=` | Abre uma mensagem |
| POST | `/api/outlook/messages/send` | Envia (`{account_id, subject, body_html, to[], cc[], bcc[], importance}`) |

Escritas (POST/PATCH/DELETE) exigem token CSRF (`X-CSRF-Token`, obtido em `/api/auth/check.php`),
exceto o `callback` (protegido pelo `state` único). Acesso: qualquer usuário autenticado;
os dados são **isolados por `user_id`** — um usuário nunca vê contas de outro (§26.1).

---

## 3. Segurança (como está implementado)

- **Tokens nunca no frontend**: access/refresh só existem no backend; cifrados em repouso (AES-256-GCM).
- **Sem senha Microsoft**: só tokens OAuth delegados.
- **PKCE (S256)** + **state** único consumido 1x → protege o callback contra CSRF/replay/interceptação.
- **Refresh no backend**, com detecção de `invalid_grant` (consentimento revogado → conta marcada
  `revoked`/`needs_auth`, com aviso — nunca "quebra silenciosa", §8.3).
- **Logs sem PII** (§26.3): registram evento/erro técnico, jamais conteúdo de e-mail.
- **Open-redirect barrado** no callback (`return_to` só aceita rota interna começando com `/`).
- **`display_errors=0`**: nenhum stack/path vaza ao cliente; erros vão ao `error_log`.

---

## 4. PENDENTE — 2 ações do dono/DBA para destravar o teste E2E

### 4.1 Registrar a aplicação no Microsoft Entra ID (portal Azure)

1. Portal Azure → **Microsoft Entra ID** → **App registrations** → **New registration**.
2. **Name**: `Dshow Dash — E-mails`.
3. **Supported account types**: **Accounts in any organizational directory (multitenant) and personal
   Microsoft accounts** (briefing §3.1: corporativas + pessoais).
4. **Redirect URI**: plataforma **Web** →
   `https://dshowdash.com.br/api/outlook/accounts/callback`
5. Registrar. Copiar o **Application (client) ID**.
6. **Certificates & secrets** → **New client secret** → copiar o **Value** (só aparece 1x).
7. **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**,
   adicionar (mínimas da Fase 0): `openid`, `profile`, `email`, `offline_access`,
   `User.Read`, `Mail.Read`, `Mail.Send`. (Consentimento é por usuário no 1º login; não requer admin
   para essas permissões delegadas em contas comuns.)
8. Preencher no `.env` do servidor:
   ```
   MS_OAUTH_CLIENT_ID=<Application (client) ID>
   MS_OAUTH_CLIENT_SECRET=<client secret Value>
   ```
   (`MS_OAUTH_TENANT=common` e `MS_OAUTH_REDIRECT_URI` já estão preenchidos.)

> A chave `OUTLOOK_CRYPTO_KEY` já foi gerada e está no `.env`. Não versionar o `.env`.

### 4.2 Provisionar o banco `OUTLOOK_DSHOW` (usuário não-root)

Como MySQL root/admin (padrão do repo — sem runner de migração):
```sql
-- 1) schema + tabelas (rascunho revisável)
mysql -h 127.0.0.1 -u <admin> -p < /var/www/dshowdash/sql/outlook_schema.sql

-- 2) usuário dedicado da aplicação (não-root), só neste schema
CREATE USER IF NOT EXISTS 'outlook_app'@'127.0.0.1' IDENTIFIED BY '<senha-forte>';
GRANT SELECT, INSERT, UPDATE, DELETE ON OUTLOOK_DSHOW.* TO 'outlook_app'@'127.0.0.1';
FLUSH PRIVILEGES;
```
Preencher no `.env`:
```
DB_OUTLOOK_DSHOW_USER=outlook_app
DB_OUTLOOK_DSHOW_PASS=<senha-forte>
```

> ⚠️ Revisar `sql/outlook_schema.sql` antes de aplicar. A Fase 0 usa apenas
> `outlook_accounts`, `outlook_oauth_states` e `outlook_technical_logs`; as demais tabelas
> são planejamento das Fases 1-3.

### 4.3 Critério de conclusão da Fase 0 (§33)

Com 4.1 e 4.2 feitos, testar pelo painel/curl autenticado:
o usuário **conecta uma conta**, **lista** mensagens, **abre** uma mensagem e **envia** um e-mail
de teste — em uma conta corporativa e em uma pessoal.

---

## 5. Fora do escopo da Fase 0 (próximas fases)

Frontend (ícone no header, item na sidebar, painel React, badge) = **Fase 1**.
Pastas/categorias/dashboard = Fase 2. Webhooks+delta, caixas compartilhadas, envio em massa = Fase 3.
IA = Fase 4. Integração com clientes/propostas = Fase 5. (Ver §33-34 do briefing.)
