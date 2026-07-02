const { defineConfig } = require("cz-git");

const types = [
{ value: "feat", name: "feat: ✨ 新機能の追加", emoji: "✨" },
{ value: "fix", name: "fix: 🐛 バグ修正（通常の不具合。機能に問題がある）", emoji: "🐛" },
{ value: "refactor", name: "refactor: ♻️ リファクタリング", emoji: "♻️" },
{ value: "performance", name: "performance: ⚡ パフォーマンス改善", emoji: "⚡" },
{ value: "docs", name: "docs: 📝 ドキュメントの追加/更新", emoji: "📝" },
{ value: "style", name: "style: 🎨 コードの構造・フォーマット改善", emoji: "🎨" },
{ value: "test", name: "test: ✅ テストの追加・修正", emoji: "✅" },
{ value: "ci", name: "ci: 💚 CIビルドの修正", emoji: "💚" },
{ value: "build", name: "build: ➕ 依存関係の追加/更新", emoji: "➕" },
{ value: "chore", name: "chore: 🔧 設定ファイルの追加/更新", emoji: "🔧" },
{ value: "migration", name: "migration: 🗃️ DBスキーマ/マイグレーションの追加", emoji: "🗃️"},
{ value: "remove", name: "remove: 🔥 コードやファイルの削除"},
{ value: "revert", name: "revert: ⏪ 変更の取り消し", emoji: "⏪" },
];

module.exports = defineConfig({
  rules: {
    "type-enum": [2, "always", types.map(({ value }) => value)],
    "subject-empty": [2, "never"],
    "subject-case": [0],
  },
  prompt: {
    useEmoji: true,
    emojiAlign: "center",
    allowCustomScopes: true,
    allowEmptyScopes: true,
    customScopesAlign: "bottom",
    customScopesAlias: "custom",
    emptyScopesAlias: "empty",
    types,
    messages: {
      type: "変更の種類を選んでください:",
      scope: "変更範囲を入力してください（任意）:",
      subject: "変更内容を短く入力してください:",
      body: "詳細を入力してください（任意）:",
      breaking: "破壊的変更があれば入力してください（任意）:",
      footerPrefixsSelect: "Issue 紐付けの種類を選んでください（任意）:",
      customFooterPrefixs: "Issue 紐付けの接頭辞を入力してください:",
      footer: "Issue 番号などを入力してください:",
      confirmCommit: "この内容でコミットしますか?",
    },
    skipQuestions: ["scope", "body", "breaking", "footerPrefix", "footer"],
  },
});
