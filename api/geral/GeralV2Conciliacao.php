<?php
declare(strict_types=1);

/**
 * Conciliação Asaas × Precifica (ACIMA_ESQUERDA, 25/11 noite; janela de casamento 26/11) — SÓ LEITURA. Por EMPRESA e por DIA, compara:
 *   Asaas     = cobranças recebidas (RECEIVED/CONFIRMED/RECEIVED_IN_CASH) pela data de pagamento, valor bruto (e o líquido, quando todas o têm);
 *   Precifica = fin_pcf_recebido_dia do último snapshot utilizável (baixas não estornadas, total_received, dia civil, CNPJ da parcela).
 * Casamento empresa ↔ conta: a identidade do Asaas (HMAC-SHA256 do CNPJ com o segredo, já gravada em <rótulo>.id) contra o HMAC do CNPJ de
 * fin_pcf_empresa — nenhum CNPJ é exibido nem guardado; sem o segredo não há casamento ("—").
 *
 * 26/11 (validação do Jhony com dados reais: a maior parte dos "dias divergentes" era DESCASAMENTO DE DATA, ex. +38.220 em 10/11 e −38.220 em 11/11):
 *   O Precifica chega AGREGADO por empresa e dia (sem a baixa individual nem a referência da cobrança), então o casamento é feito sobre a SOBRA de
 *   cada dia (sobra = Asaas − Precifica), dentro de ±3 DIAS ÚTEIS (seg–sex, fora os feriados nacionais e de SP capital de FERIADOS), por VALOR EXATO em centavos:
 *     1) dia que bate (|sobra| ≤ R$ 1,00) = conciliado no dia;
 *     2) o Asaas inteiro de um dia sem baixa nele = −sobra de outro dia da janela → os dois "conciliados com atraso de N dias úteis";
 *     3) cobrança do Asaas de um dia com sobra ≥ ela, levada ao dia mais perto da janela em que o Precifica sobra ≥ ela → "conciliada com atraso".
 *   Só fica divergente o que sobrar depois disso, com motivo curto: "sem baixa no Precifica", "sem recebimento no Asaas",
 *   "valor diferente: provável juros/multa/desconto" (ou "…: tarifa do Asaas", quando o Precifica lançou o líquido). A leitura usa uma margem
 *   de 7 dias antes da janela para casar o começo dela; os totais e as contagens são SÓ da janela.
 *   Ligação a confirmar: identidade ambígua (mais de uma empresa/conta com o mesmo CNPJ) ou conta do Asaas SEM recebimento no período com o
 *   Precifica tendo baixas → `ligacao_a_confirmar` (as divergências dela ficam fora do total geral até o Jhony confirmar).
 * Desconhecido (empresa sem leitura, sem snapshot, sem par) = null ("—"), nunca 0.
 */
require_once __DIR__ . '/../asaas/AsaasDados.php';

final class GeralV2Conciliacao
{
    private const RECEBIDO = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];
    public const TOLERANCIA_CENTAVOS = 100;
    public const JANELA_DIAS_UTEIS = 3;
    public const MARGEM_DIAS = 7;
    /**
     * 26/11 15:3x · ligações CONFIRMADAS pelo Jhony (empresa do Precifica, pelo nome em fin_pcf_empresa): a regra "Asaas sem recebimento no
     * período com baixas no Precifica" deixa de marcar "ligação a confirmar" para elas, e as divergências entram no total. O CNPJ AMBÍGUO
     * continua sempre "a confirmar". J.W.A. (Asaas) = DSHOW (Precifica): o CNPJ da conta J.W.A. no Asaas é o da DSHOW (confirmado em 26/11).
     */
    public const LIGACOES_CONFIRMADAS = ['DSHOW'];
    /**
     * 26/11: dias NÃO úteis além de sáb/dom — lista FIXA 2025–2027, sem chamada externa. Nacionais: 01/01, Carnaval (seg e ter: bancos fechados),
     * Sexta-feira Santa, 21/04, 01/05, 07/09, 12/10, 02/11, 15/11, 20/11 (nacional desde 2024), 25/12. SP capital: 25/01 (aniversário da cidade),
     * Corpus Christi (municipal) e 09/07 (estadual, vale na capital). Móveis conferidos pela Páscoa (easter_days). Fora de 2025–2027: só sáb/dom.
     * Quarta-feira de Cinzas (meio expediente) conta como dia útil.
     */
    public const FERIADOS = [
        '2025-01-01', '2025-01-25', '2025-03-03', '2025-03-04', '2025-04-18', '2025-04-21', '2025-05-01', '2025-06-19', '2025-07-09', '2025-09-07',
        '2025-10-12', '2025-11-02', '2025-11-15', '2025-11-20', '2025-12-25',
        '2026-01-01', '2026-01-25', '2026-02-16', '2026-02-17', '2026-04-03', '2026-04-21', '2026-05-01', '2026-06-04', '2026-07-09', '2026-09-07',
        '2026-10-12', '2026-11-02', '2026-11-15', '2026-11-20', '2026-12-25',
        '2027-01-01', '2027-01-25', '2027-02-08', '2027-02-09', '2027-03-26', '2027-04-21', '2027-05-01', '2027-05-27', '2027-07-09', '2027-09-07',
        '2027-10-12', '2027-11-02', '2027-11-15', '2027-11-20', '2027-12-25',
    ];

    public function __construct(private readonly PDO $pdo, private readonly string $pastaChaves, private readonly string $p = '',
                                private readonly string $finSchema = 'APP_DSHOW', private readonly DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo'))
    {
        if ($p !== '' && preg_match('/^[a-z0-9_]{1,24}\z/', $p) !== 1) throw new InvalidArgumentException('prefixo inválido');
        if (preg_match('/^[A-Za-z0-9_]{1,64}\z/', $finSchema) !== 1) throw new InvalidArgumentException('schema inválido');
    }

    /** @param list<string> $rotulos  @param int $dias janela: hoje − (dias−1) … hoje */
    public function comparar(array $rotulos, DateTimeImmutable $agora, int $dias = 30): array
    {
        $dias = max(1, min($dias, 90)); $agora = $agora->setTimezone($this->fuso);
        $ate = $agora->format('Y-m-d'); $de = $agora->modify('-' . ($dias - 1) . ' days')->format('Y-m-d');
        $deM = (new DateTimeImmutable($de, $this->fuso))->modify('-' . self::MARGEM_DIAS . ' days')->format('Y-m-d');
        $base = ['gerado_em' => $agora->format(DATE_ATOM), 'janela' => ['de' => $de, 'ate' => $ate], 'tolerancia' => '1.00',
                 'casamento' => ['dias_uteis' => self::JANELA_DIAS_UTEIS, 'por' => 'valor exato da sobra do dia (o Precifica não traz a referência da cobrança)']];

        // Precifica: último snapshot utilizável (sem acesso/sem snapshot → a conciliação inteira fica "—")
        $t = fn(string $x) => "`{$this->finSchema}`.`{$this->p}{$x}`";
        try {
            $snap = $this->pdo->query("SELECT `id`, `gerado_em` FROM {$t('fin_pcf_snapshot')} WHERE `estado` IN ('ok','parcial') ORDER BY `id` DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            error_log('[geral-v2] conciliacao precifica: ' . get_class($e));
            return $base + ['estado' => 'indisponivel', 'motivo' => 'sem_acesso_precifica', 'empresas' => null];
        }
        if ($snap === false) return $base + ['estado' => 'indisponivel', 'motivo' => 'precifica_sem_leitura', 'empresas' => null];
        $emp = $this->pdo->query("SELECT `empresa_id`, `cnpj`, `nome` FROM {$t('fin_pcf_empresa')} ORDER BY `empresa_id`")->fetchAll(PDO::FETCH_ASSOC);

        // casamento pela identidade do Asaas (HMAC do CNPJ); o CNPJ só entra no HMAC, nunca sai daqui
        $chaves = new AsaasChaves($this->pastaChaves);
        $rotDe = [];   // identidade → [rótulos]
        foreach ($rotulos as $r) {
            $f = $this->pastaChaves . '/' . $r . '.id';
            $v = preg_match(AsaasChaves::RE_ROTULO, $r) === 1 && is_file($f) && !is_link($f) ? trim((string) @file_get_contents($f)) : '';
            if (preg_match('/^[0-9a-f]{64}\z/', $v) === 1) $rotDe[$v][] = $r;
        }
        $empDe = [];   // identidade → [empresas do Precifica com esse CNPJ]
        try {
            foreach ($emp as $e) {
                $d = preg_replace('/\D/', '', (string) $e['cnpj']);
                if (strlen((string) $d) !== 14 && strlen((string) $d) !== 11) continue;
                $h = $chaves->identidadeDe(['cpfCnpj' => (string) $d]);
                if (isset($rotDe[$h])) $empDe[$h][] = ['empresa_id' => (int) $e['empresa_id'], 'nome' => $e['nome']];
            }
        } catch (AsaasErro $e) {
            return $base + ['estado' => 'indisponivel', 'motivo' => 'sem_identidade_asaas', 'empresas' => null];
        }
        $par = [];   // rótulo → [empresa_id, nome, ambigua]
        foreach ($empDe as $h => $lista) foreach ($rotDe[$h] as $r) $par[$r] = $lista[0] + ['ambigua' => count($lista) > 1 || count($rotDe[$h]) > 1];

        $sid = (int) $snap['id']; $out = []; $div = 0; $atrasoTot = 0; $aConfirmar = 0;
        $pc = $this->pdo->prepare("SELECT `dia`, SUM(`valor_cents`) AS c, SUM(`valor_cents` IS NULL) AS nulos
                                     FROM {$t('fin_pcf_recebido_dia')} WHERE `snapshot_id` = ? AND `empresa_id` = ? AND `dia` BETWEEN ? AND ? GROUP BY `dia`");
        $in = implode(',', array_fill(0, count(self::RECEBIDO), '?'));
        $ac = $this->pdo->prepare("SELECT `payment_id`, `data_pagamento` AS dia, `valor` AS v, `valor_liquido` AS l
                                     FROM `{$this->p}asaas_cobrancas` WHERE `conta` = ? AND `geracao` = ? AND `presente` = 1 AND `deletada` = 0
                                      AND `status` IN ($in) AND `data_pagamento` BETWEEN ? AND ? ORDER BY `data_pagamento`, `payment_id`");
        foreach ($rotulos as $r) {
            $c = $this->pdo->prepare("SELECT `nome`, `estado`, `geracao_ativa`, `ultima_sync_ok` FROM `{$this->p}asaas_contas` WHERE `conta` = ?");
            $c->execute([$r]); $c = $c->fetch(PDO::FETCH_ASSOC) ?: null;
            $linha = ['conta' => $r, 'nome' => $c['nome'] ?? null, 'empresa_precifica' => $par[$r]['nome'] ?? null, 'estado' => 'ok', 'motivo' => null,
                      'ligacao_a_confirmar' => false, 'resumo' => null, 'dias' => null, 'divergencias' => null];
            if (!isset($par[$r])) { $out[] = ['estado' => 'sem_par', 'motivo' => 'empresa do Asaas sem CNPJ correspondente no Precifica'] + $linha; continue; }
            if ($c === null || $c['estado'] === 'divergente' || $c['geracao_ativa'] === null || $c['ultima_sync_ok'] === null) {
                $out[] = ['estado' => 'indisponivel', 'motivo' => 'Asaas sem leitura completa desta empresa'] + $linha; continue;
            }
            $ac->execute([$r, (int) $c['geracao_ativa'], ...self::RECEBIDO, $deM, $ate]);
            $itens = [];
            foreach ($ac->fetchAll(PDO::FETCH_ASSOC) as $x) $itens[] = ['id' => $x['payment_id'], 'dia' => substr((string) $x['dia'], 0, 10),
                'c' => AsaasValor::centavos((string) $x['v']), 'l' => $x['l'] !== null ? AsaasValor::centavos((string) $x['l']) : null];
            $pc->execute([$sid, $par[$r]['empresa_id'], $deM, $ate]);
            $P = []; foreach ($pc->fetchAll(PDO::FETCH_ASSOC) as $x) $P[substr((string) $x['dia'], 0, 10)] = (int) $x['nulos'] > 0 ? null : (int) $x['c'];
            $res = self::casar($itens, $P, $de, $ate);
            $ligacao = null;
            if ($par[$r]['ambigua']) $ligacao = 'ligação a confirmar: mais de uma empresa/conta com o mesmo CNPJ';
            elseif ($res['resumo']['asaas'] === '0.00' && $res['tem_precifica'] && !in_array(mb_strtoupper(trim((string) ($par[$r]['nome'] ?? ''))), self::LIGACOES_CONFIRMADAS, true)) {
                $ligacao = 'ligação a confirmar: o Asaas desta conta não tem recebimento no período e o Precifica tem baixas (confirme se o CNPJ do Asaas é o desta empresa do Precifica)';
            }
            $nd = $res['resumo']['itens_sem_par'];
            if ($ligacao === null) $div += $nd; else $aConfirmar++;
            $atrasoTot += $res['resumo']['conciliados_com_atraso'];
            $out[] = ['motivo' => $ligacao, 'ligacao_a_confirmar' => $ligacao !== null, 'resumo' => $res['resumo'], 'dias' => $res['dias'], 'divergencias' => $nd] + $linha;
        }
        return $base + ['estado' => 'ok', 'motivo' => null, 'precifica_em' => (new DateTimeImmutable((string) $snap['gerado_em'], new DateTimeZone('UTC')))->setTimezone($this->fuso)->format(DATE_ATOM),
                        'divergencias' => $div, 'conciliados_com_atraso' => $atrasoTot, 'ligacoes_a_confirmar' => $aConfirmar, 'empresas' => $out];
    }

    /** Dias úteis (seg–sex, fora os FERIADOS) andados de $a até $b, com sinal; o dia de partida não conta. */
    public static function diasUteis(string $a, string $b): int
    {
        if ($a === $b) return 0;
        $s = $a < $b ? 1 : -1; $d = new DateTimeImmutable($a); $fim = new DateTimeImmutable($b); $n = 0;
        while ($d != $fim) { $d = $d->modify(($s > 0 ? '+' : '-') . '1 day'); if ((int) $d->format('N') <= 5 && !in_array($d->format('Y-m-d'), self::FERIADOS, true)) $n++; }
        return $s * $n;
    }

    /**
     * O casamento de UMA empresa. $itens = cobranças recebidas do Asaas [id, dia, c (centavos), l (líquido|null)] desde a margem;
     * $P = dia → centavos do Precifica (null = valor desconhecido no dia). Só os dias de [$de, $ate] saem na lista e nos totais.
     * @return array{dias: list<array>, resumo: array, tem_precifica: bool}
     */
    public static function casar(array $itens, array $P, string $de, string $ate): array
    {
        $T = self::TOLERANCIA_CENTAVOS; $J = self::JANELA_DIAS_UTEIS;
        $A = []; $L = []; $semL = []; $porDia = [];
        foreach ($itens as $i) {
            $A[$i['dia']] = ($A[$i['dia']] ?? 0) + $i['c']; $porDia[$i['dia']][] = $i;
            if ($i['l'] === null) $semL[$i['dia']] = true; else $L[$i['dia']] = ($L[$i['dia']] ?? 0) + $i['l'];
        }
        $todos = array_unique(array_merge(array_keys($A), array_keys($P))); sort($todos);
        $sobra = [];   // só dias com o Precifica conhecido entram no casamento
        foreach ($todos as $d) if (!array_key_exists($d, $P) || $P[$d] !== null) $sobra[$d] = ($A[$d] ?? 0) - ($P[$d] ?? 0);
        $pares = []; $nPar = 0;   // dia → [[par, dia do outro lado, dias úteis (+ = baixa depois do recebimento), centavos]]
        $casa = function (string $dA, string $dP, int $v) use (&$sobra, &$pares, &$nPar): void {
            $sobra[$dA] -= $v; $sobra[$dP] += $v; $n = self::diasUteis($dA, $dP); $nPar++;
            $pares[$dA][] = ['par' => $nPar, 'dia' => $dP, 'dias_uteis' => $n, 'valor' => AsaasValor::deCentavos($v)];
            $pares[$dP][] = ['par' => $nPar, 'dia' => $dA, 'dias_uteis' => $n, 'valor' => AsaasValor::deCentavos($v)];
        };
        $perto = function (string $d, Closure $ok) use (&$sobra, $J): ?string {   // o dia da janela mais perto (empate: o mais cedo)
            $melhor = null; $dist = PHP_INT_MAX;
            foreach ($sobra as $o => $s) {
                $o = (string) $o;
                if ($o === $d || !$ok($s)) continue;
                $n = abs(self::diasUteis($d, $o)); if ($n > $J) continue;
                $k = $n * 100 + (new DateTimeImmutable($d))->diff(new DateTimeImmutable($o))->days;
                if ($k < $dist) { $dist = $k; $melhor = $o; }
            }
            return $melhor;
        };
        // 2) o Asaas INTEIRO de um dia sem baixa nele (sobra = tudo o que entrou) = −sobra de outro dia da janela (valor exato). Sobras parciais
        //    (juros num dia, tarifa no outro) NÃO se anulam entre dias: só cobranças inteiras andam (passo 3).
        foreach (array_keys($sobra) as $d) {
            $d = (string) $d; $s = $sobra[$d]; if ($s <= $T || $s !== ($A[$d] ?? 0)) continue;
            $o = $perto($d, fn(int $x) => $x === -$s);
            if ($o !== null) $casa($d, $o, $s);
        }
        // 3) cobrança a cobrança: do dia em que o Asaas sobra para o dia mais perto da janela em que o Precifica sobra ≥ ela
        foreach (array_keys($sobra) as $d) {
            $d = (string) $d; if ($sobra[$d] <= $T) continue;
            $lista = $porDia[$d] ?? []; usort($lista, fn($x, $y) => $y['c'] <=> $x['c'] ?: strcmp((string) $x['id'], (string) $y['id']));
            foreach ($lista as $i) {
                if ($i['c'] <= 0 || $i['c'] > $sobra[$d]) continue;
                $o = $perto($d, fn(int $x) => $x <= -$i['c']);
                if ($o !== null) $casa($d, $o, $i['c']);
                if ($sobra[$d] <= $T) break;
            }
        }
        $dias = []; $tA = 0; $tP = 0; $pDesc = false; $semPar = 0; $parJanela = []; $temP = false;
        foreach ($todos as $d) {
            $d = (string) $d;
            if ($d < $de || $d > $ate) continue;
            $a = $A[$d] ?? 0; $tA += $a;
            $pv = array_key_exists($d, $P) ? $P[$d] : 0;
            if ($pv === null) $pDesc = true; else $tP += $pv;
            if (array_key_exists($d, $P) && ($P[$d] === null || $P[$d] > 0)) $temP = true;
            $aLiq = isset($A[$d]) && !isset($semL[$d]) ? ($L[$d] ?? 0) : null;
            $ps = $pares[$d] ?? [];
            foreach ($ps as $x) $parJanela[$x['par']] = true;
            $resto = $pv === null ? null : $sobra[$d];
            $motivo = null; $divergente = false;
            if ($pv === null) { $motivo = 'valor do Precifica desconhecido no dia'; $divergente = true; }
            elseif (abs($resto) > $T) {
                $divergente = true;
                $motivo = match (true) {
                    $resto > 0 && $pv === 0 => 'sem baixa no Precifica',
                    $resto < 0 && $a === 0 => 'sem recebimento no Asaas',
                    $ps === [] && $aLiq !== null && abs($aLiq - $pv) <= $T => 'valor diferente: tarifa do Asaas (o Precifica lançou o líquido)',
                    default => 'valor diferente: provável juros/multa/desconto',
                };
            } elseif ($ps !== []) {
                $n = 0; foreach ($ps as $x) if (abs($x['dias_uteis']) >= abs($n)) $n = $x['dias_uteis'];
                $u = abs($n) === 1 ? 'dia útil' : 'dias úteis';
                $motivo = $n === 0 ? 'conciliado com diferença de data (fim de semana)'
                        : ($n > 0 ? 'conciliado com atraso de ' . $n . " $u" : 'conciliado: baixa ' . abs($n) . " $u antes do recebimento");
            }
            if ($divergente) $semPar++;
            $dias[] = ['dia' => $d, 'asaas' => AsaasValor::deCentavos($a), 'asaas_liquido' => $aLiq !== null ? AsaasValor::deCentavos($aLiq) : null,
                       'precifica' => $pv !== null ? AsaasValor::deCentavos($pv) : null, 'diferenca' => $pv !== null ? AsaasValor::deCentavos($a - $pv) : null,
                       'restante' => $resto !== null ? AsaasValor::deCentavos($resto) : null, 'divergente' => $divergente, 'motivo' => $motivo,
                       'conciliado_com' => array_map(fn($x) => ['dia' => $x['dia'], 'dias_uteis' => $x['dias_uteis'], 'valor' => $x['valor']], $ps)];
        }
        $resumo = ['asaas' => AsaasValor::deCentavos($tA), 'precifica' => $pDesc ? null : AsaasValor::deCentavos($tP),
                   'diferenca' => $pDesc ? null : AsaasValor::deCentavos($tA - $tP), 'itens_sem_par' => $semPar, 'conciliados_com_atraso' => count($parJanela)];
        return ['dias' => $dias, 'resumo' => $resumo, 'tem_precifica' => $temP];
    }
}
