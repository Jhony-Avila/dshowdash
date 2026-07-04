<?php
// /api/koala/index.php
// Roteador PATH_INFO do Koala Docs (autenticado). Espelha api/permissions/index.php.
// nginx (Etapa 3) mapeia ^/api/koala(/.*)?$ -> este arquivo, com PATH_INFO = trecho após /api/koala.
// @module koala.router
// @version 1.0.0-F1
// @created 2026-07-03

declare(strict_types=1);

require_once __DIR__ . '/_init.php';

// Consolidação 2026-07-04: handler global — qualquer exceção não capturada (ex.: PDOException
// em caminho de escrita) sai como envelope ApiResponse padrão (500) e é LOGADA, em vez de
// vazar fatal cru / resposta inconsistente. display_errors já está Off (nada de stack ao cliente).
set_exception_handler(static function (\Throwable $e): void {
    error_log('[koala] uncaught ' . get_class($e) . ': ' . $e->getMessage()
        . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (class_exists('ApiResponse')) {
        ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'Erro interno ao processar a solicitacao.']);
    } else {
        http_response_code(500);
        echo json_encode(['ok' => false, 'data' => null, 'error' => 'INTERNAL_ERROR']);
    }
});

SessionGate::start();
AuthHelpers::requireAuth();

// Consolidação 2026-07-04: GATE CENTRAL de CSRF para toda escrita (POST/PUT/PATCH/DELETE),
// defesa-em-profundidade. Os controllers mantêm requireCsrf() próprio (redundância intencional);
// aqui garante que um endpoint novo que esqueça a linha NÃO nasça vulnerável. GET não é afetado.
AuthHelpers::requireCsrfForWrite();

// Usuário do sistema (app_users) → provisiona/obtém o perfil próprio do Koala.
$sysUser      = getCurrentUser();
$systemUserId = (int) ($sysUser['id'] ?? 0);

$pdo   = getConnection('DSHOWDASH');
$koala = (new AuthKoalaService($pdo))->provisionAndGet(
    $systemUserId,
    (string) ($sysUser['name'] ?? ''),
    $sysUser['email'] ?? null
);

// Usuário Koala desativado não acessa nada (defesa no backend).
if (!PermissionService::isActive($koala)) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHORIZED, 403, ['message' => 'Usuario Koala inativo']);
}

// Roteamento por PATH_INFO (ex.: "/items/search" -> ['items','search']).
$method   = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path     = trim((string) ($_SERVER['PATH_INFO'] ?? ''), '/');
$segments = $path === '' ? [] : explode('/', $path);
$resource = $segments[0] ?? '';

switch ($resource) {
    case 'users':
        UserController::route($method, $segments, $koala, $pdo);
        break;
    case 'item-categories':
        ItemCategoryController::route($method, $segments, $koala, $pdo);
        break;
    case 'items':
        ItemController::route($method, $segments, $koala, $pdo);
        break;
    case 'commercial-terms':
        CommercialTermController::route($method, $segments, $koala, $pdo);
        break;
    case 'payment-methods':
        PaymentMethodController::route($method, $segments, $koala, $pdo);
        break;
    case 'templates':
        TemplateController::route($method, $segments, $koala, $pdo);
        break;
    case 'proposals':
        ProposalController::route($method, $segments, $koala, $pdo);
        break;
    case 'clients':
        ClientController::route($method, $segments, $koala, $pdo);
        break;
    case 'sections':
        SectionController::route($method, $segments, $koala, $pdo);
        break;
    default:
        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, [
            'method' => $method,
            'path'   => '/' . $path,
            'hint'   => 'Koala F1: users | item-categories | items | commercial-terms | payment-methods | templates',
        ]);
}
