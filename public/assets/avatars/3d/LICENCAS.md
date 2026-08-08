# Licenças dos assets 3D — Avatar Studio 4.0 (PoC)

Regra do projeto (decisão #28): TODO asset 3D tem origem e licença documentadas
aqui ANTES de entrar no repositório. Licença ambígua = uso proibido.
Todos os arquivos abaixo foram RETRABALHADOS pelo nosso pipeline
(remoção de animações não usadas, dedup, resample, prune, compressão Meshopt
via gltf-transform) — a base permanece CC0, o resultado é tratado como
asset interno da Dshow.

| Arquivo | Base original | Autor | Licença | Fonte |
|---|---|---|---|---|
| `humano_casual.glb` | Casual_Hoodie — Ultimate Modular Men Pack (fev/2022) | Quaternius | CC0 1.0 | https://quaternius.com/packs/ultimatemodularcharacters.html |
| `humano_terno.glb` | Suit — Ultimate Modular Men Pack | Quaternius | CC0 1.0 | idem |
| `humano_punk.glb` | Punk — Ultimate Modular Men Pack | Quaternius | CC0 1.0 | idem |
| `humano_aventureiro.glb` | Adventurer — Ultimate Modular Men Pack | Quaternius | CC0 1.0 | idem |
| `animal_pug.glb` | Pug — Ultimate Animated Character Pack | Quaternius | CC0 1.0 (License.txt do pack) | https://quaternius.com/packs/ultimatedanimatedcharacter.html |
| `androide.glb` | RobotExpressive (exemplos oficiais do Three.js) | Tomás Laulhé (design), Don McCurdy (modificações) | CC0 1.0 | https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive |

## Onda 611+ — pacotes UBC (megas 611-620, 2026-08-07)

Fontes em `storage/assets-3d-fonte/` (fora do git); comprovantes = os
próprios `License*.txt` dentro de cada zip extraído. Todos **CC0 1.0
Universal** (verificados arquivo a arquivo em 2026-08-07 antes de qualquer
publicação — regra §43/§511).

| Pacote (zip) | Pasta fonte | Autor | Licença | Comprovante |
|---|---|---|---|---|
| Universal Base Characters [Standard] | `ubc-standard-v1/` | Quaternius | CC0 1.0 | `…/Universal Base Characters[Standard]/License_Standard.txt` |
| Modular Character Outfits - Fantasy [Standard] | `outfits-fantasy-v1/` | Quaternius | CC0 1.0 | `…/Modular Character Outfits - Fantasy[Standard]/License_Standard.txt` |
| Universal Animation Library [Standard] | `anim-lib-v1/` | Quaternius | CC0 1.0 | `…/Universal Animation Library[Standard]/License.txt` |
| Universal Animation Library 2 [Standard] | `anim-lib2-v1/` | Quaternius | CC0 1.0 | `…/Universal Animation Library 2[Standard]/License.txt` |

Personagens publicados desta origem trazem `licenca.comprovante` no
manifest §517 apontando pro txt correspondente. Rig canônico: 65 bones
(`scripts/avatar/assets3d/rig-ubc-v1.json`) — IDÊNTICO em bases, cabelos
e roupas modulares (verificado; é o que viabiliza o assembler §406).

Notas de conformidade:

1. CC0 1.0 dispensa atribuição e permite uso comercial e modificação —
   os créditos acima são cortesia e rastreabilidade interna.
2. O nó `Pistol` do modelo Suit é OCULTADO em runtime (não usamos armas).
3. Nenhum asset da Mixamo/Adobe, Ready Player Me ou de licença ambígua
   foi utilizado (decisão #28, itens 9–10).
4. Pipeline reproduzível: `dedup → resample → prune → meshopt (nível medium)`
   com @gltf-transform/cli; animações mantidas: 6 por humano
   (Idle, Idle_Neutral, Wave, Punch_Right, Roll, Walk), 6 no pug,
   14 originais no androide (contém os morph targets Angry/Surprised/Sad).
