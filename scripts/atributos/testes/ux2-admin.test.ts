// UX-2 (DIREITA, 18/11) — testes puros das telas administrativas (src/ui/admin-ux2.ts).
// Rodar: bash scripts/atributos/testes/ux2-admin.sh (esbuild do Vite + Node; sem dependência nova).
// Cobre: equivalência pelo grupo ANTES do filtro; "ainda não conferido" ≠ 0; alcance por ID distinto com Entram/Saem/Continuam;
// prévia = corpo do POST; confirmação de renomear/desativar opção com o alcance; saída do editor depois de gravações individuais.
import {
  alcanceAtual, alcancePrevisto, compararAlcance, confirmacaoOpcao, contagemOuNula, corpoEdicaoUnidade, corpoEscopo, equivalencias, filtrarUnidades,
  lerImpactoDesativar, linhasHistorico, mudaInterpretacao, mudancasUnidade, previaConfere, saidaEditor, usoOpcao, usoUnidade, NAO_CONFERIDO,
  criarAtributoComUnidades, criarLeitorDetalheKit, estadoDesativarKit, PENDENCIA_UNIDADES, conferirAntesDoPost, MSG_KIT_MUDOU,
  type ProdutoCatalogo, type UnidadeBase, type DetalheConferido,
} from '../../../public/components/panels/panel-atributos/src/ui/admin-ux2';

let n = 0; let falhas = 0;
function igual(nome: string, obtido: unknown, esperado: unknown) {
  n++;
  if (JSON.stringify(obtido) !== JSON.stringify(esperado)) { falhas++; console.log(`[ERRO] ${nome}: obtido ${JSON.stringify(obtido)} · esperado ${JSON.stringify(esperado)}`); }
}
const sim = (nome: string, v: boolean) => igual(nome, v, true);

// ── 1. Unidades: equivalência pelo GRUPO antes do filtro ──────────────────────────────────────────────────────────────
const U = (id: number, simbolo: string, grandeza: string | null, fator: string | null, nome = simbolo): UnidadeBase => ({ id, simbolo, nome, grandeza, fator_base: fator, ativo: 1 });
const unidades = [U(1, 'm', 'comprimento', '1.000000000000', 'metro'), U(2, 'cm', 'comprimento', '0.010000000000', 'centímetro'), U(3, 'mm', 'comprimento', '0.001'),
  U(4, 'kg', 'massa', '1'), U(5, 'g', 'massa', '0.001', 'grama'), U(6, 'un', null, null, 'unidade'), U(7, 'W', 'potência', null), U(8, 'pol', 'polegada?', '0.0254')];
const eq = equivalencias(unidades);
igual('cm equivale a m pela lista completa', eq.get(2)?.texto, '1 cm = 0,01 m');
const soCm = filtrarUnidades(unidades, 'cm');
igual('buscar "cm" filtra só cm (e centímetro)', soCm.map((u) => u.simbolo), ['cm']);
igual('buscar "cm" MANTÉM a equivalência (resolvida antes do filtro)', soCm.map((u) => eq.get(u.id)?.texto), ['1 cm = 0,01 m']);
igual('equivalências calculadas só com a lista filtrada perdem a referência (o erro que o UX-2 corrige)', equivalencias(soCm).get(2)?.situacao, 'sem_referencia');
igual('m é a referência de comprimento', eq.get(1)?.situacao, 'base');
igual('g converte para kg (massa), nunca para m', eq.get(5)?.texto, '1 g = 0,001 kg');
sim('nenhuma unidade de massa aponta para referência de comprimento', [4, 5].every((id) => eq.get(id)?.referencia?.grandeza !== 'comprimento'));
igual('sem grandeza não converte', eq.get(6)?.situacao, 'sem_grandeza');
igual('sem fator não converte', eq.get(7)?.situacao, 'sem_fator');
igual('grandeza sem unidade de fator 1 → sem referência', eq.get(8)?.situacao, 'sem_referencia');
const ambiguas = equivalencias([U(1, 'm', 'comprimento', '1'), U(9, 'metro', 'comprimento', '1.0'), U(2, 'cm', 'comprimento', '0.01')]);
igual('duas candidatas de fator 1 → "Referência da grandeza precisa de revisão"', ambiguas.get(2)?.texto, 'Referência da grandeza precisa de revisão');
igual('busca sem acento acha "centímetro"', filtrarUnidades(unidades, 'centimetro').map((u) => u.id), [2]);
igual('busca vazia devolve tudo', filtrarUnidades(unidades, '  ').length, unidades.length);

// ── 2. "ainda não conferido" ≠ 0 ──────────────────────────────────────────────────────────────────────────────────────
const semContagemCompleta = usoUnidade({ atributos: 0, valores: 0 });
igual('sem a contagem da ESQUERDA, semUso = null (não conferido), NUNCA true', semContagemCompleta.semUso, null);
igual('resumo não diz "Sem uso" sem a contagem completa', semContagemCompleta.resumo, 'Uso ainda não conferido');
sim('linha explícita "Uso em kits e configurações de produto ainda não conferido"', semContagemCompleta.linhas.includes('Uso em kits e configurações de produto ainda não conferido'));
igual('kits/produtos ficam null, não 0', [semContagemCompleta.kits, semContagemCompleta.produtos], [null, null]);
igual('rótulos exatos das contagens do servidor', semContagemCompleta.linhas.slice(0, 2), ['Padrão de 0 atributos', '0 valores gravados com esta unidade']);
igual('com uso conhecido > 0, é "Em uso" mesmo sem a contagem completa', usoUnidade({ atributos: 2, valores: 0 }).semUso, false);
const completo = usoUnidade({ atributos: 0, valores: 0, itens_kit: 0, configuracoes_produto: 0 });
igual('com a contagem completa e tudo zero → "Sem uso"', [completo.semUso, completo.resumo, completo.completo], [true, 'Sem uso', true]);
igual('unidade usada só num item de kit NÃO aparece livre', usoUnidade({ atributos: 0, valores: 0, itens_kit: 1, configuracoes_produto: 0 }).semUso, false);
igual('contagem ausente/inválida → null (não 0)', [contagemOuNula(undefined), contagemOuNula(null), contagemOuNula('x'), contagemOuNula(0), contagemOuNula('3')], [null, null, null, 0, 3]);
igual('uso da opção sem o campo → null', usoOpcao({}), null);
igual('NAO_CONFERIDO é texto, não número', NAO_CONFERIDO, 'ainda não conferido');
igual('impacto de desativar sem o campo do servidor → null (não lista vazia)', lerImpactoDesativar(undefined), null);
igual('impacto malformado → null', lerImpactoDesativar({ continuam: [{ atributo_id: 1 }], fora_da_ficha: [] }), null);
igual('impacto válido é lido', lerImpactoDesativar({ continuam: [{ atributo_id: 1, rotulo: 'Cor', produtos: 3 }], fora_da_ficha: [] })?.continuam.length, 1);

// ── 3. Unidades: "antes → depois" vem do corpo do POST ────────────────────────────────────────────────────────────────
const cm = unidades[1];
const corpoG = corpoEdicaoUnidade(cm, { nome: 'centímetro', grandeza: 'massa', fatorApi: '0.01', fatorMudou: false }, { foto: 1 });
igual('mudar SÓ a grandeza aparece no antes → depois', mudancasUnidade(cm, corpoG), [{ campo: 'Grandeza', antes: 'comprimento', depois: 'massa' }]);
sim('grandeza muda a interpretação', mudaInterpretacao(mudancasUnidade(cm, corpoG)));
igual('fator não alterado não vai no corpo', 'fator_base' in corpoG, false);
const corpoF = corpoEdicaoUnidade(cm, { nome: 'centímetro', grandeza: 'comprimento', fatorApi: '0.1', fatorMudou: true }, null);
igual('mudar o fator: antes → depois em pt-BR', mudancasUnidade(cm, corpoF), [{ campo: 'Fator', antes: '0,01', depois: '0,1' }]);
igual('fator igual escrito diferente (0.010 vs 0.01) não é mudança', mudancasUnidade(cm, corpoEdicaoUnidade(cm, { nome: 'centímetro', grandeza: 'comprimento', fatorApi: '0.010', fatorMudou: true }, null)), []);
igual('esvaziar o fator → "sem fator"', mudancasUnidade(cm, corpoEdicaoUnidade(cm, { nome: 'centímetro', grandeza: 'comprimento', fatorApi: '', fatorMudou: true }, null)), [{ campo: 'Fator', antes: '0,01', depois: 'sem fator' }]);
const soNome = mudancasUnidade(cm, corpoEdicaoUnidade(cm, { nome: 'Centímetro', grandeza: 'comprimento', fatorApi: '', fatorMudou: false }, null));
igual('só o nome: aparece, mas não muda a interpretação', [soNome.length, mudaInterpretacao(soNome)], [1, false]);

// ── 4. Kits: alcance por ID DISTINTO, Entram / Saem / Continuam, prévia = POST ─────────────────────────────────────────
const P = (id: number, categoria: string, subcategoria: string | null, ativo = true): ProdutoCatalogo => ({ id, nome: `P${id}`, categoria, subcategoria, ativo });
const catalogo = [P(550, 'cabos', 'hdmi'), P(158, 'cabos', 'dvi'), P(10, 'cabos', null), P(11, 'audio', 'mic'), P(12, 'audio', 'mesa'), P(13, 'cabos', 'hdmi', false), P(14, 'video', 'tela')];
const corpo1 = corpoEscopo(99, 7, ['cabos|hdmi'], false);
igual('corpo do POST kit_escopos (forma exata)', corpo1, { id: 99, versao: 7, escopos: [{ categoria: 'cabos', subcategoria: 'hdmi' }], aplica_a_todos: 0 });
const avulsos = [550, 11];
const antes = alcancePrevisto(corpo1, catalogo, avulsos);
igual('produto na subcategoria E avulso conta UMA vez (550)', [...antes].sort((a, b) => a - b), [11, 550]);
igual('produto inativo (13) nunca conta', antes.has(13), false);
const corpo2 = corpoEscopo(99, 7, ['cabos|'], false);
const depois = alcancePrevisto(corpo2, catalogo, avulsos);
const cmp = compararAlcance(antes, depois);
igual('categoria inteira: entram 10 (sem subcategoria) e 158', cmp.entram, [10, 158]);
igual('ninguém sai', cmp.saem, []);
igual('continuam 11 (avulso) e 550', cmp.continuam, [11, 550]);
igual('total = IDs distintos', cmp.total, 4);
sim('entram + continuam = total; nenhum ID repetido', cmp.entram.length + cmp.continuam.length === cmp.total && new Set([...cmp.entram, ...cmp.continuam]).size === cmp.total);
const cmpSai = compararAlcance(depois, alcancePrevisto(corpoEscopo(99, 7, [], false), catalogo, avulsos));
igual('tirar o escopo: saem 10, 158, 550 só se não forem avulsos (550 é avulso → continua)', [cmpSai.saem, cmpSai.continuam], [[10, 158], [11, 550]]);
igual('aplica a todos = todos os ativos', alcancePrevisto(corpoEscopo(99, 7, [], true), catalogo, []).size, 6);
igual('chaves repetidas no rascunho viram um só escopo (mesmo corpo da prévia e do POST)', corpoEscopo(1, 1, ['a|', 'a|', 'b|x'], false).escopos.length, 2);
const servidor = alcanceAtual([{ id: 550, ativo: true }, { id: 11, ativo: true }, { id: 13, ativo: false }, { id: 550, ativo: true }]);
igual('alcance do servidor: ativos e distintos', [...servidor].sort((a, b) => a - b), [11, 550]);
sim('prévia confere quando a regra local reproduz o servidor', previaConfere(corpo1, catalogo, avulsos, servidor));
igual('prévia NÃO confere se o servidor diverge (→ "ainda não conferido")', previaConfere(corpo1, catalogo, avulsos, new Set([550])), false);

// ── 5. Opções: confirmação com alcance; prévia = corpo enviado ───────────────────────────────────────────────────────
const cr = { id: 5, rotulo: 'Azul-marinho', rotulo_atual: 'Azul' };
const c3 = confirmacaoOpcao('renomear', 3, cr);
igual('renomear em uso: título com alcance', c3.titulo, 'Renomear "Azul" para "Azul-marinho" em 3 produtos?');
sim('renomear em uso pede confirmação', c3.precisa);
const cNull = confirmacaoOpcao('renomear', null, cr);
sim('uso não conferido TAMBÉM pede confirmação', cNull.precisa);
sim('uso não conferido diz "ainda não conferido" e não "0 produtos"', cNull.texto.includes('ainda não conferido') && !/\b0 produtos?\b/.test(cNull.titulo + cNull.texto));
igual('uso 0: não precisa confirmar', confirmacaoOpcao('renomear', 0, cr).precisa, false);
igual('o texto usa o CORPO (rotulo_atual → rotulo), não o campo digitado', confirmacaoOpcao('renomear', 1, { id: 5, rotulo: 'X', rotulo_atual: 'Y' }).titulo, 'Renomear "Y" para "X" em 1 produto?');
const d = confirmacaoOpcao('desativar', 2, { rotulo_atual: 'Azul' });
igual('desativar: título', d.titulo, 'Desativar "Azul" para novas escolhas?');
sim('desativar em uso informa quantos continuam', d.precisa && d.texto.startsWith('2 produtos continuam'));
sim('desativar com uso não conferido pede confirmação', confirmacaoOpcao('desativar', null, { rotulo_atual: 'Azul' }).precisa);

// ── 6. Saída do editor: Cancelar não sugere desfazer o que já foi salvo ─────────────────────────────────────────────────
igual('sem gravação individual: "Cancelar"', saidaEditor([], false), { rotulo: 'Cancelar', nota: null });
const s1 = saidaEditor([{ texto: 'Opção "Azul" renomeada para "Azul-marinho"' }], false);
igual('depois de salvar uma opção, o botão não é "Cancelar"', s1.rotulo, 'Fechar sem salvar o formulário');
sim('a nota diz que o que foi salvo não volta', !!s1.nota && s1.nota.includes('não volta') && s1.nota.includes('Azul-marinho'));
igual('somente leitura: "Fechar"', saidaEditor([{ texto: 'x' }], true).rotulo, 'Fechar');

// ── 7. Histórico ─────────────────────────────────────────────────────────────────────────────────────────────────────
const h = linhasHistorico([{ id: 1, usuario: 'jhony', acao: 'editar', antes: '{"rotulo":"Cor","casas":null}', depois: { rotulo: 'Cor do Cabo', casas: null }, motivo: null, criado_em: '2026-11-18 10:00:00' }]);
igual('histórico: só campos que mudaram, antes → depois', h[0].mudancas, ['rotulo: Cor → Cor do Cabo']);
igual('histórico: quem e quando', [h[0].quem, h[0].quando], ['jhony', '2026-11-18 10:00:00']);

// ── 8. Kits/desativar: resposta atrasada de outro kit é descartada; POST com ID e versão do MESMO detalhe ─────────────
// Simula o DialogoAtivo (Kits.tsx) com um GET falso controlado à mão: dois kits descartáveis (nunca "Cabos") com a MESMA versão.
type DetFalso = { kit: { id: number; versao: number; nome: string }; alcance: { id: number; ativo: boolean }[]; impacto_desativar?: unknown };
const IMPACTO_OK = { continuam: [], fora_da_ficha: [] };
const pendentesGet = new Map<number, { ok: (d: DetFalso) => void; erro: (e: unknown) => void }[]>();
const getFalso = (id: number) => new Promise<DetFalso>((ok, erro) => { const l = pendentesGet.get(id) ?? []; l.push({ ok, erro }); pendentesGet.set(id, l); });
const responder = async (id: number, d: DetFalso) => { const p = pendentesGet.get(id)!.shift()!; p.ok(d); await new Promise((r) => setTimeout(r, 0)); };
const falharGet = async (id: number) => { const p = pendentesGet.get(id)!.shift()!; p.erro(new Error('falhou')); await new Promise((r) => setTimeout(r, 0)); };
const kitA = (imp?: unknown): DetFalso => ({ kit: { id: 9001, versao: 7, nome: 'Teste A (descartável)' }, alcance: [{ id: 11, ativo: true }, { id: 12, ativo: true }], impacto_desativar: imp });
const kitB = (imp?: unknown): DetFalso => ({ kit: { id: 9002, versao: 7, nome: 'Teste B (descartável)' }, alcance: [{ id: 21, ativo: true }, { id: 22, ativo: false }], impacto_desativar: imp });
function dialogoFalso() {   // mesmo fluxo do componente: estado `det`, kit selecionado, prévia só com detalhe conferido, POST do estado conferido
  const tela = { selecionado: null as number | null, conf: null as DetalheConferido<DetFalso> | null, erro: null as string | null, aviso: null as string | null, posts: [] as unknown[],
    get det() { return tela.conf?.det ?? null; } };
  const leitor = criarLeitorDetalheKit<DetFalso>(getFalso);
  const detOk = () => {
    const ab = leitor.atual();
    return tela.conf && tela.selecionado !== null && tela.conf.det.kit.id === tela.selecionado && ab !== null && tela.conf.abertura.abertura === ab.abertura ? tela.conf.det : null;
  };
  return {
    tela, leitor,
    abrir(id: number) { leitor.fechar(); tela.conf = null; tela.erro = null; tela.aviso = null; tela.selecionado = id; leitor.abrir(id, (c) => { tela.conf = c; }, () => { tela.erro = 'erro'; }); },
    fechar() { leitor.fechar(); tela.selecionado = null; tela.conf = null; },
    forcarDet(d: DetFalso) { tela.conf = { det: d, abertura: leitor.atual()! }; },   // estado "sujo" de propósito: o botão e o POST ainda precisam recusar
    forcarConf(c: DetalheConferido<DetFalso>) { tela.conf = c; },
    previa: () => { const d = detOk(); return d ? [...alcanceAtual(d.alcance)].sort((a, b) => a - b) : null; },
    estado: (motivo = '') => estadoDesativarKit(tela.selecionado, detOk(), motivo),
    /** handler do clique: estado → conferência da identidade da abertura → POST (mesmo fluxo de Kits.tsx) */
    confirmar(motivo = '', selecionadoNoClique = tela.selecionado) {
      const e = estadoDesativarKit(tela.selecionado, detOk(), motivo); if (!e.corpo) return;
      const c = conferirAntesDoPost(leitor.atual(), selecionadoNoClique, tela.conf, e.corpo);
      if (!c.ok) { tela.aviso = c.mensagem; return; }
      tela.posts.push({ acao: 'kit_ativo', ...c.corpo });
    },
  };
}
{
  const d = dialogoFalso();
  d.abrir(9001); d.abrir(9002);                       // abre A e, antes da resposta de A, abre B
  await responder(9001, kitA(IMPACTO_OK));            // a resposta de A chega ATRASADA
  igual('atraso: resposta de A com o diálogo de B aberto é descartada (det continua vazio)', d.tela.det, null);
  igual('atraso: a prévia não mostra produtos de A', d.previa(), null);
  igual('atraso: botão desligado com a resposta de A', d.estado().habilitado, false);
  d.confirmar(); igual('atraso: nenhum POST sai sem o detalhe de B', d.tela.posts.length, 0);
  d.forcarDet(kitA(IMPACTO_OK));
  igual('mesmo se o estado tiver o detalhe de A (mesma versão 7), o botão NÃO habilita para B', d.estado().habilitado, false);
  igual('…e a prévia continua sem os produtos de A', d.previa(), null);
  d.confirmar(); igual('…e nenhum POST sai com o detalhe de A', d.tela.posts.length, 0);
  await responder(9002, kitB(IMPACTO_OK));
  igual('resposta de B: prévia de B', d.previa(), [21]);
  igual('B + impacto completo: botão habilitado', d.estado().habilitado, true);
  d.confirmar('teste');
  igual('payload do POST leva ID e versão do detalhe de B', d.tela.posts, [{ acao: 'kit_ativo', id: 9002, versao: 7, ativo: 0, motivo: 'teste' }]);
}
{
  const d = dialogoFalso();
  d.abrir(9002); await responder(9002, kitB());       // sem `impacto_desativar` (contrato ainda pendente na ESQUERDA)
  igual('sem impacto completo: prévia de B aparece', d.previa(), [21]);
  igual('sem impacto completo: botão DESLIGADO', d.estado().habilitado, false);
  sim('sem impacto completo: texto "impacto ainda não conferido"', (d.estado().motivo ?? '').includes(`impacto ${NAO_CONFERIDO}`));
  d.confirmar(); igual('sem impacto completo: nenhum POST', d.tela.posts.length, 0);
  d.abrir(9002); await responder(9002, kitB({ continuam: [{ atributo_id: 1 }], fora_da_ficha: [] }));
  igual('impacto malformado: botão desligado', d.estado().habilitado, false);
}
{
  const d = dialogoFalso();
  d.abrir(9001); d.fechar();
  await responder(9001, kitA(IMPACTO_OK));
  igual('diálogo fechado: resposta atrasada descartada', d.tela.det, null);
  d.abrir(9001); d.abrir(9002); await falharGet(9001);
  igual('erro atrasado de A não aparece no diálogo de B', d.tela.erro, null);
  d.abrir(9001); await responder(9001, kitB(IMPACTO_OK));   // servidor devolveu outro kit para o pedido de A
  igual('resposta com kit.id diferente do pedido é descartada', d.tela.det, null);
  igual('estadoDesativarKit sem kit selecionado → desligado', estadoDesativarKit(null, kitA(IMPACTO_OK)).habilitado, false);
}

// ── 8b. DSHOW-094: identidade da ABERTURA (reabrir o MESMO kit) e conferência no clique ─────────────────────────────
{
  pendentesGet.clear();   // pedidos pendentes de blocos anteriores ficam de fora
  const d = dialogoFalso();
  d.abrir(9002); const ab1 = d.leitor.atual();         // abertura 1 de B
  d.fechar(); d.abrir(9002); const ab2 = d.leitor.atual();   // reabre o MESMO kit: abertura 2
  sim('reabrir o mesmo kit gera outra abertura', !!ab1 && !!ab2 && ab1.kitId === ab2.kitId && ab2.abertura > ab1.abertura);
  await responder(9002, { ...kitB(IMPACTO_OK), kit: { id: 9002, versao: 6, nome: 'B antigo' } });   // resposta da abertura 1 chega na 2
  igual('reabrir: resposta atrasada da abertura 1 (mesmo kit) é descartada', d.tela.det, null);
  igual('reabrir: botão desligado com a resposta da abertura 1', d.estado().habilitado, false);
  d.confirmar(); igual('reabrir: nenhum POST com a versão da abertura 1', d.tela.posts.length, 0);
  d.forcarConf({ det: kitB(IMPACTO_OK), abertura: ab1! });   // estado sujo com detalhe da abertura 1
  igual('detalhe de abertura anterior não habilita', d.estado().habilitado, false);
  d.confirmar(); igual('…e nenhum POST', d.tela.posts.length, 0);
  await responder(9002, kitB(IMPACTO_OK));             // resposta da abertura 2
  igual('abertura 2: habilita', d.estado().habilitado, true);
  // identidade divergente no CLIQUE: o diálogo passou a outro kit / outra abertura entre o render e o clique
  d.confirmar('', 9001);
  igual('clique com kit do diálogo ≠ kit do detalhe: nenhum POST', d.tela.posts.length, 0);
  igual('…mostra "O kit mudou; abra de novo para conferir."', d.tela.aviso, MSG_KIT_MUDOU);
  igual('texto exato', MSG_KIT_MUDOU, 'O kit mudou; abra de novo para conferir.');
  const conf2 = d.tela.conf!; const corpoB = { id: 9002, versao: 7, ativo: 0 as const };
  igual('conferência: abertura atual diferente da do detalhe → recusa', conferirAntesDoPost({ kitId: 9002, abertura: conf2.abertura.abertura + 1 }, 9002, conf2, corpoB).ok, false);
  igual('conferência: id do payload ≠ kit do detalhe → recusa', conferirAntesDoPost(conf2.abertura, 9002, conf2, { ...corpoB, id: 9001 }).ok, false);
  igual('conferência: versão do payload ≠ do detalhe → recusa', conferirAntesDoPost(conf2.abertura, 9002, conf2, { ...corpoB, versao: 6 }).ok, false);
  igual('conferência: diálogo fechado (sem abertura) → recusa', conferirAntesDoPost(null, 9002, conf2, corpoB).ok, false);
  igual('conferência: tudo igual → envia o corpo do detalhe', conferirAntesDoPost(conf2.abertura, 9002, conf2, corpoB), { ok: true, corpo: corpoB });
  d.tela.aviso = null; d.confirmar('ok');
  igual('clique coerente: 1 POST com ID e versão do detalhe conferido', d.tela.posts, [{ acao: 'kit_ativo', id: 9002, versao: 7, ativo: 0, motivo: 'ok' }]);
  d.abrir(9002); d.leitor.fechar();                     // fecha entre o render e o clique
  await responder(9002, kitB(IMPACTO_OK));
  d.confirmar(); igual('fechado antes da resposta: nada novo é enviado', d.tela.posts.length, 1);
}

// ── 9. Dicionário/criar: 2º POST (unidades) falha → pendência persistente, nenhum "sucesso" depois do erro ────────────
{
  const avisos: string[] = []; const envios: string[] = [];
  const dep = (falhar2: boolean) => ({
    enviar: async (acao: string) => { envios.push(acao); if (acao === 'atributo') return { atributo: { id: 77 } }; if (falhar2) throw new Error('unidade inválida'); return {}; },
    aviso: (t: string) => { avisos.push(t); }, mensagemErro: (e: unknown) => (e as Error).message,
  });
  const r1 = await criarAtributoComUnidades(dep(true), { rotulo: 'Comprimento teste' }, [3, 5], 'Comprimento teste');
  igual('1º ok + 2º falha: os dois POSTs foram tentados', envios, ['atributo', 'atributo_unidades']);
  igual('1º ok + 2º falha: pendência persistente com o texto exato', r1.pendencia?.texto, PENDENCIA_UNIDADES);
  igual('texto da pendência', PENDENCIA_UNIDADES, 'Atributo criado. As unidades adicionais continuam pendentes.');
  igual('1º ok + 2º falha: o motivo do erro acompanha a pendência', r1.pendencia?.detalhe, 'unidade inválida');
  igual('1º ok + 2º falha: NENHUM aviso de sucesso', avisos, []);
  igual('1º ok + 2º falha: o ID criado volta (para abrir o atributo com a pendência)', r1.id, 77);
  avisos.length = 0; envios.length = 0;
  const r2 = await criarAtributoComUnidades(dep(false), { rotulo: 'Comprimento teste' }, [3, 5], 'Comprimento teste');
  igual('ambos ok: sucesso normal', [r2.pendencia, avisos], [null, ['Atributo "Comprimento teste" criado.']]);
  avisos.length = 0; envios.length = 0;
  const r3 = await criarAtributoComUnidades(dep(true), { rotulo: 'Sem extras' }, [], 'Sem extras');
  igual('sem unidades extras: só o 1º POST e sucesso', [envios, r3.pendencia, avisos.length], [['atributo'], null, 1]);
  let lancou = false; avisos.length = 0;
  try { await criarAtributoComUnidades({ ...dep(false), enviar: async () => { throw new Error('x'); } }, {}, [1], 'X'); } catch { lancou = true; }
  igual('1º POST falha: lança (erro no formulário) e nenhum sucesso', [lancou, avisos.length], [true, 0]);
}

console.log(`ux2-admin: ${n - falhas}/${n} ok${falhas ? ` · ${falhas} FALHA(S)` : ''}`);
if (falhas) process.exit(1);
