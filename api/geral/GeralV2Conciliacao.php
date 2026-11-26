<?php
declare(strict_types=1);

/**
 * Conciliação Asaas × Precifica (ACIMA_ESQUERDA, 25/11 noite) — SÓ LEITURA. Por EMPRESA e por DIA, compara:
 *   Asaas     = cobranças recebidas (RECEIVED/CONFIRMED/RECEIVED_IN_CASH) pela data de pagamento, valor bruto (e o líquido, quando todas o têm);
 *   Precifica = fin_pcf_recebido_dia do último snapshot utilizável (baixas não estornadas, total_received, dia civil, CNPJ da parcela).
 * Casamento empresa ↔ conta: a identidade do Asaas (HMAC-SHA256 do CNPJ com o segredo, já gravada em <rótulo>.id) contra o HMAC do CNPJ de
 * fin_pcf_empresa — nenhum CNPJ é exibido nem guardado; sem o segredo não há casamento ("—").
 * Divergência = |Asaas − Precifica| > R$ 1,00 no dia, com o MOTIVO PROVÁVEL. Desconhecido (empresa sem leitura, sem snapshot, sem par) = null ("—"),
 * nunca 0.
 */
require_once __DIR__ . '/../asaas/AsaasDados.php';

final class GeralV2Conciliacao
{
    private const RECEBIDO = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];
    public const TOLERANCIA_CENTAVOS = 100;

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
        $base = ['gerado_em' => $agora->format(DATE_ATOM), 'janela' => ['de' => $de, 'ate' => $ate], 'tolerancia' => '1.00'];

        // Precifica: último snapshot utilizável (sem acesso/sem snapshot → a conciliação inteira fica "—")
        $t = fn(string $x) => "`{$this->finSchema}`.`{$this->p}{$x}`";
        try {
            $snap = $this->pdo->query("SELECT `id`, `gerado_em` FROM {$t('fin_pcf_snapshot')} WHERE `estado` IN ('ok','parcial') ORDER BY `id` DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            error_log('[geral-v2] conciliacao precifica: ' . get_class($e));
            return $base + ['estado' => 'indisponivel', 'motivo' => 'sem_acesso_precifica', 'empresas' => null];
        }
        if ($snap === false) return $base + ['estado' => 'indisponivel', 'motivo' => 'precifica_sem_leitura', 'empresas' => null];
        $emp = $this->pdo->query("SELECT `empresa_id`, `cnpj`, `nome` FROM {$t('fin_pcf_empresa')}")->fetchAll(PDO::FETCH_ASSOC);

        // casamento pela identidade do Asaas (HMAC do CNPJ); o CNPJ só entra no HMAC, nunca sai daqui
        $chaves = new AsaasChaves($this->pastaChaves);
        $idDe = [];
        foreach ($rotulos as $r) {
            $f = $this->pastaChaves . '/' . $r . '.id';
            $v = preg_match(AsaasChaves::RE_ROTULO, $r) === 1 && is_file($f) && !is_link($f) ? trim((string) @file_get_contents($f)) : '';
            if (preg_match('/^[0-9a-f]{64}\z/', $v) === 1) $idDe[$v] = $r;
        }
        $par = [];   // rótulo → [empresa_id, nome]
        try {
            foreach ($emp as $e) {
                $d = preg_replace('/\D/', '', (string) $e['cnpj']);
                if (strlen((string) $d) !== 14 && strlen((string) $d) !== 11) continue;
                $h = $chaves->identidadeDe(['cpfCnpj' => (string) $d]);
                if (isset($idDe[$h])) $par[$idDe[$h]] = ['empresa_id' => (int) $e['empresa_id'], 'nome' => $e['nome']];
            }
        } catch (AsaasErro $e) {
            return $base + ['estado' => 'indisponivel', 'motivo' => 'sem_identidade_asaas', 'empresas' => null];
        }

        $sid = (int) $snap['id']; $out = []; $div = 0;
        $pc = $this->pdo->prepare("SELECT `dia`, SUM(`valor_cents`) AS c, SUM(`valor_cents` IS NULL) AS nulos, SUM(`baixas`) AS n
                                     FROM {$t('fin_pcf_recebido_dia')} WHERE `snapshot_id` = ? AND `empresa_id` = ? AND `dia` BETWEEN ? AND ? GROUP BY `dia`");
        $in = implode(',', array_fill(0, count(self::RECEBIDO), '?'));
        $ac = $this->pdo->prepare("SELECT `data_pagamento` AS dia, SUM(`valor`) AS v, SUM(`valor_liquido`) AS l, SUM(`valor_liquido` IS NULL) AS sem_l, COUNT(*) AS n
                                     FROM `{$this->p}asaas_cobrancas` WHERE `conta` = ? AND `geracao` = ? AND `presente` = 1 AND `deletada` = 0
                                      AND `status` IN ($in) AND `data_pagamento` BETWEEN ? AND ? GROUP BY `data_pagamento`");
        foreach ($rotulos as $r) {
            $c = $this->pdo->prepare("SELECT `nome`, `estado`, `geracao_ativa`, `ultima_sync_ok` FROM `{$this->p}asaas_contas` WHERE `conta` = ?");
            $c->execute([$r]); $c = $c->fetch(PDO::FETCH_ASSOC) ?: null;
            $linha = ['conta' => $r, 'nome' => $c['nome'] ?? null, 'empresa_precifica' => $par[$r]['nome'] ?? null, 'estado' => 'ok', 'motivo' => null, 'dias' => null, 'divergencias' => null];
            if (!isset($par[$r])) { $out[] = ['estado' => 'sem_par', 'motivo' => 'empresa do Asaas sem CNPJ correspondente no Precifica'] + $linha; continue; }
            if ($c === null || $c['estado'] === 'divergente' || $c['geracao_ativa'] === null || $c['ultima_sync_ok'] === null) {
                $out[] = ['estado' => 'indisponivel', 'motivo' => 'Asaas sem leitura completa desta empresa'] + $linha; continue;
            }
            $ac->execute([$r, (int) $c['geracao_ativa'], ...self::RECEBIDO, $de, $ate]);
            $A = []; foreach ($ac->fetchAll(PDO::FETCH_ASSOC) as $x) $A[$x['dia']] = $x;
            $pc->execute([$sid, $par[$r]['empresa_id'], $de, $ate]);
            $P = []; foreach ($pc->fetchAll(PDO::FETCH_ASSOC) as $x) $P[substr((string) $x['dia'], 0, 10)] = $x;
            $diasL = []; $ndiv = 0;
            $todos = array_unique(array_merge(array_keys($A), array_keys($P))); sort($todos);
            foreach ($todos as $d) {
                $a = isset($A[$d]) ? AsaasValor::centavos((string) $A[$d]['v']) : 0;
                $aLiq = isset($A[$d]) && (int) $A[$d]['sem_l'] === 0 ? AsaasValor::centavos((string) $A[$d]['l']) : null;
                $pDesc = isset($P[$d]) && (int) $P[$d]['nulos'] > 0;
                $pv = isset($P[$d]) && !$pDesc ? (int) $P[$d]['c'] : (isset($P[$d]) ? null : 0);
                $dif = $pv === null ? null : $a - $pv;
                $motivo = null;
                if ($pv === null) $motivo = 'baixa do Precifica com valor desconhecido no dia';
                elseif (abs($dif) > self::TOLERANCIA_CENTAVOS) {
                    $motivo = match (true) {
                        !isset($P[$d]) => 'recebido no Asaas sem baixa no Precifica no dia (baixa pendente ou lançada em outra data)',
                        !isset($A[$d]) => 'baixa no Precifica sem recebimento no Asaas no dia (pago fora do Asaas ou em outra data)',
                        $aLiq !== null && abs($aLiq - $pv) <= self::TOLERANCIA_CENTAVOS => 'o Precifica lançou o LÍQUIDO do Asaas (diferença = tarifa do Asaas)',
                        default => 'valores diferentes no dia (juros/multa/desconto, baixa parcial ou pagamento fora do Asaas)',
                    };
                }
                if ($motivo !== null) $ndiv++;
                $diasL[] = ['dia' => $d, 'asaas' => AsaasValor::deCentavos($a), 'asaas_liquido' => $aLiq !== null ? AsaasValor::deCentavos($aLiq) : null,
                            'precifica' => $pv !== null ? AsaasValor::deCentavos($pv) : null, 'diferenca' => $dif !== null ? AsaasValor::deCentavos($dif) : null,
                            'divergente' => $motivo !== null, 'motivo' => $motivo];
            }
            $div += $ndiv;
            $out[] = ['dias' => $diasL, 'divergencias' => $ndiv] + $linha;
        }
        return $base + ['estado' => 'ok', 'motivo' => null, 'precifica_em' => (new DateTimeImmutable((string) $snap['gerado_em'], new DateTimeZone('UTC')))->setTimezone($this->fuso)->format(DATE_ATOM),
                        'divergencias' => $div, 'empresas' => $out];
    }
}
