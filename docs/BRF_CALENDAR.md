MEGA BRIEFING COMPLETO — MÓDULO GOOGLE CALENDAR NO DSHOW DASH

Integração de agendas, reuniões, disponibilidade, tarefas operacionais, compromissos e inteligência de tempo

⸻

1. Visão geral do projeto

Desenvolver um módulo completo de integração com o Google Calendar dentro do Dshow Dash.

O módulo deverá centralizar a consulta e a gestão dos compromissos profissionais dos usuários, permitindo trabalhar com calendários, eventos, reuniões, participantes, disponibilidade, recorrência, lembretes e conflitos sem depender continuamente da interface externa do Google Calendar.

A solução deverá seguir o mesmo padrão estrutural e visual aplicado aos módulos:

* Google Ads;
* Google Analytics;
* Meta Ads;
* Mercado Livre;
* Bling;
* Pipedrive;
* Outlook;
* E-commerce.

O novo módulo não deverá ser uma simples cópia visual do Google Calendar.

Ele deverá combinar:

* agenda pessoal;
* agenda corporativa;
* central de reuniões;
* disponibilidade da equipe;
* organização operacional;
* integração com clientes e negócios;
* acompanhamento gerencial;
* alertas;
* automações;
* análises de produtividade;
* relacionamento com os demais módulos do Dshow Dash.

A API oficial do Google Calendar possui recursos para calendários, listas de calendários, eventos, disponibilidade, configurações, cores, canais de notificação e regras de acesso. A integração deverá encapsular esses recursos no backend do Dshow Dash, sem expor credenciais no navegador.  

⸻

2. Objetivos principais do módulo

O módulo Google Calendar deverá permitir:

* consultar compromissos;
* criar eventos;
* editar eventos;
* excluir eventos;
* reagendar compromissos;
* duplicar eventos;
* convidar participantes;
* acompanhar respostas;
* visualizar disponibilidade;
* encontrar horários livres;
* detectar conflitos;
* trabalhar com vários calendários;
* alternar agendas;
* utilizar eventos recorrentes;
* configurar lembretes;
* adicionar links de reunião;
* relacionar eventos a clientes;
* relacionar reuniões a negócios;
* relacionar compromissos a propostas;
* relacionar eventos a pedidos ou projetos;
* acompanhar reuniões atrasadas ou não realizadas;
* consolidar agendas de equipes autorizadas;
* analisar carga de reuniões;
* acompanhar horas ocupadas;
* acompanhar tempo livre;
* gerar alertas;
* criar automações;
* disponibilizar agenda na página inicial;
* reduzir a necessidade de acessar o Google Calendar externamente.

O módulo deverá funcionar simultaneamente como:

1. agenda pessoal;
2. agenda corporativa;
3. central de reuniões;
4. painel de disponibilidade;
5. ferramenta de planejamento;
6. central de compromissos com clientes;
7. calendário comercial;
8. calendário operacional;
9. painel gerencial;
10. central de alertas;
11. central de sincronização;
12. ambiente de auditoria.

⸻

3. Estratégia de implementação

O projeto deverá ser dividido em fases.

3.1. Primeira fase — investigação

Antes de desenvolver novas telas, investigar:

* se já existe integração com Google Workspace;
* se existe login com Google;
* se há projeto no Google Cloud;
* se a Calendar API já está habilitada;
* quais credenciais existem;
* quais usuários já autorizaram acesso;
* quais escopos foram concedidos;
* se já existem tokens armazenados;
* se há service accounts;
* se existe sincronização parcial;
* se existem tabelas de eventos;
* se Outlook e Google Calendar compartilham alguma arquitetura;
* se há componentes de calendário reutilizáveis;
* se existem jobs ou webhooks;
* se já há integrações com Pipedrive e agenda.

3.2. Segunda fase — implementação com mocks

Construir inicialmente a interface com dados simulados realistas.

Os mocks deverão permitir validar:

* navegação;
* visualizações;
* criação;
* edição;
* recorrência;
* participantes;
* disponibilidade;
* conflitos;
* permissões;
* filtros;
* estados de erro;
* sincronização;
* alertas;
* responsividade.

3.3. Terceira fase — integração real

Substituir os mocks progressivamente pela integração oficial.

A mudança da fonte de dados não deverá exigir reconstrução das telas ou componentes.

⸻

4. Investigação técnica obrigatória

Antes de escrever código de integração, o agente deverá produzir um relatório técnico completo.

4.1. Investigação do front-end

Mapear:

* página de agenda existente;
* componentes de calendário;
* date pickers;
* time pickers;
* modais;
* drawers;
* formulários;
* componentes de participantes;
* sistemas de notificações;
* filtros;
* stores;
* hooks;
* services;
* rotas;
* feature flags;
* permissões;
* tratamento de timezone;
* bibliotecas já instaladas;
* componentes reutilizáveis do Outlook;
* agenda da página inicial;
* visualizações diária, semanal e mensal existentes.

Verificar se já são utilizadas bibliotecas como:

* FullCalendar;
* React Big Calendar;
* Schedule-X;
* DayPilot;
* date-fns;
* Luxon;
* Temporal polyfill;
* React Hook Form;
* TanStack Query.

4.2. Investigação do backend

Mapear:

* projeto Google Cloud;
* OAuth Client ID;
* redirect URIs;
* tokens;
* refresh tokens;
* armazenamento criptografado;
* endpoints internos;
* services;
* repositories;
* jobs;
* filas;
* sincronização;
* notificações push;
* logs;
* auditoria;
* rate limiting;
* tratamento de erros;
* revogação de conexão.

4.3. Investigação do banco de dados

Localizar tabelas relacionadas a:

* usuários;
* contas Google;
* calendários;
* eventos;
* participantes;
* respostas;
* recorrências;
* lembretes;
* disponibilidade;
* integrações;
* tokens;
* notificações;
* jobs;
* erros;
* auditoria.

Classificar cada estrutura como:

* ativa;
* incompleta;
* obsoleta;
* duplicada;
* não utilizada;
* legado;
* candidata a migração.

4.4. Investigação dos relacionamentos internos

Verificar possibilidade de relacionar eventos com:

* usuário interno;
* cliente;
* pessoa;
* organização;
* negócio do Pipedrive;
* lead;
* proposta;
* orçamento;
* pedido;
* fornecedor;
* colaborador;
* projeto;
* campanha;
* reunião;
* tarefa;
* e-mail;
* registro do CRM.

⸻

5. Entregável da investigação

O agente deverá entregar antes da implementação:

* diagrama da arquitetura atual;
* lista de arquivos;
* lista de componentes;
* endpoints existentes;
* tabelas;
* campos;
* credenciais configuradas;
* escopos atuais;
* fluxos de autenticação;
* fluxos de sincronização;
* riscos;
* problemas;
* oportunidades de reutilização;
* lacunas;
* proposta de arquitetura;
* plano de migração;
* plano de segurança.

Nenhuma estrutura existente deverá ser removida sem análise prévia.

⸻

6. Formas de acesso ao módulo

O Google Calendar deverá ser acessível por:

* botão na sidebar;
* ícone no header;
* widget da página inicial;
* busca global;
* menu de atalhos;
* links contextuais;
* notificações;
* perfil do usuário.

⸻

7. Posicionamento na sidebar

Criar um botão:

Google Calendar

7.1. Posicionamento recomendado

Posicionar próximo de Outlook e demais ferramentas de produtividade.

Sugestão de grupo:

Comunicação e Produtividade

1. Outlook;
2. Google Calendar;
3. futuras ferramentas de reunião;
4. tarefas;
5. documentos.

Caso ainda não exista esse grupo, avaliar criar a categoria sem prejudicar a organização atual da sidebar.

7.2. Características do botão

O botão deverá possuir:

* ícone de calendário;
* label “Google Calendar”;
* tooltip;
* estado ativo;
* hover;
* foco;
* badge;
* suporte à sidebar expandida;
* suporte à sidebar colapsada;
* acessibilidade por teclado;
* indicador de sincronização.

7.3. Badge

O badge poderá representar:

* reunião começando;
* convite pendente;
* conflito;
* evento alterado;
* falha de sincronização;
* compromisso atrasado.

Evitar usar o badge para mostrar simplesmente a quantidade total de eventos.

⸻

8. Ícone no header

Criar ou utilizar ícone do Google Calendar no header principal.

8.1. Comportamento

Ao clicar:

* abrir o módulo no conteúdo principal;
* preservar o shell;
* destacar o botão na sidebar;
* abrir a visão padrão;
* restaurar a última visualização;
* não abrir nova aba;
* não redirecionar para a aplicação externa.

8.2. Tooltip resumido

Exemplo:

Google Calendar

* 4 compromissos hoje;
* próxima reunião às 10h30;
* 1 convite pendente;
* 2 horas livres à tarde;
* atualizado há 2 minutos.

8.3. Estados do ícone

* conectado;
* sincronizando;
* atenção;
* erro;
* desatualizado;
* reunião em andamento;
* evento próximo;
* modo mock;
* conta não conectada.

⸻

9. Menu rápido no header

Ao clicar ou passar o cursor, poderá abrir um popover com:

* próximos três compromissos;
* horário;
* título;
* participantes;
* status;
* link de reunião;
* botão “Abrir agenda”;
* botão “Novo evento”.

Exemplo:

Hoje
09:30 — Reunião Comercial
10:30 — Revisão Google Ads
14:00 — Reunião com fornecedor

O popover deverá respeitar permissões e não exibir detalhes de eventos privados indevidamente.

⸻

10. Navegação interna do módulo

Criar sub-sidebar expansível e colapsável.

10.1. Visão

1. Minha Agenda
2. Hoje
3. Próximos Compromissos
4. Visão da Equipe
5. Diretoria

10.2. Calendários

6. Meus Calendários
7. Calendários Compartilhados
8. Calendários Corporativos
9. Recursos e Salas
10. Favoritos

10.3. Organização

11. Reuniões
12. Compromissos
13. Bloqueios de Agenda
14. Foco
15. Fora do Escritório
16. Local de Trabalho
17. Eventos Recorrentes

10.4. Relacionamentos

18. Clientes
19. Pipedrive
20. Comercial
21. Fornecedores
22. Projetos
23. E-mails Relacionados

10.5. Inteligência

24. Disponibilidade
25. Conflitos
26. Carga de Reuniões
27. Produtividade
28. Relatórios
29. Alertas

10.6. Administração

30. Contas Conectadas
31. Sincronização
32. Notificações
33. Permissões
34. Logs
35. Auditoria
36. Configurações

⸻

11. Sidebar interna

11.1. Estado expandido

* largura entre 228 e 248 px;
* recomendação: 240 px;
* labels;
* ícones;
* grupos;
* badges;
* item ativo;
* scroll independente.

11.2. Estado colapsado

* largura entre 64 e 76 px;
* recomendação: 72 px;
* ícones centralizados;
* tooltips;
* badges compactos;
* item ativo visível.

11.3. Persistência

Salvar por usuário:

dshow.google-calendar.sidebar.collapsed

⸻

12. Header interno do módulo

O header deverá conter:

* título “Google Calendar”;
* subtítulo;
* seletor de conta;
* seletor de calendário;
* seletor de visualização;
* seletor de período;
* botão “Hoje”;
* navegação anterior e próxima;
* busca;
* filtros;
* botão atualizar;
* botão “Novo evento”;
* status da integração;
* última sincronização;
* configurações.

Subtítulo sugerido:

Gestão integrada de agendas, reuniões, disponibilidade e compromissos.

⸻

13. Visualizações principais

Disponibilizar:

* dia;
* semana;
* semana de trabalho;
* mês;
* agenda;
* lista;
* linha do tempo;
* recursos;
* equipe;
* ano;
* mapa de disponibilidade.

13.1. Visualização diária

Exibir:

* faixa horária;
* eventos;
* conflitos;
* tempo livre;
* horário de trabalho;
* bloqueios;
* reuniões;
* localização;
* fusos horários.

13.2. Visualização semanal

Exibir:

* sete dias;
* compromissos;
* eventos de dia inteiro;
* blocos de foco;
* horas livres;
* conflitos;
* carga por dia.

13.3. Semana de trabalho

Permitir configurar:

* dias úteis;
* horário inicial;
* horário final;
* dias não trabalhados;
* feriados.

13.4. Visualização mensal

Exibir:

* eventos resumidos;
* quantidade por dia;
* cores dos calendários;
* expansão;
* filtros;
* navegação rápida.

13.5. Visualização em lista

Utilizar data grid robusto para:

* eventos;
* convites;
* participantes;
* status;
* calendário;
* relacionamento;
* recorrência;
* última atualização.

⸻

14. Biblioteca de calendário

A biblioteca deverá suportar:

* drag-and-drop;
* redimensionamento;
* recorrência;
* vários calendários;
* eventos de dia inteiro;
* recursos;
* timezone;
* acessibilidade;
* responsividade;
* virtualização quando necessária.

Opções a avaliar:

* FullCalendar;
* Schedule-X;
* React Big Calendar;
* DayPilot.

A seleção deverá considerar:

* licenciamento;
* integração com React;
* acessibilidade;
* capacidade de customização;
* desempenho;
* suporte a recursos;
* consistência com o Dshow Dash.

Não escolher apenas pela aparência do exemplo inicial.

⸻

15. Dashboard — Hoje

Criar uma tela de resumo diário.

15.1. KPIs

* compromissos hoje;
* reuniões;
* eventos pendentes;
* convites aguardando resposta;
* tempo ocupado;
* tempo livre;
* conflitos;
* participantes externos;
* eventos cancelados;
* próxima reunião.

15.2. Linha do tempo

Apresentar os compromissos do dia em timeline vertical.

Cada item deverá mostrar:

* horário;
* duração;
* título;
* calendário;
* participantes;
* local;
* link;
* relacionamento;
* status.

15.3. Bloco “Próximo compromisso”

Exibir:

* título;
* horário;
* contagem regressiva;
* participantes;
* link de reunião;
* materiais;
* cliente ou negócio relacionado;
* botão “Entrar”.

⸻

16. Dashboard — Visão Geral

Criar uma visão executiva e operacional contendo:

* agenda do dia;
* compromissos da semana;
* disponibilidade;
* conflitos;
* convites;
* reuniões com clientes;
* carga de reuniões;
* eventos recorrentes;
* contas conectadas;
* falhas de sincronização;
* alertas.

16.1. Cards principais

* reuniões hoje;
* horas ocupadas;
* horas livres;
* reuniões com clientes;
* convites pendentes;
* conflitos;
* eventos cancelados;
* próxima reunião.

Cada card deverá conter:

* valor;
* comparação;
* ícone;
* sparkline;
* drill-down;
* tooltip;
* período.

⸻

17. Criação de evento

Criar um fluxo de criação completo.

17.1. Campos principais

* título;
* descrição;
* calendário;
* data;
* horário inicial;
* horário final;
* dia inteiro;
* timezone;
* local;
* link de reunião;
* participantes;
* recorrência;
* lembretes;
* visibilidade;
* disponibilidade;
* cor;
* anexos;
* relacionamento interno;
* observações.

17.2. Ações

* salvar;
* salvar e enviar convites;
* salvar como rascunho interno;
* duplicar;
* cancelar;
* visualizar antes de enviar.

17.3. Validações

* horário final posterior ao inicial;
* conflitos;
* participante sem endereço válido;
* calendário sem permissão de escrita;
* timezone;
* recorrência inválida;
* evento no passado;
* duração excessiva;
* recurso indisponível.

⸻

18. Criação rápida

Ao clicar em uma faixa vazia da agenda, abrir um popover compacto com:

* título;
* início;
* fim;
* calendário;
* participantes;
* botão “Mais opções”.

O usuário deverá conseguir criar rapidamente um compromisso sem abandonar a agenda.

⸻

19. Edição de evento

Permitir:

* editar título;
* alterar horário;
* mover de calendário;
* adicionar participante;
* remover participante;
* alterar local;
* adicionar reunião;
* alterar recorrência;
* modificar lembretes;
* alterar visibilidade;
* relacionar ao CRM;
* cancelar;
* excluir.

Para eventos recorrentes, perguntar:

* somente este evento;
* este e os seguintes;
* toda a série.

Eventos recorrentes são representados por regras de recorrência, e suas ocorrências podem ser consultadas e tratadas como instâncias relacionadas à série.  

⸻

20. Recorrência

Suportar:

* diariamente;
* semanalmente;
* mensalmente;
* anualmente;
* dias úteis;
* dias específicos;
* intervalo personalizado;
* quantidade de ocorrências;
* data final;
* sem data final.

Criar editor visual de recorrência.

Exemplo:

Repetir a cada 2 semanas
Às terças e quintas
Até 30/12/2026

Armazenar a regra de forma compatível com o modelo do Google e com a representação local.

⸻

21. Participantes

Criar seletor avançado.

21.1. Fontes

* Google Contacts;
* usuários internos;
* Pipedrive;
* clientes;
* fornecedores;
* e-mails recentes;
* contatos favoritos.

21.2. Informações

* nome;
* e-mail;
* empresa;
* função;
* disponibilidade;
* status do convite;
* origem.

21.3. Status

* organizador;
* aceitou;
* recusou;
* talvez;
* aguardando resposta;
* resposta desconhecida.

⸻

22. Disponibilidade e Free/Busy

Criar uma experiência para encontrar horários livres.

A API possui consulta de disponibilidade para calendários e grupos, retornando intervalos ocupados sem necessariamente expor os detalhes do evento.  

22.1. Recursos

* selecionar participantes;
* escolher duração;
* escolher intervalo;
* visualizar horários livres;
* sugerir melhores horários;
* respeitar fusos;
* considerar horário de trabalho;
* evitar horário de almoço;
* considerar bloqueios;
* destacar conflitos.

22.2. Matriz visual

Criar matriz com:

* pessoas nas linhas;
* horários nas colunas;
* livre;
* ocupado;
* fora do horário;
* conflito;
* indisponível.

22.3. Sugestões

Exibir:

Melhores horários encontrados

* terça-feira, 10h às 10h30;
* terça-feira, 15h às 16h;
* quarta-feira, 9h às 10h.

⸻

23. Conflitos

Criar uma central de conflitos.

Detectar:

* eventos simultâneos;
* deslocamento insuficiente;
* horários fora do expediente;
* recursos duplicados;
* reuniões excessivamente próximas;
* participantes indisponíveis;
* evento durante ausência;
* evento durante foco;
* sobreposição recorrente.

23.1. Tratamento

Cada conflito deverá mostrar:

* eventos envolvidos;
* participantes;
* duração;
* impacto;
* sugestão;
* ação para reagendar;
* possibilidade de ignorar;
* histórico.

⸻

24. Reuniões online

Preparar suporte para:

* Google Meet;
* links externos;
* Microsoft Teams;
* Zoom;
* outras plataformas.

24.1. Ações

* criar link;
* copiar;
* abrir;
* remover;
* substituir;
* verificar validade.

24.2. Preview

Mostrar:

* plataforma;
* link;
* código;
* telefone, quando disponível;
* instruções.

Não registrar tokens ou credenciais da reunião em logs.

⸻

25. Eventos especiais de status

Preparar suporte para eventos de:

* foco;
* fora do escritório;
* local de trabalho.

A API do Google Calendar possui tipos específicos para foco, ausência e local de trabalho, embora esses recursos possam depender do calendário principal e da disponibilidade para determinados usuários.  

25.1. Foco

Permitir:

* bloquear período;
* silenciar convites;
* definir regra de aceitação;
* adicionar descrição;
* repetir.

25.2. Fora do escritório

Permitir:

* período;
* mensagem;
* resposta automática;
* recusa automática de reuniões, quando suportada;
* recorrência.

25.3. Local de trabalho

Permitir:

* escritório;
* casa;
* outro local;
* recorrência;
* horário parcial.

⸻

26. Lembretes e notificações

Permitir configurar:

* notificação interna;
* e-mail;
* alerta do Google;
* minutos antes;
* horas antes;
* dias antes;
* múltiplos lembretes.

26.1. Central de notificações

Exibir:

* eventos próximos;
* convites;
* alterações;
* cancelamentos;
* conflitos;
* eventos sem resposta;
* eventos atrasados;
* falhas de sincronização.

26.2. Deduplicação

Evitar que o mesmo compromisso gere notificações repetidas no:

* Google;
* Dshow Dash;
* navegador;
* e-mail.

Criar regras de preferência por usuário.

⸻

27. Calendários múltiplos

Permitir:

* visualizar vários calendários;
* ativar ou ocultar;
* definir cor;
* favoritar;
* ordenar;
* agrupar;
* selecionar calendário padrão;
* visualizar calendário principal;
* visualizar compartilhados.

A API distingue recursos de calendário e a lista de calendários acessíveis ao usuário, permitindo consultar e administrar calendários conforme o nível de acesso.  

⸻

28. Calendários compartilhados

Criar uma área para:

* equipe comercial;
* diretoria;
* operações;
* showroom;
* salas;
* veículos;
* equipamentos;
* projetos;
* eventos corporativos.

Exibir:

* nome;
* responsável;
* cor;
* acesso;
* usuários;
* última sincronização;
* status.

⸻

29. Recursos e salas

Preparar suporte para calendários de recursos, como:

* salas de reunião;
* showroom;
* veículos;
* equipamentos;
* espaços;
* estúdios.

29.1. Reserva

Permitir:

* escolher recurso;
* consultar disponibilidade;
* reservar;
* detectar conflito;
* liberar;
* visualizar agenda do recurso.

29.2. Informações

* capacidade;
* localização;
* equipamentos;
* regras;
* responsável;
* status.

⸻

30. Regras de acesso e permissões do Google

Os níveis de acesso da agenda deverão ser respeitados.

A API diferencia permissões como:

* somente livre/ocupado;
* leitura;
* escrita;
* proprietário ou administrador do calendário.

Eventos privados podem ter seus detalhes ocultos conforme a permissão concedida.  

O Dshow Dash não deverá tentar exibir ou editar dados além do acesso autorizado pelo Google.

⸻

31. Escopos OAuth

Solicitar sempre o menor escopo necessário.

Exemplos oficiais incluem:

* somente leitura de calendários;
* consulta de disponibilidade;
* leitura e escrita de eventos;
* gerenciamento mais amplo de calendários.

O escopo integral oferece acesso significativamente maior do que o necessário para uma simples consulta, portanto deverá ser evitado quando um escopo mais restrito atender ao fluxo.  

31.1. Estratégia sugerida

Fase somente leitura

Utilizar escopos mínimos de:

* calendário em leitura;
* disponibilidade.

Fase operacional

Adicionar escopo de eventos para usuários que autorizarem criação e edição.

Fase administrativa

Solicitar escopos amplos somente para funções realmente necessárias e autorizadas.

⸻

32. Integração com Pipedrive

Relacionar eventos com:

* pessoa;
* organização;
* negócio;
* lead;
* atividade;
* vendedor;
* pipeline;
* etapa.

32.1. Ações

* criar evento a partir de negócio;
* vincular reunião existente;
* abrir negócio pelo calendário;
* registrar reunião concluída;
* criar atividade no Pipedrive;
* sincronizar resultado;
* adicionar observação.

32.2. Ficha lateral

Ao abrir um evento relacionado, mostrar:

* cliente;
* negócio;
* valor;
* etapa;
* responsável;
* últimas atividades;
* próxima ação.

⸻

33. Integração com Outlook

O usuário poderá possuir:

* conta Google;
* conta Outlook;
* múltiplas agendas.

A arquitetura deverá preparar uma visão unificada, mas sem misturar identificadores ou alterar eventos entre provedores incorretamente.

33.1. Regras

* identificar claramente a origem;
* utilizar cores ou ícones;
* impedir edição pelo provider errado;
* detectar duplicidades;
* respeitar permissões;
* preservar IDs externos;
* evitar loops de sincronização.

⸻

34. Integração com clientes e CRM

Permitir relacionar o evento com:

* cliente;
* contato;
* organização;
* proposta;
* orçamento;
* pedido;
* contrato;
* fornecedor.

34.1. Criação contextual

A partir da ficha de um cliente:

* agendar reunião;
* escolher participantes;
* sugerir horário;
* adicionar contexto;
* incluir link de videoconferência;
* vincular automaticamente.

⸻

35. Integração com e-mails

Relacionar eventos com e-mails do Outlook ou Gmail quando disponíveis.

Possibilidades:

* criar evento a partir de e-mail;
* abrir conversa relacionada;
* anexar contexto;
* convidar remetentes;
* registrar follow-up;
* consultar anexos.

Não copiar conteúdo completo do e-mail para o calendário sem ação explícita.

⸻

36. Integração com a página inicial

Criar widget de agenda na home.

36.1. Conteúdo

* próximos compromissos;
* próxima reunião;
* horários livres;
* conflitos;
* convite pendente;
* compromisso prioritário.

36.2. Ações

* abrir agenda;
* criar evento;
* entrar na reunião;
* responder convite;
* reagendar.

⸻

37. Agenda da equipe

Criar visualização gerencial para usuários autorizados.

37.1. Modos

* sobreposição;
* colunas por usuário;
* timeline;
* heatmap;
* lista;
* disponibilidade.

37.2. Indicadores

* horas em reunião;
* tempo livre;
* conflitos;
* compromissos externos;
* dias mais ocupados;
* reuniões por área;
* reuniões por cliente.

Não utilizar essa área para vigilância individual excessiva. Mostrar somente dados necessários à coordenação e respeitar as permissões.

⸻

38. Análise de carga de reuniões

Criar indicadores como:

* horas em reunião;
* média de reuniões por dia;
* duração média;
* reuniões consecutivas;
* reuniões fora do expediente;
* tempo de foco preservado;
* cancelamentos;
* reagendamentos;
* reuniões sem pauta;
* reuniões sem participantes externos.

38.1. Visualizações

Utilizar Apache ECharts para:

* evolução de horas;
* distribuição por dia;
* duração;
* reuniões por área;
* horário mais utilizado;
* comparação de períodos.

38.2. Interpretação

Não presumir que mais reuniões significam maior produtividade.

Os indicadores devem ser apresentados como carga e organização da agenda, não como avaliação automática de desempenho.

⸻

39. Heatmap de disponibilidade em D3

Utilizar D3.js para criar uma matriz semanal.

Eixos:

* dias da semana;
* horários.

Métricas:

* livre;
* ocupado;
* foco;
* fora do escritório;
* conflito;
* fora do expediente.

Recursos:

* tooltip;
* filtros;
* seleção;
* zoom;
* comparação;
* drill-down;
* suporte a equipes.

⸻

40. Fluxo de reuniões em D3

Criar visualização opcional para mostrar:

Origem da reunião
→ Área
→ Tipo
→ Participantes
→ Resultado

Exemplos de origem:

* cliente;
* equipe interna;
* fornecedor;
* campanha;
* Pipedrive;
* evento recorrente.

Essa visualização deverá ser usada apenas quando houver dados suficientes e benefício analítico.

⸻

41. Data grid de eventos

A visualização em lista deverá utilizar data grid robusto.

41.1. Colunas

* início;
* fim;
* duração;
* título;
* calendário;
* organizador;
* participantes;
* resposta;
* tipo;
* local;
* videoconferência;
* recorrência;
* visibilidade;
* relacionamento;
* status;
* última atualização;
* ações.

41.2. Recursos

* virtualização;
* filtros;
* busca;
* ordenação múltipla;
* agrupamento;
* colunas fixadas;
* seleção;
* ações em lote;
* expansão;
* exportação;
* zebra rows;
* preferências;
* menus contextuais;
* densidade;
* views salvas.

⸻

42. Busca global do módulo

Permitir localizar:

* evento;
* calendário;
* participante;
* cliente;
* empresa;
* negócio;
* local;
* sala;
* recurso;
* descrição;
* organizador.

42.1. Busca geral do Dshow Dash

A busca global do sistema também deverá retornar:

* próximos eventos;
* reuniões;
* calendários;
* clientes relacionados.

Resultados privados devem respeitar as permissões.

⸻

43. Filtros

Criar filtros para:

* conta;
* calendário;
* período;
* participante;
* organizador;
* resposta;
* tipo;
* status;
* relacionamento;
* cliente;
* área;
* local;
* reunião online;
* recorrente;
* privado;
* conflito;
* duração.

Recursos:

* chips;
* contador;
* presets;
* filtros salvos;
* favoritos;
* limpar;
* persistência;
* compartilhamento autorizado.

⸻

44. Convites

Criar central de convites.

44.1. Categorias

* aguardando resposta;
* aceitos;
* recusados;
* talvez;
* cancelados;
* alterados.

44.2. Ações

* aceitar;
* recusar;
* talvez;
* adicionar comentário;
* sugerir novo horário;
* abrir detalhes.

44.3. Confirmação

Antes de enviar a resposta, mostrar:

* organizador;
* participantes;
* horário;
* mensagem;
* consequências.

⸻

45. Visibilidade dos eventos

Suportar:

* padrão;
* público;
* privado;
* confidencial, quando aplicável.

Eventos privados deverão mostrar apenas informações permitidas para usuários sem acesso aos detalhes. A API documenta visibilidade e transparência como propriedades distintas: uma controla quem vê detalhes e a outra se o evento bloqueia ou não a agenda.  

⸻

46. Evento ocupado ou disponível

Permitir definir:

* ocupado;
* disponível.

Eventos marcados como transparentes não bloqueiam o horário, enquanto eventos opacos bloqueiam o período como ocupado.  

A interface deverá usar labels amigáveis:

* Mostrar como ocupado
* Mostrar como disponível

⸻

47. Timezones

O sistema deverá suportar:

* timezone do usuário;
* timezone do calendário;
* timezone do evento;
* participantes internacionais;
* horário de verão;
* exibição dupla.

47.1. Requisitos

* armazenar data e hora corretamente;
* não converter eventos de dia inteiro incorretamente;
* exibir timezone no formulário;
* alertar diferença relevante;
* evitar valores fixos de São Paulo na lógica.

47.2. Visualização dupla

Exemplo:

10:00 São Paulo
21:00 Shenzhen

⸻

48. Eventos de dia inteiro

Tratar separadamente:

* datas sem horário;
* feriados;
* viagens;
* aniversários;
* ausências;
* eventos corporativos.

Não transformar evento de dia inteiro em evento de 24 horas com timezone.

⸻

49. Sincronização inicial e incremental

A primeira sincronização deverá carregar os eventos relevantes dentro de uma janela configurada.

Depois, utilizar sincronização incremental.

O Google documenta sincronização incremental por meio de tokens, permitindo consultar apenas recursos alterados após a sincronização anterior e economizar banda e processamento.  

49.1. Carga inicial sugerida

* histórico configurável;
* próximos eventos;
* calendários;
* configurações;
* participantes;
* recorrências;
* instâncias relevantes.

49.2. Incremental

Armazenar:

* sync token;
* calendar ID;
* última sincronização;
* status;
* quantidade processada;
* próxima execução.

49.3. Token inválido

Quando o token deixar de ser válido:

* registrar ocorrência;
* realizar nova carga completa controlada;
* evitar duplicação;
* não apagar dados antes da reconciliação.

⸻

50. Notificações push

Utilizar canais de notificação para receber sinais de alteração.

A API permite criar canais watch para acompanhar mudanças em recursos de eventos, calendários e ACLs, utilizando entrega por webhook.  

50.1. Fluxo recomendado

1. criar canal;
2. armazenar channel ID;
3. armazenar resource ID;
4. armazenar expiração;
5. receber notificação;
6. validar canal;
7. enviar processamento para fila;
8. realizar sincronização incremental;
9. registrar resultado;
10. renovar antes da expiração.

50.2. Regra importante

A notificação deverá ser tratada como sinal de mudança.

O sistema deverá buscar os detalhes atualizados pela API e não depender exclusivamente do conteúdo da notificação.

⸻

51. Tela de sincronização

Criar área contendo:

* conta;
* calendário;
* status;
* última sincronização;
* próxima sincronização;
* duração;
* eventos processados;
* novos;
* atualizados;
* excluídos;
* erros;
* sync token;
* canal;
* expiração;
* tentativa;
* webhook;
* job.

51.1. Ações

* sincronizar;
* reprocessar;
* renovar canal;
* desconectar;
* visualizar logs;
* limpar erro;
* executar carga completa, com permissão.

⸻

52. Arquitetura de serviços

Criar um contrato desacoplado.

interface GoogleCalendarService {
  getOverview(filters: CalendarOverviewFilters): Promise<CalendarOverview>;
  getCalendars(): Promise<CalendarSummary[]>;
  getEvents(filters: EventFilters): Promise<PaginatedResult<CalendarEvent>>;
  getEvent(calendarId: string, eventId: string): Promise<CalendarEventDetails>;
  createEvent(payload: CreateEventPayload): Promise<CalendarEventDetails>;
  updateEvent(payload: UpdateEventPayload): Promise<CalendarEventDetails>;
  deleteEvent(calendarId: string, eventId: string): Promise<void>;
  getFreeBusy(payload: FreeBusyRequest): Promise<FreeBusyResult>;
  getInvitations(filters: InvitationFilters): Promise<Invitation[]>;
  getConflicts(filters: ConflictFilters): Promise<CalendarConflict[]>;
  getAlerts(filters: AlertFilters): Promise<CalendarAlert[]>;
}

Implementar inicialmente:

class MockGoogleCalendarService implements GoogleCalendarService

Posteriormente:

class ApiGoogleCalendarService implements GoogleCalendarService

⸻

53. Arquitetura recomendada

Google Calendar API
        ↓
Google OAuth Service
        ↓
Google Calendar Adapter
        ↓
Normalizer
        ↓
Repositories e banco local
        ↓
API interna do Dshow Dash
        ↓
Front-end

Componentes complementares:

* scheduler;
* fila;
* worker;
* webhook receiver;
* token vault;
* cache;
* auditoria;
* observabilidade.

⸻

54. Autenticação

A conexão deverá ser realizada por OAuth.

54.1. Fluxo

1. usuário escolhe “Conectar Google Calendar”;
2. backend gera autorização;
3. usuário autoriza os escopos;
4. callback retorna ao backend;
5. tokens são armazenados de forma segura;
6. conta e calendários são identificados;
7. inicia-se sincronização;
8. status aparece na interface.

54.2. Requisitos

* OAuth state;
* PKCE quando aplicável;
* redirect URI validada;
* refresh token criptografado;
* rotação;
* revogação;
* menor privilégio;
* separação entre ambientes;
* logs sem tokens.

⸻

55. Múltiplas contas

Cada usuário poderá conectar:

* uma conta Google;
* várias contas Google;
* conta pessoal;
* conta corporativa.

A interface deverá mostrar claramente:

* conta de origem;
* e-mail;
* organização;
* status;
* calendários;
* última sincronização;
* permissões.

Não misturar eventos entre contas sem identificação visual.

⸻

56. Modelo de dados sugerido

Criar entidades como:

google_calendar_accounts
google_calendar_oauth_tokens
google_calendars
google_calendar_list_entries
google_calendar_events
google_calendar_event_attendees
google_calendar_event_reminders
google_calendar_event_recurrence
google_calendar_event_instances
google_calendar_event_conferences
google_calendar_event_attachments
google_calendar_event_links
google_calendar_freebusy_cache
google_calendar_watch_channels
google_calendar_sync_state
google_calendar_sync_jobs
google_calendar_sync_errors
google_calendar_alerts
google_calendar_audit_logs
google_calendar_internal_links

56.1. Campos técnicos comuns

* ID interno;
* Google account ID;
* calendar ID;
* event ID;
* iCal UID;
* status;
* etag;
* sequence;
* recurring event ID;
* original start time;
* created;
* updated;
* synced at;
* deleted;
* raw payload;
* hash;
* version.

⸻

57. Relacionamentos internos

Criar tabela genérica ou entidades específicas para vincular eventos a:

* cliente;
* organização;
* negócio;
* lead;
* proposta;
* pedido;
* fornecedor;
* colaborador;
* projeto;
* e-mail.

Exemplo:

google_calendar_event_links
- event_id
- entity_type
- entity_id
- relation_type
- created_by
- created_at

⸻

58. Estratégia de IDs

Preservar:

* event ID do Google;
* calendar ID;
* iCal UID;
* recurring event ID;
* ID interno.

Não utilizar somente título, data e participante para identificar eventos.

⸻

59. Exclusão e cancelamento

Diferenciar:

* evento excluído;
* evento cancelado;
* convite recusado;
* evento removido apenas do calendário local;
* série recorrente alterada.

Ao excluir eventos pela API, a aplicação poderá controlar quais participantes recebem atualizações por meio do parâmetro de envio de notificações. A interface deverá explicitar essa escolha antes da ação.  

Exemplo de confirmação:

Deseja notificar os participantes sobre o cancelamento?

⸻

60. Atualização otimista

Para ações como:

* mover;
* redimensionar;
* editar título;
* aceitar convite;

utilizar atualização otimista com:

* indicador de salvamento;
* rollback;
* toast;
* conflito de versão;
* nova tentativa.

Não ocultar falhas de sincronização.

⸻

61. Conflito de edição

Detectar quando:

* evento foi alterado em outra sessão;
* organizador modificou;
* evento foi cancelado;
* série mudou;
* participante perdeu acesso.

Exibir opções:

* recarregar versão atual;
* comparar alterações;
* manter edição local;
* cancelar.

⸻

62. Sistema de alertas

62.1. Agenda

* evento próximo;
* convite pendente;
* conflito;
* evento sem resposta;
* reunião alterada;
* reunião cancelada;
* evento recorrente com problema.

62.2. Organização

* reunião consecutiva;
* excesso de carga;
* evento fora do expediente;
* compromisso sem intervalo;
* sala indisponível;
* participante sem disponibilidade.

62.3. Técnico

* conta desconectada;
* token inválido;
* sincronização atrasada;
* webhook expirado;
* calendário sem acesso;
* erro de recorrência;
* evento não sincronizado.

62.4. Configuração

Permitir:

* ativar;
* desativar;
* selecionar calendário;
* definir antecedência;
* definir severidade;
* escolher destinatário;
* cooldown;
* deduplicação;
* resolução.

⸻

63. Automações

Preparar estrutura para:

* criar follow-up após reunião;
* criar tarefa antes de reunião;
* adicionar link de videoconferência;
* reservar sala;
* avisar participantes;
* criar atividade no Pipedrive;
* registrar reunião concluída;
* gerar resumo;
* notificar conflito;
* bloquear tempo de preparação;
* bloquear deslocamento;
* criar evento a partir de negócio.

Cada automação deverá possuir:

* nome;
* gatilho;
* condição;
* ação;
* status;
* responsável;
* modo teste;
* logs;
* última execução;
* próxima execução;
* histórico.

⸻

64. Relatórios

Criar relatórios para:

* eventos;
* reuniões;
* participantes;
* convites;
* disponibilidade;
* conflitos;
* carga de reuniões;
* clientes;
* negócios;
* duração;
* cancelamentos;
* reagendamentos;
* calendários;
* recursos;
* sincronização.

64.1. Recursos

* filtros;
* agrupamento;
* colunas;
* totalizadores;
* gráficos;
* exportação CSV;
* exportação XLSX;
* PDF;
* impressão;
* visualizações salvas;
* favoritos.

⸻

65. D3.js como biblioteca analítica

Utilizar D3.js para:

* heatmap de disponibilidade;
* mapa de relacionamentos;
* rede de reuniões;
* fluxo de compromissos;
* visualização de carga;
* distribuição de horários;
* relações entre clientes, usuários e eventos.

Toda visualização deverá possuir:

* tooltip;
* legenda;
* seleção;
* reset;
* cross-filter;
* drill-down;
* loading;
* estado vazio;
* responsividade;
* suporte a temas.

⸻

66. Apache ECharts

Utilizar para:

* reuniões por período;
* horas ocupadas;
* duração;
* cancelamentos;
* conflitos;
* distribuição por horário;
* carga semanal;
* comparação entre equipes;
* evolução de compromissos.

⸻

67. Cross-filter

Exemplos:

* selecionar usuário filtra eventos;
* selecionar calendário filtra carga;
* selecionar cliente filtra reuniões;
* selecionar período filtra participantes;
* selecionar horário filtra conflitos;
* selecionar tipo filtra o grid.

Adicionar botão:

Limpar seleção

⸻

68. Drill-down

Exemplos:

* reuniões hoje → agenda;
* conflitos → eventos envolvidos;
* clientes → reuniões relacionadas;
* tempo ocupado → eventos;
* convites → central de respostas;
* calendário → eventos;
* erro de sincronização → logs.

Preservar filtros e contexto.

⸻

69. Direção visual

O módulo deverá possuir identidade premium.

69.1. Cores

Utilizar como referência:

* azul;
* vermelho;
* amarelo;
* verde;

presentes na identidade do Google Calendar, mas de forma moderada e integrada ao design system.

Não preencher toda a interface com várias cores fortes.

69.2. Aplicação

Usar cores em:

* ícone;
* calendários;
* eventos;
* estados;
* legendas;
* gráficos;
* destaques;
* badges.

69.3. Cards e superfícies

Utilizar:

* bordas discretas;
* sombras suaves;
* espaçamento consistente;
* tipografia clara;
* estados hover;
* microinterações;
* drag handles discretos.

⸻

70. Cores dos calendários

Preservar, quando possível:

* cores de origem;
* contraste;
* identificação do calendário.

Também permitir:

* cor personalizada local;
* modo daltônico;
* padrões ou ícones;
* legenda.

Não depender apenas da cor para diferenciar agendas.

⸻

71. Ícones

Utilizar uma única família principal, preferencialmente Lucide Icons.

Sugestões:

Área	Ícone
Minha Agenda	CalendarDays
Hoje	CalendarCheck
Equipe	Users
Reuniões	Video
Disponibilidade	Clock3
Conflitos	TriangleAlert
Foco	Focus
Fora do Escritório	Plane
Local de Trabalho	MapPin
Recursos	Building2
Convites	MailQuestion
Sincronização	RefreshCw
Alertas	BellRing
Configurações	Settings

Não utilizar emojis como ícones principais.

⸻

72. Estados da interface

Loading

* skeleton;
* agenda preservada;
* indicador local;
* sem bloquear a página inteira.

Sem dados

* mensagem contextual;
* ação;
* botão para criar evento;
* botão para conectar conta.

Erro

* mensagem amigável;
* nova tentativa;
* detalhes recolhíveis;
* correlation ID;
* horário.

Desatualizado

* última sincronização;
* motivo;
* botão atualizar;
* dados anteriores visíveis.

Mock

Exibir:

Ambiente de demonstração — os compromissos exibidos são simulados.

⸻

73. Mocks realistas

Criar cenários:

* agenda normal;
* dia muito ocupado;
* conflitos;
* múltiplas contas;
* convite pendente;
* reunião cancelada;
* evento recorrente;
* participante em outro fuso;
* conta desconectada;
* webhook expirado;
* sincronização atrasada;
* evento privado;
* recurso indisponível;
* sem compromissos.

Os mocks deverão preservar relações entre:

* evento;
* calendário;
* participante;
* conta;
* recorrência;
* cliente;
* negócio;
* recurso.

⸻

74. Segurança e permissões internas

Administrador

* contas;
* integrações;
* configurações;
* logs;
* auditoria;
* calendários corporativos autorizados.

Gestor

* própria agenda;
* equipe autorizada;
* disponibilidade;
* relatórios;
* conflitos.

Usuário

* próprias contas;
* próprios eventos;
* calendários compartilhados;
* criação e edição conforme permissão.

Somente leitura

* eventos e calendários permitidos;
* sem ações de escrita.

Técnico

* sincronização;
* canais;
* jobs;
* logs;
* sem acesso automático ao conteúdo privado.

⸻

75. Privacidade e LGPD

Aplicar:

* menor privilégio;
* minimização;
* mascaramento;
* controle de acesso;
* consentimento;
* retenção;
* revogação;
* auditoria;
* proteção de descrições e participantes.

75.1. Eventos privados

Não exibir:

* título;
* descrição;
* convidados;
* anexos;
* link;

quando a permissão permitir apenas visualizar livre ou ocupado.

75.2. Dados sensíveis

Evitar registrar em logs:

* descrições completas;
* e-mails desnecessários;
* links privados;
* tokens;
* anexos;
* informações confidenciais.

⸻

76. Auditoria

Registrar:

* usuário;
* conta;
* calendário;
* ação;
* evento;
* valor anterior;
* valor novo;
* data;
* hora;
* IP;
* origem;
* resultado;
* correlation ID.

Registrar especialmente:

* criação;
* edição;
* exclusão;
* convite;
* resposta;
* mudança de permissão;
* conexão;
* desconexão;
* exportação.

⸻

77. Performance

Implementar:

* cache;
* sincronização incremental;
* lazy loading;
* carregamento por período;
* virtualização;
* debounce;
* prefetch;
* cancelamento;
* jobs;
* filas;
* queries otimizadas.

Não carregar todo o histórico de todos os calendários ao abrir o módulo.

⸻

78. Observabilidade

Monitorar:

* OAuth;
* tokens;
* sincronizações;
* notificações push;
* canais;
* expirações;
* API;
* latência;
* erros;
* retries;
* eventos duplicados;
* dados desatualizados;
* calendário sem acesso.

Logs deverão conter:

* correlation ID;
* conta;
* calendário;
* operação;
* duração;
* status;
* tentativa;
* sync token mascarado;
* data;
* hora.

⸻

79. Responsividade

Desktop

* sub-sidebar;
* calendário completo;
* painel lateral de detalhes;
* filtros visíveis.

Notebook

* sidebar colapsável;
* painel de detalhes em drawer;
* controles compactos.

Tablet

* agenda diária e semanal;
* filtros em sheet;
* navegação adaptada.

Mobile

* agenda diária;
* lista;
* criação em tela cheia;
* bottom sheet;
* atalhos;
* swipe entre dias.

⸻

80. Acessibilidade

Implementar:

* navegação por teclado;
* foco visível;
* labels;
* ARIA;
* anúncio de alterações;
* contraste;
* eventos não diferenciados apenas por cor;
* suporte a redução de movimento;
* atalhos;
* leitores de tela.

Drag-and-drop deverá possuir alternativa por teclado.

⸻

81. Stack recomendada

* React;
* TypeScript;
* FullCalendar, Schedule-X ou equivalente aprovado;
* D3.js;
* Apache ECharts;
* AG Grid;
* TanStack Query;
* Zustand;
* React Hook Form;
* Zod;
* Radix UI;
* shadcn/ui;
* Lucide Icons;
* date-fns;
* Luxon ou abordagem equivalente para timezone;
* Framer Motion;
* TanStack Virtual;
* SDK oficial do Google no backend.

⸻

82. Fases de implementação

Fase 1 — Investigação

* Google Cloud;
* OAuth;
* escopos;
* tabelas;
* componentes;
* endpoints;
* Outlook;
* Pipedrive;
* home;
* segurança.

Fase 2 — Base visual e mocks

* botão na sidebar;
* ícone no header;
* shell;
* sub-sidebar;
* visualizações;
* formulário;
* eventos;
* participantes;
* convites;
* disponibilidade.

Fase 3 — UX avançada

* drag-and-drop;
* recorrência;
* conflitos;
* timezones;
* reuniões;
* recursos;
* widgets;
* responsividade.

Fase 4 — Backend

* OAuth;
* tokens;
* banco local;
* API interna;
* sincronização;
* jobs;
* cache;
* auditoria.

Fase 5 — Push e incremental

* watch channels;
* webhook;
* sync tokens;
* renovação;
* reconciliação;
* retries.

Fase 6 — Integrações internas

* Pipedrive;
* Outlook;
* clientes;
* fornecedores;
* home;
* notificações;
* tarefas.

Fase 7 — Analytics

* D3;
* ECharts;
* carga;
* disponibilidade;
* conflitos;
* relatórios.

Fase 8 — Homologação

* segurança;
* privacidade;
* performance;
* acessibilidade;
* timezones;
* recorrência;
* múltiplas contas;
* light e dark.

⸻

83. Critérios de aceite da investigação

A investigação estará concluída quando:

* projeto Google Cloud estiver identificado;
* APIs e credenciais estiverem mapeadas;
* escopos estiverem documentados;
* componentes existentes estiverem catalogados;
* tabelas estiverem identificadas;
* integrações relacionadas estiverem mapeadas;
* riscos estiverem descritos;
* arquitetura futura estiver aprovada.

⸻

84. Critérios de aceite visual

O módulo será visualmente aprovado quando:

* possuir identidade premium;
* seguir o design system;
* possuir sidebar expansível;
* oferecer visões diária, semanal, mensal e lista;
* funcionar em light e dark;
* possuir hierarquia clara;
* usar ícones consistentes;
* não possuir sobreposições;
* ser responsivo;
* mostrar estados de evento claramente;
* possuir preview e formulários refinados.

⸻

85. Critérios de aceite funcional

O módulo será funcionalmente aprovado quando:

* conectar conta Google;
* listar calendários;
* exibir eventos;
* criar evento;
* editar evento;
* excluir ou cancelar;
* responder convites;
* tratar recorrência;
* consultar disponibilidade;
* detectar conflitos;
* trabalhar com múltiplos calendários;
* atualizar o header e a home;
* preservar filtros;
* tratar erros parciais;
* respeitar permissões.

⸻

86. Critérios de aceite técnico

A integração estará tecnicamente preparada quando:

* OAuth estiver no backend;
* tokens estiverem protegidos;
* escopos forem mínimos;
* frontend não acessar credenciais;
* sincronização incremental estiver implementada;
* canais push forem renovados;
* eventos recorrentes forem tratados corretamente;
* IDs externos forem preservados;
* banco local estiver modelado;
* auditoria estiver ativa;
* erros possuírem correlation ID;
* mocks puderem ser substituídos sem reconstrução visual.

⸻

87. Orientação final ao agente

Não desenvolver o Google Calendar como apenas uma tabela de eventos ou um iframe da aplicação externa.

O resultado esperado é uma central completa de organização do tempo e dos compromissos do Dshow Dash.

O módulo deverá permitir responder rapidamente:

* Quais compromissos tenho hoje?
* Qual é minha próxima reunião?
* Quem ainda não respondeu?
* Onde existem conflitos?
* Quais horários estão livres?
* Qual cliente está relacionado à reunião?
* Qual negócio do Pipedrive está vinculado?
* Qual equipe está disponível?
* Quantas horas da semana estão ocupadas?
* Existem reuniões fora do expediente?
* A sincronização está funcionando?
* Quais contas ou calendários estão com erro?

A primeira versão com mocks já deverá parecer próxima de produção.

A conexão real com o Google deverá alterar principalmente:

* autenticação;
* adapters;
* serviços;
* sincronização;
* webhooks;
* persistência.

A navegação, os formulários, as visualizações, os grids e a experiência do usuário não deverão precisar ser reconstruídos quando os dados reais forem ativados.