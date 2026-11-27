<?php
declare(strict_types=1);
// teste-geral-pausa-precifica.php — 27/11 (VINHO; proposta do AZUL): o "Recebido" respeita a pausa noturna do coletor (02h–05h, Brasília).
// MySQL LOCAL, banco temporário zz_pausa (criado e removido aqui); dados sintéticos.
$RAIZ = dirname(__DIR__, 2);
require_once "$RAIZ/api/geral/GeralV2.php";
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = 'zz_pausa'")->fetchColumn()) { echo "zz_pausa já existe — abortado\n"; exit(2); }
register_shutdown_function(fn() => $root->exec('DROP DATABASE IF EXISTS zz_pausa'));
$root->exec("CREATE DATABASE zz_pausa; USE zz_pausa;
 CREATE TABLE fin_pcf_snapshot (id INT AUTO_INCREMENT PRIMARY KEY, gerado_em DATETIME, estado VARCHAR(10), motivos VARCHAR(200));
 CREATE TABLE fin_pcf_recebido_dia (snapshot_id INT, dia DATE, empresa_id INT NULL, baixas INT, valor_cents BIGINT NULL);
 CREATE TABLE fin_pcf_empresa (empresa_id INT, cnpj VARCHAR(20), nome VARCHAR(80));
 INSERT INTO fin_pcf_snapshot (gerado_em, estado) VALUES ('2026-11-27 04:50:00', 'ok');   -- 01:50 em Brasília
 INSERT INTO fin_pcf_recebido_dia VALUES (1, '2026-11-26', 1, 2, 100000);");
$pdo = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=zz_pausa;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$BR = new DateTimeZone('America/Sao_Paulo');
$rec = fn(string $hora) => (new GeralV2(null, null, null, 75, new DateTimeImmutable("2026-11-27 $hora", $BR), null, '', $pdo, 'zz_pausa', financeiro: true))->recebido('ontem');
$casos = [['02:40', 'ok', null, 'dentro da janela de 60 min, antes de qualquer ajuste'], ['03:05', 'ok', 'pausa_noturna', 'o aceite do Jhony (02:45–03:04): pausa, não "Desatualizado"'],
          ['04:59', 'ok', 'pausa_noturna', 'no fim da pausa'], ['05:15', 'ok', null, '10 min antes + 15 depois da pausa = 25 min'],
          ['05:51', 'desatualizado', 'snapshot_antigo', '10 + 51 = 61 min fora da pausa: aí é falha real'],
          ['01:49', 'ok', null, 'leitura de 01:50 vista antes? (relógio de agora < leitura: idade 0)']];
foreach ($casos as [$h, $est, $mot, $n]) { $r = $rec($h); $ck("$h · $est" . ($mot ? "/$mot" : '') . " — $n", $r['estado'] === $est && $r['motivo'] === $mot && $r['valor'] === '1000.00', json_encode([$r['estado'], $r['motivo'], $r['valor']])); }
$root->exec("UPDATE zz_pausa.fin_pcf_snapshot SET gerado_em = '2026-11-27 03:00:00'");   // 00:00 em Brasília
$r = $rec('03:30'); $ck('leitura de 00:00 vista às 03:30: 2 h fora da pausa → desatualizado (a pausa não esconde falha de antes dela)', $r['estado'] === 'desatualizado' && $r['motivo'] === 'snapshot_antigo', json_encode($r['motivo']));
$root->exec("UPDATE zz_pausa.fin_pcf_snapshot SET gerado_em = '2026-11-26 04:50:00'");   // 01:50 de ONTEM
$r = $rec('03:30'); $ck('leitura de 01:50 de ontem vista hoje às 03:30: ~22 h fora da pausa → desatualizado', $r['estado'] === 'desatualizado');
$c = (string) file_get_contents("$RAIZ/api/geral/GeralV2Contrato.php");
$ck('contrato: texto do motivo pausa_noturna', str_contains($c, "'pausa_noturna' => 'Pausa noturna do ERP (02h–05h)"));
echo "teste-geral-pausa-precifica: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
