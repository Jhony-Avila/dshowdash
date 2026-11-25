<?php
// tools/db/equipamentos-migrar.php — EXECUTOR de migrações do DSHOW_EQUIPAMENTOS (ATRIBUTOS-WEB, 18/11/2026).
// Formato da tabela = o que já existe em produção: eq_schema_migrations(version PK, checksum CHAR(64), applied_at).
//   version = nome do arquivo sem .sql (001_schema…); checksum = sha256 do arquivo. Cada migração grava a PRÓPRIA linha (checksum NULL) e o
//   executor preenche o sha256 logo depois (mesmo protocolo do scripts/setup/equipamentos-db-criar.sh do app, que aplicou 001–003).
// Regras:
//   - aplica em ordem os db/equipamentos/migrations/NNN_*.sql que faltam (os *.revert.sql ficam fora do glob);
//   - migração JÁ aplicada com checksum diferente do arquivo → ABORTA sem alterar nada; checksum NULL (antes da 002) → preenche;
//   - retoma: a próxima execução começa da primeira não aplicada; --dry-run só mostra o plano;
//   - schema obrigatório por parâmetro e só `ATRWEB_VAL_*` (validação). Qualquer outro nome exige --modo-producao E a variável
//     ATR_MIGRAR_PRODUCAO=APLICAR-NO-PORTAO (fluxo do portão P1; não usado na missão de 18/11).
//   - --reverter <versao>: roda o <versao>.revert.sql (só validação) se ela for a ÚLTIMA aplicada.
//   - TRIPWIRE (Codex DSHOW-115B, P8; proposta da ESQUERDA): em PRODUÇÃO (--modo-producao) a 012 e a 013 só são gravadas (aplicar OU
//     --registrar-se-completo) com a PROVA do tripwire da Conferência-C em ATR_TRIPWIRE_PROVA: arquivo regular de root, sem permissão para
//     grupo/outros, com até 15 min, 1ª linha EQUIVALENCIA_OK, ALVO=<sha40 desta release> e SHA012=/SHA013= iguais aos arquivos que vão ser
//     aplicados. Sem prova válida → MIGRAR_FALHOU antes de QUALQUER DDL/ledger. Validação, --dry-run, --verificar e 012/013 já no ledger: não exige.
//   - LACUNA (013, 23/11): RECUSA aplicar se existe migração PENDENTE com número MENOR que uma já aplicada (ex.: 012 pendente com 013
//     aplicada) — fora de ordem o --reverter (que vai pelo nome) e o preflight virtual deixam de valer. --ate <versao> aplica só até ela.
//   - PREFLIGHT POR OBJETO (DSHOW-036): antes de QUALQUER DDL (inclusive no --dry-run), cada comando das migrações é lido e vira objetos
//     esperados (tabela/coluna/índice/FK, "existe depois" ou "não existe depois" para DROP), conferidos no information_schema:
//       · migração pendente "limpa" (nenhum objeto já no estado final) → aplica;
//       · pendente "completa sem ledger" (todos já no estado final) → RECUSA, salvo --registrar-se-completo <versao> (grava só o ledger);
//       · pendente "parcial" (parte aplicada: ex. interrupção depois do 1º ALTER) → RECUSA, listando por comando o que existe e o que falta;
//       · aplicada no ledger cujo objeto físico não está no estado esperado → RECUSA (ledger sem objeto);
//       · comando DDL que o preflight não sabe ler → RECUSA (estenda o preflight; nada de aplicar às cegas).
//     --verificar: só imprime o relatório do preflight (somente SELECT no information_schema), sem aplicar nada.
// Uso: php tools/db/equipamentos-migrar.php --schema ATRWEB_VAL_EQ --credenciais /caminho/arquivo.ini [--dry-run | --verificar]
//        [--reverter 009_sugestao] [--registrar-se-completo 004_vinculos_exclusao_logica] [--ate 012_kit_prioridade]
//   credenciais (600): user=…  password=…  socket=… (ou host=… port=…)
declare(strict_types=1);

final class MigradorErro extends RuntimeException {}

final class Migrador
{
    public const PREFIXO_VALIDACAO = 'ATRWEB_VAL_';

    public function __construct(private readonly PDO $pdo, private readonly string $schema, private readonly string $dir, private $log) {}

    /** Codex 115B P8: em produção, 012 e 013 só com a PROVA do tripwire da Conferência-C (ATR_TRIPWIRE_PROVA). */
    public const EXIGEM_TRIPWIRE = ['012_kit_prioridade', '013_sugestao_estados'];
    public bool $modoProducao = false;

    /** Versões que ESTA execução gravaria (aplicar ou registrar) e que exigem a prova → [versao => sha256 do arquivo]. Pura (sem banco). */
    public static function exigemProva(array $arquivos, array $feitas, ?string $ate): array
    {
        $vao = [];
        foreach ($arquivos as $v => $f) {
            if ($ate !== null && strcmp($v, $ate) > 0) break;
            if (!array_key_exists($v, $feitas) && in_array($v, self::EXIGEM_TRIPWIRE, true)) $vao[$v] = hash_file('sha256', $f);
        }
        return $vao;
    }

    /** SHA da release em que o migrador roda: RELEASE_SHA na raiz, senão o nome da pasta da release (as releases têm o sha40 como nome). */
    public static function shaDaRelease(string $raiz): string
    {
        $f = $raiz . '/RELEASE_SHA';
        if (is_file($f) && !is_link($f)) { $v = trim((string) file_get_contents($f)); if (preg_match('/^[0-9a-f]{40}$/', $v)) return $v; }
        $b = basename((string) realpath($raiz));
        return preg_match('/^[0-9a-f]{40}$/', $b) ? $b : '';
    }

    public static function conferirProvaTripwire(?string $arq, string $releaseSha, array $shas, int $agora, int $maxIdade = 900): void
    {
        $nada = '; nada foi alterado (rode pelo portão CONFERENCIA-C)';
        if ($arq === null || $arq === '') throw new MigradorErro('a 012/013 exigem a prova do tripwire (ATR_TRIPWIRE_PROVA)' . $nada);
        clearstatcache(true, $arq);
        if (is_link($arq) || !is_file($arq)) throw new MigradorErro("prova do tripwire não é arquivo regular: $arq" . $nada);
        $st = stat($arq);
        if ($st === false || $st['uid'] !== 0 || ($st['mode'] & 0077) !== 0) throw new MigradorErro('prova do tripwire com dono/modo inseguro' . $nada);
        if ($agora - $st['mtime'] > $maxIdade || $st['mtime'] > $agora + 60) throw new MigradorErro("prova do tripwire fora do prazo ({$maxIdade}s)" . $nada);
        $l = array_map('rtrim', file($arq) ?: []);
        if (($l[0] ?? '') !== 'EQUIVALENCIA_OK') throw new MigradorErro('prova do tripwire sem EQUIVALENCIA_OK' . $nada);
        if (!preg_match('/^[0-9a-f]{40}$/', $releaseSha) || !in_array("ALVO=$releaseSha", $l, true)) throw new MigradorErro('prova do tripwire de outro ALVO' . $nada);
        foreach ($shas as $v => $sha) if (!in_array('SHA' . substr((string) $v, 0, 3) . "=$sha", $l, true)) throw new MigradorErro("prova do tripwire não confere a $v" . $nada);
    }

    public static function validarSchema(string $schema, bool $modoProducao, ?string $senhaPortao): void
    {
        if (!preg_match('/^[A-Za-z0-9_]{1,64}$/', $schema)) throw new MigradorErro("schema inválido: $schema");
        if (str_starts_with($schema, self::PREFIXO_VALIDACAO)) return;
        if (!$modoProducao || $senhaPortao !== 'APLICAR-NO-PORTAO') {
            throw new MigradorErro("recusado: '$schema' não começa com " . self::PREFIXO_VALIDACAO . ' (produção só no portão, com --modo-producao)');
        }
    }

    /** @return array<string,string> versao => caminho, em ordem */
    public function arquivos(): array
    {
        $out = [];
        foreach (glob($this->dir . '/[0-9][0-9][0-9]_*.sql') ?: [] as $f) {
            if (str_ends_with($f, '.revert.sql')) continue;
            $out[basename($f, '.sql')] = $f;
        }
        ksort($out, SORT_STRING);
        return $out;
    }

    private function q(string $sql, array $p = []): array { $st = $this->pdo->prepare($sql); $st->execute($p); return $st->fetchAll(PDO::FETCH_ASSOC); }

    private function temTabela(string $t): bool
    {
        return (bool) $this->q('SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ?', [$this->schema, $t]);
    }

    private function temColuna(string $t, string $c): bool
    {
        return (bool) $this->q('SELECT 1 FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?', [$this->schema, $t, $c]);
    }

    /** @return array<string,?string> versao => checksum */
    public function aplicadas(): array
    {
        if (!$this->temTabela('eq_schema_migrations')) return [];
        $col = $this->temColuna('eq_schema_migrations', 'checksum') ? 'checksum' : 'NULL AS checksum';
        $out = [];
        foreach ($this->q("SELECT version, $col FROM `{$this->schema}`.`eq_schema_migrations` ORDER BY version") as $r) $out[(string) $r['version']] = $r['checksum'];
        return $out;
    }

    /** Divide um arquivo SQL em comandos (fora de aspas e comentários). As migrações não usam DELIMITER nem rotinas. */
    public static function comandos(string $sql): array
    {
        $out = []; $buf = ''; $n = strlen($sql); $q = null;
        for ($i = 0; $i < $n; $i++) {
            $c = $sql[$i]; $prox = $sql[$i + 1] ?? '';
            if ($q !== null) {
                $buf .= $c;
                if ($c === '\\' && $q !== '`') { $buf .= $prox; $i++; continue; }
                if ($c === $q) { if ($prox === $q) { $buf .= $prox; $i++; } else $q = null; }
                continue;
            }
            if ($c === '-' && $prox === '-' && (($sql[$i + 2] ?? ' ') === ' ' || ($sql[$i + 2] ?? '') === "\t" || ($sql[$i + 2] ?? "\n") === "\n")) { $j = strpos($sql, "\n", $i); $i = $j === false ? $n : $j; $buf .= "\n"; continue; }
            if ($c === '#') { $j = strpos($sql, "\n", $i); $i = $j === false ? $n : $j; $buf .= "\n"; continue; }
            if ($c === '/' && $prox === '*') { $j = strpos($sql, '*/', $i + 2); $i = $j === false ? $n : $j + 1; continue; }
            if ($c === "'" || $c === '"' || $c === '`') { $q = $c; $buf .= $c; continue; }
            if ($c === ';') { if (trim($buf) !== '') $out[] = trim($buf); $buf = ''; continue; }
            $buf .= $c;
        }
        if (trim($buf) !== '') $out[] = trim($buf);
        return $out;
    }

    // ===================================================================================================== PREFLIGHT POR OBJETO (DSHOW-036)

    /** Divide no nível 0 de parênteses, fora de aspas. */
    private static function dividirTopo(string $s): array
    {
        $out = []; $buf = ''; $d = 0; $q = null; $n = strlen($s);
        for ($i = 0; $i < $n; $i++) {
            $c = $s[$i];
            if ($q !== null) { $buf .= $c; if ($c === '\\' && $q !== '`') { $buf .= $s[$i + 1] ?? ''; $i++; continue; } if ($c === $q) { if (($s[$i + 1] ?? '') === $q) { $buf .= $q; $i++; } else $q = null; } continue; }
            if ($c === "'" || $c === '"' || $c === '`') { $q = $c; $buf .= $c; continue; }
            if ($c === '(') $d++; elseif ($c === ')') $d--;
            if ($c === ',' && $d === 0) { $out[] = trim($buf); $buf = ''; continue; }
            $buf .= $c;
        }
        if (trim($buf) !== '') $out[] = trim($buf);
        return $out;
    }

    private const ID = '(?:`((?:[^`]|``)+)`|([A-Za-z0-9_$]+))';

    private static function nomeId(array $m, int $g): string { return ($m[$g] ?? '') !== '' ? str_replace('``', '`', $m[$g]) : (string) ($m[$g + 1] ?? ''); }

    /**
     * Lê UM comando e devolve o que ele faz fisicamente.
     * @return array{tipo:string, resumo:string, objetos:list<array{tipo:string,tabela:string,nome:string,depois:bool}>, erro:?string}
     *   tipo: 'ddl' | 'ledger' (INSERT/UPDATE em eq_schema_migrations) | 'dados' (outro DML) | 'desconhecido' (DDL não suportado)
     */
    public static function objetosDoComando(string $cmd): array
    {
        $c = trim(preg_replace('/\s+/', ' ', $cmd));
        $resumo = mb_substr($c, 0, 90);
        $I = self::ID; $T = "(?:$I\\.)?$I"; // [schema.]tabela → grupos 1-2 (schema), 3-4 (tabela)
        $obj = [];
        if (preg_match("/^CREATE TABLE (?:IF NOT EXISTS )?$T ?\\((.*)\\)[^)]*$/is", $c, $m)) {
            $t = self::nomeId($m, 3);
            $obj[] = ['tipo' => 'tabela', 'tabela' => $t, 'nome' => $t, 'depois' => true];
            foreach (self::dividirTopo($m[5]) as $it) {
                if (preg_match("/^PRIMARY KEY/i", $it)) continue;
                if (preg_match("/^(?:UNIQUE |FULLTEXT |SPATIAL )?(?:KEY|INDEX) $I/i", $it, $k)) { $obj[] = ['tipo' => 'indice', 'tabela' => $t, 'nome' => self::nomeId($k, 1), 'depois' => true]; continue; }
                if (preg_match("/^UNIQUE $I/i", $it, $k)) { $obj[] = ['tipo' => 'indice', 'tabela' => $t, 'nome' => self::nomeId($k, 1), 'depois' => true]; continue; }
                if (preg_match("/^CONSTRAINT $I FOREIGN KEY/i", $it, $k)) { $obj[] = ['tipo' => 'fk', 'tabela' => $t, 'nome' => self::nomeId($k, 1), 'depois' => true]; continue; }
                if (preg_match("/^CONSTRAINT $I UNIQUE/i", $it, $k)) { $obj[] = ['tipo' => 'indice', 'tabela' => $t, 'nome' => self::nomeId($k, 1), 'depois' => true]; continue; }
                if (preg_match("/^$I /", $it, $k) && !preg_match('/^(CONSTRAINT|CHECK|FOREIGN|PRIMARY|KEY|INDEX|UNIQUE)\b/i', $it)) { $obj[] = ['tipo' => 'coluna', 'tabela' => $t, 'nome' => self::nomeId($k, 1), 'depois' => true]; continue; }
                return ['tipo' => 'desconhecido', 'resumo' => $resumo, 'objetos' => [], 'erro' => "item de CREATE TABLE não suportado: " . mb_substr($it, 0, 60)];
            }
            return ['tipo' => 'ddl', 'resumo' => $resumo, 'objetos' => $obj, 'erro' => null];
        }
        if (preg_match("/^ALTER TABLE $T (.*)$/is", $c, $m)) {
            $t = self::nomeId($m, 3);
            foreach (self::dividirTopo($m[5]) as $cl) {
                if (preg_match("/^ADD (?:UNIQUE |FULLTEXT |SPATIAL )?(?:KEY|INDEX) $I/i", $cl, $k)) $obj[] = ['tipo' => 'indice', 'tabela' => $t, 'nome' => self::nomeId($k, 1), 'depois' => true];
                elseif (preg_match("/^ADD UNIQUE $I/i", $cl, $k)) $obj[] = ['tipo' => 'indice', 'tabela' => $t, 'nome' => self::nomeId($k, 1), 'depois' => true];
                elseif (preg_match("/^ADD CONSTRAINT $I FOREIGN KEY/i", $cl, $k)) $obj[] = ['tipo' => 'fk', 'tabela' => $t, 'nome' => self::nomeId($k, 1), 'depois' => true];
                elseif (preg_match("/^ADD CONSTRAINT $I UNIQUE/i", $cl, $k)) $obj[] = ['tipo' => 'indice', 'tabela' => $t, 'nome' => self::nomeId($k, 1), 'depois' => true];
                elseif (preg_match("/^ADD (?:COLUMN )?$I /i", $cl, $k) && !preg_match('/^ADD (CONSTRAINT|PRIMARY|CHECK|FOREIGN|PARTITION)\b/i', $cl)) $obj[] = ['tipo' => 'coluna', 'tabela' => $t, 'nome' => self::nomeId($k, 1), 'depois' => true];
                elseif (preg_match("/^MODIFY (?:COLUMN )?$I ENUM\\s*\\((.*)\\)/is", $cl, $k) && preg_match_all("/'((?:[^']|'')*)'/", $k[3], $vs))   // 013: só ampliar ENUM
                    $obj[] = ['tipo' => 'enum', 'tabela' => $t, 'nome' => self::nomeId($k, 1), 'valores' => array_map(static fn($x) => str_replace("''", "'", $x), $vs[1]), 'depois' => true];
                elseif (preg_match("/^ADD CONSTRAINT $I CHECK\\b/i", $cl, $k)) $obj[] = ['tipo' => 'check', 'tabela' => $t, 'nome' => self::nomeId($k, 1), 'depois' => true];   // 013: trava do revert
                elseif (preg_match("/^DROP CHECK $I$/i", $cl, $k)) $obj[] = ['tipo' => 'check', 'tabela' => $t, 'nome' => self::nomeId($k, 1), 'depois' => false];
                elseif (preg_match("/^DROP FOREIGN KEY $I/i", $cl, $k)) $obj[] = ['tipo' => 'fk', 'tabela' => $t, 'nome' => self::nomeId($k, 1), 'depois' => false];
                elseif (preg_match("/^DROP (?:KEY|INDEX) $I/i", $cl, $k)) $obj[] = ['tipo' => 'indice', 'tabela' => $t, 'nome' => self::nomeId($k, 1), 'depois' => false];
                elseif (preg_match("/^DROP (?:COLUMN )?$I$/i", $cl, $k) && !preg_match('/^DROP (PRIMARY|CONSTRAINT|CHECK|PARTITION)\b/i', $cl)) $obj[] = ['tipo' => 'coluna', 'tabela' => $t, 'nome' => self::nomeId($k, 1), 'depois' => false];
                else return ['tipo' => 'desconhecido', 'resumo' => $resumo, 'objetos' => [], 'erro' => "cláusula de ALTER TABLE não suportada pelo preflight: " . mb_substr($cl, 0, 60)];
            }
            return ['tipo' => 'ddl', 'resumo' => $resumo, 'objetos' => $obj, 'erro' => null];
        }
        if (preg_match("/^CREATE (?:UNIQUE |FULLTEXT |SPATIAL )?INDEX $I ON $T/i", $c, $m)) {
            return ['tipo' => 'ddl', 'resumo' => $resumo, 'objetos' => [['tipo' => 'indice', 'tabela' => self::nomeId($m, 5), 'nome' => self::nomeId($m, 1), 'depois' => true]], 'erro' => null];
        }
        if (preg_match("/^DROP TABLE (?:IF EXISTS )?$T$/i", $c, $m)) {
            $t = self::nomeId($m, 3);
            return ['tipo' => 'ddl', 'resumo' => $resumo, 'objetos' => [['tipo' => 'tabela', 'tabela' => $t, 'nome' => $t, 'depois' => false]], 'erro' => null];
        }
        if (preg_match("/^(?:INSERT(?: IGNORE)? INTO|UPDATE|REPLACE INTO) $T/i", $c, $m) && self::nomeId($m, 3) === 'eq_schema_migrations') return ['tipo' => 'ledger', 'resumo' => $resumo, 'objetos' => [], 'erro' => null];
        if (preg_match('/^(INSERT|UPDATE|DELETE|REPLACE|SET|SELECT)\b/i', $c)) return ['tipo' => 'dados', 'resumo' => $resumo, 'objetos' => [], 'erro' => null];
        return ['tipo' => 'desconhecido', 'resumo' => $resumo, 'objetos' => [], 'erro' => 'comando não suportado pelo preflight: ' . $resumo];
    }

    /** Objetos esperados de um arquivo de migração, por comando (1-based). */
    public static function objetosDaMigracao(string $sql): array
    {
        $out = [];
        foreach (self::comandos($sql) as $i => $cmd) $out[$i + 1] = self::objetosDoComando($cmd);
        return $out;
    }

    private function existe(array $o): bool
    {
        return match ($o['tipo']) {
            'tabela' => $this->temTabela($o['tabela']),
            'coluna' => $this->temColuna($o['tabela'], $o['nome']),
            'indice' => (bool) $this->q('SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1', [$this->schema, $o['tabela'], $o['nome']]),
            'fk'     => (bool) $this->q("SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = ? AND table_name = ? AND constraint_name = ? AND constraint_type = 'FOREIGN KEY'", [$this->schema, $o['tabela'], $o['nome']]),
            'check'  => (bool) $this->q("SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = ? AND table_name = ? AND constraint_name = ? AND constraint_type = 'CHECK'", [$this->schema, $o['tabela'], $o['nome']]),
            'enum'   => self::enumContem($this->q('SELECT column_type AS t FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?', [$this->schema, $o['tabela'], $o['nome']])[0]['t'] ?? null, $o['valores']),
        };
    }

    /** 013: a coluna ENUM existe e contém TODOS os valores pedidos (ampliar é aditivo; a ordem dos antigos é a do arquivo). */
    public static function enumContem(?string $tipoColuna, array $valores): bool
    {
        if ($tipoColuna === null || !preg_match('/^enum\((.*)\)$/is', $tipoColuna, $m) || !preg_match_all("/'((?:[^']|'')*)'/", $m[1], $vs)) return false;
        $tem = array_map(static fn($x) => str_replace("''", "'", $x), $vs[1]);
        return !array_diff($valores, $tem);
    }

    private static function chave(array $o): string { return "{$o['tipo']}:{$o['tabela']}.{$o['nome']}" . ($o['tipo'] === 'enum' ? '=' . implode(',', $o['valores']) : ''); }

    public static function rotulo(array $o): string
    {
        return ($o['depois'] ? '' : 'remoção de ') . match ($o['tipo']) { 'tabela' => "tabela {$o['tabela']}", 'coluna' => "coluna {$o['tabela']}.{$o['nome']}", 'indice' => "índice {$o['tabela']}.{$o['nome']}", 'fk' => "FK {$o['tabela']}.{$o['nome']}", 'check' => "CHECK {$o['tabela']}.{$o['nome']}", 'enum' => "valores do ENUM {$o['tabela']}.{$o['nome']} (" . implode(', ', $o['valores']) . ')' };
    }

    /**
     * Relatório do preflight (só SELECT no information_schema). Por migração:
     *   ledger (bool), estado: 'ok' (no ledger e físico confere) | 'ledger_sem_objeto' | 'limpo' | 'completo_sem_ledger' | 'parcial' | 'sem_ddl' | 'nao_verificavel',
     *   comandos[i] = {tipo, resumo, erro, objetos[{tipo,tabela,nome,depois,existe,no_estado_final}]}, faltam[], presentes[].
     * As do ledger são conferidas contra o estado final prometido pelo conjunto do ledger (último efeito de cada objeto).
     * As pendentes são avaliadas em ordem sobre um estado VIRTUAL (físico + efeito das pendentes anteriores), para que uma pendente que remove
     * o que outra pendente cria não pareça "já aplicada".
     */
    public function preflight(): array
    {
        $feitas = $this->aplicadas();
        $virt = []; $cache = [];
        $fis = function (array $o) use (&$cache): bool { $k = self::chave($o); return $cache[$k] ??= $this->existe($o); };
        $rel = []; $lidas = [];
        foreach ($this->arquivos() as $v => $f) $lidas[$v] = self::objetosDaMigracao((string) file_get_contents($f));
        // estado final que o LEDGER promete: o último efeito, em ordem de versão, das migrações registradas (uma posterior pode remover o que outra criou)
        $promessa = [];
        foreach ($lidas as $v => $cmds) if (array_key_exists($v, $feitas)) foreach ($cmds as $c) foreach ($c['objetos'] as $o) $promessa[self::chave($o)] = $o['depois'];
        foreach ($lidas as $v => $cmds) {
            $noLedger = array_key_exists($v, $feitas);
            $tot = 0; $fim = 0; $faltam = []; $presentes = []; $erro = null;
            foreach ($cmds as $i => &$c) {
                if ($c['erro'] !== null && $erro === null) $erro = "comando $i: {$c['erro']}";
                foreach ($c['objetos'] as &$o) {
                    $k = self::chave($o);
                    // ledger: compara com o físico; pendente: com o virtual
                    $o['existe'] = $noLedger ? $fis($o) : (array_key_exists($k, $virt) ? $virt[$k] : $fis($o));
                    $o['no_estado_final'] = $o['existe'] === ($noLedger ? $promessa[$k] : $o['depois']);
                    $tot++;
                    if ($o['no_estado_final']) { $fim++; $presentes[] = "cmd $i: " . self::rotulo($o); } else $faltam[] = "cmd $i: " . self::rotulo($o);
                    $virt[$k] = $o['depois'];
                }
                unset($o);
            }
            unset($c);
            if ($erro !== null) $estado = 'nao_verificavel';
            elseif ($noLedger) $estado = $fim === $tot ? 'ok' : 'ledger_sem_objeto';
            elseif ($tot === 0) $estado = 'sem_ddl';
            elseif ($fim === 0) $estado = 'limpo';
            elseif ($fim === $tot) $estado = 'completo_sem_ledger';
            else $estado = 'parcial';
            $rel[$v] = ['versao' => $v, 'ledger' => $noLedger, 'estado' => $estado, 'objetos' => $tot, 'no_estado_final' => $fim,
                        'faltam' => $faltam, 'presentes' => $presentes, 'erro' => $erro, 'comandos' => $cmds,
                        'tem_dados' => (bool) array_filter($cmds, static fn($c) => $c['tipo'] === 'dados')];
        }
        return $rel;
    }

    /** Texto de recusa (vazio = pode seguir). */
    public static function recusasDoPreflight(array $rel, array $registrarSeCompleto = []): array
    {
        $out = [];
        foreach ($rel as $v => $r) {
            $lista = static fn(array $l) => implode('; ', $l) ?: '-';
            switch ($r['estado']) {
                case 'ledger_sem_objeto':
                    $out[] = "$v consta no ledger mas o físico não confere — fora do estado esperado: {$lista($r['faltam'])}"; break;
                case 'parcial':
                    $out[] = "$v PARCIAL (sem ledger): {$r['no_estado_final']}/{$r['objetos']} objetos já aplicados. JÁ EXISTE: {$lista($r['presentes'])}. FALTA: {$lista($r['faltam'])}. "
                           . "Recuperar ANTES de migrar: desfazer a parte aplicada (comandos correspondentes do $v.revert.sql) ou completar os comandos que faltam e usar --registrar-se-completo $v"; break;
                case 'completo_sem_ledger':
                    if (in_array($v, $registrarSeCompleto, true)) {
                        if ($r['tem_dados']) $out[] = "$v: --registrar-se-completo recusado — a migração tem comandos de dados que o preflight não confere";
                        break;
                    }
                    $out[] = "$v já está fisicamente COMPLETA ({$r['objetos']} objetos) mas não consta no ledger — conferir e, se for o caso, rodar com --registrar-se-completo $v (grava só o ledger, nenhum DDL)"; break;
                case 'nao_verificavel':
                    if (!$r['ledger']) $out[] = "$v: preflight não sabe verificar — {$r['erro']} (estenda Migrador::objetosDoComando antes de aplicar)"; break;
            }
        }
        foreach ($registrarSeCompleto as $v) if (($rel[$v]['estado'] ?? null) !== 'completo_sem_ledger') $out[] = "--registrar-se-completo $v recusado: estado é " . ($rel[$v]['estado'] ?? 'inexistente') . ' (só vale para migração fisicamente completa e fora do ledger)';
        return $out;
    }

    /** @return array{aplicadas:string[], conferidas:string[], checksum_preenchido:string[], registradas:string[]} */
    public function executar(bool $seco, array $registrarSeCompleto = [], ?string $ate = null): array
    {
        $res = ['aplicadas' => [], 'conferidas' => [], 'checksum_preenchido' => [], 'registradas' => []];
        $feitas = $this->aplicadas();
        if ($ate !== null && !isset($this->arquivos()[$ate])) throw new MigradorErro("--ate $ate: não existe esse arquivo de migração; nada foi alterado");
        // 013: LACUNA — pendente com número menor que uma aplicada (o ledger ficaria fora de ordem). Nada é aplicado.
        $aplicadasComArquivo = array_values(array_filter(array_keys($feitas), fn($v) => isset($this->arquivos()[$v])));
        $maior = $aplicadasComArquivo ? max($aplicadasComArquivo) : null;
        $lacunas = $maior === null ? [] : array_values(array_filter(array_keys($this->arquivos()), static fn($v) => !array_key_exists($v, $feitas) && strcmp($v, $maior) < 0));
        if ($lacunas) throw new MigradorErro('LACUNA: ' . implode(', ', $lacunas) . " pendente(s) abaixo de $maior já aplicada — fora de ordem; nada foi alterado. Resolva a ordem (ou reverta $maior na validação) antes de migrar");
        // 1) conferência de TUDO antes de aplicar qualquer coisa (checksum divergente aborta sem efeito)
        foreach ($this->arquivos() as $v => $f) {
            if (!array_key_exists($v, $feitas)) continue;
            $sha = hash_file('sha256', $f);
            $cur = $feitas[$v];
            if ($cur !== null && $cur !== '' && $cur !== $sha) throw new MigradorErro("$v já aplicada com checksum " . substr($cur, 0, 12) . "… ≠ arquivo " . substr($sha, 0, 12) . "… — o arquivo mudou depois de aplicado; nada foi alterado");
        }
        foreach ($feitas as $v => $cur) if (!isset($this->arquivos()[$v]) && !str_contains($v, '_revertida_')) ($this->log)("aviso: $v consta como aplicada mas não há arquivo");
        // 1b) PREFLIGHT por objeto (DSHOW-036): estado físico × ledger, antes de qualquer DDL (também no --dry-run)
        $pf = $this->preflight();
        $recusas = self::recusasDoPreflight($pf, $registrarSeCompleto);
        if ($recusas) throw new MigradorErro("preflight recusou — nenhum DDL executado:\n  - " . implode("\n  - ", $recusas));
        // 1c) TRIPWIRE (Codex 115B, P8): em produção, 012/013 (aplicar ou registrar) só com a prova da Conferência-C. Antes de QUALQUER gravação.
        if ($this->modoProducao && !$seco) {
            $vao = self::exigemProva($this->arquivos(), $feitas, $ate);
            if ($vao) self::conferirProvaTripwire(getenv('ATR_TRIPWIRE_PROVA') ?: null, self::shaDaRelease(__DIR__ . '/../..'), $vao, time());
        }
        // 2) aplica as que faltam, em ordem (com --ate, só até ela)
        foreach ($this->arquivos() as $v => $f) {
            if ($ate !== null && strcmp($v, $ate) > 0) break;
            $sha = hash_file('sha256', $f);
            if (array_key_exists($v, $feitas)) {
                if ($feitas[$v] === null || $feitas[$v] === '') {
                    if (!$seco && $this->temColuna('eq_schema_migrations', 'checksum')) { $this->pdo->prepare("UPDATE `{$this->schema}`.`eq_schema_migrations` SET checksum = ? WHERE version = ? AND checksum IS NULL")->execute([$sha, $v]); $res['checksum_preenchido'][] = $v; }
                } else $res['conferidas'][] = $v;
                continue;
            }
            if ($pf[$v]['estado'] === 'completo_sem_ledger') { // só chega aqui com --registrar-se-completo $v (as recusas acima garantem)
                ($this->log)(($seco ? '[seco] ' : '') . "registrar $v no ledger SEM DDL (fisicamente completa: {$pf[$v]['objetos']} objetos conferidos)");
                if (!$seco) {
                    if ($this->temColuna('eq_schema_migrations', 'checksum')) $this->pdo->prepare("INSERT INTO `{$this->schema}`.`eq_schema_migrations` (version, checksum) VALUES (?, ?)")->execute([$v, $sha]);
                    else $this->pdo->prepare("INSERT INTO `{$this->schema}`.`eq_schema_migrations` (version) VALUES (?)")->execute([$v]);
                }
                $res['registradas'][] = $v;
                continue;
            }
            ($this->log)(($seco ? '[seco] ' : '') . "aplicar $v (sha256 " . substr($sha, 0, 12) . '…)');
            if (!$seco) {
                $this->pdo->exec("USE `{$this->schema}`");
                foreach (self::comandos((string) file_get_contents($f)) as $cmd) $this->pdo->exec($cmd);
                if ($this->temColuna('eq_schema_migrations', 'checksum')) $this->pdo->prepare("UPDATE `{$this->schema}`.`eq_schema_migrations` SET checksum = ? WHERE version = ?")->execute([$sha, $v]);
                // migrações anteriores à coluna checksum (001 antes da 002) recebem o sha agora
                if ($this->temColuna('eq_schema_migrations', 'checksum')) foreach ($this->arquivos() as $v2 => $f2) $this->pdo->prepare("UPDATE `{$this->schema}`.`eq_schema_migrations` SET checksum = ? WHERE version = ? AND checksum IS NULL")->execute([hash_file('sha256', $f2), $v2]);
            }
            $res['aplicadas'][] = $v;
        }
        return $res;
    }

    public function reverter(string $versao): void
    {
        if (!str_starts_with($this->schema, self::PREFIXO_VALIDACAO)) throw new MigradorErro('reversão só em validação');
        $feitas = array_keys(array_filter($this->aplicadas(), static fn($c, $v) => !str_contains((string) $v, '_revertida_'), ARRAY_FILTER_USE_BOTH));
        sort($feitas, SORT_STRING);
        if (end($feitas) !== $versao) throw new MigradorErro("só a última aplicada pode ser revertida (última: " . (end($feitas) ?: '-') . ')');
        $f = $this->dir . "/$versao.revert.sql";
        if (!is_file($f)) throw new MigradorErro("sem arquivo de reversão: $versao.revert.sql");
        $this->pdo->exec("USE `{$this->schema}`");
        foreach (self::comandos((string) file_get_contents($f)) as $cmd) $this->pdo->exec($cmd);
        ($this->log)("revertida $versao");
    }
}

function migrador_conectar(string $credenciais): PDO
{
    if (!is_file($credenciais)) throw new MigradorErro("credenciais ausentes: $credenciais");
    if ((fileperms($credenciais) & 0077) !== 0) throw new MigradorErro('credenciais com permissão aberta (exige 600)');
    $c = parse_ini_file($credenciais, false, INI_SCANNER_RAW);
    if (!$c || empty($c['user'])) throw new MigradorErro('credenciais ilegíveis');
    // sem host nem socket no arquivo (ex.: cnf do root): o cliente mysql usa o socket local; aqui também (TCP 127.0.0.1 negaria o root@localhost)
    $sock = !empty($c['socket']) ? (string) $c['socket'] : (empty($c['host']) && is_readable('/var/run/mysqld/mysqld.sock') ? '/var/run/mysqld/mysqld.sock' : '');
    $dsn = $sock !== '' ? 'mysql:unix_socket=' . $sock . ';charset=utf8mb4' : 'mysql:host=' . ($c['host'] ?? '127.0.0.1') . ';port=' . ($c['port'] ?? '3306') . ';charset=utf8mb4';
    return new PDO($dsn, (string) $c['user'], (string) ($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $o = getopt('', ['schema:', 'credenciais:', 'dry-run', 'reverter:', 'modo-producao', 'dir:', 'verificar', 'registrar-se-completo:', 'ate:']);
    $log = static function (string $m): void { fwrite(STDOUT, '[' . date('H:i:s') . "] $m\n"); };
    try {
        $schema = (string) ($o['schema'] ?? '');
        Migrador::validarSchema($schema, isset($o['modo-producao']), getenv('ATR_MIGRAR_PRODUCAO') ?: null);
        $pdo = migrador_conectar((string) ($o['credenciais'] ?? ''));
        $m = new Migrador($pdo, $schema, (string) ($o['dir'] ?? (__DIR__ . '/../../db/equipamentos/migrations')), $log);
        $m->modoProducao = isset($o['modo-producao']);
        if (isset($o['reverter'])) { $m->reverter((string) $o['reverter']); exit(0); }
        $reg = array_values(array_map('strval', (array) ($o['registrar-se-completo'] ?? [])));
        if (isset($o['verificar'])) {
            $pf = $m->preflight();
            foreach ($pf as $v => $r) {
                $log(sprintf('%-30s ledger=%-3s estado=%-20s objetos=%d/%d', $v, $r['ledger'] ? 'sim' : 'não', $r['estado'], $r['no_estado_final'], $r['objetos']));
                foreach ($r['comandos'] as $i => $c) foreach ($c['objetos'] as $ob) $log(sprintf('    cmd %d  %-48s %s', $i, Migrador::rotulo($ob), $ob['no_estado_final'] ? 'OK' : 'FORA DO ESTADO FINAL'));
            }
            $rec = Migrador::recusasDoPreflight($pf, $reg);
            echo ($rec ? "PREFLIGHT_RECUSA\n  - " . implode("\n  - ", $rec) : 'PREFLIGHT_OK') . "\n";
            exit($rec ? 3 : 0);
        }
        $r = $m->executar(isset($o['dry-run']), $reg, isset($o['ate']) ? (string) $o['ate'] : null);
        $log((isset($o['dry-run']) ? 'SECO' : 'OK') . ' aplicadas=' . count($r['aplicadas']) . ' conferidas=' . count($r['conferidas']) . ' checksum_preenchido=' . count($r['checksum_preenchido']) . ' registradas=' . count($r['registradas']));
        echo 'MIGRAR_OK ' . json_encode($r) . "\n";
    } catch (Throwable $e) {
        fwrite(STDERR, 'MIGRAR_FALHOU: ' . $e->getMessage() . "\n");
        exit(1);
    }
}
