// shell/Missoes.tsx — drawer de MISSÕES + desafio da semana (lote 196–198 ·
// §250/§251/§224). @version 1.0.0  @created 2026-08-05
//
// Lista as missões determinísticas com estado ao vivo (regra × config
// atual), o desafio da semana em destaque e os badges §224 conquistados
// (persistem mesmo se o look mudar). Perfil completo (XP/nível §220–§224)
// continua no modo clássico — aqui é o recorte acionável.
import { useMemo, useState } from 'react';
import { Flag, X } from 'lucide-react';
import type { AvatarConfig } from '../domain/types';
import { MISSOES, avaliarMissoes, desafioDaSemana, missoesFeitas } from '../services/Missoes';
import { telemetria } from '../services/Telemetria';

export function Missoes({ config, aoFechar }: {
  config: AvatarConfig;
  aoFechar: () => void;
}) {
  const [tic, setTic] = useState(0);
  const feitas = useMemo(() => {
    const novas = avaliarMissoes(config); // reavalia ao abrir (badge persiste)
    if (novas.length) telemetria('missao_concluida', { ids: novas.join(',') }); // §290
    return missoesFeitas();
  }, [config, tic]); // eslint-disable-line react-hooks/exhaustive-deps
  const desafio = useMemo(() => desafioDaSemana(), []);

  return (
    <div className="avst5-detalhe-fundo" role="dialog" aria-modal="true" aria-label="Missões">
      <button type="button" className="avst-fpop-fundo" aria-label="Fechar" onClick={aoFechar} />
      <aside className="avst5-detalhe avst5-missoes" data-teste="missoes">
        <header className="avst5-det-cab">
          <strong><Flag size={14} aria-hidden /> Missões</strong>
          <span>
            <button type="button" className="avst5-painel-btn" title="Reavaliar agora"
              onClick={() => setTic((t) => t + 1)}>↻</button>
            <button type="button" className="avst5-painel-btn" title="Fechar" onClick={aoFechar}>
              <X size={14} aria-hidden /></button>
          </span>
        </header>

        {/* §251: DESAFIO DA SEMANA — rotação determinística (semana ISO) */}
        <div className="avst5-desafio" data-teste="desafio-semana">
          <span className="avst5-desafio-selo">Desafio da semana</span>
          <strong>{desafio.badge} {desafio.titulo}</strong>
          <p>{desafio.dica}</p>
          {feitas.has(desafio.id) && <em data-teste="desafio-feito">✓ concluído</em>}
        </div>

        {/* §250: missões com estado ao vivo; §224: badge persiste */}
        <ol className="avst5-missoes-lista" data-teste="missoes-lista">
          {MISSOES.map((m) => {
            const ok = feitas.has(m.id);
            return (
              <li key={m.id} className={ok ? 'avst5-missao-feita' : ''} data-teste="missao" data-feita={ok ? '1' : '0'}>
                <span className="avst5-missao-badge" aria-hidden>{m.badge}</span>
                <div>
                  <strong>{m.titulo}</strong>
                  <p>{ok ? 'Concluída — badge seu para sempre (§224).' : m.dica}</p>
                </div>
                <span className="avst5-missao-check" aria-label={ok ? 'Concluída' : 'Pendente'}>{ok ? '✓' : '·'}</span>
              </li>
            );
          })}
        </ol>
        <p className="avst5-cons-nota">
          Missões são REGRAS transparentes sobre o que você já vê — sem sorte, sem
          compra, sem ranking (§634). XP e nível completos: perfil no modo clássico.
        </p>
      </aside>
    </div>
  );
}
