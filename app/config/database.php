<?php
// Database config wrapper para health.php
// Reutiliza db_connection.php existente

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $pdo = getConnection('DSHOWDASH');
} catch (Exception $e) {
    $pdo = null;
    error_log("[database.php] Connection failed: " . $e->getMessage());
}
