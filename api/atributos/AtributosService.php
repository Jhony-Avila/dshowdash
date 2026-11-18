<?php
// /api/atributos/AtributosService.php (porte 18/11 de atr/ponte-app 693c70c6) — Equipamentos › Atributos (Fase B PREPARADA no clone, 31/10/2026; app-dshow DP-AUTO.37).
// Regras do domínio, independentes de HTTP e de banco (testáveis com repositório em memória):
//  - permissões: CONSULTAR nível ≥ 50 · PREENCHER VALORES nível ≥ 50 · ADMINISTRAR definições/grupos/opções/unidades nível ≥ 80;
//  - versão de edição (`versao`): editar com versão antiga → 409 CONFLICT (ninguém sobrescreve o trabalho do outro em silêncio);
//  - nada é apagado: desativar atributo/opção/grupo; valor "removido" = estado `desconhecido`/`excluido_em`;
//  - mudar o TIPO de atributo com valores preenchidos → 409 (exige migração explícita); opção desativada continua nos valores antigos;
//  - auditoria de toda escrita (usuário, ação, entidade, antes/depois resumido, motivo) NA MESMA TRANSAÇÃO da gravação (Etapa 7:
//    auditoria que falha desfaz a gravação — nunca fica escrita sem auditoria);
//  - produto validado contra o CATÁLOGO (porta CatalogoProdutos; E7-D1): inexistente/excluído/inativo é recusado; só atributos da
//    FICHA APLICÁVEL (grupos ativos cujo escopo casa categoria/subcategoria do produto) recebem valor (Etapa 7, briefing §2.1–2.2).
declare(strict_types=1);

final class AtributosErro extends RuntimeException
{
    public function __construct(public readonly string $codigo, public readonly int $http, string $mensagem, public readonly array $campos = [])
    {
        parent::__construct($mensagem);
    }
}

/** Catálogo de produtos (projeção do Precifica no app; GRANT N1 = 7 colunas). Lança CatalogoIndisponivel se não puder ler. */
require_once __DIR__ . '/Aplicabilidade.php';
require_once __DIR__ . '/DecimalExato.php';

interface CatalogoProdutos
{
    /** @return array{id:int,nome:string,categoria:string,subcategoria:?string,ativo:bool,excluido:bool,sincronizado_em:?string}|null */
    public function produto(int $id): ?array;
    /** Busca por nome ou id (≤ $limite), só não excluídos. */
    public function buscar(?string $q, int $limite): array;
    /** Pares (categoria, subcategoria) existentes no catálogo, com contagem de produtos não excluídos. */
    public function categorias(): array;
    /** Produtos não excluídos no escopo (subcategoria '' = categoria inteira). */
    public function contar(string $categoria, string $subcategoria): int;
    /** Ficha do Precifica (cache do app) de UMA família do produto, ou null se indisponível/sem leitura (D3.6). */
    public function specs(int $productId, string $kind): ?array;
}

final class CatalogoIndisponivel extends RuntimeException {}

interface AtributosRepositorio
{
    /** Executa $f numa transação (gravação + auditoria atômicas); reentrante (dentro de outra transação só executa). */
    public function transacao(callable $f): mixed;
    /** Grupos ATIVOS com escopo que casa (categoria, subcategoria '' ou igual), ordem nome, id. Cada um com 'escopo' casado. */
    public function gruposAplicaveis(string $categoria, ?string $subcategoria): array;
    public function vinculosLegado(int $productId): array;
    public function listarAtributos(?string $busca, ?string $tipo, bool $incluirInativos): array;
    public function atributo(int $id): ?array;
    public function codigoExiste(string $codigo, ?int $excetoId): bool;
    public function criarAtributo(array $d): int;
    public function atualizarAtributo(int $id, int $versao, array $d): bool;
    /** $travar = leitura com trava compartilhada (dentro da transação; P1-09: ninguém insere o 1º valor enquanto o tipo muda). */
    public function contarValores(int $atributoId, bool $travar = false): int;
    /** V5 Lote 3 (P1-09): relê a definição COM trava — exclusiva (alterar a definição) ou compartilhada (gravar valor). Dentro da transação. */
    public function travarAtributo(int $id, bool $exclusivo): ?array;
    /** V5 Lote 3 (P1-07): TODAS as linhas (vivas e excluídas) do (produto, atributo), travadas para escrita. Dentro da transação. */
    public function travarValores(int $productId, int $atributoId): array;
    /** V5 Lote 3 (P1-07): exclusão LÓGICA de uma linha viva (excluido_em, versão + 1). Nada é apagado. */
    public function excluirValor(int $productId, int $atributoId, int $opcaoChave): bool;
    public function opcoes(int $atributoId): array;
    public function criarOpcao(int $atributoId, string $rotulo, int $posicao): int;
    public function definirOpcaoAtiva(int $opcaoId, bool $ativo): bool;
    public function opcao(int $id): ?array;
    public function unidades(): array;
    public function criarUnidade(string $simbolo, string $nome, ?string $grandeza): int;
    public function grupos(): array;
    public function grupo(int $id): ?array;
    public function criarGrupo(string $nome): int;
    public function atualizarGrupo(int $id, int $versao, array $d): bool;
    public function definirEscopo(int $grupoId, array $escopos): void;
    public function definirAtributosDoGrupo(int $grupoId, array $itens): void;
    /** Retrato do modelo para a regra da ficha (§9, Aplicabilidade). */
    public function retratoModelo(?int $productId = null): RetratoModelo;
    /** A8: ids das unidades permitidas além da regra da grandeza. */
    public function unidadesExtras(int $atributoId): array;
    public function definirUnidadesExtras(int $atributoId, array $unidades, string $usuario): void;
    public function valoresDoProduto(int $productId): array;
    public function valor(int $productId, int $atributoId, int $opcaoChave): ?array;
    public function gravarValor(array $d, ?int $versaoEsperada): bool;
    public function auditar(string $usuario, string $acao, string $entidade, string $entidadeId, ?array $antes, ?array $depois, ?string $motivo): void;
    public function unidade(int $id): ?array;
    public function atualizarUnidade(int $id, array $d): bool;
    public function precificaRefExiste(string $ref, ?int $excetoId): bool;
    public function auditoria(string $entidade, string $entidadeId, int $limite): array;
    /** V4/R1: última revisão da ficha do produto (acao 'revisar', entidade 'ficha') — ['usuario','criado_em','depois'(array)] ou null. */
    public function ultimaRevisao(int $productId): ?array;
    public function removerValorOpcao(int $productId, int $atributoId, int $opcaoId, int $versao): bool;
    /** 04/11 (app, Etapa 2): troca o rótulo SE ainda for $rotuloAtual (concorrência sem coluna de versão). */
    public function renomearOpcao(int $opcaoId, string $rotulo, string $rotuloAtual): bool;
    /** 04/11 (app, Etapa 2): posição de uma opção do atributo (dentro da transação de reordenarOpcoes). */
    public function definirPosicaoOpcao(int $opcaoId, int $atributoId, int $posicao): bool;
}

final class AtributosService
{
    public const NIVEL_CONSULTA = 50;
    public const NIVEL_VALORES = 80;   // ATRIBUTOS-WEB 18/11 (Jhony): preencher/editar valores só com nível ≥ 80 (era 50 no ramo de origem)
    public const NIVEL_ADMIN = 80;
    public const TIPOS = ['texto', 'numero', 'inteiro', 'booleano', 'opcao', 'multiopcao', 'data'];
    /** Famílias da ficha do Precifica no app (produtos.md v1.1, specs.ts FAMILIES) — alvo de precifica_ref (D3.6). */
    public const FAMILIAS_PRECIFICA = ['led_module', 'panel_mounted', 'processor', 'sending_card', 'player', 'metal_work'];

    /** $administra (decisão do Jhony 18/11; AtributosPermissoes): null = só pelo nível (cargas e testes antigos); a API passa o valor real. */
    public function __construct(private readonly AtributosRepositorio $repo, private readonly int $nivel, private readonly string $usuario, private readonly ?CatalogoProdutos $catalogo = null,
        private readonly ?bool $administra = null) {}

    /** Administra o catálogo (kits, dicionário, unidades, vínculos, massa)? Nível ≥ 80 E (75 ou permissão explícita). */
    public function podeAdministrar(): bool { return $this->nivel >= self::NIVEL_ADMIN && ($this->administra ?? true); }

    private function exigirAdmin(): void
    {
        $this->exigir(self::NIVEL_ADMIN);
        if (!$this->podeAdministrar()) throw new AtributosErro('NOT_CATALOG_ADMIN', 403, 'Só quem administra o catálogo de atributos pode fazer isto. Você pode preencher valores.');
    }

    /** Produto do catálogo (null = inexistente). Catálogo ausente/ilegível → 503 (nunca disfarçado de "não encontrado"). */
    private function produtoDoCatalogo(int $pid): ?array
    {
        if ($this->catalogo === null) throw new AtributosErro('CATALOG_UNAVAILABLE', 503, 'Catálogo de produtos indisponível.');
        try { return $this->catalogo->produto($pid); }
        catch (CatalogoIndisponivel $e) { throw new AtributosErro('CATALOG_UNAVAILABLE', 503, 'Catálogo de produtos indisponível.'); }
    }

    /** DSHOW-049 (3): o atributo já está na ficha aplicável do produto (kit, escopo, avulso)? Produto fora do catálogo → false. */
    public function naFicha(int $pid, int $aid): bool
    {
        $produto = $this->produtoDoCatalogo($pid);
        return $produto !== null && empty($produto['excluido']) && isset($this->aplicaveis($produto)[$aid]);
    }

    /**
     * D4 (V5; app-dshow produtos.md v1.4.1 — o Node reproduz exatamente, provado pela massa dourada golden-ficha): atributos da ficha
     * aplicável [atributo_id => [grupo, item do grupo, definição]]. Grupos na ordem nome, id; itens na ordem posicao, atributo_id; só
     * atributos ativos; GRUPO e POSIÇÃO = 1ª ocorrência; obrigatório e visível = OU entre TODAS as ocorrências aplicáveis.
     */
    private function aplicaveis(array $produto): array
    {
        // Missão §9: regra única em Aplicabilidade (escopo + aplica_a_todos + kit direto + avulsos − exclusões). Mantém o formato antigo.
        $out = [];
        foreach (Aplicabilidade::ficha($this->repo->retratoModelo((int) $produto['id']), $produto) as $aid => $x) {
            $def = $this->repo->atributo($aid);
            if (!$def) continue;
            $escopo = null;
            foreach ($x['origens'] as $o) foreach ($o['motivos'] ?? [] as $mt) if ($mt['tipo'] === 'escopo' && $escopo === null) $escopo = $mt;
            $out[$aid] = [
                'grupo' => ['id' => $x['grupo_id'], 'nome' => $x['grupo_nome'], 'escopo_categoria' => $escopo['categoria'] ?? null, 'escopo_subcategoria' => $escopo['subcategoria'] ?? null],
                'item' => ['obrigatorio' => (int) $x['obrigatorio'], 'visivel' => (int) $x['visivel'], 'posicao' => $x['posicao']],
                'def' => $def, 'aplic' => $x,
            ];
        }
        return $out;
    }

    private function exigir(int $min): void
    {
        if ($this->nivel < $min) throw new AtributosErro('INSUFFICIENT_LEVEL', 403, 'Seu nível não permite esta ação.');
    }

    private static function texto(mixed $v, int $max, string $campo, bool $obrigatorio, array &$erros): ?string
    {
        if ($v === null || (is_string($v) && trim($v) === '')) { if ($obrigatorio) $erros[] = $campo; return null; }
        if (!is_string($v)) { $erros[] = $campo; return null; }
        $t = trim($v);
        if (mb_strlen($t) > $max) { $erros[] = $campo; return null; }
        return $t;
    }

    // ---- consulta ---------------------------------------------------------------------------------------------------------
    public function listar(array $q): array
    {
        $this->exigir(self::NIVEL_CONSULTA);
        $tipo = isset($q['tipo']) && in_array($q['tipo'], self::TIPOS, true) ? $q['tipo'] : null;
        $busca = isset($q['q']) && is_string($q['q']) && trim($q['q']) !== '' ? mb_substr(trim($q['q']), 0, 80) : null;
        return ['atributos' => $this->repo->listarAtributos($busca, $tipo, ($q['inativos'] ?? '') === '1'), 'pode_administrar' => $this->podeAdministrar()];
    }

    public function detalhe(int $id): array
    {
        $this->exigir(self::NIVEL_CONSULTA);
        $a = $this->repo->atributo($id) ?? throw new AtributosErro('NOT_FOUND', 404, 'Atributo não encontrado.');
        if (array_key_exists('legado_id', $a) && $a['legado_id'] !== null) $a['legado_id'] = (string) $a['legado_id'];   // P2-01: BIGINT legado sempre texto no JSON
        return ['atributo' => $a, 'opcoes' => $this->repo->opcoes($id), 'valores_preenchidos' => $this->repo->contarValores($id), 'pode_administrar' => $this->podeAdministrar(),
            'auditoria' => $this->nivel >= self::NIVEL_ADMIN ? $this->repo->auditoria('atributo', (string) $id, 20) : []];
    }

    // ---- definição --------------------------------------------------------------------------------------------------------
    public function salvarAtributo(array $b): array
    {
        $this->exigirAdmin();
        $erros = [];
        $id = isset($b['id']) ? (int) $b['id'] : 0;
        $rotulo = self::texto($b['rotulo'] ?? null, 128, 'rotulo', $id === 0, $erros);
        // Regra 13 (missão): o código é CONTRATO com o app — gerado na criação (se não vier) e NUNCA alterado na edição.
        if ($id === 0 && (!isset($b['codigo']) || $b['codigo'] === '' || $b['codigo'] === null) && is_string($b['rotulo'] ?? null)) $b['codigo'] = $this->gerarCodigo((string) $b['rotulo']);
        if ($id !== 0 && isset($b['codigo']) && ($atualCod = $this->repo->atributo($id)) && $b['codigo'] !== $atualCod['codigo']) $erros[] = 'codigo';
        $codigo = $id === 0 ? self::texto($b['codigo'] ?? null, 64, 'codigo', true, $erros) : null;
        if ($codigo !== null && !preg_match('/^[a-z][a-z0-9_]{1,63}$/', $codigo)) $erros[] = 'codigo';
        $imp = array_key_exists('importancia_padrao', $b) ? ($b['importancia_padrao'] === '' ? null : $b['importancia_padrao']) : false;   // A3
        if ($imp !== false && $imp !== null && !in_array($imp, Aplicabilidade::IMPORTANCIAS, true)) $erros[] = 'importancia_padrao';
        $tipo = $b['tipo'] ?? null;
        if (($id === 0 || $tipo !== null) && !in_array($tipo, self::TIPOS, true)) $erros[] = 'tipo';
        $casas = isset($b['casas']) && $b['casas'] !== '' && $b['casas'] !== null ? (int) $b['casas'] : null;
        if ($casas !== null && ($casas < 0 || $casas > 6)) $erros[] = 'casas';
        // P2-01: limites como DECIMAL em texto (nunca float); P2-02: comparados também contra o valor resultante (abaixo, na transação)
        $min = null; if (isset($b['minimo']) && $b['minimo'] !== '') { $min = self::decimalCanonico($b['minimo']); if ($min === null) $erros[] = 'minimo'; }
        $max = null; if (isset($b['maximo']) && $b['maximo'] !== '') { $max = self::decimalCanonico($b['maximo']); if ($max === null) $erros[] = 'maximo'; }
        if ($min !== null && $max !== null && self::comparar($min, $max) > 0) $erros[] = 'maximo';
        // P2-02: null ou '' EXPLÍCITO num opcional, na edição, LIMPA o campo (SET NULL); ausência da chave = não mexe
        $limpar = [];
        if ($id !== 0) foreach (['casas', 'minimo', 'maximo', 'descricao', 'unidade_id'] as $k) if (array_key_exists($k, $b) && ($b[$k] === null || $b[$k] === '')) $limpar[] = $k;
        $descricao = self::texto($b['descricao'] ?? null, 500, 'descricao', false, $erros);
        $unidade = isset($b['unidade_id']) && $b['unidade_id'] !== '' && $b['unidade_id'] !== null ? (int) $b['unidade_id'] : null;
        if ($unidade !== null) {   // unidade padrão só em número/inteiro, e só unidade existente e ativa
            $tipoEf = $tipo ?? ($id !== 0 ? ($this->repo->atributo($id)['tipo'] ?? null) : null);
            $uRow = $this->repo->unidade($unidade);
            if (!in_array($tipoEf, ['numero', 'inteiro'], true) || !$uRow || !(int) ($uRow['ativo'] ?? 1)) $erros[] = 'unidade_id';
        }
        // D3.6 — autoridade: 'local' (padrão) ou 'precifica' (o valor vale da ficha do Precifica; o local fica só leitura).
        $autoridade = $b['autoridade'] ?? null;
        if ($autoridade !== null && !in_array($autoridade, ['local', 'precifica'], true)) $erros[] = 'autoridade';
        $ref = isset($b['precifica_ref']) && $b['precifica_ref'] !== '' ? (string) $b['precifica_ref'] : null;
        if ($ref !== null && (!preg_match('/^([a-z_]+)\.([a-z_]{1,48})$/', $ref, $mm) || !in_array($mm[1], self::FAMILIAS_PRECIFICA, true))) $erros[] = 'precifica_ref';
        if ($autoridade === 'precifica' && $ref === null) $erros[] = 'precifica_ref';
        // 3.7 (04/11, Jhony + arquiteto; migração 003): "não se aplica" só é estado válido quando o atributo aceita (padrão 1 = comportamento anterior)
        $aceita = array_key_exists('aceita_nao_se_aplica', $b) ? $b['aceita_nao_se_aplica'] : null;
        if ($aceita !== null && !is_bool($aceita) && !in_array($aceita, [0, 1, '0', '1'], true)) $erros[] = 'aceita_nao_se_aplica';
        if ($erros) throw new AtributosErro('VALIDATION_ERROR', 422, 'Campos inválidos.', array_values(array_unique($erros)));
        if ($ref !== null && $this->repo->precificaRefExiste($ref, $id ?: null)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Outro atributo já aponta para este campo do Precifica.', ['precifica_ref']);
        if ($codigo !== null && $this->repo->codigoExiste($codigo, $id ?: null)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Código já usado.', ['codigo']);
        $dados = array_filter(['rotulo' => $rotulo, 'codigo' => $codigo, 'tipo' => $tipo, 'casas' => $casas, 'minimo' => $min, 'maximo' => $max, 'descricao' => $descricao, 'unidade_id' => $unidade,
            'autoridade' => $autoridade, 'precifica_ref' => $ref, 'aceita_nao_se_aplica' => $aceita === null ? null : ((bool) (int) $aceita ? 1 : 0)], static fn($v) => $v !== null);
        foreach ($limpar as $k) $dados[$k] = null;
        if ($imp !== false) $dados['importancia_padrao'] = $imp;
        if ($id === 0) {
            $novo = $this->repo->transacao(function () use ($dados, $b) {
                $novo = $this->repo->criarAtributo($dados);
                $this->repo->auditar($this->usuario, 'criar', 'atributo', (string) $novo, null, $dados, $b['motivo'] ?? null);
                return $novo;
            });
            return ['atributo' => $this->repo->atributo($novo)];
        }
        if ($this->repo->atributo($id) === null) throw new AtributosErro('NOT_FOUND', 404, 'Atributo não encontrado.');
        $versao = (int) ($b['versao'] ?? 0);
        // P1-09: definição relida COM TRAVA EXCLUSIVA e valores contados COM TRAVA, tudo DENTRO da transação — o 1º valor gravado por outra
        // pessoa entre a checagem e a alteração bloqueia a mudança de tipo (antes a contagem ficava fora e a janela existia).
        $this->repo->transacao(function () use ($id, $versao, $dados, $b) {
            $antes = $this->repo->travarAtributo($id, true) ?? throw new AtributosErro('NOT_FOUND', 404, 'Atributo não encontrado.');
            $preenchidos = $this->repo->contarValores($id, true);
            if (isset($dados['tipo']) && $dados['tipo'] !== $antes['tipo'] && $preenchidos > 0) {
                throw new AtributosErro('TYPE_CHANGE_BLOCKED', 409, "O atributo já tem $preenchidos valor(es) preenchido(s); mudar o tipo exige uma migração revisada.");
            }
            if (array_key_exists('unidade_id', $dados) && (int) ($dados['unidade_id'] ?? 0) !== (int) ($antes['unidade_id'] ?? 0) && $preenchidos > 0) {
                // A unidade NÃO converte valores: mudar com valores preenchidos exige motivo (fica na auditoria) — briefing C5/C7.
                $mot = isset($b['motivo']) && is_string($b['motivo']) ? trim($b['motivo']) : '';
                if (mb_strlen($mot) < 5) throw new AtributosErro('UNIT_CHANGE_REQUIRES_REASON', 422, "Há $preenchidos valor(es) preenchido(s): mudar a unidade NÃO converte nada. Informe o motivo.", ['motivo']);
            }
            // P2-02: mínimo × máximo conferidos contra o valor RESULTANTE (o que veio + o que já estava gravado)
            $rMin = array_key_exists('minimo', $dados) ? $dados['minimo'] : ($antes['minimo'] === null ? null : self::decimalCanonico($antes['minimo']));
            $rMax = array_key_exists('maximo', $dados) ? $dados['maximo'] : ($antes['maximo'] === null ? null : self::decimalCanonico($antes['maximo']));
            if ($rMin !== null && $rMax !== null && self::comparar($rMin, $rMax) > 0) throw new AtributosErro('VALIDATION_ERROR', 422, 'O mínimo ficaria maior que o máximo.', ['minimo', 'maximo']);
            if (!$this->repo->atualizarAtributo($id, $versao, $dados)) throw new AtributosErro('CONFLICT', 409, 'Outra pessoa alterou este atributo. Recarregue e tente de novo.');
            $this->repo->auditar($this->usuario, 'editar', 'atributo', (string) $id, $antes, $dados, $b['motivo'] ?? null);
        });
        return ['atributo' => $this->repo->atributo($id)];
    }

    /** Código estável gerado do rótulo: slug_sem_acento + sufixo numérico único (padrão do legado: <slug>_<n>). */
    private function gerarCodigo(string $rotulo): string
    {
        $slug = strtolower(trim((string) preg_replace('/[^a-z0-9]+/i', '_', (string) iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $rotulo)), '_')) ?: 'atributo';
        if (!preg_match('/^[a-z]/', $slug)) $slug = 'a_' . $slug;
        $slug = substr($slug, 0, 52);
        for ($n = 1; $n < 100000; $n++) { $c = $slug . '_n' . $n; if (!$this->repo->codigoExiste($c, null)) return $c; }
        throw new AtributosErro('VALIDATION_ERROR', 422, 'Não foi possível gerar o código.', ['codigo']);
    }

    /** A8: unidades permitidas além da regra da grandeza (diferença, exclusão lógica). */
    public function definirUnidadesPermitidas(array $b): array
    {
        $this->exigirAdmin();
        $aid = (int) ($b['atributo_id'] ?? 0);
        $a = $this->repo->atributo($aid) ?? throw new AtributosErro('NOT_FOUND', 404, 'Atributo não encontrado.');
        if (!in_array($a['tipo'], ['numero', 'inteiro'], true)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Só atributos numéricos têm unidade.', ['atributo_id']);
        $quero = array_values(array_unique(array_map('intval', (array) ($b['unidades'] ?? []))));
        foreach ($quero as $u) if (!$this->repo->unidade($u)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Unidade inexistente.', ['unidades']);
        // DSHOW-045: substituir a lista inteira exige a lista ANTERIOR que a tela viu (versão do conjunto), conferida sob trava
        $esperado = self::listaIds($b['unidades_antes'] ?? null, 'unidades_antes'); sort($esperado);
        $this->repo->transacao(function () use ($aid, $quero, $esperado, $b) {
            if (!$this->repo->travarAtributo($aid, true)) throw new AtributosErro('NOT_FOUND', 404, 'Atributo não encontrado.');
            $antes = array_map('intval', $this->repo->unidadesExtras($aid)); sort($antes);
            if ($antes !== $esperado) throw new AtributosErro('CONFLICT', 409, 'Outra pessoa alterou as unidades permitidas deste atributo. Recarregue e tente de novo.');
            $q = $quero; sort($q);
            if ($q === $antes) return;   // sem mudança: nem gravação nem auditoria
            $this->repo->definirUnidadesExtras($aid, $quero, $this->usuario);
            $this->repo->auditar($this->usuario, 'unidades_permitidas', 'atributo', (string) $aid, ['unidades' => $antes], ['unidades' => $quero], $b['motivo'] ?? null);
        });
        return ['unidades' => $this->repo->unidadesExtras($aid)];
    }

    public function definirAtivo(int $id, bool $ativo, int $versao, ?string $motivo): array
    {
        $this->exigirAdmin();
        $antes = $this->repo->atributo($id) ?? throw new AtributosErro('NOT_FOUND', 404, 'Atributo não encontrado.');
        $this->repo->transacao(function () use ($id, $versao, $ativo, $antes, $motivo) {
            if (!$this->repo->atualizarAtributo($id, $versao, ['ativo' => $ativo ? 1 : 0])) throw new AtributosErro('CONFLICT', 409, 'Outra pessoa alterou este atributo. Recarregue e tente de novo.');
            $this->repo->auditar($this->usuario, $ativo ? 'reativar' : 'desativar', 'atributo', (string) $id, ['ativo' => $antes['ativo']], ['ativo' => $ativo ? 1 : 0], $motivo);
        });
        return ['atributo' => $this->repo->atributo($id)];
    }

    public function adicionarOpcao(int $atributoId, mixed $rotulo): array
    {
        $this->exigirAdmin();
        $a = $this->repo->atributo($atributoId) ?? throw new AtributosErro('NOT_FOUND', 404, 'Atributo não encontrado.');
        if (!in_array($a['tipo'], ['opcao', 'multiopcao'], true)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Só atributos de opção têm lista.', ['tipo']);
        $erros = [];
        $r = self::texto($rotulo, 160, 'rotulo', true, $erros);
        if ($erros) throw new AtributosErro('VALIDATION_ERROR', 422, 'Rótulo inválido.', $erros);
        foreach ($this->repo->opcoes($atributoId) as $o) if (mb_strtolower($o['rotulo']) === mb_strtolower((string) $r)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Opção já existe.', ['rotulo']);
        $this->repo->transacao(function () use ($atributoId, $r) {
            $id = $this->repo->criarOpcao($atributoId, (string) $r, count($this->repo->opcoes($atributoId)));
            $this->repo->auditar($this->usuario, 'criar', 'opcao', (string) $id, null, ['atributo_id' => $atributoId, 'rotulo' => $r], null);
        });
        return ['opcoes' => $this->repo->opcoes($atributoId)];
    }

    /**
     * Atributos no app (04/11, B6 Etapa 2): edita o RÓTULO de uma opção. Sem coluna de versão em eq_opcao (nenhuma migração para isso):
     * a concorrência é conferida pelo rótulo ATUAL que o cliente viu (`rotulo_atual`; diferente → 409). Os valores apontam para o id da
     * opção, então o rótulo novo vale em todos os produtos (o app avisa). Mesmo nome de outra opção do atributo (sem caixa) → 422.
     */
    public function renomearOpcao(int $opcaoId, mixed $rotulo, mixed $rotuloAtual): array
    {
        $this->exigirAdmin();
        $o = $this->repo->opcao($opcaoId) ?? throw new AtributosErro('NOT_FOUND', 404, 'Opção não encontrada.');
        $erros = [];
        $r = self::texto($rotulo, 160, 'rotulo', true, $erros);
        if (!is_string($rotuloAtual)) $erros[] = 'rotulo_atual';
        if ($erros) throw new AtributosErro('VALIDATION_ERROR', 422, 'Rótulo inválido.', $erros);
        if ($rotuloAtual !== $o['rotulo']) throw new AtributosErro('CONFLICT', 409, 'Outra pessoa alterou esta opção. Recarregue e tente de novo.');
        if ($r === $o['rotulo']) return ['opcoes' => $this->repo->opcoes((int) $o['atributo_id'])];   // sem mudança: nem auditoria
        foreach ($this->repo->opcoes((int) $o['atributo_id']) as $x) if ((int) $x['id'] !== $opcaoId && mb_strtolower($x['rotulo']) === mb_strtolower((string) $r)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Opção já existe.', ['rotulo']);
        $this->repo->transacao(function () use ($opcaoId, $r, $o) {
            if (!$this->repo->renomearOpcao($opcaoId, (string) $r, (string) $o['rotulo'])) throw new AtributosErro('CONFLICT', 409, 'Outra pessoa alterou esta opção. Recarregue e tente de novo.');
            $this->repo->auditar($this->usuario, 'renomear', 'opcao', (string) $opcaoId, ['rotulo' => $o['rotulo']], ['rotulo' => $r], null);
        });
        return ['opcoes' => $this->repo->opcoes((int) $o['atributo_id'])];
    }

    /**
     * Atributos no app (04/11, B6 Etapa 2): REORDENA as opções de um atributo (eq_opcao.posicao). `ordem` = TODOS os ids das opções do
     * atributo (ativas e inativas), cada um uma vez; conjunto diferente do atual (alguém criou/removeu opção) → 409. Auditoria antes/depois.
     */
    /** DSHOW-045: lista de ids inteiros positivos (a "versão do conjunto" enviada pela tela). Ausente → 422. */
    private static function listaIds(mixed $v, string $campo): array
    {
        if (!is_array($v) || !array_is_list($v) || count($v) > 500) throw new AtributosErro('VALIDATION_ERROR', 422, 'Falta a lista anterior (versão do conjunto). Recarregue.', [$campo]);
        $out = [];
        foreach ($v as $x) { $i = is_int($x) ? $x : (is_string($x) && preg_match('/^[1-9][0-9]{0,9}$/', $x) ? (int) $x : 0); if ($i <= 0) throw new AtributosErro('VALIDATION_ERROR', 422, 'Lista anterior inválida.', [$campo]); $out[] = $i; }
        return $out;
    }

    public function reordenarOpcoes(int $atributoId, mixed $ordem, mixed $ordemAntes = null): array
    {
        $this->exigirAdmin();
        $a = $this->repo->atributo($atributoId) ?? throw new AtributosErro('NOT_FOUND', 404, 'Atributo não encontrado.');
        if (!in_array($a['tipo'], ['opcao', 'multiopcao'], true)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Só atributos de opção têm lista.', ['tipo']);
        if (!is_array($ordem) || !array_is_list($ordem) || count($ordem) > 500) throw new AtributosErro('VALIDATION_ERROR', 422, 'Ordem inválida.', ['ordem']);
        $ids = [];
        foreach ($ordem as $x) { $i = is_int($x) ? $x : (is_string($x) && preg_match('/^[1-9][0-9]{0,9}$/', $x) ? (int) $x : 0); if ($i <= 0) throw new AtributosErro('VALIDATION_ERROR', 422, 'Ordem inválida.', ['ordem']); $ids[] = $i; }
        if (count(array_unique($ids)) !== count($ids)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Opção repetida na ordem.', ['ordem']);
        // DSHOW-045: a ordem ANTERIOR que a tela viu (versão do conjunto, sensível à ordem) é obrigatória e conferida sob trava
        $esperado = self::listaIds($ordemAntes, 'ordem_antes');
        $this->repo->transacao(function () use ($atributoId, $ids, $esperado) {
            if (!$this->repo->travarAtributo($atributoId, true)) throw new AtributosErro('NOT_FOUND', 404, 'Atributo não encontrado.');
            $antes = array_map(static fn($o) => (int) $o['id'], $this->repo->opcoes($atributoId));
            if ($antes !== $esperado) throw new AtributosErro('CONFLICT', 409, 'Outra pessoa alterou as opções deste atributo. Recarregue e tente de novo.');
            $a1 = $antes; $b1 = $ids; sort($a1); sort($b1);
            if ($a1 !== $b1) throw new AtributosErro('CONFLICT', 409, 'A lista de opções mudou. Recarregue e tente de novo.');
            if ($antes === $ids) return;
            foreach ($ids as $pos => $id) $this->repo->definirPosicaoOpcao($id, $atributoId, $pos);
            $this->repo->auditar($this->usuario, 'reordenar_opcoes', 'atributo', (string) $atributoId, ['ordem' => $antes], ['ordem' => $ids], null);
        });
        return ['opcoes' => $this->repo->opcoes($atributoId)];
    }

    public function definirOpcaoAtiva(int $opcaoId, bool $ativo): array
    {
        $this->exigirAdmin();
        $o = $this->repo->opcao($opcaoId) ?? throw new AtributosErro('NOT_FOUND', 404, 'Opção não encontrada.');
        $this->repo->transacao(function () use ($opcaoId, $ativo, $o) {
            $this->repo->definirOpcaoAtiva($opcaoId, $ativo);
            $this->repo->auditar($this->usuario, $ativo ? 'reativar' : 'desativar', 'opcao', (string) $opcaoId, ['ativo' => $o['ativo']], ['ativo' => $ativo ? 1 : 0], null);
        });
        return ['opcoes' => $this->repo->opcoes((int) $o['atributo_id'])];
    }

    public function unidades(): array { $this->exigir(self::NIVEL_CONSULTA); return $this->respostaUnidades(); }

    /** BR-02 (18/11): toda resposta de unidade traz o mesmo contrato das outras telas (pode_administrar); o cliente não trata mais como erro. */
    private function respostaUnidades(array $extra = []): array
    {
        return ['unidades' => $this->repo->unidades(), 'pode_administrar' => $this->podeAdministrar()] + $extra;
    }

    public function criarUnidade(array $b): array
    {
        $this->exigirAdmin();
        $erros = [];
        $s = self::texto($b['simbolo'] ?? null, 20, 'simbolo', true, $erros);
        $n = self::texto($b['nome'] ?? null, 80, 'nome', true, $erros);
        $g = self::texto($b['grandeza'] ?? null, 40, 'grandeza', false, $erros);
        $fator = self::fatorDe($b, $erros);
        if ($erros) throw new AtributosErro('VALIDATION_ERROR', 422, 'Campos inválidos.', $erros);
        // BR-02: "tentar de novo" depois de uma gravação que deu certo NÃO grava outra vez — mesma unidade (símbolo, nome, grandeza) = sucesso idempotente
        foreach ($this->repo->unidades() as $u) {
            if ($u['simbolo'] !== $s) continue;
            if ((string) $u['nome'] === (string) $n && (string) ($u['grandeza'] ?? '') === (string) ($g ?? '')) return $this->respostaUnidades(['ja_existia' => true, 'id' => (int) $u['id']]);
            throw new AtributosErro('VALIDATION_ERROR', 422, 'Símbolo já existe com outro nome ou grandeza.', ['simbolo']);
        }
        $id = $this->repo->transacao(function () use ($s, $n, $g, $fator) {
            $id = $this->repo->criarUnidade((string) $s, (string) $n, $g);
            if ($fator !== false && $fator !== null) $this->repo->atualizarUnidade($id, ['fator_base' => $fator]);
            $this->repo->auditar($this->usuario, 'criar', 'unidade', (string) $id, null, ['simbolo' => $s, 'nome' => $n, 'grandeza' => $g, 'fator_base' => $fator === false ? null : $fator], null);
            return $id;
        });
        return $this->respostaUnidades(['ja_existia' => false, 'id' => (int) $id]);
    }

    /** Edita nome/grandeza de uma unidade (o símbolo é a identidade e não muda). */
    public function salvarUnidade(array $b): array
    {
        $this->exigirAdmin();
        $id = (int) ($b['id'] ?? 0);
        $antes = $this->repo->unidade($id) ?? throw new AtributosErro('NOT_FOUND', 404, 'Unidade não encontrada.');
        $erros = [];
        $n = self::texto($b['nome'] ?? null, 80, 'nome', true, $erros);
        $g = self::texto($b['grandeza'] ?? null, 40, 'grandeza', false, $erros);
        if (isset($b['simbolo']) && $b['simbolo'] !== $antes['simbolo']) $erros[] = 'simbolo';
        $fator = self::fatorDe($b, $erros);
        if ($erros) throw new AtributosErro('VALIDATION_ERROR', 422, 'Campos inválidos (o símbolo não muda).', array_values(array_unique($erros)));
        $mudaFator = $fator !== false && (string) ($antes['fator_base'] ?? '') !== (string) ($fator ?? '') && !($fator !== null && $antes['fator_base'] !== null && self::comparar((string) $fator, self::decimalCanonico((string) $antes['fator_base'])) === 0);
        if ((string) $antes['nome'] === (string) $n && (string) ($antes['grandeza'] ?? '') === (string) ($g ?? '') && !$mudaFator) return $this->respostaUnidades(['sem_mudanca' => true]);   // BR-02: repetir não grava nem audita de novo
        $this->repo->transacao(function () use ($id, $n, $g, $antes, $mudaFator, $fator) {
            $novo = ['nome' => $n, 'grandeza' => $g] + ($mudaFator ? ['fator_base' => $fator] : []);
            $this->repo->atualizarUnidade($id, $novo);
            $this->repo->auditar($this->usuario, 'editar', 'unidade', (string) $id, $antes, $novo, null);
        });
        return $this->respostaUnidades();
    }

    /** D3: fator para a unidade base da grandeza (decimal > 0); '' ou null explícito limpa; ausente = não mexe (false). */
    private static function fatorDe(array $b, array &$erros): string|null|false
    {
        if (!array_key_exists('fator_base', $b)) return false;
        if ($b['fator_base'] === null || $b['fator_base'] === '') return null;
        $f = self::decimalCanonico($b['fator_base']);
        if ($f === null || self::comparar($f, '0') <= 0) { $erros[] = 'fator_base'; return false; }
        return $f;
    }

    public function definirUnidadeAtiva(int $id, bool $ativo): array
    {
        $this->exigirAdmin();
        $antes = $this->repo->unidade($id) ?? throw new AtributosErro('NOT_FOUND', 404, 'Unidade não encontrada.');
        if ((int) $antes['ativo'] === ($ativo ? 1 : 0)) return $this->respostaUnidades(['sem_mudanca' => true]);   // BR-02: idempotente
        $this->repo->transacao(function () use ($id, $ativo, $antes) {
            $this->repo->atualizarUnidade($id, ['ativo' => $ativo ? 1 : 0]);
            $this->repo->auditar($this->usuario, $ativo ? 'reativar' : 'desativar', 'unidade', (string) $id, ['ativo' => $antes['ativo']], ['ativo' => $ativo ? 1 : 0], null);
        });
        return ['unidades' => $this->repo->unidades()];
    }

    // ---- catálogo (leitura; GRANT N1) e auditoria ---------------------------------------------------------------------------
    public function buscarProdutos(?string $q): array
    {
        $this->exigir(self::NIVEL_CONSULTA);
        $q = $q !== null && trim($q) !== '' ? mb_substr(trim($q), 0, 80) : null;
        try { return ['produtos' => $this->catalogoOu503()->buscar($q, 30)]; }
        catch (CatalogoIndisponivel $e) { throw new AtributosErro('CATALOG_UNAVAILABLE', 503, 'Catálogo de produtos indisponível.'); }
    }

    public function categoriasCatalogo(): array
    {
        $this->exigir(self::NIVEL_ADMIN);
        try { return ['categorias' => $this->catalogoOu503()->categorias()]; }
        catch (CatalogoIndisponivel $e) { throw new AtributosErro('CATALOG_UNAVAILABLE', 503, 'Catálogo de produtos indisponível.'); }
    }

    public function auditoria(string $entidade, string $entidadeId): array
    {
        $this->exigir(self::NIVEL_ADMIN);
        if (!in_array($entidade, ['atributo', 'opcao', 'unidade', 'grupo', 'valor', 'ficha'], true)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Entidade inválida.', ['entidade']);
        return ['auditoria' => $this->repo->auditoria($entidade, mb_substr($entidadeId, 0, 64), 50)];
    }

    private function catalogoOu503(): CatalogoProdutos
    {
        return $this->catalogo ?? throw new AtributosErro('CATALOG_UNAVAILABLE', 503, 'Catálogo de produtos indisponível.');
    }

    // ---- grupos e aplicabilidade ------------------------------------------------------------------------------------------
    public function grupos(): array
    {
        $this->exigir(self::NIVEL_CONSULTA);
        $gs = $this->repo->grupos();
        foreach ($gs as &$g) {   // impacto: quantos produtos do catálogo cada grupo alcança (null = catálogo indisponível)
            $n = 0;
            try { foreach ($g['escopos'] as $e) $n += $this->catalogo ? $this->catalogo->contar((string) $e['categoria'], (string) $e['subcategoria']) : 0; $g['produtos_no_escopo'] = $this->catalogo ? $n : null; }
            catch (CatalogoIndisponivel $e) { $g['produtos_no_escopo'] = null; }
        }
        return ['grupos' => $gs, 'pode_administrar' => $this->podeAdministrar()];
    }

    public function definirGrupoAtivo(int $id, bool $ativo, int $versao): array
    {
        $this->exigirAdmin();
        $antes = $this->repo->grupo($id) ?? throw new AtributosErro('NOT_FOUND', 404, 'Grupo não encontrado.');
        $this->repo->transacao(function () use ($id, $ativo, $versao, $antes) {
            if (!$this->repo->atualizarGrupo($id, $versao, ['ativo' => $ativo ? 1 : 0])) throw new AtributosErro('CONFLICT', 409, 'Outra pessoa alterou este grupo. Recarregue e tente de novo.');
            $this->repo->auditar($this->usuario, $ativo ? 'reativar' : 'desativar', 'grupo', (string) $id, ['ativo' => $antes['ativo']], ['ativo' => $ativo ? 1 : 0], null);
        });
        return ['grupo' => $this->repo->grupo($id)];
    }

    public function salvarGrupo(array $b): array
    {
        $this->exigirAdmin();
        $erros = [];
        $id = isset($b['id']) ? (int) $b['id'] : 0;
        $nome = self::texto($b['nome'] ?? null, 160, 'nome', $id === 0, $erros);
        $escopos = [];
        foreach ((array) ($b['escopos'] ?? []) as $e) {
            $cat = is_array($e) ? ($e['categoria'] ?? '') : '';
            $sub = is_array($e) ? ($e['subcategoria'] ?? '') : '';
            if (!is_string($cat) || !preg_match('/^[A-Z_]{2,40}$/', $cat) || !is_string($sub) || ($sub !== '' && !preg_match('/^[A-Z_]{2,60}$/', $sub))) { $erros[] = 'escopos'; break; }
            $escopos[] = ['categoria' => $cat, 'subcategoria' => $sub];
        }
        $itens = [];
        foreach ((array) ($b['atributos'] ?? []) as $k => $it) {
            $aid = is_array($it) ? (int) ($it['atributo_id'] ?? 0) : 0;
            if ($aid <= 0 || !$this->repo->atributo($aid)) { $erros[] = 'atributos'; break; }
            $itens[] = ['atributo_id' => $aid, 'posicao' => (int) $k, 'obrigatorio' => !empty($it['obrigatorio']) ? 1 : 0, 'visivel' => array_key_exists('visivel', $it) && !$it['visivel'] ? 0 : 1];
        }
        if ($erros) throw new AtributosErro('VALIDATION_ERROR', 422, 'Campos inválidos.', array_values(array_unique($erros)));
        $id = $this->repo->transacao(function () use ($id, $nome, $escopos, $itens, $b) {
            if ($id === 0) {
                $id = $this->repo->criarGrupo((string) $nome);
                $this->repo->auditar($this->usuario, 'criar', 'grupo', (string) $id, null, ['nome' => $nome, 'escopos' => $escopos, 'atributos' => $itens], $b['motivo'] ?? null);
            } else {
                $antes = $this->repo->grupo($id) ?? throw new AtributosErro('NOT_FOUND', 404, 'Grupo não encontrado.');
                if (!$this->repo->atualizarGrupo($id, (int) ($b['versao'] ?? 0), array_filter(['nome' => $nome], static fn($v) => $v !== null))) throw new AtributosErro('CONFLICT', 409, 'Outra pessoa alterou este grupo. Recarregue e tente de novo.');
                $this->repo->auditar($this->usuario, 'editar', 'grupo', (string) $id, $antes, ['nome' => $nome, 'escopos' => $escopos, 'atributos' => $itens], $b['motivo'] ?? null);
            }
            if (array_key_exists('escopos', $b)) $this->repo->definirEscopo($id, $escopos, $this->usuario);
            if (array_key_exists('atributos', $b)) $this->repo->definirAtributosDoGrupo($id, $itens, $this->usuario);
            return $id;
        });
        return ['grupo' => $this->repo->grupo($id)];
    }

    // ---- valores por produto (preenchimento) ------------------------------------------------------------------------------
    public function valoresDoProduto(int $productId): array
    {
        $this->exigir(self::NIVEL_CONSULTA);
        if ($productId <= 0) throw new AtributosErro('VALIDATION_ERROR', 422, 'Produto inválido.', ['product_id']);
        return ['product_id' => $productId, 'valores' => $this->repo->valoresDoProduto($productId), 'pode_preencher' => $this->nivel >= self::NIVEL_VALORES];
    }

    /**
     * FICHA APLICÁVEL (briefing §2.1): definições dos grupos ativos cujo escopo casa a categoria/subcategoria do produto + valor (ou
     * `nao_informado`) + valores gravados fora da ficha + vínculos legados. Inexistente/excluído → 404 PRODUCT_NOT_FOUND.
     */
    public function ficha(int $productId, bool $escritaLigada): array
    {
        $this->exigir(self::NIVEL_CONSULTA);
        if ($productId <= 0) throw new AtributosErro('VALIDATION_ERROR', 422, 'Produto inválido.', ['product_id']);
        $p = $this->produtoDoCatalogo($productId);
        if ($p === null || $p['excluido']) throw new AtributosErro('PRODUCT_NOT_FOUND', 404, 'Produto não encontrado no catálogo.');
        $valores = [];
        foreach ($this->repo->valoresDoProduto($productId) as $v) $valores[(int) $v['atributo_id']][] = $v;
        $grupos = []; $usados = [];
        foreach ($this->aplicaveis($p) as $aid => $x) {
            $gid = (int) $x['grupo']['id'];
            $grupos[$gid] ??= ['id' => $gid, 'nome' => $x['grupo']['nome'], 'escopo' => ['categoria' => $x['grupo']['escopo_categoria'], 'subcategoria' => $x['grupo']['escopo_subcategoria']], 'atributos' => []];
            $def = $x['def'];
            $grupos[$gid]['atributos'][] = [
                'atributo_id' => $aid, 'codigo' => $def['codigo'], 'rotulo' => $def['rotulo'], 'tipo' => $def['tipo'], 'unidade' => $def['unidade'] ?? null,
                'casas' => $def['casas'] === null ? null : (int) $def['casas'], 'minimo' => $def['minimo'], 'maximo' => $def['maximo'],
                'obrigatorio' => (bool) $x['item']['obrigatorio'], 'visivel' => (bool) $x['item']['visivel'], 'posicao' => (int) $x['item']['posicao'],
                'autoridade' => $def['autoridade'] ?? 'local', 'precifica_ref' => $def['precifica_ref'] ?? null,
                'aceita_nao_se_aplica' => (int) ($def['aceita_nao_se_aplica'] ?? 1) === 1,
                'opcoes' => in_array($def['tipo'], ['opcao', 'multiopcao'], true) ? array_map(static fn($o) => ['id' => (int) $o['id'], 'rotulo' => $o['rotulo'], 'ativo' => (bool) $o['ativo']], $this->repo->opcoes($aid)) : [],
                'valor' => ($def['autoridade'] ?? 'local') === 'precifica' ? $this->valorDoPrecifica($productId, (string) $def['precifica_ref']) : self::valorDaFicha($valores[$aid] ?? [], (string) $def['tipo']),
            ];
            $usados[$aid] = true;
        }
        $fora = [];
        foreach ($valores as $aid => $vs) {
            if (isset($usados[$aid])) continue;
            $def = $this->repo->atributo($aid);
            $fora[] = ['atributo_id' => $aid, 'rotulo' => $def['rotulo'] ?? null, 'motivo' => ($def && (int) $def['ativo'] !== 1) ? 'atributo_inativo' : 'fora_do_escopo', 'valor' => self::valorDaFicha($vs, (string) ($def['tipo'] ?? 'texto'))];
        }
        $somenteLeitura = !$p['ativo'] || $this->nivel < self::NIVEL_VALORES || !$escritaLigada;
        $completude = self::completude($grupos);
        $rev = $this->repo->ultimaRevisao($productId);
        $revisao = $rev === null ? null : ['por' => $rev['usuario'], 'em' => $rev['criado_em'],
            'vigente' => (($rev['depois']['impressao'] ?? null) === self::impressao($grupos))];
        return [
            'produto' => ['id' => (int) $p['id'], 'nome' => $p['nome'], 'categoria' => $p['categoria'], 'subcategoria' => $p['subcategoria'], 'ativo' => (bool) $p['ativo'], 'catalogo_sincronizado_em' => $p['sincronizado_em']],
            'somente_leitura' => $somenteLeitura, 'pode_preencher' => !$somenteLeitura,
            'completude' => $completude, 'revisao' => $revisao,
            'pode_revisar' => $p['ativo'] && $escritaLigada && $this->podeAdministrar(),
            'grupos' => array_values($grupos), 'valores_fora_da_ficha' => $fora,
            'vinculos_legado' => array_map(static fn($l) => ['origem_ns' => $l['origem_ns'], 'chave_antiga' => (string) $l['chave_antiga'], 'estado' => $l['estado']], $this->repo->vinculosLegado($productId)),
        ];
    }

    /**
     * V4/R1 (EA-011) — situação da ficha: obrigatório contextual NÃO impede rascunho (gravarValor aceita ficha incompleta); a REVISÃO
     * exige todos os obrigatórios resolvidos. Resolvido = 'informado' ou 'nao_se_aplica' (decisão explícita); 'desconhecido' e
     * 'nao_informado' ficam pendentes; autoridade Precifica conta como resolvida só quando o valor está disponível.
     */
    private static function completude(array $grupos): array
    {
        $obr = 0; $pend = [];
        foreach ($grupos as $g) foreach ($g['atributos'] as $a) {
            if (!$a['obrigatorio']) continue;
            $obr++;
            $v = $a['valor']; $e = $v['estado'] ?? 'nao_informado';
            // 3.7: "não se aplica" só resolve quando o atributo o aceita (linha legada num atributo que deixou de aceitar fica PENDENTE);
            // "desconhecido" nunca resolve (DP-L3.2 confirmada)
            $ok = ($e === 'nao_se_aplica' && ($a['aceita_nao_se_aplica'] ?? true)) || ($e === 'informado' && !($a['tipo'] === 'multiopcao' && empty($v['opcoes'])))
                || ($e === 'precifica' && ($v['disponivel'] ?? false) && ($v['valor_precifica'] ?? null) !== null);
            if (!$ok) $pend[] = ['atributo_id' => $a['atributo_id'], 'rotulo' => $a['rotulo'], 'grupo' => $g['nome']];
        }
        return ['obrigatorios' => $obr, 'resolvidos' => $obr - count($pend), 'pendentes' => $pend, 'completa' => !$pend];
    }

    /** Impressão dos valores locais da ficha (atributo, estado, versão, opções): muda a cada gravação → a revisão anterior deixa de valer. */
    private static function impressao(array $grupos): string
    {
        $x = [];
        foreach ($grupos as $g) foreach ($g['atributos'] as $a) {
            if (($a['autoridade'] ?? 'local') === 'precifica') continue;
            $v = $a['valor'];
            $x[] = [(int) $a['atributo_id'], $v['estado'] ?? 'nao_informado', (int) ($v['versao'] ?? 0), $v['opcoes_versao'] ?? []];
        }
        usort($x, static fn($a, $b) => $a[0] <=> $b[0]);
        return hash('sha256', json_encode($x));
    }

    /** V4/R1 — marca a ficha como REVISADA (nível 80): só com todos os obrigatórios resolvidos; vale até a próxima gravação na ficha. */
    public function revisarFicha(array $b): array
    {
        $this->exigirAdmin();
        $pid = (int) ($b['product_id'] ?? 0);
        if ($pid <= 0) throw new AtributosErro('VALIDATION_ERROR', 422, 'Produto inválido.', ['product_id']);
        $f = $this->ficha($pid, true);
        if (!$f['produto']['ativo']) throw new AtributosErro('PRODUCT_INACTIVE', 422, 'Produto inativo: a ficha é somente leitura.', ['product_id']);
        if (!$f['completude']['completa']) throw new AtributosErro('FICHA_INCOMPLETA', 422, 'Há atributos obrigatórios sem valor: ' . implode(', ', array_column($f['completude']['pendentes'], 'rotulo')) . '.',
            array_map(static fn($p) => 'atributo_' . $p['atributo_id'], $f['completude']['pendentes']));
        $motivo = isset($b['motivo']) && trim((string) $b['motivo']) !== '' ? mb_substr(trim((string) $b['motivo']), 0, 255) : null;
        $this->repo->transacao(fn() => $this->repo->auditar($this->usuario, 'revisar', 'ficha', (string) $pid, null,
            ['impressao' => self::impressao($f['grupos']), 'obrigatorios' => $f['completude']['obrigatorios'], 'resolvidos' => $f['completude']['resolvidos']], $motivo));
        return $this->ficha($pid, true);
    }

    /** D3.6: atributo cuja autoridade é o Precifica — o valor exibido vem da ficha do Precifica (cache do app); o local não vale. */
    private function valorDoPrecifica(int $pid, string $ref): array
    {
        [$kind, $key] = array_pad(explode('.', $ref, 2), 2, '');
        try { $attrs = $this->catalogo ? $this->catalogo->specs($pid, $kind) : null; }
        catch (CatalogoIndisponivel $e) { $attrs = null; }
        if ($attrs === null) return ['estado' => 'precifica', 'disponivel' => false, 'origem' => 'precifica'];
        $v = $attrs[$key] ?? null;
        return ['estado' => 'precifica', 'disponivel' => true, 'origem' => 'precifica', 'valor_precifica' => $v === null ? null : (is_bool($v) ? $v : (string) $v)];
    }

    /**
     * Linhas de eq_valor de UM atributo → valor da ficha (zero/falso preservados; sem linha = nao_informado). P1-07 (mesma leitura do Node):
     * multiopção = `informado` se há opção viva (opcao_chave > 0); senão o estado da linha de chave 0; senão nao_informado.
     */
    private static function valorDaFicha(array $linhas, string $tipo): array
    {
        $k0 = null; $ops = [];
        foreach ($linhas as $l) {
            if (!empty($l['excluido_em'])) continue;
            if ((int) ($l['opcao_chave'] ?? 0) > 0) { if ($l['estado'] === 'informado') $ops[] = $l; }
            elseif ($k0 === null) $k0 = $l;
        }
        if ($tipo === 'multiopcao') {
            if (!$ops) return ($k0 && $k0['estado'] !== 'informado') ? ['estado' => $k0['estado'], 'versao' => (int) $k0['versao'], 'origem' => $k0['origem']] : ['estado' => 'nao_informado'];
            return ['estado' => 'informado', 'versao' => $k0 ? (int) $k0['versao'] : 0, 'origem' => $ops[0]['origem'],
                'opcoes_versao' => array_map(static fn($l) => ['id' => (int) $l['opcao_id'], 'versao' => (int) $l['versao']], $ops),
                'valor_texto' => null, 'valor_num' => null, 'valor_bool' => null, 'valor_data' => null, 'opcoes' => array_map(static fn($l) => (int) $l['opcao_id'], $ops)];
        }
        $v = $k0 ?? ($ops[0] ?? null);
        if ($v === null) return ['estado' => 'nao_informado'];
        $out = ['estado' => $v['estado'], 'versao' => (int) $v['versao'], 'origem' => $v['origem']];
        if ($v['estado'] !== 'informado') return $out;
        $ops = $v['opcao_id'] === null ? [] : [(int) $v['opcao_id']];
        $out['opcoes_versao'] = $v['opcao_id'] === null ? [] : [['id' => (int) $v['opcao_id'], 'versao' => (int) $v['versao']]];
        return $out + ['valor_texto' => $v['valor_texto'], 'valor_num' => $v['valor_num'] === null ? null : (string) $v['valor_num'], 'valor_bool' => $v['valor_bool'] === null ? null : (bool) (int) $v['valor_bool'], 'valor_data' => $v['valor_data'], 'opcoes' => $ops];
    }

    /** Desmarca UMA opção de um atributo multiopção (exclusão lógica: excluido_em; versão obrigatória; auditoria na mesma transação). */
    public function removerOpcaoDoValor(array $b): array
    {
        $this->exigir(self::NIVEL_VALORES);
        $pid = (int) ($b['product_id'] ?? 0); $aid = (int) ($b['atributo_id'] ?? 0); $oid = (int) ($b['opcao_id'] ?? 0);
        $produto = $pid > 0 ? $this->produtoDoCatalogo($pid) : null;
        if ($produto === null || $produto['excluido']) throw new AtributosErro('PRODUCT_NOT_FOUND', 422, 'Produto não encontrado no catálogo.', ['product_id']);
        if (!$produto['ativo']) throw new AtributosErro('PRODUCT_INACTIVE', 422, 'Produto inativo: a ficha é somente leitura.', ['product_id']);
        $a = $this->repo->atributo($aid) ?? throw new AtributosErro('NOT_FOUND', 404, 'Atributo não encontrado.');
        if ($a['tipo'] !== 'multiopcao') throw new AtributosErro('VALIDATION_ERROR', 422, 'Só atributos de várias opções desmarcam uma opção.', ['atributo_id']);
        $this->repo->transacao(function () use ($pid, $aid, $oid, $b) {
            // DSHOW-034 (B, 18/11): desmarcar confere a versão do CONJUNTO que o usuário viu (contador monotônico), sob a trava — a versão da
            // 1ª opção viva sozinha não percebe "desmarcou e remarcou" outra opção. Depois, a da opção/1ª viva como antes.
            $todas = $this->repo->travarValores($pid, $aid);
            self::conferirConjunto($b, $todas);
            $vivos = array_values(array_filter($todas, static fn($r) => empty($r['excluido_em'])));
            $antes = null; foreach ($vivos as $r) if ((int) $r['opcao_chave'] === $oid) $antes = $r;
            if (!$antes) throw new AtributosErro('NOT_FOUND', 404, 'Esta opção não está marcada.');
            $v = (int) ($b['versao'] ?? -1);
            if ($v !== (int) $antes['versao'] && $v !== (int) $vivos[0]['versao']) throw new AtributosErro('CONFLICT', 409, 'Outra pessoa alterou este valor. Recarregue e tente de novo.');
            if (!$this->repo->removerValorOpcao($pid, $aid, $oid, (int) $antes['versao'])) throw new AtributosErro('CONFLICT', 409, 'Outra pessoa alterou este valor. Recarregue e tente de novo.');
            $this->repo->auditar($this->usuario, 'desmarcar', 'valor', "$pid:$aid:$oid", $antes, null, $b['motivo'] ?? null);
        });
        return ['ok' => true];
    }

    /** Converte e valida o valor pelo TIPO do atributo; nunca adivinha (texto com unidade não vira número). */
    public function gravarValor(array $b): array
    {
        $this->exigir(self::NIVEL_VALORES);
        $pid = (int) ($b['product_id'] ?? 0);
        $aid = (int) ($b['atributo_id'] ?? 0);
        if ($pid <= 0) throw new AtributosErro('VALIDATION_ERROR', 422, 'Produto inválido.', ['product_id']);
        $produto = $this->produtoDoCatalogo($pid);
        if ($produto === null || $produto['excluido']) throw new AtributosErro('PRODUCT_NOT_FOUND', 422, 'Produto não encontrado no catálogo.', ['product_id']);
        if (!$produto['ativo']) throw new AtributosErro('PRODUCT_INACTIVE', 422, 'Produto inativo: a ficha é somente leitura.', ['product_id']);
        $a = $this->repo->atributo($aid) ?? throw new AtributosErro('NOT_FOUND', 404, 'Atributo não encontrado.');
        if ((int) $a['ativo'] !== 1) throw new AtributosErro('VALIDATION_ERROR', 422, 'Atributo desativado.', ['atributo_id']);
        if (!isset($this->aplicaveis($produto)[$aid])) throw new AtributosErro('ATTRIBUTE_NOT_APPLICABLE', 422, 'Este atributo não faz parte da ficha deste produto.', ['atributo_id']);
        if (($a['autoridade'] ?? 'local') === 'precifica') throw new AtributosErro('AUTHORITY_PRECIFICA', 409, 'Este campo vem do Precifica (ficha do catálogo): o valor local não vale.');
        $estado = $b['estado'] ?? 'informado';
        if (!in_array($estado, ['informado', 'nao_se_aplica', 'desconhecido'], true)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Estado inválido.', ['estado']);
        if ($estado === 'nao_se_aplica' && (int) ($a['aceita_nao_se_aplica'] ?? 1) !== 1) throw new AtributosErro('VALIDATION_ERROR', 422, 'Este atributo não aceita "não se aplica".', ['estado']);
        $d = ['product_id' => $pid, 'atributo_id' => $aid, 'opcao_id' => null, 'opcao_chave' => 0, 'valor_texto' => null, 'valor_num' => null, 'valor_bool' => null, 'valor_data' => null, 'estado' => $estado, 'origem' => 'manual', 'atualizado_por' => $this->usuario];
        if ($estado === 'informado') {
            $v = $b['valor'] ?? null;
            switch ($a['tipo']) {
                case 'numero':
                case 'inteiro':
                    // P2-01: DECIMAL(20,6) como TEXTO validado (nunca float): até 14 dígitos inteiros; sem notação científica nem unidade
                    $n = self::decimalCanonico($v);
                    if ($n === null) throw new AtributosErro('VALIDATION_ERROR', 422, 'Informe um número (sem unidade).', ['valor']);
                    if ($a['tipo'] === 'inteiro') {
                        if (trim(explode('.', $n . '.')[1], '0') !== '') throw new AtributosErro('VALIDATION_ERROR', 422, 'Informe um número inteiro.', ['valor']);
                        $n = self::arredondar($n, 0);
                    } else {
                        $n = self::arredondar($n, $a['casas'] !== null ? (int) $a['casas'] : 6);
                        if ($a['casas'] === null) $n = self::semZerosFinais($n);
                    }
                    if (strlen(ltrim(explode('.', $n)[0], '-')) > 14) throw new AtributosErro('VALIDATION_ERROR', 422, 'Número grande demais para a ficha.', ['valor']);
                    $mn = $a['minimo'] === null ? null : self::decimalCanonico($a['minimo']);
                    $mx = $a['maximo'] === null ? null : self::decimalCanonico($a['maximo']);
                    // DSHOW-033: os limites estão na unidade PADRÃO do atributo. O número está na unidade EFETIVA do valor: a explícita do pedido
                    // ou, sem ela, a herdada (ajuste do produto → item do kit → padrão do atributo). Converte com decimal exato ANTES de comparar.
                    // Unidade sem fator (ou de outra grandeza) com limites definidos → 422 claro (antes: os limites eram ignorados).
                    $nCmp = $n;
                    $uvId = isset($b['unidade_id']) && $b['unidade_id'] !== '' && $b['unidade_id'] !== null ? (int) $b['unidade_id'] : null;
                    if ($mn !== null || $mx !== null) {
                        $aplicU = $this->aplicaveis($produto)[$aid]['aplic'] ?? null;
                        $uEf = $uvId ?? ($aplicU !== null ? Aplicabilidade::unidadeEfetiva($aplicU, null) : ($a['unidade_id'] !== null ? (int) $a['unidade_id'] : null));
                        $uPad = $a['unidade_id'] !== null ? (int) $a['unidade_id'] : null;
                        if ($uEf !== null && $uPad !== null && $uEf !== $uPad) {
                            $uv = $this->repo->unidade($uEf); $up = $this->repo->unidade($uPad);
                            if (!$uv || !$up || $uv['fator_base'] === null || $up['fator_base'] === null || ($uv['grandeza'] ?? null) !== ($up['grandeza'] ?? null)) {
                                throw new AtributosErro('UNIT_WITHOUT_FACTOR', 422, 'Não é possível conferir os limites deste atributo: a unidade "' . ($uv['simbolo'] ?? '?') . '" não tem fator de conversão para "'
                                    . ($up['simbolo'] ?? '?') . '". Informe o valor em ' . ($up['simbolo'] ?? 'unidade padrão') . ' ou peça o fator na aba Unidades.', ['unidade_id']);
                            }
                            $nCmp = DecimalExato::mulDiv($n, (string) $uv['fator_base'], (string) $up['fator_base'], 6);
                        }
                    }
                    if (($mn !== null && self::comparar($nCmp, $mn) < 0) || ($mx !== null && self::comparar($nCmp, $mx) > 0)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Fora dos limites do atributo.', ['valor']);
                    $d['valor_num'] = $n;
                    break;
                case 'booleano':
                    if (!is_bool($v) && !in_array($v, [0, 1, '0', '1'], true)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Informe sim ou não.', ['valor']);
                    $d['valor_bool'] = (bool) $v ? 1 : 0;
                    break;
                case 'data':
                    // P2-01: data REAL (checkdate), não só o formato
                    if (!is_string($v) || !preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $v, $dm) || !checkdate((int) $dm[2], (int) $dm[3], (int) $dm[1])) throw new AtributosErro('VALIDATION_ERROR', 422, 'Data no formato AAAA-MM-DD.', ['valor']);
                    $d['valor_data'] = $v;
                    break;
                case 'opcao':
                case 'multiopcao':
                    // P1-07: id da opção estritamente inteiro positivo ("5abc" não vira 5)
                    $oid = is_int($v) ? $v : (is_string($v) && preg_match('/^[1-9][0-9]{0,9}$/', $v) ? (int) $v : 0);
                    $o = $oid > 0 ? $this->repo->opcao($oid) : null;
                    if (!$o || (int) $o['atributo_id'] !== $aid || (int) $o['ativo'] !== 1) throw new AtributosErro('VALIDATION_ERROR', 422, 'Opção inválida ou desativada.', ['valor']);
                    $d['opcao_id'] = (int) $o['id'];
                    if ($a['tipo'] === 'multiopcao') $d['opcao_chave'] = (int) $o['id'];
                    break;
                default:
                    if (!is_string($v) || trim($v) === '' || mb_strlen(trim($v)) > 500) throw new AtributosErro('VALIDATION_ERROR', 422, 'Texto de 1 a 500 caracteres.', ['valor']);
                    $d['valor_texto'] = trim($v);
            }
        }
        // DSHOW-035 #4 (Jhony 18/11): "informado" exige CONTEÚDO — nenhum caminho grava valor informado vazio (o app o esconderia e o Dash o contaria)
        if ($estado === 'informado' && ($d['valor_texto'] === null || trim((string) $d['valor_texto']) === '') && $d['valor_num'] === null && $d['valor_bool'] === null
            && ($d['valor_data'] === null || $d['valor_data'] === '') && $d['opcao_id'] === null) {
            throw new AtributosErro('VALUE_EMPTY', 422, 'Valor vazio: preencha o campo, ou escolha "Não se aplica" ou "Desconhecido".', ['valor']);
        }
        $d['unidade_id'] = $estado === 'informado' ? $this->validarUnidade($produto, $a, $b) : null;   // D3: unidade por valor
        // DSHOW-048: valor numérico novo/editado NUNCA fica com unidade nula — grava a unidade EFETIVA de agora (produto → kit → padrão).
        // Assim, mudar depois o kit (ou somar outro kit com outra unidade) não reinterpreta o número em silêncio.
        if ($estado === 'informado' && $d['unidade_id'] === null && in_array($a['tipo'], ['numero', 'inteiro'], true)) {
            $apl = $this->aplicaveis($produto)[$aid]['aplic'] ?? null;
            $d['unidade_id'] = $apl !== null ? Aplicabilidade::unidadeEfetiva($apl, null) : ($a['unidade_id'] !== null ? (int) $a['unidade_id'] : null);
        }
        $this->repo->transacao(function () use ($pid, $aid, $d, $b, $a) {
            // P1-09: a definição é relida COM TRAVA COMPARTILHADA e conferida — se o tipo/limites/estado mudaram entre a validação e aqui
            // (versão diferente), conflito visível; a mudança de tipo (trava exclusiva + contagem com trava) espera esta transação.
            $atual = $this->repo->travarAtributo($aid, false);
            if (!$atual || (int) $atual['ativo'] !== 1 || $atual['tipo'] !== $a['tipo'] || (int) $atual['versao'] !== (int) $a['versao']) {
                throw new AtributosErro('CONFLICT', 409, 'A definição deste atributo mudou enquanto você preenchia. Recarregue e tente de novo.');
            }
            // P1-07: todas as linhas do (produto, atributo) travadas → UM estado só por (produto, atributo)
            $linhas = $this->repo->travarValores($pid, $aid);
            // DSHOW-034: na multiopção, mudar o ESTADO (≠ informado) ou trocar um estado por opção substitui o conjunto inteiro →
            // exige a versão do CONJUNTO, conferida aqui, sob trava. Acrescentar opção a opções já marcadas continua por opção.
            if ($a['tipo'] === 'multiopcao') {
                $vivosM = array_values(array_filter($linhas, static fn($r) => empty($r['excluido_em'])));
                $temEstado = (bool) array_filter($vivosM, static fn($r) => (int) $r['opcao_chave'] === 0);
                $vcPedido = $b['versao_conjunto'] ?? null;
                if ($vivosM) {
                    // substitui o conjunto (estado ≠ informado, ou troca um estado por opção) → versão obrigatória e conferida
                    if ($d['estado'] !== 'informado' || $temEstado) self::conferirConjunto($b, $linhas);
                    // acrescentar opção a opções já marcadas continua por opção (DSHOW-034)
                } elseif ($vcPedido !== null && $vcPedido !== '') {
                    self::conferirConjunto($b, $linhas);   // DSHOW-049: conjunto VAZIO também confere (revisão antiga depois da limpeza → 409)
                } elseif ($linhas) {
                    // DSHOW-049: vazio COM trilha (o campo já teve valor) e pedido sem versão → recusa explícita
                    throw new AtributosErro('VALIDATION_ERROR', 422, 'Falta a versão do conjunto de opções (o campo já teve valor). Recarregue a ficha.', ['versao_conjunto']);
                }
                // vazio SEM trilha nenhuma e sem versão = 1º preenchimento legítimo
            }
            $antes = null;
            foreach ($linhas as $l) if ((int) $l['opcao_chave'] === (int) $d['opcao_chave']) $antes = $l;
            $vivo = $antes !== null && empty($antes['excluido_em']);
            if ($vivo && self::mesmoValor($antes, $d)) return;   // salvar sem mudança: nem versão nem auditoria
            // linha excluída antes (excluido_em) volta sem exigir versão: não há valor vivo a sobrescrever.
            // DSHOW-034 (A, 18/11): mas, num campo de valor ÚNICO, quem manda a versão de um valor que ele viu e que depois foi LIMPO é uma
            // aba antiga → 409 (não recria). Quem relê vê o campo vazio, não manda versão de valor e preenche normalmente.
            if ($antes && !$vivo && $a['tipo'] !== 'multiopcao' && isset($b['versao']) && $b['versao'] !== '' && (int) $b['versao'] !== (int) $antes['versao']) {
                throw new AtributosErro('CONFLICT', 409, 'Outra pessoa limpou este valor. Recarregue e tente de novo.');
            }
            $versao = $antes ? (!$vivo ? (int) $antes['versao'] : (int) ($b['versao'] ?? 0)) : null;
            if (!$this->repo->gravarValor($d, $versao)) throw new AtributosErro('CONFLICT', 409, 'Outra pessoa alterou este valor. Recarregue e tente de novo.');
            $excluidas = [];
            if ($a['tipo'] === 'multiopcao') foreach ($linhas as $l) {
                $k = (int) $l['opcao_chave'];
                if (!empty($l['excluido_em']) || $k === (int) $d['opcao_chave']) continue;
                // estado ≠ informado (chave 0) → sai toda opção viva; opção marcada (chave > 0) → sai a chave 0
                if (((int) $d['opcao_chave'] === 0 && $k > 0) || ((int) $d['opcao_chave'] > 0 && $k === 0)) { if ($this->repo->excluirValor($pid, $aid, $k)) $excluidas[] = $k; }
            }
            $this->repo->auditar($this->usuario, $antes ? 'editar' : 'preencher', 'valor', "$pid:$aid:{$d['opcao_chave']}", $antes, $excluidas ? $d + ['excluidas_chaves' => $excluidas] : $d, $b['motivo'] ?? null);
        });
        return ['valor' => $this->repo->valor($pid, $aid, (int) $d['opcao_chave'])];
    }

    /** P1-07: a linha viva já tem exatamente este conteúdo? (decimal comparado como número; bool/ids como inteiros) */
    /** D3/A8: unidade do valor — só para número/inteiro; precisa estar entre as permitidas. Ausente = NULL (herda a efetiva). */
    private function validarUnidade(array $produto, array $a, array $b): ?int
    {
        if (!array_key_exists('unidade_id', $b) || $b['unidade_id'] === null || $b['unidade_id'] === '') return null;
        if (!in_array($a['tipo'], ['numero', 'inteiro'], true)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Este atributo não tem unidade de medida.', ['unidade_id']);
        $uid = is_int($b['unidade_id']) ? $b['unidade_id'] : (is_string($b['unidade_id']) && ctype_digit($b['unidade_id']) ? (int) $b['unidade_id'] : 0);
        foreach ($this->unidadesPermitidas($produto, $a) as $u) if ((int) $u['id'] === $uid) return $uid;
        throw new AtributosErro('VALIDATION_ERROR', 422, 'Unidade não permitida para este atributo.', ['unidade_id']);
    }

    /** A8: unidades ativas da MESMA grandeza da unidade efetiva (produto → kit → padrão) + as incluídas explicitamente no atributo. */
    public function unidadesPermitidas(array $produto, array $a): array
    {
        $aplic = $this->aplicaveis($produto)[(int) $a['id']]['aplic'] ?? null;
        $padrao = $aplic !== null ? Aplicabilidade::unidadeEfetiva($aplic, null) : (isset($a['unidade_id']) ? (int) $a['unidade_id'] : null);
        $todas = []; foreach ($this->repo->unidades() as $u) $todas[(int) $u['id']] = $u;
        $g = $padrao !== null ? ($todas[$padrao]['grandeza'] ?? null) : null;
        $extras = array_flip($this->repo->unidadesExtras((int) $a['id']));
        $out = [];
        foreach ($todas as $id => $u) {
            if (!(int) $u['ativo'] && $id !== $padrao) continue;
            if ($id === $padrao || ($g !== null && $g !== '' && $u['grandeza'] === $g) || isset($extras[$id])) $out[] = $u + ['padrao' => $id === $padrao];
        }
        return $out;
    }

    /** H5: troca a unidade de um valor; converter=true multiplica pelos fatores (mesma grandeza, fatores definidos, bcmath exato). */
    public function converterUnidade(array $b): array
    {
        $this->exigir(self::NIVEL_VALORES);
        $pid = (int) ($b['product_id'] ?? 0); $aid = (int) ($b['atributo_id'] ?? 0);
        $produto = $pid > 0 ? $this->produtoDoCatalogo($pid) : null;
        if ($produto === null || $produto['excluido']) throw new AtributosErro('PRODUCT_NOT_FOUND', 422, 'Produto não encontrado no catálogo.', ['product_id']);
        $a = $this->repo->atributo($aid) ?? throw new AtributosErro('NOT_FOUND', 404, 'Atributo não encontrado.');
        $atual = $this->repo->valor($pid, $aid, 0);
        if (!$atual || !empty($atual['excluido_em']) || $atual['estado'] !== 'informado' || $atual['valor_num'] === null) throw new AtributosErro('VALIDATION_ERROR', 422, 'Não há número informado para converter.', ['valor']);
        if ((int) ($b['versao'] ?? -1) !== (int) $atual['versao']) throw new AtributosErro('CONFLICT', 409, 'Outra pessoa alterou este valor. Recarregue e tente de novo.');
        $destino = (int) ($b['unidade_id'] ?? 0);
        $perm = []; foreach ($this->unidadesPermitidas($produto, $a) as $u) $perm[(int) $u['id']] = $u;
        if (!isset($perm[$destino])) throw new AtributosErro('VALIDATION_ERROR', 422, 'Unidade não permitida para este atributo.', ['unidade_id']);
        $aplic = $this->aplicaveis($produto)[$aid]['aplic'] ?? null;
        $origemId = $atual['unidade_id'] !== null ? (int) $atual['unidade_id'] : ($aplic ? Aplicabilidade::unidadeEfetiva($aplic, null) : null);
        $num = self::decimalCanonico($atual['valor_num']);
        if (!empty($b['converter'])) {
            $o = $origemId !== null ? $this->repo->unidade($origemId) : null; $dd = $perm[$destino];
            if (!$o || $o['fator_base'] === null || $dd['fator_base'] === null || (string) $o['grandeza'] !== (string) $dd['grandeza']) throw new AtributosErro('UNIT_NO_CONVERSION', 422, 'Sem fator de conversão entre estas unidades: use "só trocar a unidade".', ['unidade_id']);
            $num = DecimalExato::mulDiv($num, self::decimalCanonico((string) $o['fator_base']), self::decimalCanonico((string) $dd['fator_base']), 6);   // exato, sem float
        }
        return $this->gravarValor(['product_id' => $pid, 'atributo_id' => $aid, 'valor' => $num, 'unidade_id' => $destino, 'versao' => (int) $atual['versao'],
            'motivo' => !empty($b['converter']) ? 'unidade convertida' : 'unidade trocada (sem converter)']);
    }

    /** Limpa o valor de um campo (exclusão lógica, com versão e auditoria). */
    public function limparValor(array $b): array
    {
        $this->exigir(self::NIVEL_VALORES);
        $pid = (int) ($b['product_id'] ?? 0); $aid = (int) ($b['atributo_id'] ?? 0);
        $produto = $pid > 0 ? $this->produtoDoCatalogo($pid) : null;
        if ($produto === null || $produto['excluido']) throw new AtributosErro('PRODUCT_NOT_FOUND', 422, 'Produto não encontrado no catálogo.', ['product_id']);
        if (!$produto['ativo']) throw new AtributosErro('PRODUCT_INACTIVE', 422, 'Produto inativo: a ficha é somente leitura.', ['product_id']);
        // sob trava (FOR UPDATE): versão conferida dentro da transação; multiopção limpa todas as opções marcadas
        $multi = (($this->repo->atributo($aid) ?? [])['tipo'] ?? null) === 'multiopcao';
        return $this->repo->transacao(function () use ($pid, $aid, $b, $multi) {
            $todas = $this->repo->travarValores($pid, $aid);
            $vivos = array_values(array_filter($todas, static fn($r) => empty($r['excluido_em'])));
            // DSHOW-053: na multiopção a revisão do conjunto é conferida SEMPRE, sob a trava, ANTES de qualquer retorno — inclusive o
            // "sem mudança" do conjunto vazio (revisão antiga → 409; omitida/malformada → 422; atual → sem_mudanca, sem auditoria).
            if ($multi) self::conferirConjunto($b, $todas);
            if (!$vivos) return ['limpo' => true, 'sem_mudanca' => true];
            if ($multi) {
                // já conferida acima (DSHOW-034/049/050: limpar a multiopção inteira = versão do CONJUNTO, trilha toda)
            } elseif ((int) ($b['versao'] ?? -1) !== (int) $vivos[0]['versao']) throw new AtributosErro('CONFLICT', 409, 'Outra pessoa alterou este valor. Recarregue e tente de novo.');
            foreach ($vivos as $r) {
                if (!$this->repo->excluirValor($pid, $aid, (int) $r['opcao_chave'])) throw new AtributosErro('CONFLICT', 409, 'Outra pessoa alterou este valor. Recarregue e tente de novo.');
                $this->repo->auditar($this->usuario, 'limpar', 'valor', "$pid:$aid:" . (int) $r['opcao_chave'], $r, null, $b['motivo'] ?? null);
            }
            return ['limpo' => true];
        });
    }

    /**
     * DSHOW-034/050: versão do CONJUNTO de um (produto, atributo) — contador monotônico sobre a trilha inteira (ver abaixo). Na multiopção
     * a versão da 1ª linha não muda quando outra pessoa acrescenta uma opção; esta muda. Mesma fórmula na leitura (ProdutosLeitura).
     */
    public static function versaoConjunto(array $linhas): string
    {
        // DSHOW-050: CONTADOR MONOTÔNICO por (produto, atributo) = soma das versões de TODAS as linhas, vivas e excluídas (tombstones).
        // Toda mudança em eq_valor sobe a versão de uma linha (editar, limpar/excluir, reativar) ou insere uma linha nova com versão 1, e
        // nada é apagado fisicamente → a soma SÓ SOBE. Nunca volta a um valor anterior (vazio → preenchido → vazio = outro número).
        // Campo que nunca teve linha = "0".
        $n = 0; foreach ($linhas as $r) $n += (int) $r['versao'];
        return (string) $n;
    }

    /** DSHOW-034: operação sobre o conjunto inteiro (limpar, mudar estado) exige versao_conjunto, conferida sob trava. */
    private static function conferirConjunto(array $b, array $trilha): void
    {
        $vc = $b['versao_conjunto'] ?? null;
        if (!is_string($vc) || !preg_match('/^(0|[1-9][0-9]{0,15})$/', $vc)) throw new AtributosErro('VALIDATION_ERROR', 422, 'Falta a versão do conjunto de opções. Recarregue a ficha.', ['versao_conjunto']);
        if ($vc !== self::versaoConjunto($trilha)) throw new AtributosErro('CONFLICT', 409, 'Outra pessoa alterou as opções deste campo. Recarregue e tente de novo.');
    }

    private static function mesmoValor(array $antes, array $d): bool
    {
        $num = static fn($x) => $x === null ? null : self::decimalCanonico($x);
        $na = $num($antes['valor_num'] ?? null); $nd = $num($d['valor_num']);
        return ($antes['estado'] ?? null) === $d['estado']
            && (($antes['opcao_id'] ?? null) === null ? null : (int) $antes['opcao_id']) === ($d['opcao_id'] === null ? null : (int) $d['opcao_id'])
            && ($antes['valor_texto'] ?? null) === $d['valor_texto']
            && (($na === null || $nd === null) ? $na === $nd : self::comparar($na, $nd) === 0)
            && (($antes['valor_bool'] ?? null) === null ? null : (int) $antes['valor_bool']) === ($d['valor_bool'] === null ? null : (int) $d['valor_bool'])
            && (($antes['unidade_id'] ?? null) === null ? null : (int) $antes['unidade_id']) === (($d['unidade_id'] ?? null) === null ? null : (int) $d['unidade_id'])
            && (($antes['valor_data'] ?? null) === null ? null : substr((string) $antes['valor_data'], 0, 10)) === $d['valor_data'];
    }

    /** P2-01: decimal em TEXTO canônico (sinal, inteiro sem zeros à esquerda, fração como veio); null = não é decimal da ficha (≤ 14 dígitos inteiros). */
    public static function decimalCanonico(mixed $v): ?string
    {
        if (is_int($v)) $v = (string) $v;
        elseif (is_float($v)) { if (!is_finite($v)) return null; $v = json_encode($v); }   // menor representação exata do float recebido
        if (!is_string($v) || !preg_match('/^(-?)([0-9]+)(?:\.([0-9]+))?$/', trim($v), $m)) return null;
        $int = ltrim($m[2], '0'); if ($int === '') $int = '0';
        if (strlen($int) > 14) return null;
        $frac = $m[3] ?? '';
        $zero = $int === '0' && trim($frac, '0') === '';
        return ($m[1] === '-' && !$zero ? '-' : '') . $int . ($frac !== '' ? '.' . $frac : '');
    }

    /** P2-01: arredonda o decimal em texto a $casas casas (meio para longe do zero), sem float. Devolve exatamente $casas casas. */
    private static function arredondar(string $s, int $casas): string
    {
        $neg = str_starts_with($s, '-'); if ($neg) $s = substr($s, 1);
        [$i, $f] = array_pad(explode('.', $s, 2), 2, '');
        $f = str_pad($f, $casas + 1, '0');
        $dig = str_split($i . substr($f, 0, $casas));
        if ((int) $f[$casas] >= 5) {
            for ($k = count($dig) - 1; $k >= 0; $k--) { if ($dig[$k] === '9') { $dig[$k] = '0'; continue; } $dig[$k] = (string) ((int) $dig[$k] + 1); break; }
            if ($k < 0) array_unshift($dig, '1');
        }
        $t = implode('', $dig);
        $ip = ltrim(substr($t, 0, strlen($t) - $casas), '0'); if ($ip === '') $ip = '0';
        $r = $ip . ($casas > 0 ? '.' . substr($t, -$casas) : '');
        return $neg && trim($r, '0.') !== '' ? '-' . $r : $r;
    }

    private static function semZerosFinais(string $s): string
    {
        if (!str_contains($s, '.')) return $s;
        $s = rtrim(rtrim($s, '0'), '.');
        return $s === '-0' ? '0' : $s;
    }

    /** P2-01: compara dois decimais em texto canônico (-1, 0, 1), sem float. */
    private static function comparar(string $a, string $b): int
    {
        $na = str_starts_with($a, '-'); $nb = str_starts_with($b, '-');
        [$ai, $af] = array_pad(explode('.', ltrim($a, '-'), 2), 2, '');
        [$bi, $bf] = array_pad(explode('.', ltrim($b, '-'), 2), 2, '');
        $ai = ltrim($ai, '0'); $bi = ltrim($bi, '0');
        $len = max(strlen($af), strlen($bf)); $af = str_pad($af, $len, '0'); $bf = str_pad($bf, $len, '0');
        if ($ai === '' && trim($af, '0') === '') $na = false;
        if ($bi === '' && trim($bf, '0') === '') $nb = false;
        if ($na !== $nb) return $na ? -1 : 1;
        $c = (strlen($ai) <=> strlen($bi)) ?: (strcmp($ai, $bi) <=> 0) ?: (strcmp($af, $bf) <=> 0);
        return $na ? -$c : $c;
    }
}
