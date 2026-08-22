# BRIEFING CORRETIVO — AVATAR STUDIO DSHOW  
## Fazer as melhorias VISUAIS chegarem de verdade ao usuário — 2D + 3D + simplificação radical da UX 3D

### Contexto e objetivo

Foi feita uma auditoria técnica completa do Avatar Studio após as últimas ondas do Mega Briefing. O diagnóstico é claro: **houve bastante implementação de engenharia, mas o ganho visual percebido pelo usuário ficou muito abaixo da quantidade de trabalho realizada**.

O problema **não é primariamente deploy ou build**. O servidor está no commit mais recente auditado, o `dist` do Avatar Studio foi recompilado depois do commit, os chunks novos existem no build e o Nginx serve a pasta correta.

O problema está principalmente em quatro pontos:

1. diversas melhorias visuais foram implementadas, porém continuam **desligadas por feature flags**;
2. no 2D foi criado um trilho Premium paralelo, mas o usuário continua vendo majoritariamente o **renderer/assets Legacy**;
3. no 3D houve grande evolução de infraestrutura, mas **a arte/personagem ainda não evoluiu na mesma proporção**;
4. a experiência 3D ficou excessivamente carregada de controles técnicos, prejudicando a usabilidade.

A partir deste briefing, a prioridade muda.

> **Não quero mais medir progresso pelo número de commits, serviços, flags, testes ou funcionalidades implementadas. Quero medir pelo salto visual que aparece na tela para o usuário.**

---

# 1. REGRA PRINCIPAL DESTE BRIEFING

Uma melhoria visual **NÃO pode mais ser marcada como concluída** quando apenas:

- existe no código;
- está atrás de uma flag desligada;
- possui testes automatizados;
- preserva byte-stability;
- possui documentação;
- possui rollback;
- passa build;
- possui Golden hash.

Ela somente poderá ser classificada como concluída quando:

```text
IMPLEMENTADA
+
ATIVA NO FLUXO REAL
+
VISÍVEL PARA O USUÁRIO
+
COMPARADA BEFORE × AFTER
+
VISUALMENTE SUPERIOR
+
APROVADA
```

Esta regra vale independentemente para:

```text
2D PREMIUM
3D PREMIUM
UX 3D
```

---

# 2. DIAGNÓSTICO CONFIRMADO — NÃO TENTAR REDESCOBRIR ISSO

A auditoria confirmou que os principais recursos visuais recentes estão presentes no código, porém vários continuam `false`.

Entre eles:

```text
as6.looks
as6.material_v2
as6.classico_premium
as6.camera_v2
as6.sombras_v2
as6.pos_v2
as6.foto_lentes
as6.acess_2d_premium
as6.roupa_premium
as6.face_v2
as6.barba_slot
as6.brow_slot
as6.avatar_visual_v2
```

O próprio código descreve várias dessas flags como OFF para manter o comportamento anterior “byte a byte”. 

Não gastar nova onda simplesmente confirmando o que já sabemos.

A missão é **corrigir o resultado de produto decorrente dessa estratégia**.

---

# 3. O PROBLEMA DO 2D ESTÁ CONFIRMADO

O agente realmente criou uma quantidade considerável de conteúdo Premium 2D.

O catálogo já agrega:

- `BASES_PREMIUM`;
- `OLHOS_PREMIUM`;
- `BOCAS_PREMIUM`;
- `CABELOS_PREMIUM`;
- barbas;
- sobrancelhas;
- narizes;
- roupas premium;
- sobrepeças;
- roupa inferior;
- calçados;
- acessórios;
- fundos;
- auras;
- molduras. 

Portanto:

> **não alegar que o 2D ainda não foi trabalhado. Ele foi.**

O problema é outro.

O catálogo Premium só fica disponível quando `as6.classico_premium` está ativo. O próprio `itensDe()` filtra itens premium quando a flag está desligada. 

Isso significa que hoje temos, na prática:

```text
NOVO 2D PREMIUM
      ↓
existe no código
      ↓
mas permanece escondido
      ↓
USUÁRIO VÊ 2D LEGACY
```

Isto precisa ser corrigido.

---

# 4. O 2D PREMIUM NÃO PODE CONTINUAR SENDO UM “MODO SECRETO”

Depois da validação visual deste briefing, o 2D Premium deverá se tornar **a experiência principal para novos avatares**.

O Classic Legacy deve continuar existindo apenas para:

- compatibilidade de saves;
- avatars antigos;
- rollback;
- histórico.

Não como experiência principal para novos usuários.

---

# 5. NÃO DESTRUIR AVATARES ANTIGOS

Preservar a decisão correta de não alterar silenciosamente um avatar já salvo.

O sistema atualmente preserva IDs antigos e cria novos IDs Premium, evitando mudar a aparência de saves existentes automaticamente. 

Isso deve continuar.

Porém precisamos adicionar uma experiência explícita:

## “Atualizar para Premium”

Quando um avatar Legacy for aberto e possuir sucessores Premium compatíveis, oferecer:

```text
Seu avatar possui uma versão visual aprimorada.

[Ver comparação]
[Atualizar para Premium]
[Manter versão atual]
```

Não usar necessariamente esse texto final, mas implementar esta lógica.

---

# 6. UPGRADE LEGACY → PREMIUM DEVE SER PREVISUALIZÁVEL

Usar o `SUCESSOR_PREMIUM` existente.

Fluxo:

```text
AVATAR LEGACY
↓
calcular sucessores disponíveis
↓
montar candidate Premium SEM salvar
↓
mostrar Before × After
↓
usuário aprova
↓
aplicar novos IDs
↓
salvar normalmente
```

Nunca migrar silenciosamente.

---

# 7. O BEFORE × AFTER É O NOVO GATE PRINCIPAL

Criar comparação real para:

### 2D

```text
Legacy Face       vs Premium Face
Legacy Hair       vs Premium Hair
Legacy Outfit     vs Premium Outfit
Legacy Background vs Premium Background
Legacy Full Avatar vs Premium Full Avatar
```

### 3D

```text
Current 3D        vs Candidate Premium 3D
Old Camera        vs Camera V2
Old Lighting      vs New Looks
Old Materials     vs Material V2
Old Shadows       vs Shadows V2
Old Post          vs Post V2
```

---

# 8. BEFORE × AFTER NÃO É HASH

Os próprios documentos anteriores reconhecem que parte dos Goldens verificava byte-stability/hash, e não necessariamente qualidade visual percebida. 

O novo gate precisa ser uma **imagem realmente observável**.

Mesmo:

- avatar;
- pose;
- câmera;
- fundo;
- viewport;
- DPR.

Muda apenas o sistema que estamos comparando.

---

# 9. GERAR CONTACT SHEET DE VALIDAÇÃO

Criar uma página/rota interna que mostre lado a lado:

```text
BEFORE | AFTER
```

para todas as áreas críticas.

No mínimo:

### Classic

- Face Male;
- Face Female;
- Hair Male;
- Hair Female;
- Outfit Male;
- Outfit Female;
- Full Male;
- Full Female.

### 3D

- Full Male;
- Full Female;
- Bust;
- Face;
- Outfit;
- Hair;
- Hero;
- Product.

---

# 10. APROVAÇÃO HUMANA É O GATE

O próprio Visual QA existente já prevê aprovação humana para Premium/Hero/Golden. 

Usar isso de verdade.

Não:

```text
tests green
→ approved
```

Mas:

```text
tests green
→ candidate
→ screenshot
→ visual review
→ approved/rework
```

---

# 11. NÃO ALTERAR TODAS AS FLAGS PARA TRUE DE UMA VEZ

Não quero uma mudança cega como:

```text
false → true
```

em todas as flags e deploy direto em produção.

Primeiro criar uma experiência de **Candidate Preview** para validação.

Pode ser através do mecanismo de flags atual.

---

# 12. CRIAR “VISUAL CANDIDATE MODE” INTERNO

Precisamos de uma maneira simples de ativar a experiência candidata inteira para homologação.

Não necessariamente criar uma nova arquitetura.

Pode existir internamente como preset das flags.

Exemplo conceitual:

```text
AVATAR VISUAL CANDIDATE
```

ativa:

### 2D

```text
classico_premium
face_v2
barba_slot
brow_slot
roupa_premium
acess_2d_premium
cp_foto
```

### 3D

```text
looks
material_v2
camera_v2
sombras_v2
pos_v2
foto_lentes
```

Flags DEV continuam independentes.

---

# 13. NÃO MOSTRAR FLAGS PARA USUÁRIO FINAL

Candidate Mode é:

- QA;
- interno;
- validação.

Usuário final não precisa saber que existe.

---

# 14. APÓS APROVAÇÃO, MUDAR O DEFAULT

Se o Candidate Premium for visualmente aprovado:

```text
default false
→
default true
```

para as partes efetivamente aprovadas.

Isto é importante.

Não quero perpetuar uma situação onde todo desenvolvimento “novo” permanece eternamente escondido atrás de flags.

---

# 15. FEATURE FLAG NÃO É CEMITÉRIO DE FEATURE

Feature flag deve servir para:

```text
develop
→ test
→ validate
→ rollout
→ stabilize
→ remove/normalize
```

e não:

```text
develop
→ false para sempre
```

---

# 16. CRIAR MATRIZ DE FLAGS EFETIVAS

Em QA/Dev, disponibilizar uma pequena visão:

```text
Flag                  Valor   Origem
classico_premium      ON      local
face_v2               ON      local
camera_v2             ON      remote
...
```

A função atualmente resolve prioridade local → remoto → default.

Documentar/mostrar isso no Dev Mode.

Não colocar isso no produto normal.

---

# 17. 2D — PRIMEIRO OBJETIVO VISUAL

O Classic Premium precisa deixar de parecer:

> “o mesmo avatar com mais gradientes”.

O salto deve ser imediatamente evidente.

A meta continua:

> **Premium Stylized 2D / 2.5D Illustration**

---

# 18. 2D — FACE COMO PRIORIDADE ABSOLUTA

Antes de escalar mais itens, verificar os Premium existentes.

Pergunta obrigatória:

> Se eu colocar quatro rostos Premium lado a lado, eles parecem pessoas/personagens realmente diferentes ou parecem irmãos com pequenas mudanças?

Se parecem irmãos:

```text
REWORK
```

Não adicionar mais rostos até corrigir.

---

# 19. 2D — QUALITY BAR FACIAL

Cada Golden Face deve possuir distinção real de:

- skull/head shape;
- forehead;
- cheek;
- jaw;
- chin;
- eye shape;
- eye angle;
- nose;
- mouth;
- eyebrow;
- overall silhouette.

Não resolver identidade apenas através de:

- cabelo;
- cor;
- boca.

---

# 20. 2D — OLHOS

Garantir que a nova geração seja claramente superior ao legado em:

- sclera;
- iris;
- pupil;
- lids;
- catchlight;
- volume;
- expressão.

---

# 21. 2D — NARIZ

Nariz precisa contribuir realmente para identidade.

Não apenas pequeno traço central.

---

# 22. 2D — BOCA

Diferenciar:

- formato;
- volume;
- largura;
- expressão;
- lábio superior/inferior.

---

# 23. 2D — CABELO

Os novos cabelos premium já foram implementados em camadas, inclusive com massa traseira e recursos específicos. 

Agora validar artisticamente.

Pergunta:

> Parece cabelo ou um shape colado na cabeça?

Se ainda parece shape/helmet:

```text
REWORK
```

---

# 24. 2D — ROUPAS

Existe infraestrutura para roupas com `renderCorpoV2`, scaffold premium e novos outfits. 

Agora avaliar se visualmente:

```text
T-shirt
Shirt
Hoodie
Blazer
Coat
Gala
```

possuem silhuetas realmente diferentes.

Não aceitar apenas mudança de:

- gola;
- linha;
- gradiente.

---

# 25. 2D — MATERIALIDADE

Cotton precisa parecer diferente de:

- denim;
- leather;
- satin;
- wool;
- technical.

Sem transformar o SVG em pseudo-realismo.

---

# 26. 2D — AMBIENTE

Já existem fundos Premium, auras e planos. 

Validar se eles melhoram o avatar ou apenas adicionam elementos.

Fundo nunca deve competir com rosto.

---

# 27. 2D — DEFAULT DE NOVO AVATAR

Depois da aprovação:

**novo avatar deve nascer Premium**.

O código já possui `configInicial()` preparado para selecionar o Golden quando `classico_premium` estiver ativo. 

Usar essa infraestrutura.

---

# 28. 2D — LEGACY FICA COMO COMPATIBILIDADE

Não deletar assets Legacy.

Mas não usar Legacy como vitrine principal.

---

# 29. 2D — VITRINE

Vitrine padrão deve priorizar:

```text
Hero
Premium
Production
```

Legacy só quando necessário.

Nunca destacar prototype.

---

# 30. 2D — GATE DE ACEITAÇÃO

Criar status explícito:

```text
2D PREMIUM VISUAL GATE
```

Valores:

```text
NOT_READY
CANDIDATE
REWORK
APPROVED
```

---

# 31. NENHUMA ONDA 2D PODE SER “CONCLUÍDA” SEM O GATE

Mesmo se:

```text
300 testes passarem
```

se o avatar continuar amador:

```text
2D PREMIUM = REWORK
```

---

# 32. DIAGNÓSTICO 3D

A arquitetura evoluiu bastante.

Porém a arte ainda está limitada.

O próprio mapa de execução reconhece que o repositório não contém os assets necessários para:

- Golden Body premium;
- morph targets completos;
- Golden Face;
- Golden Hair cards;
- Premium modern outfits;
- Hero GLBs;
- vários cenários. 

Portanto:

> **Não chamar o 3D atual de AAA apenas porque o renderer ficou mais sofisticado.**

---

# 33. O AGENTE DEVE SEPARAR DUAS COISAS

Sempre reportar separadamente:

```text
3D ENGINE QUALITY
3D ART QUALITY
```

Exemplo:

```text
Engine: 8/10
Art: 4/10
```

é muito mais útil que dizer:

> “3D premium concluído”.

---

# 34. 3D ENGINE NÃO PODE MASCARAR ART FRACA

Iluminação melhor não corrige:

- geometria fraca;
- rosto genérico;
- cabelo ruim;
- roupa low-poly inadequada.

---

# 35. NÃO CONSTRUIR MAIS INFRAESTRUTURA ANTES DE USAR A QUE EXISTE

Já temos:

- material pipeline;
- lighting registry;
- camera V2;
- shadows V2;
- post V2;
- quality manager;
- LOD;
- telemetry;
- visual QA.

A próxima prioridade não é criar:

```text
Material System V3
Camera V3
Lighting V3
```

A prioridade é **colocar o que já existe na tela e verificar se melhora**.

---

# 36. 3D — PRIMEIRA ENTREGA CORRETIVA

Criar um Golden 3D Candidate utilizando os melhores assets já disponíveis.

Ativar nele:

```text
material_v2
looks
camera_v2
sombras_v2
pos_v2
```

Gerar:

```text
Current 3D
vs
Candidate 3D
```

---

# 37. SE O GANHO FOR PEQUENO, NÃO ADICIONAR MAIS PÓS

Se continuar amador:

diagnóstico deve ser:

```text
ASSET QUALITY BOTTLENECK
```

Não:

```text
precisamos de mais bloom
```

---

# 38. ASSETS 3D PREMIUM — BLOQUEIO DEVE SER EXPLÍCITO

O próprio projeto já identificou que as roupas Executive/Casual/Urban/Sport/Cyber premium não existem no farm CC0 atual e dependem de autoria/licença/compra ou aceitação de um teto visual inferior. 

Portanto não fingir que isso está resolvido.

Criar uma tabela:

| Categoria | Atual | Target | Status |
|---|---|---|---|
| Body | UBC | Premium M/F | BLOCKED/AVAILABLE |
| Face | UBC | Golden Face | ... |
| Hair | atual | Premium cards | ... |
| Outfit | Ranger/Peasant | Modern Premium | ... |
| Hero Props | procedural | Hero | ... |

---

# 39. QUANDO FALTAR ASSET, INFORMAR

Usar status:

```text
ENGINE READY
ART BLOCKED
```

Não inventar “concluído”.

---

# 40. FONTES PERMITIDAS PARA NOVOS ASSETS

Não incorporar asset sem licença apropriada.

Opções:

- CC0;
- licença permissiva devidamente documentada;
- assets contratados/autoria própria;
- pack adquirido com direito de uso compatível.

Registrar origem.

---

# 41. NÃO FICAR PARADO POR FALTA DE ASSET

Onde for possível criar arte procedural realmente boa, fazer.

Principalmente:

- óculos;
- joia;
- coroa;
- relógio;
- alguns props;
- plataforma;
- fundos abstratos.

Mas:

> procedural refinado.

Não primitives de PoC.

---

# 42. 3D — CORPO

Não considerar `scale X/Y` equivalente a morph system premium.

Se morph targets reais não existem:

registrar:

```text
BODY MORPHS — PARTIAL
```

---

# 43. 3D — FACE

Enquanto não houver facial morphs/mesh adequados:

não marcar Face 3D Premium como concluída.

---

# 44. 3D — HAIR

Cabelo é prioridade visual muito alta.

Se o asset atual permanece low-poly/opaque:

não tentar compensar exclusivamente com material.

---

# 45. 3D — ROUPAS

Ranger/Peasant podem continuar como compatibilidade.

Mas não representam a direção final Executive/Casual/Urban/Sport.

---

# 46. 3D — ACESSÓRIOS

A auditoria encontrou anteriormente três caminhos 3D paralelos:

- PoC `Acessorios3D`;
- props aproximados no shell;
- assembler GLB.

Essa fragmentação já foi reconhecida como risco. 

Unificar.

---

# 47. DEVE EXISTIR UMA ÚNICA FONTE CANÔNICA DE ACESSÓRIO 3D

Arquitetura desejada:

```text
Accessory Registry
↓
socket
anchor
fit
bounds
material
asset
↓
Renderer
```

PoC, shell e assembler não podem possuir regras divergentes.

---

# 48. PROBLEMA CRÍTICO — DOIS FLUXOS 3D

O build contém:

```text
Estudio3D
Renderizador3d
```

e `Estudio3D.tsx` ainda é descrito como uma “Prova de Conceito”. 

Isto precisa ser resolvido.

---

# 49. DEFINIR UM RENDERER 3D CANÔNICO

Escolher explicitamente o caminho de produto.

Preferência arquitetural conforme o estado atual:

```text
ShellStudio
→
Palco3d
→
FabricaRenderizador
→
Renderizador3d
```

e transformar a antiga `poc3d/Estudio3D` em:

```text
DEV/LEGACY/DEPRECATED
```

se nenhum requisito exclusivo justificar mantê-la.

---

# 50. NÃO REMOVER A PoC ANTES DE MIGRAR O QUE FOR NECESSÁRIO

Antes:

1. listar funcionalidades exclusivas;
2. migrar as úteis;
3. testar;
4. depois retirar do fluxo do usuário.

---

# 51. USUÁRIO NÃO PODE ESCOLHER ENTRE DOIS “3D”

Deve existir:

```text
Modo 3D
```

e somente uma experiência.

---

# 52. O PROBLEMA DA UI 3D

O `Palco3d` atualmente concentra:

- personagem;
- cabelo;
- barba;
- roupa;
- animações;
- qualidade;
- camera;
- zoom;
- altura;
- exposição;
- fundo;
- lighting;
- poses;
- cenas;
- roteiro;
- post;
- partículas;
- capture;
- turntable;
- marca;
- tinta;
- QA;
- tone mapping;
- environment;
- lens;
- comparação 2D;
- etc.

Isso é excessivo.

---

# 53. META DE UX

A experiência principal deve parecer:

> **Character Creator**

e não:

> **painel de debug de engine gráfica**.

---

# 54. REDESENHO DA INFORMATION ARCHITECTURE 3D

Organizar experiência principal aproximadamente em:

```text
PERSONAGEM
ROSTO
CABELO
ROUPA
ACESSÓRIOS
CENA
FOTO
```

---

# 55. CONTROLES PRINCIPAIS DEVEM SER VISUAIS

Preferir:

- thumbnails;
- cards;
- presets;
- swatches.

Evitar transformar tudo em:

- chip;
- slider;
- texto.

---

# 56. PERSONAGEM

Usuário comum precisa ver:

- base;
- corpo/preset;
- talvez gênero/família.

Não:

- informações de rig;
- LOD;
- diagnostics.

---

# 57. ROSTO

Mostrar escolhas visuais.

Quando facial morphs existirem:

usar controles semânticos.

---

# 58. CABELO

Cards grandes.

Ao clicar:

```text
aplica
→
câmera vai para bust/face
```

---

# 59. ROUPA

Thumbnail full body.

Aplicar outfit inteiro ou peça.

---

# 60. ACESSÓRIOS

Categoria visual.

Não mostrar “14 sockets” como conceito técnico ao usuário.

Usuário pensa:

```text
Óculos
Chapéus
Colares
Relógios
Mochilas
Asas
Pets
```

Não:

```text
wrist_l
wrist_r
back
face
```

Socket pertence ao motor.

---

# 61. CENA

Usuário precisa escolher:

```text
Studio
Hero
Neon
...
```

não controlar dezenas de variáveis simultaneamente.

---

# 62. FOTO

Pode oferecer:

- Portrait;
- Full;
- Fashion;
- Hero;
- Close-up.

A infraestrutura de lentes já existe.

---

# 63. CONTROLES AVANÇADOS

Criar:

```text
Avançado
```

ou preferencialmente Dev Mode.

Colocar ali:

- exposure;
- manual camera tuning;
- quality override;
- environment tuning.

---

# 64. CONTROLES DEV NÃO PERTENCEM AO PRODUTO

Dev-only:

- tone mapping selector;
- QA overlays;
- wireframe;
- material debug;
- key/fill/rim multipliers;
- performance HUD;
- LOD force;
- technical inspector.

---

# 65. DEV MODE DEVE SER INVISÍVEL PARA USUÁRIO NORMAL

Controlado por:

```text
QA/DEV flag
```

---

# 66. REGRA DOS CONTROLES

Antes de adicionar qualquer novo controle perguntar:

> O usuário precisa decidir isso para criar o avatar?

Se não:

```text
DEV / AUTOMATIC / PRESET
```

---

# 67. REDUZIR CHIPS

A UI atual usa muitos chips.

Fazer uma auditoria específica:

```text
CHIP
→
CARD?
→
THUMB?
→
ICON?
→
HIDE?
```

---

# 68. NÃO REMOVER CAPACIDADE — REMOVER RUÍDO

Recursos avançados podem continuar no sistema.

Só não precisam estar todos simultaneamente expostos.

---

# 69. PROGRESSIVE DISCLOSURE

Exemplo:

```text
Cena
 ├ Studio
 ├ Portrait
 ├ Hero
 ├ Neon
 └ Avançado >
```

Avançado:

```text
Exposure
Environment
etc.
```

---

# 70. A TELA DEVE SER DOMINADA PELO AVATAR

Objetivo visual:

```text
65–75% percepção = personagem
25–35% = ferramentas
```

Não precisa ser proporção CSS literal.

É hierarquia perceptiva.

---

# 71. MENU NÃO PODE COMPETIR COM O PERSONAGEM

O usuário precisa primeiro olhar o avatar.

---

# 72. CAMERA AUTO-CONTEXTUAL

Usar as melhorias já implementadas:

```text
Face → Face
Hair → Bust
Clothing → Full/¾
Shoes → Lower
Wings → Full wider
Backpack → Back
```

---

# 73. USUÁRIO NÃO DEVE PRECISAR AJUSTAR CÂMERA O TEMPO TODO

Presets resolvem.

Orbit continua disponível.

---

# 74. CAMERA V2

Está implementada mas OFF.

Primeiro validar visualmente.

Se superior:

ativar.

---

# 75. LOOKS

Mesmo princípio.

Comparar:

```text
Legacy Studio
vs
New Studio
```

Se melhor:

ativar.

---

# 76. MATERIAL V2

Comparar:

```text
skin
hair
fabric
metal
```

antes/depois.

---

# 77. SHADOWS V2

Validar:

- pés no chão;
- rosto;
- cabelo;
- outfit.

---

# 78. POST V2

Validar sem excesso.

Não quero:

> “mais cinematic” = “mais bloom”.

---

# 79. STUDIO É A VERDADE

Studio deverá permanecer neutro.

Se o personagem parece ruim no Studio:

asset ainda está ruim.

---

# 80. HERO NÃO É O BENCHMARK DE QUALIDADE BASE

Hero é apresentação.

Studio testa qualidade.

---

# 81. CRIAR 3 GATES OFICIAIS

Obrigatórios:

```text
GATE A — 2D PREMIUM VISUAL
GATE B — 3D PREMIUM VISUAL
GATE C — 3D UX SIMPLICITY
```

---

# 82. GATE A — 2D

Aprovar somente quando:

- Golden Male claramente premium;
- Golden Female claramente premium;
- rosto superior ao Legacy;
- cabelo superior;
- roupa superior;
- fundo superior;
- full body coerente;
- não parece apenas “mais efeitos”.

---

# 83. GATE B — 3D

Aprovar somente quando:

- personagem realmente melhora;
- material melhora;
- câmera melhora;
- shadows melhoram;
- iluminação melhora;
- rosto continua legível;
- hair não parece pior;
- outfit funciona;
- não depende de bloom para impressionar.

---

# 84. GATE C — UX

Aprovar somente quando usuário normal consegue:

1. escolher personagem;
2. mudar rosto;
3. mudar cabelo;
4. mudar roupa;
5. equipar acessórios;
6. selecionar cena;
7. tirar foto;

sem ter que compreender:

- LOD;
- material;
- tone mapping;
- rig;
- key/fill/rim;
- renderer internals.

---

# 85. ESTADO DOS GATES

Usar:

```text
NOT_READY
CANDIDATE
REWORK
APPROVED
```

---

# 86. NÃO USAR CHECKBOX AUTOMÁTICO COMO APROVAÇÃO

O status `APPROVED` dos três gates exige análise visual.

---

# 87. PRIMEIRA ONDA DESTE BRIEFING

Não quero 20 novas features.

Quero:

### Fase A — tornar o que existe avaliável

1. Candidate Mode;
2. ligar 2D Premium em QA;
3. ligar 3D Candidate em QA;
4. gerar Before × After;
5. simplificar provisoriamente a UI 3D;
6. apresentar resultado.

---

# 88. ENTREGA A1 — 2D BEFORE × AFTER

Gerar pelo menos:

```text
01_face_male
02_face_female
03_hair_male
04_hair_female
05_outfit
06_full_male
07_full_female
08_environment
```

---

# 89. ENTREGA A2 — 3D BEFORE × AFTER

Gerar:

```text
01_full
02_bust
03_face
04_material_skin
05_material_hair
06_outfit
07_studio
08_hero
```

---

# 90. ENTREGA A3 — UX BEFORE × AFTER

Screenshot:

```text
Current 3D UI
vs
Simplified 3D UI
```

---

# 91. NÃO CONTINUAR PARA NOVAS ONDAS SEM ESSE MATERIAL

Essa é uma nova regra.

---

# 92. FASE B — CORRIGIR O 2D

Com base na avaliação:

- rework face;
- rework hair;
- rework clothes;
- rework backgrounds.

Até Gate A = APPROVED.

---

# 93. FASE C — CORRIGIR O 3D ENGINE VISÍVEL

Ativar/refinar:

- materials;
- lighting;
- camera;
- shadows;
- post.

Até utilizar efetivamente o que já foi desenvolvido.

---

# 94. FASE D — CORRIGIR A ARTE 3D

Criar/importar o conteúdo que falta.

Prioridade:

```text
BODY
FACE
HAIR
OUTFIT
ACCESSORIES
```

---

# 95. NÃO COMEÇAR PELOS CENÁRIOS

Personagem primeiro.

---

# 96. FASE E — UX FINAL

Depois que o conteúdo real estiver presente:

simplificar definitivamente menus.

---

# 97. FASE F — DEFAULT ON

Após aprovação dos respectivos gates:

ativar por padrão as flags aprovadas.

---

# 98. FASE G — CLEANUP

Depois da estabilização:

avaliar remoção/consolidação de:

- flags antigas;
- PoC antiga;
- caminhos duplicados;
- componentes obsoletos.

---

# 99. NÃO FAZER CLEANUP ANTES DO ROLLOUT

Preservar rollback.

---

# 100. NÃO EXPANDIR CATÁLOGO 3× AINDA

O próprio Golden Gate original já dizia para não escalar antes do quality lock. 

Essa regra permanece.

---

# 101. QUALITY LOCK

Só existe quando:

```text
2D Gate = APPROVED
3D Gate = APPROVED
UX Gate = APPROVED
```

---

# 102. APÓS QUALITY LOCK

Aí sim:

- triplicar faces;
- hairs;
- eyes;
- mouths;
- outfits;
- accessories;
- backgrounds;
- effects.

---

# 103. NOVA DEFINIÇÃO DE “ENTREGA”

Relatório de cada onda deverá ter:

```text
1. O que mudou
2. Onde aparece para o usuário
3. Flag efetiva
4. Screenshot Before
5. Screenshot After
6. Resultado visual
7. Gate afetado
8. Performance
9. Testes
10. Rollback
```

---

# 104. SE NÃO APARECE NA TELA, DECLARAR CORRETAMENTE

Exemplo:

```text
Infraestrutura concluída.
Ainda não entregue visualmente.
```

Não:

```text
Feature concluída.
```

---

# 105. NÃO USAR “✅ ENTREGUE” PARA INFRA INVISÍVEL

Usar:

```text
ENGINE READY
VISUAL PENDING
```

---

# 106. STATUS PADRÃO SUGERIDO

```text
ENGINE
ART
UX
ROLLOUT
```

Exemplo:

```text
Material System
ENGINE: READY
ART: PARTIAL
UX: N/A
ROLLOUT: OFF
```

Isso comunica o estado real.

---

# 107. DISTINGUIR QUALIDADE TÉCNICA DE QUALIDADE PERCEBIDA

O projeto está muito avançado tecnicamente.

Mas a prioridade deste briefing é:

> **qualidade percebida.**

---

# 108. NÃO CRIAR MAIS DOCUMENTAÇÃO DO QUE IMPLEMENTAÇÃO VISUAL

Documentar apenas o necessário.

Neste momento:

```text
1 hora melhorando screenshot real
>
1 hora produzindo novo documento conceitual
```

quando o conceito já está definido.

---

# 109. NÃO REESCREVER A ARQUITETURA BOA

Preservar:

- saves;
- IDs;
- undo/redo;
- LOD;
- caches;
- asset pipeline;
- material pipeline;
- QA;
- telemetry;
- renderer contracts.

---

# 110. NÃO USAR “REFAZER TUDO” COMO SOLUÇÃO

O problema não é ausência de infraestrutura.

É falta de:

```text
ACTIVATION
ART QUALITY
CONSOLIDATION
UX CURATION
```

---

# 111. DEPLOY

O deploy atual foi auditado e o build do Avatar Studio está sendo produzido corretamente.

Não perder tempo investigando build sem novo sintoma.

---

# 112. REMOTE FLAGS

A API de feature flags exige autenticação.

Quando necessário verificar flag efetiva em produção:

fazer pelo contexto autenticado/browser ou instrumento interno.

Não usar `curl` sem autenticação como prova de estado da sessão do usuário.

---

# 113. CRIAR DIAGNÓSTICO DE FLAGS NO DEV MODE

Isso evitará repetir toda esta investigação futuramente.

Exibir:

```text
default
remote
local override
effective
dependencies
```

---

# 114. REGRESSÃO

Manter todos os testes de compatibilidade existentes.

Eles são valiosos.

Só não tratá-los como substituto da aprovação visual.

---

# 115. BYTE-STABILITY

Continuar garantindo que:

```text
Legacy avatar saved
→ Legacy avatar unchanged
```

---

# 116. VISUAL PROGRESS

Adicionar também:

```text
Premium candidate
→ must visibly improve
```

São objetivos diferentes.

---

# 117. ROLLBACK

Deve permanecer simples.

Se Premium aprovado apresentar problema:

```text
flag OFF
→ Legacy
```

até correção.

---

# 118. MAS ROLLBACK NÃO PODE VIRAR MOTIVO PARA DEIXAR TUDO OFF

Feature flag existe para permitir rollout seguro.

Não para impedir rollout indefinidamente.

---

# 119. CHECKLIST DE PRIMEIRA ENTREGA

Antes de me retornar dizendo “concluído”, apresentar:

### 2D

- [ ] Candidate ligado em QA
- [ ] Golden Male visível
- [ ] Golden Female visível
- [ ] Before × After Face
- [ ] Before × After Hair
- [ ] Before × After Outfit
- [ ] Before × After Full
- [ ] Upgrade Legacy → Premium funcionando

### 3D

- [ ] Candidate ligado
- [ ] Camera V2 ativa
- [ ] Looks ativos
- [ ] Material V2 ativo
- [ ] Shadows V2 ativa
- [ ] Post V2 ativo
- [ ] Before × After
- [ ] gargalo ART documentado honestamente

### UX

- [ ] controles Dev ocultos
- [ ] menu principal simplificado
- [ ] assets visual-first
- [ ] personagem continua dominando viewport

---

# 120. DEFINITION OF DONE DESTE BRIEFING

Este briefing somente estará concluído quando:

```text
1. Eu abrir o Avatar Studio
2. O 2D novo estiver claramente melhor
3. O 3D novo estiver claramente melhor
4. O 3D estiver mais simples de operar
5. Novos avatares usarem o padrão aprovado
6. Avatares antigos continuarem íntegros
7. O sistema possuir upgrade Legacy → Premium
8. Before × After estiver documentado
9. As flags aprovadas estiverem efetivamente em rollout
10. Os três Visual Gates estiverem APPROVED
```

---

# 121. DEFINIÇÃO FINAL DE SUCESSO

O sucesso não será:

```text
+20 serviços
+30 commits
+100 testes
```

O sucesso será:

> **Abrir o Avatar Studio e perceber imediatamente que ele ficou melhor.**

No 2D:

> deve parecer uma ilustração digital premium.

No 3D:

> deve parecer um Character Creator premium stylized.

Na UX:

> deve parecer simples apesar da sofisticação existente por baixo.

---

# 122. PRINCÍPIO FINAL PARA O AGENTE

Durante todas as próximas ondas, trabalhar nesta ordem:

```text
VER O QUE O USUÁRIO REALMENTE VÊ
↓
MELHORAR ESSA EXPERIÊNCIA
↓
COMPARAR BEFORE × AFTER
↓
VALIDAR VISUALMENTE
↓
ATIVAR
↓
SÓ DEPOIS ESCALAR
```

Nunca mais:

```text
IMPLEMENTAR
↓
TESTAR
↓
DEIXAR OFF
↓
MARCAR COMO CONCLUÍDO
↓
COMEÇAR A PRÓXIMA FEATURE
```

Este ciclo é exatamente o que precisamos interromper.

---

# ORDEM EXECUTIVA IMEDIATA

Execute agora nesta sequência:

```text
P0 — Candidate Mode e matriz de flags efetivas
P0 — Before × After 2D
P0 — Before × After 3D
P0 — Simplificação da UI 3D
P1 — Rework visual 2D até aprovação
P1 — Ativar stack 3D já existente e calibrar
P1 — Resolver gargalos de ART 3D
P1 — Consolidar um único fluxo 3D
P1 — Gate visual final
P1 — Rollout default ON
P2 — Só então expandir catálogo
```

---

## REGRA DE ENCERRAMENTO

**Não inicie uma nova frente conceitual do Mega Briefing antes de executar esta correção.**

Já existe infraestrutura suficiente.

Agora precisamos converter essa infraestrutura em:

> **qualidade que aparece na tela.**