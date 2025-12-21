return {
  {
    "vim-test/vim-test",
    keys = {
      { "<leader>t", "<cmd>TestNearest<cr>", desc = "Test Nearest" },
      { "<leader>T", "<cmd>TestFile<cr>", desc = "Test File" },
      { "<leader>a", "<cmd>TestSuite<cr>", desc = "Test Suite" },
      { "<leader>l", "<cmd>TestLast<cr>", desc = "Test Last" },
      { "<leader>g", "<cmd>TestVisit<cr>", desc = "Test Visit" },
    },
    config = function()
      vim.cmd("let test#strategy = 'neovim'")  -- Neovim内のターミナルで実行
    end,
  },
}