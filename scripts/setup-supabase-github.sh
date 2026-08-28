#!/usr/bin/env bash
# Run this on your computer (needs GitHub repo admin + gh CLI).
# It cannot be run from the cloud agent: GitHub Actions secrets require
# a token with secrets:write, and GitHub Integration requires a browser login.

set -euo pipefail

REPO="${REPO:-ubbimsupport/ubbim-crm}"
PROJECT_ID="${SUPABASE_PROJECT_ID:-fxsdcrihxxyavauhafdv}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Install GitHub CLI: https://cli.github.com/"
  exit 1
fi

echo "Setting GitHub Actions secrets on $REPO"
echo "Project ref: $PROJECT_ID"
echo

gh secret set SUPABASE_PROJECT_ID --repo "$REPO" --body "$PROJECT_ID"

if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  printf '%s' "$SUPABASE_ACCESS_TOKEN" | gh secret set SUPABASE_ACCESS_TOKEN --repo "$REPO"
else
  echo "Paste your Supabase access token (https://supabase.com/dashboard/account/tokens), then Enter:"
  gh secret set SUPABASE_ACCESS_TOKEN --repo "$REPO"
fi

if [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
  printf '%s' "$SUPABASE_DB_PASSWORD" | gh secret set SUPABASE_DB_PASSWORD --repo "$REPO"
else
  echo "Paste the database password from Project Settings → Database, then Enter:"
  gh secret set SUPABASE_DB_PASSWORD --repo "$REPO"
fi

echo
echo "Secrets saved."
echo "Still required in the browser: authorize GitHub on"
echo "https://supabase.com/dashboard/project/${PROJECT_ID}/settings/integrations"
