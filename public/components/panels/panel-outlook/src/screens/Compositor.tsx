// screens/Compositor.tsx — editor de e-mail (novo / responder / encaminhar).
// @version 1.0.0  @created 2026-07-21
//
// Fase 1: assunto, destinatários (To/Cc/Cco), corpo HTML (contentEditable),
// validações (assunto, destinatário válido, menção a anexo sem anexo), envio.
// Anexos entram na Fase 2 (upload session do Graph). Sem envio automático (§25.3).
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, apiWrite, chaves, ApiError } from '../lib/api';
import { nomeEndereco } from '../lib/format';
import { getSignature, getSignAuto } from '../lib/prefs';
import type { MessageDetail, EmailTemplate, TemplatesResponse } from '../shell/types';

export type ModoCompositor = 'new' | 'reply' | 'replyAll' | 'forward';

interface Props {
  accountId: number;
  modo: ModoCompositor;
  base?: MessageDetail | null;
  modelo?: EmailTemplate | null;
  onFechar: () => void;
  onEnviado: () => void;
}

const RE_MENCAO_ANEXO = /(anexo|anexad|anexei|segue em anexo|attach|em anexo|attached)/i;

// §20.2: extensões potencialmente perigosas — bloqueadas ao anexar.
const EXT_PERIGOSA = new Set(['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'js', 'jse', 'vbs', 'vbe', 'ws', 'wsf', 'wsh', 'ps1', 'msi', 'jar', 'cpl', 'hta', 'reg', 'dll', 'sh', 'app', 'deb']);
const MAX_ANEXO = 10 * 1024 * 1024; // 10 MB no modo de testes

interface Anexo { name: string; contentType: string; size: number; content_b64: string; }

function readB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => { const s = String(r.result); const i = s.indexOf(','); resolve(i >= 0 ? s.slice(i + 1) : s); };
    r.onerror = () => reject(new Error('read'));
    r.readAsDataURL(file);
  });
}
function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

function endsToStr(list?: { emailAddress?: { address?: string | null } }[]): string {
  return (list ?? []).map((r) => r.emailAddress?.address).filter(Boolean).join(', ');
}
function parseEmails(s: string): string[] {
  return s.split(/[;,]/).map((x) => x.trim()).filter(Boolean);
}
function emailValido(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export function Compositor({ accountId, modo, base, modelo, onFechar, onEnviado }: Props) {
  const respondendo = modo === 'reply' || modo === 'replyAll';
  const encaminhando = modo === 'forward';

  const assuntoBase = base?.subject ?? '';
  const prefixo = respondendo ? 'Re: ' : encaminhando ? 'Enc: ' : '';
  const assuntoInicial = base
    ? (assuntoBase.match(/^(re|enc|fw|fwd):/i) ? assuntoBase : prefixo + assuntoBase)
    : (modelo?.subject ?? '');

  const toInicial = modo === 'reply'
    ? (base?.from?.emailAddress?.address ?? '')
    : modo === 'replyAll'
      ? [base?.from?.emailAddress?.address, endsToStr(base?.toRecipients)].filter(Boolean).join(', ')
      : '';

  const [to, setTo] = useState(toInicial);
  const [cc, setCc] = useState(modo === 'replyAll' ? endsToStr(base?.ccRecipients) : '');
  const [bcc, setBcc] = useState('');
  const [mostrarCc, setMostrarCc] = useState(!!cc);
  const [assunto, setAssunto] = useState(assuntoInicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [agendar, setAgendar] = useState(false);
  const [dataAg, setDataAg] = useState('');
  const [horaAg, setHoraAg] = useState('');
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [arrastando, setArrastando] = useState(false);
  const corpoRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function adicionarArquivos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setErro(null);
    const novos: Anexo[] = [];
    for (const f of Array.from(files)) {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (EXT_PERIGOSA.has(ext) || /\.(exe|bat|cmd|scr|js|vbs|msi)\.[a-z0-9]+$/i.test(f.name)) {
        setErro(`Bloqueado por segurança: "${f.name}".`); continue;
      }
      if (f.size > MAX_ANEXO) { setErro(`"${f.name}" excede 10 MB (limite no modo de testes).`); continue; }
      try { novos.push({ name: f.name, contentType: f.type || 'application/octet-stream', size: f.size, content_b64: await readB64(f) }); }
      catch { setErro(`Falha ao ler "${f.name}".`); }
    }
    if (novos.length) setAnexos((a) => [...a, ...novos]);
  }
  const removerAnexo = (i: number) => setAnexos((a) => a.filter((_, j) => j !== i));

  useEffect(() => {
    if (!corpoRef.current) return;
    let html = modelo ? modelo.body_html : '';
    if (modo === 'new' && getSignAuto()) {
      const sig = getSignature();
      if (sig) html += `<br><br>${sig}`;
    }
    if (html) corpoRef.current.innerHTML = html;
  }, []); // modelo/assinatura iniciais, uma vez  // eslint-disable-line react-hooks/exhaustive-deps

  function aplicarModelo(t: EmailTemplate) {
    setAssunto(t.subject);
    if (corpoRef.current) corpoRef.current.innerHTML = t.body_html;
    setPicker(false);
  }

  const citacao = base && (respondendo || encaminhando)
    ? `<br><br><blockquote style="border-left:2px solid #ccc;padding-left:12px;color:#666">${base.body?.content ?? base.bodyPreview ?? ''}</blockquote>`
    : '';

  function corpoHtml(): string {
    return corpoRef.current?.innerHTML ?? '';
  }
  function corpoTexto(): string {
    return corpoRef.current?.innerText ?? '';
  }

  async function enviar() {
    setErro(null);
    const dests = parseEmails(to);
    if (dests.length === 0) { setErro('Informe ao menos um destinatário.'); return; }
    const invalidos = [...dests, ...parseEmails(cc), ...parseEmails(bcc)].filter((e) => !emailValido(e));
    if (invalidos.length) { setErro(`Endereço inválido: ${invalidos[0]}`); return; }
    if (assunto.trim() === '' && !window.confirm('Enviar sem assunto?')) return;
    if (anexos.length === 0 && RE_MENCAO_ANEXO.test(corpoTexto()) && !window.confirm('A mensagem menciona um anexo, mas nenhum arquivo foi anexado. Enviar mesmo assim?')) return;
    if (dests.length + parseEmails(cc).length + parseEmails(bcc).length > 20
      && !window.confirm('Muitos destinatários. Considere usar Cco. Enviar assim mesmo?')) return;

    setEnviando(true);
    try {
      if (respondendo && base) {
        await apiWrite('/messages/reply', 'POST', {
          account_id: accountId, id: base.id, comment: corpoHtml(), all: modo === 'replyAll',
        });
      } else if (encaminhando && base) {
        await apiWrite('/messages/forward', 'POST', {
          account_id: accountId, id: base.id, to: dests, comment: corpoHtml(),
        });
      } else {
        await apiWrite('/messages/send', 'POST', {
          account_id: accountId, subject: assunto, body_html: corpoHtml() + citacao,
          to: dests, cc: parseEmails(cc), bcc: parseEmails(bcc), attachments: anexos,
        });
      }
      onEnviado();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Falha ao enviar.');
      setEnviando(false);
    }
  }

  function pad2(n: number) { return String(n).padStart(2, '0'); }
  function sugestao(tipo: string) {
    const d = new Date();
    if (tipo === '1h') { d.setHours(d.getHours() + 1); }
    else if (tipo === 'amanha') { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); }
    else { const add = ((8 - d.getDay()) % 7) || 7; d.setDate(d.getDate() + add); d.setHours(9, 0, 0, 0); }
    setDataAg(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
    setHoraAg(`${pad2(d.getHours())}:${pad2(d.getMinutes())}`);
  }
  async function agendarEnvio() {
    setErro(null);
    const dests = parseEmails(to);
    if (dests.length === 0) { setErro('Informe ao menos um destinatário.'); return; }
    if (!dataAg || !horaAg) { setErro('Escolha data e hora.'); return; }
    const dt = new Date(`${dataAg}T${horaAg}`);
    if (Number.isNaN(dt.getTime())) { setErro('Data/hora inválida.'); return; }
    if (dt.getTime() <= Date.now()) { setErro('Escolha um horário no futuro.'); return; }
    setEnviando(true);
    try {
      await apiWrite('/messages/schedule', 'POST', {
        account_id: accountId, subject: assunto, body_html: corpoHtml(),
        to: dests, cc: parseEmails(cc), bcc: parseEmails(bcc), scheduled_at: dt.toISOString(), attachments: anexos,
      });
      onEnviado();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Falha ao agendar.');
      setEnviando(false);
    }
  }

  return (
    <div className="ol-composer-overlay" role="dialog" aria-modal="true">
      <div className="ol-composer">
        <div className="ol-composer-head">
          <span>{modo === 'new' ? 'Nova mensagem' : modo === 'forward' ? 'Encaminhar' : 'Responder'}</span>
          <button className="ol-icon-btn" onClick={onFechar} aria-label="Fechar" disabled={enviando}>✕</button>
        </div>

        <div className={`ol-composer-body${arrastando ? ' is-dragover' : ''}`}
          onDragOver={(e) => { e.preventDefault(); if (!arrastando) setArrastando(true); }}
          onDragLeave={(e) => { if (e.currentTarget === e.target) setArrastando(false); }}
          onDrop={(e) => { e.preventDefault(); setArrastando(false); adicionarArquivos(e.dataTransfer.files); }}>
          {erro && <div className="ol-alert ol-alert-danger">{erro}</div>}

          <div className="ol-field">
            <label className="ol-field-lbl">Para</label>
            <input className="ol-inp" value={to} onChange={(e) => setTo(e.target.value)}
              placeholder="email@exemplo.com, outro@exemplo.com" autoFocus={modo !== 'reply'} />
            {!mostrarCc && <button className="ol-linkbtn" onClick={() => setMostrarCc(true)}>Cc/Cco</button>}
          </div>

          {mostrarCc && (<>
            <div className="ol-field">
              <label className="ol-field-lbl">Cc</label>
              <input className="ol-inp" value={cc} onChange={(e) => setCc(e.target.value)} />
            </div>
            <div className="ol-field">
              <label className="ol-field-lbl">Cco</label>
              <input className="ol-inp" value={bcc} onChange={(e) => setBcc(e.target.value)} />
            </div>
          </>)}

          {!respondendo && (
            <div className="ol-field">
              <label className="ol-field-lbl">Assunto</label>
              <input className="ol-inp" value={assunto} onChange={(e) => setAssunto(e.target.value)} />
            </div>
          )}

          <div
            ref={corpoRef}
            className="ol-composer-editor"
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Escreva sua mensagem…"
          />
          {base && (respondendo || encaminhando) && (
            <div className="ol-quote-note">
              A mensagem original de <strong>{nomeEndereco(base.from?.emailAddress)}</strong> será incluída.
            </div>
          )}

          {anexos.length > 0 && (
            <div className="ol-anexos">
              {anexos.map((a, i) => (
                <div key={i} className="ol-anexo">
                  <span className="ol-anexo-ic" aria-hidden>📎</span>
                  <span className="ol-anexo-nome" title={a.name}>{a.name}</span>
                  <span className="ol-anexo-tam">{fmtBytes(a.size)}</span>
                  <button className="ol-icon-btn" title="Remover" onClick={() => removerAnexo(i)} disabled={enviando}>✕</button>
                </div>
              ))}
            </div>
          )}
          <input ref={fileRef} type="file" multiple style={{ display: 'none' }}
            onChange={(e) => { adicionarArquivos(e.target.files); e.target.value = ''; }} />
        </div>

        {agendar && modo === 'new' && (
          <div className="ol-sched">
            <div className="ol-sched-row">
              <span className="ol-sched-ic" aria-hidden>🕐</span>
              <input type="date" className="ol-inp ol-sched-inp" value={dataAg} onChange={(e) => setDataAg(e.target.value)} />
              <input type="time" className="ol-inp ol-sched-inp" value={horaAg} onChange={(e) => setHoraAg(e.target.value)} />
              <button className="ol-btn ol-btn-primary ol-btn-sm" onClick={agendarEnvio} disabled={enviando}>Agendar envio</button>
            </div>
            <div className="ol-sched-sug">
              <button className="ol-chip" onClick={() => sugestao('1h')}>Em 1 hora</button>
              <button className="ol-chip" onClick={() => sugestao('amanha')}>Amanhã 9h</button>
              <button className="ol-chip" onClick={() => sugestao('segunda')}>Próx. segunda 9h</button>
            </div>
          </div>
        )}

        <div className="ol-composer-foot">
          <button className="ol-btn ol-btn-primary" onClick={enviar} disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar'}
          </button>
          <button className="ol-btn ol-btn-ghost" onClick={onFechar} disabled={enviando}>Descartar</button>
          {modo === 'new' && (
            <button className={`ol-btn ol-btn-ghost${agendar ? ' is-on' : ''}`} onClick={() => setAgendar((v) => !v)} disabled={enviando}>🕐 Agendar</button>
          )}
          {!respondendo && (
            <div className="ol-modelos-wrap">
              <button className="ol-btn ol-btn-ghost" onClick={() => setPicker((v) => !v)} disabled={enviando}>📄 Modelos</button>
              {picker && <PickerModelos onPick={aplicarModelo} onFechar={() => setPicker(false)} />}
            </div>
          )}
          <button className="ol-btn ol-btn-ghost" onClick={() => fileRef.current?.click()} disabled={enviando}>📎 Anexar</button>
          <span className="ol-composer-hint">Arraste arquivos aqui</span>
        </div>
      </div>
    </div>
  );
}

// ── Seletor de modelos (dentro do compositor) ─────────────────────────────
function PickerModelos({ onPick, onFechar }: { onPick: (t: EmailTemplate) => void; onFechar: () => void }) {
  const [busca, setBusca] = useState('');
  const q = useQuery<TemplatesResponse>({
    queryKey: chaves.templates(busca, 'all'),
    queryFn: ({ signal }) => apiGet<TemplatesResponse>('/templates', { q: busca || undefined }, signal),
  });
  const modelos = q.data?.templates ?? [];
  return (
    <div className="ol-picker" role="listbox">
      <div className="ol-picker-head">
        <input className="ol-inp" placeholder="Buscar modelo…" value={busca} onChange={(e) => setBusca(e.target.value)} autoFocus />
        <button className="ol-icon-btn" onClick={onFechar} aria-label="Fechar">✕</button>
      </div>
      {!q.isLoading && !q.data?.available ? (
        <div className="ol-picker-empty">Modelos disponíveis na Fase 2 (banco).</div>
      ) : q.isLoading ? (
        <div className="ol-picker-empty">Carregando…</div>
      ) : modelos.length === 0 ? (
        <div className="ol-picker-empty">Nenhum modelo.</div>
      ) : (
        <ul className="ol-picker-list">
          {modelos.map((t) => (
            <li key={t.id}>
              <button className="ol-picker-item" onClick={() => onPick(t)}>
                <span className="ol-picker-nome">{t.is_favorite ? '★ ' : ''}{t.name}</span>
                <span className="ol-picker-cat">{t.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
