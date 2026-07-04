<?php
// /api/koala/controllers/ItemController.php
// @module koala.controller.item @version 1.0.0
declare(strict_types=1);

class ItemController
{
    public static function route(string $method, array $seg, array $koala, \PDO $pdo): void
    {
        $svc = new ItemCatalogService($pdo);
        $sub = $seg[1] ?? null;
        $catId = isset($_GET['category']) && ctype_digit((string) $_GET['category']) ? (int) $_GET['category'] : null;

        // GET /items/search?q=&category=
        if ($method === 'GET' && $sub === 'search') {
            ApiResponse::success($svc->searchItems((string) ($_GET['q'] ?? ''), $catId));
        }
        // GET /items?category=
        if ($method === 'GET' && $sub === null) {
            ApiResponse::success($svc->listItems($catId));
        }
        // POST /items — admin
        if ($method === 'POST' && $sub === null) {
            PermissionService::requireAdmin($koala);
            AuthHelpers::requireCsrf();
            $createdBy = (int) $koala['id'];
            ApiResponse::success($svc->createItem(koala_body(), $createdBy), null, 201);
        }
        // PUT /items/{id} — admin
        if ($method === 'PUT' && $sub !== null && ctype_digit((string) $sub)) {
            PermissionService::requireAdmin($koala);
            AuthHelpers::requireCsrf();
            ApiResponse::success($svc->updateItem((int) $sub, koala_body()));
        }
        // DELETE /items/{id} — admin (soft: desativa)
        if ($method === 'DELETE' && $sub !== null && ctype_digit((string) $sub)) {
            PermissionService::requireAdmin($koala);
            AuthHelpers::requireCsrf();
            $svc->deactivateItem((int) $sub);
            ApiResponse::success(['deactivated' => (int) $sub]);
        }
        ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
    }
}
