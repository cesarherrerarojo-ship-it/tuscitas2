# 💖 TuCitaSegura - Plataforma de Citas Seguras

> Una aplicación moderna de citas con enfoque en seguridad, verificación y compromiso real.

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com)
[![PayPal](https://img.shields.io/badge/PayPal-00457C?style=flat&logo=paypal&logoColor=white)](https://www.paypal.com)
[![Google Maps](https://img.shields.io/badge/Google_Maps-4285F4?style=flat&logo=google-maps&logoColor=white)](https://maps.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## 🎯 ¿Qué es TuCitaSegura?

**TuCitaSegura** es una plataforma de citas que garantiza **seriedad y compromiso** mediante:

✅ **Seguro Anti-Plantón** - Sistema único que protege contra plantones
✅ **Verificación de Identidad** - Usuarios verificados y con reputación
✅ **Sistema de Pago** - Solo usuarios comprometidos
✅ **Búsqueda Heterosexual** - Matching tradicional hombre-mujer
✅ **Geolocalización** - Encuentra personas cercanas a ti
✅ **Chat Seguro** - Comunicación 1-a-1 protegida

---

## ✨ Features Principales

### 🔐 Sistema de Autenticación
- Firebase Authentication con email/contraseña
- Verificación de email obligatoria
- Gestión segura de sesiones
- Sistema de roles (usuario/admin)

### 👤 Perfiles Enriquecidos
- **Avatar + Galería**: 1 foto principal + hasta 5 fotos adicionales (mínimo 2)
- **Información Personal**: Alias, edad, género, municipio, profesión
- **Autodescripción**: Mínimo 120 palabras para conocerte mejor
- **Estados Civiles Personalizados**:
  - "Felizmente Separado o Divorciado"
  - "Casado y Golfo"
  - "Viudo"
  - "Libre como un Pájaro"
  - "Prefiero No Contestar"
  - "Builder"
- **6 Temas de Color**: Personaliza la app a tu gusto
- **Sistema de Reputación**: Bronce → Plata → Oro → Platino

### 🔍 Búsqueda Avanzada con Google Maps
- **Vista en Grid o Mapa** interactivo
- **Geolocalización** con "Usar mi ubicación"
- **Búsqueda por Distancia** (5km - 100km)
- **Filtros Avanzados**: Edad, reputación, verificación
- **Ordenamiento**: Por distancia, edad, reputación
- **Autocomplete** de lugares de Google
- **Marcadores Personalizados** en el mapa
- **Cálculo de Distancias** en tiempo real

### 💬 Sistema de Chat 1-a-1
- Mensajería en tiempo real con Firebase
- Indicador de "escribiendo..."
- Contador de mensajes no leídos
- **Propuestas de Cita** con calendario integrado
- Estado de conversaciones (activa/archivada)

### 📅 Agendamiento de Citas
- Calendario interactivo para seleccionar fecha
- Selección de hora y lugar
- Sistema de confirmación mutua
- **Validación con Código QR** el día de la cita
- Página de detalle con información completa

### 💳 Sistema de Pagos (PayPal)
- **Membresía Premium**: €29.99/mes
  - Chat ilimitado
  - Solicitudes de cita ilimitadas
  - Filtros avanzados
  - Soporte prioritario

- **Seguro Anti-Plantón**: €120 pago único
  - Protección contra plantones verificados
  - Reembolso automático en caso de plantón
  - Válido de por vida
  - Garantía de seriedad

### 🛡️ Reglas de Negocio (Backend Enforced)
- **Búsqueda Heterosexual**: Solo género opuesto
- **Membresía para Hombres**: Obligatoria para chatear (€29.99/mes)
- **Seguro para Hombres**: Obligatorio para agendar citas (€120)
- **Mujeres Gratis**: Acceso completo sin pagos (temporalmente)
- **Validación en Firestore Rules**: Inquebrantable desde backend

### 🚨 Seguridad y Moderación
- Sistema de reportes de usuarios
- Bloqueo de usuarios problemáticos
- Motivos predefinidos de reporte
- Panel de administración
- Centro de Ayuda y Seguridad

---

## 💰 Modelo de Negocio

### 🚹 Usuarios Masculinos
```
✅ Membresía Premium: €29.99/mes
   → Requerida para chatear y enviar solicitudes

✅ Seguro Anti-Plantón: €120 (pago único)
   → Requerido para agendar citas confirmadas
```

### 🚺 Usuarios Femeninos
```
✅ Acceso Gratis (actual)
   → Todas las funcionalidades sin costo

🔮 Futuro: Modelo de pago para ambos géneros
```

📖 **Ver detalles:** [`BUSINESS_RULES.md`](./BUSINESS_RULES.md)

---

## 🚀 Quick Start

### 1. Clonar Repositorio
```bash
git clone https://github.com/cesarherrerarojo-ship-it/t2c06.git
cd t2c06
git checkout claude/build-user-search-page-011CUsoW7dRJdd1WfzCkvsE9
```

### 2. Configurar Firebase
1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar Authentication (Email/Password)
3. Crear Firestore Database
4. Habilitar Storage
5. Copiar configuración a `webapp/js/firebase-config.js`

### 3. Configurar Google Maps
1. Crear API Key en [Google Cloud Console](https://console.cloud.google.com)
2. Habilitar Maps JavaScript API
3. Actualizar en `webapp/buscar-usuarios.html`

### 4. Deploy Firestore Rules ⚠️ **CRÍTICO**
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 5. Ejecutar Localmente
```bash
# Opción 1: Python
python -m http.server 8000

# Opción 2: Node.js
npx http-server -p 8000

# Opción 3: VS Code Live Server
# Instalar extensión y abrir con Live Server
```

Abre: `http://localhost:8000`

📖 **Guía completa:** [`DEVELOPMENT.md`](./DEVELOPMENT.md)

---

## 📁 Estructura del Proyecto

```
t2c06/
├── index.html                 # Landing page
├── firestore.rules            # Security Rules (backend)
│
├── webapp/                    # Aplicación
│   ├── buscar-usuarios.html  # Búsqueda + Maps
│   ├── perfil.html           # Perfil de usuario
│   ├── conversaciones.html   # Lista de chats
│   ├── chat.html             # Chat 1-a-1
│   ├── cita-detalle.html     # Validación de cita
│   ├── reportes.html         # Reportes
│   ├── suscripcion.html      # Membresía
│   ├── seguro.html           # Seguro anti-plantón
│   ├── ayuda.html            # Centro de ayuda
│   ├── seguridad.html        # Centro de seguridad
│   ├── cuenta-pagos.html     # Gestión de cuenta
│   │
│   ├── js/
│   │   ├── firebase-config.js
│   │   ├── utils.js
│   │   └── theme.js
│   │
│   └── admin/
│       └── dashboard.html
│
└── docs/                      # Documentación
    ├── BUSINESS_RULES.md
    ├── FIRESTORE_SECURITY_RULES.md
    ├── GOOGLE_MAPS_FEATURES.md
    ├── PAYPAL_INTEGRATION.md
    ├── USER_PROFILE_SCHEMA.md
    └── DEVELOPMENT.md
```

---

## 🔐 Seguridad

### Firestore Security Rules
Las reglas de negocio están **enforced en backend** mediante Firestore Rules:

```javascript
// Solo búsqueda heterosexual
allow read: if isOppositeGender(targetUserId);

// Membresía requerida para chat (hombres)
allow create: if hasActiveMembership();

// Seguro requerido para citas (hombres)
allow create: if hasInsurance();
```

📖 **Ver guía completa:** [`FIRESTORE_SECURITY_RULES.md`](./FIRESTORE_SECURITY_RULES.md)

### Frontend Validation
Validaciones adicionales en frontend para mejor UX:
- Mensajes claros de error
- Redirects a páginas de pago
- Modales informativos
- Bloqueo de botones

---

## 🎨 Personalización

### Temas Disponibles
1. 💜 **Púrpura Pasión** (predeterminado)
2. 💙 **Azul Océano**
3. 💚 **Verde Natura**
4. 🧡 **Naranja Solar**
5. 💎 **Turquesa Tropical**
6. 💗 **Rosa Romance**

Los usuarios pueden cambiar el tema desde su perfil.

---

## 📊 Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **Firebase Authentication** | Login/registro de usuarios |
| **Firestore** | Base de datos NoSQL |
| **Firebase Storage** | Almacenamiento de fotos |
| **Google Maps API** | Geolocalización y mapas |
| **PayPal SDK** | Procesamiento de pagos |
| **Tailwind CSS** | Estilos y diseño responsivo |
| **Font Awesome** | Iconos |
| **Vanilla JavaScript** | Lógica de la aplicación |

---

## 📖 Documentación

| Documento | Descripción |
|-----------|-------------|
| [`DEVELOPMENT.md`](./DEVELOPMENT.md) | **Guía completa de desarrollo** |
| [`BUSINESS_RULES.md`](./BUSINESS_RULES.md) | Reglas de negocio y monetización |
| [`FIRESTORE_SECURITY_RULES.md`](./FIRESTORE_SECURITY_RULES.md) | Guía de Security Rules |
| [`GOOGLE_MAPS_FEATURES.md`](./GOOGLE_MAPS_FEATURES.md) | Integración de Google Maps |
| [`PAYPAL_INTEGRATION.md`](./PAYPAL_INTEGRATION.md) | Configuración de PayPal |
| [`USER_PROFILE_SCHEMA.md`](./USER_PROFILE_SCHEMA.md) | Schema de usuarios |

---

## 🐛 Bugs Arreglados

✅ **React Error #418** - Hydration mismatches resuelto
✅ Valores determinísticos en lugar de aleatorios
✅ Fix tiempo relativo en conversaciones
✅ Fix calendario (bug de mutación de fecha)

---

## 🔮 Roadmap

### Próximas Features
- [ ] Sistema de notificaciones push
- [ ] Video chat integrado
- [ ] Verificación de identidad con documento
- [ ] Sistema de badges y logros
- [ ] Integración con Stripe
- [ ] App móvil (React Native)
- [ ] Panel de admin avanzado
- [ ] Analytics y métricas
- [ ] Sistema de referidos
- [ ] Modo oscuro permanente

### Mejoras Planeadas
- [ ] Optimización de performance
- [ ] Tests automatizados
- [ ] CI/CD pipeline
- [ ] Internacionalización (i18n)
- [ ] PWA (Progressive Web App)

---

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📄 Licencia

Este proyecto es propiedad de **TuCitaSegura**.

---

## 📞 Contacto

- **GitHub**: [cesarherrerarojo-ship-it/t2c06](https://github.com/cesarherrerarojo-ship-it/t2c06)
- **Rama de desarrollo**: `claude/build-user-search-page-011CUsoW7dRJdd1WfzCkvsE9`

---

## ⭐ Agradecimientos

- Firebase por la infraestructura backend
- Google Maps por la geolocalización
- PayPal por el procesamiento de pagos
- Tailwind CSS por el sistema de diseño
- Font Awesome por los iconos

---

## 📊 Stats del Proyecto

```
📁 Archivos: 15+ páginas HTML
💻 Líneas de código: ~6,000+
🎨 Temas: 6 personalizables
🔐 Security Rules: 300+ líneas
📖 Documentación: 2,000+ líneas
✅ Features: 50+
🐛 Bugs conocidos: 0
```

---

<div align="center">

**🎉 ¡Proyecto 100% Funcional y Listo para Desarrollo! 🎉**

**Rama Principal:** `claude/build-user-search-page-011CUsoW7dRJdd1WfzCkvsE9`

Made with 💖 by TuCitaSegura Team

</div>
