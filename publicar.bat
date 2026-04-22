@echo off
echo.
echo ========================================
echo   NOC VISOR - Publicando en GitHub...
echo ========================================
echo.

cd /d "C:\Users\Usuario\Documentos\web app DWDM\noc-visor"

echo Subiendo cambios...
call npm run deploy

echo.
echo ========================================
echo   Listo! Web actualizada en:
echo   https://isaacm10.github.io/noc-visor
echo ========================================
echo.
pause
