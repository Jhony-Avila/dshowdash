Datatable 1
Briefing Completo — Aplicação DataTables

1. Identificação do projeto

Nome da aplicação: DataTables
Plataforma principal: Dshow Dash
Tipo de aplicação: Catálogo técnico, monitoramento e diagnóstico da infraestrutura de dados
Público interno: Equipe de desenvolvimento
Banco inicialmente suportado: MySQL
Escopo de infraestrutura: Todos os servidores, VPSs, bancos, APIs, integrações e demais fontes de dados utilizadas pelas aplicações conectadas ao Dshow Dash.

⸻

2. Visão geral

O DataTables será uma aplicação interna do Dshow Dash responsável por centralizar, organizar e apresentar visualmente toda a infraestrutura de dados utilizada pelas aplicações da empresa.

A ferramenta deverá funcionar como um mapa central da infraestrutura de dados, permitindo que a equipe de desenvolvimento visualize:

* servidores;
* VPSs;
* bancos de dados;
* schemas;
* tabelas;
* campos;
* índices;
* chaves;
* APIs;
* integrações externas;
* planilhas;
* arquivos;
* filas;
* caches;
* ambientes;
* conexões;
* disponibilidade;
* alertas;
* falhas;
* indicadores de qualidade.

A aplicação deverá identificar automaticamente os recursos existentes, organizar as informações por ambiente e permitir que a equipe acompanhe o funcionamento das conexões.

O DataTables não substituirá ferramentas existentes. Ele será uma camada adicional de visualização, organização, monitoramento e diagnóstico técnico dentro do ecossistema Dshow Dash.

⸻

3. Objetivos da aplicação

3.1 Objetivo principal

Criar um ponto central de consulta e monitoramento de toda a infraestrutura de dados utilizada pelo Dshow Dash e pelas aplicações integradas, como Koala e outros sistemas internos ou externos.

3.2 Objetivos específicos

A aplicação deverá:

* mapear automaticamente servidores, bancos, tabelas e campos;
* mostrar a situação atual das conexões;
* identificar conexões online, instáveis, lentas ou indisponíveis;
* organizar os recursos por infraestrutura, aplicação e ambiente;
* documentar automaticamente a estrutura técnica dos bancos;
* auxiliar na identificação de falhas;
* mostrar informações relevantes para diagnóstico;
* identificar problemas de qualidade dos dados;
* identificar campos potencialmente sensíveis;
* monitorar crescimento de tabelas;
* identificar tabelas órfãs;
* identificar problemas de integridade referencial;
* emitir alertas internos e externos;
* permitir o gerenciamento das conexões monitoradas;
* centralizar informações para apoio aos desenvolvedores.

⸻

4. Público da aplicação

O DataTables será utilizado exclusivamente pela equipe de desenvolvimento.

4.1 Perfis de acesso

Inicialmente existirão dois perfis:

Administrador

Poderá:

* visualizar toda a infraestrutura;
* visualizar mensagens técnicas;
* visualizar nomes de servidores e bancos;
* cadastrar conexões;
* editar conexões;
* alterar configurações;
* configurar monitoramentos;
* configurar alertas;
* colocar conexões em manutenção;
* classificar tabelas;
* acessar informações detalhadas;
* visualizar campos potencialmente sensíveis;
* administrar canais de alerta.

Desenvolvedor

Poderá:

* visualizar toda a infraestrutura;
* visualizar mensagens técnicas;
* visualizar nomes de servidores e bancos;
* cadastrar conexões;
* editar conexões;
* configurar monitoramentos;
* configurar alertas;
* classificar tabelas;
* acessar informações detalhadas;
* visualizar campos potencialmente sensíveis.

Inicialmente, administrador e desenvolvedor possuirão permissões semelhantes. A estrutura de permissões deverá, entretanto, ser preparada para futuras diferenciações.

⸻

5. Escopo funcional

O DataTables deverá contemplar seis áreas principais:

1. Mapeamento da infraestrutura.
2. Catálogo de bancos, tabelas e campos.
3. Monitoramento das conexões.
4. Qualidade e integridade dos dados.
5. Alertas.
6. Administração das fontes monitoradas.

⸻

6. Fontes de dados monitoradas

O sistema deverá organizar as fontes nos seguintes grupos:

* bancos internos;
* bancos externos;
* APIs;
* integrações;
* arquivos;
* planilhas;
* filas;
* caches;
* serviços externos.

6.1 Bancos

Na primeira versão, o sistema deverá suportar bancos MySQL.

A arquitetura deverá ser preparada para futuramente suportar outros tipos de banco, sem exigir reformulação completa da aplicação.

6.2 Ambientes

Todos os ambientes existentes deverão ser identificados, incluindo:

* produção;
* homologação;
* desenvolvimento;
* teste;
* backup;
* legado;
* outros ambientes cadastrados.

Cada ambiente deverá possuir identificação visual própria.

6.3 Integrações externas

Também poderão aparecer no mapa central integrações como:

* Pipedrive;
* Asaas;
* Bling;
* Kondado;
* serviços de terceiros;
* APIs públicas ou privadas;
* plataformas conectadas ao Dshow Dash.

Essas integrações não necessariamente apresentarão o mesmo nível de detalhamento de um banco MySQL, mas deverão possuir:

* nome;
* tipo;
* aplicação vinculada;
* ambiente;
* status;
* última verificação;
* mensagem de erro;
* origem;
* destino;
* credencial válida ou inválida.

⸻

7. Descoberta automática

O DataTables deverá identificar automaticamente:

* servidores cadastrados;
* bancos existentes;
* schemas;
* tabelas;
* campos;
* tipos de campos;
* chaves primárias;
* chaves estrangeiras;
* índices;
* engine;
* collation;
* tamanho das tabelas;
* quantidade aproximada de registros;
* status das conexões.

A descoberta automática deverá ocorrer sem necessidade de cadastro manual de cada banco, tabela ou campo.

7.1 Cadastro inicial da conexão

Embora a descoberta dos objetos seja automática, cada servidor ou fonte deverá possuir uma conexão inicial cadastrada no DataTables.

Após o cadastro da fonte, o sistema realizará o inventário dos recursos disponíveis.

7.2 Bancos desativados

Bancos desativados, antigos ou legados deverão permanecer disponíveis para consulta histórica.

Eles deverão receber uma classificação visual, como:

* desativado;
* legado;
* arquivado;
* indisponível permanentemente.

O sistema não deverá apagar automaticamente o registro histórico de um banco que deixou de ser encontrado.

⸻

8. Formas de navegação

A aplicação deverá oferecer três formas principais de navegação.

8.1 Visão por infraestrutura

Hierarquia:

Servidor → Banco → Schema → Tabela → Campo

Essa visão deverá mostrar onde cada recurso está hospedado.

O usuário poderá expandir os níveis progressivamente até chegar aos campos de uma tabela.

8.2 Visão por aplicação

Hierarquia:

Aplicação → Módulo → Banco → Tabela → Campo

Essa visão deverá permitir organizar recursos associados a:

* Dshow Dash;
* Koala;
* aplicações internas;
* serviços;
* integrações.

Como a identificação automática do uso de tabelas pelas aplicações não faz parte do escopo inicial, a associação entre aplicação, módulo e banco poderá ser definida no cadastro da conexão ou na configuração da fonte.

Não será necessário mapear arquivos de código, endpoints ou telas que utilizam cada tabela.

8.3 Visão de dependências

A visão de dependências deverá mostrar relações estruturais identificadas pelo banco, principalmente:

* chaves estrangeiras;
* quantidade de referências;
* tabelas dependentes;
* tabelas referenciadas;
* tabelas órfãs;
* dependências excessivas;
* relacionamentos quebrados.

Não será necessário apresentar um diagrama gráfico de entidades e relacionamentos.

A visualização poderá ser apresentada em formato de:

* DataGrid;
* árvore hierárquica;
* lista expansível;
* painel lateral;
* agrupamentos por banco ou schema.

⸻

9. Dashboard principal

O dashboard será a tela inicial da aplicação.

Ele deverá fornecer uma visão rápida e objetiva da infraestrutura.

9.1 Big numbers

O dashboard deverá mostrar:

* total de servidores;
* total de VPSs;
* total de bancos;
* total de bancos online;
* total de bancos offline;
* total de bancos instáveis;
* total de bancos lentos;
* total de bancos em manutenção;
* total de conexões com credencial expirada;
* total de tabelas;
* total de campos;
* total de índices;
* total de chaves estrangeiras;
* total de tabelas críticas;
* total de alertas ativos;
* total de erros recentes.

9.2 Distribuição por ambiente

O dashboard deverá apresentar a distribuição dos recursos entre:

* produção;
* homologação;
* desenvolvimento;
* teste;
* backup;
* legado.

A visualização poderá utilizar:

* gráfico de barras;
* gráfico de rosca;
* cards agrupados;
* lista segmentada.

9.3 Bancos com problemas

Deverá existir uma área específica contendo:

* bancos offline;
* bancos lentos;
* bancos instáveis;
* credenciais expiradas;
* falhas de autenticação;
* conexões em manutenção;
* bancos com pouco espaço disponível;
* bancos com erros recentes.

Para cada item, mostrar:

* servidor;
* banco;
* ambiente;
* status;
* duração do status;
* última verificação;
* mensagem resumida;
* severidade.

9.4 Pendências estruturais

O dashboard poderá mostrar:

* bancos ainda não inventariados;
* bancos sem metadados suficientes;
* tabelas sem comentários no banco;
* tabelas órfãs;
* chaves estrangeiras quebradas;
* campos obrigatórios com valores nulos;
* tabelas com crescimento anormal;
* tabelas consideradas grandes;
* novas tabelas identificadas.

A documentação será baseada predominantemente nos metadados técnicos extraídos do próprio banco. Não será necessário criar uma documentação colaborativa manual.

⸻

10. Listagem de servidores

A página de servidores deverá mostrar todos os servidores e VPSs cadastrados.

10.1 Informações da listagem

Cada servidor deverá mostrar:

* nome;
* identificador;
* hostname;
* IP mascarado ou completo, conforme configuração;
* ambiente;
* tipo;
* provedor;
* quantidade de bancos;
* bancos online;
* bancos offline;
* status geral;
* última verificação;
* último erro;
* espaço disponível, quando possível;
* conexão ativa ou inativa.

10.2 Ações disponíveis

O usuário poderá:

* abrir detalhes;
* editar a configuração;
* ativar ou desativar o monitoramento;
* colocar em manutenção;
* configurar regras de alerta;
* visualizar bancos encontrados;
* visualizar falhas;
* renovar ou atualizar credenciais.

⸻

11. Listagem de bancos

A página de bancos deverá ser apresentada em DataGrid.

11.1 Colunas recomendadas

* status;
* nome do banco;
* servidor;
* ambiente;
* tipo;
* quantidade de tabelas;
* quantidade de campos;
* tamanho total;
* disponibilidade em 24 horas;
* disponibilidade em 7 dias;
* disponibilidade em 30 dias;
* disponibilidade em 90 dias;
* conexões ativas;
* última verificação;
* último teste bem-sucedido;
* último erro;
* credencial;
* manutenção;
* alertas ativos.

11.2 Filtros

Permitir filtros por:

* servidor;
* ambiente;
* status;
* criticidade;
* tipo de fonte;
* manutenção;
* credencial expirada.

11.3 Ordenação

Permitir ordenar por:

* nome;
* status;
* ambiente;
* tamanho;
* quantidade de tabelas;
* disponibilidade;
* última verificação;
* quantidade de alertas.

⸻

12. Card de saúde do banco

Cada banco deverá possuir um card de saúde contendo:

* status atual;
* disponibilidade;
* quantidade de tabelas;
* quantidade de campos;
* tamanho total;
* conexões ativas;
* latência da verificação;
* último erro;
* última verificação;
* último teste bem-sucedido;
* duração do status atual;
* credencial válida ou expirada;
* quantidade de alertas ativos.

A latência será utilizada como um indicador básico de saúde da conexão, e não como uma ferramenta completa de análise de performance.

⸻

13. Status das conexões

Cada conexão poderá apresentar um dos seguintes status:

13.1 Online

A conexão foi realizada com sucesso e todos os testes essenciais foram concluídos.

Identificação visual: verde.

13.2 Instável

A conexão apresenta falhas intermitentes, respostas inconsistentes ou alternância frequente de status.

Identificação visual: amarelo.

13.3 Lento

A conexão funciona, mas a verificação ultrapassou o limite configurado.

Identificação visual: amarelo.

13.4 Offline

Não foi possível estabelecer ou manter a conexão.

Identificação visual: vermelho.

13.5 Não testado

A conexão ainda não foi verificada.

Identificação visual: cinza.

13.6 Manutenção

A conexão foi colocada manualmente em manutenção.

Identificação visual: azul.

13.7 Credencial expirada

A conexão não pôde ser realizada devido a credencial inválida, vencida, removida ou sem permissão suficiente.

Identificação visual: vermelho, com ícone específico de credencial.

13.8 Regra de acessibilidade

Nenhum status deverá depender exclusivamente da cor.

Todos os status deverão conter:

* cor;
* ícone;
* texto;
* tooltip;
* descrição acessível.

⸻

14. Verificação de conexão

A aplicação deverá verificar automaticamente as conexões a cada cinco minutos.

Também deverá existir uma verificação sob demanda realizada pelo próprio sistema em situações específicas, como:

* após cadastrar uma conexão;
* após alterar uma credencial;
* após remover o status de manutenção;
* após detectar recuperação de conexão;
* após uma falha de autenticação ser corrigida.

Não será necessário disponibilizar um botão genérico de teste manual na listagem principal.

14.1 Etapas da verificação

A rotina deverá testar:

1. Resolução e acesso ao servidor.
2. Abertura da conexão.
3. Autenticação.
4. Seleção do banco.
5. Execução de consulta simples.
6. Permissão de leitura.
7. Permissão de gravação.
8. Tempo total da verificação.

14.2 Teste de leitura

O teste de leitura deverá utilizar uma consulta simples, segura e de baixo custo.

Exemplo conceitual:

SELECT 1

14.3 Teste de gravação

O teste de gravação não deverá criar dados em tabelas de negócio.

Deverá existir uma tabela técnica exclusiva para monitoramento.

Fluxo recomendado:

1. Inserir um registro técnico temporário.
2. Confirmar que o registro foi criado.
3. Excluir o registro imediatamente.
4. Registrar o resultado.
5. Encerrar a transação.

Quando possível, o teste poderá utilizar uma transação com rollback.

O sistema deverá evitar qualquer alteração em dados reais de produção.

⸻

15. Disponibilidade

A aplicação deverá calcular a disponibilidade de cada banco nos períodos:

* últimas 24 horas;
* últimos 7 dias;
* últimos 30 dias;
* últimos 90 dias.

15.1 Cálculo

A disponibilidade deverá considerar o resultado das verificações automáticas realizadas a cada cinco minutos.

Fórmula conceitual:

Disponibilidade = verificações bem-sucedidas ÷ total de verificações previstas × 100

Períodos de manutenção planejada poderão ser tratados separadamente para não serem confundidos com indisponibilidade inesperada.

15.2 Interrupções

Cada interrupção deverá registrar:

* início;
* fim;
* duração;
* banco;
* servidor;
* ambiente;
* motivo;
* status identificado;
* último erro;
* recuperação detectada.

O sistema deverá mostrar:

* quantidade de falhas no período;
* duração total de indisponibilidade;
* maior período de indisponibilidade;
* conexão atualmente indisponível ou recuperada.

Não será necessário calcular o tempo médio de recuperação.

⸻

16. Informações de performance e banco

A aplicação deverá coletar informações disponíveis diretamente no MySQL.

16.1 Indicadores

Mostrar, quando tecnicamente disponível:

* latência da verificação;
* quantidade de conexões;
* consultas ativas;
* consultas lentas;
* bloqueios;
* deadlocks;
* tamanho total do banco;
* tamanho das tabelas;
* espaço disponível;
* crescimento de tabelas.

Embora não exista um módulo completo de performance, esses indicadores deverão auxiliar no diagnóstico da saúde do banco.

16.2 Limites

Os limites deverão ser configuráveis por conexão.

Exemplo:

* normal;
* atenção;
* crítico.

As regras poderão considerar:

* tempo de conexão;
* tempo da consulta de teste;
* quantidade de conexões;
* espaço utilizado;
* espaço disponível;
* quantidade de bloqueios;
* ocorrência de deadlocks;
* crescimento de tabelas.

16.3 Limitação

O DataTables terá acesso apenas às informações disponibilizadas pelo banco e pelas permissões do usuário de conexão.

Não será obrigatório monitorar diretamente:

* CPU do servidor;
* memória do sistema operacional;
* processos do sistema operacional;
* tráfego de rede da VPS.

⸻

17. Página de detalhes do banco

A página de detalhes deverá possuir as seguintes seções:

17.1 Resumo

* nome;
* servidor;
* ambiente;
* status;
* tamanho;
* quantidade de tabelas;
* quantidade de campos;
* disponibilidade;
* conexões;
* última verificação.

17.2 Saúde

* status atual;
* duração do status;
* último teste bem-sucedido;
* último erro;
* resultado do teste de leitura;
* resultado do teste de gravação;
* credencial;
* manutenção.

17.3 Estrutura

* schemas;
* tabelas;
* views, quando aplicável;
* quantidade de campos;
* índices;
* chaves estrangeiras.

17.4 Capacidade

* tamanho atual;
* espaço estimado disponível;
* maiores tabelas;
* tabelas com crescimento anormal.

17.5 Problemas

* erros;
* alertas;
* tabelas órfãs;
* chaves quebradas;
* campos obrigatórios vazios;
* duplicidades;
* datas inválidas;
* valores fora do padrão.

17.6 Configuração

* dados da conexão;
* monitoramento;
* frequência;
* alertas;
* manutenção;
* credenciais.

⸻

18. Listagem de tabelas

A página de tabelas deverá utilizar um DataGrid técnico.

18.1 Informações da tabela

Mostrar:

* nome;
* banco;
* schema;
* servidor;
* ambiente;
* status;
* classificação;
* quantidade de campos;
* quantidade aproximada de registros;
* tamanho;
* data de criação, quando disponível;
* última alteração, quando disponível;
* engine;
* collation;
* chave primária;
* quantidade de chaves estrangeiras;
* quantidade de índices;
* quantidade de dependências;
* problemas identificados;
* score de saúde.

18.2 Classificação

Uma tabela poderá ser classificada como:

* ativa;
* legada;
* temporária;
* crítica;
* depreciada;
* em migração.

A classificação poderá ser automática ou alterada por administrador ou desenvolvedor.

18.3 Tabelas grandes

O sistema deverá identificar tabelas consideradas grandes.

A classificação poderá considerar:

* tamanho em disco;
* quantidade de registros;
* crescimento no período;
* percentual do tamanho total do banco.

Os limites deverão ser configuráveis.

18.4 Crescimento anormal

O sistema deverá identificar crescimento anormal considerando:

* aumento percentual;
* aumento absoluto;
* média histórica;
* crescimento acima do limite configurado.

⸻

19. Página de detalhes da tabela

A página deverá ser dividida nas seguintes áreas:

19.1 Visão geral

* nome;
* banco;
* schema;
* servidor;
* ambiente;
* classificação;
* tamanho;
* quantidade aproximada de registros;
* quantidade de campos;
* engine;
* collation;
* data de criação;
* última alteração.

19.2 Campos

DataGrid contendo todos os campos.

19.3 Índices

* nome;
* tipo;
* campos envolvidos;
* unicidade;
* cardinalidade, quando disponível;
* status.

19.4 Chaves

* chave primária;
* chaves estrangeiras;
* tabela de destino;
* campo de destino;
* integridade;
* relacionamento válido ou quebrado.

19.5 Qualidade

* valores nulos;
* duplicidades;
* chaves inválidas;
* datas inválidas;
* valores fora do padrão;
* campos obrigatórios vazios.

19.6 Dependências

* tabelas referenciadas;
* tabelas que referenciam;
* quantidade de dependências;
* tabela órfã;
* dependência excessiva.

19.7 Saúde

* score;
* problemas ativos;
* alertas;
* impacto no status.

⸻

20. Informações dos campos

A listagem de campos deverá mostrar:

* nome;
* tipo;
* tamanho;
* precisão;
* escala;
* valor padrão;
* aceita nulo;
* chave primária;
* chave estrangeira;
* índice;
* auto incremento;
* comentário existente no banco;
* classificação automática;
* problemas identificados.

20.1 Etiquetas automáticas

Os campos poderão receber etiquetas como:

* chave primária;
* chave estrangeira;
* identificador;
* financeiro;
* pessoal;
* sensível;
* técnico;
* auditoria;
* data;
* status;
* depreciado.

20.2 Identificação de dados potencialmente sensíveis

O sistema deverá classificar automaticamente campos relacionados a:

* CPF;
* CNPJ;
* telefone;
* e-mail;
* endereço;
* dados bancários;
* informações financeiras;
* documentos;
* credenciais;
* tokens;
* senhas;
* dados pessoais.

A classificação será baseada apenas nos metadados, como:

* nome do campo;
* comentário;
* tipo;
* tabela;
* padrões conhecidos.

O DataTables não precisará exibir os valores reais armazenados nos campos.

20.3 Campos sem uso aparente

Um campo poderá ser identificado como aparentemente sem uso quando apresentar sinais como:

* todos os registros nulos;
* todos os registros com o mesmo valor;
* ausência de atualização;
* campo depreciado;
* campo sem índice ou relacionamento e sem preenchimento;
* campo existente em tabela ativa, mas sem dados relevantes.

Essa classificação deverá ser apresentada como indício, não como confirmação definitiva.

⸻

21. Busca global

A aplicação deverá possuir uma busca global capaz de localizar:

* servidor;
* banco;
* schema;
* tabela;
* campo.

21.1 Pesquisa de campos

O usuário poderá pesquisar um campo e identificar todas as tabelas em que ele existe.

Exemplo:

Pesquisa: Id_Usuario

Resultado:

* banco;
* schema;
* tabela;
* campo;
* tipo;
* chave;
* ambiente;
* servidor.

A pesquisa deverá suportar principalmente correspondência exata.

Poderá existir uma opção separada para busca aproximada, mas ela não é obrigatória na primeira versão.

⸻

22. Filtros

As principais listagens deverão permitir filtros por:

* servidor;
* ambiente;
* status;
* criticidade;
* banco;
* schema;
* classificação;
* presença de erro;
* presença de alerta;
* campo sensível;
* tabela grande;
* tabela órfã;
* problema de qualidade.

Não será necessário:

* salvar filtros;
* compartilhar filtros;
* manter histórico de pesquisas;
* criar favoritos.

⸻

23. Dependências e integridade

Não será necessário criar um diagrama visual de relacionamentos.

A aplicação deverá utilizar listas, árvores ou tabelas para mostrar dependências.

23.1 Tabelas órfãs

O sistema deverá identificar tabelas que:

* não possuem chave estrangeira;
* não são referenciadas por outras tabelas;
* não possuem relacionamento estrutural identificado.

Uma tabela órfã não deverá ser automaticamente considerada problemática. O sistema deverá apenas sinalizar a condição.

23.2 Chaves estrangeiras quebradas

O sistema deverá identificar situações como:

* referência para tabela inexistente;
* referência para campo inexistente;
* incompatibilidade de tipos;
* registros sem correspondência;
* restrição inválida;
* erro estrutural.

23.3 Dependências excessivas

Tabelas com grande quantidade de referências deverão ser destacadas.

A regra deverá ser configurável por:

* quantidade de tabelas dependentes;
* quantidade de chaves estrangeiras;
* número total de relacionamentos.

⸻

24. Qualidade dos dados

O DataTables deverá executar análises automáticas de qualidade.

24.1 Problemas identificados

* campos com muitos valores nulos;
* registros duplicados;
* chaves inválidas;
* relacionamentos quebrados;
* datas incorretas;
* valores fora do padrão;
* campos obrigatórios vazios.

24.2 Campos com muitos valores nulos

A aplicação deverá mostrar:

* quantidade de valores nulos;
* percentual de valores nulos;
* campo aceita nulo ou não;
* severidade;
* impacto.

24.3 Registros duplicados

A análise deverá priorizar:

* chaves únicas;
* combinações configuradas;
* identificadores;
* campos com índice único.

O sistema deverá evitar consultas pesadas que possam comprometer produção.

24.4 Datas incorretas

Poderão ser identificadas:

* datas inválidas;
* datas muito futuras;
* datas anteriores a limites plausíveis;
* datas zeradas;
* formatos inconsistentes.

24.5 Valores fora do padrão

A identificação poderá considerar:

* valores incompatíveis com o tipo esperado;
* tamanhos incomuns;
* domínios de status;
* padrões de CPF, CNPJ, telefone e e-mail;
* valores vazios em campos obrigatórios.

24.6 Impacto no status

Problemas de qualidade deverão impactar o status de saúde da tabela.

Entretanto, problemas de qualidade não deverão mudar o status da conexão do banco.

Exemplo:

* banco: online;
* tabela: saúde em atenção;
* motivo: 80% de valores nulos em campo obrigatório.

⸻

25. Score de saúde da tabela

Cada tabela deverá possuir um score de saúde.

25.1 Dimensões

O score deverá considerar:

* disponibilidade do banco;
* indicadores básicos de performance;
* qualidade dos dados;
* metadados disponíveis;
* segurança;
* dependências;
* integridade estrutural.

25.2 Classificação sugerida

* saudável;
* atenção;
* crítico;
* não avaliado.

25.3 Exemplo de cálculo

O score poderá variar de 0 a 100:

* disponibilidade: 20 pontos;
* performance: 15 pontos;
* qualidade: 30 pontos;
* metadados técnicos: 10 pontos;
* segurança: 10 pontos;
* dependências e integridade: 15 pontos.

A ponderação deverá ser configurável no futuro.

25.4 Limitação

O score será um indicador técnico auxiliar. Ele não deverá ser apresentado como avaliação definitiva da utilidade ou importância da tabela.

⸻

26. Alertas

O DataTables deverá emitir alertas internos e externos.

26.1 Situações monitoradas

Gerar alertas para:

* banco offline;
* conexão lenta;
* conexão instável;
* falha de autenticação;
* credencial expirada;
* pouco espaço disponível;
* nova tabela;
* exclusão de campo;
* alteração de tipo;
* aumento inesperado de registros;
* crescimento anormal de tabela;
* chave estrangeira quebrada;
* problema crítico de qualidade;
* falha no teste de gravação;
* falha no teste de leitura.

26.2 Severidade

Os alertas deverão possuir três níveis:

Informativo

Exemplos:

* nova tabela identificada;
* novo campo identificado;
* banco colocado em manutenção.

Atenção

Exemplos:

* conexão lenta;
* crescimento anormal;
* quantidade elevada de valores nulos;
* pouco espaço disponível.

Crítico

Exemplos:

* banco offline;
* falha de autenticação;
* credencial expirada;
* falha de leitura;
* falha de gravação;
* integridade referencial comprometida.

26.3 Alertas internos

Os alertas deverão aparecer dentro da aplicação por meio de:

* central de alertas;
* badges;
* cards;
* indicadores nas listagens;
* notificações no header;
* painel de ocorrências.

26.4 Canais externos

A estrutura deverá permitir envio por:

* e-mail;
* WhatsApp;
* Slack;
* webhook;
* outros canais futuros.

Cada conexão poderá possuir canais diferentes.

26.5 Deduplicação

O sistema não deverá gerar repetidamente o mesmo alerta enquanto o problema continuar ativo.

Deverá existir:

* identificação única do incidente;
* agrupamento de ocorrências;
* contador de repetições;
* data da primeira ocorrência;
* data da última ocorrência;
* status ativo ou resolvido.

26.6 Períodos de silêncio

O usuário poderá configurar períodos em que determinados alertas não serão enviados externamente.

O alerta poderá continuar sendo registrado internamente.

26.7 Regras por banco

Cada banco poderá possuir regras próprias para:

* limites;
* frequência;
* severidade;
* canais;
* destinatários;
* deduplicação;
* períodos de silêncio;
* tipos de alerta habilitados.

⸻

27. Manutenção planejada

O usuário poderá colocar:

* servidor;
* banco;
* integração;
* API;
* fonte de dados;

em modo de manutenção.

27.1 Informações da manutenção

* início;
* fim previsto;
* motivo;
* usuário responsável;
* recursos afetados;
* alertas suspensos;
* observação.

27.2 Comportamento

Durante a manutenção:

* o status deverá ser azul;
* o sistema poderá continuar realizando verificações;
* falhas não deverão gerar alertas críticos externos, conforme configuração;
* o histórico deverá diferenciar manutenção de indisponibilidade.

⸻

28. Central de alertas

A central deverá mostrar:

* alertas ativos;
* alertas resolvidos;
* severidade;
* origem;
* servidor;
* banco;
* tabela;
* ambiente;
* primeira ocorrência;
* última ocorrência;
* quantidade de repetições;
* mensagem técnica;
* status.

28.1 Filtros

* severidade;
* status;
* servidor;
* banco;
* ambiente;
* tipo de alerta;
* período;
* canal.

28.2 Ações

* abrir detalhes;
* reconhecer alerta;
* silenciar;
* colocar recurso em manutenção;
* editar regra;
* marcar como resolvido, quando aplicável.

⸻

29. Mensagens de erro

As mensagens técnicas completas poderão ser visualizadas por administradores e desenvolvedores.

Cada erro deverá apresentar:

* código;
* mensagem;
* data e hora;
* servidor;
* banco;
* ambiente;
* etapa da verificação;
* teste executado;
* duração;
* contexto técnico;
* recomendação básica, quando conhecida.

Exemplos de etapas:

* acesso ao host;
* autenticação;
* seleção do banco;
* leitura;
* gravação;
* consulta de metadados;
* análise de qualidade.

As credenciais não deverão aparecer dentro das mensagens de erro.

⸻

30. Credenciais

As credenciais poderão ser armazenadas pelo sistema.

Apesar disso, deverão ser adotadas medidas mínimas de segurança.

30.1 Regras obrigatórias

* senha não poderá aparecer em texto aberto na interface;
* tokens deverão ser mascarados;
* strings de conexão deverão ocultar a senha;
* credenciais deverão ser criptografadas no armazenamento;
* a aplicação não deverá enviar credenciais para logs;
* respostas de APIs não deverão expor segredos;
* campos de senha não deverão retornar o valor atual ao front-end.

30.2 Permissões recomendadas

As conexões de monitoramento deverão utilizar usuários específicos e com permissões limitadas.

Para testes de gravação, o usuário deverá possuir acesso apenas à tabela técnica de monitoramento, quando possível.

⸻

31. Ações permitidas

O DataTables permitirá ações controladas, como:

* cadastrar conexão;
* editar conexão;
* ativar ou desativar monitoramento;
* atualizar credenciais;
* configurar alertas;
* silenciar alertas;
* colocar recursos em manutenção;
* classificar tabelas;
* alterar limites;
* reconhecer alertas;
* configurar canais;
* executar rotinas automáticas previstas pelo sistema.

⸻

32. Ações não permitidas

O DataTables não deverá permitir:

* execução livre de SQL;
* alteração manual de tabelas;
* criação de tabelas;
* exclusão de tabelas;
* criação ou remoção de campos;
* alteração de tipos;
* encerramento de consultas;
* encerramento de conexões;
* geração de scripts de migração;
* sincronização estrutural entre ambientes;
* restauração de estruturas;
* exportação completa dos dados;
* edição dos registros de negócio.

⸻

33. Consultas e proteção de produção

As rotinas de inventário e qualidade deverão ser planejadas para evitar impacto nos bancos de produção.

33.1 Regras

* limitar quantidade de consultas simultâneas;
* utilizar consultas de baixo custo;
* evitar varreduras completas em tabelas muito grandes;
* executar análises pesadas em horários configurados;
* utilizar amostragem quando apropriado;
* definir timeout;
* cancelar a rotina quando ultrapassar o limite;
* controlar frequência por banco;
* priorizar metadados do information_schema;
* registrar falhas sem repetir imediatamente a mesma consulta.

⸻

34. APIs e integrações

As APIs e integrações deverão possuir cards semelhantes aos bancos.

34.1 Informações

* nome;
* tipo;
* aplicação;
* ambiente;
* endpoint mascarado ou completo;
* autenticação;
* status;
* última verificação;
* último sucesso;
* último erro;
* duração do status;
* credencial;
* alertas ativos.

34.2 Verificação

Poderão ser testados:

* resolução;
* conectividade;
* autenticação;
* status HTTP;
* tempo de resposta;
* retorno esperado;
* validade da credencial.

⸻

35. Arquivos e planilhas

Arquivos e planilhas utilizados como fontes deverão poder ser catalogados.

35.1 Informações

* nome;
* tipo;
* origem;
* aplicação;
* ambiente;
* localização;
* tamanho;
* data da última atualização;
* status;
* leitura disponível;
* formato;
* último erro.

35.2 Exemplos

* CSV;
* Excel;
* Google Sheets;
* arquivos de importação;
* arquivos de integração;
* arquivos de backup.

⸻

36. Atualização do inventário

O inventário deverá ser atualizado automaticamente.

36.1 Frequências distintas

A frequência do inventário estrutural poderá ser diferente da verificação da conexão.

Sugestão:

* conexão: a cada cinco minutos;
* metadados básicos: periodicamente;
* tamanho e quantidade de registros: em intervalo maior;
* análise de qualidade: em horários configurados;
* descoberta de novas tabelas: periodicamente.

36.2 Novos objetos

Quando uma nova tabela ou campo for identificado:

* cadastrar automaticamente;
* associar ao servidor, banco e ambiente;
* registrar a descoberta;
* gerar alerta informativo;
* incluir nas quantidades gerais.

36.3 Objetos removidos

Quando uma tabela ou campo deixar de existir:

* não excluir imediatamente do catálogo;
* marcar como não encontrado;
* registrar data da última identificação;
* gerar alerta;
* permitir consulta histórica mínima.

Embora o histórico completo de alterações estruturais não faça parte do escopo, o sistema precisa guardar informações suficientes para detectar criação, exclusão ou alteração de tipo, pois esses eventos gerarão alertas.

⸻

37. DataGrids

As principais listagens deverão utilizar DataGrids profissionais.

37.1 Recursos esperados

* ordenação;
* filtros;
* paginação;
* redimensionamento de colunas;
* agrupamento;
* expansão de linhas;
* seleção;
* atualização automática;
* destaque de status;
* tooltips;
* cabeçalho fixo;
* linhas zebradas;
* estado de carregamento;
* estado vazio;
* estado de erro;
* responsividade;
* atualização parcial sem recarregar a página.

37.2 Atualização em tempo real

As alterações de status deverão ser atualizadas sem necessidade de recarregar toda a aplicação.

Pode ser utilizado:

* polling;
* Server-Sent Events;
* WebSocket;
* atualização incremental.

⸻

38. Estrutura de telas

A aplicação deverá possuir, no mínimo, as seguintes telas:

38.1 Dashboard

Visão geral da infraestrutura.

38.2 Infraestrutura

Árvore de servidores, bancos, schemas, tabelas e campos.

38.3 Aplicações

Organização das fontes por aplicação e módulo.

38.4 Servidores

DataGrid de servidores e VPSs.

38.5 Bancos

DataGrid com saúde, disponibilidade e estrutura.

38.6 Detalhes do banco

Informações completas do banco.

38.7 Tabelas

DataGrid com todas as tabelas catalogadas.

38.8 Detalhes da tabela

Campos, índices, chaves, qualidade e dependências.

38.9 Busca global

Busca por servidor, banco, tabela ou campo.

38.10 Dependências

Listagem estrutural de relacionamentos.

38.11 Qualidade

Problemas de qualidade identificados.

38.12 Alertas

Central de alertas ativos e resolvidos.

38.13 Manutenções

Recursos em manutenção e programação de períodos.

38.14 Integrações

APIs, plataformas e serviços externos.

38.15 Administração

Conexões, credenciais, limites, frequências e canais.

⸻

39. Componentes visuais

39.1 Header da aplicação

Deverá conter:

* título DataTables;
* busca global;
* status geral;
* total de alertas;
* última atualização;
* botão de atualização da interface;
* acesso à administração.

39.2 Menu lateral

Sugestão:

* Visão geral;
* Infraestrutura;
* Aplicações;
* Servidores;
* Bancos;
* Tabelas;
* Campos;
* Dependências;
* Qualidade;
* Integrações;
* Alertas;
* Manutenções;
* Configurações.

39.3 Painel de detalhes

Itens selecionados no DataGrid poderão abrir:

* página completa;
* drawer lateral;
* modal técnico.

Para bancos e tabelas, a preferência deverá ser por página completa devido ao volume de informações.

⸻

40. Modelo conceitual de dados interno

O DataTables poderá utilizar entidades como:

Infraestrutura

* DT_Servidor
* DT_Ambiente
* DT_Fonte
* DT_Conexao
* DT_Aplicacao
* DT_Modulo

Catálogo

* DT_Banco
* DT_Schema
* DT_Tabela
* DT_Campo
* DT_Indice
* DT_Chave_Estrangeira
* DT_Dependencia

Monitoramento

* DT_Status_Atual
* DT_Verificacao_Resumo
* DT_Interrupcao
* DT_Manutencao
* DT_Metrica_Banco
* DT_Metrica_Tabela

Qualidade

* DT_Regra_Sistema
* DT_Problema_Qualidade
* DT_Score_Tabela
* DT_Classificacao_Campo

Alertas

* DT_Alerta
* DT_Alerta_Ocorrencia
* DT_Regra_Alerta
* DT_Canal_Alerta
* DT_Silencio_Alerta

Segurança

* DT_Credencial
* DT_Permissao
* DT_Perfil

⸻

41. Regras de retenção

Embora não seja necessário manter o histórico completo de cada teste, o sistema precisará armazenar informações agregadas suficientes para calcular disponibilidade.

41.1 Estratégia recomendada

* manter status atual;
* manter interrupções;
* manter agregações por hora;
* manter agregações por dia;
* manter último sucesso;
* manter último erro;
* manter contadores;
* remover verificações detalhadas antigas;
* preservar estatísticas de até 90 dias.

Isso permitirá calcular disponibilidade sem armazenar indefinidamente cada execução individual.

⸻

42. Requisitos não funcionais

42.1 Performance

* carregamento inicial otimizado;
* paginação no servidor;
* consultas assíncronas;
* cache de metadados;
* atualização incremental;
* evitar consultas pesadas em produção;
* tempos limite configuráveis.

42.2 Segurança

* credenciais criptografadas;
* autenticação integrada ao Dshow Dash;
* autorização por perfil;
* proteção contra SQL injection;
* proteção contra exposição de segredos;
* comunicação HTTPS;
* validação de entrada;
* segregação entre front-end e credenciais.

42.3 Disponibilidade

O DataTables deverá continuar mostrando os últimos dados conhecidos quando uma fonte estiver offline.

42.4 Escalabilidade

A estrutura deverá suportar:

* múltiplas VPSs;
* centenas de bancos;
* milhares de tabelas;
* dezenas de milhares de campos;
* múltiplas aplicações;
* novas categorias de fonte.

42.5 Usabilidade

A interface deverá permitir encontrar rapidamente qualquer banco, tabela ou campo sem exigir conhecimento prévio da localização exata.

⸻

43. Regras de negócio principais

1. Toda fonte deverá estar vinculada a um ambiente.
2. Toda conexão deverá possuir status atual.
3. Toda conexão deverá ser verificada a cada cinco minutos.
4. A descoberta de bancos, tabelas e campos será automática.
5. Bancos removidos não serão apagados automaticamente.
6. Nenhuma senha será exibida na interface.
7. Testes de gravação não poderão utilizar tabelas de negócio.
8. Problemas de qualidade afetarão a saúde da tabela, não o status da conexão.
9. Manutenções deverão ser diferenciadas de falhas.
10. Alertas repetidos deverão ser agrupados.
11. Cada banco poderá possuir regras próprias.
12. A aplicação não permitirá SQL livre.
13. A aplicação não permitirá alterar a estrutura dos bancos.
14. A busca deverá localizar campos em qualquer banco catalogado.
15. Objetos novos ou removidos poderão gerar alertas.
16. Os últimos dados conhecidos deverão continuar visíveis quando a fonte estiver offline.
17. A latência será um indicador básico, não um módulo completo de performance.
18. Informações técnicas completas serão acessíveis à equipe de desenvolvimento.

⸻

44. Critérios de aceite da primeira versão

A primeira versão será considerada funcional quando permitir:

* cadastrar conexões MySQL;
* identificar automaticamente os bancos;
* identificar schemas;
* identificar tabelas;
* identificar campos;
* identificar índices;
* identificar chaves primárias e estrangeiras;
* separar ambientes;
* mostrar servidores e VPSs;
* verificar conexões a cada cinco minutos;
* testar autenticação;
* testar leitura;
* testar gravação de forma segura;
* mostrar status visual;
* calcular disponibilidade;
* registrar interrupções;
* mostrar último sucesso;
* mostrar último erro;
* mostrar tamanho das tabelas;
* mostrar quantidade aproximada de registros;
* pesquisar bancos, tabelas e campos;
* identificar campos sensíveis;
* identificar tabelas órfãs;
* identificar chaves quebradas;
* identificar problemas básicos de qualidade;
* calcular score de saúde da tabela;
* gerar alertas internos;
* aplicar deduplicação;
* configurar períodos de silêncio;
* colocar conexões em manutenção;
* mostrar dashboard com big numbers;
* organizar recursos por infraestrutura;
* organizar recursos por aplicação;
* manter bancos antigos no catálogo.

⸻

45. Priorização de desenvolvimento

Fase 1 — Catálogo e infraestrutura

* cadastro de servidores;
* cadastro de conexões;
* ambientes;
* descoberta automática;
* servidores;
* bancos;
* schemas;
* tabelas;
* campos;
* índices;
* chaves;
* busca global.

Fase 2 — Monitoramento

* verificação a cada cinco minutos;
* teste de leitura;
* teste de gravação;
* status;
* último sucesso;
* último erro;
* interrupções;
* disponibilidade;
* manutenção.

Fase 3 — Dashboard e alertas

* big numbers;
* bancos com problemas;
* distribuição por ambiente;
* central de alertas;
* severidade;
* deduplicação;
* silêncio;
* canais externos.

Fase 4 — Qualidade e integridade

* valores nulos;
* duplicidades;
* chaves inválidas;
* datas incorretas;
* valores fora do padrão;
* tabelas órfãs;
* dependências excessivas;
* score de saúde.

Fase 5 — Fontes adicionais

* APIs;
* Pipedrive;
* Asaas;
* Bling;
* Kondado;
* arquivos;
* planilhas;
* filas;
* caches.

⸻

46. Funcionalidades fora do escopo inicial

Não fazem parte da primeira versão:

* execução livre de SQL;
* editor de registros;
* alteração da estrutura dos bancos;
* criação de tabelas;
* exclusão de tabelas;
* comparação entre produção e homologação;
* geração de scripts SQL;
* sincronização entre ambientes;
* encerramento de consultas;
* diagramas gráficos de relacionamento;
* exportação CSV, Excel, JSON, PDF ou Markdown;
* documentação colaborativa;
* comentários;
* responsáveis por tabela;
* favoritos;
* filtros salvos;
* histórico completo de alterações;
* auditoria detalhada de ações;
* mapeamento automático do código que utiliza cada tabela;
* identificação de endpoints vinculados às tabelas;
* cálculo do impacto de uma falha sobre aplicações;
* monitoramento direto de CPU e memória da VPS.

⸻

47. Resultado esperado

Ao final do desenvolvimento, a equipe deverá possuir uma aplicação centralizada capaz de responder rapidamente a perguntas como:

* Quais bancos existem?
* Em quais servidores estão hospedados?
* Quais bancos estão offline?
* Quais conexões estão instáveis?
* Qual foi a última conexão bem-sucedida?
* Quais credenciais estão expiradas?
* Quantas tabelas e campos existem?
* Em quais tabelas determinado campo aparece?
* Quais tabelas são maiores?
* Quais tabelas estão crescendo de forma anormal?
* Quais tabelas possuem problemas de qualidade?
* Quais campos podem conter informações sensíveis?
* Quais tabelas estão órfãs?
* Quais chaves estrangeiras apresentam problemas?
* Quais bancos pertencem a cada ambiente?
* Quais alertas estão ativos?
* Quais recursos estão em manutenção?

O DataTables deverá se tornar o ponto central de visualização e acompanhamento da infraestrutura de dados do ecossistema Dshow Dash, oferecendo uma visão técnica clara, atualizada e organizada para a equipe de desenvolvimento.

Um ponto técnico especialmente importante é manter o teste de gravação isolado em uma tabela exclusiva de monitoramento, evitando qualquer inserção em tabelas reais de produção.