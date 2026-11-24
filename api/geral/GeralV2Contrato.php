<?php
/**
 * Geral V2 — FORMATO DA TELA (contrato proposto pela CIMA em 23/11 ~21:30, aceito pela ACIMA_DIREITA com os caminhos em .php).
 * Só traduz o cálculo do GeralV2 (que já é provado à parte) para o que a tela lê. Nenhuma consulta nova aqui.
 *
 * Estado de cada bloco (mesmo enum em todos): ok · zero · parcial · desatualizado · aguardando · erro.
 * Todo bloco traz `ultimo_sucesso` (ISO, −03:00) e `motivo` (texto curto em português, sem detalhe técnico). Valor desconhecido = null, nunca 0.
 *
 * Estado POR INDICADOR (ACIMA_ESQUERDA, 24/11; contrato da CIMA 15:4x + proposta 16:30). Aditivos em cada indicador:
 *   `fonte` ('pipedrive'|'bling'|'calendar'), `consulta_completa` (a última sincronização da fonte DAQUELE indicador leu e gravou tudo e a
 *   consulta de agora não falhou), `fonte_atualizada_em` (último sucesso completo), `valor_em` (quando o número mostrado foi lido; null sem número)
 *   e `lacunas` (sem_valor | fora_brl | sync_incompleta). `zero` só com 0 + fonte em dia + consulta completa.
 */
declare(strict_types=1);

require_once __DIR__ . '/GeralV2.php';

final class GeralV2Contrato
{
    private const ESTADO = ['ok' => 'ok', 'zero_confirmado' => 'zero', 'parcial' => 'parcial', 'desatualizado' => 'desatualizado',
                            'aguardando_conexao' => 'aguardando', 'indisponivel' => 'erro'];
    private const NOME = ['pipedrive' => 'Pipedrive', 'pipedrive_negocios' => 'Pipedrive', 'bling' => 'Bling', 'google_calendar' => 'Google Agenda'];
    public const URL_AGENDA = '#/panel-google-calendar';
    private const GRAVIDADE = ['atividade_vencida' => 1, 'sem_proxima_atividade' => 2, 'conflito_agenda' => 3];
    private const FONTE_TELA = ['pipedrive' => 'pipedrive', 'pipedrive_negocios' => 'pipedrive', 'bling' => 'bling', 'google_calendar' => 'calendar'];
    /** de que fonte interna cada indicador depende (ganhos e funil: só negócios; prioridades do Pipedrive: negócios E atividades) */
    private const INDICADORES = [
        'pipedrive' => ['negocios_ganhos' => 'pipedrive_negocios', 'funil_aberto' => 'pipedrive_negocios', 'atividade_vencida' => 'pipedrive', 'sem_proxima_atividade' => 'pipedrive'],
        'bling' => ['pedidos_bling' => 'bling'],
        'google_calendar' => ['agenda' => 'google_calendar', 'conflito_agenda' => 'google_calendar'],
    ];
    private const PIOR = ['ok' => 0, 'parcial' => 1, 'desatualizado' => 2, 'aguardando_conexao' => 3, 'indisponivel' => 4];
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
        $fb = $this->g->fonte('bling'); $fp = $this->g->fonte('pipedrive_negocios');
        return [
            'gerado_em' => $r['gerado_em'],
            'periodo' => ['id' => $periodo, 'de' => $r['periodo']['de'], 'ate' => $r['periodo']['ate'], 'rotulo' => $this->rotuloPeriodo($periodo, $r['periodo']['de'], $r['periodo']['ate'])],
            'pedidos_bling' => [
                'estado' => self::ESTADO[$p['estado']], 'quantidade' => $p['quantidade'], 'valor' => $p['valor'], 'por_dia' => $p['por_dia'],
                'inclui_canceladas' => $p['inclui_cancelados'], 'inclui_teste_ml' => $p['inclui_teste_ml'], 'sem_canal' => $p['sem_canal'],
                'ultimo_sucesso' => $p['atualizado_em'], 'motivo' => $this->motivo('bling', $p['estado'], $fb, $this->lacunaCanal($p)),
            ] + $this->meta('bling', $p['estado'], $p['quantidade'] !== null, $p['lacunas']),
            'negocios_ganhos' => [
                'estado' => self::ESTADO[$w['estado']], 'quantidade' => $w['quantidade'], 'valor' => $w['valor'], 'sem_valor' => $w['sem_valor'],
                'fora_brl' => $w['fora_brl'], 'ultimo_sucesso' => $w['atualizado_em'], 'motivo' => $this->motivo('pipedrive_negocios', $w['estado'], $fp, $this->lacunaDado($w)),
            ] + $this->meta('pipedrive_negocios', $w['estado'], $w['quantidade'] !== null, $w['lacunas']),
            'funil_aberto' => [
                'estado' => self::ESTADO[$f['estado']], 'quantidade' => $f['quantidade'], 'valor' => $f['valor'], 'sem_valor' => $f['sem_valor'],
                'fora_brl' => $f['fora_brl'], 'ultimo_sucesso' => $f['atualizado_em'], 'motivo' => $this->motivo('pipedrive_negocios', $f['estado'], $fp, $this->lacunaDado($f)),
            ] + $this->meta('pipedrive_negocios', $f['estado'], $f['quantidade'] !== null, $f['lacunas']),
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
            ] + $this->meta($fonte, $x['estado'], $n !== null, $this->lacunasFonte($this->g->fonte($fonte)));
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
            'id' => $id, 'estado' => self::ESTADO[$l['estado']], 'total' => $l['total'], 'total_sem_filtro' => $l['total_sem_filtro'],
            'sem_responsavel' => $l['sem_responsavel'] ?? null, 'pagina' => $l['pagina'], 'por_pagina' => $l['por_pagina'],
            'paginas' => $l['paginas'], 'ultimo_sucesso' => $l['atualizado_em'], 'motivo' => $this->motivo($fonte, $l['estado'], $this->g->fonte($fonte)),
            'criterios' => ['texto' => $this->criterio($id, $responsavel === null ? null : ($nomeResp ?? 'responsável escolhido'))],
            'responsaveis' => $l['responsaveis'] === null ? null : array_map(fn($x) => ['id' => $x['id'], 'nome' => $x['nome']], $l['responsaveis']),
        ] + $this->meta($fonte, $l['estado'], $l['total'] !== null, $this->lacunasFonte($this->g->fonte($fonte)));
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
        ] + $this->meta('google_calendar', $a['estado'], $a['itens'] !== null, $this->lacunasFonte($f));
    }

    // ─────────────── 5. fontes ───────────────
    /**
     * Linha de fontes COERENTE com os indicadores (pedido da CIMA, 24/11): o estado da fonte é o PIOR entre os indicadores dela, e
     * `indicadores: [{id, estado}]` diz o de cada um. É o estado da LEITURA (frescor e completude); a lacuna do dado (negócio sem valor) deixa
     * o cartão `parcial`, mas não a fonte.
     */
    public function fontes(): array
    {
        $out = [];
        foreach (self::INDICADORES as $id => $inds) {
            $pior = null; $lista = [];
            foreach ($inds as $ind => $fid) {
                $f = $this->g->fonte($fid);
                $lista[] = ['id' => $ind, 'estado' => self::ESTADO[$f['estado']]];
                if ($pior === null || self::PIOR[$f['estado']] > self::PIOR[$pior['estado']]
                    || (self::PIOR[$f['estado']] === self::PIOR[$pior['estado']] && ($f['atualizado_em'] ?? '') < ($pior['atualizado_em'] ?? ''))) $pior = $f + ['_fid' => $fid];
            }
            $out[] = ['fonte' => self::FONTE_TELA[$id], 'estado' => match ($pior['estado']) {
                    'ok' => 'conectada', 'desatualizado', 'parcial' => 'desatualizada', 'aguardando_conexao' => 'aguardando', default => 'problema' },
                'ultimo_sucesso' => $pior['atualizado_em'], 'motivo' => $this->motivo($pior['_fid'], $pior['estado'], $pior), 'indicadores' => $lista];
        }
        foreach (self::SEM_CONECTOR as $id => $txt) $out[] = ['fonte' => $id, 'estado' => 'aguardando', 'ultimo_sucesso' => null, 'motivo' => $txt, 'indicadores' => []];
        return $out;
    }

    // ─────────────── estado por indicador ───────────────

    /**
     * Aditivos por indicador. `consulta_completa`: a última sincronização da fonte DAQUELE indicador leu e gravou tudo E a consulta de agora
     * não falhou. `valor_em` = quando o número mostrado foi lido (o último sucesso completo da fonte); sem número, null.
     */
    private function meta(string $fonteId, string $estado, bool $temNumero, array $lacunas): array
    {
        $f = $this->g->fonte($fonteId);
        return ['fonte' => self::FONTE_TELA[$fonteId], 'consulta_completa' => $f['completa'] && $estado !== 'indisponivel',
                'fonte_atualizada_em' => $f['atualizado_em'], 'valor_em' => $temNumero ? $f['atualizado_em'] : null, 'lacunas' => array_values($lacunas)];
    }

    private function lacunasFonte(array $f): array
    {
        return $f['estado'] === 'parcial' ? ['sync_incompleta'] : [];
    }

    /** Lacuna do DADO nos pedidos (decisão do Jhony, 24/11): "1 pedido ainda sem identificação de canal", como na prancha. */
    private function lacunaCanal(array $p): ?string
    {
        $n = (int) ($p['sem_canal'] ?? 0);
        return $n > 0 ? $n . ($n === 1 ? ' pedido ainda sem identificação de canal' : ' pedidos ainda sem identificação de canal') : null;
    }

    /** Texto da lacuna do DADO em ganhos/funil (a fonte em si está bem): "3 negócios sem valor" — a tela compõe "Dados parciais · Soma dos valores informados · …". */
    private function lacunaDado(array $b): ?string
    {
        $sem = (int) ($b['sem_valor'] ?? 0); $fora = (int) ($b['fora_brl'] ?? 0);
        if ($sem > 0) return $sem . ($sem === 1 ? ' negócio sem valor' : ' negócios sem valor') . ($fora > 0 ? ' · ' . $fora . ' em outra moeda' : '');
        if ($fora > 0) return $fora . ($fora === 1 ? ' negócio em outra moeda ficou' : ' negócios em outra moeda ficaram') . ' fora do valor.';
        return null;
    }

    // ─────────────── textos ───────────────

    /** Motivo curto em português, sem detalhe técnico. ok/zero = null. `$dado` = lacuna do dado (ganhos/funil), usada quando a fonte em si está bem. */
    private function motivo(string $fonte, string $estado, array $f, ?string $dado = null): ?string
    {
        $nome = self::NOME[$fonte];
        $quando = $f['atualizado_em'] !== null ? $this->quando($f['atualizado_em']) : null;
        if ($f['detalhe'] === 'escopo_ausente' && in_array($estado, ['desatualizado', 'indisponivel'], true)) {
            return 'O acesso ao Bling não inclui os pedidos; é preciso reautorizar.' . ($quando !== null ? " Última leitura completa $quando." : '');
        }
        return match ($estado) {
            'ok', 'zero_confirmado' => null,
            'aguardando_conexao' => $fonte === 'google_calendar' ? 'Nenhuma agenda Google conectada.' : "$nome sem conta conectada.",
            'desatualizado' => $quando !== null ? "Última atualização do $nome $quando." : "$nome sem atualização recente.",
            'parcial' => match (true) {
                $dado !== null && $f['estado'] === 'ok' => $dado,
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
            'atividade_vencida' => "atividade não concluída com prazo antes de hoje ($hoje), ou de hoje com horário já passado · aberto · $quem",
            'sem_proxima_atividade' => 'sem atividade futura · fechamento previsto até ' . $this->agora->modify('+7 days')->format('d/m/Y') . " (inclui vencidos) · aberto · $quem",
            default => "conflitos de hoje ($hoje) na sua agenda",
        };
    }
}
