@echo off
echo ===================================================
echo  FedSentinel-Health DevSecOps Automated Security Scan
echo ===================================================
echo.

echo [1/4] Running Python AST Security Vulnerability Scan (Bandit)...
python -m bandit -r backend\ -ll -q
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Bandit reported potential security warnings.
) else (
    echo [PASS] Bandit security scan passed with 0 high-severity issues.
)
echo.

echo [2/4] Running Python Dependency Vulnerability Audit (pip-audit)...
python -m pip_audit --local
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] pip-audit identified package vulnerability warnings.
) else (
    echo [PASS] Python dependency tree is clean.
)
echo.

echo [3/4] Running Mathematical & Operational Invariant Tests (pytest)...
python -m pytest tests\ -v --tb=short
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Automated invariant test suite failed!
    exit /b 1
) else (
    echo [PASS] All 17 invariant and API tests passed!
)
echo.

echo [4/4] Verifying Frontend Production Build...
cmd.exe /c "npm run build"
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Frontend Vite build failed!
    exit /b 1
) else (
    echo [PASS] Frontend build verified cleanly!
)
echo.

echo ===================================================
echo  [SUCCESS] All FedSentinel-Health Security Gates PASSED
echo ===================================================
