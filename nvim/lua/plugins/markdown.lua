return {
  {
    "bullets-vim/bullets.vim",
    ft = { "markdown", "text", "gitcommit" },
    init = function()
      vim.g.bullets_enabled_file_types = { "markdown", "text", "gitcommit" }
      vim.g.bullets_outline_levels = { "ROM", "ABC", "num", "abc", "rom", "std-" }
    end,
  },
  {
    "MeanderingProgrammer/render-markdown.nvim",
    opts = {
      enabled = false,
    },
    keys = {
      { "<leader>um", "<cmd>RenderMarkdown toggle<cr>", desc = "Toggle Markdown Render" },
    },
  },
  {
    "iamcco/markdown-preview.nvim",
    cmd = { "MarkdownPreview", "MarkdownPreviewStop", "MarkdownPreviewToggle" },
    ft = { "markdown" },
    build = "cd app && yarn install",
    keys = {
      { "<leader>mp", "<cmd>MarkdownPreviewToggle<cr>", desc = "Toggle Markdown Preview (browser)" },
    },
  },
}

