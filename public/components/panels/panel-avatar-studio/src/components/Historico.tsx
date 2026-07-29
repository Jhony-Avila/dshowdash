// components/Historico.tsx — linha do tempo das versões salvas (briefing §26).
// @version 1.0.0  @created 2026-07-29
//
// Cada versão em camadas pode ser REAPLICADA (vira o estado atual do editor);
// fotos aparecem como miniatura e são restauradas pela aba Foto.
import { useEffect, useState } from 'react';
import { Camera, History, LoaderCircle, RotateCcw } from 'lucide-react';
import type { AvatarConfig, HistoricoItem } from '../domain/types';
import { carregarHistorico } from '../services/AvatarService';
import { AvatarSvg } from './AvatarSvg';

function fmtData(iso: string): string {
  const d = new Date(iso.replace(' ', 'T'));
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function Historico({ aoAplicar }: { aoAplicar: (config: AvatarConfig) => void }) {
  const [itens, setItens] = useState<HistoricoItem[] | null>(null);

  useEffect(() => {
    let vivo = true;
    void carregarHistorico().then((h) => { if (vivo) setItens(h); });
    return () => { vivo = false; };
  }, []);

  if (itens === null) {
    return (
      <div className="avst-vazio">
        <LoaderCircle className="avst-girando" size={22} aria-hidden />
        <p>Carregando histórico…</p>
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="avst-vazio">
        <History size={28} aria-hidden />
        <p>Seu histórico aparece aqui depois do primeiro salvamento.</p>
      </div>
    );
  }

  return (
    <div className="avst-historico" role="list" aria-label="Histórico de avatares">
      {itens.map((item, idx) => (
        <div key={item.id} className="avst-hist-item" role="listitem">
          <span className="avst-hist-thumb">
            {item.config
              ? <AvatarSvg config={item.config} estatico uid={`hi-${item.id}`} />
              : item.url
                ? <img src={item.url} alt="Foto do histórico" loading="lazy" />
                : <Camera size={20} aria-hidden />}
          </span>
          <span className="avst-hist-info">
            <strong>{idx === 0 ? 'Atual' : `Versão anterior`}</strong>
            <em>{item.tipo === 'foto' ? 'Foto' : 'Camadas'} · {fmtData(item.criadoEm)}</em>
          </span>
          {item.config && (
            <button type="button" className="avst-botao" title="Reaplicar esta versão no editor"
              onClick={() => aoAplicar(item.config as AvatarConfig)}>
              <RotateCcw size={14} aria-hidden /> Usar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
