// components/Ferramentas.tsx — ferramentas metodológicas (perfis do engine).
// @version 1.0.0  @created 2026-07-28
//
// Cada ferramenta = formulário curto → primeira pergunta da conversa com o
// perfil correspondente. Depois o usuário refina conversando (memória cobre).
import { useEffect, useState, type ReactNode } from 'react';
import { FileSearch, KeyRound, Megaphone, ShieldX, Sparkles } from 'lucide-react';
import { listarSegmentos } from '../lib/api';
import { rotuloSegmento } from './Qualificacao';
import type { Perfil } from '../shell/types';

export interface CampoFerramenta {
  id: string;
  rotulo: string;
  tipo: 'input' | 'textarea' | 'segmento';
  placeholder?: string;
  obrigatorio?: boolean;
}

export interface Ferramenta {
  perfil: Perfil;
  titulo: string;
  curto: string;       // rótulo da sidebar
  descricao: string;
  icone: ReactNode;
  cta: string;
  campos: CampoFerramenta[];
  montar: (v: Record<string, string>) => string;
}

export const FERRAMENTAS: Ferramenta[] = [
  {
    perfil: 'gerador_anuncios',
    titulo: 'Gerador de anúncios (RSA)',
    curto: 'Gerador de anúncios',
    descricao: 'Títulos (≤30) e descrições (≤90) seguindo as promessas permitidas da metodologia.',
    icone: <Megaphone size={15} aria-hidden />,
    cta: 'Gerar anúncios',
    campos: [
      { id: 'produto', rotulo: 'Produto / oferta', tipo: 'input', obrigatorio: true, placeholder: 'Ex.: Painel de LED indoor P2.5 para lojas' },
      { id: 'segmento', rotulo: 'Segmento do público', tipo: 'segmento' },
      { id: 'contexto', rotulo: 'Diferenciais e observações (opcional)', tipo: 'textarea', placeholder: 'Ex.: instalação inclusa, garantia de 3 anos, foco em quem usa banner impresso hoje…' },
    ],
    montar: (v) => [
      `Gere anúncios responsivos de pesquisa para: ${v.produto}.`,
      v.segmento ? `Segmento do público: ${rotuloSegmento(v.segmento)}.` : '',
      v.contexto ? `Diferenciais e contexto: ${v.contexto}` : '',
    ].filter(Boolean).join('\n'),
  },
  {
    perfil: 'gerador_palavras',
    titulo: 'Gerador de palavras-chave',
    curto: 'Gerador de palavras',
    descricao: 'Listas agrupadas por intenção de compra, com correspondência sugerida.',
    icone: <KeyRound size={15} aria-hidden />,
    cta: 'Gerar palavras-chave',
    campos: [
      { id: 'produto', rotulo: 'Produto / tema da campanha', tipo: 'input', obrigatorio: true, placeholder: 'Ex.: Painel de LED para igreja' },
      { id: 'segmento', rotulo: 'Segmento do público', tipo: 'segmento' },
      { id: 'contexto', rotulo: 'Região, restrições e observações (opcional)', tipo: 'textarea', placeholder: 'Ex.: atendemos todo o Brasil; evitar termos de aluguel…' },
    ],
    montar: (v) => [
      `Monte a lista de palavras-chave para uma campanha de: ${v.produto}.`,
      v.segmento ? `Segmento: ${rotuloSegmento(v.segmento)}.` : '',
      v.contexto ? `Contexto: ${v.contexto}` : '',
    ].filter(Boolean).join('\n'),
  },
  {
    perfil: 'gerador_negativas',
    titulo: 'Gerador de negativas',
    curto: 'Gerador de negativas',
    descricao: 'Negativas organizadas por categoria de desperdício + rotina de monitoramento.',
    icone: <ShieldX size={15} aria-hidden />,
    cta: 'Gerar negativas',
    campos: [
      { id: 'produto', rotulo: 'Produto / tema da campanha', tipo: 'input', obrigatorio: true, placeholder: 'Ex.: Painel de LED outdoor' },
      { id: 'contexto', rotulo: 'O que você NÃO vende / público errado (opcional)', tipo: 'textarea', placeholder: 'Ex.: não vendemos peças avulsas nem fazemos locação; não atendemos pessoa física…' },
    ],
    montar: (v) => [
      `Monte a estratégia de palavras-chave negativas para uma campanha de: ${v.produto}.`,
      v.contexto ? `O que está fora do escopo: ${v.contexto}` : '',
    ].filter(Boolean).join('\n'),
  },
  {
    perfil: 'analise_lp',
    titulo: 'Analisador de landing page',
    curto: 'Análise de landing page',
    descricao: 'Auditoria pelos critérios da metodologia (proposta de valor, prova, CTA, coerência).',
    icone: <FileSearch size={15} aria-hidden />,
    cta: 'Analisar página',
    campos: [
      { id: 'url', rotulo: 'URL da página (opcional)', tipo: 'input', placeholder: 'https://…' },
      { id: 'contexto', rotulo: 'Descreva a página (seções, título, oferta, CTA…)', tipo: 'textarea', obrigatorio: true, placeholder: 'Ex.: título "Painéis de LED profissionais", vídeo institucional, formulário com 8 campos no rodapé, sem preços…' },
      { id: 'anuncio', rotulo: 'Anúncio/campanha que manda tráfego para ela (opcional)', tipo: 'input', placeholder: 'Ex.: campanha "painel led igreja", anúncio promete orçamento em 24h' },
    ],
    montar: (v) => [
      'Audite esta landing page pelos critérios da metodologia.',
      v.url ? `URL: ${v.url}` : '',
      `Descrição da página: ${v.contexto}`,
      v.anuncio ? `Origem do tráfego: ${v.anuncio}` : '',
    ].filter(Boolean).join('\n'),
  },
];

export function ferramentaPorPerfil(perfil: Perfil): Ferramenta | undefined {
  return FERRAMENTAS.find((f) => f.perfil === perfil);
}

export function FerramentaForm({ ferramenta, ocupado, onIniciar }: {
  ferramenta: Ferramenta;
  ocupado: boolean;
  onIniciar: (pergunta: string, segmento: string | null) => void;
}) {
  const [valores, setValores] = useState<Record<string, string>>({});
  const [segmentos, setSegmentos] = useState<string[]>([]);
  const usaSegmento = ferramenta.campos.some((c) => c.tipo === 'segmento');

  useEffect(() => {
    if (!usaSegmento) return;
    let ativo = true;
    listarSegmentos().then((s) => { if (ativo) setSegmentos(s); }).catch(() => { /* livre */ });
    return () => { ativo = false; };
  }, [usaSegmento]);

  // Limpa o formulário ao trocar de ferramenta.
  useEffect(() => { setValores({}); }, [ferramenta.perfil]);

  const pronto = ferramenta.campos
    .filter((c) => c.obrigatorio)
    .every((c) => (valores[c.id] ?? '').trim().length >= 3);

  const definir = (id: string, valor: string) =>
    setValores((v) => ({ ...v, [id]: valor }));

  return (
    <div className="anx-qual">
      <div className="anx-qual-head">
        <span className="anx-qual-ic" aria-hidden>{ferramenta.icone}</span>
        <div>
          <h2>{ferramenta.titulo}</h2>
          <p>{ferramenta.descricao} Tudo fundamentado na metodologia, com as fontes citadas.</p>
        </div>
      </div>

      <div className="anx-qual-form">
        {ferramenta.campos.map((campo) => (
          <label key={campo.id} className="anx-qual-campo">
            <span>{campo.rotulo}{!campo.obrigatorio && campo.tipo !== 'segmento' ? <em> (opcional)</em> : null}</span>
            {campo.tipo === 'segmento' ? (
              <select value={valores[campo.id] ?? ''} disabled={ocupado}
                onChange={(e) => definir(campo.id, e.target.value)}>
                <option value="">Não sei ainda / geral</option>
                {segmentos.map((s) => <option key={s} value={s}>{rotuloSegmento(s)}</option>)}
              </select>
            ) : campo.tipo === 'textarea' ? (
              <textarea rows={4} maxLength={1500} disabled={ocupado}
                value={valores[campo.id] ?? ''} placeholder={campo.placeholder}
                onChange={(e) => definir(campo.id, e.target.value)} />
            ) : (
              <input maxLength={300} disabled={ocupado}
                value={valores[campo.id] ?? ''} placeholder={campo.placeholder}
                onChange={(e) => definir(campo.id, e.target.value)} />
            )}
          </label>
        ))}

        <button className="anx-qual-btn" disabled={!pronto || ocupado}
          onClick={() => onIniciar(ferramenta.montar(valores), valores.segmento || null)}>
          <Sparkles size={15} aria-hidden /> {ferramenta.cta}
        </button>
        <p className="anx-qual-hint">
          Depois do resultado, refine conversando: "troque o ângulo dos títulos", "sem termos de locação"…
        </p>
      </div>
    </div>
  );
}
