# 🚀 Guía de Deployment a Producción - TuCitaSegura

**Última Actualización:** 2025-11-14
**Proyecto:** tuscitasseguras-2d1a6
**Branch:** claude/fix-firebase-auth-401-error-01MwxjaSnBCLvmaUjpS2Mazz

---

## ✅ Estado Actual

### Código Preparado para Producción

- ✅ App Check **HABILITADO** en 20 archivos HTML
- ✅ Cambios commitados (commit `7295ef4`)
- ✅ Cambios pusheados a GitHub
- ✅ Firebase CLI instalado (v14.25.0)
- ✅ Configuración verificada (firebase.json, .firebaserc)

### Próximo Paso

**SOLO FALTA:** Autenticarse con Firebase y hacer deploy

---

## 🔐 PASO 1: Autenticación con Firebase

### Opción A: Login Interactivo (Recomendado)

Ejecuta este comando en tu terminal:

```bash
firebase login
```

**Qué va a pasar:**
1. Se abrirá tu navegador
2. Selecciona tu cuenta de Google (la que tiene acceso a Firebase)
3. Autoriza Firebase CLI
4. Vuelve a la terminal

**Verificación:**
```bash
firebase projects:list
```

Deberías ver:
```
┌─────────────────────────┬─────────────────────┬────────────────┐
│ Project Display Name    │ Project ID          │ Resource       │
├─────────────────────────┼─────────────────────┼────────────────┤
│ TuCitaSegura           │ tuscitasseguras-2d1a6│ ...           │
└─────────────────────────┴─────────────────────┴────────────────┘
```

---

### Opción B: Token de CI (Automatización)

Si necesitas deployment automatizado (CI/CD):

```bash
# 1. Generar token
firebase login:ci

# 2. Copiar el token que aparece
# 3. Configurar como variable de entorno
export FIREBASE_TOKEN="tu-token-aquí"

# 4. Deploy con token
firebase deploy --only hosting --token "$FIREBASE_TOKEN"
```

---

## 🚀 PASO 2: Deployment a Producción

Una vez autenticado, ejecuta:

```bash
firebase deploy --only hosting --project tuscitasseguras-2d1a6
```

**Qué va a hacer:**
1. ✅ Sube todos los archivos del proyecto a Firebase Hosting
2. ✅ Configura headers HTTP (caché, etc.)
3. ✅ Despliega en el dominio de producción
4. ✅ Te da la URL de producción

**Salida esperada:**
```
=== Deploying to 'tuscitasseguras-2d1a6'...

i  deploying hosting
i  hosting[tuscitasseguras-2d1a6]: beginning deploy...
i  hosting[tuscitasseguras-2d1a6]: found X files in .
✔  hosting[tuscitasseguras-2d1a6]: file upload complete
i  hosting[tuscitasseguras-2d1a6]: finalizing version...
✔  hosting[tuscitasseguras-2d1a6]: version finalized
i  hosting[tuscitasseguras-2d1a6]: releasing new version...
✔  hosting[tuscitasseguras-2d1a6]: release complete

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/tuscitasseguras-2d1a6/overview
Hosting URL: https://tuscitasseguras-2d1a6.web.app
```

**Tiempo estimado:** 1-3 minutos

---

## 🧪 PASO 3: Verificación Post-Deployment

### 3.1. Verificar URL de Producción

Abre en tu navegador:

```
https://tuscitasseguras-2d1a6.web.app
```

O también:

```
https://tuscitasseguras-2d1a6.firebaseapp.com
```

---

### 3.2. Verificar App Check en Producción

1. **Abre la página de registro:**
   ```
   https://tuscitasseguras-2d1a6.web.app/webapp/register.html
   ```

2. **Abre Console del navegador (F12)**

3. **Deberías ver:**
   ```
   🔐 Inicializando App Check...
   ✅ App Check inicializado correctamente
   📍 Modo: PRODUCCIÓN (tuscitasseguras-2d1a6.web.app)
   🔑 Provider: reCAPTCHA Enterprise
   ```

4. **NO deberías ver:**
   - ❌ Errores de throttling
   - ❌ Errores 403
   - ❌ "App Check DESACTIVADO"

---

### 3.3. Probar Registro de Usuario

1. **Llena el formulario de registro:**
   - Alias
   - Email
   - Contraseña
   - Género
   - Fecha de nacimiento

2. **Click "Crear Cuenta"**

3. **Resultado esperado:**
   ```
   ✅ ¡Cuenta creada exitosamente!
   ✅ Revisa tu correo para verificar tu cuenta
   → Redirect a login
   ```

4. **NO debería haber error 401**

---

## 📊 Comandos Útiles de Firebase

### Ver Historial de Deployments

```bash
firebase hosting:channel:list
```

### Ver Logs de Hosting

```bash
firebase hosting:channel:list --project tuscitasseguras-2d1a6
```

### Rollback (Si algo sale mal)

```bash
# Ver versiones anteriores
firebase hosting:releases:list

# Rollback a versión anterior
firebase hosting:rollback
```

---

## 🔧 Configuración de Dominio Personalizado (Opcional)

Si quieres usar tu propio dominio (ej: `tucitasegura.com`):

### Paso 1: Añadir Dominio en Firebase Console

```
https://console.firebase.google.com/project/tuscitasseguras-2d1a6/hosting
```

1. Click en "Add custom domain"
2. Ingresa tu dominio
3. Verifica propiedad (TXT record en DNS)
4. Configura registros DNS (A records)

### Paso 2: Actualizar firebase-appcheck.js

Añade tu dominio a ALLOWED_DOMAINS:

```javascript
// webapp/js/firebase-appcheck.js
const ALLOWED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'tuscitasseguras-2d1a6.web.app',
  'tuscitasseguras-2d1a6.firebaseapp.com',
  'tucitasegura.com',              // ← Añadir
  'www.tucitasegura.com'           // ← Añadir
];
```

### Paso 3: Configurar reCAPTCHA Enterprise

```
https://console.cloud.google.com/security/recaptcha?project=tuscitasseguras-2d1a6
```

1. Click en site key: `6LfdTvQrAAAAACkGjvbbFIkqHMsTHwRYYZS_CGq2`
2. En "Domains", añadir:
   - `tucitasegura.com`
   - `www.tucitasegura.com`
3. Guardar

### Paso 4: Re-deploy

```bash
git add webapp/js/firebase-appcheck.js
git commit -m "feat: Add custom domain to App Check allowed domains"
git push
firebase deploy --only hosting
```

---

## 🚨 Troubleshooting

### Error: "Failed to authenticate"

**Solución:**
```bash
firebase logout
firebase login
firebase deploy --only hosting
```

---

### Error: "Permission denied"

**Problema:** Tu cuenta no tiene permisos en el proyecto

**Solución:**
1. Ve a Firebase Console → Project Settings → Users and Permissions
2. Verifica que tu email tiene rol de "Owner" o "Editor"
3. O pide al propietario que te añada

---

### Error: "Cannot find project"

**Solución:**
```bash
# Verificar proyecto actual
cat .firebaserc

# Debería mostrar: "default": "tuscitasseguras-2d1a6"

# Si no, configurar:
firebase use tuscitasseguras-2d1a6
```

---

### Error 401 en Producción (Usuarios)

**Causa:** Usuarios con throttling previo en su navegador

**Solución para usuarios:**
1. Ir a: https://tuscitasseguras-2d1a6.web.app/webapp/clear-appcheck-throttle.html
2. Click "Limpiar Estado de App Check"
3. Ctrl + Shift + Delete → Limpiar caché
4. Cerrar navegador y reabrir
5. Probar registro nuevamente

---

## 📝 Checklist de Deployment

Antes de hacer deploy, verifica:

- [ ] ✅ App Check imports habilitados en HTML files
- [ ] ✅ Firebase CLI instalado (`firebase --version`)
- [ ] ✅ Autenticado con Firebase (`firebase login`)
- [ ] ✅ Proyecto correcto (`firebase use tuscitasseguras-2d1a6`)
- [ ] ✅ Cambios commitados y pusheados a GitHub
- [ ] ✅ firebase.json configurado correctamente
- [ ] ✅ No hay errores de build

Durante el deploy:

- [ ] ✅ Ejecutar `firebase deploy --only hosting`
- [ ] ✅ Esperar confirmación "Deploy complete!"
- [ ] ✅ Copiar URL de Hosting

Después del deploy:

- [ ] ✅ Abrir URL de producción
- [ ] ✅ Verificar App Check se inicializa
- [ ] ✅ Probar registro de usuario
- [ ] ✅ Verificar NO hay error 401
- [ ] ✅ Revisar Console de Firebase por errores

---

## 🎯 Comandos Rápidos - Copiar y Pegar

```bash
# 1. Login (solo primera vez)
firebase login

# 2. Verificar proyecto
firebase projects:list

# 3. Usar proyecto correcto
firebase use tuscitasseguras-2d1a6

# 4. Deploy a producción
firebase deploy --only hosting

# 5. Abrir URL de producción
echo "URL: https://tuscitasseguras-2d1a6.web.app"

# 6. Abrir Console de Firebase
echo "Console: https://console.firebase.google.com/project/tuscitasseguras-2d1a6"
```

---

## 🔗 URLs Importantes

**Producción:**
- Web App: https://tuscitasseguras-2d1a6.web.app
- Web App (alt): https://tuscitasseguras-2d1a6.firebaseapp.com
- Registro: https://tuscitasseguras-2d1a6.web.app/webapp/register.html

**Firebase Console:**
- Overview: https://console.firebase.google.com/project/tuscitasseguras-2d1a6
- Hosting: https://console.firebase.google.com/project/tuscitasseguras-2d1a6/hosting
- App Check: https://console.firebase.google.com/project/tuscitasseguras-2d1a6/appcheck
- Authentication: https://console.firebase.google.com/project/tuscitasseguras-2d1a6/authentication

**Google Cloud Console:**
- reCAPTCHA: https://console.cloud.google.com/security/recaptcha?project=tuscitasseguras-2d1a6

---

## ✅ Resumen

**Estado Actual:**
- ✅ Código listo para producción
- ✅ App Check habilitado
- ✅ Commits pusheados
- ✅ Firebase CLI instalado

**Acción Requerida:**
1. **Ejecuta:** `firebase login`
2. **Ejecuta:** `firebase deploy --only hosting`
3. **Verifica:** https://tuscitasseguras-2d1a6.web.app
4. **Prueba:** Registro de usuario

**Tiempo Total:** 5-10 minutos

---

**¿Necesitas ayuda?** Consulta la sección de Troubleshooting arriba.
