#!/bin/sh
largest=$(xrandr | grep ' connected' | awk '{print $3}' | grep -oE '^[0-9]+x[0-9]+\+[0-9]+\+[0-9]+' | awk -F '[x+]' '{print $1*$2 " "$3 " "$4}' | sort -nr | head -n1)
read width height x y <<EOF
$largest
EOF

# Get the list of windows before launching
before=$(xdotool search --onlyvisible --name ".*")

# (Launch your app here, or do this from Rust and then sleep a bit)

# Wait a bit for the new window to appear
sleep 3

# Get the list of windows after launching
after=$(xdotool search --onlyvisible --name ".*")

# Find the new window
window_id=$(comm -13 <(echo "$before" | sort) <(echo "$after" | sort) | head -n1)

if [ -n "$window_id" ]; then
  xdotool windowmove "$window_id" "$x" "$y"
fi