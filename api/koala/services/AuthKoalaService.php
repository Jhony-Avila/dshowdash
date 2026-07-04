<?php
// /api/koala/services/AuthKoalaService.php
// Ponte entre a sessão do sistema (app_users) e o perfil próprio do Koala (koala_users).
// Auto-provisão no 1º acesso como 'seller' (papel mais restrito, seguro por default).
// @module koala.service.auth
// @version 1.0.0
// @created 2026-07-03

declare(strict_types=1);

class AuthKoalaService
{
    private KoalaUserRepository $repo;

    public function __construct(\PDO $pdo)
    {
        $this->repo = new KoalaUserRepository($pdo);
    }

    /**
     * Retorna o vínculo Koala do usuário logado; cria como 'seller' se ainda não existir.
     * name/email são preenchidos a partir de app_users (fonte canônica) na criação.
     */
    public function provisionAndGet(int $systemUserId, string $name = '', ?string $email = null): array
    {
        if ($systemUserId <= 0) {
            ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
        }

        $existing = $this->repo->findBySystemUserId($systemUserId);
        if ($existing !== null) {
            return $existing;
        }

        // 1º acesso: preencher a partir de app_users se a sessão não trouxe nome/email.
        if ($name === '' || $email === null) {
            $sys = $this->repo->fetchSystemUser($systemUserId);
            if ($sys !== null) {
                if ($name === '')      { $name  = (string) ($sys['username'] ?? ''); }
                if ($email === null)   { $email = $sys['email'] ?? null; }
            }
        }

        $newId = $this->repo->createSeller($systemUserId, $name !== '' ? $name : null, $email);
        $created = $this->repo->findById($newId);
        return $created ?? [
            'id'             => $newId,
            'system_user_id' => $systemUserId,
            'name'           => $name,
            'email'          => $email,
            'role'           => PermissionService::ROLE_SELLER,
            'is_active'      => 1,
        ];
    }
}
