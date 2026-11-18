<?php
declare(strict_types=1);

// /api/core/UARPSGate.php
// UARPS Gate - Validador central de permissões UARPS
// @version 1.1.0-ENTERPRISE
// @created 2026-01-21
// P1.1: Migrado contrato 'success' para 'ok' (padrão enterprise)
// P0.2: Gate central para validação UARPS
// P1.1: Shadow mode - valida sem bloquear, loga divergências

require_once __DIR__ . '/../../config/uarps.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/AccessLevels.php';
require_once __DIR__ . '/UARPSPadrao.php';   // UARPS-INHERIT

class UARPSGate {
    
    private static ?PDO $pdo = null;
    private static array $cache = [];
    private static int $cacheTTL = 300;
    
    // Inicializa conexão
    private static function init(): void {
        if (self::$pdo === null) {
            self::$pdo = getConnection('DSHOWDASH');
        }
    }
    
    // ══════════════════════════════════════════════════════════════
    // MÉTODOS PRINCIPAIS DE VERIFICAÇÃO
    // ══════════════════════════════════════════════════════════════
    
    // Verifica permissão de trigger para usuário
    public static function checkTrigger(int $userId, string $triggerId): array {
        $cacheKey = "trigger:{$userId}:{$triggerId}";
        if (isset(self::$cache[$cacheKey]) && self::$cache[$cacheKey]['expires'] > time()) {
            return self::$cache[$cacheKey]['result'];
        }
        
        try {
            self::init();   // UARPS-INHERIT: dentro do try (falha de conexão = negação controlada, não 500)
            $stmt = self::$pdo->prepare("
                SELECT state, expires_at 
                FROM app_user_trigger_permissions
                WHERE user_id = ? AND trigger_id = ? AND deleted_at IS NULL
                  AND (expires_at IS NULL OR expires_at > NOW())
                LIMIT 1
            ");
            $stmt->execute([$userId, $triggerId]);
            $perm = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $state = $perm['state'] ?? 'inherit';
            $padrao = null;
            if ($state === 'allow') {
                $allowed = true;
            } elseif ($state === 'deny') {
                $allowed = false;
            } else {
                // UARPS-INHERIT: inherit/sem linha => padrão do perfil
                $padrao = self::resolverPadrao($userId, $triggerId);
                $allowed = $padrao['modo'] === 'aplicar' ? $padrao['allowed'] : true;
                if (!$padrao['allowed']) {
                    self::registrarPadraoNegaria($userId, $triggerId, $padrao);
                }
            }
            
            $result = [
                'allowed' => $allowed,
                'state' => $state,
                'source' => $padrao === null ? 'uarps' : 'uarps-padrao',
                'trigger_id' => $triggerId,
                'user_id' => $userId,
                'expires_at' => $perm['expires_at'] ?? null
            ];
            if ($padrao !== null) {
                $result['padrao'] = $padrao;
            }
            
            self::$cache[$cacheKey] = ['result' => $result, 'expires' => time() + self::$cacheTTL];
            return $result;
            
        } catch (Throwable $e) {
            // UARPS-INHERIT: erro de banco => NEGA (fail-closed) e registra
            $allowed = false;   // fixo: ignora o fallback_on_error=true legado do config compartilhado
            error_log(sprintf('[UARPS] ERRO-BANCO %s user=%d trigger=%s rota=%s erro=%s',
                $allowed ? 'LIBERADO(fallback)' : 'NEGADO', $userId, $triggerId,
                $_SERVER['REQUEST_URI'] ?? 'cli', $e->getMessage()));
            return ['allowed' => $allowed, 'state' => 'error', 'source' => 'fallback', 'trigger_id' => $triggerId, 'user_id' => $userId, 'error' => 'Erro interno'];
        }
    }
    
    // ══════════════════════════════════════════════════════════════
    // UARPS-INHERIT (17/11/2026): padrão do perfil
    // ══════════════════════════════════════════════════════════════
    
    private static array $nivelCache = [];
    private static array $registrados = [];
    
    // Nível efetivo pelo banco (MAX(app_roles.level) dos vínculos ativos de usuário ativo).
    // 0 = sem vínculo/anônimo. Lança exceção em erro de banco (quem chama nega).
    public static function nivelUsuario(int $userId): int {
        if ($userId <= 0) {
            return 0;
        }
        if (array_key_exists($userId, self::$nivelCache)) {
            return self::$nivelCache[$userId];
        }
        self::init();
        $st = self::$pdo->prepare("
            SELECT MAX(r.level)
              FROM app_user_roles ur
              JOIN app_roles r ON r.id = ur.role_id AND r.deleted_at IS NULL
              JOIN app_users u ON u.id = ur.user_id AND u.deleted_at IS NULL AND u.status = 'active'
             WHERE ur.user_id = ? AND ur.deleted_at IS NULL
               AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        ");
        $st->execute([$userId]);
        $v = $st->fetchColumn();
        return self::$nivelCache[$userId] = ($v === null || $v === false) ? 0 : (int) $v;
    }
    
    // Decide o inherit pelo padrão. Erro ao ler o nível => nega (em qualquer modo, registra).
    public static function resolverPadrao(int $userId, string $triggerId): array {
        [$min, $regra] = UARPSPadrao::nivelMinimo($triggerId);
        $modo = UARPSPadrao::modo($triggerId);
        try {
            $nivel = self::nivelUsuario($userId);
        } catch (Throwable $e) {
            error_log(sprintf('[UARPS] ERRO-BANCO nivel user=%d trigger=%s erro=%s', $userId, $triggerId, $e->getMessage()));
            return ['allowed' => false, 'nivel' => null, 'minimo' => $min, 'regra' => $regra, 'modo' => 'aplicar'];
        }
        $allowed = $nivel >= AccessLevels::SUPER_ADMIN || $nivel >= $min;
        return ['allowed' => $allowed, 'nivel' => $nivel, 'minimo' => $min, 'regra' => $regra, 'modo' => $modo];
    }
    
    // Registra (1x por request por user+trigger) quando o padrão nega: error_log sempre;
    // app_uarps_divergence_log com legacy=allow (inherit antigo) e uarps=deny (padrão).
    private static function registrarPadraoNegaria(int $userId, string $triggerId, array $padrao): void {
        $k = $userId . '|' . $triggerId;
        if (isset(self::$registrados[$k])) {
            return;
        }
        self::$registrados[$k] = true;
        $efeito = $padrao['modo'] === 'aplicar' ? 'NEGADO' : 'SOMBRA-NEGARIA';
        error_log(sprintf('[UARPS] %s inherit user=%d nivel=%s minimo=%d regra=%s trigger=%s rota=%s',
            $efeito, $userId, $padrao['nivel'] === null ? 'erro-banco' : (string) $padrao['nivel'],
            $padrao['minimo'], $padrao['regra'], $triggerId, $_SERVER['REQUEST_URI'] ?? 'cli'));
        try {
            self::init();
            $st = self::$pdo->prepare("
                INSERT INTO app_uarps_divergence_log
                (user_id, trigger_id, endpoint, legacy_result, uarps_result, user_level, required_level, context, ip_address)
                VALUES (?, ?, ?, 'allow', 'deny', ?, ?, ?, ?)
            ");
            $st->execute([
                $userId, substr($triggerId, 0, 100), substr((string) ($_SERVER['REQUEST_URI'] ?? 'cli'), 0, 255),
                (int) ($padrao['nivel'] ?? -1), $padrao['minimo'],
                json_encode(['fase' => 'UARPS-INHERIT', 'modo' => $padrao['modo'], 'regra' => $padrao['regra']]),
                $_SERVER['REMOTE_ADDR'] ?? null,
            ]);
        } catch (Throwable $e) {
            error_log('[UARPS] falha ao registrar divergência: ' . $e->getMessage());
        }
    }
    
    // Verifica permissão de region para usuário
    public static function checkRegion(int $userId, string $regionId): array {
        $cacheKey = "region:{$userId}:{$regionId}";
        if (isset(self::$cache[$cacheKey]) && self::$cache[$cacheKey]['expires'] > time()) {
            return self::$cache[$cacheKey]['result'];
        }
        
        try {
            self::init();   // UARPS-INHERIT
            $stmt = self::$pdo->prepare("
                SELECT state, expires_at 
                FROM app_user_region_permissions
                WHERE user_id = ? AND region_id = ? AND deleted_at IS NULL
                  AND (expires_at IS NULL OR expires_at > NOW())
                LIMIT 1
            ");
            $stmt->execute([$userId, $regionId]);
            $perm = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $state = $perm['state'] ?? 'inherit';
            $allowed = ($state === 'allow' || $state === 'inherit');
            
            $result = [
                'allowed' => $allowed,
                'state' => $state,
                'source' => 'uarps',
                'region_id' => $regionId,
                'user_id' => $userId,
                'expires_at' => $perm['expires_at'] ?? null
            ];
            
            self::$cache[$cacheKey] = ['result' => $result, 'expires' => time() + self::$cacheTTL];
            return $result;
            
        } catch (Throwable $e) {
            // UARPS-INHERIT: erro de banco => NEGA e registra (inherit de região segue liberando: fora do escopo)
            $allowed = false;   // fixo: ignora o fallback_on_error=true legado do config compartilhado
            error_log(sprintf('[UARPS] ERRO-BANCO %s user=%d region=%s erro=%s',
                $allowed ? 'LIBERADO(fallback)' : 'NEGADO', $userId, $regionId, $e->getMessage()));
            return ['allowed' => $allowed, 'state' => 'error', 'source' => 'fallback', 'error' => 'Erro interno'];
        }
    }
    
    // ══════════════════════════════════════════════════════════════
    // MÉTODOS DE ENFORCEMENT (P1/P2)
    // ══════════════════════════════════════════════════════════════
    
    // Verifica e bloqueia se não permitido (usado em enforced mode)
    public static function enforceTrigger(int $userId, string $triggerId, string $endpoint = ''): bool {
        $result = self::checkTrigger($userId, $triggerId);
        
        if (!$result['allowed'] && UARPSConfig::shouldEnforce()) {
            // UARPS-INHERIT: toda negação registrada
            error_log(sprintf('[UARPS] NEGADO enforce user=%d trigger=%s state=%s rota=%s metodo=%s ip=%s',
                $userId, $triggerId, (string) ($result['state'] ?? '-'), $endpoint ?: ($_SERVER['REQUEST_URI'] ?? '-'),
                $_SERVER['REQUEST_METHOD'] ?? '-', $_SERVER['REMOTE_ADDR'] ?? '-'));
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode([
                'ok' => false,
                'error' => 'UARPS_DENIED',
                'message' => 'Permission denied by UARPS',
                'trigger_id' => $triggerId
            ]);
            exit;
        }
        
        return $result['allowed'];
    }
    
    /**
     * UARPS-INHERIT v2 (18/11, decisão do Jhony 00:55): MODO SOMBRA para endpoints que consultavam o UARPS e ignoravam o
     * resultado (admin/panels GET, admin/navigation GET, admin/health-dashboard). Decide como o enforceTrigger, mas NÃO bloqueia:
     * quando negaria, registra "[UARPS] SOMBRA-NEGARIA enforce" (+ app_uarps_divergence_log via padrão). Virar para
     * enforceTrigger = portão próprio, depois de ler o log por alguns dias.
     */
    public static function sombraTrigger(int $userId, string $triggerId, string $endpoint = ''): bool {
        $result = self::checkTrigger($userId, $triggerId);
        if (!$result['allowed']) {
            error_log(sprintf('[UARPS] SOMBRA-NEGARIA enforce user=%d trigger=%s state=%s rota=%s metodo=%s ip=%s',
                $userId, $triggerId, (string) ($result['state'] ?? '-'), $endpoint ?: ($_SERVER['REQUEST_URI'] ?? '-'),
                $_SERVER['REQUEST_METHOD'] ?? '-', $_SERVER['REMOTE_ADDR'] ?? '-'));
        }
        return true;   // sombra: nunca bloqueia
    }

    // Verifica e bloqueia region se não permitido
    public static function enforceRegion(int $userId, string $regionId, string $endpoint = ''): bool {
        $result = self::checkRegion($userId, $regionId);
        
        if (!$result['allowed'] && UARPSConfig::shouldEnforce()) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode([
                'ok' => false,
                'error' => 'UARPS_DENIED',
                'message' => 'Region access denied by UARPS',
                'region_id' => $regionId
            ]);
            exit;
        }
        
        return $result['allowed'];
    }
    
    // ══════════════════════════════════════════════════════════════
    // SHADOW MODE - COMPARAÇÃO E LOG DE DIVERGÊNCIAS
    // ══════════════════════════════════════════════════════════════
    
    // Compara resultado legacy vs UARPS e loga divergência
    public static function compareAndLog(
        int $userId, 
        int $userLevel,
        int $requiredLevel,
        bool $legacyAllowed,
        ?string $triggerId = null,
        ?string $regionId = null,
        string $endpoint = ''
    ): array {
        
        if (!UARPSConfig::shouldLogDivergence()) {
            return ['divergence' => false, 'logged' => false];
        }
        
        $uarpsAllowed = true;
        if ($triggerId) {
            $uarpsResult = self::checkTrigger($userId, $triggerId);
            $uarpsAllowed = $uarpsResult['allowed'];
        } elseif ($regionId) {
            $uarpsResult = self::checkRegion($userId, $regionId);
            $uarpsAllowed = $uarpsResult['allowed'];
        }
        
        if ($legacyAllowed === $uarpsAllowed) {
            return ['divergence' => false, 'legacy' => $legacyAllowed, 'uarps' => $uarpsAllowed];
        }
        
        self::logDivergence(
            $userId,
            $triggerId,
            $regionId,
            $endpoint,
            $legacyAllowed ? 'allow' : 'deny',
            $uarpsAllowed ? 'allow' : 'deny',
            $userLevel,
            $requiredLevel
        );
        
        return [
            'divergence' => true,
            'legacy' => $legacyAllowed,
            'uarps' => $uarpsAllowed,
            'logged' => true
        ];
    }
    
    // Loga divergência no banco
    private static function logDivergence(
        int $userId,
        ?string $triggerId,
        ?string $regionId,
        string $endpoint,
        string $legacyResult,
        string $uarpsResult,
        int $userLevel,
        ?int $requiredLevel
    ): void {
        self::init();
        
        try {
            $stmt = self::$pdo->prepare("
                INSERT INTO app_uarps_divergence_log 
                (user_id, trigger_id, region_id, endpoint, legacy_result, uarps_result, user_level, required_level, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            
            $stmt->execute([
                $userId,
                $triggerId,
                $regionId,
                $endpoint ?: $_SERVER['REQUEST_URI'] ?? 'unknown',
                $legacyResult,
                $uarpsResult,
                $userLevel,
                $requiredLevel,
                $ip
            ]);
            
        } catch (Exception $e) {
            error_log("UARPSGate::logDivergence error: " . $e->getMessage());
        }
    }
    
    // ══════════════════════════════════════════════════════════════
    // MÉTODOS AUXILIARES
    // ══════════════════════════════════════════════════════════════
    
    // Limpa cache
    public static function clearCache(): void {
        self::$cache = [];
    }
    
    // Obtém todas as permissões de um usuário
    public static function getUserPermissions(int $userId): array {
        self::init();
        
        try {
            $stmtTriggers = self::$pdo->prepare("
                SELECT trigger_id, state, expires_at 
                FROM app_user_trigger_permissions
                WHERE user_id = ? AND deleted_at IS NULL 
                  AND (expires_at IS NULL OR expires_at > NOW())
            ");
            $stmtTriggers->execute([$userId]);
            $triggers = $stmtTriggers->fetchAll(PDO::FETCH_ASSOC);
            
            $stmtRegions = self::$pdo->prepare("
                SELECT region_id, state, expires_at 
                FROM app_user_region_permissions
                WHERE user_id = ? AND deleted_at IS NULL
                  AND (expires_at IS NULL OR expires_at > NOW())
            ");
            $stmtRegions->execute([$userId]);
            $regions = $stmtRegions->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'user_id' => $userId,
                'triggers' => $triggers,
                'regions' => $regions,
                'counts' => [
                    'triggers' => count($triggers),
                    'regions' => count($regions)
                ]
            ];
            
        } catch (Exception $e) {
            error_log("UARPSGate::getUserPermissions error: " . $e->getMessage());
            return ['user_id' => $userId, 'triggers' => [], 'regions' => [], 'error' => 'Erro interno'];
        }
    }
    
    // Health check
    public static function healthCheck(): array {
        self::init();
        
        $checks = [
            'config_loaded' => class_exists('UARPSConfig'),
            'mode' => UARPSConfig::getMode(),
            'is_active' => UARPSConfig::isActive(),
            'database_connected' => self::$pdo !== null,
            'cache_size' => count(self::$cache)
        ];
        
        try {
            $stmt = self::$pdo->query("SELECT 1");
            $checks['database_responsive'] = true;
        } catch (Exception $e) {
            $checks['database_responsive'] = false;
            $checks['database_error'] = $e->getMessage();
        }
        
        $status = ($checks['config_loaded'] && $checks['database_connected'] && $checks['database_responsive']) 
            ? 'HEALTHY' : 'UNHEALTHY';
        
        return [
            'status' => $status,
            'checks' => $checks,
            'version' => '1.1.0-ENTERPRISE',
            'timestamp' => date('c')
        ];
    }
    
    // Info para diagnóstico
    public static function info(): array {
        return [
            'version' => '1.1.0-ENTERPRISE',
            'config' => UARPSConfig::info(),
            'health' => self::healthCheck(),
            'cache_size' => count(self::$cache)
        ];
    }
}
