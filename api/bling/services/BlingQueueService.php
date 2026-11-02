<?php
// Bling / services/BlingQueueService.php - fila com prioridade, backoff e DLQ
// @module  bling.service.queue
// @version 1.0.0
// @created 2026-07-30
//
// PRIORIDADE (§46/§47): webhook > interativo > carga.
// O webhook é o caminho reativo — se ficar atrás de uma carga inicial de 50 mil
// produtos, o "pedido novo" só aparece na tela no dia seguinte.
//
// DLQ: item que falha para sempre sai da fila. Sem isso ele gira eternamente,
// consumindo limite de API, e some do radar de quem deveria investigar.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class BlingQueueService
{
    public const PRIORIDADE_WEBHOOK  = 10;
    public const PRIORIDADE_INTERATIVO = 30;
    public const PRIORIDADE_CARGA    = 50;

    /**
     * @param BlingSyncService|null $sync null = só enfileira, não drena.
     *   É o caso do endpoint de webhook: ele responde em milissegundos e vai
     *   embora. Montar o BlingSyncService ali obrigaria a carregar cliente HTTP
     *   e OAuth para nada — e `drenar()` recusa explicitamente se for null.
     */
    public function __construct(
        private readonly BlingRepository $repo,
        private readonly ?BlingSyncService $sync = null,
    ) {}

    public function enfileirarWebhook(?int $accountId, string $recurso, ?string $referencia,
                                      array $payload, ?string $correlationId = null): int
    {
        return $this->repo->enfileirar($accountId, 'webhook', $recurso, $referencia,
            $payload, self::PRIORIDADE_WEBHOOK, $correlationId);
    }

    public function enfileirarSync(?int $accountId, string $recurso, string $estrategia,
                                   ?string $correlationId = null): int
    {
        return $this->repo->enfileirar($accountId, 'sync', $recurso, null,
            ['estrategia' => $estrategia],
            $estrategia === 'carga_inicial' ? self::PRIORIDADE_CARGA : self::PRIORIDADE_INTERATIVO,
            $correlationId);
    }

    /**
     * Drena a fila.
     *
     * `$maxItens` e `$maxSegundos` existem porque isto roda em cron de 1 em 1
     * minuto: sem teto, uma execução longa se sobrepõe à próxima e duas
     * instâncias competem pela mesma fila.
     *
     * @return array{processados:int,concluidos:int,reagendados:int,dlq:int,duracao_ms:int}
     */
    public function drenar(int $maxItens = 50, int $maxSegundos = 45): array
    {
        if ($this->sync === null) {
            // Instância criada só para enfileirar (endpoint de webhook). Drenar
            // aqui seria pior que inútil: seguraria a resposta ao Bling até a
            // sincronização terminar, e o timeout dele viraria reenvio.
            throw new LogicException(
                'BlingQueueService sem BlingSyncService não pode drenar a fila. '
                . 'Use o worker: scripts/bling-worker.php --modo=fila'
            );
        }

        $inicio = microtime(true);
        $r = ['processados' => 0, 'concluidos' => 0, 'reagendados' => 0, 'dlq' => 0, 'duracao_ms' => 0];

        while ($r['processados'] < $maxItens && (microtime(true) - $inicio) < $maxSegundos) {
            $item = $this->repo->proximoDaFila();
            if ($item === null) {
                break;
            }
            $r['processados']++;

            try {
                $this->processar($item);
                $this->repo->concluirDaFila((int) $item['id']);
                $r['concluidos']++;
            } catch (Throwable $e) {
                $destino = $this->repo->falharNaFila(
                    (int) $item['id'], $e->getMessage(),
                    (int) $item['tentativas'], (int) $item['max_tentativas'],
                );
                $r[$destino === 'dlq' ? 'dlq' : 'reagendados']++;

                $this->repo->registrarErroSync(
                    $item['account_id'] === null ? null : (int) $item['account_id'],
                    (string) $item['recurso'], $item['referencia'],
                    'FILA_' . strtoupper((string) $item['tipo']),
                    $e->getMessage(), null, (int) $item['tentativas'],
                    $item['correlation_id'],
                );
            }
        }

        $r['duracao_ms'] = (int) ((microtime(true) - $inicio) * 1000);
        return $r;
    }

    private function processar(array $item): void
    {
        $accountId = $item['account_id'] === null ? null : (int) $item['account_id'];
        if ($accountId === null) {
            throw new RuntimeException('Item da fila sem conta associada.');
        }

        $payload = $item['payload'] === null ? [] : (json_decode((string) $item['payload'], true) ?: []);

        match ((string) $item['tipo']) {
            // Webhook avisa QUE mudou, não O QUE mudou. Buscar o recurso é
            // deliberado (§46 passo 7): o payload do webhook é resumido e
            // confiar nele deixaria o banco com meia verdade.
            'webhook' => $this->sync->sincronizar(
                $accountId, (string) $item['recurso'], 'incremental', $item['correlation_id']),
            'sync', 'reconciliacao' => $this->sync->sincronizar(
                $accountId, (string) $item['recurso'],
                (string) ($payload['estrategia'] ?? 'incremental'), $item['correlation_id']),
            default => throw new RuntimeException('Tipo de item desconhecido: ' . $item['tipo']),
        };
    }

    /** Recoloca itens da DLQ na fila. Ação manual, auditada. */
    public function reprocessarDlq(?int $limite = 100, ?int $userId = null): int
    {
        $itens = $this->repo->consultar(
            "SELECT id FROM bling_queue WHERE situacao = 'dlq' ORDER BY id LIMIT " . max(1, (int) $limite)
        );
        if ($itens === []) {
            return 0;
        }
        $ids = array_column($itens, 'id');
        $marcadores = implode(',', array_fill(0, count($ids), '?'));

        $this->repo->pdo()->prepare(
            "UPDATE bling_queue
                SET situacao = 'pendente', tentativas = 0,
                    disponivel_em = UTC_TIMESTAMP(), ultimo_erro = NULL
              WHERE id IN ($marcadores)"
        )->execute($ids);

        $this->repo->auditar([
            'user_id' => $userId, 'acao' => 'fila.reprocessar_dlq',
            'entidade' => 'bling_queue', 'detalhe' => count($ids) . ' item(ns)',
        ]);
        return count($ids);
    }

    public function resumo(): array
    {
        return $this->repo->resumoFila();
    }
}
