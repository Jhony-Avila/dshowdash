# Elevação Basal — 04 · Modelo de Classificação e Escala de Evidência

> Toda área relevante recebe **exatamente uma** classificação operacional.
> Nenhuma remoção ocorre abaixo de evidência **E4**.

## 1. Classificações operacionais

| Classe | Definição | Ação permitida |
|---|---|---|
| `ACTIVE_SOURCE` | Fonte canônica versionada que recebe alterações | Editar normalmente |
| `ACTIVE_GENERATED` | Artefato usado pelo runtime, produzido de fonte conhecida | Regenerar via build; nunca editar |
| `ACTIVE_UNGOVERNED` | Ativo, mas ignorado/não rastreado/sem geração comprovada — **condição crítica e temporária** | Governar (M3) ou provar derivação (M5) |
| `SHADOW_SOURCE` | Fonte paralela da mesma responsabilidade, não oficial | Congelar edição; migrar consumidores |
| `COMPATIBILITY_LAYER` | Bridge/adapter/alias/fallback necessário na migração | Manter com owner+prazo+condição de remoção |
| `LEGACY_CANDIDATE` | Sinais de legado sem evidência suficiente | Investigar (subir na escala E) |
| `QUARANTINE_READY` | Sem consumidores conhecidos; análise estática+dinâmica concluída | Preparar quarentena |
| `QUARANTINED` | Fora do caminho ativo, preservado recuperável (→ `/backup` com timestamp) | Observar janela |
| `REMOVABLE` | Quarentena concluída sem regressão, com autorização | Remover (mover a `/backup`, nunca delete direto) |
| `SENSITIVE_INFRASTRUCTURE` | Contém/controla credenciais, auth, sessão, banco, deploy, rede, cripto, dados pessoais, integrações | Tratamento adicional; nunca em relatório/commit sem sanitização |

## 2. Escala de evidência para remoção

| Nível | Base | Autoriza |
|---|---|---|
| **E0** — suspeita nominal | nome, localização, idade, comentário | NADA |
| **E1** — análise estática | nenhum import/referência direta encontrada | nada (imports dinâmicos existem) |
| **E2** — build e registries | fora de entrypoints, manifests, registries, outputs | apenas aprofundamento |
| **E3** — runtime | não carregado em cenários representativos; ausente de telemetria/logs/rede | quarentena controlada |
| **E4** — canário + janela | fora do runtime em rollout controlado, sem regressão, rollback disponível | **remoção** |

## 3. Classificação inicial das áreas (provisória — não autoriza ação)

| Área | Classe provisória | Evidência |
|---|---|---|
| `app/` | `SHADOW_SOURCE` (candidata a `ACTIVE_SOURCE` — ADR-001) | build raiz aponta pra ela; Nginx não a serve |
| `public/app/` | `ACTIVE_UNGOVERNED` (runtime sombra) | 0 rastreados; router/entrypoints usados pelo runtime |
| `public/index.html` | `ACTIVE_SOURCE` (entrypoint real) | rastreado; carregado pelo Nginx |
| `public/**/dist` | `ACTIVE_GENERATED` sem prova de geração → tratar como `ACTIVE_UNGOVERNED` | ignorados; fonte de 74+ deps do boot |
| `public/components/**/*.ts` | `ACTIVE_SOURCE` provável | rastreados; base dos bundles |
| `api/` (parte rastreada) | `ACTIVE_SOURCE` | 87 arquivos |
| `api/` (parte ignorada, ~444) | `ACTIVE_UNGOVERNED` | backend ativo invisível |
| `public/api` | `COMPATIBILITY_LAYER` provável (alias/symlink) | confirmar via coletor |
| `public/bootstrap-v2/`, `public/core/`, `public/platform/`, `public/modules/` | `ACTIVE_UNGOVERNED` | 0 rastreados; participam do boot |
| `public/react/` | `LEGACY_CANDIDATE` + `ACTIVE_UNGOVERNED` | 0 rastreados; papel a confirmar (Parte 2 §63) |
| Koala (`public/koala/`, `api/koala/`, `sql/koala/`) | `ACTIVE_SOURCE` | origem do repo; governado |
| `.patch` público | `LEGACY_CANDIDATE` com trilha rápida (briefing §11) | comprovar ausência de consumidor → E3 acelerado |

## 4. Regras de uso

- Classificar **antes** de tocar; reclassificar exige evidência nova registrada no doc 05.
- `ACTIVE_UNGOVERNED` é sempre transitório: cada item recebe plano (governar OU provar derivação) com marco alvo.
- Área `SENSITIVE_INFRASTRUCTURE` acumula com qualquer outra classe (ex.: `api/auth` = `ACTIVE_SOURCE` + `SENSITIVE_INFRASTRUCTURE`).
