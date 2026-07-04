<?php
// /api/koala/controllers/ProposalExpenseController.php
// Sub-recurso /proposals/{id}/expenses. Espelho de ProposalItemController.
// @module koala.controller.proposal_expense @version 1.0.0
declare(strict_types=1);

class ProposalExpenseController
{
    // seg = ['proposals', {pid}, 'expenses', {expenseId|'reorder'}?]
    public static function route(string $method, array $seg, array $koala, \PDO $pdo): void
    {
        $pid = (int) $seg[1];
        $sub = $seg[3] ?? null;   // expenseId ou 'reorder'
        $svc = new ProposalExpenseService($pdo);

        if ($sub === null) {
            if ($method === 'GET') {
                ApiResponse::success($svc->list($koala, $pid));
            }
            if ($method === 'POST') {
                AuthHelpers::requireCsrf();
                ApiResponse::success($svc->add($koala, $pid, koala_body()), null, 201);
            }
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
        }

        if ($sub === 'reorder' && $method === 'POST') {
            AuthHelpers::requireCsrf();
            $b = koala_body();
            ApiResponse::success($svc->reorder($koala, $pid, $b['order'] ?? []));
        }

        if (ctype_digit((string) $sub)) {
            $expenseId = (int) $sub;
            if ($method === 'PUT') {
                AuthHelpers::requireCsrf();
                ApiResponse::success($svc->update($koala, $pid, $expenseId, koala_body()));
            }
            if ($method === 'DELETE') {
                AuthHelpers::requireCsrf();
                ApiResponse::success($svc->remove($koala, $pid, $expenseId));
            }
        }

        ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
    }
}
