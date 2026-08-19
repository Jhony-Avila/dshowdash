# MEGA BRIEFING — ELEVAÇÃO GRÁFICA AAA DO AVATAR STUDIO DSHOW
## PARTE 1/12 — VISÃO, DIREÇÃO ARTÍSTICA, QUALITY BAR E REESTRUTURAÇÃO DO PADRÃO VISUAL

### 1. Objetivo desta nova frente

Esta etapa não deve ser tratada como uma simples melhoria cosmética do Avatar Studio.

O objetivo é promover uma **mudança substancial no nível de qualidade percebida dos personagens**, atacando a raiz do problema identificado visualmente nos prints e tecnicamente nas auditorias V2-A, V2-B, V2-C e V2-D.

Hoje existe uma discrepância importante:

> **A sofisticação da arquitetura técnica é significativamente superior à sofisticação visual que o usuário percebe na tela.**

A aplicação já possui uma infraestrutura relevante para evolução: catálogo parametrizado, renderização 2D e 3D, sistema modular, materiais, sockets, animações, câmeras, iluminação, LOD, pipeline de publicação e validação de assets.

No 3D, especificamente, já existem 14 sockets previstos, configuração persistível de materiais, morphs, iluminação, cenário, hora, clima e câmera.  

Também já existem assets UBC, cabelos, roupas modulares, três níveis de LOD e pacotes de animação publicados. 

Portanto:

**NÃO reconstruir indiscriminadamente a arquitetura.**

O trabalho agora deve transformar essa infraestrutura em **qualidade visual percebida**.

---

# 2. Problema central

O Avatar Studio atualmente transmite uma aparência que ainda pode ser percebida como:

- protótipo;
- low-poly simples;
- personagem genérico;
- cartoon básico;
- composição de formas;
- assets de biblioteca sem direção artística unificada;
- elementos sobrepostos;
- pouco volume;
- baixa materialidade;
- pouca riqueza facial;
- pouca diferenciação entre personagens;
- baixa profundidade;
- baixa sofisticação de iluminação;
- pouco acabamento;
- baixo impacto quando visto em close-up.

Esse problema torna-se ainda mais evidente quando o usuário aproxima a câmera do rosto.

O sistema pode possuir centenas ou milhares de combinações, mas:

> **Quantidade de combinações não equivale a qualidade percebida.**

O objetivo desta fase é corrigir essa relação.

---

# 3. Princípio fundamental desta implementação

A partir desta etapa, nenhuma decisão sobre assets deverá ser avaliada apenas por:

- quantidade;
- funcionamento;
- compatibilidade;
- ausência de erros;
- possibilidade de equipar;
- performance;
- existência no catálogo.

Todo asset deverá também passar por um novo eixo:

## **QUALIDADE ARTÍSTICA PERCEBIDA**

O sistema precisa evoluir de:

> “O asset funciona?”

para:

> “O asset funciona, integra-se corretamente e possui qualidade suficiente para pertencer a um Character Creator premium?”

---

# 4. Quality Bar

Estabelecer formalmente no projeto um **Avatar Visual Quality Bar**.

Todo personagem, asset ou nova família visual deverá ser avaliado em pelo menos:

1. silhueta;
2. proporção;
3. anatomia;
4. volume;
5. geometria;
6. materialidade;
7. textura;
8. iluminação;
9. sombra;
10. integração com o corpo;
11. integração com outros assets;
12. qualidade em close-up;
13. qualidade em corpo inteiro;
14. coerência estilística;
15. personalidade;
16. legibilidade;
17. acabamento;
18. percepção premium.

Um asset tecnicamente correto poderá ser **reprovado artisticamente**.

Isso precisa se tornar parte formal do Definition of Done.

---

# 5. Não perseguir fotorealismo

O objetivo **não deve ser transformar o Avatar Studio em um simulador de humanos fotorealistas**.

Isso aumentaria brutalmente:

- custo de produção;
- complexidade;
- peso;
- problemas de uncanny valley;
- dificuldade de personalização;
- inconsistência entre assets.

A direção recomendada é:

## **3D estilizado premium / semi-realista**

Características desejadas:

- anatomia estilizada, mas convincente;
- proporções intencionais;
- rostos expressivos;
- formas limpas;
- materiais ricos;
- cabelo estilizado sofisticado;
- roupas com volume;
- excelente iluminação;
- ótima leitura de silhueta;
- cores controladas;
- personalidade;
- qualidade cinematográfica.

O personagem deve parecer **intencionalmente estilizado**, e não “simples porque faltou detalhe”.

Essa diferença é fundamental.

---

# 6. Referência conceitual de qualidade

Não copiar artisticamente nenhum produto específico.

Entretanto, o agente deve pensar no nível de acabamento esperado em produtos como:

- character creators modernos;
- jogos AAA estilizados;
- experiências premium de identidade digital;
- interfaces de criação de personagens;
- plataformas de avatar de alta qualidade.

A pergunta de avaliação deve ser:

> **Se removermos completamente a marca Dshow da interface, o personagem ainda parece pertencer a um produto premium?**

Se a resposta for não, a etapa visual ainda não está concluída.

Essa lógica já aparece inclusive na documentação existente do projeto, que questiona se, removendo o logo Dshow, a experiência parece uma aplicação comum ou um Character Creator premium. 

---

# 7. Preservar o que já está tecnicamente correto

Não jogar fora recursos que já foram corretamente estruturados.

A auditoria mostrou que o renderer 3D já utiliza recursos importantes, incluindo:

- `THREE.SRGBColorSpace`;
- ACES Filmic Tone Mapping;
- environment map;
- `EffectComposer`;
- `UnrealBloomPass`;
- `MeshStandardMaterial`. 

Além disso, o pipeline existente já trabalha com:

- GLB;
- LOD;
- Meshopt;
- WebP;
- limites de triângulos;
- limites de textura;
- UV validation;
- rig validation;
- hashes;
- manifests. 

Portanto, antes de substituir uma tecnologia existente, o agente deverá responder:

> **A limitação está realmente na arquitetura ou no conteúdo que está sendo renderizado por ela?**

Não reescrever sistemas maduros apenas para produzir uma alteração visual.

---

# 8. Separar definitivamente engenharia e arte

O projeto precisa reconhecer quatro camadas independentes:

### CAMADA A — ENGINEERING

Responsável por:

- renderer;
- carregamento;
- cache;
- LOD;
- performance;
- sockets;
- estado;
- persistência;
- animação;
- câmera;
- composição.

### CAMADA B — ASSET QUALITY

Responsável por:

- modelagem;
- topologia;
- anatomia;
- cabelo;
- roupa;
- acessórios;
- UV;
- texturas;
- materiais.

### CAMADA C — ART DIRECTION

Responsável por:

- linguagem visual;
- proporções;
- identidade;
- paleta;
- acabamento;
- coerência entre famílias;
- raridades;
- coleções;
- diferenciação.

### CAMADA D — PRESENTATION

Responsável por:

- iluminação;
- câmera;
- enquadramento;
- fundo;
- chão;
- atmosfera;
- VFX;
- pós-processamento.

O salto gráfico só ocorrerá se as quatro evoluírem coordenadamente.

---

# 9. Não mascarar asset ruim com pós-processamento

Bloom, glow, vignette, contraste, partículas e iluminação não devem ser utilizados para esconder:

- anatomia ruim;
- roupa sem volume;
- cabelo pobre;
- acessórios primitivos;
- rosto genérico;
- geometria insuficiente.

Pós-processamento deverá **valorizar arte boa**, não disfarçar arte ruim.

---

# 10. Prioridade absoluta: personagem antes do cenário

A ordem de investimento visual deverá ser:

### P0 — PERSONAGEM

Primeiro:

- corpo;
- rosto;
- pele;
- olhos;
- boca;
- cabelo;
- barba;
- roupas;
- acessórios principais.

### P1 — APRESENTAÇÃO

Depois:

- materiais;
- iluminação;
- sombras;
- câmera;
- ambiente.

### P2 — ENRIQUECIMENTO

Finalmente:

- auras;
- poderes;
- partículas;
- companions;
- fundos;
- clima;
- VFX;
- elementos especiais.

Não adianta produzir uma aura espetacular em volta de um personagem visualmente fraco.

---

# 11. O rosto deverá receber tratamento especial

A região facial deverá possuir **quality bar superior ao restante do corpo**.

Motivo:

O próprio sistema já possui preset de câmera específico para rosto. No humano, por exemplo, existe enquadramento facial próprio no catálogo 3D. 

Portanto, qualquer defeito facial ficará evidente.

Isso significa que:

> Um personagem aceitável a 3 metros virtuais pode ser inaceitável no modo rosto.

O QA deverá obrigatoriamente avaliar ambos.

---

# 12. Escala de avaliação visual

Criar quatro distâncias padronizadas para homologação:

### DISTÂNCIA A — FULL BODY

Avaliar:

- silhueta;
- proporção;
- roupa;
- acessórios;
- pose.

### DISTÂNCIA B — ¾

Avaliar:

- volume;
- integração das peças;
- materiais;
- anatomia.

### DISTÂNCIA C — BUSTO

Avaliar:

- rosto;
- cabelo;
- pele;
- barba;
- olhos;
- acabamento.

### DISTÂNCIA D — CLOSE-UP

Avaliar:

- geometria facial;
- olhos;
- boca;
- sobrancelhas;
- cabelo;
- transições;
- materiais;
- artefatos;
- clipping.

Um asset só poderá ser classificado como **Premium** se passar pelos enquadramentos relevantes.

---

# 13. Introduzir classificação artística dos assets

Além da raridade comercial existente, criar internamente um atributo de **qualidade de produção**.

Exemplo conceitual:

```text
DEV
LEGACY
STANDARD
PREMIUM
HERO
```

Isso NÃO deve necessariamente aparecer para o usuário.

### DEV

Asset técnico/procedural usado para desenvolvimento.

### LEGACY

Asset antigo preservado por compatibilidade.

### STANDARD

Asset aprovado para utilização normal.

### PREMIUM

Asset com acabamento elevado.

### HERO

Asset utilizado como referência máxima de qualidade.

Isso evitará misturar no mesmo nível visual um placeholder procedural e um asset final.

---

# 14. Não confundir raridade com qualidade

Um item:

**Comum**

pode possuir modelagem excelente.

E um item:

**Lendário**

pode possuir mais VFX, animações e características especiais.

Portanto:

```text
RARIDADE != QUALIDADE TÉCNICA
```

Todos os níveis de raridade precisam respeitar um mínimo de qualidade.

Raridade deverá representar:

- exclusividade;
- complexidade;
- efeitos;
- lore;
- coleção;
- animação;
- disponibilidade.

Não acabamento malfeito versus bem-feito.

---

# 15. Assets procedurais atuais

A auditoria demonstrou que parte da arquitetura de acessórios foi criada deliberadamente como validação procedural.

O próprio catálogo descreve essa primeira leva como itens de **“geometria pura”**, deixando explícito que a arte por socket viria posteriormente. 

Isso foi correto como engenharia.

Mas agora precisamos estabelecer:

> **Placeholder técnico não poderá ser confundido com asset artístico final.**

Coroas, asas, óculos, jetpacks, pets, companions e demais elementos procedurais deverão ser inventariados.

Para cada um:

```text
MANTER COMO FINAL
RETRABALHAR
SUBSTITUIR
DEV-ONLY
```

Na maioria dos casos visualmente simples, a tendência deverá ser **RETRABALHAR ou SUBSTITUIR**, preservando socket, ID, regras e comportamento quando possível.

---

# 16. UBC não significa automaticamente “qualidade final”

Outro ponto crítico:

O projeto já possui bases UBC e infraestrutura modular compatível.

Isso é uma excelente fundação.

Entretanto:

> **UBC deve ser tratado como base técnica/artística, não como garantia automática do resultado final.**

O personagem final Dshow deverá possuir identidade própria.

Não queremos que o usuário reconheça imediatamente:

> “isso é um asset pack.”

Precisamos chegar a:

> “isso é o Avatar Studio Dshow.”

---

# 17. Criar uma assinatura visual Dshow

A direção artística deverá desenvolver uma assinatura reconhecível.

Ela poderá ser construída através de:

- proporções;
- formato facial;
- tratamento dos olhos;
- cabelo;
- materiais;
- paleta;
- iluminação;
- UI;
- poses;
- VFX;
- acessórios;
- linguagem futurista;
- elementos digitais.

Mas evitar transformar tudo em neon/cyberpunk.

A identidade Dshow precisa permitir:

- executivo;
- casual;
- aventureiro;
- urbano;
- fantasy;
- futurista;
- esportivo;
- elegante;
- tecnológico.

Sem perder coerência.

---

# 18. Diversidade visual real

“Mais opções” não poderá significar apenas:

> mesma geometria + outra cor.

Precisamos criar diversidade através de:

- silhuetas;
- proporções;
- volumes;
- formas;
- comprimentos;
- materiais;
- detalhes;
- assimetrias;
- estilos.

Isso será especialmente importante para:

- rostos;
- cabelos;
- barbas;
- roupas;
- acessórios.

---

# 19. Evitar o efeito “paper doll”

Um dos maiores riscos do sistema modular é o personagem parecer um boneco sobre o qual diferentes elementos foram simplesmente colados.

O agente deverá avaliar:

- encaixe;
- contato;
- interpenetração;
- espessura;
- deformação;
- sombra de contato;
- clipping;
- relação entre roupa e corpo;
- relação cabelo/cabeça;
- acessórios/corpo.

A modularidade precisa parecer **natural**, não composta.

---

# 20. Materiais deverão comunicar o que o objeto é

A simples alteração de cor não será suficiente.

O usuário precisa visualmente reconhecer diferenças entre:

- pele;
- algodão;
- couro;
- denim;
- metal;
- plástico;
- borracha;
- vidro;
- tecido técnico;
- material emissivo;
- cabelo.

A infraestrutura já contempla mapas como `normalMap`, `roughnessMap`, `metalnessMap`, `aoMap` e `emissiveMap`. 

Portanto, essa capacidade deverá passar a ser explorada artisticamente.

---

# 21. Iluminação como parte da identidade

A iluminação não deverá apenas “deixar o personagem visível”.

Ela deverá:

- modelar o rosto;
- separar personagem/fundo;
- destacar silhueta;
- revelar materiais;
- criar profundidade;
- produzir sombra coerente;
- valorizar olhos e cabelo.

O sistema já possui presets de iluminação `estudio`, `dramatica` e `neon`. 

Esses presets deverão evoluir de parâmetros técnicos para **looks cinematográficos realmente distintos**.

---

# 22. Regra para o modo Clássico

O modo Clássico **não deverá tentar imitar o 3D**.

Ele deverá ganhar identidade própria:

## **Premium Stylized 2D / 2.5D**

Isso significa utilizar melhor:

- shape design;
- gradientes;
- luz;
- sombra;
- highlights;
- sobreposição;
- profundidade;
- textura controlada;
- contorno seletivo;
- detalhes;
- parallax quando apropriado.

O objetivo é que o modo clássico pareça uma **escolha artística deliberada**, e não a versão barata do 3D.

---

# 23. Regra para o modo 3D

O 3D deverá tornar-se o ambiente de maior fidelidade.

Objetivo:

> O usuário abrir o modo 3D e perceber imediatamente um salto de qualidade.

Não apenas:

> “agora o personagem gira”.

O diferencial deverá estar em:

- volume;
- material;
- profundidade;
- iluminação;
- animação;
- câmera;
- cabelo;
- roupas;
- expressão;
- ambiente.

---

# 24. Não produzir conteúdo em massa antes do novo quality bar

Esta regra é extremamente importante.

**Suspender a ideia de expansão indiscriminada de assets no padrão visual antigo.**

Não significa apagar ou bloquear o catálogo existente.

Significa:

> antes de criar centenas de novos assets, produzir um pequeno conjunto de referência no novo padrão.

---

# 25. Criar os GOLDEN AVATARS

Antes da produção em escala, criar uma pequena coleção interna de personagens que represente a nova qualidade.

Sugestão:

### Golden Avatar 01
Humano masculino.

### Golden Avatar 02
Humano feminino.

### Golden Avatar 03
Humano masculino com estética diferenciada.

### Golden Avatar 04
Humano feminino com estética diferenciada.

Eles deverão possuir:

- rosto novo;
- pele;
- olhos;
- cabelo;
- roupa;
- acessórios;
- materiais;
- iluminação;
- pose;
- animação;
- close-up.

Esses personagens serão o **benchmark interno**.

---

# 26. Golden Avatar como gate

Nenhuma expansão massiva deverá ocorrer antes da aprovação dos Golden Avatars.

Fluxo:

```text
ARQUITETURA EXISTENTE
        ↓
QUALITY BAR
        ↓
GOLDEN AVATARS
        ↓
AVALIAÇÃO VISUAL
        ↓
CORREÇÕES
        ↓
APROVAÇÃO
        ↓
PIPELINE DEFINITIVO
        ↓
PRODUÇÃO EM ESCALA
```

Isso evita produzir 500 assets e depois descobrir que todos precisam ser refeitos.

---

# 27. Compatibilidade

Toda elevação deverá preservar sempre que possível:

- IDs;
- saves;
- presets;
- histórico;
- desbloqueios;
- raridades;
- coleções;
- regras;
- sockets;
- API;
- banco;
- configuração persistida.

Quando um asset visual for substituído, preferir:

> trocar sua representação artística mantendo sua identidade lógica.

---

# 28. Performance continua sendo requisito

Qualidade premium não significa:

- modelos gigantescos;
- texturas 8K indiscriminadas;
- 1 milhão de polígonos;
- 30




Continuação da **PARTE 1/12 — VISÃO, DIREÇÃO ARTÍSTICA, QUALITY BAR E REESTRUTURAÇÃO DO PADRÃO VISUAL**

---

# 28. Performance continua sendo requisito

Qualidade premium não significa:

- modelos gigantescos;
- texturas 8K indiscriminadas;
- 1 milhão de polígonos por personagem;
- dezenas de materiais únicos sem necessidade;
- excesso de transparências;
- shaders pesados em todos os elementos;
- pós-processamento indiscriminado;
- partículas ilimitadas;
- desperdício de VRAM.

A arquitetura existente já possui uma preocupação importante com performance, inclusive com três LODs, limites de triângulos e texturas diferentes por nível. O pipeline atual estabelece gates de até 60k triângulos para LOD0, 25k para LOD1 e 8k para LOD2, além de tratamento diferenciado de texturas.  

Esses mecanismos deverão ser **preservados e evoluídos**, não removidos em nome da qualidade.

A meta deverá ser:

> **máxima qualidade perceptiva por unidade de custo gráfico.**

---

# 29. Redistribuir o orçamento gráfico conforme importância perceptiva

Nem todas as regiões precisam receber o mesmo orçamento.

A prioridade deverá seguir a percepção humana.

### Prioridade máxima

- rosto;
- olhos;
- cabelo;
- pele;
- barba;
- mãos quando visíveis;
- silhueta da roupa.

### Prioridade alta

- torso;
- acessórios próximos ao rosto;
- ombros;
- materiais principais;
- elementos Hero.

### Prioridade média

- pernas;
- calçados;
- acessórios secundários.

### Prioridade menor

- elementos distantes;
- cenário secundário;
- partículas pequenas;
- objetos fora do foco.

Inclusive, a própria documentação do projeto já prevê a ideia de LOD por contexto, chegando a exemplificar rosto e cabelo em LOD0 enquanto roupa, sapato e cenário podem operar em níveis inferiores. 

Essa lógica deverá passar a orientar também a produção artística.

---

# 30. Quality Budget por categoria

Criar um orçamento técnico/artístico por categoria.

Exemplo conceitual:

```text
FACE
qualidade geométrica: máxima
textura: máxima
material: máxima
close-up: obrigatório

HAIR
silhueta: máxima
transparência/hair cards: controlada
LOD: obrigatório
close-up: obrigatório

CLOTHING
deformação: máxima
materialidade: alta
detalhamento geométrico: médio/alto

SHOES
detalhamento: médio
close-up: opcional

BACKGROUND
detalhamento dependente da câmera

VFX
custo dinâmico dependente do quality tier
```

Não utilizar uma única regra para todos os assets.

---

# 31. O LOD não poderá destruir a identidade

O pipeline existente já gera diferentes LODs, o que deverá continuar.

Entretanto, otimização não poderá significar simplesmente reduzir polígonos até passar no validador.

O LOD deverá preservar:

- silhueta;
- formato facial;
- penteado;
- volume principal;
- leitura da roupa;
- elementos icônicos;
- acessórios relevantes.

A documentação existente já estabelece explicitamente:

> “Não aceitar LOD que destrua silhueta.” 

Transformar isso em critério de homologação visual real.

---

# 32. Diferenciar validação técnica de validação artística

Hoje o pipeline possui validações técnicas importantes.

Precisamos acrescentar uma segunda camada.

### Gate técnico

Verificar:

- arquivo válido;
- rig;
- bones;
- UV;
- textura;
- tamanho;
- triângulos;
- hash;
- LOD;
- naming;
- licença;
- manifest.

### Gate artístico

Verificar:

- aparência;
- silhueta;
- anatomia;
- integração;
- clipping;
- materiais;
- qualidade facial;
- qualidade em movimento;
- coerência com a direção artística;
- qualidade em close-up.

Um asset somente poderá ser considerado **production-ready** após passar pelos dois.

---

# 33. Criar `VisualQA` no pipeline

O agente deverá avaliar a criação de uma camada formal:

```text
TechnicalQA
        +
VisualQA
        =
ProductionReady
```

O `VisualQA` deverá possuir estados como:

```text
pending
approved
approved_with_notes
rework
rejected
```

E registrar, quando aplicável:

- responsável;
- versão;
- data;
- screenshots;
- observações;
- problemas;
- comparação com Golden Avatar.

---

# 34. Gerar imagens padronizadas automaticamente

Todo asset relevante deverá possuir renders de homologação padronizados.

Para personagens:

1. frente corpo inteiro;
2. ¾ corpo inteiro;
3. perfil;
4. costas;
5. busto;
6. rosto;
7. rosto ¾.

Para cabelos:

- frente;
- perfil;
- costas;
- close-up.

Para roupas:

- frente;
- ¾;
- costas;
- pose de deformação.

Para acessórios:

- equipado;
- isolado quando necessário;
- close-up.

Essas imagens devem permitir comparar assets rapidamente.

---

# 35. Criar um Visual Regression Set

Os Golden Avatars deverão gerar automaticamente screenshots de referência.

Exemplo:

```text
golden_male_fullbody.png
golden_male_bust.png
golden_male_face.png
golden_male_34.png

golden_female_fullbody.png
golden_female_bust.png
golden_female_face.png
golden_female_34.png
```

Essas imagens formarão uma base para detectar regressões.

Não depender exclusivamente de testes funcionais.

Um teste pode passar enquanto o cabelo está atravessando a testa.

---

# 36. Introduzir avaliação de clipping

O sistema modular exige QA específico para interpenetração.

Verificar automaticamente ou semiautomaticamente:

- cabelo × cabeça;
- cabelo × orelha;
- cabelo × ombro;
- barba × rosto;
- óculos × nariz;
- chapéu × cabelo;
- camisa × corpo;
- jaqueta × camisa;
- braço × manga;
- calça × torso;
- calça × sapato;
- mochila × costas;
- colar × pescoço;
- acessórios × animação.

O próprio levantamento anterior identifica **clipping QA** como uma lacuna ainda existente no pipeline. 

Portanto, esta frente deverá ser tratada formalmente.

---

# 37. O personagem precisa funcionar em movimento

Não homologar personagens apenas em T-pose ou pose neutra.

Avaliar pelo menos:

- Idle;
- caminhada, se disponível;
- aceno;
- expressão;
- giro;
- pose Hero;
- braços elevados;
- movimento de cabeça.

As roupas e acessórios precisam continuar visualmente corretos durante animação.

---

# 38. Qualidade facial não poderá depender somente de morph

Morph targets devem adicionar expressão.

Não devem ser utilizados para compensar uma base facial pobre.

A hierarquia correta deverá ser:

```text
BOA GEOMETRIA FACIAL
        ↓
BOAS PROPORÇÕES
        ↓
BONS MATERIAIS
        ↓
BONS OLHOS/BOCA
        ↓
MORPH TARGETS
        ↓
ANIMAÇÃO FACIAL
```

---

# 39. Evitar uniformidade excessiva dos personagens

Um Character Creator perde valor quando todos os personagens parecem irmãos usando roupas diferentes.

A nova direção deverá permitir diferenças significativas em:

- largura facial;
- comprimento facial;
- mandíbula;
- queixo;
- maçãs do rosto;
- nariz;
- olhos;
- sobrancelhas;
- boca;
- testa;
- proporção corporal;
- cabelo;
- idade visual;
- postura.

Isso será aprofundado nas próximas partes.

---

# 40. Diversidade de pele não significa somente hexadecimal

O catálogo atual já oferece diferentes cores para pele. 

Isso é apenas a primeira camada.

No novo padrão, pele deverá considerar também:

- roughness;
- variação tonal;
- lábios;
- região dos olhos;
- nariz;
- bochechas;
- microvariação;
- resposta à iluminação;
- diferença entre pele e outros materiais.

No 3D premium, evitar aparência de:

- plástico;
- borracha;
- porcelana;
- cor uniforme chapada.

---

# 41. Separar cor de material

Este princípio deverá valer em toda a arquitetura visual:

```text
COR != MATERIAL
```

Duas camisetas azuis podem ser visualmente muito diferentes se uma for:

- algodão;

e outra:

- tecido esportivo sintético.

Da mesma forma:

```text
METAL DOURADO
```

não é simplesmente:

```text
#FFD700
```

O material deverá definir comportamento físico e visual.

---

# 42. Material Families

Preparar famílias de materiais reutilizáveis.

Exemplo:

```text
skin_soft
skin_matte
cotton
denim
leather
satin
technical_fabric
rubber
plastic_matte
plastic_gloss
metal_brushed
metal_polished
glass
emissive
hair
```

Cada família deverá possuir defaults coerentes de:

- roughness;
- metalness;
- normal intensity;
- AO;
- emissive;
- opacity quando necessário;
- environment response.

Depois, o asset referencia a família e aplica seus parâmetros.

---

# 43. Não multiplicar materiais desnecessariamente

A implementação deverá evitar:

> 300 camisetas = 300 materiais completamente independentes.

Preferir:

```text
materialFamily: cotton
baseColor: X
normalVariant: Y
pattern: Z
```

A própria documentação já prevê material base + parâmetros e recomenda evitar duplicação completa de materiais. 

Transformar isso em padrão real do pipeline.

---

# 44. Normal maps deverão ser usados com propósito

Não adicionar normal map apenas para “parecer avançado”.

Usar para comunicar:

- trama de tecido;
- costura;
- couro;
- pequenas irregularidades;
- detalhes de superfície.

Detalhes grandes devem continuar na geometria quando impactarem a silhueta.

---

# 45. Roughness será fundamental

Roughness deverá se tornar um dos principais elementos da nova linguagem.

Exemplo:

### Pele
roughness relativamente alta, mas não totalmente fosca.

### Algodão
alta.

### Couro
média.

### Metal polido
baixa.

### Metal escovado
média + normal apropriada.

### Vidro
tratamento específico.

### Cabelo
shader/material adequado ao estilo escolhido.

Isso aumentará significativamente a leitura dos objetos sem exigir geometria excessiva.

---

# 46. Revisar o atual conceito “metal/brilho”

O catálogo atual expõe:

```text
material: {
    metal,
    brilho
}
```

e internamente converte brilho em roughness. 

Isso pode continuar existindo como **controle simplificado para o usuário**, mas não deverá representar todo o sistema interno de materiais.

Internamente, a arquitetura precisa ser capaz de trabalhar com parâmetros mais ricos.

A UI pode dizer:

```text
Brilho
```

enquanto internamente temos:

```text
roughness
clearcoat
specular
environmentIntensity
```

quando necessário.

---

# 47. Usuário não precisa virar técnico de PBR

Evitar apresentar ao usuário comum controles como:

```text
IOR
specularIntensity
normalScale
anisotropy
clearcoatRoughness
```

A experiência deverá oferecer controles compreensíveis.

Exemplo:

```text
Fosco ←────────→ Brilhante
Suave ←────────→ Metálico
```

ou presets:

```text
Algodão
Couro
Metal
Cetim
Tecnológico
```

Modo Dev poderá expor valores técnicos.

---

# 48. Construir “looks”, não apenas parâmetros

A aplicação deverá oferecer combinações visualmente curadas.

Por exemplo:

### LOOK — STUDIO

- iluminação suave;
- background neutro;
- contraste controlado;
- excelente leitura facial.

### LOOK — HERO

- key light mais dramática;
- rim light;
- maior contraste;
- fundo profundo.

### LOOK — NEON

- iluminação colorida;
- emissive;
- bloom controlado.

### LOOK — PORTRAIT

- foco facial;
- iluminação mais suave;
- DOF apenas se tecnicamente apropriado;
- exposição otimizada para pele.

O sistema já possui presets de iluminação e câmera; a nova fase deverá transformá-los em **direção cinematográfica real**, e não apenas combinações de parâmetros. 

---

# 49. Preset Studio deverá ser o benchmark neutro

Toda avaliação artística deverá começar no preset **Studio**.

Por quê?

Porque iluminação dramática pode esconder problemas.

Studio precisa revelar:

- geometria;
- materiais;
- clipping;
- textura;
- proporção.

Se um asset só parece bom com Neon + Bloom + partículas, ele ainda não está aprovado.

---

# 50. Depois testar Hero

Depois do Studio, testar Hero.

O Hero deverá revelar se:

- silhueta funciona;
- materiais respondem bem;
- rim light funciona;
- cabelo se separa do fundo;
- metal parece metal;
- pele continua natural.

---

# 51. Depois testar Portrait

Portrait deverá ser o teste mais rigoroso para:

- rosto;
- cabelo;
- olhos;
- sobrancelhas;
- barba;
- pele;
- boca.

Nenhum rosto Premium deverá ser aprovado sem passar por esse teste.

---

# 52. Evitar Bloom excessivo

A aplicação já possui `UnrealBloomPass`. 

Utilizar com extremo controle.

Bloom deverá ocorrer principalmente em:

- emissive;
- energia;
- aura;
- neon;
- magia;
- determinados highlights.

Não transformar toda a imagem em glow.

---

# 53. Tone Mapping deverá permanecer consistente

ACES Filmic já está presente. 

Preservar como baseline enquanto não houver motivo técnico/artístico demonstrável para alterar.

Criar testes para impedir que:

- pele estoure;
- preto seja esmagado;
- cores saturadas percam detalhe;
- emissive destrua exposição.

---

# 54. Color Management obrigatório

Garantir coerência entre:

- thumbnails;
- preview;
- viewport;
- Photo Studio;
- Vitrine;
- exportação;
- screenshots.

Um asset não poderá aparecer roxo em um local e azul em outro por diferenças de color space.

---

# 55. Ambiente deverá contribuir para materiais

O environment map já existe no renderer. 

A nova implementação deverá avaliar environments artisticamente melhores, desde que respeitados:

- performance;
- licença;
- consistência;
- peso.

Especialmente materiais metálicos dependem fortemente disso.

---

# 56. Sombras de contato

Um personagem sem boa sombra de contato parece flutuar.

Implementar/revisar:

- contato dos pés;
- AO;
- sombra corporal;
- acessórios;
- roupa;
- cabelo.

Evitar sombra excessivamente dura em preset neutro.

---

# 57. Profundidade sem sacrificar legibilidade

A cena deverá possuir:

- foreground;
- personagem;
- background.

Mas o personagem continua sendo o foco.

Background nunca deverá competir excessivamente com:

- rosto;
- silhueta;
- acessórios.

---

# 58. Criar hierarquia visual do personagem

A leitura desejada deverá seguir aproximadamente:

```text
1. ROSTO
2. SILHUETA
3. ROUPA PRINCIPAL
4. CABELO
5. ACESSÓRIOS IMPORTANTES
6. DETALHES
7. VFX
8. CENÁRIO
```

Não permitir que uma aura tenha mais presença que o rosto, exceto em momentos deliberadamente especiais.

---

# 59. Sistema de raridade deverá influenciar apresentação com moderação

Raridade poderá influenciar:

- VFX;
- apresentação;
- partículas;
- material especial;
- card;
- entrada;
- animação.

Mas não deverá destruir a coerência do personagem.

Evitar:

```text
Lendário = tudo piscando.
```

Premium depende de controle.

---

# 60. Hero Assets

Alguns assets deverão ser escolhidos como **Hero Assets**.

Esses serão utilizados em:

- marketing;
- onboarding;
- presets;
- screenshots;
- demonstrações;
- coleções;
- Photo Studio.

Precisam receber atenção adicional.

---

# 61. Um Hero Asset não pode ser procedural simples

Itens como:

- coroa;
- asas;
- jetpack;
- cetro;
- pet;

podem manter versões procedurais como fallback/dev.

Mas os principais assets de demonstração deverão receber arte definitiva.

O catálogo atual deixa explícito que a primeira leva procedural servia para validar o contrato e que a arte ainda viria posteriormente. 

Agora chegou justamente essa etapa.

---

# 62. Definir claramente PLACEHOLDER

Criar flag/metadado como:

```text
visual_status:
prototype
placeholder
legacy
production
hero
```

Um placeholder nunca deverá:

- aparecer como destaque;
- virar imagem de marketing;
- ser utilizado como benchmark;
- ser confundido com asset final.

---

# 63. Não apagar placeholders úteis

Eles continuam úteis para:

- testar sockets;
- testar comportamento;
- testar animações;
- desenvolver novas categorias;
- testes automatizados.

Portanto:

**preservar tecnicamente, rebaixar artisticamente.**

---

# 64. Estabelecer comparação Before/After

Para cada grande frente, produzir:

```text
BEFORE
AFTER
```

Mesma:

- câmera;
- pose;
- iluminação;
- configuração.

Assim conseguimos medir se houve salto real.

---

# 65. Critério de aprovação não poderá ser “fic




Continuação da **PARTE 1/12 — VISÃO, DIREÇÃO ARTÍSTICA, QUALITY BAR E REESTRUTURAÇÃO DO PADRÃO VISUAL**

---

# 65. Critério de aprovação não poderá ser “ficou melhor”

A homologação visual não poderá depender apenas de uma percepção subjetiva como:

> “Melhorou bastante.”

ou:

> “Está mais bonito que antes.”

Precisamos transformar a evolução gráfica em critérios comparáveis.

Cada Golden Avatar deverá ser avaliado em uma matriz de qualidade.

### Matriz mínima

| Dimensão | Nota mínima |
|---|---:|
| Silhueta | 8/10 |
| Anatomia/proporção | 8/10 |
| Rosto | 9/10 |
| Pele | 8/10 |
| Olhos | 9/10 |
| Cabelo | 8/10 |
| Roupa | 8/10 |
| Materiais | 8/10 |
| Iluminação | 8/10 |
| Integração dos assets | 9/10 |
| Ausência de clipping perceptível | 9/10 |
| Close-up | 9/10 |
| Movimento | 8/10 |
| Coerência artística | 9/10 |
| Percepção premium geral | 9/10 |

Essa pontuação não precisa necessariamente virar funcionalidade pública da aplicação.

Ela deverá funcionar como **instrumento interno de QA e homologação**.

---

# 66. Hard Fail visual

Alguns problemas deverão reprovar automaticamente um asset Premium, independentemente da média.

Exemplos:

- olhos atravessando geometria;
- cabelo penetrando significativamente o rosto;
- barba flutuando;
- roupa atravessando o corpo;
- mãos atravessando acessórios;
- pescoço desconectado;
- materiais sem coerência;
- textura visivelmente pixelada no enquadramento suportado;
- normal invertida;
- partes transparentes indevidas;
- costura evidente entre módulos;
- animação quebrando a malha;
- LOD destruindo a silhueta;
- sombra incorreta de grande impacto;
- asset aparecendo em T-pose;
- proporção corporal claramente defeituosa;
- personagem perdendo elementos ao mudar qualidade;
- diferenças graves entre preview e resultado equipado.

Esses casos deverão ser classificados como:

```text
VISUAL_QA = REJECTED
```

---

# 67. Soft Fail

Outros problemas poderão gerar:

```text
APPROVED_WITH_NOTES
```

por exemplo:

- pequena diferença de material;
- microclipping visível apenas em ângulo extremo;
- detalhe secundário simplificado em LOD2;
- pequena inconsistência em animação rara;
- variação de sombra sem impacto significativo.

Entretanto, `approved_with_notes` não poderá virar depósito permanente de dívida técnica.

Registrar:

- problema;
- severidade;
- asset;
- versão;
- responsável;
- previsão de correção.

---

# 68. Criar uma “Escada de Qualidade”

Formalizar no projeto cinco níveis:

```text
Q0 — PROTOTYPE
Q1 — LEGACY
Q2 — PRODUCTION
Q3 — PREMIUM
Q4 — HERO
```

### Q0 — Prototype

Serve para validar:

- arquitetura;
- socket;
- interação;
- regra;
- pipeline.

Não representa qualidade final.

### Q1 — Legacy

Conteúdo antigo funcional mantido por compatibilidade.

### Q2 — Production

Pode aparecer normalmente para o usuário.

### Q3 — Premium

Qualidade superior, apta a coleções importantes e exposição.

### Q4 — Hero

Referência máxima.

A imagem promocional do Avatar Studio deverá preferencialmente utilizar Q4.

---

# 69. Qualidade deverá existir no catálogo como dado

Não deixar essa classificação apenas em documentação.

Preparar o catálogo para receber algo equivalente a:

```ts
visualQuality: 'prototype' | 'legacy' | 'production' | 'premium' | 'hero'
```

ou nomenclatura equivalente coerente com a arquitetura atual.

Também considerar:

```ts
visualVersion: 2
visualQaStatus: 'pending' | 'approved' | 'approved_with_notes' | 'rework' | 'rejected'
```

Não criar campos redundantes se já houver estrutura equivalente.

O agente deverá primeiro auditar os contratos existentes.

---

# 70. Versão visual independente da identidade lógica

Precisamos poder evoluir:

```text
cab_longo
```

sem necessariamente criar:

```text
cab_longo_v2
cab_longo_v3
cab_longo_final
cab_longo_final2
```

A identidade lógica do asset deverá permanecer estável quando o conceito continuar sendo o mesmo.

A versão artística/técnica deverá ser controlada por metadados/manifests.

Isso preserva:

- favoritos;
- histórico;
- presets;
- saves;
- coleções;
- desbloqueios.

---

# 71. Substituição visual deverá ser reversível

Quando um asset existente receber nova arte:

```text
Asset lógico
      ↓
Representation V1
      ↓
Representation V2
```

Manter capacidade de rollback enquanto a nova representação estiver em homologação.

Não sobrescrever irreversivelmente conteúdo de produção antes da validação.

---

# 72. Feature Flag para a nova geração visual

Se a arquitetura existente permitir, criar uma flag específica para a nova geração artística.

Conceitualmente:

```text
avatar.visual_v2
```

ou nomenclatura equivalente ao padrão já utilizado.

Isso permitirá:

- comparação;
- QA;
- rollout;
- rollback;
- testes A/B internos;
- homologação gradual.

Não criar uma flag se já existir mecanismo equivalente capaz de controlar isso.

---

# 73. Não duplicar toda a aplicação

`visual_v2` não significa criar:

```text
AvatarStudioNovo.tsx
AvatarStudioNovo2.tsx
AvatarStudioFinal.tsx
```

A nova arte deverá entrar preferencialmente através das camadas de:

- assets;
- materiais;
- renderer;
- presets;
- apresentação.

Evitar fork estrutural permanente.

---

# 74. O novo visual precisa sobreviver à personalização

Um Golden Avatar não pode parecer excelente apenas porque uma combinação específica foi cuidadosamente montada.

Precisamos testar recombinação.

Exemplo:

```text
Rosto A
+
Cabelo D
+
Barba C
+
Roupa F
+
Óculos B
```

A qualidade precisa permanecer alta.

Esse é um dos maiores desafios de um Character Creator modular.

---

# 75. Criar Compatibility Matrix

Para categorias de alto risco, construir uma matriz de compatibilidade.

Principalmente:

```text
ROSTO × CABELO
ROSTO × BARBA
ROSTO × ÓCULOS
CABELO × CHAPÉU
CABELO × ORELHAS
CORPO × ROUPA
ROUPA × ACESSÓRIO
OMBROS × ASAS
COSTAS × MOCHILA
```

Não necessariamente testar manualmente todas as combinações possíveis.

Utilizar:

- regras;
- grupos;
- bounding volumes;
- amostragem;
- testes automatizados;
- QA visual direcionado.

---

# 76. Introduzir Fit Profiles

Assets que ocupam regiões corporais poderão receber informações de encaixe.

Exemplo conceitual:

```ts
fitProfile: {
  region: 'head',
  volume: 'medium',
  clearance: 'hair_standard',
  compatibleBodyFamilies: ['human_m', 'human_f']
}
```

Isso poderá ajudar futuramente a reduzir:

- clipping;
- incompatibilidades;
- posicionamento manual.

Não implementar complexidade desnecessária imediatamente; preparar o contrato se tecnicamente justificável.

---

# 77. Evitar scaling arbitrário como correção

Não corrigir incompatibilidade de asset apenas fazendo:

```text
scale = 0.87
```

até “parecer caber”.

A solução correta poderá exigir:

- pivot;
- socket;
- skinning;
- weight;
- geometria;
- versão por corpo;
- offset semanticamente definido.

Scaling arbitrário deverá ser último recurso.

---

# 78. Corpo deverá ser uma plataforma consistente

Os corpos base precisam se tornar o **contrato geométrico central**.

A auditoria mostrou que a infraestrutura UBC já trabalha com rig canônico e que os 65 bones foram verificados entre bases, cabelos e roupas compatíveis. 

Isso é valioso.

Não quebrar essa vantagem ao elevar a arte.

Se novos corpos premium forem produzidos, preservar quando possível:

- rig;
- nomenclatura;
- sockets;
- compatibilidade;
- retargeting.

---

# 79. Não criar diversidade destruindo modularidade

Queremos corpos e rostos diferentes.

Mas não queremos:

```text
cada personagem = rig completamente diferente
```

sem necessidade.

Buscar diversidade através de:

- morphs;
- variantes compatíveis;
- proporções;
- meshes padronizadas;
- famílias corporais;
- assets compatíveis.

---

# 80. Criar Body Families

Preparar conceito de famílias corporais.

Exemplo:

```text
human_m_standard
human_m_athletic
human_m_large

human_f_standard
human_f_athletic
human_f_curvy
```

Isso é conceitual neste momento.

A Parte 2 aprofundará corpo e anatomia.

O ponto desta Parte 1 é estabelecer:

> diversidade deverá ser arquitetada, não improvisada.

---

# 81. Evitar “um rosto + cores diferentes”

O mesmo vale para rosto.

Precisamos sair da lógica:

```text
FACE 01 claro
FACE 01 médio
FACE 01 escuro
```

como principal forma de variedade.

A diversidade precisa existir geometricamente.

---

# 82. Criar Face Families

Preparar famílias de rosto por estrutura.

Por exemplo:

```text
oval
round
square
long
heart
angular
soft
broad
narrow
```

Esses nomes não precisam aparecer ao usuário.

Podem funcionar como metadados internos.

---

# 83. A idade visual precisa ser controlada artisticamente

A aplicação já prevê conceitos de idade visual no briefing geral.

No novo padrão gráfico, idade não poderá ser representada apenas por:

- mudar cabelo para cinza;
- adicionar uma linha.

Considerar progressivamente:

- estrutura facial;
- volume;
- textura;
- região dos olhos;
- bochechas;
- linhas sutis;
- cabelo;
- postura.

Sempre dentro da direção estilizada.

---

# 84. Expressividade deverá fazer parte do Quality Bar

Um rosto tecnicamente bonito, mas morto, ainda prejudica a percepção.

Avaliar:

- olhar;
- pálpebras;
- sobrancelhas;
- boca;
- microexpressão;
- idle facial.

O avatar precisa parecer **presente**.

---

# 85. Idle visual mínimo

Mesmo parado, o personagem poderá possuir de forma sutil:

- respiração;
- micro movimento corporal;
- pequenos movimentos da cabeça;
- piscada;
- ajuste de olhar.

Sem transformar o personagem em algo inquieto.

A documentação atual já estabelece como objetivo que o avatar pareça vivo por respiração, piscada e olhar. 

Transformar isso em requisito perceptivo.

---

# 86. Evitar movimento robótico

Movimento procedural ou animação inadequada pode diminuir a qualidade de um ótimo modelo.

Revisar:

- easing;
- transições;
- crossfade;
- velocidade;
- peso;
- antecipação;
- retorno ao idle.

A animação deverá respeitar a personalidade/arquetipo quando possível.

---

# 87. Pose neutra não significa rígida

A pose padrão precisa possuir:

- distribuição de peso;
- ombros naturais;
- braços relaxados;
- mãos convincentes;
- cabeça levemente viva.

Evitar aparência de manequim.

---

# 88. Criar Hero Pose

O sistema deverá possuir pelo menos uma pose de apresentação altamente curada.

Essa pose será usada em:

- onboarding;
- coleções;
- Vitrine;
- screenshots;
- marketing;
- comparação visual.

Ela precisa funcionar bem com grande parte das roupas.

---

# 89. Pose de retrato

Para close-up/busto, criar uma apresentação própria.

Não simplesmente aproximar a câmera da pose de corpo inteiro.

A postura de:

- pescoço;
- cabeça;
- ombros;
- olhar;

deverá ser otimizada para retrato.

---

# 90. Câmera faz parte do produto

O catálogo já possui presets `corpo`, `busto`, `rosto` e `tresquartos`, inclusive com posições distintas por arquétipo. 

Isso deverá ser preservado e refinado.

Criar um **Camera Quality Pass**.

Avaliar:

- FOV;
- distância;
- altura;
- target;
- headroom;
- perspectiva facial;
- distorção;
- composição.

---

# 91. Evitar lente virtual inadequada no rosto

Close-up com perspectiva muito ampla pode deformar:

- nariz;
- testa;
- mandíbula.

O preset de retrato deverá buscar percepção equivalente a lente de retrato.

A documentação geral já menciona preset equivalente a 85 mm para retrato premium. 

Transformar isso em requisito de câmera real, quando compatível com o renderer.

---

# 92. O avatar deve ocupar corretamente o viewport

O personagem precisa ser protagonista.

Evitar:

- personagem pequeno;
- excesso de espaço vazio;
- pés cortados sem intenção;
- cabeça próxima demais do limite;
- câmera variando brutalmente entre assets.

Implementar/revisar enquadramento sem comprometer a liberdade de zoom.

---

# 93. Zoom facial deverá ser de alta qualidade

Como a UI já precisa permitir aproximação do rosto, esse modo deverá funcionar como teste automático da qualidade.

Ao entrar em `Face Focus`:

- cabelo deve manter qualidade;
- olhos precisam permanecer convincentes;
- pele não pode revelar artefatos graves;
- sobrancelhas precisam possuir volume/leitura;
- boca precisa permanecer consistente;
- LOD deverá reagir ao contexto.

A documentação existente já prevê justamente LOD contextual com rosto e cabelo priorizados. 

---

# 94. LOD baseado também em importância

Não utilizar apenas distância euclidiana.

Considerar:

```text
screen coverage
+
camera mode
+
asset importance
+
performance tier
```

Exemplo:

No modo `rosto`:

```text
Face = LOD0
Hair = LOD0
Eyes = LOD0
Clothing = LOD1
Shoes = LOD2
```

Isso já está alinhado com a direção prevista na documentação. 

---

# 95. Transições de LOD não podem chamar atenção

A própria especificação existente determina que a troca entre LODs não seja perceptivelmente abrupta. 

Revisar:

- hysteresis;
- thresholds;
- preload;
- troca durante câmera;
- estabilidade.

Não permitir:

> cabelo mudar de formato enquanto o usuário aproxima o rosto.

---

# 96. Revisar assets com LODs idênticos

A auditoria V2-D mostra vários casos em que `lod0`, `lod1` e `lod2` possuem exatamente o mesmo tamanho de arquivo, por exemplo alguns personagens atuais.  

Isso merece auditoria específica.

Não assumir automaticamente que está errado — tamanho igual não prova geometria igual.

Mas o agente deverá verificar:

- triângulos;
- textura;
- geometria;
- hashes;
- efetividade real do LOD.

Se os três níveis forem efetivamente equivalentes, corrigir o pipeline/publicação desses assets.

---

# 97. Cabelo é prioridade técnica e artística

A própria homologação existente registra problema de hair cards opacos e determina revisão com assets premium. 

Portanto, cabelo será tratado como frente crítica.

Não aceitar como solução final:

- blocos rígidos;
- cards grosseiros;
- silhueta serrilhada;
- transparência problemática;
- cabelo sem resposta adequada à luz.

A Parte específica de cabelo detalhará isso.

---

# 98. Thumbnails precisam vender a qualidade do asset

Alguns thumbnails encontrados na auditoria são extremamente pequenos em peso, chegando a aproximadamente 1–3 KB. 

Tamanho pequeno não significa necessariamente qualidade ruim.

Porém, precisamos verificar se o nível atual é suficiente para a nova UI visual.

Os cards deverão permitir identificar rapidamente:

- forma;
- material;
- cor;
- volume;
- categoria.

Não economizar alguns KB sacrificando percepção premium.

---

# 99. Thumbnail não deve ser screenshot aleatório

Criar padrão de render:

- câmera consistente;
- fundo consistente;
- iluminação consistente;
- framing por categoria;
- resolução suficiente;
- WebP/AVIF quando adequado;
- qualidade controlada.

---

# 100. Preview maior

Além do thumbnail pequeno, assets importantes deverão possuir preview de maior resolução.

Fluxo:

```text
THUMB
↓
CATALOG CARD

PREVIEW
↓
HOVER / INSPECT

REAL ASSET
↓
EQUIPPED
```

Isso permite manter catálogo rápido sem sacrificar avaliação visual.

---

# 101. Preview deverá representar o asset real

Não permitir divergência significativa entre:

```text
thumbnail
```

e:

```text
asset equipado
```

Isso prejudica confiança e UX.

---

# 102. Criar Asset Inspector interno

Para Dev/QA, considerar painel técnico capaz de exibir:

- asset ID;
- versão;
- visual quality;
- triângulos;
- LOD atual;
- materiais;
- texturas;
- resolução;
- draw calls;
- bones;
- rig;
- socket;
- licença;
- QA status.

A auditoria anterior já identificava ausência de inspector técnico completo como uma lacuna. 

---

# 103. Não expor complexidade técnica ao usuário comum

O usuário normal vê:

> “Cabelo




Continuação da **PARTE 1/12 — VISÃO, DIREÇÃO ARTÍSTICA, QUALITY BAR E REESTRUTURAÇÃO DO PADRÃO VISUAL**

---

# 103. Não expor complexidade técnica ao usuário comum

O usuário normal vê:

> “Cabelo Longo”

ou:

> “Jaqueta Ranger”

Ele não precisa ver:

```text
LOD1
31.482 triângulos
roughness 0.42
normal map 1024
rig ubc-v1
```

Essa informação pertence ao modo Dev/QA.

A experiência do usuário deve ser simples; a infraestrutura pode ser sofisticada por trás.

---

# 104. Modo Dev como ferramenta de qualidade visual

O projeto já possui telemetria e HUD 3D voltados para FPS, draw calls e LOD. 

Expandir esse conceito para um **Visual Dev Mode**.

Quando ativo, poderá exibir:

- wireframe;
- normals;
- bounding boxes;
- bones;
- sockets;
- LOD atual;
- material channel;
- texture resolution;
- clipping warnings;
- overdraw;
- draw calls;
- triângulos;
- light helpers;
- shadow map;
- câmera/FOV;
- qualidade selecionada.

Isso reduzirá muito o tempo de diagnóstico.

---

# 105. Criar overlays de QA

Adicionar overlays opcionais como:

```text
SILHOUETTE
NORMALS
ROUGHNESS
METALLIC
UV
DEPTH
LIGHTING ONLY
ALBEDO ONLY
```

Esses modos são extremamente úteis para distinguir:

> problema de modelo

de

> problema de material

de

> problema de iluminação.

Não precisam ser expostos na interface pública.

---

# 106. Separar “Asset ruim” de “Render ruim”

Uma regra operacional importante:

Sempre que algo parecer visualmente fraco, testar o asset em condições neutras.

Fluxo:

```text
PROBLEMA VISUAL
    ↓
Studio Lighting
    ↓
Material neutro
    ↓
Câmera neutra
    ↓
Sem VFX
    ↓
Avaliar geometria
```

Depois:

```text
Geometria aprovada
    ↓
Material
    ↓
Lighting
    ↓
Post-processing
```

Isso evita corrigir o componente errado.

---

# 107. Criar um cenário de calibração

Implementar um cenário interno específico para QA.

Exemplo:

```text
visual_calibration
```

Com:

- fundo neutro;
- chão neutro;
- key light;
- fill light;
- rim light controlada;
- exposição fixa;
- sem bloom;
- sem partículas;
- sem clima;
- sem pós agressivo.

Esse cenário funcionará como “laboratório” visual.

---

# 108. Color Checker interno

Opcionalmente, incluir no modo QA uma referência de cor/material.

Por exemplo:

- branco;
- preto;
- cinza 18%;
- metal;
- pele de referência;
- emissive.

Isso ajuda a detectar problemas de:

- exposição;
- tone mapping;
- iluminação;
- color space.

---

# 109. Controlar exposição

O renderer atual permite exposição ajustável e limita o valor dentro de uma faixa. 

O novo padrão deverá criar valores curados por look.

Evitar que o usuário consiga inadvertidamente destruir a apresentação do personagem com exposição extrema, salvo em modo avançado.

---

# 110. Iluminação por categoria

O mesmo lighting não necessariamente funciona para tudo.

Preparar presets específicos para:

```text
FULL BODY
PORTRAIT
PRODUCT/ACCESSORY
DARK MATERIAL
LIGHT MATERIAL
EMISSIVE
```

Por exemplo:

- cabelo escuro em fundo escuro precisa de rim light;
- roupa branca precisa preservar highlight;
- metal precisa de environment interessante;
- pele precisa de contraste mais controlado.

---

# 111. Light Rig sem “cara de demo Three.js”

O objetivo é que a cena deixe de parecer um exemplo técnico.

Evitar visual com:

- luz branca genérica;
- fundo vazio;
- personagem centralizado sem composição;
- shadow padrão;
- bloom indiscriminado.

A iluminação precisa comunicar direção artística.

---

# 112. Background neutro premium

O fundo padrão não deverá ser apenas:

```text
background-color: #111
```

Criar um ambiente neutro com:

- leve gradiente;
- profundidade;
- contraste controlado;
- separação de personagem;
- possível vinheta extremamente sutil.

Sem roubar atenção.

---

# 113. Chão visualmente integrado

O chão precisa cumprir três funções:

1. ancorar personagem;
2. gerar contato;
3. contribuir com a cena.

Não precisa ser literal.

Pode ser:

- studio floor;
- plataforma;
- plano abstrato;
- círculo de luz;
- grid controlado.

Evitar avatar flutuando no vazio.

---

# 114. Cenários deverão possuir níveis de complexidade

Hoje o catálogo possui cenários como:

- vazio;
- grade;
- estrelas;
- dojo. 

Estruturar futuramente:

```text
ENVIRONMENT_LEVEL_0
neutral

ENVIRONMENT_LEVEL_1
graphic

ENVIRONMENT_LEVEL_2
thematic

ENVIRONMENT_LEVEL_3
hero
```

Assim, o sistema poderá variar riqueza visual sem comprometer performance.

---

# 115. Não fazer todo cenário procedural

A geometria procedural atual foi excelente para provar funcionalidade.

Mas, para elevar a percepção visual, alguns ambientes deverão ter arte dedicada.

Usar procedural onde ele faz sentido:

- grade;
- partículas;
- estrelas;
- chuva;
- neve.

Usar assets dedicados quando precisamos:

- arquitetura;
- objetos;
- materiais complexos;
- set dressing;
- composição artística.

---

# 116. Clima precisa interagir com a cena

Se houver:

```text
chuva
```

não basta apenas gerar partículas.

Idealmente, considerar progressivamente:

- luz mais fria;
- reflexo;
- contraste;
- atmosfera;
- partículas;
- piso;
- intensidade.

Da mesma forma:

```text
neve
```

poderá alterar:

- iluminação;
- ambiente;
- partículas;
- temperatura de cor.

Não precisa implementar simulação física completa.

O objetivo é coerência visual.

---

# 117. Aura e VFX devem responder à profundidade

Auras não podem parecer apenas um PNG atrás do avatar.

No 3D:

- depth;
- occlusion;
- partículas;
- falloff;
- emissive;
- bloom seletivo;
- relação com silhouette.

No 2D:

- múltiplos planos;
- blur;
- máscaras;
- composição;
- glow controlado.

---

# 118. Auras precisam possuir famílias visuais

Em vez de apenas:

```text
Aura Azul
Aura Vermelha
Aura Verde
```

criar famílias:

```text
ENERGY
ARCANE
FIRE
ICE
ELECTRIC
VOID
SOLAR
DIGITAL
ROYAL
COSMIC
```

Cada uma com:

- linguagem;
- movimento;
- material;
- partículas;
- shape;
- timing.

Cor vira um parâmetro dentro da família.

---

# 119. Não resolver diversidade com hue shift

O mesmo princípio vale para:

- cabelo;
- roupa;
- auras;
- efeitos;
- acessórios.

Mudar `hue` é útil, mas não substitui diversidade de forma.

---

# 120. Criar Design Tokens visuais para assets

Além dos tokens de UI, criar tokens de arte.

Exemplo conceitual:

```text
AVATAR_LIGHT_SOFT
AVATAR_LIGHT_HERO
AVATAR_RIM_DEFAULT
AVATAR_SKIN_ROUGHNESS
AVATAR_HAIR_SPECULAR
AVATAR_METAL_ROUGHNESS
AVATAR_EMISSIVE_LIMIT
AVATAR_BLOOM_LIMIT
AVATAR_SHADOW_SOFTNESS
```

Isso ajuda a manter coerência.

---

# 121. Art Direction Tokens

Também considerar tokens menos técnicos:

```text
hero_contrast
portrait_softness
fantasy_saturation
tech_emissive
legacy_outline
premium_outline
```

Não precisa necessariamente ser literalmente implementado como CSS variables.

O importante é padronizar decisões repetidas.

---

# 122. Presets de materiais por coleção

Coleções podem ter linguagem visual própria.

Exemplo:

```text
CYBER
metal escuro
emissive azul
roughness média
```

```text
ROYAL
metal dourado
tecido profundo
detalhes polidos
```

```text
URBAN
algodão
denim
couro
```

Assim, a coleção deixa de parecer apenas “um conjunto de itens com o mesmo nome”.

---

# 123. Coleções precisam de coerência de direção artística

Uma coleção deve compartilhar:

- paleta;
- materiais;
- shapes;
- tema;
- nível de detalhe;
- lore;
- apresentação.

Não apenas possuir:

```text
5 assets etiquetados como coleção X
```

---

# 124. Presets precisam virar composições curadas

Um preset deve ser mais do que:

```text
rosto A
cabelo B
roupa C
```

Ele deverá poder incluir:

- iluminação;
- câmera;
- fundo;
- material;
- pose;
- aura;
- expressão.

Isso cria resultados “prontos para impressionar”.

---

# 125. Preset não pode esconder assets ruins

Apesar disso, o preset não poderá ser usado para maquiar conteúdo abaixo do quality bar.

O asset individual precisa continuar aprovado.

---

# 126. Criar conceito de Visual DNA

Cada personagem/preset poderá ter um conjunto de características dominantes.

Exemplo:

```text
Shape: angular
Material: technical
Contrast: high
Accent: cyan
Motion: controlled
Mood: confident
```

Esse “Visual DNA” pode orientar:

- recomendações;
- presets;
- coleções;
- IA futura;
- consistência.

Não precisa ser implementado imediatamente como feature pública.

---

# 127. Uso futuro da IA

A IA poderá futuramente ajudar em:

- recomendar combinações;
- sugerir look;
- harmonizar cores;
- sugerir preset;
- identificar clipping;
- classificar asset;
- gerar metadados.

Mas:

> IA não poderá decidir sozinha o quality bar artístico.

Os Golden Avatars e a direção visual continuam humanos/curados.

---

# 128. IA não deve gerar assets finais sem pipeline

Se futuramente houver geração assistida:

```text
AI OUTPUT
    ↓
CURATION
    ↓
RETROPOLOGY / CLEANUP
    ↓
RIG
    ↓
MATERIAL
    ↓
LOD
    ↓
TECHNICAL QA
    ↓
VISUAL QA
```

Nunca:

```text
AI OUTPUT
    ↓
PRODUCTION
```

---

# 129. Criação de um “Art Bible”

O agente deverá criar ou estruturar um documento:

```text
docs/AVATAR-STUDIO/ART-BIBLE.md
```

ou local equivalente coerente com o projeto.

Essa Art Bible deverá documentar:

- estilo;
- proporções;
- materiais;
- cabelo;
- pele;
- roupas;
- iluminação;
- câmera;
- VFX;
- raridades;
- collections;
- quality bar;
- examples;
- anti-patterns.

---

# 130. Anti-patterns explícitos

Documentar exemplos do que NÃO deve acontecer.

Exemplos:

```text
❌ forma primitiva sem acabamento como asset final
❌ roupa parecendo pintada no corpo
❌ cabelo parecendo capacete
❌ pele com material plástico
❌ glow em todos os objetos
❌ raridade lendária = excesso de partículas
❌ olhos sem profundidade
❌ acessórios flutuando
❌ mesma geometria apenas recolorida como falsa diversidade
❌ cenário mais chamativo que o avatar
❌ thumbnail que não representa o asset
```

---

# 131. Asset Review Board

Criar processo de revisão.

Para cada leva importante:

```text
DESIGN
↓
IMPLEMENTAÇÃO
↓
TECH QA
↓
VISUAL QA
↓
REVIEW
↓
APPROVED
```

O agente não deverá assumir que “build passou” significa “arte aprovada”.

---

# 132. Entregas pequenas, qualidade alta

Evitar:

> produzir 100 assets rapidamente.

Preferir:

> produzir 10 excelentes, validar linguagem, depois escalar.

Principalmente nesta fase inicial.

---

# 133. Primeira leva experimental

A primeira leva da nova geração deverá ser pequena.

Sugestão:

```text
4 rostos
4 cabelos
2 barbas
2 tops
2 calças
2 calçados
4 acessórios
2 auras
```

Não porque o produto terá poucos assets.

Mas porque queremos calibrar o pipeline.

---

# 134. Cobrir masculino e feminino logo na PoC artística

Não criar toda a nova linguagem primeiro para um único corpo e depois tentar adaptar.

Os Golden Avatars precisam validar cedo:

- masculino;
- feminino;
- diferentes tons de pele;
- diferentes cabelos;
- diferentes roupas.

---

# 135. Pelo menos um personagem com pele escura no Golden Set

Isso é importante tecnicamente e artisticamente.

Iluminação calibrada apenas em pele clara costuma falhar em tons mais escuros.

O Golden Set deve testar:

- pele clara;
- média;
- escura.

---

# 136. Pelo menos um cabelo escuro e um claro

Para testar:

- rim light;
- specular;
- separação de fundo;
- highlights.

---

# 137. Testar materiais claros e escuros

Exemplo:

- roupa preta;
- roupa branca;
- metal;
- tecido.

Assim evitamos calibrar o renderer para uma situação única.

---

# 138. Testar emissive

Pelo menos um Golden Avatar deverá possuir asset emissivo moderado.

Isso testa:

- bloom;
- tone mapping;
- exposição;
- contraste.

---

# 139. Testar transparência

Pelo menos um asset poderá testar:

- vidro;
- visor;
- transparência controlada.

Sem depender de transparência para cabelo até termos pipeline confiável.

---

# 140. Hair cards como caso especial

A auditoria já registra que os hair cards opacos atuais merecem revisão premium. 

Portanto, não considerar o cabelo atual como benchmark.

O novo Golden Set deverá possuir pelo menos um cabelo que represente a solução futura.

---

# 141. Critério: silhouette test

Todo asset de:

- cabelo;
- roupa;
- chapéu;
- ombreira;
- asas;

deve passar no teste de silhueta.

Renderizar totalmente preto sobre fundo branco.

Se o item só funciona por textura e não possui forma clara, revisar.

---

# 142. Grayscale test

Também testar personagem em escala de cinza.

Objetivo:

- verificar hierarquia;
- contraste;
- legibilidade;
- separação de volumes.

Se o design só funciona por cor saturada, pode estar estruturalmente fraco.

---

# 143. Material-only test

Renderizar:

```text
clay material
```

para verificar:

- geometria;
- silhouette;
- volume.

Se o asset parecer ruim em clay, textura não deverá ser usada para esconder isso.

---

# 144. Lighting-only test

Renderizar sem albedo complexo.

Objetivo:

- avaliar normals;
- volume;
- sombras;
- face shading.

---

# 145. Extreme light test

Testar ocasionalmente iluminação lateral forte.

Isso revela:

- normals quebradas;
- superfícies irregulares;
- problemas de modelagem;
- artefatos de shading.

---

# 146. Backlight test

Testar contraluz.

Especialmente importante para:

- cabelo;
- asas;
- acessórios transparentes;
- silhouette.

---

# 147. Performance test

O Golden Avatar também precisa passar por:

- máquina forte;
- máquina intermediária;
- tier econômico.

A qualidade deve degradar de forma inteligente.

---

# 148. Quality Tier precisa ser previsível

A documentação atual trabalha com tiers e LODs. 

Definir expectativa perceptiva:

```text
ECONÔMICO
mesmo design
menos detalhe

PADRÃO
qualidade plena para uso comum

PREMIUM/ULTRA
melhor LOD
melhores sombras
maior DPR
pós-processamento
```

A identidade visual não pode mudar.

---

# 149. Tier econômico não poderá parecer outro asset

Ao reduzir qualidade:

- preservar rosto;
- preservar cabelo;
- preservar silhouette;
- preservar cores;
- preservar acessórios essenciais.

Reduzir:

- microdetalhe;
- textura;
- partículas;
- shadow quality;
- post-processing;
- cenário.

---

# 150. Degradação deve priorizar o que menos importa

Ordem sugerida:

```text
1. partículas secundárias
2. cenário distante
3. pós-processamento
4. shadow resolution
5. reflection detail
6. texture resolution secundária
7. LOD de roupa/cenário
8. LOD de cabelo/rosto por último
```

---

# 151. Não usar auto-quality de forma instável

O sistema não pode ficar alternando visualmente de qualidade durante uso normal.

A própria documentação reconhece a necessidade de histerese e transições melhores. 

Implementar estabilização.

---

# 152. Captura/foto deve usar quality boost temporário

O Photo Studio e captura podem utilizar temporariamente:

- LOD alto;
- maior DPR;
- melhores sombras;
- melhor AA;
- pós-processamento apropriado.

O projeto já prevê captura em LOD alto + supersampling. 

Preservar e expandir essa lógica.

---

# 153. Preview em tempo real e captura podem ter budgets diferentes

Não sacrificar fluidez do editor para manter qualidade de exportação.

Separar:

```text
REALTIME QUALITY
```

de:

```text
CAPTURE QUALITY
```

---

# 154. Photo Studio como showcase

A seção Foto deverá ser uma das vitrines da nova direção gráfica.

Ela deverá demonstrar:

- melhor câmera;
- melhor iluminação;
- poses;
- fundos;
- composição;
- captura superior.

O avatar deve parecer mais impressionante ali do que no editor básico.

---

# 155. Mas o editor principal ainda precisa parecer premium

Não aceitar:

> editor feio, foto bonita.

O viewport principal continua sendo o primeiro contato do usuário.

---

# 156. Vitrine também deve usar representação premium

A Vitrine deverá priorizar:

- Hero Assets;
- Golden Presets;
- boas thumbnails;
- bom enquadramento;
- consistência.

Não utilizar placeholders procedurais como destaque.

---

# 157. “Quantidade” deixa de ser KPI principal

Não avaliar sucesso desta frente com:

```text
+300 assets
```

Os principais KPIs devem passar a incluir:

```text
% assets production-ready
% premium
% QA aprovado
clipping rate
visual regression rate
tempo médio de aprovação
performance
qualidade percebida
```

---

# 158. Definir Visual Debt

Criar conceito de dívida visual.

Exemplo:

```text
visualDebt:
  hair: high
  face: high
  accessories: medium
  environment: medium
```

Isso ajuda a priorizar o que mais prejudica a percepção.

---

# 159. Inventário do legado

Antes de substituir conteúdo, classificar assets atuais em:

```text
KEEP
UPGRADE
REPLACE
DEV_ONLY
DEPRECATE
```

Sem fazer isso manualmente item por item se o catálogo for gigantesco.

Pode ser por famílias.

---

# 160. Famílias antes de itens individuais

Exemplo:

```text
Família: cabelos SVG básicos
→ UPGRADE

Família: sockets procedurais 3D
→ DEV_ONLY + REPLACE GRADUALLY

Família: UBC base
→ KEEP FOUNDATION + ART UPGRADE
```

Isso escala melhor.

---

# 161. Não apagar legado imediatamente

Conteúdo legado poderá continuar acessível durante a transição.

Mas pode receber:

```text
legacyVisual = true
```

e deixar de aparecer em:

- Hero sections;
- onboarding;
- marketing;
- presets premium.

---

# 162. Migração progressiva

Fluxo recomendado:

```text
LEGACY CATALOG
       +
NEW PREMIUM CATALOG
       ↓
COEXIST
       ↓
MIGRATE BEST CATEGORIES
       ↓
DEPRECATE WEAK LEGACY
```

---

# 163. Compatibilidade de saves

Se um usuário tiver equipado um asset legado, não quebrar o personagem.

Opções:

- manter legacy;
- mapear para sucessor;
- oferecer upgrade visual.

---

# 164. Successor mapping

Preparar conceito:

```text
legacyAssetId
→ successorAssetId
```

Quando apropriado.

Mas não substituir silenciosamente quando o design mudar radicalmente.

---

# 165. Visual Upgrade automático apenas quando seguro

Se `cab_longo` V2 é claramente a mesma peça apenas melhor modelada, pode manter identidade.

Se é outro cabelo, criar asset novo.

---

# 166. Nunca falsificar a escolha do usuário

O sistema não pode converter automaticamente:

> “Cabelo Punk”

em:

> “Cabelo Clássico Premium”

apenas porque é mais bonito.

Preservar intenção.

---

# 167. Critério de identidade

Para decidir se algo é upgrade ou novo asset, avaliar:

- silhouette;
- tema;
- função;
- comprimento;
- estilo;
- significado.

Se mudou substancialmente, é outro asset.

---

# 168. Documentar decisões artísticas

Cada grande mudança deverá registrar:

```text
WHY
WHAT
IMPACT
COMPATIBILITY
PERFORMANCE
```

Evitar decisões visuais difíceis de rastrear meses depois.

---

# 169. Versionar Art Bible

A direção artística pode evoluir.

Portanto:

```text
Art Bible v1
Art Bible v2
```

Mas não criar caos de estilos convivendo sem controle.

---

# 170. Visual Language ID

Cada asset poderá futuramente informar:

```text
visualLanguage: 'dshow_v2'
```

Isso permitirá identificar famílias antigas e futuras.

---

# 171. Uma coleção não pode misturar linguagens incompatíveis

Não misturar sem intenção:

- low-poly;
- semi-realista;
- flat;
- anime;
- realistic;

no mesmo personagem.

Se existirem estilos diferentes no futuro, eles deverão ser **modos artísticos conscientemente separados**.

---

# 172. Primeiro objetivo: uma única linguagem excelente

Não tentar oferecer 10 estilos agora.

Primeiro consolidar:

> **Dshow Premium Stylized**

Depois expandir.

---

# 173. Critério de coerência entre masculino e feminino

Não criar masculino semi-realista e feminino super-cartoon.

Ambos precisam pertencer ao mesmo universo visual.

---

# 174. Coerência entre humano e outros arquétipos

O catálogo já possui humano, androide e animal. 

Eles podem ter naturezas diferentes, mas devem compartilhar:

- iluminação;
- proporção estilística geral;
- material sophistication;
- nível de acabamento;
- apresentação.

---

# 175. Androide não deve ser benchmark do humano

O androide possui morphs faciais e materiais diferentes. 

Não usar sucesso visual do androide como prova de que a pele humana está boa.

São desafios diferentes.

---

# 176. Animal deverá ser tratado como família própria

Não forçar pipeline de humano onde não fizer sentido.

Mas reutilizar:

- câmera;
- iluminação;
- material;
- LOD;
- QA;
- apresentação.

---

# 177. Cada arquétipo precisa de Golden Asset

Depois dos Golden humanos, criar:

- Golden Android;
- Golden Animal.

Não necessariamente na primeira entrega.

---

# 178. Prioridade de implementação desta fase

A ordem recomendada é:

```text
1. Quality Bar
2. Art Bible
3. Golden Humans
4. Lighting calibration
5. Materials
6. Face/Hair
7. Clothing
8. Accessory Hero Set
9. VFX
10. Scale production
```

---

# 179. O que NÃO fazer primeiro

Não começar por:

- mais 500 acessórios;
- mais 100 backgrounds;
- dezenas de auras;
- marketplace;
- IA generativa;
- novas raridades;
- novos eventos.

Primeiro corrigir a qualidade nuclear do avatar.

---

# 180. Definition of Done desta Parte 1

Esta etapa só poderá ser considerada concluída quando o agente entregar:

1. diagnóstico visual consolidado;
2. inventário de `KEEP / UPGRADE / REPLACE / DEV_ONLY`;
3. Art Bible inicial;
4. definição formal do Quality Bar;
5. classificação `Prototype / Legacy / Production / Premium / Hero`;
6. estratégia de Golden Avatars;
7. cenário de calibração;
8. presets de avaliação;
9. critérios de Hard Fail/Soft Fail;
10. estratégia de Visual QA;
11. estratégia de visual regression;
12. baseline Before;
13. arquitetura de compatibilidade;
14. plano de rollout;
15. critérios claros para liberar produção em escala.

---

# 181. Restrições obrigatórias

Durante esta etapa:

**NÃO:**

- apagar saves;
- quebrar presets;
- quebrar histórico;
- quebrar IDs;
- substituir banco sem necessidade;
- duplicar arquitetura;
- remover o modo clássico;
- remover fallback;
- produzir centenas de assets antes do Golden Set;
- considerar asset procedural simples como arte final;
- confundir raridade com qualidade;
- mascarar arte ruim com bloom;
- sacrificar performance indiscriminadamente.

---

# 182. Resultado esperado

Ao final desta frente, o Avatar Studio deverá deixar de seguir a lógica:

> “Temos muitas opções.”

e passar a comunicar:

> **“Temos personagens visualmente desejáveis.”**

A percepção deve mudar de:

> protótipo funcional de avatar

para:

> **produto de criação de identidade digital premium.**

A arquitetura existente já demonstra que existe base técnica para isso: há assets UBC, LODs, rig padronizado, pipeline GLB, materiais, environment, tone mapping, pós-processamento, câmera, animação e validação.  

Portanto, a prioridade agora deve ser transformar essa engenharia em **qualidade artística perceptível**.

---

# 183. GATE FINAL DA PARTE 1

**PROIBIR PRODUÇÃO ARTÍSTICA EM MASSA enquanto estas três condições não forem satisfeitas:**

```text
GOLDEN AVATAR M aprovado
+
GOLDEN AVATAR F aprovado
+
QUALITY BAR documentado
```

Depois:

```text
APROVAÇÃO
      ↓
PIPELINE ARTÍSTICO CONGELADO V1
      ↓
PRODUÇÃO EM ESCALA
```

Esse gate é importante porque a infraestrutura atual já possui catálogo e pipeline capazes de crescer muito. O maior risco agora seria justamente utilizar essa capacidade para multiplicar rapidamente um padrão visual ainda insuficiente.

---

## FIM DA PARTE 1/12

**Próxima: PARTE 2/12 — CORPO, ANATOMIA, PROPORÇÕES, SILHUETA, DIVERSIDADE CORPORAL, BASE MASCULINA/FEMININA E MORPHS.**






# MEGA BRIEFING — ELEVAÇÃO GRÁFICA AAA DO AVATAR STUDIO DSHOW
## PARTE 2/12 — CORPO, ANATOMIA, PROPORÇÕES, SILHUETA, DIVERSIDADE CORPORAL, BASES MASCULINA/FEMININA E SISTEMA DE MORPHS

---

# 184. Objetivo da Parte 2

Esta parte deverá atacar uma das causas mais importantes da percepção atual de baixa qualidade gráfica:

> **o corpo precisa deixar de funcionar apenas como suporte para roupas e acessórios e passar a ser uma base visual premium por si só.**

A melhoria não deverá se limitar a adicionar polígonos.

Precisamos elevar simultaneamente:

- anatomia;
- proporção;
- silhueta;
- postura;
- deformação;
- mãos;
- pescoço;
- ombros;
- braços;
- pernas;
- integração cabeça/corpo;
- diversidade corporal;
- morphs;
- rig;
- skinning;
- compatibilidade com roupas;
- compatibilidade com animações;
- LOD;
- materiais;
- leitura em diferentes câmeras.

A arquitetura existente já oferece uma vantagem importante: o pipeline UBC trabalha com um rig canônico compartilhado, e a auditoria registra **65 bones verificados entre bases, cabelos e roupas compatíveis**. 

Essa compatibilidade deverá ser preservada sempre que possível.

---

# 185. Princípio central: não confundir “estilizado” com “anatomicamente pobre”

O novo personagem não precisa ser anatomicamente realista.

Entretanto, precisa possuir **anatomia estilizada convincente**.

Isso significa que podemos deliberadamente alterar:

- tamanho da cabeça;
- largura dos ombros;
- comprimento das pernas;
- tamanho das mãos;
- proporção do torso;
- formato corporal.

Mas essas decisões precisam parecer:

> intencionais.

E não:

> limitações do modelo.

---

# 186. Definir uma linguagem corporal Dshow

Antes de produzir novas bases em escala, estabelecer uma régua visual.

A recomendação é buscar:

### Premium Stylized Human

Com:

- cabeça ligeiramente estilizada;
- mãos suficientemente detalhadas;
- pés proporcionais;
- torso legível;
- ombros bem definidos;
- braços com volume;
- pernas com boa silhueta;
- anatomia suavizada;
- músculos sem exagero por padrão;
- boa leitura com roupas;
- boa leitura em close-up.

Não seguir extremos:

```text
❌ chibi
❌ hiper-realista
❌ manequim genérico
❌ low-poly evidente
❌ anatomia de super-herói para todos
```

---

# 187. As bases UBC atuais deverão ser tratadas como fundação, não como limite

A auditoria encontrou explicitamente:

- `base_superhero_m`;
- `base_superhero_f`;
- humanos casual/terno/punk/aventureiro;
- cabelos;
- roupas modulares;
- LODs. 

Isso é excelente para a arquitetura.

Porém, não significa que:

> “Superhero Male/Female” deva se tornar a anatomia definitiva de todos os usuários.

O agente deverá separar:

```text
RIG / COMPATIBILIDADE
```

de:

```text
FORMA CORPORAL FINAL
```

Idealmente, preservar a infraestrutura do primeiro enquanto elevamos o segundo.

---

# 188. Auditar as bases masculinas e femininas visualmente

Antes de alterar geometria, produzir uma auditoria específica das bases atuais.

Renderizar sem roupas complexas:

### Masculino

- frente;
- perfil;
- costas;
- ¾;
- busto;
- pose neutra;
- pose com braços;
- movimento.

### Feminino

Mesma sequência.

Avaliar:

- cabeça/corpo;
- pescoço;
- ombros;
- caixa torácica;
- cintura;
- quadril;
- braços;
- cotovelos;
- mãos;
- joelhos;
- pernas;
- tornozelos;
- pés.

---

# 189. Clay Pass obrigatório

Essa auditoria deverá utilizar material neutro.

Sem:

- textura;
- roupa chamativa;
- aura;
- cenário;
- bloom.

Objetivo:

> enxergar a geometria real.

Se o corpo só parece convincente vestido e iluminado dramaticamente, a base ainda precisa de trabalho.

---

# 190. Silhouette Pass

Renderizar também o corpo como silhueta.

Frente:

```text
████ PERSONAGEM ████
```

Perfil e ¾.

Perguntas:

- o corpo é reconhecível?
- existe equilíbrio?
- os membros possuem espessura adequada?
- os ombros funcionam?
- cabeça e pescoço se conectam naturalmente?
- pernas possuem boa leitura?
- mãos parecem adequadas?
- postura possui personalidade?

---

# 191. Proporção-base masculina

A nova base masculina padrão não deverá obrigatoriamente ser “musculosa”.

Criar uma base neutra suficientemente versátil para evoluir em múltiplas direções.

Ela deverá aceitar morphs para:

- magro;
- atlético;
- robusto;
- largo;
- musculoso;
- outras variações futuras.

A base neutra deve evitar características extremas que dificultem morphing.

---

# 192. Proporção-base feminina

Aplicar a mesma filosofia.

Evitar:

- proporções caricaturais involuntárias;
- cintura exageradamente estreita como padrão;
- pernas artificialmente longas sem intenção;
- anatomia excessivamente sexualizada;
- corpo único sendo tratado como representação de todas as personagens.

A base deverá ser versátil.

---

# 193. Não criar masculino e feminino como simples scaling

A base feminina não poderá ser:

> base masculina × escala menor.

Nem o inverso.

Precisamos de diferenças coerentes em:

- estrutura;
- torso;
- ombros;
- quadril;
- membros;
- pescoço;
- silhueta.

Mas ambos deverão compartilhar a mesma linguagem artística.

---

# 194. Body Families

Preparar a arquitetura para famílias corporais.

Primeira estrutura conceitual:

```text
HUMAN_M
├── standard
├── slim
├── athletic
├── broad
└── large

HUMAN_F
├── standard
├── slim
├── athletic
├── curvy
└── large
```

Não é obrigatório produzir todas imediatamente.

A arquitetura, porém, não poderá presumir:

```text
sexo → exatamente uma malha corporal
```

---

# 195. Preferir morphs quando tecnicamente apropriado

Quando as variações puderem compartilhar:

- topologia;
- rig;
- UV;
- roupas;
- skeleton;

preferir morph targets ou solução equivalente.

Isso permitirá combinações contínuas.

Exemplo conceitual:

```text
bodyWeight
bodyMuscle
shoulderWidth
torsoLength
legLength
hipWidth
waistWidth
```

---

# 196. Não transformar o editor em simulador anatômico

Embora internamente possamos possuir muitos parâmetros, a UX deverá permanecer simples.

Não expor necessariamente:

```text
clavicleScale
femurRatio
thoraxDepth
```

O usuário poderá receber controles como:

```text
Corpo
Magro ←────────→ Largo

Definição
Suave ←────────→ Atlético

Ombros
Estreitos ←────→ Largos
```

ou presets corporais.

---

# 197. Morphs internos podem ser mais ricos que a UI

A UI poderá movimentar vários morphs simultaneamente.

Exemplo:

```text
Preset: ATLÉTICO
```

poderá aplicar:

```text
muscle = .65
shoulderWidth = .55
waist = -.12
legVolume = .22
armVolume = .35
```

O usuário não precisa conhecer esses números.

---

# 198. Separar Shape Morph de Pose

Não utilizar deformação corporal para simular postura.

Separar:

```text
BODY SHAPE
```

de:

```text
SKELETAL POSE
```

Shape define corpo.

Pose define posição.

---

# 199. Separar Body Shape de Clothing Fit

Da mesma forma:

```text
bodyWeight = 0.8
```

não deverá simplesmente escalar a roupa.

A roupa precisa deformar corretamente com o corpo.

---

# 200. Morph Compatibility Contract

Para cada morph corporal suportado, validar:

- corpo;
- roupa;
- cabelo longo quando toca corpo;
- acessórios;
- animação;
- LOD.

Criar limites seguros.

Por exemplo:

```text
bodyWeight: -1.0 → +1.0
```

pode ser tecnicamente possível, mas apenas:

```text
-0.65 → +0.70
```

pode estar artisticamente homologado.

A UI deve respeitar o intervalo aprovado.

---

# 201. Evitar extremos quebrados

Não oferecer slider até valores que produzam:

- roupa atravessando corpo;
- braços deformados;
- ombros quebrados;
- rig estranho;
- clipping.

É melhor oferecer menos amplitude com alta qualidade.

---

# 202. Morph Presets

Criar presets curados.

Exemplo:

```text
NEUTRO
SLIM
ATHLETIC
BROAD
SOFT
```

Depois permitir ajuste fino quando apropriado.

---

# 203. Sistema deverá suportar presets + customização

Fluxo recomendado:

```text
ESCOLHER BASE
    ↓
ESCOLHER PRESET
    ↓
AJUSTAR
```

Isso é mais amigável que começar com 20 sliders.

---

# 204. Altura visual

Preparar controle de altura com cautela.

Não basta:

```text
scaleY
```

Isso produz deformação artificial.

Se altura for implementada, considerar distribuição proporcional entre:

- pernas;
- torso;
- pescoço;
- cabeça.

---

# 205. Altura física vs enquadramento

O catálogo atual normaliza personagens para uma `alturaAlvo`, por exemplo 1,8 m para humanos. 

Essa normalização técnica é útil.

Mas diferenciar:

```text
ALTURA DE NORMALIZAÇÃO DO ASSET
```

de:

```text
ALTURA VISUAL ESCOLHIDA PELO USUÁRIO
```

Não misturar os dois conceitos.

---

# 206. Cabeça/corpo

A relação entre cabeça e corpo será um dos principais elementos do estilo.

Criar um intervalo aprovado.

Evitar:

- cabeça grande demais sem intenção;
- cabeça pequena demais;
- pescoço desconectado;
- rosto visualmente pertencendo a outro estilo.

---

# 207. Head Scale controlado

Se existir customização de tamanho da cabeça:

- estabelecer mínimo/máximo;
- testar cabelo;
- chapéus;
- óculos;
- pescoço;
- câmera de rosto.

Não usar scaling ilimitado.

---

# 208. Pescoço merece atenção especial

A conexão cabeça/corpo frequentemente denuncia assets modulares.

Revisar:

- largura;
- comprimento;
- transição;
- skinning;
- sombra;
- roupa;
- colares;
- cabelo.

O usuário não deve perceber uma “linha de montagem” entre cabeça e torso.

---

# 209. Ombros

Ombros são fundamentais para:

- silhueta;
- roupa;
- pose;
- percepção masculina/feminina;
- animação.

Revisar cuidadosamente deformação em:

- braços baixos;
- braços abertos;
- braços elevados;
- mãos na cintura;
- aceno.

---

# 210. Clavícula e região superior do torso

Mesmo em estilo simplificado, a iluminação precisa produzir volume convincente.

Evitar torso que pareça:

- cilindro;
- caixa;
- superfície plana.

---

# 211. Cotovelos

Testar flexão.

Problemas típicos:

- esmagamento;
- volume desaparecendo;
- geometria pontuda;
- textura esticada;
- manga quebrando.

O skinning deverá preservar volume.

---

# 212. Joelhos

Aplicar a mesma validação.

Especialmente em:

- caminhada;
- pose;
- agachamento leve;
- Hero Pose.

---

# 213. Mãos passam a ser componente de qualidade

Mãos ruins derrubam imediatamente a percepção de um personagem premium.

Revisar:

- tamanho;
- dedos;
- polegar;
- silhueta;
- rig;
- pose neutra;
- contato com objetos.

---

# 214. Não aceitar “luvas geométricas” como mão final

Mesmo estilizada, a mão precisa parecer mão.

Não necessariamente mostrar:

- unhas hiper-realistas;
- rugas;
- veias.

Mas deve possuir:

- dedos legíveis;
- polegar convincente;
- volume;
- deformação adequada.

---

# 215. Hand LOD

Mãos podem receber prioridade maior quando:

- câmera estiver próxima;
- personagem segurar objeto;
- Photo Studio usar pose de mãos.

Em corpo inteiro distante, podem simplificar.

---

# 216. Rig de dedos

Auditar se o rig atual possui articulação suficiente para:

- mãos relaxadas;
- segurar cetro;
- apontar;
- acenar;
- poses fotográficas.

Se os 65 bones atuais não oferecerem o nível desejado para dedos, documentar a limitação antes de alterar o rig.

Não quebrar o rig canônico impulsivamente.

---

# 217. Objetos na mão

O sistema já prevê sockets `hand_l` e `hand_r`. 

A nova anatomia deverá ser homologada com objetos.

Testar:

- cetro;
- smartphone futuramente;
- copo;
- ferramenta;
- outros props.

---

# 218. Grip Profiles

Preparar conceito de perfil de pegada.

Exemplo:

```text
grip:
  none
  cylindrical
  pinch
  flat
  custom
```

Quando um prop for equipado, a mão poderá assumir pose apropriada.

Não precisa resolver todos os objetos agora.

Mas a arquitetura deve evitar mão aberta atravessando um cetro.

---

# 219. Pés

Mesmo com calçados, pés influenciam:

- postura;
- chão;
- animação;
- encaixe do sapato.

Revisar:

- comprimento;
- largura;
- ankle;
- orientação.

---

# 220. Foot Grounding

Implementar/revisar grounding.

Os pés precisam:

- tocar o chão;
- não afundar;
- não flutuar;
- respeitar calçados.

Quando tecnicamente justificável, avaliar IK.

---

# 221. IK como evolução, não bloqueio inicial

Inverse Kinematics pode melhorar:

- pés;
- mãos;
- props;
- poses.

Mas não deverá bloquear o primeiro Golden Avatar se a animação existente já for suficiente.

Preparar arquitetura para evolução.

---

# 222. Centro de gravidade

Pose neutra precisa comunicar peso.

O personagem não deve parecer:

- inclinado sem razão;
- flutuando;
- rigidamente simétrico.

Criar pequena assimetria natural.

---

# 223. Contrapposto estilizado

Considerar postura padrão levemente assimétrica:

- peso maior em uma perna;
- quadril discreto;
- ombros compensando;
- braços naturais.

Sem exagero.

Isso aumenta muito a percepção de “vida”.

---

# 224. Respiração

A respiração deverá ser extremamente sutil.

Pode envolver:

- torso;
- ombros;
- pequena variação corporal.

Evitar expansão caricatural.

---

# 225. Micro-movimento corporal

Idle poderá incluir:

- mudança mínima de peso;
- micro rotação;
- cabeça;
- mãos.

O objetivo é:

> vivo.

Não:

> inquieto.

---

# 226. Posture Profiles

Preparar perfis:

```text
neutral
confident
relaxed
heroic
elegant
energetic
```

Isso poderá futuramente se conectar à categoria Personalidade/Arquétipo.

---

# 227. Personalidade não deve trocar anatomia necessariamente

Um personagem “confiante” pode usar:

- postura;
- olhar;
- pose;
- expressão.

Não precisa ganhar ombros maiores automaticamente.

Separar:

```text
WHO THE BODY IS
```

de:

```text
HOW THE BODY BEHAVES
```

---

# 228. Corpo atlético ≠ personagem agressivo

Evitar associações automáticas de design.

A modularidade deve permitir:

- atlético elegante;
- robusto casual;
- slim heroico;
- etc.

---

# 229. Diversidade corporal deve ser combinável com roupas

Este é um requisito crítico.

Não lançar uma nova família corporal se:

- 80% das roupas deixam de funcionar.

A estratégia corporal e a estratégia de roupa precisam ser desenhadas juntas.

---

# 230. Clothing Compatibility Tier

Cada roupa poderá informar:

```text
bodyCompatibility:
  universal
  family_specific
  body_specific
```

### Universal

Funciona em todas as bases homologadas.

### Family Specific

Ex.:

```text
human_m
```

### Body Specific

Criada para uma morfologia particular.

Priorizar `universal` quando possível.

---

# 231. Não resolver roupa com scaling independente

Se corpo fica maior, não simplesmente:

```text
shirt.scale *= 1.2
```

Isso destrói:

- espessura;
- proporção;
- mangas;
- costura;
- caimento.

Preferir:

- shared skeleton;
- skinning;
- morph correspondence;
- garment variants quando necessário.

---

# 232. Body Masking

Considerar sistema de ocultação de regiões do corpo sob roupas fechadas.

Exemplo:

Uma jaqueta completa pode ocultar partes do torso abaixo dela.

Isso reduz:

- clipping;
- overdraw;
- interpenetração.

O projeto já possui lógica de regiões no assembler, portanto o agente deverá avaliar se essa infraestrutura pode ser estendida em vez de criar sistema paralelo. 

---

# 233. Region Masks

Possíveis regiões:

```text
torso_upper
torso_lower
arm_upper_l
arm_upper_r
arm_lower_l
arm_lower_r
leg_upper_l
leg_upper_r
leg_lower_l
leg_lower_r
foot_l
foot_r
```

Não criar granularidade exagerada sem necessidade.

---

# 234. Roupa não pode apagar anatomia de forma absurda

Body masking é técnico.

Visualmente, roupa ainda precisa respeitar volume corporal.

Uma camiseta não deve fazer:

> torso desaparecer e




Continuação da **PARTE 2/12 — CORPO, ANATOMIA, PROPORÇÕES, SILHUETA, DIVERSIDADE CORPORAL, BASES MASCULINA/FEMININA E SISTEMA DE MORPHS**

---

# 234. Roupa não pode apagar anatomia de forma absurda

Body masking é técnico.

Visualmente, roupa ainda precisa respeitar volume corporal.

Uma camiseta não deve fazer:

> torso desaparecer e virar um bloco.

Uma jaqueta não deve fazer:

> ombros, braços e cintura perderem totalmente a estrutura.

Mesmo quando partes da malha corporal estiverem ocultas internamente, o volume visual externo precisa continuar coerente.

---

# 235. Espessura de roupa

Uma das principais diferenças entre avatar simples e avatar premium é a espessura percebida.

Roupas não devem parecer:

- textura pintada no corpo;
- shell perfeitamente colado;
- segunda pele involuntária.

Cada categoria deve possuir espessura coerente:

```text
T-shirt
→ fina

Moletom
→ média

Jaqueta
→ alta

Casaco
→ alta + estrutura

Armadura
→ rígida / volumétrica
```

---

# 236. Offset corporal controlado

Para peças próximas ao corpo, utilizar offset controlado.

Evitar simplesmente afastar toda a roupa alguns centímetros, porque isso gera:

- silhueta inflada;
- gola flutuando;
- punhos desconectados;
- volume artificial.

---

# 237. Caimento

Roupas premium precisam comunicar gravidade e construção.

Mesmo sem simulação física completa, considerar:

- queda do tecido;
- compressão;
- volume;
- dobra principal;
- tensão;
- costura;
- borda.

Não é necessário cloth simulation em runtime para todas as peças.

Boa modelagem já resolve grande parte do problema.

---

# 238. Deformation Test Suite corporal

Criar uma pequena suíte de poses técnicas para homologar corpo e roupa.

Sugestão:

```text
POSE A — Neutral
POSE B — Arms 45°
POSE C — Arms 90°
POSE D — Elbow bend
POSE E — Knee bend
POSE F — Wave
POSE G — Hero
POSE H — Walk frame
```

Cada base corporal deve ser testada nessas poses.

---

# 239. Stress Poses

Além das poses bonitas, criar poses propositalmente difíceis.

Objetivo:

- revelar skinning ruim;
- revelar clipping;
- revelar weights incorretos;
- testar roupa.

Exemplos:

- braço elevado;
- braço cruzando o torso;
- joelho bastante flexionado;
- cabeça inclinada;
- mão próxima ao rosto.

---

# 240. Não aprovar skinning olhando apenas Idle

Esse é um erro comum.

Um modelo pode parecer perfeito parado e colapsar em animação.

Portanto:

```text
STATIC QA
+
DEFORMATION QA
=
BODY APPROVED
```

---

# 241. Weight Painting como parte do Quality Bar

O agente deverá considerar qualidade de weight painting como critério formal.

Avaliar:

- ombro;
- axila;
- cotovelo;
- punho;
- quadril;
- virilha;
- joelho;
- tornozelo;
- pescoço.

---

# 242. Preservação de volume

Ao dobrar articulações, evitar:

- cotovelo “murchando”;
- joelho esmagado;
- ombro colapsando.

Se a stack permitir, considerar:

- corrective blend shapes;
- pose-space deformation;
- ajustes locais.

Não implementar complexidade extrema sem necessidade, mas deixar prevista para zonas críticas.

---

# 243. Corrective Morphs

Criar suporte conceitual para morphs corretivos.

Exemplo:

```text
elbow_bend_fix
shoulder_raise_fix
knee_bend_fix
hip_bend_fix
```

Esses morphs podem ser acionados automaticamente conforme pose/ângulo.

---

# 244. Prioridade de corretivos

Se forem implementados, priorizar:

1. ombros;
2. cotovelos;
3. quadril;
4. joelhos;
5. pescoço.

São áreas de maior impacto visual.

---

# 245. Cabeça e pescoço precisam deformar juntos

Rotação de cabeça deve preservar:

- mandíbula;
- pescoço;
- gola;
- cabelo;
- colares.

Evitar:

- pescoço torcendo como cilindro;
- gola cortando pele;
- cabelo atravessando ombro.

---

# 246. Neck Rotation Test

Testar:

```text
yaw esquerda/direita
pitch cima/baixo
roll lateral
```

Principalmente com:

- cabelo longo;
- barba;
- colar;
- gola alta.

---

# 247. Ombros com roupa

Ombro é uma das regiões mais difíceis porque envolve:

- clavícula;
- braço;
- sleeve;
- ombreira;
- jaqueta.

Criar QA específico.

---

# 248. Shoulder Accessory Contract

Para assets no socket `shoulders`, definir regras de volume e offsets.

O catálogo 3D já possui socket `shoulders` no contrato. 

Logo, a base corporal precisa garantir ancoragem consistente nessa região.

---

# 249. Costas

A região dorsal é crítica para:

- mochila;
- asas;
- capas;
- acessórios grandes.

Validar:

- curvature;
- socket;
- clipping;
- profundidade.

---

# 250. Back Profiles

Criar perfis de ocupação:

```text
back_small
back_medium
back_large
back_winged
```

Isso pode alimentar regras de incompatibilidade.

---

# 251. Mochila × asas

O sistema já prevê incompatibilidades e sockets.

Formalizar:

```text
back slot occupancy
```

Exemplo:

- mochila ocupa centro das costas;
- asas ocupam lateral ampla;
- algumas combinações podem coexistir;
- outras devem ser bloqueadas.

Não deixar regra apenas visual.

---

# 252. Waist Region

O socket `waist` também já existe. 

A anatomia da cintura/quadril deve manter compatibilidade com:

- cintos;
- bolsas;
- coldres não-armamentistas;
- acessórios decorativos.

---

# 253. Wrist Attachments

Os sockets `wrist_l` e `wrist_r` também já estão previstos. 

Validar:

- relógios;
- pulseiras;
- dispositivos tecnológicos.

O punho não pode variar de proporção a ponto de exigir ajuste manual extremo para cada corpo.

---

# 254. Scaling semântico por família corporal

Se acessórios precisarem variar de tamanho entre body families, usar regras explícitas.

Exemplo:

```text
wristScaleProfile = slim | standard | broad
```

Evitar valores mágicos dispersos no código.

---

# 255. Morph de peso

Se existir `bodyWeight`, ele deve alterar com coerência:

- torso;
- braços;
- pernas;
- pescoço;
- rosto apenas se essa correlação estiver intencionalmente implementada.

Não mudar apenas barriga.

---

# 256. Morph de musculatura

Musculatura não deve ser:

> bodyWeight com normal map mais forte.

Precisa alterar:

- deltoides;
- braços;
- torso;
- pernas;
- silhouette.

Mas manter estilo.

---

# 257. Morph de ombro

Ombro largo pode afetar significativamente roupas.

Definir range seguro.

Não permitir valores que façam:

- manga esticar;
- gola quebrar;
- jaqueta perder forma.

---

# 258. Morph de quadril

Mesma lógica.

Impacta:

- calças;
- saias;
- cintos;
- jaquetas longas.

---

# 259. Morph de cintura

Evitar extremos.

Qualquer slider corporal precisa ser homologado com um conjunto mínimo de roupas.

---

# 260. Morph de pernas

Alterações em:

- volume;
- comprimento;
- proporção;

precisam manter:

- joelho;
- tornozelo;
- calçados.

---

# 261. Morph de braços

Se implementado:

- upper arm;
- forearm;
- comprimento.

Evitar mudanças que prejudiquem posição dos sockets de mão/punho.

---

# 262. Bone scaling vs morph target

O agente deverá decidir caso a caso.

### Bone scaling

Bom para:

- altura;
- comprimento de membros;
- proporção.

### Morph target

Bom para:

- volume;
- shape;
- musculatura;
- gordura;
- forma.

Não usar uma técnica única para tudo.

---

# 263. Morph layering

Precisamos prever combinação de morphs.

Exemplo:

```text
slim + tall + broad shoulders
```

não pode produzir:

- mesh quebrada;
- clipping;
- volume incoerente.

Testar combinações, não apenas sliders isolados.

---

# 264. Limitar interações inválidas

Se dois morphs combinados excederem o envelope validado, o sistema poderá:

- limitar valores;
- compensar automaticamente;
- alertar em modo Dev.

Não permitir deformação silenciosamente quebrada.

---

# 265. Morph envelope

Criar conceito de envelope de validade.

Exemplo:

```text
bodyWeight ∈ [-0.7, +0.8]
muscle ∈ [0, +0.9]
shoulderWidth ∈ [-0.5, +0.6]
```

Esses números são apenas conceituais; o agente deve derivar valores reais por QA.

---

# 266. Presets corporais devem cair dentro do envelope

Nunca criar um preset oficial que force valores fora do range validado.

---

# 267. Persistência

Todos os parâmetros corporais precisam continuar determinísticos.

A filosofia já existente de configuração persistível deve ser preservada. O catálogo atual explicitamente define que a mesma configuração deve reproduzir a mesma cena. 

Portanto:

```text
mesmo body config
→ mesmo shape
```

---

# 268. Schema versionado

Se novos morphs forem adicionados, versionar configuração.

Exemplo:

```json
{
  "body": {
    "version": 2,
    "preset": "athletic",
    "weight": 0.1,
    "muscle": 0.55
  }
}
```

Não depender de defaults implícitos que mudam com o tempo.

---

# 269. Migração de configs antigas

Um avatar salvo antes dos novos controles deve continuar renderizando de forma previsível.

Definir defaults compatíveis.

---

# 270. Byte-stability conceitual

A infraestrutura atual já demonstra preocupação com estabilidade de materiais e configurações. 

Manter a mesma filosofia para corpo:

- sem parâmetro novo → aparência anterior compatível;
- parâmetro explicitado → resultado determinístico.

---

# 271. Não ligar corpo à resolução de tela

Shape corporal não pode variar conforme quality tier.

LOD muda detalhe.

Não muda:

- proporção;
- peso;
- altura;
- silhouette fundamental.

---

# 272. LOD corporal

Criar/revisar LOD com cuidado.

### LOD0

- rosto/corpo completo;
- melhor silhouette;
- mãos detalhadas;
- correções de shading.

### LOD1

- redução moderada;
- silhouette preservada.

### LOD2

- redução agressiva em detalhe secundário;
- silhouette ainda reconhecível.

---

# 273. LOD corporal feminino e masculino precisam ter parity

Não permitir que uma base tenha:

- excelente LOD0/1/2;

e outra tenha LODs rudimentares.

---

# 274. Mesh decimation com QA

O pipeline já usa simplificação e gates de triângulos. 

Mas decimation automática precisa ser seguida de revisão visual em áreas como:

- rosto;
- mãos;
- silhouette;
- ombros.

---

# 275. Protected Regions

Avaliar proteger regiões durante simplificação.

Exemplo:

```text
face
hands
silhouette edges
shoulders
```

Se a ferramenta permitir.

---

# 276. Não simplificar tudo igualmente

Uma redução de 50% de polígonos pode ser aceitável no torso e péssima no rosto.

Usar importância perceptiva.

---

# 277. Normals

Revisar:

- vertex normals;
- smoothing;
- hard edges;
- tangents.

Muitos modelos “parecem low-poly” não por falta absoluta de polígonos, mas por normals ruins.

---

# 278. Normal consistency

No corpo humano, evitar:

- faceting involuntário;
- highlights quebrados;
- seams;
- shading duro em regiões suaves.

---

# 279. Tangents

Se normal maps forem usados, garantir tangents consistentes.

---

# 280. UV corporal

O UV precisa permitir:

- pele;
- variações;
- decals futuros;
- tatuagens futuras;
- maquiagem;
- detalhes.

Não precisa resolver todas essas features agora, mas não bloquear.

---

# 281. UV seams

Colocar seams em regiões discretas quando possível.

Evitar costura visível:

- no rosto;
- no peito;
- no ombro.

---

# 282. Texel density

Padronizar densidade.

Regiões prioritárias podem receber mais densidade:

- face;
- mãos.

---

# 283. Face/body texture continuity

Mesmo que rosto e corpo usem materiais separados, a transição em:

- pescoço;
- orelha;
- linha do cabelo;

precisa ser coerente.

---

# 284. Skin Tone uniformity não deve gerar “máscara”

A cor facial e corporal precisa pertencer à mesma pele.

Evitar:

- rosto mais claro;
- pescoço mais escuro;
- orelha saturada demais.

---

# 285. Subsurface-like response estilizada

Não é obrigatório implementar full subsurface scattering.

Mas pele premium precisa responder à luz de forma mais suave que plástico.

Pode ser obtido por:

- material tuning;
- specular;
- roughness;
- wrap lighting;
- shader específico leve, se necessário.

---

# 286. Não exagerar realismo de pele

Evitar:

- poros hiper-realistas;
- imperfeições fotográficas excessivas;
- visual uncanny.

A direção continua estilizada.

---

# 287. Diferenciação corporal por idade

Se a categoria “Idade Visual” evoluir, corpo pode refletir sutilmente:

- postura;
- distribuição de volume;
- definição;
- pele.

Mas não criar estereótipos exagerados.

---

# 288. Crianças não devem ser improvisadas por scaling

Se futuramente houver personagens infantis, não produzir simplesmente:

```text
adult.scale = 0.7
```

Isso gera proporções incorretas.

Tratar como família corporal própria.

Não precisa entrar no escopo imediato se não estiver previsto.

---

# 289. Postura por idade

Pode ser um parâmetro separado de anatomia.

Exemplo:

- adulto jovem → postura neutra;
- mais velho → pequenas mudanças, se artisticamente desejado.

Sempre opcional e curado.

---

# 290. Corpo e gênero não devem restringir expressão

Permitir que roupas, cores, acessórios e poses funcionem de forma ampla quando tecnicamente possível.

Não codificar restrições desnecessárias.

---

# 291. Compatibilidade cross-body

Quando uma peça puder funcionar em múltiplas body families, favorecer isso.

---

# 292. Rig compartilhado como multiplicador de conteúdo

A principal vantagem do rig UBC compartilhado é reduzir custo de:

- animações;
- roupas;
- acessórios;
- retargeting.

Preservar esse multiplicador.

---

# 293. Não trocar rig sem análise de impacto

Qualquer proposta de substituir o skeleton precisa listar impacto em:

- animações;
- roupas;
- cabelos;
- sockets;
- saves;
- pipeline;
- testes.

---

# 294. Rig extension

Se forem necessários bones adicionais, avaliar extensão compatível.

Exemplo:

- twist bones;
- fingers adicionais;
- breast/cloth bones;
- hair bones.

Mas só se houver ganho visual claro.

---

# 295. Twist bones

Podem ajudar em:

- antebraço;
- braço;
- coxa.

Se o rig já der resultado aceitável, não adicionar por moda.

---

# 296. Secondary bones

Podem ser úteis para:

- cabelo;
- casaco;
- acessórios.

Não misturar com core skeleton sem necessidade.

---

# 297. Physics opcional

Secondary motion poderá ser adicionado futuramente a:

- cabelo;
- tecido;
- acessórios.

Mas não deve impedir a entrega inicial.

---

# 298. Physics quality tier

Quando existir, permitir desativação/redução em dispositivos mais fracos.

---

# 299. Evitar jitter

Qualquer física visual precisa ser:

- estável;
- amortecida;
- previsível.

Jitter faz o avatar parecer amador rapidamente.

---

# 300. Body Collision simplificada

Para física secundária, considerar colliders simples:

- cabeça;
- torso;
- ombros.

Não precisa collision mesh completa.

---

# 301. Cabelo longo × corpo

A Parte de cabelo aprofundará isso.

Mas a base corporal precisa expor volumes/colliders coerentes para cabelos longos.

---

# 302. Capas × corpo

Mesma ideia.

---

# 303. Roupas e pose

Uma roupa premium deve ser homologada com:

- neutral;
- hero;
- wave;
- walk.

---

# 304. Corpo e câmera

A anatomia deve ser avaliada nos presets de câmera já existentes:

- corpo;
- busto;
- rosto;
- ¾. 

Não ajustar corpo para uma única câmera.

---

# 305. Camera distortion check

Em ¾ e full-body, verificar se:

- pernas parecem curtas;
- cabeça parece grande;
- ombros distorcem.

Isso pode ser câmera, não anatomia.

Separar causa.

---

# 306. FOV neutral baseline

Definir um FOV neutro de QA.

Assim a equipe compara corpos sem distorção variável.

---

# 307. Portrait FOV separado

Retrato deve usar preset próprio, como já previsto na direção geral.

---

# 308. Body Preview UI

Na seção de corpo, o preview deveria facilitar avaliação.

Ao selecionar Corpo:

- câmera pode ir automaticamente para full-body/¾;
- fundo neutro;
- morphs visíveis;
- controle de giro.

---

# 309. Morph feedback em tempo real

Sliders precisam atualizar o corpo suavemente.

Evitar:

- reload completo;
- piscada de cena;
- reset de câmera.

---

# 310. Transições de morph

Aplicar interpolação curta quando apropriado.

Isso aumenta percepção premium.

---

# 311. Undo/redo corporal

Toda alteração de morph precisa entrar no sistema de histórico.

---

# 312. Preset → morphs

Selecionar um preset deve ser uma ação única no histórico.

---

# 313. Reset corporal

Oferecer reset claro para base/preset padrão.

---

# 314. Randomization segura

Se existir “randomizar avatar”, os morphs devem respeitar ranges homologados.

Não gerar aberrações.

---

# 315. Weighted Random

Melhor que random uniforme.

Preferir concentrações em ranges naturais/curados.

---

# 316. Random body + clothes compatibility

Randomization precisa considerar compatibilidade de roupas.

---

# 317. Metadata corporal

Cada base pode possuir metadados como:

```text
bodyFamily
rig
visualQuality
morphSupport
clothingCompatibility
heightRange
```

---

# 318. Não duplicar metadata no código

Se já existir manifest/registry apropriado, usar a fonte existente.

A arquitetura atual já possui manifest e serviços 3D; consolidar, não espalhar.

---

# 319. Visual Quality metadata

As bases antigas devem receber classificação:

```text
prototype
legacy
production
premium
hero
```

como definido na Parte 1.

---

# 320. Golden Male Base

Criar uma base masculina de referência.

Ela deve demonstrar:

- anatomia;
- mãos;
- face integration;
- skin;
- rig;
- morph;
- roupas;
- LOD.

---

# 321. Golden Female Base

Mesmos critérios.

---

# 322. Golden Body Variants

Depois da base padrão, criar pelo menos uma variação corporal relevante para provar que o sistema não depende de um único shape.

Exemplo:

```text
Male standard
Male broad
Female standard
Female athletic
```

A escolha final pode ser outra.

---

# 323. Golden body precisa funcionar sem roupa

Mesmo que o produto sempre use roupa, isso é QA.

---

# 324. Golden body precisa funcionar vestido

Depois testar com:

- camiseta;
- jaqueta;
- calça;
- calçado.

---

# 325. Testar combinação extrema válida

Por exemplo:

```text
broad body
+
jaqueta
+
mochila
+
pose wave
```

Isso força o pipeline.

---

# 326. Body QA score

Criar score interno mínimo para:

- silhouette;
- deformation;
- hands;
- shoulders;
- neck;
- clothing compatibility;
- animation.

---

# 327. Hard Fail corporal

Reprovar se houver:

- colapso de articulação;
- dedos fundidos visualmente;
- pés flutuando;
- pescoço desconectado;
- roupa incompatível em preset oficial;
- morph rompendo skinning;
- LOD alterando drasticamente silhouette.

---

# 328. Soft Fail corporal

Exemplos:

- pequena perda de detalhe no LOD2;
- microclipping em pose extrema não pública;
- variação mínima de shadow.

---

# 329. Body benchmark screenshots

Gerar automaticamente:

```text
male_standard_front
male_standard_side
male_standard_34
male_standard_back
male_standard_pose

female_standard_front
...
```

---

# 330. Morph benchmark

Para cada slider importante:

```text
MIN
ZERO
MAX
```

e presets.

---

# 331. Cross-morph benchmark

Testar combinações críticas.

---

# 332. Animation benchmark

Capturar frames padronizados.

---

# 333. LOD comparison

Para cada Golden Body:

```text
LOD0
LOD1
LOD2
```

mesma câmera.

---

# 334. Visual difference budget

LOD não deve alterar significativamente silhouette.

Se alterar, reprovar.

---

# 335. Triângulos não são KPI artístico

Um modelo com mais triângulos pode continuar ruim.

Avaliar resultado, não só contagem.

---

# 336. Orçamento poligonal deve servir ao design

Usar mais polígonos onde agregam:

- face;
- mãos;
- silhouette;
- joints.

Menos em superfícies planas.

---

# 337. Topologia

Para corpos premium, priorizar edge flow em:

- olhos;
- boca;
- ombros;
- cotovelos;
- quadril;
- joelhos.

---

# 338. Topologia e morphs

Se morphing for central, topologia precisa ser consistente entre variantes.

---

# 339. Topologia e LOD

LODs devem preservar landmarks.

---

# 340. Corpo não deve depender de texture bake para volume principal

Volume grande deve estar em geometria.

---

# 341. Microdetalhe pode ficar em normal

Separar:

```text
SILHOUETTE/FORM
→ geometry

SURFACE DETAIL
→ normal/roughness
```

---

# 342. Anatomical exaggeration controlada

O estilo pode exagerar:

- ombros;
- pernas;
- cabeça;
- mãos.

Mas documentar na Art Bible.

---

# 343. Proportion Sheet

Criar folha de referência masculina e feminina.

Frente/perfil.

Com landmarks.

---

# 344. Não depender de “olhômetro” para cada novo corpo

Usar a Proportion Sheet como referência.

---

# 345. Style Envelope

Permitir variação, mas dentro do universo Dshow.

---

# 346. Corpo Hero pode ser mais extremo que Standard

Um preset Hero pode ter postura e proporção mais marcante.

Mas não deve se tornar outra linguagem artística.

---

# 347. Corpo e raridade

Formato corporal não deve ser bloqueado por raridade por padrão.

Identidade básica do usuário não deve parecer item premium monetizado, salvo decisão de produto explícita.

---

# 348. Customização fundamental deve ser ampla

Principalmente:

- tons de pele;
- body presets;
- rosto;
- cabelo.

Itens especiais podem usar progressão.

---

# 349. Não criar vantagem visual injusta

Premium deve oferecer:

- exclusividade;
- sofisticação;
- VFX;
- roupas especiais.

Não fazer usuário gratuito parecer propositalmente mal-acabado.

---

# 350. Base quality universal

Toda base corporal disponível ao usuário deve atingir pelo menos:

```text
Q2 — PRODUCTION
```

Nunca Q0.

---

# 351. Hero content

Marketing e onboarding usam preferencialmente Q4.

---

# 352. Retirar bases fracas do destaque

Legacy pode continuar disponível, mas não definir primeira impressão.

---

# 353. Migração do avatar padrão

O avatar default deve ser um dos primeiros a receber upgrade.

Porque é o que:

- novos usuários veem;
- screenshots mostram;
- QA encontra primeiro.

---

# 354. Default character quality

Nunca iniciar o usuário com combinação visualmente fraca.

---

# 355. Default pose

Mesma regra.

---

# 356. Default lighting

Mesma regra.

---

# 357. Default camera

Mesma regra.

A primeira impressão é uma composição.

---

# 358. Body loading fallback

Durante carregamento do modelo premium, evitar flash de:

- T-pose;
- corpo incorreto;
- placeholder grotesco.

Preferir:

- skeleton/loading;
- fade;
- preview;
- low LOD coerente.

---

# 359. Progressive 3D

O projeto já possui lógica de LOD progressivo. 

Aproveitar isso para carregar rapidamente sem comprometer percepção.

---

# 360. LOD2-first precisa manter forma

Se LOD2 aparece primeiro, ele ainda precisa parecer o mesmo personagem.

---

# 361. Crossfade/fade de substituição

Quando LOD alto chegar, evitar pop perceptível.

---

# 362. Skeleton continuity

Troca de LOD deve preservar pose/animação.

---

# 363. Morph continuity

Troca de LOD também deve preservar morphs.

O renderer atual já reaplica ajustes de corpo após troca/LOD, o que é uma boa fundação. 

Preservar e testar isso.

---

# 364. Material continuity

Mesma lógica para cores/material.

---

# 365. Socket continuity

Acessórios não podem saltar de posição quando muda LOD.

---

# 366. Shadow continuity

Troca de LOD não deve causar sombra drasticamente diferente.

---

# 367. Body API

A API interna de corpo deve ser declarativa.

Exemplo conceitual:

```ts
setBodyPreset()
setBodyMorph()
setBodyFamily()
resetBody()
```

Evitar manipulação direta da malha espalhada na UI.

---

# 368. Body State Service

Se já houver store central, integrar nele.

Não criar store paralelo.

---

# 369. Body validation

Toda configuração externa deve ser validada fail-closed, seguindo a filosofia já usada no `validarConfig3d`. 

---

# 370. Valores inválidos

Se vier:

```text
muscle = 999
```

clamp para range seguro.

---

# 371. Preset inexistente

Fallback previsível.

---

# 372. Body family inexistente

Fallback compatível.

---

# 373. Estado antigo

Migrar.

---

# 374. QA unitário de body config

Criar testes para:

- defaults;
- clamps;
- presets;
- serialization;
- migration.

---

# 375. QA visual de body config

Testes funcionais sozinhos não bastam.

---

# 376. QA de performance

Morphs não podem causar recalculations pesados a cada frame.

---

# 377. Atualização somente quando muda

Não recalcular geometria corporal em cada render React sem necessidade.

---

# 378. Debounce visual não deve causar atraso incômodo

Sliders devem parecer imediatos.

---

# 379. GPU morph targets

Quando suportado, aproveitar morph targets nativos.

---

# 380. CPU processing offline

Processos pesados como geração de LOD devem continuar no pipeline, não runtime.

---

# 381. Não gerar mesh premium no navegador

Runtime deve montar e parametrizar.

Não remodelar assets.

---

# 382. Tooling de export

O pipeline de produção precisa garantir que novas bases saiam em formato compatível.

---

# 383. Rig validation

O validador atual já exige bones e nomenclatura adequados. 

Estender para requisitos de body premium se necessário.

---

# 384. Morph validation

Adicionar validações:

- target existe;
- range;
- mesmo vertex count;
- naming.

---

# 385. Naming de morphs

Padronizar ASCII/snake_case quando necessário.

---

# 386. Não codificar nomes dispersos

Criar registry central de morphs.

---

# 387. Morph semantic registry

Exemplo:

```text
body_weight
body_muscle
shoulder_width
hip_width
waist_width
```

---

# 388. Mapping por asset

Se nomes internos diferirem, mapear no manifest.

---

# 389. Preservar abstração

A UI chama:

```text
body_muscle
```

não:

```text
ShapeKey.027
```

---

# 390. Preview de morph no catálogo

Se Body Type for uma categoria com cards, mostrar mini previews significativos.

---

# 391. Não usar texto demais

Como já foi observado na UI, opções de assets precisam ser mais visuais.

Body presets devem ter cards/miniaturas.

---

# 392. Silhouette thumbnails para corpo

Uma miniatura de corpo pode mostrar melhor diferença que apenas “Atlético”.

---

# 393. Hover preview

Ao passar por preset corporal, preview temporário pode ser útil.

Sem salvar até confirmar.

---

# 394. Selected vs Equipped

Manter distinção clara conforme a arquitetura da UI.

---

# 395. Comparação

Opcionalmente permitir:

```text
Antes / Depois
```

para morphs.

---

# 396. Reset parcial

Permitir reset somente de corpo sem destruir:

- rosto;
- roupa;
- acessórios.

---

# 397. Randomize corpo separado

Mesmo princípio.

---

# 398. Copy body settings

Pode ser útil em presets internos/QA.

---

# 399. Body lock

No Photo Studio, permitir travar shape enquanto troca roupas/look.

---

# 400. Golden Body Acceptance Gate

A Parte 2 não poderá ser considerada aprovada até existirem pelo menos:

- uma base masculina premium;
- uma base feminina premium;
- um conjunto mínimo de morphs/presets;
- roupa funcionando;
- animação funcionando;
- LOD funcionando;
- screenshots comparativos;
- QA de clipping;
- QA de deformação.

---

# 401. Critério visual de aceite do Golden Male

Precisa parecer convincente:

- sem roupa complexa;
- com roupa;
- em full-body;
- em ¾;
- em busto;
- em movimento.

---

# 402. Critério visual de aceite do Golden Female

Mesma régua.

---

# 403. Critério de diversidade

Os dois não podem parecer:

> mesma base com pequenas alterações.

---

# 404. Critério de modularidade

Ambos precisam demonstrar integração com assets reais.

---

# 405. Critério de performance

Não sacrificar fluidez indevidamente.

---

# 406. Critério de identidade

Os corpos precisam pertencer ao mesmo universo visual da Dshow.

---

# 407. Critério de futuro

A arquitetura deve permitir adicionar novas body families sem reestruturar renderer.

---

# 408. Deliverables obrigatórios da Parte 2

O agente deverá entregar, no mínimo:

1. auditoria das bases atuais;
2. Proportion Sheet;
3. definição de body families;
4. estratégia de morphs;
5. ranges homologados;
6. morph presets;
7. Golden Male;
8. Golden Female;
9. deformation test suite;
10. clipping QA;
11. body/roupa compatibility;
12. LOD comparison;
13. benchmark screenshots;
14. schema de persistência;
15. migração;
16. testes automatizados;
17. documentação;
18. lista de dívida visual restante.

---

# 409. Ordem recomendada de execução

```text
AUDIT BASES
↓
PROPORTION SHEET
↓
GOLDEN BASE MALE/FEMALE
↓
RIG/SKINNING QA
↓
MORPHS
↓
CLOTHING FIT
↓
POSE/ANIMATION
↓
LOD
↓
VISUAL QA
↓
APPROVAL
```

---

# 410. Proibição de escala antes do gate corporal

Não produzir dezenas de novas roupas especificamente para uma base corporal ainda instável.

O corpo é fundação.

Se ele mudar depois:

> toda a biblioteca de roupa poderá precisar ser refeita.

---

# 411. Resultado final esperado da Parte 2

Ao terminar esta etapa, a sensação não pode mais ser:

> “um boneco sobre o qual colocamos assets”.

Precisa ser:

> **“um personagem sólido, coerente, vivo e suficientemente bem construído para sustentar todo o ecossistema de customização.”**

A arquitetura UBC já oferece um ponto de partida importante por compartilhar rig entre bases, cabelos e roupas. 

A missão desta Parte 2 é transformar essa vantagem técnica em uma **base corporal visualmente premium e escalável**.

---

## FIM DA PARTE 2/12

**Próxima: PARTE 3/12 — ROSTO, CABEÇA, PELE, OLHOS, NARIZ, BOCA, SOBRANCELHAS, EXPRESSÕES, IDADE VISUAL E DIVERSIDADE FACIAL.**





# MEGA BRIEFING — ELEVAÇÃO GRÁFICA AAA DO AVATAR STUDIO DSHOW  
## PARTE 3/12 — ROSTO, CABEÇA, PELE, OLHOS, NARIZ, BOCA, SOBRANCELHAS, EXPRESSÕES, IDADE VISUAL E DIVERSIDADE FACIAL

---

# 412. Objetivo da Parte 3

O rosto deverá passar a ser tratado como **a região de maior prioridade visual de todo o Avatar Studio**.

A percepção de qualidade de um personagem é julgada em poucos segundos, e o rosto concentra grande parte dessa avaliação.

Hoje, pelos prints e pela auditoria técnica, o principal risco é o personagem transmitir:

- pouca profundidade facial;
- pouca diferenciação entre rostos;
- baixa variedade estrutural;
- olhos simples;
- boca simples;
- pele chapada;
- pouca riqueza de sobrancelhas;
- pouca integração entre cabelo, testa, orelhas e face;
- expressão pouco viva;
- pouca leitura de idade;
- pouca leitura de personalidade;
- pouca diversidade real.

A meta desta parte é transformar o rosto em um dos grandes diferenciais visuais do Avatar Studio.

---

# 413. Princípio central: rosto não é um “asset único”

O rosto deverá ser tratado como um sistema composto.

Conceitualmente:

```text
HEAD SHAPE
+
FACE SHAPE
+
SKIN
+
EYES
+
EYEBROWS
+
NOSE
+
MOUTH
+
EARS
+
FACIAL HAIR
+
EXPRESSION
+
AGE
+
MICRODETAIL
```

A combinação desses sistemas deverá produzir identidade facial real.

Não queremos:

> 20 rostos que parecem o mesmo rosto com pequenas alterações.

---

# 414. Diversidade facial precisa vir da geometria

A variação de cor da pele é importante, mas não pode ser confundida com variedade de rosto.

Precisamos ampliar significativamente diferenças em:

- largura do rosto;
- comprimento;
- mandíbula;
- queixo;
- maçãs do rosto;
- testa;
- nariz;
- distância dos olhos;
- altura dos olhos;
- tamanho dos olhos;
- boca;
- lábios;
- sobrancelhas;
- orelhas;
- formato geral da cabeça.

---

# 415. Face Families

Criar famílias estruturais de rosto.

Exemplo conceitual:

```text
oval
round
square
long
heart
angular
broad
narrow
soft
defined
```

Esses nomes podem ser internos.

O usuário não precisa necessariamente selecionar “rosto quadrado”.

Pode ver cards visuais.

---

# 416. Base facial neutra

Assim como no corpo, criar uma base facial neutra suficientemente flexível para receber morphs.

Não começar com uma face muito extrema.

A base deve permitir evolução para:

- angular;
- suave;
- larga;
- estreita;
- jovem;
- madura;
- masculina;
- feminina;
- andrógina quando apropriado.

---

# 417. Não limitar rosto por gênero rigidamente

A arquitetura pode possuir presets masculinos e femininos, mas os componentes devem ser reutilizáveis quando tecnicamente coerentes.

Por exemplo:

- sobrancelhas;
- olhos;
- narizes;
- formatos de boca;

não precisam existir em bancos completamente separados se puderem funcionar transversalmente.

---

# 418. Golden Face Set

Antes de escalar, criar um conjunto reduzido de rostos de referência.

Sugestão inicial:

```text
FACE HERO M01
FACE HERO M02
FACE HERO F01
FACE HERO F02
```

Esses quatro precisam ser claramente diferentes entre si.

---

# 419. Diversidade mínima dos Golden Faces

O conjunto deverá incluir:

- pelo menos 3 tons de pele;
- formatos faciais distintos;
- pelo menos um rosto angular;
- um mais suave;
- olhos distintos;
- bocas distintas;
- diferentes sobrancelhas;
- diferentes estruturas de nariz.

---

# 420. Não produzir “skins” como rosto novo

Se duas opções possuem exatamente a mesma geometria facial e só mudam textura, elas devem ser reconhecidas como:

```text
SKIN VARIANT
```

não:

```text
NEW FACE
```

Isso melhora a organização do catálogo.

---

# 421. Head Shape separado de Face Shape

A cabeça e a face podem precisar de controles diferentes.

Exemplo:

```text
HEAD
- width
- length
- cranium height
```

```text
FACE
- jaw
- cheeks
- chin
- forehead
```

Isso aumenta diversidade sem necessariamente produzir dezenas de meshes isoladas.

---

# 422. Morph facial modular

Preparar sistema com morphs semânticos.

Exemplo:

```text
face_width
face_length
jaw_width
jaw_angle
chin_width
chin_height
cheek_volume
cheekbone_height
forehead_height
```

---

# 423. Evitar exposição excessiva de sliders

Internamente, podemos ter muitos parâmetros.

Na UI, preferir presets e controles principais.

Exemplo:

```text
Formato
Suave ←────────→ Marcado

Largura
Estreito ←─────→ Largo

Mandíbula
Suave ←────────→ Definida
```

---

# 424. Presets faciais

Criar presets curados que movimentem vários morphs.

Exemplo:

```text
SOFT
ANGULAR
BROAD
NARROW
YOUTHFUL
MATURE
```

---

# 425. Combinações precisam permanecer válidas

Face morphs devem possuir envelope seguro.

Não permitir:

- mandíbula atravessando pescoço;
- olhos entrando na cabeça;
- boca deformada;
- nariz quebrado;
- orelhas desalinhadas.

---

# 426. Facial Morph Envelope

Criar limites reais por QA.

Exemplo conceitual:

```text
jaw_width -0.5 → +0.6
face_length -0.4 → +0.5
cheek_volume -0.3 → +0.6
```

Não usar números arbitrários sem homologação.

---

# 427. Olhos serão prioridade máxima

Olhos pobres fazem o avatar parecer imediatamente amador.

Precisamos elevar:

- geometria;
- globo ocular;
- íris;
- pupila;
- highlight;
- pálpebras;
- sombra;
- integração com face;
- expressão.

---

# 428. Globo ocular real

No 3D premium, evitar olho pintado diretamente na face.

Preferir globo ocular real com:

- sclera;
- iris;
- pupil;
- cor;
- reflexo.

---

# 429. Cor dos olhos

Separar cor da íris.

Permitir opções como:

- castanho;
- mel;
- verde;
- azul;
- cinza;
- variantes estilizadas;
- cores especiais para coleções.

---

# 430. Íris não pode parecer adesivo

A íris precisa possuir:

- profundidade visual;
- contraste;
- variação tonal;
- highlight.

Mesmo em estilo semi-realista.

---

# 431. Sclera não deve ser branca pura

Evitar:

```text
#FFFFFF
```

puro.

Usar tom levemente quente/cinza.

Isso ajuda a evitar efeito artificial.

---

# 432. Pálpebras

Pálpebras são essenciais para dar vida.

O olho não pode parecer uma esfera encaixada em um buraco.

Precisamos de:

- upper lid;
- lower lid;
- espessura;
- integração.

---

# 433. Eyelid Morphs

Preparar controles como:

```text
eye_open
upper_lid
lower_lid
```

para expressão e idade visual.

---

# 434. Eye Shape

Diversidade real precisa envolver:

- arredondado;
- amendoado;
- estreito;
- grande;
- pequeno;
- inclinação.

---

# 435. Eye Spacing

Controlável dentro de limites seguros.

---

# 436. Eye Height

A posição vertical dos olhos pode alterar muito identidade.

---

# 437. Eye Tilt

Pequenas variações de inclinação podem gerar diversidade.

Evitar exagero caricatural.

---

# 438. Eye Scale

Pode existir, mas precisa respeitar o estilo.

Não permitir extremos que façam o personagem entrar em estética chibi inadvertidamente.

---

# 439. Catchlight

Implementar highlight controlado.

O olho precisa refletir a iluminação.

---

# 440. Catchlight deve acompanhar light rig

Não usar sempre o mesmo ponto branco independentemente do ambiente.

---

# 441. Eye shader

Se tecnicamente viável, considerar material específico.

Não precisa ser fisicamente perfeito.

Mas deve suportar:

- specular;
- highlight;
- iris;
- cor;
- profundidade.

---

# 442. Olhos estilizados especiais

Coleções fantasy/cyber podem possuir:

- emissive;
- iris holográfica;
- cores incomuns;
- pupil shape diferente.

Mas manter base de qualidade.

---

# 443. Blink

Piscada precisa ser natural.

A documentação do projeto já define como objetivo que o avatar pareça vivo por respiração, piscada e olhar. 

Implementar/revisar:

- intervalo variável;
- duração curta;
- não sincronizar todas as animações rigidamente;
- evitar piscada robótica.

---

# 444. Blink não pode atravessar o olho

Morph/eyelid precisa fechar de maneira natural.

---

# 445. Look-at

Adicionar/revisar micro movimento ocular.

O avatar pode olhar:

- levemente para câmera;
- pequenos offsets;
- retornar ao centro.

---

# 446. Evitar olhar “possuído”

O movimento ocular precisa ser extremamente sutil.

Não ficar olhando em direções aleatórias constantemente.

---

# 447. Eye focus em retrato

No modo Portrait, olhar preferencialmente para câmera.

---

# 448. Nariz precisa existir como estrutura

Evitar nariz simples demais.

Mesmo estilizado, precisa ter:

- bridge;
- tip;
- nostril volume;
- width;
- length.

---

# 449. Nose Families

Criar variações reais.

Exemplo:

```text
narrow
wide
short
long
straight
soft
defined
```

---

# 450. Nose Morphs

Possíveis controles:

```text
nose_width
nose_length
nose_bridge
nose_tip
```

---

# 451. Nariz não deve depender só de textura

Volume principal em geometria.

---

# 452. Boca precisa ganhar profundidade

Hoje, nos modos simples, boca pode parecer um traço.

No premium, ela precisa possuir:

- volume;
- lábios;
- corners;
- abertura;
- forma;
- expressão.

---

# 453. Mouth Families

Variar:

- largura;
- espessura;
- curva;
- formato;
- lábio superior/inferior.

---

# 454. Mouth Morphs

Exemplo:

```text
mouth_width
upper_lip
lower_lip
mouth_corner
```

---

# 455. Mouth Open

Separar morfologia da boca de animação.

---

# 456. Smile

Sorriso precisa envolver:

- corners;
- cheeks;
- eyes sutilmente.

Evitar simples “curvar a boca”.

---

# 457. Expressões precisam envolver o rosto inteiro

Uma expressão convincente combina:

```text
eyes
+
brows
+
cheeks
+
mouth
+
head pose
```

---

# 458. Expressões mínimas

Criar pelo menos:

```text
neutral
smile
confident
surprised
serious
happy
```

Depois expandir.

---

# 459. Não exagerar expressões padrão

A pose idle deve usar:

```text
neutral alive
```

não sorriso permanente.

---

# 460. Microexpression

A neutralidade pode possuir:

- canto da boca leve;
- olhos vivos;
- sobrancelhas naturais.

---

# 461. O androide já possui morphs faciais

O catálogo atual já mapeia morphs de androide para:

- bravo;
- surpreso;
- triste. 

Essa arquitetura demonstra que a aplicação já aceita morphs faciais.

A mesma filosofia deve evoluir para humanos, mas com um sistema muito mais rico.

---

# 462. Human Facial Morph Registry

Criar registry semântico.

Exemplo:

```text
face_smile
face_frown
face_surprise
face_angry
eye_blink_l
eye_blink_r
brow_raise_l
brow_raise_r
mouth_open
```

---

# 463. Naming independente do GLB

A UI/engine deve usar nomes semânticos.

O manifest mapeia para nomes internos do GLB.

---

# 464. Não acoplar UI a ShapeKey.001

Nunca.

---

# 465. Blend Shapes combináveis

Expressões precisam poder ser compostas.

Exemplo:

```text
smile 0.5
+
brow_raise 0.15
```

---

# 466. Limitar combinações ruins

Se certas combinações gerarem deformações artificiais, restringir no preset.

---

# 467. Expression Presets

A UI pode oferecer cards.

Exemplo:

```text
Neutro
Confiante
Feliz
Sério
Surpreso
```

---

# 468. Expression Intensity

Opcionalmente:

```text
Sutil ←────────→ Forte
```

---

# 469. Retrato precisa priorizar expressão

O modo Portrait deve automaticamente garantir:

- olhos visíveis;
- expressão natural;
- head pose adequada.

---

# 470. Boca e dentes

Se abertura de boca for relevante, precisamos tratar dentes.

Não mostrar interior totalmente escuro ou geometria quebrada.

---

# 471. Teeth

Mesmo estilizados, dentes podem ser uma malha simples, mas bem integrada.

---

# 472. Tongue

Só necessário se animações abrirem bastante a boca.

Pode ficar fora do primeiro escopo.

---

# 473. Visemes futuros

Preparar arquitetura para fala futura.

Não precisa implementar lip sync agora.

Mas morph naming não deve bloquear.

---

# 474. Voz e face

Como Voz já aparece como categoria futura no briefing geral, preparar conexão futura:

```text
voice
→ facial animation / viseme
```

sem implementar nesse momento.

---

# 475. Sobrancelhas são fundamentais

Precisamos elevar significativamente opções de sobrancelha.

Elas influenciam:

- personalidade;
- idade;
- expressão;
- gênero visual;
- identidade.

---

# 476. Brows separados do cabelo

Cor pode seguir cabelo por padrão, mas deve poder ser independente.

---

# 477. Brow Families

Variar:

- grossa;
- fina;
- reta;
- arqueada;
- curta;
- longa;
- natural;
- estilizada.

---

# 478. Sobrancelha deve possuir volume

No 3D premium, evitar linha totalmente plana.

Pode ser:

- geometry;
- hair cards;
- decals de alta qualidade dependendo do estilo.

---

# 479. Brow Morph/Position

Permitir ajuste limitado de:

- height;
- angle;
- spacing.

---

# 480. Brow animation

Expressões precisam mover sobrancelhas.

---

# 481. Cílios

No feminino e/ou estilos compatíveis, cílios podem contribuir muito.

Não tornar obrigatório por gênero.

---

# 482. Eyelash Quality

Evitar:

- cards grossos;
- serrilhado;
- transparência ruim.

---

# 483. Orelhas

Normalmente ignoradas, mas aparecem muito com cabelos curtos.

Variar:

- tamanho;
- abertura;
- posição;
- shape.

---

# 484. Ear Morphs

Poucos controles já podem gerar variedade.

---

# 485. Earrings compatibility

Como acessórios em `ears` estão previstos no sistema de sockets, a anatomia das orelhas precisa manter pontos de referência estáveis. O contrato 3D atual já inclui `ears` entre os 14 sockets. 

---

# 486. Facial Hair

Barba deverá ser tratada como categoria visual importante.

O pedido anterior já identificou falta de barbas mais detalhadas.

Precisamos criar:

- barba rala;
- curta;
- cheia;
- desenhada;
- bigode;
- cavanhaque;
- barba longa;
- estilos especiais.

---

# 487. Barba não pode parecer adesivo

Mesmo estilizada, precisa acompanhar:

- mandíbula;
- queixo;
- boca;
- bochechas.

---

# 488. Barba em geometry/cards

Escolher técnica conforme estilo.

Evitar:

- bloco sólido sem forma;
- cards excessivamente grossos.

---

# 489. Beard Color

Permitir cor independente.

Mas oferecer sync com cabelo.

---

# 490. Beard Density

Pode ser um parâmetro.

Exemplo:

```text
leve
média
cheia
```

---

# 491. Beard Fit Profiles

Barba precisa ser compatível com diferentes face families.

Testar:

- jaw narrow;
- jaw broad;
- chin long;
- chin short.

---

# 492. Beard Morph correspondence

Se a face muda, barba precisa acompanhar.

---

# 493. Mustache collision

Bigode não pode entrar na boca.

---

# 494. Beard × expression

Sorriso e boca aberta não podem quebrar barba.

---

# 495. Face Hair LOD

No modo rosto, usar qualidade máxima.

---

# 496. Pele passa a ser sistema, não cor

O catálogo atual possui uma paleta de pele em hexadecimal. 

Isso é insuficiente para o novo quality bar.

Precisamos de:

```text
SKIN TONE
+
ROUGHNESS
+
MICRO VARIATION
+
REGIONAL TINT
+
DETAIL
```

---

# 497. Skin Tone Families

Criar uma paleta ampla e coerente.

Não apenas 5 ou 6 tons.

Permitir diversidade significativa.

---

# 498. Tons de pele não podem ser ordenados hierarquicamente

UI deve apresentar de forma neutra.

---

# 499. Paleta de pele deve funcionar sob todos os lights

Testar:

- studio;
- hero;
- neon;
- portrait.

---

# 500. Pele clara

Evitar estourar highlights.

---

# 501. Pele escura

Garantir:

- detalhes;
- volume;
- specular;
- separação do fundo.

---

# 502. Pele média

Também precisa de QA específico.

---

# 503. Golden Skin Calibration Set

Criar ao menos três referências:

```text
light
medium
dark
```

para calibrar iluminação.

---

# 504. Regional Variation

Pele humana não é uma cor uniforme.

Adicionar sutilmente:

- bochechas;
- nariz;
- lábios;
- orelhas;
- região dos olhos.

---

# 505. Não exagerar blush

A direção continua premium estilizada.

---

# 506. Lábios

A cor dos lábios deve ser integrada ao skin tone.

Não usar rosa padrão em todos.

---

# 507. Lip Tint

Pode existir como parâmetro separado.

---

# 508. Makeup

Preparar arquitetura para maquiagem futura.

Exemplo:

```text
foundation
lip
eyeshadow
liner
blush
```

Não precisa implementar tudo nesta parte se não estiver no escopo imediato.

---

# 509. Makeup como layer

Evitar baked face exclusiva para cada maquiagem.

Preferir layers/material params.

---

# 510. Freckles

Podem existir como overlay.

---

# 511. Moles

Mesma lógica.

---

# 512. Scars

Podem virar categoria/asset.

Mas devem respeitar quality bar.

---

# 513. Tattoos facial

Futuro opcional.

---

# 514. Decal System

Considerar sistema de decals para:

- freckles;
- scars;
- tattoos;
- maquiagem.

Não duplicar texturas inteiras.

---

# 515. Skin roughness

Pele deve ter roughness apropriada.

Evitar:

- boneco de plástico;
- pele totalmente fosca sem vida.

---

# 516. Skin specular

Deve responder especialmente em:

- testa;
- nariz;
- lábios.

Mas de forma controlada.

---

# 517. Microdetail

Podemos adicionar micro normal extremamente sutil.

Não hiper-realista.

---

# 518. Poros

Se usados, somente em close-up.

Não deixar personagem parecer foto realista ao lado de cabelo estilizado.

---

# 519. Coerência estilística

A pele não pode ser extremamente realista enquanto:

- cabelo;
- roupa;
- corpo;

continuam low-poly.

Isso piora o resultado.

---

# 520. Level of Detail facial

No modo rosto:

- face LOD0;
- eyes LOD0;
- brows LOD0;
- beard LOD0;
- hair LOD0.

Isso já está alinhado com a estratégia de LOD por contexto prevista na documentação. 

---

# 521. Face LOD1

Pode simplificar:

- microdetalhe;
- edge loops secundários.

Mas preservar identidade.

---

# 522. Face LOD2

Para corpo inteiro.

Ainda precisa manter:

- silhouette;
- olhos;
- nariz;
- boca;
- cabeça.

---

# 523. Identidade facial não pode mudar entre LODs

Hard Fail se:

> o usuário parece outra pessoa quando afasta a câmera.

---

# 524. Golden Face LOD Comparison

Renderizar cada Golden Face em:

```text
LOD0
LOD1
LOD2
```

mesma câmera.

---

# 525. Head LOD transition

Não deixar o nariz ou mandíbula “pular”.

---

# 526. Eye LOD

Cuidado especial.

Olho pode ser simplificado, mas highlight e forma não podem desaparecer cedo demais.

---

# 527. Brow LOD

Pode simplificar geometry/cards em distância.

---

# 528. Beard LOD

Preservar silhueta.

---

# 529. Ears LOD

Pode simplificar mais agressivamente.

---

# 530. Face topology

A topologia precisa suportar:

- blink;
- smile;
- mouth open;
- brows;
- cheeks;
- jaw.

---

# 531. Edge Loops

Priorizar loops em:

- eyes;
- mouth;
- nasolabial region;
- jaw;
- brows.

---

# 532. Facial rig

Se o rig humano ainda não possui bones faciais suficientes, morph targets podem assumir a maior parte.

---

# 533. Não criar rig facial excessivamente pesado

Para web, preferir equilíbrio entre:

- morph targets;
- bones;
- performance.

---

# 534. Expression system independente do corpo

O sistema facial deve permitir expressão sem reconfigurar body state.

---

# 535. Head Pose

Separar:

```text
facial expression
```

de:

```text
head orientation
```

---

# 536. Head follow

Em idle, leve movimento de cabeça pode acompanhar olhar.

---

# 537. Head movement não pode atrapalhar customização

Quando usuário estiver selecionando rosto/olhos, reduzir movimento.

A peça precisa ficar fácil de observar.

---

# 538. Focus Mode por categoria

Ao abrir:

```text
ROSTO
```

câmera aproxima.

Ao abrir:

```text
OLHOS
```

aproxima ainda mais.

Ao abrir:

```text
BOCA
```

foco na parte inferior da face.

---

# 539. Não mover câmera agressivamente

Transições suaves.

---

# 540. Camera bookmarks

Preparar:

```text
face
eyes
mouth
brows
beard
```

---

# 541. Zoom manual

Usuário precisa poder ajustar zoom.

---

# 542. Reset Camera

Sempre oferecer retorno ao enquadramento recomendado.

---

# 543. Face UI visual-first

Não listar:

```text
Face 01
Face 02
Face 03
```

como texto predominante.

Cards precisam mostrar claramente as diferenças.

---

# 544. Thumbnails faciais maiores

Rosto exige thumbnails maiores que acessórios pequenos.

---

# 545. Thumbnail frontal

Padrão principal.

---

# 546. Hover ¾

Ao hover, opcionalmente mostrar:

- frente → ¾.

Isso ajuda a perceber mandíbula/nariz.

---

# 547. Seleção temporária

Hover/preview pode aplicar temporariamente.

Confirmar no click.

---

# 548. Skin Tone UI no topo

Como já foi observado anteriormente na UX, controle de cores não deve ficar escondido no fundo.

Para rosto:

```text
Skin Tone
```

deve estar perto do topo.

---

# 549. Skin Tone global

Alterar tom de pele deve atualizar:

- face;
- neck;
- ears;
- body;
- mãos;
- partes expostas.

---

# 550. Nunca aplicar pele apenas na cabeça

Hard Fail.

---

# 551. Material Sync

Skin material precisa ser coerente em todas as regiões.

---

# 552. Face Color Overrides

Permitidos apenas para makeup/effects específicos.

---

# 553. Preset de rosto completo

Além de componentes individuais, oferecer presets.

Exemplo:

```text
LOOK FACE 01
```

pode definir:

- head;
- face;
- eyes;
- brows;
- nose;
- mouth.

---

# 554. Customização profunda

Depois usuário pode alterar cada componente.

---

# 555. Preset não deve bloquear liberdade

Qualquer parte pode ser substituída.

---

# 556. Randomize Face

Pode existir, mas usar combinações homologadas.

---

# 557. Evitar uncanny combinations

Exemplo:

- olhos enormes;
- mandíbula extrema;
- boca minúscula.

Usar weighted random dentro do style envelope.

---

# 558. Face archetypes

Podem existir presets como:

```text
soft
heroic
elegant
urban
mature
```

Não usar estereótipos raciais.

---

# 559. Diversidade étnica

A diversidade visual deve existir de forma respeitosa e ampla.

Não representar grupos apenas por:

- cor da pele;
- caricaturas.

Trabalhar com:

- formas;
- olhos;
- nariz;
- boca;
- face;
- cabelo;

de forma combinável.

---

# 560. Evitar “packs raciais” rígidos

Não criar:

```text
Asian Face
African Face
European Face
```

como única lógica.

Preferir componentes faciais combináveis.

---

# 561. Presets podem ser curados, componentes permanecem livres

Isso permite diversidade sem engessar.

---

# 562. Idade Visual

A categoria Idade Visual precisa ser bem mais sofisticada que apenas:

```text
jovem
velho
```

Criar estágios conceituais:

```text
young_adult
adult
mature
```

Se houver necessidade futura, expandir.

---

# 563. Evitar extremos de idade no primeiro momento

O escopo inicial pode focar adultos.

Crianças e idosos avançados podem exigir novas bases.

---

# 564. Age Morphs

Idade visual pode envolver:

- eye region;
- cheeks;
- jaw;
- lips;
- forehead;
- skin roughness;
- subtle lines.

---

# 565. Idade não deve trocar o rosto inteiro

Idealmente:

```text
same identity
+
age progression
```

---

# 566. Age Progression Test

Renderizar o mesmo rosto em:

```text
young
adult
mature
```

A pessoa precisa continuar reconhecível.

---

# 567. Hair age

Cabelo grisalho pode complementar, mas não ser obrigatório.

---

# 568. Beard age

Mesma lógica.

---

# 569. Age lines

Sutis.

Evitar decal grosseiro.

---

# 570. Under-eye

Pode ser ajustado discretamente.

---

# 571. Cheek volume

Pode mudar ligeiramente.

---

# 572. Skin variation

Mature pode alterar:

- roughness;
- microdetail;
- tonal variation.

---

# 573. Não estereotipar idade

“Maduro” não significa automaticamente:

- triste;
- curvado;
- cabelo cinza.

---

# 574. Age and expression separate

Idade não define humor.

---

# 575. Personality visual

A personalidade deve ser representada principalmente por:

- expressão;
- pose;
- olhar;
- styling.

Não pela anatomia facial fixa.

---

# 576. Expression by Personality

Exemplo:

```text
confident
→ slight brow + head pose + subtle smile
```

---

# 577. Face Idle Profiles

Podem existir:

```text
neutral
confident
friendly
serious
```

---

# 578. Micro eye movement

Cada perfil pode variar levemente.

---

# 579. Facial asymmetry

Rostos humanos perfeitamente simétricos parecem artificiais.

Adicionar assimetria muito sutil pode elevar bastante a naturalidade.

---

# 580. Asymmetry Controls

Não precisa ser slider público.

Pode ser integrado aos presets.

---

# 581. Eye asymmetry

Muito pequena.

---

# 582. Brow asymmetry

Também pequena.

---

# 583. Mouth asymmetry

Muito sutil.

---

# 584. Não exagerar assimetria

O objetivo é quebrar perfeição artificial, não deformar.

---

# 585. Normal maps faciais

Podem ajudar em:

- lábios;
- nariz;
- pele;
- sobrancelha quando aplicável.

---

# 586. AO facial

Controlado.

Não escurecer cavidades demais.

---

# 587. Face shadow quality

Sombras no rosto devem ser suaves no preset Studio.

---

# 588. Nose shadow

Não deixar forte demais.

---

# 589. Eye socket shadow

Precisa existir, mas sem transformar olhos em buracos escuros.

---

# 590. Skin light response

Testar com:

- front light;
- side light;
- rim;
- neon.

---

# 591. Portrait light rig

Criar preset dedicado.

Sugestão:

```text
soft key
controlled fill
subtle rim
eye catchlight
```

---

# 592. Hero face rig

Pode ser mais contrastado.

---

# 593. Neon face rig

Precisa preservar legibilidade da pele.

Não saturar face inteira com azul/roxo.

---

# 594. Face calibration render

Todo novo rosto deverá gerar:

```text
Studio
Portrait
Hero
Neon
```

---

# 595. Golden Face QA

Avaliar:

- front;
- side;
- ¾;
- close-up;
- smile;
- blink;
- head turn.

---

# 596. Profile view obrigatório

Muitos rostos ruins parecem bons de frente.

Perfil revela:

- nariz;
- testa;
- mandíbula;
- queixo;
- boca.

---

# 597. ¾ view obrigatório

É o melhor ângulo para avaliar volume geral.

---

# 598. Face silhouette

Renderizar também perfil em silhueta.

---

# 599. Jawline

Precisa manter leitura.

---

# 600. Chin

Não pode desaparecer.

---

# 601. Mouth projection

Lábios não podem parecer colados.

---

# 602. Eye depth

Globo ocular precisa estar corretamente posicionado.

---

# 603. Eyeball clipping

Hard Fail.

---

# 604. Eyelid clipping

Hard Fail.

---

# 605. Teeth clipping

Hard Fail.

---

# 606. Beard clipping

Hard Fail quando evidente.

---

# 607. Hairline

A transição cabelo/testa é crítica.

Não deixar:

- gap;
- cabelo flutuando;
- linha dura artificial.

---

# 608. Hairline variants

Diferentes cabelos podem ter hairlines diferentes, mas precisam casar com a cabeça.

---

# 609. Bald / shaved

Precisam funcionar com cabeça completa.

Não depender de cabelo cobrindo defeitos.

---

# 610. Cabeça careca é teste obrigatório

O Golden Head precisa parecer bem sem cabelo.

Isso revela:

- crânio;
- ears;
- forehead;
- topology.

---

# 611. Orelha escondida não conta como correção

QA deve testar sem cabelo.

---

# 612. Face under accessories

Testar:

- glasses;
- mask;
- hat;
- earrings.

---

# 613. Glasses Fit

Óculos precisam repousar em:

- bridge;
- ears.

Não flutuar.

---

# 614. Glasses size profiles

Se face width variar, ajustar via fit profile.

---

# 615. Mask Fit

Máscaras futuras precisam acompanhar:

- nose;
- jaw;
- cheeks.

---

# 616. Headwear Fit

Chapéus/capuzes precisam considerar head shape e hair state.

---

# 617. Hair occlusion

Se chapéu equipa, cabelo pode:

- usar variant under-hat;
- ocultar regiões;
- reduzir volume.

---

# 618. Não deixar chapéu atravessar cabelo

Hard Fail premium.

---

# 619. Face accessories layering

Definir ordem:

```text
face
→ facial hair
→ glasses
→ mask
→ VFX
```

A ordem real dependerá do renderer, mas deve ser previsível.

---

# 620. 2D clássico precisa receber elevação facial própria

No modo clássico, o problema é diferente.

Não basta portar geometria 3D.

Precisamos elevar o 2D para:

> retrato estilizado premium.

---

# 621. 2D Face Shape

A base 2D não deve depender de uma única elipse.

Criar formatos de face com silhueta realmente diferente.

---

# 622. 2D Head Shapes

Exemplo:

- oval;
- square;
- round;
- long;
- angular.

---

# 623. 2D Shading

Adicionar:

- shadow lateral;
- cheek shading;
- under-chin;
- nose;
- brow region.

Sem exagerar.

---

# 624. 2D Skin gradient

Não usar cor totalmente chapada.

Criar gradiente muito controlado.

---

# 625. 2D Eyes

Precisam possuir:

- sclera;
- iris;
- pupil;
- highlight;
- upper lid;
- brow.

---

# 626. 2D Mouth

Mais variedade de forma e volume.

---

# 627. 2D Nose

Não apenas um traço se o style permitir mais volume.

---

# 628. 2D Brows

Mais estilos e espessuras.

---

# 629. 2D Face Highlight

Pode existir em:

- nose;
- cheek;
- forehead.

---

# 630. 2D Occlusion

Cabelo e barba devem respeitar máscaras do rosto.

---

# 631. 2D Face Depth

Usar layers para criar:

```text
background head
ears
face
eyes
nose
mouth
hair front
accessories
```

---

# 632. 2D não deve tentar realismo

A meta continua:

```text
premium illustration
```

não:

```text
fake 3D
```

---

# 633. Coerência entre 2D e 3D

O mesmo avatar pode ter identidades equivalentes nos dois modos.

Não precisa parecer pixel-perfect igual.

Mas:

- cor;
- cabelo;
- rosto;
- roupa;
- expressão;

devem corresponder semanticamente.

---

# 634. Avatar Identity Mapping

Preparar mapping:

```text
face_id
hair_id
skin_id
```

entre renderers.

---

# 635. Não obrigar todos os assets a existir nos dois renderers

Mas a UI precisa indicar compatibilidade.

---

# 636. Premium 3D-only

Pode existir.

---

# 637. Classic-only

Também pode existir.

---

# 638. Golden face deve ter representação em ambos quando possível

Excelente para comparar linguagens.

---

# 639. Face asset taxonomy

Organizar categorias.

Exemplo:

```text
FACE SHAPE
SKIN
EYES
BROWS
NOSE
MOUTH
EARS
BEARD
EXPRESSION
AGE
```

---

# 640. Não esconder subcategorias importantes

Rosto não pode virar uma grade com centenas de itens sem organização.

---

# 641. Tabs visuais

Preferir tabs para:

- shape;
- skin;
- eyes;
- mouth;
- brows.

Alinhado ao pedido anterior de reduzir dependência de dropdowns.

---

# 642. Search

Em catálogos grandes, busca continua importante.

---

# 643. Filters

Filtros úteis:

- style;
- new;
- favorites;
- collection.

---

# 644. Rarity não deve dominar rosto básico

Características identitárias básicas devem ser amplamente acessíveis.

---

# 645. Premium facial assets

Podem existir em:

- cyber eyes;
- makeup especial;
- animated tattoos;
- fantasy ears;
- special effects.

---

# 646. Cor da pele não deve ser premium

Regra recomendada de produto.

---

# 647. Formatos básicos de rosto também não

A diversidade fundamental não deve ficar artificialmente bloqueada.

---

# 648. Photo Studio face controls

No Photo Studio, oferecer:

- expression;
- gaze;
- head angle;
- portrait lighting.

---

# 649. Eye contact toggle

Exemplo:

```text
Olhar para câmera
```

---

# 650. Head angle presets

Exemplo:

```text
Frontal
¾ esquerdo
¾ direito
Perfil
```

---

# 651. Expression presets para foto

Mais opções podem existir no Photo Studio que no editor principal.

---

# 652. Face Capture Quality

Captura deve forçar:

- LOD0;
- textura máxima;
- melhor AA;
- melhor shadow;
- melhor eye detail.

O sistema já possui captura 3D em qualidade elevada com LOD alto e supersampling. 

Preservar e especializar para retrato.

---

# 653. Depth of Field

Pode ser utilizado no Photo Studio, mas com moderação.

Nunca desfocar olhos.

---

# 654. Focus target

Em retrato:

```text
eyes
```

---

# 655. Skin exposure protection

Evitar overexposure.

---

# 656. Eye catchlight in capture

Garantir.

---

# 657. Portrait background

Precisa favorecer face.

---

# 658. Face QA automation

Testes técnicos podem verificar:

- morph target exists;
- eye meshes exist;
- materials;
- LOD;
- texture;
- bounds.

---

# 659. Visual QA continua humano/visual

Automação não detectará tudo.

---

# 660. Face Golden Screenshots

Gerar:

```text
front_neutral
front_smile
34_neutral
profile
eyes_closeup
mouth_closeup
skin_studio
skin_hero
```

---

# 661. Before/After

Comparar rosto atual e novo com:

- mesma câmera;
- mesma luz;
- sem VFX.

---

# 662. Hard Fail facial

Reprovar se houver:

- olho atravessando face;
- blink quebrado;
- boca quebrada;
- barba flutuando;
- pele plástica evidente;
- head/neck seam;
- face irreconhecível entre LODs;
- expressão deformada;
- textura pixelada no close-up suportado;
- mismatch forte de skin body/head.

---

# 663. Soft Fail facial

Exemplos:

- micro diferença de catchlight;
- pequena perda de microdetail em LOD1;
- clipping mínimo em expressão extrema não pública.

---

# 664. Face quality score

Sugestão:

```text
Shape          9/10
Eyes           9/10
Skin           9/10
Mouth          8/10
Brows          8/10
Expression     9/10
Close-up       9/10
LOD continuity 9/10
```

---

# 665. Close-up é gate absoluto

Se o rosto não estiver aprovado no close-up, não é Premium.

---

# 666. Não lançar novos 30 rostos antes dos Golden Faces

Primeiro:

```text
4 excelentes
```

Depois escalar.

---

# 667. Triplicar opções somente depois do padrão novo

O pedido de aumentar pelo menos três vezes as opções de rosto continua válido.

Mas a ordem deve ser:

```text
QUALITY
↓
GOLDEN SET
↓
PIPELINE
↓
SCALE 3X+
```

Não o contrário.

---

# 668. Olhos também precisam crescer em quantidade

Depois do Golden Set, expandir:

- eye shapes;
- iris colors;
- stylized variants.

---

# 669. Boca também

Expandir:

- shape;
- lip volume;
- expressions.

---

# 670. Sobrancelhas também

Expandir:

- shape;
- thickness;
- style.

---

# 671. Nariz deve entrar de forma explícita

Mesmo que hoje não exista como categoria independente, o novo sistema deve avaliar essa possibilidade.

Isso aumentará muito diversidade facial.

---

# 672. Orelha também pode ser parâmetro avançado

Não precisa ser destaque principal.

---

# 673. Face presets ajudam onboarding

Usuário casual pode escolher um rosto pronto rapidamente.

---

# 674. Advanced Face Editor

Usuário avançado pode abrir ajustes finos.

---

# 675. UX em duas camadas

```text
SIMPLE
presets + principais opções
```

```text
ADVANCED
morphs adicionais
```

---

# 676. Não sobrecarregar interface

A sofisticação interna não deve virar 40 sliders de uma vez.

---

# 677. Histórico facial

Cada alteração deve entrar em undo/redo.

---

# 678. Comparison Mode

Opcionalmente:

```text
A/B Face
```

para comparar dois presets.

---

# 679. Favoritos

Face presets e olhos podem ser favoritados.

---

# 680. Recentes

Útil em catálogos grandes.

---

# 681. Consistência com Vitrine

Cards precisam mostrar o resultado real.

---

# 682. Face loading

Não mostrar:

- olho faltando;
- cabeça careca temporária;
- materiais default;

durante carregamento.

---

# 683. Progressive loading face

Em close-up, priorizar carregamento de:

1. face;
2. eyes;
3. hair;
4. brows;
5. beard;
6. clothing.

---

# 684. Cache facial

Assets frequentemente usados podem ter prioridade maior.

---

# 685. Preload on hover

Pode ser útil para rosto/hair.

---

# 686. Performance

Face premium precisa continuar viável em web.

---

# 687. Texture budget

Definir budget específico para face.

Pode ser maior que áreas secundárias.

---

# 688. Não usar 4K indiscriminadamente

Se 2K já entrega qualidade suficiente no viewport, preferir.

---

# 689. Close-up capture pode usar versão maior

Se pipeline suportar.

---

# 690. Texture streaming futuro

A documentação já reconhece texture streaming e otimização como frentes futuras. 

Não bloquear arquitetura.

---

# 691. KTX2 futuro

Também pode ser considerado em otimização posterior.

---

# 692. Material sharing

Skin material pode ser compartilhado quando apropriado.

---

# 693. Customization via parameters

Não duplicar textura para cada tom de pele.

---

# 694. Skin tint deve respeitar textura

Aplicar de modo que microdetail não seja destruído.

---

# 695. Material Manager

A infraestrutura atual já possui `Materiais3d.ts` e lógica explícita para não “chutar” materiais de pele. 

Preservar essa abordagem rigorosa.

---

# 696. Skin identification

Materiais de pele precisam ter naming/metadata explícitos.

---

# 697. Não pintar material errado

Hard Fail técnico.

---

# 698. Face asset metadata

Adicionar/normalizar:

```text
faceFamily
genderAffinity
visualQuality
morphSupport
skinSupport
rendererSupport
lodSupport
```

---

# 699. License metadata

Continuar rastreando proveniência.

---

# 700. Não depender de nome de arquivo

Resolver via manifest.

---

# 701. Golden Face Acceptance Gate

A Parte 3 só poderá ser aprovada quando existirem:

- rostos claramente distintos;
- pele premium;
- olhos premium;
- boca premium;
- sobrancelhas premium;
- expressão;
- blink;
- close-up;
- LOD;
- QA de perfil;
- integração com barba/cabelo/óculos.

---

# 702. Acceptance — diversidade

Quatro Golden Faces não podem parecer irmãos.

---

# 703. Acceptance — pele

Três tons precisam funcionar em Studio e Hero.

---

# 704. Acceptance — olhos

Olhos precisam parecer vivos.

---

# 705. Acceptance — expressão

Neutral + smile + serious precisam funcionar.

---

# 706. Acceptance — close-up

Nenhum artefato evidente.

---

# 707. Acceptance — performance

Close-up não pode destruir FPS indevidamente.

---

# 708. Acceptance — modularidade

Trocar cabelo/barba/óculos não quebra face.

---

# 709. Deliverables obrigatórios da Parte 3

O agente deverá entregar:

1. auditoria facial atual;
2. definição de Face Families;
3. Golden Face Set;
4. Skin Calibration Set;
5. eye system;
6. brow system;
7. nose system;
8. mouth system;
9. beard fit;
10. facial morph registry;
11. expression presets;
12. blink;
13. look-at;
14. age visual strategy;
15. face LOD;
16. close-up QA;
17. profile QA;
18. 2D premium face strategy;
19. screenshots Before/After;
20. documentação na Art Bible.

---

# 710. Ordem recomendada

```text
FACE AUDIT
↓
HEAD/FACE BASE
↓
EYES
↓
SKIN
↓
BROWS/NOSE/MOUTH
↓
EXPRESSIONS
↓
BEARD FIT
↓
AGE
↓
LOD
↓
2D EQUIVALENT
↓
VISUAL QA
```

---

# 711. Regra crítica de escala

Não triplicar o número de rostos antes de aprovar o novo padrão.

O objetivo final continua sendo aumentar significativamente a quantidade.

Mas:

> **4 rostos excelentes são mais importantes agora do que 40 rostos medianos.**

Depois da aprovação, o pipeline deve permitir escalar para dezenas e posteriormente centenas de combinações sem nova reestruturação.

---

# 712. Resultado esperado da Parte 3

Ao concluir esta etapa, o usuário precisa olhar para o avatar e perceber:

> **“Esse personagem tem identidade.”**

Não:

> “É o mesmo boneco com outro cabelo.”

O rosto deverá se tornar a principal prova de que o Avatar Studio realmente saiu de um estágio de protótipo visual para um **Character Creator premium, expressivo, diverso e tecnicamente preparado para escalar**.

---

## FIM DA PARTE 3/12

**Próxima: PARTE 4/12 — CABELOS, BARBAS, SOBRANCELHAS AVANÇADAS, HAIR CARDS, SHADERS, VOLUME, MOVIMENTO, FIT COM CHAPÉUS E QUALIDADE EM CLOSE-UP.**





# MEGA BRIEFING — ELEVAÇÃO GRÁFICA AAA DO AVATAR STUDIO DSHOW  
## PARTE 4/12 — CABELOS, BARBAS, SOBRANCELHAS AVANÇADAS, HAIR CARDS, SHADERS, VOLUME, MOVIMENTO, FIT COM CHAPÉUS E QUALIDADE EM CLOSE-UP

# 713. Objetivo da Parte 4

Esta parte deverá elevar de forma específica todo o sistema de **cabelos, barbas, pelos faciais e sobrancelhas**, porque essas categorias são hoje uma das maiores responsáveis pela percepção de “avatar simples” ou “avatar amador”.

O próprio material auditado já aponta uma limitação concreta: há registro de **hair cards opacos** e indicação explícita de que isso deve ser revisitado com assets premium. 

Portanto, esta frente não deve ser tratada como mera expansão quantitativa de opções.

A meta é transformar cabelo e barba em elementos que transmitam:

- volume;
- materialidade;
- silhueta;
- personalidade;
- integração com a cabeça;
- resposta à luz;
- qualidade em close-up;
- compatibilidade com animação;
- compatibilidade com chapéus/capuzes;
- diversidade visual real.

---

# 714. Princípio central: cabelo não pode parecer capacete

O erro mais grave a evitar é o cabelo parecer:

- um bloco;
- um volume rígido;
- uma peça colada;
- uma massa sem mechas;
- uma casca plástica sobre a cabeça.

Mesmo em estilo estilizado, o cabelo precisa comunicar:

> forma + direção + massa + acabamento.

---

# 715. Separar silhouette, volume e detalhe

O cabelo deve ser construído em três níveis perceptivos:

```text
SILHUETA
+
VOLUME PRINCIPAL
+
DETALHE SECUNDÁRIO
```

Silhueta e volume devem funcionar mesmo sem textura.

Detalhe pode vir de:

- hair cards;
- normal;
- roughness;
- pequenos meshes;
- highlights;
- mechas secundárias.

---

# 716. Clay Test para cabelo

Todo cabelo premium deve ser avaliado com material neutro.

Se ele só parece bom graças à textura, a geometria pode estar fraca.

---

# 717. Silhouette Test

Renderizar cabelo totalmente preto sobre fundo branco.

Avaliar:

- shape;
- volume;
- comprimento;
- assimetria;
- leitura frontal;
- perfil;
- costas.

Se vários cabelos diferentes virarem praticamente a mesma silhueta, falta diversidade.

---

# 718. Diversidade real de cabelo

A expansão quantitativa deve incluir diferenças reais em:

- comprimento;
- volume;
- direção;
- repartição;
- franja;
- altura;
- laterais;
- nuca;
- textura visual;
- assimetria;
- styling.

Não apenas:

```text
mesmo cabelo + outra cor
```

---

# 719. Hair Families

Criar famílias internas, por exemplo:

```text
short
medium
long
curly
wavy
straight
braided
afro
buzz
fade
mohawk
bun
ponytail
dread
fantasy
cyber
```

Essas famílias ajudam em:

- catálogo;
- QA;
- fit;
- thumbnails;
- recomendação;
- regras com chapéus.

---

# 720. Não reduzir diversidade étnica a cor

Cabelo é um dos componentes mais fortes de identidade.

Precisamos suportar estilos com estruturas realmente diferentes, inclusive:

- crespo;
- cacheado;
- afro;
- tranças;
- twists;
- dreads;
- lisos;
- ondulados;
- raspados;
- cortes curtos diversos.

---

# 721. Hair Base Meshes

Para cabelos sólidos/estilizados, usar base mesh com:

- volume coerente;
- mechas principais;
- silhouette limpa.

Evitar adicionar milhares de strands sem necessidade.

---

# 722. Hair Cards

Quando cards forem utilizados, devem servir para:

- flyaways;
- franjas finas;
- pontas;
- mechas soltas;
- transparência controlada.

Não usar hair cards grosseiros como substituto de toda a massa capilar se o resultado ficar pobre.

---

# 723. Hair Cards atuais precisam de revisão

A auditoria já registra problema de opacidade e necessidade de revisão premium. 

O agente deverá:

- inventariar cabelos que usam cards;
- identificar quais são visivelmente problemáticos;
- classificar `KEEP / UPGRADE / REPLACE`;
- testar transparência;
- testar sorting;
- testar backlight;
- testar close-up.

---

# 724. Transparência

Hair cards transparentes podem gerar problemas de:

- sorting;
- overdraw;
- serrilhado;
- halo;
- artefatos no contorno.

O pipeline precisa controlar isso.

---

# 725. Alpha Test vs Alpha Blend

Avaliar por asset.

Quando possível:

- `alphaTest` pode ser mais estável e barato;
- `alphaBlend` pode ser necessário em mechas delicadas.

Não aplicar uma única configuração a todos.

---

# 726. Dithering

Se tecnicamente útil, considerar dithering controlado para transições.

Mas não criar ruído visual evidente.

---

# 727. Premultiplied Alpha

Verificar consistência do pipeline de texturas e material.

Artefatos de borda em hair cards frequentemente vêm de tratamento inadequado de alpha.

---

# 728. Texture Padding

Texturas transparentes devem possuir padding adequado para evitar bordas claras/escuras.

---

# 729. Hair Shader

Cabelo precisa ter comportamento material próprio.

Não usar exatamente o mesmo material de:

- plástico;
- roupa;
- pele.

---

# 730. Hair Material Family

Criar algo equivalente a:

```text
hair_soft
hair_gloss
hair_coarse
hair_fantasy
```

com parâmetros curados.

---

# 731. Roughness capilar

Cabelo costuma ter resposta especular direcional.

Mesmo sem shader anisotrópico avançado, ajustar:

- roughness;
- specular;
- highlight;
- environment response.

---

# 732. Anisotropy futura

Se a stack permitir de forma eficiente, considerar anisotropy para cabelos premium.

Mas não tornar isso bloqueio inicial.

---

# 733. Highlight direcional

A iluminação deve revelar o fluxo do cabelo.

Não criar highlight uniforme como plástico.

---

# 734. Normal maps no cabelo

Podem ajudar a comunicar:

- mechas;
- ondas;
- textura.

Mas não substituir volume principal.

---

# 735. Root-to-tip variation

Cabelos premium podem possuir pequena variação de:

- brilho;
- cor;
- roughness;

da raiz às pontas.

Não precisa ser fisicamente complexo.

---

# 736. Cor do cabelo

A paleta atual já possui variações básicas. 

Expandir para:

- preto;
- castanhos;
- loiros;
- ruivos;
- grisalhos;
- branco;
- cores fantasy;
- dual-tone;
- highlights.

---

# 737. Cor não deve ser um flat tint destrutivo

Preservar:

- variação tonal;
- shadow;
- highlights;
- texture.

---

# 738. Gradient Hair

Alguns estilos podem permitir:

- ombré;
- pontas coloridas;
- raiz diferente.

---

# 739. Dual Color Channels

Preparar suporte conceitual para:

```text
hair_primary
hair_secondary
```

quando o asset suportar.

---

# 740. Não obrigar todos os cabelos a dual-color

Somente assets preparados para isso.

---

# 741. Hairline

A linha do cabelo é crítica.

Ela precisa parecer:

- integrada;
- natural dentro do estilo;
- sem gap;
- sem interpenetração grosseira.

---

# 742. Hairline Fit

Diferentes face/head shapes precisam manter encaixe.

Se head morph alterar a testa, o cabelo deve continuar aderente.

---

# 743. Head Shape Compatibility

Cada cabelo deve informar compatibilidade com:

- head families;
- head scale range;
- crown volume.

---

# 744. Hair Fit Profiles

Exemplo conceitual:

```text
fitProfile:
  head: standard
  foreheadClearance: medium
  earCoverage: partial
  shoulderCollision: yes
```

---

# 745. Evitar offset mágico

Não ajustar cabelo por asset com números soltos espalhados no código.

Centralizar offsets em metadata/manifest.

---

# 746. Pivot correto

Cabelo precisa ter pivot/anchor previsível.

---

# 747. Scalp anchor

Idealmente, usar cabeça/rig como referência.

---

# 748. Hair Rig

Cabelos curtos podem não precisar de bones secundários.

Cabelos longos podem precisar de:

- bones;
- spring;
- physics;
- deformation simples.

---

# 749. Secondary Motion

Cabelo longo premium deve possuir movimento sutil quando possível.

Exemplos:

- aceleração do corpo;
- giro de cabeça;
- idle.

---

# 750. Não exagerar física

O cabelo não pode:

- balançar como borracha;
- atravessar ombros;
- vibrar.

---

# 751. Damping

Movimento secundário precisa ser amortecido.

---

# 752. Physics Tier

Em dispositivos mais fracos:

- reduzir bones simulados;
- congelar secondary motion;
- manter shape principal.

---

# 753. Static fallback

Mesmo sem physics, cabelo deve parecer bom.

---

# 754. Hair Colliders

Cabelos longos podem usar colliders simples em:

- cabeça;
- ombros;
- torso superior.

---

# 755. Não usar colisão complexa em runtime sem necessidade

O custo pode ser alto.

---

# 756. Hair × Shoulder

Testar especificamente:

- longo;
- coque;
- ponytail;
- trança.

---

# 757. Hair × Back Accessories

Cabelo longo deve coexistir com:

- mochila;
- asas;
- capas.

Se incompatível, registrar regra.

---

# 758. Hair × Neck Accessories

Testar:

- colares;
- golas;
- cachecóis.

---

# 759. Hair × Headwear

Esta será uma das áreas críticas.

Chapéus, bonés, capuzes, coroas e helmets precisam funcionar sem destruir cabelo.

---

# 760. Headwear Compatibility Modes

Cada cabelo pode possuir comportamento:

```text
full
compressed
hidden_top
hidden_all
under_hat_variant
incompatible
```

---

# 761. Under-Hat Variant

Para cabelos volumosos, pode ser necessário possuir variante específica para chapéu.

---

# 762. Não apenas esconder o cabelo inteiro

Se um boné é equipado, esconder completamente o cabelo pode parecer barato.

Preferir manter:

- laterais;
- nuca;
- pontas.

---

# 763. Hair Mask Regions

Preparar regiões internas:

```text
top
front
sides
back
ponytail
```

Um chapéu pode ocultar apenas `top`.

---

# 764. Headwear Metadata

Exemplo:

```text
hairMask: ['top']
```

---

# 765. Helmet

Capacetes fechados podem ocultar mais.

---

# 766. Crown

Coroa pode coexistir sem ocultar cabelo.

Mas precisa encaixar no volume.

---

# 767. Halo

Halo não precisa interagir diretamente com cabelo, mas deve preservar profundidade e sorting.

---

# 768. Capuz

Capuz pode exigir:

- cabelo interno reduzido;
- variante própria;
- ocultação parcial.

---

# 769. Hair State

O sistema pode ter um estado resolvido:

```text
visible
masked
variant
hidden
```

---

# 770. Resolver isso no motor de regras

Não espalhar condicionais pela UI.

---

# 771. Hair Visual Quality Tier

Classificar cabelos:

```text
prototype
legacy
production
premium
hero
```

como definido na Parte 1.

---

# 772. Hero Hair Set

Criar pelo menos alguns cabelos de referência:

- curto masculino;
- médio;
- longo;
- feminino longo;
- coque/ponytail;
- crespo/afro;
- um estilizado especial.

---

# 773. Golden Hair Set

Sugestão mínima:

```text
H01 short clean
H02 medium textured
H03 long
H04 bun
H05 afro
H06 fantasy/cyber
```

A lista final pode mudar, mas precisa demonstrar capacidades diferentes.

---

# 774. Close-up obrigatório

Todo cabelo Premium precisa funcionar no modo rosto.

---

# 775. Hair LOD

No modo rosto:

- LOD0.

No busto:

- LOD0/1.

Full body:

- LOD1/2 conforme cobertura.

---

# 776. Silhouette continuity

LOD não pode reduzir volume a ponto de parecer outro corte.

---

# 777. Hair Card LOD

Reduzir cards secundários em níveis inferiores.

---

# 778. Stray Hair

Flyaways podem existir apenas em LOD0.

---

# 779. Hair Texture LOD

LOD0:
- melhor resolução.

LOD1:
- média.

LOD2:
- compactada.

---

# 780. Transparência em LOD baixo

Pode ser simplificada para reduzir overdraw.

---

# 781. Hair Performance Budget

Criar budget por cabelo:

- triângulos;
- cards;
- texture size;
- draw calls;
- bones.

---

# 782. Draw Calls

Evitar um cabelo com:

- 10 materiais;
- 15 draw calls;

sem necessidade.

---

# 783. Material Sharing

Compartilhar material base quando possível.

---

# 784. Color Variants via parameters

Não duplicar GLB para cada cor.

---

# 785. Grisalho

Pode ser:

- blend;
- secondary channel;
- texture overlay.

---

# 786. Root Color

Alguns estilos podem ter raiz mais escura.

---

# 787. Hair AO

Controlado.

Não criar raiz preta demais.

---

# 788. Scalp visibility

Em cabelos com repartição, o couro cabeludo pode precisar aparecer.

---

# 789. Scalp Material

Deve combinar com skin tone.

---

# 790. Scalp Cap

Pode existir para evitar buracos visuais.

---

# 791. Careca/raspado

O catálogo já possui assets raspados e barba no conjunto 3D. 

Esses assets devem ser auditados no novo quality bar.

---

# 792. Buzz Cut

Pode funcionar melhor com:

- texture;
- normal;
- mesh curta.

Não precisa ser full geometry strand.

---

# 793. Fade

Precisa de transição convincente.

---

# 794. Afro

Exige tratamento de volume próprio.

Evitar representar como esfera simples.

---

# 795. Curls

Podem usar:

- clumps;
- curves baked;
- mesh groups.

---

# 796. Braids

Precisam de silhueta clara e bom comportamento de rig.

---

# 797. Dreads

Mesmo princípio.

---

# 798. Ponytail

Precisa de secondary motion.

---

# 799. Bun

Volume precisa ser bem ancorado.

---

# 800. Bangs

Franjas são críticas porque ficam próximas dos olhos.

Precisam evitar:

- atravessar pálpebras;
- esconder olhos demais;
- clipping em blink.

---

# 801. Hair × Expression

Expressões faciais não devem empurrar cabelo.

Mas cabelos próximos ao rosto precisam manter distância adequada.

---

# 802. Hair × Face Morph

Face widening/narrowing pode afetar:

- sideburns;
- fringe;
- ears.

Testar envelope.

---

# 803. Hair × Head Scale

Se head scale mudar, cabelo deve acompanhar semanticamente.

---

# 804. Hair × Ear Morph

Cabelos que expõem orelhas precisam continuar funcionando.

---

# 805. Sideburns

Tratar como parte do cabelo ou barba conforme estilo.

---

# 806. Barba: princípio central

Barba deve ser percebida como parte orgânica do rosto, não como camada sobreposta.

---

# 807. Beard Families

Criar famílias como:

```text
stubble
short
boxed
full
goatee
mustache
long
styled
fantasy
```

---

# 808. Stubble

Barba rala pode ser melhor representada por:

- texture;
- decal;
- shader.

Não precisa de geometry densa.

---

# 809. Short Beard

Pode usar geometry leve + texture.

---

# 810. Full Beard

Precisa de volume e silhouette.

---

# 811. Long Beard

Pode precisar de secondary motion.

---

# 812. Mustache

Deve respeitar boca e expressões.

---

# 813. Goatee

Precisa encaixar no queixo.

---

# 814. Beard Fit

Barba precisa acompanhar:

- jaw width;
- chin length;
- face width.

---

# 815. Beard Morph Binding

Se face morph muda, barba deve acompanhar shape.

---

# 816. Não usar scale uniforme

Uma barba larga não deve ser corrigida apenas com `scaleX`.

Preferir blend/fit apropriado.

---

# 817. Beard Root

Base da barba precisa nascer no rosto.

---

# 818. Beard Shadow

Contato deve ser convincente.

---

# 819. Beard Material

Pode compartilhar filosofia do cabelo, mas com roughness própria.

---

# 820. Beard Color

Pode sincronizar com cabelo por padrão.

---

# 821. Independent Beard Color

Usuário pode optar por outra cor.

---

# 822. Grey Beard

Importante para idade visual.

---

# 823. Beard Highlight

Controlado.

---

# 824. Beard LOD

Close-up:
- máximo.

Full-body:
- simplificado.

---

# 825. Beard × Mask

Máscaras podem ocultar barba parcial ou totalmente.

---

# 826. Beard × Scarf

Mesma lógica.

---

# 827. Beard × Collar

Barbas longas podem colidir com gola.

Criar compatibilidade.

---

# 828. Beard × Neck

Não flutuar.

---

# 829. Beard animation

Barba curta pode seguir face rigidamente.

Barba longa pode precisar de secondary motion.

---

# 830. Bigodes avançados

Criar variedade:

- fino;
- clássico;
- handlebar;
- cheio;
- stylized.

---

# 831. Não usar estereótipos caricaturais

Os estilos devem ser opções, não caricaturas.

---

# 832. Sobrancelhas avançadas

A Parte 3 já tratou o papel facial das sobrancelhas.

Aqui o foco é a qualidade gráfica.

---

# 833. Brow Geometry

Sobrancelhas premium podem usar:

- geometry leve;
- cards;
- texture híbrida.

---

# 834. Brow Hair Direction

A textura/geometry deve indicar direção dos fios.

---

# 835. Brow Thickness

Precisa variar visualmente de verdade.

---

# 836. Brow Material

Pode reutilizar hair shader simplificado.

---

# 837. Brow Color

Sync com cabelo por padrão.

---

# 838. Brow Independent Color

Permitir override.

---

# 839. Brow LOD

Em close-up, manter detalhe.

---

# 840. Brow Animation

Precisa funcionar com morphs faciais.

---

# 841. Brow Fit

Ao mudar face width/forehead, sobrancelha precisa seguir.

---

# 842. Brow Presets

Criar opções realmente distintas.

---

# 843. Hair/Brow/Beard Color System unificado

Criar um sistema de cor coerente:

```text
hairColor
browColor
beardColor
```

com possibilidade de:

```text
sync = true/false
```

---

# 844. UX recomendada

No topo da categoria:

```text
Cor principal
Sincronizar barba
Sincronizar sobrancelha
```

Depois cards de estilo.

---

# 845. Não esconder cor no fim do painel

Como já solicitado anteriormente, cor deve estar em posição mais acessível.

---

# 846. Color Presets

Apresentar swatches visuais.

---

# 847. Advanced Hair Color

Pode permitir:

- root;
- tip;
- secondary.

Somente quando asset suportar.

---

# 848. Hair Pattern Metadata

Exemplo:

```text
colorChannels: ['primary', 'secondary']
```

---

# 849. Não expor canal inexistente

UI precisa se adaptar ao asset.

---

# 850. Hair Thumbnails

Devem mostrar o corte claramente.

---

# 851. Câmera de thumbnail

Para cabelo:

- busto/rosto;
- leve ¾;
- fundo neutro.

---

# 852. Back Preview

Cabelos longos precisam permitir visualizar costas.

---

# 853. Hover Rotation

Pode ser útil.

Não precisa ser 3D interativo em todos os cards.

---

# 854. Preview rápido

Ao hover:

- aplicar temporariamente;
- manter câmera estável.

---

# 855. Não resetar zoom ao trocar cabelo

Isso prejudica comparação.

---

# 856. Hair Compare

Opcionalmente permitir comparação entre dois.

---

# 857. Search Tags

Cabelos podem ter tags:

```text
curto
longo
cacheado
afro
formal
casual
cyber
```

---

# 858. Raridade

Raridade pode existir em estilos especiais.

Mas cortes básicos de diversidade não devem ser artificialmente premium.

---

# 859. Hero Hair Assets

Alguns podem possuir:

- emissive;
- holographic strands;
- animated effects.

Mas o cabelo básico continua precisando ser bem feito.

---

# 860. VFX no cabelo

Evitar usar VFX para compensar asset pobre.

---

# 861. Hair Emissive

Somente em estilos especiais.

---

# 862. Shader consistency

Todos os cabelos premium devem compartilhar filosofia visual.

---

# 863. Não misturar cabelo semi-realista com bloco low-poly

Se legacy estiver coexistindo, classificar e evitar highlight promocional.

---

# 864. Classic 2D — cabelo

O modo clássico precisa de evolução equivalente em linguagem 2D.

---

# 865. 2D Hair Silhouette

Criar shapes mais ricos.

---

# 866. 2D Hair Layers

Separar:

```text
back hair
main volume
front fringe
highlights
strands
```

---

# 867. 2D Highlights

Usar highlights controlados para comunicar material.

---

# 868. 2D Shadow

Adicionar sombra do cabelo sobre:

- testa;
- face;
- pescoço.

Isso aumenta profundidade.

---

# 869. 2D Gradient

Evitar fill totalmente plano.

---

# 870. 2D Strands

Adicionar pequenos grupos de mechas.

Não desenhar cada fio.

---

# 871. 2D Hairline

Precisa integrar com testa.

---

# 872. 2D Beard

Barbas precisam possuir:

- volume;
- shape;
- shadow;
- contato.

---

# 873. 2D Stubble

Pode usar pattern/texture sutil.

---

# 874. 2D Brows

Mais riqueza de shape.

---

# 875. 2D Color Sync

Mesma lógica semântica do 3D.

---

# 876. Cross-renderer mapping

Um cabelo 2D e seu equivalente 3D podem compartilhar identidade lógica quando fizer sentido.

---

# 877. Não obrigar correspondência perfeita

O design pode ser adaptado artisticamente.

---

# 878. Hair Asset Pipeline

O pipeline 3D já possui validação de GLB, texturas, LOD e rig. 

Estender com regras específicas para cabelo:

- alpha;
- cards;
- bones;
- fit;
- material;
- preview;
- silhouette.

---

# 879. Hair Validator

Adicionar verificações possíveis:

- número de materiais;
- textures;
- alpha mode;
- draw calls estimados;
- bones;
- LOD;
- bounds.

---

# 880. Beard Validator

Mesma filosofia.

---

# 881. Hair Visual QA

Checklist:

- frontal;
- perfil;
- costas;
- ¾;
- close-up;
- backlight;
- hat;
- head morph;
- animation.

---

# 882. Beard Visual QA

Checklist:

- neutral;
- smile;
- mouth open;
- jaw morph;
- profile;
- ¾.

---

# 883. Brow Visual QA

Checklist:

- neutral;
- smile;
- angry;
- surprise;
- close-up.

---

# 884. Backlight Test obrigatório

Especialmente cabelos com cards.

---

# 885. Dark Hair Test

Cabelo preto em fundo escuro.

Verificar separação.

---

# 886. Blonde Hair Test

Verificar highlight sem estourar.

---

# 887. White/Grey Hair Test

Verificar exposição.

---

# 888. Fantasy Hair Test

Verificar emissive/bloom quando aplicável.

---

# 889. Transparency Test

Fundo claro e escuro.

---

# 890. Alpha fringe Hard Fail

Reprovar se houver bordas muito evidentes.

---

# 891. Hair Card Sorting Hard Fail

Reprovar se mechas somem ou cruzam visualmente de forma grave.

---

# 892. Clipping Hard Fail

Reprovar se cabelo premium atravessa:

- rosto;
- olhos;
- ombros;
- chapéu.

---

# 893. Beard Hard Fail

Reprovar se:

- flutua;
- entra na boca;
- descola da mandíbula.

---

# 894. Brow Hard Fail

Reprovar se:

- atravessa testa;
- perde alinhamento na expressão;
- fica flutuando.

---

# 895. Visual Score de cabelo

Sugestão:

```text
Silhouette         9/10
Volume             8/10
Material           8/10
Hairline           9/10
Close-up           9/10
Head fit           9/10
LOD continuity     9/10
Headwear fit       8/10
Animation          8/10
Performance        8/10
```

---

# 896. Visual Score de barba

```text
Fit                9/10
Silhouette         8/10
Material           8/10
Expression fit     9/10
Close-up           9/10
LOD                8/10
```

---

# 897. Golden Hair Gate

Não produzir dezenas de novos cabelos antes de aprovar o Golden Hair Set.

---

# 898. Escala depois do padrão

Depois da aprovação:

- triplicar quantidade atual;
- continuar expansão por famílias;
- priorizar diversidade real.

---

# 899. Hair Coverage Matrix

Criar matriz mínima de cobertura:

```text
short
medium
long
curly
afro
braid
bun
ponytail
buzz
fantasy
```

---

# 900. Beard Coverage Matrix

```text
stubble
short
full
goatee
mustache
long
styled
```

---

# 901. Brow Coverage Matrix

```text
thin
medium
thick
straight
arched
soft
defined
```

---

# 902. Catálogo não deve duplicar opções irrelevantes

10 cabelos quase iguais não equivalem a boa variedade.

---

# 903. Distinctiveness Score

Durante QA, avaliar se o novo asset é visualmente distinto dos existentes.

---

# 904. Similarity Check

Pode ser humano/visual ou futuro tooling.

Se dois assets forem quase iguais, questionar necessidade.

---

# 905. Coleções

Cabelos e barbas de coleções especiais podem compartilhar:

- shapes;
- materiais;
- detalhes;
- lore.

---

# 906. Cyber Hair

Pode ter:

- emissive;
- geometry hard-surface;
- fios luminosos.

---

# 907. Fantasy Hair

Pode ter:

- formas mais exageradas;
- partículas;
- cores especiais.

---

# 908. Royal Hair

Pode ser mais elegante e menos VFX.

---

# 909. Urban Hair

Mais próximo de estilos cotidianos.

---

# 910. Não transformar tudo em fantasia

A biblioteca precisa ter ampla base realista/estilizada cotidiana.

---

# 911. Hair Presets

Pode existir preset completo:

```text
cabelo
+
cor
+
sobrancelha
+
barba
```

---

# 912. Quick Style

Exemplo:

```text
Executivo
Casual
Street
Cyber
```

---

# 913. Preset não substitui escolha individual

Sempre editável.

---

# 914. Photo Studio — cabelo

No modo foto:

- permitir head turn;
- aproveitar luz de recorte;
- garantir LOD0;
- melhor AA.

---

# 915. Hair Focus Mode

Ao editar cabelo:

- câmera busto/rosto;
- rotação habilitada;
- luz neutra.

---

# 916. Beard Focus Mode

Câmera mais próxima.

---

# 917. Brow Focus Mode

Câmera facial.

---

# 918. Motion freeze opcional

Durante customização fina, permitir reduzir idle para facilitar comparação.

---

# 919. Resume motion

Ao sair da edição, avatar volta a ficar vivo.

---

# 920. Loading state

Ao trocar cabelo, evitar:

- cabeça careca piscando;
- asset aparecendo na origem;
- material cinza temporário.

---

# 921. Prefetch

Hover pode pré-carregar hair GLB/thumb.

---

# 922. Cache

Cabelos recentemente usados podem permanecer cacheados.

---

# 923. Performance profiling

Medir:

- load time;
- draw calls;
- triangles;
- texture memory;
- FPS.

---

# 924. Hair worst-case test

Criar um cenário pesado:

```text
long hair
+
beard
+
hat
+
back accessory
+
particles
```

para medir performance e clipping.

---

# 925. Não otimizar só o cabelo isolado

A aplicação precisa funcionar na combinação real.

---

# 926. LOD transition test

Aproximar/afastar continuamente.

Não aceitar pop visível de cabelo.

---

# 927. Head turn test

Girar cabeça.

---

# 928. Full turn test

Girar personagem 360°.

---

# 929. Hair backside quality

Cabelos longos precisam ser tão bons atrás quanto na frente.

---

# 930. Não modelar só “para thumbnail”

O asset será visto em 3D.

---

# 931. Hair Source Quality

Se utilizar packs externos, não publicar diretamente.

Passar por:

```text
source
→ curation
→ cleanup
→ material
→ fit
→ LOD
→ QA
```

---

# 932. Dshow customization

Mesmo bases CC0 devem receber adaptação suficiente para pertencer ao universo Dshow.

---

# 933. Licença

Preservar metadados de licença e origem como já ocorre no pipeline atual. 

---

# 934. Não misturar licença no asset final sem rastreamento

O manifest deve continuar sendo fonte confiável.

---

# 935. Asset Naming

Padronizar IDs.

Exemplo conceitual:

```text
hair_short_clean_01
hair_afro_01
beard_full_01
brow_arch_02
```

Sem depender de nomes de marketing.

---

# 936. Marketing Name separado

Pode ser:

```text
"Corte Meridian"
```

enquanto ID técnico permanece estável.

---

# 937. Versioning

Um upgrade visual mantém ID quando identidade for a mesma.

---

# 938. Successor mapping

Se o novo cabelo mudar radicalmente, criar novo asset.

---

# 939. Legacy Hair

Manter disponível se necessário, mas fora do destaque.

---

# 940. Legacy badge interno

Não necessariamente visível ao usuário.

---

# 941. First impression

O avatar padrão deve usar cabelo Q3/Q4.

---

# 942. Default beard

Se avatar padrão tiver barba, também Q3/Q4.

---

# 943. No facial hair default também precisa funcionar

A cabeça não pode depender de barba para parecer boa.

---

# 944. Golden Hair Before/After

Criar comparações padronizadas.

---

# 945. Golden Beard Before/After

Mesma lógica.

---

# 946. Art Bible

Documentar:

- silhouette;
- strand density;
- highlight;
- color;
- transparency;
- physics;
- headwear fit.

---

# 947. Anti-patterns de cabelo

Documentar:

```text
❌ capacete plástico
❌ massa sem direção
❌ transparência serrilhada
❌ cards grossos
❌ hairline flutuante
❌ glow excessivo
❌ 10 variações iguais só por cor
❌ clipping com chapéu
```

---

# 948. Anti-patterns de barba

```text
❌ barba adesivo
❌ barba flutuante
❌ bigode entrando na boca
❌ volume sem contato
❌ mesma barba apenas escalada
```

---

# 949. Definition of Done desta Parte 4

A Parte 4 só poderá ser considerada concluída quando existirem:

1. auditoria dos cabelos atuais;
2. classificação `KEEP / UPGRADE / REPLACE / DEV_ONLY`;
3. Golden Hair Set;
4. Golden Beard Set;
5. sistema de brows premium;
6. hair material family;
7. color system;
8. head fit;
9. hairline QA;
10. LOD;
11. headwear compatibility;
12. secondary motion quando aplicável;
13. transparency QA;
14. backlight QA;
15. 2D premium equivalent;
16. thumbnails/previews novos;
17. performance benchmark;
18. Before/After;
19. atualização da Art Bible;
20. estratégia de escala.

---

# 950. Gate final da Parte 4

A produção massiva de novos cabelos só poderá começar quando:

```text
GOLDEN HAIR SET aprovado
+
HEADWEAR FIT aprovado
+
CLOSE-UP aprovado
+
LOD aprovado
+
HAIR MATERIAL aprovado
```

---

# 951. Resultado esperado

Ao finalizar esta parte, cabelo, barba e sobrancelha não poderão mais parecer acessórios colocados sobre o avatar.

Eles precisam parecer:

> **partes naturais da identidade do personagem.**

A percepção desejada é que trocar cabelo ou barba altere de forma significativa:

- personalidade;
- silhueta;
- estilo;
- qualidade percebida;

sem quebrar:

- rosto;
- headwear;
- animação;
- performance;
- consistência artística.

---

## FIM DA PARTE 4/12

**Próxima: PARTE 5/12 — ROUPAS, CALÇAS, CAMISETAS, JAQUETAS, CALÇADOS, CAMADAS, TECIDOS, MATERIAIS, DEFORMAÇÃO, FIT CORPORAL, CORES INDEPENDENTES E SISTEMA DE OUTFITS PREMIUM.**





# MEGA BRIEFING — ELEVAÇÃO GRÁFICA AAA DO AVATAR STUDIO DSHOW  
## PARTE 5/12 — ROUPAS, CALÇAS, CAMISETAS, JAQUETAS, CALÇADOS, CAMADAS, TECIDOS, MATERIAIS, DEFORMAÇÃO, FIT CORPORAL, CORES INDEPENDENTES E SISTEMA DE OUTFITS PREMIUM

# 952. Objetivo da Parte 5

Esta parte deverá elevar radicalmente o vestuário do Avatar Studio.

Hoje, em vários pontos, a roupa ainda corre o risco de parecer:

- pintura sobre o corpo;
- shell simples;
- variação de cor;
- geometria genérica;
- peça sem espessura;
- asset modular tecnicamente correto, mas visualmente pouco convincente;
- roupa sem tecido;
- roupa sem peso;
- roupa sem caimento;
- roupa sem costura;
- roupa sem identidade material.

A meta é transformar o vestuário em um sistema visual que transmita:

- volume;
- tecido;
- construção;
- caimento;
- espessura;
- costura;
- materialidade;
- personalidade;
- compatibilidade corporal;
- modularidade;
- diversidade;
- qualidade em movimento;
- qualidade em diferentes LODs.

---

# 953. Princípio central: roupa não é apenas cor sobre geometria

Toda peça deverá comunicar três coisas:

```text
FORMA
+
MATERIAL
+
CONSTRUÇÃO
```

Por exemplo:

Uma camiseta precisa parecer camiseta não apenas porque tem gola.

Ela deve comunicar:

- tecido fino;
- caimento;
- costura;
- manga;
- volume;
- contato com o corpo.

---

# 954. Separar categoria, corte e material

O sistema deverá distinguir:

```text
CATEGORY
t-shirt

CUT
slim / regular / oversized

MATERIAL
cotton / technical / jersey
```

Essas três dimensões podem gerar muita diversidade sem duplicar desnecessariamente assets.

---

# 955. Clothing Families

Organizar o catálogo em famílias.

Exemplo:

```text
TOPS
- t-shirts
- shirts
- polos
- hoodies
- sweaters
- jackets
- coats
- blazers
- armor
- uniforms

BOTTOMS
- jeans
- chinos
- formal pants
- joggers
- shorts
- skirts
- tactical
- fantasy

FOOTWEAR
- sneakers
- formal shoes
- boots
- tactical
- sports
- fantasy
```

---

# 956. Outfit completo vs peças independentes

O usuário precisa poder trabalhar em dois níveis:

```text
OUTFIT PRESET
```

e

```text
INDIVIDUAL PIECES
```

Exemplo:

```text
Preset: Executivo Premium
→ camisa
→ blazer
→ calça
→ sapato
```

Depois o usuário pode trocar apenas o sapato.

---

# 957. Outfit Presets

Os presets deverão ser curados visualmente.

Categorias iniciais:

```text
Executivo
Casual
Street
Tech
Sport
Adventure
Cyber
Fantasy
Formal
Dshow
```

---

# 958. Preset não deve bloquear personalização

Cada peça precisa continuar editável individualmente.

---

# 959. Estrutura de slots recomendada

Preparar ou consolidar slots como:

```text
upper_base
upper_outer
lower
footwear
gloves
belt
shoulder
cape
```

Não necessariamente usar exatamente esses nomes se a arquitetura atual já tiver contratos equivalentes.

---

# 960. Layering

Precisamos formalizar sobreposição.

Exemplo:

```text
BODY
↓
UNDERSHIRT
↓
SHIRT
↓
JACKET
↓
ACCESSORY
```

Isso é fundamental para evitar clipping.

---

# 961. Layer Compatibility

Cada peça precisa indicar se pode coexistir com outras.

Exemplo:

```text
shirt + blazer = true
hoodie + armor = maybe false
```

---

# 962. Layer Thickness

Peças externas precisam considerar espessura da peça interna.

Não simplesmente ocupar a mesma superfície.

---

# 963. Under-layer compression

Quando um blazer está equipado, a camisa interna pode precisar de uma variante levemente ajustada.

---

# 964. Não empilhar shells idênticos

Hard Fail se:

- camisa atravessa blazer;
- hoodie aparece por cima de jaqueta;
- gola desaparece incorretamente.

---

# 965. Body Masking

Como estabelecido na Parte 2, usar máscaras corporais quando apropriado.

Exemplo:

Jaqueta fechada pode ocultar torso corporal interno.

Isso reduz:

- clipping;
- overdraw.

---

# 966. Clothing Masking

Peças externas também podem ocultar regiões de peças internas.

Exemplo:

```text
jacket
hides:
- shirt_sleeve_upper
- shirt_torso_side
```

---

# 967. Region-based clothing

O agente deverá preferir regras semânticas.

Exemplo:

```text
torso
upper_arm
lower_arm
waist
upper_leg
lower_leg
foot
```

---

# 968. Fit corporal

Roupas precisam acompanhar morphs.

Não apenas scaling uniforme.

---

# 969. Shared Skeleton

Quando possível, aproveitar o mesmo rig UBC para corpo e roupas.

A auditoria mostrou que essa compatibilidade já é uma das forças da arquitetura. 

Preservar isso.

---

# 970. Clothing Morph Support

Peças premium devem responder a:

- weight;
- muscle;
- shoulder width;
- waist;
- hips.

---

# 971. Morph Bake vs Runtime

O agente deverá avaliar:

- morph targets correspondentes;
- skinning;
- variantes pré-processadas.

Não recalcular malha pesada no navegador.

---

# 972. Fit Envelope

Cada peça precisa possuir range homologado.

Exemplo conceitual:

```text
bodyWeight -0.6 → +0.7
muscle 0 → +0.8
```

---

# 973. Clothing Compatibility Metadata

Adicionar algo equivalente a:

```text
bodyFamilies
morphEnvelope
layer
coverage
hideRegions
```

---

# 974. Universal pieces

Priorizar peças que funcionem em múltiplas body families.

---

# 975. Family-specific pieces

Quando necessário, permitir.

---

# 976. Body-specific hero pieces

Pode haver alguns assets especiais mais específicos.

Mas não devem dominar o catálogo.

---

# 977. T-shirt Quality Bar

Uma camiseta premium deve possuir:

- gola;
- manga;
- espessura;
- caimento;
- dobra principal;
- costura;
- sombra de contato.

---

# 978. Shirt Quality Bar

Camisa social:

- gola estruturada;
- abertura;
- botões;
- punho;
- costura;
- tecido;
- lapela de botão.

---

# 979. Hoodie Quality Bar

Hoodie:

- capuz;
- cordões;
- punho;
- bolso;
- espessura;
- dobra;
- peso.

---

# 980. Jacket Quality Bar

Jaqueta:

- volume externo;
- zíper;
- gola;
- costura;
- materiais diferentes;
- ombro;
- mangas.

---

# 981. Blazer Quality Bar

Blazer:

- lapela;
- ombros estruturados;
- botões;
- caimento;
- tecido;
- abertura.

---

# 982. Coat Quality Bar

Casaco:

- comprimento;
- volume;
- movimento;
- lapela;
- espessura;
- secondary motion quando aplicável.

---

# 983. Armor Quality Bar

Armadura:

- placas;
- espessura;
- encaixe;
- metal;
- material;
- juntas;
- não parecer caixa.

---

# 984. Pants

Calças precisam de:

- cintura;
- gancho;
- joelho;
- volume;
- barra;
- tecido.

---

# 985. Jeans

Jeans precisa comunicar denim, não apenas azul.

---

# 986. Formal pants

Tecido mais limpo, melhor drape.

---

# 987. Joggers

Punho, elasticidade, volume.

---

# 988. Shorts

Precisam funcionar bem com joelho/perna.

---

# 989. Footwear

Calçados são importantes para silhouette.

Precisamos de:

- sola;
- volume;
- toe shape;
- heel;
- material.

---

# 990. Sneakers

Não representar como bloco genérico.

---

# 991. Formal shoes

Precisa ter leitura de couro/polimento.

---

# 992. Boots

Volume maior e integração com calça.

---

# 993. Tuck System

Preparar para:

```text
shirt tucked
shirt untucked
```

quando tecnicamente relevante.

---

# 994. Pants/Boot interaction

Calça pode:

- entrar na bota;
- cobrir a bota.

Precisa de regra.

---

# 995. Sleeve Length

Algumas peças podem suportar:

- curta;
- longa;
- dobrada.

Não precisa tudo ser morph.

Podem ser variantes.

---

# 996. Collar System

Golas influenciam muito o visual facial.

Testar com:

- barba;
- cabelo longo;
- colares.

---

# 997. High Collar

Precisa evitar clipping com queixo/barba.

---

# 998. Capuz

Precisa integrar com cabelo.

Como tratado na Parte 4.

---

# 999. Material System

Esta é uma das maiores oportunidades de salto visual.

A roupa precisa comunicar material.

---

# 1000. Material Families

Criar famílias:

```text
cotton
jersey
denim
wool
knit
leather
satin
silk_like
technical_fabric
rubber
plastic
metal
armor_composite
```

---

# 1001. Cotton

Características:

- roughness alta;
- specular baixo;
- normal sutil;
- textura fina.

---

# 1002. Technical fabric

- roughness média;
- weave;
- highlights mais definidos.

---

# 1003. Denim

- textura;
- normal;
- roughness;
- variação.

---

# 1004. Leather

- specular;
- roughness média;
- variação;
- pequenas imperfeições.

---

# 1005. Satin

- highlights mais fortes;
- anisotropy se viável.

---

# 1006. Knit

- normal/height perceptível;
- material mais fosco.

---

# 1007. Metal

Somente componentes realmente metálicos.

Não transformar toda roupa em metal via slider.

---

# 1008. Material Slots internos

Uma jaqueta pode conter:

```text
fabric
zipper
buttons
lining
accent
```

---

# 1009. Multi-material support

O sistema precisa permitir múltiplos materiais por asset.

---

# 1010. Mas limitar draw calls

Não criar 15 materiais por camiseta.

---

# 1011. Material Atlas

Quando apropriado, usar atlas.

---

# 1012. Shared Materials

Reutilizar famílias.

---

# 1013. Custom colors

O usuário pode alterar cor sem destruir comportamento físico.

---

# 1014. Color Channels

Peças premium podem possuir:

```text
primary
secondary
accent
detail
```

---

# 1015. Não obrigar quatro canais em toda peça

UI adaptativa.

---

# 1016. Exemplo de camiseta

```text
primary = tecido
accent = logo/faixa
```

---

# 1017. Exemplo de jaqueta

```text
primary = corpo
secondary = mangas
accent = zipper/details
```

---

# 1018. Exemplo de tênis

```text
primary
secondary
sole
accent
```

---

# 1019. Color UI

Apresentar canais visualmente.

Exemplo:

```text
Principal
Secundária
Detalhes
```

---

# 1020. Material UI simplificada

Usuário pode selecionar:

```text
Algodão
Couro
Cetim
Técnico
Metal
```

quando o asset suporta.

---

# 1021. Material compatibility

Não permitir:

```text
T-shirt → metal polido
```

a menos que seja uma peça fantasy deliberada.

---

# 1022. Material presets por asset

Cada asset deve definir materiais compatíveis.

---

# 1023. Base material fixo + color

Para peças comuns, talvez o material seja fixo e apenas cor varie.

---

# 1024. Advanced Material Editor

Pode existir em modo avançado.

Mas não transformar o usuário em técnico.

---

# 1025. Roughness

Continuará sendo fundamental.

---

# 1026. Normal Map

Para tecidos:

- weave;
- seam;
- detalhes pequenos.

---

# 1027. AO

Pode reforçar:

- costuras;
- dobras;
- bolsos.

---

# 1028. Não bakear sombra de iluminação pesada

Textura não deve conter luz direcional incompatível com o renderer.

---

# 1029. Base Color

Preferir albedo neutro.

---

# 1030. Stitching

Costuras podem ser:

- geometry;
- normal;
- texture.

Dependendo da proximidade.

---

# 1031. Buttons

Podem ser geometry em peças premium.

---

# 1032. Zippers

Geometry ou normal dependendo do tamanho.

---

# 1033. Embroidery

Pode ser normal + color.

---

# 1034. Logos

Sistema deve suportar logos sem duplicar asset inteiro.

---

# 1035. Dshow branding

Peças Dshow podem usar:

- logo;
- padrões;
- cor;
- detalhes.

Mas de forma sofisticada.

---

# 1036. Não transformar tudo em merchandising

A marca deve aparecer em coleção específica, não em toda roupa.

---

# 1037. Decals

Preparar sistema para:

- logo;
- patch;
- número;
- badge.

---

# 1038. Texture Decals

Podem ser mais eficientes que assets únicos.

---

# 1039. Customization futura

Isso pode permitir:

- nome;
- número;
- departamento.

Em contexto corporativo.

---

# 1040. Não implementar personalização textual pesada agora se não estiver no escopo

Mas preparar.

---

# 1041. Pattern System

Roupas podem ter padrões:

```text
solid
stripe
plaid
camouflage
graphic
```

---

# 1042. Padrão ≠ asset novo obrigatório

Pode ser parâmetro/material.

---

# 1043. Pattern scale

Permitir tamanho quando fizer sentido.

---

# 1044. Pattern rotation

Provavelmente só modo avançado.

---

# 1045. Pattern masks

O asset precisa definir regiões onde padrão aplica.

---

# 1046. UV quality

Roupas precisam de UV adequado para pattern.

---

# 1047. Texel Density

Padronizar entre peças.

---

# 1048. Texture Stretching

Hard Fail se padrão esticar em:

- ombro;
- joelho;
- quadril.

---

# 1049. Fabric Direction

Alguns tecidos possuem direção.

UV deve respeitar.

---

# 1050. Drape

O tecido precisa parecer responder ao corpo.

Mesmo sem simulação em tempo real.

---

# 1051. Fold hierarchy

Dobras principais:

- modelagem;
- normal.

Microdobras:

- normal.

---

# 1052. Não poluir roupa com dobras aleatórias

Estilo premium depende de controle.

---

# 1053. Fold by pose

Roupas não precisam atualizar microdobras dinamicamente no primeiro estágio.

Mas precisam deformar sem parecer rígidas.

---

# 1054. Corrective clothing morphs

Pode ser necessário em:

- ombro;
- cotovelo;
- quadril;
- joelho.

---

# 1055. Cloth Simulation

Pode ser útil para:

- capas;
- casacos longos;
- saias;
- tecido solto.

Não obrigatório para camiseta.

---

# 1056. Secondary motion

Capa e casaco longo podem usar bones/physics simples.

---

# 1057. Physics quality tier

Reduzir em dispositivos fracos.

---

# 1058. Capes

Precisam evitar:

- corpo;
- pernas;
- acessórios de costas.

---

# 1059. Cape Socket

Se houver, tratar como layer/back attachment.

---

# 1060. Shoulder Pieces

O sistema já prevê região de ombros no 3D. 

Ombreiras devem se integrar com roupa.

---

# 1061. Shoulder armor

Não pode flutuar.

---

# 1062. Gloves

Luvas precisam acompanhar mãos.

---

# 1063. Glove Fit

Testar:

- finger pose;
- grip;
- hand morph se existir.

---

# 1064. Wrist devices

Precisam coexistir com manga.

---

# 1065. Sleeve masking

Manga pode ocultar pulseira, dependendo da peça.

---

# 1066. Belt

Cinto precisa acompanhar waist morph.

---

# 1067. Layer collision rules

Formalizar conflitos.

---

# 1068. Visual Compatibility Matrix

Testar:

```text
shirt × blazer
hoodie × jacket
pants × boots
long coat × backpack
cape × wings
gloves × wrist accessories
```

---

# 1069. Outfit compatibility engine

Não depender só de tentativa visual.

---

# 1070. Categories with exclusivity

Alguns slots são naturalmente exclusivos.

Exemplo:

```text
footwear = 1
lower = 1
```

---

# 1071. Stackable categories

Outras podem coexistir.

---

# 1072. Overpiece

A arquitetura 2D já possui conceito de `roupa_sobre`. Esse padrão mostra que o projeto já reconhece a necessidade de sobreposição, e a evolução 3D deve preservar a mesma lógica conceitual quando apropriado. 

---

# 1073. Classic mode — roupa

O clássico também precisa abandonar a aparência de peça plana.

---

# 1074. 2D Clothing Volume

Usar:

- gradiente;
- highlight;
- shadow;
- shape;
- folds;
- collars.

---

# 1075. 2D Layering

Separar:

```text
base shirt
outerwear
accessory
```

---

# 1076. 2D Whole-body

A auditoria mostrou que o modo clássico já possui `renderCorpo` para detalhes de roupa no corpo inteiro. 

A nova arte deverá explorar isso muito melhor.

---

# 1077. Problema atual do 2D

Hoje, em várias peças, `renderCorpo` adiciona apenas alguns detalhes sobre um scaffold corporal comum. 

Isso explica por que muitas roupas podem mudar menos do que o esperado visualmente.

---

# 1078. Nova regra 2D

Uma roupa premium de corpo inteiro deverá poder alterar:

- silhouette;
- ombros;
- mangas;
- cintura;
- comprimento;
- pernas quando aplicável.

Não apenas adicionar gola/linha.

---

# 1079. 2D Clothing Silhouette

Especialmente:

- blazer;
- casaco;
- armadura;
- hoodie.

---

# 1080. 2D Fabric cues

Criar:

- knit;
- leather shine;
- denim;
- fabric shadow.

---

# 1081. 2D Pattern

Usar patterns vetoriais/texturas leves quando necessário.

---

# 1082. 2D Material Tokens

Assim como no 3D, criar famílias.

---

# 1083. Cross-renderer semantic identity

O mesmo asset pode possuir:

```text
renderer2d
renderer3d
```

dentro do mesmo conceito lógico.

---

# 1084. Não forçar mesma geometria

A arte 2D pode reinterpretar.

---

# 1085. Outfit preview

Cards de outfit devem mostrar corpo inteiro.

---

# 1086. Individual clothing cards

Preview deve destacar a peça.

---

# 1087. Camera auto-focus

Ao editar:

- upper body → busto/¾;
- pants → full body;
- shoes → lower body;
- outfit → full body.

---

# 1088. Não resetar câmera agressivamente

Transição suave.

---

# 1089. Shoe focus

Câmera pode aproximar pés.

---

# 1090. Material preview

Ao mudar tecido, a iluminação precisa permitir perceber diferença.

---

# 1091. Material swatches

Cards pequenos podem mostrar esfera/amostra.

---

# 1092. Outfit before/after

Permitir comparar.

---

# 1093. Favorite outfits

Importante.

---

# 1094. Save look

Usuário poderá salvar combinação.

---

# 1095. Outfit presets versionados

Preservar estabilidade.

---

# 1096. Default Outfit

O personagem padrão deve usar outfit premium.

---

# 1097. Golden Outfit Set

Criar conjunto inicial.

Sugestão:

```text
O01 Executive
O02 Casual
O03 Urban
O04 Sport
O05 Adventure
O06 Cyber
```

---

# 1098. Golden Outfit precisa incluir masculino e feminino

Não criar tudo para uma única base.

---

# 1099. Golden material coverage

Cobrir:

- cotton;
- leather;
- technical;
- formal fabric;
- metal.

---

# 1100. Dark clothing test

Roupa preta precisa manter detalhes.

---

# 1101. White clothing test

Roupa branca não pode estourar.

---

# 1102. Saturated color test

Roxo/azul/vermelho precisam manter material.

---

# 1103. Metallic test

Metal não pode parecer plástico pintado.

---

# 1104. Fabric close-up

No modo foto, tecido precisa manter qualidade.

---

# 1105. Stitch close-up

Costura não precisa ser hiper-realista, mas precisa existir onde relevante.

---

# 1106. Shoe close-up

Photo Studio pode mostrar corpo inteiro e pés.

---

# 1107. Clothing LOD

LOD0:
- silhouette;
- details;
- buttons;
- stitching relevante.

LOD1:
- reduzir microdetalhes.

LOD2:
- preservar shape.

---

# 1108. Armor LOD

Preservar placas principais.

---

# 1109. Jacket LOD

Preservar lapela/gola.

---

# 1110. T-shirt LOD

Pode reduzir bastante sem mudar silhouette.

---

# 1111. Shoes LOD

Preservar sola e toe shape.

---

# 1112. LOD texture budgets

A documentação já trabalha com 2048/1024/512 como teto por LOD no pipeline atual. 

Preservar essa filosofia, ajustando por categoria quando necessário.

---

# 1113. Não usar 2K para tudo

Uma pulseira pequena não precisa do mesmo orçamento que torso.

---

# 1114. Texture Atlas por conjunto

Pode reduzir draw calls.

---

# 1115. LOD transition

Não deixar:

- botão desaparecer abruptamente;
- gola mudar;
- jaqueta encolher.

---

# 1116. Clothing load strategy

Carregar peça selecionada rapidamente.

---

# 1117. Prefetch hover

Pode ser útil.

---

# 1118. Cache

Peças recentes.

---

# 1119. Progressive loading

LOD baixo primeiro se necessário.

---

# 1120. Não piscar corpo nu

Ao trocar roupa, manter peça anterior até nova estar pronta, ou usar transição.

---

# 1121. Equip transition

Pode usar fade curto ou materialization sutil.

---

# 1122. Não exagerar animação ao trocar camiseta

Motion deve ser rápido.

---

# 1123. Outfit equip

Pode ter transição um pouco mais rica.

---

# 1124. Clothing QA — Static

Testar:

- front;
- side;
- back;
- ¾.

---

# 1125. Clothing QA — Animation

Testar:

- idle;
- wave;
- walk;
- hero;
- arms up.

---

# 1126. Clothing QA — Morphs

Testar body presets.

---

# 1127. Clothing QA — Layering

Testar combinações.

---

# 1128. Clothing QA — Material

Testar sob diferentes lights.

---

# 1129. Clothing QA — LOD

Comparar.

---

# 1130. Clothing QA — Performance

Medir:

- triangles;
- draw calls;
- texture memory;
- material count.

---

# 1131. Hard Fail de roupa

Reprovar se houver:

- clipping evidente;
- manga colapsada;
- body atravessando;
- gola flutuando;
- textura esticada;
- material incoerente;
- outfit mudando silhouette entre LODs;
- peça desaparecendo em animação;
- corpo ficando visível onde deveria estar coberto.

---

# 1132. Hard Fail de calçado

- pé atravessa;
- sapato flutua;
- sola dentro do chão;
- tornozelo quebrado.

---

# 1133. Soft Fail

Pode incluir:

- micro clipping em pose extrema;
- perda de stitching em LOD2;
- shadow variation pequena.

---

# 1134. Visual Score

Sugestão:

```text
Silhouette        9/10
Fit               9/10
Material          9/10
Deformation       9/10
Layering          9/10
Texture           8/10
LOD continuity    9/10
Close-up          8/10
Performance       8/10
```

---

# 1135. Distinctiveness

As roupas precisam ser visualmente distintas.

---

# 1136. Não criar 20 camisetas praticamente iguais

Usar:

- cor;
- pattern;
- decal;

para variantes leves.

Criar asset novo quando:

- corte;
- silhouette;
- construção;

mudarem.

---

# 1137. Clothing SKU logic

Separar:

```text
BASE GARMENT
+
VARIANT
```

---

# 1138. Exemplo

```text
shirt_basic
```

com variantes:

```text
solid
stripe
dshow
```

---

# 1139. Não duplicar GLB sem necessidade

---

# 1140. Material-driven variants

Preferir parâmetros.

---

# 1141. Collection-driven variants

Pode haver design específico.

---

# 1142. Rarity

Raridade pode representar:

- complexidade;
- exclusividade;
- material;
- effects.

Não qualidade mínima.

---

# 1143. Basic clothing deve ser excelente

Mesmo camiseta comum precisa ser Q2+.

---

# 1144. Legendary clothing

Pode possuir:

- materiais especiais;
- emissive;
- secondary motion;
- detail.

---

# 1145. Não tornar lendário um carnaval visual

Controle.

---

# 1146. Cyber clothing

Pode usar emissive limitado.

---

# 1147. Executive clothing

Precisa mostrar sofisticação via material e corte, não partículas.

---

# 1148. Sport clothing

Pode usar tecido técnico.

---

# 1149. Adventure clothing

Camadas e acessórios funcionais.

---

# 1150. Fantasy clothing

Shapes mais livres.

---

# 1151. Dshow Originals

Coleção Dshow deve ter identidade própria.

---

# 1152. Branding sofisticado

Usar:

- pixel;
- LED;
- roxo;
- ouro;

de forma curada.

---

# 1153. Visual DNA por outfit

Exemplo:

```text
Executive
shape = clean
material = tailored
contrast = moderate
accent = gold
```

---

# 1154. CMS/Art Pipeline

Cada peça precisa entrar com:

- category;
- layer;
- body compatibility;
- materials;
- color channels;
- LOD;
- thumbnail;
- preview;
- license;
- QA.

---

# 1155. Clothing manifest

Não espalhar dados em código.

---

# 1156. Texture provenance

Rastrear.

---

# 1157. Version

Rastrear.

---

# 1158. Successor mapping

Legacy → premium quando apropriado.

---

# 1159. Upgrade sem quebrar saves

Se o conceito for o mesmo, manter ID quando seguro.

---

# 1160. Visual status

Usar:

```text
prototype
legacy
production
premium
hero
```

---

# 1161. Legacy clothes

Podem continuar disponíveis.

Mas não dominar onboarding.

---

# 1162. New default wardrobe

Selecionar peças Q3/Q4.

---

# 1163. Golden Outfit Benchmark

Gerar screenshots padronizados.

---

# 1164. Before/After

Mesma:

- body;
- pose;
- camera;
- light.

---

# 1165. Cloth deformation screenshot

Capturar pose difícil.

---

# 1166. Material comparison

Renderizar mesma peça com materiais permitidos.

---

# 1167. Dark/light skin compatibility

Roupa deve funcionar visualmente em diferentes tons de pele.

---

# 1168. Hair compatibility

Golas/capuzes precisam funcionar com cabelo.

---

# 1169. Beard compatibility

Golas altas.

---

# 1170. Accessory compatibility

Colares/cintos/mochilas.

---

# 1171. Outfit randomization

Random deve respeitar:

- layers;
- compatibility;
- theme.

---

# 1172. Smart Random

Evitar combinações absurdas.

---

# 1173. Theme coherence

Se random “Executivo”:

- escolher peças compatíveis.

---

# 1174. Color harmony

Pode usar sugestões automáticas.

---

# 1175. Mas permitir quebra manual

Usuário pode experimentar.

---

# 1176. Advanced Outfit Editor

Pode permitir:

- material;
- channels;
- pattern.

---

# 1177. Simple Mode

Cards + cores principais.

---

# 1178. UX responsiva

Não sobrecarregar painel.

---

# 1179. Equip states

Distinguir:

- preview;
- selected;
- equipped.

---

# 1180. Undo/redo

Toda troca de peça.

---

# 1181. Outfit snapshot

Salvar conjunto.

---

# 1182. Photo Studio outfit control

Permitir:

- material;
- pose;
- drape;
- lighting.

---

# 1183. Capture quality

Forçar LOD alto.

---

# 1184. Fabric highlight calibration

Photo Studio precisa mostrar material.

---

# 1185. Full-body portrait

Outfit precisa ser protagonista quando câmera está aberta.

---

# 1186. Close-up torso

Precisa mostrar detalhes.

---

# 1187. Lower-body focus

Calças.

---

# 1188. Shoe focus

Calçados.

---

# 1189. Outfit composition

Câmera pode variar conforme roupa.

---

# 1190. Não cortar casaco longo

Auto-framing deve considerar bounds.

---

# 1191. Cape framing

Mesma lógica.

---

# 1192. Outlier bounds

Assets com volume grande precisam comunicar ao camera manager.

---

# 1193. Accessory-aware framing

Será aprofundado na próxima parte.

---

# 1194. Performance worst case

Testar:

```text
long coat
+
layered shirt
+
pants
+
boots
+
gloves
+
back accessory
+
long hair
```

---

# 1195. Memory budget

Documentar.

---

# 1196. Draw call budget

Documentar.

---

# 1197. Material count budget

Documentar.

---

# 1198. Triangle budget

Documentar.

---

# 1199. Texture budget

Documentar.

---

# 1200. Budgets devem ser por contexto

Uma Hero Armor pode usar mais que camiseta.

---

# 1201. Não criar limite cego

Visual quality continua prioridade dentro do budget.

---

# 1202. Quality Tier degradation

Em econômico:

- reduzir fabric microdetail;
- shadow;
- normal detail;
- secondary motion.

Não mudar outfit.

---

# 1203. Standard

Qualidade plena normal.

---

# 1204. Ultra

LOD0 + melhores sombras + materiais.

---

# 1205. Cloth Physics Ultra

Pode ser mais rica.

---

# 1206. Cloth Physics Economico

Pode desligar.

---

# 1207. Documentation

Atualizar Art Bible com:

- cuts;
- materials;
- folds;
- stitches;
- layers;
- fit;
- color channels.

---

# 1208. Anti-patterns

Documentar:

```text
❌ roupa pintada no corpo
❌ jaqueta sem espessura
❌ tecido com material plástico
❌ mesma camiseta repetida por cor como asset novo
❌ clipping com corpo
❌ gola flutuante
❌ botões enormes
❌ textura esticada
❌ metal em toda peça
❌ roughness única para tudo
```

---

# 1209. Golden Outfit Gate

Não escalar produção antes de aprovar:

```text
Executive
+
Casual
+
Urban
+
Sport
+
Cyber
```

em pelo menos duas body families relevantes.

---

# 1210. Critério de aceite — Fit

Nenhuma peça Golden pode apresentar clipping evidente em poses públicas.

---

# 1211. Critério — Material

As diferenças de tecido precisam ser perceptíveis mesmo sem trocar cor.

---

# 1212. Critério — Layers

Camisa + jaqueta devem funcionar corretamente.

---

# 1213. Critério — Morph

Body presets homologados devem funcionar.

---

# 1214. Critério — Animation

Idle/wave/walk precisam funcionar.

---

# 1215. Critério — LOD

Silhouette preservada.

---

# 1216. Critério — Close-up

Peça não pode revelar acabamento pobre no Photo Studio.

---

# 1217. Critério — 2D

O modo clássico precisa possuir pelo menos uma nova geração equivalente que altere silhouette e materialidade de forma perceptível.

---

# 1218. Deliverables obrigatórios da Parte 5

O agente deverá entregar:

1. auditoria do vestuário atual;
2. classificação `KEEP / UPGRADE / REPLACE / DEV_ONLY`;
3. Clothing Families;
4. slot/layer model;
5. compatibility rules;
6. material families;
7. color-channel system;
8. body/morph fit;
9. body masking;
10. layering masking;
11. Golden Outfit Set;
12. Golden Footwear Set;
13. LOD strategy;
14. texture budgets;
15. material budgets;
16. deformation QA;
17. animation QA;
18. 2D clothing upgrade;
19. thumbnails/previews;
20. Before/After;
21. documentação na Art Bible;
22. plano de escala.

---

# 1219. Ordem recomendada

```text
AUDIT CLOTHING
↓
LAYER MODEL
↓
FIT / BODY MASK
↓
MATERIAL FAMILIES
↓
GOLDEN GARMENTS
↓
PANTS / FOOTWEAR
↓
OUTFIT PRESETS
↓
ANIMATION QA
↓
LOD
↓
CLASSIC 2D
↓
VISUAL QA
```

---

# 1220. Gate final

A produção em massa só poderá começar quando:

```text
GOLDEN OUTFITS aprovados
+
FIT aprovado
+
MATERIAL SYSTEM aprovado
+
LAYERING aprovado
+
LOD aprovado
+
CLASSIC EQUIVALENT aprovado
```

---

# 1221. Resultado esperado da Parte 5

Ao concluir esta etapa, o usuário precisa perceber imediatamente a diferença entre:

- algodão;
- couro;
- tecido formal;
- tecido esportivo;
- metal;
- armadura;

sem depender apenas de nomes ou cores.

A roupa deve parecer **vestida**, não desenhada sobre o corpo.

O personagem precisa passar de:

> “boneco com camiseta”

para:

> **“personagem com styling, caimento, material e presença visual.”**

---

## FIM DA PARTE 5/12

**Próxima: PARTE 6/12 — ACESSÓRIOS, ÓCULOS, CHAPÉUS, JOIAS, MOCHILAS, ASAS, PROPS, PETS, COMPANHEIROS, SOCKETS, FIT, CLIPPING, MATERIAIS HERO E SUBSTITUIÇÃO DOS PLACEHOLDERS PROCEDURAIS.**







# MEGA BRIEFING — ELEVAÇÃO GRÁFICA AAA DO AVATAR STUDIO DSHOW  
## PARTE 6/12 — ACESSÓRIOS, ÓCULOS, CHAPÉUS, JOIAS, MOCHILAS, ASAS, PROPS, PETS, COMPANHEIROS, SOCKETS, FIT, CLIPPING, MATERIAIS HERO E SUBSTITUIÇÃO DOS PLACEHOLDERS PROCEDURAIS

# 1222. Objetivo da Parte 6

Esta parte deverá elevar o sistema de acessórios de um conjunto funcional de itens equipáveis para um **ecossistema visual premium, modular e coerente com um Character Creator AAA**.

Hoje, a arquitetura de acessórios é tecnicamente mais madura do que a arte exibida.

O sistema já possui **14 sockets 3D** definidos no contrato:

- `head`
- `face`
- `eyes`
- `ears`
- `neck`
- `shoulders`
- `back`
- `waist`
- `wrist_l`
- `wrist_r`
- `hand_l`
- `hand_r`
- `companion`
- `pet` 

Isso é uma excelente base estrutural.

O problema é que a primeira leva foi propositalmente construída com **geometria procedural para validar o contrato**, e o próprio código deixa claro que a arte definitiva ainda deveria chegar depois. 

Portanto, a missão agora é:

> **preservar o contrato de sockets e substituir progressivamente a aparência de placeholder técnico por assets finais de alto impacto visual.**

---

# 1223. Princípio central: preservar lógica, elevar arte

Não reconstruir o sistema de sockets sem necessidade.

Preservar:

- IDs;
- sockets;
- regras;
- saves;
- incompatibilidades;
- histórico;
- desbloqueios;
- persistência.

Trocar:

- modelagem;
- material;
- texturas;
- rig secundário;
- VFX;
- fit;
- apresentação.

A lógica correta é:

```text
SOCKET SYSTEM
= KEEP

PROCEDURAL PLACEHOLDER ART
= REPLACE / UPGRADE
```

---

# 1224. Inventário obrigatório dos acessórios atuais

Criar auditoria por item.

A leva existente inclui, entre outros:

- coroa;
- halo;
- óculos neon;
- colar;
- jetpack;
- asas;
- cetro;
- drone;
- pet robótico. 

Cada item deverá ser classificado como:

```text
KEEP
UPGRADE
REPLACE
DEV_ONLY
DEPRECATE
```

---

# 1225. Procedural não significa ruim por definição

Alguns assets abstratos podem funcionar muito bem proceduralmente.

Exemplo:

- halo;
- energia;
- partículas;
- rings;
- orbitals;
- holograms.

Mas itens como:

- coroa;
- óculos;
- jetpack;
- cetro;
- pet;

tendem a exigir arte dedicada para atingir o quality bar premium.

---

# 1226. Acessório final não pode parecer primitive mesh

Hard Fail se o item final parecer claramente construído por:

- box;
- cylinder;
- torus;
- cone;

sem acabamento artístico.

Procedural geometry pode continuar internamente, mas precisa parecer intencional.

---

# 1227. Categorias de acessórios

Organizar em famílias.

Exemplo:

```text
HEAD
- hats
- caps
- crowns
- helmets
- hoods
- headbands

FACE
- glasses
- masks
- visors

EARS
- earrings
- ear devices

NECK
- necklaces
- chains
- scarves
- collars

SHOULDERS
- pauldrons
- decorative pieces

BACK
- backpacks
- wings
- capes
- jetpacks

WAIST
- belts
- pouches
- decorative elements

WRISTS
- watches
- bracelets
- tech devices

HANDS
- props
- tools
- staffs
- handheld devices

COMPANION
- drones
- floating bots

PET
- robotic pets
- fantasy pets
```

---

# 1228. Subcategorias como dados

Não hardcodar cada subcategoria em componentes diferentes.

A estrutura atual já trata subcategorias de acessórios como dados no workspace, o que é uma boa direção. 

Expandir essa filosofia.

---

# 1229. Multi-accessory continua obrigatório

O usuário precisa poder equipar vários acessórios simultaneamente, desde que não conflitem.

Exemplo:

```text
óculos
+
brinco
+
colar
+
relógio
+
mochila
+
pet
```

O sistema de 14 sockets já foi desenhado justamente para isso. 

---

# 1230. Slot não é suficiente para resolver compatibilidade

Dois itens podem estar em sockets diferentes e ainda assim colidir.

Exemplo:

```text
long hair
+
large earrings
```

ou:

```text
wings
+
oversized backpack
```

Logo, precisamos de regras adicionais.

---

# 1231. Occupancy Profiles

Cada acessório deverá informar seu volume aproximado.

Exemplo:

```text
occupancy:
  region: back
  size: large
  zones:
    - back_center
    - back_upper
```

---

# 1232. Spatial Regions

Criar regiões semânticas.

Exemplo:

```text
head_top
head_side
face_front
ear_left
ear_right
neck_front
neck_side
shoulder_left
shoulder_right
back_center
back_side
waist
wrist
hand
```

Não precisa ser extremamente granular.

---

# 1233. Compatibility Rules

Adicionar regras declarativas como:

```text
requires
incompatibleWith
hides
replaces
occupies
```

A arquitetura já possui lógica declarativa semelhante em outras partes do projeto; não reinventar via `if` espalhado.

---

# 1234. Exclusividade por socket

Alguns sockets naturalmente suportam apenas um item.

Exemplo:

```text
hand_r
```

pode possuir um prop principal.

Mas outros podem permitir subslots.

---

# 1235. Face accessories

Óculos e máscara podem compartilhar região, mas nem sempre coexistir.

Criar regra.

---

# 1236. Earrings

Permitir:

- left;
- right;
- pair.

O socket genérico `ears` pode precisar de subconfiguração.

---

# 1237. Wrist accessories

Mesmo princípio:

- left;
- right;
- both.

O contrato já possui `wrist_l` e `wrist_r`, portanto aproveitar isso. 

---

# 1238. Hand props

Já existem `hand_l` e `hand_r`. 

A UI deve deixar claro em qual mão o item vai.

---

# 1239. Auto-hand selection

Quando um item puder funcionar em ambas:

```text
Mão
Esquerda | Direita
```

---

# 1240. Two-handed props

Preparar arquitetura para itens que ocupam as duas mãos.

Exemplo:

```text
occupies:
- hand_l
- hand_r
```

Mesmo que não sejam produzidos agora.

---

# 1241. Grip Profiles

Retomar a ideia da Parte 2.

Props precisam informar:

```text
grip:
  right_hand
  type: cylindrical
```

---

# 1242. Hand pose matching

Ao equipar prop:

- mão precisa fechar;
- dedos precisam respeitar objeto;
- prop não pode atravessar a palma.

---

# 1243. Prop anchor

Definir:

- pivot;
- rotation;
- local offset.

Em metadata, não em números mágicos na UI.

---

# 1244. Prop orientation

Todos os props precisam seguir convenção.

Exemplo:

```text
+Y up
+Z forward
origin = grip point
```

ou convenção equivalente do projeto.

Documentar.

---

# 1245. Óculos

Óculos são um dos acessórios mais importantes visualmente porque ficam diretamente no rosto.

Precisam de quality bar alto.

---

# 1246. Glasses Quality Bar

Óculos premium devem possuir:

- armação convincente;
- espessura;
- ponte;
- hastes;
- lentes;
- material;
- fit.

---

# 1247. Óculos não podem flutuar

Devem repousar em:

- nariz;
- orelhas.

---

# 1248. Face Width Adaptation

Se face width mudar, ajustar:

- temple width;
- bridge fit.

---

# 1249. Glasses Fit Profile

Exemplo:

```text
faceWidthRange
bridgeType
earAnchor
```

---

# 1250. Lentes

Podem ter:

- clear;
- tinted;
- mirrored;
- holographic.

---

# 1251. Lens material

Não usar apenas opacity simples se o renderer suporta material melhor.

---

# 1252. Refraction

Não precisa ser fisicamente complexa.

Mas transparência deve parecer vidro.

---

# 1253. Lens roughness

Controlada.

---

# 1254. Sunglasses

Precisam manter leitura dos olhos quando artisticamente desejado ou ocultá-los com intenção.

---

# 1255. Glasses LOD

Em retrato:

- máxima qualidade.

Em corpo inteiro:

- simplificar.

---

# 1256. Óculos 2D

No modo clássico, criar armações com:

- volume;
- highlights;
- lentes;
- sombra sobre o rosto.

---

# 1257. Headwear

Chapéus, bonés, coroas, helmets e capuzes devem ser tratados junto ao sistema de hair fit.

---

# 1258. Headwear Profiles

Cada item informa:

```text
headFit
hairMask
headScaleRange
```

---

# 1259. Boné

Precisa funcionar com:

- cabelo curto;
- cabelo médio;
- under-hat variant.

---

# 1260. Chapéu

Precisa possuir:

- espessura;
- brim;
- material;
- shadow.

---

# 1261. Coroa

Coroa atual é um candidato óbvio a asset Hero.

Criar uma versão final com:

- design reconhecível;
- metal premium;
- pedras ou emissive quando apropriado;
- boa silhouette;
- detalhes;
- interior.

---

# 1262. Coroa não pode parecer torus/cones

Mesmo que o placeholder use primitivas, o asset final deve superar claramente essa aparência.

---

# 1263. Helmet

Helmet precisa:

- encaixar na cabeça;
- lidar com cabelo;
- possuir material;
- não atravessar face.

---

# 1264. Closed Helmet

Pode ocultar cabelo.

---

# 1265. Open Helmet

Pode usar hair mask parcial.

---

# 1266. Visor

Precisa de transparência/material premium.

---

# 1267. Capuz

Como discutido na Parte 4, pode precisar de hair variant.

---

# 1268. Joias

Joias são ótimos elementos para comunicar material premium.

Categorias:

- colares;
- correntes;
- brincos;
- pulseiras;
- anéis;
- broches.

---

# 1269. Metal Jewelry

Precisa responder bem ao environment map.

A infraestrutura 3D já possui environment e tone mapping adequados como base. 

---

# 1270. Ouro não é amarelo

Reforçar:

```text
gold
!=
#FFD700
```

Usar:

- metalness;
- roughness;
- environment;
- base color apropriado.

---

# 1271. Silver

Mesma lógica.

---

# 1272. Gem materials

Pedras podem usar:

- transmissive/glass-like;
- emissive estilizado;
- shader simplificado.

Não precisa ray tracing.

---

# 1273. Necklace Fit

Colar precisa acompanhar:

- neck width;
- torso;
- clothing.

---

# 1274. Necklace × clothing

Se gola fechada:

- colar pode ficar por cima;
- ou ser ocultado.

Regra por asset.

---

# 1275. Earrings Fit

Brincos precisam seguir orelha durante head morphs.

---

# 1276. Dangling earrings

Podem possuir secondary motion.

---

# 1277. Jewelry Physics

Somente para itens que realmente se beneficiam.

---

# 1278. Watches

Relógios são excelentes assets premium.

Precisam:

- bracelete;
- caixa;
- vidro;
- mostrador;
- metal/material.

---

# 1279. Watch fit

Acompanhar wrist circumference.

---

# 1280. Wrist × sleeve

Manga longa pode:

- ocultar parcialmente;
- cobrir totalmente.

---

# 1281. Bracelets

Stacking pode ser permitido no futuro.

Mas não aumentar complexidade antes de resolver um acessório por punho.

---

# 1282. Backpacks

Mochila precisa parecer realmente presa às costas.

---

# 1283. Backpack straps

Visualmente, alças fazem grande diferença.

---

# 1284. Strap challenge

Se strap atravessar roupa/corpo, pode derrubar qualidade.

Avaliar:

- geometry;
- body mask;
- clipping.

---

# 1285. Backpack Fit

Precisa considerar:

- body family;
- clothing thickness;
- back curve.

---

# 1286. Backpack × long hair

Pode conflitar.

---

# 1287. Backpack × cape

Pode ser incompatível.

---

# 1288. Backpack × wings

Regra específica.

---

# 1289. Jetpack

Jetpack atual é candidato claro a substituição artística.

A versão premium deverá possuir:

- body;
- thrusters;
- vents;
- emissive;
- materials;
- straps/anchors;
- VFX controlado.

---

# 1290. Jetpack idle

Pode possuir:

- emissive pulse;
- micro particles;
- subtle sound futuramente.

---

# 1291. Jetpack activation

Em pose/power:

- thruster VFX;
- glow;
- heat effect.

Mas não obrigatório para primeira versão.

---

# 1292. Jetpack material

Metal/composite, não bloco simples.

---

# 1293. Wings

Asas são uma categoria de alto impacto.

Precisam ser tratadas como Hero Assets.

---

# 1294. Wing Families

Exemplo:

```text
angelic
mechanical
energy
dragon
digital
cosmic
```

---

# 1295. Wing silhouette

Deve ser excelente em:

- front;
- back;
- ¾.

---

# 1296. Wing scale

Não usar scaling arbitrário.

Cada família precisa de proporção curada.

---

# 1297. Wing anchor

Ponto de fixação deve parecer plausível.

---

# 1298. Wing fold

Algumas asas podem ter:

- idle folded;
- hero opened.

---

# 1299. Wing animation

Pode incluir:

- breathing movement;
- unfolding;
- hover.

---

# 1300. Energy wings

Podem continuar parcialmente procedurais.

Mas precisam parecer arte final.

---

# 1301. Mechanical wings

Precisam de:

- joints;
- panels;
- material;
- mechanical logic.

---

# 1302. Feather wings

Não precisam de milhares de penas individuais.

Usar hierarquia:

- primary;
- secondary;
- shape.

---

# 1303. Wings × camera

Assets grandes precisam informar bounds ao camera manager.

---

# 1304. Auto framing

Ao equipar asas abertas, câmera pode recuar suavemente.

---

# 1305. Não diminuir demais o avatar

Se asas forem gigantes, permitir enquadramento específico.

---

# 1306. Props de mão

Cetro atual é placeholder útil para validar socket.

A versão final precisa possuir:

- shape;
- grip;
- material;
- visual hierarchy;
- tip/energy.

---

# 1307. Prop families

Exemplos seguros:

- staff;
- microphone;
- tablet;
- camera;
- trophy;
- futuristic device;
- umbrella;
- light wand.

---

# 1308. Props e animação

Precisam acompanhar mão corretamente.

---

# 1309. Prop idle

Pode ter:

- subtle glow;
- rotation;
- screen animation.

---

# 1310. Props 2D

No clássico, precisam respeitar layering e mãos.

---

# 1311. Companion system

O socket `companion` já existe no contrato. 

Companions devem deixar de ser apenas objetos flutuando.

---

# 1312. Companion Families

Exemplo:

```text
drone
orb
mini_robot
spirit
hologram
```

---

# 1313. Companion Orbit

Podem possuir comportamento:

- hover;
- orbit;
- follow;
- idle beside.

---

# 1314. Companion anchor

Não precisa ficar rigidamente preso ao skeleton.

Pode seguir um anchor virtual da cena.

---

# 1315. Companion collision

Evitar passar:

- pelo rosto;
- pelo corpo;
- pelas asas.

---

# 1316. Companion camera awareness

Se câmera aproxima rosto, companion pode:

- afastar;
- reduzir presença;
- sair do enquadramento.

---

# 1317. Companion VFX

Controlado.

---

# 1318. Drone

Drone premium deverá possuir:

- design;
- material;
- lights;
- rotors/hover logic;
- idle animation.

---

# 1319. Pet system

O socket `pet` também já existe. 

Pets precisam ser tratados como assets de maior complexidade.

---

# 1320. Pet ≠ accessory mesh

Um pet premium pode precisar de:

- skeleton;
- animation;
- material;
- behavior;
- ground alignment.

---

# 1321. Pet Categories

Exemplo:

```text
robotic
fantasy
animal
digital
```

---

# 1322. Pet scale

Precisa manter proporção coerente com avatar.

---

# 1323. Pet placement

Pode ficar:

- ao lado;
- atrás;
- em pedestal;
- flutuando.

---

# 1324. Grounded pets

Precisam tocar chão.

---

# 1325. Flying pets

Precisam ter hover convincente.

---

# 1326. Pet idle

No mínimo:

- breathing;
- head movement;
- subtle motion.

---

# 1327. Pet attention

Pode olhar para avatar ou câmera ocasionalmente.

---

# 1328. Não sincronizar movimentos artificialmente

Pet e avatar precisam parecer sistemas independentes.

---

# 1329. Pet performance

Pets aumentam custo da cena.

Entrar no Quality Manager.

---

# 1330. Pet LOD

Implementar:

- LOD0;
- LOD1;
- LOD2;

quando a complexidade justificar.

---

# 1331. Pet off-screen optimization

Se fora da câmera:

- reduzir animação;
- reduzir update.

---

# 1332. Companion off-screen

Mesma lógica.

---

# 1333. Auras e acessórios

Auras não devem ocupar socket físico, mas podem ter incompatibilidades visuais.

---

# 1334. Material families dos acessórios

Criar:

```text
metal_polished
metal_brushed
plastic_tech
rubber
leather
glass
crystal
energy
hologram
fabric
```

---

# 1335. Hero Material Set

Acessórios são excelentes para demonstrar materiais mais sofisticados.

---

# 1336. Crystal

Pode usar:

- transmission simplificada;
- emissive;
- refraction fake.

---

# 1337. Hologram

Pode usar:

- opacity;
- scanline;
- emissive;
- fresnel.

---

# 1338. Energy

Pode usar shader procedural.

---

# 1339. Emissive discipline

Não deixar todos os acessórios brilhando.

---

# 1340. Material hierarchy

Exemplo em jetpack:

```text
70% composite
20% metal
10% emissive
```

Mais sofisticado que tudo metálico/neon.

---

# 1341. Accent colors

Permitir personalização.

---

# 1342. Color Channels

Acessórios podem ter:

```text
primary
secondary
metal
emissive
```

---

# 1343. UI adaptativa

Só mostrar canais que o asset suporta.

---

# 1344. Emissive intensity

Pode ser ajustável dentro de limite seguro.

---

# 1345. Bloom limit

O renderer já possui bloom sutil como base. 

Acessórios emissivos devem respeitar um teto global.

---

# 1346. Não estourar face

Um jetpack brilhante não pode destruir exposição do personagem.

---

# 1347. Rarity expression

A raridade pode influenciar acessórios mais fortemente que características corporais básicas.

---

# 1348. Common accessory

Ainda precisa ser bem modelado.

---

# 1349. Rare

Pode ter material ou detalhe adicional.

---

# 1350. Epic

Pode ter:

- animated material;
- secondary motion.

---

# 1351. Legendary

Pode ter:

- custom VFX;
- custom animation;
- unique presentation.

---

# 1352. Legendary não significa excesso

Qualidade premium é controle.

---

# 1353. Accessory Collections

Criar coleções coerentes.

Exemplo:

```text
CYBER
- visor
- tech necklace
- wrist device
- jetpack
- drone
```

---

# 1354. Royal

```text
crown
earrings
necklace
rings
cape
```

---

# 1355. Adventure

```text
backpack
belt
watch
companion
```

---

# 1356. Outfit + accessory coherence

Presets podem equipar conjunto completo.

---

# 1357. Smart equip

Ao selecionar coleção, mostrar preview antes de aplicar tudo.

---

# 1358. Equip all

Opcional.

---

# 1359. Equip individually

Sempre disponível.

---

# 1360. Conflict explanation

Se item não puder coexistir:

> “Asas substituem mochila.”

A UI deve explicar.

---

# 1361. Não falhar silenciosamente

Se usuário equipa asas e mochila some, comunicar.

---

# 1362. Replacement animation

Pode existir transição sutil.

---

# 1363. Accessory thumbnails

Precisam ser mais visuais, conforme pedido anterior.

---

# 1364. Isolated preview

Acessórios pequenos podem mostrar:

- item isolado;
- + mini preview equipado.

---

# 1365. Equipped preview

Para óculos/colar, mostrar no avatar é mais útil que objeto sozinho.

---

# 1366. Hover preview

Aplicar temporariamente.

---

# 1367. Category Focus Camera

Ao abrir:

```text
Óculos
→ rosto

Colar
→ busto

Mochila
→ ¾/back

Asas
→ full body

Relógio
→ wrist detail
```

---

# 1368. Back camera

Acessórios de costas precisam de botão rápido:

```text
Ver costas
```

---

# 1369. Rotate automatically?

Pode haver rotação suave ao escolher back category, mas não forçar se usuário já posicionou câmera.

---

# 1370. Wrist camera

Pode focar braço/punho.

---

# 1371. Prop camera

Enquadrar mão + corpo.

---

# 1372. Pet camera

Full-body mais aberto.

---

# 1373. Companion camera

Mesmo princípio.

---

# 1374. Classic 2D — acessórios

O clássico também precisa de elevação significativa.

---

# 1375. 2D Glasses

Adicionar:

- lens highlight;
- shadow;
- frame depth.

---

# 1376. 2D Jewelry

Metal com:

- highlight;
- gradient;
- shadow.

---

# 1377. 2D Back Accessories

Usar layers:

```text
background
back accessory
body
front accessory
```

---

# 1378. 2D Wings

Podem ter:

- rear layer;
- front tips;
- glow;
- depth.

---

# 1379. 2D Halo

Pode funcionar muito bem proceduralmente.

---

# 1380. 2D Props

Precisam encaixar na mão.

---

# 1381. 2D Pet

Pode existir como sprite/illustration com leve motion.

---

# 1382. 2D Companion

Pode usar orbit/parallax.

---

# 1383. Cross-renderer semantic mapping

Mesmo conceito pode ter implementação diferente.

---

# 1384. Accessory Pipeline

O pipeline 3D precisa receber validações adicionais.

---

# 1385. Socket Validator

Verificar:

- socket existe;
- anchor;
- scale;
- transform;
- metadata.

---

# 1386. Fit Validator

Não é totalmente automatizável, mas registrar bounds.

---

# 1387. Bounds

Cada asset deve informar:

- local bounds;
- world bounds após equip.

---

# 1388. Oversize detection

Se item exceder limite esperado, alertar.

---

# 1389. Camera-aware bounds

Usar bounds para framing.

---

# 1390. Material Validator

Verificar:

- material count;
- maps;
- emissive;
- transparency;
- unsupported settings.

---

# 1391. Alpha Validator

Especialmente:

- glasses;
- visor;
- hologram.

---

# 1392. Bone Validator

Para pets/capes/wing animation.

---

# 1393. Animation Validator

Verificar clips.

---

# 1394. LOD Validator

Assets complexos devem possuir LOD.

---

# 1395. Thumbnail Validator

Todo asset production-ready precisa de thumbnail.

---

# 1396. Preview Validator

Hero assets precisam de preview.

---

# 1397. Visual QA — head

Testar:

- face widths;
- hair;
- headwear.

---

# 1398. Visual QA — face

Testar óculos/máscaras em:

- front;
- ¾;
- profile.

---

# 1399. Visual QA — neck

Colares em diferentes roupas.

---

# 1400. Visual QA — back

Mochilas/asas em:

- front;
- back;
- ¾;
- animation.

---

# 1401. Visual QA — wrist

Testar com manga curta/longa.

---

# 1402. Visual QA — props

Testar:

- hand pose;
- animation;
- camera.

---

# 1403. Visual QA — pets

Testar:

- ground;
- clipping;
- animation;
- camera.

---

# 1404. Accessory Stress Test

Criar um personagem com muitos acessórios simultâneos.

Exemplo:

```text
crown
+
glasses
+
earrings
+
necklace
+
watch
+
wings
+
staff
+
drone
+
pet
```

Objetivo:

- performance;
- clipping;
- hierarchy;
- visual overload.

---

# 1405. Visual overload control

Mesmo que tecnicamente possa equipar 9 itens, o resultado pode ficar ruim.

Não bloquear arbitrariamente, mas:

- alertar;
- sugerir;
- presets curados.

---

# 1406. Accessory Density Indicator

Opcionalmente, internamente classificar:

```text
minimal
balanced
heavy
```

para presets.

---

# 1407. Smart recommendations

Pode sugerir:

> “Este look já possui um acessório grande nas costas.”

Não obrigatório agora.

---

# 1408. Golden Accessory Set

Criar um conjunto de referência.

Sugestão:

```text
A01 Premium Glasses
A02 Premium Crown
A03 Premium Necklace
A04 Premium Watch
A05 Premium Backpack
A06 Premium Wings
A07 Premium Staff
A08 Premium Drone
A09 Premium Pet
```

---

# 1409. Golden Accessory Set deve cobrir técnicas diferentes

Queremos provar:

- metal;
- glass;
- emissive;
- cloth;
- animation;
- secondary motion;
- pet;
- socket fit.

---

# 1410. Golden glasses

Testam rosto.

---

# 1411. Golden crown

Testa cabelo/headwear.

---

# 1412. Golden necklace

Testa skin/clothing.

---

# 1413. Golden backpack

Testa corpo/roupa.

---

# 1414. Golden wings

Testa bounds/camera/VFX.

---

# 1415. Golden prop

Testa mão/grip.

---

# 1416. Golden drone

Testa companion.

---

# 1417. Golden pet

Testa secondary actor.

---

# 1418. Before/After

Comparar os placeholders atuais com as versões finais.

Especialmente:

- coroa;
- jetpack;
- asas;
- cetro;
- drone;
- pet.

---

# 1419. Procedural fallback

Não apagar necessariamente os antigos.

Podem permanecer:

```text
visual_status = prototype
```

para testes.

---

# 1420. Dev-only visibility

Placeholders podem aparecer apenas em modo Dev.

---

# 1421. Production catalog

Não mostrar placeholders como conteúdo premium.

---

# 1422. Vitrine

A Vitrine deverá priorizar os Golden Accessories.

---

# 1423. Photo Studio

Acessórios precisam fotografar bem.

---

# 1424. Photo quality

Force:

- high LOD;
- better shadows;
- anti-aliasing.

---

# 1425. Reflective accessory capture

Metal e vidro precisam manter qualidade na captura.

---

# 1426. Transparent accessory capture

Garantir compositing correto.

---

# 1427. VFX capture

Emissive/bloom não pode clipping.

---

# 1428. Pet capture

O pet precisa entrar corretamente no frame.

---

# 1429. Companion capture

Mesma lógica.

---

# 1430. Camera presets por asset

Assets Hero podem sugerir câmera.

---

# 1431. Não obrigar câmera

Sugestão, não bloqueio.

---

# 1432. Performance Budget por classe

Exemplo:

```text
small accessory
medium accessory
hero accessory
pet
companion
```

Cada classe possui budget diferente.

---

# 1433. Small Accessory

Baixo custo.

---

# 1434. Hero Accessory

Pode ter mais:

- geometry;
- materials;
- animation.

---

# 1435. Pet

Budget maior.

---

# 1436. Companion

Budget intermediário.

---

# 1437. LOD priority

Óculos em close-up podem permanecer LOD0 enquanto mochila cai para LOD2.

---

# 1438. Context-aware LOD

Aplicar a mesma filosofia já prevista no projeto para rosto/cabelo. 

---

# 1439. Accessory off-screen culling

Assets fora do frustum não devem consumir draw desnecessário.

---

# 1440. Particle culling

Companion/VFX também.

---

# 1441. Update throttling

Pets/companions distantes podem atualizar menos.

---

# 1442. Material sharing

Reutilizar famílias.

---

# 1443. Texture atlas

Especialmente joias/acessórios pequenos.

---

# 1444. Don't over-texture

Um brinco pequeno não precisa 2K.

---

# 1445. Hero texture

Coroa grande pode receber mais orçamento.

---

# 1446. Art Bible

Adicionar capítulo de acessórios.

---

# 1447. Documentar socket conventions

Obrigatório.

---

# 1448. Documentar scale

Obrigatório.

---

# 1449. Documentar pivots

Obrigatório.

---

# 1450. Documentar fit

Obrigatório.

---

# 1451. Documentar material families

Obrigatório.

---

# 1452. Documentar anti-patterns

Exemplos:

```text
❌ prop flutuando na mão
❌ óculos atravessando nariz
❌ coroa parecendo primitive mesh
❌ mochila sem alças/contato
❌ asas sem ponto de fixação
❌ pet parado como estátua
❌ tudo emissivo/neon
❌ vidro parecendo plástico transparente
❌ ouro = amarelo chapado
```

---

# 1453. Hard Fails

Reprovar asset Premium se:

- clipping evidente;
- socket incorreto;
- scale absurda;
- prop não acompanha mão;
- glass rendering quebrado;
- LOD muda identidade;
- câmera não consegue enquadrar;
- pet flutua;
- backpack atravessa torso;
- headwear atravessa cabelo sem regra;
- emissive estoura exposição;
- ausência de preview em Hero asset.

---

# 1454. Soft Fails

Exemplos:

- microclipping em animação extrema;
- leve diferença de reflexão;
- pequena simplificação em LOD2.

---

# 1455. Visual Score — acessórios

Sugestão:

```text
Design             9/10
Fit                9/10
Material           9/10
Integration        9/10
Close-up           8/10
Animation          8/10
LOD                8/10
Performance        8/10
Distinctiveness    9/10
```

---

# 1456. Visual Score — pets

```text
Design             9/10
Animation          9/10
Grounding          9/10
Material           8/10
Camera behavior    8/10
Performance        8/10
```

---

# 1457. Não produzir centenas de acessórios antes do Golden Set

A arquitetura permite escala.

Mas primeiro precisamos comprovar que:

```text
GLASSES
CROWN
BACKPACK
WINGS
PROP
DRONE
PET
```

podem atingir o novo quality bar.

---

# 1458. Escala posterior

Depois da aprovação:

- expandir por subcategoria;
- priorizar variedade real;
- utilizar material variants para reduzir duplicação.

---

# 1459. Distinctiveness

Novo item precisa justificar existência.

---

# 1460. Color variant não é novo asset

Quando shape não mudou.

---

# 1461. Material variant pode ser variant

Exemplo:

```text
same glasses
black frame
gold frame
transparent frame
```

---

# 1462. Hero variant

Se design muda bastante, novo asset.

---

# 1463. CMS/registry

Cada acessório precisa registrar:

```text
socket
subCategory
visualQuality
materialFamily
colorChannels
compatibility
occupancy
lod
animation
rendererSupport
license
```

---

# 1464. No hardcode UI

Adicionar acessório novo não deverá exigir componente React novo.

---

# 1465. Preview generation

Automatizar quando possível.

---

# 1466. QA generation

Gerar cenas padronizadas por socket.

---

# 1467. Socket QA scenes

Exemplo:

```text
HEAD_QA
FACE_QA
BACK_QA
WRIST_QA
HAND_QA
PET_QA
```

---

# 1468. Default body para QA

Usar Golden Male e Golden Female.

---

# 1469. Testar dois body types

Especialmente acessórios de fit.

---

# 1470. Testar cabelo

Headwear precisa de vários cabelos.

---

# 1471. Testar roupas

Back/neck/wrist precisam de várias roupas.

---

# 1472. Testar skin tones

Metal/joias precisam funcionar visualmente em diferentes tons de pele.

---

# 1473. Accessibility visual

Acessórios não devem depender apenas de pequenas diferenças de cor para serem distinguíveis.

---

# 1474. Thumbnail legibility

Itens pequenos precisam ser legíveis no card.

---

# 1475. Badge de slot

Pode ser útil na UI.

Exemplo:

```text
Cabeça
Rosto
Costas
```

---

# 1476. Equip count

Mostrar quantos acessórios estão equipados.

---

# 1477. Quick remove

Permitir remover individualmente.

---

# 1478. Remove all accessories

Ação clara.

---

# 1479. Equipped tray

Pode existir uma área compacta mostrando acessórios ativos.

---

# 1480. Não sobrecarregar sidebar

Visual-first, como já especificado anteriormente.

---

# 1481. Scroll interno

O painel de assets deve continuar com scroll próprio para manter o avatar em foco.

---

# 1482. Large thumbnails for accessories where necessary

Óculos precisam card maior que pequenos badges.

---

# 1483. Category-dependent card size

Pode ser adaptativo.

---

# 1484. Inspect mode

Clique secundário/ação “ver detalhes” pode mostrar:

- 3D preview;
- material;
- lore;
- coleção;
- raridade.

---

# 1485. Não colocar metadados demais no card

Card deve ser visual.

---

# 1486. Asset lore

Pode enriquecer itens raros.

---

# 1487. Sound

Acessórios especiais podem futuramente ter som.

Mas não escopo principal.

---

# 1488. Haptic/interaction

Não necessário.

---

# 1489. Entrada de Hero Asset

Itens lendários podem ter equip animation específica.

---

# 1490. Não bloquear interação durante animação longa

Keep it fast.

---

# 1491. Photo Pose integration

Props podem sugerir poses específicas.

Exemplo:

```text
staff
→ hero_staff_pose
```

---

# 1492. Pet pose integration

Avatar pode olhar para pet em preset de foto.

---

# 1493. Companion pose

Pode interagir.

---

# 1494. Não tornar obrigatório

São presets, não dependências.

---

# 1495. Golden Accessory Acceptance Gate

A Parte 6 só poderá ser aprovada quando pelo menos:

- um acessório de cabeça;
- um de face;
- um de pescoço;
- um de punho;
- um de costas;
- um prop;
- um companion;
- um pet;

atingirem Q3/Q4.

---

# 1496. Acceptance — socket

Todos precisam encaixar corretamente.

---

# 1497. Acceptance — clipping

Sem clipping evidente.

---

# 1498. Acceptance — material

Materiais precisam comunicar objeto.

---

# 1499. Acceptance — camera

Todos precisam enquadrar corretamente.

---

# 1500. Acceptance — performance

Worst-case acessório não pode destruir fluidez.

---

# 1501. Acceptance — cross-body

Testar masculino/feminino ou body families relevantes.

---

# 1502. Acceptance — Classic

Pelo menos os principais conceitos precisam de apresentação 2D premium quando suportados.

---

# 1503. Deliverables obrigatórios da Parte 6

O agente deverá entregar:

1. inventário completo dos acessórios atuais;
2. classificação `KEEP / UPGRADE / REPLACE / DEV_ONLY`;
3. taxonomia por socket/subcategoria;
4. occupancy profiles;
5. compatibility rules;
6. fit profiles;
7. pivot/socket conventions;
8. Hero Glasses;
9. Hero Headwear;
10. Hero Jewelry;
11. Hero Backpack;
12. Hero Wings;
13. Hero Prop;
14. Hero Companion;
15. Hero Pet;
16. material families;
17. color channels;
18. LOD strategy;
19. camera-aware bounds;
20. Visual QA;
21. stress test multi-accessory;
22. 2D accessory upgrade;
23. Before/After;
24. Art Bible update;
25. plano de escala.

---

# 1504. Ordem recomendada de execução

```text
AUDIT PLACEHOLDERS
↓
SOCKET/FIT CONTRACT
↓
GLASSES
↓
HEADWEAR
↓
JEWELRY
↓
BACKPACK/WINGS
↓
HAND PROPS
↓
COMPANION
↓
PET
↓
MATERIALS/VFX
↓
LOD
↓
2D
↓
VISUAL QA
```

---

# 1505. Gate final

Não liberar produção massiva enquanto:

```text
SOCKET CONTRACT
+
FIT
+
GOLDEN ACCESSORIES
+
PET/COMPANION
+
CAMERA
+
VISUAL QA
```

não estiverem aprovados.

---

# 1506. Resultado esperado da Parte 6

A percepção do usuário precisa mudar de:

> “posso colocar algumas coisas no avatar”

para:

> **“posso construir uma identidade rica, modular e visualmente sofisticada através de acessórios realmente desejáveis.”**

Os sockets existentes já demonstram que a engenharia de composição múltipla está bem encaminhada. 

Agora, o trabalho é transformar essa infraestrutura em **conteúdo visual que realmente justifique a arquitetura premium**.

---

## FIM DA PARTE 6/12

**Próxima: PARTE 7/12 — MATERIAIS PBR, PELE, TECIDOS, METAIS, VIDRO, EMISSIVE, SHADERS, TEXTURAS, NORMAL/ROUGHNESS/AO, COLOR MANAGEMENT E PADRÃO FÍSICO-VISUAL UNIFICADO.**





# MEGA BRIEFING — ELEVAÇÃO GRÁFICA AAA DO AVATAR STUDIO DSHOW  
## PARTE 7/12 — MATERIAIS PBR, PELE, TECIDOS, METAIS, VIDRO, EMISSIVE, SHADERS, TEXTURAS, NORMAL/ROUGHNESS/AO, COLOR MANAGEMENT E PADRÃO FÍSICO-VISUAL UNIFICADO

# 1507. Objetivo da Parte 7

Esta parte deverá transformar o sistema de materiais do Avatar Studio de um conjunto funcional de cores e parâmetros em uma **camada visual coerente, física, controlada e premium**.

A auditoria mostrou que a infraestrutura já possui fundamentos importantes:

- `MeshStandardMaterial`;
- `map`;
- `normalMap`;
- `roughnessMap`;
- `metalnessMap`;
- `aoMap`;
- `emissiveMap`;
- `alphaMap`;
- sRGB;
- ACES Filmic Tone Mapping;
- environment map;
- bloom. 

Portanto, o problema principal não é ausência total de suporte técnico.

A missão agora é:

> **organizar, padronizar e elevar o uso artístico desses recursos.**

---

# 1508. Princípio central: cor não é material

Reforçar como regra estrutural:

```text
COLOR != MATERIAL
```

Exemplo:

Uma camiseta preta pode ser:

- algodão;
- couro;
- cetim;
- tecido técnico.

A cor pode ser a mesma, mas a resposta à luz precisa ser diferente.

---

# 1509. Material Families como sistema oficial

Criar um registry central de famílias.

Exemplo:

```text
skin
hair
cotton
jersey
denim
wool
knit
leather
satin
technical_fabric
rubber
plastic_matte
plastic_gloss
metal_brushed
metal_polished
gold
silver
glass
crystal
hologram
energy
emissive
```

Cada família deverá definir defaults coerentes.

---

# 1510. Registry, não hardcode

Não espalhar valores como:

```ts
roughness = 0.37
metalness = 0.71
```

em componentes diferentes.

Centralizar.

---

# 1511. Material Definition

Conceitualmente:

```ts
interface MaterialFamily {
  id: string;
  metalness: number;
  roughness: number;
  emissiveIntensity?: number;
  opacity?: number;
  normalScale?: number;
  environmentIntensity?: number;
}
```

Adaptar ao contrato real do projeto.

---

# 1512. Material Profile por asset

Cada asset informa:

```text
materialFamily
+
overrides
```

---

# 1513. Preservar byte-stability quando não houver customização

A infraestrutura atual já demonstra preocupação em manter materiais originais intactos quando não há cor customizada. 

Preservar essa filosofia.

---

# 1514. Material Override não deve destruir textura

Ao mudar cor:

- não apagar `map`;
- não apagar normal;
- não remover roughness;
- não substituir material inteiro sem necessidade.

---

# 1515. Tint multiplicativo controlado

Usar tint de forma que preserve:

- shading;
- texture variation;
- detail.

---

# 1516. Não aplicar tint em tudo

Alguns materiais precisam manter cor original.

Exemplo:

- olhos;
- metais específicos;
- logos;
- detalhes.

---

# 1517. Material Channels semânticos

O sistema já trabalha com slots como:

- pele;
- cabelo;
- roupa;
- detalhe. 

Expandir a semântica internamente quando necessário, sem quebrar compatibilidade.

Exemplo:

```text
skin
hair
fabric_primary
fabric_secondary
metal
glass
emissive
detail
```

---

# 1518. Não depender apenas do nome do material

A auditoria mostra que hoje parte da identificação usa nomes de materiais. 

Isso pode continuar como fallback.

Mas assets premium deverão preferencialmente possuir metadata explícita.

---

# 1519. Skin material como classe própria

Pele precisa de tratamento diferente de:

- plástico;
- tecido;
- metal.

---

# 1520. Skin base color

Evitar tom uniforme excessivamente chapado.

---

# 1521. Skin roughness

Definir baseline controlado.

Não:

- glossy plástico;
- matte de argila.

---

# 1522. Skin specular

Precisa existir de forma sutil.

---

# 1523. Skin regional variation

Adicionar variação leve em:

- nariz;
- bochechas;
- orelhas;
- lábios.

---

# 1524. Skin normal

Microdetalhe sutil.

---

# 1525. Skin AO

Muito controlado.

Não criar manchas pesadas em:

- olhos;
- nariz;
- boca.

---

# 1526. Subsurface-like response

Se viável, simular suavidade de pele.

Não precisa SSS completo.

Pode ser solução leve.

---

# 1527. Não quebrar performance por pele

O rosto premium precisa continuar viável em browser.

---

# 1528. Skin Material Tier

Possível estrutura:

```text
economico
standard
premium
```

Economico:
- standard material ajustado.

Premium:
- shader/material mais rico.

---

# 1529. Mesmo skin tone em todos os tiers

A aparência pode ganhar riqueza, mas não mudar identidade.

---

# 1530. Skin calibration

Usar Golden Faces para calibrar.

---

# 1531. Hair material

Cabelo precisa de família própria.

---

# 1532. Hair roughness

Diferente da pele.

---

# 1533. Hair specular

Mais direcional.

---

# 1534. Hair anisotropy

Considerar quando disponível e útil.

---

# 1535. Hair alpha

Controlado por asset.

---

# 1536. Hair color channels

Preservar root/tip quando houver.

---

# 1537. Cotton

Material de referência:

- não metálico;
- roughness alta;
- normal sutil;
- specular baixo.

---

# 1538. Denim

Precisa de:

- weave;
- roughness;
- microvariation.

---

# 1539. Wool

Mais fosco.

---

# 1540. Knit

Normal mais perceptível.

---

# 1541. Leather

Precisa responder à luz de forma mais rica.

---

# 1542. Leather variants

Exemplo:

```text
leather_matte
leather_polished
leather_worn
```

---

# 1543. Satin

Material com highlight mais forte.

---

# 1544. Silk-like

Pode usar resposta mais suave e elegante.

---

# 1545. Technical fabric

Importante para:

- esportivo;
- cyber;
- outdoor.

---

# 1546. Rubber

Precisará parecer borracha.

Não plástico preto genérico.

---

# 1547. Plastic matte

Para tecnologia.

---

# 1548. Plastic glossy

Para alguns acessórios.

---

# 1549. Metal

Metalness deve ser realmente usado.

---

# 1550. Metal escovado

Precisa de:

- roughness;
- normal/texture direcional quando apropriado.

---

# 1551. Metal polido

Mais refletivo.

---

# 1552. Gold

Não tratar como amarelo.

---

# 1553. Silver

Não tratar como cinza simples.

---

# 1554. Bronze

Pode existir.

---

# 1555. Painted metal

Separar:

```text
metal base
+
paint layer
```

conceitualmente.

---

# 1556. Armor composite

Nem toda armadura precisa ser metal.

Pode usar:

- polymer;
- carbon-like;
- ceramic;
- fabric inserts.

---

# 1557. Glass

Precisa ser tratado como material próprio.

---

# 1558. Glass roughness

Pode variar:

- clear;
- frosted;
- tinted.

---

# 1559. Glass tint

Controlado.

---

# 1560. Glass opacity

Não exagerar.

---

# 1561. Glass refraction

Se viável, simplificada.

---

# 1562. Glass fallback

Em tier econômico, usar transparência simplificada.

---

# 1563. Crystal

Pode combinar:

- transmission;
- emissive;
- environment.

---

# 1564. Hologram

Pode usar:

- transparency;
- emissive;
- scanline;
- fresnel.

---

# 1565. Energy

Não deve usar MeshStandardMaterial puro se o resultado não fizer sentido.

Pode usar shader específico.

---

# 1566. Energy Material Family

Parâmetros:

```text
core color
edge color
emissive
opacity
flow
noise
```

---

# 1567. Emissive discipline

Definir teto.

---

# 1568. Emissive intensity clamp

O sistema já possui preocupação com teto de emissive em testes. 

Preservar e formalizar.

---

# 1569. Bloom deve responder apenas ao emissive relevante

Não deixar superfícies normais bloomarem.

---

# 1570. Bloom budget

Criar limites por:

- asset;
- cena;
- raridade.

---

# 1571. VFX ≠ material

Separar:

```text
material emissive
```

de:

```text
particle/glow VFX
```

---

# 1572. Map stack

Cada material pode usar:

```text
BaseColor
Normal
Roughness
Metalness
AO
Emissive
Alpha
```

conforme necessário.

---

# 1573. Não exigir todos os mapas em todo material

Exemplo:

cotton pode não precisar metalnessMap.

---

# 1574. BaseColor map

Deve conter cor/material base sem iluminação bakeada pesada.

---

# 1575. Normal map

Para detalhes de superfície.

---

# 1576. Roughness map

Muito importante para materiais ricos.

---

# 1577. Metalness map

Somente onde há regiões metálicas.

---

# 1578. AO map

Controlado.

---

# 1579. Emissive map

Para regiões realmente emissivas.

---

# 1580. Alpha map

Para:

- hair;
- hologram;
- glass details.

---

# 1581. Texture packing

Considerar empacotar canais quando útil.

Exemplo:

```text
R = AO
G = Roughness
B = Metalness
```

se compatível com pipeline e renderer.

---

# 1582. Não introduzir packing sem ganho real

Precisa reduzir:

- requests;
- memory;
- size.

---

# 1583. Texture compression

O pipeline atual já converte texturas para WebP por LOD. 

Preservar.

---

# 1584. KTX2

Considerar como evolução futura para GPU compression.

Não bloquear esta fase.

---

# 1585. Texture resolution

A documentação atual já prevê teto por LOD. 

Usar como baseline.

---

# 1586. Category-aware texture budget

Face:
- maior.

Acessório pequeno:
- menor.

---

# 1587. Não usar 2048 automaticamente

Resolver por cobertura na tela.

---

# 1588. Texel density standard

Criar padrão.

---

# 1589. UV overlap

Permitido quando intencional.

---

# 1590. UV stretching

Reprovar quando perceptível.

---

# 1591. UDIM

Provavelmente desnecessário para runtime web nessa fase.

Não introduzir sem justificativa.

---

# 1592. Tiling materials

Úteis para:

- tecido;
- metal;
- leather;
- floor.

---

# 1593. Tiling control

Evitar padrões com escala absurda.

---

# 1594. Macro vs micro detail

Separar:

```text
macro
→ base map / geometry

micro
→ normal / tiled texture
```

---

# 1595. Detail maps

Podem ser úteis para:

- tecido;
- leather.

---

# 1596. Material variation sem duplicação

Exemplo:

```text
cotton_base
+
color
+
detail_scale
```

---

# 1597. Material Instance Concept

Criar uma camada equivalente a material instances.

```text
base family
+
params
+
textures
```

---

# 1598. Dedupe

Evitar materiais idênticos duplicados.

---

# 1599. Material cache

Reutilizar quando possível.

---

# 1600. Material ownership

Tomar cuidado com instâncias compartilhadas quando há customização.

A infraestrutura atual já possui lógica de clone/dedupe. 

Preservar.

---

# 1601. Material cloning

Clone somente quando necessário para customização local.

---

# 1602. Restore original

Ao resetar cor/material, restaurar corretamente.

---

# 1603. Não acumular material clones

Evitar memory leak.

---

# 1604. Dispose

Materiais substituídos precisam ser descartados quando necessário.

---

# 1605. Texture dispose

Mesma lógica.

---

# 1606. Environment response

Materiais premium dependem de ambiente adequado.

O renderer atual já gera environment map via `RoomEnvironment`. 

Isso é boa base.

---

# 1607. RoomEnvironment como baseline

Pode permanecer para fallback/neutro.

---

# 1608. HDRI premium

Avaliar alguns HDRIs curados.

Exemplo:

```text
studio_soft
studio_contrast
industrial
night_neon
```

---

# 1609. Licença HDRI

Rastrear.

---

# 1610. HDRI size

Otimizar.

---

# 1611. PMREM

Preservar workflow apropriado.

---

# 1612. IBL intensity

Controlar por look.

---

# 1613. Material calibration scene

Criar uma cena com:

- spheres;
- skin head;
- fabric samples;
- metal;
- glass;
- emissive.

---

# 1614. Material swatch wall

Pode existir em modo Dev.

---

# 1615. Material reference spheres

Úteis para comparar.

---

# 1616. Studio neutral light

Usar para QA.

---

# 1617. Hero light

Depois testar.

---

# 1618. Neon light

Depois testar.

---

# 1619. Dark environment

Testar.

---

# 1620. Bright environment

Testar.

---

# 1621. Material must survive multiple lights

Se só funciona em uma luz, precisa ajuste.

---

# 1622. Color Management

O renderer já define sRGB output. 

Garantir coerência ponta a ponta.

---

# 1623. Texture color space

BaseColor/emissive devem usar color space correto.

---

# 1624. Data maps

Normal/roughness/metalness/AO não devem ser tratados como sRGB.

---

# 1625. Thumbnail color management

Precisa combinar com viewport.

---

# 1626. Photo Studio

Mesma coisa.

---

# 1627. Export

Mesma coisa.

---

# 1628. ACES baseline

O renderer já usa ACES Filmic. 

Preservar como padrão.

---

# 1629. Exposure presets

Curados.

---

# 1630. Não deixar exposição individual por asset

Pode haver compensação limitada, mas não cada asset definindo exposição global arbitrária.

---

# 1631. Material brightness limits

BaseColor muito claro pode estourar.

---

# 1632. PBR-safe colors

Criar guidelines.

---

# 1633. Pure white

Evitar usar #FFFFFF em grandes superfícies quando prejudica highlight.

---

# 1634. Pure black

Evitar #000000 absoluto quando destrói detalhe.

---

# 1635. Metallic colors

Precisam seguir valores plausíveis dentro do estilo.

---

# 1636. Stylized PBR

O objetivo não é simulação física perfeita.

É:

> resposta consistente e visualmente convincente.

---

# 1637. Artistic override permitido

Quando necessário para direção artística.

Mas documentado.

---

# 1638. Não quebrar coerência

Exemplo:

um metal fantasy pode ser mais saturado, mas ainda precisa parecer metal.

---

# 1639. Rim response

Materiais devem responder bem à rim light.

---

# 1640. Skin rim

Mais suave.

---

# 1641. Metal rim

Mais forte.

---

# 1642. Hair rim

Muito importante para silhouette.

---

# 1643. Glass rim

Ajuda leitura.

---

# 1644. Material transitions

Ao trocar material em runtime, evitar popping visual abrupto quando possível.

---

# 1645. Color interpolation

Pode usar transição curta.

---

# 1646. Roughness interpolation

Também.

---

# 1647. Não interpolar textura pesada desnecessariamente

Fade pode bastar.

---

# 1648. Preview vs confirm

Hover pode aplicar material temporário.

---

# 1649. Undo/redo

Material changes devem entrar no histórico.

---

# 1650. Material presets

Exemplo:

```text
Fosco
Tecido
Couro
Metálico
Brilhante
Tecnológico
```

---

# 1651. Advanced sliders

Modo avançado pode mostrar:

- brilho;
- metal;
- emissive.

---

# 1652. Não expor technical jargon

O usuário comum não precisa ver:

- IOR;
- anisotropy;
- normalScale.

---

# 1653. UI de material contextual

Só mostrar controles compatíveis.

---

# 1654. Exemplo: camiseta

Mostra:

- cor;
- tecido.

---

# 1655. Exemplo: coroa

Mostra:

- metal;
- pedra;
- detalhe;
- emissive se houver.

---

# 1656. Exemplo: óculos

Mostra:

- armação;
- lente.

---

# 1657. Exemplo: cabelo

Mostra:

- cor;
- secondary color se suportado.

---

# 1658. Material inspector em Dev Mode

Mostrar:

```text
material family
maps
resolution
roughness
metalness
emissive
draw calls
```

---

# 1659. Debug Views

Adicionar:

```text
Albedo
Normal
Roughness
Metalness
AO
Emissive
UV
Lighting Only
```

---

# 1660. Roughness Debug

Fundamental para detectar materiais chapados.

---

# 1661. Metalness Debug

Detectar regiões incorretas.

---

# 1662. Normal Debug

Detectar mapas invertidos ou intensos demais.

---

# 1663. UV Debug

Detectar stretching.

---

# 1664. Lighting Only

Separar problema de material de problema de luz.

---

# 1665. Material QA — Skin

Testar:

- três tons;
- Studio;
- Hero;
- Neon;
- Portrait.

---

# 1666. Material QA — Fabric

Testar:

- cotton;
- denim;
- leather;
- technical;
- satin.

---

# 1667. Material QA — Metal

Testar:

- gold;
- silver;
- brushed;
- polished.

---

# 1668. Material QA — Transparent

Testar:

- clear;
- tinted;
- hologram.

---

# 1669. Material QA — Emissive

Testar com bloom.

---

# 1670. Material QA — LOD

Verificar mapas por LOD.

---

# 1671. Material QA — Color variations

Cor personalizada não pode destruir material.

---

# 1672. Hard Fail

Reprovar se:

- pele parece plástico de forma evidente;
- metal parece tinta;
- vidro parece plástico transparente;
- roughness incorreta destrói leitura;
- normal map invertido;
- textura ausente;
- color space errado;
- emissive estoura cena;
- material muda radicalmente entre LODs;
- cor customizada remove textura.

---

# 1673. Soft Fail

Exemplos:

- pequena perda de microdetail no LOD2;
- diferença mínima de reflection.

---

# 1674. Golden Material Set

Criar amostras oficiais:

```text
M01 Skin Light
M02 Skin Medium
M03 Skin Dark
M04 Cotton
M05 Denim
M06 Leather
M07 Technical Fabric
M08 Metal Brushed
M09 Gold
M10 Glass
M11 Crystal
M12 Emissive
```

---

# 1675. Material benchmark renders

Mesma luz e câmera.

---

# 1676. Before/After

Comparar material atual e novo.

---

# 1677. Não usar assets diferentes na comparação

Mesma geometria sempre que possível.

---

# 1678. Material Library

Criar biblioteca interna reutilizável.

---

# 1679. Material Versioning

Cada family pode ter versão.

---

# 1680. Não mudar todos os assets silenciosamente

Upgrade de material family pode alterar muitos assets.

Precisa regressão visual.

---

# 1681. Material family rollout

Usar:

```text
v1
v2
```

quando necessário.

---

# 1682. Golden scenes antes de atualizar family global

Obrigatório.

---

# 1683. Visual Regression

Capturar Golden Avatars antes/depois.

---

# 1684. Material diff

Pode haver comparação automática de screenshots.

---

# 1685. Threshold

Não aprovar apenas por pixel diff.

Revisão visual humana continua.

---

# 1686. Performance budgets

Material também consome performance.

---

# 1687. Texture memory

Medir.

---

# 1688. Shader complexity

Medir.

---

# 1689. Transparent overdraw

Medir.

---

# 1690. Material count

Medir.

---

# 1691. Quality tiers

Economico:
- menos mapas;
- menos transparency complexity;
- sem shaders avançados opcionais.

---

# 1692. Standard

- PBR completo principal;
- environment;
- normal/roughness.

---

# 1693. Ultra

- melhores effects;
- advanced hair/skin;
- higher env quality.

---

# 1694. Mesmo asset, mesma identidade

Tier muda riqueza, não design.

---

# 1695. Fallback material

Se shader falhar, usar fallback previsível.

---

# 1696. WebGL context recovery

Materiais/texturas precisam restaurar corretamente após context loss.

---

# 1697. O projeto já possui lógica de reaplicação de estado após restauração

A auditoria indica preocupação com re-upload de texturas/LOD após recuperação do contexto. 

Preservar e testar materiais premium nesse cenário.

---

# 1698. Missing texture fallback

Nunca deixar asset branco puro ou preto sem explicação.

---

# 1699. Fallback color

Pode usar baseColor do manifest.

---

# 1700. Error telemetry

Registrar:

- missing map;
- decode error;
- shader compile;
- unsupported feature.

---

# 1701. Material import pipeline

Ao publicar asset, validar mapas.

---

# 1702. Naming convention

Exemplo:

```text
asset_basecolor.webp
asset_normal.webp
asset_roughness.webp
asset_metalness.webp
asset_ao.webp
asset_emissive.webp
```

Se texturas estiverem embutidas, manter metadata equivalente.

---

# 1703. Não depender de nomes apenas

Manifest deve saber funções.

---

# 1704. Texture validation

Verificar:

- size;
- dimensions;
- alpha;
- color space metadata quando possível.

---

# 1705. Normal map format

Padronizar convenção.

---

# 1706. Roughness range

Evitar mapas totalmente extremos sem intenção.

---

# 1707. Metalness validation

Idealmente metalness deve ser predominantemente 0/1 em materiais físicos, com liberdade estilizada onde necessário.

---

# 1708. AO strength

Não exagerar.

---

# 1709. Emissive map validation

Evitar grandes áreas brancas se isso estourar.

---

# 1710. Alpha validation

Especialmente hair/glass.

---

# 1711. Texture LOD generation

O pipeline atual já reduz resolução por LOD. 

Continuar.

---

# 1712. Mipmaps

Garantir.

---

# 1713. Anisotropic filtering

Avaliar para superfícies em ângulo quando útil.

---

# 1714. Max anisotropy

Não aplicar máximo global sem necessidade.

---

# 1715. Material presets por coleção

Coleções podem apontar para famílias.

---

# 1716. Cyber Collection

Exemplo:

```text
technical_fabric
metal_dark
emissive_cyan
glass_smoke
```

---

# 1717. Royal Collection

```text
velvet-like
gold
crystal
leather
```

---

# 1718. Urban Collection

```text
cotton
denim
leather
rubber
```

---

# 1719. Sport Collection

```text
technical_fabric
mesh
rubber
plastic
```

---

# 1720. Não duplicar shader por coleção

Reutilizar material families.

---

# 1721. Material art direction

Coleção altera parâmetros e combinações, não arquitetura.

---

# 1722. 2D Classic — Materialidade

O modo clássico também precisa ganhar linguagem material mais rica.

---

# 1723. 2D skin

Usar:

- gradiente;
- shadow;
- highlight.

---

# 1724. 2D cotton

Mais fosco, pouco highlight.

---

# 1725. 2D leather

Highlight mais definido.

---

# 1726. 2D metal

Gradiente + highlight + rim.

---

# 1727. 2D glass

Transparência + highlight.

---

# 1728. 2D emissive

Glow controlado.

---

# 1729. 2D roughness equivalent

Não existe roughness física, mas pode ser simulada via highlight/shading.

---

# 1730. 2D material tokens

Criar presets de estilo.

---

# 1731. Não usar um gradiente genérico para tudo

Esse é exatamente um dos problemas do visual atual.

---

# 1732. Material coherence entre 2D e 3D

Leather deve parecer leather nos dois, mesmo com técnicas diferentes.

---

# 1733. Color identity cross-renderer

Cor selecionada precisa se manter próxima.

---

# 1734. Não exigir igualdade pixel-perfect

Tone mapping e renderer são diferentes.

---

# 1735. Golden Material Classic Set

Criar equivalentes:

- skin;
- cotton;
- leather;
- metal;
- glass;
- emissive.

---

# 1736. Photo Studio

Material é fundamental em captura.

---

# 1737. Photo quality

Usar:

- high LOD;
- high texture;
- environment melhor;
- shadow melhor.

---

# 1738. Portrait skin

Face precisa receber tratamento especial.

---

# 1739. Product-style accessory shot

Pode existir para acessórios Hero.

---

# 1740. Material-aware light preset

Exemplo:

- metal showcase;
- skin portrait;
- fabric studio.

---

# 1741. Não mudar material na foto

Somente iluminação.

---

# 1742. Export color management

Garantir consistência.

---

# 1743. Transparent background export

Precisa preservar:

- glass;
- hair;
- emissive edges.

---

# 1744. Premultiplied alpha capture

Testar.

---

# 1745. Material QA Score

Sugestão:

```text
Physical Readability   9/10
Art Direction          9/10
Color Fidelity         9/10
Lighting Response      9/10
LOD Continuity         9/10
Performance            8/10
Customization          9/10
Cross-renderer         8/10
```

---

# 1746. Golden Material Gate

Não ampliar biblioteca premium antes de aprovar:

```text
SKIN
+
HAIR
+
COTTON
+
LEATHER
+
METAL
+
GLASS
+
EMISSIVE
```

---

# 1747. Art Bible

Criar capítulo completo com:

- material families;
- roughness guidelines;
- metalness;
- maps;
- color;
- environment;
- emissive;
- alpha;
- 2D equivalents.

---

# 1748. Anti-patterns

Documentar:

```text
❌ tudo glossy
❌ metal = cinza brilhante
❌ ouro = amarelo
❌ vidro = opacity 0.3 sem reflexão
❌ pele = plástico
❌ couro = cor marrom apenas
❌ algodão com highlight metálico
❌ emissive sem limite
❌ normal map exagerado
❌ AO preto pesado
❌ textura bakeada com luz direcional
```

---

# 1749. Deliverables obrigatórios da Parte 7

O agente deverá entregar:

1. auditoria dos materiais atuais;
2. Material Family Registry;
3. Skin Material;
4. Hair Material;
5. Fabric Families;
6. Leather;
7. Metal Families;
8. Glass;
9. Crystal;
10. Emissive/Energy;
11. Texture Map Contract;
12. Color Space Contract;
13. Environment Strategy;
14. Material Debug Views;
15. Golden Material Set;
16. LOD material strategy;
17. Performance budgets;
18. 2D equivalents;
19. Photo Studio integration;
20. Before/After;
21. Art Bible update;
22. Visual QA.

---

# 1750. Ordem recomendada

```text
AUDIT MATERIALS
↓
MATERIAL REGISTRY
↓
SKIN
↓
HAIR
↓
FABRICS
↓
METALS
↓
GLASS
↓
EMISSIVE
↓
TEXTURE PIPELINE
↓
COLOR MANAGEMENT
↓
LOD
↓
CLASSIC 2D
↓
VISUAL QA
```

---

# 1751. Gate final da Parte 7

A nova geração de assets só deverá escalar quando:

```text
MATERIAL REGISTRY
+
SKIN
+
HAIR
+
FABRIC
+
METAL
+
GLASS
+
COLOR MANAGEMENT
+
VISUAL QA
```

estiverem aprovados.

---

# 1752. Resultado esperado da Parte 7

Ao final desta etapa, o usuário deverá conseguir perceber visualmente:

> “isso é pele”  
> “isso é algodão”  
> “isso é couro”  
> “isso é metal”  
> “isso é vidro”

sem depender do texto da interface.

A infraestrutura já suporta boa parte dos recursos PBR necessários. 

A missão desta parte é transformar esse suporte técnico em **uma linguagem material unificada, previsível e premium**.

---

## FIM DA PARTE 7/12

**Próxima: PARTE 8/12 — ILUMINAÇÃO CINEMATOGRÁFICA, SOMBRAS, AMBIENTE, HDRI, CÂMERA, ENQUADRAMENTO, PROFUNDIDADE, PÓS-PROCESSAMENTO, TONE MAPPING E LOOKS PREMIUM.**





# MEGA BRIEFING — ELEVAÇÃO GRÁFICA AAA DO AVATAR STUDIO DSHOW  
## PARTE 8/12 — ILUMINAÇÃO CINEMATOGRÁFICA, SOMBRAS, AMBIENTE, HDRI, CÂMERA, ENQUADRAMENTO, PROFUNDIDADE, PÓS-PROCESSAMENTO, TONE MAPPING E LOOKS PREMIUM

# 1753. Objetivo da Parte 8

Esta parte deverá transformar a apresentação visual do Avatar Studio.

Não basta possuir modelos melhores se eles forem apresentados com:

- luz genérica;
- fundo vazio;
- câmera sem intenção;
- sombras pouco convincentes;
- exposição inconsistente;
- bloom excessivo;
- pouca separação entre personagem e cenário;
- enquadramento fraco.

A auditoria mostrou que a infraestrutura já contém recursos importantes:

- `RoomEnvironment`;
- `EffectComposer`;
- `UnrealBloomPass`;
- `SRGBColorSpace`;
- `ACESFilmicToneMapping`;
- exposição ajustável. 

Portanto, a missão desta parte é **curar e estruturar a cinematografia do sistema**, não reinventar o renderer.

---

# 1754. Princípio central: apresentação faz parte do asset

O mesmo personagem pode parecer:

- amador;
- bom;
- premium;

dependendo de como é apresentado.

Logo:

```text
MODEL QUALITY
+
MATERIAL QUALITY
+
LIGHTING
+
CAMERA
+
BACKGROUND
+
POST
=
FINAL PERCEPTION
```

---

# 1755. Não usar iluminação para esconder asset ruim

A ordem continua:

```text
GEOMETRY
↓
MATERIAL
↓
LIGHT
↓
POST
```

Nunca:

```text
BAD MODEL
+
MORE BLOOM
=
PREMIUM
```

---

# 1756. Criar um Lighting System formal

A iluminação deverá possuir presets oficiais.

No mínimo:

```text
Studio
Portrait
Hero
Dramatic
Neon
Soft
Product
```

O catálogo atual já trabalha com `estudio`, `dramatica` e `neon`. 

Esses presets deverão evoluir para rigs realmente distintos.

---

# 1757. Studio

Será o preset técnico/artístico neutro.

Objetivos:

- avaliar geometria;
- avaliar material;
- revelar clipping;
- boa leitura facial;
- baixo dramatismo.

---

# 1758. Studio Light Rig

Sugestão conceitual:

```text
Key
+
Fill
+
Soft Rim
+
Environment
```

Sem efeitos agressivos.

---

# 1759. Portrait

Focado em rosto.

Precisa:

- pele suave;
- catchlight;
- boa separação de cabelo;
- shadow controlada.

---

# 1760. Hero

Mais impacto.

Pode usar:

- key direcional;
- rim mais forte;
- contraste;
- fundo profundo.

---

# 1761. Dramatic

Pode aumentar:

- sombras;
- contraste;
- direção da luz.

Mas rosto precisa continuar legível.

---

# 1762. Neon

Pode usar:

- luzes coloridas;
- emissive;
- rim;
- bloom.

Mas precisa preservar pele e materiais.

---

# 1763. Product

Útil para:

- acessórios;
- materiais;
- joias;
- props.

Pode usar iluminação semelhante a fotografia de produto.

---

# 1764. Soft

Pode ser útil para:

- onboarding;
- avatar default;
- visual amigável.

---

# 1765. Lighting Registry

Criar definição central.

Conceitualmente:

```ts
interface LightingPreset {
  id: string;
  key: LightConfig;
  fill?: LightConfig;
  rim?: LightConfig;
  environment: string;
  exposure: number;
  background: string;
}
```

Adaptar à arquitetura real.

---

# 1766. Não espalhar parâmetros de luz

Centralizar.

---

# 1767. Light intensity units

Definir padrão coerente internamente.

---

# 1768. Key Light

Principal responsável pela modelagem.

---

# 1769. Fill Light

Controla contraste.

---

# 1770. Rim Light

Importante para:

- cabelo;
- ombros;
- silhouette.

---

# 1771. Hair Rim

Pode ser levemente mais forte em cabelos escuros.

Mas não ajustar individualmente por asset sem limite.

---

# 1772. Skin response

Pele não pode ficar brilhante demais em Hero/Neon.

---

# 1773. Metal response

Metal precisa receber environment/reflections suficientes.

---

# 1774. Glass response

Precisa de highlights para ser legível.

---

# 1775. Shadow System

Sombras deverão receber revisão completa.

---

# 1776. Contact Shadow

Fundamental para ancorar o personagem.

---

# 1777. Foot Contact

Pés devem tocar visualmente o chão.

---

# 1778. Accessory Shadow

Objetos grandes precisam lançar/receber sombra quando apropriado.

---

# 1779. Hair Shadow

Cabelo deve criar sombra sobre:

- testa;
- face;
- pescoço.

---

# 1780. Clothing Shadow

Camadas de roupa precisam produzir contato.

---

# 1781. Shadow softness

Studio:
- mais suave.

Hero:
- pode ser mais definida.

---

# 1782. Shadow resolution

Deve variar por quality tier.

---

# 1783. Shadow acne

Hard Fail.

---

# 1784. Peter-panning

Hard Fail se evidente.

---

# 1785. Bias

Padronizar por cena/preset.

---

# 1786. Cascaded Shadows

Provavelmente desnecessário para o palco principal.

Não implementar sem justificativa.

---

# 1787. AO

Pode complementar contato.

Mas não substituir shadow.

---

# 1788. SSAO

Avaliar custo/benefício.

Se introduzido, usar de forma sutil.

---

# 1789. Não escurecer cavidades excessivamente

Evitar “jogo antigo” com AO pesado.

---

# 1790. Ground Plane

O chão deverá ajudar a ancorar personagem.

---

# 1791. Ground Materials

Possíveis:

```text
studio_matte
studio_gloss
platform
grid
```

---

# 1792. Ground Reflection

Pode existir em looks especiais.

---

# 1793. Reflection subtlety

Não transformar tudo em chão espelhado.

---

# 1794. Platform

Uma plataforma leve pode valorizar apresentação.

---

# 1795. Stage Identity

O palco deve parecer parte do produto Dshow.

---

# 1796. Background Layering

Criar profundidade com:

- gradient;
- geometry;
- environment;
- atmosphere.

---

# 1797. Background não pode competir

Foco sempre no avatar.

---

# 1798. Neutral Background

Deve ser benchmark.

---

# 1799. Hero Background

Pode ser mais cinematográfico.

---

# 1800. Neon Background

Pode usar luzes abstratas.

---

# 1801. Theme-aware background

Coleções podem possuir presets.

---

# 1802. HDRI Strategy

Avaliar HDRIs curados para:

- studio;
- industrial;
- soft;
- night.

---

# 1803. HDRI license

Rastrear.

---

# 1804. HDRI optimization

Usar resolução adequada.

---

# 1805. Environment map não precisa aparecer visualmente

Pode servir apenas para iluminação/reflexo.

---

# 1806. Background separado de Environment

Importante.

Podemos ter:

```text
Environment = studio HDRI
Background = gradient Dshow
```

---

# 1807. Environment intensity

Controlar por preset.

---

# 1808. Material-specific environment

Evitar trocar environment por asset individual.

---

# 1809. Camera System

A câmera é um dos maiores multiplicadores de qualidade.

O catálogo atual já possui presets:

- `corpo`;
- `busto`;
- `rosto`;
- `tresquartos`;

com posições diferentes por arquétipo. 

Preservar e refinar.

---

# 1810. Camera Presets oficiais

Estruturar:

```text
Full Body
¾
Bust
Portrait
Face Detail
Accessory
Back
Photo
```

---

# 1811. Full Body

Mostrar:

- cabeça;
- pés;
- silhouette.

---

# 1812. ¾

Excelente para:

- outfit;
- volume;
- materiais.

---

# 1813. Bust

Foco:

- rosto;
- cabelo;
- torso.

---

# 1814. Portrait

Foco em rosto.

---

# 1815. Face Detail

Para:

- olhos;
- boca;
- sobrancelhas.

---

# 1816. Back

Para:

- cabelo longo;
- mochila;
- asas.

---

# 1817. Accessory Camera

Adaptativa por slot.

---

# 1818. Camera by category

Como já especificado:

```text
Hair → Bust
Eyes → Face
Mouth → Face Detail
Clothing → ¾
Shoes → Lower Body
Back Accessory → Back
Pet → Full Body Wide
```

---

# 1819. FOV

Definir cuidadosamente.

---

# 1820. Portrait FOV

Evitar grande-angular.

A documentação já prevê referência equivalente a 85 mm para retrato premium. 

Implementar aproximação visual coerente.

---

# 1821. Full-body FOV

Pode ser um pouco mais amplo.

---

# 1822. Não distorcer pernas

Evitar câmera baixa/angular sem intenção.

---

# 1823. Headroom

Padronizar.

---

# 1824. Footroom

Padronizar.

---

# 1825. Eye line

Portrait precisa posicionar olhos em região agradável do frame.

---

# 1826. Camera target

Não usar target fixo para todos os personagens.

Considerar bounds/arquetipo.

---

# 1827. Camera auto framing

Usar bounds.

---

# 1828. Bounds-aware framing

Se asas forem equipadas, câmera pode ajustar.

---

# 1829. Accessory-aware framing

Mesma lógica para:

- pet;
- companion;
- props.

---

# 1830. Morph-aware framing

Personagem mais alto/largo precisa continuar enquadrado.

---

# 1831. Camera transitions

Precisam ser suaves.

---

# 1832. Duration

Curta.

Evitar esperar 1 segundo toda vez.

---

# 1833. Easing

Natural.

---

# 1834. Interruptible camera

Se usuário interagir durante transição, permitir interrupção.

---

# 1835. Orbit Controls

Usuário precisa poder:

- girar;
- aproximar;
- afastar.

---

# 1836. Limits

Definir:

- min distance;
- max distance;
- polar angles.

---

# 1837. Não permitir câmera entrar dentro do rosto

---

# 1838. Não permitir câmera atravessar chão

---

# 1839. Focus Lock

Durante edição facial, pode haver limite de orbit mais restrito.

---

# 1840. Free Camera

Photo Studio pode liberar mais.

---

# 1841. Camera bookmarks

Usuário pode retornar rapidamente para:

- Full;
- Bust;
- Face;
- Back.

---

# 1842. Camera state

Preservar quando troca asset na mesma categoria.

---

# 1843. Não resetar câmera constantemente

Isso já foi identificado como ponto importante de UX.

---

# 1844. Manual zoom

Precisa permanecer estável.

---

# 1845. Zoom no rosto

Obrigatório.

---

# 1846. Camera Quality QA

Testar com:

- male;
- female;
- tall;
- wide;
- pet;
- wings.

---

# 1847. Camera clipping

Hard Fail se asset corta frame sem intenção.

---

# 1848. Near plane

Ajustar para close-up.

---

# 1849. Far plane

Não exagerar.

---

# 1850. Depth Precision

Evitar z-fighting.

---

# 1851. Depth of Field

Pode elevar muito Photo Studio.

Mas não é obrigatório no editor principal.

---

# 1852. DOF no Portrait

Foco nos olhos.

---

# 1853. DOF Strength

Sutil.

---

# 1854. Não desfocar cabelo frontal excessivamente

---

# 1855. DOF performance

Pode ser Ultra/Photo only.

---

# 1856. Motion Blur

Provavelmente desnecessário no editor.

Pode existir em captura cinematográfica futura.

---

# 1857. Vignette

Extremamente sutil.

---

# 1858. Bloom

O renderer atual já possui UnrealBloomPass com configuração sutil. 

Preservar filosofia de moderação.

---

# 1859. Bloom target

Principalmente:

- emissive;
- energy;
- neon.

---

# 1860. Bloom threshold

Evitar superfícies claras normais bloomarem.

---

# 1861. Bloom strength

Por look, não por asset arbitrário.

---

# 1862. Chromatic Aberration

Evitar no editor principal.

Pode ser VFX temático muito sutil.

---

# 1863. Film Grain

Provavelmente desnecessário.

Se usado no Photo Studio, mínimo.

---

# 1864. Color Grading

Pode ser importante.

---

# 1865. Look LUTs

Avaliar LUTs leves para:

- Studio;
- Hero;
- Neon;
- Portrait.

---

# 1866. Não destruir skin tone

Qualquer color grading precisa preservar pele.

---

# 1867. Saturation

Controlada.

---

# 1868. Contrast

Controlado.

---

# 1869. Blacks

Não esmagar.

---

# 1870. Highlights

Não clipar.

---

# 1871. ACES Filmic

Já existe e deverá continuar como baseline salvo razão técnica forte. 

---

# 1872. Tone Mapping modes

Modo Dev pode permitir comparar.

Usuário normal não precisa.

---

# 1873. Exposure

Criar valor por look.

---

# 1874. Exposure clamp

Manter faixa segura.

A infraestrutura atual já limita exposição. 

---

# 1875. Auto exposure

Evitar inicialmente.

Pode causar instabilidade visual.

---

# 1876. Scene luminance

Manter relativamente previsível.

---

# 1877. Emissive compensation

Não ajustar exposição global por cada asset.

---

# 1878. Color Space

Preservar `SRGBColorSpace`. 

---

# 1879. Gamma

Não aplicar correções duplicadas.

---

# 1880. Thumbnail color consistency

Obrigatório.

---

# 1881. Preview color consistency

Obrigatório.

---

# 1882. Capture color consistency

Obrigatório.

---

# 1883. Transparent export

Precisa manter color management.

---

# 1884. Alpha edge

Testar especialmente:

- hair;
- glass;
- emissive.

---

# 1885. Ambient Atmosphere

A cena pode ganhar leve atmosfera.

---

# 1886. Fog

Pode funcionar em Hero/Fantasy.

---

# 1887. Não usar fog no Studio

---

# 1888. Depth layering

Pode usar geometria/fundo em diferentes planos.

---

# 1889. Parallax

Pode aumentar profundidade no 2D/2.5D.

---

# 1890. Camera movement idle

Evitar câmera respirando/mexendo no editor.

Avatar deve mover, câmera deve ficar estável.

---

# 1891. Cinematic intro

Pode existir ao entrar no estúdio.

Mas curto e opcional.

---

# 1892. Hero reveal

Pode mostrar avatar com câmera suave.

---

# 1893. Não repetir animação toda vez

Somente primeira entrada ou ação específica.

---

# 1894. Photo Studio Cinematography

Aqui a câmera pode ser mais rica.

---

# 1895. Photo Lens Presets

Exemplo:

```text
Portrait
Full Body
Fashion
Wide Hero
Profile
Close-up
```

---

# 1896. Portrait

Lente longa.

---

# 1897. Fashion

Full-body com perspectiva controlada.

---

# 1898. Wide Hero

Pode ter leve dramaticidade.

---

# 1899. Profile

Perfil facial.

---

# 1900. Close-up

Olhos/rosto.

---

# 1901. Composition Guides

Photo Studio pode oferecer:

- rule of thirds;
- center;
- safe area.

---

# 1902. Grid

Opcional.

---

# 1903. Aspect Ratios

Preparar:

```text
1:1
4:5
16:9
9:16
```

---

# 1904. Camera adapts to aspect ratio

Não simplesmente cortar.

---

# 1905. Portrait vertical

Muito importante para redes sociais.

---

# 1906. Hero landscape

Para banners/perfil.

---

# 1907. Background positioning

Adaptar.

---

# 1908. Pet/companion positioning

Adaptar ao aspect ratio.

---

# 1909. Safe zones

Evitar cortar asas/pets.

---

# 1910. Lighting per Photo preset

Pode variar.

---

# 1911. Photo Studio high-quality mode

O projeto já prevê captura em LOD alto e supersampling. 

Essa lógica deverá ser expandida.

---

# 1912. Supersampling

Manter temporário.

---

# 1913. Restore realtime tier after capture

Obrigatório.

---

# 1914. High shadow capture

Pode aumentar resolução temporariamente.

---

# 1915. Better post capture

Pode habilitar alguns efeitos somente na captura.

---

# 1916. Capture must remain deterministic

Mesma config + mesma pose + mesma câmera = mesmo resultado dentro da versão do renderer.

---

# 1917. Golden Lighting Set

Criar renders padrão:

```text
Studio
Portrait
Hero
Dramatic
Neon
Product
```

---

# 1918. Golden Avatar under all looks

Usar:

- Golden Male;
- Golden Female;
- Dark Skin;
- Light Skin;
- Dark Hair;
- Light Hair.

---

# 1919. Material coverage

Testar:

- cotton;
- metal;
- glass;
- emissive.

---

# 1920. Lighting Matrix

Criar matriz:

```text
skin_light × Studio
skin_dark × Studio
skin_light × Hero
skin_dark × Hero
metal × Product
glass × Product
hair_dark × Portrait
```

---

# 1921. Hard Fail de iluminação

Reprovar look se:

- pele estoura;
- olho fica totalmente escuro;
- cabelo preto desaparece;
- cabelo claro explode;
- metal parece plástico;
- glass desaparece;
- sombra desconecta pés;
- face perde legibilidade.

---

# 1922. Soft Fail

Exemplos:

- rim ligeiramente forte;
- highlight secundário.

---

# 1923. Lighting Score

Sugestão:

```text
Face Readability      9/10
Material Readability  9/10
Depth                 9/10
Silhouette            9/10
Skin Fidelity         9/10
Mood                  9/10
Performance           8/10
```

---

# 1924. Camera Score

```text
Composition           9/10
Distortion            9/10
Framing               9/10
Category Fit          9/10
Transitions           8/10
Manual Control        9/10
```

---

# 1925. Post-process Score

```text
Subtlety              9/10
Readability           9/10
Performance           8/10
Material Preservation 9/10
Skin Preservation     9/10
```

---

# 1926. Quality Tiers

Economico:

- simpler shadows;
- reduced post;
- lower DPR;
- simplified environment.

---

# 1927. Standard

- full main lighting;
- shadows;
- environment;
- subtle bloom.

---

# 1928. Ultra

- higher DPR;
- better shadows;
- enhanced post;
- advanced effects.

---

# 1929. Não remover key light em econômico

O avatar precisa continuar bom.

---

# 1930. Degradação deve preservar rosto

---

# 1931. Shadow tier

Reduzir resolução primeiro.

---

# 1932. Bloom tier

Pode desligar.

---

# 1933. DOF tier

Photo/Ultra only.

---

# 1934. HDRI tier

Pode reduzir resolução.

---

# 1935. Particle lighting

Pode simplificar.

---

# 1936. Dynamic quality

Evitar troca perceptível.

---

# 1937. Hysteresis

Aplicar.

A documentação atual já prevê preocupação com transições e histerese em LOD. 

A mesma filosofia vale para qualidade visual.

---

# 1938. No rapid quality oscillation

Hard Fail.

---

# 1939. FPS telemetry

Modo Dev deve mostrar.

---

# 1940. GPU cost by pass

Se possível:

- shadow;
- post;
- particles.

---

# 1941. Post pass toggles Dev

Permitir ligar/desligar.

---

# 1942. Lighting Debug

Mostrar:

- key;
- fill;
- rim;
- shadow;
- environment.

---

# 1943. Light helpers

Dev only.

---

# 1944. Shadow map debug

Dev only.

---

# 1945. Exposure debug

Dev only.

---

# 1946. Tone mapping debug

Dev only.

---

# 1947. Before/After

Comparar:

```text
Current Default
vs
New Studio
```

mesmo avatar.

---

# 1948. Outra comparação

```text
Current 3D
vs
New Hero
```

---

# 1949. Não alterar asset na comparação

---

# 1950. Classic 2D — iluminação

O modo clássico também precisa de stage lighting.

---

# 1951. 2D Key Light

Simulada via gradientes/máscaras.

---

# 1952. 2D Rim

Pode ser highlight de silhueta.

---

# 1953. 2D Contact Shadow

Fundamental.

---

# 1954. 2D Ground

Avatar precisa parecer ancorado.

---

# 1955. 2D Background Depth

Usar:

- gradients;
- layers;
- blur;
- parallax.

---

# 1956. 2D Hero Look

Pode ter contraste maior.

---

# 1957. 2D Neon Look

Glow seletivo.

---

# 1958. 2D Portrait

Foco facial.

---

# 1959. 2D Camera equivalent

Embora seja SVG/canvas, o enquadramento deve seguir presets.

---

# 1960. Cross-renderer look naming

`Studio`, `Hero`, `Neon` devem significar linguagem semelhante nos dois modos.

---

# 1961. Não exigir comportamento idêntico

As técnicas são diferentes.

---

# 1962. Stage transitions

Ao trocar cenário/look:

- fade;
- light interpolation.

---

# 1963. Não flashar fundo

---

# 1964. Lighting interpolation

Pode ser curta.

---

# 1965. Shadow interpolation

Cuidado para não custar muito.

---

# 1966. Environment transition

Pode fazer fade visual.

---

# 1967. Camera transition

Sincronizar com look quando preset completo é aplicado.

---

# 1968. Preset cinematográfico completo

Pode conter:

```text
camera
lighting
environment
background
post
pose
```

---

# 1969. Look Presets

Exemplo:

```text
Studio Neutral
Portrait Soft
Hero Purple
Cyber Neon
Royal Gold
Dark Dramatic
```

---

# 1970. Não deixar todos looks roxos

A identidade Dshow não deve virar monotonia.

---

# 1971. Purple as accent

Não como obrigação.

---

# 1972. Golden accent

Pode aparecer em Royal/Hero.

---

# 1973. Color harmony

Look deve harmonizar com avatar.

---

# 1974. Automatic contrast helper

Opcionalmente, detectar se avatar está se perdendo no fundo.

---

# 1975. Não recolorir avatar automaticamente

Pode ajustar fundo/rim, não identidade.

---

# 1976. Dark Hair Contrast

Aumentar rim se necessário.

---

# 1977. Light Hair Contrast

Reduzir highlight se necessário.

---

# 1978. Dark Outfit

Evitar perda de detalhe.

---

# 1979. White Outfit

Proteger highlight.

---

# 1980. Accessibility

Garantir boa legibilidade do avatar em diferentes telas.

---

# 1981. Display variability

Não podemos controlar monitor do usuário.

Mas baseline deve ser robusto.

---

# 1982. Mobile screen

Avatar precisa continuar legível.

---

# 1983. High-DPI

Usar DPR apropriado.

---

# 1984. DPR tiers

O projeto já possui lógica de DPR e quality presets. 

Preservar.

---

# 1985. No unnecessary DPR 3 in realtime

Reservar para captura/Ultra quando adequado.

---

# 1986. Dynamic DPR

Pode existir, mas com estabilidade.

---

# 1987. Anti-aliasing

Revisar.

---

# 1988. MSAA

Se disponível e viável.

---

# 1989. FXAA/SMAA

Avaliar apenas se houver ganho.

---

# 1990. Hair edges

AA é especialmente importante.

---

# 1991. Alpha-to-coverage

Pode ajudar hair cards em alguns contextos.

Avaliar.

---

# 1992. Transparent objects

Precisam QA com AA.

---

# 1993. Post chain ordering

Documentar ordem.

Conceitualmente:

```text
Render
→ AO optional
→ Bloom
→ Color Grade
→ Vignette
→ Output
```

---

# 1994. Não adicionar passes sem necessidade

Cada pass tem custo.

---

# 1995. Composer bypass

Em econômico, poder renderizar direto.

---

# 1996. Post processing failures

Fallback sem composer.

---

# 1997. Context loss

Ao recuperar WebGL, restabelecer:

- environment;
- composer;
- tone mapping;
- shadows;
- textures.

A auditoria já mostra lógica de restauração parcial no renderer. 

Expandir testes.

---

# 1998. Lighting state persistence

Salvar apenas quando o usuário escolhe look/preset.

Não salvar parâmetros internos temporários.

---

# 1999. Camera state persistence

Decidir por contexto:

- editor pode lembrar camera;
- avatar config não precisa necessariamente guardar orbit arbitrário.

---

# 2000. Photo camera persistence

Pode guardar no Photo Studio.

---

# 2001. Versioning

Looks precisam de versão.

---

# 2002. Updating a look

Se `Hero v2` mudar drasticamente, avaliar compatibilidade de fotos salvas.

---

# 2003. Deterministic render

Config versionada.

---

# 2004. Look metadata

Exemplo:

```text
id
version
lighting
environment
camera
post
qualityRequirement
```

---

# 2005. CMS futuro

Looks podem ser geridos como dados.

---

# 2006. Não hardcode em 20 componentes

---

# 2007. Screenshot automation

Gerar Golden images automaticamente.

---

# 2008. Lighting regression

Comparar visualmente.

---

# 2009. Camera regression

Verificar framing.

---

# 2010. Snapshot metrics

Registrar:

- exposure;
- camera FOV;
- camera position;
- env;
- light values.

---

# 2011. QA environment

Usar viewport fixo para baseline.

---

# 2012. Browser consistency

Testar:

- Chromium;
- Safari quando possível.

---

# 2013. Mobile Safari

Especialmente relevante para WebGL.

---

# 2014. WebGL capability fallback

Se efeitos não suportados:

- manter core lighting.

---

# 2015. No blank scene

Nunca.

---

# 2016. Safe Mode

Se post-process falhar:

```text
renderer direct
+
basic lights
+
avatar
```

---

# 2017. User-visible quality selector

Pode continuar simples:

```text
Automático
Econômico
Padrão
Ultra
```

---

# 2018. Não mostrar detalhes técnicos

---

# 2019. Dev Quality Panel

Pode mostrar:

- DPR;
- LOD;
- shadow;
- post;
- env;
- FPS.

---

# 2020. Performance budgets

Definir por tier.

---

# 2021. Frame budget

Objetivo conceitual:

- 60 fps quando razoável;
- degradação elegante em hardware fraco.

---

# 2022. Não sacrificar visual para buscar 60 fps absoluto em todo hardware

Balancear.

---

# 2023. Look quality score

Cada preset precisa passar por matriz.

---

# 2024. Golden Lighting Gate

Não produzir dezenas de cenários antes de aprovar:

```text
Studio
Portrait
Hero
Neon
Product
```

---

# 2025. Background expansion depois

Depois dos looks básicos, escalar:

- dojo;
- stars;
- city;
- studio;
- abstract.

---

# 2026. Scene quality hierarchy

Primeiro o avatar.

Depois o cenário.

---

# 2027. Ambiente nunca deve esconder problemas

O QA continua usando Studio neutro.

---

# 2028. Art Bible

Adicionar capítulo completo de:

- lighting;
- camera;
- exposure;
- shadows;
- background;
- post;
- photo.

---

# 2029. Anti-patterns

Documentar:

```text
❌ bloom em tudo
❌ fundo mais forte que avatar
❌ pele estourada
❌ sombra de pé ausente
❌ rim exagerado
❌ câmera grande-angular no rosto
❌ FOV variando aleatoriamente
❌ personagem pequeno no viewport
❌ vignette forte
❌ neon destruindo skin tone
❌ DOF desfocando olhos
```

---

# 2030. Deliverables obrigatórios da Parte 8

O agente deverá entregar:

1. auditoria do lighting atual;
2. Lighting Registry;
3. Studio Look;
4. Portrait Look;
5. Hero Look;
6. Dramatic Look;
7. Neon Look;
8. Product Look;
9. shadow strategy;
10. contact shadow;
11. environment/HDRI strategy;
12. camera preset system;
13. category-aware framing;
14. bounds-aware framing;
15. Photo Studio lens presets;
16. post-processing strategy;
17. color grading;
18. quality-tier degradation;
19. 2D equivalents;
20. visual regression baselines;
21. Before/After;
22. Art Bible update.

---

# 2031. Ordem recomendada

```text
AUDIT CURRENT STAGE
↓
STUDIO LOOK
↓
PORTRAIT
↓
CAMERA
↓
SHADOW
↓
ENVIRONMENT
↓
HERO
↓
NEON
↓
PRODUCT
↓
POST
↓
PHOTO STUDIO
↓
CLASSIC 2D
↓
VISUAL QA
```

---

# 2032. Gate final da Parte 8

Não ampliar cenários e VFX em massa enquanto:

```text
STUDIO
+
PORTRAIT
+
HERO
+
CAMERA
+
SHADOWS
+
COLOR MANAGEMENT
```

não estiverem aprovados.

---

# 2033. Resultado esperado da Parte 8

Ao final desta etapa, mesmo um avatar relativamente simples deverá parecer **mais valioso pela forma como é apresentado**.

E um Golden Avatar deverá conseguir atingir uma aparência realmente premium através da combinação correta de:

- iluminação;
- material;
- câmera;
- ambiente;
- sombras;
- pós-processamento.

A engenharia necessária já está parcialmente presente no renderer. 

A missão desta parte é transformar esses recursos em **direção cinematográfica consistente**, e não apenas opções técnicas.

---

## FIM DA PARTE 8/12

**Próxima: PARTE 9/12 — VFX, AURAS, PODERES, PARTÍCULAS, CLIMA, HORA DO DIA, CENÁRIOS, BACKGROUNDS, PROFUNDIDADE, EFEITOS DE RARIDADE E APRESENTAÇÃO HERO.**




# MEGA BRIEFING — ELEVAÇÃO GRÁFICA AAA DO AVATAR STUDIO DSHOW  
## PARTE 9/12 — VFX, AURAS, PODERES, PARTÍCULAS, CLIMA, HORA DO DIA, CENÁRIOS, BACKGROUNDS, PROFUNDIDADE, EFEITOS DE RARIDADE E APRESENTAÇÃO HERO

# 2034. Objetivo da Parte 9

Esta parte deverá transformar os efeitos do Avatar Studio de elementos decorativos genéricos em um **sistema visual de alto impacto, coerente, hierárquico e integrado ao personagem**.

Os efeitos devem deixar de parecer:

- overlays soltos;
- molduras luminosas;
- partículas genéricas;
- brilho aplicado por cima;
- cores diferentes do mesmo efeito;
- cenários rasos;
- fundos sem profundidade;
- auras que não interagem com o avatar.

A meta é criar um ecossistema em que:

```text
AURA
+
POWER
+
PARTICLES
+
CLIMATE
+
TIME OF DAY
+
SCENARIO
+
RARITY PRESENTATION
```

trabalhem juntos para aumentar a presença do personagem sem competir com ele.

---

# 2035. Princípio central: o avatar continua sendo o protagonista

Nenhum VFX deve roubar a atenção principal do rosto e da silhueta.

A hierarquia ideal continua sendo:

```text
1. ROSTO
2. SILHUETA
3. ROUPA / IDENTIDADE
4. ACESSÓRIOS HERO
5. AURA / POWER
6. PARTÍCULAS
7. CENÁRIO
```

Somente em momentos especiais de apresentação Hero a hierarquia poderá ser temporariamente invertida.

---

# 2036. Aura não é apenas glow

O sistema de auras deverá ser expandido para famílias visuais reais.

Exemplo:

```text
ENERGY
FIRE
ICE
ELECTRIC
ARCANE
VOID
COSMIC
SOLAR
DIGITAL
ROYAL
NATURE
SHADOW
```

Cada família precisa possuir linguagem própria.

---

# 2037. Cada Aura Family precisa definir

No mínimo:

```text
shape language
color behavior
motion
particle type
depth behavior
emissive behavior
bloom level
rarity scaling
```

---

# 2038. Energy Aura

Pode usar:

- pulsação;
- ondas;
- sparks;
- emissive.

---

# 2039. Fire Aura

Deve ter:

- movimento ascendente;
- variação de intensidade;
- partículas;
- cor dinâmica.

---

# 2040. Ice Aura

Pode usar:

- cristais;
- névoa fria;
- partículas lentas;
- brilho controlado.

---

# 2041. Electric Aura

Pode usar:

- arcs;
- flicker;
- flashes;
- micro sparks.

---

# 2042. Arcane Aura

Pode usar:

- glyphs;
- rings;
- runes;
- orbitals.

---

# 2043. Void Aura

Pode trabalhar com:

- distorção;
- fumaça;
- partículas escuras;
- borda emissiva.

---

# 2044. Cosmic Aura

Pode usar:

- estrelas;
- nebula-like particles;
- orbitals;
- deep gradients.

---

# 2045. Digital Aura

Pode usar:

- scanlines;
- pixels;
- grids;
- holographic fragments.

---

# 2046. Royal Aura

Pode usar:

- dourado;
- light rays;
- partículas nobres;
- geometric halos.

---

# 2047. Não resolver Aura Family apenas trocando cor

Hard Fail conceitual se:

```text
Aura Fire = Aura Energy vermelha
Aura Ice = Aura Energy azul
```

A forma e o movimento precisam mudar.

---

# 2048. Aura Depth

No 3D, a aura precisa respeitar profundidade.

Pode existir:

```text
back layer
body layer
front accents
```

---

# 2049. Aura atrás e à frente

Algumas partículas podem passar pela frente, mas o corpo precisa permanecer legível.

---

# 2050. Depth Test

A aura não deve atravessar visualmente o rosto de forma inadequada.

---

# 2051. Occlusion

Elementos atrás do corpo devem ser realmente ocultados.

---

# 2052. Front particles

Precisam ter densidade limitada.

---

# 2053. Aura Bounds

A aura deve informar área visual aproximada para câmera.

---

# 2054. Aura Scale

Não usar escala arbitrária por avatar.

Normalizar por:

- altura;
- body bounds;
- preset.

---

# 2055. Aura Intensity

Pode existir como parâmetro.

Exemplo:

```text
Sutil
Normal
Intensa
```

---

# 2056. Aura Intensity não altera identidade

Ela deve variar densidade/força, não trocar completamente o design.

---

# 2057. Aura Color

Pode ser customizável em famílias compatíveis.

---

# 2058. Multi-color Aura

Algumas podem suportar:

```text
primary
secondary
core
```

---

# 2059. Emissive discipline

Mesmo em auras, manter teto.

O sistema já possui infraestrutura de emissive e bloom que deve ser usada de forma controlada. 

---

# 2060. Powers

Poderes deverão ser diferenciados de aura.

Aura:

> estado contínuo ao redor do personagem.

Power:

> manifestação visual específica.

---

# 2061. Power Categories

Exemplo:

```text
hand_power
body_power
ground_power
orbit_power
weapon_power
environment_power
```

---

# 2062. Hand Power

Pode aparecer:

- palma;
- punho;
- prop.

---

# 2063. Body Power

Pode envolver:

- torso;
- braços;
- corpo inteiro.

---

# 2064. Ground Power

Pode aparecer:

- círculo;
- runa;
- energia no chão.

---

# 2065. Orbit Power

Pode usar:

- objetos;
- rings;
- symbols.

---

# 2066. Weapon/Prop Power

Pode integrar com Hero Props.

---

# 2067. Environment Power

Pode alterar:

- clima;
- luz;
- partículas.

---

# 2068. Power Animation

Todo poder precisa possuir:

```text
idle
activation
peak
deactivation
```

mesmo que algumas fases sejam simples.

---

# 2069. Não deixar efeito ligado de forma estática

Um poder completamente congelado parece overlay.

---

# 2070. Power Timing

Criar timing curado.

---

# 2071. Loop

Loops precisam ser contínuos.

---

# 2072. No visible reset

Hard Fail se partícula/efeito “reinicia” abruptamente.

---

# 2073. Power Pose

Alguns poderes podem sugerir pose.

---

# 2074. Pose Sync

Exemplo:

```text
hand_energy
→ mão aberta
```

---

# 2075. Não obrigar pose única

Usuário pode mudar.

---

# 2076. Particle System

Criar um sistema padronizado de partículas.

---

# 2077. Particle Families

Exemplo:

```text
spark
dust
snow
rain
embers
stars
pixels
magic
smoke
leaves
```

---

# 2078. Particle presets

Cada família define:

- size;
- velocity;
- lifetime;
- opacity;
- spread;
- gravity;
- color.

---

# 2079. Não criar emitter customizado ad hoc por asset

Reutilizar engine/presets.

---

# 2080. Particle pooling

Implementar/revisar pooling para reduzir garbage collection.

---

# 2081. Instancing

Quando tecnicamente possível.

---

# 2082. GPU particles

Avaliar se necessário.

Não tornar obrigatório na primeira entrega.

---

# 2083. Particle density tier

Economico:
- baixa.

Standard:
- média.

Ultra:
- completa.

---

# 2084. Particle culling

Fora da câmera:

- reduzir;
- pausar;
- não emitir.

---

# 2085. Particle bounds

Usar para culling.

---

# 2086. Particle overdraw

Monitorar.

---

# 2087. Transparent particles são caras

Não exagerar.

---

# 2088. Soft particles

Podem melhorar contato com geometria se viável.

---

# 2089. Particle sorting

Evitar artefatos evidentes.

---

# 2090. Lighting interaction

Nem toda partícula precisa iluminar o ambiente.

---

# 2091. Fake light

Alguns powers podem usar uma luz local associada.

---

# 2092. Dynamic Light Budget

Limitar número de luzes adicionais.

---

# 2093. Não criar 20 point lights por aura

---

# 2094. Hero Power Light

Pode usar uma luz extra bem controlada.

---

# 2095. Aura vs skin

Luzes coloridas não devem destruir tom de pele.

---

# 2096. Additive vs Alpha Blend

Selecionar conforme efeito.

---

# 2097. Additive

Bom para:

- energy;
- sparks;
- light.

---

# 2098. Alpha

Bom para:

- smoke;
- fog;
- cloud.

---

# 2099. Premultiplied alpha

Testar.

---

# 2100. Particle textures

Precisam ser suaves.

---

# 2101. Sprite atlas

Pode reduzir requests/draw overhead.

---

# 2102. Animated atlas

Útil para:

- fire;
- smoke;
- magic.

---

# 2103. Shader-based particles

Pode ser preferível para efeitos repetidos.

---

# 2104. Noise

Criar biblioteca de noise reutilizável.

---

# 2105. Distortion

Pode elevar:

- heat;
- void;
- magic.

---

# 2106. Distortion budget

Uso raro.

---

# 2107. Climate System

O catálogo já prevê `clima` como parte da configuração de cena. 

A nova implementação deve tornar isso mais visualmente coerente.

---

# 2108. Climate Types

Exemplo:

```text
clear
rain
snow
fog
storm
wind
embers
```

---

# 2109. Rain

Não apenas linhas caindo.

Pode envolver:

- iluminação;
- particles;
- piso;
- leve atmosfera.

---

# 2110. Wetness

Opcionalmente, alguns materiais/cenários podem ganhar resposta mais brilhante.

Não precisa alterar todas as roupas em runtime inicialmente.

---

# 2111. Rain ground

Pode ter:

- ripple;
- reflection;
- subtle wetness.

---

# 2112. Snow

Pode usar:

- falling particles;
- colder lighting;
- atmospheric depth.

---

# 2113. Snow accumulation

Não necessário inicialmente.

---

# 2114. Fog

Precisa respeitar profundidade.

---

# 2115. Storm

Pode combinar:

- rain;
- flashes;
- darker environment.

---

# 2116. Lightning

Muito controlado.

---

# 2117. Flash exposure

Não estourar cena.

---

# 2118. Wind

Pode afetar:

- hair secondary motion;
- cape;
- particles.

---

# 2119. Wind Global Parameter

Preparar um valor compartilhado.

---

# 2120. Não implementar física completa para tudo

Secondary animation pode responder apenas de forma simplificada.

---

# 2121. Time of Day

O sistema já possui hora do dia na configuração persistível. 

Isso deve ser transformado em sistema visual real.

---

# 2122. Time Presets

Exemplo:

```text
Morning
Day
Golden Hour
Sunset
Night
Midnight
```

---

# 2123. Morning

- luz suave;
- tonalidade quente leve.

---

# 2124. Day

- neutro;
- maior clareza.

---

# 2125. Golden Hour

- key quente;
- rim;
- fundo quente.

---

# 2126. Sunset

- mais dramático;
- cores de céu.

---

# 2127. Night

- ambiente escuro;
- luz artificial.

---

# 2128. Midnight

- mais profundo;
- detalhes neon/ambient.

---

# 2129. Time != simple background color

Precisamos alterar:

- lighting;
- environment;
- background;
- exposure;
- particles quando apropriado.

---

# 2130. Time transitions

Se houver slider, interpolar suavemente.

---

# 2131. Não recalcular shaders pesados a cada frame sem necessidade

---

# 2132. Time animation

Pode existir em Photo Studio ou showcase.

Não necessário no editor principal.

---

# 2133. Scenarios

Hoje o catálogo já possui cenários como:

- vazio;
- grade;
- estrelas;
- dojo. 

O objetivo agora é elevar profundidade, variedade e identidade.

---

# 2134. Scenario Families

Organizar em:

```text
NEUTRAL
ABSTRACT
URBAN
TECH
NATURE
FANTASY
ROYAL
STUDIO
EVENT
```

---

# 2135. Neutral

Para QA e edição.

---

# 2136. Abstract

Pode usar:

- geometry;
- gradient;
- light;
- shapes.

---

# 2137. Urban

Pode ter:

- rooftop;
- city lights;
- street;
- industrial.

---

# 2138. Tech

Pode ter:

- grid;
- LED-like environment;
- holographic room.

---

# 2139. Nature

- forest;
- mountain;
- sunset;
- snow.

---

# 2140. Fantasy

- temple;
- cosmic;
- arcane.

---

# 2141. Royal

- hall;
- throne-like stage;
- gold/stone.

---

# 2142. Studio

- neutral;
- soft;
- premium.

---

# 2143. Event

Pode ser usado futuramente para campanhas.

---

# 2144. Cenário não deve ser full game level

O usuário precisa editar avatar.

Não precisamos construir mundos gigantes.

---

# 2145. Stage-based scenarios

Preferir pequenos sets otimizados.

---

# 2146. Layered environments

Um cenário pode ser composto por:

```text
foreground
midground
background
sky/environment
```

---

# 2147. Foreground

Usar com cuidado para não ocultar avatar.

---

# 2148. Midground

Pode ajudar a dar escala.

---

# 2149. Background

Principal camada temática.

---

# 2150. Camera parallax

Pode dar profundidade.

---

# 2151. Scenario bounds

Não precisa cobrir mundo infinito.

---

# 2152. Scenario camera contract

Cada cenário precisa funcionar com presets de câmera.

---

# 2153. Portrait compatibility

Mesmo cenário tem que possuir área limpa atrás do rosto.

---

# 2154. Full-body compatibility

Chão precisa funcionar.

---

# 2155. Wings compatibility

Background não pode competir.

---

# 2156. Pet compatibility

Espaço lateral.

---

# 2157. Scenario Lighting Profile

Cada cenário pode sugerir lighting.

---

# 2158. Mas separar cenário de look

Usuário pode, se possível, combinar:

```text
Scenario = Dojo
Look = Hero
```

---

# 2159. Compatibility matrix

Nem todos precisam combinar com tudo, mas o sistema deve ter defaults.

---

# 2160. Scenario Material Quality

Cenário precisa respeitar quality bar.

---

# 2161. Não investir mais no cenário do que no avatar

Budget proporcional.

---

# 2162. Backgrounds 2D

A seção de Fundos foi identificada anteriormente como rasa.

No modo clássico, esse é um dos pontos de maior oportunidade.

---

# 2163. 2D Background Layers

Criar:

```text
far background
mid background
floor
foreground accents
atmosphere
```

---

# 2164. Parallax

Ao mover avatar/câmera, usar leve parallax quando viável.

---

# 2165. Depth via blur

Far layer pode ter blur sutil.

---

# 2166. Lighting integration

O personagem deve receber uma luz que combine com o fundo.

---

# 2167. Não usar fundo como wallpaper solto

---

# 2168. 2D Floor

Ajuda muito na sensação de profundidade.

---

# 2169. 2D Contact Shadow

Obrigatória.

---

# 2170. Background variants

Não apenas “mesma imagem com outra cor”.

---

# 2171. Background Quality Bar

Avaliar:

- depth;
- composition;
- color;
- avatar contrast;
- style;
- resolution.

---

# 2172. Hero Background Set

Criar inicialmente:

```text
BG01 Premium Studio
BG02 Abstract Tech
BG03 Urban Night
BG04 Royal
BG05 Nature
BG06 Cosmic
```

---

# 2173. Golden Scenario Set 3D

Mesma filosofia:

```text
S01 Studio
S02 Tech
S03 Urban
S04 Royal
S05 Nature
S06 Cosmic
```

---

# 2174. Scenario LOD

Cenários também precisam degradar.

---

# 2175. Economy

- menos props;
- menor texture;
- menos particles.

---

# 2176. Standard

- full stage.

---

# 2177. Ultra

- melhor environment;
- additional effects.

---

# 2178. Scenario loading

Carregar de forma assíncrona.

---

# 2179. Não bloquear avatar enquanto cenário carrega

---

# 2180. Scenario placeholder

Usar fallback neutro.

---

# 2181. Transition

Fade entre cenários.

---

# 2182. Asset streaming

Carregar mid/background primeiro conforme necessidade.

---

# 2183. Cache

Cenários recentes.

---

# 2184. Scenario memory

Não manter todos os cenários grandes simultaneamente.

---

# 2185. Dispose

Obrigatório.

---

# 2186. Rarity Presentation

Raridade precisa ser traduzida visualmente de forma mais sofisticada.

---

# 2187. Rarity Layers

Pode afetar:

- card;
- equip animation;
- VFX;
- sound futuro;
- material accents;
- background presentation.

---

# 2188. Common

Minimal.

---

# 2189. Rare

Pequeno accent.

---

# 2190. Epic

Mais presença.

---

# 2191. Legendary

Apresentação Hero.

---

# 2192. Não alterar qualidade base

Reforço:

```text
COMMON != BAD QUALITY
LEGENDARY != GOOD QUALITY
```

---

# 2193. Legendary presentation

Pode ter:

- light burst;
- particles;
- unique pose;
- camera move.

---

# 2194. Duration

Curta.

---

# 2195. Equip Reveal

Pode existir ao equipar item raro pela primeira vez.

---

# 2196. Não repetir toda vez

---

# 2197. Rarity colors

Podem continuar existindo.

Mas não depender apenas delas.

---

# 2198. Rarity Material Accents

Pode existir em Hero items.

---

# 2199. Rarity Aura

Alguns itens podem adicionar pequena aura.

---

# 2200. Não empilhar automaticamente Aura + item + frame + particle + background

Evitar overload.

---

# 2201. Presentation Director

Criar lógica central que decide combinação de efeitos.

Conceitualmente:

```text
AvatarPresentationState
```

---

# 2202. Presentation State pode conter

```text
look
scenario
aura
power
rarityEffect
camera
pose
climate
time
```

---

# 2203. Não deixar cada componente controlar post-processing global

Centralizar.

---

# 2204. VFX Priority

Criar prioridades.

Exemplo:

```text
critical
primary
secondary
ambient
```

---

# 2205. Performance Manager pode desativar primeiro os ambient

---

# 2206. VFX Budget

Por tier:

```text
particle count
transparent layers
dynamic lights
shader complexity
```

---

# 2207. VFX profiles

Economico:
- core effect only.

Standard:
- full effect.

Ultra:
- extra secondary particles.

---

# 2208. Same visual identity

Mesmo no econômico, a aura precisa ser reconhecível.

---

# 2209. No disappearing legendary effect

Reduzir, não apagar completamente.

---

# 2210. Photo Studio

Efeitos precisam ser muito bem integrados aqui.

---

# 2211. Aura Capture

Precisa respeitar:

- alpha;
- bloom;
- frame.

---

# 2212. Transparent background

Se exportar transparente, definir se aura entra ou não.

---

# 2213. User option

Exemplo:

```text
Incluir efeitos
```

---

# 2214. Climate capture

Usuário pode incluir chuva/neve.

---

# 2215. Scenario capture

Normalmente incluído.

---

# 2216. Background-only capture

Pode ser útil futuramente.

---

# 2217. Portrait with Aura

Aura deve se adaptar ao close-up.

Não ocupar rosto.

---

# 2218. Aura Camera Modes

Cada aura pode definir variações:

```text
full-body
portrait-safe
```

---

# 2219. Power portrait-safe

Mesma lógica.

---

# 2220. Pet/companion + aura

Testar composição.

---

# 2221. Scenario + aura

Testar contraste.

---

# 2222. Dark Aura + dark background

Pode perder legibilidade.

Presentation Director pode sugerir rim/fundo.

---

# 2223. Não recolorir automaticamente sem consentimento

Pode ajustar iluminação.

---

# 2224. VFX thumbnails

Auras/efeitos precisam de thumbnails animados ou previews visuais melhores.

---

# 2225. Static thumbnail pode ser insuficiente

Considerar:

- short loop preview;
- hover animation.

---

# 2226. Performance

Não rodar 20 previews animados ao mesmo tempo.

---

# 2227. Lazy animation

Animar apenas:

- hover;
- selected.

---

# 2228. Scenario thumbnail

Precisa mostrar profundidade.

---

# 2229. Climate cards

Podem usar ícone + preview visual.

---

# 2230. Time of Day cards

Preferir tabs/cards em vez de dropdown quando houver poucas opções, coerente com a UX já solicitada.

---

# 2231. Aura UI

Mostrar:

- visual card;
- color;
- intensity.

---

# 2232. Power UI

Mostrar:

- type;
- preview;
- trigger.

---

# 2233. Cenário UI

Cards maiores.

---

# 2234. Background UI

Visual-first.

---

# 2235. Rarity UI

Não sobrecarregar.

---

# 2236. Undo/redo

Mudanças de:

- aura;
- power;
- scenario;
- climate;
- time;

precisam entrar no histórico.

---

# 2237. Presets

Permitir salvar:

```text
Avatar + Look + Scenario + Aura
```

---

# 2238. Preset categories

Exemplo:

```text
Cyber Hero
Royal
Urban Night
Cosmic
Studio
```

---

# 2239. Golden Presentation Presets

Criar pelo menos:

```text
P01 Studio Clean
P02 Cyber Hero
P03 Royal Gold
P04 Cosmic
P05 Urban Night
P06 Nature
```

---

# 2240. Cada Golden Preset deve provar algo diferente

---

# 2241. Studio Clean

Prova:

- avatar sem maquiagem de VFX.

---

# 2242. Cyber Hero

Prova:

- emissive;
- digital aura;
- tech background.

---

# 2243. Royal Gold

Prova:

- metal;
- warm light;
- subtle particles.

---

# 2244. Cosmic

Prova:

- particles;
- environment;
- aura.

---

# 2245. Urban Night

Prova:

- background depth;
- rim;
- neon.

---

# 2246. Nature

Prova:

- atmospheric light;
- climate.

---

# 2247. VFX QA — static

Capturar frames.

---

# 2248. VFX QA — motion

Reproduzir loops.

---

# 2249. VFX QA — performance

Medir:

- FPS;
- draw calls;
- overdraw;
- GPU cost.

---

# 2250. VFX QA — alpha

Fundo claro/escuro.

---

# 2251. VFX QA — camera

Full / portrait / ¾.

---

# 2252. VFX QA — skin

Pele clara/média/escura.

---

# 2253. VFX QA — hair

Cabelo claro/escuro.

---

# 2254. VFX QA — materials

Metal/glass.

---

# 2255. Scenario QA

Testar:

- composition;
- camera;
- avatar visibility;
- loading;
- performance.

---

# 2256. Climate QA

Testar:

- no clipping;
- no particle explosion;
- loops.

---

# 2257. Time QA

Testar transições.

---

# 2258. Rarity QA

Comparar Common/Rare/Epic/Legendary.

---

# 2259. Hard Fail de VFX

Reprovar se:

- efeito cobre rosto;
- aura parece sticker;
- loop pula;
- particle sorting quebra;
- bloom estoura;
- shader pisca;
- depth está errada;
- efeito muda posição com LOD;
- câmera corta efeito principal;
- tier econômico remove identidade.

---

# 2260. Hard Fail de cenário

Reprovar se:

- personagem flutua;
- fundo compete;
- chão não alinha;
- escala parece errada;
- câmera colide;
- cenário causa queda severa sem fallback.

---

# 2261. Hard Fail de clima

Reprovar se:

- chuva atravessa interface;
- neve aparece dentro do corpo de forma grotesca;
- fog esconde avatar;
- storm estoura exposição.

---

# 2262. Soft Fail

Exemplos:

- pequena redução de partículas;
- leve diferença de densidade;
- secondary particle ausente em LOD baixo.

---

# 2263. VFX Quality Score

Sugestão:

```text
Art Direction        9/10
Depth Integration    9/10
Motion               9/10
Avatar Readability   9/10
Performance          8/10
Tier Scalability     9/10
Distinctiveness      9/10
```

---

# 2264. Scenario Quality Score

```text
Depth                9/10
Composition          9/10
Lighting Integration 9/10
Avatar Contrast      9/10
Performance          8/10
Camera Compatibility 9/10
```

---

# 2265. Golden VFX Set

Criar inicialmente:

```text
Aura Energy
Aura Fire
Aura Ice
Aura Digital
Power Hand
Power Ground
Power Orbit
```

---

# 2266. Golden Climate Set

```text
Clear
Rain
Snow
Fog
```

---

# 2267. Golden Scenario Set

Como definido antes.

---

# 2268. Não produzir 30 auras antes dos Golden VFX

Primeiro provar linguagem.

---

# 2269. Escala posterior

Depois, expandir families.

---

# 2270. Distinctiveness

Cada nova aura precisa justificar existência.

---

# 2271. Color Variant

Pode ser variante, não asset novo.

---

# 2272. Material Variant

Mesma lógica.

---

# 2273. Procedural VFX é desejável

Diferente de acessórios, VFX procedurais podem ser a solução final.

---

# 2274. Procedural precisa ser artisticamente curado

Não basta `PointsMaterial` básico.

---

# 2275. Shader Library

Criar biblioteca reutilizável.

---

# 2276. Shader Versioning

Se alterar shader global, rodar visual regression.

---

# 2277. Effect Registry

Centralizar:

```text
id
family
parameters
quality tiers
bounds
camera behavior
materials
```

---

# 2278. Scenario Registry

Mesma filosofia.

---

# 2279. Climate Registry

Mesma filosofia.

---

# 2280. Time Preset Registry

Mesma filosofia.

---

# 2281. No hardcode

Adicionar novo efeito não deve exigir reescrever UI.

---

# 2282. Art Bible

Adicionar capítulo completo:

- aura;
- particles;
- power;
- climate;
- scenario;
- rarity;
- composition.

---

# 2283. Anti-patterns

Documentar:

```text
❌ aura = glow colorido
❌ tudo com partículas
❌ cenário wallpaper
❌ glow cobrindo rosto
❌ legendary = efeito excessivo
❌ 10 auras iguais em cores diferentes
❌ chuva sem integração com luz
❌ fundo sem chão/profundidade
❌ partículas atravessando UI
❌ bloom para mascarar asset simples
```

---

# 2284. Deliverables obrigatórios da Parte 9

O agente deverá entregar:

1. auditoria dos efeitos atuais;
2. Aura Families;
3. Golden Aura Set;
4. Power System;
5. Particle Registry;
6. particle quality tiers;
7. climate system;
8. time-of-day system;
9. Golden Scenario Set;
10. 2D layered backgrounds;
11. parallax/depth strategy;
12. rarity presentation;
13. Presentation Director;
14. camera-aware VFX;
15. Photo Studio integration;
16. performance budgets;
17. visual QA;
18. Before/After;
19. Art Bible update;
20. plano de escala.

---

# 2285. Ordem recomendada

```text
AUDIT CURRENT EFFECTS
↓
AURA SYSTEM
↓
PARTICLE LIBRARY
↓
POWER SYSTEM
↓
CLIMATE
↓
TIME OF DAY
↓
SCENARIOS
↓
RARITY PRESENTATION
↓
PRESENTATION DIRECTOR
↓
PHOTO STUDIO
↓
CLASSIC 2D
↓
VISUAL QA
```

---

# 2286. Gate final da Parte 9

Não escalar efeitos em massa até que:

```text
4 AURA FAMILIES
+
3 POWER TYPES
+
4 CLIMATES
+
GOLDEN SCENARIOS
+
RARITY PRESENTATION
+
PERFORMANCE TIERS
```

estejam aprovados.

---

# 2287. Resultado esperado da Parte 9

Ao final desta etapa, efeitos e cenários precisam deixar de parecer elementos adicionados ao redor do avatar e passar a funcionar como uma **camada de direção artística integrada**.

O objetivo é que seja possível olhar para uma composição e perceber imediatamente:

- identidade;
- atmosfera;
- profundidade;
- raridade;
- tema;
- impacto;

sem perder aquilo que continua sendo o centro de toda a experiência:

> **o personagem.**

---

## FIM DA PARTE 9/12

**Próxima: PARTE 10/12 — MODO CLÁSSICO 2D/2.5D PREMIUM: NOVA LINGUAGEM VETORIAL, PROFUNDIDADE, LAYERS, SOMBRAS, MATERIAIS, ROSTO, ROUPAS, ACESSÓRIOS, FUNDOS, ANIMAÇÕES E PARIDADE SEMÂNTICA COM O 3D.**






# MEGA BRIEFING — ELEVAÇÃO GRÁFICA AAA DO AVATAR STUDIO DSHOW  
## PARTE 10/12 — MODO CLÁSSICO 2D/2.5D PREMIUM: NOVA LINGUAGEM VETORIAL, PROFUNDIDADE, LAYERS, SOMBRAS, MATERIAIS, ROSTO, ROUPAS, ACESSÓRIOS, FUNDOS, ANIMAÇÕES E PARIDADE SEMÂNTICA COM O 3D

# 2288. Objetivo da Parte 10

Esta parte deverá elevar o **Modo Clássico** para que ele deixe de parecer uma versão tecnicamente funcional, porém visualmente inferior, do Avatar Studio.

A meta não é transformar o clássico em um “3D falso”.

A meta é criar uma identidade própria:

> **PREMIUM STYLIZED 2D / 2.5D**

O resultado deve parecer uma escolha artística deliberada, sofisticada e coerente com o restante do produto.

O clássico deverá competir em:

- charme;
- legibilidade;
- personalidade;
- variedade;
- velocidade;
- impacto visual;
- qualidade de composição.

Não em volume tridimensional real.

---

# 2289. Princípio central

O Modo Clássico precisa deixar de depender predominantemente de:

- formas geométricas simples;
- fills chapados;
- elipses genéricas;
- poucos gradientes;
- sobreposições rasas;
- pequenas diferenças entre assets.

E passar a explorar:

```text
SILHUETA
+
LAYERING
+
SHADING
+
MATERIALIDADE
+
PROFUNDIDADE
+
MICROANIMAÇÃO
+
COMPOSIÇÃO
```

---

# 2290. Não apagar o renderer atual indiscriminadamente

O renderer clássico já possui arquitetura funcional e grande volume de catálogo.

Portanto, não substituir tudo por um novo sistema do zero sem necessidade.

A estratégia recomendada é:

```text
ENGINE EXISTENTE
+
NOVO PADRÃO VISUAL
+
NOVAS FAMÍLIAS DE ASSETS
+
MELHOR LAYERING
+
NOVOS SHADING TOKENS
```

---

# 2291. Separar “Classic Legacy” de “Classic Premium”

Durante a transição, considerar dois níveis internos:

```text
Classic Legacy
Classic Premium
```

Não necessariamente visíveis ao usuário.

Isso permitirá migrar assets progressivamente.

---

# 2292. Visual Quality Metadata

Aplicar a mesma classificação já definida:

```text
prototype
legacy
production
premium
hero
```

também aos assets 2D.

---

# 2293. Não converter automaticamente todo catálogo antigo

Primeiro selecionar famílias de maior impacto:

1. rosto;
2. cabelo;
3. olhos;
4. boca;
5. roupas;
6. acessórios;
7. fundos;
8. auras.

---

# 2294. Golden Classic Avatar

Criar pelo menos:

```text
Classic Golden Male
Classic Golden Female
```

e usá-los como benchmark.

---

# 2295. Golden Classic precisa demonstrar

- rosto premium;
- cabelo premium;
- roupa premium;
- acessórios;
- fundo;
- aura;
- iluminação simulada;
- profundidade.

---

# 2296. Novo scaffold visual

A auditoria mostrou que o clássico utiliza uma estrutura compartilhada e bastante rígida.

O novo sistema deverá permitir mais flexibilidade de:

- cabeça;
- pescoço;
- ombros;
- torso;
- braços;
- cabelo;
- roupa.

Sem necessariamente abandonar o SVG.

---

# 2297. ViewBox

O canvas pode continuar normalizado.

Mas o avatar deve aproveitar melhor o espaço.

O objetivo visual é:

> mais presença.

---

# 2298. Avatar deve ocupar mais viewport

Conforme pedido anterior, reduzir excesso de área vazia.

---

# 2299. Full Body Layout

Corpo inteiro deve ocupar altura visual dominante.

---

# 2300. Bust Layout

Para categorias faciais, ampliar rosto automaticamente.

---

# 2301. Face Focus

Ao selecionar:

- olhos;
- boca;
- sobrancelha;
- barba;

aproximar visualmente a área relevante.

---

# 2302. Não alterar a estrutura da interface de forma abrupta

Manter comportamento previsível.

---

# 2303. Layer Architecture

Formalizar camadas.

Exemplo:

```text
BACKGROUND
↓
BACK VFX
↓
BACK ACCESSORY
↓
BODY BACK
↓
BODY BASE
↓
CLOTHING BASE
↓
CLOTHING OUTER
↓
FACE
↓
HAIR BACK
↓
HAIR FRONT
↓
FACIAL HAIR
↓
ACCESSORIES FRONT
↓
FRONT VFX
↓
FRAME
```

---

# 2304. Layer IDs

Cada asset deve declarar camada.

---

# 2305. Não depender da ordem acidental do DOM

Layering deve ser determinístico.

---

# 2306. Z-index semântico

Mesmo em SVG, criar ordem semântica central.

---

# 2307. Hair Back / Front

Cabelos médios e longos precisam poder existir em duas partes.

---

# 2308. Clothing Base / Outer

Jaqueta deve existir sobre camiseta.

---

# 2309. Back Accessories

Asas/mochila precisam ficar corretamente atrás.

---

# 2310. Front Accessories

Colares, óculos etc. na frente.

---

# 2311. Aura Back/Front

Permitir composição em múltiplas camadas.

---

# 2312. Shadow Layers

Sombras de contato e de peça devem existir em layer próprio quando necessário.

---

# 2313. Rosto

O rosto precisa deixar de depender de uma única elipse visual.

---

# 2314. Face Shape Library

Criar formatos realmente distintos:

```text
oval
round
square
long
angular
soft
broad
narrow
```

---

# 2315. Face contour

Utilizar paths mais ricos.

---

# 2316. Jawline

Precisa variar.

---

# 2317. Chin

Precisa variar.

---

# 2318. Cheeks

Podem ser simuladas por shape + shading.

---

# 2319. Forehead

Pode variar via face geometry.

---

# 2320. Ears

Precisam integrar melhor.

---

# 2321. Skin Shading

Não usar apenas fill uniforme.

Aplicar:

- base color;
- soft side shade;
- highlight;
- under-chin;
- cheek tint sutil.

---

# 2322. Skin Gradient Tokens

Criar presets reutilizáveis por skin tone.

---

# 2323. Não usar gradiente idêntico para todos os tons

Precisará calibrar por luminância.

---

# 2324. Pele escura

Precisa manter:

- highlights;
- volume;
- contraste.

---

# 2325. Pele clara

Evitar áreas estouradas.

---

# 2326. Skin Material 2D

A meta é:

> ilustração premium.

Não simulação física.

---

# 2327. Eyes 2D

Precisam ganhar forte elevação.

---

# 2328. Eye Anatomy 2D

Adicionar:

- sclera;
- iris;
- pupil;
- upper lid;
- lower lid;
- highlight.

---

# 2329. Eye Shapes

Mais variedade.

---

# 2330. Eye depth

Usar:

- shadow;
- lid line;
- iris gradient.

---

# 2331. Catchlight

Pode variar conforme look.

---

# 2332. Iris

Não usar círculo flat puro.

---

# 2333. Eye Animation

Piscada simples pode elevar muito.

---

# 2334. Blink

Pode ser SVG animation / state transition.

---

# 2335. Blink timing

Não perfeitamente periódico.

---

# 2336. Gaze

Pequenos offsets podem existir.

---

# 2337. Brows

Mais estilos.

---

# 2338. Brow volume

Usar stroke/shape com espessura.

---

# 2339. Brow shadow

Sutil.

---

# 2340. Nose

Precisa ganhar presença.

---

# 2341. Nose 2D

Pode ser composto por:

- bridge shade;
- side contour;
- nostril;
- highlight.

---

# 2342. Não transformar nariz em desenho realista demais

Manter estilo.

---

# 2343. Mouth

Precisa deixar de ser apenas traço.

---

# 2344. Mouth layers

Exemplo:

```text
upper lip
lower lip
center shade
highlight
```

---

# 2345. Mouth Shapes

Expandir significativamente.

---

# 2346. Smile

Pode ser uma versão animada/expressiva.

---

# 2347. Expressions

Criar:

```text
neutral
smile
confident
serious
surprised
happy
```

---

# 2348. Expressões em 2D

Podem alterar:

- eyes;
- brows;
- mouth;
- cheeks.

---

# 2349. Não apenas trocar boca

---

# 2350. Facial Hair

Barbas precisam ganhar profundidade.

---

# 2351. Stubble

Pode usar texture/pattern.

---

# 2352. Full Beard

Usar:

- base shape;
- highlights;
- strands;
- contact shadow.

---

# 2353. Mustache

Precisa encaixar na boca.

---

# 2354. Beard Color

Sincronizar com cabelo opcionalmente.

---

# 2355. Hair 2D

Uma das maiores prioridades.

---

# 2356. Hair Layer Model

Cabelo deve poder usar:

```text
back mass
main mass
front fringe
shadow
highlight
detail strands
```

---

# 2357. Hair Silhouette

Precisa ser altamente distinta.

---

# 2358. Hair volume

Usar gradiente e shadow.

---

# 2359. Hair Highlight

Seguir fluxo.

---

# 2360. Hair Strands

Poucos grupos, artisticamente posicionados.

---

# 2361. Hair Root

Precisa casar com testa.

---

# 2362. Long Hair

Precisa existir atrás do pescoço/ombros.

---

# 2363. Ponytail

Pode ter parte traseira separada.

---

# 2364. Bun

Mesma lógica.

---

# 2365. Afro

Precisa ter silhouette rica.

---

# 2366. Curly Hair

Não representar como um bloco com ondulação genérica.

---

# 2367. Hair Motion

Micro movimento opcional.

---

# 2368. Hair Sway

Pode ser um transform leve.

---

# 2369. Não exagerar.

---

# 2370. Clothing 2D

Roupa precisa alterar silhouette real.

---

# 2371. Current limitation

Hoje, muitas peças alteram apenas detalhes sobre uma base corporal comum.

A nova geração precisa permitir diferenças bem mais significativas.

---

# 2372. T-shirt

Precisa alterar:

- gola;
- manga;
- torso contour.

---

# 2373. Shirt

Adicionar:

- collar;
- buttons;
- cuffs.

---

# 2374. Hoodie

- hood;
- pocket;
- volume.

---

# 2375. Jacket

- outer silhouette;
- lapels;
- sleeves;
- zipper;
- thickness.

---

# 2376. Blazer

- shoulders;
- lapel;
- button;
- tailored shape.

---

# 2377. Pants

Precisam variar:

- width;
- shape;
- cuff;
- waist.

---

# 2378. Shoes

Silhouette distinta.

---

# 2379. Material Simulation 2D

Criar tokens para:

```text
cotton
denim
leather
metal
technical
satin
```

---

# 2380. Cotton

Pouco highlight.

---

# 2381. Leather

Highlight mais forte.

---

# 2382. Denim

Texture/pattern sutil.

---

# 2383. Metal

Gradient + bright edge.

---

# 2384. Technical Fabric

Contraste mais controlado.

---

# 2385. Color Channels

Assim como no 3D, permitir:

```text
primary
secondary
accent
```

onde suportado.

---

# 2386. Camiseta e calça precisam ter cores independentes

Requisito já solicitado anteriormente.

---

# 2387. Outfit

Criar presets completos também no clássico.

---

# 2388. Outfit Identity

Deve corresponder semanticamente ao 3D quando possível.

---

# 2389. Accessory 2D

Precisa ganhar profundidade.

---

# 2390. Glasses

- frame;
- lens;
- highlight;
- shadow.

---

# 2391. Crown

- metallic gradient;
- gems;
- shadow;
- front/back layering.

---

# 2392. Necklace

- chain;
- pendant;
- metal highlight.

---

# 2393. Watch

Pode aparecer no corpo inteiro quando visível.

---

# 2394. Backpack

Layer traseiro.

---

# 2395. Wings

Back layer + front accents.

---

# 2396. Props

Precisam encaixar na mão.

---

# 2397. Pet

Pode ser ilustração separada.

---

# 2398. Companion

Pode orbitar com transform simples.

---

# 2399. Multi-accessory

Preservar possibilidade de múltiplos acessórios.

---

# 2400. Compatibility Rules

Mesma semântica do 3D quando possível.

---

# 2401. Semantic parity

Exemplo:

```text
glasses_id_01
```

pode ter:

```text
classicRendererAsset
3dRendererAsset
```

---

# 2402. Não duplicar identidade de produto

O usuário escolhe “Óculos Meridian”, não “Óculos 2D 01”.

---

# 2403. Renderer support metadata

Cada asset informa:

```text
classic
3d
both
```

---

# 2404. UI deve indicar quando não há equivalente

Sem erro silencioso.

---

# 2405. Backgrounds

Grande oportunidade de elevação.

---

# 2406. Background Layer Model

```text
far
mid
floor
foreground
atmosphere
```

---

# 2407. Background Depth

Criar parallax.

---

# 2408. Parallax amount

Sutil.

---

# 2409. Mouse/Camera parallax

Pode responder ao movimento do avatar/cursor.

---

# 2410. Não causar enjoo visual

---

# 2411. Floor

Precisa existir em backgrounds premium.

---

# 2412. Contact Shadow

Avatar não pode flutuar.

---

# 2413. Reflection fake

Pode existir em alguns ambientes.

---

# 2414. Atmospheric depth

Blur/opacity.

---

# 2415. Background lighting

Deve harmonizar com avatar.

---

# 2416. Look system 2D

Criar equivalentes:

```text
Studio
Portrait
Hero
Neon
```

---

# 2417. Studio

Neutro.

---

# 2418. Portrait

Rosto.

---

# 2419. Hero

Mais contraste.

---

# 2420. Neon

Glow seletivo.

---

# 2421. Lighting simulation

Pode usar:

- overlay gradients;
- masks;
- rim paths;
- shadow filters.

---

# 2422. SVG filters

Usar com cautela.

---

# 2423. Filter budget

Blur/drop-shadow podem pesar em excesso.

---

# 2424. Reutilizar defs

Evitar duplicação.

---

# 2425. Drop Shadow

Preferir shadows customizadas quando possível.

---

# 2426. Rim

Pode ser path/stroke duplicado.

---

# 2427. Inner shading

Pode usar masks.

---

# 2428. Filters por material

Não aplicar um único filter em tudo.

---

# 2429. Aura 2D

Precisa ganhar famílias reais.

---

# 2430. Aura Layers

```text
rear glow
main shape
particles
front accent
```

---

# 2431. Aura Animation

Pode usar:

- opacity;
- scale;
- rotation;
- dash offset;
- particles.

---

# 2432. Fire Aura

Movimento vertical.

---

# 2433. Digital Aura

Glitches/pixels.

---

# 2434. Arcane Aura

Rings/runes.

---

# 2435. Ice Aura

Fragments/fog.

---

# 2436. Não apenas cor.

---

# 2437. Effects 2D

A seção Efeitos precisa deixar de parecer moldura alternativa.

---

# 2438. Effect Families

Exemplo:

```text
particle
light
glitch
energy
weather
cinematic
```

---

# 2439. Molduras

Embora o foco principal seja avatar, molduras precisam ser refinadas.

---

# 2440. Frame depth

Criar layers.

---

# 2441. Frame material

Pode simular:

- metal;
- glass;
- neon.

---

# 2442. Frame must not suffocate avatar

---

# 2443. Presets / Collections

No clássico, precisam virar composições curadas.

---

# 2444. Preset pode incluir

```text
face
hair
outfit
accessories
background
aura
frame
look
```

---

# 2445. Collection identity

Precisa ser visualmente coerente.

---

# 2446. Photo Mode 2D

Precisa ser expandido.

---

# 2447. Photo framing

Permitir:

- full;
- bust;
- portrait;
- square;
- vertical.

---

# 2448. Photo high-quality render

SVG pode ser renderizado em resolução superior.

---

# 2449. Vector advantage

Aproveitar natureza vetorial para export nítido.

---

# 2450. High-res raster export

Gerar PNG/WebP em alta resolução.

---

# 2451. Transparent background

Suportar.

---

# 2452. Include effects toggle

---

# 2453. Include frame toggle

---

# 2454. Include background toggle

---

# 2455. Pose simulation 2D

O clássico pode ter microposes.

---

# 2456. Whole-body variants

Pode haver:

- neutral;
- hero;
- relaxed.

---

# 2457. Não tentar rig 2D complexo inicialmente

Pode usar transforms e variantes.

---

# 2458. Breathing

Transform muito sutil.

---

# 2459. Blink

Sim.

---

# 2460. Aura movement

Sim.

---

# 2461. Companion movement

Sim.

---

# 2462. Idle 2D

Precisa parecer vivo sem ser cartoon exagerado.

---

# 2463. Motion Reduce

Respeitar `prefers-reduced-motion` quando aplicável.

---

# 2464. UX visual-first

A sidebar de assets precisa priorizar thumbnails.

---

# 2465. Menos texto

Como solicitado anteriormente.

---

# 2466. Cards maiores

Especialmente:

- faces;
- hair;
- outfits;
- backgrounds.

---

# 2467. Responsive grid

Ajustar conforme largura da sidebar.

---

# 2468. Sidebar resize

A largura ajustável já foi solicitada e deve ser preservada.

---

# 2469. Scroll interno

Obrigatório para não tirar avatar do foco.

---

# 2470. Asset Panel Bottom Layout

No Modo Clássico, assegurar que a estrutura visual solicitada anteriormente seja respeitada onde definido:

> preview dominante e opções dos assets na posição estrutural planejada, não perpetuamente espremidas ao lado do avatar quando a especificação aprovada prevê outra disposição.

---

# 2471. Não quebrar modo responsivo

Desktop pode ter estrutura horizontal/vertical própria.

---

# 2472. Mobile

Pode usar drawer/bottom sheet.

---

# 2473. Classic renderer performance

SVG complexo pode ficar pesado.

---

# 2474. Node budget

Controlar quantidade de elementos SVG.

---

# 2475. Def reuse

Reutilizar:

- gradients;
- filters;
- masks;
- patterns.

---

# 2476. DOM complexity

Evitar milhares de nodes por avatar.

---

# 2477. Group assets

Usar `<g>` semanticamente.

---

# 2478. Memoization

Evitar recalcular todo SVG em cada UI update.

---

# 2479. Asset-level rendering

Só atualizar layers afetados quando viável.

---

# 2480. Animation performance

Preferir transforms/opacity.

---

# 2481. Blur performance

Controlar.

---

# 2482. Large filter regions

Evitar.

---

# 2483. SVG raster fallback

Se algum efeito premium for caro demais, avaliar raster layer.

---

# 2484. Hybrid 2.5D

O clássico pode combinar:

- SVG;
- WebP;
- canvas;
- CSS layers;

quando fizer sentido.

---

# 2485. Não dogmatizar “100% vetor”

O objetivo é qualidade e performance.

---

# 2486. Mas preservar vantagens do vetor

Principalmente:

- nitidez;
- recoloração;
- escalabilidade.

---

# 2487. Texture overlays

Podem ser raster leves.

---

# 2488. Noise textures

Muito discretas.

---

# 2489. Material patterns

Podem ser SVG patterns ou raster.

---

# 2490. Shader-like effects

CSS/SVG filter quando barato.

---

# 2491. Classic Asset Pipeline

Criar pipeline formal, assim como o 3D.

---

# 2492. Asset contract 2D

Cada asset deve possuir:

```text
id
category
layers
colors
materials
rendererSupport
visualQuality
preview
rarity
collection
```

---

# 2493. Avoid direct hardcoded JSX proliferation

Se hoje muitos assets são funções individuais, preparar evolução para um registry mais declarativo onde possível.

---

# 2494. Não reescrever tudo de uma vez

Migrar gradualmente.

---

# 2495. Classic Manifest

Pode existir separado ou integrado ao manifest principal.

---

# 2496. Semantic asset mapping

Idealmente:

```text
asset logical id
├── classic representation
└── 3d representation
```

---

# 2497. Asset versioning

Preservar.

---

# 2498. QA visual

Classic também precisa de VisualQA.

---

# 2499. Golden Classic screenshots

Gerar:

```text
male_full
male_bust
male_face
female_full
female_bust
female_face
```

---

# 2500. Background QA

Vários backgrounds.

---

# 2501. Aura QA

Várias auras.

---

# 2502. Material QA

Roupas.

---

# 2503. Frame QA

Molduras.

---

# 2504. Responsive QA

Tamanhos de viewport.

---

# 2505. Classic Hard Fail

Reprovar se:

- layers fora de ordem;
- cabelo atrás/na frente incorretamente;
- roupa não altera;
- cor não funciona;
- olhos desalinhados;
- fundo sem contraste;
- shadow incorreta;
- asset desaparece no export;
- frame cobre personagem;
- preview não representa resultado.

---

# 2506. Premium Hard Fail

Também reprovar se:

- rosto continua parecendo elipse básica;
- cabelo parece bloco;
- roupa parece pintura;
- material é flat;
- aura é apenas glow.

---

# 2507. Soft Fail

Exemplos:

- micro diferença de gradiente;
- efeito simplificado em viewport pequeno.

---

# 2508. Classic Visual Score

Sugestão:

```text
Face               9/10
Hair               9/10
Clothing           8/10
Depth              9/10
Materials          8/10
Accessories        8/10
Background         9/10
Animation          8/10
Composition        9/10
Performance        9/10
```

---

# 2509. Golden Classic Set

Criar:

```text
C01 Male Executive
C02 Female Casual
C03 Urban
C04 Cyber
C05 Royal
C06 Adventure
```

---

# 2510. Golden Set deve demonstrar estilos diferentes

Mas mesma linguagem visual.

---

# 2511. Classic Studio Look

Benchmark.

---

# 2512. Classic Hero Look

Impacto.

---

# 2513. Classic Neon Look

VFX.

---

# 2514. Classic Portrait

Rosto.

---

# 2515. Before/After obrigatório

Usar mesma configuração sem alterar identidade.

---

# 2516. Comparações por categoria

Criar:

```text
Face Legacy vs Premium
Hair Legacy vs Premium
Clothing Legacy vs Premium
Background Legacy vs Premium
Aura Legacy vs Premium
```

---

# 2517. Não esconder legado durante QA

Precisamos enxergar o salto.

---

# 2518. Legacy fallback

Preservar durante rollout.

---

# 2519. Feature flag

Se já houver infraestrutura de flags, usar.

---

# 2520. Não duplicar editor inteiro

Mais uma vez:

```text
ClassicPremiumRenderer
```

só deve existir como camada separada se tecnicamente necessário.

Evitar criar outro Avatar Studio inteiro.

---

# 2521. Progressive Migration

Sugestão:

```text
FACE
↓
HAIR
↓
EYES/MOUTH
↓
CLOTHING
↓
ACCESSORIES
↓
BACKGROUND
↓
AURA
↓
PRESETS
```

---

# 2522. Default classic avatar

Deve migrar cedo.

---

# 2523. Onboarding

Usar Classic Premium se o clássico for default em algum contexto.

---

# 2524. Vitrine

Não destacar assets Legacy.

---

# 2525. Search/filter

Preservar.

---

# 2526. Visual Quality filter interno

Modo Dev pode filtrar:

```text
Legacy
Premium
Hero
```

---

# 2527. Asset count

Continuar aumentando após aprovação.

---

# 2528. Mas qualidade antes de escala

Mesma regra do 3D.

---

# 2529. Triplicar faces/hair/eyes/mouth

O pedido original continua válido.

Mas apenas depois de estabelecer o novo padrão.

---

# 2530. Background expansion

Também aumentar significativamente.

---

# 2531. Frame expansion

Mais impacto e variedade.

---

# 2532. Effect expansion

Mais famílias.

---

# 2533. Preset expansion

Mais composições curadas.

---

# 2534. History

Aumentar histórico e garantir que visual premium seja reconstituído corretamente.

---

# 2535. Save stability

IDs precisam permanecer estáveis.

---

# 2536. Photo asset parity

Os assets selecionados no editor precisam poder ser usados na seção Foto.

Requisito já apontado anteriormente.

---

# 2537. Photo should not reconstruct another avatar

Usar o mesmo state.

---

# 2538. Same composition state

Preservar:

- rosto;
- roupa;
- cabelo;
- acessórios;
- efeito.

---

# 2539. Photo-specific overrides

Somente:

- câmera;
- fundo;
- look;
- pose.

---

# 2540. History and Photo

Mudanças fotográficas podem entrar em histórico separado se necessário.

---

# 2541. Vitrine funcional

O modo clássico premium precisa aparecer corretamente na Vitrine.

---

# 2542. Thumbnail generation

Automatizar.

---

# 2543. Hero thumbnail

Pode ter resolução maior.

---

# 2544. Asset thumbnail

Categoria apropriada.

---

# 2545. Face thumb

Close-up.

---

# 2546. Hair thumb

Busto.

---

# 2547. Clothing thumb

Full/¾.

---

# 2548. Background thumb

Wide.

---

# 2549. Aura thumb

Pode ter short preview.

---

# 2550. Accessibility

As opções não podem depender só de cor.

---

# 2551. Keyboard navigation

Cards precisam continuar navegáveis.

---

# 2552. Focus states

Claramente visíveis.

---

# 2553. Reduced motion

Respeitar.

---

# 2554. Contrast

UI não pode esconder detalhes.

---

# 2555. Responsive preview

Avatar deve continuar protagonista.

---

# 2556. Art Bible — Classic

Criar capítulo próprio.

---

# 2557. Documentar

- face shapes;
- hair;
- materials;
- shadows;
- layers;
- backgrounds;
- VFX;
- animations.

---

# 2558. Anti-patterns

Documentar:

```text
❌ uma elipse para todos os rostos
❌ cabelo como bloco
❌ roupa apenas pintada
❌ mesma aura mudando cor
❌ fundo wallpaper
❌ uso indiscriminado de drop-shadow
❌ gradiente genérico em todos os materiais
❌ excesso de blur
❌ layer ordering inconsistente
```

---

# 2559. Definition of Done da Parte 10

Esta parte só poderá ser considerada concluída quando houver:

1. nova direção 2D/2.5D documentada;
2. Golden Classic Male;
3. Golden Classic Female;
4. nova geração de face;
5. nova geração de cabelo;
6. nova geração de olhos/boca;
7. nova geração de roupas;
8. multi-layer clothing;
9. acessórios premium;
10. fundos em profundidade;
11. auras premium;
12. microanimações;
13. semantic parity com 3D;
14. Photo Mode compatível;
15. Vitrine funcional;
16. thumbnails;
17. VisualQA;
18. Before/After;
19. performance validation;
20. rollout progressivo.

---

# 2560. Gate final da Parte 10

Não iniciar migração massiva de centenas de assets enquanto não houver aprovação de:

```text
GOLDEN CLASSIC MALE
+
GOLDEN CLASSIC FEMALE
+
FACE
+
HAIR
+
CLOTHING
+
BACKGROUND
+
AURA
+
PHOTO
```

---

# 2561. Resultado esperado da Parte 10

Ao finalizar esta etapa, o usuário não deverá olhar para o clássico e pensar:

> “Esse é o modo antigo.”

Precisa pensar:

> **“Esse é o estilo 2D premium do Avatar Studio.”**

O clássico deve possuir uma identidade própria suficientemente forte para coexistir com o 3D sem parecer fallback barato.

A diferença deverá ser:

```text
CLASSIC
= premium illustration / 2.5D

3D
= premium volumetric character
```

e não:

```text
CLASSIC
= versão ruim

3D
= versão boa
```

---

## FIM DA PARTE 10/12

**Próxima: PARTE 11/12 — PIPELINE DE PRODUÇÃO DE ASSETS, IMPORTAÇÃO, MANIFESTS, LOD, VALIDAÇÃO AUTOMÁTICA, VISUAL QA, GOLDEN TESTS, REGRESSÃO VISUAL, PERFORMANCE, TELEMETRIA E FERRAMENTAS INTERNAS PARA ESCALAR O CATÁLOGO.**





# MEGA BRIEFING — ELEVAÇÃO GRÁFICA AAA DO AVATAR STUDIO DSHOW  
## PARTE 11/12 — PIPELINE DE PRODUÇÃO DE ASSETS, IMPORTAÇÃO, MANIFESTS, LOD, VALIDAÇÃO AUTOMÁTICA, VISUAL QA, GOLDEN TESTS, REGRESSÃO VISUAL, PERFORMANCE, TELEMETRIA E FERRAMENTAS INTERNAS PARA ESCALAR O CATÁLOGO

# 2562. Objetivo da Parte 11

Esta parte deverá transformar o pipeline de assets do Avatar Studio em uma **linha de produção previsível, validável, escalável e segura**, capaz de sustentar a expansão do catálogo sem degradar qualidade.

A auditoria mostrou que o projeto já possui uma fundação importante de pipeline:

- validação de GLB;
- geração/uso de LOD;
- limites de triângulos;
- redução de texturas;
- Meshopt;
- validação de UV;
- validação de rig;
- hashes;
- manifests;
- publicação por scripts. 

Portanto, não devemos substituir esse pipeline.

Precisamos ampliá-lo para incluir:

> **qualidade visual, compatibilidade, regressão e observabilidade.**

---

# 2563. Princípio central

Hoje um asset pode tecnicamente ser válido e ainda ser visualmente ruim.

Logo:

```text
TECHNICALLY VALID
!=
PRODUCTION READY
```

A nova regra será:

```text
TECHNICAL QA
+
VISUAL QA
+
COMPATIBILITY QA
+
PERFORMANCE QA
=
PRODUCTION READY
```

---

# 2564. Pipeline oficial por estágios

Todo asset premium deverá seguir:

```text
SOURCE
↓
INGEST
↓
NORMALIZATION
↓
OPTIMIZATION
↓
LOD
↓
TECHNICAL VALIDATION
↓
MATERIAL VALIDATION
↓
FIT VALIDATION
↓
VISUAL QA
↓
GOLDEN REGRESSION
↓
PUBLISH
↓
MONITOR
```

---

# 2565. Source Stage

Registrar:

- origem;
- autor;
- licença;
- pacote;
- versão;
- data;
- arquivo original.

---

# 2566. Não perder o source original

O source deve permanecer separado do asset runtime.

---

# 2567. Source Immutable

Preferencialmente:

```text
/source
```

não deve ser modificado.

O pipeline gera derivados.

---

# 2568. Runtime derivative

Separar:

```text
SOURCE
→ WORKING
→ RUNTIME
```

---

# 2569. Licensing

O pipeline atual já rastreia licença/origem em manifests. 

Preservar e tornar obrigatório.

---

# 2570. Sem licença, sem publicação

Hard gate.

---

# 2571. Asset ID

Criar ID estável antes da publicação.

---

# 2572. ID técnico ≠ nome de marketing

Exemplo:

```text
hair_afro_01
```

pode aparecer como:

> “Atlas Curls”

---

# 2573. Naming Convention

Formalizar por categoria.

Exemplo:

```text
body_human_m_standard_01
face_angular_01
hair_short_clean_01
top_blazer_01
acc_glasses_01
vfx_aura_energy_01
```

---

# 2574. Não usar nomes como

```text
final.glb
final2.glb
hair_new.glb
hair_ok.glb
```

---

# 2575. Versionamento separado

Exemplo:

```text
assetId = hair_short_clean_01
assetVersion = 3
```

---

# 2576. Manifest como source of truth

O manifest deverá descrever:

- ID;
- versão;
- categoria;
- renderer;
- LOD;
- materiais;
- sockets;
- compatibilidade;
- visualQuality;
- licença;
- paths;
- previews;
- QA status.

---

# 2577. Não espalhar metadados em arquivos diferentes sem necessidade

Consolidar.

---

# 2578. Schema versionado

O manifest precisa possuir versão.

---

# 2579. Manifest validation

Antes de build/publicação:

```text
schema validate
```

obrigatório.

---

# 2580. Unknown fields

Decidir política:

- warning;
- fail.

Para campos críticos, fail.

---

# 2581. Missing fields

Fail.

---

# 2582. Invalid category

Fail.

---

# 2583. Invalid socket

Fail.

---

# 2584. Invalid renderer support

Fail.

---

# 2585. Duplicate asset ID

Fail absoluto.

---

# 2586. Duplicate version

Fail.

---

# 2587. Missing source/license

Fail.

---

# 2588. Runtime path missing

Fail.

---

# 2589. Thumbnail missing

Production asset:
- fail ou warning grave.

Hero:
- fail.

---

# 2590. Preview missing

Hero:
- fail.

---

# 2591. Ingest stage

Ao importar GLB/asset:

- validar estrutura;
- registrar tamanho;
- listar meshes;
- listar materials;
- listar textures;
- listar bones;
- listar morphs;
- listar animations.

---

# 2592. Asset Report automático

Gerar algo como:

```text
Meshes: 4
Triangles: 32,410
Materials: 3
Textures: 6
Bones: 65
Morphs: 12
Animations: 3
```

---

# 2593. Histórico dos reports

Guardar por versão.

---

# 2594. Diff entre versões

Exemplo:

```text
Triangles +18%
Textures +50%
Materials +2
```

---

# 2595. Alertar regressão

Se nova versão aumenta custo sem justificativa, warning.

---

# 2596. Normalization

Padronizar:

- escala;
- eixo;
- pivot;
- transforms;
- naming;
- rig;
- material metadata.

---

# 2597. Transform freeze

Quando apropriado, aplicar transforms no pipeline.

---

# 2598. Scale unit

Formalizar unidade.

Preferência:

```text
1 unit = 1 meter
```

ou padrão já usado.

---

# 2599. Axis convention

Documentar.

---

# 2600. Forward direction

Documentar.

---

# 2601. Pivot convention

Documentar por categoria.

---

# 2602. Body pivot

Pés/origem coerente.

---

# 2603. Hair pivot

Cabeça.

---

# 2604. Hand prop pivot

Grip point.

---

# 2605. Back accessory pivot

Back anchor.

---

# 2606. Pet pivot

Ground point.

---

# 2607. Bounding box

Calcular automaticamente.

---

# 2608. Bounding sphere

Também.

---

# 2609. Bounds metadata

Salvar no manifest se útil.

---

# 2610. Oversized asset warning

Se muito fora do esperado.

---

# 2611. Tiny asset warning

Mesmo princípio.

---

# 2612. Mesh naming

Padronizar.

---

# 2613. Material naming

Padronizar semanticamente.

---

# 2614. Bone naming

Preservar rig canônico.

---

# 2615. Rig validation

O pipeline atual já valida rig/bones. 

Expandir com:

- hierarchy;
- required bones;
- optional bones;
- socket references.

---

# 2616. Canonical Rig ID

Exemplo:

```text
rig: ubc_v1
```

---

# 2617. Rig mismatch

Fail para roupas/hair skinned que dependem dele.

---

# 2618. Bone count change

Warning ou fail conforme categoria.

---

# 2619. Animation compatibility

Validar clips contra rig.

---

# 2620. Morph validation

Listar:

- nomes;
- quantidade;
- vertex consistency.

---

# 2621. Required morphs

Para assets específicos.

Exemplo:

face premium pode exigir:

```text
blink_l
blink_r
smile
```

quando esse contrato for adotado.

---

# 2622. Morph semantic mapping

No manifest.

---

# 2623. Unknown morph names

Warning.

---

# 2624. Invalid morph range

Fail.

---

# 2625. LOD generation

A arquitetura atual já prevê LOD0/1/2. 

Preservar.

---

# 2626. LOD roles

```text
LOD0 = close/high fidelity
LOD1 = standard
LOD2 = low/far
```

---

# 2627. LOD triangle gates

Usar os limites atuais como baseline, ajustando por categoria quando necessário. A documentação existente cita gates de aproximadamente 60k/25k/8k. 

---

# 2628. Category-specific gate

Um cabelo Hero pode ter budget diferente de um brinco.

---

# 2629. LOD Quality Gate

Não basta passar triangle count.

VisualQA obrigatório.

---

# 2630. LOD silhouette diff

Criar comparação automática ou semiautomática.

---

# 2631. Render silhouette LOD0/1/2

Comparar.

---

# 2632. Large silhouette deviation

Fail.

---

# 2633. Face landmark preservation

Verificar:

- jaw;
- nose;
- eye region.

---

# 2634. Hair silhouette preservation

Muito importante.

---

# 2635. Clothing landmark preservation

Gola/lapela etc.

---

# 2636. Accessory landmark preservation

Forma icônica.

---

# 2637. Meshopt

Preservar pipeline atual. 

---

# 2638. Draco

Se houver ou for introduzido, comparar custo de decode.

Não usar por moda.

---

# 2639. Meshopt metadata

Registrar compressão.

---

# 2640. File size gate

Criar budgets aproximados.

---

# 2641. Não usar tamanho isoladamente como fail

Um Hero asset pode ser maior.

Mas precisa justificar.

---

# 2642. Texture pipeline

A infraestrutura atual já reduz texturas por LOD e converte para formatos de runtime. 

Preservar.

---

# 2643. Texture classification

Detectar:

- baseColor;
- normal;
- roughness;
- metalness;
- AO;
- emissive;
- alpha.

---

# 2644. Color space validation

BaseColor/emissive:
- sRGB.

Data maps:
- linear.

---

# 2645. Texture dimension validation

Powers of two quando necessário.

---

# 2646. Aspect ratio

Validar.

---

# 2647. Max resolution

Por categoria/LOD.

---

# 2648. Texture alpha

Detectar se realmente usado.

---

# 2649. Alpha texture sem material alpha

Warning.

---

# 2650. Material alpha sem alpha texture

Warning.

---

# 2651. Normal map validation

Detectar arquivo vazio/flat quando possível.

---

# 2652. Roughness map validation

Mesma lógica.

---

# 2653. Texture hash

Registrar.

---

# 2654. Dedupe

Se duas texturas idênticas existirem, deduplicar quando seguro.

---

# 2655. Shared texture library

Para materiais comuns.

---

# 2656. Thumbnail pipeline

Gerar automaticamente.

---

# 2657. Categoria define câmera

Face:
- close-up.

Hair:
- bust.

Clothing:
- ¾.

Accessory:
- appropriate focus.

Background:
- wide.

---

# 2658. Thumbnail render environment

Usar ambiente neutro padronizado.

---

# 2659. Thumbnail resolution

Definir por categoria.

---

# 2660. Thumbnail compression

Otimizar sem destruir leitura.

---

# 2661. Preview pipeline

Para Hero/Premium:

- render maior;
- talvez turntable curta.

---

# 2662. Turntable

Opcionalmente gerar:

```text
0°
90°
180°
270°
```

ou vídeo curto.

---

# 2663. VisualQA Stage

Aqui começa a principal ampliação do pipeline.

---

# 2664. Visual QA Checklist por categoria

Não usar checklist único.

---

# 2665. Body

- silhouette;
- anatomy;
- deformation;
- hands;
- feet.

---

# 2666. Face

- front;
- ¾;
- profile;
- expressions.

---

# 2667. Hair

- silhouette;
- hairline;
- backlight;
- head fit.

---

# 2668. Clothing

- fit;
- layers;
- deformation;
- material.

---

# 2669. Accessory

- socket;
- fit;
- material;
- clipping.

---

# 2670. VFX

- depth;
- loop;
- overdraw;
- readability.

---

# 2671. Scenario

- framing;
- depth;
- contrast.

---

# 2672. VisualQA Evidence

Guardar screenshots.

---

# 2673. Evidence naming

Exemplo:

```text
assetId_v03_front.png
assetId_v03_34.png
assetId_v03_profile.png
```

---

# 2674. QA metadata

Registrar:

```text
reviewer
date
status
notes
version
```

---

# 2675. QA status

Como definido:

```text
pending
approved
approved_with_notes
rework
rejected
```

---

# 2676. Hard Fail automation

Alguns casos podem ser detectados automaticamente.

Exemplo:

- missing socket;
- missing texture;
- triangle gate;
- invalid material;
- no thumbnail;
- invalid rig.

---

# 2677. Visual Hard Fail humano

Outros exigem revisão visual.

---

# 2678. Golden Tests

Criar um conjunto de cenas oficiais.

---

# 2679. Golden Male

Sempre presente.

---

# 2680. Golden Female

Sempre presente.

---

# 2681. Golden Skin Tones

Light/medium/dark.

---

# 2682. Golden Hair

Curto/longo/afro.

---

# 2683. Golden Body Types

Standard/broad/athletic quando homologados.

---

# 2684. Golden Looks

Studio/Hero/Portrait.

---

# 2685. Golden Scenarios

Studio + 1 complexo.

---

# 2686. Golden test matrix

Não executar todas as combinações para todo asset.

Selecionar matriz relevante por categoria.

---

# 2687. Exemple — Glasses

Testar:

```text
Face Narrow
Face Broad
Hair Short
Portrait
¾
```

---

# 2688. Example — Jacket

```text
Male Standard
Female/compatible body
Arms Up
Wave
Hero
LOD0/1/2
```

---

# 2689. Example — Wings

```text
Back
¾
Hero
Portrait-safe
LOD
Camera bounds
```

---

# 2690. Visual Regression System

Criar baseline de screenshots.

---

# 2691. Baseline versioning

Cada release aprovado gera novo baseline.

---

# 2692. Pixel diff

Pode ajudar a detectar alterações.

---

# 2693. Não aprovar/rejeitar somente por pixel diff

Mudanças de AA podem gerar diferenças.

---

# 2694. Perceptual diff

Se possível, usar métrica perceptual.

---

# 2695. Human review

Continua necessária para mudanças visuais relevantes.

---

# 2696. Regression categories

Classificar:

```text
expected
unexpected
needs_review
```

---

# 2697. Auto screenshots em CI

Idealmente, rodar em ambiente determinístico.

---

# 2698. Fixed viewport

Obrigatório.

---

# 2699. Fixed DPR

Obrigatório.

---

# 2700. Fixed renderer settings

Obrigatório.

---

# 2701. Fixed animation time

Congelar frame.

---

# 2702. Fixed random seed

Para particles/VFX.

---

# 2703. Deterministic VFX

Golden snapshots precisam de seed fixa.

---

# 2704. Font/environment consistency

Para UI snapshots.

---

# 2705. Browser version

Fixar quando possível.

---

# 2706. Golden Renderer Route

Criar rota interna de QA.

Exemplo conceitual:

```text
/avatar-studio/qa
```

ou equivalente.

---

# 2707. QA route features

Permitir:

- carregar asset;
- trocar body;
- trocar camera;
- trocar look;
- LOD;
- wireframe;
- screenshots.

---

# 2708. Asset Inspector

Como definido anteriormente.

---

# 2709. Inspector must show

```text
ID
version
quality
LOD
triangles
materials
textures
draw calls
bones
morphs
socket
license
QA
```

---

# 2710. One-click screenshot

Por angle.

---

# 2711. One-click QA report

Gerar relatório.

---

# 2712. QA notes

Permitir registro interno.

---

# 2713. Search asset by ID

Obrigatório.

---

# 2714. Filter by status

```text
pending
rework
approved
```

---

# 2715. Filter by quality

```text
legacy
production
premium
hero
```

---

# 2716. Performance Benchmark

Todo Golden Asset precisa ter custo medido.

---

# 2717. Métricas

- load time;
- decode time;
- first render;
- triangles;
- draw calls;
- texture memory;
- FPS;
- frame time.

---

# 2718. Performance budget por classe

Exemplo:

```text
face
hair
clothing
small accessory
hero accessory
pet
scenario
```

---

# 2719. Budget violation

Warning ou fail conforme severidade.

---

# 2720. Hero exception

Pode exceder algum budget, mas deve ter justificativa explícita.

---

# 2721. No silent exception

Registrar.

---

# 2722. Performance regression

Nova versão não deve duplicar custo sem justificativa.

---

# 2723. Bundle impact

Medir se asset entra no bundle indevidamente.

Assets pesados devem ser lazy-loaded.

---

# 2724. Code-splitting

Preservar.

---

# 2725. No importing GLB directly into main JS bundle if avoidable

---

# 2726. Runtime loading

Por manifest/path.

---

# 2727. Cache strategy

Definir.

---

# 2728. Memory cache

Para recentes.

---

# 2729. Browser cache

Usar hashes/versioned paths.

---

# 2730. CDN-ready paths

Preparar se necessário.

---

# 2731. Cache invalidation

Asset version deve gerar path/hash diferente.

---

# 2732. No stale asset after deploy

---

# 2733. Telemetria do Avatar Studio

Criar ou ampliar eventos.

---

# 2734. Runtime metrics

Registrar:

- asset load failure;
- texture failure;
- WebGL context loss;
- shader failure;
- FPS tier;
- LOD transitions;
- fallback activation.

---

# 2735. Catalog metrics

Registrar:

- asset selected;
- asset equipped;
- load time;
- preview failure.

---

# 2736. Não coletar dados pessoais desnecessários

Telemetria técnica.

---

# 2737. Error context

Registrar:

```text
assetId
version
rendererMode
deviceTier
browser
```

quando apropriado.

---

# 2738. Error rate por asset

Muito útil.

---

# 2739. Assets problemáticos

Dashboard interno pode ordenar:

```text
highest error rate
highest load time
highest GPU cost
```

---

# 2740. VisualQA telemetry

Não é runtime do usuário, mas pipeline interno.

---

# 2741. Asset health score

Criar score interno opcional.

Exemplo:

```text
Technical QA
Visual QA
Performance
Error Rate
```

---

# 2742. Não transformar score em métrica cega

Serve para priorização.

---

# 2743. Pipeline CLI

Scripts atuais já existem para validação/publicação.

Consolidar num CLI amigável.

Exemplo conceitual:

```bash
avatar-assets validate <asset>
avatar-assets build <asset>
avatar-assets qa <asset>
avatar-assets publish <asset>
```

---

# 2744. Não duplicar scripts

Pode ser wrapper sobre scripts existentes.

---

# 2745. Dry Run

Obrigatório para publicação.

---

# 2746. Example

```bash
avatar-assets publish asset_id --dry-run
```

---

# 2747. Dry run report

Mostrar:

- files;
- changes;
- manifest diff;
- QA status.

---

# 2748. Publish gate

Não publicar se:

```text
TechnicalQA != approved
```

---

# 2749. Premium publish gate

Também exige:

```text
VisualQA = approved
```

---

# 2750. Hero publish gate

Exige:

- visual;
- performance;
- previews;
- golden test.

---

# 2751. Override

Se realmente necessário, apenas modo explícito e logado.

---

# 2752. No hidden force publish

---

# 2753. Rollback

Cada publicação precisa permitir voltar versão.

---

# 2754. Manifest rollback

Preservar versões anteriores.

---

# 2755. Asset binary rollback

Preservar derivado anterior.

---

# 2756. User saves

Como asset ID permanece, rollback visual não quebra estado.

---

# 2757. Canary rollout

Para assets muito importantes, considerar flag interna.

---

# 2758. New visual version behind flag

Pode ser útil durante homologação.

---

# 2759. Internal-only assets

Suportar:

```text
visibility: internal
```

---

# 2760. Dev-only assets

Suportar.

---

# 2761. Production assets

Suportar.

---

# 2762. Marketing/Hero assets

Tag.

---

# 2763. Deprecation

Asset antigo pode receber:

```text
deprecated: true
```

sem apagar imediatamente.

---

# 2764. Successor

```text
successorId
```

quando aplicável.

---

# 2765. Hidden from catalog

Pode continuar carregável em save antigo.

---

# 2766. Garbage collection de assets

Não apagar arquivo antigo enquanto houver saves dependentes sem estratégia.

---

# 2767. Usage report

Se possível, saber se asset legado ainda é usado.

---

# 2768. Catálogo em escala

Quando chegarmos a milhares de assets, precisamos de busca eficiente.

---

# 2769. Index

Campos úteis:

- category;
- subcategory;
- rarity;
- collection;
- visualQuality;
- renderer;
- tags.

---

# 2770. Search tokens

Pré-calcular quando útil.

---

# 2771. Thumbnails lazy load

Obrigatório.

---

# 2772. Virtualized grid

Para listas muito grandes.

---

# 2773. Não renderizar 1.000 cards no DOM

---

# 2774. Infinite scroll / pagination

Escolher conforme UX.

---

# 2775. Preserve selected item

Ao filtrar, não perder estado.

---

# 2776. Catalog schema parity

2D e 3D devem usar conceitos semelhantes.

---

# 2777. Renderer-specific metadata

Pode existir dentro do mesmo manifest.

---

# 2778. Example conceptual

```json
{
  "id": "hair_short_clean_01",
  "renderers": {
    "classic": {},
    "3d": {}
  }
}
```

---

# 2779. Não forçar asset a suportar ambos

---

# 2780. Compatibility flag

Claro.

---

# 2781. Pipeline 2D

Também formalizar.

---

# 2782. 2D TechnicalQA

Verificar:

- SVG syntax;
- IDs;
- duplicate defs;
- dimensions;
- unsupported filter;
- file size.

---

# 2783. 2D VisualQA

Verificar:

- layering;
- colors;
- masks;
- preview;
- export.

---

# 2784. 2D Performance

Medir:

- node count;
- filters;
- animation cost.

---

# 2785. SVG sanitizer

Se assets externos entrarem, sanitizar.

---

# 2786. No scripts inside SVG

---

# 2787. No unsafe external refs

---

# 2788. Unique SVG IDs

Evitar conflitos entre assets.

---

# 2789. Prefix IDs

Pipeline pode prefixar.

---

# 2790. Gradient dedupe

Reutilizar quando seguro.

---

# 2791. Visual diff 2D

Mais determinístico que 3D em vários casos.

---

# 2792. Golden screenshots 2D

Integrar no mesmo sistema.

---

# 2793. CI Pipeline

Idealmente separar stages:

```text
lint
unit
asset-schema
asset-technical
build
visual
performance
```

---

# 2794. Não rodar todos os testes pesados em toda alteração pequena

Usar affected assets.

---

# 2795. Changed Asset Detection

Git diff pode descobrir assets modificados.

---

# 2796. Run targeted QA

Exemplo:

- cabelo mudou → rodar Hair Golden Matrix.

---

# 2797. Renderer code changed

Rodar full Golden Matrix.

---

# 2798. Material system changed

Rodar material + Golden avatars.

---

# 2799. Lighting changed

Rodar todos Golden Looks.

---

# 2800. Camera changed

Rodar framing baselines.

---

# 2801. Manifest changed

Schema + targeted render.

---

# 2802. Performance baseline storage

Guardar histórico.

---

# 2803. Regression threshold

Definir por métrica.

---

# 2804. Example

```text
FPS -15%
Load +40%
Texture memory +50%
```

→ revisão obrigatória.

---

# 2805. Não usar thresholds iguais para tudo

Hero assets podem ter outro budget.

---

# 2806. Dashboard interno de qualidade

Criar visão consolidada.

---

# 2807. Cards do dashboard

Exemplo:

```text
Assets total
Production
Premium
Hero
Pending QA
Rework
Legacy
Failed
```

---

# 2808. Category breakdown

Faces, hair, clothing etc.

---

# 2809. Visual debt

Mostrar por categoria.

---

# 2810. Example

```text
Hair: HIGH
Face: MEDIUM
Accessories: HIGH
Materials: MEDIUM
```

---

# 2811. Pipeline throughput

Medir:

- assets criados;
- assets aprovados;
- avg QA time;
- rejection rate.

---

# 2812. Rejection reason

Classificar:

- clipping;
- material;
- performance;
- fit;
- style.

---

# 2813. Isso ajuda a melhorar o processo

---

# 2814. No vanity metrics

“1.400 assets” sozinho não significa sucesso.

---

# 2815. KPI novo

Exemplo:

```text
% Premium Approved
```

mais relevante.

---

# 2816. Art Bible version enforcement

Cada asset pode declarar:

```text
artBibleVersion
```

quando útil.

---

# 2817. Old version

Legacy.

---

# 2818. New production

Precisa cumprir atual.

---

# 2819. Exceptions

Documentadas.

---

# 2820. Asset templates

Criar templates de produção.

---

# 2821. Hair template

Inclui:

- naming;
- material slots;
- LOD;
- thumbnail;
- QA.

---

# 2822. Clothing template

Inclui:

- rig;
- body compatibility;
- material channels.

---

# 2823. Accessory template

Inclui:

- socket;
- pivot;
- occupancy.

---

# 2824. VFX template

Inclui:

- bounds;
- tiers;
- seed.

---

# 2825. Scenario template

Inclui:

- camera zones;
- ground;
- environment.

---

# 2826. Export presets DCC

Se equipe usar Blender ou ferramenta equivalente, criar presets.

---

# 2827. Export settings

Padronizar:

- scale;
- animations;
- normals;
- tangents;
- morphs.

---

# 2828. Pre-export validator

Ideal.

---

# 2829. Blender helper scripts

Opcional, mas muito útil em escala.

---

# 2830. Auto naming

Pode ajudar.

---

# 2831. Auto pivot check

Pode ajudar.

---

# 2832. Auto rig check

Pode ajudar.

---

# 2833. Asset preview before export

Pode ajudar.

---

# 2834. DCC tooling não deve virar dependência frágil

CLI de runtime continua sendo gate final.

---

# 2835. Third-party asset ingestion

Nunca publicar diretamente.

---

# 2836. Required workflow

```text
THIRD PARTY
↓
LICENSE CHECK
↓
ART CURATION
↓
CLEANUP
↓
DSHOW MATERIALS
↓
FIT
↓
LOD
↓
QA
```

---

# 2837. Art consistency pass

Obrigatório.

---

# 2838. Pack identity removal

Quando necessário, adaptar suficientemente para não parecer biblioteca genérica.

---

# 2839. Provenance remains

Mesmo após adaptação.

---

# 2840. Security

Assets externos precisam ser tratados como input não confiável.

---

# 2841. GLB parsing

Validar.

---

# 2842. File size limit

Aplicar.

---

# 2843. Malformed file

Fail.

---

# 2844. External URL references

Bloquear ou resolver via pipeline.

---

# 2845. SVG sanitization

Como acima.

---

# 2846. No executable content

---

# 2847. Build reproducibility

Idealmente:

```text
same source + same pipeline version
=
same output
```

---

# 2848. Tool versions

Registrar.

---

# 2849. Pipeline version

Registrar no manifest/build metadata.

---

# 2850. Hash generated outputs

A infraestrutura atual já usa hashes em seu pipeline. 

Preservar.

---

# 2851. Asset integrity

Runtime pode verificar quando necessário.

---

# 2852. Cache busting

Hash também ajuda.

---

# 2853. Build logs

Guardar.

---

# 2854. Failed pipeline report

Precisa ser legível.

---

# 2855. Não retornar 2.000 linhas sem resumo

Tooling deve mostrar:

```text
FAIL: hair_short_01
Reason: LOD1 silhouette deviation 23%
```

e oferecer log detalhado.

---

# 2856. Agent workflow

Como esse projeto é trabalhado com agente, os comandos e relatórios devem ser claros e auditáveis.

---

# 2857. Nunca fazer mudança destrutiva silenciosa

O agente deverá sempre:

- listar arquivos afetados;
- explicar migração;
- preservar fallback;
- gerar build/test.

---

# 2858. Before/After report

Para toda frente visual importante.

---

# 2859. Performance report

Junto.

---

# 2860. QA report

Junto.

---

# 2861. Deployment readiness

Um asset batch só está pronto se:

```text
BUILD OK
TEST OK
TECH QA OK
VISUAL QA OK
PERFORMANCE OK
```

---

# 2862. No “funcionou no meu browser”

---

# 2863. Release batches

Evitar publicar 300 assets de uma vez inicialmente.

---

# 2864. Batch sizes

Primeiras levas pequenas.

---

# 2865. Example

```text
Batch 1: Golden assets
Batch 2: 20 premium assets
Batch 3: 50
```

---

# 2866. Observe telemetry after release

Antes de escalar.

---

# 2867. Error watch

Especialmente:

- load;
- WebGL;
- memory.

---

# 2868. Rollback trigger

Definir.

---

# 2869. Example

Erro de carregamento acima de threshold → rollback.

---

# 2870. No automatic rollback visual without policy

Mas estar preparado.

---

# 2871. Documentation

Criar documentação única do pipeline.

Exemplo:

```text
docs/AVATAR-STUDIO/ASSET-PIPELINE.md
```

---

# 2872. Conteúdo mínimo

- lifecycle;
- naming;
- manifest;
- LOD;
- textures;
- rig;
- QA;
- publish;
- rollback.

---

# 2873. VisualQA documentation

Arquivo próprio se necessário.

---

# 2874. Golden Test documentation

Arquivo próprio.

---

# 2875. Performance Budgets documentation

Arquivo próprio.

---

# 2876. Art Bible link

Todos conectados.

---

# 2877. Onboarding de novos artistas/devs

O pipeline precisa ser entendível por outra pessoa sem depender de conhecimento oral.

---

# 2878. One-page quick start

Criar.

---

# 2879. Example workflow

```text
1. Prepare source
2. Register manifest
3. Run build
4. Run validate
5. Run QA
6. Review
7. Publish
```

---

# 2880. Definition of Done desta Parte 11

Esta parte só poderá ser considerada concluída quando o projeto possuir:

1. pipeline oficial documentado;
2. manifest schema versionado;
3. naming convention;
4. source/runtime separation;
5. technical validation;
6. rig validation;
7. morph validation;
8. texture validation;
9. LOD validation;
10. material validation;
11. visual QA;
12. category-specific QA;
13. Golden test scenes;
14. screenshot regression;
15. performance baselines;
16. asset inspector;
17. QA route/tool;
18. telemetry;
19. publish gates;
20. rollback;
21. 2D pipeline;
22. 3D pipeline;
23. batch rollout;
24. documentation completa.

---

# 2881. Gate final da Parte 11

Não iniciar expansão agressiva do catálogo até:

```text
PIPELINE
+
VISUAL QA
+
GOLDEN TESTS
+
PERFORMANCE GATES
+
ROLLBACK
```

estarem operacionais.

---

# 2882. Resultado esperado da Parte 11

Ao final desta etapa, o Avatar Studio deverá deixar de depender do processo:

> “adicionar asset, abrir o app e ver se ficou bom.”

E passar a trabalhar como uma verdadeira linha de produção:

```text
ASSET
↓
VALIDATION
↓
QUALITY
↓
REGRESSION
↓
PUBLICATION
```

Essa mudança é fundamental porque a arquitetura atual já é capaz de comportar um catálogo grande. 

A partir daqui, o desafio deixa de ser apenas **“conseguir adicionar muitos assets”** e passa a ser **“conseguir adicionar muitos assets sem reduzir o padrão visual do produto.”**

---

## FIM DA PARTE 11/12

**Próxima e última: PARTE 12/12 — PLANO EXECUTIVO DE IMPLEMENTAÇÃO, PRIORIZAÇÃO P0/P1/P2, FASES DE MIGRAÇÃO, FEATURE FLAGS, QA FINAL, PERFORMANCE, CRITÉRIOS DE ACEITE, ROLLOUT, NÃO-REGRESSÃO E DEFINITION OF DONE GLOBAL DO MEGA BRIEFING.**





# MEGA BRIEFING — ELEVAÇÃO GRÁFICA AAA DO AVATAR STUDIO DSHOW  
## PARTE 12/12 — PLANO EXECUTIVO DE IMPLEMENTAÇÃO, PRIORIZAÇÃO P0/P1/P2, FASES DE MIGRAÇÃO, FEATURE FLAGS, QA FINAL, PERFORMANCE, CRITÉRIOS DE ACEITE, ROLLOUT, NÃO-REGRESSÃO E DEFINITION OF DONE GLOBAL

# 2883. Objetivo da Parte 12

Esta última parte deverá converter todo o mega briefing anterior em um **plano executivo de implementação**, evitando que o trabalho se torne uma sequência fragmentada de melhorias isoladas.

O objetivo agora é responder de forma objetiva:

- o que fazer primeiro;
- o que depende de quê;
- o que pode ser desenvolvido em paralelo;
- o que precisa de gate;
- o que deve permanecer atrás de feature flag;
- quando começar a escalar assets;
- como validar qualidade;
- como evitar regressões;
- como fazer rollout seguro;
- como saber, objetivamente, que o projeto chegou ao novo nível visual esperado.

O princípio central será:

> **não implementar tudo ao mesmo tempo; implementar na ordem correta, validar, congelar padrões e só então escalar.**

---

# 2884. Estrutura macro do programa

Dividir a execução em três grandes prioridades:

```text
P0 — FOUNDATION / QUALITY BAR
P1 — PREMIUM CORE EXPERIENCE
P2 — SCALE / ENRICHMENT / EXPANSION
```

Essas prioridades não representam importância absoluta do recurso, mas **ordem correta de construção**.

---

# 2885. P0 — Foundation

P0 deve resolver tudo que precisa existir antes de produção em escala.

Inclui:

- Art Bible;
- Quality Bar;
- Golden Avatars;
- Golden Materials;
- Golden Lighting;
- Golden Classic;
- pipeline;
- Visual QA;
- regressão visual;
- compatibility contracts;
- feature flags;
- performance baselines;
- telemetry;
- rollback.

Enquanto P0 não estiver estável, evitar produção massiva de novos assets.

---

# 2886. P1 — Premium Core Experience

P1 transforma a fundação em produto visualmente premium.

Inclui:

- corpo premium;
- rosto premium;
- cabelo premium;
- roupas premium;
- acessórios premium;
- materiais;
- iluminação;
- câmera;
- Classic Premium;
- Photo Studio;
- Vitrine;
- presets Hero.

---

# 2887. P2 — Scale & Enrichment

P2 começa apenas quando o pipeline já consegue garantir qualidade.

Inclui:

- expansão 3x+ de assets;
- novas coleções;
- novos cenários;
- auras adicionais;
- clima;
- poderes;
- companions;
- pets;
- novos presets;
- raridades avançadas;
- novas famílias corporais;
- novos estilos visuais futuros.

---

# 2888. Fase 0 — Congelamento de referência

Antes de qualquer alteração importante:

1. gerar baseline visual atual;
2. capturar screenshots;
3. registrar performance atual;
4. registrar IDs e manifests;
5. registrar estado de build;
6. registrar estado de feature flags;
7. garantir rollback.

---

# 2889. Baseline visual obrigatório

Capturar pelo menos:

```text
Classic — Full Body
Classic — Face
Classic — Hair
Classic — Clothing

3D — Full Body
3D — Portrait
3D — Hero
3D — Hair
3D — Clothing
3D — Accessories
```

Isso permitirá medir evolução real.

---

# 2890. Baseline técnico

Registrar:

- FPS;
- frame time;
- draw calls;
- triângulos;
- texture memory;
- load time;
- bundle impact;
- WebGL errors.

---

# 2891. Fase 1 — Art Direction Foundation

Implementar primeiro:

- Art Bible;
- Quality Bar;
- Visual Quality metadata;
- Golden criteria;
- hard fail / soft fail;
- Visual QA workflow.

Sem isso, o restante vira subjetivo.

---

# 2892. Entrega da Fase 1

Ao fim:

```text
Art Bible v1
Quality Bar v1
VisualQA v1
Golden Specification v1
```

devem estar documentados.

---

# 2893. Gate da Fase 1

Não avançar para produção visual massiva sem aprovação desses quatro artefatos.

---

# 2894. Fase 2 — Golden Bodies & Faces

Construir:

- Golden Male;
- Golden Female;
- body presets;
- face families;
- skin calibration;
- eyes;
- mouth;
- brows;
- expressions.

---

# 2895. Fase 2A — Corpo

Primeiro:

- proportions;
- rig;
- skinning;
- morphs;
- deformation.

---

# 2896. Fase 2B — Rosto

Depois:

- head;
- face;
- eyes;
- skin;
- brows;
- mouth;
- expression.

---

# 2897. Gate corporal

Corpo só está aprovado se funcionar:

- parado;
- animado;
- vestido;
- com LOD;
- em diferentes cameras.

---

# 2898. Gate facial

Rosto só está aprovado se passar:

- front;
- ¾;
- profile;
- close-up;
- blink;
- expression;
- LOD.

---

# 2899. Fase 3 — Hair & Facial Hair

Depois de corpo/rosto estáveis:

- hair materials;
- golden hair set;
- beard;
- brows;
- headwear fit;
- secondary motion.

---

# 2900. Motivo da ordem

Cabelo depende diretamente de:

- head geometry;
- ears;
- forehead;
- shoulders;
- body silhouette.

Por isso não deve ser estabilizado antes do corpo/rosto.

---

# 2901. Fase 4 — Clothing & Outfit System

Depois do corpo estabilizado:

- layers;
- fit;
- morph compatibility;
- materials;
- color channels;
- Golden Outfits.

---

# 2902. Motivo

Produzir roupa antes de congelar morphs corporais gera retrabalho.

---

# 2903. Fase 5 — Accessories

Depois de corpo, cabelo e roupa:

- socket fit;
- hero accessories;
- props;
- pets;
- companions.

---

# 2904. Fase 6 — Material Library

Embora materiais já sejam utilizados nas fases anteriores, nesta fase consolidar:

- Material Registry;
- standardized families;
- texture contracts;
- debug views;
- final calibration.

---

# 2905. Materiais não devem ser deixados só para o fim

Aplicar iterativamente.

A Fase 6 significa **consolidação**, não primeira implementação.

---

# 2906. Fase 7 — Lighting & Camera

Com os Golden Assets prontos:

- Studio;
- Portrait;
- Hero;
- Neon;
- Product;
- camera presets;
- bounds-aware framing;
- Photo Studio.

---

# 2907. Motivo da ordem

Não calibrar iluminação definitiva usando assets que ainda serão substituídos.

---

# 2908. Fase 8 — Classic Premium

O Classic Premium poderá começar parcialmente em paralelo, mas o quality bar final deve usar as decisões de:

- face;
- hair;
- materials;
- lighting;
- art direction.

---

# 2909. Classic rollout incremental

Migrar:

```text
face
→ hair
→ eyes/mouth
→ clothing
→ accessories
→ backgrounds
→ auras
```

---

# 2910. Fase 9 — VFX & Scenarios

Somente depois que personagem já for premium.

Construir:

- aura families;
- powers;
- particles;
- climate;
- time;
- scenarios;
- rarity presentation.

---

# 2911. Fase 10 — Pipeline Scale

Antes de produção massiva:

- asset pipeline;
- QA route;
- Golden tests;
- publish gates;
- rollback;
- telemetry.

---

# 2912. Fase 11 — Scale Production

Só então começar:

- triplicar faces;
- triplicar hairs;
- aumentar mouths;
- aumentar eyes;
- aumentar outfits;
- aumentar accessories;
- backgrounds;
- frames;
- effects;
- presets.

---

# 2913. Fase 12 — Advanced Enrichment

Depois:

- more body families;
- advanced hair physics;
- advanced cloth;
- additional pets;
- new scenario families;
- advanced facial expressions;
- future voice/lip sync;
- AI assistance.

---

# 2914. Paralelização permitida

Algumas frentes podem trabalhar em paralelo:

```text
BODY + PIPELINE
FACE + MATERIAL RESEARCH
CLASSIC ART DIRECTION + 3D FOUNDATION
UI/UX + TECH QA
```

---

# 2915. Paralelização proibida quando há dependência estrutural

Evitar:

```text
100 new jackets
while body morph system is changing
```

ou:

```text
30 new hairs
while head topology is unstable
```

---

# 2916. Dependency Map

Criar explicitamente:

```text
BODY
├── CLOTHING
├── ACCESSORIES
└── ANIMATION

FACE
├── HAIR
├── BEARD
├── GLASSES
└── EXPRESSIONS

MATERIALS
├── CLOTHING
├── ACCESSORIES
├── HAIR
└── LIGHTING

LIGHTING
├── PHOTO
├── VFX
└── SCENARIO PRESENTATION
```

---

# 2917. Feature Flags

Usar feature flags para nova geração visual.

Sugestão conceitual:

```text
avatar_visual_v2
avatar_3d_premium
avatar_classic_premium
avatar_material_v2
avatar_photo_v2
avatar_vfx_v2
```

Adaptar ao sistema real de flags.

---

# 2918. Não criar flags demais sem necessidade

Flags devem representar blocos coerentes.

---

# 2919. Flags internas

Permitir:

```text
DEV
QA
INTERNAL
PRODUCTION
```

---

# 2920. Default off inicialmente

Novos sistemas devem entrar desligados para público até homologação.

---

# 2921. Internal QA

Ativar para equipe/agente.

---

# 2922. Canary

Depois, ativar para pequena parcela se tecnicamente aplicável.

---

# 2923. Production rollout

Expandir progressivamente.

---

# 2924. Fallback

O modo atual precisa permanecer funcional até o novo sistema demonstrar estabilidade.

---

# 2925. Não remover Classic Legacy cedo demais

Preservar.

---

# 2926. Rollback

Todo rollout importante precisa de retorno simples.

---

# 2927. Database compatibility

Evitar mudanças destrutivas.

---

# 2928. Additive schema

Preferir:

- novas colunas;
- novos campos;
- versioning.

---

# 2929. Save migration

Todo estado antigo precisa possuir migração.

---

# 2930. Migration test

Criar fixtures de saves antigos.

---

# 2931. Teste obrigatório

```text
old save
→ new renderer
→ expected avatar
```

---

# 2932. Asset successor migration

Testar.

---

# 2933. Unknown asset fallback

Se asset foi removido:

- usar fallback;
- não quebrar avatar.

---

# 2934. Renderer fallback

Se 3D falhar:

- classic/fallback quando produto permitir;
- ou safe 3D mode.

---

# 2935. WebGL fallback

Não deixar tela branca.

---

# 2936. Safe Mode 3D

Pode desligar:

- bloom;
- particles;
- advanced materials;
- physics.

---

# 2937. Quality Tier System

Definir oficialmente:

```text
AUTO
ECONOMY
STANDARD
ULTRA
```

---

# 2938. AUTO

Detecta capability e estabilidade.

---

# 2939. ECONOMY

Preserva design.

Reduz:

- particles;
- shadows;
- secondary motion;
- DPR;
- texture detail.

---

# 2940. STANDARD

Experiência principal.

---

# 2941. ULTRA

Melhor qualidade disponível.

---

# 2942. PHOTO

Pode existir internamente como tier temporário.

---

# 2943. PHOTO tier

Ativa temporariamente:

- LOD0;
- high DPR;
- better shadow;
- capture post.

---

# 2944. Depois da captura

Restaurar tier anterior.

---

# 2945. Performance budgets globais

Criar orçamento de cena.

Exemplo conceitual:

```text
Avatar body
+ Hair
+ Outfit
+ Accessories
+ Pet
+ VFX
+ Scenario
```

deve permanecer dentro do budget definido.

---

# 2946. Scene budget, não apenas asset budget

Fundamental.

---

# 2947. Worst-case scene

Criar benchmark oficial.

Exemplo:

```text
long hair
+
layered outfit
+
wings
+
glasses
+
watch
+
prop
+
pet
+
aura
+
scenario
```

---

# 2948. Worst-case Standard

Precisa permanecer utilizável.

---

# 2949. Worst-case Ultra

Pode ser mais pesado.

---

# 2950. FPS targets

Definir de acordo com ambiente real.

Não usar número rígido sem medir hardware alvo.

---

# 2951. Frame time

Registrar.

---

# 2952. Load time

Registrar.

---

# 2953. First meaningful avatar render

Criar métrica.

---

# 2954. Avatar swap latency

Medir troca de asset.

---

# 2955. Camera response latency

Medir.

---

# 2956. UI responsiveness

Não deixar renderer bloquear sidebar.

---

# 2957. Worker/off-main-thread

Quando aplicável, usar para processamento pesado.

---

# 2958. Não mover render WebGL arbitrariamente para worker

Só se arquitetura suportar.

---

# 2959. Preprocessing offline

Preferir.

---

# 2960. Memory pressure

Monitorar especialmente mobile.

---

# 2961. Safari/iOS QA

Importante.

---

# 2962. Context loss test

Obrigatório.

A arquitetura atual já possui preocupação com restauração de contexto, e isso deve continuar sendo validado na nova geração visual. 

---

# 2963. Context restore must rehydrate

- avatar;
- materials;
- LOD;
- environment;
- VFX;
- camera.

---

# 2964. Error boundaries

UI não pode desmoronar se um asset falhar.

---

# 2965. Asset-level error isolation

Se um cabelo falhar:

- avatar continua;
- cabelo fallback.

---

# 2966. Scenario failure

Usar Studio fallback.

---

# 2967. VFX failure

Desligar VFX.

---

# 2968. Material failure

Usar base material seguro.

---

# 2969. Telemetry final

Registrar eventos críticos:

```text
asset_load_failed
texture_load_failed
renderer_context_lost
renderer_context_restored
shader_failed
fallback_used
quality_downgraded
```

---

# 2970. Noisy telemetry

Evitar flood.

---

# 2971. Rate limiting

Aplicar.

---

# 2972. Visual regression suite

Antes de deploy visual importante:

```text
Golden Male
Golden Female
Classic Male
Classic Female
Studio
Portrait
Hero
Hair
Outfit
Accessories
VFX
Scenario
```

---

# 2973. Screenshot matrix

Rodar em viewport fixo.

---

# 2974. Approval process

Mudança visual grande precisa de:

```text
diff generated
→ review
→ approval
```

---

# 2975. Não atualizar baseline automaticamente

Baseline só muda após aprovação.

---

# 2976. Golden Test Ownership

Definir responsável ou fluxo claro.

---

# 2977. QA técnico

Deve cobrir:

- build;
- lint;
- unit;
- asset schema;
- loading;
- saves.

---

# 2978. QA visual

Separado.

---

# 2979. QA funcional

Cobrir:

- equip;
- remove;
- multiple accessories;
- undo;
- redo;
- save;
- history;
- photo;
- vitrine.

---

# 2980. QA UX

Cobrir:

- scroll;
- camera focus;
- sidebar;
- tabs;
- selection;
- thumbnails;
- loading.

---

# 2981. QA mobile

Obrigatório.

---

# 2982. QA responsive

Principalmente:

- avatar area;
- sidebar;
- bottom assets;
- photo.

---

# 2983. QA accessibility

- keyboard;
- focus;
- reduced motion;
- contrast;
- labels.

---

# 2984. QA performance

- Standard;
- Economy;
- Ultra.

---

# 2985. QA legacy

Garantir que o modo anterior não quebre.

---

# 2986. Definition of Done por feature

Toda feature visual nova deverá entregar:

```text
IMPLEMENTATION
+
TEST
+
VISUAL QA
+
PERFORMANCE
+
DOCUMENTATION
+
ROLLBACK
```

---

# 2987. Não aceitar “implementado” se só existir no código

Precisa estar funcional no produto.

---

# 2988. Não aceitar “funcional” se visualmente abaixo do quality bar

---

# 2989. Não aceitar “bonito” se quebra performance

---

# 2990. Não aceitar “rápido” se visualmente pobre

---

# 2991. Equilíbrio

O produto deve satisfazer simultaneamente:

```text
QUALITY
+
PERFORMANCE
+
STABILITY
+
SCALABILITY
+
UX
```

---

# 2992. Definition of Done Global — Corpo

- Golden Male approved;
- Golden Female approved;
- morphs approved;
- deformation approved;
- LOD approved.

---

# 2993. DoD Global — Rosto

- distinct faces;
- skin calibration;
- eyes;
- expressions;
- close-up;
- profile.

---

# 2994. DoD — Hair

- Golden Hair Set;
- hairline;
- head fit;
- headwear;
- LOD;
- backlight.

---

# 2995. DoD — Clothing

- layers;
- morph fit;
- materials;
- outfits;
- animation;
- LOD.

---

# 2996. DoD — Accessories

- multiple sockets;
- fit;
- Hero assets;
- pets;
- companions;
- props.

---

# 2997. DoD — Materials

- material registry;
- skin;
- hair;
- fabric;
- metal;
- glass;
- emissive.

---

# 2998. DoD — Lighting

- Studio;
- Portrait;
- Hero;
- camera;
- shadows;
- environment.

---

# 2999. DoD — VFX

- aura families;
- powers;
- particles;
- climate;
- scenario;
- rarity.

---

# 3000. DoD — Classic

- face premium;
- hair premium;
- clothing premium;
- background depth;
- aura;
- photo compatibility.

---

# 3001. DoD — Pipeline

- technical QA;
- visual QA;
- performance;
- regression;
- publish gate;
- rollback.

---

# 3002. UX Acceptance Criteria

A nova experiência deverá atingir:

- avatar maior e mais dominante;
- assets mais visuais;
- menos dependência de texto;
- sidebar com scroll próprio;
- largura ajustável quando aplicável;
- tabs no lugar de dropdowns em seleções recorrentes;
- cores acessíveis no topo/contexto correto;
- camera focus por categoria;
- zoom facial;
- Photo Studio aprofundado;
- histórico mais robusto;
- vitrine funcional.

---

# 3003. Visual Acceptance Criteria

O usuário precisa perceber claramente:

```text
before
→ prototype / simple

after
→ premium / intentional / coherent
```

---

# 3004. Primeiro teste perceptivo

Pergunta:

> “Se removermos o logo Dshow, isso parece um Character Creator premium?”

Se não, continuar.

---

# 3005. Segundo teste

> “O rosto parece suficientemente bom em close-up?”

Se não, não aprovar.

---

# 3006. Terceiro teste

> “O cabelo parece parte do personagem ou um capacete?”

Se capacete, não aprovar.

---

# 3007. Quarto teste

> “A roupa parece tecido/material ou pintura no corpo?”

Se pintura, não aprovar.

---

# 3008. Quinto teste

> “Os acessórios parecem assets finais ou primitives de protótipo?”

Se protótipo, não aprovar.

---

# 3009. Sexto teste

> “A iluminação valoriza o personagem sem esconder problemas?”

---

# 3010. Sétimo teste

> “Classic e 3D parecem duas linguagens premium do mesmo produto?”

---

# 3011. Oitavo teste

> “A nova qualidade permanece aceitável no tier econômico?”

---

# 3012. Nono teste

> “O pipeline consegue adicionar um novo asset sem intervenção manual em dez lugares diferentes?”

---

# 3013. Décimo teste

> “Podemos aumentar o catálogo 3x sem aumentar 3x a dívida visual?”

Essa talvez seja a pergunta mais importante de todo o projeto.

---

# 3014. Rollout Strategy

Recomendação:

```text
Internal
↓
QA
↓
Golden only
↓
Small catalog
↓
Broader catalog
↓
Default
```

---

# 3015. Internal stage

Apenas equipe.

---

# 3016. QA stage

Visual regression + performance.

---

# 3017. Golden-only rollout

Novo renderer usa apenas assets Golden.

---

# 3018. Small Catalog

Adicionar primeira leva Premium.

---

# 3019. Broader Catalog

Expandir.

---

# 3020. Default

Somente quando estabilidade e qualidade estiverem comprovadas.

---

# 3021. Classic rollout

Mesmo padrão.

---

# 3022. Não misturar Premium e Legacy sem indicação interna

Pode coexistir, mas o sistema deve saber qual é qual.

---

# 3023. Default Catalog ordering

Ordenar:

1. Hero;
2. Premium;
3. Production;
4. Legacy.

Não necessariamente de forma explícita para usuário.

---

# 3024. Legacy deprecations

Gradualmente.

---

# 3025. Marketing readiness

Não usar screenshots do novo sistema antes de:

- Golden assets;
- lighting;
- Photo Studio;
- QA.

---

# 3026. Hero Screenshots

Criar um conjunto oficial.

---

# 3027. Screenshot categories

```text
Male Hero
Female Hero
Classic Hero
Portrait
Full Body
Cyber
Royal
Urban
```

---

# 3028. Vitrine

Usar esses assets.

---

# 3029. Onboarding

Também.

---

# 3030. First avatar

Precisa ser premium.

---

# 3031. Nunca usar placeholder no onboarding

---

# 3032. Production scaling targets

Depois do gate, começar crescimento.

Prioridades:

1. rostos;
2. cabelos;
3. olhos/bocas;
4. outfits;
5. accessories;
6. backgrounds;
7. effects;
8. presets.

---

# 3033. Triplicar opções

O objetivo original de no mínimo triplicar várias categorias deverá ser mantido.

Porém:

```text
Scale only after quality lock.
```

---

# 3034. Scale targets não devem ser absolutos sem qualidade

Exemplo:

```text
Face:
20 weak
→ não é melhor que
8 excellent
```

---

# 3035. Quality Coverage Matrix

Criar tabela por categoria:

```text
Total
Production
Premium
Hero
Legacy
```

---

# 3036. Release KPI

Não usar só total.

---

# 3037. KPI principal

```text
Premium Coverage %
```

---

# 3038. Outros KPIs

- Visual QA pass rate;
- clipping defect rate;
- average load time;
- Golden regression failure rate;
- runtime asset error rate.

---

# 3039. Visual debt burn-down

Acompanhar.

---

# 3040. Example

```text
Hair legacy debt:
80%
→ 50%
→ 20%
```

---

# 3041. Não tentar zerar legacy instantaneamente

Migração progressiva.

---

# 3042. Technical debt

Separar de visual debt.

---

# 3043. Documentation completion

Toda nova arquitetura deve ficar documentada.

---

# 3044. Required docs

No mínimo:

```text
ART-BIBLE.md
ASSET-PIPELINE.md
VISUAL-QA.md
GOLDEN-TESTS.md
PERFORMANCE-BUDGETS.md
RENDERER-ARCHITECTURE.md
```

ou equivalentes.

---

# 3045. Changelog visual

Criar.

---

# 3046. Cada grande release

Registrar:

- assets;
- materials;
- lighting;
- compatibility;
- migrations.

---

# 3047. No undocumented magic

Especialmente:

- offsets;
- material overrides;
- camera values.

---

# 3048. Central registries

Preferir.

---

# 3049. Code quality

Não sacrificar organização por velocidade.

---

# 3050. No giant component

Evitar concentrar:

- renderer;
- UI;
- asset logic;
- materials;
- camera;

num único arquivo.

---

# 3051. Separation of concerns

Manter:

```text
render
state
catalog
materials
camera
vfx
ui
qa
```

separados.

---

# 3052. Preserve existing architecture where good

Essa é uma diretriz central desde a auditoria.

A infraestrutura atual já tem componentes valiosos e não deve ser reescrita sem justificativa.

---

# 3053. Rewriting threshold

Só reescrever se:

- arquitetura bloquear quality bar;
- performance for inadequada;
- manutenção for inviável.

---

# 3054. “É mais moderno” não é justificativa

---

# 3055. Agent execution protocol

O agente deverá trabalhar em blocos controlados.

Para cada bloco:

1. auditar;
2. explicar impacto;
3. implementar;
4. build;
5. testar;
6. gerar screenshots;
7. comparar;
8. documentar;
9. aguardar/seguir conforme autorização operacional já definida.

---

# 3056. Não interromper por perguntas desnecessárias

Quando uma decisão puder ser inferida com segurança do briefing, o agente deve executar.

---

# 3057. Perguntar apenas em decisões realmente bloqueantes

Exemplos:

- licença;
- segredo;
- escolha irreversível;
- remoção de dados;
- custo externo;
- mudança crítica de arquitetura.

---

# 3058. Não perguntar em detalhes cosméticos já definidos

O briefing já define direção.

---

# 3059. Safe execution

Antes de mudança grande:

- git status;
- backup se necessário;
- branch/commit;
- build baseline.

---

# 3060. Commit granularity

Preferir commits por etapa.

---

# 3061. Example

```text
feat(avatar): premium skin materials
feat(avatar): golden hair set
feat(avatar): studio lighting v2
```

---

# 3062. Não juntar 50 mudanças não relacionadas em um commit

---

# 3063. Build gates

Toda etapa deve passar:

- typecheck;
- build;
- tests relevantes.

---

# 3064. Asset gates

Também.

---

# 3065. Visual gate

Também.

---

# 3066. Performance gate

Também.

---

# 3067. Rollback gate

Testar pelo menos em mudanças importantes.

---

# 3068. Database

Mudanças deverão ser aditivas e versionadas.

---

# 3069. No destructive SQL sem backup

---

# 3070. Migration scripts

Idempotentes quando possível.

---

# 3071. Assets

Não sobrescrever source.

---

# 3072. Generated artifacts

Versionar/gerenciar conforme estratégia atual.

---

# 3073. Security

Não inserir chaves em código.

---

# 3074. Third-party assets

Licença obrigatória.

---

# 3075. External libraries

Adicionar apenas se houver ganho claro.

---

# 3076. Bundle review

Nova lib pesada precisa de justificativa.

---

# 3077. Prefer existing stack

Quando suficiente.

---

# 3078. Final QA Matrix

Antes de declarar o programa concluído, executar:

```text
Classic × Desktop
Classic × Mobile
3D × Desktop
3D × Mobile
Economy
Standard
Ultra
Photo
```

---

# 3079. Golden Avatar Matrix

```text
Male
Female
Light Skin
Medium Skin
Dark Skin
Short Hair
Long Hair
Premium Outfit
Hero Accessory
Aura
Pet
```

---

# 3080. Browser Matrix

Quando aplicável:

- Chromium;
- Safari;
- mobile Safari;
- other supported browsers.

---

# 3081. Failure policy

Qualquer Hard Fail bloqueia release.

---

# 3082. Soft Fail policy

Pode liberar apenas com:

- issue registrada;
- owner;
- severidade;
- prazo.

---

# 3083. No untracked visual debt

---

# 3084. Final acceptance — Visual

A aplicação precisa apresentar salto inequívoco.

---

# 3085. Final acceptance — UX

O usuário consegue:

- encontrar assets;
- visualizar claramente;
- editar sem perder avatar de foco;
- usar camera;
- customizar cores;
- montar look.

---

# 3086. Final acceptance — Technical

O sistema:

- carrega;
- salva;
- restaura;
- troca LOD;
- lida com fallback;
- não quebra histórico.

---

# 3087. Final acceptance — Performance

A experiência continua utilizável em hardware alvo.

---

# 3088. Final acceptance — Scale

Novo asset entra pelo pipeline sem reestruturação.

---

# 3089. Final acceptance — Classic

O clássico deixa de parecer inferior.

---

# 3090. Final acceptance — 3D

O 3D deixa de parecer PoC.

---

# 3091. Final acceptance — Photo

Photo Studio vira showcase.

---

# 3092. Final acceptance — Vitrine

Vitrine mostra apenas conteúdo aprovado e funciona corretamente.

---

# 3093. Final acceptance — Quality Governance

Existe processo para impedir regressão futura.

---

# 3094. Definition of Done Global do Mega Briefing

O mega briefing completo somente poderá ser considerado concluído quando:

```text
1. Art Bible aprovada
2. Quality Bar implementado
3. Golden Male aprovado
4. Golden Female aprovado
5. Golden Faces aprovados
6. Golden Hair aprovado
7. Golden Outfits aprovados
8. Golden Accessories aprovados
9. Golden Materials aprovados
10. Studio/Portrait/Hero aprovados
11. Classic Premium aprovado
12. VFX base aprovado
13. Photo Studio elevado
14. Pipeline automatizado
15. Visual QA operacional
16. Golden regression operacional
17. Performance budgets definidos
18. Feature flags funcionando
19. Rollback comprovado
20. Primeira leva Premium em produção
```

---

# 3095. Gate supremo para escala

Somente depois do item 20:

> **começar expansão agressiva do catálogo.**

---

# 3096. O que o agente NÃO deverá fazer

Durante este programa, evitar explicitamente:

```text
❌ aumentar quantidade antes de quality lock
❌ reescrever arquitetura estável sem motivo
❌ remover fallback cedo
❌ tratar placeholder como final
❌ usar bloom como solução
❌ usar mesma geometria com muitas cores para simular variedade
❌ quebrar saves
❌ quebrar IDs
❌ criar materiais arbitrários em vários componentes
❌ duplicar lógica 2D/3D sem abstração semântica
❌ ignorar mobile/performance
❌ declarar concluído sem Visual QA
```

---

# 3097. O que o agente DEVERÁ preservar

Sempre que possível:

```text
✅ rig canônico
✅ sockets
✅ manifest
✅ saves
✅ history
✅ undo/redo
✅ IDs
✅ feature flags
✅ catalog services
✅ LOD pipeline
✅ material infrastructure
✅ renderer fallback
```

---

# 3098. O que deverá ser elevado

```text
↑ art direction
↑ geometry quality
↑ face
↑ hair
↑ clothing
↑ materials
↑ lighting
↑ camera
↑ accessories
↑ VFX
↑ backgrounds
↑ Classic
↑ Photo Studio
↑ Visual QA
```

---

# 3099. Resultado visual esperado

A transformação precisa ser percebida sem explicação técnica.

O usuário deve abrir a aplicação e imediatamente notar:

- personagem maior;
- rosto melhor;
- cabelo mais rico;
- roupas com material;
- acessórios mais sofisticados;
- iluminação mais profissional;
- fundos com profundidade;
- UI mais visual;
- efeitos mais controlados;
- Classic muito mais premium;
- 3D muito mais convincente.

---

# 3100. Resultado de produto esperado

O Avatar Studio deverá deixar de ser percebido como:

> “uma aplicação com muitas opções de avatar”

e passar a ser percebido como:

> **“uma plataforma premium de criação de identidade digital.”**

---

# 3101. Resultado técnico esperado

A equipe deverá conseguir:

```text
criar novo asset
↓
validar
↓
visual QA
↓
publicar
```

sem reabrir discussões estruturais a cada item.

---

# 3102. Resultado de escala esperado

A quantidade poderá crescer de forma agressiva posteriormente porque:

> o pipeline passa a impedir que velocidade de produção destrua qualidade.

---

# 3103. Resultado do modo Clássico

Deve ser reconhecido como:

> **Premium 2D/2.5D Illustration Mode**

---

# 3104. Resultado do modo 3D

Deve ser reconhecido como:

> **Premium Stylized Character Creator**

---

# 3105. Relação entre os dois

Não concorrentes.

Complementares.

```text
CLASSIC
= rapidez + ilustração + estilo

3D
= profundidade + materiais + animação + cinematografia
```

---

# 3106. Princípio final de toda a implementação

A regra que deve orientar todas as decisões deste projeto é:

> **não otimizar para quantidade de assets. Otimizar para qualidade percebida sustentável em escala.**

Essa regra deve ser usada sempre que houver conflito entre:

- fazer mais;
- fazer melhor.

Primeiro estabelecer o padrão.

Depois escalar.

---

# 3107. Ordem final resumida para execução

```text
BASELINE
↓
ART BIBLE
↓
QUALITY BAR
↓
GOLDEN BODY
↓
GOLDEN FACE
↓
GOLDEN HAIR
↓
GOLDEN OUTFITS
↓
GOLDEN ACCESSORIES
↓
MATERIAL SYSTEM
↓
LIGHTING/CAMERA
↓
CLASSIC PREMIUM
↓
PHOTO STUDIO
↓
VFX/SCENARIOS
↓
PIPELINE/QA
↓
ROLLOUT
↓
SCALE 3X+
```

---

# 3108. Mensagem operacional final ao agente

Este mega briefing deve ser tratado como **direção executiva e técnica de produto**, e não como lista de sugestões independentes.

Sempre que houver dúvida entre:

- preservar compatibilidade;
- melhorar visual;
- escalar quantidade;

a prioridade deverá ser:

```text
1. NÃO QUEBRAR
2. ELEVAR QUALIDADE
3. VALIDAR
4. ESCALAR
```

Nenhuma melhoria deverá ser considerada concluída apenas porque “funciona”.

A entrega correta exige:

> **funcionar + parecer premium + manter performance + ser escalável + possuir fallback + estar validada.**

---

## FIM DA PARTE 12/12  
## FIM DO MEGA BRIEFING DE ELEVAÇÃO GRÁFICA AAA DO AVATAR STUDIO DSHOW

Com esta Parte 12, o briefing completo está fechado e organizado como um programa de transformação: da base visual e técnica até o rollout e a expansão em escala.
