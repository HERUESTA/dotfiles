# ターミナルで cz-git (czg) を使ってコミットメッセージを生成する

lazygit を介さず、ターミナルから直接 `czg` を実行して対話形式で Conventional Commits 形式のコミットメッセージを生成するためのセットアップ。

> lazygit から使いたい場合は [`lazy-git.md`](./lazy-git.md) を参照。

## 1. グローバルインストール

```bash
npm install -g czg cz-git
```

## 2. NODE_PATH を通す

`czg`（CommonJS）がグローバルにインストールした `cz-git` を `require` で解決できるように、グローバル npm モジュールのパスを `NODE_PATH` に設定しておく。

```bash
export NODE_PATH="$(npm root -g)"
```

→ `dotfiles/.zshrc` に追加済み

## 3. commitlint.config.js を作成

`~/commitlint.config.js` に `cz-git` の `defineConfig` を使い、コミット種別一覧・絵文字・プロンプトの文言などを定義する。

参考:
- https://cz-git.qbb.sh/
- https://zenn.dev/mozumasu/articles/mozumasu-cz-git

## 4. ハマりどころ: `Cannot find module 'cz-git'`

`NODE_PATH` を設定していても、`czg` 実行時に次のエラーが出ることがある。

```
Cannot find module 'cz-git'
Require stack:
- /Users/xxx/commitlint.config.js
- /opt/homebrew/lib/node_modules/czg/lib/main.js
- /opt/homebrew/lib/node_modules/czg/bin/index.js
```

**原因**: `czg` は `commitlint.config.js` を読み込む際に動的 `import()`（ESM）を使っており、ESM のモジュール解決は `NODE_PATH` を一切参照しない。`import()` は読み込んだファイルの場所から上の階層に向かって `node_modules` を探すだけなので、グローバル領域（`npm root -g`）にしか `cz-git` が無いと解決できない。

### 対処: シンボリックリンクを作成

`commitlint.config.js` から辿れる場所（ホームディレクトリ直下）に `node_modules/cz-git` を、グローバル実体へのシンボリックリンクとして用意する。

```bash
mkdir -p ~/node_modules
ln -s "$(npm root -g)/cz-git" ~/node_modules/cz-git
```

これで `import('cz-git')` が解決できるようになり、`czg` が正常に動作する。

## 5. 質問数を減らす（任意）

`commitlint.config.js` の `prompt.skipQuestions` で、不要な質問をスキップできる。

```js
skipQuestions: ["scope", "body", "breaking", "footerPrefix"],
```

| 値 | スキップされる質問 |
|---|---|
| `scope` | 変更の範囲（任意指定） |
| `body` | 長めの説明文（本文） |
| `breaking` | 破壊的変更の説明 |
| `footerPrefix` | Issue 紐付け（連動して `footer` 質問もスキップされる） |
| `confirmCommit` | 最終確認（生成内容のプレビュー & Yes/No） |

> `confirmCommit` は誤った内容のままコミットしてしまうのを防ぐ安全網になるので、残しておくのがおすすめ。

## 使い方

```bash
git add .     # コミットしたい変更をステージ
czg           # 通常モード（対話形式でコミットメッセージを生成）
czg emoji     # 絵文字付きモード
```

対話プロンプトで種別と説明を入力すると、Conventional Commits 形式のメッセージでそのままコミットされる。
