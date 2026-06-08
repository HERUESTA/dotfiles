# lazygit + cz-git でコミットメッセージを生成する

lazygit から [cz-git](https://cz-git.qbb.sh/)（`czg`）を呼び出し、対話式にコミットメッセージを生成できるようにする設定。

参考: https://zenn.dev/mozumasu/articles/mozumasu-cz-git

## 前提

- `czg` / `cz-git` がグローバルインストール済みであること
  ```bash
  npm install -g czg cz-git
  ```
- `NODE_PATH` でグローバル npm モジュールのパスを通しておくこと（後述のトラブルシューティング参照）
  ```bash
  export NODE_PATH="$(npm root -g)"
  ```
  → `dotfiles/.zshrc` に追加済み

## 手順

### 1. lazygit 用の設定ファイルを dotfiles 内に作成

`dotfiles/lazygit/config.yml` に `customCommands` を定義し、Files パネルの `c` キー（lazygit デフォルトのコミット操作を上書き）に `czg emoji` をサブプロセスとして割り当てる。

```yaml
customCommands:
  - key: 'c'
    context: 'files'
    description: 'cz-git (czg) でコミットメッセージを生成'
    command: 'czg emoji'
    subprocess: true
```

- `czg emoji`: cz-git の対話式プロンプト（type 選択 → 絵文字付与 → scope/説明入力）を絵文字付きメッセージ生成モードで起動する
- `subprocess: true`: lazygit がターミナルを cz-git の対話プロンプトに明け渡す

### 2. シンボリックリンクを作成

lazygit の設定ファイルの参照先は `~/.config/lazygit/config.yml` ではなく、`XDG_CONFIG_HOME` が未設定の macOS では **`~/Library/Application Support/lazygit/config.yml`**（`lazygit -cd` で配置先ディレクトリを確認できる）。

このディレクトリには lazygit が自動生成する実行時ファイル `state.yml` も同居しているため、ディレクトリ全体ではなく `config.yml` ファイル単体をリンクする。

```bash
ln -s ~/dotfiles/lazygit/config.yml "$HOME/Library/Application Support/lazygit/config.yml"
```

## 使い方

1. lazygit を開き、Files パネルで **コミットしたいファイルを `space`（個別）または `a`（全部）でステージする**（緑色になればOK）
2. `c` キーを押す
3. `czg emoji` の対話プロンプトが起動するので、type / 絵文字 / 説明を選択・入力する
4. 生成されたメッセージでそのままコミットされる

> **注意**: `c` を `czg emoji` で上書きしているため、通常の lazygit と違い「ステージ済みの変更がありません」という親切な警告は出ない。未ステージの状態で `c` を押すと、czg 側から
> `>>> No files added to staging! Did you forget to run \`git add\` ?`
> と表示される。これは設定の不具合ではなく、ステージし忘れているだけなので、`space`/`a` で先にステージすること。

## 拡張（任意）

AI 生成（`czg ai`）を使いたい場合は、別キー（例: `C`）に同様の要領で追加する。

```yaml
  - key: 'C'
    context: 'files'
    description: 'cz-git (czg ai) でAIコミットメッセージを生成'
    command: 'czg ai'
    subprocess: true
```

ただし AI 生成には `~/.config/.czrc` への API トークン設定が別途必要（GitHub Models など）。トークンを含むため `.czrc` は `.gitignore` で必ず除外すること。
