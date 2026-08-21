# Onda 1417 — Fundos em profundidade, looks 2D, auras premium e molduras (MEGA_BRIEFING_01 P10-F, P8-F, P9-A.2/7, P9-B 2D, P9-E.5–6; decisões #199–#201)

> Entrega 2026-08-21. Mapa: claude/41. Nenhuma flag nova — ambiente premium sob `as6.classico_premium` (catálogo) e apresentação sob `.avst5-palco-premium` (looks/planos por CSS). OFF = byte a byte (regressão visual 111/111; goldens anteriores intocados).

## Entregue

| # | Item | Arquivo | Ref |
|---|---|---|---|
| 1 | **`RegistroEfeitos`** (#199): fichas de aura com os 8 atributos (família, camada trás/frente/ambas, intensidade, velocidade, partículas, emissiva, **cobreRosto**, raio) para as 15 auras clássicas + 4 premium; `cobreRosto()` é **HARD FAIL** — teste [K] reprova ficha true OU ficha ausente | `services/RegistroEfeitos.ts` | P9-A.2 |
| 2 | **6 fundos `fun_px_*` (BG01–BG06)** (#200): estúdio, metrópole, horizonte, beco neon, biblioteca, nebulosa — `render` em PLANOS marcados (`data-plano="far/mid/floor"`) + `renderPlanos.frente` com a ATMOSFERA (`data-plano="fg"`: poeira, vinheta de rua, neon) consumida no palco SÓ premium; canal `secundario` reaproveitado (céu/luz ambiente) | `engine/partes/premium/ambiente.ts` | P10-F |
| 3 | **Parallax + blur por CSS** (#200): `.avst5-palco-premium g[data-plano]` — far com blur 1.2px, deslocamento por `data-luz`, `prefers-reduced-motion` desliga; apresentação pura (SVG salvo estático) | `styles/estudio.css` | §2427 |
| 4 | **Hooks premium nas camadas de AMBIENTE** (#200): o loop de hooks do render (1411) passa a incluir `fundo/banner/aura/moldura` (antes só figura) — `renderAtras/renderFrente/renderPlanos` de fundos e auras entram SÓ com `opcoes.premium`; busto palco ganha os planos premium (antes só corpo inteiro) | `engine/render.ts` | #200 |
| 5 | **4 auras `aur_px_*`** (fluxo, cristal, chama, estelar): `renderAtras` = rear glow radial, `render` = massa principal com **`data-nucleo`**, `renderFrente` = partículas NA FRENTE da figura; canal `secundario` = cor do miolo (P9-B "corSecundaria" sem campo novo) | `ambiente.ts` | P9-B |
| 6 | **Param `nucleo`** (#199): `params.aura.nucleo` (0–1, `soV2` — só `aur_px_`), consumido por substituição determinística do marcador `data-nucleo` no `aplicarParamsSvg` | `engine/params.ts` | §71 |
| 7 | **4 molduras `mol_px_*`** (ouro, holo, laurel, eclipse): borda viva, **centro sempre livre** — teste de área coberta reprova rect grande com fill sólido | `ambiente.ts` | P9-E.5 |
| 8 | **Looks 2D** (#201): contrato `LOOKS_2D` (Studio/Portrait/Hero/Neon, `portraitSafe` declarado) + CSS `[data-look]` no palco premium (box-shadow/rim por drop-shadow, transição suave); rim 2D via CSS `drop-shadow` (zero filtros no SVG — o `feMorphology` do mapa foi trocado por apresentação, ver decisão); **UI de seleção chega na 1418** | `RegistroEfeitos.ts`, `estudio.css` | P8-F |
| 9 | **Sombra de contato na foto**: já existia como `ajustes.sombra` (§337, opt-in) — nada a duplicar em `camadasFoto` (#201) | — | §337 |
| 10 | **Testes**: seção [K] (20+ asserts: registro completo, hard fail cobreRosto, planos nos 6 fundos, atmosfera gated, rear glow gated, nucleo soV2 + substituição, molduras centro-livre, looks) + goldens **p13–p15** — baseline 28→31; `orcamento-2d` 96→110 casos (0 erros); `pesos-esperados` entry 505 / catalogo-arte 428; inventário 495 itens (73 premium, 14,7 %); `dock-mag` robustecido (momentum amostrado até 1,2 s — flake sob carga) | `golden-classic.mjs`, `orcamento-2d.mjs`, `dock-mag.mjs` | #83 |

## Decisões (registro #45)

- **#199** Famílias/atributos de aura são DADO consultivo (`RegistroEfeitos`) com `cobreRosto` como contrato hard-fail de teste — nenhuma mudança de render/validarConfig para configs salvos. `corSecundaria` do mapa = canal `secundario` de 1415 (zero campo novo); `nucleo` = param §71 `soV2`.
- **#200** Planos de profundidade: o SVG salvo carrega os grupos `data-plano` ESTÁTICOS (byte-determinístico); parallax/blur são apresentação por CSS no palco premium. O loop de hooks premium passa a cobrir fundo/banner/aura/moldura — mudança invisível fora do premium (hooks só existem em artes novas).
- **#201** O rim 2D dos looks usa CSS `drop-shadow` na apresentação em vez de `feMorphology` no SVG — mantém o ZERO FILTROS do trilho premium (§2510/SvgSanitizer intocado) com o mesmo efeito visual; looks nunca tocam o SVG salvo. A sombra de contato da foto já existia (`ajustes.sombra` §337) — não duplicamos em `camadasFoto`.

## Precisa do Jhony (não bloqueia)

- Validação visual: console `as6.classico_premium` → equipar BG01–BG06 no palco (parallax com `data-luz`), auras premium (núcleo no slider, partículas na frente), molduras; looks via `data-look` no DOM até a UI da 1418.

## Próxima: 1418 — Photo Mode 2D, Vitrine, presets e ROLLOUT Classic Premium (gate ★ §2560 do Jhony).
