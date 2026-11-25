<?php
/**
 * Asaas — CONFERÊNCIA em texto (ACIMA_DIREITA, 23/11/2026): total e detalhe por empresa, a partir do MESMO resumo que o painel lê
 * (AsaasResumo::montar). Serve à 1ª sincronização manual e à conferência contra o painel do Asaas. Só lê o banco local; nunca chama o Asaas;
 * nunca mostra chave, CPF/CNPJ ou e-mail. Sem número = "—" com o motivo (nunca 0).
 */
declare(strict_types=1);

final class AsaasConferencia
{
    private const MOTIVO = [
        'nunca_sincronizada' => 'ainda não sincronizada',
        'desatualizada'      => 'última sincronização boa há mais de 3 h',
        'conta_divergente'   => 'a chave guardada é de OUTRA empresa (identidade não confere) — nada é mostrado',
    ];

    public static function brl(?string $v): string
    {
        if ($v === null) return '—';
        $neg = str_starts_with($v, '-'); [$i, $d] = explode('.', ltrim($v, '-')) + [1 => '00'];
        return ($neg ? '-' : '') . 'R$ ' . number_format((int) $i, 0, ',', '.') . ',' . str_pad(substr($d, 0, 2), 2, '0');
    }

    /** @param array $r saída de AsaasResumo::montar */
    public static function texto(array $r, ?string $so = null): string
    {
        $l = []; $fuso = new DateTimeZone('America/Sao_Paulo');
        foreach ($r['contas'] as $c) {
            if ($so !== null && $c['conta'] !== $so) continue;
            $quando = $c['atualizado_em'] !== null ? (new DateTimeImmutable($c['atualizado_em']))->setTimezone($fuso)->format('d/m H:i') : null;
            $cab = $c['conta'] . ' · ' . ($c['nome'] ?? '(nome ainda não lido)') . ($quando !== null ? " · sincronizada $quando" : '');
            if ($c['disponivel'] !== true) {
                $m = (string) $c['motivo'];
                $l[] = "$cab\n  sem números: " . (self::MOTIVO[$m] ?? (str_starts_with($m, 'erro:') ? 'a última sincronização falhou (' . substr($m, 5) . ')' : $m));
                continue;
            }
            $v = $c['valores'];
            $l[] = "$cab\n"
                . '  saldo ............ ' . self::brl($v['saldo']) . "\n"
                . '  a receber ........ ' . self::brl($v['a_receber']) . "   (cobranças pendentes)\n"
                . '  vencido .......... ' . self::brl($v['vencido']) . ' em ' . $v['vencido_qtd'] . " cobrança(s)\n"
                . '  recebido no mês .. ' . self::brl($v['recebido_mes']) . ' (líquido ' . self::brl($v['recebido_mes_liquido']) . ")\n"
                . ($c['aviso'] !== null ? '  AVISO: ' . $c['aviso'] . "\n" : '');
        }
        if ($so === null) {
            $n = count($r['contas']);
            $sem = count(array_filter($r['contas'], fn($c) => $c['disponivel'] !== true));
            $t = $r['total'];
            $l[] = $t === null
                ? "TOTAL ($n empresa(s)): indisponível — $sem empresa(s) sem números (o total só sai com todas)"
                : "TOTAL ($n empresa(s)): saldo " . self::brl($t['saldo']) . ' · a receber ' . self::brl($t['a_receber']) . ' · vencido ' . self::brl($t['vencido'])
                  . ' · recebido no mês ' . self::brl($t['recebido_mes']);
        }
        return implode("\n", $l) . "\n";
    }
}
