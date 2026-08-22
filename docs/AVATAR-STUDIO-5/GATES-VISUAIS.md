# GATES VISUAIS — BRIEFING_CORRETIVO_01 (§81–§86)

> Estados possíveis: `NOT_READY · CANDIDATE · REWORK · APPROVED`. `APPROVED` SÓ por análise visual humana (§86) — nunca por teste verde. Atualizado a cada rodada de Before×After (gerador: `scripts/avatar/qa-visual/before-after.mjs`; folhas enviadas ao Jhony no chat, cópia local em `scripts/avatar/testes/saida/before-after/`).

| Gate | Estado | Desde | Evidência | Observações honestas (ENGINE/ART/UX) |
|---|---|---|---|---|
| **A — 2D PREMIUM VISUAL** | `CANDIDATE` | 2026-08-22 (onda 1423) | 8 pranchas §88 | ENGINE: READY. ART: PARTIAL — rostos premium ainda "parecem irmãos" (§18: identidade por crânio/mandíbula pende); `cab_px_curto` afinou demais (rework); roupas/full/ambiente com salto claro. |
| **B — 3D PREMIUM VISUAL** | `CANDIDATE` | 2026-08-22 (onda 1423) | 8 pranchas §89 | ENGINE: READY (câmera v2 é o maior ganho; 2 bugs achados E corrigidos pelo próprio Before×After: OutputPass ausente na cadeia de pós → pele bronze; look Hero estourado → recalibrado v2). ART: **BLOCKED** (§38 — sem morphs faciais, hair cards, outfits modernos e GLBs hero, o teto é o asset CC0 atual). Pele ainda ~1 ponto acima no brilho. |
| **C — 3D UX SIMPLICITY** | `CANDIDATE` | 2026-08-22 (onda 1423) | prancha §90 | Simplificação PROVISÓRIA via `as6.ux3d_simples` (técnicos atrás de "Avançado"); a IA definitiva (§54: PERSONAGEM/ROSTO/CABELO/ROUPA/ACESSÓRIOS/CENA/FOTO) é a Fase E. |

## Tabela de assets 3D (§38)

| Categoria | Atual | Target | Status |
|---|---|---|---|
| Body | UBC superhero M/F (sem morph targets) | Premium M/F com morphs | **ART BLOCKED** |
| Face | UBC (sem facial morphs) | Golden Face + morphs | **ART BLOCKED** |
| Hair | low-poly opaco (Quaternius/UBC) | Premium cards com alpha | **ART BLOCKED** |
| Outfit | Ranger/Peasant CC0 | Executive/Casual/Urban/Sport | **ART BLOCKED** |
| Hero Props | procedural (1416/1423+) | GLBs hero | procedural refinado aceito (#163) |
| Cenários | gradiente/RoomEnvironment | Urban/Royal/Nature | **ART BLOCKED** (não é prioridade §95) |

## Como ativar o Candidate (§11–§13, interno)

- URL: `?avst_candidate=1` (desligar: `?avst_candidate=0`) — aplicado antes do 1º render.
- QA Studio (as6.qa_route/paleta) → bloco "Visual Candidate" → botão liga/desliga + matriz de flags efetivas (default/remote/local/efetiva/deps).
- Preset (§12): 2D `classico_premium, face_v2, barba_slot, brow_slot, roupa_premium, acess_2d_premium, cp_foto` · 3D `looks, material_v2, camera_v2, sombras_v2, pos_v2, foto_lentes` · UX `ux3d_simples`. Flags DEV fora.

## Quality Lock (§101)

`A = APPROVED && B = APPROVED && C = APPROVED` → só então escalar catálogo (§100/§102).
