# 🌐 Verificación de Dominios - TuCitaSegura

## Dominios Configurados

Tu proyecto tiene 2 URLs que apuntan al mismo hosting:

1. **Firebase por defecto:**
   - https://tuscitasseguras-2d1a6.web.app
   - https://tuscitasseguras-2d1a6.firebaseapp.com

2. **Dominio personalizado:**
   - https://tucitasegura.com
   - https://www.tucitasegura.com (si está configurado)

---

## ✅ Verificar que el Dominio Funciona

### 1. Probar en navegador

Abre en tu navegador:
```
https://tucitasegura.com
```

**Debería mostrar tu aplicación TuCitaSegura** ✅

---

### 2. Verificar en Firebase Console

1. Ve a: https://console.firebase.google.com/project/tuscitasseguras-2d1a6/hosting/sites

2. Deberías ver:
   ```
   Default site: tuscitasseguras-2d1a6
   
   Custom domains:
   - tucitasegura.com (Connected)
   ```

---

## ⚠️ IMPORTANTE: App Check

**App Check necesita estar configurado para AMBOS dominios:**

### En Firebase Console → App Check

1. Ve a: https://console.firebase.google.com/project/tuscitasseguras-2d1a6/appcheck

2. Verifica que **reCAPTCHA Enterprise** incluye estos dominios:
   - ✅ tuscitasseguras-2d1a6.web.app
   - ✅ tuscitasseguras-2d1a6.firebaseapp.com
   - ✅ tucitasegura.com
   - ✅ www.tucitasegura.com

3. Si no están, añádelos:
   - Ve a: https://console.cloud.google.com/security/recaptcha
   - Selecciona tu key: `6LfdTvQrAAAAACkGjvbbFIkqHMsTHwRYYZS_CGq2`
   - En "Domains", añade:
     ```
     tucitasegura.com
     www.tucitasegura.com
     ```

---

## 🔄 Redirección Automática (Opcional)

Para que siempre uses tu dominio personalizado, puedes configurar:

### firebase.json

Añade redirección de Firebase URLs a tu dominio:

```json
{
  "hosting": {
    "redirects": [
      {
        "source": "/**",
        "destination": "https://tucitasegura.com/:path",
        "type": 301,
        "headers": [
          {
            "key": "X-Redirected-From",
            "value": "firebase-default"
          }
        ]
      }
    ]
  }
}
```

**NOTA:** Solo añade esto si quieres forzar el uso del dominio personalizado.

---

## 📝 Resumen

| Aspecto | Estado |
|---------|--------|
| Firebase Hosting | ✅ Funcionando |
| Dominio Personalizado | ✅ Conectado |
| SSL/HTTPS | ✅ Automático (Firebase) |
| App Check | ⚠️ Verificar dominios |
| Notificaciones Push | ✅ Listas |

---

## 🚀 Próximos Pasos

1. **Abre:** https://tucitasegura.com
2. **Verifica:** Que la app carga correctamente
3. **Configura:** App Check para incluir tucitasegura.com
4. **Prueba:** Notificaciones en el dominio personalizado

---

## 💡 URLs Útiles

- **Firebase Console:** https://console.firebase.google.com/project/tuscitasseguras-2d1a6
- **Hosting:** https://console.firebase.google.com/project/tuscitasseguras-2d1a6/hosting/sites
- **App Check:** https://console.firebase.google.com/project/tuscitasseguras-2d1a6/appcheck
- **reCAPTCHA:** https://console.cloud.google.com/security/recaptcha

---

**Última actualización:** 2025-11-14
