<?php
// Outlook / FolderController - GET /folders
// @version 1.0.0
// @created 2026-07-21
declare(strict_types=1);

final class OutlookFolderController
{
    public static function route(string $method, PDO $pdo): void
    {
        if ($method !== 'GET') {
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
            return;
        }
        $userId = getCurrentUserId();
        $accountId = (int)($_GET['account_id'] ?? 0);
        if ($accountId <= 0) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'account_id obrigatorio.']);
            return;
        }
        $repo = new OutlookAccountRepository($pdo);
        if ($repo->getPublic($userId, $accountId) === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Conta nao encontrada.']);
            return;
        }
        $svc = new OutlookFolderService($pdo, new OutlookAuthService($pdo));
        $res = $svc->listFolders($userId, $accountId);
        if (!($res['ok'] ?? false)) {
            $code = $res['error_code'] ?? 'GRAPH_ERROR';
            if ($code === 'NEEDS_AUTH') { ApiResponse::error('NEEDS_AUTH', 401, ['message' => 'A conta requer nova autenticacao.']); return; }
            ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 502, ['message' => 'Falha ao listar pastas.', 'code' => $code]);
            return;
        }
        ApiResponse::success(['folders' => $res['folders']]);
    }
}
