# AGENTS.md

個人の dotfiles。複数の PC で `git pull` して同じ設定を使う。

## 設定ファイル

- 各設定ファイルは、ツールが読む場所からこのリポジトリへのシンボリックリンクで使われている。リポジトリ内のファイルを編集すると、その PC の設定に即座に反映される。
- リンク方法は各ファイル先頭のコメントに書く。新しい設定ファイルを追加するときも同じようにコメントで残す。

## Claude Code の skill

新しい skill は `~/.claude/skills/` に直接置かず、次の手順で作る。

1. `.claude/skills/<名前>/SKILL.md` を作る
2. リポジトリの中で `ln -sfn "$(git rev-parse --show-toplevel)/.claude/skills/<名前>" ~/.claude/skills/<名前>` を実行する
3. README.md の「Claude Code の skill」節に、その skill の `ln -sfn` 行と一覧の行を追記する

`~/.claude/skills/<名前>` に実体のディレクトリが既にある skill を移すときは、先に `mv` でこのリポジトリへ移してから `ln -sfn` する（実体のディレクトリがあると `ln -sfn` はその中にリンクを作るため）。

## コミット

形式は `<絵文字> <type>: <件名>`。絵文字と type は `.claude/skills/commit-coach/SKILL.md` の「gitmoji 採用セット」に従う。件名は日本語で、結果の形（「〜する」「〜を追加」）で書く。
