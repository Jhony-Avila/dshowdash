# Elevação Basal — STATUS do programa

> Atualizado: 2026-08-10. Baseline: commit `86467a1a` (tag `basal-baseline-2026-08-10`).
> Fonte viva do estado; ler primeiro ao retomar.

## Marcos

| Marco | Estado | Ondas |
|---|---|---|
| M0 — Congelamento da dívida nova | **CONCLUÍDO** | Onda 1 |
| M1 — Contenção P0 | **CONCLUÍDO** (EB-018) | Ondas 2–6 |
| M2 — Baseline técnica + funcional | **EM ANDAMENTO** (mapas prontos; characterization tests escritos — falta 1º run do Jhony) | Ondas 2, 8 |
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

## Próximo passo — M2 (em andamento)

1. **Characterization tests ESCRITOS** (Onda 8): `tools/screenshot/basal-caracterizacao.mjs`
   — 8 jornadas read-only (boot, auth, shell, navegação, API, persistência-leitura,
   recuperação de erro, logout). Doc: `30-baseline-funcional-m2.md`.
2. **Falta**: Jhony rodar `node basal-caracterizacao.mjs` no servidor (precisa da
   sessão autenticada do bot) → gera `evidencias/baseline-funcional-<data>.json` +
   screenshots `basal-*.png` p/ validação visual. Ele cola a saída / commita o JSON.
3. Com o baseline capturado, o M2 fecha e o Gate 3 (proteção) autoriza o M3.

> Validação visual/autenticada das jornadas é sempre do Jhony.

## Como retomar

Um "prossiga" continua do M2. Docs: `00`–`07` (contrato), `10`–`12` (baseline técnica),
`20` (M1), este `STATUS`. Scripts: `scripts/basal/*.sh`. Entrega por bloco único no SSH.
