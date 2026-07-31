// shell/PresetsShell.tsx — biblioteca de presets PESSOAIS no shell (§136/§199).
// @version 1.0.0  @created 2026-07-31  (AS5 F4)
//
// Aba "Presets" do painel: salvar o look ATUAL com nome, listar a
// biblioteca (favoritos primeiro), aplicar (vira COMANDO com undo),
// favoritar, duplicar e excluir. Thumbnail = render estático do próprio
// config (determinístico — mesma fonte de verdade do palco).
import { useState } from 'react';
import { BookmarkPlus, Copy, Star, Trash2 } from 'lucide-react';
import type { AvatarConfig } from '../domain/types';
import { dataUriDe } from '../services/AvatarCatalog';
import {
  alternarFavoritoPreset, duplicarPreset, excluirPreset, listarPresets, salvarPreset,
} from '../services/PresetsPessoais';

export function PresetsShell({ configAtual, aoAplicar }: {
  configAtual: AvatarConfig;
  aoAplicar: (config: AvatarConfig) => void;
}) {
  const [nome, setNome] = useState('');
  const [tic, setTic] = useState(0); // relê a biblioteca após cada mutação
  const presets = listarPresets();
  void tic;

  const salvar = () => {
    if (salvarPreset(nome, configAtual)) { setNome(''); setTic((t) => t + 1); }
  };

  return (
    <section className="avst5-presets" aria-label="Meus presets">
      <div className="avst5-presets-salvar">
        <input type="text" value={nome} maxLength={48}
          placeholder="Nome do preset (ex.: CEO, Cyber, Evento)…"
          aria-label="Nome do novo preset"
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') salvar(); }} />
        <button type="button" className="avst-botao avst-botao-primario"
          disabled={!nome.trim()} onClick={salvar}>
          <BookmarkPlus size={13} aria-hidden /> Salvar atual
        </button>
      </div>
      {presets.length === 0 ? (
        <p className="avst5-presets-vazio">
          Sua biblioteca está vazia. Monte um look e salve como preset — ele
          guarda TUDO: camadas, cores, canais e propriedades.
        </p>
      ) : (
        <div className="avst5-presets-lista">
          {presets.map((p) => (
            <div key={p.id} className="avst5-preset" data-teste="preset">
              <button type="button" className="avst5-preset-corpo" title={`Aplicar ${p.nome}`}
                onClick={() => aoAplicar(p.config)}>
                <img src={dataUriDe(p.config, { estatico: true, tamanho: 64 })} alt="" width={44} height={44} />
                <span className="avst5-preset-info">
                  <strong>{p.nome}</strong>
                  <small>
                    {new Date(p.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    {p.tags.length ? ` · ${p.tags.join(', ')}` : ''}
                  </small>
                </span>
              </button>
              <span className="avst5-preset-acoes">
                <button type="button" title={p.favorito ? 'Tirar dos favoritos' : 'Favoritar'}
                  className={p.favorito ? 'avst5-eq-on' : ''}
                  onClick={() => { alternarFavoritoPreset(p.id); setTic((t) => t + 1); }}>
                  <Star size={13} aria-hidden fill={p.favorito ? 'currentColor' : 'none'} />
                </button>
                <button type="button" title="Duplicar"
                  onClick={() => { duplicarPreset(p.id); setTic((t) => t + 1); }}>
                  <Copy size={13} aria-hidden />
                </button>
                <button type="button" title="Excluir"
                  onClick={() => { excluirPreset(p.id); setTic((t) => t + 1); }}>
                  <Trash2 size={13} aria-hidden />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
