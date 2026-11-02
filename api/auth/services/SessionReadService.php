<?php
// SessionReadService - Leitura de Sessão Isolada
// @version 1.0.0-ENTERPRISE
// @created 2026-01-25
// #1: Serviço dedicado para leitura de sessão sem side-effects
// Elimina código duplicado entre LogoutValidator e RefreshValidator

declare(strict_types=1);

class SessionReadService
{
    private const SESSION_PATH = '/var/lib/php/sessions';
    private const SESSION_COOKIE_NAME = 'DSHOWSESS';
    
    // Cache por request
    private static array $cache = [];
    
    // Lê dados da sessão SEM iniciar sessão PHP (zero Set-Cookie)
    public static function read(?string $sessionId = null): array
    {
        $sessionId = $sessionId ?? ($_COOKIE[self::SESSION_COOKIE_NAME] ?? '');
        
        if (empty($sessionId)) {
            return self::emptyResult();
        }
        
        // Validação de segurança
        if (!self::isValidSessionId($sessionId)) {
            return self::emptyResult();
        }
        
        // Cache hit
        if (isset(self::$cache[$sessionId])) {
            return self::$cache[$sessionId];
        }
        
        // Ler arquivo
        $sessionPath = self::SESSION_PATH . '/sess_' . $sessionId;
        
        if (!file_exists($sessionPath) || !is_readable($sessionPath)) {
            return self::emptyResult();
        }
        
        $content = @file_get_contents($sessionPath);
        
        if ($content === false || empty($content)) {
            return self::emptyResult();
        }
        
        $data = self::parseSessionContent($content);
        
        $result = [
            'csrf' => $data['csrf'] ?? null,
            'csrf_created_at' => $data['csrf_created_at'] ?? null,
            'user_id' => $data['user_id'] ?? null,
            'level' => $data['level'] ?? null,
            'roles' => $data['roles'] ?? [],
            'fingerprint' => $data['fingerprint'] ?? null,
            'expires_at' => $data['expires_at'] ?? null,
            'last_activity' => $data['last_activity'] ?? null
        ];
        
        // Cache store
        self::$cache[$sessionId] = $result;
        
        return $result;
    }
    
    // Limpa cache (útil em testes)
    public static function clearCache(): void
    {
        self::$cache = [];
    }
    
    // Resultado vazio padrão
    private static function emptyResult(): array
    {
        return [
            'csrf' => null,
            'csrf_created_at' => null,
            'user_id' => null,
            'level' => null,
            'roles' => [],
            'fingerprint' => null,
            'expires_at' => null,
            'last_activity' => null
        ];
    }
    
    // Validação de session ID (anti-path-traversal)
    private static function isValidSessionId(string $sessionId): bool
    {
        if (strlen($sessionId) < 22 || strlen($sessionId) > 256) {
            return false;
        }
        
        if (!preg_match('/^[a-zA-Z0-9,-]+$/', $sessionId)) {
            return false;
        }
        
        $dangerous = ['..', '//', '\\', "\0", "\r", "\n"];
        foreach ($dangerous as $seq) {
            if (strpos($sessionId, $seq) !== false) {
                return false;
            }
        }
        
        return true;
    }
    
    // Parser de conteúdo de sessão PHP
    private static function parseSessionContent(string $content): array
    {
        $result = [];
        
        // Salvar estado
        $currentSession = $_SESSION ?? [];
        $wasActive = session_status() === PHP_SESSION_ACTIVE;
        
        if ($wasActive) {
            session_write_close();
        }
        
        // Sessão temporária para decode
        $_SESSION = [];
        
        if (session_status() === PHP_SESSION_NONE) {
            ini_set('session.use_cookies', '0');
            ini_set('session.use_only_cookies', '0');
            session_id('temp_read_' . bin2hex(random_bytes(8)));
            @session_start();
        }
        
        if (@session_decode($content)) {
            $result = $_SESSION;
        }
        
        // Limpar
        $_SESSION = [];
        @session_destroy();
        
        // Restaurar
        ini_set('session.use_cookies', '1');
        ini_set('session.use_only_cookies', '1');
        $_SESSION = $currentSession;
        
        return $result;
    }
}
