# ⚡ Guía de Inicio Rápido — TuCitaSegura (Express)

## 🎯 Comienza en 5 Minutos

### Paso 1: Instala dependencias
```bash
npm install
```

### Paso 2: Configura Firebase (.env)
```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env y agrega tus credenciales y claves necesarias
# Obtén credenciales en: https://console.firebase.google.com

# Opcionales (para endpoints del servidor):
# RECAPTCHA_SECRET=<clave secreta v3/Enterprise>
# RECAPTCHA_FAILOPEN_DEV=true  # permite pasar en dev si falta secret
# GMAPS_API_KEY=<Google Maps JS API Key>
# REQUIRE_MEMBERSHIP_MALE=true|false
# REQUIRE_MEMBERSHIP_FEMALE=true|false
# INSURANCE_DEPOSIT_MIN=120
```

### Paso 3: Inicia el servidor de desarrollo
```bash
npm run dev
```

Por defecto arranca en `http://localhost:3000`. Para cambiar el puerto en Windows PowerShell:
```powershell
$env:PORT=3001; npm run dev
```
En CMD:
```cmd
set PORT=3001 && npm run dev
```

### Paso 4: Abre el navegador
```
http://localhost:3000/index.html
http://localhost:3000/perfil.html
```

---

## 🔥 Configuración Firebase (2 minutos)

### 1. Crear proyecto
1. Ve a `https://console.firebase.google.com`
2. Crea un proyecto y una app Web
3. Copia las credenciales a tu frontend (`public/js/firebase-config.js` o `firebase-config-enterprise.js`)

### 2. Habilitar servicios
```
✅ Authentication → Email/Password (y Auth Emulator en local si quieres)
✅ Firestore Database
✅ Storage
✅ Hosting (si vas a desplegar)
```

### 3. App Check y reCAPTCHA
- En local ya incluimos `<meta name="recaptcha:disable" content="true">` en `index.html` y `perfil.html` para evitar bloqueos.
- Se ha persistido un token de depuración de App Check vía meta:
  ```html
  <meta name="app_check_debug_token" content="cfad5090-caae-4dac-a4f5-d44c3f960e94">
  ```
  Úsalo solo en desarrollo; quítalo para producción.
- Alternativa: activa por URL `?debugtoken=...` o via `localStorage.setItem('firebaseAppCheckDebugToken', '...')`.

### 4. Emulador de Auth (opcional)
```bash
firebase emulators:start --only auth --project demo-tucs
```
El servidor Express proxya el emulador en el mismo origen (`http://localhost:3000`).

---

## 🚀 Comandos Principales
```bash
# Desarrollo
npm run dev              # Inicia servidor dev (Express)
npm run watch-css        # Tailwind en modo watch
npm run build-css        # Genera CSS minificado

# Producción
npm start               # Arranca el servidor

# Mantenimiento
npm run update:users    # Actualiza perfiles de usuarios en Firestore
```

---

## 🔧 Troubleshooting común

### Puerto ocupado
Cambiar puerto:
```powershell
$env:PORT=3001; npm run dev
```

### Firebase no conecta
1) Revisa que el `.env` esté completo si usas endpoints del servidor.
2) Confirma App Check en dev (token/meta presentes).
3) Si usas emulador, verifica que esté corriendo y que el frontend tenga `?useEmu=1` si aplica.

### reCAPTCHA
En desarrollo está desactivado por meta. En producción, configura `RECAPTCHA_SECRET` y el site key en la consola.

---

## 📁 Rutas útiles
- `public/index.html`
- `public/perfil.html`
- `public/js/firebase-config.js` / `public/js/firebase-config-enterprise.js`
- `server.js` (Express + endpoints + proxy emulador)
- `firestore.rules` / `firebase-storage.rules` / `firestore.indexes.json`

---

## ✅ Checklist de inicio
- [ ] Node.js v18+
- [ ] `npm install`
- [ ] `.env` configurado (si usas los endpoints del server)
- [ ] `npm run dev` funcionando
- [ ] App abierta en navegador
- [ ] App Check en modo debug activo en local

---

## 🆘 Ayuda rápida
- Firebase Docs: `https://firebase.google.com/docs`
- MDN Web Docs: `https://developer.mozilla.org`

---

¡Listo! Puedes empezar a desarrollar 🚀

