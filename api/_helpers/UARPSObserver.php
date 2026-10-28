<?php
declare(strict_types=1);

// /api/_helpers/UARPSObserver.php
// UARPS Auto-Observer - Registra observações automáticas de permissão
// @version 1.0.0-ENTERPRISE
// @created 2026-01-21
// @phase P1 (Shadow Mode)
// @lifecycle TEMPORÁRIO - Será REMOVIDO na fase P3
//
// PROPÓSITO:
// - Registra-se como shutdown function
// - Ao final de cada requisição, verifica se houve auth check
// - Compara com UARPS e loga divergências automaticamente
// - ZERO modificação nos endpoints existentes

require_once __DIR__ . '/../core/UARPSShadow.php';

class UARPSObserver {
    
    private static bool $registered = false;
    private static bool $authChecked = false;
    private static ?array $lastAuthData = null;
    
    // Registra o observer (chamar uma vez no bootstrap)
    public static function register(): void {
        if (self::$registered) {
            return;
        }
        
        self::$registered = true;
        
        // Registra shutdown function para observar no final da requisição
        register_shutdown_function([self::class, 'onShutdown']);
    }
    
    // Marca que houve verificação de auth
    public static function markAuthCheck(
        int $userId,
        int $userLevel,
        int $requiredLevel,
        bool $allowed,
        string $checkType = 'auth'
    ): void {
        self::$authChecked = true;
        self::$lastAuthData = [
            'user_id' => $userId,
            'user_level' => $userLevel,
            'required_level' => $requiredLevel,
            'allowed' => $allowed,
            'check_type' => $checkType,
            'endpoint' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'GET'
        ];
        
        // Observa imediatamente se shadow mode estiver ativo
        if (UARPSShadow::isEnabled() && $allowed) {
            self::observeNow();
        }
    }
    
    // Observa a requisição atual
    private static function observeNow(): void {
        if (!self::$lastAuthData) {
            return;
        }
        
        $data = self::$lastAuthData;
        
        // Infere trigger/region baseado no endpoint
        $endpoint = $data['endpoint'];
        $mapping = self::getEndpointMapping($endpoint);
        
        if ($mapping['trigger_id'] || $mapping['region_id']) {
            UARPSShadow::observe(
                $data['user_id'],
                $data['user_level'],
                $data['required_level'],
                $data['allowed'],
                $mapping['trigger_id'],
                $mapping['region_id'],
                $endpoint
            );
        }
    }
    
    // Mapeamento de endpoints para triggers/regions
    private static function getEndpointMapping(string $endpoint): array {
        // Remove query string
        $path = parse_url($endpoint, PHP_URL_PATH) ?? $endpoint;
        
        // Mapeamentos conhecidos
        $mappings = [
            // Permissions
            '/api/permissions/uarps.php' => ['trigger_id' => null, 'region_id' => 'region:panel:permissions-admin'],
            '/api/permissions/index.php' => ['trigger_id' => null, 'region_id' => 'region:panel:permissions-admin'],
            '/api/permissions/' => ['trigger_id' => null, 'region_id' => 'region:panel:permissions-admin'],
            
            // Users
            '/api/users/' => ['trigger_id' => null, 'region_id' => 'region:panel:user-management'],
            
            // Sessions
            '/api/sessions/' => ['trigger_id' => null, 'region_id' => 'region:panel:session-admin'],
            
            // Settings
            '/api/settings/' => ['trigger_id' => null, 'region_id' => 'region:panel:user-preferences'],
            
            // Feature Flags
            '/api/feature-flags/' => ['trigger_id' => null, 'region_id' => 'region:panel:feature-flags-admin'],
            
            // Orchestrator
            '/api/admin/orchestrator/' => ['trigger_id' => null, 'region_id' => 'region:panel:orchestrator'],
            
            // Health
            '/api/health/' => ['trigger_id' => null, 'region_id' => 'region:panel:health-dashboard'],
            
            // Audit
            '/api/audit/' => ['trigger_id' => null, 'region_id' => 'region:panel:audit-trail'],
            
            // UI Components
            '/api/ui/header/' => ['trigger_id' => null, 'region_id' => 'region:app:header'],
            '/api/ui/sidebar/' => ['trigger_id' => null, 'region_id' => 'region:app:sidebar'],
            '/api/ui/navrail/' => ['trigger_id' => null, 'region_id' => 'region:app:sidebar'],
            '/api/ui/footer/' => ['trigger_id' => null, 'region_id' => 'region:app:footer'],
        ];
        
        // Busca match por prefixo
        foreach ($mappings as $pattern => $mapping) {
            if (strpos($path, $pattern) !== false) {
                return $mapping;
            }
        }
        
        // Fallback: tenta inferir region do path
        if (preg_match('#/api/([^/]+)/#', $path, $matches)) {
            $segment = $matches[1];
            return [
                'trigger_id' => null,
                'region_id' => "region:api:{$segment}"
            ];
        }
        
        return ['trigger_id' => null, 'region_id' => null];
    }
    
    // Shutdown function - chamado ao final da requisição
    public static function onShutdown(): void {
        // Nada a fazer aqui por enquanto
        // A observação já acontece em markAuthCheck
    }
    
    // Info para diagnóstico
    public static function info(): array {
        return [
            'version' => '1.0.0-ENTERPRISE',
            'phase' => 'P1 (Shadow Mode)',
            'registered' => self::$registered,
            'auth_checked' => self::$authChecked,
            'last_auth_data' => self::$lastAuthData,
            'shadow_enabled' => UARPSShadow::isEnabled()
        ];
    }
}
