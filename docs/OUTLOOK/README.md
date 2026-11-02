# Integração Outlook — Documento Mestre

> **Ponto de entrada** da documentação do módulo de e-mails do Dshow Dash.
> Detalhe incremental por fase em [`FASE-0.md`](FASE-0.md) (fundação) e [`FASE-1.md`](FASE-1.md) (frontend + operações).
> Briefing de origem: "Integração Outlook com o Dshow Dash" (36 seções, 7 fases).
> Última atualização: 2026-07-21.

---

## 1. Estado atual (resumo executivo)

Um módulo de e-mails completo, integrado ao Outlook/Microsoft 365 via Microsoft Graph, com **OAuth
delegado (PKCE)**. Backend em `api/outlook/` (PHP 8.3, 22 arquivos, ~4.4k linhas) + painel React
`panel-outlook` (React 19 + TS + Vite, 17 arquivos, ~3k linhas + CSS).

**Como está rodando hoje:** em **modo de testes (mock)** — `OUTLOOK_PROVIDER=mock` no `.env`. Todo o
frontend é exercitável de ponta a ponta com dados fictícios (estado por sessão), **sem Azure e sem banco**.
Os caminhos reais (Graph/DB) estão escritos e prontos, ou marcados como placeholder para as fases seguintes.

**Bloqueios para o "real" (ver §10):** registrar app no Azure (Entra ID) + provisionar o banco `OUTLOOK_DSHOW`.

**Ponto cego:** o frontend foi construído sem validação visual autenticada — precisa de QA visual do dono
(dark+light, responsivo, 3 modos de exibição, gráficos, modais).

### Pontos de entrada no app
- **Sidebar**: item `sidebar.outlook` na tabela `ui_nav_items` (grupo `sidebar.grp-favoritos`, abaixo do DataTables) → `#/panel-outlook`.
- **Header**: envelope `email-integration` reapontado para `#/panel-outlook`, badge = "recebidos hoje" (`/api/outlook/header-counter`).
- **Rota**: `/panel-outlook` em `router/registry/definitions/routes-dashboard.{ts,js}`; resolve o painel por fallback de `panel-paths.js`.
- **SW**: `public/sw.js` tem `isOutlook` no bustBundle + `networkFirst` (mantidos após bumps de outros agentes; versão atual do SW gerida por eles).

---

## 2. Arquitetura

```
Navegador (painel React panel-outlook)
   │  fetch /api/outlook/*  (cookie de sessão + CSRF em escritas)
   ▼
api/outlook/index.php  (roteador PATH_INFO; nginx: ^/api/outlook(/.*)?$)
   │  SessionGate + outlook_require_access (requireAuth) + requireCsrfForWrite
   ├── OUTLOOK_PROVIDER=mock ──► OutlookMockController + OutlookMock ($_SESSION)   ← modo de testes
   └── OUTLOOK_PROVIDER=graph ─► Controllers reais → Services → GraphClient/GraphOAuth → Microsoft Graph
                                                    └► repositories → OUTLOOK_DSHOW (tokens cifrados)
```

- **Isolamento por usuário**: tudo escopado por `user_id` (§26.1). No mock, o escopo é a própria sessão.
- **Segurança de tokens**: `OutlookCrypto` (AES-256-GCM, chave `OUTLOOK_CRYPTO_KEY`); tokens nunca vão ao frontend.
- **Curto-circuito do mock**: isolado em `index.php` (antes da conexão de banco e, no callback, antes do gate CSRF). Os caminhos reais ficam intocados.

---

## 3. Mapa de arquivos

### Backend — `api/outlook/`
```
index.php                 Roteador. Callback OAuth precede CSRF; curto-circuito do mock; degradado sem banco.
_init.php                 Bootstrap (requires, CORS, helpers outlook_body/query/require_access/is_mock).
lib/
  OutlookCrypto.php       AES-256-GCM (OUTLOOK_CRYPTO_KEY). encrypt/decrypt/scrub/mask.
  GraphOAuth.php          Microsoft Identity: authorize URL + PKCE(S256) + troca de code + refresh.
  GraphClient.php         HTTP do Graph: retry/backoff 429/503 + Retry-After; headers extras (ConsistencyLevel).
  OutlookMock.php         PROVEDOR MOCK completo (estado em $_SESSION). Semente + toda a lógica de negócio.
repositories/
  AccountRepository.php   Contas multi-conta por user_id; tokens cifrados; conta padrão; isolamento.
  OAuthStateRepository.php  state+code_verifier (PKCE) efêmero, consumido 1x (anti-CSRF/replay).
  LogRepository.php       Logs técnicos §26.3 (sem PII).
services/
  AuthService.php         connect/callback/disconnect + accessTokenFor (auto-refresh, detecta invalid_grant).
  MessageService.php      list/get/send/reply/forward/mark-read/flag/importance/categories/move/archive/
                          delete/draft/bulk + busca($search)+filtro($filter) + anexos + getAttachmentContent.
  FolderService.php       GET /folders (Graph mailFolders).
  MetricsService.php      Badge header-counter (count recebidos-hoje + unread; cache Redis ~55s).
controllers/
  AuthController.php       /accounts (lista/connect/callback/reconnect/patch/delete).
  StatusController.php     /status (+ degradado sem banco).
  MessageController.php    /messages/* (todas as ações reais; id em query/body).
  FolderController.php     /folders.
  MetricsController.php    /header-counter + /dashboard (placeholder real).
  TemplateController.php   /templates — placeholder real (DB, Fase 2; NÃO depende de Azure).
  CategoryController.php   /categories — placeholder real (Graph masterCategories, Fase 3).
  RulesController.php      /rules — placeholder real (Graph messageRules, Fase 3).
  MassController.php       /mass — placeholder real (fila+throttling, Fase 3).
  MockController.php       Roteia TODAS as rotas para OutlookMock quando OUTLOOK_PROVIDER=mock.
```

### Frontend — `public/components/panels/panel-outlook/`
```
index.js                  Adaptador vanilla (lê dist/.vite/manifest.json no-store, importa bundle, mountReact).
vite.config.ts            npx vite build --config ...  →  dist/ (chown www-data OBRIGATÓRIO depois).
src/entry.tsx             mountReact/unmountReact (root [data-ol-react-root]).
src/app/App.tsx           Shell: 6 abas (E-mails/Dashboard/Modelos/Regras/Contas/Configurações), hash nav,
                          nav recolhível, selo "Modo de testes", banner "em configuração".
src/lib/api.ts            Cliente fetch + CSRF (/api/auth/check.php COM .php) + TanStack Query + chaves.
src/lib/format.ts         Datas relativas/completas, iniciais, cor determinística.
src/lib/prefs.ts          Preferências (localStorage): assinatura, layout, densidade.
src/shell/types.ts        Todos os tipos (contas, mensagens, dashboard, modelos, categorias, regras, anexos, massa).
src/styles/tokens.css     Tokens + layout, escopado [data-ol-react-root]. Dark default + light.
src/screens/
  Emails.tsx              Central 3-colunas: pastas+contas / lista / leitura. Busca, filtros, chips,
                          seleção em massa, categorias, modos de visualização, anexos na leitura, agendados.
  Compositor.tsx          Editor: novo/responder/encaminhar; modelos, agendamento, assinatura, ANEXOS.
  Contas.tsx              Conectar/reconectar/desconectar/padrão (fluxo OAuth).
  Dashboard.tsx           Big numbers + gráficos SVG próprios (evolução/horário/contatos/status).
  Modelos.tsx             Biblioteca de modelos (CRUD + campos dinâmicos).
  Categorias.tsx          Chips coloridos + menu de aplicar + modal de gestão.
  Regras.tsx              Regras (condições→ações, testar, aplicar agora, reordenar).
  Configuracoes.tsx       Assinatura + exibição (preferências).
  MassSend.tsx            Envio em massa (lista, progresso, relatório CSV).
  EmBreve.tsx             (Órfão — não mais referenciado; pode ser removido.)
```

---

## 4. Referência de API (`/api/outlook`)

Escritas (POST/PATCH/DELETE) exigem CSRF (`X-CSRF-Token`), exceto o callback OAuth. `account_id` obrigatório
nas rotas de mensagens (query no GET, body no POST). **id de mensagem SEMPRE em query/body, nunca no path**
(IDs do Graph podem conter `/`).

| Rota | Método | Descrição |
|---|---|---|
| `/status` | GET | Estado config + contas (degradado sem banco) |
| `/accounts` | GET | Lista contas do usuário |
| `/accounts/connect` | POST | Inicia OAuth → `{authorize_url}` |
| `/accounts/callback` | GET | Callback OAuth (redirect ao SPA; valida `state`) |
| `/accounts/{id}/reconnect` | POST | Reinicia OAuth p/ uma conta |
| `/accounts/{id}` | PATCH | Define conta padrão (`{is_default:true}`) |
| `/accounts/{id}` | DELETE | Desconecta (zera tokens) |
| `/messages` | GET | Lista por pasta. Params: `folder,top,skiptoken,q,filter,category` |
| `/messages/item` | GET | Abre 1 mensagem (`id`) |
| `/messages/attachments` | GET | Metadados dos anexos (`id`) |
| `/messages/attachment` | GET | **Download** binário (`id,aid`) |
| `/messages/send` | POST | Envia (`subject,body_html,to[],cc[],bcc[],importance,attachments[]`) |
| `/messages/reply` | POST | Responder (`id,comment,all`) |
| `/messages/forward` | POST | Encaminhar (`id,to[],comment`) |
| `/messages/mark-read` | POST | (`id,is_read`) |
| `/messages/flag` | POST | (`id,flagged`) |
| `/messages/importance` | POST | (`id,importance`) |
| `/messages/categories` | POST | (`id,categories[]`) |
| `/messages/move` | POST | (`id,destination`) |
| `/messages/archive` | POST | (`id`) |
| `/messages/delete` | POST | (`id`) → Lixeira |
| `/messages/draft` | POST | Cria rascunho → `{id}` |
| `/messages/update-draft` | POST | Autosave (`id,...`) |
| `/messages/send-draft` | POST | Envia rascunho (`id`) |
| `/messages/bulk-action` | POST | (`ids[],action,destination?`) |
| `/messages/schedule` | POST | Agenda (`...,scheduled_at`) — *real: 503 (Fase 2)* |
| `/messages/schedule-cancel` | POST | (`id`) — *real: 503* |
| `/messages/schedule-sendnow` | POST | (`id`) — *real: 503* |
| `/folders` | GET | Pastas com contadores (`account_id`) |
| `/header-counter` | GET | Badge: recebidos hoje + não lidos |
| `/dashboard/summary` | GET | Indicadores (`period`) — *real: `available:false` (Fase 2)* |
| `/templates` | GET/POST | Modelos (`/update /duplicate /delete /favorite`) — *real: placeholder (DB, Fase 2)* |
| `/categories` | GET/POST | Categorias (`/color /rename /delete`) — *real: placeholder (Graph, Fase 3)* |
| `/rules` | GET/POST | Regras (`/update /delete /toggle /reorder /test /apply`) — *real: placeholder (Graph, Fase 3)* |
| `/mass/start` `/mass/status` | POST/GET | Envio em massa — *real: placeholder (fila, Fase 3)* |
| `/mock/reset` | POST | **Zera o estado do mock** (só no modo mock) |

---

## 5. Matriz de status por funcionalidade

| Funcionalidade | Briefing | Mock | Real | Dependência do real |
|---|---|---|---|---|
| Conexão OAuth (PKCE, multi-conta) | §8 | ✓ (simulado) | ✓ escrito | Azure |
| Listar/abrir mensagens | §10 | ✓ | ✓ escrito | Azure |
| Enviar/responder/encaminhar | §10 | ✓ | ✓ escrito | Azure |
| Ações (ler/flag/import./mover/arquivar/excluir/massa) | §10 | ✓ | ✓ escrito | Azure |
| Rascunhos (criar/editar/enviar) | §11 | ✓ | ✓ escrito | Azure |
| **Anexos** (anexar/baixar/preview/enviar) | §20 | ✓ | ✓ escrito (pequenos) | Azure |
| Pastas | §14 | ✓ | ✓ escrito | Azure |
| Busca + filtros rápidos + categoria | §17 | ✓ | ✓ escrito | Azure |
| Badge "recebidos hoje" | §4 | ✓ | ✓ escrito | Azure |
| Contas (UI conectar/gerir) | §7 | ✓ | ✓ | Azure |
| **Agendamento de envio** | §13 | ✓ (job por tempo) | placeholder | Fila+job+DB (Fase 2) |
| **Dashboard gerencial** | §24 | ✓ | placeholder | Métricas/sync (Fase 2) |
| **Modelos de e-mail** | §22 | ✓ | placeholder | **DB apenas (NÃO Azure)** |
| **Categorias e cores** | §15 | ✓ | aplicar-em-msg ✓; gestão placeholder | Graph masterCategories (Fase 3) |
| **Regras automáticas** | §16 | ✓ | placeholder | Graph messageRules (Fase 3) |
| **Envio em massa** | §23 | ✓ | placeholder | Fila+throttling (Fase 3) |
| Modos de visualização (painel/densidade) | §6.2 | ✓ frontend | — | localStorage (DB Fase 2) |
| Assinatura + Configurações | §11/§6 | ✓ frontend | — | localStorage (DB Fase 2) |

---

## 6. Modelo de dados

### Estado do mock (`$_SESSION['outlook_mock']`)
`accounts[]`, `messages{id→msg}` (com `folder`, `categories[]`, `attachments[]`, `scheduled_at`,
`sched_status`), `templates{}`, `categories[]` (name+color), `rules{}`, `mass_jobs{}`, contadores `next_*`.
Semeado com ~24 mensagens pt-BR (inbox/enviados/agendados), anexos demo, categorias, 3 regras, 7 modelos.

### Banco real (`sql/outlook_schema.sql` — 11 tabelas, **NÃO aplicado**)
`outlook_accounts` · `outlook_oauth_states` · `outlook_technical_logs` · `outlook_account_mailboxes` ·
`outlook_sync_states` · `outlook_subscriptions` · `outlook_scheduled_messages` · `outlook_templates` ·
`outlook_user_preferences` · `outlook_daily_metrics` · `outlook_mass_send_jobs`.
Convenção: InnoDB utf8mb4, CREATE IF NOT EXISTS, sem runner de migração (aplicação manual). Usuário
dedicado `outlook_app` (não-root). **Fase 0 usa só accounts/oauth_states/technical_logs.**

---

## 7. Modo de testes (mock)

- **Ligar/desligar**: `OUTLOOK_PROVIDER=mock` (ligado) | `graph` ou vazio (real) no `.env`.
- **Escopo**: por sessão do usuário (`$_SESSION`). Some ao expirar a sessão.
- **Reset**: `POST /api/outlook/mock/reset` (o painel também expõe indiretamente).
- **Indicador visual**: selo "🧪 Modo de testes" na nav do painel (quando `status.provider==='mock'`).
- **Harnesses de validação** (efêmeros, no scratchpad da sessão — **mover para `tests/` é pendência**):
  exercitaram crypto+PKCE (22/22), mock geral (22/22), busca/filtro (8/8), dashboard (11/11),
  modelos (11/11), categorias (12/12), agendamento (7/7), regras (12/12), anexos (9/9), massa (9/9).

---

## 8. Build & deploy

- **Backend**: sem build. Após editar, **restaurar owner/ACL** (Edit como root quebra):
  `chown -R www-data:www-data api/outlook && chmod 640 (arquivos)/770 (dirs) && setfacl -m u:agent_01:rwx -m u:agent_02:rwx -m u:agent_03:rwx`.
  Validar com `php -l`.
- **Frontend**: `npx vite build --config public/components/panels/panel-outlook/vite.config.ts`
  → **`chown -R www-data:www-data public/components/panels/panel-outlook`** (senão o painel não monta).
  Bundle é **hasheado** + manifest lido `no-store` → **não precisa bump de SW** para mudança só de bundle.
  Bump de SW só é necessário se mudar arquivo de **URL fixa** (ex.: `index.js` do painel).
- **Typecheck**: `npx tsc --noEmit -p public/components/panels/panel-outlook/tsconfig.json` (strict:
  `noUnusedLocals`/`noUnusedParameters` — cuidado com imports/vars não usados).

---

## 9. Segurança

- Tokens OAuth cifrados em repouso (AES-256-GCM); nunca no frontend; refresh no backend; detecção de `invalid_grant`.
- PKCE(S256) + `state` único consumido 1x → callback protegido contra CSRF/replay.
- HTML de e-mail recebido renderizado em **iframe `sandbox=""`** (sem `allow-scripts`) → XSS neutralizado.
- Download de anexo com `Content-Disposition` + `X-Content-Type-Options: nosniff`.
- Compositor bloqueia extensões perigosas (§20.2) e dupla-extensão; limite 10 MB (mock).
- Open-redirect barrado no callback (`return_to` só rota interna). `display_errors=0`.
- **Pendente**: sanitização do HTML de **saída** (compositor/modelos) no servidor antes de enviar (§11.2).

---

## 10. Checklist de go-live (real)

1. **[Dono] Registrar app no Microsoft Entra ID** (multitenant + contas pessoais). Redirect:
   `https://dshowdash.com.br/api/outlook/accounts/callback`. Permissões delegadas: `openid profile email
   offline_access User.Read Mail.Read Mail.Send`. → preencher `MS_OAUTH_CLIENT_ID` + `MS_OAUTH_CLIENT_SECRET`. (Passo a passo em [FASE-0.md](FASE-0.md) §4.1.)
2. **[DBA] Provisionar `OUTLOOK_DSHOW`**: aplicar `sql/outlook_schema.sql` + criar `outlook_app` (não-root) →
   preencher `DB_OUTLOOK_DSHOW_USER/PASS`. (FASE-0.md §4.2.) **Destrava Modelos+Preferências reais sem Azure.**
3. **[Dev] Trocar `OUTLOOK_PROVIDER=mock` → `graph`.**
4. **[Dono] Reload do Service Worker.**
5. **[Dev+Dono] Validar E2E** o caminho real (conectar → listar → abrir → responder → enviar → anexos)
   em conta corporativa e pessoal — o código real nunca rodou contra um Graph vivo.

---

## 11. Pendências (fora do Azure) — para retomar

### Config (dono/DBA)
- Provisionar `OUTLOOK_DSHOW` (destrava features DB-only mesmo antes do Azure).
- Reload do SW; validação visual autenticada (dark+light, responsivo, 3 modos, gráficos, modais).

### Código nosso — NÃO depende do Azure
1. **Editor rico** no compositor (§11.1/§11.2): barra de formatação (negrito/itálico/listas/links/tabelas/
   imagens inline) e colagem do Word. Hoje é `contentEditable` cru.
2. **Autosave de rascunho** (§11.3): ligar `draft`/`update-draft` com debounce + estados Salvando/Salvo.
3. **Sanitização de HTML de saída** (segurança) antes de enviar.
4. **Notificações/badge (§4)**: aplicar as preferências salvas (toast/badge/refresh) e ligar gatilhos.
5. **Modelos e Preferências reais (DB)** — CRUD sobre `outlook_templates`/`outlook_user_preferences`
   (assim que o banco existir; **não precisa de Azure**).
6. **Editar agendamento** (§13) — hoje só cancelar/enviar-agora.
7. **Visualização por conversa** (§6.2) — agrupar por thread.
8. **Modo texto simples** no editor (§11.1) — só HTML hoje.
9. **Testes duráveis** — mover harnesses do scratchpad para `tests/`; incluir o módulo no `check-all`/detector de schema.
10. **Acessibilidade** (ARIA/teclado) — auditar.
11. **Remover `EmBreve.tsx`** (órfão).

### Escopo de fases futuras (por design)
IA (§25, Fase 4) · caixas compartilhadas/enviar-como (§9, Fase 3) · OneDrive/Google Drive (§21) ·
webhooks + delta resiliente (§18, Fase 3) · integração com clientes/propostas (§5, Fase 5) ·
rastreio de abertura/clique · assinaturas institucionais · DLP/retenção/auditoria.

---

## 12. Convenções e armadilhas (lições da construção)

- **Edit como root quebra owner+ACL** → sempre `chown www-data + setfacl` após editar arquivos servidos.
  (Já causou um 500 site-wide ao editar `config/db_connection.php`.)
- **`vite build` deixa `dist/` root:root** → `chown www-data` obrigatório.
- **id de mensagem em query/body, nunca no path** (Graph IDs têm `/`; nginx decodifica `%2F`).
- **CSRF** em `/api/auth/check.php` — o `.php` é obrigatório (senão cai no fallback SPA → 403).
- **Bundle hasheado + manifest no-store** → mudança de bundle não precisa de bump de SW.
- **Coordenação multi-agente**: durante a construção, outros agentes mexeram em `sw.js`/`MEMORY.md`/
  `email-integration`. Sempre reler arquivos compartilhados antes de editar; manter mudanças restritas a
  `api/outlook/` + `panel-outlook/` sempre que possível.
- Backups desta construção em `/backup/outlook-fase0-20260721-184100/`.
