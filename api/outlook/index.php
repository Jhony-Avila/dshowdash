<?php
// Outlook / index.php - roteador PATH_INFO do modulo (Integracao Outlook)
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// Molde: api/pipedrive/index.php. nginx mapeia ^/api/outlook(/.*)?$ para este arquivo.
//
// Rotas (Fase 0):
//   GET    /status                        estado da config/integracao + contas do usuario
//   GET    /accounts                      lista contas Microsoft do usuario
//   POST   /accounts/connect              inicia OAuth -> {authorize_url}  (CSRF)
//   GET    /accounts/callback             callback OAuth (browser; SEM CSRF, valida state) -> redirect
//   POST   /accounts/{id}/reconnect       reinicia OAuth p/ uma conta (CSRF)
//   PATCH  /accounts/{id}                 define padrao (CSRF)
//   DELETE /accounts/{id}                 desconecta (CSRF)
//   GET    /messages                      lista Caixa de Entrada (?account_id=)
//   GET    /messages/{id}                 abre mensagem (?account_id=)
//   POST   /messages/send                 envia (CSRF)
declare(strict_types=1);

@ini_set('display_errors', '0');   // nunca vazar stack/paths ao cliente

require_once __DIR__ . '/_init.php';

set_exception_handler(static function (\Throwable $e): void {
    error_log('[outlook] uncaught ' . get_class($e) . ': ' . $e->getMessage()
        . ' @ ' . $e->getFile() . ':' . $e->getLine());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, [
        'message' => 'Erro interno ao processar a solicitacao.',
    ]);
});

$method   = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path     = trim((string)($_SERVER['PATH_INFO'] ?? ''), '/');
$segments = $path === '' ? [] : explode('/', $path);

// ── Callback OAuth (EXTERNO): redirect do navegador vindo da Microsoft ──
// Precede o gate de CSRF (o redirect nao carrega token CSRF; a protecao e o
// parametro `state`, unico e consumido 1x). Ainda exige sessao valida do usuario.
if (($segments[0] ?? '') === 'accounts' && ($segments[1] ?? '') === 'callback') {
    SessionGate::start();
    if (!isAuthenticated()) {
        // Sessao ausente: manda ao login e depois ao SPA de contas.
        header('Location: /#/panel-outlook/contas?outlook_auth=error&reason=session', true, 302);
        return;
    }
    if (outlook_is_mock()) {
        OutlookMockController::callback();
        return;
    }
    OutlookAuthController::callback(getConnection('OUTLOOK_DSHOW'));
    return;
}

SessionGate::start();
outlook_require_access();
AuthHelpers::requireCsrfForWrite();   // gate central de CSRF para POST/PUT/PATCH/DELETE

// Modo de testes (OUTLOOK_PROVIDER=mock): serve dados ficticios, sem Graph nem OUTLOOK_DSHOW.
if (outlook_is_mock()) {
    OutlookMockController::route($method, $segments);
    return;
}

// Banco OUTLOOK_DSHOW ainda pode nao existir na Fase 0 (aguardando provisionamento).
// Nesse caso, /status ainda responde (prontidao de config); demais rotas dao 503 claro.
try {
    $pdo = getConnection('OUTLOOK_DSHOW');
} catch (\Throwable $e) {
    error_log('[outlook] banco indisponivel: ' . $e->getMessage());
    $route = $segments[0] ?? '';
    if ($route === '' || $route === 'status') {
        OutlookStatusController::degraded();
    } elseif ($route === 'header-counter') {
        // Badge do header degrada para 0 limpo (sem banco ainda): evita erro no envelope do header.
        ApiResponse::success(['received_today' => 0, 'unread' => 0, 'updated_at' => gmdate('c'), 'degraded' => true]);
    } elseif ($route === 'dashboard') {
        ApiResponse::success(['available' => false, 'reason' => 'requires_sync',
            'message' => 'O dashboard usa métricas da sincronização (Fase 2).']);
    } elseif ($route === 'templates') {
        OutlookTemplateController::route($method, $segments, null);
    } elseif ($route === 'categories') {
        OutlookCategoryController::route($method, $segments, null);
    } elseif ($route === 'rules') {
        OutlookRulesController::route($method, $segments, null);
    } elseif ($route === 'mass') {
        OutlookMassController::route($method, $segments, null);
    } else {
        ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, [
            'message' => 'Banco OUTLOOK_DSHOW indisponivel. Provisione o schema (sql/outlook_schema.sql) e o usuario da aplicacao.',
        ]);
    }
    return;
}

switch ($segments[0] ?? '') {
    case '':
    case 'status':
        OutlookStatusController::status($method, $pdo);
        break;

    case 'accounts':
        OutlookAuthController::route($method, $segments, $pdo);
        break;

    case 'messages':
        OutlookMessageController::route($method, $segments, $pdo);
        break;

    case 'folders':
        OutlookFolderController::route($method, $pdo);
        break;

    case 'header-counter':
        OutlookMetricsController::headerCounter($method, $pdo);
        break;

    case 'dashboard':
        OutlookMetricsController::dashboard($method, $pdo, $segments);
        break;

    case 'templates':
        OutlookTemplateController::route($method, $segments, $pdo);
        break;

    case 'categories':
        OutlookCategoryController::route($method, $segments, $pdo);
        break;

    case 'rules':
        OutlookRulesController::route($method, $segments, $pdo);
        break;

    case 'mass':
        OutlookMassController::route($method, $segments, $pdo);
        break;

    default:
        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, [
            'message' => 'Rota desconhecida: /' . $path,
        ]);
}
