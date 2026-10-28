<?php
// Google Calendar / GcalReports - agregacoes dos relatorios (§64)
// @module google-calendar.reports
// @version 1.0.0
// @created 2026-07-30
// @app Google Calendar
//
// Separado do GcalMock de proposito: agregacao nao e "dado de mock", e sim
// logica de negocio que o provedor REAL vai reaproveitar quase inteira na Fase 4
// (troca a origem dos eventos, mantem o calculo). Deixar isso dentro do mock
// obrigaria a reescrever tudo depois.
//
// CONTRATO UNICO de saida:
//   colunas: [{id, rotulo, tipo, total?, alinhar?}]
//   linhas:  [{<id da coluna>: valor, ...}]
//   totais:  {<id>: valor}         — calculado a partir de `total` da coluna
//   serie:   [{rotulo, valor}]     — o que vai para o grafico (opcional)
//
// `tipo` da coluna diz a FORMATACAO ao front: texto | numero | duracao |
// data | datahora | percentual | lista. O front nunca adivinha pelo conteudo.
declare(strict_types=1);

final class GcalReports
{
    /** Catalogo — o que a tela oferece no seletor. */
    public static function tipos(): array
    {
        return [
            ['id' => 'eventos',      'titulo' => 'Eventos',                'grupo' => 'Agenda',
             'descricao' => 'Todos os compromissos do período, com participantes e vínculos.'],
            ['id' => 'carga-dia',    'titulo' => 'Carga por dia',          'grupo' => 'Agenda',
             'descricao' => 'Horas ocupadas e número de reuniões, dia a dia.'],
            ['id' => 'horarios',     'titulo' => 'Distribuição por hora',  'grupo' => 'Agenda',
             'descricao' => 'Em que horas do dia as reuniões se concentram.'],
            ['id' => 'duracao',      'titulo' => 'Duração das reuniões',   'grupo' => 'Agenda',
             'descricao' => 'Quantas reuniões cabem em cada faixa de duração.'],

            ['id' => 'participantes', 'titulo' => 'Participantes',         'grupo' => 'Pessoas',
             'descricao' => 'Com quem você mais se reúne e como cada um responde.'],
            ['id' => 'convites',      'titulo' => 'Convites',              'grupo' => 'Pessoas',
             'descricao' => 'Situação das respostas aos convites recebidos.'],

            ['id' => 'clientes',     'titulo' => 'Clientes e negócios',    'grupo' => 'Relacionamento',
             'descricao' => 'Reuniões agrupadas pela entidade vinculada (§57).'],

            ['id' => 'calendarios',  'titulo' => 'Calendários',            'grupo' => 'Estrutura',
             'descricao' => 'Uso e ocupação por calendário.'],
            ['id' => 'recursos',     'titulo' => 'Recursos e salas',       'grupo' => 'Estrutura',
             'descricao' => 'Reservas por sala, showroom ou veículo.'],
            ['id' => 'conflitos',    'titulo' => 'Conflitos',              'grupo' => 'Qualidade',
             'descricao' => 'Conflitos por tipo e severidade.'],
            ['id' => 'cancelamentos', 'titulo' => 'Cancelamentos',         'grupo' => 'Qualidade',
             'descricao' => 'Eventos cancelados e convites recusados.'],
        ];
    }

    public static function existe(string $tipo): bool
    {
        foreach (self::tipos() as $t) { if ($t['id'] === $tipo) return true; }
        return false;
    }

    private static function meta(string $tipo): array
    {
        foreach (self::tipos() as $t) { if ($t['id'] === $tipo) return $t; }
        return ['id' => $tipo, 'titulo' => $tipo, 'descricao' => '', 'grupo' => ''];
    }

    /**
     * Monta um relatorio.
     *
     * @param array $eventos  ja filtrados pela janela e pelos calendarios
     * @param array $ctx      ['tz'=>, 'calendarios'=>, 'conflitos'=>, 'de'=>, 'ate'=>]
     */
    public static function montar(string $tipo, array $eventos, array $ctx): array
    {
        $m = self::meta($tipo);
        $corpo = match ($tipo) {
            'eventos'       => self::eventos($eventos, $ctx),
            'carga-dia'     => self::cargaDia($eventos, $ctx),
            'horarios'      => self::horarios($eventos, $ctx),
            'duracao'       => self::duracaoFaixas($eventos),
            'participantes' => self::participantes($eventos),
            'convites'      => self::convites($eventos),
            'clientes'      => self::clientes($eventos),
            'calendarios'   => self::calendarios($eventos, $ctx),
            'recursos'      => self::recursos($eventos, $ctx),
            'conflitos'     => self::conflitos($ctx),
            'cancelamentos' => self::cancelamentos($eventos, $ctx),
            default         => ['colunas' => [], 'linhas' => [], 'serie' => []],
        };

        $corpo['totais'] = self::totalizar($corpo['colunas'], $corpo['linhas']);
        return array_merge([
            'tipo' => $tipo, 'titulo' => $m['titulo'], 'descricao' => $m['descricao'],
            'grupo' => $m['grupo'], 'de' => $ctx['de'] ?? null, 'ate' => $ctx['ate'] ?? null,
            'time_zone' => $ctx['tz'] ?? 'America/Sao_Paulo',
        ], $corpo);
    }

    /**
     * Totalizadores (§64.1).
     *
     * Media de coluna e calculada sobre as linhas com valor > 0, nao sobre todas:
     * "duracao media" contando os zeros de dias sem reuniao daria um numero que
     * nao descreve reuniao nenhuma.
     */
    private static function totalizar(array $colunas, array $linhas): array
    {
        $out = [];
        foreach ($colunas as $c) {
            $modo = $c['total'] ?? null;
            if ($modo === null) continue;
            $vals = array_map(static fn($l) => (float)($l[$c['id']] ?? 0), $linhas);
            if ($modo === 'soma') {
                $out[$c['id']] = array_sum($vals);
            } elseif ($modo === 'media') {
                $naoZero = array_values(array_filter($vals, static fn($v) => $v > 0));
                $out[$c['id']] = $naoZero ? round(array_sum($naoZero) / count($naoZero), 1) : 0;
            }
        }
        return $out;
    }

    /** Hora e dia da semana NO FUSO DE EXIBICAO (nunca no default do processo). */
    private static function partes(string $iso, string $tz): array
    {
        $d = (new \DateTimeImmutable($iso))->setTimezone(new \DateTimeZone($tz));
        return [(int)$d->format('G'), (int)$d->format('w'), $d->format('Y-m-d')];
    }

    private static function ehReuniao(array $e): bool
    {
        return ($e['status'] ?? '') !== 'cancelled'
            && empty($e['all_day'])
            && ($e['transparency'] ?? 'opaque') === 'opaque'
            && !empty($e['attendees']);
    }

    // ── Relatorios ──────────────────────────────────────────────────────

    private static function eventos(array $eventos, array $ctx): array
    {
        $tz = $ctx['tz'];
        $linhas = [];
        foreach ($eventos as $e) {
            $linhas[] = [
                'inicio'        => $e['start'],
                'duracao'       => empty($e['all_day']) ? (int)($e['duration_min'] ?? 0) : 0,
                'titulo'        => $e['summary'],
                'calendario'    => $e['calendar_summary'] ?? $e['calendar_id'],
                'organizador'   => $e['organizer']['name'] ?? '—',
                'participantes' => count($e['attendees'] ?? []),
                'resposta'      => $e['is_organizer'] ? 'organizador' : ($e['my_response'] ?? '—'),
                'tipo_evento'   => $e['event_type'] ?? 'default',
                'local'         => $e['location'] ?? '—',
                'vinculo'       => $e['links'][0]['label'] ?? '—',
                'status'        => $e['status'] ?? 'confirmed',
            ];
        }
        // Serie: eventos por dia — dá contexto visual à lista.
        $porDia = [];
        foreach ($eventos as $e) {
            [, , $dia] = self::partes(is_string($e['start']) && strlen($e['start']) === 10
                ? $e['start'] . 'T00:00:00' : $e['start'], $tz);
            $porDia[$dia] = ($porDia[$dia] ?? 0) + 1;
        }
        ksort($porDia);

        return [
            'colunas' => [
                ['id' => 'inicio', 'rotulo' => 'Início', 'tipo' => 'datahora'],
                ['id' => 'duracao', 'rotulo' => 'Duração', 'tipo' => 'duracao', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'titulo', 'rotulo' => 'Título', 'tipo' => 'texto'],
                ['id' => 'calendario', 'rotulo' => 'Calendário', 'tipo' => 'texto'],
                ['id' => 'organizador', 'rotulo' => 'Organizador', 'tipo' => 'texto'],
                ['id' => 'participantes', 'rotulo' => 'Part.', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'resposta', 'rotulo' => 'Resposta', 'tipo' => 'texto'],
                ['id' => 'tipo_evento', 'rotulo' => 'Tipo', 'tipo' => 'texto'],
                ['id' => 'local', 'rotulo' => 'Local', 'tipo' => 'texto'],
                ['id' => 'vinculo', 'rotulo' => 'Relacionado', 'tipo' => 'texto'],
                ['id' => 'status', 'rotulo' => 'Status', 'tipo' => 'texto'],
            ],
            'linhas' => $linhas,
            'serie' => array_map(
                static fn($d, $n) => ['rotulo' => substr($d, 8, 2) . '/' . substr($d, 5, 2), 'valor' => $n],
                array_keys($porDia), array_values($porDia)
            ),
            'serie_titulo' => 'Eventos por dia',
            'serie_unidade' => 'eventos',
        ];
    }

    private static function cargaDia(array $eventos, array $ctx): array
    {
        $tz = $ctx['tz'];
        $acc = [];
        foreach ($eventos as $e) {
            if (!self::ehReuniao($e)) continue;
            [, , $dia] = self::partes($e['start'], $tz);
            $a = $acc[$dia] ?? ['dia' => $dia, 'reunioes' => 0, 'minutos' => 0, 'externas' => 0];
            $a['reunioes']++;
            $a['minutos'] += (int)($e['duration_min'] ?? 0);
            foreach ($e['attendees'] as $p) { if (!empty($p['external'])) { $a['externas']++; break; } }
            $acc[$dia] = $a;
        }
        ksort($acc);
        $linhas = array_values(array_map(static function ($a) {
            $a['media'] = $a['reunioes'] > 0 ? (int)round($a['minutos'] / $a['reunioes']) : 0;
            return $a;
        }, $acc));

        return [
            'colunas' => [
                ['id' => 'dia', 'rotulo' => 'Dia', 'tipo' => 'data'],
                ['id' => 'reunioes', 'rotulo' => 'Reuniões', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'minutos', 'rotulo' => 'Tempo ocupado', 'tipo' => 'duracao', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'media', 'rotulo' => 'Duração média', 'tipo' => 'duracao', 'total' => 'media', 'alinhar' => 'direita'],
                ['id' => 'externas', 'rotulo' => 'Com externos', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
            ],
            'linhas' => $linhas,
            'serie' => array_map(static fn($l) => [
                'rotulo' => substr($l['dia'], 8, 2) . '/' . substr($l['dia'], 5, 2),
                'valor' => round($l['minutos'] / 60, 1),
            ], $linhas),
            'serie_titulo' => 'Horas em reunião por dia',
            'serie_unidade' => 'horas',
        ];
    }

    private static function horarios(array $eventos, array $ctx): array
    {
        $tz = $ctx['tz'];
        $acc = array_fill(0, 24, 0);
        $min = array_fill(0, 24, 0);
        foreach ($eventos as $e) {
            if (!self::ehReuniao($e)) continue;
            [$h] = self::partes($e['start'], $tz);
            $acc[$h]++;
            $min[$h] += (int)($e['duration_min'] ?? 0);
        }
        $total = array_sum($acc);
        $linhas = [];
        for ($h = 0; $h < 24; $h++) {
            if ($acc[$h] === 0 && $min[$h] === 0) continue;   // hora vazia só polui
            $linhas[] = [
                'hora' => str_pad((string)$h, 2, '0', STR_PAD_LEFT) . ':00',
                'reunioes' => $acc[$h],
                'minutos' => $min[$h],
                'participacao' => $total > 0 ? round($acc[$h] / $total * 100, 1) : 0.0,
            ];
        }
        return [
            'colunas' => [
                ['id' => 'hora', 'rotulo' => 'Hora', 'tipo' => 'texto'],
                ['id' => 'reunioes', 'rotulo' => 'Reuniões', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'minutos', 'rotulo' => 'Tempo', 'tipo' => 'duracao', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'participacao', 'rotulo' => '% do total', 'tipo' => 'percentual', 'alinhar' => 'direita'],
            ],
            'linhas' => $linhas,
            'serie' => array_map(static fn($l) => ['rotulo' => $l['hora'], 'valor' => $l['reunioes']], $linhas),
            'serie_titulo' => 'Reuniões por hora do dia',
            'serie_unidade' => 'reuniões',
        ];
    }

    private static function duracaoFaixas(array $eventos): array
    {
        $faixas = [
            ['ate' => 15,  'rotulo' => 'até 15 min'],
            ['ate' => 30,  'rotulo' => '16 a 30 min'],
            ['ate' => 60,  'rotulo' => '31 a 60 min'],
            ['ate' => 120, 'rotulo' => '1 a 2 h'],
            ['ate' => 240, 'rotulo' => '2 a 4 h'],
            ['ate' => PHP_INT_MAX, 'rotulo' => 'mais de 4 h'],
        ];
        $cont = array_fill(0, count($faixas), 0);
        $soma = array_fill(0, count($faixas), 0);
        foreach ($eventos as $e) {
            if (!self::ehReuniao($e)) continue;
            $d = (int)($e['duration_min'] ?? 0);
            foreach ($faixas as $i => $f) {
                if ($d <= $f['ate']) { $cont[$i]++; $soma[$i] += $d; break; }
            }
        }
        $total = array_sum($cont);
        $linhas = [];
        foreach ($faixas as $i => $f) {
            $linhas[] = [
                'faixa' => $f['rotulo'],
                'reunioes' => $cont[$i],
                'tempo' => $soma[$i],
                'participacao' => $total > 0 ? round($cont[$i] / $total * 100, 1) : 0.0,
            ];
        }
        return [
            'colunas' => [
                ['id' => 'faixa', 'rotulo' => 'Faixa de duração', 'tipo' => 'texto'],
                ['id' => 'reunioes', 'rotulo' => 'Reuniões', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'tempo', 'rotulo' => 'Tempo total', 'tipo' => 'duracao', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'participacao', 'rotulo' => '% das reuniões', 'tipo' => 'percentual', 'alinhar' => 'direita'],
            ],
            'linhas' => $linhas,
            'serie' => array_map(static fn($l) => ['rotulo' => $l['faixa'], 'valor' => $l['reunioes']], $linhas),
            'serie_titulo' => 'Reuniões por faixa de duração',
            'serie_unidade' => 'reuniões',
        ];
    }

    private static function participantes(array $eventos): array
    {
        $acc = [];
        foreach ($eventos as $e) {
            if (($e['status'] ?? '') === 'cancelled') continue;
            foreach (($e['attendees'] ?? []) as $p) {
                if (!empty($p['self'])) continue;              // não conta você mesmo
                $k = strtolower($p['email']);
                $a = $acc[$k] ?? [
                    'nome' => $p['name'] ?: $p['email'], 'email' => $p['email'],
                    'reunioes' => 0, 'minutos' => 0, 'aceitos' => 0, 'pendentes' => 0,
                    'externo' => !empty($p['external']) ? 'sim' : 'não',
                ];
                $a['reunioes']++;
                $a['minutos'] += (int)($e['duration_min'] ?? 0);
                if (($p['response'] ?? '') === 'accepted') $a['aceitos']++;
                if (($p['response'] ?? '') === 'needsAction') $a['pendentes']++;
                $acc[$k] = $a;
            }
        }
        $linhas = array_values($acc);
        foreach ($linhas as &$l) {
            $l['taxa_aceite'] = $l['reunioes'] > 0 ? round($l['aceitos'] / $l['reunioes'] * 100, 1) : 0.0;
        }
        unset($l);
        usort($linhas, static fn($a, $b) => $b['reunioes'] <=> $a['reunioes']);

        return [
            'colunas' => [
                ['id' => 'nome', 'rotulo' => 'Participante', 'tipo' => 'texto'],
                ['id' => 'email', 'rotulo' => 'E-mail', 'tipo' => 'texto'],
                ['id' => 'externo', 'rotulo' => 'Externo', 'tipo' => 'texto'],
                ['id' => 'reunioes', 'rotulo' => 'Reuniões', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'minutos', 'rotulo' => 'Tempo junto', 'tipo' => 'duracao', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'pendentes', 'rotulo' => 'Sem resposta', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'taxa_aceite', 'rotulo' => 'Taxa de aceite', 'tipo' => 'percentual', 'alinhar' => 'direita'],
            ],
            'linhas' => $linhas,
            'serie' => array_map(
                static fn($l) => ['rotulo' => explode(' ', $l['nome'])[0], 'valor' => $l['reunioes']],
                array_slice($linhas, 0, 12)
            ),
            'serie_titulo' => 'Reuniões por participante (top 12)',
            'serie_unidade' => 'reuniões',
        ];
    }

    private static function convites(array $eventos): array
    {
        $rot = ['accepted' => 'Aceitos', 'declined' => 'Recusados',
                'tentative' => 'Talvez', 'needsAction' => 'Aguardando'];
        $acc = array_fill_keys(array_keys($rot), ['n' => 0, 'min' => 0]);
        foreach ($eventos as $e) {
            if (!empty($e['is_organizer']) || empty($e['attendees'])) continue;
            $r = $e['my_response'] ?? 'needsAction';
            if (!isset($acc[$r])) continue;
            $acc[$r]['n']++;
            $acc[$r]['min'] += (int)($e['duration_min'] ?? 0);
        }
        $total = array_sum(array_column($acc, 'n'));
        $linhas = [];
        foreach ($rot as $k => $r) {
            $linhas[] = [
                'situacao' => $r,
                'convites' => $acc[$k]['n'],
                'tempo' => $acc[$k]['min'],
                'participacao' => $total > 0 ? round($acc[$k]['n'] / $total * 100, 1) : 0.0,
            ];
        }
        return [
            'colunas' => [
                ['id' => 'situacao', 'rotulo' => 'Situação', 'tipo' => 'texto'],
                ['id' => 'convites', 'rotulo' => 'Convites', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'tempo', 'rotulo' => 'Tempo envolvido', 'tipo' => 'duracao', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'participacao', 'rotulo' => '% dos convites', 'tipo' => 'percentual', 'alinhar' => 'direita'],
            ],
            'linhas' => $linhas,
            'serie' => array_map(static fn($l) => ['rotulo' => $l['situacao'], 'valor' => $l['convites']], $linhas),
            'serie_titulo' => 'Convites por situação',
            'serie_unidade' => 'convites',
        ];
    }

    private static function clientes(array $eventos): array
    {
        $rotTipo = [
            'pipedrive_deal' => 'Negócio', 'cliente' => 'Cliente', 'fornecedor' => 'Fornecedor',
            'proposta' => 'Proposta', 'pedido' => 'Pedido', 'projeto' => 'Projeto',
            'colaborador' => 'Colaborador',
        ];
        $acc = [];
        foreach ($eventos as $e) {
            if (($e['status'] ?? '') === 'cancelled') continue;
            foreach (($e['links'] ?? []) as $l) {
                $k = $l['entity_type'] . ':' . $l['entity_id'];
                $a = $acc[$k] ?? [
                    'entidade' => $l['label'],
                    'tipo' => $rotTipo[$l['entity_type']] ?? $l['entity_type'],
                    'reunioes' => 0, 'minutos' => 0, 'ultima' => '',
                    'valor' => $l['extra']['valor'] ?? '—',
                ];
                $a['reunioes']++;
                $a['minutos'] += (int)($e['duration_min'] ?? 0);
                if ((string)$e['start'] > $a['ultima']) $a['ultima'] = (string)$e['start'];
                $acc[$k] = $a;
            }
        }
        $linhas = array_values($acc);
        usort($linhas, static fn($a, $b) => $b['reunioes'] <=> $a['reunioes']);

        return [
            'colunas' => [
                ['id' => 'entidade', 'rotulo' => 'Relacionado', 'tipo' => 'texto'],
                ['id' => 'tipo', 'rotulo' => 'Tipo', 'tipo' => 'texto'],
                ['id' => 'reunioes', 'rotulo' => 'Reuniões', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'minutos', 'rotulo' => 'Tempo dedicado', 'tipo' => 'duracao', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'valor', 'rotulo' => 'Valor', 'tipo' => 'texto', 'alinhar' => 'direita'],
                ['id' => 'ultima', 'rotulo' => 'Última reunião', 'tipo' => 'datahora'],
            ],
            'linhas' => $linhas,
            'serie' => array_map(
                static fn($l) => ['rotulo' => mb_substr($l['entidade'], 0, 18), 'valor' => $l['reunioes']],
                array_slice($linhas, 0, 12)
            ),
            'serie_titulo' => 'Reuniões por relacionamento (top 12)',
            'serie_unidade' => 'reuniões',
        ];
    }

    private static function calendarios(array $eventos, array $ctx): array
    {
        $rotAcesso = ['owner' => 'proprietário', 'writer' => 'pode editar',
                      'reader' => 'somente leitura', 'freeBusyReader' => 'livre/ocupado'];
        $acc = [];
        foreach (($ctx['calendarios'] ?? []) as $c) {
            $acc[$c['id']] = [
                'calendario' => $c['summary'], 'tipo' => $c['kind'],
                'acesso' => $rotAcesso[$c['access_role']] ?? $c['access_role'],
                'eventos' => 0, 'minutos' => 0, 'cancelados' => 0,
            ];
        }
        foreach ($eventos as $e) {
            $k = $e['calendar_id'];
            if (!isset($acc[$k])) continue;
            $acc[$k]['eventos']++;
            if (($e['status'] ?? '') === 'cancelled') { $acc[$k]['cancelados']++; continue; }
            if (empty($e['all_day'])) $acc[$k]['minutos'] += (int)($e['duration_min'] ?? 0);
        }
        $linhas = array_values($acc);
        usort($linhas, static fn($a, $b) => $b['eventos'] <=> $a['eventos']);

        return [
            'colunas' => [
                ['id' => 'calendario', 'rotulo' => 'Calendário', 'tipo' => 'texto'],
                ['id' => 'tipo', 'rotulo' => 'Tipo', 'tipo' => 'texto'],
                ['id' => 'acesso', 'rotulo' => 'Acesso', 'tipo' => 'texto'],
                ['id' => 'eventos', 'rotulo' => 'Eventos', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'minutos', 'rotulo' => 'Tempo ocupado', 'tipo' => 'duracao', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'cancelados', 'rotulo' => 'Cancelados', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
            ],
            'linhas' => $linhas,
            'serie' => array_map(static fn($l) => ['rotulo' => $l['calendario'], 'valor' => $l['eventos']], $linhas),
            'serie_titulo' => 'Eventos por calendário',
            'serie_unidade' => 'eventos',
        ];
    }

    private static function recursos(array $eventos, array $ctx): array
    {
        $recursos = array_values(array_filter($ctx['calendarios'] ?? [],
            static fn($c) => ($c['kind'] ?? '') === 'resource'));
        $acc = [];
        foreach ($recursos as $c) {
            $acc[$c['id']] = [
                'recurso' => $c['summary'], 'capacidade' => $c['capacity'] ?? 0,
                'local' => $c['resource_location'] ?? '—',
                'reservas' => 0, 'minutos' => 0, 'conflitos' => 0,
            ];
        }
        foreach ($eventos as $e) {
            $k = $e['calendar_id'];
            if (!isset($acc[$k])) continue;
            $acc[$k]['reservas']++;
            $acc[$k]['minutos'] += (int)($e['duration_min'] ?? 0);
            if (!empty($e['has_conflict'])) $acc[$k]['conflitos']++;
        }
        // Ocupação sobre o expediente do período — só faz sentido se houver janela.
        $dias = max(1, (int)((strtotime((string)$ctx['ate']) - strtotime((string)$ctx['de'])) / 86400) + 1);
        $expediente = $dias * 9 * 60;
        $linhas = array_values(array_map(static function ($a) use ($expediente) {
            $a['ocupacao'] = $expediente > 0 ? round($a['minutos'] / $expediente * 100, 1) : 0.0;
            return $a;
        }, $acc));
        usort($linhas, static fn($a, $b) => $b['minutos'] <=> $a['minutos']);

        return [
            'colunas' => [
                ['id' => 'recurso', 'rotulo' => 'Recurso', 'tipo' => 'texto'],
                ['id' => 'local', 'rotulo' => 'Local', 'tipo' => 'texto'],
                ['id' => 'capacidade', 'rotulo' => 'Capacidade', 'tipo' => 'numero', 'alinhar' => 'direita'],
                ['id' => 'reservas', 'rotulo' => 'Reservas', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'minutos', 'rotulo' => 'Tempo reservado', 'tipo' => 'duracao', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'ocupacao', 'rotulo' => 'Ocupação', 'tipo' => 'percentual', 'alinhar' => 'direita'],
                ['id' => 'conflitos', 'rotulo' => 'Conflitos', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
            ],
            'linhas' => $linhas,
            'serie' => array_map(static fn($l) => ['rotulo' => $l['recurso'], 'valor' => $l['reservas']], $linhas),
            'serie_titulo' => 'Reservas por recurso',
            'serie_unidade' => 'reservas',
        ];
    }

    private static function conflitos(array $ctx): array
    {
        $rot = ['sobreposicao' => 'Sobreposição', 'deslocamento' => 'Deslocamento insuficiente',
                'foco' => 'Invade bloco de foco', 'ausencia' => 'Durante ausência',
                'recurso' => 'Recurso em duplicidade'];
        $acc = [];
        foreach (($ctx['conflitos'] ?? []) as $c) {
            $k = $c['tipo'];
            $a = $acc[$k] ?? ['tipo' => $rot[$k] ?? $k, 'ocorrencias' => 0,
                              'alta' => 0, 'media' => 0, 'baixa' => 0];
            $a['ocorrencias']++;
            $a[$c['severidade']] = ($a[$c['severidade']] ?? 0) + 1;
            $acc[$k] = $a;
        }
        $linhas = array_values($acc);
        usort($linhas, static fn($a, $b) => $b['ocorrencias'] <=> $a['ocorrencias']);

        return [
            'colunas' => [
                ['id' => 'tipo', 'rotulo' => 'Tipo de conflito', 'tipo' => 'texto'],
                ['id' => 'ocorrencias', 'rotulo' => 'Ocorrências', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'alta', 'rotulo' => 'Alta', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'media', 'rotulo' => 'Média', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'baixa', 'rotulo' => 'Baixa', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
            ],
            'linhas' => $linhas,
            'serie' => array_map(static fn($l) => ['rotulo' => $l['tipo'], 'valor' => $l['ocorrencias']], $linhas),
            'serie_titulo' => 'Conflitos por tipo',
            'serie_unidade' => 'ocorrências',
        ];
    }

    private static function cancelamentos(array $eventos, array $ctx): array
    {
        $tz = $ctx['tz'];
        $acc = [];
        foreach ($eventos as $e) {
            $cancelado = ($e['status'] ?? '') === 'cancelled';
            $recusado  = ($e['my_response'] ?? '') === 'declined';
            if (!$cancelado && !$recusado) continue;
            [, , $dia] = self::partes($e['start'], $tz);
            $a = $acc[$dia] ?? ['dia' => $dia, 'cancelados' => 0, 'recusados' => 0, 'minutos' => 0];
            if ($cancelado) $a['cancelados']++; else $a['recusados']++;
            $a['minutos'] += (int)($e['duration_min'] ?? 0);
            $acc[$dia] = $a;
        }
        ksort($acc);
        $linhas = array_values($acc);

        return [
            'colunas' => [
                ['id' => 'dia', 'rotulo' => 'Dia', 'tipo' => 'data'],
                ['id' => 'cancelados', 'rotulo' => 'Cancelados', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'recusados', 'rotulo' => 'Recusados por você', 'tipo' => 'numero', 'total' => 'soma', 'alinhar' => 'direita'],
                ['id' => 'minutos', 'rotulo' => 'Tempo liberado', 'tipo' => 'duracao', 'total' => 'soma', 'alinhar' => 'direita'],
            ],
            'linhas' => $linhas,
            'serie' => array_map(static fn($l) => [
                'rotulo' => substr($l['dia'], 8, 2) . '/' . substr($l['dia'], 5, 2),
                'valor' => $l['cancelados'] + $l['recusados'],
            ], $linhas),
            'serie_titulo' => 'Cancelamentos e recusas por dia',
            'serie_unidade' => 'ocorrências',
        ];
    }

    // ── Visualizacoes D3 (§40, §65) ─────────────────────────────────────

    /**
     * Fluxo origem → tipo → resultado, no formato de um Sankey.
     *
     * O §40 pede que isto so apareca "quando houver dados suficientes e
     * beneficio analitico". Por isso devolvemos `suficiente:false` quando ha
     * pouco fluxo — um Sankey de tres fitas nao explica nada e ocupa meia tela.
     */
    public static function fluxo(array $eventos, array $ctx): array
    {
        $rotOrigem = [
            'cliente' => 'Cliente', 'fornecedor' => 'Fornecedor', 'interna' => 'Equipe interna',
            'recorrente' => 'Recorrente', 'pipedrive' => 'Pipedrive', 'outra' => 'Outra',
        ];
        $links = [];
        $add = static function (string $de, string $para) use (&$links): void {
            $k = $de . '→' . $para;
            $links[$k] = ($links[$k] ?? 0) + 1;
        };

        $n = 0;
        foreach ($eventos as $e) {
            if (empty($e['attendees']) || !empty($e['all_day'])) continue;
            $n++;

            // Origem: o vínculo manda; senão, quem participa.
            $origem = 'interna';
            $tipoLink = $e['links'][0]['entity_type'] ?? null;
            if ($tipoLink === 'pipedrive_deal')      $origem = 'pipedrive';
            elseif ($tipoLink === 'cliente')          $origem = 'cliente';
            elseif ($tipoLink === 'fornecedor')       $origem = 'fornecedor';
            elseif (!empty($e['recurring_event_id'])) $origem = 'recorrente';
            else {
                foreach ($e['attendees'] as $p) {
                    if (!empty($p['external'])) { $origem = 'cliente'; break; }
                }
            }

            $tipo = count($e['attendees']) > 3 ? 'Reunião ampla'
                  : (($e['conference'] ?? null) ? 'Videoconferência' : 'Presencial');

            $resultado = ($e['status'] ?? '') === 'cancelled' ? 'Cancelada'
                       : (($e['my_response'] ?? '') === 'needsAction' ? 'Sem resposta'
                       : (($e['my_response'] ?? '') === 'declined' ? 'Recusada' : 'Confirmada'));

            $add($rotOrigem[$origem], $tipo);
            $add($tipo, $resultado);
        }

        $saida = [];
        foreach ($links as $k => $v) {
            [$de, $para] = explode('→', $k);
            $saida[] = ['de' => $de, 'para' => $para, 'valor' => $v];
        }
        // Critério de "dado suficiente": pelo menos 8 reuniões e 4 fitas.
        return [
            'links' => $saida,
            'total' => $n,
            'suficiente' => $n >= 8 && count($saida) >= 4,
            'motivo' => $n >= 8 && count($saida) >= 4 ? null
                : 'Poucas reuniões no período para que o fluxo diga algo — amplie o intervalo.',
        ];
    }

    /**
     * Rede de coparticipacao: quem se reune com quem (§65).
     *
     * Limite de nos por desenho, nao por performance: acima de ~40 pessoas o
     * grafo vira uma bola de pelos que nao se le. Corta pelos mais frequentes e
     * informa quantos ficaram de fora — nunca trunca em silencio.
     */
    public static function rede(array $eventos, int $maxNos = 30): array
    {
        $peso = [];
        $grau = [];
        foreach ($eventos as $e) {
            if (($e['status'] ?? '') === 'cancelled') continue;
            $pessoas = [];
            foreach (($e['attendees'] ?? []) as $p) {
                if (!empty($p['self'])) continue;
                $pessoas[$p['email']] = $p['name'] ?: $p['email'];
            }
            if (count($pessoas) < 2) {
                foreach ($pessoas as $em => $nm) { $grau[$em] = ['nome' => $nm, 'n' => ($grau[$em]['n'] ?? 0) + 1]; }
                continue;
            }
            $emails = array_keys($pessoas);
            foreach ($emails as $em) { $grau[$em] = ['nome' => $pessoas[$em], 'n' => ($grau[$em]['n'] ?? 0) + 1]; }
            for ($i = 0; $i < count($emails); $i++) {
                for ($j = $i + 1; $j < count($emails); $j++) {
                    $a = $emails[$i]; $b = $emails[$j];
                    $k = $a < $b ? "$a|$b" : "$b|$a";
                    $peso[$k] = ($peso[$k] ?? 0) + 1;
                }
            }
        }

        uasort($grau, static fn($x, $y) => $y['n'] <=> $x['n']);
        $total = count($grau);
        $mantidos = array_slice($grau, 0, $maxNos, true);
        $ok = array_keys($mantidos);

        $nos = [];
        foreach ($mantidos as $em => $g) {
            $nos[] = ['id' => $em, 'nome' => $g['nome'], 'peso' => $g['n'],
                      'externo' => !str_ends_with($em, '@dshow.com.br')];
        }
        $arestas = [];
        foreach ($peso as $k => $v) {
            [$a, $b] = explode('|', $k);
            if (!in_array($a, $ok, true) || !in_array($b, $ok, true)) continue;
            $arestas[] = ['origem' => $a, 'destino' => $b, 'peso' => $v];
        }

        return [
            'nos' => $nos,
            'arestas' => $arestas,
            'total_pessoas' => $total,
            'omitidos' => max(0, $total - count($nos)),
            'suficiente' => count($nos) >= 3 && count($arestas) >= 2,
            'motivo' => count($nos) >= 3 && count($arestas) >= 2 ? null
                : 'Ainda não há coparticipação suficiente para desenhar a rede.',
        ];
    }
}
