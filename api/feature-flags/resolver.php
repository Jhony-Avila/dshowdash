<?php
// api/feature-flags/resolver.php — resolucao de feature flag
// @version 1.0.0
// @created 2026-07-20
//
// Extraido do index.php para ser testavel isoladamente e reutilizavel pelo
// backend (o painel React precisa da MESMA decisao que o front recebe).
//
// PRECEDENCIA (aprovada pelo dono):
//   1. flag inexistente        -> desabilitada (source=not_found), NUNCA 500
//   2. is_enabled = 0          -> KILL SWITCH ABSOLUTO (nem override liga)
//   3. janela de vigencia      -> starts_at / ends_at, no timezone do BACKEND
//   4. ambiente                -> enum exato: all|production|staging|development
//   5. override por usuario    -> app_user_feature_flags, respeitando expires_at
//   6. rollout percentual      -> DETERMINISTICO por (flag_key + user_id)
//   7. valor padrao da flag
//
// O rollout NAO pode ser aleatorio por requisicao: o usuario alternaria entre a
// interface legada e a React a cada F5.
declare(strict_types=1);

final class FeatureFlagResolver
{
    /** Enum real da coluna `environment`. Sem traducao paralela (prod/homolog/dev). */
    public const ENVIRONMENTS = ['all', 'production', 'staging', 'development'];

    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Resolve uma flag para um usuario.
     *
     * @return array{key:string,enabled:bool,source:string,environment:?string,
     *               rollout_percentage:?int,payload:array,starts_at:?string,ends_at:?string}
     */
    // ATENCAO: usar array_merge, NUNCA `$out + [...]`. O operador + e UNIAO e
    // MANTEM o valor da esquerda quando a chave ja existe — como $out ja nasce
    // com enabled=false, todo retorno positivo seria descartado em silencio.
    public function resolve(string $flagKey, ?int $userId = null, ?string $currentEnv = null): array
    {
        $currentEnv = $currentEnv ?? self::detectEnvironment();

        $base = [
            'key'                => $flagKey,
            'enabled'            => false,
            'source'             => 'not_found',
            'environment'        => null,
            'rollout_percentage' => null,
            'payload'            => [],
            'starts_at'          => null,
            'ends_at'            => null,
        ];

        try {
            $st = $this->pdo->prepare(
                'SELECT flag_key, flag_name, description, is_enabled, rollout_percentage,
                        payload_json, environment, starts_at, ends_at
                   FROM app_feature_flags
                  WHERE flag_key = :k AND deleted_at IS NULL
                  LIMIT 1'
            );
            $st->execute([':k' => $flagKey]);
            $flag = $st->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // Banco indisponivel: flag DESLIGADA e motivo rastreavel.
            // Ligar por engano e pior que desligar por engano.
            error_log('[feature-flags] resolve: ' . $e->getMessage());
            return array_merge($base, ['source' => 'error']);
        }

        // 1. Inexistente
        if ($flag === false) {
            return $base;
        }

        $payload = self::decodePayload($flag['payload_json'] ?? null, $flagKey);

        $out = [
            'key'                => $flagKey,
            'enabled'            => false,
            'source'             => 'disabled',
            'environment'        => $flag['environment'],
            'rollout_percentage' => $flag['rollout_percentage'] !== null ? (int)$flag['rollout_percentage'] : null,
            'payload'            => $payload,
            'starts_at'          => $flag['starts_at'],
            'ends_at'            => $flag['ends_at'],
        ];

        // 2. Kill switch absoluto
        if ((int)$flag['is_enabled'] !== 1) {
            return $out;   // source=disabled
        }

        // 3. Janela de vigencia (timezone do backend, nunca do navegador)
        $now = time();
        if (!empty($flag['starts_at']) && $now < strtotime((string)$flag['starts_at'])) {
            return array_merge($out, ['source' => 'not_started']);
        }
        if (!empty($flag['ends_at']) && $now > strtotime((string)$flag['ends_at'])) {
            return array_merge($out, ['source' => 'expired']);
        }

        // 4. Ambiente
        $flagEnv = (string)($flag['environment'] ?? 'all');
        if ($flagEnv !== 'all' && $flagEnv !== $currentEnv) {
            return array_merge($out, ['source' => 'environment_mismatch']);
        }

        // 5. Override por usuario (vence o rollout, nunca o kill switch)
        if ($userId !== null && $userId > 0) {
            $ov = $this->userOverride($flagKey, $userId);
            if ($ov !== null) {
                $out['enabled'] = $ov['is_enabled'];
                $out['source']  = 'user_override';
                if ($ov['payload'] !== []) {
                    $out['payload'] = $ov['payload'];
                }
                return $out;
            }
        }

        // 6. Rollout percentual — DETERMINISTICO
        $pct = $out['rollout_percentage'] ?? 100;
        if ($pct <= 0) {
            return array_merge($out, ['source' => 'rollout_excluded']);
        }
        if ($pct < 100) {
            if ($userId === null || $userId <= 0) {
                // Sem identidade estavel nao ha decisao estavel. Modulo interno e
                // autenticado; anonimo fica de fora do rollout parcial.
                return array_merge($out, ['source' => 'rollout_no_identity']);
            }
            $bucket = self::bucketFor($flagKey, $userId);
            if ($bucket >= $pct) {
                return array_merge($out, ['source' => 'rollout_excluded']);
            }
            return array_merge($out, ['enabled' => true, 'source' => 'rollout']);
        }

        // 7. Padrao da flag
        return array_merge($out, ['enabled' => true, 'source' => 'global']);
    }

    /** Resolve varias de uma vez (uma consulta por flag; volume e baixo). */
    public function resolveMany(array $flagKeys, ?int $userId = null): array
    {
        $out = [];
        $env = self::detectEnvironment();
        foreach ($flagKeys as $k) {
            $out[$k] = $this->resolve((string)$k, $userId, $env);
        }
        return $out;
    }

    // ═══════════════════════════════════════════════════════════════
    // AUXILIARES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Bucket estavel em [0,100). Mesma pessoa + mesma flag => mesmo resultado
     * sempre. Sem isso o usuario oscilaria entre as duas interfaces a cada F5.
     */
    public static function bucketFor(string $flagKey, int $userId): int
    {
        // crc32 e suficiente e barato; o objetivo e distribuicao estavel, nao seguranca.
        return (int)(sprintf('%u', crc32($flagKey . ':' . $userId)) % 100);
    }

    /** Override valido do usuario, ou null. */
    private function userOverride(string $flagKey, int $userId): ?array
    {
        try {
            $st = $this->pdo->prepare(
                'SELECT is_enabled, payload_json, reason, expires_at
                   FROM app_user_feature_flags
                  WHERE user_id = :u AND flag_key = :k AND deleted_at IS NULL
                  ORDER BY id DESC LIMIT 1'
            );
            $st->execute([':u' => $userId, ':k' => $flagKey]);
            $r = $st->fetch(PDO::FETCH_ASSOC);

            if ($r === false) {
                return null;
            }
            // Expirado nao vale — e como se nao existisse.
            if (!empty($r['expires_at']) && time() > strtotime((string)$r['expires_at'])) {
                return null;
            }
            return [
                'is_enabled' => (int)$r['is_enabled'] === 1,
                'payload'    => self::decodePayload($r['payload_json'] ?? null, $flagKey),
            ];
        } catch (PDOException $e) {
            error_log('[feature-flags] userOverride: ' . $e->getMessage());
            return null;
        }
    }

    /** Decode seguro. JSON invalido NAO derruba a flag — vira payload vazio. */
    public static function decodePayload($raw, string $flagKey = ''): array
    {
        if ($raw === null || $raw === '' || $raw === 'null') {
            return [];
        }
        if (is_array($raw)) {
            return $raw;
        }
        $d = json_decode((string)$raw, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($d)) {
            error_log("[feature-flags] payload_json invalido em '{$flagKey}': " . json_last_error_msg());
            return [];
        }
        return $d;
    }

    /**
     * Ambiente atual, no vocabulario EXATO do enum.
     * Ordem: APP_ENV do .env -> hostname -> production (mais seguro por default:
     * uma flag de desenvolvimento nao vaza para produção por engano).
     */
    public static function detectEnvironment(): string
    {
        $env = strtolower(trim((string)(getenv('APP_ENV') ?: ($_ENV['APP_ENV'] ?? ''))));
        $map = [
            'prod' => 'production', 'production' => 'production',
            'staging' => 'staging', 'homolog' => 'staging', 'hml' => 'staging',
            'dev' => 'development', 'development' => 'development', 'local' => 'development',
        ];
        if ($env !== '' && isset($map[$env])) {
            return $map[$env];
        }

        $host = strtolower((string)($_SERVER['HTTP_HOST'] ?? gethostname() ?: ''));
        if (str_contains($host, 'staging') || str_contains($host, 'homolog')) {
            return 'staging';
        }
        if (str_contains($host, 'localhost') || str_contains($host, '127.0.0.1')) {
            return 'development';
        }
        return 'production';
    }
}
