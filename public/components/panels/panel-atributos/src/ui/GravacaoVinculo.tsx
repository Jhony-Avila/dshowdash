// panel-atributos/src/ui/GravacaoVinculo.tsx (CIMA, 23/11) — "foi salvo ou não" nas gravações de VÍNCULO da Ficha (produto_atributo e produto_kit),
// com o MESMO contrato do editor de valor (EditorValor.tsx): UMA chave de operação por intenção (X-Chave-Operacao), "Salvo" só com recibo,
// recusa e conflito na linha, resposta perdida = "Não conseguimos confirmar se foi salvo." + [Conferir gravação] (GET, não grava) e
// [Tentar de novo com segurança] (o MESMO corpo com a MESMA chave: se a 1ª já gravou, o servidor devolve o recibo original — efeito único).
// Pedido do Jhony (23/11), a partir do inventário da ESQUERDA (PARA-STATUS §93): eram 9 chamadas SEM chave. Só tela; o servidor já trata a chave.
// Depois (23/11), também as decisões de sugestão da Ficha (sugestao: aceitar/recusar) e "Adicionar ao kit" (kit_itens).
import React from 'react';
import { conferirGravacao, enviar, ErroApi, MSG_DESCONHECIDO, novaChaveOperacao } from '../lib/api';
import { marcarPendencia } from '../lib/pendencias';

export type FaseGravacao = 'parado' | 'salvando' | 'conferindo' | 'salvo' | 'recusada' | 'conflito' | 'desconhecido' | 'emAndamento';
export interface EstadoGravacao { fase: FaseGravacao; descricao: string; msg?: string; semMudanca?: boolean; podeRepetir?: boolean; reenvio?: boolean }
interface Intencao { rota: 'produto_atributo' | 'produto_kit' | 'sugestao' | 'kit_itens'; corpo: Readonly<Record<string, unknown>>; chave: string; descricao: string; ok: string; depois?: () => void }

let seq = 0;
/** Uma gravação de vínculo por vez neste ponto da tela. `aoConfirmar` = recarregar a ficha depois do recibo. */
export function useGravacaoVinculo(aoConfirmar: () => unknown) {
  const [est, setEst] = React.useState<EstadoGravacao>({ fase: 'parado', descricao: '' });
  const ultima = React.useRef<Intencao | null>(null);
  const ocupado = React.useRef(false);
  const id = React.useRef(`vinculo:${++seq}`);
  const pendente = est.fase === 'salvando' || est.fase === 'conferindo' || est.fase === 'desconhecido' || est.fase === 'emAndamento';
  React.useEffect(() => { marcarPendencia(id.current, pendente); return () => marcarPendencia(id.current, false); }, [pendente]);

  const confirmado = (u: Intencao, semMudanca: boolean) => {
    setEst({ fase: 'salvo', descricao: u.descricao, msg: semMudanca ? 'Nada mudou (já estava assim).' : u.ok, semMudanca });
    u.depois?.(); Promise.resolve(aoConfirmar()).catch(() => undefined);
  };
  const falhou = (u: Intencao, e: unknown) => {
    if (!(e instanceof ErroApi) || e.desconhecido) { setEst({ fase: 'desconhecido', descricao: u.descricao }); return; }
    if (e.emAndamento) { setEst({ fase: 'emAndamento', descricao: u.descricao }); return; }
    if (e.conflito) { setEst({ fase: 'conflito', descricao: u.descricao, msg: 'Os vínculos deste produto mudaram desde que você abriu a ficha (talvez em outra aba). Nada foi gravado; a ficha foi atualizada — confira e refaça.' }); Promise.resolve(aoConfirmar()).catch(() => undefined); return; }
    const motivo = e.extra.motivos ? Object.values(e.extra.motivos).join(' ') : e.message;
    setEst({ fase: 'recusada', descricao: u.descricao, msg: motivo || e.message, podeRepetir: e.http >= 500 });
  };
  const executar = async (u: Intencao, reenvio = false): Promise<boolean> => {
    if (ocupado.current) return false;
    ocupado.current = true; ultima.current = u; setEst({ fase: 'salvando', descricao: u.descricao, reenvio });
    try {
      const d = await enviar<{ desfecho?: string }>(u.rota, u.corpo, { chave: u.chave });
      confirmado(u, d?.desfecho === 'sem_mudanca'); return true;
    } catch (e) { falhou(u, e); return false; } finally { ocupado.current = false; }
  };
  /** Nova INTENÇÃO (um clique): chave nova; o corpo fica congelado para o "Tentar de novo". */
  const gravar = (rota: Intencao['rota'], corpo: Record<string, unknown>, descricao: string, ok: string, depois?: () => void) =>
    executar({ rota, corpo: Object.freeze({ ...corpo }), chave: novaChaveOperacao(), descricao, ok, depois });
  const tentarDeNovo = () => { const u = ultima.current; if (u) executar(u, true); };
  const conferir = async () => {
    const u = ultima.current; if (!u || ocupado.current) return;
    ocupado.current = true; setEst({ fase: 'conferindo', descricao: u.descricao });
    try {
      const c = await conferirGravacao(u.chave);
      if (c.resultado === 'aplicada' || c.resultado === 'sem_mudanca') { confirmado(u, c.resultado === 'sem_mudanca'); return; }
      if (c.resultado === 'em_andamento') setEst({ fase: 'emAndamento', descricao: u.descricao });
      else if (c.resultado === 'nao_aplicada') setEst({ fase: 'recusada', descricao: u.descricao, msg: c.erro?.mensagem ?? 'O servidor não aplicou esta alteração.' });
      else if (c.resultado === 'interrompida') setEst({ fase: 'recusada', descricao: u.descricao, msg: 'A gravação foi interrompida antes de concluir. Nada foi gravado.', podeRepetir: true });
      else setEst({ fase: 'desconhecido', descricao: u.descricao, msg: 'Ainda não encontramos o resultado desta gravação.', podeRepetir: true });   // nao_encontrada NÃO prova "não salvo"
    } catch { setEst({ fase: 'desconhecido', descricao: u.descricao, msg: 'Não foi possível conferir agora.' }); } finally { ocupado.current = false; }
  };
  const limpar = () => setEst({ fase: 'parado', descricao: '' });
  /** Enquanto o resultado de uma intenção é incerto, outra gravação NESTE ponto espera (primeiro conferir). */
  const travado = est.fase === 'salvando' || est.fase === 'conferindo' || est.fase === 'desconhecido' || est.fase === 'emAndamento';
  return { est, gravar, tentarDeNovo, conferir, limpar, travado, chave: () => ultima.current?.chave ?? null };
}
export type GravacaoVinculo = ReturnType<typeof useGravacaoVinculo>;

/** Linha de estado (mesmas classes e textos do editor de valor). Some quando parado; "Salvo" some sozinho depois de alguns segundos. */
export function EstadoVinculo({ g }: { g: GravacaoVinculo }) {
  const { est } = g;
  React.useEffect(() => { if (est.fase !== 'salvo') return; const t = window.setTimeout(g.limpar, 6000); return () => window.clearTimeout(t); }, [est]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (est.fase === 'parado') return null;
  const link = (r: string, f: () => void) => <button type="button" className="at-link" onClick={f}>{r}</button>;
  const pre = est.descricao ? <strong className="at-vinculo-estado__o-que">{est.descricao}: </strong> : null;
  return (
    <div className="at-vinculo-estado" data-vinculo-estado={est.fase}>
      {est.fase === 'salvando' ? <span className="at-salvo at-salvo--andando">{pre}{est.reenvio ? 'Reenviando a mesma alteração…' : 'Salvando…'}</span>
        : est.fase === 'conferindo' ? <span className="at-salvo at-salvo--andando">{pre}Conferindo a gravação…</span>
        : est.fase === 'salvo' ? <span className="at-salvo at-salvo--ok" role="status">{pre}{est.semMudanca ? 'Nada mudou' : 'Salvo'}{est.msg ? ` — ${est.msg}` : ''}</span>
        : est.fase === 'recusada' ? <span className="at-salvo at-salvo--erro" role="alert">{pre}Não foi salvo. <em className="at-salvo__motivo">{est.msg}</em>{est.podeRepetir && <> {link('Tentar de novo', g.tentarDeNovo)}</>}</span>
        : est.fase === 'conflito' ? <span className="at-salvo at-salvo--erro" role="alert">{pre}{est.msg} {link('Fechar', g.limpar)}</span>
        : est.fase === 'emAndamento' ? <span className="at-salvo at-salvo--aviso" role="alert">{pre}A gravação ainda está em andamento. {link('Conferir gravação', g.conferir)}</span>
        : <span className="at-salvo at-salvo--erro" role="alert">{pre}{MSG_DESCONHECIDO}{est.msg ? ` ${est.msg}` : ''} {link(est.podeRepetir ? 'Consultar de novo' : 'Conferir gravação', g.conferir)}{est.podeRepetir && <> · {link('Tentar de novo com segurança', g.tentarDeNovo)}</>}</span>}
    </div>);
}
