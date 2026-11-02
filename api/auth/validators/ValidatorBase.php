<?php
// ValidatorBase - Classe base para Validators
// @version 1.0.0-ENTERPRISE
// @created 2026-01-25
// #4: Elimina código duplicado entre validators

declare(strict_types=1);

require_once __DIR__ . '/../services/SessionReadService.php';

abstract class ValidatorBase
{
    // Validação de método HTTP
    protected static function validateMethod(string $expected): ?array
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? '';
        
        if ($method !== $expected) {
            return [
                'error' => 'METHOD_NOT_ALLOWED',
                'code' => 405,
                'message' => "Apenas método $expected é permitido"
            ];
        }
        
        return null;
    }
    
    // Validação de CSRF
    public static function validateCsrf(?string $csrfToken, ?string $sessionCsrf): ?array
    {
        if (empty($sessionCsrf)) {
            return [
                'error' => 'INVALID_CSRF_TOKEN',
                'code' => 403,
                'message' => 'Sessão não encontrada ou expirada'
            ];
        }
        
        if (empty($csrfToken)) {
            return [
                'error' => 'INVALID_CSRF_TOKEN',
                'code' => 403,
                'message' => 'Token CSRF não fornecido'
            ];
        }
        
        if (!hash_equals($sessionCsrf, $csrfToken)) {
            return [
                'error' => 'INVALID_CSRF_TOKEN',
                'code' => 403,
                'message' => 'Token CSRF inválido'
            ];
        }
        
        return null;
    }
    
    // Extrai token CSRF do request
    public static function extractCsrfToken(): ?string
    {
        return $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? null;
    }
    
    // Lê dados da sessão (delega para SessionReadService)
    public static function readSessionData(): array
    {
        return SessionReadService::read();
    }
    
    // Validação de autenticação
    public static function validateAuth(?int $userId): ?array
    {
        if (empty($userId)) {
            return [
                'error' => 'UNAUTHORIZED',
                'code' => 401,
                'message' => 'Sessão não autenticada'
            ];
        }
        
        return null;
    }
    
    // Validação de payload JSON
    protected static function validateJsonPayload(string $raw, int $maxSize = 10240): array
    {
        if (strlen($raw) > $maxSize) {
            return [
                'success' => false,
                'error' => 'PAYLOAD_TOO_LARGE',
                'code' => 413,
                'message' => 'Payload excede o limite'
            ];
        }
        
        $data = json_decode($raw, true, flags: JSON_BIGINT_AS_STRING);
        
        if (!is_array($data)) {
            return [
                'success' => false,
                'error' => 'INVALID_JSON',
                'code' => 400,
                'message' => 'Payload JSON inválido'
            ];
        }
        
        return ['success' => true, 'data' => $data];
    }
}
