# dotfiles
様々な設定ファイル詰め込み用

## セットアップ

設定ファイルは各ツールが読む場所へシンボリックリンクして使う。リンク方法は各ファイル先頭のコメントに書いてある（例: `nvim/site/plugin/filetypes.lua`）。

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

## cmux のサイドバー

カスタムサイドバーは `cmux/sidebars/` に置いている。`cmux/` ごと `~/.config/cmux` にリンクしているため、追加のリンクは不要で、`git pull` すれば cmux のサイドバー切り替えボタンの右クリックメニューに出る。ファイルを保存するとその場で再読み込みされる。

| サイドバー | 内容 |
|---|---|
| [gtd](cmux/sidebars/gtd.js) | ワークスペースを1タスクとして GTD 形式で並べる。分類は description のタグ（`@now` `@next` `@waiting` `@someday` `@done`、タグなしは INBOX）。カードの右クリックで振り分けられ、振り分けたカードは状態にかかわらずそのセクションに残る（入力待ちは点の色と本文で分かる）。タグなしのカードだけ、エージェントの入力待ちや未読は INBOX の先頭、実行中・レビュー中は「待ち」、PR が merge されたら「完了」に自動で置く。`cmux sidebar select gtd` で表示する。`.js` に対応していない cmux 用に同じ内容の `gtd.swift` も置いている（検索・開閉・絞り込みはなし）。両方あるときは cmux が `.js` を優先する |

## Claude Code の mod

mod は `.claude/mods/<名前>/` にディレクトリ単位で置いている。`.zshrc` が `.claude/mods/` 以下をすべて `CLAUDE_CODE_PLUGIN_DIRS` に入れるため、リンクを張る必要はない。新しいシェルで Claude Code を起動すれば読み込まれ、起動中も mod のファイルを編集すると読み直される。

### mod 一覧

| mod | 内容 |
|---|---|
| [peek-spinner](.claude/mods/peek-spinner) | スピナーの横に、ゴミ箱から顔を出すドット絵を出す。返答ごとに4つの動き（ぷるぷる・きょろきょろ・ガタガタ・ちらっ）から前回と違うものをランダムで選ぶ。返答を始める時点でコンテキストの使用率が80%以上なら「あせあせ」になる（`/compact` の目安）。`claude plugin test .claude/mods/peek-spinner` でテストできる |
