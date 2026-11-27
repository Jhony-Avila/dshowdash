<?php
declare(strict_types=1);

/**
 * Geral V2 · cartão do Asaas (ACIMA_ESQUERDA, 25/11 noite) — "Recebido hoje / A receber em 7 dias / Vencidas", POR EMPRESA, com o estado de leitura
 * de cada uma. SÓ LEITURA do banco local (asaas_* do DSHOWDASH, alimentado pela sincronização); nunca chama o Asaas.
 * Mesmas regras do resumo do Asaas (AsaasResumo): conta trocada = sem números; nunca sincronizada/erro = sem números com o motivo; última leitura
 * boa há mais de 3 h = "desatualizada" e sem números. Totais SÓ quando todas as empresas estão disponíveis (senão null + total_parcial).
 * Valores em centavos inteiros → texto "1234.56" (nunca float). Desconhecido nunca vira 0.
 */
require_once __DIR__ . '/../asaas/AsaasDados.php';

final class GeralV2Asaas
{
    private const RECEBIDO = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];

    public function __construct(private readonly PDO $pdo, private readonly string $p = '',
                                private readonly DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo'))
    {
        if ($p !== '' && preg_match('/^[a-z0-9_]{1,24}\z/', $p) !== 1) throw new InvalidArgumentException('prefixo inválido');
    }

    /** @param list<string> $rotulos as empresas configuradas (pasta das chaves) */
    public function cartao(array $rotulos, DateTimeImmutable $agora): array
    {
        $agora = $agora->setTimezone($this->fuso);
        $hoje = $agora->format('Y-m-d'); $fim7 = $agora->modify('+6 days')->format('Y-m-d');
        $empresas = []; $todas = $rotulos !== [];
        $tot = ['recebido_hoje' => 0, 'a_receber_7d' => 0, 'vencidas' => 0, 'vencidas_qtd' => 0, 'negativacao' => 0, 'negativacao_qtd' => 0];
        foreach ($rotulos as $r) {
            $e = $this->empresa($r, $agora, $hoje, $fim7);
            $empresas[] = $e;
            if ($e['estado'] !== 'ok') { $todas = false; continue; }
            foreach (['recebido_hoje', 'a_receber_7d', 'vencidas', 'negativacao'] as $k) $tot[$k] += AsaasValor::centavos($e['valores'][$k]);
            $tot['vencidas_qtd'] += $e['valores']['vencidas_qtd']; $tot['negativacao_qtd'] += $e['valores']['negativacao_qtd'];
        }
        $dec = static fn(int $c) => AsaasValor::deCentavos($c);
        return [
            'gerado_em' => $agora->format(DATE_ATOM),
            'janela' => ['hoje' => $hoje, 'a_receber_ate' => $fim7],
            'empresas' => $empresas,
            'total' => $todas ? ['recebido_hoje' => $dec($tot['recebido_hoje']), 'a_receber_7d' => $dec($tot['a_receber_7d']),
                                 'vencidas' => $dec($tot['vencidas']), 'vencidas_qtd' => $tot['vencidas_qtd'],
                                 // 27/11 (decisão do arquiteto): o cartão mostra o MESMO total da tela das Vencidas (OVERDUE + DUNNING_REQUESTED) com a quebra
                                 // "N vencidas · M em negativação"; 'vencidas'/'vencidas_qtd' continuam sendo só OVERDUE (compatível)
                                 'negativacao' => $dec($tot['negativacao']), 'negativacao_qtd' => $tot['negativacao_qtd'],
                                 'vencidas_total' => $dec($tot['vencidas'] + $tot['negativacao']), 'vencidas_total_qtd' => $tot['vencidas_qtd'] + $tot['negativacao_qtd']] : null,
            'total_parcial' => !$todas,
            'regras' => 'recebido hoje = cobranças RECEIVED/CONFIRMED/RECEIVED_IN_CASH com pagamento hoje (valor bruto); a receber 7 dias = PENDING com '
                      . 'vencimento de hoje a +6 dias; vencidas = OVERDUE; em negativação = DUNNING_REQUESTED; vencidas_total = as duas (o total da tela das Vencidas). '
                      . 'Valor bruto da cobrança (sem juros/multa).',
        ];
    }

    /**
     * 25/11 noite · alerta "cobranças vencidas acima de R$ X" POR EMPRESA, no formato AlertOut do app (o mesmo dos alertas do Pipedrive).
     * Só empresas com leitura 'ok' entram (desatualizada/divergente/erro: alerta 'asaas_sem_leitura' info, nunca "sem vencidas").
     * critical quando o vencido passa de 2×X.
     */
    public function alertas(array $rotulos, DateTimeImmutable $agora, int $limiteCentavos): array
    {
        $c = $this->cartao($rotulos, $agora); $quando = gmdate('Y-m-d\TH:i:s\Z', $agora->getTimestamp()); $out = [];
        $a = static fn(string $tipo, string $conta, string $sev, string $titulo, ?string $msg) => ['id' => "asaas:$tipo:$conta", 'type' => "asaas_$tipo",
            'severity' => $sev, 'status' => 'active', 'title' => $titulo, 'message' => $msg, 'target_type' => 'asaas_conta', 'target_id' => $conta,
            'connection' => null, 'environment' => null, 'occurrences' => 1, 'first_seen_at' => null, 'last_seen_at' => $quando, 'acknowledged_at' => null, 'resolved_at' => null];
        foreach ($c['empresas'] as $e) {
            $nome = $e['nome'] ?? $e['conta'];
            if ($e['estado'] !== 'ok') { $out[] = $a('sem_leitura', $e['conta'], 'info', "Asaas: $nome sem leitura atual", 'Motivo: ' . $e['motivo'] . '. Vencidas desconhecidas (não é zero).'); continue; }
            $v = AsaasValor::centavos($e['valores']['vencidas']);
            if ($v > $limiteCentavos) {
                $out[] = $a('vencidas_acima', $e['conta'], $v > 2 * $limiteCentavos ? 'critical' : 'warning', "Asaas: $nome com vencidas acima de R$ " . number_format($limiteCentavos / 100, 2, ',', '.'),
                    $e['valores']['vencidas_qtd'] . ' cobrança(s) vencida(s), R$ ' . number_format($v / 100, 2, ',', '.') . ' (valor bruto, sem juros/multa).');
            }
        }
        return ['gerado_em' => $c['gerado_em'], 'limiar' => AsaasValor::deCentavos($limiteCentavos), 'alertas' => $out, 'contagem' => array_count_values(array_column($out, 'type'))];
    }

    private function empresa(string $r, DateTimeImmutable $agora, string $hoje, string $fim7): array
    {
        $st = $this->pdo->prepare("SELECT `nome`,`estado`,`erro_codigo`,`geracao_ativa`,`ultima_sync_ok` FROM `{$this->p}asaas_contas` WHERE `conta`=?");
        $st->execute([$r]);
        $c = $st->fetch(PDO::FETCH_ASSOC) ?: null;
        $base = ['conta' => $r, 'nome' => $c['nome'] ?? null, 'estado' => 'indisponivel', 'motivo' => null, 'atualizado_em' => null, 'valores' => null];
        if ($c !== null && $c['estado'] === 'divergente') return ['motivo' => 'conta_divergente'] + $base;
        if ($c === null || $c['ultima_sync_ok'] === null || $c['geracao_ativa'] === null) {
            return ['motivo' => $c !== null && $c['estado'] === 'erro' ? 'erro:' . $c['erro_codigo'] : 'nunca_sincronizada'] + $base;
        }
        $ok = new DateTimeImmutable((string) $c['ultima_sync_ok'], $this->fuso);
        if (!AsaasAgenda::padrao()->emDia($ok, $agora->setTimezone($this->fuso))) {   // 27/11: janela pela agenda do cron (3 rodadas previstas)
            return ['estado' => 'desatualizado', 'motivo' => 'desatualizada', 'atualizado_em' => $ok->format(DATE_ATOM)] + $base;
        }
        $pausa = AsaasAgenda::padrao()->emPausa($agora->setTimezone($this->fuso)) ? 'pausa_noturna:' . $ok->format('H:i') : null;
        $in = implode(',', array_fill(0, count(self::RECEBIDO), '?'));
        $q = $this->pdo->prepare("SELECT COALESCE(SUM(CASE WHEN `status` IN ($in) AND `data_pagamento` = ? THEN `valor` END),0) recebido_hoje,
               COALESCE(SUM(CASE WHEN `status`='PENDING' AND `vencimento` BETWEEN ? AND ? THEN `valor` END),0) a_receber_7d,
               COALESCE(SUM(CASE WHEN `status`='OVERDUE' THEN `valor` END),0) vencidas, COALESCE(SUM(`status`='OVERDUE'),0) vencidas_qtd,
               COALESCE(SUM(CASE WHEN `status`='DUNNING_REQUESTED' THEN `valor` END),0) negativacao, COALESCE(SUM(`status`='DUNNING_REQUESTED'),0) negativacao_qtd
             FROM `{$this->p}asaas_cobrancas` WHERE `conta`=? AND `geracao`=? AND `presente`=1 AND `deletada`=0");
        $q->execute([...self::RECEBIDO, $hoje, $hoje, $fim7, $r, (int) $c['geracao_ativa']]);
        $v = $q->fetch(PDO::FETCH_ASSOC);
        $dec = static fn($x) => AsaasValor::deCentavos(AsaasValor::centavos((string) $x));
        return ['estado' => 'ok', 'motivo' => $c['estado'] === 'erro' ? 'ultima_tentativa_falhou:' . $c['erro_codigo'] : $pausa, 'atualizado_em' => $ok->format(DATE_ATOM),
                'valores' => ['recebido_hoje' => $dec($v['recebido_hoje']), 'a_receber_7d' => $dec($v['a_receber_7d']),
                              'vencidas' => $dec($v['vencidas']), 'vencidas_qtd' => (int) $v['vencidas_qtd'],
                              'negativacao' => $dec($v['negativacao']), 'negativacao_qtd' => (int) $v['negativacao_qtd'],
                              'vencidas_total' => $dec(AsaasValor::centavos((string) $v['vencidas']) + AsaasValor::centavos((string) $v['negativacao'])),
                              'vencidas_total_qtd' => (int) $v['vencidas_qtd'] + (int) $v['negativacao_qtd']]] + $base;
    }
}
