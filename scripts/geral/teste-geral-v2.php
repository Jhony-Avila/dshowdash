<?php
/**
 * Teste do serviço da Geral V2 (api/geral/GeralV2.php) — ACIMA_DIREITA, 23/11/2026.
 * Banco: SÓ o de validação ATRWEB_VAL_T_13 (credencial lida em memória, nunca impressa). Tabelas com prefixo PRÓPRIO (gv2_<aleatório>_),
 * criadas a partir do ESQUEMA REAL de cada espelho (docs/{PIPEDRIVE,GOOGLE-CALENDAR,BLING}/02-banco-*.sql, sem as chaves estrangeiras)
 * e apagadas no fim (só as deste roteiro). Relógio fixo: segunda 23/11/2026 10:00 de Brasília. Nenhuma rede, nenhuma API externa.
 *
 * Uso: php scripts/geral/teste-geral-v2.php [caminho/do/GeralV2.php]   (o argumento serve às contraprovas)
 */
declare(strict_types=1);

$RAIZ = dirname(__DIR__, 2);
require_once $argv[1] ?? "$RAIZ/api/geral/GeralV2.php";

$ok = 0; $falhas = [];
function check(string $nome, bool $c, string $extra = ''): void
{
    global $ok, $falhas;
    if ($c) { $ok++; return; }
    $falhas[] = $nome; echo "FALHOU: $nome", $extra !== '' ? " — $extra" : '', "\n";
}

// ---------- banco de validação + esquema real com prefixo ----------
$ini = parse_ini_file('/srv/dshow-modularizacao/atributos-web/validacao/credenciais/atrweb_val.ini', true, INI_SCANNER_RAW)['client'] ?? null;
if (!is_array($ini)) { echo "credencial do banco de validação ilegível\n"; exit(2); }
$dsn = isset($ini['socket']) ? "mysql:unix_socket={$ini['socket']};dbname=ATRWEB_VAL_T_13;charset=utf8mb4"
    : 'mysql:host=' . ($ini['host'] ?? '127.0.0.1') . ';port=' . ($ini['port'] ?? 3306) . ';dbname=ATRWEB_VAL_T_13;charset=utf8mb4';
$pdo = new PDO($dsn, $ini['user'], $ini['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]);
unset($ini);
if ($pdo->query('SELECT DATABASE()')->fetchColumn() !== 'ATRWEB_VAL_T_13') { echo "banco errado\n"; exit(2); }
$pdo->exec("SET time_zone = '-03:00'");   // como a sessão do PIPE em produção (SYSTEM −03:00); o serviço não depende disso

$P = 'gv2_' . bin2hex(random_bytes(4)) . '_';
if (preg_match('/^gv2_[0-9a-f]{8}_$/', $P) !== 1) exit(2);
$TABELAS = [
    'docs/PIPEDRIVE/02-banco-PIPE_DSHOW.sql' => ['pipe_accounts', 'pipe_deals', 'pipe_activities', 'pipe_users', 'pipe_organizations', 'pipe_stages', 'pipe_pipelines', 'pipe_sync_runs'],
    'docs/GOOGLE-CALENDAR/02-banco-GCAL_DSHOW.sql' => ['gcal_accounts', 'gcal_calendars', 'gcal_sync_state'],
    'docs/BLING/02-banco-BLING.sql' => ['bling_accounts', 'bling_sync_state', 'bling_sales_orders', 'bling_situacoes', 'bling_sales_channels'],
];
$criadas = [];
register_shutdown_function(function () use ($pdo, $P, &$criadas): void {
    foreach ($criadas as $t) if (str_starts_with($t, $P)) $pdo->exec("DROP TABLE IF EXISTS `$t`");
    echo '== limpeza: ', $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name LIKE '" . $P . "%'")->fetchColumn(), " tabela(s) deste teste restante(s)\n";
});

/** Tira comentários "-- …" fora de aspas. */
function semComentario(string $sql): string
{
    $out = ''; $aspas = false; $n = strlen($sql);
    for ($i = 0; $i < $n; $i++) {
        $c = $sql[$i];
        if ($c === "'") $aspas = !$aspas;
        if (!$aspas && $c === '-' && ($sql[$i + 1] ?? '') === '-') { while ($i < $n && $sql[$i] !== "\n") $i++; $out .= "\n"; continue; }
        $out .= $c;
    }
    return $out;
}
foreach ($TABELAS as $arq => $nomes) {
    $sql = semComentario((string) file_get_contents("$RAIZ/$arq"));
    foreach ($nomes as $t) {
        if (preg_match('/CREATE TABLE (?:IF NOT EXISTS )?' . $t . ' \((.*?)\n\)\s*ENGINE[^;]*;/s', $sql, $m) !== 1) { echo "esquema de $t não encontrado em $arq\n"; exit(2); }
        $corpo = preg_replace('/^\s*CONSTRAINT [^\n]*\n(\s*REFERENCES [^\n]*\n)?/m', '', $m[1] . "\n");
        $corpo = preg_replace('/,\s*$/', '', rtrim($corpo));
        $pdo->exec("CREATE TABLE `{$P}{$t}` ($corpo\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $criadas[] = $P . $t;
    }
}
check('esquema real criado (16 tabelas, com situacao_bling_id e loja_bling_id)', count($criadas) === 16
    && (int) $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='{$P}bling_sales_orders' AND COLUMN_NAME IN ('situacao_bling_id','loja_bling_id')")->fetchColumn() === 2);

$BR = new DateTimeZone('America/Sao_Paulo');
$AGORA = new DateTimeImmutable('2026-11-23 10:00:00', $BR);   // = 13:00 UTC
$ins = function (string $t, array $l) use ($pdo, $P): void {
    $c = array_keys($l);
    $st = $pdo->prepare("INSERT INTO `{$P}$t` (`" . implode('`,`', $c) . '`) VALUES (' . implode(',', array_fill(0, count($c), '?')) . ')');
    $st->execute(array_values($l));
};
$sv = fn(?PDO $pipe = null, ?PDO $gcal = null, ?PDO $bling = null, ?Closure $cf = null, ?DateTimeImmutable $ag = null, bool $semPdo = false)
    => new GeralV2($semPdo ? $pipe : ($pipe ?? $pdo), $semPdo ? $gcal : ($gcal ?? $pdo), $semPdo ? $bling : ($bling ?? $pdo), 75, $ag ?? $AGORA, $cf, $P);
$prio = fn(array $r, string $id) => array_values(array_filter($r['prioridades'], fn($x) => $x['id'] === $id))[0];

// ---------- dados sintéticos ----------
// Pipedrive: conta conectada, sincronização de negócios e atividades há 10 min (−03:00, como o NOW() da sessão do PIPE)
$ins('pipe_accounts', ['auth_method' => 'token', 'company_id' => 1, 'company_domain' => 'dshow', 'status' => 'connected', 'is_active' => 1]);
foreach (['deals', 'activities'] as $e) $ins('pipe_sync_runs', ['run_type' => 'cron', 'entity' => $e, 'started_at' => '2026-11-23 09:49:00', 'finished_at' => '2026-11-23 09:50:00', 'status' => 'completed']);
$ins('pipe_users', ['pipedrive_id' => 900, 'name' => 'Ana Vendas']);
$ins('pipe_users', ['pipedrive_id' => 901, 'name' => 'Beto Vendas']);
$ins('pipe_organizations', ['pipedrive_id' => 700, 'name' => 'Cliente Fictício SA']);
$ins('pipe_pipelines', ['pipedrive_id' => 1, 'name' => 'Comercial']);
$ins('pipe_stages', ['pipedrive_id' => 10, 'pipeline_pd_id' => 1, 'name' => 'Proposta']);
$deal = function (int $id, string $status, array $x = []) use ($ins): void {
    $ins('pipe_deals', $x + ['pipedrive_id' => $id, 'title' => "Negócio $id", 'status' => $status, 'currency' => 'BRL', 'value' => 1000, 'owner_id' => 900,
        'org_id' => 700, 'stage_id' => 10, 'pipeline_id' => 1]);   // $x primeiro: o caso sobrescreve o padrão
};
$ativ = 0;
$atv = function (int $deal, ?string $dia, ?string $hora, int $feita = 0, int $apagada = 0) use ($ins, &$ativ): void {
    $ins('pipe_activities', ['pipedrive_id' => 5000 + (++$ativ), 'deal_pd_id' => $deal, 'due_date' => $dia, 'due_time' => $hora, 'done' => $feita, 'is_deleted' => $apagada, 'subject' => 'x']);
};
// P1 — atividade vencida (negócio distinto)
$deal(1, 'open'); $atv(1, '2026-11-01', null); $atv(1, '2026-11-20', null);          // 2 vencidas, conta UMA vez; mais antiga 01/11
$deal(2, 'open'); $atv(2, '2026-11-23', '12:00:00');                                  // hoje 12:00 UTC = 09:00 BR → já venceu
$deal(3, 'open'); $atv(3, '2026-11-23', '14:00:00');                                  // hoje 14:00 UTC = 11:00 BR → ainda não
$deal(4, 'open'); $atv(4, '2026-11-23', null);                                        // só data, hoje → não vencida
$deal(5, 'won', ['won_time' => '2026-11-10 12:00:00']); $atv(5, '2026-11-01', null);  // ganho: fora
$deal(6, 'open'); $atv(6, '2026-11-01', null, 1);                                     // concluída: fora
$deal(7, 'open', ['is_deleted' => 1]); $atv(7, '2026-11-01', null);                   // negócio apagado: fora
$deal(13, 'open'); $atv(13, '2026-11-01', null, 0, 1);                                // atividade apagada: fora
// P2 — sem atividade futura, fechamento até hoje + 7 (30/11), inclui vencidos
$deal(8, 'open', ['expected_close_date' => '2026-11-30']);                            // limite exato: entra
$deal(9, 'open', ['expected_close_date' => '2026-12-01']);                            // depois do limite: fora
$deal(10, 'open', ['expected_close_date' => '2026-10-01']); $atv(10, '2026-10-15', null);   // fechamento vencido + só atividade vencida: entra (e entra na P1)
$deal(11, 'open', ['expected_close_date' => '2026-11-25']); $atv(11, '2026-11-24', null);   // tem atividade futura: fora
$deal(12, 'open', ['expected_close_date' => '2026-11-25', 'owner_id' => 901, 'value' => null]); $atv(12, null, null);   // atividade sem data não é futura: entra
$deal(14, 'open', ['expected_close_date' => '2026-11-26']); $atv(14, '2026-11-23', '14:00:00');   // atividade hoje 11:00 BR, ainda por vir: fora
// Ganhos (won_time UTC) — 7 dias = 16..22/11 de Brasília = [16/11 03:00 UTC, 23/11 03:00 UTC)
$deal(20, 'won', ['won_time' => '2026-11-16 03:00:00', 'value' => 100.10]);           // 16/11 00:00 BR → entra
$deal(21, 'won', ['won_time' => '2026-11-16 02:59:59', 'value' => 999]);              // 15/11 23:59 BR → fora
$deal(22, 'won', ['won_time' => '2026-11-23 02:59:59', 'value' => 200.25]);           // 22/11 23:59 BR → entra
$deal(23, 'won', ['won_time' => '2026-11-23 03:00:00', 'value' => 777]);              // 23/11 00:00 BR (hoje) → fora
$deal(24, 'won', ['won_time' => '2026-11-01 05:00:00', 'value' => 50]);               // mês → entra só no "mês"
$deal(25, 'lost', ['lost_time' => '2026-11-20 10:00:00']);

$r = $sv()->resumo('7d');
check('período 7d = 16..22/11 (dias completos até ontem)', $r['periodo']['de'] === '2026-11-16' && $r['periodo']['ate'] === '2026-11-22', json_encode($r['periodo']));
check('período ontem = 22/11; mês = 01..22/11', $sv()->periodo('ontem')[0]->format('Y-m-d') === '2026-11-22'
    && $sv()->periodo('mes')[0]->format('Y-m-d') === '2026-11-01' && $sv()->periodo('mes')[1]->format('Y-m-d') === '2026-11-22');
check('mês no dia 1º = mês anterior inteiro (nunca vazio)', $sv(ag: new DateTimeImmutable('2026-12-01 08:00', $BR))->periodo('mes')[0]->format('Y-m-d') === '2026-11-01');
$p1 = $prio($r, 'atividade_vencida');
check('P1: 3 negócios distintos (1, 2 pela hora já vencida, 10), nunca atividades', $p1['total'] === 3, json_encode($p1));
check('P1: mais antiga 15/10 (negócio 10)', $p1['mais_antiga'] === '2026-10-15', json_encode($p1));
check('P1: estado ok com a fonte em dia', $p1['estado'] === 'ok');
$p2 = $prio($r, 'sem_atividade_fechamento_7d');
check('P2: negócios 8, 10 e 12 (limite +7 inclusive, vencido entra, sem data não é futura)', $p2['total'] === 3, json_encode($p2));
check('P2: mais antiga = fechamento 01/10', $p2['mais_antiga'] === '2026-10-01');
check('ganhos 7d: 2 / 300.35 pela data do ganho em Brasília', $r['ganhos']['quantidade'] === 2 && $r['ganhos']['valor'] === '300.35', json_encode($r['ganhos']));
$o = $sv()->resumo('ontem'); $m = $sv()->resumo('mes');
check('ganhos ontem: 1 / 200.25 · mês (01–22/11, inclui 15/11 23:59 BR): 5 / 2349.35', $o['ganhos']['quantidade'] === 1 && $o['ganhos']['valor'] === '200.25' && $m['ganhos']['quantidade'] === 5 && $m['ganhos']['valor'] === '2349.35',
    json_encode([$o['ganhos'], $m['ganhos']]));
check('prioridades não mudam com o período', $prio($o, 'atividade_vencida')['total'] === $p1['total'] && $prio($m, 'sem_atividade_fechamento_7d')['total'] === $p2['total']);
$abertos = (int) $pdo->query("SELECT COUNT(*) FROM `{$P}pipe_deals` WHERE is_deleted=0 AND status='open'")->fetchColumn();
check('funil: abertos, valor e 1 sem valor', $r['funil']['quantidade'] === $abertos && $r['funil']['sem_valor'] === 1 && $r['funil']['valor'] === number_format(($abertos - 1) * 1000, 2, '.', ''), json_encode($r['funil']));

// ---------- listas reproduzem a contagem ----------
foreach (['atividade_vencida', 'sem_atividade_fechamento_7d'] as $id) {
    $l = $sv()->lista($id);
    check("lista $id: total = cartão e itens = total", $l['total'] === $prio($r, $id)['total'] && count($l['itens']) === $l['total'], json_encode([$l['total'], count($l['itens'])]));
}
$l = $sv()->lista('atividade_vencida');
check('lista P1: mais antiga primeiro; referência = atividade vencida mais antiga; dias de atraso', $l['itens'][0]['negocio_id'] === 10 && $l['itens'][0]['referencia'] === '2026-10-15' && $l['itens'][0]['dias'] === 39, json_encode($l['itens'][0]));
check('lista: nomes de organização, responsável, etapa e funil', $l['itens'][0]['organizacao'] === 'Cliente Fictício SA' && $l['itens'][0]['responsavel'] === 'Ana Vendas' && $l['itens'][0]['etapa'] === 'Proposta' && $l['itens'][0]['funil'] === 'Comercial');
check('lista: link do Pipedrive pelo domínio da conta', $l['itens'][0]['link'] === 'https://dshow.pipedrive.com/deal/10');
check('lista: valor exato em texto', $l['itens'][0]['valor'] === '1000.00');
$l2 = $sv()->lista('sem_atividade_fechamento_7d');
$porId = array_column($l2['itens'], null, 'negocio_id');
check('lista P2: fechamento futuro tem dias negativos; sem valor = null', $porId[8]['dias'] === -7 && $porId[12]['valor'] === null && $porId[10]['dias'] === 53, json_encode([$porId[8]['dias'], $porId[10]['dias']]));
// paginação: +60 negócios com atividade vencida → 63, páginas de 50 sem repetição
for ($i = 100; $i < 160; $i++) { $deal($i, 'open', ['owner_id' => $i % 2 ? 901 : 900]); $atv($i, '2026-11-' . str_pad((string) (1 + $i % 20), 2, '0', STR_PAD_LEFT), null); }
$c = $prio($sv()->resumo('7d'), 'atividade_vencida')['total'];
$a = $sv()->lista('atividade_vencida', 1); $b = $sv()->lista('atividade_vencida', 2); $z = $sv()->lista('atividade_vencida', 3);
$ids = array_merge(array_column($a['itens'], 'negocio_id'), array_column($b['itens'], 'negocio_id'));
check('paginação: 63 no cartão = total da lista; 50 + 13; 2 páginas; sem repetição; página 3 vazia', $c === 63 && $a['total'] === 63 && count($a['itens']) === 50 && count($b['itens']) === 13
    && $a['paginas'] === 2 && count(array_unique($ids)) === 63 && $z['itens'] === [], json_encode([$c, $a['total'], count($a['itens']), count($b['itens'])]));
$refs = array_column(array_merge($a['itens'], $b['itens']), 'referencia'); $ord = $refs; sort($ord);
check('paginação: ordem estável pela referência', $refs === $ord);
$f = $sv()->lista('atividade_vencida', 1, 901);
$n901 = (int) $pdo->query("SELECT COUNT(DISTINCT d.id) FROM `{$P}pipe_deals` d JOIN `{$P}pipe_activities` a ON a.deal_pd_id=d.pipedrive_id WHERE d.owner_id=901 AND d.status='open' AND d.is_deleted=0 AND a.done=0 AND a.is_deleted=0 AND a.due_date < '2026-11-23'")->fetchColumn();
check('filtro por responsável: total do filtro e total_sem_filtro = cartão', $f['total'] === $n901 && $f['total_sem_filtro'] === 63 && count(array_filter($f['itens'], fn($x) => $x['responsavel_id'] !== 901)) === 0, json_encode([$f['total'], $n901]));
$v = $sv()->lista('atividade_vencida', 1, null, 'valor');
check('ordem por valor: mesmo total', $v['total'] === 63);
check('prioridade/ordem inválidas recusadas', (function () use ($sv) { try { $sv()->lista('x'); return false; } catch (GeralV2Erro) {} try { $sv()->lista('atividade_vencida', 1, null, 'x'); return false; } catch (GeralV2Erro) { return true; } })());
$pdo->exec("UPDATE `{$P}pipe_accounts` SET company_domain='evil.com/x'");
check('domínio inválido → sem link (nunca link quebrado)', $sv()->lista('atividade_vencida')['itens'][0]['link'] === null);
$pdo->exec("UPDATE `{$P}pipe_accounts` SET company_domain='dshow.pipedrive.com'");
check('domínio completo aceito', $sv()->lista('atividade_vencida')['itens'][0]['link'] === 'https://dshow.pipedrive.com/deal/10');

// ---------- Bling ----------
$ins('bling_accounts', ['id' => 1, 'nome' => 'DSHOW', 'estado_conexao' => 'conectado', 'is_padrao' => 1, 'is_ativo' => 1]);
$ins('bling_sync_state', ['account_id' => 1, 'recurso' => 'pedidos', 'situacao' => 'ok', 'ultima_execucao_em' => '2026-11-23 12:40:00']);   // UTC = 09:40 BR
$ins('bling_situacoes', ['account_id' => 1, 'modulo_id' => '98310', 'situacao_id' => '12', 'nome' => 'Cancelado', 'lido_em' => '2026-11-23 12:00:00']);
$ins('bling_situacoes', ['account_id' => 1, 'modulo_id' => '98310', 'situacao_id' => '9', 'nome' => 'Atendido', 'lido_em' => '2026-11-23 12:00:00']);
$ins('bling_sales_channels', ['account_id' => 1, 'bling_id' => '555', 'nome' => 'Teste - Mercado Livre']);
$ins('bling_sales_channels', ['account_id' => 1, 'bling_id' => '556', 'nome' => 'Loja própria']);
$ped = 0;
$pedido = function (string $dia, string $total, array $x = []) use ($ins, &$ped): void {
    $ins('bling_sales_orders', $x + ['account_id' => 1, 'bling_id' => (string) (80000 + (++$ped)), 'data_pedido' => $dia, 'situacao' => 'x', 'total' => $total,
        'situacao_bling_id' => '9', 'loja_bling_id' => '556']);
};
$pedido('2026-11-16', '100.10'); $pedido('2026-11-16', '0.00'); $pedido('2026-11-19', '638341.09');
$pedido('2026-11-20', '50.00', ['situacao_bling_id' => '12']);            // cancelado: fora
$pedido('2026-11-20', '70.00', ['loja_bling_id' => '555']);              // loja teste: fora
$pedido('2026-11-21', '10.00', ['deletado_em' => '2026-11-21 10:00:00']); // apagado: fora
$pedido('2026-11-15', '1.00'); $pedido('2026-11-23', '1.00');            // fora do período
$r = $sv()->resumo('7d');
check('pedidos 7d: 3 / 638441.19 (fora cancelado, loja teste, apagado e dias fora)', $r['pedidos']['quantidade'] === 3 && $r['pedidos']['valor'] === '638441.19', json_encode($r['pedidos']));
check('por_dia: os 7 dias; dia sem pedido = 0 com a fonte em dia', count($r['pedidos']['por_dia']) === 7 && $r['pedidos']['por_dia'][1] === ['dia' => '2026-11-17', 'quantidade' => 0, 'valor' => '0.00']
    && $r['pedidos']['por_dia'][0]['quantidade'] === 2 && $r['pedidos']['por_dia'][0]['valor'] === '100.10');
check('com os ids presentes: não inclui cancelados nem a loja teste', $r['pedidos']['inclui_cancelados'] === false && $r['pedidos']['inclui_teste_ml'] === false && $r['pedidos']['estado'] === 'ok');
$pedido('2026-11-22', '5.00', ['situacao_bling_id' => null, 'loja_bling_id' => null]);
$r = $sv()->resumo('7d');
check('pedido sem id da situação/loja: entra e a resposta avisa', $r['pedidos']['quantidade'] === 4 && $r['pedidos']['inclui_cancelados'] === true && $r['pedidos']['inclui_teste_ml'] === true);
$o = $sv()->resumo('ontem');
check('ontem: 1 pedido de 5.00', $o['pedidos']['quantidade'] === 1 && $o['pedidos']['valor'] === '5.00' && count($o['pedidos']['por_dia']) === 1);

// ---------- Google Calendar (frescor por calendário) + conflitos ----------
$ins('gcal_accounts', ['id' => 42, 'user_id' => 75, 'google_account_id' => 'g1', 'email' => 'x@exemplo.test', 'scopes' => 's', 'is_active' => 1, 'connection_status' => 'connected']);
foreach (['a@exemplo.test', 'b@exemplo.test'] as $cal) {
    $ins('gcal_calendars', ['account_id' => 42, 'calendar_id' => $cal, 'summary' => $cal, 'access_role' => 'owner']);
    $ins('gcal_sync_state', ['account_id' => 42, 'calendar_id' => $cal, 'status' => 'ok', 'last_sync_at' => '2026-11-23 12:50:00']);   // UTC
}
$conf = [['tipo' => 'sobreposicao', 'severidade' => 'alta', 'mensagem' => 'Dois compromissos ao mesmo tempo.', 'eventos' => [
    ['calendar_id' => 'a@exemplo.test', 'summary' => 'Reunião A', 'start' => '2026-11-23T14:00:00-03:00', 'end' => '2026-11-23T15:00:00-03:00'],
    ['calendar_id' => 'b@exemplo.test', 'summary' => 'Reunião B', 'start' => '2026-11-23T14:30:00-03:00', 'end' => '2026-11-23T15:30:00-03:00']]]];
$janela = null;
$cf = function (string $de, string $ate) use ($conf, &$janela): array { $janela = [$de, $ate]; return $conf; };
$r = $sv(cf: $cf)->resumo('7d');
$p3 = $prio($r, 'conflito_agenda');
check('P3: 1 conflito hoje, janela = o dia de Brasília', $p3['total'] === 1 && $p3['estado'] === 'ok' && $janela === ['2026-11-23', '2026-11-23'], json_encode([$p3, $janela]));
$l3 = $sv(cf: $cf)->lista('conflito_agenda');
check('lista P3 = contagem, com os dois títulos', $l3['total'] === 1 && $l3['itens'][0]['titulo_a'] === 'Reunião A' && $l3['itens'][0]['titulo_b'] === 'Reunião B' && $l3['itens'][0]['inicio'] === '2026-11-23T14:00:00-03:00');
check('P3 zero com agenda em dia → zero_confirmado', $prio($sv(cf: fn() => [])->resumo('7d'), 'conflito_agenda')['estado'] === 'zero_confirmado');
check('P3 sem provedor → indisponivel e total null (nunca 0)', ($x = $prio($sv(cf: null)->resumo('7d'), 'conflito_agenda'))['total'] === null && $x['estado'] === 'indisponivel');
check('P3 provedor com erro → indisponivel, total null', ($x = $prio($sv(cf: function () { throw new RuntimeException('x'); })->resumo('7d'), 'conflito_agenda'))['total'] === null && $x['estado'] === 'indisponivel');
$pdo->exec("UPDATE `{$P}gcal_sync_state` SET last_sync_at='2026-11-23 08:00:00' WHERE calendar_id='b@exemplo.test'");
$g = $sv(cf: $cf)->fonte('google_calendar');
check('um calendário atrasado → fonte parcial, com o detalhe', $g['estado'] === 'parcial' && $g['detalhe'] === 'calendarios_atrasados_1_de_2', json_encode($g));
check('P3 com a agenda parcial: número aparece com estado parcial', ($x = $prio($sv(cf: $cf)->resumo('7d'), 'conflito_agenda'))['total'] === 1 && $x['estado'] === 'parcial');
$pdo->exec("UPDATE `{$P}gcal_accounts` SET connection_status='reauth_required'");
check('conta pedindo nova autorização → desatualizado (não "sem conexão")', $sv(cf: $cf)->fonte('google_calendar')['estado'] === 'desatualizado');
$pdo->exec("UPDATE `{$P}gcal_accounts` SET is_active=0");
check('sem agenda conectada → aguardando_conexao, total null', ($x = $prio($sv(cf: $cf)->resumo('7d'), 'conflito_agenda'))['estado'] === 'aguardando_conexao' && $x['total'] === null);
$pdo->exec("UPDATE `{$P}gcal_accounts` SET is_active=1, connection_status='connected'");
$pdo->exec("UPDATE `{$P}gcal_sync_state` SET last_sync_at='2026-11-23 12:50:00'");

// ---------- estados: ausência nunca vira zero ----------
$nulos = function (array $r): bool {
    foreach ($r['prioridades'] as $p) if ($p['id'] !== 'conflito_agenda' && $p['total'] !== null) return false;
    return $r['ganhos']['quantidade'] === null && $r['ganhos']['valor'] === null && $r['funil']['quantidade'] === null && $r['funil']['valor'] === null && $r['funil']['sem_valor'] === null;
};
$pdo->exec("UPDATE `{$P}pipe_accounts` SET status='invalid'");
$r = $sv(cf: $cf)->resumo('7d');
check('Pipedrive sem conta conectada → aguardando_conexao e TODOS os números do Pipedrive null', $nulos($r) && $r['funil']['estado'] === 'aguardando_conexao' && $prio($r, 'atividade_vencida')['estado'] === 'aguardando_conexao');
check('lista com Pipedrive aguardando → total null, sem itens', ($x = $sv()->lista('atividade_vencida'))['total'] === null && $x['itens'] === [] && $x['estado'] === 'aguardando_conexao');
$pdo->exec("UPDATE `{$P}pipe_accounts` SET status='connected'");
$r = (new GeralV2(null, $pdo, $pdo, 75, $AGORA, $cf, $P))->resumo('7d');
check('banco do Pipedrive fora → indisponivel, números null; Bling e agenda seguem', $nulos($r) && $r['ganhos']['estado'] === 'indisponivel' && $r['pedidos']['quantidade'] === 4 && $prio($r, 'conflito_agenda')['total'] === 1);
$r = (new GeralV2($pdo, $pdo, null, 75, $AGORA, $cf, $P))->resumo('7d');
check('banco do Bling fora → pedidos null em todos os dias (nunca 0)', $r['pedidos']['quantidade'] === null && $r['pedidos']['valor'] === null && $r['pedidos']['estado'] === 'indisponivel'
    && count(array_filter($r['pedidos']['por_dia'], fn($d) => $d['quantidade'] !== null || $d['valor'] !== null)) === 0);
$pdo->exec("UPDATE `{$P}bling_accounts` SET estado_conexao='nao_configurado'");
$r = $sv(cf: $cf)->resumo('7d');
check('Bling sem conta → aguardando_conexao, números null', $r['pedidos']['estado'] === 'aguardando_conexao' && $r['pedidos']['quantidade'] === null && $r['pedidos']['por_dia'][0]['quantidade'] === null);
$pdo->exec("UPDATE `{$P}bling_accounts` SET estado_conexao='conectado'");
$pdo->exec("UPDATE `{$P}bling_sync_state` SET ultima_execucao_em='2026-11-23 08:00:00'");   // 05:00 BR = 5 h
$r = $sv(cf: $cf)->resumo('7d');
check('Bling velho → desatualizado, números mostrados; dia sem pedido = null (não 0)', $r['pedidos']['estado'] === 'desatualizado' && $r['pedidos']['quantidade'] === 4
    && $r['pedidos']['por_dia'][1]['quantidade'] === null && $r['pedidos']['por_dia'][0]['quantidade'] === 2, json_encode($r['pedidos']['por_dia']));
$pdo->exec("UPDATE `{$P}bling_sync_state` SET ultima_execucao_em='2026-11-23 12:40:00'");
$pdo->exec("UPDATE `{$P}pipe_sync_runs` SET finished_at='2026-11-23 07:00:00' WHERE entity='activities'");
$r = $sv(cf: $cf)->resumo('7d');
check('Pipedrive: atividades sincronizadas há 3 h → desatualizado (vale a mais velha), números mostrados', $r['fontes'][0]['estado'] === 'desatualizado'
    && $prio($r, 'atividade_vencida')['estado'] === 'desatualizado' && $prio($r, 'atividade_vencida')['total'] === 63 && $r['fontes'][0]['atualizado_em'] === '2026-11-23T07:00:00-03:00');
$pdo->exec("UPDATE `{$P}pipe_sync_runs` SET status='failed' WHERE entity='activities'");
check('Pipedrive sem sincronização completa de atividades → parcial', $sv()->fonte('pipedrive')['estado'] === 'parcial');
$pdo->exec("UPDATE `{$P}pipe_sync_runs` SET status='completed', finished_at='2026-11-23 09:50:00'");
// zero confirmado: período sem ganhos
$r = $sv(ag: new DateTimeImmutable('2026-11-03 10:00', $BR), cf: $cf)->resumo('ontem');
check('zero confirmado: ontem (02/11) sem ganhos com a fonte em dia → 0, "0.00", zero_confirmado', $r['ganhos']['quantidade'] === 0 && $r['ganhos']['valor'] === '0.00' && $r['ganhos']['estado'] === 'zero_confirmado', json_encode($r['ganhos']));
// erro de consulta numa parte: só ela some
$pdo->exec("RENAME TABLE `{$P}pipe_activities` TO `{$P}pipe_activities_x`");
$r = $sv(cf: $cf)->resumo('7d');
check('erro na leitura das atividades → P1 e P2 indisponíveis com total null; funil e ganhos seguem', $prio($r, 'atividade_vencida')['total'] === null && $prio($r, 'atividade_vencida')['estado'] === 'indisponivel'
    && $prio($r, 'sem_atividade_fechamento_7d')['total'] === null && $r['funil']['quantidade'] !== null && $r['ganhos']['quantidade'] === 2);
$pdo->exec("RENAME TABLE `{$P}pipe_activities_x` TO `{$P}pipe_activities`");
$pdo->exec("RENAME TABLE `{$P}bling_sales_orders` TO `{$P}bling_sales_orders_x`");
$r = $sv(cf: $cf)->resumo('7d');
check('erro na leitura dos pedidos → quantidade, valor e TODOS os dias null (nunca 0); o resto segue', $r['pedidos']['quantidade'] === null && $r['pedidos']['estado'] === 'indisponivel'
    && count(array_filter($r['pedidos']['por_dia'], fn($d) => $d['quantidade'] !== null || $d['valor'] !== null)) === 0 && count($r['pedidos']['por_dia']) === 7 && $r['funil']['quantidade'] !== null);
$pdo->exec("RENAME TABLE `{$P}bling_sales_orders_x` TO `{$P}bling_sales_orders`");
// moeda fora de BRL
$deal(300, 'won', ['won_time' => '2026-11-20 15:00:00', 'currency' => 'USD', 'value' => 10]);
$r = $sv(cf: $cf)->resumo('7d');
check('ganho em USD: conta na quantidade, fica fora do valor e o cartão vira parcial', $r['ganhos']['quantidade'] === 3 && $r['ganhos']['valor'] === '300.35' && $r['ganhos']['fora_brl'] === 1 && $r['ganhos']['estado'] === 'parcial');
check('período inválido recusado', (function () use ($sv) { try { $sv()->resumo('ano'); return false; } catch (GeralV2Erro) { return true; } })());
check('prefixo inválido recusado', (function () use ($pdo) { try { new GeralV2($pdo, $pdo, $pdo, 75, null, null, 'x; DROP'); return false; } catch (InvalidArgumentException) { return true; } })());

// ---------- só leitura: nenhuma escrita do serviço ----------
$antes = $pdo->query("SELECT SUM(t.n) FROM (SELECT COUNT(*) n FROM `{$P}pipe_deals` UNION ALL SELECT COUNT(*) FROM `{$P}bling_sales_orders` UNION ALL SELECT COUNT(*) FROM `{$P}gcal_sync_state`) t")->fetchColumn();
$src = (string) file_get_contents($argv[1] ?? "$RAIZ/api/geral/GeralV2.php");
check('serviço sem INSERT/UPDATE/DELETE/REPLACE/ALTER/DROP', preg_match('/\b(INSERT|UPDATE|DELETE|REPLACE|ALTER|DROP|TRUNCATE)\b/', $src) === 0);
$sv(cf: $cf)->resumo('mes'); $sv(cf: $cf)->lista('sem_atividade_fechamento_7d');
check('nada mudou nas tabelas', $antes === $pdo->query("SELECT SUM(t.n) FROM (SELECT COUNT(*) n FROM `{$P}pipe_deals` UNION ALL SELECT COUNT(*) FROM `{$P}bling_sales_orders` UNION ALL SELECT COUNT(*) FROM `{$P}gcal_sync_state`) t")->fetchColumn());

echo 'teste-geral-v2: ', $ok, ' ok, ', count($falhas), " falha(s)\n";
exit($falhas === [] ? 0 : 1);
