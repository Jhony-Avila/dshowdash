BRIEFING COMPLETO — MÓDULO MERCADO LIVRE NO DSHOW DASH

1. Visão geral do projeto

Desenvolver um novo módulo completo de gestão do Mercado Livre dentro do Dshow Dash.

O módulo deverá centralizar, em uma única interface, todas as informações operacionais, comerciais, financeiras e gerenciais relacionadas à operação da empresa no Mercado Livre.

Nesta primeira etapa, o módulo será desenvolvido utilizando dados mockados, permitindo:

* validar a arquitetura visual;
* validar os fluxos de navegação;
* definir indicadores e relatórios;
* testar os componentes;
* validar a experiência do usuário;
* preparar a estrutura de dados;
* simular cenários reais da operação;
* antecipar os requisitos da futura integração.

Posteriormente, os dados mockados deverão ser substituídos pela integração oficial com a API do Mercado Livre.

A arquitetura deve ser criada desde o início com separação clara entre:

* camada de apresentação;
* componentes visuais;
* serviços de dados;
* adaptadores de API;
* modelos e tipos;
* estado da aplicação;
* regras de negócio;
* permissões;
* armazenamento local;
* sincronização com o backend.

O front-end não deverá conhecer diretamente a origem dos dados. Ele deverá consumir uma camada de serviços padronizada, permitindo alternar entre:

* MockMercadoLivreService;
* ApiMercadoLivreService.

Essa separação é obrigatória para evitar retrabalho quando a API real for implementada.

⸻

2. Objetivos principais do módulo

O módulo Mercado Livre deverá permitir:

* acompanhar o desempenho geral da operação;
* visualizar vendas, pedidos e faturamento;
* gerenciar anúncios e produtos;
* acompanhar estoque e disponibilidade;
* monitorar preços, promoções e competitividade;
* consultar perguntas e interações com clientes;
* acompanhar reclamações, cancelamentos e devoluções;
* monitorar reputação e qualidade da conta;
* acompanhar envios e entregas;
* analisar taxas, custos e rentabilidade;
* identificar produtos mais vendidos;
* identificar anúncios com baixo desempenho;
* localizar problemas operacionais;
* comparar períodos;
* acompanhar metas e indicadores;
* realizar análises por produto, anúncio, categoria e período;
* futuramente executar ações operacionais pela API;
* reduzir a necessidade de acessar continuamente o painel externo do Mercado Livre.

O módulo deverá funcionar simultaneamente como:

1. painel executivo;
2. ferramenta analítica;
3. central operacional;
4. central de atendimento;
5. ferramenta de gestão de anúncios;
6. ferramenta de acompanhamento logístico;
7. ferramenta de análise financeira;
8. sistema de alertas e prioridades.

⸻

3. Formas de acesso ao módulo

3.1. Ícone existente no header

O módulo deverá ser aberto pelo ícone do Mercado Livre já existente no header do Dshow Dash.

Ao clicar no ícone:

* abrir o módulo dentro da área principal do Dshow Dash;
* não abrir nova aba;
* não redirecionar para o site externo do Mercado Livre;
* preservar o shell principal do sistema;
* destacar visualmente que o módulo Mercado Livre está ativo;
* manter o comportamento responsivo;
* registrar a última seção visitada.

O ícone do header deverá funcionar também como indicador resumido da operação.

Informações resumidas no ícone

O ícone poderá apresentar:

* badge com pedidos novos;
* badge com perguntas pendentes;
* badge com reclamações abertas;
* alerta de estoque crítico;
* alerta de anúncios pausados;
* alerta de falha de sincronização;
* quantidade de notificações não lidas.

O sistema deve evitar excesso de badges simultâneos. Utilizar prioridade visual.

Sugestão de prioridade:

1. erro crítico de integração;
2. reclamações ou mediações;
3. pedidos que exigem ação;
4. perguntas pendentes;
5. alertas de estoque;
6. demais notificações.

Tooltip do ícone

Ao posicionar o cursor sobre o ícone, exibir um resumo como:

Mercado Livre

* 12 pedidos novos;
* 5 perguntas pendentes;
* 2 reclamações abertas;
* 4 produtos com estoque crítico;
* última atualização: há 8 minutos.

Estados do ícone

O ícone deverá possuir estados visuais:

* conectado;
* sincronizando;
* atenção;
* erro;
* dados desatualizados;
* modo mock;
* conta não configurada.

No período de desenvolvimento com mocks, mostrar discretamente:

Ambiente de demonstração

ou:

Dados simulados

⸻

3.2. Novo botão na sidebar

Criar um novo botão específico do Mercado Livre na sidebar principal.

Características do botão

O botão deverá conter:

* ícone oficial ou representação visual coerente do Mercado Livre;
* label “Mercado Livre”;
* tooltip quando a sidebar estiver recolhida;
* estado ativo;
* estado hover;
* badge opcional;
* suporte à sidebar expandida e colapsada;
* acessibilidade por teclado;
* foco visível;
* feedback ao clicar.

Localização sugerida

Posicionar o botão dentro de uma seção relacionada a:

* Canais de venda;
* Marketplaces;
* E-commerce;
* Integrações comerciais.

Caso ainda não exista essa categoria na sidebar, criar uma seção chamada:

Canais de Venda

Dentro dela poderão futuramente existir:

* Mercado Livre;
* Loja do Painel de LED;
* LedLovers;
* outros marketplaces.

Comportamento

Ao clicar no botão:

* abrir o dashboard principal do Mercado Livre;
* manter o botão destacado;
* restaurar a última subseção utilizada;
* atualizar o breadcrumb;
* atualizar o título da página;
* permitir navegação interna sem recarregar toda a aplicação.

⸻

4. Estrutura geral de navegação

O módulo deverá possuir uma navegação interna própria.

Essa navegação pode ser implementada como:

* sub-sidebar interna;
* menu horizontal;
* combinação de menu lateral com abas contextuais.

Para um módulo dessa complexidade, recomenda-se uma sub-sidebar interna colapsável.

4.1. Seções principais

Criar as seguintes seções:

1. Visão Geral
2. Central Operacional
3. Pedidos
4. Vendas
5. Anúncios
6. Produtos
7. Estoque
8. Preços e Promoções
9. Perguntas
10. Mensagens e Atendimento
11. Reclamações
12. Cancelamentos e Devoluções
13. Envios e Logística
14. Reputação
15. Financeiro
16. Rentabilidade
17. Clientes
18. Concorrência
19. Relatórios
20. Alertas
21. Automações
22. Sincronização
23. Configurações

A estrutura deverá ser modular. Se alguma área ainda não tiver dados ou integração disponível, ela poderá aparecer com:

* dados simulados;
* estado “em preparação”;
* feature flag;
* acesso restrito;
* conteúdo desabilitado com explicação.

Não criar telas vazias sem contexto.

⸻

5. Header interno do módulo

O módulo deverá possuir um header interno padronizado.

5.1. Elementos obrigatórios

O header deverá conter:

* título “Mercado Livre”;
* subtítulo descritivo;
* seletor de conta;
* seletor de período;
* comparador de período;
* status da integração;
* data e hora da última atualização;
* botão de atualizar;
* botão de filtros;
* botão de exportação;
* botão de configurações;
* indicador de dados simulados enquanto estiver em mock.

Exemplo de subtítulo:

“Gestão comercial, operacional e financeira da operação no Mercado Livre.”

5.2. Seletor de conta

Preparar a arquitetura para suportar uma ou várias contas do Mercado Livre.

O seletor deverá permitir:

* todas as contas;
* conta individual;
* comparação entre contas;
* identificação por nome;
* identificação pelo nickname;
* status da conta;
* país ou site;
* reputação;
* última sincronização.

Mesmo que inicialmente exista apenas uma conta, a arquitetura não deve assumir que sempre haverá somente uma.

5.3. Períodos

Disponibilizar:

* hoje;
* ontem;
* últimos 7 dias;
* últimos 15 dias;
* últimos 30 dias;
* mês atual;
* mês anterior;
* trimestre atual;
* ano atual;
* últimos 12 meses;
* período personalizado.

5.4. Comparações

Permitir comparar com:

* período imediatamente anterior;
* mesmo período do mês anterior;
* mesmo período do ano anterior;
* meta configurada;
* média móvel;
* outra conta;
* outro anúncio;
* outro produto.

⸻

6. Dashboard — Visão Geral

A tela inicial deverá oferecer uma visão executiva e operacional da conta.

6.1. Linha de indicadores principais

Criar cards de KPI com:

* vendas brutas;
* vendas líquidas;
* quantidade de pedidos;
* itens vendidos;
* ticket médio;
* taxa de conversão;
* anúncios ativos;
* anúncios pausados;
* perguntas pendentes;
* reclamações abertas;
* cancelamentos;
* devoluções;
* estoque crítico;
* valor em estoque;
* custo de tarifas;
* custo de frete;
* margem estimada;
* reputação da conta.

Cada card deverá conter:

* valor principal;
* comparação percentual;
* comparação absoluta;
* período comparado;
* sparkline;
* ícone contextual;
* cor semântica;
* tooltip;
* possibilidade de clique para drill-down;
* indicação de tendência positiva, negativa ou neutra.

Não utilizar apenas verde e vermelho para representar resultados. Considerar o contexto do indicador.

Por exemplo:

* aumento de vendas: positivo;
* aumento de reclamações: negativo;
* aumento de cancelamentos: negativo;
* redução de estoque: pode ser positivo ou crítico, dependendo da cobertura.

⸻

6.2. Gráfico de evolução de vendas

Criar gráfico temporal utilizando Apache ECharts ou D3.

Exibir:

* faturamento bruto;
* faturamento líquido;
* pedidos;
* unidades vendidas;
* ticket médio;
* margem estimada.

Recursos:

* alternância entre métricas;
* múltiplos eixos quando necessário;
* zoom;
* brush temporal;
* tooltip compartilhado;
* comparação de períodos;
* seleção por dia, semana ou mês;
* destaque de anomalias;
* marcação de promoções;
* marcação de alterações de preço;
* marcação de rupturas de estoque.

⸻

6.3. Funil comercial

Criar um funil interativo contendo, conforme disponibilidade dos dados:

* visualizações dos anúncios;
* visitas;
* perguntas;
* adições ao carrinho;
* pedidos iniciados;
* vendas confirmadas;
* pedidos entregues;
* clientes recorrentes.

Utilizar D3 ou Apache ECharts.

Cada etapa deverá mostrar:

* quantidade;
* percentual de conversão;
* perda entre etapas;
* comparação com período anterior;
* possibilidade de filtrar os demais gráficos ao clicar.

⸻

6.4. Distribuição de vendas

Criar visualizações por:

* produto;
* anúncio;
* categoria;
* tipo de anúncio;
* modalidade logística;
* estado;
* cidade;
* dia da semana;
* horário;
* faixa de preço;
* conta.

Utilizar:

* treemap;
* sunburst;
* barras horizontais;
* donut;
* heatmap;
* mapa geográfico;
* small multiples.

Evitar excesso de gráficos de pizza.

⸻

6.5. Mapa geográfico de vendas

Criar mapa interativo com D3.

Apresentar:

* vendas por estado;
* pedidos por região;
* faturamento por estado;
* ticket médio por localidade;
* prazo médio de entrega;
* atrasos;
* cancelamentos;
* reclamações;
* concentração de clientes.

Recursos:

* zoom;
* tooltip;
* seleção de métrica;
* escala visual;
* drill-down;
* ranking lateral;
* filtro cruzado;
* comparação entre períodos.

⸻

6.6. Painel de atenção imediata

Criar uma área chamada:

Exige atenção

Apresentar cards priorizados com:

* pedidos aguardando ação;
* envios atrasados;
* reclamações abertas;
* perguntas sem resposta;
* anúncios pausados;
* anúncios em revisão;
* produtos sem estoque;
* divergências de estoque;
* preços abaixo da margem;
* produtos com queda de conversão;
* falhas de sincronização;
* tokens próximos de expirar;
* alterações incomuns de desempenho.

Cada item deve possuir:

* nível de prioridade;
* responsável;
* prazo;
* ação recomendada;
* botão de acesso;
* opção de marcar como tratado;
* histórico da ocorrência.

⸻

7. Central Operacional

Criar uma tela consolidada para apresentar todas as tarefas pendentes da operação.

7.1. Filas operacionais

Organizar em filas:

* pedidos novos;
* pedidos aguardando faturamento;
* pedidos aguardando separação;
* pedidos aguardando envio;
* envios atrasados;
* perguntas pendentes;
* reclamações abertas;
* devoluções em andamento;
* anúncios com problemas;
* estoque crítico;
* divergências financeiras;
* erros de sincronização.

7.2. Recursos

A central deverá permitir:

* filtrar por prioridade;
* filtrar por responsável;
* filtrar por prazo;
* filtrar por conta;
* ordenar por urgência;
* atribuir responsável;
* adicionar observação interna;
* marcar tarefa como concluída;
* abrir detalhes em drawer;
* executar ações em lote;
* salvar visualizações;
* criar alertas.

⸻

8. Gestão de pedidos

Criar uma tela completa para consulta e futura gestão de pedidos.

8.1. Data grid de pedidos

Utilizar um data grid robusto.

Bibliotecas recomendadas:

* AG Grid;
* TanStack Table com virtualização;
* MUI X Data Grid Pro, se o licenciamento for aprovado.

A recomendação principal é AG Grid para tabelas operacionais complexas.

8.2. Colunas sugeridas

* ID do pedido;
* status;
* data;
* hora;
* comprador;
* produto;
* SKU;
* anúncio;
* quantidade;
* valor bruto;
* desconto;
* tarifa;
* frete;
* valor líquido;
* modalidade de envio;
* prazo;
* status logístico;
* nota fiscal;
* reclamação;
* devolução;
* conta;
* responsável;
* última atualização.

8.3. Recursos obrigatórios do data grid

* virtualização;
* paginação;
* ordenação múltipla;
* redimensionamento de colunas;
* reordenação de colunas;
* fixação de colunas;
* agrupamento;
* agregações;
* filtros por coluna;
* filtro global;
* busca rápida;
* seleção múltipla;
* expansão de linhas;
* exportação;
* densidade configurável;
* salvamento de preferência;
* formatação condicional;
* colunas personalizáveis;
* carregamento incremental;
* skeleton loading;
* estado vazio;
* estado de erro;
* atualização otimista;
* ações em lote.

Aplicar alternância suave de cores entre linhas, sem comprometer a legibilidade.

8.4. Detalhe do pedido

Ao clicar em um pedido, abrir um drawer lateral ou página detalhada com:

* resumo;
* itens;
* comprador;
* pagamento;
* envio;
* endereço;
* nota fiscal;
* valores;
* tarifas;
* mensagens;
* perguntas relacionadas;
* reclamações;
* devoluções;
* histórico;
* eventos;
* observações internas;
* integrações com ERP.

Criar uma timeline visual desde a compra até a conclusão.

⸻

9. Gestão de vendas

A tela de vendas deverá apresentar análises comerciais detalhadas.

9.1. Indicadores

* vendas brutas;
* vendas líquidas;
* pedidos aprovados;
* unidades vendidas;
* ticket médio;
* preço médio;
* conversão;
* cancelamentos;
* devoluções;
* clientes novos;
* clientes recorrentes;
* crescimento;
* participação por produto;
* participação por categoria.

9.2. Gráficos

* evolução de vendas;
* vendas acumuladas;
* comparação entre períodos;
* curva ABC;
* Pareto de produtos;
* heatmap de vendas por dia e hora;
* vendas por faixa de preço;
* vendas por categoria;
* vendas por modalidade logística;
* vendas por região;
* vendas por anúncio;
* decomposição de receita.

9.3. Decomposição da receita

Criar waterfall chart com:

* valor bruto;
* descontos;
* tarifas;
* impostos estimados;
* frete;
* cancelamentos;
* devoluções;
* custo do produto;
* valor líquido;
* margem estimada.

Utilizar Apache ECharts ou D3.

⸻

10. Gestão de anúncios

Criar uma área completa de gestão de anúncios.

10.1. Resumo

Apresentar:

* anúncios ativos;
* pausados;
* encerrados;
* em revisão;
* com erro;
* sem estoque;
* com baixa exposição;
* com queda de conversão;
* com preço abaixo da margem;
* com conteúdo incompleto;
* com necessidade de atualização.

10.2. Data grid de anúncios

Colunas:

* imagem;
* ID;
* título;
* SKU;
* produto interno;
* categoria;
* tipo de anúncio;
* preço;
* preço promocional;
* estoque;
* visitas;
* vendas;
* conversão;
* faturamento;
* tarifa;
* margem;
* status;
* qualidade;
* reputação relacionada;
* última alteração;
* ações.

10.3. Recursos futuros

Preparar a interface para:

* criar anúncio;
* editar anúncio;
* pausar;
* reativar;
* encerrar;
* alterar preço;
* alterar estoque;
* alterar descrição;
* alterar atributos;
* alterar imagens;
* duplicar anúncio;
* associar a produto interno;
* consultar erros;
* visualizar histórico de alterações;
* comparar versões;
* executar ações em lote.

Essas ações deverão ficar em modo simulado durante a fase de mock.

Mostrar uma confirmação clara quando uma ação for apenas simulada.

10.4. Análise de qualidade do anúncio

Criar score visual considerando:

* qualidade do título;
* preenchimento de atributos;
* quantidade de imagens;
* qualidade das imagens;
* descrição;
* competitividade de preço;
* disponibilidade de estoque;
* velocidade de atendimento;
* conversão;
* reclamações;
* devoluções;
* desempenho logístico.

O score deverá explicar quais fatores aumentaram ou reduziram a nota.

⸻

11. Gestão de produtos

Criar uma separação conceitual entre:

* produto interno;
* SKU;
* anúncio do Mercado Livre;
* variação;
* estoque;
* preço;
* categoria.

Um produto interno poderá estar relacionado a:

* um anúncio;
* vários anúncios;
* diferentes tipos de anúncio;
* diferentes contas;
* diferentes variações.

11.1. Tela de produtos

Apresentar:

* produto;
* SKU;
* categoria;
* quantidade de anúncios vinculados;
* estoque total;
* estoque disponível;
* estoque reservado;
* custo;
* preço médio;
* faturamento;
* unidades vendidas;
* margem;
* cobertura de estoque;
* status.

11.2. Associação com ERP

Preparar a estrutura para relacionar os dados do Mercado Livre com:

* produtos internos;
* estoque do ERP;
* pedidos;
* clientes;
* recebimentos;
* notas fiscais;
* custos;
* centros de resultado;
* vendedores;
* canais de origem.

Criar interface de conciliação para produtos não associados.

⸻

12. Gestão de estoque

12.1. Indicadores

* estoque total;
* estoque disponível;
* estoque reservado;
* produtos sem estoque;
* estoque crítico;
* excesso de estoque;
* valor em estoque;
* cobertura média;
* risco de ruptura;
* divergências entre sistemas.

12.2. Gráficos

* cobertura de estoque;
* projeção de ruptura;
* giro por produto;
* curva ABC;
* estoque versus vendas;
* produtos parados;
* evolução de estoque;
* matriz giro versus margem.

12.3. Matriz de estoque

Criar uma matriz interativa com:

* alto giro e alta margem;
* alto giro e baixa margem;
* baixo giro e alta margem;
* baixo giro e baixa margem.

Utilizar D3 para permitir seleção, zoom e tooltip.

12.4. Alertas

* estoque zerado;
* estoque abaixo do mínimo;
* risco de ruptura;
* divergência entre ERP e marketplace;
* venda de item indisponível;
* estoque excessivo;
* produto sem movimentação;
* produto com reserva elevada.

⸻

13. Preços e promoções

Criar uma área para analisar e, futuramente, gerenciar preços.

13.1. Indicadores

* preço atual;
* preço médio;
* preço promocional;
* desconto;
* margem;
* tarifa;
* custo;
* competitividade;
* conversão antes e depois da alteração;
* elasticidade estimada.

13.2. Histórico de preços

Criar gráfico temporal com:

* preço normal;
* preço promocional;
* custo;
* margem;
* volume de vendas;
* conversão;
* estoque.

Marcar no gráfico:

* alterações manuais;
* promoções;
* início e fim de campanhas;
* mudanças de tarifa;
* ruptura de estoque.

13.3. Simulador de preço

Criar simulador com:

* custo do produto;
* preço de venda;
* desconto;
* tarifa;
* frete;
* imposto estimado;
* outros custos;
* margem nominal;
* margem percentual;
* lucro unitário;
* ponto de equilíbrio.

O simulador deverá ser claramente identificado como estimativa, especialmente enquanto não houver todas as fontes financeiras integradas.

⸻

14. Perguntas

Criar uma central de perguntas recebidas nos anúncios.

14.1. Visualização

Apresentar:

* pergunta;
* anúncio;
* produto;
* comprador;
* data;
* tempo aguardando;
* status;
* responsável;
* resposta;
* prioridade.

14.2. Recursos

Preparar para:

* responder;
* salvar respostas rápidas;
* usar templates;
* buscar informações no ERP;
* associar perguntas semelhantes;
* atribuir responsável;
* marcar como resolvida;
* visualizar histórico;
* filtrar perguntas sem resposta;
* identificar perguntas recorrentes.

14.3. Indicadores

* perguntas recebidas;
* perguntas respondidas;
* perguntas pendentes;
* tempo médio de resposta;
* percentual respondido;
* conversão após pergunta;
* assuntos mais frequentes;
* desempenho por responsável.

A documentação oficial da plataforma possui recursos relacionados a perguntas e respostas, mas os endpoints, permissões e limitações deverão ser novamente validados na etapa de integração real. (⁠Mercado Livre Developers)

⸻

15. Mensagens e atendimento

Criar uma central de atendimento relacionada aos pedidos.

15.1. Interface

Utilizar layout semelhante a uma caixa de entrada:

* lista de conversas à esquerda;
* conversa no centro;
* detalhes do pedido à direita;
* filtros no topo;
* status e responsável;
* campo de resposta;
* anexos;
* respostas rápidas;
* observações internas.

15.2. Organização

Separar:

* novas;
* aguardando resposta;
* respondidas;
* urgentes;
* reclamações;
* devoluções;
* pós-venda;
* arquivadas.

15.3. Indicadores

* conversas abertas;
* tempo de primeira resposta;
* tempo médio de resolução;
* atendimentos por período;
* assuntos recorrentes;
* satisfação, quando disponível;
* produtividade por atendente.

⸻

16. Reclamações, cancelamentos e devoluções

Criar uma área de gestão de ocorrências.

16.1. Indicadores

* reclamações abertas;
* reclamações encerradas;
* mediações;
* cancelamentos;
* devoluções;
* taxa por pedido;
* valor impactado;
* produtos com mais ocorrências;
* causas principais;
* tempo médio de resolução.

16.2. Data grid

Colunas:

* ID;
* tipo;
* pedido;
* cliente;
* produto;
* motivo;
* status;
* data de abertura;
* prazo;
* valor;
* impacto;
* responsável;
* última interação;
* ação necessária.

16.3. Análises

* Pareto de motivos;
* evolução temporal;
* incidência por produto;
* incidência por anúncio;
* incidência por modalidade logística;
* reincidência;
* impacto financeiro;
* tempo de resolução;
* matriz gravidade versus frequência.

⸻

17. Envios e logística

Criar uma visão completa da operação logística.

17.1. Indicadores

* pedidos aguardando envio;
* pedidos enviados;
* entregues;
* atrasados;
* extraviados;
* devolvidos;
* prazo médio;
* percentual entregue no prazo;
* custo de frete;
* tempo de preparação;
* tempo de transporte.

17.2. Visualizações

* timeline dos envios;
* mapa de entregas;
* entregas por região;
* prazo prometido versus realizado;
* heatmap de atrasos;
* ranking de localidades;
* distribuição do tempo de entrega;
* funil logístico;
* gráfico de status.

17.3. Rastreamento

A tela detalhada deverá permitir visualizar:

* código de rastreamento;
* modalidade;
* transportadora;
* origem;
* destino;
* eventos logísticos;
* previsão;
* entrega;
* atraso;
* ocorrência;
* contato com cliente;
* pedido relacionado.

⸻

18. Reputação

Criar uma tela dedicada à reputação da conta.

18.1. Indicadores

* nível de reputação;
* vendas concluídas;
* reclamações;
* cancelamentos;
* atrasos;
* devoluções;
* qualidade de atendimento;
* tendência da reputação;
* fatores de risco.

18.2. Evolução

Criar gráfico temporal mostrando:

* score;
* reclamações;
* cancelamentos;
* atrasos;
* volume de vendas;
* marcos de alteração de nível.

18.3. Simulação

Criar uma ferramenta de simulação, claramente identificada como estimativa, mostrando:

* quais indicadores precisam melhorar;
* impacto potencial da redução de reclamações;
* impacto potencial da redução de atrasos;
* quantidade estimada de pedidos necessária para diluir ocorrências;
* riscos de queda de reputação.

Não apresentar a simulação como regra oficial sem validação documental.

⸻

19. Financeiro

Criar uma área para consolidar os valores financeiros relacionados ao marketplace.

19.1. Indicadores

* vendas brutas;
* descontos;
* tarifas;
* fretes;
* impostos estimados;
* cancelamentos;
* devoluções;
* recebimentos;
* valores pendentes;
* valor líquido;
* custo dos produtos;
* lucro bruto;
* margem.

19.2. Conciliação

Preparar uma tela de conciliação entre:

* pedido;
* pagamento;
* repasse;
* tarifa;
* frete;
* nota fiscal;
* recebimento no ERP;
* devolução;
* estorno;
* divergência.

19.3. Data grid financeiro

Colunas:

* pedido;
* data da venda;
* data prevista;
* data do recebimento;
* valor bruto;
* desconto;
* tarifa;
* frete;
* imposto;
* estorno;
* valor líquido;
* status;
* ERP;
* divergência;
* ações.

19.4. Recursos

* filtros avançados;
* totalizadores;
* agrupamento;
* reconciliação;
* exportação;
* marcação de divergência;
* observações;
* auditoria;
* associação manual.

⸻

20. Rentabilidade

Criar uma área específica para análise de rentabilidade.

20.1. Dimensões

Analisar rentabilidade por:

* produto;
* SKU;
* anúncio;
* categoria;
* pedido;
* período;
* conta;
* modalidade de anúncio;
* região;
* campanha;
* faixa de preço.

20.2. Indicadores

* receita;
* custo;
* tarifa;
* frete;
* imposto;
* desconto;
* devolução;
* margem de contribuição;
* lucro;
* margem percentual;
* retorno sobre estoque.

20.3. Visualizações

* waterfall;
* matriz margem versus volume;
* Pareto de lucro;
* produtos rentáveis;
* produtos com prejuízo;
* evolução da margem;
* margem por categoria;
* margem por anúncio.

⸻

21. Clientes

Criar uma visão analítica de clientes, respeitando as permissões e os dados disponibilizados pela integração.

21.1. Indicadores

* clientes únicos;
* clientes novos;
* clientes recorrentes;
* frequência de compra;
* ticket médio;
* valor acumulado;
* regiões;
* produtos comprados;
* cancelamentos;
* reclamações.

21.2. Segmentações

* novos;
* recorrentes;
* alto valor;
* inativos;
* com reclamação;
* com devolução;
* por região;
* por categoria de produto.

Evitar expor informações pessoais desnecessárias. Aplicar mascaramento e controle de acesso.

⸻

22. Concorrência e mercado

Criar uma área preparada para análises competitivas, desde que os dados sejam disponibilizados legalmente pela API ou por fontes autorizadas.

Possíveis análises:

* comparação de preços;
* posição competitiva;
* faixa de preço da categoria;
* tendências de mercado;
* produtos em destaque;
* variação de preço;
* qualidade dos anúncios;
* participação estimada;
* oportunidades de categoria.

Não utilizar scraping não autorizado.

Os dados desta área deverão ser marcados com:

* fonte;
* data de coleta;
* nível de confiança;
* limitações;
* escopo.

⸻

23. Relatórios

Criar uma central de relatórios.

23.1. Relatórios sugeridos

* vendas por período;
* pedidos;
* produtos;
* anúncios;
* estoque;
* preços;
* tarifas;
* rentabilidade;
* logística;
* reclamações;
* devoluções;
* perguntas;
* atendimento;
* reputação;
* conciliação financeira;
* desempenho por categoria;
* produtos sem venda;
* estoque parado;
* anúncios com baixa conversão.

23.2. Recursos

* filtros salvos;
* colunas personalizadas;
* agrupamento;
* ordenação;
* exportação CSV;
* exportação XLSX;
* exportação PDF;
* impressão;
* geração de link;
* agendamento futuro;
* favoritos;
* histórico de relatórios;
* templates.

⸻

24. Sistema de alertas

Criar uma central de alertas configurável.

24.1. Tipos de alerta

* pedido aguardando ação;
* atraso no envio;
* pergunta sem resposta;
* reclamação aberta;
* prazo próximo;
* estoque crítico;
* estoque zerado;
* divergência de estoque;
* anúncio pausado;
* anúncio com erro;
* queda de conversão;
* queda de vendas;
* preço abaixo da margem;
* aumento de cancelamentos;
* aumento de devoluções;
* queda de reputação;
* falha de sincronização;
* token expirado;
* dados desatualizados.

24.2. Configuração

Permitir:

* ativar ou desativar;
* definir limite;
* escolher conta;
* escolher produto;
* escolher anúncio;
* definir prioridade;
* escolher destinatários;
* definir cooldown;
* evitar alertas duplicados;
* definir horário;
* definir canal;
* registrar resolução.

⸻

25. Automações

Preparar uma área para futuras automações.

Exemplos:

* atribuição automática de perguntas;
* respostas sugeridas;
* alerta automático de estoque;
* pausa automática por estoque zerado;
* atualização de estoque;
* atualização de preços;
* criação de tarefas;
* classificação de reclamações;
* identificação de anomalias;
* conciliação;
* geração de relatórios.

Toda automação deverá possuir:

* nome;
* descrição;
* gatilho;
* condições;
* ações;
* status;
* última execução;
* próxima execução;
* logs;
* usuário criador;
* opção de teste;
* opção de pausar;
* histórico.

Ações que alterem dados externos deverão exigir controles adicionais.

⸻

26. Experiência visual — UI

O módulo deve possuir identidade visual sofisticada, mas integrada ao design system do Dshow Dash.

26.1. Direção visual

Utilizar:

* amarelo do Mercado Livre como cor de identificação;
* azul como cor de apoio;
* cores neutras para estrutura;
* cores semânticas para status;
* gradientes suaves;
* sombras discretas;
* bordas refinadas;
* espaços consistentes;
* boa hierarquia tipográfica;
* microinterações;
* animações funcionais;
* ícones SVG;
* estados de hover;
* skeletons;
* drawers;
* tooltips;
* popovers;
* command palette.

Não preencher toda a interface de amarelo.

O amarelo deverá ser aplicado em:

* elementos ativos;
* detalhes;
* ícones;
* badges;
* indicadores;
* bordas de destaque;
* gráficos específicos;
* chamadas de atenção moderadas.

26.2. Ícones

Bibliotecas recomendadas:

* Lucide Icons;
* Phosphor Icons;
* Tabler Icons.

Padronizar:

* tamanho;
* stroke;
* alinhamento;
* área de clique;
* tooltip;
* uso semântico.

Não misturar várias famílias de ícones na mesma interface sem necessidade.

⸻

27. Bibliotecas de gráficos

Apache ECharts e D3.js deverão ser tratados como bibliotecas principais e no mesmo nível de importância.

27.1. Apache ECharts

Utilizar principalmente em:

* séries temporais;
* barras;
* linhas;
* áreas;
* donuts;
* gauges;
* funis;
* heatmaps;
* scatter plots;
* waterfalls;
* gráficos combinados;
* zoom temporal;
* tooltips;
* dashboards executivos.

27.2. D3.js

Utilizar principalmente em:

* mapas;
* visualizações altamente personalizadas;
* diagramas de relacionamento;
* matrizes;
* gráficos de fluxo;
* Sankey;
* treemaps customizados;
* sunburst;
* visualizações de rede;
* animações analíticas;
* interações coordenadas;
* gráficos específicos que não sejam bem atendidos por componentes prontos.

27.3. Regra de utilização

Não utilizar D3 somente como recurso complementar.

D3 e Apache ECharts deverão ser considerados duas ferramentas principais:

* Apache ECharts para produtividade e visualizações analíticas padronizadas;
* D3 para visualizações customizadas, relacionais, geográficas e de maior complexidade.

27.4. Integração entre gráficos

Os gráficos deverão suportar:

* cross-filter;
* highlight compartilhado;
* drill-down;
* seleção;
* zoom;
* reset;
* tooltips consistentes;
* exportação;
* acessibilidade;
* adaptação responsiva;
* estados vazios;
* loading;
* erro.

⸻

28. Data grids robustos

Todas as tabelas operacionais e analíticas deverão ser transformadas em data grids robustos.

Não utilizar tabelas HTML simples para áreas com alto volume de dados.

28.1. Recursos mínimos

* virtualização;
* filtros por coluna;
* busca global;
* ordenação;
* múltipla ordenação;
* agrupamento;
* agregações;
* pinagem;
* redimensionamento;
* reordenação;
* seleção;
* ações em lote;
* linhas expansíveis;
* edição controlada;
* exportação;
* preferências por usuário;
* zebra rows;
* destaque de status;
* paginação;
* infinite scroll quando adequado;
* colunas dinâmicas;
* totalizadores;
* menus contextuais;
* atalhos de teclado;
* densidade ajustável.

28.2. Padrão visual

Os grids deverão ter:

* headers alinhados;
* alturas consistentes;
* tipografia legível;
* cores alternadas nas linhas;
* estados hover;
* seleção clara;
* bordas discretas;
* colunas numéricas alinhadas à direita;
* textos alinhados à esquerda;
* status centralizados quando adequado;
* moedas em padrão brasileiro;
* datas em padrão brasileiro;
* tooltips para conteúdo truncado.

28.3. Valores monetários

Utilizar:

* R$ 1.234,56;
* separador de milhar;
* duas casas decimais;
* alinhamento à direita;
* valores negativos claramente identificados;
* totalizadores consistentes.

⸻

29. Filtros globais e filtros avançados

Criar uma barra global de filtros.

29.1. Filtros sugeridos

* conta;
* período;
* comparação;
* status;
* produto;
* SKU;
* anúncio;
* categoria;
* cliente;
* estado;
* cidade;
* modalidade de envio;
* tipo de anúncio;
* faixa de preço;
* responsável;
* ocorrência;
* rentabilidade;
* estoque.

29.2. Recursos

* chips dos filtros ativos;
* contador de filtros;
* limpar todos;
* salvar visualização;
* filtros favoritos;
* filtros recentes;
* presets;
* compartilhamento;
* aplicação automática ou manual;
* persistência por usuário.

⸻

30. Drill-down e navegação contextual

Todos os indicadores e gráficos relevantes deverão permitir aprofundamento.

Exemplos:

* clicar em vendas abre pedidos relacionados;
* clicar em reclamações abre a lista filtrada;
* clicar em um estado abre vendas daquela região;
* clicar em um produto abre sua análise;
* clicar em anúncio abre sua ficha;
* clicar em estoque crítico abre produtos afetados;
* clicar em tarifa abre lançamentos financeiros;
* clicar em um ponto do gráfico abre os dados do período.

O usuário deverá conseguir voltar ao contexto anterior sem perder os filtros.

⸻

31. Busca global

Criar busca dentro do módulo para localizar:

* pedido;
* produto;
* SKU;
* anúncio;
* cliente;
* pergunta;
* reclamação;
* envio;
* rastreamento;
* ID externo;
* ID interno.

A busca poderá ser acessada por:

* campo no header;
* atalho de teclado;
* command palette.

⸻

32. Responsividade

O módulo deverá funcionar em:

* desktop;
* notebooks;
* tablets;
* telas menores.

A prioridade principal é desktop, devido à densidade operacional.

Em telas menores:

* data grids poderão usar visualização por cards;
* sub-sidebar poderá ser recolhida;
* filtros poderão abrir em drawer;
* KPIs deverão reorganizar-se;
* gráficos deverão manter legibilidade;
* colunas menos importantes poderão ser ocultadas.

⸻

33. Acessibilidade

Implementar:

* navegação por teclado;
* foco visível;
* labels;
* aria attributes;
* contraste adequado;
* tooltips acessíveis;
* estados não dependentes apenas de cor;
* textos alternativos;
* suporte a redução de movimento;
* leitura coerente por tecnologias assistivas.

⸻

34. Estados da interface

Todas as telas deverão possuir estados explícitos.

34.1. Loading

* skeletons;
* placeholders;
* progressivos;
* sem travar toda a tela.

34.2. Sem dados

Explicar:

* por que não existem dados;
* se o filtro está restringindo;
* qual ação pode ser tomada;
* se a integração ainda não foi configurada.

34.3. Erro

Mostrar:

* descrição amigável;
* código técnico recolhível;
* opção de tentar novamente;
* data e hora;
* origem;
* botão para copiar detalhes.

34.4. Dados desatualizados

Mostrar:

* última atualização válida;
* motivo;
* impacto;
* tentativa de sincronização;
* botão de atualizar.

34.5. Mock

Enquanto os dados forem simulados, apresentar um aviso persistente, porém discreto:

“Ambiente de demonstração — os dados exibidos são simulados.”

Não permitir que o usuário confunda dados mockados com dados reais.

⸻

35. Dados mockados

Criar uma camada de mocks realista e completa.

35.1. Cenários obrigatórios

Os mocks deverão incluir:

* períodos com crescimento;
* períodos com queda;
* pedidos novos;
* pedidos concluídos;
* pedidos cancelados;
* devoluções;
* reclamações;
* perguntas pendentes;
* atrasos;
* produtos sem estoque;
* produtos com alto giro;
* produtos com baixa margem;
* anúncios pausados;
* anúncios com erro;
* contas saudáveis;
* alertas críticos;
* dados vazios;
* falhas simuladas;
* sincronização lenta;
* diferenças entre contas.

35.2. Requisitos

* IDs coerentes;
* relacionamentos consistentes;
* datas plausíveis;
* valores em reais;
* produtos relacionados aos anúncios;
* pedidos relacionados aos clientes;
* pagamentos relacionados aos pedidos;
* envios relacionados aos pedidos;
* histórico temporal consistente.

35.3. Controle de cenário

Criar um seletor de cenário em ambiente de desenvolvimento:

* operação saudável;
* pico de vendas;
* crise logística;
* queda de reputação;
* estoque crítico;
* falha de sincronização;
* sem dados;
* alto volume.

Esse seletor não deverá aparecer em produção.

⸻

36. Arquitetura para futura API

A integração real deverá utilizar uma camada intermediária no backend.

O navegador não deverá acessar diretamente a API externa com credenciais sensíveis.

36.1. Estrutura sugerida

* Mercado Livre API;
* serviço de integração backend;
* fila de sincronização;
* banco local;
* cache;
* API interna do Dshow Dash;
* front-end.

36.2. Fluxo recomendado

1. usuário autoriza a conta;
2. backend recebe autorização;
3. credenciais são armazenadas de forma segura;
4. backend consulta a API;
5. dados são normalizados;
6. dados são persistidos localmente;
7. front-end consulta a API interna;
8. notificações atualizam dados críticos;
9. jobs periódicos reconciliam o histórico.

A autorização deverá ser implementada com o fluxo oficial suportado pela plataforma, sem armazenar senha da conta do usuário. O desenho técnico definitivo deverá ser validado na documentação oficial vigente durante a integração.

36.3. Adapter pattern

Criar uma interface semelhante a:

interface MercadoLivreService {
  getOverview(filters: OverviewFilters): Promise<OverviewData>;
  getOrders(filters: OrderFilters): Promise<Paginated<Order>>;
  getOrder(id: string): Promise<OrderDetails>;
  getItems(filters: ItemFilters): Promise<Paginated<Item>>;
  getQuestions(filters: QuestionFilters): Promise<Paginated<Question>>;
  getClaims(filters: ClaimFilters): Promise<Paginated<Claim>>;
  getShipments(filters: ShipmentFilters): Promise<Paginated<Shipment>>;
  getFinancialSummary(filters: FinancialFilters): Promise<FinancialSummary>;
  getAlerts(filters: AlertFilters): Promise<Alert[]>;
}

Implementar:

class MockMercadoLivreService implements MercadoLivreService

e futuramente:

class ApiMercadoLivreService implements MercadoLivreService

⸻

37. Sincronização

Criar uma tela específica de sincronização.

37.1. Informações

* conta;
* status;
* última sincronização;
* próxima sincronização;
* duração;
* registros processados;
* registros novos;
* registros atualizados;
* registros com erro;
* cursor ou watermark;
* origem;
* endpoint;
* logs.

37.2. Estratégia

Preparar:

* carga inicial completa;
* sincronização incremental;
* reconciliação periódica;
* processamento por fila;
* retry;
* backoff;
* rate limiting;
* dead-letter queue;
* idempotência;
* deduplicação;
* observabilidade.

37.3. Notificações

A futura integração poderá utilizar notificações da plataforma, quando disponíveis, combinadas com sincronização periódica.

As notificações não deverão ser tratadas como única fonte de verdade. Criar rotinas de reconciliação.

⸻

38. Modelo de dados local

Criar modelo de dados normalizado, com campos para preservar os IDs externos.

Entidades sugeridas:

* marketplace_accounts;
* marketplace_users;
* marketplace_items;
* marketplace_item_variations;
* marketplace_products_map;
* marketplace_orders;
* marketplace_order_items;
* marketplace_buyers;
* marketplace_payments;
* marketplace_shipments;
* marketplace_shipment_events;
* marketplace_questions;
* marketplace_messages;
* marketplace_claims;
* marketplace_returns;
* marketplace_fees;
* marketplace_price_history;
* marketplace_stock_history;
* marketplace_reputation_history;
* marketplace_notifications;
* marketplace_sync_jobs;
* marketplace_sync_errors;
* marketplace_alerts;
* marketplace_audit_logs.

Cada tabela deverá possuir, quando aplicável:

* ID interno;
* ID externo;
* conta;
* status;
* payload original;
* data de criação externa;
* data de atualização externa;
* data de sincronização;
* versão;
* hash;
* exclusão lógica;
* auditoria.

⸻

39. Segurança e permissões

Criar permissões específicas.

39.1. Perfis sugeridos

Administrador

* acesso completo;
* configurações;
* contas;
* integrações;
* ações operacionais;
* permissões;
* logs;
* financeiro.

Gestor

* dashboards;
* pedidos;
* anúncios;
* produtos;
* atendimento;
* relatórios;
* ações autorizadas.

Operacional

* pedidos;
* envios;
* perguntas;
* reclamações;
* tarefas.

Financeiro

* vendas;
* taxas;
* recebimentos;
* conciliação;
* rentabilidade;
* exportação.

Somente leitura

* consulta;
* dashboards;
* relatórios autorizados.

39.2. Auditoria

Registrar:

* usuário;
* ação;
* entidade;
* valor anterior;
* valor novo;
* data;
* hora;
* IP;
* origem;
* resultado;
* ID de correlação.

⸻

40. Performance

O módulo deverá suportar alto volume de dados.

Implementar:

* lazy loading;
* virtualização;
* cache;
* paginação server-side;
* filtros server-side;
* agregações server-side;
* debounce;
* memoização;
* code splitting;
* carregamento por rota;
* cancelamento de requisições;
* prefetch seletivo;
* redução de payload;
* compressão;
* índices no banco.

Não carregar todo o histórico de pedidos no navegador.

⸻

41. Observabilidade

Criar monitoramento técnico para:

* disponibilidade;
* latência;
* falhas;
* sincronização;
* volume;
* filas;
* retries;
* rate limits;
* tokens;
* endpoints;
* erros por conta;
* erros por operação;
* dados desatualizados.

Disponibilizar logs com:

* correlation ID;
* conta;
* operação;
* recurso;
* status;
* duração;
* tentativa;
* resposta resumida;
* data e hora.

⸻

42. Integração com o Dshow Dash

O módulo deverá respeitar:

* autenticação existente;
* tema;
* sidebar;
* header;
* layout principal;
* sistema de rotas;
* permissões;
* notificações;
* padrões de modal;
* padrões de drawer;
* padrões de data grid;
* design tokens;
* responsividade;
* tratamento de erros.

Não criar uma aplicação visualmente desconectada do restante do Dshow Dash.

Ao mesmo tempo, o módulo deverá possuir identidade própria suficiente para ser reconhecido como a área do Mercado Livre.

⸻

43. Sugestão de stack visual

Recomendações:

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
* React Router, caso compatível com o shell;
* react-window ou TanStack Virtual, quando necessário.

Caso o shell atual não utilize React, avaliar uma implementação isolada como microfrontend, sem comprometer o roteamento principal.

⸻

44. Primeira fase de implementação

Fase 1 — Estrutura e mocks

Implementar:

* botão na sidebar;
* acesso pelo header;
* shell do módulo;
* sub-sidebar;
* design system;
* rotas internas;
* filtros globais;
* mock service;
* dashboard geral;
* pedidos;
* anúncios;
* produtos;
* estoque;
* perguntas;
* reclamações;
* envios;
* financeiro;
* reputação;
* alertas;
* sincronização simulada.

Fase 2 — Elevação analítica

Implementar:

* gráficos avançados;
* mapas;
* drill-down;
* cross-filter;
* relatórios;
* rentabilidade;
* conciliação;
* automações simuladas;
* preferências;
* exportações.

Fase 3 — Backend de integração

Implementar:

* autenticação;
* armazenamento seguro;
* banco local;
* sincronização;
* filas;
* jobs;
* logs;
* API interna;
* notificações;
* reconciliação.

Fase 4 — Substituição dos mocks

* conectar dados reais;
* validar modelos;
* mapear diferenças;
* revisar permissões;
* validar limites da API;
* testar contas;
* testar volume;
* homologar ações operacionais.

Fase 5 — Operações de escrita

Após homologação:

* responder perguntas;
* editar anúncios;
* atualizar preço;
* atualizar estoque;
* pausar e ativar;
* executar ações em lote;
* registrar auditoria;
* implementar confirmações;
* implementar rollback quando possível.

⸻

45. Critérios de aceite

O módulo será considerado visualmente aprovado quando:

* possuir botão na sidebar;
* abrir pelo ícone do header;
* possuir navegação interna clara;
* apresentar identidade visual consistente;
* utilizar D3 e Apache ECharts;
* possuir data grids robustos;
* apresentar filtros globais;
* possuir drill-down;
* possuir dados mockados realistas;
* apresentar estados vazios, loading e erro;
* ser responsivo;
* possuir boa hierarquia;
* não apresentar headers desalinhados;
* utilizar zebra rows;
* possuir ícones consistentes;
* exibir indicadores e gráficos legíveis;
* diferenciar claramente dados reais e mocks.

Será considerado tecnicamente preparado quando:

* mocks estiverem separados da interface;
* existir contrato de serviço;
* modelos estiverem tipados;
* componentes não dependerem diretamente da API externa;
* filtros estiverem padronizados;
* grids suportarem processamento server-side;
* arquitetura suportar múltiplas contas;
* ações estiverem protegidas por permissão;
* auditoria estiver prevista;
* sincronização estiver modelada;
* erros estiverem tratados;
* API real puder substituir mocks sem reconstrução completa.

⸻

46. Orientação final para desenvolvimento

Não desenvolver este módulo como um conjunto de tabelas simples e cards isolados.

O resultado esperado é uma central completa de gestão de marketplace, com alto nível visual, operacional e analítico.

O painel deverá:

* tornar os problemas visíveis;
* destacar prioridades;
* reduzir o número de cliques;
* facilitar análises;
* permitir aprofundamento;
* relacionar dados comerciais, operacionais e financeiros;
* apresentar informações de forma clara;
* suportar grandes volumes;
* preparar ações futuras;
* integrar-se ao ecossistema do Dshow Dash.

A primeira versão com mocks já deverá parecer um sistema funcional e próximo de produção.

A futura integração com a API deverá alterar principalmente a camada de dados, e não exigir a reconstrução da experiência, das telas ou dos componentes.

Na etapa de integração real, os recursos e endpoints deverão ser revalidados diretamente na documentação oficial do Mercado Livre, pois permissões, limites e capacidades podem mudar.