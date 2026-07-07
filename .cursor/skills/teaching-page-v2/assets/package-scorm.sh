#!/usr/bin/env bash
# 将 SCORM 四件套打为 ZIP（imsmanifest.xml 在包根目录，供 LMS 导入）
set -euo pipefail

DIR="${1:?用法: package-scorm.sh <产出目录> [zip文件名]}"
NAME="${2:-$(basename "$(cd "$DIR" && pwd)")}"

cd "$DIR"

for f in index.html imsmanifest.xml scorm-api.js courseware-shell.js; do
  if [[ ! -f "$f" ]]; then
    echo "缺少文件: $DIR/$f" >&2
    exit 1
  fi
done

OUT="${NAME}.zip"
rm -f "$OUT"
# -j：压缩包内无目录层级，imsmanifest.xml 位于 ZIP 根
zip -j "$OUT" index.html imsmanifest.xml scorm-api.js courseware-shell.js
echo "已生成: $DIR/$OUT"
