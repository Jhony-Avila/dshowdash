<?php
declare(strict_types=1);
// scripts/rdstation/rd-sincronizar.php — sincronização do RD Station Marketing (VINHO/ACIMA_ESQUERDA, 26/11). SÓ LEITURA, só números.
// Uso (como o usuário do php-fpm, dono da pasta de segredos): sudo -u www-data php /var/www/dshowdash/scripts/rdstation/rd-sincronizar.php
// Grava <config>/rdstation/estado.json (estado, horário, totais). Agendamento: scripts/rdstation/cron-rdstation.PROPOSTA (não instalado).
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../../api/rdstation/RdStation.php';
require_once __DIR__ . '/../../api/obs/ObsProdutor.php';   // OBS-001 (27/11): registro central de execuções, fail-soft
// Registro central (job rd.sincronizar, slot = minuto 41 em UTC). A conexão é aberta só para o registro; se faltar (tabela, banco, config),
// a sincronização roda igual: o estado.json e esta saída continuam sendo a fonte.
$obs = new ObsProdutor(static function (): PDO { $c = __DIR__ . '/../../config/db_connection.php'; if (!is_file($c)) throw new RuntimeException('sem_config'); require_once $c; return getConnection('DSHOWDASH'); }, 'rd.sincronizar', 900);
$alca = $obs->comecar('-', ObsProdutor::slotHorario(new DateTimeImmutable('now'), 41), new DateTimeImmutable('now'));
try { $e = (new RdSincronizador(RdSegredos::padrao(), new RdCurl()))->rodar(new DateTimeImmutable('now')); }
catch (Throwable $x) { $obs->terminar($alca, 'falhou', null, 'interno', new DateTimeImmutable('now')); throw $x; }   // exceção: fecha o registro e segue como antes
// ok com algum total fora do plano/indisponível = parcial (cobertura); volume desconhecido (o RD dá totais, não itens lidos) = null
$parcial = $e['estado'] === 'ok' && !empty($e['totais']['indisponivel'] ?? []);
$obs->terminar($alca, $e['estado'] === 'ok' ? ($parcial ? 'parcial' : 'ok') : 'falhou', null, $parcial ? 'cobertura' : (($e['erro'] ?? null) === 'interno' ? 'interno' : 'fonte'), new DateTimeImmutable('now'));
echo 'rdstation resultado=', $e['estado'], $e['erro'] !== null ? ' erro=' . $e['erro'] : '', ' em=', $e['ultima_tentativa'], "\n";
exit($e['estado'] === 'ok' ? 0 : 1);
