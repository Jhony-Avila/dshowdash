// shell/Consultor.tsx — painel do CONSULTOR DE ESTILO (lote 121–130 ·
// §232–§240). @version 1.0.0  @created 2026-08-04
//
// Drawer com sugestões do motor de REGRAS (ConselheiroEstilo — nada de
// IA aqui; §238 exige o porquê em cada card). Segurar = prever no palco
// (§239 não-destrutivo); Aplicar = comando com undo; ★ guarda na
// biblioteca §240. Flag as5.consultor (ON — client-only, §651 desliga).
import { useMemo, useState } from 'react';
import { Lightbulb, Star, X } from 'lucide-react';
import type { AvatarConfig } from '../domain/types';
import { dataUriDe } from '../services/AvatarCatalog';
import {
  esquecerSugestao, guardadasDoConsultor, guardarSugestao, sugestoesDeEstilo,
} from '../services/ConselheiroEstilo';
import type { SugestaoEstilo } from '../services/ConselheiroEstilo';
import { itensUsados } from '../services/Progresso';
import { telemetria } from '../services/Telemetria';

export function Consultor({ config, desbloqueados, eventos, aoAplicar, aoPrever, aoFechar }: {
  config: AvatarConfig;
  desbloqueados: Set<string>;
  eventos?: Array<{ id: string; nome: string; ativo: boolean; itens: string[] }>;
  aoAplicar: (novo: AvatarConfig) => void;
  aoPrever: (novo: AvatarConfig | null) => void;
  aoFechar: () => void;
}) {
  const [tic, setTic] = useState(0);
  void tic;
  const sugestoes = useMemo(
    () => sugestoesDeEstilo(config, { desbloqueados, usados: itensUsados(), eventos }),
    [config, desbloqueados, eventos],
  );
  const guardadas = guardadasDoConsultor();

  const Card = ({ s, guardada }: { s: SugestaoEstilo; guardada: boolean }) => (
    <article className="avst5-cons-card" data-teste="cons-sugestao" data-origem={s.origem}>
      <button type="button" className="avst5-cons-thumb" title="Segure para ver no palco"
        onPointerDown={() => aoPrever(s.config)} onPointerUp={() => aoPrever(null)}
        onPointerLeave={() => aoPrever(null)}>
        <img src={dataUriDe(s.config, { estatico: true, tamanho: 96 })} alt="" width={72} height={72} />
      </button>
      <div className="avst5-cons-info">
        <strong>{s.titulo}</strong>
        <p data-teste="cons-porque">{s.porQue}</p>
        <div className="avst5-cons-acoes">
          <button type="button" className="avst-botao avst-botao-primario" data-teste="cons-aplicar"
            onClick={() => { aoAplicar(s.config); telemetria('consultor_aplicou', { id: s.id, origem: s.origem }); }}>
            Aplicar
          </button>
          <button type="button" className="avst-botao" aria-pressed={guardada}
            title={guardada ? 'Tirar da biblioteca' : 'Guardar na biblioteca (§240)'}
            onClick={() => { if (guardada) esquecerSugestao(s.id); else guardarSugestao(s); setTic((t) => t + 1); }}>
            <Star size={12} aria-hidden fill={guardada ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  );

  return (
    <div className="avst5-detalhe-fundo" role="dialog" aria-modal="true" aria-label="Consultor de estilo">
      <button type="button" className="avst-fpop-fundo" aria-label="Fechar" onClick={aoFechar} />
      <aside className="avst5-detalhe avst5-consultor" data-teste="consultor">
        <header className="avst5-det-cab">
          <strong><Lightbulb size={14} aria-hidden /> Consultor de estilo</strong>
          <button type="button" className="avst5-painel-btn" title="Fechar" onClick={aoFechar}><X size={14} aria-hidden /></button>
        </header>
        <p className="avst5-cons-nota">
          Sugestões por <strong>regras do catálogo</strong> (nada de IA): cada uma diz o porquê (§238).
          Segure a miniatura para ver no palco; nada é aplicado sem você mandar (§239).
        </p>
        {guardadas.length > 0 && (<>
          <h4 className="avst5-cons-titulo">Guardadas (§240)</h4>
          {guardadas.map((s) => <Card key={`g-${s.id}`} s={s} guardada />)}
        </>)}
        <h4 className="avst5-cons-titulo">Para o seu avatar de agora</h4>
        {sugestoes.length === 0 && <p className="avst5-cons-nota">Sem sugestões fortes — seu look já está redondo.</p>}
        {sugestoes.map((s) => <Card key={s.id} s={s} guardada={guardadas.some((g) => g.id === s.id)} />)}
      </aside>
    </div>
  );
}
