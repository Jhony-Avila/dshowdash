O achado mais importante é este:

> **O conceito correto de “Modo Item” já existe, mas hoje ele foi implementado praticamente só para `acessorio`.**

No código, `thumbItemDisponivel` só fica ativo quando `categoria === 'acessorio'`. Portanto cabelo, olhos, boca, rosto, roupa, fundo etc. continuam caindo em thumbnails que mostram o avatar aplicado. 

Além disso, nas roupas há uma decisão explícita de mostrar o **corpo inteiro com a peça aplicada** no próprio card, em vez de mostrar a roupa isolada.  Isso explica exatamente o que você está percebendo.

Há ainda outro detalhe: mesmo quando o Modo Item está funcionando, ao passar o mouse o card troca internamente para o modo aplicado (`pairando`), ao mesmo tempo em que o palco também recebe a prévia. Ou seja, **o card deixa de ser uma referência estável do asset justamente quando você quer compará-lo**. 

E nos acessórios corporais — inclusive calçados — existe uma exceção deliberada: o código decidiu mostrar **o corpo com o item aplicado e recortado**, porque assumiu que “sozinho ele não comunica”.   Eu mudaria essa decisão.

Também confirmamos que o drawer de detalhe trata como hero principal o **item aplicado ao avatar**, e os “Relacionados” também aparecem aplicados ao avatar.   Isso mistura dois conceitos que deveriam ser visualmente separados:

**“Qual é este asset?”**  
versus  
**“Como este asset fica em mim?”**

E há um segundo problema real de catálogo: existem **482 definições**, incluindo 60 cabelos, 48 olhos, 40 roupas, 26 fundos e 88 acessórios.     

A auditoria estrutural encontrou um sinal especialmente forte nos olhos Premium: alguns pares têm **89%–95% de estrutura praticamente igual**, além de rostos e cabelos candidatos a redundância. Isso não prova sozinho que são visualmente duplicados, mas é um excelente indicador de onde precisamos fazer revisão visual. 

---

# BRIEFING COMPLEMENTAR — ASSET CLARITY, ISOLATED THUMBNAILS & CATALOG DISTINCTIVENESS

## Objetivo

Corrigir a forma como os assets do Avatar Studio são apresentados.

O catálogo deve funcionar como uma biblioteca visual clara:

> **o card serve para reconhecer o asset; o palco serve para ver o asset aplicado.**

Hoje esses dois papéis estão misturados.

A partir deste briefing:

```text
CARD / THUMBNAIL
=
ASSET

PALCO / PREVIEW
=
AVATAR + ASSET APLICADO
```

Esta separação passa a ser uma regra de produto.

---

# 1. REGRA FUNDAMENTAL — ASSET THUMBNAIL ≠ AVATAR PREVIEW

Nunca usar o avatar completo como thumbnail padrão de uma peça quando a intenção do card é permitir que o usuário compare **a peça**.

Exemplo atual incorreto:

```text
ROUPA A
[avatar inteiro usando roupa A]

ROUPA B
[avatar inteiro usando roupa B]
```

O rosto, cabelo, pele e outros elementos ocupam grande parte da área visual e reduzem drasticamente a diferença perceptível entre A e B.

Novo comportamento:

```text
ROUPA A
[roupa A isolada]

ROUPA B
[roupa B isolada]
```

Ao passar/clicar:

```text
PALCO CENTRAL
[avatar atual usando roupa B]
```

---

# 2. NÃO CRIAR OUTRO RENDERER

O projeto já possui:

```text
svgItemIsolado()
focoItemDe()
FOCO_ITEM_ASSET
```

e uma infraestrutura de thumbnail isolado funcional.

O próprio Modo Item já foi criado para mostrar somente a camada selecionada. 

Generalizar esta infraestrutura.

Não criar:

```text
ThumbnailRendererV2
AssetCardRendererNew
Outra engine paralela
```

O objetivo é tornar o conceito existente **universal por categoria**.

---

# 3. PROBLEMA ATUAL CONFIRMADO

Hoje:

```ts
thumbItemDisponivel =
  flag('as6.thumb_item')
  && categoria === 'acessorio';
```

Ou seja, Modo Item está artificialmente restrito a acessórios. 

Remover esta premissa.

Substituir por política declarativa por categoria.

Exemplo conceitual:

```ts
AssetPresentationPolicy = {
  cabelo:    'isolated',
  olhos:     'isolated',
  boca:      'isolated',
  roupa:     'isolated',
  acessorio: 'isolated',
  fundo:     'isolated',
  moldura:   'isolated',
  aura:      'isolated',
  ...
}
```

Não precisa usar exatamente este schema.

A arquitetura deve ser orientada por dados.

---

# 4. POLÍTICA POR CATEGORIA

## Cabelo

O card deve mostrar:

```text
SOMENTE O CABELO
```

Não:

- rosto;
- olhos;
- chapéu;
- óculos;
- acessórios;
- roupa.

Especialmente importante:

> um chapéu equipado no avatar atual jamais pode aparecer sobre os thumbnails dos cabelos.

---

# 5. CABELO — NEUTRALIZAÇÃO DE CONFLITOS

Se o avatar atual estiver usando:

```text
chapéu
capuz
coroa
headset
```

isso **não influencia** os cards da categoria Cabelo.

Thumbnail é uma representação do asset do catálogo.

Não uma fotografia do avatar atual.

---

# 6. CABELO — BACK + FRONT

Se o cabelo possui camadas:

```text
renderAtras
render
renderFrente
```

o thumbnail isolado deve montar **todas as camadas pertencentes ao cabelo**.

Não apenas a parte frontal.

---

# 7. ROUPA

Thumbnail:

```text
SOMENTE A ROUPA
```

Não mostrar:

- cabeça;
- rosto;
- cabelo;
- acessórios;
- background.

Hoje a aplicação usa corpo completo para roupa e sobrepeça. 

Isso deve mudar no card.

---

# 8. MANEQUIM INVISÍVEL

Se uma roupa depende geometricamente do corpo para ter forma, criar um conceito interno de:

```text
SILHOUETTE / MANNEQUIN MASK
```

mas o manequim não deve competir visualmente com a roupa.

Possibilidades:

- corpo transparente;
- ghost mannequin;
- máscara neutra extremamente discreta;
- apenas a geometria necessária para dar forma.

O resultado visual precisa continuar sendo:

> **“eu vejo a roupa”**

e não:

> “eu vejo um avatar usando uma roupa”.

---

# 9. CALÇA

Thumbnail:

```text
SOMENTE A CALÇA
```

Enquadramento centrado da cintura aos pés.

Não mostrar cabeça/torso.

---

# 10. CALÇADO

A decisão atual diz que um item corporal deve aparecer aplicado ao corpo porque “sozinho ele não comunica”. 

Rever essa regra.

Para:

```text
tênis
sapato
bota
```

o asset isolado comunica perfeitamente.

Thumbnail deve mostrar:

```text
PAR DE CALÇADOS
```

ou, se tecnicamente a arte atual só contém determinada lateral:

```text
calçado + ghost foot mínimo
```

Nunca corpo inteiro.

---

# 11. PULSEIRA / RELÓGIO / ANEL

Pode haver exceção contextual mínima.

Exemplo:

```text
relógio + pulso ghost
anel + dedo ghost
brinco + pequena silhueta de orelha
```

Mas o contexto anatômico deve ter:

```text
opacity baixa
cor neutra
zero identidade
```

O protagonista continua sendo o asset.

---

# 12. OLHOS

Thumbnail:

```text
SOMENTE O PAR DE OLHOS
```

Grande.

Centralizado.

Sem:

- nariz;
- cabelo;
- boca;
- chapéu;
- roupa.

---

# 13. BOCA

Thumbnail:

```text
SOMENTE A BOCA
```

Pode conter pequena área neutra necessária para leitura do formato.

Não mostrar rosto completo.

---

# 14. NARIZ

Mesmo princípio.

Não mostrar toda a identidade do avatar.

---

# 15. SOBRANCELHAS

Mostrar somente:

```text
par de sobrancelhas
```

ou pequeno contexto neutro dos olhos, se realmente necessário.

---

# 16. BARBA

A barba pode precisar do contorno da mandíbula.

Usar:

```text
jaw ghost
```

e não um rosto completo personalizado.

---

# 17. ROSTO / BASE

Aqui existe uma exceção legítima.

Estamos comparando formato facial.

Pode existir:

```text
cabeça neutra
```

Mas remover:

- cabelo;
- chapéu;
- acessórios;
- roupa;
- fundos;
- efeitos.

---

# 18. ÓCULOS

Mostrar:

```text
somente armação/lentes
```

Contexto opcional:

```text
ponte do nariz ghost
```

mas preferencialmente nem isso.

---

# 19. CHAPÉUS

Mostrar:

```text
somente chapéu
```

Não mostrar cabelo.

Não mostrar rosto.

Não mostrar avatar atual.

---

# 20. CAPUZ

Pode exigir indicação volumétrica.

Usar cabeça ghost totalmente neutra se necessário.

Nunca o rosto real/config atual.

---

# 21. COLARES

Mostrar apenas:

```text
colar/corrente
```

Pequeno busto ghost somente se necessário.

---

# 22. MOCHILAS

Mostrar mochila isolada em ¾ quando possível.

No palco:

```text
câmera gira para costas
```

para mostrar aplicação.

Card não precisa carregar o corpo atual.

---

# 23. ASAS

Thumbnail:

```text
asas isoladas
```

com abertura completa.

Palco:

```text
avatar completo + camera wider
```

---

# 24. PETS / DRONES / COMPANHEIROS

Mostrar o próprio personagem secundário isolado.

Não o avatar principal.

---

# 25. FUNDOS

Thumbnail precisa ser:

```text
100% FUNDO
```

sem avatar.

É especialmente importante porque hoje há 26 backgrounds no catálogo. 

Um avatar sobre o fundo pode esconder diferenças entre:

```text
Estúdio
Biblioteca
Metrópole
Horizonte
Nebulosa
Neon
```

---

# 26. MOLDURAS

Mostrar:

```text
moldura + campo vazio/neutro
```

Não precisa mostrar avatar.

---

# 27. AURA

Mostrar aura sobre uma silhueta ghost simples.

Ela precisa de referência de escala, mas não de identidade.

---

# 28. EFEITOS

Mostrar efeito isolado em ambiente neutro quando possível.

Quando realmente depender da figura:

```text
neutral silhouette
```

---

# 29. NÃO MUDAR O CARD NO HOVER

Hoje o Modo Item usa:

```text
pairando = true
```

e o card muda de isolado para aplicado durante hover. 

Remover este comportamento como padrão.

Novo fluxo:

```text
CARD
permanece asset isolado

HOVER
↓
PALCO recebe preview aplicado
```

Isso é essencial.

O usuário precisa conseguir olhar os cards lado a lado e comparar.

---

# 30. CARD TEM IDENTIDADE ESTÁVEL

Um card não deve mudar radicalmente de conteúdo quando o mouse passa sobre ele.

Pode:

- elevar;
- iluminar borda;
- mostrar label “Prévia”;
- alterar sombra.

Mas sua imagem principal continua sendo **o asset**.

---

# 31. PALCO É O LOCAL DO “APLICADO”

O estado de hover já possui:

```text
aoPrever(preview)
```

Portanto a infraestrutura está pronta.

Use-a.

Fluxo:

```text
HOVER CARD
↓
config preview
↓
PALCO muda
↓
CARD não muda
```

---

# 32. CLICK

Clique continua:

```text
equipar
```

---

# 33. DETALHE DO ASSET

Hoje o hero do drawer mostra diretamente o item aplicado ao avatar. 

Mudar.

---

# 34. DETALHE — NOVA HIERARQUIA

Topo:

```text
ASSET
[asset isolado grande]
```

Abaixo ou ao lado:

```text
NO SEU AVATAR
[preview aplicado]
```

---

# 35. NÃO ESCONDER O PREVIEW APLICADO

Ele continua extremamente útil.

Só deixa de ser confundido com a identidade visual do asset.

---

# 36. RELATED ITEMS

Hoje “Relacionados” usa avatar completo para cada opção. 

Mudar para thumbnail isolado.

---

# 37. COLLECTION ITEMS

Verificar todas as superfícies.

Algumas coleções já usam `svgItemIsolado`, o que demonstra que não há impedimento arquitetural para reaproveitar o mecanismo.

Transformar em comportamento consistente.

---

# 38. VITRINE

Se o item é um asset:

```text
isolated thumbnail
```

Se é:

- preset;
- arquétipo;
- coleção;

então:

```text
avatar completo
```

Essa distinção é importante.

---

# 39. PRESET ≠ ASSET

Preset deve mostrar resultado completo.

Asset deve mostrar o asset.

---

# 40. COLLECTION ≠ ASSET

Coleção também pode mostrar composição completa.

Mas itens dentro dela devem mostrar cada peça isolada.

---

# 41. CRIAR UM CONTRATO ÚNICO

Conceito sugerido:

```text
presentationKind
```

Exemplos:

```text
isolated
ghost-context
avatar-context
composition
environment
effect-context
```

Não precisa ter exatamente estes nomes.

---

# 42. O CONTRATO DEVE SER DERIVADO DA CATEGORIA

Evitar:

```text
if cabelo...
if olhos...
if roupa...
if calçado...
```

espalhados por 10 componentes.

Uma fonte de verdade.

---

# 43. ASSET PRESENTATION REGISTRY

Exemplo conceitual:

```ts
{
  cabelo: {
    thumbnail: 'isolated',
    previewCamera: 'bust'
  },

  olhos: {
    thumbnail: 'isolated',
    previewCamera: 'face'
  },

  roupa: {
    thumbnail: 'isolated',
    previewCamera: 'full'
  },

  fundo: {
    thumbnail: 'environment',
    previewCamera: 'current'
  }
}
```

---

# 44. FOCO AUTOMÁTICO

Generalizar o que `medir-foco-item.mjs` já faz.

Hoje o medidor foi criado para acessórios. 

Expandir para:

```text
base
cabelo
olhos
boca
roupa
roupa inferior
calçados
acessórios
background
moldura
aura
efeito
```

---

# 45. NÃO MANTER CENTENAS DE VIEWBOX MANUAIS SEM PIPELINE

A medição deve ser:

```text
gerar
→ medir
→ revisar
→ bake
```

como já funciona.

---

# 46. TAMANHO DO ASSET NO CARD

Meta:

```text
70–85% da área útil
```

na dimensão dominante.

A regra já existe no Modo Item (~78%). 

Generalizar.

---

# 47. FUNDO DO THUMBNAIL

Usar fundo neutro comum para assets físicos.

Isso facilita comparação.

---

# 48. EXCEÇÃO — BACKGROUNDS

Background usa sua própria imagem como 100% da miniatura.

---

# 49. EXCEÇÃO — TRANSPARÊNCIA

Para:

- vidro;
- aura;
- partículas;
- transparência;

usar checker/neutro discretamente.

---

# 50. CATALOG DISTINCTIVENESS

Há 482 definições hoje. 

Quantidade não pode ser objetivo por si só.

---

# 51. NOVO GATE

Criar:

```text
ASSET DISTINCTIVENESS GATE
```

---

# 52. REGRA

Dois itens separados no catálogo devem ser reconhecíveis como duas opções diferentes **sem o usuário precisar ler o nome**.

---

# 53. TESTE CEGO

Criar contact sheet:

```text
sem nome
sem raridade
sem tema
sem ID
```

Somente thumbnails.

Pergunta:

> Consigo distinguir rapidamente cada opção?

---

# 54. SE NÃO CONSEGUE

Classificar:

```text
MERGE
VARIANT
REWORK
KEEP
```

---

# 55. MERGE

Usar quando dois assets são essencialmente o mesmo design.

---

# 56. VARIANT

Usar quando a principal diferença é:

- cor;
- material;
- acabamento;
- pequeno detalhe cosmético.

Não ocupar dois cards.

---

# 57. REWORK

Usar quando a intenção é ter duas peças diferentes, mas elas estão visualmente semelhantes demais.

---

# 58. KEEP

Diferença de silhueta e identidade visual suficientemente clara.

---

# 59. VARIANTES JÁ EXISTEM

O projeto já possui sistema de variantes de cor.

Usá-lo.

Não continuar criando:

```text
Camisa Azul
Camisa Vermelha
Camisa Verde
```

como três assets.

---

# 60. OLHOS PREMIUM — PRIORIDADE DE REVISÃO

A heurística estrutural encontrou similaridades muito altas:

```text
olh_px_amendoado ↔ olh_px_gentil       94,9%
olh_px_confiante ↔ olh_px_amendoado    94,2%
olh_px_sereno ↔ olh_px_intenso         92,5%
...
```



Isso não é prova visual.

Mas torna a família **P0 para contact sheet**.

---

# 61. O PROBLEMA DOS OLHOS É EXPLICÁVEL

Eles usam o mesmo builder `parOlhos()` e mudam parâmetros relativamente pequenos como:

```text
tilt
ry
irisR
palpebra
```



Isso é uma boa arquitetura.

Mas pode gerar opções insuficientemente distintas.

---

# 62. NÃO ABANDONAR O BUILDER

O problema não é compartilhar builder.

É a amplitude pequena do espaço visual.

---

# 63. ROSTOS PREMIUM

Também há candidatos:

```text
oval ↔ diamante
oval ↔ angular
coração ↔ redonda
...
```

na faixa aproximada de 77–81% estrutural. 

Fazer contact sheet específico.

---

# 64. CABELOS

Existem 60 opções. 

Candidatos encontrados:

```text
rabo ↔ rabo baixo
curto ↔ grisalho
franjinha ↔ cortina
buzz ↔ estrela raspada
```



Verificar visualmente.

---

# 65. GRISALHO NÃO DEVERIA NECESSARIAMENTE SER UM CABELO

Se:

```text
cab_curto
cab_grisalho
```

diferem principalmente pela cor,

transformar `grisalho` em **variante**.

Não manter como estilo independente.

Essa decisão deve depender da inspeção visual.

---

# 66. BACKGROUNDS

A heurística textual não encontrou duplicação tão forte quanto nos olhos.

Mas a percepção do usuário reporta fundos parecidos.

Portanto precisamos de **similaridade visual**, não apenas estrutural.

---

# 67. GERAR CONTACT SHEET DE BACKGROUND

26 opções em grid.

Sem avatar.

Sem nomes na primeira versão.

---

# 68. CONTACT SHEET DE ROUPAS

40 opções atuais. 

Mostrar roupas isoladas.

Isso provavelmente tornará a redundância muito mais fácil de detectar do que hoje.

---

# 69. CONTACT SHEET DE OLHOS

48 opções atuais. 

Olhos isolados e grandes.

---

# 70. CONTACT SHEET DE CABELO

60 opções.

---

# 71. CONTACT SHEET DE ACESSÓRIO

Separar por subcategoria.

Não colocar 88 acessórios juntos.

---

# 72. DISTÂNCIA VISUAL

Adicionar ferramenta opcional de comparação automática.

Não precisa decidir sozinha.

Pode gerar candidatos usando:

```text
perceptual hash
SSIM
pixel difference
silhouette overlap
```

sobre thumbnails canonizados.

---

# 73. AUTOMÁTICO NÃO DECIDE

A ferramenta apenas diz:

```text
“estes dois parecem semelhantes”
```

A decisão final é visual/humana.

---

# 74. SILHOUETTE FIRST

Para:

- cabelo;
- rosto;
- roupa;
- chapéu;

silhueta é métrica especialmente importante.

---

# 75. BACKGROUND

Para backgrounds:

- composição;
- distribuição de luz;
- paleta;
- cenário;
- depth structure.

---

# 76. NÃO MULTIPLICAR CATÁLOGO ANTES DA LIMPEZA

Suspenda temporariamente novas ondas de “população”.

Primeiro:

```text
ISOLAR
COMPARAR
DEDUPLICAR
REWORK
```

---

# 77. CATALOGO MENOR PODE SER MELHOR

Prefiro:

```text
25 cabelos excelentes e distintos
```

a:

```text
60 cabelos que parecem 25.
```

---

# 78. A MESMA REGRA PARA FUNDOS

Prefiro:

```text
12 backgrounds memoráveis
```

a:

```text
26 variações genéricas.
```

Isso não significa apagar conteúdo automaticamente.

Significa revisar a exposição.

---

# 79. LEGACY

Assets redundantes Legacy podem continuar renderizáveis para saves.

Mas podem:

```text
visibility = legacy/internal
```

e sair da grade principal.

---

# 80. NÃO QUEBRAR SAVES

Nunca deletar ID já utilizado sem migration/fallback.

---

# 81. CATÁLOGO PRINCIPAL

Mostrar os melhores.

---

# 82. “MAIS”

Se necessário:

```text
Mostrar Legacy
Mostrar todas
```

em filtros avançados.

---

# 83. GOLDEN CATALOG

Criar uma pequena seleção de referência:

```text
Golden Hair
Golden Eyes
Golden Clothes
Golden Backgrounds
Golden Accessories
```

---

# 84. NOVO GATE — THUMBNAIL CLARITY

Além de Distinctiveness:

```text
THUMBNAIL CLARITY GATE
```

---

# 85. HARD FAILS DE THUMBNAIL

Reprovar se:

- cabelo aparece com chapéu;
- roupa mostra rosto/cabelo como parte dominante;
- olhos ficam pequenos demais;
- calçado mostra avatar inteiro;
- background contém personagem;
- asset ocupa <60% sem justificativa;
- asset é cortado;
- o card muda de isolado para aplicado no hover;
- peças diferentes parecem iguais porque o avatar domina a imagem.

---

# 86. ACCEPTANCE TEST

Teste manual:

> cubra todos os nomes dos cards.

Ainda devo conseguir entender o que estou escolhendo.

---

# 87. SEGUNDO TESTE

Escolher rapidamente entre 10 itens da mesma categoria.

Se eu precisar abrir cada detalhe para entender a diferença:

```text
FAIL
```

---

# 88. TERCEIRO TESTE

Hover em qualquer opção.

Card não muda.

Palco muda.

---

# 89. QUARTO TESTE

Equipar chapéu.

Ir para Cabelo.

Nenhuma thumbnail de cabelo mostra o chapéu.

---

# 90. QUINTO TESTE

Equipar cabelo.

Ir para Chapéus.

Nenhuma thumbnail de chapéu mostra o cabelo.

---

# 91. SEXTO TESTE

Ir para Roupa.

Nenhum rosto é necessário para reconhecer a peça.

---

# 92. SÉTIMO TESTE

Ir para Calçado.

É possível comparar tênis/social/bota sem olhar um avatar inteiro.

---

# 93. OITAVO TESTE

Ir para Fundo.

Os fundos dominam 100% dos cards.

---

# 94. SUPERFÍCIES A AUDITAR

Não corrigir apenas `GradeItens`.

Verificar também:

```text
GradeItens
DetalheAsset
Relacionados
Colecoes
Vitrine
Consultor
Busca
Favoritos
Recentes
IA results
```

Quando mostra **asset individual**, usar política de asset.

---

# 95. NÃO ALTERAR PRESETS

Presets continuam avatar completo.

---

# 96. NÃO ALTERAR ARQUÉTIPOS

Arquétipos continuam personagem completo.

---

# 97. NÃO ALTERAR COLEÇÃO HERO

Hero de coleção continua composição completa.

---

# 98. SÓ ITEM INDIVIDUAL USA ASSET THUMBNAIL

Esta é a distinção central.

---

# 99. 2D + 3D

O mesmo princípio deverá existir nos dois renderers.

---

# 100. 3D ASSET CARDS

Quando surgirem catálogos de:

- hair GLB;
- outfit GLB;
- accessory GLB;

thumbs também devem ser isolados.

---

# 101. 3D HAIR THUMB

Renderizar cabelo num mannequin head neutro ou hair-only quando possível.

---

# 102. 3D OUTFIT THUMB

Ghost mannequin.

---

# 103. 3D ACCESSORY THUMB

Product shot.

---

# 104. 3D BACKGROUND

Environment preview sem personagem.

---

# 105. MESMA LINGUAGEM ENTRE 2D E 3D

Usuário aprende uma vez:

```text
cards = peças
palco = resultado
```

---

# 106. FASE 1 — INFRA UNIVERSAL

Generalizar Modo Item além de `acessorio`.

---

# 107. FASE 2 — CATEGORIAS PRINCIPAIS

Ordem:

```text
Cabelo
Olhos
Roupa
Calçados
Chapéus
Background
```

---

# 108. FASE 3 — RESTANTE

```text
Base
Boca
Nariz
Barba
Sobrancelha
Moldura
Aura
Efeito
Companheiros
```

---

# 109. FASE 4 — CONTACT SHEETS

Gerar automaticamente.

---

# 110. FASE 5 — REDUNDÂNCIA

Classificar:

```text
KEEP
VARIANT
REWORK
LEGACY_ONLY
```

---

# 111. FASE 6 — QA

Rodar:

```text
Thumbnail Clarity Gate
Asset Distinctiveness Gate
```

---

# 112. FASE 7 — ROLLOUT

Ativar no catálogo principal.

---

# 113. NÃO PRECISA DE FEATURE FLAG PARA SEMPRE

Pode nascer atrás de flag.

Depois da validação:

```text
ON
```

e consolidar.

---

# 114. MÉTRICAS

Registrar por categoria:

```text
total assets
exposed assets
legacy hidden
variants
rework candidates
distinct assets
```

---

# 115. MÉTRICA PRINCIPAL

Não:

```text
482 assets
```

Mas:

```text
quantas escolhas visualmente distintas?
```

---

# 116. REPORT FINAL DESTA FRENTE

Entregar:

```text
1. Antes do catálogo
2. Depois
3. Hair contact sheet
4. Eyes contact sheet
5. Clothes contact sheet
6. Background contact sheet
7. Duplicates/redundancy report
8. Assets convertidos em variantes
9. Assets em rework
10. Testes
```

---

# 117. NÃO MARCAR COMO CONCLUÍDO SEM SCREENSHOT

Obrigatório:

```text
ANTES
DEPOIS
```

da dock nas categorias:

```text
Hair
Eyes
Clothing
Shoes
Hats
Background
```

---

# 118. DEFINITION OF DONE

Esta frente termina apenas quando:

```text
Cabelo → somente cabelo
Olhos → somente olhos
Roupa → somente roupa
Calçado → somente calçado
Chapéu → somente chapéu
Background → somente background
```

e:

```text
hover → preview no palco
card → permanece isolado
```

---

# 119. DEFINITION OF DONE — REDUNDÂNCIA

Além disso:

- todos os olhos Premium revisados;
- faces Premium revisadas;
- cabelos candidatos revisados;
- backgrounds revisados;
- roupas revisadas;
- cada candidato classificado;
- variantes não ocupam cards desnecessários.

---

# 120. PRINCÍPIO FINAL

O catálogo deve responder rapidamente a:

> **“O que estou escolhendo?”**

O palco deve responder:

> **“Como isso fica no meu avatar?”**

Hoje as duas respostas aparecem misturadas.

A partir desta frente elas precisam ser **claramente separadas**.

---

## ORDEM IMEDIATA PARA O AGENTE

```text
P0 — Generalizar Asset Thumbnail isolado
P0 — Remover troca do card no hover
P0 — Cabelo / Olhos / Roupa / Calçado / Chapéus / Background
P0 — Corrigir DetalheAsset e Relacionados
P0 — Gerar contact sheets
P1 — Auditar redundância
P1 — Converter diferenças cosméticas em variantes
P1 — Rework dos assets parecidos
P1 — Aplicar mesma política às demais superfícies
P1 — Preparar paridade futura 3D
P1 — Thumbnail Clarity Gate
P1 — Asset Distinctiveness Gate
```

### Resultado esperado

A experiência precisa passar a funcionar assim:

```text
CATÁLOGO
↓
“VEJO EXATAMENTE A PEÇA”

HOVER
↓
“VEJO COMO ELA FICA NO MEU AVATAR”

CLICK
↓
“EQUIPO”
```

Esse é o comportamento que eu usaria como regra definitiva daqui para frente.