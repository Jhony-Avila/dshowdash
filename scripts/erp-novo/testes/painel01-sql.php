<?php
// ERP novo — TODAS as consultas do painel 01 executadas pela camada NOVA contra um MySQL de TESTE (AZUL, 26/11 noite).
// Extrai as funções de api/modules/panels/panel-01/api.php (as MESMAS que rodam na produção) e chama cada uma com um PDO de teste.
// Só roda com ERP_NOVO_TESTE=1 + DB_ERP_NOVO_CNF/HOST/NAME apontando para um banco de TESTE (nunca o RDS). Sem isso, sai 0 com "pulado".
// Uso: ERP_NOVO_TESTE=1 DB_ERP_NOVO_CNF=… DB_ERP_NOVO_HOST=127.0.0.1 DB_ERP_NOVO_NAME=<banco de teste> php painel01-sql.php
declare(strict_types=1);
if (getenv('ERP_NOVO_TESTE') !== '1' || !preg_match('/^(127\.0\.0\.1|localhost)$/', (string)getenv('DB_ERP_NOVO_HOST'))) { echo "[PULADO] painel01-sql: precisa de ERP_NOVO_TESTE=1 e banco de teste LOCAL\n"; exit(0); }
$raiz = realpath(__DIR__ . '/../../..');
require $raiz . '/api/_helpers/ErpNovo.php';
require $raiz . '/api/core/helpers/InputValidator.php';
require $raiz . '/api/modules/panels/_erp-compat-novo.php';
$src = file_get_contents($raiz . '/api/modules/panels/panel-01/api.php');
$ini = strpos($src, 'function getKPIs('); $fim = strpos($src, 'function exportCSV(');
if ($ini === false || $fim === false) { echo "[ERRO] painel01-sql: funções do painel 01 não encontradas\n"; exit(1); }
eval(substr($src, $ini, $fim - $ini));
$pdo = erp_novo_pdo();
$v = static fn (array $q): InputValidator => new InputValidator($q);
$casos = [
    'kpis' => static fn () => getKPIs($pdo),
    'lista' => static fn () => getRequisicoesList($pdo, $v([])),
    'lista filtrada (situação 1306, página 1)' => static fn () => getRequisicoesList($pdo, $v(['situacao' => '1306', 'page' => '1', 'limit' => '20'])),
    'detalhe 360' => static fn () => getRequisicao360($pdo, 1),
    'situações' => static fn () => getSituacoes($pdo),
    'centros' => static fn () => getCentrosCusto($pdo),
    'categorias' => static fn () => getCategorias($pdo),
    'fornecedores' => static fn () => getFornecedores($pdo),
    'busca' => static fn () => searchRequisicoes($pdo, $v(['q' => 'r1'])),
    'resumo mensal' => static fn () => getResumoMensal($pdo),
    'top fornecedores' => static fn () => getTopFornecedores($pdo, 10),
    'top categorias' => static fn () => getTopCategorias($pdo),
];
$f = 0;
foreach ($casos as $nome => $fn) {
    try { $r = $fn(); $ok = is_array($r) && ($r['ok'] ?? true) !== false; }
    catch (Throwable $e) { $ok = false; $r = ['erro' => get_class($e) . ': ' . substr($e->getMessage(), 0, 160)]; }
    if (!$ok) { $f++; }
    echo ($ok ? '[OK]   ' : '[ERRO] ') . "painel01 $nome" . ($ok ? '' : ' · ' . json_encode($r, JSON_UNESCAPED_UNICODE)) . "\n";
}
// conferências de conteúdo (sem dado real: o banco de teste é sintético)
$det = getRequisicao360($pdo, 1)['data'] ?? [];
$midias = $det['midias'] ?? [];
if ($midias && array_filter($midias, static fn ($m) => ($m['url'] ?? null) !== null)) { echo "[ERRO] painel01 anexo expõe a chave do S3 como url\n"; $f++; }
else { echo "[OK]   painel01 anexo sem url (chave do S3 não sai)\n"; }
exit($f ? 1 : 0);
