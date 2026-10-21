return {
  {
    "sindrets/diffview.nvim",
    cmd = {
      "DiffviewOpen",
      "DiffviewClose",
      "DiffviewToggleFiles",
      "DiffviewFocusFiles",
      "DiffviewRefresh",
      "DiffviewFileHistory",
    },
    opts = function()
      local actions = require("diffview.actions")
      -- 各ビューで q を押すと Diffview を閉じる
      local close = { "n", "q", actions.close, { desc = "Diffviewを閉じる" } }
      local close_all = { "n", "q", "<cmd>DiffviewClose<CR>", { desc = "Diffviewを閉じる" } }
      return {
        enhanced_diff_hl = true,
        view = {
          merge_tool = {
            layout = "diff3_mixed",
          },
        },
        keymaps = {
          view = { close_all },
          file_panel = { close_all },
          file_history_panel = { close_all },
          option_panel = { close },
        },
      }
    end,
    keys = {
      -- <leader>gd/gD/gs/gl などは LazyVim 標準（Snacks picker）が使っているため gv/gV を使う
      {
        "<leader>gv",
        function()
          if next(require("diffview.lib").views) == nil then
            vim.cmd("DiffviewOpen")
          else
            vim.cmd("DiffviewClose")
          end
        end,
        desc = "Diffviewを切り替え",
      },
      {
        "<leader>gV",
        "<cmd>DiffviewFileHistory %<CR>",
        desc = "現在のファイルの履歴をDiffviewで開く",
      },
      {
        "<leader>gV",
        ":DiffviewFileHistory<CR>",
        mode = "v",
        desc = "選択範囲の履歴をDiffviewで開く",
      },
    },
  },
}
