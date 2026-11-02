Transito
Briefing de Elevação Visual e UX — Módulo de Trânsito de São Paulo

1. Objetivo da evolução

Realizar uma revisão completa da interface do módulo Trânsito em São Paulo, elevando seu nível visual, informacional e funcional para que ele deixe de ter aparência de protótipo e passe a se apresentar como um dashboard gerencial moderno, intuitivo e consistente com o restante do DshowDash.

A evolução deve contemplar:

* maior riqueza visual;
* uso estratégico de cores;
* iconografia consistente;
* melhoria da hierarquia das informações;
* melhor aproveitamento do espaço;
* mapa mais legível e informativo;
* cards mais sofisticados;
* inclusão de gráficos e indicadores visuais;
* transformação das listas atuais em DataGrids robustos;
* melhoria dos filtros;
* melhoria dos estados de interação;
* melhor comunicação da qualidade e atualização dos dados;
* correção de inconsistências informacionais;
* responsividade;
* acessibilidade;
* suporte aos temas claro e escuro;
* manutenção da performance do microfrontend.

A proposta não é apenas “deixar a tela mais bonita”. A nova interface deve permitir que o usuário entenda rapidamente:

1. como está o trânsito em São Paulo;
2. se a situação está melhorando ou piorando;
3. quais regiões estão mais afetadas;
4. quais vias estão mais congestionadas;
5. quais ocorrências realmente continuam ativas;
6. quais dados são estimados;
7. quando os dados foram atualizados;
8. se existe alguma indisponibilidade parcial na integração.

⸻

2. Diagnóstico da interface atual

Com base nos prints apresentados, a interface atual já possui uma estrutura funcional adequada, mas ainda apresenta limitações importantes de experiência e acabamento visual.

2.1 Pontos positivos atuais

A tela já apresenta:

* título e descrição;
* situação geral;
* horário da última atualização;
* atualização manual;
* cards de resumo;
* mapa;
* legenda de fluxo;
* agrupamento de ocorrências;
* relação das vias mais congestionadas;
* relação de ocorrências;
* filtros básicos por tipo.

Esses elementos devem ser preservados conceitualmente, porém reorganizados e enriquecidos.

⸻

2.2 Problemas visuais identificados

Interface excessivamente monocromática

Grande parte da tela utiliza branco, cinza-claro e textos escuros, com poucas áreas de destaque. Isso reduz a percepção de prioridade e dificulta a leitura rápida.

As cores aparecem somente em pequenos elementos, como:

* índice geral;
* badges;
* clusters do mapa;
* linhas do fluxo;
* filtro selecionado.

A cor precisa ser utilizada de forma mais estratégica em:

* cards;
* ícones;
* gráficos;
* indicadores;
* cabeçalhos;
* estados;
* tendências;
* severidades;
* filtros;
* regiões do mapa;
* linhas selecionadas.

⸻

Cards muito planos

Os cards atuais apresentam apenas texto e número, sem:

* ícones;
* tendências visuais;
* comparações gráficas;
* barras;
* sparklines;
* diferenciação semântica;
* tooltip explicativo;
* profundidade visual.

Todos os cards têm praticamente o mesmo peso visual, embora representem métricas de importâncias diferentes.

⸻

Hierarquia insuficiente

O usuário vê vários números, mas não fica imediatamente claro:

* qual é a informação principal;
* qual métrica merece atenção;
* qual valor representa risco;
* qual informação é estimada;
* qual dado está incompleto;
* qual indicador mudou desde a atualização anterior.

O índice geral precisa ser o ponto focal da tela.

⸻

Mapa com baixo aproveitamento visual

Nos prints, o mapa apresenta diferentes níveis de enquadramento. Em uma das situações, grande parte do estado de São Paulo é exibida enquanto os dados se concentram em uma pequena região.

Isso gera:

* excesso de área vazia;
* dificuldade para interpretar o trânsito da capital;
* clusters sobrepostos;
* baixa legibilidade das vias;
* falta de contexto sobre regiões e zonas;
* pouca percepção de quais áreas estão piores.

O mapa deve iniciar enquadrado corretamente no município de São Paulo e adaptar o zoom aos dados relevantes, sem se afastar desnecessariamente.

⸻

Legenda pouco integrada

A legenda atual ocupa uma caixa solta no mapa e informa apenas as cores do fluxo.

Ela deve ser transformada em um controle visual mais completo, incluindo:

* fluxo;
* ocorrências;
* severidade;
* opção de ativar e desativar camadas;
* explicação do que cada cor representa;
* opção de recolher;
* indicação da fonte dos dados.

⸻

Listas com aparência simples

As áreas “Vias mais congestionadas” e “Ocorrências em andamento” possuem aparência de listas estáticas.

Elas não oferecem a experiência esperada de um dashboard gerencial:

* cabeçalhos de colunas;
* ordenação;
* busca;
* filtros avançados;
* seleção;
* redimensionamento;
* exportação;
* densidade configurável;
* paginação;
* agrupamento;
* detalhes expansíveis;
* persistência das preferências;
* integração visual clara com o mapa.

Essas áreas devem ser transformadas em DataGrids completos.

⸻

Excesso de espaço e baixa densidade informacional

Algumas linhas apresentam muito espaço vertical para pouca informação. Isso aumenta a necessidade de rolagem e reduz a quantidade de registros visíveis.

A interface precisa permitir:

* densidade confortável;
* densidade compacta;
* altura de linha adequada;
* melhor alinhamento entre colunas;
* leitura rápida de muitos registros.

⸻

3. Inconsistências de dados que devem ser corrigidas

Antes da evolução puramente visual, validar as informações apresentadas.

3.1 Lentidão com zero segmentos

O card apresenta:

57,5 km de lentidão estimada
0 segmentos afetados

Esses dados parecem contraditórios.

Se existem 57,5 km de lentidão, normalmente deve existir pelo menos um segmento utilizado no cálculo.

O sistema deve:

* revisar o cálculo;
* revisar o campo exibido;
* diferenciar “segmentos de fluxo” e “ocorrências”;
* não apresentar zero quando o valor não foi calculado;
* usar “indisponível” ou “não informado” quando não houver dado confiável.

⸻

3.2 Total de ocorrências não corresponde à distribuição

O card apresenta:

310 ocorrências ativas
0 acidentes
183 interdições
1 obra

A soma das categorias exibidas não corresponde ao total.

O card deve:

* mostrar todas as categorias que compõem o total;
* incluir “outros” quando aplicável;
* apresentar a composição visual;
* usar tooltip com o detalhamento;
* evitar totalizações que não possam ser explicadas.

Exemplo:

310 ocorrências
183 interdições
1 obra
0 acidentes
97 congestionamentos
29 outras

⸻

3.3 Ocorrências encerradas em “Ocorrências em andamento”

A listagem atual apresenta ocorrências identificadas como:

Encerrado/a

dentro da seção:

Ocorrências em andamento

Isso precisa ser corrigido.

A regra deve ser:

* ocorrências ativas aparecem em “Em andamento”;
* ocorrências encerradas aparecem em uma visualização separada;
* ocorrências sem status confiável aparecem como “Status não confirmado”;
* o frontend não deve presumir que a ocorrência continua ativa;
* registros encerrados não devem influenciar o card de ocorrências ativas.

⸻

3.4 Classificação visual e valor numérico

O índice aparece como 25/100, classificado como normal. Essa regra pode estar correta, mas deve ser comunicada de maneira mais clara.

Mostrar:

25/100
Trânsito normal
Faixa normal: 0–34

Disponibilizar a explicação em tooltip, sem poluir o card.

⸻

3.5 Comparação “pior que o normal”

A interface deve esclarecer qual é a referência utilizada:

* velocidade em fluxo livre;
* histórico para aquele horário;
* média do mesmo dia da semana;
* média dos últimos dias;
* outra referência.

Atualmente aparece:

Referência: fluxo livre da via

Essa informação deve ser mantida e apresentada de forma mais clara, evitando que o usuário interprete o valor como comparação histórica.

⸻

4. Direção visual

4.1 Conceito

A nova interface deve seguir o conceito:

Centro de monitoramento urbano gerencial, moderno, confiável, informativo e visualmente sofisticado.

A aparência não deve se aproximar de:

* aplicativo de navegação pessoal;
* tela de GPS;
* mapa turístico;
* protótipo técnico;
* painel excessivamente colorido;
* interface infantil;
* aplicação genérica sem identidade.

⸻

4.2 Estilo visual recomendado

Utilizar:

* superfícies em camadas;
* cards com variações sutis de tonalidade;
* bordas discretas;
* sombras suaves;
* cantos consistentes;
* ícones lineares;
* cores semânticas;
* gradientes leves apenas em áreas de destaque;
* números grandes;
* tipografia de alta legibilidade;
* micrográficos;
* badges consistentes;
* transições suaves;
* estados de hover;
* tooltips ricos;
* skeletons;
* animações discretas de atualização.

Evitar:

* excesso de gradientes;
* sombras muito fortes;
* cores neon;
* animações contínuas;
* piscadas;
* ícones de estilos diferentes;
* badges excessivamente pequenos;
* fundos totalmente coloridos em grandes áreas;
* uso de vermelho em informações que não representem risco.

⸻

5. Sistema de cores

Criar uma paleta semântica para o módulo.

5.1 Fluxo de trânsito

Livre/normal: verde
Moderado: amarelo
Lento: laranja
Intenso: vermelho
Crítico/interrompido: vermelho escuro
Sem dados: cinza

Sugestão conceitual:

--traffic-free: #16a34a;
--traffic-moderate: #eab308;
--traffic-slow: #f97316;
--traffic-intense: #ef4444;
--traffic-critical: #991b1b;
--traffic-unavailable: #94a3b8;

Esses valores devem ser integrados aos tokens globais do DshowDash, e não replicados diretamente em todos os componentes.

⸻

5.2 Tipos de ocorrência

Criar cores e ícones específicos:

Tipo	Cor semântica	Ícone sugerido
Acidente	vermelho	colisão ou triângulo de alerta
Interdição	vermelho escuro	círculo com bloqueio
Obra	laranja	cone ou ferramenta
Congestionamento	âmbar	carros ou filas
Perigo na via	amarelo	alerta
Evento	roxo	calendário ou localização
Alagamento	azul	ondas
Semáforo com problema	rosa ou magenta controlado	semáforo
Outros	cinza	informação

Não depender somente da cor. Utilizar ícone, texto e aria-label.

⸻

5.3 Tendências

Melhorando: verde
Estável: azul ou cinza azulado
Piorando: vermelho
Sem comparação: cinza

A tendência deve utilizar:

* ícone;
* texto;
* variação percentual;
* tooltip;
* cor.

Exemplo:

↓ 7,5% melhor que há 15 minutos

ou:

↑ 7,5% pior que o fluxo livre

⸻

6. Bibliotecas visuais recomendadas

6.1 DataGrid

Recomendo utilizar AG Grid Community na primeira versão.

A edição Community já disponibiliza recursos essenciais para um DataGrid robusto, incluindo organização de linhas e colunas, ordenação, filtros e customização. Recursos mais avançados devem ser avaliados separadamente para evitar dependência desnecessária da edição Enterprise.  

Utilizar:

ag-grid-community

ou o pacote correspondente ao framework utilizado pelo microfrontend.

Alternativa

Caso o DshowDash já possua uma biblioteca visual própria ou necessite de controle completo sobre a renderização, avaliar TanStack Table.

TanStack Table é uma solução headless: fornece a lógica de tabelas e DataGrids, mas não impõe a interface visual. Isso permite maior liberdade, porém exige mais trabalho para construir filtros, menus, paginação, estados e aparência.  

Decisão recomendada

Primeira escolha: AG Grid Community
Segunda escolha: TanStack Table

Não criar um DataGrid do zero sem antes verificar os componentes disponíveis no DshowDash.

⸻

6.2 Gráficos e visualizações

Utilizar Apache ECharts para:

* sparklines;
* séries temporais;
* gráfico por região;
* composição das ocorrências;
* velocímetro ou gauge;
* heatmap temporal;
* comparações;
* distribuição por severidade.

A biblioteca oferece diversos tipos de gráficos e componentes interativos que podem ser combinados em um mesmo sistema visual.  

Não utilizar gráficos apenas como decoração. Cada visualização precisa responder a uma pergunta operacional.

⸻

6.3 Ícones

Utilizar Lucide Icons para padronizar a iconografia do módulo.

Lucide fornece ícones SVG leves, escaláveis, customizáveis e construídos com regras visuais consistentes.  

Não misturar:

* Lucide;
* Font Awesome;
* Material Icons;
* emojis;
* ícones desenhados manualmente;

na mesma interface, salvo quando houver padrão global previamente definido no DshowDash.

⸻

6.4 Mapa

Manter:

Leaflet

Reutilizar a arquitetura já implementada:

* mapa-base;
* GeoJSON;
* polylines;
* markers;
* clustering;
* controle de camadas.

A evolução deverá se concentrar na experiência, estilo e interação, sem substituir a biblioteca sem necessidade.

⸻

7. Nova organização da tela

7.1 Estrutura geral proposta

┌──────────────────────────────────────────────────────────────┐
│ Cabeçalho do módulo                                          │
│ Título | Status | Atualização | Controles                     │
├──────────────────────────────────────────────────────────────┤
│ Card principal do índice | Indicadores secundários           │
├──────────────────────────────────────────────────────────────┤
│ Faixa de insights e tendências                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Mapa principal                            Painel lateral       │
│                                           Resumo regional      │
│                                           Camadas              │
│                                           Ocorrências críticas │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Abas: Vias | Ocorrências | Regiões | Histórico                │
│ DataGrid                                                     │
└──────────────────────────────────────────────────────────────┘

⸻

7.2 Cabeçalho do módulo

O cabeçalho deve ser visualmente mais estruturado.

Área esquerda

Apresentar:

* ícone do módulo;
* título;
* subtítulo;
* badge de fonte de dados;
* indicador de funcionamento.

Exemplo:

[ícone] Trânsito em São Paulo
Monitoramento das condições viárias e ocorrências da cidade
Fonte: TomTom
Serviço operacional

Área direita

Apresentar:

* última atualização;
* tempo até a próxima atualização;
* botão de atualizar;
* botão de tela cheia;
* botão de configurações do mapa;
* menu de ações.

Exemplo:

Atualizado há 2 minutos
Próxima atualização em 01:14
[Atualizar] [Tela cheia] [Mais]

⸻

8. Redesenho dos cards

8.1 Card principal — Índice geral

O índice geral deve ocupar maior destaque que as demais métricas.

Apresentar:

* ícone;
* valor grande;
* classificação;
* gauge semicircular ou circular;
* comparação;
* tendência;
* mini-histórico;
* tooltip com metodologia.

Exemplo:

ÍNDICE GERAL DE TRÂNSITO
25 / 100
Normal
↓ 4 pontos nos últimos 15 minutos
7,5% abaixo da velocidade de fluxo livre
[mini gráfico de evolução]

O gauge não deve ocupar espaço excessivo nem parecer um velocímetro automotivo decorativo.

⸻

8.2 Card de lentidão estimada

Apresentar:

* ícone de via congestionada;
* quilômetros estimados;
* número de segmentos;
* variação desde a atualização anterior;
* barra de distribuição por severidade.

Exemplo:

57,5 km
Lentidão estimada
18,2 km moderada
24,1 km lenta
15,2 km intensa

Caso o número de segmentos esteja indisponível:

Segmentos não calculados

e não:

0 segmentos

⸻

8.3 Card de velocidade média

Apresentar:

* velocidade atual;
* velocidade de fluxo livre;
* diferença absoluta;
* diferença percentual;
* sparkline;
* ícone de velocidade.

Exemplo:

35 km/h
Velocidade média atual
Fluxo livre: 38 km/h
Diferença: −3 km/h
Variação: −7,5%

⸻

8.4 Card de ocorrências

Apresentar:

* total;
* composição por tipo;
* composição por severidade;
* mini gráfico de rosca;
* número de ocorrências críticas;
* evolução recente.

Exemplo:

310
Ocorrências ativas
8 críticas
45 altas
102 moderadas
155 baixas

O usuário deve poder clicar em uma categoria para filtrar o mapa e o DataGrid.

⸻

8.5 Card de comparação

Substituir o card puramente textual por um comparativo visual.

Apresentar:

Atual: 35 km/h
Fluxo livre: 38 km/h
Diferença: −7,5%

Adicionar barra horizontal:

Atual       ██████████████████
Fluxo livre ████████████████████

Informar explicitamente:

Comparação baseada na velocidade de fluxo livre das vias monitoradas.

⸻

8.6 Interação dos cards

Todos os cards devem permitir:

* hover;
* foco por teclado;
* tooltip;
* clique para filtrar;
* estado selecionado;
* animação curta na atualização;
* skeleton;
* erro parcial;
* dados indisponíveis;
* indicação de estimativa.

Ao clicar em “Interdições”, por exemplo:

* ativar filtro de interdições;
* atualizar o mapa;
* atualizar o DataGrid;
* mostrar chip do filtro ativo;
* permitir limpar o filtro.

⸻

9. Nova camada de insights

Adicionar uma faixa de insights automáticos abaixo dos cards.

Exemplos:

Marginal Pinheiros apresenta a maior redução de velocidade neste momento.
As interdições representam 59% das ocorrências registradas.
A velocidade média melhorou 4% nos últimos 15 minutos.
Zona Oeste concentra a maior quantidade de segmentos lentos.

Cada insight deve:

* possuir ícone;
* ser baseado em dados reais;
* permitir clique para aprofundamento;
* não usar afirmações quando os dados forem insuficientes;
* indicar a referência temporal.

Evitar mais de três ou quatro insights simultâneos.

⸻

10. Evolução do mapa

10.1 Enquadramento inicial

O mapa deve:

* abrir centrado no município de São Paulo;
* utilizar fitBounds baseado nos limites configurados da cidade;
* impedir zoom inicial excessivamente amplo;
* evitar mostrar grandes áreas do interior sem necessidade;
* manter os dados centrais visíveis;
* preservar o enquadramento escolhido pelo usuário durante atualizações automáticas.

Não executar fitBounds a cada atualização, pois isso pode retirar o usuário da região que está analisando.

⸻

10.2 Toolbar do mapa

Criar uma toolbar flutuante com:

* aproximar;
* afastar;
* reenquadrar São Paulo;
* tela cheia;
* ativar/desativar fluxo;
* ativar/desativar ocorrências;
* ativar/desativar regiões;
* centralizar nos dados críticos;
* alternar mapa claro/escuro, se compatível com o tema;
* abrir configurações das camadas.

Exemplo:

[+] [−] [Centralizar] [Camadas] [Críticas] [Tela cheia]

Utilizar tooltips em todos os botões.

⸻

10.3 Controle de camadas

Substituir a legenda simples por um controle interativo.

Fluxo

* normal;
* moderado;
* lento;
* intenso;
* crítico.

Ocorrências

* acidentes;
* interdições;
* obras;
* congestionamentos;
* outros.

Regiões

* Centro;
* Zona Norte;
* Zona Sul;
* Zona Leste;
* Zona Oeste.

O usuário deve poder:

* mostrar ou ocultar cada camada;
* selecionar todas;
* limpar todas;
* restaurar o padrão;
* ver a quantidade de elementos de cada categoria.

⸻

10.4 Clusters

Os clusters devem:

* possuir cores por severidade predominante;
* indicar quantidade;
* aumentar de tamanho de maneira controlada;
* possuir hover;
* apresentar resumo no tooltip;
* expandir com zoom;
* permitir spiderfy quando necessário.

Exemplo de tooltip:

18 ocorrências nesta região
4 interdições
2 acidentes
9 congestionamentos
3 outras

⸻

10.5 Linhas de fluxo

As vias devem ter:

* espessura proporcional à importância ou severidade;
* contorno para contraste;
* opacidade adequada;
* hover;
* seleção;
* tooltip;
* animação apenas quando útil;
* tratamento de linhas sobrepostas.

Ao posicionar o cursor sobre uma via:

Avenida Rebouças
Velocidade atual: 19 km/h
Fluxo livre: 26 km/h
Redução: 27%
Nível: moderado
Atualizado há 2 minutos

Ao clicar:

* selecionar a via;
* abrir detalhes;
* realçar a linha;
* selecionar o registro correspondente no DataGrid;
* rolar o DataGrid até o registro.

⸻

10.6 Painel lateral contextual

Adicionar um painel lateral recolhível sobre ou ao lado do mapa.

Estado inicial:

Resumo do mapa

Ao selecionar uma via:

Detalhes da via

Ao selecionar uma ocorrência:

Detalhes da ocorrência

O painel deve apresentar:

* título;
* tipo;
* status;
* severidade;
* velocidade;
* atraso;
* extensão;
* horário;
* região;
* fonte;
* última atualização;
* ações de navegação interna.

Não abrir múltiplos popups pequenos simultaneamente.

⸻

10.7 Regiões da cidade

Adicionar uma visualização opcional por região:

* Centro;
* Norte;
* Sul;
* Leste;
* Oeste.

Cada região pode receber:

* cor baseada no índice;
* índice regional;
* velocidade média;
* ocorrências;
* quilômetros de lentidão.

Ao passar o cursor:

Zona Oeste
Índice: 62/100
Velocidade média: 21 km/h
48 ocorrências ativas

A divisão regional só deve ser implementada se houver geometria confiável.

⸻

11. Substituição das listas por DataGrids

Criar duas abas principais:

Vias mais congestionadas
Ocorrências

Adicionar futuramente:

Regiões
Histórico

Não manter duas listas simples lado a lado em telas médias, pois isso reduz o espaço horizontal e limita o número de informações disponíveis.

⸻

12. DataGrid de vias

12.1 Colunas

Criar as seguintes colunas:

Coluna	Conteúdo
Posição	Ranking de criticidade
Via	Nome da via
Trecho	Início e fim, quando disponíveis
Região	Região ou zona
Velocidade atual	km/h
Fluxo livre	km/h
Diferença	km/h
Redução	percentual
Lentidão	extensão estimada
Atraso	tempo estimado
Nível	normal, moderado, lento, intenso ou crítico
Tendência	melhorando, estável ou piorando
Atualização	horário relativo
Ações	localizar no mapa e abrir detalhes

⸻

12.2 Aparência das células

Coluna de nível

Utilizar badge com:

* ícone;
* cor;
* texto.

Velocidade

Utilizar número principal e barra proporcional discreta.

Redução

Apresentar:

−27%

com indicador visual.

Tendência

Exemplos:

↑ Piorando
→ Estável
↓ Melhorando

Via

Apresentar:

* nome em destaque;
* trecho na linha secundária;
* ícone de localização;
* ação para localizar no mapa.

⸻

12.3 Recursos do DataGrid de vias

Implementar:

* ordenação por todas as colunas relevantes;
* filtros por coluna;
* filtro geral;
* filtro por nível;
* filtro por região;
* filtro por intervalo de velocidade;
* filtro por tendência;
* redimensionamento de colunas;
* reordenação de colunas;
* ocultação de colunas;
* fixação de colunas;
* cabeçalho fixo;
* paginação;
* densidade de linhas;
* seleção de linha;
* seleção múltipla, quando útil;
* menu contextual;
* exportação CSV;
* restauração do layout;
* persistência das preferências;
* estado vazio;
* skeleton;
* atualização incremental.

⸻

13. DataGrid de ocorrências

13.1 Colunas

Coluna	Conteúdo
Tipo	Ícone e tipo
Ocorrência	Título
Via	Nome da via
Trecho	Localização
Região	Zona ou distrito
Status	Ativa, monitorada, encerrada ou não confirmada
Severidade	Baixa, moderada, alta ou crítica
Início	Data e horário
Duração	Tempo desde o início
Previsão de término	Quando informada
Atraso	Tempo estimado
Extensão	Metros ou quilômetros
Atualização	Última atualização
Fonte	Provedor
Ações	Localizar e abrir detalhes

⸻

13.2 Filtros

Substituir os chips abreviados atuais por filtros mais claros.

Evitar:

Congest.

Preferir:

Congestionamentos

Criar filtros:

* todas;
* críticas;
* acidentes;
* interdições;
* obras;
* congestionamentos;
* outras;
* ativas;
* encerradas;
* sem status confirmado.

Os chips devem exibir contagem:

Interdições 183
Acidentes 0
Obras 1

Categorias com zero podem permanecer disponíveis, porém visualmente desabilitadas ou com baixa ênfase.

⸻

13.3 Separação de status

Criar filtros ou abas:

Ativas
Encerradas
Todas

A visualização padrão deve ser:

Ativas

Não misturar registros encerrados com registros ativos sem indicação clara.

⸻

13.4 Detalhamento expansível

Ao expandir uma linha, apresentar:

* descrição completa;
* localização;
* sentido;
* coordenadas;
* período;
* previsão;
* impacto;
* extensão;
* fonte;
* dados brutos relevantes normalizados;
* mini mapa;
* histórico de alterações, quando disponível.

⸻

14. Toolbar dos DataGrids

Cada DataGrid deve ter uma toolbar com:

[Busca] [Filtros] [Colunas] [Densidade] [Exportar] [Atualizar]

Também apresentar:

310 registros
Atualizado há 2 minutos

Quando houver filtros:

3 filtros aplicados

Disponibilizar:

Limpar filtros

A busca deve funcionar por:

* via;
* trecho;
* título;
* região;
* tipo;
* status.

⸻

15. Integração bidirecional entre mapa e DataGrid

A interação entre mapa e DataGrid é um requisito central.

15.1 Do mapa para o DataGrid

Ao clicar em uma via ou ocorrência:

1. selecionar o registro correspondente;
2. abrir a aba correta;
3. rolar até o registro;
4. destacar a linha;
5. apresentar o painel de detalhes.

15.2 Do DataGrid para o mapa

Ao clicar em uma linha:

1. centralizar o mapa no elemento;
2. ajustar o zoom;
3. destacar a geometria ou marcador;
4. abrir o painel lateral;
5. manter a linha selecionada.

15.3 Filtros sincronizados

Quando o usuário filtrar:

Somente interdições críticas

o mapa deverá mostrar somente as ocorrências correspondentes ou reduzir a ênfase dos demais elementos, conforme a regra definida.

Exibir um indicador:

Mapa filtrado: 8 de 310 ocorrências

⸻

16. Novas visualizações gerenciais

Criar uma seção recolhível chamada:

Análise do trânsito

16.1 Evolução do índice

Gráfico de linha com:

* últimos 30 minutos;
* última hora;
* últimas 3 horas;
* dia atual.

Mostrar:

* índice geral;
* faixas de classificação;
* pontos de atualização;
* tooltip;
* tendência.

⸻

16.2 Velocidade atual versus fluxo livre

Gráfico comparativo:

* velocidade atual;
* fluxo livre;
* diferença;
* períodos recentes.

⸻

16.3 Ocorrências por tipo

Utilizar gráfico de rosca ou barras horizontais.

Categorias:

* interdições;
* acidentes;
* obras;
* congestionamentos;
* outras.

O clique em uma categoria deve filtrar o mapa e o DataGrid.

⸻

16.4 Ocorrências por severidade

Utilizar barras:

Crítica
Alta
Moderada
Baixa

⸻

16.5 Trânsito por região

Utilizar:

* barras horizontais;
* ranking;
* mapa coroplético;
* cards regionais.

Exibir:

* índice;
* velocidade média;
* extensão de lentidão;
* quantidade de ocorrências.

⸻

16.6 Distribuição horária

Caso exista histórico, criar heatmap:

Dia da semana × horário

Isso permite visualizar os períodos mais críticos.

Não criar essa visualização com dados fictícios.

⸻

17. Filtros globais

Criar uma barra global de filtros entre os cards e o mapa.

Filtros sugeridos:

* nível do trânsito;
* tipo de ocorrência;
* severidade;
* região;
* status;
* período;
* somente ocorrências críticas;
* somente vias com redução superior a determinado percentual.

Exemplo:

[Filtros] [Região: Todas] [Severidade: Todas] [Status: Ativas]

Filtros ativos devem aparecer como chips removíveis:

Interdições ×
Alta e crítica ×
Zona Oeste ×

Disponibilizar:

Limpar todos

⸻

18. Estados de interação

Implementar estados visuais consistentes para:

* padrão;
* hover;
* foco;
* pressionado;
* selecionado;
* desabilitado;
* carregando;
* erro;
* dados desatualizados;
* dado estimado;
* dado indisponível;
* ausência de registros.

Os componentes não devem mudar de tamanho ao entrar em carregamento.

⸻

19. Carregamento

19.1 Primeira abertura

Apresentar:

* skeletons dos cards;
* placeholder do mapa;
* skeleton do DataGrid;
* texto de carregamento;
* progresso visual discreto.

19.2 Atualização automática

Não bloquear a tela inteira.

Utilizar:

* pequeno indicador no cabeçalho;
* animação no ícone de atualização;
* texto “Atualizando”;
* manutenção dos dados anteriores.

19.3 Atualização concluída

Mostrar feedback discreto:

Dados atualizados agora

Não utilizar toast em todas as atualizações automáticas.

⸻

20. Dados desatualizados

Quando o cache estiver desatualizado:

* manter os últimos dados válidos;
* mostrar banner;
* marcar o horário;
* alterar o indicador do header;
* permitir nova tentativa.

Exemplo:

Os dados mais recentes não puderam ser obtidos. Exibindo informações atualizadas há 18 minutos.

Os dados não devem permanecer com aparência de tempo real quando estiverem desatualizados.

⸻

21. Estado de erro parcial

As áreas devem falhar de forma independente.

Exemplo:

* cards disponíveis;
* mapa indisponível;
* DataGrid de ocorrências disponível;
* gráfico histórico indisponível.

Mostrar no componente afetado:

Não foi possível atualizar esta visualização.

Disponibilizar:

Tentar novamente

Não substituir todo o dashboard por um único erro quando parte dos dados continuar disponível.

⸻

22. Tooltips e ajuda contextual

Adicionar tooltips para:

* índice geral;
* lentidão estimada;
* fluxo livre;
* velocidade média;
* comparação;
* severidade;
* status;
* última atualização;
* fonte;
* cálculo do índice;
* cálculo da extensão de lentidão;
* filtros;
* camadas.

Exemplo:

Lentidão estimada
Soma aproximada da extensão dos segmentos cuja velocidade atual está abaixo do limite configurado em relação à velocidade de fluxo livre.

Não apresentar tooltips excessivamente longos. Para explicações completas, usar painel de ajuda.

⸻

23. Microinterações

Implementar animações discretas:

* contagem dos números ao carregar;
* transição suave ao alterar filtros;
* realce ao selecionar uma via;
* expansão do painel lateral;
* atualização do gráfico;
* hover dos cards;
* mudança de estado;
* entrada e saída dos clusters.

Duração recomendada:

150 a 250 ms

Respeitar:

prefers-reduced-motion

Não animar continuamente o mapa ou os cards.

⸻

24. Tema escuro

Criar tratamento completo para tema escuro:

* fundo;
* cards;
* bordas;
* tooltips;
* mapa-base;
* grids;
* cabeçalhos;
* filtros;
* seleção;
* hover;
* gráficos;
* labels;
* eixos;
* legendas;
* badges;
* clusters.

Evitar somente inverter as cores.

A paleta semântica do trânsito deve manter contraste adequado em ambos os temas.

⸻

25. Responsividade

25.1 Desktop amplo

Cards em uma linha
Mapa com painel lateral
DataGrid em largura total

25.2 Desktop menor

Card principal maior
Cards secundários em grade
Mapa em largura total
Painel lateral recolhível

25.3 Tablet

Cards em duas colunas
Mapa
Painel de detalhes abaixo
DataGrid com colunas prioritárias

25.4 Mobile

Embora o uso principal seja desktop, o módulo não deve quebrar.

No mobile:

* cards em uma coluna;
* mapa com altura controlada;
* toolbar simplificada;
* filtros em drawer;
* DataGrid convertido para modo responsivo ou cards;
* colunas secundárias ocultas;
* detalhes em tela própria ou drawer.

Não gerar rolagem horizontal global.

⸻

26. Acessibilidade

Implementar:

* navegação completa por teclado;
* foco visível;
* ordem lógica;
* aria-label;
* aria-live para atualizações importantes;
* descrição textual das cores;
* contraste adequado;
* alternativa textual para gráficos;
* cabeçalhos corretos do DataGrid;
* indicação de ordenação;
* mensagens de erro acessíveis;
* suporte a zoom do navegador;
* alvos de clique adequados;
* redução de movimento.

Exemplo:

Índice geral de trânsito: 25 de 100, situação normal, estável.

⸻

27. Densidade visual

Disponibilizar três densidades no DataGrid:

Confortável
Padrão
Compacta

Salvar a preferência do usuário.

A densidade padrão deve permitir leitura adequada sem desperdiçar espaço.

⸻

28. Persistência das preferências

Persistir por usuário:

* filtros;
* ordenação;
* colunas visíveis;
* ordem das colunas;
* largura das colunas;
* densidade;
* camadas do mapa;
* aba selecionada;
* painel lateral aberto ou fechado;
* período dos gráficos.

Utilizar o mecanismo de preferências já existente no DshowDash. Na ausência dele, usar armazenamento local como solução inicial, documentando a limitação.

⸻

29. Performance

A elevação visual não pode comprometer o desempenho.

Implementar:

* lazy loading dos gráficos;
* lazy loading do DataGrid;
* virtualização;
* atualização incremental;
* memoização;
* debounce dos filtros;
* cancelamento de requisições;
* clustering;
* simplificação das geometrias;
* carregamento das abas sob demanda;
* reutilização da instância do mapa;
* destruição adequada de listeners;
* evitar recriação completa do mapa;
* evitar renderização de centenas de componentes fora da área visível.

Metas sugeridas:

Interação inicial: até 2 segundos
Mapa utilizável: até 3 segundos
Aplicação de filtro local: até 300 ms
Ordenação local: até 300 ms
Mudança de aba: até 300 ms

⸻

30. Arquitetura dos componentes

Estrutura sugerida:

traffic-monitor/
├── components/
│   ├── header/
│   │   ├── TrafficPageHeader
│   │   ├── TrafficStatusBadge
│   │   ├── TrafficDataSourceBadge
│   │   └── TrafficRefreshControl
│   ├── cards/
│   │   ├── TrafficIndexCard
│   │   ├── CongestionDistanceCard
│   │   ├── AverageSpeedCard
│   │   ├── ActiveIncidentsCard
│   │   ├── TrafficComparisonCard
│   │   └── MetricSparkline
│   ├── insights/
│   │   ├── TrafficInsightsBar
│   │   └── TrafficInsightItem
│   ├── map/
│   │   ├── TrafficMap
│   │   ├── TrafficMapToolbar
│   │   ├── TrafficLayerControl
│   │   ├── TrafficMapLegend
│   │   ├── TrafficMarkerCluster
│   │   ├── TrafficFlowLayer
│   │   └── TrafficMapDetailsPanel
│   ├── grids/
│   │   ├── CongestedRoadsGrid
│   │   ├── TrafficIncidentsGrid
│   │   ├── TrafficGridToolbar
│   │   ├── TrafficGridFilters
│   │   ├── TrafficGridEmptyState
│   │   └── TrafficGridCellRenderers
│   ├── charts/
│   │   ├── TrafficIndexHistoryChart
│   │   ├── SpeedComparisonChart
│   │   ├── IncidentTypesChart
│   │   ├── IncidentSeverityChart
│   │   └── RegionalTrafficChart
│   ├── filters/
│   │   ├── TrafficGlobalFilters
│   │   ├── ActiveFilterChips
│   │   └── TrafficFilterDrawer
│   ├── states/
│   │   ├── TrafficLoadingState
│   │   ├── TrafficErrorState
│   │   ├── TrafficPartialError
│   │   └── TrafficStaleDataBanner
│   └── accessibility/
│       └── TrafficAccessibleSummary

⸻

31. Design tokens

Criar tokens específicos, integrados ao tema global:

--traffic-status-normal;
--traffic-status-moderate;
--traffic-status-slow;
--traffic-status-intense;
--traffic-status-critical;
--traffic-incident-accident;
--traffic-incident-closure;
--traffic-incident-roadwork;
--traffic-incident-congestion;
--traffic-incident-other;
--traffic-card-background;
--traffic-card-border;
--traffic-card-hover;
--traffic-card-selected;
--traffic-map-panel-background;
--traffic-grid-header-background;
--traffic-grid-row-hover;
--traffic-grid-row-selected;

Não inserir códigos hexadecimais diretamente em múltiplos arquivos.

⸻

32. Formatação dos dados

Padronizar:

57,5 km
35 km/h
7,5%
2 min
20:24
20 de julho, 20:24

Utilizar locale:

pt-BR

Regras:

* uma casa decimal somente quando necessária;
* evitar −0%;
* transformar −0% em 0%;
* usar travessão ou “indisponível” quando não houver dado;
* não exibir null, undefined ou NaN;
* utilizar horário relativo e absoluto no tooltip;
* diferenciar estimativa de dado observado.

⸻

33. Textos e nomenclaturas

Substituir abreviações pouco claras.

Atual

0 acid.
183 interd.
1 obras
Congest.

Proposto

0 acidentes
183 interdições
1 obra
Congestionamentos

No card, usar layout visual para não depender de abreviações.

Corrigir concordância automaticamente:

1 obra
2 obras
1 ocorrência
2 ocorrências

⸻

34. Critérios de aceite visual

A evolução será considerada visualmente concluída quando:

1. o índice geral possuir maior destaque;
2. todos os cards tiverem ícones e hierarquia;
3. as tendências estiverem visíveis;
4. as cores forem utilizadas de forma semântica;
5. os cards não parecerem blocos idênticos;
6. o mapa estiver corretamente enquadrado em São Paulo;
7. a legenda for interativa;
8. as camadas puderem ser controladas;
9. os clusters possuírem melhor comunicação visual;
10. vias e ocorrências possuírem tooltips ricos;
11. existir painel contextual;
12. as listas forem substituídas por DataGrids;
13. os DataGrids possuírem filtros, ordenação e seleção;
14. mapa e grids estiverem sincronizados;
15. existir suporte completo ao tema escuro;
16. a interface funcionar em diferentes resoluções;
17. existirem skeletons e estados vazios;
18. os dados desatualizados forem identificados;
19. os dados estimados forem identificados;
20. não houver inconsistências numéricas aparentes.

⸻

35. Critérios de aceite funcional dos DataGrids

Os DataGrids serão considerados concluídos quando permitirem:

1. ordenação;
2. busca;
3. filtro por coluna;
4. filtros globais;
5. seleção;
6. integração com o mapa;
7. redimensionamento de colunas;
8. reordenação de colunas;
9. ocultação de colunas;
10. densidade;
11. cabeçalho fixo;
12. paginação ou virtualização;
13. exportação CSV;
14. estado vazio;
15. carregamento;
16. erro;
17. atualização incremental;
18. acessibilidade;
19. persistência das preferências;
20. restauração do padrão.

⸻

36. Testes necessários

Testes visuais

Validar:

* desktop amplo;
* desktop pequeno;
* tablet;
* mobile;
* tema claro;
* tema escuro;
* zoom do navegador;
* textos longos;
* muitos registros;
* poucos registros;
* ausência de registros;
* dados parciais;
* números grandes;
* diferentes níveis de severidade.

Testes de interação

Validar:

* clique nos cards;
* clique em clusters;
* clique em vias;
* clique em ocorrências;
* sincronização mapa-grid;
* filtros;
* ordenação;
* busca;
* densidade;
* exportação;
* tela cheia;
* painel lateral;
* camadas;
* atualização manual;
* atualização automática.

Testes de consistência

Validar:

* total de ocorrências versus categorias;
* ocorrências ativas versus encerradas;
* quilômetros versus segmentos;
* índice versus classificação;
* percentual versus velocidade;
* cores versus classificação;
* registros do mapa versus registros do grid.

⸻

37. Etapas de implementação

Etapa 1 — Auditoria

Antes de alterar a interface:

1. mapear os componentes existentes;
2. identificar a biblioteca visual atual;
3. verificar se já existe DataGrid;
4. verificar se já existe biblioteca de gráficos;
5. localizar os tokens do tema;
6. localizar o mecanismo de preferências;
7. identificar os contratos dos dados;
8. revisar os cálculos;
9. revisar as inconsistências;
10. documentar os componentes reutilizáveis.

⸻

Etapa 2 — Correção dos dados

Corrigir:

* ocorrências encerradas;
* composição do total;
* número de segmentos;
* valores ausentes;
* percentuais negativos zero;
* pluralização;
* status;
* classificação;
* referências comparativas.

Não iniciar a camada visual definitiva sobre contratos inconsistentes.

⸻

Etapa 3 — Design system do módulo

Criar:

* tokens;
* paleta;
* badges;
* ícones;
* tooltips;
* cards;
* botões;
* filtros;
* estados;
* densidades;
* padrões de gráfico;
* padrões do mapa.

⸻

Etapa 4 — Cards e cabeçalho

Implementar:

* novo cabeçalho;
* índice principal;
* cards secundários;
* sparklines;
* tendências;
* interações;
* insights.

⸻

Etapa 5 — Evolução do mapa

Implementar:

* novo enquadramento;
* toolbar;
* camadas;
* legenda;
* estilo das vias;
* clusters;
* tooltips;
* painel contextual;
* sincronização.

⸻

Etapa 6 — DataGrids

Implementar:

* DataGrid de vias;
* DataGrid de ocorrências;
* filtros;
* células customizadas;
* estados;
* seleção;
* integração com mapa;
* exportação;
* preferências.

⸻

Etapa 7 — Gráficos

Implementar somente com dados válidos:

* evolução do índice;
* velocidade;
* tipos;
* severidade;
* regiões;
* histórico.

⸻

Etapa 8 — Refinamento

Executar:

* acessibilidade;
* responsividade;
* tema escuro;
* microinterações;
* performance;
* testes visuais;
* testes de consistência;
* documentação.

⸻

38. Restrições

Não:

* alterar a fonte dos dados sem necessidade;
* substituir Leaflet sem justificativa;
* usar cores somente por decoração;
* utilizar gráficos sem finalidade;
* misturar bibliotecas de ícones;
* criar DataGrid do zero sem avaliar a estrutura existente;
* adquirir licença Enterprise sem aprovação;
* exibir ocorrências encerradas como ativas;
* representar dado indisponível como zero;
* utilizar zoom excessivamente amplo;
* recentralizar o mapa durante a análise do usuário;
* recarregar a página inteira;
* recriar a instância do mapa em toda atualização;
* ocultar limitações dos dados;
* sacrificar performance pela aparência;
* inserir números fictícios;
* modificar componentes globais fora do escopo;
* criar um tema separado do DshowDash;
* utilizar animações excessivas;
* depender exclusivamente de cores.

⸻

39. Entregáveis

Entregar:

* auditoria da tela atual;
* lista de inconsistências;
* proposta de arquitetura visual;
* novo cabeçalho;
* novos cards;
* sistema de cores;
* sistema de ícones;
* toolbar do mapa;
* controle de camadas;
* nova legenda;
* painel contextual;
* DataGrid de vias;
* DataGrid de ocorrências;
* filtros globais;
* integração mapa-grid;
* gráficos;
* tema claro;
* tema escuro;
* responsividade;
* acessibilidade;
* testes;
* documentação;
* comparativo visual antes e depois;
* registro das bibliotecas adicionadas;
* análise de impacto no bundle;
* plano de rollback.

⸻

40. Orientação final para o time

Antes de escrever código, apresentar um plano contendo:

* componentes atuais encontrados;
* bibliotecas já instaladas;
* componentes reutilizáveis;
* inconsistências identificadas;
* proposta do novo layout;
* wireframe textual;
* biblioteca de DataGrid escolhida;
* biblioteca de gráficos escolhida;
* biblioteca de ícones escolhida;
* dependências novas;
* impacto no bundle;
* alterações nos contratos;
* alterações no backend;
* riscos;
* fases de implementação.

A implementação deve ser incremental e preservar o funcionamento atual durante a evolução.

A entrega não será considerada concluída apenas pela aplicação de cores, ícones e sombras. O objetivo é transformar a tela em uma ferramenta de monitoramento gerencial robusta, com:

* leitura imediata;
* informações confiáveis;
* navegação intuitiva;
* controles claros;
* exploração detalhada;
* sincronização entre mapa e dados;
* visual sofisticado;
* alto nível de usabilidade;
* consistência com a arquitetura do DshowDash.