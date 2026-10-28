# 05 — Plano de fases

> Estado em 2026-07-29. Fases 1 e 2 **entregues**; as demais estão descritas com o que as bloqueia.
> Cada item do §10 do briefing (36 entradas de navegação) aparece aqui com a fase em que entra —
> nenhum foi esquecido.

---

## Estado

| Fase | Escopo | Estado |
|---|---|---|
| 0 | Investigação | ✅ `00-fase0-investigacao.md` |
| 1 | Docs 01–05 | ✅ este conjunto |
| 2 | Base visual e mocks | ✅ **no ar** (14 telas, backend mock, sidebar, header) |
| 3 | UX avançada | ✅ **entregue** (menos recursos-timeline, que é licença paga) |
| 4 | Backend real | ◑ **infra pronta e testada**; falta credencial do Google + `GcalDb` |
| 5 | Push e incremental | ⏳ depende da 4 |
| 6 | Integrações internas | ✅ **entregue** — Pipedrive e Koala ao vivo; DSHOW_PROD adiado com motivo medido |
| 7 | Analytics | ✅ **entregue** — 11 relatórios, CSV, impressão/PDF, Sankey e rede D3 |
| 8 | Homologação | ✅ **homologado** — ver [`06-homologacao.md`](06-homologacao.md) |

## Fase 2 — o que foi entregue

**Backend** `api/google-calendar/`: 13 rotas, provedor mock com estado em sessão, provedor real com 503
explícito, `Tz.php`, `GcalCrypto`, `GoogleOAuth` (PKCE pronto, não exercitado).

**Painel** `panel-google-calendar`: 14 telas.

| Tela | Grupo | Entrega |
|---|---|---|
| Hoje | Visão | 6 KPIs, timeline, bloco "próximo compromisso" com contagem regressiva |
| Minha Agenda | Visão | FullCalendar dia/semana/mês, legenda, expediente destacado |
| Próximos | Visão | grade TanStack, 9 colunas, ordenação, densidade, filtros |
| Visão da Equipe | Visão | colunas por calendário de equipe, respeitando acesso |
| Meus Calendários | Calendários | agrupado por tipo, toggle, nível de acesso visível |
| Recursos e Salas | Calendários | capacidade, local, reservas de 14 dias, conflito de recurso |
| Convites | Inteligência | 6 categorias, confirmação com consequências antes de enviar |
| Disponibilidade | Inteligência | matriz pessoa × slot de 30 min, melhores horários clicáveis |
| Conflitos | Inteligência | 5 tipos, severidade, sugestão de tratamento |
| Carga de Reuniões | Inteligência | 3 gráficos ECharts + tabela equivalente |
| Alertas | Inteligência | agenda / organização / técnico, com atalho para a origem |
| Contas Conectadas | Administração | estado, escopos, pendências do provisionamento |
| Sincronização | Inteligência/Adm | estado por calendário, canal, token mascarado |
| Configurações | Administração | expediente, fuso, exibição dupla, visão padrão |

**Fiação**: sidebar (`ui_nav_items`, order 12, grp-favoritos) · ícone do header repontado ·
flag `panel_google_calendar_enabled` · nginx · `.env`.

**Verificação**: `scripts/gcal-smoke-all.sh` — 49 checks determinísticos, 13 rotas em 401,
`php -l` + `tsc` 0 + `node --check`, prova de UI com clique real (14/14 telas, controle Outlook intacto).

## Fase 3 — UX avançada ✅ entregue em 2026-07-30

| Entrega | Detalhe |
|---|---|
| Arrastar / redimensionar / selecionar faixa | `@fullcalendar/interaction` 6.1.21. Diff do `package-lock` conferido: só as 10 linhas do pacote novo, nenhuma dep existente mexida |
| Permissão por evento | `editable` decidido POR EVENTO — `reader`/`freeBusyReader`, cancelado e redigido não se movem (§30) |
| Atualização otimista + rollback | `lib/mutations.ts`: cache volta ao snapshot **e** `arg.revert()` devolve o bloco na tela; toast de salvando/ok/erro (§60) |
| Conflito de versão | 409/412 recarrega a versão atual em vez de sobrescrever (§61) |
| Criação rápida em popover | Ancorado com `@floating-ui`; "Mais opções" leva ao formulário completo **sem perder** o que já foi digitado (§18) |
| Heatmap D3 dia × hora | Rampa sequencial azul validada; célula é `<rect>` com `tabIndex` → navegável por teclado (§39, §65) |
| Cross-filter + drill-down | Clicar numa célula filtra a lista de reuniões daquela faixa; "Limpar seleção" sempre visível (§67, §68) |
| Estado do ícone do header | 7 estados + badge só quando há algo acionável (§8.3, §7.3) |
| Popover dos próximos | 3 compromissos, participantes, link de reunião, ações (§9) |
| Widget na home | Card "Google Calendar" no grid de widgets (§36) |
| Atalhos de teclado | T/A/L/C/X/N/R/B/`/`/Esc, com guarda de digitação (§80) |
| Foco visível e alvo de toque | `:focus-visible` em tudo que recebe teclado; ≥38 px no mobile |
| Mobile | Drawer vira folha inferior, modal em folha, KPIs em 2 colunas, sem scroll horizontal (§79) |

**Não entregue nesta fase, e por quê:**

- **Visão de recursos em linha do tempo** — `@fullcalendar/resource-timeline` é **licença comercial**.
  Decisão do dono: comprar ou construir em D3.
- **Ctrl+K** — medido que `window.Sidebar` **não expõe** `getFeature`, e que a paleta **não abriu**
  no teste com `Control+K`. Registrar comando numa paleta que não abre seria fachada não verificável.
  Fica pendente de investigar por que o atalho global não responde.
- **Editor visual livre de recorrência** — há 6 presets; o editor livre depende de RRULE completo.

### Achado de brinde: bug genérico da home 🔴

`layoutsEfetivos` usava o layout salvo **cru**. Como o objeto salvo não tem entrada para ids que
passaram a existir depois, **todo módulo novo ficava invisível** para quem já tinha arrastado um
widget — não só o Google Calendar; valeria para qualquer módulo futuro. Corrigido na raiz:
o layout salvo é completado com o que falta (entrando abaixo, sem empurrar o que o usuário
organizou) e entradas órfãs são descartadas. Provado injetando um layout salvo com os 11 módulos
antigos: o grid passou a 12 com o novo presente.

⚠️ **Medido:** em `#/` a home monta em modo **imersivo** (`config.home === true`) e a faixa de
widgets não é renderizada — por design. A zona de widgets vive em `#/panel-dashboard`.

### Bloqueio remanescente

**Uma decisão do dono ainda pendente:**

1. **`@fullcalendar/resource-timeline`** — visão de recursos e linha do tempo (§13, §29).
   É **licença comercial**. Alternativa sem custo: construir em D3, já instalado.

Fica também para depois: varredura de acessibilidade com leitor de tela real (o que dá para
verificar por automação já está coberto) e o editor livre de recorrência.

## Fase 4 — Backend real ◑ infraestrutura entregue em 2026-07-30

> ⚠️ **A produção não mudou.** `GCAL_PROVIDER` segue `mock` e as 15 telas continuam idênticas —
> as suítes foram reconferidas depois de tudo. O que está abaixo é infraestrutura pronta,
> aguardando a credencial do Google.

### 🔒 Banco provisionado, com privilégio mínimo

`GCAL_DSHOW` no ar com as **20 tabelas** do `02-banco-GCAL_DSHOW.sql`, e o usuário `gcal_app` com
`SELECT/INSERT/UPDATE/DELETE` **apenas no próprio schema**. Provado que ele:

| Tentativa | Resultado |
|---|---|
| `CREATE TABLE` em GCAL_DSHOW | **negado** |
| `SELECT` em PIPE_DSHOW | **negado** |
| `SELECT` em DSHOWDASH | **negado** |
| DML em GCAL_DSHOW | permitido |

**Este é o primeiro módulo do projeto que não usa o `root` do MySQL** — um passo concreto na
pendência de segurança, ainda que o resto do app siga como está.

`config/db_connection.php` (arquivo **core**) ganhou a entrada. Como ele já causou um 500 app-wide por
ACL, o `chown`/`setfacl` e o health check foram feitos **no mesmo comando** da edição.

### Componentes entregues e testados

| Componente | O que faz | Checks |
|---|---|---|
| `GcalRepository` | contas, tokens cifrados, state+PKCE, calendários, eventos, sync, auditoria | 36 |
| `GcalTransport` | camada de rede **injetável** — é o que torna a fase testável sem Google | — |
| `GoogleCalendarClient` + `GcalNormalizer` | REST v3, paginação, erros, RRULE em pt-BR | 44 |
| `GcalAuthService` | OAuth PKCE ponta a ponta, refresh, revogação | 18 |
| `GcalSyncService` | carga inicial (janela 90/365), incremental, recuperação de 410 | (idem) |

Suítes no runner: `scripts/gcal-fase4-{repositorio,cliente,sync}.php`.

### Por que dá para testar sem credencial

O transporte é injetável. `GcalTransportFake` devolve respostas gravadas **no formato real da Google
Calendar API** e registra o que foi pedido — então dá para afirmar, por exemplo, que a segunda página
foi buscada com `pageToken` e que o incremental **não** mandou `timeMin` junto do `syncToken`. No
go-live só o transporte muda.

### Armadilhas da API do Google, provadas

- **O refresh não devolve `refresh_token`.** Sobrescrever com o campo ausente **apaga a credencial** e
  desconecta a conta em silêncio — o sintoma só aparece no dia seguinte. Resolvido com `COALESCE`.
- **`syncToken` e `timeMin` não podem ir juntos** — o Google recusa.
- **`nextSyncToken` só vem na última página.** Guardar o de uma página do meio faria o próximo
  incremental pular eventos sem avisar.
- **`reminders.useDefault` não é "sem lembrete"** — é "o que o calendário definir".
- **`start.date` ≠ `start.dateTime`.** Dia inteiro não tem hora nem fuso (§48).
- **401 renova UMA vez.** Renovar em laço mascara credencial morta e vira tempestade de requisições.
- **429/403 com backoff e jitter.** Sem jitter, todos os calendários da conta voltam juntos e levam 429
  de novo.

### 🔴 Bug conceitual corrigido

Eu marcava `deleted = 1` para evento **cancelado**, colapsando duas coisas que o §59 pede justamente
para diferenciar: cancelado continua existindo (aparece riscado, entra no relatório de cancelamentos) e
só sai da grade porque a consulta filtra por `status`. `deleted` é para "sumiu da origem". O teste
pegou: o cancelado desaparecia até de `incluirCancelados = true`.

### O que falta para ligar

1. **Credenciais do Google Cloud** — projeto, Calendar API habilitada, OAuth Client ID/Secret e o
   redirect URI `https://dshowdash.com.br/api/google-calendar/accounts/callback`.
2. **`GcalDb`** — o adaptador que serve as 15 telas a partir do banco, em vez do mock. É o único passo
   que **não** dá para verificar de forma significativa sem uma conta conectada: sem dado real, o teste
   provaria apenas que o SQL roda.

Com a credencial no `.env`, a sequência é: conectar conta → `sincronizarCalendarios` → `cargaCompleta`
→ trocar `GCAL_PROVIDER` para `google`.

## Fase 5 — Push e incremental ✅ entregue em 2026-07-30

Fila, canais push, webhook e cron. Detalhe em `03-sincronizacao-e-filas.md`.
Prova: **`php scripts/gcal-fase5-fila.php` — 49 checks, sem credencial do Google.**

### O que entrou

| Peça | Onde |
|---|---|
| Fila com dedup, backoff, `dead` e destrave | `GcalRepository` + `services/GcalQueueService.php` |
| Canais push: abrir, renovar, parar | `services/GcalWatchService.php` |
| Webhook público | `controllers/WebhookController.php` · `POST /webhook` |
| Worker (drena) e cron (agenda) | `scripts/gcal-worker.php` · `scripts/gcal-cron.php` |
| Agendamento instalado | `/etc/cron.d/gcal-sync` (fonte: `docs/GOOGLE-CALENDAR/gcal-sync.cron`) |
| Fila e canais na tela | Sincronização → cartão "Fila e notificações push" |
| Religar canais sob demanda | `POST /sync/watch` |

### Decisões que o código carrega

**Push é otimização, não garantia.** Canal expira em ~1 semana, a entrega pode falhar e o Google
desiste em silêncio. O fallback de 15 min roda mesmo com push ligado — tratar push como garantia é
o que produz agenda silenciosamente desatualizada.

**O webhook só enfileira.** Se ele demorar ou devolver erro, o Google faz backoff e depois para de
enviar. Trabalho pesado dentro da requisição de notificação é o caminho para perder o canal.

**Canal desconhecido responde 200, não 404.** O Google trata 404 como "endereço ruim" e pode derrubar
outros canais do mesmo host; além disso, notificação de canal recém-parado é normal.

**Deduplicação não é enfeite.** Uma edição em lote vira dezenas de POSTs em segundos; a suíte prova
que 21 notificações continuam sendo **um** job.

**Erro permanente morre na primeira.** `notFound`, `forbidden`, `invalid_grant` não melhoram com
retry — insistir 6 vezes só queima cota e enche o log.

**Reconciliação só dentro da janela que a carga cobriu.** Marcar `deleted` fora dela apagaria eventos
que a carga nem olhou: o jeito mais silencioso de esvaziar uma agenda.

### Duas armadilhas medidas aqui

⚠️ **`expiration` do canal vem em MILISSEGUNDOS.** Sem dividir por 1000 a data cai no ano 56.000, a
renovação nunca dispara e o push morre em ~1 semana sem erro nenhum.

⚠️ **`UNIQUE (account_id, calendar_id, stopped_at)` fazia o oposto do que dizia** — ver migração
`02c-migracao-unique-canal.sql`. Não impedia dois canais ativos (NULLs nunca colidem em UNIQUE no
MySQL) e quebrava a renovação quando dois canais paravam no mesmo segundo.

## Fase 6 — Integrações internas ✅ entregue em 2026-07-30

**Primeira vez que o módulo toca dado real.** O evento segue simulado (Fase 2), mas o negócio, a pessoa,
a organização e a proposta que ele referencia são registros **reais** de `PIPE_DSHOW` e do Koala.

`lib/GcalLinks.php` é **somente leitura** — a agenda consulta o CRM, não o administra. A suíte verifica
isso por regex: zero `INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE`.

### O que entrou

| Rota | O que faz |
|---|---|
| `GET /links` | tipos vinculáveis e a fonte de cada um |
| `GET /links/search?q=&tipo=` | autocomplete sobre o CRM real |
| `GET /links/entity/{tipo}/{id}` | ficha lateral (§32.2) |
| `POST /events/{cal}/{evt}/links` | anexa vínculo (idempotente) |
| `DELETE /events/{cal}/{evt}/links/{tipo}/{id}` | remove vínculo |

Na UI: botão **Vincular** na seção "Relacionado" do drawer, busca com filtro por tipo e marca de fonte,
e **ficha expansível** com valor, etapa, responsável, previsão de fechamento e as 5 últimas atividades do
CRM, mais o atalho "Abrir no Pipedrive" que navega no mesmo shell.

### Volumes e desempenho medidos (2026-07-30)

| Fonte | Registros ativos | Custo da busca |
|---|---|---|
| `pipe_deals` | 19.947 | ~50 ms |
| `pipe_persons` | 18.218 | ~2 ms (usa `email_norm`) |
| `pipe_organizations` | 13.062 | ~101 ms (full scan) |
| `koala_proposals` | 12 | desprezível |
| **Busca unificada** | — | **149 ms** |

Debounce de 320 ms no campo: sem ele, cada tecla dispararia um full scan de 19,9 mil negócios.

### Armadilhas de schema (medidas, não supostas)

- 🔴 **`pipe_organizations.name_norm` e `cnpj` estão 100% NULL** (13.063 de 13.063). O índice `ix_name`
  existe e **não serve para nada** — a busca de organização vai por `name` mesmo. Só
  `pipe_persons.email_norm` está preenchido (98%) e vale usar.
- **`pipe_activities` usa `deal_pd_id`**, não `deal_id`.
- **PDO com prepares nativos não aceita o mesmo placeholder repetido** — reutilizar `:q` em três
  condições dá "Invalid parameter number". Um placeholder por ocorrência.

### DSHOW_PROD (clientes/fornecedores) — adiado, com motivo medido

O banco é **remoto** e o handshake sozinho leva **~752 ms**; além disso `ent_cliente` não guarda o nome
(só `id_entidade`), então cada busca exigiria mais um JOIN remoto. Autocomplete que responde acima de um
segundo não é usado: o usuário digita o nome inteiro antes da primeira sugestão. O caminho certo é um
**cache local**, que é trabalho de sincronização (Fase 5), não de vínculo.

### Bug antigo que esta fase revelou 🔴

O `EventoDrawer` usava o **snapshot congelado no clique**. O servidor respondia 201, as listas atrás
atualizavam — e a gaveta seguia mostrando o estado velho, como se a ação não tivesse acontecido. Existia
desde a Fase 2 e valia também para responder convite; só apareceu ao vincular, porque aí o efeito é
visível dentro da própria gaveta. Agora o drawer lê da cache com `initialData`: abre instantâneo e
reflete o servidor a cada `invalidateQueries`.

### Ainda pendente nesta frente

- **Criar atividade no Pipedrive a partir da reunião** (§32.1) — é **escrita** em base de outro módulo;
  exige decisão sobre por onde escrever (API do Pipedrive ou `api/pipedrive`), não é caminho lateral.
- **E-mails do Outlook** (§35) — depende do go-live do Outlook, que segue em mock.
- **Clientes e fornecedores** — ver acima.

## Fase 7 — Analytics ✅ entregue em 2026-07-30

### Relatórios (§64)

`GET /reports` (catálogo) e `GET /reports/{tipo}` (agregado). **A agregação é no servidor** — mandar 90
dias de evento cru para o browser somar é exatamente o que o §77 proíbe, e "participantes" precisaria de
todos os attendees de todos os eventos.

**Contrato único** `{colunas, linhas, totais, serie}` → **uma tela genérica** serve os 11. Onze telas
seriam onze lugares para consertar quando o formato mudasse; assim, relatório novo é um `case` no PHP.

| Grupo | Relatórios |
|---|---|
| Agenda | Eventos · Carga por dia · Distribuição por hora · Duração das reuniões |
| Pessoas | Participantes · Convites |
| Relacionamento | Clientes e negócios (pelo vínculo do §57) |
| Estrutura | Calendários · Recursos e salas |
| Qualidade | Conflitos · Cancelamentos |

Recursos: filtros de período (7/28/90/180 dias), ordenação por coluna, totalizadores, gráfico de apoio,
favoritos (localStorage), exportação e impressão.

Duas decisões que evitam erro de leitura:

- **A formatação vem do `tipo` DECLARADO na coluna**, nunca de adivinhar pelo conteúdo — `0.5` pode ser
  meia hora, meio por cento ou meia unidade.
- **Média de coluna ignora linhas zeradas.** Contar os dias sem reunião derrubaria a "duração média"
  para um número que não descreve reunião nenhuma.

### Exportação (§64.1)

**CSV** com separador `;` e **BOM UTF-8** — sem os dois, o Excel em pt-BR joga tudo numa coluna e escreve
"ReuniÃ£o". Duração sai em **minutos** no CSV (para somar na planilha) e formatada na tela. O arquivo leva
cabeçalho de contexto (título, período, fuso, data de geração), senão vira um órfão na pasta Downloads.

**Impressão / PDF** por `@media print`: esconde o cromo do app e repete o cabeçalho da tabela por página.

**XLSX nativo ✅ entregue em 2026-07-30 — sem dependência nenhuma.**
`GET /reports/{tipo}?formato=xlsx` · gerador em `api/google-calendar/lib/GcalXlsx.php` ·
prova: `php scripts/gcal-xlsx.php` (37 checks) + `proof-gcal-xlsx.mjs` (9 checks ao vivo).

A pendência era sobre pôr **SheetJS no `package.json` raiz** para gerar no browser. Gerando no
**servidor** a pergunta some: `.xlsx` é um ZIP de XMLs (OOXML) e o PHP já traz `ZipArchive`. Zero
dependência nova, e o arquivo é legítimo — não o "xls" que é HTML renomeado e faz o Excel avisar
formato inválido.

**O que o XLSX resolve e o CSV não:** no CSV todo valor é texto e o Excel adivinha o tipo pelo locale
da máquina de quem abre. Aqui número é gravado como **número** e data como **serial do Excel** — soma,
ordena e filtra de verdade, em qualquer locale. Ainda leva cabeçalho congelado, autofiltro, larguras e
linha de TOTAL.

⚠️ **Unidade vai no RÓTULO, nunca no formato da célula.** O formato `%` do Excel multiplica por 100 na
exibição: gravar `42,5` com formato de porcentagem mostraria **4200%**. Por isso a coluna se chama
"Ocupação (%)" e o valor fica cru.

⚠️ **Serial do Excel começa em 1899-12-30**, não 1900-01-01 — o Excel herdou do Lotus 1-2-3 a crença de
que 1900 foi bissexto, e a época deslocada compensa isso sem tratar o caso.

⚠️ **A ordem dos elementos em `styles.xml` é normativa** (numFmts, fonts, fills, borders, cellStyleXfs,
cellXfs, cellStyles). Fora de ordem — ou sem `cellStyles` — o Excel abre em **modo reparado** e descarta
a formatação. Só apareceu na validação cruzada com `openpyxl`, que avisou "workbook contains no default
style"; o gerador próprio não teria como flagrar isso.

### Visualizações D3 (§40, §65)

- **Sankey** origem → formato → desfecho (`d3-sankey`). Cor codifica o **estágio**, não o nó: 12 hues
  seria arco-íris, e dentro de cada coluna a identidade vem do rótulo, sempre visível.
- **Rede de coparticipação** em force layout (`d3-force`), com seleção que atenua o que não conecta.

Ambas **se recusam a desenhar** quando o backend diz `suficiente:false` — o §40 pede que a visualização
só apareça "quando houver dados suficientes e benefício analítico", e Sankey de três fitas ocupa meia tela
sem explicar nada. A rede corta em 30 nós e **informa quantos ficaram de fora**; a simulação tem teto de
4 s, porque força rodando para sempre cozinha CPU num painel que fica aberto o dia todo.

`d3-*` foi para chunk próprio no `manualChunks`: sem isso caía no `vendor`, que **é** baixado no primeiro
paint (164 → 187 kB). Voltou a 164, e a tela Relatórios é `lazy`.

### O que a Fase 3 já tinha coberto

Heatmap de disponibilidade em D3 (§39), cross-filter (§67) e drill-down (§68) foram entregues antes.

### Armadilhas registradas nesta fase

- 🔴 **Especificidade venceu a impressão.** `:root[data-theme=light] [data-gc-react-root]` é (0,3,0) e
  ganhava de `html.gc-imprimindo [data-gc-react-root]` (0,2,1): a folha saía com os tokens do tema.
  Corrigido duplicando a classe → (0,3,1), sem `!important`.
- **Mock precisa de `SEMENTE_VERSAO`.** Sem ela, mudar a semente não chega a quem já tem sessão até o dia
  virar — corrigi o mock, a suíte CLI passou e o navegador seguiu igual.
- **Segunda vez** que um cenário ancorado em dia **corrido** caiu no fim de semana e sumiu (agora no loop
  do passado). Regra: sempre contador de **dias úteis**.

## Fase 8 — Homologação

Segurança, privacidade/LGPD, performance, acessibilidade, fusos (inclusive virada de horário de verão),
recorrência, múltiplas contas, light e dark.

## Itens do §10 ainda sem tela própria

| Item | Onde está hoje | Fase |
|---|---|---|
| Foco, Fora do Escritório, Local de Trabalho | são `event_type`, já renderizados na agenda com ícone e cor | 3 (telas de gestão) |
| Bloqueios de Agenda | idem (evento opaco) | 3 |
| Calendários Compartilhados, Corporativos, Favoritos | agrupados em "Meus Calendários" por `kind` | 3 (separação) |
| Clientes, Pipedrive, Comercial, Fornecedores, Projetos, E-mails | `links[]` já trafega e aparece no drawer | 6 |
| Produtividade | parte em "Carga de Reuniões" | 7 |
| Relatórios | — | 7 |
| Notificações, Permissões, Logs, Auditoria | backend previsto no 02-banco | 4 (Logs/Auditoria), 6 (Notificações) |
| Diretoria | é um calendário de equipe (`freeBusyReader`) | já coberto por "Visão da Equipe" |
