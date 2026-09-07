# Art Bible — Golden V3.2 (FINAL ART LOCK)

> Decisão #219 · trilho `golden/art-wip` · arte atrás de `as6.arte_v2` (default OFF).
> Estado do Gate A: **REWORK** até veredito humano do Jhony. Este documento é a
> referência de LINGUAGEM VISUAL da arte premium 2D `_px_` (motor SVG atual —
> svgDe/renderAvatar/corpoInteiroPremium). Regras específicas do briefing
> prevalecem sobre boas práticas genéricas.

## 0. Alvo visual
High-end **stylized character illustration** / **premium 2.5D character creator**.
NÃO: avatar de app, corporate vector, mobile cartoon, Flash builder, clipart,
boneco vetorial procedural, "shapes com gradientes". O teste final é o **ART
DIRECTOR TEST**: olhando SÓ o PNG (sem código), parece character creator de game
profissional? Se não, continua o trabalho.

## 1. Regra artística de ordem
`FORM → VOLUME → MATERIAL → DETAIL → POLISH`. Nunca DETALHE sobre FORMA FRACA.
Silhueta primeiro (black test), depois valor, depois material/detalhe.

## 2. Autoria vs procedural (regra-mãe)
- **PROCEDURAL** = fit / anchors / palette / composição (anatomiaCorpo posiciona;
  mangaCurta/Longa vestem o braço; paleta injetada).
- **AUTHORED** = silhueta / anatomia / formas faciais / clumps de cabelo /
  construção de roupa. A FORMA PRIMÁRIA é desenhada peça a peça, com control
  points próprios — **não** sai de um helper genérico paramétrico compartilhado.

## 3. Shape language / coesão
Uma linguagem só entre face, cabelo, barba, roupa e corpo: gradientes suaves +
poucos strokes finos de acento; sem linhas duras de contorno; curvas orgânicas
(Catmull-Rom onde couber); densidade de detalhe consistente. O personagem
inteiro precisa parecer desenhado por UM art director.

## 4. Face
- **Crânio/planos**: volume por GRANDES PLANOS recortados na silhueta (clipPath),
  luz key superior-esquerda, núcleo em sombra à direita por GRADIENTE (não tiras
  chapadas). Sombra ampla sob a maçã/mandíbula; órbita suave; oclusão do queixo.
- **Jaw (§6.3)**: vem de silhueta + valor + transição de plano + oclusão. Stroke
  de contorno quase imperceptível (alfa ≤0.12) — nunca "linha contornando a
  mandíbula".
- **Olhos (§6.1)**: fenda amendoada por pálpebras (não elipse+anéis). Íris
  parcialmente ocluída pela pálpebra superior; 1 catchlight; canto lacrimal.
  Tamanho ADULTO (~8% menor que Disney). Evitar olho de boneco/íris dominante.
- **Sobrancelha (§6.2)**: acompanha o brow ridge; fina; sem preto chapado
  (alfa ~0.9, não sólido). Não é uma faixa desenhada.
- **Orelha (§6.4)**: hélice + anti-hélice + concha + lóbulo — sem excesso.
- **Nariz (§5) — FONTE ÚNICA**: `narizPremium` é o ÚNICO renderizador. A BASE
  não desenha nariz. Slot `nar_*` = autoritativo; sem slot + premium ⇒ default
  por-base (`narizPremiumDefaultDaBase`) injetado no render. NUNCA duas
  geometrias empilhadas → sem cápsula/patch/coluna/adesivo. Nariz por VALOR
  (plano lateral em sombra, ball compacto, septo, asas, narinas sob as asas).
- **Boca (§6.5)**: lábio superior/inferior + oclusão + comissuras + sombra sob o
  lábio. Avaliar cada Golden em TARGET SIZE; não pode virar símbolo/sticker nem
  o mesmo asset deformado.

## 5. Body
- Figura VESTIDA (top+calça+sapato neutros) — a peça premium pinta por cima. A
  FORMA lê no silhouette/flat sem depender dos overlays.
- **Pernas (§16)**: leitura inequívoca `hip→thigh→knee→calf→ankle→shoe` pela
  CURVA EXTERNA (não por linhas internas). Undulação: coxa larga → joelho estreito
  → panturrilha projeta → tornozelo estreito.
- **Female (§17)**: por PROPORÇÃO (ombro/cintura/quadril), styling combinado —
  não estereótipo. Sem ampulheta caricata / peito sexualizado / quadril exagerado.
  Distinta do standard no black test, sem virar caricatura. `corpoV2.preset=
  'feminino'` (canônico) chega ao renderer (bug corrigido §4).

## 6. Hands (§15)
`forearm → wrist taper → palm → four-finger group → thumb wedge`. Dedos como
CÁPSULAS alongadas (índice mais longo, mínimo mais curto — assimetria real),
separadas só nas pontas; a palma cobre a base (dedos juntos). Direção natural
levemente p/ dentro/baixo. NÃO: 3 bolinhas, punho fechado, garra, dedos iguais,
scallops. A silhueta precisa dizer HAND.

## 7. Feet (§14)
Sapato FRONTAL estilizado. Bico ≈5–8° p/ fora (não perspectiva lateral
agressiva). `ankle → heel/instep → vamp → toe box → sole`, junto ao eixo da
perna. Meia-largura ≈ largura da perna (sem flipper/explosão horizontal). Sola
clara separa do piso. No corpo inteiro o olho não vai primeiro ao sapato.

## 8. Hair
- **Afro (§18)**: a SILHUETA é CONSTRUÍDA pelos clumps maiores (massa central +
  anel de 8–14 lobos sobrepostos), borda que sobe/desce/projeta/recua
  organicamente. NÃO domo liso + decoração (gorro). No black test já parece
  cabelo; interior por coils.
- **Short/Long/Wavy (§19)**: silhuetas distintas. Short = hairline integrada +
  crown, não cap. Long = massa frontal/traseira + gravity + interação no ombro.
  Wavy = massa DIFERENTE do long liso (não só linhas internas). Se long≈wavy →
  REWORK.

## 9. Beard (§20)
Stubble = campo AGRUPADO, curto, baixo contraste, growth-directed (cresce p/
baixo, ±12°) — não spikes/cuts, não dots isolados. Transição `skin → sparse →
medium → dense`. Barba cheia perde simetria perfeita / contorno geométrico /
preto uniforme (variação em jaw/chin/edge/cheek). Bigode com separação física
da massa quando o estilo pede.

## 10. Garment construction (autoral por peça — §7-13)
Helper genérico `sil()` REMOVIDO. Cada peça tem função própria:
- **Camiseta** (`pathCamisetaGolden`): fitted, ombro natural, gola redonda, leve
  cintura, barra curva, microassimetria. Manga curta com cap. Black test → T-SHIRT.
- **Hoodie** (`pathHoodieGolden`): ombro caído; CAPUZ (lobo atrás do pescoço =
  assinatura); massa relaxada que RECOLHE na barra (rib < quadril); bolso canguru.
  Torso não é retângulo. Black test → HOODIE.
- **Blazer** (`pathBlazerGolden` — HERO): ombro ESTRUTURADO, cintura SUPRIMIDA,
  front quarters. Lapela = TECIDO da jaqueta (nasce na gola → rola → converge no
  button stance), não forma escura colada; roll highlight + gorge. Gravata menor,
  não dominante. Camisa V + botões. Black test → blazer mesmo sem lapela/botão/
  gravata; se só reconhece por detalhe interno → REWORK.
- **Sobretudo** (`pathSobretudoGolden`): casaco LONGO (mid-coxa ~y316 = assinatura),
  A-line MODERADA (alfaiataria, não sino/robe/placa), gola alta, abertura central.
- **Sleeves (§12)**: mangaCurta/Longa = fit base; a peça deforma saída do ombro/
  pitch/cuff (arte final por peça).
- **Folds (§13)**: `m.dobra` preservado; folds coerentes com a construção de cada
  peça (não a MESMA geometria em todas). Fold não é decoração de linhas.

## 11. Material response (§21)
`material2d` responde à LUZ/DOBRA, não só pattern. `m.dobra(cristas, vales)` usa
`FOLD_RESP[token]`: couro brilha na crista (branco 0.6, fino), lã não (0.05),
metal duro (0.72), cotton macio (0.10). Diagnóstico `18_FOLD_RESPONSE_ONLY`
prova a resposta com MESMA geometria/base/dobra e SEM fill/realce/pattern.

## 12. Studio
Charcoal neutro, profundidade, grounding. Sem HUD gigante, sem overlay frontal,
sem aura atrás da cabeça competindo com o rosto. No Golden QA o **foreground do
estúdio é VAZIO** (correto — `fun_px_estudio` sem plano `fg`).

## 13. Prohibited tells (NÃO)
Cápsula/coluna de nariz · nariz duplicado · scallop/3-bolinhas na mão · garra/
punho · sapato flipper/triangular · domo de afro (gorro) · stubble em spikes ·
barba preto chapado uniforme · roupa como retângulo/slab flutuante · lapela como
forma escura colada · sobretudo sino/placa · esconder forma fraca com gradient/
texture/strokes decorativos · builder genérico de roupa disfarçado de autoria.

## 14. Silhouette rules (§26) & Target-size (§25)
- **Pure black test**: body (standard/athletic/robust/female), garments (tee/
  hoodie/blazer/overcoat), hair (short/long/wavy/afro), hands, feet — cada
  categoria reconhecível SEM gradient/stroke/texture/fold/highlight. Se não →
  REWORK.
- **No-color test** (§27): identidade não depende de cor/skin/accent (grayscale).
- **Target size**: sobreviver em close, stage e UI. Elemento que só funciona
  ampliado não conta.

## 15. Invioláveis
Byte-stability §651 (campo novo neutro OMITIDO; clássico byte a byte — mudou só
premium/`_px_`). Nunca editar arte em `partes/*` (só wrappers — aqui a arte
premium é autoral nos módulos premium). Feature nova atrás de flag desligável.
Validação PHP espelhada p/ todo campo novo. Nunca regravar goldens premium antes
de `VEREDITO HUMANO = APPROVED`.
