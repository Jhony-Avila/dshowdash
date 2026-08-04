// shell/PresetsShell.tsx — biblioteca de presets PESSOAIS no shell (§136/§199).
// @version 1.0.0  @created 2026-07-31  (AS5 F4)
//
// Aba "Presets" do painel: salvar o look ATUAL com nome, listar a
// biblioteca (favoritos primeiro), aplicar (vira COMANDO com undo),
// favoritar, duplicar e excluir. Thumbnail = render estático do próprio
// config (determinístico — mesma fonte de verdade do palco).
import { useRef, useState } from 'react';
import { BookmarkPlus, Copy, HardDriveDownload, HardDriveUpload, Star, Trash2, TrendingUp } from 'lucide-react';
import type { AvatarConfig } from '../domain/types';
import { dataUriDe } from '../services/AvatarCatalog';
import {
  alternarFavoritoPreset, duplicarPreset, excluirPreset, listarPresets, salvarPreset,
} from '../services/PresetsPessoais';
import { aplicarBackup, exportarBackup, interpretarBackup } from '../services/Backup';
import { calcularXp, nivelDe } from '../components/ProgressoPerfil';
import { favoritos, itensUsados } from '../services/Progresso';

export function PresetsShell({ configAtual, aoAplicar }: {
  configAtual: AvatarConfig;
  aoAplicar: (config: AvatarConfig) => void;
}) {
  const [nome, setNome] = useState('');
  const [tic, setTic] = useState(0); // relê a biblioteca após cada mutação
  // mega 38: feedback do import de backup (avisos de itens descartados)
  const [avisoBackup, setAvisoBackup] = useState('');
  const refArquivo = useRef<HTMLInputElement>(null);
  const presets = listarPresets();
  void tic;

  const salvar = () => {
    if (salvarPreset(nome, configAtual)) { setNome(''); setTic((t) => t + 1); }
  };

  // mega 38: importa o JSON — validação ESTRITA no serviço; config vira
  // COMANDO (undo) via aoAplicar; presets/cenas substituem as bibliotecas
  const importar = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    try {
      const r = interpretarBackup(await arquivo.text());
      if (!r.ok) { setAvisoBackup(r.erro ?? 'Backup inválido.'); return; }
      aplicarBackup(r);
      if (r.config) aoAplicar(r.config);
      setTic((t) => t + 1);
      setAvisoBackup(['Backup importado.', ...r.avisos].join(' '));
    } catch { setAvisoBackup('Não consegui ler o arquivo.'); }
    finally { if (refArquivo.current) refArquivo.current.value = ''; }
  };

  // §574 (P9): DASHBOARD PESSOAL compacto — derivado de dados locais
  // (conquistas ficam no clássico; aqui: exploração, favoritos e biblioteca)
  const usados = itensUsados();
  const xp = calcularXp([], usados.size); // sem a Vida aqui: XP de exploração
  const { nivel } = nivelDe(xp);

  return (
    <section className="avst5-presets" aria-label="Meus presets">
      <div className="avst5-dash" data-teste="dashboard-pessoal">
        <span className="avst5-dash-item"><TrendingUp size={12} aria-hidden /> Nível {nivel}</span>
        <span className="avst5-dash-item"><strong>{usados.size}</strong> itens explorados</span>
        <span className="avst5-dash-item"><strong>{favoritos().size}</strong> favoritos</span>
        <span className="avst5-dash-item"><strong>{presets.length}</strong> presets salvos</span>
      </div>
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
      <div className="avst5-backup" data-teste="backup">
        <button type="button" className="avst-botao" data-teste="backup-exportar"
          title="Baixa um JSON com o look atual, seus presets e as cenas 3D"
          onClick={() => exportarBackup(configAtual)}>
          <HardDriveDownload size={13} aria-hidden /> Exportar backup
        </button>
        <button type="button" className="avst-botao" data-teste="backup-importar"
          title="Restaura um backup exportado (validação estrita — nada inválido entra)"
          onClick={() => refArquivo.current?.click()}>
          <HardDriveUpload size={13} aria-hidden /> Importar
        </button>
        <input ref={refArquivo} type="file" accept="application/json,.json" hidden
          aria-label="Arquivo de backup" data-teste="backup-arquivo"
          onChange={(e) => void importar(e.target.files?.[0])} />
        {avisoBackup && <p className="avst5-backup-aviso" role="status" data-teste="backup-aviso">{avisoBackup}</p>}
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
