# RENDERER ARCHITECTURE — os dois renderers, contratos compartilhados e auditoria de iluminação (v1 · onda 1405 · MEGA_BRIEFING_01 §3044, §3050–§3052, Parte 8 §2030.1)

> Fotografia do código em `main b0331d62` (2026-08-19). Objetivo: (a) documentar a separação render/state/catalog/materials/camera/vfx/ui/qa (§3051); (b) registrar a **auditoria de iluminação** (3 vocabulários) que a onda 1408 unifica no `Looks3d.ts`; (c) listar os "no undocumented magic" (§3047) conhecidos. Caminhos relativos a `public/components/panels/panel-avatar-studio/src/`.

## 1. Mapa de camadas (o que é o quê)

| Camada | 2D Clássico (SVG) | 3D (Three.js) | Compartilhado |
|---|---|---|---|
| **render** | `engine/render.ts` (`renderAvatar`, `ORDEM_CAMADAS`, busto 240×240, corpo 240×400, `uid = hashConfig`), `engine/render-foto.ts`, `engine/particulas.ts`, `engine/sobrepecas.ts`, `engine/params.ts` (§71 wrappers) | `services/Renderizador3d.ts` (palco do shell: montar/luzes/câmera/LOD/captura/pós/watchdog), `poc3d/*` (PoC R3F: `Cena3D`, `Personagem3D`, `Acessorios3D`, `CameraRig3D`, `Clima3D`, `Poder3D`, `Estudio3D`) | `nucleo/renderizador.ts` (contrato), `services/FabricaRenderizador.ts`, `services/Renderizador2d.ts`/`Renderizador3d.ts` adaptadores, `services/AvatarUniversal.ts` (UAC) |
| **arte/assets** | `engine/partes/*` (393 `ParteDef` — **intocáveis**; premium em `partes/premium/*` a partir da 1411), `engine/base-api.ts` (`G`, `PATH_OMBROS`, `ParteDef`), `engine/cores.ts`/`cor-hsl.ts` (paleta, `tinta()`) | `public/assets/avatars/3d/{personagens,partes,animacoes}` + manifests §517; `services/Partes3d.ts`, `Personagens3d.ts`, `Assembler3d.ts` (rebind rig ubc-v1, body masking), `Animacoes3d.ts`, `Poses3d.ts`, `CacheAssets3d.ts`/`CacheNiveis.ts` (LOD/IDB) | `services/AvatarCatalog.ts` (catálogo, `validarConfig`, `CONFIG_PADRAO`), `services/ManifestCatalogo.ts`, `MetadadosAssets.ts`, `VariantesAssets.ts`, `workspace/acessorios.ts` (slots/subcategorias), `workspace/taxonomia.ts` |
| **state** | `nucleo/estado.ts` (store + undo/redo), `nucleo/estado-vnext.ts` (schema/migrações/capabilities), `nucleo/contratos.ts` (`EstadoAvatar`, `SLOTS_EQUIPAMENTO`, regras §617), `nucleo/migracoes.ts`, `services/EstadoService.ts`/`AvatarService.ts` (§619 espelho), `api/avatar/studio.php` (validação PHP espelhada) | idem + `poc3d/catalogo3d.ts` (`Config3D`, `validarConfig3d`, sockets, iluminação/câmera/clima persistidos) | `nucleo/flags.ts` (flags + `DEPENDENCIAS_FLAGS`), `nucleo/adaptadores.ts` |
| **materials** | (tokens 2D a criar: `engine/materiais2d.ts`, 1411) | `services/Materiais3d.ts` (tint multiplicativo por canal §73, restore, dedupe, dispose, `TETO_EMISSIVO`), famílias a criar (`services/FamiliasMaterial.ts`, 1408) | canais `SlotCor` pele/cabelo/roupa/destaque + `coresCamada` |
| **camera** | `components/PalcoCinema.tsx` (CAMERA_BUSTO/CORPO, parallax), `shell/ShellStudio.tsx` (`ENQUADRAMENTOS` por categoria, `PRESETS_CAM6` rosto/busto/corpo), `shell/foco.ts` | `Renderizador3d.definirCamera/enquadrar` (retrato/corpo/orbita/cinematica, Box3, bone Head), `poc3d/CameraRig3D.tsx` + `catalogo3d.CAMERAS` (corpo/busto/rosto/tresquartos por arquétipo, fov 34), `services/Cenas3d.ts` (snapshots) | registry a criar (`services/Camera3d.ts`, 1419) |
| **vfx/ambiente** | `engine/partes/{auras,efeitos,fundos,molduras}.ts`, `engine/particulas.ts`, `workspace/palco.ts` (fundos/horas/luzes/climas CSS `data-*`), `workspace/ClimaOverlay.tsx`, `ComposicaoPalco.tsx`, `BarraCenas.tsx`, `services/EfeitosFuncionais.ts`, `PoderesFamilia.ts` | `Renderizador3d` (`definirAura3d` torus, `definirParticulas3d`, `definirRim`, `definirFundo`, `definirAmbiente`), PoC `Clima3D`/`Poder3D`/`Cena3D` (hora/clima/cenário) | `EstadoAvatar.presentation/environment`; registries a criar (`RegistroEfeitos`, `RegistroCena`, `DiretorApresentacao`, 1417/1425) |
| **ui** | `app/App.tsx` (clássico), `shell/*` (ShellStudio, Palco3d, Equipados, DetalheAsset, PropriedadesAsset…), `components/*` (GradeItens, AvatarSvg, Foto, Cores, Vitrine…), `workspace/*` (DockAssets, BarraTopo…) | `shell/Palco3d.tsx` (host do `Renderizador3d`), `poc3d/Estudio3D.tsx`, `Hud3D.tsx` | `styles/tokens.css`, `estudio.css`, i18n |
| **qa/obs** | `scripts/avatar/testes/*` (140 testes; `golden-avatars.mjs` = bytes), `scripts/avatar/medir-foco-item.mjs`, `gerar-harness.mjs` | `scripts/avatar/assets3d/*` (publicar/validar/thumbs/índice), `services/QualityManager.ts`, `Capacidade3d.ts`, `PerfBaseline.ts`, `Telemetria.ts`, `shell/TelemetriaDev.tsx`, `poc3d/Hud3D.tsx` | `docs/AVATAR-STUDIO-6/golden-avatars.json`, `baseline-layout.json`; a criar: regressão visual (1407), rota de QA (1410) |

Regra §3050: nenhum "componente gigante" novo — renderer, UI, catálogo, materiais, câmera ficam em módulos separados. Regra §3052: preservar o que é bom; reescrever só se bloquear o quality bar.

## 2. Fluxo de render (resumo)

**2D**: `AvatarConfig` → `validarConfig` (omite neutros; forward-compat) → `renderAvatar(config, {uid, palco?, corpo?})` → defs (gradientes por `uid`) + camadas na `ORDEM_CAMADAS` (fundo → banner → aura → efeito atrás → base/roupa/roupa_sobre/emblema/boca/olhos/cabelo/acessórios → efeito frente → moldura) → SVG string (sanitizado no PHP na publicação). Palco adiciona vida (blink/respiração/parallax/olhar) por WAAPI **fora do SVG salvo**.

**3D**: `EstadoAvatar` + `Config3D` → `Renderizador3d.montar()` (renderer sRGB + ACES exposição 1.0 + PCFSoft 1024 + PMREM RoomEnvironment 0.55 + luzes canônicas + chão disco 0.34) → `carregarPersonagem` (manifest §517 → LOD por tier/tela, progressivo lod2-primeiro) → `Assembler3d.montarPersonagem` (rebind partes no rig ubc-v1, body masking §415.2, pendências) → `Materiais3d.aplicarPipelineCores` (tint por canal, teto emissivo) → `aplicarCorpo3d` (escala) → animações/vida → `definirCamera`/`enquadrar` → `definirPos` (composer bloom 0.32/0.5/0.85 + vinheta fora do econômico) → laço com tier adaptativo/DPR → `capturar()` determinístico. Watchdog de contexto reaplica estado.

## 3. Auditoria de iluminação (§2030.1) — TRÊS vocabulários hoje (onda 1408: registry `services/Looks3d.ts` criado — `estudio@1` = canônico byte-idêntico, `soft/cool/neon` = aliases de quente/fria/neon, `portrait/dramatic` novos sob `as6.looks`; tabela abaixo = estado ANTES)

| Caminho | Preset(s) | Valores | Problema |
|---|---|---|---|
| `services/Renderizador3d.montar()` (palco do shell) | canônico | key `0xffffff` 2.6 @ (2.2, 3.0, 2.6) · fill `0x9db4ff` 1.1 @ (−2.4, 1.2, −1.6) · ambient `0xffffff` 0.55 · env 0.55 · exposição 1.0 · sombras PCFSoft 1024 (real fora do econômico) · chão disco 0.34 · fundo `definirFundo` neutro/estudio/grade | **é o "Studio v1"** — vira `Looks3d.estudio@1` byte-idêntico |
| `Renderizador3d.definirLuz()` | `estudio` (= canônico) · `quente` (0xffd9a0 2.9 / 0xff9d5c 0.9 / amb 0.5) · `fria` (0xcfe4ff 2.7 / 0x6c8cff 1.2 / 0.45) · `neon` (0xff5f8f 2.4 / 0x4cd9e8 1.6 / 0.35) | só cor/intensidade; rim (`definirRim` 2.4, posição fixa), ambiente, exposição e fundo **não** fazem parte do preset | aliases no registry: quente→`soft`, fria→`cool`, neon→`neon` |
| `poc3d/Cena3D.tsx LUZES` (PoC R3F) | `estudio` (hemi #cdd6ff/#171320 0.65 · key #fff2e0 2.6 · fill #a9b6ff 0.7 · rim destaque 2.2) · `dramatica` (hemi 0.22 · key #ffe6c4 3.4 · fill #31406e 0.35 · rim 3.2) · `neon` | rig diferente do shell (hemisphere + rim na cor de destaque; horas sobrescrevem key/ambiente/fundo) | PoC lê do registry com fallback aos valores atuais (1408/1420) |
| `workspace/palco.ts LUZES_PALCO` (2D) | `neutra` `quente` `fria` `dramatica` via CSS filter (`estudio.css`) + `LUZ_POR_HORA` (auto) | apresentação 2D; não persiste no avatar | mesma nomenclatura do registry (`as6.classico_luz`, 1417) |
| `scripts/avatar/assets3d/gerar-thumbs-3d.mjs` | canônico (mesmas 3 luzes) | **sem** tone mapping ACES e **sem** environment → thumb ≠ palco (§1880) | corrigir na 1408 (#165c), regenerar thumbs em commit próprio |

Câmera: `definirCamera` retrato usa `maior*0.5/0.9` e fov fixo (32 no shell, 34 na PoC); `OrbitControls` do shell min 0.6/max 8 **sem limite polar**; `Palco3d.tsx` reaplica `definirCamera` em cada mudança de `estado` (#165d). Sombras: mapSize fixo 1024, bias default, shadow camera near 0.5/far 12 fixos.

## 4. "No undocumented magic" (§3047) — valores mágicos a migrar para registries

- `Renderizador3d`: luzes canônicas (acima), rim 2.4, bloom (0.32/0.5/0.85), chão 0.85/0.34, exposição clamp 0.6–1.6, ambiente 0–1.2, `enquadrar` offsets, LOD por tier.
- `poc3d/Acessorios3D.tsx`: ~15 pares metalness/roughness + `DESLOC/ROT/AJUSTE/OSSOS` por socket (→ registry de âncoras, 1423; famílias de material, 1408).
- `poc3d/catalogo3d.ts CAMERAS` (fov 34, distâncias por arquétipo) e `Renderizador3d.CORPOS_3D` (duplicado de `render.ts TIPOS_CORPO`) → `Camera3d.ts` (1419) / `Corpo3d.ts` (1422).
- 2D: `engine/cores.ts tinta()` (misturas fixas 0.32/0.28/0.52), `BRILHO` dos cabelos, `CENTRO_ESCALA` dos params, `FOCO_ITEM_*` (já em dados).

## 5. Contratos que NÃO mudam nesta frente

`AvatarConfig` serialização (campo neutro omitido), `ORDEM_CAMADAS` atual (derivada de `CAMADAS_Z` com teste de igualdade a partir da 1411), `CONFIG_PADRAO`, 16 goldens de bytes, `SlotCor` (4 canais), `SOCKETS_3D` (14), rig `ubc-v1` (65 bones), manifest §517 v1 (v2 é superset), `api/avatar/studio.php` (só cresce: enums/categorias/campos opcionais), flags existentes.

## 6. Fallbacks (§2924–§2936, §2964–§2968)

3D falha → clássico (o 2D é sempre disponível); WebGL ausente → `p3d-indisponivel` com retry; contexto perdido → watchdog reidrata; composer falha → `composerReal=false` (CSS filter); asset falha → pendência + fallback (nunca tela branca); tier adaptativo desce antes de travar; flags OFF = comportamento anterior byte a byte.
