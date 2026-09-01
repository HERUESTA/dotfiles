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
  {
    "nvim-neotest/neotest",
    -- test.core extraを外した時に設定だけ残ってもエラーにならないようにする
    optional = true,
    dependencies = { "olimorris/neotest-rspec" },
    opts = {
      adapters = {
        -- キーはモジュール名。test.coreのconfigがこれをrequireしてsetupまで面倒を見る
        ["neotest-rspec"] = {
          rspec_cmd = function()
            -- 開いているバッファ基準でプロジェクトルートを引く。
            -- getcwd()だとサブディレクトリからnvimを起動した時に外す
            local buf = vim.api.nvim_buf_get_name(0)
            local root = vim.fs.root(buf ~= "" and buf or vim.uv.cwd(), { "Gemfile", ".rspec", ".git" })

            -- bin/rspecのbinstubがあれば優先する。spring/bootsnapが効いて起動が速い
            if root then
              local binstub = root .. "/bin/rspec"
              if vim.uv.fs_stat(binstub) then return { binstub } end
            end

            -- neotest-rspecの既定はシステム側のrspec gemを叩くため、
            -- Gemfileで固定したバージョンとズレる。bundler経由に矯正する
            return { "bundle", "exec", "rspec" }
          end,
        },
      },
    },
  },
}
