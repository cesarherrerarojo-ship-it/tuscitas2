# Reglas de seguridad de Firestore

Las reglas se mantienen en `firestore.rules` en la raíz del proyecto. Para desplegarlas:

1. Consola Firebase → Firestore → Reglas → Pegar contenido de `firestore.rules`.
2. O via CLI: `firebase deploy --only firestore:rules`.

Consideraciones:
- Uso de `custom claims` para autorizar rutas de administración y concierge.
- Subcolecciones como `conversations/{id}/messages` con control por participantes.
- Ver también `docs/CONCIERGE_SYSTEM.md`.

