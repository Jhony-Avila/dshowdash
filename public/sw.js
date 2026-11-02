// DshowDash - Service Worker
// @version 9.0.0-ENTERPRISE
// v9.0.0: stale-while-revalidate for component JS/CSS — serves from cache immediately, updates in background
// v8.7.0: Force cache invalidation — panel-nav-admin precache + polling resume fix in header.bundle
// v8.6.0: Force cache invalidation for panel-nav-admin v11.3.0-ESSENTIAL-IMPROVEMENTS (toast, undo, validation, audit-history)
// v8.5.0: Force cache invalidation for panel-nav-admin v11.0.0-FULL-MIGRATION integration
// v8.4.0: Force cache invalidation for NavRail v4.1.0-ARMORED + LOCAL_EVENTS migration
// v8.3.0: Force cache invalidation for NavRail v4.0.0-ARMORED
// v8.2.0: Removed orphan enhancements references (P0 cleanup)
// v2.7.0: Force cache invalidation after environment-manager fix
'use strict';

var MODULE_ID = 'dshowdash-service-worker';
// v9.0.1: cache-bust de bundles immutable via ?swv — resgate automatico do SW zumbi v9.0.0
// v9.0.2: weather-fx em iteração ativa -> networkFirst (sempre fresco; casa com no-store nginx).
// v9.1.0: go-live weather-fx — volta a SWR (cai na regra genérica /components/); bump limpa cache velho.
//         Bump limpa o cache velho no activate (scene-factory.js Lote A stale nos 5 estados novos).
// v9.2.0: INCIDENTE theme-toggle 2026-07-05 — o toggle v2 (index.js, NÃO-bundle) ficou preso via SWR +
//         HTTP immutable (bustBundle só cobre *.bundle.js) e travava o boot. Bump PURGA o Cache Storage
//         velho no activate (skipWaiting+claim), soltando index.html/v2 presos. Toggle desativado no index.html.
// v9.2.1: HARDENING raiz — bustBundle passa a cobrir módulos /assets/js/core/*.js (não só *.bundle.js),
//         resgatando clientes que já têm o immutable velho em cache. Casa com nginx no-cache nesses paths.
// v9.2.5: THEMESWEEP 2026-07-06 — bump p/ reforçar propagação do theming de painéis (theme.light-total.css ?v=29).
//         Novo CACHE_NAME -> o activate purga todos os caches dshowdash-* antigos (skipWaiting+claim), soltando
//         qualquer CSS de painel preso via SWR. O ?v da folha já furava o CF; o bump garante clientes com cache velho.
// v9.2.6: WFX-NETFIRST 2026-07-06 — weather-fx volta a networkFirst no getStrategy (intro "Weather Reveal" +
//         flash-herói em iteração). Sem isto o SW pinava o .js velho via SWR e as mudanças não propagavam
//         (mesmo com no-store nginx + purge CF). Bump purga os caches velhos e ativa a nova regra.
// v9.2.7: HEADERLIGHT 2026-07-08 — correção do header no LIGHT (theme.light-total.css ?v=31: botões só-ícone
//         transparentes + sombra clara nas pílulas). index.html é servido por SWR e apontava para o ?v antigo;
//         o bump (novo CACHE_NAME) purga o index.html preso no activate p/ os clientes receberem o ?v=31.
// v9.2.9: SIDEBAR-PURPLE 2026-07-08 — some com o "retângulo roxo" no item ativo da sidebar. A CSS foi corrigida
//         (sidebar.bundle.css) e todas as referências passaram a ?v=20260708 (index.html + loader + dist Iu).
//         O CSS ficava preso pelo max-age=14400 do CF (URL fixa); o bump purga os caches e o bustBundle
//         (?swv) força o dist/sidebar.bundle.js fresco, que agora injeta a CSS versionada. Um só <link>.
// v9.3.0: GESTAO-PAINEIS-CARDS 2026-07-08 — no LIGHT o panel-gestao-paineis ficava dark: (1) cards
//         (.pgp-card/__thumb) com fundo #1a1a2e (azul-marinho) = blocos escuros na grade; (2) MODAL de
//         detalhe (.pgp-modal) com fundo #1a1a2e/#2a2a3e E texto hardcoded #f1f5f9 = invisível no claro.
//         theme.light-total.css ?v=33 remapeia FUNDO+TEXTO dos dois p/ light (thumbnails <img> dark = dado,
//         intocados; scrims e acentos roxo/azul preservados). Bump (novo CACHE_NAME) purga o index preso
//         via SWR p/ entregar o ?v=33. DARK 100% intocado.
// v9.3.1: Painel de cotação (currency-panel) — novo módulo standalone no header (Dólar/Yuan/BTC).
// v9.3.2: Painel de cotação agora abre NO CONTAINER-MAIN como painel nativo (panel-cotacao-{dolar,yuan,btc}),
//         montado pelo PanelLifecycleController via navegação nativa; a ponte no header só dispara navigateToRoute.
//         Precache dos módulos do painel (shared + 3 bindings) p/ abertura <300ms. Bump purga index/bridge stale.
// v9.3.3: SESSION-ADMIN-MOUNT 2026-07-08 — painel Gestão de Sessões deixou de MONTAR (JS) e o endpoint
//         dava 500. Fix 2 camadas: (backend) helper requireMethod() faltante em AuthHelpers.php (500→200);
//         (frontend) adapter Template.render() em ui/template.js (contrato quebrado: lifecycle chamava export
//         inexistente). Bump purga o lifecycle.js/template.js stale via SWR. NOTA: contrato de DADOS
//         (envelope data.data + campos token_preview/origin_ip/is_active) ainda dessincronizado → tabela
//         vazia; reconciliação é redesign à parte (ver memória session-admin-quebrado-2-camadas).
// v9.3.4: LIGHT-RESIDUOS 2026-07-08 — theme.light-total.css ?v=34 (bloco L6): resíduos dark provados no
//         light de painéis tratados — nav-admin (.pna-input/.pna-select fundo rgba(15,18,30,.6)) e
//         audit-trail (.pat-health-summary/.pat-actions-cluster rgba(0,0,0,.5)). Bump purga o index preso
//         via SWR p/ entregar ?v=34. DARK intocado.
// v9.3.5: WORLD-CLOCK-MAP 2026-07-08 — novo módulo standalone /components/world-clock-map/ (mapa-múndi
//         acionado pelo clique no relógio do header, por delegação; não toca no real-time-clock nem no
//         bundle do header). Mapa SVG (Natural Earth 110m, domínio público), terminator dia/noite em JS
//         puro, horários IANA/Intl, relógio em destaque, busca e cidades fixadas (/api/user/preferences).
//         Bump purga o index preso via SWR p/ entregar o novo <script>. Precache dos 12 módulos p/ abertura
//         instantânea + offline.
// v9.3.6: SESSION-ADMIN-DATA 2026-07-08 — reconciliação do contrato de DADOS do painel Gestão de Sessões
//         (3ª camada). backend-api.js: envelope corrigido (data.data) + normalizador (token_preview→
//         session_token/id, origin_ip→ip_address, device_type→device, last_activity_at→last_activity,
//         is_active→status, is_current). lifecycle.js: loadMySessions → SET_SESSIONS (backend não tem
//         scope/admin; SET_MY_SESSIONS era no-op). template.js: adapter deriva currentSessionToken de
//         is_current. Bump purga os .js do painel stale via SWR. Verificado ao vivo: tabela popula, sessão
//         atual marcada, 0 erros/500. NOTA: revoke individual é impossível (token mascarado) — só revoke_all.
// v9.3.7: WCM-CONTAINER-MAIN 2026-07-08 — a pedido do dono, o Relógio Mundial abre NO CONTAINER-MAIN como
//         painel nativo (não em overlay). Ponte world-clock-map/index.js agora só navega p/
//         #/panel-relogio-mundial; motor movido p/ world-clock-map/panel.js (createWorldClock, contrato
//         mount/unmount igual panel-cotacao); novo binding /components/panels/panel-relogio-mundial/index.js
//         (import por convenção). Bump entrega a ponte nova + precache do panel.js e do binding.
// v9.3.8: SESSION-ADMIN-LIGHT 2026-07-08 — theme.light-total.css ?v=35 (bloco L7): painel Gestão de Sessões
//         (.psa) era 100% dark no tema light (nunca renderizava antes do fix de mount+dados). Remapeados os
//         tokens --psa-* (fundos/texto/bordas) sob [data-theme=light] .psa; acentos/status preservados.
//         Bump purga o index preso via SWR p/ entregar o ?v=35. DARK intocado.
// v9.3.9: FOOTER-NAVFX 2026-07-08 — botões do footer (.footer-icon-host) passam a adotar os
//         efeitos de interação da NAVRAIL (hover halo lilás, pressed, focus-visible, transições)
//         via padrão COMPARTILHADO novo /components/_shared/nav-fx/nav-button-fx.css, importado
//         pelo footer/styles/index.css (?=v9.4.0-NAVFX). Bump (novo CACHE_NAME) purga o index.css
//         do footer preso via SWR p/ entregar o novo @import. Navrail INTOCADA. DARK+LIGHT.
// v9.3.10: MEU-PERFIL-MOUNT 2026-07-08 — o painel "Meu Perfil" (panel-user-profile) não abria: o mount()
//         fazia `new UserProfileComponent({ container: any, config })` — resíduo TS→JS onde `any` (tipo)
//         virou VALOR, lançando ReferenceError: any is not defined ao montar (node --check passava, pois
//         é erro de runtime). Fix cirúrgico em index.js/index.ts: `{ container, config }`. Painel é servido
//         cru (sem dist) -> bump (novo CACHE_NAME) entrega o index.js corrigido. Rota/handler já OK.
// v9.3.11: WCM-DARK-MAP 2026-07-08 — Relógio Mundial no DARK não mostrava o mapa: os tokens --wcm-ocean/
//          --wcm-land só resolviam sob :root[data-theme="light"]; no dark o :root base não aplicava (fill
//          caía p/ preto sobre fundo quase-preto). Fix: bloco explícito :root[data-theme="dark"],.theme-dark
//          em world-clock-map.css (mesma especificidade do light). Verificado ao vivo dark+light (mapa +
//          terminator + 19 chips). Bump entrega a CSS via SWR. LIGHT intocado.
// v9.3.12: SESSION-ADMIN-TERMINATE 2026-07-08 — removido o botão de encerrar sessão INDIVIDUAL por linha
//          (ui/template.js renderRow): o backend mascara o token (token_preview) e o revoke exige o token
//          completo -> ação impossível pelo cliente (no-op enganoso). Encerrar sessão específica agora só
//          via "Encerrar Outras" (revoke_all, funciona). Detalhes/Copiar mantidos. Bump entrega template.js fresco.
// v9.3.13: WCM-CACHE-RESCUE 2026-07-08 — Relogio Mundial abria em OVERLAY no cliente: modulos
//          /components/world-clock-map/ (URL fixa) pinados por max-age=14400; SWR servia o index.js
//          OVERLAY velho. Fix: bustBundle cobre world-clock-map + panel-relogio-mundial (?swv fura o
//          pin) + getStrategy networkFirst. Origin ja estava certo (container-main, 0 erros).
// v9.3.14: SESSION-ADMIN-ADMINVIEW 2026-07-08 — visão ADMIN "todas as sessões". Backend api/sessions
//          (action=list): scope=all + admin server-side (level>=80) => TODAS as sessões ativas (cross-user,
//          read-only, +username/email via JOIN app_users, LIMIT 1000); não-admin ou scope!=all => só as
//          próprias. Tokens seguem MASCARADOS; nenhuma revogação cross-user (revoke_all escopado ao próprio).
//          lifecycle.js: carrega via loadAllSessions() (backend decide) — sem depender do isAdmin do front.
//          Bump entrega lifecycle.js fresco via SWR.
// v9.3.15: FOOTER-NAVFX-PROP 2026-07-08 — os efeitos navrail no footer (v9.3.9) não propagavam ao
//          cliente: o footer/styles/index.css e o _shared/nav-fx/*.css NÃO estavam no bustBundle,
//          então o pin max-age=14400 servia o index.css SEM o novo @import. Adicionado isNavFx ao
//          bustBundle (?swv fura o pin, igual World Clock v9.3.13). Bump ativa o novo SW + define o
//          valor de ?swv. Origin/edge já serviam o CSS correto (provado por getComputedStyle).
// v9.3.16: MEU-PERFIL-RECONNECT 2026-07-08 — "Meu Perfil" abria um entry point de geração ANTIGA
//          (badge sem CSS) que fazia `new StateStore()` sobre um singleton (TypeError) + resíduo
//          `container: any` (ReferenceError). A UI RICA de avatar (ui/renderer+template, state/store,
//          core/constants, styles .pup) estava ÓRFÃ (ninguém importava). index.js/index.ts reescritos
//          como orquestrador que RELIGA a UI órfã: perfil via /api/user/profile.php, galeria via
//          /api/avatars/list.php (corrigido require ApiResponse faltante — fatal), avatar persistido
//          via /api/user/avatar.php (aditivamente espelha app_users.avatar_url p/ o header refletir).
//          Painel servido cru (sem dist) -> este bump entrega o index.js religado. Rota/handler já OK.
// v9.3.17: MEU-PERFIL-CSS 2026-07-08 — o orquestrador religado (9.3.16) renderizava a UI .pup mas
//          SEM estilo: a geração antiga (badge) usava CSS inline e nunca injetava styles/index.css.
//          Adicionado o _loadCSS (padrão dos demais painéis) no index.js + fallback default.svg->avatar.svg.
//          isUserProfile no bustBundle já cobre index.js/styles via ?swv; este bump renova o ?swv.
// v9.3.18: MEU-PERFIL-LIGHT 2026-07-08 — o painel .pup (agora que RENDERIZA) era dark hardcoded no
//          tema light. Bloco L8 em theme.light-total.css (?v=36) remapeia superfícies/texto do .pup
//          p/ claro (acentos/status/badges = dado, preservados). Bump purga o index.html preso p/
//          entregar o ?v=36. DARK intocado.
// v9.3.19: DEVTOOLS-TOGGLE-FIX 2026-07-08 — botao de ferramentas (footer, canto inf. dir.) parou de abrir:
//          o onclick do cm-devtools-toggle tinha (window as any).__cmDevTools.toggle() — sintaxe TS vazada
//          p/ dentro da STRING onclick (JS invalido -> clique no-op). Regressao da migracao TS (~fev-abr).
//          Fix nas 6 strings onclick (raw index.js/.ts do devtools-panel) -> window.__cmDevTools.X(). Path
//          fixo pinado por max-age: bustBundle + networkFirst p/ propagar.
// v9.3.20: MEU-PERFIL-PERSIST-NOME 2026-07-08 — persistência COMPLETA do painel. api/user/profile.php
//          (v4.0.0) passou a LER app_user_profiles (nome/nome_resumido/nome_completo/funcao/departamento)
//          no GET e a ACEITAR POST/PUT (via UserProfileRepository, upsert) + sincroniza $_SESSION['name']
//          p/ o header refletir o nome sem novo login. O orquestrador salva nome (PUT) + avatar (POST) e
//          reflete nome+avatar no header. isUserProfile no bustBundle já cobre; bump renova o ?swv.
// v9.3.21: SESSION-GRID-FASE-A 2026-07-08 — data grid de Gestão de Sessões, Fase (a): (1) menu de EXPORTAÇÃO
//          corrigido na causa — template renderizava `.psa__dropdown-menu` (sem CSS) → vazava como bloco de
//          texto; agora usa `.psa__export-menu`/`-item`/`-divider` (que psa.dropdown.css já estiliza+esconde)
//          + ícones; (2) ZEBRA sutil por índice de dado (psa__row--even, imune à expansão) + seleção/hover
//          vencendo, via tokens (_table.css + theme.light-total ?v=37 L7 no light). template.js/.ts. Bump
//          entrega template.js + index(?v=37) frescos via SWR.
// v9.3.22: MEU-PERFIL-FUNCAO-DEPTO 2026-07-08 — Função e Departamento agora são CAMPOS EDITÁVEIS no
//          painel Meu Perfil (antes só cards read-only). template.js/.ts: inputs data-field="jobTitle"/
//          "department" na seção Editáveis; cards Função/Departamento removidos (grade .pup-cards 5→3);
//          orquestrador _save() envia funcao/departamento no PUT (UserProfileRepository já aceitava).
//          isUserProfile no bustBundle cobre; bump renova ?swv.
// v9.3.23: SESSION-GRID-FASE-B 2026-07-08 — data grid de Gestão de Sessões, Fase (b): ordenação por clique
//          no header (multi shift+clique, indicador ▲▼ + posição), filtros POR COLUNA (texto/select/range
//          de data-hora) em linha alinhada aos headers, busca com HIGHLIGHT, e DATAS com HORA (dd/mm/aaaa
//          HH:mm) + tempo relativo em Última Atividade com absoluto no tooltip. store.js (multi-sort +
//          filtros tipados + showInlineFilters + getSort), lifecycle.js (handlers setSort/setInlineFilter/
//          toggleInlineFilters/clearFilters + preservação de foco no re-render), events.js (sort headers),
//          template.js (headers/filtros/datas/highlight/escape), _table.css. Bump entrega os .js/CSS frescos.
// v9.3.24: GESTAO-USUARIOS 2026-07-08 — o item "Gestão Usuários" da sidebar não abria: (1) route_path
//          no banco apontava para #/centros-custo/cadastro (resolvia p/ panel-10 Financeiro) em vez de
//          #/admin-users -> painel-user-management nunca carregava (main em branco, título preso); ícone
//          check-circle -> users. (2) index.js/.ts do painel eram geração ANTIGA "badge" (pill 👥 + endpoint
//          errado /api/user/management.php) com a UI RICA órfã; reescritos como orquestrador que delega a
//          core/lifecycle.js (renderer/handlers/crud -> /api/admin/users) + injeta CSS. isUserManagement no
//          bustBundle (?swv fura o pin); bump (novo CACHE_NAME) purga o index.js badge preso.
// v9.3.25: MEU-PERFIL-NETFIRST 2026-07-08 — painel "não aparecia" p/ o dono: caía na SWR genérica de
//          /components/ (servia o index.js velho no 1º load, atualizava só em 2º plano). getStrategy agora
//          trata /components/panels/panel-user-profile/ como networkFirst (sempre fresco), igual weather-fx/
//          World Clock/devtools. Combinado com isUserProfile no bustBundle (?swv fura pin CF/HTTP). Bump ativa.
// v9.3.26: SESSION-GRID-FASE-C 2026-07-08 — data grid de Gestão de Sessões, Fase (c): encerramento
//          INDIVIDUAL e EM MASSA por SELEÇÃO. Backend api/sessions: (list) passa a retornar s.id (PK);
//          novo action `revoke_by_id` (não-admin só as PRÓPRIAS via user_id; ADMIN cross-user; NUNCA a
//          atual; tokens nunca trafegam). ALÉM: corrigido `terminateAllOthers` que chamava `revoke-all`
//          (hífen) inexistente → agora `revoke_all` (o "Encerrar Outras" nunca funcionara). backend-api.js
//          (normalizador id=PK→session_token; +terminateByIds), store.js (SELECT_ALL exclui a atual),
//          lifecycle.js (handlers selectAll/deselectAll/toggleRowSelection/getSelectedCount/
//          terminateSelected + terminateSession por id, feedback por contagem, DESELECT pós-ação),
//          template.js (botão encerrar por linha de volta, exceto atual; expanded Token=token_preview).
//          Bump entrega os .js frescos.
// v9.3.27: PANEL-COTACAO-CACHE 2026-07-08 — o painel de cotação era servido CRU (URL fixa sem hash,
//          pin max-age=3600) e NÃO estava no bustBundle: o SW servia o render.js v1.0.0 velho, cujo
//          .cp-state null fazia o timer de 30s (range 1D) estourar "Cannot set properties of null
//          (setting 'hidden')" a cada 30s no console. Disco já tinha o v3.0.0 corrigido. Fix: isCotacao
//          no bustBundle (panel-cotacao-shared + panel-cotacao + currency-panel) fura o pin via ?swv;
//          bump (novo CACHE_NAME) ativa o SW e solta o render.js velho preso no cliente.
// v9.3.28: SESSION-GRID-TDFIX 2026-07-08 — correção de layout (print do dono): as células da tabela de
//          sessões usam .psa__td, mas o _table.css só estilizava .psa__cell (classe MORTA, mismatch) →
//          IP (IPv6) colado no Dispositivo (sem padding horizontal) e coluna Ações quebrando em 2 linhas.
//          Regras reais p/ .psa__td (padding + nowrap) e .psa__td--actions (nowrap/right). Bump entrega
//          _table.css fresco via SWR.
// v9.3.29: CMDPALETTE-ENRICH 2026-07-08 — paleta de comandos (Ctrl+K, sidebar/features/command-palette)
//          enriquecida: labels pt-BR (busca pt-BR passa a casar), +comandos de NAVEGAÇÃO gerados dos
//          itens reais da sidebar (Ctrl+K acha painel por nome e navega via clique nativo do link), e
//          FIX de bug: executeItem indexava _state.commands (lista cheia) em vez da lista FILTRADA ->
//          clicar após buscar executava o comando errado (nao navegava). Rebuild sidebar.bundle.js
//          (coberto por bustBundle .bundle.js). Verificado ao vivo: 120 comandos, busca+navegacao OK.
// v9.3.30: SESSION-GRID-STICKY-ACTIONS 2026-07-08 — coluna de AÇÕES FIXA à direita (position:sticky right)
//          na tabela de sessões (req.2.2), sempre visível no scroll horizontal. Fundo opaco (--psa-bg-primary)
//          + camada de tint do estado da linha (zebra/atual/selecionada/hover) p/ compositar idêntico à linha;
//          sombra de separação à esquerda; header/filter th acima (z-index). _table.css. Bump entrega fresco.
// v9.3.31: SESSION-GRID-FASE-D 2026-07-08 — (B) USUÁRIO fixo à ESQUERDA (+ seleção/expandir) via sticky
//          com larguras exatas (checkbox/expandir 40px → user left:80px) e fundo composite por estado;
//          (Fase d) linha EXPANSÍVEL enriquecida (todos os campos: usuário/e-mail/IP/dispositivo/SO/
//          navegador/localização/status/token/criado/última atividade/expira/user-agent) reusando
//          .psa__expanded-grid; destaque REFORÇADO da sessão atual (barra de acento na coluna fixa +
//          nome em negrito). backend-api.js (+user_email no normalizador), template.js, _table.css.
// v9.3.32: SIDEBAR-AMBER-CACHEBUST 2026-07-17 — item ativo da sidebar: a "barra preta" relatada NÃO
//          existia na origem (provado: DOM do dono `[]` + varredura ampla 0 hits light/dark); persistia
//          por CACHE STALE — o token sidebar.bundle.css?v= não era bumpado entre ciclos (SW cache-first +
//          CF max-age). Fix: (1) token bumpado 20260708→20260717 nas 6 refs (index.html+loader.js/ts+
//          constants.js/ts+dist); (2) defeito SEPARADO corrigido — grupo admin ::before era #f59e0b
//          SÓLIDO (enchia o botão) → radial suave igual aos grupos azuis (03-layout.css:301, rebuild);
//          (3) TRAVA nova detect-cachebust-drift.sh = detector 5/5 do check-all (acusa bundle mudado sem
//          bump). Novo CACHE_NAME purga o bundle velho preso no cache dos clientes.
// v9.3.33: SIDEBAR-THEME-CLASSDRIFT 2026-07-20 — sidebar carregava em LIGHT no boot DARK.
//          Causa: no boot o <html> fica com data-theme="dark" (correto) mas classe `theme-light`
//          divergente (a classe segue prefers-color-scheme do SO; o atributo segue a pref salva).
//          O 01-tokens.css da sidebar ancorava o override light no ramo LEGADO por CLASSE
//          `:root.theme-light` (esp. 0,2,0), que vencia o `:root` dark (0,1,0) → --sidebar-bg #fff.
//          Fix: override light passa a keyar SÓ em `:root[data-theme="light"]` (atributo canônico,
//          igual theme.light-total.css + toggle). Rebuild do bundle + token 20260717→20260720 nas
//          6 refs (index.html+loader.js/ts+constants.js/ts+dist). Novo CACHE_NAME purga o bundle preso.
// v9.3.34: TRANSITO-SP-MODULE 2026-07-20 — novo módulo de Trânsito de SP: indicador standalone no
//          header (traffic-monitor) + painel nativo no main (panel-transito-sp) + backend api/traffic/*
//          (proxy TomTom/mock + Redis). Assets CRUS de URL fixa entram no bustBundle (isTransit) e no
//          networkFirst do getStrategy (sempre fresco; evita SWR stale em updates). Leaflet self-hosted
//          em assets/js/libs/leaflet. Aditivo — não toca header/sidebar/main existentes.
// v9.3.60: DATATABLES-DISCOVERY-CAMADAS5A9 2026-07-21 — Descoberta ganha as camadas 5-9 do brief
//          (§7.5–§7.9): novo DiscoveryScanService (PHP puro, só-leitura) varre código-fonte, crons,
//          containers, logs e backups do host e reconcilia por NOME (§7.10). Cada camada reporta
//          COBERTURA (completa|parcial|indisponível) com o motivo — www-data não lê crontab do root,
//          logs do mysql/php-fpm nem docker.sock, e isso é sinalizado, não escondido (§35). Zero senha
//          capturada (§24). Front: 5 novas origens (Código/Cron/Container/Log/Backup) + painel de
//          cobertura das camadas. Colunas seen_code/cron/container/log/backup (ALTER idempotente).
//          Também registra na Icone.tsx os ícones da Descoberta que faltavam (rendiam null) + estilos
//          dos painéis hostsPanel/camadas. Aditivo; sem tocar contratos existentes.
// v9.3.61: HEADER-CURRENCY-ROTATOR 2026-07-21 — as 3 pills de cotação (currency-usd-brl/-usd-cny/
//          -btc) foram unificadas em UMA pill rotativa (carrossel vertical, 5s, pausa no hover) —
//          novo componente currency-rotator no header-components.bundle.js (config de ativos, reusa
//          os endpoints /api/currencies/get_*.php; clique abre panel-cotacao do ativo exibido via o
//          contrato sessionStorage+CustomEvent+#/panel-cotacao). Banco: header_components ganha
//          currency-rotator (id 35, order 149) e as 3 antigas viram is_active=0; pastas movidas p/
//          /backup. Bump (novo CACHE_NAME) purga o header-components.bundle.js velho preso no cliente.
// v9.3.62: ROTATOR-POLISH 2026-07-21 — consistência + melhorias na pill rotativa: no tema CLARO ela
//          passa a ser FLAT (transparente, sem borda/sombra) como as demais pills do header — via
//          theme.light-total.css (?v=38→39): os 3 seletores mortos currency-*-component viraram
//          .currency-rotator-component. currency-rotator v1.1.0: pausa também no FOCO de teclado
//          (a11y) e honra o polling_interval do banco (options.config). Rebuild header-components +
//          theme.light-total. Bump (novo CACHE_NAME) purga bundle+css velhos presos no cliente.
// v9.3.63: DATATABLES-DISCOVERY-AUTO-ALERTS 2026-07-21 — Descoberta ganha AUTOMAÇÃO §7 + ALERTAS §23.
//          Automação: novo `--mode=discovery` no datatables-monitor.php + entrada DIÁRIA (03:10) no
//          /etc/cron.d/datatables → a auditoria (camadas 1-9 + reconciliação) roda sozinha. Alertas:
//          `DiscoveryService::run()` agora difere a rodada da anterior (snapshot pré-persist) e levanta
//          alertas REUSANDO DtAlertService (dedup por fingerprint; aparecem na aba Alertas): novo banco
//          (produção sem cadastro), desaparecimento, só-em-backup, referenciado-não-encontrado, novo
//          servidor, inventário parcial/credencial, colisão de nome. Triados (user_status) silenciados;
//          condição que some = alerta resolvido. Status da rodada vira `completed_with_alerts` (§29) e a
//          tela mostra a contagem. Backend-pesado; front só ganhou o badge de contagem (rebuild+chown).
// v9.3.64: DATATABLES-DISCOVERY-CATALOG+REFINOS 2026-07-21 — (1) CATALOGAÇÃO: os 5 bancos acessíveis que
//          a Descoberta achava mas não apareciam (DSHOW_PROD 159 tbl, INTEGRACAO 101, PIPE_DSHOW 41,
//          DSHOW_MEDIA 5, DSHOWDASH_HOME 2) viraram conexões monitoradas (reusando credenciais do .env,
//          cifradas AES-GCM) + inventário → agora aparecem na tela Bancos (eram só DSHOWDASH). Fix de bug
//          pré-existente no InventoryService (table_comment > 500 → trunca, quebrava DSHOW_PROD). (2) REFINOS:
//          persist trata DESAPARECIMENTO (is_present/disappeared_at; §8.5/§22), assinatura de instância
//          server_uuid (§19/§20) + alerta "mudou de servidor", timeline das 11 etapas (§29/§30), purge de
//          órfãos no maintain. Front: badge "Desapareceu" + chip/card Desaparecidos + painel de etapas +
//          server_uuid no drawer (ícone Fingerprint registrado). Rebuild+chown dist.
// v9.3.65: DATATABLES-DRAWER-OPACO 2026-07-21 — drawer/modal do DataTables estavam TRANSPARENTES no dark
//          (conteúdo de trás vazava, leitura péssima). Raiz: `.painel`/`.caixa` usavam `--dt-bg-surface` =
//          `var(--bg-card)` = translúcido (dark `rgba(255,255,255,.015)`) — correto p/ card SOBRE o painel
//          opaco, errado p/ overlay `position:fixed`. Fix: novo token OPACO `--dt-bg-overlay`
//          (`var(--bg-secondary,#111113/#f4f4f5)` — sólido nos 2 temas) em tokens.css; Drawer `.painel`+`.topo`
//          e Modal `.caixa` passam a usá-lo. Corrige os 5 drawers + 5 forms de uma vez. Backdrop/sombra/
//          clique-fora já existiam. CommandPalette já era opaco (--dt-bg-elevated). Nada hardcoded. Rebuild+chown.
// v9.3.66: DATATABLES-DISCOVERY-RELATORIO §31 2026-07-21 — Relatório final da Descoberta: `getReport()`
//          (Resumo servidores/instâncias/encontrados/catalogados/referenciados/vazios/desaparecidos/
//          conflitos + Pendências prioritárias [servidores sem acesso, produção não monitorada,
//          referências quebradas, sem aplicação, duplicidades] + Recomendações roll-up) reusando getLatest.
//          `exportCsv()` (CSV UTF-8 BOM da lista reconciliada = entregável p/ o DBA criar a credencial).
//          Rotas GET /discovery/report (JSON) + /discovery/export (download, 401 sem sessão). Front:
//          botão "Exportar CSV" no topo + painel "Relatório §31" (recomendações + servidores sem acesso).
//          Rebuild+chown. Aditivo; nada quebrado.
// v9.3.67: DATATABLES-HEADER-STICKY 2026-07-21 — o header interno do módulo (breadcrumb + título +
//          ações/Atualizar + abas + sub-abas) some ao rolar a página. Fix (variante A, 100% CSS, sem
//          scroll-listener): App.tsx envolve <PageHeader>+<Navegacao> num <div .topoFixo> com
//          `position:sticky; top:0`. Gruda no topo do container rolável real do shell
//          (`.dsd-container__body`, overflow:auto) — não há overflow:hidden intermediário. Fundo OPACO
//          `--dt-bg-overlay` (sólido nos 2 temas) + borda/sombra sutis (elevação). Novo token
//          `--dt-z-sticky:30` fica ACIMA do conteúdo e ABAIXO de drawer/modal/cmdk (z 9000/9500 → cobrem
//          o header). Sem salto de layout (sticky reserva espaço). Grids têm scroll próprio (.rolagem,
//          max-height 60vh) → cabeçalhos de tabela grudam abaixo por construção, sem offset. Rebuild+chown.
// v9.3.69: DATATABLES-DATAGRID-5TELAS 2026-07-21 — as telas que ainda usavam cards/listas viram o DataGrid
//          robusto (§37.1): Conexões, Servidores, Integrações, Manutenções e Busca (4 grids). Ganham
//          colunas ordenáveis/ocultáveis, densidade, sticky header, zebra e ações no menu ⋮ da linha
//          (Verificar/Inventariar/Editar/Desativar/Encerrar) + clique abre o drawer. Novo hook
//          `components/grid/useOrdenacaoLocal` faz a ORDENAÇÃO no cliente (o DataGrid só reporta a
//          intenção; server-side não fazia sentido em listas já carregadas inteiras). Ambiente com a cor
//          real do §; pulso do online preservado na coluna Status. Rebuild+chown. Backend intocado.
// v9.3.70: DATATABLES-DEPS-GRAPH-D3 2026-07-21 — o "diagrama gráfico que faltava" (§23): grafo
//          force-directed de dependências (tabelas ↔ FKs) em Dependências, com D3 (d3-force/selection/
//          zoom/drag) LAZY (chunk assíncrono — excluído do vendor eager no vite.config, como o ECharts).
//          Zoom/pan, arrastar nós, realce de vizinhos no hover, clique abre o drawer da tabela; seletor de
//          banco (grafo por banco p/ legibilidade). Backend aditivo: `GET /dependencies/graph[?database_id]`
//          (`CatalogRepository::dependencyGraph` → nodes/edges/databases; ⚠️`:db` repetido quebra com
//          EMULATE_PREPARES=false → 2 placeholders). Rebuild+chown+backend php -l.
// v9.3.80: ADS-INTELLIGENCE-MOCK 2026-07-22 — entrega do módulo "Ads Intelligence" (Google Ads) mock-first
//          (`ADS_PROVIDER=mock`): backend `api/ads/` (roteador + curto-circuito mock + `AdsMock`
//          determinístico) e painel React `panel-ads` (22 telas: dashboards/DataGrids/heatmap horários/
//          simulador orçamento/funil/alertas/relatórios/histórico; charts SVG inline). O bundle do painel
//          é content-hashed e resolvido via manifest `no-store`, mas a FIAÇÃO editou rotas core cacheadas
//          (`components/router/registry/definitions/routes-dashboard.js` e
//          `components/main/adapters/panel-loader/panel-paths.js`) que caem em staleWhileRevalidate — o
//          bump (novo CACHE_NAME) purga o cache e ativa `/panel-ads` numa ÚNICA recarga em vez de depender
//          da 2ª navegação do SWR. Nada real em produção (só mock). Backend `php -l` + `tsc` 0 + vite OK.
//          Fiação de entrada: (1) botão "Ads" na sidebar (ui_nav_items sidebar.ads, order 7, logo
//          abaixo de Outlook, route #/panel-ads); (2) ícone Google Ads do header agora abre o painel —
//          patch cirúrgico de 1 string no header-components.bundle.js (#/integrations/adwords→#/panel-ads,
//          fonte panel-adwords/index.{js,ts} sincronizada) porque rebuildar o bundle está desaconselhado
//          (drift de email-integration/Outlook). Provado com clique real (Playwright): header+sidebar montam
//          panel-ads; Outlook intacto (controle).
// v9.3.81: MOUNT-CONTAINER-ANY 2026-07-29 — mesma classe de bug do v9.3.10 (Meu Perfil), agora varrida
//          em TODO o repo: 16 painéis faziam `new XComponent({ container: any, config })` no mount() —
//          resíduo TS→JS onde `any` (TIPO) virou VALOR, lançando `ReferenceError: any is not defined`
//          ao construir. Passava no `node --check` (erro de runtime) e no `tsc` porque cada mount tinha
//          um `// @ts-expect-error strict migration — TS2693` logo acima SUPRIMINDO exatamente esse erro
//          ("'any' only refers to a type, but is being used as a value here"). Fix em index.{js,ts} dos 16:
//          `{ container, config }` + remoção dos 16 @ts-expect-error que ficaram órfãos (TS2578). Painéis:
//          integration-{bling,adwords,alfinete,asaas,chatgpt,google-drive}, status-{currency-btc,
//          currency-usd-brl,currency-usd-cny,email-integration,instagram-messenger,weather-sp,
//          wechat-integration,whatsapp-integration}, user-{preferences,notifications}. Os 4 integration
//          restantes (calendar/loja-integrada/mercado-livre/pipedrive) já estavam corretos — intocados;
//          os 3 TS2693 de outra origem (layout-manager×2, weak-refs) também intocados. Painéis servidos
//          crus (sem dist) -> bump (novo CACHE_NAME) entrega os index.js corrigidos. tsc 232=232 (baseline
//          idêntica, zero erro novo), node --check 16/16. Backup: /backup/2026-07-29-fix-container-any/.
// v9.3.82: GOOGLE-CALENDAR-MOCK 2026-07-29 — entrega do módulo "Google Calendar" mock-first (Fase 2 do
//          docs/BRF_CALENDAR.md). Backend `api/google-calendar/` (provider mock|google via GCAL_PROVIDER;
//          GcalMock com estado em sessão, conflitos/free-busy/KPIs COMPUTADOS dos eventos; GcalReal
//          responde 503 com as pendências) e painel React `panel-google-calendar` (14 telas: Hoje/Agenda
//          FullCalendar/lista TanStack/equipe/calendários/recursos/convites/disponibilidade/conflitos/
//          carga ECharts/alertas/contas/sync/config). Agenda e Carga em React.lazy — ECharts com import
//          seletivo (1126→496 kB) e FullCalendar saem do 1º paint.
//          ⚠️ TIMEZONE: `mysql.time_zone_name` está VAZIA neste servidor, então CONVERT_TZ por NOME
//          devolve NULL — e NULL some da grade sem erro no log. Regra do módulo: banco em UTC, conversão
//          só na borda (api/google-calendar/lib/Tz.php + src/lib/tz.ts). Nenhuma query usa CONVERT_TZ.
//          Fiação de entrada: (1) botão "Google Calendar" na sidebar (ui_nav_items sidebar.google-calendar,
//          order 12, grp-favoritos, route #/panel-google-calendar); (2) ícone de calendário do header agora
//          abre o painel — MESMO patch cirúrgico de 1 string no header-components.bundle.js do v9.3.80
//          (#/integrations/calendar→#/panel-google-calendar, fonte panel-calendar/index.{js,ts}
//          sincronizada) porque rebuildar o bundle segue desaconselhado. A rota #/panel-* resolve pelo
//          fallback por convenção do panel-paths.js (ao vivo); #/integrations/* cairia no registry
//          BUNDLEADO. Flag `panel_google_calendar_enabled` criada de verdade (o Outlook vive de fallback).
//          nginx: location ^/api/google-calendar. php -l OK, tsc 0, vite OK, sandbox 49/49 checks.
//          Backup: /backup/google-calendar-2026-07-29/.
// v9.3.83: GOOGLE-CALENDAR-FASE3 2026-07-30 — elevação de UX/UI do módulo Google Calendar.
//          (1) @fullcalendar/interaction 6.1.21 instalado — diff do package-lock CONFERIDO: só as
//          10 linhas do pacote novo, nenhuma dep existente mexida. Habilita arrastar/redimensionar/
//          selecionar faixa. `editable` é decidido POR EVENTO (reader/freeBusyReader/cancelado/
//          redigido não se movem) — deixar arrastar e recusar no servidor seria pior.
//          (2) Atualização otimista com ROLLBACK + toasts (lib/mutations.ts): o cache volta ao
//          snapshot e `arg.revert()` devolve o bloco na tela (o FullCalendar tem estado próprio;
//          só desfazer a cache deixaria a UI mentindo). 409/412 → recarrega a versão atual (§61).
//          (3) Criação rápida em popover ancorado (@floating-ui) ao selecionar faixa vazia; "Mais
//          opções" leva ao formulário completo SEM perder o que já foi digitado.
//          (4) Heatmap D3 dia×hora com cross-filter e drill-down; rampa sequencial azul validada
//          (uma hue, claro→escuro); célula é <rect> com tabIndex → acessível, o que canvas não dá.
//          (5) Ícone do header ganhou estado (§8.3) + popover dos 3 próximos (§9): módulo
//          STANDALONE `components/gcal-header-popover/` carregado pelo index.html (no-store, o ?v
//          propaga na hora), padrão do traffic-monitor — NÃO rebuilda o header-components.bundle.
//          Não intercepta o clique: hover/foco abrem; o clique segue navegando.
//          (6) Widget "Google Calendar" na home (panel-dashboard). 🔴BUG GENÉRICO CORRIGIDO NA
//          RAIZ: `layoutsEfetivos` usava o layout salvo CRU, então TODO módulo adicionado depois
//          de o usuário arrastar um widget ficava INVISÍVEL (o objeto salvo não tem entrada para
//          o id novo). Agora completa o salvo com os que faltam e descarta órfãos. Provado
//          injetando um layout salvo com os 11 módulos antigos: grid passou a 12 com o novo.
//          ⚠️MEDIDO: em '#/' a home monta IMERSIVA (config.home===true) e a faixa de widgets não
//          renderiza por design; a zona vive em '#/panel-dashboard'.
//          (7) Atalhos T/A/L/C/X/N/R/B//'/'/Esc com guarda de digitação (sem ela, escrever "nova
//          reunião" no título troca de tela no "n"); foco visível; mobile com drawer em folha
//          inferior e alvo de toque ≥38px.
//          ⚠️PENDENTE: Ctrl+K NÃO integrado — medido que `window.Sidebar` não expõe getFeature e
//          que a paleta sequer abriu no teste; registrar comando ali seria fachada não verificável.
//          Provas: tools/screenshot/proof-gcal-fase3.mjs (drag real, criação, atalhos, heatmap,
//          popover, mobile) + scripts/gcal-smoke-all.sh. tsc 0 nos dois painéis, vite OK.
//          Backup: /backup/google-calendar-2026-07-29/ (inclui package.json/lock pré-interaction).
// v9.3.84: GOOGLE-CALENDAR-FASE7 2026-07-30 — relatórios (§64) e D3 restantes (§40, §65).
//          (1) Backend `GET /reports` + `/reports/{tipo}`: 11 relatórios agregados NO SERVIDOR
//          (mandar 90 dias de evento cru para o browser somar é o que o §77 proíbe). Agregação em
//          `lib/GcalReports.php`, SEPARADA do mock de propósito — é a mesma conta que o provedor
//          real reaproveita na Fase 4, só muda a origem dos eventos.
//          (2) CONTRATO ÚNICO {colunas, linhas, totais, serie}: uma tela genérica serve os 11.
//          A formatação vem do `tipo` DECLARADO na coluna, nunca de adivinhar pelo conteúdo
//          (`0.5` pode ser meia hora, meio por cento ou meia unidade). Média de coluna ignora
//          linhas zeradas: contar dia sem reunião derrubaria a "duração média".
//          (3) Exportação CSV com `;` + BOM UTF-8 — sem os dois, o Excel pt-BR joga tudo numa
//          coluna e escreve "ReuniÃ£o". Duração sai em MINUTOS no CSV (para somar na planilha) e
//          formatada na tela. XLSX nativo NÃO foi feito: exigiria lib no package.json RAIZ; o
//          "xls" sem lib é HTML renomeado, que o Excel abre com aviso. Decisão do dono.
//          (4) Impressão/PDF via @media print. 🔴 ARMADILHA DE ESPECIFICIDADE: o seletor de tema
//          `:root[data-theme=light] [data-gc-react-root]` (0,3,0) VENCIA
//          `html.gc-imprimindo [data-gc-react-root]` (0,2,1) e a folha saía com os tokens do tema.
//          Corrigido duplicando a classe → (0,3,1), sem !important. Medido: --gc-surface vinha
//          #ffffff em vez de #fff.
//          (5) D3 Sankey do fluxo origem→formato→desfecho (§40) e rede de coparticipação em
//          force layout (§65). Ambos respeitam o §40 e se RECUSAM a desenhar quando o backend diz
//          `suficiente:false` — Sankey de três fitas não explica nada. Força tem teto de 4 s
//          (`sim.stop()`): simulação eterna cozinha CPU num painel aberto o dia todo. Rede corta
//          em 30 nós e INFORMA quantos ficaram de fora.
//          (6) d3-* movido para chunk próprio no manualChunks: sem isso caía no `vendor`, que É
//          baixado no primeiro paint (164→187 kB). Voltou a 164; a tela Relatórios é lazy.
//          ⚠️MOCK: adicionada `SEMENTE_VERSAO` — sem ela, mudar a semente não chega a quem já tem
//          sessão até o dia virar (corrigi o mock, a suíte CLI passou e o navegador seguiu igual).
//          ⚠️Pela SEGUNDA vez um cenário ancorado em dia CORRIDO caiu no fim de semana e sumiu
//          (agora no loop do passado): usar SEMPRE contador de dias úteis.
//          Provas: scripts/gcal-smoke-all.php (69 checks) + tools/screenshot/proof-gcal-fase7.mjs
//          (10 checks: catálogo, 11 relatórios com dado, ordenação, totalizadores conferidos
//          contra a soma das linhas, download real do CSV, Sankey, rede com seleção, impressão).
// v9.3.85: GOOGLE-CALENDAR-FASE6 2026-07-30 — integracoes internas (§32, §34, §57).
//          PRIMEIRA vez que o modulo toca DADO REAL: o evento segue simulado, mas o negocio,
//          a pessoa, a organizacao e a proposta que ele referencia sao registros REAIS de
//          PIPE_DSHOW e do Koala. `lib/GcalLinks.php` e SOMENTE LEITURA — a agenda consulta o
//          CRM, nao o administra (a suite verifica por regex que nao ha INSERT/UPDATE/DELETE).
//          (1) `GET /links/search` — autocomplete sobre 19.947 negocios, 18.218 pessoas e
//          13.062 organizacoes ativas. Medido: 149 ms na busca unificada, com debounce de 320 ms.
//          (2) `GET /links/entity/{tipo}/{id}` — ficha lateral (§32.2) com valor, etapa,
//          responsavel, previsao e as 5 ultimas atividades do CRM, mais rota para o painel de
//          origem. 404 quando a entidade sumiu na origem: o vinculo fica, a UI avisa.
//          (3) `POST/DELETE /events/{cal}/{evt}/links` — anexar e remover, idempotente.
//          ⚠️SCHEMA MEDIDO: `pipe_organizations.name_norm` e `cnpj` estao **100% NULL**
//          (13.063/13.063) — o indice `ix_name` NAO serve para nada. So `persons.email_norm`
//          esta preenchido (98%). Busca de org vai por `name` mesmo (full scan ~101 ms).
//          ⚠️`pipe_activities` usa `deal_pd_id`, NAO `deal_id`.
//          ⚠️PDO com prepares nativos: reutilizar `:q` em tres condicoes da "Invalid parameter
//          number" — um placeholder POR OCORRENCIA.
//          ⚠️DSHOW_PROD (clientes/fornecedores) FICOU DE FORA, com motivo medido: banco REMOTO
//          com ~752 ms so de handshake, e `ent_cliente` nao guarda o nome (so `id_entidade`),
//          exigindo mais um JOIN remoto. Autocomplete acima de 1 s nao e usado. O caminho certo
//          e cache local = trabalho de SINCRONIZACAO, nao de vinculo.
//          🔴BUG ANTIGO CORRIGIDO (existia desde a Fase 2, so apareceu agora): o EventoDrawer
//          usava o SNAPSHOT congelado no clique. O servidor respondia 201, as listas atras
//          atualizavam e a gaveta seguia mostrando o estado velho — como se a acao nao tivesse
//          acontecido. Agora le da cache com `initialData` (abre instantaneo e reflete o
//          servidor a cada invalidateQueries). Valia tambem para responder convite.
//          Provas: scripts/gcal-smoke-all.php (90 checks) + tools/screenshot/proof-gcal-fase6.mjs
//          (7 checks: busca real, vincular, ficha viva, remover, e calendario somente-leitura
//          que NAO oferece vincular).
// v9.3.86: GOOGLE-CALENDAR-FASE8 2026-07-30 — HOMOLOGAÇÃO. Auditoria contra §84/§85/§86 mais
//          segurança, privacidade, fusos, recorrência, multi-conta, performance e a11y.
//          Suites novas: scripts/gcal-homologacao.php (60 checks) + proof-gcal-homologacao.mjs
//          (10 checks, 3.516 textos medidos). AMBAS no runner — regressão futura reprova o build.
//          NÃO passou de primeira. Corrigido:
//          🔴(1) 140 textos abaixo do piso WCAG. `--gc-texto-3` era 3,78:1 (dark) e 3,33:1 (light);
//          botão primário 3,56:1; pílulas de estado no claro 2,56-3,76:1; e o pior — TEXTO DO EVENTO
//          no FullCalendar em 2,15:1 (amarelo) e 2,54:1 (verde), porque o FC pinta branco.
//          ⚠️LIÇÕES: (a) token de texto pequeno tem de passar em TODOS os fundos, não só no branco —
//          o 1º conserto (#6b7280, 4,83:1 no branco) ainda dava 4,27:1 sobre a superfície-2;
//          (b) `color` em `.fc-event` NÃO funciona: o FC pinta em `.fc-event-main` via
//          `--fc-event-text-color` e vence por especificidade; (c) COR DE AÇÃO ≠ COR DE LINK —
//          `--gc-primaria` foi escolhida para ser FUNDO com texto branco, e no escuro é escura
//          demais para virar texto (3,0-3,6:1). Criado `--gc-primaria-txt`.
//          Paleta de calendário reclareada (SEMENTE_VERSAO 5): com texto escuro, as cores vivas
//          davam 3,67-4,82:1; agora todas ≥5:1 com folga para a hachura de privado/disponível.
//          (2) Figura de Relatórios sem tabela equivalente. Apontar para a tabela de baixo NÃO
//          servia: a série do gráfico nem sempre é a tabela inteira ("top 12" x 40 linhas).
//          (3) Dois falsos positivos do próprio auditor, registrados: grep de CONVERT_TZ pegava os
//          COMENTÁRIOS que explicam por que não se usa CONVERT_TZ (ancorar em linha de código); e
//          ReflectionClass antes do require_once.
//          RESULTADO: 0 falha nos dois temas. Fusos verificados com virada de DST real (NY UTC-5
//          antes / UTC-4 depois, hora inexistente não explode). Primeiro paint 439 kB.
//          Fora do escopo (não dá para homologar o que não existe): OAuth/sync/push (Fases 4-5),
//          leitor de tela real, carga com volume de produção. Detalhe: docs/GOOGLE-CALENDAR/06-homologacao.md
// v9.3.87: GOOGLE-CALENDAR-FASE4 2026-07-30 — backend real. ⚠️A PRODUÇÃO NÃO MUDOU:
//          GCAL_PROVIDER segue `mock` e as 15 telas continuam idênticas (suítes reconferidas).
//          Tudo abaixo é infraestrutura pronta, aguardando a credencial do Google.
//          (1) 🔒 GCAL_DSHOW PROVISIONADO (20 tabelas) + usuário `gcal_app` de PRIVILÉGIO MÍNIMO:
//          só SELECT/INSERT/UPDATE/DELETE no próprio schema. PROVADO que ele NEGA DDL, NEGA
//          PIPE_DSHOW e NEGA DSHOWDASH. O módulo novo NÃO usa o root do MySQL — é o primeiro a
//          não usar. `config/db_connection.php` (CORE) ganhou a entrada; ACL restaurada e health
//          conferido no mesmo comando, por causa do 500 app-wide que esse arquivo já causou.
//          (2) `GcalRepository`: contas, tokens CIFRADOS, state+PKCE, calendários, eventos com
//          upsert por `payload_hash`, sync state, runs, erros e auditoria com scrub.
//          (3) `GcalTransport` INJETÁVEL — é o que torna a Fase 4 testável sem Google: o cliente
//          é exercitado contra respostas no formato real da API.
//          (4) `GoogleCalendarClient` + `GcalNormalizer`: paginação, 401→renova UMA vez, 410→
//          exceção própria, 429/403→backoff com jitter, freeBusy, responder convite, perfil.
//          (5) `GcalAuthService` (OAuth PKCE ponta a ponta) e `GcalSyncService` (carga inicial
//          com janela 90/365, incremental por syncToken, recuperação de 410 SEM apagar dado).
//          ⚠️ARMADILHAS PROVADAS: refresh do Google NÃO devolve refresh_token — sobrescrever
//          APAGA a credencial (COALESCE resolve); `syncToken` não pode ir junto com `timeMin`;
//          `nextSyncToken` só vem na ÚLTIMA página; `reminders.useDefault` não é "sem lembrete";
//          `start.date` ≠ `start.dateTime` (dia inteiro não tem fuso).
//          🔴BUG CONCEITUAL CORRIGIDO: eu marcava `deleted=1` para evento CANCELADO, colapsando
//          duas coisas que o §59 pede para diferenciar — cancelado continua existindo (aparece
//          riscado, entra no relatório); `deleted` é só para "sumiu da origem".
//          Suítes novas no runner: gcal-fase4-{repositorio,cliente,sync}.php (36+44+18 checks).
//          FALTA para o go-live: credenciais do Google Cloud e o `GcalDb` (leitura das telas a
//          partir do banco), que só é verificável com uma conta conectada.
// v9.3.96: WCM-V3-CENTRO-GLOBAL 2026-07-30 — Relógio Mundial reescrito como painel React
//          (panel-relogio-mundial/dist, adaptador espelhando panel-ads). Mapa em canvas com
//          d3-geo: 4 projeções (inclusive globo ortográfico), terminador em calotas geográficas,
//          5.228 luzes de cidade, 157 cidades, 29 bolsas, 156 aeroportos, clima real via
//          api/weather/bulk.php (Open-Meteo + Redis 30 min). O motor VANILLA antigo
//          (/components/world-clock-map/panel.js) FICA: é o fallback do adaptador quando o
//          bundle não carrega. Bump entrega o index.js novo do painel — que é servido CRU
//          (sem dist) e por isso depende do CACHE_NAME, ao contrário do bundle hasheado.
// v9.3.97: WCM-V3.1 2026-07-30 — segunda rodada do Relógio Mundial, guiada por medição:
//          (1) DESEMPENHO — perfil apontou 52% em `closePath`; removida a sombra de canvas
//          sobre a terra (1.429 anéis), geometria 110m durante o arrasto, sprite no lugar de
//          5.228 gradientes por quadro e repintura amarrada ao MINUTO em vez do tique de 1 s.
//          Painel PARADO saiu de 132–200 ms de tarefa longa para NENHUMA.
//          (2) CONTRASTE — auditoria reprovava 7 amostras até em AA; tinta recalculada,
//          `--wcm-state-*-ink` separado do gráfico, nada abaixo de 10px. Hoje 0 reprovações
//          em AAA nos dois temas, com portão na suíte.
//          (3) RECURSOS — Múltiplos Relógios (faixa sempre visível), camada de eventos no
//          mapa, categorias de favoritos, parallax no globo e ripple/spring.
//          (4) 🔴 LINK DIRETO — medido que o shell NÃO honra o hash no boot a frio (vale para
//          `#/panel-ads` também, testado como controle). A ponte world-clock-map/index.js
//          passa a navegar e CONFERIR; o roteador do shell não foi tocado. Bump entrega a
//          ponte nova, que é servida CRUA.
// [9.3.98] 2026-07-30 — envelope {ok}: 31 leituras `.success` -> `(x.ok ?? x.success)`
//          em 24 arquivos de components/panels. O que o bump ENTREGA de fato:
//          `panel-12/services/api.js`, que estava quebrado EM PRODUCAO (lia
//          `result.data.success` no corpo da API, sempre undefined -> loadJobs/create/
//          update/delete retornavam erro em 100% das chamadas). Provado por HTTP:
//          painel-12/api.php responde {"ok":false,...}, sem chave `success`.
//          Os outros 23 arquivos sao fontes .ts; o .js servido ja estava correto e
//          nao muda de bytes — o bump nao e necessario para eles.
var VERSION = '9.3.98-ENVELOPE-OK-P12';
var CACHE_NAME = 'dshowdash-v' + VERSION;

var PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/core/css/reset.css',
  '/core/css/variables.css',
  '/core/css/utilities.css',
  '/assets/css/theme.css',
  '/assets/css/global-theme.css',
  '/assets/css/layout.css',
  '/assets/css/panels-sane.css',
  '/assets/css/tokens/toast.tokens.css',
  '/assets/js/core/logger-global/index.js',
  '/assets/js/core/telemetry-core/index.js',
  '/assets/js/core/config-loader/index.js',
  '/assets/js/core/environment-manager/index.js',
  '/assets/js/core/theme-manager/index.js',
  '/assets/js/core/api-client/index.js',
  '/assets/libs/lucide/lucide.min.js',
  '/components/panels/panel-nav-admin/index.js',
  '/components/panels/panel-nav-admin/core/event-setup.js',
  '/components/panels/panel-nav-admin/core/lifecycle.js',
  '/components/panels/panel-nav-admin/core/constants.js',
  '/components/panels/panel-nav-admin/state/store.js',
  '/components/panels/panel-nav-admin/ui/renderer.js',
  '/components/panels/panel-nav-admin/ui/toast-manager.js',
  '/components/panels/panel-nav-admin/ui/audit-history.js',
  '/components/panels/panel-nav-admin/handlers/click-router.js',
  '/components/panels/panel-nav-admin/handlers/route-select.js',
  '/components/panels/panel-nav-admin/handlers/inline-edit.js',
  '/components/panels/panel-nav-admin/handlers/crud.js',
  '/components/panels/panel-nav-admin/core/nav-adapter.js',
  '/components/panels/panel-nav-admin/styles/main.css',
  '/components/header/components/currency-panel/index.js',
  '/components/panels/panel-cotacao-shared/render.js',
  '/components/panels/panel-cotacao-shared/chart.js',
  '/components/panels/panel-cotacao-shared/panel.css',
  '/components/panels/panel-cotacao-shared/prefs.js',
  '/components/panels/panel-cotacao/index.js',
  '/components/world-clock-map/index.js',
  '/components/world-clock-map/world-clock-map.css',
  '/components/world-clock-map/data/worldmap.js',
  '/components/world-clock-map/data/cities.js',
  '/components/world-clock-map/core/projection.js',
  '/components/world-clock-map/core/time.js',
  '/components/world-clock-map/core/astro.js',
  '/components/world-clock-map/core/prefs.js',
  '/components/world-clock-map/ui/map.js',
  '/components/world-clock-map/ui/spotlight.js',
  '/components/world-clock-map/ui/search.js',
  '/components/world-clock-map/ui/settings.js',
  '/components/world-clock-map/panel.js',
  '/components/panels/panel-relogio-mundial/index.js'
];

function isCacheable(response) {
  return response && response.status === 200 && response.type !== 'opaqueredirect';
}

// v9.0.1: o browser HTTP-cacheia *.bundle.js como `immutable` (7d) pela URL exata;
// um fetch() simples no SWR/networkFirst e servido dessa entrada velha e NUNCA vai a rede.
// Anexar ?swv=VERSION cria uma URL DISTINTA que a entrada immutable nao satisfaz -> rede
// garantida com bytes frescos. O param so muda no bump de VERSION, entao entre deploys a
// URL bustada cacheia normal (sem re-download permanente). A resposta e gravada sob a URL
// ORIGINAL (sem query) para manter as chaves de ES-module estaveis.
function bustBundle(request) {
  var url = new URL(request.url);
  // v9.2.1: alem de *.bundle.*, cobre modulos core de URL fixa (/assets/js/core/*.js|mjs|css e /core/*)
  // que caiam na armadilha SWR + HTTP immutable (URL fixa sem hash). O ?swv distingue a URL da
  // entrada immutable velha -> forca rede com bytes frescos. Resposta cacheada sob a URL ORIGINAL.
  var isBundle = /\.bundle\.(js|css)$/i.test(url.pathname);
  var isCoreModule = /^\/(assets\/js\/core|core)\/.*\.(js|mjs|css)$/i.test(url.pathname);
  // v9.3.13: World Clock Map — modulos standalone de URL FIXA presos pelo pin max-age=14400
  // (SWR servia o index.js OVERLAY velho; container-main nao propagava). ?swv fura o pin.
  // v9.3.96: o painel virou React com dist HASHEADO. O ?swv continua necessário para os
  // arquivos CRUS de URL fixa (o index.js do adaptador e a ponte do header), mas NÃO para
  // dist/: o bundle já tem hash no nome e a geometria (756 KB) e as fontes (88 KB) são
  // assets estáveis. Bustá-los forçaria ~850 KB de rede a cada abertura do painel.
  // O manifest é a exceção: ele é a fonte da verdade do entry e precisa vir fresco.
  var ehDistDoRelogio = /^\/components\/panels\/panel-relogio-mundial\/dist\//.test(url.pathname);
  var ehManifestDoRelogio = /\/dist\/\.vite\/manifest\.json$/.test(url.pathname);
  var isWcm = /^\/components\/(world-clock-map|panels\/panel-relogio-mundial)\//.test(url.pathname)
    && (!ehDistDoRelogio || ehManifestDoRelogio);
  // v9.3.15: FOOTER-NAVFX — o footer/styles/index.css (que agora importa o padrao
  // compartilhado) e o proprio _shared/nav-fx/*.css sao de URL FIXA sem hash e caiam no
  // pin max-age=14400 (SWR servia o index.css SEM o novo @import -> efeitos nao propagavam).
  // ?swv fura o pin e forca bytes frescos, igual ao tratamento do World Clock (v9.3.13).
  var isNavFx = /^\/components\/(footer\/styles\/index\.css|_shared\/nav-fx\/.*\.css)$/i.test(url.pathname);
  // v9.3.16: MEU-PERFIL — o painel panel-user-profile é servido CRU (sem dist), URL fixa sem hash,
  // preso pelo pin max-age=3600 do CF/HTTP (SWR servia o index.js da geração ANTIGA/badge). ?swv fura
  // o pin e força bytes frescos do orquestrador religado + submódulos (renderer/store/constants/template).
  var isUserProfile = /^\/components\/panels\/panel-user-profile\//.test(url.pathname);
  // v9.3.24: GESTAO-USUARIOS — o painel panel-user-management é servido CRU (sem dist), URL fixa sem
  // hash, preso pelo pin max-age (SWR servia o index.js da geração ANTIGA/badge que só pintava um pill
  // 👥 no #main). ?swv fura o pin e força bytes frescos do orquestrador religado à UI rica.
  var isUserManagement = /^\/components\/panels\/panel-user-management\//.test(url.pathname);
  // v9.3.19: devtools-panel (botao de ferramentas do footer) — raw index.js de URL FIXA preso pelo
  // pin max-age; sem ?swv o networkFirst ainda serviria o onclick quebrado do HTTP cache.
  var isDevtools = /^\/components\/main\/ui\/container-main\/utils\/(devtools-panel|command-palette-manager)\//.test(url.pathname);
  // v9.3.27: PANEL-COTACAO — o painel de cotação (render.js/chart.js/prefs.js/panel.css do
  // panel-cotacao-shared + binding panel-cotacao + ponte currency-panel) é servido CRU (sem dist),
  // URL fixa sem hash, preso pelo pin max-age=3600. O SWR servia o render.js v1.0.0 ANTIGO, cujo
  // .cp-state podia ser null -> o timer de 30s (1D) chamava load()->setState() e estourava
  // "Cannot set properties of null (setting 'hidden')" a cada 30s. O disco já tem o v3.0.0 corrigido
  // (.cp-state sempre presente no build()); ?swv fura o pin e entrega os bytes frescos.
  var isCotacao = /^\/components\/(panels\/panel-cotacao(-shared)?|header\/components\/currency-panel)\//.test(url.pathname);
  // v9.3.34: Trânsito SP — traffic-monitor (indicador header) + panel-transito-sp (painel main),
  // servidos CRU de URL fixa; ?swv fura o pin e casa com o networkFirst do getStrategy.
  var isTransit = /^\/components\/(traffic-monitor|panels\/panel-transito-sp)\//.test(url.pathname);
  // v9.3.35: DataTables — painel CRU (index.js + panel.css) de URL fixa, precisa do bust.
  var isDataTables = /^\/components\/panels\/panel-datatables\//.test(url.pathname);
  // v9.3.68: Outlook — painel CRU (index.js) de URL fixa; o bundle React é hasheado (não precisa).
  var isOutlook = /^\/components\/panels\/panel-outlook\//.test(url.pathname);
  if (!isBundle && !isCoreModule && !isWcm && !isNavFx && !isUserProfile && !isUserManagement && !isDevtools && !isCotacao && !isTransit && !isDataTables && !isOutlook) return request;
  if (url.searchParams.get('swv') === VERSION) return request;
  url.searchParams.set('swv', VERSION);
  return new Request(url.toString(), {
    method: 'GET',
    headers: request.headers,
    credentials: request.credentials,
    mode: request.mode === 'navigate' ? 'cors' : request.mode,
    redirect: 'follow'
  });
}

var CACHE_STRATEGIES = {
  cacheFirst: async function(request) {
    var cached = await caches.match(request);
    if (cached) return cached;
    try {
      var response = await fetch(request);
      if (isCacheable(response)) {
        var cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch (e) { return new Response('Offline', { status: 503 }); }
  },
  networkFirst: async function(request) {
    try {
      var response = await fetch(bustBundle(request));
      if (isCacheable(response)) {
        var cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch (e) {
      var cached = await caches.match(request);
      return cached || new Response('Offline', { status: 503 });
    }
  },
  staleWhileRevalidate: async function(request) {
    var cached = await caches.match(request);
    var fetchPromise = fetch(bustBundle(request)).then(function(response) {
      if (isCacheable(response)) {
        var responseToCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(request, responseToCache); });
      }
      return response;
    }).catch(function() { return null; });
    return cached || fetchPromise;
  }
};

function getStrategy(request) {
  var url = new URL(request.url);
  // APIs: always Network-First
  if (url.pathname.startsWith('/api/')) return CACHE_STRATEGIES.networkFirst;
  // weather-fx (engine de clima) em iteração ativa: networkFirst — sempre fresco, casa com o
  // no-store do nginx. Sem isto cai na SWR genérica /components/ e o SW PINA o .js velho
  // (intro/hero não propagam). Ver v9.0.2 (era assim antes do go-live).
  if (url.pathname.startsWith('/components/panel-home/weather-fx/')) return CACHE_STRATEGIES.networkFirst;
  // v9.3.19: devtools-panel em propagacao (fix do onclick) — networkFirst + bustBundle ?swv fura o pin.
  if (/^\/components\/main\/ui\/container-main\/utils\/(devtools-panel|command-palette-manager)\//.test(url.pathname)) return CACHE_STRATEGIES.networkFirst;
  // v9.3.96: Relógio Mundial v3. O dist é conteudo-hasheado (bundle) e assets estáveis
  // (geometria 756 KB + fontes 88 KB): cacheFirst, senão cada abertura do painel gasta
  // ~850 KB de rede à toa. O manifest fica de FORA do cacheFirst — ele é a fonte da
  // verdade do entry hasheado e servi-lo do cache é exatamente como o painel passa a
  // apontar para um bundle que já não existe. Um bump de VERSION purga estes caches.
  if (/^\/components\/panels\/panel-relogio-mundial\/dist\//.test(url.pathname)
    && !/\/\.vite\/manifest\.json$/.test(url.pathname)) return CACHE_STRATEGIES.cacheFirst;
  // v9.3.13: arquivos CRUS de URL fixa (adaptador + ponte do header) — networkFirst +
  // bustBundle ?swv p/ furar o pin; sem isto o SWR pinava o index.js velho.
  if (url.pathname.startsWith('/components/world-clock-map/') || url.pathname.startsWith('/components/panels/panel-relogio-mundial/')) return CACHE_STRATEGIES.networkFirst;
  // v9.3.23: Meu Perfil (panel-user-profile) servido CRU e em iteração ativa — networkFirst (+ bustBundle
  // ?swv) p/ SEMPRE buscar fresco; sem isto a SWR genérica pinava o index.js velho (painel "não aparecia"
  // até o 2º load). Espelha weather-fx/World Clock/devtools.
  if (url.pathname.startsWith('/components/panels/panel-user-profile/')) return CACHE_STRATEGIES.networkFirst;
  // v9.3.34: Trânsito SP (traffic-monitor + panel-transito-sp) servido CRU e em iteração ativa —
  // networkFirst (+ bustBundle ?swv) p/ SEMPRE buscar fresco; evita a armadilha SWR em updates futuros.
  if (url.pathname.startsWith('/components/traffic-monitor/') || url.pathname.startsWith('/components/panels/panel-transito-sp/')) return CACHE_STRATEGIES.networkFirst;
  // v9.3.35: DataTables em iteração ativa — networkFirst evita SWR servir bytes velhos.
  if (url.pathname.startsWith('/components/panels/panel-datatables/')) return CACHE_STRATEGIES.networkFirst;
  if (url.pathname.startsWith('/components/panels/panel-outlook/')) return CACHE_STRATEGIES.networkFirst;
  // Component JS/CSS: stale-while-revalidate (serve from cache, update in background)
  if (url.pathname.startsWith('/components/') && /\.(js|css)$/i.test(url.pathname)) return CACHE_STRATEGIES.staleWhileRevalidate;
  // Core/assets JS/CSS: stale-while-revalidate
  if ((url.pathname.startsWith('/core/') || url.pathname.startsWith('/assets/') || url.pathname.startsWith('/bootstrap-v2/') || url.pathname.startsWith('/config/')) && /\.(js|css)$/i.test(url.pathname)) return CACHE_STRATEGIES.staleWhileRevalidate;
  // Images, fonts, other static: Cache-First
  if (/\.(png|jpg|jpeg|gif|svg|woff2?|ttf|ico)$/i.test(url.pathname)) return CACHE_STRATEGIES.cacheFirst;
  // HTML pages: stale-while-revalidate
  if (url.pathname.endsWith('.html') || url.pathname === '/') return CACHE_STRATEGIES.staleWhileRevalidate;
  return CACHE_STRATEGIES.networkFirst;
}

self.addEventListener('install', function(event) {
  console.log('[SW] Installing v' + VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.allSettled(PRECACHE_ASSETS.map(function(url) {
        return cache.add(url).catch(function(err) { console.warn('[SW] Failed to cache:', url, err.message); return null; });
      }));
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Activating v' + VERSION);
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(key) { return key.startsWith('dshowdash-') && key !== CACHE_NAME; }).map(function(key) { console.log('[SW] Deleting old cache:', key); return caches.delete(key); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;
  var strategy = getStrategy(event.request);
  event.respondWith(strategy(event.request));
});

self.addEventListener('message', function(event) {
  var data = event.data || {};
  var type = data.type;
  var payload = data.payload;
  if (type === 'SKIP_WAITING') self.skipWaiting();
  else if (type === 'CACHE_URLS') caches.open(CACHE_NAME).then(function(cache) { cache.addAll(payload.urls || []); });
  else if (type === 'CLEAR_CACHE') caches.delete(CACHE_NAME);
  else if (type === 'GET_CACHE_SIZE') caches.open(CACHE_NAME).then(async function(cache) { var keys = await cache.keys(); event.ports[0].postMessage({ size: keys.length }); });
  else if (type === 'GET_VERSION') event.ports[0].postMessage({ version: VERSION });
});

console.log('[SW] Service Worker loaded, version:', VERSION);
