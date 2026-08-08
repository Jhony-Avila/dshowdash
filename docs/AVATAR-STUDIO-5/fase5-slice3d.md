# AS5 — Fase 5: Vertical Slice 3D (§630–§631; P8 §398–§537)

**Fontes lidas:** §630–§631 na íntegra · P8 completa via índice (§398–§537) + normativas §400–§402 (arquitetura/contrato), §406 (assembler), §481 (fallback).

## Situação: DESBLOQUEADA (2026-08-07 — zips UBC no servidor)

O Jhony entregou os 4 pacotes (CC0, comprovantes em LICENCAS.md):
UBC Standard (bases Superhero M/F + 6 cabelos + 2 sobrancelhas) ·
Modular Character Outfits - Fantasy (Ranger/Peasant M/F por PARTE:
Body/Arms/Legs/Feet/Hood/Pauldrons) · Universal Animation Library 1 e 2
(250+ clipes em GLB). Fontes em `storage/assets-3d-fonte/` (fora do git).
**Rig verificado: 65 bones IDÊNTICOS em bases, cabelos e roupas** —
rig-ubc-v1.json preenchido; o assembler §406 monta partes no MESMO
esqueleto. Onda 611–710 em execução (mapa: doc 18 do projeto Claude).

Histórico (situação até 2026-08-06): bloqueada no zip; este doc entregou
o que não dependia dele (abaixo).

## Entregue AGORA (sem UBC)

1. **Contrato §401 no núcleo** — `src/nucleo/renderizador.ts`
   (`RenderizadorAvatar`, dependência-zero, nomes pt-BR mapeados 1:1 ao
   briefing). Inclui `pendenciasPara()` (§481): o chamador sabe o que um
   renderer NÃO representa e decide o aviso de fallback.
2. **Renderer 2D sob o contrato** — `src/services/Renderizador2d.ts`: prova
   executável do contrato (§401 lista "renderer 2D"). aplicarEstado pinta o
   SVG determinístico; pausar congela SMIL (§404); capturar é estático e
   determinístico (§508). 9 asserções headless no nucleo.test.
3. Mapa JÁ-EXISTE × FALTA e decisão de integração (abaixo).

## JÁ-EXISTE (PoC src/poc3d/, ~1.900 linhas)

Detecção WebGL2 + recado de fallback 2D (§481 parcial) · Estúdio 3D com
sockets leva 1 (Acessorios3D: coroa/óculos/asas/pet…) · morfos básicos ·
cenário/hora/clima (Cena3D/Clima3D) · poderes (Poder3D) · câmera rig ·
HUD de FPS/memória (§484 parcial) · retomada de config_3d salvo.

## FALTA (ordem do §535/§536, tudo pós-UBC)

Rig oficial §410 + facial §411 → Character Assembler §406 (pipeline de 14
passos) → roupas/body-masks §415–§417 → materiais PBR/canais §418–§421
(canais 3D = MESMO vocabulário §73 já entregue no 2D) → cabelo/barba §423–
§425 → animation manager/state machine §432–§433 → LOD/otimização §461–§469
→ carregamento progressivo §470–§478 → quality manager §482–§483 → captura
§506–§509 → homologação §487–§495 → gate §631.

## Gate §631 (copiado — critério de saída da F5)

rig estável · troca de roupa estável · clipping aceitável · FPS adequado ·
memória estável · carregamento progressivo · captura funcional · descarte
correto · quality manager · fallback · compatibilidade com Photo Studio.

## Decisão de integração (registrada)

**NÃO ligar o Estudio3D atual ao AvatarStore neste turno.** Motivo técnico:
o §406 (Character Assembler) reestrutura o miolo do Estudio3D quando os
assets UBC chegarem; acoplar o store ANTES do assembler = integrar duas
vezes. O caminho pronto está pavimentado: `deLegado3d` (F1) converte o
config_3d para EstadoAvatar, e o contrato §401 define a interface que o
`Renderizador3d` implementará POR CIMA do assembler. Quando o UBC chegar:
(1) assembler §406 → (2) Renderizador3d sob o contrato → (3) comandos/undo
3D no store (mesmo padrão 2D) → (4) gate §631.
