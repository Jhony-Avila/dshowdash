# Onda 1419 — Câmera v2 + sombras/chão/ambiente (MEGA_BRIEFING_01 Parte 8 P8-B/P8-C; decisões #204–#205)

> Entrega 2026-08-22 — **abre a Fase 2 (3D premium sem assets novos)**. Flags novas: `as6.camera_v2` e `as6.sombras_v2` (OFF, filhas de `as5.palco3d`). OFF = câmera e sombras anteriores byte a byte (teste [B1] + suíte).

## Entregue

| # | Item | Arquivo | Ref |
|---|---|---|---|
| 1 | **`Camera3d.ts`** (#204): CAMERA REGISTRY puro (zero THREE/DOM) — presets `face/retrato` (FOV 24°), `busto` (28°), `corpo` (33°), `costas` (30°, azimute π) com **eye-line** e **headroom** por preset; `enquadrar(caixa, preset)` determinística (bounds-aware — a caixa chega ∪ props/acessórios); `BOOKMARKS_CAMERA` Full/Bust/Face/Back; `PRESET_POR_CATEGORIA` (category-aware, cobre TODAS as categorias — teste trava); `LIMITES_ORBITA` (polar/minDistance/near); `TRANSICAO_CAMERA_MS = 300` | `services/Camera3d.ts` | P8-B |
| 2 | **Integração no Renderizador3d** (#204): modos novos `busto/face/costas` no `EstadoCamera` (enum aditivo; `CAMERAS_3D` das cenas cresce), FOV por preset, **transição 300 ms interromível** (smoothstep no laço; novo `definirCamera` substitui a transição em voo), **guard #165d** (mesmo modo já aplicado ⇒ câmera NÃO reseta; `forcar` fura — só bookmarks), `irParaBookmark()`, limites aplicados ao OrbitControls | `services/Renderizador3d.ts`, `nucleo/renderizador.ts`, `services/Cenas3d.ts` | #165d |
| 3 | **Sombras v2** (#205): shadow map POR TIER (512/1024/2048, rebuild a quente), **shadow camera justa no Box3** do personagem ∪ props (`ajustarCameraSombra`, re-fit a cada carga/tier), **bias + softness POR LOOK** (`Look.sombra`), **contact shadow SEMPRE** (gradiente radial procedural em CanvasTexture no chão fake — ancora mesmo com a sombra real ligada, opacidade reduzida) | `Renderizador3d.ts`, `Looks3d.ts` | P8-C |
| 4 | **`definirChao()`**: `studio_matte` (visual atual — nada muda sem chamada) · `gloss` (disco refletivo standard) · `platform` (cilindro de estúdio) · `grid` (helper); API opt-in + `chaoAtivo()` | `Renderizador3d.ts` | P8-C |
| 5 | **FOG por look** (`Look.fog`, só com a flag): `dramatic`/`neon` ganham névoa; `estudio` NUNCA (contrato canônico — teste trava); fundo gradiente segue separado do environment (já era) | `Looks3d.ts`, `Renderizador3d.ts` | P8-C |
| 6 | **`definirEnvironment(url\|null)`** preparado (§449): null = RoomEnvironment procedural canônico; url = equiretangular via TextureLoader (SEM HDRIs no repo — entrada futura sem mudar chamadores) | `Renderizador3d.ts` | §449 |
| 7 | **PoC lê o registry** (#204): `CameraRig3D` aplica o FOV do preset equivalente do `Camera3d` com a flag (fonte única — fim do vocabulário próprio de FOV) | `poc3d/CameraRig3D.tsx` | P8-B |
| 8 | **UI**: bookmarks Busto/Rosto/Costas no seletor de câmera do palco (`data-teste="p3d-cam-*"`, gated) | `shell/Palco3d.tsx` | P8-B |
| 9 | **Teste novo `camera3d.mjs`** (suíte 150→**151**): [A] node puro (FOVs, bookmarks, cobertura por categoria, limites, `enquadrar` determinística/eye-line/costas/headroom, sombra/fog por look) + [B] navegador (flags OFF sem bookmarks; ON: FOV 28/24 após transição, guard #165d, mapSize 2048 no tier alto, contact shadow com textura sempre visível, fog dramatic/estudio, `definirChao` responde, órbita com limites, zero erros JS) | `scripts/avatar/testes/camera3d.mjs`, `rodar-todos.mjs` | #83 |

## Decisões (registro #45)

- **#204** A câmera é REGISTRY consultivo + integração atrás de `as6.camera_v2`: presets/bookmarks/limites viram DADO (`Camera3d.ts`, puro e testável em node); o renderer só consome. O guard #165d é padrão (mesmo modo ⇒ nada mexe) e `forcar` existe SÓ para gesto explícito (bookmark). Enum de modos cresce aditivamente (`EstadoCamera`/`CAMERAS_3D`) — cenas salvas antigas intocadas.
- **#205** Sombras/ambiente por DADO no look (`sombra{bias,raio}`, `fog`) atrás de `as6.sombras_v2`; contact shadow procedural (zero download) fica SEMPRE visível como âncora; `definirChao`/`definirEnvironment` são APIs opt-in — `studio_matte`/RoomEnvironment permanecem o padrão byte a byte.

## Precisa do Jhony (não bloqueia)

- Validação visual 3D: console `as6.camera_v2` + `as6.sombras_v2` (+ `as6.looks`) → bookmarks no palco, sombra no tier alto, chão gloss/platform via console (`__avst3d.definirChao('gloss')` com hud3d), fog no look Dramática.

## Próxima: 1420 — Looks Hero/Dramatic/Neon/Product + pós v2 + grading + lentes da Foto (mapa claude/41).
