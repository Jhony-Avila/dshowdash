# GATES VISUAIS — BRIEFING_CORRETIVO_01 (§81–§86)

> Estados possíveis: `NOT_READY · CANDIDATE · REWORK · APPROVED`. `APPROVED` SÓ por análise visual humana (§86) — nunca por teste verde. Atualizado a cada rodada de Before×After (gerador: `scripts/avatar/qa-visual/before-after.mjs`; folhas enviadas ao Jhony no chat, cópia local em `scripts/avatar/testes/saida/before-after/`).

| Gate | Estado | Desde | Evidência | Observações honestas (ENGINE/ART/UX) |
|---|---|---|---|---|
| **A — 2D PREMIUM VISUAL** | `REWORK` | 2026-08-23 (veredito Jhony) | 8 pranchas §88 | Veredito humano REWORK. **Onda 1426 atacou**: #1 cabelo feminino (era ID errado no gerador, não a arte), #2 hairline colada, #3 manchas/overlays faciais (pele integrada), #4 aura competindo. Regerar B×A 2D → novo veredito. |
| **B — 3D PREMIUM VISUAL** | `REWORK` | 2026-08-23 (veredito Jhony) | 8 pranchas §89 | ENGINE: câmera v2 preservada (ganho real). ART: **BLOCKED** (§38). Pendências onda **1427**: #5 pele plástica (recalibrar material v2), #7 bloom do Hero, #6-3D validade semântica (FAIL se a prancha não tiver cabelo/roupa/pele reais). |
| **C — 3D UX SIMPLICITY** | `REWORK` | 2026-08-23 (veredito Jhony) | prancha §90 | "Esconder em Avançado" não encerra. Onda **1427**: arquitetura de informação (PERSONAGEM→ROSTO→CABELO→ROUPA→ACESSÓRIOS→CENA→FOTO; menos chips; avatar domina o viewport). |
| **Thumbnail Clarity** | `REWORK PARCIAL` | 2026-08-23 (veredito Jhony) | 5 contact sheets | Cabelo/olhos/base/fundo APROVADOS p/ clareza. **Onda 1426**: #9 roupa vestida no corpo (~78%, sem cortar) + #10 ghost-context REAL (silhueta neutra p/ barba/aura/efeito/acess corporal — não mais só CSS). |
| **Asset Distinctiveness** | `REWORK` | 2026-08-23 (veredito Jhony) | contact sheets + shortlists | Classificação humana registrada (claude/62). Execução na onda **1427** (variantes §59, legacy §79/§80). Fundos = KEEP (falsos positivos da heurística). |

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
