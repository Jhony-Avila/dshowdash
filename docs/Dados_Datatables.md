Dados Datatables

Projeto: Auditoria profunda de fontes e bancos não identificados
Aplicação: DataTables
Plataforma: Dshow Dash
Objetivo principal: localizar, validar, catalogar e monitorar todos os bancos de dados e fontes técnicas utilizados pelo ecossistema Dshow, inclusive bancos que não foram encontrados pelo inventário atual.

⸻

2. Contexto do problema

A implementação atual do DataTables identificou apenas uma parte da infraestrutura real.

Nos prints atuais, o sistema apresenta apenas:

* um servidor;
* uma conexão;
* um banco;
* 143 tabelas;
* 1.681 campos;
* aproximadamente 127 MB catalogados.

Esses números não representam toda a infraestrutura existente.

O ecossistema Dshow possui diversos bancos, aplicações, integrações, servidores, VPSs e processos que podem utilizar conexões distintas.

Entre os bancos já conhecidos historicamente no ambiente estão, por exemplo:

* DSHOW_PROD;
* DSHOW_REF;
* Logs;
* APIS;
* INTEGRACAO;
* Intermediaria;
* MONITORAMENTO_DADOS;
* Backups;
* Led_Lovers_PROD;
* Kondado;
* CEP_CIDADES;
* Transacoes_Financeiras;
* Vendas_Gerais;
* produtos;
* bancos ou schemas ligados ao Dshow Dash;
* bancos ou estruturas utilizadas pelo Koala;
* bancos criados para aplicações, monitoramento, integrações ou testes.

Essa relação deve ser tratada apenas como ponto de partida. O inventário não poderá depender somente de nomes já conhecidos, pois o objetivo é descobrir também recursos desconhecidos, antigos, temporários, esquecidos ou documentados incorretamente.

⸻

3. Problema central

O DataTables está atualmente inventariando somente bancos visíveis através das conexões cadastradas.

Isso significa que um banco pode não aparecer por diversos motivos:

* o servidor não foi cadastrado;
* a VPS não foi descoberta;
* a conexão utiliza outro host;
* o usuário MySQL não tem permissão para listar todos os bancos;
* o banco utiliza outro usuário ou outra porta;
* a credencial existe apenas em arquivos de configuração;
* a aplicação conecta por endereço interno;
* a aplicação utiliza túnel SSH;
* a conexão ocorre através de Docker;
* o banco está em uma rede privada;
* a conexão é criada dinamicamente;
* existe configuração em variável de ambiente;
* existe conexão armazenada no banco;
* o nome do banco está hardcoded no código;
* o banco está em backup ou servidor legado;
* o banco foi desativado, mas ainda é referenciado;
* a aplicação utiliza réplica;
* o banco está em outro provedor;
* o banco é acessado através de API intermediária;
* o inventário atual consulta apenas um host;
* o usuário não possui permissão para SHOW DATABASES;
* o código ignora bancos sem acesso completo;
* erros de conexão não estão sendo exibidos;
* bancos com nomes filtrados foram descartados;
* existe cache antigo do inventário;
* o cron de descoberta não foi executado;
* o inventário falhou parcialmente e não informou isso.

⸻

4. Objetivo da nova fase

Esta fase deverá implementar uma auditoria completa e multicamada.

O sistema deverá responder:

* Quantos servidores de banco existem?
* Quantas VPSs possuem MySQL?
* Quais bancos existem em cada servidor?
* Quais bancos estão sendo utilizados atualmente?
* Quais bancos existem, mas não são utilizados?
* Quais bancos são conhecidos pelo código, mas não foram encontrados?
* Quais conexões estão configuradas em arquivos?
* Quais credenciais estão nas variáveis de ambiente?
* Quais aplicações utilizam hosts diferentes?
* Quais bancos não podem ser acessados por falta de permissão?
* Quais bancos estão offline?
* Quais bancos são backups?
* Quais bancos são legados?
* Quais bancos foram excluídos ou renomeados?
* Quais bancos ainda não foram cadastrados no DataTables?
* Quais fontes estão incompletas?
* Qual é o motivo de cada banco não ter sido captado?

⸻

5. Princípio da descoberta

A descoberta não deverá utilizar apenas uma fonte de informação.

Será necessário cruzar várias evidências.

As principais fontes serão:

1. Servidores e VPSs.
2. MySQL e information_schema.
3. Arquivos de configuração.
4. Variáveis de ambiente.
5. Código-fonte.
6. Scripts Python, PHP, JavaScript e shell.
7. Serviços e processos ativos.
8. Containers Docker.
9. Configurações do Nginx.
10. Crons.
11. Logs.
12. Backups.
13. Configurações de aplicações.
14. Bancos já catalogados.
15. Registros de integrações.
16. Histórico de conexões.
17. DNS e hostnames internos.
18. Documentações técnicas.
19. Secrets e arquivos protegidos.
20. Informações cadastradas manualmente pela equipe.

Nenhuma dessas fontes deverá ser considerada suficiente isoladamente.

⸻

6. Escopo da pesquisa

6.1 Infraestrutura

A pesquisa deverá abranger:

* VPSs de produção;
* VPSs de homologação;
* VPSs de desenvolvimento;
* servidores antigos;
* servidores de backup;
* servidores de integração;
* servidores do Dshow Dash;
* servidores de Koala;
* servidores de APIs;
* servidores de monitoramento;
* ambientes locais utilizados de forma compartilhada;
* containers;
* serviços gerenciados;
* hosts externos.

6.2 Aplicações

Deverão ser examinadas todas as aplicações e módulos, incluindo:

* Dshow Dash;
* Koala;
* sistemas legados;
* APIs PHP;
* scripts Python;
* robôs de sincronização;
* integrações Pipedrive;
* integrações Asaas;
* integrações Bling;
* integrações Kondado;
* rotinas financeiras;
* sistemas comerciais;
* sistemas de produtos;
* monitoramento;
* logs;
* backups;
* ferramentas internas;
* aplicações desativadas ainda presentes no servidor.

6.3 Tipos de fonte

Inicialmente, o foco continuará sendo MySQL e MariaDB.

Entretanto, a pesquisa deverá também registrar indícios de:

* PostgreSQL;
* Redis;
* SQLite;
* MongoDB;
* arquivos .db;
* arquivos .sqlite;
* planilhas;
* CSVs;
* caches;
* filas;
* APIs;
* armazenamento em arquivos.

Mesmo que não sejam inventariados nesta fase, eles não deverão ser ignorados.

⸻

7. Estratégia de descoberta em camadas

7.1 Camada 1 — Inventário dos servidores conhecidos

Criar uma lista inicial de todos os servidores e VPSs.

Para cada servidor, registrar:

* nome amigável;
* hostname;
* IP;
* provedor;
* ambiente;
* função;
* responsável;
* status;
* sistema operacional;
* acesso disponível;
* portas de banco conhecidas;
* aplicações hospedadas;
* última verificação.

A lista deverá ser construída a partir de:

* configurações do Dshow Dash;
* Nginx;
* DNS;
* scripts de deploy;
* arquivos SSH;
* documentação;
* histórico de backups;
* servidores já cadastrados;
* informações fornecidas pela equipe.

7.2 Camada 2 — Descoberta de serviços MySQL

Em cada servidor autorizado, verificar:

* serviço MySQL;
* serviço MariaDB;
* processo mysqld;
* portas abertas;
* sockets locais;
* containers executando banco;
* serviços iniciados pelo systemd;
* instâncias múltiplas;
* configurações em /etc/mysql;
* configurações em /etc/my.cnf;
* arquivos adicionais de configuração.

Portas comuns a verificar:

* 3306;
* 3307;
* 3308;
* portas personalizadas encontradas em arquivos.

A pesquisa não deverá realizar varredura indiscriminada em redes externas. Somente hosts e faixas previamente autorizados poderão ser analisados.

7.3 Camada 3 — Descoberta no próprio MySQL

Para cada conexão válida, executar inventário de:

* SHOW DATABASES;
* information_schema.SCHEMATA;
* permissões do usuário;
* bancos visíveis;
* bancos inacessíveis;
* schemas do sistema;
* quantidade de tabelas;
* tamanho;
* engine;
* collation.

Deverá diferenciar:

* banco inexistente;
* banco oculto por permissão;
* banco acessível;
* banco visível, mas sem acesso;
* banco vazio;
* banco do sistema;
* banco de aplicação;
* banco de backup;
* banco legado.

7.4 Camada 4 — Pesquisa de configurações

Pesquisar arquivos como:

* .env;
* .env.production;
* .env.local;
* .env.development;
* config.php;
* database.php;
* db.php;
* settings.php;
* config.json;
* config.yaml;
* config.yml;
* docker-compose.yml;
* docker-compose.yaml;
* ecosystem.config.js;
* arquivos de systemd;
* scripts shell;
* scripts Python;
* arquivos de deploy;
* arquivos de CI/CD.

Pesquisar chaves como:

* DB_HOST;
* DB_PORT;
* DB_NAME;
* DB_DATABASE;
* DB_USER;
* DATABASE_URL;
* MYSQL_HOST;
* MYSQL_DATABASE;
* MYSQL_PORT;
* PDO;
* mysqli;
* mysql.connector;
* pymysql;
* SQLAlchemy;
* strings de conexão.

As senhas não deverão ser armazenadas no resultado da pesquisa.

O sistema deverá registrar apenas:

* caminho do arquivo;
* aplicação;
* host;
* porta;
* banco;
* usuário mascarado;
* tipo de evidência;
* data da leitura.

7.5 Camada 5 — Pesquisa no código-fonte

Analisar o código em busca de:

* nomes de bancos hardcoded;
* conexões PDO;
* conexões mysqli;
* scripts Python de conexão;
* classes de banco;
* arquivos de migrations;
* comandos USE banco;
* referências qualificadas como banco.tabela;
* dumps SQL;
* comandos de backup;
* parâmetros de linha de comando;
* variáveis de ambiente esperadas.

Exemplos de padrões:

new PDO(...)
mysqli_connect(...)
mysql.connector.connect(...)
pymysql.connect(...)
CREATE DATABASE
USE DSHOW_PROD
DSHOW_PROD.Orcamento

O resultado deverá apontar:

* aplicação;
* arquivo;
* linha;
* nome do banco;
* host, quando presente;
* nível de confiança;
* status da validação.

7.6 Camada 6 — Pesquisa em crons e rotinas

Verificar:

* /etc/crontab;
* /etc/cron.d;
* crontabs de usuários;
* scripts agendados;
* timers systemd;
* filas;
* workers;
* runners;
* scripts de sincronização.

Esses arquivos podem revelar bancos que não aparecem na interface principal.

7.7 Camada 7 — Containers

Verificar:

* containers em execução;
* containers parados;
* imagens de banco;
* redes Docker;
* volumes;
* variáveis de ambiente;
* arquivos Compose;
* aliases de serviço.

Registrar:

* container;
* imagem;
* porta;
* rede;
* volume;
* banco;
* aplicação vinculada;
* status.

7.8 Camada 8 — Logs

Pesquisar logs de:

* MySQL;
* PHP;
* Python;
* Nginx;
* aplicações;
* workers;
* sincronizadores;
* systemd;
* containers.

Buscar mensagens como:

* Unknown database;
* Access denied;
* Connection refused;
* Can't connect;
* Unknown MySQL server host;
* nomes de bancos;
* hostnames;
* portas;
* falhas de autenticação.

Essa camada ajudará a encontrar conexões antigas ou quebradas.

7.9 Camada 9 — Backups

Pesquisar:

* arquivos .sql;
* .sql.gz;
* .dump;
* .bak;
* diretórios de backup;
* scripts de mysqldump;
* nomes de banco em arquivos;
* rotinas de restauração;
* storage remoto;
* backups automáticos.

Um banco presente apenas em backup deverá ser catalogado como:

* backup;
* histórico;
* não ativo;
* origem desconhecida;
* data do último backup.

7.10 Camada 10 — Reconciliação com o inventário atual

Ao final, cruzar:

* bancos encontrados no servidor;
* bancos citados no código;
* bancos encontrados em configurações;
* bancos presentes em backups;
* bancos já registrados no DataTables;
* bancos mencionados em logs;
* bancos cadastrados manualmente.

⸻

8. Classificação dos resultados

Cada banco deverá receber uma situação.

8.1 Encontrado e acessível

O banco existe e foi inventariado.

8.2 Encontrado, mas sem permissão

O banco existe, mas a credencial atual não consegue acessar sua estrutura.

8.3 Referenciado, mas não encontrado

O banco aparece em código, configuração, log ou backup, mas não foi localizado em um servidor ativo.

8.4 Encontrado em outro servidor

O banco estava sendo procurado no host errado.

8.5 Banco desativado

O banco existia, mas está fora de operação.

8.6 Banco legado

Ainda existe ou aparece em referências antigas, mas não faz parte da operação atual.

8.7 Banco de backup

Foi encontrado apenas em arquivos ou rotinas de backup.

8.8 Banco temporário

Utilizado para staging, migração, importação ou processamento intermediário.

8.9 Banco duplicado

Existem bancos com o mesmo nome em servidores diferentes.

8.10 Banco desconhecido

Foi encontrado no servidor, mas nenhuma aplicação ou finalidade foi identificada.

8.11 Banco potencial

Existe evidência, mas ainda não houve confirmação.

8.12 Falso positivo

O nome encontrado não representa um banco real.

Exemplos:

* nome em documentação;
* variável de exemplo;
* dump antigo;
* teste unitário;
* arquivo comentado.

⸻

9. Níveis de confiança

Cada descoberta deverá possuir um nível de confiança.

Confiança alta

* banco retornado pelo MySQL;
* conexão validada;
* banco acessível;
* tabela encontrada.

Confiança média

* banco presente em configuração ativa;
* variável de ambiente carregada;
* script de produção;
* cron em execução.

Confiança baixa

* nome encontrado apenas em comentário;
* documentação antiga;
* arquivo de exemplo;
* backup sem origem confirmada;
* código não executado.

⸻

10. Matriz de reconciliação

A aplicação deverá criar uma matriz semelhante a:

Banco	Servidor	MySQL	Configuração	Código	Logs	Backup	DataTables	Situação
DSHOW_PROD	servidor A	Sim	Sim	Sim	Sim	Sim	Não	Não catalogado
Logs	servidor B	Sim	Sim	Sim	Sim	Não	Não	Falta conexão
DSHOW_REF	desconhecido	Não	Sim	Sim	Sim	Sim	Não	Referenciado
INTEGRACAO	servidor C	Sim	Sim	Sim	Não	Sim	Não	Sem permissão

A matriz deverá permitir identificar rapidamente a causa da ausência.

⸻

11. Tela nova — Descoberta de bancos

Criar uma área chamada:

Descoberta e reconciliação

11.1 Big numbers

Mostrar:

* servidores analisados;
* conexões encontradas;
* bancos detectados;
* bancos catalogados;
* bancos não catalogados;
* bancos sem permissão;
* bancos referenciados e não encontrados;
* bancos legados;
* bancos de backup;
* inconsistências.

11.2 DataGrid de descobertas

Colunas:

* status;
* banco;
* servidor;
* host;
* porta;
* ambiente;
* origem da descoberta;
* confiança;
* acesso;
* catalogado;
* aplicação;
* última evidência;
* motivo da pendência;
* ação.

11.3 Filtros

* não catalogado;
* sem permissão;
* referenciado;
* encontrado;
* legado;
* backup;
* temporário;
* desconhecido;
* servidor;
* ambiente;
* aplicação;
* confiança;
* origem da evidência.

11.4 Ações

* validar conexão;
* associar a servidor;
* cadastrar conexão;
* solicitar credencial;
* marcar como legado;
* marcar como falso positivo;
* adicionar observação;
* ignorar;
* abrir evidências;
* iniciar inventário.

⸻

12. Drawer de evidências

Ao clicar em um banco, abrir um drawer com:

* nome;
* servidores possíveis;
* aplicações relacionadas;
* arquivos onde foi encontrado;
* linhas de código;
* variáveis de ambiente;
* logs;
* backups;
* histórico;
* tentativas de conexão;
* mensagem de erro;
* permissões;
* recomendação.

As senhas deverão continuar mascaradas.

⸻

13. Descoberta automática de conexões

O sistema deverá poder sugerir conexões com base em evidências.

Exemplo:

Host: srv-financeiro
Porta: 3306
Banco: Transacoes_Financeiras
Usuário identificado: financeiro_app
Origem: /var/www/financeiro/.env
Confiança: alta

O sistema deverá permitir converter a sugestão em conexão monitorada.

A senha não deverá ser copiada automaticamente de arquivos sem controle.

O ideal é:

* identificar que existe uma credencial;
* informar o local;
* permitir que o usuário autorizado valide ou recadastre o segredo.

⸻

14. Diagnóstico de permissões

Um dos principais motivos para bancos não aparecerem pode ser limitação do usuário MySQL.

O sistema deverá testar:

* SHOW DATABASES;
* acesso ao information_schema;
* acesso ao banco;
* SELECT;
* leitura de metadados;
* visualização de tabelas;
* acesso a índices;
* acesso a FKs.

A tela deverá informar:

* permissão disponível;
* permissão ausente;
* impacto;
* comando ou orientação necessária.

Exemplo:

O usuário consegue acessar DSHOWDASH, mas não possui permissão para listar os demais schemas.

A aplicação não deverá concluir que só existe um banco apenas porque o usuário atual só enxerga um.

⸻

15. Separação entre ausência e invisibilidade

O sistema deverá diferenciar claramente:

Banco não existe

O MySQL informou inexistência.

Banco não está visível

O usuário não tem permissão para listá-lo.

Banco não está acessível

O nome é conhecido, mas a conexão foi negada.

Servidor não está acessível

Não foi possível chegar ao host.

Credencial inválida

O servidor respondeu, mas recusou autenticação.

Fonte ainda não verificada

Existe evidência, mas a rotina ainda não foi executada.

Essa distinção é essencial para não produzir inventários incorretos.

⸻

16. Regras para bancos do sistema

Bancos como:

* information_schema;
* mysql;
* performance_schema;
* sys;

deverão ser detectados, mas separados dos bancos de aplicação.

O usuário poderá escolher exibi-los ou ocultá-los.

Eles não deverão aumentar os big numbers principais de bancos de negócio, salvo quando o filtro “bancos do sistema” estiver ativo.

⸻

17. Nomes iguais em servidores diferentes

O banco DSHOWDASH, por exemplo, pode existir em mais de um ambiente.

A identidade interna não deverá ser apenas o nome.

Deverá considerar:

servidor + porta + banco

Exemplo:

srv-prod:3306/DSHOWDASH
srv-hml:3306/DSHOWDASH
localhost:3306/DSHOWDASH

Isso evitará:

* sobrescrita;
* mistura de métricas;
* inventário incorreto;
* associação ao ambiente errado.

⸻

18. Descoberta de bancos em localhost

Referências a:

* localhost;
* 127.0.0.1;
* socket MySQL;

precisam ser interpretadas no contexto do servidor onde o arquivo ou processo está localizado.

127.0.0.1 em uma VPS não é o mesmo banco que 127.0.0.1 em outra VPS.

A descoberta deverá registrar sempre:

* host lógico;
* servidor de origem;
* endereço resolvido;
* contexto da aplicação.

⸻

19. Descoberta de aliases

O sistema deverá tentar identificar aliases como:

* nomes DNS;
* hostnames internos;
* IPs;
* nomes de containers;
* serviços Docker;
* proxies;
* túneis.

Duas conexões aparentemente diferentes podem apontar para a mesma instância.

O sistema deverá calcular uma assinatura da instância utilizando, quando possível:

* hostname do MySQL;
* server_uuid;
* versão;
* porta;
* IP;
* identificadores internos.

⸻

20. Prevenção de duplicidade

O sistema deverá evitar cadastrar a mesma instância várias vezes.

Exemplos:

* localhost:3306;
* 127.0.0.1:3306;
* srv920234.hstgr.cloud:3306;
* IP público da mesma VPS.

Antes de criar uma nova conexão, mostrar:

Possível duplicidade encontrada.

Indicar:

* conexão existente;
* evidências;
* nível de similaridade;
* ação para mesclar ou manter separada.

⸻

21. Inventário de aplicações

Cada conexão encontrada deverá ser associada, quando possível, a:

* aplicação;
* módulo;
* serviço;
* script;
* cron;
* container;
* servidor.

Essa associação poderá vir de:

* diretório do arquivo;
* nome do processo;
* arquivo de configuração;
* container;
* serviço systemd;
* cron;
* registro manual.

⸻

22. Histórico de descoberta

Mesmo que o sistema não mantenha histórico completo do schema, a descoberta deverá registrar:

* primeira vez encontrado;
* última vez encontrado;
* origem da primeira evidência;
* última validação;
* status anterior;
* status atual;
* data da catalogação;
* data em que deixou de ser encontrado.

Isso será necessário para bancos antigos e desativados.

⸻

23. Alertas relacionados à descoberta

Gerar alertas quando:

* novo banco for encontrado;
* novo servidor for encontrado;
* banco conhecido desaparecer;
* banco mudar de servidor;
* conexão passar a não ter permissão;
* banco referenciado não for encontrado;
* credencial deixar de funcionar;
* banco aparecer em produção sem cadastro;
* banco desconhecido for detectado;
* duplicidade for identificada;
* banco passar a existir somente em backup;
* inventário parcial falhar.

⸻

24. Segurança

A pesquisa deverá respeitar rigorosamente:

* não exibir senhas;
* não salvar segredos em logs;
* não copiar arquivos sensíveis para o front-end;
* não mostrar conteúdo completo de .env;
* exibir apenas chaves necessárias;
* controlar acesso por perfil;
* registrar operações críticas;
* limitar execução a servidores autorizados;
* usar conexões somente leitura sempre que possível;
* não escanear redes sem autorização;
* não executar comandos de alteração;
* não acessar bancos de terceiros sem permissão.

⸻

25. Impacto de performance

A pesquisa profunda não deverá causar impacto nos servidores.

Regras

* limitar concorrência;
* executar por lotes;
* utilizar timeout;
* interromper em caso de carga elevada;
* priorizar metadados;
* não ler dados de negócio;
* não contar registros com COUNT(*) em todas as tabelas grandes;
* usar estatísticas aproximadas;
* executar análise de arquivos de forma incremental;
* ignorar diretórios pesados;
* respeitar .gitignore e lista de exclusão;
* não indexar dependências como node_modules, salvo necessidade específica;
* não abrir dumps completos para leitura integral;
* utilizar busca textual eficiente.

⸻

26. Diretórios e arquivos a ignorar

Por padrão, evitar pesquisa profunda em:

* node_modules;
* .git;
* caches;
* arquivos temporários;
* builds;
* imagens;
* vídeos;
* bibliotecas de terceiros;
* dumps muito grandes;
* backups duplicados.

Esses locais poderão ser pesquisados apenas por padrões específicos, quando necessário.

⸻

27. Motor de descoberta

Criar um serviço de descoberta com módulos independentes.

Sugestão conceitual:

* ServerDiscoveryService;
* MySQLDiscoveryService;
* ConfigDiscoveryService;
* CodeReferenceDiscoveryService;
* ContainerDiscoveryService;
* CronDiscoveryService;
* LogDiscoveryService;
* BackupDiscoveryService;
* ReconciliationService;
* EvidenceScoringService.

Cada módulo deverá produzir evidências padronizadas.

⸻

28. Modelo conceitual

Possíveis entidades:

* DT_Discovery_Run;
* DT_Discovery_Source;
* DT_Discovery_Evidence;
* DT_Discovered_Server;
* DT_Discovered_Instance;
* DT_Discovered_Database;
* DT_Discovered_Connection;
* DT_Discovery_Conflict;
* DT_Discovery_Classification;
* DT_Discovery_Action;
* DT_Discovery_Ignore_Rule;
* DT_Discovery_Match;
* DT_Discovery_Log.

⸻

29. Status da execução

Cada pesquisa deverá mostrar:

* agendada;
* aguardando;
* em execução;
* parcialmente concluída;
* concluída;
* concluída com alertas;
* falhou;
* cancelada.

Também deverá mostrar as etapas:

1. Servidores.
2. Serviços.
3. Conexões.
4. Bancos.
5. Configurações.
6. Código.
7. Containers.
8. Crons.
9. Logs.
10. Backups.
11. Reconciliação.

⸻

30. Tela de execução da descoberta

Mostrar progresso visual:

* servidores processados;
* arquivos analisados;
* conexões encontradas;
* bancos descobertos;
* evidências;
* conflitos;
* erros;
* tempo decorrido.

Utilizar:

* progress bar;
* timeline;
* logs resumidos;
* ícones por etapa;
* status em tempo real.

⸻

31. Relatório final

Ao terminar a pesquisa, gerar um relatório com:

Resumo

* total de servidores;
* instâncias MySQL;
* bancos encontrados;
* bancos já catalogados;
* bancos novos;
* bancos inacessíveis;
* bancos sem permissão;
* bancos referenciados;
* bancos legados;
* falsos positivos;
* conflitos.

Pendências prioritárias

* credenciais necessárias;
* servidores sem acesso;
* bancos sem aplicação identificada;
* referências quebradas;
* bancos em produção não monitorados;
* duplicidades;
* configurações inconsistentes.

Recomendações

* cadastrar conexão;
* ampliar permissão;
* remover referência antiga;
* classificar como legado;
* validar backup;
* revisar credencial;
* associar aplicação;
* ignorar evidência.

⸻

32. Pesquisa inicial sugerida

A primeira execução deverá usar os bancos já conhecidos como lista de reconciliação.

Exemplo inicial:

DSHOW_PROD
DSHOW_REF
Logs
APIS
INTEGRACAO
Intermediaria
MONITORAMENTO_DADOS
Backups
Led_Lovers_PROD
Kondado
CEP_CIDADES
Transacoes_Financeiras
Vendas_Gerais
produtos
DSHOWDASH

Essa lista não deverá limitar a descoberta.

O sistema deverá localizar qualquer outro nome identificado durante a pesquisa.

⸻

33. Fases de implementação

Fase 1 — Levantamento estrutural

* listar servidores;
* listar VPSs;
* listar aplicações;
* listar conexões já conhecidas;
* criar lista de bancos esperados;
* validar permissões atuais;
* identificar lacunas.

Fase 2 — Descoberta no MySQL

* listar instâncias;
* listar bancos;
* verificar permissões;
* identificar bancos inacessíveis;
* reconciliar com DataTables.

Fase 3 — Pesquisa em configurações e código

* .env;
* PHP;
* Python;
* JavaScript;
* scripts;
* crons;
* serviços;
* containers.

Fase 4 — Logs e backups

* encontrar referências históricas;
* classificar bancos antigos;
* identificar hosts desativados;
* verificar bancos somente em backup.

Fase 5 — Reconciliação

* eliminar duplicidades;
* classificar evidências;
* validar nomes;
* associar servidores;
* associar aplicações;
* gerar pendências.

Fase 6 — Integração com o DataTables

* nova tela de descobertas;
* DataGrid;
* cards;
* evidências;
* ações;
* alertas;
* cadastro assistido.

Fase 7 — Automação contínua

* execução agendada;
* comparação incremental;
* alertas;
* detecção de novos bancos;
* detecção de desaparecimento;
* atualização do inventário.

⸻

34. Critérios de aceite

A fase será considerada concluída quando:

1. Todos os servidores conhecidos tiverem sido analisados.
2. Todas as instâncias MySQL autorizadas tiverem sido testadas.
3. Os bancos visíveis tiverem sido catalogados.
4. Bancos invisíveis por permissão forem identificados como tal.
5. Arquivos de configuração relevantes tiverem sido analisados.
6. Referências de banco no código tiverem sido catalogadas.
7. Crons e serviços tiverem sido analisados.
8. Containers tiverem sido analisados.
9. Logs relevantes tiverem sido verificados.
10. Backups tiverem sido reconciliados.
11. Bancos conhecidos e não encontrados tiverem justificativa.
12. Possíveis duplicidades tiverem sido identificadas.
13. Cada descoberta possuir origem e confiança.
14. Nenhuma senha tiver sido exposta.
15. A tela de reconciliação estiver disponível.
16. Bancos novos puderem ser convertidos em conexão monitorada.
17. O relatório final apresentar lacunas e recomendações.
18. O DataTables não continuar afirmando que existe apenas um banco quando a credencial utilizada não possui visão completa.

⸻

35. Regra crítica

O inventário não poderá interpretar:

“o usuário MySQL só encontrou um banco”

como:

“só existe um banco na infraestrutura”.

O sistema deverá sempre distinguir:

* quantidade encontrada;
* quantidade acessível;
* quantidade conhecida;
* quantidade referenciada;
* quantidade ainda não verificada.

⸻

36. Resultado esperado

Ao final, o dashboard poderá mostrar algo como:

* Bancos catalogados: 18;
* Bancos acessíveis: 15;
* Sem permissão: 2;
* Referenciado e não encontrado: 3;
* Legados: 4;
* Somente em backup: 2;
* Pendentes de validação: 5.

O objetivo não é apenas aumentar a quantidade exibida.

O resultado correto é criar um inventário confiável, explicável e auditável, no qual cada banco tenha:

* origem;
* servidor;
* ambiente;
* evidência;
* status;
* nível de confiança;
* motivo de eventual ausência;
* ação recomendada.

A descoberta deverá ser profunda, mas controlada, permitindo que o DataTables se torne realmente o mapa central de toda a infraestrutura de dados do Dshow Dash e das demais aplicações.