<?php
declare(strict_types=1);

/**
 * /api/asaas/AsaasCobrancas.php — "Cobranças vencidas · Asaas" (resumo, lista e detalhe) · VINHO (ACIMA_ESQUERDA), 26/11/2026. SÓ LEITURA.
 * Recebe o retrato de AsaasResumo::vencidasDetalhadas() (contas em dia + itens) e só CALCULA: nada de banco, nada de rede aqui.
 * Vencida = status OVERDUE ou DUNNING_REQUESTED (negativação pedida). Desconhecido = null ("—"), nunca 0. Dinheiro em centavos inteiros.
 * Documentação do Asaas (docs.asaas.com, 26/11): interestValue = juros e multa a pagar após o vencimento → valor_atualizado = valor + juros_multa
 * quando o Asaas manda; protesto/cobrança externa e histórico de eventos por cobrança NÃO existem na API → null.
 */
require_once __DIR__ . '/AsaasDados.php';

final class AsaasCobrancas
{
    /** Rótulo CURTO da empresa (nosso), pelo identificador da conta em produção. CONFIRMADO pelo Jhony em 26/11 (19:3x). Conta fora do mapa = nome no Asaas. */
    public const ROTULO_CURTO = [
        'zenthra' => 'Zenthra', 'neoled' => 'NeoLED', 'loja-painel-led' => 'Loja do Painel', 'led-lovers' => 'LED Lovers', 'astrelux' => 'Astrelux',
        'gav' => 'GAV', 'lunvox' => 'Lunvox', 'j-carvalho' => 'J. Carvalho', 'a-marques' => 'A. Marques', 'rovic' => 'Rovic',
        'jwa' => 'J.W.A.',   // J.W.A. = DSHOW (ligação confirmada na conciliação)
    ];
    public const FORMA = ['BOLETO' => 'Boleto', 'PIX' => 'Pix', 'CREDIT_CARD' => 'Cartão', 'DEBIT_CARD' => 'Cartão de débito', 'UNDEFINED' => 'A definir',
                          'TRANSFER' => 'Transferência', 'DEPOSIT' => 'Depósito'];
    public const FAIXAS = [['1-30', 1, 30], ['31-90', 31, 90], ['91-180', 91, 180], ['180+', 181, PHP_INT_MAX]];
    public const ORDENS = ['dias', 'valor', 'vencimento'];

    private readonly string $hoje;
    private readonly string $geradoEm;
    private array $empresas = [];

    /** @param array{contas:list<array>, sem_leitura:list<array>, itens:list<array>} $retrato */
    public function __construct(private readonly array $retrato, DateTimeImmutable $agora, private readonly ?string $filtro = null)
    {
        if ($filtro !== null && preg_match(AsaasChaves::RE_ROTULO, $filtro) !== 1) throw new InvalidArgumentException('empresa');
        $this->hoje = $agora->setTimezone(new DateTimeZone('America/Sao_Paulo'))->format('Y-m-d');
        $this->geradoEm = $agora->setTimezone(new DateTimeZone('America/Sao_Paulo'))->format(DATE_ATOM);   // hora da conferência (o contrato v1 já previa)
        foreach (array_merge($retrato['contas'], $retrato['sem_leitura']) as $c) $this->empresas[$c['conta']] = self::rotulo($c['conta'], $c['nome'] ?? null);
    }

    public static function rotulo(string $conta, ?string $nome): string { return self::ROTULO_CURTO[$conta] ?? ($nome !== null && $nome !== '' ? $nome : $conta); }

    private function empresa(string $conta): array { return ['conta' => $conta, 'rotulo' => $this->empresas[$conta] ?? $conta]; }

    private function cobertura(): array
    {
        $sem = array_values(array_filter($this->retrato['sem_leitura'], fn($c) => $this->filtro === null || $c['conta'] === $this->filtro));
        return ['completo' => $sem === [], 'empresas_sem_leitura' => array_map(fn($c) => ['empresa' => $this->empresa($c['conta']), 'motivo' => $c['motivo']], $sem)];
    }

    /** Itens normalizados (filtro de empresa aplicado), cada um com centavos e dias calculados. */
    private function itens(): array
    {
        $out = [];
        foreach ($this->retrato['itens'] as $x) {
            if ($this->filtro !== null && $x['conta'] !== $this->filtro) continue;
            $v = AsaasValor::centavos((string) $x['valor']);
            $j = $x['juros_multa'] !== null ? AsaasValor::centavos((string) $x['juros_multa']) : null;
            $venc = $x['vencimento'] !== null ? substr((string) $x['vencimento'], 0, 10) : null;
            $dias = $venc !== null ? (int) (new DateTimeImmutable($venc))->diff(new DateTimeImmutable($this->hoje))->format('%r%a') : null;
            $out[] = ['id' => $x['payment_id'], 'conta' => $x['conta'], 'cliente_id' => $x['cliente_id'], 'cliente_nome' => $x['cliente_nome'], 'c' => $v, 'j' => $j,
                      'venc' => $venc, 'dias' => $dias, 'x' => $x];
        }
        return $out;
    }

    private function item(array $i): array
    {
        $x = $i['x'];
        return ['id' => $i['id'], 'empresa' => $this->empresa($i['conta']), 'cliente_nome' => $i['cliente_nome'], 'vencimento' => $i['venc'],
                'valor_original' => AsaasValor::deCentavos($i['c']), 'valor_atualizado' => $i['j'] !== null ? AsaasValor::deCentavos($i['c'] + $i['j']) : null,
                'juros_multa' => $i['j'] !== null ? AsaasValor::deCentavos($i['j']) : null, 'dias_atraso' => $i['dias'],
                'forma' => ['codigo' => $x['billing_type'], 'rotulo' => self::FORMA[$x['billing_type'] ?? ''] ?? null],
                'situacao' => ['status_asaas' => $x['status'], 'negativacao' => $x['status'] === 'DUNNING_REQUESTED', 'protesto' => null, 'cobranca_externa' => null]];
    }

    private static function soma(array $l): array { return ['valor' => AsaasValor::deCentavos(array_sum(array_column($l, 'c'))), 'cobrancas' => count($l)]; }

    public function resumo(): array
    {
        $it = $this->itens();
        $clientes = []; foreach ($it as $i) if ($i['cliente_id'] !== null) $clientes[$i['conta'] . '|' . $i['cliente_id']] = true;
        $mes = substr($this->hoje, 0, 7);
        $d30 = (new DateTimeImmutable($this->hoje))->modify('-30 days')->format('Y-m-d');
        $m3 = (new DateTimeImmutable($this->hoje))->modify('-3 months')->format('Y-m-d');
        $faixas = [];
        foreach (self::FAIXAS as [$nome, $de, $ate]) $faixas[] = ['faixa' => $nome] + self::soma(array_filter($it, fn($i) => $i['dias'] !== null && $i['dias'] >= $de && $i['dias'] <= $ate));
        $ord = $it; usort($ord, fn($a, $b) => [$b['c'], $b['dias'] ?? -1, $a['id']] <=> [$a['c'], $a['dias'] ?? -1, $b['id']]);
        $maior = $ord[0] ?? null;
        $porCli = [];
        foreach ($it as $i) {
            $k = $i['conta'] . '|' . ($i['cliente_id'] ?? ('sem:' . $i['id']));
            $porCli[$k] ??= ['cliente_nome' => $i['cliente_nome'], 'empresa' => $this->empresa($i['conta']), 'c' => 0, 'cobrancas' => 0];
            $porCli[$k]['c'] += $i['c']; $porCli[$k]['cobrancas']++;
        }
        usort($porCli, fn($a, $b) => [$b['c'], $b['cobrancas']] <=> [$a['c'], $a['cobrancas']]);
        return ['gerado_em' => $this->geradoEm, 'empresa' => $this->filtro !== null ? $this->empresa($this->filtro) : null] + $this->cobertura() + [
            'total' => self::soma($it) + ['clientes' => count($clientes)],
            'por_vencimento' => ['mes_atual' => self::soma(array_filter($it, fn($i) => $i['venc'] !== null && str_starts_with($i['venc'], $mes))),
                                 'ultimos_30_dias' => self::soma(array_filter($it, fn($i) => $i['venc'] !== null && $i['venc'] >= $d30)),
                                 'ultimos_3_meses' => self::soma(array_filter($it, fn($i) => $i['venc'] !== null && $i['venc'] >= $m3))],
            'faixas' => $faixas,
            'sem_vencimento' => count(array_filter($it, fn($i) => $i['venc'] === null)),
            'maior' => $maior === null ? null : ['id' => $maior['id'], 'empresa' => $this->empresa($maior['conta']), 'cliente_nome' => $maior['cliente_nome'],
                                                 'valor' => AsaasValor::deCentavos($maior['c']), 'dias_atraso' => $maior['dias']],
            'top_clientes' => array_map(fn($c) => ['cliente_nome' => $c['cliente_nome'], 'empresa' => $c['empresa'], 'valor' => AsaasValor::deCentavos($c['c']),
                                                   'cobrancas' => $c['cobrancas']], array_slice($porCli, 0, 5)),
        ];
    }

    public function lista(string $ordem = 'dias', string $dir = 'desc', int $pagina = 1, int $porPagina = 50): array
    {
        if (!in_array($ordem, self::ORDENS, true) || !in_array($dir, ['asc', 'desc'], true) || $pagina < 1 || $porPagina < 1 || $porPagina > 200) throw new InvalidArgumentException('lista');
        $it = $this->itens();
        $chave = fn($i) => match ($ordem) { 'dias' => $i['dias'] ?? -1, 'valor' => $i['c'], 'vencimento' => $i['venc'] ?? '9999-99-99' };
        usort($it, fn($a, $b) => ($dir === 'asc' ? $chave($a) <=> $chave($b) : $chave($b) <=> $chave($a)) ?: strcmp($a['id'], $b['id']));
        return ['total' => count($it), 'pagina' => $pagina, 'por_pagina' => $porPagina] + $this->cobertura()
             + ['itens' => array_map(fn($i) => $this->item($i), array_slice($it, ($pagina - 1) * $porPagina, $porPagina))];
    }

    /** @return ?array null = não é uma vencida lida (a rota devolve 404) */
    public function detalhe(string $id): ?array
    {
        if (preg_match('/^[A-Za-z0-9_-]{1,40}\z/', $id) !== 1) throw new InvalidArgumentException('id');
        $it = $this->itens();
        $achados = array_values(array_filter($it, fn($i) => $i['id'] === $id));
        if (count($achados) !== 1) return null;   // ausente, ou o mesmo id em 2 empresas sem o filtro (pedir &empresa=)
        $a = $achados[0]; $x = $a['x'];
        $outras = array_values(array_filter($it, fn($i) => $i['id'] !== $id && $i['conta'] === $a['conta'] && $a['cliente_id'] !== null && $i['cliente_id'] === $a['cliente_id']));
        usort($outras, fn($p, $q) => [$q['dias'] ?? -1, $p['id']] <=> [$p['dias'] ?? -1, $q['id']]);
        return $this->item($a) + ['cliente_codigo' => $a['cliente_id'], 'descricao' => null, 'numero_fatura' => $x['invoice_number'], 'link_fatura' => $x['invoice_url'],
            'criada_em' => $x['data_criacao'] !== null ? substr((string) $x['data_criacao'], 0, 10) : null,
            'vencimento_original' => $x['vencimento_original'] !== null ? substr((string) $x['vencimento_original'], 0, 10) : null, 'eventos' => null,
            'outras_do_cliente' => self::soma($outras) + ['itens' => array_map(fn($i) => ['id' => $i['id'], 'vencimento' => $i['venc'],
                'valor_original' => AsaasValor::deCentavos($i['c']), 'dias_atraso' => $i['dias']], $outras)]];
    }
}
