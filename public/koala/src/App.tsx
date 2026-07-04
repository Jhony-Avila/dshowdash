import { useEffect, useState } from 'react';
import { apiGet } from './api/client';
import { Shell } from './components/Shell';

// useAuthGuard implícito: GET /users/me. 401 já redireciona ao login dentro do client.
export function App() {
  const [me, setMe] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiGet('/users/me')
      .then(setMe)
      .catch((e: any) => {
        if (String(e?.message) !== 'AUTH') setErr(String(e?.message || e));
      });
  }, []);

  if (err) return <div className="k-center">Erro ao carregar: {err}</div>;
  if (!me) return <div className="k-center">Carregando Koala Docs…</div>;
  return <Shell me={me} />;
}
