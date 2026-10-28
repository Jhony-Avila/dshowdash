<?php
// Google Calendar / index.php - roteador PATH_INFO do modulo
// @version 1.0.0
// @created 2026-07-29
// @app Google Calendar
//
// Molde: api/outlook/index.php. nginx mapeia ^/api/google-calendar(/.*)?$ para
// este arquivo com PATH_INFO.
//
// Rotas (Fase 2 — mock-first):
//   GET    /status                                    prontidao da integracao
//   GET    /header/summary                            resumo do icone do header (§8.2)
//   GET    /header/next                               3 proximos compromissos (§9)
//   GET    /overview                                  KPIs Hoje + carga 28d (§15, §16, §38)
//   GET    /accounts                                  contas Google conectadas + checklist de go-live
//   POST   /accounts/connect                          inicia OAuth, devolve authorize_url (CSRF)
//   GET    /accounts/callback                         retorno do Google — REDIRECIONA (fora do gate CSRF)
//   DELETE /accounts/{id}                             desconecta e revoga (CSRF)
//   GET    /calendars                                 calendarios acessiveis
//   GET    /calendars/resources                       salas / showroom / veiculos
//   GET    /events                                    eventos da janela
//   POST   /events                                    cria evento (CSRF)
//   GET    /events/{calendarId}/{eventId}             abre evento
//   PATCH  /events/{calendarId}/{eventId}             edita/move (CSRF)
//   DELETE /events/{calendarId}/{eventId}             exclui/cancela (CSRF)
//   GET    /freebusy                                  disponibilidade + sugestoes
//   GET    /invitations                               central de convites
//   POST   /invitations/{calendarId}/{eventId}/respond  responde convite (CSRF)
//   GET    /conflicts                                 central de conflitos
//   GET    /alerts                                    alertas
//   GET    /links                                     tipos vinculaveis (§57)
//   GET    /links/search?q=&tipo=                      autocomplete sobre Pipedrive/Koala REAIS
//   GET    /links/entity/{tipo}/{id}                   ficha lateral da entidade (§32.2)
//   POST   /events/{cal}/{evt}/links                   anexa vinculo (CSRF)
//   DELETE /events/{cal}/{evt}/links/{tipo}/{id}       remove vinculo (CSRF)
//   GET    /reports                                   catalogo de relatorios (§64)
//   GET    /reports/{tipo}                            relatorio agregado; tipos especiais:
//                                                     `fluxo` (Sankey §40) e `rede` (§65)
//   GET    /sync                                      estado da sincronizacao
//   POST   /sync/run                                  sincroniza agora, sincrono (CSRF)
//                                                     corpo opcional {account_id, completa}
//   POST   /sync/watch                                (re)abre canais push da conta (CSRF)
//   POST   /webhook                                   push do Google — SEM sessao/CSRF (Fase 5)
//
// NOTA SOBRE IDs NA URL: calendarId e um e-mail (contem @ e ponto) e eventId
// vem do Google. Ambos entram no PATH mas sao SEMPRE urlencoded pelo cliente e
// decodificados aqui; nenhum deles toca sistema de arquivos.
declare(strict_types=1);

@ini_set('display_errors', '0');   // nunca vazar stack/paths ao cliente

require_once __DIR__ . '/_init.php';

set_exception_handler(static function (\Throwable $e): void {
    error_log('[gcal] uncaught ' . get_class($e) . ': ' . $e->getMessage()
        . ' @ ' . $e->getFile() . ':' . $e->getLine());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, [
        'message' => 'Erro interno ao processar a solicitacao.',
    ]);
});

$method   = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path     = trim((string)($_SERVER['PATH_INFO'] ?? ''), '/');
$segments = $path === '' ? [] : array_map('rawurldecode', explode('/', $path));

// ── Webhook push (EXTERNO): POST do Google, SEM sessao e SEM CSRF ──
// Vem antes de tudo de propósito: quem chama e um servidor do Google, que nao
// tem cookie nem token. A autenticacao e a tripla channel_id + resource_id +
// token, conferida no controller contra `gcal_watch_channels`.
// NAO abrir sessao aqui — `session_start()` por notificacao criaria um arquivo
// de sessao descartavel a cada POST do Google.
if (($segments[0] ?? '') === 'webhook') {
    if ($method !== 'POST') {
        header('Allow: POST');
        http_response_code(405);
        return;
    }
    GcalWebhookController::receber();
    return;
}

// ── Callback OAuth (EXTERNO): redirect do navegador vindo do Google ──
// Precede o gate de CSRF (o redirect nao carrega token; a protecao e o `state`,
// unico e consumido 1x). Ainda exige sessao valida.
if (($segments[0] ?? '') === 'accounts' && ($segments[1] ?? '') === 'callback') {
    SessionGate::start();
    if (!isAuthenticated()) {
        header('Location: /#/panel-google-calendar/contas?gcal_auth=error&reason=session', true, 302);
        return;
    }
    GcalAccountController::callback();
    return;
}

SessionGate::start();
gcal_require_access();
AuthHelpers::requireCsrfForWrite();   // gate central de CSRF para POST/PUT/PATCH/DELETE

$p = gcal_provider();

/** 405 padronizado, com o Allow correto. */
$metodoInvalido = static function (array $permitidos): void {
    header('Allow: ' . implode(', ', $permitidos));
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, [
        'message' => 'Método não permitido nesta rota.',
    ]);
};

switch ($segments[0] ?? '') {
    case '':
    case 'status':
        if ($method !== 'GET') { $metodoInvalido(['GET']); }
        GcalStatusController::status($p);
        break;

    case 'header':
        if ($method !== 'GET') { $metodoInvalido(['GET']); }
        if (($segments[1] ?? '') === 'next') {
            GcalStatusController::proximos($p);
        } else {
            GcalStatusController::headerSummary($p);
        }
        break;

    case 'overview':
        if ($method !== 'GET') { $metodoInvalido(['GET']); }
        GcalOverviewController::overview($p);
        break;

    case 'accounts':
        if (($segments[1] ?? '') === 'connect') {
            if ($method !== 'POST') { $metodoInvalido(['POST']); }
            GcalAccountController::conectar($p);
        } elseif (($segments[1] ?? '') !== '') {
            if ($method !== 'DELETE') { $metodoInvalido(['DELETE']); }
            GcalAccountController::desconectar($p, $segments[1]);
        } else {
            if ($method !== 'GET') { $metodoInvalido(['GET']); }
            GcalAccountController::listar($p);
        }
        break;

    case 'calendars':
        if ($method !== 'GET') { $metodoInvalido(['GET']); }
        if (($segments[1] ?? '') === 'resources') {
            GcalCalendarController::recursos($p);
        } else {
            GcalCalendarController::listar($p);
        }
        break;

    case 'events':
        $calendarId = $segments[1] ?? null;
        $eventId    = $segments[2] ?? null;

        if ($calendarId === null) {
            if ($method === 'GET')  { GcalEventController::listar($p); break; }
            if ($method === 'POST') { GcalEventController::criar($p);  break; }
            $metodoInvalido(['GET', 'POST']);
        }
        if ($eventId === null) {
            ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400, [
                'message' => 'Informe calendarId e eventId: /events/{calendarId}/{eventId}',
            ]);
        }
        // /events/{cal}/{evt}/links[...] — vinculo interno (§57)
        if (($segments[3] ?? '') === 'links') {
            if ($method === 'POST') {
                GcalLinkController::vincular($p, $calendarId, $eventId); break;
            }
            if ($method === 'DELETE') {
                $tipo = $segments[4] ?? null; $ident = $segments[5] ?? null;
                if ($tipo === null || $ident === null) {
                    ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400, [
                        'message' => 'Use /events/{calendarId}/{eventId}/links/{tipo}/{id}',
                    ]);
                }
                GcalLinkController::desvincular($p, $calendarId, $eventId, $tipo, $ident); break;
            }
            $metodoInvalido(['POST', 'DELETE']);
        }
        if ($method === 'GET')    { GcalEventController::abrir($p, $calendarId, $eventId);    break; }
        if ($method === 'PATCH' || $method === 'PUT') {
            GcalEventController::atualizar($p, $calendarId, $eventId); break;
        }
        if ($method === 'DELETE') { GcalEventController::excluir($p, $calendarId, $eventId);  break; }
        $metodoInvalido(['GET', 'PATCH', 'DELETE']);
        break;

    case 'freebusy':
        if ($method !== 'GET') { $metodoInvalido(['GET']); }
        GcalFreeBusyController::consultar($p);
        break;

    case 'invitations':
        $calendarId = $segments[1] ?? null;
        $eventId    = $segments[2] ?? null;
        $acao       = $segments[3] ?? null;

        if ($calendarId === null) {
            if ($method !== 'GET') { $metodoInvalido(['GET']); }
            GcalInvitationController::listar($p);
            break;
        }
        if ($eventId === null || $acao !== 'respond') {
            ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 400, [
                'message' => 'Use /invitations/{calendarId}/{eventId}/respond',
            ]);
        }
        if ($method !== 'POST') { $metodoInvalido(['POST']); }
        GcalInvitationController::responder($p, $calendarId, $eventId);
        break;

    case 'conflicts':
        if ($method !== 'GET') { $metodoInvalido(['GET']); }
        GcalConflictController::listar($p);
        break;

    case 'alerts':
        if ($method !== 'GET') { $metodoInvalido(['GET']); }
        GcalAlertController::listar($p);
        break;

    case 'links':
        if ($method !== 'GET') { $metodoInvalido(['GET']); }
        $sub = $segments[1] ?? '';
        if ($sub === 'search') {
            GcalLinkController::buscar();
        } elseif ($sub === 'entity') {
            $tipo = $segments[2] ?? null; $ident = $segments[3] ?? null;
            if ($tipo === null || $ident === null) {
                ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400, [
                    'message' => 'Use /links/entity/{tipo}/{id}',
                ]);
            }
            GcalLinkController::ficha($tipo, $ident);
        } else {
            GcalLinkController::tipos();
        }
        break;

    case 'reports':
        if ($method !== 'GET') { $metodoInvalido(['GET']); }
        if (($segments[1] ?? '') === '') {
            GcalReportController::catalogo($p);
        } else {
            GcalReportController::gerar($p, $segments[1]);
        }
        break;

    case 'sync':
        if (($segments[1] ?? '') === 'run') {
            if ($method !== 'POST') { $metodoInvalido(['POST']); }
            GcalSyncController::executar($p);
        } elseif (($segments[1] ?? '') === 'watch') {
            if ($method !== 'POST') { $metodoInvalido(['POST']); }
            GcalSyncController::religarCanais($p);
        } else {
            if ($method !== 'GET') { $metodoInvalido(['GET']); }
            GcalSyncController::listar($p);
        }
        break;

    default:
        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, [
            'message' => 'Rota desconhecida no módulo Google Calendar.',
        ]);
}
