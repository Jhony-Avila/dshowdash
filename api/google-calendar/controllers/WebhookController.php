<?php
// Google Calendar / WebhookController - notificacoes push do Google (§50)
// @version 1.0.0  @created 2026-07-30
//
// ENDPOINT PUBLICO. Nao tem sessao nem CSRF — quem chama e o Google, nao um
// navegador logado. A autenticacao e a tripla channel_id + resource_id + token,
// conferida contra `gcal_watch_channels`.
//
// Duas regras que definem tudo aqui:
//
// 1. RESPONDER RAPIDO E SEMPRE 200 quando a chamada for legitima. Se demorar ou
//    devolver erro, o Google faz backoff e depois PARA de enviar. A agenda
//    passa a atrasar sem nada quebrar visivelmente — o pior tipo de falha.
//    Entao aqui so se enfileira; quem trabalha e o worker.
//
// 2. A NOTIFICACAO E UM SINAL, NAO UM DADO. Ela nao diz o que mudou. O corpo do
//    POST e ignorado de proposito: confiar nele e o erro classico desta API.
declare(strict_types=1);

final class GcalWebhookController
{
    /** POST /webhook */
    public static function receber(): void
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');

        $h = static function (string $nome): string {
            $k = 'HTTP_' . strtoupper(str_replace('-', '_', $nome));
            $v = $_SERVER[$k] ?? '';
            return is_string($v) ? trim($v) : '';
        };

        $canalId  = $h('X-Goog-Channel-ID');
        $token    = $h('X-Goog-Channel-Token');
        $recurso  = $h('X-Goog-Resource-ID');
        $estado   = $h('X-Goog-Resource-State');

        if ($canalId === '' || $recurso === '') {
            self::fim(400, ['erro' => 'cabeçalhos ausentes']);
        }

        try {
            $repo = new GcalRepository();
            $canal = $repo->canalAtivo($canalId);
        } catch (\Throwable $e) {
            // Banco fora do ar: 500 faz o Google TENTAR DE NOVO, que é o
            // comportamento certo — a mudança não pode simplesmente sumir.
            error_log('[gcal] webhook sem banco: ' . $e->getMessage());
            self::fim(500, ['erro' => 'indisponível']);
        }

        // Canal desconhecido ou já parado: 200, não 404. O Google trata 404
        // como "endereço ruim" e pode derrubar OUTROS canais do mesmo host;
        // além disso, notificação de canal recém-parado é normal, não é ataque.
        if ($canal === null) {
            self::fim(200, ['ignorado' => 'canal desconhecido']);
        }

        // hash_equals: comparação em tempo constante. Um `!==` aqui vaza o
        // token por tempo de resposta, e este token é o que autoriza enfileirar
        // trabalho em nome de uma conta.
        if (!hash_equals((string)$canal['token'], $token)
            || !hash_equals((string)$canal['resource_id'], $recurso)) {
            error_log('[gcal] webhook com credencial inválida no canal ' . $canalId);
            self::fim(403, ['erro' => 'credencial inválida']);
        }

        // `sync` é o ping de confirmação que o Google manda ao ABRIR o canal.
        // Não houve mudança nenhuma; sincronizar aqui gastaria uma chamada de
        // API a cada abertura e renovação de canal.
        if ($estado === 'sync') {
            self::fim(200, ['ok' => true, 'estado' => 'sync']);
        }

        try {
            // Pequeno atraso de propósito: uma edição em lote na agenda vira
            // dezenas de POSTs em segundos. Esperar 10 s deixa a deduplicação
            // da fila juntar tudo num único incremental.
            $repo->enfileirar((int)$canal['account_id'], (string)$canal['calendar_id'],
                              'incremental', ['origem' => 'webhook'], 10, 1);
        } catch (\Throwable $e) {
            error_log('[gcal] webhook não conseguiu enfileirar: ' . $e->getMessage());
            self::fim(500, ['erro' => 'fila indisponível']);
        }

        self::fim(200, ['ok' => true, 'enfileirado' => true]);
    }

    /** @return never */
    private static function fim(int $status, array $corpo): void
    {
        http_response_code($status);
        echo json_encode($corpo, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
