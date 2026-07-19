@echo off
cd /d "D:\Dashboard Portal\web"
echo === Building Next.js App ===
call npm run build
if errorlevel 1 (
    echo BUILD FAILED
    exit /b 1
)
echo === Build Complete ===
echo === Deploying to Firebase ===
call npx firebase deploy --only hosting
if errorlevel 1 (
    echo DEPLOY FAILED
    exit /b 1
)
echo === Deploy Complete ===
