<?php
// SessionRecovery - Recuperação de Sessão
// @version 1.0.0-ENTERPRISE
// @created 2026-01-25
// #24: Sistema de recuperação de sessão em caso de falha

declare(strict_types=1);

class SessionRecovery
{
    private const SESSION_PATH = '/var/lib/php/sessions';
    private const BACKUP_PATH = '/var/lib/php/sessions/backup';
    private const MAX_RECOVERY_ATTEMPTS = 3;
    
    // Tentar recuperar sessão corrompida
    public static function attemptRecovery(string $sessionId): ?array
    {
        if (empty($sessionId) || !self::isValidSessionId($sessionId)) {
            return null;
        }
        
        // 1. Tentar ler sessão normal
        $sessionFile = self::SESSION_PATH . '/sess_' . $sessionId;
        $data = self::tryReadSession($sessionFile);
        
        if ($data !== null) {
            return $data;
        }
        
        // 2. Tentar backup se existir
        $backupFile = self::BACKUP_PATH . '/sess_' . $sessionId . '.bak';
        if (file_exists($backupFile)) {
            $data = self::tryReadSession($backupFile);
            if ($data !== null) {
                self::restoreFromBackup($sessionId, $backupFile);
                self::logRecovery($sessionId, 'backup_restored');
                return $data;
            }
        }
        
        // 3. Sessão não recuperável
        self::logRecovery($sessionId, 'recovery_failed');
        return null;
    }
    
    // Criar backup de sessão ativa
    public static function createBackup(string $sessionId): bool
    {
        if (empty($sessionId) || !self::isValidSessionId($sessionId)) {
            return false;
        }
        
        $sessionFile = self::SESSION_PATH . '/sess_' . $sessionId;
        
        if (!file_exists($sessionFile)) {
            return false;
        }
        
        // Criar diretório de backup se não existir
        if (!is_dir(self::BACKUP_PATH)) {
            @mkdir(self::BACKUP_PATH, 0700, true);
        }
        
        $backupFile = self::BACKUP_PATH . '/sess_' . $sessionId . '.bak';
        
        return @copy($sessionFile, $backupFile);
    }
    
    // Limpar backups antigos (mais de 24h)
    public static function cleanupOldBackups(): int
    {
        if (!is_dir(self::BACKUP_PATH)) {
            return 0;
        }
        
        $count = 0;
        $cutoff = time() - 86400;
        
        $files = @scandir(self::BACKUP_PATH);
        if ($files === false) {
            return 0;
        }
        
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }
            
            $filepath = self::BACKUP_PATH . '/' . $file;
            
            if (is_file($filepath) && filemtime($filepath) < $cutoff) {
                if (@unlink($filepath)) {
                    $count++;
                }
            }
        }
        
        return $count;
    }
    
    // Verificar integridade de sessão
    public static function verifyIntegrity(string $sessionId): array
    {
        $result = [
            'valid' => false,
            'exists' => false,
            'readable' => false,
            'parseable' => false,
            'has_user' => false,
            'has_csrf' => false,
            'expired' => true
        ];
        
        if (empty($sessionId) || !self::isValidSessionId($sessionId)) {
            return $result;
        }
        
        $sessionFile = self::SESSION_PATH . '/sess_' . $sessionId;
        
        $result['exists'] = file_exists($sessionFile);
        if (!$result['exists']) {
            return $result;
        }
        
        $result['readable'] = is_readable($sessionFile);
        if (!$result['readable']) {
            return $result;
        }
        
        $data = self::tryReadSession($sessionFile);
        $result['parseable'] = $data !== null;
        
        if (!$result['parseable']) {
            return $result;
        }
        
        $result['has_user'] = !empty($data['user_id']);
        $result['has_csrf'] = !empty($data['csrf']);
        $result['expired'] = isset($data['expires_at']) && time() > $data['expires_at'];
        $result['valid'] = $result['has_user'] && $result['has_csrf'] && !$result['expired'];
        
        return $result;
    }
    
    private static function tryReadSession(string $filepath): ?array
    {
        if (!file_exists($filepath) || !is_readable($filepath)) {
            return null;
        }
        
        $content = @file_get_contents($filepath);
        if ($content === false || empty($content)) {
            return null;
        }
        
        // Parse session data
        $currentSession = $_SESSION ?? [];
        $wasActive = session_status() === PHP_SESSION_ACTIVE;
        
        if ($wasActive) {
            session_write_close();
        }
        
        $_SESSION = [];
        
        if (session_status() === PHP_SESSION_NONE) {
            ini_set('session.use_cookies', '0');
            ini_set('session.use_only_cookies', '0');
            session_id('temp_recovery_' . bin2hex(random_bytes(8)));
            @session_start();
        }
        
        $result = null;
        if (@session_decode($content)) {
            $result = $_SESSION;
        }
        
        $_SESSION = [];
        @session_destroy();
        
        ini_set('session.use_cookies', '1');
        ini_set('session.use_only_cookies', '1');
        $_SESSION = $currentSession;
        
        return $result;
    }
    
    private static function restoreFromBackup(string $sessionId, string $backupFile): bool
    {
        $sessionFile = self::SESSION_PATH . '/sess_' . $sessionId;
        return @copy($backupFile, $sessionFile);
    }
    
    private static function isValidSessionId(string $sessionId): bool
    {
        if (strlen($sessionId) < 22 || strlen($sessionId) > 256) {
            return false;
        }
        if (!preg_match('/^[a-zA-Z0-9,-]+$/', $sessionId)) {
            return false;
        }
        $dangerous = ['..', '//', '\\', "\0"];
        foreach ($dangerous as $seq) {
            if (strpos($sessionId, $seq) !== false) {
                return false;
            }
        }
        return true;
    }
    
    private static function logRecovery(string $sessionId, string $event): void
    {
        error_log(json_encode([
            'component' => 'SessionRecovery',
            'event' => $event,
            'session_id_prefix' => substr($sessionId, 0, 8) . '...',
            'timestamp' => date('c')
        ]));
    }
    
    // Info para diagnóstico
    public static function info(): array
    {
        $backupCount = 0;
        if (is_dir(self::BACKUP_PATH)) {
            $files = @scandir(self::BACKUP_PATH);
            if ($files !== false) {
                $backupCount = count(array_filter($files, fn($f) => str_ends_with($f, '.bak')));
            }
        }
        
        return [
            'version' => '1.0.0-ENTERPRISE',
            'session_path' => self::SESSION_PATH,
            'backup_path' => self::BACKUP_PATH,
            'backup_count' => $backupCount,
            'max_recovery_attempts' => self::MAX_RECOVERY_ATTEMPTS
        ];
    }
}
