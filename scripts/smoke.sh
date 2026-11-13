#!/usr/bin/env bash
# AnnexEvoice end-to-end smoke test.
#
# Expects running API (localhost:3000) and the Phase-D seed data applied
# (phone +2348012345001 is the Acme owner). Prints a check per probe; exits
# non-zero on the first failure. Requires: curl, jq, python3.
set -euo pipefail

API="${API:-http://localhost:3000}"
PHONE="${PHONE:-+2348012345001}"
WHATSAPP_VERIFY_TOKEN="${WHATSAPP_VERIFY_TOKEN:-dev-verify-token}"

pass() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; exit 1; }
check() {
  local name=$1 cond=$2
  if eval "$cond"; then pass "$name"; else fail "$name"; fi
}

echo "== 1. health =="
HEALTH=$(curl -sS "$API/v1/health")
check "/v1/health returns status=ok" "[ \"$(jq -r .status <<<"$HEALTH")\" = 'ok' ]"

READY=$(curl -sS "$API/v1/health/ready")
check "/v1/health/ready db=ok" "[ \"$(jq -r .checks.db <<<"$READY")\" = 'ok' ]"

echo "== 2. OTP auth =="
OTP_RESP=$(curl -sS -X POST "$API/v1/auth/otp/request" -H 'content-type: application/json' -d "{\"phone\":\"$PHONE\"}")
CODE=$(jq -r .devCode <<<"$OTP_RESP")
check "OTP dev code returned" "[ -n \"$CODE\" ]"

TOKEN_RESP=$(curl -sS -X POST "$API/v1/auth/otp/verify" -H 'content-type: application/json' -d "{\"phone\":\"$PHONE\",\"code\":\"$CODE\"}")
TOKEN=$(jq -r .accessToken <<<"$TOKEN_RESP")
check "JWT access token returned" "[ \"$TOKEN\" != 'null' ] && [ -n \"$TOKEN\" ]"

echo "== 3. tenants/me is Acme =="
ME=$(curl -sS -H "authorization: Bearer $TOKEN" "$API/v1/tenants/me")
check "GET /v1/tenants/me returns Acme" "jq -e '.legalName | test(\"Acme\")' <<<\"\$ME\" >/dev/null"

echo "== 4. create draft invoice =="
CUST=$(curl -sS -H "authorization: Bearer $TOKEN" "$API/v1/customers" | jq -r '.[0].id')
PAYLOAD=$(jq -n --arg c "$CUST" '{customerId:$c, lines:[{description:"smoke test item", unitPriceKobo:1000000, quantity:1}]}')
DRAFT=$(curl -sS -X POST -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d "$PAYLOAD" "$API/v1/invoices")
DRAFT_ID=$(jq -r .id <<<"$DRAFT")
VAT=$(jq -r .vatKobo <<<"$DRAFT")
check "draft invoice created" "[ -n \"$DRAFT_ID\" ] && [ \"$DRAFT_ID\" != 'null' ]"
check "VAT 7.5% of ₦10,000 = ₦750 = 75000 kobo" "[ \"$VAT\" = '75000' ]"

echo "== 5. issue invoice =="
ISSUE=$(curl -sS -X POST -H "authorization: Bearer $TOKEN" "$API/v1/invoices/$DRAFT_ID/issue")
STATUS=$(jq -r .status <<<"$ISSUE")
NUMBER=$(jq -r .number <<<"$ISSUE")
check "invoice status=PENDING_TRANSMISSION" "[ \"$STATUS\" = 'PENDING_TRANSMISSION' ]"
check "invoice number assigned" "echo \"$NUMBER\" | grep -qE 'INV-[0-9]+'"

echo "== 6. webhook signatures =="
BAD=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$API/v1/webhooks/paystack" \
  -H 'content-type: application/json' -H 'x-paystack-signature: 00deadbeef' \
  --data-binary '{"event":"charge.success","data":{}}')
check "Paystack bad signature → 400" "[ \"$BAD\" = '400' ]"

CHAL=$(curl -sS "$API/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=$WHATSAPP_VERIFY_TOKEN&hub.challenge=smoke123")
check "WhatsApp verify handshake returns challenge" "[ \"$CHAL\" = 'smoke123' ]"

echo
printf '\033[32mAll smoke checks passed.\033[0m\n'
