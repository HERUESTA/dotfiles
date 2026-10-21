return {
  {
    "akinsho/toggleterm.nvim",
    version = "*",
    cmd = { "ToggleTerm", "TermExec" },
    opts = {
      -- <C-\> でターミナルを開閉（<C-/> は keys 側で定義）
      open_mapping = [[<C-\>]],
      direction = "float",
      shade_terminals = true,
      start_in_insert = true,
      persist_size = true,
      close_on_exit = true,
      size = function(term)
        if term.direction == "horizontal" then
          return 15
        elseif term.direction == "vertical" then
          return math.floor(vim.o.columns * 0.4)
        end
      end,
      float_opts = {
        border = "curved",
        width = function()
          return math.floor(vim.o.columns * 0.9)
        end,
        height = function()
          return math.floor(vim.o.lines * 0.9)
        end,
      },
    },
    config = function(_, opts)
      require("toggleterm").setup(opts)

      -- toggleterm のバッファだけに、ノーマルモード復帰とウィンドウ移動を割り当てる
      -- （<C-\> をトグルに使うため、標準の <C-\><C-n> が効かなくなる対策）
      vim.api.nvim_create_autocmd("TermOpen", {
        pattern = "term://*toggleterm#*",
        callback = function(ev)
          local map = function(lhs, rhs, desc)
            vim.keymap.set("t", lhs, rhs, { buffer = ev.buf, desc = desc })
          end
          map("<Esc><Esc>", [[<C-\><C-n>]], "ノーマルモードへ")
          map("<C-h>", [[<C-\><C-n><C-w>h]], "左のウィンドウへ")
          map("<C-j>", [[<C-\><C-n><C-w>j]], "下のウィンドウへ")
          map("<C-k>", [[<C-\><C-n><C-w>k]], "上のウィンドウへ")
          map("<C-l>", [[<C-\><C-n><C-w>l]], "右のウィンドウへ")
        end,
      })
    end,
    keys = {
      { [[<C-\>]], desc = "ターミナルを切り替え" },
      -- LazyVim標準の <C-/>（Snacks terminal）を toggleterm に置き換える
      -- 端末によっては <C-/> が <C-_> として届くため両方定義する
      { "<C-/>", [[<Cmd>execute v:count . "ToggleTerm"<CR>]], mode = { "n", "t" }, desc = "ターミナルを切り替え" },
      { "<C-_>", [[<Cmd>execute v:count . "ToggleTerm"<CR>]], mode = { "n", "t" }, desc = "which_key_ignore" },
      -- <leader>t は test.core extra と共有（tf/th/tv は未使用）
      { "<leader>tf", "<cmd>ToggleTerm direction=float<cr>", desc = "フロートでターミナルを開く" },
      { "<leader>th", "<cmd>ToggleTerm direction=horizontal<cr>", desc = "下にターミナルを開く" },
      { "<leader>tv", "<cmd>ToggleTerm direction=vertical<cr>", desc = "右にターミナルを開く" },
    },
  },
}
