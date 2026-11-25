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
    'docs/BLING/02-banco-BLING.sql' => ['bling_accounts', 'bling_sync_state', 'bling_sales_orders', 'bling_situacoes', 'bling_sales_channels', 'bling_sync_jobs', 'bling_sync_errors'],
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
check('esquema real criado (18 tabelas, com situacao_bling_id e loja_bling_id)', count($criadas) === 18
    && (int) $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='{$P}bling_sales_orders' AND COLUMN_NAME IN ('situacao_bling_id','loja_bling_id')")->fetchColumn() === 2);

$BR = new DateTimeZone('America/Sao_Paulo');
$AGORA = new DateTimeImmutable('2026-11-23 10:00:00', $BR);   // = 13:00 UTC
$ins = function (string $t, array $l) use ($pdo, $P): void {
    $c = array_keys($l);
    $st = $pdo->prepare("INSERT INTO `{$P}$t` (`" . implode('`,`', $c) . '`) VALUES (' . implode(',', array_fill(0, count($c), '?')) . ')');
    $st->execute(array_values($l));
};
/** provedor de agenda falso (o GcalDb real tem a mesma forma): conflitos vêm de $cf(de, ate); eventos de $EVENTOS */
$EVENTOS = [];
$provDe = function (?Closure $cf) use (&$EVENTOS): ?Closure {
    if ($cf === null) return null;
    return function () use ($cf, &$EVENTOS): object {
        return new class ($cf, $EVENTOS) {
            public function __construct(private Closure $cf, private array $ev) {}
            public function conflitos(array $f): array { return ($this->cf)($f['de'], $f['ate']); }
            public function eventos(array $f): array { return $this->ev; }
        };
    };
};
$sv = fn(?PDO $pipe = null, ?PDO $gcal = null, ?PDO $bling = null, ?Closure $cf = null, ?DateTimeImmutable $ag = null, bool $semPdo = false)
    => new GeralV2($semPdo ? $pipe : ($pipe ?? $pdo), $semPdo ? $gcal : ($gcal ?? $pdo), $semPdo ? $bling : ($bling ?? $pdo), 75, $ag ?? $AGORA, $provDe($cf), $P);
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
$p2 = $prio($r, 'sem_proxima_atividade');
check('P2: negócios 8, 10 e 12 (limite +7 inclusive, vencido entra, sem data não é futura)', $p2['total'] === 3, json_encode($p2));
check('P2: mais antiga = fechamento 01/10', $p2['mais_antiga'] === '2026-10-01');
check('ganhos 7d: 2 / 300.35 pela data do ganho em Brasília', $r['ganhos']['quantidade'] === 2 && $r['ganhos']['valor'] === '300.35', json_encode($r['ganhos']));
$o = $sv()->resumo('ontem'); $m = $sv()->resumo('mes');
check('ganhos ontem: 1 / 200.25 · mês (01–22/11, inclui 15/11 23:59 BR): 5 / 2349.35', $o['ganhos']['quantidade'] === 1 && $o['ganhos']['valor'] === '200.25' && $m['ganhos']['quantidade'] === 5 && $m['ganhos']['valor'] === '2349.35',
    json_encode([$o['ganhos'], $m['ganhos']]));
check('prioridades não mudam com o período', $prio($o, 'atividade_vencida')['total'] === $p1['total'] && $prio($m, 'sem_proxima_atividade')['total'] === $p2['total']);
$abertos = (int) $pdo->query("SELECT COUNT(*) FROM `{$P}pipe_deals` WHERE is_deleted=0 AND status='open'")->fetchColumn();
check('funil: abertos, valor e 1 sem valor', $r['funil']['quantidade'] === $abertos && $r['funil']['sem_valor'] === 1 && $r['funil']['valor'] === number_format(($abertos - 1) * 1000, 2, '.', ''), json_encode($r['funil']));

// ---------- listas reproduzem a contagem ----------
foreach (['atividade_vencida', 'sem_proxima_atividade'] as $id) {
    $l = $sv()->lista($id);
    check("lista $id: total = cartão e itens = total", $l['total'] === $prio($r, $id)['total'] && count($l['itens']) === $l['total'], json_encode([$l['total'], count($l['itens'])]));
}
$l = $sv()->lista('atividade_vencida');
check('lista P1: mais antiga primeiro; referência = atividade vencida mais antiga; dias de atraso', $l['itens'][0]['negocio_id'] === 10 && $l['itens'][0]['referencia'] === '2026-10-15' && $l['itens'][0]['dias'] === 39, json_encode($l['itens'][0]));
check('lista: nomes de organização, responsável, etapa e funil', $l['itens'][0]['organizacao'] === 'Cliente Fictício SA' && $l['itens'][0]['responsavel'] === 'Ana Vendas' && $l['itens'][0]['etapa'] === 'Proposta' && $l['itens'][0]['funil'] === 'Comercial');
check('lista: link do Pipedrive pelo domínio da conta', $l['itens'][0]['link'] === 'https://dshow.pipedrive.com/deal/10');
check('lista: valor exato em texto', $l['itens'][0]['valor'] === '1000.00');
$l2 = $sv()->lista('sem_proxima_atividade');
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
$v = $sv()->lista('atividade_vencida', 1, null, 'valor', 'desc');
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
$pdo->exec("UPDATE `{$P}pipe_accounts` SET status='not_configured'");
$r = $sv(cf: $cf)->resumo('7d');
check('Pipedrive sem conta conectada → aguardando_conexao e TODOS os números do Pipedrive null', $nulos($r) && $r['funil']['estado'] === 'aguardando_conexao' && $prio($r, 'atividade_vencida')['estado'] === 'aguardando_conexao');
check('lista com Pipedrive aguardando → total null, sem itens', ($x = $sv()->lista('atividade_vencida'))['total'] === null && $x['itens'] === [] && $x['estado'] === 'aguardando_conexao');
$pdo->exec("UPDATE `{$P}pipe_accounts` SET status='connected'");
$r = (new GeralV2(null, $pdo, $pdo, 75, $AGORA, $provDe($cf), $P))->resumo('7d');
check('banco do Pipedrive fora → indisponivel, números null; Bling e agenda seguem', $nulos($r) && $r['ganhos']['estado'] === 'indisponivel' && $r['pedidos']['quantidade'] === 4 && $prio($r, 'conflito_agenda')['total'] === 1);
$r = (new GeralV2($pdo, $pdo, null, 75, $AGORA, $provDe($cf), $P))->resumo('7d');
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
    && $prio($r, 'sem_proxima_atividade')['total'] === null && $r['funil']['quantidade'] !== null && $r['ganhos']['quantidade'] === 2);
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

// ---------- CONTRATO DA TELA (proposta da CIMA, 23/11 ~21:30) ----------
require_once dirname($argv[1] ?? "$RAIZ/api/geral/GeralV2.php") . '/GeralV2Contrato.php';
$EVENTOS = [
    ['id' => 'e1', 'calendar_id' => 'a@exemplo.test', 'summary' => 'Reunião A', 'start' => '2026-11-23T14:00:00-03:00', 'end' => '2026-11-23T15:00:00-03:00', 'status' => 'confirmed'],
    ['id' => 'e0', 'calendar_id' => 'a@exemplo.test', 'summary' => 'Café (já passou)', 'start' => '2026-11-23T08:00:00-03:00', 'end' => '2026-11-23T09:00:00-03:00', 'status' => 'confirmed'],
    ['id' => 'e2', 'calendar_id' => 'b@exemplo.test', 'summary' => 'Reunião B', 'start' => '2026-11-23T14:30:00-03:00', 'end' => '2026-11-23T15:30:00-03:00', 'status' => 'confirmed'],
    ['id' => 'e3', 'calendar_id' => 'a@exemplo.test', 'summary' => 'Cancelada', 'start' => '2026-11-23T16:00:00-03:00', 'end' => '2026-11-23T17:00:00-03:00', 'status' => 'cancelled'],
    ['id' => 'e4', 'calendar_id' => 'a@exemplo.test', 'summary' => 'Agora', 'start' => '2026-11-23T09:30:00-03:00', 'end' => '2026-11-23T10:30:00-03:00', 'status' => 'confirmed'],
];
$conf2 = [['tipo' => 'sobreposicao', 'severidade' => 'alta', 'mensagem' => 'x', 'event_ids' => ['e1', 'e2'], 'eventos' => $conf[0]['eventos']]];
$cf2 = fn(string $de, string $ate): array => $conf2;
$K = fn(?Closure $cf = null) => new GeralV2Contrato($sv(cf: $cf ?? $cf2));
$E = ['ok', 'zero', 'parcial', 'desatualizado', 'aguardando', 'erro'];
$c = $K()->resumo('7d');
check('contrato · resumo: chaves da tela', array_keys($c) === ['gerado_em', 'periodo', 'pedidos_bling', 'negocios_ganhos', 'funil_aberto'], implode(',', array_keys($c)));
check('contrato · período com rótulo "16 a 22/11/2026 · 7 dias completos"', $c['periodo'] === ['id' => '7d', 'de' => '2026-11-16', 'ate' => '2026-11-22', 'rotulo' => '16 a 22/11/2026 · 7 dias completos'], json_encode($c['periodo']));
check('contrato · rótulos ontem e mês', $K()->resumo('ontem')['periodo']['rotulo'] === '22/11/2026 · ontem' && $K()->resumo('mes')['periodo']['rotulo'] === '01 a 22/11/2026 · mês até ontem');
check('contrato · rótulo cruzando meses', (new GeralV2Contrato($sv(ag: new DateTimeImmutable('2026-12-03 10:00', $BR))))->resumo('7d')['periodo']['rotulo'] === '26/11 a 02/12/2026 · 7 dias completos');
foreach (['pedidos_bling', 'negocios_ganhos', 'funil_aberto'] as $b)
    check("contrato · $b: estado do enum + ultimo_sucesso + motivo", in_array($c[$b]['estado'], $E, true) && array_key_exists('ultimo_sucesso', $c[$b]) && array_key_exists('motivo', $c[$b]));
$somaQ = array_sum(array_column($c['pedidos_bling']['por_dia'], 'quantidade'));
$somaV = array_sum(array_map(fn($d) => (int) round(((float) $d['valor']) * 100), $c['pedidos_bling']['por_dia']));
check('contrato · por_dia soma EXATAMENTE quantidade e valor', $somaQ === $c['pedidos_bling']['quantidade'] && $somaV === (int) round(((float) $c['pedidos_bling']['valor']) * 100));
check('contrato · inclui_canceladas presente', is_bool($c['pedidos_bling']['inclui_canceladas']));
check('contrato · ganhos com moeda estrangeira: parcial + motivo em português', $c['negocios_ganhos']['estado'] === 'parcial' && $c['negocios_ganhos']['motivo'] === '1 negócio em outra moeda ficou fora do valor.' && $c['negocios_ganhos']['sem_valor'] === 0, json_encode($c['negocios_ganhos']));
check('contrato · funil: sem_valor e valor em texto', $c['funil_aberto']['sem_valor'] === 1 && is_string($c['funil_aberto']['valor']));
$pr = $K()->prioridades();
$pi = array_column($pr['itens'], null, 'id');
check('contrato · prioridades: os 3 ids da CIMA, gravidade 1/2/3', array_keys($pi) === ['atividade_vencida', 'sem_proxima_atividade', 'conflito_agenda'] && $pi['atividade_vencida']['gravidade'] === 1 && $pi['conflito_agenda']['gravidade'] === 3);
check('contrato · P1: quantidade, desde, responsáveis e detalhe', $pi['atividade_vencida']['quantidade'] === 63 && $pi['atividade_vencida']['desde'] === '2026-10-15'
    && $pi['atividade_vencida']['responsaveis'] === 2 && $pi['atividade_vencida']['detalhe'] === 'Pipedrive · 63 negócios distintos', json_encode($pi['atividade_vencida']));
check('contrato · P3: "Google Calendar · 1 conflito hoje"', $pi['conflito_agenda']['detalhe'] === 'Google Calendar · 1 conflito hoje' && $pi['conflito_agenda']['estado'] === 'ok');
foreach (['atividade_vencida', 'sem_proxima_atividade'] as $id) {
    $L = $K()->lista($id, 1, 50, 'prazo', 'asc', null);
    check("contrato · ACEITE da CIMA ($id): total da lista = quantidade da prioridade", $L['total'] === $pi[$id]['quantidade'], json_encode([$L['total'], $pi[$id]['quantidade']]));
}
$L = $K()->lista('atividade_vencida', 1, 50, 'prazo', 'asc', null);
check('contrato · linha: deal_id, titulo, organizacao, responsavel, etapa, prazo, valor, url_pipedrive', array_keys($L['itens'][0]) === ['deal_id', 'titulo', 'organizacao', 'responsavel', 'etapa', 'prazo', 'valor', 'url_pipedrive']
    && $L['itens'][0]['url_pipedrive'] === 'https://dshow.pipedrive.com/deal/10');
check('contrato · critério em texto e responsáveis do conjunto', $L['criterios']['texto'] === 'atividade não concluída com prazo antes de hoje (23/11/2026), ou de hoje com horário já passado · aberto · todos os responsáveis' && count($L['responsaveis']) === 2 && $L['responsaveis'][0]['nome'] === 'Ana Vendas');
$Lr = $K()->lista('atividade_vencida', 1, 50, 'prazo', 'asc', 901);
check('contrato · filtro por responsável no critério', $Lr['criterios']['texto'] === 'atividade não concluída com prazo antes de hoje (23/11/2026), ou de hoje com horário já passado · aberto · Beto Vendas' && $Lr['total'] === 30, json_encode([$Lr['criterios'], $Lr['total']]));
$Ld = $K()->lista('atividade_vencida', 1, 50, 'prazo', 'desc', null);
check('contrato · dir=desc: prazo mais recente primeiro, mesmo total', $Ld['total'] === 63 && $Ld['itens'][0]['prazo'] >= $Ld['itens'][49]['prazo'] && $Ld['itens'][0]['prazo'] === '2026-11-23' && $Ld['itens'][0]['deal_id'] === 2);   // negócio 2: atividade com hora vencida hoje
$Lp = $K()->lista('atividade_vencida', 3, 20, 'responsavel', 'asc', null);
check('contrato · por_pagina=20: página 3 tem 20, 4 páginas', count($Lp['itens']) === 20 && $Lp['paginas'] === 4 && $Lp['por_pagina'] === 20);
$L2 = $K()->lista('sem_proxima_atividade', 1, 50, 'prazo', 'asc', null);
check('contrato · P2: critério com o limite de +7 e "inclui vencidos"', $L2['criterios']['texto'] === 'sem atividade futura · fechamento previsto até 30/11/2026 (inclui vencidos) · aberto · todos os responsáveis');
$ag = $K()->agenda();
check('contrato · agenda: só os próximos de hoje (sem o que já passou, sem cancelada), em ordem, com conflito marcado', array_column($ag['itens'], 'titulo') === ['Agora', 'Reunião A', 'Reunião B']
    && $ag['itens'][1]['conflito'] === true && $ag['itens'][0]['conflito'] === false && $ag['itens'][0]['duracao_min'] === 60 && $ag['url_agenda'] === '#/panel-google-calendar', json_encode($ag['itens']));
$agN = (new GeralV2Contrato(new GeralV2($pdo, $pdo, $pdo, 75, $AGORA, null, $P)))->agenda();
check('contrato · agenda sem provedor: erro e itens null (nunca lista vazia)', $agN['estado'] === 'erro' && $agN['itens'] === null && is_string($agN['motivo']));
$fo = array_column($K()->fontes(), null, 'fonte');
check('contrato · fontes: as 6 da tela, com estados do enum', array_keys($fo) === ['pipedrive', 'bling', 'calendar', 'asaas', 'mercadolivre', 'lojaintegrada']
    && $fo['pipedrive']['estado'] === 'conectada' && $fo['asaas']['estado'] === 'aguardando' && $fo['asaas']['ultimo_sucesso'] === null);
// estados e motivos
$pdo->exec("UPDATE `{$P}pipe_accounts` SET status='not_configured'");
$c = $K()->resumo('7d'); $pr = array_column($K()->prioridades()['itens'], null, 'id');
check('contrato · Pipedrive sem conta: "aguardando", números null, motivo', $c['funil_aberto']['estado'] === 'aguardando' && $c['funil_aberto']['quantidade'] === null && $c['funil_aberto']['motivo'] === 'Pipedrive sem conta conectada.'
    && $pr['atividade_vencida']['quantidade'] === null && $pr['atividade_vencida']['detalhe'] === 'Pipedrive');
check('contrato · fonte pipedrive "aguardando"', array_column($K()->fontes(), null, 'fonte')['pipedrive']['estado'] === 'aguardando');
$pdo->exec("UPDATE `{$P}pipe_accounts` SET status='connected'");
$pdo->exec("UPDATE `{$P}bling_sync_state` SET ultima_execucao_em='2026-11-23 08:00:00'");
$c = $K()->resumo('7d');
check('contrato · Bling velho: "desatualizado" + "Última atualização do Bling às 05:00."', $c['pedidos_bling']['estado'] === 'desatualizado' && $c['pedidos_bling']['motivo'] === 'Última atualização do Bling às 05:00.', json_encode([$c['pedidos_bling']['estado'], $c['pedidos_bling']['motivo']]));
check('contrato · fonte bling "desatualizada"', array_column($K()->fontes(), null, 'fonte')['bling']['estado'] === 'desatualizada');
$pdo->exec("UPDATE `{$P}bling_sync_state` SET ultima_execucao_em='2026-11-23 12:40:00'");
$pdo->exec("UPDATE `{$P}gcal_sync_state` SET last_sync_at='2026-11-23 08:00:00' WHERE calendar_id='b@exemplo.test'");
check('contrato · agenda parcial: "1 de 2 agendas com atualização atrasada."', $K()->agenda()['motivo'] === '1 de 2 agendas com atualização atrasada.');
$pdo->exec("UPDATE `{$P}gcal_sync_state` SET last_sync_at='2026-11-23 12:50:00'");
$c = (new GeralV2Contrato(new GeralV2($pdo, $pdo, null, 75, $AGORA, $provDe($cf2), $P)))->resumo('7d');
check('contrato · Bling fora: "erro", números null, motivo sem detalhe técnico', $c['pedidos_bling']['estado'] === 'erro' && $c['pedidos_bling']['quantidade'] === null && $c['pedidos_bling']['motivo'] === 'Não foi possível ler o Bling agora.');
$pr = array_column((new GeralV2Contrato($sv(cf: fn() => [])))->prioridades()['itens'], null, 'id');
check('contrato · zero confirmado: "zero", quantidade 0, motivo null', $pr['conflito_agenda']['estado'] === 'zero' && $pr['conflito_agenda']['quantidade'] === 0 && $pr['conflito_agenda']['motivo'] === null);
$srcK = (string) file_get_contents(dirname($argv[1] ?? "$RAIZ/api/geral/GeralV2.php") . '/GeralV2Contrato.php');
check('contrato · camada da tela sem SQL nenhum', preg_match('/\b(SELECT|INSERT|UPDATE|DELETE|prepare|query)\b/', $srcK) === 0);

// ---------- ESTADO POR INDICADOR (ACIMA_ESQUERDA, 24/11 · contrato com a CIMA) ----------
$Kag = fn(string $quando) => new GeralV2Contrato($sv(ag: new DateTimeImmutable($quando, $BR), cf: $cf2));
$NOVOS = ['fonte', 'consulta_completa', 'fonte_atualizada_em', 'valor_em', 'lacunas'];
/** Decisão do Jhony (24/11): cartões e linha de fontes saem da MESMA leitura. Checa UMA resposta do painel (nada é consultado de novo aqui). */
$coerentePainel = function (array $pa): string {
    $blocos = ['pedidos_bling' => $pa['resumo']['pedidos_bling'], 'negocios_ganhos' => $pa['resumo']['negocios_ganhos'], 'funil_aberto' => $pa['resumo']['funil_aberto'], 'agenda' => $pa['agenda']];
    foreach ($pa['prioridades']['itens'] as $x) $blocos[$x['id']] = $x;
    $fo = array_column($pa['fontes'], null, 'fonte');
    $CONS = ['pedidos_bling' => 'pedidos', 'negocios_ganhos' => 'ganhos', 'funil_aberto' => 'funil', 'agenda' => 'agenda',
             'atividade_vencida' => 'atividades', 'sem_proxima_atividade' => 'atividades', 'conflito_agenda' => 'conflitos'];
    foreach ($blocos as $id => $b) {
        $f = $fo[$b['fonte']]; $c = array_column($f['consultas'], null, 'id')[$CONS[$id]];
        $soDado = $b['estado'] === 'parcial' && $b['lacunas'] !== [] && array_diff($b['lacunas'], ['sem_valor', 'fora_brl', 'sem_canal']) === [];
        $esperado = in_array($b['estado'], ['ok', 'zero'], true) || $soDado ? 'ok' : $b['estado'];
        if ($c['estado'] !== $esperado && !($CONS[$id] === 'atividades')) return "painel: $id {$b['estado']} e a consulta {$CONS[$id]} {$c['estado']} na MESMA leitura";
        if ($b['estado'] === 'erro' && $f['estado'] !== 'problema') return "painel: $id com problema e a fonte {$f['estado']}";
        if (in_array($b['estado'], ['desatualizado', 'aguardando'], true) && $f['estado'] === 'conectada') return "painel: $id {$b['estado']} e a fonte conectada";
    }
    if ($pa['prioridades']['sem_pendencias'] && $pa['prioridades']['verificacao']['estado'] !== 'completa') return 'painel: sem pendências sem verificação completa';
    // proposta da CIMA (20:0x): rótulos prontos e parte afetada coerentes com o estado
    $RE = ['ok' => 'Atualizado', 'parcial' => 'Dados parciais', 'desatualizado' => 'Desatualizado', 'erro' => 'Com problema', 'aguardando' => 'Aguardando conexão'];
    $vf = $pa['prioridades']['verificacao']['fontes'] ?? null;
    if (!is_array($vf) || array_column($vf, 'fonte') !== ['pipedrive', 'calendar']) return 'painel: verificacao.fontes ausente ou sem Pipedrive e Google Calendar';
    foreach ($vf as $x) if ($x['rotulo_estado'] !== $RE[$x['estado']]) return "painel: verificacao.fontes {$x['fonte']} rótulo ≠ estado";
    if ($pa['prioridades']['verificacao']['estado'] === 'completa' && array_filter($vf, fn($x) => $x['estado'] !== 'ok') !== []) return 'painel: completa com fonte exigida não ok';
    foreach ($pa['fontes'] as $f) {
        $okR = match ($f['estado']) { 'conectada' => ['Atualizado'], 'problema' => ['Com problema'], 'aguardando' => ['Aguardando conexão'], default => ['Desatualizado', 'Dados parciais'] };
        if (!in_array($f['rotulo_estado'] ?? null, $okR, true)) return "painel: fonte {$f['fonte']} {$f['estado']} com rótulo " . var_export($f['rotulo_estado'] ?? null, true);
        if (array_column($f['afetado'] ?? [], 'id') !== array_column(array_filter($f['indicadores'], fn($i) => $i['estado'] !== 'ok'), 'id')) return "painel: fonte {$f['fonte']} afetado ≠ indicadores não ok";
    }
    foreach ($blocos as $id => $b) {
        $soDado = $b['estado'] === 'parcial' && $b['lacunas'] !== [] && array_diff($b['lacunas'], ['sem_valor', 'fora_brl', 'sem_canal']) === [];
        if (!in_array($b['estado'], ['ok', 'zero'], true) && !$soDado && !in_array($id, array_column($fo[$b['fonte']]['afetado'], 'id'), true)) return "painel: $id {$b['estado']} fora do afetado da fonte";
    }
    return '';
};
/** Invariantes de coerência numa visão inteira: "zero" só com fonte conectada e consulta completa; fonte "conectada" só sem indicador pior. */
$coerente = function (GeralV2Contrato $k, string $per = '7d') use ($NOVOS, $coerentePainel): string {
    $r = $k->resumo($per); $prT = $k->prioridades(); $pr = $prT['itens']; $ag = $k->agenda(); $fo = array_column($k->fontes($per), null, 'fonte');
    $blocos = ['pedidos_bling' => $r['pedidos_bling'], 'negocios_ganhos' => $r['negocios_ganhos'], 'funil_aberto' => $r['funil_aberto'], 'agenda' => $ag];
    foreach ($pr as $x) $blocos[$x['id']] = $x;
    foreach ($blocos as $id => $b) {
        foreach ($NOVOS as $c) if (!array_key_exists($c, $b)) return "$id sem o campo $c";
        // zero só com a consulta DELE completa e ok na linha de fontes (a fonte pode estar pior por OUTRA consulta: G3, atividades ≠ ganhos)
        $cZ = array_column($fo[$b['fonte']]['consultas'] ?? [], 'estado', 'id')[['pedidos_bling' => 'pedidos', 'negocios_ganhos' => 'ganhos', 'funil_aberto' => 'funil', 'agenda' => 'agenda',
              'atividade_vencida' => 'atividades', 'sem_proxima_atividade' => 'atividades', 'conflito_agenda' => 'conflitos'][$id]] ?? null;
        if ($b['estado'] === 'zero' && ($b['consulta_completa'] !== true || $cZ !== 'ok')) return "$id zero sem consulta completa/ok";
        if ($b['estado'] === 'zero' && (($b['quantidade'] ?? 0) !== 0)) return "$id zero com quantidade ≠ 0";
        if (in_array($b['estado'], ['desatualizado', 'erro', 'aguardando'], true) && $fo[$b['fonte']]['estado'] === 'conectada') return "$id {$b['estado']} com a fonte conectada";
        if ($b['valor_em'] !== null && $b['valor_em'] !== $b['fonte_atualizada_em']) return "$id valor_em ≠ fonte_atualizada_em";
    }
    foreach ($fo as $f) {
        if (!array_key_exists('indicadores', $f)) return "fonte {$f['fonte']} sem indicadores";
        foreach ($f['indicadores'] as $i) if ($f['estado'] === 'conectada' && $i['estado'] !== 'ok') return "fonte {$f['fonte']} conectada com {$i['id']} {$i['estado']}";
    }
    if (($e = $coerentePainel($k->painel($per))) !== '') return $e;
    // ── PARECER DO MOCKUP (24/11 noite) · 1: verificação das prioridades e "Sem pendências" ──
    foreach ($pr as $x) {
        $v = $x['verificacao'] ?? null;
        if (!is_array($v) || !in_array($v['estado'] ?? null, ['completa', 'parcial', 'nao_verificada'], true)) return "{$x['id']} sem verificação válida";
        if ($v['estado'] === 'completa' && ($x['consulta_completa'] !== true || !in_array($x['estado'], ['ok', 'zero'], true))) return "{$x['id']} completa sem leitura atual/consulta ok";
        if ($x['quantidade'] === null && $v['estado'] !== 'nao_verificada') return "{$x['id']} sem número e verificação {$v['estado']}";
        if ($x['quantidade'] !== null && $v['estado'] === 'nao_verificada') return "{$x['id']} com número e nao_verificada";
        if ($v['estado'] !== 'completa' && $v['fontes_afetadas'] === []) return "{$x['id']} {$v['estado']} sem fonte afetada";
        if ($v['ultima_leitura_valida'] !== $x['fonte_atualizada_em']) return "{$x['id']} última leitura válida ≠ fonte_atualizada_em";
    }
    if (!array_key_exists('sem_pendencias', $prT) || !isset($prT['verificacao']['estado'])) return 'prioridades sem sem_pendencias/verificação no topo';
    $todasZero = array_reduce($pr, fn($a, $x) => $a && $x['quantidade'] === 0, true);
    if ($prT['sem_pendencias'] !== ($prT['verificacao']['estado'] === 'completa' && $todasZero)) return 'sem_pendencias fora da regra (completa E zero itens)';
    if ($prT['verificacao']['estado'] === 'completa' && array_filter($pr, fn($x) => $x['verificacao']['estado'] !== 'completa') !== []) return 'topo completo com item não completo';
    // ── 2: fonte = o pior entre as consultas DELA usadas na tela; conexão separada ──
    $CONS = ['pedidos_bling' => 'pedidos', 'negocios_ganhos' => 'ganhos', 'funil_aberto' => 'funil', 'agenda' => 'agenda',
             'atividade_vencida' => 'atividades', 'sem_proxima_atividade' => 'atividades', 'conflito_agenda' => 'conflitos'];
    foreach ($blocos as $id => $b) {
        $f = $fo[$b['fonte']];
        if (!isset($f['conexao']['estado'], $f['consultas'], $f['parte_afetada'])) return "fonte {$b['fonte']} sem conexão/consultas/parte_afetada";
        $c = array_column($f['consultas'], null, 'id')[$CONS[$id]] ?? null;
        if ($c === null || !in_array($id, $c['indicadores'], true)) return "$id fora das consultas da fonte {$b['fonte']}";
        if ($b['estado'] === 'erro' && $f['estado'] !== 'problema') return "$id com problema e a fonte {$f['estado']}";
        if ($b['estado'] === 'desatualizado' && $f['estado'] === 'conectada') return "$id desatualizado e a fonte atualizada";
        if ($b['estado'] === 'aguardando' && !in_array($f['estado'], ['aguardando', 'problema'], true)) return "$id aguardando e a fonte {$f['estado']}";
        $soDado = $b['estado'] === 'parcial' && $b['lacunas'] !== [] && array_diff($b['lacunas'], ['sem_valor', 'fora_brl', 'sem_canal']) === [];
        if (!in_array($b['estado'], ['ok', 'zero'], true) && !$soDado && !in_array($CONS[$id], $f['parte_afetada'], true)) return "$id {$b['estado']} sem a consulta {$CONS[$id]} na parte afetada";
    }
    foreach ($fo as $f) {
        if ($f['estado'] === 'conectada' && (($f['conexao']['estado'] ?? '') !== 'conectada' || ($f['parte_afetada'] ?? ['x']) !== [])) return "fonte {$f['fonte']} conectada com conexão/consulta afetada";
    }
    // ── 3: o número do cartão = o total da lista = os itens de TODAS as páginas (null ↔ null), na MESMA consulta ──
    foreach ($pr as $x) {
        $todos = 0; $pg = 1;
        do { $L = $k->lista($x['id'], $pg, 50, 'prazo', 'asc', null); $todos += count($L['itens']); $pg++; } while ($L['paginas'] !== null && $pg <= $L['paginas']);
        if ($L['total'] !== $x['quantidade']) return "{$x['id']}: cartão " . var_export($x['quantidade'], true) . ' ≠ lista ' . var_export($L['total'], true);
        if ($x['quantidade'] !== null && $todos !== $x['quantidade']) return "{$x['id']}: cartão {$x['quantidade']} ≠ $todos itens nas páginas";
        if (($L['verificacao']['estado'] ?? null) !== $x['verificacao']['estado']) return "{$x['id']}: verificação da lista ≠ do cartão";
    }
    return '';
};
check('IND · visão normal coerente, com os campos novos em todos os indicadores', ($e = $coerente($K())) === '', $e);
$c = $K()->resumo('7d');
check('IND · funil com 1 negócio sem valor → parcial, lacuna sem_valor, motivo "1 negócio sem valor", soma dos informados', $c['funil_aberto']['estado'] === 'parcial'
    && $c['funil_aberto']['lacunas'] === ['sem_valor'] && $c['funil_aberto']['motivo'] === '1 negócio sem valor' && $c['funil_aberto']['consulta_completa'] === true, json_encode($c['funil_aberto']));
check('IND · ganhos em USD: fora_brl exposto e lacuna fora_brl', $c['negocios_ganhos']['fora_brl'] === 1 && $c['negocios_ganhos']['lacunas'] === ['fora_brl']);
check('IND · fonte e hora por indicador', $c['pedidos_bling']['fonte'] === 'bling' && $c['negocios_ganhos']['fonte'] === 'pipedrive'
    && $c['pedidos_bling']['fonte_atualizada_em'] === '2026-11-23T09:40:00-03:00' && $c['negocios_ganhos']['valor_em'] === '2026-11-23T09:50:00-03:00');
// G1 · todos sem valor nunca vira R$ 0,00; parte sem valor = soma dos informados + parcial
$deal(400, 'won', ['won_time' => '2026-11-05 15:00:00', 'value' => null]);
$deal(401, 'won', ['won_time' => '2026-11-05 16:00:00', 'value' => 0]);
$g = $Kag('2026-11-06 10:00')->resumo('ontem')['negocios_ganhos'];
check('G1 · 2 ganhos, TODOS sem valor → valor null (nunca "0.00"), parcial, "2 negócios sem valor"', $g['quantidade'] === 2 && $g['valor'] === null && $g['sem_valor'] === 2
    && $g['estado'] === 'parcial' && $g['motivo'] === '2 negócios sem valor' && $g['valor_em'] !== null, json_encode($g));
$deal(402, 'won', ['won_time' => '2026-11-05 17:00:00', 'value' => 100]); $deal(403, 'won', ['won_time' => '2026-11-05 18:00:00', 'value' => 50.5]);
$g = $Kag('2026-11-06 10:00')->resumo('ontem')['negocios_ganhos'];
check('G1 · 2 com valor + 2 sem → soma SÓ dos informados (150.50), parcial', $g['quantidade'] === 4 && $g['valor'] === '150.50' && $g['estado'] === 'parcial' && $g['sem_valor'] === 2, json_encode($g));
// G2 · zero só com a consulta completa
$z = fn() => $Kag('2026-11-03 10:00')->resumo('ontem');
check('G2 · base: ontem (02/11) sem ganhos e sem pedidos, tudo em dia → zero nos dois', $z()['negocios_ganhos']['estado'] === 'zero' && $z()['pedidos_bling']['estado'] === 'zero'
    && $z()['negocios_ganhos']['consulta_completa'] === true, json_encode([$z()['negocios_ganhos'], $z()['pedidos_bling']['estado']]));
$ins('pipe_sync_runs', ['run_type' => 'cron', 'entity' => 'deals', 'started_at' => '2026-11-23 09:54:00', 'finished_at' => '2026-11-23 09:55:00', 'status' => 'completed', 'errors' => 3]);
$g = $z()['negocios_ganhos'];
check('G2 · run completed com errors>0 (negócios lidos e não gravados) → NUNCA zero: parcial, sync_incompleta, consulta_completa false', $g['estado'] === 'parcial' && $g['quantidade'] === 0
    && $g['lacunas'] === ['sync_incompleta'] && $g['consulta_completa'] === false && $g['motivo'] === 'A última sincronização do Pipedrive ficou incompleta.', json_encode($g));
check('G2 · e o último sucesso continua o run COMPLETO anterior (09:50), não o de 09:55', $g['fonte_atualizada_em'] === '2026-11-23T09:50:00-03:00');
check('G2 · coerência com o run incompleto', ($e = $coerente($Kag('2026-11-03 10:00'), 'ontem')) === '', $e);
$ins('pipe_sync_runs', ['run_type' => 'cron', 'entity' => 'deals', 'started_at' => '2026-11-23 09:56:00', 'finished_at' => '2026-11-23 09:57:00', 'status' => 'failed']);
check('G2 · último run FALHOU depois de um sucesso recente → parcial, nunca zero', $z()['negocios_ganhos']['estado'] === 'parcial');
$ins('pipe_sync_runs', ['run_type' => 'cron', 'entity' => 'deals', 'started_at' => '2026-11-23 09:58:00', 'finished_at' => null, 'status' => null]);
check('G2 · run em andamento não conta (segue parcial pelo último terminado)', $z()['negocios_ganhos']['estado'] === 'parcial');
$ins('pipe_sync_runs', ['run_type' => 'cron', 'entity' => 'deals', 'started_at' => '2026-11-23 09:58:00', 'finished_at' => '2026-11-23 09:59:00', 'status' => 'completed', 'errors' => 0]);
check('G2 · run completo sem erro depois → zero de novo', $z()['negocios_ganhos']['estado'] === 'zero');
$pdo->exec("UPDATE `{$P}bling_sync_state` SET situacao='atencao'");
$pb = $z()['pedidos_bling'];
check('G2 · Bling "atencao" (leu tudo, não gravou alguns) → NUNCA zero: parcial, consulta_completa false', $pb['estado'] === 'parcial' && $pb['quantidade'] === 0 && $pb['consulta_completa'] === false
    && $pb['lacunas'] === ['sync_incompleta'], json_encode($pb));
check('G2 · Bling "atencao" sem job concluído: o último sucesso NÃO é a tentativa (null)', $pb['ultimo_sucesso'] === null && $pb['fonte_atualizada_em'] === null, json_encode($pb));
$ins('bling_sync_jobs', ['account_id' => 1, 'recurso' => 'pedidos', 'estrategia' => 'incremental', 'situacao' => 'concluido', 'iniciado_em' => '2026-11-23 10:58:00', 'terminado_em' => '2026-11-23 11:00:00']);
$pdo->exec("UPDATE `{$P}bling_sync_state` SET situacao='erro'");
$pb = $K()->resumo('7d')['pedidos_bling'];
check('G2 · Bling última rodada com ERRO às 09:40 e job concluído às 08:00 → último sucesso 08:00 (nunca a tentativa), parcial', $pb['ultimo_sucesso'] === '2026-11-23T08:00:00-03:00'
    && $pb['estado'] === 'parcial' && $pb['quantidade'] === 4, json_encode([$pb['ultimo_sucesso'], $pb['estado']]));
check('G2 · coerência: pedidos parcial → fonte Bling "desatualizada", indicador pedidos_bling parcial', ($e = $coerente($K())) === ''
    && array_column($K()->fontes(), null, 'fonte')['bling']['indicadores'] === [['id' => 'pedidos_bling', 'estado' => 'parcial']], $e);
// escopo ausente: o Bling marca "atencao", mas NADA foi lido
$pdo->exec("UPDATE `{$P}bling_sync_state` SET situacao='atencao'");
$ins('bling_sync_jobs', ['account_id' => 1, 'recurso' => 'pedidos', 'estrategia' => 'incremental', 'situacao' => 'cancelado', 'iniciado_em' => '2026-11-23 12:39:00', 'terminado_em' => '2026-11-23 12:40:00']);
$ins('bling_sync_errors', ['account_id' => 1, 'recurso' => 'pedidos', 'codigo' => 'ESCOPO_AUSENTE', 'mensagem' => 'x', 'http_status' => 403]);
$pb = $K()->resumo('7d')['pedidos_bling'];
check('G2 · ESCOPO AUSENTE com leitura completa anterior → desatualizado (último válido de 08:00), motivo de reautorizar, nunca em dia', $pb['estado'] === 'desatualizado'
    && $pb['ultimo_sucesso'] === '2026-11-23T08:00:00-03:00' && str_starts_with((string) $pb['motivo'], 'O acesso ao Bling não inclui os pedidos') && $pb['consulta_completa'] === false, json_encode($pb));
$pdo->exec("UPDATE `{$P}bling_sync_jobs` SET situacao='falhou' WHERE situacao='concluido'");
$pb = $K()->resumo('7d')['pedidos_bling'];
check('G2 · ESCOPO AUSENTE sem nenhuma leitura completa → erro e números null (nunca 0)', $pb['estado'] === 'erro' && $pb['quantidade'] === null && $pb['valor'] === null, json_encode($pb));
check('G2 · coerência com escopo ausente', ($e = $coerente($K())) === '', $e);
$pdo->exec("UPDATE `{$P}bling_sync_state` SET situacao='ok'"); $pdo->exec("DELETE FROM `{$P}bling_sync_jobs`"); $pdo->exec("DELETE FROM `{$P}bling_sync_errors`");   // tabelas do próprio teste
$pb = $K()->resumo('7d')['pedidos_bling'];
check('G2 · Bling de volta ao normal: só a lacuna do pedido SEM canal (22/11) → parcial "1 pedido ainda sem identificação de canal"', $pb['estado'] === 'parcial'
    && $pb['lacunas'] === ['sem_canal'] && $pb['sem_canal'] === 1 && $pb['motivo'] === '1 pedido ainda sem identificação de canal' && $pb['consulta_completa'] === true, json_encode($pb));
// SEM CANAL (decisão do Jhony, 24/11): "Dados parciais" quando há pedido sem canal identificado
$cOk = $Kag('2026-11-20 10:00')->resumo('ontem')['pedidos_bling'];   // 19/11: 1 pedido com loja 556
check('CANAL · todos os pedidos com canal → ok, sem_canal 0, sem lacuna', $cOk['estado'] === 'ok' && $cOk['sem_canal'] === 0 && $cOk['lacunas'] === [], json_encode($cOk));
$pdo->exec("UPDATE `{$P}bling_sales_orders` SET loja_bling_id='0' WHERE data_pedido='2026-11-19'");
$c0 = $Kag('2026-11-20 10:00')->resumo('ontem')['pedidos_bling'];
check('CANAL · loja "0" antiga conta como sem canal → parcial, número mantido', $c0['estado'] === 'parcial' && $c0['sem_canal'] === 1 && $c0['quantidade'] === 1 && $c0['valor'] === '638341.09', json_encode($c0));
$pdo->exec("UPDATE `{$P}bling_sales_orders` SET loja_bling_id='556' WHERE data_pedido='2026-11-19'");
$pdo->exec("ALTER TABLE `{$P}bling_sales_orders` RENAME COLUMN loja_bling_id TO loja_bling_id_x");   // tabela do próprio teste: como a produção antes da migração BLING LOJA
$cs = $K()->resumo('7d')['pedidos_bling'];
check('CANAL · sem a coluna da loja: nenhum pedido tem canal identificado → sem_canal = quantidade, parcial', $cs['sem_canal'] === $cs['quantidade'] && $cs['quantidade'] > 0 && $cs['estado'] === 'parcial', json_encode([$cs['sem_canal'], $cs['quantidade'], $cs['estado']]));
$pdo->exec("ALTER TABLE `{$P}bling_sales_orders` RENAME COLUMN loja_bling_id_x TO loja_bling_id");
$cz = $Kag('2026-11-03 10:00')->resumo('ontem')['pedidos_bling'];
check('CANAL · 0 pedidos com a fonte em dia continua zero (sem_canal 0)', $cz['estado'] === 'zero' && $cz['sem_canal'] === 0, json_encode($cz));
// G3 · fonte POR INDICADOR: atividades atrasadas não derrubam ganhos e funil
$pdo->exec("UPDATE `{$P}pipe_sync_runs` SET finished_at='2026-11-23 07:00:00' WHERE entity='activities'");
$c = $K()->resumo('7d'); $pi = array_column($K()->prioridades()['itens'], null, 'id'); $fp = array_column($K()->fontes(), null, 'fonte')['pipedrive'];
check('G3 · atividades há 3 h: ganhos e funil seguem com a hora dos NEGÓCIOS; prioridades desatualizadas', $c['negocios_ganhos']['estado'] === 'parcial' && $c['negocios_ganhos']['fonte_atualizada_em'] === '2026-11-23T09:59:00-03:00'
    && $pi['atividade_vencida']['estado'] === 'desatualizado' && $pi['atividade_vencida']['fonte_atualizada_em'] === '2026-11-23T07:00:00-03:00', json_encode([$c['negocios_ganhos']['estado'], $pi['atividade_vencida']['estado']]));
check('G3 · linha de fontes = o PIOR (desatualizada, 07:00) e diz qual indicador', $fp['estado'] === 'desatualizada' && $fp['ultimo_sucesso'] === '2026-11-23T07:00:00-03:00'
    && array_column($fp['indicadores'], 'estado', 'id') === ['negocios_ganhos' => 'ok', 'funil_aberto' => 'ok', 'atividade_vencida' => 'desatualizado', 'sem_proxima_atividade' => 'desatualizado'], json_encode($fp));
check('G3 · coerência com as atividades atrasadas', ($e = $coerente($K())) === '', $e);
$pdo->exec("UPDATE `{$P}pipe_sync_runs` SET finished_at='2026-11-23 09:50:00' WHERE entity='activities'");
// G4 · lista = número: o MESMO CONJUNTO de negócios (não só a contagem), com os casos de fronteira do critério
$deal(500, 'open', ['owner_id' => null]); $atv(500, '2026-11-02', null);                   // sem responsável: entra no número
$deal(501, 'open'); $atv(501, '2026-11-23', '12:59:59'); $atv(501, '2026-11-23', '12:59:59');   // 09:59:59 BR, 2 atividades: entra UMA vez
$deal(502, 'open'); $atv(502, '2026-11-23', '13:00:00');                                    // 10:00:00 BR = agora: ainda não venceu
$deal(503, 'lost'); $atv(503, '2026-11-01', null);                                          // perdido: fora
$esperado = array_merge([1, 2, 10, 500, 501], range(100, 159)); sort($esperado);
$pq = array_column($K()->prioridades()['itens'], null, 'id')['atividade_vencida']['quantidade'];
$todos = []; $pg = 1;
do { $L = $K()->lista('atividade_vencida', $pg, 50, 'responsavel', 'desc', null); $todos = array_merge($todos, array_column($L['itens'], 'deal_id')); $pg++; } while ($pg <= $L['paginas']);
$ord = $todos; sort($ord);
check('G4 · conjunto de TODAS as páginas = conjunto esperado do critério (65 negócios, nenhum repetido)', $ord === $esperado && count($todos) === count(array_unique($todos)), json_encode(array_values(array_diff($esperado, $ord))) . ' / ' . json_encode(array_values(array_diff($ord, $esperado))));
check('G4 · número do cartão = total da lista = total_sem_filtro = 65', $pq === 65 && $L['total'] === 65 && $L['total_sem_filtro'] === 65, json_encode([$pq, $L['total'], $L['total_sem_filtro']]));
$Lf = $K()->lista('atividade_vencida', 1, 50, 'prazo', 'asc', 901);
$l0 = $sv()->lista('atividade_vencida');
check('G4 · Σ responsáveis + sem_responsavel = número do cartão', array_sum(array_column($l0['responsaveis'], 'quantidade')) + $l0['sem_responsavel'] === $pq && $L['sem_responsavel'] === 1);
check('G4 · com filtro: total do responsável e total_sem_filtro = o número do cartão', $Lf['total_sem_filtro'] === $pq && $Lf['total'] < $pq && $Lf['criterios']['texto'] === 'atividade não concluída com prazo antes de hoje (23/11/2026), ou de hoje com horário já passado · aberto · Beto Vendas');
check('G4 · lista traz fonte e frescor do indicador', $L['fonte'] === 'pipedrive' && $L['consulta_completa'] === true && $L['fonte_atualizada_em'] === '2026-11-23T09:50:00-03:00');
check('IND · coerência final', ($e = $coerente($K())) === '', $e);

// ---------- PARECER DO AGENTE DE MOCKUP (24/11 noite): verificação, conexão × consulta, contador = lista, zero real, sem canal ----------
// As invariantes 1–3 rodam em TODOS os cenários pelo $coerente (que o teste já chama em cada estado); aqui, os cenários que faltavam.
$tmpTab = function (string $t) use ($pdo, $P, &$criadas): Closure {   // tira a tabela DO TESTE do lugar (rename) e devolve quem a põe de volta
    $criadas[] = "{$P}{$t}__fora";
    $pdo->exec("RENAME TABLE `{$P}$t` TO `{$P}{$t}__fora`");
    return function () use ($pdo, $P, $t): void { $pdo->exec("RENAME TABLE `{$P}{$t}__fora` TO `{$P}$t`"); };
};
check('MOCK · visão normal coerente com as invariantes novas (verificação, consultas, contador = lista)', ($e = $coerente($K())) === '', $e);
$pT = $K()->prioridades(); $pi = array_column($pT['itens'], null, 'id');
check('MOCK 1 · normal: P1 completa com número, ultima_leitura_valida = 09:50; há itens → sem_pendencias false', $pi['atividade_vencida']['verificacao']['estado'] === 'completa'
    && $pi['atividade_vencida']['verificacao']['ultima_leitura_valida'] === '2026-11-23T09:50:00-03:00' && $pT['sem_pendencias'] === false, json_encode([$pi['atividade_vencida']['verificacao'], $pT['verificacao']]));
// 1a · ZERO REAL nas prioridades: nenhum negócio, nenhum conflito, tudo lido agora → completa e "Sem pendências"
$volta = $tmpTab('pipe_deals'); $pdo->exec("CREATE TABLE `{$P}pipe_deals` LIKE `{$P}pipe_deals__fora`"); $criadas[] = "{$P}pipe_deals";
$Kz = new GeralV2Contrato($sv(cf: fn() => []));
$pT = $Kz->prioridades();
check('MOCK 1 · zero real: os 3 itens 0, verificação completa → sem_pendencias TRUE', $pT['sem_pendencias'] === true && $pT['verificacao']['estado'] === 'completa'
    && array_column($pT['itens'], 'quantidade') === [0, 0, 0] && $pT['verificacao']['fontes_afetadas'] === [], json_encode($pT['verificacao']));
check('MOCK 1 · zero real coerente', ($e = $coerente($Kz)) === '', $e);
// 1b · o mesmo zero com a última leitura das ATIVIDADES incompleta → NUNCA "Sem pendências"
$ins('pipe_sync_runs', ['run_type' => 'cron', 'entity' => 'activities', 'started_at' => '2026-11-23 09:51:00', 'finished_at' => '2026-11-23 09:52:00', 'status' => 'completed', 'errors' => 2]);
$Kz = new GeralV2Contrato($sv(cf: fn() => []));   // instância nova: o serviço guarda as fontes por requisição
$pT = $Kz->prioridades(); $pi = array_column($pT['itens'], null, 'id');
check('MOCK 1 · zero com sincronização das atividades incompleta → parcial, Pipedrive afetado, sem_pendencias FALSE', $pT['sem_pendencias'] === false
    && $pi['atividade_vencida']['quantidade'] === 0 && $pi['atividade_vencida']['verificacao']['estado'] === 'parcial'
    && $pi['atividade_vencida']['verificacao']['fontes_afetadas'] === [['fonte' => 'pipedrive', 'consulta' => 'atividades', 'estado' => 'parcial', 'motivo' => 'A última sincronização do Pipedrive ficou incompleta.']]
    && $pT['verificacao']['estado'] === 'parcial' && $pi['atividade_vencida']['verificacao']['ultima_leitura_valida'] === '2026-11-23T09:50:00-03:00', json_encode([$pT['verificacao'], $pi['atividade_vencida']['verificacao']]));
check('MOCK 1 · zero não confirmado coerente', ($e = $coerente($Kz)) === '', $e);
$pdo->exec("DELETE FROM `{$P}pipe_sync_runs` WHERE entity = 'activities' AND errors = 2");   // linha do próprio teste
$pdo->exec("DROP TABLE `{$P}pipe_deals`"); $volta();
// 1c · Pipedrive sem conta: não verificada; 2 · o funil "aguardando" aparece na linha do Pipedrive
$pdo->exec("UPDATE `{$P}pipe_accounts` SET status = 'not_configured'");
$pT = $K()->prioridades(); $fp = array_column($K()->fontes(), null, 'fonte')['pipedrive']; $fu = $K()->resumo('7d')['funil_aberto'];
check('MOCK 1 · Pipedrive sem conta → P1/P2 nao_verificada, sem_pendencias false, topo parcial (agenda segue verificada)', $pT['sem_pendencias'] === false
    && array_column(array_column($pT['itens'], 'verificacao', 'id'), 'estado', null) !== [] && $pT['itens'][0]['verificacao']['estado'] === 'nao_verificada'
    && $pT['itens'][1]['verificacao']['estado'] === 'nao_verificada' && $pT['verificacao']['estado'] === 'parcial', json_encode(array_column($pT['itens'], 'verificacao', 'id')));
check('MOCK 2 · funil aguardando → linha do Pipedrive "aguardando", conexão aguardando, funil na parte afetada', $fu['estado'] === 'aguardando' && $fp['estado'] === 'aguardando'
    && $fp['conexao'] === ['estado' => 'aguardando', 'motivo' => 'Pipedrive sem conta conectada.'] && in_array('funil', $fp['parte_afetada'], true)
    && array_column($fp['consultas'], 'estado', 'id') === ['ganhos' => 'aguardando', 'funil' => 'aguardando', 'atividades' => 'aguardando'], json_encode($fp));
$Lv = $K()->lista('atividade_vencida', 1, 50, 'prazo', 'asc', null);
check('MOCK 1 · lista sem conta: total null e verificação nao_verificada (igual ao cartão)', $Lv['total'] === null && $Lv['verificacao']['estado'] === 'nao_verificada');
check('MOCK · Pipedrive sem conta coerente', ($e = $coerente($K())) === '', $e);
$pdo->exec("UPDATE `{$P}pipe_accounts` SET status = 'connected'");
// 2a · CONSULTA falha com a fonte em dia (atividades ilegíveis): o cartão é "Com problema" → a fonte NUNCA "Atualizado"
$volta = $tmpTab('pipe_activities');
$pT = $K()->prioridades(); $fp = array_column($K()->fontes(), null, 'fonte')['pipedrive']; $pi = array_column($pT['itens'], null, 'id');
check('MOCK 2 · consulta das atividades falha → P1 erro e nao_verificada; fonte Pipedrive "problema", conexão conectada, parte afetada = atividades', $pi['atividade_vencida']['estado'] === 'erro'
    && $pi['atividade_vencida']['verificacao']['estado'] === 'nao_verificada' && $fp['estado'] === 'problema' && $fp['conexao']['estado'] === 'conectada'
    && $fp['parte_afetada'] === ['atividades'] && array_column($fp['consultas'], 'estado', 'id') === ['ganhos' => 'ok', 'funil' => 'ok', 'atividades' => 'erro'], json_encode($fp));
check('MOCK 2 · consulta das atividades falha: coerente', ($e = $coerente($K())) === '', $e);
$volta();
// 2b · consulta dos pedidos falha com o Bling em dia
$volta = $tmpTab('bling_sales_orders');
$fb = array_column($K()->fontes(), null, 'fonte')['bling']; $pb = $K()->resumo('7d')['pedidos_bling'];
check('MOCK 2 · consulta dos pedidos falha → cartão erro, fonte Bling "problema" (antes: conectada), parte afetada = pedidos', $pb['estado'] === 'erro' && $fb['estado'] === 'problema'
    && $fb['parte_afetada'] === ['pedidos'] && $fb['conexao']['estado'] === 'conectada', json_encode($fb));
check('MOCK 2 · consulta dos pedidos falha: coerente', ($e = $coerente($K())) === '', $e);
$volta();
// 2c · conexão com problema e dado ainda recente: Bling que pede nova autorização; conta Google que pede nova autorização
$pdo->exec("UPDATE `{$P}bling_accounts` SET estado_conexao = 'reauth_necessaria'");
$fb = array_column($K()->fontes(), null, 'fonte')['bling'];
check('MOCK 2 · Bling pede nova autorização → conexão "problema" separada da consulta, fonte nunca "conectada"', $fb['conexao']['estado'] === 'problema' && $fb['estado'] === 'problema'
    && $fb['conexao']['motivo'] === 'O acesso ao Bling precisa ser renovado.', json_encode($fb));
check('MOCK 2 · Bling reautorizar coerente', ($e = $coerente($K())) === '', $e);
$pdo->exec("UPDATE `{$P}bling_accounts` SET estado_conexao = 'conectado'");
$antesG = $pdo->query("SELECT id, connection_status FROM `{$P}gcal_accounts`")->fetchAll(PDO::FETCH_KEY_PAIR);
$pdo->exec("UPDATE `{$P}gcal_accounts` SET connection_status = 'reauth_required'");
$fc = array_column($K()->fontes(), null, 'fonte')['calendar'];
check('MOCK 2 · conta Google pede nova autorização → conexão "problema", fonte "problema"', $fc['conexao']['estado'] === 'problema' && $fc['estado'] === 'problema'
    && $fc['conexao']['motivo'] === 'A conta Google pede nova autorização.', json_encode($fc));
check('MOCK 2 · Google sem autorização coerente', ($e = $coerente($K())) === '', $e);
$stG = $pdo->prepare("UPDATE `{$P}gcal_accounts` SET connection_status = ? WHERE id = ?"); foreach ($antesG as $id => $cs) $stG->execute([$cs, $id]);
// 2d · lacuna do DADO não derruba a fonte: Bling com pedido sem canal = "Dados parciais" no cartão, fonte conectada, consulta ok
$fb = array_column($K()->fontes(), null, 'fonte')['bling']; $pb = $K()->resumo('7d')['pedidos_bling'];
check('MOCK 2 · pedido sem canal: cartão parcial, consulta ok, fonte "conectada"', $pb['estado'] === 'parcial' && $fb['estado'] === 'conectada' && $fb['parte_afetada'] === []
    && $fb['conexao']['estado'] === 'conectada', json_encode([$pb['estado'], $fb]));
// 4 · evidências: ZERO REAL positivo e "Dados parciais · N pedidos sem canal"
$z = $Kag('2026-11-03 10:00'); $zr = $z->resumo('ontem'); $zf = array_column($z->fontes('ontem'), null, 'fonte');
check('MOCK 4 · ZERO REAL: ontem sem pedidos e sem ganhos, consulta completa, fonte atualizada → zero, 0 e "0.00", linha Bling e Pipedrive "conectada"',
    $zr['pedidos_bling']['estado'] === 'zero' && $zr['pedidos_bling']['quantidade'] === 0 && $zr['pedidos_bling']['valor'] === '0.00' && $zr['pedidos_bling']['consulta_completa'] === true
    && $zr['negocios_ganhos']['estado'] === 'zero' && $zr['negocios_ganhos']['quantidade'] === 0 && $zr['negocios_ganhos']['valor'] === '0.00'
    && $zf['bling']['estado'] === 'conectada' && $zf['pipedrive']['consultas'][0] === ['id' => 'ganhos', 'rotulo' => 'Ganhos', 'estado' => 'ok', 'ultimo_sucesso' => $zr['negocios_ganhos']['ultimo_sucesso'], 'motivo' => null, 'indicadores' => ['negocios_ganhos']]
    && $zr['pedidos_bling']['aviso'] === null, json_encode([$zr['pedidos_bling'], $zf['bling']['estado'], $zf['pipedrive']['consultas'][0]]));
check('MOCK 4 · zero real coerente', ($e = $coerente($z, 'ontem')) === '', $e);
$pb = $K()->resumo('7d')['pedidos_bling'];
check('MOCK 4 · 1 pedido sem canal → aviso "Dados parciais · 1 pedido sem canal"', $pb['aviso'] === 'Dados parciais · 1 pedido sem canal', json_encode($pb['aviso']));
$pdo->exec("ALTER TABLE `{$P}bling_sales_orders` RENAME COLUMN loja_bling_id TO loja_bling_id_x");
$pb = $K()->resumo('7d')['pedidos_bling'];
check('MOCK 4 · N pedidos sem canal → aviso "Dados parciais · N pedidos sem canal" (plural, N = sem_canal)', $pb['sem_canal'] > 1 && $pb['aviso'] === "Dados parciais · {$pb['sem_canal']} pedidos sem canal", json_encode([$pb['sem_canal'], $pb['aviso']]));
$pdo->exec("ALTER TABLE `{$P}bling_sales_orders` RENAME COLUMN loja_bling_id_x TO loja_bling_id");
$c = $K()->resumo('7d');
check('MOCK 4 · ganhos/funil: aviso pronto da lacuna de valor', $c['funil_aberto']['aviso'] === 'Dados parciais · Soma dos valores informados · 1 negócio sem valor'
    && $c['negocios_ganhos']['aviso'] === 'Dados parciais · Soma dos valores informados · 1 negócio em outra moeda', json_encode([$c['funil_aberto']['aviso'], $c['negocios_ganhos']['aviso']]));
$pdo->exec("UPDATE `{$P}bling_sync_state` SET situacao='atencao'");
check('MOCK 4 · lacuna da LEITURA (não do dado) → aviso null, o motivo explica', $K()->resumo('7d')['pedidos_bling']['aviso'] === null);
$pdo->exec("UPDATE `{$P}bling_sync_state` SET situacao='ok'");
// ---------- DECISÕES DO JHONY (24/11 noite) ----------
// D1 · o conflito de agenda entra no "Sem pendências": a agenda atrasada impede o "Sem pendências" mesmo com tudo zero
$volta = $tmpTab('pipe_deals'); $pdo->exec("CREATE TABLE `{$P}pipe_deals` LIKE `{$P}pipe_deals__fora`"); $criadas[] = "{$P}pipe_deals";
$pdo->exec("UPDATE `{$P}gcal_sync_state` SET last_sync_at = '2026-11-23 08:00:00' WHERE calendar_id = 'b@exemplo.test'");   // 1 de 2 agendas há 5 h
$Kz = new GeralV2Contrato($sv(cf: fn() => [])); $pT = $Kz->prioridades(); $pi = array_column($pT['itens'], null, 'id');
check('D1 · tudo 0, mas 1 de 2 agendas atrasada → conflito parcial, Google Calendar afetado, sem_pendencias FALSE', $pT['sem_pendencias'] === false
    && $pi['conflito_agenda']['quantidade'] === 0 && $pi['conflito_agenda']['verificacao']['estado'] === 'parcial'
    && $pi['conflito_agenda']['verificacao']['fontes_afetadas'][0]['fonte'] === 'calendar' && $pi['conflito_agenda']['verificacao']['fontes_afetadas'][0]['consulta'] === 'conflitos'
    && $pi['atividade_vencida']['verificacao']['estado'] === 'completa' && $pT['verificacao']['estado'] === 'parcial', json_encode([$pT['verificacao'], $pi['conflito_agenda']['verificacao']]));
check('D1 · coerente', ($e = $coerente($Kz)) === '', $e);
$pdo->exec("UPDATE `{$P}gcal_sync_state` SET last_sync_at = '2026-11-23 12:50:00'");
check('D1 · agenda em dia de novo → sem_pendencias TRUE', (new GeralV2Contrato($sv(cf: fn() => [])))->prioridades()['sem_pendencias'] === true);
$pdo->exec("DROP TABLE `{$P}pipe_deals`"); $volta();
// D2 · Pipedrive com conta EXPIRADA ou INVÁLIDA → "Com problema · pede nova autorização" (como Bling e Google); aguardando só nunca conectada
foreach (['expired', 'invalid'] as $st) {
    $pdo->exec("UPDATE `{$P}pipe_accounts` SET status = '$st'");
    $c = $K()->resumo('7d'); $fp = array_column($K()->fontes(), null, 'fonte')['pipedrive']; $pT = $K()->prioridades();
    check("D2 · conta $st → linha Pipedrive \"problema\", conexão \"pede nova autorização\" (nunca \"aguardando\")", $fp['estado'] === 'problema'
        && $fp['conexao'] === ['estado' => 'problema', 'motivo' => 'A conta do Pipedrive pede nova autorização.'], json_encode($fp));
    check("D2 · conta $st → cartões desatualizados com o último dado (negócios, 09:59), motivo de reautorizar, nunca zero nem aguardando", $c['funil_aberto']['estado'] === 'desatualizado'
        && $c['funil_aberto']['quantidade'] !== null && $c['funil_aberto']['motivo'] === 'A conta do Pipedrive pede nova autorização. Última leitura completa às 09:59.'
        && $c['funil_aberto']['consulta_completa'] === false && $pT['itens'][0]['verificacao']['estado'] === 'parcial' && $pT['sem_pendencias'] === false, json_encode($c['funil_aberto']));
    check("D2 · conta $st coerente", ($e = $coerente($K())) === '', $e);
}
$pdo->exec("UPDATE `{$P}pipe_accounts` SET status = 'not_configured'");
check('D2 · nunca conectada (not_configured) → "aguardando"', array_column($K()->fontes(), null, 'fonte')['pipedrive']['conexao']['estado'] === 'aguardando'
    && $K()->resumo('7d')['funil_aberto']['estado'] === 'aguardando');
$pdo->exec("UPDATE `{$P}pipe_accounts` SET status = 'connected'");
// D3 · UMA leitura: a fonte MUDA no meio (a consulta dos pedidos passa a falhar depois que os cartões foram lidos) → cartão e linha seguem coerentes
$mudou = false;
$cfMuda = function (string $de, string $ate) use (&$mudou, $tmpTab, &$voltaMuda, $conf2): array {   // chamado DEPOIS dos cartões do resumo
    if (!$mudou) { $mudou = true; $voltaMuda = $tmpTab('bling_sales_orders'); }
    return $conf2;
};
$pa = (new GeralV2Contrato($sv(cf: $cfMuda)))->painel('7d');
$fb = array_column($pa['fontes'], null, 'fonte')['bling'];
check('D3 · fonte mudou no meio da leitura: o painel usa o MESMO resultado (pedidos lido antes; linha Bling derivada dele, sem consultar de novo)', $mudou
    && $pa['resumo']['pedidos_bling']['quantidade'] !== null && $fb['consultas'][0]['estado'] === 'ok' && $fb['estado'] === 'conectada', json_encode([$pa['resumo']['pedidos_bling']['estado'], $fb]));
check('D3 · painel coerente com a mudança no meio', ($e = $coerentePainel($pa)) === '', $e);
check('D3 · um instante de leitura só (leitura_em) e o mesmo período', $pa['leitura_em'] === $pa['prioridades']['gerado_em'] && $pa['leitura_em'] === $pa['resumo']['gerado_em'] && $pa['periodo']['id'] === '7d');
$voltaMuda();
// … e o porquê: em chamadas SEPARADAS (resumo.php e depois fontes.php), a mesma mudança deixa cartão e linha divergentes — por isso a tela usa o painel
$antes = $K()->resumo('7d')['pedidos_bling']; $volta = $tmpTab('bling_sales_orders'); $depois = array_column($K()->fontes(), null, 'fonte')['bling']; $volta();
check('D3 · (demonstração) chamadas separadas divergem com a mesma mudança: cartão lido ok, linha depois "problema"', $antes['quantidade'] !== null && $depois['estado'] === 'problema');
// D3 · carga: o painel não consulta os dados duas vezes (a linha de fontes não repete a consulta dos pedidos)
$conta = 0; $pdoConta = new class ($pdo, $conta) extends PDO {
    public function __construct(private PDO $real, private int &$n) {}
    public function prepare(string $q, array $o = []): PDOStatement|false { if (str_contains($q, 'bling_sales_orders') && str_contains($q, 'GROUP BY o.data_pedido')) $this->n++; return $this->real->prepare($q, $o); }
    public function query(string $q, ?int $m = null, mixed ...$a): PDOStatement|false { return $this->real->query($q); }
    public function exec(string $q): int|false { return $this->real->exec($q); }
};
(new GeralV2Contrato(new GeralV2($pdo, $pdo, $pdoConta, 75, $AGORA, $provDe($cf2), $P)))->painel('7d');
check('D3 · o painel lê os pedidos UMA vez (antes: resumo + fontes = 2)', $conta === 1, (string) $conta);
// CIMA (20:0x) · "fonte com problema numa parte (funil)": SÓ a consulta do funil falha (o banco recusa essa consulta); ganhos e atividades leem
$pdoFunil = new class ($pdo) extends PDO {
    public function __construct(private PDO $real) {}
    public function prepare(string $q, array $o = []): PDOStatement|false { if (str_contains($q, "status = 'open'") && str_contains($q, 'SUM(CASE')) throw new PDOException('x'); return $this->real->prepare($q, $o); }
    public function query(string $q, ?int $m = null, mixed ...$a): PDOStatement|false { return $this->real->query($q); }
    public function exec(string $q): int|false { return $this->real->exec($q); }
};
$pa = (new GeralV2Contrato(new GeralV2($pdoFunil, $pdo, $pdo, 75, $AGORA, $provDe($cf2), $P)))->painel('7d');
$fp = array_column($pa['fontes'], null, 'fonte')['pipedrive'];
check('CIMA · só o funil falha → "Pipedrive · Com problema (funil)": rotulo_estado e afetado = [funil erro]; ganhos seguem ok', $pa['resumo']['funil_aberto']['estado'] === 'erro'
    && $pa['resumo']['negocios_ganhos']['quantidade'] !== null && $fp['rotulo_estado'] === 'Com problema'
    && $fp['afetado'] === [['id' => 'funil_aberto', 'rotulo' => 'funil', 'estado' => 'erro']], json_encode([$fp['rotulo_estado'], $fp['afetado']]));
check('CIMA · funil com problema: painel coerente', ($e = $coerentePainel($pa)) === '', $e);
$vf = $K()->prioridades()['verificacao']['fontes'];
check('CIMA · verificacao.fontes no topo: Pipedrive e Google Calendar, rótulo pronto', $vf === [['fonte' => 'pipedrive', 'rotulo' => 'Pipedrive', 'estado' => 'ok', 'rotulo_estado' => 'Atualizado'],
    ['fonte' => 'calendar', 'rotulo' => 'Google Calendar', 'estado' => 'ok', 'rotulo_estado' => 'Atualizado']], json_encode($vf));
// RÓTULO ÚNICO (pedido da CIMA, 24/11 22:4x): "Google Calendar" nas prioridades, na verificação e nas fontes — nunca "Google Agenda" na mesma tela
$pdo->exec("UPDATE `{$P}gcal_sync_state` SET last_sync_at = '2026-11-23 08:00:00'");   // agenda atrasada: os motivos citam a fonte pelo nome
$paN = $K()->painel('7d'); $jsN = json_encode($paN, JSON_UNESCAPED_UNICODE);
$pdo->exec("UPDATE `{$P}gcal_sync_state` SET last_sync_at = '2026-11-23 12:50:00'");
check('NOME · nenhuma ocorrência de "Google Agenda" no painel (prioridades, verificação, fontes, motivos), e "Google Calendar" presente', !str_contains($jsN, 'Google Agenda')
    && str_contains($jsN, 'Última atualização do Google Calendar') && array_column($paN['prioridades']['verificacao']['fontes'], 'rotulo', 'fonte')['calendar'] === 'Google Calendar'
    && str_starts_with(array_column($paN['prioridades']['itens'], 'detalhe', 'id')['conflito_agenda'], 'Google Calendar'), mb_substr($jsN, 0, 0));
// 3 · contraprova embutida: a lista e o cartão chamam a MESMA função de filtro
check('MOCK 3 · cartão e lista contam pela MESMA função (contarPrioridade), sem outro COUNT de prioridade', substr_count($src = (string) file_get_contents($argv[1] ?? "$RAIZ/api/geral/GeralV2.php"), 'contarPrioridade(') === 4
    && preg_match('/SELECT COUNT\(\*\) \$from"\)/', $src) === 0);
check('MOCK · coerência final', ($e = $coerente($K())) === '', $e);

// ---------- só leitura: nenhuma escrita do serviço ----------
$antes = $pdo->query("SELECT SUM(t.n) FROM (SELECT COUNT(*) n FROM `{$P}pipe_deals` UNION ALL SELECT COUNT(*) FROM `{$P}bling_sales_orders` UNION ALL SELECT COUNT(*) FROM `{$P}gcal_sync_state`) t")->fetchColumn();
$src = (string) file_get_contents($argv[1] ?? "$RAIZ/api/geral/GeralV2.php");
check('serviço sem INSERT/UPDATE/DELETE/REPLACE/ALTER/DROP', preg_match('/\b(INSERT|UPDATE|DELETE|REPLACE|ALTER|DROP|TRUNCATE)\b/', $src) === 0);
$sv(cf: $cf)->resumo('mes'); $sv(cf: $cf)->lista('sem_proxima_atividade');
check('nada mudou nas tabelas', $antes === $pdo->query("SELECT SUM(t.n) FROM (SELECT COUNT(*) n FROM `{$P}pipe_deals` UNION ALL SELECT COUNT(*) FROM `{$P}bling_sales_orders` UNION ALL SELECT COUNT(*) FROM `{$P}gcal_sync_state`) t")->fetchColumn());

echo 'teste-geral-v2: ', $ok, ' ok, ', count($falhas), " falha(s)\n";
exit($falhas === [] ? 0 : 1);
