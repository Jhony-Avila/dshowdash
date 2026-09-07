# ART REQUEST — GAME CHARACTER BODY (5 perfis) · V4.1

> **Status:** ART SOURCE REQUIRED. A engenharia (anatomiaCorpo, perfis, fit,
> footwear, focus) está pronta e congelada. A tentativa procedural de corpo por
> massas (ver `V41_BODY_BLACK.png`) ficou **coerente mas ~6** — não bate o alvo
> "game character creator ≥8". Este documento é o spec para autorar o corpo na
> ferramenta visual e importar pelo pipeline (`HeroAsset2D`). **Não promover a
> tentativa procedural.**

## Objetivo
Reconstruir a LINGUAGEM DO CORPO por **massas perceptíveis na silhueta preta**,
para que o personagem leia como um character creator de game — e não como
manequim procedural. A distinção matemática entre perfis JÁ existe; o alvo aqui
é **qualidade de forma**.

## Entregar
5 corpos autorados (um `.svg` por perfil), frame **corpo (240×400)**, seguindo
`docs/AVATAR-STUDIO-5/V4_HERO_ASSET_TEMPLATE.svg` (convenção `data-hero-layer` /
`data-channel` / `data-material` / `<g data-hero="anchors">`):
`BODY_SLIM.svg` · `BODY_STANDARD.svg` · `BODY_ATHLETIC.svg` · `BODY_ROBUST.svg` ·
`BODY_FEMALE.svg`.

## Canvas e âncoras (fonte: engine/partes/corpo `anatomiaCorpo`)
240×400, origem 0,0, cx=120. Âncoras verticais do STANDARD (as demais escalam
pela anatomiaCorpo — o motor reposiciona a peça):
`yNuc 104 · yOmb 122 · yPei 150 · yCin 192 · yQua 220 · yEnt 236 · yJoe 298 ·
yTor 356 · yPe 372`. Meias-larguras STANDARD: `ombro 47 · peito 42 · cintura 30
· quadril 36 · coxa 19`.

Declarar em `<g data-hero="anchors">`: `nuca, ombroL, ombroR, peito, cintura,
quadrilL, quadrilR, joelhoL, joelhoR, tornozeloL, tornozeloR, cx`.

## Massas obrigatórias (têm de LER EM PRETO, sem linha interna)
`RIBCAGE · PELVIS · SHOULDER GIRDLE · DELTOID · UPPER ARM · ELBOW · FOREARM ·
HAND · THIGH · KNEE (compressão) · CALF (pico) · ANKLE (taper) · FOOT`.
Mesmo estilizado, cada massa precisa aparecer no contorno.

## Pescoço / mannequin fix (§4)
Pescoço **curto e largo**, com transição de **trapézio** (rampa clavícula→ombro).
A cabeça **não** pode parecer encaixada num tubo. Relação clavícula/ombro visível.

## Postura (§5) — NEUTRAL GAME CHARACTER CREATOR STANCE
Leve distribuição de peso; ombros levemente diferentes; braços relaxados;
cotovelos sem lock; mãos com leve rotação; pernas **não** dois postes. Sutil,
apenas humano — nada dramático, mantém simetria de leitura para vestir roupa.

## Linguagem por perfil
- **SLIM:** ossatura fina, membros longos, massa mínima — ainda com ribcage/pelve.
- **STANDARD:** referência equilibrada.
- **ATHLETIC (§18):** cintura escapular maior, deltoide, chest/ribcage, waist
  taper, coxa/panturrilha fortes — SEM linhas de músculo.
- **ROBUST (§17):** MASSA, não escala X — distribuir ribcage, abdômen, pelve,
  braços, antebraços, coxas, panturrilhas.
- **FEMALE (§16):** linguagem própria (relação ombro/pelve, ribcage, transição de
  cintura, coxa, massa de braço, stance). SEM estereótipo, SEM "male scaled down".

## Camadas / canais / material
- `data-hero-layer`: `base` (silhueta de pele), `mid` (planos de sombra das
  massas), `light` (realces de crista), `occlusion` (vãos: axila, entreperna,
  vinco do joelho), `shadow` (contato no chão).
- `data-channel="pele"` na base (customização de tom); membros = pele.
- Sem material obrigatório (pele nua); calça/sapato neutros são do scaffold.

## Aceitação (§19, §30)
- **BLACK SILHOUETTE** lê como corpo humano estilizado, com massas distinguíveis.
- Os 5 perfis se distinguem por FORMA (não só largura).
- Pescoço/cabeça assentam natural.
- Pernas com thigh→knee→calf→ankle (não tubo) — provado em preto.
- Nota ≥8 "game character creator". Abaixo disso: continua ART SOURCE REQUIRED.

## Referências visuais necessárias (o ilustrador deve consultar)
Character creator bodies estilizados 2.5D (ex.: base meshes de character creator
de games AA estilizados), tabelas de proporção masculina/feminina estilizada,
estudos de massa (Loomis simplificado). **Não copiar arte de terceiros** —
usar como referência de proporção/massa.

## Export
SVG, curvas (não outline expandido excessivo), sem raster embutido, sem texto,
`data-*` da convenção presentes, placeholders de cor só p/ leitura.
