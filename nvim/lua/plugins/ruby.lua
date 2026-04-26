return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        ruby_lsp = {
          -- MasonではなくPATH上のruby-lspを使う
          -- rbenv/rvmのshimが効くため、カレントRubyバージョンに自動追従する
          mason = false,
          cmd = { "ruby-lsp" },
        },
      },
    },
  },
}
