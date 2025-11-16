// Centralizar mensajes de diagnóstico de desarrollo.
export function logDevHints() {
  console.info('[Dev] Usa ?useEmu=1 para forzar emulador en frontend.');
  console.info('[Dev] Verifica App Check: await _appCheckInstance.getToken(true).');
}

