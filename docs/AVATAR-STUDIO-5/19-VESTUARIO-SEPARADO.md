# 19 — Vestuário 2D separado: superior / calça / calçado (decisões #50/#51/#52)

Evolução funcional do Visual Composer 2D: "Roupa" deixa de ser um grupo único e passa a três
categorias independentes de primeiro nível — **Camisetas e blusas** (superior), **Calças**
(inferior) e **Calçados** — de ponta a ponta (catálogo, estado, render, cores, hotspots,
enquadramento, persistência, histórico, migração, roundtrip). Atrás da flag
`as6.vestuario_separado` (canário u75); OFF = experiência atual byte a byte.

## Achado que orientou a solução

A separação já era estrutural: `AvatarConfig.camadas` tem chaves independentes (`roupa`,
`roupa_inferior`, `roupa_sobre`, `acessorio_pes`), e **a arte de calça/calçado já existe** como
premium (`rin_jeans/social/jogger`; `ace_px_tenis/social/bota` + `ace_tenis_neon`), escondida por
`as6.roupa_premium`/`as6.classico_premium`. Logo, o trabalho foi **expor** (não duplicar) +
UI + classificação de conjuntos, com um seed mínimo só para atingir os mínimos do briefing.

## #50 — Expor arte existente + seed mínimo isolado

Resolver dedicado `itensVestuario(cat)` (AvatarCatalog) lista os itens da categoria **ignorando o
filtro premium** do `itensDe` — assim `rin_*`/`ace_px_*` aparecem sem ligar o trilho premium
inteiro. Complemento mínimo em `engine/partes/vestuario_seed.ts` (arte NOVA, isolada,
`VESTUARIO_SEED_IDS`, revisão visual pendente): +2 calças (`rin_shorts`, `rin_futurista`) e +1
calçado (`ace_tenis_futuro`) → 5 calças e 5 calçados. Nenhuma arte canônica alterada
(byte-stability). Render via `renderCorpo` (corpo inteiro 240×400), busto vazio.

## #51 — Flag própria + três categorias de trilho

`as6.vestuario_separado` (default OFF; FLAGS_REMOTAS p/ resolução por usuário; canário u75).
`grupos.gruposVisuais(flag)` troca o grupo "Roupa" por três (superior/calça/calçado) quando ON.
`superior` tem subs **Peças** (não-conjunto) e **Looks completos** (conjunto). Sem flip global;
demais usuários seguem clássico. Espelho PHP e `validarConfig` já aceitam os slots (sem mudança).

## #52 — Conjuntos por registry versionado

`vc/conjuntos2d.ts`: `rou_*` de corpo inteiro (terno/smoking/astronauta/kimono/armadura/
exoesqueleto/gala/túnica) ocupam superior+inferior. Equipar conjunto limpa `roupa_inferior`;
equipar calça com conjunto ativo limpa o conjunto — atômico (undo/redo restauram tudo via command
pattern). Borderline (sobretudo/jaleco/capa/pijama/chef) = superior + `VISUAL_REVIEW_REQUIRED`.

## Hotspots e enquadramento

`enquadramentoDinamico`: regiões de corpo `roupa` (torso), `calca` (quadril→canela), `calcados`
(pés) — tronco→superior, pernas→calça, pés→calçado, mesma transformação dinâmica (getScreenCTM/
getBBox). Enquadramento por categoria via `foco` do grupo; reframe restaura a composição segura.

## Entrega

Branch candidata a partir de `origin/main`; TSC + build + smoke dirigido + evidências; **sem push
/ sem deploy** (instrução do Jhony: veredito visual antes de ir ao canário). Invariantes:
`MAIN_MUTATION=NO · DEPLOY=NO · GLOBAL_FLAGS_CHANGED=NO · BACKEND_PRODUCTION_MUTATION=NO`.
