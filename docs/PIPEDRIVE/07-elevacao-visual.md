# 07 — Elevação visual e de UX do Pipedrive Analytics

> Programa de reformulação visual (briefing do dono, 2026-07-22). Documento de continuidade.
> **Fases 1 a 7 concluídas em 2026-07-27.** Pendente: reload + aceite do dono.
> Legenda: ✅ feito · ◑ parcial · 🔜 pendente.

## Decisões travadas (dono, 2026-07-22)
- **DataGrid**: *evoluir o `EntityGrid` atual* (não AG Grid Enterprise/pago; não reescrever em TanStack). Já entrega paginação-servidor, colunas resize/mover/ocultar/salvar, visões salvas, CSV, drawers, filtros avançados. Falta: fixar colunas (esq/dir), linhas expansíveis (master-detail), zebra, densidade, tooltips ricos.
- **Bibliotecas**: *stack completa do briefing*. Já no repo: **lucide-react** (ícones), **echarts** (gráficos, trazido pelo módulo Ads). A instalar nas fases: **@floating-ui/react** (tooltips/popovers), **@fullcalendar/react** (agenda de Atividades), **gsap** (transições especiais). ⚠️Instalar com cuidado — o agente do Ads também edita o `package.json` raiz.

## Fase 1 — Fundação visual
- ✅ (2026-07-22) **Design tokens** ampliados (`tokens.css`): `--pp-space-1..6`, `--pp-radius-sm/md/lg`, `--pp-sidebar-expanded/collapsed`, `--pp-info/neutral`.
- ✅ (2026-07-22) **Sidebar colapsável + agrupada** (`App.tsx v2.0.0`): 4 grupos (Análise/Comercial/Cadastros/Administração), modo compacto (68px, só ícones + tooltip nativo), toggle recolher/expandir, grupos recolhíveis, item ativo (fundo tênue + marcador lateral + `aria-current`), rodapé (status conexão + última sync + versão). Persistência `pp:sidebar:compact` + `pp:sidebar:groups`.
- ✅ (2026-07-22) **Ícones Lucide** substituem TODOS os emojis da navegação (16 telas, tree-shaking).
- ✅ (2026-07-22) **Cabeçalho padrão de página** (`PageHeader.tsx`): ícone da área (Lucide, em quadro tênue) + título + descrição + chip de contagem + slot de ações à direita. Aplicado a TODAS as 16 telas (via `EntityGrid` p/ os 8 grids + cada tela não-grid). Consistência §24.
- ✅ (2026-07-24) **Toolbar única dos grids** (`EntityGrid v5.0.0`): à esquerda busca + filtros (multi/select) + botão "Avançado"; à direita 6 ações em botões-ícone com `aria-label` — **atualizar** (gira enquanto busca), **densidade** (compacta/padrão/confortável, preferência GLOBAL `pp:dens`), **tela cheia** (ancorada no `.pp-shell`, sai com Esc), exportar CSV, visões salvas (com contador), colunas. Abaixo, **chips do filtro ativo** com remoção individual (✕) + "Limpar tudo".
- ✅ (2026-07-24) **Estados padronizados** (`Estados.tsx`): `SkeletonLinhas` (linhas fantasma no `<tbody>`, mantendo cabeçalho e larguras), `SkeletonBloco` (telas de cards), `EstadoVazio` (ícone + título + ação, ex.: "Limpar filtros") e `EstadoErro` (com "Tentar novamente" que refaz a consulta). Aplicado aos 8 grids + Visão Geral, Alertas, Funis, Kanban, Previsão, Rankings e Saúde. Respeita `prefers-reduced-motion`.
  - Prova E2E: `tools/screenshot/valida-pipedrive-toolbar.mjs` (8 verificações, dark+light, 0 erro de console do painel).

## Fase 2 — DataGrid (evoluir EntityGrid)
- ✅ já existe: paginação-servidor, ordenação, busca, colunas resize/mover/ocultar/salvar, visões salvas, CSV, filtros avançados (multi/faixa).
- ✅ (2026-07-24) densidade (compacta/padrão/confortável) — entregue junto da toolbar da Fase 1.
- ✅ (2026-07-24) **`EntityGrid v6.0.0` — Fase 2 completa** (vale para os 8 grids de uma vez):
  - **Fixar colunas (esq/dir)**: alternado no popover "Colunas" (ícones ⇤/⇥), guardado em `pp:cols:{endpoint}.fixadas`; `position:sticky` com deslocamentos calculados, sombra na coluna de borda.
  - **Linhas expansíveis (master-detail)**: expansor por linha; ficha padrão mostra TODAS as colunas (inclusive as ocultas) em grade; `renderDetalhe` permite ficha própria; `semDetalhe` desliga. Expandir não abre o drawer.
  - **Zebra striping** com fundos OPACOS (`--pp-row/-zebra/-hover/-sel`) — requisito das colunas fixas.
  - **Seleção de linhas**: caixa por linha + "marcar página" (com estado indeterminado); barra com contagem, **Exportar seleção** (CSV do que está marcado, sem nova consulta) e limpar.
  - **Totalizadores**: rodapé fixo com soma por coluna (`total: 'soma'`), rotulado **"Σ nesta página"** — é a soma da página, não do filtro inteiro. Ativo em Negócios (Valor, em BRL).
  - **Itens por página**: 25/50/100/200, preferência global `pp:perpage` (backend aceita até 500).
  - **Tooltip em truncados** (`TooltipTruncado.tsx`, **@floating-ui/react** — dep nova no `package.json` raiz): UMA instância por grid com delegação de eventos (uma por célula seriam ~1.800), `strategy:'fixed'` para não ser cortada pelo cartão; só aparece quando o texto está realmente cortado.
  - ⚠️ **Trap de CSS**: `.pp-table thead th.pp-th { position: relative }` (alça de resize) tem especificidade MAIOR que `.pp-table .pp-stk` — sem empatar, o cabeçalho da coluna fixa vira `relative` e o `left` vira deslocamento (cabeçalho 34px fora do corpo). Corrigido com seletores `thead th.pp-stk`/`tbody td.pp-stk`/`tfoot td.pp-stk`.
  - Prova E2E: `tools/screenshot/valida-pipedrive-grid-fase2.mjs` (8 verificações, inclui alinhamento cabeçalho×corpo com desvio 0 rolado e no início; dark+light; 0 erro de console).
- 🔜 restante da Fase 2: virtualização de linhas (só se a paginação de 200 pesar).

## Fase 3 — Entidades (cards de indicadores + colunas ricas + drawer com abas)
- ✅ (2026-07-24) **Cards-resumo por entidade** — backend novo `GET /api/pipedrive/entity-stats?entity=…` (`MetricsRepository::entityStats`, nível 50): 4 indicadores por entidade, **100% SQL na base local, zero chamada à API do Pipedrive**. A entidade é **allow-list** (nunca entra em SQL; só escolhe qual consulta constante roda). Cobertura: pessoas (total/com e-mail/com telefone/novas 30d), organizações (total/com contatos/com negócio aberto/valor em aberto), produtos (total/ativos/usados em negócios/valor vinculado), atividades (total/pendentes/atrasadas/concluídas 30d), leads (total/ativos/convertidos/valor), notas (total/30d/negócios com nota/pessoas com nota). Front: `KpiStrip.tsx` ligado pela prop `statsEntity` do `EntityGrid` (v6.1.0) — se o endpoint falhar, **o strip some e o grid continua** (resumo é acessório).
  - Custo medido: 7–143 ms por entidade, exceto **atividades ~620 ms** (105 mil linhas, sem índice em `done`/`due_date`). Aceitável para 1 consulta por abertura de tela (cache de 120 s no front); se incomodar, um índice resolve — não criei DDL em produção por decisão de risco.
- ✅ (2026-07-24) **Colunas ricas**: avatar de iniciais com cor determinística por nome (`Avatar.tsx`) em Pessoas/Organizações/Usuários; **rótulos legíveis de tipo** em Atividades (mapa call→Ligação, meeting→Reunião, … com fallback para o tipo personalizado do tenant, que neste caso já vem em português).
  - Prova E2E: `tools/screenshot/valida-pipedrive-fase3-cards.mjs` (cards nas 6 telas com valores reais, 6× HTTP 200, avatares com cores distintas, tipos sem inglês, resiliência a 500, dark+light, 0 erro de console).
- ✅ (2026-07-24) **Drawer com abas** (`DrawerShell v2.0.0`, prop `abas` — sem ela o drawer segue como antes): Negócio/Pessoa/Organização com **Resumo · Dados · Relacionamentos · Atividades · Notas · Campos**; Atividade/Lead/Produto com **Resumo · Dados · Relacionamentos** (não têm notas próprias). Contagem em chip por aba, navegação por seta ←/→, `role=tablist/tab/tabpanel`, e **memória da última aba** por tipo (`pp:aba:{tipo}`). Estados padronizados no lugar dos textos soltos.
  - Backend: `personDetail` ganhou `notes`; `orgDetail` ganhou `notes` e `activities` (helper `notasDe()` com allow-list de coluna). Sem isso as abas novas ficariam vazias por falta de dado, não por ausência de registro.
- ✅ (2026-07-24) **Atividades: Grade ⇄ Agenda** (FullCalendar 6.1.21, `Agenda.tsx`): alternador segmentado (preferência `pp:ativ:vista`), calendário mês/semana em pt-BR, cores por situação (pendente/atrasada/concluída), clique no evento abre o drawer, `dayMaxEvents` colapsa dias cheios.
  - **Carga sob demanda**: `React.lazy` + `manualChunks` tira o FullCalendar do vendor — quem fica na grade não baixa os 209 kB (provado: o chunk só aparece na rede após clicar em "Agenda").
  - Backend: `activitiesPage` ganhou `due_from`/`due_to` (validados por regex antes de bindar) — a agenda consulta **a janela visível**, não a paginação da grade.
  - ⚠️ **Teto**: a janela de um mês tem ~2 mil atividades nesta base e o backend limita `per_page` a 500 → a agenda **pagina a janela** (até 3.000, ~6 consultas) e avisa na legenda quando trunca. Sem isso ela mostrava 500 em silêncio.
  - Prova E2E: `tools/screenshot/valida-pipedrive-{drawer-abas,agenda}.mjs` (0 erro de console, dark+light).

### Bug de produção encontrado e corrigido nesta fase
- 🐛 **Busca quebrada (HTTP 500) em Pessoas, Organizações, Produtos e Usuários**: as consultas repetiam o mesmo placeholder nomeado (`:q` em 2–3 colunas) e a conexão usa `PDO::ATTR_EMULATE_PREPARES => false`, que **não aceita placeholder repetido** → `SQLSTATE[HY093] Invalid parameter number`. Negócios/Atividades/Leads/Notas usam `:q` uma única vez, por isso as provas anteriores (que só buscavam em Negócios) passaram. Corrigido com um placeholder por ocorrência (`:q1/:q2/:q3`); as 8 buscas foram reconferidas uma a uma.

## Fase 4 — Visuais gerenciais ✅ (2026-07-27)

> ⚠️ **Duas sessões do Claude pegaram a Fase 4 em paralelo em 2026-07-27.** A que fez o backend
> dos Funis parou e documentou (`08-endpoint-funnel.md`); a outra reconciliou — ficou com o
> `funnelAnalysis()` dela (mais completo) e descartou a implementação duplicada própria.
> Antes de "continuar" qualquer fase, cheque `ps aux | grep "[c]laude"`.

### Fundação de gráficos (`src/viz/`)
ECharts entra no painel do Pipedrive pela mesma receita do panel-ads, sem acoplar os dois builds:
- `echarts-core.ts` — registro **modular** (Line/Bar/Pie/Funnel + Grid/Tooltip/Legend/DataZoom/MarkLine/MarkPoint). ⚠️ **tipo novo de gráfico exige registro aqui**, senão o ECharts falha em silêncio e o cartão fica vazio.
- `EChart.tsx` — import **dinâmico** (chunk assíncrono de 617 kB que só baixa quando um gráfico entra em tela; quem fica nos grids não paga), `ResizeObserver`, resize diferido (rAF + 260 ms) e **reinit ao trocar de tema** (canvas não reage a CSS).
- `tema.ts` — `useTemaPipe()` + `usePaleta()` resolvendo os tokens `--pp-*`. ⚠️ Os tokens são escopados a `[data-pp-react-root]`, **não** ao `<html>`: ler de `documentElement` devolve `""` e o gráfico some.
- `ChartCard.tsx` / `EChartCard` — moldura com título, ações, **exportar PNG**, tela cheia (Esc) e estados. ⚠️ **TRAP:** `.pp-cc-body` tem de ser `flex: 1 1 auto`; com `flex: 1` (basis 0%) a altura inline é sobreposta e o gráfico colapsa.
- `opts.ts` — 7 builders padronizados (`optArea` com zoom, `optColunas`, `optBarras`, `optDonut`, `optCombinado`, `optColunasEmpilhadas` com modo **percentual**, `optFunil`). A paleta entra por parâmetro — nenhum builder lê CSS.
- `tokens.css v1.12.0` — grade `.pp-g12` (12 colunas, cai para 6 abaixo de 1100 px e 12 abaixo de 720), `.pp-cc-*`, `.pp-bn`/`.pp-delta`, `.pp-quick-*`, `.pp-etapa*`, `.pp-table.pp-fixa`.

### ✅ Visão Geral (`VisaoGeral.tsx` v3.0.0)
- **Grade de 12 colunas** ocupando a largura toda (976 px medidos, contra os 640 px do cartão antigo) — critérios §12/§23.
- **Big-numbers ricos** (`BigNumber.tsx`): variação vs. período anterior (chip ▲/▼ com o valor anterior no `title`), **sparkline SVG** (de propósito não é ECharts: 8 instâncias numa faixa de KPIs custam mais que o gráfico principal da tela) e **drill-down**.
- **Seletor de período** 7/30/90/180 dias governando a faixa.
- Backend novo `GET /summary?days=` (`AnalyticsRepository::summary`): KPIs da janela + **a mesma janela imediatamente anterior**. Placeholders **posicionais** (`?`) de propósito — `EMULATE_PREPARES=false` rejeita nomeado repetido, o mesmo bug que quebrou as buscas na Fase 3.
- **Duas classes de número, separadas na UI**: `kpis` são fatos de janela (comparáveis); `estado` ("em aberto agora") é foto do momento e **vai sem variação** — a base não guarda snapshot histórico e inventar um anterior seria fabricar dado.
- Gráficos: ganhos ao longo do tempo (área + zoom, dia/semana/mês), desfecho dos fechados (rosca), valor em aberto por etapa (barras, **clique abre os negócios da etapa**), ciclo de vendas (colunas), ranking de vendedores (barras), uso da API (área).
- Custo medido: `/summary` em **~250 ms** (2 varreduras da janela + 4 séries diárias sobre 20 mil negócios, sem índice em `add_time`/`won_time`/`lost_time`). Aceitável para 1 chamada por abertura com cache de 120 s; **não criei índice em produção** (mesma decisão de risco da Fase 3).

### ✅ Funis (`Funis.tsx` v2.0.0)
Consome o `GET /funnel` descrito em `08-endpoint-funnel.md` (nada foi reimplementado).
- **Chips de funil** com contagem; funis vazios aparecem desabilitados (some ≠ não existe).
- **Funil visual** do alcance por etapa, com a etapa-gargalo pintada de vermelho.
- **Tabela de etapas**: alcance (+% do topo), conversão para a próxima, em aberto e idade média, com faixa e selo no gargalo.
- **Desfecho por etapa** (aberto/ganho/perdido) — factual — e **valor em aberto por etapa**.
- **Comparação entre funis**: colunas **100% empilhadas** + tabela (conversão, ciclo, ticket). ⚠️ A comparação é em **proporção, não volume**: o funil Principal tem ~20 mil negócios e o Prospecção 28 — em escala absoluta os pequenos viravam uma linha invisível. O total de cada um está no tooltip e no chip.
- **Honestidade explícita na tela**: "alcance" é estimativa (assume avanço em ordem, `pipe_deal_history` vazia); abertos/ganhos/perdidos por etapa são fatos. As duas notas ficam no rodapé dos cartões.

### ✅ Alertas (`Alertas.tsx` v2.0.0)
- **Painel de risco**: negócios com alerta, valor em risco, alta severidade, carteira em aberto.
- ⚠️ **Somar o `count` das regras NÃO dá o total em risco** — um negócio parado *e* sem previsão dispara duas. O backend ganhou `alertsResumo()`, que mede **negócios distintos** pela UNIÃO das condições: 268 somando as regras contra **160 distintos** de fato.
- **Rosca de severidade** + **agrupamento alternável** (dono / funil / etapa), tudo sobre os distintos.
- **Filtros rápidos** em dois níveis (severidade → regra) com contagem no chip e "limpar filtros".
- `commercialAlerts()` passou a devolver funil/etapa/dono em cada negócio (contexto na linha, sem segunda consulta). Teclado: cabeçalho e linhas respondem a Enter/Espaço.

### Drill-down (novo, atravessa a Fase 4)
Clicar num indicador leva à tela **já filtrada**, e o filtro **viaja no hash**
(`#/panel-pipedrive/negocios?status=won`): o recorte é compartilhável e o "voltar" do navegador o
desfaz, sem estado escondido em memória. `EntityGrid` ganhou `filtrosIniciais` (aditivo, vale para
os 8 grids) que semeia os filtros e re-aplica quando chega outro recorte com a tela já montada.

### Provas
`tools/screenshot/valida-pipedrive-fase4.mjs` — 20 verificações, dark + light, **0 erro de console do painel**:
grade de 12 col e largura real, 8 big-numbers com variação e sparkline, **canvas “vivo”** (lê o pixel:
um ECharts que falhou fica 100% transparente), seletor de período refazendo `/summary?days=90`,
drill-down conferido pelo hash **e** pela coluna Status do grid, gargalo destacado, nota de metodologia
presente, filtro rápido recortando a lista e gráfico sobrevivendo à troca de agrupamento.
⚠️ O filtro de ruído casa por **etiqueta de módulo do shell** (`[header.`, `[container-main:`), não por
frase solta — um "Fetch failed" vindo do painel tem de reprovar. Todo 4xx/5xx em `/api/pipedrive/`
reprova a prova; a URL de qualquer resposta ruim é registrada.

### Achado para o dono (pré-existente, fora do escopo)
🐛 `403 POST /api/telemetry/collect.php` — **intermitente**, do app-shell, aparece com o painel fechado
também. Não foi tocado nesta fase (não é do Pipedrive), mas está catalogado.

## Fase 5 — Kanban ✅ (2026-07-27)

### 🐛 Defeito de contagem corrigido no backend (`kanbanBoard()` v2.0.0)
O `count` da coluna era o tamanho da **página** (`LIMIT 200`), não o total da etapa — uma etapa com 250 abertos anunciava 200, e o `valor` somava só os 200 trazidos. Agora contagem e soma vêm de um agregado próprio (`GROUP BY stage_id`) e a página é só o que se desenha; o cartão "+ N não exibidos" aparece quando há corte. **Conferido**: quadro = 248, banco = 248.

### ⚠️ Colunas mortas do schema (não confie nelas)
`next_activity_date`, `activities_overdue_count`, `is_stalled`, `no_activity`, `close_overdue` e `possible_dup` **existem na tabela mas o sync NUNCA as popula** (medido: 0 de 252 negócios abertos). Ler delas devolveria "nenhum alerta" em silêncio — parece dado, é vazio. Os sinais do cartão são derivados de `pipe_activities` e das datas do próprio negócio, com as **mesmas regras de `commercialAlerts()`**, para Kanban e Alertas não se contradizerem.

### Uma consulta, não N+1
Os N maiores de **cada** etapa saem numa consulta só: `ROW_NUMBER() OVER (PARTITION BY stage_id ORDER BY value DESC)` numera dentro da etapa e os JOINs/subconsultas caros (dono, org, pessoa, próxima atividade, atrasadas) rodam **apenas sobre o recorte já limitado**. Custo medido: **58 ms** para o funil inteiro.

### ✅ Cabeçalho de coluna rico
Nome, contagem, valor, **participação no valor aberto do funil** (com barra), probabilidade da etapa e **conversão para a próxima**, com a etapa-gargalo destacada (borda + selo).
⚠️ A conversão e o gargalo **não são recalculados aqui** — vêm de `GET /funnel`, o mesmo endpoint da tela de Funis, pelo cache compartilhado (`chaves.funnel`). Dois lugares computando a mesma taxa é exatamente como elas passam a divergir. Se o `/funnel` falhar, o cabeçalho só fica mais magro; o quadro continua.

### ✅ Cartões ricos
Avatar do dono (cor determinística), título, valor, organização/contato, **tempo na etapa**, **próxima atividade** (ou "sem agenda"), contador de atividades atrasadas, **etiquetas** e selos de atenção.
- ⚠️ **Tempo na etapa é honesto sobre a própria origem**: 93 dos 252 abertos não têm `stage_change_time`; nesses o tempo é medido **da criação** e o cartão marca com `*`, explicado na legenda do quadro (não só no tooltip).
- ⚠️ **Só os sinais de peso alto viram selo** (atividade atrasada, fechamento vencido). Cinco selos por cartão não é sinal, é ruído — o resto fica no `title`.
- ⚠️ **A cor da etiqueta é determinística pelo id**, não a do Pipedrive: `pipe_custom_field_options` guarda só id+rótulo (a cor está em `dealFields` e não é sincronizada). Preferi cor estável a chutar semântica que poderia contradizer o CRM. As etiquetas reais deste tenant: Quente, Morno, Frio, Cold, Bad Lead.

### ✅ Densidade, largura total e virtualização
- **Densidade** compacta/padrão/confortável reusando a preferência **global** `pp:dens` — mudar no Kanban muda nos grids, que é o esperado de uma preferência de densidade.
- **Largura total**: colunas com `flex: 1 1 288px` **crescem para dividir a área** quando há poucas etapas e encolhem até o mínimo quando há muitas, aí o quadro rola por dentro (a página nunca ganha rolagem horizontal). ⚠️ `min-width: 226px` é o número que faz 4 etapas caberem nos ~976 px úteis (4×226 + 3×14 = 946); com mínimo maior a última coluna ficava cortada no meio do valor.
- **Virtualização** por coluna (`@tanstack/react-virtual`, já no repo) a partir de 40 cartões. Provado: a coluna Propostas tem **117 negócios e renderiza 11 nós**, e rolar traz cartões novos.
- ⚠️ `min-width: 0` no nome da etapa é o que permite ele encolher: sem isso o item flex usa o tamanho do conteúdo como mínimo e empurra o selo de gargalo e a contagem para fora da coluna.

### Provas
`tools/screenshot/valida-pipedrive-fase5.mjs` — dark + light, **0 erro de console do painel**: largura comparada com a **área útil real** do painel (não com número mágico), contagem de cada coluna conferida **contra a API**, cartões com avatar/tempo/agenda/etiqueta/selo, densidade alterando a altura do cartão **e** persistindo, virtualização reduzindo nós e respondendo à rolagem, e drawer abrindo pelo cartão.

## Fase 6 — Configurações + responsividade + acessibilidade ✅ (2026-07-27)

### ✅ Configurações em SEIS ABAS (`Configuracoes.tsx` v2.0.0)
Conexão · Sincronização · Alertas · Aparência · Segurança · Diagnóstico, com `role=tablist/tab/tabpanel`, roving tabindex, navegação por **←/→ e Home/End** e memória da aba (`pp:aba:config`). Mesma gramática de abas do `DrawerShell v2` — a tela não podia ter um padrão diferente do drawer.
- ⚠️ **Só existe aba para o que o módulo realmente controla.** "Alertas" mostra as regras em vigor **somente leitura**: elas são fixas em `commercialAlerts()` e a tabela `pipe_alert_rules` está **vazia**, reservada para quando a edição existir. Uma aba com controles que não controlam nada seria pior que aba nenhuma.
- "Aparência" governa preferências reais e locais (densidade, itens por página, menu recolhido) e diz na cara que valem **neste navegador** e **ao reabrir a tela** — são lidas na montagem.
- "Diagnóstico" traz marca-d'água por entidade e as últimas rodadas, com atalho para a tela Saúde (não duplica o painel de saúde).
- 🐛 **Corrigido no caminho**: o badge de situação da rodada comparava com `'ok'/'success'`, mas os valores reais em `pipe_sync_runs.status` são **`completed` / `failed`** (6.485 / 5) — toda rodada bem-sucedida apareceria em âmbar, inventando um problema inexistente.

### ✅ Ações com nível de risco (`Abas.tsx` → `AcaoCritica`)
Toda escrita declara risco — **seguro** (drenar fila, reconciliar, sync incremental), **atenção** (sync completa: consome orçamento de tokens; registrar webhook; restaurar preferências) e **crítico** (desconectar integração, remover webhook). Risco crítico **não dispara no primeiro clique**: exige confirmação nomeada, porque não há desfazer do outro lado. A prova E2E cobra isso observando a rede — se um clique em ação crítica gerar POST/DELETE antes da confirmação, o teste reprova.

### ✅ Acessibilidade
Foco visível **uniforme** em todo elemento focável (`:focus-visible`, não `:focus`, para não pintar anel em clique de mouse) — antes só alguns controles novos tinham, e navegar por Tab sumia no meio da tela. `prefers-reduced-motion` desliga a animação do drawer e as transições. Provado: 12 paradas de Tab, 12 com anel.

### ⚠️ Responsividade — e a ZONA MORTA do app-shell (medida, não estimada)
Larguras úteis do painel, medidas: **janela 1600 → 976px · 1280 → 656 · 1000 → 438 · 820 → 258 · 620 → 208 · 480 → 364**.
A sidebar do **app-shell ocupa 312px fixos e só recolhe abaixo de ~480px**. Consequência: entre ~600 e ~820px de janela o painel fica com **208–258px** — mais apertado do que num celular de verdade. Isso não é do painel e não se resolve daqui; quem decide é o shell.
O que foi feito: o painel **degrada com dignidade** nessa faixa (controles encolhem, o que é tabular ganha rolagem própria) e **não estoura** onde tem área. A prova mede as três larguras reais (1600 / 1000 / 480) e ainda **reporta** a zona morta em 820 sem reprovar.
Correções de estouro (§23) achadas medindo, todas clássicas:
- **blowout de grid**: as pistas eram `minmax(0,1fr)`, mas o *item* nasce com `min-width:auto` (= "não encolha abaixo do meu conteúdo") — um cartão com toolbar larga empurrava a grade inteira. Fix: `.pp-g12 > * { min-width: 0 }`.
- cabeçalhos em flex que não podiam quebrar (`.pp-cc-head`, `.pp-alert-head`, `.pp-pagehead-*`);
- textos `nowrap` que passam a caber quebrando linha no estreito.
No celular o menu do módulo vira só ícones e o drawer ocupa a tela (94% medidos) — 580px num visor de 380px era uma fresta.
- Prova: `tools/screenshot/valida-pipedrive-fase6.mjs`.

## Fase 7 — Estabilização ✅ (2026-07-27)

### ✅ Varredura de regressão das 16 telas (`valida-pipedrive-fase7.mjs`)
16 telas × 2 temas: **0 erro de console do painel**, todas com cabeçalho padrão (ícone + título), nenhuma com `<h1>` cru fora do `PageHeader`, e **0 estouro horizontal** em 1600px e em 480px.
Achados corrigidos pela varredura:
- 🐛 **Rankings estourava a área em 1600px**: três tabelas de 7 colunas em cartão de 760px, sem contêiner de rolagem. Agora rolam dentro do próprio cartão (`.pp-tabela-rolavel`).
- **Inconsistência §24**: `Rankings` e `Previsão` ainda mostravam `<h1 className="pp-h1">` cru no estado "não conectado", enquanto as outras 14 usavam `PageHeader`. Padronizados — agora `.pp-h1` só existe dentro do próprio `PageHeader`.

### ⚖️ Virtualização das listas: NÃO, e o porquê está medido
O briefing pedia "performance (virtualização nos volumes: 20k negócios / 18k pessoas / 105k atividades)". Os grids **paginam no servidor** (25–200 por página), então a pergunta real é se a página de 200 pesa.
**Primeira medição deu falso positivo.** Medindo intervalo entre quadros, 200 linhas deu 66ms e o veredito automático foi "PESOU". Só que a série se contradizia: **25 linhas mediram pior (51,8ms) que 100 (40,0ms)**, e o **piso do ambiente sem grid nenhum era 29,3ms** — headless sem GPU, com o ticker de notícias e o relógio do shell animando. Sinal que se contradiz não sustenta decisão.
**Medição determinística** (nós no DOM + reflow forçado da tabela, mediana de 7 amostras):

| página | nós no DOM | reflow | por linha |
|---|---|---|---|
| 25 linhas | 607 | 5,5 ms | 0,220 ms |
| 200 linhas | 3.582 | 25,8 ms | **0,129 ms** |

O custo **por linha cai** com o volume (o overhead fixo se dilui) — é sub-linear, **sem penhasco**. Decisão: **não virtualizar as linhas do grid**. O padrão é 25 linhas; 200 é opção do usuário e cabe no orçamento. Virtualizar um `<table>` com **colunas fixas (sticky), master-detail, totalizadores e `tfoot`** poria quatro recursos funcionando em risco por um ganho não comprovado.
**O que mudaria a decisão** (deixado escrito para a próxima pessoa): se a paginação passar de 200, se o grid algum dia renderizar sem paginar, ou se a medição determinística passar a mostrar custo por linha CRESCENDO com o volume. A prova já falha sozinha se a página de 200 passar de 12.000 nós ou de 120ms de reflow.
O Kanban **é** virtualizado (Fase 5) porque lá o caso é outro: uma coluna traz até 200 cartões ricos de uma vez, sem paginação intermediária.

## Critérios de aceite (§28) — status
1. ✅ sidebar expande/recolhe · 2. ✅ preferência salva · 3. ✅ emojis→ícones consistentes · 4. ◑ mesmo DataGrid (EntityGrid nos 8 grids; cards/abas seguem padrão próprio por design) · 5. ✅ zebra · 6. ✅ tooltip em truncados · 7. ✅ linhas expansíveis · 8. ✅ drawer · 9. ✅ colunas resize/mover/ocultar/fixar · 10. ✅ prefs de colunas salvas · 11. ✅ paginação-servidor · 12. ✅ largura · 13. ✅ Visão Geral mais rica · 14. ✅ Funis conversão/gargalos · 15. ✅ Alertas resumo/severidade · 16. ✅ Kanban cards · 17. ✅ Config em abas · 18. ✅ estados loading/vazio/erro · 19. ✅ responsivo (1600/1000/480 sem estouro; ⚠️zona morta 600–820px é do app-shell, medida e documentada) · 20. ✅ teclado (abas por seta/Home/End, Esc em drawer e tela cheia, cartões e alertas por Enter/Espaço, foco visível uniforme) · 21. ✅ performance (Kanban virtualizado; grids medidos — custo sub-linear, virtualização dispensada com dado) · 22. ✅ identidade Dshow Dash · 23. ✅ sem estouros (varredura das 16 telas em 1600 e 480) · 24. ✅ consistência entre páginas (16/16 com PageHeader + ícone; nenhum `<h1>` cru fora do componente).
