<?php
declare(strict_types=1);

// /api/core/ExecutionGate.php
// Validador de contexto de execução - P3.1 UARPS PURO
// @version 2.0.0-ENTERPRISE
// @created 2026-01-20
// @updated 2026-01-21
// P3.1: Migrado SessionGate::requireAdmin() para UARPSGate::enforceTrigger()

class ExecutionGate {
    
    // Contextos de execução
    const CONTEXT_BOOT = 'boot';
    const CONTEXT_RUNTIME = 'runtime';
    const CONTEXT_ADMIN = 'admin';
    const CONTEXT_DIAGNOSTICS = 'diagnostics';
    const CONTEXT_PUBLIC = 'public';
    
    // P3.1: Triggers UARPS para cada contexto
    const TRIGGER_ADMIN = 'trigger:gate:admin';
    const TRIGGER_DIAGNOSTICS = 'trigger:gate:diagnostics';
    
    private static ?string $currentContext = null;
    private static array $executionLog = [];
    
    // Define o contexto de execução atual
    public static function setContext(string $context): void {
        $validContexts = [
            self::CONTEXT_BOOT,
            self::CONTEXT_RUNTIME,
            self::CONTEXT_ADMIN,
            self::CONTEXT_DIAGNOSTICS,
            self::CONTEXT_PUBLIC
        ];
        
        if (!in_array($context, $validContexts)) {
            self::fail('INVALID_CONTEXT', "Contexto inválido: $context");
        }
        
        self::$currentContext = $context;
        self::log('context_set', ['context' => $context]);
    }
    
    // Retorna contexto atual
    public static function getContext(): ?string {
        return self::$currentContext;
    }
    
    // Verifica se está em contexto específico
    public static function isContext(string $context): bool {
        return self::$currentContext === $context;
    }
    
    // Requer contexto específico para continuar
    public static function requireContext(string $context): void {
        if (self::$currentContext !== $context) {
            self::fail('CONTEXT_MISMATCH', "Contexto requerido: $context, atual: " . (self::$currentContext ?? 'none'));
        }
    }
    
    // Bloqueia execução em contexto específico
    public static function blockInContext(string $context, string $reason = ''): void {
        if (self::$currentContext === $context) {
            self::fail('CONTEXT_BLOCKED', "Execução bloqueada no contexto $context" . ($reason ? ": $reason" : ''));
        }
    }
    
    // Valida que script é um entrypoint autorizado
    public static function validateEntrypoint(array $allowedEntrypoints): void {
        $script = $_SERVER['SCRIPT_NAME'] ?? $_SERVER['PHP_SELF'] ?? '';
        $script = basename($script);
        
        if (!in_array($script, $allowedEntrypoints)) {
            self::fail('UNAUTHORIZED_ENTRYPOINT', "Script não autorizado: $script");
        }
        
        self::log('entrypoint_validated', ['script' => $script]);
    }
    
    // Valida método HTTP permitido
    public static function validateMethod(array $allowedMethods): void {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
        
        if (!in_array($method, $allowedMethods)) {
            http_response_code(405);
            header('Allow: ' . implode(', ', $allowedMethods));
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'ok' => false,
                'error' => 'METHOD_NOT_ALLOWED',
                'meta' => [
                    'allowed' => $allowedMethods,
                    'received' => $method
                ]
            ]);
            exit;
        }
    }
    
    // P3.1: Guard para endpoints admin - UARPS PURO
    public static function guardAdmin(): void {
        self::setContext(self::CONTEXT_ADMIN);
        
        require_once __DIR__ . '/SessionGate.php';
        require_once __DIR__ . '/UARPSGate.php';
        
        SessionGate::start();
        SessionGate::requireAuth();
        
        $userId = SessionGate::getUserId();
        
        // P3.1: UARPS enforce substitui SessionGate::requireAdmin()
        UARPSGate::enforceTrigger($userId, self::TRIGGER_ADMIN, 'ExecutionGate::guardAdmin');
        
        self::log('admin_access', [
            'user_id' => $userId,
            'trigger' => self::TRIGGER_ADMIN,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
    }
    
    // Guard para endpoints runtime (autenticados)
    public static function guardRuntime(): void {
        self::setContext(self::CONTEXT_RUNTIME);
        
        require_once __DIR__ . '/SessionGate.php';
        SessionGate::start();
        SessionGate::requireAuth();
    }
    
    // Guard para endpoints públicos (sem auth)
    public static function guardPublic(): void {
        self::setContext(self::CONTEXT_PUBLIC);
    }
    
    // P3.1: Guard para diagnósticos - UARPS PURO
    public static function guardDiagnostics(): void {
        self::setContext(self::CONTEXT_DIAGNOSTICS);
        
        $env = getenv('APP_ENV') ?: 'production';
        
        if ($env === 'production') {
            require_once __DIR__ . '/SessionGate.php';
            require_once __DIR__ . '/UARPSGate.php';
            
            SessionGate::start();
            SessionGate::requireAuth();
            
            $userId = SessionGate::getUserId();
            
            // P3.1: UARPS enforce substitui SessionGate::requireAdmin()
            UARPSGate::enforceTrigger($userId, self::TRIGGER_DIAGNOSTICS, 'ExecutionGate::guardDiagnostics');
        }
        
        self::log('diagnostics_access', [
            'env' => $env,
            'trigger' => self::TRIGGER_DIAGNOSTICS,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
    }
    
    // Registra log de execução
    private static function log(string $action, array $data = []): void {
        self::$executionLog[] = [
            'timestamp' => microtime(true),
            'action' => $action,
            'data' => $data
        ];
    }
    
    // Falha controlada
    private static function fail(string $code, string $message): void {
        error_log("[ExecutionGate] FAIL: $code - $message");
        
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok' => false,
            'error' => $code,
            'meta' => ['message' => $message]
        ]);
        exit;
    }
    
    // Info para diagnóstico
    public static function info(): array {
        return [
            'version' => '2.0.0-ENTERPRISE',
            'context' => self::$currentContext,
            'execution_log' => self::$executionLog,
            'script' => $_SERVER['SCRIPT_NAME'] ?? 'unknown',
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            'triggers' => [
                'admin' => self::TRIGGER_ADMIN,
                'diagnostics' => self::TRIGGER_DIAGNOSTICS
            ]
        ];
    }
    
    // Reset (para testes)
    public static function reset(): void {
        self::$currentContext = null;
        self::$executionLog = [];
    }
    
    // P3.1: Health check
    public static function healthCheck(): array {
        $checks = [
            'initialized' => true,
            'context_valid' => in_array(self::$currentContext, [null, self::CONTEXT_BOOT, self::CONTEXT_RUNTIME, self::CONTEXT_ADMIN, self::CONTEXT_DIAGNOSTICS, self::CONTEXT_PUBLIC]),
            'uarps_triggers_defined' => defined('self::TRIGGER_ADMIN') && defined('self::TRIGGER_DIAGNOSTICS')
        ];
        
        return [
            'healthy' => !in_array(false, $checks, true),
            'checks' => $checks,
            'version' => '2.0.0-ENTERPRISE'
        ];
    }
}
