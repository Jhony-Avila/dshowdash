<?php
// LoginValidator
// @version 2.0.0-ENTERPRISE
// @created 2026-01-21
// @updated 2026-01-25
// v2.0.0: Fase 2 - Herda de ValidatorBase
// v1.1.0: FIX - Aceita tanto 'login' quanto 'username' no payload

declare(strict_types=1);

require_once __DIR__ . '/ValidatorBase.php';

class LoginValidator extends ValidatorBase
{
    public const MAX_LOGIN_LENGTH = 255;
    public const MAX_PASSWORD_LENGTH = 1024;
    public const MAX_PAYLOAD_SIZE = 10240;
    
    public static function validateRequest(): ?array
    {
        $methodError = self::validateMethod('POST');
        if ($methodError) {
            return $methodError;
        }
        
        $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
        if (stripos($contentType, 'application/json') === false) {
            return [
                'error' => 'UNSUPPORTED_MEDIA_TYPE',
                'code' => 415,
                'message' => 'Content-Type deve ser application/json'
            ];
        }
        
        $contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
        if ($contentLength > self::MAX_PAYLOAD_SIZE) {
            return [
                'error' => 'PAYLOAD_TOO_LARGE',
                'code' => 413,
                'message' => 'Payload excede o limite de 10KB'
            ];
        }
        
        return null;
    }
    
    public static function validatePayload(string $raw): array
    {
        return self::validateJsonPayload($raw, self::MAX_PAYLOAD_SIZE);
    }
    
    public static function validateCredentials(array $data): array
    {
        $login = trim((string)($data['login'] ?? $data['username'] ?? ''));
        $password = (string)($data['password'] ?? '');
        
        if ($login === '' || $password === '') {
            return [
                'success' => false,
                'error' => 'MISSING_CREDENTIALS',
                'code' => 400,
                'message' => 'Usuário e senha são obrigatórios'
            ];
        }
        
        if (strlen($login) > self::MAX_LOGIN_LENGTH || strlen($password) > self::MAX_PASSWORD_LENGTH) {
            return [
                'success' => false,
                'error' => 'INVALID_PAYLOAD',
                'code' => 400,
                'message' => 'Credenciais excedem o tamanho permitido'
            ];
        }
        
        return ['success' => true, 'login' => $login, 'password' => $password];
    }
}
