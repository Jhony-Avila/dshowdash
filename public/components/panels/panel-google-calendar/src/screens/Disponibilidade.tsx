// screens/Disponibilidade.tsx — matriz de livre/ocupado e melhores horários (§22).
// @version 1.0.0  @created 2026-07-29
//
// A matriz é uma tabela HTML de verdade (não um canvas): dá navegação por
// teclado, leitura por leitor de tela e seleção de célula de graça — o §80 pede
// alternativa por teclado, e reimplementar isso em SVG custaria mais e entregaria
// menos.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { servico } from '../services';
import { chaves } from '../lib/api';
import type { EstadoSlot } from '../services/types';
import type { Preferencias } from '../shell/types';
import { Cartao, Chip } from '../shell/ui';
import { Icone } from '../shell/Icone';
import { EstadoErro, SkeletonBloco } from './Estados';
import { hora, diaCurto, hojeYmd, somaDias, duracao } from '../lib/tz';

const PESSOAS_SUGERIDAS = [
  'jhony@dshow.com.br',
  'marina.costa@dshow.com.br',
  'rafael.lima@dshow.com.br',
  'beatriz.nunes@dshow.com.br',
];

const ROTULO_ESTADO: Record<EstadoSlot, string> = {
  free: 'Livre', busy: 'Ocupado', focus: 'Foco',
  ooo: 'Fora do escritório', off_hours: 'Fora do expediente', lunch: 'Almoço',
};

export function Disponibilidade({ prefs, tz, onCriarEm }: {
  prefs: Preferencias; tz: string; onCriarEm: (inicioIso: string) => void;
}) {
  const [pessoas, setPessoas] = useState<string[]>([PESSOAS_SUGERIDAS[0], PESSOAS_SUGERIDAS[1]]);
  const [duracaoMin, setDuracaoMin] = useState(60);
  const [dias, setDias] = useState(3);

  const de = hojeYmd(tz);
  const ate = somaDias(de, dias - 1);

  const q = useQuery({
    queryKey: chaves.freebusy({ de, ate, tz, pessoas, duracaoMin, prefs: [prefs.expedienteInicio, prefs.expedienteFim, prefs.evitarAlmoco] }),
    queryFn: () => servico.getFreeBusy({ de, ate, tz, pessoas, duracao: duracaoMin }),
    enabled: pessoas.length > 0,
  });

  function togglePessoa(p: string) {
    setPessoas((atual) => atual.includes(p) ? atual.filter((x) => x !== p) : [...atual, p]);
  }

  if (q.isError) return <EstadoErro erro={q.error} onRetry={() => void q.refetch()} />;

  const matriz = q.data?.matriz ?? [];
  const sugestoes = q.data?.sugestoes ?? [];

  // Agrupa os slots por dia para a tabela não virar uma faixa infinita.
  const porDia = new Map<string, typeof matriz>();
  for (const linha of matriz) {
    const d = linha.slot.slice(0, 10);
    const l = porDia.get(d) ?? [];
    l.push(linha);
    porDia.set(d, l);
  }

  return (
    <div className="gc-tela">
      <div className="gc-barra-filtros">
        <div className="gc-chips">
          <span className="gc-filtro-rot">Participantes:</span>
          {PESSOAS_SUGERIDAS.map((p) => (
            <Chip key={p} texto={p.split('@')[0]} ativo={pessoas.includes(p)}
                  onClick={() => togglePessoa(p)} />
          ))}
        </div>
        <div className="gc-chips">
          <span className="gc-filtro-rot">Duração:</span>
          {[30, 60, 90, 120].map((d) => (
            <Chip key={d} texto={duracao(d)} ativo={duracaoMin === d} onClick={() => setDuracaoMin(d)} />
          ))}
        </div>
        <div className="gc-chips gc-chips-fim">
          {[1, 3, 5].map((d) => (
            <Chip key={d} texto={`${d} dia${d > 1 ? 's' : ''}`} ativo={dias === d} onClick={() => setDias(d)} />
          ))}
        </div>
      </div>

      <Cartao titulo="Melhores horários encontrados">
        {q.isLoading && <SkeletonBloco linhas={3} altura={30} />}
        {!q.isLoading && sugestoes.length === 0 && (
          <p className="gc-td-fraco">
            Nenhuma janela de {duracao(duracaoMin)} livre para todos no período —
            aumente o intervalo de dias ou reduza a duração.
          </p>
        )}
        <ul className="gc-sugestoes">
          {sugestoes.map((s) => (
            <li key={s.inicio}>
              <button type="button" className="gc-sugestao" onClick={() => onCriarEm(s.inicio)}>
                <span className="gc-sugestao-dia">{diaCurto(s.inicio, tz)}</span>
                <span className="gc-sugestao-hora">{hora(s.inicio, tz)} — {hora(s.fim, tz)}</span>
                <span className="gc-sugestao-cta"><Icone nome="calendar-plus" tamanho={14} /> Agendar</span>
              </button>
            </li>
          ))}
        </ul>
      </Cartao>

      <Cartao titulo="Matriz de disponibilidade">
        <div className="gc-legenda" role="list">
          {(Object.keys(ROTULO_ESTADO) as EstadoSlot[]).map((e) => (
            <span role="listitem" key={e}>
              <i className={`gc-leg gc-slot-${e}`} /> {ROTULO_ESTADO[e]}
            </span>
          ))}
        </div>

        {q.isLoading && <SkeletonBloco linhas={6} altura={26} />}

        {[...porDia.entries()].map(([dia, linhas]) => (
          <div className="gc-matriz-dia" key={dia}>
            <h4 className="gc-sub">{diaCurto(linhas[0].slot, tz)}</h4>
            <div className="gc-matriz-wrap">
              <table className="gc-matriz">
                <caption className="gc-sr">
                  Disponibilidade por participante em intervalos de 30 minutos
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="gc-matriz-canto">Participante</th>
                    {linhas.map((l) => (
                      <th scope="col" key={l.slot} className="gc-matriz-h">
                        {hora(l.slot, tz).endsWith(':00') ? hora(l.slot, tz) : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pessoas.map((p) => (
                    <tr key={p}>
                      <th scope="row" className="gc-matriz-pessoa">{p.split('@')[0]}</th>
                      {linhas.map((l) => {
                        const estado = l.estados[p] ?? 'free';
                        return (
                          <td key={l.slot}
                              className={`gc-slot gc-slot-${estado}`}
                              title={`${p} · ${hora(l.slot, tz)} · ${ROTULO_ESTADO[estado]}`}>
                            <span className="gc-sr">{ROTULO_ESTADO[estado]}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </Cartao>
    </div>
  );
}
