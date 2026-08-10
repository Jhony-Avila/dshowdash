# ADR-001 · Fonte canônica do frontend: `app/` × `public/app/`

**Status**: PENDENTE (decisão provisória abaixo) · **Prazo**: M3 (decisão) / M6-Parte 8 (execução)

## Contexto
`app/` tem 93 arquivos 100% rastreados, build raiz (Vite) configurado com `outDir` para
`dist/` (inexistente), e nenhuma dependência comprovada do Nginx. `public/app/` tem 32
arquivos físicos no servidor, 0 rastreados, contém router e entrypoints usados pelo
runtime e é publicado diretamente. Existem caminhos equivalentes com conteúdo divergente
(10 pares divergentes citados no briefing §1610 — lista exata a produzir no M2).

## Opções
1. **`app/` como fonte canônica; `public/app/` vira artefato gerado** (direção do briefing §1610).
   Vantagens: árvore já governada; separa fonte de publicação. Riscos: divergências atuais
   precisam de decisão individual; runtime hoje carrega o lado ignorado.
2. **Incorporar `public/app/` ao Git como fonte e aposentar `app/`.**
   Vantagens: menor distância do runtime real. Riscos: consagra fonte dentro do document
   root (viola princípio 5); perde a arquitetura nova.
3. **Fusão seletiva** par a par com teste de equivalência.
   Vantagens: preserva o melhor de cada. Riscos: mais lento; exige testes que ainda não existem.

## Decisão provisória
Opção 1 como hipótese de trabalho, SEM execução ainda: `app/` = fonte candidata,
`public/app/` = runtime sombra congelado (regras doc 01 §4). Os 10 pares divergentes
receberão decisão individual documentada antes de qualquer consolidação.

## Evidência necessária
Diff completo dos pares divergentes; mapa de qual árvore o runtime realmente carrega
(coletor + análise de imports); teste de boot/refresh/deep-link antes do corte.
