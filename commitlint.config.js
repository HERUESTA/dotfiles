const { defineConfig } = require("cz-git");

const types = [
  { value: "feat", name: "feat: ✨ 新機能", emoji: ":sparkles:" },
  { value: "fix", name: "fix: 🐛 バグ修正", emoji: ":bug:" },
  { value: "docs", name: "docs: 📝 ドキュメントのみの変更", emoji: ":memo:" },
  { value: "style", name: "style: 💄 コードの意味に影響しない変更", emoji: ":lipstick:" },
  { value: "refactor", name: "refactor: ♻️ バグ修正でも機能追加でもない変更", emoji: ":recycle:" },
  { value: "perf", name: "perf: ⚡️ パフォーマンス改善", emoji: ":zap:" },
  { value: "test", name: "test: ✅ テストの追加・修正", emoji: ":white_check_mark:" },
  { value: "build", name: "build: 📦 ビルドや依存関係の変更", emoji: ":package:" },
  { value: "ci", name: "ci: 👷 CI 設定の変更", emoji: ":construction_worker:" },
  { value: "chore", name: "chore: 🔧 その他の変更", emoji: ":wrench:" },
  { value: "revert", name: "revert: ⏪️ 変更の取り消し", emoji: ":rewind:" },
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
    skipQuestions: ["scope", "body", "breaking", "footerPrefix"],
  },
});
