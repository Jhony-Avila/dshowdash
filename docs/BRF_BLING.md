MEGA BRIEFING COMPLETO — MÓDULO BLING NO DSHOW DASH

Gestão integrada de vendas, produtos, estoque, pedidos, notas fiscais, compras, logística e financeiro

⸻

1. Visão geral do projeto

Desenvolver um novo módulo completo de gestão do Bling dentro do Dshow Dash.

O módulo deverá centralizar, em uma única interface, os principais dados operacionais, comerciais, fiscais, logísticos e financeiros atualmente administrados pelo Bling.

A solução deverá funcionar de maneira semelhante aos módulos já planejados ou implementados para:

* Mercado Livre;
* Ads Intelligence;
* Meta Ads;
* E-commerce;
* Pipedrive;
* Outlook.

O novo painel não deverá ser apenas uma reprodução visual do Bling.

Ele deverá transformar os dados em uma experiência mais:

* executiva;
* analítica;
* visual;
* intuitiva;
* integrada;
* operacional;
* personalizada;
* orientada a alertas;
* orientada a decisões.

O resultado esperado é uma central de gestão empresarial integrada ao ecossistema do Dshow Dash.

A API oficial atual do Bling utiliza arquitetura REST, autenticação OAuth 2.0 e disponibiliza métodos de leitura e escrita conforme o recurso. O Bling também documenta webhooks, limites de requisição e atualizações frequentes da API, portanto a integração deverá possuir uma camada própria de adaptação e versionamento.  

⸻

2. Objetivo principal do módulo

O módulo deverá permitir acompanhar e, conforme as permissões disponíveis na API, futuramente gerenciar:

* pedidos de venda;
* pedidos de compra;
* produtos;
* variações;
* kits;
* estoques;
* depósitos;
* preços;
* clientes e contatos;
* fornecedores;
* notas fiscais;
* notas de serviço;
* contas a receber;
* contas a pagar;
* categorias financeiras;
* formas de pagamento;
* vendedores;
* comissões;
* transportadoras;
* remessas;
* logística;
* canais de venda;
* lojas virtuais;
* marketplaces;
* situações dos pedidos;
* integrações;
* sincronizações;
* erros;
* alertas;
* auditoria.

O módulo deverá funcionar simultaneamente como:

1. dashboard executivo;
2. central operacional;
3. gestor de pedidos;
4. gestor de produtos;
5. painel de estoque;
6. central fiscal;
7. painel financeiro;
8. central de compras;
9. painel logístico;
10. central de conciliação;
11. central de alertas;
12. painel de integrações;
13. ferramenta de auditoria;
14. ambiente analítico.

⸻

3. Estratégia de implementação

O desenvolvimento deverá ser dividido em etapas.

3.1. Primeira etapa — Investigação do que já existe

Antes de criar o novo módulo, o agente deverá investigar profundamente:

* integrações Bling existentes;
* scripts de sincronização;
* tabelas locais;
* jobs;
* credenciais configuradas;
* endpoints já consumidos;
* rotinas de importação;
* logs;
* erros;
* mapeamentos com o ERP;
* modelos de produtos;
* pedidos;
* clientes;
* notas fiscais;
* estoques;
* contas financeiras;
* canais de venda;
* relacionamentos com Mercado Livre e E-commerce.

É necessário identificar se existem:

* scripts Python;
* rotinas cron;
* filas;
* webhooks;
* tabelas intermediárias;
* dados duplicados;
* dados antigos da API v2;
* integrações parciais com API v3;
* tokens expirados;
* mapeamentos hardcoded;
* sincronizações completas ou incrementais;
* dependências não documentadas.

3.2. Segunda etapa — Interface com mocks

Após a investigação, construir a primeira versão utilizando dados mockados realistas.

Os mocks deverão permitir validar:

* arquitetura visual;
* navegação;
* indicadores;
* data grids;
* filtros;
* gráficos;
* drill-down;
* estados de erro;
* cenários de sincronização;
* permissões;
* operações futuras.

3.3. Terceira etapa — Integração real

Substituir progressivamente os mocks pelos dados reais da API e do banco local.

A troca não deverá exigir reconstrução do front-end.

⸻

4. Princípio obrigatório de arquitetura

A interface não deverá consumir diretamente a API externa do Bling.

O navegador não deverá armazenar:

* client secret;
* refresh token;
* access token;
* credenciais;
* segredos;
* dados fiscais sensíveis;
* regras privadas de integração.

Criar uma camada de integração no backend do Dshow Dash.

4.1. Fluxo recomendado

1. usuário autorizado inicia a conexão;
2. backend executa o fluxo OAuth;
3. tokens são armazenados com segurança;
4. serviço de integração consulta o Bling;
5. os dados são normalizados;
6. os dados são persistidos localmente;
7. o front-end consulta a API interna;
8. webhooks atualizam eventos relevantes;
9. jobs realizam reconciliação periódica;
10. logs registram todas as operações.

O fluxo oficial de autorização do Bling utiliza OAuth 2.0, e o aplicativo precisa ser cadastrado para obtenção dos tokens de acesso.  

⸻

5. Investigação técnica obrigatória

Antes da implementação visual definitiva, produzir um relatório técnico.

5.1. Front-end

Investigar:

* componentes Bling existentes;
* rotas;
* itens de sidebar;
* ícones;
* páginas incompletas;
* tabelas;
* cards;
* mocks;
* services;
* hooks;
* stores;
* filtros;
* tipos;
* schemas;
* componentes reutilizáveis;
* eventos globais;
* estado de autenticação;
* tratamento de loading;
* tratamento de erros.

5.2. Backend

Investigar:

* endpoints internos;
* services;
* repositories;
* jobs;
* filas;
* workers;
* webhooks;
* OAuth;
* renovação de token;
* retry;
* cache;
* logs;
* rate limiting;
* auditoria;
* tratamento de erros;
* controle de permissões.

5.3. Banco de dados

Localizar:

* tabelas relacionadas ao Bling;
* IDs externos;
* pedidos;
* produtos;
* estoque;
* contatos;
* fornecedores;
* notas;
* recebimentos;
* contas;
* depósitos;
* canais;
* situações;
* sincronizações;
* erros;
* payloads originais.

Classificar cada estrutura como:

* ativa;
* obsoleta;
* incompleta;
* duplicada;
* não utilizada;
* legado;
* candidata a migração.

5.4. Scripts e sincronizações

Mapear:

* nome do script;
* responsabilidade;
* frequência;
* origem;
* destino;
* volume;
* última execução;
* watermark;
* falhas;
* responsável;
* dependências;
* status.

⸻

6. Entregável da investigação

Gerar documento contendo:

* diagrama da arquitetura atual;
* lista de arquivos;
* lista de serviços;
* endpoints;
* tabelas;
* campos;
* relacionamentos;
* scripts;
* jobs;
* webhooks;
* fluxos;
* problemas;
* riscos;
* lacunas;
* oportunidades de reaproveitamento;
* plano de migração;
* proposta de arquitetura futura.

Nenhum código destrutivo deverá ser implementado antes desse relatório.

⸻

7. Formas de acesso ao módulo

O módulo deverá ser acessível por:

* ícone no header;
* botão na sidebar;
* busca global;
* atalhos da página inicial;
* links contextuais de outros módulos.

⸻

8. Ícone do Bling no header

Criar ou utilizar um ícone específico do Bling no header principal.

8.1. Comportamento

Ao clicar:

* abrir o módulo no conteúdo principal;
* preservar o shell;
* manter header e sidebar;
* destacar o item Bling;
* atualizar o breadcrumb;
* abrir a última seção utilizada;
* não abrir nova aba;
* não redirecionar para o site externo.

8.2. Resumo no tooltip

Exemplo:

Bling

* 24 pedidos novos;
* 7 pedidos aguardando faturamento;
* 5 produtos com estoque crítico;
* 3 notas com erro;
* R$ 48.750,00 em contas vencidas;
* atualizado há 6 minutos.

8.3. Badge

Prioridade:

1. falha crítica de integração;
2. erro fiscal;
3. pedido parado;
4. estoque divergente;
5. vencimento financeiro;
6. novo pedido;
7. demais alertas.

8.4. Estados

* conectado;
* sincronizando;
* atenção;
* erro;
* dados desatualizados;
* mock;
* token expirado;
* não configurado;
* sincronização parcial;
* manutenção.

⸻

9. Botão na sidebar

Criar um novo botão:

Bling

9.1. Posicionamento recomendado

O Bling funciona como núcleo de gestão empresarial, portanto deverá ficar em uma área coerente com ERP e operação.

Sugestão:

Gestão e ERP

* Bling;
* DataTables;
* demais sistemas de gestão.

Alternativamente, caso a arquitetura atual agrupe integrações comerciais:

Canais e Integrações

* E-commerce;
* Mercado Livre;
* Bling.

A recomendação principal é criar o grupo:

Gestão e ERP

9.2. Características

O botão deverá possuir:

* ícone;
* label;
* tooltip;
* badge;
* estado hover;
* estado ativo;
* foco;
* suporte a sidebar expandida;
* suporte a sidebar colapsada;
* atalhos por teclado;
* indicadores de sincronização.

⸻

10. Navegação interna do módulo

Criar uma sub-sidebar expansível e colapsável.

10.1. Grupos e páginas

Visão

1. Visão Geral
2. Central Operacional
3. Diretoria
4. Indicadores

Vendas

5. Pedidos de Venda
6. Vendas
7. Canais de Venda
8. Vendedores
9. Comissões

Produtos

10. Produtos
11. Variações
12. Kits e Estruturas
13. Categorias
14. Preços
15. Estoque
16. Depósitos

Compras

17. Pedidos de Compra
18. Fornecedores
19. Recebimentos de Mercadoria
20. Necessidades de Compra

Fiscal

21. Notas Fiscais
22. Notas de Serviço
23. Situações Fiscais
24. Tributações
25. Documentos

Financeiro

26. Contas a Receber
27. Contas a Pagar
28. Fluxo de Caixa
29. Conciliação
30. Categorias Financeiras
31. Formas de Pagamento

Logística

32. Envios
33. Transportadoras
34. Rastreamento
35. Expedição
36. Ocorrências

Relacionamento

37. Clientes
38. Contatos
39. Fornecedores
40. Histórico Comercial

Inteligência

41. Rentabilidade
42. Curva ABC
43. Previsões
44. Anomalias
45. Relatórios
46. Alertas

Administração

47. Integrações
48. Sincronização
49. Webhooks
50. Logs
51. Auditoria
52. Configurações

⸻

11. Sidebar interna

A sub-sidebar deverá possuir:

* estado expandido;
* estado colapsado;
* persistência;
* scroll independente;
* grupos;
* ícones SVG;
* badges;
* tooltips;
* item ativo;
* transição suave;
* adaptação para tablet.

11.1. Larguras sugeridas

* expandida: 240 px;
* colapsada: 72 px.

11.2. Persistência

Salvar por usuário:

dshow.bling.sidebar.collapsed

⸻

12. Header interno

Criar um header completo contendo:

* título “Bling”;
* subtítulo;
* seletor de conta;
* seletor de empresa ou unidade;
* seletor de período;
* comparação;
* busca global;
* filtros;
* status da conexão;
* última sincronização;
* botão atualizar;
* botão exportar;
* botão configurações;
* indicador de dados simulados.

Subtítulo sugerido:

Gestão integrada de vendas, estoque, fiscal, compras, logística e financeiro.

⸻

13. Suporte a múltiplas contas e unidades

A arquitetura deverá suportar:

* uma ou várias contas Bling;
* matriz;
* filiais;
* unidades de negócio;
* visões consolidadas;
* visões individuais.

O seletor deverá mostrar:

* nome;
* CNPJ mascarado;
* unidade;
* status;
* ambiente;
* última sincronização;
* quantidade de pendências.

A API do Bling evolui continuamente e já possui recursos relacionados a unidades de negócio em determinadas consultas; por isso, o modelo local não deve assumir uma única unidade fixa.  

⸻

14. Dashboard — Visão Geral

A página inicial do módulo deverá fornecer visão executiva e operacional.

14.1. KPIs principais

Criar cards com:

* faturamento bruto;
* faturamento líquido;
* pedidos de venda;
* pedidos faturados;
* ticket médio;
* produtos vendidos;
* clientes;
* contas a receber;
* contas vencidas;
* contas a pagar;
* saldo projetado;
* notas emitidas;
* notas com erro;
* estoque total;
* produtos sem estoque;
* produtos com estoque crítico;
* pedidos de compra;
* pedidos aguardando expedição;
* margem estimada;
* integrações com falha.

Cada card deverá conter:

* valor;
* comparação;
* tendência;
* sparkline;
* ícone;
* meta;
* tooltip;
* última atualização;
* drill-down;
* cor semântica.

⸻

15. Linha de saúde operacional

Criar indicadores compactos para:

* API;
* OAuth;
* webhooks;
* sincronização;
* banco local;
* filas;
* notas fiscais;
* estoque;
* financeiro;
* canais de venda.

Estados:

* saudável;
* atenção;
* degradado;
* indisponível;
* desatualizado.

⸻

16. Painel “Exige atenção”

Criar uma área prioritária com:

* notas rejeitadas;
* pedidos sem faturamento;
* pedidos parados;
* estoque negativo;
* divergência de estoque;
* produtos sem vínculo;
* contas vencidas;
* pedidos de compra atrasados;
* falhas de webhook;
* token próximo de expirar;
* sincronização interrompida;
* clientes duplicados;
* fornecedores incompletos;
* pedidos sem nota;
* remessas com atraso;
* valores divergentes.

Cada ocorrência deverá apresentar:

* severidade;
* módulo;
* descrição;
* quantidade;
* valor impactado;
* prazo;
* responsável;
* ação recomendada;
* botão de acesso.

⸻

17. Gráfico de evolução consolidada

Utilizar Apache ECharts para séries temporais.

Métricas:

* faturamento;
* pedidos;
* ticket médio;
* margem;
* recebimentos;
* pagamentos;
* estoque;
* compras;
* notas emitidas.

Recursos:

* múltiplas séries;
* eixo duplo;
* comparação;
* zoom;
* brush;
* média móvel;
* acumulado;
* tooltip compartilhado;
* marcação de eventos;
* seleção de granularidade;
* exportação.

⸻

18. Fluxo empresarial em D3

Criar uma visualização Sankey utilizando D3.js.

Fluxo sugerido:

Canal de venda
→ Pedido
→ Faturamento
→ Nota fiscal
→ Expedição
→ Entrega
→ Recebimento

Exibir:

* quantidade;
* valor;
* perdas;
* gargalos;
* tempo médio;
* conversão entre etapas.

Ao clicar em uma etapa:

* filtrar o dashboard;
* abrir os registros relacionados;
* destacar o fluxo;
* preservar contexto.

⸻

19. Mapa de relacionamento D3

Criar um mapa interativo relacionando:

* canais;
* clientes;
* pedidos;
* produtos;
* notas;
* pagamentos;
* fornecedores;
* depósitos.

Utilizar apenas quando houver valor analítico.

Recursos:

* zoom;
* agrupamento;
* filtros;
* tooltip;
* destaque;
* seleção;
* drill-down.

⸻

20. Gestão de pedidos de venda

Criar uma página operacional completa.

20.1. Data grid

Colunas sugeridas:

* número;
* ID Bling;
* situação;
* data;
* cliente;
* vendedor;
* canal;
* loja;
* itens;
* subtotal;
* desconto;
* frete;
* total;
* pagamento;
* nota;
* expedição;
* rastreamento;
* ERP local;
* última atualização;
* ações.

20.2. Recursos

* virtualização;
* paginação server-side;
* filtros;
* busca;
* ordenação múltipla;
* agrupamento;
* agregações;
* colunas fixadas;
* seleção múltipla;
* ações em lote;
* expansão de linhas;
* exportação;
* preferências;
* zebra rows;
* formatação condicional;
* menus contextuais;
* totalizadores;
* salvamento de views.

20.3. Ações futuras

Preparar para:

* criar pedido;
* editar;
* alterar situação;
* faturar;
* emitir nota;
* gerar expedição;
* cancelar;
* duplicar;
* imprimir;
* enviar ao cliente;
* adicionar observação;
* reprocessar integração.

A disponibilidade real deverá ser validada recurso por recurso na referência oficial da API. A documentação apresenta métodos e schemas específicos por endpoint, e pode receber alterações ou breaking changes.  

⸻

21. Detalhes do pedido

Criar página ou drawer com abas:

* Resumo;
* Itens;
* Cliente;
* Pagamento;
* Nota fiscal;
* Expedição;
* Logística;
* Integrações;
* Histórico;
* Auditoria.

21.1. Timeline

Exibir:

* criado;
* aprovado;
* faturado;
* nota emitida;
* separado;
* enviado;
* entregue;
* recebido;
* cancelado.

⸻

22. Gestão de produtos

Criar central de produtos.

22.1. Data grid

Colunas:

* imagem;
* ID;
* SKU;
* GTIN/EAN;
* nome;
* tipo;
* categoria;
* marca;
* variações;
* preço;
* custo;
* margem;
* estoque;
* depósito;
* situação;
* origem;
* canais;
* última venda;
* última atualização;
* ações.

A API oficial recebe atualizações frequentes, inclusive em filtros e campos relacionados a produtos; por isso, o adapter interno deverá isolar essas mudanças da interface.  

22.2. Ficha do produto

Abas:

* Resumo;
* Cadastro;
* Variações;
* Kit;
* Estoque;
* Depósitos;
* Preços;
* Custos;
* Fornecedores;
* Vendas;
* Compras;
* Canais;
* Fiscal;
* Histórico;
* Auditoria.

⸻

23. Qualidade cadastral

Criar score de qualidade considerando:

* SKU;
* GTIN;
* descrição;
* imagens;
* categoria;
* marca;
* unidade;
* peso;
* dimensões;
* origem;
* tributação;
* custo;
* preço;
* estoque;
* fornecedor;
* vínculo com canal.

Exibir:

* score;
* pendências;
* impacto;
* prioridade;
* ação sugerida.

⸻

24. Gestão de estoque

24.1. Indicadores

* estoque físico;
* disponível;
* reservado;
* saldo virtual;
* produtos zerados;
* produtos negativos;
* estoque crítico;
* valor em estoque;
* cobertura;
* giro;
* divergências;
* itens parados.

24.2. Visualizações

* curva ABC;
* cobertura;
* projeção de ruptura;
* evolução;
* aging;
* estoque versus venda;
* matriz giro versus margem;
* estoque por depósito.

24.3. Matriz D3

Criar matriz interativa:

* alto giro e alta margem;
* alto giro e baixa margem;
* baixo giro e alta margem;
* baixo giro e baixa margem.

24.4. Data grid

* produto;
* SKU;
* depósito;
* físico;
* reservado;
* disponível;
* mínimo;
* máximo;
* giro;
* cobertura;
* divergência;
* última movimentação;
* status.

⸻

25. Depósitos

Criar uma área específica para:

* depósitos;
* saldos;
* transferências;
* disponibilidade;
* divergências;
* produtos por depósito;
* valor;
* movimentações.

Criar visualização D3 do fluxo de estoque entre depósitos, caso existam transferências internas relevantes.

⸻

26. Gestão de preços e custos

Criar painel contendo:

* preço;
* preço promocional;
* custo médio;
* último custo;
* margem;
* markup;
* desconto;
* histórico;
* canais;
* divergências.

26.1. Gráfico histórico

Exibir:

* preço;
* custo;
* margem;
* volume vendido;
* estoque.

26.2. Simulador

Campos:

* custo;
* preço;
* desconto;
* imposto estimado;
* comissão;
* frete;
* taxa;
* lucro;
* margem;
* markup.

Identificar cálculos como estimativas quando não houver composição contábil completa.

⸻

27. Pedidos de compra

Criar página completa.

27.1. Indicadores

* pedidos abertos;
* atrasados;
* parcialmente recebidos;
* concluídos;
* valor comprado;
* prazo médio;
* fornecedores;
* itens pendentes.

27.2. Data grid

* número;
* fornecedor;
* situação;
* emissão;
* previsão;
* recebimento;
* itens;
* valor;
* comprador;
* nota;
* divergência;
* atualização;
* ações.

27.3. Timeline

* solicitação;
* cotação;
* aprovação;
* pedido;
* envio;
* recebimento;
* conferência;
* entrada.

⸻

28. Necessidades de compra

Criar uma área inteligente baseada em:

* estoque atual;
* estoque mínimo;
* cobertura;
* consumo;
* pedidos em aberto;
* vendas previstas;
* lead time;
* sazonalidade;
* produtos críticos.

Exibir recomendações com:

* produto;
* quantidade sugerida;
* motivo;
* fornecedor;
* custo estimado;
* urgência;
* cobertura prevista.

⸻

29. Fornecedores

Criar visão completa de fornecedores.

Indicadores:

* total comprado;
* pedidos;
* prazo médio;
* atrasos;
* divergências;
* produtos fornecidos;
* custo médio;
* última compra.

Criar score interno baseado em:

* prazo;
* preço;
* qualidade;
* completude;
* divergências;
* regularidade.

Não apresentar o score como avaliação oficial do Bling.

⸻

30. Notas fiscais

Criar central fiscal.

30.1. Indicadores

* emitidas;
* autorizadas;
* pendentes;
* rejeitadas;
* canceladas;
* inutilizadas;
* valor;
* tempo médio;
* erros recorrentes.

30.2. Data grid

* número;
* série;
* chave;
* pedido;
* cliente;
* emissão;
* valor;
* situação;
* finalidade;
* tipo;
* link DANFE;
* XML;
* erro;
* última atualização;
* ações.

30.3. Diagnóstico

Exibir:

* código;
* mensagem;
* causa provável;
* recomendação;
* campos relacionados;
* histórico de tentativas.

A API do Bling mantém changelog ativo com alterações em notas fiscais, campos e links de documentos; o módulo deverá consumir esses dados por meio de adapter versionado, evitando dependência rígida do front-end.  

⸻

31. Central fiscal visual

Criar um funil:

Pedidos aprovados
→ Pedidos faturáveis
→ Notas geradas
→ Notas autorizadas
→ Notas enviadas

Exibir perdas e erros em cada etapa.

Utilizar D3 ou Apache ECharts.

⸻

32. Contas a receber

Indicadores

* a receber;
* recebido;
* vencido;
* previsto hoje;
* previsto na semana;
* inadimplência;
* prazo médio;
* divergências.

Data grid

* título;
* cliente;
* pedido;
* vencimento;
* valor;
* recebido;
* saldo;
* situação;
* forma;
* categoria;
* conta;
* atraso;
* ações.

⸻

33. Contas a pagar

Indicadores

* a pagar;
* pago;
* vencido;
* previsto hoje;
* fornecedores;
* categorias;
* recorrentes.

Data grid

* título;
* fornecedor;
* vencimento;
* competência;
* valor;
* pago;
* saldo;
* categoria;
* conta;
* situação;
* atraso;
* ações.

⸻

34. Fluxo de caixa

Criar gráfico utilizando Apache ECharts:

* entradas;
* saídas;
* saldo diário;
* saldo acumulado;
* previsto;
* realizado;
* vencidos.

Permitir:

* diário;
* semanal;
* mensal;
* comparação;
* projeção;
* filtro por conta;
* filtro por categoria.

⸻

35. Sankey financeiro em D3

Criar visualização:

Origem da receita
→ Categoria
→ Conta financeira
→ Destinação

ou:

Canal de venda
→ Receita
→ Taxas
→ Impostos
→ Frete
→ Custo
→ Margem

Essa visualização deverá permitir identificar onde o valor é reduzido ao longo do processo.

⸻

36. Conciliação

Criar uma central comparando:

* pedido;
* nota;
* título;
* recebimento;
* pagamento;
* canal;
* ERP;
* banco;
* cliente;
* valor.

Status:

* conciliado;
* divergente;
* parcial;
* duplicado;
* não encontrado;
* pendente;
* erro.

Permitir:

* associação manual;
* reprocessamento;
* regra automática;
* justificativa;
* auditoria;
* ações em lote.

⸻

37. Clientes e contatos

Criar visão 360º.

Indicadores

* clientes ativos;
* novos;
* recorrentes;
* inativos;
* faturamento;
* ticket;
* frequência;
* contas vencidas;
* última compra.

Ficha

* cadastro;
* endereços;
* contatos;
* pedidos;
* notas;
* contas;
* produtos;
* canais;
* histórico;
* auditoria.

Aplicar mascaramento e permissões para dados pessoais.

⸻

38. Canais de venda

Consolidar:

* Mercado Livre;
* E-commerce;
* Loja Integrada;
* vendas diretas;
* outros canais conectados.

Indicadores

* pedidos;
* faturamento;
* ticket;
* margem;
* cancelamentos;
* notas;
* estoque;
* integração.

Visualizações

* comparação;
* participação;
* evolução;
* margem;
* taxa de erro;
* tempo de processamento.

⸻

39. Logística e expedição

Criar central contendo:

* pedidos aguardando separação;
* separados;
* despachados;
* entregues;
* atrasados;
* devolvidos;
* ocorrências.

Data grid

* pedido;
* cliente;
* transportadora;
* serviço;
* rastreamento;
* previsão;
* despacho;
* entrega;
* custo;
* situação;
* ocorrência;
* ações.

Gráficos

* prazo prometido versus realizado;
* custo por região;
* atrasos;
* transportadoras;
* mapa;
* distribuição de prazo.

⸻

40. Rentabilidade

Criar painel por:

* pedido;
* produto;
* SKU;
* cliente;
* canal;
* vendedor;
* categoria;
* período.

Componentes:

* receita;
* desconto;
* frete;
* comissão;
* impostos estimados;
* custo;
* margem;
* lucro.

Visualizações

* waterfall;
* matriz margem versus volume;
* Pareto;
* produtos com prejuízo;
* canais rentáveis;
* evolução de margem.

⸻

41. Curva ABC

Criar curvas ABC para:

* produtos;
* clientes;
* fornecedores;
* canais;
* categorias.

Utilizar Apache ECharts ou D3.

Permitir alternar classificação por:

* faturamento;
* margem;
* unidades;
* frequência;
* compras;
* estoque.

⸻

42. Inteligência e anomalias

Criar uma área de insights baseada inicialmente em regras.

Exemplos:

* queda de vendas;
* aumento de cancelamentos;
* estoque divergente;
* nota com erro recorrente;
* aumento do custo;
* queda de margem;
* atraso de fornecedor;
* cliente com inadimplência;
* produto parado;
* sincronização incompleta.

Cada insight deverá mostrar:

* evidência;
* impacto;
* período;
* recomendação;
* nível de confiança;
* origem dos dados;
* botão de análise.

⸻

43. Relatórios

Criar relatórios para:

* pedidos;
* produtos;
* estoque;
* compras;
* fornecedores;
* clientes;
* notas;
* recebimentos;
* pagamentos;
* fluxo de caixa;
* logística;
* rentabilidade;
* canais;
* sincronização;
* auditoria.

Recursos:

* filtros;
* agrupamento;
* colunas;
* totalizadores;
* views salvas;
* favoritos;
* exportação CSV;
* exportação XLSX;
* PDF;
* impressão;
* agendamento futuro;
* compartilhamento.

⸻

44. Sistema de alertas

Operacionais

* pedido parado;
* pedido sem nota;
* pedido sem expedição;
* estoque crítico;
* estoque negativo;
* compra atrasada.

Fiscais

* nota rejeitada;
* certificado próximo do vencimento, se disponível;
* erro de tributação;
* documento não autorizado.

Financeiros

* conta vencida;
* divergência;
* inadimplência;
* saldo insuficiente;
* valor não conciliado.

Técnicos

* OAuth inválido;
* token expirado;
* webhook falhou;
* API indisponível;
* limite de requisição;
* job interrompido;
* dados desatualizados.

A API do Bling possui limites por conta que se aplicam ao conjunto das requisições, e chamadas excedentes podem deixar de ser processadas. Por isso, a aplicação deverá controlar consumo, filas, cache, backoff e priorização.  

⸻

45. Automações

Preparar estrutura para:

* sincronizar estoque;
* sincronizar preço;
* importar pedido;
* gerar tarefa;
* emitir nota;
* atualizar situação;
* alertar vencimento;
* reprocessar erro;
* conciliar lançamento;
* sugerir compra;
* notificar responsável.

Cada automação deverá conter:

* nome;
* gatilho;
* condição;
* ação;
* status;
* modo teste;
* logs;
* última execução;
* próxima execução;
* responsável;
* histórico.

Nenhuma ação crítica deverá ser habilitada sem:

* confirmação;
* permissão;
* auditoria;
* homologação.

⸻

46. Webhooks

Criar central de webhooks com:

* evento;
* origem;
* data;
* status;
* processamento;
* tentativa;
* resultado;
* ID de correlação;
* payload protegido;
* reprocessamento.

Fluxo:

1. receber;
2. validar;
3. registrar;
4. responder rapidamente;
5. enviar para fila;
6. processar;
7. buscar detalhes;
8. atualizar banco;
9. gerar evento interno;
10. registrar resultado.

Os webhooks são a estratégia reativa documentada pelo Bling para notificações de eventos, mas não deverão substituir as rotinas periódicas de reconciliação.  

⸻

47. Sincronização

Criar uma página técnica e gerencial.

Informações

* recurso;
* conta;
* status;
* última execução;
* próxima execução;
* duração;
* registros consultados;
* criados;
* atualizados;
* ignorados;
* erros;
* página;
* cursor;
* watermark;
* limite consumido;
* retry.

Estratégia

* carga inicial;
* incremental;
* reconciliação;
* cache;
* paginação;
* idempotência;
* deduplicação;
* retry;
* backoff;
* fila;
* dead-letter queue.

⸻

48. Arquitetura de serviços

Criar contrato desacoplado.

interface BlingService {
  getOverview(filters: BlingOverviewFilters): Promise<BlingOverview>;
  getSalesOrders(filters: SalesOrderFilters): Promise<Paginated<SalesOrder>>;
  getProducts(filters: ProductFilters): Promise<Paginated<Product>>;
  getInventory(filters: InventoryFilters): Promise<InventorySummary>;
  getPurchaseOrders(filters: PurchaseOrderFilters): Promise<Paginated<PurchaseOrder>>;
  getContacts(filters: ContactFilters): Promise<Paginated<Contact>>;
  getInvoices(filters: InvoiceFilters): Promise<Paginated<Invoice>>;
  getAccountsReceivable(filters: FinancialFilters): Promise<Paginated<Receivable>>;
  getAccountsPayable(filters: FinancialFilters): Promise<Paginated<Payable>>;
  getShipments(filters: ShipmentFilters): Promise<Paginated<Shipment>>;
  getAlerts(filters: AlertFilters): Promise<BlingAlert[]>;
}

Implementar inicialmente:

class MockBlingService implements BlingService

Posteriormente:

class ApiBlingService implements BlingService

⸻

49. Adapter da API

Criar camada:

Bling API
→ Bling API Client
→ Version Adapter
→ Normalizer
→ Repository
→ API interna
→ Front-end

Responsabilidades:

* autenticação;
* renovação de token;
* paginação;
* serialização;
* normalização;
* tradução de situações;
* tratamento de erros;
* controle de limites;
* compatibilidade com mudanças.

⸻

50. Modelo de dados local

Entidades sugeridas:

bling_accounts
bling_business_units
bling_sales_channels
bling_sales_orders
bling_sales_order_items
bling_sales_order_status_history
bling_purchase_orders
bling_purchase_order_items
bling_products
bling_product_variations
bling_product_structures
bling_categories
bling_prices
bling_price_history
bling_inventory
bling_inventory_history
bling_warehouses
bling_contacts
bling_suppliers
bling_invoices
bling_invoice_events
bling_service_invoices
bling_accounts_receivable
bling_accounts_payable
bling_financial_categories
bling_payment_methods
bling_shipments
bling_shipment_events
bling_webhook_events
bling_sync_jobs
bling_sync_errors
bling_alerts
bling_audit_logs
bling_raw_payloads

Campos comuns:

* ID interno;
* ID Bling;
* conta;
* unidade;
* situação;
* payload;
* hash;
* versão;
* criado externamente;
* atualizado externamente;
* sincronizado em;
* exclusão lógica;
* origem.

⸻

51. Data grids robustos

Todas as tabelas deverão utilizar data grids avançados.

Biblioteca recomendada:

* AG Grid.

Alternativas:

* TanStack Table com TanStack Virtual;
* MUI X Data Grid Pro.

Recursos obrigatórios

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
* redimensionamento;
* reordenação;
* seleção;
* ações em lote;
* linhas expansíveis;
* exportação;
* menus contextuais;
* preferências;
* zebra rows;
* densidade;
* totalizadores;
* atalhos;
* colunas dinâmicas.

Padrão visual

* headers alinhados;
* valores numéricos à direita;
* textos à esquerda;
* status com badges;
* linhas alternadas;
* hover;
* seleção clara;
* tooltips;
* truncamento;
* colunas fixas;
* totais destacados.

⸻

52. D3.js como biblioteca principal

D3.js deverá ser tratado como uma biblioteca central, e não apenas complementar.

Utilizar para:

* Sankey empresarial;
* fluxo financeiro;
* relações entre entidades;
* mapa de estoque;
* árvore de categorias;
* rede de canais;
* análise de fornecedores;
* matriz de rentabilidade;
* fluxo de pedidos;
* jornada do pedido;
* visualizações customizadas.

52.1. Regras

Toda visualização D3 deverá possuir:

* tooltip;
* legenda;
* zoom quando aplicável;
* seleção;
* reset;
* drill-down;
* cross-filter;
* loading;
* erro;
* estado vazio;
* responsividade;
* suporte a tema.

⸻

53. Apache ECharts

Utilizar no mesmo nível de importância para:

* séries temporais;
* barras;
* linhas;
* áreas;
* funis;
* heatmaps;
* scatter;
* gauges;
* waterfall;
* gráficos combinados;
* curvas ABC;
* indicadores executivos.

D3.js e Apache ECharts deverão ser utilizados conforme a natureza de cada visualização.

⸻

54. Cross-filter

Os componentes deverão interagir.

Exemplos:

* selecionar um canal filtra pedidos;
* selecionar uma categoria filtra produtos;
* selecionar um depósito filtra estoque;
* selecionar um fornecedor filtra compras;
* selecionar uma situação fiscal filtra notas;
* selecionar um mês filtra financeiro;
* selecionar um nó do Sankey filtra o grid.

Adicionar:

Limpar seleção

⸻

55. Drill-down

Todos os indicadores deverão abrir detalhes.

Exemplos:

* faturamento → pedidos;
* pedidos parados → registros afetados;
* estoque crítico → produtos;
* notas rejeitadas → documentos;
* contas vencidas → títulos;
* compras atrasadas → pedidos de compra;
* erro de integração → logs;
* margem negativa → produtos e pedidos.

⸻

56. Busca global

Permitir buscar:

* pedido;
* produto;
* SKU;
* GTIN;
* cliente;
* fornecedor;
* nota;
* chave fiscal;
* conta;
* título;
* rastreamento;
* ID Bling;
* ID interno.

A busca deverá estar disponível por:

* campo no header;
* atalho;
* command palette.

⸻

57. UX e direção visual

O módulo deverá possuir alto padrão visual.

57.1. Identidade

Utilizar:

* identidade verde do Bling como referência;
* neutros do Dshow Dash;
* cores semânticas;
* gradientes suaves;
* bordas refinadas;
* sombras discretas;
* cards bem hierarquizados;
* microinterações;
* ícones SVG.

Não preencher toda a interface de verde.

Aplicar o verde em:

* módulo ativo;
* detalhes;
* links;
* gráficos;
* indicadores;
* badges;
* elementos selecionados.

57.2. Não copiar a interface externa

O módulo poderá aproveitar conceitos operacionais, mas deverá possuir identidade própria do Dshow Dash.

⸻

58. Ícones

Utilizar uma única família principal:

* Lucide Icons.

Sugestões:

Área	Ícone
Visão Geral	LayoutDashboard
Pedidos	ShoppingCart
Produtos	Package
Estoque	Boxes
Depósitos	Warehouse
Compras	ShoppingBag
Fornecedores	Factory
Notas	FileText
Financeiro	Landmark
Receber	CircleDollarSign
Pagar	Receipt
Logística	Truck
Clientes	Users
Sincronização	RefreshCw
Webhooks	Webhook
Alertas	BellRing
Auditoria	ScrollText

Não utilizar emojis.

⸻

59. Estados da interface

Todas as páginas deverão possuir:

Loading

* skeleton;
* carregamento progressivo;
* preservação do último dado válido.

Sem dados

* explicação;
* filtro ativo;
* ação sugerida.

Erro

* mensagem amigável;
* nova tentativa;
* detalhes recolhíveis;
* correlation ID;
* data;
* hora.

Desatualizado

* última atualização;
* motivo;
* botão atualizar;
* impacto.

Mock

Mostrar:

Ambiente de demonstração — os dados apresentados são simulados.

⸻

60. Mocks realistas

Criar cenários:

* operação saudável;
* pico de pedidos;
* estoque crítico;
* notas rejeitadas;
* contas vencidas;
* compras atrasadas;
* falha de OAuth;
* limite de API;
* webhook duplicado;
* sincronização interrompida;
* divergência financeira;
* alto volume;
* sem dados.

Os mocks deverão preservar relacionamentos entre:

* pedido;
* cliente;
* produto;
* nota;
* estoque;
* conta;
* expedição;
* recebimento.

⸻

61. Segurança e permissões

Administrador

* acesso completo;
* integração;
* configurações;
* operações críticas;
* logs;
* auditoria.

Diretoria

* visão executiva;
* vendas;
* financeiro;
* rentabilidade;
* relatórios.

Comercial

* pedidos;
* clientes;
* produtos;
* vendas.

Compras

* fornecedores;
* pedidos de compra;
* estoque;
* necessidades.

Financeiro

* contas;
* conciliação;
* fluxo;
* relatórios financeiros.

Fiscal

* notas;
* documentos;
* erros;
* situações.

Logística

* expedição;
* rastreamento;
* transportadoras;
* ocorrências.

Somente leitura

* consulta autorizada.

⸻

62. LGPD e dados sensíveis

Aplicar:

* menor privilégio;
* mascaramento;
* controle de exportação;
* auditoria;
* retenção;
* criptografia;
* proteção de documentos;
* controle de acesso;
* ocultação de dados fiscais e pessoais.

⸻

63. Auditoria

Registrar:

* usuário;
* conta;
* ação;
* entidade;
* valor anterior;
* valor novo;
* data;
* hora;
* IP;
* origem;
* resultado;
* correlation ID.

Registrar especialmente:

* alteração de pedido;
* preço;
* estoque;
* nota;
* conta;
* conciliação;
* cancelamento;
* reprocessamento;
* exportação.

⸻

64. Performance

Implementar:

* lazy loading;
* code splitting;
* virtualização;
* server-side;
* cache;
* paginação;
* filtros server-side;
* agregações server-side;
* debounce;
* cancelamento;
* prefetch;
* compressão;
* índices;
* filas;
* leitura incremental.

Não carregar todo o histórico no navegador.

⸻

65. Observabilidade

Monitorar:

* OAuth;
* API;
* limites;
* webhooks;
* filas;
* jobs;
* latência;
* falhas;
* retries;
* tokens;
* sincronização;
* volume;
* dados desatualizados;
* erros por recurso.

Logs:

* correlation ID;
* conta;
* endpoint;
* método;
* recurso;
* status;
* duração;
* tentativa;
* limite consumido;
* data;
* hora.

⸻

66. Responsividade

Desktop

* sub-sidebar;
* grids completos;
* gráficos amplos.

Notebook

* sidebar colapsável;
* cards reorganizados;
* grids adaptáveis.

Tablet

* navegação em drawer;
* filtros em sheet;
* tabelas reduzidas.

Mobile

* cards;
* listas;
* ações em menu;
* detalhes em tela cheia.

⸻

67. Acessibilidade

Implementar:

* teclado;
* foco;
* ARIA;
* contraste;
* leitores de tela;
* status não dependentes de cor;
* redução de movimento;
* descrições dos gráficos;
* tamanho adequado de clique.

⸻

68. Stack sugerida

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
* TanStack Virtual.

Caso o shell atual não utilize React, avaliar microfrontend sem comprometer o roteamento principal.

⸻

69. Fases de implementação

Fase 1 — Auditoria

* mapear front-end;
* mapear backend;
* mapear banco;
* mapear scripts;
* mapear integrações;
* documentar riscos.

Fase 2 — Base visual e mocks

* botão na sidebar;
* ícone no header;
* shell;
* sub-sidebar;
* filtros;
* Visão Geral;
* pedidos;
* produtos;
* estoque;
* notas;
* financeiro;
* sincronização.

Fase 3 — Analytics avançado

* D3;
* ECharts;
* Sankey;
* curva ABC;
* rentabilidade;
* fluxo financeiro;
* cross-filter;
* drill-down.

Fase 4 — Backend

* OAuth;
* token;
* banco local;
* API interna;
* jobs;
* filas;
* webhooks;
* cache;
* logs.

Fase 5 — Integração real

* importar dados;
* validar campos;
* reconciliar;
* testar limites;
* homologar;
* substituir mocks.

Fase 6 — Operações de escrita

Após homologação:

* criar;
* editar;
* alterar situações;
* atualizar estoque;
* atualizar preços;
* emitir notas;
* reprocessar;
* conciliar.

⸻

70. Critérios de aceite visual

O módulo será considerado visualmente aprovado quando:

* possuir identidade premium;
* possuir botão na sidebar;
* possuir ícone no header;
* possuir sub-sidebar expansível;
* utilizar D3.js;
* utilizar Apache ECharts;
* possuir data grids robustos;
* possuir zebra rows;
* possuir headers alinhados;
* apresentar filtros;
* possuir drill-down;
* possuir cross-filter;
* funcionar em light e dark;
* ser responsivo;
* não utilizar emojis;
* destacar prioridades;
* manter coerência com o Dshow Dash.

⸻

71. Critérios de aceite funcional

O módulo será considerado funcional quando:

* carregar dados mockados consistentes;
* suportar filtros;
* abrir detalhes;
* exportar;
* preservar preferências;
* atualizar widgets separadamente;
* tratar erros;
* indicar sincronização;
* respeitar permissões;
* registrar auditoria;
* abrir módulos relacionados.

⸻

72. Critérios de aceite técnico

O módulo será considerado preparado quando:

* investigação estiver documentada;
* mocks estiverem separados;
* serviços estiverem desacoplados;
* modelos estiverem tipados;
* OAuth estiver no backend;
* tokens estiverem protegidos;
* adapter estiver implementado;
* grids forem server-side;
* limites forem controlados;
* webhooks forem idempotentes;
* sincronização for incremental;
* logs possuírem correlation ID;
* a API real puder substituir mocks sem reconstrução.

⸻

73. Orientação final ao agente

Não criar o módulo Bling como uma simples coleção de tabelas importadas da API.

O objetivo é transformar os dados do Bling em uma central empresarial integrada, visual e operacional.

A implementação deverá:

* identificar problemas;
* destacar prioridades;
* facilitar decisões;
* relacionar pedidos, produtos, estoque, notas, logística e financeiro;
* reduzir cliques;
* eliminar telas técnicas;
* oferecer visualizações avançadas;
* suportar grandes volumes;
* permitir expansão futura;
* proteger dados;
* registrar auditoria;
* tolerar mudanças da API;
* manter o Dshow Dash como camada principal de experiência.

A primeira versão com mocks já deverá apresentar aparência e comportamento próximos de produção.

A integração real deverá alterar principalmente a camada de dados, os adapters e a sincronização, sem exigir reconstrução das telas, dos grids, dos gráficos ou da navegação.