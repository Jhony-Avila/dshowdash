<?php
/**
 * AccessLevels - Definições de Níveis de Acesso
 * @version 2.1.0-ENTERPRISE
 * 
 * P3.2: DEPRECATION warnings em métodos de verificação por nível
 * P3.2: Recomenda uso de UARPSGate para controle de permissões
 * 
 * NOTA: Esta classe define os níveis de acesso do sistema.
 * Para NOVAS implementações, use UARPSGate para verificações de permissão.
 * Os métodos hasAccess/isAdmin/isSuperAdmin são mantidos para retrocompatibilidade.
 * 
 * Changelog:
 * - v2.1.0: Deprecation warnings P3 UARPS
 * - v2.0.0: Versão enterprise
 */

declare(strict_types=1);

class AccessLevels {
    
    // Constantes de níveis
    const GUEST = 0;
    const USER = 20;
    const ADVANCED = 40;
    const MODERATOR = 60;
    const ADMIN = 80;
    const SUPER_ADMIN = 100;
    
    // Mapeamento de nomes
    private static array $levelNames = [
        self::GUEST => 'Visitante',
        self::USER => 'Usuário',
        self::ADVANCED => 'Avançado',
        self::MODERATOR => 'Moderador',
        self::ADMIN => 'Administrador',
        self::SUPER_ADMIN => 'Super Admin'
    ];
    
    // Mapeamento de cores (para UI)
    private static array $levelColors = [
        self::GUEST => '#9e9e9e',      // Cinza
        self::USER => '#2196f3',       // Azul
        self::ADVANCED => '#4caf50',   // Verde
        self::MODERATOR => '#ff9800',  // Laranja
        self::ADMIN => '#f44336',      // Vermelho
        self::SUPER_ADMIN => '#9c27b0' // Roxo
    ];
    
    // Mapeamento de ícones
    private static array $levelIcons = [
        self::GUEST => 'user-x',
        self::USER => 'user',
        self::ADVANCED => 'user-check',
        self::MODERATOR => 'shield',
        self::ADMIN => 'shield-check',
        self::SUPER_ADMIN => 'crown'
    ];
    
    /**
     * Retorna o nome do nível
     * @param int $level Nível numérico
     * @return string Nome do nível
     */
    public static function getLevelName(int $level): string {
        // Encontra o nível mais próximo (menor ou igual)
        $closestLevel = self::GUEST;
        foreach (array_keys(self::$levelNames) as $l) {
            if ($l <= $level) {
                $closestLevel = $l;
            }
        }
        
        return self::$levelNames[$closestLevel] ?? 'Desconhecido';
    }
    
    /**
     * Retorna a cor do nível
     * @param int $level Nível numérico
     * @return string Cor hexadecimal
     */
    public static function getLevelColor(int $level): string {
        $closestLevel = self::GUEST;
        foreach (array_keys(self::$levelColors) as $l) {
            if ($l <= $level) {
                $closestLevel = $l;
            }
        }
        
        return self::$levelColors[$closestLevel] ?? '#9e9e9e';
    }
    
    /**
     * Retorna o ícone do nível
     * @param int $level Nível numérico
     * @return string Nome do ícone
     */
    public static function getLevelIcon(int $level): string {
        $closestLevel = self::GUEST;
        foreach (array_keys(self::$levelIcons) as $l) {
            if ($l <= $level) {
                $closestLevel = $l;
            }
        }
        
        return self::$levelIcons[$closestLevel] ?? 'user';
    }
    
    /**
     * Verifica se usuário tem acesso ao nível requerido
     * 
     * @deprecated P3.2: Use UARPSGate::checkTrigger() para verificações de permissão UARPS
     * @param int $userLevel Nível do usuário
     * @param int $requiredLevel Nível requerido
     * @return bool
     */
    public static function hasAccess(int $userLevel, int $requiredLevel): bool {
        // P3.2: DEPRECATION WARNING
        static $warned = false;
        if (!$warned) {
            error_log("DEPRECATION WARNING [P3.2]: AccessLevels::hasAccess() is deprecated. Use UARPSGate::checkTrigger() for permission checks.");
            $warned = true;
        }
        
        return $userLevel >= $requiredLevel;
    }
    
    /**
     * Verifica se é admin (level >= 80)
     * 
     * @deprecated P3.2: Use UARPSGate::checkTrigger() para verificações de permissão UARPS
     * @param int $level Nível do usuário
     * @return bool
     */
    public static function isAdmin(int $level): bool {
        // P3.2: DEPRECATION WARNING
        static $warned = false;
        if (!$warned) {
            error_log("DEPRECATION WARNING [P3.2]: AccessLevels::isAdmin() is deprecated. Use UARPSGate::checkTrigger() for permission checks.");
            $warned = true;
        }
        
        return $level >= self::ADMIN;
    }
    
    /**
     * Verifica se é super admin (level >= 100)
     * 
     * @deprecated P3.2: Use UARPSGate::checkTrigger() para verificações de permissão UARPS
     * @param int $level Nível do usuário
     * @return bool
     */
    public static function isSuperAdmin(int $level): bool {
        // P3.2: DEPRECATION WARNING
        static $warned = false;
        if (!$warned) {
            error_log("DEPRECATION WARNING [P3.2]: AccessLevels::isSuperAdmin() is deprecated. Use UARPSGate::checkTrigger() for permission checks.");
            $warned = true;
        }
        
        return $level >= self::SUPER_ADMIN;
    }
    
    /**
     * Retorna todos os níveis disponíveis
     * @return array Lista de níveis com nome e valor
     */
    public static function getAllLevels(): array {
        $levels = [];
        
        foreach (self::$levelNames as $value => $name) {
            $levels[] = [
                'value' => $value,
                'name' => $name,
                'color' => self::$levelColors[$value] ?? '#9e9e9e',
                'icon' => self::$levelIcons[$value] ?? 'user'
            ];
        }
        
        return $levels;
    }
    
    /**
     * Retorna níveis que um usuário pode atribuir
     * (Usuário só pode atribuir níveis menores que o seu)
     * @param int $userLevel Nível do usuário atual
     * @return array Lista de níveis atribuíveis
     */
    public static function getAssignableLevels(int $userLevel): array {
        return array_filter(self::getAllLevels(), function($level) use ($userLevel) {
            return $level['value'] < $userLevel;
        });
    }
    
    /**
     * Valida se um nível é válido
     * @param int $level Nível a validar
     * @return bool
     */
    public static function isValidLevel(int $level): bool {
        return $level >= self::GUEST && $level <= self::SUPER_ADMIN;
    }
    
    /**
     * Normaliza nível para o valor mais próximo válido
     * @param int $level Nível a normalizar
     * @return int Nível normalizado
     */
    public static function normalizeLevel(int $level): int {
        if ($level < self::GUEST) return self::GUEST;
        if ($level > self::SUPER_ADMIN) return self::SUPER_ADMIN;
        
        // Encontra o nível mais próximo
        $levels = array_keys(self::$levelNames);
        $closest = self::GUEST;
        
        foreach ($levels as $l) {
            if ($l <= $level) {
                $closest = $l;
            }
        }
        
        return $closest;
    }
    
    /**
     * Compara dois níveis
     * @param int $level1 Primeiro nível
     * @param int $level2 Segundo nível
     * @return int -1 se level1 < level2, 0 se iguais, 1 se level1 > level2
     */
    public static function compare(int $level1, int $level2): int {
        if ($level1 < $level2) return -1;
        if ($level1 > $level2) return 1;
        return 0;
    }
    
    /**
     * Health check da classe
     * @return array
     */
    public static function healthCheck(): array {
        return [
            'status' => 'healthy',
            'levels_defined' => count(self::$levelNames),
            'min_level' => self::GUEST,
            'max_level' => self::SUPER_ADMIN,
            'version' => '2.1.0-ENTERPRISE',
            '_deprecation_notice' => 'hasAccess/isAdmin/isSuperAdmin are deprecated. Use UARPSGate.'
        ];
    }
}
