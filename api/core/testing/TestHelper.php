<?php
// TestHelper - Utilitários para testes
// @version 1.0.0-ENTERPRISE
// @created 2026-01-25
// #19: Helpers para testes unitários

declare(strict_types=1);

namespace Core\Testing;

class TestHelper
{
    public static function createTestUser(array $overrides = []): array
    {
        return array_merge([
            'id' => 999, 'user_id' => 999, 'username' => 'test_user',
            'email' => 'test@example.com', 'name' => 'Test User',
            'level' => 50, 'roles' => ['user'], 'permissions' => ['read:basic'], 'status' => 'active'
        ], $overrides);
    }
    
    public static function createTestAdmin(array $overrides = []): array
    {
        return self::createTestUser(array_merge([
            'id' => 1, 'username' => 'test_admin', 'email' => 'admin@example.com',
            'name' => 'Test Admin', 'level' => 100, 'roles' => ['super_admin', 'admin'], 'permissions' => ['*']
        ], $overrides));
    }
    
    public static function createTestSession(array $user, array $overrides = []): array
    {
        $now = time();
        return array_merge([
            'user_id' => $user['id'] ?? $user['user_id'], 'level' => $user['level'] ?? 0,
            'roles' => $user['roles'] ?? [], 'email' => $user['email'] ?? '', 'name' => $user['name'] ?? '',
            'csrf' => bin2hex(random_bytes(32)), 'csrf_created_at' => $now,
            'fingerprint' => hash('sha256', 'test'), 'created_at' => $now,
            'last_activity' => $now, 'expires_at' => $now + 604800
        ], $overrides);
    }
    
    public static function createValidCsrf(): string { return bin2hex(random_bytes(32)); }
    
    public static function createExpiredCsrf(): array
    {
        return ['csrf' => bin2hex(random_bytes(32)), 'csrf_created_at' => time() - 20000];
    }
    
    public static function mockRequest(string $method, array $headers = [], array $cookies = []): void
    {
        $_SERVER['REQUEST_METHOD'] = $method;
        foreach ($headers as $name => $value) {
            $_SERVER['HTTP_' . strtoupper(str_replace('-', '_', $name))] = $value;
        }
        $_COOKIE = $cookies;
    }
    
    public static function clearMockRequest(): void
    {
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $_COOKIE = [];
        foreach (['HTTP_X_CSRF_TOKEN', 'HTTP_AUTHORIZATION', 'HTTP_ORIGIN'] as $h) unset($_SERVER[$h]);
    }
    
    public static function assertApiSuccess(array $response): bool { return ($response['ok'] ?? false) === true; }
    public static function assertApiError(array $response, ?string $expectedError = null): bool
    {
        if (($response['ok'] ?? true) !== false) return false;
        if ($expectedError !== null && ($response['error'] ?? null) !== $expectedError) return false;
        return true;
    }
    
    public static function randomIp(): string { return rand(1,255).'.'.rand(0,255).'.'.rand(0,255).'.'.rand(1,254); }
    public static function randomSessionId(): string { return bin2hex(random_bytes(16)); }
}
