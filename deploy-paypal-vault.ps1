Param(
  [string]$ProjectId = "tuscitasseguras-2d1a6",
  [string]$HostingOnly = "false",
  [string]$Mode = "sandbox"
)

# Helper: Write info
function Write-Info($msg){ Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg){ Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg){ Write-Host "[ERROR] $msg" -ForegroundColor Red }

Write-Info "Proyecto: $ProjectId"
Write-Info "Modo PayPal: $Mode"

# Check Firebase CLI
try {
  $fbv = firebase --version 2>$null
  if (-not $fbv) { throw "Firebase CLI no encontrado" }
  Write-Info "Firebase CLI OK ($fbv)"
} catch {
  Write-Err "Firebase CLI no está instalado o no está en PATH. Instala con: npm i -g firebase-tools"
  exit 1
}

# Login (si no estás autenticado, se abrirá navegador)
Write-Info "Autenticando en Firebase (si ya estás autenticado, este paso será rápido)"
firebase login || Write-Warn "Continuando; si ya estás autenticado no es crítico"

# Seleccionar proyecto
Write-Info "Seleccionando proyecto $ProjectId"
firebase use $ProjectId --project $ProjectId
if ($LASTEXITCODE -ne 0) { Write-Err "No se pudo seleccionar el proyecto $ProjectId"; exit 1 }

# Solicitar credenciales PayPal
$clientId = Read-Host "Introduce PayPal Client ID"
if (-not $clientId -or $clientId.Trim().Length -lt 10){ Write-Err "Client ID inválido"; exit 1 }
$secret = Read-Host "Introduce PayPal Secret"
if (-not $secret -or $secret.Trim().Length -lt 10){ Write-Err "Secret inválido"; exit 1 }

# Configurar funciones (runtime config)
Write-Info "Configurando funciones: paypal.client_id / paypal.secret / paypal.mode=$Mode"
firebase functions:config:set paypal.client_id="$clientId" paypal.secret="$secret" paypal.mode="$Mode" --project $ProjectId
if ($LASTEXITCODE -ne 0) { Write-Err "Fallo al configurar funciones"; exit 1 }

# Intentar actualizar Client ID en frontend si existe SDK
$seguroPath = Join-Path $PSScriptRoot "public/webapp/seguro.html"
if (Test-Path $seguroPath) {
  Write-Info "Revisando $seguroPath para actualizar client-id del SDK PayPal"
  $content = Get-Content $seguroPath -Raw
  if ($content -match "https://www\.paypal\.com/sdk/js") {
    # Reemplazar parámetro client-id si existe
    $newContent = [Regex]::Replace($content, "client-id=([^&'\"]+)", "client-id=$clientId")
    if ($newContent -ne $content) {
      Set-Content -Path $seguroPath -Value $newContent -Encoding UTF8
      Write-Info "Actualizado client-id en $seguroPath"
    } else {
      Write-Warn "No se encontró parámetro client-id para reemplazar en $seguroPath"
    }
  } else {
    Write-Warn "No se detectó SDK de PayPal en $seguroPath; omito actualización de frontend"
  }
} else {
  Write-Warn "Archivo $seguroPath no existe; omito actualización de frontend"
}

# Instalar dependencias de funciones (opcional pero recomendado)
Write-Info "Instalando dependencias en ./functions (si corresponde)"
npm --prefix functions install
if ($LASTEXITCODE -ne 0) { Write-Warn "Instalación de dependencias en funciones falló; continuando con despliegue" }

# Despliegue
if ($HostingOnly -eq "true") {
  Write-Info "Desplegando SOLO Hosting"
  firebase deploy --only hosting --project $ProjectId
  if ($LASTEXITCODE -ne 0) { Write-Err "Deploy de Hosting falló"; exit 1 }
} else {
  Write-Info "Desplegando Functions y Hosting"
  firebase deploy --only functions --project $ProjectId
  if ($LASTEXITCODE -ne 0) { Write-Warn "Deploy de Functions falló o no hay funciones; intentando Hosting igualmente" }
  firebase deploy --only hosting --project $ProjectId
  if ($LASTEXITCODE -ne 0) { Write-Err "Deploy de Hosting falló"; exit 1 }
}

Write-Host "\n✅ Deploy completado. Verifica:" -ForegroundColor Green
Write-Host " - Hosting: https://$ProjectId.web.app" -ForegroundColor Green
Write-Host " - PayPal mode: $Mode" -ForegroundColor Green
Write-Host "\nSugerencias:" -ForegroundColor Cyan
Write-Host " - Si el frontend usa el SDK de PayPal, asegúrate de que el script tenga client-id correcto." -ForegroundColor Cyan
Write-Host " - Revisa Firebase Console → Functions para logs de integración con PayPal." -ForegroundColor Cyan

