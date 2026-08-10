# ADR-003 · Posição final do document root

**Status**: PENDENTE · **Prazo**: M5 (decisão) / M12 (hardening final)

## Contexto
Hoje `public/` é simultaneamente document root, árvore de fontes (`public/koala/src`,
`public/components/**/*.ts`), saída de builds, depósito de docs/patches/testes. O
princípio 5 exige document root mínimo. O briefing §1623 aponta: document root deve
tornar-se SAÍDA do build; a fonte não reside dentro dele.

## Opções
1. **Novo document root gerado** (ex.: `/var/www/dshowdash/htdocs` produzido pelo build; Nginx re-apontado).
   Vantagens: corte limpo; superfice pública 100% controlada. Riscos: mudança de Nginx com muitos consumidores; exige mapa completo de rotas/assets (Gate 4).
2. **Manter `public/` como root e esvaziá-lo progressivamente** (fontes saem; só artefatos ficam).
   Vantagens: sem mudança de Nginx; incremental. Riscos: longa convivência fonte+artefato; risco contínuo de exposição durante a transição.
3. **Root mantido + bloqueio por regras Nginx** (negar `.ts/.tsx/src//docs/` etc.) como estado final.
   Vantagens: rápido. Riscos: lista de negação é frágil; viola espírito do princípio 5 como solução permanente.

## Decisão provisória
Opção 3 é aceita apenas como CONTENÇÃO (M1, após mapa de consumidores); estado final
converge para a opção 1 ou 2, decisão no M5 quando o build canônico existir e o custo
real do re-apontamento for conhecido.

## Evidência necessária
Mapa da superfície pública (public-surface-map, M2); lista de tudo que o navegador
efetivamente requisita; teste do vhost em staging com smoke completo.
