<?php
// Bling / lib/BlingSituacoes.php - vocabulario de situacoes do modulo
// @module  bling.situacoes
// @version 1.0.0
// @created 2026-07-30
//
// PONTO UNICO de traducao entre codigos do Bling e o vocabulario interno (§49).
// Quando a API mudar um codigo, muda AQUI - nenhuma tela conhece codigo externo.
//
// A cor semantica mora junto da situacao de proposito: e o que impede duas telas
// de pintarem "cancelado" de cores diferentes (licao "coerencia ENTRE TELAS").
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class BlingSituacoes
{
    /** Situacoes de pedido de venda. ordem = progressao do fluxo (§21.1). */
    public const PEDIDO = [
        'rascunho'              => ['rotulo' => 'Rascunho',               'cor' => 'neutro',  'ordem' => 0],
        'aguardando_aprovacao'  => ['rotulo' => 'Aguardando aprovação',   'cor' => 'aviso',   'ordem' => 1],
        'aprovado'              => ['rotulo' => 'Aprovado',               'cor' => 'info',    'ordem' => 2],
        'faturado'              => ['rotulo' => 'Faturado',               'cor' => 'info',    'ordem' => 3],
        'nota_emitida'          => ['rotulo' => 'Nota emitida',           'cor' => 'info',    'ordem' => 4],
        'separacao'             => ['rotulo' => 'Em separação',           'cor' => 'info',    'ordem' => 5],
        'enviado'               => ['rotulo' => 'Enviado',                'cor' => 'info',    'ordem' => 6],
        'entregue'              => ['rotulo' => 'Entregue',               'cor' => 'sucesso', 'ordem' => 7],
        'cancelado'             => ['rotulo' => 'Cancelado',              'cor' => 'erro',    'ordem' => 90],
        'devolvido'             => ['rotulo' => 'Devolvido',              'cor' => 'erro',    'ordem' => 91],
    ];

    /** Situacoes de nota fiscal (§30.1). */
    public const NOTA = [
        'pendente'    => ['rotulo' => 'Pendente',    'cor' => 'aviso',   'ordem' => 0],
        'processando' => ['rotulo' => 'Processando', 'cor' => 'info',    'ordem' => 1],
        'autorizada'  => ['rotulo' => 'Autorizada',  'cor' => 'sucesso', 'ordem' => 2],
        'rejeitada'   => ['rotulo' => 'Rejeitada',   'cor' => 'erro',    'ordem' => 90],
        'cancelada'   => ['rotulo' => 'Cancelada',   'cor' => 'neutro',  'ordem' => 91],
        'inutilizada' => ['rotulo' => 'Inutilizada', 'cor' => 'neutro',  'ordem' => 92],
    ];

    /** Situacoes de titulo financeiro (§32, §33). */
    public const TITULO = [
        'aberto'     => ['rotulo' => 'Em aberto',  'cor' => 'info',    'ordem' => 0],
        'parcial'    => ['rotulo' => 'Parcial',    'cor' => 'aviso',   'ordem' => 1],
        'liquidado'  => ['rotulo' => 'Liquidado',  'cor' => 'sucesso', 'ordem' => 2],
        'vencido'    => ['rotulo' => 'Vencido',    'cor' => 'erro',    'ordem' => 3],
        'cancelado'  => ['rotulo' => 'Cancelado',  'cor' => 'neutro',  'ordem' => 90],
    ];

    /** Situacoes de pedido de compra (§27.3). */
    public const COMPRA = [
        'solicitado'          => ['rotulo' => 'Solicitado',            'cor' => 'neutro',  'ordem' => 0],
        'cotacao'             => ['rotulo' => 'Em cotação',            'cor' => 'neutro',  'ordem' => 1],
        'aprovado'            => ['rotulo' => 'Aprovado',              'cor' => 'info',    'ordem' => 2],
        'enviado_fornecedor'  => ['rotulo' => 'Enviado ao fornecedor', 'cor' => 'info',    'ordem' => 3],
        'recebido_parcial'    => ['rotulo' => 'Recebido parcial',      'cor' => 'aviso',   'ordem' => 4],
        'recebido'            => ['rotulo' => 'Recebido',              'cor' => 'sucesso', 'ordem' => 5],
        'cancelado'           => ['rotulo' => 'Cancelado',             'cor' => 'erro',    'ordem' => 90],
    ];

    /** Situacoes de expedicao (§39). */
    public const ENVIO = [
        'aguardando_separacao' => ['rotulo' => 'Aguardando separação', 'cor' => 'aviso',   'ordem' => 0],
        'separado'             => ['rotulo' => 'Separado',             'cor' => 'info',    'ordem' => 1],
        'despachado'           => ['rotulo' => 'Despachado',           'cor' => 'info',    'ordem' => 2],
        'em_transito'          => ['rotulo' => 'Em trânsito',          'cor' => 'info',    'ordem' => 3],
        'entregue'             => ['rotulo' => 'Entregue',             'cor' => 'sucesso', 'ordem' => 4],
        'atrasado'             => ['rotulo' => 'Atrasado',             'cor' => 'erro',    'ordem' => 90],
        'devolvido'            => ['rotulo' => 'Devolvido',            'cor' => 'erro',    'ordem' => 91],
        'extraviado'           => ['rotulo' => 'Extraviado',           'cor' => 'erro',    'ordem' => 92],
    ];

    /** Estados de saude operacional (§15). */
    public const SAUDE = [
        'saudavel'      => ['rotulo' => 'Saudável',      'cor' => 'sucesso'],
        'atencao'       => ['rotulo' => 'Atenção',       'cor' => 'aviso'],
        'degradado'     => ['rotulo' => 'Degradado',     'cor' => 'erro'],
        'indisponivel'  => ['rotulo' => 'Indisponível',  'cor' => 'erro'],
        'desatualizado' => ['rotulo' => 'Desatualizado', 'cor' => 'aviso'],
    ];

    /** Estados da conexao exibidos no header (§8.4). */
    public const CONEXAO = [
        'conectado'      => ['rotulo' => 'Conectado',              'cor' => 'sucesso'],
        'sincronizando'  => ['rotulo' => 'Sincronizando',          'cor' => 'info'],
        'atencao'        => ['rotulo' => 'Atenção',                'cor' => 'aviso'],
        'erro'           => ['rotulo' => 'Erro',                   'cor' => 'erro'],
        'desatualizado'  => ['rotulo' => 'Dados desatualizados',   'cor' => 'aviso'],
        'mock'           => ['rotulo' => 'Demonstração',           'cor' => 'info'],
        'token_expirado' => ['rotulo' => 'Token expirado',         'cor' => 'erro'],
        'nao_configurado'=> ['rotulo' => 'Não configurado',        'cor' => 'neutro'],
        'sync_parcial'   => ['rotulo' => 'Sincronização parcial',  'cor' => 'aviso'],
        'manutencao'     => ['rotulo' => 'Em manutenção',          'cor' => 'neutro'],
    ];

    /** Severidades de alerta (§16), em ordem de prioridade do badge (§8.3). */
    public const SEVERIDADE = ['critica', 'alta', 'media', 'baixa', 'informativa'];

    /**
     * Descreve uma situacao para o front-end.
     * Nunca devolve null: uma situacao desconhecida vira um rotulo neutro visivel,
     * porque situacao nova da API nao pode quebrar tela nem sumir silenciosamente.
     */
    public static function descrever(string $dominio, string $chave): array
    {
        $mapa = match ($dominio) {
            'pedido' => self::PEDIDO,
            'nota'   => self::NOTA,
            'titulo' => self::TITULO,
            'compra' => self::COMPRA,
            'envio'  => self::ENVIO,
            'saude'  => self::SAUDE,
            'conexao'=> self::CONEXAO,
            default  => [],
        };

        if (isset($mapa[$chave])) {
            return array_merge(['chave' => $chave], $mapa[$chave]);
        }

        return [
            'chave'         => $chave,
            'rotulo'        => $chave === '' ? '—' : ucfirst(str_replace('_', ' ', $chave)),
            'cor'           => 'neutro',
            'ordem'         => 999,
            'desconhecida'  => true,
        ];
    }

    /** Lista completa de um dominio, ja ordenada - alimenta filtros e funis. */
    public static function listar(string $dominio): array
    {
        $mapa = match ($dominio) {
            'pedido' => self::PEDIDO,
            'nota'   => self::NOTA,
            'titulo' => self::TITULO,
            'compra' => self::COMPRA,
            'envio'  => self::ENVIO,
            default  => [],
        };

        $saida = [];
        foreach ($mapa as $chave => $info) {
            $saida[] = array_merge(['chave' => $chave], $info);
        }
        usort($saida, static fn($a, $b) => $a['ordem'] <=> $b['ordem']);
        return $saida;
    }
}
