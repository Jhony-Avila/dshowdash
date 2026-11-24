<?php
/**
 * Geral V2 — serviço da tela inicial (ACIMA_DIREITA, 23/11/2026). Só LEITURA da base local:
 *   PIPE_DSHOW (espelho do Pipedrive), GCAL_DSHOW (espelho do Google Calendar), BLING (espelho do Bling). Nenhuma API externa.
 *
 * Regras decididas pelo Jhony (briefing GERAL-V2 e decisões de 23/11):
 *  - Períodos: Ontem · Últimos 7 dias · Mês até ontem. Só dias COMPLETOS; o dia é o de Brasília (corte 00:00 −03:00).
 *  - Prioridades = situação de AGORA (não mudam com o período), contadas por NEGÓCIO distinto, nunca por atividade:
 *      1. atividade_vencida            — negócio aberto com ao menos uma atividade não concluída e vencida;
 *      2. sem_proxima_atividade  — negócio aberto, SEM atividade futura, com fechamento previsto até hoje + 7 (inclui os já vencidos);
 *      3. conflito_agenda              — conflitos de hoje na agenda do usuário logado (mesma regra da central de conflitos do Calendar).
 *  - Cada prioridade tem uma lista que reproduz EXATAMENTE a contagem (mesma consulta), 50 por página, total real.
 *  - Ganhos pela data do GANHO; funil = abertos agora (quantidade, valor, quantos sem valor); pedidos do Bling pela data do pedido,
 *    fora cancelados e a loja "Teste - Mercado Livre" QUANDO o id existir no pedido (senão entram e a resposta avisa).
 *  - Ausência de dado NUNCA vira zero: contagem/valor = null + estado. Zero só com a fonte em dia ("zero_confirmado").
 *
 * Convenções de hora (conferidas no esquema e no código de cada espelho):
 *  - PIPE: won_time e due_date/due_time das atividades COM hora vêm da API em UTC (DR-013); due_date SEM hora é dia civil;
 *    expected_close_date é dia civil; pipe_sync_runs.finished_at = NOW() da sessão (−03:00).
 *  - GCAL e BLING guardam UTC (sessões com time_zone '+00:00'); bling_sales_orders.data_pedido é dia civil.
 *  Todas as fronteiras são calculadas aqui no PHP (relógio injetável) e passadas como parâmetro — nada de CURDATE()/NOW() no SQL.
 */
declare(strict_types=1);

final class GeralV2Erro extends RuntimeException {}

final class GeralV2
{
    public const FUSO = 'America/Sao_Paulo';
    public const POR_PAGINA = 50;
    public const PERIODOS = ['ontem' => 'Ontem', '7d' => 'Últimos 7 dias', 'mes' => 'Mês até ontem'];
    public const PRIORIDADES = ['atividade_vencida', 'sem_proxima_atividade', 'conflito_agenda'];
    /** a fonte é "desatualizada" quando o último sucesso passa destes minutos (sync de 15 min nas três) */
    public const VELHA_MIN = ['pipedrive' => 120, 'google_calendar' => 120, 'bling' => 180];
    public const LOJA_TESTE = 'Teste - Mercado Livre';

    private DateTimeZone $br;
    private DateTimeZone $utc;
    private DateTimeImmutable $agora;   // em Brasília
    /** @var array<string, array> cache das fontes nesta requisição */
    private array $fontes = [];

    /**
     * @param ?PDO     $pipe       PIPE_DSHOW (null = conexão falhou)
     * @param ?PDO     $gcal       GCAL_DSHOW
     * @param ?PDO     $bling      BLING
     * @param ?Closure $agenda     fn(): ?object — provedor do Calendar do usuário (GcalDb), com conflitos(array $f) e eventos(array $f);
     *                             a MESMA regra da central de conflitos do Calendar. null / devolve null = provedor indisponível
     * @param string   $p          prefixo das tabelas (só nos testes; produção = '')
     */
    public function __construct(
        private ?PDO $pipe,
        private ?PDO $gcal,
        private ?PDO $bling,
        private int $usuario,
        ?DateTimeImmutable $agora = null,
        private ?Closure $agenda = null,
        private string $p = '',
    ) {
        if ($p !== '' && preg_match('/^[a-z0-9_]{1,24}$/', $p) !== 1) throw new InvalidArgumentException('prefixo inválido');
        $this->br = new DateTimeZone(self::FUSO);
        $this->utc = new DateTimeZone('UTC');
        $this->agora = ($agora ?? new DateTimeImmutable('now'))->setTimezone($this->br);
    }

    // ─────────────────────────────────────────── resumo ───────────────────────────────────────────

    public function resumo(string $periodo): array
    {
        if (!isset(self::PERIODOS[$periodo])) throw new GeralV2Erro('periodo_invalido');
        [$de, $ate] = $this->periodo($periodo);
        return [
            'gerado_em'   => $this->agora->format(DATE_ATOM),
            'fuso'        => self::FUSO,
            'periodo'     => ['chave' => $periodo, 'rotulo' => self::PERIODOS[$periodo], 'de' => $de->format('Y-m-d'), 'ate' => $ate->format('Y-m-d')],
            'prioridades' => $this->prioridades(),
            'ganhos'      => $this->ganhos($de, $ate),
            'funil'       => $this->funil(),
            'pedidos'     => $this->pedidos($de, $ate),
            'fontes'      => [$this->fonte('pipedrive'), $this->fonte('google_calendar'), $this->fonte('bling')],
        ];
    }

    /** As 3 prioridades (situação de AGORA; não dependem do período). */
    public function prioridades(): array
    {
        return [$this->prioridadePipe('atividade_vencida'), $this->prioridadePipe('sem_proxima_atividade'), $this->prioridadeAgenda()];
    }

    /** Só os números do período (sem prioridades nem fontes) — o que o endpoint de resumo da tela pede. */
    public function numeros(string $periodo): array
    {
        if (!isset(self::PERIODOS[$periodo])) throw new GeralV2Erro('periodo_invalido');
        [$de, $ate] = $this->periodo($periodo);
        return ['gerado_em' => $this->agora->format(DATE_ATOM),
                'periodo' => ['chave' => $periodo, 'rotulo' => self::PERIODOS[$periodo], 'de' => $de->format('Y-m-d'), 'ate' => $ate->format('Y-m-d')],
                'ganhos' => $this->ganhos($de, $ate), 'funil' => $this->funil(), 'pedidos' => $this->pedidos($de, $ate)];
    }

    public function agora(): DateTimeImmutable { return $this->agora; }

    /** @return array{0: DateTimeImmutable, 1: DateTimeImmutable} primeiro e último dia (inclusive), em Brasília */
    public function periodo(string $chave): array
    {
        $hoje = $this->agora->setTime(0, 0);
        $ontem = $hoje->modify('-1 day');
        return match ($chave) {
            'ontem' => [$ontem, $ontem],
            '7d'    => [$hoje->modify('-7 days'), $ontem],
            // "Mês até ontem": do dia 1 do mês de ONTEM até ontem (no dia 1º, mostra o mês anterior inteiro, nunca um período vazio)
            'mes'   => [$ontem->modify('first day of this month'), $ontem],
            default => throw new GeralV2Erro('periodo_invalido'),
        };
    }

    // ─────────────────────────────────────────── fontes ───────────────────────────────────────────

    /**
     * Estado de uma fonte: ok · desatualizado · parcial · aguardando_conexao · indisponivel, com o horário do último sucesso COMPLETO.
     * `completa` = a última sincronização terminada leu e gravou tudo (base do "zero confirmado"; ACIMA_ESQUERDA, 24/11, contrato com a CIMA).
     * Ids: 'pipedrive' (negócios E atividades — prioridades), 'pipedrive_negocios' (só negócios — ganhos e funil), 'bling' (pedidos), 'google_calendar'.
     */
    public function fonte(string $id): array
    {
        if (isset($this->fontes[$id])) return $this->fontes[$id];
        try {
            $f = match ($id) {
                'pipedrive'          => $this->fontePipe(['deals', 'activities']),
                'pipedrive_negocios' => $this->fontePipe(['deals']),
                'google_calendar'    => $this->fonteGcal(),
                'bling'              => $this->fonteBling(),
            };
        } catch (Throwable $e) {
            error_log('[geral-v2] fonte ' . $id . ': ' . get_class($e));
            $f = ['estado' => 'indisponivel', 'atualizado_em' => null, 'detalhe' => 'erro_leitura'];
        }
        $f = ['id' => $id] + $f + ['corte' => $this->agora->format(DATE_ATOM), 'detalhe' => null];
        $f['conexao'] ??= match (true) {
            $f['estado'] === 'aguardando_conexao' => ['estado' => 'aguardando', 'detalhe' => $f['detalhe']],
            in_array($f['detalhe'], ['sem_conexao_banco', 'erro_leitura'], true) => ['estado' => 'problema', 'detalhe' => $f['detalhe']],
            default => ['estado' => 'conectada', 'detalhe' => null],
        };
        $f['completa'] = $f['estado'] === 'ok';   // só a fonte em dia E com a última leitura completa vale 'ok'
        return $this->fontes[$id] = $f;
    }

    /**
     * CONEXÃO de uma fonte, separada da CONSULTA (parecer do mockup, 24/11): a conta/o acesso existe e está autorizado?
     * 'conectada' | 'aguardando' (nenhuma conta) | 'problema' (banco fora, conta que pede nova autorização, erro de leitura).
     * @return array{estado:string, detalhe:?string}
     */
    public function conexao(string $id): array
    {
        // da MESMA leitura da fonte (decisão do Jhony 24/11: cartões e linha de fontes saem de uma leitura só) — nenhuma consulta nova aqui
        return $this->fonte($id === 'pipedrive' ? 'pipedrive_negocios' : $id)['conexao'];
    }

    /**
     * Pipedrive por ENTIDADE (o indicador usa só as entidades de que depende).
     * Sucesso completo = run `completed` com `errors = 0`. Um run `completed` com `errors > 0` leu todas as páginas mas NÃO gravou N registros
     * (SyncService:221–224; resposta da ACIMA_DIREITA, 24/11 15:53) → não é sucesso completo e nunca dá zero.
     * @param list<string> $ents
     */
    private ?array $contasPipe = null;

    private function fontePipe(array $ents): array
    {
        if ($this->pipe === null) return ['estado' => 'indisponivel', 'atualizado_em' => null, 'detalhe' => 'sem_conexao_banco'];
        // Decisão do Jhony (24/11): conta EXPIRADA ou INVÁLIDA = "Com problema · pede nova autorização" (como Bling e Google);
        // "aguardando" só para fonte NUNCA conectada. A leitura das contas é uma só por requisição (negócios e atividades usam a mesma).
        $this->contasPipe ??= $this->pipe->query("SELECT COALESCE(SUM(status = 'connected'), 0) AS ok,
                COALESCE(SUM(status IN ('invalid','expired','insufficient_scope','error')), 0) AS ruim FROM `{$this->p}pipe_accounts` WHERE is_active = 1")->fetch(PDO::FETCH_ASSOC);
        $reaut = (int) $this->contasPipe['ok'] === 0;
        if ($reaut && (int) $this->contasPipe['ruim'] === 0) return ['estado' => 'aguardando_conexao', 'atualizado_em' => null, 'detalhe' => 'sem_conta_conectada'];
        $conReaut = ['estado' => 'problema', 'detalhe' => 'reautorizar'];
        $ult = []; $completa = true;
        foreach ($ents as $ent) {
            $st = $this->pipe->prepare("SELECT MAX(finished_at) FROM `{$this->p}pipe_sync_runs` WHERE entity = ? AND status = 'completed' AND COALESCE(errors, 0) = 0");
            $st->execute([$ent]);
            $ult[$ent] = $st->fetchColumn() ?: null;
            // a última execução TERMINADA (uma em andamento não conta, nem para o bem nem para o mal)
            $st = $this->pipe->prepare("SELECT status, COALESCE(errors, 0) AS errors FROM `{$this->p}pipe_sync_runs` WHERE entity = ? AND finished_at IS NOT NULL
                                         AND status IS NOT NULL ORDER BY finished_at DESC, id DESC LIMIT 1");
            $st->execute([$ent]);
            $r = $st->fetch(PDO::FETCH_ASSOC);
            if ($r === false || $r['status'] !== 'completed' || (int) $r['errors'] > 0) $completa = false;
        }
        if (in_array(null, $ult, true)) return $reaut ? ['estado' => 'indisponivel', 'atualizado_em' => null, 'detalhe' => 'reautorizar', 'conexao' => $conReaut]
                                                       : ['estado' => 'parcial', 'atualizado_em' => null, 'detalhe' => 'sem_sincronizacao_completa'];
        $velho = min($ult);   // 'Y-m-d H:i:s' em −03:00 (NOW() da sessão); vale a entidade mais velha
        $t = new DateTimeImmutable($velho, $this->br);
        // conta sem autorização: o último dado lido continua visível, sempre como desatualizado (nunca em dia, nunca zero)
        if ($reaut) return ['estado' => 'desatualizado', 'atualizado_em' => $t->format(DATE_ATOM), 'detalhe' => 'reautorizar', 'conexao' => $conReaut];
        if ($this->idadeMin($t) > self::VELHA_MIN['pipedrive']) return ['estado' => 'desatualizado', 'atualizado_em' => $t->format(DATE_ATOM)];
        if (!$completa) return ['estado' => 'parcial', 'atualizado_em' => $t->format(DATE_ATOM), 'detalhe' => 'sync_incompleta'];
        return ['estado' => 'ok', 'atualizado_em' => $t->format(DATE_ATOM)];
    }

    private function fonteGcal(): array
    {
        if ($this->gcal === null) return ['estado' => 'indisponivel', 'atualizado_em' => null, 'detalhe' => 'sem_conexao_banco'];
        // frescor POR CALENDÁRIO (decisão do Jhony): gcal_sync_state dos calendários ativos das contas conectadas do usuário.
        // gcal_accounts.last_success_at não serve (parado em 28/10 com a sincronização funcionando).
        $st = $this->gcal->prepare(
            "SELECT c.calendar_id, s.status, s.last_sync_at, a.connection_status
               FROM `{$this->p}gcal_accounts` a
               JOIN `{$this->p}gcal_calendars` c ON c.account_id = a.id AND c.deleted = 0
               LEFT JOIN `{$this->p}gcal_sync_state` s ON s.account_id = a.id AND s.calendar_id = c.calendar_id
              WHERE a.user_id = ? AND a.is_active = 1");
        $st->execute([$this->usuario]);
        $cals = $st->fetchAll(PDO::FETCH_ASSOC);
        if ($cals === []) return ['estado' => 'aguardando_conexao', 'atualizado_em' => null, 'detalhe' => 'sem_agenda_conectada'];
        $velhos = 0; $mais = null; $conectadas = 0;
        foreach ($cals as $c) {
            // conta que pede nova autorização não sincroniza mais: os calendários dela contam como atrasados (dado velho, não "sem conexão")
            $ok = $c['last_sync_at'] !== null && in_array($c['status'], ['ok', 'stale'], true) && $c['connection_status'] === 'connected';
            if ($c['connection_status'] === 'connected') $conectadas++;
            $t = $c['last_sync_at'] !== null ? new DateTimeImmutable($c['last_sync_at'], $this->utc) : null;
            if (!$ok || $t === null || $this->idadeMin($t) > self::VELHA_MIN['google_calendar']) { $velhos++; }
            if ($t !== null && ($mais === null || $t < $mais)) $mais = $t;
        }
        $estado = $velhos === 0 ? 'ok' : ($velhos === count($cals) ? 'desatualizado' : 'parcial');
        return ['estado' => $estado, 'atualizado_em' => $mais?->setTimezone($this->br)->format(DATE_ATOM),
                'detalhe' => $velhos > 0 ? "calendarios_atrasados_{$velhos}_de_" . count($cals) : null,
                'conexao' => $conectadas > 0 ? ['estado' => 'conectada', 'detalhe' => null] : ['estado' => 'problema', 'detalhe' => 'reautorizar']];
    }

    private function fonteBling(): array
    {
        if ($this->bling === null) return ['estado' => 'indisponivel', 'atualizado_em' => null, 'detalhe' => 'sem_conexao_banco'];
        $r = $this->bling->query(
            "SELECT a.id AS account_id, s.situacao, s.ultima_execucao_em, a.estado_conexao
               FROM `{$this->p}bling_accounts` a
               LEFT JOIN `{$this->p}bling_sync_state` s ON s.account_id = a.id AND s.recurso = 'pedidos'
              WHERE a.is_ativo = 1 ORDER BY a.is_padrao DESC, a.id LIMIT 1")->fetch(PDO::FETCH_ASSOC);
        if ($r === false || $r['estado_conexao'] === 'nao_configurado') return ['estado' => 'aguardando_conexao', 'atualizado_em' => null, 'detalhe' => 'sem_conta_conectada'];
        $con = $r['estado_conexao'] === 'conectado' ? ['estado' => 'conectada', 'detalhe' => null] : ['estado' => 'problema', 'detalhe' => 'conexao_' . $r['estado_conexao']];
        if ($r['ultima_execucao_em'] === null) return ['conexao' => $con, 'estado' => 'parcial', 'atualizado_em' => null, 'detalhe' => 'pedidos_nunca_sincronizados'];
        $conta = (int) $r['account_id'];
        // Último sucesso = a MESMA regra do módulo Bling (BlingReal::disponibilidade, pacote B 88d2bd83): último job `concluido` do recurso;
        // sem job, a última execução com situação `ok`. Nunca a hora de uma TENTATIVA (antes: ultima_execucao_em, mesmo de uma rodada com erro).
        $temJobs = $this->tabelaExiste($this->bling, 'bling_sync_jobs');
        $suc = null;
        if ($temJobs) {
            $st = $this->bling->prepare("SELECT MAX(terminado_em) FROM `{$this->p}bling_sync_jobs` WHERE account_id = ? AND recurso = 'pedidos' AND situacao = 'concluido'");
            $st->execute([$conta]);
            $suc = $st->fetchColumn() ?: null;
        }
        if ($suc === null && $r['situacao'] === 'ok') $suc = $r['ultima_execucao_em'];
        $t = $suc !== null ? (new DateTimeImmutable((string) $suc, $this->utc))->setTimezone($this->br) : null;
        $quando = $t?->format(DATE_ATOM);
        // ESCOPO AUSENTE (403 insufficient_scope): o Bling marca `atencao` mas NADA foi lido. Regra da ACIMA_DIREITA (24/11 16:02), sem comparar horários:
        // job mais recente do recurso `cancelado` E erro mais recente do recurso `ESCOPO_AUSENTE` → fonte sem leitura, nunca em dia.
        if ($temJobs && $this->tabelaExiste($this->bling, 'bling_sync_errors')) {
            $st = $this->bling->prepare("SELECT situacao FROM `{$this->p}bling_sync_jobs` WHERE account_id = ? AND recurso = 'pedidos' ORDER BY iniciado_em DESC, id DESC LIMIT 1");
            $st->execute([$conta]); $job = $st->fetchColumn();
            $st = $this->bling->prepare("SELECT codigo FROM `{$this->p}bling_sync_errors` WHERE account_id = ? AND recurso = 'pedidos' ORDER BY id DESC LIMIT 1");
            $st->execute([$conta]); $err = $st->fetchColumn();
            if ($job === 'cancelado' && $err === 'ESCOPO_AUSENTE') {
                return ['estado' => $t !== null ? 'desatualizado' : 'indisponivel', 'atualizado_em' => $quando, 'detalhe' => 'escopo_ausente',
                        'conexao' => ['estado' => 'problema', 'detalhe' => 'escopo_ausente']];
            }
        }
        if ($t === null) return ['conexao' => $con, 'estado' => 'parcial', 'atualizado_em' => null, 'detalhe' => 'sync_' . $r['situacao']];
        if ($r['estado_conexao'] !== 'conectado') return ['conexao' => $con, 'estado' => 'desatualizado', 'atualizado_em' => $quando, 'detalhe' => 'conexao_' . $r['estado_conexao']];
        if ($this->idadeMin($t) > self::VELHA_MIN['bling']) return ['conexao' => $con, 'estado' => 'desatualizado', 'atualizado_em' => $quando];
        // `atencao` = a coleta leu tudo, mas alguns registros não foram gravados (BlingSyncService:216–220) → consulta incompleta: parcial, nunca zero
        if ($r['situacao'] !== 'ok') return ['conexao' => $con, 'estado' => 'parcial', 'atualizado_em' => $quando, 'detalhe' => 'sync_' . $r['situacao']];
        return ['conexao' => $con, 'estado' => 'ok', 'atualizado_em' => $quando];
    }

    /**
     * Estado de um cartão a partir da fonte. Sem número possível → números null. Número 0 com a fonte em dia → zero_confirmado.
     * @param int|null $n contagem já calculada (null se não calculou)
     */
    private function estadoCartao(array $fonte, ?int $n): string
    {
        if (in_array($fonte['estado'], ['aguardando_conexao', 'indisponivel'], true)) return $fonte['estado'];
        if ($n === null) return 'indisponivel';
        if ($fonte['estado'] === 'ok') return $n === 0 ? 'zero_confirmado' : 'ok';
        return $fonte['estado'];   // desatualizado | parcial — o número aparece com o aviso
    }

    private function semNumero(array $fonte): bool
    {
        return in_array($fonte['estado'], ['aguardando_conexao', 'indisponivel'], true);
    }

    // ─────────────────────────────────────────── Pipedrive ───────────────────────────────────────────

    /** Parâmetros de "agora" do Pipedrive: dia de Brasília (datas sem hora) e instante UTC (atividades com hora, DR-013). */
    private function agoraPipe(): array
    {
        return [':hoje' => $this->agora->format('Y-m-d'), ':agora_utc' => $this->agora->setTimezone($this->utc)->format('Y-m-d H:i:s'),
                ':limite7' => $this->agora->modify('+7 days')->format('Y-m-d')];
    }

    /** Atividade não concluída e vencida (sem hora: dia anterior a hoje; com hora: instante UTC já passado). */
    private function condVencida(string $a): string
    {
        return "$a.is_deleted = 0 AND $a.done = 0 AND $a.due_date IS NOT NULL AND (($a.due_time IS NULL AND $a.due_date < :hoje)"
             . " OR ($a.due_time IS NOT NULL AND TIMESTAMP($a.due_date, $a.due_time) < :agora_utc))";
    }

    /** Atividade não concluída FUTURA (sem hora: hoje ou depois; com hora: instante UTC ainda por vir). Sem data não é futura. */
    private function condFutura(string $a): string
    {
        return "$a.is_deleted = 0 AND $a.done = 0 AND $a.due_date IS NOT NULL AND (($a.due_time IS NULL AND $a.due_date >= :hoje)"
             . " OR ($a.due_time IS NOT NULL AND TIMESTAMP($a.due_date, $a.due_time) >= :agora_utc))";
    }

    /**
     * A MESMA consulta serve o cartão e a lista: devolve [FROM+WHERE, parâmetros, expressão da referência].
     * Um negócio = uma linha (agregação por d.id), por mais atividades vencidas que tenha.
     */
    private function basePrioridade(string $id): array
    {
        $p = $this->p; $par = $this->agoraPipe();
        if ($id === 'atividade_vencida') {
            unset($par[':limite7']);
            $sql = "FROM `{$p}pipe_deals` d JOIN (SELECT a.deal_pd_id, MIN(a.due_date) AS ref FROM `{$p}pipe_activities` a WHERE a.deal_pd_id IS NOT NULL AND "
                 . $this->condVencida('a') . " GROUP BY a.deal_pd_id) v ON v.deal_pd_id = d.pipedrive_id WHERE d.is_deleted = 0 AND d.status = 'open'";
            return [$sql, $par, 'v.ref'];
        }
        if ($id === 'sem_proxima_atividade') {
            $sql = "FROM `{$p}pipe_deals` d WHERE d.is_deleted = 0 AND d.status = 'open' AND d.expected_close_date IS NOT NULL AND d.expected_close_date <= :limite7"
                 . " AND NOT EXISTS (SELECT 1 FROM `{$p}pipe_activities` f WHERE f.deal_pd_id = d.pipedrive_id AND " . $this->condFutura('f') . ")";
            return [$sql, $par, 'd.expected_close_date'];
        }
        throw new GeralV2Erro('prioridade_invalida');
    }

    /**
     * A ÚNICA função de filtro das prioridades do Pipedrive (parecer do mockup, 24/11): o número do cartão e o `total` da lista saem DAQUI.
     * Mesmo FROM/WHERE (basePrioridade) + o filtro opcional de responsável. Devolve a contagem, a referência mais antiga e o nº de responsáveis.
     * @return array{n:int, antiga:?string, donos:int}
     */
    private function contarPrioridade(string $id, ?int $responsavel = null): array
    {
        [$from, $par, $ref] = $this->basePrioridade($id);
        if ($responsavel !== null) { $from .= ' AND d.owner_id = :resp'; $par[':resp'] = $responsavel; }
        $st = $this->pipe->prepare("SELECT COUNT(*) AS n, MIN($ref) AS antiga, COUNT(DISTINCT d.owner_id) AS donos $from");
        $st->execute($par);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        return ['n' => (int) $r['n'], 'antiga' => $r['antiga'] !== null ? substr((string) $r['antiga'], 0, 10) : null, 'donos' => (int) $r['donos']];
    }

    private function prioridadePipe(string $id): array
    {
        $f = $this->fonte('pipedrive');
        $out = ['id' => $id, 'total' => null, 'mais_antiga' => null, 'responsaveis' => null, 'atualizado_em' => $f['atualizado_em']];
        if ($this->semNumero($f)) return $out + ['estado' => $f['estado']];
        try {
            $c = $this->contarPrioridade($id);
            $out['total'] = $c['n']; $out['responsaveis'] = $c['donos']; $out['mais_antiga'] = $c['antiga'];
        } catch (Throwable $e) {
            error_log('[geral-v2] prioridade ' . $id . ': ' . get_class($e));
            return array_merge($out, ['total' => null, 'mais_antiga' => null, 'responsaveis' => null, 'estado' => 'indisponivel']);
        }
        return $out + ['estado' => $this->estadoCartao($f, $out['total'])];
    }

    private function ganhos(DateTimeImmutable $de, DateTimeImmutable $ate): array
    {
        // won_time é UTC: o dia de Brasília [de 00:00, ate+1 00:00) vira o intervalo UTC equivalente
        $ini = $de->setTimezone($this->utc)->format('Y-m-d H:i:s');
        $fim = $ate->modify('+1 day')->setTimezone($this->utc)->format('Y-m-d H:i:s');
        return $this->negocios('ganhos', "status = 'won' AND won_time >= ? AND won_time < ?", [$ini, $fim]);
    }

    private function funil(): array
    {
        return $this->negocios('funil', "status = 'open'", []);
    }

    /**
     * Ganhos e funil (contrato por indicador, ACIMA_ESQUERDA 24/11): fonte = SÓ os negócios do Pipedrive (as atividades não mudam estes números).
     *  - `valor` = soma dos valores INFORMADOS em BRL. Nenhum informado (todos sem valor ou em outra moeda) → null, nunca "0.00".
     *    Conjunto vazio de verdade → "0.00" (e `zero` só com a fonte em dia e a leitura completa).
     *  - `sem_valor > 0` ou `fora_brl > 0` → `parcial` (a tela mostra "Dados parciais · Soma dos valores informados · X negócios sem valor").
     */
    private function negocios(string $nome, string $cond, array $par): array
    {
        $f = $this->fonte('pipedrive_negocios');
        $out = ['quantidade' => null, 'valor' => null, 'sem_valor' => null, 'fora_brl' => null, 'atualizado_em' => $f['atualizado_em']];
        if ($this->semNumero($f)) return $out + ['estado' => $f['estado'], 'lacunas' => []];
        try {
            $st = $this->pipe->prepare(
                "SELECT COUNT(*) AS n, SUM(CASE WHEN currency = 'BRL' AND value IS NOT NULL AND value <> 0 THEN value END) AS v, SUM(value IS NULL OR value = 0) AS sem,
                        SUM(value IS NOT NULL AND value <> 0 AND (currency IS NULL OR currency <> 'BRL')) AS fora
                   FROM `{$this->p}pipe_deals` WHERE is_deleted = 0 AND $cond");
            $st->execute($par);
            $r = $st->fetch(PDO::FETCH_ASSOC);
            $n = (int) $r['n']; $sem = (int) $r['sem']; $fora = (int) $r['fora'];
            $informados = $n - $sem - $fora;
            $out['quantidade'] = $n; $out['sem_valor'] = $sem; $out['fora_brl'] = $fora;
            $out['valor'] = $n === 0 ? '0.00' : ($informados === 0 ? null : $this->dinheiro($r['v'], $informados));
        } catch (Throwable $e) {
            error_log('[geral-v2] ' . $nome . ': ' . get_class($e));
            return ['quantidade' => null, 'valor' => null, 'sem_valor' => null, 'fora_brl' => null, 'atualizado_em' => $f['atualizado_em'],
                    'estado' => 'indisponivel', 'lacunas' => []];
        }
        $lacunas = $this->lacunasFonte($f);
        if ($out['sem_valor'] > 0) $lacunas[] = 'sem_valor';
        if ($out['fora_brl'] > 0) $lacunas[] = 'fora_brl';
        $estado = $this->estadoCartao($f, $out['quantidade']);
        if ($lacunas !== [] && in_array($estado, ['ok', 'zero_confirmado'], true)) $estado = 'parcial';
        return $out + ['estado' => $estado, 'lacunas' => $lacunas];
    }

    /** Lacunas que vêm da FONTE (não do dado): leitura incompleta da última sincronização. */
    private function lacunasFonte(array $f): array
    {
        return $f['estado'] === 'parcial' ? ['sync_incompleta'] : [];
    }

    // ─────────────────────────────────────────── Google Calendar ───────────────────────────────────────────

    /** @return array{0: string, 1: string} janela de HOJE (Brasília): de = ate = 'Y-m-d' (formato da central de conflitos do Calendar) */
    private function janelaHoje(): array
    {
        $d = $this->agora->format('Y-m-d');
        return [$d, $d];
    }

    private ?object $provedor = null;
    private bool $provedorLido = false;

    private function provedorAgenda(): ?object
    {
        if (!$this->provedorLido) { $this->provedorLido = true; $this->provedor = $this->agenda !== null ? ($this->agenda)() : null; }
        return $this->provedor;
    }

    /** @return ?list<array> conflitos de hoje ou null (provedor indisponível) */
    private function conflitosHoje(): ?array
    {
        $p = $this->provedorAgenda();
        if ($p === null) return null;
        [$de, $ate] = $this->janelaHoje();
        $l = $p->conflitos(['de' => $de, 'ate' => $ate, 'tz' => self::FUSO]);
        return is_array($l) ? array_values($l) : null;
    }

    /**
     * Compromissos de HOJE do usuário que ainda não terminaram (próximos), em ordem de início; marca os que estão em conflito.
     * Cancelados e "dia inteiro" livres (transparentes) ficam de fora. Ausência de provedor = estado indisponível, nunca lista vazia.
     */
    public function agendaHoje(int $max = 20): array
    {
        $f = $this->fonte('google_calendar');
        $out = ['itens' => null, 'atualizado_em' => $f['atualizado_em']];
        if ($this->semNumero($f)) return $out + ['estado' => $f['estado']];
        try {
            $p = $this->provedorAgenda();
            if ($p === null) return $out + ['estado' => 'indisponivel'];
            [$de, $ate] = $this->janelaHoje();
            $ev = $p->eventos(['de' => $de, 'ate' => $ate, 'tz' => self::FUSO]);
            $emConflito = [];
            foreach ($this->conflitosHoje() ?? [] as $c) foreach (($c['event_ids'] ?? []) as $id) $emConflito[(string) $id] = true;
            $itens = [];
            foreach (is_array($ev) ? $ev : [] as $e) {
                if (($e['status'] ?? '') === 'cancelled') continue;
                if (!empty($e['all_day']) && ($e['transparency'] ?? '') === 'transparent') continue;
                $ini = isset($e['start']) ? new DateTimeImmutable((string) $e['start']) : null;
                $fim = isset($e['end']) ? new DateTimeImmutable((string) $e['end']) : null;
                if ($ini === null || $fim === null || $fim <= $this->agora) continue;   // já terminou
                $itens[] = ['inicio' => $ini->setTimezone($this->br)->format(DATE_ATOM), 'fim' => $fim->setTimezone($this->br)->format(DATE_ATOM),
                    'titulo' => (string) ($e['summary'] ?? '(sem título)'), 'duracao_min' => intdiv($fim->getTimestamp() - $ini->getTimestamp(), 60),
                    'dia_inteiro' => !empty($e['all_day']), 'conflito' => isset($emConflito[(string) ($e['id'] ?? '')])];
            }
            usort($itens, fn($a, $b) => [$a['inicio'], $a['titulo']] <=> [$b['inicio'], $b['titulo']]);
            $out['itens'] = array_slice($itens, 0, $max);
        } catch (Throwable $e) {
            error_log('[geral-v2] agenda: ' . get_class($e));
            return ['itens' => null, 'atualizado_em' => $f['atualizado_em'], 'estado' => 'indisponivel'];
        }
        return $out + ['estado' => $this->estadoCartao($f, count($out['itens']))];
    }

    private function prioridadeAgenda(): array
    {
        $f = $this->fonte('google_calendar');
        $out = ['id' => 'conflito_agenda', 'total' => null, 'mais_antiga' => null, 'atualizado_em' => $f['atualizado_em']];
        if ($this->semNumero($f)) return $out + ['estado' => $f['estado']];
        try {
            $l = $this->conflitosHoje();
        } catch (Throwable $e) {
            error_log('[geral-v2] conflitos: ' . get_class($e));
            $l = null;
        }
        if ($l === null) return $out + ['estado' => 'indisponivel'];
        $out['total'] = count($l);
        return $out + ['estado' => $this->estadoCartao($f, $out['total'])];
    }

    // ─────────────────────────────────────────── Bling ───────────────────────────────────────────

    private function colunaExiste(PDO $pdo, string $tabela, string $coluna): bool
    {
        $st = $pdo->prepare('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?');
        $st->execute([$this->p . $tabela, $coluna]);
        return (int) $st->fetchColumn() === 1;
    }

    private function tabelaExiste(PDO $pdo, string $tabela): bool
    {
        $st = $pdo->prepare('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?');
        $st->execute([$this->p . $tabela]);
        return (int) $st->fetchColumn() === 1;
    }

    private function pedidos(DateTimeImmutable $de, DateTimeImmutable $ate): array
    {
        $f = $this->fonte('bling');
        $dias = [];
        for ($d = $de; $d <= $ate; $d = $d->modify('+1 day')) $dias[$d->format('Y-m-d')] = ['dia' => $d->format('Y-m-d'), 'quantidade' => null, 'valor' => null];
        $out = ['quantidade' => null, 'valor' => null, 'por_dia' => array_values($dias), 'inclui_cancelados' => null, 'inclui_teste_ml' => null, 'sem_canal' => null,
                'atualizado_em' => $f['atualizado_em']];
        if ($this->semNumero($f)) return $out + ['estado' => $f['estado'], 'lacunas' => []];
        try {
            $p = $this->p; $b = $this->bling;
            $where = ["o.deletado_em IS NULL", "o.data_pedido >= :de", "o.data_pedido <= :ate"];
            $par = [':de' => $de->format('Y-m-d'), ':ate' => $ate->format('Y-m-d')];
            // cancelados: só dá para tirar quando o pedido tem o id REAL da situação e a lista de situações existe
            $temSit = $this->colunaExiste($b, 'bling_sales_orders', 'situacao_bling_id') && $this->tabelaExiste($b, 'bling_situacoes');
            if ($temSit) {
                $where[] = "NOT EXISTS (SELECT 1 FROM `{$p}bling_situacoes` s WHERE s.account_id = o.account_id AND s.situacao_id = o.situacao_bling_id AND LOWER(s.nome) LIKE 'cancelad%')";
            }
            // "Teste - Mercado Livre": só quando o pedido guarda o id da loja (loja.id) e o canal com esse nome existe
            $temLoja = $this->colunaExiste($b, 'bling_sales_orders', 'loja_bling_id');
            if ($temLoja) {
                $where[] = "NOT EXISTS (SELECT 1 FROM `{$p}bling_sales_channels` c WHERE c.account_id = o.account_id AND c.bling_id = o.loja_bling_id AND c.nome = :loja_teste)";
                $par[':loja_teste'] = self::LOJA_TESTE;
            }
            $w = implode(' AND ', $where);
            $st = $b->prepare("SELECT o.data_pedido AS dia, COUNT(*) AS n, SUM(o.total) AS v FROM `{$p}bling_sales_orders` o WHERE $w GROUP BY o.data_pedido");
            $st->execute($par);
            $n = 0; $v = '0.00';
            // dia sem linha = 0 de verdade SÓ com a fonte em dia; fonte velha/parcial: o dia sem pedido fica null (pode ser só atraso da sincronização)
            if ($f['estado'] === 'ok') foreach ($dias as $k => $_) { $dias[$k]['quantidade'] = 0; $dias[$k]['valor'] = '0.00'; }
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $k = substr((string) $r['dia'], 0, 10);
                if (!isset($dias[$k])) continue;
                $dias[$k] = ['dia' => $k, 'quantidade' => (int) $r['n'], 'valor' => $this->dinheiro($r['v'], (int) $r['n'])];
                $n += (int) $r['n']; $v = $this->somar($v, $dias[$k]['valor']);
            }
            // pedidos sem o id da situação/loja ainda entram: a resposta diz isso (nota "inclui vendas depois canceladas")
            $semId = function (string $col) use ($b, $p, $par, $w): bool {
                $st = $b->prepare("SELECT COUNT(*) FROM `{$p}bling_sales_orders` o WHERE $w AND o.$col IS NULL");
                $st->execute($par);
                return (int) $st->fetchColumn() > 0;
            };
            $out['inclui_cancelados'] = !$temSit || $semId('situacao_bling_id');
            $out['inclui_teste_ml'] = !$temLoja || $semId('loja_bling_id');
            // Decisão do Jhony (24/11): pedido SEM canal identificado → lacuna "sem_canal" ("Dados parciais · N pedido(s) ainda sem identificação de canal").
            // Sem a coluna loja_bling_id (antes da migração do portão BLING LOJA), nenhum pedido tem canal identificado.
            if ($temLoja) {
                $st = $b->prepare("SELECT COUNT(*) FROM `{$p}bling_sales_orders` o WHERE $w AND (o.loja_bling_id IS NULL OR o.loja_bling_id IN ('', '0'))");
                $st->execute($par);
                $out['sem_canal'] = (int) $st->fetchColumn();
            } else {
                $out['sem_canal'] = $n;
            }
            $out['quantidade'] = $n; $out['valor'] = $v; $out['por_dia'] = array_values($dias);
        } catch (Throwable $e) {
            error_log('[geral-v2] pedidos: ' . get_class($e));
            $out['por_dia'] = array_map(fn($d) => ['dia' => $d['dia'], 'quantidade' => null, 'valor' => null], array_values($dias));
            return array_merge($out, ['quantidade' => null, 'valor' => null, 'inclui_cancelados' => null, 'inclui_teste_ml' => null, 'sem_canal' => null,
                                      'estado' => 'indisponivel', 'lacunas' => []]);
        }
        $lacunas = $this->lacunasFonte($f);
        if ($out['sem_canal'] > 0) $lacunas[] = 'sem_canal';
        $estado = $this->estadoCartao($f, $out['quantidade']);
        if ($lacunas !== [] && in_array($estado, ['ok', 'zero_confirmado'], true)) $estado = 'parcial';
        return $out + ['estado' => $estado, 'lacunas' => $lacunas];
    }

    // ─────────────────────────────────────────── listas ───────────────────────────────────────────

    /**
     * Lista de uma prioridade. `total` sai da MESMA consulta do cartão (mesmo FROM/WHERE), então reproduz a contagem exatamente.
     * @param ?int $responsavel filtro por responsável (owner pipedrive id); o total devolvido é o do filtro e `total_sem_filtro` o do cartão
     */
    public function lista(string $prioridade, int $pagina = 1, ?int $responsavel = null, string $ordem = 'prazo', string $dir = 'asc', int $porPagina = self::POR_PAGINA): array
    {
        if (!in_array($prioridade, self::PRIORIDADES, true)) throw new GeralV2Erro('prioridade_invalida');
        if (!in_array($ordem, ['prazo', 'valor', 'responsavel'], true)) throw new GeralV2Erro('ordem_invalida');
        if (!in_array($dir, ['asc', 'desc'], true)) throw new GeralV2Erro('dir_invalida');
        $pagina = max(1, $pagina);
        $porPagina = max(1, min(self::POR_PAGINA, $porPagina));
        if ($prioridade === 'conflito_agenda') return $this->listaAgenda($pagina, $porPagina);

        $f = $this->fonte('pipedrive');
        $base = ['prioridade' => $prioridade, 'total' => null, 'total_sem_filtro' => null, 'pagina' => $pagina, 'por_pagina' => $porPagina,
                 'paginas' => null, 'atualizado_em' => $f['atualizado_em'], 'responsaveis' => null, 'sem_responsavel' => null, 'itens' => []];
        if ($this->semNumero($f)) return $base + ['estado' => $f['estado']];
        try {
            [$from, $par, $ref] = $this->basePrioridade($prioridade);
            $base['total_sem_filtro'] = $this->contarPrioridade($prioridade)['n'];   // = o número do cartão (mesma função)
            // responsáveis do conjunto SEM filtro (para o seletor da tela)
            $st = $this->pipe->prepare("SELECT d.owner_id AS id, (SELECT u.name FROM `{$this->p}pipe_users` u WHERE u.pipedrive_id = d.owner_id LIMIT 1) AS nome, COUNT(*) AS n
                                        $from AND d.owner_id IS NOT NULL GROUP BY d.owner_id ORDER BY nome IS NULL, nome, d.owner_id");
            $st->execute($par);
            $base['responsaveis'] = array_map(fn($x) => ['id' => (int) $x['id'], 'nome' => $x['nome'], 'quantidade' => (int) $x['n']], $st->fetchAll(PDO::FETCH_ASSOC));
            // negócios do conjunto SEM responsável: entram no número, mas não há o que escolher no seletor → Σ responsáveis + sem_responsavel = total_sem_filtro
            $st = $this->pipe->prepare("SELECT COUNT(*) $from AND d.owner_id IS NULL");
            $st->execute($par);
            $base['sem_responsavel'] = (int) $st->fetchColumn();
            $total = $this->contarPrioridade($prioridade, $responsavel)['n'];
            if ($responsavel !== null) { $from .= ' AND d.owner_id = :resp'; $par[':resp'] = $responsavel; }
            $p = $this->p;
            // nulos sempre no fim (nas duas direções); desempate fixo pelo negócio → paginação estável
            $D = $dir === 'desc' ? 'DESC' : 'ASC';
            $orderBy = match ($ordem) {
                'valor'       => "d.value IS NULL, d.value $D, $ref ASC, d.pipedrive_id ASC",
                'responsavel' => "responsavel IS NULL, responsavel $D, $ref ASC, d.pipedrive_id ASC",
                default       => "$ref IS NULL, $ref $D, d.pipedrive_id ASC",
            };
            $off = ($pagina - 1) * $porPagina;
            $st = $this->pipe->prepare(
                "SELECT d.pipedrive_id, d.title, d.value, d.currency, d.expected_close_date, $ref AS ref,
                        (SELECT o.name FROM `{$p}pipe_organizations` o WHERE o.pipedrive_id = d.org_id LIMIT 1) AS organizacao,
                        (SELECT u.name FROM `{$p}pipe_users` u WHERE u.pipedrive_id = d.owner_id LIMIT 1) AS responsavel,
                        (SELECT s.name FROM `{$p}pipe_stages` s WHERE s.pipedrive_id = d.stage_id LIMIT 1) AS etapa,
                        (SELECT pl.name FROM `{$p}pipe_pipelines` pl WHERE pl.pipedrive_id = d.pipeline_id LIMIT 1) AS funil,
                        d.owner_id
                 $from ORDER BY $orderBy LIMIT $porPagina OFFSET $off");
            $st->execute($par);
            $dominio = $this->dominioPipedrive();
            $hoje = $this->agora->setTime(0, 0);
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $ref = $r['ref'] !== null ? substr((string) $r['ref'], 0, 10) : null;
                $base['itens'][] = [
                    'negocio_id' => (int) $r['pipedrive_id'], 'titulo' => $r['title'], 'organizacao' => $r['organizacao'],
                    'responsavel' => $r['responsavel'], 'responsavel_id' => $r['owner_id'] !== null ? (int) $r['owner_id'] : null,
                    'valor' => $r['value'] !== null ? $this->normal((string) $r['value']) : null, 'moeda' => $r['currency'],
                    'etapa' => $r['etapa'], 'funil' => $r['funil'], 'referencia' => $ref,
                    // dias desde a referência (positivo = já passou; negativo = fechamento previsto ainda por vir)
                    'dias' => $ref !== null ? (int) round(($hoje->getTimestamp() - (new DateTimeImmutable($ref, $this->br))->getTimestamp()) / 86400) : null,
                    'fechamento_previsto' => $r['expected_close_date'] !== null ? substr((string) $r['expected_close_date'], 0, 10) : null,
                    'link' => $dominio !== null ? "https://$dominio/deal/" . (int) $r['pipedrive_id'] : null,
                ];
            }
            $base['total'] = $total;
            $base['paginas'] = max(1, (int) ceil($total / $porPagina));
        } catch (Throwable $e) {
            error_log('[geral-v2] lista ' . $prioridade . ': ' . get_class($e));
            return array_merge($base, ['total' => null, 'total_sem_filtro' => null, 'paginas' => null, 'responsaveis' => null, 'sem_responsavel' => null, 'itens' => [], 'estado' => 'indisponivel']);
        }
        return $base + ['estado' => $this->estadoCartao($f, $base['total'])];
    }

    private function listaAgenda(int $pagina, int $porPagina): array
    {
        $f = $this->fonte('google_calendar');
        $base = ['prioridade' => 'conflito_agenda', 'total' => null, 'total_sem_filtro' => null, 'pagina' => $pagina, 'por_pagina' => $porPagina,
                 'paginas' => null, 'atualizado_em' => $f['atualizado_em'], 'responsaveis' => null, 'itens' => []];
        if ($this->semNumero($f)) return $base + ['estado' => $f['estado']];
        try { $l = $this->conflitosHoje(); } catch (Throwable $e) { error_log('[geral-v2] conflitos: ' . get_class($e)); $l = null; }
        if ($l === null) return $base + ['estado' => 'indisponivel'];
        $itens = [];
        foreach ($l as $c) {
            $ev = array_values(is_array($c['eventos'] ?? null) ? $c['eventos'] : []);
            $a = $ev[0] ?? []; $b = $ev[1] ?? [];
            $itens[] = ['tipo' => $c['tipo'] ?? null, 'severidade' => $c['severidade'] ?? null, 'descricao' => $c['descricao'] ?? ($c['mensagem'] ?? null),
                'inicio' => $a['start'] ?? ($a['inicio'] ?? null), 'fim' => $b['end'] ?? ($b['fim'] ?? null),
                'titulo_a' => $a['summary'] ?? ($a['titulo'] ?? null), 'titulo_b' => $b['summary'] ?? ($b['titulo'] ?? null),
                'calendario_a' => $a['calendar_id'] ?? null, 'calendario_b' => $b['calendar_id'] ?? null];
        }
        $base['total'] = $base['total_sem_filtro'] = count($itens);
        $base['paginas'] = max(1, (int) ceil(count($itens) / $porPagina));
        $base['itens'] = array_slice($itens, ($pagina - 1) * $porPagina, $porPagina);
        return $base + ['estado' => $this->estadoCartao($f, $base['total'])];
    }

    /** Domínio da conta do Pipedrive para o link "Abrir negócio" (nova aba). Só host válido; senão null (sem link, nunca um link quebrado). */
    private function dominioPipedrive(): ?string
    {
        $d = $this->pipe->query("SELECT company_domain FROM `{$this->p}pipe_accounts` WHERE is_active = 1 AND status = 'connected' ORDER BY id LIMIT 1")->fetchColumn();
        if (!is_string($d) || $d === '') return null;
        $d = strtolower(trim($d));
        if (!str_contains($d, '.')) $d .= '.pipedrive.com';
        return preg_match('/^[a-z0-9-]{1,63}\.pipedrive\.com$/', $d) === 1 ? $d : null;
    }

    // ─────────────────────────────────────────── utilidades ───────────────────────────────────────────

    private function idadeMin(DateTimeImmutable $t): int
    {
        return intdiv($this->agora->getTimestamp() - $t->getTimestamp(), 60);
    }

    /** DECIMAL do MySQL → texto com 2 casas. SUM de nada é NULL: com 0 linhas somadas o valor é "0.00" (número de verdade), senão null. */
    private function dinheiro(mixed $v, int $linhas): ?string
    {
        if ($v === null) return $linhas === 0 ? '0.00' : null;
        return $this->normal((string) $v);
    }

    private function normal(string $v): string
    {
        if (preg_match('/^(-?)(\d+)(?:\.(\d{1,2})\d*)?$/', $v, $m) !== 1) throw new GeralV2Erro('valor_invalido');
        $int = ltrim($m[2], '0');
        return $m[1] . ($int === '' ? '0' : $int) . '.' . str_pad($m[3] ?? '', 2, '0');
    }

    private static function centavos(string $x): int
    {
        $neg = str_starts_with($x, '-');
        [$i, $d] = explode('.', ltrim($x, '-')) + [1 => '00'];
        $c = (int) $i * 100 + (int) str_pad(substr($d, 0, 2), 2, '0');
        return $neg ? -$c : $c;
    }

    /** Soma exata de dois valores "123.45" (centavos inteiros; sem float). */
    private function somar(string $a, string $b): string
    {
        $t = self::centavos($a) + self::centavos($b);
        $s = $t < 0 ? '-' : ''; $t = abs($t);
        return $s . intdiv($t, 100) . '.' . str_pad((string) ($t % 100), 2, '0', STR_PAD_LEFT);
    }
}
