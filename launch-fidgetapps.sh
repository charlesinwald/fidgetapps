#!/bin/bash
export GDK_BACKEND=x11
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export LIBGL_ALWAYS_SOFTWARE=1
exec "$(dirname "$0")/src-tauri/target/release/fidgetapps" "$@" 