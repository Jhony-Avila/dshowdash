// components/CriarIA.tsx — Criar com IA (AS3 F3, briefing 3.0 §19).
// @version 1.0.0  @created 2026-07-30
//
// Você descreve, o sistema monta do catálogo (nunca gera assets — decisão
// #24). Com a chave configurada no servidor usa o ProvedorIA; sem ela, o
// compositor temático local responde igual — o botão nunca falha.
import { useCallback, useState } from 'react';
import { Bot, Check, LoaderCircle, Sparkles, Wand2 } from 'lucide-react';
import type { AvatarConfig } from '../domain/types';
import { criarComIA } from '../services/VidaService';
import type { Personagem } from '../services/VidaService';
import { telemetria } from '../services/Telemetria';
import { AvatarSvg } from './AvatarSvg';

const SUGESTOES = [
  'um executivo futurista',
  'um guerreiro cyberpunk',
  'um mago dos dashboards',
  'uma raposa pro player',
  'me surpreenda',
];

export function CriarIA({ config, iaDisponivel, aoAplicar, desbloqueados }: {
  config: AvatarConfig;
  iaDisponivel: boolean;
  aoAplicar: (novo: AvatarConfig) => void;
  /** §636 (F8): permissão real do usuário — o validador barra itens bloqueados */
  desbloqueados?: Set<string>;
}) {
  const [pedido, setPedido] = useState('');
  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState<Personagem | null>(null);

  const gerar = useCallback(async (texto: string) => {
    const limpo = texto.trim();
    if (!limpo || gerando) return;
    setGerando(true);
    telemetria('ia', { fonte: iaDisponivel ? 'servidor' : 'local' });
    const p = await criarComIA(limpo, config, desbloqueados);
    setResultado(p);
    setGerando(false);
  }, [config, gerando, iaDisponivel, desbloqueados]);

  return (
    <section className="avst-ia" aria-label="Criar com IA">
      <h3 className="avst-cores-titulo"><Bot size={14} aria-hidden /> Criar com IA</h3>
      <p className="avst-foto-nota">
        Descreva o personagem e o estúdio monta com as peças do catálogo.
        {!iaDisponivel && ' (modo compositor local — a IA do servidor entra quando a chave for configurada)'}
      </p>

      <div className="avst-ia-entrada">
        <input type="text" value={pedido} maxLength={300}
          placeholder='Ex.: "quero um executivo futurista"'
          onChange={(e) => setPedido(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void gerar(pedido); }} />
        <button type="button" className="avst-botao avst-botao-primario"
          disabled={gerando || !pedido.trim()} onClick={() => void gerar(pedido)}>
          {gerando ? <LoaderCircle className="avst-girando" size={14} aria-hidden /> : <Wand2 size={14} aria-hidden />}
          {gerando ? ' Criando…' : ' Criar'}
        </button>
      </div>

      <div className="avst-ia-sugestoes">
        {SUGESTOES.map((s) => (
          <button key={s} type="button" className="avst-ia-chip"
            onClick={() => { setPedido(s); void gerar(s); }}>
            <Sparkles size={11} aria-hidden /> {s}
          </button>
        ))}
      </div>

      {resultado && (
        <article className="avst-ia-resultado">
          <span className="avst-ia-thumb">
            <AvatarSvg config={resultado.config} estatico uid="ia-res" />
          </span>
          <div className="avst-ia-info">
            <strong>{resultado.nome}</strong>
            <span className="avst-ia-historia">{resultado.historia}</span>
            <em>{resultado.fonte === 'ia' ? 'montado pela IA' : 'montado pelo compositor do estúdio'}</em>
            {resultado.ajuste && <em className="avst-ia-ajuste" data-teste="ia-ajuste">{resultado.ajuste}</em>}
            <div className="avst-foto-acoes">
              <button type="button" className="avst-botao" disabled={gerando}
                onClick={() => void gerar(pedido || 'me surpreenda')}>
                <Wand2 size={13} aria-hidden /> Outra versão
              </button>
              <button type="button" className="avst-botao avst-botao-primario"
                onClick={() => aoAplicar(resultado.config)}>
                <Check size={13} aria-hidden /> Aplicar no editor
              </button>
            </div>
          </div>
        </article>
      )}
    </section>
  );
}
