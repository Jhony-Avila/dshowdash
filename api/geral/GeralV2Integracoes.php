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
            if ($this->agora->getTimestamp() - $t->getTimestamp() > AsaasResumo::LIMITE_ATRASO_MIN * 60) $velha = true;
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
