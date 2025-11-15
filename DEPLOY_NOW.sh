#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEPLOYMENT AUTOMÁTICO - TuCitaSegura"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Este script hará el deploy automáticamente."
echo ""
echo "PASO 1: Login en Firebase..."
echo ""

firebase login --no-localhost

echo ""
echo "PASO 2: Haciendo deploy a producción..."
echo ""

firebase deploy --only hosting --project tuscitasseguras-2d1a6

if [ $? -eq 0 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ DEPLOY EXITOSO!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "🌐 Tu sitio está disponible en:"
  echo "   https://tuscitasseguras-2d1a6.web.app"
  echo ""
  echo "📝 PRÓXIMOS PASOS IMPORTANTES:"
  echo ""
  echo "1. Abre tu navegador en MODO INCÓGNITO:"
  echo "   - Presiona: Ctrl + Shift + N"
  echo ""
  echo "2. Ve a:"
  echo "   https://tuscitasseguras-2d1a6.web.app/webapp/register.html"
  echo ""
  echo "3. Prueba el registro de usuario"
  echo ""
  echo "4. ✅ Debería funcionar SIN error 401"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ ERROR EN DEPLOYMENT"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Por favor, copia el error de arriba y dímelo."
  echo ""
fi
