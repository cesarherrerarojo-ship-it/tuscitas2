# Correcciones urgentes (Checklist)

1. Frontend: añadir meta `<meta name="recaptcha:disable" content="true">` en páginas de desarrollo.
2. Backend: `.env` → `RECAPTCHA_FAILOPEN_DEV=true`.
3. Emuladores: iniciar Auth → `firebase emulators:start --only auth --project demo-tucs`.
4. Frontend: abrir `index.html?useEmu=1`.
5. Verificar App Check token → `await _appCheckInstance.getToken(true)`.

