<?php
// Google Calendar / GcalTransport - camada de rede INJETAVEL
// @module google-calendar.transport
// @version 1.0.0
// @created 2026-07-30
// @app Google Calendar
//
// POR QUE ISTO EXISTE:
// sem projeto no Google Cloud nao da para chamar a API de verdade — mas da para
// provar tudo o que vem DEPOIS da resposta: parsing, normalizacao, paginacao,
// tratamento de 401/403/410/429 e o backoff. Separando o transporte, o cliente
// e testado contra respostas gravadas no formato real da Google Calendar API, e
// no go-live so o transporte muda.
//
// Nao e "mock do modulo" (isso e o GcalMock): e a camada de socket. O cliente
// acima e o MESMO nos dois casos.
declare(strict_types=1);

/** Resposta crua de uma chamada HTTP. */
final class GcalResposta
{
    public function __construct(
        public readonly int $status,
        public readonly array $corpo,
        public readonly string $erroRede = '',
        public readonly array $cabecalhos = []
    ) {}

    public function ok(): bool { return $this->status >= 200 && $this->status < 300; }

    /** Código de erro do Google (`error.errors[0].reason`, com fallback). */
    public function motivo(): string
    {
        $e = $this->corpo['error'] ?? null;
        if (is_array($e)) {
            if (!empty($e['errors'][0]['reason'])) return (string)$e['errors'][0]['reason'];
            if (!empty($e['status']))              return (string)$e['status'];
            if (!empty($e['message']))             return (string)$e['message'];
        }
        return is_string($e) && $e !== '' ? $e : ('http_' . $this->status);
    }
}

interface GcalTransport
{
    /**
     * @param string $metodo GET|POST|PATCH|PUT|DELETE
     * @param array  $query  parâmetros de query já em array
     * @param ?array $corpo  body JSON, quando houver
     */
    public function enviar(string $metodo, string $url, array $query, ?array $corpo,
                           string $accessToken): GcalResposta;
}

/** Transporte real, sobre cURL. Sem SDK — o projeto não tem composer. */
final class GcalTransportHttp implements GcalTransport
{
    public function __construct(private int $timeout = 25) {}

    public function enviar(string $metodo, string $url, array $query, ?array $corpo,
                           string $accessToken): GcalResposta
    {
        $u = $url . ($query ? ('?' . http_build_query($query)) : '');
        $ch = curl_init($u);
        $headers = [
            'Authorization: Bearer ' . $accessToken,
            'Accept: application/json',
        ];
        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $this->timeout,
            CURLOPT_CUSTOMREQUEST  => $metodo,
            CURLOPT_HEADER         => false,
        ];
        if ($corpo !== null) {
            $headers[] = 'Content-Type: application/json';
            $opts[CURLOPT_POSTFIELDS] = json_encode($corpo, JSON_UNESCAPED_UNICODE);
        }
        $opts[CURLOPT_HTTPHEADER] = $headers;
        curl_setopt_array($ch, $opts);

        $body = curl_exec($ch);
        $err  = curl_error($ch);
        $st   = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($body === false) {
            return new GcalResposta(0, [], $err);
        }
        // 204 (DELETE) vem sem corpo — não é erro de parsing.
        $json = $body === '' ? [] : json_decode((string)$body, true);
        if (!is_array($json)) {
            return new GcalResposta($st, [], 'resposta não-JSON');
        }
        return new GcalResposta($st, $json);
    }
}

/**
 * Transporte de TESTE: devolve respostas gravadas e registra o que foi pedido.
 *
 * Guarda as chamadas para que o teste possa afirmar sobre elas — por exemplo,
 * que a segunda página foi pedida com `pageToken`, ou que o incremental mandou
 * `syncToken` e NÃO mandou `timeMin` (o Google rejeita os dois juntos).
 */
final class GcalTransportFake implements GcalTransport
{
    /** @var array<int,array{metodo:string,url:string,query:array,corpo:?array}> */
    public array $chamadas = [];
    /** @var array<int,GcalResposta> */
    private array $fila;

    public function __construct(GcalResposta ...$respostas) { $this->fila = $respostas; }

    public function enfileirar(GcalResposta ...$r): void
    {
        foreach ($r as $x) { $this->fila[] = $x; }
    }

    public function enviar(string $metodo, string $url, array $query, ?array $corpo,
                           string $accessToken): GcalResposta
    {
        $this->chamadas[] = ['metodo' => $metodo, 'url' => $url, 'query' => $query,
                             'corpo' => $corpo, 'token' => $accessToken];
        if (!$this->fila) {
            return new GcalResposta(500, ['error' => ['message' => 'fake sem resposta enfileirada']]);
        }
        return array_shift($this->fila);
    }

    public function ultimaQuery(): array
    {
        $c = end($this->chamadas);
        return $c ? $c['query'] : [];
    }
}
