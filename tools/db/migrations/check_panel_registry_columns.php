<?php
// Verifica quais colunas ja existem antes de rodar a migration
require_once '/var/www/dshowdash/config/db_connection.php';

$pdo = getConnection('DSHOWDASH');
$stmt = $pdo->query("DESCRIBE panel_registry");
$columns = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'Field');

$required = ['thumbnail_path', 'thumbnail_updated_at', 'tags', 'version', 'author'];
foreach ($required as $col) {
    $exists = in_array($col, $columns) ? 'JA EXISTE' : 'PRECISA CRIAR';
    echo "  $col: $exists\n";
}

// Verificar tabela panel_screenshots
$stmt = $pdo->query("SHOW TABLES LIKE 'panel_screenshots'");
$tableExists = $stmt->rowCount() > 0 ? 'JA EXISTE' : 'PRECISA CRIAR';
echo "\n  panel_screenshots: $tableExists\n";
