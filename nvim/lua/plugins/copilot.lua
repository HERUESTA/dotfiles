return {
  {
    "zbirenbaum/copilot.lua",
    cmd = "Copilot",
    event = "InsertEnter",
    opts = {
      suggestion = {
        enabled = true,
        auto_trigger = true,
        keymap = {
          accept = "<Tab>",
          dismiss = "<C-]>",
        },
      },
      panel = { enabled = false },
    },
  },
  {
    "CopilotC-Nvim/CopilotChat.nvim",
    dependencies = {
      { "zbirenbaum/copilot.lua" },
      { "nvim-lua/plenary.nvim" },
    },
    opts = {
      window = {
        layout = "vertical",
        width = 0.4,
      },
    },
    keys = {
      {
        "<leader>ac",
        function()
          require("CopilotChat").open()
        end,
        mode = { "n", "v" },
        desc = "Copilot Chatを開く",
      },
      {
        "<leader>ar",
        function()
          require("CopilotChat").reset()
        end,
        desc = "Copilot Chatをリセット",
      },
    },
  },
}
