## Objetivos
- Hacer la página de perfil visualmente más atractiva y coherente con la portada.
- Usar los verdes del index como color de acento principal (emerald/success), evitando cambios de color inconsistentes.
- Mejorar jerarquía visual, disposición y legibilidad sin alterar la lógica funcional.

## Paleta y Componentes
- Acentos: `--success: #10b981` (emerald), complementos `#22c55e` y `#34d399`.
- Mantener el fondo base y “glass”, pero resaltar acciones, chips y barras con verdes.
- Nuevos componentes reutilizables: `chip`, `progress`, variante `btn-success`.

## Cambios en `perfil.html`
- Header consistente ya aplicado; mantenerlo.
- Hero de perfil:
  - Añadir un bloque superior con avatar y nombre/alias, con anillo verde alrededor del avatar.
  - Chips de estado: Email verificado, Teléfono verificado, Perfil completo, Concierge (si aplica) con acentos verdes.
  - Acciones rápidas: “Verificar Email”, “Enviar código SMS”, “Guardar perfil” con `btn-success`.
- Reorganizar secciones en tarjetas (cards) claras:
  - Estado de cuenta: barra de progreso de completitud en verde (porcentaje y checklist breve).
  - Verificación de teléfono: mantener OTP pero estilizar inputs/botones con acento verde.
  - Información personal y Preferencias: títulos con subrayado verde discreto.
  - Galería: miniaturas con borde verde cuando cumple mínimo; mensaje en verde.
  - Origen: resumen con icono y texto en verde.
- Reducir banners grandes (rojo/amarillo) y convertirlos en avisos compactos con chips y bordes suaves.

## Estilos en `styles.css`
- Agregar utilidades:
  - `.btn-success` (gradiente verde), `.chip` (badge con variantes: success, warning), `.progress` + `.progress-bar` (fondo tenue + barra verde), `.section-title` (subrayado verde).
  - `.avatar-ring` (borde verde alrededor del avatar).
- Mantener compatibilidad con `btn-primary/secondary` ya existentes.

## Ajustes mínimos de JS en `perfil.html`
- Calcular porcentaje de completitud y actualizar `.progress-bar` y texto:
  - Reutilizar validaciones existentes (`originMunicipality`, avatar, galería, occupation, relationship, lookingFor, PayPal si female, bio ≥120 palabras).
  - Integrar el cálculo donde ya se actualiza `updateSaveButtonState()` o en el flujo de carga tras `onAuthStateChanged` y en el click de “Guardar”.
- Actualizar chips de estado (añadir/quitar clases `chip--success` / `chip--warning`) según `emailVerified`, `phoneVerified`, `profileComplete`.

## Inserciones ubicadas
- `public/perfil.html:80` (tras header): añadir hero con avatar + chips + acciones.
- `public/perfil.html:103` (título “Mi Perfil”): convertir a `section-title` y añadir barra de progreso.
- `public/perfil.html:135` (Verificación de teléfono): aplicar clases `btn-success` y estilos verdes.
- `public/perfil.html:159` y `public/perfil.html:188` y `public/perfil.html:202`: aplicar `section-title` y estilos de card.
- `public/styles.css`: añadir `.btn-success`, `.chip`, `.progress`, `.avatar-ring`, `.section-title`.

## Accesibilidad y Responsive
- Mantener contraste suficiente (verde sobre fondo oscuro), estados `:focus` visibles.
- Grid responsivo (mobile-first), evitar overflow en galería/hero.

## Verificación
- Previsualizar la página y revisar:
  - Coherencia estética con la portada (colores, tipografías, vidrio).
  - Legibilidad de secciones y controles.
  - Barra de progreso actualizándose al completar campos.
  - Chips cambiando según estado de verificación.

¿Confirmas que proceda con este rediseño verde del perfil aplicando las clases y ajustes descritos?