# Manifesto de modelos 3D — sockets de acessório (Avatar Studio 3D)

Fonte: `poc3d/catalogo3d.ts` (SOCKETS_3D, ITENS_SOCKET) e `poc3d/Acessorios3D.tsx`
(tabelas OSSOS = socket→osso, DESLOC = offset base, ROT = orientação, AJUSTE = ajuste
fino por arquétipo, ESCALA_ARQ = escala global). Alinhamento é calculado 0.6 s após o
crossfade bind→idle assentar (evita item torto em T-pose).

**Regra honesta (decisão #54 + diretriz do Jhony):** os 9 itens da "leva 1" são
PROCEDURAIS (geometria em código), **não** GLBs nativos — ficam preservados como legado
identificado, nunca apresentados como "Disponível em 3D". Nada de nova arte procedural para
simular arte ausente. O catálogo 2D inteiro **não** é forçado no 3D (modelos disjuntos).

## Escala e orientação (comuns a todos os sockets)

- Escala global por arquétipo (`ESCALA_ARQ`): humano `1.0` · androide `1.25` · animal `1.1`.
- Orientação: identidade + `ROT[socket]` (Euler por socket, radianos); GLB deve exportar em
  **metros**, +Y para cima, frente em +Z, pivô na base útil da peça.
- Pivô/posição: `osso.matrixWorld` + `DESLOC[socket]` + `AJUSTE[arquétipo][socket]`.
- Ajuste fino conhecido (`AJUSTE`): androide `head [0,0.42,0]`, `face [0,0.24,0.22]`,
  `back [0,-0.08,0.02]`; animal `head [0,0.16,0.02]`, `face [0,0.12,0.14]`, `back [0,-0.02,0.08]`.

## Manifesto por socket

| socket | nome (UI) | asset 2D correspondente | GLB necessário | osso/socket | escala | orientação | pivô | estado |
|---|---|---|---|---|---|---|---|---|
| head | Cabeça | acessorio · slot `cabeca` | `acessorio_head_<id>.glb` | `Head` | ESCALA_ARQ | ROT.head | Head + DESLOC.head + AJUSTE | procedural (Coroa, Halo) — legado, NÃO nativo |
| face | Rosto | acessorio · slot `rosto` | `acessorio_face_<id>.glb` | `Head` | ESCALA_ARQ | ROT.face | Head + DESLOC.face + AJUSTE | procedural (Óculos Neon) — legado |
| eyes | Olhos | categoria `olhos` (2D) | `acessorio_eyes_<id>.glb` | `Head` (convenção) | ESCALA_ARQ | ROT.eyes | Head + DESLOC.eyes | vazio — aguarda arte 3D |
| ears | Orelhas | acessorio · slot `orelha` | `acessorio_ears_<id>.glb` | `Head` (convenção) | ESCALA_ARQ | ROT.ears | Head + DESLOC.ears | vazio — aguarda arte 3D |
| neck | Pescoço | acessorio · slot `pescoco` | `acessorio_neck_<id>.glb` | `Neck` → `Head` | ESCALA_ARQ | ROT.neck | Neck + DESLOC.neck | procedural (Colar Estelar) — legado |
| shoulders | Ombros | — (sem 2D direto) | `acessorio_shoulders_<id>.glb` | `ShoulderL/R` (convenção) | ESCALA_ARQ | ROT.shoulders | ombro + DESLOC | vazio — aguarda arte 3D |
| back | Costas | acessorio · slot `costas` | `acessorio_back_<id>.glb` | `Spine`/`Spine2` (convenção) | ESCALA_ARQ | ROT.back | Spine + DESLOC.back + AJUSTE | procedural (Jetpack, Asas) — legado |
| waist | Cintura | acessorio · slot `cintura` | `acessorio_waist_<id>.glb` | `Hips`/`Spine` (convenção) | ESCALA_ARQ | ROT.waist | Hips + DESLOC.waist | vazio — aguarda arte 3D |
| wrist_l | Pulso esq. | acessorio · slot `pulso_e` | `acessorio_wrist_l_<id>.glb` | `WristL`/`Wrist.L` (convenção) | ESCALA_ARQ | ROT.wrist_l | pulso + DESLOC | vazio — aguarda arte 3D |
| wrist_r | Pulso dir. | acessorio · slot `pulso_d` | `acessorio_wrist_r_<id>.glb` | `WristR`/`HandR`/`LowerArmR` | ESCALA_ARQ | ROT.wrist_r | pulso + DESLOC | vazio — aguarda arte 3D |
| hand_l | Mão esq. | acessorio · slot `mao_e` | `acessorio_hand_l_<id>.glb` | `HandL`/`Palm2L` (convenção) | ESCALA_ARQ | ROT.hand_l | mão + DESLOC | vazio — aguarda arte 3D |
| hand_r | Mão dir. | acessorio · slot `mao_d` | `acessorio_hand_r_<id>.glb` | `WristR`/`HandR`/`Palm2R`/`FistR`/`LowerArmR` | ESCALA_ARQ | ROT.hand_r | mão + DESLOC.hand_r | procedural (Cetro Arcano) — legado |
| companion | Companheiro | acessorio · slot `companheiro` | `companheiro_<id>.glb` | — (orbital, sem osso) | ESCALA_ARQ | animado | órbita ao redor do corpo | procedural (Drone) — legado |
| pet | Pet | acessorio · slot `flutuante`/`companheiro` | `pet_<id>.glb` | — (orbital/chão) | ESCALA_ARQ | animado | órbita/chão | procedural (Bit) — legado |

## Resumo

- **NATIVE_3D (GLB real):** 6 personagens — `humano_casual/terno/punk/aventureiro.glb`,
  `androide.glb`, `animal_pug.glb` (não são sockets; são os arquétipos/variantes).
- **Legado procedural (não nativo):** 9 itens em 7 sockets (head, face, neck, back, hand_r,
  companion, pet).
- **Sockets aguardando arte 3D (MISSING_MODEL):** eyes, ears, shoulders, waist, wrist_l,
  hand_l — e substituição dos procedurais por GLB nativo nos 7 acima.
- **Bloqueio:** cada GLB por socket precisa ser autorado/curado (CC0 ou próprio) seguindo a
  convenção de escala/orientação/pivô acima; sem o arquivo, o card mostra "Modelo 3D necessário"
  (desativado), sem simular.
