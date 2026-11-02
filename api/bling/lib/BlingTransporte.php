<?php
// Bling / lib/BlingTransporte.php - camada de transporte HTTP, substituível
// @module  bling.transporte
// @version 1.0.0
// @created 2026-07-30
//
// POR QUE ISTO EXISTE SEPARADO DO CLIENTE
// O caminho conectar → trocar código por token → paginar → sincronizar só seria
// executado pela primeira vez com a credencial real, em produção, com o dono
// olhando. Isolando o transporte, o caminho inteiro é exercitado AGORA, com um
// transporte falso, contra o banco de verdade.
//
// Mesma estratégia do Google Calendar (`GcalTransport`), que provou 66 checks
// sem nunca ter falado com o Google.
//
// Se o teste passa, o que falta no go-live é SÓ colar as credenciais.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

/** Resposta crua de uma chamada HTTP. */
final class BlingResposta
{
    public function __construct(
        public readonly int $status,
        public readonly array $corpo,
        public readonly array $cabecalhos = [],
        public readonly string $bruto = '',
    ) {}

    public function ok(): bool
    {
        return $this->status >= 200 && $this->status < 300;
    }

    /** Cabeçalho por nome, sem depender de maiúscula/minúscula. */
    public function cabecalho(string $nome): ?string
    {
        foreach ($this->cabecalhos as $k => $v) {
            if (strcasecmp((string) $k, $nome) === 0) {
                return is_array($v) ? (string) reset($v) : (string) $v;
            }
        }
        return null;
    }
}

interface BlingTransporte
{
    /**
     * @param string $metodo  GET | POST | PUT | PATCH | DELETE
     * @param string $url     absoluta
     * @param array  $opcoes  ['headers' => [], 'body' => array|string, 'form' => array, 'timeout' => int]
     */
    public function enviar(string $metodo, string $url, array $opcoes = []): BlingResposta;
}

/** Transporte real: cURL. */
final class BlingTransporteCurl implements BlingTransporte
{
    public function enviar(string $metodo, string $url, array $opcoes = []): BlingResposta
    {
        $ch = curl_init();
        $cabecalhosResposta = [];

        $headers = $opcoes['headers'] ?? [];
        $corpo = null;

        if (isset($opcoes['form'])) {
            // OAuth exige application/x-www-form-urlencoded na troca do código.
            $corpo = http_build_query($opcoes['form']);
            $headers[] = 'Content-Type: application/x-www-form-urlencoded';
        } elseif (isset($opcoes['body'])) {
            $corpo = is_string($opcoes['body']) ? $opcoes['body']
                : json_encode($opcoes['body'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $headers[] = 'Content-Type: application/json';
        }

        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_CUSTOMREQUEST  => $metodo,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => (int) ($opcoes['timeout'] ?? 30),
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_HTTPHEADER     => array_merge(['Accept: application/json'], $headers),
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            // Não seguir redirect: um 30x numa API é sinal de problema de
            // configuração, e seguir cegamente pode vazar o Authorization para
            // outro host.
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_HEADERFUNCTION => function ($_, string $linha) use (&$cabecalhosResposta) {
                $p = strpos($linha, ':');
                if ($p !== false) {
                    $cabecalhosResposta[trim(substr($linha, 0, $p))] = trim(substr($linha, $p + 1));
                }
                return strlen($linha);
            },
        ]);

        if ($corpo !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $corpo);
        }

        $bruto = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $erro = curl_error($ch);
        curl_close($ch);

        if ($bruto === false) {
            // status 0 = não chegou a falar com o servidor. O cliente trata isso
            // como retryable, ao contrário de um 4xx.
            return new BlingResposta(0, ['erro' => $erro], $cabecalhosResposta, '');
        }

        $json = json_decode((string) $bruto, true);
        return new BlingResposta(
            $status,
            is_array($json) ? $json : ['bruto' => (string) $bruto],
            $cabecalhosResposta,
            (string) $bruto,
        );
    }
}

/**
 * Transporte de teste: devolve respostas programadas e GRAVA o que recebeu.
 *
 * Não é mock de conveniência — é o que permite provar retry, backoff,
 * paginação e renovação de token sem depender de rede nem de credencial.
 */
final class BlingTransporteFalso implements BlingTransporte
{
    /** @var array<int,array{metodo:string,url:string,opcoes:array}> */
    public array $chamadas = [];

    /** @var array<string,callable|BlingResposta|array<int,BlingResposta>> */
    private array $rotas = [];

    private ?BlingResposta $padrao = null;

    /**
     * Programa uma resposta. O padrão casa por SUBSTRING da URL — é o suficiente
     * para o teste e evita ter que reproduzir a query string exata.
     *
     * Passando um array de respostas, cada chamada consome a próxima: é assim
     * que se testa "falha, falha, funciona" e paginação.
     */
    public function responder(string $trechoUrl, BlingResposta|array|callable $resposta): self
    {
        $this->rotas[$trechoUrl] = $resposta;
        return $this;
    }

    public function padrao(BlingResposta $r): self
    {
        $this->padrao = $r;
        return $this;
    }

    public function enviar(string $metodo, string $url, array $opcoes = []): BlingResposta
    {
        $this->chamadas[] = ['metodo' => $metodo, 'url' => $url, 'opcoes' => $opcoes];

        foreach ($this->rotas as $trecho => $r) {
            if (!str_contains($url, $trecho)) {
                continue;
            }
            if (is_callable($r)) {
                return $r($metodo, $url, $opcoes);
            }
            if (is_array($r)) {
                // Fila: consome a próxima; a última se repete se acabar.
                $prox = array_shift($this->rotas[$trecho]);
                if ($this->rotas[$trecho] === []) {
                    $this->rotas[$trecho] = [$prox];
                }
                return $prox;
            }
            return $r;
        }

        return $this->padrao ?? new BlingResposta(404, ['erro' => 'rota não programada: ' . $url]);
    }

    /** Quantas vezes uma URL contendo o trecho foi chamada. */
    public function contar(string $trechoUrl): int
    {
        return count(array_filter($this->chamadas, static fn($c) => str_contains($c['url'], $trechoUrl)));
    }

    public function ultima(): ?array
    {
        return $this->chamadas === [] ? null : $this->chamadas[count($this->chamadas) - 1];
    }

    public function limpar(): void
    {
        $this->chamadas = [];
    }

    /**
     * Zera as ROTAS programadas.
     *
     * `responder()` casa por substring e o primeiro match vence. Reprogramar a
     * mesma rota com um trecho ligeiramente diferente (`/pedidos` vs
     * `pedidos/vendas`) deixa as duas ativas, e a antiga continua respondendo —
     * o teste passa a exercitar o cenário errado sem avisar. Limpar entre
     * blocos de teste evita isso.
     */
    public function limparRotas(): void
    {
        $this->rotas = [];
        $this->padrao = null;
    }
}
