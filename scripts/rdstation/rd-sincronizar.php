<?php
declare(strict_types=1);
// scripts/rdstation/rd-sincronizar.php — sincronização do RD Station Marketing (VINHO/ACIMA_ESQUERDA, 26/11). SÓ LEITURA, só números.
// Uso (como o usuário do php-fpm, dono da pasta de segredos): sudo -u www-data php /var/www/dshowdash/scripts/rdstation/rd-sincronizar.php
// Grava <config>/rdstation/estado.json (estado, horário, totais). Agendamento: scripts/rdstation/cron-rdstation.PROPOSTA (não instalado).
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../../api/rdstation/RdStation.php';
$e = (new RdSincronizador(RdSegredos::padrao(), new RdCurl()))->rodar(new DateTimeImmutable('now'));
echo 'rdstation resultado=', $e['estado'], $e['erro'] !== null ? ' erro=' . $e['erro'] : '', ' em=', $e['ultima_tentativa'], "\n";
exit($e['estado'] === 'ok' ? 0 : 1);
