BRIEFING COMPLETO DE CORREÇÕES VISUAIS, UX E UI

Header — Trânsito no modo light, Ads Intelligence e painel Geral

1. Objetivo deste briefing

Realizar uma correção visual e estrutural em três pontos específicos do Dshow Dash:

1. corrigir o componente de Trânsito localizado no header quando o sistema estiver no modo light;
2. transformar a navegação lateral interna do Ads Intelligence em uma sidebar verdadeiramente expansível e colapsável;
3. remover o conteúdo técnico e o script atualmente exibidos no painel Geral, substituindo-os por um dashboard executivo que funcione como resumo dos principais módulos do sistema.

Este trabalho não deve alterar as integrações, regras de negócio ou fontes de dados existentes, exceto quando necessário para alimentar os componentes visuais.

O foco desta etapa é:

* consistência visual;
* melhor hierarquia das informações;
* elevação do nível de UX e UI;
* correção de desalinhamentos;
* eliminação de informações técnicas expostas ao usuário;
* melhor aproveitamento do espaço;
* padronização com o design system do Dshow Dash;
* criação de uma visão geral realmente útil.

⸻

2. Escopo das correções

As correções abrangem exclusivamente:

2.1. Header principal

* ícone e indicador de Trânsito;
* tooltip ou popover do Trânsito;
* comportamento no tema light;
* cores, contraste, espaçamento e legibilidade;
* estados semânticos do índice de trânsito.

2.2. Ads Intelligence

* sidebar interna;
* comportamento expandido;
* comportamento colapsado;
* botão para expandir e recolher;
* persistência do estado;
* tooltips;
* alinhamento do conteúdo principal;
* responsividade;
* transições.

2.3. Painel Geral

* remoção do painel de teste;
* remoção do JSON e dos parâmetros técnicos exibidos;
* substituição por um dashboard de resumo;
* criação de cards com indicadores dos módulos;
* criação de atividades recentes;
* criação de alertas consolidados;
* criação de gráficos resumidos;
* criação de atalhos para os módulos;
* personalização futura dos widgets.

⸻

3. Correção do componente de Trânsito no header

3.1. Problema atual identificado

No modo light, o componente de Trânsito está visualmente incompatível com o restante do header.

Atualmente, observa-se:

* fundo preto muito forte;
* contraste excessivo em relação aos demais ícones;
* aparência de componente pertencente ao modo dark;
* indicador amarelo pouco refinado;
* agrupamento visual apertado;
* tooltip com aparência genérica;
* texto com hierarquia insuficiente;
* linhas muito próximas;
* ausência de ícones contextuais dentro do tooltip;
* largura e espaçamentos inadequados;
* dificuldade de leitura rápida;
* aparência distinta dos demais componentes do header.

O componente deve continuar chamando atenção quando necessário, mas sem parecer um bloco externo ou visualmente desconectado do sistema.

⸻

4. Resultado esperado para o Trânsito no modo light

No tema light, o indicador deverá utilizar:

* fundo branco ou branco levemente acinzentado;
* borda discreta;
* sombra suave;
* ícone de trânsito em tom escuro;
* círculo de status com cor semântica;
* número do índice em cor coerente com o estado;
* cantos arredondados iguais aos demais componentes;
* alinhamento vertical centralizado;
* altura padronizada com os botões vizinhos.

O componente deve transmitir a informação de maneira compacta:

●  🚗  47

Onde:

* o círculo representa o status;
* o ícone representa Trânsito;
* o número representa o índice geral;
* o conjunto completo funciona como botão.

Não utilizar fundo preto no modo light.

O fundo escuro poderá permanecer apenas quando o sistema estiver no modo dark, respeitando os tokens do tema.

⸻

5. Especificações visuais do indicador de Trânsito

5.1. Container

Utilizar:

* altura entre 34 e 38 px, respeitando a altura dos demais itens do header;
* padding horizontal entre 10 e 12 px;
* gap interno entre 7 e 9 px;
* border-radius entre 9 e 12 px;
* borda de 1 px;
* fundo baseado no token de superfície do tema;
* cursor pointer;
* transição suave de hover.

No modo light:

background: var(--surface-primary);
border: 1px solid var(--border-subtle);
color: var(--text-primary);

Evitar valores hardcoded quando já existirem design tokens.

5.2. Hover

No hover:

* elevar suavemente a sombra;
* alterar discretamente a borda;
* aplicar leve mudança no fundo;
* não deslocar o componente;
* não aumentar o tamanho;
* não utilizar animação chamativa.

Exemplo conceitual:

box-shadow: var(--shadow-sm);
border-color: var(--border-hover);
background: var(--surface-hover);

5.3. Estado ativo

Quando o popover estiver aberto:

* manter o fundo levemente destacado;
* apresentar borda um pouco mais visível;
* aplicar aria-expanded="true";
* preservar o foco no componente;
* não utilizar mudança brusca de cor.

5.4. Ícone

Utilizar ícone consistente com a biblioteca principal do sistema.

Sugestões:

* CarFront;
* TrafficCone;
* Route;
* Gauge;
* MapPin.

A recomendação principal é CarFront ou TrafficCone, dependendo da disponibilidade na biblioteca atual.

O ícone deverá ter:

* aproximadamente 15 ou 16 px;
* stroke consistente com o header;
* cor de texto secundário;
* alinhamento central.

Não utilizar emoji.

5.5. Indicador de status

O círculo deve possuir aproximadamente:

* 8 px de diâmetro;
* borda ou glow discreto;
* tooltip opcional;
* cor determinada pelo índice.

Sugestão de faixas:

Índice	Situação	Cor semântica
0–39	Bom	verde
40–69	Moderado	amarelo ou laranja
70–100	Ruim	vermelho

Utilizar tokens semânticos do design system.

Exemplos:

* bom: var(--status-success);
* moderado: var(--status-warning);
* ruim: var(--status-danger).

5.6. Número do índice

O número deverá:

* possuir fonte tabular, quando disponível;
* ficar alinhado verticalmente;
* utilizar peso entre 600 e 700;
* ter aproximadamente 13 ou 14 px;
* acompanhar semanticamente o estado;
* manter contraste adequado.

Para o índice 47, utilizar estado moderado.

⸻

6. Tooltip ou popover do Trânsito

6.1. Tipo de componente

Não utilizar tooltip simples para apresentar várias linhas de informação.

Como o conteúdo possui métricas, status e uma ação de navegação, utilizar um componente do tipo:

* Popover;
* Hover Card;
* Floating Panel.

A recomendação é um Popover, aberto por hover e clique, com comportamento controlado.

6.2. Comportamento

No desktop:

* hover abre após pequeno delay;
* saída do mouse fecha após delay curto;
* clique mantém o popover aberto;
* clique fora fecha;
* tecla Esc fecha;
* o botão deve ser navegável por teclado.

No tablet ou dispositivo touch:

* abrir somente por toque;
* fechar ao tocar fora.

6.3. Posição

O popover deverá:

* abrir abaixo do componente;
* ficar alinhado pelo lado direito ou central, conforme espaço;
* não ultrapassar a viewport;
* ajustar automaticamente sua posição;
* não cobrir desnecessariamente o header;
* utilizar z-index compatível com menus e overlays.

Usar biblioteca como:

* Floating UI;
* Radix UI Popover;
* componente equivalente já existente.

Não criar posicionamento manual frágil com valores absolutos fixos.

⸻

7. Conteúdo do popover de Trânsito

Estruturar da seguinte forma:

7.1. Cabeçalho

Trânsito em São Paulo
Moderado

Apresentar:

* título;
* badge do estado;
* indicador visual;
* possibilidade futura de botão de atualização.

7.2. Índice principal

Destacar:

Índice geral
47/100

O número deve possuir maior destaque visual.

7.3. Informações

Apresentar cada informação com ícone:

* estimativa de lentidão: 219,6 km;
* ocorrências ativas: 593;
* interdições: 195;
* atualizado há 4 minutos.

Sugestões de ícones:

* lentidão: Gauge ou Route;
* ocorrências: TriangleAlert;
* interdições: Construction;
* atualização: Clock3 ou RefreshCw.

7.4. Ação

Ao final, incluir:

Abrir painel de Trânsito

Essa ação deverá:

* ser visualmente identificável;
* possuir ícone de seta;
* utilizar cor de link do sistema;
* abrir o painel de Trânsito dentro do conteúdo principal;
* não abrir nova aba;
* atualizar o item ativo da sidebar;
* preservar o shell do Dshow Dash.

7.5. Rodapé opcional

Incluir somente quando necessário:

* fonte dos dados;
* status da atualização;
* aviso de dados indisponíveis.

Não incluir informações técnicas ou nomes de endpoints.

⸻

8. Especificações visuais do popover

Utilizar:

* largura entre 300 e 340 px;
* padding entre 14 e 16 px;
* gap vertical consistente;
* fundo branco no modo light;
* borda discreta;
* sombra média;
* border-radius entre 10 e 12 px;
* tipografia do sistema;
* divisores suaves apenas quando necessários.

No modo dark:

* utilizar superfície elevada escura;
* preservar contraste;
* alterar borda e sombra conforme tokens;
* não manter valores específicos do tema light.

⸻

9. Estados especiais do componente de Trânsito

9.1. Carregando

Durante atualização:

* manter o último índice válido;
* exibir pequeno spinner ou ícone de sincronização;
* indicar “Atualizando” no popover;
* não substituir todo o componente por skeleton após a primeira carga.

9.2. Dados desatualizados

Quando os dados estiverem antigos:

* exibir estado de atenção;
* mostrar “Dados desatualizados”;
* informar a última atualização;
* permitir tentar novamente.

9.3. Erro

Em caso de erro:

* utilizar ícone de alerta;
* não exibir índice falso;
* apresentar —;
* mostrar “Não foi possível atualizar”;
* incluir botão de nova tentativa;
* registrar o erro nos logs.

9.4. Sem dados

Exibir:

Trânsito indisponível

Não mostrar 0, pois isso poderia ser interpretado como trânsito livre.

⸻

10. Ads Intelligence — transformação da navegação lateral

10.1. Problema atual

A área lateral do Ads Intelligence já possui estrutura semelhante a uma sidebar, porém está fixa e não oferece controle real para expandir ou recolher.

Isso causa:

* consumo excessivo de espaço horizontal;
* menor área disponível para gráficos e data grids;
* ausência de adaptação à preferência do usuário;
* falta de consistência com módulos analíticos mais avançados;
* dificuldade de uso em notebooks;
* pouca flexibilidade para telas de alta densidade.

A navegação deve ser transformada em uma sidebar interna expansível e colapsável.

⸻

11. Estrutura da sidebar do Ads Intelligence

11.1. Estado expandido

No estado expandido, exibir:

* ícone do módulo;
* nome “Ads Intelligence”;
* grupos de navegação;
* ícones;
* labels;
* item ativo;
* badges quando aplicável;
* botão de recolher;
* scroll independente.

Largura sugerida:

* entre 220 e 248 px;
* referência principal: 240 px.

A largura deverá ser constante, sem variar de acordo com o texto.

11.2. Estado colapsado

No estado colapsado:

* exibir apenas os ícones;
* manter a ordem dos itens;
* centralizar os ícones;
* ocultar os títulos dos grupos ou representá-los com separadores;
* exibir tooltip ao passar o mouse;
* manter badges compactos;
* preservar o item ativo;
* mostrar botão de expandir.

Largura sugerida:

* entre 64 e 76 px;
* referência principal: 72 px.

11.3. Transição

Utilizar transição suave entre 180 e 240 ms.

Animar apenas:

* largura;
* opacidade dos labels;
* espaçamento;
* posição do conteúdo.

Evitar:

* animações elásticas;
* deslocamentos bruscos;
* reflow excessivo;
* alteração tardia do conteúdo.

⸻

12. Botão de expandir e colapsar

Adicionar um botão dedicado no topo da sidebar interna.

12.1. Estado expandido

Exibir ícone como:

* PanelLeftClose;
* ChevronLeft;
* equivalente.

Tooltip:

Recolher menu

12.2. Estado colapsado

Exibir:

* PanelLeftOpen;
* ChevronRight;
* equivalente.

Tooltip:

Expandir menu

12.3. Requisitos

O botão deverá:

* possuir área de clique mínima adequada;
* apresentar foco;
* funcionar por teclado;
* incluir aria-label;
* incluir aria-expanded;
* não sobrepor itens;
* manter posição estável;
* utilizar a mesma biblioteca de ícones do sistema.

⸻

13. Persistência da sidebar do Ads Intelligence

O estado deverá ser preservado.

Prioridade de persistência:

1. preferência do usuário armazenada no sistema;
2. localStorage;
3. estado padrão expandido.

Sugestão de chave:

dshow.ads-intelligence.sidebar.collapsed

O estado não deve ser redefinido ao:

* trocar de página dentro do módulo;
* atualizar a página;
* abrir um detalhe;
* retornar pelo breadcrumb.

⸻

14. Itens e grupos da sidebar do Ads Intelligence

Manter os grupos existentes, mas corrigir a organização visual.

14.1. Visão

* Visão Geral;
* Diretoria.

14.2. Estrutura

* Campanhas;
* Grupos de anúncios;
* Anúncios;
* Palavras-chave;
* Termos de pesquisa.

14.3. Segmentos

* Landing Pages;
* Conversões;
* Públicos;
* Localizações;
* Dispositivos;
* Horários e dias.

14.4. Gestão

* Orçamentos;
* Qualidade;
* Funil Comercial.

14.5. Inteligência

* Inteligência Artificial;
* Alertas;
* Relatórios.

No estado colapsado, todos os itens deverão continuar acessíveis.

⸻

15. Correção dos ícones da sidebar do Ads Intelligence

Atualmente, alguns ícones possuem aparência de emojis ou estilos inconsistentes.

Substituir por ícones SVG padronizados.

Sugestões:

Item	Ícone
Visão Geral	LayoutDashboard
Diretoria	Target
Campanhas	Megaphone
Grupos de anúncios	BriefcaseBusiness ou Layers
Anúncios	Image
Palavras-chave	KeyRound
Termos de pesquisa	Search
Landing Pages	FileText
Conversões	BadgeCheck ou CheckSquare
Públicos	Users
Localizações	Map
Dispositivos	Smartphone
Horários e dias	Clock
Orçamentos	CircleDollarSign
Qualidade	Star
Funil Comercial	Funnel
Inteligência Artificial	Bot
Alertas	Bell
Relatórios	ChartNoAxesCombined

Utilizar apenas uma família principal, preferencialmente Lucide.

⸻

16. Comportamento do conteúdo do Ads Intelligence

Ao expandir ou recolher a sidebar:

* o conteúdo deverá ocupar automaticamente o espaço disponível;
* cards e gráficos deverão recalcular sua largura;
* gráficos ECharts deverão executar resize;
* visualizações D3 deverão recalcular dimensões;
* data grids deverão ajustar as colunas;
* não pode existir conteúdo cortado;
* não pode aparecer barra horizontal desnecessária;
* não pode haver sobreposição.

Criar um evento interno ou ResizeObserver para notificar os componentes.

Exemplo conceitual:

sidebarStateChange -> layout recalculation -> chart.resize()

Não depender apenas do evento global window.resize.

⸻

17. Responsividade do Ads Intelligence

Desktop amplo

* sidebar expandida por padrão;
* possibilidade de recolher;
* cards em três ou quatro colunas conforme a largura.

Notebook

* utilizar a preferência salva;
* permitir sidebar colapsada;
* preservar legibilidade dos gráficos.

Tablet

* sidebar interna poderá funcionar como drawer;
* o conteúdo deverá ocupar a largura total;
* abrir o menu por botão.

Tela pequena

* não manter sidebar fixa ocupando espaço;
* utilizar drawer ou sheet;
* fechar após selecionar um item, quando adequado.

⸻

18. Manutenção da identidade do Ads Intelligence

A sidebar deverá manter coerência com:

* header interno;
* cards de KPI;
* filtros;
* seletor de conta;
* seletor de período;
* gráficos;
* design tokens.

O estado ativo poderá utilizar o azul característico do módulo, mas sem contrastes excessivos.

Aplicar:

* texto principal;
* texto secundário;
* background ativo;
* borda ativa;
* hover;
* foco;
* badge.

Não utilizar emojis como recurso visual principal.

⸻

19. Painel Geral — problema atual

O painel Geral está exibindo uma tela de teste contendo:

* título “Dashboard — Painel de Teste”;
* mensagens de validação técnica;
* cards genéricos;
* objeto JSON;
* parâmetros recebidos;
* containerId;
* signal;
* source;
* originalData;
* informações de roteamento;
* propriedades internas da sidebar.

Esse conteúdo não deve ser apresentado ao usuário final.

Trata-se de informação de desenvolvimento e depuração.

A exposição desses dados:

* reduz a qualidade percebida;
* confunde o usuário;
* expõe detalhes internos;
* ocupa a área principal;
* impede que o painel Geral cumpra sua função;
* transmite aparência de sistema incompleto.

Todo esse conteúdo deverá ser removido da interface de produção.

⸻

20. Nova função do painel Geral

O painel Geral deverá funcionar como a página inicial consolidada do Dshow Dash.

Sua finalidade será apresentar:

* situação geral do sistema;
* resumo dos principais módulos;
* indicadores mais importantes;
* alertas;
* atividades recentes;
* atalhos;
* evolução consolidada;
* status das integrações;
* pendências;
* informações personalizadas para o usuário.

O painel não deverá duplicar integralmente os módulos.

Ele deverá oferecer uma visão rápida e permitir acesso ao detalhe.

⸻

21. Header da página Geral

Criar um header de página contendo:

21.1. Título

Visão Geral

21.2. Subtítulo

Sugestão:

Resumo consolidado dos principais indicadores, operações e integrações do Dshow Dash.

21.3. Ações

Adicionar:

* seletor de período;
* botão atualizar;
* indicador da última atualização;
* botão personalizar;
* botão restaurar layout, quando a personalização estiver disponível.

Não exibir dados técnicos no header.

⸻

22. Primeira linha — saúde geral do sistema

Criar cards resumidos.

22.1. Status do sistema

Apresentar:

* Online;
* Com atenção;
* Parcialmente indisponível;
* Indisponível.

Mostrar:

* status;
* quantidade de serviços saudáveis;
* quantidade com falha;
* última verificação.

22.2. Módulos ativos

Mostrar:

* quantidade total de módulos;
* módulos ativos;
* módulos em manutenção;
* módulos com erro.

22.3. Integrações

Mostrar:

* conectadas;
* sincronizando;
* desatualizadas;
* com erro.

22.4. Alertas

Mostrar:

* total em aberto;
* críticos;
* atenção;
* informativos.

22.5. Atualização

Mostrar:

* última sincronização geral;
* jobs em execução;
* dados mais antigos;
* botão de detalhes.

Esses cards devem permitir drill-down.

⸻

23. Segunda linha — resumos dos principais painéis

Criar widgets específicos para os principais módulos.

Inicialmente, incluir:

* Trânsito;
* Ads Intelligence;
* Meta Ads;
* Mercado Livre;
* E-commerce;
* Compras;
* Comercial;
* Financeiro;
* Pipedrive;
* Outlook;
* DataTables.

Não é necessário mostrar todos simultaneamente se isso comprometer a legibilidade.

Permitir configuração futura.

⸻

24. Estrutura de cada widget de módulo

Cada widget deverá conter:

* ícone;
* nome;
* status;
* métricas principais;
* tendência;
* última atualização;
* botão ou link para abrir;
* alerta quando aplicável.

24.1. Trânsito

Exemplo:

* Moderado;
* índice 47/100;
* 219,6 km de lentidão;
* atualizado há 4 minutos.

24.2. Ads Intelligence

Exemplo:

* investimento do período;
* conversões;
* ROAS;
* campanhas com atenção.

24.3. Meta Ads

Exemplo:

* investimento;
* leads;
* CPL;
* campanhas ativas.

24.4. Mercado Livre

Exemplo:

* pedidos;
* faturamento;
* perguntas pendentes;
* reclamações.

24.5. E-commerce

Exemplo:

* pedidos;
* faturamento;
* ticket médio;
* produtos com estoque crítico.

24.6. Compras

Exemplo:

* solicitações;
* pedidos pendentes;
* valor em aberto;
* itens atrasados.

24.7. Financeiro

Exemplo:

* recebíveis;
* vencidos;
* saldo previsto;
* divergências.

24.8. Pipedrive

Exemplo:

* negócios em andamento;
* valor do funil;
* atividades atrasadas;
* conversão.

⸻

25. Layout do painel Geral

Utilizar grid responsivo de 12 colunas.

25.1. Desktop amplo

Sugestão:

* cards de saúde: 5 ou 6 cards na primeira linha;
* widgets de módulo: 3 ou 4 por linha;
* gráficos principais: 8 + 4 colunas;
* atividades e alertas: 6 + 6 colunas.

25.2. Notebook

* cards em 3 colunas;
* widgets em 2 ou 3 colunas;
* gráficos empilhados quando necessário.

25.3. Tablet

* 2 cards por linha;
* gráficos com largura total;
* sidebar principal recolhível.

25.4. Dispositivo pequeno

* 1 card por linha;
* ações em menu;
* tabelas convertidas em listas ou cards.

⸻

26. Gráficos resumidos do painel Geral

26.1. Evolução consolidada

Criar gráfico temporal mostrando métricas selecionadas, como:

* pedidos;
* faturamento;
* investimento em mídia;
* conversões;
* recebimentos;
* alertas.

Utilizar Apache ECharts.

Permitir:

* alternar métricas;
* selecionar período;
* visualizar tooltip;
* comparar período anterior;
* acessar o módulo de origem.

Não misturar unidades incompatíveis sem indicar eixos ou modos de visualização.

26.2. Distribuição por módulo

Criar visualização de distribuição por:

* volume de atividades;
* quantidade de alertas;
* uso;
* registros processados;
* indicadores consolidados.

Pode ser utilizado:

* donut;
* barras horizontais;
* treemap.

Evitar legenda sobreposta ao gráfico.

No print do Ads Intelligence, a legenda do gráfico de distribuição está visualmente apertada e parcialmente sobreposta. O novo componente deve reservar espaço adequado para legenda.

26.3. Status das integrações

Criar gráfico ou matriz contendo:

* integração;
* status;
* última sincronização;
* latência;
* quantidade de erros;
* registros processados.

Pode ser apresentado como:

* matriz;
* cards compactos;
* data grid resumido.

⸻

27. Atividades recentes

Criar uma seção chamada:

Atividades recentes

Exibir eventos como:

* pedido aprovado;
* campanha pausada;
* sincronização concluída;
* alerta criado;
* pagamento recebido;
* oportunidade atualizada;
* estoque alterado;
* envio realizado.

Cada evento deverá mostrar:

* ícone;
* descrição;
* módulo;
* data relativa;
* usuário ou origem;
* link para o registro relacionado.

Exemplo:

Pedido #12345 aprovado
E-commerce • há 2 minutos

Limitar a quantidade inicial e incluir:

Ver todas as atividades

⸻

28. Alertas e pendências consolidadas

Criar uma seção chamada:

Exige atenção

Exibir apenas situações relevantes.

Categorias:

* crítico;
* atenção;
* informativo.

Exemplos:

* falha na sincronização do Mercado Livre;
* campanha com CPA acima da meta;
* pedido aguardando envio;
* recebimento vencido;
* trânsito intenso;
* atividades atrasadas no Pipedrive;
* produto com estoque zerado.

Cada alerta deverá conter:

* severidade;
* módulo;
* descrição;
* impacto;
* tempo em aberto;
* ação;
* responsável, quando houver.

⸻

29. Atalhos rápidos

Criar atalhos para ações frequentes, como:

* abrir Ads Intelligence;
* consultar pedidos;
* visualizar alertas;
* acessar e-mails;
* abrir Pipedrive;
* consultar trânsito;
* abrir DataTables;
* acessar Mercado Livre;
* abrir E-commerce.

Os atalhos deverão ser configuráveis futuramente.

Não utilizar atalhos em excesso.

⸻

30. Personalização do painel Geral

Adicionar botão:

Personalizar

Na primeira fase, o botão pode abrir uma interface mockada ou limitada.

A arquitetura deverá estar preparada para:

* mostrar ou ocultar widgets;
* reordenar;
* redimensionar;
* selecionar métricas;
* salvar layout;
* restaurar padrão;
* possuir configuração individual por usuário.

Bibliotecas possíveis:

* React Grid Layout;
* Gridstack;
* implementação equivalente.

Não implementar drag-and-drop instável sem persistência.

⸻

31. Estados do painel Geral

31.1. Loading

Utilizar skeletons com o mesmo formato final dos widgets.

31.2. Sem dados

Mostrar mensagem orientativa.

Exemplo:

Ainda não existem informações suficientes para este módulo.

Incluir ação para abrir ou configurar a integração.

31.3. Erro parcial

Um erro em um widget não deve impedir todo o painel de carregar.

Cada widget deve possuir tratamento independente.

31.4. Dados desatualizados

Mostrar:

* data da última atualização;
* status;
* opção de tentar novamente.

⸻

32. Remoção de informações técnicas

Remover completamente da tela de produção:

* parâmetros recebidos;
* objetos JSON;
* IDs internos sem finalidade ao usuário;
* containerId;
* signal;
* source;
* originalData;
* timestamp técnico;
* dados de roteamento;
* nomes de eventos;
* propriedades da sidebar;
* panel_id;
* intent_id;
* dados de debug.

Esses dados poderão continuar disponíveis somente em:

* console do navegador em desenvolvimento;
* logs técnicos;
* painel de diagnóstico restrito;
* modo debug protegido;
* DevTools internos.

Não renderizar informações técnicas diretamente no DOM da tela Geral.

⸻

33. Controle de ambiente

Criar uma checagem de ambiente:

if (environment === 'development' && debugEnabled) {
  renderDebugPanel();
}

Em produção:

* o painel de debug deverá estar desabilitado;
* não deverá ser incluído por padrão;
* não deverá ocupar espaço no layout;
* não deverá ser acessível sem permissão.

⸻

34. Consistência visual entre as três correções

As alterações deverão utilizar os mesmos padrões de:

* border-radius;
* sombra;
* tipografia;
* espaçamento;
* cores;
* ícones;
* tooltip;
* popover;
* skeleton;
* estado vazio;
* foco;
* animação;
* densidade.

Não criar estilos exclusivos e desconectados para cada tela.

Utilizar tokens globais, como:

--surface-primary
--surface-secondary
--surface-hover
--border-subtle
--border-active
--text-primary
--text-secondary
--status-success
--status-warning
--status-danger
--shadow-sm
--shadow-md

⸻

35. Bibliotecas recomendadas

Componentes

* shadcn/ui;
* Radix UI;
* componentes já existentes no design system.

Ícones

* Lucide Icons.

Gráficos

* Apache ECharts para gráficos analíticos padronizados;
* D3.js para visualizações personalizadas.

Grid do dashboard

* CSS Grid;
* React Grid Layout, caso a personalização seja implementada.

Estado

* Zustand ou solução já utilizada pelo projeto.

Dados

* TanStack Query ou solução já existente.

Tooltip e posicionamento

* Radix UI;
* Floating UI.

Não adicionar uma nova biblioteca quando o sistema já possuir componente equivalente.

⸻

36. Acessibilidade

Garantir:

* contraste adequado;
* foco visível;
* navegação por teclado;
* aria-label;
* aria-expanded;
* aria-controls;
* tooltips acessíveis;
* ícones com identificação;
* status não dependentes apenas de cor;
* suporte a redução de movimento;
* área mínima de clique.

O indicador de Trânsito deverá possuir texto acessível semelhante a:

Trânsito em São Paulo: moderado, índice 47 de 100.

⸻

37. Performance

Trânsito

* evitar requisição a cada hover;
* utilizar cache;
* atualizar em intervalo definido;
* preservar último dado válido;
* não reconstruir o header inteiro.

Ads Intelligence

* evitar renderização completa durante colapso;
* utilizar ResizeObserver;
* redimensionar gráficos apenas após a transição;
* evitar múltiplos listeners.

Geral

* carregar widgets independentemente;
* utilizar lazy loading;
* priorizar conteúdo acima da dobra;
* evitar uma única requisição monolítica;
* usar cache;
* evitar bloquear toda a tela em caso de falha parcial.

⸻

38. Critérios de aceite — Trânsito

A correção será considerada aprovada quando:

* o fundo preto não aparecer no tema light;
* o componente estiver visualmente alinhado aos demais ícones;
* o indicador de status utilizar cores semânticas;
* o índice estiver legível;
* o popover possuir boa hierarquia;
* os dados estiverem acompanhados de ícones;
* o botão abrir o painel de Trânsito;
* o componente funcionar por hover, clique e teclado;
* o componente adaptar-se ao modo dark;
* estados de loading e erro estiverem implementados;
* não houver sobreposição;
* o posicionamento respeitar a viewport.

⸻

39. Critérios de aceite — Ads Intelligence

A correção será considerada aprovada quando:

* a sidebar puder ser expandida e recolhida;
* a largura expandida for consistente;
* a largura colapsada apresentar apenas ícones;
* os ícones possuírem tooltip;
* o estado for persistido;
* o item ativo continuar visível;
* os grupos permanecerem organizados;
* os gráficos redimensionarem corretamente;
* os data grids ajustarem a largura;
* não houver corte ou scroll horizontal indevido;
* funcionar em desktop e notebook;
* possuir adaptação para tablet;
* os ícones forem SVG e consistentes;
* não forem utilizados emojis como ícones principais.

⸻

40. Critérios de aceite — painel Geral

A correção será considerada aprovada quando:

* o script e o JSON forem removidos;
* informações de debug não aparecerem em produção;
* a tela possuir título e subtítulo adequados;
* existir resumo da saúde do sistema;
* existirem widgets dos principais módulos;
* existir área de alertas;
* existir área de atividades recentes;
* existir pelo menos um gráfico consolidado;
* os cards permitirem abrir os módulos;
* o layout for responsivo;
* os widgets tratarem erros individualmente;
* a tela não parecer um painel de teste;
* a tela funcionar como página inicial útil do Dshow Dash.

⸻

41. Ordem recomendada de implementação

Etapa 1 — Limpeza imediata

* remover painel de teste;
* remover JSON;
* remover parâmetros técnicos;
* proteger o debug por ambiente;
* corrigir fundo do Trânsito no tema light.

Etapa 2 — Estrutura

* implementar popover de Trânsito;
* implementar sidebar expansível do Ads Intelligence;
* implementar novo layout-base do painel Geral.

Etapa 3 — Componentes

* cards de saúde;
* widgets de módulos;
* atividades;
* alertas;
* gráficos;
* atalhos.

Etapa 4 — Responsividade

* desktop;
* notebook;
* tablet;
* estados colapsados.

Etapa 5 — Refinamento

* microinterações;
* acessibilidade;
* loading;
* erros;
* dados desatualizados;
* persistência;
* performance.

⸻

42. Orientação final para o agente

Não realizar apenas alterações cosméticas isoladas.

As correções devem resolver simultaneamente:

* identidade visual;
* organização;
* legibilidade;
* aproveitamento do espaço;
* navegação;
* comportamento responsivo;
* acessibilidade;
* consistência com o sistema.

O componente de Trânsito deverá parecer nativo do header no modo light.

A sidebar do Ads Intelligence deverá funcionar como uma navegação interna profissional, permitindo expandir e recolher sem comprometer gráficos ou conteúdos.

O painel Geral deverá deixar de ser uma tela técnica de teste e tornar-se o principal resumo executivo e operacional do Dshow Dash.

Antes de concluir, validar visualmente:

* alinhamentos;
* espaçamentos;
* contraste;
* tooltips;
* estados ativos;
* transições;
* responsividade;
* comportamento no modo light e dark;
* ausência de scripts ou informações técnicas expostas.