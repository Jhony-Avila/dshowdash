<?php
declare(strict_types=1);

/**
 * api/ads/lib/GoogleRelatorios.php — GA-001 · leitura de relatórios Google Ads e GA4 · VINHO (ACIMA_ESQUERDA), 26/11/2026 noite.
 * Referência: LOTE8/DSHOW-GA-001 (ChatGPT), incorporada com testes próprios. INERTE: o TRANSPORTE é injetado (fn(produto, caminho, escopo, cabecalhos, corpo)
 * → [status, dados]); quem o implementa (OAuth de curta duração da identidade gerenciada) vem depois, com o Diogo/Walter. Esta classe:
 *  - nunca recebe URL, chave ou credencial: origem e caminho são montados AQUI (Ads: /vN/customers/{id}/googleAds:search; GA4: /v1beta/properties/{id}:runReport);
 *  - confere a CONCESSÃO (produto, recurso, gestor) do principal ANTES de olhar o cache; IDs validados (Ads: 10 dígitos; gestor: 10 dígitos, só no Ads);
 *  - pagina até o fim (token repetido ou fora do formato = parcial); timeout/erro/resposta malformada NUNCA viram zero e nunca entram no cache;
 *  - custo em MICROS inteiros (texto), sem float; cache de 300 s com o principal, produto, recurso, gestor, período e versão na chave.
 */
final class GoogleRelatorios
{
    public const TTL = 300;
    public const ESCOPO = ['ads' => 'https://www.googleapis.com/auth/adwords', 'ga4' => 'https://www.googleapis.com/auth/analytics.readonly'];
    public const ORIGEM = ['ads' => 'https://googleads.googleapis.com', 'ga4' => 'https://analyticsdata.googleapis.com'];
    private const ERRO = [400 => 'relatorio_invalido', 401 => 'nao_autenticado', 403 => 'sem_acesso', 429 => 'cota'];
    private const PAGINAS = 100;
    private array $cache = [];

    /** @param Closure $transporte fn(string $produto, string $caminho, string $escopo, array $cabecalhos, array $corpo): array{0:int,1:mixed} */
    public function __construct(private readonly Closure $transporte, private readonly Closure $relogio, private readonly string $versaoAds)
    {
        if (preg_match('/^v[1-9][0-9]*\z/', $versaoAds) !== 1) throw new InvalidArgumentException('versao_ads');
    }

    /**
     * @param array $concessoes lista de [produto, recurso, gestor|null] que ESTE principal pode ler (vínculo conta/empresa aprovado pelo Jhony)
     * @return array{estado:string, linhas?:list<array>, observado_em?:int}  estados: ok · parcial · indisponivel · negado · nao_autenticado · sem_acesso · cota · relatorio_invalido
     */
    public function ler(string $principal, string $produto, string $recurso, string $de, string $ate, array $concessoes, ?string $gestor = null): array
    {
        if (!isset(self::ESCOPO[$produto]) || !in_array([$produto, $recurso, $gestor], $concessoes, true)) return ['estado' => 'negado'];   // ANTES do cache
        if ($gestor !== null && ($produto !== 'ads' || preg_match('/^[0-9]{10}\z/', $gestor) !== 1)) throw new InvalidArgumentException('gestor');
        if (preg_match($produto === 'ads' ? '/^[0-9]{10}\z/' : '/^[0-9]{1,20}\z/', $recurso) !== 1) throw new InvalidArgumentException('recurso');
        $a = DateTimeImmutable::createFromFormat('!Y-m-d', $de); $b = DateTimeImmutable::createFromFormat('!Y-m-d', $ate);
        if ($a === false || $b === false || $a->format('Y-m-d') !== $de || $b->format('Y-m-d') !== $ate || $a > $b) throw new InvalidArgumentException('periodo');
        $chave = hash('sha256', json_encode([$principal, $produto, $recurso, $gestor, $de, $ate, $this->versaoAds]));
        $agora = ($this->relogio)();
        if (isset($this->cache[$chave]) && $agora - $this->cache[$chave][0] < self::TTL) return $this->cache[$chave][1];
        if ($produto === 'ads') {
            $caminho = "/{$this->versaoAds}/customers/{$recurso}/googleAds:search";
            $corpo = ['query' => "SELECT segments.date, campaign.id, metrics.impressions, metrics.clicks, metrics.cost_micros FROM campaign WHERE segments.date BETWEEN '$de' AND '$ate'"];
            $cab = $gestor !== null ? ['login-customer-id' => $gestor] : [];   // só na via gerenciada; o alvo segue no caminho
        } else {
            $caminho = "/v1beta/properties/{$recurso}:runReport";
            $corpo = ['dateRanges' => [['startDate' => $de, 'endDate' => $ate]], 'metrics' => [['name' => 'sessions']], 'returnPropertyQuota' => true];
            $cab = [];
        }
        $linhas = []; $vistos = [];
        for ($i = 0; $i < self::PAGINAS; $i++) {
            try { [$status, $dados] = ($this->transporte)($produto, $caminho, self::ESCOPO[$produto], $cab, $corpo); }
            catch (Throwable $e) { error_log('[google-relatorios] transporte: ' . get_class($e)); return ['estado' => 'indisponivel']; }
            if ($status !== 200) return ['estado' => self::ERRO[$status] ?? 'indisponivel'];
            if (!is_array($dados)) return ['estado' => 'parcial'];
            $lista = $dados[$produto === 'ads' ? 'results' : 'rows'] ?? [];
            if (!is_array($lista) || array_filter($lista, fn($x) => !is_array($x)) !== []) return ['estado' => 'parcial'];
            if ($produto === 'ga4' && (empty($dados['metricHeaders']) || (int) ($dados['rowCount'] ?? 0) !== count($lista))) return ['estado' => 'parcial'];
            foreach ($lista as $x) $linhas[] = $produto === 'ads' ? self::linhaAds($x) : $x;
            $prox = $dados['nextPageToken'] ?? null;
            if ($prox === null || $prox === '') {
                $r = ['estado' => 'ok', 'linhas' => $linhas, 'observado_em' => $agora];
                $this->cache[$chave] = [$agora, $r];
                return $r;
            }
            if ($produto !== 'ads' || !is_string($prox) || isset($vistos[$prox])) break;
            $vistos[$prox] = true; $corpo['pageToken'] = $prox;
        }
        return ['estado' => 'parcial'];
    }

    /** Ads: custo em micros como TEXTO de inteiro (nunca float); impressões/cliques inteiros; o que não vier inteiro vira null (não zero). */
    private static function linhaAds(array $x): array
    {
        $int = static fn($v): ?string => (is_int($v) || (is_string($v) && preg_match('/^-?[0-9]{1,20}\z/', $v) === 1)) ? (string) $v : null;
        return ['data' => $x['segments']['date'] ?? null, 'campanha' => isset($x['campaign']['id']) ? (string) $x['campaign']['id'] : null,
                'impressoes' => $int($x['metrics']['impressions'] ?? null), 'cliques' => $int($x['metrics']['clicks'] ?? null), 'custo_micros' => $int($x['metrics']['costMicros'] ?? null)];
    }
}
