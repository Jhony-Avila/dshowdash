<?php
// scripts/koala-expire-proposals.php — Job de expiração do Koala Docs (F4-E4).
// Marca 'expired' propostas sent/viewed com validade vencida. Idempotente. Conexão própria ao banco LOCAL.
// Uso (cron, como www-data): php /var/www/dshowdash/scripts/koala-expire-proposals.php
declare(strict_types=1);

$_SERVER['REQUEST_METHOD'] = 'CLI';
require __DIR__ . '/../api/koala/_init.php';

$started = date('c');
try {
    $pdo = getConnection('DSHOWDASH');
    $r = (new ExpirationService($pdo))->run();
    fwrite(STDOUT, "[$started] koala-expire: expiradas={$r['count']} ids=" . implode(',', $r['ids'])
        . " views_podadas=" . ($r['views_pruned'] ?? 0) . "\n");
    exit(0);
} catch (\Throwable $e) {
    fwrite(STDERR, "[$started] koala-expire FALHOU: " . $e->getMessage() . "\n");
    exit(1);
}
