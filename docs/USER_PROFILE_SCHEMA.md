# Esquema de perfil de usuario

El documento describe el mapa mínimo esperado en Firestore para cada usuario.

```json
{
  "uid": "string",
  "displayName": "string|null",
  "photoURL": "string|null",
  "email": "string|null",
  "emailVerified": false,
  "phoneNumber": "string|null",
  "gender": "male|female|unknown",
  "role": "user|concierge|admin",
  "membership": { "active": false, "tier": null },
  "vipEligible": false,
  "status": "active|blocked",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

Notas:
- El script `scripts/update-existing-users.js` completa campos faltantes con valores por defecto sin sobrescribir los existentes.
- Los datos sensibles adicionales pueden residir en `users_private/{uid}`.

