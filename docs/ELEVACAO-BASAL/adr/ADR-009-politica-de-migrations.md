# ADR-009 · Política de migrations

**Status**: PENDENTE · **Prazo**: M9

## Contexto
Multi-database (88+ tabelas em DSHOW_PROD, INTEGRACAO, DSHOW_DASH + dezenas de bases),
`sql/` versionado parcialmente (`sql/koala/`), sem governança central comprovada de
migrations (BASAL-012). Invariante I12: schema só muda por migrations ordenadas e
auditáveis. Parte 13 detalha o alvo.

## Opções
1. **Migrations SQL versionadas + runner próprio leve** (tabela de controle por base, up/down, checksum).
   Vantagens: se adapta ao stack PHP/MySQL atual sem framework novo. Riscos: runner é código próprio.
2. **Ferramenta dedicada (Flyway/Liquibase/Phinx)**.
   Vantagens: maduro, auditável. Riscos: nova ferramenta sem ownership; curva no fluxo atual.
3. **Continuar SQL manual documentado**.
   Vantagens: zero mudança. Riscos: não fecha o invariante; sem ordem nem auditoria.

## Decisão provisória
Regra imediata (M0): nenhuma mudança de schema sem arquivo SQL versionado em `sql/` +
registro no doc 05. Decisão estrutural (1×2) no M9, após inventário de bases/tabelas do
M2. Primeira meta do banco (§1642): inventário + backup restaurável comprovado.

## Evidência necessária
database-inventory (M2); teste de restore de backup; migration piloto com up/down e
auditoria numa base não crítica.
