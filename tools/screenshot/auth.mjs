// auth.mjs — Modulo de autenticacao para servico de screenshots
// @version 2.0.0
// v2.0.0: Adicionado loginViaPage() para fallback de autenticacao via formulario
//         quando o cookie-based auth falha devido a race condition do SPA auth-guard

import { CONFIG } from './config.mjs';
import { logger } from './utils/logger.mjs';

// Faz login via API e retorna cookies para injetar no browser context
export async function getSessionCookies() {
  const loginUrl = `${CONFIG.BASE_URL}/api/auth/login.php`;

  if (!CONFIG.AUTH_USER || !CONFIG.AUTH_PASS) {
    throw new Error('Credenciais de servico nao configuradas. Defina SCREENSHOT_SERVICE_USER e SCREENSHOT_SERVICE_PASS no .env');
  }

  logger.info(`Autenticando como ${CONFIG.AUTH_USER}...`);

  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      login: CONFIG.AUTH_USER,
      password: CONFIG.AUTH_PASS,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha na autenticacao (HTTP ${response.status}): ${body}`);
  }

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Falha na autenticacao: ${data.error || 'resposta invalida'}`);
  }

  // Extrair session token da resposta
  const sessionToken = data.data?.session?.token;
  if (!sessionToken) {
    throw new Error('Token de sessao nao encontrado na resposta de login');
  }

  // Extrair dominio base da URL
  const url = new URL(CONFIG.BASE_URL);
  const domain = url.hostname;

  // Montar cookie DSHOWSESS para Playwright
  const cookies = [{
    name: 'DSHOWSESS',
    value: sessionToken,
    domain: `.${domain}`,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  }];

  logger.info('Autenticacao bem-sucedida, cookie de sessao obtido');
  return cookies;
}

// Detecta se a pagina atual e a tela de login
// Seletor do formulario de login. Casa tambem com o honeypot anti-bot
// (div.lm-honeypot), que so a checagem de visibilidade descarta.
const LOGIN_FORM_SELECTOR = 'input[placeholder*="Usu"], input[name="login"], input[type="text"][autocomplete="username"], .login-modal input, form input[type="password"]';

export async function isLoginPage(page) {
  try {
    // PRESENCA NAO PROVA NADA: o modal de login fica no DOM em TODA sessao, oculto
    // por div.login-container depois que o app monta. Medido em 2026-07-30 com sessao
    // valida: 4 nos casam o seletor, 0 estao visiveis. A versao antiga respondia
    // "true" com o app montado e a sidebar viva, fazendo o chamador cair em
    // loginViaPage() -- que espera um campo de senha VISIVEL e estoura o timeout de
    // 10s. Isso derrubava qualquer suite que recarregasse a pagina ja autenticada.
    //
    // A visibilidade precisa subir a cadeia de ancestrais: o honeypot e ocultado por
    // opacity:0 no PAI, e tanto o getBoundingClientRect do filho quanto o isVisible()
    // do Playwright o consideram visivel.
    return await page.evaluate((sel) => {
      const visivel = (el) => {
        for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
          const cs = getComputedStyle(n);
          if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') return false;
          if (Number(cs.opacity) === 0) return false;
        }
        const box = el.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
      };
      return Array.from(document.querySelectorAll(sel)).some(visivel);
    }, LOGIN_FORM_SELECTOR);
  } catch {
    return false;
  }
}

// Faz login preenchendo o formulario diretamente no browser (fallback)
// Resolve race condition do SPA auth-guard que redireciona antes do checkSession() completar
export async function loginViaPage(page) {
  logger.info('Fallback: realizando login via formulario no browser...');

  // Aguardar o formulario de login estar visivel
  await page.waitForSelector('input[type="password"]', { timeout: 10000, state: 'visible' });

  // Preencher credenciais usando page.fill() que lida com scroll/viewport automaticamente
  // Tentar varios seletores para o campo de usuario
  const userSelectors = [
    'input[placeholder*="Usu"]',
    'input[placeholder*="mail"]',
    'input[name="login"]',
    'input[name="username"]',
    'input[type="text"]',
    'input[type="email"]',
  ];

  let filled = false;
  for (const sel of userSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1000 })) {
        await el.fill(CONFIG.AUTH_USER, { timeout: 5000 });
        filled = true;
        logger.debug(`Campo de usuario preenchido via: ${sel}`);
        break;
      }
    } catch {
      // Tentar proximo seletor
    }
  }

  if (!filled) {
    throw new Error('Campo de usuario nao encontrado na tela de login');
  }

  // Preencher senha
  await page.locator('input[type="password"]').first().fill(CONFIG.AUTH_PASS, { timeout: 5000 });

  // Submeter - tentar botao de submit primeiro, depois Enter
  try {
    const submitBtn = page.locator('button:has-text("Entrar"), button:has-text("Login"), button[type="submit"]').first();
    if (await submitBtn.isVisible({ timeout: 2000 })) {
      await submitBtn.click({ timeout: 5000 });
    } else {
      await page.locator('input[type="password"]').first().press('Enter');
    }
  } catch {
    await page.locator('input[type="password"]').first().press('Enter');
  }

  // Aguardar navegacao pos-login (o formulario de login desaparece)
  await page.waitForFunction(() => {
    return !document.querySelector('input[type="password"]');
  }, { timeout: 15000 }).catch(() => {
    logger.warn('Timeout aguardando redirecionamento pos-login');
  });

  // Aguardar estabilizacao da rede
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  logger.info('Login via formulario concluido');
}
