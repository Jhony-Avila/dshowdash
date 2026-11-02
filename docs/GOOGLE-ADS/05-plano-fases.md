# 05 — Plano por Fases, Riscos e Aceite

> As 6 fases do briefing (§45) mapeadas ao repo. Ordem pensada para **destravar cedo** (mock destrava
> a UI inteira sem depender do Google) e **provar valor** antes de escalar. Todas fazem parte da entrega
> completa; nenhum marco é liberado a outros usuários antes do aceite do dono (§46/PNR).

## Primeiro entregável construível (destrava tudo) — mock-first

**O painel `panel-ads` completo em modo mock**, porque o developer token do Google é provisionamento-dono
e pode demorar. Sequência:
1. `ADS_PROVIDER=mock` no `.env` + `ads_is_mock()` + curto-circuito em `api/ads/index.php` (molde Outlook).
2. `AdsMock` (fixtures determinísticas pt-BR: 2 contas, ~15 campanhas, grupos, anúncios, palavras, termos, métricas por dia/hora, conversões, recomendações) em `$_SESSION`.
3. `api/ads/` roteado (molde `api/pipedrive/index.php`) respondendo todas as rotas do §04 pelo mock.
4. `panel-ads` React (clone `panel-datatables`): seletor de contas, Visão Geral (Big Numbers §7 + gráficos ApexCharts), Campanhas/Grupos/Anúncios/Palavras/Termos em DataGrid, dark/light.
5. `GET /api/ads/status` (`provider:'mock'`) alimenta o selo "🧪 Modo de testes" e o indicador do header (reusando `panel-adwords`).

Com isso o dono **valida visualmente 100% da experiência** enquanto o acesso real é provisionado em paralelo.

## Fase 0 — Investigação ✅ (concluída)
Ver [00](00-fase0-investigacao.md). Pendências: developer token + MCC (dono), contas, GA4, chaves de cruzamento CRM, e as 6 validações de tenant (04).

## Fase 1 — Fundação e leitura (briefing §45 Fase 1) — **mock primeiro, real depois**
- 6º banco em `config/db_connection.php` (`ADS_DSHOW`) + chaves `.env`/`.env.example`; usuário MySQL `ads_app` (não-root).
- Migração DDL (02) aplicada manualmente (`mysql < ...`), revisada com DBA (atenção a particionamento de `ads_metrics_*`/`ads_search_terms`).
- `AdsCrypto` (AES-256-GCM, chave `ADS_CRYPTO_KEY`).
- Módulo backend `api/ads/` (roteador + `_init.php` + provider mock) + regra nginx `^/api/ads(/.*)?$`.
- **Mock completo** (entregável acima) + `panel-ads` scaffold com seletor de contas, Visão Geral, Campanhas/Grupos/Anúncios/Palavras/Termos, DataGrids, dark/light, comparativos de período (§8).
- **Real (destravado pelo dono):** `GoogleAdsClient` (OAuth2 + developer token + GAQL + rate-limit), OAuth (connect/callback/select), `AdsSyncService`, `scripts/ads-sync.php` + `/etc/cron.d/ads`, carga inicial + incremental (métricas por data + `change_status`) + reconciliação. Flag `panel_ads_enabled` (piloto=dono) + gate RBAC no backend. Troca `ADS_PROVIDER=mock→google`.

## Fase 2 — Analytics e páginas (§45 Fase 2)
- GA4 (Data API) + Landing Pages (§16) com CWV/velocidade; Conversões (§23); Dispositivos (§19); Localizações (§20, mapas D3/ApexCharts); Horários/dias (§21, matriz dia×hora); Públicos (§22); Funis (§16.3/§17.2).
- Diagnóstico de correspondência termo→kw→anúncio→LP→conversão (§16.3).

## Fase 3 — Operação (§45 Fase 3) — **só após aceite; escrita real**
- `mutate` com `validate_only` no preview (§32.5) + confirmação + `ads_change_log` + `ads_approvals`.
- Pausar/ativar, editar orçamento (§24), editar anúncios/palavras, negativas em lote (§15, `partial_failure`), criar campanhas, publicar.
- Auditoria (§34) + rollback (§34.2) + permissões por perfil (§33).

## Fase 4 — Inteligência (§45 Fase 4)
- Alertas (§27) calculados pós-pull (dedup/cooldown); recomendações nativas (`recommendation`) + camada de IA própria (LLM Claude) com estrutura explicável (§26.2); desperdícios/oportunidades; forecast (§39); simulador de orçamento (§24.1, estimativa).

## Fase 5 — Integração comercial (§45 Fase 5) — **encurtada pelo Pipedrive existente**
- Cruzamento com **CRM = módulo Pipedrive (`PIPE_DSHOW`, já validado)** por `GCLID`/UTM → `ads_entity_links`; funil investimento→lead→oportunidade→venda→receita (§18); CAC/ROAS real (separando valor de conversão do Google de receita comercial — §44.8); dashboard da diretoria (§10). ERP (`DSHOW_PROD`/`INTEGRACAO`) por CNPJ/e-mail se aplicável.

## Fase 6 — Ecossistema multicanal (§45 Fase 6)
- Meta/Microsoft/LinkedIn/TikTok Ads sob a mesma abstração de provider + visão consolidada. A arquitetura já nasce preparada (provider plugável, entidades genéricas de métrica).

## Decisões pendentes do dono

| # | Decisão | Recomendação |
|---|---|---|
| 1 | **Developer token + MCC** (destrava o real) | Solicitar **já** o developer token (Basic) no MCC do dono — aprovação pode demorar; mock cobre o intervalo |
| 2 | MCC vs contas avulsas para as 2 contas | **Via MCC** (simplifica `login-customer-id` e auth única) |
| 3 | Escopo da IA (§26): nativa vs LLM própria | **Ambas** — recomendações nativas como base + IA própria para diagnóstico/explicação em linguagem clara |
| 4 | Componentes React: `_shared` vs duplicar | **Promover a pacote compartilhado** (evita divergência entre datatables/pipedrive/outlook/ads) |
| 5 | RBAC: `level:NN` vs chaves `ads.*` | **Chaves `ads.view`/`ads.manage`/`ads.publish`** — casa melhor com os 4 perfis do §33 (mais granular que os outros módulos, mas o §33 pede isso) |
| 6 | Cripto: reusar `DtCrypto` ou próprio | **`AdsCrypto` + `ADS_CRYPTO_KEY`** (isolar segredo por módulo, como Pipe/Outlook) |
| 7 | GA4 (propriedade + escopos) | Informar a propriedade GA4 (Fase 2) |
| 8 | Escrita real (Fase 3) | Liberar `mutate` **só após aceite**; sempre preview + confirmação + auditoria |

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Developer token demora/nega | **Mock-first**: toda a UI é construída e validada sem ele |
| Sem webhooks → "tempo real" não é segundos | SLA = intervalo do incremental (15–30 min); deixar explícito no §40; alertas calculados pós-pull |
| Custo em micros / conversões que retroagem | Normalizar micros; reprocessar janela móvel de dias (UPSERT idempotente por data) |
| `change_event` só 30 dias | Reconciliação estrutural completa **diária** |
| Estouro de operações (Basic) | Relatórios agregados, `SearchStream`, throttle por `ads_api_requests`, priorizar contas ativas |
| Escrita acidental em produção | `validate_only` no preview + confirmação + perfil≥Gestor + auditoria; PAUSE preferível a REMOVE; sem lote sem confirmação extra |
| `vite build` como root → painel não monta | `chown -R www-data:www-data dist` após build (passo manual — automatizar em `scripts/`) |
| Schema drift (histórico do projeto) | DDL idempotente + `raw_payload` guarda campos ainda não mapeados; incluir `ads_*` no detector de schema do `check-all` |
| Edit como root quebra owner+ACL | `chown www-data + chmod + setfacl` após editar `api/ads/`; validar `php -l` |
| PMax com dados parciais | Sinalizar na UI "dados incompletos" (§44.9) para campanhas PMax |

## PNR / Go-live (Protocolo de Não-Regressão do projeto)

- Backup obrigatório em `/backup/` antes de cada alteração; `node --check`/`php -l`/`tsc` conforme o caso.
- Feature flag com **kill-switch** (`is_enabled=0`) para desativação imediata.
- Rotas protegidas (auth + permissão no backend, não só ocultar botão).
- Migrações idempotentes e aditivas (sem DROP em tabela com dado).
- **Aditivo:** não quebrar contratos existentes — `api/status/adwords.php` (stub) e o botão de header `panel-adwords` continuam respondendo enquanto o novo módulo sobe; o repontar de `panel-paths.js` é a única mudança no shell (sem tocar `extractPanelId`).
- Validação só pelo dono até aceite formal.

## Checklist de go-live (real)
1. **[Dono]** Provisionar **developer token** (Basic+) no MCC + confirmar as 2 contas → preencher `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, `GOOGLE_ADS_OAUTH_CLIENT_ID/SECRET` no `.env`.
2. **[DBA]** Aplicar `02-banco-ADS_DSHOW.sql` + criar `ads_app` (não-root) → preencher `DB_ADS_DSHOW_*`.
3. **[Dev]** Trocar `ADS_PROVIDER=mock → google`; rodar carga inicial via `scripts/ads-sync.php --mode=initial`.
4. **[Dono]** Reload do Service Worker + QA visual autenticado (dark+light, DataGrids, gráficos, seletor de contas).
5. **[Dev+Dono]** Validar E2E o caminho real (conectar → sync → dashboard → 1 `mutate` com `validate_only`) antes de liberar escrita.

## Critérios de aceite (§46)
Os 20 critérios do §46 do briefing permanecem como definição de "pronto" (2 contas conectáveis, alternância, indicadores corretos, comparativos, DataGrids robustos, views salvas, dark/light, pausar/ativar, editar orçamento, histórico de alterações, IA explicável, alertas configuráveis, exportação, GA4, cruzamento com leads/vendas, confirmação em ações críticas, separação valor-de-conversão × receita, visão da diretoria). Marcos verificáveis por fase acima.
