<?php
// /api/koala/services/UserAdminService.php
// Administração de perfis Koala (list + updateRole). @module koala.service.user_admin @version 1.0.0
declare(strict_types=1);

class UserAdminService
{
    private KoalaUserRepository $repo;
    public function __construct(\PDO $pdo) { $this->repo = new KoalaUserRepository($pdo); }

    public function listUsers(): array { return $this->repo->listAll(); }

    public function updateRole(int $id, string $role): array
    {
        $allowed = [PermissionService::ROLE_SELLER, PermissionService::ROLE_MANAGER, PermissionService::ROLE_ADMIN];
        if (!in_array($role, $allowed, true)) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'role', 'allowed' => $allowed]);
        }
        $current = $this->repo->findById($id);
        if ($current === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $id]);
        }
        // A6 (consolidação 2026-07-04): impedir lockout — não rebaixar o ÚLTIMO admin ATIVO.
        // Sem isso, o módulo poderia ficar sem nenhum administrador e ninguém conseguiria
        // gerir catálogo/templates/usuários. Só bloqueia quando o alvo é o último admin ativo.
        if ((string) $current['role'] === PermissionService::ROLE_ADMIN
            && $role !== PermissionService::ROLE_ADMIN
            && (int) $current['is_active'] === 1
            && $this->repo->countActiveByRole(PermissionService::ROLE_ADMIN) <= 1) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                'field'   => 'role',
                'message' => 'Não é possível rebaixar o último administrador ativo do Koala.',
            ]);
        }
        $this->repo->updateRole($id, $role);
        return $this->repo->findById($id) ?? [];
    }
}
