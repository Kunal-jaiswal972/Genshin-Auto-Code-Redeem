#!/bin/sh
set -e

is_truthy() {
  case "$(echo "$1" | tr '[:upper:]' '[:lower:]')" in
    1 | true | yes | on) return 0 ;;
    *) return 1 ;;
  esac
}

if is_truthy "${CHROME_VNC_ENABLED:-false}"; then
  export DISPLAY=:99
  rm -f /tmp/.X99-lock

  Xvfb :99 -screen 0 1280x800x24 -ac +extension GLX +render -noreset &
  sleep 2

  x11vnc -display :99 -nopw -listen 0.0.0.0 -xkb -forever -shared -rfbport 5900 &
  echo "VNC ready on port 5900. From your PC: ssh -L 5900:127.0.0.1:5900 Combo-BOTS-VM@<vm-ip>"
  echo "Then connect a VNC viewer to localhost:5900 and solve the HoYoverse captcha during login."
fi

exec node dist/index.js
