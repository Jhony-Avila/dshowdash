# Onda 1412 — Golden Classic: rosto, olhos e boca premium (MEGA_BRIEFING_01 §595–§597, §701–§708, §736–§744; decisões #159/#162/#166/#178–#180)

> Entrega 2026-08-20. Mapa: claude/41. Nenhuma flag nova — tudo sob `as6.classico_premium` (OFF): catálogo, presets, íris, params v2, blink e catchlight só existem com a flag; OFF = byte a byte (goldens g01–g16, regressão visual, rollback §651 nos testes).

## Entregue

| # | Item | Arquivo | §§ |
|---|---|---|---|
| 1 | **8 bases `bas_px_*`** (§736–§744): construtor `basePremium` com jawline/queixo por estrutura (oval, angular, coração, quadrada, redonda, alongada, diamante, suave), orelhas com hélice, **nariz integrado** (dorso em luz, narinas), bochechas em meia-luz, arcada superciliar neutra, sombra do pescoço + core shadow; pele com gradiente de 5 paradas via `tintaPremium` | `engine/partes/premium/faces.ts` | §736–§744 |
| 2 | **`olhoPremium()` + 8 `olh_px_*`** (§701–§708): esclera quente com oclusão superior, **íris em 2 tons + anel de luz**, **2 catchlights** (grupo `${uid}pxcatchL/R`), pálpebra dupla + cílios, **SEM sobrancelha** (§703); variações por ry/tilt/irisR/pálpebra (confiante, sereno, focado, amendoado, intenso, gentil, felino, determinado) | `engine/partes/premium/faces.ts` | §701–§708 |
| 3 | **`coresFace.iris`** (#162): campo novo no config (hex validado, minúsculas, vazio some — byte-estável), espelho PHP em `studio.php`; injeção na `Paleta` (`p.iris`) SÓ no modo premium e SÓ na camada olhos — sem premium a íris não aplica (rollback §651 testado) | `domain/types.ts`, `AvatarCatalog.ts`, `engine/{cores,render}.ts`, `api/avatar/studio.php` | #162 |
| 4 | **Params olhos v2** (§705–§706): `espacamento` (scaleX ancorado em 120,108), `altura` (translateY), `inclinacao` (rotate) como WRAPPERS; marcados `soV2` — `paramsDaCamada(chave, idItem)` só os expõe para artes `_px_` (UI, validarConfig e render passam o id); o `escala` legado (megas 72–74) continua para todos | `engine/params.ts`, `AvatarCatalog.ts`, `engine/render.ts`, `PropriedadesAsset.tsx` | §705–§706 |
| 5 | **8 bocas `boc_px_*`** (§742–§744): lábios em 2 tons (superior escuro/inferior com luz), sombra dos cantos, dentes no riso — sorriso, neutra, meio, séria, riso, pensativa, suave, determinada | `engine/partes/premium/faces.ts` | §742–§744 |
| 6 | **Expressões como PRESETS** (§744): `EXPRESSOES_PREMIUM` — 8 pares olhos+boca (dados para a UI; **sem campo novo** no config, testado) | `faces.ts`, re-export no `AvatarCatalog` | §744 |
| 7 | **Golden Classic Male/Female**: presets `pre_golden_m`/`pre_golden_f` (base+olhos+boca+roupa `_px_`, `coresFace`, `acabamento: 'premium'`); `presetsAtivos()` esconde os golden sem a flag (#176) — `Presets.tsx` continua no `PRESETS` (dados aceitos sempre) | `AvatarCatalog.ts` | §707–§708 |
| 8 | **Blink revisado** (§707): `ligarVida(host, corpo, premium)` — premium = intervalo mais variável (2,2–7,6 s), piscada 150 ms e **double-blink** ocasional (~28 %); `AvatarSvg` liga só com flag+acabamento; premium=false = curva anterior | `workspace/vida.ts`, `components/AvatarSvg.tsx` | §707 |
| 9 | **Catchlight segue a luz do palco** (§707): CSS em `.avst5-palco-premium` desloca `g[id$="pxcatchL/R"]` conforme `data-luz` (quente/fria/dramática) com transição — apresentação apenas; SVG salvo estático | `styles/estudio.css` | §707 |
| 10 | **Goldens p03–p06 + C01/C02**: p03/p04 golden faces M/F, p05 íris+params v2, p06 expressão, c01/c02 presets golden no palco — baseline `golden-classic.json` agora com **12 casos**; orçamento §2510 verificado em todos (37 casos no `orcamento-2d`, 0 erros/0 avisos) | `scripts/avatar/testes/golden-classic.mjs`, `docs/AVATAR-STUDIO-6/golden-classic.json`, `scripts/avatar/orcamento-2d.mjs` | §2498–§2510 |
| 11 | `SUCESSOR_PREMIUM` += bas_angular/bas_redonda/olh_focado/olh_serio/boc_neutra (#180: os DEFAULT do config ficam de fora até o gate da 1418); `pesos-esperados` catalogo-arte 355→372 (justificado); inventário + kpi regenerados | `QualidadeVisual.ts`, `pesos-esperados.json` | §163–§167 |

## Decisões (registro #45)

- **#178** A íris entra na `Paleta` (`p.iris?: Tinta`) injetada pelo render SÓ para a camada olhos em modo premium — o contrato `ParteRender(Paleta, uid)` não muda; artes premium usam `p.iris ?? padrão âmbar`.
- **#179** Params de olhos v2 usam `soV2` POR PARÂMETRO (o `escala` legado continua universal): `paramsDaCamada` ganha `idItem` opcional e filtra — chamada legada (sem id) devolve o conjunto de sempre, byte-estável.
- **#180** Os itens DEFAULT do config (`bas_classica`, `olh_padrao`, `boc_sorriso`) NÃO entram no `SUCESSOR_PREMIUM` enquanto a flag está OFF — rebaixá-los tiraria o kit padrão do destaque com o sucessor invisível; entram no gate da 1418 junto com a flag.

## Precisa do Jhony (não bloqueia)

- Validação visual (Golden Faces §708: "4 rostos não parecem irmãos"): flag no console + presets Golden Classic (Ele/Ela) + trocar íris/expressões; veredito estético é seu no gate da 1418.

## Próxima: 1413 — Cabelos Premium (§881–§897): `cab_px_*` em 6 camadas (silhueta/base/mechas/brilho/fios soltos/rim), hairline, fit com cabeça, headwear-aware; goldens p07+.
