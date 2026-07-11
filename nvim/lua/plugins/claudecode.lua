return {
  "coder/claudecode.nvim",
  lazy = false,
  dependencies = {
    "nvim-lua/plenary.nvim",
    "folke/snacks.nvim",
  },
  config = function()
    require("claudecode").setup({})

    -- Ctrl + h でターミナル(Claude)から左のエディタへ戻る
    vim.keymap.set("t", "<C-h>", [[<C-\><C-n><C-w>h]], { desc = "左のウィンドウへ" })
  end,
  keys = {
    { "<leader>ac", "<cmd>ClaudeCode<cr>", desc = "Claude Codeを切り替え" },
    { "<leader>af", "<cmd>ClaudeCodeFocus<cr>", desc = "Claudeにフォーカス" },
    { "<leader>ar", "<cmd>ClaudeCode --resume<cr>", desc = "セッションを再開" },
    { "<leader>as", "<cmd>ClaudeCodeSend<cr>", desc = "選択範囲を送信", mode = "v" },
  },
}
