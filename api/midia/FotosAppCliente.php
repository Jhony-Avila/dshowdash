<?php
declare(strict_types=1);

/**
 * /api/midia/FotosAppCliente.php — cliente do canal Dash → app das FOTOS DE PRODUTO. Origem: FN-3 (04/11, clone 7f9ded85,
 * api/equipamentos/FotosAppCliente.php), trazido SEM mudança de regra para o FOTOS-1 (19/11, DIREITA). Rotas novas de publicação: app
 * docs/contracts/fotos-canal-publicacao.md (FOTOS-1). Porta: DSHOW_FOTOS_APP_PORTA (padrão 3100).
 * Contrato: app-dshow docs/contracts/fotos-navegador.md (PROPOSTO). Decisões Q-FN.1 (A), Q-FN.9 (cURL ≤ 50 s), Q-FN.10 (segredo próprio).
 *
 * Regras (todas fail-closed):
 *   • destino CONSTANTE: http://127.0.0.1:<porta> — host fixo no código; a porta vem só da configuração do servidor (padrão 3100), nunca do
 *     navegador; sem proxy, sem redirecionamento, só HTTP;
 *   • assinatura HMAC-SHA256 sobre "ts\nnonce\nMETODO\ncaminho-com-query\nsha256(corpo)" (a mesma base de PonteAuth::assinar), cabeçalhos
 *     X-Dash-Ts / X-Dash-Nonce / X-Dash-Sig; user_id/request_id/produto vão no caminho e na query (dentro da assinatura);
 *   • segredo PRÓPRIO deste sentido em arquivo 0600 (config/app-fotos.key ou DSHOW_FOTOS_APP_SEGREDO_ARQUIVO) — nunca o ponte-app.key;
 *     ausente/curto/aberto para grupo/outros = "app indisponível"; nunca em log nem em resposta;
 *   • teto de 50 s (Q-FN.9): expirou → 'timeout' (a tela mostra "conferindo…" e consulta pelo MESMO request_id).
 * O transporte é injetável (testes com cURL FALSO); em produção é o cURL real.
 * FOTOS-1 (19/11): `pedir` aceita cabeçalhos extras de leitura (só If-None-Match, para o 304 das imagens) e o transporte devolve também
 * `etag` e `versao_galeria` (x-gallery-version, no 409 de versão). A assinatura e o destino não mudam.
 */
final class FotosAppCliente
{
    public const HOST = '127.0.0.1';
    public const PORTA_PADRAO = 3100;
    public const PREFIXO = '/internal/dash/v1';
    public const TIMEOUT_S = 50;
    public const CONEXAO_S = 3;
    public const SEGREDO_MIN = 32;

    /** @var callable */
    private $transporte;
    private int $porta;
    private string $caminhoSegredo;

    /**
     * @param callable|null $transporte fn(string $metodo, string $url, array $cabecalhos, string $corpo, int $timeout): array{status:int, corpo:string, tipo:string, erro:?string, retry_after?:string, replay?:bool}
     */
    public function __construct(?int $porta = null, ?string $caminhoSegredo = null, ?callable $transporte = null)
    {
        $p = $porta ?? self::PORTA_PADRAO;
        if ($p < 1024 || $p > 65535) {
            throw new InvalidArgumentException('porta inválida');
        }
        $this->porta = $p;
        $this->caminhoSegredo = $caminhoSegredo ?? self::caminhoSegredoPadrao();
        $this->transporte = $transporte ?? [self::class, 'curl'];
    }

    public static function caminhoSegredoPadrao(): string
    {
        $env = getenv('DSHOW_FOTOS_APP_SEGREDO_ARQUIVO');
        return is_string($env) && $env !== '' ? $env : (dirname(__DIR__, 2) . '/config/app-fotos.key');
    }

    /** Lê o segredo; '' quando ausente, curto ou legível por grupo/outros. */
    public static function segredo(string $caminho): string
    {
        if (!is_file($caminho) || !is_readable($caminho)) {
            return '';
        }
        clearstatcache(true, $caminho);
        $perm = fileperms($caminho);
        if ($perm === false || ($perm & 0o077) !== 0) {
            error_log('[midia/fotos] segredo do canal com permissão aberta (esperado 0600)');
            return '';
        }
        $s = trim((string) file_get_contents($caminho));
        return strlen($s) >= self::SEGREDO_MIN ? $s : '';
    }

    public static function assinar(string $segredo, string $ts, string $nonce, string $metodo, string $caminhoComQuery, string $corpo): string
    {
        $base = $ts . "\n" . $nonce . "\n" . strtoupper($metodo) . "\n" . $caminhoComQuery . "\n" . hash('sha256', $corpo);
        return hash_hmac('sha256', $base, $segredo);
    }

    public static function novoNonce(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');
    }

    /**
     * Pedido assinado ao app. `$caminho` é relativo ao prefixo (/products, /photo-submissions…), `$query` é montada aqui (http_build_query,
     * RFC 3986) e entra INTEIRA na assinatura.
     * @param array<string, string|int> $query
     * @return array{status:int, corpo:string, tipo:string, erro:?string} erro ∈ null|'segredo'|'timeout'|'rede'
     */
    public function pedir(string $metodo, string $caminho, array $query, string $corpo = '', string $tipo = 'application/octet-stream', ?int $agora = null, ?string $seNaoBater = null): array
    {
        if (!preg_match('#^/[A-Za-z0-9/_-]{1,200}$#', $caminho)) {
            throw new InvalidArgumentException('caminho inválido');
        }
        $segredo = self::segredo($this->caminhoSegredo);
        if ($segredo === '') {
            return ['status' => 0, 'corpo' => '', 'tipo' => '', 'erro' => 'segredo'];
        }
        $caminhoComQuery = self::PREFIXO . $caminho . ($query ? '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986) : '');
        $ts = (string) ($agora ?? time());
        $nonce = self::novoNonce();
        $sig = self::assinar($segredo, $ts, $nonce, $metodo, $caminhoComQuery, $corpo);
        $cab = ['X-Dash-Ts: ' . $ts, 'X-Dash-Nonce: ' . $nonce, 'X-Dash-Sig: ' . $sig, 'Expect:'];
        if ($metodo === 'POST') {
            $cab[] = 'Content-Type: ' . $tipo;
        }
        if ($seNaoBater !== null && preg_match('/^(W\/)?"[A-Za-z0-9._:-]{1,128}"$/', $seNaoBater)) {
            $cab[] = 'If-None-Match: ' . $seNaoBater;   // só o 304 das imagens; fora do padrão = ignorado
        }
        $url = 'http://' . self::HOST . ':' . $this->porta . $caminhoComQuery;
        return ($this->transporte)($metodo, $url, $cab, $corpo, self::TIMEOUT_S);
    }

    /** Transporte real: cURL sem redirecionamento, sem proxy, só HTTP, teto de 50 s. */
    public static function curl(string $metodo, string $url, array $cabecalhos, string $corpo, int $timeout): array
    {
        $ch = curl_init();
        $tipo = '';
        $retry = '';
        $replay = false;
        $etag = '';
        $versaoGaleria = '';
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_CUSTOMREQUEST => $metodo,
            CURLOPT_HTTPHEADER => $cabecalhos,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_PROTOCOLS => CURLPROTO_HTTP,
            CURLOPT_NOPROXY => '*',
            CURLOPT_CONNECTTIMEOUT => self::CONEXAO_S,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_HEADERFUNCTION => static function ($c, string $linha) use (&$tipo, &$retry, &$replay, &$etag, &$versaoGaleria): int {
                if (stripos($linha, 'content-type:') === 0) {
                    $tipo = trim(substr($linha, 13));
                } elseif (stripos($linha, 'retry-after:') === 0) {
                    $retry = trim(substr($linha, 12));
                } elseif (stripos($linha, 'x-idempotent-replay:') === 0) {
                    $replay = trim(substr($linha, 20)) === 'true';
                } elseif (stripos($linha, 'etag:') === 0) {
                    $etag = trim(substr($linha, 5));
                } elseif (stripos($linha, 'x-gallery-version:') === 0) {
                    $versaoGaleria = trim(substr($linha, 18));
                }
                return strlen($linha);
            },
        ]);
        if ($metodo === 'POST') {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $corpo);
        }
        $saida = curl_exec($ch);
        $errno = curl_errno($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        if ($errno === CURLE_OPERATION_TIMEDOUT) {
            return ['status' => 0, 'corpo' => '', 'tipo' => '', 'erro' => 'timeout'];
        }
        if ($errno !== 0 || $saida === false) {
            return ['status' => 0, 'corpo' => '', 'tipo' => '', 'erro' => 'rede'];
        }
        return ['status' => $status, 'corpo' => (string) $saida, 'tipo' => $tipo, 'erro' => null, 'retry_after' => $retry, 'replay' => $replay, 'etag' => $etag, 'versao_galeria' => $versaoGaleria];
    }
}
