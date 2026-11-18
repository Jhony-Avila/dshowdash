<?php
// Equipamentos › Atributos — repositório e catálogo EM MEMÓRIA dos testes (extraídos de servico.php no V5 Lote 3 para servirem também a
// golden-ficha.php e lote3.php). Sem banco. O comportamento das transações/travas reais é provado em repo-mysql.php (P1-10).
declare(strict_types=1);
require_once __DIR__ . '/../../../api/atributos/AtributosService.php';

final class RepoMemoria implements AtributosRepositorio
{
    public array $a = [], $o = [], $u = [], $g = [], $ge = [], $ga = [], $v = [], $aud = [], $vin = [];
    public bool $falharAuditoria = false;
    /** V5 Lote 3: gancho executado ao ABRIR a transação (simula outra conexão que gravou entre a validação e a transação — ATR-06). */
    public ?Closure $aoAbrirTransacao = null;
    /** V5 Lote 3: travas pedidas ao repositório (prova de que o serviço trava na ordem certa; o efeito real é provado no MySQL, P1-10). */
    public array $travas = [];
    private int $seq = 0;
    public function transacao(callable $f): mixed { if ($this->aoAbrirTransacao) { $g = $this->aoAbrirTransacao; $this->aoAbrirTransacao = null; $g($this); } $snap = [$this->a, $this->o, $this->u, $this->g, $this->ge, $this->ga, $this->v, $this->aud]; try { return $f(); } catch (Throwable $t) { [$this->a, $this->o, $this->u, $this->g, $this->ge, $this->ga, $this->v, $this->aud] = $snap; throw $t; } }
    public function gruposAplicaveis(string $c, ?string $s): array { $out = []; foreach ($this->g as $id => $g) { if (!$g['ativo']) continue; foreach ($this->ge[$id] ?? [] as $e) if ($e['categoria'] === $c && ($e['subcategoria'] === '' || $e['subcategoria'] === (string) $s)) { $out[] = $g + ['escopo_categoria' => $e['categoria'], 'escopo_subcategoria' => $e['subcategoria']]; break; } } usort($out, fn($x, $y) => [$x['nome'], $x['id']] <=> [$y['nome'], $y['id']]); return $out; }
    public function vinculosLegado(int $pid): array { return array_values(array_filter($this->vin, fn($x) => $x['product_id'] === $pid)); }
    private function id(): int { return ++$this->seq; }
    public function listarAtributos(?string $busca, ?string $tipo, bool $inativos): array { return array_values(array_filter($this->a, fn($x) => ($inativos || $x['ativo']) && ($tipo === null || $x['tipo'] === $tipo) && ($busca === null || str_contains(mb_strtolower($x['rotulo'] . $x['codigo']), mb_strtolower($busca))))); }
    public function atributo(int $id): ?array { return $this->a[$id] ?? null; }
    public function codigoExiste(string $c, ?int $exceto): bool { foreach ($this->a as $x) if ($x['codigo'] === $c && $x['id'] !== ($exceto ?? 0)) return true; return false; }
    public function criarAtributo(array $d): int { $id = $this->id(); $this->a[$id] = $d + ['id' => $id, 'ativo' => 1, 'versao' => 1, 'unidade_id' => null, 'casas' => null, 'minimo' => null, 'maximo' => null, 'descricao' => null]; return $id; }
    public function atualizarAtributo(int $id, int $versao, array $d): bool { if (!isset($this->a[$id]) || $this->a[$id]['versao'] !== $versao) return false; $this->a[$id] = $d + $this->a[$id]; $this->a[$id]['versao']++; return true; }
    public function contarValores(int $aid, bool $travar = false): int { if ($travar) $this->travas[] = ['valores_do_atributo', $aid]; return count(array_filter($this->v, fn($x) => $x['atributo_id'] === $aid && $x['estado'] === 'informado' && empty($x['excluido_em']))); }
    public function travarAtributo(int $id, bool $exclusivo): ?array { $this->travas[] = ['atributo', $id, $exclusivo ? 'exclusiva' : 'compartilhada']; return $this->a[$id] ?? null; }
    public function travarValores(int $pid, int $aid): array { $this->travas[] = ['valores', $pid, $aid]; return array_values(array_filter($this->v, fn($x) => $x['product_id'] === $pid && $x['atributo_id'] === $aid)); }
    public function excluirValor(int $pid, int $aid, int $k): bool { $c = "$pid:$aid:$k"; if (!isset($this->v[$c]) || !empty($this->v[$c]['excluido_em'])) return false; $this->v[$c]['excluido_em'] = 'agora'; $this->v[$c]['versao']++; return true; }
    public function opcoes(int $aid): array { $r = array_values(array_filter($this->o, fn($x) => $x['atributo_id'] === $aid)); usort($r, fn($x, $y) => [$x['posicao'], $x['id']] <=> [$y['posicao'], $y['id']]); return $r; }
    public function renomearOpcao(int $id, string $r, string $atual): bool { if (($this->o[$id]['rotulo'] ?? null) !== $atual) return false; $this->o[$id]['rotulo'] = $r; return true; }
    public function definirPosicaoOpcao(int $id, int $aid, int $p): bool { if (($this->o[$id]['atributo_id'] ?? null) === $aid) $this->o[$id]['posicao'] = $p; return true; }
    public function criarOpcao(int $aid, string $r, int $p): int { $id = $this->id(); $this->o[$id] = ['id' => $id, 'atributo_id' => $aid, 'rotulo' => $r, 'posicao' => $p, 'ativo' => 1]; return $id; }
    public function definirOpcaoAtiva(int $id, bool $at): bool { $this->o[$id]['ativo'] = $at ? 1 : 0; return true; }
    public function opcao(int $id): ?array { return $this->o[$id] ?? null; }
    public function unidades(): array { return array_values($this->u); }
    public function criarUnidade(string $s, string $n, ?string $g): int { $id = $this->id(); $this->u[$id] = ['id' => $id, 'simbolo' => $s, 'nome' => $n, 'grandeza' => $g, 'ativo' => 1]; return $id; }
    public function grupos(): array { return array_values(array_map(fn($g) => $this->grupo($g['id']), $this->g)); }
    public function grupo(int $id): ?array { return isset($this->g[$id]) ? $this->g[$id] + ['escopos' => $this->ge[$id] ?? [], 'atributos' => $this->ga[$id] ?? []] : null; }
    public function criarGrupo(string $n): int { $id = $this->id(); $this->g[$id] = ['id' => $id, 'nome' => $n, 'ativo' => 1, 'versao' => 1]; return $id; }
    public function atualizarGrupo(int $id, int $versao, array $d): bool { if ($this->g[$id]['versao'] !== $versao) return false; $this->g[$id] = $d + $this->g[$id]; $this->g[$id]['versao']++; return true; }
    public function definirEscopo(int $gid, array $e): void { $this->ge[$gid] = $e; }
    public function definirAtributosDoGrupo(int $gid, array $i): void { $this->ga[$gid] = $i; }
    public function valoresDoProduto(int $pid): array { return array_values(array_filter($this->v, fn($x) => $x['product_id'] === $pid && empty($x['excluido_em']))); }
    public function valor(int $pid, int $aid, int $k): ?array { return $this->v["$pid:$aid:$k"] ?? null; }
    public function gravarValor(array $d, ?int $versao): bool { $k = "{$d['product_id']}:{$d['atributo_id']}:{$d['opcao_chave']}"; if ($versao === null) { if (isset($this->v[$k])) return false; $this->v[$k] = $d + ['versao' => 1]; return true; } if (($this->v[$k]['versao'] ?? -1) !== $versao) return false; $this->v[$k] = $d + ['versao' => $versao + 1, 'excluido_em' => null]; return true; }
    public function unidade(int $id): ?array { return $this->u[$id] ?? null; }
    public function atualizarUnidade(int $id, array $d): bool { foreach (['nome', 'grandeza', 'ativo'] as $k) if (array_key_exists($k, $d)) $this->u[$id][$k] = $d[$k]; return true; }
    public function precificaRefExiste(string $r, ?int $ex): bool { foreach ($this->a as $x) if (($x['precifica_ref'] ?? null) === $r && $x['id'] !== ($ex ?? 0)) return true; return false; }
    public function auditoria(string $en, string $id, int $l): array { return array_values(array_filter($this->aud, fn($x) => $x[2] === $en && ($x[3] === $id || str_starts_with($x[3], "$id:")))); }
    public function removerValorOpcao(int $pid, int $aid, int $oid, int $versao): bool { $k = "$pid:$aid:$oid"; if (!isset($this->v[$k]) || !empty($this->v[$k]['excluido_em']) || $this->v[$k]['versao'] !== $versao) return false; $this->v[$k]['excluido_em'] = 'agora'; $this->v[$k]['versao']++; return true; }
    public function auditar(string $u, string $ac, string $en, string $id, ?array $an, ?array $de, ?string $m): void { if ($this->falharAuditoria) throw new RuntimeException('auditoria indisponível (simulada)'); $this->aud[] = [$u, $ac, $en, $id, $de, count($this->aud)]; }
    public function ultimaRevisao(int $pid): ?array { foreach (array_reverse($this->aud) as $x) if ($x[1] === 'revisar' && $x[2] === 'ficha' && $x[3] === (string) $pid) return ['usuario' => $x[0], 'criado_em' => 't' . $x[5], 'depois' => $x[4] ?? []]; return null; }
}

final class CatalogoMemoria implements CatalogoProdutos
{
    public bool $fora = false;
    public array $p = [
        7 => ['id' => 7, 'nome' => 'Módulo A (fictício)', 'categoria' => 'LED_PANEL', 'subcategoria' => 'LED_MODULE', 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null],
        8 => ['id' => 8, 'nome' => 'Módulo B (fictício)', 'categoria' => 'LED_PANEL', 'subcategoria' => 'LED_MODULE', 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null],
        9 => ['id' => 9, 'nome' => 'Módulo inativo (fictício)', 'categoria' => 'LED_PANEL', 'subcategoria' => 'LED_MODULE', 'ativo' => false, 'excluido' => false, 'sincronizado_em' => null],
        10 => ['id' => 10, 'nome' => 'Serviço (fictício)', 'categoria' => 'SERVICE', 'subcategoria' => 'INSTALLATION', 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null],
        11 => ['id' => 11, 'nome' => 'Excluído (fictício)', 'categoria' => 'LED_PANEL', 'subcategoria' => 'LED_MODULE', 'ativo' => true, 'excluido' => true, 'sincronizado_em' => null],
        12 => ['id' => 12, 'nome' => 'Processadora (fictícia)', 'categoria' => 'LED_PANEL', 'subcategoria' => 'PROCESSOR', 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null],
    ];
    public function produto(int $id): ?array { if ($this->fora) throw new CatalogoIndisponivel('fora'); return $this->p[$id] ?? null; }
    public array $specs = [];
    public function buscar(?string $q, int $l): array { if ($this->fora) throw new CatalogoIndisponivel('fora'); return array_values(array_filter($this->p, fn($x) => !$x['excluido'] && ($q === null || str_contains(mb_strtolower($x['nome']), mb_strtolower($q)) || (string) $x['id'] === $q))); }
    public function categorias(): array { $c = []; foreach ($this->p as $x) if (!$x['excluido']) { $k = $x['categoria'] . '|' . $x['subcategoria']; $c[$k] = ($c[$k] ?? 0) + 1; } return array_map(fn($k, $n) => ['categoria' => explode('|', $k)[0], 'subcategoria' => explode('|', $k)[1], 'produtos' => $n], array_keys($c), $c); }
    public function contar(string $c, string $s): int { return count(array_filter($this->p, fn($x) => !$x['excluido'] && $x['categoria'] === $c && ($s === '' || $x['subcategoria'] === $s))); }
    public function specs(int $pid, string $kind): ?array { return $this->specs[$pid][$kind] ?? ($this->specs === [] ? null : []); }
}
