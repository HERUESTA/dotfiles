# 新しいPCで dotfiles を pull した後にやること

## 1. lazygit CLI をインストール

```bash
brew install lazygit
```

## 2. czg / cz-git をグローバルインストール

```bash
npm install -g czg cz-git
```

## 3. lazygit の config をリンク

```bash
LAZYGIT_CONFIG_DIR="$(lazygit -cd)"
cp "$LAZYGIT_CONFIG_DIR/config.yml" "$LAZYGIT_CONFIG_DIR/config.yml.bak"
```

既存の config がある場合は、先にバックアップする。ない場合は次のリンク手順へ進む。

```bash
LAZYGIT_CONFIG_DIR="$(lazygit -cd)"
mkdir -p "$LAZYGIT_CONFIG_DIR"
ln -sfn ~/dotfiles/lazygit/config.yml "$LAZYGIT_CONFIG_DIR/config.yml"
```

## 4. commitlint.config.js をリンク

```bash
ln -sfn ~/dotfiles/commitlint.config.js ~/commitlint.config.js
```

## 5. cz-git の module 解決用リンクを作成

```bash
mkdir -p ~/node_modules
ln -sfn "$(npm root -g)/cz-git" ~/node_modules/cz-git
```

## 6. Neovim plugin を同期

```bash
:Lazy sync
```

## 7. 動作確認

```bash
czg --version
nvim
```

Neovim で `:LazyGit` または `<leader>gg` を実行し、lazygit の files view で `c` キーを押して `czg emoji` が起動すれば完了。
