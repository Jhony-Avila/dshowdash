<?php
declare(strict_types=1);

/**
 * api/avatar/AdminGate.php — autorização de ADMIN do catálogo (Expansão).
 * @version 1.0.0  @created 2026-07-30
 *
 * O dash ainda não tem modelo formal de papéis. Enquanto isso: allowlist
 * de user_ids em config/avatar_admin.php (NUNCA versionado — como todo
 * config/). FAIL-CLOSED: sem o arquivo, NINGUÉM é admin — os endpoints de
 * escrita simplesmente não funcionam até o operador criá-lo:
 *
 *   <?php return ['ids' => [75]];   // config/avatar_admin.php
 *
 * Quando o modelo de papéis nascer, só esta classe muda (fonte única).
 */
final class AdminGate
{
    public static function autorizado(int $userId): bool
    {
        $arquivo = __DIR__ . '/../../config/avatar_admin.php';
        if (!is_file($arquivo)) {
            return false; // fail-closed por construção
        }
        $cfg = require $arquivo;
        $ids = is_array($cfg) ? ($cfg['ids'] ?? []) : [];
        return in_array($userId, array_map('intval', (array) $ids), true);
    }
}
