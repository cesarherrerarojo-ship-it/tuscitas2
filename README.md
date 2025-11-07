# TuCitaSegura - User Search Page 🔍

Una aplicación moderna de búsqueda de usuarios para citas con filtros avanzados, diseño glassmorphism y experiencia de usuario excepcional.

## 🎯 Mejoras Implementadas

### 1. **Búsqueda Avanzada**
- ✅ Búsqueda en tiempo real por alias o biografía
- ✅ Debounce de 500ms para optimizar rendimiento
- ✅ Resaltado visual de filtros activos
- ✅ Chips de filtros con opción de eliminar individualmente

### 2. **Filtros Completos**
- ✅ **Edad**: Rango mínimo y máximo
- ✅ **Ciudad**: Búsqueda por ubicación
- ✅ **Reputación**: Filtro por nivel mínimo (Bronce, Plata, Oro, Platino)
- ✅ **Verificación**: Solo usuarios con email verificado
- ✅ **Estado en línea**: Solo usuarios activos
- ✅ **Género**: Automático (solo muestra género opuesto)

### 3. **Ordenamiento Inteligente**
- ✅ Más recientes (por fecha de registro)
- ✅ Edad: menor a mayor
- ✅ Edad: mayor a menor
- ✅ Mejor reputación primero

### 4. **Interfaz Mejorada**

#### Tarjetas de Usuario
- ✅ Diseño glassmorphism moderno
- ✅ Avatar con letra inicial colorida
- ✅ Indicador de estado en línea
- ✅ Badge de verificación
- ✅ Badge de reputación con emojis
- ✅ Información compacta (edad, ciudad)
- ✅ Biografía con line-clamp
- ✅ Botón "Ver Perfil" principal
- ✅ Botón de "Match Rápido" (corazón)
- ✅ Estado visual de solicitudes enviadas
- ✅ Animaciones escalonadas al cargar

#### Modal de Detalles
- ✅ Avatar grande con indicador de estado
- ✅ Badge de verificación
- ✅ Información completa del usuario
- ✅ Sección de biografía expandida
- ✅ **Estadísticas simuladas**:
  - Citas completadas
  - % de compatibilidad
  - Tasa de respuesta
- ✅ Sección de intereses (con tags)
- ✅ Última conexión
- ✅ Alerta visual si ya se envió solicitud
- ✅ Botones de acción grandes y claros
- ✅ Animaciones suaves de entrada/salida

### 5. **Sistema de Paginación**
- ✅ Carga inicial de 12 usuarios
- ✅ Botón "Cargar Más" para siguientes páginas
- ✅ Contador de usuarios disponibles
- ✅ Optimización de rendimiento (no carga todo de una vez)

### 6. **Validaciones y Seguridad**
- ✅ Verificación de suscripción activa
- ✅ Detección de solicitudes duplicadas
- ✅ Prevención de spam (deshabilita botón después de enviar)
- ✅ Validación de autenticación
- ✅ Verificación de email requerida

### 7. **Persistencia de Datos**
- ✅ Filtros guardados en localStorage
- ✅ Restauración automática al volver a la página
- ✅ Preferencias de ordenamiento guardadas

### 8. **UX/UI Enhancements**
- ✅ Panel de filtros colapsable
- ✅ Contador de resultados en tiempo real
- ✅ Chips de filtros activos visibles
- ✅ Botón "Limpiar todo" para resetear
- ✅ Estado de carga con skeleton screens
- ✅ Estado vacío amigable con CTA
- ✅ Animaciones suaves y transiciones
- ✅ Hover effects en todas las interacciones
- ✅ Responsive design completo
- ✅ Iconos Font Awesome consistentes
- ✅ Gradientes y efectos glassmorphism

### 9. **Sistema de Match Rápido**
- ✅ Botón de corazón en cada tarjeta
- ✅ Acción rápida sin abrir modal
- ✅ Feedback visual inmediato
- ✅ Actualización de estado en tiempo real
- ✅ Toast notifications para confirmación

### 10. **Optimizaciones de Rendimiento**
- ✅ Lazy loading con paginación
- ✅ Debounce en búsqueda en tiempo real
- ✅ Carga inicial optimizada
- ✅ Actualización selectiva de DOM
- ✅ Uso eficiente de Firebase queries

## 📁 Estructura de Archivos

```
/webapp
├── buscar-usuarios.html    # Página principal mejorada
└── /js
    ├── firebase-config.js  # Configuración de Firebase
    └── utils.js           # Funciones utilitarias
```

## 🛠️ Configuración

### 1. Firebase Setup

Edita `/webapp/js/firebase-config.js` con tu configuración de Firebase:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

### 2. Firestore Collections

La aplicación requiere las siguientes colecciones:

#### `users`
```javascript
{
  email: string,
  alias: string,
  birthDate: string (YYYY-MM-DD),
  gender: "masculino" | "femenino" | "otro",
  city: string,
  bio: string,
  reputation: "BRONCE" | "PLATA" | "ORO" | "PLATINO",
  emailVerified: boolean,
  hasActiveSubscription: boolean,
  isOnline: boolean,
  createdAt: Timestamp,
  lastActivity: Timestamp
}
```

#### `matches`
```javascript
{
  senderId: string,
  senderName: string,
  receiverId: string,
  receiverName: string,
  status: "pending" | "accepted" | "rejected",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🎨 Estilos y Diseño

### Paleta de Colores
- **Fondo**: Gradiente azul oscuro (#0f172a → #1e3a8a → #0369a1)
- **Glassmorphism**: rgba(255, 255, 255, 0.08) con blur
- **Acentos**: Azul (#0ea5e9), Rosa (#ec4899), Púrpura (#a855f7)
- **Reputación**:
  - Bronce: #92400e (ámbar oscuro)
  - Plata: #cbd5e1 (gris claro)
  - Oro: #facc15 (amarillo)
  - Platino: #67e8f9 (cian)

### Tipografía
- **Font**: Inter (Google Fonts)
- **Pesos**: 400, 500, 600, 700, 800, 900

### Iconos
- **Font Awesome 6.4.0** (CDN)

## 🚀 Características Destacadas

### 1. Búsqueda Inteligente
```javascript
// Búsqueda en tiempo real con debounce
document.getElementById('searchText').addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFiltersAndSort();
  }, 500);
});
```

### 2. Sistema de Reputación
```javascript
const badges = {
  'BRONCE': { color: '...', icon: '🥉', label: 'Bronce' },
  'PLATA': { color: '...', icon: '🥈', label: 'Plata' },
  'ORO': { color: '...', icon: '🥇', label: 'Oro' },
  'PLATINO': { color: '...', icon: '💎', label: 'Platino' }
};
```

### 3. Validación de Duplicados
```javascript
// Previene solicitudes duplicadas
const hasMatched = userMatches.includes(user.id);
if (hasMatched) {
  showToast('Ya enviaste solicitud a este usuario', 'warning');
  return;
}
```

### 4. Paginación Eficiente
```javascript
const USERS_PER_PAGE = 12;
const startIdx = currentPage * USERS_PER_PAGE;
const endIdx = startIdx + USERS_PER_PAGE;
const usersToDisplay = filteredUsers.slice(startIdx, endIdx);
```

## 📱 Responsive Design

- **Mobile**: 1 columna, menú adaptado
- **Tablet**: 2 columnas
- **Desktop**: 3 columnas
- **Breakpoints**: Tailwind CSS defaults (sm, md, lg, xl)

## 🔔 Notificaciones

Sistema de toast notifications con 4 tipos:
- ✅ **Success**: Verde (#10b981)
- ❌ **Error**: Rojo (#ef4444)
- ⚠️ **Warning**: Amarillo (#f59e0b)
- ℹ️ **Info**: Azul (#3b82f6)

Auto-cierre después de 5 segundos con animación.

## 🎯 Flujo de Usuario

1. **Carga inicial**
   - Verifica autenticación
   - Carga datos del usuario actual
   - Carga solicitudes enviadas previas
   - Carga usuarios disponibles
   - Aplica filtros guardados

2. **Búsqueda y Filtrado**
   - Usuario aplica filtros
   - Filtros se guardan en localStorage
   - Resultados se actualizan en tiempo real
   - Chips de filtros activos visibles

3. **Navegación**
   - Usuario ve tarjetas con preview
   - Puede hacer "match rápido" desde tarjeta
   - O abrir modal para ver perfil completo

4. **Envío de Solicitud**
   - Verifica suscripción activa
   - Verifica que no sea duplicada
   - Crea documento en Firestore
   - Actualiza UI inmediatamente
   - Muestra confirmación

5. **Paginación**
   - Carga inicial: 12 usuarios
   - "Cargar Más": siguiente página
   - Scroll automático suave

## 🔒 Seguridad

- ✅ Verificación de email requerida
- ✅ Suscripción activa validada
- ✅ Prevención de solicitudes duplicadas
- ✅ Sanitización de inputs
- ✅ Reglas de Firestore recomendadas

## 📊 Métricas y Analytics (Futuro)

La estructura permite agregar fácilmente:
- Tracking de búsquedas
- Métricas de match success rate
- Tiempo promedio hasta match
- Filtros más usados
- Conversión de vistas a solicitudes

## 🐛 Debugging

Console logs útiles están incluidos:
```javascript
console.error('Error loading users:', error);
console.error('Error sending match:', error);
```

## 🎁 Extras Incluidos

- **Compatibilidad calculada** (mock)
- **Estadísticas de usuario** (mock)
- **Intereses** (mock)
- **Estado en línea** (preparado para real-time)
- **Última conexión** (preparado)

## 📝 Notas de Implementación

### Firebase Rules Recomendadas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    match /matches/{matchId} {
      allow read: if request.auth != null &&
        (resource.data.senderId == request.auth.uid ||
         resource.data.receiverId == request.auth.uid);
      allow create: if request.auth != null &&
        request.resource.data.senderId == request.auth.uid;
    }
  }
}
```

### Índices Recomendados

1. `users` collection:
   - `gender` (Ascending), `createdAt` (Descending)
   - `gender` (Ascending), `reputation` (Descending)

2. `matches` collection:
   - `senderId` (Ascending), `createdAt` (Descending)
   - `receiverId` (Ascending), `status` (Ascending)

## 🚀 Próximas Mejoras Sugeridas

1. **Filtros Adicionales**
   - Rango de distancia (geolocalización)
   - Intereses comunes
   - Educación/ocupación
   - Estado de relación

2. **Funcionalidades**
   - Sistema de favoritos/guardados
   - Bloquear usuarios
   - Reportar perfiles
   - Chat en tiempo real
   - Videollamadas

3. **Gamificación**
   - Logros y badges
   - Racha de actividad
   - Puntos por interacciones

4. **Machine Learning**
   - Recomendaciones personalizadas
   - Match scoring automático
   - Detección de perfiles falsos

5. **Social Features**
   - Compartir perfiles
   - Eventos grupales
   - Testimonios/reviews

## 🎓 Recursos

- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Font Awesome Icons](https://fontawesome.com/icons)
- [Inter Font](https://fonts.google.com/specimen/Inter)

## 📄 Licencia

Este proyecto es parte de TuCitaSegura.

## 👨‍💻 Autor

Desarrollado con ❤️ por el equipo de TuCitaSegura

---

**¿Preguntas o sugerencias?** ¡Abre un issue en el repositorio!
