<?php
// /sql/koala/cleanup-propostas-mock.php
// REVERSO do seed-propostas-mock.php. Remove SÓ as propostas de TESTE
// (prefixo "[TESTE]" no título) e seus filhos (items, versions, payment_terms),
// mais os snapshots mock ("[TESTE]%") e eventuais itens/categorias de catálogo
// "[TESTE]%". NÃO toca em nada real (só o que casa com o prefixo [TESTE]).
//
// Ordem respeita as FKs (RESTRICT, sem cascade):
//   proposal_items → proposal_versions → proposal_payment_terms → proposals → client_snapshots
//   depois catálogo [TESTE] (items → categories)
//
// Uso:  php /var/www/dshowdash/sql/koala/cleanup-propostas-mock.php
// @module koala.seed.cleanup-propostas-mock @version 1.0.0
declare(strict_types=1);

$b = '/var/www/dshowdash';
require_once $b . '/config/db_connection.php';
$pdo = getConnection('DSHOWDASH');

$LIKE = '[TESTE]%';

// contagem antes
$before = (int) $pdo->query("SELECT COUNT(*) FROM koala_proposals WHERE title LIKE '[TESTE]%'")->fetchColumn();
if ($before === 0) {
    echo "Nada a limpar: 0 propostas [TESTE].\n";
    exit(0);
}
echo "Encontradas $before propostas [TESTE]. Removendo (com filhos)...\n";

$pdo->beginTransaction();
try {
    // ids das propostas de teste + os snapshots que elas referenciam (a demo tem snapshot
    // com nome real, não [TESTE] — capturamos por FK, não por nome).
    $rowsIds = $pdo->query("SELECT id, client_snapshot_id FROM koala_proposals WHERE title LIKE '[TESTE]%'")
        ->fetchAll(\PDO::FETCH_ASSOC);
    $ids     = array_map(fn($r) => (int) $r['id'], $rowsIds);
    $snapIds = array_values(array_filter(array_map(fn($r) => (int) ($r['client_snapshot_id'] ?? 0), $rowsIds)));
    $in = implode(',', array_map('intval', $ids));
    $report = [];

    if ($in !== '') {
        // 1. filhos diretos da proposta (inclui despesas operacionais)
        $report['proposal_items'] = $pdo->exec("DELETE FROM koala_proposal_items WHERE proposal_id IN ($in)");
        $report['proposal_expenses'] = $pdo->exec("DELETE FROM koala_proposal_expenses WHERE proposal_id IN ($in)");
        $report['proposal_versions'] = $pdo->exec("DELETE FROM koala_proposal_versions WHERE proposal_id IN ($in)");
        $report['proposal_payment_terms'] = $pdo->exec("DELETE FROM koala_proposal_payment_terms WHERE proposal_id IN ($in)");
        // 2. as propostas (libera FK client_snapshot_id)
        $report['proposals'] = $pdo->exec("DELETE FROM koala_proposals WHERE id IN ($in)");
    }
    // 3a. snapshots referenciados pelas propostas [TESTE] (por id; contatos caem por FK CASCADE)
    if ($snapIds) {
        $sin = implode(',', array_map('intval', $snapIds));
        $report['client_snapshots_by_fk'] = $pdo->exec("DELETE FROM koala_client_snapshots WHERE id IN ($sin)");
    }
    // 3b. snapshots mock antigos (por nome [TESTE])
    $st = $pdo->prepare("DELETE FROM koala_client_snapshots WHERE client_name LIKE ?");
    $st->execute([$LIKE]);
    $report['client_snapshots'] = $st->rowCount();

    // 3c. formas de pagamento [TESTE] (agora sem vínculo referenciando)
    $st = $pdo->prepare("DELETE FROM koala_payment_methods WHERE name LIKE ?");
    $st->execute([$LIKE]);
    $report['payment_methods'] = $st->rowCount();

    // 4. catálogo [TESTE] (defensivo — o seed não cria, mas o contrato do cleanup cobre)
    $st = $pdo->prepare("DELETE FROM koala_items_catalog WHERE name LIKE ?");
    $st->execute([$LIKE]);
    $report['items_catalog'] = $st->rowCount();
    $st = $pdo->prepare("DELETE FROM koala_item_categories WHERE name LIKE ?");
    $st->execute([$LIKE]);
    $report['item_categories'] = $st->rowCount();

    $pdo->commit();
} catch (\Throwable $e) {
    if ($pdo->inTransaction()) { $pdo->rollBack(); }
    fwrite(STDERR, "ERRO no cleanup (rollback): " . $e->getMessage() . "\n");
    exit(2);
}

echo "Removido:\n";
foreach ($report as $tbl => $n) {
    echo "  - $tbl: $n\n";
}
$after = (int) $pdo->query("SELECT COUNT(*) FROM koala_proposals WHERE title LIKE '[TESTE]%'")->fetchColumn();
echo "Restam propostas [TESTE]: $after\n";
exit($after === 0 ? 0 : 1);
