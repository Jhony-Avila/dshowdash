<?php
// DataTables / ExternalSourceService - verificacao de APIs, arquivos e servicos (§34/35)
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// Fontes nao-MySQL reusam DT_Conexao (source_type='api'|'file'|'queue'|'cache')
// e guardam os atributos proprios em DT_Fonte_Externa.
//
// SEGREDO (§30.1): o token de autenticacao vive cifrado em DT_Conexao.password_encrypted
// e so e decifrado no momento de montar o header. NUNCA entra em log, em mensagem
// de erro ou na resposta da API.
//
// NOTA DE ESCOPO: este servico alcanca hosts internos de proposito - o modulo
// existe para monitorar a infra da propria empresa (§2). Por isso NAO ha bloqueio
// de faixa privada. A protecao e o gate de autenticacao: so a equipe de
// desenvolvimento cadastra fonte (§4), e o endpoint cadastrado e auditavel.
declare(strict_types=1);

require_once __DIR__ . '/../lib/Crypto.php';
require_once __DIR__ . '/../lib/ConnectionFactory.php';
require_once __DIR__ . '/../../core/repositories/RepositoryException.php';

final class DtExternalSourceService
{
    /** Teto absoluto de tempo por sonda, em segundos. */
    private const MAX_TIMEOUT = 30;
    private const DEFAULT_TIMEOUT = 10;

    /** Corpo lido no maximo ate aqui - sonda nao baixa payload inteiro. */
    private const MAX_BODY_BYTES = 65536;

    private const UA = 'DShowDash-DataTables/1.0 (monitor)';

    private PDO $local;

    public function __construct(PDO $localPdo)
    {
        $this->local = $localPdo;
    }

    // ═══════════════════════════════════════════════════════════════
    // ORQUESTRACAO
    // ═══════════════════════════════════════════════════════════════

    /**
     * Verifica uma fonte externa e persiste o resultado.
     *
     * @param array $conn Linha de DT_Conexao COM credencial (source_type != mysql)
     */
    public function check(array $conn): array
    {
        $connId = (int)$conn['id'];
        $src    = $this->sourceFor($connId);

        if ($src === null) {
            return $this->persistResult($connId, [
                'status'      => DtConnectionFactory::ST_UNTESTED,
                'error'       => 'Fonte externa sem configuracao em DT_Fonte_Externa',
                'latency_ms'  => null,
                'status_code' => null,
            ], null);
        }

        $type = (string)($conn['source_type'] ?? 'api');

        return match ($type) {
            'api', 'integration' => $this->checkHttp($conn, $src),
            'file'               => $this->checkFile($conn, $src),
            'cache'              => $this->checkRedis($conn, $src),
            default              => $this->persistResult($connId, [
                'status'      => DtConnectionFactory::ST_UNTESTED,
                'error'       => "Tipo de fonte sem verificador implementado: {$type}",
                'latency_ms'  => null,
                'status_code' => null,
            ], $src),
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // HTTP (§34.2)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Etapas (§34.2): resolucao, conectividade, autenticacao, status HTTP,
     * tempo de resposta e retorno esperado.
     */
    private function checkHttp(array $conn, array $src): array
    {
        $connId   = (int)$conn['id'];
        $endpoint = (string)($src['endpoint'] ?? '');

        if ($endpoint === '' || !preg_match('#^https?://#i', $endpoint)) {
            return $this->persistResult($connId, [
                'status'      => DtConnectionFactory::ST_OFFLINE,
                'error'       => 'Endpoint ausente ou nao e uma URL http(s) valida',
                'latency_ms'  => null,
                'status_code' => null,
            ], $src);
        }

        $timeout = min(self::MAX_TIMEOUT, max(1, (int)($src['timeout_sec'] ?? self::DEFAULT_TIMEOUT)));
        $method  = strtoupper((string)($src['http_method'] ?? 'GET'));
        if (!in_array($method, ['GET', 'HEAD', 'POST'], true)) {
            $method = 'GET';   // sonda nunca usa verbo destrutivo
        }

        $headers = ['Accept: application/json', 'User-Agent: ' . self::UA];
        $authErr = null;
        try {
            $auth = $this->authHeader($conn, $src);
            if ($auth !== null) {
                $headers[] = $auth;
            }
        } catch (DtCryptoException $e) {
            $authErr = 'Credencial armazenada nao pode ser decifrada';
        }

        if ($authErr !== null) {
            return $this->persistResult($connId, [
                'status'      => DtConnectionFactory::ST_CRED_EXPIRED,
                'error'       => $authErr,
                'latency_ms'  => null,
                'status_code' => null,
            ], $src);
        }

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $endpoint,
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_NOBODY         => $method === 'HEAD',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS      => 3,
            CURLOPT_TIMEOUT        => $timeout,
            CURLOPT_CONNECTTIMEOUT => min(5, $timeout),
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            // Corta a leitura cedo: a sonda nao precisa do payload inteiro.
            CURLOPT_BUFFERSIZE     => 8192,
            CURLOPT_NOPROGRESS     => false,
            CURLOPT_PROGRESSFUNCTION => static function ($res, $dlTotal, $dlNow) {
                return $dlNow > self::MAX_BODY_BYTES ? 1 : 0;   // 1 aborta
            },
        ]);

        $t0   = microtime(true);
        $body = curl_exec($ch);
        $ms   = (int)round((microtime(true) - $t0) * 1000);

        $code    = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $errNo   = curl_errno($ch);
        $errMsg  = curl_error($ch);
        curl_close($ch);

        // Aborto proprio por tamanho nao e falha - ja temos o status.
        $abortedBySize = $errNo === CURLE_ABORTED_BY_CALLBACK;

        if ($errNo !== 0 && !$abortedBySize) {
            $status = in_array($errNo, [CURLE_COULDNT_RESOLVE_HOST, CURLE_COULDNT_CONNECT,
                                        CURLE_OPERATION_TIMEDOUT], true)
                ? DtConnectionFactory::ST_OFFLINE
                : DtConnectionFactory::ST_OFFLINE;

            return $this->persistResult($connId, [
                'status'      => $status,
                'error'       => $this->safeCurlError($errNo, $errMsg),
                'latency_ms'  => $ms,
                'status_code' => $code ?: null,
            ], $src);
        }

        // 401/403 = credencial, nao indisponibilidade. A distincao muda a acao.
        if ($code === 401 || $code === 403) {
            return $this->persistResult($connId, [
                'status'      => DtConnectionFactory::ST_CRED_EXPIRED,
                'error'       => "HTTP {$code}: autenticacao rejeitada pelo servico",
                'latency_ms'  => $ms,
                'status_code' => $code,
            ], $src);
        }

        $expected = (int)($src['expected_status'] ?? 200);
        if ($code !== $expected) {
            return $this->persistResult($connId, [
                'status'      => DtConnectionFactory::ST_OFFLINE,
                'error'       => "HTTP {$code} (esperado {$expected})",
                'latency_ms'  => $ms,
                'status_code' => $code,
            ], $src);
        }

        // Retorno esperado (§34.2): confirma que o corpo tem a chave combinada.
        $path = (string)($src['expected_json_path'] ?? '');
        if ($path !== '' && is_string($body) && $body !== '') {
            if (!$this->jsonPathExists($body, $path)) {
                return $this->persistResult($connId, [
                    'status'      => DtConnectionFactory::ST_UNSTABLE,
                    'error'       => "Respondeu {$code} mas o retorno nao contem '{$path}'",
                    'latency_ms'  => $ms,
                    'status_code' => $code,
                ], $src);
            }
        }

        $slow = $this->slowThreshold($connId);
        return $this->persistResult($connId, [
            'status'      => $ms > $slow ? DtConnectionFactory::ST_SLOW : DtConnectionFactory::ST_ONLINE,
            'error'       => $ms > $slow ? "Resposta em {$ms}ms, acima do limite de {$slow}ms" : null,
            'latency_ms'  => $ms,
            'status_code' => $code,
        ], $src);
    }

    /** Monta o header de autenticacao decifrando o segredo no ultimo instante. */
    private function authHeader(array $conn, array $src): ?string
    {
        $type = strtolower((string)($src['auth_type'] ?? 'none'));
        if ($type === '' || $type === 'none') {
            return null;
        }

        $stored = (string)($conn['password_encrypted'] ?? '');
        if ($stored === '') {
            return null;
        }
        $secret = DtCrypto::looksEncrypted($stored) ? DtCrypto::decrypt($stored) : $stored;
        if ($secret === '') {
            return null;
        }

        return match ($type) {
            'bearer', 'oauth2' => 'Authorization: Bearer ' . $secret,
            'basic'            => 'Authorization: Basic '
                                  . base64_encode(((string)($conn['username'] ?? '')) . ':' . $secret),
            'apikey'           => 'X-API-Key: ' . $secret,
            default            => null,
        };
    }

    /** Caminho pontilhado existe no JSON? Ex.: "data.items" ou "ok". */
    private function jsonPathExists(string $body, string $path): bool
    {
        $decoded = json_decode($body, true);
        if (!is_array($decoded)) {
            return false;
        }
        $cur = $decoded;
        foreach (explode('.', $path) as $seg) {
            if ($seg === '') {
                continue;
            }
            if (!is_array($cur) || !array_key_exists($seg, $cur)) {
                return false;
            }
            $cur = $cur[$seg];
        }
        return true;
    }

    /**
     * Mensagem de erro segura.
     *
     * O HOSTNAME pode aparecer - e informacao de diagnostico legitima (§29) e nao
     * e segredo. O que NUNCA pode vazar e credencial: token/chave em query string,
     * userinfo embutido na URL (user:senha@host) ou header de autorizacao.
     */
    private function safeCurlError(int $errNo, string $msg): string
    {
        // user:senha@host -> user:***@host
        $msg = preg_replace('#://([^/:@\s]+):([^/@\s]+)@#', '://$1:***@', $msg) ?? $msg;
        // qualquer par chave-secreta em query string, com ou sem esquema na frente
        $msg = preg_replace(
            '/\b(api[_-]?key|apikey|token|access[_-]?token|secret|password|passwd|pwd|auth|signature|sig)\s*=\s*[^\s&;"\']+/i',
            '$1=***',
            $msg
        ) ?? $msg;
        // Header de autorizacao, se o driver ecoar. Consome ate o fim da linha:
        // com \S+ o esquema ("Bearer") seria mascarado e o TOKEN sobreviveria.
        $msg = preg_replace('/\b(Authorization|X-API-Key)\s*:\s*[^\r\n]*/i', '$1: ***', $msg) ?? $msg;

        return mb_substr("curl({$errNo}): {$msg}", 0, 900);
    }

    // ═══════════════════════════════════════════════════════════════
    // ARQUIVOS E PLANILHAS (§35)
    // ═══════════════════════════════════════════════════════════════

    private function checkFile(array $conn, array $src): array
    {
        $connId = (int)$conn['id'];
        $loc    = (string)($src['file_location'] ?? '');

        if ($loc === '') {
            return $this->persistResult($connId, [
                'status' => DtConnectionFactory::ST_UNTESTED,
                'error'  => 'Fonte de arquivo sem localizacao configurada',
                'latency_ms' => null, 'status_code' => null,
            ], $src);
        }

        // Arquivo remoto (Google Sheets, URL de importacao) usa a sonda HTTP.
        if (preg_match('#^https?://#i', $loc)) {
            $src['endpoint'] = $loc;
            return $this->checkHttp($conn, $src);
        }

        $t0 = microtime(true);
        if (!is_file($loc)) {
            return $this->persistResult($connId, [
                'status' => DtConnectionFactory::ST_OFFLINE,
                'error'  => 'Arquivo nao encontrado no caminho configurado',
                'latency_ms' => (int)round((microtime(true) - $t0) * 1000),
                'status_code' => null,
            ], $src);
        }
        if (!is_readable($loc)) {
            return $this->persistResult($connId, [
                'status' => DtConnectionFactory::ST_CRED_EXPIRED,
                'error'  => 'Arquivo existe mas nao ha permissao de leitura',
                'latency_ms' => (int)round((microtime(true) - $t0) * 1000),
                'status_code' => null,
            ], $src);
        }

        $size = filesize($loc);
        $ms   = (int)round((microtime(true) - $t0) * 1000);

        $this->local->prepare(
            'UPDATE DT_Fonte_Externa SET file_size_bytes = :s WHERE connection_id = :c'
        )->execute([':s' => $size !== false ? $size : null, ':c' => $connId]);

        return $this->persistResult($connId, [
            'status' => DtConnectionFactory::ST_ONLINE,
            'error'  => null,
            'latency_ms' => $ms,
            'status_code' => null,
        ], $src);
    }

    // ═══════════════════════════════════════════════════════════════
    // CACHE / REDIS
    // ═══════════════════════════════════════════════════════════════

    private function checkRedis(array $conn, array $src): array
    {
        $connId = (int)$conn['id'];

        if (!class_exists('Redis')) {
            return $this->persistResult($connId, [
                'status' => DtConnectionFactory::ST_UNTESTED,
                'error'  => 'Extensao redis nao disponivel neste PHP',
                'latency_ms' => null, 'status_code' => null,
            ], $src);
        }

        $t0 = microtime(true);
        try {
            $r = new Redis();
            $ok = @$r->connect((string)$conn['host'], (int)($conn['port'] ?: 6379), 3.0);
            if (!$ok) {
                throw new RuntimeException('Nao foi possivel conectar');
            }

            $stored = (string)($conn['password_encrypted'] ?? '');
            if ($stored !== '') {
                $pwd = DtCrypto::looksEncrypted($stored) ? DtCrypto::decrypt($stored) : $stored;
                if ($pwd !== '' && !@$r->auth($pwd)) {
                    $r->close();
                    return $this->persistResult($connId, [
                        'status' => DtConnectionFactory::ST_CRED_EXPIRED,
                        'error'  => 'Autenticacao Redis rejeitada',
                        'latency_ms' => (int)round((microtime(true) - $t0) * 1000),
                        'status_code' => null,
                    ], $src);
                }
            }

            $pong = $r->ping();
            $ms   = (int)round((microtime(true) - $t0) * 1000);
            $r->close();

            $alive = $pong === true || $pong === '+PONG' || $pong === 'PONG';
            $slow  = $this->slowThreshold($connId);

            return $this->persistResult($connId, [
                'status' => !$alive ? DtConnectionFactory::ST_UNSTABLE
                          : ($ms > $slow ? DtConnectionFactory::ST_SLOW : DtConnectionFactory::ST_ONLINE),
                'error'  => $alive ? null : 'PING nao respondeu PONG',
                'latency_ms' => $ms, 'status_code' => null,
            ], $src);

        } catch (Throwable $e) {
            return $this->persistResult($connId, [
                'status' => DtConnectionFactory::ST_OFFLINE,
                'error'  => mb_substr($e->getMessage(), 0, 900),
                'latency_ms' => (int)round((microtime(true) - $t0) * 1000),
                'status_code' => null,
            ], $src);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PERSISTENCIA
    // ═══════════════════════════════════════════════════════════════

    /** Grava em DT_Fonte_Externa + DT_Conexao + reusa o pipeline de status. */
    private function persistResult(int $connId, array $r, ?array $src): array
    {
        $ok = in_array($r['status'], [DtConnectionFactory::ST_ONLINE, DtConnectionFactory::ST_SLOW], true);

        try {
            if ($src !== null) {
                $this->local->prepare(
                    'UPDATE DT_Fonte_Externa
                        SET last_status_code = :sc, last_response_ms = :ms'
                    . ($ok ? ', last_ok_at = NOW()' : '') .
                    ' WHERE connection_id = :c'
                )->execute([
                    ':sc' => $r['status_code'], ':ms' => $r['latency_ms'], ':c' => $connId,
                ]);
            }

            // Reusa StatusRepository para agregacao/disponibilidade/interrupcao.
            $repo = new DtStatusRepository($this->local);
            $res  = [
                'status'          => $r['status'],
                'latency_ms'      => $r['latency_ms'],
                'step_failed'     => $ok ? null : 'http',
                'read_ok'         => $ok ? 1 : 0,
                'write_ok'        => null,     // fonte externa nao tem teste de gravacao
                'write_supported' => 0,
                'error'           => $r['error'],
                'checked_at'      => date('Y-m-d H:i:s'),
            ];
            $repo->upsertCurrent($connId, $res, $ok);
            $repo->recordAggregate($connId, $r['status'], $r['latency_ms'], $ok, false);
            $repo->reconcileOutage($connId, $res, $ok, false);

            $this->local->prepare(
                'UPDATE DT_Conexao SET status = :st, last_check_at = NOW(), last_error = :e'
                . ($ok ? ', last_success_at = NOW()' : '') . ' WHERE id = :c'
            )->execute([
                ':st' => $r['status'],
                ':e'  => $r['error'] !== null ? mb_substr($r['error'], 0, 1000) : null,
                ':c'  => $connId,
            ]);
        } catch (PDOException $e) {
            error_log('[datatables:external] persist: ' . $e->getMessage());
        }

        return $r;
    }

    private function sourceFor(int $connId): ?array
    {
        try {
            $st = $this->local->prepare('SELECT * FROM DT_Fonte_Externa WHERE connection_id = :c LIMIT 1');
            $st->execute([':c' => $connId]);
            return $st->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (PDOException $e) {
            return null;
        }
    }

    private function slowThreshold(int $connId): int
    {
        return (new DtStatusRepository($this->local))->slowThresholdFor($connId);
    }

    // ═══════════════════════════════════════════════════════════════
    // CADASTRO
    // ═══════════════════════════════════════════════════════════════

    /** Cria/atualiza a configuracao especifica da fonte externa. */
    public function upsertSource(int $connId, array $data): void
    {
        $allowed = ['endpoint', 'http_method', 'auth_type', 'expected_status',
                    'expected_json_path', 'timeout_sec', 'file_format', 'file_location'];
        $clean = ['connection_id' => $connId];
        foreach ($allowed as $k) {
            if (array_key_exists($k, $data)) {
                $clean[$k] = $data[$k] === '' ? null : $data[$k];
            }
        }

        $cols = array_keys($clean);
        $sets = [];
        foreach ($cols as $c) {
            if ($c !== 'connection_id') {
                $sets[] = "{$c} = VALUES({$c})";
            }
        }

        $sql = 'INSERT INTO DT_Fonte_Externa (' . implode(', ', $cols) . ')
                VALUES (:' . implode(', :', $cols) . ')'
             . ($sets !== [] ? ' ON DUPLICATE KEY UPDATE ' . implode(', ', $sets) : '');

        try {
            $st = $this->local->prepare($sql);
            foreach ($clean as $k => $v) {
                $st->bindValue(':' . $k, $v);
            }
            $st->execute();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtExternalSourceService::upsertSource');
        }
    }

    /** Fontes externas com o estado atual, para a tela de integracoes (§34.1). */
    public function listSources(): array
    {
        try {
            $st = $this->local->query(
                'SELECT c.id connection_id, c.name, c.source_type, c.status, c.host,
                        c.last_check_at, c.last_success_at, c.last_error,
                        (c.password_encrypted IS NOT NULL AND c.password_encrypted <> "") has_secret,
                        e.label environment_label, e.color environment_color,
                        a.label application_label,
                        f.endpoint, f.http_method, f.auth_type, f.expected_status,
                        f.last_status_code, f.last_response_ms, f.last_ok_at,
                        f.file_format, f.file_size_bytes,
                        sa.since, TIMESTAMPDIFF(SECOND, sa.since, NOW()) status_duration_sec
                   FROM DT_Conexao c
              LEFT JOIN DT_Fonte_Externa f ON f.connection_id = c.id
              LEFT JOIN DT_Ambiente  e ON e.id = c.environment_id
              LEFT JOIN DT_Aplicacao a ON a.id = c.application_id
              LEFT JOIN DT_Status_Atual sa ON sa.connection_id = c.id
                  WHERE c.is_active = 1 AND c.source_type <> "mysql"
               ORDER BY c.name'
            );
            $rows = $st->fetchAll(PDO::FETCH_ASSOC);

            // Mascara o endpoint: pode carregar chave em query string.
            foreach ($rows as &$r) {
                $r['has_secret'] = (bool)$r['has_secret'];
                if (!empty($r['endpoint'])) {
                    $r['endpoint_masked'] = preg_replace('/([?&](api_?key|token|secret|key)=)[^&]*/i',
                        '$1***', (string)$r['endpoint']);
                }
            }
            return $rows;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtExternalSourceService::listSources');
        }
    }
}
