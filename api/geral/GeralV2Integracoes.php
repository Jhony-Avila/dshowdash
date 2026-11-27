<?php
declare(strict_types=1);

/**
 * Tela "Integrações" (status, SEM SEGREDO) — ACIMA_ESQUERDA, 25/11 noite. Para cada integração: estado, última sincronização boa,
 * o erro em 1 linha (texto NOSSO, nunca a mensagem crua da API externa) e o próximo passo. Nunca lê nem devolve chave, token ou .env.
 *   Pipedrive · Bling · Google (Calendar) → o MESMO cálculo de fonte da Geral V2 (GeralV2::fonte)
 *   Asaas     → asaas_contas (estado por empresa da sincronização)
 *   Precifica → APP_DSHOW.fin_pcf_snapshot (último snapshot do coletor; precisa do GRANT do portão GERAL-V2-PRECIFICA-ACESSO)
 *   Meta      → não há integração no Dash (estado real: nao_integrado)
 * Estados: ok · atrasado · com_problema · aguardando · sem_acesso · nao_integrado. Desconhecido nunca vira "ok".
 */
require_once __DIR__ . '/GeralV2.php';
require_once __DIR__ . '/../asaas/AsaasDados.php';
require_once __DIR__ . '/../rdstation/RdStation.php';
require_once __DIR__ . '/../asaas/AsaasCobrancas.php';

final class GeralV2Integracoes
{
    private const PRECIFICA_ATRASO_MIN = 60;

    public function __construct(private readonly GeralV2 $g, private readonly ?PDO $dash, private readonly DateTimeImmutable $agora,
                                private readonly string $p = '', private readonly string $finSchema = 'APP_DSHOW', private readonly ?RdSegredos $rd = null) {}

    public function lista(): array
    {
        return ['gerado_em' => $this->agora->format(DATE_ATOM), 'integracoes' => [
            $this->deFonte('pipedrive', 'Pipedrive', 'pipedrive'),
            $this->deFonte('bling', 'Bling', 'bling'),
            $this->deFonte('google', 'Google (Agenda)', 'google_calendar'),
            $this->asaas(),
            $this->precifica(),
            $this->rdstation(),   // 26/11: RD Station Marketing (status sem segredo; ação "Conectar")
            ['id' => 'meta', 'nome' => 'Meta (Facebook/Instagram Ads)', 'estado' => 'nao_integrado', 'ultima_sincronizacao' => null,
             'erro' => null, 'proximo_passo' => 'Não há integração com a Meta no Dash: decidir se e quando integrar.'],
        ]];
    }

    /** INT-001: recurso (texto nosso) por integração */
    private const RECURSO = ['pipedrive' => 'Negócios e atividades', 'bling' => 'Pedidos de venda', 'google' => 'Agenda (calendários)', 'asaas' => 'Cobranças e recebimentos',
        'precifica' => 'Recebimentos (financeiro)', 'rdstation' => 'Marketing (funil e conversões)', 'meta' => 'Anúncios (Facebook/Instagram)',
        'google_analytics' => 'Tráfego do site', 'google_ads' => 'Anúncios do Google', 'outlook' => 'E-mail e agenda (Microsoft)'];

    /**
     * 26/11 INT-001 · Central de Integrações (contrato v2, ADITIVO: o v1 acima continua para a Geral). Por integração: estado (os do v1 + parcial e
     * desconhecido), ultima_tentativa (inclui falha) SEPARADA de ultimo_sucesso, cobertas/esperadas (Asaas: empresas; Google: calendários; demais null),
     * recurso, erro + proximo_passo (texto nosso), acao (só RD) e, no Asaas, as contas. null = a origem não comprova; nunca "ok" sem prova.
     */
    public function listaV2(): array
    {
        $v1 = array_column($this->lista()['integracoes'], null, 'id');
        $out = [];
        foreach (['pipedrive' => 'pipedrive', 'bling' => 'bling', 'google' => 'google_calendar'] as $id => $fonte) {
            $x = $v1[$id]; $f = $this->g->fonte($fonte); $d = $this->g->detalheFonte($fonte);
            $estado = $f['estado'] === 'parcial' && $x['estado'] === 'com_problema' ? 'parcial' : $x['estado'];   // v1 junta parcial em com_problema; a v2 separa
            $out[] = $this->v2($x, $estado, $d['tentativa'], $x['ultima_sincronizacao'], $d['cobertas'], $d['esperadas']);
        }
        $out[] = $this->asaasV2($v1['asaas']);
        $out[] = $this->precificaV2($v1['precifica']);
        $rd = $v1['rdstation']; $t = null;
        try { $e = ($this->rd ?? RdSegredos::padrao())->estado(); $t = is_string($e['ultima_tentativa'] ?? null) ? (new DateTimeImmutable($e['ultima_tentativa']))->format(DATE_ATOM) : null; }
        catch (Throwable $e) { error_log('[geral-v2] integracoes v2 rd: ' . get_class($e)); }
        $out[] = $this->v2($rd, $rd['estado'], $t, $rd['ultima_sincronizacao'], null, null);
        $out[] = $this->v2($v1['meta'], 'nao_integrado', null, null, null, null);
        foreach (['google_analytics' => 'Google Analytics', 'google_ads' => 'Google Ads', 'outlook' => 'Outlook'] as $id => $nome)
            $out[] = $this->v2(['id' => $id, 'nome' => $nome, 'erro' => 'O Dash ainda não lê o estado desta integração: sem prova, o estado é desconhecido.',
                                'proximo_passo' => 'Ligar a leitura do estado desta integração (degrau seguinte da Central).'], 'desconhecido', null, null, null, null);
        return ['versao' => 2, 'gerado_em' => $this->agora->format(DATE_ATOM), 'integracoes' => $out];
    }

    private function v2(array $x, string $estado, ?string $tentativa, ?string $sucesso, ?int $cobertas, ?int $esperadas, ?array $contas = null): array
    {
        $r = ['id' => $x['id'], 'nome' => $x['nome'], 'recurso' => self::RECURSO[$x['id']] ?? null, 'estado' => $estado,
              'ultima_tentativa' => $tentativa, 'ultimo_sucesso' => $sucesso, 'cobertas' => $cobertas, 'esperadas' => $esperadas,
              'erro' => $x['erro'] ?? null, 'proximo_passo' => $x['proximo_passo'] ?? null, 'acao' => $x['acao'] ?? null];
        if ($contas !== null) $r['contas'] = $contas;
        return $r;
    }

    private function asaasV2(array $x): array
    {
        if ($this->dash === null) return $this->v2($x, $x['estado'], null, null, null, null);
        try {
            $rows = $this->dash->query("SELECT `conta`, `nome`, `estado`, `erro_codigo`, `ultima_sync_ok`, `ultima_tentativa` FROM `{$this->p}asaas_contas` ORDER BY `conta`")->fetchAll(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            error_log('[geral-v2] integracoes v2 asaas: ' . get_class($e));
            return $this->v2($x, $x['estado'], null, null, null, null);
        }
        $fuso = new DateTimeZone('America/Sao_Paulo'); $iso = fn($v) => $v !== null ? (new DateTimeImmutable((string) $v, $fuso))->format(DATE_ATOM) : null;
        $contas = []; $boas = 0; $tent = null;
        foreach ($rows as $r) {
            $fresca = $r['estado'] === 'ok' && $r['ultima_sync_ok'] !== null
                && AsaasAgenda::padrao()->emDia(new DateTimeImmutable((string) $r['ultima_sync_ok'], $fuso), $this->agora->setTimezone($fuso));   // 27/11: janela pela agenda
            if ($fresca) $boas++;
            if ($r['ultima_tentativa'] !== null && ($tent === null || (string) $r['ultima_tentativa'] > $tent)) $tent = (string) $r['ultima_tentativa'];
            $contas[] = ['conta' => $r['conta'], 'rotulo' => AsaasCobrancas::rotulo((string) $r['conta'], $r['nome'] ?? null),
                         'estado' => $fresca ? 'ok' : ($r['estado'] === 'ok' ? 'atrasado' : 'com_problema'),
                         'erro_codigo' => $r['estado'] === 'ok' ? null : (preg_match('/^[a-z_]{1,40}\z/', (string) ($r['erro_codigo'] ?? $r['estado'])) === 1 ? (string) ($r['erro_codigo'] ?? $r['estado']) : 'desconhecido'),
                         'ultima_tentativa' => $iso($r['ultima_tentativa']), 'ultimo_sucesso' => $iso($r['ultima_sync_ok'])];
        }
        $n = count($rows);
        $estado = $x['estado'] === 'atrasado' && $boas > 0 ? 'parcial' : $x['estado'];   // parte das empresas em dia, parte atrasada
        return $this->v2($x, $estado, $iso($tent), $x['ultima_sincronizacao'], $n > 0 ? $boas : null, $n > 0 ? $n : null, $contas);
    }

    private function precificaV2(array $x): array
    {
        $tent = null; $suc = null;
        if ($this->dash !== null && preg_match('/^[A-Za-z0-9_]{1,64}\z/', $this->finSchema) === 1) {
            try {
                $t = "`{$this->finSchema}`.`{$this->p}fin_pcf_snapshot`";
                $tent = $this->dash->query("SELECT MAX(`gerado_em`) FROM $t")->fetchColumn() ?: null;
                $suc = $this->dash->query("SELECT MAX(`gerado_em`) FROM $t WHERE `estado` IN ('ok','parcial')")->fetchColumn() ?: null;
            } catch (Throwable $e) { /* sem GRANT: o v1 já diz sem_acesso; horários ficam null */ }
        }
        $iso = fn($v) => $v !== null ? (new DateTimeImmutable((string) $v, new DateTimeZone('UTC')))->setTimezone(new DateTimeZone('America/Sao_Paulo'))->format(DATE_ATOM) : null;
        return $this->v2($x, $x['estado'], $iso($tent), $iso($suc), null, null);
    }

    private function deFonte(string $id, string $nome, string $fonte): array
    {
        $f = $this->g->fonte($fonte);
        $d = (string) ($f['detalhe'] ?? '');
        $estado = match ($f['estado']) {
            'ok' => 'ok', 'desatualizado' => 'atrasado', 'parcial' => 'com_problema', 'aguardando_conexao' => 'aguardando', default => 'com_problema',
        };
        [$erro, $passo] = match (true) {
            $d === 'reautorizar'                   => ['A conta pede nova autorização.', "Reautorizar a conta do $nome nas Configurações do painel."],
            $d === 'escopo_ausente'                => ['O acesso não inclui os dados necessários.', "Reautorizar o $nome com o escopo completo."],
            in_array($d, ['sem_conta_conectada', 'sem_agenda_conectada'], true) => ['Nenhuma conta conectada.', "Conectar a conta do $nome nas Configurações do painel."],
            $d === 'sem_conexao_banco'             => ['O Dash não conseguiu ler a base local desta integração.', 'Verificar o banco local (conexão do Dash).'],
            $d === 'erro_leitura'                  => ['Falha ao ler o estado da sincronização.', 'Ver o log do Dash (geral-v2) e tentar de novo.'],
            $d === 'pedidos_nunca_sincronizados', $d === 'sem_sincronizacao_completa' => ['Ainda não houve uma sincronização completa.', 'Aguardar a próxima rodada ou disparar a sincronização.'],
            $d === 'sync_incompleta' || str_starts_with($d, 'sync_') => ['A última sincronização não terminou completa.', 'Ver o log da sincronização e rodar de novo.'],
            str_starts_with($d, 'calendarios_atrasados_') => ['Há agendas com a sincronização atrasada.', 'Conferir as agendas atrasadas no painel do Google Calendar.'],
            $estado === 'atrasado'                 => ['A última sincronização boa é antiga.', 'Conferir se o agendamento da sincronização está rodando.'],
            $estado === 'ok'                       => [null, null],
            default                                => ['Estado não reconhecido.', 'Ver o log da sincronização.'],
        };
        return ['id' => $id, 'nome' => $nome, 'estado' => $estado, 'ultima_sincronizacao' => $f['atualizado_em'] ?? null, 'erro' => $erro, 'proximo_passo' => $passo];
    }

    private function asaas(): array
    {
        $base = ['id' => 'asaas', 'nome' => 'Asaas', 'ultima_sincronizacao' => null];
        if ($this->dash === null) return $base + ['estado' => 'com_problema', 'erro' => 'O Dash não conseguiu ler a base local.', 'proximo_passo' => 'Verificar a conexão do Dash.'];
        try {
            $rows = $this->dash->query("SELECT `conta`, `estado`, `erro_codigo`, `ultima_sync_ok` FROM `{$this->p}asaas_contas` ORDER BY `conta`")->fetchAll(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            error_log('[geral-v2] integracoes asaas: ' . get_class($e));
            return $base + ['estado' => 'com_problema', 'erro' => 'Falha ao ler o estado do Asaas.', 'proximo_passo' => 'Ver o log do Dash.'];
        }
        if ($rows === []) return $base + ['estado' => 'aguardando', 'erro' => 'Nenhuma empresa sincronizada ainda.', 'proximo_passo' => 'Rodar a ativação do Asaas (portão ASAAS-ATIVACAO).'];
        $fuso = new DateTimeZone('America/Sao_Paulo'); $ult = null; $velha = false; $ruins = [];
        foreach ($rows as $r) {
            if ($r['estado'] !== 'ok') $ruins[] = $r['conta'] . ' (' . ($r['estado'] === 'divergente' ? 'conta_divergente' : ($r['erro_codigo'] ?? $r['estado'])) . ')';
            if ($r['ultima_sync_ok'] === null) { $velha = true; continue; }
            $t = new DateTimeImmutable((string) $r['ultima_sync_ok'], $fuso);
            if ($ult === null || $t > $ult) $ult = $t;
            if (!AsaasAgenda::padrao()->emDia($t, $this->agora->setTimezone($fuso))) $velha = true;   // 27/11: janela pela agenda
        }
        $estado = $ruins !== [] ? 'com_problema' : ($velha ? 'atrasado' : 'ok');
        $codigos = implode(' ', $ruins);
        $passo = match (true) {
            str_contains($codigos, 'chave_recusada')   => 'Gerar uma chave nova no Asaas para a empresa indicada e refazer a etapa de chaves.',
            str_contains($codigos, 'conta_divergente') => 'A chave guardada é de outra empresa: refazer a etapa de chaves para a empresa indicada.',
            $ruins !== []                              => 'Ver /var/log/asaas-sincronizar.log da empresa indicada.',
            $velha                                     => 'Conferir o agendamento do Asaas (cron dshow-asaas, minuto 37).',
            default                                    => null,
        };
        return ['id' => 'asaas', 'nome' => 'Asaas', 'estado' => $estado, 'ultima_sincronizacao' => $ult?->format(DATE_ATOM),
                'erro' => $ruins !== [] ? count($ruins) . ' de ' . count($rows) . ' empresas com problema: ' . $codigos . '.' : ($velha ? 'Há empresa sem sincronização boa nas últimas 3 h.' : null),
                'proximo_passo' => $passo];
    }

    /** O card do RD nunca derruba a tela: qualquer falha ao ler o estado local vira com_problema. */
    private function rdstation(): array
    {
        try { return RdCard::montar($this->rd ?? RdSegredos::padrao(), $this->agora); }
        catch (Throwable $e) {
            error_log('[geral-v2] integracoes rdstation: ' . get_class($e));
            return ['id' => 'rdstation', 'nome' => 'RD Station Marketing', 'estado' => 'com_problema', 'ultima_sincronizacao' => null, 'acao' => null,
                    'erro' => 'Falha ao ler o estado do RD Station.', 'proximo_passo' => 'Ver o log do Dash (geral-v2).'];
        }
    }

    private function precifica(): array
    {
        $base = ['id' => 'precifica', 'nome' => 'Precifica (financeiro)'];
        if ($this->dash === null) return $base + ['estado' => 'sem_acesso', 'ultima_sincronizacao' => null, 'erro' => 'Sem conexão de leitura.', 'proximo_passo' => 'Verificar a conexão do Dash.'];
        $s = $this->finSchema;
        if (preg_match('/^[A-Za-z0-9_]{1,64}\z/', $s) !== 1) throw new InvalidArgumentException('schema inválido');
        try {
            $r = $this->dash->query("SELECT `gerado_em`, `estado`, `motivos` FROM `{$s}`.`{$this->p}fin_pcf_snapshot` ORDER BY `id` DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            return $base + ['estado' => 'sem_acesso', 'ultima_sincronizacao' => null, 'erro' => 'O Dash ainda não tem leitura dos dados do Precifica.',
                            'proximo_passo' => 'Aplicar o portão GERAL-V2-PRECIFICA-ACESSO.'];
        }
        if ($r === false) return $base + ['estado' => 'aguardando', 'ultima_sincronizacao' => null, 'erro' => 'O coletor ainda não gravou nenhuma leitura.', 'proximo_passo' => 'Conferir FIN_PRECIFICA_ENABLED no app.'];
        $t = new DateTimeImmutable((string) $r['gerado_em'], new DateTimeZone('UTC'));
        $velho = intdiv($this->agora->getTimestamp() - $t->getTimestamp(), 60) > self::PRECIFICA_ATRASO_MIN;
        // motivos = códigos do coletor (sem_cnpj, valor_desconhecido, acima_do_valor) ou a CATEGORIA da falha (dns, rota, timeout…); nunca texto cru
        $mot = preg_match('/^[a-z_,]{0,200}\z/', (string) $r['motivos']) === 1 ? (string) $r['motivos'] : 'motivo_ilegivel';
        [$estado, $erro, $passo] = match (true) {
            $r['estado'] === 'erro' => ['com_problema', 'A última leitura do Precifica falhou' . ($mot !== '' ? " ($mot)." : '.'), 'Ver o log do app (fin_precifica) e o túnel até o ERP.'],
            $velho                  => ['atrasado', 'A última leitura é de mais de 60 min.', 'Conferir se o coletor do app está rodando.'],
            $r['estado'] === 'parcial' => ['ok', 'Leitura completa com avisos do dado: ' . $mot . '.', null],
            default                 => ['ok', null, null],
        };
        return $base + ['estado' => $estado, 'ultima_sincronizacao' => $t->setTimezone(new DateTimeZone('America/Sao_Paulo'))->format(DATE_ATOM), 'erro' => $erro, 'proximo_passo' => $passo];
    }
}
