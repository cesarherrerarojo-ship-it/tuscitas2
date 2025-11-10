import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.json());

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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`TuCitaSegura server listening on http://localhost:${port}`);
});
