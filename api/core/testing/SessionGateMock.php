<?php
// SessionGateMock - Mock para testes unitários
// @version 1.0.0-ENTERPRISE
// @created 2026-01-25
// #18/#20: Mock e Test Mode para SessionGate

declare(strict_types=1);

namespace Core\Testing;

class SessionGateMock
{
    private static array $mockSession = [];
    private static ?array $mockUser = null;
    private static bool $isAuthenticated = false;
    private static string $mockCsrf = '';
    private static ?string $mockRequestId = null;
    private static array $flashMessages = [];
    
    public static function reset(): void
    {
        self::$mockSession = [];
        self::$mockUser = null;
        self::$isAuthenticated = false;
        self::$mockCsrf = '';
        self::$mockRequestId = null;
        self::$flashMessages = [];
    }
    
    public static function setMockUser(array $user): void
    {
        self::$mockUser = $user;
        self::$isAuthenticated = true;
        self::$mockSession['user_id'] = $user['id'] ?? $user['user_id'] ?? null;
        self::$mockSession['level'] = $user['level'] ?? 0;
        self::$mockSession['roles'] = $user['roles'] ?? [];
        self::$mockSession['email'] = $user['email'] ?? '';
        self::$mockSession['name'] = $user['name'] ?? '';
    }
    
    public static function setMockCsrf(string $csrf): void
    {
        self::$mockCsrf = $csrf;
        self::$mockSession['csrf'] = $csrf;
        self::$mockSession['csrf_created_at'] = time();
    }
    
    public static function setMockSession(array $session): void
    {
        self::$mockSession = $session;
        self::$isAuthenticated = !empty($session['user_id']);
    }
    
    public static function setUnauthenticated(): void
    {
        self::$mockUser = null;
        self::$isAuthenticated = false;
        self::$mockSession = [];
    }
    
    public static function start(): void {}
    
    public static function validate(): ?array
    {
        if (!self::$isAuthenticated) return null;
        return [
            'user_id' => self::$mockSession['user_id'] ?? null,
            'level' => self::$mockSession['level'] ?? 0,
            'roles' => self::$mockSession['roles'] ?? [],
            'email' => self::$mockSession['email'] ?? '',
            'name' => self::$mockSession['name'] ?? '',
            'expires_at' => self::$mockSession['expires_at'] ?? null
        ];
    }
    
    public static function readOnly(?string $sessionId = null): array
    {
        return self::$mockSession;
    }
    
    public static function getUser(): ?array { return self::$mockUser; }
    public static function getUserId(): ?int { return self::$mockSession['user_id'] ?? null; }
    public static function getLevel(): int { return (int)(self::$mockSession['level'] ?? 0); }
    public static function isActive(): bool { return self::$isAuthenticated; }
    
    public static function getCsrfToken(): string
    {
        if (empty(self::$mockCsrf)) {
            self::$mockCsrf = 'mock_csrf_' . bin2hex(random_bytes(16));
            self::$mockSession['csrf'] = self::$mockCsrf;
            self::$mockSession['csrf_created_at'] = time();
        }
        return self::$mockCsrf;
    }
    
    public static function rotateCsrfToken(): string
    {
        self::$mockCsrf = 'mock_csrf_rotated_' . bin2hex(random_bytes(16));
        self::$mockSession['csrf'] = self::$mockCsrf;
        self::$mockSession['csrf_created_at'] = time();
        return self::$mockCsrf;
    }
    
    public static function validateCsrfAge(): bool
    {
        $createdAt = self::$mockSession['csrf_created_at'] ?? null;
        if ($createdAt === null) return true;
        return (time() - $createdAt) <= 14400;
    }
    
    public static function create(array $userData): bool { self::setMockUser($userData); return true; }
    public static function destroy(): void { self::reset(); }
    public static function refresh(): void
    {
        self::$mockSession['last_activity'] = time();
        self::$mockSession['expires_at'] = time() + 604800;
    }
    
    public static function requireAuth(): array
    {
        $session = self::validate();
        if (!$session) throw new \RuntimeException('AUTH_REQUIRED');
        return $session;
    }
    
    public static function hasPermission(string $permission): bool
    {
        if (!self::$isAuthenticated) return false;
        if (self::getLevel() >= 100) return true;
        $permissions = self::$mockSession['permissions'] ?? [];
        return in_array($permission, $permissions);
    }
    
    public static function getRequestId(): string
    {
        if (self::$mockRequestId === null) {
            self::$mockRequestId = 'mock_req_' . bin2hex(random_bytes(8));
        }
        return self::$mockRequestId;
    }
    
    public static function setRequestId(string $requestId): void { self::$mockRequestId = $requestId; }
    
    public static function healthCheck(): array
    {
        return ['status' => 'mock', 'version' => '5.0.0-MOCK', 'mock_mode' => true];
    }
    
    public static function setFlash(string $type, string $message): void { self::$flashMessages[$type] = $message; }
    public static function getFlash(string $type): ?string
    {
        $message = self::$flashMessages[$type] ?? null;
        unset(self::$flashMessages[$type]);
        return $message;
    }
    public static function getAllFlash(): array
    {
        $flash = self::$flashMessages;
        self::$flashMessages = [];
        return $flash;
    }
}
