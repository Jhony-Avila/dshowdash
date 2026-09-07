Quero uma nova rodada de UX no Visual Composer do Avatar Studio com um objetivo central:

> Manter a riqueza de recursos, mas tornar a criação de avatar predominantemente visual, direta e intuitiva.

Os prints da interface anterior devem ser tratados como **anti-referência**. Não quero retornar àquela composição com:

- sidebar taxonômica extensa;
- dezenas de categorias simultâneas;
- toolbar cheia de botões;
- breadcrumbs e contadores permanentes;
- várias abas e filtros sempre visíveis;
- instruções textuais longas;
- painel de cores permanente;
- informações técnicas;
- palco pequeno;
- catálogo disputando atenção com navegação e ferramentas.

A nova experiência deve permitir que uma pessoa sem treinamento entenda como editar o avatar em poucos segundos.

## Princípio de produto

A tela principal deve responder visualmente a três perguntas:

1. Qual é o meu avatar?
2. Em que parte dele quero mexer?
3. Quais opções visuais posso aplicar?

A resposta não deve depender de o usuário compreender uma taxonomia extensa.

Fluxo esperado:

```text
ver avatar
→ tocar/clicar na parte desejada
→ visualizar opções daquele contexto
→ escolher um asset
→ ver resultado imediatamente
→ salvar
```

Exemplos:

```text
clicar no cabelo → abrir opções de cabelo
clicar nos olhos → abrir opções de olhos
clicar na boca → abrir opções de boca
clicar no rosto → abrir formato/traços do rosto
clicar na camisa → abrir roupas
clicar nos pés → abrir calçados
clicar no fundo → abrir cenários
clicar em um acessório visível → abrir seus detalhes/substituições
```

Esse deve ser o caminho principal. Menus e categorias passam a ser alternativas, não o método obrigatório.

## Estado desejado

```text
STAGE_FIRST                 = YES
DIRECT_MANIPULATION         = YES
AVATAR_HOTSPOTS             = YES
CONTEXTUAL_CATALOG          = YES
PROGRESSIVE_DISCLOSURE      = YES
PERMANENT_LONG_SIDEBAR      = NO
PERMANENT_COLOR_PANEL       = NO
PERMANENT_FILTER_PANEL      = NO
TECHNICAL_LABELS_VISIBLE    = NO
INTERNAL_TAXONOMY_VISIBLE   = NO
OLD_SHELL                   = FORA DA JORNADA NORMAL
```

## 1. Palco como centro da experiência

O palco deve continuar dominante no desktop, tablet e mobile.

Requisitos:

- avatar grande e legível;
- área livre ao redor;
- fundo neutro;
- clique/toque direto nas regiões;
- feedback imediato ao passar, focar ou tocar;
- nenhuma toolbar cobrindo o personagem;
- nenhum texto permanente sobre o palco;
- zoom/enquadramento automático por região;
- retorno fácil à visão completa;
- atualização visual imediata após seleção de asset.

No mobile, o palco deve aparecer antes do catálogo. No desktop, deve ocupar a maior área da interface.

## 2. Hotspots anatômicos e contextuais

Implemente uma camada de interação visual sobre o avatar.

Regiões mínimas:

```text
cabelo
rosto
olhos
sobrancelhas
nariz
boca
barba, quando aplicável
pescoço/acessórios
tronco/roupa
pernas/roupa inferior
pés/calçados
mãos/acessórios
fundo/cenário
```

Comportamento:

- a região deve responder ao pointer/foco;
- realce discreto, sem transformar o avatar em diagrama técnico;
- cursor apropriado;
- tooltip curto apenas em desktop;
- nome acessível completo;
- toque único abre o catálogo correspondente;
- teclado deve permitir percorrer regiões;
- Enter/Espaço ativa;
- região selecionada fica indicada;
- câmera reenquadra automaticamente;
- catálogo muda de contexto;
- selecionar um asset atualiza o avatar;
- voltar retorna ao contexto anterior sem perder edição.

Não desenhe caixas retangulares grosseiras visíveis permanentemente. As áreas de clique podem ser invisíveis e ganhar contorno sutil somente no hover/foco/seleção.

## 3. Navegação alternativa simplificada

Hotspots são o caminho principal, mas precisamos de uma alternativa acessível e previsível.

Mantenha uma rail curta com categorias humanas:

```text
Base
Cabelo
Rosto
Roupa
Acessórios
Mais
```

Não exponha quinze grupos ao mesmo tempo.

Dentro de `Rosto`, apresentar subcontextos visualmente:

- formato;
- olhos;
- sobrancelhas;
- nariz;
- boca;
- barba.

Dentro de `Roupa`:

- parte superior;
- parte inferior;
- sobreposição;
- calçados.

Dentro de `Acessórios`:

- cabeça;
- rosto;
- orelhas;
- pescoço;
- mãos;
- costas;
- companheiro.

Categorias de menor frequência entram em `Mais`.

Não mostrar ao usuário nomes internos como:

- identidade visual;
- elementos especiais;
- costas e mobilidade;
- equipamentos;
- personalidade;
- categoria mãe/principal;
- IDs;
- slots;
- enums;
- nomes de domínio técnico.

Use linguagem cotidiana.

## 4. Redução radical de rótulos

A interface anterior contém muitos textos que não ajudam na escolha visual.

Remover da superfície principal:

- contadores permanentes como `Rosto 36`, `Cabelo 50`;
- breadcrumbs extensos;
- frases como `Personagem › Boca › 40 itens`;
- origem do asset;
- qualificação técnica;
- raridade em texto permanente;
- preço interno, quando não for necessário à ação;
- “nível”, “itens explorados” e estatísticas;
- seção “Novidades em preparação”;
- explicações longas;
- instruções de câmera;
- histórico da sessão sempre aberto;
- versão e “novo estúdio (prévia)” em destaque;
- rótulos HSL;
- status técnico;
- informações de debugging.

Essas informações podem existir em:

- detalhes do asset;
- tooltip;
- filtro avançado;
- ajuda;
- diagnóstico restrito;
- painel “Sobre”;
- contexto de compra/desbloqueio.

Regra:

> Se o texto não for necessário para escolher, entender ou concluir a ação atual, ele não deve ocupar a tela principal.

## 5. Header mínimo

Header esperado:

```text
Voltar | Avatar Studio | Desfazer | Refazer | Salvar | Mais
```

No mobile:

- Voltar pode ser apenas ícone com nome acessível;
- título pode quebrar de forma controlada;
- Salvar deve permanecer evidente;
- ações secundárias entram em `Mais`;
- nenhum conjunto com quinze botões;
- nenhum `Modo clássico` para usuário comum;
- nenhum seletor técnico;
- nenhum texto de versão.

Dentro de `Mais`, agrupar:

```text
Apresentar
Aleatório
Histórico
Presets
Foto
Coleções
Conquistas
Ajuda
Preferências
Diagnóstico — apenas QA/admin
```

Não apresentar todos os comandos simultaneamente.

## 6. Catálogo predominantemente visual

Cada card deve priorizar:

1. imagem do asset;
2. estado selecionado;
3. favorito;
4. nome curto, somente quando necessário.

Evitar no card principal:

- descrição;
- origem;
- raridade escrita;
- preço;
- tags;
- código;
- metadata;
- vários badges;
- múltiplas ações pequenas.

Comportamento:

- clique no card aplica;
- seleção recebe borda/check claros;
- favorito é uma ação secundária;
- detalhes abrem por menu contextual ou ação própria;
- preview responde rapidamente;
- assets de cabelo, olhos, bocas e roupas devem ser comparáveis visualmente;
- miniatura deve refletir o contexto selecionado;
- cards não podem mostrar uma cabeça inteira quando apenas a boca precisa ser comparada, salvo quando necessário para contexto.

Para boca, mostrar a região da boca. Para olhos, mostrar olhos. Para cabelo, mostrar cabeça/cabelo. Para calçados, mostrar os pés.

## 7. Busca e filtros sob demanda

A interface anterior mantém busca, filtros, abas, raridade e chips simultaneamente.

Na nova interface:

- botão de busca abre campo quando solicitado;
- filtro abre sheet/popover;
- filtros ficam recolhidos por padrão;
- indicador curto mostra quando filtro está ativo;
- “limpar filtros” deve ser simples;
- raridade não precisa aparecer permanentemente;
- Favoritos continua como destino claro;
- `Novos`, `Bloqueados` e `Presets` não devem ocupar a navegação principal do catálogo.

Estrutura sugerida:

```text
Catálogo | Favoritos | Visual atual | Cores | Buscar | Filtrar
```

No mobile, use ícones e rótulos apenas quando houver espaço, preservando nomes acessíveis.

## 8. Cores contextuais

O painel de cores deve aparecer somente quando:

- o usuário toca em Cores;
- seleciona uma região colorível;
- escolhe “Cor personalizada”.

Fluxo:

```text
região/asset selecionado
→ Cores
→ paleta relevante
→ aplicação imediata
```

Não mostrar simultaneamente Pele, Cabelo, Roupa e Destaque se apenas uma região está sendo editada.

Exemplo:

```text
clicou no cabelo
→ catálogo de cabelos
→ botão Cores
→ somente cores de cabelo
```

A opção avançada de cor pode existir em “Personalizada”, sem rótulos HSL/RGB permanentes.

## 9. Visual atual

`Visual atual` deve ser um resumo visual do que está equipado, não uma tabela técnica.

Mostrar:

- miniatura;
- nome curto;
- ação trocar;
- ação remover, quando permitido;
- agrupamento simples por região.

Evitar:

- IDs;
- histórico permanente;
- botões repetidos;
- linhas vazias;
- cadeados/estrelas/lápis/lixeira simultâneos sem contexto;
- informações que o usuário não precisa para editar o avatar.

## 10. Mobile

No mobile:

- rail de categorias no topo;
- palco dominante;
- bottom sheet com catálogo;
- três detentes: recolhida, intermediária e expandida;
- categoria nunca coberta pela sheet;
- sheet intermediária preserva parte significativa do avatar;
- seleção aplica e permite ver resultado;
- sheet pode recolher automaticamente após aplicação, se isso melhorar a comparação;
- busca e filtros abrem em superfícies próprias;
- nenhum overflow horizontal da página;
- safe areas;
- targets ≥44×44;
- teclado não cobre campos/ações;
- gestos não conflitam entre rail e sheet;
- nome longo não quebra layout;
- loading/erro/vazio permanecem claros.

## 11. Desktop

No desktop:

- rail curta à esquerda;
- palco grande;
- painel contextual à direita;
- painel direito recolhível;
- não restaurar catálogo inferior;
- não restaurar sidebar taxonômica;
- não preencher espaços vazios com controles;
- atalhos avançados podem existir em `Mais` ou via teclado;
- manter foco na edição visual.

Espaço livre não é defeito quando reforça o palco. Poluição visual não deve ser usada para “aproveitar” toda a tela.

## 12. Recursos avançados sem poluição

O produto pode continuar rico em recursos, usando revelação progressiva:

### Nível 1 — sempre visível

- avatar;
- categorias principais;
- catálogo contextual;
- desfazer/refazer;
- salvar.

### Nível 2 — sob demanda

- busca;
- filtros;
- cores;
- favoritos;
- Visual atual;
- detalhes do asset.

### Nível 3 — menu Mais

- presets;
- histórico;
- apresentação;
- foto;
- coleções;
- conquistas;
- ajuda;
- preferências.

### Nível 4 — restrito

- diagnóstico;
- códigos;
- import/export;
- telemetria;
- ferramentas técnicas;
- shell clássico de emergência;
- informações de QA.

Não misture esses quatro níveis na mesma tela.

## 13. Onboarding mínimo

Para a primeira abertura, use uma instrução curta e descartável:

```text
Clique em uma parte do avatar para personalizar.
```

No mobile:

```text
Toque em uma parte do avatar para personalizar.
```

Após a primeira interação, esconder. Não criar tutorial longo nem modal obrigatório.

Hotspots podem pulsar discretamente uma única vez para ensinar a interação, respeitando `prefers-reduced-motion`.

## 14. Acessibilidade

A edição direta precisa continuar acessível sem mouse:

- regiões do avatar entram na ordem de foco;
- nomes como “Editar cabelo” e “Editar olhos”;
- estado selecionado anunciado;
- mudança de categoria anunciada;
- aplicação do asset anunciada de forma não intrusiva;
- rail com semântica de navegação;
- catálogo com estrutura consistente;
- modal/sheet com foco preso e retorno;
- contraste AA;
- seleção não depende apenas de cor;
- zoom do navegador permitido;
- reduced motion;
- targets ≥44×44;
- VoiceOver/TalkBack previstos.

O SVG não pode virar uma sequência de centenas de paths focáveis. Exponha somente as regiões interativas de alto nível.

## 15. Performance

A interação direta não pode adicionar centenas de listeners individuais.

Preferir:

- delegação de eventos;
- mapa de regiões;
- overlays simples;
- callbacks existentes;
- atualização contextual;
- lazy loading de ferramentas avançadas;
- cleanup de observers/listeners;
- zero duplicação do renderer.

Metas:

```text
clique/toque → mudança de contexto perceptivelmente imediata
seleção de asset → preview imediato
zero crescimento de listeners após trocas repetidas
zero crescimento contínuo de DOM/heap
zero erro de console
```

## 16. Compatibilidade e arquitetura

Não reescreva:

- motor;
- renderer;
- store;
- persistência;
- backend;
- assets;
- contratos de save.

Reutilize os handlers e domínios existentes.

A mudança é de composição, navegação e apresentação.

A flag permanece:

```text
as6.visual_composer = OFF por padrão
```

Com flag OFF:

- experiência anterior continua preservada;
- nenhum CSS/handler do VC vaza;
- desktop anterior não muda;
- save anterior não muda.

Com flag ON:

- jornada normal permanece integralmente no Visual Composer;
- shell clássico não aparece;
- Diagnóstico continua restrito.

## 17. Paridade funcional

Manter acessíveis, ainda que em níveis secundários:

- Aleatório;
- Apresentar;
- desfazer/refazer;
- salvar;
- Cores;
- Favoritos;
- Visual atual;
- Histórico;
- Presets;
- Foto;
- Coleções;
- Conquistas;
- Ajuda;
- Preferências;
- 3D, se ainda fizer parte do produto;
- cenário;
- exportação/importação autorizadas.

Entregue uma matriz mostrando onde cada função vive. Nenhuma função deve reaparecer como botão permanente apenas para “provar paridade”.

## 18. Critérios visuais de aceite

A próxima versão só pode ser apresentada se:

```text
PALCO_DOMINANTE=YES
DIRECT_HAIR_CLICK=YES
DIRECT_EYES_CLICK=YES
DIRECT_MOUTH_CLICK=YES
DIRECT_FACE_CLICK=YES
DIRECT_CLOTHING_CLICK=YES
DIRECT_FOOTWEAR_CLICK=YES
CONTEXTUAL_CATALOG=YES
PERMANENT_LONG_SIDEBAR=NO
PERMANENT_COLOR_PANEL=NO
PERMANENT_FILTER_PANEL=NO
TOP_ACTIONS<=6_DESKTOP
TOP_ACTIONS<=5_MOBILE
TECHNICAL_LABELS_VISIBLE=NO
VISIBLE_TAXONOMY_LEVELS<=1
CONSOLE_ERRORS=0
OVERFLOW_FAILURES=0
A11Y_BLOCKERS=0
```

## 19. Testes obrigatórios

### Fluxo intuitivo sem usar menus

1. abrir editor;
2. clicar no cabelo;
3. escolher um cabelo;
4. clicar nos olhos;
5. escolher olhos;
6. clicar na boca;
7. escolher boca;
8. clicar na roupa;
9. escolher roupa;
10. clicar nos pés;
11. escolher calçado;
12. salvar.

Esse fluxo deve ser concluído sem abrir sidebar taxonômica, Diagnóstico ou shell clássico.

### Descoberta por usuário novo

Faça um teste automatizado/roteiro humano verificando:

- primeira ação provável;
- tempo até editar cabelo;
- número de cliques;
- número de superfícies abertas;
- necessidade de ler instruções;
- possibilidade de desfazer;
- possibilidade de salvar.

Meta:

```text
editar cabelo em até 2 ações
editar olhos em até 2 ações
editar boca em até 2 ações
aplicar asset em 1 ação após abrir o contexto
```

### Regressão

- flag OFF;
- desktop;
- mobile;
- save;
- undo/redo;
- favoritos;
- cores;
- Visual atual;
- Conquistas/Ajuda;
- teclado;
- touch;
- resize/orientation;
- navegação autenticada quando disponível.

## 20. Evidências

Gerar:

1. abertura limpa;
2. hover/foco no cabelo;
3. catálogo de cabelo aberto por clique direto;
4. olhos;
5. boca;
6. roupa;
7. calçados;
8. cores contextuais;
9. busca;
10. filtro recolhido/aberto;
11. Visual atual simplificado;
12. menu Mais;
13. mobile sheet nos três detentes;
14. 320×568;
15. 390×844;
16. 844×390;
17. desktop;
18. navegação apenas por teclado.

As screenshots devem ser limpas. Versões de auditoria podem conter selo de SHA fora da área funcional.

## Escopo autorizado

Você está autorizado a melhorar:

- composição do Visual Composer;
- hotspots;
- navegação contextual;
- rail simplificada;
- header;
- catálogo;
- cards;
- busca/filtros;
- cores;
- Visual atual;
- menu Mais;
- responsividade;
- acessibilidade;
- testes e evidências.

Não está autorizado a:

- alterar main;
- fazer deploy ou rollout;
- ligar flag por padrão;
- reabrir motor/arte/backend;
- reintroduzir o shell antigo;
- adicionar features não relacionadas;
- preparar merge antes da revisão.

## Entrega

Retorne com:

```text
FINAL_SHA
FINAL_TREE
REMOTE_SHA
DIRECT_MANIPULATION_MAP
HAIR_CLICK
EYES_CLICK
MOUTH_CLICK
FACE_CLICK
CLOTHING_CLICK
FOOTWEAR_CLICK
CONTEXTUAL_CATALOG
VISIBLE_PRIMARY_ACTIONS
VISIBLE_CATEGORY_COUNT
FUNCTIONAL_PARITY_MATRIX
MOBILE_VIEWPORT_RESULTS
A11Y_RESULTS
PERFORMANCE_RESULTS
CONSOLE_ERRORS
OVERFLOW_FAILURES
BUILD
TESTS
WORKTREE_STATUS
MAIN_STATUS
DEPLOY
ROLLOUT
```

Estado inicial desta rodada:

```text
VISUAL COMPOSER DIRECTION = APROVADA
CURRENT USABILITY         = AINDA COMPLEXA
DIRECT MANIPULATION       = PARCIAL
TEXT DENSITY              = ALTA
INFORMATION ARCHITECTURE  = PRECISA SIMPLIFICAÇÃO
MERGE                     = NÃO AUTORIZADO
```

Trabalhe para reduzir esforço cognitivo, não para reduzir capacidade. Quero muitos recursos disponíveis, mas poucos elementos disputando atenção ao mesmo tempo.





# BRIEFING — AVATAR STUDIO 3D  
## Correção estrutural, visual e de experiência

Quero retomar agora a evolução da **parte 3D do Avatar Studio**.

A prioridade desta etapa não é criar outra arquitetura, outro renderer ou outra prova de conceito. Já existe uma base 3D funcional. O objetivo é **corrigir a experiência atual e elevar significativamente a apresentação visual do personagem**, trabalhando em cima do que já existe.

## 1. OBJETIVO DO 3D

Quero que o Avatar Studio 3D transmita a sensação de um **Character Creator de jogo premium**, e não de um visualizador técnico de modelos 3D.

A referência conceitual continua sendo:

**High-End Stylized Character Creator / personagem de game estilizado premium.**

Não estamos buscando realismo fotográfico.

Também não quero:

- personagem genérico de asset pack;
- aparência de jogo mobile barato;
- boneco low-poly evidente;
- visual infantil/cartunesco simples;
- interface cheia de controles técnicos dominando a experiência;
- sensação de “demo de engine 3D”.

O personagem precisa ser o protagonista.

---

# 2. PROBLEMA ATUAL

Hoje temos tecnologia e renderer, mas a qualidade percebida ainda fica limitada principalmente por três questões:

### A. Personagem/asset base

Os modelos atuais ainda carregam muito a aparência dos assets de origem.

Isso faz o usuário perceber:

> “estou combinando peças de um pacote 3D”

em vez de:

> “estou criando meu personagem dentro do universo visual do DShowDash”.

Esse é atualmente o maior limitador do **Gate B / qualidade 3D**.

### B. Hierarquia da interface

A experiência ainda apresenta conceitos técnicos demais para o usuário comum.

O usuário não deveria pensar inicialmente em:

- renderer;
- material;
- LOD;
- qualidade econômica;
- iluminação técnica;
- parâmetros de engine;
- debugging.

Esses controles podem continuar existindo, mas precisam ficar em **Advanced / Dev**.

### C. Enquadramento e apresentação

Quando o usuário escolhe algo para editar, aquilo precisa dominar visualmente o viewport.

Regra:

> **WHAT I AM EDITING = WHAT DOMINATES THE VIEWPORT AND CANNOT BE OCCLUDED.**

Se estou editando rosto, preciso enxergar rosto.

Se estou editando cabelo, preciso enxergar cabeça e cabelo.

Se estou editando roupa, preciso enxergar tronco/corpo.

Se estou editando calçado, preciso enxergar pernas e pés.

Não quero o usuário mexendo em uma categoria olhando para um personagem minúsculo de corpo inteiro.

---

# 3. NOVA HIERARQUIA DO 3D

Quero simplificar a navegação principal do 3D.

A hierarquia pública deve convergir para:

```text
PERSONAGEM
ROSTO
CABELO
ROUPA
ACESSÓRIOS
CENA
FOTO
```

Dentro dessas categorias ficam as subdivisões.

Exemplo:

```text
PERSONAGEM
→ Corpo
→ Altura/proporção
→ Pele
→ Estrutura

ROSTO
→ Formato
→ Olhos
→ Sobrancelhas
→ Nariz
→ Boca
→ Orelhas
→ Barba

CABELO
→ Corte
→ Comprimento
→ Cor

ROUPA
→ Parte superior
→ Parte inferior
→ Casacos
→ Calçados

ACESSÓRIOS
→ Óculos
→ Chapéus
→ Relógios
→ Colares
→ Outros

CENA
→ Fundo
→ Iluminação
→ Ambiente
→ Pose

FOTO
→ Enquadramento
→ Pose
→ Expressão
→ Captura
```

Não precisamos destruir a taxonomia interna atual.

Podemos manter IDs, estrutura Legacy e compatibilidade internamente.

Estou falando da **experiência apresentada ao usuário**.

---

# 4. FOCO DE CÂMERA POR CATEGORIA

Precisamos tornar o comportamento da câmera parte real do produto.

Ao entrar em uma categoria:

**Personagem**
→ corpo inteiro.

**Rosto**
→ close de cabeça/rosto.

**Cabelo**
→ cabeça + parte superior dos ombros.

**Roupa superior**
→ aproximadamente cabeça até quadril.

**Roupa inferior**
→ aproximadamente cintura até pés.

**Calçados**
→ pernas inferiores + pés em destaque.

**Acessórios faciais**
→ close no rosto.

**Cena**
→ abre o enquadramento.

**Foto**
→ câmera passa para composição fotográfica.

Isso deve acontecer automaticamente, com transição suave.

O usuário ainda pode girar/zoom, mas não deveria precisar corrigir manualmente a câmera toda vez.

---

# 5. PERSONAGEM 3D

Aqui está a parte mais importante.

Não quero apenas continuar adicionando acessórios sobre o personagem atual.

Antes de escalar catálogo, precisamos melhorar a **base visual do avatar**.

Precisamos avaliar e corrigir:

```text
silhueta
proporção corporal
cabeça
rosto
mãos
pés
postura
ombros
braços
pernas
pescoço
encaixe das roupas
cabelo
materiais
iluminação
```

A pergunta para cada ponto deve ser:

> Isso parece um personagem que poderia aparecer em um game premium estilizado?

Se não parecer, não deve ser considerado finalizado.

---

# 6. IDENTIDADE DO PERSONAGEM

Outro problema importante é que trocar peças não pode produzir apenas o “mesmo boneco vestido diferente”.

Precisamos conseguir gerar personagens que visualmente pareçam **pessoas diferentes**.

Isso envolve:

```text
estrutura da cabeça
largura da mandíbula
queixo
maçãs do rosto
olhos
sobrancelhas
nariz
boca
orelha
cabelo
proporção corporal
```

Quero olhar para vários avatares sem interface e perceber identidades distintas.

Não quero “Sibling Syndrome” no 3D também.

---

# 7. ROUPAS

A roupa não pode parecer simplesmente uma geometria encaixada sobre o boneco.

Precisamos prestar atenção em:

- silhueta da peça;
- espessura;
- gola;
- punhos;
- barra;
- volume;
- caimento;
- relação com ombro;
- relação com braço;
- relação com cintura;
- interseções;
- clipping.

Blazer precisa parecer blazer.

Moletom precisa parecer moletom.

Camiseta precisa parecer camiseta.

Calçado precisa parecer um objeto construído e não apenas uma deformação do pé.

---

# 8. CABELO

Cabelo é um dos componentes que mais define identidade.

Não quero que cortes diferentes pareçam apenas variações pequenas da mesma massa 3D.

Precisamos buscar:

- silhuetas realmente diferentes;
- volume;
- linha frontal;
- laterais;
- nuca;
- comprimento;
- divisão em massas/mechas principais;
- materiais melhores.

A diferença precisa ser percebida inclusive pela silhueta.

---

# 9. MÃOS E PÉS

Esses dois pontos continuam importantes porque denunciam rapidamente um avatar de baixa qualidade.

Mãos precisam ter:

- anatomia convincente;
- dedos legíveis;
- proporção correta;
- pose natural.

Pés/calçados precisam ter:

- sola;
- volume;
- biqueira;
- calcanhar;
- leitura clara da peça.

Não quero resolver isso escondendo permanentemente mãos ou pés.

---

# 10. MATERIAIS E ILUMINAÇÃO

O objetivo não é colocar mais efeitos.

Quero melhor leitura de:

```text
pele
tecido
couro
metal
plástico
cabelo
```

Cada material deve reagir de forma diferente à luz.

A iluminação padrão deve favorecer o personagem, semelhante à iluminação de um character creator de game:

- key light;
- preenchimento;
- rim/back light discreto;
- sombra suave;
- contraste suficiente para revelar volumes.

Sem deixar o avatar com aparência plástica.

---

# 11. CENA E APRESENTAÇÃO

O personagem não deve parecer flutuando em um vazio técnico.

Precisamos de uma apresentação neutra premium.

Pode existir algo como:

```text
fundo escuro/neutro
gradiente
plataforma discreta
sombra de contato
luz de estúdio
```

A cena não deve competir com o avatar.

O objetivo é valorizar sua leitura.

---

# 12. UX DOS CARDS / ASSETS

A lógica deve seguir a mesma disciplina que estamos estabelecendo no 2D.

O card mostra **o item**.

O stage mostra **o personagem usando o item**.

Exemplo:

```text
CARD DE ÓCULOS
→ óculos.

STAGE
→ avatar usando óculos.
```

```text
CARD DE TÊNIS
→ tênis.

STAGE
→ avatar usando tênis.
```

Não quero todos os cards mostrando miniaturas praticamente idênticas do personagem inteiro.

Isso dificulta comparar assets.

---

# 13. CONTROLES TÉCNICOS

Não remover.

Apenas tirar da experiência principal.

Criar:

```text
Advanced
ou
Developer
```

E colocar ali coisas como:

- qualidade de render;
- LOD;
- debug;
- wireframe;
- iluminação técnica;
- métricas;
- performance;
- parâmetros específicos do renderer.

O usuário comum não deve conviver com isso durante a criação.

---

# 14. NÃO CRIAR OUTRO RENDERER

Esse ponto é importante.

**Não quero um novo motor 3D paralelo.**

A princípio, devemos:

- preservar renderer existente;
- preservar contratos;
- preservar IDs;
- preservar compatibilidade;
- preservar salvamento;
- melhorar apresentação e assets sobre essa fundação.

Se existir um problema objetivo que realmente exija alteração do renderer, documente especificamente o problema antes de alterar arquitetura.

Mas não use “novo renderer” como caminho padrão para tentar melhorar a arte.

---

# 15. ASSETS EXTERNOS

Já reconhecemos anteriormente que parte importante do limite visual vem dos assets atuais.

Portanto, não quero que o agente fique tentando compensar indefinidamente asset fraco com código.

Se determinado resultado visual não puder atingir nosso padrão com o asset atual, classifique claramente:

```text
ENGINE = OK
ART/ASSET = BLOCKED
```

e identifique exatamente o asset que precisa ser substituído.

Podemos depois trabalhar com:

- modelos adquiridos;
- character packs premium;
- assets customizados;
- artista 3D;
- remodelagem de peças específicas.

Mas precisamos saber **qual é o gargalo real**.

---

# 16. GOLDEN VERTICAL SLICE 3D

Antes de reformar centenas de itens, quero uma amostra pequena realmente boa.

Criar uma **Golden Vertical Slice 3D** com aproximadamente:

```text
1 personagem masculino
1 personagem feminino

2–3 estruturas de rosto claramente distintas
3 cabelos realmente distintos

1 camiseta
1 moletom
1 blazer
1 calça
1 tênis

1 óculos/acessório

1 cena neutra premium
1 iluminação padrão premium
```

Esses itens precisam provar a linguagem visual antes de escalar catálogo.

**Não expandir centenas de assets antes dessa amostra convencer visualmente.**

---

# 17. CRITÉRIO DE QUALIDADE

O código funcionar não significa que o 3D está pronto.

Para cada componente importante:

```text
IMPLEMENTED
+
ACTIVE
+
VISIBLE
+
VISUALLY SUPERIOR
+
HUMAN APPROVED
```

Só então considero concluído.

---

# 18. GATE B

O estado correto continua sendo:

```text
GATE B = 3D PREMIUM VISUAL
```

E ele não pode receber `APPROVED` automaticamente pelo agente.

Os estados possíveis são:

```text
NOT_READY
CANDIDATE
REWORK
APPROVED
```

**Somente eu posso marcar APPROVED.**

Se a engenharia estiver pronta, mas o asset impedir qualidade suficiente:

```text
ENGINE READY
ART/ASSET BLOCKED
GATE B = REWORK
```

Não mascarar isso como conclusão.

---

# 19. ORDEM DE EXECUÇÃO

Quero que você trabalhe nesta ordem:

```text
1. organizar experiência/navegação 3D
2. corrigir foco de câmera por categoria
3. limpar apresentação e controles técnicos
4. melhorar personagem base
5. melhorar rosto/identidade
6. melhorar cabelo
7. melhorar corpo/mãos/pés
8. melhorar roupas/calçados
9. materiais
10. iluminação/cena
11. Golden Vertical Slice
12. avaliação visual
13. somente depois escalar catálogo
```

Não quero abrir 20 frentes simultâneas.

---

# 20. O QUE NÃO QUERO NESTA FASE

Não quero:

```text
novo renderer
nova taxonomia paralela
novo produto 3D paralelo
centenas de novos assets
nova rodada infinita de testes
boards sem evolução visual
documentação substituindo implementação
mudança em main
deploy sem autorização
rollout
```

Quero evolução **visível**.

---

# ENTREGA ESPERADA

Ao final da primeira rodada, quero conseguir abrir o 3D e imediatamente perceber:

> “Agora isso parece um Character Creator.”

E não:

> “é o mesmo visualizador 3D com alguns ajustes.”

Comece pela **Golden Vertical Slice e pela experiência principal**, resolvendo diretamente tudo aquilo que for engenharia.

Quando encontrar um bloqueio que seja genuinamente de arte/asset, não tente escondê-lo: identifique qual asset impede a evolução e o que precisamos substituir.

Não escale o catálogo antes de eu aprovar visualmente essa linguagem.

> **Não me entregue como “pronto” aquilo que existe apenas no código. A próxima entrega do 3D precisa ser perceptivelmente diferente quando eu abrir a aplicação.**