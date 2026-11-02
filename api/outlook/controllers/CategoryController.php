<?php
// Outlook / CategoryController - categorias/cores (§15)
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// Categorias vivem no Graph (/me/outlook/masterCategories) — dependem do Azure.
// A gestao real (list/create/color/rename/delete) entra na Fase 3; ate la, o modo
// real devolve placeholder (available:false) e a aplicacao de categorias a mensagens
// ja existe via POST /messages/categories. No modo de testes, o MockController serve tudo.
declare(strict_types=1);

final class OutlookCategoryController
{
    public static function route(string $method, array $segments, ?PDO $pdo = null): void
    {
        unset($pdo, $segments);
        if ($method === 'GET') {
            ApiResponse::success([
                'available'  => false,
                'categories' => [],
                'message'    => 'A gestão de categorias usa o Microsoft Graph (Fase 3).',
            ]);
            return;
        }
        ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, [
            'message' => 'Gestão de categorias indisponível até a integração com a Microsoft.',
        ]);
    }
}
