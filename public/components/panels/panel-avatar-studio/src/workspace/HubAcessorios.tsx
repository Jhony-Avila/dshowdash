// workspace/HubAcessorios.tsx — HUB da categoria-mãe ACESSÓRIOS (mega
// onda 1301+, decisão #142, flag as6.acess_hub; briefing §2/§3/§16/§17/
// §21/§22).
// @version 1.0.0  @created 2026-08-11
//
// Uma FAIXA de chips (não navegação profunda — briefing §3): regiões
// como separadores, subcategorias como chips com contagem de itens e
// ponto de equipado; "Todos" volta à busca global (a busca da grade
// pesquisa a categoria inteira quando nenhuma subcategoria está ativa
// — briefing §18). Subcategoria EM_PREPARACAO aparece desabilitada com
// aviso honesto (§32 — nada vazio publicado como completo). "Limpar
// acessórios" (§22) pede confirmação em 2 cliques e vira UM comando
// com undo. Resumo compacto "N equipados" (§21) vive na própria faixa.
import { useEffect, useMemo, useState } from 'react';
import { Eraser } from 'lucide-react';
import type { AvatarConfig } from '../domain/types';
import { itensDe } from '../services/AvatarCatalog';
import { t } from '../nucleo/i18n';
import {
  REGIOES_ACESSORIO, SUBCATEGORIAS_ACESSORIO, subcategoriaDoAsset,
} from './acessorios';

export function HubAcessorios({ config, subAtiva, aoEscolherSub, aoLimparTudo }: {
  config: AvatarConfig;
  subAtiva: string | null;
  aoEscolherSub: (id: string | null) => void;
  /** limpa TODOS os acessórios (um comando; undo pelo histórico) */
  aoLimparTudo: () => void;
}) {
  // contagem de itens por subcategoria (catálogo é estático — 1×)
  const contagens = useMemo(() => {
    const c = new Map<string, number>();
    for (const item of itensDe('acessorio')) {
      const sub = subcategoriaDoAsset(item.id);
      if (sub) c.set(sub.id, (c.get(sub.id) ?? 0) + 1);
    }
    return c;
  }, []);
  // equipados por subcategoria (varre os slots acessorio_* do config)
  const equipados = useMemo(() => {
    const e = new Map<string, number>();
    for (const [k, id] of Object.entries(config.camadas)) {
      if (!k.startsWith('acessorio') || !id) continue;
      const sub = subcategoriaDoAsset(id as string);
      if (sub) e.set(sub.id, (e.get(sub.id) ?? 0) + 1);
    }
    return e;
  }, [config]);
  const totalEquipados = [...equipados.values()].reduce((a, b) => a + b, 0);
  // §22: ação global com CONFIRMAÇÃO (2 cliques; 3s desarma sozinho)
  const [confirmando, setConfirmando] = useState(false);
  useEffect(() => {
    if (!confirmando) return undefined;
    const timer = window.setTimeout(() => setConfirmando(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmando]);

  return (
    <div className="avst6-hub" data-teste="hub-acessorios" role="navigation"
      aria-label={t('Subcategorias de acessórios')}>
      <button type="button" role="radio" aria-checked={subAtiva === null}
        className={`avst6-hub-chip${subAtiva === null ? ' avst6-hub-on' : ''}`}
        data-teste="hub-todos"
        onClick={() => aoEscolherSub(null)}>{t('Todos')}</button>
      {REGIOES_ACESSORIO.map((regiao) => {
        const subs = SUBCATEGORIAS_ACESSORIO.filter((s) => s.regiao === regiao.id && s.estado !== 'oculta');
        if (!subs.length) return null;
        return (
          <span key={regiao.id} className="avst6-hub-regiao" role="group" aria-label={regiao.nome}>
            <em>{t(regiao.nome)}</em>
            {subs.map((sub) => {
              const n = contagens.get(sub.id) ?? 0;
              const eq = equipados.get(sub.id) ?? 0;
              const preparando = sub.estado === 'em_preparacao';
              return (
                <button key={sub.id} type="button" role="radio" aria-checked={subAtiva === sub.id}
                  className={`avst6-hub-chip${subAtiva === sub.id ? ' avst6-hub-on' : ''}`}
                  data-teste={`hub-${sub.id}`}
                  disabled={preparando}
                  title={preparando
                    ? t('Em preparação — novos assets em breve')
                    : `${sub.nome} — ${n} ${n === 1 ? 'item' : 'itens'}${eq ? ` · ${eq} equipado${eq > 1 ? 's' : ''}` : ''}`}
                  onClick={() => aoEscolherSub(subAtiva === sub.id ? null : sub.id)}>
                  {t(sub.nome)}
                  {n > 0 && <small>{n}</small>}
                  {eq > 0 && <i className="avst6-hub-eq" aria-hidden />}
                  {preparando && <small aria-hidden>…</small>}
                </button>
              );
            })}
          </span>
        );
      })}
      {subAtiva && (() => { // breadcrumb §17
        const sub = SUBCATEGORIAS_ACESSORIO.find((s) => s.id === subAtiva);
        const regiao = REGIOES_ACESSORIO.find((r) => r.id === sub?.regiao);
        return sub && regiao ? (
          <span className="avst6-hub-bc" data-teste="hub-breadcrumb">
            {t('Acessórios')} › {t(regiao.nome)} › {t(sub.nome)}
          </span>
        ) : null;
      })()}
      <span className="avst6-hub-resumo" data-teste="hub-resumo" role="status">
        {totalEquipados > 0
          ? `${totalEquipados} ${totalEquipados === 1 ? t('acessório equipado') : t('acessórios equipados')}`
          : t('Nenhum acessório equipado')}
      </span>
      {totalEquipados > 0 && (
        <button type="button" data-teste="hub-limpar"
          className={`avst6-hub-chip avst6-hub-limpar${confirmando ? ' avst6-hub-confirma' : ''}`}
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
