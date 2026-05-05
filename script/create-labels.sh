#!/bin/bash
# create-labels.sh

set -e

REPOS=(
  "HERUESTA/github_actions_playground"
  "HERUESTA/store"
  "HERUESTA/read_book"
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