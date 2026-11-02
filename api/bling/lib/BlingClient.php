<?php
// Bling / lib/BlingClient.php - cliente da API v3 com limite, retry e paginacao
// @module  bling.client
// @version 1.0.0
// @created 2026-07-30
//
// §44: "A API do Bling possui limites por conta que se aplicam ao CONJUNTO das
// requisições, e chamadas excedentes podem deixar de ser processadas."
//
// "deixar de ser processadas" é a parte perigosa: não é um erro barulhento, é
// silêncio. Uma carga que estoura o limite volta incompleta e ninguém percebe —
// a tela mostra menos pedidos e parece que o mês foi fraco.
//
// Por isso o controle de consumo fica AQUI, antes de sair, e não numa checagem
// depois do erro.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class BlingClient
{
    private const BASE = 'https://www.bling.com.br/Api/v3';

    /** Limites documentados pelo Bling. Conservadores de propósito. */
    private const LIMITE_POR_SEGUNDO = 3;
    private const LIMITE_POR_DIA     = 120000;

    /** Backoff exponencial com teto. Jitter é somado na hora. */
    private const ESPERA_BASE_MS = 500;
    private const ESPERA_TETO_MS = 30000;
    private const MAX_TENTATIVAS = 5;

    /** Balde de tokens: quando cada slot do segundo corrente foi usado. */
    private array $janela = [];

    private int $chamadasNoDia = 0;
    private int $ultimoStatus = 0;

    /** Injetável para o teste conseguir rodar sem esperar de verdade. */
    public static ?\Closure $dormirParaTeste = null;

    public function __construct(
        private readonly BlingTransporte $transporte,
        private readonly string $accessToken,
        private readonly ?BlingRepository $repo = null,
        private readonly ?int $accountId = null,
    ) {}

    // ─────────────────────────────────────────────────────────────

    public function get(string $caminho, array $query = []): BlingResposta
    {
        return $this->requisitar('GET', $caminho, ['query' => $query]);
    }

    public function post(string $caminho, array $corpo): BlingResposta
    {
        return $this->requisitar('POST', $caminho, ['body' => $corpo]);
    }

    /**
     * Percorre TODAS as páginas de um recurso.
     *
     * O callback recebe cada página. Devolver `false` interrompe — é o que
     * permite a sincronização incremental parar assim que alcança o watermark,
     * em vez de varrer o histórico inteiro toda vez.
     *
     * @param callable(array $itens, int $pagina): (bool|null) $aCadaPagina
     * @return array{paginas:int,itens:int,interrompido:bool}
     */
    public function paginar(string $caminho, array $query, callable $aCadaPagina,
                            int $limitePorPagina = 100, int $maxPaginas = 500): array
    {
        $pagina = 1;
        $totalItens = 0;
        $interrompido = false;

        while ($pagina <= $maxPaginas) {
            $r = $this->get($caminho, $query + ['pagina' => $pagina, 'limite' => $limitePorPagina]);

            if (!$r->ok()) {
                throw new RuntimeException(sprintf(
                    'Falha ao paginar %s (página %d, HTTP %d): %s',
                    $caminho, $pagina, $r->status,
                    substr(json_encode($r->corpo, JSON_UNESCAPED_UNICODE) ?: '', 0, 300),
                ));
            }

            $itens = self::extrairItens($r->corpo);
            $totalItens += count($itens);

            if ($itens === []) {
                break;   // fim natural: página vazia
            }

            if ($aCadaPagina($itens, $pagina) === false) {
                $interrompido = true;
                break;
            }

            // Página incompleta = última página. Pedir a próxima só para
            // receber vazio gasta uma chamada do limite diário à toa.
            if (count($itens) < $limitePorPagina) {
                break;
            }
            $pagina++;
        }

        return ['paginas' => $pagina, 'itens' => $totalItens, 'interrompido' => $interrompido];
    }

    /**
     * O Bling v3 devolve `{data: [...]}`; versões e recursos variam entre
     * `data`, `retorno` e a lista na raiz. Normalizar aqui evita espalhar essa
     * checagem por todo sincronizador.
     */
    public static function extrairItens(array $corpo): array
    {
        foreach (['data', 'retorno', 'itens', 'items'] as $chave) {
            if (isset($corpo[$chave]) && is_array($corpo[$chave])) {
                $v = $corpo[$chave];
                // `data` pode vir como objeto único num GET por id.
                return array_is_list($v) ? $v : [$v];
            }
        }
        return array_is_list($corpo) ? $corpo : [];
    }

    // ─────────────────────────────────────────────────────────────

    private function requisitar(string $metodo, string $caminho, array $opcoes): BlingResposta
    {
        $url = self::BASE . '/' . ltrim($caminho, '/');
        if (!empty($opcoes['query'])) {
            $url .= '?' . http_build_query($opcoes['query']);
        }

        $tentativa = 0;
        $ultima = null;

        while ($tentativa < self::MAX_TENTATIVAS) {
            $tentativa++;
            $this->respeitarLimite();

            $r = $this->transporte->enviar($metodo, $url, [
                'headers' => ['Authorization: Bearer ' . $this->accessToken],
                'body'    => $opcoes['body'] ?? null,
                'timeout' => 30,
            ]);

            $this->ultimoStatus = $r->status;
            $ultima = $r;

            if ($r->ok()) {
                return $r;
            }

            // 4xx que não é 429 nem 408: o pedido está errado. Repetir só gasta
            // limite e atrasa o diagnóstico.
            if ($r->status >= 400 && $r->status < 500 && $r->status !== 429 && $r->status !== 408) {
                $this->registrarErro($caminho, $r, $tentativa);
                return $r;
            }

            if ($tentativa >= self::MAX_TENTATIVAS) {
                break;
            }

            // Retry-After manda. Ignorá-lo e usar o próprio backoff é o jeito
            // mais rápido de ser bloqueado de novo.
            $esperaMs = $this->esperaDoServidor($r) ?? $this->backoff($tentativa);
            $this->registrarErro($caminho, $r, $tentativa);
            $this->dormir($esperaMs);
        }

        $this->registrarErro($caminho, $ultima, $tentativa, true);
        return $ultima ?? new BlingResposta(0, ['erro' => 'sem resposta']);
    }

    /** Retry-After em segundos ou data HTTP. */
    private function esperaDoServidor(BlingResposta $r): ?int
    {
        $v = $r->cabecalho('Retry-After');
        if ($v === null || $v === '') {
            return null;
        }
        if (ctype_digit(trim($v))) {
            return min(self::ESPERA_TETO_MS, ((int) $v) * 1000);
        }
        $t = strtotime($v);
        return $t === false ? null : max(0, min(self::ESPERA_TETO_MS, ($t - time()) * 1000));
    }

    /**
     * Exponencial com jitter.
     *
     * O jitter não é enfeite: sem ele, várias tarefas que falharam juntas
     * voltam juntas, e o pico que causou o 429 se repete idêntico.
     */
    private function backoff(int $tentativa): int
    {
        $base = min(self::ESPERA_TETO_MS, self::ESPERA_BASE_MS * (2 ** ($tentativa - 1)));
        return (int) ($base * (0.5 + (random_int(0, 1000) / 1000)));
    }

    /** Balde de tokens por segundo + teto diário. */
    private function respeitarLimite(): void
    {
        if ($this->chamadasNoDia >= self::LIMITE_POR_DIA) {
            throw new RuntimeException(
                'Limite diário de requisições ao Bling atingido. A sincronização continua no próximo ciclo.'
            );
        }

        $agora = microtime(true);
        // Descarta o que saiu da janela de 1 segundo.
        $this->janela = array_values(array_filter($this->janela, static fn($t) => $agora - $t < 1.0));

        if (count($this->janela) >= self::LIMITE_POR_SEGUNDO) {
            $maisAntigo = min($this->janela);
            $esperaMs = (int) ceil((1.0 - ($agora - $maisAntigo)) * 1000);
            if ($esperaMs > 0) {
                $this->dormir($esperaMs);
            }
            $agora = microtime(true);
            $this->janela = array_values(array_filter($this->janela, static fn($t) => $agora - $t < 1.0));
        }

        $this->janela[] = $agora;
        $this->chamadasNoDia++;
    }

    private function dormir(int $ms): void
    {
        if (self::$dormirParaTeste !== null) {
            (self::$dormirParaTeste)($ms);
            return;
        }
        usleep($ms * 1000);
    }

    private function registrarErro(string $caminho, ?BlingResposta $r, int $tentativa, bool $final = false): void
    {
        $msg = sprintf('[bling] %s tentativa %d%s status=%d %s',
            $caminho, $tentativa, $final ? ' (esgotou)' : '',
            $r?->status ?? 0,
            substr(json_encode($r?->corpo ?? [], JSON_UNESCAPED_UNICODE) ?: '', 0, 240));
        error_log($msg);

        $this->repo?->registrarErroSync(
            $this->accountId, $caminho, null,
            'HTTP_' . ($r?->status ?? 0),
            substr(json_encode($r?->corpo ?? [], JSON_UNESCAPED_UNICODE) ?: '', 0, 900),
            $r?->status, $tentativa,
        );
    }

    // ── Observabilidade (§65) ───────────────────────────────────

    public function consumo(): array
    {
        return [
            'chamadas_no_dia'   => $this->chamadasNoDia,
            'limite_diario'     => self::LIMITE_POR_DIA,
            'consumido_pct'     => (int) round(($this->chamadasNoDia / self::LIMITE_POR_DIA) * 100),
            'ultimo_status'     => $this->ultimoStatus,
            'chamadas_na_janela'=> count($this->janela),
        ];
    }
}
