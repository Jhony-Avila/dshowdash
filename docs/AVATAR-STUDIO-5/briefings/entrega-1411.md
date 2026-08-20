# Onda 1411 — Fase 1 Classic Premium (fundação): trilho `_px_`, acabamento premium, CAMADAS_Z, materiais 2D, tinta por luminância, orçamento-2d, goldens p01–p02 (MEGA_BRIEFING_01 §2381–§2427, §2498–§2510; decisões #159/#166/#175–#177)

> Entrega 2026-08-20. Mapa: claude/41. Uma flag nova, **OFF**: `as6.classico_premium` — OFF = motor clássico e catálogo byte a byte (regressão visual 111/111; goldens g01–g16 intactos; teste [B] prova o rollback §651 com partes `_px_` equipadas). Abre a **Fase 1 (1411–1418)**.

## Entregue

| # | Item | Arquivo | §§ |
|---|---|---|---|
| 1 | **`CAMADAS_Z`** (`engine/camadas.ts`): a ordem de pintura do busto vira DADO (z ×10, estritamente crescente) e `ORDEM_CAMADAS` é **derivada**; o render importa a derivada. Prova: snapshot literal da lista histórica no golden-classic [A] + g01–g16 + regressão visual 111/111 inalterados | `engine/camadas.ts`, `engine/render.ts` | §2381–§2394 |
| 2 | **`acabamento?: 'premium'`** no `AvatarConfig` (enum fechado de 1 valor; neutro NUNCA persiste): `validarConfig` + espelho PHP (`studio.php`) + roundtrip vNext (`contratos.ts` `appearance.acabamento` opcional — checksum de estados antigos preservado; `adaptadores.ts` leva e traz) | `domain/types.ts`, `AvatarCatalog.ts`, `api/avatar/studio.php`, `nucleo/{contratos,adaptadores}.ts` | §619 espelho |
| 3 | **Hooks premium no `ParteDef`**: `acabamento`, `renderAtras` (halo/volume atrás da figura), `renderFrente`, `renderSombra` (sombra de contato própria), `renderPlanos` (atras/frente no palco/corpo). Consumidos SÓ com `opcoes.premium`; sombra de contato **PADRÃO** do motor quando nenhuma peça declara a própria. `svgDe` decide o modo (flag && acabamento) — o motor (`render.ts`) continua **puro** (#175) | `engine/base-api.ts`, `engine/render.ts`, `AvatarCatalog.svgDe` | §2414–§2427 |
| 4 | **`tintaPremium()` por luminância** (`luminanciaDe` WCAG): rampa de 6 tons (brilho/claro/base/meio/escuro/profundo) com passos ESCALADOS pela luminância da base — volume estável em preto, branco e saturado (§2404); monotônica (teste [C]) | `engine/cores.ts` | §2402–§2410 |
| 5 | **`engine/materiais2d.ts`**: 10 tokens (cotton/denim/wool/leather/metal/technical/satin/silk/glass/emissive) → defs SVG determinísticos (gradiente + realce por strokes), ids prefixados por uid, **ZERO filtros** (emissivo = halo por camadas de alfa; SvgSanitizer NÃO estendido — #177) | `engine/materiais2d.ts` | §2402–§2427, §2510 |
| 6 | **Primeiras partes `_px_`** (#166; arte NOVA em pasta própria — partes/* intocadas): `rou_px_terno` (lã fria + seda, renderSombra + renderAtras) e `rou_px_jaqueta` (couro + zíper de metal, renderSombra) com renderCorpo; no `PARTES` sempre (resolver aceita config salvo), **fora do catálogo sem a flag** (`itensDe` filtra — #176) | `engine/partes/premium/roupas.ts`, `AvatarCatalog.ts` | §2411–§2427 |
| 7 | **`SUCESSOR_PREMIUM` em uso** (`rou_terno→rou_px_terno`, `rou_jaqueta→rou_px_jaqueta`): legado vira `legacy` fora do destaque (renderiza para sempre); **`rendererSupport(id)`** (2d/3d/ambos) para ficha/QaStudio | `services/QualidadeVisual.ts` | §163–§167 |
| 8 | **Sombra de contato no shell**: `.avst5-palco-premium` (drop-shadow do WRAPPER — SVG salvo intocado) quando flag ON + acabamento premium | `ShellStudio.tsx`, `estudio.css` | §2418 |
| 9 | **`orcamento-2d.mjs`** → `evidencias/orcamento-2d.json`: bytes/nós/filtros/gradientes de TODAS as roupas + goldens premium vs tetos §2510 (busto ≤ 40 KB/600 nós/4 filtros; corpo ≤ 80 KB); aviso em clássico, ERRO em premium. **Medição: 35 casos, 0/0** | `scripts/avatar/orcamento-2d.mjs` | §2498–§2510 |
| 10 | **`golden-classic.mjs`** (node puro, esbuild): [A] ordem derivada byte a byte · [B] rollback §651 (flag OFF: render clássico com uid fixo, catálogo sem `_px_`, POR_ID resolve) · [C] premium determinístico, sombra própria/padrão, hooks, materiais sem filtro, rampa monotônica, QualidadeVisual do trilho · [D] **goldens p01–p02** (2 configs × busto/palco/corpo) → `docs/AVATAR-STUDIO-6/golden-classic.json` (baseline própria, doutrina #83) · [E] orçamento nos goldens. Suíte = 150 | `scripts/avatar/testes/golden-classic.mjs`, `docs/AVATAR-STUDIO-6/golden-classic.json` | — |
| 11 | Docs: PERFORMANCE-BUDGETS §5 (orçamento executável, medição); `pesos-esperados` entry 460→465 · catalogo-arte 345→355 (justificado); inventário visual regenerado (+2 `_px_`) | `docs/*`, `scripts/deploy/pesos-esperados.json` | §3044 |

## Decisões (registro #45)

- **#175** O modo premium é decidido no `svgDe` (`flag && config.acabamento`) — o motor continua puro (`opcoes.premium`); o `uid` muda com o campo novo (hashConfig), então byte-stability é provada com uid fixo + regressão visual (visual idêntico; bytes de defs mudam só pelo id do hash, como em qualquer campo novo persistido).
- **#176** Partes `_px_` ficam SEMPRE no `PARTES` (config salvo resolve com flag em qualquer posição — §651) e fora do catálogo/aleatório sem a flag; `SUCESSOR_PREMIUM` rebaixa o legado a `legacy` (derivação em dados sempre ativa, padrão 1406).
- **#177** `materiais2d` não emite NENHUM filtro SVG (emissivo = halo por strokes de alfa) — orçamento §2510 e SvgSanitizer intocados; filtros continuam raros e por conta da parte (máx 4 no busto).

## Precisa do Jhony (não bloqueia)

- Validação visual do trilho: ligar `as6.classico_premium` (console: `localStorage.setItem('dshow.avst.flags.v1','{"as6.classico_premium":true}')`), equipar Terno/Jaqueta Premium e setar `acabamento` (a UI de acabamento chega na 1418 — até lá, goldens p01/p02 e QaStudio mostram o trilho).
- Goldens p01–p02 são baseline TÉCNICA (determinismo); o veredito ESTÉTICO (Golden Outfits §1220) é seu no gate da 1415/1418.

## Próxima: 1412 — Faces Premium (Golden Faces §595–§597, §701–§708): olhos com íris/catchlight, sobrancelhas `sbr_`, nariz `nar_`, bocas premium; categorias novas do #162 (`coresFace`).
