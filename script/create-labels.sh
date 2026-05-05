#!/bin/bash
# create-labels.sh

# 使用方法
# chmod +x create-labels.sh で実行権限付与
# ./create-labels.sh で実行

set -e

REPOS=(
  "owner/repo1"
  "owner/repo2"
  "owner/repo3"
)

LABELS=(
  "AI仕様調査|7057ff|claudeの仕様調査用ラベル"
  "AIログ調査|d876e3|claudeのログ調査用ラベル"
  "AIコード調査|fbca04|claudeのコード調査用ラベル"
)

for REPO in "${REPOS[@]}"; do
  echo "=== $REPO ==="
  for LABEL in "${LABELS[@]}"; do
    IFS='|' read -r NAME COLOR DESC <<< "$LABEL"
    gh label create "$NAME" --color "$COLOR" --description "$DESC" --repo "$REPO" --force
  done
done

echo "完了しました"