return {
  {
    "s1n7ax/nvim-window-picker",
    version = "2.*",
    config = function()
      require("window-picker").setup({
        filter_rules = {
          include_current_win = false,
          autoselect_one = true,
          -- filter using buffer options
          bo = {
            -- if the file type is one of following, the window will be ignored
            filetype = { "neo-tree", "neo-tree-popup", "notify" },
            -- if the buffer type is one of following, the window will be ignored
            buftype = { "terminal", "quickfix" },
          },
        },
      })
    end,
  },
  {
    "nvim-neo-tree/neo-tree.nvim",
    branch = "v3.x",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "MunifTanjim/nui.nvim",
      "nvim-tree/nvim-web-devicons", -- optional, but recommended
    },
    lazy = false, -- neo-tree will lazily load itself
    keys = {
      { mode = "n", "<leader>t", "<cmd>Neotree toggle<CR>", {} },
      { mode = "n", "<C-m>", "<cmd>Neotree reveal<CR>", {} },
      { mode = "n", "<leader>b", "<cmd>Neotree float buffers<CR>", {} },
    },
    opts = {
      filesystem = {
        follow_current_file = true, -- カレントのファイルを自動選択
        filtered_items = {
          visible = true,
          hide_dotfiles = false,
          hide_gitignored = false,
        },
        window = {
          mappings = {
            ["<leader>."] = "navigate_up",
          },
        },
      },
      window = {
        position = "left", -- ツリーの表示位置
        width = 30,
      },
    },
  },
}
