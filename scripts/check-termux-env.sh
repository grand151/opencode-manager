#!/data/data/com.termux/files/usr/bin/bash

echo "🔍 OpenCode Manager - Termux Environment Check"
echo "=============================================="
echo ""

SUCCESS=0
WARNINGS=0
ERRORS=0

check_command() {
  if command -v "$1" &> /dev/null; then
    echo "✅ $1 is installed"
    SUCCESS=$((SUCCESS + 1))
    if [ -n "$2" ]; then
      VERSION=$($1 $2 2>&1 | head -1)
      echo "   Version: $VERSION"
    fi
    return 0
  else
    echo "❌ $1 is NOT installed"
    ERRORS=$((ERRORS + 1))
    return 1
  fi
}

check_optional() {
  if command -v "$1" &> /dev/null; then
    echo "✅ $1 is installed (optional)"
    SUCCESS=$((SUCCESS + 1))
    return 0
  else
    echo "⚠️  $1 is NOT installed (optional)"
    WARNINGS=$((WARNINGS + 1))
    return 1
  fi
}

check_directory() {
  if [ -d "$1" ]; then
    echo "✅ Directory exists: $1"
    SUCCESS=$((SUCCESS + 1))
    return 0
  else
    echo "❌ Directory missing: $1"
    ERRORS=$((ERRORS + 1))
    return 1
  fi
}

check_file() {
  if [ -f "$1" ]; then
    echo "✅ File exists: $1"
    SUCCESS=$((SUCCESS + 1))
    return 0
  else
    echo "❌ File missing: $1"
    ERRORS=$((ERRORS + 1))
    return 1
  fi
}

echo "📋 Checking Termux Environment..."
if [ ! -d "$PREFIX" ]; then
  echo "❌ Not running in Termux environment"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Running in Termux"
  SUCCESS=$((SUCCESS + 1))
fi
echo ""

echo "📋 Checking Required Commands..."
check_command "node" "--version"
check_command "npm" "--version"
check_command "pnpm" "--version"
check_command "git" "--version"
echo ""

echo "📋 Checking Optional Commands..."
check_optional "bun" "--version"
check_optional "opencode" "--version"
echo ""

echo "📋 Checking Project Structure..."
check_directory "./backend"
check_directory "./frontend"
check_directory "./shared"
check_directory "./scripts"
check_directory "./workspace"
check_directory "./data"
echo ""

echo "📋 Checking Configuration Files..."
check_file "./package.json"
check_file "./pnpm-workspace.yaml"
check_file "./.env"
check_file "./backend/package.json"
check_file "./frontend/package.json"
echo ""

echo "📋 Checking Dependencies..."
if [ -d "./node_modules" ]; then
  echo "✅ Root node_modules exists"
  SUCCESS=$((SUCCESS + 1))
else
  echo "❌ Root node_modules missing - run 'pnpm install'"
  ERRORS=$((ERRORS + 1))
fi

if [ -d "./backend/node_modules" ]; then
  echo "✅ Backend node_modules exists"
  SUCCESS=$((SUCCESS + 1))
else
  echo "❌ Backend node_modules missing - run 'pnpm install'"
  ERRORS=$((ERRORS + 1))
fi

if [ -d "./frontend/node_modules" ]; then
  echo "✅ Frontend node_modules exists"
  SUCCESS=$((SUCCESS + 1))
else
  echo "❌ Frontend node_modules missing - run 'pnpm install'"
  ERRORS=$((ERRORS + 1))
fi
echo ""

echo "📋 Checking Port Availability..."
if command -v lsof &> /dev/null; then
  if lsof -i :5001 &> /dev/null; then
    echo "⚠️  Port 5001 is already in use"
    WARNINGS=$((WARNINGS + 1))
  else
    echo "✅ Port 5001 is available"
    SUCCESS=$((SUCCESS + 1))
  fi
  
  if lsof -i :5173 &> /dev/null; then
    echo "⚠️  Port 5173 is already in use"
    WARNINGS=$((WARNINGS + 1))
  else
    echo "✅ Port 5173 is available"
    SUCCESS=$((SUCCESS + 1))
  fi
else
  echo "⚠️  lsof not installed, cannot check port availability"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo "📊 Summary"
echo "=========="
echo "✅ Success: $SUCCESS"
echo "⚠️  Warnings: $WARNINGS"
echo "❌ Errors: $ERRORS"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo "🎉 Environment check passed!"
  echo ""
  echo "You can now start OpenCode Manager with:"
  echo "  pnpm dev:termux"
  exit 0
else
  echo "❌ Environment check failed with $ERRORS error(s)"
  echo ""
  echo "Please fix the errors above and run this check again."
  echo ""
  if [ ! -d "./node_modules" ] || [ ! -d "./backend/node_modules" ] || [ ! -d "./frontend/node_modules" ]; then
    echo "💡 Hint: Run 'bash scripts/setup-termux.sh' to set up the environment"
  fi
  exit 1
fi
