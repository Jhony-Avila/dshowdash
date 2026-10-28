<?php
declare(strict_types=1);

// /api/core/UARPSShadow.php
// UARPS Shadow Middleware - Observa e loga divergências sem bloquear
// @version 1.1.0-ENTERPRISE
// @updated 2026-01-21
// FIX: Memory leak - reset de observations entre requests
// @phase P1 (Shadow Mode)
// @lifecycle TEMPORÁRIO - Será REMOVIDO na fase P3 (UARPS Puro)
// 
// PROPÓSITO:
// - Intercepta verificações de permissão
// - Compara resultado Legacy (ACL por nível) vs UARPS
// - Loga divergências para análise
// - NÃO bloqueia nada - apenas observa
//
// USO:
// Chamar UARPSShadow::observe() APÓS verificações legacy bem-sucedidas
// para registrar se UARPS teria dado resultado diferente.

require_once __DIR__ . '/UARPSGate.php';
require_once __DIR__ . '/../../config/uarps.php';

class UARPSShadow {

    private static bool $enabled = true;
    private static array $observations = [];
    private static int $maxObservationsPerRequest = 50;
    private static bool $initialized = false;

    // ══════════════════════════════════════════════════════════════
    // INICIALIZAÇÃO - CHAMAR NO INÍCIO DE CADA REQUEST
    // ══════════════════════════════════════════════════════════════

    // FIX: Reset automático para evitar memory leak em PHP-FPM
    public static function init(): void {
        if (!self::$initialized) {
            self::$observations = [];
            self::$initialized = true;

            // Registra reset no final do request
            register_shutdown_function(function() {
                UARPSShadow::cleanup();
            });
        }
    }

    // Limpa observações (chamado automaticamente no shutdown)
    public static function cleanup(): void {
        self::$observations = [];
        self::$initialized = false;
    }
    
    // ══════════════════════════════════════════════════════════════
    // MÉTODO PRINCIPAL - OBSERVAR DIVERGÊNCIA
    // ══════════════════════════════════════════════════════════════
    
    // Observa uma verificação de permissão e loga se houver divergência
    // Chamar APÓS o legacy ter permitido/negado
    public static function observe(
        int $userId,
        int $userLevel,
        int $requiredLevel,
        bool $legacyAllowed,
        ?string $triggerId = null,
        ?string $regionId = null,
        ?string $endpoint = null
    ): array {
        
        // FIX: Garantir inicialização
        self::init();

        // Se não está ativo ou não está em shadow mode, retorna sem fazer nada
        if (!self::$enabled || !UARPSConfig::isMode(UARPSConfig::MODE_SHADOW)) {
            return ['observed' => false, 'reason' => 'shadow_mode_disabled'];
        }
        
        // Limite de observações por request (proteção contra loops)
        if (count(self::$observations) >= self::$maxObservationsPerRequest) {
            return ['observed' => false, 'reason' => 'max_observations_reached'];
        }
        
        // Determina endpoint se não fornecido
        $endpoint = $endpoint ?? ($_SERVER['REQUEST_URI'] ?? 'unknown');
        
        // Verifica UARPS
        $uarpsAllowed = true;
        $uarpsState = 'inherit';
        
        if ($triggerId) {
            $uarpsResult = UARPSGate::checkTrigger($userId, $triggerId);
            $uarpsAllowed = $uarpsResult['allowed'];
            $uarpsState = $uarpsResult['state'];
        } elseif ($regionId) {
            $uarpsResult = UARPSGate::checkRegion($userId, $regionId);
            $uarpsAllowed = $uarpsResult['allowed'];
            $uarpsState = $uarpsResult['state'];
        } else {
            // Sem trigger/region específico, não há como comparar
            return ['observed' => false, 'reason' => 'no_trigger_or_region'];
        }
        
        // Registra observação
        $observation = [
            'user_id' => $userId,
            'user_level' => $userLevel,
            'required_level' => $requiredLevel,
            'trigger_id' => $triggerId,
            'region_id' => $regionId,
            'endpoint' => $endpoint,
            'legacy_allowed' => $legacyAllowed,
            'uarps_allowed' => $uarpsAllowed,
            'uarps_state' => $uarpsState,
            'divergence' => ($legacyAllowed !== $uarpsAllowed),
            'timestamp' => date('c')
        ];
        
        self::$observations[] = $observation;
        
        // Se há divergência, loga no banco
        if ($observation['divergence']) {
            self::logDivergence($observation);
        }
        
        return [
            'observed' => true,
            'divergence' => $observation['divergence'],
            'legacy' => $legacyAllowed ? 'allow' : 'deny',
            'uarps' => $uarpsAllowed ? 'allow' : 'deny',
            'uarps_state' => $uarpsState
        ];
    }
    
    // ══════════════════════════════════════════════════════════════
    // MÉTODOS DE OBSERVAÇÃO ESPECÍFICOS (ATALHOS)
    // ══════════════════════════════════════════════════════════════
    
    // Observa verificação de admin (requireAdmin)
    public static function observeAdminCheck(
        int $userId,
        int $userLevel,
        bool $legacyAllowed,
        ?string $context = null
    ): array {
        // Para admin check genérico, usamos region do endpoint
        $regionId = self::inferRegionFromEndpoint();
        return self::observe(
            $userId,
            $userLevel,
            80, // ADMIN level
            $legacyAllowed,
            null,
            $regionId,
            $context
        );
    }
    
    // Observa verificação de auth com nível mínimo
    public static function observeAuthCheck(
        int $userId,
        int $userLevel,
        int $requiredLevel,
        bool $legacyAllowed,
        ?string $context = null
    ): array {
        $regionId = self::inferRegionFromEndpoint();
        return self::observe(
            $userId,
            $userLevel,
            $requiredLevel,
            $legacyAllowed,
            null,
            $regionId,
            $context
        );
    }
    
    // Observa acesso a trigger específico
    public static function observeTrigger(
        int $userId,
        int $userLevel,
        string $triggerId,
        bool $legacyAllowed
    ): array {
        return self::observe(
            $userId,
            $userLevel,
            0,
            $legacyAllowed,
            $triggerId,
            null
        );
    }
    
    // Observa acesso a region específica
    public static function observeRegion(
        int $userId,
        int $userLevel,
        string $regionId,
        bool $legacyAllowed
    ): array {
        return self::observe(
            $userId,
            $userLevel,
            0,
            $legacyAllowed,
            null,
            $regionId
        );
    }
    
    // ══════════════════════════════════════════════════════════════
    // LOGGING DE DIVERGÊNCIAS
    // ══════════════════════════════════════════════════════════════
    
    private static function logDivergence(array $observation): void {
        try {
            $pdo = getConnection('DSHOWDASH');
            
            $stmt = $pdo->prepare("
                INSERT INTO app_uarps_divergence_log 
                (user_id, trigger_id, region_id, endpoint, legacy_result, uarps_result, user_level, required_level, context, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            
            $context = json_encode([
                'uarps_state' => $observation['uarps_state'],
                'observation_count' => count(self::$observations)
            ]);
            
            $stmt->execute([
                $observation['user_id'],
                $observation['trigger_id'],
                $observation['region_id'],
                $observation['endpoint'],
                $observation['legacy_allowed'] ? 'allow' : 'deny',
                $observation['uarps_allowed'] ? 'allow' : 'deny',
                $observation['user_level'],
                $observation['required_level'],
                $context,
                $ip
            ]);
            
        } catch (Exception $e) {
            error_log("UARPSShadow::logDivergence error: " . $e->getMessage());
        }
    }
    
    // ══════════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════════
    
    // Infere region baseado no endpoint atual
    private static function inferRegionFromEndpoint(): ?string {
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        
        // Mapeamento de endpoints para regions
        $mappings = [
            '/api/permissions/' => 'region:panel:permissions-admin',
            '/api/users/' => 'region:panel:user-management',
            '/api/sessions/' => 'region:panel:session-admin',
            '/api/feature-flags/' => 'region:panel:feature-flags-admin',
            '/api/admin/orchestrator/' => 'region:panel:orchestrator',
            '/api/settings/' => 'region:panel:user-preferences',
            '/api/audit/' => 'region:panel:audit-trail',
            '/api/health/' => 'region:panel:health-dashboard',
            '/api/ui/header/' => 'region:app:header',
            '/api/ui/sidebar/' => 'region:app:sidebar',
            '/api/ui/navrail/' => 'region:app:sidebar',
            '/api/ui/footer/' => 'region:app:footer'
        ];
        
        foreach ($mappings as $pattern => $regionId) {
            if (strpos($uri, $pattern) !== false) {
                return $regionId;
            }
        }
        
        return null;
    }
    
    // ══════════════════════════════════════════════════════════════
    // CONTROLE E DIAGNÓSTICO
    // ══════════════════════════════════════════════════════════════
    
    // Habilita/desabilita shadow mode em runtime
    public static function setEnabled(bool $enabled): void {
        self::$enabled = $enabled;
    }
    
    // Retorna se está habilitado
    public static function isEnabled(): bool {
        return self::$enabled && UARPSConfig::isMode(UARPSConfig::MODE_SHADOW);
    }
    
    // Retorna observações da request atual
    public static function getObservations(): array {
        return self::$observations;
    }
    
    // Retorna estatísticas da request atual
    public static function getStats(): array {
        $divergences = array_filter(self::$observations, fn($o) => $o['divergence']);
        
        return [
            'total_observations' => count(self::$observations),
            'divergences' => count($divergences),
            'divergence_rate' => count(self::$observations) > 0 
                ? round(count($divergences) / count(self::$observations) * 100, 2) 
                : 0
        ];
    }
    
    // Limpa observações (útil para testes)
    public static function reset(): void {
        self::$observations = [];
    }
    
    // Health check
    public static function healthCheck(): array {
        return [
            'status' => self::isEnabled() ? 'ACTIVE' : 'INACTIVE',
            'enabled' => self::$enabled,
            'uarps_mode' => UARPSConfig::getMode(),
            'is_shadow_mode' => UARPSConfig::isMode(UARPSConfig::MODE_SHADOW),
            'observations_this_request' => count(self::$observations),
            'max_observations' => self::$maxObservationsPerRequest
        ];
    }
    
    // Info completo
    public static function info(): array {
        return [
            'version' => '1.0.0-ENTERPRISE',
            'phase' => 'P1 (Shadow Mode)',
            'lifecycle' => 'TEMPORARY - Will be REMOVED in P3',
            'purpose' => 'Observe and log divergences between Legacy ACL and UARPS',
            'health' => self::healthCheck(),
            'stats' => self::getStats(),
            'endpoint_mappings' => [
                '/api/permissions/' => 'region:panel:permissions-admin',
                '/api/users/' => 'region:panel:user-management',
                '/api/sessions/' => 'region:panel:session-admin',
                '...' => '(see inferRegionFromEndpoint)'
            ]
        ];
    }
}
