// MODULE: uarps-admin-ui:alteracao-painel (E2 · B2/B3/B4 + B6 congelados) · VERDE (ACIMA_DIREITA), 27/11/2026
// Diálogo de UMA alteração de permissão: escolher (permitir · negar · voltar a herdar) + motivo → "Ver prévia" (o SERVIDOR calcula atual × futuro
// e diz se há bloqueio: congelado, antibloqueio, hierarquia) → "Confirmar" só sem bloqueio → grava, relê e mostra a origem que o servidor
// devolveu. Nada é deduzido no navegador. A mesma chave de operação vale enquanto o diálogo estiver aberto (reenvio = mesma intenção).
// Texto vindo do servidor entra SEMPRE por textContent.
'use strict';
import { Api, novaOperacao } from '../api/client.js';
import { alterarTrigger, rotuloDaReleitura, descreverRegra, mensagemDoResultado, type Acao, type Resultado } from '../core/alteracao-servidor.js';

export const MODULE_ID = 'uarps-admin-ui:alteracao-painel';
const ESTADO: Record<Acao, 'allow' | 'deny' | 'inherit'> = { permitir: 'allow', negar: 'deny', herdar: 'inherit' };
const ROTULO_ACAO: Record<Acao, string> = { permitir: 'Permitir', negar: 'Negar', herdar: 'Voltar a herdar' };
const ESTILO_ID = 'uarps-alteracao-estilo';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, texto?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (texto !== undefined) e.textContent = texto; return e;
}
function estilo() {
  if (document.getElementById(ESTILO_ID)) return;
  const s = el('style', { id: ESTILO_ID });
  // tokens = os do DES (ds-kpi-card.css): escuro por padrão, claro com :root[data-theme="light"]; o diálogo fica no body, fora do .des-escopo
  s.textContent = `.uarps-alt{--a-sup:#1a1a28;--a-sup2:#222234;--a-borda:#2c2c42;--a-texto:#e9e9f2;--a-dim:#9a9ab2;--a-link:#818cf8;--a-ok:#22c55e;--a-aviso:#f59e0b;--a-erro:#ef4444;--a-primario-texto:#12121c}
:root[data-theme="light"] .uarps-alt{--a-sup:#ffffff;--a-sup2:#eef1f8;--a-borda:#dde1ec;--a-texto:#1a1d29;--a-dim:#5a6273;--a-link:#4f46e5;--a-ok:#15803d;--a-aviso:#b45309;--a-erro:#dc2626;--a-primario-texto:#ffffff}
.uarps-alt{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45)}
.uarps-alt__caixa{width:min(560px,94vw);max-height:90vh;overflow:auto;background:var(--a-sup);color:var(--a-texto);border:1px solid var(--a-borda);border-radius:12px;padding:20px;font:14px/1.45 inherit}
.uarps-alt__titulo{margin:0 0 4px;font-size:16px;font-weight:600}.uarps-alt__sub{margin:0 0 14px;color:var(--a-dim)}
.uarps-alt fieldset{border:0;margin:0 0 12px;padding:0;display:flex;gap:8px;flex-wrap:wrap}.uarps-alt legend{font-weight:600;margin-bottom:6px}
.uarps-alt label.op{display:flex;gap:6px;align-items:center;border:1px solid var(--a-borda);border-radius:8px;padding:6px 10px;cursor:pointer}
.uarps-alt textarea{width:100%;min-height:56px;box-sizing:border-box;border:1px solid var(--a-borda);border-radius:8px;padding:8px;background:transparent;color:inherit}
.uarps-alt__acoes{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap}.uarps-alt button{border:1px solid var(--a-borda);border-radius:8px;padding:8px 14px;background:transparent;color:inherit;cursor:pointer}
.uarps-alt button[data-primario]{background:var(--a-link);color:var(--a-primario-texto);border-color:transparent}   /* contraste ≥ 4,5:1 nos 2 temas */.uarps-alt button:disabled{opacity:.5;cursor:not-allowed}
.uarps-alt :focus-visible{outline:2px solid var(--a-link);outline-offset:2px}
.uarps-alt__bloco{margin-top:12px;padding:10px;border-radius:8px;background:var(--a-sup2)}.uarps-alt__bloco[data-tom="erro"]{border-left:4px solid var(--a-erro)}
.uarps-alt__bloco[data-tom="aviso"]{border-left:4px solid var(--a-aviso)}.uarps-alt__bloco[data-tom="ok"]{border-left:4px solid var(--a-ok)}`;
  document.head.appendChild(s);
}
function linhaAcesso(titulo: string, a: any): HTMLElement {
  const d = el('div'); d.appendChild(el('strong', {}, titulo + ': '));
  const rot = rotuloDaReleitura({ acesso_efetivo: a }).rotulo; d.appendChild(document.createTextNode(rot));
  if (a?.mensagem && String(a.mensagem) !== rot) { d.appendChild(el('div', { 'data-uarps-detalhe': '' }, String(a.mensagem))); }   // sem repetir o rótulo
  return d;
}

/** Abre o diálogo para (pessoa, gatilho). Resolve com o resultado final (ou null se fechado sem confirmar). */
export function abrirAlteracao(store: any, p: { userId: string | number; triggerId: string; label?: string }): Promise<unknown> {
  estilo();
  const anterior = document.activeElement as HTMLElement | null;
  const raiz = el('div', { class: 'uarps-alt', 'data-uarps-alteracao': p.triggerId });
  const caixa = el('div', { class: 'uarps-alt__caixa', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'uarps-alt-titulo' });
  caixa.appendChild(el('h2', { class: 'uarps-alt__titulo', id: 'uarps-alt-titulo' }, 'Alterar permissão'));
  caixa.appendChild(el('p', { class: 'uarps-alt__sub' }, `${p.label || p.triggerId} · pessoa ${p.userId}`));
  // E3.2: a regra ATUAL como o servidor devolveu na última leitura (recarregar/selecionar): estado, prazo até o ms e concedente/alçada
  const lida: any = store?.getUserPermissions ? store.getUserPermissions(p.userId) : null;   // da PESSOA do diálogo (não da selecionada)
  if (lida?.detalhes) caixa.appendChild(el('p', { class: 'uarps-alt__sub', 'data-uarps-regra-atual': '' }, 'Regra atual: ' + descreverRegra(lida.detalhes.triggers?.[p.triggerId])));
  const fs = el('fieldset'); fs.appendChild(el('legend', {}, 'Alteração'));
  (['permitir', 'negar', 'herdar'] as Acao[]).forEach((a, i) => {
    const lb = el('label', { class: 'op' }); const r = el('input', { type: 'radio', name: 'uarps-alt-acao', value: a }); if (i === 0) r.checked = true;
    lb.appendChild(r); lb.appendChild(document.createTextNode(ROTULO_ACAO[a])); fs.appendChild(lb);
  });
  caixa.appendChild(fs);
  const lbm = el('label', { for: 'uarps-alt-motivo' }, 'Motivo (registrado no histórico)'); caixa.appendChild(lbm);
  const motivo = el('textarea', { id: 'uarps-alt-motivo', maxlength: '500' }); caixa.appendChild(motivo);
  const previa = el('div', { class: 'uarps-alt__bloco', 'data-uarps-previa': '', hidden: '' }); caixa.appendChild(previa);
  const resultado = el('div', { class: 'uarps-alt__bloco', 'data-uarps-resultado': '', hidden: '', role: 'status', 'aria-live': 'polite' }); caixa.appendChild(resultado);
  const acoes = el('div', { class: 'uarps-alt__acoes' });
  const bFechar = el('button', { type: 'button', 'data-uarps-fechar': '' }, 'Fechar');
  const bPrevia = el('button', { type: 'button', 'data-uarps-ver-previa': '' }, 'Ver prévia');
  const bConfirmar = el('button', { type: 'button', 'data-uarps-confirmar': '', 'data-primario': '' }, 'Confirmar'); bConfirmar.disabled = true;
  acoes.append(bFechar, bPrevia, bConfirmar); caixa.appendChild(acoes); raiz.appendChild(caixa); document.body.appendChild(raiz);

  let operacaoId = novaOperacao(); let acaoDaPrevia: Acao | null = null; let final: unknown = null;
  const acao = () => (caixa.querySelector('input[name="uarps-alt-acao"]:checked') as HTMLInputElement).value as Acao;
  // mudar a escolha ou o motivo invalida a prévia e a chave (é OUTRA intenção)
  const invalidar = () => { bConfirmar.disabled = true; acaoDaPrevia = null; operacaoId = novaOperacao(); previa.hidden = true; };
  fs.addEventListener('change', invalidar); motivo.addEventListener('input', invalidar);

  bPrevia.addEventListener('click', async () => {
    bPrevia.disabled = true; previa.hidden = false; previa.replaceChildren(el('div', {}, 'Consultando o servidor…')); previa.removeAttribute('data-tom');
    const a = acao(); const r: any = await Api.previewTrigger(p.userId, p.triggerId, ESTADO[a]); bPrevia.disabled = false;
    previa.replaceChildren();
    if (!r?.success || !r.data) { previa.setAttribute('data-tom', 'erro'); previa.appendChild(el('div', {}, `Prévia indisponível (${r?.error || 'sem resposta'}). Nada foi gravado.`)); return; }
    const d = r.data; previa.appendChild(linhaAcesso('Agora', d.atual)); previa.appendChild(linhaAcesso('Depois', d.futuro));
    previa.appendChild(el('div', {}, d.muda ? 'O acesso efetivo muda.' : 'O acesso efetivo não muda (a regra muda, o efeito fica igual).'));
    if (d.bloqueio) {
      previa.setAttribute('data-tom', 'erro'); const congelado = d.bloqueio.codigo === 'CONGELADO';
      previa.appendChild(el('div', { 'data-uarps-bloqueio': String(d.bloqueio.codigo) }, congelado ? 'Congelado (somente leitura): ' + String(d.bloqueio.mensagem || '') : 'Bloqueado: ' + String(d.bloqueio.mensagem || d.bloqueio.codigo)));
      bConfirmar.disabled = true; acaoDaPrevia = null; return;
    }
    previa.setAttribute('data-tom', 'ok'); acaoDaPrevia = a; bConfirmar.disabled = false; bConfirmar.focus();
  });
  bConfirmar.addEventListener('click', async () => {
    const a = acao(); if (acaoDaPrevia !== a) { bConfirmar.disabled = true; return; }   // confirmar só o que foi pré-visualizado
    bConfirmar.disabled = true; bPrevia.disabled = true;
    const r = await alterarTrigger(store, { userId: p.userId, triggerId: p.triggerId, acao: a, motivo: motivo.value.trim() || undefined, operacaoId });
    mostrar(r);
  });
  // E3 (parecer R27): resposta perdida = "Confirmação pendente"; reconciliar reenvia a MESMA intenção com a MESMA chave (o servidor
  // devolve o resultado guardado, sem nova mutação) e relê. O rótulo final vem SEMPRE da releitura.
  const bReconciliar = el('button', { type: 'button', 'data-uarps-reconciliar': '', hidden: '' }, 'Reconciliar'); acoes.insertBefore(bReconciliar, bConfirmar);
  bReconciliar.addEventListener('click', async () => {
    bReconciliar.disabled = true; const a = acaoDaPrevia || acao();
    const r = await alterarTrigger(store, { userId: p.userId, triggerId: p.triggerId, acao: a, motivo: motivo.value.trim() || undefined, operacaoId });
    bReconciliar.disabled = false; mostrar(r);
  });
  function mostrar(r: Resultado) {
    final = r; resultado.hidden = false; resultado.setAttribute('data-tom', r.ok ? 'ok' : (r.etapa === 'reler' || r.etapa === 'pendente') ? 'aviso' : 'erro');
    resultado.setAttribute('data-uarps-etapa', r.etapa); resultado.setAttribute('data-uarps-operacao', r.operacaoId); resultado.setAttribute('data-uarps-tentativas', String(r.tentativas));
    resultado.replaceChildren(el('div', {}, mensagemDoResultado(r)));
    if (r.releitura?.regra) resultado.appendChild(el('div', { 'data-uarps-regra': '' }, r.releitura.regra));
    if (r.releitura?.detalhe && !mensagemDoResultado(r).includes(r.releitura.detalhe)) resultado.appendChild(el('div', { 'data-uarps-detalhe': '' }, r.releitura.detalhe));
    resultado.appendChild(el('div', { 'data-uarps-id-operacao': '' }, `ID da operação: ${r.operacaoId}`));
    bReconciliar.hidden = r.etapa !== 'pendente';
    // pendente: a intenção fica TRAVADA (mudar escolha/motivo geraria outra chave e poderia gravar duas intenções)
    (fs as HTMLFieldSetElement).disabled = r.etapa === 'pendente'; (motivo as HTMLTextAreaElement).disabled = r.etapa === 'pendente';
    if (r.etapa === 'pendente') { bReconciliar.focus(); }
    if (!r.ok && r.etapa === 'gravar') { bConfirmar.disabled = false; bPrevia.disabled = false; }   // tentar de novo = MESMA chave (mesma intenção)
  }
  return new Promise((resolve) => {
    const fechar = () => { raiz.remove(); anterior?.focus?.(); resolve(final); };
    bFechar.addEventListener('click', fechar); raiz.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Escape') fechar(); });
    raiz.addEventListener('click', (e) => { if (e.target === raiz) fechar(); });
    (caixa.querySelector('input[name="uarps-alt-acao"]') as HTMLInputElement).focus();
  });
}
export default { abrirAlteracao };
