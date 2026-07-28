# 05 — Plano por Fases, Riscos e Aceite

> Todas as fases fazem parte da entrega completa (briefing §47). Ordem pensada para **destravar cedo** (credencial primeiro) e **provar valor** antes de escalar.

## Primeiro entregável construível (destrava tudo)

**Configuração de credencial dinâmica pela app** — porque sem token conectado nada mais busca dado real:
1. Banco `PIPE_DSHOW` + tabela `pipe_accounts` (02).
2. `PipeCrypto` (AES-256-GCM, chave própria) para cifrar o token.
3. `PipedriveClient` mínimo + `POST /api/pipedrive/auth/validate|connect` (valida via `/v1/users/me`).
4. Tela **Configurações** (React) para colar/validar/salvar o token, mostrando empresa/usuário conectados e status.
5. `GET /api/pipedrive/status` alimentando o indicador do header (§7.5).

Com isso você conecta, e o restante das fases passa a ter dado real para trabalhar.

## Fase 0 — Investigação ✅ (concluída)
Ver [00](00-fase0-investigacao.md). Pendências: validar credencial real (depende do seu token), medir volume, e as 4 validações de tenant (04). 

## Fase 1 — Fundação
- 4º banco em `config/db_connection.php` (`PIPE_DSHOW`) + chaves `.env`/`.env.example`; usuário MySQL dedicado.
- Migração DDL (02) aplicada manualmente (`mysql < ...`), revisada com DBA.
- `PipeCrypto` + credencial dinâmica (entregável acima).
- `PipedriveClient` completo (v2/v1, cursor, custo-de-token, backoff, `pipe_api_requests`).
- Módulo backend `api/pipedrive/` (roteador + `_init.php`) + regra nginx `^/api/pipedrive(/.*)?$`.
- Filas (`pipe_sync_*`), `PipedriveSyncService`, `scripts/pipedrive-sync.php` + `/etc/cron.d/pipedrive`.
- Carga inicial (§27.1) + incremental 15min + reconciliação. Webhooks v2 (ou fallback polling documentado).
- Flag `panel_pipedrive_enabled` (piloto = dono) + gate RBAC no backend.
- Tela **Sincronização** + **Logs** (§33) mínimas para observar a carga.

## Fase 2 — Núcleo gerencial
- Scaffold React `panel-pipedrive` (clone de `panel-datatables`), roteamento por segmentos, registro no shell, repontar `panel-paths.js`, ligar botões header/sidebar.
- Visão Geral: Big Numbers (§10) + gráficos (§11, ECharts lazy) + seleção de período + comparações.
- Telas Negócios / Pessoas / Organizações / Usuários / Equipes / Funis / Etapas / Atividades (DataGrid + detalhe/drawer + Kanban read-only de negócios).

## Fase 3 — Entidades complementares
- Leads, Produtos, Notas (sanitizadas), E-mails (**conforme decisão §04.7**), Campos Personalizados (nomes reais §22), Calendário de atividades (FullCalendar ou equivalente, read-only), Duplicidades (§13.4/§14.4), detalhes completos + timeline do negócio.

## Fase 4 — Inteligência e integração
- Alertas comerciais (§35) com dedup/cooldown; alertas técnicos (§34).
- **Cruzamento com ERP** (§36): investigar campos comuns (CNPJ/CPF/e-mail/ID) nos bancos `DSHOW_PROD`/`INTEGRACAO`; `pipe_entity_links` + níveis de confiança; visões negócio↔cliente (consulta apenas).
- Rankings, previsões, relatórios, exportações (fila §37.4), relatórios agendados (§38).

## Fase 5 — Estabilização
Performance (§32), segurança (§45/§49.5), responsividade (§41), testes (§49), documentação (§50), monitoramento em produção.

## Decisões pendentes do dono

| # | Decisão | Recomendação |
|---|---|---|
| 1 | **E-mails (§04.7)** — cobertura possível é limitada ao dono do token | Começar com **(a) só o dono do token**; reavaliar OAuth-por-usuário depois. **[VALIDAR no tenant primeiro]** |
| 2 | Componentes React: promover a `_shared` ou duplicar de `panel-datatables` | **Promover a pacote compartilhado** (evita divergência entre os dois módulos) |
| 3 | Reversibilidade de migração (§48) | Seguir o **padrão idempotente atual** do repo (não inventar up/down) |
| 4 | RBAC: `level:NN` vs chaves `pipedrive.*` | `level:NN` + trigger UARPS (padrão vigente); chaves `pipedrive.*` só se quiser granularidade fina |
| 5 | Cripto: reusar `DtCrypto` ou `PipeCrypto` próprio | **`PipeCrypto` + `PIPEDRIVE_CRYPTO_KEY`** (isolar segredo) |
| 6 | Plano do Pipedrive (define orçamento de token) | Informar o plano para dimensionar a carga inicial |

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Mail single-user quebra §17 | Decidir escopo antes de codar e-mail (§04.7) |
| Deleção some em 30 dias | Webhook `deleted.*` + `?status=deleted` no polling |
| `vite build` como root → painel não monta | `chown -R www-data:www-data dist` após build (passo manual — automatizar em `scripts/`) |
| Estouro de orçamento de token na carga inicial | v2 sempre, `limit=500`, dimensionar ao plano, throttle por headers |
| Schema drift (histórico do projeto) | DDL idempotente + `raw_payload` guarda campos ainda não mapeados |
| Webhook banido (3 dias sem 2XX) | Reconciliação por polling é a rede de segurança, nunca depender só de webhook |

## PNR / Go-live (§48, e Protocolo de Não-Regressão do projeto)

- Backup obrigatório em `/backup/` antes de cada alteração; `node --check`/`tsc` conforme o caso.
- Feature flag com **kill-switch** (`is_enabled=0`) para desativação imediata.
- Rotas protegidas (auth + permissão no backend, não só ocultar botão).
- Migrações idempotentes e aditivas (sem DROP em tabela com dado).
- Aditivo: não quebrar contratos existentes; `api/status/pipedrive.php` (stub atual) pode continuar respondendo enquanto o novo `status` sobe.
- Validação só pelo dono até aceite formal (§48/§51.25).

## Critérios de aceite (§51/§52)
Os 25 critérios do §51 e os SLAs do §52 permanecem como definição de "pronto". Marcos verificáveis por fase acima; nenhum é liberado a outros usuários antes do aceite do dono.
