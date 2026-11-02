# BRIEFING — MIGRAÇÃO JS → TypeScript — public/core/
# Projeto DShowDash | Agent_01

**Data:** 2026-02-25
**Versão:** 2.0.0
**Briefing anterior:** BRF-MIGRACAO-JS-PARA-TS.md (app/ — 90 arquivos ✅ CONCLUÍDO)
**Executor:** agent_01 (Claude Code)
**Status:** PRONTO PARA EXECUÇÃO

---

## 1. OBJETIVO

Migrar 228 arquivos `.js` para `.ts` em `/var/www/dshowdash/public/core/`, excluindo 9 bundles em `dist/`. Aproveitar a infraestrutura TS + Vite já instalada na Fase 0 do briefing anterior.

---

## 2. INVENTÁRIO

| Subpasta | Arquivos | Complexidade | Descrição |
|----------|----------|-------------|-----------|
| runtime/events/ | 83 | Baixa | Catálogos de eventos (constantes + exports) |
| runtime/constants/ | 23 | Baixa | Constantes do sistema |
| ui-orchestrator/ | 42 | Média-Alta | Orquestrador de UI (registry, bridges, canvas) |
| js/ | 26 | Média | Event-bus, asset-loader, enterprise-loader, ready-flags |
| kernel/ | 20 | Alta | Feature-registry, health-aggregator, telemetry-emitter |
| auth/ | 10 | Média | Auth-orchestrator, permissions, policies, bridges |
| navigation/ | 7 | Média | Navegação |
| policies/ | 7 | Média | Políticas do sistema |
| runtime/ (raiz + outros) | 8 | Média | Ports, enterprise, health, contracts |
| services/ | 1 | Baixa | Toast service |
| utils/ | 1 | Baixa | Utilitários |
| validation/ | 1 | Média | Validador (553L) |
| **TOTAL** | **228** | | |

**EXCLUÍDOS (9 bundles — NÃO MIGRAR):**
- `kernel/dist/kernel.bundle.js`
- `kernel/ui/dist/kernel-ui.bundle.js`
- `runtime/dist/runtime.bundle.js`
- `runtime/events/catalog/dist/events-catalog.bundle.js`
- `auth/dist/auth.bundle.js`
- `js/event-bus/dist/event-bus.bundle.js`
- `js/enterprise-loader/dist/enterprise-loader.bundle.js`
- `js/asset-loader/dist/asset-loader.bundle.js`
- `ui-orchestrator/dist/ui-orchestrator.bundle.js`

---

## 3. PRÉ-REQUISITOS

### 3.1 Atualizar tsconfig.json

Adicionar `public/core/` ao include:

```bash
# O tsconfig.json já existe em /var/www/dshowdash/tsconfig.json
# Atualizar o include para cobrir public/core/
```

No tsconfig.json, o `include` deve conter:
```json
"include": [
  "app/**/*.ts",
  "app/**/*.tsx",
  "app/**/*.js",
  "public/core/**/*.ts",
  "public/core/**/*.js",
  "public/**/*.d.ts"
]
```

E adicionar ao `exclude`:
```json
"exclude": [
  "node_modules",
  "dist",
  "**/dist/**",
  "backup",
  "storage"
]
```

### 3.2 Atualizar externals.d.ts

Os arquivos de `public/core/` importam de `/components/*`, `/bootstrap-v2/*`, `/config/*`, `/assets/*`. Verificar se o `externals.d.ts` já cobre esses módulos. Se não, adicionar declare modules conforme necessário.

### 3.3 Validar estado atual

```bash
cd /var/www/dshowdash && npx tsc --noEmit 2>&1 | tail -3
```

Deve retornar 0 erros (herança do briefing anterior).

---

## 4. FASES DE MIGRAÇÃO

### FASE 9 — runtime/events/catalog/ (CATÁLOGOS DE EVENTOS)
**Prioridade:** MÁXIMA — são arquivos simples de constantes, maior ganho com menor risco.
**Estimativa:** ~70 arquivos (inclui catalog/, ci/, payloads/)

**Padrão típico desses arquivos:**
```javascript
export const AUTH_EVENTS = Object.freeze({
  LOGIN_SUCCESS: 'auth:login:success',
  LOGIN_FAILURE: 'auth:login:failure'
});
```

**Conversão:**
```typescript
export const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'auth:login:success',
  LOGIN_FAILURE: 'auth:login:failure'
} as const;

export type AuthEvent = typeof AUTH_EVENTS[keyof typeof AUTH_EVENTS];
```

Incluir nesta fase:
- Todos os `catalog/*.events.js` → `.ts`
- `events/namespaces.js` → `.ts`
- `events/validate.js` → `.ts`
- `events/listeners-registry.js` → `.ts`
- `events/index.js` → `.ts` (barrel deprecated — manter compatibilidade)
- `events/ci/*.js` → `.ts`
- `events/payloads/*.js` → `.ts`

**NÃO migrar:** `events/catalog/dist/events-catalog.bundle.js`

### FASE 10 — runtime/constants/ (CONSTANTES)
**Prioridade:** ALTA — constantes do sistema, migração trivial.
**Estimativa:** 23 arquivos

Mesmo padrão: `Object.freeze` → `as const` + type derivado.

### FASE 11 — runtime/ (raiz + enterprise + health + ports + contracts + permissions)
**Prioridade:** ALTA — complementa as Fases 9-10.
**Estimativa:** ~8 arquivos

Incluir:
- `runtime/enterprise/*.js` → `.ts`
- `runtime/health/*.js` → `.ts`
- `runtime/ports/*.js` → `.ts`
- `runtime/contracts/*.js` → `.ts`
- `runtime/permissions/permission-resolver.js` → `.ts` (618L — arquivo grande, tipar cuidadosamente)

**NÃO migrar:** `runtime/dist/runtime.bundle.js`

### FASE 12 — auth/ (AUTENTICAÇÃO)
**Prioridade:** ALTA — segurança se beneficia de tipagem forte.
**Estimativa:** 10 arquivos

Incluir:
- `auth/auth-orchestrator/*.js` → `.ts`
- `auth/adapters/*.js` → `.ts`
- `auth/bridges/*.js` → `.ts`
- `auth/contracts/*.js` → `.ts`
- `auth/permissions/*.js` → `.ts`
- `auth/policies/*.js` → `.ts`

**NÃO migrar:** `auth/dist/auth.bundle.js`

### FASE 13 — js/ (EVENT-BUS, LOADERS, READY-FLAGS)
**Prioridade:** MÉDIA — infraestrutura compartilhada.
**Estimativa:** 26 arquivos

Incluir:
- `js/event-bus/*.js` → `.ts`
- `js/enterprise-loader/*.js` → `.ts`
- `js/asset-loader/*.js` → `.ts`
- `js/ready-flags/*.js` → `.ts`

**NÃO migrar:** bundles em `*/dist/`

### FASE 14 — kernel/ (KERNEL DO SISTEMA)
**Prioridade:** MÉDIA-ALTA — arquivos complexos e grandes.
**Estimativa:** 20 arquivos

Arquivos grandes que requerem atenção especial:
- `kernel/feature-registry.js` (916L) — tipar interfaces de Feature, Registry
- `kernel/feature-manifest.js` (508L) — tipar manifest entries
- `kernel/health-aggregator.js` (470L) — tipar HealthResult, AggregatedHealth
- `kernel/telemetry-emitter.js` (572L) — tipar TelemetryEvent, Span
- `kernel/runtime-consumer.js` (461L) — tipar RuntimeContext consumer

**NÃO migrar:** `kernel/dist/kernel.bundle.js`, `kernel/ui/dist/kernel-ui.bundle.js`

### FASE 15 — ui-orchestrator/ (ORQUESTRADOR DE UI)
**Prioridade:** MÉDIA — maior subpasta depois de runtime.
**Estimativa:** 42 arquivos

Incluir:
- `ui-orchestrator/core/*.js` → `.ts`
- `ui-orchestrator/registry/*.js` → `.ts`
- `ui-orchestrator/adapters/*.js` → `.ts`
- `ui-orchestrator/bridges/*.js` → `.ts`
- `ui-orchestrator/canvas/*.js` → `.ts`
- `ui-orchestrator/components/*.js` → `.ts`
- `ui-orchestrator/telemetry/*.js` → `.ts`
- `ui-orchestrator/utils/*.js` → `.ts`

**Atenção:** `registry/manifest-generated.js` (799L) — pode ser arquivo gerado automaticamente. Verificar antes de migrar. Se for gerado, NÃO migrar.

**NÃO migrar:** `ui-orchestrator/dist/ui-orchestrator.bundle.js`

### FASE 16 — navigation/ + policies/ + services/ + utils/ + validation/
**Prioridade:** MÉDIA — arquivos restantes.
**Estimativa:** 17 arquivos

Incluir:
- `navigation/*.js` → `.ts` (7 arquivos)
- `policies/*.js` → `.ts` (7 arquivos)
- `services/*.js` → `.ts` (1 arquivo — toast-service)
- `utils/*.js` → `.ts` (1 arquivo)
- `validation/validate.js` → `.ts` (553L — tipar regras de validação)

---

## 5. TOTAIS

| Fase | Área | Arquivos | Complexidade |
|------|------|----------|-------------|
| 9 | runtime/events/ | ~70 | Baixa |
| 10 | runtime/constants/ | 23 | Baixa |
| 11 | runtime/ (raiz) | ~8 | Média |
| 12 | auth/ | 10 | Média |
| 13 | js/ | 26 | Média |
| 14 | kernel/ | 20 | Alta |
| 15 | ui-orchestrator/ | 42 | Média-Alta |
| 16 | navigation + policies + misc | 17 | Média |
| **TOTAL** | | **~228** | |

---

## 6. PROTOCOLOS OBRIGATÓRIOS

Todos os protocolos do briefing v1.0.0 se aplicam:

### 6.1 Backup Obrigatório
```bash
FASE="fase_N"
TS=$(date +"%Y%m%d_%H%M%S")
mkdir -p /backup/ts_migration_core_${FASE}_${TS}
cp -r /var/www/dshowdash/public/core/<subpasta> /backup/ts_migration_core_${FASE}_${TS}/
```

### 6.2 Processo por Arquivo
1. Backup do original
2. Ler arquivo completo
3. Renomear `.js` → `.ts`
4. Adicionar tipos
5. Validar `npx tsc --noEmit`
6. Verificar imports de consumidores
7. Registrar em `/home/agent_01/logs/ts-migration.log`

### 6.3 Regras de Tipagem
- NÃO usar `any` — preferir `unknown`
- `Object.freeze` → `as const` + type derivado
- Criar interfaces para objetos complexos
- Union types para strings limitadas
- Usar o `events-contracts.ts` do `app/` como referência canônica para `declare global { Window }`
- NÃO criar `declare global` duplicados — se precisar de novos tipos Window, adicionar ao canônico `app/events/events-contracts.ts`

### 6.4 Bundles/dist
- NUNCA migrar arquivos em `*/dist/*.bundle.js`
- Esses são gerados e serão regenerados após a migração

### 6.5 Arquivos gerados
- Verificar se `manifest-generated.js` e similares são gerados automaticamente
- Se sim, NÃO migrar — adicionar ao exclude do tsconfig

### 6.6 Mover .js.migrated
- Ao final de cada fase, mover quaisquer `.js.migrated` para `/backup/`
- Não deixar resíduos no diretório de produção

---

## 7. VALIDAÇÃO POR FASE

```bash
# 1. TypeScript check
cd /var/www/dshowdash && npx tsc --noEmit 2>&1 | tail -5

# 2. Contagem de progresso
TS_COUNT=$(find /var/www/dshowdash/public/core -name "*.ts" -not -path "*/dist/*" | wc -l)
JS_COUNT=$(find /var/www/dshowdash/public/core -name "*.js" -not -path "*/dist/*" | wc -l)
echo "Core TS: $TS_COUNT | JS restante: $JS_COUNT"

# 3. Limpar resíduos
find /var/www/dshowdash/public/core -name "*.js.migrated" -exec mv {} /backup/ \;

# 4. Log
echo "[$(date -Iseconds)] Fase N concluída - $TS_COUNT arquivos TS em core/" >> /home/agent_01/logs/ts-migration.log
```

---

## 8. ORDEM DE EXECUÇÃO

```
FASE 9 (events/catalog) → FASE 10 (constants) → FASE 11 (runtime raiz) →
FASE 12 (auth) → FASE 13 (js) → FASE 14 (kernel) →
FASE 15 (ui-orchestrator) → FASE 16 (misc)
```

**Pode usar subagentes em paralelo para Fases 9+10 (ambas são constantes/catálogos triviais).**
**Pode usar subagentes em paralelo para Fases 15+16.**

---

## 9. COMANDO PARA INICIAR

```bash
su - agent_01 -c "cd /var/www/dshowdash && claude --dangerously-skip-permissions"
```

Mensagem:
```
Leia o briefing /var/www/dshowdash/docs/BRF-MIGRACAO-JS-PARA-TS-CORE.md — esta é sua continuação da migração TS. As Fases 0-8 (app/) estão concluídas. Execute as Fases 9-16 (public/core/) sequencialmente sem parar e sem pedir autorização. Primeiro atualize o tsconfig.json para incluir public/core/. Faça backups em /backup/ antes de cada fase. NÃO migre arquivos em */dist/*.bundle.js. Mova .js.migrated para /backup/ ao final de cada fase. Registre progresso em /home/agent_01/logs/ts-migration.log. Comunique-se sempre em português. Comece agora.
```

---

## 10. ESCOPO FUTURO (PÓS core/)

Após conclusão deste briefing:
1. `public/platform/` — 52 arquivos
2. `public/bootstrap-v2/` — 208 arquivos
3. `public/components/` — 5.548 arquivos (briefing dedicado com batches)

---

**FIM DO BRIEFING — MIGRAÇÃO JS → TypeScript v2.0.0 — public/core/**

*Documento gerado em: 2026-02-25*
*Status: PRONTO PARA EXECUÇÃO*
*Localização: /var/www/dshowdash/docs/BRF-MIGRACAO-JS-PARA-TS-CORE.md*
