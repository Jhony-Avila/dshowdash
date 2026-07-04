<?php
// /api/koala/controllers/ProposalItemController.php
// Sub-recurso /proposals/{id}/items. @module koala.controller.proposal_item @version 1.0.0-F2
declare(strict_types=1);

class ProposalItemController
{
    // seg = ['proposals', {pid}, 'items', {itemId|'reorder'}?]
    public static function route(string $method, array $seg, array $koala, \PDO $pdo): void
    {
        $pid = (int) $seg[1];
        $sub = $seg[3] ?? null;   // itemId ou 'reorder'
        $svc = new ProposalItemService($pdo);

        if ($sub === null) {
            if ($method === 'GET') {
                ApiResponse::success($svc->list($koala, $pid));
            }
            if ($method === 'POST') {
                AuthHelpers::requireCsrf();
                $b = koala_body();
                if (isset($b['catalog_item_id']) && ctype_digit((string) $b['catalog_item_id'])) {
                    ApiResponse::success($svc->addFromCatalog($koala, $pid, (int) $b['catalog_item_id'], $b), null, 201);
                }
                ApiResponse::success($svc->addManual($koala, $pid, $b), null, 201);
            }
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
        }

        if ($sub === 'reorder' && $method === 'POST') {
            AuthHelpers::requireCsrf();
            $b = koala_body();
            ApiResponse::success($svc->reorder($koala, $pid, $b['order'] ?? []));
        }

        if (ctype_digit((string) $sub)) {
            $itemId = (int) $sub;
            if ($method === 'PUT') {
                AuthHelpers::requireCsrf();
                ApiResponse::success($svc->update($koala, $pid, $itemId, koala_body()));
            }
            if ($method === 'DELETE') {
                AuthHelpers::requireCsrf();
                ApiResponse::success($svc->remove($koala, $pid, $itemId));
            }
        }

        ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
    }
}
