<?php
// FileSessionStorage - Storage de sessão em arquivo
// @version 1.0.0-ENTERPRISE
// @created 2026-01-25
// #5: Implementação de storage em arquivo

declare(strict_types=1);

require_once __DIR__ . '/../contracts/ISessionStorage.php';

use Core\Contracts\ISessionStorage;

class FileSessionStorage implements ISessionStorage
{
    private string $path;
    
    public function __construct(string $path = '/var/lib/php/sessions')
    {
        $this->path = $path;
    }
    
    public function read(string $sessionId): ?array
    {
        if (!$this->isValidId($sessionId)) return null;
        $file = $this->getFilePath($sessionId);
        if (!file_exists($file) || !is_readable($file)) return null;
        $content = @file_get_contents($file);
        if ($content === false || empty($content)) return null;
        return $this->parseSessionContent($content);
    }
    
    public function write(string $sessionId, array $data, int $ttl = 604800): bool
    {
        if (!$this->isValidId($sessionId)) return false;
        return true;
    }
    
    public function destroy(string $sessionId): bool
    {
        if (!$this->isValidId($sessionId)) return false;
        $file = $this->getFilePath($sessionId);
        if (file_exists($file)) return @unlink($file);
        return true;
    }
    
    public function exists(string $sessionId): bool
    {
        if (!$this->isValidId($sessionId)) return false;
        return file_exists($this->getFilePath($sessionId));
    }
    
    public function touch(string $sessionId, int $ttl = 604800): bool
    {
        if (!$this->isValidId($sessionId)) return false;
        $file = $this->getFilePath($sessionId);
        if (file_exists($file)) return @touch($file);
        return false;
    }
    
    public function gc(int $maxLifetime): int
    {
        $count = 0;
        $cutoff = time() - $maxLifetime;
        $files = @scandir($this->path);
        if ($files === false) return 0;
        foreach ($files as $file) {
            if (!str_starts_with($file, 'sess_')) continue;
            $filepath = $this->path . '/' . $file;
            if (is_file($filepath) && filemtime($filepath) < $cutoff) {
                if (@unlink($filepath)) $count++;
            }
        }
        return $count;
    }
    
    public function healthCheck(): array
    {
        $writable = is_writable($this->path);
        $fileCount = 0;
        $files = @scandir($this->path);
        if ($files !== false) {
            $fileCount = count(array_filter($files, fn($f) => str_starts_with($f, 'sess_')));
        }
        return [
            'type' => 'file',
            'path' => $this->path,
            'writable' => $writable,
            'file_count' => $fileCount,
            'status' => $writable ? 'healthy' : 'degraded'
        ];
    }
    
    private function getFilePath(string $sessionId): string
    {
        return $this->path . '/sess_' . $sessionId;
    }
    
    private function isValidId(string $sessionId): bool
    {
        if (strlen($sessionId) < 22 || strlen($sessionId) > 256) return false;
        if (!preg_match('/^[a-zA-Z0-9,-]+$/', $sessionId)) return false;
        foreach (['..', '//', '\\', "\0"] as $seq) {
            if (strpos($sessionId, $seq) !== false) return false;
        }
        return true;
    }
    
    private function parseSessionContent(string $content): ?array
    {
        $currentSession = $_SESSION ?? [];
        $wasActive = session_status() === PHP_SESSION_ACTIVE;
        if ($wasActive) session_write_close();
        $_SESSION = [];
        if (session_status() === PHP_SESSION_NONE) {
            ini_set('session.use_cookies', '0');
            ini_set('session.use_only_cookies', '0');
            session_id('temp_parse_' . bin2hex(random_bytes(8)));
            @session_start();
        }
        $result = null;
        if (@session_decode($content)) $result = $_SESSION;
        $_SESSION = [];
        @session_destroy();
        ini_set('session.use_cookies', '1');
        ini_set('session.use_only_cookies', '1');
        $_SESSION = $currentSession;
        return $result;
    }
}
