#!/usr/bin/env bash
# 课程游戏 SCORM 包：index.html + imsmanifest.xml + scorm-api.js
set -euo pipefail

DIR="${1:?用法: package-scorm-game.sh <产出目录> [zip文件名]}"
NAME="${2:-$(basename "$(cd "$DIR" && pwd)")}"

cd "$DIR"

for f in index.html imsmanifest.xml scorm-api.js; do
  if [[ ! -f "$f" ]]; then
    echo "缺少文件: $DIR/$f" >&2
    exit 1
  fi
done

OUT="${NAME}.zip"
rm -f "$OUT"
zip -j "$OUT" index.html imsmanifest.xml scorm-api.js
echo "已生成: $DIR/$OUT"
