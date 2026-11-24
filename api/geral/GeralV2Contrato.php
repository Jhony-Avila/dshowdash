<?php
/**
 * Geral V2 — FORMATO DA TELA (contrato proposto pela CIMA em 23/11 ~21:30, aceito pela ACIMA_DIREITA com os caminhos em .php).
 * Só traduz o cálculo do GeralV2 (que já é provado à parte) para o que a tela lê. Nenhuma consulta nova aqui.
 *
 * Estado de cada bloco (mesmo enum em todos): ok · zero · parcial · desatualizado · aguardando · erro.
 * Todo bloco traz `ultimo_sucesso` (ISO, −03:00) e `motivo` (texto curto em português, sem detalhe técnico). Valor desconhecido = null, nunca 0.
 */
declare(strict_types=1);

require_once __DIR__ . '/GeralV2.php';

final class GeralV2Contrato
{
    private const ESTADO = ['ok' => 'ok', 'zero_confirmado' => 'zero', 'parcial' => 'parcial', 'desatualizado' => 'desatualizado',
                            'aguardando_conexao' => 'aguardando', 'indisponivel' => 'erro'];
    private const NOME = ['pipedrive' => 'Pipedrive', 'bling' => 'Bling', 'google_calendar' => 'Google Agenda'];
    public const URL_AGENDA = '#/panel-google-calendar';
    private const GRAVIDADE = ['atividade_vencida' => 1, 'sem_proxima_atividade' => 2, 'conflito_agenda' => 3];
    private const FONTE_TELA = ['pipedrive' => 'pipedrive', 'bling' => 'bling', 'google_calendar' => 'calendar'];
    /** fontes que ainda não têm conector publicado no Dash: o que falta (mesmos textos da Geral, confirmados pelo Jhony) */
    private const SEM_CONECTOR = [
        'asaas'         => 'Asaas em auditoria; faltam as chaves.',
        'mercadolivre'  => 'Falta criar o aplicativo do Mercado Livre (Walter).',
        'lojaintegrada' => 'Dono da conta ainda indefinido.',
    ];

    private DateTimeImmutable $agora;

    public function __construct(private GeralV2 $g) { $this->agora = $g->agora(); }

    // ─────────────── 1. resumo ───────────────
    public function resumo(string $periodo): array
    {
        $r = $this->g->numeros($periodo);
        $p = $r['pedidos']; $w = $r['ganhos']; $f = $r['funil'];
        $fb = $this->g->fonte('bling'); $fp = $this->g->fonte('pipedrive');
        return [
            'gerado_em' => $r['gerado_em'],
            'periodo' => ['id' => $periodo, 'de' => $r['periodo']['de'], 'ate' => $r['periodo']['ate'], 'rotulo' => $this->rotuloPeriodo($periodo, $r['periodo']['de'], $r['periodo']['ate'])],
            'pedidos_bling' => [
                'estado' => self::ESTADO[$p['estado']], 'quantidade' => $p['quantidade'], 'valor' => $p['valor'], 'por_dia' => $p['por_dia'],
                'inclui_canceladas' => $p['inclui_cancelados'], 'inclui_teste_ml' => $p['inclui_teste_ml'],
                'ultimo_sucesso' => $p['atualizado_em'], 'motivo' => $this->motivo('bling', $p['estado'], $fb),
            ],
            'negocios_ganhos' => [
                'estado' => self::ESTADO[$w['estado']], 'quantidade' => $w['quantidade'], 'valor' => $w['valor'], 'sem_valor' => $w['sem_valor'],
                'ultimo_sucesso' => $w['atualizado_em'], 'motivo' => $this->motivo('pipedrive', $w['estado'], $fp, $w['fora_brl'] ?? null),
            ],
            'funil_aberto' => [
                'estado' => self::ESTADO[$f['estado']], 'quantidade' => $f['quantidade'], 'valor' => $f['valor'], 'sem_valor' => $f['sem_valor'],
                'ultimo_sucesso' => $f['atualizado_em'], 'motivo' => $this->motivo('pipedrive', $f['estado'], $fp, $f['fora_brl'] ?? null),
            ],
        ];
    }

    // ─────────────── 2. prioridades ───────────────
    public function prioridades(): array
    {
        $itens = [];
        foreach ($this->g->prioridades() as $x) {   // situação de agora: o período não muda as prioridades
            $fonte = $x['id'] === 'conflito_agenda' ? 'google_calendar' : 'pipedrive';
            $n = $x['total'];
            $itens[] = [
                'id' => $x['id'], 'estado' => self::ESTADO[$x['estado']], 'quantidade' => $n, 'gravidade' => self::GRAVIDADE[$x['id']],
                'desde' => $x['mais_antiga'], 'responsaveis' => $x['responsaveis'] ?? null,
                'detalhe' => $x['id'] === 'conflito_agenda'
                    ? 'Google Agenda' . ($n !== null ? ' · ' . $n . ($n === 1 ? ' conflito hoje' : ' conflitos hoje') : '')
                    : 'Pipedrive' . ($n !== null ? ' · ' . $n . ($n === 1 ? ' negócio distinto' : ' negócios distintos') : ''),
                'ultimo_sucesso' => $x['atualizado_em'], 'motivo' => $this->motivo($fonte, $x['estado'], $this->g->fonte($fonte)),
            ];
        }
        return ['gerado_em' => $this->agora->format(DATE_ATOM), 'itens' => $itens];
    }

    // ─────────────── 3. lista de uma prioridade ───────────────
    public function lista(string $id, int $pagina, int $porPagina, string $ordem, string $dir, ?int $responsavel): array
    {
        $l = $this->g->lista($id, $pagina, $responsavel, $ordem, $dir, $porPagina);
        $fonte = $id === 'conflito_agenda' ? 'google_calendar' : 'pipedrive';
        $nomeResp = null;
        foreach ($l['responsaveis'] ?? [] as $x) if ($x['id'] === $responsavel) $nomeResp = $x['nome'];
        $base = [
            'id' => $id, 'estado' => self::ESTADO[$l['estado']], 'total' => $l['total'], 'pagina' => $l['pagina'], 'por_pagina' => $l['por_pagina'],
            'paginas' => $l['paginas'], 'ultimo_sucesso' => $l['atualizado_em'], 'motivo' => $this->motivo($fonte, $l['estado'], $this->g->fonte($fonte)),
            'criterios' => ['texto' => $this->criterio($id, $responsavel === null ? null : ($nomeResp ?? 'responsável escolhido'))],
            'responsaveis' => $l['responsaveis'] === null ? null : array_map(fn($x) => ['id' => $x['id'], 'nome' => $x['nome']], $l['responsaveis']),
        ];
        if ($id === 'conflito_agenda') return $base + ['itens' => $l['itens']];   // a tela abre a agenda; a lista existe e reproduz a contagem
        return $base + ['itens' => array_map(fn($x) => [
            'deal_id' => $x['negocio_id'], 'titulo' => $x['titulo'], 'organizacao' => $x['organizacao'], 'responsavel' => $x['responsavel'],
            'etapa' => $x['etapa'], 'prazo' => $x['referencia'], 'valor' => $x['valor'], 'url_pipedrive' => $x['link'],
        ], $l['itens'])];
    }

    // ─────────────── 4. agenda de hoje ───────────────
    public function agenda(): array
    {
        $a = $this->g->agendaHoje();
        $f = $this->g->fonte('google_calendar');
        return [
            'estado' => self::ESTADO[$a['estado']], 'ultimo_sucesso' => $a['atualizado_em'], 'motivo' => $this->motivo('google_calendar', $a['estado'], $f),
            'itens' => $a['itens'] === null ? null : array_map(fn($e) => [
                'inicio' => $e['inicio'], 'fim' => $e['fim'], 'titulo' => $e['titulo'], 'duracao_min' => $e['duracao_min'],
                'dia_inteiro' => $e['dia_inteiro'], 'url_evento' => null,   // o espelho não guarda o link do evento: a tela abre a agenda
                'conflito' => $e['conflito'],
            ], $a['itens']),
            'url_agenda' => self::URL_AGENDA,
        ];
    }

    // ─────────────── 5. fontes ───────────────
    public function fontes(): array
    {
        $out = [];
        foreach (['pipedrive', 'bling', 'google_calendar'] as $id) {
            $f = $this->g->fonte($id);
            $out[] = ['fonte' => self::FONTE_TELA[$id], 'estado' => match ($f['estado']) {
                    'ok' => 'conectada', 'desatualizado', 'parcial' => 'desatualizada', 'aguardando_conexao' => 'aguardando', default => 'problema' },
                'ultimo_sucesso' => $f['atualizado_em'], 'motivo' => $this->motivo($id, $f['estado'], $f)];
        }
        foreach (self::SEM_CONECTOR as $id => $txt) $out[] = ['fonte' => $id, 'estado' => 'aguardando', 'ultimo_sucesso' => null, 'motivo' => $txt];
        return $out;
    }

    // ─────────────── textos ───────────────

    /** Motivo curto em português, sem detalhe técnico. ok/zero = null. */
    private function motivo(string $fonte, string $estado, array $f, ?int $foraBrl = null): ?string
    {
        $nome = self::NOME[$fonte];
        $quando = $f['atualizado_em'] !== null ? $this->quando($f['atualizado_em']) : null;
        return match ($estado) {
            'ok', 'zero_confirmado' => null,
            'aguardando_conexao' => $fonte === 'google_calendar' ? 'Nenhuma agenda Google conectada.' : "$nome sem conta conectada.",
            'desatualizado' => $quando !== null ? "Última atualização do $nome $quando." : "$nome sem atualização recente.",
            'parcial' => match (true) {
                $foraBrl !== null && $foraBrl > 0 && $f['estado'] === 'ok' => $foraBrl . ($foraBrl === 1 ? ' negócio em outra moeda ficou' : ' negócios em outra moeda ficaram') . ' fora do valor.',
                preg_match('/^calendarios_atrasados_(\d+)_de_(\d+)$/', (string) $f['detalhe'], $m) === 1 => "{$m[1]} de {$m[2]} agendas com atualização atrasada.",
                $f['detalhe'] === 'pedidos_nunca_sincronizados' => 'Os pedidos do Bling ainda não foram sincronizados.',
                default => "A última sincronização do $nome ficou incompleta.",
            },
            default => "Não foi possível ler o $nome agora.",
        };
    }

    private function quando(string $iso): string
    {
        $t = (new DateTimeImmutable($iso))->setTimezone(new DateTimeZone(GeralV2::FUSO));
        return $t->format('Y-m-d') === $this->agora->format('Y-m-d') ? 'às ' . $t->format('H:i') : 'em ' . $t->format('d/m') . ' às ' . $t->format('H:i');
    }

    private function rotuloPeriodo(string $id, string $de, string $ate): string
    {
        $d = new DateTimeImmutable($de); $a = new DateTimeImmutable($ate);
        $faixa = $de === $ate ? $a->format('d/m/Y')
            : ($d->format('Y') !== $a->format('Y') ? $d->format('d/m/Y') . ' a ' . $a->format('d/m/Y')
            : ($d->format('m') !== $a->format('m') ? $d->format('d/m') . ' a ' . $a->format('d/m/Y') : $d->format('d') . ' a ' . $a->format('d/m/Y')));
        $dias = (int) $d->diff($a)->days + 1;
        return $faixa . ' · ' . match ($id) { 'ontem' => 'ontem', '7d' => "$dias dias completos", default => 'mês até ontem' };
    }

    private function criterio(string $id, ?string $resp): string
    {
        $hoje = $this->agora->format('d/m/Y');
        $quem = $resp ?? 'todos os responsáveis';
        return match ($id) {
            'atividade_vencida' => "atividade vencida até $hoje · aberto · $quem",
            'sem_proxima_atividade' => 'sem atividade futura · fechamento previsto até ' . $this->agora->modify('+7 days')->format('d/m/Y') . " (inclui vencidos) · aberto · $quem",
            default => "conflitos de hoje ($hoje) na sua agenda",
        };
    }
}
