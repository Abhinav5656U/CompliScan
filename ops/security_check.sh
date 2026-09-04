#!/bin/sh
set -eu
echo "== Python dependency audit =="
python -m pip_audit -r backend/requirements.txt || true
echo "== Frontend dependency audit =="
(cd frontend && npm audit --omit=dev)
echo "== Secret scan =="
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --no-banner --redact
else
  echo "Install gitleaks to run the repository secret scan."
fi
echo "== Cloud / IaC misconfig scan =="
if command -v checkov >/dev/null 2>&1; then
  checkov -d . --compact
else
  echo "Install checkov to run the IaC scan."
fi
