# BRIEFING COMPLEMENTAR 03  
# AVATAR STUDIO DSHOW — ELEVAÇÃO ARTÍSTICA 2D / PREMIUM GENERATION

## CONTEXTO E DECISÃO

Após auditoria do código, das contact sheets e das pranchas Before × After, o diagnóstico da frente 2D está fechado.

A implementação técnica do Classic Premium avançou significativamente. Temos:

- assets Premium separados;
- materiais 2D;
- camadas dianteiras/traseiras;
- sombras;
- planos de profundidade;
- `renderCorpo`;
- `renderCorpoV2`;
- Asset Clarity;
- contact sheets;
- Candidate Mode;
- Before × After;
- compatibilidade Legacy.

Entretanto, **o resultado artístico ainda não representa a evolução de geração que queremos**.

O problema não é simplesmente “falta de detalhes”.

Em vários lugares já existem detalhes demais.

O problema principal é:

> **forma, construção, silhueta, volume, materialidade e direção artística.**

A partir deste briefing, não quero que “Premium” seja entendido como:

`Legacy + gradiente + highlight + sombra + detalhes`

Quero:

`FORMA → VOLUME → MATERIAL → DETALHE → POLISH`

Essa ordem é obrigatória.

---

# 1. NOVA DEFINIÇÃO DE PREMIUM 2D

O alvo passa a ser:

> **High-End Stylized Character Illustration / Premium 2.5D Character Creator**

Não quero fotorrealismo.

Não quero aparência infantil.

Não quero vetor corporativo genérico.

Não quero “cartoon mobile game barato”.

Não quero excesso de efeitos tentando criar sofisticação.

O personagem deve continuar estilizado, acessível e personalizável, porém com aparência de **produto visual profissional e autoral**.

A diferença entre Legacy e Premium deve ser reconhecível imediatamente mesmo:

- em preto e branco;
- sem background;
- sem aura;
- sem bloom;
- sem moldura;
- sem texto;
- sem saber qual é o Before e qual é o After.

---

# 2. PRINCÍPIO FUNDAMENTAL

Um asset não fica Premium porque recebeu:

- mais gradientes;
- mais linhas;
- mais elipses;
- mais highlights;
- mais sombras;
- mais partículas.

Ele fica Premium quando sua **forma primária já funciona antes dos efeitos**.

Nova ordem de avaliação:

```text
SILHUETA
↓
PROPORÇÃO
↓
CONSTRUÇÃO
↓
PLANOS DE VOLUME
↓
MATERIAL
↓
DETALHE SECUNDÁRIO
↓
POLISH
```

Se a silhueta falhar, não prosseguir para polish.

---

# 3. NÃO CRIAR OUTRO RENDERER 2D

A arquitetura atual deve ser preservada.

Não criar:

`Renderer Premium V3`

`Engine 2D Nova`

`SVG Renderer Next`

ou outra stack paralela.

O motor atual já possui os contratos necessários.

O problema agora é de **art authoring**.

---

# 4. PRESERVAR LEGACY

Legacy permanece byte-estável e compatível.

Não editar IDs Legacy.

Não quebrar saves existentes.

Toda a nova evolução ocorre sobre o trilho Premium existente.

---

# 5. NÃO CRIAR MAIS UMA FAMÍLIA DE IDs PREMIUM

Não criar desnecessariamente:

`_px2_`

`_ultra_`

`_aaa2_`

etc.

Os IDs Premium existentes podem receber rework artístico enquanto permanecem no Candidate Mode.

Estamos refinando a geração Premium, não criando uma terceira geração paralela.

---

# 6. CONGELAR TEMPORARIAMENTE POPULAÇÃO DE ASSETS

Não adicionar novos:

- cabelos;
- olhos;
- roupas;
- rostos;
- backgrounds;

até estabelecer o novo **Art Quality Lock**.

Temos quantidade suficiente para calibrar qualidade.

---

# 7. CRIAR UM GOLDEN VERTICAL SLICE

Antes de refazer todos os assets, escolher uma pequena seleção que represente o nível final.

No mínimo:

### Faces

- 1 masculino;
- 1 feminino;
- 1 rosto angular;
- 1 rosto suave.

### Hair

- curto;
- longo;
- cacheado/afro;
- preso.

### Clothing

- camiseta;
- hoodie;
- blazer;
- sobretudo/gala.

### Materials

- cotton;
- wool;
- leather;
- satin;
- denim;
- technical.

### Environment

- Studio;
- Urban;
- editorial/environment.

Esses assets formam o **Golden Art Set**.

---

# 8. NÃO REFAZER OS OUTROS ASSETS ANTES DO GOLDEN SER APROVADO

Primeiro:

```text
Golden Face
Golden Hair
Golden Body
Golden Outfit
Golden Material
Golden Environment
```

Depois escalar.

---

# 9. CORPO 2D — PROBLEMA ESTRUTURAL P0

A auditoria confirmou que o corpo inteiro atual é um scaffold extremamente simplificado.

Ele usa:

- torso quase cilíndrico;
- braços simples;
- pernas tubulares;
- mãos circulares;
- sapatos genéricos;
- pouca relação anatômica entre ombro, tórax, cintura e quadril.

Não adianta aplicar iluminação Premium por cima desse scaffold e esperar resultado de nova geração.

---

# 10. CRIAR PREMIUM BODY SCAFFOLD

Não como novo renderer.

Criar um scaffold Premium dentro da engine atual, utilizado somente quando:

`opcoes.premium === true`

Legacy continua usando `corpoInteiro()` atual.

Conceitualmente:

```text
Legacy
→ corpoInteiro()

Premium
→ corpoInteiroPremium()
```

Mesma engine.

Mesmo config.

Mesmo sistema de camadas.

---

# 11. PREMIUM BODY PRECISA TER ANATOMIA ESTILIZADA REAL

Não precisa ser realista.

Mas precisa possuir:

- clavícula/ombro legível;
- tórax;
- cintura;
- quadril;
- braço superior;
- antebraço;
- mão estilizada;
- coxa;
- joelho;
- panturrilha;
- tornozelo;
- pé.

Tudo simplificado.

Mas não reduzido a tubos.

---

# 12. BODY SHAPE PROFILES

Aproveitar `PRESETS_CORPO`, mas melhorar a base visual.

Perfis:

- slim;
- standard;
- athletic;
- robust.

Não apenas `scaleX / scaleY`.

A silhueta precisa mudar.

---

# 13. OMBROS

Ombro masculino/feminino/estreito/largo precisa ser legível.

Isso é especialmente importante para roupa.

---

# 14. BRAÇOS

Braço não pode parecer uma cápsula.

Criar:

- taper;
- cotovelo discreto;
- punho;
- relação braço/antebraço.

---

# 15. MÃOS

Eliminar a leitura de:

> “bolinha na ponta do braço”.

Mesmo mão extremamente estilizada precisa ter:

- palma;
- indicação de polegar;
- direção.

---

# 16. PERNAS

Eliminar:

> “dois retângulos descendo da cintura”.

Criar:

- coxa;
- estreitamento no joelho;
- panturrilha;
- tornozelo.

---

# 17. ROSTO — MUDANÇA DE MÉTODO

Não quero que o novo rosto seja construído como:

> pele base + várias elipses translúcidas sobre a superfície.

Isso cria exatamente a sensação amadora observada.

---

# 18. FACE FORM PLANES

Cada rosto deve ser desenhado em grandes planos:

1. forehead;
2. temple;
3. cheekbone;
4. mid-face;
5. jaw;
6. chin.

A luz precisa acompanhar esses planos.

---

# 19. NÃO USAR ELIPSE COMO SOLUÇÃO UNIVERSAL DE VOLUME

Elipse continua permitida quando a geometria realmente for elíptica.

Mas não usar automaticamente para:

- testa;
- bochecha;
- blush;
- queixo;
- idade;
- volume facial.

Preferir paths adaptados à anatomia.

---

# 20. FACE SHADOWS DEVEM SEGUIR A FORMA

Exemplo:

Cheek shadow deve acompanhar:

`zigomático → bochecha → mandíbula`

e não parecer:

`círculo transparente colocado sobre a pele`.

---

# 21. LIGHTING CONSISTENCY

Definir uma única direção de iluminação principal para o Classic Premium:

> key light superior-esquerda suave.

Toda arte deve respeitar isso.

Hoje vários highlights parecem independentes.

---

# 22. VALUE HIERARCHY

Não usar contraste igual em todas as áreas.

Maior contraste:

- olhos;
- sobrancelha;
- boca;
- hairline.

Menor contraste:

- bochechas;
- testa;
- pescoço;
- orelhas.

---

# 23. ROSTO PRECISA FUNCIONAR SEM GRADIENTE

Criar teste:

`Flat Face Test`

Substituir temporariamente os fills por tons planos.

Se o rosto perder completamente a leitura:

> estrutura insuficiente.

---

# 24. BASES FACIAIS

Os conceitos atuais permanecem válidos:

- Oval;
- Angular;
- Coração;
- Quadrada;
- Redonda;
- Alongada;
- Diamante;
- Suave.

Mas cada uma precisa ser reconhecida apenas pela silhueta.

---

# 25. SILHOUETTE FACE SHEET

Gerar contact sheet:

`fill preto`

sem:

- olhos;
- nariz;
- boca;
- cabelo.

Apenas cabeça/maxilar/queixo.

Se duas bases parecem iguais:

`REWORK`.

---

# 26. NARIZ — UMA ÚNICA FONTE VISUAL

Hoje temos nariz integrado na base e categoria de nariz adicional.

Isso pode produzir sobreposição visual.

Para Premium, definir claramente:

> a base define o plano facial; a categoria `nariz` define a anatomia do nariz.

Não desenhar um nariz completo na base e depois cobri-lo com outro.

---

# 27. REMOVER “PATCH” DO NARIZ

Evitar cobrir o nariz antigo com:

`ellipse de pele`.

Isso cria aparência de adesivo.

O nariz deve nascer integrado ao plano facial.

---

# 28. TIPOS DE NARIZ PRECISAM ALTERAR SILHUETA INTERNA

Reto, fino, largo, arrebitado, aquilino etc. precisam mudar:

- bridge;
- width;
- tip;
- wings;
- nostrils;
- length.

Não apenas um stroke.

---

# 29. OLHOS — REFAZER O BUILDER

O builder atual é tecnicamente elegante, mas artisticamente restritivo.

Hoje grande parte da identidade vem de:

- `ry`;
- `tilt`;
- `irisR`;
- `palpebra`.

Isso não é suficiente.

---

# 30. EYE SHAPE PROFILE V2

O novo perfil deve suportar:

- largura;
- altura;
- canto interno;
- canto externo;
- curva superior;
- curva inferior;
- exposição da esclera;
- profundidade da pálpebra;
- distância;
- posição vertical;
- iris scale;
- pupil scale;
- lash weight.

---

# 31. NÃO USAR A MESMA ELIPSE DE ESCLERA PARA TODOS

O branco do olho deve seguir o shape do olho.

Usar `path`.

---

# 32. OITO OLHOS PREMIUM = OITO SILHUETAS

Sem nome e sem íris, ainda devemos reconhecer diferença entre:

- Confiante;
- Sereno;
- Focado;
- Amendoado;
- Intenso;
- Gentil;
- Felino;
- Determinado.

---

# 33. ÍRIS

A atual íris possui boa intenção de detalhe.

Preservar:

- limbo;
- pupil;
- catchlight;
- tonal variation.

Mas reduzir ruído onde necessário.

---

# 34. CATCHLIGHT

O catchlight deve ser consistente com a iluminação global.

Não parecer um sticker branco independente.

---

# 35. BOCA

Criar maior amplitude real entre:

- lábios finos;
- médios;
- cheios;
- largos;
- estreitos;
- cupid bow;
- sorriso;
- sério.

---

# 36. BOCA NÃO É SOMENTE EXPRESSÃO

Separar:

`mouth anatomy`

de:

`expression`.

Hoje alguns assets estão mais próximos de expressão do que de anatomia.

---

# 37. CABELO — PRIORIDADE P0

A infraestrutura atual de:

- massa;
- franja;
- sombra;
- mechas;
- fios;
- back layer;

é boa.

Mas a linguagem artística precisa ser refeita.

---

# 38. REMOVER RIM LIGHT GLOBAL

Hoje existe praticamente um Rim Light genérico compartilhado por todos os cabelos.

Isso cria uma assinatura artificial repetida.

Não usar um mesmo highlight sobre:

- curto;
- afro;
- rabo;
- cacheado;
- longo;
- undercut.

---

# 39. CADA CABELO POSSUI FLUXO PRÓPRIO

Highlight deve seguir:

> direção do fio e massa do penteado.

Não um arco genérico.

---

# 40. HAIR = CLUMPS, NÃO CAPACETE

Cada cabelo deve ter:

### Primary mass

silhueta geral.

### Major clumps

3–8 grandes divisões de volume.

### Secondary clumps

detalhes menores.

### Stray hairs

poucos fios externos.

---

# 41. NÃO DESENHAR FIO POR FIO

Continuamos estilizados.

A sofisticação vem das massas.

---

# 42. HAIRLINE

Hairline precisa variar por penteado.

Curto:

- pequenas entradas;
- quebra natural.

Longo:

- centro/lateral conforme penteado.

Afro:

- edge irregular.

Franja:

- parcialmente oculta.

---

# 43. HIGHLIGHT

Não usar faixas brancas retas.

Highlight deve ser:

- mais largo;
- mais suave;
- fragmentado;
- seguindo volume.

---

# 44. LONGO LISO × ONDULADO

Atualmente continuam muito semelhantes.

Precisam mudar em:

- outer silhouette;
- lateral width;
- wave amplitude;
- tips;
- mass distribution.

Não somente strokes internos.

---

# 45. BARBA

A arte da barba também precisa evoluir de:

`massa sólida + alguns fios`

para:

`silhueta + densidade + edge breakup + skin reveal`.

---

# 46. STUBBLE / BARBA RALA

Não usar linhas verticais repetitivas.

Criar distribuição de pequenos grupos determinísticos de pelo acompanhando a mandíbula.

---

# 47. BARBA CHEIA

Borda inferior precisa ter irregularidade controlada.

Não shape geométrico perfeito.

---

# 48. FIT

Barba precisa reagir melhor a:

- jaw width;
- chin;
- face profile.

Continuar usando `fatorBarba`, mas permitir profiles mais específicos futuramente.

---

# 49. GHOST CONTEXT DA BARBA — REWORK

A contact sheet atual mostra que o ghost mannequin domina o asset.

Isso é incorreto.

Para barba:

```text
CROP = nariz inferior → queixo
```

Mostrar:

- mandíbula ghost muito discreta;
- barba grande.

Não mostrar corpo inteiro.

---

# 50. OPACIDADE DO GHOST

Meta aproximada:

`10–20%`

não 50%, salvo exceção comprovada.

---

# 51. GHOST NÃO TEM ROUPA

Ghost facial não precisa trazer torso completo.

---

# 52. CLOTHING — MAIOR GARGALO DO CATÁLOGO

A auditoria confirmou o principal problema:

Quase todas as roupas Premium continuam partindo de:

`PATH_OMBROS`.

Portanto a silhueta básica permanece praticamente a mesma.

Isto precisa acabar.

---

# 53. TODA ROUPA PREMIUM SUPERIOR PRECISA TER SILHUETA PRÓPRIA

Obrigatório para:

- camiseta;
- camisa;
- hoodie;
- blazer;
- polo;
- colete;
- sobretudo;
- gala;
- terno;
- jaqueta.

---

# 54. TODOS DEVEM TER `renderCorpoV2`

Hoje praticamente apenas o blazer utiliza esse contrato como silhueta própria.

Isso deve mudar.

Após esta frente:

> **100% das roupas superiores Premium devem possuir `renderCorpoV2`.**

---

# 55. `PATH_OMBROS` NÃO PODE SER A SILHUETA FINAL PREMIUM

Pode servir como:

- reference anchor;
- fallback;
- fit guide.

Não como shape final das dez roupas.

---

# 56. CAMISETA

Precisa ter:

- manga curta;
- ombro suave;
- chest drape;
- cintura;
- barra.

---

# 57. CAMISA

Precisa possuir:

- ombro mais estruturado;
- manga;
- colarinho;
- abertura frontal;
- cuff/shape;
- cintura.

---

# 58. HOODIE

Precisa ser visivelmente mais volumoso.

- dropped shoulder;
- bulky sleeve;
- capuz com volume traseiro;
- torso menos ajustado;
- cuff;
- hem.

---

# 59. POLO

Precisa ser reconhecida por:

- collar;
- short sleeve;
- placket;
- sporty fitted silhouette.

Não “camiseta + gola”.

---

# 60. BLAZER

Estrutura:

- shoulder pad;
- lapel;
- chest taper;
- sleeve;
- waist;
- opening.

---

# 61. SOBRETUDO

Precisa realmente ser LONGO.

Não pode parecer blazer com lapela diferente.

Corpo inteiro:

- descer além do quadril;
- volume próprio;
- abertura inferior;
- overlap.

---

# 62. COLETE

Sem manga.

O ombro/braço do corpo precisa ficar visível.

---

# 63. GALA

Precisa possuir identidade forte.

Não apenas terno com outro material.

---

# 64. T-SHIRT / POLO / HOODIE SILHOUETTE TEST

Colocar as três completamente pretas.

Se não for possível identificá-las:

`FAIL`.

---

# 65. CLOTHING CONTACT SHEET

Nova contact sheet deve usar:

> peça vestida em **ghost mannequin quase invisível**, não o corpo azul genérico dominando a imagem.

O protagonista é a roupa.

---

# 66. MATERIAL SYSTEM — MANTER, MAS ELEVAR

Não criar outro Material System.

Estender `material2d()`.

---

# 67. PROBLEMA ATUAL DOS MATERIAIS

Hoje vários materiais compartilham fundamentalmente:

> gradiente escuro → base → claro.

Isso altera brilho, mas não cria identidade material suficiente.

---

# 68. MATERIAL = RESPOSTA À LUZ + MICRO-LINGUAGEM

Cada material precisa ter:

- characteristic highlight;
- characteristic shadow;
- texture language;
- edge behavior;
- seam behavior.

---

# 69. COTTON

Características:

- matte;
- highlight amplo e fraco;
- pouca especularidade;
- dobras suaves.

Sem brilho metálico.

---

# 70. WOOL

- difuso;
- contraste baixo;
- trama mínima;
- borda macia;
- shadow rico.

---

# 71. DENIM

- twill diagonal;
- seams;
- stitching;
- desgaste controlado;
- highlight localizado.

---

# 72. LEATHER

- specular strip;
- darker edges;
- fold highlights;
- crease lines;
- não plástico.

---

# 73. TECHNICAL

- painéis;
- seams;
- crisp edge;
- low/moderate sheen;
- detalhes funcionais.

---

# 74. SATIN

- banda de highlight larga;
- alto contraste;
- variação conforme direção da dobra.

---

# 75. SILK

Não deve parecer Satin duplicado.

Highlight:

- mais delicado;
- mais fino;
- mais fluido.

---

# 76. METAL

Já existe boa lógica de bandas duras.

Preservar e calibrar.

---

# 77. GLASS

Transparência deve ser legível, mas sem transformar tudo em branco.

---

# 78. EMISSIVE

Core claro.

Glow controlado.

Não transformar em aura gigante.

---

# 79. MATERIAL BENCHMARK BOARD

Criar uma única geometria neutra e aplicar:

```text
cotton
wool
denim
leather
technical
satin
silk
metal
glass
emissive
```

Mesma:

- cor;
- luz;
- tamanho.

Se cotton/wool/technical parecerem praticamente iguais:

`FAIL`.

---

# 80. LOWER BODY

Jeans, Social e Jogger também precisam mudar silhueta.

Hoje usam a mesma função `pernas()`.

Isso é insuficiente.

---

# 81. JEANS

- straight/slim leg;
- waistband;
- pockets;
- seam;
- hem.

---

# 82. SOCIAL

- cleaner taper;
- crease;
- tailored waistband;
- longer break.

---

# 83. JOGGER

- relaxed upper leg;
- taper;
- cuff;
- side panel.

---

# 84. CALÇADOS

Tênis, social e bota já possuem alguma geometria diferente.

Elevar:

- toe shape;
- sole;
- heel;
- upper;
- laces;
- ankle height.

---

# 85. FOOTWEAR THUMB

Calçado deve dominar card.

Não corpo inteiro.

---

# 86. BACKGROUND — NÃO CONFUNDIR COM AURA

A prancha Environment não deve validar simultaneamente:

`background + aura`.

São gates diferentes.

---

# 87. STUDIO PREMIUM

Studio é benchmark neutro.

Não usar:

- círculo gigante;
- anel decorativo;
- aura;
- HUD;
- partículas fortes.

Precisa parecer:

> estúdio ilustrado profissional.

---

# 88. STUDIO COM DEPTH

Construir:

- wall/cyclorama;
- floor;
- contact area;
- light falloff;
- subtle vignette por valor;
- grounding.

---

# 89. BACKGROUND VALUE CONTROL

A região atrás do rosto deve possuir contraste menor.

Evitar competir com:

- olhos;
- cabelo;
- contorno facial.

---

# 90. FUNDO É CENÁRIO, AURA É EFEITO

Não misturar as duas responsabilidades.

---

# 91. BACKGROUNDS PREMIUM EXISTENTES

Os seis conceitos são bons:

- Studio;
- Metropolis;
- Horizon;
- Neon;
- Library;
- Nebula.

Não precisa descartá-los.

Rework a linguagem artística.

---

# 92. ENVIRONMENT DEPTH

Cada cenário deve possuir de fato:

- foreground;
- midground;
- background.

A infraestrutura já suporta planos.

Usá-la artisticamente.

---

# 93. NÃO USAR “MAIS ELEMENTOS” COMO SINÔNIMO DE DEPTH

Depth vem de:

- scale;
- overlap;
- value;
- atmospheric contrast;
- perspective.

Não de adicionar vários círculos.

---

# 94. AURAS

Auras são opcionais.

Não fazem parte do quality benchmark base.

---

# 95. PREMIUM CHARACTER PRECISA FUNCIONAR SEM AURA

Hard rule.

---

# 96. ACESSÓRIOS

Após Golden Face/Hair/Body/Clothing:

revisar acessórios Premium seguindo a mesma regra.

---

# 97. ÓCULOS

Armação precisa ter:

- bridge;
- temple impression;
- lens shape;
- material differentiation.

---

# 98. JOIAS

Metal precisa ter highlight controlado.

Não ser apenas shape amarelo/cinza.

---

# 99. MOCHILA

Precisa ter volume, straps e silhouette.

---

# 100. ASAS

Precisam ser fortes em silhueta sem depender somente de emissive.

---

# 101. ASSET DISTINCTIVENESS — CONTINUA BLOQUEANDO ESCALA

Os números continuam muito altos:

- cabelos muito semelhantes;
- roupas muito semelhantes;
- bases semelhantes;
- olhos semelhantes.

Não multiplicar catálogo.

---

# 102. NOVA REGRA

Um asset separado exige uma razão de existir.

Precisa alterar pelo menos fortemente um destes:

- silhouette;
- structure;
- material family;
- semantic function.

Cor não basta.

---

# 103. COR = VARIANT

Grisalho:

`variante do cabelo`

quando a geometria for igual.

---

# 104. BRANDING = VARIANT

Mesma hoodie com logo Dshow:

`variant`

não nova roupa.

---

# 105. SKIN DETAIL = OVERLAY

Sardas:

`overlay`

não nova estrutura facial.

---

# 106. NOVO ART QUALITY GATE

Criar:

`2D ART QUALITY GATE`

independente dos testes técnicos.

---

# 107. SUBGATES

```text
A1 — SHAPE LANGUAGE
A2 — FACE QUALITY
A3 — HAIR QUALITY
A4 — BODY QUALITY
A5 — CLOTHING SILHOUETTE
A6 — MATERIAL READABILITY
A7 — ENVIRONMENT QUALITY
A8 — ASSET DISTINCTIVENESS
```

---

# 108. ESTADOS

```text
NOT_READY
CANDIDATE
REWORK
APPROVED
```

---

# 109. SHAPE LANGUAGE GATE

Aprova somente se:

> imagem ainda parece boa com gradients, effects e textures desligados.

---

# 110. SILHOUETTE GATE

Gerar imagens completamente pretas de:

- faces;
- hair;
- clothes;
- lower wear;
- shoes.

---

# 111. MATERIAL GATE

Mesmo shape.

Mesma cor.

Diferentes materiais.

Humanamente reconhecíveis.

---

# 112. FACE GATE

Close-up 512×512 ou superior.

Sem background.

Sem aura.

---

# 113. HAIR GATE

Frente + ¾ quando aplicável.

Ver:

- silhouette;
- hairline;
- clumps;
- highlights.

---

# 114. BODY GATE

Avatar sem roupa complexa.

Apenas base neutra.

Se anatomia continuar parecendo tubos:

`FAIL`.

---

# 115. CLOTHING GATE

Black silhouette.

Sem material.

Sem logo.

Sem detalhe.

Ainda precisa ser reconhecível.

---

# 116. ENVIRONMENT GATE

Sem avatar.

Ver o background isoladamente.

Depois com avatar.

---

# 117. TARGET DISPLAY SIZE

Avaliar também no tamanho real em que usuário verá.

Não apenas zoom de desenvolvimento.

---

# 118. NÃO APROVAR POR SCREENSHOT AMPLIADO

Um detalhe que só aparece a 400% não melhora a experiência.

---

# 119. CRIAR ART DEBUG MODES

Aproveitar QA existente.

Adicionar visualizações:

```text
FLAT
SILHOUETTE
VALUES
MATERIAL
FINAL
```

---

# 120. FLAT MODE

Sem gradients.

Ajuda a verificar desenho.

---

# 121. SILHOUETTE MODE

Tudo preto.

---

# 122. VALUES MODE

Grayscale.

Ver hierarquia.

---

# 123. MATERIAL MODE

Foco em material.

---

# 124. FINAL

Arte completa.

---

# 125. GOLDEN ART BOARD

Uma única prancha oficial deve conter:

- Golden male face;
- Golden female face;
- 4 hair;
- 4 outfits;
- material board;
- body;
- studio environment.

---

# 126. ESSA PRANCHA É O NOVO QUALITY BAR

Nenhum asset novo abaixo dela entra como Premium.

---

# 127. NÃO USAR O LEGACY COMO ÚNICA REFERÊNCIA

Uma arte pode ser muito melhor que Legacy e ainda assim ser insuficiente.

Pergunta correta:

> “Isso parece profissional isoladamente?”

Não:

> “Isso está melhor que o antigo?”

---

# 128. STATUS “PREMIUM” NÃO É HERDADO

Cada asset precisa conquistar a classificação.

---

# 129. QUALITY METADATA

Considerar:

```text
prototype
production
premium
hero
```

Mas `premium` exige aprovação visual.

---

# 130. FASE DE IMPLEMENTAÇÃO — P0

Primeiro:

**Art Bible + Golden Vertical Slice.**

Nenhum rework massivo.

---

# 131. ART BIBLE DEVE DEFINIR

- proportion;
- line weight;
- shape language;
- edge language;
- lighting direction;
- shadow hardness;
- saturation;
- material response;
- hair clumping;
- eye proportions;
- garment silhouettes;
- environment contrast.

---

# 132. NÃO FAZER ART BIBLE APENAS EM TEXTO

Precisa conter imagens geradas pelo próprio projeto.

---

# 133. P1 — GOLDEN FACE

Implementar/rework:

- 2 bases;
- 3 eyes;
- 2 noses;
- 3 mouths;
- eyebrows.

---

# 134. REVISAR

Gerar pranchas.

Esperar veredito.

---

# 135. P2 — GOLDEN HAIR + BEARD

4 hairs.

3 beards.

---

# 136. P3 — PREMIUM BODY

Novo scaffold visual Premium.

---

# 137. P4 — GOLDEN CLOTHING

T-shirt.

Hoodie.

Blazer.

Overcoat.

---

# 138. TODAS COM SILHUETA PRÓPRIA

`renderCorpoV2`.

---

# 139. P5 — MATERIAL BOARD

Calibrar todos tokens.

---

# 140. P6 — ENVIRONMENT

Studio primeiro.

Depois restantes.

---

# 141. P7 — ART QUALITY LOCK

Somente quando Golden Set aprovado.

---

# 142. P8 — ESCALA

Aí sim revisar:

- 8 faces;
- 10 hair;
- all clothing;
- all beards;
- all premium accessories;
- backgrounds.

---

# 143. P9 — DEDUPLICAÇÃO

Executar:

`KEEP / VARIANT / MERGE / REWORK`.

---

# 144. NÃO IMPLEMENTAR 100 ASSETS DE UMA VEZ

Cada família passa pelo Golden antes.

---

# 145. NOVA DEFINIÇÃO DE DONE PARA ARTE

Não basta:

`SVG válido`.

Não basta:

`teste passou`.

Não basta:

`golden atualizado`.

Não basta:

`bundle dentro do peso`.

---

# 146. ARTE PREMIUM DONE

Somente:

```text
SHAPE APPROVED
+
SILHOUETTE APPROVED
+
MATERIAL APPROVED
+
TARGET SIZE APPROVED
+
CONTACT SHEET APPROVED
+
FULL AVATAR APPROVED
```

---

# 147. NÃO ATUALIZAR GOLDEN PARA “ACEITAR” ARTE RUIM

Golden serve para impedir regressão após aprovação.

Não para transformar qualquer nova saída no novo padrão.

---

# 148. GOLDEN SÓ DEPOIS DE ART APPROVAL

Fluxo correto:

```text
arte candidata
↓
visual review
↓
APPROVED
↓
gravar golden
```

Não:

```text
arte mudou
↓
regravar golden
↓
teste verde
↓
chamar de aprovado
```

---

# 149. RELATÓRIO DE CADA RODADA

Obrigatório:

```text
WHAT CHANGED
WHY
SHAPE BEFORE/AFTER
FINAL BEFORE/AFTER
SILHOUETTE SHEET
MATERIAL SHEET
CONTACT SHEET
KNOWN ISSUES
ART GATE STATUS
```

---

# 150. PRIMEIRA ENTREGA DESTE BRIEFING

Não quero o catálogo inteiro.

Quero uma **Golden Art Prototype Round**.

Entregar somente:

- Golden Male Face;
- Golden Female Face;
- Golden Short Hair;
- Golden Long Hair;
- Golden Afro/Curly;
- Golden Beard;
- Premium Body;
- T-shirt;
- Hoodie;
- Blazer;
- Overcoat;
- Material Board;
- Studio Background.

---

# 151. PARA CADA ITEM

Mostrar:

### Flat

sem efeitos.

### Silhouette

preto.

### Final

render completo.

---

# 152. NÃO FAZER NOVAS FEATURES NESSA RODADA

Não quero:

- novas categorias;
- novas flags;
- novos modos;
- nova IA;
- novo editor;
- novo sistema de raridade.

Quero **arte**.

---

# 153. NÃO OTIMIZAR PREMATURAMENTE

Primeiro atingir qualidade.

Depois medir bundle/performance.

Dentro dos limites existentes, claro.

---

# 154. NÃO QUEBRAR PERFORMANCE

SVG precisa continuar razoável.

Mas não reduzir arte a primitives ruins simplesmente para economizar alguns KB.

---

# 155. DIREÇÃO VISUAL

Resumo:

### Face

> sculpted stylized forms.

### Eyes

> expressive shapes, not repeated ellipses.

### Hair

> sculpted clumps, not helmet.

### Body

> stylized anatomy, not tubes.

### Clothing

> garment silhouettes, not torso + decoration.

### Materials

> different physical response, not different gradients.

### Background

> spatial depth, not decorative shapes.

### Effects

> supporting, not compensating.

---

# 156. PERGUNTA OBRIGATÓRIA PARA CADA ASSET

Antes de marcar como pronto:

> Se eu remover nome, cor, textura e efeito, esse asset ainda possui identidade?

Se não:

`REWORK`.

---

# 157. SEGUNDA PERGUNTA

> Esse asset parece profissional sem compará-lo ao Legacy?

Se não:

`REWORK`.

---

# 158. TERCEIRA PERGUNTA

> Um usuário reconheceria a categoria e o estilo em menos de dois segundos?

Se não:

`REWORK`.

---

# 159. PRINCÍPIO EXECUTIVO

O problema atual não será resolvido com mais infraestrutura.

Será resolvido com:

```text
BETTER DRAWING
BETTER SHAPES
BETTER PROPORTIONS
BETTER SILHOUETTES
BETTER MATERIAL LANGUAGE
BETTER ART DIRECTION
```

---

# 160. STATUS ATUAL

Manter:

`GATE A — REWORK`

Não promover para Candidate/Approved apenas porque a onda 1426 corrigiu bugs específicos. O próprio documento de gates já registra o 2D como REWORK e exige novo veredito visual. 

---

# ORDEM IMEDIATA

```text
P0 — FREEZE POPULATION
↓
P0 — ART BIBLE VISUAL
↓
P0 — PREMIUM BODY SCAFFOLD
↓
P0 — GOLDEN FACE
↓
P0 — GOLDEN HAIR
↓
P0 — GOLDEN CLOTHING SILHOUETTES
↓
P0 — MATERIAL BOARD
↓
P0 — GOLDEN STUDIO
↓
VISUAL REVIEW
↓
ART QUALITY LOCK
↓
SÓ DEPOIS REWORK DO CATÁLOGO COMPLETO
```

---

# REGRA FINAL

Não quero que a próxima rodada tente provar que o Premium atual já está bom.

Quero que a próxima rodada aceite que o atual Premium foi uma **fundação técnica válida**, mas não a direção artística final.

A arquitetura está suficientemente madura para produzir algo melhor.

Agora o foco precisa sair de:

> “como adicionar mais recursos ao SVG?”

e passar para:

> **“como produzir uma ilustração que eu teria orgulho de apresentar como produto Premium da Dshow?”**

Essa é a nova barra.

**Não iniciar outra frente antes de entregar o Golden Art Prototype para novo veredito humano.**