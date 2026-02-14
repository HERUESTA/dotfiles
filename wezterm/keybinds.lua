local wezterm = require 'wezterm'
local act = wezterm.action

return {
  keys = {
    -- Ctrl+Shift+tで新しいタブを作成
    {
      key = 't',
      mods = 'SHIFT|CTRL',
      action = act.SpawnTab 'CurrentPaneDomain',
    },
    -- Cmd+Shift+wでタブを閉じる
    {
      key = 'w',
      mods = 'CMD|SHIFT',
      action = act.CloseCurrentTab { confirm = true },
    },
    -- Cmd+dで新しいペインを作成(画面を分割)
    {
      key = 'd',
      mods = 'CMD',
      action = act.SplitHorizontal { domain = 'CurrentPaneDomain' },
    },
    -- Cmd+[ で前のペインに移動
    {
      key = '[',
      mods = 'CMD',
      action = act.ActivatePaneDirection 'Prev',
    },
    -- Cmd+] で次のペインに移動
    {
      key = ']',
      mods = 'CMD',
      action = act.ActivatePaneDirection 'Next',
    },
    -- Cmd+wでペインを閉じる
    {
      key = 'w',
      mods = 'CMD',
      action = act.CloseCurrentPane { confirm = true },
    },
    -- Shift+Enterで改行
    {
      key = 'Enter',
      mods = 'SHIFT',
      action = act.SendKey { key = '\n' },
    },
    -- Cmd+LeftArrowでホームキー
    {
      key = 'LeftArrow',
      mods = 'SUPER',
      action = wezterm.action.SendKey { key = 'Home' },
    },
    -- Cmd+RightArrowでエンドキー
    {
      key = 'RightArrow',
      mods = 'SUPER',
      action = wezterm.action.SendKey { key = 'End' },
    },
  },
  key_tables = {},
}