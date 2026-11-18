// Hotfix de integridade (18/11) — testes das funções puras de src/lib/integridade.ts (Unidades, Kits, Dicionário, Vincular).
// Rodar: bash scripts/atributos/testes/hotfix-puras.sh (esbuild do Vite + Node; sem dependência nova).
import * as I from '../../../public/components/panels/panel-atributos/src/lib/integridade';

let n = 0; let falhas = 0;
function igual(nome: string, obtido: unknown, esperado: unknown) {
  n++;
  if (JSON.stringify(obtido) !== JSON.stringify(esperado)) { falhas++; console.log(`[ERRO] ${nome}: obtido ${JSON.stringify(obtido)} · esperado ${JSON.stringify(esperado)}`); }
}

async function principal() {
  // ── DSHOW-071 · Unidades: Esc/✕/fundo/Enter durante um POST atrasado → 1 POST e o editor continua aberto ──
  {
    const salvando = { current: false };
    let posts = 0; let fechado = false; let soltar: () => void = () => {};
    const fechar = () => { if (I.decidirFechar(salvando.current)) fechado = true; };
    const salvar = async () => {
      if (!I.iniciarGravacao(salvando)) return;   // Enter / duplo clique durante a gravação
      try { posts++; await new Promise<void>((r) => { soltar = r; }); } finally { salvando.current = false; }
    };
    const p1 = salvar();            // clique em Salvar (POST pendente)
    void salvar();                  // Enter
    fechar();                       // Esc
    fechar();                       // ✕
    fechar();                       // clique no fundo
    igual('071: Enter durante o POST não manda outro', posts, 1);
    igual('071: Esc/✕/fundo durante o POST não fecham', fechado, false);
    soltar(); await p1;
    igual('071: depois da resposta, a trava solta', salvando.current, false);
    fechar();
    igual('071: depois da resposta, Esc fecha', fechado, true);
    igual('071: fotografia leva nome/grandeza/fator como a tela viu', I.fotografiaUnidade({ nome: 'centímetro', grandeza: null, fator_base: '0.010000000000' }), { nome: 'centímetro', grandeza: null, fator_base: '0.010000000000' });
  }

  // ── DSHOW-064 · Kits: base do rascunho de itens × persistido ──
  {
    const X = '[[1]]'; const XY = '[[1],[2]]';
    const base1 = { versao: 1, assinatura: X };
    // B adiciona Y entre o POST (de outra seção) e o GET de A: a recarga de A não inclui "itens" → base NÃO avança, marca mudou
    const av = I.avancarBase(base1, { versao: 3, assinatura: XY }, false);
    igual('064: B adiciona Y entre POST e GET de A → base não avança e marca mudou', [av.base, av.mudou, av.reiniciar], [base1, true, false]);
    igual('064: …e salvar itens depois disso → conflito local (não envia)', I.decidirEnvio(av.base, { versao: 3, assinatura: XY }, { baseMudou: av.mudou }).acao, 'conflito');
    igual('064: mesmo sem a marca, persistido ≠ base → conflito', I.decidirEnvio(base1, { versao: 3, assinatura: XY }), { acao: 'conflito', motivo: 'persistido_mudou' });
    igual('064: reentrada com POST pendente → conflito (não envia de novo)', I.decidirEnvio(base1, { versao: 1, assinatura: X }, { pendente: true }), { acao: 'conflito', motivo: 'pendente' });
    // 409 ao salvar o nome (B mexeu nos itens) + recarga seletiva de "dados": a base de itens não avança
    const r409 = I.avancarBase(base1, { versao: 2, assinatura: XY }, false);
    igual('064: 409 de nome + recarga só de dados → base de itens continua na versão 1', r409.base.versao, 1);
    igual('064: …e fica marcada como mudou', r409.mudou, true);
    // B mudou só o nome: a assinatura dos itens é a mesma → a base avança de versão e o envio usa a versão nova
    const soNome = I.avancarBase(base1, { versao: 2, assinatura: X }, false);
    igual('064: só nome → base avança para a versão 2 sem conflito', [soNome.base, soNome.mudou], [{ versao: 2, assinatura: X }, false]);
    igual('064: só nome → enviar com a versão nova', I.decidirEnvio(base1, { versao: 2, assinatura: X }), { acao: 'enviar', versao: 2 });
    igual('064: seção incluída na recarga reinicia rascunho e base', I.avancarBase(base1, { versao: 5, assinatura: XY }, true), { base: { versao: 5, assinatura: XY }, reiniciar: true, mudou: false });
    igual('064: recarga preserva item novo do rascunho', I.manterNovos([{ atributo_id: 1 }, { atributo_id: 2 }], [{ atributo_id: 1 }, { atributo_id: 9, novo: true }, { atributo_id: 2, novo: true }]).map((i) => i.atributo_id), [1, 2, 9]);
    igual('064: assinatura do escopo não depende da ordem', I.assinaturaEscopo(false, ['B|', 'A|X']) === I.assinaturaEscopo(false, ['A|X', 'B|']), true);
    igual('064: "aplica a todos" muda a assinatura do escopo', I.assinaturaEscopo(true, ['A|X']) === I.assinaturaEscopo(false, ['A|X']), false);
  }

  // ── DSHOW-070 · Dicionário: o rótulo que vale é o ORIGINAL do rascunho ──
  {
    const r = { id: 7, texto: 'Preto fosco', original: 'Preto' };
    igual('070: lista relida mostra outro rótulo, mas rotulo_atual = original do clique', I.precondicaoRenomear(r), { acao: 'enviar', id: 7, rotulo: 'Preto fosco', rotulo_atual: 'Preto' });
    igual('070: texto igual ao original → nada mudou (não envia)', I.precondicaoRenomear({ id: 7, texto: ' Preto ', original: 'Preto' }), { acao: 'nada' });
    igual('070: texto igual ao rótulo NOVO da lista (≠ original) → envia com o original (o servidor decide 409)', I.precondicaoRenomear({ id: 7, texto: 'Grafite', original: 'Preto' }), { acao: 'enviar', id: 7, rotulo: 'Grafite', rotulo_atual: 'Preto' });
    igual('070: vazio → nada', I.precondicaoRenomear({ id: 7, texto: '   ', original: 'Preto' }), { acao: 'nada' });
  }

  // ── Vincular · ações opostas ──
  {
    const r1 = I.alternarLado({ a: [5], b: [] }, 5, 'b');
    igual('vincular: kit em Aplicar marcado em Remover → sai de Aplicar e avisa', r1, { estado: { a: [], b: [5] }, trocou: true });
    igual('vincular: Remover → Aplicar idem', I.alternarLado({ a: [], b: [5, 6] }, 5, 'a'), { estado: { a: [5], b: [6] }, trocou: true });
    igual('vincular: clicar de novo no mesmo lado desmarca, sem aviso', I.alternarLado({ a: [5, 7], b: [] }, 5, 'a'), { estado: { a: [7], b: [] }, trocou: false });
    igual('vincular: marcar sem conflito não avisa', I.alternarLado({ a: [7], b: [] }, 5, 'a'), { estado: { a: [7, 5], b: [] }, trocou: false });
    const r2 = I.alternarLado({ a: [11], b: [] }, 11, 'b');
    igual('vincular: atributo incluído marcado para excluir → só em Excluir', [r2.estado.a.includes(11), r2.estado.b.includes(11), r2.trocou], [false, true, true]);
    const nunca = [[1], [2], [1, 2]].every((a) => [1, 2, 3].every((id) => (['a', 'b'] as const).every((l) => { const e = I.alternarLado({ a, b: a.includes(3) ? [] : [3] }, id, l).estado; return !e.a.some((x) => e.b.includes(x)); })));
    igual('vincular: nenhum id fica nos dois lados (varredura)', nunca, true);
  }

  console.log(`${falhas === 0 ? '[OK]  ' : '[FALHA]'} hotfix-puras (integridade: unidades, kits, dicionário, vincular): ${n} casos, ${falhas} falha(s)`);
  process.exitCode = falhas === 0 ? 0 : 1;
}
void principal();
