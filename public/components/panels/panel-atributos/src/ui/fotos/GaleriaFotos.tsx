// FOTOS NA FICHA (CIMA, 19/11) — roteiro aprovado (PESQUISA-FOTOS-UX-chatgpt-2026-11-19.md) sobre o contrato do proxy (CONTRATO-PROXY-MIDIA.md v1.0).
// UM diálogo "Adicionar fotos · <código> — <nome>": arquivo, arrastar, colar (Ctrl+V/⌘V SÓ aqui dentro) e câmera alimentam a MESMA fila de prévias;
// cada prévia sai antes de "Publicar N fotos". Por foto: Pronta para publicar → Enviando (% da transferência) → Processando → Publicada (SÓ com recibo
// daquela chave, operação e produto). Duplicada = "Esta foto já está na galeria" + "Ver foto". Resposta perdida = "Ainda não conseguimos confirmar o envio desta foto." +
// "Conferir gravação" / "Reenviar com segurança". Sessão encerrada (401) = "Entrar novamente" (outra aba) → "Continuar envio" (parecer 23/11). A fila (com as chaves e os resultados) vive FORA do diálogo: fechar e reabrir mantém tudo, e um envio em curso continua.
// Aba Fotos: "Definir como principal", Reordenar (arrastar ou setas; "A primeira foto será a principal"; Salvar ordem / Cancelar), remover com Desfazer, restaurar.
import React from 'react';
import { ErroApi, novaChaveOperacao } from '../../lib/api';
import { ACEITOS, conferirFoto, DETALHES_LIMITES, ehHeic, entrarNovamente, sessaoRenovada, FORMATOS_TEXTO, LIMITE_BYTES, marcarCapa, ordenarFotos, prepararArquivo, publicarFoto, removerFoto, restaurarFoto,
  urlImagem, type EstadoGaleria, type FotoGaleria, type ReciboFoto, type RespostaFoto, classificarErroFoto } from '../../lib/fotos';
import { marcarPendencia } from '../../lib/pendencias';
import { Botao, Dialogo, Foto } from '../Comuns';
import { Icone } from '../Icones';

// ── fila por produto, fora do React (sobrevive a fechar/reabrir o diálogo e ao fim de um envio com o diálogo fechado) ──────────────────
export type EstadoItem = 'pronta' | 'enviando' | 'processando' | 'publicada' | 'duplicada' | 'recusada' | 'desconhecido' | 'conferindo' | 'andando';
export interface Item { id: number; arquivo: File; preview: string | null; estado: EstadoItem; pct?: number; msg?: string; chave?: string; recibo?: ReciboFoto; principal?: boolean; sessao?: boolean; demorando?: boolean }
let seqItem = 0;
const filas = new Map<number, Item[]>();
const ouvintes = new Map<number, Set<() => void>>();
const VAZIA: Item[] = [];
const ler = (p: number) => filas.get(p) ?? VAZIA;
const gravar = (p: number, f: (xs: Item[]) => Item[]) => { filas.set(p, f(ler(p))); ouvintes.get(p)?.forEach((o) => o()); };
const mudar = (p: number, id: number, d: Partial<Item>) => gravar(p, (xs) => xs.map((x) => (x.id === id ? { ...x, ...d } : x)));
function useFila(p: number): Item[] {
  return React.useSyncExternalStore((o) => { const s = ouvintes.get(p) ?? new Set(); s.add(o); ouvintes.set(p, s); return () => { s.delete(o); }; }, () => ler(p));
}
const INCERTO: EstadoItem[] = ['enviando', 'processando', 'desconhecido', 'conferindo', 'andando'];
const FIM: EstadoItem[] = ['publicada', 'duplicada'];
const TEXTO: Record<EstadoItem, string> = { pronta: 'Pronta para publicar', enviando: 'Enviando', processando: 'Processando…', publicada: 'Publicada', duplicada: 'Esta foto já está na galeria',
  recusada: 'Não foi publicada', desconhecido: 'Ainda não conseguimos confirmar o envio desta foto.', conferindo: 'Conferindo a gravação…', andando: 'Ainda em processamento no servidor' };

/** Sessão encerrada (401, parecer do Jhony 23/11): "Entrar novamente" ENCERRA a sessão do Dash (como o menu → Sair; §114) e abre a tela de
 *  senha em outra aba (a fila e a ficha ficam aqui). Codex DSHOW-114 (P9):
 *  - a saída só vale CONFIRMADA (logout 2xx ou check "não autenticado"); desconhecida (503, rede, CSRF, 5xx) = o aviso fica, nada de /login,
 *    e a pessoa tenta de novo;
 *  - "Continuar" só retoma depois de um LOGIN REAL (sessão nova). Sessão antiga ainda viva ou check indisponível NÃO retomam.
 *  Usado na linha da foto, no aviso da página e na aba Fotos. Nenhuma operação incerta é reenviada daqui (só a recusada por sessão). */
export function EntrarNovamente({ aoContinuar, rotulo = 'Continuar' }: { aoContinuar: () => void; rotulo?: string }) {
  type Fase = { f: 'inicial' } | { f: 'saindo' } | { f: 'nao_saiu'; motivo: string } | { f: 'aguardando'; sessaoAntiga: string | null; aviso?: string } | { f: 'conferindo'; sessaoAntiga: string | null };
  const [fase, setFase] = React.useState<Fase>({ f: 'inicial' });
  const sair = () => {
    if (fase.f === 'saindo') return; setFase({ f: 'saindo' });
    void entrarNovamente().then((r) => setFase(r.estado === 'encerrada' ? { f: 'aguardando', sessaoAntiga: r.sessaoAntiga } : { f: 'nao_saiu', motivo: r.motivo }));
  };
  const continuar = () => {
    if (fase.f !== 'aguardando') return; const antiga = fase.sessaoAntiga; setFase({ f: 'conferindo', sessaoAntiga: antiga });
    void sessaoRenovada(antiga).then((v) => {
      if (v === 'nova') { setFase({ f: 'inicial' }); aoContinuar(); return; }
      setFase({ f: 'aguardando', sessaoAntiga: antiga, aviso: v === 'desconhecido' ? 'Não foi possível verificar a sua entrada agora. Tente de novo.'
        : v === 'antiga' ? 'A sessão anterior ainda está ativa. Entre de novo na outra aba e depois clique em “' + rotulo + '”.'
        : 'Ainda não identificamos a sua entrada. Entre na outra aba e depois clique em “' + rotulo + '”.' });
    });
  };
  const aguardando = fase.f === 'aguardando' || fase.f === 'conferindo';
  return (
    <span className="at-entrar-novamente" data-at-entrar data-at-entrar-fase={fase.f}>
      {!aguardando && <button type="button" className="at-link" onClick={sair} disabled={fase.f === 'saindo'} aria-busy={fase.f === 'saindo'}>
        {fase.f === 'saindo' ? 'Encerrando a sessão…' : fase.f === 'nao_saiu' ? 'Tentar de novo' : 'Entrar novamente'}</button>}
      {fase.f === 'nao_saiu' && <span className="at-entrar-novamente__dica" role="alert" data-at-entrar-nao-saiu> Não foi possível encerrar a sessão agora. Verifique a conexão e tente de novo.</span>}
      {aguardando && <> <span className="at-entrar-novamente__dica" data-at-entrar-retomar>{fase.f === 'aguardando' && fase.aviso ? fase.aviso : `Depois de entrar na nova aba, volte aqui e clique em “${rotulo}”.`}</span>
        <button type="button" className="at-link" onClick={continuar} disabled={fase.f === 'conferindo'} aria-busy={fase.f === 'conferindo'}>{fase.f === 'conferindo' ? 'Verificando…' : rotulo}</button></>}
    </span>
  );
}

/** Separa o que é imagem aceitável do resto (com o motivo). */
export function filtrarImagens(lista: FileList | File[] | null | undefined): { ok: File[]; recusados: string[] } {
  const ok: File[] = [], recusados: string[] = [];
  for (const f of Array.from(lista ?? [])) {
    if (!(ACEITOS.test(f.type) || ehHeic(f))) recusados.push(`${f.name || 'arquivo'}: não é JPEG, PNG, WebP nem HEIC`);
    else if (f.size > LIMITE_BYTES) recusados.push(`${f.name || 'arquivo'}: maior que 15 MB`);
    else ok.push(f);
  }
  return { ok, recusados };
}
/** Recibo válido para ESTA foto: mesma chave, operação de publicar e o produto certo. */
const reciboValido = (r: ReciboFoto | undefined, chave: string, produto: number) => !!r && r.chave === chave && r.operacao === 'foto_publicar' && Number(r.produto_id) === produto;
export function resumoFila(itens: Item[]): string {
  const n = (e: EstadoItem[]) => itens.filter((x) => e.includes(x.estado)).length;
  const partes = [[n(['publicada']), 'publicada', 'publicadas'], [n(['duplicada']), 'já existente', 'já existentes'], [n(['desconhecido', 'andando', 'conferindo']), 'a conferir', 'a conferir'],
    [n(['recusada']), 'não publicada', 'não publicadas'], [n(['enviando', 'processando']), 'enviando', 'enviando'], [n(['pronta']), 'pronta', 'prontas']] as [number, string, string][];
  return partes.filter(([k]) => k > 0).map(([k, s, pl]) => `${k} ${k === 1 ? s : pl}`).join(' · ');
}

export function AdicionarFotos({ produto, aberto, aoFechar, aoMudou, versaoGaleria, vagas, aoVerFoto }: {
  produto: { id: number; nome: string }; aberto: boolean; aoFechar: () => void; aoMudou: () => void; versaoGaleria: number; vagas: number | null; aoVerFoto: (fotoId: number) => void;
}) {
  const P = produto.id; const itens = useFila(P);
  const [avisos, setAvisos] = React.useState<string[]>([]);
  const [camera, setCamera] = React.useState(false);
  const [arrastando, setArrastando] = React.useState(false);
  const [capaMsg, setCapaMsg] = React.useState<string | null>(null);
  const [publicando, setPublicando] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const versao = React.useRef(versaoGaleria); React.useEffect(() => { versao.current = Math.max(versao.current, versaoGaleria); }, [versaoGaleria]);
  const acrescentar = (lista: File[] | FileList | null | undefined) => {
    const { ok, recusados } = filtrarImagens(lista); setAvisos(recusados);
    if (ok.length) gravar(P, (xs) => [...xs, ...ok.map((f) => ({ id: ++seqItem, arquivo: f, preview: ehHeic(f) ? null : URL.createObjectURL(f), estado: 'pronta' as EstadoItem }))]);
  };
  const pendente = itens.some((x) => INCERTO.includes(x.estado));
  React.useEffect(() => { const k = `fotos:${P}`; marcarPendencia(k, pendente); return () => marcarPendencia(k, false); }, [pendente, P]);

  const publicarUm = async (it: Item): Promise<ReciboFoto | null> => {
    const chave = it.chave ?? novaChaveOperacao();   // mesma chave (e mesmos bytes) em qualquer reenvio desta foto
    mudar(P, it.id, { estado: 'enviando', pct: 0, chave, msg: undefined, sessao: undefined, demorando: undefined });
    try {
      const corpo = await prepararArquivo(it.arquivo);
      const r: RespostaFoto = await publicarFoto(P, corpo, chave, (fase, pct) => mudar(P, it.id, { estado: fase, pct }));
      if (!reciboValido(r.recibo, chave, P)) { mudar(P, it.id, { estado: 'desconhecido' }); return null; }
      versao.current = r.recibo.versao_nova;
      mudar(P, it.id, { estado: r.recibo.duplicada ? 'duplicada' : 'publicada', recibo: r.recibo });
      return r.recibo;
    } catch (e) {
      const c = classificarErroFoto(e instanceof ErroApi ? e : null);
      if (c.tipo === 'andando') mudar(P, it.id, { estado: 'andando' });
      else if (c.tipo === 'recusada') mudar(P, it.id, { estado: 'recusada', msg: c.msg, sessao: c.sessao, chave: undefined });   // recusa comprovada (inclui sessão e canal): nova tentativa = chave nova
      else if (c.tipo === 'conflito') mudar(P, it.id, { estado: 'recusada', msg: (e as Error).message, chave: undefined });
      else mudar(P, it.id, { estado: 'desconhecido' });
      return null;
    }
  };
  const publicarTodas = async () => {
    if (publicando) return; setPublicando(true); setCapaMsg(null); let algum = false;
    for (const it of ler(P).filter((x) => x.estado === 'pronta')) { if (await publicarUm(it)) algum = true; }
    const p = ler(P).find((x) => x.principal && x.recibo?.foto_id);
    if (p?.recibo?.foto_id) {
      try { const r = await marcarCapa(p.recibo.foto_id, versao.current); versao.current = r.recibo.versao_nova; mudar(P, p.id, { principal: false }); setCapaMsg('Foto principal definida.'); algum = true; }
      catch (e) { setCapaMsg(e instanceof ErroApi && (e.recusada || e.conflito) ? `A foto principal não foi definida (${e.message}).` : 'Não conseguimos confirmar a foto principal. Defina de novo na aba Fotos.'); }
    }
    setPublicando(false); if (algum) aoMudou();
  };
  /** Conferir gravação: SÓ leitura, com a chave guardada desta foto. */
  const conferir = async (it: Item) => {
    if (!it.chave) return; mudar(P, it.id, { estado: 'conferindo' });
    try {
      const c = await conferirFoto(it.chave);
      if (c.tipo === 'salvo' && reciboValido(c.recibo, it.chave, P)) { versao.current = Math.max(versao.current, c.recibo.versao_nova); mudar(P, it.id, { estado: c.recibo.duplicada ? 'duplicada' : 'publicada', recibo: c.recibo, msg: undefined }); aoMudou(); }
      else if (c.tipo === 'andando') mudar(P, it.id, { estado: 'andando', demorando: !!c.demorando, msg: c.demorando ? 'Está demorando mais que o normal.' : undefined });
      else if (c.tipo === 'nao_aplicada') mudar(P, it.id, { estado: 'recusada', msg: c.msg, chave: undefined });
      else mudar(P, it.id, { estado: 'desconhecido', msg: undefined });   // o texto do estado já diz tudo (sem linguagem técnica, parecer 23/11)
    } catch { mudar(P, it.id, { estado: 'desconhecido', msg: 'Não foi possível conferir agora.' }); }
  };
  const reenviar = async (it: Item) => { if (await publicarUm(it)) aoMudou(); };
  const tirar = (id: number) => gravar(P, (xs) => { const x = xs.find((y) => y.id === id); if (x?.preview) URL.revokeObjectURL(x.preview); return xs.filter((y) => y.id !== id); });
  const tirarConcluidas = () => gravar(P, (xs) => xs.filter((x) => { const fim = FIM.includes(x.estado); if (fim && x.preview) URL.revokeObjectURL(x.preview); return !fim; }));
  const mover = (id: number, d: -1 | 1) => gravar(P, (xs) => { const i = xs.findIndex((x) => x.id === id); const j = i + d; if (i < 0 || j < 0 || j >= xs.length) return xs; const c = [...xs]; [c[i], c[j]] = [c[j], c[i]]; return c; });
  const principal = (id: number) => gravar(P, (xs) => xs.map((x) => ({ ...x, principal: x.id === id })));
  const prontas = itens.filter((x) => x.estado === 'pronta').length;
  const resumo = resumoFila(itens);

  return (
    <>
      <Dialogo titulo={`Adicionar fotos · ${P} — ${produto.nome}`} aberto={aberto && !camera} aoFechar={aoFechar} largura={760}
        rodape={<>{itens.some((x) => FIM.includes(x.estado)) && <Botao aoClicar={tirarConcluidas}>Tirar concluídas da lista</Botao>}<Botao aoClicar={aoFechar}>Fechar</Botao>
          <Botao primario desligado={!prontas || publicando} aoClicar={publicarTodas}>{prontas ? `Publicar ${prontas} foto${prontas === 1 ? '' : 's'}` : 'Publicar'}</Botao></>}>
        <div className="at-fotos-add" onPaste={(e) => { const f = Array.from(e.clipboardData?.files ?? []); if (f.length) { e.preventDefault(); acrescentar(f); } }}>
          <div className={`at-fotos-add__zona ${arrastando ? 'at-fotos-add__zona--ativa' : ''}`} tabIndex={0} aria-label="Área para arrastar ou colar fotos"
            onDragOver={(e) => { e.preventDefault(); setArrastando(true); }} onDragLeave={() => setArrastando(false)}
            onDrop={(e) => { e.preventDefault(); setArrastando(false); acrescentar(e.dataTransfer.files); }}>
            <div className="at-fotos-add__acoes">
              <Botao aoClicar={() => input.current?.click()}>Escolher arquivos</Botao>
              <Botao aoClicar={() => setCamera(true)}>Usar câmera</Botao>
            </div>
            <span>Arraste imagens para cá ou cole com Ctrl+V ou ⌘V.</span>
            <span className="at-fraco" data-at-formatos>{FORMATOS_TEXTO}{vagas !== null ? ` · ${vagas} vaga${vagas === 1 ? '' : 's'} restante${vagas === 1 ? '' : 's'} neste produto` : ''}</span>
            <span className="at-fraco at-fotos-add__det">{DETALHES_LIMITES}</span>
            <input ref={input} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={(e) => { acrescentar(e.target.files); e.target.value = ''; }} data-at-fotos-input />
          </div>
          {avisos.length > 0 && <div className="at-alerta" role="alert">{avisos.map((a) => <div key={a}>{a}</div>)}</div>}
          {resumo && <p className="at-fotos-add__resumo" role="status" data-at-fotos-resumo>{resumo}</p>}
          {itens.length > 0 && (
            <ol className="at-fotos-fila" aria-label="Fotos para publicar, na ordem">
              {itens.map((it, k) => (
                <li key={it.id} className={`at-fotos-fila__item at-fotos-fila__item--${it.estado}`} data-at-foto-fila={it.estado}>
                  {it.preview ? <img src={it.preview} alt={`Prévia ${k + 1}`} className="at-fotos-fila__previa" />
                    : <div className="at-fotos-fila__previa at-fotos-fila__previa--heic" title="HEIC: a imagem aparece depois do processamento">HEIC<small>aparece depois do processamento</small></div>}
                  <div className="at-fotos-fila__info">
                    <div className="at-fotos-fila__nome" title={it.arquivo.name}>{k + 1}. {it.arquivo.name || 'foto colada'} <span className="at-fraco">· {it.arquivo.size >= 1048576 ? `${(it.arquivo.size / 1048576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(it.arquivo.size / 1024))} KB`}</span></div>
                    <div className="at-fotos-fila__estado" role={['recusada', 'desconhecido'].includes(it.estado) ? 'alert' : undefined}>
                      {it.estado === 'publicada' && <span className="at-st-ico at-st-ico--ok" aria-hidden>✓</span>}
                      {TEXTO[it.estado]}{it.estado === 'enviando' && typeof it.pct === 'number' ? ` ${it.pct}%` : ''}{it.msg ? ` · ${it.msg}` : ''}
                      {it.estado === 'enviando' && <progress max={100} value={it.pct ?? 0} aria-label={`Transferência de ${it.arquivo.name}`} />}
                      {it.estado === 'duplicada' && it.recibo?.foto_id && <> <button type="button" className="at-link" onClick={() => aoVerFoto(it.recibo!.foto_id!)}>Ver foto</button></>}
                      {(it.estado === 'desconhecido' || it.estado === 'andando') && <> <button type="button" className="at-link" onClick={() => conferir(it)}>Conferir gravação</button>
                        {(it.estado === 'desconhecido' || it.demorando) && <> · <button type="button" className="at-link" onClick={() => reenviar(it)}>Reenviar com segurança</button></>}</>}
                      {it.estado === 'recusada' && it.sessao && <> <EntrarNovamente rotulo="Continuar envio" aoContinuar={() => reenviar(it)} /></>}
                      {it.estado === 'recusada' && !it.sessao && <> <button type="button" className="at-link" onClick={() => { tirar(it.id); input.current?.click(); }}>Escolher outro arquivo</button> · <button type="button" className="at-link" onClick={() => mudar(P, it.id, { estado: 'pronta', msg: undefined })}>Tentar de novo</button></>}
                    </div>
                    {it.estado === 'pronta' && <label className="at-fotos-fila__principal"><input type="radio" name={`principal-${P}`} checked={!!it.principal} onChange={() => principal(it.id)} /> Definir como principal</label>}
                  </div>
                  {(it.estado === 'pronta' || it.estado === 'recusada') && (
                    <div className="at-fotos-fila__ordem">
                      {it.estado === 'pronta' && <button type="button" className="at-v3-menu__botao" aria-label={`Subir ${it.arquivo.name || 'foto'}`} disabled={k === 0} onClick={() => mover(it.id, -1)}>↑</button>}
                      {it.estado === 'pronta' && <button type="button" className="at-v3-menu__botao" aria-label={`Descer ${it.arquivo.name || 'foto'}`} disabled={k === itens.length - 1} onClick={() => mover(it.id, 1)}>↓</button>}
                      <button type="button" className="at-v3-menu__botao" aria-label={`Retirar ${it.arquivo.name || 'foto'}`} onClick={() => tirar(it.id)}>✕</button>
                    </div>)}
                </li>))}
            </ol>)}
          {capaMsg && <p className={/não/i.test(capaMsg) ? 'at-alerta' : 'at-fraco'} role="status">{capaMsg}</p>}
        </div>
      </Dialogo>
      {camera && <Camera aoFechar={() => setCamera(false)} aoUsar={(f) => { acrescentar([f]); setCamera(false); }} />}
    </>
  );
}

/** Câmera: pedida SÓ depois do clique em "Usar câmera", sem microfone; desliga ao fechar ou usar. Bloqueada → mensagem; a fila fica intacta. */
export function Camera({ aoFechar, aoUsar }: { aoFechar: () => void; aoUsar: (f: File) => void }) {
  const video = React.useRef<HTMLVideoElement>(null);
  const fluxo = React.useRef<MediaStream | null>(null);
  const [cams, setCams] = React.useState<MediaDeviceInfo[]>([]);
  const [cam, setCam] = React.useState('');
  const [erro, setErro] = React.useState<string | null>(null);
  const [foto, setFoto] = React.useState<{ blob: Blob; url: string } | null>(null);
  const parar = () => { fluxo.current?.getTracks().forEach((t) => t.stop()); fluxo.current = null; };
  React.useEffect(() => {
    let vivo = true;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setErro('Nenhuma câmera encontrada.'); return; }
      try {
        parar();
        const s = await navigator.mediaDevices.getUserMedia({ video: cam ? { deviceId: { exact: cam } } : true, audio: false });
        if (!vivo) { s.getTracks().forEach((t) => t.stop()); return; }
        fluxo.current = s; if (video.current) { video.current.srcObject = s; await video.current.play().catch(() => {}); }
        const ds = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput'); if (vivo) setCams(ds);
        setErro(null);
      } catch (e) {
        const n = (e as { name?: string })?.name;
        setErro(n === 'NotAllowedError' || n === 'SecurityError' ? 'O navegador bloqueou a câmera; libere no ícone do cadeado da barra de endereço.' : 'Nenhuma câmera encontrada.');
      }
    })();
    return () => { vivo = false; parar(); };
  }, [cam]);
  React.useEffect(() => () => { if (foto) URL.revokeObjectURL(foto.url); }, [foto]);
  const capturar = () => {
    const v = video.current; if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d')?.drawImage(v, 0, 0);   // imagem inteira, sem corte
    c.toBlob((b) => { if (b) setFoto({ blob: b, url: URL.createObjectURL(b) }); }, 'image/jpeg', 0.92);
  };
  const fechar = () => { parar(); aoFechar(); };
  return (
    <Dialogo titulo="Usar câmera" aberto aoFechar={fechar} largura={720}
      rodape={foto ? <><Botao aoClicar={() => setFoto(null)}>Tirar outra</Botao><Botao primario aoClicar={() => { parar(); aoUsar(new File([foto.blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })); }}>Usar foto</Botao></>
        : <><Botao aoClicar={fechar}>{erro ? 'Voltar e escolher arquivos' : 'Fechar'}</Botao>{!erro && <Botao primario aoClicar={capturar}>Capturar</Botao>}</>}>
      {erro ? <div className="at-alerta" role="alert" data-at-camera-erro>{erro} As fotos já escolhidas continuam na fila; você pode usar "Escolher arquivos".</div> : (
        <div className="at-webcam">
          {cams.length > 1 && <select className="at-campo" aria-label="Câmera" value={cam} onChange={(e) => setCam(e.target.value)}>{cams.map((d, k) => <option key={d.deviceId || k} value={d.deviceId}>{d.label || `Câmera ${k + 1}`}</option>)}</select>}
          {foto ? <img src={foto.url} alt="Prévia da foto capturada" className="at-webcam__previa" data-at-camera-previa /> : <video ref={video} className="at-webcam__video" muted playsInline aria-label="Prévia da câmera" />}
        </div>)}
    </Dialogo>
  );
}

/** Aba Fotos: "Definir como principal", Reordenar (arrastar ou setas, Salvar ordem / Cancelar), remover com Desfazer, restaurar. */
export function GerenciarFotos({ estado, productId, aoMudou, aoAdicionar }: { estado: EstadoGaleria; productId: number; aoMudou: () => void; aoAdicionar: () => void }) {
  const [op, setOp] = React.useState<{ fase: 'andando' | 'ok' | 'erro' | 'incerto'; msg: string; chave?: string; refazer?: () => void; sessao?: boolean } | null>(null);
  const [desfazer, setDesfazer] = React.useState<{ fotoId: number; versao: number } | null>(null);
  const [verRemovidas, setVerRemovidas] = React.useState(false);
  const [ordem, setOrdem] = React.useState<number[] | null>(null);   // modo Reordenar
  const arrastado = React.useRef<number | null>(null);
  React.useEffect(() => { if (!desfazer) return; const t = window.setTimeout(() => setDesfazer(null), 8000); return () => window.clearTimeout(t); }, [desfazer]);
  if (estado.tipo !== 'ok') return null;
  const g = estado.g; const fotos = [...g.fotos].sort((a, b) => a.posicao - b.posicao); const porId = new Map(fotos.map((f) => [f.id, f]));
  const rodar = async (descricao: string, f: (chave: string) => Promise<RespostaFoto>, depois?: (r: RespostaFoto) => void) => {
    const chave = novaChaveOperacao(); setOp({ fase: 'andando', msg: `${descricao}…` });
    const tentar = async () => {
      try { const r = await f(chave); setOp({ fase: 'ok', msg: r.desfecho === 'sem_mudanca' ? `${descricao}: nada mudou` : `${descricao}: salvo` }); depois?.(r); aoMudou(); }
      catch (e) {
        const er = e instanceof ErroApi ? e : null; const cl = classificarErroFoto(er);
        if (cl.tipo === 'recusada' && (er?.http === 401 || er?.http === 503)) setOp({ fase: 'erro', msg: `${descricao}: ${cl.msg}`, sessao: !!cl.sessao, refazer: cl.sessao ? tentar : undefined });
        else if (er?.conflito) { setOp({ fase: 'erro', msg: 'As fotos deste produto mudaram (talvez em outra aba). Atualizei a galeria; confira e refaça.' }); setOrdem(null); aoMudou(); }
        else if (er?.recusada) setOp({ fase: 'erro', msg: `${descricao}: não foi salvo (${er.message})` });
        else setOp({ fase: 'incerto', msg: `${descricao}: não conseguimos confirmar.`, chave, refazer: tentar });
      }
    };
    await tentar();
  };
  const conferirOp = async () => {
    if (!op?.chave) return; const c = await conferirFoto(op.chave).catch(() => null);
    if (c?.tipo === 'salvo' && c.recibo?.chave === op.chave) { setOp({ fase: 'ok', msg: 'Conferido: salvo' }); aoMudou(); }   // recibo sem titular (chave de outra intenção) = desconhecido
    else if (c?.tipo === 'nao_aplicada') setOp({ fase: 'erro', msg: `Não foi salvo (${c.msg})` });
    else setOp({ ...op, msg: c?.tipo === 'nao_encontrada' ? 'Ainda não conseguimos confirmar esta alteração.' : 'Ainda sem confirmação.' });
  };
  const selo = (f: FotoGaleria) => (f.origem === 'precifica' ? 'Precifica' : `Enviada por ${f.autor_nome ?? (f.autor_user_id ? `usuário ${f.autor_user_id}` : '—')}${f.criado_em ? ` em ${new Date(f.criado_em).toLocaleDateString('pt-BR')}` : ''}`);
  const lista = ordem ? ordem.map((id) => porId.get(id)).filter((x): x is FotoGaleria => !!x) : fotos;
  const moverEm = (id: number, d: -1 | 1) => setOrdem((o) => { if (!o) return o; const i = o.indexOf(id); const j = i + d; if (j < 0 || j >= o.length) return o; const c = [...o]; [c[i], c[j]] = [c[j], c[i]]; return c; });
  const soltarEm = (alvo: number) => setOrdem((o) => { const a = arrastado.current; if (!o || a === null || a === alvo) return o; const c = o.filter((x) => x !== a); c.splice(c.indexOf(alvo), 0, a); return c; });
  return (
    <section className="at-painel at-fotos-ger" aria-label="Fotos do produto">
      <div className="at-fotos-ger__topo">
        <strong>Fotos ({fotos.length}{g.limite_fotos ? ` de no máximo ${g.limite_fotos}` : ''})</strong>
        {!ordem && g.produto.pode_receber_foto && <button type="button" className="bl-botao at-v3-btn-add" onClick={aoAdicionar}><Icone nome="plus" />{fotos.length ? 'Adicionar fotos' : 'Adicionar primeira foto'}</button>}
        {!ordem && fotos.length > 1 && <Botao aoClicar={() => setOrdem(fotos.map((f) => f.id))}>Reordenar</Botao>}
        {ordem && <><span className="at-fraco">A primeira foto será a principal. Arraste ou use as setas.</span>
          <Botao aoClicar={() => setOrdem(null)}>Cancelar</Botao>
          <Botao primario desligado={JSON.stringify(ordem) === JSON.stringify(fotos.map((f) => f.id))} aoClicar={() => rodar('Ordem', (ch) => ordenarFotos(productId, ordem, g.versao_galeria, ch), () => setOrdem(null))}>Salvar ordem</Botao></>}
        {op && <span className={`at-fotos-ger__op at-fotos-ger__op--${op.fase}`} role={op.fase === 'erro' || op.fase === 'incerto' ? 'alert' : 'status'}>{op.msg}
          {op.fase === 'incerto' && <> <button type="button" className="at-link" onClick={conferirOp}>Conferir gravação</button> · <button type="button" className="at-link" onClick={() => op.refazer?.()}>Reenviar com segurança</button></>}
          {op.fase === 'erro' && op.sessao && <> <EntrarNovamente aoContinuar={() => op.refazer?.()} /></>}</span>}
        {desfazer && <span className="at-fotos-ger__op" role="status">Foto removida. <button type="button" className="at-link" onClick={() => { const d = desfazer; setDesfazer(null); rodar('Restaurar', (ch) => restaurarFoto(d.fotoId, d.versao, ch)); }}>Desfazer</button></span>}
      </div>
      <ul className={`at-fotos-ger__grade ${ordem ? 'at-fotos-ger__grade--ordenando' : ''}`}>
        {lista.map((f, k) => (
          <li key={f.id} className={`at-fotos-ger__item ${(ordem ? k === 0 : f.capa) ? 'at-fotos-ger__item--capa' : ''}`} data-foto={f.id}
            draggable={!!ordem} onDragStart={() => { arrastado.current = f.id; }} onDragOver={(e) => { if (ordem) e.preventDefault(); }} onDrop={() => soltarEm(f.id)}>
            <Foto mediaId={f.id} cor={f.cor} proporcao="4 / 3" ajuste="contain" url={urlImagem(f.id, 768)} tentarDeNovo />
            <div className="at-fotos-ger__barra">
              {ordem ? <>
                <button type="button" className="at-v3-menu__botao" aria-label={`Mover a foto ${k + 1} para a esquerda`} disabled={k === 0} onClick={() => moverEm(f.id, -1)}>←</button>
                <button type="button" className="at-v3-menu__botao" aria-label={`Mover a foto ${k + 1} para a direita`} disabled={k === lista.length - 1} onClick={() => moverEm(f.id, 1)}>→</button>
              </> : <>
                {f.capa ? <span className="at-fotos-ger__principal">Principal</span>
                  : <button type="button" className="at-link" disabled={op?.fase === 'andando'} onClick={() => rodar('Foto principal', (ch) => marcarCapa(f.id, g.versao_galeria, ch))}>Definir como principal</button>}
                <button type="button" className="at-v3-menu__botao" aria-label={`Remover a foto ${k + 1}`} disabled={op?.fase === 'andando'} onClick={() => rodar('Remover', (ch) => removerFoto(f.id, g.versao_galeria, ch), (r) => setDesfazer({ fotoId: f.id, versao: r.recibo.versao_nova }))}>🗑</button>
              </>}
            </div>
            <div className="at-fotos-ger__selo">{selo(f)}</div>
          </li>))}
      </ul>
      {!ordem && g.removidas.length > 0 && (
        <div className="at-fotos-ger__removidas">
          <button type="button" className="at-link" aria-expanded={verRemovidas} onClick={() => setVerRemovidas((v) => !v)}>Fotos removidas ({g.removidas.length})</button>
          {verRemovidas && <ul className="at-fotos-ger__grade">{g.removidas.map((f) => (
            <li key={f.id} className="at-fotos-ger__item at-fotos-ger__item--removida" data-foto-removida={f.id}>
              <Foto mediaId={f.id} cor={f.cor} proporcao="4 / 3" ajuste="contain" url={urlImagem(f.id, 256, true)} />
              <div className="at-fotos-ger__barra"><Botao aoClicar={() => rodar('Restaurar', (ch) => restaurarFoto(f.id, g.versao_galeria, ch))}>Restaurar</Botao></div>
            </li>))}</ul>}
        </div>)}
    </section>
  );
}
