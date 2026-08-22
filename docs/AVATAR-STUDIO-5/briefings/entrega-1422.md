# Onda 1422 — Body API, registry de morphs, persistência v2, postura e sockets (MEGA_BRIEFING_01 Parte 2 P2-B/P2-C/P2-E; decisões #210–#211)

> Entrega 2026-08-22 — quarta onda da Fase 2. Flags novas: `as6.corpo_v2` e `as6.corpo_grounding` (OFF, filhas de `as5.palco3d`). OFF = escala §412 e posições anteriores byte a byte (teste [B1] + golden-avatars 16/16 + suíte).

## Entregue

| # | Item | Arquivo | Ref |
|---|---|---|---|
| 1 | **BODY API `Corpo3d.ts`** (#210): fonte ÚNICA do corpo — a tabela §102 saiu da TRIPLICAÇÃO (engine/render.ts, Renderizador3d, espelho PHP) para `domain/corpo102.ts` (camada de domínio; services re-exporta); **números preservados byte a byte** (teste: mesmo OBJETO nos dois imports + paridade exata da matemática + goldens 16/16) | `services/Corpo3d.ts`, `domain/corpo102.ts`, `engine/render.ts`, `Renderizador3d.ts` | P2-B |
| 2 | **MORPH REGISTRY §315**: `MORPHS_CORPO` (ombros/tórax/cintura/braços/pernas) com bones do rig ubc-v1, eixo (xyz volume · xz circunferência) e alcance; `ENVELOPE_CORPO` (fino §102.2, escala §412, morfo ±1, segmento 0.92–1.1) — limites duros §316 | `Corpo3d.ts` | P2-B |
| 3 | **Schema body.v2** (§333): `corpoV2?: {preset?, morfos?}` OPCIONAL no AvatarConfig — neutro NUNCA persiste (morfo 0 omitido, vazio omitido); `sanitizarCorpoV2` no validarConfig; roundtrip `EstadoAvatar.body.v2` (adaptadores/contratos); **espelho PHP** (enum §102 + morfos clampados ±1, 2 casas) com `php -l` no teste; migração tipo→preset = IDENTIDADE formal (§337) | `types.ts`, `AvatarCatalog.ts`, `contratos.ts`, `adaptadores.ts`, `api/avatar/studio.php` | P2-C |
| 4 | **`aplicarCorpo3d` v2** (`as6.corpo_v2`): matemática via `resolverCorpo` (v2 vence legado); **morph targets `corpo_<id>` quando o asset tiver** (⛔ assets hoje — entrada futura sem mudar chamador), senão **BONE SCALING por segmento** (clamp envelope, restauração EXATA ao voltar p/ neutro — mapa `bonesEscalados`) | `Renderizador3d.ts` | §315/§318 |
| 5 | **Grounding** (`as6.corpo_grounding`): re-ancora os pés no chão (Box3.min.y → 0) após escala/morfos, idempotente | `Renderizador3d.ts` | §P2-E |
| 6 | **Posture profiles 3D**: `POSTURAS_3D` (5 perfis — inclinação do tronco + multiplicador de amplitude do idle procedural) consumidos por `definirPostura3d` (as6.corpo_v2 no caller; null restaura; amplitude 1 = idle byte a byte) | `Corpo3d.ts`, `Renderizador3d.ts`, `Palco3d.tsx` | §P2-E |
| 7 | **SOCKETS corporais REAIS** (§426): `SOCKETS_CORPO` (10 sockets → bone ubc-v1 + grip) + `anexarNoSocket()`/`boneDoSocket()` no renderer (busca case-insensitive com aliases — o rig real usa 'Head' maiúsculo) | `Corpo3d.ts`, `Renderizador3d.ts` | P2-E |
| 8 | **REGIOES_UBC com ALIASES** (§P2-C): `ALIASES_BONES` (mixamo/Quaternius → ubc-v1) + `normalizarBone` no matching do `mascararBase` — aditivo (nome canônico intocado; assembler.mjs verde) | `Corpo3d.ts`, `Assembler3d.ts` | P2-C |
| 9 | **`bodyCompatibility`** no schema do manifest v2 (campo opcional consultivo — morfos/presets suportados pelo asset; nunca muda render de salvos) | `schema-manifest-v2.json` | P2-C |
| 10 | **Teste `corpo3d-v2.mjs`** (suíte 153→**154**): [A] snapshot §102 + mesmo objeto domain/services + paridade exata (30 combinações preset×fino) + v2/clamps/sanitizar/migração/posturas/sockets/aliases + validarConfig + espelho PHP com php -l; [B] navegador com **base_superhero_m (rig real)**: B1 flags OFF corpoV2 não muda escala; B2 preset v2 aplica §102, clavicle escala 1.1 e RESTAURA no neutro, socket mao_d pendura em hand_r, postura heroica inclina −0.05 e null restaura, grounding mantém pés no chão, zero erros JS | `scripts/avatar/testes/corpo3d-v2.mjs`, `rodar-todos.mjs` | #83 |

## Decisões (registro #45)

- **#210** O corpo vira BODY API de dado (`Corpo3d.ts` + `domain/corpo102.ts`): tabela §102 única (fim da triplicação — números idênticos travados por teste + goldens), schema body.v2 opcional com neutro-nunca-persiste e espelho PHP, migração tipo→preset como identidade formal. O dado `corpoV2` é aceito SEMPRE (forward-compat, como params §71); o CONSUMO 3D fica atrás de `as6.corpo_v2`.
- **#211** Morfos aplicam por morph target real quando existir e por bone scaling como fallback (restauração exata registrada); grounding é flag separada (`as6.corpo_grounding`); posturas/sockets/aliases são DADO consultivo do registry. Itens do mapa cobertos por infra existente, registrados sem código novo: "ocupação de costas" já é do AcessoriosRegistry (occupancy 1416), "cards de silhueta" ficam no corpo-benchmark (1409) até haver morphs reais, "body lock no Photo" já vale por contrato (§ tipos: a foto nunca recebe corpo/roupa; capturas 3D não alteram corpo).

## Precisa do Jhony (não bloqueia)

- Validação visual: console `as6.corpo_v2` (+ `as6.corpo_grounding`, `as5.morfos3d`) → tipo corporal robusto no 2D reflete no 3D, morfos via console (`__avst3d.definirCorpo3d({v2:{preset:'robusto',morfos:{ombros:1}}})`), postura, pés no chão.
- UI de sliders de morfos no Creator: registrada p/ onda de UI (dado e API prontos).

## Próxima: 1423 — Acessórios 3D: âncoras em dados + Hero procedural refinado (mapa claude/41).
