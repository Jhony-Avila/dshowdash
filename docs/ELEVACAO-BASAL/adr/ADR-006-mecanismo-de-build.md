# ADR-006 · Mecanismo oficial de build

**Status**: PENDENTE · **Prazo**: M5

## Contexto
Não existe comando que gere todos os artefatos do runtime. O boot depende de 63 dists
com processos de build heterogêneos (esbuild manual, Vite por área, scripts perdidos).
O build oficial deverá: descobrir workspaces, compilar shell e painéis, gerar CSS,
processar assets, gerar manifests e hashes, produzir artefato e FALHAR por dependência
ausente (§1619).

## Opções
1. **Orquestrador raiz próprio** (script Node que invoca builds por workspace e monta manifesto).
   Vantagens: se adapta ao legado heterogêneo; controle do manifesto de release. Riscos: código de build próprio a manter.
2. **Vite multi-entry unificado** (um build para tudo).
   Vantagens: um só toolchain. Riscos: irreal para o legado bundles-IIFE/esbuild no curto prazo; big bang implícito.
3. **Ferramenta de monorepo (Turborepo/Nx)** sobre npm workspaces.
   Vantagens: cache, grafo, paralelismo. Riscos: nova ferramenta sem ownership (proibição §35 exige owner explícito).

## Decisão provisória
Opção 1 no M5 (orquestrador incremental que começa reproduzindo os bundles do grafo de
boot na ordem core→bootstrap→auth→state→shell→UI→painéis), sem descartar migração
posterior à opção 3 quando houver estabilidade e ownership.

## Evidência necessária
Registro por dist (fonte, comando, config — doc 01 §4); primeiro bundle basal
reproduzido e comparado por hash; build falhando corretamente sob dependência ausente.
