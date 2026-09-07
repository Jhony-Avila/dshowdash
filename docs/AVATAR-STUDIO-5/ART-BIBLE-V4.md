# ART BIBLE — V4 (PROPOSTA DE DIREÇÃO) (§80-81)

> Estado: **PROPOSTA de linguagem** para o Checkpoint 1 (§90). NÃO é lock. A
> direção só vira lock após veredito humano do Jhony. Base `dc14cd3f` (V3.2).
> Este documento descreve a linguagem V4 candidata provada nos protótipos
> `V4FACE_*`, `V4HAND_*` (render standalone, ainda NÃO no pipeline `src`).

## 0. Diagnóstico (por que V4 ≠ V3.2)
V3.2 modela forma com **fills chapados (alfa) + 1 gradiente** — lê como vetor de
app. V4 modela forma com **CAMADAS de sombra/luz SUAVES (feGaussianBlur)
seguindo planos** sob UMA luz → volume real. É uma mudança de MÉTODO de render,
não de parâmetro. (O avatar é salvo como CONFIG, não SVG; filtros no render são
seguros e o resvg/browser os suporta.)

## 1. Regra de forma
`FORM → VOLUME → MATERIAL → DETAIL → POLISH`. Silhueta e VALOR antes de detalhe.
A imagem tem de funcionar em grayscale (§57) e preto (§58).

## 2. Proporção (§15/§81)
Adulto estilizado. Cabeça ~1/7.5 do corpo (não chibi). Crânio alto, mandíbula
que afunila ao queixo. Evitar: cabeça grande, perna palito, ombro gigante, braço
tubo, cintura quadrada, pé flipper, mão desconectada.

## 3. Luz (§56) — LEI ÚNICA
KEY = superior-esquerda. FILL = frontal/direita sutil. OCCLUSION = sob as formas.
TODOS os assets respeitam. Nunca rosto de um lado, roupa de outro, cabelo de
outro. Na prática: sombra de núcleo à direita, luz de plano à esquerda-alto,
oclusão (blur) sob toda transição de plano.

## 4. Método de render (o núcleo do V4)
Por região, empilhar (todas SUAVES, blur pequeno/médio/grande):
1. **Base** — gradiente radial de forma (claro no plano-luz → escuro na borda).
2. **Core shadow** — 1 forma grande na sombra (lado direito).
3. **Occlusion** — sob cada plano (têmpora, órbita, sob-zigomático, nasolabial,
   sob-queixo, entre dedos, sob barra de roupa).
4. **Plane light** — luz nos planos que pegam a key (testa, zigomático, nós da
   mão, crista da dobra).
5. **Detail** — features/arestas nítidas SÓ onde o olho vai (olhos, ponta do
   nariz, oclusão da boca, nós).
Nunca DETALHE sobre forma fraca (§139).

## 5. Face (§21-28)
Estrutura obrigatória (não features num oval): CRANIUM · TEMPLE · BROW RIDGE ·
EYE SOCKET · CHEEKBONE (zigomático em luz) · MIDFACE · NOSE (planos, não coluna+
bolinhas) · NASOLABIAL · MOUTH (cupid's bow, lábio inf. cheio, oclusão,
comissuras) · JAW · CHIN · EAR (helix/antihelix/concha/tragus/lobe). Arquétipos
distintos por proporção (§78): high/soft/full/hollow cheeks; soft/angular/square
jaw. Male ≠ Female por ESTRUTURA (§97), não só cor/cabelo.

## 6. Hands (§16-18)
`WRIST BLOCK → PALM MASS → THENAR → THUMB → FINGER GROUPS`. Silhueta contínua
(polegar integrado à massa, não blob solto). Black test lê polegar/palma/grupo/
direção. Proto atual: legível como mão, ainda rígido (score honesto abaixo).

## 7. Feet (§19)
`ANKLE → HEEL → INSTEP → BALL → TOE BOX`; calçado: opening/vamp/quarter/heel/
sole/toe. Frontal, junto ao eixo, não triângulo/flipper.

## 8. Hair (§33-36)
`PRIMARY MASS → MAJOR CLUMPS → SECONDARY → ACCENT STRANDS`. Contorno CONTÍNUO
autoral (não círculos/lobos visíveis do V3.2; não cap/dome/blob). Afro: contorno
orgânico derivado de clumps + interior por texture groups/coils/occlusion.
Long ≠ Wavy pela MASSA (S-curves/oscilação), não só linhas internas.

## 9. Beard (§37-38)
GROWTH MAP por região (sideburn/cheek/jaw/chin/mustache/soul patch/neck) com
density/direction/length. Core masses + broken outer edge + cheek fade + skin
reveal + mustache. Não "forma preta + stubble".

## 10. Clothing (§39-44) — fashion illustration
`pattern/seam/fabric volume/shoulder/armhole/sleeve/waist/hem`. Blazer =
alfaiataria (ombro natural, roll line, gorge, button stance, waist suppression,
quarters), não superhero armor. Hoodie = capuz conectado + volume + gravidade,
não caixa. Material interage com a forma (§44): cotton diffuse, wool broad rough,
leather tight specular, technical controlled sheen, denim structured matte.

## 11. Line & value (§55/§57)
Line weight, edge softness, shadow opacity, highlight strength, curve tension,
detail density — UMA linguagem em todos os assets. Sem "engines diferentes".

## 12. Layering / occlusion (§54)
hair↔face↔ears↔headwear, beard↔mouth, clothing↔neck↔hands, outerwear↔base,
accessories↔hair, glasses↔nose/ears. Montado fisicamente, não empilhado.

## 13. Invioláveis (mantidos do contrato)
Byte-stability §651; flags de rollback (implementation flags, §7); PHP espelhado;
saves compatíveis; NÃO regravar goldens antes de APPROVED; NÃO merge/deploy.
V4 pode nascer atrás de flag interna própria se precisar de isolamento (§87).

## 14. Scores honestos dos protótipos (§66 — nada inflado)
- **Face V4 (M/F)**: ~7.5/10. Forma/volume/proporção reais; M≠F por estrutura.
  Ainda lê um pouco "3D-render" (não "fashion illustration"); nariz/planos podem
  ser mais nítidos.
- **Cabelo curto V4**: ~6.5/10. Massa esculpida com luz de coroa; hairline
  lumpy; massa um pouco flat.
- **Mão V4**: ~6.5/10. Lê como mão no black test (polegar/palma/dedos/direção);
  polegar rígido, proporção chunky. Melhor que V3.2 mas abaixo de 8.
- **NENHUM ≥8 ainda** → por §66, este é um checkpoint de DIREÇÃO, não um
  Hero Lock. Ver relatório para a pergunta de direção ao Jhony.
