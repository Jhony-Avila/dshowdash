// panel-atributos/src/ui/EditorValor.tsx — campo de valor por tipo, com unidade, estado e gravação por campo (A10: sem interface otimista —
// "Salvo" só depois da resposta). Usado na ficha e na grade. Conflito de versão (409) → "Alguém alterou este campo. Recarregar".
import React from 'react';
import type { ItemFicha } from '../lib/tipos';
import { enviar, ErroApi } from '../lib/api';
import { decimal, numeroParaApi } from '../lib/formatar';
import { ESTADO } from '../lib/rotulos';
import { Dialogo, Botao } from './Comuns';

type Situacao = { tipo: 'parado' } | { tipo: 'salvando' } | { tipo: 'salvo' } | { tipo: 'erro'; msg: string } | { tipo: 'conflito' };

function rascunhoDe(it: ItemFicha): string {
  const v = it.valor;
  if (!v || v.estado !== 'informado') return '';
  if (it.tipo === 'numero' || it.tipo === 'inteiro') return v.numero !== null ? decimal(v.numero) : '';
  if (it.tipo === 'data') return v.data ?? '';
  if (it.tipo === 'opcao') return v.opcao_ids[0] ? String(v.opcao_ids[0]) : '';
  if (it.tipo === 'booleano') return v.booleano === null ? '' : v.booleano ? '1' : '0';
  return v.texto ?? '';
}

export function EditorValor({ item, productId, podeEditar, compacto = false, aoGravar, aoRecarregar, autoFoco = false }: {
  item: ItemFicha; productId: number; podeEditar: boolean; compacto?: boolean; aoGravar: () => void; aoRecarregar: () => void; autoFoco?: boolean;
}) {
  const [txt, setTxt] = React.useState(() => rascunhoDe(item));
  const [sit, setSit] = React.useState<Situacao>({ tipo: 'parado' });
  const [trocaUnidade, setTrocaUnidade] = React.useState<number | null>(null);
  // unidade escolhida ANTES do número num campo vazio: faz parte do RASCUNHO da célula e vai junto na 1ª gravação (Cima, 18/11)
  const [unidRascunho, setUnidRascunho] = React.useState<number | null>(null);
  // apagar o texto de um campo PREENCHIDO não limpa sozinho: pede confirmação mostrando o valor salvo (Cima, 18/11); Esc/Cancelar restaura
  const [confirmarLimpar, setConfirmarLimpar] = React.useState(false);
  const original = React.useRef(rascunhoDe(item));
  const ocupado = React.useRef(false);                                   // uma gravação por vez (Enter + sair do campo não grava 2×)
  const ultimo = React.useRef<{ rota: string; corpo: Record<string, unknown>; texto?: string } | null>(null);   // "Tentar de novo" repete esta
  const [esperando, setEsperando] = React.useState(false);              // gravou; aguardando a recarga trazer a versão nova
  React.useEffect(() => { const r = rascunhoDe(item); setTxt(r); original.current = r; setEsperando(false); setUnidRascunho(null); }, [item.valor?.versao, item.versao_conjunto, item.valor?.versao_conjunto, item.valor?.estado, item.atributo_id]);
  React.useEffect(() => { if (!esperando) return; const t = window.setTimeout(() => setEsperando(false), 3000); return () => window.clearTimeout(t); }, [esperando]);
  const estado = item.valor?.estado ?? null;
  const unidadeAtual = unidRascunho ?? item.valor?.unidade_id ?? item.unidade_efetiva?.id ?? null;
  const numerico = item.tipo === 'numero' || item.tipo === 'inteiro';
  const ro = !podeEditar || item.autoridade === 'precifica';
  const id = `campo-${productId}-${item.atributo_id}`;

  const chamar = async (rota: string, corpo: Record<string, unknown>, texto?: string) => {
    if (ocupado.current || esperando) return;
    ocupado.current = true; ultimo.current = { rota, corpo, texto };
    setSit({ tipo: 'salvando' });
    try {
      // DSHOW-034: a versão do CONJUNTO vai em toda gravação (limpar/mudar estado da multiopção a exigem; o servidor ignora nos demais)
      await enviar(rota, { product_id: productId, atributo_id: item.atributo_id, versao_conjunto: item.versao_conjunto ?? item.valor?.versao_conjunto, ...corpo });
      if (texto !== undefined) original.current = texto;                  // já gravado: sair do campo não reenvia
      setSit({ tipo: 'salvo' }); setEsperando(true); aoGravar(); window.setTimeout(() => setSit((s) => (s.tipo === 'salvo' ? { tipo: 'parado' } : s)), 2500);
    } catch (e) {
      if (e instanceof ErroApi && e.conflito) setSit({ tipo: 'conflito' });
      else setSit({ tipo: 'erro', msg: e instanceof ErroApi ? e.message : 'Falha de rede.' });
    } finally { ocupado.current = false; }
  };
  const tentarDeNovo = () => { const u = ultimo.current; if (u) chamar(u.rota, u.corpo, u.texto); };
  const travado = sit.tipo === 'salvando' || esperando;
  const versao = item.valor?.versao;
  const gravar = (valor: unknown, extra: Record<string, unknown> = {}, texto?: string) => chamar('valor', { valor, estado: 'informado', versao, ...(numerico && unidadeAtual ? { unidade_id: unidRascunho ?? item.valor?.unidade_id ?? null } : {}), ...extra }, texto);
  const confirmarTexto = () => {
    if (ro || txt === original.current || ocupado.current || esperando || confirmarLimpar) return;
    if (txt.trim() === '') { if (item.valor && !confirmarLimpar) setConfirmarLimpar(true); return; }
    gravar(numerico ? numeroParaApi(txt) : txt, {}, txt);
  };

  const status = sit.tipo === 'salvando' ? <span className="at-salvo at-salvo--andando" role="status">Salvando…</span>
    : sit.tipo === 'salvo' ? <span className="at-salvo at-salvo--ok" role="status">Salvo</span>
    : sit.tipo === 'erro' ? <span className="at-salvo at-salvo--erro" role="alert">{compacto ? '!' : 'Não foi possível salvar.'} <button type="button" className="at-link" onClick={tentarDeNovo}>Tentar de novo</button>{!compacto && <em> {sit.msg}</em>}</span>
    : sit.tipo === 'conflito' ? <span className="at-salvo at-salvo--erro" role="alert">Alguém alterou este campo. <button type="button" className="at-link" onClick={() => { setSit({ tipo: 'parado' }); aoRecarregar(); }}>Recarregar</button></span>
    : null;

  let campo: React.ReactNode;
  if (estado && estado !== 'informado') {
    campo = <span className={`at-estado-fixo at-estado-fixo--${estado}`}>{ESTADO[estado]}</span>;
  } else if (item.tipo === 'booleano') {
    campo = (
      <div className="at-segmentado" role="radiogroup" aria-label={item.rotulo}>
        {[['1', 'Sim'], ['0', 'Não'], ['', 'Sem resposta']].map(([v, r]) => (
          <button key={r} type="button" role="radio" aria-checked={txt === v} disabled={ro || travado} className={txt === v ? 'ativo' : ''}
            onClick={() => { if (v === txt) return; setTxt(v); if (v === '') { if (item.valor) chamar('valor_limpar', { versao }); } else gravar(v === '1'); }}>{r}</button>))}
      </div>);
  } else if (item.tipo === 'opcao') {
    campo = (
      <select id={id} className="at-campo" value={txt} disabled={ro || travado} aria-label={item.rotulo} autoFocus={autoFoco}
        onChange={(e) => { setTxt(e.target.value); if (e.target.value === '') { if (item.valor) chamar('valor_limpar', { versao }); } else gravar(Number(e.target.value)); }}>
        <option value="">—</option>
        {item.opcoes.filter((o) => o.ativo || String(o.id) === txt).map((o) => <option key={o.id} value={o.id}>{o.rotulo}{o.ativo ? '' : ' (desativada)'}</option>)}
      </select>);
  } else if (item.tipo === 'multiopcao') {
    const marcadas = new Set(item.valor?.opcao_ids ?? []);
    campo = (
      <div className="at-multi">{item.opcoes.filter((o) => o.ativo || marcadas.has(o.id)).map((o) => (
        <label key={o.id} className="at-check"><input type="checkbox" checked={marcadas.has(o.id)} disabled={ro || travado}
          onChange={(e) => e.target.checked ? gravar(o.id) : chamar('valor_opcao_remover', { opcao_id: o.id, versao })} />{o.rotulo}</label>))}</div>);
  } else {
    campo = (
      <input id={id} className={`at-campo ${numerico ? 'at-campo--num' : ''}`} type={item.tipo === 'data' ? 'date' : 'text'} inputMode={numerico ? 'decimal' : undefined}
        value={txt} readOnly={ro} aria-label={item.rotulo} autoFocus={autoFoco} placeholder={ro ? '' : numerico ? '—' : item.tipo === 'data' ? '' : 'Digite…'}
        onChange={(e) => setTxt(e.target.value)} onBlur={confirmarTexto}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmarTexto(); } if (e.key === 'Escape') setTxt(original.current); }} />);
  }

  return (
    <div className={`at-editor ${compacto ? 'at-editor--compacto' : ''}`}>
      <div className="at-editor__linha">
        {campo}
        {numerico && item.unidades.length > 0 && (
          <select className="at-campo at-campo--unid" aria-label={`Unidade de ${item.rotulo}`} disabled={ro || travado || (estado !== null && estado !== 'informado')} value={unidadeAtual ?? ''}
            onChange={(e) => {
              const u = Number(e.target.value);
              if (item.valor?.numero != null && item.valor.estado === 'informado') setTrocaUnidade(u);   // H5: pergunta converter × só trocar
              else if (txt.trim() !== '') gravar(numeroParaApi(txt), { unidade_id: u }, txt);
              else setUnidRascunho(u);   // campo vazio: guarda a escolha; vai junto com o número na 1ª gravação
            }}>
            {item.unidades.map((u) => <option key={u.id} value={u.id}>{u.simbolo}</option>)}
          </select>)}
        {numerico && item.unidades.length === 0 && item.unidade_efetiva && <span className="at-unid-fixa">{item.unidade_efetiva.simbolo}</span>}
        {!ro && !compacto && (
          <select className="at-campo at-campo--estado" aria-label={`Estado de ${item.rotulo}`} value={estado ?? ''} disabled={travado}
            onChange={(e) => { const v = e.target.value; if (v === 'informado' || v === '') { if (estado && estado !== 'informado') chamar('valor_limpar', { versao }); return; } chamar('valor', { estado: v, versao }); }}>
            <option value="">{estado === 'informado' ? 'Informado' : 'Sem valor'}</option>
            {item.aceita_nao_se_aplica && <option value="nao_se_aplica">Não se aplica</option>}
            <option value="desconhecido">Desconhecido</option>
          </select>)}
      </div>
      {status}
      <Dialogo titulo="Limpar o valor?" aberto={confirmarLimpar} aoFechar={() => { setConfirmarLimpar(false); setTxt(original.current); }}
        rodape={<>
          <Botao aoClicar={() => { setConfirmarLimpar(false); setTxt(original.current); }}>Cancelar</Botao>
          <Botao perigo aoClicar={() => { setConfirmarLimpar(false); chamar('valor_limpar', { versao }, ''); }}>Limpar valor</Botao>
        </>}>
        <p>O valor salvo de <strong>{item.rotulo}</strong> é <strong>{original.current}{numerico && unidadeAtual ? ` ${item.unidades.find((u) => u.id === unidadeAtual)?.simbolo ?? item.unidade_efetiva?.simbolo ?? ''}` : ''}</strong>. Limpar apaga o valor (fica no histórico).</p>
      </Dialogo>
      <Dialogo titulo="Trocar a unidade" aberto={trocaUnidade !== null} aoFechar={() => setTrocaUnidade(null)}
        rodape={<>
          <Botao aoClicar={() => setTrocaUnidade(null)}>Cancelar</Botao>
          <Botao aoClicar={() => { const u = trocaUnidade; setTrocaUnidade(null); chamar('valor_unidade', { unidade_id: u, converter: false, versao }); }}>Só trocar a unidade</Botao>
          <Botao primario aoClicar={() => { const u = trocaUnidade; setTrocaUnidade(null); chamar('valor_unidade', { unidade_id: u, converter: true, versao }); }}>Converter o número</Botao>
        </>}>
        <p>O valor atual é <strong>{item.valor?.numero ? decimal(item.valor.numero) : ''} {item.unidades.find((u) => u.id === unidadeAtual)?.simbolo}</strong>. Para <strong>{item.unidades.find((u) => u.id === trocaUnidade)?.simbolo}</strong>:</p>
        <ul className="at-lista-simples"><li><strong>Converter o número</strong>: recalcula pelo fator da unidade (ex.: 1500 mm → 150 cm).</li><li><strong>Só trocar a unidade</strong>: mantém o número e corrige a unidade (quando o número já estava na unidade nova).</li></ul>
      </Dialogo>
    </div>
  );
}
