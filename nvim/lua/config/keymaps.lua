vim.keymap.set("i", "jk", "<Esc>")

-- ビジュアルモードで <C-y>: 選択範囲を「リポジトリ相対パス L開始~L終了」でクリップボードにコピー
vim.keymap.set("x", "<C-y>", function()
  local start_line = vim.fn.line("v")
  local end_line = vim.fn.line(".")
  if start_line > end_line then
    start_line, end_line = end_line, start_line
  end

  -- ファイルパスを .git ルートからの相対に（見つからなければ cwd 相対にフォールバック）
  local abs = vim.fn.expand("%:p")
  local root = vim.fs.root(abs, ".git")
  local path = (root and abs:sub(#root + 2)) or vim.fn.expand("%:.")

  local header = string.format("%s L%d~L%d", path, start_line, end_line)

  vim.fn.setreg("+", header)
  -- ビジュアルモードを抜ける
  vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes("<Esc>", true, false, true), "n", false)
  vim.notify("コピーしました: " .. header)
end, { desc = "選択範囲をパス付きでコピー" })
