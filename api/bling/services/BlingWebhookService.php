<?php
// Bling / services/BlingWebhookService.php - recepcao idempotente de webhooks
// @module  bling.service.webhook
// @version 1.0.0
// @created 2026-07-30
//
// FLUXO DO §46, na ordem que importa:
//   1 receber · 2 validar · 3 registrar · 4 RESPONDER RÁPIDO
//   5 enfileirar · 6 processar · 7 buscar detalhes · 8 gravar
//   9 evento interno · 10 registrar resultado
//
// Os passos 1–5 acontecem AQUI, dentro da requisição HTTP, e precisam ser
// rápidos. Processar de forma síncrona faria o Bling receber timeout e reenviar
// — multiplicando a carga exatamente no momento em que ela já está alta.
//
// IDEMPOTÊNCIA é a espinha: reentrega é normal em webhook, não excepcional.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class BlingWebhookService
{
    public function __construct(
        private readonly BlingRepository $repo,
        private readonly BlingQueueService $fila,
    ) {}

    /**
     * Recebe uma entrega.
     * @return array{aceito:bool,duplicado:bool,webhook_id:?int,fila_id:?int,motivo:?string}
     */
    public function receber(string $corpoBruto, array $cabecalhos, ?string $correlationId = null): array
    {
        $inicio = microtime(true);

        $payload = json_decode($corpoBruto, true);
        if (!is_array($payload)) {
            return $this->recusar('Corpo não é JSON válido.');
        }

        $evento = (string) ($payload['event'] ?? $payload['evento'] ?? $payload['tipo'] ?? '');
        if ($evento === '') {
            return $this->recusar('Payload sem identificação de evento.');
        }

        $blingId = self::extrairId($payload);
        $assinaturaOk = $this->assinaturaValida($corpoBruto, $cabecalhos);

        // ⚠️ SEM ASSINATURA VÁLIDA, RECUSA. SEMPRE.
        //
        // A versão anterior aceitava quando o segredo não estava configurado,
        // com o argumento de que seria "o estado até o dono configurar". Isso é
        // fail open num endpoint que fica exposto na internet aberta, sem
        // sessão e sem CSRF: qualquer pessoa poderia enfileirar sincronização à
        // vontade e consumir o limite diário da API. A prova HTTP flagrou —
        // POST anônimo respondia 200 e entrava na fila.
        //
        // Sem segredo o webhook fica DESLIGADO, e isso aparece em /status. Não
        // se perde dado: o incremental de 15 min e a reconciliação diária já
        // cobrem tudo que o webhook adiantaria.
        if (!$assinaturaOk) {
            // ⚠️ A recusa NÃO pode ocupar a chave de idempotência da entrega
            // legítima. Se ocupasse, bastaria mandar o payload forjado antes do
            // Bling para que a entrega verdadeira fosse descartada como
            // "duplicada" — negação de serviço a custo zero para o atacante.
            //
            // Prefixo `rej:` isola o espaço: tentativas forjadas idênticas ainda
            // deduplicam entre si (não inundam a tabela), mas nunca colidem com
            // a entrega válida.
            $this->repo->registrarWebhook(null, $evento, $blingId,
                'rej:' . md5(self::chaveIdempotencia($evento, $blingId, $corpoBruto)),
                false, $correlationId);
            return $this->recusar(self::segredo() === ''
                ? 'Webhook desligado: BLING_WEBHOOK_SECRET não configurado.'
                : 'Assinatura do webhook inválida.');
        }

        $chave = self::chaveIdempotencia($evento, $blingId, $corpoBruto);
        $accountId = $this->resolverConta($payload);

        // null = já recebemos esta MESMA entrega antes.
        $webhookId = $this->repo->registrarWebhook($accountId, $evento, $blingId, $chave,
            $assinaturaOk, $correlationId);

        if ($webhookId === null) {
            return ['aceito' => true, 'duplicado' => true, 'webhook_id' => null,
                    'fila_id' => null, 'motivo' => 'Entrega já processada anteriormente.'];
        }

        // Payload cru guardado para investigação — nunca devolvido ao cliente.
        $this->repo->guardarPayload($accountId, 'webhook', $blingId, $payload, 'webhook', 15);

        $recurso = self::recursoDoEvento($evento);
        $filaId = null;

        if ($recurso !== null && $accountId !== null) {
            $filaId = $this->fila->enfileirarWebhook($accountId, $recurso, $blingId, $payload, $correlationId);
            $this->repo->atualizarWebhook($webhookId, 'na_fila', null,
                (int) ((microtime(true) - $inicio) * 1000));
        } else {
            // Evento que não sabemos mapear não é erro: pode ser um tipo novo.
            // Fica registrado para virar tarefa, sem travar a entrega.
            $this->repo->atualizarWebhook($webhookId, 'processado',
                $recurso === null ? "Evento sem recurso mapeado: $evento"
                                  : 'Conta não identificada no payload.',
                (int) ((microtime(true) - $inicio) * 1000));
        }

        return ['aceito' => true, 'duplicado' => false, 'webhook_id' => $webhookId,
                'fila_id' => $filaId, 'motivo' => null];
    }

    // ─────────────────────────────────────────────────────────────

    public static function segredo(): string
    {
        return trim((string) (getenv('BLING_WEBHOOK_SECRET')
            ?: ($_ENV['BLING_WEBHOOK_SECRET'] ?? '')));
    }

    /**
     * HMAC-SHA256 do corpo cru.
     *
     * `hash_equals` e não `===`: comparação de string comum vaza informação
     * pelo tempo de execução e permite descobrir a assinatura byte a byte.
     */
    private function assinaturaValida(string $corpo, array $cabecalhos): bool
    {
        $segredo = self::segredo();
        if ($segredo === '') {
            return false;
        }

        $recebida = '';
        foreach ($cabecalhos as $k => $v) {
            if (in_array(strtolower((string) $k), [
                'x-bling-signature', 'x-hub-signature-256', 'x-signature'], true)) {
                $recebida = is_array($v) ? (string) reset($v) : (string) $v;
                break;
            }
        }
        if ($recebida === '') {
            return false;
        }

        $recebida = preg_replace('/^sha256=/i', '', trim($recebida)) ?? $recebida;
        return hash_equals(hash_hmac('sha256', $corpo, $segredo), $recebida);
    }

    /**
     * Chave de idempotência.
     *
     * Inclui o HASH DO CORPO de propósito: se o Bling reenviar o MESMO evento
     * do MESMO recurso com conteúdo diferente (uma segunda alteração), é uma
     * entrega nova e precisa ser processada. Só evento+id descartaria a
     * segunda mudança.
     */
    public static function chaveIdempotencia(string $evento, ?string $blingId, string $corpo): string
    {
        return hash('sha256', $evento . '|' . ($blingId ?? '') . '|' . md5($corpo));
    }

    private static function extrairId(array $p): ?string
    {
        foreach (['id', 'data.id', 'retorno.id', 'objeto.id', 'resourceId'] as $caminho) {
            $atual = $p;
            foreach (explode('.', $caminho) as $parte) {
                if (!is_array($atual) || !array_key_exists($parte, $atual)) {
                    $atual = null;
                    break;
                }
                $atual = $atual[$parte];
            }
            if ($atual !== null && is_scalar($atual)) {
                return (string) $atual;
            }
        }
        return null;
    }

    /** Evento do Bling → recurso do sincronizador. */
    public static function recursoDoEvento(string $evento): ?string
    {
        $e = strtolower($evento);
        return match (true) {
            str_contains($e, 'order') || str_contains($e, 'pedido.venda') ||
            str_contains($e, 'pedidovenda')                        => 'pedidos',
            str_contains($e, 'purchase') || str_contains($e, 'compra') => 'compras',
            str_contains($e, 'invoice') || str_contains($e, 'nfe') ||
            str_contains($e, 'nota')                               => 'notas',
            str_contains($e, 'product') || str_contains($e, 'produto') => 'produtos',
            str_contains($e, 'stock') || str_contains($e, 'estoque') => 'estoque',
            str_contains($e, 'contact') || str_contains($e, 'contato') => 'contatos',
            str_contains($e, 'receivable') || str_contains($e, 'receber') => 'receber',
            str_contains($e, 'payable') || str_contains($e, 'pagar')  => 'pagar',
            default => null,
        };
    }

    /**
     * Conta do payload, com a padrão como fallback.
     *
     * O fallback é aceitável enquanto existe UMA conta. Com várias, um webhook
     * sem identificação seria gravado na conta errada — por isso, com mais de
     * uma conta ativa e sem identificação, devolve null e o evento fica
     * registrado sem processar, visível na tela.
     */
    private function resolverConta(array $payload): ?int
    {
        $cnpj = preg_replace('/\D/', '', (string) ($payload['companyId'] ?? $payload['cnpj'] ?? ''));
        if ($cnpj !== '') {
            $id = $this->repo->valor('SELECT id FROM bling_accounts WHERE cnpj = ?', [$cnpj]);
            if ($id !== false && $id !== null) {
                return (int) $id;
            }
        }

        $ativas = $this->repo->contas(true);
        if (count($ativas) === 1) {
            return (int) $ativas[0]['id'];
        }
        return null;
    }

    private function recusar(string $motivo): array
    {
        return ['aceito' => false, 'duplicado' => false, 'webhook_id' => null,
                'fila_id' => null, 'motivo' => $motivo];
    }
}
