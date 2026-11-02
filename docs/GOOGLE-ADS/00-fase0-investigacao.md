# 00 — Fase 0: Investigação (relatório)

> Executada em 2026-07-21 no `srv920234`, projeto `/var/www/dshowdash`. Read-only.
> Objetivo (briefing §45 Fase 1 "Fundação e leitura"): localizar integração/andaimes/banco antigos,
> mapear pontos de reúso e a versão/realidade da API **antes** de qualquer código.

## 1. O que JÁ existe no repositório (apenas andaime de entrada, sob nome legado `adwords`)

O projeto **antecipou** a entrada visual do Google Ads, mas **não há integração real**. E usa a marca antiga **`adwords`**:

| Peça | Caminho | Estado |
|---|---|---|
| Ícone do header | `public/assets/icons/system/header/adwords.svg` | ✅ existe |
| Botão do header | `public/components/header/components/panel-adwords/` | ✅ **módulo completo** (state/store, polling, core/circuit-breaker+lifecycle, telemetry/logger, accessibility) que consulta `api/status/adwords.php` |
| Backend de status | `api/status/adwords.php` | ✅ existe — **stub**: `$isConfigured = false` hardcoded → retorna `not_configured`/`configured:false` (comentário "P2.1 FIX: removido mock data") |
| Alias de rota | `panel-paths.js` → `"google-ads": "panel-12"` | ⚠️ abre o **panel-12 genérico (stub)** |

**Não existe** botão de sidebar, ícone de footer, nem painel analítico para ads.

**Conclusão:** o que foi feito antes é o *indicador de status no header* (consistente com o padrão dos demais integradores — asaas/bling/mercadolivre/pipedrive têm o mesmo). O módulo **Ads Intelligence** propriamente dito (§7 em diante do briefing) é **construção nova**.

### 1.1. Roteamento atual e o repontar futuro (PNR)
- O botão de header `panel-adwords` **continua** consultando `api/status/adwords.php` — **não tocar** (contrato existente).
- O alias `"google-ads" → panel-12` (`public/components/main/adapters/panel-loader/panel-paths.js:77`) será **repontado** para o novo `panel-ads/index.js` na fase de integração de shell — **sem alterar `extractPanelId`** (ponto do shell vetado pelo dono, ver lição do Pipedrive).
- A migração de nomenclatura `adwords`→`ads` é **aditiva**: o novo módulo cria `api/ads/` e `panel-ads`; o andaime legado passa a apontar para eles. Nada é removido nesta rodada.

## 2. O que NÃO existe (≈98% do briefing é greenfield)

- ❌ Banco `ADS_DSHOW` e tabelas `ads_*` — nenhuma existe.
- ❌ Client da Google Ads API, OAuth, developer token. **O `.env` não tem nenhuma chave `ADS_*`/`GOOGLE_ADS_*`** (bancos atuais no `.env`: `DSHOWDASH`, `INTEGRACAO`, `DSHOW_PROD`, `PIPE_DSHOW`, `OUTLOOK_DSHOW`; cripto: `DATATABLES_CRYPTO_KEY`, `PIPEDRIVE_CRYPTO_KEY`, `OUTLOOK_CRYPTO_KEY`).
- ❌ Camada de sincronização, filas, rastreio de mudanças, rate-limit por operações.
- ❌ As 21 telas do menu (§5.1: Visão Geral, Diretoria, Campanhas, Grupos, Anúncios, Palavras-chave, Termos, Landing Pages, Conversões, Públicos, Localizações, Dispositivos, Horários, Orçamentos, Qualidade, Funil, IA, Alertas, Relatórios, Histórico, Config).
- ❌ Integração GA4, cruzamento CRM/ERP, IA, alertas, relatórios, forecast, simulador.
- ❌ **Nenhuma integração/banco/script Google Ads antigo** — `grep -rli "google.ads\|adwords"` no backend só acha `api/status/adwords.php`. `backup/` do módulo está vazio.

## 3. Divergências entre o briefing e a realidade da Google Ads API (para o plano não herdar suposições falsas)

A Google Ads API é **estruturalmente diferente** de um REST simples como o Pipedrive. Estas divergências moldam a arquitetura:

| Briefing assume (implícito) | Realidade da Google Ads API |
|---|---|
| "conectar conta com credencial" (§6) | Exige **OAuth 2.0** (obrigatório) **+ developer token** (obtido de uma conta **MCC/manager**, com **aprovação do Google**: Test → Basic → Standard). Não há "colar um token" simples. **[VALIDAR: nível de acesso do developer token do dono]** |
| §27 "webhooks / alertas em tempo real" (menção implícita) | **A Google Ads API NÃO tem webhooks/push.** Mudanças são obtidas por **pull**: recursos `change_event` (últimos **30 dias**) e `change_status`. Sync = relatórios GAQL agendados. Alertas (§27) são **calculados por nós** após cada pull. |
| "importar métricas" | Métricas vêm por **GAQL** (`GoogleAdsService.SearchStream`) sobre recursos (`campaign`, `ad_group`, `keyword_view`, `search_term_view`, `geographic_view`, `landing_page_view`…) com `metrics.*`/`segments.*`. Custo vem em **micros** (`metrics.cost_micros`; 1 unidade monetária = 1.000.000 micros) — normalizar. |
| "editar/criar campanhas" (§4.3, §32) | Escrita é via **`mutate`** (operations) nos serviços por recurso, com flag **`validate_only=true`** para **pré-visualizar impacto sem aplicar** — casa perfeitamente com o fluxo de confirmação do §32. Orçamento é recurso **separado** (`campaign_budget`). |
| "IA sugere e o usuário aprova" (§26) | O Google já expõe **recomendações nativas** (`recommendation` resource + apply/dismiss). Nossa IA (§26) soma diagnósticos/explicações em linguagem clara por cima. Decidir escopo (README §3). |
| "memória: `chown www-data:www-data dist` após build" | **Passo manual** (não versionado). `vite build` como root deixa `dist/` inservível por www-data — repetir a lição de Pipedrive/Outlook. |
| "permissões granulares por perfil" (§33) | O repo **não** gate por chaves de escopo por padrão; usa **UARPS** (roles/level). Decidir `level:NN` vs chaves `ads.*` (05). |
| §48/§34 "migrações reversíveis / rollback" | O repo **não tem** runner up/down. Reversibilidade praticada = DDL **idempotente e aditivo**. "Rollback" de campanha (§34.2) é feito via **novo `mutate`** restaurando o valor anterior (guardado em `ads_change_log`), não por revert de banco. |

## 4. Versão da API a usar (resumo — detalhe em 04)

- **Google Ads API** (gRPC nativo; REST/JSON disponível) — versionada por trimestre (ex.: `v17`/`v18`/`v19` na virada de 2025/2026), com sunset ~12 meses após lançamento. **[VALIDAR versão corrente no momento da implementação]** — usar a **mais recente estável**.
- **GA4** = **Google Analytics Data API** (`runReport`), API e escopos OAuth **separados** (Fase 2).
- **Regra do plano:** toda leitura de mídia por **GAQL**; toda escrita por **`mutate` + `validate_only` no preview**; mudanças por **`change_event`/`change_status`** (não webhooks).

## 5. Ambiente confirmado (pontos de reúso)

- Servidor **nginx + php8.3-fpm** (PHP 8.3.6). MySQL local em `127.0.0.1`. Redis presente (`config/redis.php` / `RedisHelper`).
- **Banco:** `config/db_connection.php` → `DatabaseManager::initConfigs()` já tem **5 bancos** (`INTEGRACAO`, `DSHOWDASH`, `DSHOW_PROD`, `PIPE_DSHOW`, `OUTLOOK_DSHOW`). Adicionar o **6º = `ADS_DSHOW`** (mesmo padrão). `healthCheck()` cobre a nova conexão automaticamente.
- **Cripto AES-256-GCM** já existe e é clonável: `api/datatables/lib/Crypto.php` (`DtCrypto`, envelope `v1.<iv>.<tag>.<ct>`, `scrub()` mascara segredos em log). Clones por módulo já feitos: `PipeCrypto`, `OutlookCrypto` → criar **`AdsCrypto`** com chave própria `ADS_CRYPTO_KEY`.
- **Provider mock** (molde a copiar): `api/outlook/` faz `outlook_is_mock()` (lê `OUTLOOK_PROVIDER`) + curto-circuito em `index.php` (`OutlookMockController::route()`) **antes** da conexão de banco. Replicar como `ads_is_mock()` + `AdsMockController`.
- **Módulo backend roteado** (molde a copiar): `api/pipedrive/` (18 arquivos) — `index.php` (roteador PATH_INFO) + `_init.php` + `lib/{PipeCrypto,PipedriveClient}` + `services/{Auth,Queue,Reconcile,Sync}` + `controllers/{Auth,Metrics,Query,Status,Sync,Webhook}`. Adaptar (o "Webhook" vira "ChangeTracking", já que Ads não tem webhook).
- **Módulo React** (molde a copiar): `public/components/panels/panel-datatables/`. **DataGrid reutilizável real:** `public/components/panels/panel-datatables/src/components/grid/DataGrid.tsx` (TanStack + virtual) — fonte para clonar/compartilhar (§29).
- **Navegação:** sidebar vem da tabela **`ui_nav_items`** (API `api/ui/navigation.php` + `api/admin/navigation/`) — registrar `sidebar.ads` (como foi feito p/ `sidebar.outlook`/`sidebar.pipedrive`).
- **SW:** `public/sw.js` versiona por bump de `CACHE_NAME` + `bustBundle` (versão atual ~9.3.6x — **conferir o valor corrente antes de bumpar**, lição "avaliar versão antes de bumpar").
- **CRM já disponível:** módulo **Pipedrive** (`PIPE_DSHOW`) é a fonte de leads/oportunidades/vendas para §18/§10 — **encurta a Fase 5**.
- Feature flags: `app_feature_flags` + `app_user_feature_flags`. RBAC: **UARPS** (`api/permissions/`).

## 6. Checklist Fase 0 — status

- [x] Localizar integração/andaime antigo → **só o indicador de status `adwords`** (stub); resto greenfield.
- [x] Localizar banco/scripts antigos → **não há**.
- [x] Identificar versão/realidade da API → OAuth2 + developer token + GAQL + mutate + change_event; **sem webhooks** (04).
- [x] Mapear pontos de reúso (banco, cripto, provider-mock, molde backend/React, nav, SW, CRM Pipedrive) → §5.
- [x] Mapear divergências briefing×API → §3.
- [ ] **Provisionar developer token + MCC** → **pendente-dono** (destrava o "real"; mock não depende disso).
- [ ] Confirmar as 2 contas + método (MCC vs avulso) → **pendente-dono**.
- [ ] Definir propriedade GA4 + escopos → **pendente-dono** (Fase 2).
- [ ] Confirmar chaves de cruzamento com `PIPE_DSHOW`/ERP (GCLID/UTM/CNPJ) → **pendente** (Fase 5).
