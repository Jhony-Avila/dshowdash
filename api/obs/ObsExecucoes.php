<?php
declare(strict_types=1);

/**
 * api/obs/ObsExecucoes.php — OBS-001 · registro central de execuções de jobs · VINHO (ACIMA_ESQUERDA), 26/11/2026 noite.
 * Referência: LOTE9/OBS-001 (Execucoes.php), incorporada com testes próprios. Também é o caminho da MIG-001 (parte INTEGRACAO): os consumidores que
 * hoje leem sync_jobs / sync_jobs_history do banco legado (ninguém no repo grava lá) passam a ler daqui, um a um, pelo formato legado (comoSyncJobs/historico).
 *  - iniciar: grava início + posse exclusiva (lease) numa transação; execução duplicada (mesmo job/escopo/slot/tentativa) ou job/escopo já em
 *    andamento = false (o produtor NÃO roda o trabalho).
 *  - CONTRATO DO PRODUTOR: job mais longo que o ttl deve chamar renovar() ANTES de posse_ate; quem perde a posse não consegue encerrar com sucesso.
 *  - renovar: estende a posse só de quem a tem e antes de vencer (CAS). encerrar: só com a posse válida (ok/parcial/falhou); 'interrompida' só depois de vencer.
 *  - vigiar: o watchdog marca como 'interrompida' as execuções com a posse vencida e libera a posse delas.
 *  - última tentativa = MAX(iniciado_em); último sucesso = MAX(terminado_em) só em 'ok'; duração = terminado − iniciado (UTC). Volume desconhecido = null.
 * Sem payload, mensagem, URL ou nome: identificadores técnicos do catálogo e códigos de erro de uma lista fechada.
 */
final class ObsExecucoes
{
    public const ESTADOS_FIM = ['ok', 'parcial', 'falhou', 'interrompida'];
    public const ERROS = ['tempo', 'fonte', 'cobertura', 'interrompida', 'interno'];
    private const RE_ID = '/^[a-z0-9][a-z0-9._-]{0,39}\z/';
    private readonly DateTimeZone $utc;

    public function __construct(private readonly PDO $pdo, private readonly string $p = '')
    {
        if ($p !== '' && preg_match('/^[a-z0-9_]{1,24}\z/', $p) !== 1) throw new InvalidArgumentException('prefixo inválido');
        $this->utc = new DateTimeZone('UTC');
    }

    private function t(string $n): string { return "`{$this->p}{$n}`"; }
    private function u(DateTimeImmutable $d, bool $ms = true): string { return $d->setTimezone($this->utc)->format($ms ? 'Y-m-d H:i:s.v' : 'Y-m-d H:i:s'); }

    private function chave(string $job, string $escopo, DateTimeImmutable $slot, int $tentativa): array
    {
        if (preg_match(self::RE_ID, $job) !== 1 || ($escopo !== '-' && preg_match(self::RE_ID, $escopo) !== 1) || $tentativa < 1 || $tentativa > 1000)
            throw new InvalidArgumentException('identidade');
        return [$job, $escopo, $this->u($slot, false), $tentativa];
    }

    public function iniciar(string $job, string $escopo, DateTimeImmutable $slot, int $tentativa, int $ttlSeg, DateTimeImmutable $agora): bool
    {
        if ($ttlSeg < 1 || $ttlSeg > 86400) throw new InvalidArgumentException('ttl');
        $k = $this->chave($job, $escopo, $slot, $tentativa);
        $this->pdo->beginTransaction();
        try {
            // revisão do AZUL (I1, 27/11): uma posse VENCIDA do mesmo job+escopo (processo que caiu sem encerrar) é interrompida AQUI, na mesma transação,
            // com a posse travada (FOR UPDATE) — sem depender de um cron do vigiar(). Posse ainda válida = outra execução em andamento: não roda.
            $st = $this->pdo->prepare("SELECT p.`slot`, p.`tentativa`, e.`posse_ate` FROM {$this->t('obs_posse')} p JOIN {$this->t('obs_execucao')} e
                                          ON e.`job` = p.`job` AND e.`escopo` = p.`escopo` AND e.`slot` = p.`slot` AND e.`tentativa` = p.`tentativa`
                                        WHERE p.`job` = ? AND p.`escopo` = ? FOR UPDATE");
            $st->execute([$k[0], $k[1]]); $pv = $st->fetch(PDO::FETCH_ASSOC);
            if ($pv !== false) {
                if ((string) $pv['posse_ate'] > $this->u($agora)) { $this->pdo->rollBack(); return false; }
                $ant = [$k[0], $k[1], (string) $pv['slot'], (int) $pv['tentativa']];
                $this->pdo->prepare("UPDATE {$this->t('obs_execucao')} SET `estado` = 'interrompida', `erro_codigo` = 'interrompida', `terminado_em` = ?
                                      WHERE `job` = ? AND `escopo` = ? AND `slot` = ? AND `tentativa` = ? AND `estado` = 'executando'")->execute([$this->u($agora), ...$ant]);
                $this->pdo->prepare("DELETE FROM {$this->t('obs_posse')} WHERE `job` = ? AND `escopo` = ?")->execute([$k[0], $k[1]]);
            }
            $this->pdo->prepare("INSERT INTO {$this->t('obs_execucao')} (`job`,`escopo`,`slot`,`tentativa`,`iniciado_em`,`estado`,`posse_ate`) VALUES (?,?,?,?,?, 'executando', ?)")
                ->execute([...$k, $this->u($agora), $this->u($agora->modify("+{$ttlSeg} seconds"))]);
            $this->pdo->prepare("INSERT INTO {$this->t('obs_posse')} (`job`,`escopo`,`slot`,`tentativa`) VALUES (?,?,?,?)")->execute($k);
            $this->pdo->commit();
            return true;
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            if ((int) ($e->errorInfo[1] ?? 0) === 1062) return false;   // duplicada ou job/escopo já em andamento: não roda
            throw $e;
        }
    }

    public function renovar(string $job, string $escopo, DateTimeImmutable $slot, int $tentativa, int $ttlSeg, DateTimeImmutable $agora): bool
    {
        if ($ttlSeg < 1 || $ttlSeg > 86400) throw new InvalidArgumentException('ttl');
        $k = $this->chave($job, $escopo, $slot, $tentativa);
        $st = $this->pdo->prepare("UPDATE {$this->t('obs_execucao')} SET `posse_ate` = ? WHERE `job` = ? AND `escopo` = ? AND `slot` = ? AND `tentativa` = ? AND `estado` = 'executando' AND `posse_ate` > ?");
        $st->execute([$this->u($agora->modify("+{$ttlSeg} seconds")), ...$k, $this->u($agora)]);
        return $st->rowCount() === 1;
    }

    public function encerrar(string $job, string $escopo, DateTimeImmutable $slot, int $tentativa, string $estado, ?int $volume, ?string $erro, DateTimeImmutable $agora): bool
    {
        if (!in_array($estado, self::ESTADOS_FIM, true) || ($volume !== null && $volume < 0) || ($erro !== null && !in_array($erro, self::ERROS, true)) || ($estado === 'ok' && $erro !== null))
            throw new InvalidArgumentException('encerramento');
        $k = $this->chave($job, $escopo, $slot, $tentativa);
        $cond = $estado === 'interrompida' ? '`posse_ate` <= ?' : '`posse_ate` > ?';
        $this->pdo->beginTransaction();
        try {
            $st = $this->pdo->prepare("UPDATE {$this->t('obs_execucao')} SET `estado` = ?, `volume` = ?, `erro_codigo` = ?, `terminado_em` = ?
                                         WHERE `job` = ? AND `escopo` = ? AND `slot` = ? AND `tentativa` = ? AND `estado` = 'executando' AND $cond");
            $st->execute([$estado, $volume, $erro, $this->u($agora), ...$k, $this->u($agora)]);
            if ($st->rowCount() !== 1) { $this->pdo->rollBack(); return false; }
            $this->pdo->prepare("DELETE FROM {$this->t('obs_posse')} WHERE `job` = ? AND `escopo` = ? AND `slot` = ? AND `tentativa` = ?")->execute($k);
            $this->pdo->commit();
            return true;
        } catch (Throwable $e) { if ($this->pdo->inTransaction()) $this->pdo->rollBack(); throw $e; }
    }

    /** Watchdog: posse vencida = 'interrompida' (erro 'interrompida', volume null). Devolve quantas. */
    public function vigiar(DateTimeImmutable $agora): int
    {
        $st = $this->pdo->prepare("SELECT `job`,`escopo`,`slot`,`tentativa` FROM {$this->t('obs_execucao')} WHERE `estado` = 'executando' AND `posse_ate` <= ?");
        $st->execute([$this->u($agora)]); $n = 0;
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r)
            if ($this->encerrar($r['job'], $r['escopo'], new DateTimeImmutable($r['slot'], $this->utc), (int) $r['tentativa'], 'interrompida', null, 'interrompida', $agora)) $n++;
        return $n;
    }

    private function iso(?string $v): ?string { return $v === null ? null : (new DateTimeImmutable($v, $this->utc))->format('Y-m-d\TH:i:s.v\Z'); }

    /** Resumo por job+escopo: última tentativa, último sucesso, estado da última, duração e volume da última OK. Sem linha = tudo null (nunca zero). */
    public function resumo(string $job, string $escopo = '-'): array
    {
        $this->chave($job, $escopo, new DateTimeImmutable('@0'), 1);
        $st = $this->pdo->prepare("SELECT MAX(`iniciado_em`) AS t, MAX(CASE WHEN `estado` = 'ok' THEN `terminado_em` END) AS s FROM {$this->t('obs_execucao')} WHERE `job` = ? AND `escopo` = ?");
        $st->execute([$job, $escopo]); $a = $st->fetch(PDO::FETCH_ASSOC);
        $u = $this->pdo->prepare("SELECT `estado`,`erro_codigo` FROM {$this->t('obs_execucao')} WHERE `job` = ? AND `escopo` = ? ORDER BY `iniciado_em` DESC, `tentativa` DESC LIMIT 1");
        $u->execute([$job, $escopo]); $ult = $u->fetch(PDO::FETCH_ASSOC) ?: null;
        $k = $this->pdo->prepare("SELECT TIMESTAMPDIFF(MICROSECOND, `iniciado_em`, `terminado_em`) / 1000000 AS d, `volume` FROM {$this->t('obs_execucao')}
                                   WHERE `job` = ? AND `escopo` = ? AND `estado` = 'ok' ORDER BY `terminado_em` DESC LIMIT 1");
        $k->execute([$job, $escopo]); $ok = $k->fetch(PDO::FETCH_ASSOC) ?: null;
        return ['job' => $job, 'escopo' => $escopo, 'ultima_tentativa' => $this->iso($a['t'] ?? null), 'ultimo_sucesso' => $this->iso($a['s'] ?? null),
                'estado_ultima' => $ult['estado'] ?? null, 'erro_ultima' => $ult['erro_codigo'] ?? null,
                'duracao_s_ultima_ok' => $ok !== null ? round((float) $ok['d'], 3) : null, 'volume_ultima_ok' => $ok !== null && $ok['volume'] !== null ? (int) $ok['volume'] : null];
    }

    /**
     * MIG-001 · o formato LEGADO de sync_jobs (para os consumidores da INTEGRACAO migrarem um a um). O que o registro não comprova vai null:
     * next_execution e cron_expression (vêm do catálogo ratificado), description. success_rate e avg_execution_time sobre as últimas $janela execuções terminadas.
     */
    public function comoSyncJobs(int $janela = 50): array
    {
        $out = [];
        foreach ($this->pdo->query("SELECT DISTINCT `job`, `escopo` FROM {$this->t('obs_execucao')} ORDER BY `job`, `escopo`")->fetchAll(PDO::FETCH_ASSOC) as $j) {
            $r = $this->resumo($j['job'], $j['escopo']);
            $st = $this->pdo->prepare("SELECT `estado`, TIMESTAMPDIFF(MICROSECOND, `iniciado_em`, `terminado_em`) / 1000000 AS d FROM {$this->t('obs_execucao')}
                                        WHERE `job` = ? AND `escopo` = ? AND `estado` <> 'executando' ORDER BY `iniciado_em` DESC LIMIT " . max(1, min(500, $janela)));
            $st->execute([$j['job'], $j['escopo']]); $h = $st->fetchAll(PDO::FETCH_ASSOC);
            $ok = array_values(array_filter($h, fn($x) => $x['estado'] === 'ok'));
            $tot = $this->pdo->prepare("SELECT COUNT(*) FROM {$this->t('obs_execucao')} WHERE `job` = ? AND `escopo` = ?"); $tot->execute([$j['job'], $j['escopo']]);
            $andando = $this->pdo->prepare("SELECT COUNT(*) FROM {$this->t('obs_posse')} WHERE `job` = ? AND `escopo` = ?"); $andando->execute([$j['job'], $j['escopo']]);
            $out[] = ['job_name' => $j['escopo'] === '-' ? $j['job'] : $j['job'] . '@' . $j['escopo'], 'job_type' => null, 'description' => null,
                      'is_running' => (int) $andando->fetchColumn() > 0, 'last_execution' => $r['ultima_tentativa'], 'last_success' => $r['ultimo_sucesso'],
                      'next_execution' => null, 'cron_expression' => null,
                      'error_count' => $h === [] ? null : count(array_filter($h, fn($x) => in_array($x['estado'], ['falhou', 'interrompida'], true))),
                      'success_rate' => $h === [] ? null : round(count($ok) / count($h) * 100, 1),
                      'avg_execution_time' => $ok === [] ? null : round(array_sum(array_map(fn($x) => (float) $x['d'], $ok)) / count($ok), 3),
                      'total_executions' => (int) $tot->fetchColumn()];
        }
        return $out;
    }

    /**
     * MIG-001 · piloto do 1º consumidor (api/monitoring/get_jobs_status.php): a MESMA resposta {jobs, statistics, filters, total} a partir do registro.
     * Filtros do legado: is_active ('' = todos; no registro todo job registrado é "ativo"), job_type (o registro não tem tipo: filtro → nenhum),
     * search (no job_name), limit; ordem last_execution DESC. id/created_at/updated_at/description/job_type não existem no registro → null.
     */
    public static function jobsStatusLegado(array $linhas, string $isActive, string $jobType, string $search, int $limit): array
    {
        $j = array_values(array_filter($linhas, fn($x) => ($isActive === '' || $isActive === '1') && $jobType === '' && ($search === '' || stripos($x['job_name'], $search) !== false)));
        usort($j, fn($a, $b) => strcmp((string) $b['last_execution'], (string) $a['last_execution']) ?: strcmp($a['job_name'], $b['job_name']));
        $j = array_map(fn($x) => ['id' => null, 'job_name' => $x['job_name'], 'job_type' => null, 'description' => null, 'is_active' => 1, 'is_running' => $x['is_running'] ? 1 : 0,
            'error_count' => $x['error_count'], 'last_execution' => $x['last_execution'], 'last_success' => $x['last_success'], 'success_rate' => $x['success_rate'],
            'avg_execution_time' => $x['avg_execution_time'], 'total_executions' => $x['total_executions'], 'created_at' => null, 'updated_at' => null], array_slice($j, 0, max(1, min(1000, $limit))));
        $taxas = array_values(array_filter(array_column($linhas, 'success_rate'), fn($v) => $v !== null));
        return ['jobs' => $j, 'statistics' => ['total_jobs' => count($linhas), 'active_jobs' => count($linhas),
                'jobs_with_errors' => count(array_filter($linhas, fn($x) => ($x['error_count'] ?? 0) > 0)),
                'avg_success_rate' => $taxas === [] ? null : round(array_sum($taxas) / count($taxas), 2)],
                'filters' => ['is_active' => $isActive, 'job_type' => $jobType, 'search' => $search, 'limit' => $limit], 'total' => count($j)];   // a fonte vai no meta (formato do data idêntico)
    }

    /** MIG-001 · a flag GLOBAL que troca os consumidores para o registro (ausente, desligada ou ilegível = false = o legado de sempre). */
    public static function fonteRegistroLigada(Closure $resolver, ?Closure $lerCache = null, ?Closure $gravarCache = null): bool
    {
        // revisão do VERDE (27/11, achado médio): a decisão da flag fica 60 s no cache (Redis) — antes, CADA requisição abria o MySQL para ler a flag,
        // mesmo quando a resposta saía do cache. Erro ao resolver = false e NÃO vai para o cache (a próxima requisição tenta de novo).
        $c = $lerCache !== null ? $lerCache(self::CHAVE_FLAG) : null;
        if ($c === '1' || $c === '0') return $c === '1';
        try { $v = (($resolver('obs_monitoramento', null)['enabled'] ?? false) === true); } catch (Throwable) { return false; }
        if ($gravarCache !== null) $gravarCache(self::CHAVE_FLAG, $v ? '1' : '0', 60);
        return $v;
    }
    public const CHAVE_FLAG = 'obs:flag:obs_monitoramento';

    /**
     * MIG-001 · 2º consumidor (api/monitoring/executions_hourly.php): execuções das últimas 24 h por HORA (fuso de Brasília), no formato legado
     * [{hour, total, success, errors, avg_time}]: success = ok; errors = falhou/interrompida que não foram por tempo; avg_time = média das terminadas
     * (null sem nenhuma terminada, nunca 0). Hora sem execução não aparece (como no GROUP BY do legado).
     */
    public function porHora24h(DateTimeImmutable $agora, DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo')): array
    {
        $st = $this->pdo->prepare("SELECT `iniciado_em`, `estado`, `erro_codigo`, TIMESTAMPDIFF(MICROSECOND, `iniciado_em`, `terminado_em`) / 1000000 AS d
                                     FROM {$this->t('obs_execucao')} WHERE `iniciado_em` >= ?");
        $st->execute([$this->u($agora->modify('-24 hours'))]);
        $h = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $k = (int) (new DateTimeImmutable((string) $r['iniciado_em'], $this->utc))->setTimezone($fuso)->format('G');
            $h[$k] ??= ['hour' => $k, 'total' => 0, 'success' => 0, 'errors' => 0, 'd' => []];
            $h[$k]['total']++;
            if ($r['estado'] === 'ok') $h[$k]['success']++;
            if (in_array($r['estado'], ['falhou', 'interrompida'], true) && $r['erro_codigo'] !== 'tempo') $h[$k]['errors']++;
            if ($r['d'] !== null) $h[$k]['d'][] = (float) $r['d'];
        }
        ksort($h);
        return array_values(array_map(fn($x) => ['hour' => $x['hour'], 'total' => $x['total'], 'success' => $x['success'], 'errors' => $x['errors'],
            'avg_time' => $x['d'] === [] ? null : round(array_sum($x['d']) / count($x['d']), 3)], $h));
    }

    /**
     * MIG-001 lote 1 (cards da tela inicial): números do DIA civil de Brasília a partir do registro. Contagens de verdade (0 = nenhuma execução
     * registrada hoje); média sem execução terminada = null; ativos = jobs+escopos que já registraram execução (no registro todo job é "ativo").
     * @return array{concluidas:int, falhas:int, total:int, tempo_medio_s:?float, ativos:int}
     */
    public function contagensDoDia(DateTimeImmutable $agora, DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo')): array
    {
        $ini = $agora->setTimezone($fuso)->setTime(0, 0); $fim = $ini->modify('+1 day');
        $st = $this->pdo->prepare("SELECT COUNT(*) AS total, COALESCE(SUM(`estado` = 'ok'), 0) AS ok,
                                          COALESCE(SUM(`estado` IN ('falhou','interrompida') AND (`erro_codigo` IS NULL OR `erro_codigo` <> 'tempo')), 0) AS falhas,
                                          AVG(CASE WHEN `terminado_em` IS NOT NULL THEN TIMESTAMPDIFF(MICROSECOND, `iniciado_em`, `terminado_em`) / 1000000 END) AS media
                                     FROM {$this->t('obs_execucao')} WHERE `iniciado_em` >= ? AND `iniciado_em` < ?");
        $st->execute([$this->u($ini), $this->u($fim)]); $r = $st->fetch(PDO::FETCH_ASSOC);
        $at = (int) $this->pdo->query("SELECT COUNT(*) FROM (SELECT DISTINCT `job`, `escopo` FROM {$this->t('obs_execucao')}) x")->fetchColumn();
        return ['concluidas' => (int) $r['ok'], 'falhas' => (int) $r['falhas'], 'total' => (int) $r['total'],
                'tempo_medio_s' => $r['media'] !== null ? round((float) $r['media'], 2) : null, 'ativos' => $at];
    }

    /**
     * MIG-001 lote 2 (cards 02, 03, 04, 08, 10): o que esses cards precisam, do registro. Sem base = null (nunca 0 inventado).
     *  - janela24h: execuções iniciadas nas últimas 24 h (total, ok, falhas = falhou/interrompida que não foram por tempo);
     *  - pico: a hora (Brasília) com mais execuções HOJE e quantas (empate = a hora menor); null sem execução hoje;
     *  - por_hora_hoje: execuções de hoje ÷ max(horas inteiras entre a 1ª e a última, 1) (a fórmula do legado); null sem execução hoje;
     *  - media_taxa / media_tempo: médias, entre os jobs, de success_rate e avg_execution_time (comoSyncJobs); null sem job com o dado; jobs = quantos.
     */
    public function metricasCards(DateTimeImmutable $agora, DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo')): array
    {
        $st = $this->pdo->prepare("SELECT COUNT(*) AS t, COALESCE(SUM(`estado` = 'ok'), 0) AS ok,
                                          COALESCE(SUM(`estado` IN ('falhou','interrompida') AND (`erro_codigo` IS NULL OR `erro_codigo` <> 'tempo')), 0) AS f
                                     FROM {$this->t('obs_execucao')} WHERE `iniciado_em` > ?");
        $st->execute([$this->u($agora->modify('-24 hours'))]); $j = $st->fetch(PDO::FETCH_ASSOC);
        $ini = $agora->setTimezone($fuso)->setTime(0, 0);
        $h = $this->pdo->prepare("SELECT `iniciado_em` FROM {$this->t('obs_execucao')} WHERE `iniciado_em` >= ? AND `iniciado_em` < ? ORDER BY `iniciado_em`");
        $h->execute([$this->u($ini), $this->u($ini->modify('+1 day'))]); $hoje = $h->fetchAll(PDO::FETCH_COLUMN);
        $porHora = []; foreach ($hoje as $t) { $k = (int) (new DateTimeImmutable((string) $t, $this->utc))->setTimezone($fuso)->format('G'); $porHora[$k] = ($porHora[$k] ?? 0) + 1; }
        $pico = null; if ($porHora !== []) { $max = max($porHora); $hr = min(array_keys(array_filter($porHora, fn($n) => $n === $max))); $pico = ['hora' => $hr, 'execucoes' => $max]; }
        $ph = null;
        if ($hoje !== []) {
            $horas = intdiv((new DateTimeImmutable((string) end($hoje), $this->utc))->getTimestamp() - (new DateTimeImmutable((string) $hoje[0], $this->utc))->getTimestamp(), 3600);
            $ph = round(count($hoje) / max($horas, 1), 1);
        }
        $sj = $this->comoSyncJobs();
        $tx = array_values(array_filter(array_column($sj, 'success_rate'), fn($v) => $v !== null));
        $tm = array_values(array_filter(array_column($sj, 'avg_execution_time'), fn($v) => $v !== null));
        return ['janela24h' => ['total' => (int) $j['t'], 'ok' => (int) $j['ok'], 'falhas' => (int) $j['f']], 'pico' => $pico, 'por_hora_hoje' => $ph,
                'media_taxa' => $tx === [] ? null : array_sum($tx) / count($tx), 'media_tempo' => $tm === [] ? null : array_sum($tm) / count($tm), 'jobs' => count($sj)];
    }

    /**
     * MIG-001 lote 3 (api/monitoring/*): uma linha no formato da sync_jobs com SÓ as colunas pedidas, na ordem pedida. O que o registro não
     * tem vem null (id, job_type, description, cron_expression, next_execution); is_active = 1 (todo job registrado é "ativo"); active_count = 1
     * se o job está com posse (em andamento), senão 0.
     */
    public static function linhaLegado(array $x, array $campos): array
    {
        $v = ['id' => null, 'job_name' => $x['job_name'], 'job_type' => null, 'description' => null, 'is_active' => 1, 'is_running' => $x['is_running'] ? 1 : 0,
              'cron_expression' => null, 'last_execution' => $x['last_execution'], 'last_success' => $x['last_success'], 'next_execution' => null,
              'success_rate' => $x['success_rate'], 'error_count' => $x['error_count'], 'total_executions' => $x['total_executions'], 'active_count' => $x['is_running'] ? 1 : 0,
              'avg_execution_time' => $x['avg_execution_time']];
        $out = []; foreach ($campos as $c) { if (!array_key_exists($c, $v)) throw new InvalidArgumentException('campo'); $out[$c] = $v[$c]; }
        return $out;
    }

    /** MIG-001 lote 3: as 5 respostas de api/monitoring/* no formato legado (o que depende do catálogo — cron, tipo — fica vazio com total null). */
    public static function monitoringLegado(string $rota, array $sj): array
    {
        $porNome = $sj; usort($porNome, fn($a, $b) => strcmp($a['job_name'], $b['job_name']));
        $porExec = $sj; usort($porExec, fn($a, $b) => strcmp((string) $b['last_execution'], (string) $a['last_execution']) ?: strcmp($a['job_name'], $b['job_name']));
        $l = fn(array $lista, array $c) => array_map(fn($x) => self::linhaLegado($x, $c), $lista);
        switch ($rota) {
            case 'cron-jobs-status':   // legado: só jobs COM cron_expression; o registro não sabe o cron (catálogo) → lista vazia, total desconhecido
                return ['jobs' => [], 'total' => null];
            case 'cron-jobs-minimal':
                $j = $l($porNome, ['id', 'job_name', 'is_active', 'is_running', 'success_rate']); return ['jobs' => $j, 'total' => count($j)];
            case 'cron-status':
                $j = $l($porNome, ['id', 'job_name', 'job_type', 'description', 'is_active', 'is_running', 'cron_expression', 'last_execution', 'last_success', 'next_execution', 'success_rate', 'error_count', 'total_executions']);
                return ['jobs' => $j, 'stats' => ['total' => count($j), 'active' => count($j), 'running' => count(array_filter($j, fn($x) => $x['is_running'] === 1)),
                        'with_errors' => count(array_filter($j, fn($x) => ($x['error_count'] ?? 0) > 0))]];
            case 'cache-jobs':          // legado: job_type LIKE '%cache%'; o registro não tem tipo → lista vazia, total desconhecido
                return ['jobs' => [], 'total' => null];
            case 'running-scripts':
                $j = $l(array_values(array_filter($porExec, fn($x) => $x['is_running'])), ['id', 'job_name', 'job_type', 'description', 'last_execution', 'active_count']);
                return ['scripts' => $j, 'count' => count($j)];
        }
        throw new InvalidArgumentException('rota');
    }

    /** MIG-001 lote 4: execuções iniciadas nas últimas $horas (total, success = ok, errors = falhou/interrompida exceto por tempo, avg_time das terminadas ou null). */
    public function janelaHoras(DateTimeImmutable $agora, int $horas): array
    {
        $st = $this->pdo->prepare("SELECT COUNT(*) AS total, COALESCE(SUM(`estado` = 'ok'), 0) AS success,
                                          COALESCE(SUM(`estado` IN ('falhou','interrompida') AND (`erro_codigo` IS NULL OR `erro_codigo` <> 'tempo')), 0) AS errors,
                                          AVG(CASE WHEN `terminado_em` IS NOT NULL THEN TIMESTAMPDIFF(MICROSECOND, `iniciado_em`, `terminado_em`) / 1000000 END) AS avg_time
                                     FROM {$this->t('obs_execucao')} WHERE `iniciado_em` > ?");
        $st->execute([$this->u($agora->modify("-{$horas} hours"))]); $r = $st->fetch(PDO::FETCH_ASSOC);
        return ['total' => (int) $r['total'], 'success' => (int) $r['success'], 'errors' => (int) $r['errors'], 'avg_time' => $r['avg_time'] !== null ? round((float) $r['avg_time'], 3) : null];
    }

    /** MIG-001 lote 4 (api/health/heatmap.php): por DIA e HORA de Brasília desde a meia-noite de hoje − $dias, no formato legado. */
    public function mapaDeCalor(DateTimeImmutable $agora, int $dias, DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo')): array
    {
        $ini = $agora->setTimezone($fuso)->setTime(0, 0)->modify("-{$dias} days");
        $st = $this->pdo->prepare("SELECT `iniciado_em`, `estado`, `erro_codigo` FROM {$this->t('obs_execucao')} WHERE `iniciado_em` >= ? ORDER BY `iniciado_em`");
        $st->execute([$this->u($ini)]); $m = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $t = (new DateTimeImmutable((string) $r['iniciado_em'], $this->utc))->setTimezone($fuso); $k = $t->format('Y-m-d') . '|' . (int) $t->format('G');
            $m[$k] ??= ['date' => $t->format('Y-m-d'), 'hour' => (int) $t->format('G'), 'total' => 0, 'success' => 0, 'errors' => 0];
            $m[$k]['total']++; if ($r['estado'] === 'ok') $m[$k]['success']++;
            if (in_array($r['estado'], ['falhou', 'interrompida'], true) && $r['erro_codigo'] !== 'tempo') $m[$k]['errors']++;
        }
        ksort($m, SORT_NATURAL);
        return array_values(array_map(fn($x) => $x + ['success_rate' => round($x['success'] / $x['total'] * 100, 2)], $m));
    }

    /** MIG-001 lote 4: as respostas de get_cron_frequencies, get_jobs_by_category e metrics no formato legado. */
    public static function monitoringLegado2(string $rota, array $sj, array $j24 = [], array $j1 = []): array
    {
        $taxas = array_values(array_filter(array_column($sj, 'success_rate'), fn($v) => $v !== null));
        $media = $taxas === [] ? null : round(array_sum($taxas) / count($taxas), 4);
        $run = count(array_filter($sj, fn($x) => $x['is_running']));
        switch ($rota) {
            case 'cron-frequencies':   // o cron é do catálogo: sem ele, lista vazia e total desconhecido
                return ['frequencies' => [], 'total' => null];
            case 'jobs-by-category':   // o registro não tem tipo: uma categoria só, null (desconhecida)
                return $sj === [] ? ['categories' => [], 'total_categories' => 0]
                    : ['categories' => [['category' => null, 'total' => count($sj), 'active' => count($sj), 'running' => $run, 'avg_success_rate' => $media]], 'total_categories' => 1];
            case 'metrics':
                return ['jobs' => ['total' => count($sj), 'active' => count($sj), 'running' => $run, 'with_errors' => count(array_filter($sj, fn($x) => ($x['error_count'] ?? 0) > 0)), 'avg_success_rate' => $media],
                        'executions_24h' => $j24, 'executions_1h' => ['total' => $j1['total'], 'success' => $j1['success'], 'errors' => $j1['errors']],
                        'success_rate_24h' => $j24['total'] > 0 ? round($j24['success'] / $j24['total'] * 100, 2) : null];
        }
        throw new InvalidArgumentException('rota');
    }

    /** MIG-001 lote 5 (api/dashboard/status-jobs.php): {counts, running, with_errors} no formato legado. */
    public static function statusJobsLegado(array $sj): array
    {
        $run = array_values(array_filter($sj, fn($x) => $x['is_running'])); usort($run, fn($a, $b) => strcmp((string) $a['last_execution'], (string) $b['last_execution']) ?: strcmp($a['job_name'], $b['job_name']));
        $err = array_values(array_filter($sj, fn($x) => ($x['error_count'] ?? 0) > 0)); usort($err, fn($a, $b) => $b['error_count'] <=> $a['error_count'] ?: strcmp($a['job_name'], $b['job_name']));
        return ['counts' => ['total' => count($sj), 'active' => count($sj), 'inactive' => 0, 'running' => count($run), 'with_errors' => count($err)],
                'running' => array_map(fn($x) => self::linhaLegado($x, ['id', 'job_name', 'last_execution', 'avg_execution_time']), $run),
                'with_errors' => array_map(fn($x) => self::linhaLegado($x, ['id', 'job_name', 'error_count', 'last_execution']), array_slice($err, 0, 10))];
    }

    /** MIG-001 lote 5 (api/dashboard/status_executions.php): {stats_24h, recent (20 mais recentes de todos os jobs), by_hour (12 h, 'Y-m-d H:00' de Brasília)}. */
    public function statusExecucoesLegado(DateTimeImmutable $agora, DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo')): array
    {
        $st = $this->pdo->query("SELECT `job`, `escopo`, `estado`, `erro_codigo`, `iniciado_em`, `volume`, TIMESTAMPDIFF(MICROSECOND, `iniciado_em`, `terminado_em`) / 1000000 AS d
                                   FROM {$this->t('obs_execucao')} ORDER BY `iniciado_em` DESC, `job`, `escopo` LIMIT 20");
        $recent = array_map(fn($x) => ['job_name' => $x['escopo'] === '-' ? $x['job'] : $x['job'] . '@' . $x['escopo'],
            'status' => match ($x['estado']) { 'ok' => 'success', 'parcial' => 'partial', 'executando' => 'running', default => $x['erro_codigo'] === 'tempo' ? 'timeout' : 'error' },
            'execution_start' => $this->iso($x['iniciado_em']), 'execution_time_seconds' => $x['d'] !== null ? round((float) $x['d'], 3) : null,
            'rows_affected' => $x['volume'] !== null ? (int) $x['volume'] : null], $st->fetchAll(PDO::FETCH_ASSOC));
        $h = $this->pdo->prepare("SELECT `iniciado_em`, `estado`, `erro_codigo` FROM {$this->t('obs_execucao')} WHERE `iniciado_em` > ?");
        $h->execute([$this->u($agora->modify('-12 hours'))]); $bh = [];
        foreach ($h->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $k = (new DateTimeImmutable((string) $r['iniciado_em'], $this->utc))->setTimezone($fuso)->format('Y-m-d H:00');
            $bh[$k] ??= ['hour' => $k, 'total' => 0, 'success' => 0, 'errors' => 0]; $bh[$k]['total']++;
            if ($r['estado'] === 'ok') $bh[$k]['success']++;
            if (in_array($r['estado'], ['falhou', 'interrompida'], true) && $r['erro_codigo'] !== 'tempo') $bh[$k]['errors']++;
        }
        ksort($bh);
        return ['stats_24h' => $this->janelaHoras($agora, 24), 'recent' => $recent, 'by_hour' => array_values($bh)];
    }

    /** MIG-001 lote 5 (api/dashboard/performance.php): {slow_jobs, error_jobs, most_executed, period} nos últimos $dias, no formato legado (top 10 cada). */
    public function desempenhoLegado(DateTimeImmutable $agora, int $dias, string $periodo): array
    {
        $st = $this->pdo->prepare("SELECT `job`, `escopo`, `estado`, `erro_codigo`, `iniciado_em`, TIMESTAMPDIFF(MICROSECOND, `iniciado_em`, `terminado_em`) / 1000000 AS d
                                     FROM {$this->t('obs_execucao')} WHERE `iniciado_em` > ?");
        $st->execute([$this->u($agora->modify("-{$dias} days"))]); $j = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $n = $r['escopo'] === '-' ? $r['job'] : $r['job'] . '@' . $r['escopo'];
            $j[$n] ??= ['ok_d' => [], 'erros' => 0, 'ultimo_erro' => null, 'exec' => 0, 'sucessos' => 0];
            $j[$n]['exec']++;
            if ($r['estado'] === 'ok') { $j[$n]['sucessos']++; if ($r['d'] !== null) $j[$n]['ok_d'][] = (float) $r['d']; }
            if (in_array($r['estado'], ['falhou', 'interrompida'], true) && $r['erro_codigo'] !== 'tempo') {
                $j[$n]['erros']++; $t = $this->iso((string) $r['iniciado_em']); if ($j[$n]['ultimo_erro'] === null || $t > $j[$n]['ultimo_erro']) $j[$n]['ultimo_erro'] = $t;
            }
        }
        $lento = []; $err = []; $mais = [];
        foreach ($j as $n => $x) {
            if ($x['ok_d'] !== []) $lento[] = ['job_name' => $n, 'avg_time' => round(array_sum($x['ok_d']) / count($x['ok_d']), 3), 'max_time' => round(max($x['ok_d']), 3), 'executions' => count($x['ok_d'])];
            if ($x['erros'] > 0) $err[] = ['job_name' => $n, 'error_count' => $x['erros'], 'last_error' => $x['ultimo_erro']];
            $mais[] = ['job_name' => $n, 'executions' => $x['exec'], 'successes' => $x['sucessos'], 'errors' => $x['erros']];
        }
        usort($lento, fn($a, $b) => $b['avg_time'] <=> $a['avg_time'] ?: strcmp($a['job_name'], $b['job_name']));
        usort($err, fn($a, $b) => $b['error_count'] <=> $a['error_count'] ?: strcmp($a['job_name'], $b['job_name']));
        usort($mais, fn($a, $b) => $b['executions'] <=> $a['executions'] ?: strcmp($a['job_name'], $b['job_name']));
        return ['slow_jobs' => array_slice($lento, 0, 10), 'error_jobs' => array_slice($err, 0, 10), 'most_executed' => array_slice($mais, 0, 10), 'period' => $periodo];
    }

    /** MIG-001 · o formato LEGADO de sync_jobs_history (status: success | partial | error | timeout | running). rows_affected = volume (null = desconhecido). */
    public function historico(string $job, string $escopo = '-', int $limite = 100): array
    {
        $this->chave($job, $escopo, new DateTimeImmutable('@0'), 1);
        $st = $this->pdo->prepare("SELECT `estado`,`erro_codigo`,`iniciado_em`,`terminado_em`,`volume`, TIMESTAMPDIFF(MICROSECOND, `iniciado_em`, `terminado_em`) / 1000000 AS d
                                     FROM {$this->t('obs_execucao')} WHERE `job` = ? AND `escopo` = ? ORDER BY `iniciado_em` DESC LIMIT " . max(1, min(1000, $limite)));
        $st->execute([$job, $escopo]);
        return array_map(fn($x) => ['job_name' => $escopo === '-' ? $job : "$job@$escopo",
            'status' => match ($x['estado']) { 'ok' => 'success', 'parcial' => 'partial', 'executando' => 'running', default => $x['erro_codigo'] === 'tempo' ? 'timeout' : 'error' },
            'execution_start' => $this->iso($x['iniciado_em']), 'execution_end' => $this->iso($x['terminado_em']),
            'execution_time_seconds' => $x['d'] !== null ? round((float) $x['d'], 3) : null, 'rows_affected' => $x['volume'] !== null ? (int) $x['volume'] : null,
            'error_code' => $x['erro_codigo']], $st->fetchAll(PDO::FETCH_ASSOC));
    }

    /** MIG-001 lote 7 · o status legado (sync_jobs_history.status) de uma execução do registro. */
    public static function statusLegado(string $estado, ?string $codigo): string
    {
        return match ($estado) { 'ok' => 'success', 'parcial' => 'partial', 'executando' => 'running', default => $codigo === 'tempo' ? 'timeout' : 'error' };
    }

    /**
     * MIG-001 lote 7 (api/modules/cards/card-01): o card "Taxa Diária" no formato legado. Contagens do DIA civil de Brasília (0 = nenhuma execução
     * hoje, contagem de verdade); taxa do dia = ok ÷ total; sem execução hoje, a média das taxas dos jobs (legado) ou null sem dado; tempo médio =
     * média dos avg_execution_time dos jobs ou null; history = últimas 24 h por hora de Brasília ('Y-m-d H:00:00'), hora sem execução não aparece.
     */
    public function card01Legado(DateTimeImmutable $agora, DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo')): array
    {
        $d = $this->contagensDoDia($agora, $fuso); $m = $this->metricasCards($agora, $fuso);
        $st = $this->pdo->prepare("SELECT `iniciado_em`, `estado` FROM {$this->t('obs_execucao')} WHERE `iniciado_em` >= ? ORDER BY `iniciado_em`");
        $st->execute([$this->u($agora->modify('-24 hours'))]); $h = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $k = (new DateTimeImmutable((string) $r['iniciado_em'], $this->utc))->setTimezone($fuso)->format('Y-m-d H:00:00');
            $h[$k] ??= ['hour' => $k, 'total' => 0, 'success' => 0]; $h[$k]['total']++; if ($r['estado'] === 'ok') $h[$k]['success']++;
        }
        $hist = array_values(array_map(fn($x) => ['hour' => $x['hour'], 'rate' => round($x['success'] / $x['total'] * 100, 1), 'total' => $x['total'], 'success' => $x['success']], $h));
        $taxa = $d['total'] > 0 ? round($d['concluidas'] / $d['total'] * 100, 1) : ($m['media_taxa'] !== null ? round($m['media_taxa'], 1) : null);
        return ['total_jobs' => $m['jobs'], 'active_jobs' => $m['jobs'], 'success_rate' => $taxa, 'successRate' => $taxa,
                'avg_execution_time' => $m['media_tempo'] !== null ? round($m['media_tempo'], 2) : null,
                'success' => $d['concluidas'], 'sucesso' => $d['concluidas'], 'error' => $d['falhas'], 'erro' => $d['falhas'], 'errors' => $d['falhas'],
                'total_executions_today' => $d['total'], 'history' => $hist];
    }

    /**
     * MIG-001 lote 7 (panels 15 e 17, "overview"): {overview, recent_activity, top_jobs, alerts_summary} no formato legado. O registro não tem
     * alertas (sync_job_alerts) → alerts_summary com tudo null (desconhecido, nunca 0). top_jobs: 10 por total_executions (empate = job_name);
     * recent_activity: as 20 execuções mais recentes de qualquer job.
     */
    public function painelVisaoGeralLegado(): array
    {
        $sj = $this->comoSyncJobs();
        $tx = array_values(array_filter(array_column($sj, 'success_rate'), fn($v) => $v !== null));
        $top = $sj; usort($top, fn($a, $b) => $b['total_executions'] <=> $a['total_executions'] ?: strcmp($a['job_name'], $b['job_name']));
        $st = $this->pdo->query("SELECT `job`, `escopo`, `estado`, `erro_codigo`, `iniciado_em`, TIMESTAMPDIFF(MICROSECOND, `iniciado_em`, `terminado_em`) / 1000000 AS d
                                   FROM {$this->t('obs_execucao')} ORDER BY `iniciado_em` DESC, `job`, `escopo`, `tentativa` DESC LIMIT 20");
        $rec = array_map(fn($x) => ['job_name' => $x['escopo'] === '-' ? $x['job'] : $x['job'] . '@' . $x['escopo'], 'status' => self::statusLegado($x['estado'], $x['erro_codigo']),
                                    'execution_start' => $this->iso($x['iniciado_em']), 'execution_time_seconds' => $x['d'] !== null ? round((float) $x['d'], 3) : null], $st->fetchAll(PDO::FETCH_ASSOC));
        return ['overview' => ['total_jobs' => count($sj), 'active_jobs' => count($sj), 'running_jobs' => count(array_filter($sj, fn($x) => $x['is_running'])),
                               'avg_success_rate' => $tx === [] ? null : round(array_sum($tx) / count($tx), 2)],
                'recent_activity' => $rec,
                'top_jobs' => array_map(fn($x) => ['job_name' => $x['job_name'], 'total_executions' => $x['total_executions'], 'success_rate' => $x['success_rate'],
                                                   'avg_execution_time' => $x['avg_execution_time']], array_slice($top, 0, 10)),
                'alerts_summary' => ['total' => null, 'critical' => null, 'warning' => null]];
    }

    /** MIG-001 lote 8 · execuções iniciadas desde $desde (UTC), já com job_name legado e os instantes em DateTimeImmutable. */
    private function execucoesDesde(DateTimeImmutable $desde, string $coluna = 'iniciado_em'): array
    {
        $col = $coluna === 'terminado_em' ? 'terminado_em' : 'iniciado_em';
        $st = $this->pdo->prepare("SELECT `job`, `escopo`, `estado`, `erro_codigo`, `iniciado_em`, `terminado_em`, `volume`, TIMESTAMPDIFF(MICROSECOND, `iniciado_em`, `terminado_em`) / 1000000 AS d
                                     FROM {$this->t('obs_execucao')} WHERE `$col` > ? ORDER BY `$col`");
        $st->execute([$this->u($desde)]);
        return array_map(fn($x) => ['job_name' => $x['escopo'] === '-' ? $x['job'] : $x['job'] . '@' . $x['escopo'], 'estado' => $x['estado'], 'codigo' => $x['erro_codigo'],
            'ini' => new DateTimeImmutable((string) $x['iniciado_em'], $this->utc), 'fim' => $x['terminado_em'] !== null ? new DateTimeImmutable((string) $x['terminado_em'], $this->utc) : null,
            'iniciado_em' => $x['iniciado_em'], 'terminado_em' => $x['terminado_em'], 'd' => $x['d'] !== null ? (float) $x['d'] : null, 'volume' => $x['volume'] !== null ? (int) $x['volume'] : null],
            $st->fetchAll(PDO::FETCH_ASSOC));
    }
    /** "error" do legado = falhou/interrompida que NÃO foi por tempo (o tempo é "timeout"). */
    private static function ehErro(array $r): bool { return in_array($r['estado'], ['falhou', 'interrompida'], true) && $r['codigo'] !== 'tempo'; }

    /**
     * MIG-001 lote 8 (panel-07, "running"): jobs em andamento (execução 'executando' com posse), concluídas nos últimos 5 min e estatística.
     * Média do job desconhecida = avg_execution_time null e status null (o legado comparava com 0 e dava "slow"); normal_jobs = total − slow.
     */
    public function emExecucaoLegado(DateTimeImmutable $agora): array
    {
        $media = array_column($this->comoSyncJobs(), 'avg_execution_time', 'job_name');
        $st = $this->pdo->query("SELECT e.`job`, e.`escopo`, e.`iniciado_em` FROM {$this->t('obs_execucao')} e JOIN {$this->t('obs_posse')} p ON p.`job` = e.`job` AND p.`escopo` = e.`escopo`
                                  WHERE e.`estado` = 'executando' ORDER BY e.`iniciado_em`");
        $run = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $x) {
            $nome = $x['escopo'] === '-' ? $x['job'] : $x['job'] . '@' . $x['escopo']; $avg = $media[$nome] ?? null;
            $seg = max(0, $agora->getTimestamp() - (new DateTimeImmutable((string) $x['iniciado_em'], $this->utc))->getTimestamp());
            $run[] = ['id' => null, 'job_name' => $nome, 'job_type' => null, 'started_at' => $this->iso($x['iniciado_em']), 'running_for_seconds' => $seg,
                      'avg_execution_time' => $avg !== null ? round($avg, 2) : null, 'status' => $avg === null ? null : ($seg > $avg * 2 ? 'slow' : 'normal')];
        }
        $fim = array_reverse($this->execucoesDesde($agora->modify('-5 minutes'), 'terminado_em'));
        $rec = array_map(fn($r) => ['job_name' => $r['job_name'], 'status' => self::statusLegado($r['estado'], $r['codigo']), 'started_at' => $this->iso($r['iniciado_em']),
            'finished_at' => $this->iso($r['terminado_em']), 'duration' => $r['d'] !== null ? round($r['d'], 2) : null, 'rows_affected' => $r['volume']], array_slice($fim, 0, 20));
        $slow = count(array_filter($run, fn($x) => $x['status'] === 'slow'));
        return ['running' => $run, 'recent_completed' => $rec, 'statistics' => ['total_running' => count($run), 'slow_jobs' => $slow, 'normal_jobs' => count($run) - $slow]];
    }

    /**
     * MIG-001 lote 8 (panels 13 e 18, SLA de $dias): disponibilidade, SLA por job (só jobs com mais de 10 execuções, como o legado), jobs críticos
     * (≥ 3 erros em 7 dias) e resumo. Sem execução no período: availability_percent e uptime_status null; taxa do job desconhecida: success_rate e
     * status null (fim da fila); recent_success_rate null sem execução recente (o legado dava 0).
     */
    public function slaLegado(DateTimeImmutable $agora, int $dias, DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo')): array
    {
        $rs = $this->execucoesDesde($agora->modify("-{$dias} days"));
        $tot = count($rs); $ok = count(array_filter($rs, fn($r) => $r['estado'] === 'ok')); $err = count(array_filter($rs, fn($r) => self::ehErro($r)));
        $pct = $tot > 0 ? round($ok / $tot * 100, 3) : null;
        $porJob = []; foreach ($rs as $r) { $porJob[$r['job_name']][] = $r; }
        $sla = [];
        foreach ($this->comoSyncJobs() as $j) {
            if ($j['total_executions'] <= 10) continue;
            $h = $porJob[$j['job_name']] ?? []; $n = count($h); $sOk = count(array_filter($h, fn($r) => $r['estado'] === 'ok')); $tx = $j['success_rate'];
            $sla[] = ['job_name' => $j['job_name'], 'job_type' => null, 'avg_execution_time' => $j['avg_execution_time'] !== null ? round($j['avg_execution_time'], 2) : null,
                      'success_rate' => $tx !== null ? round($tx, 2) : null, 'total_executions' => $j['total_executions'], 'recent_executions' => $n, 'recent_success' => $sOk,
                      'recent_errors' => count(array_filter($h, fn($r) => self::ehErro($r))), 'recent_success_rate' => $n > 0 ? round($sOk / $n * 100, 2) : null,
                      'status' => $tx === null ? null : ($tx >= 99.0 ? 'excellent' : ($tx >= 95.0 ? 'good' : ($tx >= 90.0 ? 'warning' : 'critical')))];
        }
        usort($sla, fn($a, $b) => [$a['success_rate'] === null, -($a['success_rate'] ?? 0), -$a['total_executions'], $a['job_name']] <=> [$b['success_rate'] === null, -($b['success_rate'] ?? 0), -$b['total_executions'], $b['job_name']]);
        $sla = array_slice($sla, 0, 30);
        $crit = [];
        foreach (array_filter($this->execucoesDesde($agora->modify('-7 days')), fn($r) => self::ehErro($r)) as $r) {
            $c = &$crit[$r['job_name']]; $c ??= ['job_name' => $r['job_name'], 'error_count' => 0, 'last_error' => null, 'first_error' => $this->iso($r['iniciado_em'])];
            $c['error_count']++; $c['last_error'] = $this->iso($r['iniciado_em']); unset($c);
        }
        $crit = array_values(array_filter($crit, fn($c) => $c['error_count'] >= 3));
        usort($crit, fn($a, $b) => [$b['error_count'], $b['last_error']] <=> [$a['error_count'], $a['last_error']]);
        $crit = array_slice($crit, 0, 10);
        $hoje = $agora->setTimezone($fuso);
        return ['period' => ['days' => $dias, 'from' => $hoje->modify("-{$dias} days")->format('Y-m-d'), 'to' => $hoje->format('Y-m-d')],
                'availability' => ['total_executions' => $tot, 'successful' => $ok, 'failed' => $err, 'availability_percent' => $pct,
                                   'uptime_status' => $pct === null ? null : ($pct >= 99.9 ? 'excellent' : ($pct >= 99.0 ? 'good' : 'poor'))],
                'jobs_sla' => $sla, 'critical_jobs' => $crit,
                'summary' => ['total_active_jobs' => count($sla), 'excellent_jobs' => count(array_filter($sla, fn($j) => $j['status'] === 'excellent')),
                              'good_jobs' => count(array_filter($sla, fn($j) => $j['status'] === 'good')), 'warning_jobs' => count(array_filter($sla, fn($j) => $j['status'] === 'warning')),
                              'critical_jobs' => count($crit)]];
    }

    /**
     * MIG-001 lote 8 (panel-19, taxa diária de $dias): por DIA de Brasília desde a meia-noite de hoje − $dias. Sem execução: médias null; tendência
     * null quando falta uma das semanas (o legado comparava com 0); melhor/pior dia só entre dias com ≥ 10 execuções (como o legado).
     */
    public function taxaDiariaLegado(DateTimeImmutable $agora, int $dias, DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo')): array
    {
        $rs = $this->execucoesDesde($agora->setTimezone($fuso)->setTime(0, 0)->modify("-{$dias} days")->modify('-1 microsecond'));
        $dia = [];
        foreach ($rs as $r) {
            $k = $r['ini']->setTimezone($fuso)->format('Y-m-d'); $dia[$k] ??= ['date' => $k, 'total' => 0, 'success' => 0, 'errors' => 0];
            $dia[$k]['total']++; if ($r['estado'] === 'ok') $dia[$k]['success']++; if (self::ehErro($r)) $dia[$k]['errors']++;
        }
        ksort($dia);
        $chart = array_values(array_map(fn($x) => $x + ['success_rate' => round($x['success'] / $x['total'] * 100, 2)], $dia));
        $tot = count($rs); $ok = count(array_filter($rs, fn($r) => $r['estado'] === 'ok')); $ds = array_values(array_filter(array_column($rs, 'd'), fn($v) => $v !== null));
        $best = $worst = null;
        foreach ($chart as $d) { if ($d['total'] >= 10) { if (!$best || $d['success_rate'] > $best['success_rate']) $best = $d; if (!$worst || $d['success_rate'] < $worst['success_rate']) $worst = $d; } }
        $med = fn(array $l) => $l === [] ? null : array_sum(array_column($l, 'success_rate')) / count($l);
        $rec = $med(array_slice($chart, -7)); $ant = count($chart) > 7 ? $med(array_slice($chart, -14, min(7, count($chart) - 7))) : null;
        $mud = $rec !== null && $ant !== null ? $rec - $ant : null;
        $hoje = $agora->setTimezone($fuso);
        return ['period' => ['days' => $dias, 'from' => $hoje->modify("-{$dias} days")->format('Y-m-d'), 'to' => $hoje->format('Y-m-d')],
                'chart_data' => $chart,
                'summary' => ['total_executions' => $tot, 'total_success' => $ok, 'total_errors' => count(array_filter($rs, fn($r) => self::ehErro($r))),
                              'avg_success_rate' => $tot > 0 ? round($ok / $tot * 100, 2) : null, 'avg_execution_time' => $ds === [] ? null : round(array_sum($ds) / count($ds), 2)],
                'highlights' => ['best_day' => $best, 'worst_day' => $worst],
                'trend' => ['recent_7d_avg' => $rec !== null ? round($rec, 2) : null, 'previous_7d_avg' => $ant !== null ? round($ant, 2) : null, 'change' => $mud !== null ? round($mud, 2) : null,
                            'status' => $mud === null ? null : ($mud > 1 ? 'improving' : ($mud < -1 ? 'declining' : 'stable'))]];
    }

    /**
     * MIG-001 lote 9 (panel-14, erros de $dias): "error" = falhou/interrompida que não foi por tempo. O registro guarda o CÓDIGO do erro, não a
     * mensagem livre (por desenho: nada de dado de negócio no registro) → top_errors agrupa pelo código e error_message = o código (como no slide-04).
     * Contagens são contagens de verdade (0 = nenhum erro no período).
     */
    public function errosLegado(DateTimeImmutable $agora, int $dias, DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo')): array
    {
        $er = array_values(array_filter($this->execucoesDesde($agora->modify("-{$dias} days")), fn($r) => self::ehErro($r)));
        $dia = fn($r) => $r['ini']->setTimezone($fuso)->format('Y-m-d');
        $top = [];
        foreach ($er as $r) { if ($r['codigo'] === null || $r['codigo'] === '') continue;
            $t = &$top[$r['codigo']]; $t ??= ['error_message' => $r['codigo'], 'occurrences' => 0, 'jobs' => [], 'last_occurrence' => null, 'first_occurrence' => $this->iso($r['iniciado_em'])];
            $t['occurrences']++; $t['jobs'][$r['job_name']] = true; $t['last_occurrence'] = $this->iso($r['iniciado_em']); unset($t); }
        $top = array_values($top); usort($top, fn($a, $b) => [$b['occurrences'], $a['error_message']] <=> [$a['occurrences'], $b['error_message']]);
        $top = array_map(function ($t) { $j = array_keys($t['jobs']); sort($j, SORT_STRING); $n = $t['occurrences'];
            return ['error_message' => $t['error_message'], 'occurrences' => $n, 'affected_jobs' => count($j), 'jobs_list' => array_slice($j, 0, 5),
                    'last_occurrence' => $t['last_occurrence'], 'first_occurrence' => $t['first_occurrence'],
                    'severity' => $n > 100 ? 'critical' : ($n > 50 ? 'high' : ($n > 10 ? 'medium' : 'low'))]; }, array_slice($top, 0, 20));
        $pj = []; $pd = [];
        foreach ($er as $r) {
            $j = &$pj[$r['job_name']]; $j ??= ['job_name' => $r['job_name'], 'error_count' => 0, 'last_error' => null, 'dias' => []];
            $j['error_count']++; $j['last_error'] = $this->iso($r['iniciado_em']); $j['dias'][$dia($r)] = true; unset($j);
            $d = &$pd[$dia($r)]; $d ??= ['date' => $dia($r), 'error_count' => 0, 'jobs' => []]; $d['error_count']++; $d['jobs'][$r['job_name']] = true; unset($d);
        }
        $pj = array_values($pj); usort($pj, fn($a, $b) => [$b['error_count'], $a['job_name']] <=> [$a['error_count'], $b['job_name']]);
        $pj = array_map(fn($j) => ['job_name' => $j['job_name'], 'error_count' => $j['error_count'], 'last_error' => $j['last_error'], 'days_with_errors' => count($j['dias']),
                                   'avg_errors_per_day' => round($j['error_count'] / $dias, 2)], array_slice($pj, 0, 15));
        krsort($pd);
        $pd = array_values(array_map(fn($d) => ['date' => $d['date'], 'error_count' => $d['error_count'], 'affected_jobs' => count($d['jobs'])], $pd));
        $hoje = $agora->setTimezone($fuso);
        return ['period' => ['days' => $dias, 'from' => $hoje->modify("-{$dias} days")->format('Y-m-d'), 'to' => $hoje->format('Y-m-d')],
                'statistics' => ['total_errors' => count($er), 'jobs_with_errors' => count(array_unique(array_column($er, 'job_name'))), 'days_with_errors' => count($pd),
                                 'avg_errors_per_day' => round(count($er) / $dias, 2)],
                'top_errors' => $top, 'jobs_with_most_errors' => $pj, 'errors_by_day' => $pd];
    }

    /**
     * MIG-001 lote 9 (panel-02, jobs com SLA): o mesmo {overview, status_counts, jobs, meta} do legado. Dado desconhecido NÃO vira 0: cada parte
     * do SLA com valor null tem status null; health_status = critical/warning se alguma parte for, healthy se as conhecidas estão ok, null se
     * nenhuma é conhecida (o legado trocava null por 0 e marcava "critical"). Ordem do legado: error_count > 5 primeiro, depois taxa < 95,
     * depois última execução mais recente. Média da taxa só entre os jobs com taxa (null sem nenhum).
     */
    public function painel02Legado(DateTimeImmutable $agora, array $sla): array
    {
        $jobs = [];
        foreach ($this->comoSyncJobs() as $j) {
            $tx = $j['success_rate']; $ms = $j['avg_execution_time'] !== null ? $j['avg_execution_time'] * 1000 : null; $er = $j['error_count'];
            $p = ['success_rate' => ['value' => $tx, 'threshold' => $sla['threshold_success_rate'], 'status' => $tx === null ? null : ($tx >= $sla['threshold_success_rate'] ? 'ok' : ($tx >= 80 ? 'warning' : 'critical'))],
                  'duration' => ['value' => $ms, 'threshold' => $sla['threshold_duration_ms'], 'status' => $ms === null ? null : ($ms <= $sla['threshold_duration_ms'] ? 'ok' : ($ms <= $sla['threshold_duration_ms'] * 1.5 ? 'warning' : 'critical'))],
                  'errors' => ['value' => $er, 'threshold' => $sla['threshold_error_count'], 'status' => $er === null ? null : ($er <= 0 ? 'ok' : ($er <= $sla['threshold_error_count'] ? 'warning' : 'critical'))]];
            $st = array_column($p, 'status');
            $saude = in_array('critical', $st, true) ? 'critical' : (in_array('warning', $st, true) ? 'warning' : (in_array('ok', $st, true) ? 'healthy' : null));
            $jobs[] = ['id' => null, 'job_name' => $j['job_name'], 'job_type' => null, 'is_active' => 1, 'is_running' => $j['is_running'] ? 1 : 0, 'last_execution' => $j['last_execution'],
                       'last_success' => $j['last_success'], 'total_executions' => $j['total_executions'], 'success_rate' => $tx, 'error_count' => $er, 'avg_execution_time' => $j['avg_execution_time'],
                       'created_at' => null, 'updated_at' => null, 'sla' => $p, 'health_status' => $saude];
        }
        usort($jobs, fn($a, $b) => [($a['error_count'] ?? 0) > 5 ? 0 : 1, $a['success_rate'] !== null && $a['success_rate'] < 95 ? 0 : 1, $b['last_execution'] ?? '', $a['job_name']]
                                 <=> [($b['error_count'] ?? 0) > 5 ? 0 : 1, $b['success_rate'] !== null && $b['success_rate'] < 95 ? 0 : 1, $a['last_execution'] ?? '', $b['job_name']]);
        $c = fn(string $s) => count(array_filter($jobs, fn($x) => $x['health_status'] === $s));
        $tx = array_values(array_filter(array_column($jobs, 'success_rate'), fn($v) => $v !== null));
        return ['overview' => ['total_jobs' => count($jobs), 'active_jobs' => count($jobs), 'inactive_jobs' => 0, 'running_jobs' => count(array_filter($jobs, fn($x) => $x['is_running'] === 1)),
                               'health' => ['healthy' => $c('healthy'), 'warning' => $c('warning'), 'critical' => $c('critical')],
                               'metrics' => ['total_executions' => array_sum(array_column($jobs, 'total_executions')), 'total_errors' => array_sum(array_map(fn($x) => $x['error_count'] ?? 0, $jobs)),
                                             'avg_success_rate' => $tx === [] ? null : round(array_sum($tx) / count($tx), 2)]],
                'status_counts' => ['ok' => $c('healthy'), 'warning' => $c('warning'), 'error' => $c('critical')],
                'jobs' => $jobs, 'meta' => ['total' => count($jobs), 'updated_at' => $agora->format('c'), 'sla_defaults' => $sla]];
    }

    /**
     * MIG-001 lote 10 (panel-03, últimas $horas por hora): por HORA de Brasília ('Y-m-d H:00:00'), mais recente primeiro, no formato legado.
     * avg/min/max só das execuções terminadas (null na hora sem nenhuma terminada; o legado arredondava NULL para 0); taxa geral null sem execução.
     */
    public function horasLegado(DateTimeImmutable $agora, int $horas, DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo')): array
    {
        $rs = $this->execucoesDesde($agora->modify("-{$horas} hours")); $h = [];
        foreach ($rs as $r) {
            $k = $r['ini']->setTimezone($fuso)->format('Y-m-d H:00:00');
            $h[$k] ??= ['hour' => $k, 'total' => 0, 'success' => 0, 'errors' => 0, 'running' => 0, 'd' => []];
            $h[$k]['total']++; if ($r['estado'] === 'ok') $h[$k]['success']++; if (self::ehErro($r)) $h[$k]['errors']++; if ($r['estado'] === 'executando') $h[$k]['running']++;
            if ($r['d'] !== null) $h[$k]['d'][] = $r['d'];
        }
        krsort($h);
        $hourly = array_values(array_map(fn($x) => ['hour' => $x['hour'], 'total' => $x['total'], 'success' => $x['success'], 'errors' => $x['errors'], 'running' => $x['running'],
            'success_rate' => round($x['success'] / $x['total'] * 100, 2), 'avg_time' => $x['d'] === [] ? null : round(array_sum($x['d']) / count($x['d']), 2),
            'min_time' => $x['d'] === [] ? null : round(min($x['d']), 2), 'max_time' => $x['d'] === [] ? null : round(max($x['d']), 2)], $h));
        $tot = count($rs); $ok = count(array_filter($rs, fn($r) => $r['estado'] === 'ok'));
        return ['hourly' => $hourly, 'period' => ['hours' => $horas, 'total_executions' => $tot, 'total_success' => $ok, 'total_errors' => count(array_filter($rs, fn($r) => self::ehErro($r))),
                'overall_success_rate' => $tot > 0 ? round($ok / $tot * 100, 2) : null]];
    }

    /** MIG-001 lote 11 · o período no formato do DATE_FORMAT do legado, no fuso de Brasília ('%Y-%U' = semana com domingo como 1º dia, 00–53). */
    private static function periodoLegado(DateTimeImmutable $t, string $grupo): string
    {
        return match ($grupo) {
            'hour' => $t->format('Y-m-d H:00'), 'week' => $t->format('Y') . '-' . str_pad((string) intdiv((int) $t->format('z') + 7 - (int) $t->format('w'), 7), 2, '0', STR_PAD_LEFT),
            'month' => $t->format('Y-m'), default => $t->format('Y-m-d'),
        };
    }

    /**
     * MIG-001 lote 11 (api/dashboard/filtered_data.php): {data, filters, total} do legado, por período de Brasília. Janela igual à do legado:
     * de $de 00:00 até $ate 00:00 (o legado compara DATETIME com a data pura). Médias e tempos sem base = null (nunca 0); contagens de verdade.
     *  jobs: os jobs cuja ÚLTIMA execução cai na janela · executions · errors (só períodos com erro) · performance: só as ok, 20 mais lentos.
     */
    public function filtradoLegado(string $entidade, string $grupo, string $de, string $ate, DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo')): array
    {
        $ini = new DateTimeImmutable($de . ' 00:00:00', $fuso); $fim = new DateTimeImmutable($ate . ' 00:00:00', $fuso);
        $dentro = fn(DateTimeImmutable $t) => $t >= $ini && $t <= $fim; $br = fn(DateTimeImmutable $t) => $t->setTimezone($fuso);
        $media = fn(array $v) => $v === [] ? null : round(array_sum($v) / count($v), 4);
        $out = [];
        if ($entidade === 'jobs') {
            foreach ($this->comoSyncJobs() as $j) {
                if ($j['last_execution'] === null) continue; $t = $br(new DateTimeImmutable($j['last_execution'])); if (!$dentro($t)) continue;
                $k = self::periodoLegado($t, $grupo); $out[$k] ??= ['period' => $k, 'total_jobs' => 0, 'active_jobs' => 0, 'tx' => []];
                $out[$k]['total_jobs']++; $out[$k]['active_jobs']++; if ($j['success_rate'] !== null) $out[$k]['tx'][] = $j['success_rate'];
            }
            ksort($out); return array_values(array_map(fn($x) => ['period' => $x['period'], 'total_jobs' => $x['total_jobs'], 'active_jobs' => $x['active_jobs'], 'avg_success_rate' => $media($x['tx'])], $out));
        }
        $rs = array_values(array_filter($this->execucoesDesde($ini->modify('-1 microsecond')), fn($r) => $dentro($br($r['ini']))));
        if ($entidade === 'performance') {
            foreach ($rs as $r) { if ($r['estado'] !== 'ok' || $r['d'] === null) continue; $out[$r['job_name']][] = $r['d']; }
            $l = []; foreach ($out as $n => $d) $l[] = ['job_name' => $n, 'avg_time' => round(array_sum($d) / count($d), 4), 'min_time' => round(min($d), 3), 'max_time' => round(max($d), 3), 'executions' => count($d)];
            usort($l, fn($a, $b) => [$b['avg_time'], $a['job_name']] <=> [$a['avg_time'], $b['job_name']]); return array_slice($l, 0, 20);
        }
        foreach ($rs as $r) {
            if ($entidade === 'errors' && !self::ehErro($r)) continue;
            $k = self::periodoLegado($br($r['ini']), $grupo);
            if ($entidade === 'errors') { $out[$k] ??= ['period' => $k, 'error_count' => 0]; $out[$k]['error_count']++; continue; }
            $out[$k] ??= ['period' => $k, 'total_executions' => 0, 'successful' => 0, 'failed' => 0, 'd' => []];
            $out[$k]['total_executions']++; if ($r['estado'] === 'ok') $out[$k]['successful']++; if (self::ehErro($r)) $out[$k]['failed']++; if ($r['d'] !== null) $out[$k]['d'][] = $r['d'];
        }
        ksort($out);
        return array_values($entidade === 'errors' ? $out : array_map(fn($x) => ['period' => $x['period'], 'total_executions' => $x['total_executions'], 'successful' => $x['successful'],
            'failed' => $x['failed'], 'avg_time' => $media($x['d'])], $out));
    }

    /**
     * MIG-001 lote 11 (api/dashboard/historical_data.php): {history, statistics, filters, total}. Janela $de 00:00:00 → $ate 23:59:59 (Brasília);
     * filtro de job por "contém" (sem diferenciar maiúsculas, como o LIKE do legado) e de status pelo status legado; estatística sem o filtro de status
     * (como o legado). id, run_id e exit_code não existem no registro (null); error_message = o CÓDIGO do erro.
     */
    public function historicoLegado(string $job, string $status, string $de, string $ate, int $limite, DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo')): array
    {
        $ini = new DateTimeImmutable($de . ' 00:00:00', $fuso); $fim = new DateTimeImmutable($ate . ' 23:59:59', $fuso);
        $rs = array_values(array_filter($this->execucoesDesde($ini->modify('-1 microsecond')), fn($r) => $r['ini'] <= $fim && ($job === '' || mb_stripos($r['job_name'], $job) !== false)));
        $st = array_values(array_filter($rs, fn($r) => $status === '' || self::statusLegado($r['estado'], $r['codigo']) === $status));
        usort($st, fn($a, $b) => $b['ini'] <=> $a['ini'] ?: strcmp($a['job_name'], $b['job_name']));
        $h = array_map(fn($r) => ['id' => null, 'job_name' => $r['job_name'], 'status' => self::statusLegado($r['estado'], $r['codigo']), 'execution_start' => $this->iso($r['iniciado_em']),
            'execution_end' => $this->iso($r['terminado_em']), 'execution_time_seconds' => $r['d'] !== null ? round($r['d'], 3) : null, 'rows_affected' => $r['volume'],
            'error_message' => $r['codigo'], 'run_id' => null, 'exit_code' => null], array_slice($st, 0, max(1, min(5000, $limite))));
        $d = array_values(array_filter(array_column($rs, 'd'), fn($v) => $v !== null));
        return ['history' => $h, 'statistics' => ['total_executions' => count($rs), 'successful' => count(array_filter($rs, fn($r) => $r['estado'] === 'ok')),
                'failed' => count(array_filter($rs, fn($r) => self::ehErro($r))), 'avg_time' => $d === [] ? null : round(array_sum($d) / count($d), 4),
                'max_time' => $d === [] ? null : round(max($d), 3), 'min_time' => $d === [] ? null : round(min($d), 3)],
                'filters' => ['job_name' => $job, 'status' => $status, 'date_from' => $de, 'date_to' => $ate, 'limit' => $limite], 'total' => count($h)];
    }

    /**
     * MIG-001 lote 11 (api/dashboard/dashboard_metrics_final.php): jobs, execuções 24 h / 1 h, alertas e servidor. O registro não tem alertas nem
     * a coleta do servidor (server_status_history é outra fonte) → alerts com tudo null e server = null (desconhecido, nunca 0 nem [] "vazio").
     */
    public function metricasFinaisLegado(DateTimeImmutable $agora): array
    {
        $sj = $this->comoSyncJobs(); $tx = array_values(array_filter(array_column($sj, 'success_rate'), fn($v) => $v !== null));
        $j24 = $this->janelaHoras($agora, 24); $j1 = $this->janelaHoras($agora, 1);
        return ['jobs' => ['total' => count($sj), 'active' => count($sj), 'running' => count(array_filter($sj, fn($x) => $x['is_running'])),
                           'with_errors' => count(array_filter($sj, fn($x) => ($x['error_count'] ?? 0) > 0)), 'avg_success_rate' => $tx === [] ? null : round(array_sum($tx) / count($tx), 4)],
                'executions' => ['last_24h' => ['total' => $j24['total'], 'success' => $j24['success'], 'error' => $j24['errors'], 'avg_time' => $j24['avg_time']],
                                 'last_hour' => ['total' => $j1['total'], 'success' => $j1['success'], 'error' => $j1['errors']]],
                'alerts' => ['total' => null, 'critical' => null, 'warning' => null, 'info' => null], 'server' => null];
    }

    /** MIG-001 lote 12 (panel-15/{total,active,running}-jobs e success-rate): {metric, value, label} do legado; taxa sem base = null (o legado arredondava NULL para 0). */
    public function painel15MetricaLegado(string $metrica): array
    {
        $sj = $this->comoSyncJobs(); $tx = array_values(array_filter(array_column($sj, 'success_rate'), fn($v) => $v !== null));
        return match ($metrica) {
            'total_jobs' => ['metric' => 'total_jobs', 'value' => count($sj), 'label' => 'Total'],
            'active_jobs' => ['metric' => 'active_jobs', 'value' => count($sj), 'label' => 'Ativos'],
            'running_jobs' => ['metric' => 'running_jobs', 'value' => count(array_filter($sj, fn($x) => $x['is_running'])), 'label' => 'Rodando'],
            'success_rate' => ['metric' => 'success_rate', 'value' => $tx === [] ? null : round(array_sum($tx) / count($tx), 1), 'label' => 'Taxa Sucesso'],
            default => throw new InvalidArgumentException('metrica'),
        };
    }
}
