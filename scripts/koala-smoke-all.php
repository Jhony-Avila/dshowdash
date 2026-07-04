<?php
// scripts/koala-smoke-all.php
// RUNNER DE REGRESSÃO do Koala Docs (consolidação 2026-07-04, Fase 1.7c).
// Roda toda a suíte determinística numa chamada, PASS/FAIL por bloco, exit 0=tudo ok / 1=falha.
// NÃO polui o banco: os blocos que escrevem rodam em transação e fazem ROLLBACK.
// O bloco de lockout que dá exit (ApiResponse::error) é testado à parte pelo wrapper .sh.
declare(strict_types=1);
$_SERVER['REQUEST_METHOD'] = 'CLI';
require '/var/www/dshowdash/api/koala/_init.php';

$FAIL = 0; $N = 0;
function ok(bool $c, string $m): void {
    global $FAIL, $N; $N++;
    echo ($c ? "  [PASS] " : "  [FAIL] ") . $m . "\n";
    if (!$c) { $FAIL++; }
}
function head(string $s): void { echo "\n== $s ==\n"; }

$pdo = getConnection('DSHOWDASH');

// ───────────────────────── BLOCO 1: PRICING (puro) ─────────────────────────
head('pricing (PricingCalculationService)');
$c = PricingCalculationService::computeItem(['quantity' => 10, 'unit_price' => 100]);
ok($c['subtotal'] === 1000.0, "10x100 sem desconto = 1000 (got {$c['subtotal']})");
$c = PricingCalculationService::computeItem(['quantity' => 10, 'unit_price' => 100, 'discount_value' => 200]);
ok($c['subtotal'] === 800.0, "desconto valor 200 -> 800 (got {$c['subtotal']})");
$c = PricingCalculationService::computeItem(['quantity' => 10, 'unit_price' => 100, 'discount_percent' => 10]);
ok($c['subtotal'] === 900.0, "desconto 10% -> 900 (got {$c['subtotal']})");
$c = PricingCalculationService::computeItem(['quantity' => 10, 'unit_price' => 100, 'discount_value' => 5000]);
ok($c['subtotal'] === 0.0 && $c['discount'] === 1000.0, "desconto > bruto capado no bruto -> 0 (got {$c['subtotal']})");
$c = PricingCalculationService::computeItem(['quantity' => 3, 'unit_price' => 33.33]);
ok($c['base'] === 99.99, "arredondamento 2 casas 3x33.33 = 99.99 (got {$c['base']})");
$t = PricingCalculationService::computeTotals(
    [['quantity' => 2, 'unit_price' => 1000]], 100, 0, 0,
    [['quantity' => 1, 'unit_price' => 250]], 350, null
);
ok($t['total_net'] === 2000.0 && $t['total_expenses'] === 250.0 && $t['total_final'] === 2000.0,
    "totais: net2000+exp250+frete100-desc350 = 2000 (got {$t['total_final']})");
$t = PricingCalculationService::computeTotals(
    [['quantity' => 2, 'unit_price' => 1000]], 100, 0, 0,
    [['quantity' => 1, 'unit_price' => 250]], null, 10
);
ok($t['total_final'] === 2115.0, "desconto proposta 10% sobre 2350 -> 2115 (got {$t['total_final']})");

// ─────────────────── BLOCO 2: LINE-TX (item/despesa/snapshot) ───────────────────
head('line-tx (item/despesa/snapshot em transação, rollback)');
$koala = (new AuthKoalaService($pdo))->provisionAndGet(75, 'jhony', 'jhony@dshow.com.br');
$pdo->beginTransaction();
try {
    $prop = (new ProposalService($pdo))->create($koala, ['title' => '[SMOKE] apagar', 'currency' => 'BRL']);
    $pid = (int) $prop['id'];
    $itemSvc = new ProposalItemService($pdo);
    $r = $itemSvc->addManual($koala, $pid, ['description' => 'Item', 'quantity' => 10, 'unit_price' => 100]);
    ok((float) $r['totals']['total_net'] === 1000.0, "addManual net=1000 (got {$r['totals']['total_net']})");
    $iid = (int) $r['item']['id'];
    $r = $itemSvc->update($koala, $pid, $iid, ['quantity' => 5]);
    ok((float) $r['totals']['total_net'] === 500.0, "update qty5 net=500 (got {$r['totals']['total_net']})");
    $expSvc = new ProposalExpenseService($pdo);
    $r = $expSvc->add($koala, $pid, ['description' => 'Despesa', 'quantity' => 1, 'unit_price' => 250]);
    ok((float) $r['totals']['total_final'] === 750.0, "expense -> total_final=750 (got {$r['totals']['total_final']})");
    $eid = (int) $r['expense']['id'];
    $lst = $itemSvc->reorder($koala, $pid, [$iid]);
    ok(count($lst) === 1, "reorder ok");
    $blk = (new SnapshotService($pdo))->updateClient($koala, $pid, ['client_name' => 'Cli', 'document_type' => 'CNPJ']);
    ok(($blk['snapshot']['client_name'] ?? '') === 'Cli', "updateClient (ensureSnapshot aninhado) ok");
    $ct = (new SnapshotService($pdo))->addContact($koala, $pid, ['contact_type' => 'email', 'contact_value' => 'a@b.com']);
    ok(count($ct['contacts']) === 1, "addContact ok");
    $r = $itemSvc->remove($koala, $pid, $iid);
    ok((float) $r['totals']['total_final'] === 250.0, "remove item -> 250 (got {$r['totals']['total_final']})");
    $r = $expSvc->remove($koala, $pid, $eid);
    ok((float) $r['totals']['total_final'] === 0.0, "remove expense -> 0 (got {$r['totals']['total_final']})");
    ok($pdo->inTransaction(), "KoalaTx participou da tx externa (nunca commitou)");
} finally { $pdo->rollBack(); }

// ─────────────────── BLOCO 3: ADMIN LOCKOUT (allow path) ───────────────────
head('admin-lockout (allow path; block path no wrapper .sh)');
$svc = new UserAdminService($pdo);
$fkUser = (int) $pdo->query("SELECT id FROM app_users WHERE deleted_at IS NULL AND id NOT IN (SELECT system_user_id FROM koala_users) LIMIT 1")->fetchColumn();
if ($fkUser > 0) {
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("INSERT INTO koala_users (system_user_id, name, email, role, is_active) VALUES (?, 'TMP', 'tmp@x.test', 'admin', 1)");
        $stmt->execute([$fkUser]);
        $res = $svc->updateRole(1, 'seller');   // 2 admins -> permitido
        ok(($res['role'] ?? '') === 'seller', "com 2 admins, rebaixar id1 permitido");
    } finally { $pdo->rollBack(); }
    ok(((new KoalaUserRepository($pdo))->findById(1)['role'] ?? '') === 'admin', "rollback: id1 volta a admin");
} else {
    ok(false, "sem app_users livre p/ testar allow (SKIP tratado como falha p/ visibilidade)");
}

// ─────────────────── BLOCO 4: INTEGRIDADE (read-only) ───────────────────
head('integridade (órfãos / soft-delete)');
$q = fn(string $sql) => (int) $pdo->query($sql)->fetchColumn();
ok($q("SELECT COUNT(*) FROM koala_proposal_items i LEFT JOIN koala_proposals p ON p.id=i.proposal_id WHERE p.id IS NULL") === 0, "0 itens órfãos");
ok($q("SELECT COUNT(*) FROM koala_proposal_expenses e LEFT JOIN koala_proposals p ON p.id=e.proposal_id WHERE p.id IS NULL") === 0, "0 despesas órfãs");
ok($q("SELECT COUNT(*) FROM koala_client_snapshot_contacts c LEFT JOIN koala_client_snapshots s ON s.id=c.snapshot_id WHERE s.id IS NULL") === 0, "0 contatos órfãos");
ok($q("SELECT COUNT(*) FROM koala_proposal_payment_terms t LEFT JOIN koala_proposals p ON p.id=t.proposal_id WHERE p.id IS NULL") === 0, "0 payment_terms órfãos");

// ─────────────────── BLOCO 5: R6 FINGERPRINT ───────────────────
head('R6 fingerprint (dados do dono imutáveis)');
ok($q("SELECT COUNT(*) FROM koala_proposals WHERE deleted_at IS NULL") === 10, "10 propostas");
ok($q("SELECT COUNT(*) FROM koala_proposal_items WHERE deleted_at IS NULL") === 22, "22 itens");
ok($q("SELECT COUNT(*) FROM koala_proposal_expenses WHERE deleted_at IS NULL") === 3, "3 despesas");
ok($q("SELECT COUNT(*) FROM koala_sections_catalog WHERE deleted_at IS NULL") === 38, "38 seções");
$sum = (string) $pdo->query("SELECT CAST(SUM(total_final) AS DECIMAL(14,2)) FROM koala_proposals WHERE deleted_at IS NULL")->fetchColumn();
ok($sum === '473918.70', "SUM(total_final) = 473918.70 (got $sum)");

echo "\n──────────────────────────────\n";
echo ($FAIL === 0 ? "RESULTADO: TODOS OS $N PASSARAM\n" : "RESULTADO: $FAIL de $N FALHARAM\n");
exit($FAIL === 0 ? 0 : 1);
