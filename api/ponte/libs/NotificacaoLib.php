<?php
declare(strict_types=1);

/**
 * /api/ponte/libs/NotificacaoLib.php — escrita em app_notifications compartilhada entre /api/notifications/index.php (sessão web)
 * e a Ponte v2 (Programa PARIDADE TOTAL, W1). MOVIMENTO TEXTUAL de index.php v2.3.0: as três SQL são as mesmas byte a byte
 * (PATCH ?action=read&id=all, PATCH ?action=read&id=N, DELETE ?id=N); a posse é a cláusula `user_id = ?` original.
 * Prova: scripts/ponte/testes/libs-equivalencia.php. Nenhuma regra nova: quem valida o id e responde continua sendo o endpoint/ponte.
 */

function notificacao_marcar_todas(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare("UPDATE app_notifications SET is_read = 1, read_at = NOW(3) WHERE user_id = ? AND is_read = 0");
    $stmt->execute([$userId]);
    return ['marked' => $stmt->rowCount()];
}

function notificacao_marcar_lida(PDO $pdo, int $userId, int $notificationId): array
{
    $stmt = $pdo->prepare("UPDATE app_notifications SET is_read = 1, read_at = NOW(3) WHERE id = ? AND user_id = ?");
    $stmt->execute([$notificationId, $userId]);
    return ['marked' => $stmt->rowCount() > 0];
}

function notificacao_excluir(PDO $pdo, int $userId, int $notificationId): array
{
    $stmt = $pdo->prepare("DELETE FROM app_notifications WHERE id = ? AND user_id = ?");
    $stmt->execute([$notificationId, $userId]);
    return ['deleted' => $stmt->rowCount() > 0];
}
