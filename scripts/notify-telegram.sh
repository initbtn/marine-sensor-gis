#!/usr/bin/env bash
# Marine Sensor GIS — Telegram Alert Tool
# Usage: ./scripts/notify-telegram.sh <LEVEL: INFO|WARNING|CRITICAL> <AREA> <MESSAGE> [DETAILS]
# Example: ./scripts/notify-telegram.sh CRITICAL "EdgeStream" "GCP 10Hz connection timed out" "retry=3"

set -euo pipefail

LEVEL="${1:-INFO}"
AREA="${2:-System}"
MESSAGE="${3:-Notification}"
DETAILS="${4:-}"
PROJECT="marine-sensor-gis (선박 친환경 설비 GIS 관제)"
ENV_NAME="${NODE_ENV:-PROD}"

BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${TELEGRAM_CHAT_ID:-}"

if [[ -z "$BOT_TOKEN" ]]; then
  if command -v pass >/dev/null 2>&1; then
    BOT_TOKEN="$(pass show telegram/bot-token 2>/dev/null || true)"
  fi
fi

if [[ -z "$CHAT_ID" ]]; then
  if command -v pass >/dev/null 2>&1; then
    CHAT_ID="$(pass show telegram/chat-id 2>/dev/null || true)"
  fi
fi

if [[ -z "$BOT_TOKEN" || -z "$CHAT_ID" ]]; then
  echo "WARN: [marine-sensor-gis] Telegram credentials not configured in env or pass. Alert omitted." >&2
  exit 0
fi

case "$LEVEL" in
  CRITICAL) ICON="🚨" ;;
  WARNING)  ICON="⚠️" ;;
  *)        ICON="ℹ️" ;;
esac

escape_html() {
  local str="$1"
  str="${str//&/&amp;}"
  str="${str//</&lt;}"
  str="${str//>/&gt;}"
  echo "$str"
}

ESC_LEVEL="$(escape_html "$LEVEL")"
ESC_ENV="$(escape_html "$ENV_NAME")"
ESC_AREA="$(escape_html "$AREA")"
ESC_MSG="$(escape_html "$MESSAGE")"
TIME="$(date '+%Y-%m-%d %H:%M:%S KST')"

TEXT="${ICON} [marine-sensor-gis] [${ESC_LEVEL}] (${ESC_ENV})
━━━━━━━━━━━━━━━━━━━━
• 프로젝트: ${PROJECT}
• 감지 영역: ${ESC_AREA}
• 발생 시각: ${TIME}
• 상세 내용: ${ESC_MSG}"

if [[ -n "$DETAILS" ]]; then
  ESC_DET="$(escape_html "$DETAILS")"
  TEXT="${TEXT}
• 부가 정보: ${ESC_DET}"
fi

TEXT="${TEXT}
━━━━━━━━━━━━━━━━━━━━"

# Post to Telegram Bot API
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\": \"${CHAT_ID}\", \"text\": $(printf '%s' "$TEXT" | jq -Rs .), \"parse_mode\": \"HTML\"}" > /dev/null || true
