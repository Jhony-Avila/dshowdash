<?php
declare(strict_types=1);

/**
 * /api/asaas/AsaasConector.php — conector Asaas SÓ LEITURA (ACIMA_DIREITA, 23/11/2026).
 *
 * Regras que o código impõe (provadas em scripts/asaas/teste-asaas-conector.php):
 *  - Só existe GET. Não há parâmetro de método em nenhuma classe; o transporte real fixa CURLOPT_HTTPGET e recusa qualquer URL fora da base.
 *  - Só as rotas da lista fixa AsaasRotas::ROTAS (cobranças, estatísticas de cobranças, extrato, saldo), cada uma com sua lista de
 *    parâmetros permitidos. Rota ou parâmetro fora da lista → AsaasErro('rota_recusada'|'parametro_recusado') ANTES de qualquer rede.
 *  - O provedor não limita a chave a leitura: a proteção é esta (nunca acrescente rota sem teste e sem portão).
 *  - Chave: lida de config/asaas/<rótulo>.key (guardada pelo Jhony com scripts/asaas/asaas-chaves.sh). Nunca é logada, exibida,
 *    nem entra em mensagem de erro (AsaasErro só carrega códigos). __debugInfo esconde a chave.
 *  - Páginas de 100; uma requisição por vez; 429 respeitado (RateLimit-Reset / Retry-After, teto 60 s, 3 tentativas);
 *    5xx/rede: 2 novas tentativas; depois, erro — o chamador NUNCA converte erro em zero.
 */

final class AsaasErro extends RuntimeException
{
    /** @param string $codigo  rota_recusada|parametro_recusado|chave_ausente|chave_invalida|chave_recusada|acesso_negado|limite|indisponivel|resposta_invalida */
    public function __construct(public readonly string $codigo, public readonly int $http = 0)
    {
        parent::__construct('asaas: ' . $codigo . ($http > 0 ? " (HTTP $http)" : ''));
    }
}

final class AsaasRotas
{
    public const BASES = [
        'producao' => 'https://api.asaas.com/v3',
        'sandbox'  => 'https://api-sandbox.asaas.com/v3',
    ];

    private const DATA = '/^\d{4}-\d{2}-\d{2}$/';
    private const STATUS = '/^(PENDING|RECEIVED|CONFIRMED|OVERDUE|REFUNDED|RECEIVED_IN_CASH|REFUND_REQUESTED|REFUND_IN_PROGRESS|CHARGEBACK_REQUESTED|CHARGEBACK_DISPUTE|AWAITING_CHARGEBACK_REVERSAL|DUNNING_REQUESTED|DUNNING_RECEIVED|AWAITING_RISK_ANALYSIS)$/';
    private const TIPO = '/^(BOLETO|CREDIT_CARD|PIX|UNDEFINED)$/';
    private const OFFSET = '/^(0|[1-9][0-9]{0,6})$/';
    private const LIMITE = '/^([1-9]|[1-9][0-9]|100)$/';

    /**
     * Lista FECHADA: nome lógico → caminho e parâmetros permitidos (regex do valor). Tudo GET.
     * Documentação: docs.asaas.com (list-payments, estatisticas-de-cobrancas, recuperar-extrato, recuperar-saldo-da-conta).
     */
    public const ROTAS = [
        'cobrancas' => ['caminho' => '/payments', 'params' => [
            'offset' => self::OFFSET, 'limit' => self::LIMITE, 'status' => self::STATUS, 'billingType' => self::TIPO,
            'dateCreated[ge]' => self::DATA, 'dateCreated[le]' => self::DATA, 'dueDate[ge]' => self::DATA, 'dueDate[le]' => self::DATA,
            'paymentDate[ge]' => self::DATA, 'paymentDate[le]' => self::DATA,
        ]],
        'estatisticas_cobrancas' => ['caminho' => '/finance/payment/statistics', 'params' => [
            'status' => self::STATUS, 'billingType' => self::TIPO,
            'dueDate[ge]' => self::DATA, 'dueDate[le]' => self::DATA, 'dateCreated[ge]' => self::DATA, 'dateCreated[le]' => self::DATA,
        ]],
        'extrato' => ['caminho' => '/financialTransactions', 'params' => [
            'offset' => self::OFFSET, 'limit' => self::LIMITE, 'startDate' => self::DATA, 'finishDate' => self::DATA, 'order' => '/^(asc|desc)$/',
        ]],
        'saldo' => ['caminho' => '/finance/balance', 'params' => []],
    ];

    /** @return string URL completa (base + caminho + query ordenada); lança AsaasErro antes de qualquer rede */
    public static function url(string $base, string $rota, array $query): string
    {
        if (!in_array($base, self::BASES, true)) throw new AsaasErro('rota_recusada');
        $def = self::ROTAS[$rota] ?? null;
        if ($def === null) throw new AsaasErro('rota_recusada');
        foreach ($query as $k => $v) {
            $re = $def['params'][$k] ?? null;
            if ($re === null || !(is_string($v) || is_int($v)) || preg_match($re, (string) $v) !== 1) throw new AsaasErro('parametro_recusado');
        }
        ksort($query);
        $qs = $query === [] ? '' : '?' . http_build_query(array_map('strval', $query), '', '&', PHP_QUERY_RFC3986);
        return $base . $def['caminho'] . $qs;
    }
}

/** Transporte só de GET. @return array{status:int, cabecalhos:array<string,string>, corpo:string} (status 0 = sem resposta) */
interface AsaasTransporte
{
    public function get(string $url, string $chave): array;
}

final class AsaasTransporteCurl implements AsaasTransporte
{
    public function get(string $url, #[\SensitiveParameter] string $chave): array
    {
        $okBase = false;
        foreach (AsaasRotas::BASES as $b) { if (str_starts_with($url, $b . '/')) { $okBase = true; break; } }
        if (!$okBase) throw new AsaasErro('rota_recusada');
        $cab = [];
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_HTTPGET => true,                       // só GET; nunca CUSTOMREQUEST, nunca corpo
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => ['access_token: ' . $chave, 'User-Agent: dshow-asaas-leitura/1', 'Accept: application/json'],
            CURLOPT_HEADERFUNCTION => static function ($c, string $linha) use (&$cab): int {
                $p = strpos($linha, ':');
                if ($p !== false) $cab[strtolower(trim(substr($linha, 0, $p)))] = trim(substr($linha, $p + 1));
                return strlen($linha);
            },
        ]);
        $corpo = curl_exec($ch);
        $status = $corpo === false ? 0 : (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        return ['status' => $status, 'cabecalhos' => $cab, 'corpo' => $corpo === false ? '' : (string) $corpo];
    }
}

final class AsaasCliente
{
    public const MAX_429 = 3;
    public const MAX_FALHA = 2;
    public int $requisicoes = 0;

    /** @param Closure(int):void $dormir segundos (injetável nos testes) */
    public function __construct(
        private readonly AsaasTransporte $transporte,
        #[\SensitiveParameter] private readonly string $chave,
        private readonly string $base,
        private readonly Closure $dormir,
    ) {
        if (!in_array($base, AsaasRotas::BASES, true)) throw new AsaasErro('rota_recusada');
    }

    public function __debugInfo(): array { return ['base' => $this->base, 'chave' => '***', 'requisicoes' => $this->requisicoes]; }

    /** @return array<mixed> JSON decodificado */
    public function get(string $rota, array $query = []): array
    {
        $url = AsaasRotas::url($this->base, $rota, $query);   // recusa antes de qualquer rede
        $n429 = 0; $nFalha = 0;
        while (true) {
            $this->requisicoes++;
            $r = $this->transporte->get($url, $this->chave);
            $st = (int) ($r['status'] ?? 0);
            if ($st === 200) {
                $d = json_decode((string) ($r['corpo'] ?? ''), true);
                if (!is_array($d)) throw new AsaasErro('resposta_invalida', 200);
                return $d;
            }
            if ($st === 401) throw new AsaasErro('chave_recusada', 401);
            if ($st === 403) throw new AsaasErro('acesso_negado', 403);
            if ($st === 429) {
                if (++$n429 > self::MAX_429) throw new AsaasErro('limite', 429);
                ($this->dormir)(self::espera((array) ($r['cabecalhos'] ?? []), $n429));
                continue;
            }
            if ($st === 0 || $st >= 500) {
                if (++$nFalha > self::MAX_FALHA) throw new AsaasErro('indisponivel', $st);
                ($this->dormir)(2 * $nFalha);
                continue;
            }
            throw new AsaasErro('resposta_invalida', $st);   // 400/404/etc.: não insiste
        }
    }

    /** segundos a esperar num 429: RateLimit-Reset ou Retry-After (se numéricos), senão recuo 5·n; entre 1 e 60 */
    public static function espera(array $cab, int $n): int
    {
        foreach (['ratelimit-reset', 'retry-after'] as $h) {
            $v = $cab[$h] ?? null;
            if (is_string($v) && preg_match('/^\d{1,6}$/', trim($v))) return max(1, min(60, (int) trim($v)));
        }
        return min(60, 5 * $n);
    }
}

/** Contas e chaves: um arquivo por conta em <config>/asaas/<rótulo>.key (0600, dono do php-fpm). */
final class AsaasChaves
{
    public const RE_ROTULO = '/^[a-z0-9][a-z0-9-]{1,31}$/';
    public const RE_CHAVE = '/^\$aact_[A-Za-z0-9_$:=+\/.-]{20,400}$/';

    public function __construct(private readonly string $pasta) {}

    public static function padrao(): self
    {
        $p = getenv('DSHOW_ASAAS_CHAVES_DIR');
        return new self(is_string($p) && $p !== '' ? $p : dirname(__DIR__, 2) . '/config/asaas');
    }

    /** @return list<string> rótulos com arquivo de chave (sem ler o conteúdo) */
    public function rotulos(): array
    {
        $out = [];
        foreach (glob($this->pasta . '/*.key') ?: [] as $f) {
            $r = basename($f, '.key');
            if (preg_match(self::RE_ROTULO, $r) === 1 && is_file($f) && !is_link($f)) $out[] = $r;
        }
        sort($out);
        return $out;
    }

    /** @return array{chave:string, base:string, ambiente:string} */
    public function ler(string $rotulo): array
    {
        if (preg_match(self::RE_ROTULO, $rotulo) !== 1) throw new AsaasErro('chave_ausente');
        $f = $this->pasta . '/' . $rotulo . '.key';
        if (!is_file($f) || is_link($f)) throw new AsaasErro('chave_ausente');
        $k = trim((string) @file_get_contents($f));
        if (preg_match(self::RE_CHAVE, $k) !== 1) throw new AsaasErro('chave_invalida');
        $amb = str_starts_with($k, '$aact_hmlg_') ? 'sandbox' : 'producao';
        return ['chave' => $k, 'base' => AsaasRotas::BASES[$amb], 'ambiente' => $amb];
    }
}
