#!/bin/bash

# Script de Deployment Automático para TuCitaSegura
# Ejecuta: ./deploy.sh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Deployment a Producción - TuCitaSegura"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones
print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# 1. Verificar Firebase CLI
echo "📦 Verificando Firebase CLI..."
if ! command -v firebase &> /dev/null; then
  print_error "Firebase CLI no está instalado"
  echo ""
  echo "Instala con: npm install -g firebase-tools"
  exit 1
fi

FIREBASE_VERSION=$(firebase --version)
print_success "Firebase CLI instalado (v$FIREBASE_VERSION)"
echo ""

# 2. Verificar autenticación
echo "🔐 Verificando autenticación..."
if ! firebase projects:list &> /dev/null; then
  print_error "No estás autenticado con Firebase"
  echo ""
  print_info "Ejecuta: firebase login"
  echo ""
  read -p "¿Quieres hacer login ahora? (y/n): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    firebase login
  else
    print_error "Deployment cancelado"
    exit 1
  fi
fi

print_success "Autenticado con Firebase"
echo ""

# 3. Verificar proyecto
echo "📂 Verificando proyecto..."
PROJECT_ID=$(cat .firebaserc 2>/dev/null | grep -o '"default"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
  print_error "No se pudo detectar el proyecto en .firebaserc"
  exit 1
fi

print_success "Proyecto: $PROJECT_ID"
echo ""

# 4. Verificar App Check está habilitado
echo "🔍 Verificando configuración de App Check..."
if grep -q "// TEMP DISABLED" webapp/register.html; then
  print_error "App Check está deshabilitado en algunos archivos"
  print_info "Ejecuta: ./scripts/enable-appcheck-imports.sh"
  exit 1
fi

print_success "App Check está habilitado"
echo ""

# 5. Preguntar confirmación
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Resumen del Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Proyecto:    $PROJECT_ID"
echo "Branch:      $(git branch --show-current)"
echo "Commit:      $(git rev-parse --short HEAD)"
echo "URL Destino: https://$PROJECT_ID.web.app"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "¿Continuar con el deployment? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  print_warning "Deployment cancelado por el usuario"
  exit 0
fi

echo ""

# 6. Deploy
echo "🚀 Iniciando deployment..."
echo ""

firebase deploy --only hosting --project "$PROJECT_ID"

DEPLOY_EXIT_CODE=$?

echo ""

# 7. Resultado
if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  print_success "DEPLOYMENT EXITOSO"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "🌐 URLs de Producción:"
  echo "   https://$PROJECT_ID.web.app"
  echo "   https://$PROJECT_ID.firebaseapp.com"
  echo ""
  echo "📝 Próximos Pasos:"
  echo "   1. Abre: https://$PROJECT_ID.web.app/webapp/register.html"
  echo "   2. Abre Console (F12) y verifica App Check se inicializa"
  echo "   3. Prueba registro de usuario"
  echo "   4. Verifica NO hay error 401"
  echo ""
  echo "🔗 Firebase Console:"
  echo "   https://console.firebase.google.com/project/$PROJECT_ID"
  echo ""
  print_success "Deployment completado correctamente!"
  echo ""
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  print_error "DEPLOYMENT FALLÓ"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  print_info "Verifica los errores arriba"
  echo ""
  echo "Comandos útiles para troubleshooting:"
  echo "   firebase login         - Re-autenticarse"
  echo "   firebase projects:list - Ver proyectos disponibles"
  echo "   firebase use $PROJECT_ID - Seleccionar proyecto"
  echo ""
  exit 1
fi
