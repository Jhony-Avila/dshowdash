<?php
/**
 * CacheHelper - Sistema de Cache Centralizado
 * @version 2.0.0-ENTERPRISE
 * @updated 2026-01-21
 *
 * v2.0.0: Integrado com RedisConfig centralizado
 *
 * Funcionalidades:
 * - Suporte Redis + APCu (fallback automático)
 * - TTL configurável por tipo de dado
 * - Namespacing por módulo
 * - Invalidação manual e automática
 * - Métricas de hit/miss rate
 *
 * CORREÇÃO v1.2.0:
 * - FIX: Memory leak - stats resetados entre requests (PHP-FPM)
 * - FIX: Redis close() no shutdown
 * - Adicionado limite em stats para evitar overflow
 *
 * CORREÇÃO v1.1.0:
 * - Removida compressão manual (conflito com Redis serializer)
 * - Redis usa SERIALIZER_PHP (mais confiável que JSON)
 */

// Carregar configuração centralizada
require_once __DIR__ . '/../../../config/redis.php';

class CacheHelper {

    private static $instance = null;
    private static bool $shutdownRegistered = false;
    private $redis = null;
    private $useRedis = false;
    private $useApcu = false;
    private $namespace = 'dshowdash';
    private $stats = ['hits' => 0, 'misses' => 0, 'sets' => 0];

    // Limite para evitar overflow em long-running processes
    private const STATS_MAX = 100000;

    // TTL padrão por tipo de dado
    const TTL_REALTIME = 30;      // Dados em tempo real (30s)
    const TTL_METRICS = 60;       // Métricas gerais (1 min)
    const TTL_AGGREGATIONS = 120; // Agregações complexas (2 min)
    const TTL_CONFIG = 300;       // Configurações (5 min)
    const TTL_STATIC = 600;       // Dados quase estáticos (10 min)

    /**
     * Singleton instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Construtor - detecta e configura backends disponíveis
     */
    private function __construct() {
        // Tentar conectar ao Redis usando config centralizada
        if (class_exists('Redis')) {
            try {
                $this->redis = new Redis();
                $this->redis->connect(
                    RedisConfig::getHost(),
                    RedisConfig::getPort(),
                    RedisConfig::getTimeout()
                );
                // MUDANÇA: Usar PHP serializer em vez de JSON
                $this->redis->setOption(Redis::OPT_SERIALIZER, Redis::SERIALIZER_PHP);
                $this->useRedis = true;
            } catch (Exception $e) {
                error_log("CacheHelper: Redis não disponível - " . $e->getMessage());
                $this->useRedis = false;
            }
        }

        // Verificar APCu
        if (function_exists('apcu_enabled') && apcu_enabled()) {
            $this->useApcu = true;
        }

        // FIX: Registrar shutdown para cleanup (uma vez só)
        if (!self::$shutdownRegistered) {
            register_shutdown_function([__CLASS__, 'cleanup']);
            self::$shutdownRegistered = true;
        }
    }

    /**
     * Define o namespace para isolamento de cache
     */
    public function setNamespace($namespace) {
        $this->namespace = $namespace;
        return $this;
    }

    /**
     * Gera chave de cache com namespace
     */
    private function buildKey($key) {
        return $this->namespace . ':' . $key;
    }

    /**
     * GET - Busca valor no cache
     *
     * @param string $key Chave de cache
     * @return mixed|null Valor do cache ou null se não encontrado
     */
    public function get($key) {
        $fullKey = $this->buildKey($key);

        // Tentar Redis primeiro
        if ($this->useRedis) {
            try {
                $value = $this->redis->get($fullKey);
                if ($value !== false) {
                    $this->incrementStat('hits');
                    // Redis deserializa automaticamente com SERIALIZER_PHP
                    return $value;
                }
            } catch (Exception $e) {
                error_log("CacheHelper Redis GET error: " . $e->getMessage());
            }
        }

        // Fallback para APCu
        if ($this->useApcu) {
            $success = false;
            $value = apcu_fetch($fullKey, $success);
            if ($success) {
                $this->incrementStat('hits');
                return $value;
            }
        }

        $this->incrementStat('misses');
        return null;
    }

    /**
     * FIX: Incrementa stat com limite para evitar memory leak
     */
    private function incrementStat(string $key): void {
        if ($this->stats[$key] < self::STATS_MAX) {
            $this->stats[$key]++;
        }
    }

    /**
     * SET - Armazena valor no cache
     *
     * @param string $key Chave de cache
     * @param mixed $value Valor a cachear
     * @param int $ttl Tempo de vida em segundos
     * @return bool Sucesso da operação
     */
    public function set($key, $value, $ttl = self::TTL_METRICS) {
        $fullKey = $this->buildKey($key);
        $success = false;

        // Armazenar no Redis
        if ($this->useRedis) {
            try {
                // Redis serializa automaticamente com SERIALIZER_PHP
                $success = $this->redis->setex($fullKey, $ttl, $value);
            } catch (Exception $e) {
                error_log("CacheHelper Redis SET error: " . $e->getMessage());
            }
        }

        // Armazenar no APCu (como backup)
        if ($this->useApcu) {
            apcu_store($fullKey, $value, $ttl);
            $success = true;
        }

        if ($success) {
            $this->incrementStat('sets');
        }

        return $success;
    }

    /**
     * DELETE - Remove valor do cache
     *
     * @param string $key Chave de cache
     * @return bool Sucesso da operação
     */
    public function delete($key) {
        $fullKey = $this->buildKey($key);
        $success = false;

        if ($this->useRedis) {
            try {
                $success = $this->redis->del($fullKey) > 0;
            } catch (Exception $e) {
                error_log("CacheHelper Redis DELETE error: " . $e->getMessage());
            }
        }

        if ($this->useApcu) {
            apcu_delete($fullKey);
            $success = true;
        }

        return $success;
    }

    /**
     * INVALIDATE - Invalida cache por padrão (wildcard)
     *
     * @param string $pattern Padrão de chave (ex: "card-01:*")
     * @return int Número de chaves removidas
     */
    public function invalidate($pattern) {
        $fullPattern = $this->buildKey($pattern);
        $count = 0;

        if ($this->useRedis) {
            try {
                $keys = $this->redis->keys($fullPattern);
                if (!empty($keys)) {
                    $count = $this->redis->del($keys);
                }
            } catch (Exception $e) {
                error_log("CacheHelper Redis INVALIDATE error: " . $e->getMessage());
            }
        }

        // APCu não suporta wildcard, então limpamos tudo do namespace
        if ($this->useApcu && strpos($pattern, '*') !== false) {
            $info = apcu_cache_info();
            if (isset($info['cache_list'])) {
                foreach ($info['cache_list'] as $entry) {
                    if (strpos($entry['info'], $this->namespace) === 0) {
                        apcu_delete($entry['info']);
                        $count++;
                    }
                }
            }
        }

        return $count;
    }

    /**
     * REMEMBER - Get from cache ou executa callback e cacheia
     *
     * @param string $key Chave de cache
     * @param callable $callback Função a executar se cache miss
     * @param int $ttl Tempo de vida em segundos
     * @return mixed Resultado
     */
    public function remember($key, callable $callback, $ttl = self::TTL_METRICS) {
        $value = $this->get($key);

        if ($value !== null) {
            return $value;
        }

        // Cache miss - executar callback
        $value = $callback();

        if ($value !== null) {
            $this->set($key, $value, $ttl);
        }

        return $value;
    }

    /**
     * Retorna estatísticas de uso do cache
     */
    public function getStats() {
        $total = $this->stats['hits'] + $this->stats['misses'];
        $hitRate = $total > 0 ? round(($this->stats['hits'] / $total) * 100, 2) : 0;

        return [
            'hits' => $this->stats['hits'],
            'misses' => $this->stats['misses'],
            'sets' => $this->stats['sets'],
            'hit_rate' => $hitRate . '%',
            'backends' => [
                'redis' => $this->useRedis,
                'apcu' => $this->useApcu
            ]
        ];
    }

    /**
     * Limpa todo o cache do namespace
     */
    public function flush() {
        return $this->invalidate('*');
    }

    /**
     * Verifica se cache está disponível
     */
    public function isAvailable() {
        return $this->useRedis || $this->useApcu;
    }

    /**
     * FIX: Reset stats (útil para testes e limpeza entre requests)
     */
    public function resetStats(): void {
        $this->stats = ['hits' => 0, 'misses' => 0, 'sets' => 0];
    }

    /**
     * FIX: Cleanup - Fecha conexão Redis e reseta singleton
     * Chamado automaticamente no shutdown do request
     */
    public static function cleanup(): void {
        if (self::$instance !== null) {
            // Fechar conexão Redis
            if (self::$instance->redis !== null && self::$instance->useRedis) {
                try {
                    self::$instance->redis->close();
                } catch (Exception $e) {
                    // Ignorar erros no shutdown
                }
            }
            self::$instance->redis = null;
            self::$instance->useRedis = false;
            self::$instance->resetStats();
        }
        // Reset do singleton para próximo request
        self::$instance = null;
        self::$shutdownRegistered = false;
    }

    /**
     * Fecha conexão Redis manualmente (sem resetar singleton)
     */
    public function close(): void {
        if ($this->redis !== null && $this->useRedis) {
            try {
                $this->redis->close();
            } catch (Exception $e) {
                // Ignorar erros
            }
            $this->redis = null;
            $this->useRedis = false;
        }
    }
}
