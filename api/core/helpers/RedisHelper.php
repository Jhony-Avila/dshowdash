<?php
/**
 * RedisHelper - Wrapper para Redis com fechamento automático
 * @version 2.2.0-INVALIDATE
 * @created 2026-01-21
 * @updated 2026-03-26
 *
 * v2.2.0: Adicionado invalidateByPattern() para invalidação de cache por wildcard
 * v2.1.0: Suporte a autenticação via RedisConfig
 * v2.0.0: Integrado com RedisConfig centralizado
 *
 * PROPÓSITO:
 * - Garantir fechamento de conexões Redis
 * - Evitar memory leaks em conexões orphaned
 * - Simplificar uso de cache Redis
 * - Usar configuração centralizada com autenticação
 *
 * USO:
 * $cache = RedisHelper::tryGetCache('my:key');
 * if ($cache !== null) {
 *     echo $cache;
 *     exit;
 * }
 * // ... processar
 * RedisHelper::setCache('my:key', $output, 60);
 */

declare(strict_types=1);

// Carregar configuração centralizada
require_once __DIR__ . '/../../../config/redis.php';

class RedisHelper {

    private static ?Redis $instance = null;
    private static bool $connected = false;

    // Obtém instância Redis (singleton com auto-connect + auth)
    public static function getInstance(): ?Redis {
        if (self::$instance === null) {
            try {
                self::$instance = new Redis();
                self::$connected = self::$instance->connect(
                    RedisConfig::getHost(),
                    RedisConfig::getPort(),
                    RedisConfig::getTimeout()
                );

                // Autenticar se senha configurada
                if (self::$connected) {
                    $password = RedisConfig::getPassword();
                    if (!empty($password)) {
                        self::$instance->auth($password);
                    }
                }
            } catch (Exception $e) {
                self::$instance = null;
                self::$connected = false;
                error_log("[RedisHelper] Connection failed: " . $e->getMessage());
            }
        }
        return self::$connected ? self::$instance : null;
    }

    // Tenta obter cache - retorna null se não encontrado ou erro
    public static function tryGetCache(string $key): ?string {
        $redis = self::getInstance();
        if (!$redis) return null;

        try {
            $cached = $redis->get($key);
            return ($cached !== false) ? $cached : null;
        } catch (Exception $e) {
            return null;
        }
    }

    // Define cache com TTL
    public static function setCache(string $key, string $value, int $ttl = 60): bool {
        $redis = self::getInstance();
        if (!$redis) return false;

        try {
            return $redis->setex($key, $ttl, $value);
        } catch (Exception $e) {
            return false;
        }
    }

    // Verifica se tem cache e retorna com header
    public static function serveIfCached(string $key): bool {
        $cached = self::tryGetCache($key);
        if ($cached !== null) {
            header('X-Cache: HIT');
            echo $cached;
            self::close();
            return true;
        }
        header('X-Cache: MISS');
        return false;
    }

    // Salva e retorna output
    public static function cacheAndReturn(string $key, string $output, int $ttl = 60): void {
        self::setCache($key, $output, $ttl);
        echo $output;
        self::close();
    }

    // Invalida cache por padrão wildcard (ex: "ui:nav:*")
    public static function invalidateByPattern(string $pattern): int {
        $redis = self::getInstance();
        if (!$redis) return 0;

        try {
            $keys = $redis->keys($pattern);
            if (!empty($keys)) {
                return $redis->del($keys);
            }
            return 0;
        } catch (Exception $e) {
            error_log("[RedisHelper] invalidateByPattern failed for '{$pattern}': " . $e->getMessage());
            return 0;
        }
    }

    // Fecha conexão explicitamente
    public static function close(): void {
        if (self::$instance !== null && self::$connected) {
            try {
                self::$instance->close();
            } catch (Exception $e) {
                // Ignora erros no fechamento
            }
        }
        self::$instance = null;
        self::$connected = false;
    }

    // Destrutor - garante fechamento
    public function __destruct() {
        self::close();
    }
}

// Registra shutdown function para garantir fechamento
register_shutdown_function(function() {
    RedisHelper::close();
});
