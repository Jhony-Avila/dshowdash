<?php
/**
 * AuthHelpers - Funções auxiliares de autenticação
 * @version 3.1.0-ENTERPRISE
 * P3.3: Funções requireAdmin/requireSuperAdmin DEPRECADAS
 * P3.3: Usar UARPSGate::enforceTrigger() em novos endpoints
 * P1.2: Corrigido requireCsrf() para usar $_SESSION['csrf'] (consistente com login.php)
 */

declare(strict_types=1);

// P3.3: Importar UARPSGate para referência em deprecation notices
require_once __DIR__ . '/../core/UARPSGate.php';
require_once __DIR__ . '/../core/SessionGate.php';

// FIX: Removido use Core\UARPSGate - classe é global
// P1.1: Migrado para SessionGate::start() para gerenciamento centralizado de sessões

/**
 * Verifica autenticação básica (sessão válida)
 * P3.3: Esta função permanece válida - apenas verifica sessão
 * 
 * @param int $minLevel DEPRECATED - Não usar, será ignorado em futuras versões
 * @return array Dados do usuário autenticado
 */
function requireAuth(int $minLevel = 0): array {
    SessionGate::start();

    // Compatibilidade: SessionGate armazena user_id diretamente, não em $_SESSION['user']
    $userId = $_SESSION['user_id'] ?? ($_SESSION['user']['id'] ?? null);

    if (empty($userId)) {
        http_response_code(401);
        echo json_encode([
            'ok' => false,
            'error' => 'AUTH_REQUIRED',
            'meta' => ['message' => 'Não autenticado']
        ]);
        exit;
    }

    // Construir array de usuário compatível com formato esperado
    $user = [
        'id' => $userId,
        'user_id' => $userId,
        'level' => $_SESSION['level'] ?? ($_SESSION['user']['level'] ?? 0),
        'roles' => $_SESSION['roles'] ?? ($_SESSION['user']['roles'] ?? []),
        'email' => $_SESSION['email'] ?? ($_SESSION['user']['email'] ?? ''),
        'name' => $_SESSION['name'] ?? ($_SESSION['user']['name'] ?? ''),
    ];
    
    // P3.3: DEPRECATION WARNING para $minLevel
    if ($minLevel > 0) {
        $caller = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 2)[1] ?? [];
        $callerFile = basename($caller['file'] ?? 'unknown');
        $callerLine = $caller['line'] ?? 0;
        
        error_log("DEPRECATION WARNING [P3.3]: requireAuth(\$minLevel=$minLevel) is deprecated. " .
                  "Use UARPSGate::enforceTrigger() instead. Called from: $callerFile:$callerLine");
        
        $userLevel = (int)($user['level'] ?? 0);
        
        if ($userLevel < $minLevel) {
            http_response_code(403);
            echo json_encode([
                'ok' => false,
                'error' => 'INSUFFICIENT_LEVEL',
                'meta' => [
                    'message' => 'Acesso negado - nível insuficiente',
                    'required_level' => $minLevel,
                    'user_level' => $userLevel,
                    '_deprecation_notice' => 'This endpoint uses deprecated minLevel check. Migrate to UARPS.'
                ]
            ]);
            exit;
        }
    }
    
    return $user;
}

/**
 * Retorna usuário atual ou null (sem bloquear)
 * P3.3: Esta função permanece válida
 * 
 * @return array|null Dados do usuário ou null
 */
function getCurrentUser(): ?array {
    SessionGate::start();

    // Compatibilidade: SessionGate armazena user_id diretamente
    $userId = $_SESSION['user_id'] ?? ($_SESSION['user']['id'] ?? null);
    if (empty($userId)) {
        return null;
    }

    return [
        'id' => $userId,
        'user_id' => $userId,
        'level' => $_SESSION['level'] ?? ($_SESSION['user']['level'] ?? 0),
        'roles' => $_SESSION['roles'] ?? ($_SESSION['user']['roles'] ?? []),
        'email' => $_SESSION['email'] ?? ($_SESSION['user']['email'] ?? ''),
        'name' => $_SESSION['name'] ?? ($_SESSION['user']['name'] ?? ''),
    ];
}

/**
 * Verifica se usuário está autenticado (sem bloquear)
 * P3.3: Esta função permanece válida
 *
 * @return bool
 */
function isAuthenticated(): bool {
    SessionGate::start();
    $userId = $_SESSION['user_id'] ?? ($_SESSION['user']['id'] ?? null);
    return !empty($userId);
}

/**
 * Retorna ID do usuário atual ou 0
 * P3.3: Esta função permanece válida
 * 
 * @return int
 */
function getCurrentUserId(): int {
    $user = getCurrentUser();
    return (int)($user['id'] ?? 0);
}

/**
 * Retorna nível do usuário atual
 * P3.3: DEPRECATED - Nível não deve ser usado para decisões de acesso
 * 
 * @return int
 * @deprecated Use UARPSGate::checkTrigger() para verificar permissões
 */
function getCurrentUserLevel(): int {
    $caller = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 2)[1] ?? [];
    $callerFile = basename($caller['file'] ?? 'unknown');
    $callerLine = $caller['line'] ?? 0;
    
    error_log("DEPRECATION WARNING [P3.3]: getCurrentUserLevel() is deprecated. " .
              "Use UARPSGate::checkTrigger() for permission checks. Called from: $callerFile:$callerLine");
    
    $user = getCurrentUser();
    return (int)($user['level'] ?? 0);
}

/**
 * Verifica se usuário é admin pelo nível
 * P3.3: DEPRECATED - Usar UARPSGate::checkTrigger()
 * 
 * @return bool
 * @deprecated Use UARPSGate::checkTrigger('gate:admin:*') para verificar permissões admin
 */
function isAdmin(): bool {
    $caller = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 2)[1] ?? [];
    $callerFile = basename($caller['file'] ?? 'unknown');
    $callerLine = $caller['line'] ?? 0;
    
    error_log("DEPRECATION WARNING [P3.3]: isAdmin() is deprecated. " .
              "Use UARPSGate::checkTrigger() instead. Called from: $callerFile:$callerLine");
    
    $user = getCurrentUser();
    $level = (int)($user['level'] ?? 0);
    return $level >= 80;
}

/**
 * Verifica se usuário é super admin pelo nível
 * P3.3: DEPRECATED - Usar UARPSGate::checkTrigger()
 * 
 * @return bool
 * @deprecated Use UARPSGate::checkTrigger('gate:superadmin:*') para verificar permissões
 */
function isSuperAdmin(): bool {
    $caller = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 2)[1] ?? [];
    $callerFile = basename($caller['file'] ?? 'unknown');
    $callerLine = $caller['line'] ?? 0;
    
    error_log("DEPRECATION WARNING [P3.3]: isSuperAdmin() is deprecated. " .
              "Use UARPSGate::checkTrigger() instead. Called from: $callerFile:$callerLine");
    
    $user = getCurrentUser();
    $level = (int)($user['level'] ?? 0);
    return $level >= 100;
}

/**
 * Exige que usuário seja admin
 * P3.3: DEPRECATED - Usar UARPSGate::enforceTrigger()
 * 
 * @return array Dados do usuário
 * @deprecated Use UARPSGate::enforceTrigger('gate:admin:*', 'api') em novos endpoints
 */
function requireAdmin(): array {
    $caller = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 2)[1] ?? [];
    $callerFile = basename($caller['file'] ?? 'unknown');
    $callerLine = $caller['line'] ?? 0;
    
    error_log("DEPRECATION WARNING [P3.3]: requireAdmin() is deprecated. " .
              "Use UARPSGate::enforceTrigger() instead. Called from: $callerFile:$callerLine");
    
    $user = requireAuth();
    $userLevel = (int)($user['level'] ?? 0);
    $requiredLevel = 80;
    
    if ($userLevel < $requiredLevel) {
        http_response_code(403);
        echo json_encode([
            'ok' => false,
            'error' => 'ADMIN_REQUIRED',
            'meta' => [
                'message' => 'Acesso negado - requer privilégios de administrador',
                'required_level' => $requiredLevel,
                'user_level' => $userLevel,
                '_deprecation_notice' => 'This endpoint uses deprecated requireAdmin(). Migrate to UARPSGate::enforceTrigger().'
            ]
        ]);
        exit;
    }
    
    return $user;
}

/**
 * Exige que usuário seja super admin
 * P3.3: DEPRECATED - Usar UARPSGate::enforceTrigger()
 * 
 * @return array Dados do usuário
 * @deprecated Use UARPSGate::enforceTrigger('gate:superadmin:*', 'api') em novos endpoints
 */
function requireSuperAdmin(): array {
    $caller = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 2)[1] ?? [];
    $callerFile = basename($caller['file'] ?? 'unknown');
    $callerLine = $caller['line'] ?? 0;
    
    error_log("DEPRECATION WARNING [P3.3]: requireSuperAdmin() is deprecated. " .
              "Use UARPSGate::enforceTrigger() instead. Called from: $callerFile:$callerLine");
    
    $user = requireAuth();
    $userLevel = (int)($user['level'] ?? 0);
    $requiredLevel = 100;
    
    if ($userLevel < $requiredLevel) {
        http_response_code(403);
        echo json_encode([
            'ok' => false,
            'error' => 'SUPERADMIN_REQUIRED',
            'meta' => [
                'message' => 'Acesso negado - requer privilégios de super administrador',
                'required_level' => $requiredLevel,
                'user_level' => $userLevel,
                '_deprecation_notice' => 'This endpoint uses deprecated requireSuperAdmin(). Migrate to UARPSGate::enforceTrigger().'
            ]
        ]);
        exit;
    }
    
    return $user;
}

/**
 * Retorna IP do cliente
 * P3.3: Esta função permanece válida
 * 
 * @return string
 */
function getClientIp(): string {
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

/**
 * Retorna User Agent do cliente
 * P3.3: Esta função permanece válida
 * 
 * @return string
 */
function getUserAgent(): string {
    return $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
}

/**
 * Gera token CSRF
 * P1.2: Usa $_SESSION['csrf'] (consistente com login.php)
 * 
 * @return string
 */
function generateCsrfToken(): string {
    SessionGate::start();
    
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    
    return $_SESSION['csrf'];
}

/**
 * Valida token CSRF
 * P1.2: Usa $_SESSION['csrf'] (consistente com login.php)
 * 
 * @param string|null $token
 * @return bool
 */
function validateCsrfToken(?string $token): bool {
    SessionGate::start();
    
    $sessionToken = $_SESSION['csrf'] ?? null;
    
    if (empty($sessionToken) || empty($token)) {
        return false;
    }
    
    return hash_equals($sessionToken, $token);
}

/**
 * Exige token CSRF válido
 * P1.2: Usa $_SESSION['csrf'] (consistente com login.php)
 * P1.2: Usa ApiResponse se disponível, senão JSON direto
 * 
 * @return void
 */
function requireCsrf(): void {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? null;
    
    if (!validateCsrfToken($token)) {
        http_response_code(403);
        
        // P1.2: Tentar usar ApiResponse se disponível
        if (class_exists('ApiResponse')) {
            ApiResponse::error(ApiResponse::ERR_INVALID_CSRF, 403, ['message' => 'Token CSRF inválido ou ausente']);
        } else {
            echo json_encode([
                'ok' => false,
                'error' => 'CSRF_INVALID',
                'meta' => ['message' => 'Token CSRF inválido ou ausente']
            ]);
        }
        exit;
    }
}

/**
 * Exige CSRF apenas para métodos de escrita (POST, PUT, PATCH, DELETE)
 * P1.2: Helper para validação condicional
 *
 * @return void
 */
function requireCsrfForWrite(): void {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (in_array($method, $writeMethods, true)) {
        requireCsrf();
    }
}

/**
 * Exige que o método HTTP da requisição esteja na lista permitida.
 * Responde 405 (Method Not Allowed) no padrão ApiResponse e encerra se não estiver.
 * OPTIONS (preflight CORS) deve constar na lista de quem o usa; o tratamento real
 * do preflight fica a cargo de CorsPolicy antes deste ponto.
 * P3.4 (2026-07-08): helper faltante — api/sessions/index.php chamava requireMethod() sem defini-la.
 *
 * @param array $allowed Métodos aceitos, ex.: ['GET','POST','DELETE','OPTIONS']
 * @return void
 */
function requireMethod(array $allowed): void {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $allowedUpper = array_map('strtoupper', $allowed);

    if (in_array($method, $allowedUpper, true)) {
        return;
    }

    header('Allow: ' . implode(', ', $allowedUpper));
    http_response_code(405);

    // Usa ApiResponse se disponível, senão JSON direto (mesmo padrão de requireCsrf)
    if (class_exists('ApiResponse')) {
        ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, [
            'message' => 'Método não permitido: ' . $method,
            'allowed' => $allowedUpper
        ]);
    } else {
        header('Content-Type: application/json');
        echo json_encode([
            'ok' => false,
            'error' => 'METHOD_NOT_ALLOWED',
            'meta' => ['message' => 'Método não permitido', 'allowed' => $allowedUpper]
        ]);
    }
    exit;
}

/**
 * Classe wrapper para compatibilidade com chamadas estáticas
 * Permite usar AuthHelpers::requireAuth() etc.
 * @since 3.1.1
 */
class AuthHelpers {
    public static function requireAuth(int $minLevel = 0): array {
        return requireAuth($minLevel);
    }

    public static function getCurrentUser(): ?array {
        return getCurrentUser();
    }

    public static function isAuthenticated(): bool {
        return isAuthenticated();
    }

    public static function getCurrentUserId(): int {
        return getCurrentUserId();
    }

    public static function getCurrentUserLevel(): int {
        return getCurrentUserLevel();
    }

    public static function isAdmin(): bool {
        return isAdmin();
    }

    public static function isSuperAdmin(): bool {
        return isSuperAdmin();
    }

    public static function requireAdmin(): array {
        return requireAdmin();
    }

    public static function requireSuperAdmin(): array {
        return requireSuperAdmin();
    }

    public static function getClientIp(): string {
        return getClientIp();
    }

    public static function getUserAgent(): string {
        return getUserAgent();
    }

    public static function generateCsrfToken(): string {
        return generateCsrfToken();
    }

    public static function validateCsrfToken(?string $token): bool {
        return validateCsrfToken($token);
    }

    public static function requireCsrf(): void {
        requireCsrf();
    }

    public static function requireCsrfForWrite(): void {
        requireCsrfForWrite();
    }
}
