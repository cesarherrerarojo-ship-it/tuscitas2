import 'dotenv/config';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { promises as fs } from 'fs';

const app = express();
app.use(express.json());

// Inyección condicional de metas de App Check y reCAPTCHA solo en entorno local
// Controlado por env: APP_ENV=local | NODE_ENV!=='production' y APP_CHECK_DEBUG_TOKEN
app.get(['/', '/*.html', '/webapp/*.html'], async (req, res, next) => {
  try {
    const isLocal = process.env.APP_ENV === 'local' || process.env.NODE_ENV !== 'production';
    const token = process.env.APP_CHECK_DEBUG_TOKEN;
    if (!isLocal) return next();

    // Solo aplicamos si hay un archivo HTML dentro de /public
    const rel = req.path === '/' ? 'index.html' : req.path.replace(/^\//, '');
    const filePath = path.join(process.cwd(), 'public', rel);
    try {
      const html = await fs.readFile(filePath, 'utf8');
      // Evitar duplicados si ya existe en el HTML
      const hasAppCheck = html.includes('name="app_check_debug_token"');
      const hasRecaptchaDisable = html.includes('name="recaptcha:disable"');
      const metas = [];
      if (token && !hasAppCheck) metas.push(`<meta name="app_check_debug_token" content="${token}">`);
      if (!hasRecaptchaDisable) metas.push('<meta name="recaptcha:disable" content="true">');
      if (metas.length === 0) return res.type('html').send(html);

      const patched = html.replace(/<head(.*?)>/i, (m) => `${m}\n    ${metas.join('\n    ')}`);
      return res.type('html').send(patched);
    } catch (e) {
      // Si no se encuentra el archivo o falla la lectura, continuar a static
      return next();
    }
  } catch {
    return next();
  }
});

app.post('/api/verify-recaptcha', async (req, res) => {
  try {
    const { token, action } = req.body || {};
    if (!token) return res.status(400).json({ success: false, error: 'missing-token' });

    // Validación explícita: requiere secreto de reCAPTCHA en entorno
    if (!process.env.RECAPTCHA_SECRET) {
      // Modo desarrollo: permite pasar si está habilitado explícitamente
      const failOpen = process.env.RECAPTCHA_FAILOPEN_DEV === 'true';
      if (failOpen) {
        return res.status(200).json({ success: true, score: 0.9, action, hostname: 'localhost', hint: 'dev-failopen' });
      }
      return res.status(500).json({ success: false, error: 'missing-secret' });
    }

    const params = new URLSearchParams();
    params.append('secret', process.env.RECAPTCHA_SECRET);
    params.append('response', token);

    const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: params
    });
    const data = await r.json();

    const ok = data.success && (!action || data.action === action) &&
               (typeof data.score !== 'number' || data.score >= 0.5);

    res.json({ success: ok, score: data.score, action: data.action, hostname: data.hostname, 'error-codes': data['error-codes'] });
  } catch {
    res.status(500).json({ success: false, error: 'server-error' });
  }
});

// Provide Google Maps API key to client
app.get('/api/maps-key', (req, res) => {
  const key = process.env.GMAPS_API_KEY || '';
  if (!key) {
    return res.status(200).json({ key: null, message: 'GMAPS_API_KEY no configurado' });
  }
  res.json({ key });
});

// Membership policy endpoint
// Defaults: require membership for males (true), females optional (false)
// Configure via env: REQUIRE_MEMBERSHIP_MALE=true|false, REQUIRE_MEMBERSHIP_FEMALE=true|false
app.get('/api/membership-policy', (req, res) => {
  const requireMale = process.env.REQUIRE_MEMBERSHIP_MALE === 'false' ? false : true;
  const requireFemale = process.env.REQUIRE_MEMBERSHIP_FEMALE === 'true';
  res.json({ require: { male: requireMale, female: requireFemale } });
});

// Deposit policy endpoint
// Configure minimum required insurance deposit via env: INSURANCE_DEPOSIT_MIN (default 120)
app.get('/api/deposit-policy', (req, res) => {
  const raw = process.env.INSURANCE_DEPOSIT_MIN;
  let requiredAmount = 120;
  if (raw) {
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed) && parsed > 0) requiredAmount = parsed;
  }
  res.json({ requiredAmount, currency: 'EUR' });
});

// Serve static files from /public (patched index.html is already there)
app.use(express.static('public'));

// Proxy del emulador de Firebase Auth hacia el mismo origen
// Esto permite que el frontend se conecte al emulador usando http://localhost:3000
// y evita bloqueos por puertos externos o CORS en entornos de preview.
try {
  const EMU_TARGET = 'http://localhost:9099';
  app.use(
    '/identitytoolkit.googleapis.com',
    createProxyMiddleware({ target: EMU_TARGET, changeOrigin: true, logLevel: 'silent' })
  );
  app.use(
    '/securetoken.googleapis.com',
    createProxyMiddleware({ target: EMU_TARGET, changeOrigin: true, logLevel: 'silent' })
  );
  console.log('Auth Emulator proxy habilitado hacia', EMU_TARGET);
} catch (e) {
  console.warn('No se pudo habilitar el proxy del Auth Emulator', e);
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`TuCitaSegura server listening on http://localhost:${port}`);
});
