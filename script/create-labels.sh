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
  "sample1|7057ff|sample1用ラベル" # ラベル名 | カラー | description
  "sample2|d876e3|sample2用ラベル"
  "sample3|fbca04|sample3用ラベル"
)

for REPO in "${REPOS[@]}"; do
  echo "=== $REPO ==="
  for LABEL in "${LABELS[@]}"; do
    IFS='|' read -r NAME COLOR DESC <<< "$LABEL"
    gh label create "$NAME" --color "$COLOR" --description "$DESC" --repo "$REPO" --force
  done
done

echo "完了しました"