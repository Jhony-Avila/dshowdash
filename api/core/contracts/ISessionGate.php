<?php
// ISessionGate - Interface para SessionGate
// @version 1.0.0-ENTERPRISE
// @created 2026-01-25
// #2: Interface para mocking/testing e abstração

declare(strict_types=1);

namespace Core\Contracts;

interface ISessionGate
{
    // Leitura
    public static function readOnly(?string $sessionId = null): array;
    public static function validate(): ?array;
    public static function getUser(): ?array;
    public static function getUserId(): ?int;
    public static function getLevel(): int;
    public static function isActive(): bool;
    
    // CSRF
    public static function getCsrfToken(): string;
    public static function rotateCsrfToken(): string;
    public static function validateCsrfAge(): bool;
    
    // Ciclo de vida
    public static function start(): void;
    public static function create(array $userData): bool;
    public static function destroy(): void;
    public static function refresh(): void;
    
    // Permissões
    public static function hasPermission(string $permission): bool;
    public static function requireAuth(): array;
    
    // Flash messages
    public static function setFlash(string $type, string $message): void;
    public static function getFlash(string $type): ?string;
    public static function getAllFlash(): array;
    
    // Utilitários
    public static function updateUser(array $data): void;
    public static function clearReadOnlyCache(): void;
    public static function healthCheck(): array;
}
