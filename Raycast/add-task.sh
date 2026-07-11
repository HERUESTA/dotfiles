#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Add Task
# @raycast.mode compact

# Optional parameters:
# @raycast.icon ✅
# @raycast.packageName Taskwarrior
# @raycast.argument1 { "type": "text", "placeholder": "説明 (project:xxx due:xxx +tag もOK)" }

# Documentation:
# @raycast.description Taskwarrior にタスクを追加する
# @raycast.author HERUESTA

export PATH="/opt/homebrew/bin:$PATH"

set -f # glob展開を無効化 (+tag や * を安全に渡すため)

# クォートせず単語分割させることで project:xxx などの修飾子も解釈される
task rc.confirmation=off add $1
