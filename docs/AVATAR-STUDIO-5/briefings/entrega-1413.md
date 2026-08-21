# Onda 1413 — Cabelos Premium + layering real + cor unificada + headwear (MEGA_BRIEFING_01 §881–§897; decisões #181–#185)

> Entrega 2026-08-21. Mapa: claude/41 (P10-C, P4-G, P4-C, P4-D 2D). Nenhuma flag nova — tudo sob `as6.classico_premium` (OFF): catálogo, clip §897, param `encaixe` e UI só existem com a flag; OFF = byte a byte (regressão visual 111/111, goldens g01–g16, [G] rollback §651).

## Entregue

| # | Item | Arquivo | §§ |
|---|---|---|---|
| 1 | **10 cabelos `cab_px_*`** (§881–§891): builder `cabeloPremium` com camadas reais — massa (gradiente 4 stops `tintaPremium`), franja, sombra interna, **sombra na testa** (`SOMBRA_TESTA`), mechas em 2 tons, fios soltos, **rim light**; estilos: curto, franja, lateral, undercut, longo liso (épico), ondulado (épico), rabo de cavalo, coque, afro (épico), cacheado — hairline ancorada no `G` da base | `engine/partes/premium/cabelos.ts` | §881–§891 |
| 2 | **`renderAtras` nos 3 longos** (§889): massa traseira (`massaAtras`, gradiente `${u}pxcatb`) atrás do pescoço/ombros em longo liso, ondulado e rabo — teste [G] garante que são EXATAMENTE esses 3 | idem | §889 |
| 3 | **Compat cabelo × headwear §897 como DADO**: `engine/compat-cabelo.ts` — `EstadoCabelo` (`visible/masked/variant/hidden`), `PERFIL_HEADWEAR` (aberto/justo/fechado), `PERFIL_CABELO_PX` (altura × comprimento), `resolverEstadoCabelo()` (longo vence chapéu = variant; fechado engole curto = hidden; fallback conservador fora dos registries), `profundidadeRecorte()` (masked ≥14 px, variant ≥8 px, `encaixe` manual 0–22 px) | `engine/compat-cabelo.ts` | §897 |
| 4 | **Recorte no MOTOR** (#183): `pintar()` do render envolve o cabelo num `clipPath` horizontal (`rect y=49+prof`) SÓ com `opcoes.premium` + arte `_px_` + prof > 0 — arte clássica NUNCA é recortada (nunca editar `partes/*`); zero filtros SVG (SvgSanitizer intocado) | `engine/render.ts` | §897, §651 |
| 5 | **Param `encaixe`** (opt-in §897): `params.cabelo.encaixe` (0–1, passo 0,05, padrão 0, **`soV2`** — só artes `_px_`, mesmo trilho da 1412 #179), consumido pelo motor (não é wrapper) | `engine/params.ts`, `render.ts` | §897 |
| 6 | **Fachada runbook**: `services/CompatCabelo.ts` reexporta `resolverEstadoCabelo`/`profundidadeRecorte`/perfis — a lógica pura mora no motor (#182) | `services/CompatCabelo.ts` | §897 |
| 7 | **Cor unificada + canal `destaque`** (§891): swatches "Cor principal do cabelo" (global `config.cores.cabelo`, `data-teste="cab-cor-principal"`) + botão **"Sincronizar"** (`data-teste="cab-sincronizar"`, remove o override `coresCamada` da peça — zero schema novo); canais por peça (cabelo|destaque) só em cabelo premium; mechas com canal `destaque` declarado em longo liso/ondulado/cacheado; paletas §74 escondidas para cabelo | `shell/PropriedadesAsset.tsx` | §891, §73–§74 |
| 8 | **`HUMANOIDES` ganha as 8 `bas_px_*`** (#181): lista COMPARTILHADA de compat (o próprio comentário do arquivo manda atualizar ali — dado, não arte); corrige os goldens 1412 que renderizavam CARECAS (o `requerBase` derrubava `cab_curto` nas bases premium) | `engine/partes/cabelos.ts` | §35 |
| 9 | **`cabelo-silhueta.mjs` contact-sheet**: 50 clássicos + 10 premium × 3 cores (escuro/loiro/branco) → HTML fora do git (`testes/saida/`) para validação visual + métricas determinísticas e matriz §897 em `evidencias/cabelo-silhueta.json`; gates: cor global aplicada (só premium, #185), zero filtros, clip presente/ausente | `scripts/avatar/cabelo-silhueta.mjs` | §891, §897 |
| 10 | **Golden Hair Set H01–H06 + p07/p08 + seção [G]**: h01–h06 (lateral + longo liso × escuro/loiro/branco na base golden), p07 (golden M + lateral), p08 (golden F + longo liso com mecha destaque); [G] = 24 asserts (naming, gating, requerBase, renderAtras, matriz §897, clip com/sem premium, encaixe soV2, byte-stability); baseline 12→20 casos (`--gravar` + revisão no MESMO commit, doutrina #83) | `scripts/avatar/testes/golden-classic.mjs`, `docs/AVATAR-STUDIO-6/golden-classic.json` | §2498–§2510 |
| 11 | Orçamento §2510: `orcamento-2d` 37→48 casos (10 cabelos no busto + golden F com cabelo no corpo) — 0 erros, maior cabelo 8,2 KB/114 nós (teto 40 KB/600); `pesos-esperados` entry 465→470, catalogo-arte 372→380 (justificado); inventário (429 itens 2D, premium 36) + kpi regenerados | `orcamento-2d.mjs`, `pesos-esperados.json` | §2510 |

## Decisões (registro #45)

- **#181** As 8 `bas_px_*` entram na `HUMANOIDES` compartilhada — o `requerBase` derrubava TODO cabelo clássico nas bases premium (goldens p03–p06/c01/c02 saíam carecas). Correção legítima: os hashes desses 6 casos foram regravados no MESMO commit (doutrina #83). Com a flag OFF nada muda no legado: bases premium nem aparecem no catálogo, e um config salvo com `bas_px_*` só existe atrás da flag.
- **#182** O registry `FamiliasCabelo` (movido da 1406 para cá "sem dados mortos") é cumprido por `PERFIL_CABELO_PX` + `PERFIL_HEADWEAR` em `engine/compat-cabelo.ts` — dado VIVO consumido por `resolverEstadoCabelo` (§897); a fachada `services/CompatCabelo.ts` mantém o nome do runbook. Registry paralelo separado seria dado morto.
- **#183** O recorte §897 é um clipPath HORIZONTAL único (linha do chapéu) aplicado pelo motor — cobre bonés/boinas/gorros/chapéus com 1 rect determinístico e zero filtros. Máscara por regiões complexas (§897 completo) fica para quando existir arte que a exija; o contrato (`resolverEstadoCabelo` + `profundidadeRecorte`) já a comporta sem mudar chamadores.
- **#184** "Sincronizar barba/sobrancelha" (P4-C) adiado para a 1414 — as categorias `barba`/`sobrancelha` ainda não existem. O botão "Sincronizar" desta onda remove o override `coresCamada` da peça de cabelo (volta à cor global) — zero schema novo, byte-estável.
- **#185** No `cabelo-silhueta`, "cor global aplicada" é GATE só no trilho premium — clássicos podem ignorar a paleta por design (ex.: `cab_flamejante` é fogo, não tinta); no clássico a métrica é registrada como dado.

## Precisa do Jhony (não bloqueia)

- Validação visual dos 10 cabelos: abrir `scripts/avatar/testes/saida/cabelo-silhueta.html` (contact-sheet 60 estilos × 3 cores) e, no app, flag no console + presets golden trocando cabelos/cores/chapéus; veredito estético no gate da 1418.

## Próxima: 1414 — Barba, sobrancelha, nariz, expressões e idade (schema): categorias novas + PHP + `brb_*`/`sbr_*`/`nar_*`, `coresFace.sobrancelha/barba/labios`, expressões semânticas, `idade`, assimetria determinística; goldens g-face-*.
