MEGA BRIEFING COMPLETO — MÓDULO GOOGLE ANALYTICS NO DSHOW DASH

Integração com GA4, análise de tráfego, comportamento, aquisição, conversões, e-commerce, funis e inteligência digital

⸻

1. Visão geral do projeto

Desenvolver um novo módulo completo de integração e gestão do Google Analytics 4 — GA4 dentro do Dshow Dash.

O módulo deverá centralizar, em uma única interface, as principais informações relacionadas ao comportamento dos usuários nos sites, lojas virtuais, landing pages e aplicações digitais da empresa.

A solução deverá funcionar de forma integrada aos módulos já existentes ou planejados no Dshow Dash, principalmente:

* Ads Intelligence;
* Meta Ads;
* E-commerce;
* Mercado Livre;
* Bling;
* Pipedrive;
* Comercial;
* Financeiro;
* Outlook;
* páginas e landing pages;
* módulos de tráfego e campanhas.

O objetivo não é simplesmente reproduzir a interface do Google Analytics.

O módulo deverá transformar os dados do GA4 em uma experiência:

* executiva;
* visual;
* operacional;
* intuitiva;
* personalizada;
* orientada a conversões;
* orientada à qualidade do tráfego;
* integrada a vendas, leads e receita;
* preparada para grandes volumes de dados.

O Google Analytics Data API permite consultar programaticamente dados de relatórios das propriedades GA4, incluindo relatórios tradicionais, em tempo real, pivôs e funis. A Admin API permite acessar e administrar configurações como contas, propriedades, streams e definições personalizadas.  

⸻

2. Objetivos principais do módulo

O módulo Google Analytics deverá permitir:

* acompanhar usuários e sessões;
* analisar tráfego em tempo real;
* identificar origens de aquisição;
* comparar canais;
* analisar campanhas;
* acompanhar comportamento por página;
* analisar landing pages;
* medir engajamento;
* acompanhar eventos;
* acompanhar eventos importantes e conversões;
* analisar funis;
* identificar abandono;
* acompanhar a jornada do usuário;
* analisar e-commerce;
* acompanhar receita;
* analisar produtos;
* relacionar tráfego e vendas;
* relacionar campanhas e leads;
* identificar páginas com baixo desempenho;
* detectar erros de instrumentação;
* identificar eventos ausentes;
* comparar dispositivos;
* comparar regiões;
* analisar retenção;
* analisar usuários novos e recorrentes;
* monitorar propriedades e streams;
* identificar anomalias;
* gerar alertas;
* gerar relatórios gerenciais;
* acompanhar qualidade da coleta;
* futuramente enviar eventos complementares pelo backend.

O módulo deverá funcionar simultaneamente como:

1. dashboard executivo;
2. central de aquisição;
3. painel de comportamento;
4. central de conversões;
5. painel de e-commerce;
6. ferramenta de análise de conteúdo;
7. painel de funis;
8. central de eventos;
9. painel de tempo real;
10. ferramenta de diagnóstico de mensuração;
11. central de alertas;
12. central de sincronização;
13. ferramenta de atribuição;
14. plataforma de inteligência digital.

⸻

3. Escopo da integração

A arquitetura deverá considerar quatro frentes diferentes da plataforma Google Analytics.

3.1. Google Analytics Data API

Utilizar para consultar:

* usuários;
* sessões;
* visualizações;
* eventos;
* conversões;
* receita;
* e-commerce;
* campanhas;
* origens;
* mídias;
* páginas;
* dispositivos;
* regiões;
* públicos;
* relatórios em tempo real;
* relatórios de funil;
* relatórios pivotados.

A Data API possui métodos especializados para relatórios principais, tempo real e funis, com categorias de quota separadas para esses tipos de requisição.  

3.2. Google Analytics Admin API

Utilizar para consultar ou administrar, conforme permissão:

* contas;
* propriedades;
* streams de dados;
* definições personalizadas;
* configurações;
* integrações;
* links com outras plataformas;
* Measurement Protocol Secrets;
* registros de acesso, quando disponíveis.

Alguns recursos da Admin API existem em canais Alpha ou Beta, portanto deverão ficar isolados por adapters e feature flags para reduzir impacto de alterações futuras.  

3.3. Measurement Protocol

Utilizar futuramente para complementar a coleta de eventos server-side ou offline, por exemplo:

* lead qualificado;
* proposta enviada;
* venda confirmada no ERP;
* pagamento recebido;
* pedido faturado;
* negócio ganho;
* conversão offline;
* evento originado em outro sistema.

O Measurement Protocol deverá complementar a coleta feita por tags, Google Tag Manager ou Firebase, e não substituí-la integralmente.  

3.4. BigQuery Export

Avaliar a integração com o BigQuery para análises avançadas baseadas em eventos brutos.

O BigQuery será recomendado para:

* histórico em nível de evento;
* consultas customizadas;
* jornadas complexas;
* análises de usuário;
* união com CRM;
* união com ERP;
* união com vendas;
* modelos de atribuição internos;
* armazenamento analítico;
* recomposição de funis;
* análises que ultrapassem as limitações da Data API.

O GA4 permite exportar eventos brutos para o BigQuery, onde os dados podem ser consultados e combinados com outras fontes sob controle de acesso do projeto.  

⸻

4. Estratégia de implementação

O projeto deverá ser dividido em etapas.

4.1. Fase inicial — investigação

Antes de implementar a nova interface, investigar profundamente o que já existe na aplicação e na infraestrutura.

4.2. Fase visual — mocks

Construir inicialmente o painel com dados mockados realistas para validar:

* arquitetura;
* componentes;
* filtros;
* navegação;
* indicadores;
* gráficos;
* data grids;
* funis;
* mapas;
* alertas;
* estados de erro;
* responsividade;
* permissões.

4.3. Fase de integração real

Substituir gradualmente os mocks por:

* Google Analytics Data API;
* Google Analytics Admin API;
* banco local;
* BigQuery, quando aprovado;
* serviços internos;
* Measurement Protocol, quando necessário.

A troca da fonte dos dados não deverá exigir reconstrução do front-end.

⸻

5. Investigação técnica obrigatória

Antes de escrever código novo, o agente deverá realizar uma auditoria do ambiente atual.

5.1. Investigação da coleta existente

Identificar:

* quais sites possuem GA4;
* quais landing pages possuem GA4;
* quais lojas possuem GA4;
* quais aplicativos possuem Firebase Analytics;
* quais propriedades estão ativas;
* quais streams existem;
* quais IDs de mensuração são utilizados;
* onde as tags estão instaladas;
* se existe Google Tag Manager;
* se existe instalação direta com gtag.js;
* se existem tags duplicadas;
* se há eventos duplicados;
* se há eventos ausentes;
* se há eventos enviados pelo servidor;
* se há Consent Mode;
* se há User-ID;
* se existe cross-domain tracking;
* se os domínios internos estão excluídos;
* se os ambientes de desenvolvimento estão contaminando produção.

5.2. Front-end do Dshow Dash

Investigar:

* componentes de analytics já existentes;
* gráficos reutilizáveis;
* filtros de período;
* seletores de conta;
* componentes de funil;
* mapas;
* tabelas;
* cards de KPI;
* stores;
* hooks;
* services;
* rotas;
* permissões;
* feature flags;
* design tokens;
* estrutura do shell;
* mecanismo de microfrontend;
* tratamento de cache;
* sistema de exportação.

5.3. Backend

Investigar:

* projetos Google Cloud existentes;
* service accounts;
* OAuth;
* credenciais;
* APIs habilitadas;
* services internos;
* endpoints;
* jobs;
* filas;
* cache;
* logs;
* limites;
* tratamento de tokens;
* integrações com BigQuery;
* rotinas de importação;
* banco analítico;
* tarefas agendadas.

5.4. Banco de dados

Localizar:

* tabelas de analytics;
* eventos importados;
* sessões;
* campanhas;
* landing pages;
* propriedades;
* usuários;
* métricas diárias;
* canais;
* conversões;
* produtos;
* pedidos;
* relacionamentos com ERP e CRM;
* jobs de sincronização;
* erros;
* raw payloads.

5.5. Integrações relacionadas

Investigar vínculos com:

* Google Ads;
* Meta Ads;
* Loja Integrada;
* Mercado Livre;
* Pipedrive;
* Bling;
* ERP interno;
* campanhas;
* formulários;
* leads;
* vendas;
* recebimentos;
* produtos.

⸻

6. Entregável da investigação

Antes da implementação definitiva, gerar um relatório contendo:

* propriedades GA4 encontradas;
* contas;
* streams;
* domínios;
* eventos;
* parâmetros;
* eventos importantes;
* dimensões personalizadas;
* métricas personalizadas;
* tags;
* containers do Google Tag Manager;
* IDs de mensuração;
* credenciais disponíveis;
* permissões;
* APIs habilitadas;
* BigQuery links;
* qualidade da coleta;
* problemas;
* duplicidades;
* lacunas;
* inconsistências;
* riscos;
* recomendações;
* plano de correção.

Classificar cada item como:

* funcionando;
* funcionando parcialmente;
* incorreto;
* duplicado;
* ausente;
* não validado;
* obsoleto;
* inseguro;
* contaminado por testes;
* aguardando decisão.

⸻

7. Formas de acesso ao módulo

O módulo deverá ser acessível por:

* botão na sidebar;
* ícone no header;
* busca global;
* atalhos da página inicial;
* cards de outros módulos;
* links contextuais de Ads e Meta Ads;
* links contextuais do E-commerce.

⸻

8. Botão na sidebar

Criar um novo botão chamado:

Google Analytics

8.1. Posicionamento recomendado

Posicionar dentro do grupo:

Marketing e Aquisição

Ordem sugerida:

1. Ads;
2. Meta Ads;
3. Google Analytics;
4. Anúncios;
5. outras ferramentas de marketing.

O botão Google Analytics deverá ficar próximo de Ads e Meta Ads, pois os três módulos formam uma estrutura complementar:

* Ads e Meta Ads mostram investimento e performance de mídia;
* Google Analytics mostra comportamento, aquisição e conversão no site;
* E-commerce e CRM mostram o resultado comercial.

8.2. Características

O botão deverá possuir:

* ícone SVG;
* label;
* tooltip;
* estado ativo;
* estado hover;
* badge;
* foco;
* suporte à sidebar expandida;
* suporte à sidebar colapsada;
* indicador de sincronização;
* acessibilidade por teclado.

⸻

9. Ícone no header

Criar ou utilizar um ícone do Google Analytics no header principal.

9.1. Comportamento

Ao clicar:

* abrir o módulo dentro do conteúdo principal;
* preservar o shell;
* manter header e sidebar;
* destacar o botão Google Analytics;
* abrir a última seção acessada;
* não abrir nova aba;
* não redirecionar diretamente para o Google Analytics.

9.2. Tooltip resumido

Exemplo:

Google Analytics

* 38 usuários ativos agora;
* 1.842 sessões hoje;
* 64 conversões;
* taxa de conversão: 3,47%;
* 2 alertas de coleta;
* atualizado há 4 minutos.

9.3. Badge

Prioridade:

1. falha de autenticação;
2. coleta interrompida;
3. evento crítico ausente;
4. queda anormal de tráfego;
5. queda de conversão;
6. dados desatualizados;
7. recomendações informativas.

9.4. Estados

* conectado;
* sincronizando;
* atenção;
* erro;
* dados desatualizados;
* propriedade não configurada;
* mock;
* quota próxima do limite;
* BigQuery com falha;
* coleta parcial.

⸻

10. Navegação interna

Criar uma sub-sidebar expansível e colapsável.

10.1. Visão

1. Visão Geral
2. Tempo Real
3. Diretoria
4. Comparações

10.2. Aquisição

5. Aquisição Geral
6. Canais
7. Origem e Mídia
8. Campanhas
9. Google Ads
10. Meta Ads
11. Tráfego Orgânico
12. Referências

10.3. Comportamento

13. Páginas
14. Landing Pages
15. Jornada do Usuário
16. Navegação
17. Conteúdo
18. Busca Interna
19. Engajamento
20. Saídas

10.4. Conversões

21. Eventos
22. Eventos Importantes
23. Funis
24. Conversões
25. Leads
26. E-commerce
27. Produtos
28. Checkout

10.5. Usuários

29. Usuários
30. Públicos
31. Retenção
32. Coortes
33. Tecnologia
34. Dispositivos
35. Localizações

10.6. Qualidade

36. Qualidade da Coleta
37. Diagnóstico de Eventos
38. Tagging
39. Streams
40. Parâmetros
41. Consentimento
42. User-ID

10.7. Inteligência

43. Insights
44. Anomalias
45. Atribuição
46. Relatórios
47. Alertas

10.8. Administração

48. Propriedades
49. Integrações
50. BigQuery
51. Sincronização
52. Quotas
53. Logs
54. Auditoria
55. Configurações

⸻

11. Sidebar interna

11.1. Estado expandido

* largura recomendada: 240 px;
* ícones;
* labels;
* títulos dos grupos;
* badges;
* item ativo;
* scroll independente.

11.2. Estado colapsado

* largura recomendada: 72 px;
* apenas ícones;
* tooltips;
* badges compactos;
* item ativo claramente identificado.

11.3. Persistência

Salvar a preferência por usuário:

dshow.google-analytics.sidebar.collapsed

11.4. Redimensionamento do conteúdo

Ao recolher ou expandir:

* gráficos ECharts deverão executar resize;
* gráficos D3 deverão recalcular dimensões;
* data grids deverão recalcular colunas;
* não poderá existir sobreposição;
* não poderá surgir scroll horizontal indevido.

⸻

12. Header interno do módulo

O header deverá conter:

* título “Google Analytics”;
* identificação GA4;
* seletor de conta;
* seletor de propriedade;
* seletor de stream;
* seletor de período;
* comparação;
* filtros;
* busca;
* status;
* última atualização;
* botão atualizar;
* botão exportar;
* botão configurações;
* indicador de dados simulados.

Subtítulo sugerido:

Análise integrada de aquisição, comportamento, conversão e receita dos canais digitais.

⸻

13. Seletores de conta, propriedade e stream

Preparar a arquitetura para:

* múltiplas contas;
* múltiplas propriedades;
* múltiplos sites;
* streams web;
* streams de aplicativos;
* visão consolidada;
* comparação entre propriedades.

Cada opção deverá mostrar:

* nome;
* ID da propriedade;
* domínio ou aplicativo;
* tipo de stream;
* fuso horário;
* moeda;
* status;
* última coleta;
* última sincronização.

A Admin API permite listar resumos de contas e propriedades acessíveis ao usuário ou identidade autenticada.  

⸻

14. Períodos e comparações

14.1. Períodos

Disponibilizar:

* agora;
* últimos 30 minutos;
* hoje;
* ontem;
* últimos 7 dias;
* últimos 14 dias;
* últimos 28 dias;
* últimos 30 dias;
* últimos 90 dias;
* mês atual;
* mês anterior;
* trimestre;
* ano atual;
* últimos 12 meses;
* personalizado.

14.2. Comparações

Permitir comparar com:

* período imediatamente anterior;
* mesmo período do mês anterior;
* mesmo período do ano anterior;
* outra propriedade;
* outro canal;
* outro dispositivo;
* outro segmento;
* meta configurada.

A Data API possui suporte a comparações em relatórios principais, mas a camada interna deverá manter sua própria abstração para evitar dependência direta do formato externo.  

⸻

15. Dashboard — Visão Geral

A tela inicial deverá apresentar uma visão executiva e analítica.

15.1. KPIs principais

Criar cards para:

* usuários ativos;
* novos usuários;
* sessões;
* sessões engajadas;
* taxa de engajamento;
* tempo médio de engajamento;
* visualizações;
* visualizações por usuário;
* eventos;
* eventos importantes;
* conversões;
* taxa de conversão;
* leads;
* compras;
* receita total;
* receita de compras;
* ticket médio;
* itens comprados;
* usuários recorrentes;
* taxa de retenção.

As dimensões e métricas disponíveis devem ser obtidas dinamicamente pelos metadados da propriedade, pois o esquema da Data API contempla métricas de usuários, eventos, campanhas, publicidade e e-commerce.  

15.2. Estrutura dos cards

Cada card deverá conter:

* título;
* valor;
* comparação percentual;
* comparação absoluta;
* sparkline;
* ícone;
* tooltip;
* tendência;
* meta;
* origem dos dados;
* drill-down;
* última atualização.

15.3. Interpretação contextual

Não considerar automaticamente todo crescimento como positivo.

Exemplos:

* aumento de usuários: geralmente positivo;
* aumento de rejeição ou abandono: negativo;
* aumento de sessões sem conversão: atenção;
* aumento de eventos duplicados: negativo;
* aumento de tempo de carregamento: negativo;
* aumento de receita: positivo.

⸻

16. Gráfico principal de evolução

Utilizar Apache ECharts.

16.1. Métricas selecionáveis

* usuários;
* sessões;
* sessões engajadas;
* visualizações;
* eventos;
* conversões;
* leads;
* compras;
* receita;
* taxa de conversão;
* ticket médio;
* engajamento.

16.2. Recursos

* múltiplas séries;
* eixo duplo;
* comparação;
* zoom;
* brush temporal;
* tooltip compartilhado;
* média móvel;
* acumulado;
* granularidade diária, semanal ou mensal;
* marcação de campanhas;
* marcação de mudanças de site;
* marcação de alterações de tracking;
* identificação de anomalias;
* exportação.

⸻

17. Painel “Exige atenção”

Criar uma área prioritária com:

* queda abrupta de usuários;
* queda de sessões;
* queda de conversão;
* evento importante sem registros;
* stream sem atividade;
* evento duplicado;
* parâmetro ausente;
* campanha com tráfego sem conversão;
* aumento de páginas de erro;
* aumento de abandono;
* queda de receita;
* divergência GA4 versus e-commerce;
* BigQuery desatualizado;
* quota elevada;
* falha de autenticação;
* propriedade sem sincronização;
* dados contaminados por ambiente de teste.

Cada alerta deverá mostrar:

* severidade;
* propriedade;
* métrica;
* período;
* impacto;
* possível causa;
* recomendação;
* responsável;
* botão de acesso.

⸻

18. Tempo Real

Criar uma área de tempo real visualmente rica.

18.1. Indicadores

* usuários ativos agora;
* usuários nos últimos 5 minutos;
* usuários nos últimos 30 minutos;
* páginas ativas;
* eventos;
* conversões;
* cidades;
* países;
* dispositivos;
* origens;
* campanhas.

18.2. Visualizações

* contador animado;
* série temporal por minuto;
* mapa;
* páginas ativas;
* eventos recentes;
* canais;
* dispositivo;
* stream.

18.3. Recursos

* atualização automática;
* pausa;
* intervalo configurável;
* comparação com média;
* filtros;
* drill-down;
* indicação clara de que são dados em tempo real.

A Data API oferece um método próprio para relatórios em tempo real, separado dos relatórios principais.  

⸻

19. Aquisição

Criar uma visão consolidada de aquisição.

19.1. KPIs

* usuários;
* novos usuários;
* sessões;
* sessões engajadas;
* conversões;
* receita;
* custo, quando integrado;
* CPA;
* ROAS;
* taxa de conversão.

19.2. Dimensões

* canal;
* origem;
* mídia;
* campanha;
* conteúdo;
* termo;
* plataforma;
* grupo de canais;
* página de entrada;
* dispositivo;
* região.

19.3. Data grid

Colunas:

* canal;
* origem;
* mídia;
* campanha;
* usuários;
* sessões;
* engajamento;
* eventos;
* conversões;
* receita;
* custo;
* CPA;
* ROAS;
* variação;
* status.

⸻

20. Comparação entre canais

Comparar:

* Google Ads;
* Meta Ads;
* orgânico;
* direto;
* referral;
* e-mail;
* social orgânico;
* display;
* parceiros;
* outros.

Visualizações:

* barras;
* treemap;
* scatter plot;
* matriz custo versus conversão;
* receita versus sessões;
* participação por canal;
* tendência.

Dados de custos externos deverão vir dos respectivos módulos ou fontes autorizadas, não devem ser inventados a partir do GA4.

⸻

21. Sankey de aquisição em D3

Criar visualização:

Canal
→ Origem/Mídia
→ Campanha
→ Landing Page
→ Evento Importante
→ Conversão

Mostrar:

* volume;
* conversão;
* perdas;
* receita;
* taxa de passagem;
* tempo médio.

Recursos:

* zoom;
* tooltip;
* seleção;
* filtro;
* drill-down;
* comparação;
* exportação.

⸻

22. Campanhas

Criar uma central de campanhas.

22.1. Indicadores

* usuários;
* sessões;
* novos usuários;
* engajamento;
* conversões;
* receita;
* taxa de conversão;
* páginas por sessão;
* tempo médio;
* custo;
* CPA;
* ROAS.

22.2. Diagnósticos

* campanha sem UTMs;
* parâmetros inconsistentes;
* variações de capitalização;
* nomes duplicados;
* tráfego sem campanha;
* campanha com cliques, mas sem sessões;
* campanha com sessões, mas sem conversão;
* receita não atribuída;
* UTMs incompletas.

22.3. Governança de UTMs

Criar um painel de padronização:

* utm_source;
* utm_medium;
* utm_campaign;
* utm_content;
* utm_term;
* convenção de nomes;
* valores permitidos;
* variações;
* inconsistências.

⸻

23. Páginas e conteúdo

Criar uma central de páginas.

23.1. Data grid

Colunas:

* título;
* caminho;
* URL;
* tipo;
* visualizações;
* usuários;
* sessões;
* entradas;
* saídas;
* engajamento;
* tempo médio;
* eventos;
* conversões;
* receita;
* status;
* última atualização.

23.2. Análises

* páginas mais vistas;
* páginas de entrada;
* páginas de saída;
* páginas sem conversão;
* páginas com baixo engajamento;
* páginas de erro;
* páginas lentas, caso haja fonte disponível;
* páginas com queda de desempenho;
* páginas sem eventos esperados.

⸻

24. Landing Pages

Criar uma área específica para páginas de entrada.

24.1. Indicadores

* sessões;
* usuários;
* engajamento;
* conversão;
* leads;
* receita;
* eventos;
* saídas;
* abandono;
* origem do tráfego.

24.2. Comparações

Comparar landing pages por:

* campanha;
* canal;
* dispositivo;
* região;
* conversão;
* receita;
* qualidade do tráfego.

24.3. Score interno

Criar score analítico com:

* engajamento;
* conversão;
* volume;
* abandono;
* qualidade;
* receita.

Explicar os componentes do score. Não apresentar como métrica oficial do Google.

⸻

25. Jornada do usuário

Criar uma visualização D3 mostrando caminhos entre páginas e eventos.

Exemplo:

Landing Page
→ Página de Produto
→ Formulário
→ Lead
→ Obrigado

ou:

Home
→ Categoria
→ Produto
→ Carrinho
→ Checkout
→ Compra

Recursos:

* seleção de ponto inicial;
* seleção de ponto final;
* quantidade de etapas;
* abandono;
* loops;
* filtros;
* comparação;
* destaque de caminhos.

⸻

26. Árvore de navegação

Criar árvore ou grafo D3 com:

* páginas;
* eventos;
* sequência;
* frequência;
* saída;
* conversão.

Permitir:

* expandir;
* recolher;
* filtrar;
* limitar profundidade;
* destacar conversões;
* excluir páginas técnicas;
* agrupar URLs semelhantes.

⸻

27. Engajamento

Criar uma área para:

* sessões engajadas;
* taxa de engajamento;
* tempo médio;
* eventos por sessão;
* visualizações por usuário;
* scroll;
* vídeo;
* downloads;
* interações;
* busca interna;
* formulários.

27.1. Visualizações

* evolução;
* distribuição;
* páginas;
* dispositivos;
* canais;
* regiões;
* heatmaps;
* faixas de tempo.

Não chamar de “taxa de rejeição” quando a métrica usada for engajamento, salvo quando a dimensão ou métrica correspondente estiver explicitamente disponível e identificada.

⸻

28. Eventos

Criar uma central completa de eventos.

28.1. Informações

* nome do evento;
* categoria interna;
* volume;
* usuários;
* sessões;
* parâmetro;
* stream;
* primeira ocorrência;
* última ocorrência;
* conversões associadas;
* status de qualidade.

28.2. Data grid

* evento;
* tipo;
* usuários;
* contagem;
* por sessão;
* receita;
* evento importante;
* parâmetros;
* propriedades;
* última atividade;
* diagnóstico;
* ações.

28.3. Classificações

* automático;
* medição otimizada;
* recomendado;
* customizado;
* server-side;
* interno;
* legado;
* não reconhecido.

⸻

29. Eventos importantes e conversões

Criar uma área específica para os eventos definidos como importantes.

Mostrar:

* evento;
* conversões;
* usuários;
* taxa;
* valor;
* canal;
* campanha;
* página;
* dispositivo;
* tendência;
* qualidade.

Preparar relacionamento com:

* lead enviado;
* orçamento solicitado;
* contato via WhatsApp;
* ligação;
* compra;
* pagamento;
* negócio ganho;
* visita ao showroom;
* outras conversões relevantes.

⸻

30. Funis

Criar um construtor visual de funis.

30.1. Funis predefinidos

Funil de lead

1. sessão;
2. landing page;
3. visualização do formulário;
4. início do formulário;
5. envio;
6. lead qualificado;
7. oportunidade;
8. venda.

Funil de e-commerce

1. visualização de produto;
2. adição ao carrinho;
3. início do checkout;
4. dados de pagamento;
5. compra.

Funil comercial

1. usuário;
2. lead;
3. oportunidade;
4. proposta;
5. venda;
6. recebimento.

30.2. Recursos

* funil aberto;
* funil fechado;
* filtro por segmento;
* tempo entre etapas;
* abandono;
* comparação;
* drill-down;
* exportação;
* salvar modelo.

A Data API possui recurso especializado de relatório de funil, mas deve ser encapsulado porque esse método aparece em canal específico da API.  

⸻

31. Visualização de funil em D3

Utilizar D3 para funis altamente customizados.

Cada etapa deverá apresentar:

* usuários;
* sessões;
* eventos;
* conversão;
* perda;
* tempo;
* valor;
* comparação.

Ao clicar:

* filtrar demais componentes;
* abrir usuários ou eventos agregados;
* destacar campanhas;
* mostrar páginas relacionadas.

Não expor identificadores pessoais sem base legal e permissão adequada.

⸻

32. Leads

Criar uma visão integrada entre GA4 e CRM.

32.1. Indicadores

* leads registrados no GA4;
* leads recebidos no CRM;
* diferença;
* taxa de qualificação;
* oportunidades;
* vendas;
* receita;
* tempo de resposta;
* origem.

32.2. Conciliação

Comparar:

* evento de lead;
* formulário;
* ID interno;
* Pipedrive;
* ERP;
* vendedor;
* oportunidade;
* venda.

Status:

* conciliado;
* GA4 sem CRM;
* CRM sem GA4;
* duplicado;
* incompleto;
* divergente.

⸻

33. E-commerce

Criar uma área específica para mensuração de comércio eletrônico.

33.1. Indicadores

* visualizações de produtos;
* adições ao carrinho;
* checkouts;
* compras;
* compradores;
* receita;
* ticket médio;
* itens comprados;
* taxa de conversão;
* abandono;
* reembolso, quando disponível;
* receita por usuário.

33.2. Eventos recomendados

Investigar a implementação de eventos como:

* view_item;
* view_item_list;
* select_item;
* add_to_cart;
* remove_from_cart;
* view_cart;
* begin_checkout;
* add_shipping_info;
* add_payment_info;
* purchase;
* refund.

A referência oficial do Measurement Protocol documenta categorias de eventos, incluindo eventos gerais, leads e e-commerce, com parâmetros obrigatórios e opcionais.  

⸻

34. Produtos

Criar data grid com:

* item;
* ID;
* nome;
* categoria;
* marca;
* visualizações;
* adições ao carrinho;
* compras;
* quantidade;
* receita;
* conversão;
* abandono;
* preço médio;
* campanha;
* dispositivo.

34.1. Análises

* produtos vistos e não comprados;
* produtos mais adicionados;
* produtos removidos;
* produtos com alto abandono;
* receita;
* conversão;
* produtos por canal;
* produtos por campanha.

⸻

35. Checkout

Criar um funil detalhado:

1. carrinho;
2. início do checkout;
3. envio;
4. pagamento;
5. compra.

Mostrar:

* usuários;
* perdas;
* taxa;
* dispositivos;
* canais;
* métodos;
* erros, quando integrados;
* tempo entre etapas.

Relacionar com dados reais da Loja Integrada e do Bling para identificar divergências entre:

* compra registrada no GA4;
* pedido criado;
* pagamento aprovado;
* pedido faturado.

⸻

36. Usuários

Criar visão agregada de usuários.

36.1. Indicadores

* usuários ativos;
* novos;
* recorrentes;
* compradores;
* usuários por dispositivo;
* usuários por canal;
* retenção;
* frequência;
* valor médio;
* receita por usuário.

36.2. Privacidade

Não criar perfis pessoais individualizados a partir do GA4 sem necessidade, base legal, consentimento e controle de acesso.

Trabalhar prioritariamente com dados agregados.

⸻

37. Retenção e coortes

Criar heatmap de coorte usando D3 ou Apache ECharts.

Analisar:

* primeira visita;
* primeira conversão;
* primeira compra;
* retenção diária;
* semanal;
* mensal;
* recompra;
* receita por coorte;
* canal de aquisição;
* campanha.

⸻

38. Públicos

Criar uma área de públicos.

Mostrar:

* nome;
* tamanho;
* usuários ativos;
* novos usuários;
* sessões;
* conversões;
* receita;
* retenção;
* canais;
* dispositivos.

A criação ou edição de públicos deverá ser habilitada apenas após validação das capacidades e permissões atuais da Admin API.

⸻

39. Dispositivos e tecnologia

Analisar:

* desktop;
* mobile;
* tablet;
* navegador;
* sistema operacional;
* resolução;
* plataforma;
* modelo de dispositivo, quando disponível;
* versão do aplicativo;
* stream.

39.1. Indicadores

* usuários;
* sessões;
* engajamento;
* conversão;
* receita;
* abandono;
* páginas;
* eventos.

39.2. Matriz

Criar matriz:

* volume versus conversão;
* dispositivo versus canal;
* navegador versus erro;
* sistema versus abandono.

⸻

40. Localizações

Criar mapa interativo com D3.

Exibir:

* país;
* estado;
* cidade;
* usuários;
* sessões;
* conversões;
* receita;
* ticket médio;
* engajamento.

Recursos:

* zoom;
* tooltip;
* escala;
* ranking;
* seleção;
* cross-filter;
* drill-down;
* comparação.

Não inferir precisão geográfica superior àquela disponibilizada pela fonte.

⸻

41. Busca interna do site

Caso exista evento de pesquisa interna, criar área com:

* termos pesquisados;
* quantidade;
* usuários;
* conversões;
* páginas;
* termos sem resultado;
* termos associados a compra;
* tendências.

Criar alertas para:

* buscas sem resultado;
* aumento de termos específicos;
* produtos procurados e não encontrados;
* erros de nomenclatura.

⸻

42. Qualidade da coleta

Criar uma central técnica e gerencial.

42.1. Indicadores

* streams ativos;
* eventos recebidos;
* eventos esperados;
* eventos ausentes;
* parâmetros inválidos;
* duplicidades;
* divergências;
* atraso;
* ambientes misturados;
* domínios indesejados.

42.2. Diagnósticos

* evento sem parâmetro obrigatório;
* evento duplicado;
* evento disparado várias vezes;
* evento com nome inconsistente;
* parâmetro com tipo errado;
* purchase sem transaction_id;
* compra duplicada;
* moeda ausente;
* valor divergente;
* User-ID incorreto;
* referral indesejado;
* tráfego interno não filtrado.

⸻

43. Validação de eventos

Preparar uma área de desenvolvimento para validar eventos enviados pelo Measurement Protocol.

A ferramenta deverá:

* montar payload;
* validar;
* mostrar erros;
* mostrar avisos;
* não enviar dados para produção no modo de validação;
* registrar teste;
* proteger secrets.

O Google disponibiliza um servidor de validação específico para o Measurement Protocol; os eventos enviados a esse endpoint de debug não aparecem nos relatórios e a resposta informa problemas de validação.  

⸻

44. Tagging e Google Tag Manager

Criar uma área de governança de tags.

Mostrar:

* propriedade;
* stream;
* measurement ID;
* domínio;
* container GTM;
* status;
* última versão;
* ambiente;
* eventos encontrados;
* eventos esperados;
* inconsistências.

Não expor credenciais ou segredos.

44.1. Checklist

* tag base instalada;
* uma única inicialização;
* cross-domain configurado;
* referrals indesejados configurados;
* eventos de lead;
* eventos de e-commerce;
* consentimento;
* debug desabilitado em produção;
* ambientes separados.

⸻

45. Measurement Protocol

Criar uma central para eventos server-side.

45.1. Casos de uso

* venda offline;
* pagamento confirmado;
* negócio ganho;
* lead qualificado;
* pedido faturado;
* devolução;
* cancelamento;
* evento de CRM;
* visita ao showroom.

45.2. Estrutura

Cada configuração deverá possuir:

* nome do evento;
* origem;
* gatilho;
* parâmetros;
* User-ID, quando aplicável;
* Client ID;
* stream;
* ambiente;
* status;
* última execução;
* erro;
* validação.

45.3. Privacidade

Dados pessoais fornecidos pelo usuário enviados por Measurement Protocol devem seguir as exigências oficiais, incluindo hashing SHA-256 quando aplicável.  

45.4. Segurança

O api_secret não deverá:

* aparecer no navegador;
* ser enviado ao front-end;
* ser armazenado em localStorage;
* aparecer em logs abertos;
* ser exposto em mensagens de erro.

⸻

46. Atribuição

Criar uma área de atribuição gerencial.

Mostrar:

* canal;
* origem;
* campanha;
* conversões;
* receita;
* primeira aquisição;
* sessão;
* conversão atribuída;
* diferenças entre plataformas.

46.1. Avisos obrigatórios

Explicar que divergências podem ocorrer entre:

* Google Analytics;
* Google Ads;
* Meta Ads;
* Loja Integrada;
* Bling;
* CRM;
* banco financeiro.

Possíveis motivos:

* janelas diferentes;
* identidade;
* cookies;
* consentimento;
* bloqueadores;
* dispositivos;
* horário;
* processamento;
* cancelamentos;
* pedidos não pagos;
* modelos de atribuição.

Não apresentar uma fonte isolada como verdade absoluta.

⸻

47. Conciliação de conversões

Criar uma área comparando:

Fonte	Evento
GA4	generate_lead
Pipedrive	Lead criado
CRM	Oportunidade
E-commerce	Pedido
Bling	Pedido faturado
Financeiro	Recebimento

Status:

* conciliado;
* parcial;
* ausente no GA4;
* ausente no sistema interno;
* duplicado;
* valor divergente;
* data divergente.

⸻

48. BigQuery

Criar uma seção específica para o BigQuery.

48.1. Informações

* projeto;
* dataset;
* propriedade;
* status do vínculo;
* última tabela;
* data mais recente;
* volume;
* custo estimado;
* falhas;
* atraso;
* localização.

48.2. Casos de uso

* eventos brutos;
* funis customizados;
* sequências;
* análises por usuário pseudônimo;
* atribuição própria;
* cruzamento com ERP;
* cruzamento com CRM;
* cruzamento com campanhas;
* recomposição de pedidos;
* modelos analíticos.

48.3. Estratégia de consultas

Não consultar grandes tabelas diretamente a cada abertura da tela.

Criar:

* tabelas agregadas;
* views;
* materialized views;
* cache;
* partições;
* clusters;
* limites de custo;
* jobs agendados.

48.4. Controle de custo

Mostrar:

* bytes processados;
* custo estimado;
* consultas recentes;
* limites;
* alertas;
* cache utilizado.

⸻

49. Diferenças entre Data API e interface do GA4

A aplicação deverá aceitar que podem existir divergências entre números vistos na API e na interface do Google Analytics.

A documentação oficial alerta que relatórios da Data API podem diferir da interface por fatores relacionados ao processamento e às características do relatório.  

A interface deverá mostrar:

* fonte;
* data de atualização;
* escopo;
* filtros;
* propriedade;
* timezone;
* observação sobre estimativas;
* indicador de dados não disponíveis.

Não ocultar divergências.

⸻

50. Insights e anomalias

Criar uma área de inteligência baseada inicialmente em regras.

Exemplos:

* usuários caíram 24%;
* tráfego orgânico cresceu 18%;
* conversão mobile caiu;
* uma landing page recebe tráfego, mas não converte;
* evento de compra parou;
* campanha gera sessões sem engajamento;
* receita diverge do e-commerce;
* canal tem volume alto e baixa qualidade;
* abandono aumentou no checkout;
* evento duplicado aumentou.

Cada insight deverá conter:

* conclusão;
* evidência;
* período;
* comparação;
* impacto;
* possível causa;
* recomendação;
* nível de confiança;
* botão de análise.

⸻

51. Relatórios

Criar uma central de relatórios.

51.1. Relatórios sugeridos

* visão executiva;
* aquisição;
* canais;
* campanhas;
* landing pages;
* páginas;
* eventos;
* conversões;
* leads;
* e-commerce;
* produtos;
* checkout;
* usuários;
* retenção;
* dispositivos;
* localizações;
* qualidade da coleta;
* atribuição;
* conciliação;
* BigQuery;
* sincronização.

51.2. Recursos

* filtros;
* segmentos;
* comparações;
* colunas;
* agrupamento;
* totalizadores;
* visualizações salvas;
* favoritos;
* exportação CSV;
* exportação XLSX;
* exportação PDF;
* impressão;
* compartilhamento;
* agendamento futuro.

⸻

52. Sistema de alertas

52.1. Tráfego

* queda de usuários;
* queda de sessões;
* pico anormal;
* tráfego suspeito;
* crescimento inesperado de direto.

52.2. Conversão

* queda de leads;
* queda de compras;
* queda de receita;
* aumento de abandono;
* evento importante sem registros.

52.3. Coleta

* stream inativo;
* evento ausente;
* evento duplicado;
* parâmetro inválido;
* e-commerce incompleto;
* compra sem valor;
* transação duplicada.

52.4. Técnico

* autenticação inválida;
* quota elevada;
* sincronização falhou;
* BigQuery atrasado;
* propriedade sem acesso;
* credencial expirada.

52.5. Configuração

Permitir:

* ativar;
* desativar;
* escolher propriedade;
* escolher métrica;
* definir limite;
* selecionar comparação;
* definir prioridade;
* escolher responsável;
* cooldown;
* deduplicação;
* histórico;
* resolução.

⸻

53. Automações

Preparar para futuras automações:

* gerar alerta;
* criar tarefa;
* enviar relatório;
* validar evento;
* reconciliar conversão;
* abrir incidente;
* atualizar cache;
* executar consulta;
* notificar responsável;
* registrar anomalia.

Toda automação deverá possuir:

* nome;
* gatilho;
* condição;
* ação;
* status;
* modo teste;
* responsável;
* logs;
* última execução;
* próxima execução;
* histórico.

⸻

54. Arquitetura de serviços

Criar contrato desacoplado.

interface GoogleAnalyticsService {
  getOverview(filters: AnalyticsFilters): Promise<AnalyticsOverview>;
  getRealtime(filters: RealtimeFilters): Promise<RealtimeOverview>;
  getAcquisition(filters: AcquisitionFilters): Promise<AcquisitionReport>;
  getPages(filters: PageFilters): Promise<Paginated<PagePerformance>>;
  getEvents(filters: EventFilters): Promise<Paginated<AnalyticsEvent>>;
  getConversions(filters: ConversionFilters): Promise<ConversionReport>;
  getFunnel(filters: FunnelFilters): Promise<FunnelReport>;
  getEcommerce(filters: EcommerceFilters): Promise<EcommerceAnalytics>;
  getAudiences(filters: AudienceFilters): Promise<AudienceReport>;
  getProperties(): Promise<AnalyticsProperty[]>;
  getAlerts(filters: AlertFilters): Promise<AnalyticsAlert[]>;
}

Implementar inicialmente:

class MockGoogleAnalyticsService implements GoogleAnalyticsService

Posteriormente:

class ApiGoogleAnalyticsService implements GoogleAnalyticsService

O front-end deverá consumir somente a interface.

⸻

55. Arquitetura da integração

Estrutura recomendada:

Google Analytics Data API
Google Analytics Admin API
BigQuery
Measurement Protocol
          ↓
Google Analytics Integration Service
          ↓
Adapters e normalizadores
          ↓
Banco analítico e cache
          ↓
API interna do Dshow Dash
          ↓
Front-end

⸻

56. Autenticação

Avaliar dois modelos.

56.1. Service account

Adequado para:

* propriedade corporativa;
* execução backend;
* automações;
* jobs;
* relatórios internos.

A service account deverá receber acesso explícito às propriedades necessárias.

56.2. OAuth por usuário

Adequado quando:

* cada usuário conecta suas próprias propriedades;
* existem múltiplas organizações;
* as permissões variam por usuário.

A documentação oficial de início rápido contempla autenticação por conta de usuário ou service account conforme o cenário.  

56.3. Requisitos de segurança

* credenciais somente no backend;
* secrets criptografados;
* rotação;
* menor privilégio;
* registro de acesso;
* revogação;
* auditoria;
* separação entre ambientes.

⸻

57. Quotas e limites

Criar controle de quotas.

A Data API separa consumo entre categorias Core, Realtime e Funnel.  

A aplicação deverá:

* evitar chamadas duplicadas;
* utilizar cache;
* agrupar relatórios;
* utilizar batch quando aplicável;
* priorizar requisições;
* limitar refresh;
* aplicar backoff;
* monitorar quota;
* registrar consumo;
* degradar graciosamente.

57.1. Tela de quotas

Mostrar:

* categoria;
* consumo;
* limite;
* percentual;
* propriedade;
* requisições recentes;
* alertas;
* reset, quando disponível.

⸻

58. Estratégia de sincronização

58.1. Tempo real

* consulta sob demanda;
* cache curto;
* atualização configurável.

58.2. Dados diários

* sincronização incremental;
* cache maior;
* agregações locais;
* reconciliação.

58.3. Histórico

* carga inicial;
* processamento em lotes;
* checkpoint;
* retry;
* controle de quota.

58.4. BigQuery

* jobs agendados;
* tabelas agregadas;
* atualização diária ou intraday conforme configuração;
* monitoramento.

⸻

59. Modelo de dados local

Entidades sugeridas:

ga_accounts
ga_properties
ga_data_streams
ga_custom_dimensions
ga_custom_metrics
ga_audiences
ga_daily_metrics
ga_realtime_snapshots
ga_acquisition_metrics
ga_page_metrics
ga_landing_page_metrics
ga_event_metrics
ga_conversion_metrics
ga_ecommerce_metrics
ga_product_metrics
ga_device_metrics
ga_geo_metrics
ga_funnel_definitions
ga_funnel_results
ga_alerts
ga_anomalies
ga_sync_jobs
ga_sync_errors
ga_quota_snapshots
ga_bigquery_links
ga_measurement_protocol_events
ga_audit_logs
ga_raw_responses

59.1. Campos comuns

* ID interno;
* account ID;
* property ID;
* stream ID;
* data;
* dimensão;
* métrica;
* valor;
* origem;
* versão;
* sincronizado em;
* hash;
* timezone;
* moeda;
* payload original;
* data de atualização.

⸻

60. Data grids robustos

Utilizar data grids avançados em todas as telas de grande volume.

Biblioteca principal recomendada:

* AG Grid.

Alternativas:

* TanStack Table com TanStack Virtual;
* MUI X Data Grid Pro.

60.1. Recursos obrigatórios

* server-side;
* virtualização;
* paginação;
* filtros;
* busca;
* ordenação múltipla;
* agrupamento;
* pivot;
* agregações;
* pinagem;
* reordenação;
* redimensionamento;
* seleção;
* expansão;
* exportação;
* preferências;
* zebra rows;
* totalizadores;
* menus contextuais;
* densidade ajustável;
* views salvas.

60.2. Padrão visual

* headers alinhados;
* valores numéricos à direita;
* dimensões à esquerda;
* percentuais padronizados;
* badges;
* linhas alternadas;
* hover;
* seleção clara;
* tooltips;
* truncamento;
* colunas fixadas.

⸻

61. D3.js como biblioteca principal

D3.js deverá ser utilizado como ferramenta central para:

* Sankey de aquisição;
* jornada do usuário;
* árvore de navegação;
* mapas;
* funis customizados;
* redes de páginas;
* coortes;
* fluxo de conversão;
* relações entre canais;
* mapas de eventos;
* diagramas customizados.

D3 não deverá ser tratado apenas como complemento visual.

61.1. Requisitos das visualizações

* tooltip;
* legenda;
* zoom;
* seleção;
* reset;
* cross-filter;
* drill-down;
* loading;
* estado vazio;
* erro;
* responsividade;
* suporte a temas;
* descrição acessível.

⸻

62. Apache ECharts

Utilizar no mesmo nível de importância para:

* séries temporais;
* barras;
* linhas;
* áreas;
* scatter;
* heatmaps;
* funis;
* gauges;
* donuts;
* gráficos combinados;
* comparação;
* métricas executivas.

⸻

63. Cross-filter

Os componentes deverão interagir.

Exemplos:

* selecionar um canal filtra campanhas;
* selecionar uma campanha filtra landing pages;
* selecionar uma página filtra eventos;
* selecionar um dispositivo filtra conversões;
* selecionar um estado filtra usuários;
* selecionar uma etapa do funil filtra registros;
* selecionar um nó do Sankey filtra o data grid.

Adicionar botão:

Limpar seleção

⸻

64. Drill-down

Exemplos:

* usuários → canais;
* sessões → landing pages;
* conversões → eventos;
* receita → produtos;
* tráfego orgânico → páginas;
* erro de evento → diagnóstico;
* divergência → conciliação;
* propriedade → streams;
* stream → eventos.

Preservar filtros e contexto ao navegar.

⸻

65. Busca global

Permitir localizar:

* propriedade;
* stream;
* campanha;
* origem;
* mídia;
* página;
* landing page;
* evento;
* produto;
* audience;
* parâmetro;
* dimensão;
* relatório.

⸻

66. Filtros globais

Criar filtros para:

* conta;
* propriedade;
* stream;
* período;
* comparação;
* canal;
* origem;
* mídia;
* campanha;
* página;
* evento;
* conversão;
* dispositivo;
* navegador;
* país;
* estado;
* cidade;
* público;
* novo ou recorrente.

Recursos:

* chips;
* contador;
* limpar;
* presets;
* favoritos;
* persistência;
* compartilhamento;
* filtros recentes.

⸻

67. Direção visual

A interface deverá possuir padrão premium.

67.1. Identidade

Utilizar:

* laranja e amarelo do Google Analytics como referência;
* tons neutros do Dshow Dash;
* roxo como apoio moderado;
* cores semânticas;
* gradientes suaves;
* cards bem definidos;
* sombras discretas;
* bordas refinadas;
* ícones SVG;
* microinterações.

Não preencher toda a interface de laranja.

67.2. Aplicações da cor

* botão ativo;
* ícone do módulo;
* série principal dos gráficos;
* badges;
* bordas de destaque;
* links;
* estados selecionados.

67.3. Não copiar a interface do Google

O módulo deverá possuir identidade própria do Dshow Dash.

⸻

68. Ícones

Utilizar uma família principal, preferencialmente:

* Lucide Icons.

Sugestões:

Área	Ícone
Visão Geral	LayoutDashboard
Tempo Real	Radio
Aquisição	MousePointerClick
Campanhas	Megaphone
Páginas	Files
Landing Pages	PanelsTopLeft
Jornada	Route
Eventos	Zap
Conversões	BadgeCheck
Funis	Funnel
E-commerce	ShoppingCart
Produtos	Package
Usuários	Users
Retenção	Repeat2
Dispositivos	MonitorSmartphone
Localização	Map
Qualidade	ShieldCheck
BigQuery	Database
Alertas	BellRing
Sincronização	RefreshCw

Não utilizar emojis como ícones principais.

⸻

69. Estados da interface

69.1. Loading

* skeletons;
* carregamento independente;
* preservação do último dado válido;
* sem spinner central único.

69.2. Sem dados

Mostrar:

* possível causa;
* filtros;
* propriedade;
* ação sugerida;
* botão de limpar.

69.3. Erro

Mostrar:

* mensagem amigável;
* tentar novamente;
* data;
* hora;
* correlation ID;
* detalhes técnicos recolhíveis.

69.4. Dados desatualizados

Mostrar:

* última atualização;
* motivo;
* impacto;
* botão atualizar.

69.5. Mock

Exibir:

Ambiente de demonstração — os dados apresentados são simulados.

⸻

70. Mocks realistas

Criar cenários:

* operação saudável;
* pico de tráfego;
* queda de conversão;
* evento de compra interrompido;
* campanha sem UTMs;
* tráfego duplicado;
* stream sem dados;
* quota elevada;
* BigQuery atrasado;
* mobile com baixa conversão;
* alto abandono de checkout;
* divergência de receita;
* alto volume;
* sem dados.

Os mocks deverão preservar relações entre:

* canal;
* campanha;
* página;
* evento;
* conversão;
* produto;
* receita;
* dispositivo;
* localização.

⸻

71. Segurança e permissões

Administrador

* propriedades;
* credenciais;
* configurações;
* BigQuery;
* Measurement Protocol;
* logs;
* auditoria;
* acesso completo.

Gestor de Marketing

* dashboards;
* aquisição;
* campanhas;
* comportamento;
* conversões;
* relatórios.

Analista

* consultas;
* filtros;
* relatórios;
* funis;
* exportação autorizada.

Comercial

* leads;
* conversões;
* campanhas relacionadas;
* dados agregados.

Técnico

* eventos;
* tagging;
* streams;
* qualidade;
* diagnóstico;
* BigQuery autorizado.

Somente leitura

* dashboards e relatórios permitidos.

⸻

72. Privacidade, LGPD e consentimento

A implementação deverá respeitar:

* LGPD;
* consentimento;
* minimização;
* finalidade;
* retenção;
* anonimização;
* controle de acesso;
* exclusão;
* auditoria;
* políticas internas.

72.1. Requisitos

* não enviar dados pessoais brutos em URLs;
* não enviar CPF;
* não enviar e-mail aberto;
* não enviar telefone aberto;
* não inserir informações pessoais em nomes de evento;
* não expor client IDs em telas operacionais;
* utilizar dados agregados sempre que possível;
* controlar acesso ao BigQuery;
* documentar a finalidade de cada evento.

72.2. Exclusão

Preparar processo de exclusão quando necessário, considerando os recursos administrativos vigentes da plataforma. A funcionalidade de solicitação de exclusão de usuário foi migrada para a Admin API em canal específico após o encerramento da API legada.  

⸻

73. Auditoria

Registrar:

* usuário;
* ação;
* propriedade;
* relatório;
* filtros;
* exportação;
* alteração de configuração;
* evento enviado;
* data;
* hora;
* IP;
* origem;
* resultado;
* correlation ID.

Registrar especialmente:

* conexão de propriedade;
* alteração de stream;
* criação de secret;
* envio server-side;
* exportação de dados;
* alterações em eventos;
* alterações em configurações.

⸻

74. Performance

Implementar:

* lazy loading;
* code splitting;
* cache;
* agregações locais;
* paginação server-side;
* filtros server-side;
* virtualização;
* debounce;
* cancelamento de requisição;
* prefetch seletivo;
* refresh controlado;
* consultas agrupadas;
* endpoints resumidos.

Não executar uma chamada à Data API para cada card separadamente quando uma mesma consulta puder retornar múltiplas métricas.

⸻

75. Observabilidade

Monitorar:

* autenticação;
* Data API;
* Admin API;
* quotas;
* BigQuery;
* sincronizações;
* jobs;
* latência;
* erros;
* cache;
* eventos server-side;
* propriedades sem dados;
* discrepâncias.

Logs deverão conter:

* correlation ID;
* propriedade;
* método;
* categoria de quota;
* duração;
* status;
* filtros resumidos;
* cache hit;
* tentativa;
* data;
* hora.

Não registrar secrets ou tokens.

⸻

76. Responsividade

Desktop

* sub-sidebar completa;
* data grids;
* gráficos amplos;
* múltiplos cards.

Notebook

* sidebar colapsável;
* cards reorganizados;
* gráficos adaptados.

Tablet

* navegação em drawer;
* filtros em sheet;
* grids simplificados.

Mobile

* cards;
* listas;
* gráficos reduzidos;
* filtros em tela cheia;
* ações em menu.

⸻

77. Acessibilidade

Implementar:

* teclado;
* foco visível;
* ARIA;
* contraste;
* descrições dos gráficos;
* status não dependentes apenas de cor;
* tooltips acessíveis;
* redução de movimento;
* tamanhos mínimos de clique;
* tabelas navegáveis.

⸻

78. Stack sugerida

* React;
* TypeScript;
* D3.js;
* Apache ECharts;
* AG Grid;
* TanStack Query;
* Zustand;
* Zod;
* React Hook Form;
* Radix UI;
* shadcn/ui;
* Lucide Icons;
* Framer Motion;
* date-fns;
* TanStack Virtual;
* SDKs oficiais do Google no backend;
* BigQuery client oficial, quando aplicável.

⸻

79. Fases de implementação

Fase 1 — Investigação

* propriedades;
* streams;
* tagging;
* eventos;
* GTM;
* BigQuery;
* credenciais;
* front-end;
* backend;
* banco;
* integrações.

Fase 2 — Estrutura visual e mocks

* botão na sidebar;
* ícone no header;
* shell;
* sub-sidebar;
* header interno;
* filtros;
* visão geral;
* tempo real;
* aquisição;
* páginas;
* eventos;
* conversões;
* funis;
* e-commerce;
* alertas.

Fase 3 — Analytics avançado

* D3;
* Sankey;
* jornadas;
* mapas;
* coortes;
* cross-filter;
* drill-down;
* atribuição;
* conciliação.

Fase 4 — Backend

* autenticação;
* Data API;
* Admin API;
* cache;
* banco local;
* jobs;
* quotas;
* logs;
* observabilidade.

Fase 5 — BigQuery

* vínculo;
* datasets;
* consultas;
* agregações;
* controle de custos;
* histórico.

Fase 6 — Measurement Protocol

* eventos server-side;
* validação;
* conciliação;
* segurança;
* homologação.

Fase 7 — Integração interna

* Ads;
* Meta Ads;
* E-commerce;
* Pipedrive;
* Bling;
* ERP;
* Financeiro.

Fase 8 — Homologação

* qualidade;
* performance;
* privacidade;
* acessibilidade;
* light e dark;
* responsividade;
* discrepâncias;
* quotas.

⸻

80. Critérios de aceite da investigação

A investigação será considerada concluída quando:

* contas e propriedades estiverem mapeadas;
* streams estiverem mapeados;
* tags estiverem identificadas;
* eventos estiverem catalogados;
* conversões estiverem documentadas;
* problemas de coleta estiverem descritos;
* credenciais e permissões estiverem validadas;
* BigQuery estiver avaliado;
* riscos estiverem documentados;
* plano de correção estiver definido.

⸻

81. Critérios de aceite visual

O módulo será considerado visualmente aprovado quando:

* possuir identidade premium;
* manter coerência com o Dshow Dash;
* possuir botão na sidebar;
* possuir ícone no header;
* possuir sub-sidebar expansível;
* utilizar D3.js;
* utilizar Apache ECharts;
* possuir data grids robustos;
* possuir zebra rows;
* possuir headers alinhados;
* apresentar filtros;
* apresentar drill-down;
* apresentar cross-filter;
* funcionar em light e dark;
* ser responsivo;
* não utilizar emojis;
* destacar informações prioritárias.

⸻

82. Critérios de aceite funcional

O módulo será considerado funcional quando:

* carregar propriedades autorizadas;
* alternar propriedades e streams;
* consultar períodos;
* comparar períodos;
* exibir tempo real;
* exibir aquisição;
* exibir páginas;
* exibir eventos;
* exibir conversões;
* exibir e-commerce;
* montar funis;
* exportar;
* preservar filtros;
* tratar falhas parciais;
* respeitar permissões;
* monitorar quotas;
* apresentar origem e atualização dos dados.

⸻

83. Critérios de aceite técnico

A implementação será considerada preparada quando:

* mocks estiverem separados;
* contrato de serviço estiver definido;
* front-end não acessar APIs externas diretamente;
* credenciais estiverem protegidas;
* adapter estiver implementado;
* consultas estiverem otimizadas;
* cache estiver implementado;
* quota estiver monitorada;
* BigQuery estiver desacoplado;
* logs possuírem correlation ID;
* dados pessoais não forem expostos;
* erros estiverem tratados;
* API real puder substituir mocks sem reconstrução.

⸻

84. Orientação final ao agente

Não criar o módulo Google Analytics como um conjunto de cards genéricos e cópias dos relatórios padrão do GA4.

O objetivo é transformar os dados em uma plataforma integrada de inteligência digital.

O módulo deverá permitir responder rapidamente:

* De onde vêm os usuários?
* Quais campanhas trazem tráfego de qualidade?
* Quais páginas convertem?
* Onde os usuários abandonam?
* Quais dispositivos apresentam problemas?
* Quais eventos deixaram de funcionar?
* Quantos leads gerados no site chegaram ao CRM?
* Quantas compras registradas no GA4 realmente foram faturadas?
* Qual canal gera receita e margem?
* Existem divergências entre Analytics, Ads, E-commerce e Bling?
* O sistema de mensuração está saudável?

A primeira versão com mocks deverá parecer próxima de produção.

A integração real deverá alterar principalmente:

* serviços;
* adapters;
* sincronização;
* cache;
* banco analítico;
* autenticação.

As telas, componentes, gráficos, data grids, filtros e fluxos de navegação não deverão precisar ser reconstruídos quando os dados reais forem conectados.