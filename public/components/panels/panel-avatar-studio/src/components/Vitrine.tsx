// components/Vitrine.tsx — vitrine de avatares do time (AS3 F4, decisão #26).
// @version 1.0.0  @created 2026-07-30
//
// Ranking VOLUNTÁRIO (só aparece quem criou avatar) e de COLEÇÃO (versões
// exploradas) — nunca produtividade. Dados do /api/avatar/vitrine.php.
import { useEffect, useState } from 'react';
import { Crown, LoaderCircle, Medal, Users } from 'lucide-react';

interface ItemVitrine {
  usuario: string;
  url: string;
  versoes: number;
  atualizado_em: string;
  sou_eu: boolean;
}

export function Vitrine() {
  const [itens, setItens] = useState<ItemVitrine[] | null>(null);

  useEffect(() => {
    let vivo = true;
    void fetch('/api/avatar/vitrine.php', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => { if (vivo) setItens(Array.isArray(c?.data?.vitrine) ? c.data.vitrine : []); })
      .catch(() => { if (vivo) setItens([]); });
    return () => { vivo = false; };
  }, []);

  if (itens === null) {
    return (
      <div className="avst-vazio">
        <LoaderCircle className="avst-girando" size={22} aria-hidden />
        <p>Carregando a vitrine…</p>
      </div>
    );
  }
  if (itens.length === 0) {
    return (
      <div className="avst-vazio">
        <Users size={26} aria-hidden />
        <p>A vitrine mostra quem já criou seu avatar — seja a primeira pessoa!</p>
      </div>
    );
  }

  return (
    <div className="avst-vitrine" role="list" aria-label="Vitrine de avatares">
      <p className="avst-conquistas-resumo">
        <Users size={13} aria-hidden /> Quem mais explorou o estúdio — participação voluntária, ranking de coleção.
      </p>
      {itens.map((v, i) => (
        <article key={v.usuario + i} role="listitem"
          className={`avst-vitrine-item ${v.sou_eu ? 'avst-vitrine-eu' : ''}`}>
          <span className={`avst-vitrine-pos avst-vitrine-pos-${i < 3 ? i + 1 : 'x'}`}>
            {i === 0 ? <Crown size={14} aria-hidden /> : i < 3 ? <Medal size={13} aria-hidden /> : i + 1}
          </span>
          <img src={v.url} alt={`Avatar de ${v.usuario}`} loading="lazy" />
          <div className="avst-vitrine-info">
            <strong>{v.usuario} {v.sou_eu && <em>(você)</em>}</strong>
            <span>{v.versoes} {v.versoes === 1 ? 'versão explorada' : 'versões exploradas'}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
