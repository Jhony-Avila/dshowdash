<?php
// Google Calendar / GcalProviderBase - derivacoes compartilhadas
// @module google-calendar.provider-base
// @version 1.0.0
// @created 2026-07-30
// @app Google Calendar
//
// Conflitos, disponibilidade, convites, alertas, KPIs e relatorios sao
// CALCULADOS a partir dos eventos — nao importa se eles vieram do mock ou do
// banco. Esta base concentra esse calculo para que os dois provedores respondam
// exatamente igual: se a regra de conflito mudar, muda nos dois de uma vez.
//
// As subclasses fornecem apenas as FONTES (eventos, calendarios, contas, sync);
// tudo o que se deriva delas mora aqui.
declare(strict_types=1);

abstract class GcalProviderBase implements GcalProvider
{
    protected const TZ = 'America/Sao_Paulo';

    /** Mapa id => calendario, para resolver papel de acesso e cor rapido. */
    protected function mapaCalendarios(): array
    {
        $m = [];
        foreach ($this->calendarios() as $c) { $m[$c['id']] = $c; }
        return $m;
    }

    /**
     * Aplica a regra de privacidade do §75.1: em calendario com acesso apenas
     * de livre/ocupado, ou em evento privado de terceiro, o bloco continua
     * existindo (senao a disponibilidade mente) mas o conteudo some.
     */
    protected function aplicarPrivacidade(array $e, array $cal): array
    {
        $soLivreOcupado = ($cal['access_role'] ?? 'reader') === 'freeBusyReader';
        if (!$soLivreOcupado) return $e;

        $e['summary']     = 'Ocupado';
        $e['description'] = null;
        $e['location']    = null;
        $e['attendees']   = [];
        $e['conference']  = null;
        $e['links']       = [];
        $e['redacted']    = true;
        return $e;
    }

    /** Instantes de inicio/fim como DateTimeImmutable, tratando dia inteiro (§48). */
    protected function instantes(array $e, string $tz): array
    {
        if (!empty($e['all_day'])) {
            // Dia inteiro nao tem hora: e intervalo de DATAS. Converter isso
            // como se fosse 00:00 de um fuso e o erro classico que joga o
            // evento para o dia anterior.
            $z = new \DateTimeZone($tz);
            return [new \DateTimeImmutable($e['start'] . ' 00:00:00', $z),
                    new \DateTimeImmutable($e['end'] . ' 00:00:00', $z)];
        }
        return [new \DateTimeImmutable($e['start']), new \DateTimeImmutable($e['end'])];
    }

    public function freeBusy(array $f): array
    {
        $tz  = Tz::normalizar($f['tz'] ?? static::TZ);
        $dur = max(15, (int)($f['duracao_min'] ?? 60));
        $pessoas = $f['pessoas'] ?? ['jhony@dshow.com.br'];
        $expIni = (int)($f['expediente_inicio'] ?? 9);
        $expFim = (int)($f['expediente_fim'] ?? 18);
        $almoco = $f['evitar_almoco'] ?? true;

        $eventos = $this->eventos(['de' => $f['de'], 'ate' => $f['ate'], 'tz' => $tz]);

        // Matriz pessoa × slot de 30 min (§22.2).
        $z = new \DateTimeZone($tz);
        $ini = new \DateTimeImmutable($f['de'] . ' 00:00:00', $z);
        $fim = (new \DateTimeImmutable($f['ate'] . ' 00:00:00', $z))->modify('+1 day');

        $ocupadoPor = [];
        foreach ($pessoas as $p) { $ocupadoPor[$p] = []; }

        foreach ($eventos as $e) {
            if (($e['transparency'] ?? 'opaque') === 'transparent') continue;
            if (($e['status'] ?? '') === 'cancelled') continue;
            [$ei, $ef] = $this->instantes($e, $tz);
            $emails = array_column($e['attendees'] ?? [], 'email');
            if (!$emails) { $emails = ['jhony@dshow.com.br']; }
            foreach ($pessoas as $p) {
                if (in_array($p, $emails, true)) {
                    $ocupadoPor[$p][] = [$ei->getTimestamp(), $ef->getTimestamp(),
                                         $e['event_type'] ?? 'default'];
                }
            }
        }

        $matriz = [];
        $livresComuns = [];
        for ($t = $ini; $t < $fim; $t = $t->modify('+30 minutes')) {
            $h = (int)$t->format('G');
            $dow = (int)$t->format('N');
            $ts = $t->getTimestamp();
            $foraExpediente = $dow >= 6 || $h < $expIni || $h >= $expFim;
            $ehAlmoco = $almoco && $h === 12;

            $linha = ['slot' => $t->format('c'), 'estados' => []];
            $todosLivres = !$foraExpediente && !$ehAlmoco;
            foreach ($pessoas as $p) {
                $estado = 'free';
                if ($foraExpediente)      $estado = 'off_hours';
                elseif ($ehAlmoco)        $estado = 'lunch';
                foreach ($ocupadoPor[$p] as [$a, $b, $tipo]) {
                    if ($ts < $b && $ts + 1800 > $a) {
                        $estado = $tipo === 'focusTime' ? 'focus'
                                : ($tipo === 'outOfOffice' ? 'ooo' : 'busy');
                        break;
                    }
                }
                if ($estado !== 'free') $todosLivres = false;
                $linha['estados'][$p] = $estado;
            }
            $matriz[] = $linha;
            if ($todosLivres) { $livresComuns[] = $t; }
        }

        // Sugestoes: primeiras janelas contiguas que cabem a duracao pedida.
        $sugestoes = [];
        $precisa = intdiv($dur, 30) + ($dur % 30 > 0 ? 1 : 0);
        $seq = 0; $inicioSeq = null;
        foreach ($livresComuns as $k => $slot) {
            $anterior = $k > 0 ? $livresComuns[$k - 1] : null;
            $contiguo = $anterior && ($slot->getTimestamp() - $anterior->getTimestamp() === 1800);
            if (!$contiguo) { $seq = 0; $inicioSeq = $slot; }
            $seq++;
            if ($seq >= $precisa && $inicioSeq !== null && count($sugestoes) < 5) {
                $sugestoes[] = [
                    'inicio' => $inicioSeq->format('c'),
                    'fim'    => $inicioSeq->modify("+{$dur} minutes")->format('c'),
                    'todos_livres' => true,
                ];
                $seq = 0; $inicioSeq = null;
            }
        }

        return [
            'pessoas'   => $pessoas,
            'duracao_min' => $dur,
            'time_zone' => $tz,
            'matriz'    => $matriz,
            'sugestoes' => $sugestoes,
        ];
    }

    /**
     * Detecta conflitos numa lista ja filtrada.
     *
     * Regras (§23): sobreposicao real, deslocamento insuficiente entre eventos
     * presenciais em locais diferentes, e reuniao caindo dentro de bloco de foco
     * ou de ausencia. Eventos `transparent` (ex.: almoco, home office) NAO
     * geram conflito — marcam disponibilidade, nao ocupacao.
     *
     * CALENDARIO DE RECURSO FICA FORA DA AGENDA PESSOAL. Reservar a sala PARA a
     * reuniao criaria dois blocos no mesmo horario e a central acusaria conflito
     * onde nao ha — e central de conflitos que grita a toa e central que o
     * usuario aprende a ignorar. Recurso conflita so consigo mesmo: duas
     * reservas da MESMA sala no mesmo horario (§29.1), tratado a parte.
     */
    /**
     * Central de conflitos (§23) — derivada por inteiro dos eventos da janela.
     *
     * Nao le fonte nenhuma: pede os eventos a `eventos()` e aplica a regra. Por
     * isso mora aqui e nao no mock — mock e banco tem de acusar EXATAMENTE os
     * mesmos conflitos, senao a tela muda de resposta ao trocar de provedor.
     */
    public function conflitos(array $f): array
    {
        $tz = Tz::normalizar($f['tz'] ?? static::TZ);
        $lista = $this->detectarConflitos(
            $this->eventos(['de' => $f['de'], 'ate' => $f['ate'], 'tz' => $tz]), $tz);

        if (!empty($f['severidade'])) {
            $lista = array_values(array_filter($lista,
                static fn($c) => $c['severidade'] === $f['severidade']));
        }
        return $lista;
    }

    protected function detectarConflitos(array $eventos, string $tz): array
    {
        $mapa = $this->mapaCalendarios();
        $itens = [];
        $recursos = [];
        foreach ($eventos as $e) {
            if (($e['status'] ?? '') === 'cancelled') continue;
            if (($e['transparency'] ?? 'opaque') === 'transparent') continue;
            if (!empty($e['all_day']) && ($e['event_type'] ?? '') !== 'outOfOffice') continue;
            [$i, $f] = $this->instantes($e, $tz);
            $reg = ['e' => $e, 'i' => $i->getTimestamp(), 'f' => $f->getTimestamp()];
            if (($mapa[$e['calendar_id']]['kind'] ?? '') === 'resource') {
                $recursos[$e['calendar_id']][] = $reg;
            } else {
                $itens[] = $reg;
            }
        }
        usort($itens, fn($a, $b) => $a['i'] <=> $b['i']);

        $out = [];

        // Conflito de RECURSO: mesma sala reservada duas vezes no mesmo horario.
        foreach ($recursos as $calId => $lista) {
            usort($lista, fn($a, $b) => $a['i'] <=> $b['i']);
            for ($k = 0; $k < count($lista) - 1; $k++) {
                if ($lista[$k + 1]['i'] < $lista[$k]['f']) {
                    $out[] = self::conflito('recurso', 'alta',
                        'Recurso "' . ($mapa[$calId]['summary'] ?? $calId) . '" reservado em duplicidade.',
                        [$lista[$k]['e'], $lista[$k + 1]['e']]);
                }
            }
        }
        for ($k = 0; $k < count($itens); $k++) {
            for ($j = $k + 1; $j < count($itens); $j++) {
                if ($itens[$j]['i'] >= $itens[$k]['f']) {
                    // Gap curto entre presenciais em locais diferentes.
                    $gap = intdiv($itens[$j]['i'] - $itens[$k]['f'], 60);
                    $lA = $itens[$k]['e']['location'] ?? null;
                    $lB = $itens[$j]['e']['location'] ?? null;
                    if ($gap >= 0 && $gap < 15 && $lA && $lB && $lA !== $lB
                        && $lA !== 'Google Meet' && $lB !== 'Google Meet') {
                        $out[] = self::conflito('deslocamento', 'media',
                            'Apenas ' . $gap . ' min entre compromissos em locais diferentes.',
                            [$itens[$k]['e'], $itens[$j]['e']]);
                    }
                    break;   // ordenado: nada depois disso sobrepoe k
                }
                $a = $itens[$k]['e']; $b = $itens[$j]['e'];
                $tipoA = $a['event_type'] ?? 'default';
                $tipoB = $b['event_type'] ?? 'default';

                if ($tipoA === 'outOfOffice' || $tipoB === 'outOfOffice') {
                    $out[] = self::conflito('ausencia', 'alta',
                        'Compromisso marcado durante período de ausência.', [$a, $b]);
                } elseif ($tipoA === 'focusTime' || $tipoB === 'focusTime') {
                    $out[] = self::conflito('foco', 'baixa',
                        'Compromisso invade um bloco de foco.', [$a, $b]);
                } else {
                    $out[] = self::conflito('sobreposicao', 'alta',
                        'Dois compromissos ocupam o mesmo horário.', [$a, $b]);
                }
            }
        }
        return $out;
    }

    protected static function conflito(string $tipo, string $sev, string $msg, array $eventos): array
    {
        $ids = array_column($eventos, 'id');
        sort($ids);
        return [
            'id' => 'cf_' . substr(md5($tipo . implode('|', $ids)), 0, 12),
            'tipo' => $tipo, 'severidade' => $sev, 'mensagem' => $msg,
            'event_ids' => $ids,
            'eventos' => array_map(fn($e) => [
                'id' => $e['id'], 'calendar_id' => $e['calendar_id'],
                'summary' => $e['summary'], 'start' => $e['start'], 'end' => $e['end'],
                'location' => $e['location'] ?? null,
                'attendees_count' => count($e['attendees'] ?? []),
            ], $eventos),
        ];
    }

    public function convites(array $f): array
    {
        $tz = Tz::normalizar($f['tz'] ?? static::TZ);
        $eventos = $this->eventos([
            'de' => $f['de'], 'ate' => $f['ate'], 'tz' => $tz,
            'incluir_cancelados' => true,
        ]);
        $cat = $f['categoria'] ?? null;
        $mapaCat = ['needsAction' => 'aguardando', 'accepted' => 'aceitos',
                    'declined' => 'recusados', 'tentative' => 'talvez'];

        $out = [];
        foreach ($eventos as $e) {
            if (!empty($e['is_organizer'])) continue;      // convite = de terceiro
            if (empty($e['attendees'])) continue;
            $c = ($e['status'] ?? '') === 'cancelled'
                ? 'cancelados'
                : ($mapaCat[$e['my_response'] ?? 'needsAction'] ?? 'aguardando');
            if ($cat !== null && $c !== $cat) continue;
            $e['categoria'] = $c;
            $out[] = $e;
        }
        return $out;
    }

    public function alertas(array $f): array
    {
        $tz = Tz::normalizar($f['tz'] ?? static::TZ);
        $hojeL = (new \DateTimeImmutable('now', new \DateTimeZone($tz)));
        $hoje = $hojeL->format('Y-m-d');
        $ate  = $hojeL->modify('+14 days')->format('Y-m-d');
        $eventos = $this->eventos(['de' => $hoje, 'ate' => $ate, 'tz' => $tz]);
        $out = [];

        $add = function (string $cat, string $sev, string $titulo, string $msg, ?array $ref = null) use (&$out): void {
            $out[] = ['id' => 'al_' . substr(md5($cat . $titulo . ($ref['id'] ?? '')), 0, 12),
                      'categoria' => $cat, 'severidade' => $sev,
                      'titulo' => $titulo, 'mensagem' => $msg, 'ref' => $ref];
        };

        // §62.1 — agenda
        $pendentes = array_filter($eventos, fn($e) => ($e['my_response'] ?? '') === 'needsAction');
        if ($pendentes) {
            $add('agenda', 'media', count($pendentes) . ' convite(s) aguardando resposta',
                 'Há convites sem resposta nos próximos 14 dias.');
        }
        foreach ($this->detectarConflitos($eventos, $tz) as $c) {
            if ($c['severidade'] === 'alta') {
                $add('agenda', 'alta', 'Conflito de agenda', $c['mensagem'],
                     ['id' => $c['id'], 'tipo' => 'conflito']);
            }
        }
        // §62.2 — organizacao
        foreach ($eventos as $e) {
            if (!empty($e['all_day'])) continue;
            $h = (int)(new \DateTimeImmutable($e['start']))->setTimezone(new \DateTimeZone($tz))->format('G');
            if ($h < 8 || $h >= 19) {
                $add('organizacao', 'baixa', 'Compromisso fora do expediente',
                     ($e['summary'] ?? '') . ' às ' . $h . 'h.',
                     ['id' => $e['id'], 'calendar_id' => $e['calendar_id'], 'tipo' => 'evento']);
            }
        }
        // §62.3 — tecnico
        foreach ($this->contas() as $c) {
            if ($c['connection_status'] !== 'connected') {
                $add('tecnico', 'alta', 'Conta precisa reconectar',
                     $c['email'] . ' — ' . ($c['last_error_message'] ?? 'acesso expirado.'),
                     ['id' => (string)$c['id'], 'tipo' => 'conta']);
            }
        }
        foreach ($this->sincronizacao() as $s) {
            if ($s['status'] !== 'ok') {
                $add('tecnico', 'media', 'Sincronização atrasada',
                     $s['calendar_id'] . ' — última sincronização há mais de 3 horas.',
                     ['id' => $s['calendar_id'], 'tipo' => 'sync']);
            }
        }

        if (!empty($f['categoria'])) {
            $out = array_values(array_filter($out, fn($a) => $a['categoria'] === $f['categoria']));
        }
        return $out;
    }

    public function overview(array $f): array
    {
        $tz = Tz::normalizar($f['tz'] ?? static::TZ);
        $agoraL = new \DateTimeImmutable('now', new \DateTimeZone($tz));
        $hoje = $agoraL->format('Y-m-d');

        // Cancelados entram aqui de proposito: o KPI "eventos cancelados" do
        // §15.1 existe justamente para mostra-los. Eles sao contados a parte e
        // ficam fora de ocupacao, conflito e "proxima reuniao".
        $doDia = $this->eventos(['de' => $hoje, 'ate' => $hoje, 'tz' => $tz,
                                 'incluir_cancelados' => true]);
        $ocupadoMin = 0; $reunioes = 0; $externos = 0; $pendentes = 0; $cancelados = 0;
        $compromissos = 0; $proxima = null;

        foreach ($doDia as $e) {
            if (($e['status'] ?? '') === 'cancelled') { $cancelados++; continue; }
            $compromissos++;
            if (($e['transparency'] ?? 'opaque') === 'opaque' && empty($e['all_day'])) {
                $ocupadoMin += (int)($e['duration_min'] ?? 0);
            }
            if (!empty($e['attendees'])) {
                $reunioes++;
                foreach ($e['attendees'] as $a) { if (!empty($a['external'])) { $externos++; break; } }
            }
            if (($e['my_response'] ?? '') === 'needsAction') { $pendentes++; }
            if (empty($e['all_day']) && $proxima === null) {
                $ini = new \DateTimeImmutable($e['start']);
                if ($ini > $agoraL) { $proxima = $e; }
            }
        }

        $conflitosHoje = $this->detectarConflitos($doDia, $tz);
        $expedienteMin = 9 * 60;

        // Serie das ultimas 4 semanas: carga de reuniao por dia (§38).
        $serie = [];
        for ($d = 27; $d >= 0; $d--) {
            $dia = $agoraL->modify("-{$d} days")->format('Y-m-d');
            $lista = $this->eventos(['de' => $dia, 'ate' => $dia, 'tz' => $tz]);
            $min = 0; $n = 0;
            foreach ($lista as $e) {
                if (($e['status'] ?? '') === 'cancelled' || !empty($e['all_day'])) continue;
                if (($e['transparency'] ?? 'opaque') !== 'opaque') continue;
                if (empty($e['attendees'])) continue;
                $min += (int)($e['duration_min'] ?? 0); $n++;
            }
            $serie[] = ['dia' => $dia, 'minutos' => $min, 'reunioes' => $n];
        }

        $totalMin = array_sum(array_column($serie, 'minutos'));
        $totalReu = array_sum(array_column($serie, 'reunioes'));

        return [
            'time_zone' => $tz,
            'hoje' => [
                'compromissos' => $compromissos,
                'reunioes' => $reunioes,
                'convites_pendentes' => $pendentes,
                'cancelados' => $cancelados,
                'participantes_externos' => $externos,
                'ocupado_min' => $ocupadoMin,
                'livre_min' => max(0, $expedienteMin - $ocupadoMin),
                'conflitos' => count($conflitosHoje),
                'proxima_reuniao' => $proxima,
            ],
            'carga' => [
                'serie_28d' => $serie,
                'horas_total' => round($totalMin / 60, 1),
                'reunioes_total' => $totalReu,
                'media_reunioes_dia' => $totalReu > 0 ? round($totalReu / 28, 1) : 0.0,
                'duracao_media_min' => $totalReu > 0 ? (int)round($totalMin / $totalReu) : 0,
            ],
            'aviso' => 'Indicadores descrevem carga e organização da agenda — não avaliam desempenho.',
        ];
    }

    public function tiposRelatorio(): array
    {
        return GcalReports::tipos();
    }

    /**
     * A agregacao vive em GcalReports, nao aqui: e logica de negocio que o
     * provedor REAL reaproveita inteira na Fase 4 (muda a origem dos eventos,
     * mantem o calculo). Este metodo so junta o contexto.
     */
    public function relatorio(string $tipo, array $f): array
    {
        $tz = Tz::normalizar($f['tz'] ?? static::TZ);
        // Cancelados entram: varios relatorios (cancelamentos, calendarios) os
        // contam. Quem nao quer, filtra na propria agregacao.
        $eventos = $this->eventos([
            'de' => $f['de'], 'ate' => $f['ate'], 'tz' => $tz,
            'calendars' => $f['calendars'] ?? null,
            'incluir_cancelados' => true,
        ]);

        $ctx = [
            'tz' => $tz, 'de' => $f['de'], 'ate' => $f['ate'],
            'calendarios' => $this->calendarios(),
            'conflitos' => $this->detectarConflitos($eventos, $tz),
        ];

        if ($tipo === 'fluxo') return GcalReports::fluxo($eventos, $ctx);
        if ($tipo === 'rede')  return GcalReports::rede($eventos);

        return GcalReports::montar($tipo, $eventos, $ctx);
    }
}
