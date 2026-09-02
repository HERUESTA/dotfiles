-- jestを起動するディレクトリを引く。
-- マーカーはpackage.json単体にする。vim.fs.rootはマーカーをリスト順に試し、
-- 各マーカーで根まで遡るため、jest.config.*を先に置くとモノレポで
-- リポジトリ直下のjest.config.*に吸われ、パッケージ単位の解決を外す
local function project_root(file)
  -- neotest-jestのREADMEはcwdの型をfun(): stringと書いているが、
  -- モノレポの例ではfun(file)で渡している。どちらでも落ちないよう防御する
  local from = (file and file ~= "") and file or vim.uv.cwd()
  return vim.fs.root(from, { "package.json" }) or vim.uv.cwd()
end

-- 実行するjestバイナリを探す。
-- npm/yarnのworkspacesはnode_modulesをリポジトリ直下に巻き上げるため、
-- パッケージ直下だけを見ると外す。rootから上へ遡って最初に見つけたものを使う
local function jest_bin(root)
  local dir = root
  while dir do
    local bin = dir .. "/node_modules/.bin/jest"
    if vim.uv.fs_stat(bin) then
      return bin
    end

    local parent = vim.fs.dirname(dir)
    if parent == dir then
      return nil
    end
    dir = parent
  end
end

return {
  {
    "nvim-neotest/neotest",
    -- test.core extraを外した時に設定だけ残ってもエラーにならないようにする
    optional = true,
    dependencies = { "nvim-neotest/neotest-jest" },
    opts = {
      adapters = {
        -- キーはモジュール名。test.coreのconfigがこれをrequireしてsetupまで面倒を見る
        ["neotest-jest"] = {
          -- it.each / test.eachを1ケースずつ拾う
          jest_test_discovery = true,

          -- jestはrootDir / moduleNameMapper / setupFilesAfterEnvを
          -- すべてcwd起点で解決する。discoveryはtreesitterが構文から拾うので
          -- cwdを外しても一覧には出てしまい、実行時だけ壊れる
          cwd = function(file)
            return project_root(file)
          end,

          -- ローカルのjestを最優先する。package.jsonが固定したバージョンから
          -- 外れないようにする狙いで、rspecをbundle exec経由に矯正したのと同じ
          jestCommand = function(file)
            return jest_bin(project_root(file)) or "npx jest"
          end,
        },
      },
    },
  },
}
