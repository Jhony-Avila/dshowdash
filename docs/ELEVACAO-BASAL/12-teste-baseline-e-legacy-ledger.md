# Elevação Basal — 12 · Test Baseline + Legacy Ledger inicial (M2)

## Parte A — Baseline de testes

### Inventário real (evidência §9 + repo)

| Grupo | Quantidade | Governança |
|---|---|---|
| Suíte Avatar Studio (`scripts/avatar/testes/`) | 133 casos, runner próprio (~15 min) | RASTREADA, madura |
| Provas E2E Pipedrive (`tools/screenshot/valida-pipedrive-*`) | 50 arquivos | RASTREADA (entrou com EB-008) |
| Smokes Koala (`scripts/koala-smoke-all.*`) | 2 | RASTREADA |
| Smoke GA (`scripts/ga-smoke-all.sh`) | 1 | RASTREADA |
| Testes basais do restante da aplicação | **1** (`tests/api-navigation-test.php`, fora do Git) | NÃO RASTREADO |

Nota: o find do coletor listou screenshots `.jpg` de `/storage` (runtime do bot de
thumbnails) — não são testes; excluídos do baseline.

### Lacuna basal (ratifica BASAL-010)

Bootstrap, router, auth, sessão, shell, navegação e carregamento de painéis (invariante
I11) têm **zero** testes automatizados. Consequência operacional imediata: nenhuma
mudança nas fundações antes de characterization tests proporcionais (§1606).

### Metas M2→M10

1. M2: characterization tests mínimos das jornadas críticas — boot, login, navegação entre 2 painéis, chamada API autenticada, logout (§1605) — reutilizando a infraestrutura Playwright já existente (`tools/screenshot/auth.mjs` + harness avatar).
2. M10: ratchet — cobertura basal só aumenta; nenhum lote pode reduzi-la.

## Parte B — Legacy Ledger inicial

> Registro central de candidatos a legado. Nenhuma ação abaixo de E3; remoção só E4
> (doc 04). Entradas nascem aqui e só saem com decisão EB-# registrada.

| # | Item | Classe | Evidência atual | Próximo passo |
|---|---|---|---|---|
| LL-01 | Vhost `dshowdash-v3` (porta 8080, root inexistente) | LEGACY_CANDIDATE | E2 (404 comprovado; root inexistente) | M1: checar consumidores (cloudflared/monitoração) → desativar |
| LL-02 | `public/react/` (7 arquivos, 0 rastreados, dist "ok?") | LEGACY_CANDIDATE | E0–E1 | M2: grep de consumidores + análise dinâmica (Parte 2 §63) |
| LL-03 | `public/app/` (runtime sombra, 32 arquivos) | ACTIVE_UNGOVERNED / SHADOW | E0 — ATIVO (router carregado no boot) | NÃO é removível; consolidação Parte 8 (ADR-001) |
| LL-04 | `.patch` público citado no briefing §3.7 | LEGACY_CANDIDATE | não localizado (find prof. 3) | busca completa; se inexistente, fechar questão 21 |
| LL-05 | 34 dists DEFASADOS das fundações | ACTIVE_GENERATED defasado | E-n/a (ativos!) | M5: reconstruir na ordem do grafo de boot — JAMAIS remover |
| LL-06 | `MIGRATION_STATUS.md` (180 KB na raiz) | LEGACY_CANDIDATE (doc) | E0 | questão 11: doc vivo ou arquivo histórico? |
| LL-07 | Portas locais 20241/37865 sem dono conhecido | SENSITIVE? | E0 | M1: identificar processos (questão 18) |

Regra de ouro herdada do projeto: **nada é deletado — tudo vai para `/backup` com
timestamp** (640+ entradas hoje comprovam o mecanismo em uso).
