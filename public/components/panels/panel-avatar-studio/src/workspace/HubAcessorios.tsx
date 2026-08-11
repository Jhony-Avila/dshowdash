// workspace/HubAcessorios.tsx — subcategorias de ACESSÓRIOS (mega onda
// 1301+, decisões #142/#144, flag as6.acess_hub; briefing §2/§3/§16/
// §21/§22 + correção visual do Jhony 2026-08-11).
// @version 2.0.0  @created 2026-08-11
//
// v2 (#144): a faixa horizontal de chips acima da grade CONFUNDIU —
// feedback direto do Jhony com print. As subcategorias agora vivem na
// SIDEBAR, como ÁRVORE hierárquica convencional: um nível abaixo da
// categoria-mãe "Acessório", indentadas, com as regiões como rótulos
// de seção. A hierarquia fica visível no lugar onde todo mundo espera
// (categoria → subcategoria), então o breadcrumb §17 vira redundante e
// sai. O resumo "N equipados" §21 e o "Limpar tudo" §22 moram numa
// linha compacta acima da grade (ResumoAcessorios). Subcategoria
// EM_PREPARACAO segue desabilitada com aviso honesto (§32).
import { useEffect, useMemo, useState } from 'react';
import { Eraser } from 'lucide-react';
import type { AvatarConfig } from '../domain/types';
import { itensDe } from '../services/AvatarCatalog';
import { t } from '../nucleo/i18n';
import {
  REGIOES_ACESSORIO, SUBCATEGORIAS_ACESSORIO, subcategoriaDoAsset,
} from './acessorios';

/** contagem de itens por subcategoria + equipados por subcategoria */
function usarContagens(config: AvatarConfig) {
  // catálogo é estático — 1×
  const contagens = useMemo(() => {
    const c = new Map<string, number>();
    for (const item of itensDe('acessorio')) {
      const sub = subcategoriaDoAsset(item.id);
      if (sub) c.set(sub.id, (c.get(sub.id) ?? 0) + 1);
    }
    return c;
  }, []);
  const equipados = useMemo(() => {
    const e = new Map<string, number>();
    for (const [k, id] of Object.entries(config.camadas)) {
      if (!k.startsWith('acessorio') || !id) continue;
      const sub = subcategoriaDoAsset(id as string);
      if (sub) e.set(sub.id, (e.get(sub.id) ?? 0) + 1);
    }
    return e;
  }, [config]);
  return { contagens, equipados };
}

/** Árvore de subcategorias na SIDEBAR (#144) — filha da categoria-mãe. */
export function ArvoreAcessorios({ config, subAtiva, aoEscolherSub }: {
  config: AvatarConfig;
  subAtiva: string | null;
  aoEscolherSub: (id: string | null) => void;
}) {
  const { contagens, equipados } = usarContagens(config);
  return (
    <div className="avst6-arv" data-teste="arv-acessorios" role="group"
      aria-label={t('Subcategorias de acessórios')}>
      <button type="button" role="radio" aria-checked={subAtiva === null}
        className={`avst6-arv-sub${subAtiva === null ? ' avst6-arv-on' : ''}`}
        data-teste="arv-todos"
        onClick={() => aoEscolherSub(null)}>{t('Todos')}</button>
      {REGIOES_ACESSORIO.map((regiao) => {
        const subs = SUBCATEGORIAS_ACESSORIO.filter((s) => s.regiao === regiao.id && s.estado !== 'oculta');
        if (!subs.length) return null;
        return (
          <div key={regiao.id} className="avst6-arv-regiao" role="group" aria-label={regiao.nome}>
            <em>{t(regiao.nome)}</em>
            {subs.map((sub) => {
              const n = contagens.get(sub.id) ?? 0;
              const eq = equipados.get(sub.id) ?? 0;
              const preparando = sub.estado === 'em_preparacao';
              return (
                <button key={sub.id} type="button" role="radio" aria-checked={subAtiva === sub.id}
                  className={`avst6-arv-sub${subAtiva === sub.id ? ' avst6-arv-on' : ''}`}
                  data-teste={`arv-${sub.id}`}
                  disabled={preparando}
                  title={preparando
                    ? t('Em preparação — novos assets em breve')
                    : `${sub.nome} — ${n} ${n === 1 ? 'item' : 'itens'}${eq ? ` · ${eq} equipado${eq > 1 ? 's' : ''}` : ''}`}
                  onClick={() => aoEscolherSub(subAtiva === sub.id ? null : sub.id)}>
                  <span className="avst6-arv-nome">{t(sub.nome)}</span>
                  {preparando
                    ? <small aria-hidden>…</small>
                    : n > 0 && <small>{n}</small>}
                  {eq > 0 && <i className="avst6-arv-eq" aria-hidden />}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/** Resumo compacto §21 + "Limpar tudo" §22 — mora acima da grade. */
export function ResumoAcessorios({ config, aoLimparTudo }: {
  config: AvatarConfig;
  /** limpa TODOS os acessórios (um comando; undo pelo histórico) */
  aoLimparTudo: () => void;
}) {
  const { equipados } = usarContagens(config);
  const total = [...equipados.values()].reduce((a, b) => a + b, 0);
  // §22: ação global com CONFIRMAÇÃO (2 cliques; 3s desarma sozinho)
  const [confirmando, setConfirmando] = useState(false);
  useEffect(() => {
    if (!confirmando) return undefined;
    const timer = window.setTimeout(() => setConfirmando(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmando]);
  return (
    <div className="avst6-arv-resumo" data-teste="hub-resumo-linha">
      <span data-teste="hub-resumo" role="status">
        {total > 0
          ? `${total} ${total === 1 ? t('acessório equipado') : t('acessórios equipados')}`
          : t('Nenhum acessório equipado')}
      </span>
      {total > 0 && (
        <button type="button" data-teste="hub-limpar"
          className={`avst6-arv-limpar${confirmando ? ' avst6-arv-confirma' : ''}`}
          title={t('Remove todos os acessórios (dá para desfazer com Ctrl+Z)')}
          onClick={() => {
            if (!confirmando) { setConfirmando(true); return; }
            setConfirmando(false);
            aoLimparTudo();
          }}>
          <Eraser size={12} aria-hidden /> {confirmando ? t('Confirmar?') : t('Limpar tudo')}
        </button>
      )}
    </div>
  );
}
