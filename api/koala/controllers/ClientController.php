<?php
// /api/koala/controllers/ClientController.php
// @module koala.controller.client @version 1.0.0-F2
declare(strict_types=1);

class ClientController
{
    // seg = ['clients','search'] | ['clients', {id}, 'orcamentos']
    public static function route(string $method, array $seg, array $koala, \PDO $pdo): void
    {
        $svc = new ClientIntegrationService();

        // Escopo por vendedor (BOLA no ERP): vendedor só busca/lê clientes e orçamentos que ele orçou;
        // gestor/admin => null (irrestrito). Ver PermissionService::erpVendorScope.
        $vendor = PermissionService::erpVendorScope($koala);

        if ($method === 'GET' && ($seg[1] ?? null) === 'search') {
            ApiResponse::success($svc->search((string) ($_GET['q'] ?? ''), $vendor));
        }

        if ($method === 'GET' && isset($seg[1]) && ctype_digit((string) $seg[1]) && ($seg[2] ?? null) === 'orcamentos') {
            ApiResponse::success($svc->orcamentos((int) $seg[1], $vendor));
        }

        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['hint' => 'clients/search?q= | clients/{id}/orcamentos']);
    }
}
