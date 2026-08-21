# Onda 1416 — Acessórios premium 2D + contrato de fit + paridade semântica (MEGA_BRIEFING_01 P10-E, P6-A, P6-E, §616–§617; decisões #196–#198)

> Entrega 2026-08-21. Mapa: claude/41. Flag nova: `as6.acess_2d_premium` (OFF, filha de `as6.classico_premium`). OFF = byte a byte (regressão visual 111/111; goldens anteriores intocados).

## Entregue

| # | Item | Arquivo | Ref |
|---|---|---|---|
| 1 | **`AcessoriosRegistry`** (#196): 88 fichas (75 clássicos + 13 premium) com `classe`/`occupies` (13 regiões semânticas, `orbita` nunca conflita)/`fitProfile`/`hides` — regras declarativas viram `Regra[]` (§617) via `regrasDe()` e alimentam `avaliarRegras` (`podeEquipar()`); bounds de câmera = `FOCO_ITEM_ASSET` já medido (sem duplicar dado) | `services/AcessoriosRegistry.ts` | §616–§617 |
| 2 | **Conflito NOMEADO** (P6-A): `conflitoNomeado(a, b)` — verbo por classe ("Asas **substituem** Mochila", "Máscara **cobre** Óculos", região no texto); máscaras fechadas alinhadas ao `compat-rosto` de 1414 (`hides: barba` — teste [J] trava o alinhamento) | idem | P6-A |
| 3 | **10 `ace_px_*`**: óculos (lente com gradiente + highlight de vidro), coroa (frente + **arco de trás via `renderAtras`**), colar (elos + pingente), mochila (corpo atrás/alças na frente), asas (envergadura em camadas atrás, épico), brinco, relógio (pulso, corpo inteiro), **cetro encaixando na mão** (`renderCorpo` em `mao_d`), **drone e gato com MOTION SMIL** (bobbing/cauda — `congelarSvg` remove nas thumbs) — todos com `materialToken` | `engine/partes/premium/acessorios.ts` | P10-E |
| 4 | **Itens de costas ATRÁS da figura** (#196): mochila/asas/coroa usam o hook `renderAtras` do trilho premium (§2414) — SÓ com `opcoes.premium`; a "camada aditiva `acessorio_costas_tras`" do mapa é cumprida SEM campo persistido novo (sem dados mortos) | idem, `render.ts` (hook 1411) | #196 |
| 5 | **`ParidadeRenderer`** (#197): id LÓGICO → `{classic, tresD}` (9 pares reais com os `soc_*` do catálogo 3D), `idLogicoDe()`, `avisoParidade()` ("Disponível só no renderizador 2D/3D") — badge no drawer de detalhes (`data-teste="det-paridade"`) | `services/ParidadeRenderer.ts`, `DetalheAsset.tsx` | P6-E |
| 6 | **UI**: contador de acessórios equipados + **"Remover todos"** (`data-teste="acess-remover-todos"`, usa o `comItem(null)` de sempre) + conflito nomeado ao vivo (`data-teste="acess-conflito"`) — tudo sob a flag; **filtro Dev `prototype`**: a rota de QA (`as6.qa_route`) também revela protótipos no Estúdio 3D (antes só `as5.hud3d`) | `GradeItens.tsx`, `Estudio3D.tsx` | P6-A |
| 7 | **`FOCO_ITEM_ASSET`** dos 10 itens novos (medidas de câmera no mesmo commit — regra do `medir-foco-item.mjs`) | `modoItem.ts` | §68 |
| 8 | **Testes**: seção [J] (25+ asserts: cobertura do registry SEM ficha faltando, referências de regras existem, conflitos nomeados, órbita, renderAtras gated, motion SMIL removível, props no corpo, paridade íntegra) + golden **p12** (óculos+coroa+colar+asas no busto premium) — baseline 27→28; `orcamento-2d` 86→96 casos (0 erros); `pesos-esperados` entry 498 / catalogo-arte 415; inventário 481 itens (59 premium) | `golden-classic.mjs`, `orcamento-2d.mjs`, `pesos-esperados.json` | #83 |

## Decisões (registro #45)

- **#196** A "camada aditiva `acessorio_costas_tras`" é cumprida pelo hook `renderAtras` (1411) — itens de costas premium desenham atrás da figura SÓ no modo premium, sem campo persistido novo nem migração (doutrina "sem dados mortos", eco de #182). O registry é CONSULTIVO: `validarConfig`/render de configs salvos não mudam; conflitos são resolvidos na UI (equip flow de sempre) e nomeados pelo registry.
- **#197** Paridade semântica é um MAPA (id lógico → arte por renderer), separado de `rendererSupport` (capacidade por item): o aviso na UI só aparece quando o item NÃO tem par no outro mundo.
- **#198** O filtro Dev de protótipos reusa a porta `as6.qa_route` (dev por definição, §2707) em vez de flag nova — protótipos aparecem no Estúdio 3D quando a rota de QA está ligada.

## Precisa do Jhony (não bloqueia)

- Validação visual: console `as6.acess_2d_premium` (+ pais) → equipar coroa/asas/mochila (massa atrás), pets (motion), cetro no corpo inteiro; conferir o conflito nomeado equipando máscara + óculos.

## Próxima: 1417 — Fundos em profundidade, looks 2D, auras premium, molduras (mapa claude/41).
