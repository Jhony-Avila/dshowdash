// shell/PresetsShell.tsx — biblioteca de presets PESSOAIS no shell (§136/§199).
// @version 1.0.0  @created 2026-07-31  (AS5 F4)
//
// Aba "Presets" do painel: salvar o look ATUAL com nome, listar a
// biblioteca (favoritos primeiro), aplicar (vira COMANDO com undo),
// favoritar, duplicar e excluir. Thumbnail = render estático do próprio
// config (determinístico — mesma fonte de verdade do palco).
import { useRef, useState } from 'react';
import { BookmarkPlus, Copy, HardDriveDownload, HardDriveUpload, Scale, Star, Trash2, TrendingUp, X } from 'lucide-react';
import type { AvatarConfig } from '../domain/types';
import { dataUriDe, itemPorId } from '../services/AvatarCatalog';
import { flag } from '../nucleo/flags';
import { sugerirPorCor } from '../services/ConselheiroEstilo'; // mega 345 (§205)
import {
  alternarFavoritoPreset, atualizarPreset, duplicarPreset, excluirPreset, listarPresets, salvarPreset, snapshotDoPreset,
} from '../services/PresetsPessoais';
import { aplicarBackup, codigoDoLook, exportarBackup, interpretarBackup, lerCodigoDoLook } from '../services/Backup';
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
  // mega 69 (§231): COMPARAÇÃO — escolha 2 presets p/ ver lado a lado
  const [comparar, setComparar] = useState<string[]>([]);
  const alternarComparar = (id: string) => {
    setComparar((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c.slice(-1), id]));
  };
  const presets = listarPresets();
  const [cmpA, cmpB] = comparar.map((id) => presets.find((p) => p.id === id)).filter(Boolean);
  void tic;

  /** mega 69: diferenças camada a camada entre dois configs.
   *  mega 249 (§231): agora também CORES e TÍTULO — a comparação cobre
   *  roupas, cores, títulos, auras e poderes como o briefing pede. */
  const diferencas = (a: AvatarConfig, b: AvatarConfig): Array<{ slot: string; de: string; para: string }> => {
    const chaves = new Set([...Object.keys(a.camadas), ...Object.keys(b.camadas)]);
    const saida: Array<{ slot: string; de: string; para: string }> = [];
    for (const k of chaves) {
      const va = (a.camadas as Record<string, string | undefined>)[k];
      const vb = (b.camadas as Record<string, string | undefined>)[k];
      if (va !== vb) saida.push({ slot: k, de: va ?? '—', para: vb ?? '—' });
    }
    if (a.base !== b.base) saida.unshift({ slot: 'base', de: a.base, para: b.base });
    // mega 249 (§231): título + cores por canal
    if ((a.titulo ?? '—') !== (b.titulo ?? '—')) {
      saida.push({ slot: 'título', de: a.titulo ?? '—', para: b.titulo ?? '—' });
    }
    for (const canal of ['pele', 'cabelo', 'roupa', 'destaque'] as const) {
      if (a.cores[canal] !== b.cores[canal]) {
        saida.push({ slot: `cor ${canal}`, de: a.cores[canal], para: b.cores[canal] });
      }
    }
    return saida;
  };

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
      {/* mega 345 (§205, flag as5.presets_v2): preset INTELIGENTE — a
          sugestão do consultor (regras §238, determinística) vira preset */}
      {flag('as5.presets_v2') && (
        <button type="button" className="avst-botao" data-teste="preset-inteligente"
          title="Gera um preset a partir da 1ª sugestão do consultor de estilo (§205/§238)"
          onClick={() => {
            const sug = sugerirPorCor(configAtual)[0];
            if (!sug) return;
            salvarPreset(`Inteligente: ${sug.titulo}`.slice(0, 24), sug.config);
            setTic((t) => t + 1);
          }}>
          Preset inteligente (§205)
        </button>
      )}
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
      {/* mega 97 (§373-lite): CÓDIGO DO LOOK — compartilha por texto */}
      <div className="avst5-backup avst5-look" data-teste="codigo-look">
        <button type="button" className="avst-botao" data-teste="look-copiar"
          title="Copia um código de texto com o look atual — cole em chat/e-mail"
          onClick={() => {
            const cod = codigoDoLook(configAtual);
            void navigator.clipboard?.writeText?.(cod).then(
              () => setAvisoBackup('Código do look copiado — é só colar.'),
              () => setAvisoBackup(cod), // sem clipboard: mostra p/ copiar à mão
            );
          }}>
          Copiar código do look
        </button>
        <input type="text" placeholder="Colar código DSHOW-…" aria-label="Código do look"
          data-teste="look-entrada"
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            const cfg = lerCodigoDoLook((e.target as HTMLInputElement).value);
            if (cfg) { aoAplicar(cfg); setAvisoBackup('Look aplicado a partir do código.'); (e.target as HTMLInputElement).value = ''; }
            else setAvisoBackup('Código inválido — confira se copiou inteiro.');
          }} />
      </div>
      {/* mega 69 (§231): painel de comparação — aparece com 2 escolhidos */}
      {cmpA && cmpB && (
        <div className="avst5-cmp-presets" data-teste="presets-comparar">
          <header>
            <strong><Scale size={13} aria-hidden /> {cmpA.nome} × {cmpB.nome}</strong>
            <button type="button" aria-label="Fechar comparação" onClick={() => setComparar([])}>
              <X size={13} aria-hidden /></button>
          </header>
          <div className="avst5-cmp-lado-a-lado">
            {[cmpA, cmpB].map((p) => (
              <figure key={p.id}>
                <img src={dataUriDe(p.config, { estatico: true, tamanho: 128 })} alt={p.nome} width={96} height={96} />
                <figcaption>{p.nome}</figcaption>
              </figure>
            ))}
          </div>
          <ul className="avst5-cmp-difs" data-teste="presets-difs">
            {diferencas(cmpA.config, cmpB.config).map((d) => (
              <li key={d.slot}>
                <em>{d.slot}</em>
                <span>{itemPorId(d.de)?.nome ?? d.de} → {itemPorId(d.para)?.nome ?? d.para}</span>
              </li>
            ))}
            {diferencas(cmpA.config, cmpB.config).length === 0 && <li>Idênticos nas camadas — só cores/props mudam.</li>}
          </ul>
        </div>
      )}

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
                    {/* mega 341 (§201/§202): versão + atualização no card */}
                    {flag('as5.presets_v2') && (p.versao ?? 1) > 1 && (
                      <em data-teste="preset-versao"> · v{p.versao} · {new Date(p.atualizadoEm ?? p.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</em>
                    )}
                  </small>
                </span>
              </button>
              <span className="avst5-preset-acoes">
                <button type="button" title="Comparar com outro preset (§231)"
                  className={comparar.includes(p.id) ? 'avst5-eq-on' : ''}
                  data-teste="preset-comparar"
                  onClick={() => alternarComparar(p.id)}>
                  <Scale size={13} aria-hidden />
                </button>
                <button type="button" title={p.favorito ? 'Tirar dos favoritos' : 'Favoritar'}
                  className={p.favorito ? 'avst5-eq-on' : ''}
                  onClick={() => { alternarFavoritoPreset(p.id); setTic((t) => t + 1); }}>
                  <Star size={13} aria-hidden fill={p.favorito ? 'currentColor' : 'none'} />
                </button>
                {/* mega 342 (§202): atualizar com o look atual = versão nova */}
                {flag('as5.presets_v2') && (
                  <button type="button" title="Atualizar com o look ATUAL (versão +1, §202)"
                    data-teste="preset-atualizar"
                    onClick={() => { atualizarPreset(p.id, configAtual); setTic((t) => t + 1); }}>
                    <TrendingUp size={13} aria-hidden />
                  </button>
                )}
                {/* mega 343 (§204): voltar ao snapshot mais recente */}
                {flag('as5.presets_v2') && (p.historico?.length ?? 0) > 0 && (
                  <button type="button" title="Aplicar o snapshot anterior deste preset (§204)"
                    data-teste="preset-snapshot"
                    onClick={() => { const c = snapshotDoPreset(p.id, 0); if (c) aoAplicar(c); }}>
                    <X size={13} aria-hidden style={{ display: 'none' }} />
                    <span aria-hidden style={{ fontSize: 10, fontWeight: 700 }}>v{Math.max(1, (p.versao ?? 1) - 1)}</span>
                  </button>
                )}
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
