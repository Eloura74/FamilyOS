@echo off
echo ===================================================
echo   FamilyOS Mobile Deployer
echo ===================================================

REM 1. Configuration de l'environnement
set "JAVA_HOME=A:\Logiciels\Android_studio\App\jbr"

echo [1/2] Configuration de JAVA_HOME...
echo JAVA_HOME defini sur: %JAVA_HOME%

REM 2. Lancement de Capacitor
echo [2/2] Construction et lancement sur le telephone...
cd frontend
call npx cap sync
call npx cap run android
