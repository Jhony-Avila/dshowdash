# ART REQUEST — GOLDEN FACE LIBRARY V1 · V4.2 (FACE REVOLUTION)

> **Status:** ART SOURCE REQUIRED (§47). Diagnóstico objetivo do rosto ATUAL
> confirma **SIBLING SYNDROME** (§4): mean pixel diff entre 12 "faces
> diferentes" = **1.2/255** (limiar de identidade ≈ 12); estruturas de cabeça em
> preto = 8.2; carecas = 5.1 (ver `00_V42_FACE_MASTER.png`, `12/13/14`). Muitos
> IDs ≠ muitos personagens. **Golden Forms = AUTHORED ART, não parametrização**
> (§39). Supera e substitui o `ART_REQUEST_FACE.md` (que fica como resumo).

## Objetivo (§42/§48)
Sair de "eu escolho um rosto" para **"eu crio uma pessoa"**. A face é o principal
veículo de identidade — se genérica, todo o Studio parece genérico.

## Princípio de construção (§13) — VOLUMES, não oval + features
Reconstruir a cabeça na sequência: `cranium → temple → brow ridge → eye socket →
cheekbone → midface → mouth muzzle → jaw → chin`. **Depois** as features. Proibido
"oval + adesivos". Frame **cabeça 240×240**; consumido como `base` premium +
partes; close do stage `52 26 132 132`.

## Golden set MÍNIMO (§27/§40) — qualidade antes de quantidade
Entregar apenas, com os dois heroes:
- **4 HEAD STRUCTURES** (§6): OVAL/BALANCED · ANGULAR · ROUND · SQUARE (candidatos
  extra: HEART, LONG, TRIANGULAR). Cada uma muda **de verdade**: cranial width,
  temple width, cheekbone width, cheek volume, jaw angle, jaw width, chin width,
  chin projection, face length, lower-face ratio. **Não** `same head + jawWidth+=3`.
- **4 EYE CONSTRUCTIONS** (§16/§17): ALMOND · ROUND/OPEN · HOODED · DEEP-SET
  (candidato UPTURNED/NARROW). Cada uma: upper lid próprio, lower lid próprio,
  canthus, iris exposure, lid overlap, socket relationship. **Não** mesmo olho +
  scaleY/tilt; variar íris **não** cria olho novo.
- **4 BROWS** (§18): STRAIGHT · SOFT ARCH · HIGH ARCH · THICK (candidato
  LOW/INTENSE). Cada uma: head, body, arch, tail, hair flow, breakup. Não strokes
  iguais reposicionados.
- **4 NOSES** (§19): STRAIGHT · WIDE · NARROW · PROMINENT (candidato SHORT/ROUNDED
  TIP). Variar bridge, tip, ala, nostril, width, length — presença estrutural real.
- **4 MOUTHS** (§20): NEUTRAL · SOFT SMILE · WIDE SMILE · SERIOUS (candidato
  TEETH/DOWN-TURNED). Lábio sup./inf. com volume; canto real.
- **2 EARS** (§22): silhueta helix+lobe; interior antihelix/concha/tragus. Lê como
  orelha no target size — **não** círculo lateral.
- **3 CHEEK STRUCTURES** (§14): HIGH CHEEKBONE · FULL CHEEK · SOFT CHEEK (extra
  HOLLOW/BALANCED). Muda contour/light/shadow/midface width/eye-to-nose. **Não**
  blush/overlay/círculo colorido.
- **3 JAW/CHIN** (§15): JAW {SOFT·ANGULAR·WIDE·NARROW} × CHIN {ROUND·SQUARE·
  POINTED·BROAD·SHORT} — linguagem estrutural independente (expor subconjunto).
- **DENTES** (§21): dental arch + cantos escuros + separação sutil de incisivos —
  não linha branca nem quadradinhos.
- **EXPRESSÕES coordenadas** (§23): NEUTRAL · SOFT SMILE · HAPPY · SERIOUS
  (candidato ANGRY) — expressão afeta brows+eyelids+cheeks+mouth+nasolabial juntos.

Isso já dá **centenas de combinações** SE forem realmente distintas (§27).

## HERO FACES desta rodada (§40)
`FACE_HERO_MALE_V1.svg` e `FACE_HERO_FEMALE_V1.svg` — completos, superando
claramente tudo que existe hoje. M = mandíbula/brow ridge mais fortes, pescoço
mais grosso; F = midface mais suave, queixo menor, maçã mais alta.

## Camadas / canais / material (pipeline HeroAsset2D — entra sem código novo)
- `data-hero-layer`: `base` (massa craniana + planos), `mid` (sombra de socket/
  bochecha/mandíbula/muzzle), `light` (testa/maçã/dorso), `detail` (cílios/
  nasolabial/incisivos discretos), `occlusion` (sob queixo/orelha).
- `data-channel="pele"`; olhos/lábio/íris podem usar `destaque`. `data-material="skin"`.
- `<g data-hero="anchors">`: `topo, temporaL, temporaR, olhoL, olhoR, nariz, boca,
  bochechaL, bochechaR, mandibulaL, mandibulaR, queixo, orelhaL, orelhaR`.

## Aceite — testes OBRIGATÓRIos (§28-33/§46/§47)
1. **CHARACTER_IDENTITY_GATE (§3):** esconder os nomes → percebe pessoas
   diferentes? Métrica automatizável: mean pixel diff entre pares **≥ 12** (o
   diagnóstico atual dá 1.2–8.2 = REPROVA). Ver `tools-golden/v42face.ts`.
2. **SIBLING SYNDROME (§4):** proibido "mesma cabeça, mandíbula ±px".
3. **FACE_SHAPES_BLACK (§7):** ROUND/ANGULAR/SQUARE/HEART/LONG claramente
   diferentes em preto, sem features.
4. **REMOVE-COLOR (§29):** diversidade sobrevive em grayscale.
5. **REMOVE-HAIR (§30):** 8 carecas ainda são pessoas diferentes.
6. **REMOVE-FEATURES (§31):** 4 estruturas sem olho/nariz/boca não são o mesmo oval.
7. **TARGET SIZE (§32) / NO-LABEL (§33):** diferença perceptível no grid real, sem ler o nome.
8. **FULL CHARACTER (§37/§38):** FACE CLOSE + BUST + FULL; head/body ratio válido
   (não rosto sofisticado preso em corpo de avatar mobile).
9. Nota **FACE ≥ 8/10 absoluto** ou permanece ART SOURCE REQUIRED.

## Notas de PRODUTO (para quando a arte existir — não construídas nesta rodada)
- **Taxonomia (§5/§25/§26):** ESTRUTURA só diferença estrutural; SARDAS/MARCAS →
  categoria **DETALHES DE PELE** (overlay, não cabeça nova); ANDROIDE/HOLOGRAMA →
  **SPECIAL/THEME/SKIN STYLE**, fora do fluxo anatômico.
- **Face Structure Card (§9/§10/§36):** cabeça sem cabelo/óculos/barba, expressão
  neutra, mesma pele/luz/escala/posição, **neutral background** igual em todos,
  badge EQUIPADO periférico (§34) — portrait study, não decoração.
- **Editing visibility (§11/§12):** ao entrar em OLHOS/FACE/ORELHAS/BARBA,
  suprimir **visualmente** (ghost) o acessório que oclui — sem tirar do config.
  Regra nova: "what I edit = what dominates the viewport **AND cannot be occluded**".
- **Compat preserva DATA, não a aparência ruim do grid atual (§44).**

## Export
SVG, curvas, sem raster/texto, `data-*` presentes, placeholders de cor. Não copiar
arte de terceiros (a referência externa é piso de **identidade/diversidade**, não
de estilo — §2/§41).
