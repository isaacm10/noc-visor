@echo off
echo.
echo ========================================
echo   NOC VISOR - Actualizando proyecto...
echo ========================================
echo.

cd /d "C:\Users\Usuario\Documentos\web app DWDM\noc-visor"

echo [1/3] Compilando React...
call npm run build
if errorlevel 1 ( echo ERROR en build & pause & exit )

echo.
echo [2/3] Sincronizando con Android...
call npx cap sync android
if errorlevel 1 ( echo ERROR en sync & pause & exit )

echo.
echo [3/3] Abriendo Android Studio...
call npx cap open android

echo.
echo ========================================
echo   Listo! Genera el APK en Android Studio:
echo   Build ^> Generate App Bundles or APKs
echo            ^> Generate APKs
echo ========================================
echo.
pause
