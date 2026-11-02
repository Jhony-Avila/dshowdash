Integracao com o Outlook
Briefing Completo — Integração Outlook com o Dshow Dash

1. Visão geral do projeto

Desenvolver um módulo completo de e-mails dentro do Dshow Dash, integrado ao Outlook e ao Microsoft 365, permitindo que os usuários consultem, organizem, enviem e gerenciem suas mensagens sem precisar acessar diretamente o Outlook.

O módulo deverá combinar duas abordagens:

1. Experiência operacional semelhante ao Outlook, com caixa de entrada, pastas, mensagens, editor, anexos, categorias, regras e demais ações tradicionais.
2. Experiência gerencial e visual, com big numbers, indicadores, gráficos, filtros rápidos, acompanhamento de volume e informações de produtividade.

A aplicação deverá ser inicialmente disponibilizada apenas para o usuário principal, mas sua arquitetura deverá nascer preparada para aproximadamente 30 usuários, cada um podendo conectar uma ou mais contas.

⸻

2. Objetivos principais

O módulo deverá:

* centralizar a consulta de e-mails;
* reduzir a necessidade de abrir o Outlook;
* permitir o gerenciamento completo das mensagens;
* possibilitar o uso de várias contas por usuário;
* suportar contas corporativas e pessoais da Microsoft;
* suportar caixas compartilhadas;
* oferecer uma experiência visual superior ao Outlook tradicional;
* fornecer indicadores gerenciais;
* utilizar inteligência artificial para leitura e produção de mensagens;
* permitir envio individual e em massa;
* funcionar em desktop, tablet e celular;
* preparar a aplicação para futuras associações com clientes, propostas, negócios e demais registros do Dshow Dash.

⸻

3. Correções técnicas importantes

3.1 Registro no Microsoft Entra ID

Apesar da resposta inicial indicar que não seria utilizada uma aplicação registrada no Microsoft Entra ID, essa etapa será tecnicamente obrigatória.

Para que o Dshow Dash possa acessar e-mails por meio do Microsoft Graph, será necessário:

* registrar uma aplicação Microsoft;
* gerar um identificador da aplicação;
* configurar os endereços de redirecionamento OAuth;
* solicitar as permissões necessárias;
* receber tokens de acesso;
* renovar os tokens de acesso;
* armazenar os tokens com segurança;
* permitir que cada usuário autorize sua própria conta.

O Microsoft Graph exige um token emitido pela plataforma de identidade da Microsoft. Como os usuários farão a própria autenticação, o modelo principal deverá ser de permissões delegadas, no qual o Dshow Dash atua em nome do usuário conectado.  

A aplicação deverá ser configurada para aceitar:

* contas corporativas Microsoft 365;
* contas educacionais, quando aplicável;
* contas pessoais Microsoft e Outlook.com;
* usuários de diferentes organizações Microsoft.

Portanto, a configuração recomendada é uma aplicação multitenant, com suporte também a contas pessoais Microsoft.

3.2 Limite de anexos

A definição de anexos “ilimitados” não pode ser aplicada literalmente.

O Dshow Dash deverá respeitar:

* o limite da conta Microsoft;
* o limite da organização Microsoft 365;
* o limite do Microsoft Graph;
* o limite de recebimento do destinatário;
* as políticas de segurança da caixa postal.

Pelo Microsoft Graph, anexos entre 3 MB e 150 MB devem utilizar sessões de upload fragmentado. O limite documentado para anexar um arquivo diretamente a uma mensagem pelo Graph é de até 150 MB.  

Para arquivos superiores ao limite permitido, a aplicação deverá oferecer:

* upload para OneDrive;
* geração de link compartilhável;
* inserção automática do link no corpo da mensagem.

3.3 “Todas as funcionalidades do Outlook”

A aplicação deverá buscar alta paridade funcional, mas não deve prometer uma reprodução absoluta do Outlook.

Algumas funcionalidades poderão:

* não estar disponíveis no Microsoft Graph;
* depender do tipo de conta;
* depender de permissões administrativas;
* depender das políticas da organização;
* funcionar de forma diferente em contas pessoais;
* não estar disponíveis para caixas locais ou arquivos de arquivamento.

A API de e-mail do Microsoft Graph permite trabalhar com mensagens, pastas, rascunhos, respostas, encaminhamentos, movimentações e anexos, mas não representa necessariamente todos os recursos existentes nos aplicativos Outlook para desktop e web.  

⸻

4. Pontos de entrada no Dshow Dash

4.1 Ícone de e-mail no header

O ícone de envelope existente no header será o principal atalho para o módulo.

Comportamento principal

Ao clicar no ícone:

* carregar o módulo de e-mails no container-main;
* manter a sidebar e o header do Dshow Dash;
* marcar o item “E-mails” da sidebar como ativo;
* preservar o padrão de navegação SPA existente;
* atualizar a URL interna da aplicação;
* evitar abertura de nova aba ou redirecionamento externo.

Badge do ícone

O badge deverá exibir:

Quantidade total de e-mails recebidos no dia em todas as contas ativas do usuário.

Não deverá representar apenas mensagens não lidas.

Exemplos:

* 0: nenhum e-mail recebido hoje;
* 8: oito mensagens recebidas hoje;
* 99+: mais de 99 mensagens recebidas hoje.

Quando não houver mensagens, o badge deverá continuar visível mostrando 0.

Atualização do contador

O contador deverá ser atualizado:

* imediatamente ao carregar o Dshow Dash;
* a cada 60 segundos;
* após sincronização manual;
* após uma notificação recebida pelo backend;
* ao retornar para uma aba que estava inativa;
* depois que uma conta for conectada ou desconectada.

Tooltip

Ao posicionar o cursor sobre o ícone:

E-mails recebidos hoje: 12
4 mensagens não lidas
Última atualização: 15:42

4.2 Resumo rápido

Como o clique principal deverá abrir o módulo no container-main, o resumo rápido não deve substituir essa navegação.

O resumo poderá ser apresentado de uma destas formas:

* ao posicionar o cursor sobre o ícone por determinado tempo;
* por meio de um pequeno botão secundário junto ao ícone;
* como bloco inicial da home do módulo de e-mails.

A opção recomendada é apresentar o resumo no início da página de e-mails, evitando comportamento ambíguo no ícone.

O resumo deverá mostrar:

* e-mails recebidos hoje;
* mensagens não lidas;
* mensagens importantes;
* últimos e-mails recebidos;
* conta de origem;
* remetente;
* assunto;
* horário;
* presença de anexos;
* categoria;
* botão para atualizar.

4.3 Item na sidebar

Adicionar na sidebar:

* ícone de envelope;
* texto “E-mails”;
* badge opcional;
* indicação visual de item ativo;
* suporte a sidebar expandida e recolhida;
* tooltip quando a sidebar estiver recolhida.

Ao clicar, o módulo completo deverá ser carregado no container-main.

⸻

5. Estrutura principal do módulo

O módulo deverá trabalhar com duas áreas principais:

1. Central de E-mails
2. Dashboard de E-mails

Na parte superior, utilizar navegação interna por abas:

* E-mails;
* Dashboard;
* Modelos;
* Regras;
* Contas;
* Configurações.

Inicialmente, a aba padrão será E-mails.

⸻

6. Tela da Central de E-mails

6.1 Layout em três áreas

Coluna 1 — Contas e pastas

Deverá conter:

* botão “Novo e-mail”;
* seletor de contas;
* visualização consolidada;
* Caixa de Entrada;
* Favoritos;
* Não lidos;
* Rascunhos;
* Enviados;
* Agendados;
* Arquivados;
* Spam;
* Lixeira;
* todas as demais pastas;
* pastas personalizadas;
* grupos;
* caixas compartilhadas;
* categorias;
* gerenciamento de pastas.

Coluna 2 — Lista de mensagens

Cada mensagem deverá mostrar:

* avatar ou iniciais;
* remetente;
* assunto;
* trecho da mensagem;
* data ou horário;
* conta de origem;
* categoria;
* indicador de importância;
* indicador de não lido;
* indicador de anexo;
* indicador de resposta;
* indicador de agendamento;
* ações rápidas ao passar o cursor.

Coluna 3 — Painel de leitura

Deverá exibir:

* remetente;
* destinatários;
* CC e CCO;
* data e horário;
* assunto;
* conta utilizada;
* categorias;
* conteúdo completo;
* imagens;
* anexos;
* histórico da conversa;
* ações da mensagem;
* recursos de inteligência artificial.

6.2 Modos de visualização

Permitir alternância entre:

* três colunas;
* duas colunas;
* lista completa;
* painel de leitura à direita;
* painel de leitura inferior;
* mensagem em tela cheia;
* visualização por conversa;
* visualização por mensagens individuais;
* modo compacto;
* modo confortável.

A preferência de visualização deverá ser salva por usuário.

⸻

7. Seletor de contas

Cada usuário poderá conectar mais de uma conta.

O seletor deverá permitir:

* visualizar todas as contas;
* selecionar uma conta específica;
* selecionar várias contas;
* utilizar a opção “Todas as contas”;
* diferenciar contas por avatar e cor;
* identificar contas pessoais, corporativas e compartilhadas;
* visualizar estado de conexão;
* visualizar última sincronização;
* reconectar contas;
* desconectar contas;
* definir conta padrão de envio.

7.1 Caixa de entrada unificada

A opção Todas as contas deverá consolidar mensagens das contas autorizadas.

Cada mensagem deverá indicar claramente de qual conta veio.

O usuário deverá conseguir filtrar por:

* uma conta;
* várias contas;
* conta pessoal;
* conta corporativa;
* caixa compartilhada;
* todas as contas.

⸻

8. Autenticação das contas

8.1 Fluxo de conexão

1. Usuário acessa “Contas”.
2. Clica em “Conectar conta Microsoft”.
3. É redirecionado para a Microsoft.
4. Faz login.
5. Visualiza as permissões solicitadas.
6. Autoriza o Dshow Dash.
7. Retorna para o sistema.
8. A conta é validada.
9. O sistema carrega as informações básicas.
10. Pastas, categorias e mensagens tornam-se disponíveis.

8.2 Permissões delegadas

Avaliar a utilização das permissões mínimas necessárias, como:

* leitura e alteração de mensagens;
* envio de mensagens;
* acesso a caixas compartilhadas;
* acesso às configurações da caixa;
* acesso a arquivos do OneDrive;
* manutenção de acesso em segundo plano;
* identificação básica do usuário.

As permissões deverão seguir o princípio de menor privilégio. A Microsoft diferencia permissões delegadas, nas quais a aplicação atua em nome do usuário, e permissões de aplicação, nas quais o sistema atua com identidade própria. Para este projeto, o fluxo padrão será delegado.  

8.3 Tokens

O sistema deverá:

* criptografar tokens em repouso;
* nunca expor tokens no frontend;
* fazer renovação pelo backend;
* invalidar tokens ao desconectar uma conta;
* detectar consentimento revogado;
* solicitar nova autenticação quando necessário;
* não salvar senhas Microsoft.

Mesmo que a primeira versão não tenha uma tela administrativa de autenticação, o usuário precisa ser avisado quando a autorização expirar ou for revogada. Sem isso, a aplicação apenas pareceria estar com defeito.

⸻

9. Caixas compartilhadas

O módulo deverá suportar:

* caixas compartilhadas;
* pastas delegadas;
* envio como outra caixa;
* envio em nome de outra caixa;
* leitura e organização de mensagens compartilhadas.

O acesso continuará dependendo das permissões que aquele usuário possui na Microsoft.

Para leitura e alteração de mensagens compartilhadas, o Microsoft Graph oferece permissões delegadas específicas. Para enviar como uma caixa compartilhada, o usuário também precisa possuir a autorização correspondente na própria estrutura Microsoft, como “Enviar como” ou “Enviar em nome de”.  

O Dshow Dash não deverá conceder acesso a uma caixa compartilhada que o usuário não poderia acessar no Outlook.

⸻

10. Funcionalidades de mensagens

A primeira versão funcional deverá permitir:

* listar mensagens;
* abrir mensagem;
* criar mensagem;
* salvar rascunho;
* editar rascunho;
* enviar;
* responder;
* responder a todos;
* encaminhar;
* arquivar;
* excluir;
* mover;
* copiar;
* marcar como lido;
* marcar como não lido;
* favoritar;
* remover dos favoritos;
* alterar importância;
* aplicar categorias;
* remover categorias;
* aplicar múltiplas categorias;
* denunciar spam;
* mover para spam;
* recuperar da lixeira;
* imprimir;
* baixar anexos;
* visualizar cabeçalhos básicos;
* abrir conversa completa.

O Microsoft Graph oferece operações para criar e enviar rascunhos, responder, responder a todos, encaminhar, mover, copiar e excluir mensagens.  

10.1 Ações rápidas

Na lista, disponibilizar ações rápidas ao passar o cursor:

* marcar como lido ou não lido;
* arquivar;
* excluir;
* favoritar;
* sinalizar;
* abrir menu adicional.

10.2 Seleção em massa

Permitir selecionar várias mensagens e executar:

* marcar como lidas;
* marcar como não lidas;
* arquivar;
* excluir;
* mover;
* categorizar;
* marcar como importantes;
* remover importância;
* denunciar spam.

Antes de ações destrutivas em massa, solicitar confirmação.

⸻

11. Editor de e-mails

11.1 Recursos obrigatórios

O editor deverá oferecer:

* assunto;
* destinatários;
* CC;
* CCO;
* conta de envio;
* caixa compartilhada de envio;
* texto simples;
* HTML;
* negrito;
* itálico;
* sublinhado;
* tachado;
* tamanho da fonte;
* alinhamento;
* listas;
* recuo;
* links;
* tabelas;
* imagens no corpo;
* anexos;
* prioridade;
* categorias;
* modelos;
* campos dinâmicos;
* salvamento automático;
* expansão em tela cheia;
* agendamento;
* recursos de IA.

11.2 Biblioteca de editor

Utilizar um editor robusto, como:

* TipTap;
* CKEditor;
* TinyMCE;
* Lexical.

A escolha deverá considerar:

* suporte a HTML;
* colagem vinda do Word;
* tabelas;
* imagens inline;
* acessibilidade;
* extensibilidade;
* segurança contra HTML malicioso;
* compatibilidade mobile.

11.3 Salvamento automático

O conteúdo deverá ser salvo automaticamente como rascunho:

* após alguns segundos de inatividade;
* ao alterar destinatários;
* ao adicionar anexos;
* antes de fechar o editor;
* ao trocar de módulo.

Exibir estados:

* Salvando;
* Salvo;
* Não foi possível salvar;
* Alterações pendentes.

⸻

12. Confirmações operacionais

12.1 Envio

Antes de enviar, validar:

* existência de assunto;
* existência de destinatário;
* validade dos endereços;
* anexos ainda em upload;
* menção a anexos sem arquivo anexado;
* número elevado de destinatários;
* uso de CCO em envio em massa;
* destinatários duplicados;
* destinatários externos;
* tamanho dos anexos;
* presença de conteúdo.

12.2 Exclusão

Ao excluir:

* abrir confirmação;
* informar quantidade de mensagens;
* mover para a lixeira real do Outlook;
* oferecer ação “Desfazer” por alguns segundos.

12.3 Movimentação

Ao mover uma ou várias mensagens:

* apresentar seletor de pasta;
* confirmar quando a operação envolver muitas mensagens;
* mostrar toast de conclusão;
* permitir desfazer quando tecnicamente possível.

⸻

13. Agendamento de envio

O usuário poderá programar uma mensagem para data e horário futuros.

A interface deverá permitir:

* data;
* horário;
* fuso horário;
* sugestões rápidas;
* revisão antes do agendamento;
* edição do agendamento;
* cancelamento;
* envio imediato;
* listagem na pasta “Agendados”.

13.1 Implementação

O agendamento deverá ser controlado pelo backend do Dshow Dash:

1. criar um rascunho no Outlook;
2. registrar o agendamento no banco local;
3. executar um job no horário definido;
4. revalidar a conta e o rascunho;
5. enviar pelo Microsoft Graph;
6. registrar o resultado técnico;
7. comunicar erro ao usuário.

Campos necessários:

* usuário;
* conta;
* identificador do rascunho;
* data programada;
* fuso horário;
* status;
* tentativas;
* erro;
* data de envio;
* data de cancelamento.

Status:

* agendado;
* processando;
* enviado;
* cancelado;
* falhou;
* requer autenticação.

⸻

14. Pastas

O sistema deverá carregar:

* pastas padrão;
* pastas personalizadas;
* subpastas;
* pastas ocultas apenas quando necessárias;
* contadores totais;
* contadores de não lidos.

O usuário poderá:

* criar;
* renomear;
* mover;
* excluir;
* expandir;
* recolher;
* favoritar pastas.

O Microsoft Graph oferece operações de criação, atualização, movimentação e exclusão de pastas, além do acompanhamento incremental de alterações.  

14.1 Árvore hierárquica

As pastas deverão ser exibidas em árvore:

Caixa de Entrada
├── Clientes
│   ├── Ativos
│   └── Prospecção
├── Fornecedores
└── Financeiro

Aplicar:

* expansão por níveis;
* drag-and-drop;
* menu contextual;
* contadores;
* loading por demanda;
* destaque da pasta ativa.

⸻

15. Categorias e cores

As categorias do Outlook deverão ser sincronizadas.

O usuário poderá:

* visualizar categorias;
* criar categoria;
* alterar cor;
* excluir categoria;
* aplicar várias categorias;
* filtrar mensagens por categoria.

O Microsoft Graph permite trabalhar com uma lista principal de categorias e aplicar múltiplas categorias às mensagens. As cores disponíveis são baseadas no conjunto predefinido pelo Outlook.  

15.1 Limitação de renomeação

Como o nome de uma categoria existente não é diretamente editável pelo recurso documentado, uma ação de “renomear” poderá precisar:

1. criar nova categoria;
2. aplicar a nova categoria às mensagens pertinentes;
3. remover a categoria anterior;
4. excluir a categoria antiga.

Esse comportamento deverá ser tratado pela camada de serviço.

⸻

16. Regras automáticas

Criar área “Regras” com possibilidade de:

* listar regras;
* ativar;
* desativar;
* criar;
* editar;
* excluir;
* reordenar;
* testar condições;
* visualizar regras com erro.

Condições possíveis:

* remetente;
* destinatário;
* assunto contém;
* corpo contém;
* importância;
* presença de anexo;
* endereço contém;
* categoria;
* palavras específicas.

Ações possíveis:

* mover para pasta;
* copiar para pasta;
* marcar como lida;
* atribuir categoria;
* encaminhar;
* redirecionar;
* excluir;
* interromper processamento de outras regras.

As regras acessíveis pelo Microsoft Graph são regras aplicadas às mensagens recebidas na Caixa de Entrada.  

Não prometer compatibilidade com todo tipo de regra avançada disponível no Outlook desktop.

⸻

17. Pesquisa

17.1 Pesquisa global

A pesquisa deverá consultar os e-mails disponíveis na caixa Microsoft, e não apenas registros locais do Dshow Dash.

Campos:

* remetente;
* destinatário;
* CC;
* CCO;
* assunto;
* conteúdo;
* nome de anexo;
* endereço de e-mail.

17.2 Filtros avançados

Disponibilizar:

* conta;
* pasta;
* remetente;
* destinatário;
* assunto;
* texto;
* data inicial;
* data final;
* lido;
* não lido;
* com anexo;
* sem anexo;
* categoria;
* prioridade;
* favorito;
* enviado;
* recebido.

17.3 Filtros rápidos

Criar chips:

* Não lidos;
* Hoje;
* Esta semana;
* Com anexos;
* Importantes;
* Enviados por mim;
* Aguardando resposta.

O filtro “Aguardando resposta” será inicialmente baseado em heurística e poderá ter precisão limitada. A evolução por IA ficará em fase posterior.

17.4 Paginação

Não carregar toda a caixa de uma vez.

Utilizar:

* paginação progressiva;
* scroll virtualizado;
* carregamento incremental;
* cache temporário da navegação;
* cancelamento de requisições antigas;
* skeleton loading.

⸻

18. Sincronização

18.1 Estratégia

Os conteúdos dos e-mails permanecerão na Microsoft.

O Dshow Dash deverá armazenar somente o necessário para:

* contas conectadas;
* tokens criptografados;
* preferências;
* estado de sincronização;
* identificadores técnicos;
* indicadores agregados;
* agendamentos;
* modelos;
* filas;
* erros;
* cache temporário.

18.2 Tempo real

A sincronização recomendada deverá combinar:

1. notificações de alterações do Microsoft Graph;
2. consultas delta;
3. atualização periódica de segurança;
4. atualização manual.

As notificações informam que houve uma mudança, enquanto a consulta delta permite recuperar alterações incrementais desde o último estado conhecido. A própria Microsoft recomenda a combinação dessas estratégias para reduzir polling e diminuir risco de throttling.  

18.3 Assinaturas de notificações

O backend deverá:

* criar subscriptions;
* manter endpoint de webhook;
* validar notificações;
* validar clientState;
* renovar subscriptions antes do vencimento;
* detectar subscriptions removidas;
* tratar notificações perdidas;
* recriar subscriptions;
* executar reconciliação delta.

As subscriptions possuem validade limitada e precisam ser renovadas. O Graph também oferece eventos de ciclo de vida para situações como reautorização, remoção da subscription e notificações perdidas.  

18.4 Atualização a cada minuto

O frontend poderá atualizar indicadores a cada minuto, mas não deverá consultar todo o histórico novamente.

Deverá buscar apenas:

* novos contadores;
* novos eventos;
* mudanças incrementais;
* estado da conexão;
* novos avisos.

18.5 Todo o histórico

“Todo o histórico” significa disponibilizar o histórico que a API e a conta Microsoft permitirem consultar.

A aplicação não deverá copiar todo o histórico para o banco local.

O carregamento será sob demanda:

* mensagens recentes primeiro;
* mensagens antigas por paginação;
* busca direta na Microsoft;
* cache apenas temporário.

A API não oferece acesso a caixas de arquivamento in-place da mesma forma que à caixa principal. Portanto, mensagens mantidas exclusivamente nesse tipo de arquivo poderão não estar disponíveis.  

⸻

19. Tela de indisponibilidade

Quando a Microsoft estiver indisponível ou a autenticação falhar, apresentar estado específico dentro do container-main.

19.1 Mensagem sugerida

Não foi possível acessar seus e-mails

No momento, não conseguimos estabelecer comunicação com a Microsoft.

* Verifique sua conexão;
* tente atualizar;
* consulte a última sincronização;
* reconecte a conta quando solicitado.

Botões:

* Tentar novamente;
* Atualizar sincronização;
* Ver contas;
* Reconectar conta.

19.2 Tipos de erro

Diferenciar:

* sem internet;
* Microsoft indisponível;
* token expirado;
* consentimento revogado;
* falta de permissão;
* caixa não encontrada;
* limite de requisições;
* erro temporário;
* erro interno.

Não apresentar códigos técnicos brutos ao usuário.

⸻

20. Anexos

20.1 Envio

Permitir:

* drag-and-drop;
* seleção de arquivos;
* copiar e colar;
* anexar do dispositivo;
* anexar do OneDrive;
* anexar do Google Drive;
* inserir como link;
* inserir imagem no corpo.

20.2 Segurança

Embora o usuário tenha solicitado todos os formatos, a aplicação deverá bloquear ou alertar para formatos potencialmente perigosos.

Categorias de maior risco:

* executáveis;
* scripts;
* instaladores;
* arquivos de comando;
* arquivos com dupla extensão;
* arquivos protegidos que não possam ser verificados.

Aplicar:

* validação de extensão;
* validação MIME;
* validação de tamanho;
* nome seguro;
* antivírus quando o arquivo transitar pelo servidor;
* bloqueio de execução no navegador;
* download com cabeçalhos seguros.

20.3 Armazenamento

Os anexos não deverão ser armazenados permanentemente no servidor do Dshow Dash.

Fluxo:

1. usuário seleciona arquivo;
2. backend cria sessão de upload;
3. arquivo é enviado à Microsoft;
4. backend descarta dados temporários;
5. anexo permanece no Outlook.

20.4 Pré-visualização

Oferecer preview para:

* imagens;
* PDF;
* texto;
* áudio e vídeo compatíveis;
* arquivos Office quando houver suporte do visualizador;
* arquivos do OneDrive.

Para formatos não suportados:

* mostrar metadados;
* nome;
* tamanho;
* tipo;
* botão para download;
* aviso de segurança.

⸻

21. Integração com OneDrive e Google Drive

21.1 OneDrive

Disponibilizar:

* seletor de arquivos;
* upload;
* geração de link;
* definição de acesso;
* inserção no corpo;
* anexação quando o tamanho permitir.

21.2 Google Drive

A integração com Google Drive será independente da Microsoft e exigirá:

* projeto Google Cloud;
* OAuth Google;
* permissões de arquivos;
* seletor do Google Drive;
* controle de compartilhamento.

Por aumentar significativamente o escopo de autenticação e manutenção, o Google Drive deverá ficar em fase posterior.

⸻

22. Modelos de e-mail

Criar uma área específica para modelos.

22.1 Categorias iniciais

* Propostas;
* Cobrança;
* Acompanhamento comercial;
* Confirmação de pedido;
* Solicitação de documentos;
* Atendimento;
* Compras;
* Financeiro;
* Geral.

22.2 Funcionalidades

Todos os usuários poderão:

* criar;
* editar;
* duplicar;
* excluir;
* favoritar;
* pesquisar;
* categorizar;
* utilizar modelos.

22.3 Campos dinâmicos

Preparar suporte a:

{{nome_cliente}}
{{nome_contato}}
{{nome_usuario}}
{{email_usuario}}
{{nome_vendedor}}
{{numero_proposta}}
{{valor_proposta}}
{{data_atual}}
{{empresa}}
{{telefone}}

Como a integração com registros do Dshow Dash não fará parte da primeira etapa, campos relacionados a clientes e propostas deverão permanecer preparados, mas somente serão preenchidos automaticamente após a integração futura.

Na primeira versão, poderão ser:

* preenchidos manualmente;
* solicitados em um formulário;
* substituídos a partir de dados básicos do destinatário.

⸻

23. Envio em massa

O módulo poderá permitir envio em massa, mas essa funcionalidade deverá ser tratada separadamente do editor comum.

23.1 Regras

* utilizar CCO quando adequado;
* evitar exposição dos destinatários;
* validar duplicidades;
* validar endereços;
* permitir lista de destinatários;
* apresentar contagem;
* exigir confirmação;
* informar conta de envio;
* informar riscos de bloqueio;
* respeitar limites e políticas da Microsoft;
* mostrar progresso;
* mostrar sucessos e falhas;
* permitir exportar relatório.

23.2 Restrições

A ausência de um limite diário próprio não elimina os limites da Microsoft.

O Dshow Dash deverá:

* respeitar throttling;
* aplicar filas;
* processar em lotes;
* implementar retentativas;
* usar backoff progressivo;
* interromper processamento em caso de bloqueio;
* evitar várias solicitações simultâneas desnecessárias.

O Microsoft Graph aplica limites por serviço e pode devolver respostas de throttling. Há também limites de concorrência e volume de upload que precisam ser considerados na arquitetura.  

O recurso não deverá ser tratado como plataforma de marketing ou disparo de campanhas. Campanhas em grande escala devem utilizar uma plataforma dedicada.

⸻

24. Dashboard gerencial

24.1 Big numbers

Exibir:

* recebidos hoje;
* enviados hoje;
* não lidos;
* importantes;
* aguardando resposta;
* anexos recebidos;
* média de mensagens por dia;
* tempo médio de resposta.

Cada card deverá mostrar:

* valor principal;
* ícone;
* descrição;
* tendência;
* mini gráfico;
* tooltip;
* ação para aplicar filtro.

24.2 Gráficos

Criar:

Evolução por período

* recebidos;
* enviados;
* respondidos;
* não lidos.

Distribuição por conta

* volume por conta conectada;
* participação percentual.

Volume por horário

* heatmap por dia e hora;
* horários de maior recebimento.

Principais contatos

* remetentes mais frequentes;
* destinatários mais frequentes;
* volume de conversas.

Anexos

* quantidade;
* tipos mais recebidos;
* volume estimado;
* mensagens com anexo.

Status das mensagens

* lidas;
* não lidas;
* importantes;
* arquivadas;
* aguardando resposta.

24.3 Rankings

Na primeira versão individual, rankings poderão mostrar:

* contatos mais frequentes;
* assuntos mais recorrentes;
* contas com maior volume;
* domínios mais frequentes.

Rankings entre usuários e departamentos ficarão para uma fase posterior.

24.4 Períodos

Filtros:

* hoje;
* ontem;
* últimos 7 dias;
* últimos 30 dias;
* este mês;
* período personalizado.

⸻

25. Inteligência artificial

A IA deverá funcionar como assistente, sem enviar ou alterar mensagens sem confirmação.

25.1 Recursos no painel de leitura

* resumir mensagem;
* resumir conversa;
* identificar pontos principais;
* extrair datas;
* extrair valores;
* extrair solicitações;
* sugerir tarefas;
* identificar urgência;
* classificar assunto;
* analisar tom;
* traduzir;
* sugerir resposta.

25.2 Recursos no editor

* escrever resposta;
* melhorar texto;
* corrigir gramática;
* tornar mais formal;
* tornar mais direto;
* tornar mais cordial;
* encurtar;
* expandir;
* traduzir;
* criar assunto;
* gerar resposta com base na conversa;
* gerar resposta com base em um modelo.

25.3 Aprovação

A IA poderá sugerir conteúdo completo, mas deverá sempre apresentar:

* pré-visualização;
* botão “Inserir no editor”;
* botão “Substituir texto”;
* botão “Tentar novamente”;
* botão “Descartar”.

A IA nunca deverá enviar automaticamente.

25.4 Base interna de conhecimento

O uso de e-mails para alimentar bases internas deverá ser implementado apenas com:

* autorização clara;
* regras de acesso;
* isolamento por usuário;
* proteção de dados;
* opção de desativação;
* política de retenção;
* remoção de conteúdo sensível;
* controle de quais mensagens são utilizadas.

Esse recurso deve ficar para uma fase avançada, e não ser ativado indiscriminadamente no MVP.

⸻

26. Permissões e privacidade

26.1 Perfil inicial

Na primeira versão:

* existe apenas o usuário comum;
* cada usuário acessa somente as contas que autorizou;
* gestores acessam somente as próprias contas;
* diretoria acessa somente as próprias contas;
* não haverá acesso administrativo ao conteúdo dos e-mails;
* não haverá leitura cruzada de caixas.

26.2 Decisão sobre administradores

Como a pergunta sobre administradores não foi respondida, fica definida a seguinte regra:

Administradores do Dshow Dash poderão administrar a disponibilidade do módulo, mas não poderão visualizar o conteúdo das contas conectadas por outros usuários.

Em uma futura tela administrativa, poderão ser mostrados somente metadados:

* usuário;
* quantidade de contas;
* status;
* tipo;
* data da última sincronização;
* erro de conexão.

Não mostrar:

* assunto;
* remetente;
* corpo;
* anexos;
* destinatários.

26.3 Logs

Embora não tenha sido solicitado um histórico funcional detalhado, deverão existir logs técnicos mínimos para segurança e diagnóstico:

* conexão de conta;
* desconexão;
* falha OAuth;
* falha de sincronização;
* falha de envio;
* execução de agendamento;
* erro de webhook;
* erro de upload.

Não será necessário, inicialmente, registrar cada leitura ou cada download feito pelo usuário.

⸻

27. Arquitetura sugerida

27.1 Componentes

Frontend

* módulo SPA de e-mails;
* central de mensagens;
* dashboard;
* editor;
* seletor de contas;
* visualizador de anexos;
* configurações;
* integração com IA.

Backend

* serviço OAuth Microsoft;
* cliente Microsoft Graph;
* gerenciador de tokens;
* serviço de mensagens;
* serviço de pastas;
* serviço de categorias;
* serviço de regras;
* serviço de anexos;
* serviço de busca;
* serviço de notificações;
* serviço de agendamento;
* serviço de métricas;
* serviço de IA.

Processamento assíncrono

* fila de agendamentos;
* renovação de subscriptions;
* sincronização incremental;
* atualização de contadores;
* retentativas;
* envio em massa;
* geração de métricas.

27.2 Fluxo simplificado

Usuário
   ↓
Frontend Dshow Dash
   ↓
API interna do Dshow Dash
   ↓
Serviço Outlook
   ↓
Microsoft Identity Platform
   ↓
Microsoft Graph
   ↓
Outlook / Microsoft 365

O frontend não deverá chamar o Microsoft Graph diretamente com tokens persistentes.

⸻

28. Estrutura de banco de dados sugerida

Mesmo sem armazenar os corpos dos e-mails, será necessário armazenar configurações e estados operacionais.

28.1 outlook_accounts

id
user_id
provider
microsoft_account_id
tenant_id
email
display_name
account_type
is_default
is_active
connection_status
token_encrypted
refresh_token_encrypted
token_expires_at
last_sync_at
last_success_at
last_error_code
last_error_message
created_at
updated_at
disconnected_at

28.2 outlook_account_mailboxes

id
outlook_account_id
mailbox_id
mailbox_email
display_name
mailbox_type
can_read
can_write
can_send_as
can_send_on_behalf
is_active
created_at
updated_at

28.3 outlook_sync_states

id
outlook_account_id
mailbox_id
folder_id
delta_link_encrypted
next_link_encrypted
last_delta_at
last_full_check_at
sync_status
retry_count
last_error
updated_at

28.4 outlook_subscriptions

id
outlook_account_id
resource
subscription_id
client_state_encrypted
expires_at
status
last_notification_at
last_renewal_at
last_error
created_at
updated_at

28.5 outlook_scheduled_messages

id
user_id
outlook_account_id
mailbox_id
draft_message_id
scheduled_at_utc
user_timezone
status
attempt_count
last_attempt_at
sent_at
cancelled_at
last_error
created_at
updated_at

28.6 outlook_templates

id
user_id
name
category
subject_template
body_html
body_text
dynamic_fields_json
is_favorite
is_active
created_at
updated_at
deleted_at

28.7 outlook_user_preferences

id
user_id
default_account_id
layout_mode
reading_pane_position
density
conversation_view
notifications_enabled
toast_enabled
badge_enabled
refresh_interval
dashboard_period
created_at
updated_at

28.8 outlook_daily_metrics

id
user_id
outlook_account_id
metric_date
received_count
sent_count
unread_count
important_count
attachment_count
reply_count
average_response_seconds
calculated_at

28.9 outlook_mass_send_jobs

id
user_id
outlook_account_id
subject
draft_message_id
recipient_count
processed_count
success_count
failure_count
status
started_at
finished_at
created_at

28.10 outlook_technical_logs

id
user_id
outlook_account_id
event_type
severity
request_reference
error_code
message
metadata_json
created_at

⸻

29. APIs internas sugeridas

Contas

GET    /api/outlook/accounts
POST   /api/outlook/accounts/connect
GET    /api/outlook/accounts/callback
PATCH  /api/outlook/accounts/{id}
DELETE /api/outlook/accounts/{id}
POST   /api/outlook/accounts/{id}/reconnect
POST   /api/outlook/accounts/{id}/sync

Pastas

GET    /api/outlook/accounts/{id}/folders
POST   /api/outlook/accounts/{id}/folders
PATCH  /api/outlook/accounts/{id}/folders/{folderId}
DELETE /api/outlook/accounts/{id}/folders/{folderId}
POST   /api/outlook/accounts/{id}/folders/{folderId}/move

Mensagens

GET    /api/outlook/messages
GET    /api/outlook/messages/{id}
POST   /api/outlook/messages/drafts
PATCH  /api/outlook/messages/{id}
DELETE /api/outlook/messages/{id}
POST   /api/outlook/messages/{id}/send
POST   /api/outlook/messages/{id}/reply
POST   /api/outlook/messages/{id}/reply-all
POST   /api/outlook/messages/{id}/forward
POST   /api/outlook/messages/{id}/move
POST   /api/outlook/messages/{id}/copy
POST   /api/outlook/messages/bulk-action

Anexos

GET    /api/outlook/messages/{id}/attachments
GET    /api/outlook/messages/{id}/attachments/{attachmentId}
POST   /api/outlook/drafts/{id}/attachments
POST   /api/outlook/drafts/{id}/attachments/upload-session
DELETE /api/outlook/drafts/{id}/attachments/{attachmentId}

Categorias

GET    /api/outlook/categories
POST   /api/outlook/categories
PATCH  /api/outlook/categories/{id}
DELETE /api/outlook/categories/{id}

Regras

GET    /api/outlook/rules
POST   /api/outlook/rules
PATCH  /api/outlook/rules/{id}
DELETE /api/outlook/rules/{id}

Dashboard

GET /api/outlook/dashboard/summary
GET /api/outlook/dashboard/timeline
GET /api/outlook/dashboard/contacts
GET /api/outlook/dashboard/accounts
GET /api/outlook/dashboard/heatmap
GET /api/outlook/header-counter

IA

POST /api/outlook/ai/summarize
POST /api/outlook/ai/suggest-reply
POST /api/outlook/ai/rewrite
POST /api/outlook/ai/translate
POST /api/outlook/ai/extract
POST /api/outlook/ai/classify

⸻

30. Estado visual e design

30.1 Direção visual

O módulo deverá manter identidade do Dshow Dash, mas apresentar qualidade visual comparável a produtos SaaS modernos.

Utilizar:

* cards com hierarquia clara;
* cores funcionais;
* ícones consistentes;
* tipografia legível;
* espaçamento uniforme;
* divisórias discretas;
* estados de hover;
* skeletons;
* tooltips;
* menus contextuais;
* empty states;
* microinterações;
* transições rápidas;
* suporte a modo claro e escuro.

30.2 Cores funcionais

* azul: mensagens e ações principais;
* verde: enviado, conectado e sucesso;
* amarelo: atenção, agendado e aguardando;
* vermelho: erro, desconectado, spam e exclusão;
* roxo: inteligência artificial;
* cinza: arquivado, inativo ou informação secundária.

30.3 Ícones

Sugestões:

* Lucide Icons;
* Phosphor Icons;
* Material Symbols.

Não misturar diferentes famílias de ícones na mesma tela.

30.4 Bibliotecas de gráficos

Sugestões compatíveis com dashboard gerencial:

* Apache ECharts;
* Chart.js;
* ApexCharts.

Como o Dshow Dash já utiliza Chart.js, a primeira preferência deverá ser manter a biblioteca atual, desde que ela atenda ao nível visual esperado.

⸻

31. Responsividade

Desktop

* três colunas;
* dashboard completo;
* painel de leitura fixo;
* ações em barra superior.

Tablet

* duas colunas;
* menu de pastas recolhível;
* leitura em painel sobreposto;
* editor em tela cheia.

Celular

* navegação em telas sequenciais;
* conta e pasta;
* lista;
* mensagem;
* editor;
* ações em menu inferior;
* filtros em bottom sheet.

Não tentar comprimir as três colunas no celular.

⸻

32. Desempenho

Metas sugeridas

* carregamento inicial visual abaixo de 2 segundos em condições normais;
* abertura de mensagem com feedback imediato;
* busca com estado de processamento;
* listas virtualizadas;
* nenhuma tentativa de carregar todo o histórico;
* dashboard com cache;
* atualização do contador sem recarregar o módulo;
* operações otimistas com reversão em caso de erro.

Throttling

Implementar:

* fila por conta;
* limitação de concorrência;
* retry com backoff;
* respeito ao cabeçalho Retry-After;
* cache de pastas e categorias;
* deduplicação de requisições;
* cancelamento de buscas antigas.

⸻

33. Fases do projeto

Fase 0 — Fundação técnica

Obrigatória antes da interface completa.

Entregas

* registro da aplicação Microsoft;
* configuração multitenant;
* OAuth;
* conexão e desconexão;
* armazenamento criptografado;
* cliente Microsoft Graph;
* estrutura de banco;
* tratamento de erros;
* uma conta por usuário inicialmente;
* prova de leitura e envio;
* prova com conta pessoal e corporativa.

Critério de conclusão

O usuário conecta uma conta, lista mensagens, abre uma mensagem e envia uma mensagem de teste.

⸻

Fase 1 — MVP operacional

Contas

* múltiplas contas;
* seletor de contas;
* conta padrão;
* estado de conexão;
* sincronização manual;
* última sincronização.

Mensagens

* Caixa de Entrada;
* Enviados;
* Rascunhos;
* Lixeira;
* Spam;
* leitura;
* envio;
* resposta;
* responder a todos;
* encaminhamento;
* exclusão;
* arquivamento;
* mover;
* marcar como lido;
* marcar como não lido;
* favorito;
* importância.

Editor

* HTML;
* CC;
* CCO;
* links;
* imagens;
* tabelas;
* anexos;
* salvamento automático;
* validação de assunto;
* detecção de menção a anexo.

Navegação

* ícone no header;
* badge recebido hoje;
* item na sidebar;
* carregamento no container-main;
* layout responsivo;
* busca básica;
* filtros rápidos.

Notificações

* toast;
* atualização do badge;
* opção de desativar;
* atualização a cada minuto.

⸻

Fase 2 — Organização avançada e dashboard

Organização

* todas as pastas;
* subpastas;
* criação;
* edição;
* movimentação;
* exclusão;
* categorias;
* múltiplas categorias;
* cores;
* ações em massa;
* busca avançada.

Dashboard

* big numbers;
* gráficos;
* heatmap;
* contatos frequentes;
* volume por conta;
* anexos;
* evolução por período.

Modelos

* criação;
* edição;
* exclusão;
* duplicação;
* categorias;
* campos dinâmicos básicos.

Agendamento

* fila;
* tela de agendados;
* edição;
* cancelamento;
* retentativas;
* relatórios de falha.

⸻

Fase 3 — Recursos avançados

* caixas compartilhadas;
* enviar como;
* enviar em nome de;
* regras automáticas;
* preview avançado de anexos;
* integração OneDrive;
* grupos de destinatários;
* envio em massa;
* relatórios de envio;
* dashboard gerencial mais completo;
* modos avançados de visualização;
* sincronização por webhooks e delta plenamente resiliente.

⸻

Fase 4 — Inteligência artificial

* resumo;
* sugestão de resposta;
* reescrita;
* mudança de tom;
* tradução;
* classificação;
* urgência;
* extração de tarefas;
* identificação de datas;
* modelos assistidos;
* resposta baseada no histórico da conversa.

A IA deverá entrar após a operação tradicional estar estável.

⸻

Fase 5 — Integração com o ecossistema Dshow Dash

* associação a clientes;
* associação a organizações;
* associação a pessoas;
* associação a leads;
* associação a oportunidades;
* associação a propostas;
* associação a orçamentos;
* associação a pedidos;
* associação a fornecedores;
* histórico dentro do cadastro do cliente;
* envio de propostas pelo módulo;
* criação de tarefas;
* transformação de e-mail em lead ou chamado;
* rastreamento de abertura;
* rastreamento de cliques;
* indicadores por usuário e departamento;
* alertas de mensagens sem resposta.

⸻

Fase 6 — Expansões futuras

* Google Drive;
* assinatura institucional;
* assinaturas individuais;
* base interna de conhecimento;
* análise de sentimento;
* previsão de necessidade de resposta;
* priorização automática;
* comparação entre equipes;
* auditoria avançada;
* políticas administrativas;
* retenção;
* DLP;
* integração com calendário;
* integração com contatos;
* integração com Microsoft Teams.

⸻

34. Funcionalidades que não devem entrar no MVP

Para não comprometer a estabilidade da primeira versão, deixar fora do MVP:

* integração com Google Drive;
* envio em massa;
* IA completa;
* base de conhecimento;
* rastreamento de abertura;
* rastreamento de clique;
* associação com clientes;
* associação com propostas;
* métricas entre usuários;
* acesso administrativo a caixas;
* assinaturas institucionais;
* regras muito avançadas;
* comparação entre departamentos;
* automações comerciais.

Isso não significa retirar essas funcionalidades do projeto, mas organizá-las em fases para evitar que autenticação, envio e sincronização sejam construídos simultaneamente com funcionalidades de alta complexidade.

⸻

35. Critérios de aceite

Navegação

* o ícone de e-mail abre o módulo no container-main;
* o item “E-mails” aparece na sidebar;
* o item ativo é corretamente destacado;
* o módulo não recarrega toda a página;
* voltar e avançar no navegador funcionam.

Contador

* mostra mensagens recebidas no dia;
* consolida contas ativas;
* atualiza a cada minuto;
* mostra zero;
* não conta mensagens enviadas;
* respeita o fuso horário do usuário.

Autenticação

* permite conectar conta;
* permite desconectar;
* não armazena senha;
* tokens ficam criptografados;
* erro de autorização é compreensível;
* uma conta não acessa dados de outra.

Mensagens

* lista;
* abre;
* cria;
* envia;
* responde;
* encaminha;
* exclui para a lixeira do Outlook;
* arquiva;
* move;
* marca lida e não lida;
* mantém consistência com o Outlook.

Editor

* impede envio sem assunto;
* detecta destinatário inválido;
* alerta sobre anexo mencionado;
* salva rascunho;
* permite CC e CCO;
* permite anexos;
* permite imagens e tabelas;
* confirma envio para muitos destinatários.

Sincronização

* alterações no Dshow Dash aparecem no Outlook;
* alterações no Outlook aparecem no Dshow Dash;
* última sincronização é exibida;
* botão de atualização funciona;
* erros não apagam dados;
* reconexão é possível.

Segurança

* usuário acessa apenas as próprias contas;
* tokens não aparecem no frontend;
* anexos perigosos são tratados;
* HTML é sanitizado;
* requisições são autorizadas;
* callbacks OAuth são validados.

Responsividade

* funciona em desktop;
* funciona em tablet;
* funciona em celular;
* editor permanece utilizável;
* listas não transbordam;
* menus continuam acessíveis.

⸻

36. Resultado esperado

Ao final do projeto, o Dshow Dash deverá possuir uma central de e-mails própria que:

* substitua grande parte do uso diário do Outlook;
* mantenha os dados sincronizados com a Microsoft;
* permita várias contas;
* ofereça experiência moderna;
* apresente indicadores gerenciais;
* suporte automações futuras;
* incorpore inteligência artificial;
* preserve a privacidade de cada usuário;
* esteja preparada para se integrar aos módulos comerciais e gerenciais do Dshow Dash.

A primeira prioridade deverá ser garantir uma base sólida de autenticação, leitura, envio, sincronização e segurança. A evolução gerencial, visual e inteligente deverá ser adicionada em camadas, sem comprometer a confiabilidade das operações de e-mail.