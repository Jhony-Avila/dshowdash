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
 *
 * Parecer do agente de mockup (NO-GO visual, 24/11 noite; contrato proposto à CIMA no PARA-STATUS-ACIMA_ESQUERDA ~20:4x), tudo ADITIVO:
 *   - prioridades: `verificacao {estado completa|parcial|nao_verificada, fontes_afetadas, ultima_leitura_valida}` por item e no topo, e
 *     `sem_pendencias` (true SÓ com verificação completa e zero itens) — o único sinal de "Sem pendências";
 *   - fontes: `conexao` separada de `consultas` (o resultado REAL de cada consulta usada na tela); o estado da fonte é o PIOR das consultas,
 *     com `parte_afetada`. Cartão com problema/desatualizado nunca convive com a fonte dele "conectada";
 *   - `aviso` pronto quando o cartão é "Dados parciais" só pela lacuna do DADO (ex.: "Dados parciais · 2 pedidos sem canal").
 */
declare(strict_types=1);

require_once __DIR__ . '/GeralV2.php';

final class GeralV2Contrato
{
    private const ESTADO = ['ok' => 'ok', 'zero_confirmado' => 'zero', 'parcial' => 'parcial', 'desatualizado' => 'desatualizado',
                            'aguardando_conexao' => 'aguardando', 'indisponivel' => 'erro', 'sem_permissao' => 'sem_permissao'];
    private const NOME = ['pipedrive' => 'Pipedrive', 'pipedrive_negocios' => 'Pipedrive', 'bling' => 'Bling', 'google_calendar' => 'Google Calendar'];   // um nome só na tela (pedido da CIMA, 24/11): o do resto do Dash
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
    /** ordem de gravidade das CONSULTAS (enum da tela) */
    private const PIOR_CONSULTA = ['ok' => 0, 'parcial' => 1, 'desatualizado' => 2, 'aguardando' => 3, 'erro' => 4];
    /** rótulo pronto do estado (proposta da CIMA, 24/11 20:0x): a tela só exibe */
    private const ROTULO_ESTADO = ['ok' => 'Atualizado', 'parcial' => 'Dados parciais', 'desatualizado' => 'Desatualizado', 'erro' => 'Com problema', 'aguardando' => 'Aguardando conexão'];
    private const ROTULO_FONTE = ['pipedrive' => 'Pipedrive', 'bling' => 'Bling', 'calendar' => 'Google Calendar'];
    /** parte afetada na linha de fontes. As 3 prioridades = UMA parte, "prioridades" (parecer do mockup R3, P1): "Pipedrive · Com problema (prioridades)" */
    private const ROTULO_IND = ['negocios_ganhos' => 'ganhos', 'funil_aberto' => 'funil', 'atividade_vencida' => 'prioridades',
                                'sem_proxima_atividade' => 'prioridades', 'pedidos_bling' => 'pedidos', 'agenda' => 'agenda de hoje', 'conflito_agenda' => 'prioridades'];
    private const IND_PRIORIDADE = ['atividade_vencida', 'sem_proxima_atividade', 'conflito_agenda'];
    /** lacunas do DADO: deixam o cartão "Dados parciais", mas a consulta e a fonte estão bem */
    private const LACUNA_DADO = ['sem_valor', 'fora_brl', 'sem_canal'];
    /** consultas de cada fonte usadas na tela → os indicadores que cada uma alimenta */
    private const CONSULTAS = [
        'pipedrive' => ['ganhos' => ['Ganhos', ['negocios_ganhos']], 'funil' => ['Funil', ['funil_aberto']],
                        'atividades' => ['Atividades', ['atividade_vencida', 'sem_proxima_atividade']]],
        'bling' => ['pedidos' => ['Pedidos', ['pedidos_bling']]],
        'google_calendar' => ['agenda' => ['Agenda de hoje', ['agenda']], 'conflitos' => ['Conflitos', ['conflito_agenda']]],
    ];
    /** 116 (Jhony 25/11): a linha da Geral = as fontes dos blocos do lançamento. Asaas, Mercado Livre e Loja Integrada saem (entram na expansão). */
    public const UNIVERSO_PEDIDOS = 'pedidos de venda da conta principal, sem cancelados e sem a loja de teste do Mercado Livre';
    private const MOTIVO_PRECIFICA = 'Precifica ainda não conectado para recebimentos.';
    /** "Recebido no período" (116): fixo, sem consulta. */
    private const RECEBIDO = ['fonte' => 'precifica', 'estado' => 'aguardando', 'valor' => null, 'quantidade' => null, 'ultimo_sucesso' => null,
                              'consulta_completa' => false, 'lacunas' => [], 'motivo' => self::MOTIVO_PRECIFICA];

    private DateTimeImmutable $agora;

    public function __construct(private GeralV2 $g) { $this->agora = $g->agora(); }

    // ─────────────── 1. resumo ───────────────
    public function resumo(string $periodo): array
    {
        $r = $this->g->numeros($periodo);
        $p = $r['pedidos']; $w = $r['ganhos']; $f = $r['funil'];
        $fb = $this->g->fonte('bling'); $fp = $this->g->fonte('pipedrive_negocios');
        $cmp = $this->g->comparativo($periodo, $p['quantidade'] === null ? null : $p['por_dia']);   // 26/11: anterior + série dos 4 KPIs
        return [
            'gerado_em' => $r['gerado_em'],
            'periodo' => ['id' => $periodo, 'de' => $r['periodo']['de'], 'ate' => $r['periodo']['ate'], 'rotulo' => $this->rotuloPeriodo($periodo, $r['periodo']['de'], $r['periodo']['ate'])],
            'periodo_anterior' => $cmp['periodo_anterior'],
            // 116 (Jhony 25/11): Pedidos/OS em QUANTIDADE, só a conta da fonte (44); nenhum `valor` (o valor de pedido da 44 não é financeiro);
            // pedido sem canal = informação (`sem_canal`), não "Dados parciais"
            'pedidos_bling' => [
                'estado' => self::ESTADO[$p['estado']], 'quantidade' => $p['quantidade'], 'por_dia' => $p['por_dia'],
                'inclui_canceladas' => $p['inclui_cancelados'], 'inclui_teste_ml' => $p['inclui_teste_ml'], 'sem_canal' => $p['sem_canal'],
                'conta' => $p['conta'], 'universo' => self::UNIVERSO_PEDIDOS,
                'ultimo_sucesso' => $p['atualizado_em'], 'motivo' => $this->motivo('bling', $p['estado'], $fb),
                'aviso' => null, 'anterior' => $cmp['pedidos']['anterior'], 'serie' => $p['quantidade'] === null ? null : $cmp['pedidos']['serie'],
            ] + $this->meta('bling', $p['estado'], $p['quantidade'] !== null, $p['lacunas']),
            'negocios_ganhos' => [
                'estado' => self::ESTADO[$w['estado']], 'quantidade' => $w['quantidade'], 'valor' => $w['valor'], 'sem_valor' => $w['sem_valor'],
                'fora_brl' => $w['fora_brl'], 'ultimo_sucesso' => $w['atualizado_em'], 'motivo' => $this->motivo('pipedrive_negocios', $w['estado'], $fp, $this->lacunaDado($w)),
                'aviso' => $this->aviso($w, $this->avisoValor($w)), 'anterior' => $cmp['ganhos']['anterior'], 'serie' => $cmp['ganhos']['serie'],
            ] + $this->meta('pipedrive_negocios', $w['estado'], $w['quantidade'] !== null, $w['lacunas']),
            'funil_aberto' => [
                'estado' => self::ESTADO[$f['estado']], 'quantidade' => $f['quantidade'], 'valor' => $f['valor'], 'sem_valor' => $f['sem_valor'],
                'fora_brl' => $f['fora_brl'], 'ultimo_sucesso' => $f['atualizado_em'], 'motivo' => $this->motivo('pipedrive_negocios', $f['estado'], $fp, $this->lacunaDado($f)),
                'aviso' => $this->aviso($f, $this->avisoValor($f)), 'fotografia_em' => $f['fotografia_em'],
                'anterior' => null, 'serie' => null, 'serie_motivo' => $cmp['funil']['motivo'],   // sem fotografia diária do funil: nada inventado
            ] + $this->meta('pipedrive_negocios', $f['estado'], $f['quantidade'] !== null, $f['lacunas']),
            // 25/11: "Recebido no período" = último snapshot utilizável do coletor do Precifica (nunca Asaas/Bling/Pipedrive); sem snapshot/acesso = "—" + motivo
            'recebido' => $this->recebido($periodo) + ['anterior' => $cmp['recebido']['anterior'], 'serie' => $cmp['recebido']['serie']],
        ];
    }

    private const MOTIVO_RECEBIDO = [
        'sem_permissao' => 'Você não tem permissão para ver dados financeiros.',
        'pausa_noturna' => 'Pausa noturna do ERP (02h–05h): valor da última leitura antes da pausa.',
        'sem_acesso' => 'Sem acesso de leitura aos recebimentos do Precifica.',
        'leitura_falhou' => 'Não foi possível ler os recebimentos do Precifica agora.',
        'sem_snapshot' => 'O Precifica ainda não tem uma leitura completa de recebimentos.',
        'valor_desconhecido' => 'Há baixa com valor desconhecido no período: o total não é somado.',
        'snapshot_antigo' => 'Leitura do Precifica atrasada: valor da última leitura completa.',
    ];

    private function recebido(string $periodo): array
    {
        $x = $this->g->recebido($periodo);
        return ['fonte' => 'precifica', 'estado' => self::ESTADO[$x['estado']], 'valor' => $x['valor'], 'quantidade' => $x['quantidade'],
                'ultimo_sucesso' => $x['snapshot_em'], 'consulta_completa' => in_array($x['estado'], ['ok', 'zero_confirmado', 'desatualizado'], true),
                'lacunas' => $x['estado'] === 'parcial' ? ['valor_desconhecido'] : [],
                // CNPJ da PARCELA (regra do Walter); parcela sem CNPJ entra no total e aparece com empresa null (informação, não lacuna)
                'por_empresa' => $x['por_empresa'], 'sem_cnpj' => $x['sem_cnpj'],
                'motivo' => $x['motivo'] !== null ? self::MOTIVO_RECEBIDO[$x['motivo']] : null];
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
                    ? 'Google Calendar' . ($n !== null ? ' · ' . $n . ($n === 1 ? ' conflito hoje' : ' conflitos hoje') : '')
                    : 'Pipedrive' . ($n !== null ? ' · ' . $n . ($n === 1 ? ' negócio distinto' : ' negócios distintos') : ''),
                'ultimo_sucesso' => $x['atualizado_em'], 'motivo' => $this->motivo($fonte, $x['estado'], $this->g->fonte($fonte)),
            ] + $this->meta($fonte, $x['estado'], $n !== null, $this->lacunasFonte($this->g->fonte($fonte)));
            $itens[count($itens) - 1]['verificacao'] = $this->verificacao($itens[count($itens) - 1]);
        }
        $ver = $this->verificacaoAgregada(array_column($itens, 'verificacao'));
        // proposta da CIMA (20:0x): por FONTE exigida, o estado da consulta das prioridades dela e o rótulo pronto (Pipedrive = pior entre P1 e P2)
        $porFonte = [];
        foreach ($itens as $x) {
            $e = $this->estadoConsulta($x);
            if (!isset($porFonte[$x['fonte']]) || self::PIOR_CONSULTA[$e] > self::PIOR_CONSULTA[$porFonte[$x['fonte']]]) $porFonte[$x['fonte']] = $e;
        }
        $ver['fontes'] = array_map(fn($f, $e) => ['fonte' => $f, 'rotulo' => self::ROTULO_FONTE[$f], 'estado' => $e, 'rotulo_estado' => self::ROTULO_ESTADO[$e]],
            array_keys($porFonte), array_values($porFonte));
        return ['gerado_em' => $this->agora->format(DATE_ATOM), 'itens' => $itens, 'verificacao' => $ver,
                // "Sem pendências" SÓ de verificação completa com zero itens (parecer do mockup): nunca de ausência
                'sem_pendencias' => $ver['estado'] === 'completa' && array_sum(array_map(fn($i) => $i['quantidade'] ?? 1, $itens)) === 0];
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
        $base['verificacao'] = $this->verificacao($base + ['quantidade' => $l['total_sem_filtro']]);
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
     * Linha "Fontes e atualização" (parecer do mockup, 24/11): CONEXÃO separada da CONSULTA. Cada consulta usada na tela traz o estado do
     * RESULTADO REAL dela (o mesmo cálculo dos cartões, no mesmo período), sem as lacunas do dado; o estado da fonte é o PIOR entre as consultas
     * (ou a conexão, se ela estiver pior), com `parte_afetada`. `indicadores` continua (agora com o estado da consulta de cada indicador).
     */
    public function fontes(string $periodo = '7d'): array
    {
        return $this->fontesDe($this->resumo($periodo), $this->prioridades(), $this->agenda());
    }

    /**
     * UMA leitura para a tela inteira (decisão do Jhony, 24/11): cartões, prioridades, agenda e a linha de fontes saem do MESMO resultado —
     * a linha de fontes é derivada dos blocos desta resposta, sem consultar de novo. Chamadas separadas podiam divergir entre uma e outra
     * (o defeito do parecer) e dobravam a carga. `leitura_em` = o instante desta leitura, igual em todas as partes.
     */
    public function painel(string $periodo): array
    {
        $r = $this->resumo($periodo); $pr = $this->prioridades(); $ag = $this->agenda();
        return ['leitura_em' => $this->agora->format(DATE_ATOM), 'periodo' => $r['periodo'], 'resumo' => $r, 'prioridades' => $pr, 'agenda' => $ag,
                'fontes' => $this->fontesDe($r, $pr, $ag)];
    }

    /** Linha de fontes a partir de blocos JÁ lidos (nenhuma consulta de dado; a conexão vem da mesma leitura da fonte, em cache). */
    private function fontesDe(array $r, array $prioridades, array $agenda): array
    {
        $blocos = ['pedidos_bling' => $r['pedidos_bling'], 'negocios_ganhos' => $r['negocios_ganhos'], 'funil_aberto' => $r['funil_aberto'], 'agenda' => $agenda];
        foreach ($prioridades['itens'] as $x) $blocos[$x['id']] = $x;
        $out = [];
        foreach (self::CONSULTAS as $id => $consultas) {
            $con = $this->g->conexao($id);
            $lista = []; $inds = []; $soValor = [];
            foreach ($consultas as $cid => [$rotulo, $ids]) {
                $pior = null;
                foreach ($ids as $ind) {
                    $b = $blocos[$ind]; $e = $this->estadoConsulta($b);
                    // 116 (parecer do mockup, P1): o funil é o único bloco que ainda fica "Dados parciais" pelo DADO (negócio aberto sem valor).
                    // A linha de fontes acompanha: "Pipedrive · Dados parciais (valores do funil)", com a hora da leitura — nunca "Atualizado".
                    if ($ind === 'funil_aberto' && $e === 'ok' && $b['estado'] === 'parcial') { $e = 'parcial'; $soValor[$ind] = true; }
                    $inds[] = ['id' => $ind, 'estado' => $e];
                    if ($pior === null || self::PIOR_CONSULTA[$e] > self::PIOR_CONSULTA[$pior['e']]
                        || (self::PIOR_CONSULTA[$e] === self::PIOR_CONSULTA[$pior['e']] && ($b['ultimo_sucesso'] ?? '') < ($pior['b']['ultimo_sucesso'] ?? ''))) $pior = ['e' => $e, 'b' => $b];
                }
                $lista[] = ['id' => $cid, 'rotulo' => $rotulo, 'estado' => $pior['e'], 'ultimo_sucesso' => $pior['b']['ultimo_sucesso'],
                            'motivo' => $pior['e'] === 'ok' ? null : $pior['b']['motivo'], 'indicadores' => $ids];
            }
            $pc = null;
            foreach ($lista as $c) if ($pc === null || self::PIOR_CONSULTA[$c['estado']] > self::PIOR_CONSULTA[$pc['estado']]
                || (self::PIOR_CONSULTA[$c['estado']] === self::PIOR_CONSULTA[$pc['estado']] && ($c['ultimo_sucesso'] ?? '') < ($pc['ultimo_sucesso'] ?? ''))) $pc = $c;
            $estado = match ($pc['estado']) { 'ok' => 'conectada', 'parcial', 'desatualizado' => 'desatualizada', 'aguardando' => 'aguardando', default => 'problema' };
            // a conexão nunca fica escondida atrás de consultas "ok" (ex.: acesso que pede nova autorização com dado ainda recente)
            if ($con['estado'] === 'problema') $estado = 'problema';
            if ($con['estado'] === 'aguardando' && $estado !== 'problema') $estado = 'aguardando';
            $motivoCon = $this->motivoConexao($id, $con);
            $out[] = ['fonte' => self::FONTE_TELA[$id], 'estado' => $estado, 'ultimo_sucesso' => $pc['ultimo_sucesso'],
                'motivo' => $pc['estado'] !== 'ok' ? $pc['motivo'] : $motivoCon,
                'conexao' => ['estado' => $con['estado'], 'motivo' => $motivoCon],
                'consultas' => $lista,
                'parte_afetada' => array_values(array_map(fn($c) => $c['id'], array_filter($lista, fn($c) => $c['estado'] !== 'ok'))),
                'indicadores' => $inds,
                // proposta da CIMA (20:0x): rótulo pronto do estado da linha e os INDICADORES afetados ("Pipedrive · Com problema (funil)")
                'rotulo_estado' => $this->rotuloLinha($con, $estado, $pc['estado'], $inds),
                // cada parte com o PRÓPRIO estado (nenhuma apaga a outra); prioridades parciais = "Verificação parcial" (o texto do topo)
                'afetado' => array_values(array_map(fn($i) => ['id' => $i['id'], 'rotulo' => isset($soValor[$i['id']]) ? 'valores do funil' : self::ROTULO_IND[$i['id']], 'estado' => $i['estado'],
                    'rotulo_estado' => $this->rotuloParte($i['id'], $i['estado'])], array_filter($inds, fn($i) => $i['estado'] !== 'ok')))];
        }
        // 25/11: Precifica (recebimentos) — a ÚNICA fonte do "Recebido" (nunca o Asaas); estado = o do último snapshot utilizável
        $rc = $r['recebido'];
        if ($rc['estado'] === 'sem_permissao') return $out;   // F03: quem não tem a permissão financeira não vê nem o estado da fonte financeira
        $e = $rc['estado'] === 'zero' ? 'ok' : $rc['estado'];   // estado da CONSULTA (zero de verdade = ok)
        // linha da fonte no MESMO enum das outras: conectada · problema · aguardando · desatualizado · parcial
        $linha = ['ok' => 'conectada', 'erro' => 'problema', 'aguardando' => 'aguardando', 'desatualizado' => 'desatualizado', 'parcial' => 'parcial'][$e];
        $con = ['ok' => 'conectada', 'erro' => 'problema', 'aguardando' => 'aguardando'][$e] ?? 'conectada';
        $out[] = ['fonte' => 'precifica', 'estado' => $linha, 'rotulo_estado' => self::ROTULO_ESTADO[$e], 'ultimo_sucesso' => $rc['ultimo_sucesso'], 'motivo' => $rc['motivo'],
            'conexao' => ['estado' => $con, 'motivo' => $con === 'conectada' ? null : $rc['motivo']],
            'consultas' => [['id' => 'recebido', 'rotulo' => 'Recebimentos', 'estado' => $e, 'ultimo_sucesso' => $rc['ultimo_sucesso'], 'motivo' => $rc['motivo'], 'indicadores' => ['recebido']]],
            'parte_afetada' => $e === 'ok' ? [] : ['recebido'], 'indicadores' => [['id' => 'recebido', 'estado' => $e]],
            'afetado' => $e === 'ok' ? [] : [['id' => 'recebido', 'rotulo' => 'recebimentos', 'estado' => $e, 'rotulo_estado' => self::ROTULO_ESTADO[$e]]]];
        return $out;
    }

    /** Rótulo de uma parte afetada: a das prioridades "parcial" é "Verificação parcial" (o mesmo texto do topo das prioridades). */
    private function rotuloParte(string $ind, string $estado): string
    {
        return $estado === 'parcial' && in_array($ind, self::IND_PRIORIDADE, true) ? 'Verificação parcial' : self::ROTULO_ESTADO[$estado];
    }

    /**
     * Rótulo da LINHA de uma fonte: conexão com problema = "Com problema"; nunca conectada = "Aguardando conexão"; senão o pior estado das consultas.
     * Se a ÚNICA parte afetada são as prioridades e ela está parcial → "Verificação parcial" (parecer do mockup R3: "Google Calendar · Verificação parcial (prioridades)").
     * @param list<array{id:string, estado:string}> $inds
     */
    private function rotuloLinha(array $con, string $estado, string $pior, array $inds): string
    {
        if ($con['estado'] === 'problema') return 'Com problema';
        if ($con['estado'] === 'aguardando' && $estado === 'aguardando') return 'Aguardando conexão';
        $af = array_filter($inds, fn($i) => $i['estado'] !== 'ok');
        if ($pior === 'parcial' && $af !== [] && array_diff(array_column($af, 'id'), self::IND_PRIORIDADE) === []) return 'Verificação parcial';
        return self::ROTULO_ESTADO[$pior];
    }

    /** Estado da CONSULTA de um cartão: o estado dele sem as lacunas do DADO (zero e "dados parciais" só pelo dado = ok). */
    private function estadoConsulta(array $b): string
    {
        if ($b['estado'] === 'zero') return 'ok';
        if ($b['estado'] === 'parcial' && $b['lacunas'] !== [] && array_diff($b['lacunas'], self::LACUNA_DADO) === []) return 'ok';
        return $b['estado'];
    }

    /** Verificação de UMA prioridade: completa (leitura atual e completa + consulta ok) · parcial (há número, fonte velha/incompleta) · nao_verificada. */
    private function verificacao(array $item): array
    {
        $e = $this->estadoConsulta($item);
        $estado = $e === 'ok' && $item['consulta_completa'] === true ? 'completa' : (($item['quantidade'] ?? $item['total'] ?? null) === null ? 'nao_verificada' : 'parcial');
        $afetadas = $estado === 'completa' ? [] : [['fonte' => $item['fonte'], 'consulta' => $item['id'] === 'conflito_agenda' ? 'conflitos' : 'atividades',
                                                     'estado' => $e === 'ok' ? 'parcial' : $e, 'motivo' => $item['motivo']]];
        return ['estado' => $estado, 'fontes_afetadas' => $afetadas, 'ultima_leitura_valida' => $item['fonte_atualizada_em']];
    }

    /** @param list<array> $vs */
    private function verificacaoAgregada(array $vs): array
    {
        $est = array_column($vs, 'estado');
        $estado = $est !== [] && count(array_unique($est)) === 1 && $est[0] !== 'parcial' ? $est[0] : 'parcial';
        $datas = array_column($vs, 'ultima_leitura_valida');
        return ['estado' => $estado, 'fontes_afetadas' => array_merge(...array_column($vs, 'fontes_afetadas')),
                'ultima_leitura_valida' => in_array(null, $datas, true) || $datas === [] ? null : min($datas)];
    }

    private function motivoConexao(string $id, array $c): ?string
    {
        $nome = self::NOME[$id];
        return match ($c['estado']) {
            'conectada' => null,
            'aguardando' => $id === 'google_calendar' ? 'Nenhuma agenda Google conectada.' : "$nome sem conta conectada.",
            default => match ($c['detalhe']) {
                'escopo_ausente' => 'O acesso ao Bling não inclui os pedidos; é preciso reautorizar.',
                'reautorizar' => $id === 'google_calendar' ? 'A conta Google pede nova autorização.' : "A conta do $nome pede nova autorização.",
                'sem_conexao_banco', 'erro_leitura' => "Não foi possível ler o $nome agora.",
                default => "O acesso ao $nome precisa ser renovado.",
            },
        };
    }

    /** `aviso` pronto: só quando o cartão é "Dados parciais" APENAS pela lacuna do dado (consulta ok); senão null (o `motivo` explica). */
    private function aviso(array $b, ?string $texto): ?string
    {
        return $texto !== null && $b['estado'] === 'parcial' && $b['lacunas'] !== [] && array_diff($b['lacunas'], self::LACUNA_DADO) === [] ? $texto : null;
    }


    private function avisoValor(array $b): ?string
    {
        $sem = (int) ($b['sem_valor'] ?? 0); $fora = (int) ($b['fora_brl'] ?? 0);
        $partes = [];
        if ($sem > 0) $partes[] = $sem . ($sem === 1 ? ' negócio sem valor' : ' negócios sem valor');
        if ($fora > 0) $partes[] = $fora . ($fora === 1 ? ' negócio em outra moeda' : ' negócios em outra moeda');
        if ($partes === []) return null;
        return 'Dados parciais · ' . ($b['valor'] !== null ? 'Soma dos valores informados · ' : '') . implode(' · ', $partes);
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
        if ($f['detalhe'] === 'reautorizar' && in_array($estado, ['desatualizado', 'indisponivel'], true)) {   // decisão do Jhony (24/11)
            return "A conta do $nome pede nova autorização." . ($quando !== null ? " Última leitura completa $quando." : '');
        }
        if ($f['detalhe'] === 'escopo_ausente' && in_array($estado, ['desatualizado', 'indisponivel'], true)) {
            return 'O acesso ao Bling não inclui os pedidos; é preciso reautorizar.' . ($quando !== null ? " Última leitura completa $quando." : '');
        }
        return match ($estado) {
            'ok', 'zero_confirmado' => null,
            'aguardando_conexao' => $fonte === 'google_calendar' ? 'Nenhuma agenda Google conectada.' : "$nome sem conta conectada.",
            'desatualizado' => $quando !== null ? "Última atualização do $nome $quando." : "$nome sem atualização recente.",
            'parcial' => match (true) {
                $dado !== null && $f['estado'] === 'ok' => $dado,
                preg_match('/^calendarios_atrasados_(\d+)_de_(\d+)\z/', (string) $f['detalhe'], $m) === 1 => "{$m[1]} de {$m[2]} agendas com atualização atrasada.",
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
