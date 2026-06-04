# run-e2e.ps1 — Run E2E tests for ABDtenantGobernance on Windows
#
# Cleans up ports 3400 (ABDAuth) and 3500 (Gobernance), launches both dev servers,
# waits for them to respond, runs the Playwright tests, and cleans up both servers on exit.

$ErrorActionPreference = "Stop"

$AuthPort = 3400
$GovPort = 3500
$ProjectRoot = (Resolve-Path "$PSScriptRoot/..").Path
$ParentDir = (Resolve-Path "$ProjectRoot/..").Path
$AuthDir = (Resolve-Path "$ParentDir/ABDAuth").Path

Write-Host "=== Step 1: Cleanup ports $AuthPort (ABDAuth) and $GovPort (Gobernance) ==="
node "$ParentDir/ABDLogs/scripts/cleanup-port.mjs" $AuthPort
node "$ParentDir/ABDLogs/scripts/cleanup-port.mjs" $GovPort

$LogDir = "$ProjectRoot/test-results"
if (!(Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

$AuthLogFile = "$LogDir/abdauth-server.log"
$AuthErrLogFile = "$LogDir/abdauth-server-err.log"
if (Test-Path $AuthLogFile) { Remove-Item $AuthLogFile -Force -ErrorAction SilentlyContinue }
if (Test-Path $AuthErrLogFile) { Remove-Item $AuthErrLogFile -Force -ErrorAction SilentlyContinue }

$GovLogFile = "$LogDir/gobernance-server.log"
$GovErrLogFile = "$LogDir/gobernance-server-err.log"
if (Test-Path $GovLogFile) { Remove-Item $GovLogFile -Force -ErrorAction SilentlyContinue }
if (Test-Path $GovErrLogFile) { Remove-Item $GovErrLogFile -Force -ErrorAction SilentlyContinue }

Write-Host "=== Step 2: Start ABDAuth dev server on port $AuthPort ==="
$AuthProcess = Start-Process node -ArgumentList "node_modules/next/dist/bin/next dev -p $AuthPort --webpack" -WorkingDirectory $AuthDir -NoNewWindow -PassThru -RedirectStandardOutput $AuthLogFile -RedirectStandardError $AuthErrLogFile

$GovProcess = $null
$TestExitCode = 1

try {
    Write-Host "ABDAuth started with PID: $($AuthProcess.Id)"

    Write-Host "=== Step 3: Wait for ABDAuth to be ready ==="
    $AuthReady = $false
    for ($i = 1; $i -le 30; $i++) {
        try {
            $Response = Invoke-WebRequest -Uri "http://localhost:$AuthPort" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($Response -and $Response.StatusCode -ge 200 -and $Response.StatusCode -lt 500) {
                Write-Host "ABDAuth is ready after $($i * 2) seconds (HTTP $($Response.StatusCode))."
                $AuthReady = $true
                break
            }
        } catch {
            if ($_.Exception -and $_.Exception.Response) {
                $status = [int]$_.Exception.Response.StatusCode
                if ($status -ge 200 -and $status -lt 500) {
                    Write-Host "ABDAuth is ready after $($i * 2) seconds (HTTP $status)."
                    $AuthReady = $true
                    break
                }
            }
        }
        Start-Sleep -Seconds 2
    }

    if (-not $AuthReady) {
        Write-Host "Timeout waiting for ABDAuth to respond on port $AuthPort" -ForegroundColor Red
        if (Test-Path $AuthLogFile) { Get-Content $AuthLogFile -Tail 20 }
        throw "ABDAuth startup timed out."
    }

    Write-Host "=== Step 4: Start Gobernance dev server on port $GovPort ==="
    $GovProcess = Start-Process node -ArgumentList "node_modules/next/dist/bin/next dev -p $GovPort --webpack" -WorkingDirectory $ProjectRoot -NoNewWindow -PassThru -RedirectStandardOutput $GovLogFile -RedirectStandardError $GovErrLogFile
    Write-Host "Gobernance started with PID: $($GovProcess.Id)"

    Write-Host "=== Step 5: Wait for Gobernance to be ready ==="
    $GovReady = $false
    for ($i = 1; $i -le 30; $i++) {
        try {
            $Response = Invoke-WebRequest -Uri "http://localhost:$GovPort" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($Response -and $Response.StatusCode -ge 200 -and $Response.StatusCode -lt 500) {
                Write-Host "Gobernance is ready after $($i * 2) seconds (HTTP $($Response.StatusCode))."
                $GovReady = $true
                break
            }
        } catch {
            if ($_.Exception -and $_.Exception.Response) {
                $status = [int]$_.Exception.Response.StatusCode
                if ($status -ge 200 -and $status -lt 500) {
                    Write-Host "Gobernance is ready after $($i * 2) seconds (HTTP $status)."
                    $GovReady = $true
                    break
                }
            }
        }
        Start-Sleep -Seconds 2
    }

    if (-not $GovReady) {
        Write-Host "Timeout waiting for Gobernance to respond on port $GovPort" -ForegroundColor Red
        if (Test-Path $GovLogFile) { Get-Content $GovLogFile -Tail 20 }
        throw "Gobernance startup timed out."
    }

    Write-Host "=== Step 6: Run Playwright E2E tests ==="
    $env:ABDLOGS_SKIP_PORT_CLEANUP = "true"
    pnpm exec playwright test --reporter=list --retries 0 --workers 1
    $TestExitCode = $LASTEXITCODE

} finally {
    Write-Host "=== Step 7: Cleanup servers ==="
    if ($GovProcess -and -not $GovProcess.HasExited) {
        Write-Host "Stopping Gobernance dev server process PID $($GovProcess.Id)..."
        Stop-Process -Id $GovProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($AuthProcess -and -not $AuthProcess.HasExited) {
        Write-Host "Stopping ABDAuth dev server process PID $($AuthProcess.Id)..."
        Stop-Process -Id $AuthProcess.Id -Force -ErrorAction SilentlyContinue
    }
}

if ($TestExitCode -eq 0) {
    Write-Host "=== ALL TESTS PASSED ===" -ForegroundColor Green
    exit 0
} else {
    Write-Host "=== TESTS FAILED (Exit Code: $TestExitCode) ===" -ForegroundColor Red
    exit $TestExitCode
}
