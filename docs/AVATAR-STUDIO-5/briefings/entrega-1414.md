# Onda 1414 — Barba, sobrancelha, nariz, expressões e idade (MEGA_BRIEFING_01 Partes 3/4/5; decisões #162/#186–#190)

> Entrega 2026-08-21. Mapa: claude/41 (P4-F, P3-D, P3-E). Flags novas: `as6.face_v2` (OFF) + filhas `as6.barba_slot`/`as6.brow_slot` (OFF, `DEPENDENCIAS_FLAGS`). OFF = byte a byte (regressão visual 111/111, goldens g01–g16 + 20 casos premium intocados, [H] rollback §651); dados salvos com os campos novos seguem aceitos (dado > UI).

## Entregue

| # | Item | Arquivo | Ref |
|---|---|---|---|
| 1 | **3 categorias FACIAIS novas** (#162): `barba`/`sobrancelha`/`nariz` como camadas próprias — `CategoriaId`, `CATEGORIAS` (gated em `categoriasAtivas`), `CAMADAS_Z` nos VÃOS (barba=34 sob a boca, nariz=44, sobrancelha=54 sob o cabelo — #186), `SLOTS_EQUIPAMENTO`, espelho PHP `$categorias`; `CONFIG_PADRAO` sem elas | `domain/types.ts`, `engine/camadas.ts`, `AvatarCatalog.ts`, `nucleo/contratos.ts`, `api/avatar/studio.php` | #162, #186 |
| 2 | **8 barbas `brb_*`** (raridade `comum` #162): rala, aparada, cheia, cavanhaque, bigode, costeleta, longa, lenhador — gradiente de pelos 3 stops, fios determinísticos, recorte da boca, `requerBase` HUMANOIDES | `engine/partes/premium/rosto.ts` | Parte 4 |
| 3 | **10 sobrancelhas `sbr_*`**: overlay sobre o traço cozido da base (par espelhado com luz), 10 traços (reta→unida) | idem | Parte 3 |
| 4 | **8 narizes `nar_*`**: patch de pele + perfis (reto, fino, largo, arrebitado, aquilino, botão, forte, suave) sobre o nariz integrado da base | idem | Parte 3 |
| 5 | **Compat barba × máscara/cachecol** (#187): `engine/compat-rosto.ts` — `resolverEstadoBarba` (máscara fechada engole; cachecol só conflita com barba LONGA; fallback conservador), estados binários visible/hidden (recorte fino fica p/ arte que exija, eco do #183); aplicado no motor SEMPRE para `brb_` (dado novo, sem legado) | `engine/compat-rosto.ts`, `engine/render.ts` | #187 |
| 6 | **Beard fit por família** (#162): `FAMILIA_FACE` (suave/anguloso/largo por base `_px_`) + `fatorBarba` — o MOTOR escala a barba (anguloso ×1.05, largo ×1.1), a arte não conhece a base | `engine/compat-rosto.ts`, `render.ts` | #162 |
| 7 | **`coresFace` completo** (#162): `sobrancelha`/`barba`/`labios` + a `iris` de 1412 — validação 4 canais (front + PHP), injeção na `Paleta` SÓ na camada dona e SÓ com `as6.face_v2`; `labios` consumido pelas bocas `boc_px_` (fallback = tom padrão byte a byte) | `domain/types.ts`, `engine/cores.ts`, `render.ts`, `premium/faces.ts`, `studio.php` | #162 |
| 8 | **Expressões semânticas** (#188): `domain/expressoes.ts` — registry de 7 presets (feliz→confiante) com poses por camada (olhos/boca/sobrancelha) escaladas por `intensidade`; campo `expressao?: {preset, intensidade}` (neutra NUNCA persiste; intensidade 1 omitida; espelho PHP); aplicada por WRAPPERS só em artes v2 (`_px_`/`sbr_`) e só com `as6.face_v2` | `domain/expressoes.ts`, `render.ts`, `AvatarCatalog.ts`, `studio.php` | #188 |
| 9 | **Idade** (#162): `idade?: young_adult\|adult\|mature` (adult NUNCA persiste; espelho PHP) via `overlayIdade` — mature: linhas de testa + nasolabiais + pés de galinha; young_adult: luz suave nas bochechas; SÓ com faceV2 + base `_px_` | `premium/rosto.ts`, `render.ts` | #162 |
| 10 | **Assimetria determinística** (#189): desvio ±0,3 (rotação olhos/sobrancelha, deslocamento boca) semeado por `hashConfig` (NUNCA pelo uid — override de uid não muda arte), wrapper só faceV2 + arte v2 | `render.ts` | #189 |
| 11 | **Face Idle Profiles** (#190): `PERFIS_IDLE_FACE` em `vida.ts` — piscada segue a expressão (cansado lento/pesado + double-blink 40 %, surpreso raro, bravo seco); `ligarVida(..., perfil)` e `AvatarSvg` só passa perfil com `as6.face_v2` | `workspace/vida.ts`, `AvatarSvg.tsx` | #190 |
| 12 | **UI**: seções de cor de barba/sobrancelha (`data-teste="face-cor-*"`, swatches da família cabelo + "Seguir cabelo" remove o canal — `data-teste="face-seguir-*"`); ícones/contextos/inspector das 3 categorias | `PropriedadesAsset.tsx`, `App.tsx`, `contexto.ts`, `inspectorSchema.ts` | §181–§189 |
| 13 | **Testes**: seção [H] (30+ asserts) + goldens **f01–f04** (Golden Face v2) — baseline 20→24 (`--gravar` mesmo commit, doutrina #83); [A] atualizado (#186: z inteiro crescente, fundadoras ×10); `orcamento-2d` 48→75 casos (0 erros); `docs-aaa` 13→16 categorias; `pesos-esperados` entry 470→478, catalogo-arte 380→388; inventário/kpi regenerados | `golden-classic.mjs`, `orcamento-2d.mjs`, `docs-aaa.mjs`, `pesos-esperados.json` | #83 |

## Decisões (registro #45)

- **#186** Camadas novas entram nos VÃOS de `CAMADAS_Z` com z INTEIRO (barba=34, nariz=44, sobrancelha=54) — a regra "múltiplo de 10" valia só para fundadoras (o vão de 10 não comporta múltiplos de 10); o contrato [A] passa a ser z inteiro estritamente crescente + snapshot literal + fundadoras ×10. Árvore de flags: `as6.barba_slot`/`as6.brow_slot` são FILHAS de `as6.face_v2` (§2917 — família liga/desliga junto).
- **#187** Compat barba (máscara/cachecol) e beard fit aplicam SEMPRE a artes `brb_` — camada nova não tem legado, logo não há byte-stability a proteger; a flag só esconde a UI. Estados binários (visible/hidden); recorte fino fica para arte que o exija (eco do #183).
- **#188** Expressão é POSTURA da face (wrappers de transform pequenos), não morfologia — morfos ficam para as artes/3D. `neutra` não existe no registry: ausência de campo É a neutra (byte-estável por construção).
- **#189** Assimetria semeada por `hashConfig(config)` e nunca pelo uid: o override de uid (testes, palco) não pode mudar a arte; mesmo config ⇒ mesmo desvio para sempre.
- **#190** Perfis idle são multiplicadores sobre as curvas 1412 (intervalo/duração/double-blink) — sem perfil, curvas byte a byte; runtime apenas (nada no SVG salvo).

## Precisa do Jhony (não bloqueia)

- Validação visual: console `as6.face_v2` (+ `as6.barba_slot`/`as6.brow_slot`) + `as6.classico_premium` → equipar barbas/sobrancelhas/narizes nos presets golden, trocar expressão/idade via console (`expressao: {preset:'confiante'}`, `idade:'mature'`); veredito no gate da 1418.

## Próxima: 1415 — Roupas premium + Golden Outfits (mapa claude/41).
