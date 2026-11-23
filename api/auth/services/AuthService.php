<?php
// AuthService
// @version 3.0.0-ENTERPRISE
// @created 2026-01-21
// @updated 2026-01-25
// v3.0.0: FASE 1 MELHORIAS
//   #7  - CSRF Token Rotation após operações write
//   #14 - Telemetry expandida
//   #21 - Retry com backoff em persistSession
// v2.0.0: P2 - Adicionados métodos logout() e refreshSession() com observabilidade

declare(strict_types=1);

require_once __DIR__ . '/../repositories/AuthRepository.php';
require_once __DIR__ . '/../../core/AccessLevels.php';
require_once __DIR__ . '/../../core/SessionGate.php';
require_once __DIR__ . '/../../core/SessaoRegistro.php';

class AuthService
{
    private AuthRepository $repository;
    private PDO $pdo;
    
    // #21: Configuração de retry
    private const MAX_RETRY_ATTEMPTS = 3;
    private const RETRY_BASE_DELAY_MS = 100;
    private const RETRY_BACKOFF_MULTIPLIER = 2;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->repository = new AuthRepository($pdo);
    }

    // ════════════════════════════════════════════════════════════
    // AUTHENTICATE (LOGIN)
    // ════════════════════════════════════════════════════════════

    public function authenticate(string $login, string $password, string $ip, array $deviceInfo): array
    {
        $requestId = $this->generateRequestId();

        $user = $this->repository->findUserByLogin($login);

        if (!$user) {
            $this->logEvent(null, 'login_failed', $ip, [
                'username' => $login,
                'reason' => 'user_not_found',
                'request_id' => $requestId
            ]);
            return ['success' => false, 'error' => 'INVALID_CREDENTIALS', 'code' => 401, 'message' => 'Usuário ou senha incorretos'];
        }

        $userId = (int)$user['id'];

        $statusCheck = $this->checkUserStatus($user, $login, $ip, $requestId);
        if (!$statusCheck['success']) {
            return $statusCheck;
        }

        if (!password_verify($password, $user['password'])) {
            $this->logEvent($userId, 'login_failed', $ip, [
                'username' => $login,
                'reason' => 'wrong_password',
                'request_id' => $requestId
            ]);
            return ['success' => false, 'error' => 'INVALID_CREDENTIALS', 'code' => 401, 'message' => 'Usuário ou senha incorretos'];
        }

        $this->repository->updateLastLogin($userId, $ip);
        $this->logEvent($userId, 'login_success', $ip, [
            'username' => $user['username'],
            'device' => $deviceInfo,
            'request_id' => $requestId
        ]);

        error_log("LOGIN SUCCESS: IP=$ip, USER={$user['username']}, ID=$userId, REQ=$requestId");

        $rolesData = $this->loadRolesAndPermissions($userId, $user['username'], $ip);
        $sessionData = $this->createUserSession($user, $rolesData, $ip, $deviceInfo);
        if ($sessionData === null) {
            // DSHOW-110: o login NÃO concede sessão se não conseguiu gravar o registro em app_user_sessions
            $this->logEvent($userId, 'login_sem_registro', $ip, ['request_id' => $requestId]);
            return ['success' => false, 'error' => 'SESSION_NOT_PERSISTED', 'code' => 503, 'message' => 'Não foi possível iniciar a sessão agora. Tente de novo em instantes.'];
        }

        return [
            'success' => true,
            'user' => $sessionData['user'],
            'session' => $sessionData['session'],
            'request_id' => $requestId
        ];
    }

    // ════════════════════════════════════════════════════════════
    // LOGOUT
    // ════════════════════════════════════════════════════════════

    public function logout(int $userId, string $sessionToken, string $ip): array
    {
        $requestId = $this->generateRequestId();

        try {
            $user = $this->repository->findUserById($userId);
            $username = $user['username'] ?? 'unknown';

            SessionGate::start();
            // DSHOW-110: o registro fica INATIVO (antes: DELETE). O token é o id da sessão em curso (o cookie pode estar velho).
            $tokenAtual = session_id() !== '' ? session_id() : $sessionToken;
            if (!SessaoRegistro::encerrar($tokenAtual, $userId, 'logout')) {
                $this->logEvent($userId, 'logout_registro_nao_gravado', $ip, ['request_id' => $requestId]);
            }
            $_SESSION = [];

            if (ini_get("session.use_cookies")) {
                $params = session_get_cookie_params();
                setcookie(
                    session_name(),
                    '',
                    time() - 42000,
                    $params["path"],
                    $params["domain"],
                    $params["secure"],
                    $params["httponly"]
                );
            }

            session_destroy();

            $this->logEvent($userId, 'logout_success', $ip, [
                'username' => $username,
                'session_token' => substr($sessionToken, 0, 8) . '...',
                'request_id' => $requestId
            ]);

            error_log("LOGOUT SUCCESS: IP=$ip, USER=$username, ID=$userId, REQ=$requestId");

            return [
                'success' => true,
                'message' => 'Logout realizado com sucesso',
                'request_id' => $requestId
            ];

        } catch (\Exception $e) {
            $this->logEvent($userId, 'logout_failed', $ip, [
                'error' => $e->getMessage(),
                'request_id' => $requestId
            ]);

            error_log("LOGOUT ERROR: IP=$ip, ID=$userId, ERR={$e->getMessage()}, REQ=$requestId");

            return [
                'success' => false,
                'error' => 'LOGOUT_ERROR',
                'code' => 500,
                'message' => 'Erro ao realizar logout',
                'request_id' => $requestId
            ];
        }
    }

    public function logCsrfFailure(string $ip, string $endpoint, ?int $userId = null): void
    {
        $requestId = $this->generateRequestId();

        $this->logEvent($userId, 'csrf_failure', $ip, [
            'endpoint' => $endpoint,
            'request_id' => $requestId
        ]);

        error_log("CSRF FAILURE: IP=$ip, ENDPOINT=$endpoint, USER=" . ($userId ?? 'none') . ", REQ=$requestId");
    }

    // ════════════════════════════════════════════════════════════
    // REFRESH SESSION
    // ════════════════════════════════════════════════════════════

    public function refreshSession(int $userId, string $sessionToken, string $ip): array
    {
        $requestId = $this->generateRequestId();

        try {
            $user = $this->repository->findUserById($userId);

            if (!$user) {
                $this->logEvent($userId, 'session_refresh_failed', $ip, [
                    'reason' => 'user_not_found',
                    'request_id' => $requestId
                ]);

                return [
                    'success' => false,
                    'error' => 'UNAUTHORIZED',
                    'code' => 401,
                    'message' => 'Usuário não encontrado'
                ];
            }

            $username = $user['username'];

            SessionGate::start();

            // DSHOW-110: só renova sessão com registro ativo, do mesmo titular e vigente (refresh atrasado não reativa nada)
            $tokenAntigo = session_id() !== '' ? session_id() : $sessionToken;
            $situacao = SessaoRegistro::situacao($tokenAntigo, $userId);
            if ($situacao !== SessaoRegistro::OK) {
                if ($situacao !== SessaoRegistro::FALHA) {
                    SessionGate::destroy();
                }
                $this->logEvent($userId, 'session_refresh_sem_registro', $ip, ['situacao' => $situacao, 'request_id' => $requestId]);
                return ['success' => false, 'error' => $situacao === SessaoRegistro::FALHA ? 'SESSION_CHECK_UNAVAILABLE' : 'SESSION_REVOKED',
                        'code' => $situacao === SessaoRegistro::FALHA ? 503 : 401, 'message' => 'Sua sessão foi encerrada. Entre de novo.'];
            }

            // #7: Usar método de rotação do SessionGate
            $newCsrf = SessionGate::rotateCsrfToken();
            $_SESSION['last_activity'] = time();

            $expiresAt = time() + 604800;
            $_SESSION['expire_time'] = $expiresAt;

            // DSHOW-110: regenera e troca o id no MESMO registro (exatamente 1 linha); sem isso a sessão renovada não fica válida
            session_regenerate_id(true);
            $newSessionToken = session_id();
            if (!SessaoRegistro::trocar($tokenAntigo, $newSessionToken, $userId, $newCsrf, $expiresAt)) {
                SessionGate::destroy();
                $this->logEvent($userId, 'session_refresh_troca_falhou', $ip, ['request_id' => $requestId]);
                return ['success' => false, 'error' => 'SESSION_REVOKED', 'code' => 401, 'message' => 'Sua sessão foi encerrada. Entre de novo.'];
            }

            $this->logEvent($userId, 'session_refresh', $ip, [
                'username' => $username,
                'old_token' => substr($sessionToken, 0, 8) . '...',
                'new_token' => substr($newSessionToken, 0, 8) . '...',
                'request_id' => $requestId
            ]);

            error_log("SESSION REFRESH: IP=$ip, USER=$username, ID=$userId, REQ=$requestId");

            return [
                'success' => true,
                'data' => [
                    'message' => 'Sessão renovada com sucesso',
                    'csrf_token' => $newCsrf,
                    'expires_at' => date('Y-m-d H:i:s', $expiresAt)
                ],
                'request_id' => $requestId
            ];

        } catch (\Exception $e) {
            $this->logEvent($userId, 'session_refresh_failed', $ip, [
                'error' => $e->getMessage(),
                'request_id' => $requestId
            ]);

            error_log("SESSION REFRESH ERROR: IP=$ip, ID=$userId, ERR={$e->getMessage()}, REQ=$requestId");

            return [
                'success' => false,
                'error' => 'REFRESH_ERROR',
                'code' => 500,
                'message' => 'Erro ao renovar sessão'
            ];
        }
    }

    // ════════════════════════════════════════════════════════════
    // #21: RETRY COM BACKOFF
    // ════════════════════════════════════════════════════════════

    private function persistSessionWithRetry(string $token, int $userId, string $csrf, int $expiresAt): bool
    {
        $lastException = null;
        
        for ($attempt = 1; $attempt <= self::MAX_RETRY_ATTEMPTS; $attempt++) {
            try {
                $result = $this->repository->refreshSessionActivity($token, $userId, $csrf, $expiresAt);
                
                if ($result) {
                    if ($attempt > 1) {
                        error_log("SESSION PERSIST: Success on attempt $attempt");
                    }
                    return true;
                }
            } catch (\Exception $e) {
                $lastException = $e;
                error_log("SESSION PERSIST: Attempt $attempt failed - " . $e->getMessage());
            }
            
            if ($attempt < self::MAX_RETRY_ATTEMPTS) {
                $delayMs = self::RETRY_BASE_DELAY_MS * pow(self::RETRY_BACKOFF_MULTIPLIER, $attempt - 1);
                usleep($delayMs * 1000);
            }
        }
        
        // Log falha final
        error_log("SESSION PERSIST: All {self::MAX_RETRY_ATTEMPTS} attempts failed");
        
        if ($lastException) {
            throw $lastException;
        }
        
        return false;
    }

    // ════════════════════════════════════════════════════════════
    // MÉTODOS PRIVADOS - AUTHENTICATE
    // ════════════════════════════════════════════════════════════

    private function checkUserStatus(array $user, string $login, string $ip, string $requestId): array
    {
        if ($user['status'] === 'active') {
            return ['success' => true];
        }

        $userId = (int)$user['id'];
        $this->logEvent($userId, 'login_failed', $ip, [
            'username' => $login,
            'reason' => 'account_' . $user['status'],
            'request_id' => $requestId
        ]);

        $statusMessages = [
            'disabled' => 'Conta desativada. Entre em contato com o administrador.',
            'locked' => 'Conta bloqueada temporariamente. Tente novamente mais tarde.',
            'pending' => 'Conta pendente de ativação.'
        ];

        $errorCodes = [
            'disabled' => 'ACCOUNT_DISABLED',
            'locked' => 'USER_LOCKED',
            'pending' => 'ACCOUNT_PENDING'
        ];

        $httpCodes = [
            'disabled' => 403,
            'locked' => 423,
            'pending' => 403
        ];

        return [
            'success' => false,
            'error' => $errorCodes[$user['status']] ?? 'ACCOUNT_INACTIVE',
            'code' => $httpCodes[$user['status']] ?? 403,
            'message' => $statusMessages[$user['status']] ?? 'Conta inativa.'
        ];
    }

    private function loadRolesAndPermissions(int $userId, string $username, string $ip): array
    {
        $hasRoles = $this->repository->hasActiveRoles($userId);

        if (!$hasRoles) {
            error_log("SECURITY: USER_WITHOUT_ROLES_LOGIN IP=$ip, USER=$username, ID=$userId");
            $this->logEvent($userId, 'login_no_roles', $ip, ['username' => $username]);

            return [
                'roles' => ['guest'],
                'permissions' => [],
                'maxLevel' => 0,
                'accessMode' => 'restricted'
            ];
        }

        $userRoles = $this->repository->getUserRoles($userId);
        $permissions = $this->repository->getUserPermissions($userId);

        $roles = [];
        $maxLevel = 0;

        foreach ($userRoles as $r) {
            $roles[] = $r['role_key'];
            if ((int)$r['level'] > $maxLevel) {
                $maxLevel = (int)$r['level'];
            }
        }

        $accessMode = $this->determineAccessMode($maxLevel);

        return [
            'roles' => $roles,
            'permissions' => $permissions,
            'maxLevel' => $maxLevel,
            'accessMode' => $accessMode
        ];
    }

    private function determineAccessMode(int $level): string
    {
        if ($level >= AccessLevels::SUPER_ADMIN) return 'full_access';
        if ($level >= AccessLevels::ADMIN) return 'admin';
        if ($level >= AccessLevels::MODERATOR) return 'manager';
        if ($level >= AccessLevels::ADVANCED) return 'editor';
        if ($level >= AccessLevels::USER) return 'viewer';
        return 'restricted';
    }

    private function determineScopes(int $level): array
    {
        $scopes = ['read'];
        if ($level >= AccessLevels::ADVANCED) $scopes[] = 'write';
        if ($level >= AccessLevels::MODERATOR) $scopes[] = 'manage';
        if ($level >= AccessLevels::ADMIN) $scopes[] = 'admin';
        if ($level >= AccessLevels::SUPER_ADMIN) $scopes[] = 'super';
        return $scopes;
    }

    private function createUserSession(array $user, array $rolesData, string $ip, array $deviceInfo): ?array
    {
        $userId = (int)$user['id'];
        $capabilities = array_map(fn($p) => str_replace('.', ':', $p), $rolesData['permissions']);
        $scopes = $this->determineScopes($rolesData['maxLevel']);

        SessionGate::start();

        // #7: Usar método do SessionGate para CSRF
        $csrfToken = SessionGate::getCsrfToken();
        $now = time();
        $expiresAt = $now + 604800;
        $expiresAtISO = date('Y-m-d\TH:i:s\Z', $expiresAt);
        $lastLoginAt = date('Y-m-d\TH:i:s\Z', $now);

        $userData = [
            'id' => $userId,
            'username' => $user['username'],
            'email' => $user['email'],
            'name' => $user['nome_resumido'] ?: $user['nome'] ?: $user['username'],
            'full_name' => $user['nome_completo'] ?: $user['nome'] ?: $user['username'],
            'avatar_url' => $user['avatar_url'],
            'locale' => $user['locale'] ?? 'pt-BR',
            'funcao' => $user['funcao'],
            'departamento' => $user['departamento'],
            'role' => $rolesData['roles'][0] ?? 'guest',
            'roles' => $rolesData['roles'],
            'level' => $rolesData['maxLevel'],
            'capabilities' => $capabilities,
            'permissions' => $rolesData['permissions'],
            'scopes' => $scopes,
            'access_mode' => $rolesData['accessMode'],
            'last_login_at' => $lastLoginAt,
            'created_at' => $user['created_at']
        ];

        SessionGate::create($userData);

        $sessionToken = session_id();

        $_SESSION['login_time'] = $now;
        $_SESSION['expire_time'] = $expiresAt;
        $_SESSION['last_regen'] = $now;
        $_SESSION['last_activity'] = $now;

        // #21: Persistir com retry — DSHOW-110: sem registro gravado, a sessão do PHP é encerrada e o login falha
        if (!$this->persistSessionSafe($sessionToken, $userId, $csrfToken, $deviceInfo, $ip, $expiresAt)) {
            SessionGate::destroy();
            return null;
        }

        $finalUserData = SessionGate::getUser();
        session_write_close();

        return [
            'user' => $finalUserData,
            'session' => [
                'token' => $sessionToken,
                'expires_at' => $expiresAtISO,
                'csrf_token' => $csrfToken,
                'device_type' => $deviceInfo['device_type'],
                'browser' => $deviceInfo['browser'],
                'os' => $deviceInfo['os'],
                'origin_ip' => $ip
            ]
        ];
    }

    // #21: Wrapper com retry para persistSession
    private function persistSessionSafe(string $token, int $userId, string $csrf, array $device, string $ip, int $expiresAt): bool
    {
        $lastException = null;
        
        for ($attempt = 1; $attempt <= self::MAX_RETRY_ATTEMPTS; $attempt++) {
            try {
                $existing = $this->repository->findSessionByToken($token);

                if ($existing) {
                    $this->repository->updateSession($token, $userId, $csrf, $device, $ip, $expiresAt);
                } else {
                    $this->repository->createSession($token, $userId, $csrf, $device, $ip, $expiresAt);
                }
                
                return true; // Sucesso
                
            } catch (\Exception $e) {
                $lastException = $e;
                error_log("Session DB error (attempt $attempt): " . $e->getMessage());
                
                if ($attempt < self::MAX_RETRY_ATTEMPTS) {
                    $delayMs = self::RETRY_BASE_DELAY_MS * pow(self::RETRY_BACKOFF_MULTIPLIER, $attempt - 1);
                    usleep($delayMs * 1000);
                }
            }
        }
        
        // DSHOW-110: sem registro, NÃO há sessão (antes: "continuing without DB session")
        error_log("Session persist failed after " . self::MAX_RETRY_ATTEMPTS . " attempts - login refused (no DB session)");
        return false;
    }

    // ════════════════════════════════════════════════════════════
    // MÉTODOS UTILITÁRIOS
    // ════════════════════════════════════════════════════════════

    private function logEvent(?int $userId, string $eventType, string $ip, array $context): void
    {
        $this->repository->logAuthEvent($eventType, $userId, $ip, $context);
    }

    private function generateRequestId(): string
    {
        return 'req_' . bin2hex(random_bytes(8));
    }

    public function getRepository(): AuthRepository
    {
        return $this->repository;
    }
}
