<?php
// /api/koala/controllers/PaymentMethodController.php
// @module koala.controller.payment_method @version 1.0.0
declare(strict_types=1);

class PaymentMethodController
{
    public static function route(string $method, array $seg, array $koala, \PDO $pdo): void
    {
        $svc = new PaymentTermsService($pdo);
        $sub = $seg[1] ?? null;

        if ($method === 'GET' && $sub === null) {
            ApiResponse::success($svc->list());
        }
        if ($method === 'POST' && $sub === null) {
            PermissionService::requireAdmin($koala);
            AuthHelpers::requireCsrf();
            ApiResponse::success($svc->create(koala_body(), (int) $koala['id']), null, 201);
        }
        if ($method === 'PUT' && $sub !== null && ctype_digit((string) $sub)) {
            PermissionService::requireAdmin($koala);
            AuthHelpers::requireCsrf();
            ApiResponse::success($svc->update((int) $sub, koala_body()));
        }
        ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
    }
}
