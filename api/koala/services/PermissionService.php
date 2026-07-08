<?php
// /api/koala/services/PermissionService.php
// Controle de perfil PRÓPRIO do Koala Docs (seller/manager/admin) — SEMPRE validado no backend.
// Decisão 9.5: vendedor só as dele; gestor/admin todas. Nunca confiar só no front.
// @module koala.service.permission
// @version 1.0.0
// @created 2026-07-03

declare(strict_types=1);

class PermissionService
{
    public const ROLE_SELLER  = 'seller';
    public const ROLE_MANAGER = 'manager';
    public const ROLE_ADMIN   = 'admin';

    public static function role(array $koalaUser): string
    {
        return (string) ($koalaUser['role'] ?? self::ROLE_SELLER);
    }

    public static function isActive(array $koalaUser): bool
    {
        return (int) ($koalaUser['is_active'] ?? 0) === 1;
    }

    public static function isAdmin(array $koalaUser): bool
    {
        return self::role($koalaUser) === self::ROLE_ADMIN;
    }

    public static function isManagerOrAdmin(array $koalaUser): bool
    {
        return in_array(self::role($koalaUser), [self::ROLE_MANAGER, self::ROLE_ADMIN], true);
    }

    /** Vendedor enxerga só as próprias propostas; gestor/admin enxergam todas. */
    public static function canSeeAllProposals(array $koalaUser): bool
    {
        return self::isManagerOrAdmin($koalaUser);
    }

    /**
     * Escopo do ERP por vendedor: dados de cliente/orçamento do ERP têm dono via Orcamento.Nome_Vendedor.
     * Gestor/admin => null (irrestrito, mesma semântica de canSeeAllProposals). Vendedor => o próprio
     * nome (identidade no ERP = koala_users.name). Vendedor sem nome => '' (fail-closed: não casa nada).
     * IMPORTANTE: assume que koala_users.name === Orcamento.Nome_Vendedor (validar com vendedor real).
     */
    public static function erpVendorScope(array $koalaUser): ?string
    {
        if (self::canSeeAllProposals($koalaUser)) { return null; }
        return trim((string) ($koalaUser['name'] ?? ''));
    }

    /**
     * Exige que o usuário Koala tenha um dos papéis dados; senão responde 403 e encerra.
     * (ApiResponse::error faz exit.)
     */
    public static function requireRole(array $koalaUser, array $allowedRoles): void
    {
        if (!self::isActive($koalaUser) || !in_array(self::role($koalaUser), $allowedRoles, true)) {
            ApiResponse::error(ApiResponse::ERR_NOT_AUTHORIZED, 403, [
                'required' => array_values($allowedRoles),
                'role'     => self::role($koalaUser),
            ]);
        }
    }

    public static function requireAdmin(array $koalaUser): void
    {
        self::requireRole($koalaUser, [self::ROLE_ADMIN]);
    }

    public static function requireManagerOrAdmin(array $koalaUser): void
    {
        self::requireRole($koalaUser, [self::ROLE_MANAGER, self::ROLE_ADMIN]);
    }
}
