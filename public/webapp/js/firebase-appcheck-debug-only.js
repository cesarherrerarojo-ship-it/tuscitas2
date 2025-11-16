// Solo para desarrollo local; no usar en producción.
export function getDebugStatus() {
  return !!globalThis.__appCheckReady;
}

