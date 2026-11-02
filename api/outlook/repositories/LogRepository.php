<?php
// Outlook / LogRepository - logs tecnicos minimos (outlook_technical_logs)
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// §26.3: registra eventos de seguranca/diagnostico (conexao, desconexao, falha OAuth,
// falha sync, falha envio, webhook, upload, refresh de token). NUNCA registra corpo,
// assunto, remetente, destinatarios ou anexos. metadata_json aceita apenas metadados
// nao sensiveis (status HTTP, endpoint, codigo de erro).
declare(strict_types=1);

final class OutlookLogRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function log(
        string $eventType,
        string $severity = 'info',
        ?int $userId = null,
        ?int $accountId = null,
        ?string $errorCode = null,
        ?string $message = null,
        ?array $metadata = null
    ): void {
        try {
            $st = $this->pdo->prepare(
                "INSERT INTO outlook_technical_logs
                   (user_id, outlook_account_id, event_type, severity, request_reference,
                    error_code, message, metadata_json)
                 VALUES (:uid, :acc, :evt, :sev, :ref, :ec, :msg, :meta)"
            );
            $st->execute([
                ':uid'  => $userId,
                ':acc'  => $accountId,
                ':evt'  => mb_substr($eventType, 0, 64),
                ':sev'  => in_array($severity, ['info', 'warning', 'error'], true) ? $severity : 'info',
                ':ref'  => bin2hex(random_bytes(8)),
                ':ec'   => $errorCode !== null ? mb_substr($errorCode, 0, 64) : null,
                ':msg'  => $message !== null ? mb_substr($message, 0, 512) : null,
                ':meta' => $metadata !== null ? json_encode(OutlookCrypto::scrub($metadata), JSON_UNESCAPED_UNICODE) : null,
            ]);
        } catch (\Throwable $e) {
            error_log('[outlook] log falhou: ' . $e->getMessage());
        }
    }

    public function info(string $evt, ?int $uid = null, ?int $acc = null, ?string $msg = null, ?array $meta = null): void
    {
        $this->log($evt, 'info', $uid, $acc, null, $msg, $meta);
    }

    public function error(string $evt, ?int $uid = null, ?int $acc = null, ?string $code = null, ?string $msg = null, ?array $meta = null): void
    {
        $this->log($evt, 'error', $uid, $acc, $code, $msg, $meta);
    }
}
