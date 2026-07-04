<?php
// /api/koala/controllers/UserController.php
// @module koala.controller.user @version 1.0.0
declare(strict_types=1);

class UserController
{
    public static function route(string $method, array $seg, array $koala, \PDO $pdo): void
    {
        // GET /users/me — qualquer usuário autenticado (o próprio perfil)
        if ($method === 'GET' && ($seg[1] ?? null) === 'me') {
            ApiResponse::success([
                'id' => (int) $koala['id'], 'system_user_id' => (int) $koala['system_user_id'],
                'name' => $koala['name'], 'email' => $koala['email'], 'role' => $koala['role'],
                'is_active' => (int) $koala['is_active'],
                'can_see_all' => PermissionService::canSeeAllProposals($koala),
            ]);
        }

        $svc = new UserAdminService($pdo);

        // GET /users — gestor/admin
        if ($method === 'GET' && !isset($seg[1])) {
            PermissionService::requireManagerOrAdmin($koala);
            ApiResponse::success($svc->listUsers());
        }

        // PUT /users/{id} — admin (muda papel)
        if ($method === 'PUT' && isset($seg[1]) && ctype_digit((string) $seg[1])) {
            PermissionService::requireAdmin($koala);
            AuthHelpers::requireCsrf();
            $body = koala_body();
            ApiResponse::success($svc->updateRole((int) $seg[1], (string) ($body['role'] ?? '')));
        }

        ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
    }
}
