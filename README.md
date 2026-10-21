# dotfiles
様々な設定ファイル詰め込み用

## セットアップ

設定ファイルは各ツールが読む場所へシンボリックリンクして使う。リンク方法は各ファイル先頭のコメントに書いてある（例: `vscode/settings.json`、`nvim/site/plugin/filetypes.lua`）。

更新は `git pull` だけでよい（リンク先の実体が更新される）。

## Claude Code の skill

skill は `.claude/skills/<名前>/` にディレクトリ単位で置いている。個人用 skill として `~/.claude/skills/` にシンボリックリンクすると、`git pull` だけで更新が反映される。

### リンクする（初回・他の PC）

```sh
# dotfiles の中で実行
mkdir -p ~/.claude/skills

REPO="$(git rev-parse --show-toplevel)"
ln -sfn "$REPO/.claude/skills/commit-coach" ~/.claude/skills/commit-coach
```

`ls -la ~/.claude/skills/` で、各 skill が dotfiles を指すリンクになっていれば完了。Claude Code を起動し直すと `/<skill名>` で呼べる。

### skill を追加する

dotfiles で Claude Code を起動して「〇〇の skill を作って」と頼めば、`AGENTS.md` に従って 1〜3 を行う。手で行う場合:

1. `.claude/skills/<名前>/SKILL.md` を作る
2. リンクを張る

   ```sh
   ln -sfn "$(git rev-parse --show-toplevel)/.claude/skills/<名前>" ~/.claude/skills/<名前>
   ```

   `~/.claude/skills/<名前>` に実体のディレクトリが既にある skill を移すときは、先に `mv` で dotfiles へ移してから実行する（実体のディレクトリがあると、その中にリンクが作られてしまう）。

3. この README の「リンクする」のコマンドに `ln -sfn` の行を、下の表に skill の行を足す
4. コミットして push する
5. 他の PC では `git pull` して、増えた `ln -sfn` の行を実行する

### skill を更新する

SKILL.md を編集するだけでよい（リンク先の実体を編集しているため即座に反映される）。他の PC では `git pull` だけでよい。

### skill 一覧

| skill | 使うとき |
|---|---|
| [commit-coach](.claude/skills/commit-coach) | コミットするとき。`/commit-coach <自分で考えたメッセージの下書き>` で下書きを添削してコミットする。絵文字と type の付け方は SKILL.md の「gitmoji 採用セット」を参照 |
