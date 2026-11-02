BRIEFING COMPLETO — MÓDULO META ADS NO DSHOW DASH

1. Visão geral do projeto

Desenvolver um novo módulo completo de gestão do Meta Ads dentro do Dshow Dash.

O módulo deverá centralizar, em uma única interface, todas as informações relacionadas às campanhas de mídia paga executadas nas plataformas da Meta, principalmente:

* Facebook;
* Instagram;
* Messenger;
* Audience Network;
* demais posicionamentos disponibilizados pela Meta.

O módulo deverá ser semelhante em estrutura ao painel de Ads já existente ou planejado no Dshow Dash, mantendo consistência visual, lógica de navegação, padrões de filtros, componentes e comportamento da interface.

Ao mesmo tempo, deverá respeitar as características específicas do ecossistema Meta Ads, incluindo:

* campanhas;
* conjuntos de anúncios;
* anúncios;
* criativos;
* públicos;
* posicionamentos;
* contas de anúncio;
* páginas;
* perfis do Instagram;
* pixels;
* eventos;
* conversões;
* leads;
* catálogo;
* remarketing;
* frequência;
* alcance;
* impressões;
* engajamento;
* atribuição;
* custos;
* qualidade dos anúncios;
* diagnóstico e entrega.

Nesta primeira etapa, o módulo será implementado com dados mockados.

Posteriormente, deverá ser conectado à API oficial da Meta.

A arquitetura deverá permitir a troca da camada de mocks pela integração real sem necessidade de reconstruir o front-end ou alterar profundamente a estrutura dos componentes.

⸻

2. Objetivos principais do módulo

O módulo Meta Ads deverá permitir:

* acompanhar o desempenho geral das campanhas;
* monitorar investimentos;
* acompanhar alcance e impressões;
* analisar cliques e conversões;
* acompanhar geração de leads;
* analisar vendas atribuídas;
* avaliar desempenho de criativos;
* comparar campanhas, conjuntos e anúncios;
* analisar públicos;
* identificar fadiga de criativo;
* acompanhar frequência;
* avaliar posicionamentos;
* acompanhar custo por resultado;
* monitorar campanhas com baixo desempenho;
* identificar desperdício de orçamento;
* identificar oportunidades de otimização;
* acompanhar eventos de conversão;
* acompanhar pixels e fontes de dados;
* futuramente permitir ações operacionais;
* reduzir a necessidade de acesso constante ao Gerenciador de Anúncios da Meta.

O módulo deverá funcionar como:

1. painel executivo;
2. painel de performance;
3. ferramenta de análise;
4. central operacional;
5. gerenciador de campanhas;
6. gerenciador de criativos;
7. painel de públicos;
8. painel de conversões;
9. central de alertas;
10. central de sincronização.

⸻

3. Posicionamento na sidebar

Criar um novo botão chamado:

Meta Ads

Esse botão deverá ser posicionado imediatamente abaixo do botão Ads já existente na sidebar.

A ordem deverá ser:

1. Ads
2. Meta Ads

Não posicionar o Meta Ads em uma seção distante ou desconectada do módulo Ads.

Os dois módulos deverão ficar visualmente agrupados, demonstrando que fazem parte da área de mídia paga e aquisição.

3.1. Estrutura sugerida na sidebar

Caso a sidebar possua agrupamentos, utilizar uma seção como:

Marketing e Aquisição

Dentro dela:

* Ads;
* Meta Ads;
* futuras integrações de mídia;
* campanhas;
* analytics de marketing.

3.2. Características do botão

O botão Meta Ads deverá conter:

* ícone relacionado à Meta;
* label “Meta Ads”;
* tooltip quando a sidebar estiver colapsada;
* estado hover;
* estado ativo;
* estado de foco;
* badge opcional;
* suporte à sidebar expandida e recolhida;
* acessibilidade por teclado;
* indicação de notificações;
* feedback visual ao clicar.

O ícone deverá manter o mesmo padrão de:

* tamanho;
* stroke;
* alinhamento;
* espaçamento;
* comportamento;
* área de clique;

utilizado pelos demais botões do Dshow Dash.

⸻

4. Acesso pelo header

Além do botão na sidebar, o módulo poderá ser acessado por um ícone específico do Meta Ads no header, caso esse ícone já exista ou seja aprovado para implementação.

Ao clicar no ícone:

* abrir o módulo dentro da área principal;
* não abrir nova aba;
* não redirecionar para o Gerenciador de Anúncios externo;
* preservar o shell do Dshow Dash;
* destacar o botão Meta Ads na sidebar;
* atualizar o breadcrumb;
* abrir a última seção acessada;
* manter os filtros utilizados na sessão.

4.1. Resumo no ícone

O ícone poderá apresentar um tooltip com:

Meta Ads

* R$ 4.820,00 investidos no período;
* 286 leads;
* CPL médio de R$ 16,85;
* 3 campanhas exigem atenção;
* última atualização: há 9 minutos.

4.2. Estados do ícone

Prever os estados:

* conectado;
* sincronizando;
* atenção;
* erro;
* dados desatualizados;
* modo mock;
* conta não configurada;
* token próximo de expirar.

Durante a fase inicial, mostrar uma indicação discreta:

Dados simulados

ou:

Ambiente de demonstração

⸻

5. Estrutura interna de navegação

O módulo deverá possuir uma navegação própria.

Recomenda-se uma sub-sidebar interna colapsável, semelhante à utilizada ou planejada no painel Ads.

5.1. Seções principais

Criar as seguintes áreas:

1. Visão Geral
2. Central Operacional
3. Campanhas
4. Conjuntos de Anúncios
5. Anúncios
6. Criativos
7. Públicos
8. Posicionamentos
9. Funil e Conversões
10. Leads
11. Pixel e Eventos
12. Catálogos
13. Remarketing
14. Páginas e Instagram
15. Orçamentos
16. Performance
17. Atribuição
18. Qualidade e Diagnósticos
19. Relatórios
20. Alertas
21. Automações
22. Sincronização
23. Configurações

A arquitetura deverá ser modular.

Se alguma área ainda não possuir dados disponíveis no mock ou integração real, utilizar:

* estado “em preparação”;
* conteúdo simulado;
* feature flag;
* tela explicativa;
* acesso restrito.

Não deixar telas vazias sem orientação.

⸻

6. Header interno do módulo

Criar um header interno consistente com o módulo Ads.

6.1. Elementos obrigatórios

O header deverá conter:

* título “Meta Ads”;
* subtítulo;
* seletor de conta;
* seletor de período;
* comparação de período;
* filtro por campanha;
* filtro por objetivo;
* status da integração;
* última atualização;
* botão atualizar;
* botão exportar;
* botão filtros;
* botão configurações;
* indicador de dados simulados.

Exemplo de subtítulo:

“Gestão, análise e otimização das campanhas de mídia paga da Meta.”

6.2. Seletor de conta

Preparar a interface para suportar:

* uma conta;
* várias contas;
* contas de diferentes empresas;
* contas próprias;
* contas de parceiros;
* visão consolidada.

O seletor poderá apresentar:

* nome da conta;
* ID;
* moeda;
* fuso horário;
* status;
* empresa vinculada;
* página associada;
* perfil do Instagram;
* última sincronização.

6.3. Períodos

Disponibilizar:

* hoje;
* ontem;
* últimos 7 dias;
* últimos 14 dias;
* últimos 30 dias;
* mês atual;
* mês anterior;
* trimestre atual;
* ano atual;
* últimos 12 meses;
* período personalizado.

6.4. Comparações

Permitir comparação com:

* período anterior;
* mesmo período do mês anterior;
* mesmo período do ano anterior;
* meta;
* orçamento planejado;
* outra campanha;
* outro conjunto;
* outra conta;
* média móvel.

⸻

7. Dashboard — Visão Geral

A tela inicial deverá apresentar uma visão executiva e analítica da operação.

7.1. Indicadores principais

Criar cards com:

* investimento;
* alcance;
* impressões;
* frequência;
* cliques;
* cliques no link;
* CTR;
* CPC;
* CPM;
* leads;
* custo por lead;
* conversões;
* custo por conversão;
* compras;
* receita atribuída;
* ROAS;
* custo por mil pessoas alcançadas;
* taxa de conversão;
* campanhas ativas;
* campanhas pausadas;
* anúncios reprovados;
* criativos com fadiga;
* orçamento restante.

Cada card deverá conter:

* valor principal;
* comparação percentual;
* comparação absoluta;
* sparkline;
* ícone;
* tendência;
* tooltip;
* período;
* meta;
* possibilidade de drill-down;
* estado positivo, negativo ou neutro.

A interpretação de cores deverá respeitar o contexto.

Exemplos:

* aumento do CTR: positivo;
* aumento do CPC: geralmente negativo;
* aumento da frequência: pode ser atenção;
* redução do investimento com aumento de conversão: positivo;
* aumento de leads com queda de qualidade: atenção.

⸻

8. Gráfico de evolução de performance

Criar um gráfico temporal avançado usando Apache ECharts.

Permitir selecionar e comparar:

* investimento;
* alcance;
* impressões;
* frequência;
* cliques;
* CTR;
* CPC;
* CPM;
* leads;
* conversões;
* CPL;
* CPA;
* receita;
* ROAS.

8.1. Recursos

* múltiplas séries;
* eixo duplo;
* seleção de métricas;
* comparação de período;
* zoom;
* brush temporal;
* tooltip compartilhado;
* média móvel;
* identificação de anomalias;
* marcação de alterações;
* marcação de campanhas iniciadas;
* marcação de campanhas pausadas;
* marcação de alteração de orçamento;
* marcação de troca de criativo.

⸻

9. Funil de conversão

Criar um funil interativo com D3 ou Apache ECharts.

Etapas possíveis:

* impressões;
* alcance;
* cliques;
* visitas à página;
* visualizações de conteúdo;
* leads;
* oportunidades;
* vendas;
* receita.

Cada etapa deverá apresentar:

* volume;
* percentual;
* perda;
* conversão;
* custo;
* comparação;
* tendência;
* drill-down.

Ao clicar em uma etapa, os demais componentes deverão ser filtrados.

⸻

10. Distribuição de resultados

Criar análises por:

* campanha;
* conjunto;
* anúncio;
* criativo;
* objetivo;
* público;
* posicionamento;
* dispositivo;
* plataforma;
* idade;
* gênero;
* região;
* dia;
* horário;
* página;
* perfil do Instagram.

Utilizar visualizações como:

* barras horizontais;
* treemap;
* sunburst;
* heatmap;
* scatter plot;
* bubble chart;
* small multiples;
* donut;
* Sankey.

Evitar uso excessivo de gráficos de pizza.

⸻

11. Mapa geográfico

Criar um mapa interativo usando D3.

Exibir:

* investimento por estado;
* alcance por região;
* leads por localização;
* conversões;
* CPL;
* CPA;
* receita;
* ROAS;
* frequência;
* CTR.

Recursos:

* zoom;
* tooltip;
* escala de intensidade;
* seleção de métrica;
* ranking lateral;
* drill-down;
* comparação;
* filtro cruzado.

⸻

12. Central Operacional

Criar uma área chamada:

Central Operacional

Essa área deverá consolidar todas as situações que exigem ação.

12.1. Filas operacionais

Exibir:

* campanhas sem entrega;
* campanhas com orçamento esgotado;
* campanhas com queda brusca;
* conjuntos limitados;
* anúncios reprovados;
* criativos com fadiga;
* frequência elevada;
* CPL acima da meta;
* CPA acima da meta;
* queda de ROAS;
* pixel sem eventos;
* eventos com falha;
* leads sem integração;
* campanhas próximas do fim;
* tokens com problema;
* falhas de sincronização.

12.2. Recursos

Permitir:

* ordenar por prioridade;
* filtrar por conta;
* filtrar por campanha;
* filtrar por tipo;
* atribuir responsável;
* adicionar observação;
* marcar como tratado;
* abrir detalhe;
* executar ações em lote;
* salvar visualização;
* criar alerta.

Cada ocorrência deverá mostrar:

* prioridade;
* problema;
* impacto;
* recomendação;
* data;
* responsável;
* prazo;
* status;
* ação sugerida.

⸻

13. Gestão de campanhas

Criar uma área completa para consulta e futura gestão das campanhas.

13.1. Data grid de campanhas

Utilizar AG Grid ou alternativa equivalente.

Colunas sugeridas:

* status;
* campanha;
* ID;
* objetivo;
* tipo de compra;
* orçamento;
* orçamento utilizado;
* investimento;
* alcance;
* impressões;
* frequência;
* cliques;
* CTR;
* CPC;
* CPM;
* leads;
* CPL;
* conversões;
* CPA;
* receita;
* ROAS;
* início;
* término;
* última alteração;
* conta;
* responsável;
* diagnóstico.

13.2. Recursos obrigatórios

* virtualização;
* filtros;
* ordenação múltipla;
* agrupamento;
* colunas fixadas;
* redimensionamento;
* reordenação;
* seleção múltipla;
* exportação;
* linhas expansíveis;
* preferências;
* zebra rows;
* totais;
* ações em lote;
* menus contextuais;
* atualização server-side;
* paginação;
* busca global.

13.3. Ações futuras

Preparar a interface para:

* criar campanha;
* duplicar;
* pausar;
* ativar;
* arquivar;
* alterar orçamento;
* alterar período;
* editar nome;
* aplicar regras;
* mover estrutura;
* comparar;
* exportar;
* visualizar histórico.

Na fase mock, as ações deverão ser simuladas e claramente identificadas.

⸻

14. Conjuntos de anúncios

Criar uma tela específica para conjuntos de anúncios.

14.1. Informações

* conjunto;
* campanha;
* status;
* orçamento;
* estratégia de lance;
* público;
* localização;
* idade;
* gênero;
* posicionamentos;
* pixel;
* evento;
* investimento;
* alcance;
* impressões;
* frequência;
* resultados;
* custo por resultado;
* receita;
* ROAS.

14.2. Análises

* comparação de públicos;
* comparação de posicionamentos;
* distribuição de orçamento;
* saturação;
* sobreposição;
* frequência;
* desempenho por região;
* custo por resultado;
* qualidade do tráfego.

⸻

15. Gestão de anúncios

Criar uma área dedicada aos anúncios.

15.1. Data grid

Colunas:

* miniatura;
* status;
* anúncio;
* conjunto;
* campanha;
* formato;
* página;
* Instagram;
* investimento;
* alcance;
* impressões;
* frequência;
* cliques;
* CTR;
* CPC;
* leads;
* CPL;
* conversões;
* receita;
* ROAS;
* qualidade;
* relevância;
* diagnóstico;
* última alteração.

15.2. Recursos futuros

* criar anúncio;
* duplicar;
* editar;
* pausar;
* ativar;
* trocar criativo;
* trocar texto;
* editar chamada;
* editar URL;
* editar rastreamento;
* visualizar prévia;
* comparar versões;
* consultar reprovação;
* enviar para revisão.

⸻

16. Gestão de criativos

Criar uma biblioteca visual de criativos.

16.1. Formatos

Suportar:

* imagem;
* vídeo;
* carrossel;
* coleção;
* stories;
* reels;
* anúncios dinâmicos;
* criativos de catálogo.

16.2. Visualização

Permitir:

* cards;
* galeria;
* data grid;
* comparação lado a lado;
* preview por posicionamento;
* filtros por formato;
* filtros por campanha;
* filtros por performance.

16.3. Indicadores por criativo

* investimento;
* alcance;
* impressões;
* frequência;
* retenção;
* cliques;
* CTR;
* leads;
* conversões;
* CPL;
* CPA;
* receita;
* ROAS;
* data de início;
* tempo ativo;
* fadiga.

16.4. Score de criativo

Criar score considerando:

* CTR;
* custo por resultado;
* frequência;
* retenção de vídeo;
* conversão;
* tempo ativo;
* qualidade;
* feedback;
* tendência de queda.

O score deverá explicar os fatores.

⸻

17. Análise de vídeos

Para criativos em vídeo, criar visualizações específicas.

Indicadores:

* reproduções;
* visualizações de 3 segundos;
* 25%;
* 50%;
* 75%;
* 95%;
* 100%;
* tempo médio assistido;
* taxa de retenção;
* custo por visualização;
* conversões após visualização.

Criar gráfico de retenção usando D3 ou Apache ECharts.

Permitir identificar:

* pontos de abandono;
* trechos de maior retenção;
* queda nos primeiros segundos;
* comparação entre vídeos.

⸻

18. Públicos

Criar uma área para análise e futura gestão de públicos.

18.1. Tipos

* públicos salvos;
* públicos personalizados;
* públicos semelhantes;
* visitantes do site;
* leads;
* clientes;
* engajamento;
* vídeo;
* Instagram;
* Facebook;
* remarketing.

18.2. Indicadores

* tamanho;
* alcance;
* frequência;
* investimento;
* leads;
* conversões;
* CPL;
* CPA;
* receita;
* ROAS;
* saturação;
* sobreposição.

18.3. Visualizações D3

Criar:

* diagrama de sobreposição;
* mapa de relacionamentos;
* bolhas por tamanho e desempenho;
* matriz de público versus conversão;
* Sankey de público até resultado.

⸻

19. Posicionamentos

Criar análises para:

* Feed do Facebook;
* Feed do Instagram;
* Stories;
* Reels;
* Messenger;
* Audience Network;
* demais posicionamentos disponíveis.

19.1. Indicadores

* investimento;
* alcance;
* impressões;
* frequência;
* cliques;
* CTR;
* CPC;
* leads;
* CPL;
* conversões;
* CPA;
* receita;
* ROAS.

19.2. Visualizações

* ranking;
* barras;
* heatmap;
* matriz custo versus volume;
* small multiples;
* comparação de criativos por posicionamento.

⸻

20. Leads

Criar uma central completa para os leads originados pelo Meta Ads.

20.1. Indicadores

* leads;
* custo por lead;
* leads válidos;
* leads duplicados;
* leads sem contato;
* leads convertidos;
* taxa de qualificação;
* taxa de conversão;
* receita gerada;
* tempo de resposta.

20.2. Data grid de leads

Colunas:

* nome;
* data;
* formulário;
* campanha;
* conjunto;
* anúncio;
* origem;
* telefone;
* e-mail;
* produto;
* status;
* responsável;
* CRM;
* qualificação;
* oportunidade;
* venda;
* receita;
* última interação.

Aplicar mascaramento de dados conforme permissão.

20.3. Integração futura

Preparar relacionamento com:

* Pipedrive;
* ERP;
* clientes;
* negócios;
* vendedores;
* propostas;
* vendas;
* produtos;
* origem do lead.

⸻

21. Pixel e eventos

Criar uma área técnica para acompanhamento das fontes de dados.

21.1. Indicadores

* pixels ativos;
* eventos recebidos;
* eventos com erro;
* última atividade;
* cobertura;
* eventos deduplicados;
* correspondência;
* eventos por origem;
* conversões.

21.2. Eventos

Exibir, conforme disponibilidade:

* PageView;
* ViewContent;
* Lead;
* Contact;
* AddToCart;
* InitiateCheckout;
* Purchase;
* eventos personalizados.

21.3. Diagnóstico

Mostrar:

* evento sem atividade;
* queda de volume;
* parâmetros ausentes;
* duplicidade;
* erro de correspondência;
* inconsistência;
* diferença entre navegador e servidor;
* atraso no envio.

Criar timeline de eventos e gráfico de volume.

⸻

22. Funil e conversões

Criar uma tela dedicada ao funil de aquisição.

22.1. Etapas

* impressão;
* clique;
* visita;
* interação;
* lead;
* oportunidade;
* proposta;
* venda;
* receita.

22.2. Recursos

* comparação entre campanhas;
* comparação entre públicos;
* comparação entre criativos;
* taxa por etapa;
* custo por etapa;
* tempo médio;
* perdas;
* gargalos;
* drill-down.

Utilizar D3 para Sankey e funis customizados.

⸻

23. Catálogos

Preparar uma área para campanhas que utilizem catálogo.

23.1. Informações

* catálogo;
* produtos;
* itens ativos;
* itens rejeitados;
* disponibilidade;
* preço;
* imagem;
* categoria;
* feed;
* última atualização;
* erros.

23.2. Recursos

* data grid de produtos;
* filtro de erros;
* comparação com ERP;
* divergência de preço;
* divergência de estoque;
* itens sem imagem;
* itens rejeitados;
* histórico de sincronização.

⸻

24. Remarketing

Criar uma visão específica para remarketing.

24.1. Segmentos

* visitantes;
* engajamento;
* visualizadores de vídeo;
* leads;
* carrinho;
* clientes;
* compradores;
* inativos.

24.2. Análises

* frequência;
* alcance;
* saturação;
* conversão;
* custo;
* janela;
* ROAS;
* tempo até conversão;
* sobreposição.

⸻

25. Orçamentos

Criar uma área dedicada à gestão de orçamento.

25.1. Indicadores

* orçamento diário;
* orçamento total;
* investimento realizado;
* saldo;
* ritmo de gasto;
* projeção;
* campanhas acima do ritmo;
* campanhas abaixo do ritmo;
* orçamento desperdiçado;
* custo por resultado.

25.2. Visualizações

* orçamento versus realizado;
* projeção até o fim;
* distribuição por campanha;
* distribuição por objetivo;
* distribuição por público;
* distribuição por criativo;
* evolução diária;
* waterfall de orçamento.

25.3. Simulador

Criar simulador com:

* orçamento;
* CPL esperado;
* CPA esperado;
* leads estimados;
* conversões estimadas;
* receita estimada;
* ROAS estimado.

Identificar claramente que se trata de projeção.

⸻

26. Performance

Criar uma área analítica avançada.

26.1. Dimensões

* campanha;
* conjunto;
* anúncio;
* criativo;
* público;
* posicionamento;
* idade;
* gênero;
* região;
* dispositivo;
* plataforma;
* dia;
* horário.

26.2. Visualizações

* curva de tendência;
* matriz custo versus resultado;
* scatter plot;
* Pareto;
* heatmap;
* radar;
* small multiples;
* árvore de decomposição;
* ranking dinâmico.

⸻

27. Atribuição

Criar uma área para análise de atribuição.

27.1. Informações

* janela de atribuição;
* conversões por clique;
* conversões por visualização;
* tempo até conversão;
* receita atribuída;
* diferenças entre fontes;
* comparação com CRM;
* comparação com ERP;
* divergências.

27.2. Avisos

A interface deverá explicar que resultados podem variar conforme:

* janela;
* modelo;
* fonte;
* rastreamento;
* privacidade;
* deduplicação;
* atraso de processamento.

Não apresentar números atribuídos como verdade absoluta sem contexto.

⸻

28. Qualidade e diagnósticos

Criar uma central de qualidade.

28.1. Alertas

* anúncio reprovado;
* aprendizado limitado;
* sobreposição de público;
* criativo fatigado;
* frequência elevada;
* baixa entrega;
* queda de CTR;
* aumento de CPC;
* aumento de CPL;
* queda de ROAS;
* pixel sem eventos;
* evento com erro;
* orçamento limitado;
* campanha sem conversão.

28.2. Recomendação

Cada problema deverá apresentar:

* diagnóstico;
* impacto;
* possível causa;
* recomendação;
* prioridade;
* dados de suporte;
* ação sugerida.

⸻

29. Relatórios

Criar uma central de relatórios.

29.1. Relatórios sugeridos

* campanhas;
* conjuntos;
* anúncios;
* criativos;
* públicos;
* posicionamentos;
* leads;
* conversões;
* pixel;
* orçamento;
* performance;
* atribuição;
* regiões;
* horários;
* vídeos;
* funil;
* rentabilidade.

29.2. Recursos

* filtros avançados;
* colunas personalizadas;
* agrupamento;
* exportação CSV;
* exportação XLSX;
* exportação PDF;
* impressão;
* favoritos;
* visualizações salvas;
* compartilhamento;
* templates;
* agendamento futuro.

⸻

30. Sistema de alertas

Criar alertas configuráveis.

30.1. Tipos

* investimento acima do limite;
* orçamento próximo do fim;
* CPL acima da meta;
* CPA acima da meta;
* ROAS abaixo da meta;
* frequência elevada;
* queda de CTR;
* aumento de CPC;
* campanha sem resultado;
* anúncio reprovado;
* pixel sem eventos;
* lead sem integração;
* falha de sincronização;
* token expirado;
* dados desatualizados.

30.2. Configuração

Permitir:

* ativar;
* desativar;
* definir limite;
* escolher campanha;
* escolher conta;
* escolher período;
* definir prioridade;
* definir responsável;
* configurar cooldown;
* evitar duplicidade;
* registrar resolução.

⸻

31. Automações

Preparar uma área para futuras automações.

Exemplos:

* pausar campanha com desempenho crítico;
* aumentar orçamento;
* reduzir orçamento;
* alertar sobre fadiga;
* distribuir leads;
* criar tarefa;
* atualizar público;
* gerar relatório;
* comparar metas;
* sinalizar anomalias.

Toda automação deverá possuir:

* nome;
* descrição;
* gatilho;
* condição;
* ação;
* status;
* logs;
* última execução;
* próxima execução;
* usuário criador;
* modo teste;
* histórico.

Ações que alterem campanhas deverão exigir permissão e auditoria.

⸻

32. Filtros globais

Criar filtros globais para:

* conta;
* período;
* campanha;
* conjunto;
* anúncio;
* objetivo;
* criativo;
* público;
* posicionamento;
* região;
* idade;
* gênero;
* dispositivo;
* plataforma;
* evento;
* resultado;
* status;
* responsável.

32.1. Recursos

* chips;
* contador;
* limpar filtros;
* salvar visualização;
* filtros favoritos;
* presets;
* persistência por usuário;
* comparação;
* compartilhamento.

⸻

33. Drill-down

Todos os gráficos e indicadores deverão permitir aprofundamento.

Exemplos:

* clicar em leads abre os leads relacionados;
* clicar em campanha abre os conjuntos;
* clicar em conjunto abre os anúncios;
* clicar em criativo abre sua performance;
* clicar em região abre resultados locais;
* clicar em CPL abre campanhas acima da média;
* clicar em pixel abre eventos;
* clicar em orçamento abre projeções.

O contexto e os filtros deverão ser preservados.

⸻

34. Data grids robustos

Todas as áreas com volume relevante de dados deverão utilizar data grids robustos.

Biblioteca principal recomendada:

* AG Grid.

Alternativas:

* TanStack Table com TanStack Virtual;
* MUI X Data Grid Pro.

34.1. Recursos mínimos

* virtualização;
* paginação;
* filtros por coluna;
* busca global;
* ordenação múltipla;
* agrupamento;
* agregações;
* pinagem;
* redimensionamento;
* reordenação;
* seleção;
* ações em lote;
* linhas expansíveis;
* exportação;
* preferências;
* zebra rows;
* formatação condicional;
* atalhos;
* densidade;
* totalizadores;
* menus contextuais;
* processamento server-side.

34.2. Padrão visual

Aplicar:

* headers alinhados;
* alturas consistentes;
* tipografia legível;
* linhas alternadas;
* hover;
* seleção clara;
* bordas discretas;
* valores numéricos à direita;
* nomes à esquerda;
* status com badges;
* tooltips;
* truncamento inteligente;
* colunas fixadas.

34.3. Formatação monetária

Utilizar padrão brasileiro:

* R$ 1.234,56;
* duas casas decimais;
* separador de milhares;
* alinhamento à direita;
* valores negativos destacados;
* totalizadores consistentes.

⸻

35. Bibliotecas de gráficos

D3.js e Apache ECharts deverão ser considerados bibliotecas principais e de mesma importância.

35.1. Apache ECharts

Utilizar para:

* séries temporais;
* barras;
* linhas;
* áreas;
* heatmaps;
* funis;
* scatter plots;
* gráficos combinados;
* gauges;
* waterfalls;
* dashboards executivos;
* zoom;
* tooltips;
* comparação.

35.2. D3.js

Utilizar para:

* mapas;
* Sankey;
* diagramas de públicos;
* visualizações relacionais;
* matrizes;
* retenção de vídeo;
* decomposição;
* visualizações customizadas;
* interações avançadas;
* redes;
* sobreposição de público.

D3 não deverá ser tratado apenas como complemento.

⸻

36. Cross-filter entre componentes

Os gráficos e grids deverão interagir.

Exemplos:

* selecionar uma campanha filtra todos os indicadores;
* clicar em um público filtra anúncios e criativos;
* selecionar uma região filtra leads;
* selecionar um período filtra todas as telas;
* selecionar uma etapa do funil filtra os registros;
* selecionar um posicionamento destaca os criativos relacionados.

Incluir botão:

Limpar seleção

⸻

37. Experiência visual

O módulo deverá seguir o design system do Dshow Dash, mas possuir identidade própria.

37.1. Direção visual

Utilizar:

* azul Meta como cor de identificação;
* tons neutros;
* cores semânticas;
* gradientes suaves;
* bordas refinadas;
* sombras discretas;
* espaçamento consistente;
* tipografia hierárquica;
* animações funcionais;
* ícones SVG;
* tooltips;
* drawers;
* popovers;
* skeletons;
* microinterações.

Não preencher toda a interface de azul.

Utilizar o azul em:

* botão ativo;
* ícones;
* gráficos;
* badges;
* bordas;
* destaques;
* links;
* estados selecionados.

⸻

38. Ícones

Bibliotecas sugeridas:

* Lucide Icons;
* Phosphor Icons;
* Tabler Icons.

Escolher uma biblioteca principal.

Padronizar:

* tamanho;
* stroke;
* cor;
* alinhamento;
* tooltip;
* área de clique.

⸻

39. Estados da interface

Todas as telas deverão possuir:

Loading

* skeleton;
* carregamento progressivo;
* sem bloqueio total.

Sem dados

* explicação;
* sugestão;
* botão de limpar filtros;
* orientação de configuração.

Erro

* mensagem amigável;
* detalhes técnicos recolhíveis;
* tentar novamente;
* ID do erro;
* data;
* hora.

Dados desatualizados

* última atualização;
* motivo;
* impacto;
* botão atualizar.

Modo mock

Mostrar permanentemente:

Ambiente de demonstração — os dados exibidos são simulados.

⸻

40. Dados mockados

Criar mocks realistas.

40.1. Cenários

* campanhas saudáveis;
* campanhas com queda;
* pico de leads;
* aumento de CPL;
* criativo fatigado;
* anúncio reprovado;
* público saturado;
* pixel sem eventos;
* orçamento esgotado;
* alta frequência;
* alto ROAS;
* baixo ROAS;
* falha de integração;
* sem dados;
* alto volume.

40.2. Requisitos

Os dados deverão possuir:

* IDs coerentes;
* relacionamentos;
* datas plausíveis;
* valores em reais;
* campanhas relacionadas a conjuntos;
* conjuntos relacionados a anúncios;
* anúncios relacionados a criativos;
* leads relacionados às campanhas;
* conversões relacionadas aos eventos.

40.3. Seletor de cenários

No ambiente de desenvolvimento, criar:

* operação saudável;
* queda de performance;
* falha de pixel;
* orçamento crítico;
* fadiga de criativo;
* campanha reprovada;
* alto volume;
* sem dados.

Não exibir esse seletor em produção.

⸻

41. Arquitetura de serviços

Criar separação completa entre mocks e API.

Exemplo:

interface MetaAdsService {
  getOverview(filters: OverviewFilters): Promise<OverviewData>;
  getCampaigns(filters: CampaignFilters): Promise<Paginated<Campaign>>;
  getAdSets(filters: AdSetFilters): Promise<Paginated<AdSet>>;
  getAds(filters: AdFilters): Promise<Paginated<Ad>>;
  getCreatives(filters: CreativeFilters): Promise<Paginated<Creative>>;
  getAudiences(filters: AudienceFilters): Promise<Paginated<Audience>>;
  getLeads(filters: LeadFilters): Promise<Paginated<Lead>>;
  getEvents(filters: EventFilters): Promise<EventData>;
  getAlerts(filters: AlertFilters): Promise<Alert[]>;
}

Implementar inicialmente:

class MockMetaAdsService implements MetaAdsService

Posteriormente:

class ApiMetaAdsService implements MetaAdsService

O front-end deverá consumir apenas a interface.

⸻

42. Arquitetura para futura API

O navegador não deverá armazenar credenciais sensíveis nem acessar diretamente os endpoints externos.

Estrutura recomendada:

1. usuário autoriza a conta;
2. backend processa autorização;
3. credenciais são armazenadas com segurança;
4. serviço consulta a API;
5. dados são normalizados;
6. dados são salvos localmente;
7. front-end consulta a API interna;
8. sincronizações atualizam os dados;
9. jobs de reconciliação validam o histórico.

Na fase de integração real, endpoints, permissões, métricas, limites e regras deverão ser validados novamente na documentação oficial vigente da Meta.

⸻

43. Sincronização

Criar uma tela específica.

43.1. Informações

* conta;
* status;
* última sincronização;
* próxima sincronização;
* duração;
* registros;
* métricas processadas;
* erros;
* tentativas;
* período;
* origem;
* logs.

43.2. Estratégia

Preparar:

* carga histórica;
* sincronização incremental;
* reconciliação;
* filas;
* retry;
* backoff;
* rate limiting;
* deduplicação;
* idempotência;
* cache;
* logs;
* observabilidade.

⸻

44. Modelo de dados sugerido

Entidades:

* meta_ad_accounts;
* meta_businesses;
* meta_pages;
* meta_instagram_accounts;
* meta_campaigns;
* meta_ad_sets;
* meta_ads;
* meta_creatives;
* meta_audiences;
* meta_insights;
* meta_leads;
* meta_pixels;
* meta_events;
* meta_catalogs;
* meta_catalog_items;
* meta_conversions;
* meta_attribution;
* meta_sync_jobs;
* meta_sync_errors;
* meta_alerts;
* meta_audit_logs.

Cada registro deverá possuir:

* ID interno;
* ID externo;
* conta;
* status;
* payload original;
* data externa;
* data de sincronização;
* versão;
* hash;
* exclusão lógica;
* auditoria.

⸻

45. Permissões

Criar perfis específicos.

Administrador

* acesso total;
* contas;
* integrações;
* permissões;
* configurações;
* operações;
* logs.

Gestor de Marketing

* dashboards;
* campanhas;
* conjuntos;
* anúncios;
* criativos;
* públicos;
* leads;
* relatórios;
* otimizações.

Analista

* leitura;
* relatórios;
* comparação;
* exportação;
* alertas autorizados.

Comercial

* leads;
* conversões;
* campanhas relacionadas;
* dados autorizados.

Somente leitura

* dashboards;
* relatórios;
* consultas.

⸻

46. Auditoria

Registrar:

* usuário;
* data;
* hora;
* ação;
* entidade;
* valor anterior;
* valor novo;
* conta;
* resultado;
* IP;
* origem;
* ID de correlação.

Toda futura alteração em campanhas deverá possuir auditoria.

⸻

47. Performance técnica

Implementar:

* lazy loading;
* code splitting;
* virtualização;
* paginação server-side;
* filtros server-side;
* cache;
* debounce;
* memoização;
* cancelamento de requisições;
* prefetch seletivo;
* carregamento por rota;
* compressão;
* payloads reduzidos.

Não carregar todo o histórico no navegador.

⸻

48. Observabilidade

Monitorar:

* disponibilidade;
* latência;
* falhas;
* sincronização;
* volume;
* filas;
* retries;
* limites;
* tokens;
* dados desatualizados;
* erros por conta;
* erros por endpoint.

Logs deverão conter:

* correlation ID;
* conta;
* operação;
* recurso;
* status;
* duração;
* tentativa;
* data;
* hora.

⸻

49. Integração com o Dshow Dash

O módulo deverá respeitar:

* autenticação;
* header;
* sidebar;
* tema;
* layout;
* rotas;
* permissões;
* design tokens;
* notificações;
* modais;
* drawers;
* grids;
* tratamento de erros;
* responsividade.

O Meta Ads deverá ser semelhante ao Ads em:

* navegação;
* padrões de filtros;
* organização;
* componentes;
* densidade;
* experiência;
* comportamento.

Não deve parecer uma aplicação separada.

⸻

50. Stack recomendada

* React;
* TypeScript;
* Apache ECharts;
* D3.js;
* AG Grid;
* TanStack Query;
* Zustand;
* React Hook Form;
* Zod;
* Radix UI;
* shadcn/ui;
* Lucide Icons;
* Framer Motion;
* date-fns;
* TanStack Virtual;
* React Router, se compatível.

Caso o shell principal não utilize React, avaliar microfrontend isolado.

⸻

51. Fases de implementação

Fase 1 — Estrutura visual e mocks

* botão Meta Ads abaixo de Ads;
* navegação;
* header interno;
* sub-sidebar;
* filtros;
* mocks;
* visão geral;
* campanhas;
* conjuntos;
* anúncios;
* criativos;
* leads;
* públicos;
* alertas;
* sincronização simulada.

Fase 2 — Elevação analítica

* D3;
* Apache ECharts;
* mapas;
* Sankey;
* funis;
* drill-down;
* cross-filter;
* relatórios;
* atribuição;
* orçamento;
* qualidade;
* retenção de vídeo.

Fase 3 — Backend

* autenticação;
* banco local;
* filas;
* sincronização;
* API interna;
* logs;
* cache;
* observabilidade.

Fase 4 — Substituição dos mocks

* conectar dados reais;
* validar métricas;
* ajustar modelos;
* testar limites;
* validar contas;
* homologar relatórios;
* revisar permissões.

Fase 5 — Operações de escrita

Após homologação:

* pausar;
* ativar;
* editar orçamento;
* editar datas;
* duplicar;
* criar;
* alterar anúncios;
* registrar auditoria;
* implementar confirmações.

⸻

52. Critérios de aceite visual

O módulo será considerado visualmente aprovado quando:

* o botão Meta Ads estiver imediatamente abaixo de Ads;
* abrir corretamente pela sidebar;
* possuir navegação interna clara;
* manter consistência com Ads;
* utilizar D3 e Apache ECharts;
* possuir data grids robustos;
* possuir zebra rows;
* possuir headers alinhados;
* apresentar gráficos legíveis;
* possuir filtros globais;
* possuir drill-down;
* possuir cross-filter;
* possuir estados de loading;
* possuir estados vazios;
* possuir estados de erro;
* indicar claramente o uso de mocks;
* funcionar em desktop e notebook;
* utilizar ícones consistentes;
* possuir hierarquia visual clara.

⸻

53. Critérios de aceite técnico

O módulo será considerado tecnicamente preparado quando:

* mocks estiverem separados da interface;
* existir contrato de serviço;
* modelos estiverem tipados;
* o front-end não depender diretamente da API externa;
* suportar várias contas;
* filtros estiverem padronizados;
* data grids suportarem server-side;
* permissões estiverem previstas;
* auditoria estiver prevista;
* sincronização estiver modelada;
* erros estiverem tratados;
* a API real puder substituir os mocks sem reconstrução completa.

⸻

54. Orientação final para desenvolvimento

Não criar o módulo Meta Ads apenas como um conjunto de cards e tabelas básicas.

O resultado esperado é uma plataforma completa de análise, gestão e otimização de mídia paga.

O módulo deverá:

* destacar problemas;
* identificar oportunidades;
* permitir análises profundas;
* relacionar campanhas, anúncios, criativos, públicos e leads;
* facilitar comparações;
* reduzir cliques;
* suportar grandes volumes;
* oferecer visualizações avançadas;
* preparar ações futuras;
* integrar dados do Meta Ads ao CRM e ao ERP;
* manter consistência com o módulo Ads.

A primeira versão mockada deverá apresentar aparência e comportamento próximos de um sistema real em produção.

A futura implementação da API deverá alterar principalmente a camada de dados, sem exigir reconstrução das telas, dos componentes ou da experiência do usuário.

Este briefing também pode ser transformado em uma versão técnica por etapas, já separada em tarefas de front-end, backend, banco de dados, UX/UI e integração.