# Integração Outlook — Fase 1 (Frontend + operações de mensagens)

> Status: **implementado e buildado** (tsc=0, vite ok, rotas no ar). Testável de ponta a
> ponta só após o Azure (Fase 0 §4). Criado em 2026-07-21. Molde: `panel-pipedrive`.

## 1. Painel React `panel-outlook`
`public/components/panels/panel-outlook/` — React 19 + TS + Vite (mesmo scaffolding do
Pipedrive: `index.js` adapter → `dist` hasheado lido via manifest `no-store`).
- **App** (`src/app/App.tsx`): shell com abas (§5) — E-mails, Dashboard, Modelos, Regras,
  Contas, Configurações. Navegação por hash `#/panel-outlook/<aba>`. Banner "módulo em
  configuração" quando `oauth_configured=false` ou `db_ready=false`.
- **Busca + filtros + seleção em massa** (Emails v1.1.0, §17/§10.2): barra de busca (debounce 350ms,
  `q`), chips de filtro rápido (Não lidos / Hoje / Com anexo / Importantes / Sinalizados → `filter`),
  e seleção múltipla (checkbox por item + barra de ações: marcar lida/não-lida/importante/arquivar/
  excluir-com-confirmação via `POST /messages/bulk-action`). Backend: `MessageService::listMessages`
  ganhou `q` (Graph `$search`+ConsistencyLevel) e `filter` (Graph `$filter`); mock filtra em memória.
- **Central de E-mails** (`src/screens/Emails.tsx`): 3 colunas (pastas / lista / leitura).
  Seletor de contas, pastas bem-conhecidas, lista com paginação (`useInfiniteQuery` +
  skiptoken), ações rápidas (ler/arquivar/excluir), painel de leitura com corpo em
  **iframe `sandbox=""`** (HTML remoto não executa JS — segurança), ações
  (responder/todos/encaminhar/arquivar/não-lida/sinalizar/excluir). Estados graciosos (§19):
  sem conta, vazio, skeleton, "Microsoft indisponível" e "reconectar".
- **Compositor** (`src/screens/Compositor.tsx`): novo/responder/encaminhar; To/Cc/Cco,
  assunto, corpo HTML (contentEditable); validações (destinatário, assunto vazio,
  **menção a anexo sem anexo**, muitos destinatários). Sem envio automático.
- **Contas** (`src/screens/Contas.tsx`): lista contas, conectar (→ authorize_url →
  redirect à Microsoft), reconectar, desconectar, tornar padrão; trata `?outlook_auth=` do
  callback. Botão desabilitado até a configuração concluir.
- Estilo `src/styles/tokens.css` escopado a `[data-ol-react-root]` (dark default + light).

Build: `npx vite build --config public/components/panels/panel-outlook/vite.config.ts`
depois **`chown -R www-data:www-data public/components/panels/panel-outlook`** (obrigatório).

## 2. Pontos de entrada
- **Sidebar**: item `sidebar.outlook` inserido em `ui_nav_items` (grupo
  `sidebar.grp-favoritos`, `order_index=6`, logo **abaixo do DataTables**), rota
  `#/panel-outlook`, ícone `mail`. (A sidebar é DB-driven via `api/ui/navigation.php`.)
- **Router**: rota `/panel-outlook` registrada em
  `router/registry/definitions/routes-dashboard.{ts,js}` (aliases `#/panel-outlook`,
  `#/outlook`). O `panel-outlook` resolve pelo fallback regex de `panel-paths.js`.
- **SW**: `public/sw.js` bump **9.3.68-OUTLOOK-PANEL** + flag `isOutlook` no `bustBundle`
  + `networkFirst` para `/components/panels/panel-outlook/`.
- **Ícone do header REAPONTADO**: `header/components/email-integration/` (edita `.js`+`.ts`) —
  clique `#/status-mail` → `#/panel-outlook`; badge agora = **e-mails recebidos hoje** (§4.1, não
  unread) via `GET /api/outlook/header-counter` (reusa o polling 60s + circuit-breaker existentes);
  tooltip "recebidos hoje / não lidas / última atualização". Sem banco, `/header-counter` degrada
  para 0 limpo. (`#/status-mail` era placeholder `createStatusRoute` — sem perda de função.)

## 3. Backend Fase 1 (novas rotas em `api/outlook/`)
Operações de mensagem — **id sempre em query/body** (IDs do Graph podem conter `/`, que
quebraria o PATH_INFO):
```
GET  /messages?account_id=&folder=&top=&skiptoken=   lista por pasta
GET  /messages/item?account_id=&id=                  abre
GET  /messages/attachments?account_id=&id=           metadados de anexos
POST /messages/send | reply | forward | mark-read | flag | importance | categories
     | move | archive | delete | draft | update-draft | send-draft | bulk-action
GET  /folders?account_id=                            pastas (com contadores)
GET  /header-counter                                 badge "recebidos hoje" (cache Redis ~55s)
```
Serviços: `MessageService` (todas as ops, refresh forçado em 401), `FolderService`,
`MetricsService` (contador do badge; `$count`+`$filter` com `ConsistencyLevel: eventual`).

## 4. Validação feita
- `php -l` limpo em todo `api/outlook/`; `tsc --noEmit` = 0; `vite build` OK (80 módulos).
- Assets do painel servidos (200); rotas `/api/outlook/*` → 401 JSON (alcançam o módulo);
  query do sidebar confirma o item Outlook em #6.
- Ainda **não testável E2E** (sem Azure/DB): com o usuário autenticado, o painel monta e
  mostra "módulo em configuração" + estados vazios (comportamento correto pré-Azure).

## 4b. Modo de testes MOCK (sem Azure/DB)
Ativado por **`OUTLOOK_PROVIDER=mock`** no `.env` (padrão-mock ligado agora). Curto-circuito
isolado em `index.php` → `OutlookMockController` + `OutlookMock` (estado mutável em `$_SESSION`,
por usuário). Serve ~22 e-mails fictícios (pt-BR) na Caixa de Entrada + Enviados, 1 conta corporativa
semeada; **as ações grudam na sessão** (ler/arquivar/excluir/mover/flag/enviar/responder/encaminhar/
rascunho/bulk). "Conectar conta" faz o fluxo real de redirect → callback mock → adiciona conta pessoal.
Badge conta "recebidos hoje" dos fixtures. NÃO toca Graph nem OUTLOOK_DSHOW (caminhos reais ficam
intactos p/ quando o Azure entrar). Reset: `POST /api/outlook/mock/reset`. Para voltar ao real:
`OUTLOOK_PROVIDER=graph` (ou vazio). Validado: harness `scratchpad/mock_test.php` 22/22.

## 4c. Dashboard gerencial (§24) — mock
Tela `src/screens/Dashboard.tsx` (aba Dashboard). Big numbers (recebidos/enviados hoje, não lidos,
importantes, com anexo, total no período, média/dia, tempo médio de resposta) + gráficos **SVG próprios**
(sem lib): evolução por período (barras recebidos×enviados), volume por horário (24 barras), principais
contatos (barras horizontais), status das mensagens. Seletor de período Hoje/7d/30d. Rótulos de eixo em
HTML (evita distorção do `preserveAspectRatio="none"`). Fonte: `GET /dashboard/summary`.
Backend: **mock** computa tudo dos dados da sessão (`OutlookMock::dashboard`, 11/11 no harness); **real**
devolve `available:false` (o dashboard real usa métricas locais da sincronização — Fase 2). Sem lib de
gráfico (mantém bundle pequeno; se preferir Chart.js/ECharts depois, é troca localizada).

## 4d. Modelos de e-mail (§22) — mock
Aba **Modelos** (`src/screens/Modelos.tsx`): biblioteca com busca, filtro por categoria (9 cats §22.1),
cards com favoritar/editar/duplicar/excluir/**Usar**, e editor modal (nome/categoria/assunto/corpo +
**campos dinâmicos** §22.3 inseríveis no cursor via `{{...}}`). "Usar" leva o modelo ao compositor
(estado `modeloPendente` no App → abre compositor em Emails). O **compositor** ganhou botão "📄 Modelos"
com seletor inline que preenche assunto+corpo. Backend: **mock** = CRUD em sessão (`OutlookMock::template*`,
11/11 no harness); **real** = `OutlookTemplateController` placeholder (`available:false`) — modelos são
dados LOCAIS (`outlook_templates`), só precisam do banco (Fase 2), NÃO do Azure. Rotas
`GET /templates` + `POST /templates[/update|/duplicate|/delete|/favorite]`.

## 4e. Categorias e cores (§15) — mock
`src/screens/Categorias.tsx` (ChipsCategorias/MenuCategorias/GerenciarCategorias). Lista-mestra com
cores; **chips coloridos** na lista e na leitura; **filtro por categoria** (seção na coluna de pastas);
**aplicar/remover** categorias na mensagem aberta (menu 🏷️ → `POST /messages/categories`); **gestão**
(criar/renomear/cor/excluir) via modal ⚙️. §15.1: renomear = propaga para as mensagens (no mock, direto).
Backend: `listMessages` ganhou param `category` (mock filtra; real Graph `categories/any(c:c eq '…')`).
**Mock** = CRUD-mestra + tag por palavra-chave (`OutlookMock::categor*`, 12/12 no harness); **real** =
`OutlookCategoryController` placeholder (gestão de categorias-mestras é Graph → Fase 3). Rotas
`GET /categories` + `POST /categories[/color|/rename|/delete]`.

## 4f. Agendamento de envio (§13) — mock
Compositor (msg nova) ganhou botão "🕐 Agendar": data+hora + sugestões rápidas (Em 1 hora / Amanhã 9h /
Próx. segunda 9h) → `POST /messages/schedule` (valida futuro). Pasta **Agendados** na coluna de pastas;
itens mostram destinatário + status (Agendado/Enviado/Cancelado/Falhou) + hora, com ações **Enviar agora**
e **Cancelar**. **Job simulado**: `OutlookMock::processScheduled()` (chamado no listar) migra agendados
vencidos para Enviados. Backend: **mock** = `scheduleCreate/Cancel/SendNow` em sessão (7/7 no harness);
**real** = 503 placeholder (agendamento real = rascunho no Graph + fila/job local §13.1 → Fase 2).
Rotas `POST /messages/schedule[-cancel|-sendnow]`. (Editar agendamento fica p/ um passo seguinte.)

## 4g. Modos de visualização (§6.2)
Controle "🖥️ Exibição" na coluna de pastas (popover): **painel de leitura** À direita (3-col) / Abaixo
(lista em cima, leitura embaixo) / Oculto (lista cheia; leitura abre como overlay ao selecionar); e
**densidade** Confortável / Compacto (compacto oculta o preview e reduz linhas). Preferência salva em
`localStorage` (`ol_layout`/`ol_density`) — o store real é `outlook_user_preferences` (§28.7, Fase 2).
Refactor: `.ol-central` (grid `pastas | conteudo`) + `.ol-conteudo` com variantes `layout-*`; responsivo
atualizado (tablet/celular forçam coluna única + leitura sobreposta). Frontend puro (sem backend); tsc=0.

## 4h. Regras automáticas (§16) — mock
Aba **Regras** (`src/screens/Regras.tsx`): condições (remetente/assunto/corpo contém, tem anexo,
importância alta, categoria) → ações (mover, atribuir categoria, marcar lida/importante, excluir,
parar). Ativar/desativar (switch), reordenar (▲▼), editar/excluir/criar (modal condições+ações),
**Testar** (conta matches na Caixa hoje) e **Aplicar agora** (roda as ativas em ordem sobre a Caixa —
`processa AND das condições`; `stop`/move interrompem a cadeia). Backend: **mock** =
`OutlookMock::rule*`/`rulesApply`/`ruleMatches` (12/12; regra sem condição NÃO casa — segurança);
**real** = `OutlookRulesController` placeholder (Graph `messageRules` = Fase 3). Rotas
`GET /rules` + `POST /rules[/update|/delete|/toggle|/reorder|/test|/apply]`.

## 4i. Configurações + assinatura (§6/§11/§28.7)
Aba **Configurações** (`src/screens/Configuracoes.tsx`, última aba placeholder preenchida):
**Assinatura** (contentEditable + toggle "inserir automaticamente em novas mensagens" + salvar) e
**Exibição** (painel de leitura / densidade — mesmas chaves do ViewOptions, refletem ao voltar à Central).
Preferências em `localStorage` via `src/lib/prefs.ts` (store real = `outlook_user_preferences`, Fase 2).
Integração: o **Compositor** insere a assinatura automaticamente em mensagens novas (mount) quando o
auto-inserir está ligado. `EmBreve` removido do App (todas as abas têm tela real). Frontend puro; tsc=0.

## 4j. Anexos (§20) — mock + real (pequenos)
**Compor**: botão "📎 Anexar" + **drag-and-drop** na área do compositor; lista de anexos (nome+tamanho+
remover); **segurança §20.2**: bloqueia extensões perigosas (exe/bat/js/vbs/msi/…) e dupla-extensão,
limita 10 MB (mock); arquivos lidos como base64 e enviados no payload (`send`/`schedule`).
**Ler**: cards de anexo (ícone por tipo, nome, tamanho) com **download** e **pré-visualização de imagem**
(thumbnail); rota de download serve binário com `Content-Disposition`+`X-Content-Type-Options: nosniff`.
Backend: **mock** = `OutlookMock` guarda anexos na sessão (`listAttachments`/`getAttachment`/`appendSent`/
`scheduleCreate`; download via `MockController::baixarAnexo`; 9/9 no harness, com anexos demo semeados);
**real** = `MessageService::buildMessage` monta `fileAttachment` base64 (anexos pequenos <~3MB inline;
grandes = upload session, Fase 2) + `getAttachmentContent`/`downloadAttachment` via Graph.
Rotas: `GET /messages/attachments?id=` (lista) · `GET /messages/attachment?id=&aid=` (download) ·
`POST /messages/send|schedule` com `attachments[]`.

## 4k. Envio em massa (§23) — mock
Botão "📢 Envio em massa" na coluna de pastas → modal DEDICADO (separado do compositor §23):
lista de destinatários (parse por vírgula/;/linha, **dedup + validação**, contagem de válidos/inválidos),
assunto/corpo, **Cco por padrão**, confirmações (assunto vazio, sem-Cco expõe lista, contagem). Ao iniciar:
**barra de progresso** (poll `/mass/status` a cada 700ms) com processados/sucesso/falha; ao concluir,
resumo + lista de falhas + **exportar relatório CSV**. Backend: **mock** = job por tempo (`OutlookMock::
massStart`/`massStatus`, ~8/s, falha demonstrativa idx%13==5; 9/9 no harness); **real** =
`OutlookMassController` placeholder (fila+throttling+backoff+lotes §23.2 → Fase 3). Rotas
`POST /mass/start` + `GET /mass/status?id=`. ⚠️ferramenta operacional, NÃO plataforma de marketing (§23.2).

## 5. Pendências
- **Dono**: reload do SW (9.3.68) + registrar o app no Azure (Fase 0 §4.1) + provisionar
  `OUTLOOK_DSHOW` (§4.2). Depois: teste E2E conectar/listar/abrir/responder/enviar.
- **Próximo (Fase 2)**: anexos (upload session), agendamento, dashboard, modelos, regras,
  categorias na UI, busca avançada, badge no ícone do header.
