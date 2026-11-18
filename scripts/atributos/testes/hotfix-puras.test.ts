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

  console.log(`${falhas === 0 ? '[OK]  ' : '[FALHA]'} hotfix-puras (integridade: unidades, kits, dicionário, vincular): ${n} casos, ${falhas} falha(s)`);
  process.exitCode = falhas === 0 ? 0 : 1;
}
void principal();
