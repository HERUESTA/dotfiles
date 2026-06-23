# lazy-git.nvim から cz-git (czg) を使う

Neovim から `lazy-git.nvim`（実体は `kdheepak/lazygit.nvim`）で lazygit を開き、lazygit の files view で `c` キーを押すと `czg emoji` を起動して Conventional Commits 形式のコミットメッセージを対話形式で作成できるようにするためのセットアップ。

ターミナルから直接 `czg` を使う場合は [`commit.md`](./commit.md) を参照。

## 1. lazygit CLI をインストール

```bash
brew install lazygit
```

`lazy-git.nvim` は Neovim から lazygit CLI を起動するプラグインなので、先に `lazygit` コマンドが使える状態にしておく。

## 2. lazy-git.nvim を追加

この dotfiles では `nvim/lua/plugins/lazygit.lua` で `kdheepak/lazygit.nvim` を lazy.nvim に追加している。

```lua
return {
  {
    "kdheepak/lazygit.nvim",
    cmd = {
      "LazyGit",
      "LazyGitConfig",
      "LazyGitCurrentFile",
      "LazyGitFilter",
    },
    dependencies = {
      "nvim-lua/plenary.nvim",
    },
    keys = {
      {
        "<leader>gg",
        "<cmd>LazyGit<CR>",
        desc = "LazyGitを開く",
      },
      {
        "<leader>gf",
        "<cmd>LazyGitCurrentFile<CR>",
        desc = "現在のファイルでLazyGitを開く",
      },
    },
  },
}
```

Neovim 起動後、次のどちらかで lazygit を開ける。

```vim
:LazyGit
```

または:

```text
<leader>gg
```

## 3. czg / cz-git をグローバルインストール

```bash
npm install -g czg cz-git
```

この dotfiles の `.zshrc` では、Node.js とグローバル npm モジュールを参照するために次の設定を追加済み。

```bash
export PATH="$(brew --prefix node@22)/bin:$PATH"
export NODE_PATH="$(npm root -g)"
```

反映されていない場合は、ターミナルを開き直すか次を実行する。

```bash
source ~/.zshrc
```

## 4. lazygit の設定を配置

このリポジトリの `lazygit/config.yml` には、`c` キーで `czg emoji` を起動する custom command を定義している。

```yaml
customCommands:
  - key: 'c'
    context: 'files'
    description: 'cz-git (czg) でコミットメッセージを生成'
    command: 'czg emoji'
    output: terminal
```

lazygit の設定ファイルの参照先は、macOS では `~/Library/Application Support/lazygit/config.yml` になることがある。環境によって変わるため、`lazygit -cd` で設定ディレクトリを確認してから `config.yml` だけを symlink する。

このディレクトリには lazygit が自動生成する `state.yml` も同居するため、ディレクトリ全体ではなく `config.yml` ファイル単体をリンクする。

```bash
LAZYGIT_CONFIG_DIR="$(lazygit -cd)"
mkdir -p "$LAZYGIT_CONFIG_DIR"
ln -sfn ~/dotfiles/lazygit/config.yml "$LAZYGIT_CONFIG_DIR/config.yml"
```

すでに `config.yml` がある場合は、上書きする前にバックアップする。

```bash
LAZYGIT_CONFIG_DIR="$(lazygit -cd)"
cp "$LAZYGIT_CONFIG_DIR/config.yml" "$LAZYGIT_CONFIG_DIR/config.yml.bak"
```

既存設定を残したい場合は、`customCommands` の項目だけを手元の config に追記する。

## 5. commitlint.config.js を配置

`czg` は `~/commitlint.config.js` を読み込んでプロンプトやコミット種別を決める。この dotfiles では `commitlint.config.js` を管理しているので、ホームディレクトリに symlink する。

```bash
ln -sfn ~/dotfiles/commitlint.config.js ~/commitlint.config.js
```

## 6. `Cannot find module 'cz-git'` 対策

`czg` が `commitlint.config.js` を読み込むときに、グローバルインストールした `cz-git` を見つけられず次のエラーになることがある。

```text
Cannot find module 'cz-git'
```

その場合は、`commitlint.config.js` から辿れる `~/node_modules/cz-git` をグローバル実体への symlink として用意する。

```bash
mkdir -p ~/node_modules
ln -sfn "$(npm root -g)/cz-git" ~/node_modules/cz-git
```

詳しい原因は [`commit.md`](./commit.md) の「ハマりどころ」を参照。

## 7. 使い方

1. Neovim で `:LazyGit` を実行するか、`<leader>gg` を押す。
2. files view でコミットしたいファイルを `space`（個別）または `a`（全部）でステージする。
3. `c` キーを押す。
4. `czg emoji` の対話プロンプトで種別と説明を入力する。

プロンプトを完了すると、絵文字付きの Conventional Commits 形式でコミットが作成される。

> **注意**: `c` を `czg emoji` で上書きしているため、通常の lazygit と違い「ステージ済みの変更がありません」という親切な警告は出ない。未ステージの状態で `c` を押すと、czg 側から次のように表示される。
>
> ```text
> >>> No files added to staging! Did you forget to run `git add` ?
> ```
>
> これは設定の不具合ではなく、ステージし忘れているだけなので、先にステージすること。

## 拡張（任意）

AI 生成（`czg ai`）を使いたい場合は、別キー（例: `C`）に同様の要領で追加する。

```yaml
  - key: 'C'
    context: 'files'
    description: 'cz-git (czg ai) でAIコミットメッセージを生成'
    command: 'czg ai'
    output: terminal
```

ただし AI 生成には API トークン設定が別途必要。トークンを含む設定ファイルは dotfiles に含めないこと。

## 動作確認

```bash
czg --version
nvim --headless "+Lazy! sync" +qa
```

Neovim で `:LazyGit` または `<leader>gg` から lazygit が開き、files view で `c` キーを押して `czg emoji` のプロンプトが表示されればセットアップ完了。
