#!/usr/bin/env bash
#
# run-e2e.sh — Run ABDtenantGobernance E2E tests
#
# El test confirm-dialog.spec.ts requiere ABDAuth (puerto 3400) para
# autenticación previa. Este script arranca ambos servidores:
#   ABDAuth     :3400  (infraestructura — login)
#   Gobernance  :3500  (app bajo test)
#
# Flujo:
#   1. Limpia puertos 3400 y 3500
#   2. Arranca ABDAuth (dev server en 3400)
#   3. Arranca Gobernance (dev server en 3500)
#   4. Ejecuta los tests E2E de Playwright
#   5. Mata ambos servidores

set -e

cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
PARENT_DIR="$(cd .. && pwd)"

echo "=== Step 1: Cleanup ports 3400 (ABDAuth) and 3500 (Gobernance) ==="
node "$PARENT_DIR/ABDLogs/scripts/cleanup-port.mjs" 3400 2>/dev/null || true
node "$PARENT_DIR/ABDLogs/scripts/cleanup-port.mjs" 3500 2>/dev/null || true

echo "=== Step 2: Start ABDAuth dev server (port 3400) ==="
cd "$PARENT_DIR/ABDAuth"
node node_modules/next/dist/bin/next dev -p 3400 --webpack &>/tmp/abdauth-server.log &
AUTH_PID=$!
echo "ABDAuth PID: $AUTH_PID"

echo "=== Step 3: Wait for ABDAuth to be ready ==="
for i in $(seq 1 60); do
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3400 2>/dev/null || echo "000")
  if echo "$HTTP_CODE" | grep -qE '2|3'; then
    echo "AUTH_READY after ${i}s (HTTP $HTTP_CODE)"
    break
  fi
  if [ $i -eq 60 ]; then
    echo "AUTH_TIMEOUT after 60s"
    tail -20 /tmp/abdauth-server.log
    kill $AUTH_PID 2>/dev/null
    exit 1
  fi
  sleep 2
done

echo "=== Step 4: Start Gobernance dev server (port 3500) ==="
cd "$PROJECT_ROOT"
node node_modules/next/dist/bin/next dev -p 3500 --webpack &>/tmp/gobernance-server.log &
GOV_PID=$!
echo "Gobernance PID: $GOV_PID"

# Trap para limpiar ambos servidores
cleanup() {
  echo ""
  echo "=== Cleanup: Stopping servers ==="
  kill $GOV_PID 2>/dev/null
  kill $AUTH_PID 2>/dev/null
  echo "Servers stopped."
}
trap cleanup EXIT INT TERM

echo "=== Step 5: Wait for Gobernance to be ready ==="
for i in $(seq 1 60); do
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3500 2>/dev/null || echo "000")
  if echo "$HTTP_CODE" | grep -qE '2|3'; then
    echo "GOV_READY after ${i}s (HTTP $HTTP_CODE)"
    break
  fi
  if [ $i -eq 60 ]; then
    echo "GOV_TIMEOUT after 60s"
    tail -20 /tmp/gobernance-server.log
    kill $GOV_PID 2>/dev/null
    kill $AUTH_PID 2>/dev/null
    exit 1
  fi
  sleep 2
done

echo "=== Step 6: Run Playwright E2E tests ==="
# Indicar a globalSetup.ts que no mate puertos (servidores ya están corriendo)
export ABDLOGS_SKIP_PORT_CLEANUP=true
timeout 600 node node_modules/@playwright/test/cli.js test --reporter=list --retries 0 --workers 1 2>&1
TEST_EXIT=$?

echo "=== Step 7: Cleanup servers ==="
kill $GOV_PID 2>/dev/null
kill $AUTH_PID 2>/dev/null

if [ $TEST_EXIT -eq 0 ]; then
  echo "=== ALL TESTS PASSED ==="
else
  echo "=== TESTS FAILED (exit: $TEST_EXIT) ==="
fi

exit $TEST_EXIT
