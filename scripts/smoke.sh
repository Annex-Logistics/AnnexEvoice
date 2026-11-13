#!/usr/bin/env bash
# AnnexEvoice end-to-end smoke test.
#
# Expects running API (localhost:3000) and the Phase-D seed data applied
# (phone +2348012345001 is the Acme owner, promoted to ADMIN in Phase M).
# Prints a check per probe; exits non-zero on the first failure.
# Requires: curl, jq, python3.
set -euo pipefail

API="${API:-http://localhost:3000}"
PHONE="${PHONE:-+2348012345001}"
WHATSAPP_VERIFY_TOKEN="${WHATSAPP_VERIFY_TOKEN:-dev-verify-token}"

pass() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; exit 1; }
check() { local n=$1 c=$2; if eval "$c"; then pass "$n"; else fail "$n"; fi; }

echo "== 1. health =="
HEALTH=$(curl -sS "$API/v1/health")
check "/v1/health returns status=ok" "[ \"$(jq -r .status <<<"$HEALTH")\" = 'ok' ]"
READY=$(curl -sS "$API/v1/health/ready")
check "/v1/health/ready db=ok" "[ \"$(jq -r .checks.db <<<"$READY")\" = 'ok' ]"

echo "== 2. OTP auth =="
CODE=$(curl -sS -X POST "$API/v1/auth/otp/request" -H 'content-type: application/json' -d "{\"phone\":\"$PHONE\"}" | jq -r .devCode)
check "OTP dev code returned" "[ -n \"$CODE\" ]"
RESP=$(curl -sS -X POST "$API/v1/auth/otp/verify" -H 'content-type: application/json' -d "{\"phone\":\"$PHONE\",\"code\":\"$CODE\"}")
TOKEN=$(jq -r .accessToken <<<"$RESP")
check "JWT access token returned" "[ \"$TOKEN\" != 'null' ] && [ -n \"$TOKEN\" ]"

echo "== 3. tenants/me is Acme =="
ME=$(curl -sS -H "authorization: Bearer $TOKEN" "$API/v1/tenants/me")
check "GET /v1/tenants/me returns Acme" "jq -e '.legalName | test(\"Acme\")' <<<\"\$ME\" >/dev/null"

echo "== 4. create draft + VAT math =="
CUST=$(curl -sS -H "authorization: Bearer $TOKEN" "$API/v1/customers" | jq -r '.[0].id')
PAYLOAD=$(jq -n --arg c "$CUST" '{customerId:$c, lines:[{description:"smoke test item", unitPriceKobo:1000000, quantity:1}]}')
DRAFT=$(curl -sS -X POST -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d "$PAYLOAD" "$API/v1/invoices")
DRAFT_ID=$(jq -r .id <<<"$DRAFT")
check "draft invoice created" "[ \"$DRAFT_ID\" != 'null' ] && [ -n \"$DRAFT_ID\" ]"
check "VAT 7.5% of ₦10,000 = ₦750 (75000 kobo)" "[ \"$(jq -r .vatKobo <<<"$DRAFT")\" = '75000' ]"

echo "== 5. issue + number =="
ISSUE=$(curl -sS -X POST -H "authorization: Bearer $TOKEN" "$API/v1/invoices/$DRAFT_ID/issue")
check "invoice status=PENDING_TRANSMISSION" "[ \"$(jq -r .status <<<"$ISSUE")\" = 'PENDING_TRANSMISSION' ]"
check "invoice number assigned (INV-NNNNNN)" "jq -r .number <<<\"\$ISSUE\" | grep -qE 'INV-[0-9]{6}'"

echo "== 6. immutability =="
CANCEL=$(curl -sS -o /dev/null -w '%{http_code}' -X POST -H "authorization: Bearer $TOKEN" "$API/v1/invoices/$DRAFT_ID/cancel")
check "cancel non-draft invoice → 409" "[ \"$CANCEL\" = '409' ]"

echo "== 7. credit note against a transmitted invoice =="
PAID_ID=$(curl -sS -H "authorization: Bearer $TOKEN" "$API/v1/invoices" | jq -r '[.[] | select(.status=="TRANSMITTED" or .status=="PAID")][0].id')
if [ -n "$PAID_ID" ] && [ "$PAID_ID" != 'null' ]; then
  CN=$(curl -sS -X POST -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
    -d "{\"invoiceId\":\"$PAID_ID\",\"reason\":\"Smoke refund\",\"totalKobo\":10000}" \
    "$API/v1/credit-notes")
  check "credit note created with CN-NNNNNN number" "jq -r .number <<<\"\$CN\" | grep -qE 'CN-[0-9]{6}'"
  check "credit note PENDING_TRANSMISSION" "[ \"$(jq -r .status <<<"$CN")\" = 'PENDING_TRANSMISSION' ]"
  BAD=$(curl -sS -o /dev/null -w '%{http_code}' -X POST -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
    -d "{\"invoiceId\":\"$PAID_ID\",\"reason\":\"too big\",\"totalKobo\":999999999}" \
    "$API/v1/credit-notes")
  check "credit note > invoice total → 400" "[ \"$BAD\" = '400' ]"
else
  pass "skipping credit note (no transmitted invoice yet)"
fi

echo "== 8. public API via x-api-key =="
KEY=$(curl -sS -X POST -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"name":"smoke"}' "$API/v1/api-keys" | jq -r .plaintext)
check "api key returned (anvx_...)" "echo \"$KEY\" | grep -qE '^anvx_'"
LIST=$(curl -sS -H "x-api-key: $KEY" "$API/v1/public/invoices")
check "public API list invoices works" "jq -e 'type == \"array\"' <<<\"\$LIST\" >/dev/null"
BAD=$(curl -sS -o /dev/null -w '%{http_code}' -H "x-api-key: nope" "$API/v1/public/invoices")
check "bad api key → 401" "[ \"$BAD\" = '401' ]"

echo "== 9. admin cross-tenant =="
TENANTS=$(curl -sS -H "authorization: Bearer $TOKEN" "$API/v1/admin/tenants")
check "admin sees both tenants (>= 2)" "[ \"$(jq 'length' <<<"$TENANTS")\" -ge 2 ]"
HEALTH=$(curl -sS -H "authorization: Bearer $TOKEN" "$API/v1/admin/integrations/health")
check "admin integrations/health returns tenants count" "jq -e '.tenants >= 2' <<<\"\$HEALTH\" >/dev/null"

echo "== 10. webhook signatures =="
BAD=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$API/v1/webhooks/paystack" \
  -H 'content-type: application/json' -H 'x-paystack-signature: 00deadbeef' \
  --data-binary '{"event":"charge.success","data":{}}')
check "Paystack bad signature → 400" "[ \"$BAD\" = '400' ]"
CHAL=$(curl -sS "$API/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=$WHATSAPP_VERIFY_TOKEN&hub.challenge=smoke123")
check "WhatsApp verify handshake returns challenge" "[ \"$CHAL\" = 'smoke123' ]"

echo
printf '\033[32mAll smoke checks passed.\033[0m\n'
