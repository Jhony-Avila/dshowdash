# ADR-010 · Política de compatibilidade e quarentena

**Status**: PENDENTE · **Prazo**: M13 (quarentena) / M14 (remoção)

## Contexto
O legado será aposentado por estrangulamento (doc 01, princípio 9). Já existe regra
operacional consolidada no projeto: nada é deletado; tudo vai para `/backup` (raiz do
servidor) com timestamp + `revert-all.sh`. Falta formalizar o ciclo de quarentena e o
vínculo com a escala E0–E4.

## Opções
1. **Quarentena via `/backup` + registro no legacy-ledger** (arquivo movido, entrada com evidência E3+, janela de observação, rollback = mover de volta).
   Vantagens: usa mecanismo já existente e confiável do projeto. Riscos: `/backup` fora do Git — o ledger versionado precisa ser fiel.
2. **Quarentena via branch/pasta `quarantine/` versionada**.
   Vantagens: histórico no Git. Riscos: cria árvore paralela (tensão com proibição de terceira árvore concorrente).
3. **Feature-flag de desligamento antes da retirada física** (arquivo permanece, caminho desativado).
   Vantagens: rollback instantâneo; telemetria de uso. Riscos: nem todo legado tem ponto de flag.

## Decisão provisória
Combinação 3→1: onde houver ponto de corte, desligar por flag e medir (E3→E4); em
seguida, retirada física via `/backup` com entrada obrigatória no legacy-ledger
(M2 cria o ledger). Janela mínima de observação e rollback testado antes de declarar
`REMOVABLE`. Remoção definitiva (esvaziar `/backup`) só no M14 com autorização explícita.

## Evidência necessária
legacy-ledger operante; primeiro ciclo completo (flag → quarentena → janela → decisão)
documentado; `revert-all.sh` testado no ciclo.
