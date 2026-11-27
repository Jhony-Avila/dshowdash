<?php
declare(strict_types=1);
// teste-asaas-agenda.php — 27/11 (VINHO; decisão do arquiteto): a janela das empresas do Asaas segue a AGENDA do cron (37 0,1,6-23), não 180 min fixos.
// Horários pedidos: 04:00, 04:40, 06:36 e 06:45. MySQL LOCAL, banco temporário zz_agenda (criado e removido aqui); dados sintéticos.
$RAIZ = dirname(__DIR__, 2);
require_once "$RAIZ/api/asaas/AsaasDados.php"; require_once "$RAIZ/api/asaas/AsaasCobrancas.php"; require_once "$RAIZ/api/geral/GeralV2Asaas.php";
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
$BR = new DateTimeZone('America/Sao_Paulo'); $T = fn(string $h) => new DateTimeImmutable("2026-11-27 $h", $BR);
$ag = AsaasAgenda::daLinha('37 0,1,6-23 * * * www-data cd /var/www/dshowdash && nice -n 10 php scripts/asaas/asaas-sincronizar.php >> /var/log/asaas-sincronizar.log 2>&1');
$ck('lê a linha instalada pelo portão ASAAS-AGENDAMENTO: minuto 37, horas 0,1,6–23 (sem 2–5)', $ag !== null && $ag->minuto === 37 && $ag->horas === array_merge([0, 1], range(6, 23)) && $ag->lidaDoCron);
$ult = $T('01:38:00');   // a última rodada boa antes da pausa
$tab = []; foreach (['04:00', '04:40', '06:36', '06:45'] as $h) $tab[$h] = [$ag->emDia($ult, $T("$h:00")), $ag->emPausa($T("$h:00"))];
$ck('04:00 · 04:40 · 06:36: EM DIA e EM PAUSA (dados visíveis com o aviso); 06:45: em dia e fora da pausa (a rodada de 06:37 já passou)',
    $tab['04:00'] === [true, true] && $tab['04:40'] === [true, true] && $tab['06:36'] === [true, true] && $tab['06:45'] === [true, false], json_encode($tab));
$ck('regra antiga (180 min fixos) teria tirado TODAS as empresas às 04:40 e às 06:36 (o defeito)', ($T('04:40')->getTimestamp() - $ult->getTimestamp()) > 180 * 60 && ($T('06:36')->getTimestamp() - $ult->getTimestamp()) > 180 * 60);
$ck('depois da pausa, 3 rodadas perdidas (06:37, 07:37, 08:37) → desatualizada às 08:50', !$ag->emDia($ult, $T('08:50:00')) && $ag->emDia($ult, $T('08:40:00')));
$ck('fora da pausa ≈ a regra antiga: boa às 10:38 → em dia às 13:45, desatualizada às 13:50', $ag->emDia($T('10:38:00'), $T('13:45:00')) && !$ag->emDia($T('10:38:00'), $T('13:50:00')));
$ck('meio-dia não é pausa; 02:30 é', !$ag->emPausa($T('12:10:00')) && $ag->emPausa($T('02:30:00')));
$pad = AsaasAgenda::doArquivo('/nao/existe');
$ck('sem o arquivo do cron (ou linha ilegível): toda hora no minuto 37 (o comportamento antigo) e nunca "pausa"', !$pad->lidaDoCron && $pad->horas === range(0, 23) && !$pad->emPausa($T('04:40:00'))
    && AsaasAgenda::daLinha('*/15 * * * * www-data php x') === null && AsaasAgenda::daLinha('37 2-1 * * * u x') === null);
// ponta a ponta: as Vencidas NÃO somem às 04:40 (tela e cartão), e trazem o aviso da pausa
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = 'zz_agenda'")->fetchColumn()) { echo "zz_agenda já existe — abortado\n"; exit(2); }
register_shutdown_function(fn() => $root->exec('DROP DATABASE IF EXISTS zz_agenda'));
$root->exec('CREATE DATABASE zz_agenda');
$pdo = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=zz_agenda;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
foreach (AsaasEsquema::ddl('') as $sql) $pdo->exec($sql);
$pdo->exec("INSERT INTO asaas_contas (conta, nome, estado, geracao_ativa, ultima_sync_ok, atualizado_em) VALUES ('zenthra','Z','ok',1,'2026-11-27 01:38:00',NOW()),('rovic','R','ok',1,'2026-11-27 01:38:00',NOW())");
$i = $pdo->prepare("INSERT INTO asaas_cobrancas (conta, geracao, payment_id, status, valor, vencimento, execucao, atualizado_em) VALUES (?,1,?,?,100,'2026-11-01',1,NOW())");
foreach ([['zenthra', 'p1', 'OVERDUE'], ['zenthra', 'p2', 'DUNNING_REQUESTED'], ['rovic', 'p3', 'OVERDUE']] as $x) $i->execute($x);
AsaasAgenda::definirPadrao($ag);
$R = new AsaasResumo($pdo, '', $BR);
$c = new AsaasCobrancas($R->vencidasDetalhadas(['zenthra', 'rovic'], $T('04:40:00')), $T('04:40:00'));
$res = $c->resumo();
$ck('04:40 · tela das Vencidas: as 3 cobranças continuam (nenhuma empresa sem leitura) e a cobertura traz "última sincronização 01:38 · pausa noturna"',
    $res['total']['cobrancas'] === 3 && $res['completo'] === true && ($res['pausa_noturna']['texto'] ?? null) === 'última sincronização 01:38 · pausa noturna', json_encode(array_intersect_key($res, array_flip(['total', 'completo', 'pausa_noturna']))));
$card = (new GeralV2Asaas($pdo))->cartao(['zenthra', 'rovic'], $T('04:40:00'));
$ck('04:40 · cartão: total presente (não "parcial"), as 2 empresas ok com o motivo pausa_noturna:01:38', $card['total'] !== null && $card['total_parcial'] === false
    && array_unique(array_column($card['empresas'] ?? $card['contas'] ?? [], 'motivo')) === ['pausa_noturna:01:38'], json_encode($card));
$c2 = new AsaasCobrancas($R->vencidasDetalhadas(['zenthra', 'rovic'], $T('06:45:00')), $T('06:45:00'));
$ck('06:45 (a rodada de 06:37 ainda não gravou): continua visível e já sem o aviso de pausa', $c2->resumo()['total']['cobrancas'] === 3 && $c2->resumo()['pausa_noturna'] === null);
AsaasAgenda::definirPadrao(null);
echo "teste-asaas-agenda: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
