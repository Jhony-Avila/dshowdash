// workspace/BarraCenas.tsx — barra de CENAS do modo studio (§180/§185).
// @version 1.0.0  @created 2026-08-09  (lote 911–920, decisão #93 —
// componentização fase 3b do ShellStudio; DOM byte a byte com o bloco
// `avst5-apresenta` que vivia inline desde o mega 65)
//
// Presets de apresentação {fundo,hora,luz,clima?}: salvar (≤6), aplicar,
// renomear inline (duplo clique — estado LOCAL daqui), excluir, "↺
// última" (§185), sugestão Coleção→Cenário (§179, memo LOCAL) e o
// histórico de composição (§185 — ring no PAI, que também alimenta o
// storage; aqui só a leitura + restaurar). A condição `modo === 'studio'`
// fica no pai (quem conhece o modo é o shell).
import { useCallback, useMemo, useState } from 'react';
import type { AvatarConfig } from '../domain/types';
import { COLECOES } from '../services/AvatarCatalog';
import { telemetria } from '../services/Telemetria';
import {
  COLECAO_CENARIO, ROTULO_CLIMA, ROTULO_FUNDO, ROTULO_HORA, ROTULO_LUZ,
  gravarApresentacoes, lerApresentacoes,
} from './palco';
import type {
  ClimaPalco, Composicao, FundoPalco, HoraPalco, LuzPalco, PresetApresentacao,
} from './palco';

export interface PropsBarraCenas {
  fundo: FundoPalco;
  hora: HoraPalco;
  luz: LuzPalco;
  clima: ClimaPalco;
  trocarFundo: (f: FundoPalco) => void;
  trocarHora: (h: HoraPalco) => void;
  trocarLuz: (l: LuzPalco) => void;
  trocarClima: (c: ClimaPalco) => void;
  ultimaCena: { fundo: FundoPalco; hora: HoraPalco; luz: LuzPalco } | null;
  configVisivel: AvatarConfig;
  histPalco: Composicao[];
  restaurarComposicao: (h: Composicao) => void;
}

export function BarraCenas(props: PropsBarraCenas) {
  const { fundo, hora, luz, clima, trocarFundo, trocarHora, trocarLuz, trocarClima,
    ultimaCena, configVisivel, histPalco, restaurarComposicao } = props;
  // mega 65 (§180): presets de APRESENTAÇÃO (fundo+hora+luz num clique)
  const [apresentacoes, setApresentacoes] = useState<PresetApresentacao[]>(lerApresentacoes);
  const salvarApresentacao = useCallback(() => {
    const atuais = lerApresentacoes();
    if (atuais.length >= 6) return;
    const nova: PresetApresentacao = {
      id: `ap_${Date.now().toString(36)}`, nome: `Cena ${atuais.length + 1}`, fundo, hora, luz,
      ...(clima !== 'limpo' ? { clima } : {}), // lote 204 (§180 v2 — compat)
    };
    gravarApresentacoes([...atuais, nova]);
    setApresentacoes(lerApresentacoes());
    telemetria('palco_apresentacao_salvou', { fundo, hora, luz, clima }); // §290
  }, [fundo, hora, luz, clima]);
  // lote 177 (§180): RENOMEAR preset de apresentação (inline)
  const [renomeandoAp, setRenomeandoAp] = useState<{ id: string; nome: string } | null>(null);
  const confirmarRenomear = useCallback(() => {
    if (!renomeandoAp) return;
    const nome = renomeandoAp.nome.replace(/[^\p{L}\p{N} \-]/gu, '').slice(0, 18).trim();
    if (nome) {
      gravarApresentacoes(lerApresentacoes().map((x) => (x.id === renomeandoAp.id ? { ...x, nome } : x)));
      setApresentacoes(lerApresentacoes());
    }
    setRenomeandoAp(null);
  }, [renomeandoAp]);
  const aplicarApresentacao = useCallback((p: PresetApresentacao) => {
    trocarFundo(p.fundo);
    trocarHora(p.hora);
    trocarLuz(p.luz);
    trocarClima(p.clima ?? 'limpo'); // lote 204
    telemetria('palco_apresentacao_aplicou', { nome: p.nome }); // §290
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const excluirApresentacao = useCallback((id: string) => {
    gravarApresentacoes(lerApresentacoes().filter((p) => p.id !== id));
    setApresentacoes(lerApresentacoes());
  }, []);
  // lote 174 (§179): itens de coleção sugerem o AMBIENTE correspondente
  const sugestaoCenario = useMemo(() => {
    const equipados = new Set(Object.values(configVisivel.camadas).filter(Boolean) as string[]);
    for (const [colId, fundoSug] of Object.entries(COLECAO_CENARIO)) {
      const col = COLECOES.find((c) => c.id === colId);
      if (!col || !fundoSug || fundo === fundoSug) continue;
      if (col.itens.filter((i) => equipados.has(i)).length >= 2) return { col, fundoSug };
    }
    return null;
  }, [configVisivel, fundo]);
  return (
    <div className="avst5-apresenta" data-teste="apresentacoes">
      <span>Cenas:</span>
      {apresentacoes.map((p) => (
        <span key={p.id} className="avst5-apresenta-item">
          {renomeandoAp?.id === p.id ? (
            <input autoFocus value={renomeandoAp.nome} maxLength={18}
              aria-label="Novo nome da cena" data-teste="ap-renomear-input"
              onChange={(ev) => setRenomeandoAp({ id: p.id, nome: ev.target.value })}
              onBlur={confirmarRenomear}
              onKeyDown={(ev) => { if (ev.key === 'Enter') confirmarRenomear(); if (ev.key === 'Escape') setRenomeandoAp(null); }} />
          ) : (
            <button type="button" title={`${ROTULO_FUNDO[p.fundo]} · ${ROTULO_HORA[p.hora]} · ${ROTULO_LUZ[p.luz]} — duplo clique renomeia (§180)`}
              data-teste="ap-aplicar"
              onDoubleClick={() => setRenomeandoAp({ id: p.id, nome: p.nome })}
              onClick={() => aplicarApresentacao(p)}>{p.nome}</button>
          )}
          <button type="button" aria-label={`Excluir ${p.nome}`}
            onClick={() => excluirApresentacao(p.id)}>×</button>
        </span>
      ))}
      <button type="button" data-teste="apresentacao-salvar" disabled={apresentacoes.length >= 6}
        title="Guardar fundo+hora+luz atuais como cena (§180)"
        onClick={salvarApresentacao}>+ salvar</button>
      {ultimaCena && (ultimaCena.fundo !== fundo || ultimaCena.hora !== hora || ultimaCena.luz !== luz) && (
        <button type="button" data-teste="apresentacao-ultima"
          title="Voltar à cena da última apresentação (§185)"
          onClick={() => { trocarFundo(ultimaCena.fundo); trocarHora(ultimaCena.hora); trocarLuz(ultimaCena.luz); }}>
          ↺ última</button>
      )}
      {sugestaoCenario && (
        <button type="button" className="avst5-sugestao-cenario" data-teste="sugestao-cenario"
          title={`§179: ${sugestaoCenario.col.nome} combina com o cenário ${ROTULO_FUNDO[sugestaoCenario.fundoSug]}`}
          onClick={() => { trocarFundo(sugestaoCenario.fundoSug); telemetria('palco_sugestao_cenario', { col: sugestaoCenario.col.id }); }}>
          ✦ {ROTULO_FUNDO[sugestaoCenario.fundoSug]} combina com {sugestaoCenario.col.nome}</button>
      )}
      {histPalco.length > 1 && (
        <span className="avst5-hist-palco" data-teste="hist-palco">
          <span aria-hidden>·</span>
          {histPalco.slice(0, -1).slice(-3).reverse().map((h, i) => (
            <button key={`${h.fundo}-${h.hora}-${h.luz}-${i}`} type="button" data-teste="hist-restaurar"
              title={`Restaurar composição (§185): ${ROTULO_FUNDO[h.fundo]} · ${ROTULO_HORA[h.hora]} · ${ROTULO_LUZ[h.luz]}`}
              onClick={() => restaurarComposicao(h)}>
              ⤺ {ROTULO_FUNDO[h.fundo]}·{ROTULO_HORA[h.hora].slice(0, 3)}·{ROTULO_LUZ[h.luz].slice(0, 4)}{h.clima && h.clima !== 'limpo' ? `·${ROTULO_CLIMA[h.clima]}` : ''}</button>
          ))}
        </span>
      )}
    </div>
  );
}
