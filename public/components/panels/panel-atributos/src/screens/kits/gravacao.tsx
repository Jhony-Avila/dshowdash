// panel-atributos/src/screens/kits/gravacao.tsx — contrato "FOI SALVO" (docs/atributos/CONTRATO-FOI-SALVO.md) para as escritas dos KITS.
// Uma gravação = uma INTENÇÃO: a chave de operação (X-Chave-Operacao) nasce com o corpo congelado e vai junto em todo reenvio ("Tentar de
// novo com segurança" repete o MESMO corpo com a MESMA chave → o servidor aplica uma vez só). "Salvo" só com recibo; resposta perdida =
// "Não conseguimos confirmar se foi salvo." + "Conferir gravação" (GET, não grava). Enquanto incerto, a seção não inicia outra gravação.
import React from 'react';
import { conferirGravacao, enviar, ErroApi, MSG_DESCONHECIDO, novaChaveOperacao } from '../../lib/api';
import { faseDoConferir, faseIncerta, type FaseGravacao } from '../../lib/kits';
import { marcarPendencia } from '../../lib/pendencias';

export interface SituacaoGravacao { fase: FaseGravacao; msg?: string; podeRepetir?: boolean; semMudanca?: boolean; reenvio?: boolean; campos?: string[] }
interface Intencao<T> { rota: string; corpo: Readonly<Record<string, unknown>>; chave: string; aoConfirmar: (d: T | null, semMudanca: boolean) => void | Promise<void> }

/** Mensagem humana de uma recusa (422 com motivos/campos; demais pelo servidor). */
export const motivoErro = (e: unknown) => (e instanceof ErroApi ? (e.extra.motivos ? Object.values(e.extra.motivos).join(' ') : e.message) : e instanceof Error ? e.message : 'Falha inesperada.');

/**
 * Uma gravação por seção. `serial` é compartilhado pelas seções do mesmo kit: cada escrita sobe a versão do kit, então duas ao mesmo tempo
 * dariam 409 na segunda — a segunda espera (o botão fica indisponível).
 */
export function useGravacao<T = unknown>(id: string, serial: React.MutableRefObject<boolean>) {
  const [sit, setSit] = React.useState<SituacaoGravacao>({ fase: 'parado' });
  const ultimo = React.useRef<Intencao<T> | null>(null);
  const vivo = React.useRef(true);
  React.useEffect(() => () => { vivo.current = false; }, []);
  const set = (s: SituacaoGravacao) => { if (vivo.current) setSit(s); };
  const pendente = sit.fase === 'salvando' || faseIncerta(sit.fase);
  React.useEffect(() => { marcarPendencia(`kit:${id}`, pendente); return () => marcarPendencia(`kit:${id}`, false); }, [id, pendente]);

  const confirmar = async (u: Intencao<T>, d: T | null, semMudanca: boolean) => {
    set({ fase: 'salvo', semMudanca });
    try { await u.aoConfirmar(d, semMudanca); } finally {
      window.setTimeout(() => { if (vivo.current) setSit((s) => (s.fase === 'salvo' ? { fase: 'parado' } : s)); }, 2600);
    }
  };
  const falhar = (e: unknown) => {
    if (!(e instanceof ErroApi) || e.desconhecido) { set({ fase: 'desconhecido', podeRepetir: false }); return; }
    if (e.emAndamento) { set({ fase: 'emAndamento' }); return; }
    if (e.conflito) { set({ fase: 'conflito', msg: e.message }); return; }
    set({ fase: 'recusada', msg: motivoErro(e), podeRepetir: e.http >= 500 || e.interrompida, campos: e.campos });
  };
  const rodar = async (u: Intencao<T>, reenvio: boolean): Promise<boolean> => {
    if (serial.current) return false;
    serial.current = true; ultimo.current = u;
    set({ fase: 'salvando', reenvio });
    try {
      const d = await enviar<T & { desfecho?: string; sem_mudanca?: boolean }>(u.rota, u.corpo, { chave: u.chave });
      serial.current = false;
      await confirmar(u, d, d?.desfecho === 'sem_mudanca' || d?.sem_mudanca === true);
      return true;
    } catch (e) { serial.current = false; falhar(e); return false; }
  };

  /** Nova intenção (nova chave). Recusada enquanto o resultado anterior desta seção for incerto. */
  const gravar = (rota: string, corpo: Record<string, unknown>, aoConfirmar: Intencao<T>['aoConfirmar']) => {
    if (faseIncerta(sit.fase) || sit.fase === 'salvando') return Promise.resolve(false);
    return rodar({ rota, corpo: Object.freeze({ ...corpo }), chave: novaChaveOperacao(), aoConfirmar }, false);
  };
  /** Reenvio SEGURO: mesmo corpo, mesma chave. */
  const tentarDeNovo = () => { const u = ultimo.current; return u ? rodar(u, true) : Promise.resolve(false); };
  /** Conferir gravação: só GET; nada é reenviado. */
  const conferir = async () => {
    const u = ultimo.current; if (!u || sit.fase === 'conferindo') return;
    set({ fase: 'conferindo' });
    try {
      const c = await conferirGravacao(u.chave);
      const r = faseDoConferir(c.resultado);
      if (r.confirmado) { await confirmar(u, null, r.semMudanca); return; }
      set({ fase: r.fase, msg: c.resultado === 'nao_aplicada' ? (c.erro?.mensagem ?? r.msg) : r.msg, podeRepetir: r.podeRepetir });
    } catch { set({ fase: 'desconhecido', msg: 'Não foi possível conferir agora.' }); }
  };
  const limpar = () => set({ fase: 'parado' });
  return { sit, gravar, tentarDeNovo, conferir, limpar, ocupada: sit.fase === 'salvando' || sit.fase === 'conferindo', incerta: faseIncerta(sit.fase) };
}
/** Parte da gravação que a tela usa para MOSTRAR o estado (independe do tipo da resposta). */
export type Gravacao = Pick<ReturnType<typeof useGravacao>, 'sit' | 'conferir' | 'tentarDeNovo' | 'limpar' | 'ocupada' | 'incerta'>;

const Link = ({ children, aoClicar }: { children: React.ReactNode; aoClicar: () => void }) => <button type="button" className="at-link" onClick={aoClicar}>{children}</button>;

/**
 * Estado da gravação junto da SEÇÃO que a iniciou (ícone + texto curto; erro/incerteza com o próximo passo). `aoRecarregar` aparece no
 * conflito (o rascunho da seção fica até a pessoa escolher).
 */
export function EstadoGravacao({ g, aoRecarregar, rotuloRecarregar = 'Recarregar esta seção' }: { g: Gravacao; aoRecarregar?: () => void; rotuloRecarregar?: string }) {
  const s = g.sit;
  if (s.fase === 'parado') return null;
  const icone = (t: 'andando' | 'ok' | 'erro' | 'aviso') => <span className={`at-kv-estado__ic at-kv-estado__ic--${t}`} aria-hidden />;
  if (s.fase === 'salvando') return <span className="at-kv-estado at-kv-estado--andando" role="status" data-estado="salvando">{icone('andando')}{s.reenvio ? 'Reenviando a mesma alteração…' : 'Salvando…'}</span>;
  if (s.fase === 'conferindo') return <span className="at-kv-estado at-kv-estado--andando" role="status" data-estado="conferindo">{icone('andando')}Conferindo a gravação…</span>;
  if (s.fase === 'salvo') return <span className="at-kv-estado at-kv-estado--ok" role="status" data-estado="salvo">{icone('ok')}{s.semMudanca ? 'Nada mudou' : 'Salvo'}</span>;
  if (s.fase === 'emAndamento') return <span className="at-kv-estado at-kv-estado--aviso" role="alert" data-estado="em_andamento">{icone('aviso')}A gravação ainda está em andamento. <Link aoClicar={() => void g.conferir()}>Conferir gravação</Link></span>;
  if (s.fase === 'desconhecido') return (
    <span className="at-kv-estado at-kv-estado--erro" role="alert" data-estado="desconhecido">{icone('aviso')}{MSG_DESCONHECIDO}{s.msg ? ` ${s.msg}` : ''}{' '}
      <Link aoClicar={() => void g.conferir()}>{s.podeRepetir ? 'Consultar de novo' : 'Conferir gravação'}</Link>
      {s.podeRepetir && <> · <Link aoClicar={() => void g.tentarDeNovo()}>Tentar de novo com segurança</Link></>}
    </span>);
  if (s.fase === 'conflito') return (
    <span className="at-kv-estado at-kv-estado--erro" role="alert" data-estado="conflito">{icone('erro')}Este kit foi alterado por outra pessoa. Seu rascunho continua aqui.{' '}
      {aoRecarregar && <Link aoClicar={() => { g.limpar(); aoRecarregar(); }}>{rotuloRecarregar}</Link>}
    </span>);
  return (
    <span className="at-kv-estado at-kv-estado--erro" role="alert" data-estado="recusada">{icone('erro')}Não foi salvo. <em>{s.msg}</em>
      {s.podeRepetir && <> <Link aoClicar={() => void g.tentarDeNovo()}>Tentar de novo</Link></>}
    </span>);
}
