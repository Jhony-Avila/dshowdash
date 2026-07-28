# 06 — Backlog de Melhorias Futuras (Pipedrive Analytics)

> Documento de continuidade. Última atualização: **2026-07-28** (reconciliado com as Fases 1–7 da elevação visual; **#25 entregue**).
> Estado atual do módulo e ideias para as próximas iterações. Legenda:
> **Valor** = ⭐ baixo · ⭐⭐ médio · ⭐⭐⭐ alto · **Esforço** = P (pequeno) · M (médio) · G (grande).
> Status: ✅ feito · ◑ parcial (fatia viável entregue) · 🔜 pendente · 💤 aguarda decisão do dono · ⚖️ avaliado e **decidido não fazer** (com medição).

---

## 0. Estado atual (o que já está pronto)

- ✅ Go-live: full-load (todas as entidades), webhook ao vivo, fila+drain, reconciliação, métricas, deal_products, crons ativos (drain 1min / incremental 15min / reconcile 03:20 / deal-products dom 04:10).
- ✅ **17 abas**: Visão Geral, Alertas, **Rankings**, **Previsão**, **Perdas**, Funis, Negócios, Kanban, Leads, Atividades, Pessoas, Organizações, Produtos, Notas, Usuários, **Saúde**, Configurações. (As Fases 1–7 varreram **16** — a tela **Perdas** nasceu depois da varredura, em 2026-07-27; ela **não** está coberta pela prova de regressão `valida-pipedrive-fase7.mjs`, que continua olhando 16.)
- ✅ (2026-07-22) #28 Rankings dedicados (vendedores c/ conversão+ticket / produtos / organizações) e #29 Previsão de fechamento (valor×probabilidade por etapa e por mês, seletor de funil) — `GET /rankings` e `GET /forecast`, `AnalyticsRepository`/`AnalyticsController`.
- ✅ (2026-07-22) #1 gráfico de **ganhos ao longo do tempo** (SVG próprio, toggle dia/semana/mês) + #43 alimentado por `pipe_metrics_daily`; ◑#2 **Conversão & ciclo** (win-rate, ciclo add→won c/ distribuição, idade/estagnação por etapa) na Visão Geral — `GET /conversion`. ⚠️**taxa etapa→etapa e tempo-por-etapa reais dependem de histórico de transições** (`pipe_deal_history` hoje vazia; só popula por webhooks daqui em diante) → entregue a fatia honesta sobre snapshot+ciclo, sem fabricar fluxo.
- ✅ (2026-07-22) #39 **Painel de saúde da sincronização** (aba Saúde 🩺): estado por entidade (última rodada, watermark, atraso), fila (pendentes/mortos + dead-letter), erros recentes, uso da API 24h, rodadas recentes — `GET /health`, `HealthRepository`/`HealthController`. Entidades esparsas (reconcile/deal_products) marcadas "agendada" (sem falso alarme de atraso).
- ✅ (2026-07-22) #18/#19/#20 **Drawers de Atividade, Lead e Produto** (detalhe + vínculos clicáveis empilhados) — `GET /activities|leads|products/{id}` (`activityDetail`/`leadDetail`/`productDetail`); + #22 **"Abrir no Pipedrive"** em todos os drawers (deal/person/org/lead/product) via `company_domain` (`lib/pipedrive-url.ts`). Atividade não tem deep-link → abre o negócio vinculado.
- ✅ (2026-07-22) #8 **Filtros avançados** (multi-seleção via popover de checkboxes + faixa de valor + faixas de data em painel "Avançado") e #9 **Visões salvas** (nomear/aplicar/excluir combinações de filtros+colunas+ordenação, persistidas por grid) — genéricos no `EntityGrid v4.0.0` (todos os grids ganham visões; backend `dealsPage` estendido p/ `IN`/ranges no grid de **Negócios**). Injeção coberta (validação server-side).
- ✅ Grids server-side com busca, filtros, ordenação, **seletor de colunas (mostrar/ocultar/reordenar)**, **redimensionar coluna**, **export CSV** — tudo persistido por grid.
- ✅ Drawers de detalhe (Negócio com timeline+produtos, Pessoa, Organização) com navegação empilhada.
- ✅ Campos personalizados com nomes/rótulos reais nos drawers.
- ✅ Alertas comerciais derivados de dados reais (5 categorias).
- ⚠️ Token: rotação dispensada pelo dono por ora. Cruzamento com ERP: adiado pelo dono.

### ✅ (2026-07-27) Elevação visual — Fases 1 a 7 concluídas
Fonte do detalhe: **`07-elevacao-visual.md`** (este documento só registra o efeito no backlog).
- **F1 Fundação**: sidebar colapsável agrupada, ícones Lucide (0 emoji na navegação), `PageHeader` nas 16 telas, toolbar única do grid, estados padronizados (`Estados.tsx`).
- **F2 `EntityGrid v6`**: fixar colunas esq/dir, linhas expansíveis (master-detail), zebra opaca, seleção + exportar seleção, totalizadores (`Σ nesta página`), itens por página 25/50/100/200, tooltip em truncados (@floating-ui).
- **F3 Entidades**: cards de indicadores por entidade (`GET /entity-stats`), colunas ricas (avatares, tipos em pt-BR), drawer com abas (`DrawerShell v2`), Atividades em Grade ⇄ Agenda (FullCalendar, carga sob demanda).
- **F4 Visuais gerenciais**: fundação ECharts (`src/viz/`), Visão Geral v3 (grade 12 col, big-numbers com variação e sparkline, `GET /summary`), Funis v2 (`GET /funnel`), Alertas v2 (`alertsResumo()`), **drill-down com filtro no hash**.
- **F5 Kanban v2**: contagem/soma corrigidas no backend, cabeçalho rico, cartões ricos, densidade, largura total, virtualização por coluna.
- **F6 Config + a11y + responsivo**: Configurações em 6 abas, **ações com nível de risco** (crítico não dispara no 1º clique), `:focus-visible` uniforme, `prefers-reduced-motion`, responsivo 1600/1000/480.
- **F7 Estabilização**: varredura das 16 telas × 2 temas (0 erro de console, 0 estouro horizontal).

### ⚠️ Bloqueios de DADO que travam itens deste backlog (não é falta de código)
Três itens abaixo estão presos por tabela vazia, não por esforço. Registrado para ninguém reabrir achando que é implementação:
- **`pipe_deal_history` VAZIA** → trava a taxa etapa→etapa **real** e o tempo-por-etapa **real** (#2, #32). Só popula por webhook **daqui em diante**; o que existe hoje é estimativa honesta sobre snapshot, rotulada como tal na tela.
- **`pipe_alert_rules` VAZIA** → trava as regras de alerta configuráveis (#33). A aba "Alertas" da Configuração é somente leitura de propósito: controles que não controlam nada são piores que aba nenhuma.
- **Colunas mortas em `pipe_deals`** (`is_stalled`, `no_activity`, `close_overdue`, `next_activity_date`, `activities_overdue_count`, `possible_dup`): existem no schema e o **sync nunca as popula** (medido: 0 de 252 abertos). Ler delas devolve "nenhum alerta" em silêncio. Hoje tudo é derivado de `pipe_activities`. **Decisão pendente do dono: popular no sync ou remover as colunas** — deixá-las é uma armadilha para a próxima pessoa.

---

## 1. Dashboards e Visão Geral

| # | Melhoria | Valor | Esforço | Status |
|---|---|---|---|---|
| 1 | Gráfico de **série temporal de ganhos** (valor ganho por dia/semana/mês) com biblioteca de charts leve | ⭐⭐⭐ | M | ✅ |
| 2 | **Funil visual** de conversão (taxa etapa→etapa, tempo médio por etapa) | ⭐⭐⭐ | M | ◑ |
| 3 | **Comparação de períodos** (mês atual × anterior, ano a ano) | ⭐⭐ | M | ◑ |
| 4 | **Seletor de período global** (7/30/90 dias, custom) afetando os tiles/gráficos | ⭐⭐ | M | ◑ |
| 5 | KPIs adicionais: **ticket médio**, **ciclo de vendas médio** (add→won), **taxa de perda por motivo** | ⭐⭐ | P | ✅ |
| 6 | **Metas × realizado** (se houver metas comerciais a importar) | ⭐⭐ | M | 💤 |
| 7 | Gráfico de **ganhos por vendedor / por etapa / por origem** | ⭐⭐ | M | ◑ |

- **#2** (F4, `Funis v2`): entregue o funil visual, a **conversão para a etapa seguinte**, a etapa-**gargalo** destacada e a idade média por etapa. Continua ◑ porque "alcance" é **estimativa** (assume avanço em ordem) e o tempo-por-etapa **real** depende de `pipe_deal_history` — hoje vazia. A tela diz isso no rodapé; não fabricar o que falta é a parte difícil que já está feita.
- **#3** (F4): os big-numbers comparam a janela com **a mesma janela imediatamente anterior** (chip ▲/▼). Falta o recorte por **calendário** (mês atual × mês anterior, YoY), que é outra consulta — a janela deslizante não responde "como foi julho contra junho".
- **#4** (F4): seletor 7/30/90/**180** dias, mas **na Visão Geral**, não global. Falta valer para as demais telas.
- **#5** ✅: ciclo de vendas médio (F4, `GET /conversion`), ticket médio (F4, comparação entre funis) e **taxa de perda por motivo** (tela Perdas, #30) — os três existem.
- **#7** (F4): por **vendedor** ✅ (barras) e por **etapa** ✅ (valor em aberto, clicável). Falta **origem** → é o item **#31**.

## 2. Grids / Tabelas

| # | Melhoria | Valor | Esforço | Status |
|---|---|---|---|---|
| 8 | **Filtros avançados**: multi-seleção, faixa de datas, faixa de valor | ⭐⭐⭐ | M | ✅ |
| 9 | **Saved views** (salvar combinações de filtros/colunas com nome) | ⭐⭐⭐ | M | ✅ |
| 10 | **Exportação Excel (.xlsx)** além do CSV | ⭐⭐ | M | 🔜 |
| 11 | **Colunas de campos personalizados** selecionáveis nos grids (hoje só nos drawers) | ⭐⭐ | M | 🔜 |
| 12 | **Congelar a 1ª coluna** ao rolar horizontalmente | ⭐⭐ | P | ✅ |
| 13 | **Ordenação multi-coluna** | ⭐ | M | 🔜 |
| 14 | **Densidade de linha** (compacto/confortável) | ⭐ | P | ✅ |
| 15 | **Itens por página** configurável (25/50/100) | ⭐ | P | ✅ |
| 16 | **Ações em massa** (selecionar linhas → exportar seleção) | ⭐⭐ | M | ✅ |
| 17 | **Virtualização de linhas** para grids grandes (performance) | ⭐⭐ | M | ⚖️ |

- **#12** (F2): vai além do pedido — fixa colunas à **esquerda e à direita**, escolhidas no popover "Colunas" e persistidas por grid. ⚠️ Depende da **zebra opaca**: com fundo translúcido a coluna fixa deixa o conteúdo passar por baixo.
- **#14** (F2): compacta/padrão/confortável, preferência **global** `pp:dens` — muda no Kanban, muda nos grids.
- **#15** (F2): 25/50/100/**200** (`pp:perpage`); o backend aceita até 500.
- **#16** (F2): seleção por linha + "marcar página" + **Exportar seleção** (CSV do marcado, sem nova consulta).
- **#17** ⚖️ **decidido NÃO fazer nos grids, com medição** (F7): custo por linha **cai** com o volume (0,220 ms/linha a 25 linhas → **0,129 ms/linha** a 200) — sub-linear, sem penhasco. Virtualizar um `<table>` com colunas fixas, master-detail, totalizadores e `tfoot` poria quatro recursos em risco por ganho não comprovado. ⚠️ A **primeira** medição (por frame-timing) deu falso positivo — a série se contradizia e o piso do ambiente sem grid nenhum já era 29,3 ms. **O que reabre a decisão**: paginação passar de 200, grid renderizar sem paginar, ou o custo por linha passar a **crescer** com o volume. O **Kanban É virtualizado** (F5) porque lá uma coluna traz até 200 cartões ricos de uma vez, sem paginação intermediária.
- **#13** conferido em 2026-07-27: **não existe** multi-sort no `EntityGrid` (ordenação é por uma coluna).

## 3. Detalhe / Drawers

| # | Melhoria | Valor | Esforço | Status |
|---|---|---|---|---|
| 18 | **Drawer de Atividade** (detalhe + negócio/pessoa vinculados) | ⭐⭐ | P | ✅ |
| 19 | **Drawer de Lead** (detalhe + status de conversão) | ⭐⭐ | P | ✅ |
| 20 | **Drawer de Produto** (preços, negócios que o utilizam) | ⭐⭐ | P | ✅ |
| 21 | **Timeline enriquecida**: mudanças de etapa, e-mails (quando mailbox entrar), quem/quando | ⭐⭐⭐ | M | 🔜 |
| 22 | Botão **"Abrir no Pipedrive"** (link direto para o registro) | ⭐⭐ | P | ✅ |
| 23 | **Campos personalizados nos drawers de Pessoa/Org** com opções resolvidas (parcial: já resolve valores) | ⭐ | P | ✅ |
| 24 | **Edição inline** (read-write) — hoje é somente leitura | ⭐⭐ | G | 💤 |

## 4. Kanban

| # | Melhoria | Valor | Esforço | Status |
|---|---|---|---|---|
| 25 | **Valor ponderado por probabilidade** por etapa (forecast visual) | ⭐⭐ | P | ✅ |
| 26 | **Filtro por dono / período** no Kanban | ⭐⭐ | P | ✅ |
| 27 | **Indicadores de saúde no card** (parado, fechamento atrasado) com ícones | ⭐⭐ | P | ✅ |

- **#25** ✅ (2026-07-28, `Kanban.tsx v2.1.0` + `tokens.css v1.15.0`) — ponderado por etapa no cabeçalho e total do funil na descrição da página. **Zero backend novo.**
  - ⚠️ **A conta ingênua estava a um passo de ser errada.** `col.probability` já estava na tela, então `valor × prob` parecia o caminho — mas a probabilidade efetiva do backend é `COALESCE(probabilidade DO NEGÓCIO, da etapa, 0)`, e o negócio pode sobrescrever a etapa: **medido, 253 abertos com 43 de probabilidade própria**. A conta no front daria número diferente do da tela **Previsão** para esses 43, e o usuário veria duas previsões discordando sem explicação. **Solução: consumir `GET /forecast`** — a mesma fonte da Previsão, com a chave de cache `['pipe','forecast','all']` **idêntica** à daquela tela (mesmo padrão já usado para `GET /funnel`). Trocar de funil no Kanban não gera consulta nova, e divergir virou impossível por construção.
  - **Só aparece quando informa**: se o ponderado é igual ao valor (etapa a 100%), a linha some — dois números iguais lado a lado é ruído. Neste tenant **4 dos 5 funis têm todas as etapas a 100%**, então o recurso só se manifesta no **Principal** (10% → 60%). A legenda do `≈` diz isso na tela.
  - Números conferidos contra o banco: Principal tem **R$ 11.677.795 em aberto → R$ 3.745.366 ponderado (32%)**; a soma etapa a etapa bate com o total desenhado.
  - Prova: `tools/screenshot/valida-pipedrive-ponderado.mjs` — dark+light, confere cada coluna contra `/forecast` (não contra a própria UI), o total contra a soma **das colunas exibidas** (usar `previsao.totals` somaria todos os funis), cobra a ausência da linha quando seria ruído, e verifica que não estoura em 1600 **nem em 480**.

- **#27** (F5): selos de atenção no cartão + atividades atrasadas + tempo na etapa. ⚠️ Só os sinais de **peso alto** viram selo (atrasada, fechamento vencido) — cinco selos por cartão é ruído, não sinal; o resto fica no `title`. Os sinais usam **as mesmas regras de `commercialAlerts()`** para Kanban e Alertas nunca se contradizerem. ⚠️ **Tempo na etapa é honesto**: 93 dos 252 abertos não têm `stage_change_time` e nesses o tempo conta **da criação**, marcado com `*` na legenda.
- **#26** ✅ (2026-07-28, `Kanban.tsx v2.2.0` + `tokens.css v1.16.0` + backend). Seletor de **dono** (com contagem por dono) e de **previsão de fechamento**; `GET /kanban` ganhou `owner_id` e `prazo`.
  - ⚠️ **O filtro obrigou a estender o `/forecast` junto.** O ponderado do #25 vem de lá; sem passar o mesmo recorte, a coluna mostraria os negócios de um vendedor e o ponderado o da **etapa inteira** — exatamente as duas telas discordando que o #25 existiu para evitar. Agora `/forecast` aceita `owner_id`/`prazo`, e a chave de cache do Kanban só reusa a da tela Previsão (`'all'`) **quando não há filtro**.
  - ⚠️ **48% dos abertos não têm previsão de fechamento** (117 de 248 no funil Principal). Um recorte por data esconderia quase metade do quadro em silêncio. Duas defesas: **"Sem previsão" é um dos recortes** (o balde vira pergunta útil — "quais negócios estão sem data?") e, com qualquer recorte por data ativo, a tela **declara quantos ficaram de fora**.
  - Recortes: qualquer previsão · vencida · fecha este mês · 30 dias · 90 dias · sem previsão. Medidos: 248 / 26 / 24 / 47 / 93 / 117.
  - **Prazo desconhecido não filtra nada** (allow-list no controller *e* no repositório): erra para o lado de mostrar tudo, nunca para o de esconder sem avisar. O SQL sai de constantes — o valor do usuário só escolhe qual string constante roda, nunca é concatenado.
  - O **dono é limpo ao trocar de funil**: um vendedor do funil A não costuma existir no B, e o quadro ficaria vazio sem explicação. Os filtros **não persistem** entre sessões, pelo mesmo motivo.
  - Prova: `tools/screenshot/valida-pipedrive-filtros-kanban.mjs` — confere contra o banco (via API sem filtro), e o teste central **prova que o recorte chegou ao `/forecast`**: exige que o ponderado desenhado seja igual ao `/forecast` **filtrado** e **diferente** do global. Se alguém "otimizar" reusando o cache `'all'`, a prova reprova.

## 5. Inteligência comercial

| # | Melhoria | Valor | Esforço | Status |
|---|---|---|---|---|
| 28 | **Rankings** dedicados (vendedores / produtos / organizações por valor ganho) | ⭐⭐⭐ | M | ✅ |
| 29 | **Previsão de fechamento** (forecast) — valor × probabilidade por etapa e por mês | ⭐⭐⭐ | M | ✅ |
| 30 | **Análise de motivos de perda** (lost_reason agregado, tendências) | ⭐⭐ | P | ✅ |
| 31 | **Análise de origem de leads** (conversão por origem/campanha) | ⭐⭐ | M | 🔜 |
| 32 | **Velocidade do funil** (tempo médio por etapa, gargalos) | ⭐⭐ | M | ◑ |
| 33 | **Alertas enriquecidos**: "sem contato há X dias", "alto valor parado", com cooldown/dedup e regras configuráveis | ⭐⭐⭐ | M | ◑ |

- **#30** ✅ (2026-07-27, `Perdas.tsx` v1.0.0 + `GET /lost-reasons`) — **17ª tela**, no grupo Análise: indicadores + ranking de motivos (quantidade e valor), tendência mensal ("Outros" absorve a cauda) e recortes por etapa/dono/funil com o motivo predominante. A tela **repete** três limites em vez de escondê-los: nem todo perdido tem motivo (participação usa TODOS os perdidos como denominador), o tempo é da criação até a perda (não por etapa — `pipe_deal_history` vazia) e a etapa é a de **fechamento**, com etapa excluída virando "Etapa removida (#id)" em vez de sumir da conta. Prova: `valida-pipedrive-perdas.mjs`.
  - 📌 **Correção de rastreamento**: a revisão de 2026-07-27 deste documento marcou #30 como pendente. Estava errado — a tela foi feita **no mesmo dia, por outra sessão**, e o `07-elevacao-visual.md` (usado como fonte da revisão) não a menciona porque não faz parte das 7 fases. **Lição: conferir o roteador (`App.tsx`) e `api/pipedrive/index.php`, não só o doc de fases.**
- **#32** (F4/F5): **gargalo identificado e destacado** nos Funis e no cabeçalho do Kanban (mesma fonte, `GET /funnel` — dois lugares computando a mesma taxa é exatamente como elas divergem). Falta o tempo médio por etapa **real**, preso em `pipe_deal_history`.
- **#33** (F4): Alertas v2 tem painel de risco, severidade, agrupamento por dono/funil/etapa e filtros em dois níveis. ⚠️ **Somar o `count` das regras NÃO dá o total em risco** — um negócio parado *e* sem previsão dispara duas: 268 somando contra **160 negócios distintos**. Falta o que o item pede de verdade: **regras configuráveis** (presas em `pipe_alert_rules` vazia) e **cooldown/dedup** por negócio.

## 6. Integração com o ERP (§36) — *adiado pelo dono*

| # | Melhoria | Valor | Esforço | Status |
|---|---|---|---|---|
| 34 | **Cruzamento CNPJ/e-mail** de orgs/pessoas com `DSHOW_PROD`/`INTEGRACAO` → tabela `pipe_entity_links` com nível de confiança | ⭐⭐⭐ | G | 💤 |
| 35 | **Visão negócio ↔ cliente do ERP** (faturamento, histórico de compras, inadimplência) — somente consulta | ⭐⭐⭐ | G | 💤 |
| 36 | **Alertas de divergência** (cliente no CRM sem cadastro no ERP, e vice-versa) | ⭐⭐ | M | 💤 |

## 7. E-mails / Mailbox (§17) — *aguarda decisão de escopo*

| # | Melhoria | Valor | Esforço | Status |
|---|---|---|---|---|
| 37 | **Integração Mailbox** — decisão: (a) só e-mails do dono do token, (b) 1 grant/usuário (OAuth), (c) descopar | ⭐⭐ | G | 💤 |
| 38 | **E-mails vinculados a negócios** na timeline (HTML sanitizado/isolado, sem anexos) | ⭐⭐ | M | 💤 |

## 8. Sincronização / Backend

| # | Melhoria | Valor | Esforço | Status |
|---|---|---|---|---|
| 39 | **Painel de saúde da sincronização** (última rodada por entidade, erros, watermark, jobs pendentes/mortos) | ⭐⭐⭐ | M | ✅ |
| 40 | **Reconciliação por presença** para todas as entidades, agendável e com guarda de custo (hoje: deleted-scan de deals + presence opt-in) | ⭐⭐ | M | 🔜 |
| 41 | **Fila de webhooks**: painel de jobs mortos + reprocessamento em massa (hoje: reenfileirar 1 a 1) | ⭐⭐ | P | 🔜 |
| 42 | **deal_products incremental** (só negócios alterados desde a última carga) | ⭐⭐ | M | 🔜 |
| 43 | **Métricas históricas** (`pipe_metrics_daily/hourly`) alimentando os gráficos do dashboard | ⭐⭐ | P | ✅ |
| 44 | **Notas com HTML seguro** (sanitizar e renderizar, hoje é texto puro) | ⭐ | M | 🔜 |
| 45 | **Registros deletados**: capturar `deleted.*` de todas as entidades (hoje webhook cobre; presence opcional) | ⭐⭐ | M | 🔜 |

## 9. Performance / Estabilização (§32)

| # | Melhoria | Valor | Esforço | Status |
|---|---|---|---|---|
| 46 | **Índices** revisados nas colunas de filtro/ordenação (EXPLAIN nas queries dos grids) | ⭐⭐ | P | 🔜 |
| 47 | **Cache Redis** das leituras (overview, metrics, alerts, kanban) com invalidação por sync | ⭐⭐ | M | 🔜 |
| 48 | **Lazy-load** das abas pesadas + code-splitting por tela | ⭐ | P | ✅ |
| 49 | **Skeletons/estados vazios** refinados (loading mais suave) | ⭐ | P | ✅ |

- **#48** (F3/F4): **FullCalendar** (209 kB) sai do vendor por `React.lazy` + `manualChunks` — provado que o chunk só aparece na rede ao clicar em "Agenda"; **ECharts** (617 kB) entra por import dinâmico e só baixa quando um gráfico entra em tela. Quem fica nos grids não paga por nenhum dos dois.
- **#49** (F1, `Estados.tsx`): `SkeletonLinhas` (linhas fantasma no `<tbody>`, preservando cabeçalho e larguras — não há salto de layout), `SkeletonBloco`, `EstadoVazio` com ação e `EstadoErro` com "Tentar novamente" que refaz a consulta. Respeita `prefers-reduced-motion`.
- **#46** agora tem **número medido**, não suspeita — é o item de melhor relação valor/esforço da seção:
  - `GET /summary` ≈ **250 ms** — sem índice em `add_time` / `won_time` / `lost_time` (20 mil negócios).
  - `GET /entity-stats?entity=atividades` ≈ **620 ms** — sem índice em `done` / `due_date` (105 mil linhas). As outras entidades ficam em 7–143 ms.
  - ⚠️ DDL em produção **não foi executado de propósito** (mesma decisão de risco das Fases 3 e 4). Criar índice é decisão do dono/DBA, com janela.
- **#47**: hoje o que existe é **cache de 120 s no front**, não Redis. Vale medir se ainda é problema **depois** de #46 — índice barato pode tornar o cache desnecessário.

## 10. Segurança / RBAC / Governança

| # | Melhoria | Valor | Esforço | Status |
|---|---|---|---|---|
| 50 | **Permissões granulares** (`pipedrive.*` por tela/ação) além do gate por level | ⭐⭐ | M | 🔜 |
| 51 | **Auditoria** de acessos e ações administrativas do módulo | ⭐⭐ | M | 🔜 |
| 52 | **Gestão do token**: alerta de expiração, lembrete/rotina de rotação | ⭐⭐ | P | 💤 |
| 53 | **Feature flag / kill-switch** por tela (habilitar gradualmente para outros usuários) | ⭐⭐ | P | 🔜 |

## 11. UX / Acessibilidade / i18n

| # | Melhoria | Valor | Esforço | Status |
|---|---|---|---|---|
| 54 | **Responsividade** mobile/tablet (grids e drawers) | ⭐⭐ | M | ✅ |
| 55 | **Atalhos de teclado** (busca global Ctrl+K, navegação entre abas) | ⭐ | M | ◑ |
| 56 | **Command palette** para pular direto a um negócio/pessoa/organização | ⭐⭐ | M | 🔜 |

- **#54** (F6): sem estouro horizontal em 1600 / 1000 / 480 px (medido nas 16 telas × 2 temas). No celular o menu do módulo vira só ícones e o drawer ocupa **94% da tela** (580 px fixos num visor de 380 px era uma fresta).
  - ⚠️⚠️ **ZONA MORTA DO APP-SHELL — não é do painel e não se resolve daqui.** A sidebar do shell ocupa **312 px fixos** e só recolhe abaixo de ~480 px. Larguras úteis medidas: **1600 → 976 px · 1280 → 656 · 1000 → 438 · 820 → 258 · 620 → 208 · 480 → 364**. Entre ~600 e ~820 px o painel recebe **208–258 px** — mais apertado do que num celular de verdade. O painel **degrada com dignidade** nessa faixa e a prova **reporta** sem reprovar. **Quem decide é o shell** — vale para QUALQUER painel, não só este.
  - ⚠️ **Blowout de grid**: `minmax(0,1fr)` na pista **não basta** — o item nasce com `min-width:auto`. Precisa de `.pp-g12 > * { min-width: 0 }`.
- **#55** (F6): abas por **←/→ e Home/End** ✅ (drawer e Configurações), **Esc** em drawer e tela cheia ✅, cartões e alertas por Enter/Espaço ✅, `:focus-visible` uniforme ✅ (12 paradas de Tab, 12 com anel). Falta a **busca global Ctrl+K** — conferido em 2026-07-27: não existe atalho Ctrl/Cmd+K no painel. (O módulo **DataTables** tem Ctrl+K; é outro painel, não reaproveita.)
- 📌 **#55/#56 — antes de construir paleta nova, leia isto**: o **app-shell já tem uma paleta Ctrl+K**, em `components/sidebar/features/command-palette.js` (BEM `.dsd-command-palette__*`), com comandos de navegação. ⚠️ **Existe uma segunda, `container-main/utils/command-palette-manager` (`.dsd-cp-*`), que NÃO está montada** — investigar aquela é red herring conhecido. ⚠️ A sidebar é servida **bundlada** (`sidebar/dist/sidebar.bundle.js`); o `.js` cru não é carregado. Então #56 provavelmente é **registrar comandos na paleta existente**, não construir uma no painel — decidir isso antes de estimar.

## 12. Exportação / Relatórios

| # | Melhoria | Valor | Esforço | Status |
|---|---|---|---|---|
| 57 | **Relatórios agendados** por e-mail (§38) — resumo semanal do pipeline, alertas | ⭐⭐ | G | 🔜 |
| 58 | **Fila de exportação** (§37.4) para exports grandes (assíncrono, download quando pronto) | ⭐⭐ | M | 🔜 |
| 59 | **Exportar o Kanban / a Visão Geral** (PDF/imagem) para apresentações | ⭐ | M | 🔜 |

---

## 13. Itens novos, levantados pelas Fases 1–7 (não estavam no catálogo)

| # | Item | Valor | Esforço | Status |
|---|---|---|---|---|
| 60 | **Zona morta do app-shell (600–820 px)**: sidebar de 312 px fixos deixa 208–258 px úteis a QUALQUER painel | ⭐⭐⭐ | M | 💤 |
| 61 | **Colunas mortas em `pipe_deals`**: popular no sync **ou** remover do schema (hoje são armadilha silenciosa) | ⭐⭐ | P | 💤 |
| 62 | **Índices medidos** em `add_time`/`won_time`/`lost_time` (deals) e `done`/`due_date` (activities) — DDL em produção | ⭐⭐ | P | 💤 |
| 63 | 🐛 **`POST /api/telemetry/collect.php`** — investigado 2026-07-28: **não é intermitente, a telemetria NUNCA persistiu**. Causa corrigida na fonte; publicar depende de decisão do dono (ver abaixo) | ⭐⭐⭐ | G | ◑ |
| 64 | **Cor real das etiquetas**: `pipe_custom_field_options` guarda só id+rótulo (a cor vive em `dealFields`, não sincronizada) — hoje a cor é determinística pelo id | ⭐ | P | 🔜 |

⚠️ **#60 a #63 são decisões do dono/DBA, não trabalho de painel.** Estão aqui para não se perderem.

- **#63** investigado em **2026-07-28**. O ticket dizia "403 intermitente"; a medição no access.log (rota ancorada) mostrou **15 dias, 1.755 POSTs e ZERO 200** — 921× 401, 833× 403. A telemetria **nunca persistiu um evento**. Causa: `transport/send.ts` não envia `X-CSRF-Token` e o endpoint exige `requireCsrf()` (o fallback `$_POST['csrf_token']` não vale — o corpo é JSON). Ficou 15 dias invisível porque o transporte devolvia **`success: true`** ao descartar o lote. Corrigido na fonte (**v5.3.0-CSRF**: header no `sendBatch`, `fetch(keepalive)` no lugar do `sendBeacon` — que não envia cabeçalho e por isso dava 403 estrutural —, métricas e check de saúde). Provas: `tools/screenshot/valida-telemetria-csrf.mjs` (sem CSRF → 403; com CSRF → 200, `inserted 1`).
  🔴 **A correção NÃO está no ar.** Os 21 targets core têm cadeia de build circular (`_entry.ts` → `index.js` → o próprio `dist/*.bundle.js`), então rebuild re-empacota o bundle e ignora as fontes; e a fonte agregadora do `telemetry-core` (`Telemetry`, `createLegacyAdapter`) **foi perdida** — só existe no bundle minificado. Medido em `valida-telemetria-runtime.mjs`: fonte `5.3.0-CSRF`, no ar `5.1.1`, 4 envios, 0 com CSRF. **Decisão do dono**: reconstruir o agregador do telemetry-core ou consertar a cadeia de build dos bundles core — as duas mexem no boot do app e passam longe de "P".

---

## Sugestão de sequência (revisada em 2026-07-27, pós-Fases 1–7)

Os quick wins de UI acabaram — as Fases 1–7 os consumiram. O que sobra se divide em três grupos:

**A. Barato e com dado na mão (fazer primeiro)**
1. **#62 Índices** — os dois pontos lentos estão medidos (`/summary` 250 ms, `entity-stats?atividades` 620 ms). É DDL curto com ganho conhecido; só falta janela e aval do DBA.
2. ~~**#25 Valor ponderado no Kanban**~~ ✅ **feito em 2026-07-28** (ver §4).
3. ~~**#30 Motivos de perda** + **#5**~~ ✅ **já estavam feitos** (tela Perdas, 2026-07-27) — ver §5.
4. **#41 Reprocessar jobs mortos em massa** — hoje é 1 a 1; a tela de Saúde já lista os mortos. **É o próximo do grupo A.**
5. **#26 Filtro por dono / período no Kanban** — o quadro tem só o seletor de funil; com o ponderado (#25) na tela, filtrar por dono passa a responder "qual a minha previsão".

**B. Depende de decisão do dono (não começar antes)**
5. **#61** popular-ou-remover as colunas mortas · **#60** zona morta do shell · **#63** telemetria 403.
6. **#33 regras de alerta configuráveis** — só faz sentido depois de decidir que `pipe_alert_rules` passa a ser a fonte.

**C. Espera o dado acumular (não é esforço, é calendário)**
7. **#2 / #32** taxa e tempo por etapa **reais** — `pipe_deal_history` só popula por webhook daqui em diante. Reavaliar quando houver algumas semanas de transições. Até lá, a estimativa rotulada em tela é a resposta certa.

Depois disso, os estratégicos de maior porte: **Cruzamento ERP** (#34–#36) e **Mailbox** (#37–#38), quando houver decisão de escopo.

> Total: **64 itens** catalogados — **24 ✅ · 8 ◑ · 1 ⚖️ · 20 🔜 · 11 💤** (contados no próprio arquivo, não estimados).
> Priorize por Valor↑ / Esforço↓, mas leia antes o bloco "Bloqueios de DADO" da seção 0: três dos itens abertos não são questão de esforço.
