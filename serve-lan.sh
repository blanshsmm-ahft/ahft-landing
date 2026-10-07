#!/bin/zsh
# Раздаёт собранный сайт (dist) по локальной сети на порту 4173.
# Доступ с телефона/планшета в той же WiFi: http://192.168.1.137:4173 (или http://MacBook-Pro-2.local:4173)
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"
lsof -ti:4173 | xargs kill -9 2>/dev/null
exec npm run preview -- --host --port 4173 --strictPort