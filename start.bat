@echo off
echo =======================================================
echo   FedSentinel - Zero-Trust Federated SecOps Control
echo =======================================================
echo.

set PYTHON_EXE=python
if exist ".\venv\Scripts\python.exe" (
    set PYTHON_EXE=".\venv\Scripts\python.exe"
)

echo [1/2] Starting FedSentinel FastAPI Backend on http://127.0.0.1:8000 ...
start "FedSentinel Backend (FastAPI)" %PYTHON_EXE% -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

echo [2/2] Starting FedSentinel Frontend on http://localhost:3000 ...
start "FedSentinel Frontend (Vite)" cmd.exe /c "npm run dev"

echo.
echo Opening FedSentinel Console in your default browser...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo FedSentinel services launched successfully!
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:3000
echo.
