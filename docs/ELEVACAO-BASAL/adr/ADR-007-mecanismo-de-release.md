# ADR-007 · Mecanismo oficial de release

**Status**: PENDENTE · **Prazo**: M5 (manifesto) / M11 (pipeline completo)

## Contexto
Deploy atual: push → webhook (`api/deploy/webhook.php`) → runner. Não há release ID,
manifesto, nem artefato imutável; "release" hoje = estado do worktree + dists acumulados.
O programa exige: build once → artefato imutável → release identificável → deploy
atômico → health → rollback (§5 do doc 00).

## Opções
1. **Release = tag Git + manifesto versionado** (release ID, commit, entrypoints, chunks, hashes, toolchain, provenance — §1622), artefato montado em diretório imutável e ativado por symlink switch.
   Vantagens: deploy atômico e rollback por switch; compatível com webhook atual. Riscos: exige build canônico (M5).
2. **Continuar deploy por worktree** (estado atual) com manifesto informativo.
   Vantagens: zero mudança. Riscos: não é imutável nem atômico; não fecha BASAL-003.
3. **Pacotes externos (artefato em storage/registry)**.
   Vantagens: provenance forte. Riscos: infraestrutura nova sem necessidade imediata.

## Decisão provisória
Opção 1 como alvo. Passo já viável antes do M5: gerar manifesto informativo por deploy
(commit + hashes dos bundles ativos) para rastreabilidade (invariante I10), sem mudar o
mecanismo. Switch atômico entra quando o document root virar saída de build (ADR-003).

## Evidência necessária
Manifesto de release gerado e conferido em um deploy real; ensaio de rollback por
symlink em staging; tempo de rollback medido.
