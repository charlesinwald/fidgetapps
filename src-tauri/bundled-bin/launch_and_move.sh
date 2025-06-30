#!/bin/sh
# Usage: launch_and_move.sh <command>

# Find the largest display using xrandr
largest=$(xrandr | grep ' connected' | awk '{print $3}' | grep -oE '^[0-9]+x[0-9]+\+[0-9]+\+[0-9]+' | awk -F '[x+]' '{print $1*$2 " "$3 " "$4}' | sort -nr | head -n1)
read width height x y <<EOF
$largest
EOF

# Get the list of windows before launching
before=$(xdotool search --onlyvisible --name ".*")

# Launch the app in the background
"$@" &
app_pid=$!

# Wait for a new window to appear (up to 5 seconds)
for i in $(seq 1 10); do
  sleep 0.5
  after=$(xdotool search --onlyvisible --name ".*")
  window_id=$(comm -13 <(echo "$before" | sort) <(echo "$after" | sort) | head -n1)
  if [ -n "$window_id" ]; then
    xdotool windowmove "$window_id" "$x" "$y"
    exit 0
  fi
done

echo "No new window detected."
exit 1 