<?php
// Bling / controllers/WebhookController.php - recepcao de webhook do Bling
// @module  bling.controller.webhook
// @version 1.0.0
// @created 2026-07-30
//
// ESTE É O ÚNICO ENDPOINT DO MÓDULO SEM SESSÃO E SEM CSRF.
// Quem chama é o Bling, um servidor externo: não tem cookie, não tem token de
// sessão, não pode ter. O que o autentica é a ASSINATURA HMAC do corpo.
//
// Consequência: tudo aqui parte do princípio de que a requisição é hostil até a
// assinatura provar o contrário. Nada é gravado, enfileirado ou logado com dado
// da requisição antes da verificação.
//
// §46: responder RÁPIDO (2xx) e processar depois, pela fila. Um webhook que
// espera a sincronização terminar estoura o timeout do Bling, que reenvia, e o
// reenvio dobra o trabalho — a espiral clássica.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class BlingWebhookController
{
    /** Corpo maior que isto não é webhook legítimo — é tentativa de exaustão. */
    private const LIMITE_CORPO = 1048576;   // 1 MB

    /** POST /webhooks */
    public static function receber(): void
    {
        // Resposta sempre JSON e sempre sem cache.
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');

        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
            self::responder(405, ['erro' => 'metodo_nao_permitido']);
        }

        $tamanho = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
        if ($tamanho > self::LIMITE_CORPO) {
            self::responder(413, ['erro' => 'corpo_grande_demais']);
        }

        $corpo = file_get_contents('php://input', false, null, 0, self::LIMITE_CORPO + 1);
        if ($corpo === false) { $corpo = ''; }
        if (strlen($corpo) > self::LIMITE_CORPO) {
            self::responder(413, ['erro' => 'corpo_grande_demais']);
        }

        $repo = new BlingRepository();

        // Sem banco não há como registrar a entrega nem garantir idempotência.
        // 503 é a resposta certa: diz ao Bling "tente de novo", em vez de 200,
        // que o faria descartar um evento que nunca foi processado.
        if (!$repo->disponivel() || !$repo->schemaAplicado()) {
            error_log('[bling.webhook] banco indisponível — recusando com 503 para o Bling reenviar');
            self::responder(503, ['erro' => 'indisponivel']);
        }

        try {
            $fila = new BlingQueueService($repo, null);
            $servico = new BlingWebhookService($repo, $fila);

            $r = $servico->receber($corpo, self::cabecalhos());

            if (!$r['aceito']) {
                // 400 sem detalhe: o motivo vai para o log interno. Detalhar a
                // recusa para quem chama ajudaria a calibrar uma forja.
                error_log('[bling.webhook] recusado: ' . (string) ($r['motivo'] ?? '?'));
                self::responder(400, ['erro' => 'recusado']);
            }

            // Duplicado TAMBÉM é 200. Do ponto de vista do Bling a entrega deu
            // certo — e é o que impede o reenvio em laço.
            self::responder(200, [
                'ok' => true,
                'duplicado' => (bool) $r['duplicado'],
            ]);

        } catch (Throwable $e) {
            // 500 faz o Bling reenviar, que é o comportamento desejado diante de
            // uma falha nossa. A exceção fica no log, não na resposta.
            error_log('[bling.webhook] ' . $e->getMessage()
                . ' @ ' . basename($e->getFile()) . ':' . $e->getLine());
            self::responder(500, ['erro' => 'falha_interna']);
        }
    }

    /**
     * Cabeçalhos da requisição, normalizados.
     * `getallheaders()` não existe em toda instalação PHP-FPM.
     * @return array<string,string>
     */
    private static function cabecalhos(): array
    {
        if (function_exists('getallheaders')) {
            $h = getallheaders();
            return is_array($h) ? $h : [];
        }
        $saida = [];
        foreach ($_SERVER as $k => $v) {
            if (str_starts_with((string) $k, 'HTTP_')) {
                $nome = str_replace(' ', '-',
                    ucwords(strtolower(str_replace('_', ' ', substr((string) $k, 5)))));
                $saida[$nome] = (string) $v;
            }
        }
        return $saida;
    }

    /** @param array<string,mixed> $dados */
    private static function responder(int $status, array $dados): never
    {
        // ⚠️ Não usa ApiResponse de propósito.
        // O envelope `{ok,data,error}` é o contrato com o NOSSO front-end. O
        // Bling só olha o código HTTP; devolver o envelope aqui misturaria dois
        // contratos e convidaria alguém a reusar este endpoint como se fosse
        // interno — sem sessão e sem CSRF, que é exatamente o que ele não é.
        http_response_code($status);
        echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
