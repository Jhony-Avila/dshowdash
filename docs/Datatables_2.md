Datatable 2
Briefing Completo — Elevação Visual e Evolução de Interface do DataTables

1. Identificação do projeto

Projeto: Evolução visual e funcional do DataTables
Plataforma: Dshow Dash
Tipo de trabalho: Redesign, melhoria de experiência, enriquecimento visual e padronização de componentes
Público: Equipe interna de desenvolvimento
Objetivo principal: Elevar o DataTables de uma interface técnica básica para uma aplicação visualmente sofisticada, intuitiva, interativa e adequada a uma plataforma moderna de observabilidade e governança de dados.

⸻

2. Contexto atual

A primeira versão do DataTables já apresenta uma base funcional relevante, incluindo:

* catálogo de bancos;
* listagem de tabelas;
* identificação de campos;
* análise de dependências;
* busca global;
* qualidade dos dados;
* campos sensíveis;
* alertas;
* integrações;
* manutenções;
* conexões;
* inventário de estruturas;
* indicadores de status;
* scores de saúde;
* detecção de problemas.

A estrutura funcional está presente, mas a interface atual ainda possui aparência predominantemente técnica, simples e pouco expressiva.

A aplicação apresenta hoje:

* excesso de áreas brancas;
* pouca diferenciação visual entre módulos;
* ausência de hierarquia forte de informações;
* baixa utilização de cores;
* poucos ícones;
* cards muito simples;
* tabelas com aparência semelhante entre todas as telas;
* pouca utilização de gráficos;
* pouco aproveitamento do espaço;
* estados vazios pouco informativos;
* navegação extensa e horizontal;
* ausência de uma linguagem visual própria para infraestrutura de dados;
* poucas interações visuais;
* baixa percepção de profundidade;
* ausência de visualizações mais gerenciais;
* páginas que parecem listagens administrativas, e não uma plataforma completa de observabilidade.

A nova etapa deverá manter tudo o que já foi implementado, mas transformar completamente a forma como as informações são apresentadas.

⸻

3. Objetivo da evolução

O objetivo desta etapa é elevar o DataTables para um novo patamar visual e de experiência.

A nova interface deverá transmitir:

* tecnologia;
* confiabilidade;
* inteligência;
* observabilidade;
* controle;
* organização;
* profundidade técnica;
* clareza;
* modernidade;
* velocidade;
* segurança.

A aplicação deverá deixar de parecer apenas um conjunto de tabelas administrativas e passar a funcionar visualmente como uma central técnica de infraestrutura de dados.

⸻

4. Resultado esperado

Ao acessar o DataTables, o usuário deverá perceber imediatamente:

* quais recursos estão funcionando;
* quais possuem problemas;
* qual é a dimensão da infraestrutura;
* quais ambientes existem;
* onde estão os riscos;
* quais bancos são mais importantes;
* quais tabelas precisam de atenção;
* quais alertas estão ativos;
* como navegar entre servidores, bancos, tabelas e campos;
* como acessar rapidamente os detalhes de qualquer objeto.

A interface deverá ser visualmente rica, mas sem perder precisão técnica.

⸻

5. Direção visual

5.1 Conceito visual

O conceito visual deverá ser inspirado em plataformas modernas de:

* observabilidade;
* monitoramento de infraestrutura;
* data catalog;
* cloud management;
* DevOps;
* segurança;
* análise de performance;
* administração de bancos.

Referências conceituais incluem produtos como:

* Datadog;
* Grafana;
* New Relic;
* Sentry;
* Elastic;
* Supabase;
* Vercel;
* MongoDB Atlas;
* Snowflake;
* Azure Portal;
* AWS Console;
* Google Cloud;
* Retool;
* Linear.

Não se pretende copiar nenhuma dessas aplicações, mas utilizar como referência o nível de:

* organização;
* densidade;
* hierarquia;
* interatividade;
* riqueza visual;
* consistência.

⸻

6. Princípios de experiência

6.1 Visual antes do textual

Informações importantes deverão ser reconhecidas rapidamente por:

* cores;
* ícones;
* gráficos;
* badges;
* barras;
* mapas;
* indicadores;
* agrupamentos;
* hierarquia tipográfica.

O usuário não deverá precisar ler uma linha inteira para entender que um banco está offline, que uma tabela é crítica ou que existe uma credencial expirada.

6.2 Informação progressiva

A interface não deverá mostrar tudo ao mesmo tempo.

A apresentação deverá seguir níveis:

1. Resumo.
2. Situação atual.
3. Indicadores.
4. Listagem.
5. Detalhamento.
6. Diagnóstico técnico.

6.3 Densidade controlada

O sistema pode apresentar muitas informações, mas deve organizar o conteúdo com:

* espaçamento;
* agrupamento;
* abas;
* drawers;
* accordions;
* tooltips;
* filtros;
* menus contextuais;
* expansão de linhas.

6.4 Consistência

Os mesmos conceitos deverão possuir as mesmas cores, ícones e comportamentos em todas as telas.

Exemplo:

* banco online sempre verde;
* manutenção sempre azul;
* alerta crítico sempre vermelho;
* atenção sempre amarelo ou âmbar;
* recursos não avaliados sempre cinza;
* campos sensíveis sempre identificados com iconografia própria.

⸻

7. Principais problemas identificados na interface atual

7.1 Navegação horizontal extensa

O menu principal possui muitas opções no mesmo nível:

* Visão geral;
* Infraestrutura;
* Bancos;
* Tabelas;
* Dependências;
* Busca global;
* Qualidade;
* Campos sensíveis;
* Alertas;
* Integrações;
* Manutenções;
* Conexões;
* Administração.

Isso gera:

* baixa escalabilidade;
* dificuldade de leitura;
* risco de quebra em telas menores;
* pouca diferenciação entre módulos;
* dificuldade de incluir futuras páginas;
* navegação visualmente pesada.

7.2 Falta de sidebar estruturada

A aplicação precisa de uma navegação lateral própria ou integrada à sidebar do Dshow Dash.

A navegação horizontal poderá continuar como navegação contextual secundária, mas não como principal forma de acesso.

7.3 Excesso de espaço vazio

Diversas telas apresentam apenas uma pequena tabela na parte superior e grande área branca abaixo.

Isso transmite sensação de:

* conteúdo incompleto;
* protótipo;
* baixa densidade;
* ausência de indicadores;
* falta de profundidade.

7.4 Aparência monocromática

A interface atual utiliza predominantemente:

* branco;
* cinza;
* preto;
* roxo apenas no item ativo;
* verde apenas em status;
* laranja em alguns alertas.

A nova versão deverá possuir cores mais ricas e funcionais.

7.5 Cards pouco expressivos

Os cards atuais apresentam apenas número e título.

Eles não mostram:

* tendência;
* percentual;
* comparação;
* distribuição;
* contexto;
* ícone;
* mini gráfico;
* evolução;
* status.

7.6 Tabelas visualmente repetitivas

Todas as páginas utilizam estruturas muito parecidas.

Isso faz com que:

* telas diferentes pareçam iguais;
* informações críticas não recebam destaque;
* o usuário tenha dificuldade de entender o contexto;
* a interface fique cansativa.

7.7 Estados vazios muito simples

Mensagens como “Nenhuma fonte externa cadastrada” aparecem apenas como uma linha vazia.

O estado vazio deveria orientar o usuário e oferecer uma ação.

7.8 Poucos elementos interativos

Faltam:

* menus contextuais;
* detalhes expansíveis;
* filtros visuais;
* drawers;
* gráficos;
* tooltips ricos;
* atalhos;
* ações rápidas;
* breadcrumbs;
* comandos por teclado;
* skeleton loaders;
* animações de transição.

7.9 Hierarquia tipográfica fraca

Títulos, subtítulos, labels e textos auxiliares possuem pouca diferenciação.

É necessário melhorar:

* tamanhos;
* pesos;
* contraste;
* espaçamento;
* agrupamento;
* prioridade visual.

⸻

8. Nova arquitetura de navegação

8.1 Sidebar principal do DataTables

A aplicação deverá utilizar uma sidebar lateral organizada por grupos.

Grupo: Visão geral

* Dashboard;
* Saúde geral;
* Atividade recente.

Grupo: Infraestrutura

* Infraestrutura;
* Servidores;
* Bancos;
* Conexões;
* Ambientes.

Grupo: Estrutura de dados

* Tabelas;
* Campos;
* Dependências;
* Campos sensíveis;
* Busca global.

Grupo: Observabilidade

* Qualidade;
* Alertas;
* Manutenções;
* Ocorrências;
* Capacidade.

Grupo: Fontes externas

* Integrações;
* APIs;
* Arquivos;
* Planilhas;
* Filas;
* Caches.

Grupo: Administração

* Credenciais;
* Regras;
* Notificações;
* Configurações;
* Permissões.

8.2 Ícones na navegação

Cada item deverá possuir um ícone SVG.

Sugestões:

* Dashboard: LayoutDashboard;
* Infraestrutura: Network;
* Servidores: Server;
* Bancos: Database;
* Conexões: PlugZap;
* Ambientes: Layers;
* Tabelas: TableProperties;
* Campos: Columns3;
* Dependências: GitBranch;
* Sensíveis: ShieldAlert;
* Busca: Search;
* Qualidade: Gauge;
* Alertas: BellRing;
* Manutenções: Wrench;
* Integrações: Unplug;
* APIs: Braces;
* Arquivos: Files;
* Planilhas: Sheet;
* Filas: ListTree;
* Cache: MemoryStick;
* Credenciais: KeyRound;
* Configurações: Settings.

8.3 Sidebar recolhível

A sidebar deverá possuir:

* modo expandido;
* modo compacto;
* tooltips no modo compacto;
* memória da última escolha;
* grupos expansíveis;
* destaque do item ativo;
* badge com contagem de alertas;
* badge com número de conexões offline.

⸻

9. Header da aplicação

O header deverá ser modernizado e conter:

* título do módulo;
* breadcrumb;
* busca global;
* status geral da infraestrutura;
* seletor de ambiente;
* data da última atualização;
* botão de atualização;
* central de alertas;
* atalhos rápidos;
* menu de configurações;
* opção de tela cheia.

9.1 Busca global no header

A busca deverá aceitar:

* servidores;
* bancos;
* schemas;
* tabelas;
* campos;
* integrações;
* alertas.

Ao digitar, deverá abrir um painel com resultados agrupados.

Exemplo:

Bancos

* DSHOWDASH;
* DSHOW_PROD.

Tabelas

* app_users;
* app_audit_log.

Campos

* user_id;
* email.

9.2 Command palette

Adicionar uma command palette acionada por:

* Ctrl + K;
* Cmd + K.

Ela poderá permitir:

* navegar;
* pesquisar;
* abrir banco;
* abrir tabela;
* criar conexão;
* inventariar banco;
* colocar em manutenção;
* abrir alertas.

Biblioteca sugerida:

* cmdk.

⸻

10. Sistema de cores

10.1 Cor principal

A identidade atual baseada em roxo poderá ser mantida, mas ampliada.

Sugestão:

* roxo principal;
* violeta;
* azul elétrico;
* ciano;
* verde;
* âmbar;
* vermelho;
* rosa;
* tons neutros.

10.2 Cores semânticas

Saudável

* verde;
* ícone de check;
* brilho sutil;
* fundo verde suave.

Instável

* âmbar;
* ícone de atividade;
* fundo amarelo suave.

Lento

* laranja;
* ícone de relógio;
* fundo laranja suave.

Offline

* vermelho;
* ícone de conexão interrompida;
* fundo vermelho suave.

Manutenção

* azul;
* ícone de ferramenta;
* fundo azul suave.

Não testado

* cinza;
* ícone de dúvida;
* fundo neutro.

Credencial expirada

* magenta ou vermelho escuro;
* ícone de chave;
* badge específico.

10.3 Gradientes

Gradientes poderão ser utilizados com moderação em:

* cabeçalho;
* cards principais;
* gráficos;
* score de saúde;
* áreas de destaque.

Não utilizar gradientes em excesso em tabelas ou formulários.

⸻

11. Modo claro e modo escuro

O DataTables deverá suportar:

* modo claro;
* modo escuro;
* modo automático conforme sistema.

O modo escuro é especialmente relevante para uma aplicação técnica utilizada por desenvolvedores.

No modo escuro:

* tabelas deverão ter contraste adequado;
* status deverão continuar legíveis;
* cores não deverão ficar saturadas demais;
* grids e divisórias deverão permanecer discretos;
* gráficos deverão adaptar automaticamente suas cores.

⸻

12. Dashboard — Visão geral

A tela inicial deverá ser completamente reformulada.

12.1 Cabeçalho da página

Mostrar:

* “Infraestrutura de dados”;
* resumo do ambiente;
* status geral;
* última atualização;
* seletor de período;
* seletor de ambiente;
* ações rápidas.

12.2 Health banner

Adicionar um banner de saúde geral.

Exemplo:

Infraestrutura saudável

* 12 conexões online;
* nenhuma falha crítica;
* 3 alertas de atenção;
* última verificação há 2 minutos.

O banner poderá mudar de cor conforme a situação.

12.3 Big numbers avançados

Cada card deverá conter:

* ícone;
* título;
* valor;
* percentual;
* variação;
* mini gráfico;
* descrição;
* ação ao clicar.

Cards sugeridos:

* servidores;
* bancos;
* bancos online;
* bancos offline;
* tabelas;
* campos;
* alertas ativos;
* tabelas com problemas;
* campos sensíveis;
* espaço utilizado.

12.4 Gráficos do dashboard

Adicionar:

* disponibilidade por período;
* distribuição de bancos por ambiente;
* conexões por status;
* problemas por severidade;
* tabelas por score de saúde;
* crescimento de dados;
* alertas por categoria;
* maiores bancos;
* maiores tabelas.

12.5 Mapa da infraestrutura

Criar uma visualização visual resumida:

Servidor → Banco → Tabelas

Não precisa ser um diagrama técnico completo.

Poderá ser uma árvore visual interativa com:

* ícones;
* cores;
* estado;
* contadores;
* expansão;
* seleção.

12.6 Timeline de atividade

Mostrar eventos recentes:

* banco ficou offline;
* conexão recuperada;
* inventário concluído;
* nova tabela encontrada;
* campo removido;
* credencial atualizada;
* manutenção iniciada;
* alerta resolvido.

⸻

13. Reformulação da tela de Infraestrutura

A tela deverá representar visualmente a arquitetura física e lógica.

13.1 Visualizações disponíveis

Adicionar alternância entre:

* cards;
* árvore;
* lista;
* mapa visual.

13.2 Cards de servidores

Cada servidor deverá possuir um card contendo:

* ícone de servidor;
* nome;
* hostname;
* ambiente;
* status;
* quantidade de bancos;
* espaço;
* disponibilidade;
* alertas;
* última verificação.

13.3 Visualização em árvore

Estrutura:

* servidor;
    * banco;
        * schema;
            * tabela.

A árvore deverá possuir:

* linhas de conexão;
* ícones específicos;
* expansão animada;
* status por cor;
* busca;
* seleção múltipla;
* menu contextual.

13.4 Menu contextual

Ao clicar com o botão direito ou no botão de reticências:

* abrir detalhes;
* editar;
* verificar;
* inventariar;
* colocar em manutenção;
* copiar hostname;
* abrir alertas;
* abrir bancos relacionados.

⸻

14. Reformulação da tela de Bancos

A tela atual apresenta apenas uma tabela simples.

A nova tela deverá possuir duas formas de visualização:

* cards;
* DataGrid.

14.1 Cards de bancos

Cada banco deverá mostrar:

* ícone MySQL;
* nome;
* servidor;
* ambiente;
* status;
* disponibilidade;
* quantidade de tabelas;
* quantidade de campos;
* tamanho;
* score de saúde;
* último inventário;
* alertas ativos.

14.2 Indicador de saúde

Utilizar:

* anel de progresso;
* gauge;
* barra colorida;
* percentual.

Exemplo:

Saúde: 92/100

14.3 DataGrid avançado

Adicionar:

* ícone por banco;
* status com badge;
* mini barra de disponibilidade;
* tamanho visual;
* score;
* menu de ações;
* expansão de linha;
* colunas configuráveis;
* filtros rápidos.

14.4 Drawer de detalhes

Ao clicar em uma linha, abrir um drawer lateral com:

* resumo;
* métricas;
* tabelas;
* alertas;
* conexão;
* inventário;
* ações rápidas.

⸻

15. Reformulação da tela de Tabelas

Esta é uma das principais áreas e deverá receber atenção especial.

15.1 Barra superior

Adicionar:

* busca;
* filtros;
* seletor de banco;
* seletor de ambiente;
* seletor de classificação;
* filtro por problemas;
* filtro por sensibilidade;
* alternância entre grid e cards;
* controle de densidade;
* configuração de colunas;
* atualização.

15.2 Novas colunas visuais

Além das atuais:

* ícone da tabela;
* score de saúde;
* barra de tamanho;
* status;
* sensibilidade;
* crescimento;
* última análise;
* severidade do problema.

15.3 Badges

Substituir textos simples como active, órfã e sem PK por badges mais visuais.

Exemplos:

* Ativa;
* Órfã;
* Sem chave primária;
* Sensível;
* Crítica;
* Problemas: 16;
* Legada.

Cada badge deverá possuir:

* ícone;
* cor;
* tooltip;
* texto amigável.

15.4 Expansão de linha

Ao expandir uma tabela, mostrar:

* campos principais;
* índices;
* FKs;
* score;
* problemas;
* tamanho;
* ações.

15.5 Heatmap de problemas

A coluna de problemas poderá apresentar intensidade visual.

Exemplo:

* zero: verde;
* 1 a 3: amarelo;
* 4 a 10: laranja;
* acima de 10: vermelho.

15.6 Ações rápidas

Ao passar o mouse:

* abrir detalhes;
* visualizar campos;
* ver problemas;
* ver dependências;
* copiar nome;
* copiar caminho completo.

⸻

16. Página de detalhes da tabela

A página de detalhes deverá ser uma das telas mais ricas da aplicação.

16.1 Cabeçalho

Mostrar:

* ícone de tabela;
* nome;
* banco;
* schema;
* ambiente;
* status;
* classificação;
* score de saúde;
* badges;
* ações.

16.2 Abas

* Resumo;
* Campos;
* Índices;
* Chaves;
* Qualidade;
* Dependências;
* Capacidade;
* Alertas.

16.3 Resumo visual

Cards:

* registros;
* tamanho;
* campos;
* índices;
* FKs;
* problemas;
* sensíveis;
* score.

16.4 Gráficos

* evolução do tamanho;
* evolução de registros;
* distribuição dos tipos de campo;
* percentual de valores nulos;
* problemas por categoria.

16.5 Mapa de campos

Representação visual dos campos com:

* tipo;
* chave;
* sensibilidade;
* nulo;
* índice;
* problema.

⸻

17. Reformulação da tela de Dependências

A tela atual possui bons dados, mas a apresentação pode ser enriquecida.

17.1 Cards superiores

Mostrar:

* chaves estrangeiras;
* FKs quebradas;
* tabelas órfãs;
* tabelas altamente referenciadas;
* dependências críticas.

Cada card deverá possuir:

* ícone;
* cor;
* mini gráfico;
* tendência;
* clique para filtrar.

17.2 Visualização de rede

Apesar de o briefing anterior não exigir diagrama gráfico, nesta elevação visual poderá ser adicionada uma visualização opcional.

Ela não substituirá a lista.

A rede poderá mostrar:

* tabelas como nós;
* FKs como conexões;
* tamanho do nó pelo número de referências;
* cor pelo score;
* filtros;
* zoom;
* pan;
* foco em uma tabela.

Bibliotecas sugeridas:

* React Flow;
* Cytoscape.js;
* D3.js;
* Sigma.js.

17.3 Visualização em lista

Manter a lista para precisão técnica.

Adicionar:

* ícones;
* barras de referência;
* badges;
* ações rápidas;
* filtros;
* expansão.

⸻

18. Reformulação da busca global

A tela atual possui grande espaço vazio e apenas um campo de pesquisa.

18.1 Estado inicial

Antes de pesquisar, mostrar:

* pesquisas recentes;
* exemplos;
* campos mais procurados;
* bancos recentes;
* tabelas acessadas recentemente;
* atalhos;
* sugestões.

18.2 Resultados agrupados

Separar por:

* servidores;
* bancos;
* tabelas;
* campos;
* integrações.

18.3 Cards de resultado

Cada resultado deverá mostrar:

* ícone;
* nome;
* caminho completo;
* tipo;
* ambiente;
* status;
* detalhes relevantes.

18.4 Destaque do termo

O termo pesquisado deverá ser destacado nos resultados.

18.5 Filtros

* tipo de objeto;
* ambiente;
* banco;
* status;
* sensibilidade;
* correspondência exata.

⸻

19. Reformulação da tela de Qualidade

A tela atual já possui informação relevante, mas visualmente está muito concentrada em tabelas.

19.1 Score geral

Adicionar um grande indicador:

Saúde dos dados: 87/100

Utilizar:

* gauge;
* anel;
* barra segmentada;
* cores semânticas.

19.2 Distribuição por score

Adicionar gráfico mostrando:

* saudáveis;
* atenção;
* críticas;
* não avaliadas.

19.3 Problemas por categoria

Apresentar:

* nulos;
* duplicidades;
* integridade;
* metadados;
* datas;
* formatos;
* dependências.

Utilizar cards coloridos e gráficos.

19.4 Matriz de qualidade

Criar matriz:

Tabela × dimensão

Dimensões:

* completude;
* unicidade;
* integridade;
* consistência;
* documentação;
* sensibilidade.

Cada célula poderá ter uma cor conforme a situação.

19.5 DataGrid de problemas

Melhorar com:

* severidade com ícone;
* tabela clicável;
* campo clicável;
* métrica formatada;
* score em barra;
* tooltip do problema;
* menu de ações;
* expansão do diagnóstico.

⸻

20. Reformulação de Campos sensíveis

A tela atual mostra dados úteis, mas pode ser muito mais visual.

20.1 Resumo superior

Mostrar:

* total de campos sensíveis;
* credenciais;
* e-mails;
* telefones;
* documentos;
* IPs;
* dados financeiros;
* tokens.

20.2 Gráfico de distribuição

Adicionar gráfico por:

* categoria;
* banco;
* tabela;
* tipo de dado.

20.3 Ícones por categoria

Exemplos:

* e-mail: envelope;
* credencial: chave;
* token: escudo;
* IP: globo;
* telefone: telefone;
* CPF/CNPJ: documento;
* financeiro: carteira;
* endereço: mapa.

20.4 Nível de confiança

Mostrar:

* alto;
* médio;
* baixo.

Exemplo:

E-mail — confiança alta

Motivo:

* nome do campo;
* comentário;
* tipo;
* padrão.

20.5 Drawer de explicação

Ao clicar, mostrar:

* por que o campo foi classificado;
* metadados utilizados;
* tabela;
* banco;
* tipo;
* possíveis riscos;
* classificação.

⸻

21. Reformulação da central de Alertas

A tela atual vazia precisa se tornar uma central de incidentes.

21.1 Header de situação

Mostrar:

* status geral;
* ativos;
* críticos;
* atenção;
* informativos;
* reconhecidos;
* resolvidos.

21.2 Cards visuais

Cada alerta deverá ser apresentado com:

* severidade;
* ícone;
* título;
* conexão;
* banco;
* duração;
* repetições;
* última ocorrência;
* status;
* ações.

21.3 Linha do tempo

Adicionar timeline de incidentes:

* detectado;
* repetido;
* reconhecido;
* silenciado;
* resolvido.

21.4 Filtros rápidos

* somente críticos;
* ativos;
* não reconhecidos;
* últimos 24h;
* banco;
* ambiente;
* tipo.

21.5 Estados vazios

Quando não houver alertas, mostrar:

* ilustração SVG;
* ícone de escudo;
* mensagem positiva;
* última verificação;
* link para regras de alerta.

Exemplo:

Tudo funcionando normalmente

Nenhum alerta ativo foi identificado nas últimas verificações.

⸻

22. Reformulação da tela de Integrações

A tela atual vazia deverá possuir uma experiência mais orientativa.

22.1 Catálogo de integrações

Mostrar cards para:

* Pipedrive;
* Asaas;
* Bling;
* Kondado;
* MySQL;
* API genérica;
* Webhook;
* Google Sheets;
* CSV;
* Redis;
* filas.

22.2 Estado vazio

Mostrar:

* ilustração;
* mensagem;
* benefícios;
* botão “Adicionar integração”;
* modelos disponíveis.

22.3 Cards de integrações cadastradas

Cada card deverá mostrar:

* logotipo;
* nome;
* status;
* tipo;
* endpoint;
* ambiente;
* autenticação;
* última sincronização;
* último sucesso;
* alertas.

22.4 Logos SVG

Utilizar SVGs oficiais ou iconografia padronizada para cada integração.

⸻

23. Reformulação da tela de Manutenções

23.1 Calendário de manutenção

Adicionar visualização por:

* lista;
* calendário;
* timeline.

23.2 Cards de manutenção

Mostrar:

* recurso;
* responsável;
* início;
* fim;
* duração;
* motivo;
* alertas suprimidos;
* status.

23.3 Estado vazio

Mostrar:

* ilustração de ferramenta;
* mensagem;
* botão “Agendar manutenção”;
* explicação curta.

23.4 Histórico

Criar timeline visual para manutenções encerradas.

⸻

24. Reformulação da tela de Conexões

A tela atual está funcional, mas pode receber grande melhoria visual.

24.1 Cards de conexão

Além da tabela, oferecer cards contendo:

* ícone do banco;
* status;
* nome;
* host;
* banco;
* ambiente;
* credencial;
* última verificação;
* disponibilidade;
* ações.

24.2 Ações

Substituir vários botões textuais por:

* menu contextual;
* ícones com tooltip;
* botão primário;
* ações secundárias.

Exemplo:

* editar;
* verificar;
* inventariar;
* manutenção;
* duplicar;
* desativar.

24.3 Indicador de conexão

Adicionar animação discreta para conexão online:

* pulso verde;
* linha de atividade;
* brilho sutil.

24.4 Fluxo de nova conexão

Criar wizard em etapas:

1. Tipo da fonte.
2. Servidor.
3. Credenciais.
4. Banco.
5. Ambiente.
6. Testes.
7. Monitoramento.
8. Alertas.
9. Confirmação.

24.5 Teste visual

Durante o teste, mostrar as etapas:

* host;
* autenticação;
* seleção;
* leitura;
* gravação;
* inventário.

Cada etapa deverá apresentar:

* aguardando;
* executando;
* concluída;
* falhou.

⸻

25. DataGrids avançados

Todos os DataGrids deverão ser padronizados.

25.1 Funcionalidades

* ordenação;
* paginação;
* filtros;
* filtros rápidos;
* busca;
* seleção;
* expansão;
* agrupamento;
* pinagem de colunas;
* redimensionamento;
* reordenação;
* visibilidade de colunas;
* densidade;
* virtualização;
* exportação futura;
* sticky header;
* sticky columns;
* menu de contexto;
* atalhos de teclado.

25.2 Visual

* linhas zebradas discretas;
* hover claro;
* destaque da linha selecionada;
* headers mais fortes;
* ícones nos headers;
* alinhamento adequado por tipo;
* números alinhados à direita;
* tooltips;
* badges;
* barras de progresso;
* skeleton loading.

25.3 Bibliotecas sugeridas

* AG Grid;
* TanStack Table;
* MUI Data Grid;
* Handsontable, apenas quando houver necessidade de edição;
* React Virtual.

Deverá ser escolhida uma biblioteca principal de grid, evitando misturar várias implementações na mesma interface.

⸻

26. Ícones SVG

A nova interface deverá utilizar uma grande quantidade de ícones SVG, mas sempre com significado funcional.

26.1 Bibliotecas recomendadas

* Lucide Icons;
* Tabler Icons;
* Heroicons;
* Phosphor Icons;
* Simple Icons para marcas;
* Iconify como camada de integração.

26.2 Regras

* utilizar uma biblioteca principal;
* manter o mesmo estilo de traço;
* utilizar logos oficiais apenas para integrações;
* não misturar ícones preenchidos e lineares sem propósito;
* todos os ícones interativos devem possuir tooltip;
* ícones decorativos não devem competir com o conteúdo;
* tamanho padronizado.

26.3 Tamanhos sugeridos

* 14 px: badges;
* 16 px: botões;
* 18 px: navegação;
* 20 px: títulos;
* 24 px: cards;
* 32 a 48 px: estados vazios;
* 64 px ou mais: ilustrações.

⸻

27. Ilustrações SVG

Criar ilustrações para:

* nenhum alerta;
* nenhuma integração;
* nenhuma manutenção;
* nenhuma conexão;
* busca sem resultado;
* banco offline;
* inventário em execução;
* erro de conexão;
* credencial expirada;
* primeira configuração.

Bibliotecas ou fontes:

* unDraw;
* Storyset;
* ManyPixels;
* Open Doodles;
* ilustrações SVG próprias.

As ilustrações deverão respeitar a identidade visual do Dshow Dash.

⸻

28. Bibliotecas visuais recomendadas

O objetivo não deve ser utilizar bibliotecas apenas para aumentar a quantidade de dependências. O ideal é usar o máximo de recursos visuais apropriados, mantendo controle técnico.

28.1 Componentes

* React;
* TypeScript;
* Radix UI;
* shadcn/ui;
* Material UI, caso já adotado;
* Headless UI;
* Floating UI.

28.2 Gráficos

* Apache ECharts;
* Chart.js;
* Recharts;
* Nivo;
* ApexCharts;
* Visx;
* D3.js.

Recomendação: escolher ECharts como biblioteca principal de gráficos devido à quantidade de recursos.

28.3 Diagramas e redes

* React Flow;
* Cytoscape.js;
* Sigma.js;
* D3 Force;
* Mermaid para documentações simples.

28.4 Animações

* Framer Motion;
* GSAP;
* AutoAnimate;
* Lottie React.

28.5 Ícones

* Lucide React;
* Tabler Icons;
* Simple Icons;
* Iconify.

28.6 Tooltips e popovers

* Floating UI;
* Radix Tooltip;
* Tippy.js.

28.7 DataGrid

* AG Grid;
* TanStack Table;
* React Virtual.

28.8 Busca

* Fuse.js;
* MiniSearch;
* cmdk.

28.9 Formulários

* React Hook Form;
* Zod;
* Yup, somente se necessário.

28.10 Datas

* date-fns;
* Day.js;
* React Day Picker.

28.11 Notificações

* Sonner;
* React Hot Toast;
* Notistack.

28.12 Drag and drop

* dnd-kit;
* React DnD.

28.13 Utilitários

* clsx;
* tailwind-merge;
* class-variance-authority;
* lodash-es;
* Immer.

28.14 Estado e dados

* TanStack Query;
* Zustand;
* Redux Toolkit, caso a complexidade exija;
* SWR.

28.15 Mapas de calor

* ECharts Heatmap;
* D3 Heatmap;
* Cal-Heatmap.

28.16 Tour guiado

* Driver.js;
* Shepherd.js;
* React Joyride.

28.17 Atenção arquitetural

Não deverão ser utilizadas várias bibliotecas para resolver exatamente o mesmo problema.

Exemplo:

* escolher uma biblioteca principal de gráficos;
* escolher uma biblioteca principal de ícones;
* escolher uma biblioteca principal de componentes;
* escolher uma biblioteca principal de animações.

Bibliotecas secundárias poderão ser utilizadas apenas quando entregarem um recurso específico não coberto pela principal.

⸻

29. Microinterações

Adicionar microinterações em:

* hover de cards;
* troca de abas;
* abertura de drawers;
* expansão de linhas;
* mudança de status;
* carregamento;
* atualização de dados;
* resolução de alertas;
* conexão recuperada;
* inventário concluído.

29.1 Exemplos

* card se eleva discretamente no hover;
* status online pulsa suavemente;
* contadores animam ao carregar;
* gráfico entra com transição;
* toast aparece após ação;
* linha alterada recebe destaque temporário;
* ícone de atualização gira durante execução.

As animações devem ser rápidas e discretas.

⸻

30. Tooltips ricos

Tooltips deverão explicar:

* status;
* score;
* classificação;
* campo sensível;
* tabela órfã;
* chave quebrada;
* latência;
* disponibilidade;
* severidade;
* origem do problema.

Tooltips mais completos poderão conter:

* título;
* descrição;
* métrica;
* recomendação;
* link para detalhes.

⸻

31. Estados de carregamento

Todas as páginas deverão utilizar skeletons específicos.

Exemplos:

* skeleton de cards;
* skeleton de tabelas;
* skeleton de gráficos;
* skeleton de árvore;
* skeleton de drawer.

Evitar utilizar apenas spinner central.

Para operações longas, mostrar:

* etapa;
* progresso;
* quantidade processada;
* tempo estimado;
* mensagens técnicas resumidas.

⸻

32. Estados vazios

Todo estado vazio deverá conter:

* ícone ou ilustração;
* título;
* explicação;
* ação principal;
* ação secundária quando aplicável.

Exemplo para integrações:

Nenhuma integração cadastrada

Adicione APIs, planilhas, filas ou serviços externos para acompanhar tudo no mesmo mapa de infraestrutura.

Botão:

Adicionar integração

⸻

33. Estados de erro

Quando uma tela falhar ao carregar:

* mostrar o que ocorreu;
* indicar qual recurso falhou;
* permitir tentar novamente;
* mostrar código técnico opcional;
* preservar os últimos dados disponíveis;
* não apresentar apenas uma página em branco.

⸻

34. Responsividade

Apesar de ser voltada a desktop, a aplicação deverá se adaptar a:

* notebooks;
* monitores ultrawide;
* telas menores;
* tablets em modo paisagem.

34.1 Comportamento

* sidebar recolhível;
* cards reorganizados;
* tabelas com scroll horizontal;
* filtros em drawer;
* ações em menu;
* gráficos responsivos;
* navegação secundária rolável.

⸻

35. Acessibilidade

A riqueza visual não poderá comprometer a acessibilidade.

Requisitos:

* contraste adequado;
* navegação por teclado;
* foco visível;
* tooltips acessíveis;
* ícones com labels;
* não depender apenas da cor;
* suporte a leitores de tela;
* textos alternativos;
* redução de animações;
* componentes com ARIA;
* tamanhos de clique adequados.

⸻

36. Padronização de componentes

Criar um design system específico ou uma camada do design system do Dshow Dash.

36.1 Componentes

* PageHeader;
* Breadcrumb;
* MetricCard;
* StatusBadge;
* HealthScore;
* DataGrid;
* FilterBar;
* EmptyState;
* ErrorState;
* Skeleton;
* Drawer;
* Modal;
* Tooltip;
* Tabs;
* Timeline;
* ActivityFeed;
* AlertCard;
* DatabaseCard;
* IntegrationCard;
* MaintenanceCard;
* SearchResult;
* CommandPalette;
* EnvironmentBadge;
* SensitiveFieldBadge.

36.2 Tokens

Definir:

* cores;
* fontes;
* espaços;
* bordas;
* sombras;
* raios;
* alturas;
* ícones;
* animações;
* z-index;
* breakpoints.

⸻

37. Tipografia

Utilizar uma fonte moderna e legível.

Sugestões:

* Inter;
* Geist;
* IBM Plex Sans;
* Manrope;
* Roboto Flex.

Para dados técnicos e nomes de campos:

* JetBrains Mono;
* IBM Plex Mono;
* Fira Code.

Exemplo:

* títulos: fonte principal;
* nomes de tabelas: fonte monoespaçada;
* campos: fonte monoespaçada;
* valores e métricas: fonte principal.

⸻

38. Layout

38.1 Largura

A interface deverá utilizar melhor o espaço horizontal.

Em monitores grandes:

* limitar textos longos;
* ampliar gráficos;
* colocar cards em grids;
* permitir duas ou três colunas;
* evitar conteúdo concentrado apenas no topo.

38.2 Espaçamento

Padronizar:

* 4 px;
* 8 px;
* 12 px;
* 16 px;
* 24 px;
* 32 px;
* 48 px.

38.3 Bordas

Usar bordas leves e sombras discretas.

Evitar que toda área pareça uma sequência de retângulos cinza.

⸻

39. Filtros avançados

Substituir filtros simples por uma barra de filtros mais completa.

39.1 Recursos

* filtros em chips;
* filtros ativos visíveis;
* botão limpar;
* filtros combinados;
* contador de resultados;
* seleção múltipla;
* busca nos filtros;
* operadores;
* presets do sistema.

39.2 Presets

Exemplos:

* bancos offline;
* tabelas críticas;
* campos sensíveis;
* tabelas sem PK;
* tabelas órfãs;
* problemas críticos;
* conexões com credencial expirada;
* recursos em produção.

Não será necessário salvar filtros personalizados inicialmente.

⸻

40. Menus de ação

Evitar excesso de botões textuais dentro das tabelas.

Utilizar:

* botão primário para ação principal;
* menu de reticências para ações secundárias;
* ícones no hover;
* menu contextual.

Exemplo na conexão:

* ação principal: Abrir;
* ações secundárias:
    * editar;
    * verificar;
    * inventariar;
    * manutenção;
    * desativar.

⸻

41. Breadcrumbs

Todas as páginas de detalhe deverão mostrar o caminho.

Exemplo:

Infraestrutura / srv920234 / DSHOWDASH / app_users

Cada nível deverá ser clicável.

⸻

42. URLs navegáveis

A navegação deverá possuir URLs específicas.

Exemplos:

* /datatables/bancos;
* /datatables/bancos/dshowdash;
* /datatables/tabelas/app_users;
* /datatables/alertas;
* /datatables/conexoes.

Isso permitirá:

* recarregar a página;
* usar voltar e avançar;
* copiar links;
* abrir em nova aba;
* manter estado.

⸻

43. Feedback das ações

Toda ação deverá informar:

* início;
* sucesso;
* erro;
* resultado.

Exemplos:

* conexão verificada;
* inventário iniciado;
* inventário concluído;
* manutenção criada;
* alerta reconhecido;
* credencial atualizada.

Utilizar:

* toast;
* progress bar;
* modal de resultado;
* badge temporário.

⸻

44. Prioridades de implementação

Fase 1 — Design system e navegação

* cores;
* tipografia;
* tokens;
* sidebar;
* header;
* breadcrumbs;
* modo escuro;
* ícones;
* componentes base.

Fase 2 — Dashboard e cards

* novo dashboard;
* big numbers;
* gráficos;
* health banner;
* timeline;
* atalhos.

Fase 3 — DataGrids

* padronização;
* filtros;
* expansão;
* badges;
* menus;
* skeletons;
* responsividade.

Fase 4 — Páginas críticas

* Bancos;
* Tabelas;
* Qualidade;
* Alertas;
* Conexões.

Fase 5 — Visualizações avançadas

* árvore;
* mapa de dependências;
* heatmaps;
* gauges;
* gráficos de crescimento;
* timelines.

Fase 6 — Estados vazios e fluxos

* integrações;
* manutenções;
* busca;
* alertas;
* novas conexões.

Fase 7 — Animações e refinamento

* microinterações;
* Framer Motion;
* transições;
* feedback;
* tour guiado;
* atalhos.

⸻

45. Critérios de aceite

A evolução será considerada concluída quando:

1. A navegação não depender exclusivamente de um menu horizontal extenso.
2. Todas as telas possuírem ícones e hierarquia visual clara.
3. Os principais status forem identificados imediatamente por cor, ícone e texto.
4. O dashboard apresentar gráficos e indicadores visuais.
5. As telas não possuírem grandes áreas vazias sem conteúdo útil.
6. Estados vazios possuírem ilustração, explicação e ação.
7. Os DataGrids utilizarem o mesmo padrão.
8. Cards apresentarem mais contexto do que apenas número e título.
9. Bancos e conexões possuírem cards de saúde.
10. A tela de Tabelas possuir filtros avançados, badges e expansão.
11. A tela de Qualidade possuir gráficos, score e agrupamentos visuais.
12. A central de Alertas possuir visual de incidentes.
13. A tela de Campos sensíveis possuir categorias visuais.
14. A aplicação possuir modo escuro.
15. A aplicação possuir skeleton loaders.
16. A aplicação possuir feedback de ações.
17. A aplicação utilizar SVGs em navegação, status, cards e estados vazios.
18. A interface funcionar em notebooks e monitores maiores.
19. A aplicação possuir acessibilidade por teclado.
20. A linguagem visual ser consistente em todos os módulos.

⸻

46. Regras para uso de bibliotecas

Apesar do objetivo de enriquecer a aplicação com várias bibliotecas, deverão ser seguidas estas regras:

1. Não instalar bibliotecas sem uso real.
2. Não utilizar duas bibliotecas para a mesma finalidade sem necessidade.
3. Priorizar bibliotecas mantidas e documentadas.
4. Avaliar impacto no bundle.
5. Carregar bibliotecas pesadas sob demanda.
6. Utilizar lazy loading.
7. Evitar conflitos de CSS.
8. Centralizar versões.
9. Documentar cada dependência.
10. Remover bibliotecas sem uso.
11. Garantir compatibilidade com a stack atual.
12. Manter os componentes encapsulados.
13. Evitar que um gráfico bloqueie o carregamento da página.
14. Carregar diagramas avançados apenas quando a aba for aberta.
15. Monitorar performance do front-end.

⸻

47. Resultado final esperado

O DataTables deverá evoluir de uma aplicação funcional, porém predominantemente tabular, para uma plataforma visual completa de infraestrutura de dados.

A aplicação deverá combinar:

* dashboards;
* big numbers;
* cards;
* gráficos;
* árvores;
* timelines;
* mapas;
* diagramas;
* ícones;
* badges;
* drawers;
* tooltips;
* animações;
* filtros;
* DataGrids avançados;
* estados vazios;
* modo escuro;
* responsividade;
* acessibilidade.

O resultado deverá transmitir a sensação de uma ferramenta técnica premium, desenvolvida especificamente para centralizar e monitorar todo o ecossistema de dados do Dshow Dash.

A riqueza visual não deverá ser apenas decorativa. Cada cor, ícone, gráfico, animação ou biblioteca deverá ajudar o desenvolvedor a compreender mais rapidamente:

* o que existe;
* onde está;
* qual é o estado;
* qual é o risco;
* qual ação precisa ser tomada.