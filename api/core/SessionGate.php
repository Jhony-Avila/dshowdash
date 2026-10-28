<?php
// SessionGate - Gerenciamento de Sessões Enterprise
// @version 6.0.0-ENTERPRISE
// @updated 2026-01-25
// v6.0.0: INTEGRAÇÃO COMPLETA
//   - Integra SessionRecovery para auto-recovery
//   - Integra FileSessionStorage como abstração
//   - Usa LoggerTrait para logging estruturado
// v5.0.0: FASE 2 + FASE 3 MELHORIAS (#3, #11, #13, #15, #16, #22)
// v4.0.0: FASE 1 MELHORIAS (#7, #9, #10, #12, #14, #28)

declare(strict_types=1);

require_once __DIR__ . '/CookieParamsFactory.php';
require_once __DIR__ . '/SessionRecovery.php';
require_once __DIR__ . '/storage/FileSessionStorage.php';
require_once __DIR__ . '/traits/LoggerTrait.php';

class SessionGate {
    
    use LoggerTrait;
    
    // Constantes de configuração
    const SESSION_COOKIE_NAME = 'DSHOWSESS';
    const SESSION_LIFETIME = 604800;
    const SESSION_REFRESH_THRESHOLD = 3600;
    const SESSION_PATH = '/var/lib/php/sessions';
    const CSRF_TOKEN_MAX_AGE = 14400;
    const BIND_SESSION_TO_IP = false;
    const VERSION = '6.0.0-ENTERPRISE';
    const ENABLE_AUTO_RECOVERY = true;
    
    // Cache interno
    private static ?array $_sessionCache = null;
    private static ?array $_userCache = null;
    private static bool $_initialized = false;
    private static array $_readOnlyCache = [];
    private static ?string $_requestId = null;
    
    // Storage abstraction
    private static ?FileSessionStorage $_storage = null;
    
    // Obter storage instance
    private static function getStorage(): FileSessionStorage
    {
        if (self::$_storage === null) {
            self::$_storage = new FileSessionStorage(self::SESSION_PATH);
        }
        return self::$_storage;
    }
    
    public static function getRequestId(): string
    {
        if (self::$_requestId === null) {
            self::$_requestId = 'req_' . bin2hex(random_bytes(8));
        }
        return self::$_requestId;
    }
    
    public static function setRequestId(string $requestId): void
    {
        self::$_requestId = $requestId;
    }
    
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
                self::logSecurity('SessionGate', 'invalid_session_id', [
                    'reason' => 'dangerous_sequence',
                    'request_id' => self::getRequestId()
                ]);
                return false;
            }
        }
        return true;
    }
    
    // Leitura com auto-recovery integrado
    public static function readOnly(?string $sessionId = null): array
    {
        $sessionId = $sessionId ?? ($_COOKIE[self::SESSION_COOKIE_NAME] ?? '');
        
        if (empty($sessionId)) {
            return [];
        }

        if (!self::isValidSessionId($sessionId)) {
            return [];
        }
        
        if (isset(self::$_readOnlyCache[$sessionId])) {
            return self::$_readOnlyCache[$sessionId];
        }

        try {
            // Usar storage abstraction
            $result = self::getStorage()->read($sessionId);
            
            // Se falhou e auto-recovery está habilitado, tentar recuperar
            if (($result === null || empty($result)) && self::ENABLE_AUTO_RECOVERY) {
                $recovered = SessionRecovery::attemptRecovery($sessionId);
                if ($recovered !== null) {
                    $result = $recovered;
                    self::logInfo('SessionGate', 'session_recovered', [
                        'session_id_prefix' => substr($sessionId, 0, 8),
                        'request_id' => self::getRequestId()
                    ]);
                }
            }
            
            if ($result === null) {
                return [];
            }
            
            self::$_readOnlyCache[$sessionId] = $result;
            return $result;
            
        } catch (\Throwable $e) {
            self::logError('SessionGate', 'session_read_error', [
                'error' => $e->getMessage(),
                'session_id_prefix' => substr($sessionId, 0, 8),
                'request_id' => self::getRequestId()
            ]);
            return [];
        }
    }
    
    public static function clearReadOnlyCache(): void
    {
        self::$_readOnlyCache = [];
    }

    private static function getCookieParams(): array
    {
        return CookieParamsFactory::createSessionParams();
    }
    
    public static function start(): void {
        if (self::$_initialized) {
            return;
        }
        
        if (session_status() === PHP_SESSION_NONE) {
            $params = self::getCookieParams();
            
            ini_set('session.cookie_httponly', '1');
            ini_set('session.cookie_secure', $params['secure'] ? '1' : '0');
            ini_set('session.use_strict_mode', '1');
            ini_set('session.cookie_samesite', $params['samesite']);

            session_save_path(self::SESSION_PATH);
            session_name(self::SESSION_COOKIE_NAME);
            session_set_cookie_params($params);
            
            session_start();
        }
        
        self::$_initialized = true;
    }
    
    public static function validate(): ?array {
        self::start();
        
        if (self::$_sessionCache !== null) {
            return self::$_sessionCache;
        }
        
        if (empty($_SESSION['user_id'])) {
            return null;
        }
        
        if (isset($_SESSION['expires_at']) && time() > $_SESSION['expires_at']) {
            self::logSecurity('SessionGate', 'session_expired', [
                'user_id' => $_SESSION['user_id'] ?? null,
                'request_id' => self::getRequestId()
            ]);
            self::destroy();
            return null;
        }
        
        $fingerprint = self::generateFingerprint();
        if (isset($_SESSION['fingerprint']) && $_SESSION['fingerprint'] !== $fingerprint) {
            self::logSecurity('SessionGate', 'session_hijack_attempt', [
                'user_id' => $_SESSION['user_id'] ?? null,
                'expected_fingerprint' => substr($_SESSION['fingerprint'], 0, 16) . '...',
                'received_fingerprint' => substr($fingerprint, 0, 16) . '...',
                'request_id' => self::getRequestId()
            ]);
            self::destroy();
            return null;
        }
        
        if (self::BIND_SESSION_TO_IP && isset($_SESSION['bound_ip'])) {
            $currentIp = self::getClientIp();
            if ($_SESSION['bound_ip'] !== $currentIp) {
                self::logSecurity('SessionGate', 'session_ip_mismatch', [
                    'user_id' => $_SESSION['user_id'] ?? null,
                    'expected_ip' => $_SESSION['bound_ip'],
                    'received_ip' => $currentIp,
                    'request_id' => self::getRequestId()
                ]);
                self::destroy();
                return null;
            }
        }
        
        if (isset($_SESSION['last_activity'])) {
            $idleTime = time() - $_SESSION['last_activity'];
            if ($idleTime > self::SESSION_REFRESH_THRESHOLD) {
                self::refresh();
            }
        }
        
        $_SESSION['last_activity'] = time();
        
        self::$_sessionCache = [
            'user_id' => $_SESSION['user_id'],
            'level' => $_SESSION['level'] ?? 0,
            'roles' => $_SESSION['roles'] ?? [],
            'email' => $_SESSION['email'] ?? '',
            'name' => $_SESSION['name'] ?? '',
            'expires_at' => $_SESSION['expires_at'] ?? null
        ];
        
        return self::$_sessionCache;
    }
    
    public static function validateCsrfAge(): bool
    {
        self::start();
        
        $csrfCreatedAt = $_SESSION['csrf_created_at'] ?? null;
        
        if ($csrfCreatedAt === null) {
            return true;
        }
        
        $age = time() - $csrfCreatedAt;
        
        if ($age > self::CSRF_TOKEN_MAX_AGE) {
            self::logSecurity('SessionGate', 'csrf_token_expired', [
                'user_id' => $_SESSION['user_id'] ?? null,
                'token_age' => $age,
                'max_age' => self::CSRF_TOKEN_MAX_AGE,
                'request_id' => self::getRequestId()
            ]);
            return false;
        }
        
        return true;
    }
    
    public static function rotateCsrfToken(): string
    {
        self::start();
        
        $newToken = bin2hex(random_bytes(32));
        $_SESSION['csrf'] = $newToken;
        $_SESSION['csrf_created_at'] = time();
        
        self::logInfo('SessionGate', 'csrf_rotated', [
            'user_id' => $_SESSION['user_id'] ?? null,
            'request_id' => self::getRequestId()
        ]);
        
        return $newToken;
    }
    
    public static function getCsrfToken(): string
    {
        self::start();
        
        if (empty($_SESSION['csrf'])) {
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
            $_SESSION['csrf_created_at'] = time();
        } elseif (!isset($_SESSION['csrf_created_at'])) {
            $_SESSION['csrf_created_at'] = time();
        }
        
        return $_SESSION['csrf'];
    }
    
    public static function requireAuth(): array {
        $session = self::validate();
        
        if (!$session) {
            http_response_code(401);
            header('Content-Type: application/json');
            exit(json_encode([
                'ok' => false,
                'error' => 'Autenticação necessária',
                'code' => 'AUTH_REQUIRED',
                'request_id' => self::getRequestId()
            ]));
        }
        
        return $session;
    }
    
    // @deprecated P3.2: Use UARPSGate::enforceTrigger()
    public static function requireAdmin(): array {
        self::logWarning('SessionGate', 'deprecated_method_called', [
            'method' => 'requireAdmin',
            'request_id' => self::getRequestId()
        ]);
        
        $session = self::requireAuth();
        $level = (int)($session['level'] ?? 0);
        
        if ($level < 80) {
            http_response_code(403);
            header('Content-Type: application/json');
            exit(json_encode([
                'ok' => false,
                'error' => 'Acesso negado - Requer permissão de administrador',
                'code' => 'ADMIN_REQUIRED',
                'request_id' => self::getRequestId()
            ]));
        }
        
        return $session;
    }
    
    public static function destroy(): void {
        self::start();
        
        $userId = $_SESSION['user_id'] ?? null;
        $sessionId = session_id();
        
        // Criar backup antes de destruir (para recovery se necessário)
        if (self::ENABLE_AUTO_RECOVERY && !empty($sessionId)) {
            SessionRecovery::createBackup($sessionId);
        }
        
        $sensitiveKeys = ['csrf', 'csrf_created_at', 'user_id', 'level', 'roles', 
                         'email', 'name', 'fingerprint', 'bound_ip', 'permissions'];
        foreach ($sensitiveKeys as $key) {
            if (isset($_SESSION[$key])) {
                $_SESSION[$key] = null;
                unset($_SESSION[$key]);
            }
        }
        
        $_SESSION = [];
        
        if (ini_get('session.use_cookies')) {
            $params = CookieParamsFactory::createExpiredParams();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }
        
        session_destroy();
        
        // Usar storage para destruir arquivo
        if (!empty($sessionId)) {
            self::getStorage()->destroy($sessionId);
        }
        
        self::$_sessionCache = null;
        self::$_userCache = null;
        self::$_initialized = false;
        self::$_readOnlyCache = [];
        
        if ($userId) {
            self::logInfo('SessionGate', 'session_destroyed', [
                'user_id' => $userId,
                'request_id' => self::getRequestId()
            ]);
        }
    }
    
    public static function refresh(): void {
        self::start();
        
        $sessionData = $_SESSION;
        
        session_regenerate_id(true);
        
        $_SESSION = $sessionData;
        $_SESSION['last_activity'] = time();
        $_SESSION['expires_at'] = time() + self::SESSION_LIFETIME;
        
        self::$_sessionCache = null;
        self::$_readOnlyCache = [];
    }
    
    public static function create(array $userData): bool {
        self::start();
        
        session_regenerate_id(true);
        
        $_SESSION['user_id'] = $userData['id'] ?? $userData['user_id'];
        $_SESSION['level'] = $userData['level'] ?? 0;
        $_SESSION['roles'] = $userData['roles'] ?? [];
        $_SESSION['email'] = $userData['email'] ?? '';
        $_SESSION['name'] = $userData['name'] ?? $userData['full_name'] ?? '';
        $_SESSION['fingerprint'] = self::generateFingerprint();
        $_SESSION['created_at'] = time();
        $_SESSION['last_activity'] = time();
        $_SESSION['expires_at'] = time() + self::SESSION_LIFETIME;
        
        if (self::BIND_SESSION_TO_IP) {
            $_SESSION['bound_ip'] = self::getClientIp();
        }
        
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        $_SESSION['csrf_created_at'] = time();
        
        self::$_sessionCache = null;
        self::$_userCache = null;
        self::$_readOnlyCache = [];
        
        self::logInfo('SessionGate', 'session_created', [
            'user_id' => $_SESSION['user_id'],
            'request_id' => self::getRequestId()
        ]);
        
        return true;
    }
    
    public static function getUser(): ?array {
        if (self::$_userCache !== null) {
            return self::$_userCache;
        }
        
        $session = self::validate();
        if (!$session) {
            return null;
        }
        
        self::$_userCache = [
            'id' => $session['user_id'],
            'user_id' => $session['user_id'],
            'level' => $session['level'],
            'roles' => $session['roles'],
            'email' => $session['email'],
            'name' => $session['name']
        ];
        
        return self::$_userCache;
    }
    
    public static function getUserId(): ?int {
        $session = self::validate();
        return $session ? (int)$session['user_id'] : null;
    }
    
    public static function getLevel(): int {
        $session = self::validate();
        return $session ? (int)$session['level'] : 0;
    }
    
    // @deprecated P3.2
    public static function isAdmin(): bool {
        return self::getLevel() >= 80;
    }
    
    // @deprecated P3.2
    public static function isSuperAdmin(): bool {
        return self::getLevel() >= 100;
    }
    
    public static function hasPermission(string $permission): bool {
        $session = self::validate();
        if (!$session) {
            return false;
        }
        
        $roles = $session['roles'] ?? [];
        
        if (in_array('super_admin', $roles) || self::getLevel() >= 100) {
            return true;
        }
        
        if (in_array('admin', $roles) || self::getLevel() >= 80) {
            $superAdminOnly = ['system:destroy', 'users:delete_all', 'config:reset'];
            if (!in_array($permission, $superAdminOnly)) {
                return true;
            }
        }
        
        $permissions = $_SESSION['permissions'] ?? [];
        return in_array($permission, $permissions);
    }
    
    public static function setFlash(string $type, string $message): void {
        self::start();
        $_SESSION['flash'][$type] = $message;
    }
    
    public static function getFlash(string $type): ?string {
        self::start();
        
        if (isset($_SESSION['flash'][$type])) {
            $message = $_SESSION['flash'][$type];
            unset($_SESSION['flash'][$type]);
            return $message;
        }
        
        return null;
    }
    
    public static function getAllFlash(): array {
        self::start();
        
        $flash = $_SESSION['flash'] ?? [];
        unset($_SESSION['flash']);
        
        return $flash;
    }
    
    private static function generateFingerprint(): string {
        $data = [
            $_SERVER['HTTP_USER_AGENT'] ?? '',
            $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '',
        ];
        
        return hash('sha256', implode('|', $data));
    }
    
    private static function getClientIp(): string {
        $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        
        return '0.0.0.0';
    }
    
    public static function isActive(): bool {
        return self::validate() !== null;
    }
    
    public static function updateUser(array $data): void {
        self::start();
        
        foreach ($data as $key => $value) {
            if (in_array($key, ['level', 'roles', 'email', 'name'])) {
                $_SESSION[$key] = $value;
            }
        }
        
        self::$_sessionCache = null;
        self::$_userCache = null;
    }
    
    public static function healthCheck(): array {
        $sessionActive = session_status() === PHP_SESSION_ACTIVE;
        $userAuthenticated = self::isActive();
        
        // Usar storage para health check
        $storageHealth = self::getStorage()->healthCheck();
        
        // Recovery info
        $recoveryInfo = SessionRecovery::info();
        
        $csrfAge = null;
        if ($sessionActive && isset($_SESSION['csrf_created_at'])) {
            $csrfAge = time() - $_SESSION['csrf_created_at'];
        }
        
        $sessionTimeRemaining = null;
        if ($sessionActive && isset($_SESSION['expires_at'])) {
            $sessionTimeRemaining = max(0, $_SESSION['expires_at'] - time());
        }
        
        return [
            'status' => $storageHealth['status'],
            'version' => self::VERSION,
            'session' => [
                'active' => $sessionActive,
                'authenticated' => $userAuthenticated,
                'id_prefix' => $sessionActive ? substr(session_id(), 0, 8) . '...' : null,
                'time_remaining' => $sessionTimeRemaining,
                'idle_threshold' => self::SESSION_REFRESH_THRESHOLD
            ],
            'csrf' => [
                'age' => $csrfAge,
                'max_age' => self::CSRF_TOKEN_MAX_AGE,
                'valid' => $csrfAge === null || $csrfAge <= self::CSRF_TOKEN_MAX_AGE
            ],
            'storage' => $storageHealth,
            'recovery' => [
                'enabled' => self::ENABLE_AUTO_RECOVERY,
                'backup_count' => $recoveryInfo['backup_count'] ?? 0
            ],
            'features' => [
                'ip_binding' => self::BIND_SESSION_TO_IP,
                'csrf_rotation' => true,
                'graceful_degradation' => true,
                'auto_recovery' => self::ENABLE_AUTO_RECOVERY,
                'storage_abstraction' => true,
                'structured_logging' => true
            ],
            'request_id' => self::getRequestId()
        ];
    }
    
    public static function publicHealthInfo(): array {
        return [
            'status' => is_writable(self::SESSION_PATH) ? 'ok' : 'degraded',
            'version' => self::VERSION
        ];
    }
}
