@echo off
cd /d "C:\Users\jmv19\Desktop\Portal-Eventos"

REM Ejecutar Node.js directamente sin PowerShell
echo Ejecutando insercion de evento...
node ejecutar.js

REM Git commit
echo.
echo Haciendo commit...
git add app.js insertar-evento-manual.js ejecutar.js
git commit -m "Chore: eliminar audio, actualizar imagen a fuente oficial femturisme.cat"
git push

echo.
echo ✅ Listo! Recarga la pagina en https://plandem-portal-eventos.onrender.com
