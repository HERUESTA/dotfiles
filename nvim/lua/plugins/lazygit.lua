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
