#!/bin/bash
# =============================================================================
# TuCitaSegura - Script de Deploy a Firebase Hosting
# =============================================================================

set -e  # Exit on error

echo "🚀 Desplegando TuCitaSegura a Firebase Hosting..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =============================================================================
# 1. Verificar que Firebase CLI está instalado
# =============================================================================
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI no está instalado${NC}"
    echo ""
    echo "Instálalo con:"
    echo "  npm install -g firebase-tools"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Firebase CLI instalado${NC}"

# =============================================================================
# 2. Verificar autenticación
# =============================================================================
echo ""
echo "🔐 Verificando autenticación..."

if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  No estás autenticado en Firebase${NC}"
    echo ""
    echo "Ejecuta primero:"
    echo "  firebase login"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Autenticado correctamente${NC}"

# =============================================================================
# 3. Deploy (solo Hosting)
# =============================================================================
echo ""
echo -e "${YELLOW}📤 Desplegando a Firebase Hosting...${NC}"
echo ""

firebase deploy --only hosting

# =============================================================================
# 4. Mostrar URL
# =============================================================================
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ ¡Deploy completado exitosamente!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "🌐 Tu aplicación está disponible en:"
echo ""
echo "   https://tuscitasseguras-2d1a6.web.app"
echo "   https://tuscitasseguras-2d1a6.firebaseapp.com"
echo ""
