<?php
// Outlook / MetricsService - contador do badge do header ("recebidos hoje")
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// Badge (§4.1): total de e-mails RECEBIDOS HOJE somando as contas ativas do usuario,
// mais o total de nao-lidos (para o tooltip). NAO conta enviados. Fuso do usuario.
//
// Faz 2 chamadas leves por conta (count de recebidos hoje + unread da Caixa de Entrada),
// com cache Redis por usuario (~55s) para o polling de 60s nao martelar o Graph (§18.4).
declare(strict_types=1);

final class OutlookMetricsService
{
    private const CACHE_TTL = 55;

    private OutlookAuthService $auth;
    private OutlookAccountRepository $accounts;

    public function __construct(PDO $pdo, OutlookAuthService $auth)
    {
        $this->auth = $auth;
        $this->accounts = new OutlookAccountRepository($pdo);
    }

    /**
     * @return array ['received_today'=>int,'unread'=>int,'updated_at'=>string,'degraded'=>bool]
     */
    public function headerCounter(int $userId, string $timezone = 'America/Sao_Paulo'): array
    {
        $cacheKey = 'outlook:hdrcount:' . $userId;
        $cached = self::cacheGet($cacheKey);
        if ($cached !== null) {
            return $cached;
        }

        $contas = array_filter($this->accounts->listPublic($userId), fn($a) => $a['is_active']);
        $recebidos = 0; $naoLidos = 0; $degraded = false;

        $inicioDiaUtc = self::startOfDayUtc($timezone);
        foreach ($contas as $c) {
            $token = $this->auth->accessTokenFor($userId, (int)$c['id']);
            if ($token === null) { $degraded = true; continue; }
            $graph = new GraphClient($token);

            // Recebidos hoje: $count com $filter exige ConsistencyLevel: eventual.
            $r = $graph->get('/me/mailFolders/inbox/messages', [
                '$filter' => 'receivedDateTime ge ' . $inicioDiaUtc,
                '$count'  => 'true',
                '$top'    => 1,
                '$select' => 'id',
            ], ['ConsistencyLevel' => 'eventual']);
            if ($r['ok'] && isset($r['data']['@odata.count'])) {
                $recebidos += (int)$r['data']['@odata.count'];
            } else {
                $degraded = true;
            }

            // Nao-lidos da Caixa de Entrada (1 call barata).
            $u = $graph->get('/me/mailFolders/inbox', ['$select' => 'unreadItemCount']);
            if ($u['ok'] && isset($u['data']['unreadItemCount'])) {
                $naoLidos += (int)$u['data']['unreadItemCount'];
            }
        }

        $out = [
            'received_today' => $recebidos,
            'unread'         => $naoLidos,
            'updated_at'     => gmdate('c'),
            'degraded'       => $degraded || count($contas) === 0,
        ];
        // Nao cacheia resultado degradado por muito tempo (evita "0" preso).
        self::cacheSet($cacheKey, $out, $out['degraded'] ? 15 : self::CACHE_TTL);
        return $out;
    }

    /** Inicio do dia (no fuso do usuario) em ISO-8601 UTC, para o $filter do Graph. */
    private static function startOfDayUtc(string $timezone): string
    {
        try {
            $tz = new DateTimeZone($timezone);
        } catch (\Throwable $e) {
            $tz = new DateTimeZone('America/Sao_Paulo');
        }
        $now = new DateTime('now', $tz);
        $now->setTime(0, 0, 0);
        $now->setTimezone(new DateTimeZone('UTC'));
        return $now->format('Y-m-d\TH:i:s\Z');
    }

    // ── cache Redis (best-effort; ausencia nao quebra) ──────────────────
    private static function cacheGet(string $key): ?array
    {
        try {
            if (!class_exists('RedisHelper')) { return null; }
            $raw = \RedisHelper::tryGetCache($key);
            if (!is_string($raw) || $raw === '') { return null; }
            $j = json_decode($raw, true);
            return is_array($j) ? $j : null;
        } catch (\Throwable $e) { return null; }
    }

    private static function cacheSet(string $key, array $val, int $ttl): void
    {
        try {
            if (!class_exists('RedisHelper')) { return; }
            \RedisHelper::setCache($key, json_encode($val, JSON_UNESCAPED_UNICODE), $ttl);
        } catch (\Throwable $e) { /* ignora */ }
    }
}
