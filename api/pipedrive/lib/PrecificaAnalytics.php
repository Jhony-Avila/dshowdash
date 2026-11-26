<?php
/**
 * Precifica Analytics no Dash (25/11/2026, ACIMA_DIREITA) — leitura das tabelas APP_DSHOW.pa_* que o backend do app grava (migração 036,
 * contrato precifica-analytics.md v1.1 "leitura pelo Dash"). MESMAS regras do endpoint do app:
 *  - só a execução válida mais recente (pa_run estado ok|parcial); linha de outro run_id é velha e nunca é lida;
 *  - agregado ou espelho com > 2 h → `desatualizado · cache_atrasado`; nenhuma execução → `indisponivel · sem_dados`;
 *  - escopo: nível ≥ 80 todos; abaixo, só os vendedores com o e-mail da sessão (nenhum → `indisponivel · sem_vinculo_vendedor`);
 *  - valor NULL em qualquer linha → total NULL ("—", nunca zero); conversão, ticket e ciclo sem base → NULL.
 * Conexão: a do Dash (DSHOWDASH) com GRANT SELECT SÓ nas 5 pa_* (portão de acesso próprio). Sem o GRANT → `indisponivel · sem_acesso`.
 */
declare(strict_types=1);

final class PrecificaAnalytics
{
    public const NIVEL_TODOS = 80;
    public const MAX_DIAS = 731;
    private const ATRASO_S = 7200;
    /** Rótulos dos motivos de perda (os mesmos do app, quotes/service.ts LOSS_LABEL). */
    public const ROTULOS = [
        'PROPOSAL_EXPIRED' => 'Proposta expirada', 'AUTO_CLOSE' => 'Fechado automaticamente', 'PROJECT_CANCELED' => 'Projeto cancelado', 'NO_RESPONSE' => 'Sem resposta',
        'PRICE' => 'Preço', 'DUPLICATE_QUOTE' => 'Orçamento duplicado', 'WON_IN_OTHER_QUOTE' => 'Ganho em outro orçamento', 'RESEARCH' => 'Pesquisa',
        'HIRED_COMPETITOR' => 'Contratou concorrente', 'CANCELED_SAME_DAY' => 'Cancelado no mesmo dia', 'UNFEASIBLE' => 'Inviável', 'LACK_OF_FOLLOWUP' => 'Falta de acompanhamento',
        'CLOSING_DEADLINE' => 'Prazo de fechamento', 'INACTIVE' => 'Inativo', 'SLOW_RESPONSE' => 'Resposta lenta', 'ZERO_VALUE' => 'Valor zerado', 'DUPLICATE_LEAD' => 'Lead duplicado',
        'BIDDING' => 'Licitação', 'ECOMMERCE_REFUND' => 'Reembolso do e-commerce', 'PROJECT_POSTPONED' => 'Projeto adiado', 'INCORRECT_DATA' => 'Dados incorretos',
        'PAYMENT_TERMS' => 'Condições de pagamento', 'OUT_OF_PROFILE' => 'Fora do perfil', 'SHORT_TERM_RENTAL' => 'Locação de curto prazo', 'PRODUCT_MISMATCH' => 'Produto inadequado', 'OTHER' => 'Outro',
    ];

    public function __construct(private ?PDO $pdo, private DateTimeImmutable $agora, private string $schema = 'APP_DSHOW') {}

    private function t(string $n): string { return '`' . $this->schema . '`.`' . $n . '`'; }

    /** @return array<string,mixed> */
    public function ler(string $de, string $ate, int $nivel, string $email, ?string $vendedor): array
    {
        $base = ['periodo' => ['from' => $de, 'to' => $ate], 'escopo' => $nivel >= self::NIVEL_TODOS ? 'todos' : 'meus'];
        if ($this->pdo === null) return $base + ['estado' => 'indisponivel', 'motivos' => ['sem_acesso']];
        try {
            $run = $this->pdo->query("SELECT `id`, UNIX_TIMESTAMP(`gerado_em`) AS g, `estado`, `motivos`, UNIX_TIMESTAMP(`cache_sync_em`) AS cs FROM {$this->t('pa_run')} WHERE `estado` IN ('ok','parcial') ORDER BY `id` DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
            if (!$run) return $base + ['estado' => 'indisponivel', 'motivos' => ['sem_dados']];
            $rid = (int) $run['id'];
            $vs = null;
            if ($nivel < self::NIVEL_TODOS) {
                $st = $this->pdo->prepare("SELECT `vendedor` FROM {$this->t('pa_vendedor')} WHERE `run_id` = ? AND `email` = ?");
                $st->execute([$rid, strtolower(trim($email))]);
                $vs = $email === '' ? [] : array_map('strval', $st->fetchAll(PDO::FETCH_COLUMN));
                if (!$vs) return $base + ['estado' => 'indisponivel', 'motivos' => ['sem_vinculo_vendedor']];
                if ($vendedor !== null && !in_array($vendedor, $vs, true)) return $base + ['estado' => 'indisponivel', 'motivos' => ['fora_do_escopo']];
            }
            if ($vendedor !== null) $vs = [$vendedor];
            [$fv, $pv] = $vs === null ? ['', []] : [' AND `vendedor` IN (' . implode(',', array_fill(0, count($vs), '?')) . ')', $vs];
            $st = $this->pdo->prepare("SELECT DATE_FORMAT(`dia`, '%Y-%m-%d') AS dia, `vendedor`, `criados`, `ganhos`, `ganhos_com_valor`, `valor_ganho_cents`, `ganhos_valor_desconhecido`, `ganhos_sem_valor_financeiro`, `ganhos_garantia`, `perdidos`, `ciclo_dias_soma`, `ciclo_n` FROM {$this->t('pa_dia_vendedor')} WHERE `run_id` = ? AND `dia` BETWEEN ? AND ?" . $fv);
            $st->execute(array_merge([$rid, $de, $ate], $pv)); $dias = $st->fetchAll(PDO::FETCH_ASSOC);
            $st = $this->pdo->prepare("SELECT `motivo`, SUM(`perdidos`) AS n FROM {$this->t('pa_motivo_perda')} WHERE `run_id` = ? AND `dia` BETWEEN ? AND ?" . $fv . ' GROUP BY `motivo` ORDER BY n DESC, `motivo`');
            $st->execute(array_merge([$rid, $de, $ate], $pv)); $mot = $st->fetchAll(PDO::FETCH_ASSOC);
            $st = $this->pdo->prepare("SELECT `vendedor`, `abertos`, `valor_cents`, `abertos_sem_valor_financeiro`, `idade_dias_soma` FROM {$this->t('pa_aberto_vendedor')} WHERE `run_id` = ?" . $fv);
            $st->execute(array_merge([$rid], $pv)); $ab = $st->fetchAll(PDO::FETCH_ASSOC);
            $st = $this->pdo->prepare("SELECT `vendedor`, `nome` FROM {$this->t('pa_vendedor')} WHERE `run_id` = ?" . $fv);
            $st->execute(array_merge([$rid], $pv)); $nomes = $st->fetchAll(PDO::FETCH_KEY_PAIR);
        } catch (PDOException $e) {
            error_log('[precifica-analytics] leitura: ' . get_class($e));   // sem GRANT / tabela ausente → nunca a mensagem
            return $base + ['estado' => 'indisponivel', 'motivos' => ['sem_acesso']];
        }
        return $base + self::montar($run, $dias, $mot, $ab, $nomes, $this->agora->getTimestamp());
    }

    /** Pura (testada direto): estado + somas a partir das linhas cruas. */
    public static function montar(array $run, array $dias, array $mot, array $ab, array $nomes, int $agora): array
    {
        $estado = (string) $run['estado']; $motivos = array_values(array_filter(explode(',', (string) ($run['motivos'] ?? ''))));
        if ($agora - (int) $run['g'] > self::ATRASO_S || $run['cs'] === null || $agora - (int) $run['cs'] > self::ATRASO_S) { $estado = 'desatualizado'; $motivos[] = 'cache_atrasado'; }
        $porDia = []; $porV = [];
        foreach ($dias as $d) { $porDia[$d['dia']][] = $d; $porV[(string) $d['vendedor']][] = $d; }
        ksort($porDia);
        $pv = [];
        foreach ($porV as $v => $ds) $pv[] = ['vendedor' => (string) $v, 'nome' => $v === '-' ? null : ($nomes[$v] ?? null)] + self::somar($ds);
        usort($pv, static fn ($a, $b) => [$b['ganhos'], $a['vendedor']] <=> [$a['ganhos'], $b['vendedor']]);
        $abertos = 0; $valor = 0; $semFin = 0; $idade = 0;
        foreach ($ab as $a) {
            $abertos += (int) $a['abertos']; $semFin += (int) $a['abertos_sem_valor_financeiro']; $idade += (int) $a['idade_dias_soma'];
            $valor = ($valor === null || $a['valor_cents'] === null) ? null : $valor + (int) $a['valor_cents'];
        }
        return [
            'estado' => $estado, 'motivos' => $motivos,
            'atualizado_em' => gmdate('Y-m-d\TH:i:s\Z', (int) $run['g']), 'cache_sincronizado_em' => $run['cs'] === null ? null : gmdate('Y-m-d\TH:i:s\Z', (int) $run['cs']),
            'totais' => self::somar($dias),
            'por_dia' => array_map(static fn ($k, $ds) => ['dia' => $k] + self::somar($ds), array_keys($porDia), array_values($porDia)),
            'por_vendedor' => $pv,
            'motivos_perda' => array_map(static fn ($m) => ['motivo' => $m['motivo'] === '-' ? null : $m['motivo'], 'rotulo' => $m['motivo'] === '-' ? 'Sem motivo' : (self::ROTULOS[$m['motivo']] ?? $m['motivo']), 'perdidos' => (int) $m['n']], $mot),
            'em_aberto' => ['abertos' => $abertos, 'valor_cents' => $valor, 'abertos_sem_valor_financeiro' => $semFin, 'idade_media_dias' => $abertos > 0 ? round($idade / $abertos, 1) : null],
        ];
    }

    /** @param list<array<string,mixed>> $ds */
    public static function somar(array $ds): array
    {
        $s = ['criados' => 0, 'ganhos' => 0, 'perdidos' => 0, 'ganhos_com_valor' => 0, 'valor_ganho_cents' => 0, 'ganhos_valor_desconhecido' => 0, 'ganhos_sem_valor_financeiro' => 0, 'ganhos_garantia' => 0];
        $cs = 0; $cn = 0;
        foreach ($ds as $d) {
            foreach (['criados', 'ganhos', 'perdidos', 'ganhos_com_valor', 'ganhos_valor_desconhecido', 'ganhos_sem_valor_financeiro', 'ganhos_garantia'] as $k) $s[$k] += (int) $d[$k];
            $s['valor_ganho_cents'] = ($s['valor_ganho_cents'] === null || $d['valor_ganho_cents'] === null) ? null : $s['valor_ganho_cents'] + (int) $d['valor_ganho_cents'];
            $cs += (int) $d['ciclo_dias_soma']; $cn += (int) $d['ciclo_n'];
        }
        $base = $s['ganhos'] + $s['perdidos'];
        $s['conversao'] = $base > 0 ? round($s['ganhos'] / $base, 4) : null;
        $s['ticket_cents'] = ($s['valor_ganho_cents'] !== null && $s['ganhos_com_valor'] > 0) ? (int) round($s['valor_ganho_cents'] / $s['ganhos_com_valor']) : null;
        $s['ciclo_medio_dias'] = $cn > 0 ? round($cs / $cn, 1) : null;
        return $s;
    }

    /** Período da URL (AAAA-MM-DD); padrão = últimos 90 dias até hoje (Brasília). null = inválido. @return ?array{0:string,1:string} */
    public static function periodo(?string $de, ?string $ate, DateTimeImmutable $agora): ?array
    {
        $hoje = $agora->setTimezone(new DateTimeZone('America/Sao_Paulo'))->format('Y-m-d');
        $ate ??= $hoje; $de ??= (new DateTimeImmutable($ate))->modify('-89 days')->format('Y-m-d');
        foreach ([$de, $ate] as $x) { $d = DateTimeImmutable::createFromFormat('!Y-m-d', $x); if (!$d || $d->format('Y-m-d') !== $x) return null; }
        if ($de > $ate || (new DateTimeImmutable($de))->diff(new DateTimeImmutable($ate))->days + 1 > self::MAX_DIAS) return null;
        return [$de, $ate];
    }
}
