// FOTOS NA FICHA (CIMA, 19/11): adicionar por arquivo, arrastar, colar (Ctrl+V) e webcam, com PRÉVIA, ORDEM e FOTO PRINCIPAL; cada arquivo
// com a sua chave de operação e o recibo do "foi salvo" (nunca "Salvo" sem recibo; resposta perdida = mesma chave + Conferir). Gerenciar na aba
// Fotos: capa, ordem, remover (com Desfazer) e restaurar. Os botões de escrita só aparecem quando a galeria responde (flag do app ligada e
// usuário na lista de publicação — 1ª entrega: só o 75). Rotas: lib/fotos.ts (proxy /api/midia, ainda SIMULADO nos testes).
import React from 'react';
import { ErroApi, MSG_DESCONHECIDO, novaChaveOperacao } from '../../lib/api';
import { ACEITOS, conferirFoto, ehHeic, LIMITE_BYTES, marcarCapa, ordenarFotos, prepararArquivo, publicarFoto, removerFoto, restaurarFoto,
  urlFotoMidia, type EstadoGaleria, type FotoGaleria, type ReciboFoto, type RespostaFoto } from '../../lib/fotos';
import { marcarPendencia } from '../../lib/pendencias';
import { Botao, Dialogo, Foto } from '../Comuns';
import { Icone } from '../Icones';

type EstadoItem = 'fila' | 'enviando' | 'salvo' | 'ja_existia' | 'recusada' | 'desconhecido' | 'conferindo' | 'andando';
interface Item { id: number; arquivo: File; preview: string; estado: EstadoItem; msg?: string; chave?: string; recibo?: ReciboFoto }
let seqItem = 0;
const ROTULO: Record<EstadoItem, string> = { fila: 'Na fila', enviando: 'Enviando…', salvo: 'Salvo', ja_existia: 'Já existia (nada duplicado)', recusada: 'Não foi salvo', desconhecido: MSG_DESCONHECIDO, conferindo: 'Conferindo a gravação…', andando: 'Ainda em andamento no servidor' };
const INCERTO: EstadoItem[] = ['enviando', 'desconhecido', 'conferindo', 'andando'];

/** Separa o que é imagem aceitável do resto (com o motivo). */
export function filtrarImagens(lista: FileList | File[] | null | undefined): { ok: File[]; recusados: string[] } {
  const ok: File[] = [], recusados: string[] = [];
  for (const f of Array.from(lista ?? [])) {
    if (!(ACEITOS.test(f.type) || ehHeic(f))) recusados.push(`${f.name || 'arquivo'}: não é JPEG, PNG, WebP ou HEIC`);
    else if (f.size > LIMITE_BYTES) recusados.push(`${f.name || 'arquivo'}: maior que 15 MB`);
    else ok.push(f);
  }
  return { ok, recusados };
}

export function AdicionarFotos({ produto, aberto, aoFechar, iniciais, aoMudou, versaoInicial }: {
  produto: { id: number; nome: string }; aberto: boolean; aoFechar: () => void; iniciais?: File[]; aoMudou: () => void; versaoInicial: number;
}) {
  const [itens, setItens] = React.useState<Item[]>([]);
  const [principal, setPrincipal] = React.useState<number | null>(null);
  const [capaMsg, setCapaMsg] = React.useState<string | null>(null);
  const [avisos, setAvisos] = React.useState<string[]>([]);
  const [webcam, setWebcam] = React.useState(false);
  const [confirmarFechar, setConfirmarFechar] = React.useState(false);
  const [arrastando, setArrastando] = React.useState(false);
  const enviandoLote = React.useRef(false);
  const input = React.useRef<HTMLInputElement>(null);
  const ref = React.useRef(itens); ref.current = itens;
  const versao = React.useRef(versaoInicial);
  React.useEffect(() => { if (aberto) versao.current = versaoInicial; }, [aberto, versaoInicial]);
  const acrescentar = React.useCallback((lista: File[] | FileList | null | undefined) => {
    const { ok, recusados } = filtrarImagens(lista);
    setAvisos(recusados);
    if (ok.length) setItens((xs) => [...xs, ...ok.map((f) => ({ id: ++seqItem, arquivo: f, preview: URL.createObjectURL(f), estado: 'fila' as EstadoItem }))]);
  }, []);
  React.useEffect(() => { if (aberto && iniciais?.length) acrescentar(iniciais); }, [aberto, iniciais, acrescentar]);
  React.useEffect(() => () => { ref.current.forEach((x) => URL.revokeObjectURL(x.preview)); }, []);
  const pendente = itens.some((x) => INCERTO.includes(x.estado));
  React.useEffect(() => { const k = `fotos:${produto.id}`; marcarPendencia(k, pendente); return () => marcarPendencia(k, false); }, [pendente, produto.id]);
  const muda = (id: number, p: Partial<Item>) => setItens((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const enviarUm = async (it: Item): Promise<ReciboFoto | null> => {
    const chave = it.chave ?? novaChaveOperacao();   // mesma chave em qualquer reenvio desta foto
    muda(it.id, { estado: 'enviando', chave, msg: undefined });
    try {
      const corpo = await prepararArquivo(it.arquivo);
      const r = await publicarFoto(produto.id, corpo, chave);
      versao.current = r.recibo.versao_nova;
      muda(it.id, { estado: r.recibo.duplicada || r.desfecho === 'sem_mudanca' ? 'ja_existia' : 'salvo', recibo: r.recibo });
      return r.recibo;
    } catch (e) {
      const er = e instanceof ErroApi ? e : null;
      if (er?.emAndamento) muda(it.id, { estado: 'andando' });
      else if (er && (er.recusada || er.conflito)) muda(it.id, { estado: 'recusada', msg: er.message, chave: undefined });   // recusa definitiva: próxima tentativa = chave nova
      else muda(it.id, { estado: 'desconhecido' });
      return null;
    }
  };
  const enviarTodos = async () => {
    if (enviandoLote.current) return; enviandoLote.current = true; setCapaMsg(null);
    let algum = false; const recibos = new Map<number, ReciboFoto>();
    for (const it of ref.current.filter((x) => x.estado === 'fila' || x.estado === 'recusada')) { const r = await enviarUm(it); if (r) { algum = true; recibos.set(it.id, r); } }
    // foto principal: depois que ela tem recibo, marca a capa com chave própria e a versão do último recibo
    const p = ref.current.find((x) => x.id === principal); const rp = p ? (recibos.get(p.id) ?? p.recibo) : undefined;
    if (p && rp?.foto_id) {
      try { const r = await marcarCapa(produto.id, rp.foto_id, versao.current); versao.current = r.recibo.versao_nova; setCapaMsg('Foto principal: salvo'); setPrincipal(null); algum = true; }   // marcada uma vez só
      catch (e) { setCapaMsg(e instanceof ErroApi && (e.recusada || e.conflito) ? `Foto principal: não foi salvo (${e.message})` : `Foto principal: ${MSG_DESCONHECIDO} Marque de novo na aba Fotos.`); }
    }
    enviandoLote.current = false; if (algum) aoMudou();
  };
  const tentarDeNovo = async (it: Item) => { const r = await enviarUm(it); if (r) aoMudou(); };
  const conferir = async (it: Item) => {
    if (!it.chave) return; muda(it.id, { estado: 'conferindo' });
    try {
      const c = await conferirFoto(it.chave);
      if (c.tipo === 'salvo') { versao.current = Math.max(versao.current, c.recibo.versao_nova); muda(it.id, { estado: c.recibo.duplicada || c.recibo.desfecho === 'sem_mudanca' ? 'ja_existia' : 'salvo', recibo: c.recibo }); aoMudou(); }
      else if (c.tipo === 'andando') muda(it.id, { estado: 'andando', msg: c.demorando ? 'Está demorando; enviar de novo com a mesma chave é seguro.' : undefined });
      else if (c.tipo === 'nao_aplicada') muda(it.id, { estado: 'recusada', msg: c.msg, chave: undefined });
      else muda(it.id, { estado: 'desconhecido', msg: 'O servidor não tem registro desta foto (ela pode não ter chegado). Enviar de novo usa a mesma chave e não duplica.' });
    } catch { muda(it.id, { estado: 'desconhecido', msg: 'Não foi possível conferir agora.' }); }
  };
  const mover = (id: number, d: -1 | 1) => setItens((xs) => { const i = xs.findIndex((x) => x.id === id); const j = i + d; if (i < 0 || j < 0 || j >= xs.length) return xs; const c = [...xs]; [c[i], c[j]] = [c[j], c[i]]; return c; });
  const tirar = (id: number) => setItens((xs) => { const x = xs.find((y) => y.id === id); if (x) URL.revokeObjectURL(x.preview); if (principal === id) setPrincipal(null); return xs.filter((y) => y.id !== id); });
  const fechar = () => { if (pendente || itens.some((x) => x.estado === 'fila' || x.estado === 'recusada')) { setConfirmarFechar(true); return; } fecharDeVez(); };   // recusada = ainda não salva
  const fecharDeVez = () => { setConfirmarFechar(false); itens.forEach((x) => URL.revokeObjectURL(x.preview)); setItens([]); setPrincipal(null); setCapaMsg(null); setAvisos([]); aoFechar(); };
  const naFila = itens.filter((x) => x.estado === 'fila' || x.estado === 'recusada').length;

  return (
    <>
      <Dialogo titulo="Adicionar fotos" aberto={aberto && !webcam} aoFechar={fechar} largura={720}
        rodape={<><Botao aoClicar={fechar}>Fechar</Botao><Botao primario desligado={!naFila || enviandoLote.current} aoClicar={enviarTodos}>{naFila ? `Enviar ${naFila} foto${naFila === 1 ? '' : 's'}` : 'Enviar'}</Botao></>}>
        <div className="at-fotos-add" onPaste={(e) => { const f = Array.from(e.clipboardData?.files ?? []); if (f.length) { e.preventDefault(); acrescentar(f); } }}>
          <p className="at-fotos-add__destino">Produto <strong>ID {produto.id}</strong> · {produto.nome}</p>
          <div className={`at-fotos-add__zona ${arrastando ? 'at-fotos-add__zona--ativa' : ''}`} tabIndex={0} aria-label="Área para arrastar ou colar fotos"
            onDragOver={(e) => { e.preventDefault(); setArrastando(true); }} onDragLeave={() => setArrastando(false)}
            onDrop={(e) => { e.preventDefault(); setArrastando(false); acrescentar(e.dataTransfer.files); }}>
            <div className="at-fotos-add__acoes">
              <Botao aoClicar={() => input.current?.click()}>Escolher do computador</Botao>
              <Botao aoClicar={() => setWebcam(true)}>Tirar foto (webcam)</Botao>
            </div>
            <span className="at-fraco">ou arraste as fotos para cá, ou cole com Ctrl+V. JPEG, PNG, WebP ou HEIC, até 15 MB cada.</span>
            <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { acrescentar(e.target.files); e.target.value = ''; }} data-at-fotos-input />
          </div>
          {avisos.length > 0 && <div className="at-alerta" role="alert">{avisos.map((a) => <div key={a}>{a}</div>)}</div>}
          {itens.length > 0 && (
            <ol className="at-fotos-fila" aria-label="Fotos para enviar, na ordem">
              {itens.map((it, k) => (
                <li key={it.id} className={`at-fotos-fila__item at-fotos-fila__item--${it.estado}`} data-at-foto-fila={it.estado}>
                  <img src={it.preview} alt={`Prévia ${k + 1}`} className="at-fotos-fila__previa" />
                  <div className="at-fotos-fila__info">
                    <div className="at-fotos-fila__nome" title={it.arquivo.name}>{k + 1}. {it.arquivo.name || 'foto colada'} <span className="at-fraco">· {it.arquivo.size >= 1048576 ? `${(it.arquivo.size / 1048576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(it.arquivo.size / 1024))} KB`}</span></div>
                    <div className="at-fotos-fila__estado" role={['recusada', 'desconhecido'].includes(it.estado) ? 'alert' : undefined}>
                      {it.estado === 'salvo' && <span className="at-st-ico at-st-ico--ok" aria-hidden>✓</span>}{ROTULO[it.estado]}{it.msg ? ` · ${it.msg}` : ''}
                      {it.estado === 'desconhecido' && <> <button type="button" className="at-link" onClick={() => conferir(it)}>Conferir gravação</button> · <button type="button" className="at-link" onClick={() => tentarDeNovo(it)}>Tentar de novo (mesma chave)</button></>}
                      {it.estado === 'andando' && <> <button type="button" className="at-link" onClick={() => conferir(it)}>Conferir gravação</button></>}
                    </div>
                    <label className="at-fotos-fila__principal"><input type="radio" name={`principal-${produto.id}`} checked={principal === it.id} disabled={it.estado === 'salvo' || it.estado === 'ja_existia' ? !it.recibo : false} onChange={() => setPrincipal(it.id)} /> Foto principal</label>
                  </div>
                  {it.estado === 'fila' && (
                    <div className="at-fotos-fila__ordem">
                      <button type="button" className="at-v3-menu__botao" aria-label={`Subir ${it.arquivo.name || 'foto'}`} disabled={k === 0} onClick={() => mover(it.id, -1)}>↑</button>
                      <button type="button" className="at-v3-menu__botao" aria-label={`Descer ${it.arquivo.name || 'foto'}`} disabled={k === itens.length - 1} onClick={() => mover(it.id, 1)}>↓</button>
                      <button type="button" className="at-v3-menu__botao" aria-label={`Tirar da fila ${it.arquivo.name || 'foto'}`} onClick={() => tirar(it.id)}>✕</button>
                    </div>)}
                </li>))}
            </ol>)}
          {capaMsg && <p className={/não/.test(capaMsg) ? 'at-alerta' : 'at-fraco'} role="status">{capaMsg}</p>}
        </div>
      </Dialogo>
      <Dialogo titulo="Fechar com fotos não confirmadas?" aberto={confirmarFechar} aoFechar={() => setConfirmarFechar(false)}
        rodape={<><Botao aoClicar={() => setConfirmarFechar(false)}>Continuar aqui</Botao><Botao perigo aoClicar={fecharDeVez}>Fechar mesmo assim</Botao></>}>
        <p>Há fotos na fila ou com o envio ainda não confirmado. Se fechar agora, a tela não acompanha mais o resultado delas (o que já chegou ao servidor continua lá).</p>
      </Dialogo>
      {webcam && <Webcam aoFechar={() => setWebcam(false)} aoUsar={(f) => { acrescentar([f]); setWebcam(false); }} />}
    </>
  );
}

/** Webcam: a câmera SÓ liga ao abrir este diálogo (clique em "Tirar foto") e desliga ao fechar. */
export function Webcam({ aoFechar, aoUsar }: { aoFechar: () => void; aoUsar: (f: File) => void }) {
  const video = React.useRef<HTMLVideoElement>(null);
  const fluxo = React.useRef<MediaStream | null>(null);
  const [cams, setCams] = React.useState<MediaDeviceInfo[]>([]);
  const [cam, setCam] = React.useState<string>('');
  const [erro, setErro] = React.useState<string | null>(null);
  const [foto, setFoto] = React.useState<{ blob: Blob; url: string } | null>(null);
  const parar = () => { fluxo.current?.getTracks().forEach((t) => t.stop()); fluxo.current = null; };
  React.useEffect(() => {
    let vivo = true;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setErro('Nenhuma câmera encontrada.'); return; }
      try {
        parar();
        const s = await navigator.mediaDevices.getUserMedia({ video: cam ? { deviceId: { exact: cam } } : { facingMode: 'environment' }, audio: false });
        if (!vivo) { s.getTracks().forEach((t) => t.stop()); return; }
        fluxo.current = s; if (video.current) { video.current.srcObject = s; await video.current.play().catch(() => {}); }
        const ds = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput'); if (vivo) setCams(ds);
        setErro(null);
      } catch (e) {
        const n = (e as { name?: string })?.name;
        setErro(n === 'NotAllowedError' || n === 'SecurityError' ? 'Permissão da câmera negada; libere no ícone do cadeado do navegador.' : 'Nenhuma câmera encontrada.');
      }
    })();
    return () => { vivo = false; parar(); };
  }, [cam]);
  React.useEffect(() => () => { if (foto) URL.revokeObjectURL(foto.url); }, [foto]);
  const capturar = () => {
    const v = video.current; if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d')?.drawImage(v, 0, 0);
    c.toBlob((b) => { if (b) setFoto({ blob: b, url: URL.createObjectURL(b) }); }, 'image/jpeg', 0.9);
  };
  const fechar = () => { parar(); aoFechar(); };
  return (
    <Dialogo titulo="Tirar foto" aberto aoFechar={fechar} largura={680}
      rodape={foto ? <><Botao aoClicar={() => setFoto(null)}>Tirar outra</Botao><Botao primario aoClicar={() => { parar(); aoUsar(new File([foto.blob], `webcam-${Date.now()}.jpg`, { type: 'image/jpeg' })); }}>Usar esta foto</Botao></>
        : <><Botao aoClicar={fechar}>Fechar</Botao>{!erro && <Botao primario aoClicar={capturar}>Capturar</Botao>}</>}>
      {erro ? <div className="at-alerta" role="alert" data-at-webcam-erro>{erro} Você ainda pode escolher arquivos do computador.</div> : (
        <div className="at-webcam">
          {cams.length > 1 && <select className="at-campo" aria-label="Câmera" value={cam} onChange={(e) => setCam(e.target.value)}>{cams.map((d, k) => <option key={d.deviceId || k} value={d.deviceId}>{d.label || `Câmera ${k + 1}`}</option>)}</select>}
          {foto ? <img src={foto.url} alt="Prévia da foto capturada" className="at-webcam__previa" data-at-webcam-previa /> : <video ref={video} className="at-webcam__video" muted playsInline aria-label="Prévia da câmera" />}
        </div>)}
    </Dialogo>
  );
}

/** Aba Fotos: capa, ordem, remover (com Desfazer) e restaurar. Uma operação por vez, cada uma com a sua chave e o seu recibo. */
export function GerenciarFotos({ estado, productId, aoMudou, aoAdicionar }: { estado: EstadoGaleria; productId: number; aoMudou: () => void; aoAdicionar: () => void }) {
  const [op, setOp] = React.useState<{ fase: 'andando' | 'ok' | 'erro' | 'incerto'; msg: string; refazer?: () => void; chave?: string } | null>(null);
  const [desfazer, setDesfazer] = React.useState<{ fotoId: number; versao: number } | null>(null);
  const [verRemovidas, setVerRemovidas] = React.useState(false);
  React.useEffect(() => { if (!desfazer) return; const t = window.setTimeout(() => setDesfazer(null), 8000); return () => window.clearTimeout(t); }, [desfazer]);
  if (estado.tipo !== 'ok') return null;
  const g = estado.g; const fotos = [...g.fotos].sort((a, b) => a.posicao - b.posicao);
  const rodar = async (descricao: string, f: (chave: string) => Promise<RespostaFoto>, depois?: (r: RespostaFoto) => void) => {
    const chave = novaChaveOperacao(); setOp({ fase: 'andando', msg: `${descricao}…` });
    const tentar = async () => {
      try { const r = await f(chave); setOp({ fase: 'ok', msg: r.desfecho === 'sem_mudanca' ? `${descricao}: nada mudou` : `${descricao}: salvo` }); depois?.(r); aoMudou(); }
      catch (e) {
        const er = e instanceof ErroApi ? e : null;
        if (er?.conflito) setOp({ fase: 'erro', msg: 'As fotos deste produto mudaram desde que você abriu. Recarreguei a galeria; refaça a ação.' }), aoMudou();
        else if (er?.recusada) setOp({ fase: 'erro', msg: `${descricao}: não foi salvo (${er.message})` });
        else setOp({ fase: 'incerto', msg: `${descricao}: ${MSG_DESCONHECIDO}`, refazer: tentar, chave });
      }
    };
    await tentar();
  };
  const conferirOp = async () => {
    if (!op?.chave) return; const c = await conferirFoto(op.chave).catch(() => null);
    if (c?.tipo === 'salvo') { setOp({ fase: 'ok', msg: 'Conferido: salvo' }); aoMudou(); }
    else if (c?.tipo === 'nao_aplicada') setOp({ fase: 'erro', msg: `Não foi salvo (${c.msg})` });
    else setOp({ ...op, msg: c?.tipo === 'nao_encontrada' ? 'O servidor não tem registro: pode reenviar (mesma chave).' : 'Ainda sem confirmação.' });
  };
  const mover = (f: FotoGaleria, d: -1 | 1) => { const ids = fotos.map((x) => x.id); const i = ids.indexOf(f.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; rodar('Ordem', (ch) => ordenarFotos(productId, ids, g.versao_galeria, ch)); };
  const selo = (f: FotoGaleria) => (f.origem === 'precifica' ? 'Precifica' : `Enviada por ${f.autor_nome ?? (f.autor_user_id ? `usuário ${f.autor_user_id}` : '—')}${f.criado_em ? ` em ${new Date(f.criado_em).toLocaleDateString('pt-BR')}` : ''}`);
  return (
    <section className="at-painel at-fotos-ger" aria-label="Fotos do produto">
      <div className="at-fotos-ger__topo">
        <strong>Fotos ({fotos.length}{g.limite_fotos ? ` de no máximo ${g.limite_fotos}` : ''})</strong>
        {g.produto.pode_receber_foto && <button type="button" className="bl-botao at-v3-btn-add" onClick={aoAdicionar}><Icone nome="plus" />Adicionar fotos</button>}
        {op && <span className={`at-fotos-ger__op at-fotos-ger__op--${op.fase}`} role={op.fase === 'erro' || op.fase === 'incerto' ? 'alert' : 'status'}>{op.msg}
          {op.fase === 'incerto' && <> <button type="button" className="at-link" onClick={conferirOp}>Conferir gravação</button> · <button type="button" className="at-link" onClick={() => op.refazer?.()}>Tentar de novo (mesma chave)</button></>}</span>}
        {desfazer && <span className="at-fotos-ger__op" role="status">Foto removida. <button type="button" className="at-link" onClick={() => { const d = desfazer; setDesfazer(null); rodar('Restaurar', (ch) => restaurarFoto(productId, d.fotoId, d.versao, ch)); }}>Desfazer</button></span>}
      </div>
      <ul className="at-fotos-ger__grade">
        {fotos.map((f, k) => (
          <li key={f.id} className={`at-fotos-ger__item ${f.capa ? 'at-fotos-ger__item--capa' : ''}`} data-foto={f.id}>
            <Foto mediaId={f.id} cor={f.cor} proporcao="4 / 3" ajuste="contain" url={urlFotoMidia(f.id, 768)} />
            <div className="at-fotos-ger__barra">
              <button type="button" className="at-v3-menu__botao" aria-pressed={f.capa} aria-label={f.capa ? 'Foto principal' : `Marcar a foto ${k + 1} como principal`} title={f.capa ? 'Foto principal' : 'Marcar como principal'}
                disabled={f.capa || op?.fase === 'andando'} onClick={() => rodar('Foto principal', (ch) => marcarCapa(productId, f.id, g.versao_galeria, ch))}>{f.capa ? '★' : '☆'}</button>
              <button type="button" className="at-v3-menu__botao" aria-label={`Mover a foto ${k + 1} para a esquerda`} disabled={k === 0 || op?.fase === 'andando'} onClick={() => mover(f, -1)}>←</button>
              <button type="button" className="at-v3-menu__botao" aria-label={`Mover a foto ${k + 1} para a direita`} disabled={k === fotos.length - 1 || op?.fase === 'andando'} onClick={() => mover(f, 1)}>→</button>
              <button type="button" className="at-v3-menu__botao" aria-label={`Remover a foto ${k + 1}`} disabled={op?.fase === 'andando'} onClick={() => rodar('Remover', (ch) => removerFoto(productId, f.id, g.versao_galeria, ch), (r) => setDesfazer({ fotoId: f.id, versao: r.recibo.versao_nova }))}>🗑</button>
            </div>
            <div className="at-fotos-ger__selo">{f.capa && <strong>Principal · </strong>}{selo(f)}</div>
          </li>))}
      </ul>
      {g.removidas.length > 0 && (
        <div className="at-fotos-ger__removidas">
          <button type="button" className="at-link" aria-expanded={verRemovidas} onClick={() => setVerRemovidas((v) => !v)}>Fotos removidas ({g.removidas.length})</button>
          {verRemovidas && <ul className="at-fotos-ger__grade">{g.removidas.map((f) => (
            <li key={f.id} className="at-fotos-ger__item at-fotos-ger__item--removida" data-foto-removida={f.id}>
              <Foto mediaId={f.id} cor={f.cor} proporcao="4 / 3" ajuste="contain" url={urlFotoMidia(f.id, 256, true)} />
              <div className="at-fotos-ger__barra"><Botao aoClicar={() => rodar('Restaurar', (ch) => restaurarFoto(productId, f.id, g.versao_galeria, ch))}>Restaurar</Botao></div>
            </li>))}</ul>}
        </div>)}
    </section>
  );
}
