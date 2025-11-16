# Reglas de negocio

Este documento resume las políticas funcionales aplicadas en el proyecto.

## Membresías
- Política actual expuesta por `GET /api/membership-policy`.
- Por defecto: hombres requieren membresía (`male: true`), mujeres opcional (`female: false`).
- Configurable vía entorno:
  - `REQUIRE_MEMBERSHIP_MALE=true|false`
  - `REQUIRE_MEMBERSHIP_FEMALE=true|false`

## Depósito de seguro
- Política actual expuesta por `GET /api/deposit-policy`.
- Mínimo por defecto: `120 EUR`.
- Configurable vía entorno: `INSURANCE_DEPOSIT_MIN` (número mayor a 0).

## App Check
- Desarrollo: modo depuración sin reCAPTCHA (meta `recaptcha:disable`).
- Producción: App Check “Enforced”, reCAPTCHA Enterprise activo y CSP correcta.

## VIP y Concierge
- Acceso a eventos VIP y panel de concierge basado en `custom claims`:
  - `admin: true`, `concierge: true`, `vipEligible: true`.
- Ver `docs/FIREBASE_CUSTOM_CLAIMS_SETUP.md`.

