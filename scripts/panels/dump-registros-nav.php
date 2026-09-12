<?php
// scripts/panels/dump-registros-nav.php — snapshot SÓ LEITURA dos registros de navegação/painéis do banco, em JSON,
// para o inventário derivado (scripts/panels/inventario-paineis.mjs). Nunca escreve no banco; nunca imprime segredo.
// Uso: php scripts/panels/dump-registros-nav.php <saida.json>
declare(strict_types=1);
$out = $argv[1] ?? null;
if (!$out) { fwrite(STDERR, "uso: dump-registros-nav.php <saida.json>\n"); exit(2); }
require '/var/www/dshowdash/config/db_connection.php';
$pdo = getConnection('DSHOWDASH');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$tables = array_map(fn($r) => array_values($r)[0], $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_ASSOC));
$has = fn(string $t) => in_array($t, $tables, true);
$q = fn(string $sql) => $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
$snap = ['gerado_em' => date('c'), 'origem' => 'DSHOWDASH (leitura)', 'tabelas' => []];
$spec = [
  'panel_registry'      => 'SELECT panel_id, module_name, title, category, is_active, updated_at FROM panel_registry ORDER BY panel_id',
  'ui_nav_items'        => 'SELECT item_key, item_type, display_context, label, route_path, panel_id, intent_id, is_active, is_visible, parent_key FROM ui_nav_items ORDER BY display_context, order_index',
  'navigation_items'    => 'SELECT item_key, label, route_path, panel_id, is_active, deleted_at FROM navigation_items ORDER BY order_index',
  'navrail_items'       => 'SELECT item_key, label, action_type, action_data, is_active, is_deleted FROM navrail_items ORDER BY order_index',
  'header_menu_items'   => 'SELECT item_key, label, action_type, action_value, is_active, is_deleted FROM header_menu_items',
  'app_nav_destination' => 'SELECT destination_key, destination_type, is_active FROM app_nav_destination ORDER BY destination_key',
  'app_nav_route'       => 'SELECT r.route_clean, r.is_active, d.destination_key, rr.layout FROM app_nav_route r JOIN app_nav_route_resolution_active a ON a.route_id=r.route_id JOIN app_nav_route_resolution_revision rr ON rr.resolution_rev_id=a.resolution_rev_id JOIN app_nav_destination d ON d.destination_id=rr.destination_id ORDER BY r.route_clean',
  'panel_screenshots'   => 'SELECT panel_id, MAX(captured_at) AS ultimo, COUNT(*) AS n FROM panel_screenshots GROUP BY panel_id',
  'app_orchestrator_rules' => 'SELECT * FROM app_orchestrator_rules LIMIT 500',
  'footer_items'        => 'SELECT * FROM footer_items LIMIT 500',
  'sidebar_items'       => 'SELECT * FROM sidebar_items LIMIT 500',
  'header_components'   => 'SELECT * FROM header_components LIMIT 500',
];
foreach ($spec as $t => $sql) {
  if (!$has($t)) { $snap['tabelas'][$t] = null; continue; }
  try { $snap['tabelas'][$t] = $q($sql); }
  catch (Throwable $e) { $snap['tabelas'][$t] = ['erro' => substr($e->getMessage(), 0, 120)]; }
}
file_put_contents($out, json_encode($snap, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
foreach ($snap['tabelas'] as $t => $rows) echo str_pad($t, 24), is_array($rows) && !isset($rows['erro']) ? count($rows) . " linhas" : ($rows === null ? 'ausente' : 'ERRO ' . $rows['erro']), "\n";
