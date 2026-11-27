<?php
// ERP novo — autorização financeira do painel 01 com o RESOLVEDOR REAL de flags do Dash (api/feature-flags/resolver.php) num MySQL LOCAL
// temporário (AZUL, 26/11 noite; mesmo método da P70 da VINHO). Prova que só o OVERRIDE por pessoa libera: global a 100% NÃO é permissão.
// Precisa do socket local do MySQL (root sem senha, ambiente de agentes); sem ele, PULADO. Banco temporário esq_p01_flags, removido no fim.
declare(strict_types=1);
$raiz = realpath(__DIR__ . '/../../..');
require $raiz . '/api/_helpers/ErpNovo.php';
require_once $raiz . '/api/feature-flags/resolver.php';
try { $root = new PDO('mysql:unix_socket=/var/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); }
catch (Throwable) { echo "[PULADO] autorizacao-real: MySQL local indisponível\n"; exit(0); }
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = 'esq_p01_flags'")->fetchColumn()) { echo "[ERRO] autorizacao-real: esq_p01_flags já existe (outra execução?)\n"; exit(1); }
register_shutdown_function(static fn () => $root->exec('DROP DATABASE IF EXISTS esq_p01_flags'));
$root->exec("CREATE DATABASE esq_p01_flags; USE esq_p01_flags;
  CREATE TABLE app_feature_flags (flag_key VARCHAR(64), flag_name VARCHAR(64), description TEXT, is_enabled TINYINT, rollout_percentage INT, payload_json TEXT, environment VARCHAR(20), starts_at DATETIME, ends_at DATETIME, deleted_at DATETIME);
  CREATE TABLE app_user_feature_flags (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, flag_key VARCHAR(64), is_enabled TINYINT, payload_json TEXT, reason TEXT, expires_at DATETIME, deleted_at DATETIME);
  INSERT INTO app_feature_flags VALUES ('financeiro_asaas_leitura','x','',1,0,NULL,'all',NULL,NULL,NULL);
  INSERT INTO app_user_feature_flags (user_id, flag_key, is_enabled) VALUES (75,'financeiro_asaas_leitura',1),(80,'financeiro_asaas_leitura',0);");
$fp = new PDO('mysql:unix_socket=/var/run/mysqld/mysqld.sock;dbname=esq_p01_flags;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$real = static fn (string $k, int $u): array => (new FeatureFlagResolver($fp))->resolve($k, $u);
$f = [];
if (!(erp_novo_autorizado(75, $real) && !erp_novo_autorizado(50, $real) && !erp_novo_autorizado(80, $real))) { $f[] = 'canário oficial (global 0% + override): 75 libera; 50 sem override e 80 com override desligado negam'; }
$fp->exec('UPDATE app_feature_flags SET rollout_percentage = 100');
if (erp_novo_autorizado(50, $real) || ($real('financeiro_asaas_leitura', 50)['enabled'] ?? null) !== true || !erp_novo_autorizado(75, $real)) { $f[] = 'global a 100%: o resolvedor diz enabled para o 50, mas o painel NEGA; 75 segue liberado'; }
$fp->exec('UPDATE app_feature_flags SET is_enabled = 0');
if (erp_novo_autorizado(75, $real)) { $f[] = 'kill switch global desligado: até o 75 é negado'; }
$fp->exec('DROP TABLE app_feature_flags');
if (erp_novo_autorizado(75, $real)) { $f[] = 'tabela de flags fora (erro de banco): nega'; }
if ($f) { echo "[ERRO] autorizacao-real:\n - " . implode("\n - ", $f) . "\n"; exit(1); }
echo "[OK]   autorizacao-real: resolvedor REAL — só o override por pessoa libera; global 100% nega; kill switch e erro de banco negam\n";
