#!/bin/sh
# All arguments are separate positional parameters; no eval or shell interpolation.
old_pid=$1; dest=$2; stage=$3; previous=$4; receipt=$5; result=$6; token=$7; timeout=${8:-60}
while kill -0 "$old_pid" 2>/dev/null; do sleep 1; done
if ! mv "$dest" "$previous"; then printf 'error:backup' > "$result"; exit 1; fi
if ! mv "$stage" "$dest"; then mv "$previous" "$dest"; printf 'error:replace' > "$result"; exit 1; fi
"$dest/Contents/MacOS/Nexo" >/dev/null 2>&1 &
new_pid=$!
count=0
while [ "$count" -lt "$timeout" ]; do
  if [ -f "$receipt" ] && [ "$(cat "$receipt")" = "$token" ]; then
    printf 'success' > "$result"; exit 0
  fi
  if ! kill -0 "$new_pid" 2>/dev/null; then break; fi
  sleep 1; count=$((count + 1))
done
kill -TERM "$new_pid" 2>/dev/null
sleep 2
if kill -0 "$new_pid" 2>/dev/null; then kill -KILL "$new_pid" 2>/dev/null; fi
failed="$dest.failed-$(date +%s)"
if mv "$dest" "$failed" && mv "$previous" "$dest"; then
  printf 'rolled-back' > "$result"
  /usr/bin/open "$dest"
else
  printf 'error:rollback' > "$result"
fi
