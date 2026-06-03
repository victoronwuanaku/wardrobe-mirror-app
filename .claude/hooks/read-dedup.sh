#!/usr/bin/env bash
# Claude Code PreToolUse hook: warn on redundant Read calls within a session.
# Never blocks. Always exits 0. Writes warnings to stderr.

set -u

INPUT="$(cat)"

TOOL_NAME=$(printf '%s' "$INPUT" | jq -r '.tool_name // ""')
[ "$TOOL_NAME" = "Read" ] || exit 0

FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // ""')
[ -n "$FILE_PATH" ] || exit 0
[ -f "$FILE_PATH" ] || exit 0

OFFSET=$(printf '%s' "$INPUT" | jq -r '.tool_input.offset // empty')
LIMIT=$(printf '%s' "$INPUT" | jq -r '.tool_input.limit // empty')
if [ -n "$OFFSET" ] || [ -n "$LIMIT" ]; then
  exit 0
fi

SESSION_ID=$(printf '%s' "$INPUT" | jq -r '.session_id // "unknown"')
STATE_FILE="/tmp/claude-read-dedup-${SESSION_ID}.tsv"
[ -f "$STATE_FILE" ] || : > "$STATE_FILE"

CURRENT_HASH=$(sha256sum "$FILE_PATH" 2>/dev/null | awk '{print $1}')
[ -n "$CURRENT_HASH" ] || exit 0
NOW_EPOCH=$(date +%s)

PRIOR_LINE=$(awk -F'\t' -v p="$FILE_PATH" '$2 == p {last=$0} END {print last}' "$STATE_FILE")

if [ -n "$PRIOR_LINE" ]; then
  PRIOR_EPOCH=$(printf '%s' "$PRIOR_LINE" | awk -F'\t' '{print $1}')
  PRIOR_HASH=$(printf '%s' "$PRIOR_LINE" | awk -F'\t' '{print $3}')

  if [ "$PRIOR_HASH" = "$CURRENT_HASH" ]; then
    DELTA=$(( NOW_EPOCH - PRIOR_EPOCH ))
    if [ "$DELTA" -lt 60 ]; then
      AGO="under a minute ago"
    else
      MINUTES=$(( DELTA / 60 ))
      AGO="${MINUTES} minute(s) ago"
    fi

    BASENAME=$(basename "$FILE_PATH")
    AGENTS_MD="${CLAUDE_PROJECT_DIR:-$(pwd)}/AGENTS.md"
    HINT=""
    if [ -f "$AGENTS_MD" ] && grep -qF "$BASENAME" "$AGENTS_MD"; then
      HINT=$'\n[read-dedup] AGENTS.md summarizes '"$BASENAME"$'. Re-read only to make an edit.'
    fi

    {
      printf '[read-dedup] %s was read %s and its content is unchanged.\n' "$BASENAME" "$AGO"
      printf '[read-dedup] Re-reading costs tokens. Consult AGENTS.md / CLAUDE.md if you only need architectural facts.%s\n' "$HINT"
    } >&2
  fi
fi

printf '%s\t%s\t%s\n' "$NOW_EPOCH" "$FILE_PATH" "$CURRENT_HASH" >> "$STATE_FILE"
exit 0
