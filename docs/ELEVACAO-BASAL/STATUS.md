# Elevação Basal — STATUS do programa

> Atualizado: 2026-08-10. Baseline: commit `86467a1a` (tag `basal-baseline-2026-08-10`).
> Fonte viva do estado; ler primeiro ao retomar.

## Marcos

| Marco | Estado | Ondas |
|---|---|---|
| M0 — Congelamento da dívida nova | **CONCLUÍDO** | Onda 1 |
| M1 — Contenção P0 | **CONCLUÍDO** (EB-018) | Ondas 2–6 |
| M2 — Baseline técnica + funcional | **EM ANDAMENTO** (mapas prontos; falta characterization tests) | Onda 2 (parcial) |
| M3 — Fonte da verdade do repo | pendente | — |
| M4 — Toolchain/workspaces | pendente | — |
| M5 — Build reproduzível | pendente (destrava blindagem `.ts`) | — |
| M6 — Bootstrap/runtime canônico | pendente | — |
| M7–M15 | pendente | — |

## O que já mudou em produção (via ondas)

- Vhost órfão `:8080` desativado (symlink → `/backup`).
- `.patch` resíduo quarentenado + regra `deny .patch` no Nginx.
- phpMyAdmin restrito a `127.0.0.1` + `187.15.86.187`.
- Cloudflare purgado após cada mudança.
- Nenhuma mudança tocou o runtime da aplicação (home/bundle/health sempre `200`).

## Riscos P0 — todos endereçados

Ver `03-registro-de-riscos.md`. Destaques: BASAL-001/002/003 (governança/reprodutibilidade)
são o núcleo dos M3–M5; BASAL-004 (`.ts` em runtime) adiado para M5/M6 com causa-raiz provada.

## Próximo passo — M2

1. **Characterization tests** das jornadas críticas (§1605): boot, login, navegação entre painéis, chamada de API autenticada, persistência, logout — reusando `tools/screenshot/auth.mjs` + Playwright/Chromium já no repo. Protegem o comportamento atual antes de qualquer refatoração (M3+).
2. **Baseline funcional** registrada (comportamento observado por jornada).
3. Fecha o Gate 2 (proteção) que autoriza os marcos de consolidação.

> Validação visual/autenticada das jornadas é sempre do Jhony.

## Como retomar

Um "prossiga" continua do M2. Docs: `00`–`07` (contrato), `10`–`12` (baseline técnica),
`20` (M1), este `STATUS`. Scripts: `scripts/basal/*.sh`. Entrega por bloco único no SSH.
