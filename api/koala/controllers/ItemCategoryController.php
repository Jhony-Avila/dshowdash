<?php
// /api/koala/controllers/ItemCategoryController.php
// @module koala.controller.item_category @version 1.0.0
declare(strict_types=1);

class ItemCategoryController
{
    public static function route(string $method, array $seg, array $koala, \PDO $pdo): void
    {
        $svc = new ItemCatalogService($pdo);

        if ($method === 'GET' && !isset($seg[1])) {
            ApiResponse::success($svc->listCategories());
        }
        if ($method === 'POST' && !isset($seg[1])) {
            PermissionService::requireAdmin($koala);
            AuthHelpers::requireCsrf();
            ApiResponse::success($svc->createCategory(koala_body()), null, 201);
        }
        ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
    }
}
