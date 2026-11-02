BRIEFING COMPLETO — ELEVAÇÃO VISUAL, UX E UI

Consultor de Anúncios com IA — Dshow Dash

1. Visão geral

O módulo atual já apresenta uma base funcional importante:

* campo de perguntas;
* sugestões iniciais;
* respostas fundamentadas;
* citações da metodologia;
* indicação de nível de confiança;
* separação entre mensagem do usuário e resposta da IA;
* área inferior fixa para novas consultas.

Entretanto, visualmente, a aplicação ainda se comporta como um chat técnico simples. O próximo passo deverá transformar essa experiência em um workspace de inteligência para Google Ads, com aparência premium, navegação contextual, respostas estruturadas e recursos visuais que ajudem o usuário a interpretar e agir sobre os dados.

O objetivo não deve ser apenas “deixar mais bonito”. A interface deverá:

* facilitar a leitura;
* reduzir o esforço cognitivo;
* destacar conclusões;
* organizar respostas extensas;
* permitir navegação entre fontes;
* transformar análises em ações;
* aproximar o módulo de uma ferramenta profissional de gestão;
* criar uma identidade própria dentro do Dshow Dash.

⸻

2. Diagnóstico da interface atual

2.1. Pontos positivos

A versão atual possui alguns acertos importantes:

* cabeçalho simples e compreensível;
* uso de identidade visual relacionada à IA;
* pergunta do usuário destacada;
* resposta em área separada;
* citações visíveis;
* exemplos de perguntas;
* campo de consulta acessível;
* conteúdo centralizado;
* boa legibilidade básica;
* ausência de excesso de elementos.

Esses pontos devem ser preservados.

2.2. Problemas identificados

A. Excesso de área vazia

Na tela inicial existe uma quantidade muito grande de espaço vazio abaixo do bloco principal.

Isso transmite sensação de:

* aplicação incompleta;
* ausência de funcionalidades;
* baixa densidade de informação;
* interface provisória;
* produto ainda em construção.

A área vazia deve ser utilizada de forma estratégica com histórico, sugestões, atalhos e insights.

B. Hierarquia visual fraca

Na resposta atual, praticamente todos os blocos possuem o mesmo nível visual.

Títulos, explicações, regras, exemplos e conclusões aparecem como texto contínuo, dificultando identificar rapidamente:

* conclusão principal;
* riscos;
* recomendações;
* próximos passos;
* fontes;
* nível de confiança.

C. Resposta excessivamente textual

O conteúdo é bom, porém visualmente se comporta como um documento Markdown simples.

Há pouca utilização de:

* cards;
* badges;
* ícones;
* blocos de destaque;
* listas visuais;
* accordions;
* tabelas;
* indicadores;
* diagramas;
* resumos.

D. Markdown aparente

Elementos como:

* #;
* ##;
* ###;
* ---;

aparecem visualmente como conteúdo bruto.

Isso reduz a qualidade percebida. O Markdown deve ser interpretado e transformado em componentes visuais reais.

E. Pouca distinção entre resposta, recomendação e regra

A interface não separa claramente:

* análise;
* conclusão;
* regra operacional;
* exemplo;
* recomendação;
* fonte;
* nível de confiança.

Esses conteúdos precisam ter estilos distintos.

F. Fontes pouco exploradas

As referências aparecem em badges como F13 · Q865, mas sem indicar imediatamente:

* qual documento;
* qual regra;
* qual trecho;
* por que é relevante;
* nível de autoridade da fonte.

G. Campo de pergunta pouco sofisticado

O campo inferior atualmente é apenas um input amplo com botão.

Ele pode evoluir para um composer de IA com:

* autosize;
* atalhos;
* anexos;
* contexto selecionado;
* sugestões;
* comando rápido;
* modo de análise;
* conta selecionada;
* período selecionado.

H. Ausência de ações após a resposta

Depois que a IA responde, o usuário não tem ações claras como:

* aprofundar análise;
* aplicar recomendação;
* gerar campanha;
* criar anúncio;
* salvar;
* exportar;
* comparar;
* copiar;
* gerar briefing;
* abrir fonte;
* enviar para aprovação.

I. Falta de contexto da conta

A tela não mostra claramente:

* qual conta está sendo analisada;
* qual período;
* se a resposta usa dados reais ou apenas metodologia;
* se existem dados carregados;
* quais filtros estão ativos.

Essa diferença é essencial para evitar confusão entre orientação teórica e análise real.

⸻

3. Objetivo da reformulação

Transformar o atual “Consultor de Anúncios” em um Google Ads AI Workspace, combinando:

* chat inteligente;
* consultoria metodológica;
* análise de dados;
* centro de recomendações;
* explicações fundamentadas;
* ferramentas operacionais;
* histórico de decisões;
* referências oficiais da metodologia Dshow.

A aplicação deve transmitir a sensação de um produto:

* premium;
* confiável;
* inteligente;
* organizado;
* visualmente sofisticado;
* orientado a decisões;
* integrado ao ecossistema Dshow Dash.

⸻

4. Nova arquitetura da tela

A interface deverá ser dividida em quatro regiões principais:

1. Header contextual;
2. Sidebar lateral;
3. Área central de conversa e análise;
4. Painel lateral de contexto e fontes.

⸻

5. Header contextual

O header atual é muito simples. Ele deverá evoluir para uma barra contextual mais completa.

5.1. Estrutura sugerida

Lado esquerdo

* ícone do módulo;
* nome “Consultor de Anúncios”;
* badge “IA”;
* status da metodologia;
* status da conexão com Google Ads;
* breadcrumb.

Exemplo:

Google Ads > Inteligência > Consultor de Anúncios

Área central

* seletor de conta;
* seletor de período;
* filtros ativos;
* modo de análise.

Lado direito

* nova conversa;
* histórico;
* favoritos;
* salvar;
* exportar;
* compartilhar;
* tela cheia;
* configurações;
* botão “Consultar IA”.

5.2. Status visuais

Adicionar indicadores:

* Metodologia atualizada;
* Dados conectados;
* Sincronizando;
* Sem dados;
* Resposta baseada em metodologia;
* Resposta baseada em dados reais;
* Resposta híbrida.

5.3. Distinção do tipo de resposta

O sistema deverá mostrar claramente:

* Metodologia: análise baseada exclusivamente nas regras internas;
* Dados da conta: análise baseada nos dados reais;
* Híbrido: combinação entre dados e metodologia;
* Simulação: resposta baseada em cenário hipotético.

⸻

6. Sidebar lateral

Criar uma sidebar colapsável para tornar o módulo mais completo.

6.1. Seções da sidebar

Conversas

* Nova conversa;
* Recentes;
* Favoritas;
* Compartilhadas;
* Arquivadas.

Modos de análise

* Diagnóstico geral;
* Campanhas;
* Palavras-chave;
* Termos de pesquisa;
* Anúncios;
* Landing pages;
* Orçamentos;
* Conversões;
* Funil comercial;
* Estratégia;
* Auditoria.

Ferramentas

* Gerador de anúncios;
* Gerador de palavras-chave;
* Gerador de negativas;
* Analisador de landing page;
* Simulador de orçamento;
* Comparador de campanhas;
* Criador de briefing;
* Relatório executivo.

Biblioteca

* Metodologia Dshow;
* Segmentos;
* Cases;
* Promessas permitidas;
* Diferenciais;
* Provas comerciais;
* Perguntas frequentes.

6.2. Comportamento

A sidebar deverá:

* ser recolhível;
* manter ícones quando recolhida;
* salvar estado do usuário;
* exibir tooltips;
* permitir busca;
* destacar a seção atual;
* permitir fixar conversas.

⸻

7. Tela inicial reformulada

A tela inicial não deve apresentar apenas quatro perguntas e uma grande área vazia.

Ela deverá funcionar como um painel de entrada inteligente.

7.1. Bloco principal

Manter o conceito atual, porém elevar visualmente:

* ícone da IA;
* título forte;
* descrição curta;
* campo de pergunta;
* botão de envio;
* exemplos contextuais.

7.2. Cards de início rápido

Criar uma grade de cards:

* Diagnosticar campanha;
* Analisar palavras-chave;
* Avaliar landing page;
* Encontrar desperdícios;
* Criar anúncios;
* Sugerir negativas;
* Comparar períodos;
* Gerar relatório.

Cada card deve conter:

* ícone;
* título;
* descrição curta;
* ação;
* cor temática;
* hover.

7.3. Histórico recente

Exibir as últimas conversas:

* título;
* data;
* conta;
* tipo de análise;
* status;
* resultado principal;
* opção de continuar.

7.4. Insights recentes

Quando existirem dados conectados, incluir:

* campanha com maior gasto;
* principal alerta;
* maior oportunidade;
* maior queda;
* melhor ROAS;
* termo com desperdício.

7.5. Sugestões dinâmicas

As perguntas sugeridas devem mudar conforme:

* conta;
* período;
* tela anterior;
* campanhas ativas;
* alertas detectados;
* histórico do usuário.

⸻

8. Campo de consulta

O campo inferior deve se tornar um composer profissional.

8.1. Recursos esperados

* crescimento automático de altura;
* envio por Enter;
* quebra de linha com Shift + Enter;
* botão de anexar;
* botão de escolher contexto;
* seletor de conta;
* seletor de campanha;
* seletor de período;
* comandos rápidos;
* botão de voz, caso futuramente desejado;
* indicação de carregamento;
* botão de cancelar geração.

8.2. Modos de resposta

Adicionar seletor:

* Rápida;
* Executiva;
* Completa;
* Técnica;
* Passo a passo;
* Somente recomendações.

8.3. Sugestões contextuais

Ao digitar, sugerir:

* campanhas;
* palavras-chave;
* páginas;
* perguntas anteriores;
* comandos;
* documentos da metodologia.

8.4. Comandos rápidos

Exemplos:

* /diagnosticar;
* /comparar;
* /resumir;
* /campanha;
* /landing;
* /anuncio;
* /negativas;
* /relatorio;
* /fontes.

⸻

9. Estrutura da resposta da IA

A resposta não deverá mais aparecer como um único bloco de texto.

Ela deverá ser transformada em um conjunto de componentes estruturados.

9.1. Cabeçalho da resposta

Exibir:

* título da análise;
* horário;
* tipo da resposta;
* conta analisada;
* período;
* nível de confiança;
* quantidade de fontes;
* quantidade de recomendações;
* status dos dados.

9.2. Resumo executivo

A primeira seção deve conter:

* conclusão principal;
* problema identificado;
* impacto;
* recomendação principal.

Exemplo visual:

Diagnóstico principal
A campanha apresenta tráfego relevante, mas baixa aderência entre palavra-chave, anúncio e landing page.

Impacto estimado
Risco de aumento de CPA e perda de conversões.

Ação recomendada
Separar grupos por intenção e criar páginas específicas.

9.3. Cards de síntese

Criar cards como:

* Problema;
* Causa;
* Impacto;
* Prioridade;
* Recomendação;
* Confiança.

9.4. Seções expansíveis

A resposta deverá ser organizada em accordions:

* Resumo;
* Diagnóstico;
* Evidências;
* Recomendações;
* Exemplos;
* Fontes;
* Próximos passos.

9.5. Destaques semânticos

Criar estilos específicos para:

* conclusão;
* alerta;
* regra;
* boa prática;
* risco;
* oportunidade;
* observação;
* exceção.

9.6. Regras operacionais

Trechos como “Regra operacional” devem aparecer em um callout destacado, não como parágrafo comum.

9.7. Lista de ações

Ao final da resposta, mostrar:

* ação;
* prioridade;
* esforço;
* impacto;
* responsável;
* status;
* botão de execução.

⸻

10. Exibição de fontes

A área de fontes deverá ser significativamente aprimorada.

10.1. Badge de citação

O badge deverá exibir algo mais compreensível:

Metodologia F13 · Pergunta 865

Ao passar o mouse:

* título da seção;
* tema;
* trecho utilizado;
* grau de autoridade;
* documento de origem.

10.2. Painel lateral de fontes

Ao clicar, abrir drawer lateral com:

* nome do documento;
* localização;
* trecho destacado;
* contexto anterior e posterior;
* data de atualização;
* categoria;
* tags;
* link para abrir o documento completo.

10.3. Fontes agrupadas

Separar:

* metodologia oficial;
* dados da conta;
* dados do CRM;
* dados do ERP;
* inferências da IA;
* benchmarks internos.

10.4. Grau de confiança

O nível de confiança deverá ser visualizado como:

* Alto;
* Médio;
* Baixo;
* Dados insuficientes.

Com explicação do motivo.

⸻

11. Painel lateral direito

Criar painel lateral contextual, recolhível.

11.1. Conteúdo do painel

Contexto atual

* conta;
* período;
* campanha;
* segmento;
* filtros;
* modo de resposta.

Resumo

* conclusão principal;
* prioridade;
* risco;
* oportunidade.

Fontes

* documentos;
* regras;
* dados;
* referências.

Ações sugeridas

* criar anúncio;
* revisar página;
* adicionar negativas;
* gerar briefing;
* salvar insight;
* abrir campanha.

Informações da conversa

* data;
* duração;
* tokens;
* quantidade de mensagens;
* versão da metodologia.

11.2. Comportamento

O painel deve:

* abrir ao clicar em uma fonte;
* acompanhar o contexto;
* ser redimensionável;
* ser recolhível;
* lembrar a preferência do usuário.

⸻

12. Navegação interna da resposta

Respostas extensas devem ter um índice lateral ou superior.

Exemplo:

* Resumo;
* Problemas;
* Causas;
* Recomendações;
* Exemplo;
* Fontes.

Ao clicar, a tela deve rolar até a seção.

Também deve existir um botão flutuante “Voltar ao topo”.

⸻

13. Componentes visuais ricos

13.1. Cards de diagnóstico

Cards para:

* criticidade;
* confiança;
* esforço;
* impacto;
* prioridade.

13.2. Matriz de priorização

Exibir recomendações em matriz:

* Alto impacto / Baixo esforço;
* Alto impacto / Alto esforço;
* Baixo impacto / Baixo esforço;
* Baixo impacto / Alto esforço.

Utilizar D3.js ou Apache ECharts.

13.3. Fluxos

Para explicar relações, usar diagramas:

Termo → Palavra-chave → Anúncio → Landing page → Lead → Venda

13.4. Comparadores

Quando a resposta comparar elementos:

* campanha A versus campanha B;
* página A versus página B;
* período atual versus anterior.

Exibir em cards ou tabelas comparativas.

13.5. Tabelas estruturadas

Respostas com muitos itens devem usar DataGrid ou tabela:

| Problema | Impacto | Prioridade | Recomendação |

13.6. Checklists

Transformar recomendações em checklists acionáveis.

⸻

14. Uso de Apache ECharts e D3.js

As duas bibliotecas deverão ser utilizadas no mesmo nível estratégico.

14.1. Apache ECharts

Aplicações sugeridas:

* desempenho;
* evolução;
* comparativos;
* funis;
* gauges;
* heatmaps;
* barras;
* áreas;
* forecast;
* séries temporais;
* radar;
* treemap.

14.2. D3.js

Aplicações sugeridas:

* mapas;
* relações;
* grafos;
* fluxos;
* matrizes;
* diagramas;
* árvore de decisão;
* visualização da metodologia;
* navegação entre fontes;
* clusters de temas;
* cadeia termo-anúncio-landing.

14.3. Regra de escolha

A escolha deverá considerar:

* clareza;
* performance;
* nível de interação;
* complexidade;
* adequação ao conteúdo;
* consistência visual.

Nenhuma das duas deverá ser tratada como secundária.

⸻

15. DataGrids

Sempre que houver conjuntos estruturados, utilizar DataGrid profissional.

15.1. Recursos

* busca;
* filtros;
* agrupamento;
* ordenação;
* colunas configuráveis;
* zebra;
* paginação;
* exportação;
* seleção;
* ações em lote;
* expansão de linha;
* formatação condicional;
* cabeçalho fixo.

15.2. Aplicações no consultor

* recomendações;
* termos;
* palavras-chave;
* campanhas;
* fontes;
* histórico;
* ações;
* documentos.

⸻

16. Histórico de conversas

Criar página ou drawer específico.

16.1. Informações

* título;
* resumo;
* data;
* conta;
* período;
* tipo de análise;
* favoritos;
* compartilhamento;
* quantidade de mensagens;
* resultado principal.

16.2. Recursos

* busca;
* filtros;
* ordenar;
* renomear;
* duplicar;
* arquivar;
* excluir;
* exportar;
* continuar conversa;
* agrupar por projeto.

⸻

17. Favoritos e coleções

Permitir salvar:

* respostas;
* trechos;
* regras;
* recomendações;
* prompts;
* gráficos;
* campanhas;
* fontes.

Criar coleções como:

* Igrejas;
* Varejo;
* Indoor;
* Landing pages;
* Campanhas institucionais;
* Palavras negativas;
* Melhores práticas.

⸻

18. Ações da resposta

Toda resposta deverá apresentar ações no rodapé.

18.1. Ações básicas

* copiar;
* salvar;
* favoritar;
* compartilhar;
* exportar;
* regenerar;
* avaliar;
* abrir fontes.

18.2. Ações inteligentes

* aprofundar;
* gerar plano de ação;
* criar briefing;
* transformar em campanha;
* criar anúncios;
* criar palavras-chave;
* criar negativas;
* gerar relatório;
* comparar com dados reais;
* enviar para aprovação.

⸻

19. Feedback sobre a resposta

Adicionar avaliação:

* útil;
* parcialmente útil;
* incorreta;
* incompleta.

Ao selecionar, permitir informar:

* faltou profundidade;
* resposta genérica;
* fonte inadequada;
* recomendação não aplicável;
* dados incorretos;
* formato ruim.

Esses feedbacks poderão ser usados para evolução futura da metodologia.

⸻

20. Estados da interface

20.1. Loading

Usar:

* skeleton;
* indicadores de etapas;
* mensagens contextuais.

Exemplo:

* Consultando metodologia;
* Identificando regras;
* Cruzando informações;
* Estruturando recomendações;
* Validando fontes.

20.2. Estado vazio

Evitar tela vazia. Exibir:

* sugestões;
* histórico;
* ferramentas;
* conteúdos recentes.

20.3. Erro

Mensagens claras:

* Não foi possível carregar os dados;
* A fonte não está disponível;
* A conexão expirou;
* Tente novamente;
* Continuar apenas com metodologia.

20.4. Sem dados

Diferenciar:

* nenhum dado;
* dado insuficiente;
* dado desatualizado;
* conta não conectada.

⸻

21. Microinterações

Implementar animações suaves em:

* hover dos cards;
* abertura de accordions;
* entrada das mensagens;
* carregamento da resposta;
* aparecimento de badges;
* transição de painel lateral;
* seleção de prompt;
* envio da mensagem;
* atualização de confiança;
* exibição de gráficos.

As animações devem ser rápidas e discretas.

Duração recomendada:

* hover: 120–180 ms;
* painéis: 200–280 ms;
* accordions: 180–240 ms;
* entrada de conteúdo: 180–300 ms.

⸻

22. Tipografia

22.1. Hierarquia sugerida

* Título principal: 24–28 px;
* Título de seção: 18–20 px;
* Subtítulo: 15–17 px;
* Corpo: 14–16 px;
* Legenda: 12–13 px;
* Badge: 11–12 px.

22.2. Peso

* títulos: 600;
* subtítulos: 500;
* corpo: 400;
* destaques: 600;
* labels: 500.

22.3. Largura do texto

Limitar a largura de parágrafos para evitar linhas muito longas.

A área de leitura deve ficar entre aproximadamente 720 e 900 px, dependendo da abertura dos painéis laterais.

⸻

23. Cores

A interface atual usa tons de roxo e azul muito claros. Essa base pode ser preservada, mas deve ganhar maior contraste.

23.1. Cores funcionais

* Roxo: inteligência artificial;
* Azul: dados e informações;
* Verde: oportunidade ou resultado positivo;
* Amarelo: atenção;
* Laranja: risco moderado;
* Vermelho: problema crítico;
* Cinza: elementos neutros.

23.2. Aplicação

Não utilizar cor apenas como decoração.

Cada cor deve ter significado funcional consistente.

23.3. Modo escuro

Criar uma versão completa, não apenas inversão de cores.

No modo escuro:

* fundo principal escuro;
* cards levemente mais claros;
* bordas discretas;
* textos com contraste adequado;
* gráficos com paleta adaptada;
* roxo da IA sem brilho excessivo.

⸻

24. Ícones

Adotar uma biblioteca consistente:

* Lucide;
* Phosphor Icons;
* Tabler Icons.

Evitar misturar bibliotecas sem necessidade.

Ícones sugeridos:

* Brain;
* Sparkles;
* Search;
* ChartNoAxesCombined;
* Target;
* Megaphone;
* FileSearch;
* Database;
* ShieldCheck;
* Lightbulb;
* AlertTriangle;
* CircleCheck;
* BookOpen;
* History;
* Bookmark;
* Share;
* Download.

⸻

25. Responsividade

Embora o uso principal seja desktop, a interface deve funcionar em:

* notebooks;
* monitores ultrawide;
* tablets;
* telas menores.

25.1. Comportamento

Em telas menores:

* sidebar recolhida;
* painel direito em drawer;
* cards em uma coluna;
* composer adaptado;
* ações secundárias em menu;
* tabelas com rolagem controlada.

⸻

26. Acessibilidade

Implementar:

* contraste WCAG;
* navegação por teclado;
* foco visível;
* ARIA;
* labels;
* descrição dos ícones;
* atalhos;
* redução de movimento;
* alternativa textual para gráficos;
* não depender somente de cores.

⸻

27. Atalhos de teclado

Sugestões:

* Cmd/Ctrl + K: busca global;
* Cmd/Ctrl + Enter: enviar;
* Cmd/Ctrl + N: nova conversa;
* Cmd/Ctrl + S: salvar;
* Cmd/Ctrl + B: abrir fontes;
* Esc: fechar drawer;
* /: focar campo;
* Shift + Enter: quebrar linha.

⸻

28. Command Palette

Criar uma paleta de comandos para acesso rápido:

* nova conversa;
* trocar conta;
* abrir histórico;
* criar relatório;
* analisar campanha;
* gerar palavras;
* abrir metodologia;
* alterar tema;
* exportar;
* navegar entre ferramentas.

⸻

29. Design system

Criar componentes reutilizáveis:

* AIHeader;
* ConversationSidebar;
* PromptComposer;
* QuickPromptCard;
* AIResponseCard;
* ExecutiveSummary;
* ConfidenceBadge;
* SourceBadge;
* SourceDrawer;
* RecommendationCard;
* ActionChecklist;
* AnalysisChart;
* InsightCallout;
* ConversationHistory;
* ContextPanel;
* EmptyState;
* LoadingPipeline;
* FeedbackBar.

Todos devem usar:

* tokens de cor;
* espaçamento padronizado;
* tipografia;
* radius;
* sombras;
* temas claro e escuro;
* estados de interação.

⸻

30. Melhorias específicas observadas nos prints

30.1. Cabeçalho

Situação atual

Muito simples, com grande área horizontal inutilizada.

Correção

Adicionar:

* breadcrumb;
* conta;
* período;
* status;
* ações;
* histórico;
* fontes;
* exportação.

30.2. Tela inicial

Situação atual

Grande espaço vazio após as sugestões.

Correção

Incluir:

* cards de ferramentas;
* histórico;
* insights;
* favoritos;
* metodologia recente.

30.3. Pergunta do usuário

Situação atual

Card visualmente pouco destacado e desalinhado da lógica tradicional de conversa.

Correção

Exibir:

* avatar;
* horário;
* opções;
* editar;
* copiar;
* reenviar;
* contexto usado.

30.4. Resposta

Situação atual

Bloco único, muito longo e pouco escaneável.

Correção

Dividir em:

* resumo executivo;
* diagnóstico;
* tópicos;
* regras;
* exemplos;
* recomendações;
* fontes;
* ações.

30.5. Fontes

Situação atual

Apenas códigos.

Correção

Adicionar tooltips, preview e drawer.

30.6. Input inferior

Situação atual

Visual simples, pouco funcional.

Correção

Criar composer com contexto, modos e ações.

⸻

31. Layout recomendado da resposta

Estrutura visual

Bloco 1 — Cabeçalho

* título;
* confiança;
* fontes;
* tipo de análise;
* conta;
* período.

Bloco 2 — Resumo executivo

* diagnóstico;
* impacto;
* recomendação.

Bloco 3 — Principais problemas

Cards ou lista organizada.

Bloco 4 — Evidências

Fontes e dados.

Bloco 5 — Recomendações

Ordenadas por prioridade.

Bloco 6 — Plano de ação

Checklist.

Bloco 7 — Fontes

Accordion ou drawer.

Bloco 8 — Ações

* aprofundar;
* aplicar;
* exportar;
* salvar.

⸻

32. Exemplo de transformação do conteúdo atual

O conteúdo hoje aparece como:

“Uma igreja não procura um painel de LED porque deseja adquirir um equipamento…”

A nova interface deverá apresentar:

Diagnóstico principal

A igreja não está comprando apenas um equipamento. Ela busca resolver um problema de comunicação e experiência visual.

Problemas identificados

* baixa legibilidade;
* dificuldade de acompanhar letras;
* limitação de projeção;
* necessidade de modernização.

Implicação para anúncios

A campanha deve comunicar o problema resolvido, e não apenas as especificações do painel.

Recomendação

Criar grupos específicos para:

* painel de LED para igreja;
* telão para culto;
* painel para letras de louvor;
* painel para transmissão religiosa.

Próximo passo

Gerar estrutura de campanha

⸻

33. Prioridades de implementação

Prioridade 1 — Correções imediatas

* interpretar Markdown;
* melhorar hierarquia;
* reduzir áreas vazias;
* melhorar composer;
* cards de resumo;
* fontes com tooltip;
* ações da resposta;
* responsividade;
* modo escuro.

Prioridade 2 — Estrutura avançada

* sidebar;
* painel lateral;
* histórico;
* favoritos;
* prompts dinâmicos;
* command palette;
* índice da resposta.

Prioridade 3 — Componentes ricos

* gráficos;
* diagramas;
* matrizes;
* DataGrids;
* comparadores;
* checklists;
* relatórios.

Prioridade 4 — Operação

* ações aplicáveis;
* aprovações;
* execução;
* histórico;
* integração com campanhas.

⸻

34. Critérios de aceite

A reformulação será considerada aprovada quando:

1. O Markdown não aparecer como texto bruto.
2. As respostas forem organizadas em seções visuais.
3. O resumo executivo estiver sempre destacado.
4. As fontes puderem ser abertas.
5. O tipo de resposta estiver explícito.
6. Conta e período estiverem visíveis.
7. A tela inicial não tiver grandes áreas vazias.
8. O campo de consulta tiver autosize.
9. Histórico e favoritos estiverem disponíveis.
10. As respostas tiverem ações contextuais.
11. O modo claro e escuro estiver funcionando.
12. A interface for responsiva.
13. Os gráficos usarem ECharts e D3.js.
14. As tabelas estruturadas usarem DataGrid.
15. O usuário conseguir navegar por respostas longas.
16. O nível de confiança for compreensível.
17. Fontes, dados e inferências forem distinguidos.
18. A experiência visual estiver integrada ao Dshow Dash.

⸻

35. Orientação final para o Claude Code

A implementação não deve se limitar a alterar cores, bordas ou espaçamentos.

O objetivo é transformar a tela atual em um workspace completo de inteligência de Google Ads, preservando o que já funciona, mas reconstruindo:

* hierarquia;
* navegação;
* componentes;
* experiência de leitura;
* contexto;
* visualização;
* interatividade;
* ações;
* fontes;
* histórico;
* personalização.

A aplicação deverá parecer um produto corporativo premium e não apenas uma página de chat.

A prioridade deverá ser combinar:

* clareza;
* profundidade;
* sofisticação visual;
* baixa carga cognitiva;
* velocidade;
* confiança;
* capacidade de ação.

O resultado final deverá permitir que o usuário não apenas leia uma resposta, mas compreenda rapidamente o diagnóstico, consulte as evidências, visualize o impacto e transforme a recomendação em uma ação concreta.